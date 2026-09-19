// Vérifie (Node, aucun navigateur, aucun accès réseau) la couche
// adaptateurs préparée pour le câblage production (src/local/adapters/*) —
// audit "production wiring preparation" 2026-09-20.
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { readFileSync, readdirSync } from 'node:fs'
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

// ============================================================
// 1. STATIQUE : la Preview n'initialise jamais Supabase, où qu'on regarde
// dans la nouvelle couche adaptateurs. Même principe que les vérifications
// F1/F2 déjà présentes dans local-check-tracking.mjs, étendu ici aux
// nouveaux fichiers src/local/adapters/*.
// ============================================================
{
  const files = readdirSync('./src/local/adapters').filter(f => f.endsWith('.js'))
  assert.ok(files.length >= 5, 'la couche adaptateurs doit exister (identity/documents/marketing/support/formation)')
  files.forEach(f => {
    const src = readFileSync(`./src/local/adapters/${f}`, 'utf8')
    assert.doesNotMatch(src, /from ['"]@supabase\/supabase-js['"]/, `${f} ne doit jamais importer le client Supabase`)
    assert.doesNotMatch(src, /from ['"]\.\.\/\.\.\/lib\/supabase['"]/, `${f} ne doit jamais importer src/lib/supabase.js`)
    assert.doesNotMatch(src, /supabase\.auth\.|supabase\.from\(/, `${f} ne doit jamais appeler l'API Supabase directement`)
    assert.match(src, /ADAPTER_MODE|assertLocalMode|getActiveIdentity|getActiveClientId/, `${f} doit référencer le garde-fou de mode adaptateur`)
  })
}
console.log('PASS: aucun fichier de la couche adaptateurs n\'importe/n\'appelle Supabase (vérification statique)')

const { getActiveIdentity, getActiveClientId, getActiveClientName, ADAPTER_MODE } = await import('./src/local/adapters/identity.js')
const documentsAdapter = await import('./src/local/adapters/documentsAdapter.js')
const marketingAdapter = await import('./src/local/adapters/marketingAdapter.js')
const supportAdapter = await import('./src/local/adapters/supportAdapter.js')
const formationAdapter = await import('./src/local/adapters/formationAdapter.js')
const { CANONICAL_DEMO_CLIENT_ID, CANONICAL_DEMO_CLIENT_NAME } = await import('./src/local/model.js')
const { LOCAL_PACKS } = await import('./src/local/packsData.js')

// ============================================================
// 2. IDENTITÉ — mode Preview, id/nom cohérents, jamais 'supabase'.
// ============================================================
{
  assert.equal(ADAPTER_MODE, 'local', 'ADAPTER_MODE doit rester "local" tant que la production n\'est pas explicitement activée')
  const identity = getActiveIdentity()
  assert.equal(identity.id, CANONICAL_DEMO_CLIENT_ID)
  assert.equal(identity.name, CANONICAL_DEMO_CLIENT_NAME)
  assert.equal(getActiveClientId(), CANONICAL_DEMO_CLIENT_ID)
  assert.equal(getActiveClientName(), CANONICAL_DEMO_CLIENT_NAME)

  // Résolution d'un AUTRE client (vue admin) : identité distincte, jamais
  // confondue avec le client actif par défaut.
  const other = getActiveIdentity({ id: 999, name: 'Autre Client' })
  assert.equal(other.id, 999)
  assert.notEqual(other.id, getActiveClientId())
}
console.log('PASS: identité active cohérente (mode Preview), résolution d\'un autre client sans collision')

// ============================================================
// 3. "user A cannot resolve user B data" — même id utilisé partout,
// jamais de fuite entre deux clients à travers les adaptateurs.
// ============================================================
{
  const A = 'adapter-user-A'
  const B = 'adapter-user-B'

  documentsAdapter.upload(A, 'cin', 'CIN', { name: 'a.pdf' })
  documentsAdapter.upload(B, 'cin', 'CIN', { name: 'b.pdf' })
  assert.equal(documentsAdapter.getDocuments(A).cin.fileName, 'a.pdf')
  assert.equal(documentsAdapter.getDocuments(B).cin.fileName, 'b.pdf', 'le document de B ne doit jamais être écrasé par celui de A')

  marketingAdapter.createRequest(A, { section: 'X', title: 'Demande A' }, 'A')
  marketingAdapter.createRequest(B, { section: 'X', title: 'Demande B' }, 'B')
  assert.equal(marketingAdapter.getRequests(A).length, 1)
  assert.equal(marketingAdapter.getRequests(A)[0].title, 'Demande A')
  assert.equal(marketingAdapter.getRequests(B)[0].title, 'Demande B')

  supportAdapter.createTicket(A, { subject: 'Sujet A', message: 'Message A' }, 'A')
  supportAdapter.createTicket(B, { subject: 'Sujet B', message: 'Message B' }, 'B')
  const threadA = supportAdapter.getThread(A).find(i => i.title === 'Sujet A')
  const threadB = supportAdapter.getThread(B).find(i => i.title === 'Sujet B')
  assert.ok(threadA && threadB)
  assert.notEqual(threadA.id, threadB.id)

  formationAdapter.completeChapter(A, '1.1')
  const stateA = formationAdapter.getFormation(A)
  const stateB = formationAdapter.getFormation(B)
  assert.equal(stateA.completedChapters.size, 1)
  assert.equal(stateB.completedChapters.size, 0, 'la progression de A ne doit jamais apparaître chez B')
}
console.log('PASS: aucune fuite de données entre deux clients à travers les 4 adaptateurs (documents/marketing/support/formation)')

// ============================================================
// 4. Séparation documents client vs associé (via l'adaptateur).
// ============================================================
{
  const clientId = 'adapter-assoc-test'
  documentsAdapter.upload(clientId, 'cin', 'CIN', { name: 'client.pdf' })
  documentsAdapter.upload(clientId, 'associate_cin_recto', "CIN associé", { name: 'associate.pdf' })
  const docs = documentsAdapter.getDocuments(clientId)
  assert.equal(docs.cin.fileName, 'client.pdf')
  assert.equal(docs.associate_cin_recto.fileName, 'associate.pdf')
  assert.equal(documentsAdapter.isAssociateCategory('associate_cin_recto'), true)
  assert.equal(documentsAdapter.isAssociateCategory('cin'), false)
  assert.equal(documentsAdapter.countAssociateSent(docs), 1)
}
console.log('PASS: séparation client/associé préservée au niveau de l\'adaptateur')

// ============================================================
// 5. Isolation des fils de support (pas de réponse croisée) via l'adaptateur.
// ============================================================
{
  const clientId = 'adapter-thread-test'
  const t1 = supportAdapter.createTicket(clientId, { subject: 'Fil 1', message: 'Un' }, 'Client')
  const t2 = supportAdapter.createTicket(clientId, { subject: 'Fil 2', message: 'Deux' }, 'Client')
  supportAdapter.respondToTicket(t1.id, 'Réponse au fil 1')
  const thread = supportAdapter.getThread(clientId)
  assert.equal(thread.find(i => i.id === t1.id).status, 'replied')
  assert.equal(thread.find(i => i.id === t2.id).status, 'waiting', 'répondre au fil 1 ne doit jamais affecter le fil 2')
}
console.log('PASS: isolation des fils de support au niveau de l\'adaptateur (pas de réponse croisée)')

// ============================================================
// 6. Dédoublonnage des notifications via l'adaptateur support.
// ============================================================
{
  const clientId = 'adapter-notif-dedupe'
  const before = supportAdapter.getThread(clientId).length
  supportAdapter.notifyClient(clientId, { kind: 'Document', title: 'Test', message: 'x', dedupeKey: 'dedupe-key-1' })
  supportAdapter.notifyClient(clientId, { kind: 'Document', title: 'Test', message: 'x', dedupeKey: 'dedupe-key-1' })
  const after = supportAdapter.getThread(clientId).length
  assert.equal(after, before + 1, 'la même dedupeKey ne doit jamais créer une deuxième notification')
}
console.log('PASS: dédoublonnage des notifications au niveau de l\'adaptateur')

// ============================================================
// 7. Formation / dossier / paiement — mappings + gate de paiement.
// ============================================================
{
  const clientId = 'adapter-formation-test'
  const initial = formationAdapter.getFormation(clientId)
  assert.equal(initial.units[0].status, 'in_progress')
  formationAdapter.startFormationUnit(clientId, 1)
  formationAdapter.completeChapter(clientId, '1.1')
  formationAdapter.recordExamResult(clientId, 'ias1', 18, 20)
  const state = formationAdapter.getFormation(clientId)
  assert.equal(state.examResults[0].score, 18)

  assert.equal(formationAdapter.getDossierStepFor(clientId, 2), 2)
  formationAdapter.advanceDossierStep(clientId, 3)
  assert.equal(formationAdapter.getDossierStepFor(clientId, 2), 3)

  // Gate de paiement : jamais contourné, exige un pack.
  const leadWithoutPack = [{ id: 1, paymentValidated: false, packId: null }]
  const stillBlocked = formationAdapter.validatePayment(leadWithoutPack, 1)
  assert.equal(stillBlocked[0].paymentValidated, false, 'sans pack sélectionné, la conversion doit rester bloquée (même garde-fou que le live)')

  const pack = LOCAL_PACKS[0]
  const leadWithPack = [{ id: 1, paymentValidated: false, packId: pack.id, finalPrice: pack.priceTtc }]
  const validated = formationAdapter.validatePayment(leadWithPack, 1)
  assert.equal(validated[0].paymentValidated, true)
}
console.log('PASS: adaptateur formation/dossier/paiement — mappings corrects, gate de paiement jamais contourné')

console.log('ALL PASS: couche adaptateurs production (identité, documents, marketing, support, formation/dossier/paiement) — mode Preview uniquement, aucun accès Supabase')
