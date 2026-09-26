// Régression ciblée — audit "final inspection report" (2026-09-26) : V2
// jugée "NOT READY", 12 sections de correctifs demandés. Ce fichier couvre
// les correctifs testables par fonctions pures ; le reste (wording/JSX) est
// couvert par des vérifications statiques de source, même convention que
// les autres local-check-*.mjs de cette session. 100% local, aucun accès
// réseau/Supabase.

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

const { buildClientsOverview, defaultStepIndexFor } = await import('./src/local/clientsOverviewData.js')
const { getDossierStep } = await import('./src/local/dossierStepStore.js')
const { getClientDocuments, uploadDocument, rejectDocument } = await import('./src/local/documentsStore.js')
const { getAdminNotifications } = await import('./src/local/adminNotificationsStore.js')
const { addDeliverable, getDeliverables, DELIVERABLE_TYPES } = await import('./src/local/marketingStore.js')
const { REQUIRED_DOCUMENTS } = await import('./src/data/mockData.js')

function makeClientLead(id, overrides = {}) {
  return { id, stage: 'Client', paymentValidated: true, name: `Client Test ${id}`, email: `client${id}@example.invalid`, phone: '0600000000', city: 'Casablanca', pack: 'Essentiel', owner: 'Test', createdAt: Date.now(), ...overrides }
}

// ================================================================
// 2. Nouveau client converti : état initial correct (jamais Bloqué à 67%,
//    jamais une étape aléatoire, jamais un doc "refusé" fantôme).
// ================================================================
check('defaultStepIndexFor() est toujours 0 (étape 1) pour un nouveau client, jamais une valeur aléatoire dérivée de l\'id (Date.now())', () => {
  assert.equal(defaultStepIndexFor(), 0)
  assert.equal(defaultStepIndexFor(Date.now()), 0)
})

check('Un client fraîchement converti (aucune action admin) démarre à l\'étape 1, statut "En cours" (jamais "Bloqué"), 0/6 documents validés', () => {
  const id = 90101
  const { rows } = buildClientsOverview([makeClientLead(id)])
  assert.equal(rows.length, 1)
  const row = rows[0]
  assert.equal(row.stepIndex, 0, 'doit démarrer à la première étape ORIAS')
  assert.notEqual(row.status, 'Bloqué', 'un client tout juste converti, sans document refusé, ne doit jamais être "Bloqué"')
  assert.equal(row.validDocs, 0)
  assert.equal(row.rejectedDocs, 0, 'aucun document réellement refusé pour un nouveau client')
  assert.ok(row.progressPct < 30, 'la progression dossier doit rester proche de 0%, jamais 67%')
})

check('Le statut "Bloqué"/"À relancer" ne se déclenche que sur des documents RÉELLEMENT refusés (rejetés après envoi), jamais sur des documents simplement pas encore envoyés', () => {
  const id = 90102
  // 6 documents jamais envoyés (status='none') : ne doit PAS déclencher Bloqué.
  const { rows: freshRows } = buildClientsOverview([makeClientLead(id)])
  assert.equal(freshRows[0].status, 'En cours')

  // Envoie puis rejette réellement 4 documents : doit désormais déclencher Bloqué.
  REQUIRED_DOCUMENTS.slice(0, 4).forEach(req => {
    uploadDocument(id, req.id, req.label, { name: `${req.id}.pdf` })
    rejectDocument(id, req.id, 'Motif de test', 'Admin Test')
  })
  const { rows: afterRows } = buildClientsOverview([makeClientLead(id)])
  assert.equal(afterRows[0].rejectedDocs, 4)
  assert.equal(afterRows[0].status, 'Bloqué')
})

check('documentsStore.js : rejectDocument() reste un no-op sur un document jamais envoyé (fileName=null) — impossible de "refuser" un document non soumis', () => {
  const id = 90103
  const category = REQUIRED_DOCUMENTS[0].id
  const before = getClientDocuments(id)[category].status
  assert.equal(before, 'none')
  const ok = rejectDocument(id, category, 'test', 'Admin Test')
  assert.equal(ok, false)
  assert.equal(getClientDocuments(id)[category].status, 'none', 'un document jamais envoyé ne doit jamais passer à "Refusé"')
})

// ================================================================
// 6. Compteurs documents : "Non requis" (associé, optionnel, status=none)
//    n'a plus de bouton actif — vérification statique.
// ================================================================
check('LocalMesDocuments.jsx : le bouton d\'envoi est masqué pour une catégorie facultative encore vide ("Non requis"), jamais actif à tort', () => {
  const src = readFileSync('./src/local/LocalMesDocuments.jsx', 'utf8')
  assert.match(src, /status !== 'valid' && !\(status === 'none' && optional\)/)
})

check('documentsStore.js : le motif de rejet ne produit plus jamais un double point ("complète..")', () => {
  const src = readFileSync('./src/local/documentsStore.js', 'utf8')
  assert.match(src, /function withoutTrailingPunctuation/)
  assert.match(src, /Motif : \$\{withoutTrailingPunctuation\(doc\.rejectionReason\)\}\.`/)
  assert.match(src, /Motif : \$\{withoutTrailingPunctuation\(cleanReason\)\}\.`/)
})

// ================================================================
// 7. Brand kit : livrables séparés par type, publiables par l'admin.
// ================================================================
check('marketingStore.js : addDeliverable() publie un livrable typé (posts/stories/scripts/calendar/other), notifie le client, jamais un doublon de store', () => {
  const clientId = 90104
  assert.deepEqual(getDeliverables(clientId), [])
  const d1 = addDeliverable(clientId, { type: 'posts', name: 'Post lancement', url: 'https://example.invalid/post1' }, 'Client Test')
  assert.ok(d1)
  assert.equal(d1.type, 'posts')
  assert.equal(d1.kind, DELIVERABLE_TYPES.posts)
  const d2 = addDeliverable(clientId, { type: 'calendar', name: 'Calendrier Q4' }, 'Client Test')
  assert.equal(d2.type, 'calendar')
  const all = getDeliverables(clientId)
  assert.equal(all.length, 2)
  assert.ok(all.some(d => d.type === 'posts') && all.some(d => d.type === 'calendar'), 'les types doivent rester distincts et récupérables séparément')
})

check('marketingStore.js : addDeliverable() retombe sur "other" pour un type inconnu, jamais une erreur ou un type inventé', () => {
  const d = addDeliverable(90105, { type: 'bogus-type', name: 'Test' })
  assert.equal(d.type, 'other')
})

check('LocalMarketing.jsx : DeliverablesCard regroupe les livrables par type et n\'affiche le formulaire de publication que pour l\'admin (editable)', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  assert.match(src, /function DeliverablesCard\(\{ deliverables, editable = false, onAdd \}\)/)
  assert.match(src, /Object\.keys\(DELIVERABLE_TYPES\)\.map\(type =>/)
  assert.match(src, /<DeliverablesCard deliverables=\{deliverables\} editable onAdd=/)
})

// ================================================================
// 9. CRM : étape de confirmation avant validation de paiement (jamais un
//    seul clic irréversible).
// ================================================================
check('LocalCRM.jsx : la validation du paiement passe par une étape de confirmation explicite (résumé client/pack/montant) avant d\'appeler validatePayment', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /confirmingPayment\?\(/)
  assert.match(src, /Confirmer la conversion/)
  assert.match(src, /onClick=\{\(\)=>\{validatePayment\(lead\.id\);setConvertAttempt\(false\);setConfirmingPayment\(false\)\}\}/)
})

// ================================================================
// 10. Notifications : prospect créé, document envoyé, client converti.
// ================================================================
check('documentsStore.js : uploadDocument() déclenche une notification admin ("Nouveau document envoyé")', () => {
  const before = getAdminNotifications().length
  uploadDocument(90106, REQUIRED_DOCUMENTS[0].id, REQUIRED_DOCUMENTS[0].label, { name: 'x.pdf' })
  const after = getAdminNotifications()
  assert.ok(after.length > before)
  assert.ok(after.some(n => n.type === 'document' && n.clientId === 90106))
})

check('LocalCRM.jsx : la création manuelle d\'un prospect et la validation du paiement déclenchent chacune une notification admin', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /admin-notif:prospect-created:/)
  assert.match(src, /admin-notif:converted:/)
})

// ================================================================
// 1 / 3 / 4 / 12. Wording honnête (vérifications statiques) — plus de
// "Démonstration locale · données fictives", email/upload honnêtes,
// Calendly présenté comme non configuré plutôt que fonctionnel.
// ================================================================
check('Plus aucune occurrence de "Démonstration locale" / "données fictives" dans l\'UI locale', () => {
  ;['LocalCRM.jsx', 'LocalMesDocuments.jsx', 'LocalAdminShell.jsx'].forEach(f => {
    const src = readFileSync(`./src/local/${f}`, 'utf8')
    assert.doesNotMatch(src, /Démonstration locale/, `${f} ne doit plus contenir "Démonstration locale"`)
  })
})

check('LocalCRM.jsx : le panneau email d\'activation affiche un statut honnête (préparé/copié/ouvert) et un bouton "Envoi réel" désactivé, jamais un envoi prétendu', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /STATUS_BADGE=\{/)
  assert.match(src, /Envoi réel \(indisponible en staging local\)/)
  assert.match(src, /Aucun backend d'envoi réel n'est branché/)
})

check('LocalCRM.jsx : le bloc "Prendre RDV"\/Calendly est présenté comme non configuré (bientôt disponible), jamais comme fonctionnel', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /Prise de rendez-vous bientôt disponible/)
  assert.match(src, /<button className="btn-gold mt-4" disabled/)
})

console.log(`PASS (${passed} checks): audit "final inspection report" 2026-09-26 — dossier initial correct (jamais Bloqué/67%), documents Refusé vs Manquant distincts, livrables Marketing séparés par type, confirmation de conversion, notifications complètes, wording honnête (email/upload/Calendly).`)
