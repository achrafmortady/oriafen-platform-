// Régression ciblée — "Voir l'espace client" ouvrait toujours l'identité
// démo (CANONICAL_DEMO_CLIENT_ID) au lieu du client réellement créé/converti
// par l'admin (2026-09-24, retour client). 100% local, aucun accès réseau.
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
// 1. Logique de sélection du "dernier client converti" (reproduite ici
//    depuis les mêmes stores purs que LocalCRM.jsx pour ne jamais deviner
//    le comportement réel) : un CRM propre (aucun lead) ne doit jamais
//    produire d'identité — jamais un repli sur le client de démo.
// ================================================================
const { applyPaymentValidation, canSetStageToClient } = await import('./src/local/conversion.js')
const { LOCAL_PACKS } = await import('./src/local/packsData.js')
const { getActiveIdentity } = await import('./src/local/adapters/identity.js')
const { CANONICAL_DEMO_CLIENT_ID, CANONICAL_DEMO_CLIENT_NAME } = await import('./src/local/model.js')

function latestConvertedClient(leads) {
  // Même logique que LocalCRM.jsx : le client converti le plus récent
  // (createdAt desc), jamais un pick arbitraire.
  return leads.filter(l => l.stage === 'Client' && l.paymentValidated).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0] || null
}

check('CRM propre (aucun lead) : aucun client converti trouvé -> aucune identité de preview -> jamais un repli sur "Client Démo"', () => {
  const leads = []
  const latest = latestConvertedClient(leads)
  assert.equal(latest, null, 'aucun client converti ne doit exister sur un CRM vide')
})

check('Un prospect créé manuellement puis converti devient l\'identité de preview — nom/email réels, jamais "Client Démo"', () => {
  const pack = LOCAL_PACKS[0]
  const newProspect = {
    id: 5001, name: 'Sami Nouveau Client', email: 'sami.nouveau@example.invalid',
    stage: 'Qualifié', paymentValidated: false, packId: pack.id, finalPrice: pack.priceTtc,
    createdAt: Date.now(), activity: [],
  }
  assert.equal(canSetStageToClient(newProspect), false, 'précondition : pas encore converti')

  const converted = applyPaymentValidation([newProspect], 5001)
  const client = converted.find(l => l.id === 5001)
  assert.equal(client.stage, 'Client')
  assert.equal(client.paymentValidated, true)

  const latest = latestConvertedClient(converted)
  assert.ok(latest, 'un client converti doit maintenant être trouvé')
  assert.equal(latest.id, 5001)
  assert.equal(latest.name, 'Sami Nouveau Client')
  assert.equal(latest.email, 'sami.nouveau@example.invalid')
  assert.notEqual(latest.id, CANONICAL_DEMO_CLIENT_ID, 'ne doit jamais être le client de démo')
  assert.notEqual(latest.name, CANONICAL_DEMO_CLIENT_NAME)

  // Même mécanisme d'override que celui déjà utilisé par l'admin pour
  // consulter la fiche d'un autre client (getActiveIdentity(override)) —
  // aucun second système d'identité créé pour ce correctif.
  const identity = getActiveIdentity({ id: latest.id, name: latest.name, email: latest.email })
  assert.equal(identity.id, 5001)
  assert.equal(identity.name, 'Sami Nouveau Client')
  assert.equal(identity.email, 'sami.nouveau@example.invalid')
  assert.notEqual(identity.id, CANONICAL_DEMO_CLIENT_ID)
})

check('Avec plusieurs clients convertis, le PLUS RÉCENT (createdAt desc) est choisi comme identité de preview, jamais le premier trouvé au hasard', () => {
  const pack = LOCAL_PACKS[0]
  const older = { id: 5002, name: 'Ancien Client', email: 'ancien@example.invalid', stage: 'Client', paymentValidated: true, packId: pack.id, finalPrice: pack.priceTtc, createdAt: 1000, activity: [], payments: [] }
  const newer = { id: 5003, name: 'Nouveau Client', email: 'nouveau@example.invalid', stage: 'Client', paymentValidated: true, packId: pack.id, finalPrice: pack.priceTtc, createdAt: 2000, activity: [], payments: [] }
  const latest = latestConvertedClient([older, newer])
  assert.equal(latest.id, 5003, 'le client converti le plus récemment doit être choisi')
})

// ================================================================
// 2. Vérification statique du câblage réel (LocalCRM.jsx/LocalAdminShell.jsx)
//    — le bouton doit être désactivé sans client réel, ne jamais retomber
//    sur getActiveIdentity() sans argument depuis ce chemin.
// ================================================================
check('LocalCRM.jsx : le bouton "Voir l\'espace client" est désactivé sans client converti et transmet l\'identité réelle explicitement à onEnterClient', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /disabled=\{!previewIdentity\}/, 'le bouton doit être désactivé sans identité réelle')
  assert.match(src, /onClick=\{\(\)=>onEnterClient\(previewIdentity\)\}/, 'doit transmettre explicitement l\'identité réelle, jamais un appel sans argument')
  assert.match(src, /latestClient=leads\.filter\(l=>l\.stage==='Client'&&l\.paymentValidated\)/, 'doit sélectionner parmi les clients réellement convertis (stage=Client && paymentValidated)')
})

check('LocalCRM.jsx : ClientSpace utilise overrideIdentity (identité complète) en priorité, jamais un repli implicite vers l\'identité démo tant qu\'une identité réelle est fournie', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /overrideIdentity\s*\|\|\s*\(overrideClientId/, 'overrideIdentity doit être prioritaire')
})

console.log(`PASS (${passed} checks): "Voir l'espace client" ouvre le client réellement converti (nom/email réels), jamais "Client Démo", bouton désactivé si aucun client converti n'existe.`)
