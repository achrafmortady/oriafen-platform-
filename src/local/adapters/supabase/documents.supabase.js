// ============================================================
// DOCUMENTS (+ associate docs) — production implementation (NOT activated,
// see ./_guard.js). Thin wrapper around src/lib/api.js (V1, unmodified).
//
// Confirmed `documents` columns (read-only, api.js:197-349): id, user_id,
// category, name, file_url, file_name, status, rejection_reason,
// uploaded_at. Status raw values: valide/manquant/correction_demandee/
// en_attente (normalized locally via normDocStatus-equivalent). Constraint
// noted in migration comments: UNIQUE(user_id, category) — one row per
// category, upsert-based (api.js:200-210), so uploading a new file for an
// already-used category REPLACES the row (no versioning live today).
//
// Associate categories (associate_cin_recto, associate_cin_verso,
// associate_justificatif_domiciliation, associate_autre_*) — CLASSIFICATION
// A, CONFIRMED LIVE (2026-09-21 read-only audit): documents.category is
// `text`, nullable, no CHECK constraint, UNIQUE(user_id, category). Zero
// schema change needed for these categories.
//
// Versioning (document_versions, rejectDocumentWithAudit,
// replaceDocumentWithVersioning) is DORMANT — requires the unexecuted
// migration 20260916_test_local_document_versions.sql. Exposed here for
// completeness but must not be relied upon until that migration runs on a
// test project first.
//
// Storage bucket: 'documents' (api.js:187,192,1579,1753) — same bucket
// reused for marketing assets (`marketing/` prefix) and deliverables
// (`deliverables/` prefix), no separate bucket exists.
//
// SECURITY — DO NOT ASSUME THIS BUCKET IS PRIVATE. Confirmed live
// (2026-09-21 audit): the `documents` bucket is public=true — a HIGH
// PRIORITY finding (sensitive client identity documents), see
// docs/PRODUCTION_WIRING_PLAN.md §12.4 and
// supabase/migrations/20260922_proposal_documents_bucket_privacy.sql (not
// applied). uploadDocumentFile already uses createSignedUrl() for the main
// document read path (not the public URL), but this adapter must not be
// treated as "storage-secure" until that migration proposal is reviewed —
// the RLS fix for the `documents` TABLE
// (20260922_proposal_fix_documents_policy.sql) does not, by itself, make
// the underlying STORAGE OBJECTS private.
// ============================================================
import { assertProductionAdapterActive } from './_guard'
import { resolveSignedUrl } from './storageUrl'
import {
  fetchDocumentsByCategory, uploadDocumentFile, updateDocumentStatusWithReason,
  updateDocumentStatus, subscribeToDocuments, fetchClientDocumentsWithDetails,
  fetchDocumentVersions, rejectDocumentWithAudit, replaceDocumentWithVersioning,
} from '../../../lib/api'

function guard() { assertProductionAdapterActive('documents.supabase.js') }

// Compatibility fix (audit "local security compatibility", 2026-09-22):
// resolve `fileUrl` through resolveSignedUrl() before returning — a no-op
// today (uploadDocumentFile already stores a signed URL) but keeps this
// adapter working unchanged if the `documents` bucket is ever flipped to
// private (see storageUrl.js). Never rewrites the underlying DB value.
// guard() stays the literal first statement of a non-async function (not
// inside an `async function` body) so it throws SYNCHRONOUSLY, exactly
// like every other adapter export in this codebase — an async function
// body would instead turn that throw into a rejected Promise, breaking the
// "throws before any I/O" contract this whole layer relies on.
export function getDocuments(userId) {
  guard()
  return (async () => {
    const map = await fetchDocumentsByCategory(userId)
    await Promise.all(Object.values(map).map(async doc => { doc.fileUrl = await resolveSignedUrl(doc.fileUrl) }))
    return map
  })()
}
export function getDocumentsWithDetails(userId) {
  guard()
  return (async () => {
    const list = await fetchClientDocumentsWithDetails(userId)
    await Promise.all(list.map(async doc => { doc.fileUrl = await resolveSignedUrl(doc.fileUrl) }))
    return list
  })()
}
export function upload(userId, categoryId, categoryLabel, file) { guard(); return uploadDocumentFile(userId, categoryId, categoryLabel, file) }
export function updateStatus(docId, status, reason = null) { guard(); return updateDocumentStatusWithReason(docId, status, reason) }
export function setStatus(docId, status) { guard(); return updateDocumentStatus(docId, status) }
export function subscribe(userId, callback) { guard(); return subscribeToDocuments(userId, callback) }

// DORMANT (voir commentaire ci-dessus) — nécessite la migration
// document_versions non exécutée. Exposé mais pas prêt à l'activation.
export function getVersions(userId, category) { guard(); return fetchDocumentVersions(userId, category) }
export function rejectWithAudit(doc, reason, rejectedBy = null) { guard(); return rejectDocumentWithAudit(doc, reason, rejectedBy) }
export function replaceWithVersioning(userId, categoryId, categoryLabel, file, previousDoc = null) { guard(); return replaceDocumentWithVersioning(userId, categoryId, categoryLabel, file, previousDoc) }

// Associate categories reuse the exact same functions above with a
// `associate_*` categoryId — no separate function needed, matching the
// local documentsStore.js/associateDocuments.js split (same store, filtered
// by category prefix, never a parallel table).
