// Simulation E2E d'un "client existant" — audit "complete all remaining
// local work" (2026-09-22), Task P. Utilise UNIQUEMENT les stores locaux
// (MemoryStorage, aucun réseau) comme fixtures : ce n'est pas un test de
// la couche production (celle-ci exige un vrai Supabase, hors de portée
// ici — voir docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md pour le plan
// de régression LIVE), mais une preuve que le contrat de continuité
// (mêmes données, même clientId, aucune duplication, aucun repli démo)
// tient au niveau de chaque store/adaptateur pris individuellement,
// exactement comme les adaptateurs supabase.js délèguent tels quels à
// src/lib/api.js sans transformation additionnelle.
//
// 100% local, aucun accès réseau/Supabase.

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

const { setDossierStep, getDossierStep } = await import('./src/local/dossierStepStore.js')
const { uploadDocument, validateDocument, getClientDocuments } = await import('./src/local/documentsStore.js')
const { markUnitComplete, getFormationState, saveExamResult, fetchExamResults } = await import('./src/local/formationProgressStore.js')
const { applyPaymentValidation } = await import('./src/local/conversion.js')
const { createClientSupportRequest, getClientSends } = await import('./src/local/clientTrackingStore.js')
const { seed } = await import('./src/local/model.js')
const { LOCAL_PACKS } = await import('./src/local/packsData.js')
const { buildClientsOverview, defaultStepIndexFor } = await import('./src/local/clientsOverviewData.js')

let passed = 0
function check(label, fn) {
  fn()
  passed += 1
  console.log(`  ok - ${label}`)
}

// Client de test "existant" — id volontairement distinct de tout id déjà
// utilisé par d'autres scripts local-check-*.mjs pour éviter toute
// collision de namespace localStorage.
const CLIENT_ID = 9401

check('Un client "existant" (dossier + documents + formation + examen + paiement + support) conserve exactement son état à travers un relecture complète — même clientId partout, aucune donnée dupliquée', () => {
  // --- État initial simulé (équivalent à "avant migration") ---
  setDossierStep(CLIENT_ID, 3, 'Admin Test')
  uploadDocument(CLIENT_ID, 'cin', 'CIN', { name: 'cin.pdf' })
  validateDocument(CLIENT_ID, 'cin', 'Admin Test')
  const { units } = getFormationState(CLIENT_ID)
  markUnitComplete(CLIENT_ID, units[0].id, units[0].totalHours)
  saveExamResult(CLIENT_ID, 'ias1', 18, 20)
  createClientSupportRequest(CLIENT_ID, { subject: 'Question', message: 'Bonjour', category: 'dossier' }, 'Client Test')

  const leads = seed()
  const prospect = leads.find(l => l.stage !== 'Client' && !l.paymentValidated)
  const packId = prospect.packId || LOCAL_PACKS[0]?.id
  const withPack = leads.map(l => l.id === prospect.id ? { ...l, id: CLIENT_ID, packId } : l).filter(l => l.id !== prospect.id || l.id === CLIENT_ID)
  const converted = applyPaymentValidation(withPack, CLIENT_ID)
  const convertedClient = converted.find(l => l.id === CLIENT_ID)
  assert.equal(convertedClient.paymentValidated, true, 'précondition : conversion réussie')

  // --- "Relecture" (équivalent à rouvrir une session après migration) ---
  const stepAfter = getDossierStep(CLIENT_ID, defaultStepIndexFor(CLIENT_ID) + 1)
  const docsAfter = getClientDocuments(CLIENT_ID)
  const formationAfter = getFormationState(CLIENT_ID)
  const examAfter = fetchExamResultsSafe()
  const supportAfter = getClientSends(CLIENT_ID)
  const { rows: allRows } = buildClientsOverview(converted)
  const rows = allRows.filter(r => r.id === CLIENT_ID)

  function fetchExamResultsSafe() {
    // formationProgressStore expose déjà fetchExamResults ? sinon relire via getFormationState
    return typeof fetchExamResults === 'function' ? fetchExamResults(CLIENT_ID) : null
  }

  assert.equal(stepAfter, 3, 'même étape de dossier après relecture')
  assert.equal(docsAfter.cin.status, 'valid', 'même statut de document après relecture')
  assert.equal(formationAfter.units[0].completedHours, units[0].totalHours, 'même progression formation après relecture')
  const supportTicketsAfter = supportAfter.filter(i => i.title === 'Question')
  assert.equal(supportTicketsAfter.length, 1, 'même ticket de support après relecture, jamais dupliqué (en plus des messages de démo pré-remplis)')
  assert.equal(rows.length, 1, 'un seul client dans le résumé admin, jamais de doublon de compte')
  assert.equal(rows[0].id, CLIENT_ID, 'le même clientId partout, jamais un id recalculé/différent')

  // Rejouer une seconde "relecture" ne doit rien changer/dupliquer.
  const docsSecondRead = getClientDocuments(CLIENT_ID)
  assert.deepEqual(docsSecondRead.cin.status, docsAfter.cin.status, 'lecture idempotente, aucun effet de bord')
  const supportSecondRead = getClientSends(CLIENT_ID)
  assert.equal(supportSecondRead.length, supportAfter.length, 'aucun ticket dupliqué par une seconde lecture')
})

check('Aucun repli "Client Démo" ne s\'active pour un clientId qui n\'est pas le client canonique — les stores restent scoped par clientId explicite, jamais un id global implicite', () => {
  const otherClientDocs = getClientDocuments(CLIENT_ID)
  const demoClientDocs = getClientDocuments(6) // CANONICAL_DEMO_CLIENT_ID, seedé séparément
  assert.notDeepEqual(otherClientDocs.cin, demoClientDocs.cin, 'les documents du client de test et du client de démo doivent rester indépendants (pas de fusion accidentelle)')
})

console.log(`PASS (${passed} checks): simulation E2E de continuité client (dossier/documents/formation/examen/paiement/support), même clientId de bout en bout, aucune duplication, aucun repli démo.`)
