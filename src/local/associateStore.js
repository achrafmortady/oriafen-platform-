// "Le client a-t-il un associé ?" — store local (localStorage), même
// convention que le reste de V2 (dossierStepStore.js, formationProgressStore.js).
//
// Correctif "documents associé — visibilité conditionnelle" (2026-09-22,
// retour client) : la section "Documents de mon associé" (LocalMesDocuments.jsx)
// et le panneau admin correspondant (LocalClientsOverview.jsx) étaient
// TOUJOURS visibles, même pour un client sans associé — corrigé sur
// demande explicite : "si le client A un associé -> afficher la section ;
// si le client N'A PAS d'associé -> ne pas afficher cette section du
// tout". Nécessite un vrai flag (il n'en existait aucun), réglé UNIQUEMENT
// par l'admin (un client ne peut pas s'auto-déclarer un associé), même
// override existant sur getDossierStep/getFormationState (une valeur par
// défaut — ici `false`, aucun client n'a d'associé par défaut — jusqu'à ce
// qu'une action admin explicite la change).
import { formatNowLabel } from './dateUtils'
import { logActivity } from './activityLog'

const STORAGE_KEY = 'oriafen-client-associate-v1'
const CHANGE_EVENT = 'oriafen-client-associate-change'

function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

// getHasAssociate(clientId) : false par défaut (aucun associé) tant
// qu'aucune action admin n'a explicitement activé ce dossier.
export function getHasAssociate(clientId) {
  const data = readAll()
  return Boolean(data[clientId])
}

export function setHasAssociate(clientId, value, actor = 'Équipe Oriafen') {
  const data = readAll()
  const next = Boolean(value)
  if (Boolean(data[clientId]) === next) return
  data[clientId] = next
  writeAll(data)
  logActivity(clientId, {
    author: 'Équipe',
    action: next ? 'Associé activé pour ce dossier' : 'Associé retiré de ce dossier',
    detail: actor,
    at: formatNowLabel(),
  })
}

export function subscribeToAssociate(callback) {
  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}
