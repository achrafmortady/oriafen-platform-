import { getClientSends, getAdminSendStatus } from './clientTrackingStore'
import { getClientDocuments } from './documentsStore'
import { REQUIRED_DOCUMENTS } from '../data/mockData'
import { getDossierStep } from './dossierStepStore'
import { getFormationState } from './formationProgressStore'

// Vue "Clients" admin — dérive un état de dossier lisible par client à
// partir des mêmes données locales déjà utilisées ailleurs dans le CRM
// (leads avec stage === 'Client', + clientTrackingStore pour seenAt /
// openedAt / repliedAt).
//
// Correctif (audit "final data consistency" 2026-09-20) : step/documents/
// heures de formation étaient calculés par une formule synthétique basée
// sur `lead.id % ...` — jamais lue nulle part ailleurs, donc jamais mise à
// jour par une action réelle (faire avancer une étape depuis l'onglet
// Dossiers, valider un document, terminer un chapitre) et donc TOUJOURS en
// désaccord avec les pages détaillées (Dossiers, Documents, Formation IAS1)
// pour le même client. Lit désormais les MÊMES stores que ces pages
// détaillées (dossierStepStore/documentsStore/formationProgressStore) —
// aucune nouvelle donnée, seulement le même calcul déterministe réutilisé
// comme valeur PAR DÉFAUT tant qu'aucune action réelle n'a eu lieu pour ce
// client (jamais un doublon : dès qu'une action réelle existe, elle prime
// toujours sur la valeur par défaut, exactement comme dossierStepStore.js
// le fait déjà pour l'étape).

export const ORIAS_STEPS = [
  'Consultation initiale',
  'Montage dossier',
  'Structure juridique',
  'Soumission ORIAS',
  'Obtention ORIAS',
  'Lancement activité',
]

const REQUIRED_DOCS_COUNT = REQUIRED_DOCUMENTS.length

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

// Étape par défaut (avant toute action admin réelle) — exportée pour être
// réutilisée telle quelle par les autres vues (ex: LocalMonDossier.jsx côté
// client) plutôt que dupliquée.
//
// Correctif "timeline d'un nouveau client incorrecte" (audit inspection
// navigateur, 2026-09-26) : reposait sur `clientId % ORIAS_STEPS.length`,
// une formule qui donnait un "hasard" déterministe pratique pour varier les
// clients de démonstration (ids petits 1-24) — mais un vrai client converti
// a un id = Date.now() (13 chiffres), donc un modulo qui pouvait retomber
// sur n'importe quelle étape 1-6, y compris tard dans le parcours, pour un
// dossier qui vient tout juste d'être créé. Toujours 0 (étape 1) tant
// qu'aucune action admin réelle n'a eu lieu (setDossierStep prime toujours
// sur cette valeur par défaut, voir dossierStepStore.getDossierStep).
export function defaultStepIndexFor() {
  return 0
}

function deriveDossier(lead) {
  // Étape : dossierStepStore est la SEULE source de vérité une fois qu'une
  // action réelle a eu lieu (même store que l'onglet admin "Dossiers" et
  // le widget client "Mon Dossier") — la formule ci-dessus ne sert plus que
  // de valeur par défaut tant qu'aucune étape n'a jamais été validée.
  const defaultStep = defaultStepIndexFor(lead.id) + 1
  const stepNumber = getDossierStep(lead.id, defaultStep)
  const stepIndex = stepNumber - 1
  const step = ORIAS_STEPS[stepIndex]
  const progressPct = Math.round(((stepIndex + 1) / ORIAS_STEPS.length) * 100)

  // Formation : somme réelle des heures complétées/totales par unité, même
  // store que LocalMaFormation.jsx (page détaillée) et le widget client —
  // le total n'est plus une constante dupliquée (150) mais la somme réelle
  // de FORMATION_UNITS, à jour même si le catalogue d'unités change.
  const formationUnits = getFormationState(lead.id).units
  const formationDoneH = formationUnits.reduce((sum, u) => sum + u.completedHours, 0)
  const formationTotalH = formationUnits.reduce((sum, u) => sum + u.totalHours, 0)

  // Dernière activité calculée AVANT toute lecture de documentsStore : un
  // document seedé 'missing' (démo) déclenche à la lecture un rattrapage
  // idempotent de notification/journal horodaté "maintenant" (voir
  // backfillDocActivity) — lu après coup, il fausserait "Dernière activité"
  // en se glissant devant un évènement CRM réel du même instant.
  const activity = lastActivityEvent(lead.id, lead)
  const toRelaunch = hasItemToRelaunch(lead.id)
  const awaitingReply = hasPendingReply(lead.id)

  // Documents : mêmes catégories/statuts que LocalMesDocuments.jsx (page
  // détaillée) — validDocs/pendingDocs comptés sur REQUIRED_DOCUMENTS,
  // missingDocs regroupe rejeté ('missing'), correction demandée et non
  // soumis ('none'), comme le fait déjà le résumé à 3 catégories affiché
  // ici et sur le widget client (jamais une 4e catégorie ajoutée à l'UI).
  const docs = getClientDocuments(lead.id)
  const validDocs = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'valid').length
  const pendingDocs = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'pending').length
  const missingDocs = REQUIRED_DOCS_COUNT - validDocs - pendingDocs
  // Correctif "nouveau client Bloqué à 67%" (audit inspection navigateur,
  // 2026-09-26) : un client fraîchement converti démarre désormais avec 6/6
  // documents 'none' (jamais envoyés — voir documentsStore.js). missingDocs
  // (ci-dessus) les compte comme "incomplet", ce qui est correct pour
  // l'affichage des compteurs — mais le STATUT global se basait sur ce même
  // total, faisant passer TOUT nouveau client à "Bloqué" (>=4) alors qu'il
  // n'a simplement encore rien soumis. "Bloqué" doit signaler un vrai
  // problème (documents refusés par l'équipe), jamais "n'a pas encore
  // commencé" — rejectedDocs isole donc les seuls documents réellement
  // refusés ('missing'/'correction', jamais 'none') pour ce seuil.
  const rejectedDocs = REQUIRED_DOCUMENTS.filter(r => ['missing', 'correction'].includes(docs[r.id]?.status)).length
  const awaitingDocRevalidation = hasDocumentAwaitingRevalidation(lead.id)

  // Le statut repose sur l'étape/les documents (déterministe, stable dans le
  // temps). Le signal "à relancer" du tracking local (dates dépassées) n'est
  // volontairement pas le déclencheur principal ici : comme il devient vrai
  // pour quasi tous les clients de démo une fois quelques jours passés, il
  // servirait mal la lisibilité "un coup d'oeil" demandée — il reste
  // consulté pour affiner la prochaine action ci-dessous.
  let status
  if (stepIndex >= ORIAS_STEPS.length - 2 && missingDocs === 0) status = 'Complété'
  else if (rejectedDocs >= 4) status = 'Bloqué'
  else if (rejectedDocs >= 2) status = 'À relancer'
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
    rejectedDocs,
    formationDoneH,
    formationTotalH,
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
    // Correctif "top KPI card" (2026-09-21) : total réel de clients
    // convertis (même filtre stage==='Client' && paymentValidated que
    // `rows` ci-dessus, donc TOUJOURS égal au dénominateur "X clients sur Y
    // prospects" affiché par la carte Conversion du CRM — voir
    // LocalCRM.jsx) — seule source de vérité, jamais un chiffre recalculé
    // ailleurs. Distinct de `actifs` (sous-ensemble : clients dont le
    // dossier n'est pas encore "Complété"), qui reste une métrique séparée.
    total: rows.length,
    actifs: rows.filter(r => r.status !== 'Complété').length,
    bloques: rows.filter(r => r.status === 'Bloqué').length,
    aRelancer: rows.filter(r => r.status === 'À relancer').length,
    obtenus: rows.filter(r => r.status === 'Complété').length,
  }

  return { rows, kpis }
}
