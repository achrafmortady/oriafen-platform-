// Régression ciblée — brief brand kit client (logo/Instagram/Facebook/Meta
// Business Manager avec statut + détails conditionnels, 3 couleurs choisies
// via color picker) doit être sauvegardé intégralement et visible côté
// admin — et la vue admin Marketing ne doit JAMAIS retomber sur le client
// de démo tant qu'aucun client réel n'est converti (2026-09-24).
// 100% local, aucun accès réseau.

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

const { getBrandIntake, submitBrandIntake } = await import('./src/local/marketingStore.js')

// ================================================================
// 1. Le brief complet (statuts + détails conditionnels + 3 couleurs) est
//    sauvegardé et relu intégralement — même contrat que consommé par
//    BrandSummaryCard (client) et AdminBrandIntakeCard (admin).
// ================================================================
check('submitBrandIntake sauvegarde le statut ET les détails conditionnels pour logo/Instagram/Facebook/Meta Business Manager, jamais perdus à la relecture', () => {
  const clientId = 7001
  assert.equal(getBrandIntake(clientId), null, 'précondition : aucun brief avant envoi')

  const saved = submitBrandIntake(clientId, {
    brandName: 'Cabinet Test Assurances',
    activity: 'Courtage assurance',
    audience: 'TPE/PME',
    offer: 'Santé, prévoyance',
    tone: 'Professionnel et rassurant',
    values: 'Confiance, proximité',
    colors: ['#123456', '#abcdef', '#ffffff'],
    logoStatus: 'Existe déjà',
    logoInfo: 'https://drive.example.invalid/logo.ai',
    websiteGoal: 'Capter des demandes de devis',
    instagramStatus: 'À récupérer / améliorer',
    instagram: '@cabinet_test, accès perdu, à récupérer',
    facebookStatus: 'Existe déjà',
    facebook: 'facebook.com/cabinettest, admin actuel injoignable',
    metaBusinessStatus: 'À configurer / relier',
    metaBusiness: 'Business ID 1234567890, admin@cabinettest.invalid',
    notes: 'Livraison souhaitée avant fin de mois',
  }, 'Cabinet Test Assurances')

  assert.ok(saved)
  const reread = getBrandIntake(clientId)
  assert.equal(reread.logoStatus, 'Existe déjà')
  assert.equal(reread.logoInfo, 'https://drive.example.invalid/logo.ai')
  assert.equal(reread.instagramStatus, 'À récupérer / améliorer')
  assert.equal(reread.instagram, '@cabinet_test, accès perdu, à récupérer')
  assert.equal(reread.facebookStatus, 'Existe déjà')
  assert.equal(reread.facebook, 'facebook.com/cabinettest, admin actuel injoignable')
  assert.equal(reread.metaBusinessStatus, 'À configurer / relier')
  assert.equal(reread.metaBusiness, 'Business ID 1234567890, admin@cabinettest.invalid')
  assert.deepEqual(reread.colors, ['#123456', '#abcdef', '#ffffff'])
  assert.equal(reread.audience, 'TPE/PME')
  assert.equal(reread.offer, 'Santé, prévoyance')
})

check('submitBrandIntake ne conserve jamais plus de 3 couleurs, même si l\'appelant en envoie davantage', () => {
  const clientId = 7002
  submitBrandIntake(clientId, { brandName: 'X', activity: 'Y', websiteGoal: 'Z', colors: ['#111111', '#222222', '#333333', '#444444'] })
  const reread = getBrandIntake(clientId)
  assert.equal(reread.colors.length, 3, 'jamais plus de 3 couleurs sauvegardées')
})

check('Statut "À créer" (par défaut) n\'exige aucun détail conditionnel — les champs restent vides sans erreur', () => {
  const clientId = 7003
  const saved = submitBrandIntake(clientId, { brandName: 'X', activity: 'Y', websiteGoal: 'Z' })
  assert.equal(saved.logoStatus, 'À créer')
  assert.equal(saved.logoInfo, '')
  assert.equal(saved.instagramStatus, 'À créer')
  assert.equal(saved.instagram, '')
})

// ================================================================
// 2. Vérification statique du câblage réel : champs conditionnels affichés
//    uniquement quand le statut n'est pas "À créer", 3 color pickers visibles
//    (jamais un champ texte libre), et la carte admin affiche bien tous les
//    champs demandés par l'audit (logo, couleurs, Instagram, Facebook, Meta
//    Business Manager, notes...).
// ================================================================
check('LocalMarketing.jsx : le formulaire client affiche des <select> de statut pour logo/Instagram/Facebook/Meta Business Manager, avec champ détaillé affiché seulement si le statut n\'est pas "À créer"', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  assert.match(src, /form\.logoStatus !== 'À créer'/)
  assert.match(src, /form\.instagramStatus !== 'À créer'/)
  assert.match(src, /form\.facebookStatus !== 'À créer'/)
  assert.match(src, /form\.metaBusinessStatus !== 'À créer'/)
})

check('LocalMarketing.jsx : exactement 3 sélecteurs de couleur (type="color"), jamais un champ texte libre pour les couleurs', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  assert.match(src, /colors:\s*\['#1a3d2b',\s*'#c9a84c',\s*'#ffffff'\]/, 'exactement 3 couleurs par défaut')
  assert.match(src, /type="color"/, 'un vrai color picker, pas un champ texte')
  assert.doesNotMatch(src, /Couleurs, valeurs, inspirations/, 'ancien champ texte libre "couleurs" ne doit plus exister')
})

check('LocalMarketing.jsx : AdminBrandIntakeCard affiche marque, activité, audience, offres, ton, logo+info, couleurs, objectif site, Instagram+info, Facebook+info, Meta Business+info, notes', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  const adminCardMatch = src.match(/function AdminBrandIntakeCard[\s\S]*?\n}\n/)
  assert.ok(adminCardMatch, 'AdminBrandIntakeCard doit exister')
  const body = adminCardMatch[0]
  for (const field of ['intake.brandName', 'intake.activity', 'intake.audience', 'intake.offer', 'intake.tone', 'intake.logoStatus', 'intake.logoInfo', 'intake.websiteGoal', 'intake.instagramStatus', 'intake.instagram', 'intake.facebookStatus', 'intake.facebook', 'intake.metaBusinessStatus', 'intake.metaBusiness', 'intake.notes', 'intake.colors']) {
    assert.ok(body.includes(field), `AdminBrandIntakeCard doit afficher ${field}`)
  }
})

// ================================================================
// 3. Aucun repli implicite sur le client de démo dans la vue Marketing
//    admin : clientId=null (pas getActiveClientId()) par défaut, état vide
//    explicite tant qu'aucun client réel n'est converti.
// ================================================================
check('LocalMarketing.jsx : AdminMarketingPanel ne retombe JAMAIS implicitement sur getActiveClientId()/le client de démo — état vide explicite tant qu\'aucun client réel n\'existe (clients=[])', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  assert.doesNotMatch(src, /getActiveClientId/, 'plus aucun repli implicite sur getActiveClientId() dans ce fichier')
  assert.match(src, /export function AdminMarketingPanel\(\{\s*clients\s*=\s*\[\]/, 'clients doit être [] par défaut, jamais un id de démo')
  assert.match(src, /if \(!clients\.length \|\| clientId == null\)/, 'un état vide explicite doit être rendu tant qu\'aucun client réel n\'existe')
})

check('LocalAdminShell.jsx : latestClientPreview (utilisé pour "Voir l\'espace client" ET comme client par défaut de l\'onglet Marketing) sélectionne le client réellement converti le plus récent, pas clientRows[0] (trié par priorité de statut)', () => {
  const src = readFileSync('./src/local/LocalAdminShell.jsx', 'utf8')
  assert.match(src, /leads\.filter\(l => l\.stage === 'Client' && l\.paymentValidated\)\.sort\(\(a, b\) => \(b\.createdAt \|\| 0\) - \(a\.createdAt \|\| 0\)\)\[0\] \|\| null/, 'même logique que LocalCRM.jsx (createdAt desc), jamais clientRows[0]')
  assert.match(src, /AdminMarketingPanel clients=\{clientRows\.map[\s\S]{0,80}defaultClientId=\{latestClientPreview\?\.id/, 'l\'onglet Marketing doit recevoir la même sélection par défaut que "Voir l\'espace client"')
})

console.log(`PASS (${passed} checks): brief brand kit (logo/Instagram/Facebook/Meta Business Manager conditionnels + 3 couleurs) sauvegardé et visible intégralement côté admin, jamais de repli sur le client de démo.`)
