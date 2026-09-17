import { logActivity } from './activityLog'

const STORAGE_KEY = 'oriafen-client-tracking-v1'
const CHANGE_EVENT = 'oriafen-client-tracking-change'
const REMINDER_DELAY_MS = 3 * 24 * 60 * 60 * 1000

const SENT_KIND_LABEL = { Message: 'Message envoyé', Fichier: 'Fichier envoyé', Document: 'Document envoyé' }

function nowLabel() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseLocalDate(value) {
  if (!value) return 0
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4}) · (\d{2}):(\d{2})$/)
  if (!match) return new Date(value).getTime() || 0
  return new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}:00`).getTime()
}

function mockItems(clientId) {
  const offset = (Number(clientId) % 5) + 1
  return [
    {
      id: `brief-${clientId}`,
      clientId,
      type: 'message',
      kind: 'Message',
      senderType: 'team',
      title: 'Point de suivi de votre dossier',
      content: "Bonjour, voici le point d'avancement de votre dossier. Nous restons disponibles pour la suite.",
      sentAt: `12/09/2026 · 10:${String(offset).padStart(2, '0')}`,
      responseRequired: true,
      status: 'waiting',
      message: "Bonjour, voici le point d'avancement de votre dossier. Nous restons disponibles pour la suite.",
      important: true,
      file: null,
      fileName: null,
      seenAt: null,
      openedAt: null,
      repliedAt: null,
      remindedAt: null,
      reminders: [],
      response: null,
    },
    {
      id: `file-${clientId}`,
      clientId,
      type: 'fichier',
      kind: 'Fichier',
      senderType: 'team',
      title: "Présentation de l'offre",
      content: null,
      sentAt: `09/09/2026 · 16:${String(offset + 10).padStart(2, '0')}`,
      responseRequired: false,
      status: 'no_response_required',
      message: null,
      important: false,
      file: 'presentation-oriafen.pdf',
      fileName: 'presentation-oriafen.pdf',
      seenAt: null,
      openedAt: null,
      repliedAt: null,
      remindedAt: null,
      reminders: [],
      response: null,
    },
    {
      id: `quote-${clientId}`,
      clientId,
      type: 'document',
      kind: 'Document',
      senderType: 'team',
      title: 'Proposition commerciale',
      content: 'Votre proposition commerciale est disponible dans cet espace.',
      sentAt: `05/09/2026 · 09:${String(offset + 20).padStart(2, '0')}`,
      responseRequired: true,
      status: 'waiting',
      message: 'Votre proposition commerciale est disponible dans cet espace.',
      important: false,
      file: 'proposition-commerciale.pdf',
      fileName: 'proposition-commerciale.pdf',
      seenAt: null,
      openedAt: null,
      repliedAt: null,
      remindedAt: null,
      reminders: [],
      response: null,
    },
  ]
}

function normalizeItem(item) {
  const message = item.message ?? item.content ?? null
  // reminders[] : historique append-only de toutes les relances ({at, by}).
  // Compat ascendante avec l'ancien champ unique remindedAt (un item déjà en
  // localStorage avant cette fonctionnalité n'a qu'une seule relance connue).
  const reminders = item.reminders ?? (item.remindedAt ? [{ at: item.remindedAt, by: 'Équipe Oriafen' }] : [])
  return {
    ...item,
    type: item.type ?? (item.kind === 'Message' ? 'message' : item.kind === 'Fichier' ? 'fichier' : 'document'),
    clientId: item.clientId,
    // senderType : qui est à l'origine de cet envoi — 'team' (Équipe Oriafen)
    // ou 'client'. Tous les envois existants du store sont initiés par
    // l'équipe (l'espace "Mes échanges" client ne permet pas d'envoyer un
    // nouvel envoi de ce type, seulement de répondre — voir item.response
    // pour la partie "Client" de l'échange).
    senderType: item.senderType ?? 'team',
    content: item.content ?? message,
    file: item.file ?? item.fileName ?? null,
    fileName: item.fileName ?? item.file ?? null,
    important: item.important ?? false,
    seenAt: item.seenAt ?? null,
    openedAt: item.openedAt ?? null,
    repliedAt: item.repliedAt ?? item.response?.respondedAt ?? null,
    remindedAt: item.remindedAt ?? item.reminderAt ?? reminders[reminders.length - 1]?.at ?? null,
    reminders,
    responseRequired: item.responseRequired ?? false,
    response: item.response ?? null,
    message,
    lastActivityAt: item.lastActivityAt ?? null,
  }
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

// Rejoue dans le journal les événements déjà connus d'un item (envoi, vu,
// ouvert, répondu) — idempotent grâce à dedupeKey, donc sans risque à
// rappeler à chaque lecture. Cela permet aussi de "rattraper" le journal
// pour des clients déjà présents en localStorage avant l'ajout de cette
// fonctionnalité (aucune perte d'historique déjà déroulé).
function backfillActivityFromItem(clientId, item) {
  logActivity(clientId, {
    author: 'Équipe',
    action: item.important ? 'Notification importante envoyée' : (SENT_KIND_LABEL[item.kind] || 'Message envoyé'),
    detail: item.title || null,
    dedupeKey: `sent:${item.id}`,
    at: item.sentAt,
  })
  if (item.seenAt) {
    logActivity(clientId, {
      author: 'Client',
      action: item.important ? 'Notification importante consultée' : 'Message consulté',
      detail: item.title || null,
      dedupeKey: `seen:${item.id}`,
      at: item.seenAt,
    })
  }
  if (item.openedAt) {
    logActivity(clientId, {
      author: 'Client',
      action: 'Fichier/document ouvert',
      detail: item.fileName || item.title || null,
      dedupeKey: `opened:${item.id}`,
      at: item.openedAt,
    })
  }
  // Relance illimitée : chaque relance (reminders[]) est journalisée
  // individuellement et numérotée, jamais seulement la dernière — la clé de
  // dédoublonnage inclut l'index + la date pour rester idempotente tout en
  // acceptant un nombre illimité de relances successives sur le même envoi.
  (item.reminders || []).forEach((reminder, index) => {
    logActivity(clientId, {
      author: 'Équipe',
      action: `Relance n°${index + 1} effectuée`,
      detail: item.title || null,
      dedupeKey: `reminded:${item.id}:${index}:${reminder.at}`,
      at: reminder.at,
    })
  })
  if (item.repliedAt && item.response) {
    logActivity(clientId, {
      author: 'Client',
      action: 'Réponse envoyée',
      detail: item.response.message?.length > 80 ? `${item.response.message.slice(0, 80)}…` : item.response.message,
      dedupeKey: `replied:${item.id}`,
      at: item.repliedAt,
    })
  }
}

export function getClientSends(clientId) {
  const data = readAll()
  if (!data[clientId]) {
    data[clientId] = mockItems(clientId)
    writeAll(data)
  } else {
    const normalized = data[clientId].map(normalizeItem)
    if (JSON.stringify(normalized) !== JSON.stringify(data[clientId])) {
      data[clientId] = normalized
      writeAll(data)
    }
  }
  data[clientId].forEach(item => backfillActivityFromItem(clientId, item))
  return data[clientId]
}

function updateSend(sendId, updater) {
  const data = readAll()
  let updated = false
  let foundClientId = null
  let before = null
  let after = null
  Object.keys(data).forEach(clientId => {
    data[clientId] = data[clientId].map(item => {
      if (item.id !== sendId) return item
      updated = true
      foundClientId = clientId
      before = normalizeItem(item)
      after = updater(before)
      return after
    })
  })
  if (updated) writeAll(data)
  return { updated, clientId: foundClientId, before, after }
}

// Le journal (activityLog) n'est pas écrit ici directement : getClientSends
// rejoue automatiquement (et de façon idempotente) les événements connus de
// chaque item à chaque lecture — voir backfillActivityFromItem plus haut.
export function markClientSendSeen(sendId) {
  return updateSend(sendId, item => item.seenAt ? item : { ...item, seenAt: nowLabel(), lastActivityAt: nowLabel() }).updated
}

export function markClientSendOpened(sendId) {
  return updateSend(sendId, item => ({ ...item, seenAt: item.seenAt ?? nowLabel(), openedAt: item.openedAt ?? nowLabel(), lastActivityAt: nowLabel() })).updated
}

// Relance illimitée (aucun plafond) : tant qu'une réponse/action du client
// est encore attendue (responseRequired && !response), l'équipe peut
// relancer autant de fois que nécessaire. Chaque appel AJOUTE une entrée à
// reminders[] (jamais d'écrasement) : l'historique complet des relances
// reste consultable, avec date/heure/acteur/numéro.
export function markClientSendReminded(sendId) {
  const at = nowLabel()
  return updateSend(sendId, item => ({
    ...item,
    remindedAt: at,
    reminders: [...(item.reminders || []), { at, by: 'Équipe Oriafen' }],
    lastActivityAt: at,
  })).updated
}

export function getReminderCount(item) {
  return (item.reminders || []).length
}

export function setClientSendImportant(sendId, important) {
  return updateSend(sendId, item => ({ ...item, important: Boolean(important) })).updated
}

export function getImportantUnseen(clientId) {
  return getClientSends(clientId).filter(item => item.important && !item.seenAt)
}

export function getUnseenClientSendCount(clientId) {
  return getClientSends(clientId).filter(item => !item.seenAt).length
}

export function getClientLastActivity(clientId) {
  const items = getClientSends(clientId)
  const activity = items
    .flatMap(item => [item.lastActivityAt, item.repliedAt, item.openedAt, item.seenAt, item.sentAt].filter(Boolean))
    .map(value => ({ value, timestamp: parseLocalDate(value) }))
    .sort((a, b) => b.timestamp - a.timestamp)[0]
  return activity?.value ?? null
}

// Statut DÉRIVÉ uniquement (jamais stocké) : priorité replied > opened > seen
// > remind > sent, comme demandé. Avant ce correctif, "remind" était testé
// EN PREMIER, donc un envoi resté marqué "À relancer" restait bloqué sur ce
// statut même après que le client l'ait ouvert/vu — contradiction entre le
// badge et les horodatages réels. Ici, dès qu'un événement plus "avancé"
// existe (ouverture, consultation, réponse), il prime toujours sur une
// relance passée : remind ne peut apparaître que tant que rien de plus
// avancé n'a eu lieu.
export function getAdminSendStatus(item) {
  if (item.response) return { key: 'replied', label: 'Répondu' }
  if (item.openedAt) return { key: 'opened', label: 'Ouvert' }
  if (item.seenAt) return { key: 'seen', label: 'Vu' }
  if (item.remindedAt || (item.responseRequired && Date.now() - parseLocalDate(item.sentAt) > REMINDER_DELAY_MS)) return { key: 'remind', label: 'À relancer' }
  return { key: 'sent', label: 'Envoyé' }
}

// Injecte une notification dans le flux existant (cloche, compteur non lu,
// popup important, carte "Mes échanges") — aucune nouvelle UI de
// notification, on réutilise exactement ce qui existe déjà.
export function addClientNotification(clientId, { kind = 'Document', title, message, important = false, dedupeKey = null }) {
  const data = readAll()
  if (!data[clientId]) data[clientId] = mockItems(clientId)

  if (dedupeKey) {
    const existing = data[clientId].find(i => i.dedupeKey === dedupeKey)
    if (existing) return existing
  }

  const item = normalizeItem({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dedupeKey,
    clientId,
    type: kind === 'Document' ? 'document' : kind === 'Marketing' ? 'marketing' : 'message',
    kind,
    title,
    content: message,
    message,
    sentAt: nowLabel(),
    responseRequired: false,
    status: 'no_response_required',
    important: Boolean(important),
    file: null,
    fileName: null,
    seenAt: null,
    openedAt: null,
    repliedAt: null,
    remindedAt: null,
    response: null,
  })

  data[clientId] = [...data[clientId], item]
  writeAll(data)
  return item
}

export function replyToClientSend(sendId, message) {
  const cleanMessage = message.trim()
  if (!cleanMessage) return false
  const data = readAll()
  let updated = false

  Object.keys(data).forEach(clientId => {
    data[clientId] = data[clientId].map(item => {
      // senderType==='client' est exclu ici : un envoi initié par le client
      // lui-même (ex: demande de support — voir createClientSupportRequest)
      // attend une réponse de l'ÉQUIPE, jamais du client — c'est
      // respondToClientRequest qui gère ce cas, avec response.author='Équipe'.
      if (item.id !== sendId || item.senderType === 'client' || !item.responseRequired || item.status === 'replied') return item
      updated = true
      const repliedAt = nowLabel()
      return {
        ...item,
        status: 'replied',
        repliedAt,
        lastActivityAt: repliedAt,
        response: { message: cleanMessage, respondedAt: repliedAt },
      }
    })
  })

  if (updated) writeAll(data)
  return updated
}

// SUPPORT (feedback #9) : le client peut ouvrir une nouvelle demande (sujet +
// description), distincte d'une simple réponse à un envoi de l'équipe.
// Réutilise exactement le même store/flux (cloche, "Mes échanges", fiche
// admin) — aucun système parallèle. senderType:'client' + responseRequired:
// true la fait apparaître "En attente de réponse" côté équipe tant qu'elle
// n'a pas répondu (voir respondToClientRequest).
export function createClientSupportRequest(clientId, { subject, message }) {
  const title = (subject || '').trim()
  const clean = (message || '').trim()
  if (!clientId || !title || !clean) return null
  const data = readAll()
  if (!data[clientId]) data[clientId] = mockItems(clientId)
  const item = normalizeItem({
    id: `support-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    clientId,
    type: 'support',
    kind: 'Support',
    senderType: 'client',
    title,
    content: clean,
    message: clean,
    sentAt: nowLabel(),
    responseRequired: true,
    status: 'waiting',
  })
  data[clientId] = [...data[clientId], item]
  writeAll(data)
  logActivity(clientId, { author: 'Client', action: 'Demande de support envoyée', detail: title })
  return item
}

// Réponse de l'équipe à une demande initiée par le CLIENT (l'inverse de
// replyToClientSend, qui gère la réponse du client à un envoi de l'équipe).
// response.author distingue les deux cas à l'affichage (badge "Équipe" vs
// "Client") — par défaut 'client' pour ne rien changer au rendu existant des
// réponses déjà enregistrées avant ce champ.
export function respondToClientRequest(sendId, message) {
  const cleanMessage = (message || '').trim()
  if (!cleanMessage) return false
  const data = readAll()
  let updated = false
  let clientId = null

  Object.keys(data).forEach(cid => {
    data[cid] = data[cid].map(item => {
      if (item.id !== sendId || item.senderType !== 'client' || !item.responseRequired || item.status === 'replied') return item
      updated = true
      clientId = cid
      const repliedAt = nowLabel()
      return {
        ...item,
        status: 'replied',
        repliedAt,
        lastActivityAt: repliedAt,
        response: { message: cleanMessage, respondedAt: repliedAt, author: 'Équipe' },
      }
    })
  })

  if (updated) {
    writeAll(data)
    addClientNotification(clientId, {
      kind: 'Support',
      title: 'Nouvelle réponse support',
      message: cleanMessage,
      important: true,
    })
  }
  return updated
}

export function subscribeToClientTracking(callback) {
  const handleChange = () => callback()
  window.addEventListener('storage', handleChange)
  window.addEventListener(CHANGE_EVENT, handleChange)
  return () => {
    window.removeEventListener('storage', handleChange)
    window.removeEventListener(CHANGE_EVENT, handleChange)
  }
}
