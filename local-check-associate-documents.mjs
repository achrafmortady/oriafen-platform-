// Vérifie (fonctions pures / store localStorage polyfillé, même convention
// que local-check-tracking.mjs / local-check-crm-feedback.mjs — aucun
// navigateur, aucun appel réseau) la section optionnelle "Documents de mon
// associé" ajoutée à documentsStore.js / associateDocuments.js.
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

const { REQUIRED_DOCUMENTS } = await import('./src/data/mockData.js')
const { getClientDocuments, uploadDocument, rejectDocument, validateDocument, getDocVersions } = await import('./src/local/documentsStore.js')
const { ASSOCIATE_DOCUMENTS, ASSOCIATE_AUTRE_PREFIX, listAssociateDocCategories, countAssociateDocsSent, isAssociateCategory } = await import('./src/local/associateDocuments.js')
const { getClientSends } = await import('./src/local/clientTrackingStore.js')

const clientId = 'assoc-test-1'

// 1. La section associé (ses 3 catégories fixes) est visible pour TOUT
// client, sans condition/flag — aucune dépendance à un état préalable.
{
  assert.equal(ASSOCIATE_DOCUMENTS.length, 3)
  const ids = ASSOCIATE_DOCUMENTS.map(d => d.id)
  assert.deepEqual(ids, ['associate_cin_recto', 'associate_cin_verso', 'associate_justificatif_domiciliation'])
  const categories = listAssociateDocCategories(getClientDocuments(clientId))
  // Toujours au moins les 3 catégories fixes, quel que soit le client, quel
  // que soit son état (aucun flag hasAssociate à vérifier avant affichage).
  ASSOCIATE_DOCUMENTS.forEach(d => assert.ok(categories.some(c => c.id === d.id)))
  assert.equal(categories.filter(c => c.dynamic).length, 0, 'aucun document dynamique tant que rien n\'a été envoyé')
}
console.log('PASS 1: section associé visible pour tout client (3 catégories fixes, sans flag)')

// 2/3/4. Un client peut laisser la section vide : aucune erreur, aucun
// impact sur la progression du dossier principal, aucun blocage.
{
  const docs = getClientDocuments(clientId)
  // Reproduit exactement le calcul de LocalMesDocuments.jsx.
  const validDocs = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'valid').length
  const progressPct = Math.round((validDocs / REQUIRED_DOCUMENTS.length) * 100)
  assert.equal(countAssociateDocsSent(docs), 0, 'aucun document associé envoyé pour ce client neuf')
  // Rien ne lève d'exception, rien ne modifie REQUIRED_DOCUMENTS ni son calcul.
  assert.equal(REQUIRED_DOCUMENTS.some(r => isAssociateCategory(r.id)), false, 'REQUIRED_DOCUMENTS ne contient jamais de catégorie associé')
  assert.ok(Number.isFinite(progressPct), 'le calcul de progression reste valide même sans aucun document associé')
}
console.log('PASS 2-4: section associé vide -> aucune erreur, aucun impact sur la progression/le blocage du dossier principal')

// 5-8. Upload de chaque document associé (3 fixes + "Autre document associé").
{
  uploadDocument(clientId, 'associate_cin_recto', "CIN de l'associé — Recto", { name: 'cin-recto.pdf' })
  uploadDocument(clientId, 'associate_cin_verso', "CIN de l'associé — Verso", { name: 'cin-verso.pdf' })
  uploadDocument(clientId, 'associate_justificatif_domiciliation', "Justificatif de domiciliation de l'associé", { name: 'domicile-associe.pdf' })
  const autreId = ASSOCIATE_AUTRE_PREFIX + Date.now()
  uploadDocument(clientId, autreId, 'Attestation de non-condamnation', { name: 'attestation.pdf' })

  const docs = getClientDocuments(clientId)
  assert.equal(docs.associate_cin_recto.status, 'pending')
  assert.equal(docs.associate_cin_recto.fileName, 'cin-recto.pdf')
  assert.equal(docs.associate_cin_verso.fileName, 'cin-verso.pdf')
  assert.equal(docs.associate_justificatif_domiciliation.fileName, 'domicile-associe.pdf')
  assert.equal(docs[autreId].categoryLabel, 'Attestation de non-condamnation')
  assert.equal(countAssociateDocsSent(docs), 4, 'les 4 documents associé envoyés sont bien comptés (affichage neutre)')

  const categoriesAfter = listAssociateDocCategories(docs)
  assert.ok(categoriesAfter.some(c => c.id === autreId && c.dynamic), '"Autre document associé" dynamique découvert et listé (admin comme client)')
}
console.log('PASS 5-8: upload CIN recto/verso, justificatif de domiciliation, et "Autre document associé" personnalisé')

// 2/3/4 (bis) : la progression du dossier principal reste inchangée après
// upload de documents associé (toujours 0 document principal valide ici).
{
  const docs = getClientDocuments(clientId)
  const validDocs = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'valid').length
  assert.equal(validDocs, 0, 'des documents associé envoyés ne comptent jamais dans les documents requis du client principal')
}
console.log('PASS 2-4 (bis): documents associé envoyés -> progression du dossier principal toujours inchangée')

// 9/10. Aucun écrasement croisé entre client principal et associé.
{
  uploadDocument(clientId, 'cin', 'CIN — Pièce d\'identité', { name: 'cin-client.pdf' })
  const docs = getClientDocuments(clientId)
  assert.equal(docs.cin.fileName, 'cin-client.pdf')
  assert.equal(docs.associate_cin_recto.fileName, 'cin-recto.pdf', 'le document CIN du client principal ne doit jamais écraser celui de l\'associé')
  assert.equal(docs.associate_cin_verso.fileName, 'cin-verso.pdf')
  // Et inversement : re-uploader le document associé ne touche jamais 'cin'.
  uploadDocument(clientId, 'associate_cin_recto', "CIN de l'associé — Recto", { name: 'cin-recto-v2.pdf' })
  const docs2 = getClientDocuments(clientId)
  assert.equal(docs2.associate_cin_recto.fileName, 'cin-recto-v2.pdf')
  assert.equal(docs2.cin.fileName, 'cin-client.pdf', 'remplacer un document associé ne doit jamais écraser le document du client principal')
}
console.log('PASS 9-10: documents du client principal et de l\'associé ne s\'écrasent jamais mutuellement')

// 11. Rejet d'un document associé avec motif.
{
  const ok = rejectDocument(clientId, 'associate_cin_recto', 'Photo trop sombre, merci de renvoyer un scan plus net.')
  assert.equal(ok, true)
  const doc = getClientDocuments(clientId).associate_cin_recto
  assert.equal(doc.status, 'missing')
  assert.equal(doc.rejectionReason, 'Photo trop sombre, merci de renvoyer un scan plus net.')
  assert.ok(doc.rejectedAt)
  // La notification client mentionne bien le libellé associé (jamais confondue avec un document du client principal).
  const notif = getClientSends(clientId).find(i => i.title === "Document refusé : CIN de l'associé — Recto")
  assert.ok(notif, 'la notification de rejet doit citer le libellé exact du document associé')
}
console.log('PASS 11: rejet d\'un document associé avec motif (même workflow que le client principal)')

// 12/13. Remplacement du document associé rejeté + historique de versions.
{
  const before = getDocVersions(getClientDocuments(clientId).associate_cin_recto)
  assert.ok(before.length >= 1, 'le rejet doit déjà apparaître dans l\'historique')
  assert.equal(before[before.length - 1].status, 'missing', 'la version actuelle (rejetée) doit apparaître avec le statut "missing"')
  uploadDocument(clientId, 'associate_cin_recto', "CIN de l'associé — Recto", { name: 'cin-recto-v3.pdf' })
  const doc = getClientDocuments(clientId).associate_cin_recto
  assert.equal(doc.status, 'pending')
  assert.equal(doc.fileName, 'cin-recto-v3.pdf')
  const after = getDocVersions(doc)
  assert.ok(after.length > before.length, 'remplacer un document associé rejeté doit ajouter une nouvelle version, jamais écraser l\'historique existant')
  // La version rejetée reste bien identifiable dans l'historique.
  assert.ok(after.some(v => v.status === 'missing'), 'la version rejetée doit rester visible dans l\'historique après remplacement')
}
console.log('PASS 12-13: remplacement d\'un document associé rejeté + historique de versions correct')

// Validation d'un document associé (même bouton "Valider" que le client principal).
{
  const ok = validateDocument(clientId, 'associate_cin_verso')
  assert.equal(ok, true)
  assert.equal(getClientDocuments(clientId).associate_cin_verso.status, 'valid')
}
console.log('PASS: validation d\'un document associé (même workflow que le client principal)')

// 14. Admin : catégories client et associé restent des ensembles disjoints
// (aucun id partagé), donc jamais confondues côté fiche client.
{
  const docs = getClientDocuments(clientId)
  const associateIds = new Set(listAssociateDocCategories(docs).map(c => c.id))
  const clientIds = new Set(REQUIRED_DOCUMENTS.map(r => r.id))
  const overlap = [...associateIds].filter(id => clientIds.has(id))
  assert.equal(overlap.length, 0, 'aucune catégorie associé ne doit jamais coïncider avec une catégorie du client principal')
  associateIds.forEach(id => assert.equal(isAssociateCategory(id), true))
  clientIds.forEach(id => assert.equal(isAssociateCategory(id), false))
}
console.log('PASS 14: catégories client et associé strictement séparées (admin ne peut jamais les confondre)')

// 15. Le flux existant du document du client principal (upload -> pending ->
// rejet avec motif -> remplacement -> validation) fonctionne EXACTEMENT
// comme avant, sans aucune interférence de la section associé.
{
  const freshClientId = 'assoc-test-2'
  uploadDocument(freshClientId, 'passeport', 'Passeport', { name: 'passeport.pdf' })
  assert.equal(getClientDocuments(freshClientId).passeport.status, 'pending')
  rejectDocument(freshClientId, 'passeport', 'Page non lisible.')
  assert.equal(getClientDocuments(freshClientId).passeport.status, 'missing')
  uploadDocument(freshClientId, 'passeport', 'Passeport', { name: 'passeport-v2.pdf' })
  assert.equal(getClientDocuments(freshClientId).passeport.status, 'pending')
  validateDocument(freshClientId, 'passeport')
  assert.equal(getClientDocuments(freshClientId).passeport.status, 'valid')
  // Et ce client n'a jamais eu aucun document associé -> section toujours vide, sans erreur.
  assert.equal(countAssociateDocsSent(getClientDocuments(freshClientId)), 0)
  assert.equal(listAssociateDocCategories(getClientDocuments(freshClientId)).length, 3)
}
console.log('PASS 15: flux document du client principal inchangé (upload/rejet/remplacement/validation) même en présence de la fonctionnalité associé')

console.log('ALL PASS: documents de l\'associé (optionnels, catégories dédiées, workflow réutilisé, dossier principal inchangé)')
