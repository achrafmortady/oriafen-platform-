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

// Progression PAR CANAL (correctif 2026-09-22, retour client : "la
// progression marketing/réseaux est trop globale/mélangée — il faut voir
// le statut de chaque canal séparément"). Champ LOCAL UNIQUEMENT — aucune
// table live équivalente confirmée dans l'audit schéma (brand_briefs/
// client_deliverables n'ont pas de colonne de progression par canal, voir
// docs/PRODUCTION_WIRING_PLAN.md) : mapping production à définir plus tard
// (probablement une nouvelle table `marketing_channel_progress` ou des
// colonnes dédiées sur `client_deliverables`, classification C — jamais
// deviné ici). CHANNEL_DEFS = la liste fixe des canaux suivis ; chaque
// client démarre à 0% "À démarrer" (jamais une progression inventée) tant
// qu'aucune action admin ne l'a mise à jour.
export const CHANNEL_STATUSES = ['À démarrer', 'En cours', 'En révision', 'Terminé']
export const CHANNEL_DEFS = [
  { id: 'site', label: 'Site web' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'ads_manager', label: 'Meta Business Manager / Ads Manager' },
]

function defaultChannels() {
  return CHANNEL_DEFS.map(c => ({ ...c, status: 'À démarrer', progressPct: 0, currentStep: null, remainingWork: null, updatedAt: null }))
}

function defaultProject() {
  return {
    name: 'Projet digital',
    type: 'Brand kit, site web et communication',
    status: 'En attente du brief client',
    phase: 'Étape 1 — informations de marque à compléter',
    lastUpdate: null,
    progressPct: 0,
  }
}

function defaultDeliverables() {
  return []
}

function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

function ensureClient(data, clientId) {
  if (!data[clientId]) data[clientId] = { project: defaultProject(), deliverables: defaultDeliverables(), requests: [], brandIntake: null }
  // Migration non destructive (même convention que dossierStepStore.js) :
  // un client déjà en localStorage avant ce correctif n'a pas encore de
  // `channels` — ajouté sans toucher au reste de ses données existantes.
  if (!data[clientId].channels) data[clientId].channels = defaultChannels()
  if (!('brandIntake' in data[clientId])) data[clientId].brandIntake = null
  return data[clientId]
}

export function getBrandIntake(clientId) {
  return ensureClient(readAll(), clientId).brandIntake
}

export function submitBrandIntake(clientId, intake, clientName = null) {
  const data = readAll()
  const client = ensureClient(data, clientId)
  const cleanName = (intake.brandName || '').trim()
  if (!clientId || !cleanName) return null
  const submittedAt = formatNowLabel()
  client.brandIntake = {
    brandName: cleanName,
    activity: (intake.activity || '').trim(),
    audience: (intake.audience || '').trim(),
    offer: (intake.offer || '').trim(),
    values: (intake.values || '').trim(),
    tone: (intake.tone || '').trim(),
    colors: Array.isArray(intake.colors) ? intake.colors.filter(Boolean).slice(0, 3) : [],
    logoStatus: intake.logoStatus || 'À créer',
    logoInfo: (intake.logoInfo || '').trim(),
    websiteGoal: (intake.websiteGoal || '').trim(),
    instagramStatus: intake.instagramStatus || 'À créer',
    instagram: (intake.instagram || '').trim(),
    facebookStatus: intake.facebookStatus || 'À créer',
    facebook: (intake.facebook || '').trim(),
    metaBusinessStatus: intake.metaBusinessStatus || 'À créer',
    metaBusiness: (intake.metaBusiness || '').trim(),
    notes: (intake.notes || '').trim(),
    submittedAt,
  }
  client.project = {
    ...client.project,
    name: cleanName,
    type: 'Brand kit, site web et communication',
    status: 'Brief reçu',
    phase: 'Étape 1 complétée — préparation brand kit',
    lastUpdate: submittedAt,
    progressPct: Math.max(client.project.progressPct || 0, 10),
  }
  writeAll(data)
  logActivity(clientId, { author: 'Client', action: 'Informations de marque envoyées', detail: cleanName })
  addAdminNotification({
    type: 'marketing',
    title: `Brand kit à préparer — ${clientName || cleanName}`,
    message: `Brief marque reçu pour ${cleanName}`,
    clientId,
    clientName,
    context: { tab: 'marketing', clientId },
    important: true,
    dedupeKey: `admin-notif:brand-intake:${clientId}:${submittedAt}`,
  })
  return client.brandIntake
}

export function getMarketingProject(clientId) {
  return ensureClient(readAll(), clientId).project
}

export function getMarketingChannels(clientId) {
  return ensureClient(readAll(), clientId).channels
}

// patch : { status?, progressPct?, currentStep?, remainingWork? } — réglé
// UNIQUEMENT par l'admin (jamais auto-calculé depuis une autre donnée,
// pour ne jamais fabriquer une progression qui ne reflète pas la réalité
// du travail effectué).
export function updateMarketingChannel(clientId, channelId, patch) {
  const data = readAll()
  const client = ensureClient(data, clientId)
  let label = null
  client.channels = client.channels.map(c => {
    if (c.id !== channelId) return c
    label = c.label
    return { ...c, ...patch, updatedAt: formatNowLabel() }
  })
  if (label == null) return false
  writeAll(data)
  logActivity(clientId, { author: 'Équipe', action: `Progression marketing (${label}) mise à jour`, detail: patch.status || null })
  return true
}

export function getDeliverables(clientId) {
  return ensureClient(readAll(), clientId).deliverables
}

// Correctif "livrables non séparés par type" (audit inspection navigateur,
// 2026-09-26, item 7) : aucune fonction n'existait pour ajouter un livrable
// — getDeliverables() renvoyait donc toujours [] (defaultDeliverables),
// sans aucun moyen pour l'admin d'en publier un. DELIVERABLE_TYPES fixe la
// classification demandée (posts/stories/scripts/calendrier/autre),
// réutilisée à la fois pour le formulaire admin et le regroupement
// d'affichage (DeliverablesCard, LocalMarketing.jsx) — jamais une 2e liste.
export const DELIVERABLE_TYPES = {
  posts: 'Posts',
  stories: 'Stories',
  scripts: 'Scripts',
  calendar: 'Calendrier de publication',
  other: 'Autre livrable',
}

export function addDeliverable(clientId, { type = 'other', name, url = null }, clientName = null) {
  const cleanName = (name || '').trim()
  if (!clientId || !cleanName) return null
  const data = readAll()
  const client = ensureClient(data, clientId)
  const at = formatNowLabel()
  const deliverable = {
    id: `deliverable-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: DELIVERABLE_TYPES[type] ? type : 'other',
    name: cleanName,
    kind: DELIVERABLE_TYPES[type] || DELIVERABLE_TYPES.other,
    version: 'v1',
    url: url || null,
    updatedAt: at,
  }
  client.deliverables = [...client.deliverables, deliverable]
  writeAll(data)
  logActivity(clientId, { author: 'Équipe', action: 'Livrable publié', detail: `${deliverable.kind} — ${cleanName}` })
  addClientNotification(clientId, {
    kind: 'Marketing',
    title: `Nouveau livrable — ${deliverable.kind}`,
    message: cleanName,
    important: true,
  })
  return deliverable
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
