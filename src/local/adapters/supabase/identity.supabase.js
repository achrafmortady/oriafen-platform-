// ============================================================
// IDENTITY — production implementation (NOT activated, see ./_guard.js).
//
// Confirmed from src/lib/api.js (read-only, V1) + src/context/AuthContext.jsx:
//   auth.users.id (uuid, session)
//     === public.users.id  — columns confirmed in use: id, email, full_name,
//       role, pack_id, blocked, created_at (api.js:586-629, 744-748,
//       1178-1198, 1512-1516). role values seen: 'student', 'admin',
//       'super_admin' (api.js:1180 — .in('role', ['admin','super_admin'])).
//       No client-side code ever creates a super_admin row.
//   leads.converted_user_id -> public.users.id (api.js:1111-1114,
//     convertLeadToClient) — the ONLY place a lead id turns into a real
//     user id. Everything else (documents, formation, dossier, payments,
//     messages, notifications) is keyed by public.users.id, never leads.id.
//
// NO "Client Demo" fallback here: getIdentity() throws if there is no
// authenticated user, it never substitutes a demo identity.
// ============================================================
import { assertProductionAdapterActive } from './_guard'

// Shape mirrors src/local/adapters/identity.js's getActiveIdentity() return
// value exactly ({id, name, email, role}) so a future swap only needs to
// change the import at each call site.
export function getIdentityFromAuthUser(authUser) {
  assertProductionAdapterActive('identity.supabase.js')
  if (!authUser || authUser.id == null) {
    throw new Error('identity.supabase.js: aucun utilisateur authentifié — jamais de repli "Client Démo" en production.')
  }
  return {
    id: authUser.id, // public.users.id (uuid) === auth.users.id
    name: authUser.full_name ?? authUser.name ?? null,
    email: authUser.email ?? null,
    role: authUser.role, // 'student' | 'admin' | 'super_admin'
  }
}

export function isAdminRole(role) { assertProductionAdapterActive('identity.supabase.js'); return role === 'admin' || role === 'super_admin' }
export function isSuperAdminRole(role) { assertProductionAdapterActive('identity.supabase.js'); return role === 'super_admin' }
export function isBlocked(authUser) { assertProductionAdapterActive('identity.supabase.js'); return Boolean(authUser?.blocked) }

// Résout leads.converted_user_id -> public.users.id (jamais l'inverse) —
// un admin qui navigue depuis une fiche CRM (leads.id) doit passer par ici
// avant d'appeler n'importe quel autre adaptateur de ce dossier.
export function resolveClientIdFromLead(lead) {
  assertProductionAdapterActive('identity.supabase.js')
  if (!lead?.converted_user_id) return null
  return lead.converted_user_id
}
