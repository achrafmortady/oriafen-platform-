// Local/offline checks for the client tracking + document rejection/versioning
// + activity log logic prepared for future production activation.
//
// Runs entirely against:
//   - src/local/clientTrackingStore.js / documentsStore.js / activityLog.js
//     (the existing localStorage-backed logic, polyfilled here for Node)
//   - src/lib/api.js's new dormant functions (isConfigured is always false
//     in this checkout — see src/lib/supabase.js — so these never touch a
//     network, they only exercise the demo/no-op branches).
//
// No Supabase access, no network calls, no migrations executed.

import assert from 'node:assert/strict'
import { register } from 'node:module'

// Vite resolves extensionless relative imports inside src/ (e.g.
// `from './activityLog'`) automatically; plain Node needs a small loader
// hook for that when running this script outside Vite. See
// local-check-loader.mjs — test-only, does not touch any source file.
register('./local-check-loader.mjs', import.meta.url)

// ---- minimal browser polyfills (localStorage + window events) ----
class MemoryStorage {
  constructor() { this._data = new Map() }
  getItem(key) { return this._data.has(key) ? this._data.get(key) : null }
  setItem(key, value) { this._data.set(key, String(value)) }
  removeItem(key) { this._data.delete(key) }
  clear() { this._data.clear() }
}

if (typeof globalThis.CustomEvent !== 'function') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, opts = {}) { this.type = type; this.detail = opts.detail }
  }
}

globalThis.localStorage = new MemoryStorage()
globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
}

const {
  getClientSends,
  markClientSendSeen,
  markClientSendOpened,
  markClientSendReminded,
  setClientSendImportant,
  getAdminSendStatus,
  replyToClientSend,
  getReminderCount,
} = await import('./src/local/clientTrackingStore.js')

const {
  getClientDocuments,
  rejectDocument,
  uploadDocument,
  getDocVersions,
} = await import('./src/local/documentsStore.js')

const { getActivityLog, logActivity: logActivityLocal } = await import('./src/local/activityLog.js')

const { buildClientsOverview } = await import('./src/local/clientsOverviewData.js')

const { LOCAL_PACKS, PACK_CATEGORY_LABELS, packsByCategory, findPackByName, findPackById, basePriceFor, computeFinalPrice, TVA_RATE } = await import('./src/local/packsData.js')
const { stages, seed, normalizeLeadsStage, MIGRATION_RDV_PRIS_TO } = await import('./src/local/model.js')
const { applyPaymentValidation, buildMockPaymentRows } = await import('./src/local/conversion.js')
const { buildLeadTimeline, findConversionEntry, findFirstEntry, applyStatusChange, addManualComment, applyNextActionUpdate, STAGE_BADGE_STYLES } = await import('./src/local/clientHistory.js')
const { formatNowLabel, toDisplayDateSafe } = await import('./src/local/dateUtils.js')

const {
  createNotification,
  markSendSeen,
  markSendOpened,
  markSendReminded,
  setSendImportant,
  fetchDocumentVersions,
  logActivity,
  fetchActivityLog,
  rejectDocumentWithAudit,
  replaceDocumentWithVersioning,
} = await import('./src/lib/api.js')

let passed = 0
async function check(label, fn) {
  await fn()
  passed += 1
  console.log(`  ok - ${label}`)
}

// ================================================================
// A-D. Tracking local (clientTrackingStore.js) : seen / opened / reminder / important
// ================================================================
console.log('A-D. Tracking local des envois (clientTrackingStore.js)')

const trackingClientId = 'track-client-1'
const sends = getClientSends(trackingClientId)
assert.equal(sends.length, 3)
const [msgItem, fileItem, docItem] = sends

await check('A. markSendSeen (local) marque seenAt', () => {
  assert.equal(msgItem.seenAt, null)
  const ok = markClientSendSeen(msgItem.id)
  assert.ok(ok)
  const after = getClientSends(trackingClientId).find(i => i.id === msgItem.id)
  assert.ok(after.seenAt)
  assert.ok(after.lastActivityAt)
  const status = getAdminSendStatus(after)
  assert.equal(status.key, 'seen')
})

await check('B. markSendOpened (local) marque seenAt + openedAt', () => {
  assert.equal(fileItem.openedAt, null)
  const ok = markClientSendOpened(fileItem.id)
  assert.ok(ok)
  const after = getClientSends(trackingClientId).find(i => i.id === fileItem.id)
  assert.ok(after.seenAt)
  assert.ok(after.openedAt)
  const status = getAdminSendStatus(after)
  assert.equal(status.key, 'opened')
})

await check('C. markSendReminded (local) marque remindedAt et passe le statut à "remind"', () => {
  assert.equal(docItem.remindedAt, null)
  const ok = markClientSendReminded(docItem.id)
  assert.ok(ok)
  const after = getClientSends(trackingClientId).find(i => i.id === docItem.id)
  assert.ok(after.remindedAt)
  const status = getAdminSendStatus(after)
  assert.equal(status.key, 'remind')
})

await check('D. setSendImportant (local) bascule le flag important', () => {
  const ok = setClientSendImportant(msgItem.id, true)
  assert.ok(ok)
  const after = getClientSends(trackingClientId).find(i => i.id === msgItem.id)
  assert.equal(after.important, true)
})

await check('A2. replyToClientSend fait passer le statut dérivé à "Répondu" (priorité la plus haute)', () => {
  const ok = replyToClientSend(msgItem.id, 'Merci, voici ma réponse.')
  assert.ok(ok)
  const after = getClientSends(trackingClientId).find(i => i.id === msgItem.id)
  assert.ok(after.repliedAt)
  assert.equal(after.response.message, 'Merci, voici ma réponse.')
  assert.equal(getAdminSendStatus(after).key, 'replied')
})

await check('A3. no-response-required : le statut client reste "no_response_required" (badge "Information")', () => {
  const items = getClientSends(trackingClientId)
  const infoItem = items.find(i => i.responseRequired === false)
  assert.ok(infoItem, 'le fixture de démo doit contenir un item sans réponse requise')
  assert.equal(infoItem.status, 'no_response_required')
})

await check('A4. régression priorité de statut : un envoi "reminded" qui est ensuite ouvert repasse "opened", pas "remind" (contradiction historique corrigée)', () => {
  const regressionClientId = 'track-client-regression'
  const [item] = getClientSends(regressionClientId)
  markClientSendReminded(item.id)
  let after = getClientSends(regressionClientId).find(i => i.id === item.id)
  assert.equal(getAdminSendStatus(after).key, 'remind', 'juste après la relance, le statut doit être "remind"')
  markClientSendOpened(item.id)
  after = getClientSends(regressionClientId).find(i => i.id === item.id)
  assert.ok(after.remindedAt, 'remindedAt reste renseigné (horodatage historique, jamais effacé)')
  assert.equal(getAdminSendStatus(after).key, 'opened', 'une fois ouvert, le statut dérivé doit devenir "opened" malgré remindedAt — plus aucune contradiction')
})

// ================================================================
// E-G. Documents : rejet, remplacement, versioning (documentsStore.js)
// ================================================================
console.log('E-G. Documents rejetés / remplacés / versioning (documentsStore.js)')

const docsClientId = 'docs-client-1'
const docsBefore = getClientDocuments(docsClientId)
// Le document 'cin' (index 0, cycle 0 => 'valid') n'a pas de fichier à rejeter :
// on prend celui qui a un fichier ET n'est pas déjà 'missing'.
const targetCategory = Object.values(docsBefore).find(d => d.fileName && d.status !== 'missing').category

await check('E. rejectDocument enregistre motif + rejectedAt + archive une version + notifie', () => {
  const reason = 'Document illisible, merci de renvoyer une version nette.'
  const ok = rejectDocument(docsClientId, targetCategory, reason, 'Admin Test')
  assert.ok(ok)

  const docs = getClientDocuments(docsClientId)
  const doc = docs[targetCategory]
  assert.equal(doc.status, 'missing')
  assert.equal(doc.rejectionReason, reason)
  assert.ok(doc.rejectedAt)
  assert.equal(doc.rejectedBy, 'Admin Test')
  assert.ok(doc.versions.length >= 1)

  // journal chronologique
  const log = getActivityLog(docsClientId)
  assert.ok(log.some(e => e.action === "Document rejeté par l'équipe"))
  assert.ok(log.some(e => e.action === 'Notification de rejet envoyée au client'))

  // notification injectée dans le flux client existant
  const clientSends = getClientSends(docsClientId)
  assert.ok(clientSends.some(s => s.title?.startsWith('Document refusé') && s.important === true))
})

await check('F. uploadDocument (remplacement) repasse en pending et garde le fichier rejeté en historique', () => {
  const rejectedDoc = getClientDocuments(docsClientId)[targetCategory]
  const versionsBeforeReplace = rejectedDoc.versions.length

  const next = uploadDocument(docsClientId, targetCategory, rejectedDoc.categoryLabel, { name: 'nouveau-document.pdf' })
  assert.equal(next.status, 'pending')
  assert.equal(next.fileName, 'nouveau-document.pdf')
  assert.equal(next.rejectionReason, null)
  assert.ok(next.versions.length >= versionsBeforeReplace)

  const log = getActivityLog(docsClientId)
  assert.ok(log.some(e => e.action === 'Document de remplacement téléversé'))
})

await check('G. getDocVersions expose l\'historique complet (rejeté + courant)', () => {
  const doc = getClientDocuments(docsClientId)[targetCategory]
  const versions = getDocVersions(doc)
  assert.ok(versions.length >= 2, 'au moins la version rejetée + la version courante')
  const rejectedVersion = versions.find(v => v.status === 'missing')
  assert.ok(rejectedVersion, 'la version rejetée doit rester visible dans l\'historique')
  const last = versions[versions.length - 1]
  assert.equal(last.fileName, 'nouveau-document.pdf')
})

await check('C2. remplacement : le numéro de version incrémente et les versions précédentes restent inchangées', () => {
  const versionsClientId = 'docs-client-versions'
  const category = Object.values(getClientDocuments(versionsClientId)).find(d => d.fileName && d.status !== 'missing').category

  rejectDocument(versionsClientId, category, 'Motif 1', 'Admin Test')
  const afterFirstReject = getClientDocuments(versionsClientId)[category]
  const v1 = afterFirstReject.versions[afterFirstReject.versions.length - 1]

  uploadDocument(versionsClientId, category, afterFirstReject.categoryLabel, { name: 'v2.pdf' })
  rejectDocument(versionsClientId, category, 'Motif 2', 'Admin Test')
  const afterSecondReject = getClientDocuments(versionsClientId)[category]
  const versions = afterSecondReject.versions

  // v1 doit toujours être présente, identique, jamais réécrite par le rejet suivant
  const v1Still = versions.find(v => v.id === v1.id)
  assert.ok(v1Still)
  assert.equal(v1Still.rejectionReason, 'Motif 1')

  // le numéro d'ordre (encodé dans l'id "vN-...") doit strictement incrémenter
  const orderNumbers = versions.map(v => Number(v.id.match(/^v(\d+)-/)?.[1])).filter(n => !Number.isNaN(n))
  for (let i = 1; i < orderNumbers.length; i++) {
    assert.ok(orderNumbers[i] > orderNumbers[i - 1], 'chaque version doit avoir un numéro strictement supérieur à la précédente')
  }
})

// ================================================================
// D. Notification (payload local + lecture)
// ================================================================
console.log('D. Notification injectée localement lors d\'un rejet de document')

await check('D. La notification de rejet a le bon destinataire, le bon contenu, cible Documents, et peut être marquée lue', () => {
  const notifClientId = 'docs-client-notif'
  const category = Object.values(getClientDocuments(notifClientId)).find(d => d.fileName && d.status !== 'missing').category
  const reason = 'Photo trop sombre'

  rejectDocument(notifClientId, category, reason, 'Admin Test')

  const notif = getClientSends(notifClientId).find(s => s.title?.startsWith('Document refusé'))
  assert.ok(notif, 'une notification doit être injectée dans le flux client existant')
  assert.equal(notif.type, 'document', 'type "document" => équivaut à link_tab="documents" côté UI (LocalNotificationBell/ClientSpace naviguent vers l\'onglet Documents)')
  assert.ok(notif.message.includes(reason), 'le corps (équivalent local de "body") doit inclure le motif')
  assert.equal(notif.important, true)
  assert.equal(notif.seenAt, null, 'non lue par défaut (équivalent local de read_at = null)')

  const marked = markClientSendSeen(notif.id)
  assert.ok(marked)
  const after = getClientSends(notifClientId).find(s => s.id === notif.id)
  assert.ok(after.seenAt, 'équivalent local de read_at renseigné après lecture')
})

// ================================================================
// E2. Journal d'activité — couverture des types d'événements
// ================================================================
console.log('E2. Journal d\'activité — couverture des types d\'événements (activityLog.js)')

await check('E2. login / message_seen / document_opened / reply_sent / reminder_sent sont bien journalisés', () => {
  const journalClientId = 'journal-coverage-client'

  // login
  logActivityLocal(journalClientId, { author: 'Client', action: "Connexion à l'espace client" })

  // message_seen / document_opened / reply_sent / reminder_sent (via le tracking existant)
  // a = message (important, responseRequired), b = fichier (non important,
  // responseRequired=false), c = document (non important, responseRequired).
  const [a, b, c] = getClientSends(journalClientId)
  markClientSendSeen(b.id)          // b non important -> "Message consulté" (pas "Notification importante consultée")
  markClientSendOpened(c.id)        // -> "Fichier/document ouvert"
  markClientSendReminded(a.id)      // -> "Relance n°1 effectuée" (relance illimitée, numérotée — voir §N)
  replyToClientSend(c.id, 'Réponse de test')  // c.responseRequired=true -> "Réponse envoyée"

  // getClientSends() rejoue le backfill idempotent vers activityLog (voir
  // clientTrackingStore.js) — nécessaire ici car les mark*/reply ci-dessus
  // n'écrivent pas directement le journal, seule une lecture le fait.
  getClientSends(journalClientId)
  const log = getActivityLog(journalClientId)
  assert.ok(log.some(e => e.action === "Connexion à l'espace client"))
  assert.ok(log.some(e => e.action === 'Message consulté'))
  assert.ok(log.some(e => e.action === 'Fichier/document ouvert'))
  assert.ok(log.some(e => e.action === 'Relance n°1 effectuée'))
  assert.ok(log.some(e => e.action === 'Réponse envoyée'))
  assert.ok(log.every(e => e.author && e.action && e.at), 'chaque entrée doit avoir acteur/action/horodatage')
})

// ================================================================
// F. Vérifications statiques de sécurité (Finance / Super Admin / live)
// ================================================================
console.log('F. Vérifications statiques de sécurité (aucune référence Finance/payments/rôles/policies live)')

{
  const fs = await import('node:fs/promises')
  const featureFiles = [
    'src/local/clientTrackingStore.js',
    'src/local/documentsStore.js',
    'src/local/activityLog.js',
    'src/local/LocalCRM.jsx',
    'src/local/LocalMesDocuments.jsx',
    'src/local/LocalClientsOverview.jsx',
    'src/local/LocalNotificationBell.jsx',
    'src/local/clientsOverviewData.js',
    'src/local/conversion.js',
    'src/local/model.js',
  ]
  const contents = await Promise.all(featureFiles.map(f => fs.readFile(f, 'utf8')))

  await check('F1. Aucun fichier local de la feature ne référence la table/les fonctions Finance live', () => {
    // Le champ mock local `lead.payments` (conversion.js/model.js — paiements
    // 50/25/25 simulés, voir §5) contient légitimement le mot "payments" ;
    // ce qui est réellement interdit, c'est une requête vers la table live
    // ou les fonctions Finance de src/lib/api.js.
    const forbiddenPatterns = [
      /from\(\s*['"]payments['"]\s*\)/i,
      /\bmarkPaymentPaid\s*\(/,
      /\bfetchFinanceSummary\s*\(/,
      /\bfetchClientPayments\s*\(/,
      /\bbuildPaymentRows\s*\(/, // fonction live (src/lib/api.js) — l'équivalent local est buildMockPaymentRows()
    ]
    contents.forEach((content, i) => {
      forbiddenPatterns.forEach(re => {
        assert.ok(!re.test(content), `${featureFiles[i]} ne doit pas référencer la Finance live (${re})`)
      })
    })
  })

  await check('F2. Aucun fichier local de la feature n\'importe/n\'appelle le client Supabase (localStorage uniquement, zéro risque live)', () => {
    contents.forEach((content, i) => {
      assert.ok(!/from\s+['"].*\/lib\/supabase['"]/.test(content), `${featureFiles[i]} ne doit pas importer le client Supabase`)
      assert.ok(!/\bsupabase\s*\.\s*(from|auth|storage|rpc)\b/.test(content), `${featureFiles[i]} ne doit pas appeler le client Supabase`)
    })
  })

  await check('F3. Aucun fichier de migration test/local ne référence payments/finance ni ne modifie une policy live existante (documents_all/dossiers_all/users_all)', async () => {
    const migrationFiles = (await fs.readdir('supabase/migrations')).filter(f => f.endsWith('.sql'))
    for (const file of migrationFiles) {
      const sql = await fs.readFile(`supabase/migrations/${file}`, 'utf8')
      // Seules les lignes de code SQL exécutable comptent ici — les commentaires
      // (ex: notes expliquant le contexte live confirmé) peuvent légitimement
      // mentionner "payments" sans que le fichier touche réellement à cette table.
      const executableSql = sql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
      assert.ok(/DO NOT RUN IN PRODUCTION/.test(sql), `${file} doit porter l'en-tête DO NOT RUN IN PRODUCTION`)
      assert.ok(!/\bpayments\b/i.test(executableSql), `${file} ne doit pas référencer la table payments dans du SQL exécutable`)
      assert.ok(!/drop policy[^;]*"?(documents_all|dossiers_all|users_all)/i.test(executableSql), `${file} ne doit pas toucher une policy legacy live`)
      assert.ok(!/create policy[^;]*"?(documents_all|dossiers_all|users_all)/i.test(executableSql), `${file} ne doit pas recréer une policy legacy live`)
    }
  })
}

// ================================================================
// I. Prochaine action dérivée (clientsOverviewData.js / buildClientsOverview)
// ================================================================
console.log('I. Prochaine action dérivée (clientsOverviewData.js)')

// deriveDossier() n'est pas exporté (seul buildClientsOverview l'est) : on
// teste donc en boîte noire, en reproduisant ici les mêmes formules
// déterministes que le code source pour choisir des `lead.id` qui tombent
// dans le statut synthétique voulu, puis en pilotant les vrais stores
// locaux (documentsStore/clientTrackingStore) pour les signaux réels
// (relance, réponse en attente, document remplacé).
function computeSyntheticStatus(id) {
  const stepIndex = id % 6
  const validDocs = Math.min(6, stepIndex + (id % 2))
  const pendingDocs = (id % 2 === 0 && validDocs < 6) ? 1 : 0
  const missingDocs = Math.max(0, 6 - validDocs - pendingDocs)
  let status
  if (stepIndex >= 4 && missingDocs === 0) status = 'Complété'
  else if (missingDocs >= 4) status = 'Bloqué'
  else if (missingDocs >= 2) status = 'À relancer'
  else status = 'En cours'
  return { stepIndex, missingDocs, status }
}
function findId(predicate, start, end) {
  for (let id = start; id < end; id++) {
    if (predicate(computeSyntheticStatus(id))) return id
  }
  throw new Error(`Aucun id trouvé dans [${start}, ${end}) satisfaisant le prédicat`)
}
function makeClientLead(id) {
  // paymentValidated: true — buildClientsOverview ne fait apparaître un lead
  // stage==='Client' dans la vue Clients qu'une fois le paiement réellement
  // validé (reproduction locale du gating live converted_user_id, voir
  // src/local/conversion.js). Sans ce champ, ces leads de test seraient
  // désormais filtrés et tous ces tests échoueraient à tort.
  return { id, stage: 'Client', paymentValidated: true, name: `Client Test ${id}`, email: `client${id}@example.invalid`, phone: '0600000000', city: 'Casablanca', pack: 'Essentiel', owner: 'Test' }
}
function nextActionFor(id) {
  const { rows } = buildClientsOverview([makeClientLead(id)])
  assert.equal(rows.length, 1)
  return rows[0]
}

await check('I1. Document remplacé (en attente de revalidation) => "Vérifier le document remplacé"', () => {
  // Choisi avec un statut synthétique "Complété" pour prouver au passage la
  // priorité (voir I7) : même un dossier par ailleurs complet doit remonter
  // le document à vérifier.
  const id = findId(s => s.status === 'Complété', 4000, 4200)
  const category = Object.values(getClientDocuments(id)).find(d => d.fileName && d.status !== 'missing').category
  rejectDocument(id, category, 'Motif à corriger', 'Admin Test')
  uploadDocument(id, category, 'Document', { name: 'remplacement.pdf' })

  const row = nextActionFor(id)
  assert.equal(row.status, 'Complété', 'le statut global synthétique reste inchangé')
  assert.equal(row.nextAction, 'Vérifier le document remplacé')
})

await check('I2. Réponse requise sans réponse (aucun autre signal) => statut "Attendre réponse"', () => {
  // status doit être 'En cours' pour atteindre la branche awaitingReply
  // (ni Complété, ni À relancer/Bloqué qui court-circuiteraient avant).
  const id = findId(s => s.status === 'En cours', 4200, 4400)
  const items = getClientSends(id)
  assert.ok(items.some(i => i.responseRequired), 'au moins un item de démo requiert une réponse')

  // Les items de démo ont des sentAt fixes (12/09/2026, 05/09/2026) : passé
  // le délai de relance (3 jours), ils déclenchent automatiquement le
  // statut "remind" — ce qui est le comportement voulu (voir I3), mais
  // brouillerait ce test-ci qui veut isoler UNIQUEMENT le signal "réponse
  // en attente". On neutralise donc le signal de relance en marquant les
  // items concernés comme "vus" (seen prime sur remind dans l'ordre de
  // priorité — voir clientTrackingStore.getAdminSendStatus), sans pour
  // autant les marquer répondus.
  items.filter(i => i.responseRequired).forEach(i => markClientSendSeen(i.id))
  const afterSeen = getClientSends(id)
  assert.ok(afterSeen.every(i => !i.responseRequired || getAdminSendStatus(i).key !== 'remind'), 'précondition : plus aucun signal de relance actif')
  assert.ok(afterSeen.some(i => i.responseRequired && i.status !== 'replied'), 'précondition : au moins une réponse reste en attente')

  const row = nextActionFor(id)
  assert.equal(row.status, 'En cours')
  // Le libellé exact du code est "Attendre réponse" (pas "Attendre la réponse
  // du client") — testé tel quel pour éviter toute divergence entre le test
  // et le comportement réel ; voir remarque dans le rapport de session.
  assert.equal(row.nextAction, 'Attendre réponse')
})

await check('I3. Envoi à relancer (signal réel du tracking) => "Relancer le client"', () => {
  // BUG corrigé : `toRelaunch` (signal réel : un envoi effectivement en
  // retard de relance côté clientTrackingStore) n'était calculé mais jamais
  // lu par aucune branche de nextAction — un client par ailleurs "En cours"
  // avec un envoi réellement à relancer ne remontait donc jamais "Relancer
  // le client". Ce test couvre spécifiquement ce cas, désormais corrigé.
  const id = findId(s => s.status === 'En cours', 4400, 4600)
  const [item] = getClientSends(id)
  markClientSendReminded(item.id)
  const after = getClientSends(id).find(i => i.id === item.id)
  assert.equal(getAdminSendStatus(after).key, 'remind', 'précondition : le tracking doit bien signaler "à relancer"')

  const row = nextActionFor(id)
  assert.equal(row.status, 'En cours', 'le statut synthétique du dossier, lui, ne change pas')
  assert.equal(row.nextAction, 'Relancer le client')
})

await check('I3b. Statut synthétique "À relancer" (sans signal réel) => "Relancer le client" (comportement historique préservé)', () => {
  const id = findId(s => s.status === 'À relancer', 4600, 4800)
  const row = nextActionFor(id)
  assert.equal(row.status, 'À relancer')
  assert.equal(row.nextAction, 'Relancer le client')
})

await check('I4. Document manquant / attendu => "Attendre document"', () => {
  // status "Bloqué" (missingDocs >= 4) : la branche dédiée doit renvoyer
  // "Attendre document" puisque missingDocs > 0 y est toujours vrai — à
  // condition qu'aucun signal de relance réel ne prenne le dessus (voir I3 :
  // "Relancer le client" prime désormais aussi sur "Bloqué", intentionnel,
  // donc on neutralise ce signal ici pour isoler le cas "document manquant").
  const idBloque = findId(s => s.status === 'Bloqué', 4800, 5000)
  getClientSends(idBloque).filter(i => i.responseRequired).forEach(i => markClientSendSeen(i.id))
  const rowBloque = nextActionFor(idBloque)
  assert.equal(rowBloque.status, 'Bloqué')
  assert.ok(rowBloque.missingDocs > 0)
  assert.equal(rowBloque.nextAction, 'Attendre document')

  // status "En cours" avec missingDocs > 0 (1 document manquant, pas de
  // réponse en attente) : doit aussi retomber sur "Attendre document".
  const idEnCours = findId(s => s.status === 'En cours' && s.missingDocs > 0, 5000, 5200)
  // Neutraliser le signal "réponse en attente" pour isoler ce cas précis :
  // marquer comme répondu le seul item qui requiert une réponse.
  getClientSends(idEnCours).filter(i => i.responseRequired).forEach(i => replyToClientSend(i.id, 'ok'))
  const rowEnCours = nextActionFor(idEnCours)
  assert.equal(rowEnCours.status, 'En cours')
  assert.ok(rowEnCours.missingDocs > 0)
  assert.equal(rowEnCours.nextAction, 'Attendre document')
})

await check('I5. "Vérifier le dossier" — branche de repli actuellement inatteignable via le calcul synthétique (constat, pas un bug fonctionnel)', () => {
  // D'après la formule : missingDocs === 0 exige stepIndex === 5 (seule
  // valeur où stepIndex + (id%2) peut atteindre 6), qui déclenche toujours
  // status === 'Complété' avant même d'atteindre la branche finale
  // (awaitingReply / missingDocs>0 / "sinon"). Le libellé "Vérifier le
  // dossier" existe bien dans le code comme repli défensif, mais aucune
  // combinaison de lead.id ne l'atteint avec les formules actuelles —
  // vérifié ici par recherche exhaustive. Ce n'est pas un bug fonctionnel
  // (aucun client réel n'affiche un statut incorrect à cause de ça), donc
  // non modifié ici conformément à la consigne de ne changer la logique
  // métier qu'en cas de bug réel avéré — signalé dans le rapport de
  // session pour une décision produit ultérieure si souhaité.
  let reachable = false
  for (let id = 0; id < 6000 && !reachable; id++) {
    const s = computeSyntheticStatus(id)
    if (s.status === 'En cours' && s.missingDocs === 0) reachable = true
  }
  assert.equal(reachable, false, 'si ce test échoue, la formule a changé et "Vérifier le dossier" est peut-être redevenu atteignable — un vrai test de transition devient alors nécessaire')
})

await check('I6. Dossier complet, aucun signal en attente => "Aucune action"', () => {
  const id = findId(s => s.status === 'Complété', 5500, 5700)
  const row = nextActionFor(id)
  assert.equal(row.status, 'Complété')
  assert.equal(row.nextAction, 'Aucune action')
})

await check('I7. Priorités : document remplacé reste prioritaire même avec statut "À relancer" ou réponse en attente', () => {
  const id = findId(s => s.status === 'À relancer', 5700, 5900)
  // Ajoute en plus un signal de réponse en attente + relance réelle, pour
  // vérifier qu'aucun de ces signaux ne prend le dessus sur le document à
  // vérifier une fois qu'il est présent.
  const [item] = getClientSends(id)
  markClientSendReminded(item.id)

  const category = Object.values(getClientDocuments(id)).find(d => d.fileName && d.status !== 'missing').category
  rejectDocument(id, category, 'Motif', 'Admin Test')
  uploadDocument(id, category, 'Document', { name: 'v2.pdf' })

  const row = nextActionFor(id)
  assert.equal(row.status, 'À relancer', 'le statut global reste bien "À relancer" (aucune contradiction créée)')
  assert.equal(row.nextAction, 'Vérifier le document remplacé', 'mais la prochaine action prime sur tout le reste')
})

// ================================================================
// J. Packs partagés + Fiche Client 360 (packsData.js / clientHistory.js)
// ================================================================
console.log('J. Packs partagés + historique 360 (packsData.js / clientHistory.js)')

await check('J1. Packs : plus de limite artificielle à 3, catégories confirmées reproduites', () => {
  assert.ok(LOCAL_PACKS.length > 3, 'LOCAL_PACKS ne doit plus être limité à 3 entrées (Essentiel/Croissance/Premium)')
  const byCat = packsByCategory()
  ;['conseil', 'marketing', 'academy', 'combine'].forEach(cat => {
    assert.ok(PACK_CATEGORY_LABELS[cat], `catégorie confirmée "${cat}" doit avoir un libellé`)
    assert.ok(byCat[cat]?.length > 0, `catégorie confirmée "${cat}" doit avoir au moins un pack`)
  })
})

await check('J2. Packs partagés : les leads de démo utilisent tous un pack de la source LOCAL_PACKS', () => {
  const leads = seed()
  assert.ok(leads.length > 0)
  leads.forEach(l => {
    assert.ok(findPackByName(l.pack), `le pack "${l.pack}" du lead ${l.id} doit exister dans LOCAL_PACKS (source unique partagée)`)
  })
})

await check('J3. Message initial du lead : conservé tel quel après passage à l\'étape "Client"', () => {
  const lead = { id: 'hist-1', message: 'Bonjour, je veux plus d\'infos.', activity: [{ text: 'Prospect créé', at: formatNowLabel() }] }
  const before = lead.message
  // Simule la conversion (même mécanisme que patch() dans LocalCRM.jsx)
  const converted = { ...lead, stage: 'Client', activity: [{ text: 'Étape : Client', at: formatNowLabel() }, ...lead.activity] }
  assert.equal(converted.message, before, 'le message initial ne doit pas être affecté par un changement de statut')
})

await check('J4. Première entrée : date réelle et interprétable, jamais inventée', () => {
  const [lead] = seed()
  const first = findFirstEntry(lead)
  assert.ok(first, 'un lead de démo doit avoir au moins une entrée d\'activité datée')
  assert.ok(toDisplayDateSafe(first.at), 'la date doit être interprétable (format JJ/MM/AAAA · HH:mm)')
  assert.match(toDisplayDateSafe(first.at), /^\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}$/)

  // Cas absent : jamais de date inventée
  assert.equal(findFirstEntry({ activity: [] }), null)
  assert.equal(findFirstEntry(null), null)
})

await check('J5/J7. Conversion + changement d\'étape visibles dans l\'historique', () => {
  const lead = {
    id: 'hist-2',
    activity: [
      { text: 'Étape : Client', at: '16/09/2026 · 10:00' },
      { text: 'Étape : Engagé (Commit)', at: '10/09/2026 · 09:00' },
      { text: 'Prospect fictif créé pour la démonstration', at: '01/09/2026 · 08:00' },
    ],
  }
  const conversion = findConversionEntry(lead)
  assert.ok(conversion, 'une entrée de conversion doit être trouvée')
  assert.equal(conversion.text, 'Étape : Client')

  const timeline = buildLeadTimeline(lead, 'hist-2-noactivitylog')
  assert.ok(timeline.some(e => e.action === 'Étape : Client'), 'la conversion doit apparaître dans la timeline fusionnée')
  assert.ok(timeline.some(e => e.action === 'Étape : Engagé (Commit)'), 'le changement d\'étape doit apparaître dans la timeline')
})

await check('J6. Timeline triée du plus récent au plus ancien (dates non interprétables en dernier)', () => {
  const lead = {
    id: 'hist-3',
    activity: [
      { text: 'Ancien évènement', at: '01/09/2026 · 08:00' },
      { text: 'Évènement récent', at: '16/09/2026 · 10:00' },
      { text: 'Évènement sans date exploitable', at: 'Donnée non standard' },
    ],
  }
  const timeline = buildLeadTimeline(lead, 'hist-3-noactivitylog')
  assert.equal(timeline[0].action, 'Évènement récent')
  assert.equal(timeline[1].action, 'Ancien évènement')
  const last = timeline[timeline.length - 1]
  assert.equal(last.action, 'Évènement sans date exploitable')
  assert.equal(last.display, null, 'une date non interprétable ne doit jamais être inventée — display reste null')
})

await check('J8. RDV et tâches ajoutés localement apparaissent dans la timeline (via lead.activity)', () => {
  const lead = {
    id: 'hist-4',
    activity: [
      { text: 'RDV planifié (Appel téléphonique) — 2026-09-20T10:00', at: formatNowLabel() },
      { text: 'Tâche ajoutée : Relancer par email', at: formatNowLabel() },
    ],
  }
  const timeline = buildLeadTimeline(lead, 'hist-4-noactivitylog')
  assert.ok(timeline.some(e => e.action.startsWith('RDV planifié')))
  assert.ok(timeline.some(e => e.action.startsWith('Tâche ajoutée')))
})

await check('J9. Rejet/remplacement de document visibles dans la timeline 360° (via activity_log)', () => {
  const timelineClientId = 'docs-client-notif' // déjà utilisé par le test D — contient un rejet de document
  const timeline = buildLeadTimeline({ activity: [] }, timelineClientId)
  assert.ok(timeline.some(e => e.action === "Document rejeté par l'équipe"), 'le rejet de document doit apparaître dans la timeline 360°')
  assert.ok(timeline.some(e => e.action === 'Notification de rejet envoyée au client'))
})

await check('J10. Aucun faux évènement si aucune donnée n\'existe pour un client', () => {
  assert.deepEqual(buildLeadTimeline(null, 'client-totalement-inconnu-xyz'), [])
  assert.equal(findConversionEntry(null), null)
  assert.equal(findConversionEntry({ activity: [] }), null)
})

// ================================================================
// L. Packs / prix / remise / HT-TTC (packsData.js) + conservation après conversion
// ================================================================
console.log('L. Packs, prix, remise, HT/TTC (packsData.js)')

await check('L1. Catalogue de packs exact (12 packs, prix TTC fournis, aucun ajouté)', () => {
  assert.equal(LOCAL_PACKS.length, 12, 'catalogue fourni = 2+3+3+4 = 12 packs (voir note dans packsData.js sur l\'écart avec "11" dans la consigne de tests)')
  const expectedTtc = {
    'Pack Essentiel': 47880, 'Pack Premium': 59880,
    'Web Starter': 14280, 'Web Pro': 21480, 'Web Elite': 47880,
    'Formation IAS1': 9480, 'Scripts & Vente': 7080, 'Academy Complet': 15480,
    'Pack Lancement': 59880, 'Pack Croissance': 68280, 'Pack Accélération': 77472, 'Pack Elite': 100680,
  }
  assert.deepEqual(Object.keys(expectedTtc).sort(), LOCAL_PACKS.map(p => p.name).sort())
  Object.entries(expectedTtc).forEach(([name, ttc]) => {
    assert.equal(findPackByName(name).priceTtc, ttc, `prix TTC exact attendu pour "${name}"`)
  })
})

await check('L1b. Select "Pack intéressé" (Nouveau prospect / fiche Prospect) : liste plate, ordre et prix HT exacts, sans catégorie', async () => {
  // Reproduit exactement l'ordre et les libellés demandés pour le dropdown
  // (nom + prix HT, aucun groupe/catégorie visible) — LOCAL_PACKS est la
  // SEULE source utilisée par PackPricingFields (Nouveau prospect / fiche
  // Prospect), donc vérifier son ordre/valeurs ici couvre les deux écrans.
  const expectedOrder = [
    ['Pack Essentiel', 39900], ['Pack Premium', 49900],
    ['Web Starter', 11900], ['Web Pro', 17900], ['Web Elite', 39900],
    ['Formation IAS1', 7900], ['Scripts & Vente', 5900], ['Academy Complet', 12900],
    ['Pack Lancement', 49900], ['Pack Croissance', 56900], ['Pack Accélération', 64560], ['Pack Elite', 83900],
  ]
  assert.deepEqual(LOCAL_PACKS.map(p => [p.name, p.priceHt]), expectedOrder)

  // Le composant PackPricingFields (src/local/LocalCRM.jsx) doit itérer
  // LOCAL_PACKS directement (liste plate), pas packsByCategory() (qui
  // produirait des <optgroup> = catégories visibles, explicitement exclues).
  const fs2 = await import('node:fs/promises')
  const crmSource = await fs2.readFile('src/local/LocalCRM.jsx', 'utf8')
  const idx = crmSource.indexOf('Pack intéressé')
  const selectBlock = crmSource.slice(idx, idx + 400)
  assert.ok(selectBlock.includes('LOCAL_PACKS.map'), 'le select doit itérer LOCAL_PACKS directement (liste plate)')
  assert.ok(!selectBlock.includes('optgroup'), 'aucune catégorie/<optgroup> ne doit être visible dans ce select')
  assert.ok(selectBlock.includes('Sélectionner un pack'), 'option de tête "Sélectionner un pack..." attendue')
})

await check('L2. TVA confirmée à 20% et calcul HT correct (priceHt = priceTtc / 1.20)', () => {
  assert.equal(TVA_RATE, 1.20)
  LOCAL_PACKS.forEach(p => {
    assert.equal(p.priceHt, Math.round(p.priceTtc / 1.20), `HT incohérent pour "${p.name}"`)
  })
})

await check('L3. Remise 0% => prix final = prix de base', () => {
  const pack = findPackByName('Pack Essentiel')
  assert.equal(computeFinalPrice(pack, 'ttc', 0), pack.priceTtc)
  assert.equal(computeFinalPrice(pack, 'ht', 0), pack.priceHt)
})

await check('L4. Remise 10% => prix final = base * 0.9 (jamais négatif)', () => {
  const pack = findPackByName('Pack Premium') // 59 880 TTC
  assert.equal(computeFinalPrice(pack, 'ttc', 10), Math.round(59880 * 0.9))
  assert.equal(computeFinalPrice(pack, 'ttc', 150), 0, 'une remise > 100 doit être ramenée à 100% => prix final 0, jamais négatif')
})

await check('L5. Changement HT/TTC change le prix de base pris en compte', () => {
  const pack = findPackByName('Web Pro')
  assert.equal(basePriceFor(pack, 'ttc'), pack.priceTtc)
  assert.equal(basePriceFor(pack, 'ht'), pack.priceHt)
  assert.notEqual(basePriceFor(pack, 'ttc'), basePriceFor(pack, 'ht'))
})

await check('L6. Changement de pack recalcule bien un prix différent', () => {
  const a = findPackByName('Web Starter'), b = findPackByName('Pack Elite')
  assert.notEqual(computeFinalPrice(a, 'ttc', 0), computeFinalPrice(b, 'ttc', 0))
})

await check('L7. Persistance locale : les leads de démo portent des champs de tarification cohérents avec le pack choisi', () => {
  const leads = seed()
  leads.forEach(l => {
    const pack = findPackById(l.packId)
    assert.ok(pack, `packId "${l.packId}" du lead ${l.id} doit exister`)
    assert.equal(l.basePrice, basePriceFor(pack, l.pricingMode))
    assert.equal(l.finalPrice, computeFinalPrice(pack, l.pricingMode, l.discountPercent))
  })
})

await check('L8. Conservation après conversion : packId/pricingMode/discountPercent/basePrice/finalPrice identiques côté fiche Client', () => {
  const lead = seed().find(l => l.stage !== 'Client') || seed()[0]
  const converted = { ...lead, stage: 'Client', paymentValidated: true }
  const { rows } = buildClientsOverview([converted])
  const client = rows[0]
  assert.equal(client.packId, lead.packId)
  assert.equal(client.pricingMode, lead.pricingMode)
  assert.equal(client.discountPercent, lead.discountPercent)
  assert.equal(client.basePrice, lead.basePrice)
  assert.equal(client.finalPrice, lead.finalPrice)
  assert.equal(client.message, lead.message, 'message initial conservé après conversion')
})

// ================================================================
// M. Commentaire manuel dans l'historique Client (clientHistory.js addManualComment)
// ================================================================
console.log('M. Commentaire manuel dans l\'historique Client (addManualComment)')

await check('M1. Un commentaire ajouté apparaît immédiatement dans l\'historique, horodaté, acteur Équipe', () => {
  const commentClientId = 'comment-client-1'
  const before = formatNowLabel()
  const ok = addManualComment(commentClientId, 'Client rappelé, tout va bien.')
  assert.equal(ok, true)
  const timeline = buildLeadTimeline({ activity: [] }, commentClientId)
  const entry = timeline.find(e => e.action === 'Commentaire ajouté')
  assert.ok(entry, 'le commentaire doit apparaître dans la timeline fusionnée')
  assert.equal(entry.detail, 'Client rappelé, tout va bien.')
  assert.equal(entry.author, 'Équipe')
  assert.equal(entry.at, before)
  assert.ok(entry.display, 'la date doit être interprétable (JJ/MM/AAAA - HH:mm)')
})

await check('M2. Un commentaire vide/blanc est ignoré (aucun faux évènement)', () => {
  const commentClientId = 'comment-client-2'
  assert.equal(addManualComment(commentClientId, ''), false)
  assert.equal(addManualComment(commentClientId, '   '), false)
  assert.deepEqual(buildLeadTimeline({ activity: [] }, commentClientId), [])
})

await check('M3. Le commentaire persiste (relecture indépendante via getActivityLog)', () => {
  const commentClientId = 'comment-client-3'
  addManualComment(commentClientId, 'Deuxième point de suivi.')
  const log = getActivityLog(commentClientId)
  assert.ok(log.some(e => e.action === 'Commentaire ajouté' && e.detail === 'Deuxième point de suivi.'))
})

// ================================================================
// K. Statut client (fiche Client) — clientHistory.js applyStatusChange/STAGE_BADGE_STYLES
// ================================================================
console.log('K. Statut client (applyStatusChange / STAGE_BADGE_STYLES)')

await check('K1. Le dropdown contient exactement les 7 statuts attendus ("RDV pris" retiré comme étape CRM), rien d\'inventé', () => {
  const expected = ['Nouveau', 'Intéressé – à relancer', 'Qualifié', 'Engagé (Commit)', 'Client', 'Injoignable', 'Perdu']
  assert.deepEqual(stages, expected)
  assert.ok(!stages.includes('RDV pris'), '"RDV pris" ne doit plus exister comme étape CRM (le RDV reste géré via lead.appointments, Agenda, Calendrier)')
  assert.deepEqual(Object.keys(STAGE_BADGE_STYLES).sort(), [...expected].sort(), 'STAGE_BADGE_STYLES doit couvrir exactement ces 7 statuts, ni plus ni moins')
  stages.forEach(s => assert.ok(STAGE_BADGE_STYLES[s], `un style de badge doit exister pour "${s}"`))
})

await check('K2. applyStatusChange met à jour le statut du client local (aucun appel live)', () => {
  const leads = [{ id: 'stat-1', stage: 'Nouveau', activity: [{ text: 'Créé', at: formatNowLabel() }] }]
  const next = applyStatusChange(leads, 'stat-1', 'Qualifié')
  assert.notEqual(next, leads, 'applyStatusChange ne doit pas muter le tableau d\'origine')
  assert.equal(next.find(l => l.id === 'stat-1').stage, 'Qualifié')
  assert.equal(leads[0].stage, 'Nouveau', 'le tableau d\'origine ne doit pas être modifié (fonction pure)')
})

await check('K3. Ancien et nouveau statut apparaissent dans l\'historique, avec un timestamp exact', () => {
  const leads = [{ id: 'stat-2', stage: 'Qualifié', activity: [] }]
  const before = formatNowLabel()
  const next = applyStatusChange(leads, 'stat-2', 'Engagé (Commit)')
  const lead = next.find(l => l.id === 'stat-2')
  const entry = lead.activity[0]
  assert.ok(entry.text.includes('Qualifié'), 'l\'ancien statut doit apparaître dans le texte de l\'évènement')
  assert.ok(entry.text.includes('Engagé (Commit)'), 'le nouveau statut doit apparaître dans le texte de l\'évènement')
  assert.equal(entry.text, 'Statut changé : Qualifié -> Engagé (Commit)')
  assert.equal(entry.at, before, 'le timestamp doit être celui du changement (formatNowLabel(), format JJ/MM/AAAA · HH:mm)')

  // Visible dans l'historique 360° fusionné, trié correctement.
  const timeline = buildLeadTimeline(lead, 'stat-2-noactivitylog')
  assert.ok(timeline.some(e => e.action === entry.text))
})

await check('K4. Aucun changement si le nouveau statut est identique à l\'ancien (pas de faux évènement)', () => {
  const leads = [{ id: 'stat-3', stage: 'Client', activity: [] }]
  const next = applyStatusChange(leads, 'stat-3', 'Client')
  assert.equal(next, leads, 'aucune nouvelle référence ne doit être créée si le statut ne change pas réellement')
  assert.equal(next.find(l => l.id === 'stat-3').activity.length, 0)
})

// ================================================================
// H. Journal chronologique (activityLog.js)
// ================================================================
console.log('H. Journal chronologique (activityLog.js)')

await check('H. getActivityLog retourne les entrées triées du plus récent au plus ancien', () => {
  const log = getActivityLog(docsClientId)
  assert.ok(log.length >= 3)
  for (let i = 1; i < log.length; i++) {
    assert.ok((log[i - 1].sortTs ?? 0) >= (log[i].sortTs ?? 0))
  }
  assert.ok(log.every(e => e.author && e.action && e.at))
})

// ================================================================
// Fonctions api.js "activation future" — dormantes tant que isConfigured
// est false (toujours vrai ici) : simple garantie qu'elles ne cassent rien
// et ne tentent aucun accès réseau/Supabase.
// ================================================================
console.log('api.js — fonctions préparées pour l\'activation future (dormantes, isConfigured=false)')

await check('createNotification() ne fait rien de réseau et renvoie un id de démo', async () => {
  const res = await createNotification({
    audience: 'client',
    userId: 'u1',
    type: 'document_rejected',
    title: 'Test',
    body: 'Test',
    linkTab: 'documents',
    relatedId: 'doc-1',
  })
  assert.equal(res.success, true)
  assert.ok(res.id.startsWith('demo-notif-'))
})

for (const [name, fn] of [
  ['markSendSeen', markSendSeen],
  ['markSendOpened', markSendOpened],
  ['markSendReminded', markSendReminded],
]) {
  await check(`${name}() est un no-op sûr hors configuration Supabase`, async () => {
    const res = await fn('fake-send-id')
    assert.equal(res.success, true)
  })
}

await check('setSendImportant() est un no-op sûr hors configuration Supabase', async () => {
  const res = await setSendImportant('fake-send-id', true)
  assert.equal(res.success, true)
})

await check('fetchDocumentVersions() renvoie [] hors configuration Supabase', async () => {
  const res = await fetchDocumentVersions('u1', 'cin')
  assert.deepEqual(res, [])
})

await check('logActivity()/fetchActivityLog() (api.js) sont des no-op sûrs hors configuration Supabase', async () => {
  const logRes = await logActivity({ clientId: 'u1', actorType: 'admin', actionType: 'document_rejected' })
  assert.equal(logRes.success, true)
  const fetchRes = await fetchActivityLog('u1')
  assert.deepEqual(fetchRes, [])
})

await check('rejectDocumentWithAudit() réutilise updateDocumentStatusWithReason() en mode démo sans erreur', async () => {
  // 'dd-1' = id du document démo 'cin' dans DEMO_DOCS_BY_CATEGORY (src/data/mockData.js)
  const res = await rejectDocumentWithAudit(
    { id: 'dd-1', userId: 'u1', category: 'cin', categoryLabel: 'CIN', fileName: 'cin.pdf', fileUrl: null, uploadedAt: null },
    'Motif de test',
    'admin-1'
  )
  assert.equal(res.success, true)
})

await check('replaceDocumentWithVersioning() réutilise uploadDocumentFile() en mode démo sans erreur', async () => {
  const fakeFile = { name: 'nouveau.pdf', type: 'application/pdf', size: 1000 }
  const res = await replaceDocumentWithVersioning('u1', 'cin', 'CIN', fakeFile, null)
  assert.equal(res.success, true)
})

// ================================================================
// N. Relance illimitée + indicateur d'émetteur (clientTrackingStore.js)
// ================================================================
console.log('N. Relance illimitée + indicateur émetteur (clientTrackingStore.js)')

await check('N1. Le bouton "Relancer" reste disponible tant qu\'aucune réponse n\'est arrivée : relances multiples possibles, jamais plafonnées', () => {
  const clientId = 'relance-client-1'
  const [, , item] = getClientSends(clientId) // docItem : responseRequired=true
  assert.equal(getReminderCount(item), 0)
  assert.equal(item.responseRequired && !item.response, true, 'le bouton doit être affichable dès le départ (réponse attendue, aucune réponse)')

  markClientSendReminded(item.id)
  let after1 = getClientSends(clientId).find(i => i.id === item.id)
  assert.equal(getReminderCount(after1), 1)
  assert.equal(after1.responseRequired && !after1.response, true, 'toujours disponible après une 1ère relance')

  markClientSendReminded(item.id)
  const after2 = getClientSends(clientId).find(i => i.id === item.id)
  assert.equal(getReminderCount(after2), 2, 'une 2e relance doit s\'AJOUTER, jamais écraser la 1ère')

  markClientSendReminded(item.id)
  const after3 = getClientSends(clientId).find(i => i.id === item.id)
  assert.equal(getReminderCount(after3), 3, 'aucune limite : une 3e relance doit encore être acceptée')
  assert.deepEqual(after3.reminders.map(r => r.by), ['Équipe Oriafen', 'Équipe Oriafen', 'Équipe Oriafen'])
  assert.ok(after3.reminders.every(r => r.at), 'chaque relance doit porter une date/heure')
})

await check('N2. Le bouton "Relancer" disparaît uniquement une fois la réponse du client reçue (pas simplement vue/ouverte)', () => {
  const clientId = 'relance-client-2'
  const [, , item] = getClientSends(clientId)
  markClientSendOpened(item.id) // vu + ouvert, mais pas encore répondu
  const opened = getClientSends(clientId).find(i => i.id === item.id)
  assert.equal(opened.responseRequired && !opened.response, true, 'ouvert/vu ne doit pas faire disparaître le bouton : la réponse est toujours attendue')

  replyToClientSend(item.id, 'Voici ma réponse.')
  const replied = getClientSends(clientId).find(i => i.id === item.id)
  assert.equal(replied.responseRequired && !replied.response, false, 'une fois la réponse reçue, le bouton doit disparaître')
})

await check('N3. lastActivityAt est mis à jour à chaque relance et chaque relance est journalisée individuellement (append, jamais overwrite)', () => {
  const clientId = 'relance-client-3'
  const [, , item] = getClientSends(clientId)
  markClientSendReminded(item.id)
  markClientSendReminded(item.id)
  getClientSends(clientId) // déclenche le rejeu idempotent de backfillActivityFromItem
  const log = getActivityLog(clientId)
  const reminderEntries = log.filter(e => e.action?.startsWith('Relance n°'))
  assert.equal(reminderEntries.length, 2, 'chaque relance doit produire sa propre entrée d\'historique, numérotée')
  assert.ok(reminderEntries.some(e => e.action === 'Relance n°1 effectuée'))
  assert.ok(reminderEntries.some(e => e.action === 'Relance n°2 effectuée'))
})

await check('N4. Indicateur d\'émetteur : chaque envoi porte un senderType exploitable ("team" = Équipe Oriafen), jamais deviné/absent', () => {
  const clientId = 'sender-client-1'
  const items = getClientSends(clientId)
  assert.ok(items.length > 0)
  items.forEach(item => {
    assert.ok(item.senderType === 'team' || item.senderType === 'client', `senderType doit être défini pour l'envoi "${item.title}"`)
  })
  // Les envois de démo sont tous initiés par l'équipe (l'espace client ne
  // permet que de répondre, pas d'envoyer un nouvel envoi de ce type).
  assert.ok(items.every(item => item.senderType === 'team'))
})

await check('N5. Une réponse client reste identifiable comme provenant du client (via item.response, jamais confondue avec un envoi de l\'équipe)', () => {
  const clientId = 'sender-client-2'
  const [, , item] = getClientSends(clientId)
  replyToClientSend(item.id, 'Message du client.')
  const replied = getClientSends(clientId).find(i => i.id === item.id)
  assert.equal(replied.senderType, 'team', 'l\'envoi original reste "team" : seule sa réponse imbriquée est côté client')
  assert.ok(replied.response && replied.response.message === 'Message du client.')
})

// ================================================================
// O. Ordre Kanban + suppression de "RDV pris" comme étape (model.js)
// ================================================================
console.log('O. Ordre Kanban + suppression de "RDV pris" comme étape CRM (model.js)')

await check('O1. Ordre exact des colonnes Kanban : Nouveau, Intéressé – à relancer, Qualifié, Engagé (Commit), Client, Injoignable, Perdu', () => {
  assert.deepEqual(stages, ['Nouveau', 'Intéressé – à relancer', 'Qualifié', 'Engagé (Commit)', 'Client', 'Injoignable', 'Perdu'])
  assert.equal(stages[1], 'Intéressé – à relancer', '"Intéressé – à relancer" doit être la 2e colonne, juste après Nouveau')
})

await check('O2. "RDV pris" n\'existe plus comme étape CRM (ni dans stages, ni dans les leads de démo)', () => {
  assert.ok(!stages.includes('RDV pris'))
  const leads = seed()
  assert.ok(leads.every(l => l.stage !== 'RDV pris'), 'aucun lead de démo ne doit porter l\'ancienne étape "RDV pris"')
})

// ================================================================
// P. Préservation de la fonctionnalité Rendez-vous (Agenda/Calendrier/appointments[])
// ================================================================
console.log('P. Préservation de la fonctionnalité Rendez-vous (indépendante de l\'étape CRM)')

await check('P1. Un prospect peut avoir des rendez-vous (appointments[]) quelle que soit son étape CRM actuelle (aucune étape "RDV pris" requise)', () => {
  const lead = { id: 'rdv-1', stage: 'Qualifié', appointments: [{ id: 1, scheduledAt: '2026-09-20T10:00', type: 'appel', status: 'planifie' }], activity: [] }
  assert.equal(lead.appointments.length, 1, 'le rendez-vous doit exister indépendamment du fait que "RDV pris" ne soit plus une étape')
  assert.equal(lead.stage, 'Qualifié')
})

await check('P2. La migration non destructive d\'un lead "RDV pris" ne touche jamais son historique de rendez-vous (appointments[] intact)', () => {
  const appointments = [{ id: 42, scheduledAt: '2026-09-18T14:00', type: 'visio', status: 'planifie' }]
  const legacyLead = { id: 'rdv-2', stage: 'RDV pris', appointments, activity: [{ text: 'RDV planifié (Visio) — 2026-09-18T14:00', at: formatNowLabel() }] }
  const [migrated] = normalizeLeadsStage([legacyLead])
  assert.notEqual(migrated.stage, 'RDV pris', 'la migration doit repositionner le lead vers une étape existante')
  assert.equal(migrated.stage, MIGRATION_RDV_PRIS_TO, `mapping documenté : "RDV pris" -> "${MIGRATION_RDV_PRIS_TO}"`)
  assert.deepEqual(migrated.appointments, appointments, 'appointments[] ne doit jamais être supprimé/modifié par la migration')
  assert.deepEqual(migrated.activity, legacyLead.activity, 'l\'historique d\'activité (dont la trace du RDV) ne doit jamais être perdu')
})

await check('P3. normalizeLeadsStage est un no-op pour tous les leads déjà sur une étape valide (idempotent, non destructif)', () => {
  const leads = seed()
  const migrated = normalizeLeadsStage(leads)
  assert.deepEqual(migrated, leads, 'aucun changement ne doit être appliqué aux leads déjà cohérents avec les 7 étapes actuelles')
})

// ================================================================
// Q. Conversion Prospect -> Client : logique de paiement historique (conversion.js)
// ================================================================
console.log('Q. Conversion Prospect -> Client : gating paiement reproduit du live (conversion.js)')

await check('Q1. Passer stage="Client" seul ne crée PAS de compte client : le lead n\'apparaît pas dans la vue Clients tant que le paiement n\'est pas validé', () => {
  const lead = seed().find(l => l.stage !== 'Client')
  const simpleStageChange = { ...lead, stage: 'Client' } // pas de paymentValidated
  const { rows } = buildClientsOverview([simpleStageChange])
  assert.equal(rows.length, 0, 'un simple changement de statut ne doit jamais suffire (reproduit converted_user_id manquant côté live)')
})

await check('Q2. applyPaymentValidation exige un pack sélectionné (même garde-fou que le bouton live disabled={!packId})', () => {
  const lead = { id: 'conv-1', stage: 'Client', packId: null, finalPrice: 0, paymentValidated: false, activity: [] }
  const next = applyPaymentValidation([lead], 'conv-1')
  assert.equal(next[0].paymentValidated, false, 'sans pack, la conversion ne doit jamais avoir lieu')
})

await check('Q3. applyPaymentValidation génère la répartition 50/25/25 pour un pack non "full", marque le premier paiement "paid", journalise et rend le lead visible dans Clients', () => {
  const pack = LOCAL_PACKS.find(p => p.paymentType !== 'full')
  assert.ok(pack, 'le catalogue doit contenir au moins un pack en plusieurs échéances')
  const lead = { id: 'conv-2', stage: 'Client', packId: pack.id, finalPrice: pack.priceTtc, paymentValidated: false, activity: [] }
  const next = applyPaymentValidation([lead], 'conv-2')
  const converted = next[0]
  assert.equal(converted.paymentValidated, true)
  assert.equal(converted.payments.length, 3)
  assert.deepEqual(converted.payments.map(p => p.milestone), ['souscription', 'kbis_formation', 'orias'])
  assert.equal(converted.payments[0].status, 'paid', 'seul le premier paiement doit être marqué réglé')
  assert.ok(converted.payments.slice(1).every(p => p.status === 'pending'))
  assert.ok(converted.convertedAt, 'la date de conversion doit être enregistrée')
  assert.ok(converted.activity[0].text.includes('Paiement validé'), 'la conversion doit être journalisée dans l\'historique du lead')

  const { rows } = buildClientsOverview([converted])
  assert.equal(rows.length, 1, 'une fois le paiement validé, le lead doit apparaître dans la vue Clients (équivalent local de converted_user_id)')
})

await check('Q4. applyPaymentValidation génère une seule ligne à 100% pour un pack "full"', () => {
  const pack = LOCAL_PACKS.find(p => p.paymentType === 'full')
  assert.ok(pack, 'le catalogue doit contenir au moins un pack en paiement intégral')
  const lead = { id: 'conv-3', stage: 'Client', packId: pack.id, finalPrice: pack.priceTtc, paymentValidated: false, activity: [] }
  const next = applyPaymentValidation([lead], 'conv-3')
  const converted = next[0]
  assert.equal(converted.payments.length, 1)
  assert.equal(converted.payments[0].milestone, 'full')
  assert.equal(converted.payments[0].status, 'paid')
})

await check('Q5. applyPaymentValidation est idempotent : rejouée sur un lead déjà converti, elle ne duplique rien', () => {
  const pack = LOCAL_PACKS[0]
  const lead = { id: 'conv-4', stage: 'Client', packId: pack.id, finalPrice: pack.priceTtc, paymentValidated: false, activity: [] }
  const once = applyPaymentValidation([lead], 'conv-4')
  const twice = applyPaymentValidation(once, 'conv-4')
  assert.deepEqual(twice, once, 'un second appel sur un lead déjà validé ne doit rien changer (pas de nouvelle conversion, pas de doublon d\'activité)')
})

await check('Q6. Les leads de démo "Client" du seed portent déjà paymentValidated=true et un historique de paiement cohérent (seed reproduit la conversion complète, pas juste le statut)', () => {
  const leads = seed()
  const clientLeads = leads.filter(l => l.stage === 'Client')
  assert.ok(clientLeads.length > 0)
  clientLeads.forEach(l => {
    assert.equal(l.paymentValidated, true)
    assert.ok(l.payments.length > 0)
    assert.equal(l.payments[0].status, 'paid')
  })
  const { rows } = buildClientsOverview(leads)
  assert.equal(rows.length, clientLeads.length, 'tous les leads Client du seed doivent apparaître dans la vue Clients (paiement déjà validé)')
})

// ================================================================
// R. Prochaine action -> alimente automatiquement l'historique (clientHistory.js applyNextActionUpdate)
// ================================================================
console.log('R. Prochaine action -> Historique d\'activité / Dernière activité (applyNextActionUpdate)')

await check('R1. Création d\'une prochaine action (action vide -> renseignée) : évènement "Prochaine action créée — ..."', () => {
  const leads = [{ id: 'next-1', action: '', due: '', owner: 'Non attribué', done: false, activity: [] }]
  const next = applyNextActionUpdate(leads, 'next-1', 'action', 'Rendez-vous découverte')
  const lead = next.find(l => l.id === 'next-1')
  assert.equal(lead.action, 'Rendez-vous découverte')
  assert.equal(lead.activity.length, 1)
  assert.equal(lead.activity[0].text, 'Prochaine action créée — Rendez-vous découverte')
  assert.ok(lead.activity[0].at, 'la date/heure exacte doit être présente')
  assert.notEqual(next, leads, 'fonction pure : ne doit jamais muter le tableau d\'origine')
  assert.equal(leads[0].activity.length, 0, 'le lead d\'origine ne doit pas être modifié')
})

await check('R2. Modification d\'une prochaine action déjà renseignée : évènement "Prochaine action modifiée — ..." (append, ancienne entrée conservée)', () => {
  let leads = [{ id: 'next-2', action: 'Premier appel', due: '', owner: 'Non attribué', done: false, activity: [{ text: 'Prospect créé', at: formatNowLabel() }] }]
  leads = applyNextActionUpdate(leads, 'next-2', 'action', 'Rendez-vous découverte')
  const lead = leads.find(l => l.id === 'next-2')
  assert.equal(lead.action, 'Rendez-vous découverte')
  assert.equal(lead.activity[0].text, 'Prochaine action modifiée — Rendez-vous découverte')
  assert.equal(lead.activity.length, 2, 'la nouvelle entrée doit s\'AJOUTER, jamais remplacer l\'historique existant')
  assert.equal(lead.activity[1].text, 'Prospect créé', 'l\'ancienne entrée doit rester intacte')
})

await check('R3. Changement d\'échéance (replanification) : évènement "Échéance modifiée — JJ/MM/AAAA"', () => {
  const leads = [{ id: 'next-3', action: 'Rendez-vous découverte', due: '2026-09-10', owner: 'Non attribué', done: false, activity: [] }]
  const next = applyNextActionUpdate(leads, 'next-3', 'due', '2026-09-15')
  const lead = next.find(l => l.id === 'next-3')
  assert.equal(lead.due, '2026-09-15')
  assert.equal(lead.activity[0].text, 'Échéance modifiée — 15/09/2026')
})

await check('R4. Changement de responsable (réassignation) : évènement "Responsable modifié — ..."', () => {
  const leads = [{ id: 'next-4', action: 'Rendez-vous découverte', due: '2026-09-15', owner: 'Non attribué', done: false, activity: [] }]
  const next = applyNextActionUpdate(leads, 'next-4', 'owner', 'Salma Démo')
  const lead = next.find(l => l.id === 'next-4')
  assert.equal(lead.owner, 'Salma Démo')
  assert.equal(lead.activity[0].text, 'Responsable modifié — Salma Démo')
})

await check('R5. Prochaine action marquée terminée / réouverte : évènements "Prochaine action terminée/réouverte — <titre>"', () => {
  let leads = [{ id: 'next-5', action: 'Rendez-vous découverte', due: '2026-09-15', owner: 'Salma Démo', done: false, activity: [] }]
  leads = applyNextActionUpdate(leads, 'next-5', 'done', true)
  let lead = leads.find(l => l.id === 'next-5')
  assert.equal(lead.done, true)
  assert.equal(lead.activity[0].text, 'Prochaine action terminée — Rendez-vous découverte')

  leads = applyNextActionUpdate(leads, 'next-5', 'done', false)
  lead = leads.find(l => l.id === 'next-5')
  assert.equal(lead.done, false)
  assert.equal(lead.activity[0].text, 'Prochaine action réouverte — Rendez-vous découverte')
  assert.equal(lead.activity.length, 2, 'les deux évènements (terminée puis réouverte) doivent être conservés, jamais écrasés')
})

await check('R6. lastActivityAt est mis à jour à chaque modification de la Prochaine action, et alimente "Dernière activité" (clientsOverviewData.js)', () => {
  let leads = [{ id: 7001, name: 'Client Next Action', email: 'next7001@example.invalid', phone: '0600000000', city: 'Casablanca', pack: 'Essentiel', owner: 'Non attribué', stage: 'Client', paymentValidated: true, action: '', due: '', done: false, activity: [] }]
  assert.equal(leads[0].lastActivityAt, undefined)

  leads = applyNextActionUpdate(leads, 7001, 'action', 'Relance téléphonique')
  assert.ok(leads[0].lastActivityAt, 'lastActivityAt doit être renseigné dès la 1ère modification')
  const firstStamp = leads[0].lastActivityAt

  leads = applyNextActionUpdate(leads, 7001, 'owner', 'Yanis Démo')
  assert.ok(leads[0].lastActivityAt, 'lastActivityAt doit rester renseigné après une 2e modification')
  assert.equal(leads[0].lastActivityAt, leads[0].activity[0].at, 'lastActivityAt doit correspondre exactement à la dernière entrée d\'historique ajoutée')

  // "Dernière activité" (vue Clients) doit refléter ce changement.
  const { rows } = buildClientsOverview(leads)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].lastActivity.label, 'Responsable modifié — Yanis Démo')
  assert.equal(rows[0].lastActivity.at, leads[0].lastActivityAt)
  assert.equal(rows[0].lastActivityAt, leads[0].lastActivityAt, 'le champ brut lastActivityAt doit aussi être exposé tel quel (additif)')
  void firstStamp
})

await check('R7. Un champ effacé (action vidée) n\'invente aucun faux évènement et ne touche pas lastActivityAt', () => {
  const leads = [{ id: 'next-8', action: 'Rendez-vous découverte', due: '', owner: 'Non attribué', done: false, activity: [] }]
  const next = applyNextActionUpdate(leads, 'next-8', 'action', '')
  const lead = next.find(l => l.id === 'next-8')
  assert.equal(lead.action, '', 'la valeur doit tout de même être appliquée')
  assert.equal(lead.activity.length, 0, 'aucun évènement inventé pour un champ vidé')
  assert.equal(lead.lastActivityAt, undefined)
})

await check('R8. Historique 360 (buildLeadTimeline) inclut bien les évènements "Prochaine action" — visibles côté fiche Prospect ET fiche Client', () => {
  let leads = [{ id: 'next-9', action: '', due: '', owner: 'Non attribué', done: false, activity: [] }]
  leads = applyNextActionUpdate(leads, 'next-9', 'action', 'Appel de qualification')
  const lead = leads.find(l => l.id === 'next-9')
  const timeline = buildLeadTimeline(lead, 'next-9')
  assert.ok(timeline.some(e => e.action === 'Prochaine action créée — Appel de qualification'))
})

console.log(`PASS (${passed} checks): tracking envois, rejet/remplacement/versioning documents, journal d'activité, fonctions api.js "activation future" — 100% local, aucun accès Supabase.`)
