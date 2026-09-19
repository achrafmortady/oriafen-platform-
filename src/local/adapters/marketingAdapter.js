// ============================================================
// MARKETING ADAPTER — enveloppe fine autour de marketingStore.js
// (localStorage). AUCUNE table live n'existe pour ce modèle exact — le V1
// (origin/main) a `fetchAdminMarketingBriefs`/`updateClientDeliverables`/
// `SITE_FEEDBACK_SECTIONS`/`sendDeliverableFile` (src/lib/api.js), un
// schéma différent et plus riche (briefs + fichiers livrables + feedback
// structuré par section). Avant d'activer un adaptateur Supabase ici :
// réconcilier ce modèle (projet/livrables/demandes) avec le schéma live
// existant plutôt que de créer un second système parallèle — voir
// docs/PRODUCTION_WIRING_PLAN.md §4.
// ============================================================
import { ADAPTER_MODE } from './identity'
import {
  getMarketingProject, getDeliverables, getModificationRequests,
  createModificationRequest, setModificationStatus, updateMarketingProject,
  subscribeToMarketing, MODIFICATION_STATUSES,
} from '../marketingStore'

function assertLocalMode() {
  if (ADAPTER_MODE !== 'local') throw new Error('marketingAdapter: mode "supabase" non implémenté — voir docs/PRODUCTION_WIRING_PLAN.md')
}

export function getProject(clientId) { assertLocalMode(); return getMarketingProject(clientId) }
export function getDeliverablesFor(clientId) { assertLocalMode(); return getDeliverables(clientId) }
export function getRequests(clientId) { assertLocalMode(); return getModificationRequests(clientId) }
export function createRequest(clientId, payload, clientName) { assertLocalMode(); return createModificationRequest(clientId, payload, clientName) }
export function setRequestStatus(clientId, requestId, status) { assertLocalMode(); return setModificationStatus(clientId, requestId, status) }
export function updateProject(clientId, patch) { assertLocalMode(); return updateMarketingProject(clientId, patch) }
export function subscribe(callback) { assertLocalMode(); return subscribeToMarketing(callback) }
export { MODIFICATION_STATUSES }
