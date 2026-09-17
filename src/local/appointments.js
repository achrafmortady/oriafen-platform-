// RDV planifiés sur la fiche Prospect/Client — fonctions pures (pas d'effet
// de bord), même convention que applyNextActionUpdate (clientHistory.js) :
// une action utilisateur = un appel = UNE entrée d'historique.
//
// "RDV effectué" ne touche jamais `lead.stage` : le rendez-vous et l'étape du
// pipeline CRM restent deux notions séparées (voir feedback #5 — ne pas
// recréer "RDV pris" comme étape). Le choix de l'étape suivante après un RDV
// effectué reste une action distincte de l'utilisateur (bouton dédié dans
// LocalCRM.jsx, qui réutilise patch()/le select Statut existant).

import { formatNowLabel } from './dateUtils'

export const APPOINTMENT_TYPE_LABELS = { appel: 'Appel téléphonique', visio: 'Visio', presentiel: 'En personne' }

export function addAppointment(leads, leadId, { scheduledAt, type }) {
  if (!scheduledAt) return leads
  const now = formatNowLabel()
  const label = APPOINTMENT_TYPE_LABELS[type] || type
  return leads.map(l => l.id === leadId
    ? {
        ...l,
        appointments: [...(l.appointments || []), { id: Date.now(), scheduledAt, type, status: 'planifie' }],
        activity: [{ text: `RDV planifié (${label}) — ${scheduledAt}`, at: now }, ...(l.activity || [])],
        lastActivityAt: now,
      }
    : l)
}

// Marque UN rendez-vous comme effectué. Idempotent : un RDV déjà effectué
// n'ajoute pas une deuxième entrée d'historique si le bouton est cliqué à
// nouveau (ex: double clic accidentel).
export function markAppointmentDone(leads, leadId, appointmentId) {
  const lead = leads.find(l => l.id === leadId)
  if (!lead) return leads
  const appt = (lead.appointments || []).find(a => a.id === appointmentId)
  if (!appt || appt.status === 'effectue') return leads
  const now = formatNowLabel()
  const label = APPOINTMENT_TYPE_LABELS[appt.type] || appt.type
  return leads.map(l => l.id === leadId
    ? {
        ...l,
        appointments: l.appointments.map(a => a.id === appointmentId ? { ...a, status: 'effectue', completedAt: now } : a),
        activity: [{ text: `RDV effectué (${label}) — ${appt.scheduledAt}`, at: now }, ...(l.activity || [])],
        lastActivityAt: now,
      }
    : l)
}
