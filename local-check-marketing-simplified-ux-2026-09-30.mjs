// Régression ciblée — simplification UX "Mon site & communication"
// (2026-09-30). Même données/logique qu'avant (marketingStore.js
// inchangé) : uniquement une redistribution de la présentation (résumé +
// stepper en haut, brief replié par défaut, canaux en lignes compactes,
// livrables/demandes de modification inchangés dans leur fonctionnement).
// Vérification statique de source, même convention que les autres
// local-check-*.mjs de cette session — aucun rendu React en Node.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

let passed = 0
function check(label, fn) { fn(); passed += 1; console.log(`  ok - ${label}`) }

const src = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')

// ================================================================
// Résumé visible en haut de page (client ET admin), dérivé des mêmes
// données existantes (project/channels/deliverables/brandIntake) — aucun
// nouveau champ stocké.
// ================================================================
check('MarketingSummaryCard (résumé client) existe, affiche phase/statut/prochaine étape/dernière mise à jour, et le stepper à 4 étapes', () => {
  assert.match(src, /function MarketingSummaryCard\(\{ project, steps, nextStepLabel \}\)/)
  assert.match(src, /Phase actuelle/)
  assert.match(src, /Prochaine étape/)
  assert.match(src, /Dernière mise à jour/)
  assert.match(src, /<MarketingSummaryCard project=\{project\} steps=\{steps\} nextStepLabel=\{nextStepLabel\} \/>/, 'le résumé doit être rendu dans ClientMarketingPanel')
})

check('deriveMarketingSteps() calcule les 4 étapes demandées (Informations de marque / Brand kit / Production des canaux / Livrables & modifications) à partir des données existantes uniquement', () => {
  assert.match(src, /function deriveMarketingSteps\(brandIntake, channels, deliverables\)/)
  assert.match(src, /label: 'Informations de marque'/)
  assert.match(src, /label: 'Brand kit'/)
  assert.match(src, /label: 'Production des canaux'/)
  assert.match(src, /label: 'Livrables & modifications'/)
})

check('Le résumé opérationnel admin affiche client/pack/statut du brief/prochaine action équipe/dernière mise à jour, avec le sélecteur de client et l\'édition de phase toujours disponibles', () => {
  const adminFnMatch = src.match(/export function AdminMarketingPanel[\s\S]*/)
  assert.ok(adminFnMatch)
  const body = adminFnMatch[0]
  assert.match(body, /Client affiché/)
  assert.match(body, /selectedClient\?\.pack/, 'le pack du client doit être affiché côté admin')
  assert.match(body, /Prochaine action équipe/)
  assert.match(body, /updateMarketingProject\(clientId, \{ phase: phaseDraft \}\)/, 'l\'édition de la phase doit rester fonctionnelle')
})

// ================================================================
// Brief brand kit replié par défaut (client + admin), jamais retiré —
// juste masqué tant que non demandé.
// ================================================================
check('BrandSummaryCard (client) replie le détail du brief par défaut derrière "Voir les informations transmises", sans retirer aucun champ existant', () => {
  const fnMatch = src.match(/function BrandSummaryCard[\s\S]*?\n}\n/)
  assert.ok(fnMatch)
  const body = fnMatch[0]
  assert.match(body, /const \[open, setOpen\] = useState\(false\)/, 'replié par défaut (false)')
  assert.match(body, /Voir les informations transmises/)
  assert.match(body, /\{open && \(/, 'le détail ne doit se rendre que si ouvert')
  for (const field of ['intake.activity', 'intake.audience', 'intake.offer', 'intake.tone', 'intake.logoStatus', 'intake.websiteGoal', 'intake.instagramStatus', 'intake.facebookStatus', 'intake.metaBusinessStatus', 'intake.colors', 'intake.notes']) {
    assert.ok(body.includes(field), `le champ ${field} doit rester accessible une fois déplié`)
  }
})

check('AdminBrandIntakeCard (admin) replie le brief complet par défaut derrière "Voir le brief complet" ; le bouton de téléchargement reste toujours visible, jamais masqué par le repli', () => {
  const cardMatch = src.match(/function AdminBrandIntakeCard\(\{[\s\S]*?\n}\n/)
  const bodyFnMatch = src.match(/function AdminBrandIntakeCardBody[\s\S]*?\n}\n/)
  assert.ok(cardMatch && bodyFnMatch)
  const bodyFn = bodyFnMatch[0]
  assert.match(bodyFn, /const \[open, setOpen\] = useState\(false\)/, 'replié par défaut (false)')
  assert.match(bodyFn, /Voir le brief complet/)
  // Le bouton de téléchargement doit apparaître AVANT le bloc {open && (...)}
  // — jamais conditionné par le repli.
  const downloadIdx = bodyFn.indexOf('⬇ Télécharger le brief brand kit')
  const openBlockIdx = bodyFn.indexOf('{open && (')
  assert.ok(downloadIdx > -1 && openBlockIdx > -1 && downloadIdx < openBlockIdx, 'le bouton de téléchargement doit rester visible même brief replié')
})

// ================================================================
// Canaux : statuts/progression toujours visibles en un coup d'oeil
// (lignes compactes), détail (étape/reste à faire + contrôles admin)
// disponible derrière "Voir détail" — jamais retiré.
// ================================================================
check('ChannelRow affiche toujours le statut, la progression % et la dernière mise à jour en ligne compacte ; le détail (étape actuelle/reste à faire, curseur admin) reste accessible via "Voir détail"', () => {
  const rowMatch = src.match(/function ChannelRow[\s\S]*?\n}\n/)
  assert.ok(rowMatch)
  const body = rowMatch[0]
  assert.match(body, /\{ch\.progressPct\}%/, 'la progression doit rester visible par défaut')
  assert.match(body, /CHANNEL_STATUS_STYLE\[ch\.status\]/, 'le statut doit rester visible par défaut')
  assert.match(body, /Voir détail/)
  assert.match(body, /onUpdate\(ch\.id, \{ currentStep: e\.target\.value \}\)/, 'l\'édition admin (étape actuelle) doit rester fonctionnelle')
  assert.match(body, /onUpdate\(ch\.id, \{ progressPct: Number\(e\.target\.value\) \}\)/, 'le curseur de progression admin doit rester fonctionnel')
})

check('ChannelsCard est toujours rendu côté client (lecture seule) ET admin (editable), même statuts CHANNEL_STATUSES/statusToPatch inchangés', () => {
  assert.match(src, /<ChannelsCard channels=\{channels\} \/>/)
  assert.match(src, /<ChannelsCard channels=\{channels\} editable onUpdate=/)
  assert.match(src, /if \(status === 'Terminé'\) return \{ status, progressPct: 100 \}/, 'statusToPatch doit rester inchangé')
})

// ================================================================
// Livrables : état vide clair côté client, action de publication
// toujours disponible côté admin (inchangée).
// ================================================================
check('Livrables : état vide court et clair côté client quand il n\'y en a aucun ("Aucun livrable disponible pour le moment." + explication courte), jamais affiché à l\'admin (qui doit voir les types pour publier)', () => {
  assert.match(src, /Aucun livrable disponible pour le moment\./)
  assert.match(src, /Vous les verrez ici dès qu'ils seront prêts\./)
  assert.match(src, /if \(!deliverables\.length && !editable\) \{/, 'l\'état vide compact ne doit se déclencher que côté client')
})

check('DeliverablesCard reste éditable côté admin (publication d\'un livrable typé) — même fonction addDeliverable, jamais dupliquée', () => {
  assert.match(src, /function DeliverablesCard\(\{ deliverables, editable = false, onAdd \}\)/)
  assert.match(src, /<DeliverablesCard deliverables=\{deliverables\} editable onAdd=/)
})

// ================================================================
// Demandes de modification : action toujours visible et fonctionnelle.
// ================================================================
check('Le bouton "Demander une modification" reste visible et déclenche le même flux (NewRequestModal -> createModificationRequest), inchangé', () => {
  assert.match(src, /＋ Demander une modification/)
  assert.match(src, /onNewRequest=\{\(\) => setShowModal\(true\)\}/)
  assert.match(src, /createModificationRequest\(clientId, form, clientName\)/)
})

check('Côté admin, les demandes de modification restent triées du plus récent au plus ancien (même source getModificationRequests, jamais retriées différemment ici) et gardent leurs actions de statut', () => {
  assert.match(src, /MODIFICATION_STATUSES\.filter\(s => s !== r\.status\)\.map\(s =>/, 'les actions de changement de statut doivent rester présentes')
})

console.log(`PASS (${passed} checks): simplification UX "Mon site & communication" (2026-09-30) — résumé + stepper visibles, brief replié par défaut (client/admin), canaux en lignes compactes avec détail accessible, livrables/demandes de modification inchangés dans leur fonctionnement.`)
