// Journal chronologique permanent des actions, par client (clé = lead.id).
// Stockage local uniquement (localStorage) — survit au refresh, jamais
// remplacé (append-only), trié du plus récent au plus ancien à la lecture.
const STORAGE_KEY = 'oriafen-activity-log-v1'
const CHANGE_EVENT = 'oriafen-activity-log-change'

function readAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

function nowLabel() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Les entrées historiques (ex : envois initiaux datés dans le passé) doivent
// se trier à leur vraie date, pas à l'instant où elles ont été enregistrées
// dans le store — on parse donc le libellé "jj/mm/aaaa · HH:MM" pour trier.
function parseLabelDate(value) {
  if (!value) return 0
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4}) · (\d{2}):(\d{2})$/)
  if (!match) return 0
  return new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}:00`).getTime()
}

// author: 'Équipe' | 'Client'
// dedupeKey (optionnel) : si un événement avec la même clé existe déjà pour
// ce client, on ne le rejoue pas (évite les doublons quand une action comme
// "marquer vu" est retriggée par plusieurs vues/effets).
export function logActivity(clientId, { author, action, detail = null, dedupeKey = null, at = null }) {
  if (!clientId || !author || !action) return
  const data = readAll()
  const list = data[clientId] || []

  if (dedupeKey && list.some(e => e.dedupeKey === dedupeKey)) return

  const label = at || nowLabel()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author,
    action,
    detail,
    dedupeKey,
    at: label,
    ts: Date.now(),
    sortTs: parseLabelDate(label) || Date.now(),
  }

  data[clientId] = [entry, ...list]
  writeAll(data)
}

export function getActivityLog(clientId) {
  const list = (readAll()[clientId] || []).slice()
  return list.sort((a, b) => (b.sortTs ?? b.ts ?? 0) - (a.sortTs ?? a.ts ?? 0))
}

export function subscribeToActivityLog(callback) {
  const handler = () => callback()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
