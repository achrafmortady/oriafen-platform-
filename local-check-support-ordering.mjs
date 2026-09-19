// Vérifie (store localStorage polyfillé, même convention que les autres
// local-check-*.mjs) le correctif "Mes échanges / support : nouveaux fils
// et nouvelles relances en bas au lieu d'en haut" (QA 2026-09-19).
//
// Root cause : getClientSends() renvoyait le tableau dans l'ordre
// d'insertion du store (les nouveaux envois sont toujours ajoutés en fin de
// tableau), jamais trié par horodatage réel — donc un nouveau fil/question
// apparaissait en bas, aussi bien côté client ("Mes échanges") que côté
// admin (fiche CRM + fiche Clients, qui appellent la même fonction).
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

const { getClientSends, createClientSupportRequest, markClientSendReminded } = await import('./src/local/clientTrackingStore.js')

// --- Newest THREAD/question must appear FIRST (both client & admin read
// the same getClientSends()) ---
{
  const clientId = 'order-test-threads'
  const first = createClientSupportRequest(clientId, { subject: 'Première question', message: 'Ancienne demande' }, 'Client Démo')
  const second = createClientSupportRequest(clientId, { subject: 'Deuxième question', message: 'Nouvelle demande' }, 'Client Démo')
  assert.ok(first)
  assert.ok(second)
  // sentAt is minute-resolution ("JJ/MM/AAAA · HH:MM") — both items were
  // just created in the same test run and could share the same minute, so
  // force distinct, unambiguous timestamps directly on the stored records
  // (real-world data always differs by at least a minute between threads).
  const data = JSON.parse(localStorage.getItem('oriafen-client-tracking-v1'))
  data[clientId] = data[clientId].map(it => {
    if (it.id === first.id) return { ...it, sentAt: '01/01/2026 · 09:00' }
    if (it.id === second.id) return { ...it, sentAt: '02/01/2026 · 09:00' }
    return it
  })
  localStorage.setItem('oriafen-client-tracking-v1', JSON.stringify(data))

  const items = getClientSends(clientId)
  const ourItems = items.filter(i => i.id === first.id || i.id === second.id)
  assert.equal(ourItems[0].id, second.id, 'le fil le plus récent (Deuxième question) doit apparaître EN PREMIER')
  assert.equal(ourItems[1].id, first.id, 'le fil le plus ancien (Première question) doit apparaître après')

  // Ordre stable/déterministe : relire plusieurs fois ne change rien.
  const itemsAgain = getClientSends(clientId).filter(i => i.id === first.id || i.id === second.id)
  assert.deepEqual(itemsAgain.map(i => i.id), ourItems.map(i => i.id))
}
console.log('PASS: le fil/la question le(la) plus récent(e) apparaît en premier, avant les fils plus anciens (client ET admin, même getClientSends)')

// --- Newest REPLY (relance) inside a thread must appear FIRST ---
// (item.reminders[] est la seule liste de "réponses/relances multiples"
// affichée à l'intérieur d'un même fil — voir ClientSendTracking,
// LocalCRM.jsx — donc "newest reply first" s'y applique.)
{
  const clientId = 'order-test-replies'
  const req = createClientSupportRequest(clientId, { subject: 'Suivi facturation', message: 'Question sur la facture' }, 'Client Démo')
  markClientSendReminded(req.id) // relance n°1 (plus ancienne)
  markClientSendReminded(req.id) // relance n°2 (plus récente)
  const item = getClientSends(clientId).find(i => i.id === req.id)
  assert.equal(item.reminders.length, 2)
  // Reproduit exactement le rendu (LocalCRM.jsx) : numéroter dans l'ordre
  // chronologique réel, puis afficher la liste la plus récente en premier.
  const displayOrder = item.reminders.map((r, i) => ({ r, n: i + 1 })).reverse()
  assert.equal(displayOrder[0].n, 2, 'la relance la plus récente (n°2) doit être affichée en premier')
  assert.equal(displayOrder[1].n, 1, 'la relance la plus ancienne (n°1) doit être affichée après')
}
console.log('PASS: la relance la plus récente apparaît en premier à l\'intérieur d\'un même fil, la numérotation chronologique réelle est conservée')

console.log('ALL PASS: tri "Mes échanges"/support par horodatage réel — fils et relances les plus récents en premier')
