// Régression ciblée — "final UX fixes" (2026-09-24) :
//   1/2. Renommage "Mes échanges" -> "Support" + cartes plus lisibles
//        (étiquette expéditeur claire Vous/Équipe Oriafen).
//   3. Le brief brand kit soumis par le client déclenche bien une
//      notification admin visible (déjà câblé dans marketingStore.js,
//      revérifié ici pour ne pas régresser).
//   4. L'admin peut télécharger le brief brand kit complet (nom/email
//      client + date + tous les champs).
//   5. Un onglet Finance V2 local existe, dérivé uniquement des paiements
//      locaux des clients réellement convertis — jamais la logique Finance
//      live (Supabase) touchée ici.
// 100% local, aucun accès réseau/Supabase.

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
// 1/2. Support (renommage + lisibilité) — vérification statique du
//    câblage réel dans LocalCRM.jsx (jamais de rendu JSX en Node ici,
//    même convention que les autres local-check-*.mjs de cette session).
// ================================================================
check('LocalCRM.jsx : la navigation client utilise "Support", plus "Mes échanges"', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /\['support',\s*'Support'\]/, 'le libellé de nav doit être "Support"')
})

check('LocalCRM.jsx : le titre de la page Support est "Support" et le bouton reste "＋ Nouvelle demande de support" (jamais "Mes échanges" dans un texte affiché à l\'écran)', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, />Support<\/h2>/)
  assert.match(src, /＋ Nouvelle demande de support/)
  assert.match(src, />Voir Support<\/button>/)
  // Seules des références en commentaires de code (non affichées à l'écran)
  // peuvent encore mentionner l'ancien nom — jamais un noeud de texte JSX.
  assert.doesNotMatch(src, />Mes échanges</, 'l\'ancien libellé ne doit plus apparaître comme texte affiché')
})

check('LocalCRM.jsx : les statuts affichés restent "En attente de réponse" / "Répondu" / "Information" (lisibles, inchangés)', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /waiting:\s*\{\s*label:\s*'En attente de réponse'/)
  assert.match(src, /replied:\s*\{\s*label:\s*'Répondu'/)
  assert.match(src, /no_response_required:\s*\{\s*label:\s*'Information'/)
})

check('LocalCRM.jsx : chaque carte de conversation affiche un expéditeur clair ("Vous" pour le client, "Équipe Oriafen" pour l\'équipe) — distingue enfin messages client vs réponses équipe', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /isFromClient\s*=\s*item\.senderType\s*===\s*'client'/)
  assert.match(src, /\{isFromClient \? 'Vous' : 'Équipe Oriafen'\}/)
})

// ================================================================
// 3. Notification admin sur soumission du brief brand kit — déjà câblé
//    dans marketingStore.js (submitBrandIntake -> addAdminNotification),
//    revérifié ici pour ne jamais régresser silencieusement.
// ================================================================
const { submitBrandIntake } = await import('./src/local/marketingStore.js')
const { getAdminNotifications } = await import('./src/local/adminNotificationsStore.js')

check('submitBrandIntake déclenche une notification admin visible et importante, avec le contexte pour ouvrir directement l\'onglet Marketing du bon client', () => {
  const clientId = 8101
  const before = getAdminNotifications().length
  submitBrandIntake(clientId, { brandName: 'Cabinet Notif Test', activity: 'Courtage', websiteGoal: 'Devis en ligne' }, 'Client Notif Test')
  const notifs = getAdminNotifications()
  assert.equal(notifs.length, before + 1, 'une seule notification admin par soumission')
  const notif = notifs[0]
  assert.equal(notif.type, 'marketing')
  assert.ok(notif.important, 'un brief brand kit soumis doit être marqué important côté admin')
  assert.match(notif.title, /Client Notif Test/)
  assert.equal(notif.context.tab, 'marketing')
  assert.equal(notif.context.clientId, clientId)
})

// ================================================================
// 4. Téléchargement du brief brand kit — vérification statique du
//    contenu généré (nom/email client + date + tous les champs attendus)
//    et du bouton visible dans la vue admin.
// ================================================================
check('LocalMarketing.jsx : le bouton admin "Télécharger le brief brand kit" existe et déclenche buildBrandIntakeText/downloadBrandIntake', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  assert.match(src, /⬇ Télécharger le brief brand kit/)
  assert.match(src, /onClick=\{\(\) => downloadBrandIntake\(intake, clientName, clientEmail\)\}/)
})

check('LocalMarketing.jsx : buildBrandIntakeText inclut le nom/email client, la date d\'envoi, et tous les champs demandés par l\'audit (logo, couleurs, Instagram, Facebook, Meta Business Manager, notes...)', () => {
  const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')
  const fnMatch = src.match(/function buildBrandIntakeText[\s\S]*?\n}\n/)
  assert.ok(fnMatch, 'buildBrandIntakeText doit exister')
  const body = fnMatch[0]
  for (const needle of [
    'Client : ${clientName', 'Email : ${clientEmail', 'Envoyé le : ${intake.submittedAt',
    'Marque / cabinet', 'Activité', 'Clientèle cible', 'Offres à mettre en avant', 'Ton / style',
    'Logo :', 'Couleurs choisies', 'Objectif du site web',
    'Instagram :', 'Facebook :', 'Meta Business Manager / Ads Manager :', 'Notes complémentaires',
  ]) {
    assert.ok(body.includes(needle), `buildBrandIntakeText doit inclure "${needle}"`)
  }
})

check('LocalAdminShell.jsx : l\'onglet Marketing transmet la liste des clients convertis (avec name/email) et le client par défaut à AdminMarketingPanel, pour que le fichier téléchargé identifie le bon client quel que soit celui sélectionné', () => {
  const src = readFileSync('./src/local/LocalAdminShell.jsx', 'utf8')
  assert.match(src, /AdminMarketingPanel clients=\{clientRows\.map\(r => \(\{ id: r\.id, name: r\.name, email: r\.email \}\)\)\} defaultClientId=\{latestClientPreview\?\.id/)
})

// ================================================================
// 5. Onglet Finance V2 local — dérivé uniquement des paiements locaux
//    (leads convertis, payments[].status paid/pending), jamais de la
//    logique Finance live. On revalide ici le CONTRAT de données
//    (applyPaymentValidation -> lead.payments) que LocalFinanceSection.jsx
//    consomme, plus un contrôle statique de son câblage.
// ================================================================
const { applyPaymentValidation } = await import('./src/local/conversion.js')
const { LOCAL_PACKS } = await import('./src/local/packsData.js')

check('Le contrat de données Finance (lead.payments[].status paid/pending, premier versement payé à la conversion) est bien celui que consomme LocalFinanceSection.jsx', () => {
  const pack = LOCAL_PACKS.find(p => p.paymentType !== 'full') || LOCAL_PACKS[0]
  const lead = { id: 9101, name: 'Client Finance Test', email: 'finance@example.invalid', stage: 'Qualifié', paymentValidated: false, packId: pack.id, finalPrice: pack.priceTtc, activity: [] }
  const converted = applyPaymentValidation([lead], 9101)
  const client = converted.find(l => l.id === 9101)
  assert.equal(client.stage, 'Client')
  assert.ok(Array.isArray(client.payments) && client.payments.length > 0)
  assert.equal(client.payments[0].status, 'paid', 'le premier versement est payé dès la conversion')
  const totalPaid = client.payments.filter(p => p.status === 'paid').reduce((n, p) => n + p.amount, 0)
  const totalPending = client.payments.filter(p => p.status === 'pending').reduce((n, p) => n + p.amount, 0)
  assert.ok(totalPaid > 0)
  if (client.payments.length > 1) assert.ok(totalPending > 0, 'un pack à échéances doit laisser du "pending" tant que tout n\'est pas payé')
})

check('LocalFinanceSection.jsx : dérive uniquement les clients stage=Client && paymentValidated, jamais de repli sur des données de démo ou une logique Finance live/Supabase', () => {
  const src = readFileSync('./src/local/LocalFinanceSection.jsx', 'utf8')
  assert.match(src, /leads\.filter\(l => l\.stage === 'Client' && l\.paymentValidated\)/)
  assert.doesNotMatch(src, /from ['"]@supabase\/supabase-js['"]/)
  assert.doesNotMatch(src, /from ['"].*\/lib\/supabase['"]/)
  assert.match(src, /p\.status === 'paid'/)
})

check('LocalAdminShell.jsx : un onglet "Finance" existe dans la navigation admin et rend LocalFinanceSection avec les leads locaux réels', () => {
  const src = readFileSync('./src/local/LocalAdminShell.jsx', 'utf8')
  assert.match(src, /\{ id: 'finance',\s*label: 'Finance'/)
  assert.match(src, /activeTab === 'finance'.*<LocalFinanceSection leads=\{leads\}/)
})

console.log(`PASS (${passed} checks): Support renommé et plus lisible (expéditeur clair), notification admin sur brief brand kit, téléchargement du brief, onglet Finance V2 local dérivé des paiements réels.`)
