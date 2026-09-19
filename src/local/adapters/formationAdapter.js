// ============================================================
// FORMATION / DOSSIER / PAIEMENTS ADAPTER — enveloppe fine autour de
// formationProgressStore.js, dossierStepStore.js et conversion.js
// (localStorage). Ce sont les adaptateurs les PLUS PROCHES de la
// production : le V1 (origin/main) a déjà les fonctions Supabase
// équivalentes, non modifiées :
//   - formation_progress / chapter_progress / exam_results :
//     fetchFormationProgress, fetchChapterProgress, saveChapterProgress,
//     markUnitComplete, startUnit, fetchExamResults, saveExamResult
//   - dossiers.current_step : updateDossierStep
//   - payments : markPaymentPaid, fetchClientPayments ; leads.converted_user_id
//     via convertLeadToClient (conversion prospect -> client)
// Reconnecter = remplacer les appels ci-dessous par ces fonctions api.js
// une fois l'authentification réelle en place (docs/PRODUCTION_WIRING_PLAN.md
// §6) — AUCUNE règle métier de paiement ne doit changer (Finance non
// touchée par cette session).
// ============================================================
import { ADAPTER_MODE } from './identity'
import {
  getFormationState, startUnit, saveChapterProgress, markUnitComplete, saveExamResult,
  subscribeToFormationProgress,
} from '../formationProgressStore'
import { getDossierStep, setDossierStep, subscribeToDossierSteps, STEP_LABELS } from '../dossierStepStore'
import { applyPaymentValidation, buildMockPaymentRows } from '../conversion'

function assertLocalMode() {
  if (ADAPTER_MODE !== 'local') throw new Error('formationAdapter: mode "supabase" non implémenté — voir docs/PRODUCTION_WIRING_PLAN.md')
}

export function getFormation(clientId) { assertLocalMode(); return getFormationState(clientId) }
export function startFormationUnit(clientId, unitId) { assertLocalMode(); return startUnit(clientId, unitId) }
export function completeChapter(clientId, chapterId) { assertLocalMode(); return saveChapterProgress(clientId, chapterId) }
export function completeUnit(clientId, unitId, totalHours) { assertLocalMode(); return markUnitComplete(clientId, unitId, totalHours) }
export function recordExamResult(clientId, examType, score, total) { assertLocalMode(); return saveExamResult(clientId, examType, score, total) }
export function subscribeToFormation(callback) { assertLocalMode(); return subscribeToFormationProgress(callback) }

export function getDossierStepFor(clientId, defaultStep) { assertLocalMode(); return getDossierStep(clientId, defaultStep) }
export function advanceDossierStep(clientId, step) { assertLocalMode(); return setDossierStep(clientId, step) }
export function subscribeToDossier(callback) { assertLocalMode(); return subscribeToDossierSteps(callback) }
export { STEP_LABELS }

// Le "gate" de paiement n'est jamais contourné ici : applyPaymentValidation
// exige déjà un pack sélectionné (même garde-fou que le bouton live
// disabled={!packId}) — voir conversion.js. Ne PAS modifier cette règle.
export function validatePayment(leads, leadId) { assertLocalMode(); return applyPaymentValidation(leads, leadId) }
export function buildPaymentRows(pack, finalPrice) { assertLocalMode(); return buildMockPaymentRows(pack, finalPrice) }
