// Vérifie (store localStorage polyfillé, même convention que les autres
// local-check-*.mjs — aucun navigateur, aucun appel réseau) les 3 problèmes
// de QA manuelle 2026-09-18 :
//   1. La demande de modification marketing ne notifiait pas l'admin
//   2. Flux support/messages/notifications peu clair (admin ne pouvait pas
//      répondre depuis l'onglet Clients, pas de notification à la création)
//   3. Le client de démo n'était pas relié à une fiche admin
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

const { seed, CANONICAL_DEMO_CLIENT_ID, CANONICAL_DEMO_CLIENT_NAME, normalizeCanonicalDemoClient } = await import('./src/local/model.js')
const { createModificationRequest, getModificationRequests, setModificationStatus } = await import('./src/local/marketingStore.js')
const { createClientSupportRequest, respondToClientRequest, getClientSends, addClientNotification } = await import('./src/local/clientTrackingStore.js')
const { getAdminNotifications, getUnseenAdminNotificationCount, markAdminNotificationSeen } = await import('./src/local/adminNotificationsStore.js')
const { getClientDocuments, uploadDocument, rejectDocument } = await import('./src/local/documentsStore.js')
const { listAssociateDocCategories } = await import('./src/local/associateDocuments.js')

// ============================================================
// ISSUE 1 — marketing request notifies admin exactly once
// ============================================================
{
  const clientId = 'notif-test-marketing'
  const before = getAdminNotifications().length
  const request = createModificationRequest(clientId, { section: "Page d'accueil", title: 'Changer le titre', description: 'Plus percutant' }, 'Client Démo')
  assert.ok(request)

  const afterOne = getAdminNotifications()
  assert.equal(afterOne.length, before + 1, 'une demande de modification -> exactement une notification admin')
  assert.equal(afterOne[0].title, 'Nouvelle demande de modification — Client Démo')
  assert.equal(afterOne[0].message, "Page d'accueil — Changer le titre", 'la notification doit inclure un contexte utile (titre de la demande)')
  assert.equal(afterOne[0].context.tab, 'marketing')
  assert.equal(afterOne[0].clientId, clientId)

  // La demande apparaît toujours côté admin (comportement existant inchangé).
  const requests = getModificationRequests(clientId)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].id, request.id)

  // "no duplicate notification after refresh, rerender, or reopening the
  // page" : relire les notifications / la liste des demandes plusieurs fois
  // ne doit jamais recréer d'entrée (aucune nouvelle écriture, donc aucun
  // nouvel appel à addAdminNotification).
  getAdminNotifications(); getAdminNotifications(); getModificationRequests(clientId)
  assert.equal(getAdminNotifications().length, before + 1, 'relire plusieurs fois ne doit jamais dupliquer la notification')

  // Marquer comme lue puis relire ne duplique rien non plus.
  markAdminNotificationSeen(afterOne[0].id)
  assert.equal(getAdminNotifications().length, before + 1)
  assert.equal(getUnseenAdminNotificationCount(), 0)

  // Les notifications CLIENT existantes (changement de statut de la
  // demande) continuent de fonctionner exactement comme avant.
  setModificationStatus(clientId, request.id, 'Traitée')
  const clientNotif = getClientSends(clientId).find(i => i.title === 'Modification marketing : Traitée')
  assert.ok(clientNotif, 'la notification client existante (changement de statut) doit toujours fonctionner')
}
console.log('PASS ISSUE 1: une demande marketing -> une notification admin, aucun doublon, notifications existantes intactes')

// ============================================================
// ISSUE 2 — support thread + notifications
// ============================================================
{
  const clientId = 'notif-test-support'
  const beforeAdmin = getAdminNotifications().length

  const req1 = createClientSupportRequest(clientId, { subject: 'Problème de connexion', message: "Je n'arrive plus à me connecter." }, 'Client Démo')
  assert.ok(req1)
  const adminAfterReq1 = getAdminNotifications()
  assert.equal(adminAfterReq1.length, beforeAdmin + 1, 'une demande de support -> exactement une notification admin')
  assert.equal(adminAfterReq1[0].title, 'Nouvelle demande de support — Client Démo')
  assert.equal(adminAfterReq1[0].context.tab, 'clients')
  assert.equal(adminAfterReq1[0].context.clientId, clientId)

  // Admin sees the request (same store/thread the client sees).
  const sendsAfterReq1 = getClientSends(clientId)
  const thread1 = sendsAfterReq1.find(i => i.id === req1.id)
  assert.ok(thread1)
  assert.equal(thread1.senderType, 'client')
  assert.equal(thread1.status, 'waiting')

  // Second, separate request — must remain its own thread.
  const req2 = createClientSupportRequest(clientId, { subject: 'Question sur la facturation', message: 'Puis-je payer en plusieurs fois ?' }, 'Client Démo')
  assert.notEqual(req2.id, req1.id)
  const adminAfterReq2 = getAdminNotifications()
  assert.equal(adminAfterReq2.length, beforeAdmin + 2, 'deux demandes distinctes -> deux notifications distinctes, jamais fusionnées')

  // Admin replies to req1 only — req2 must stay untouched (no cross-thread reply).
  const ok = respondToClientRequest(req1.id, 'Nous regardons votre connexion tout de suite.')
  assert.equal(ok, true)
  const sendsAfterReply = getClientSends(clientId)
  const t1 = sendsAfterReply.find(i => i.id === req1.id)
  const t2 = sendsAfterReply.find(i => i.id === req2.id)
  assert.equal(t1.status, 'replied')
  assert.equal(t1.response.message, 'Nous regardons votre connexion tout de suite.')
  assert.equal(t1.response.author, 'Équipe')
  assert.equal(t2.status, 'waiting', 'répondre à la demande 1 ne doit jamais affecter la demande 2 (pas de bug inter-thread)')
  assert.equal(t2.response, null)

  // Replying again to the same (already-answered) request must not duplicate anything.
  const okAgain = respondToClientRequest(req1.id, 'Autre message')
  assert.equal(okAgain, false)

  // Client-facing notification for the reply — exactly one.
  const replyNotifs = getClientSends(clientId).filter(i => i.title === 'Nouvelle réponse support')
  assert.equal(replyNotifs.length, 1, 'une réponse de l\'équipe -> une seule notification côté client')

  // Trying to reply via the wrong function (client-side reply) must not work on a client-initiated thread.
  const { replyToClientSend } = await import('./src/local/clientTrackingStore.js')
  assert.equal(replyToClientSend(req2.id, 'test'), false, 'le client ne doit jamais pouvoir "répondre" à sa propre demande via le flux de réponse aux envois de l\'équipe')
}
console.log('PASS ISSUE 2: support -> notification admin par demande, threads séparés, pas de réponse croisée, pas de doublon')

// ============================================================
// ISSUE 3 — canonical demo client mapping
// ============================================================
{
  const leads = seed()
  const demoLead = leads.find(l => l.id === CANONICAL_DEMO_CLIENT_ID)
  assert.ok(demoLead, 'le lead canonique doit exister dans les données de démonstration')
  assert.equal(demoLead.name, CANONICAL_DEMO_CLIENT_NAME)
  assert.equal(demoLead.stage, 'Client', 'le client de démo doit apparaître comme "Client" côté admin (onglet Clients)')
  assert.equal(demoLead.paymentValidated, true, 'sans paiement validé, ce lead n\'apparaîtrait pas dans la vue admin Clients')

  // No duplicate "Client Démo" elsewhere in the seed.
  const duplicates = leads.filter(l => l.name === CANONICAL_DEMO_CLIENT_NAME)
  assert.equal(duplicates.length, 1, 'un seul enregistrement "Client Démo", jamais de doublon')

  // Non-destructive migration: a stale persisted lead #6 (from before this
  // fix) gets corrected without losing its history.
  const staleLeads = seed().map(l => l.id === CANONICAL_DEMO_CLIENT_ID
    ? { ...l, name: 'Adam Exemple 1', stage: 'Injoignable', paymentValidated: false, activity: [{ text: 'Ancien historique conservé', at: '01/01/2026 · 09:00' }] }
    : l)
  const fixed = normalizeCanonicalDemoClient(staleLeads)
  const fixedLead = fixed.find(l => l.id === CANONICAL_DEMO_CLIENT_ID)
  assert.equal(fixedLead.name, CANONICAL_DEMO_CLIENT_NAME)
  assert.equal(fixedLead.stage, 'Client')
  assert.equal(fixedLead.paymentValidated, true)
  assert.ok(fixedLead.activity.some(e => e.text === 'Ancien historique conservé'), 'la migration ne doit jamais effacer l\'historique existant du client')
  // Other leads must be untouched.
  const otherBefore = staleLeads.find(l => l.id === 1)
  const otherAfter = fixed.find(l => l.id === 1)
  assert.deepEqual(otherAfter, otherBefore, 'la migration ne doit toucher aucun autre lead')

  // Same ID used consistently across every store: documents, associate
  // documents, marketing, support/messages, notifications.
  const clientId = CANONICAL_DEMO_CLIENT_ID
  uploadDocument(clientId, 'associate_cin_recto', "CIN de l'associé — Recto", { name: 'cin-recto.pdf' })
  const docs = getClientDocuments(clientId)
  assert.equal(docs.associate_cin_recto.fileName, 'cin-recto.pdf')
  assert.ok(listAssociateDocCategories(docs).some(c => c.id === 'associate_cin_recto'))

  const marketingReq = createModificationRequest(clientId, { section: 'Général', title: 'Ajouter une page Contact' }, CANONICAL_DEMO_CLIENT_NAME)
  assert.equal(getModificationRequests(clientId)[0].id, marketingReq.id)

  const supportReq = createClientSupportRequest(clientId, { subject: 'Test', message: 'Message de test' }, CANONICAL_DEMO_CLIENT_NAME)
  assert.ok(getClientSends(clientId).some(i => i.id === supportReq.id))

  // The admin notifications created above all reference the SAME clientId —
  // an admin reading them can always resolve to the same client record.
  const notifs = getAdminNotifications().filter(n => n.clientId === clientId)
  assert.ok(notifs.length >= 2, 'les notifications marketing et support pour ce client doivent toutes référencer le même clientId')
  notifs.forEach(n => assert.equal(n.clientId, clientId))
}
console.log('PASS ISSUE 3: client de démo canonique (id/nom uniques), migration non destructive, même id dans tous les stores')

console.log('ALL PASS: notifications admin (marketing + support) et mapping client de démo <-> fiche admin')
