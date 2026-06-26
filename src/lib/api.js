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
function buildPaymentRows(userId, pack, discountPercent = 0) {
  const discountFactor = 1 - (Number(discountPercent) || 0) / 100
  const effectiveHt = pack.price_ht * discountFactor
  const ttc = Math.round(effectiveHt * TVA_RATE)
  if (pack.payment_type === 'full') {
    return [
      { user_id: userId, pack_id: pack.id, milestone: 'full', amount_ht: effectiveHt, amount_ttc: ttc, status: 'pending', discount_percent: discountPercent },
    ]
  }
  const half  = Math.round(effectiveHt * 0.5)
  const quart = Math.round(effectiveHt * 0.25)
  const halfTtc  = Math.round(half * TVA_RATE)
  const quartTtc = Math.round(quart * TVA_RATE)
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

export async function createClient(fullName, email, packId, discountPercent = 0) {
  if (!isConfigured) return { success: false, error: 'Supabase non configuré — activez Supabase pour créer des comptes.' }
  try {
    const { data: pack } = await supabase.from('packs').select('*').eq('id', packId).single()
    if (!pack) return { success: false, error: 'Pack introuvable.' }

    const tempPassword = `Oriafen${Math.floor(Math.random() * 9000) + 1000}!`
    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: { full_name: fullName, role: 'student', pack_id: packId },
        emailRedirectTo: 'https://oriafen-platform.vercel.app/set-password',
      },
    })
    if (error) return { success: false, error: error.message }

    const userId = data.user?.id
    if (userId) {
      // Make sure pack_id is set on the users row (signUp metadata may not sync immediately)
      await supabase.from('users').update({ pack_id: packId }).eq('id', userId)
      // Create the payment milestone rows for this client (with discount applied if any)
      const rows = buildPaymentRows(userId, pack, discountPercent)
      await supabase.from('payments').insert(rows)
    }

    return { success: true, tempPassword, userId }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// Super-admin only: create a colleague admin account (no finance access)
export async function createAdminAccount(fullName, email) {
  if (!isConfigured) return { success: false, error: 'Supabase non configuré.' }
  try {
    const tempPassword = `Oriafen${Math.floor(Math.random() * 9000) + 1000}!`
    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: { full_name: fullName, role: 'admin' },
        emailRedirectTo: 'https://oriafen-platform.vercel.app/set-password',
      },
    })
    if (error) return { success: false, error: error.message }

    const userId = data.user?.id
    if (userId) {
      // Make sure role is set on the users row (signUp metadata may not sync immediately)
      await supabase.from('users').update({ role: 'admin' }).eq('id', userId)
    }

    return { success: true, tempPassword, userId }
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

export const LEAD_STATUSES = ['nouveau', 'qualifie', 'rdv_pris', 'client', 'perdu']

export const LEAD_STATUS_LABELS = {
  nouveau:   'Nouveau',
  qualifie:  'Qualifié',
  rdv_pris:  'RDV pris',
  client:    'Client',
  perdu:     'Perdu',
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
    .channel('leads-realtime')
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

