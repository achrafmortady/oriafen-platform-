import { useState, useEffect, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const { user, login, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const timerRef = useRef(null)

  // Clear the safety timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  const doRedirect = (role) => {
    navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Safety valve: if login() never returns within 5 s, redirect by email
    timerRef.current = setTimeout(() => {
      console.warn('[Login] 5-second timeout — forcing redirect')
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'student'
      doRedirect(role)
    }, 5000)

    try {
      const result = await login(email, password)
      clearTimeout(timerRef.current)
      setLoading(false)

      if (result.success) {
        doRedirect(result.role)
      } else {
        setError(result.error ?? 'Erreur de connexion.')
      }
    } catch (err) {
      clearTimeout(timerRef.current)
      setLoading(false)
      console.error('[Login] handleSubmit exception:', err?.message)
      setError('Erreur inattendue. Veuillez réessayer.')
    }
  }

  return (
    <div className="min-h-screen bg-orias-green flex flex-col items-center justify-center px-4 py-12">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute top-0 left-0 w-full h-full opacity-5" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 6 }).map((_, i) =>
            Array.from({ length: 5 }).map((_, j) => (
              <path key={`${i}-${j}`}
                d={`M${100 + i * 140} ${80 + j * 120} L${170 + i * 140} ${120 + j * 120} L${170 + i * 140} ${200 + j * 120} L${100 + i * 140} ${240 + j * 120} L${30 + i * 140} ${200 + j * 120} L${30 + i * 140} ${120 + j * 120} Z`}
                fill="none" stroke="#c49a2a" strokeWidth="1"
              />
            ))
          )}
        </svg>
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="dark" />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orias-green to-orias-green-light px-8 py-6 border-b-4 border-orias-gold">
            <h1 className="text-2xl font-bold text-white text-center">Espace Client</h1>
            <p className="text-center text-green-200 text-sm mt-1">Connectez-vous à votre plateforme</p>
          </div>

          {/* Mode badge */}
          <div className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold ${isConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isConfigured ? 'Authentification Supabase active' : 'Mode démonstration'}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="votre@email.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Connexion en cours…
                </>
              ) : 'Se connecter'}
            </button>

            <div className="text-center">
              <button type="button" className="text-sm text-orias-gold hover:text-orias-gold-light font-medium transition-colors">
                Mot de passe oublié ?
              </button>
            </div>
          </form>

          {/* Demo accounts — shown when Supabase not configured */}
          {!isConfigured && (
            <div className="px-8 pb-6">
              <div className="bg-orias-bg rounded-xl p-4 border border-orias-border">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Comptes de démonstration</p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { setEmail('student@oriafen.com'); setPassword('demo123') }}
                    className="w-full text-left text-xs text-gray-600 hover:text-orias-green transition-colors flex items-center gap-2 py-1"
                  >
                    <span className="w-2 h-2 rounded-full bg-orias-gold inline-block flex-shrink-0" />
                    <span><strong>Étudiant :</strong> student@oriafen.com / demo123</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('admin@oriafen.com'); setPassword('admin123') }}
                    className="w-full text-left text-xs text-gray-600 hover:text-orias-green transition-colors flex items-center gap-2 py-1"
                  >
                    <span className="w-2 h-2 rounded-full bg-orias-green inline-block flex-shrink-0" />
                    <span><strong>Admin :</strong> admin@oriafen.com / admin123</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-green-300 text-xs mt-6">
          © 2026 Oriafen Academy · Tous droits réservés
        </p>
      </div>
    </div>
  )
}
