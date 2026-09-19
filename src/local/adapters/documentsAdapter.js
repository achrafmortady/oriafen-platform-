// ============================================================
// DOCUMENTS ADAPTER — enveloppe fine autour de documentsStore.js
// (localStorage) + associateDocuments.js. Même interface prévue pour un
// futur adaptateur Supabase : swap au niveau de l'import, jamais du reste
// du code appelant.
//
// V1 (origin/main, lecture seule) — table `documents`, colonnes utilisées
// par src/lib/api.js : id, user_id, category, status ('valide'|'en_attente'
// |'manquant'|'correction_demandee'), file_url, rejection_reason,
// rejected_at, rejected_by, uploaded_at. Storage : bucket Supabase Storage
// (nom exact à confirmer — jamais documenté dans schema.sql, voir README §3).
// Versioning : PAS présent en V1 (une seule ligne par catégorie, écrasée au
// remplacement) — `document_versions` est une table PRÉPARÉE mais jamais
// appliquée (voir supabase/migrations/20260916_test_local_document_versions.sql,
// README §2.3). Les catégories `associate_*` (feedback session 2026-09-18)
// N'EXISTENT DANS AUCUN schéma V1 — nouvelle extension à documenter avant
// activation (voir docs/PRODUCTION_WIRING_PLAN.md §3).
// ============================================================
import { ADAPTER_MODE } from './identity'
import {
  getClientDocuments, getDocVersions, uploadDocument, rejectDocument, validateDocument,
  subscribeToDocuments,
} from '../documentsStore'
import { ASSOCIATE_DOCUMENTS, listAssociateDocCategories, countAssociateDocsSent, isAssociateCategory } from '../associateDocuments'

function assertLocalMode() {
  if (ADAPTER_MODE !== 'local') throw new Error('documentsAdapter: mode "supabase" non implémenté — voir docs/PRODUCTION_WIRING_PLAN.md')
}

export function getDocuments(clientId) { assertLocalMode(); return getClientDocuments(clientId) }
export function getVersions(doc) { assertLocalMode(); return getDocVersions(doc) }
export function upload(clientId, categoryId, categoryLabel, file) { assertLocalMode(); return uploadDocument(clientId, categoryId, categoryLabel, file) }
export function reject(clientId, categoryId, reason, rejectedBy) { assertLocalMode(); return rejectDocument(clientId, categoryId, reason, rejectedBy) }
export function validate(clientId, categoryId, validatedBy) { assertLocalMode(); return validateDocument(clientId, categoryId, validatedBy) }
export function subscribe(callback) { assertLocalMode(); return subscribeToDocuments(callback) }
export function getAssociateCategories(docs) { assertLocalMode(); return listAssociateDocCategories(docs) }
export function countAssociateSent(docs) { assertLocalMode(); return countAssociateDocsSent(docs) }
export { ASSOCIATE_DOCUMENTS, isAssociateCategory }
