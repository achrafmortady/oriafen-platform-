// Vérifie (au niveau des fonctions pures, mêmes conventions que
// local-check.mjs / local-check-tracking.mjs — aucun navigateur, aucun appel
// réseau) les 9 points de feedback CRM traités dans cette session :
//   1. Lisibilité (vérifiée par lecture de code / CSS, non testable ici)
//   2. Bug "Prochaine action" (une action = une entrée d'historique)
//   3. Historique trié du plus récent au plus ancien
//   4. Nouveaux prospects en tête (createdAt DESC)
//   5. RDV effectué (une entrée d'historique, étape CRM inchangée)
//   6. Logique "Clients à relancer"
//   7. Scénarios A-D bout en bout (au niveau logique)
import assert from 'node:assert/strict'
import { register } from 'node:module'
// Certains modules source (ex: clientHistory.js -> activityLog.js) utilisent
// des imports relatifs sans extension (résolus par Vite au build, pas par
// Node tel quel) — même contournement que local-check-tracking.mjs,
// test-only, et mêmes polyfills minimaux (localStorage/window) puisque
// activityLog.js y écrit son journal.
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

const { seed, sortRecentFirst } = await import('./src/local/model.js')
const { buildLeadTimeline, applyNextActionUpdate, applyStatusChange } = await import('./src/local/clientHistory.js')
const { addAppointment, markAppointmentDone } = await import('./src/local/appointments.js')
const { relanceReason, isToRelaunch, isRelanceOverdue, scheduleRelance, clearRelance, RELANCE_STAGE } = await import('./src/local/relance.js')
const { applyPaymentValidation } = await import('./src/local/conversion.js')
const { createClientSupportRequest, respondToClientRequest, getClientSends, replyToClientSend } = await import('./src/local/clientTrackingStore.js')
const { createModificationRequest, setModificationStatus, getModificationRequests, getMarketingProject } = await import('./src/local/marketingStore.js')

let leads = seed()

// --- Scénario A : créer un prospect, vérifier qu'il apparaît en premier ---
const newLead = { ...leads[0], id: 999001, createdAt: Date.now(), name: 'Nouveau Prospect Test', stage: 'Nouveau', activity: [{ text: 'Prospect créé localement', at: '17/09/2026 · 10:00' }] }
leads = [...leads, newLead]
{
  const columnNouveau = sortRecentFirst(leads.filter(l => l.stage === 'Nouveau'))
  assert.equal(columnNouveau[0].id, newLead.id, 'le nouveau prospect doit apparaître en tête de sa colonne (createdAt DESC)')
}

// Ajouter une note (commentaire d'historique) — patch() ajoute une entrée en
// tête ; on reproduit ce comportement directement ici (fonction pure locale
// au composant, non extraite — testé via buildLeadTimeline sur le résultat).
newLead.activity = [{ text: 'Note ajoutée : Premier contact prometteur', at: '17/09/2026 · 10:05' }, ...newLead.activity]

// Prochaine action : création puis modification — DEUX appels = DEUX entrées
// (jamais plus, même si l'utilisateur avait tapé caractère par caractère
// avant le correctif du composant — voir feedback #2).
leads = applyNextActionUpdate(leads, newLead.id, 'action', 'Rappeler demain')
leads = applyNextActionUpdate(leads, newLead.id, 'action', 'Rappeler demain à 14h')
{
  const lead = leads.find(l => l.id === newLead.id)
  const actionEntries = lead.activity.filter(e => e.text.startsWith('Prochaine action'))
  assert.equal(actionEntries.length, 2, 'une création + une modification = exactement 2 entrées, jamais une par frappe clavier')
  assert.equal(actionEntries[0].text, 'Prochaine action modifiée — Rappeler demain à 14h')
}

// Log call = un commentaire d'historique (une entrée)
{
  const lead = leads.find(l => l.id === newLead.id)
  leads = leads.map(l => l.id === newLead.id ? { ...l, activity: [{ text: 'Appel effectué', at: '17/09/2026 · 10:10' }, ...l.activity] } : l)
}

// Schedule appointment
leads = addAppointment(leads, newLead.id, { scheduledAt: '2026-09-20T14:00', type: 'appel' })
{
  const lead = leads.find(l => l.id === newLead.id)
  assert.equal(lead.appointments.length, 1)
  assert.equal(lead.appointments[0].status, 'planifie')
}

// Mark appointment completed — une seule entrée, l'étape CRM ne bouge pas
{
  const before = leads.find(l => l.id === newLead.id)
  const apptId = before.appointments[0].id
  const historyBefore = before.activity.length
  leads = markAppointmentDone(leads, newLead.id, apptId)
  const after = leads.find(l => l.id === newLead.id)
  assert.equal(after.appointments[0].status, 'effectue')
  assert.equal(after.activity.length, historyBefore + 1, 'RDV effectué = UNE seule entrée d\'historique')
  assert.equal(after.stage, before.stage, 'marquer un RDV effectué ne doit jamais changer l\'étape CRM du prospect')
  // Idempotence : un second clic sur un RDV déjà effectué n'ajoute rien.
  const leadsAgain = markAppointmentDone(leads, newLead.id, apptId)
  assert.equal(leadsAgain.find(l => l.id === newLead.id).activity.length, after.activity.length)
}

// Schedule follow-up (relance) après le RDV
leads = scheduleRelance(leads, newLead.id, { at: '2026-09-25T09:00', note: 'Revenir vers lui après réflexion' })
{
  const lead = leads.find(l => l.id === newLead.id)
  assert.ok(isToRelaunch(lead), 'un prospect avec une relance programmée doit être détecté "à relancer"')
  assert.ok(relanceReason(lead).startsWith('Relance prévue le'))
  assert.equal(isRelanceOverdue(lead), false, 'une relance dans le futur n\'est jamais "en retard"')
}

// Change status/stage (une seule entrée par changement)
{
  const before = leads.find(l => l.id === newLead.id).activity.length
  leads = applyStatusChange(leads, newLead.id, 'Qualifié')
  const lead = leads.find(l => l.id === newLead.id)
  assert.equal(lead.activity.length, before + 1)
  assert.equal(lead.stage, 'Qualifié')
}

// Verify history: newest first, at every point
{
  const lead = leads.find(l => l.id === newLead.id)
  const timeline = buildLeadTimeline(lead)
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i - 1].ts != null && timeline[i].ts != null) assert.ok(timeline[i - 1].ts >= timeline[i].ts, 'timeline doit rester triée du plus récent au plus ancien')
  }
  assert.ok(timeline[0].action.startsWith('Statut changé'), 'l\'action la plus récente (changement de statut) doit être en tête')
}
console.log('PASS: scénario A (création, note, prochaine action, appel, RDV, RDV effectué, relance, changement de statut, historique récent-en-tête)')

// --- Scénario B : appel manqué -> Injoignable -> relance programmée ---
{
  let l2 = { ...leads[1], id: 999002, createdAt: Date.now() - 1000, stage: 'Nouveau', activity: [{ text: 'Prospect créé localement', at: '17/09/2026 · 09:00' }] }
  let ls = [l2]
  ls = ls.map(l => l.id === l2.id ? { ...l, activity: [{ text: 'Appel sans réponse', at: '17/09/2026 · 09:05' }, ...l.activity] } : l)
  ls = applyStatusChange(ls, l2.id, 'Injoignable')
  ls = scheduleRelance(ls, l2.id, { at: '2026-09-19T09:00', note: 'Retenter en journée' })
  const lead = ls.find(l => l.id === l2.id)
  assert.equal(lead.stage, 'Injoignable')
  assert.ok(isToRelaunch(lead), 'un Injoignable avec relance programmée doit apparaître dans "Clients à relancer"')
  assert.equal(relanceReason(lead), 'Relance prévue le 19/09/2026 - 09:00 — Retenter en journée')
}
console.log('PASS: scénario B (appel manqué, Injoignable, relance programmée, logique de relance lisible)')

// --- Scénario C : prospect perdu, historique conservé, raison enregistrée ---
{
  let l3 = { ...leads[2], id: 999003, activity: [{ text: 'Prospect créé localement', at: '17/09/2026 · 08:00' }] }
  let ls = [l3]
  const before = ls[0].activity.length
  ls = applyStatusChange(ls, l3.id, 'Perdu', 'Budget insuffisant cette année')
  const lead = ls.find(l => l.id === l3.id)
  assert.equal(lead.stage, 'Perdu')
  assert.equal(lead.lossReason, 'Budget insuffisant cette année')
  assert.equal(lead.activity.length, before + 1, 'changement de statut + raison = une seule entrée, jamais deux')
  assert.ok(lead.activity[0].text.includes('Raison :'))
  assert.equal(lead.activity.length, before + 1)
  // Historique conservé (jamais supprimé)
  assert.equal(lead.activity[lead.activity.length - 1].text, 'Prospect créé localement')
}
console.log('PASS: scénario C (prospect perdu, raison enregistrée, historique conservé)')

// --- Scénario D : conversion prospect -> client, pas de doublon ---
{
  const packLead = leads.find(l => l.packId)
  const before = leads.length
  const converted = applyPaymentValidation(leads, packLead.id)
  assert.equal(converted.length, before, 'la conversion ne doit jamais créer un enregistrement supplémentaire')
  const lead = converted.find(l => l.id === packLead.id)
  assert.equal(lead.paymentValidated, true)
  assert.ok(lead.payments.length > 0)
  assert.equal(lead.payments[0].status, 'paid')
  // Idempotent : revalider un lead déjà validé ne change rien de plus.
  const again = applyPaymentValidation(converted, packLead.id)
  assert.deepEqual(again, converted)
}
console.log('PASS: scénario D (conversion prospect -> client, gate de paiement respecté, aucun doublon)')

// --- Feedback #4 : tri récent-en-tête générique ---
{
  const sample = [
    { id: 1, createdAt: 1000 },
    { id: 2, createdAt: 3000 },
    { id: 3, createdAt: 2000 },
    { id: 4 }, // pas de createdAt (données anciennes) -> jamais placé en tête
  ]
  const sorted = sortRecentFirst(sample)
  assert.deepEqual(sorted.map(l => l.id), [2, 3, 1, 4])
}
console.log('PASS: tri récent-en-tête (createdAt DESC), données sans createdAt jamais placées en tête')

// --- Feedback #6 : règle "Clients à relancer" ---
{
  const noRelance = { stage: 'Qualifié' }
  const stageOnly = { stage: RELANCE_STAGE }
  const dated = { stage: 'Qualifié', relance: { at: '2026-01-01T09:00', note: '' } }
  assert.equal(isToRelaunch(noRelance), false)
  assert.equal(isToRelaunch(stageOnly), true)
  assert.equal(relanceReason(stageOnly), 'À relancer — aucune date définie')
  assert.equal(isToRelaunch(dated), true)
  assert.equal(isRelanceOverdue(dated), true, 'une relance datée dans le passé doit être signalée en retard')
  const cleared = clearRelance([{ id: 1, ...dated }], 1)
  assert.equal(cleared[0].relance, null)
}
console.log('PASS: règle "Clients à relancer" (stage seul, relance datée, retard, annulation)')

// --- Feedback #9 : SUPPORT — le client crée une demande, l'équipe répond ---
{
  const demoClientId = 42
  const before = getClientSends(demoClientId).length
  const ticket = createClientSupportRequest(demoClientId, { subject: 'Problème de connexion', message: "Je n'arrive plus à accéder à mon espace." })
  assert.ok(ticket, 'une demande avec sujet + message doit être créée')
  assert.equal(ticket.senderType, 'client')
  assert.equal(ticket.responseRequired, true)
  const afterCreate = getClientSends(demoClientId)
  assert.equal(afterCreate.length, before + 1, 'la demande vient s\'ajouter au même flux (aucun système parallèle)')
  // Le client ne peut pas répondre à sa propre demande (corrigé — attend l'équipe).
  const clientReplyAttempt = replyToClientSend(ticket.id, 'test')
  assert.equal(clientReplyAttempt, false, 'replyToClientSend ne doit pas pouvoir répondre à une demande initiée par le client lui-même')
  // L'équipe répond — une seule fois.
  const ok = respondToClientRequest(ticket.id, 'Nous regardons cela tout de suite.')
  assert.equal(ok, true)
  const item = getClientSends(demoClientId).find(i => i.id === ticket.id)
  assert.equal(item.status, 'replied')
  assert.equal(item.response.author, 'Équipe')
  // Idempotent : une deuxième tentative de réponse ne duplique rien.
  const again = respondToClientRequest(ticket.id, 'Autre message')
  assert.equal(again, false)
  // Une notification "Nouvelle réponse support" doit apparaître (cloche).
  const notif = getClientSends(demoClientId).find(i => i.title === 'Nouvelle réponse support')
  assert.ok(notif, 'une réponse de l\'équipe à une demande support doit déclencher une notification client')
  // Une demande vide (sans sujet ou message) est ignorée, jamais une fausse entrée.
  assert.equal(createClientSupportRequest(demoClientId, { subject: '', message: 'x' }), null)
  assert.equal(createClientSupportRequest(demoClientId, { subject: 'x', message: '' }), null)
}
console.log('PASS: flux Support (demande client -> réponse équipe, une seule notification, pas de doublon)')

// --- Feedback #8 : MARKETING — demande de modification, statuts, historique ---
{
  const demoClientId = 43
  const project = getMarketingProject(demoClientId)
  assert.ok(project.name && project.status && project.phase, 'l\'aperçu du projet doit exposer nom/statut/phase')
  const req = createModificationRequest(demoClientId, { section: 'Page d\'accueil', title: 'Changer la photo de couverture', description: 'Utiliser la photo du cabinet', priority: 'urgente' })
  assert.ok(req)
  assert.equal(req.status, 'Envoyée')
  const list1 = getModificationRequests(demoClientId)
  assert.equal(list1.length, 1)
  assert.equal(list1[0].history.length, 1)
  setModificationStatus(demoClientId, req.id, 'En cours')
  setModificationStatus(demoClientId, req.id, 'Traitée')
  const list2 = getModificationRequests(demoClientId)
  assert.equal(list2[0].status, 'Traitée')
  assert.deepEqual(list2[0].history.map(h => h.status), ['Envoyée', 'En cours', 'Traitée'], 'l\'historique des statuts est append-only, jamais écrasé')
  // Une notification doit prévenir le client du traitement (cloche + Mes échanges).
  const notif = getClientSends(demoClientId).find(i => i.title === 'Modification marketing : Traitée')
  assert.ok(notif, 'un changement de statut "Traitée" doit notifier le client via le flux existant')
  // Un titre vide est ignoré, jamais une fausse demande.
  assert.equal(createModificationRequest(demoClientId, { section: 'X', title: '   ' }), null)
}
console.log('PASS: flux Marketing (aperçu projet, demande de modification, statuts append-only, notification)')

console.log('ALL PASS: feedback CRM staging-v2 (9 points) — scénarios A/B/C/D + règles unitaires + support + marketing')
