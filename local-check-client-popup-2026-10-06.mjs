// Régression ciblée — "popup notification client au login/ouverture de
// session" (2026-10-06). Le popup existait déjà (ClientSpace, LocalCRM.jsx
// — popupItems/dismissPopup/viewImportant, alimenté par
// getImportantUnseen()) mais deux sources d'évènement important ne le
// déclenchaient jamais : la validation d'un document (aucune notification
// client créée du tout) et la réponse de l'équipe à une demande de support
// (item repassé à "non vu" mais jamais marqué important). Les deux sont
// corrigés ici. Combine tests fonctionnels (store, pur) et vérifications
// statiques de source (JSX du popup, même convention que les autres
// local-check-*.mjs de cette session). 100% local, aucun accès réseau/Supabase.

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
globalThis.sessionStorage = new MemoryStorage()
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} }

let passed = 0
function check(label, fn) { fn(); passed += 1; console.log(`  ok - ${label}`) }

const {
  getImportantUnseen, createClientSupportRequest, respondToClientRequest,
  addClientNotification, markClientSendSeen,
} = await import('./src/local/clientTrackingStore.js')
const { uploadDocument, validateDocument, rejectDocument } = await import('./src/local/documentsStore.js')
const { REQUIRED_DOCUMENTS } = await import('./src/data/mockData.js')
const { getAdminNotifications, addAdminNotification } = await import('./src/local/adminNotificationsStore.js')

// ================================================================
// 1. Scénarios déclenchant le popup au login (getImportantUnseen non vide)
// ================================================================
check('Scénario 1 — document rejeté : reste un évènement important non vu (comportement déjà correct, revérifié)', () => {
  const clientId = 91001
  uploadDocument(clientId, REQUIRED_DOCUMENTS[0].id, REQUIRED_DOCUMENTS[0].label, { name: 'x.pdf' })
  rejectDocument(clientId, REQUIRED_DOCUMENTS[0].id, 'Motif de test', 'Admin Test')
  assert.ok(getImportantUnseen(clientId).some(i => i.title.includes('Document refusé')))
})

check('Scénario 1bis (correctif) — document VALIDÉ déclenche désormais aussi une notification importante non vue (aucune avant ce correctif)', () => {
  const clientId = 91002
  uploadDocument(clientId, REQUIRED_DOCUMENTS[1].id, REQUIRED_DOCUMENTS[1].label, { name: 'y.pdf' })
  assert.equal(getImportantUnseen(clientId).length, 0, 'précondition : rien d\'important avant validation')
  const ok = validateDocument(clientId, REQUIRED_DOCUMENTS[1].id, 'Admin Test')
  assert.equal(ok, true)
  const unseen = getImportantUnseen(clientId)
  assert.ok(unseen.some(i => i.title.includes('Document validé')), 'la validation doit désormais déclencher une notification importante (donc le popup)')
})

check('Scénario 1ter — revalider un document déjà validé (idempotent) ne crée pas de doublon de notification', () => {
  const clientId = 91003
  uploadDocument(clientId, REQUIRED_DOCUMENTS[2].id, REQUIRED_DOCUMENTS[2].label, { name: 'z.pdf' })
  validateDocument(clientId, REQUIRED_DOCUMENTS[2].id, 'Admin Test')
  const countAfterFirst = getImportantUnseen(clientId).length
  validateDocument(clientId, REQUIRED_DOCUMENTS[2].id, 'Admin Test')
  assert.equal(getImportantUnseen(clientId).length, countAfterFirst, 'revalider un document déjà "valid" ne doit pas renotifier')
})

check('Scénario 2 (correctif) — une réponse de l\'équipe à une demande de support déclenche désormais une notification importante non vue (jamais le cas avant ce correctif : important restait false)', () => {
  const clientId = 91004
  const ticket = createClientSupportRequest(clientId, { subject: 'Question test', message: 'Une vraie question' }, 'Client Test')
  markClientSendSeen(ticket.id)
  assert.equal(getImportantUnseen(clientId).length, 0, 'précondition : la demande elle-même (vue) ne doit pas déclencher le popup')
  respondToClientRequest(ticket.id, 'Voici notre réponse à votre question.')
  const unseen = getImportantUnseen(clientId)
  assert.equal(unseen.length, 1)
  assert.equal(unseen[0].id, ticket.id, 'le popup doit pointer vers le même thread, jamais un item dupliqué')
  assert.ok(unseen[0].response?.message.includes('Voici notre réponse'))
})

check('Scénario 3 — un livrable marketing publié déclenche une notification importante non vue (comportement déjà correct, revérifié)', () => {
  const clientId = 91005
  addClientNotification(clientId, { kind: 'Marketing', title: 'Nouveau livrable — Posts', message: 'Post lancement', important: true })
  assert.ok(getImportantUnseen(clientId).some(i => i.title.includes('Nouveau livrable')))
})

// ================================================================
// 2. Aucune notification non vue -> aucun popup (getImportantUnseen vide).
// ================================================================
check('Scénario 5 — un client sans aucune notification importante non vue a getImportantUnseen() vide (aucun popup ne doit apparaître)', () => {
  assert.deepEqual(getImportantUnseen(91006), [])
})

// ================================================================
// 3. Dismiss (session) — vérifié via la logique de source (sessionStorage
// par item.id), le composant React lui-même n'étant pas isolément testable
// en Node (fichier LocalCRM.jsx, un seul gros composant).
// ================================================================
const crmSrc = readFileSync('./src/local/LocalCRM.jsx', 'utf8')

check('LocalCRM.jsx : le popup existe, est alimenté par getImportantUnseen(clientId), et n\'exige jamais un clic préalable sur la cloche', () => {
  assert.match(crmSrc, /const getPopupItems=\(\)=>getImportantUnseen\(clientId\)\.filter\(item=>!dismissedForSession\(\)\.includes\(item\.id\)\)/)
  assert.match(crmSrc, /const \[popupItems,setPopupItems\]=useState\(getPopupItems\);/, 'le popup doit être calculé dès le montage du composant (ouverture de session), pas au clic sur la cloche')
})

check('LocalCRM.jsx : dismissPopup() masque le popup et mémorise le dismiss par session (sessionStorage) — ne doit jamais réapparaître pour les mêmes items pendant la même session', () => {
  const fnMatch = crmSrc.match(/function dismissPopup\(\)\{[\s\S]*?\n }/)
  assert.ok(fnMatch)
  assert.match(fnMatch[0], /sessionStorage\.setItem\(sessionDismissKey/)
  assert.match(fnMatch[0], /setPopupItems\(\[\]\)/)
  assert.match(crmSrc, /const getPopupItems=\(\)=>getImportantUnseen\(clientId\)\.filter\(item=>!dismissedForSession\(\)\.includes\(item\.id\)\)/, 'le calcul du popup doit exclure les items déjà rejetés cette session')
})

check('LocalCRM.jsx : le popup propose une action pour voir maintenant et une pour reporter, affiche le titre/la date, et reste simple/centré (style Oriafen, pas de blocage permanent)', () => {
  const popupIdx = crmSrc.indexOf('{popupItems.length>0 && (')
  assert.ok(popupIdx > -1, 'le bloc JSX du popup doit exister')
  const block = crmSrc.slice(popupIdx, popupIdx + 1200)
  assert.match(block, /onClick=\{dismissPopup\}/)
  assert.match(block, /onClick=\{viewImportant\}/)
  assert.match(block, /popupItems\[0\]\.title/)
  assert.match(block, /popupItems\[0\]\.sentAt/)
  assert.match(block, /bg-orias-green/, 'style Oriafen (vert/or), pas une couleur générique')
})

// ================================================================
// 4. La cloche (historique) reste disponible indépendamment du popup.
// ================================================================
check('LocalNotificationBell.jsx (cloche cliente) reste intact — historique complet des envois, indépendant du popup', () => {
  const bellSrc = readFileSync('./src/local/LocalNotificationBell.jsx', 'utf8')
  assert.match(bellSrc, /getClientSends\(clientId\)/, 'la cloche doit continuer à lister tous les envois, pas seulement les importants non vus')
  assert.match(crmSrc, /<LocalNotificationBell clientId=\{clientId\}/, 'la cloche doit rester montée dans l\'en-tête client')
})

// ================================================================
// 5. Les notifications ADMIN restent inchangées par ce correctif (aucune
// modification de adminNotificationsStore.js dans cette passe).
// ================================================================
check('adminNotificationsStore.js : le flux admin (addAdminNotification/getAdminNotifications) reste inchangé et indépendant du popup client', () => {
  const before = getAdminNotifications().length
  const notif = addAdminNotification({ type: 'support', title: 'Test admin inchangé', message: 'x', clientId: 91007, dedupeKey: 'popup-test-admin-unchanged' })
  assert.ok(notif)
  assert.equal(getAdminNotifications().length, before + 1)
})

console.log(`PASS (${passed} checks): popup notification client au login (2026-10-06) — déjà existant, deux sources cassées corrigées (document validé, réponse de l'équipe à un support), aucun doublon, cloche et notifications admin inchangées.`)
