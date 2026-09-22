// ============================================================
// CRM ADAPTER — enveloppe fine autour de model.js/clientHistory.js/
// relance.js/appointments.js/conversion.js (localStorage, `leads` en
// mémoire tenu par LocalCRM.jsx). Contrat de câblage préparé pour
// réutiliser `leads` (Supabase, table déjà existante côté V1, non modifiée)
// — voir src/lib/api.js (fetchLeads, updateLeadStatus, updateLeadNextAction,
// addLeadComment, scheduleFollowUp, convertLeadToClient — lus en lecture
// seule) et docs/PRODUCTION_WIRING_PLAN.md.
//
// Classification (voir docs/PRODUCTION_WIRING_PLAN.md §8) : A — le schéma
// `leads`/`lead_appointments`/`lead_tasks` existe déjà côté live, aucune
// nouvelle table nécessaire. Reconnexion = remplacer les appels ci-dessous
// par leurs équivalents api.js une fois l'authentification réelle en place.
//
// AUCUNE règle métier n'est modifiée ici : le gate de paiement
// (canSetStageToClient / applyPaymentValidation, conversion.js) reste
// strictement identique et est réexporté tel quel, jamais réimplémenté —
// un seul point de vérité, que ce soit appelé depuis LocalCRM.jsx
// directement ou (en production) depuis ce contrat d'adaptateur.
// ============================================================
import { ADAPTER_MODE } from './identity'
import { selectLeads, sortRecentFirst, seed as seedDemoLeads } from '../model'
import {
  buildLeadTimeline, addManualComment, applyStatusChange, applyNextActionUpdate,
} from '../clientHistory'
import { relanceReason, isToRelaunch, isRelanceOverdue, scheduleRelance, clearRelance, RELANCE_STAGE } from '../relance'
import { addAppointment, markAppointmentDone, APPOINTMENT_TYPE_LABELS } from '../appointments'
import { applyPaymentValidation, canSetStageToClient, PAYMENT_GATE_MESSAGE } from '../conversion'

function assertLocalMode() {
  if (ADAPTER_MODE !== 'local') throw new Error('crmAdapter: mode "supabase" non implémenté — voir docs/PRODUCTION_WIRING_PLAN.md')
}

// Prospects — lecture/filtrage/tri. `seedDemoLeads` n'est appelée qu'en
// Preview (localStorage vide) ; le contrat production remplacera cet appel
// par fetchLeads() (api.js), jamais par une génération de données ici.
export function listLeads(leads, filter) { assertLocalMode(); return selectLeads(leads, filter) }
export function sortLeadsRecentFirst(leads) { assertLocalMode(); return sortRecentFirst(leads) }
export function seedDemoData() { assertLocalMode(); return seedDemoLeads() }

// Statut / étape CRM — le gate paiement (bloque tout passage à "Client"
// sans paymentValidated) est appliqué DANS applyStatusChange lui-même
// (clientHistory.js), jamais recontrôlé séparément ici.
export function changeStatus(leads, leadId, newStage, reason) { assertLocalMode(); return applyStatusChange(leads, leadId, newStage, reason) }
export { canSetStageToClient, PAYMENT_GATE_MESSAGE }

// Prochaine action (action/échéance/responsable/terminée) — une seule
// fonction pure, alimente l'historique automatiquement.
export function updateNextAction(leads, leadId, field, value) { assertLocalMode(); return applyNextActionUpdate(leads, leadId, field, value) }

// Historique 360° (commentaires manuels + évènements automatiques).
export function getTimeline(lead, clientId) { assertLocalMode(); return buildLeadTimeline(lead, clientId) }
export function addComment(clientId, text) { assertLocalMode(); return addManualComment(clientId, text) }

// Relances — signal réel de tracking (dates dépassées), distinct du statut
// CRM synthétique (voir clientsOverviewData.js).
export function getRelanceReason(lead) { assertLocalMode(); return relanceReason(lead) }
export function checkToRelaunch(lead) { assertLocalMode(); return isToRelaunch(lead) }
export function checkRelanceOverdue(lead) { assertLocalMode(); return isRelanceOverdue(lead) }
export function scheduleFollowUp(leads, leadId, payload) { assertLocalMode(); return scheduleRelance(leads, leadId, payload) }
export function clearFollowUp(leads, leadId) { assertLocalMode(); return clearRelance(leads, leadId) }
export { RELANCE_STAGE }

// RDV — indépendants de l'étape CRM (voir appointments.js).
export function bookAppointment(leads, leadId, payload) { assertLocalMode(); return addAppointment(leads, leadId, payload) }
export function completeAppointment(leads, leadId, appointmentId) { assertLocalMode(); return markAppointmentDone(leads, leadId, appointmentId) }
export { APPOINTMENT_TYPE_LABELS }

// Conversion / paiement — réexporté tel quel depuis conversion.js (même
// fonction que formationAdapter.js expose déjà côté Formation/Dossier) :
// un SEUL point de vérité pour "valider le paiement & créer le compte",
// jamais une seconde implémentation ici.
export function convertToClient(leads, leadId) { assertLocalMode(); return applyPaymentValidation(leads, leadId) }
