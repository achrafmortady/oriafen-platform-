// Point d'entrée unique des adaptateurs Preview/Production — voir
// docs/PRODUCTION_WIRING_PLAN.md pour le plan complet. Chaque adaptateur
// expose ADAPTER_MODE='local' (jamais 'supabase' dans ce commit) et lève
// une exception explicite si jamais appelé autrement — aucune bascule
// runtime possible via variable d'environnement.
export * as identity from './identity'
export * as documentsAdapter from './documentsAdapter'
export * as marketingAdapter from './marketingAdapter'
export * as supportAdapter from './supportAdapter'
export * as formationAdapter from './formationAdapter'
