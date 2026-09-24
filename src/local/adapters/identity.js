// ============================================================
// IDENTITY ADAPTER — la SEULE source de vérité pour "quel est le client
// actif" dans toute la Preview V2. Tous les composants qui ont besoin d'un
// clientId doivent appeler getActiveIdentity() ici plutôt que d'importer
// CANONICAL_DEMO_CLIENT_ID directement — c'est le point d'ancrage unique où
// brancher l'authentification réelle plus tard (voir CONTRAT PRODUCTION
// ci-dessous), sans toucher au reste du code.
//
// Chaîne d'identité réelle côté V1 (origin/main, inspectée en lecture
// seule — voir src/context/AuthContext.jsx, src/lib/api.js) :
//
//   auth.users.id (UUID Supabase Auth, session)
//     === public.users.id (même PK, ligne créée automatiquement au premier
//         login — fetchOrCreateProfile()) — colonnes : id, email, full_name,
//         role ('student'|'admin'|'super_admin'), pack_purchased, blocked
//     ← référencé par dossiers.user_id, documents.user_id,
//       formation_progress.user_id, chapter_progress.user_id,
//       exam_results.user_id, payments.user_id, support_tickets.user_id,
//       (et selon le README existant : client_messages, notifications —
//       colonnes exactes à confirmer sur le schéma live avant activation)
//
//   leads.id (pipeline CRM, prospect AVANT conversion)
//     → leads.converted_user_id → public.users.id (une fois converti,
//       voir convertLeadToClient(), src/lib/api.js)
//
// Autrement dit : "l'identité canonique d'un client" pour TOUT ce qui est
// scope-par-client (documents, marketing, support, formation, dossier,
// paiements) est TOUJOURS public.users.id — jamais leads.id directement.
// Un admin qui navigue depuis une fiche CRM (leads.id) doit résoudre
// leads.converted_user_id AVANT d'appeler les stores/adapters ci-dessous.
//
// ============================================================
// CONTRAT PRODUCTION (préparé, PAS activé) :
//
//   Preview (ADAPTER_MODE='local', valeur actuelle, câblée en dur) :
//     getActiveIdentity() renvoie toujours le client canonique de démo
//     (CANONICAL_DEMO_CLIENT_ID / CANONICAL_DEMO_CLIENT_NAME, model.js).
//
//   Production (ADAPTER_MODE='supabase', JAMAIS activé dans ce commit) :
//     getActiveIdentity() devrait lire useAuth() (AuthContext, déjà
//     intact/non modifié) et renvoyer { id: user.id, name: user.name,
//     email: user.email, role: user.role } — id = public.users.id (UUID),
//     jamais un id de lead. Ceci nécessite que getActiveIdentity() devienne
//     un hook React (useActiveIdentity()) ou reçoive le user en paramètre
//     depuis le composant appelant, puisque useAuth() ne peut être appelé
//     que depuis l'intérieur d'un AuthProvider (absent de local-main.jsx
//     aujourd'hui — voir docs/PRODUCTION_WIRING_PLAN.md §1).
// ============================================================

import { CANONICAL_DEMO_CLIENT_ID, CANONICAL_DEMO_CLIENT_NAME } from '../model'

// Verrou de sécurité explicite : IMPOSSIBLE de faire basculer ce fichier
// vers 'supabase' sans modifier ce fichier lui-même (jamais via une
// variable d'environnement lue au runtime, pour qu'aucune configuration
// Vercel Preview mal réglée ne puisse jamais activer un mode production par
// accident). Voir docs/PRODUCTION_WIRING_PLAN.md §7 (séparation Preview /
// Production).
export const ADAPTER_MODE = 'local'

// Identité du client de démo en mode Preview — reprend exactement
// model.js (aucun second id inventé ici).
const DEMO_IDENTITY = Object.freeze({
  id: CANONICAL_DEMO_CLIENT_ID,
  name: CANONICAL_DEMO_CLIENT_NAME,
  email: null,
  role: 'client',
})

// getActiveIdentity(override) : renvoie l'identité du client actif.
// `override` (optionnel) permet à l'admin de consulter la fiche d'UN AUTRE
// client (ex: LocalClientsOverview.jsx, LocalDossierSection.jsx — l'admin
// n'est pas "le client actif", il navigue vers un client précis) sans
// jamais passer par ce module pour un client autre que soi-même côté
// ClientSpace. Ne remplace jamais l'admin lui-même par un client.
export function getActiveIdentity(override = null) {
  if (ADAPTER_MODE !== 'local') {
    throw new Error('identity adapter: mode "supabase" non implémenté — voir docs/PRODUCTION_WIRING_PLAN.md avant toute activation')
  }
  if (override && override.id != null) {
    return { id: override.id, name: override.name ?? `Client #${override.id}`, email: override.email ?? null, role: 'client' }
  }
  return DEMO_IDENTITY
}

export function getActiveClientId(override = null) {
  return getActiveIdentity(override).id
}

export function getActiveClientName(override = null) {
  return getActiveIdentity(override).name
}

// Seul point autorisé pour qu'un store (documentsStore.js,
// clientTrackingStore.js, adminNotificationsStore.js…) sache si un clientId
// donné est le client de démo canonique — ex: pour réserver le seed de
// démonstration (documents/messages fictifs) au seul client de démo, jamais
// à un client réellement converti. Ces stores n'importent JAMAIS
// CANONICAL_DEMO_CLIENT_ID directement (voir invariant vérifié par
// local-check-adapters.mjs) — ils passent par cette fonction.
export function isCanonicalDemoClientId(id) {
  return id != null && Number(id) === CANONICAL_DEMO_CLIENT_ID
}
