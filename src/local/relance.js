// "Clients à relancer" (feedback #6) — règle UNIQUE et explicite :
//
// Un prospect entre dans "Clients à relancer" quand :
//   - une relance explicite est programmée (lead.relance.at défini), OU
//   - le prospect est à l'étape "Intéressé – à relancer" (sans qu'une date
//     précise soit nécessairement programmée).
// Il en sort quand :
//   - la relance programmée est annulée/terminée (lead.relance devient null)
//     ET
//   - l'étape n'est plus "Intéressé – à relancer".
//
// La relance (date/heure + note) est indépendante de "Prochaine action" :
// "Prochaine action" est le champ générique de suivi (n'importe quelle
// tâche), la relance est spécifiquement une reprise de contact programmée
// sur un prospect qui ne progresse plus. Les deux peuvent coexister.
//
// Fonctions pures (pas d'effet de bord), même convention que
// applyNextActionUpdate (clientHistory.js).

import { formatNowLabel, toDisplayDateSafe, toTimestampSafe } from './dateUtils'

export const RELANCE_STAGE = 'Intéressé – à relancer'

// Raison lisible affichée sur la carte Kanban / la ligne de liste / la fiche.
// null si le prospect n'est pas concerné par "Clients à relancer".
export function relanceReason(lead) {
  if (lead?.relance?.at) {
    const display = toDisplayDateSafe(lead.relance.at) || lead.relance.at
    return `Relance prévue le ${display}${lead.relance.note ? ` — ${lead.relance.note}` : ''}`
  }
  if (lead?.stage === RELANCE_STAGE) return 'À relancer — aucune date définie'
  return null
}

export function isToRelaunch(lead) {
  return relanceReason(lead) != null
}

export function isRelanceOverdue(lead) {
  const ts = toTimestampSafe(lead?.relance?.at)
  return ts != null && ts < Date.now()
}

// value : valeur brute d'un <input type="datetime-local"> (YYYY-MM-DDTHH:MM).
export function scheduleRelance(leads, leadId, { at, note }) {
  if (!at) return leads
  const now = formatNowLabel()
  const display = toDisplayDateSafe(at) || at
  const cleanNote = (note || '').trim()
  return leads.map(l => l.id === leadId
    ? {
        ...l,
        relance: { at, note: cleanNote },
        activity: [{ text: `Relance programmée — ${display}${cleanNote ? ` (${cleanNote})` : ''}`, at: now }, ...(l.activity || [])],
        lastActivityAt: now,
      }
    : l)
}

export function clearRelance(leads, leadId) {
  const lead = leads.find(l => l.id === leadId)
  if (!lead?.relance) return leads
  const now = formatNowLabel()
  return leads.map(l => l.id === leadId
    ? { ...l, relance: null, activity: [{ text: 'Relance annulée', at: now }, ...(l.activity || [])], lastActivityAt: now }
    : l)
}
