// Utilitaires de date partagés pour l'historique 360 (fiche Client) et la
// timeline CRM (fiche Prospect). Un seul format d'écriture désormais :
// "JJ/MM/AAAA · HH:MM" (même convention que src/local/activityLog.js /
// clientTrackingStore.js / documentsStore.js) — formatNowLabel() doit être
// utilisé partout où une nouvelle entrée d'historique est créée localement,
// pour que tri et affichage restent cohérents dans toute l'app.
//
// parseFlexibleDate() reste tolérant en lecture (au cas où une donnée plus
// ancienne utilise encore new Date().toLocaleString('fr-FR'), ou une chaîne
// non standard type "Données de démonstration") : si la date ne peut pas
// être interprétée avec confiance, on renvoie null plutôt que d'inventer un
// horodatage — l'appelant doit alors afficher "Non renseigné".

function pad(n) { return String(n).padStart(2, '0') }

export function formatNowLabel(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Format d'affichage demandé pour l'historique 360 : "JJ/MM/AAAA - HH:mm"
export function formatDisplayDate(date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} - ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const LABEL_RE = /^(\d{2})\/(\d{2})\/(\d{4})\s*[·,-]?\s*(\d{2}):(\d{2})/

export function parseFlexibleDate(value) {
  if (!value) return null
  const match = String(value).match(LABEL_RE)
  if (match) {
    const [, dd, mm, yyyy, HH, MM] = match
    const d = new Date(`${yyyy}-${mm}-${dd}T${HH}:${MM}:00`)
    return Number.isNaN(d.getTime()) ? null : d
  }
  // Repli : chaînes ISO ou dates génériques (ex: uploadedAt de documentsStore
  // au format "JJ/MM/AAAA · HH:MM" est déjà couvert ci-dessus ; ceci ne sert
  // qu'aux éventuelles dates ISO déjà stockées telles quelles).
  const generic = new Date(value)
  return Number.isNaN(generic.getTime()) ? null : generic
}

// Renvoie la chaîne d'affichage "JJ/MM/AAAA - HH:mm", ou null si la valeur
// d'origine n'est pas interprétable avec confiance (jamais d'invention).
export function toDisplayDateSafe(value) {
  const d = parseFlexibleDate(value)
  return d ? formatDisplayDate(d) : null
}

export function toTimestampSafe(value) {
  const d = parseFlexibleDate(value)
  return d ? d.getTime() : null
}

// Convertit une valeur <input type="date"> (YYYY-MM-DD) en libellé JJ/MM/AAAA
// pour les entrées d'historique "Échéance modifiée — ..." (voir
// applyNextActionUpdate, clientHistory.js) — jamais de date inventée : une
// valeur vide/non interprétable est renvoyée telle quelle.
export function formatDueDateLabel(due) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(due || '')
  return match ? `${match[3]}/${match[2]}/${match[1]}` : due
}
