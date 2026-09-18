// Notifications ADMIN — alertes ponctuelles pour l'équipe (nouvelle demande
// de modification marketing, nouvelle demande de support…), distinctes des
// notifications CLIENT (clientTrackingStore.addClientNotification, qui
// alimente la cloche du client). Même pattern/convention que le reste de la
// démo locale (localStorage + CustomEvent pub/sub + dedupeKey idempotent,
// voir activityLog.js / clientTrackingStore.js) : pas un système différent,
// la même mécanique appliquée au seul flux qui n'existait pas encore
// (aucune alerte n'arrivait à l'équipe avant ce correctif — la cloche admin
// du header était un bouton statique sans état).
//
// Une notification ADMIN est un pur signal ("quelque chose de nouveau
// attend l'équipe, va voir X") — jamais la conversation elle-même. La
// conversation reste dans clientTrackingStore (Mes échanges / fiche client)
// et dans marketingStore (demandes de modification) : ce store ne duplique
// aucune donnée métier, seulement une référence (clientId + contexte de
// navigation) vers l'endroit où traiter la demande.
const STORAGE_KEY = 'oriafen-admin-notifications-v1'
const CHANGE_EVENT = 'oriafen-admin-notifications-change'

function nowLabel() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

// type: 'marketing' | 'support' | autre alerte future.
// context: objet de navigation libre consommé par LocalAdminShell (ex :
// { tab: 'marketing' } ou { tab: 'clients', clientId }) — jamais interprété
// ici, seulement transporté.
// dedupeKey : une notification déjà connue avec cette clé n'est jamais
// recréée — un rerender ou une relecture de la même action utilisateur ne
// produit donc jamais de doublon (même garde-fou que
// clientTrackingStore.addClientNotification / activityLog.logActivity).
export function addAdminNotification({ type, title, message, clientId = null, clientName = null, context = null, important = false, dedupeKey = null }) {
  const list = readAll()
  if (dedupeKey) {
    const existing = list.find(n => n.dedupeKey === dedupeKey)
    if (existing) return existing
  }
  const item = {
    id: `admin-notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dedupeKey,
    type,
    title,
    message: message || null,
    clientId,
    clientName,
    context,
    important: Boolean(important),
    createdAt: nowLabel(),
    ts: Date.now(),
    seenAt: null,
  }
  writeAll([item, ...list])
  return item
}

export function getAdminNotifications() {
  return readAll().slice().sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
}

export function getUnseenAdminNotificationCount() {
  return readAll().filter(n => !n.seenAt).length
}

export function markAdminNotificationSeen(id) {
  const list = readAll()
  let updated = false
  const next = list.map(n => {
    if (n.id !== id || n.seenAt) return n
    updated = true
    return { ...n, seenAt: nowLabel() }
  })
  if (updated) writeAll(next)
  return updated
}

export function markAllAdminNotificationsSeen() {
  const list = readAll()
  const at = nowLabel()
  let updated = false
  const next = list.map(n => {
    if (n.seenAt) return n
    updated = true
    return { ...n, seenAt: at }
  })
  if (updated) writeAll(next)
  return updated
}

export function subscribeToAdminNotifications(callback) {
  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
