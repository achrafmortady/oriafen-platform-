// ============================================================
// GUARD partagé par TOUS les fichiers de src/local/adapters/supabase/*.
//
// Ces fichiers contiennent l'implémentation "production" réelle : ils
// importent src/lib/api.js (V1, non modifié) et appellent donc, une fois
// activés, le vrai client Supabase (via src/lib/supabase.js). Dans CE
// commit, ils ne sont JAMAIS activés :
//   - PRODUCTION_ADAPTER_ACTIVE est une constante codée en dur (jamais lue
//     depuis une variable d'environnement), exactement la même convention
//     que ADAPTER_MODE dans ../identity.js.
//   - Chaque fonction exportée par ces fichiers appelle assertProductionAdapterActive()
//     en premier et lève avant tout appel à api.js.
//   - Aucun fichier de src/local/adapters/supabase/* n'est ré-exporté par
//     src/local/adapters/index.js (voir ce fichier) — la Preview
//     (local-main.jsx -> LocalAdminShell -> Local*.jsx) n'importe jamais ce
//     dossier, directement ou transitivement. Vérifié statiquement par
//     local-check-supabase-adapters.mjs.
//   - src/lib/api.js lui-même ne fait AUCUN appel réseau tant que
//     src/lib/supabase.js exporte isConfigured=false/supabase=null (c'est
//     le cas dans ce checkout, non modifié) — chaque fonction api.js
//     commence par `if (!isConfigured) return ...` avant tout `.from()`.
//     Ce guard est donc une DEUXIÈME barrière, pas la seule.
//
// Activation future (documentée, non exécutée) : voir
// docs/PRODUCTION_WIRING_PLAN.md — changer PRODUCTION_ADAPTER_ACTIVE à true
// SEULEMENT après avoir (1) confirmé isConfigured=true dans un environnement
// réellement configuré pour Supabase, (2) revu chaque fichier de ce dossier
// un par un, jamais globalement d'un coup.
// ============================================================

export const PRODUCTION_ADAPTER_ACTIVE = false

export function assertProductionAdapterActive(moduleName) {
  if (!PRODUCTION_ADAPTER_ACTIVE) {
    throw new Error(`${moduleName}: adaptateur production désactivé (PRODUCTION_ADAPTER_ACTIVE=false) — voir docs/PRODUCTION_WIRING_PLAN.md avant toute activation volontaire.`)
  }
}
