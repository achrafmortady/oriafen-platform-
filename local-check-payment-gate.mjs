// Régression ciblée — audit "final blocker — payment gate" (2026-09-20).
//
// Bug QA confirmé : dans la fiche prospect, changer le Statut directement à
// "Client" convertissait immédiatement le lead (l'étiquette de statut
// changeait), même sans paiement validé — trompeur, puisque l'onglet
// "Clients" (lui) restait correctement vide tant que paymentValidated
// n'était pas vrai (voir Q1 dans local-check-tracking.mjs).
//
// Correctif : `stage` ne peut plus passer à "Client" par AUCUN chemin tant
// que paymentValidated n'est pas déjà vrai — seul point de vérité :
// canSetStageToClient() (conversion.js), réutilisé par :
//   - patch() dans LocalCRM.jsx (select Statut de la fiche Prospect)
//   - applyStatusChange() dans clientHistory.js (select Statut CRM de la
//     fiche Client dans LocalClientsOverview.jsx — et tout futur chemin
//     générique de changement de statut, y compris un futur drag/drop
//     Kanban : aucune interaction Kanban n'existe aujourd'hui dans le
//     staging V2 local — les cartes sont en lecture seule, cliquer ouvre la
//     fiche — mais applyStatusChange() est la fonction pure que
//     réutiliserait un tel drag/drop, donc la couvrir ici couvre aussi ce
//     chemin par construction, quelle que soit l'UI qui l'appelle demain)
// applyPaymentValidation() (conversion.js) reste la SEULE action qui fait
// réellement passer un prospect à "Client" : elle fixe désormais `stage`
// et `paymentValidated` dans la MÊME mise à jour (un seul évènement
// d'historique, jamais un "Statut changé" + "Paiement validé" séparés).
//
// Logique de paiement (répartition des échéances, montants, statut
// 'paid'/'pending') strictement inchangée — aucun test Finance touché.
//
// 100% local (MemoryStorage), aucun accès réseau/Supabase.

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
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, opts = {}) { this.type = type; this.detail = opts.detail }
  }
}
globalThis.localStorage = new MemoryStorage()
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} }

const { applyPaymentValidation, canSetStageToClient, PAYMENT_GATE_MESSAGE } = await import('./src/local/conversion.js')
const { applyStatusChange } = await import('./src/local/clientHistory.js')
const { buildClientsOverview } = await import('./src/local/clientsOverviewData.js')
const { LOCAL_PACKS } = await import('./src/local/packsData.js')

let passed = 0
function check(label, fn) {
  fn()
  passed += 1
  console.log(`  ok - ${label}`)
}

function makeUnpaidProspect(id, overrides = {}) {
  const pack = LOCAL_PACKS[0]
  return {
    id, stage: 'Qualifié', paymentValidated: false, name: `Prospect ${id}`,
    email: `p${id}@example.invalid`, phone: '0600000000', city: 'Casablanca',
    pack: pack.name, packId: pack.id, finalPrice: pack.priceTtc, pricingMode: 'ttc', discountPercent: 0,
    activity: [], ...overrides,
  }
}

// ================================================================
// 1. Prospect non payé -> "Client" bloqué (chemin fiche Prospect / select
//    Statut, reproduit par patch() dans LocalCRM.jsx via applyStatusChange,
//    la même fonction pure de changement de statut).
// ================================================================
check('1. Prospect non payé : passage direct du statut à "Client" est bloqué (aucune mutation)', () => {
  const lead = makeUnpaidProspect(9201)
  assert.equal(canSetStageToClient(lead), false, 'précondition : le gate doit refuser un lead non payé')

  const next = applyStatusChange([lead], 9201, 'Client')
  const updated = next.find(l => l.id === 9201)
  assert.equal(updated.stage, 'Qualifié', 'le statut ne doit PAS changer tant que le paiement n\'est pas validé')
  assert.equal(updated.activity.length, 0, 'aucune entrée d\'historique "Statut changé" ne doit être créée pour un changement refusé')
  assert.ok(PAYMENT_GATE_MESSAGE.length > 0, 'un message explicite doit être disponible pour l\'UI (carte de paiement / toast)')
})

// ================================================================
// 2. Prospect payé -> "Client" autorisé (le paiement a déjà été validé au
//    préalable, ex. depuis la fiche Client dans LocalClientsOverview.jsx,
//    qui ne présente d'ailleurs que des leads déjà payés).
// ================================================================
check('2. Prospect payé (paymentValidated=true) : passage du statut à "Client" fonctionne normalement', () => {
  const lead = makeUnpaidProspect(9202, { stage: 'Perdu', paymentValidated: true })
  assert.equal(canSetStageToClient(lead), true, 'précondition : le gate doit autoriser un lead déjà payé')

  const next = applyStatusChange([lead], 9202, 'Client')
  const updated = next.find(l => l.id === 9202)
  assert.equal(updated.stage, 'Client')
  assert.equal(updated.activity[0].text, 'Statut changé : Perdu -> Client')
})

// ================================================================
// 3. "Drag/drop" (ou toute autre interaction future basée sur la même
//    fonction générique de changement de statut) sur un prospect non payé
//    -> bloqué. Aucune interaction de glisser-déposer n'existe aujourd'hui
//    dans le Kanban du staging V2 local (cartes en lecture seule, cliquer
//    ouvre la fiche) — ce test cible directement applyStatusChange(), la
//    fonction pure que réutiliserait un tel drag/drop, pour garantir que le
//    même gate s'applique quel que soit le point d'entrée UI.
// ================================================================
check('3. "Déplacement" (drag/drop ou équivalent) d\'un prospect non payé vers la colonne "Client" est bloqué', () => {
  const lead = makeUnpaidProspect(9203, { stage: 'Engagé (Commit)' })
  const next = applyStatusChange([lead], 9203, 'Client')
  const updated = next.find(l => l.id === 9203)
  assert.equal(updated.stage, 'Engagé (Commit)', 'la colonne Kanban ne doit pas changer pour un lead non payé')

  const { rows } = buildClientsOverview(next)
  assert.equal(rows.length, 0, 'le lead ne doit jamais apparaître dans l\'onglet "Clients" suite à un déplacement bloqué')
})

// ================================================================
// 4. Aucune conversion ni entrée d'historique en double : la validation du
//    paiement fixe stage + paymentValidated en une seule opération (jamais
//    un "Statut changé" séparé du "Paiement validé"), et rejouer l'action
//    est idempotent.
// ================================================================
check('4. applyPaymentValidation fixe stage="Client" ET paymentValidated dans la MÊME opération, une seule entrée d\'historique, idempotent (pas de doublon)', () => {
  const lead = makeUnpaidProspect(9204, { stage: 'Engagé (Commit)' })
  const once = applyPaymentValidation([lead], 9204)
  const updated = once.find(l => l.id === 9204)

  assert.equal(updated.stage, 'Client', 'la validation du paiement doit elle-même faire passer le statut à "Client"')
  assert.equal(updated.paymentValidated, true)
  assert.equal(updated.activity.length, 1, 'une seule entrée d\'historique doit être créée (pas de "Statut changé" en plus de "Paiement validé")')
  assert.match(updated.activity[0].text, /Paiement validé/)

  const { rows: rowsAfterFirst } = buildClientsOverview(once)
  assert.equal(rowsAfterFirst.length, 1, 'le lead doit maintenant apparaître exactement une fois dans l\'onglet Clients')

  // Rejouer l'action (ex. double-clic) ne doit rien dupliquer.
  const twice = applyPaymentValidation(once, 9204)
  const updatedTwice = twice.find(l => l.id === 9204)
  assert.equal(updatedTwice.activity.length, 1, 'rejouer la validation ne doit ajouter aucune entrée d\'historique supplémentaire')
  assert.deepEqual(updatedTwice.payments, updated.payments, 'rejouer la validation ne doit pas régénérer/dupliquer les échéances de paiement')

  const { rows: rowsAfterSecond } = buildClientsOverview(twice)
  assert.equal(rowsAfterSecond.length, 1, 'toujours une seule apparition dans Clients, jamais un doublon de compte')
})

console.log(`PASS (${passed} checks): gate paiement — un prospect ne peut jamais devenir "Client" (aucun chemin) sans paiement validé, conversion sans doublon.`)
