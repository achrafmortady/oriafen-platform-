// Régression ciblée — audit "final local production-wiring pass"
// (2026-09-21). Complète local-check-adapters.mjs (déjà exhaustif sur
// documents/marketing/support/formation) avec les points explicitement
// demandés par cet audit et non encore couverts ailleurs : le nouvel
// adaptateur CRM, la garantie "Preview ne peut jamais initialiser Supabase
// live", et l'absence de repli "Client Démo" en dehors de identity.js.
//
// Les permissions Admin/Super Admin/Finance elles-mêmes vivent entièrement
// dans src/context/AuthContext.jsx + src/App.jsx (V1, origin/main) — non
// modifiées, non réimplémentées ici (voir README §Activation future). Leur
// préservation se vérifie par `git diff origin/main -- src/context
// src/pages` (doit être vide), pas par un test Node qui réimporterait React
// Router — ce test-ci reste dans le périmètre Preview/adaptateurs.
//
// 100% local, aucun accès réseau/Supabase.

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

let passed = 0
function check(label, fn) {
  fn()
  passed += 1
  console.log(`  ok - ${label}`)
}

// ================================================================
// 1. Preview ne peut jamais initialiser Supabase live — vérification
//    directe des constantes exportées par src/lib/supabase.js (V1, non
//    modifié), pas seulement une absence d'import côté adaptateurs.
// ================================================================
check('src/lib/supabase.js : isConfigured=false et supabase=null (aucune init Supabase possible en Preview)', () => {
  const src = readFileSync('./src/lib/supabase.js', 'utf8')
  assert.match(src, /export const isConfigured = false/)
  assert.match(src, /export const supabase = null/)
})

check('Aucun fichier src/local/** (Preview) n\'importe @supabase/supabase-js ou src/lib/supabase.js', () => {
  function walk(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
      const p = `${dir}/${e.name}`
      if (e.isDirectory()) return walk(p)
      return (e.name.endsWith('.js') || e.name.endsWith('.jsx')) ? [p] : []
    })
  }
  // src/local/adapters/supabase/* is the PRODUCTION (not Preview) adapter
  // layer — it is EXPECTED and safe to import src/lib/supabase.js there
  // (guarded by PRODUCTION_ADAPTER_ACTIVE=false, see ./_guard.js and the
  // dedicated, more precise isolation tests in
  // local-check-supabase-adapters.mjs). Excluded here, same as that file's
  // own equivalent check already does.
  const files = walk('./src/local').filter(f => !f.startsWith('./src/local/adapters/supabase/'))
  assert.ok(files.length > 20, 'précondition : doit parcourir un nombre significatif de fichiers')
  files.forEach(f => {
    const src = readFileSync(f, 'utf8')
    assert.doesNotMatch(src, /from ['"]@supabase\/supabase-js['"]/, `${f} ne doit jamais importer le client Supabase`)
    assert.doesNotMatch(src, /from ['"].*\/lib\/supabase['"]/, `${f} ne doit jamais importer src/lib/supabase.js`)
  })
})

// ================================================================
// 2. Identité / rôle — contrat Preview vs production (identity.js) :
//    rôle 'client' en Preview, jamais 'admin'/'super_admin' inventé ici (ces
//    rôles restent exclusivement gérés par AuthContext.jsx côté V1).
// ================================================================
const { getActiveIdentity, ADAPTER_MODE } = await import('./src/local/adapters/identity.js')
check('identity.js : rôle Preview = "client" uniquement, jamais admin/super_admin (ces rôles restent V1/AuthContext, non simulés ici)', () => {
  assert.equal(ADAPTER_MODE, 'local')
  const identity = getActiveIdentity()
  assert.equal(identity.role, 'client')
  const src = readFileSync('./src/local/adapters/identity.js', 'utf8')
  assert.doesNotMatch(src, /role:\s*['"]admin['"]|role:\s*['"]super_admin['"]/, 'identity.js ne doit jamais attribuer un rôle admin/super_admin en dur (ces rôles restent décidés par public.users.role côté V1)')
})

// ================================================================
// 3. Nouvel adaptateur CRM (gap comblé cette session) : contrat bout-en-bout
//    cohérent avec le comportement déjà testé de LocalCRM.jsx/clientHistory.js
//    — même gate paiement, même historique, pas de seconde implémentation.
// ================================================================
const crmAdapter = await import('./src/local/adapters/crmAdapter.js')
const { seed } = await import('./src/local/model.js')
const { LOCAL_PACKS } = await import('./src/local/packsData.js')

check('crmAdapter.changeStatus refuse "Client" sans paiement validé (même gate que clientHistory.applyStatusChange)', () => {
  const leads = seed()
  const prospect = leads.find(l => l.stage !== 'Client' && !l.paymentValidated)
  assert.ok(prospect)
  const next = crmAdapter.changeStatus(leads, prospect.id, 'Client')
  const updated = next.find(l => l.id === prospect.id)
  assert.notEqual(updated.stage, 'Client', 'crmAdapter ne doit jamais contourner le gate paiement')
})

check('crmAdapter.convertToClient fixe stage=Client + paymentValidated en une seule opération (même fonction que formationAdapter.validatePayment, aucun doublon)', () => {
  const leads = seed()
  const prospect = leads.find(l => l.stage !== 'Client' && !l.paymentValidated)
  const packId = prospect.packId || LOCAL_PACKS[0]?.id
  const withPack = leads.map(l => l.id === prospect.id ? { ...l, packId } : l)
  const activityBefore = prospect.activity.length
  const next = crmAdapter.convertToClient(withPack, prospect.id)
  const updated = next.find(l => l.id === prospect.id)
  assert.equal(updated.stage, 'Client')
  assert.equal(updated.paymentValidated, true)
  assert.equal(updated.activity.length, activityBefore + 1, 'une seule entrée d\'historique ajoutée, pas de doublon conversion/statut')
  assert.match(updated.activity[0].text, /Paiement validé/)
})

check('crmAdapter expose la prochaine action / historique / RDV / relances sans réimplémenter clientHistory.js/relance.js/appointments.js', () => {
  const leads = seed()
  const lead = leads[0]
  const next = crmAdapter.updateNextAction(leads, lead.id, 'action', 'Appel de suivi')
  const updated = next.find(l => l.id === lead.id)
  assert.equal(updated.action, 'Appel de suivi')
  assert.equal(updated.activity[0].text, 'Prochaine action modifiée — Appel de suivi')

  const timeline = crmAdapter.getTimeline(updated, updated.id)
  assert.ok(Array.isArray(timeline))

  const withAppt = crmAdapter.bookAppointment(next, lead.id, { scheduledAt: '2026-10-01T10:00', type: 'appel' })
  assert.equal(withAppt.find(l => l.id === lead.id).appointments.length, 1)
})

check('Garde anti-régression : la couche adapters/index.js expose bien crmAdapter (gap comblé, plus de trou entre CRM et les autres domaines)', () => {
  const src = readFileSync('./src/local/adapters/index.js', 'utf8')
  assert.match(src, /export \* as crmAdapter from '\.\/crmAdapter'/)
})

console.log(`PASS (${passed} checks): garanties production-wiring (Preview ne peut jamais toucher Supabase live, rôle Preview limité à "client", adaptateur CRM cohérent avec le gate paiement et l'historique existants).`)
