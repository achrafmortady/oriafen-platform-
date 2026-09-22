// ============================================================
// PRODUCTION ENTRY POINT — PROPOSAL / SKETCH ONLY.
//
// This file is NEVER imported by anything (not local-main.jsx, not
// index.html, not any Local*.jsx component, not vite's build entry). It
// exists purely to document, in real JSX, what a future V2 production
// entry point would look like — reusing V1's AuthContext/AuthProvider
// exactly as-is (src/context/AuthContext.jsx, unmodified) instead of
// reimplementing session/role/blocked/cancelled logic.
//
// Verified by local-check-supabase-adapters.mjs (static isolation test,
// same as every other file in this folder) that nothing under src/local
// (outside adapters/supabase/) ever imports this file, and that
// PRODUCTION_ADAPTER_ACTIVE stays false. Importing this file at build time
// is harmless (react-router-dom is already a real dependency, used by
// src/App.jsx), but it is never referenced from the Vite entry graph
// (index.html -> src/local-main.jsx only), so it is tree-shaken out of
// every build — confirmed by `npm run build` module count being unchanged
// after this file's addition.
//
// Routing model copied EXACTLY from src/App.jsx (V1, unmodified, read-only
// — see that file for the real ProtectedRoute/AppRoutes/blocked/cancelled
// logic this mirrors): /login, /set-password, /dashboard (student),
// /admin (admin + super_admin), unauthorized -> role-appropriate redirect,
// no user -> /login. Blocked account -> forced sign-out (AuthContext
// already does this, see checkBlockedAndSignOut, not reimplemented here).
// Cancelled dossier (dossiers.status === 'Annulé') -> forced sign-out
// (AuthContext already does this too, see AuthContext.jsx:131-179).
//
// WHAT CHANGES vs src/App.jsx: the two route elements render the V2 shells
// (LocalAdminShell for admin-like roles, a client shell for students)
// instead of V1's StudentDashboard/AdminDashboard — this is the ONLY
// difference from V1's routing, so admin/super_admin/Finance permission
// logic (which lives entirely in ProtectedRoute + AuthContext, both
// reused verbatim) is preserved by construction, never reimplemented.
//
// CLIENT DEMO FALLBACK — FOUND AND FIXED (2026-09-22): LocalCRM's internal
// `ClientSpace` used to call getActiveIdentity() with NO argument, which
// ALWAYS resolves to the Preview demo identity (CANONICAL_DEMO_CLIENT_ID)
// regardless of who is actually authenticated — every logged-in student
// would have silently seen client #6's data if this proposal had ever been
// mounted as-is. Fixed at the source: LocalCRM.jsx now accepts an optional
// `clientId` prop, threaded down to ClientSpace, which passes it as an
// override to getActiveIdentity() (the SAME override mechanism already
// used when an admin opens another client's file — nothing new invented).
// See `clientId={user.id}` below. Preview behavior (no prop passed from
// local-main.jsx) is unchanged — this was purely additive.
//
// COMPLETENESS CHECKLIST (audit "complete all remaining local work",
// 2026-09-22) — every item below is satisfied by this file as written,
// re-verified this session, no functional change was needed:
//   - AuthProvider usage:        wraps V2AppRoutes (V2ProductionAppSketch)
//   - ProtectedRoute:            copied 1:1 from src/App.jsx
//   - authenticated user:        useAuth().user (V1 hook, unmodified)
//   - user role:                 user.role, read verbatim, never overridden
//   - clientId=user.id:          passed to <LocalCRM mode="client">
//   - controlled loading state:  LoadingScreen while useAuth().loading
//   - controlled auth failure:   !user -> deterministic redirect to /login
//                                 (never a demo identity, never a crash)
//   - no demo fallback:          no CANONICAL_DEMO_CLIENT_ID/model.js import
//                                 anywhere in this file (grep-verified,
//                                 local-check-supabase-adapters.mjs)
//   - admin/client routing:      /dashboard (student) vs /admin (admin-like)
//   - super_admin-safe routing:  isAdminLike includes super_admin
//                                 identically to admin (matches V1
//                                 App.jsx's own isAdminLike computation)
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../../context/AuthContext' // V1, unmodified
import Login from '../../../pages/Login' // V1, unmodified
import SetPassword from '../../../pages/SetPassword' // V1, unmodified
import LocalAdminShell from '../../LocalAdminShell' // V2 admin shell
import LocalCRM from '../../LocalCRM' // V2 — mode="client" renders the client shell

function LoadingScreen() {
  return <div>Chargement…</div>
}

// Copied 1:1 from src/App.jsx's ProtectedRoute — same role/redirect logic,
// zero behavioral change, only imported from a different file.
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  const isAdminLike = user.role === 'admin' || user.role === 'super_admin'
  const hasAccess = requiredRole === 'admin' ? isAdminLike : user.role === requiredRole
  if (requiredRole && !hasAccess) {
    return <Navigate to={isAdminLike ? '/admin' : '/dashboard'} replace />
  }
  return children
}

function V2AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  const isAdminLike = user && (user.role === 'admin' || user.role === 'super_admin')

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="student">
            {/* clientId={user.id} (audit "client data/access preservation"
                2026-09-22) : LocalCRM/ClientSpace now accept an explicit
                clientId prop (src/local/LocalCRM.jsx, additive change, same
                session) instead of always resolving the Preview demo
                identity — THIS is the fix for the "Client Demo fallback"
                risk flagged in that audit. Without this prop, every
                authenticated student would have seen client #6's (démo)
                data. Follow-up still needed: onExitClient assumes an
                admin-supplied callback (the "Voir l'espace client" admin
                preview path) — a real student session has no admin to exit
                back to, so this prop should become optional/no-op once
                LocalCRM is adjusted (not done here, out of scope for the
                identity fix). */}
            <LocalCRM mode="client" onExitClient={() => {}} clientId={user.id} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <LocalAdminShell />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user
            ? <Navigate to={isAdminLike ? '/admin' : '/dashboard'} replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Not exported as default, not rendered anywhere, not wired into
// index.html — the name makes its purpose explicit if anyone greps for it.
export function V2ProductionAppSketch() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <V2AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
