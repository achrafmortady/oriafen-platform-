import { getClientSends, getAdminSendStatus } from './clientTrackingStore'
import { getClientDocuments } from './documentsStore'

// Vue "Clients" admin — dérive un état de dossier lisible par client à
// partir des mêmes données locales déjà utilisées ailleurs dans le CRM
// (leads avec stage === 'Client', + clientTrackingStore pour seenAt /
// openedAt / repliedAt). Aucune nouvelle source de données : uniquement de
// la lecture + un calcul déterministe (basé sur l'id du lead) pour simuler
// une progression de dossier ORIAS cohérente en démonstration locale.

export const ORIAS_STEPS = [
  'Consultation initiale',
  'Montage dossier',
  'Structure juridique',
  'Soumission ORIAS',
  'Obtention ORIAS',
  'Lancement activité',
]

const REQUIRED_DOCS_COUNT = 6
const FORMATION_TOTAL_HOURS = 150

function parseLocalDate(value) {
  if (!value) return 0
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4}) · (\d{2}):(\d{2})$/)
  if (!match) return new Date(value).getTime() || 0
  return new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}:00`).getTime()
}

// `lead` (optionnel) : quand fourni, les entrées de lead.activity (dont les
// évènements "Prochaine action créée/modifiée", "Échéance modifiée",
// "Responsable modifié", "Prochaine action terminée" — voir patch() dans
// LocalCRM.jsx) participent aussi au calcul de la dernière activité, au même
// titre que les évènements de suivi des envois. Additif uniquement : aucun
// évènement existant n'est retiré du calcul.
function lastActivityEvent(clientId, lead) {
  const items = getClientSends(clientId)
  const events = []
  items.forEach(item => {
    if (item.repliedAt) events.push({ label: 'Réponse envoyée', at: item.repliedAt })
    if (item.openedAt) events.push({ label: 'Document ouvert', at: item.openedAt })
    if (item.seenAt) events.push({ label: 'Message vu', at: item.seenAt })
    if (item.sentAt) events.push({ label: 'Message envoyé', at: item.sentAt })
  })
  ;(lead?.activity || []).forEach(entry => {
    if (entry?.text && entry?.at) events.push({ label: entry.text, at: entry.at })
  })
  events.sort((a, b) => parseLocalDate(b.at) - parseLocalDate(a.at))
  return events[0] || null
}

function hasItemToRelaunch(clientId) {
  return getClientSends(clientId).some(item => getAdminSendStatus(item).key === 'remind')
}

function hasPendingReply(clientId) {
  return getClientSends(clientId).some(item => item.responseRequired && item.status !== 'replied')
}

// Un document a été rejeté puis remplacé par le client (nouvelle version
// 'pending' au-dessus d'une version historisée 'missing') : l'équipe doit
// vérifier ce remplacement avant de le valider ou de le rejeter à nouveau.
function hasDocumentAwaitingRevalidation(clientId) {
  const docs = getClientDocuments(clientId)
  return Object.values(docs).some(doc =>
    doc.status === 'pending' && (doc.versions || []).some(v => v.status === 'missing')
  )
}

function deriveDossier(lead) {
  const stepIndex = lead.id % ORIAS_STEPS.length
  const step = ORIAS_STEPS[stepIndex]
  const progressPct = Math.round(((stepIndex + 1) / ORIAS_STEPS.length) * 100)

  const validDocs = Math.min(REQUIRED_DOCS_COUNT, stepIndex + (lead.id % 2))
  const pendingDocs = lead.id % 2 === 0 && validDocs < REQUIRED_DOCS_COUNT ? 1 : 0
  const missingDocs = Math.max(0, REQUIRED_DOCS_COUNT - validDocs - pendingDocs)

  const formationDoneH = Math.min(FORMATION_TOTAL_HOURS, (lead.id * 13) % (FORMATION_TOTAL_HOURS + 1))

  const activity = lastActivityEvent(lead.id, lead)
  const toRelaunch = hasItemToRelaunch(lead.id)
  const awaitingReply = hasPendingReply(lead.id)
  const awaitingDocRevalidation = hasDocumentAwaitingRevalidation(lead.id)

  // Le statut repose sur l'étape/les documents (déterministe, stable dans le
  // temps). Le signal "à relancer" du tracking local (dates dépassées) n'est
  // volontairement pas le déclencheur principal ici : comme il devient vrai
  // pour quasi tous les clients de démo une fois quelques jours passés, il
  // servirait mal la lisibilité "un coup d'oeil" demandée — il reste
  // consulté pour affiner la prochaine action ci-dessous.
  let status
  if (stepIndex >= ORIAS_STEPS.length - 2 && missingDocs === 0) status = 'Complété'
  else if (missingDocs >= 4) status = 'Bloqué'
  else if (missingDocs >= 2) status = 'À relancer'
  else status = 'En cours'

  // "Vérifier le document remplacé" prime sur tout le reste tant qu'il est
  // vrai : un document remplacé par le client attend une action concrète de
  // l'équipe (valider ou rejeter à nouveau), quel que soit le statut global
  // du dossier — même un dossier par ailleurs "Complété" doit remonter ça.
  // BUG corrigé (détecté en écrivant les tests "Prochaine action") : `toRelaunch`
  // était calculé plus haut et le commentaire promettait qu'il servirait à
  // "affiner la prochaine action ci-dessous", mais aucune branche ne le lisait
  // réellement — un envoi effectivement en retard de relance (signal réel du
  // tracking) n'avait donc jamais d'impact sur "Prochaine action" tant que le
  // statut synthétique du dossier (basé sur missingDocs) n'était pas déjà
  // "À relancer". Il est maintenant bien pris en compte, en plus (jamais à la
  // place) du statut synthétique existant — aucun comportement précédent n'est retiré.
  let nextAction
  if (awaitingDocRevalidation) nextAction = 'Vérifier le document remplacé'
  else if (status === 'Complété') nextAction = 'Aucune action'
  else if (status === 'À relancer' || toRelaunch) nextAction = 'Relancer le client'
  else if (status === 'Bloqué') nextAction = missingDocs > 0 ? 'Attendre document' : 'Vérifier le dossier'
  else if (awaitingReply) nextAction = 'Attendre réponse'
  else if (missingDocs > 0) nextAction = 'Attendre document'
  else nextAction = 'Vérifier le dossier'

  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    city: lead.city,
    pack: lead.pack,
    owner: lead.owner,
    // Champs bruts du lead, passés tels quels pour la vue 360° de la fiche
    // Client (identité/origine, message initial, parcours CRM, RDV/tâches) —
    // additif uniquement, aucun champ existant ci-dessus n'est modifié.
    source: lead.source,
    stage: lead.stage,
    message: lead.message ?? null,
    leadActivity: lead.activity || [],
    lastActivityAt: lead.lastActivityAt ?? null,
    appointments: lead.appointments || [],
    tasks: lead.tasks || [],
    // Pricing du pack — conservé tel quel après conversion prospect -> client
    // (mêmes champs que ceux définis côté Nouveau prospect / fiche Prospect).
    packId: lead.packId ?? null,
    pricingMode: lead.pricingMode ?? null,
    discountPercent: lead.discountPercent ?? null,
    basePrice: lead.basePrice ?? null,
    finalPrice: lead.finalPrice ?? null,
    paymentValidated: lead.paymentValidated ?? false,
    convertedAt: lead.convertedAt ?? null,
    payments: lead.payments || [],
    step,
    stepIndex,
    progressPct,
    validDocs,
    pendingDocs,
    missingDocs,
    formationDoneH,
    formationTotalH: FORMATION_TOTAL_HOURS,
    lastActivity: activity,
    nextAction,
    status,
  }
}

const STATUS_PRIORITY = { 'Bloqué': 0, 'À relancer': 1, 'En cours': 2, 'Complété': 3 }

export function buildClientsOverview(leads) {
  // Reproduit le comportement live : un lead status='client' n'apparaît
  // dans la vue Clients qu'une fois le paiement réellement validé
  // (converted_user_id côté live ; paymentValidated côté local — voir
  // src/local/conversion.js). Un simple changement de statut CRM ne suffit
  // jamais à faire apparaître un prospect ici.
  const rows = (leads || [])
    .filter(l => l.stage === 'Client' && l.paymentValidated)
    .map(deriveDossier)
    .sort((a, b) => (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9))

  const kpis = {
    actifs: rows.filter(r => r.status !== 'Complété').length,
    bloques: rows.filter(r => r.status === 'Bloqué').length,
    aRelancer: rows.filter(r => r.status === 'À relancer').length,
    obtenus: rows.filter(r => r.status === 'Complété').length,
  }

  return { rows, kpis }
}
