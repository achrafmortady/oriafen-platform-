// Historique 360° partagé (fiche Prospect + fiche Client) — fusionne deux
// sources de données volontairement distinctes plutôt que de tout forcer
// dans une seule table :
//   - AVANT conversion : lead.activity (notes, appels, emails, RDV, tâches,
//     changements d'étape — stocké sur l'objet lead dans localStorage,
//     géré par patch() dans LocalCRM.jsx)
//   - APRÈS conversion : src/local/activityLog.js (messages/documents/
//     notifications — déjà alimenté automatiquement par clientTrackingStore
//     et documentsStore)
// lead.id === clientId (même identifiant avant/après conversion dans cette
// démo locale), donc les deux sources se rejoignent sans table de mapping.
//
// Règle stricte : aucune date n'est inventée. Une entrée dont la date brute
// n'est pas interprétable garde `display: null` (l'appelant doit alors
// afficher "Non renseigné"), elle n'est jamais masquée ni datée au hasard.

import { getActivityLog, logActivity } from './activityLog'
import { toDisplayDateSafe, toTimestampSafe, formatNowLabel, formatDueDateLabel } from './dateUtils'

// Reprend EXACTEMENT STATUS_BADGE_STYLES (src/pages/admin/Dashboard.jsx,
// fichier live non modifié, lu en lecture seule) — mêmes classes de couleur
// Tailwind par statut, dans le même ordre que `stages` (src/local/model.js).
// "RDV pris" retiré (n'est plus une étape CRM, voir model.js). Module .js
// (pas .jsx) pour rester importable tel quel par les scripts de test Node
// (pas de transform JSX ici).
export const STAGE_BADGE_STYLES = {
  'Nouveau':                    'bg-blue-100 text-blue-700 border-blue-200',
  'Intéressé – à relancer':     'bg-teal-100 text-teal-700 border-teal-200',
  'Qualifié':                   'bg-amber-100 text-amber-700 border-amber-200',
  'Engagé (Commit)':            'bg-orange-100 text-orange-700 border-orange-200',
  'Client':                     'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Injoignable':                'bg-red-100 text-red-600 border-red-200',
  'Perdu':                      'bg-gray-100 text-gray-500 border-gray-200',
}

function fromLeadActivity(entry) {
  return {
    key: `lead:${entry.text}:${entry.at}`,
    author: 'Équipe',
    action: entry.text,
    detail: null,
    at: entry.at,
    display: toDisplayDateSafe(entry.at),
    ts: toTimestampSafe(entry.at),
    source: 'lead_activity',
  }
}

function fromActivityLog(entry) {
  return {
    key: `log:${entry.id}`,
    author: entry.author,
    action: entry.action,
    detail: entry.detail,
    at: entry.at,
    display: toDisplayDateSafe(entry.at),
    ts: entry.sortTs ?? toTimestampSafe(entry.at),
    source: 'activity_log',
  }
}

// Timeline complète triée du plus récent au plus ancien. `ts=null` (donc
// date non interprétable) est trié en dernier, jamais mélangé aveuglément.
export function buildLeadTimeline(lead, clientId) {
  const fromLead = (lead?.activity || []).map(fromLeadActivity)
  const fromLog = (getActivityLog(clientId ?? lead?.id) || []).map(fromActivityLog)
  return [...fromLead, ...fromLog].sort((a, b) => {
    if (a.ts == null && b.ts == null) return 0
    if (a.ts == null) return 1
    if (b.ts == null) return -1
    return b.ts - a.ts
  })
}

// Dernière entrée lead.activity marquant le passage à l'étape "Client" (voir
// patch() dans LocalCRM.jsx : `'Étape : ' + e.target.value`). null si le
// prospect n'a jamais été marqué "Client", ou si l'entrée n'a pas de date
// interprétable.
export function findConversionEntry(lead) {
  const entries = (lead?.activity || []).filter(e => e.text === 'Étape : Client')
  if (!entries.length) return null
  const withTs = entries
    .map(e => ({ ...e, ts: toTimestampSafe(e.at) }))
    .sort((a, b) => (b.ts ?? -1) - (a.ts ?? -1))
  return withTs[0]
}

// Commentaire manuel ajouté depuis la fiche Client (section "Historique
// complet"). Écrit dans activity_log (post-conversion), jamais dans
// lead.activity — distinct de "Notes internes" côté Prospect (append-only,
// horodaté, jamais une note générale modifiable). Un texte vide/blanc est
// ignoré (renvoie false), jamais un faux évènement dans l'historique.
export function addManualComment(clientId, text) {
  const clean = (text || '').trim()
  if (!clientId || !clean) return false
  logActivity(clientId, { author: 'Équipe', action: 'Commentaire ajouté', detail: clean })
  return true
}

// Changement de statut client (fiche Client, select "Statut") — pure
// fonction (pas d'effet de bord) : renvoie un NOUVEAU tableau `leads` avec
// le lead ciblé mis à jour et un évènement "Statut changé : ancien ->
// nouveau" ajouté en tête de son historique, avec l'horodatage exact du
// changement. Aucun appel réseau/Supabase ici — à l'appelant de persister
// le résultat (localStorage) comme il le fait déjà pour toute autre
// mutation locale de `leads`.
export function applyStatusChange(leads, clientId, newStage) {
  const current = leads.find(l => l.id === clientId)
  const oldStage = current?.stage || 'Inconnu'
  if (oldStage === newStage) return leads
  return leads.map(l => l.id === clientId
    ? { ...l, stage: newStage, activity: [{ text: `Statut changé : ${oldStage} -> ${newStage}`, at: formatNowLabel() }, ...(l.activity || [])] }
    : l)
}

// Prochaine action (fiche Prospect/Client, section "Prochaine action" dans
// LocalCRM.jsx) — toute création/modification de l'action, replanification
// (échéance), réassignation (responsable) ou passage à "terminée" doit
// alimenter automatiquement l'historique (append-only, jamais d'écrasement)
// ET mettre à jour lead.lastActivityAt sur le même horodatage exact, lu par
// "Dernière activité" (clientsOverviewData.js) en plus des envois de suivi.
// Fonction pure (pas d'effet de bord), réutilisée telle quelle par l'UI
// (LocalCRM.jsx) et par les tests (local-check-tracking.mjs, §N).
//
// field: 'action' | 'due' | 'owner' | 'done'
export function applyNextActionUpdate(leads, leadId, field, value) {
  const lead = leads.find(l => l.id === leadId)
  if (!lead) return leads
  const now = formatNowLabel()
  let data = {}
  let text = null
  if (field === 'action') {
    data.action = value
    const trimmed = (value || '').trim()
    if (trimmed) {
      const wasEmpty = !lead.action || !lead.action.trim()
      text = wasEmpty ? `Prochaine action créée — ${trimmed}` : `Prochaine action modifiée — ${trimmed}`
    }
  } else if (field === 'due') {
    data.due = value
    if (value) text = `Échéance modifiée — ${formatDueDateLabel(value)}`
  } else if (field === 'owner') {
    data.owner = value
    text = `Responsable modifié — ${value}`
  } else if (field === 'done') {
    data.done = value
    const label = (lead.action || '').trim() || 'Sans titre'
    text = value ? `Prochaine action terminée — ${label}` : `Prochaine action réouverte — ${label}`
  } else {
    return leads
  }
  return leads.map(l => l.id === leadId
    ? { ...l, ...data, ...(text ? { activity: [{ text, at: now }, ...(l.activity || [])], lastActivityAt: now } : {}) }
    : l)
}

// Plus ancienne entrée lead.activity avec une date interprétable — la
// "première entrée" CRM du prospect. null si aucune entrée n'a de date
// exploitable (jamais de date inventée en repli).
export function findFirstEntry(lead) {
  const withTs = (lead?.activity || [])
    .map(e => ({ ...e, ts: toTimestampSafe(e.at) }))
    .filter(e => e.ts != null)
    .sort((a, b) => a.ts - b.ts)
  return withTs[0] || null
}
