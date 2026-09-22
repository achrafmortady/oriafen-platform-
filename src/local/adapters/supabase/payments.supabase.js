// ============================================================
// PAYMENTS — production implementation (NOT activated, see ./_guard.js).
// Thin wrapper around src/lib/api.js (V1, unmodified). Finance calculations
// are NEVER reimplemented here — fetchFinanceSummary() is delegated as-is,
// super-admin-only per api.js:538 comment.
//
// Confirmed (read-only, api.js:496-572, 709):
//   payments: id, user_id (FK constraint name confirmed:
//     payments_user_id_public_users_fkey), pack_id, milestone
//     ('full'|'souscription'|'kbis_formation'|'orias'), amount_ht,
//     amount_ttc, discount_percent, status ('pending'|'paid'), paid_at,
//     created_at.
//   Finance ALWAYS sums amount_ttc, never amount_ht (api.js:490-495
//     comment) — regardless of how the admin entered the price. Not
//     changed here.
// Payment gate: convertLeadToClient() (crm.supabase.js) is the only path
// that creates the initial paid installment — markPaymentPaid() below is
// for SUBSEQUENT installments on an already-converted client, never a
// substitute for the conversion gate.
// ============================================================
import { assertProductionAdapterActive } from './_guard'
import { markPaymentPaid, fetchClientPayments, fetchFinanceSummary } from '../../../lib/api'

function guard() { assertProductionAdapterActive('payments.supabase.js') }

export function markPaid(paymentId) { guard(); return markPaymentPaid(paymentId) }
export function getClientPayments(userId) { guard(); return fetchClientPayments(userId) }

// Finance uniquement (super_admin) — jamais appelé depuis un contexte
// client/admin normal. Aucun calcul métier modifié.
export function getFinanceSummary() { guard(); return fetchFinanceSummary() }
