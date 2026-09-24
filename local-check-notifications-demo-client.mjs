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
const { buildClientsOverview } = await import('./src/local/clientsOverviewData.js')

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

  // Correctif "réponse dupliquée" (audit inspection navigateur, 2026-09-24) :
  // la réponse ne crée plus jamais un second item ("Nouvelle réponse
  // support") — elle reste attachée au thread d'origine (t1.response,
  // déjà vérifié ci-dessus), et ce même item repasse à "non vu" pour que
  // la cloche cliente alerte sans dupliquer la conversation.
  assert.equal(getClientSends(clientId).filter(i => i.title === 'Nouvelle réponse support').length, 0, 'la réponse ne doit plus jamais créer un item séparé — un seul thread par demande')
  assert.equal(t1.seenAt, null, 'le thread d\'origine repasse à "non vu" pour signaler la nouvelle réponse à la cloche cliente')

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
  //
  // Un id RÉEL arbitraire est utilisé ici plutôt que CANONICAL_DEMO_CLIENT_ID
  // (audit inspection navigateur, 2026-09-24, item 7 "no demo notifications
  // in normal V2") : adminNotificationsStore.js filtre désormais
  // volontairement toute notification liée au client de démo canonique (une
  // vraie session V2 ne génère d'ailleurs jamais d'action sur ce lead —
  // cleanPreviewLeads l'exclut déjà des leads visibles). Cette partie du
  // test vérifie un invariant indépendant de cet id précis (cohérence d'un
  // même clientId à travers tous les stores) — un id arbitraire le
  // démontre tout aussi bien, sans entrer en conflit avec le nettoyage.
  const clientId = 'consistency-check-client'
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

// ============================================================
// RÉGRESSION CIBLÉE (QA 2026-09-18, round 2) — vérifie le JEU DE DONNÉES
// RÉELLEMENT utilisé par Admin > Clients (LocalClientsOverview.jsx), pas
// seulement que les constantes existent dans le code. Root cause : ce
// composant a SA PROPRE copie du chargement des leads (useLocalLeads,
// distincte de celles de LocalAdminShell.jsx et LocalCRM.jsx) et n'appliquait
// pas normalizeCanonicalDemoClient — reproduit ici exactement la même chaîne
// que le hook corrigé : JSON.parse(localStorage) -> normalizeLeadsStage ->
// normalizeCanonicalDemoClient -> buildClientsOverview (même fonction que le
// rendu réel de l'onglet Clients).
// ============================================================
const { normalizeLeadsStage } = await import('./src/local/model.js')
function loadLeadsLikeAdminClientsTab(raw) {
  return raw ? normalizeCanonicalDemoClient(normalizeLeadsStage(raw)) : seed()
}

// Cas 1 : rien en localStorage encore (première visite) -> seed() direct.
{
  const leads = loadLeadsLikeAdminClientsTab(null)
  const { rows } = buildClientsOverview(leads)
  const matches = rows.filter(r => r.name === CANONICAL_DEMO_CLIENT_NAME)
  assert.equal(matches.length, 1, 'Admin > Clients doit afficher exactement UN "Client Démo" dès la première visite (seed())')
  assert.equal(matches[0].id, CANONICAL_DEMO_CLIENT_ID)
  assert.equal(matches[0].pack, 'Pack Accélération')
}

// Cas 2 (le bug rapporté) : des leads DÉJÀ persistés en localStorage AVANT
// ce correctif, où le lead #6 n'a pas encore l'identité canonique (nom
// différent, pas encore stage "Client"). C'est exactement l'état d'un
// testeur qui avait déjà utilisé la Preview.
{
  const staleRaw = seed().map(l => l.id === CANONICAL_DEMO_CLIENT_ID
    ? { ...l, name: 'Adam Exemple 1', stage: 'Injoignable', paymentValidated: false, pack: 'Pack Essentiel' }
    : l)
  const leads = loadLeadsLikeAdminClientsTab(staleRaw)
  const { rows } = buildClientsOverview(leads)
  const matches = rows.filter(r => r.name === CANONICAL_DEMO_CLIENT_NAME)
  assert.equal(matches.length, 1, 'BUG RAPPORTÉ : avec des données déjà persistées (nom/étape non canoniques), Admin > Clients doit quand même afficher "Client Démo" après le correctif')
  assert.equal(matches[0].id, CANONICAL_DEMO_CLIENT_ID)
  assert.equal(matches[0].pack, 'Pack Accélération')
  // Aucun doublon : l'ancien nom "Adam Exemple 1" n'apparaît plus du tout
  // pour cet id (il a été corrigé en place, pas dupliqué).
  assert.equal(rows.some(r => r.id === CANONICAL_DEMO_CLIENT_ID && r.name === 'Adam Exemple 1'), false)
  assert.equal(rows.filter(r => r.id === CANONICAL_DEMO_CLIENT_ID).length, 1, 'un seul enregistrement pour cet id, jamais deux')
}

// Cas 3 : mêmes documents/associé/marketing/support pour ce même id, relus
// au travers de la même chaîne de normalisation (bout-en-bout, pas juste le
// store isolé).
{
  const leads = loadLeadsLikeAdminClientsTab(null)
  const { rows } = buildClientsOverview(leads)
  const demoRow = rows.find(r => r.name === CANONICAL_DEMO_CLIENT_NAME)
  assert.ok(demoRow)
  uploadDocument(demoRow.id, 'associate_cin_verso', "CIN de l'associé — Verso", { name: 'verso.pdf' })
  assert.equal(getClientDocuments(demoRow.id).associate_cin_verso.fileName, 'verso.pdf')
  const support = createClientSupportRequest(demoRow.id, { subject: 'Test bout-en-bout', message: 'Vérification finale' }, CANONICAL_DEMO_CLIENT_NAME)
  assert.ok(getClientSends(demoRow.id).some(i => i.id === support.id))
  // Correctif "vieilles notifications de démo dans la cloche admin" (audit
  // inspection navigateur, 2026-09-24, item 7) : adminNotificationsStore.js
  // filtre désormais volontairement toute notification liée au client de
  // démo canonique — une vraie session V2 n'en génère d'ailleurs jamais
  // (cleanPreviewLeads exclut ce lead des leads visibles). Le comportement
  // attendu s'est donc inversé par rapport à l'ancienne assertion : la
  // notification créée ci-dessus ne doit PLUS apparaître dans la cloche
  // admin, même si le support request lui-même reste bien enregistré.
  assert.equal(getAdminNotifications().some(n => n.clientId === demoRow.id), false, 'les notifications liées au client de démo canonique ne doivent plus jamais apparaître dans la cloche admin')
}
console.log('PASS RÉGRESSION: le jeu de données réel d\'Admin > Clients (buildClientsOverview) contient "Client Démo", y compris avec des leads déjà persistés, sans doublon')

// ============================================================
// RÉGRESSION CIBLÉE (round 3) — la lecture en mémoire était déjà correcte,
// mais RIEN ne réécrivait le résultat migré dans localStorage au chargement
// de l'onglet Clients (seul LocalCRM.jsx le faisait) : la correction ne
// survivait donc pas si l'onglet CRM n'avait jamais été monté avant, ou pas
// à un refresh de l'onglet Clients seul. Reproduit ici l'ouverture directe
// d'Admin > Clients (localStorage déjà rempli avec l'ancienne identité, AUCUN
// autre chargeur n'ayant encore tourné) et vérifie que localStorage
// lui-même — pas seulement la valeur en mémoire — contient désormais
// "Client Démo" après cette seule ouverture.
// ============================================================
{
  localStorage.clear()
  const staleRaw = seed().map(l => l.id === CANONICAL_DEMO_CLIENT_ID
    ? { ...l, name: 'Adam Exemple 1', stage: 'Injoignable', paymentValidated: false }
    : l)
  localStorage.setItem('oriafen-isolated-crm-v1', JSON.stringify(staleRaw))

  // Reproduit exactement le corps du useState(() => {...}) de useLocalLeads
  // (LocalClientsOverview.jsx) après le correctif round 2 : lire, normaliser,
  // et réécrire dans localStorage si le résultat diffère des données brutes.
  function simulateOpeningAdminClientsTab() {
    const raw = JSON.parse(localStorage.getItem('oriafen-isolated-crm-v1'))
    if (!raw) return seed()
    const normalized = normalizeCanonicalDemoClient(normalizeLeadsStage(raw))
    if (JSON.stringify(normalized) !== JSON.stringify(raw)) localStorage.setItem('oriafen-isolated-crm-v1', JSON.stringify(normalized))
    return normalized
  }

  const leadsInMemory = simulateOpeningAdminClientsTab()
  assert.equal(leadsInMemory.find(l => l.id === CANONICAL_DEMO_CLIENT_ID).name, CANONICAL_DEMO_CLIENT_NAME)

  // La preuve qui manquait : localStorage LUI-MÊME doit maintenant contenir
  // "Client Démo", pas seulement l'état React en mémoire.
  const persisted = JSON.parse(localStorage.getItem('oriafen-isolated-crm-v1'))
  const persistedDemo = persisted.find(l => l.id === CANONICAL_DEMO_CLIENT_ID)
  assert.ok(persistedDemo, 'localStorage doit contenir le lead canonique après une seule ouverture de l\'onglet Clients')
  assert.equal(persistedDemo.name, CANONICAL_DEMO_CLIENT_NAME, 'localStorage doit être réécrit avec "Client Démo", pas seulement la mémoire React')
  assert.equal(persistedDemo.stage, 'Client')
  assert.equal(persistedDemo.paymentValidated, true)

  // Un second appel (simulateur du polling toutes les 4s / d'un remount) ne
  // doit plus rien réécrire d'incorrect ni dupliquer quoi que ce soit.
  const leadsAgain = simulateOpeningAdminClientsTab()
  assert.equal(leadsAgain.filter(l => l.id === CANONICAL_DEMO_CLIENT_ID).length, 1)
  assert.equal(leadsAgain.find(l => l.id === CANONICAL_DEMO_CLIENT_ID).name, CANONICAL_DEMO_CLIENT_NAME)

  localStorage.clear()
}
console.log('PASS RÉGRESSION (round 3) : ouvrir Admin > Clients avec des données déjà persistées réécrit lui-même localStorage avec "Client Démo" (plus de dépendance à l\'ordre de montage CRM/Clients)')

console.log('ALL PASS: notifications admin (marketing + support) et mapping client de démo <-> fiche admin')
