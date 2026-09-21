// Régression ciblée — audit "top KPI card" (2026-09-21).
//
// Constat signalé : le dashboard admin affichait "Clients actifs: 5" (KPI
// du header) alors que la carte Conversion du CRM affichait "6 clients sur
// 24 prospects" (25%) pour le même jeu de données — chiffres incohérents
// pour un même concept "clients", déroutant pour une vue globale.
//
// Cause racine : la KPI du header (LocalAdminShell.jsx) lisait
// clientKpis.actifs (sous-ensemble : clients dont le dossier n'est pas
// encore "Complété"), tandis que la carte Conversion (LocalCRM.jsx)
// comptait TOUS les leads stage==='Client' via count('Client') — deux
// définitions différentes de "client" affichées comme si c'était la même
// métrique.
//
// Correctif : buildClientsOverview() (clientsOverviewData.js) expose
// désormais kpis.total (même filtre stage==='Client' && paymentValidated
// que ses `rows`) — seule source de vérité, réutilisée par la KPI "Total
// clients" du header ET la carte Conversion du CRM. `actifs`/`bloques`/
// `aRelancer`/`obtenus` restent des métriques/filtres séparés, inchangés.
//
// 100% local (aucune donnée réelle des composants React n'est rendue ici —
// Node seul, pas de DOM), aucun accès réseau/Supabase.

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

const { buildClientsOverview } = await import('./src/local/clientsOverviewData.js')
const { seed } = await import('./src/local/model.js')
const { applyPaymentValidation } = await import('./src/local/conversion.js')
const { LOCAL_PACKS } = await import('./src/local/packsData.js')

let passed = 0
function check(label, fn) {
  fn()
  passed += 1
  console.log(`  ok - ${label}`)
}

// ================================================================
// 1. La KPI "Total clients" == nombre réel de clients convertis, jamais un
//    sous-ensemble (actifs) ni un chiffre en dur.
// ================================================================
check('kpis.total compte tous les clients convertis (stage=Client && paymentValidated), pas seulement les "actifs"', () => {
  const leads = seed()
  const expectedTotal = leads.filter(l => l.stage === 'Client' && l.paymentValidated).length
  const { kpis, rows } = buildClientsOverview(leads)

  assert.equal(kpis.total, expectedTotal)
  assert.equal(kpis.total, rows.length, 'total doit correspondre exactement au nombre de lignes du résumé Clients')
  assert.ok(kpis.total >= kpis.actifs, 'total (tous statuts) doit toujours être >= actifs (sous-ensemble hors "Complété")')
})

// ================================================================
// 2. La KPI "Total clients" (dashboard) et la carte "Conversion" (CRM)
//    doivent reconcilier EXACTEMENT — même source, jamais deux calculs
//    indépendants qui peuvent diverger.
// ================================================================
check('kpis.total reste vrai après une conversion réelle (payment gate) : la KPI dashboard et la carte Conversion CRM restent en accord', () => {
  const leads = seed()
  const before = buildClientsOverview(leads).kpis.total

  const prospect = leads.find(l => l.stage !== 'Client' && !l.paymentValidated)
  assert.ok(prospect, 'précondition : au moins un prospect non converti dans le seed')
  const packId = prospect.packId || LOCAL_PACKS[0]?.id
  const withPack = leads.map(l => l.id === prospect.id ? { ...l, packId } : l)

  const afterConversion = applyPaymentValidation(withPack, prospect.id)
  const { kpis, rows } = buildClientsOverview(afterConversion)

  assert.equal(kpis.total, before + 1, 'convertir un prospect de plus doit immédiatement incrémenter kpis.total (même source partout, aucune valeur mise en cache séparément)')
  assert.equal(kpis.total, rows.length)

  // Reproduit exactement le calcul de la carte Conversion (LocalCRM.jsx) :
  // "{totalClients} clients sur {leads.length} prospects" — doit toujours
  // utiliser kpis.total, jamais un recompte local indépendant.
  const conversionCardClients = kpis.total
  assert.equal(conversionCardClients, afterConversion.filter(l => l.stage === 'Client' && l.paymentValidated).length)
})

// ================================================================
// 3. Gardes statiques anti-régression : les deux vues consomment bien
//    kpis.total (source partagée), jamais clientKpis.actifs pour "Total
//    clients", et jamais un total recompté indépendamment dans le CRM.
// ================================================================
check('Garde anti-régression : LocalAdminShell.jsx affiche "Total clients" à partir de clientKpis.total (pas clientKpis.actifs)', () => {
  const src = readFileSync('./src/local/LocalAdminShell.jsx', 'utf8')
  assert.match(src, /label="Total clients"\s+value=\{clientKpis\.total\}/, 'la KPI du header doit lire clientKpis.total')
  assert.doesNotMatch(src, /label="Clients actifs"\s+value=\{clientKpis\.actifs\}\s+accent="green"\s+onClick=\{\(\) => openClientsFiltered\('actifs'\)\}/, 'l\'ancien libellé "Clients actifs" (source du mismatch) ne doit plus être utilisé pour la KPI globale du header')
})

check('Garde anti-régression : LocalCRM.jsx calcule la carte Conversion via buildClientsOverview(leads).kpis.total (source partagée), pas un recompte local', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /buildClientsOverview\(leads\)\.kpis\.total/, 'la carte Conversion doit réutiliser la même source que la KPI du dashboard')
  assert.doesNotMatch(src, /\{count\('Client'\)\} clients sur/, 'la carte Conversion ne doit plus recompter localement via count(\'Client\')')
})

console.log(`PASS (${passed} checks): KPI "Total clients" (dashboard) et carte Conversion (CRM) partagent la même source (buildClientsOverview.kpis.total), aucun chiffre en dur.`)
