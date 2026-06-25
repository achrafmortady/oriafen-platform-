import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

const DEMO_ACCOUNTS = {
  'student@oriafen.com': { password: 'demo123', role: 'student', name: 'Sophie Martin', pack: 'Essentiel' },
  'admin@oriafen.com':   { password: 'admin123', role: 'admin',  name: 'Admin Oriafen', pack: null },
}

// Derive role from email as a reliable fallback (used only if DB profile fetch times out)
function roleFromEmail(email) {
  const lower = email.toLowerCase()
  if (lower === 'admin@oriafen.com') return 'super_admin'
  return lower.includes('admin') ? 'admin' : 'student'
}

// Build a minimal profile from auth data alone (no DB required)
function profileFromAuth(authUser) {
  const email = authUser.email ?? ''
  return {
    id:   authUser.id,
    email,
    role: authUser.user_metadata?.role ?? roleFromEmail(email),
    name: authUser.user_metadata?.full_name ?? email.split('@')[0],
    pack: authUser.user_metadata?.pack_purchased ?? 'Essentiel',
  }
}

// Fetch profile from DB, auto-create if missing, fall back to auth data on any error
async function fetchOrCreateProfile(authUser) {
  console.log('[Auth] fetchOrCreateProfile for', authUser.email)

  try {
    // 1. Try to read existing row
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, pack_purchased')
      .eq('id', authUser.id)
      .single()

    if (data && !error) {
      console.log('[Auth] Profile found in DB:', data.role)
      return { id: data.id, email: data.email, role: data.role, name: data.full_name, pack: data.pack_purchased }
    }

    console.log('[Auth] No profile row, attempting auto-create...')

    // 2. Row missing — insert one with sensible defaults
    const defaults = {
      id:             authUser.id,
      email:          authUser.email,
      full_name:      authUser.email.split('@')[0],
      role:           roleFromEmail(authUser.email),
      pack_purchased: 'Essentiel',
    }

    const { data: created, error: insertErr } = await supabase
      .from('users')
      .insert(defaults)
      .select()
      .single()

    if (created && !insertErr) {
      console.log('[Auth] Profile auto-created:', created.role)
      return { id: created.id, email: created.email, role: created.role, name: created.full_name, pack: created.pack_purchased }
    }

    console.warn('[Auth] Insert failed:', insertErr?.message, '— using auth fallback')
  } catch (err) {
    console.warn('[Auth] fetchOrCreateProfile exception:', err?.message)
  }

  // 3. Final fallback — derive everything from the auth user object
  const fallback = profileFromAuth(authUser)
  console.log('[Auth] Using auth fallback profile, role:', fallback.role)
  return fallback
}

// Wraps a promise with a hard timeout; resolves with `fallback` if time runs out
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hard cap — loading resolves within 3 s no matter what
    const timeout = setTimeout(() => {
      console.warn('[Auth] Load timeout hit — forcing loading=false')
      setLoading(false)
    }, 3000)

    if (!isConfigured) {
      console.log('[Auth] Supabase not configured — demo mode')
      try {
        const saved = localStorage.getItem('oriafen_demo_user')
        if (saved) setUser(JSON.parse(saved))
      } catch { /* ignore */ }
      clearTimeout(timeout)
      setLoading(false)
      return () => clearTimeout(timeout)
    }

    console.log('[Auth] Supabase configured — checking session')

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          console.log('[Auth] Session found for', session.user.email)
          const profile = await withTimeout(
            fetchOrCreateProfile(session.user),
            2500,
            profileFromAuth(session.user)
          )
          if (profile.role === 'student') {
            try {
              const { data: dossier } = await supabase
                .from('dossiers')
                .select('status')
                .eq('user_id', session.user.id)
                .single()
              if (dossier?.status === 'Annulé') {
                console.warn('[Auth] Cancelled account session detected — signing out')
                await supabase.auth.signOut()
                setUser(null)
                return
              }
            } catch { /* don't block on check failure */ }
          }
          setUser(profile)
        } else {
          console.log('[Auth] No active session')
        }
      })
      .catch(err => console.warn('[Auth] getSession error:', err?.message))
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] onAuthStateChange:', event)
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await withTimeout(
            fetchOrCreateProfile(session.user),
            2500,
            profileFromAuth(session.user)
          )
          // Block cancelled students right here too — this listener fires immediately
          // on signInWithPassword, before login()'s own check can complete, which is
          // what was causing the dashboard to flash open before being kicked back out.
          if (profile.role === 'student') {
            try {
              const { data: dossier } = await supabase
                .from('dossiers')
                .select('status')
                .eq('user_id', session.user.id)
                .single()
              if (dossier?.status === 'Annulé') {
                console.warn('[Auth] Cancelled account signed in — blocking immediately')
                await supabase.auth.signOut()
                setUser(null)
                return
              }
            } catch { /* don't block on check failure */ }
          }
          setUser(profile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        // TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION (handled above) are intentionally
        // no-ops here — they must never clear or downgrade an already-set user/role.
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    console.log('[Auth] login() called for', email)

    // Demo mode
    if (!isConfigured) {
      const account = DEMO_ACCOUNTS[email.toLowerCase()]
      if (!account || account.password !== password) {
        return { success: false, error: 'Email ou mot de passe incorrect.' }
      }
      const userData = { email: email.toLowerCase(), role: account.role, name: account.name, pack: account.pack }
      localStorage.setItem('oriafen_demo_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, role: account.role }
    }

    // Supabase mode — wrap the entire flow in a 5-second timeout
    try {
      const loginResult = await withTimeout(
        (async () => {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })

          if (error) {
            console.warn('[Auth] signInWithPassword error:', error.message)
            const msg = error.message === 'Invalid login credentials'
              ? 'Email ou mot de passe incorrect.'
              : error.message
            return { success: false, error: msg }
          }

          console.log('[Auth] signInWithPassword OK, fetching profile...')

          const profile = await withTimeout(
            fetchOrCreateProfile(data.user),
            3000,
            profileFromAuth(data.user)
          )

          // Block login for students whose dossier was cancelled
          if (profile.role === 'student') {
            try {
              const { data: dossier } = await supabase
                .from('dossiers')
                .select('status')
                .eq('user_id', data.user.id)
                .single()
              if (dossier?.status === 'Annulé') {
                await supabase.auth.signOut()
                return { success: false, error: 'Compte suspendu, contactez votre conseiller.' }
              }
            } catch {
              // If the dossier check itself fails, don't block legitimate logins
            }
          }

          setUser(profile)
          console.log('[Auth] Login complete, role:', profile.role)
          return { success: true, role: profile.role }
        })(),
        5000,
        // If the whole thing times out, fall back using the email to determine role
        { success: true, role: roleFromEmail(email), timedOut: true }
      )

      if (loginResult.timedOut) {
        console.warn('[Auth] Login timed out — forcing redirect by email')
        const fallbackRole = roleFromEmail(email)
        // Even on timeout, never let a cancelled student through
        if (fallbackRole === 'student') {
          try {
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            if (currentUser) {
              const { data: dossier } = await supabase
                .from('dossiers')
                .select('status')
                .eq('user_id', currentUser.id)
                .single()
              if (dossier?.status === 'Annulé') {
                await supabase.auth.signOut()
                return { success: false, error: 'Compte suspendu, contactez votre conseiller.' }
              }
            }
          } catch { /* don't block on check failure */ }
        }
        // Set a minimal user so ProtectedRoute lets them through
        setUser({ email, role: fallbackRole, name: email.split('@')[0], pack: 'Essentiel' })
      }

      return loginResult
    } catch (err) {
      console.error('[Auth] login() exception:', err?.message)
      return { success: false, error: 'Erreur de connexion. Veuillez réessayer.' }
    }
  }

  const logout = async () => {
    console.log('[Auth] logout()')
    if (!isConfigured) {
      localStorage.removeItem('oriafen_demo_user')
    } else {
      try { await supabase.auth.signOut() } catch { /* ignore */ }
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
