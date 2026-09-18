// Espace Marketing local (feedback #8) — projet, livrables, demandes de
// modification. Même stockage local (localStorage) et mêmes conventions que
// le reste de la démo (activityLog pour l'historique, addClientNotification
// pour la cloche — aucun système parallèle de notifications/messages créé).
//
// Un seul client de démo dans cette maquette locale (clientId=6, comme
// ClientSpace dans LocalCRM.jsx) — le store reste générique par clientId
// pour ne rien casser si plusieurs comptes existaient.

import { formatNowLabel } from './dateUtils'
import { addClientNotification } from './clientTrackingStore'
import { addAdminNotification } from './adminNotificationsStore'
import { logActivity } from './activityLog'

const STORAGE_KEY = 'oriafen-marketing-v1'
const CHANGE_EVENT = 'oriafen-marketing-change'

export const MODIFICATION_STATUSES = ['Envoyée', 'En cours', 'Traitée', 'Refusée']

function defaultProject() {
  return {
    name: 'Site vitrine — Cabinet Démo',
    type: 'Site vitrine + prise de RDV en ligne',
    status: 'En production',
    phase: 'Révisions client',
    lastUpdate: formatNowLabel(),
    progressPct: 70,
  }
}

function defaultDeliverables() {
  return [
    { id: 'del-1', name: 'Site vitrine (aperçu)', kind: 'Site', url: 'https://demo.oriafen.invalid', version: 'v2', updatedAt: formatNowLabel() },
    { id: 'del-2', name: "Maquette page d'accueil", kind: 'Fichier', url: null, version: 'v1', updatedAt: formatNowLabel() },
  ]
}

function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

function ensureClient(data, clientId) {
  if (!data[clientId]) data[clientId] = { project: defaultProject(), deliverables: defaultDeliverables(), requests: [] }
  return data[clientId]
}

export function getMarketingProject(clientId) {
  return ensureClient(readAll(), clientId).project
}

export function getDeliverables(clientId) {
  return ensureClient(readAll(), clientId).deliverables
}

export function getModificationRequests(clientId) {
  return ensureClient(readAll(), clientId).requests.slice().sort((a, b) => b.ts - a.ts)
}

export function updateMarketingProject(clientId, patch) {
  const data = readAll()
  const client = ensureClient(data, clientId)
  client.project = { ...client.project, ...patch, lastUpdate: formatNowLabel() }
  writeAll(data)
  logActivity(clientId, { author: 'Équipe', action: 'Projet marketing mis à jour', detail: patch.phase || patch.status || null })
}

// section/title/description/priority : mêmes champs que demandés (feedback
// #8). Un titre vide est ignoré (retourne null), jamais une fausse demande.
// clientName (optionnel) : uniquement pour l'affichage de la notification
// admin ci-dessous (label "Nouvelle demande de modification — <nom>") —
// jamais stocké sur la demande elle-même, qui reste identifiée par clientId
// comme partout ailleurs.
export function createModificationRequest(clientId, { section, title, description, priority = 'normale' }, clientName = null) {
  const clean = (title || '').trim()
  if (!clientId || !clean) return null
  const data = readAll()
  const client = ensureClient(data, clientId)
  const request = {
    id: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    section: (section || 'Général').trim(),
    title: clean,
    description: (description || '').trim(),
    priority,
    status: 'Envoyée',
    createdAt: formatNowLabel(),
    ts: Date.now(),
    history: [{ status: 'Envoyée', at: formatNowLabel() }],
  }
  client.requests = [...client.requests, request]
  writeAll(data)
  logActivity(clientId, { author: 'Client', action: 'Demande de modification marketing envoyée', detail: `${request.section} — ${clean}` })

  // Notification ADMIN (feedback "Marketing request does not notify admin") :
  // exactement UNE notification par demande, jamais recréée si l'appelant
  // relit/rerend (dedupeKey = id de la demande, qui n'existe qu'une fois).
  addAdminNotification({
    type: 'marketing',
    title: `Nouvelle demande de modification — ${clientName || 'Client'}`,
    message: `${request.section} — ${clean}`,
    clientId,
    clientName,
    context: { tab: 'marketing', clientId },
    important: request.priority === 'urgente',
    dedupeKey: `admin-notif:marketing-request:${request.id}`,
  })

  return request
}

// Historique append-only du statut (jamais d'écrasement) + notification
// client (réutilise le flux existant : cloche + "Mes échanges").
export function setModificationStatus(clientId, requestId, status) {
  if (!MODIFICATION_STATUSES.includes(status)) return false
  const data = readAll()
  const client = ensureClient(data, clientId)
  let title = null
  client.requests = client.requests.map(r => {
    if (r.id !== requestId || r.status === status) return r
    title = r.title
    return { ...r, status, history: [...r.history, { status, at: formatNowLabel() }] }
  })
  if (title == null) return false
  writeAll(data)
  logActivity(clientId, { author: 'Équipe', action: `Demande de modification : ${status}`, detail: title })
  addClientNotification(clientId, {
    kind: 'Marketing',
    title: `Modification marketing : ${status}`,
    message: title,
    important: status === 'Traitée' || status === 'Refusée',
  })
  return true
}

export function subscribeToMarketing(callback) {
  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}
