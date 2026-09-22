// ============================================================
// Barrel for the production Supabase adapters. NEVER imported by
// ../index.js (the Preview barrel) or by any Local*.jsx component — see
// ./_guard.js (PRODUCTION_ADAPTER_ACTIVE=false) and
// local-check-supabase-adapters.mjs (static isolation test).
// ============================================================
export * as identity from './identity.supabase'
export * as storageUrl from './storageUrl'
export * as crm from './crm.supabase'
export * as documents from './documents.supabase'
export * as marketing from './marketing.supabase'
export * as notifications from './notifications.supabase'
export * as support from './support.supabase'
export * as formation from './formation.supabase'
export * as dossier from './dossier.supabase'
export * as payments from './payments.supabase'
