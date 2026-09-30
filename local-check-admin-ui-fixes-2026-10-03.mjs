// Régression ciblée — "Admin UI fixes: Clients, Marketing list, Dossier
// livret IAS1" (2026-10-03). Vérification statique de source pour les
// correctifs JSX (même convention que les autres local-check-*.mjs de
// cette session) + test fonctionnel réel pour la génération du livret
// IAS1 (un vrai fichier/Blob, jamais un faux succès). 100% local, aucun
// accès réseau/Supabase.

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
// URL.createObjectURL n'existe pas en Node — même convention que les
// autres tests de cette session pour les fonctions qui produisent un Blob
// téléchargeable (ex: downloadBrandIntake) : on fournit un polyfill minimal
// suffisant pour vérifier qu'un Blob réel est bien produit.
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = class Blob {
    constructor(parts, opts) { this.parts = parts; this.type = opts?.type; this.size = parts.reduce((n, p) => n + String(p).length, 0) }
  }
}
if (typeof globalThis.URL === 'undefined') globalThis.URL = {}
globalThis.URL.createObjectURL = (blob) => { globalThis.URL.__lastBlob = blob; return 'blob:local-test-url' }

let passed = 0
function check(label, fn) { fn(); passed += 1; console.log(`  ok - ${label}`) }

// ================================================================
// 1. Pack badge sur une seule ligne (Clients admin).
// ================================================================
check('LocalClientsOverview.jsx : le badge Pack utilise whitespace-nowrap (jamais de retour à la ligne "Pack" / "Essentiel")', () => {
  const src = readFileSync('./src/local/LocalClientsOverview.jsx', 'utf8')
  assert.match(src, /<span className="inline-block whitespace-nowrap px-2\.5 py-1 rounded-full text-xs font-semibold bg-orias-green\/10 text-orias-green border border-orias-green\/20">\{client\.pack\}<\/span>/)
})

// ================================================================
// 2. Icônes d'action Clients : Voir/Modifier/Message/WhatsApp restaurées.
// ================================================================
check('LocalClientsOverview.jsx : la colonne Actions du tableau Clients affiche Voir (EyeIcon), Modifier (EditIcon), Message (MessageIcon) et WhatsApp (WhatsAppIcon)', () => {
  const src = readFileSync('./src/local/LocalClientsOverview.jsx', 'utf8')
  const actionsCellMatch = src.match(/<td className="px-5 py-4">\s*\{\/\* Correctif "icônes d'action[\s\S]*?<\/td>/)
  assert.ok(actionsCellMatch, 'la cellule Actions doit exister')
  const cell = actionsCellMatch[0]
  assert.match(cell, /title="Voir"/)
  assert.match(cell, /<EyeIcon /)
  assert.match(cell, /title="Modifier"/)
  assert.match(cell, /<EditIcon /)
  assert.match(cell, /title="Message \/ Support"/)
  assert.match(cell, /<MessageIcon /)
  assert.match(cell, /title="WhatsApp"/)
  assert.match(cell, /<WhatsAppIcon /)
})

// ================================================================
// 3. Bouton "＋ Ajouter un prospect" — réutilise le flux CRM existant.
// ================================================================
check('LocalClientsOverview.jsx : le bouton "＋ Ajouter un prospect" existe et délègue à onAddProspect (aucune logique de création dupliquée dans ce fichier)', () => {
  const src = readFileSync('./src/local/LocalClientsOverview.jsx', 'utf8')
  assert.match(src, /＋ Ajouter un prospect/)
  assert.match(src, /\{onAddProspect && \(/)
  assert.match(src, /<button onClick=\{onAddProspect\}/)
  assert.doesNotMatch(src, /function NewProspectModal/, 'aucune 2e implémentation du formulaire de création ne doit exister dans ce fichier')
})

check('LocalAdminShell.jsx : onAddProspect bascule sur l\'onglet CRM et déclenche la MÊME modale de création (autoOpenCreateRequest -> LocalCRM.jsx), jamais un second flux', () => {
  const shellSrc = readFileSync('./src/local/LocalAdminShell.jsx', 'utf8')
  assert.match(shellSrc, /const openCrmCreateProspect = \(\) => \{/)
  assert.match(shellSrc, /setCrmCreateRequest\(\{ ts: Date\.now\(\) \}\)/)
  assert.match(shellSrc, /setActiveTab\('crm'\)/)
  assert.match(shellSrc, /onAddProspect=\{openCrmCreateProspect\}/)
  assert.match(shellSrc, /autoOpenCreateRequest=\{crmCreateRequest\}/)
  const crmSrc = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(crmSrc, /useEffect\(\(\)=>\{if\(autoOpenCreateRequest\)setCreating\(true\)\},\[autoOpenCreateRequest\]\);/, 'doit réutiliser exactement le state "creating"/NewProspectModal déjà existant')
})

// ================================================================
// 4/5/6. Marketing admin : liste d'abord, détail seulement après "Voir",
// bouton "Retour à la liste".
// ================================================================
const marketingSrc = readFileSync('./src/local/LocalMarketing.jsx', 'utf8')

check('LocalMarketing.jsx : AdminMarketingPanel affiche la LISTE des clients par défaut (aucun client présélectionné automatiquement, jamais de brief/détail direct)', () => {
  assert.match(marketingSrc, /const \[selectedClientId, setSelectedClientId\] = useState\(null\)/, 'aucun client sélectionné par défaut — la vue liste doit s\'afficher en premier')
  assert.match(marketingSrc, /if \(clientId == null \|\| !project\) \{\s*return <MarketingClientListView/, 'sans sélection, la liste doit être rendue, jamais le détail')
})

check('LocalMarketing.jsx : MarketingClientListView affiche Client, Pack, Brief, Site web, Instagram, Facebook, Meta Ads, Dernière mise à jour et une action "Voir" par ligne', () => {
  const listMatch = marketingSrc.match(/function MarketingClientListView[\s\S]*?\n}\n/)
  assert.ok(listMatch)
  const body = listMatch[0]
  for (const col of ['Client', 'Pack', 'Brief', 'Site web', 'Instagram', 'Facebook', 'Meta Ads', 'Dernière mise à jour', 'Action']) {
    assert.ok(body.includes(`>${col}<`), `la colonne "${col}" doit être affichée`)
  }
  const rowMatch = marketingSrc.match(/function MarketingClientListRow[\s\S]*?\n}\n/)
  assert.ok(rowMatch)
  assert.match(rowMatch[0], /<button onClick=\{\(\) => onView\(client\.id\)\} className="btn-outline-green text-xs">Voir<\/button>/)
})

check('LocalMarketing.jsx : cliquer "Voir" ouvre le détail (résumé/brief/canaux/demandes déjà existants), et "← Retour à la liste" revient à la liste', () => {
  assert.match(marketingSrc, /<MarketingClientListView clients=\{clients\} onView=\{setSelectedClientId\} \/>/, '"Voir" doit ouvrir le détail via setSelectedClientId')
  assert.match(marketingSrc, /← Retour à la liste/)
  assert.match(marketingSrc, /onClick=\{\(\) => setSelectedClientId\(null\)\}[\s\S]{0,200}← Retour à la liste/, 'le bouton retour doit ramener à la liste (selectedClientId=null)')
  // Le détail garde bien le brief (collapsé), les canaux et les demandes de
  // modification déjà présents — rien retiré, juste réorganisé derrière "Voir".
  assert.match(marketingSrc, /<AdminBrandIntakeCard intake=\{brandIntake\}/)
  assert.match(marketingSrc, /<ChannelsCard channels=\{channels\} editable/)
  assert.match(marketingSrc, /Demandes de modification client/)
})

check('LocalMarketing.jsx : le téléchargement/export du brief reste disponible à l\'intérieur du détail (inchangé)', () => {
  assert.match(marketingSrc, /⬇ Télécharger le brief brand kit/)
})

// ================================================================
// 7. La section Livrables reste masquée côté admin (retiré précédemment,
// 2026-10-02) — non réintroduite par cette passe.
// ================================================================
check('LocalMarketing.jsx : AdminMarketingPanel ne rend toujours pas <DeliverablesCard> (masqué précédemment, 2026-10-02) — non réintroduit ici', () => {
  const adminFnMatch = marketingSrc.match(/export function AdminMarketingPanel[\s\S]*/)
  assert.ok(adminFnMatch)
  assert.doesNotMatch(adminFnMatch[0], /<DeliverablesCard/, 'AdminMarketingPanel ne doit toujours pas rendre DeliverablesCard')
})

// ================================================================
// 8. Génération réelle du livret IAS1 — vrai Blob/fichier téléchargeable,
// jamais un faux succès sans artefact.
// ================================================================
const { generateIas1Livret, buildIas1LivretHtml } = await import('./src/local/ias1LivretGenerator.js')
const { getAdminNotifications } = await import('./src/local/adminNotificationsStore.js')
const { getActivityLog } = await import('./src/local/activityLog.js')

check('buildIas1LivretHtml() produit un document HTML réel incluant nom/email/pack/numéro de dossier/progression formation/date de génération et le branding Oriafen', () => {
  const html = buildIas1LivretHtml({ clientId: 77001, clientName: 'Client Test Livret', clientEmail: 'livret@example.invalid', pack: 'Pack Essentiel' })
  assert.ok(html.startsWith('<!DOCTYPE html>'))
  assert.match(html, /ORIAFEN ACADEMY/)
  assert.match(html, /Client Test Livret/)
  assert.match(html, /livret@example\.invalid/)
  assert.match(html, /Pack Essentiel/)
  assert.match(html, /Numéro de dossier/)
  assert.match(html, /Progression formation IAS1/)
  assert.match(html, /Document généré le/)
})

check('generateIas1Livret() renvoie un vrai artefact téléchargeable (fileName .html + url Blob réel), jamais un faux succès sans fichier', () => {
  const before = getActivityLog(77002).length
  const result = generateIas1Livret({ clientId: 77002, clientName: 'Autre Client', clientEmail: 'autre@example.invalid', pack: 'Pack Croissance' })
  assert.ok(result.fileName.endsWith('.html'), 'le nom de fichier doit être un .html valide (première implémentation, comme prévu par la tâche)')
  assert.ok(result.fileName.includes('livret-ias1'))
  assert.equal(result.url, 'blob:local-test-url', 'doit provenir d\'un vrai URL.createObjectURL(Blob), jamais une chaîne inventée')
  assert.ok(result.generatedAt, 'un horodatage de génération doit être renvoyé')
  assert.ok(result.html.length > 200, 'le contenu HTML réel doit être renvoyé, pas juste une promesse de contenu')
  const log = getActivityLog(77002)
  assert.equal(log.length, before + 1, 'la génération doit être journalisée dans l\'historique 360° du client (architecture existante réutilisée)')
  assert.ok(log.some(e => e.action === 'Livret IAS1 généré' && e.detail === result.fileName))
})

check('LocalDossierSection.jsx : le bouton "Générer automatiquement le livret IAS1" est branché sur generateIas1Livret() et affiche un résultat réel (nom de fichier, horodatage, téléchargement/ouverture)', () => {
  const src = readFileSync('./src/local/LocalDossierSection.jsx', 'utf8')
  assert.match(src, /import \{ generateIas1Livret \} from '\.\/ias1LivretGenerator'/)
  assert.match(src, /✨ Générer automatiquement le livret IAS1/)
  assert.match(src, /onClick=\{handleGenerateLivret\}/)
  assert.match(src, /<a href=\{livretResult\.url\} download=\{livretResult\.fileName\}/, 'un vrai lien de téléchargement doit être proposé')
  assert.match(src, /\{livretResult\.fileName\}/)
  assert.match(src, /\{livretResult\.generatedAt\}/)
})

console.log(`PASS (${passed} checks): correctifs admin UI (2026-10-03) — badge Pack sur une ligne, icônes d'action Clients restaurées, bouton d'ajout réutilisant le flux CRM existant, Marketing admin liste-d'abord avec retour, Livrables toujours masqué côté admin, génération réelle du livret IAS1 (fichier .html téléchargeable + journalisation).`)
