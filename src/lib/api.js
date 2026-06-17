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

// ── Admin: clients ────────────────────────────────────────────

export async function fetchAllClients() {
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
        .select('id, email, full_name, role, pack_purchased, created_at, dossiers(id, dossier_number, current_step, status), formation_progress(unit_number, completed), exam_results(score, passed)')
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

    return users.map(u => {
      const dossier = u.dossiers?.[0]
      return {
        id:             u.id,
        nom:            u.full_name?.split(' ').slice(-1)[0] ?? '—',
        prenom:         u.full_name?.split(' ')[0] ?? '—',
        pack:           u.pack_purchased ?? 'Essentiel',
        progression:    u.formation_progress?.filter(p => p.completed)?.length
                          ? Math.round((u.formation_progress.filter(p => p.completed).length / 5) * 100)
                          : dossier ? Math.round(((dossier.current_step - 1) / 5) * 100) : 0,
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
  } catch (err) {
    console.warn('[api] fetchAllClients error:', err?.message)
    return []
  }
}

export async function createClient(fullName, email, pack) {
  if (!isConfigured) return { success: false, error: 'Supabase non configuré — activez Supabase pour créer des comptes.' }
  try {
    const tempPassword = `Oriafen${Math.floor(Math.random() * 9000) + 1000}!`
    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: { full_name: fullName, role: 'student', pack_purchased: pack },
        emailRedirectTo: 'https://oriafen-platform.vercel.app/set-password',
      },
    })
    if (error) return { success: false, error: error.message }
    return { success: true, tempPassword, userId: data.user?.id }
  } catch (err) {
    return { success: false, error: err?.message }
  }
}

// Legacy — kept for backward compat with old DossierSection calls
export async function fetchClientDocuments(userId) {
  return fetchClientDocumentsWithDetails(userId)
}
