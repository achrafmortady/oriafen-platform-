// ============================================================
// FORMATION IAS1 — production implementation (NOT activated, see
// ./_guard.js). Thin wrapper around src/lib/api.js (V1, unmodified).
//
// Confirmed (read-only, api.js:362-465):
//   formation_progress: id, user_id, unit_number, hours_completed,
//     completed. Upsert onConflict('user_id,unit_number').
//   chapter_progress: user_id, chapter_id (composite, no `id` seen —
//     upsert onConflict('user_id,chapter_id')). Comment at api.js:634 notes
//     it references auth.users, not public.users, directly.
//   exam_results: user_id, exam_type, score, passed, completed_at
//     (order-by only, likely a DB default, never set explicitly on insert).
// Classification: A — schema already sufficient, no migration needed.
// Same source must feed both the dashboard summary widget and the
// Formation IAS1 page (see clientsOverviewData.js/LocalMonDossier.jsx
// local-side fix, 2026-09-20) — getProgress()/getChapters() below are the
// single functions both call once wired.
// ============================================================
import { assertProductionAdapterActive } from './_guard'
import {
  fetchFormationProgress, markUnitComplete, startUnit, fetchChapterProgress,
  saveChapterProgress, fetchExamResults, saveExamResult,
} from '../../../lib/api'

function guard() { assertProductionAdapterActive('formation.supabase.js') }

export function getProgress(userId) { guard(); return fetchFormationProgress(userId) }
export function completeUnit(userId, unitNumber, totalHours) { guard(); return markUnitComplete(userId, unitNumber, totalHours) }
export function startFormationUnit(userId, unitNumber) { guard(); return startUnit(userId, unitNumber) }

export function getChapters(userId) { guard(); return fetchChapterProgress(userId) }
export function completeChapter(userId, chapterId) { guard(); return saveChapterProgress(userId, chapterId) }

export function getExamResults(userId) { guard(); return fetchExamResults(userId) }
export function recordExamResult(userId, examType, score, totalQuestions) { guard(); return saveExamResult(userId, examType, score, totalQuestions) }
