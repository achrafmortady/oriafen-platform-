// Étapes du dossier ORIAS, pilotées manuellement par l'admin — store local
// (localStorage), même convention que le reste de V2.
//
// Restauration V1 -> V2 (audit 2026-09-19) : src/pages/admin/Dashboard.jsx
// > DossierSection (live, non modifié) permet à l'admin de faire avancer un
// client étape par étape (bouton "Valider →", via updateDossierStep() ->
// Supabase). Reproduit ici en local uniquement : la même liste de 6 étapes
// (STEP_LABELS côté live = ORIAS_STEPS déjà utilisé par
// clientsOverviewData.js, réutilisé tel quel) avec un override stocké par
// client, prioritaire sur le calcul déterministe existant (stepIndex basé
// sur l'id) qui reste la valeur par défaut tant qu'aucune action admin n'a
// eu lieu.
import { ORIAS_STEPS } from './clientsOverviewData'

export { ORIAS_STEPS as STEP_LABELS }

const STORAGE_KEY = 'oriafen-dossier-steps-v1'
const CHANGE_EVENT = 'oriafen-dossier-steps-change'

function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

// defaultStep (1-based, requis) : valeur déterministe déjà calculée côté
// appelant (clientsOverviewData.deriveDossier -> stepIndex+1) — utilisée
// tant qu'aucun override admin n'existe pour ce client.
export function getDossierStep(clientId, defaultStep) {
  const data = readAll()
  return data[clientId] ?? defaultStep
}

export function setDossierStep(clientId, step) {
  const data = readAll()
  data[clientId] = Math.max(1, Math.min(ORIAS_STEPS.length, step))
  writeAll(data)
}

export function subscribeToDossierSteps(callback) {
  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}
