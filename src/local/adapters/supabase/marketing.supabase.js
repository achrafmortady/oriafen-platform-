// ============================================================
// MARKETING — production implementation (NOT activated, see ./_guard.js).
// Thin wrapper around src/lib/api.js (V1, unmodified).
//
// Confirmed (read-only, api.js:1525-1789):
//   brand_briefs: FULLY CONFIRMED 2026-09-21 (real payload read from
//     src/pages/student/Marketing.jsx:208-227, V1, unmodified) — pack_id,
//     cabinet_name, contact_full_name, email, style_prefere,
//     couleur_principale, couleur_secondaire, notes_style,
//     domaine_souhaite, types_assurance_prioritaires (array),
//     demandes_speciales, a_un_logo, logo_url, a_des_photos, photos_urls
//     (array), instagram_existant, facebook_existant, reseaux_a_creer, plus
//     user_id/id/created_at.
//   client_deliverables: site_review_status ('valide'|'changements_demandes'
//     |'en_attente'), client_validated_at, site_revision_round confirmed via
//     update() calls; full row shape otherwise unknown (selects are always
//     '*' or nested).
//   deliverable_feedback: deliverable_id, kind ('site'), round, section
//     (SITE_FEEDBACK_SECTIONS), comment, status, admin_response,
//     created_at, updated_at.
//   deliverable_files: deliverable_id, kind (DELIVERABLE_FILE_KIND_LABELS),
//     label, file_url, file_name, created_at.
// Classification: B — mapping of existing tables/fields, no new table
// needed for the local "project overview / deliverables / modification
// requests" model (client_deliverables + deliverable_feedback already cover
// it near 1:1).
//
// STORAGE COMPATIBILITY (audit "local security compatibility", 2026-09-22):
// uploadBrandAsset (api.js:1574-1587) returns a bare public URL
// (getPublicUrl) and sendDeliverableFile (api.js:1748-1778) writes a bare
// public URL DIRECTLY into deliverable_files.file_url — it never even
// returns the URL to the caller, so there is no "fix the return value"
// option for that one. Both are resolved HERE, at READ time
// (getBrief/getFiles below), via resolveSignedUrl() — never by rewriting
// what api.js persists. This keeps marketing assets/deliverables working
// unchanged today AND after a future private `documents` bucket (see
// storageUrl.js for why re-signing a path works regardless of the bucket's
// public flag). No stored value is migrated/rewritten by this file.
// ============================================================
import { assertProductionAdapterActive } from './_guard'
import { resolveSignedUrl, resolveSignedUrls } from './storageUrl'
import {
  fetchMarketingAccess, fetchUserMarketingProfile, fetchBrandBrief, fetchMarketingStatus,
  submitBrandBrief, uploadBrandAsset, fetchAdminMarketingBriefs, updateClientDeliverables,
  fetchDeliverableFeedback, validateSiteDeliverable, submitSiteFeedback, updateFeedbackStatus,
  sendNewSiteRevision, fetchDeliverableFiles, sendDeliverableFile, deleteDeliverableFile,
  SITE_FEEDBACK_SECTIONS, DELIVERABLE_FILE_KIND_LABELS,
} from '../../../lib/api'

function guard() { assertProductionAdapterActive('marketing.supabase.js') }

export function getAccess(userId) { guard(); return fetchMarketingAccess(userId) }
export function getProfile(userId) { guard(); return fetchUserMarketingProfile(userId) }
// guard() stays the literal first statement of a non-async function so it
// throws SYNCHRONOUSLY — same contract as every other adapter export here.
export function getBrief(userId) {
  guard()
  return (async () => {
    const brief = await fetchBrandBrief(userId)
    if (!brief) return brief
    brief.logo_url = await resolveSignedUrl(brief.logo_url)
    brief.photos_urls = await resolveSignedUrls(brief.photos_urls)
    return brief
  })()
}
export function getStatus() { guard(); return fetchMarketingStatus() }
export function submitBrief(payload) { guard(); return submitBrandBrief(payload) }
export function uploadAsset(userId, kind, file) {
  guard()
  return (async () => {
    const result = await uploadBrandAsset(userId, kind, file)
    if (result?.success && result.url) result.url = await resolveSignedUrl(result.url)
    return result
  })()
}
export function getAdminBriefs() { guard(); return fetchAdminMarketingBriefs() }

export function updateDeliverables(deliverableId, payload) { guard(); return updateClientDeliverables(deliverableId, payload) }
export function validateDeliverable(deliverableId) { guard(); return validateSiteDeliverable(deliverableId) }
export function sendRevision(deliverableId, currentRound) { guard(); return sendNewSiteRevision(deliverableId, currentRound) }

// "Demande de modification" = deliverable_feedback (une ligne par remarque,
// section connue via SITE_FEEDBACK_SECTIONS) — même modèle que
// marketingStore.js côté Preview, aucune réécriture.
export function getFeedback(deliverableId) { guard(); return fetchDeliverableFeedback(deliverableId) }
export function submitFeedback(deliverableId, round, items) { guard(); return submitSiteFeedback(deliverableId, round, items) }
export function updateFeedback(feedbackId, status, adminResponse) { guard(); return updateFeedbackStatus(feedbackId, status, adminResponse) }
export { SITE_FEEDBACK_SECTIONS }

export function getFiles(deliverableId) {
  guard()
  return (async () => {
    const files = await fetchDeliverableFiles(deliverableId)
    await Promise.all(files.map(async f => { f.file_url = await resolveSignedUrl(f.file_url) }))
    return files
  })()
}
export function sendFile(deliverableId, userId, payload) { guard(); return sendDeliverableFile(deliverableId, userId, payload) }
export function deleteFile(fileId) { guard(); return deleteDeliverableFile(fileId) }
export { DELIVERABLE_FILE_KIND_LABELS }
