// Point d'entrée unique des adaptateurs Preview/Production — voir
// docs/PRODUCTION_WIRING_PLAN.md pour le plan complet. Chaque adaptateur
// expose ADAPTER_MODE='local' (jamais 'supabase' dans ce commit) et lève
// une exception explicite si jamais appelé autrement — aucune bascule
// runtime possible via variable d'environnement.
import { ADAPTER_MODE } from './identity'

// Assertion AU CHARGEMENT DU MODULE (pas seulement à l'appel de chaque
// fonction) : si l'adaptateur n'est pas en mode 'local', le simple fait
// d'importer ce fichier lève immédiatement — aucune Preview ne peut
// démarrer dans un état où un adaptateur pointerait vers Supabase par
// accident, avant même qu'un composant n'appelle quoi que ce soit. Tous
// les autres adaptateurs (documents/marketing/support/formation) importent
// leur propre ADAPTER_MODE depuis ce même fichier identity.js, donc cette
// unique vérification couvre toute la couche.
if (ADAPTER_MODE !== 'local') {
  throw new Error(`adapters/index.js: mode "${ADAPTER_MODE}" refusé au chargement du module — voir docs/PRODUCTION_WIRING_PLAN.md avant toute activation volontaire.`)
}

export * as identity from './identity'
export * as documentsAdapter from './documentsAdapter'
export * as marketingAdapter from './marketingAdapter'
export * as supportAdapter from './supportAdapter'
export * as formationAdapter from './formationAdapter'
