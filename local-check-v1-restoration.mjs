// Vérifie (store localStorage polyfillé, même convention que les autres
// local-check-*.mjs) les stores ajoutés pour la restauration V1 -> V2
// (audit 2026-09-19) : formationProgressStore.js, dossierStepStore.js, et
// l'agrégation multi-clients getAllClientInitiatedItems (clientTrackingStore).
import assert from 'node:assert/strict'
import { register } from 'node:module'
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

const { FORMATION_UNITS } = await import('./src/data/mockData.js')
const { getFormationState, startUnit, saveChapterProgress, markUnitComplete, saveExamResult } = await import('./src/local/formationProgressStore.js')
const { STEP_LABELS, getDossierStep, setDossierStep } = await import('./src/local/dossierStepStore.js')
const { createClientSupportRequest, respondToClientRequest, getAllClientInitiatedItems } = await import('./src/local/clientTrackingStore.js')

// --- Formation IAS1 progress (client) ---
{
  const clientId = 'formation-test-1'
  const initial = getFormationState(clientId)
  assert.equal(initial.units.length, FORMATION_UNITS.length)
  assert.equal(initial.units[0].status, 'in_progress', "la première unité doit être 'in_progress' par défaut")
  assert.ok(initial.units.slice(1).every(u => u.status === 'locked'), 'les unités suivantes sont verrouillées tant que rien n\'a été fait')
  assert.equal(initial.completedChapters.size, 0)
  assert.equal(initial.examResults.length, 0)

  // Compléter tous les chapitres de l'unité 1 -> déclenche markUnitComplete côté composant,
  // ici on appelle directement les fonctions pures comme le ferait LocalMaFormation.jsx.
  const unit1 = FORMATION_UNITS[0]
  unit1.chapters.forEach((_, i) => saveChapterProgress(clientId, `1.${i + 1}`))
  markUnitComplete(clientId, 1, unit1.totalHours)

  const afterUnit1 = getFormationState(clientId)
  const u1 = afterUnit1.units.find(u => u.id === 1)
  const u2 = afterUnit1.units.find(u => u.id === 2)
  assert.equal(u1.status, 'completed')
  assert.equal(u1.completedHours, unit1.totalHours)
  assert.equal(u2.status, 'in_progress', "l'unité suivante doit se débloquer automatiquement")
  assert.equal(afterUnit1.completedChapters.size, unit1.chapters.length)

  // Résultat d'examen — append-only, le plus récent en premier.
  saveExamResult(clientId, 'ias1', 12, 20)
  saveExamResult(clientId, 'ias1', 17, 20)
  const state = getFormationState(clientId)
  assert.equal(state.examResults.length, 2)
  assert.equal(state.examResults[0].score, 17, 'le résultat le plus récent doit être en premier')

  // Un autre client ne doit jamais voir la progression de celui-ci.
  const other = getFormationState('formation-test-2')
  assert.equal(other.units[0].status, 'in_progress')
  assert.equal(other.completedChapters.size, 0)
  assert.equal(other.examResults.length, 0)
}
console.log('PASS: progression Formation IAS1 (déblocage d\'unité, chapitres, résultats d\'examen append-only, isolation par client)')

// --- Dossier step tracker (admin) ---
{
  const clientId = 'dossier-test-1'
  assert.equal(getDossierStep(clientId, 3), 3, 'sans override, la valeur par défaut fournie par l\'appelant est utilisée')
  setDossierStep(clientId, 4)
  assert.equal(getDossierStep(clientId, 3), 4, 'l\'override admin doit primer sur la valeur par défaut')
  setDossierStep(clientId, 99)
  assert.equal(getDossierStep(clientId, 3), STEP_LABELS.length, 'jamais au-delà du nombre d\'étapes réel')
  setDossierStep(clientId, -1)
  assert.equal(getDossierStep(clientId, 3), 1, 'jamais en dessous de 1')
  // Un autre client reste sur sa propre valeur par défaut.
  assert.equal(getDossierStep('dossier-test-2', 2), 2)
}
console.log('PASS: suivi des étapes du dossier (override admin par client, bornes 1..6, isolation par client)')

// --- Inbox admin agrégé (Notifications) ---
{
  const c1 = 'notif-agg-1'
  const c2 = 'notif-agg-2'
  const r1 = createClientSupportRequest(c1, { subject: 'Sujet A', message: 'Message A' }, 'Client A')
  const r2 = createClientSupportRequest(c2, { subject: 'Sujet B', message: 'Message B' }, 'Client B')
  const items = getAllClientInitiatedItems()
  const ids = items.map(i => i.id)
  assert.ok(ids.includes(r1.id) && ids.includes(r2.id), 'l\'inbox agrégé doit contenir les demandes de TOUS les clients')
  const item1 = items.find(i => i.id === r1.id)
  const item2 = items.find(i => i.id === r2.id)
  assert.equal(item1.clientId, c1)
  assert.equal(item2.clientId, c2)

  // Répondre à une seule demande ne doit affecter que celle-ci dans l'inbox agrégé.
  respondToClientRequest(r1.id, 'Réponse à A')
  const after = getAllClientInitiatedItems()
  assert.equal(after.find(i => i.id === r1.id).status, 'replied')
  assert.equal(after.find(i => i.id === r2.id).status, 'waiting')
}
console.log('PASS: inbox admin agrégé (toutes demandes clients confondues), réponse ciblée sans effet croisé')

// --- Catégorie de demande de support (widget FAQ/WhatsApp/Calendly restauré) ---
{
  const clientId = 'support-category-test'
  const req = createClientSupportRequest(clientId, { subject: 'Question formation', message: 'Où en est mon avancement ?', category: 'formation' })
  assert.ok(req)
  const item = getAllClientInitiatedItems().find(i => i.id === req.id)
  assert.equal(item.category, 'formation', 'la catégorie choisie par le client doit être conservée sur la demande')
  // Une demande sans catégorie reste valide (champ optionnel).
  const req2 = createClientSupportRequest(clientId, { subject: 'Autre question', message: 'Sans catégorie' })
  assert.equal(req2.category, null)
}
console.log('PASS: catégorie de demande de support conservée (champ optionnel restauré depuis V1)')

console.log('ALL PASS: restauration V1 (Formation IAS1, suivi des dossiers, inbox notifications agrégé)')
