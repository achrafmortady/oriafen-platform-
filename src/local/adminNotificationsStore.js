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
import { isCanonicalDemoClientId } from './adapters/identity'

const STORAGE_KEY = 'oriafen-admin-notifications-v1'
const CHANGE_EVENT = 'oriafen-admin-notifications-change'

function nowLabel() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Correctif "vieilles notifications de démo dans la cloche admin" (audit
// inspection navigateur, 2026-09-24) : ce store n'a jamais seedé de
// notification de démo lui-même — mais un navigateur qui a déjà navigué le
// client de démo (CANONICAL_DEMO_CLIENT_ID) avant ce correctif peut avoir
// accumulé des notifications ("Client Démo", "QA TEST"…) qui n'ont plus de
// sens dans une session V2 normale. Nettoyage non destructif à la lecture
// (même principe que cleanPreviewLeads dans model.js) : jamais réappliqué à
// une notification créée par une action réelle sur un client réel.
// Détection volontairement stricte sur clientId (jamais sur clientName/
// title/message) : un client réel peut légitimement s'appeler "Client
// Démo" dans un test ou un cas limite, une notification ne doit donc
// JAMAIS être écartée sur la seule base d'un texte qui ressemble à de la
// démo — seul le lien direct avec CANONICAL_DEMO_CLIENT_ID, ou la mention
// explicite "QA TEST" (jamais un texte légitime), déclenche le nettoyage.
function isDemoAdminNotification(n) {
  if (!n) return true
  if (isCanonicalDemoClientId(n.clientId)) return true
  const haystack = `${n.title || ''} ${n.message || ''}`.toLowerCase()
  return haystack.includes('qa test')
}

function cleanAdminNotifications(list) {
  return (list || []).filter(n => !isDemoAdminNotification(n))
}

function readAll() {
  let raw
  try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
  const cleaned = cleanAdminNotifications(raw)
  if (cleaned.length !== raw.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
  return cleaned
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
