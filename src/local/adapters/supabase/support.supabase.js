// ============================================================
// SUPPORT / MESSAGES — production implementation (NOT activated, see
// ./_guard.js). Thin wrapper around src/lib/api.js (V1, unmodified).
//
// Confirmed (read-only, api.js:1251-1391):
//   support_tickets: id, created_by (-> users), subject, message, priority,
//     category (TICKET_CATEGORY_LABELS), status (TICKET_STATUS_LABELS:
//     nouveau/en_cours/resolu), source ('client'|'admin_interne'), response,
//     created_at.
//   client_messages: id, user_id, message, broadcast (bool), read_at,
//     created_at — CONFIRMED 2026-09-21 (api.js:578-609, 1361-1391).
//     IMPORTANT: this is a ONE-WAY admin -> client broadcast/announcement
//     channel, NOT a reply-capable thread (no function ever writes a client
//     reply into this table). It does NOT map to the local
//     clientTrackingStore.js bidirectional-thread model — that model maps
//     to support_tickets instead (see getMyTickets/getAllTickets below).
//     sendMessage()/getMyMessages() here stay a separate, one-way channel.
// Thread isolation: each ticket/message is one row with a stable `id` —
// replies always target that exact id (updateTicketStatus/markMessageRead),
// never a fuzzy client+subject lookup — same guarantee as the local
// clientTrackingStore.js contract (tested in local-check-adapters.mjs and
// local-check-support-ordering.mjs).
// Classification: A — support_tickets fully confirmed; client_messages
// fully confirmed but is a distinct one-way channel (see above), a product
// decision is needed on whether V2's "announcements" reuse it.
// ============================================================
import { assertProductionAdapterActive } from './_guard'
import {
  submitSupportTicket, submitAdminTicket, fetchSupportTickets, updateTicketStatus,
  subscribeToSupportTickets, fetchMyTickets, fetchMyMessages, markMessageRead,
  subscribeToMyCommunications, sendAdminMessage, TICKET_STATUS_LABELS, TICKET_CATEGORY_LABELS,
} from '../../../lib/api'

function guard() { assertProductionAdapterActive('support.supabase.js') }

export function createTicket(payload) { guard(); return submitSupportTicket(payload) }
export function createInternalTicket(payload) { guard(); return submitAdminTicket(payload) }
export function getAllTickets() { guard(); return fetchSupportTickets() }
export function updateTicket(ticketId, status, response) { guard(); return updateTicketStatus(ticketId, status, response) }
export function subscribeTickets(callback) { guard(); return subscribeToSupportTickets(callback) }
export { TICKET_STATUS_LABELS, TICKET_CATEGORY_LABELS }

export function getMyTickets() { guard(); return fetchMyTickets() }
export function getMyMessages() { guard(); return fetchMyMessages() }
export function markRead(messageId) { guard(); return markMessageRead(messageId) }
export function subscribeMine(userId, callback) { guard(); return subscribeToMyCommunications(userId, callback) }
export function sendMessage(payload) { guard(); return sendAdminMessage(payload) }
