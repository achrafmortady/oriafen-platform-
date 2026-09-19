// ============================================================
// SUPPORT / MESSAGES ADAPTER — enveloppe fine autour de
// clientTrackingStore.js (localStorage). V1 (origin/main) a
// `support_tickets` (submitSupportTicket/fetchSupportTickets/
// updateTicketStatus, colonnes : id, user_id, subject, message, category,
// priority, status, response, source, created_at) et `client_messages`
// (sendAdminMessage/fetchMyMessages) — deux tables live déjà adaptées à ce
// modèle (fil = une ligne = un id stable, réponse admin = update en place).
// Reconnexion plausible sans nouveau schéma, sous réserve de confirmer les
// colonnes exactes sur le schéma live (README §3) — voir
// docs/PRODUCTION_WIRING_PLAN.md §5.
// ============================================================
import { ADAPTER_MODE } from './identity'
import {
  getClientSends, createClientSupportRequest, respondToClientRequest, replyToClientSend,
  getAllClientInitiatedItems, addClientNotification, getAdminSendStatus, subscribeToClientTracking,
} from '../clientTrackingStore'

function assertLocalMode() {
  if (ADAPTER_MODE !== 'local') throw new Error('supportAdapter: mode "supabase" non implémenté — voir docs/PRODUCTION_WIRING_PLAN.md')
}

// getThread(clientId) : un "thread" par item id (jamais mélangés) — même
// contrat qu'attendu en production (support_tickets.id stable).
export function getThread(clientId) { assertLocalMode(); return getClientSends(clientId) }
export function createTicket(clientId, payload, clientName) { assertLocalMode(); return createClientSupportRequest(clientId, payload, clientName) }
export function respondToTicket(sendId, message) { assertLocalMode(); return respondToClientRequest(sendId, message) }
export function replyAsClient(sendId, message) { assertLocalMode(); return replyToClientSend(sendId, message) }
export function getAllOpenTickets() { assertLocalMode(); return getAllClientInitiatedItems() }
export function notifyClient(clientId, payload) { assertLocalMode(); return addClientNotification(clientId, payload) }
export function getStatus(item) { assertLocalMode(); return getAdminSendStatus(item) }
export function subscribe(callback) { assertLocalMode(); return subscribeToClientTracking(callback) }
