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
import { formatNowLabel } from './dateUtils'
import { logActivity } from './activityLog'

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

function ensureClient(data, clientId) {
  if (!data[clientId]) data[clientId] = { step: null, history: [] }
  // Migration non destructive : d'anciennes données pouvaient stocker
  // directement un nombre (avant l'ajout de l'historique) — normalisé en
  // place, jamais perdu.
  if (typeof data[clientId] === 'number') data[clientId] = { step: data[clientId], history: [] }
  return data[clientId]
}

// defaultStep (1-based, requis) : valeur déterministe déjà calculée côté
// appelant (clientsOverviewData.deriveDossier -> stepIndex+1) — utilisée
// tant qu'aucun override admin n'existe pour ce client.
export function getDossierStep(clientId, defaultStep) {
  const data = readAll()
  const client = data[clientId]
  const step = typeof client === 'number' ? client : client?.step
  return step ?? defaultStep
}

// Historique des changements d'étape (date/heure + acteur), du plus récent
// au plus ancien — corrige le TODO "la date/heure/acteur de chaque
// changement d'étape n'est pas journalisée" (visible précédemment dans
// LocalClientsOverview.jsx). Journalisé aussi dans activityLog.js
// (dedupeKey) pour apparaître dans l'historique 360° du client, comme tout
// autre évènement CRM.
// L'historique est déjà chronologique par construction (append-only, voir
// setDossierStep) — on inverse plutôt que de trier par `ts` : deux
// validations rapprochées peuvent partager le même Date.now() (résolution
// milliseconde), ce qui rendrait un tri par ts ambigu sur une égalité.
export function getDossierStepHistory(clientId) {
  const data = readAll()
  return [...ensureClient(data, clientId).history].reverse()
}

export function setDossierStep(clientId, step, actor = 'Équipe Oriafen') {
  const data = readAll()
  const client = ensureClient(data, clientId)
  const nextStep = Math.max(1, Math.min(ORIAS_STEPS.length, step))
  if (client.step === nextStep) return
  const at = formatNowLabel()
  const label = ORIAS_STEPS[nextStep - 1]
  client.step = nextStep
  client.history = [...client.history, { step: nextStep, label, actor, at, ts: Date.now() }]
  writeAll(data)
  logActivity(clientId, {
    author: 'Équipe',
    action: 'Étape du dossier validée',
    detail: label,
    dedupeKey: `dossier-step:${clientId}:${nextStep}:${at}`,
    at,
  })
}

export function subscribeToDossierSteps(callback) {
  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}
