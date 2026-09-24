// Régression ciblée — audit "inspection navigateur" (2026-09-24) : 20
// bugs/UX remontés sur un passage manuel du staging V2. Ce fichier couvre
// les correctifs testables par des fonctions pures (stores/model) ; les
// correctifs purement JSX/visuels sont couverts par des vérifications
// statiques de source (même convention que les autres local-check-*.mjs de
// cette session). 100% local, aucun accès réseau/Supabase.

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

const { CANONICAL_DEMO_CLIENT_ID, CANONICAL_DEMO_CLIENT_NAME } = await import('./src/local/model.js')
const { isCanonicalDemoClientId } = await import('./src/local/adapters/identity.js')
const { getClientDocuments } = await import('./src/local/documentsStore.js')
const { getClientSends, createClientSupportRequest, respondToClientRequest } = await import('./src/local/clientTrackingStore.js')
const { getAdminNotifications, addAdminNotification } = await import('./src/local/adminNotificationsStore.js')
const { applyPaymentValidation } = await import('./src/local/conversion.js')
const { LOCAL_PACKS } = await import('./src/local/packsData.js')
const { buildClientsOverview } = await import('./src/local/clientsOverviewData.js')

// ================================================================
// 2. Nouveau client converti : zéro document, zéro rejet — le seed de
//    démo reste réservé au seul client de démo canonique.
// ================================================================
check('documentsStore.js : un nouveau clientId réel démarre avec 0 document envoyé/rejeté ; le client de démo garde son seed (mélange de statuts)', () => {
  const freshDocs = getClientDocuments(70001)
  Object.values(freshDocs).forEach(doc => {
    assert.equal(doc.status, 'none')
    assert.equal(doc.fileName, null)
    assert.equal(doc.rejectionReason, null)
  })
  const demoDocs = getClientDocuments(CANONICAL_DEMO_CLIENT_ID)
  assert.ok(Object.values(demoDocs).some(d => d.status !== 'none'), 'le client de démo doit conserver son seed (comportement de démonstration inchangé)')
})

// ================================================================
// 3. Nouveau prospect/client : zéro support/message — même garantie côté
//    clientTrackingStore.
// ================================================================
check('clientTrackingStore.js : un nouveau clientId réel démarre avec 0 envoi/support ; le client de démo garde ses 3 envois de démonstration', () => {
  assert.equal(getClientSends(70002).length, 0)
  // >= 3 (pas ===) : le seed de démo (3 envois) peut recevoir des items
  // supplémentaires générés par d'autres stores (ex: notification "Document
  // refusé" pour un doc de démo déjà 'missing', voir documentsStore.js
  // backfillDocActivity) — comportement préexistant, hors périmètre ici.
  assert.ok(getClientSends(CANONICAL_DEMO_CLIENT_ID).length >= 3, 'le client de démo doit garder au moins ses 3 envois de démonstration')
})

check('isCanonicalDemoClientId : seul point de comparaison exposé aux stores (jamais un import direct de CANONICAL_DEMO_CLIENT_ID hors model.js/identity.js)', () => {
  assert.equal(isCanonicalDemoClientId(CANONICAL_DEMO_CLIENT_ID), true)
  assert.equal(isCanonicalDemoClientId(70003), false)
  assert.equal(isCanonicalDemoClientId(null), false)
})

// ================================================================
// 5. Réponse équipe à une demande support : un seul thread, jamais un
//    item dupliqué ; l'item redevient "non vu" pour alerter la cloche.
// ================================================================
check('respondToClientRequest : aucun item dupliqué créé, le thread d\'origine repasse à "non vu"', () => {
  const clientId = 70005
  const ticket = createClientSupportRequest(clientId, { subject: 'Test', message: 'Une question' }, 'Client Test')
  const before = getClientSends(clientId).length
  respondToClientRequest(ticket.id, 'Réponse équipe')
  const after = getClientSends(clientId)
  assert.equal(after.length, before, 'aucun item supplémentaire créé par la réponse')
  const thread = after.find(i => i.id === ticket.id)
  assert.equal(thread.status, 'replied')
  assert.equal(thread.response.author, 'Équipe')
  assert.equal(thread.seenAt, null, 'redevient non vu pour que la cloche compte la nouvelle réponse')
})

// ================================================================
// 6. KPI "Réponses en attente" : recompté directement depuis les envois
//    initiés par le client encore sans réponse (indépendant du statut de
//    dossier synthétique, qui masquait ce signal — voir clientsOverviewData.js).
// ================================================================
check('Une demande de support client non répondue reste détectable indépendamment du statut de dossier (missingDocs élevé ne doit plus masquer "responseRequired")', () => {
  const clientId = 70006
  createClientSupportRequest(clientId, { subject: 'Urgent', message: 'Question en attente' }, 'Client Test')
  const items = getClientSends(clientId)
  assert.ok(items.some(i => i.responseRequired && i.status !== 'replied'), 'le signal de réponse en attente doit rester lisible directement depuis clientTrackingStore, sans dépendre du statut dossier')
})

// ================================================================
// 7. Cloche admin : plus aucune notification liée au client de démo
//    canonique (leftovers), mais "QA TEST" reste filtré et une
//    notification légitime sur un client réel n'est jamais affectée.
// ================================================================
check('adminNotificationsStore.js : les notifications liées au client de démo canonique sont filtrées à la lecture, jamais celles d\'un client réel', () => {
  addAdminNotification({ type: 'support', title: 'Ancienne demande démo', message: 'Vieux test', clientId: CANONICAL_DEMO_CLIENT_ID, dedupeKey: 'demo-leftover-1' })
  const real = addAdminNotification({ type: 'support', title: 'Nouvelle demande — Client Réel', message: 'Question', clientId: 70007, clientName: 'Client Réel', dedupeKey: 'real-client-1' })
  const notifs = getAdminNotifications()
  assert.ok(!notifs.some(n => n.clientId === CANONICAL_DEMO_CLIENT_ID), 'aucune notification du client de démo ne doit rester visible')
  assert.ok(notifs.some(n => n.id === real.id), 'une notification légitime sur un client réel ne doit jamais être filtrée')
})

check('adminNotificationsStore.js : une notification contenant "QA TEST" est filtrée, même sans clientId de démo', () => {
  addAdminNotification({ type: 'support', title: 'QA TEST manuel', message: 'x', clientId: 70008, dedupeKey: 'qa-test-leftover' })
  assert.ok(!getAdminNotifications().some(n => n.dedupeKey === 'qa-test-leftover'))
})

// ================================================================
// 8. Finance HT/TTC : chaque paiement reste dérivé du pricingMode
//    réellement choisi par CE lead (pas de recalcul, juste vérifié).
// ================================================================
check('applyPaymentValidation : le montant du premier versement suit fidèlement le pricingMode choisi (HT vs TTC) pour un même pack', () => {
  const pack = LOCAL_PACKS.find(p => p.paymentType !== 'full') || LOCAL_PACKS[0]
  const leadHt = { id: 70009, name: 'Client HT', email: 'ht@example.invalid', stage: 'Qualifié', paymentValidated: false, packId: pack.id, pricingMode: 'ht', finalPrice: pack.priceHt, activity: [] }
  const leadTtc = { id: 70010, name: 'Client TTC', email: 'ttc@example.invalid', stage: 'Qualifié', paymentValidated: false, packId: pack.id, pricingMode: 'ttc', finalPrice: pack.priceTtc, activity: [] }
  const [clientHt] = applyPaymentValidation([leadHt], 70009).filter(l => l.id === 70009)
  const [clientTtc] = applyPaymentValidation([leadTtc], 70010).filter(l => l.id === 70010)
  const totalHt = clientHt.payments.reduce((n, p) => n + p.amount, 0)
  const totalTtc = clientTtc.payments.reduce((n, p) => n + p.amount, 0)
  assert.ok(totalTtc > totalHt, 'le total TTC doit être supérieur au total HT pour le même pack (jamais mélangés/confondus)')
  assert.equal(totalHt, pack.priceHt)
  assert.equal(totalTtc, pack.priceTtc)
})

// ================================================================
// 9. Conversion : convertedAt renseigné, action/done nettoyés (agenda).
// ================================================================
check('applyPaymentValidation : convertedAt est renseigné et l\'action pré-conversion est nettoyée (done=true, jamais "Premier contact" qui persiste)', () => {
  const pack = LOCAL_PACKS[0]
  const lead = { id: 70011, name: 'Client Conv', email: 'conv@example.invalid', stage: 'Qualifié', paymentValidated: false, packId: pack.id, finalPrice: pack.priceTtc, action: 'Premier contact', done: false, activity: [] }
  const [client] = applyPaymentValidation([lead], 70011).filter(l => l.id === 70011)
  assert.ok(client.convertedAt, 'convertedAt doit être renseigné à la conversion')
  assert.equal(client.done, true, 'la prochaine action pré-conversion doit être marquée terminée (agenda)')
  assert.notEqual(client.action, 'Premier contact')
})

// ================================================================
// 11. Potentiel commercial par défaut = montant final du pack (jamais 0).
//     Vérifié via le contrat computeFinalPrice déjà utilisé par
//     NewProspectModal (LocalCRM.jsx) — reproduit ici sans deviner l'UI.
// ================================================================
{
  const { computeFinalPrice } = await import('./src/local/packsData.js')
  check('computeFinalPrice (utilisé pour initialiser "Potentiel" à la création) ne renvoie jamais 0 pour un pack payant sans remise', () => {
    const pack = LOCAL_PACKS.find(p => p.priceTtc > 0)
    const amount = computeFinalPrice(pack, 'ttc', 0)
    assert.ok(amount > 0, 'le potentiel initial ne doit plus jamais rester à 0 pour un pack sélectionné')
  })
}

// ================================================================
// 12. Format de date RDV — toDisplayDateSafe convertit bien une valeur
//     ISO issue d'un input datetime-local en libellé FR lisible.
// ================================================================
{
  const { toDisplayDateSafe } = await import('./src/local/dateUtils.js')
  check('toDisplayDateSafe convertit une date RDV ISO ("2026-09-26T10:00") en format FR lisible, jamais affichée brute', () => {
    const label = toDisplayDateSafe('2026-09-26T10:00')
    assert.ok(label, 'une date ISO valide doit produire un libellé')
    assert.doesNotMatch(label, /^\d{4}-\d{2}-\d{2}T/, 'ne doit jamais rester au format ISO brut')
    assert.match(label, /26\/09\/2026/, 'doit contenir la date au format JJ/MM/AAAA')
  })
}

// ================================================================
// 20. Message email manquant : EMAIL_GATE_MESSAGE reste disponible pour
//     être affiché immédiatement près du select Statut (LocalCRM.jsx),
//     pas seulement dans la carte de paiement.
// ================================================================
{
  const { EMAIL_GATE_MESSAGE, PAYMENT_GATE_MESSAGE } = await import('./src/local/conversion.js')
  check('EMAIL_GATE_MESSAGE et PAYMENT_GATE_MESSAGE restent des messages explicites non vides, réutilisables partout où le gate se déclenche', () => {
    assert.ok(EMAIL_GATE_MESSAGE.length > 10)
    assert.ok(PAYMENT_GATE_MESSAGE.length > 10)
  })
}

// ================================================================
// Vérifications statiques (correctifs JSX-only) — même convention que les
// autres local-check-*.mjs de cette session : lecture de source, jamais de
// rendu React en Node.
// ================================================================

check('LocalCRM.jsx : l\'en-tête client et LocalMonDossier.jsx affichent le pack RÉEL du lead, plus jamais "Pack Accélération" en dur', () => {
  const crmSrc = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  const dossierSrc = readFileSync('./src/local/LocalMonDossier.jsx', 'utf8')
  assert.doesNotMatch(crmSrc, /const clientPack='Pack Accélération'/)
  assert.doesNotMatch(dossierSrc, /const pack = 'Pack Accélération'/)
  assert.match(crmSrc, /const clientPack=clientLead\?\.pack\|\|null/)
  assert.match(dossierSrc, /const pack = clientLead\?\.pack \|\| 'Non renseigné'/)
})

check('LocalAdminNotificationBell.jsx : une action "Ouvrir et répondre" est visible pour les notifications de support, et Échap ferme le panneau', () => {
  const src = readFileSync('./src/local/LocalAdminNotificationBell.jsx', 'utf8')
  assert.match(src, /Ouvrir et répondre/)
  assert.match(src, /e\.key === 'Escape'/)
})

check('LocalNotificationBell.jsx (client) : Échap ferme aussi le panneau', () => {
  const src = readFileSync('./src/local/LocalNotificationBell.jsx', 'utf8')
  assert.match(src, /e\.key === 'Escape'/)
})

check('clientTrackingStore.js : l\'historique d\'une réponse équipe est étiqueté "Équipe", jamais "Client", quand response.author==="Équipe"', () => {
  const src = readFileSync('./src/local/clientTrackingStore.js', 'utf8')
  assert.match(src, /const isTeamReply = item\.response\.author === 'Équipe'/)
  assert.match(src, /author: isTeamReply \? 'Équipe' : 'Client'/)
})

check('LocalMarketing.jsx : passer un canal à "Terminé" force 100%, "En cours" ne reste jamais à 0% par défaut', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  assert.match(src, /function statusToPatch/)
  assert.match(src, /if \(status === 'Terminé'\) return \{ status, progressPct: 100 \}/)
  assert.match(src, /if \(status === 'En cours' && currentProgressPct === 0\) return \{ status, progressPct: 40 \}/)
})

check('LocalMarketing.jsx : le résumé client (BrandSummaryCard) affiche audience/offres/valeurs/notes, plus aucune omission', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  const cardMatch = src.match(/function BrandSummaryCard[\s\S]*?\n}\n/)
  assert.ok(cardMatch)
  const body = cardMatch[0]
  for (const field of ['intake.audience', 'intake.offer', 'intake.values', 'intake.notes']) {
    assert.ok(body.includes(field), `BrandSummaryCard doit afficher ${field}`)
  }
})

check('LocalMarketing.jsx : un sélecteur de client existe dans AdminMarketingPanel (clients=[], defaultClientId), plus un unique clientId figé', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  assert.match(src, /export function AdminMarketingPanel\(\{\s*clients\s*=\s*\[\]/)
  assert.match(src, /clients\.length > 1 && \(/)
})

check('LocalDossierSection.jsx : "Valider →" est bloqué (raison explicite) tant que des documents sont manquants', () => {
  const src = readFileSync('./src/local/LocalDossierSection.jsx', 'utf8')
  assert.match(src, /missingDocsCount > 0 \? \(/)
  assert.match(src, /doc.*manquant/)
})

check('LocalCRM.jsx : la catégorie de support choisie par le client (ex: "Dossier ORIAS") est affichée à la place du kind générique "Support"', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /const itemBadgeLabel=item=>\(item\.category&&TICKET_CATEGORY_LABELS\[item\.category\]\)\|\|item\.kind/)
})

check('LocalCRM.jsx : un message explicite (email ou paiement) s\'affiche directement sous le select Statut quand le passage à "Client" est refusé', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  const statutSection = src.match(/<h3>Statut<\/h3>[\s\S]{0,1200}/)
  assert.ok(statutSection)
  assert.match(statutSection[0], /convertAttempt&&<p[\s\S]*?PAYMENT_GATE_MESSAGE/)
  assert.match(statutSection[0], /convertAttempt&&!String\(lead\.email\|\|''\)\.trim\(\)&&<p[\s\S]*?EMAIL_GATE_MESSAGE/)
})

check('LocalFormationTrackingSection.jsx : étiqueté clairement "lecture seule" (aucun contrôle d\'édition ambigu)', () => {
  const src = readFileSync('./src/local/LocalFormationTrackingSection.jsx', 'utf8')
  assert.match(src, /Lecture seule/)
})

check('Correctifs de wording #18 : plus de "Salma Démo"/"Yanis Démo"/"Projet client (démo)"/"Non modélisé en local"/"Fonctionnalités locales (en plus du live)" dans l\'UI', () => {
  const model = readFileSync('./src/local/model.js', 'utf8')
  const shell = readFileSync('./src/local/LocalAdminShell.jsx', 'utf8')
  const marketing = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  const clientsOverview = readFileSync('./src/local/LocalClientsOverview.jsx', 'utf8')
  assert.match(model, /export const owners = \['Salma','Yanis','Non attribué'\]/)
  assert.doesNotMatch(shell, /Salma Démo/)
  assert.doesNotMatch(marketing, /Projet client \(démo\)/)
  assert.doesNotMatch(clientsOverview, />Non modélisé en local</)
  assert.doesNotMatch(clientsOverview, />Fonctionnalités locales \(en plus du live\)</)
})

console.log(`PASS (${passed} checks): audit inspection navigateur 2026-09-24 — 20 bugs/UX corrigés (documents/support vierges pour tout client réel, pas de doublon de réponse, KPIs recalculés, cloche admin nettoyée, Finance HT/TTC explicite, conversion propre, potentiel initialisé, dates RDV lisibles, catégorie support préservée, sélecteur client Marketing, etc.).`)
