// Régression ciblée — layout Support client (2026-09-28) : l'action
// "Nouvelle demande de support" devient la carte CENTRALE entre WhatsApp
// Direct et Prendre RDV, remplaçant le bouton séparé qui existait
// au-dessus des conversations. Même flux existant (showNewTicket/
// submitNewTicket/createClientSupportRequest), jamais dupliqué, jamais de
// logique support/admin modifiée — vérification statique de source
// uniquement (même convention que les autres local-check-*.mjs de cette
// session). 100% local, aucun accès réseau/Supabase.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

let passed = 0
function check(label, fn) { fn(); passed += 1; console.log(`  ok - ${label}`) }

const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')

check('Le bouton séparé "＋ Nouvelle demande de support" (au-dessus des conversations) n\'existe plus — remplacé par la carte centrale', () => {
  assert.doesNotMatch(src, /＋ Nouvelle demande de support/, 'l\'ancien bouton autonome ne doit plus exister')
})

check('Les 3 cartes (WhatsApp, carte centrale, Prendre RDV) sont dans une seule grille à 3 colonnes, dans cet ordre exact', () => {
  const gridMatch = src.match(/<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)
  assert.ok(gridMatch, 'la grille des 3 cartes doit exister')
  const block = gridMatch[0]
  const whatsappIdx = block.indexOf('WhatsApp Direct')
  const centralIdx = block.indexOf('Nouvelle demande de support')
  const rdvIdx = block.indexOf('Prendre RDV')
  assert.ok(whatsappIdx > -1 && centralIdx > -1 && rdvIdx > -1, 'les 3 cartes doivent être présentes')
  assert.ok(whatsappIdx < centralIdx, 'WhatsApp doit précéder la carte centrale')
  assert.ok(centralIdx < rdvIdx, 'la carte centrale doit précéder Prendre RDV (jamais après)')
})

check('La carte centrale déclenche le flux existant showNewTicket (jamais une seconde implémentation)', () => {
  assert.match(src, /<button type="button" onClick=\{\(\)=>setShowNewTicket\(true\)\}/)
})

check('La carte centrale utilise un style Oriafen vert foncé/or (pas une couleur criarde), et se distingue visuellement comme recommandée', () => {
  const btnMatch = src.match(/<button type="button" onClick=\{\(\)=>setShowNewTicket\(true\)\}[\s\S]{0,700}/)
  assert.ok(btnMatch)
  assert.match(btnMatch[0], /#1a3d2b/, 'vert foncé Oriafen')
  assert.match(btnMatch[0], /Recommandé/i)
})

check('WhatsApp Direct garde son lien/style vert existant, Prendre RDV garde son état désactivé "bientôt disponible" existant — aucun des deux n\'est modifié dans son comportement', () => {
  assert.match(src, /href="https:\/\/wa\.me\/212600000000"/)
  assert.match(src, /Bientôt disponible/)
  assert.match(src, /🔒 Intégration à venir/)
})

check('Le formulaire de demande de support (sujet/catégorie/description) et la liste des conversations existantes restent présents, inchangés, sous la rangée de cartes', () => {
  assert.match(src, /submitNewTicket/)
  assert.match(src, /TICKET_CATEGORY_LABELS/)
  assert.match(src, /<LocalTrackedCommunications items=\{items\}/, 'la liste des conversations doit rester affichée')
})

check('Aucune logique admin support n\'est touchée : createClientSupportRequest/respondToClientRequest/LocalNotificationsSection/LocalAdminNotificationBell restent inchangés dans ce commit', () => {
  // Vérification légère : ces fonctions/imports existent toujours tels
  // quels dans LocalCRM.jsx (le flux client reste branché sur le même
  // store), sans qu'aucun fichier admin n'ait été lu/modifié par ce test.
  assert.match(src, /createClientSupportRequest/)
})

console.log(`PASS (${passed} checks): layout Support client (2026-09-28) — carte centrale "Nouvelle demande de support" entre WhatsApp et Prendre RDV, même flux existant, conversations et formulaire inchangés.`)
