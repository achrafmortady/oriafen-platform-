// ============================================================
// DOSSIER (étapes ORIAS) — production implementation (NOT activated, see
// ./_guard.js). Thin wrapper around src/lib/api.js (V1, unmodified).
//
// Confirmed (read-only, api.js:88-146): public.dossiers — id, user_id,
// dossier_number, current_step (int), status (text). updateDossierStep()
// only writes current_step, no history row anywhere in api.js.
//
// GAP (documented, not fixed live) : V2 Preview's dossierStepStore.js keeps
// a full step-change HISTORY (step/label/actor/timestamp), which V1 has NO
// equivalent for — see
// supabase/migrations/20260921_notes_dossier_step_history_gap.sql for a
// non-executed migration proposal (new `dossier_step_history` table,
// additive, RLS included as a proposal). getStepHistory() below throws
// until that table exists — it must NOT silently return an empty/fake
// history, that would be a data lie.
// ============================================================
import { assertProductionAdapterActive } from './_guard'
import { createDossierIfNeeded, fetchDossier, updateDossierStep } from '../../../lib/api'

function guard() { assertProductionAdapterActive('dossier.supabase.js') }

export function ensureDossier(userId) { guard(); return createDossierIfNeeded(userId) }
export function getDossier(userId) { guard(); return fetchDossier(userId) }
export function advanceStep(dossierId, step) { guard(); return updateDossierStep(dossierId, step) }

// Non implémenté tant que la migration proposée (voir commentaire ci-dessus)
// n'a pas été revue/appliquée sur un projet de test — jamais un historique
// inventé côté client.
export function getStepHistory() {
  guard()
  throw new Error('dossier.supabase.js: getStepHistory() nécessite dossier_step_history (voir supabase/migrations/20260921_notes_dossier_step_history_gap.sql, non appliquée) — pas encore disponible côté production.')
}
