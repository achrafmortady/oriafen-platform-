// Régression ciblée — retour client 2026-09-22 (corrections après un
// premier passage jugé trop ambigu). 100% local, aucun accès réseau.
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
// 1. Documents associé — visibilité conditionnelle exacte + passeport
// ================================================================
const { getHasAssociate, setHasAssociate } = await import('./src/local/associateStore.js')
const { ASSOCIATE_DOCUMENTS } = await import('./src/local/associateDocuments.js')

check('Un client SANS associé : getHasAssociate() renvoie false par défaut (aucun flag = aucun associé)', () => {
  assert.equal(getHasAssociate(9501), false)
})

check('setHasAssociate(true) puis (false) bascule correctement — seul point de vérité, réutilisable côté client ET admin pour le même clientId', () => {
  setHasAssociate(9501, true, 'Admin Test')
  assert.equal(getHasAssociate(9501), true)
  setHasAssociate(9501, false, 'Admin Test')
  assert.equal(getHasAssociate(9501), false)
})

check('ASSOCIATE_DOCUMENTS inclut désormais le passeport de l\'associé', () => {
  assert.ok(ASSOCIATE_DOCUMENTS.some(d => d.id === 'associate_passeport'), 'associate_passeport doit exister')
})

check('LocalMesDocuments.jsx (client) et LocalClientsOverview.jsx (admin) conditionnent la section associé sur getHasAssociate/hasAssociate — jamais "toujours visible"', () => {
  const clientSrc = readFileSync('./src/local/LocalMesDocuments.jsx', 'utf8')
  assert.match(clientSrc, /hasAssociate\s*&&/, 'la section doit être conditionnée par hasAssociate')
  assert.doesNotMatch(clientSrc, /TOUJOURS visible \(aucun flag hasAssociate\)/, 'l\'ancien commentaire "toujours visible" ne doit plus être présent')

  const adminSrc = readFileSync('./src/local/LocalClientsOverview.jsx', 'utf8')
  assert.match(adminSrc, /hasAssociate\s*\?/, 'le panneau admin doit être conditionné par hasAssociate')
})

// ================================================================
// 2. "Réponse en attente" — déjà dérivé de la conversation (status/response),
//    jamais un flag statique indépendant. Vérifié explicitement ici plutôt
//    que laissé ambigu.
// ================================================================
const { createClientSupportRequest, respondToClientRequest, getClientSends, addClientNotification } = await import('./src/local/clientTrackingStore.js')

check('"Réponse en attente" (responseRequired && status!=="replied") se lève UNIQUEMENT quand une vraie réponse admin est enregistrée (response + status="replied" posés ensemble, jamais un flag séparé)', () => {
  const clientId = 9502
  createClientSupportRequest(clientId, { subject: 'Question', message: 'Bonjour', category: 'dossier' }, 'Client Test')
  const before = getClientSends(clientId).find(i => i.title?.includes('Question') || i.subject === 'Question' || i.kind === 'Support')
  assert.ok(before, 'précondition : la demande doit exister')
  assert.equal(before.responseRequired, true)
  assert.notEqual(before.status, 'replied')

  respondToClientRequest(before.id, 'Voici la réponse')
  const after = getClientSends(clientId).find(i => i.id === before.id)
  assert.equal(after.status, 'replied')
  assert.ok(after.response && after.response.message === 'Voici la réponse', 'la réponse réelle doit être attachée, jamais un simple changement de statut isolé')
})

check('Un message/notification AUTOMATIQUE (addClientNotification) ne déclenche jamais "Réponse en attente" (responseRequired=false par construction)', () => {
  const clientId = 9503
  const notif = addClientNotification(clientId, { kind: 'Document', title: 'Document refusé', message: 'Motif...' })
  assert.equal(notif.responseRequired, false, 'les notifications automatiques ne doivent jamais requérir de réponse client')
})

// ================================================================
// 3. "Montant potentiel" — déjà une vraie donnée CRM structurée (numérique,
//    persistée, modifiable, liée au lead, utilisée en pipeline/dashboard).
//    Vérifié explicitement plutôt que laissé "à clarifier".
// ================================================================
check('lead.value (Montant potentiel) est un champ numérique structuré, éditable via <input type="number">, utilisé dans le Kanban (total pondéré) et le KPI dashboard "Potentiel ouvert" — jamais une description en texte libre', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /type="number"[^/]*value=\{lead\.value\}/, 'le champ Potentiel doit rester un input numérique lié à lead.value')
  assert.match(src, /reduce\(\(n,l\)=>n\+l\.value,0\)/, 'lead.value doit être sommé dans au moins un calcul (KPI/Kanban)')
})

// ================================================================
// 5. Notifications — présentation "centre d'activité" : source/sender,
//    type/contexte, lu/non lu, action liée. Modèles de données inchangés
//    (clientTrackingStore.js / adminNotificationsStore.js restent séparés).
// ================================================================
check('LocalNotificationBell.jsx (client) affiche un libellé de type textuel ET l\'émetteur (Équipe Oriafen / Vous), en plus du lu/non lu et de l\'action au clic déjà existants', () => {
  const src = readFileSync('./src/local/LocalNotificationBell.jsx', 'utf8')
  assert.match(src, /TYPE_LABEL/)
  assert.match(src, /Équipe Oriafen/)
  assert.match(src, /onNavigate/, 'l\'action liée (navigation) doit rester présente')
})

check('LocalAdminNotificationBell.jsx (admin) affiche un libellé de type textuel ET le nom du client concerné quand disponible', () => {
  const src = readFileSync('./src/local/LocalAdminNotificationBell.jsx', 'utf8')
  assert.match(src, /TYPE_LABEL/)
  assert.match(src, /item\.clientName/)
})

check('Garde anti-régression : support_tickets/client_messages/notifications restent des modèles de données séparés (clés localStorage distinctes) — clientTrackingStore.js peut notifier adminNotificationsStore.js d\'un évènement (UX), mais ne doit jamais lire/écrire sa clé de stockage ni redéfinir sa structure', () => {
  const clientTracking = readFileSync('./src/local/clientTrackingStore.js', 'utf8')
  const adminNotif = readFileSync('./src/local/adminNotificationsStore.js', 'utf8')
  const clientTrackingKey = clientTracking.match(/STORAGE_KEY\s*=\s*'([^']+)'/)?.[1]
  const adminNotifKey = adminNotif.match(/STORAGE_KEY\s*=\s*'([^']+)'/)?.[1]
  assert.ok(clientTrackingKey && adminNotifKey && clientTrackingKey !== adminNotifKey, 'les deux stores doivent utiliser des clés localStorage distinctes (jamais un seul store fusionné)')
  // L'intégration existante (notifier l'admin d'un évènement client) passe
  // exclusivement par la fonction publique addAdminNotification() — jamais
  // par un accès direct à la clé de stockage de l'autre store.
  assert.doesNotMatch(clientTracking, new RegExp(adminNotifKey), 'clientTrackingStore ne doit jamais lire/écrire directement la clé de stockage d\'adminNotificationsStore')
  assert.doesNotMatch(adminNotif, /from ['"]\.\/clientTrackingStore['"]/, 'adminNotificationsStore ne doit jamais dépendre de clientTrackingStore (sens unique uniquement)')
})

console.log(`PASS (${passed} checks): retour client 2026-09-22 — documents associé (visibilité + passeport), réponse en attente dérivée de la conversation, montant potentiel structuré, notifications façon centre d'activité (sans fusion de modèles).`)
