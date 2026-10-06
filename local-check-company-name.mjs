// Régression ciblée — "Nom du cabinet / société" :
//   - un prospect peut enregistrer son cabinet/société (création + fiche)
//   - la conversion prospect -> client le conserve (applyPaymentValidation)
//   - la fiche client l'expose : nom du brand kit d'abord, sinon champ CRM,
//     sinon null (affiché "Non renseigné" côté UI)
//   - le brand kit marketing ("Nom de marque / cabinet") continue de fonctionner
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
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, location: { origin: 'http://localhost' } }

let passed = 0
function check(label, fn) { fn(); passed += 1; console.log(`  ok - ${label}`) }

const { LOCAL_PACKS } = await import('./src/local/packsData.js')
const { applyPaymentValidation } = await import('./src/local/conversion.js')
const { buildClientsOverview, resolveCompanyName } = await import('./src/local/clientsOverviewData.js')
const { submitBrandIntake, getBrandIntake } = await import('./src/local/marketingStore.js')
const { blankLeadTemplate: makeBlankLead } = await import('./src/local/model.js')


function makeProspect(id, extra = {}) {
  const pack = LOCAL_PACKS[0]
  return {
    ...makeBlankLead(),
    id,
    name: 'Sami Test',
    email: `sami${id}@example.invalid`,
    packId: pack.id,
    pack: pack.name,
    finalPrice: pack.priceTtc,
    stage: 'Qualifié',
    ...extra,
  }
}

// ================================================================
// 1. Un prospect stocke son cabinet/société, vide par défaut (jamais inventé)
// ================================================================
check('blankLeadTemplate : cabinet/société vide par défaut, jamais inventé', () => {
  assert.equal(makeBlankLead().company, '')
})

check('un prospect créé avec un cabinet/société le conserve tel quel', () => {
  const lead = makeProspect(9101, { company: 'Cabinet Atlas Assurances' })
  assert.equal(lead.company, 'Cabinet Atlas Assurances')
})

// ================================================================
// 2. La conversion prospect -> client préserve le cabinet/société
// ================================================================
check('applyPaymentValidation (conversion) préserve company', () => {
  const lead = makeProspect(9102, { company: 'Cabinet Atlas Assurances' })
  const [converted] = applyPaymentValidation([lead], lead.id)
  assert.equal(converted.paymentValidated, true, 'précondition : la conversion a bien eu lieu')
  assert.equal(converted.stage, 'Client')
  assert.equal(converted.company, 'Cabinet Atlas Assurances')
})

// ================================================================
// 3. La fiche client expose le cabinet/société
// ================================================================
check('la fiche client (buildClientsOverview) expose company après conversion', () => {
  const lead = makeProspect(9103, { company: 'Cabinet Atlas Assurances' })
  const [converted] = applyPaymentValidation([lead], lead.id)
  const { rows } = buildClientsOverview([converted])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].company, 'Cabinet Atlas Assurances')
})

check('la fiche client affiche le champ "Cabinet / société" (liste, en-tête, bloc Identité)', () => {
  const src = readFileSync('./src/local/LocalClientsOverview.jsx', 'utf8')
  assert.match(src, /<InfoField label="Cabinet \/ société" value=\{selected\.company\}/)
  assert.match(src, /\{selected\.company \|\| 'Non renseigné'\}/)
  assert.match(src, /\{client\.company \|\| 'Non renseigné'\}/)
})

// ================================================================
// 4. Valeur vide -> null (rendu "Non renseigné" par InfoField)
// ================================================================
check('cabinet/société absent : company vaut null sur la fiche client', () => {
  const lead = makeProspect(9104)
  const [converted] = applyPaymentValidation([lead], lead.id)
  const { rows } = buildClientsOverview([converted])
  assert.equal(rows[0].company, null)
})

check('cabinet/société uniquement blanc : traité comme absent (pas de nom fantôme)', () => {
  const lead = makeProspect(9105, { company: '   ' })
  assert.equal(resolveCompanyName(lead), null)
})

// ================================================================
// 5. Brand kit marketing : "Nom de marque / cabinet" fait foi, et reste fonctionnel
// ================================================================
check('brand kit "Nom de marque / cabinet" a priorité sur le champ CRM', () => {
  const lead = makeProspect(9106, { company: 'Nom CRM' })
  submitBrandIntake(lead.id, { brandName: 'Marque Brand Kit', activity: 'Courtage' }, lead.name)
  assert.equal(getBrandIntake(lead.id).brandName, 'Marque Brand Kit', 'le brand kit marketing reste enregistré tel quel')
  assert.equal(resolveCompanyName(lead), 'Marque Brand Kit')
})

check('sans brand kit, le champ CRM sert de nom de cabinet', () => {
  const lead = makeProspect(9107, { company: 'Cabinet CRM Only' })
  assert.equal(getBrandIntake(lead.id), null)
  assert.equal(resolveCompanyName(lead), 'Cabinet CRM Only')
})

check('marketing brand name toujours fonctionnel : submitBrandIntake exige un nom et le relit', () => {
  assert.equal(submitBrandIntake(9108, { brandName: '   ' }), null, 'nom vide refusé comme avant')
  const saved = submitBrandIntake(9108, { brandName: 'Cabinet Marketing' })
  assert.ok(saved, 'submitBrandIntake renvoie le brief')
  assert.equal(getBrandIntake(9108).brandName, 'Cabinet Marketing')
})

// ================================================================
// 6. Saisie : formulaire de création et fiche Prospect
// ================================================================
check('formulaire "Nouveau prospect" et édition fiche Prospect proposent le champ, sans l\'écraser', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /company: form\.company\.trim\(\)/)
  assert.match(src, /label className="block text-xs font-semibold text-gray-500 mb-1">Nom du cabinet \/ société/)
  assert.match(src, /patch\(lead\.id,\{name:infoName\|\|lead\.name,company:infoCompany\.trim\(\)/)
  assert.match(src, /<small>Cabinet \/ société<\/small><p>\{lead\.company\|\|'Non renseigné'\}<\/p>/)
})

console.log(`\n${passed} checks OK — company-name`)
