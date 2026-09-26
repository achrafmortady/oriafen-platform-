import { REQUIRED_DOCUMENTS } from '../data/mockData'
import { logActivity } from './activityLog'
import { addClientNotification } from './clientTrackingStore'
import { isCanonicalDemoClientId } from './adapters/identity'
import { addAdminNotification } from './adminNotificationsStore'

// Complète localement (aucun Supabase, aucun appel réseau) ce que le live
// gère déjà partiellement pour les documents client — mêmes conventions
// de statut que src/lib/api.js / MesDocuments.jsx :
//   'valid' | 'pending' | 'missing' (= rejeté) | 'correction' | 'none' (= rien envoyé)
// Complété ici : rejectedAt / rejectedBy, historique de versions,
// notification persistante au rejet (le live n'a ni l'un ni l'autre).
const STORAGE_KEY = 'oriafen-documents-v1'
const CHANGE_EVENT = 'oriafen-documents-change'

function nowLabel() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Correctif "double point 'complète..'" (audit inspection navigateur,
// 2026-09-26) : les messages de rejet ajoutaient toujours un "." après le
// motif, y compris quand celui-ci se terminait déjà par une ponctuation
// (ex: "...plus nette et complète." -> "...complète.."). Retire toute
// ponctuation finale avant de rajouter le point du message.
function withoutTrailingPunctuation(text) {
  return String(text || '').trim().replace(/[.!?]+$/, '')
}

function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

// État de démo déterministe — UNIQUEMENT pour le client de démo canonique
// (CANONICAL_DEMO_CLIENT_ID) : un mélange de statuts pour que la
// démonstration montre tout de suite un document rejeté, un en attente, un
// validé et un non soumis. Correctif "faux documents/rejets sur un nouveau
// client converti" (audit inspection navigateur, 2026-09-24) : cette
// fonction était appelée pour N'IMPORTE QUEL clientId encore absent du
// store, donc aussi pour chaque nouveau prospect réellement converti — un
// client fraîchement créé se retrouvait avec cin.pdf/domicile.pdf déjà
// "envoyés" et parfois "Refusé" alors qu'il n'avait rien téléversé. Voir
// emptyDocs() ci-dessous pour tout autre client.
function seedDocs(clientId) {
  const docs = {}
  REQUIRED_DOCUMENTS.forEach((req, i) => {
    const cycle = (Number(clientId) + i) % 4
    const status = ['valid', 'pending', 'missing', 'none'][cycle]
    const uploadedAt = status === 'none' ? null : nowLabel()
    const rejectionReason = status === 'missing'
      ? "Le document est illisible ou incomplet. Merci d'envoyer une version plus nette et complète."
      : null
    const rejectedAt = status === 'missing' ? uploadedAt : null
    const rejectedBy = status === 'missing' ? 'Équipe Oriafen' : null

    docs[req.id] = {
      category: req.id,
      categoryLabel: req.label,
      status,
      fileName: status === 'none' ? null : `${req.id}.pdf`,
      fileUrl: null,
      rejectionReason,
      rejectedAt,
      rejectedBy,
      uploadedAt,
      versions: uploadedAt ? [{
        id: `v1-${req.id}-${clientId}`,
        fileName: `${req.id}.pdf`,
        uploadedAt,
        status,
        rejectionReason,
        rejectedAt,
      }] : [],
    }
  })
  return docs
}

// État initial réel pour tout client hors démo : aucun document envoyé,
// aucun rejet — le client/l'admin doit explicitement ajouter/téléverser un
// document pour qu'un statut autre que 'none' apparaisse.
function emptyDocs() {
  const docs = {}
  REQUIRED_DOCUMENTS.forEach(req => {
    docs[req.id] = {
      category: req.id,
      categoryLabel: req.label,
      status: 'none',
      fileName: null,
      fileUrl: null,
      rejectionReason: null,
      rejectedAt: null,
      rejectedBy: null,
      uploadedAt: null,
      versions: [],
    }
  })
  return docs
}

function initialDocsFor(clientId) {
  return isCanonicalDemoClientId(clientId) ? seedDocs(clientId) : emptyDocs()
}

// Rejoue dans le journal + les notifications les rejets déjà connus d'un
// document — idempotent (dedupeKey), donc sûr à rappeler à chaque lecture.
// Couvre aussi bien l'état de démo initial (seedDocs) que tout document déjà
// présent en localStorage avant l'ajout de cette fonctionnalité.
function backfillDocActivity(clientId, doc) {
  if (doc.status !== 'missing' || !doc.rejectedAt) return
  const key = `doc-rejected:${doc.category}:${doc.rejectedAt}`

  logActivity(clientId, {
    author: 'Équipe',
    action: "Document rejeté par l'équipe",
    detail: `${doc.categoryLabel}${doc.rejectionReason ? ` — ${doc.rejectionReason}` : ''}`,
    dedupeKey: key,
    at: doc.rejectedAt,
  })

  const message = `Votre document ${doc.categoryLabel} a été refusé.${doc.rejectionReason ? ` Motif : ${withoutTrailingPunctuation(doc.rejectionReason)}.` : ''} Merci de téléverser un nouveau document pour poursuivre le traitement de votre dossier.`
  const notif = addClientNotification(clientId, {
    kind: 'Document',
    title: `Document refusé : ${doc.categoryLabel}`,
    message,
    important: true,
    dedupeKey: `doc-notif:${doc.category}:${doc.rejectedAt}`,
  })

  logActivity(clientId, {
    author: 'Équipe',
    action: 'Notification de rejet envoyée au client',
    detail: doc.categoryLabel,
    dedupeKey: `doc-reject-notif:${doc.category}:${doc.rejectedAt}`,
    at: doc.rejectedAt,
  })
}

export function getClientDocuments(clientId) {
  const data = readAll()
  if (!data[clientId]) {
    data[clientId] = initialDocsFor(clientId)
    writeAll(data)
  }
  Object.values(data[clientId]).forEach(doc => backfillDocActivity(clientId, doc))
  return data[clientId]
}

// Historique complet pour l'affichage : inclut la version actuellement
// active (pas seulement les versions remplacées), sans jamais modifier le
// stockage — un document rejeté puis remplacé montre donc bien
// "Version 1 (rejetée) / Version 2 (en attente)".
export function getDocVersions(doc) {
  if (!doc?.fileName) return doc?.versions || []
  const history = doc.versions || []
  const last = history[history.length - 1]
  const isCurrentAlreadyLast = last && last.fileName === doc.fileName && last.uploadedAt === doc.uploadedAt
  if (isCurrentAlreadyLast) return history
  return [...history, {
    id: `current-${doc.category}`,
    fileName: doc.fileName,
    uploadedAt: doc.uploadedAt,
    status: doc.status,
    rejectionReason: doc.rejectionReason,
    rejectedAt: doc.rejectedAt,
  }]
}

export function subscribeToDocuments(callback) {
  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

// ── Admin : rejeter un document avec motif ─────────────────────────
export function rejectDocument(clientId, categoryId, reason, rejectedBy = 'Équipe Oriafen') {
  const data = readAll()
  if (!data[clientId]) data[clientId] = initialDocsFor(clientId)
  const doc = data[clientId][categoryId]
  if (!doc || !doc.fileName) return false // rien à rejeter (aucun fichier envoyé)

  const at = nowLabel()
  const cleanReason = (reason || '').trim() || null

  // L'ancien fichier ne disparaît jamais : il part dans l'historique des versions.
  const versions = [...(doc.versions || [])]
  const last = versions[versions.length - 1]
  if (!last || last.fileName !== doc.fileName || last.uploadedAt !== doc.uploadedAt) {
    versions.push({ id: `v${versions.length + 1}-${categoryId}-${clientId}-${Date.now()}`, fileName: doc.fileName, uploadedAt: doc.uploadedAt, status: 'missing', rejectionReason: cleanReason, rejectedAt: at })
  } else {
    versions[versions.length - 1] = { ...last, status: 'missing', rejectionReason: cleanReason, rejectedAt: at }
  }

  data[clientId][categoryId] = { ...doc, status: 'missing', rejectionReason: cleanReason, rejectedAt: at, rejectedBy, versions }
  writeAll(data)

  logActivity(clientId, {
    author: 'Équipe',
    action: 'Document rejeté par l\'équipe',
    detail: `${doc.categoryLabel}${cleanReason ? ` — ${cleanReason}` : ''}`,
    at,
  })

  const message = `Votre document ${doc.categoryLabel} a été refusé.${cleanReason ? ` Motif : ${withoutTrailingPunctuation(cleanReason)}.` : ''} Merci de téléverser un nouveau document pour poursuivre le traitement de votre dossier.`
  const notif = addClientNotification(clientId, {
    kind: 'Document',
    title: `Document refusé : ${doc.categoryLabel}`,
    message,
    important: true,
  })

  logActivity(clientId, {
    author: 'Équipe',
    action: 'Notification de rejet envoyée au client',
    detail: doc.categoryLabel,
    dedupeKey: `reject-notif:${notif?.id}`,
    at,
  })

  return true
}

// ── Admin : valider un document ─────────────────────────────────────
export function validateDocument(clientId, categoryId, validatedBy = 'Équipe Oriafen') {
  const data = readAll()
  if (!data[clientId]) data[clientId] = initialDocsFor(clientId)
  const doc = data[clientId][categoryId]
  if (!doc || !doc.fileName) return false

  data[clientId][categoryId] = { ...doc, status: 'valid', rejectionReason: null, rejectedAt: null, rejectedBy: null }
  writeAll(data)

  logActivity(clientId, {
    author: 'Équipe',
    action: 'Nouvelle version validée',
    detail: doc.categoryLabel,
  })
  return true
}

// ── Client : envoyer / remplacer un document ────────────────────────
export function uploadDocument(clientId, categoryId, categoryLabel, file) {
  const data = readAll()
  if (!data[clientId]) data[clientId] = initialDocsFor(clientId)
  const existing = data[clientId][categoryId] || { category: categoryId, categoryLabel, versions: [] }
  const wasRejected = existing.status === 'missing' || existing.status === 'correction'

  const at = nowLabel()
  const versions = [...(existing.versions || [])]
  // La version rejetée précédente reste dans l'historique — jamais écrasée silencieusement.
  if (existing.fileName && wasRejected) {
    const last = versions[versions.length - 1]
    if (!last || last.fileName !== existing.fileName || last.uploadedAt !== existing.uploadedAt) {
      versions.push({ id: `v${versions.length + 1}-${categoryId}-${clientId}-${Date.now()}`, fileName: existing.fileName, uploadedAt: existing.uploadedAt, status: existing.status, rejectionReason: existing.rejectionReason, rejectedAt: existing.rejectedAt })
    }
  }

  const nextDoc = {
    category: categoryId,
    categoryLabel: existing.categoryLabel || categoryLabel,
    status: 'pending',
    fileName: file?.name || `${categoryId}.pdf`,
    fileUrl: null,
    rejectionReason: null,
    rejectedAt: null,
    rejectedBy: null,
    uploadedAt: at,
    versions,
  }
  data[clientId][categoryId] = nextDoc
  writeAll(data)

  logActivity(clientId, {
    author: 'Client',
    action: wasRejected ? 'Document de remplacement téléversé' : 'Nouvelle version reçue',
    detail: nextDoc.categoryLabel,
    at,
  })

  // Correctif "centre de notifications incomplet" (audit inspection
  // navigateur, 2026-09-26, item 10) : un document envoyé par le client ne
  // déclenchait aucune alerte admin — l'équipe ne le découvrait qu'en
  // ouvrant manuellement la fiche. dedupeKey inclut uploadedAt (horodatage
  // à la minute) : un envoi = une notification, jamais un doublon si la
  // même minute relit ce même envoi.
  addAdminNotification({
    type: 'document',
    title: `Nouveau document envoyé — ${nextDoc.categoryLabel}`,
    message: `${nextDoc.fileName} en attente de validation.`,
    clientId,
    context: { tab: 'clients', clientId },
    dedupeKey: `admin-notif:doc-uploaded:${clientId}:${categoryId}:${at}`,
  })

  return nextDoc
}
