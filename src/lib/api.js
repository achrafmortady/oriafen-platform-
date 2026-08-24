import { supabase, isConfigured } from './supabase'
import {
  DOSSIER_STEPS,
  DOCUMENTS_CHECKLIST,
  FORMATION_UNITS,
  DEMO_DOCS_BY_CATEGORY,
} from '../data/mockData'

// ── Helpers ───────────────────────────────────────────────────

function applyUnlockLogic(units) {
  return units.map((unit, idx) => {
    if (idx === 0) return { ...unit, status: unit.status === 'locked' ? 'in_progress' : unit.status }
    const prev = units[idx - 1]
    if (unit.status === 'locked' && prev.status !== 'completed') return unit
    if (unit.status === 'locked' && prev.status === 'completed') return { ...unit, status: 'in_progress' }
    return unit
  })
}

// Normalise raw DB status to UI status
function normDocStatus(raw) {
  switch (raw) {
    case 'valide':              return 'valid'
    case 'manquant':            return 'missing'
    case 'correction_demandee': return 'correction'
    default:                    return 'pending'  // en_attente or unknown
  }
}

// Client-side AI-like file validation
function validateFileFormat(file) {
  const validMime = [
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  ]
  const validExt = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif']
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()

  if (!validMime.includes(file.type) && !validExt.includes(ext)) {
    return {
      valid: false,
      message: 'Format incorrect, veuillez envoyer un PDF ou une image (PDF, JPG, PNG)',
    }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, message: 'Fichier trop volumineux (maximum 10 Mo)' }
  }
  return { valid: true }
}

// In-memory demo document store (mutated in demo mode)
const _demoDocs = (() => {
  const m = new Map()
  Object.entries(DEMO_DOCS_BY_CATEGORY).forEach(([k, v]) => m.set(k, { ...v }))
  return m
})()

// ── Dossier ───────────────────────────────────────────────────

export async function createDossierIfNeeded(userId) {
  if (!isConfigured) return { id: 'demo', dossier_number: 'OR-2026-0001', current_step: 4, status: 'En cours' }
  try {
    const { data: existing } = await supabase
      .from('dossiers').select('*').eq('user_id', userId).single()
    if (existing) return existing

    const dossierNumber = `OR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    const { data, error } = await supabase
      .from('dossiers')
      .insert({ user_id: userId, dossier_number: dossierNumber, current_step: 1, status: 'En cours' })
      .select().single()
    if (error) throw error
    return data
  } catch (err) {
    console.warn('[api] createDossierIfNeeded error:', err?.message)
    return { id: 'demo', dossier_number: 'OR-2026-0001', current_step: 4, status: 'En cours' }
  }
}

export async function fetchDossier(userId) {
  if (!isConfigured) {
    return {
      steps: DOSSIER_STEPS,
      dossierNumber: 'OR-2026-0001',
      status: 'En cours',
      currentStep: 4,
      dossierId: 'demo',
    }
  }
  try {
    const { data: dossier } = await supabase
      .from('dossiers').select('*').eq('user_id', userId).single()

    const STEP_LABELS = [
      'Consultation initiale', 'Montage dossier', 'Structure juridique',
      'Soumission ORIAS', 'Obtention ORIAS', 'Lancement activité',
    ]
    const currentStep = dossier?.current_step ?? 4
    const steps = STEP_LABELS.map((label, i) => ({
      id: i + 1, label,
      status: i + 1 < currentStep ? 'done' : i + 1 === currentStep ? 'current' : 'locked',
    }))

    return {
      steps,
      dossierNumber: dossier?.dossier_number ?? 'OR-2026-0001',
      status: dossier?.status ?? 'En cours',
      currentStep,
      dossierId: dossier?.id ?? null,
    }
  } catch (err) {
    console.warn('[api] fetchDossier error:', err?.message)
    return { steps: DOSSIER_STEPS, dossierNumber: 'OR-2026-0001', status: 'En cours', currentStep: 4, dossierId: null }
  }
}

export async function updateDossierStep(dossierId, step) {
  if (!isConfigured || dossierId === 'demo') return { success: true }
  try {
    const { error } = await supabase.from('dossiers').update({ current_step: step }).eq('id', dossierId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// ── Documents — student upload flow ──────────────────────────

/**
 * Upload a file for a specific document category.
 * 1. Validates format client-side (AI-like check).
 * 2. Uploads to Supabase Storage bucket "documents".
 * 3. Upserts a row in the documents table.
 * Returns { success, doc, autoRejected, message, error }
 */
export async function uploadDocumentFile(userId, categoryId, categoryLabel, file) {
  // Step 1 — format validation
  const validation = validateFileFormat(file)
  if (!validation.valid) {
    return { success: false, autoRejected: true, message: validation.message }
  }

  // Demo mode
  if (!isConfigured) {
    const doc = {
      id: `demo-${categoryId}`,
      status: 'pending',
      fileName: file.name,
      fileUrl: null,
      rejectionReason: null,
    }
    _demoDocs.set(categoryId, doc)
    return { success: true, doc }
  }

  try {
    // Step 2 — storage upload
    const ext  = (file.name.split('.').pop() || 'bin').toLowerCase()
    const path = `${userId}/${categoryId}/${Date.now()}.${ext}`

    const { error: storageErr } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: true })
    if (storageErr) throw storageErr

    // Step 3 — generate a signed URL (valid 1 year)
    const { data: { signedUrl } } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 365 * 24 * 3600)

    // Step 4 — upsert DB record (one row per user+category)
    const { data, error } = await supabase
      .from('documents')
      .upsert(
        {
          user_id:          userId,
          category:         categoryId,
          name:             categoryLabel,
          file_url:         signedUrl ?? path,
          file_name:        file.name,
          status:           'en_attente',
          rejection_reason: null,
          uploaded_at:      new Date().toISOString(),
        },
        { onConflict: 'user_id,category' }
      )
      .select()
      .single()
    if (error) throw error

    return {
      success: true,
      doc: {
        id: data.id,
        status: 'pending',
        fileName: data.file_name,
        fileUrl: data.file_url,
        rejectionReason: null,
      },
    }
  } catch (err) {
    console.warn('[api] uploadDocumentFile error:', err?.message)
    return { success: false, error: err?.message }
  }
}

/**
 * Fetch documents keyed by category for the logged-in student.
 * Returns { [categoryId]: { id, status, fileName, fileUrl, rejectionReason } }
 */
export async function fetchDocumentsByCategory(userId) {
  if (!isConfigured) {
    return Object.fromEntries(_demoDocs)
  }
  try {
    const { data } = await supabase
      .from('documents')
      .select('id, category, file_url, file_name, status, rejection_reason, uploaded_at')
      .eq('user_id', userId)

    const map = {}
    ;(data || []).forEach(d => {
      if (!d.category) return
      map[d.category] = {
        id:              d.id,
        status:          normDocStatus(d.status),
        fileName:        d.file_name,
        fileUrl:         d.file_url,
        rejectionReason: d.rejection_reason,
        uploadedAt:      d.uploaded_at,
      }
    })
    return map
  } catch (err) {
    console.warn('[api] fetchDocumentsByCategory error:', err?.message)
    return Object.fromEntries(_demoDocs)
  }
}

/**
 * Subscribe to real-time document changes for a student.
 * Returns an unsubscribe function.
 */
export function subscribeToDocuments(userId, callback) {
  if (!isConfigured) return () => {}
  const channel = supabase
    .channel(`docs-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${userId}` },
      payload => {
        const d = payload.new ?? payload.old ?? {}
        callback({
          id:              d.id,
          category:        d.category,
          status:          normDocStatus(d.status),
          fileName:        d.file_name,
          fileUrl:         d.file_url,
          rejectionReason: d.rejection_reason,
          event:           payload.eventType,
        })
      }
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ── Documents — admin management flow ────────────────────────

/**
 * Fetch full document details for an admin viewing a specific student.
 * Includes file_url so admin can view/download.
 */
export async function fetchClientDocumentsWithDetails(userId) {
  if (!isConfigured) {
    const { REQUIRED_DOCUMENTS } = await import('../data/mockData')
    return Array.from(_demoDocs.entries()).map(([cat, doc]) => ({
      ...doc,
      category: cat,
      label:    REQUIRED_DOCUMENTS.find(r => r.id === cat)?.label ?? cat,
    }))
  }
  try {
    const { data } = await supabase
      .from('documents')
      .select('id, category, name, file_url, file_name, status, rejection_reason, uploaded_at')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })

    return (data || []).map(d => ({
      id:              d.id,
      category:        d.category,
      label:           d.name,
      status:          normDocStatus(d.status),
      fileName:        d.file_name,
      fileUrl:         d.file_url,
      rejectionReason: d.rejection_reason,
      uploadedAt:      d.uploaded_at,
    }))
  } catch (err) {
    console.warn('[api] fetchClientDocumentsWithDetails error:', err?.message)
    return []
  }
}

/**
 * Update a document's status with an optional reason (for reject / request correction).
 */
export async function updateDocumentStatusWithReason(docId, status, reason = null) {
  if (!isConfigured) {
    for (const [cat, doc] of _demoDocs) {
      if (doc.id === docId) {
        _demoDocs.set(cat, { ...doc, status: normDocStatus(status), rejectionReason: reason })
        break
      }
    }
    return { success: true }
  }
  try {
    const { error } = await supabase
      .from('documents')
      .update({ status, rejection_reason: reason })
      .eq('id', docId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// Kept for backward compat — calls new function with no reason
export async function updateDocumentStatus(docId, status) {
  return updateDocumentStatusWithReason(docId, status, null)
}

// ── Formation progress ────────────────────────────────────────

export async function fetchFormationProgress(userId) {
  if (!isConfigured) return applyUnlockLogic(FORMATION_UNITS)
  try {
    const { data, error } = await supabase
      .from('formation_progress').select('*').eq('user_id', userId)
    if (error) return applyUnlockLogic(FORMATION_UNITS)
    // Nouvel étudiant sans données → U1 disponible, reste verrouillé, tout à 0h
    if (!data?.length) return FORMATION_UNITS.map((unit, idx) => ({
      ...unit,
      completedHours: 0,
      status: idx === 0 ? 'in_progress' : 'locked'
    }))

    const merged = FORMATION_UNITS.map(unit => {
      const row = data.find(r => r.unit_number === unit.id)
      if (!row) return unit
      const status = row.completed ? 'completed' : row.hours_completed > 0 ? 'in_progress' : 'locked'
      return { ...unit, completedHours: row.hours_completed, status }
    })
    return applyUnlockLogic(merged)
  } catch (err) {
    console.warn('[api] fetchFormationProgress error:', err?.message)
    return applyUnlockLogic(FORMATION_UNITS)
  }
}

export async function markUnitComplete(userId, unitNumber, totalHours) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase.from('formation_progress').upsert(
      { user_id: userId, unit_number: unitNumber, hours_completed: totalHours, completed: true },
      { onConflict: 'user_id,unit_number' }
    )
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function startUnit(userId, unitNumber) {
  if (!isConfigured) return { success: true }
  try {
    const { data: existing } = await supabase
      .from('formation_progress').select('id').eq('user_id', userId).eq('unit_number', unitNumber).single()
    if (existing) return { success: true }
    const { error } = await supabase.from('formation_progress').insert(
      { user_id: userId, unit_number: unitNumber, hours_completed: 0, completed: false }
    )
    return { success: !error }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// ── Chapter-level progress (persists across logout/login) ────

export async function fetchChapterProgress(userId) {
  if (!isConfigured || !userId) return new Set()
  try {
    const { data, error } = await supabase
      .from('chapter_progress').select('chapter_id').eq('user_id', userId)
    if (error || !data) return new Set()
    return new Set(data.map(r => r.chapter_id))
  } catch (err) {
    console.warn('[api] fetchChapterProgress error:', err?.message)
    return new Set()
  }
}

export async function saveChapterProgress(userId, chapterId) {
  if (!isConfigured || !userId) return { success: true }
  try {
    const { error } = await supabase.from('chapter_progress').upsert(
      { user_id: userId, chapter_id: chapterId },
      { onConflict: 'user_id,chapter_id' }
    )
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// ── Exam results ──────────────────────────────────────────────

export async function fetchExamResults(userId) {
  if (!isConfigured) return []
  try {
    const { data } = await supabase
      .from('exam_results').select('*').eq('user_id', userId).order('completed_at', { ascending: false })
    return data ?? []
  } catch { return [] }
}

export async function saveExamResult(userId, examType, score, totalQuestions) {
  const passed = examType === 'ias1' ? score >= 15 : (score / totalQuestions) >= 0.7
  if (!isConfigured) return { success: true, passed }
  try {
    const { error } = await supabase.from('exam_results').insert({ user_id: userId, exam_type: examType, score, passed })
    return { success: !error, passed, error: error?.message }
  } catch (err) {
    return { success: false, passed, error: err?.message }
  }
}

// ── Packs & Payments ──────────────────────────────────────────

const TVA_RATE = 1.20 // 20% TVA, prix HT -> TTC

export async function fetchPacks() {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase.from('packs').select('*').order('display_order')
    if (error || !data) return []
    return data.map(p => ({
      ...p,
      price_ttc: Math.round(p.price_ht * TVA_RATE),
    }))
  } catch (err) {
    console.warn('[api] fetchPacks error:', err?.message)
    return []
  }
}

// Milestones for a 'milestone' pack: 50% souscription / 25% kbis+formation / 25% orias
// Milestones for a 'full' pack: 100% souscription
//
// overrideAmounts : { ht, ttc } — montant final réellement encaissé (ex: "Potentiel" saisi
// dans la fiche lead du CRM), déjà calculé selon la base choisie par l'admin (HT ou TTC).
// Important : amount_ttc est le SEUL champ utilisé par la partie Finance pour ses totaux
// (fetchFinanceSummary somme amount_ttc) — donc quel que soit le libellé HT/TTC choisi par
// l'admin, `ttc` ici DOIT correspondre au montant réellement encaissé, sans ajout de TVA :
// coché "HT" à 60 000 DH => l'admin a été payé 60 000 DH, pas 60 000 + 20% de TVA.
function buildPaymentRows(userId, pack, discountPercent = 0, overrideAmounts = null) {
  const hasOverride = overrideAmounts != null && !isNaN(Number(overrideAmounts.ttc)) && Number(overrideAmounts.ttc) > 0
  const discountFactor = 1 - (Number(discountPercent) || 0) / 100
  const effectiveHt  = hasOverride ? Number(overrideAmounts.ht)  : pack.price_ht * discountFactor
  const effectiveTtc = hasOverride ? Number(overrideAmounts.ttc) : Math.round(effectiveHt * TVA_RATE)
  if (pack.payment_type === 'full') {
    return [
      { user_id: userId, pack_id: pack.id, milestone: 'full', amount_ht: effectiveHt, amount_ttc: effectiveTtc, status: 'pending', discount_percent: discountPercent },
    ]
  }
  const half  = Math.round(effectiveHt * 0.5)
  const quart = Math.round(effectiveHt * 0.25)
  const halfTtc  = hasOverride ? Math.round(effectiveTtc * 0.5)  : Math.round(half * TVA_RATE)
  const quartTtc = hasOverride ? Math.round(effectiveTtc * 0.25) : Math.round(quart * TVA_RATE)
  return [
    { user_id: userId, pack_id: pack.id, milestone: 'souscription',   amount_ht: half,  amount_ttc: halfTtc,  status: 'pending', discount_percent: discountPercent },
    { user_id: userId, pack_id: pack.id, milestone: 'kbis_formation', amount_ht: quart, amount_ttc: quartTtc, status: 'pending', discount_percent: discountPercent },
    { user_id: userId, pack_id: pack.id, milestone: 'orias',          amount_ht: quart, amount_ttc: quartTtc, status: 'pending', discount_percent: discountPercent },
  ]
}

export async function markPaymentPaid(paymentId) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase.from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', paymentId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function fetchClientPayments(userId) {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase.from('payments').select('*').eq('user_id', userId).order('created_at')
    if (error || !data) return []
    return data
  } catch { return [] }
}

// Super-admin only: full financial dashboard
export async function fetchFinanceSummary() {
  if (!isConfigured) return { totalRevenuePaid: 0, totalPending: 0, monthRevenue: 0, yearRevenue: 0, pendingCount: 0, payments: [] }
  try {
    const [{ data, error }, { data: dossiers }] = await Promise.all([
      supabase
        .from('payments')
        .select('*, users:payments_user_id_public_users_fkey(full_name, email), packs(name, category)')
        .order('created_at', { ascending: false }),
      supabase.from('dossiers').select('user_id, status'),
    ])
    if (error) console.warn('[api] fetchFinanceSummary query error:', error.message)
    if (error || !data) return { totalRevenuePaid: 0, totalPending: 0, monthRevenue: 0, yearRevenue: 0, pendingCount: 0, payments: [] }

    const cancelledUserIds = new Set((dossiers || []).filter(d => d.status === 'Annulé').map(d => d.user_id))
    const activeData = data.filter(p => !cancelledUserIds.has(p.user_id))

    const now = new Date()
    const totalRevenuePaid = activeData.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount_ttc), 0)
    const totalPending     = activeData.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount_ttc), 0)
    const pendingCount     = activeData.filter(p => p.status === 'pending').length
    const monthRevenue     = activeData
      .filter(p => p.status === 'paid' && p.paid_at && new Date(p.paid_at).getMonth() === now.getMonth() && new Date(p.paid_at).getFullYear() === now.getFullYear())
      .reduce((s, p) => s + Number(p.amount_ttc), 0)
    const yearRevenue      = activeData
      .filter(p => p.status === 'paid' && p.paid_at && new Date(p.paid_at).getFullYear() === now.getFullYear())
      .reduce((s, p) => s + Number(p.amount_ttc), 0)

    // payments returned still include cancelled clients' rows so the UI can show them with the "Annulé" badge
    return { totalRevenuePaid, totalPending, monthRevenue, yearRevenue, pendingCount, payments: data }
  } catch (err) {
    console.warn('[api] fetchFinanceSummary error:', err?.message)
    return { totalRevenuePaid: 0, totalPending: 0, monthRevenue: 0, yearRevenue: 0, pendingCount: 0, payments: [] }
  }
}

// ── Admin: clients ────────────────────────────────────────────

export async function fetchAllClients(includeCancelled = true) {
  if (!isConfigured) {
    // Simulate a couple of clients with pending doc notifications
    return [].map((c, i) => ({
      ...c,
      pendingDocCount: i === 0 ? 1 : 0,
      dossierId:       c.dossierId ?? null,
      dossierStep:     c.dossierStep ?? Math.ceil((c.progression / 100) * 6),
      dossierNumber:   c.dossierNumber ?? '—',
    }))
  }
  try {
    const [{ data: users }, { data: pendingDocs }] = await Promise.all([
      supabase
        .from('users')
        .select('id, email, full_name, role, pack_id, created_at, dossiers(id, dossier_number, current_step, status), formation_progress(unit_number, completed), exam_results(score, passed), packs(name, category, price_ht, payment_type)')
        .eq('role', 'student')
        .order('created_at', { ascending: false }),
      supabase
        .from('documents')
        .select('user_id')
        .eq('status', 'en_attente'),
    ])

    const pendingByUser = {}
    ;(pendingDocs || []).forEach(d => {
      pendingByUser[d.user_id] = (pendingByUser[d.user_id] || 0) + 1
    })

    if (!users?.length) return []

    const mapped = users.map(u => {
      const dossier = u.dossiers?.[0]
      return {
        id:             u.id,
        nom:            u.full_name?.split(' ').slice(-1)[0] ?? '—',
        prenom:         u.full_name?.split(' ')[0] ?? '—',
        pack:           u.packs?.name ?? 'Essentiel',
        packId:         u.pack_id ?? null,
        progression:    Math.round(((u.formation_progress?.filter(p => p.completed)?.length ?? 0) / 5) * 100),
        statut:         dossier?.status ?? 'En cours',
        activite:       'récemment',
        email:          u.email,
        enrolledAt:     u.created_at,
        dossierId:      dossier?.id ?? null,
        dossierStep:    dossier?.current_step ?? 1,
        dossierNumber:  dossier?.dossier_number ?? '—',
        pendingDocCount: pendingByUser[u.id] ?? 0,
        examScore:      u.exam_results?.[0]?.score ?? null,
        examPassed:     u.exam_results?.some(r => r.score >= 15) ?? false,
      }
    })

    return includeCancelled ? mapped : mapped.filter(c => c.statut !== 'Annulé')
  } catch (err) {
    console.warn('[api] fetchAllClients error:', err?.message)
    return []
  }
}

// finalAmounts : { ht, ttc } — montant final négocié à facturer (remplace le prix catalogue
// du pack si fourni) — utilisé notamment par convertLeadToClient pour respecter le
// "Potentiel" saisi par l'admin dans la fiche lead du CRM. `ttc` doit être le montant
// réellement encaissé (voir buildPaymentRows).
export async function createClient(fullName, email, packId, discountPercent = 0, finalAmounts = null) {
  if (!isConfigured) return { success: false, error: 'Supabase non configuré.' }
  try {
    const { data: pack } = await supabase.from('packs').select('*').eq('id', packId).single()
    if (!pack) return { success: false, error: 'Pack introuvable.' }

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ fullName, email, role: 'student', packId, discountPercent }),
    })
    const result = await res.json()
    if (!result.success) return { success: false, error: result.error }

    const userId = result.userId
    let createdPayments = []
    if (userId) {
      const rows = buildPaymentRows(userId, pack, discountPercent, finalAmounts)
      const { data: inserted } = await supabase.from('payments').insert(rows).select()
      createdPayments = inserted ?? []
    }

    return { success: true, tempPassword: result.tempPassword, userId, payments: createdPayments }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// Super-admin only: create a colleague admin account (no finance access)
export async function createAdminAccount(fullName, email) {
  if (!isConfigured) return { success: false, error: 'Supabase non configuré.' }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ fullName, email, role: 'admin' }),
    })
    const result = await res.json()
    if (!result.success) return { success: false, error: result.error }
    return { success: true, tempPassword: result.tempPassword, userId: result.userId }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// Update an existing client's profile (full name, pack) — usable at any dossier status
export async function updateClientInfo(userId, { fullName, packId }) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase.from('users').update({
      full_name: fullName || null,
      pack_id: packId || null,
    }).eq('id', userId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// Mark a client's dossier as cancelled — keeps all data, just flips status for visibility everywhere
export async function cancelClientDossier(dossierId) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase.from('dossiers').update({ status: 'Annulé' }).eq('id', dossierId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function reactivateClientDossier(dossierId) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase.from('dossiers').update({ status: 'En cours' }).eq('id', dossierId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// Legacy — kept for backward compat with old DossierSection calls
export async function fetchClientDocuments(userId) {
  return fetchClientDocumentsWithDetails(userId)
}

// ── Leads CRM ─────────────────────────────────────────────────

export const LEAD_STATUSES = ['nouveau', 'rdv_pris', 'qualifie', 'engage', 'client', 'perdu']

export const LEAD_STATUS_LABELS = {
  nouveau:   'Nouveau',
  rdv_pris:  'RDV pris',
  qualifie:  'Qualifié',
  engage:    'Engagé (Commit)',
  client:    'Client',
  perdu:     'Perdu',
}

// Pondération du potentiel par étape — même logique que les pipelines HubSpot
// (10% / 30% / 50% / 80% / 100% gagné / 0% perdu), utilisée pour le "montant pondéré".
export const STAGE_WEIGHTS = {
  nouveau:  0.1,
  rdv_pris: 0.3,
  qualifie: 0.5,
  engage:   0.8,
  client:   1,
  perdu:    0,
}

export const LEAD_SOURCE_LABELS = {
  site_web:  'Site web',
  whatsapp:  'WhatsApp',
  instagram: 'Instagram',
  facebook:  'Facebook',
  autre:     'Autre',
}

export async function fetchLeads() {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.warn('[api] fetchLeads error:', err?.message)
    return []
  }
}

export async function updateLeadStatus(leadId, status) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase.from('leads').update({ status }).eq('id', leadId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function updateLeadNotes(leadId, notes) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase.from('leads').update({ notes }).eq('id', leadId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function updateLeadInfo(leadId, { firstName, lastName, email, phone, city }) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase.from('leads').update({
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      city: city || null,
    }).eq('id', leadId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function assignLead(leadId, userId) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase.from('leads').update({ assigned_to: userId }).eq('id', leadId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

/**
 * Subscribe to realtime changes on the leads table (new lead inserted, status updated, etc.)
 * callback receives { event: 'INSERT'|'UPDATE'|'DELETE', lead: {...} }
 */
export function subscribeToLeads(callback) {
  if (!isConfigured) return () => {}
  const channel = supabase
    .channel(`leads-realtime-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'leads' },
      payload => {
        callback({
          event: payload.eventType,
          lead: payload.new ?? payload.old ?? null,
        })
      }
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export const APPOINTMENT_TYPE_LABELS = {
  appel:       'Appel téléphonique',
  visio:       'Visio',
  presentiel:  'En personne',
}

export const APPOINTMENT_STATUS_LABELS = {
  planifie: 'Planifié',
  termine:  'Terminé',
  annule:   'Annulé',
}

// ── Rendez-vous (plusieurs par lead) ────────────────────────────

export async function fetchLeadAppointments(leadId) {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase
      .from('lead_appointments')
      .select('*')
      .eq('lead_id', leadId)
      .order('scheduled_at', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.warn('[api] fetchLeadAppointments error:', err?.message)
    return []
  }
}

export async function addLeadAppointment(leadId, { scheduledAt, type }) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase
      .from('lead_appointments')
      .insert({ lead_id: leadId, scheduled_at: scheduledAt, type })
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function updateAppointmentStatus(appointmentId, status) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase
      .from('lead_appointments')
      .update({ status })
      .eq('id', appointmentId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

/** Tous les rendez-vous à venir (planifiés), avec les infos du lead — pour la vue Agenda. */
export async function fetchUpcomingAppointments() {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase
      .from('lead_appointments')
      .select('*, leads(id, first_name, last_name, email, phone, status)')
      .eq('status', 'planifie')
      .order('scheduled_at', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.warn('[api] fetchUpcomingAppointments error:', err?.message)
    return []
  }
}

// ── Tâches (rappels / actions à faire) ──────────────────────────

export async function fetchLeadTasks(leadId) {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase
      .from('lead_tasks')
      .select('*')
      .eq('lead_id', leadId)
      .order('done', { ascending: true })
      .order('due_at', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.warn('[api] fetchLeadTasks error:', err?.message)
    return []
  }
}

export async function addLeadTask(leadId, { title, dueAt }) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase
      .from('lead_tasks')
      .insert({ lead_id: leadId, title, due_at: dueAt || null })
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function toggleTaskDone(taskId, done) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase
      .from('lead_tasks')
      .update({ done })
      .eq('id', taskId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

/** Toutes les tâches non terminées, avec les infos du lead — pour la vue Agenda. */
export async function fetchUpcomingTasks() {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase
      .from('lead_tasks')
      .select('*, leads(id, first_name, last_name, email, phone, status)')
      .eq('done', false)
      .order('due_at', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.warn('[api] fetchUpcomingTasks error:', err?.message)
    return []
  }
}

// ── Pack & montant potentiel (valeur du deal, comme HubSpot) ────

export async function setLeadPack(leadId, { packId, potentialAmount }) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase
      .from('leads')
      .update({ pack_id: packId, potential_amount: potentialAmount })
      .eq('id', leadId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function setLeadPricing(leadId, { discountPercent, amountBasis }) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase
      .from('leads')
      .update({ discount_percent: discountPercent, amount_basis: amountBasis })
      .eq('id', leadId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

/**
 * Convertit un lead "client" en vrai compte (users + dossier + paiements 50/25/25),
 * marque le premier paiement comme déjà réglé, et envoie l'email de création de session
 * (même flux que "Ajouter un client" dans l'onglet Clients).
 */
export async function convertLeadToClient(lead) {
  if (!isConfigured) return { success: false, error: 'Supabase non configuré.' }
  if (!lead.pack_id) return { success: false, error: 'Sélectionnez un pack avant de convertir ce lead.' }
  if (!lead.email) return { success: false, error: 'Ce lead n\'a pas d\'adresse email.' }

  const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email

  // Si un "Potentiel" a été saisi sur le lead (montant final négocié avec le client), on
  // l'utilise comme base de facturation plutôt que le prix catalogue du pack. Ce montant —
  // qu'il ait été saisi en HT ou en TTC (bascule de la fiche lead) — est TOUJOURS le total
  // réellement encaissé : cocher "HT" ne rajoute pas 20% de TVA par-dessus, ça veut juste
  // dire que la somme reçue a été négociée/formulée hors taxe.
  let finalAmounts = null
  const potentialAmount = Number(lead.potential_amount)
  if (lead.potential_amount != null && lead.potential_amount !== '' && !isNaN(potentialAmount) && potentialAmount > 0) {
    finalAmounts = lead.amount_basis === 'ttc'
      ? { ht: potentialAmount / TVA_RATE, ttc: potentialAmount }
      : { ht: potentialAmount, ttc: potentialAmount }
  }

  const result = await createClient(fullName, lead.email, lead.pack_id, lead.discount_percent || 0, finalAmounts)
  if (!result.success) return result

  // Le premier jalon (souscription ou paiement complet) est déjà réglé pour devenir client
  const firstPayment = result.payments?.find(p => p.milestone === 'souscription' || p.milestone === 'full')
  if (firstPayment) {
    await markPaymentPaid(firstPayment.id)
  }

  await supabase
    .from('leads')
    .update({ converted_user_id: result.userId })
    .eq('id', lead.id)

  await supabase.from('lead_activity').insert({
    lead_id: lead.id,
    type: 'conversion',
    description: `Converti en client — compte créé, premier paiement validé (${firstPayment ? fmtDHForLog(firstPayment.amount_ttc) : ''})`,
  })

  return { success: true, tempPassword: result.tempPassword, userId: result.userId }
}

function fmtDHForLog(n) {
  if (n === null || n === undefined) return ''
  return Math.round(n).toLocaleString('fr-FR') + ' DH TTC'
}

// ── Activité rapide à logger (appel passé, email envoyé...) ────

export async function logQuickActivity(leadId, type, description) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase
      .from('lead_activity')
      .insert({ lead_id: leadId, type, description })
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function fetchLeadActivity(leadId) {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase
      .from('lead_activity')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.warn('[api] fetchLeadActivity error:', err?.message)
    return []
  }
}

export async function addLeadNote(leadId, note) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase
      .from('lead_activity')
      .insert({ lead_id: leadId, type: 'note', description: note })
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// ── Équipe (gestion des comptes admin / super_admin) ────────────

export async function fetchAdmins() {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, blocked, created_at')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.warn('[api] fetchAdmins error:', err?.message)
    return []
  }
}

export async function toggleUserBlocked(userId, blocked) {
  if (!isConfigured) return { success: true }
  try {
    const { error } = await supabase.from('users').update({ blocked }).eq('id', userId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

/** Supprime définitivement un compte admin/élève — réservé super_admin, via Edge Function (service role). */
export async function deleteAdminAccount(userId) {
  if (!isConfigured) return { success: true }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-admin-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ userId }),
    })
    const json = await res.json()
    return json
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// Suppression definitive d'un compte client (reservee au super_admin) — reutilise la meme
// fonction Edge que deleteAdminAccount : supprime le compte auth (cascade vers dossier,
// documents, formation, examens ET paiements — l'historique Finance est donc entierement effacé).
// Contrairement a "Annuler le dossier" (cancelClientDossier), cette action est irreversible.
export async function deleteClientAccount(userId) {
  if (!isConfigured) return { success: true }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-admin-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ userId }),
    })
    const json = await res.json()
    return json
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// ── Tickets / messages (clients via Support, admins en interne) ─

export const TICKET_STATUS_LABELS = {
  nouveau:  'Nouveau',
  en_cours: 'En cours',
  resolu:   'Résolu',
}

export async function submitSupportTicket({ subject, message, priority = 'normal' }) {
  if (!isConfigured) return { success: true }
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié.' }
    const { error } = await supabase.from('support_tickets').insert({
      source: 'client',
      created_by: user.id,
      subject,
      message,
      priority,
    })
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function submitAdminTicket({ subject, message, priority = 'normal' }) {
  if (!isConfigured) return { success: true }
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié.' }
    const { error } = await supabase.from('support_tickets').insert({
      source: 'admin_interne',
      created_by: user.id,
      subject,
      message,
      priority,
    })
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export async function fetchSupportTickets() {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, users:created_by(full_name, email, role)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.warn('[api] fetchSupportTickets error:', err?.message)
    return []
  }
}

export async function updateTicketStatus(ticketId, status, response) {
  if (!isConfigured) return { success: true }
  try {
    const payload = { status }
    if (response !== undefined) payload.response = response
    const { error } = await supabase.from('support_tickets').update(payload).eq('id', ticketId)
    return { success: !error, error: error?.message }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

export function subscribeToSupportTickets(callback) {
  if (!isConfigured) return () => {}
  const channel = supabase
    .channel(`tickets-realtime-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'support_tickets' },
      payload => {
        callback({
          event: payload.eventType,
          ticket: payload.new ?? payload.old ?? null,
        })
      }
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ── Marketing — onboarding & suivi (brand_briefs / client_deliverables) ──

// Whether this client's pack includes marketing (web ou combiné) — controls tab visibility
export async function fetchMarketingAccess(userId) {
  if (!isConfigured || !userId) return false
  try {
    const { data, error } = await supabase.rpc('user_has_marketing_access', { p_user_id: userId })
    if (error) throw error
    return !!data
  } catch (err) {
    console.warn('[api] fetchMarketingAccess error:', err?.message)
    return false
  }
}

// Pack + identité déjà connus côté session — utilisé pour pré-remplir le questionnaire
export async function fetchUserMarketingProfile(userId) {
  if (!isConfigured || !userId) return null
  try {
    const { data, error } = await supabase
      .from('users')
      .select('pack_id, full_name, email')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  } catch (err) {
    console.warn('[api] fetchUserMarketingProfile error:', err?.message)
    return null
  }
}

// Le brief existant du client connecté (null si pas encore rempli)
export async function fetchBrandBrief(userId) {
  if (!isConfigured || !userId) return null
  try {
    const { data, error } = await supabase
      .from('brand_briefs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  } catch (err) {
    console.warn('[api] fetchBrandBrief error:', err?.message)
    return null
  }
}

// Statut de production — vue déjà filtrée sur auth.uid()
export async function fetchMarketingStatus() {
  if (!isConfigured) return null
  try {
    const { data, error } = await supabase.from('my_marketing_status').select('*').maybeSingle()
    if (error) throw error
    return data
  } catch (err) {
    console.warn('[api] fetchMarketingStatus error:', err?.message)
    return null
  }
}

// Soumission du questionnaire — le trigger check_brief_pack_eligibility protège côté DB
export async function submitBrandBrief(payload) {
  if (!isConfigured) return { success: false, error: 'Non configuré.' }
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié.' }
    const { data, error } = await supabase
      .from('brand_briefs')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    return { success: true, brief: data }
  } catch (err) {
    console.warn('[api] submitBrandBrief error:', err?.message)
    return { success: false, error: err?.message }
  }
}

// Upload logo / photos vers le bucket public "documents" (réutilisé, sous un préfixe marketing/)
export async function uploadBrandAsset(userId, kind, file) {
  if (!isConfigured) return { success: false, error: 'Non configuré.' }
  try {
    const ext  = (file.name.split('.').pop() || 'bin').toLowerCase()
    const path = `${userId}/marketing/${kind}/${Date.now()}.${ext}`
    const { error: storageErr } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (storageErr) throw storageErr
    const { data } = supabase.storage.from('documents').getPublicUrl(path)
    return { success: true, url: data?.publicUrl, fileName: file.name }
  } catch (err) {
    console.warn('[api] uploadBrandAsset error:', err?.message)
    return { success: false, error: err?.message }
  }
}



