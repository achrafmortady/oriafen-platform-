// Régression ciblée — audit "final data consistency" (2026-09-20).
//
// Constat signalé : pour un même client ("Client Démo"), le widget
// dashboard client (LocalMonDossier.jsx) et le résumé admin "Clients"
// (clientsOverviewData.js) affichaient des chiffres différents de ceux des
// pages détaillées (Dossiers, Documents, Formation IAS1) — dossier
// (1/6 admin vs 2-3/6 client), formation (7/150h widget vs 0/150h page
// réelle), documents (0 validé/1 en attente/5 manquants résumé vs 1 validé/
// 1 en attente/2 refusés/2 non soumis page réelle).
//
// Cause racine : LocalMonDossier.jsx utilisait des constantes statiques
// (STEPS/FORMATION_UNITS/VALID_DOCS hardcodées) jamais connectées aux vrais
// stores, et clientsOverviewData.js calculait étape/documents/heures via une
// formule synthétique basée sur `lead.id`, elle aussi déconnectée des
// actions réelles (admin, upload/validation client, progression formation).
//
// Correctif : les deux lisent désormais EXACTEMENT les mêmes stores locaux
// que les pages détaillées (dossierStepStore / documentsStore /
// formationProgressStore) — aucun nouveau store, aucune valeur dupliquée.
// Ce script vérifie qu'un changement réel (admin ou client) sur l'un de ces
// stores se reflète immédiatement et identiquement partout où ce client est
// affiché, pour le MÊME clientId.
//
// 100% local (MemoryStorage), aucun accès réseau/Supabase.

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
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, opts = {}) { this.type = type; this.detail = opts.detail }
  }
}
globalThis.localStorage = new MemoryStorage()
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} }

const { getDossierStep, setDossierStep } = await import('./src/local/dossierStepStore.js')
const { getClientDocuments, uploadDocument, validateDocument, rejectDocument } = await import('./src/local/documentsStore.js')
const { getFormationState, markUnitComplete } = await import('./src/local/formationProgressStore.js')
const { buildClientsOverview, ORIAS_STEPS, defaultStepIndexFor } = await import('./src/local/clientsOverviewData.js')
const { REQUIRED_DOCUMENTS } = await import('./src/data/mockData.js')

let passed = 0
function check(label, fn) {
  fn()
  passed += 1
  console.log(`  ok - ${label}`)
}

function makeClientLead(id) {
  return { id, stage: 'Client', paymentValidated: true, name: `Client Test ${id}`, email: `client${id}@example.invalid`, phone: '0600000000', city: 'Casablanca', pack: 'Essentiel', owner: 'Test' }
}
function overviewRowFor(id) {
  const { rows } = buildClientsOverview([makeClientLead(id)])
  assert.equal(rows.length, 1)
  return rows[0]
}

// ================================================================
// 1. Dossier : admin (dossierStepStore, même store que l'onglet "Dossiers")
//    vs résumé admin "Clients" (clientsOverviewData.js) — reproduit le
//    mismatch signalé (dossier avancé côté client/admin mais resté à
//    l'étape 1 dans le résumé).
// ================================================================
check('Mismatch dossier : une étape validée par l\'admin (dossierStepStore) est immédiatement reflétée dans le résumé "Clients" (clientsOverviewData.js), même clientId', () => {
  const id = 8101
  setDossierStep(id, 3, 'Admin Test')

  const stepFromDetailStore = getDossierStep(id, defaultStepIndexFor(id) + 1)
  assert.equal(stepFromDetailStore, 3, 'précondition : dossierStepStore (source des pages détaillées) reflète bien l\'action admin')

  const row = overviewRowFor(id)
  assert.equal(row.stepIndex, 2, 'le résumé admin "Clients" doit lire la même étape (stepIndex = step - 1), jamais une valeur figée/désynchronisée')
  assert.equal(row.step, ORIAS_STEPS[2])
})

// ================================================================
// 2. Formation : formationProgressStore (même store que Formation IAS1)
//    vs ce que consommerait le widget dashboard client — reproduit le
//    mismatch signalé (7/150h widget vs 0/150h page réelle pour un client
//    n'ayant rien complété).
// ================================================================
check('Mismatch formation : un client n\'ayant rien complété affiche 0h (jamais un total hardcodé) et une progression réelle se reflète immédiatement, même clientId', () => {
  const id = 8102
  const before = getFormationState(id).units
  const completedBefore = before.reduce((sum, u) => sum + u.completedHours, 0)
  assert.equal(completedBefore, 0, 'un client n\'ayant jamais touché à la formation doit afficher 0h, jamais une valeur hardcodée comme 7h')

  const [firstUnit] = before
  markUnitComplete(id, firstUnit.id, firstUnit.totalHours)

  const after = getFormationState(id).units
  const completedAfter = after.reduce((sum, u) => sum + u.completedHours, 0)
  assert.equal(completedAfter, firstUnit.totalHours, 'la progression réelle (même store que Formation IAS1) doit se refléter immédiatement, sans second calcul divergent')
})

// ================================================================
// 3. Documents : documentsStore (même store que Documents) vs résumé admin
//    "Clients" — reproduit le mismatch signalé (0 validé/1 en attente/5
//    manquants résumé vs 1 validé/1 en attente/2 refusés/2 non soumis page
//    réelle, soit 1 valide / 1 en attente / 4 dans le panier "manquant").
// ================================================================
check('Mismatch documents : le résumé admin "Clients" compte exactement les mêmes documents (valides/en attente/manquants) que documentsStore, même clientId', () => {
  const id = 8103
  const [cin, passeport, domicile, certif, selfie, contrat] = REQUIRED_DOCUMENTS

  // Neutralise l'état hérité du seed de démo (cycle valid/pending/missing/
  // none par défaut) avant de construire le scénario exact ci-dessous —
  // rejectDocument est un no-op sûr si aucun fichier n'a encore été envoyé.
  REQUIRED_DOCUMENTS.forEach(r => rejectDocument(id, r.id, 'reset', 'Admin Test'))

  // Reproduit le scénario signalé : 1 validé, 1 en attente, 2 refusés, 2 non
  // soumis (page détaillée) => panier "manquant" du résumé = 4 (2+2).
  uploadDocument(id, cin.id, cin.label, { name: 'cin.pdf' })
  validateDocument(id, cin.id, 'Admin Test') // 1 validé

  uploadDocument(id, passeport.id, passeport.label, { name: 'passeport.pdf' }) // 1 en attente

  uploadDocument(id, domicile.id, domicile.label, { name: 'domicile.pdf' })
  rejectDocument(id, domicile.id, 'Illisible', 'Admin Test') // refusé
  uploadDocument(id, certif.id, certif.label, { name: 'certif.pdf' })
  rejectDocument(id, certif.id, 'Illisible', 'Admin Test') // refusé
  // selfie / contrat : jamais envoyés => non soumis

  const docs = getClientDocuments(id)
  const validFromDetailStore = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'valid').length
  const pendingFromDetailStore = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'pending').length
  assert.equal(validFromDetailStore, 1)
  assert.equal(pendingFromDetailStore, 1)

  const row = overviewRowFor(id)
  assert.equal(row.validDocs, validFromDetailStore, 'le résumé admin doit compter le même nombre de documents validés que la page Documents')
  assert.equal(row.pendingDocs, pendingFromDetailStore, 'le résumé admin doit compter le même nombre de documents en attente que la page Documents')
  assert.equal(row.missingDocs, REQUIRED_DOCUMENTS.length - validFromDetailStore - pendingFromDetailStore, 'manquants = refusés + non soumis, jamais un chiffre indépendant')
  assert.equal(row.missingDocs, 4)
})

// ================================================================
// 4. Garde statique : LocalMonDossier.jsx (widget dashboard client) ne doit
//    plus jamais réintroduire de constantes hardcodées déconnectées des
//    stores réels — régression directe du bug signalé.
// ================================================================
check('Garde anti-régression : LocalMonDossier.jsx lit les stores canoniques (dossierStepStore/documentsStore/formationProgressStore), jamais des constantes hardcodées', () => {
  const src = readFileSync('./src/local/LocalMonDossier.jsx', 'utf8')
  assert.match(src, /getDossierStep\(/, 'doit lire l\'étape via dossierStepStore (même source que l\'onglet admin "Dossiers")')
  assert.match(src, /getClientDocuments\(/, 'doit lire les documents via documentsStore (même source que la page Documents)')
  assert.match(src, /getFormationState\(/, 'doit lire la formation via formationProgressStore (même source que Formation IAS1)')
  assert.doesNotMatch(src, /completedHours:\s*7\b/, 'ne doit plus contenir la valeur hardcodée "7" du bug signalé (7/150h)')
  assert.doesNotMatch(src, /const\s+VALID_DOCS\s*=\s*0/, 'VALID_DOCS ne doit plus être une constante figée à 0')
})

console.log(`PASS (${passed} checks): cohérence dashboard <-> pages détaillées (dossier, formation, documents) — même source, même clientId, mise à jour immédiate.`)
