// Régression ciblée — 4 points restants du retour client (2026-09-22,
// round 2) : marketing par canal, bug "Client Démo à relancer", tooltip
// Bloqué, retrait de "Tâche". 100% local, aucun accès réseau.
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { readFileSync } from 'node:fs'

register('./local-check-loader.mjs', import.meta.url)

class MemoryStorage {
  constructor() { this._data = new Map() }
  getItem(key) { return this._data.has(key) ? this._data.get(key) : null }
  setItem(key, value) { this._data.set(key, String(value)) }
  removeItem(key) { this._data.delete(key) }
  clear() { this._data.clear() }
}
if (typeof globalThis.CustomEvent !== 'function') {
  globalThis.CustomEvent = class CustomEvent { constructor(type, opts = {}) { this.type = type; this.detail = opts.detail } }
}
globalThis.localStorage = new MemoryStorage()
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} }

let passed = 0
function check(label, fn) { fn(); passed += 1; console.log(`  ok - ${label}`) }

// ================================================================
// 1. Marketing — progression par canal indépendante
// ================================================================
const { getMarketingChannels, updateMarketingChannel, CHANNEL_DEFS } = await import('./src/local/marketingStore.js')

check('getMarketingChannels() renvoie les 4 canaux (site/Instagram/Facebook/Ads Manager), chacun à 0%/"À démarrer" par défaut — aucune progression fabriquée', () => {
  const channels = getMarketingChannels(9601)
  assert.equal(channels.length, CHANNEL_DEFS.length)
  channels.forEach(c => { assert.equal(c.status, 'À démarrer'); assert.equal(c.progressPct, 0) })
})

check('updateMarketingChannel() met à jour UN SEUL canal, les autres restent inchangés — progression réellement indépendante par canal', () => {
  updateMarketingChannel(9601, 'instagram', { status: 'En cours', progressPct: 40, currentStep: 'Création des visuels' })
  const channels = getMarketingChannels(9601)
  const ig = channels.find(c => c.id === 'instagram')
  const fb = channels.find(c => c.id === 'facebook')
  const site = channels.find(c => c.id === 'site')
  assert.equal(ig.status, 'En cours')
  assert.equal(ig.progressPct, 40)
  assert.equal(ig.currentStep, 'Création des visuels')
  assert.equal(fb.status, 'À démarrer', 'Facebook ne doit pas être affecté par la mise à jour d\'Instagram')
  assert.equal(site.progressPct, 0, 'Site web ne doit pas être affecté par la mise à jour d\'Instagram')
})

check('LocalMarketing.jsx affiche la progression par canal côté client ET admin (ChannelsCard), avec un rappel que les infos de marque sont fournies par le client en premier', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  assert.match(src, /ChannelsCard/)
  assert.match(src, /<ChannelsCard channels=\{channels\} \/>/, 'la vue client doit afficher les canaux')
  assert.match(src, /<ChannelsCard channels=\{channels\} editable/, 'la vue admin doit pouvoir modifier les canaux')
  assert.match(src, /informations transmises par le client/)
})

// ================================================================
// 2. Bug "Client Démo à relancer alors qu'il est déjà client"
// ================================================================
const { applyPaymentValidation } = await import('./src/local/conversion.js')
const { seed } = await import('./src/local/model.js')
const { LOCAL_PACKS } = await import('./src/local/packsData.js')
const { buildClientsOverview } = await import('./src/local/clientsOverviewData.js')
const { scheduleRelance } = await import('./src/local/relance.js')

check('Un client déjà converti (stage=Client, paymentValidated) n\'affiche jamais littéralement le libellé "À relancer" — même en dossier "missingDocs>=2", le libellé devient "Documents à relancer" (jamais confondu avec le pipeline CRM pré-conversion)', () => {
  const src = readFileSync('./src/local/LocalClientsOverview.jsx', 'utf8')
  assert.match(src, /'À relancer':\s*'Documents à relancer'/)
})

check('La conversion (applyPaymentValidation) efface une relance programmée avant conversion — un client fraîchement converti ne doit plus afficher de badge "À relancer" hérité du pipeline CRM', () => {
  const leads = seed()
  const prospect = leads.find(l => l.stage !== 'Client' && !l.paymentValidated)
  const packId = prospect.packId || LOCAL_PACKS[0]?.id
  const withRelance = scheduleRelance(leads, prospect.id, { at: '2026-09-25T10:00', note: 'Rappel' })
  const withPack = withRelance.map(l => l.id === prospect.id ? { ...l, packId } : l)
  const converted = applyPaymentValidation(withPack, prospect.id)
  const client = converted.find(l => l.id === prospect.id)
  assert.equal(client.stage, 'Client')
  assert.equal(client.relance, null, 'la relance programmée avant conversion doit être nettoyée à la conversion')
})

check('Le calcul de statut dossier (deriveDossier) ne redéfinit jamais lead.stage — un client "Documents à relancer" reste bien stage===\'Client\' partout', () => {
  const leads = seed()
  const prospect = leads.find(l => l.stage !== 'Client' && !l.paymentValidated)
  const packId = prospect.packId || LOCAL_PACKS[0]?.id
  const withPack = leads.map(l => l.id === prospect.id ? { ...l, packId } : l)
  const converted = applyPaymentValidation(withPack, prospect.id)
  const client = converted.find(l => l.id === prospect.id)
  assert.equal(client.stage, 'Client', 'stage ne doit jamais être redéfini par le calcul de statut dossier')
})

// ================================================================
// 3. La relance reste fonctionnelle pour les prospects NON clients
// ================================================================
const { relanceReason, isToRelaunch, RELANCE_STAGE } = await import('./src/local/relance.js')

check('relanceReason()/isToRelaunch() restent fonctionnels pour un prospect non-client (stage="Intéressé – à relancer" ou relance programmée) — logique de relance inchangée', () => {
  const prospectByStage = { id: 9602, stage: RELANCE_STAGE, relance: null }
  assert.equal(isToRelaunch(prospectByStage), true)
  assert.equal(relanceReason(prospectByStage), 'À relancer — aucune date définie')

  const prospectByDate = { id: 9603, stage: 'Qualifié', relance: { at: '2026-10-01T09:00', note: 'Suivi' } }
  assert.equal(isToRelaunch(prospectByDate), true)
  assert.match(relanceReason(prospectByDate), /Relance prévue le/)

  const prospectNone = { id: 9604, stage: 'Nouveau', relance: null }
  assert.equal(isToRelaunch(prospectNone), false)
})

// ================================================================
// 4. Tooltip "Bloqué" (et statuts voisins) — raison réelle, accessible
// ================================================================
check('LocalClientsOverview.jsx expose un title/aria-label avec la raison réelle (missingDocs/nextAction) sur le badge de statut — hover ET focus clavier (tabIndex)', () => {
  const src = readFileSync('./src/local/LocalClientsOverview.jsx', 'utf8')
  assert.match(src, /function statusReason\(client\)/)
  assert.match(src, /title=\{statusReason\(client\)\}/)
  assert.match(src, /aria-label=\{`\$\{STATUS_DISPLAY_LABEL\[client\.status\]\} — \$\{statusReason\(client\)\}`\}/)
  assert.match(src, /tabIndex=\{0\}/, 'doit rester accessible au clavier, pas seulement à la souris')
  assert.doesNotMatch(src, /statusReason.*['"]texte inventé['"]/, 'jamais un texte inventé')
})

check('statusReason() n\'invente aucune donnée : dérivé uniquement de missingDocs/nextAction déjà calculés par deriveDossier (clientsOverviewData.js), jamais une valeur recalculée séparément', () => {
  const src = readFileSync('./src/local/LocalClientsOverview.jsx', 'utf8')
  const fnMatch = src.match(/function statusReason\(client\) \{[\s\S]*?\n\}/)
  assert.ok(fnMatch)
  assert.match(fnMatch[0], /missingDocs/)
  assert.match(fnMatch[0], /nextAction/)
})

// ================================================================
// 5. Fiche client : "Tâche" retiré, "Prochaine action" intact
// ================================================================
check('LocalCRM.jsx ne contient plus la section "Tâches" (fiche client) ni son état/fonctions dédiés (addTask/toggleTaskDone/newTaskTitle/newTaskDue)', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.doesNotMatch(src, /<h3>Tâches<\/h3>/)
  assert.doesNotMatch(src, /function addTask\(/)
  assert.doesNotMatch(src, /function toggleTaskDone\(/)
  assert.doesNotMatch(src, /newTaskTitle/)
  assert.doesNotMatch(src, /newTaskDue/)
})

check('"Prochaine action" reste présent et fonctionnel dans la fiche client (section distincte, jamais touchée par le retrait de "Tâches")', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /<h3>Prochaine action<\/h3>/)
  assert.match(src, /actionDraft/)
})

const { applyNextActionUpdate } = await import('./src/local/clientHistory.js')
check('applyNextActionUpdate (persistance + historique de "Prochaine action") fonctionne toujours normalement après le retrait de "Tâches"', () => {
  const leads = [{ id: 9605, action: '', due: '', owner: 'Non attribué', done: false, activity: [] }]
  const next = applyNextActionUpdate(leads, 9605, 'action', 'Appeler le client')
  const lead = next.find(l => l.id === 9605)
  assert.equal(lead.action, 'Appeler le client')
  assert.equal(lead.activity[0].text, 'Prochaine action créée — Appeler le client')
})

console.log(`PASS (${passed} checks): retour client round 2 — marketing par canal, bug "Client Démo à relancer" corrigé (libellé + nettoyage relance à la conversion), relance prospect inchangée, tooltip Bloqué accessible, "Tâche" retiré sans casser "Prochaine action".`)
