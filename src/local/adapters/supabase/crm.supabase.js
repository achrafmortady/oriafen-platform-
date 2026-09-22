// ============================================================
// CRM — production implementation (NOT activated, see ./_guard.js).
// Thin wrapper around src/lib/api.js (V1, unmodified) — no business rule
// is reimplemented here, every function below delegates to the real one.
//
// Confirmed columns (read-only from api.js, `leads` select is always '*'
// so only fields touched by update/insert are confirmed):
//   status (LEAD_STATUSES: nouveau/rdv_pris/qualifie/a_relancer/engage/
//     client/injoignable/perdu — api.js:782), notes, first_name, last_name,
//     email, phone, city, assigned_to, pack_id, potential_amount,
//     discount_percent, amount_basis, converted_user_id, created_at.
//   lead_appointments: lead_id, scheduled_at, type, status.
//   lead_tasks: lead_id, title, due_at, done.
//   lead_activity: lead_id, type, description, created_at.
// Payment gate: convertLeadToClient() (api.js:1082) is the ONLY function
// that sets converted_user_id — mirrors the local canSetStageToClient()
// invariant (conversion.js) exactly: a lead is never a real client without
// going through this one function.
// ============================================================
import { assertProductionAdapterActive } from './_guard'
import {
  fetchLeads, updateLeadStatus, updateLeadNotes, updateLeadInfo, assignLead, subscribeToLeads,
  fetchLeadAppointments, addLeadAppointment, updateAppointmentStatus,
  fetchLeadTasks, addLeadTask, toggleTaskDone,
  setLeadPack, setLeadPricing, convertLeadToClient,
  fetchLeadActivity, addLeadNote, LEAD_STATUSES,
} from '../../../lib/api'

function guard() { assertProductionAdapterActive('crm.supabase.js') }

export function listLeads() { guard(); return fetchLeads() }
export function subscribe(callback) { guard(); return subscribeToLeads(callback) }

// Statut / étape — le gate paiement vit dans convertLeadToClient() ci-dessous,
// JAMAIS ici : changer `status` à 'client' sans passer par convertLeadToClient
// ne doit jamais être exposé comme un chemin valide par l'UI appelante (même
// contrat que canSetStageToClient côté Preview, conversion.js).
export function changeStatus(leadId, status) { guard(); return updateLeadStatus(leadId, status) }
export { LEAD_STATUSES }

export function updateNotes(leadId, notes) { guard(); return updateLeadNotes(leadId, notes) }
export function updateInfo(leadId, payload) { guard(); return updateLeadInfo(leadId, payload) }
export function assign(leadId, userId) { guard(); return assignLead(leadId, userId) }

export function getAppointments(leadId) { guard(); return fetchLeadAppointments(leadId) }
export function bookAppointment(leadId, payload) { guard(); return addLeadAppointment(leadId, payload) }
export function updateAppointment(appointmentId, status) { guard(); return updateAppointmentStatus(appointmentId, status) }

export function getTasks(leadId) { guard(); return fetchLeadTasks(leadId) }
export function addTask(leadId, payload) { guard(); return addLeadTask(leadId, payload) }
export function toggleTask(taskId, done) { guard(); return toggleTaskDone(taskId, done) }

export function setPack(leadId, payload) { guard(); return setLeadPack(leadId, payload) }
export function setPricing(leadId, payload) { guard(); return setLeadPricing(leadId, payload) }

// Conversion — SEULE fonction qui fait réellement d'un prospect un client
// (fixe converted_user_id). Ne jamais dupliquer cette logique ailleurs.
export function convertToClient(lead) { guard(); return convertLeadToClient(lead) }

export function getActivity(leadId) { guard(); return fetchLeadActivity(leadId) }
export function addNote(leadId, note) { guard(); return addLeadNote(leadId, note) }
