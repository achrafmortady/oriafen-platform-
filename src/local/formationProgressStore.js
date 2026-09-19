// Progression Formation IAS1 — store local (localStorage), même convention
// que le reste de V2 (documentsStore.js, clientTrackingStore.js...).
//
// Restauration V1->V2 (audit 2026-09-19) : MaFormation.jsx (live) pilotait
// sa progression via src/lib/api.js (fetchFormationProgress,
// fetchChapterProgress, saveChapterProgress, markUnitComplete, startUnit,
// fetchExamResults, saveExamResult) + useAuth() pour l'id utilisateur —
// aucun des deux n'est disponible dans le shell V2 (pas d'AuthProvider, pas
// d'appel Supabase). Ce store reproduit le même modèle de données
// (unités avec status/completedHours, chapitres complétés, résultats
// d'examen) en local uniquement, jamais d'appel réseau.
//
// FORMATION_UNITS / IAS1_QUESTIONS sont réutilisés tels quels depuis
// src/data/mockData.js (contenu réel V1, jamais dupliqué/réinventé).

import { FORMATION_UNITS, IAS1_QUESTIONS } from '../data/mockData'

export { IAS1_QUESTIONS }

const STORAGE_KEY = 'oriafen-formation-progress-v1'
const CHANGE_EVENT = 'oriafen-formation-progress-change'

function nowLabel() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

function ensureClient(data, clientId) {
  if (!data[clientId]) data[clientId] = { completedChapters: [], unitOverrides: {}, examResults: [] }
  return data[clientId]
}

// Reconstruit le tableau `units` dans le MÊME format que FORMATION_UNITS
// (id, title, totalHours, completedHours, status, description, chapters),
// en appliquant les overrides locaux (unité complétée / débloquée) —
// reproduit exactement le comportement de fetchFormationProgress() côté
// live : la première unité est "in_progress" par défaut, les suivantes
// "locked" tant qu'elles ne sont pas explicitement débloquées.
function computeUnits(client) {
  return FORMATION_UNITS.map((unit, i) => {
    const override = client.unitOverrides[unit.id]
    if (override) return { ...unit, ...override }
    return { ...unit, status: i === 0 ? 'in_progress' : 'locked', completedHours: 0 }
  })
}

export function getFormationState(clientId) {
  const data = readAll()
  const client = ensureClient(data, clientId)
  return {
    units: computeUnits(client),
    completedChapters: new Set(client.completedChapters),
    examResults: client.examResults.slice().sort((a, b) => b.ts - a.ts),
  }
}

// startUnit : équivalent local de l'appel live (marque simplement l'unité
// comme "in_progress" si elle ne l'est pas encore) — idempotent.
export function startUnit(clientId, unitId) {
  const data = readAll()
  const client = ensureClient(data, clientId)
  if (client.unitOverrides[unitId]?.status) return
  client.unitOverrides[unitId] = { ...client.unitOverrides[unitId], status: 'in_progress', completedHours: client.unitOverrides[unitId]?.completedHours ?? 0 }
  writeAll(data)
}

// saveChapterProgress : append-only (Set), jamais d'écrasement d'un
// chapitre déjà marqué complété par un autre.
export function saveChapterProgress(clientId, chapterId) {
  const data = readAll()
  const client = ensureClient(data, clientId)
  if (client.completedChapters.includes(chapterId)) return
  client.completedChapters = [...client.completedChapters, chapterId]
  writeAll(data)
}

// markUnitComplete : reproduit handleUnitComplete (MaFormation.jsx, live) —
// marque l'unité "completed" (heures = totalHours) ET débloque l'unité
// suivante (locked -> in_progress) si ce n'est pas déjà fait.
export function markUnitComplete(clientId, unitId, totalHours) {
  const data = readAll()
  const client = ensureClient(data, clientId)
  client.unitOverrides[unitId] = { status: 'completed', completedHours: totalHours }
  const idx = FORMATION_UNITS.findIndex(u => u.id === unitId)
  const nextUnit = FORMATION_UNITS[idx + 1]
  if (nextUnit) {
    const nextState = computeUnits(client).find(u => u.id === nextUnit.id)
    if (nextState?.status === 'locked') client.unitOverrides[nextUnit.id] = { status: 'in_progress', completedHours: 0 }
  }
  writeAll(data)
}

// saveExamResult : append-only, la tentative la plus récente en tête
// (getFormationState trie déjà par ts DESC) — jamais d'écrasement d'un
// résultat précédent.
export function saveExamResult(clientId, examType, score, total) {
  const data = readAll()
  const client = ensureClient(data, clientId)
  const result = { exam_type: examType, score, total, at: nowLabel(), ts: Date.now() }
  client.examResults = [result, ...client.examResults]
  writeAll(data)
  return result
}

export function subscribeToFormationProgress(callback) {
  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}
