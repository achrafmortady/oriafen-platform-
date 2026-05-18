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
  const [mounted, setMounted]   = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.background
    document.body.style.background = 'linear-gradient(135deg, #0a1f0f 0%, #0d2818 40%, #071208 100%)'
    return () => {
      document.body.style.background = prev
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

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
    timerRef.current = setTimeout(() => {
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
      setError('Erreur inattendue. Veuillez réessayer.')
    }
  }

  const S = {
    wrapper: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1f0f 0%, #0d2818 40%, #071208 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
    },
    orb1: {
      position: 'absolute', top: '-10%', right: '-5%',
      width: '500px', height: '500px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
      pointerEvents: 'none',
    },
    orb2: {
      position: 'absolute', bottom: '-15%', left: '-5%',
      width: '450px', height: '450px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(26,90,40,0.2) 0%, transparent 70%)',
      pointerEvents: 'none',
    },
    container: {
      position: 'relative',
      width: '100%',
      maxWidth: '420px',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    },
    logoArea: { textAlign: 'center', marginBottom: '1.5rem' },
    tagline: {
      marginTop: '8px', fontSize: '10px', letterSpacing: '3px',
      textTransform: 'uppercase', color: 'rgba(201,168,76,0.45)',
      fontFamily: 'Georgia, serif',
    },
    card: {
      background: "#0d2818",


      border: '1px solid rgba(201,168,76,0.18)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
    },
    topBar: {
      height: '2px',
      background: 'linear-gradient(90deg, transparent 0%, #c9a84c 30%, #f0d080 50%, #c9a84c 70%, transparent 100%)',
    },
    header: {
      padding: '1.75rem 2rem 1.25rem', textAlign: 'center',
      borderBottom: '1px solid rgba(201,168,76,0.07)',
    },
    h1: {
      fontSize: '20px', fontWeight: '400', color: '#f5f0e8',
      margin: 0, letterSpacing: '0.5px', fontFamily: 'Georgia, serif',
    },
    subtitle: {
      fontSize: '12px', color: 'rgba(245,240,232,0.35)',
      marginTop: '5px', marginBottom: 0, fontFamily: 'Georgia, serif',
    },
    label: {
      display: 'block', fontSize: '10px', fontWeight: '600',
      letterSpacing: '1.5px', textTransform: 'uppercase',
      color: 'rgba(201,168,76,0.6)', marginBottom: '8px',
      fontFamily: 'Georgia, serif',
    },
    input: {
      width: '100%',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(201,168,76,0.15)',
      borderRadius: '10px',
      padding: '13px 16px',
      color: '#f5f0e8',
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.2s',
    },
    submitBtn: {
      width: '100%', padding: '14px',
      background: 'linear-gradient(135deg, #c9a84c, #b8960a)',
      border: 'none', borderRadius: '10px',
      color: '#071208', fontSize: '14px', fontWeight: '700',
      fontFamily: 'Georgia, serif', letterSpacing: '0.8px',
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '8px',
      transition: 'box-shadow 0.2s, transform 0.15s',
    },
  }

  return (
    <div id="login-root" style={S.wrapper}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .li { outline: none !important; }
        .li:focus { border-color: rgba(201,168,76,0.5) !important; background: rgba(255,255,255,0.06) !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.07) !important; }
        .li::placeholder { color: rgba(245,240,232,0.2) !important; }
        .ls:not(:disabled):hover { box-shadow: 0 8px 30px rgba(201,168,76,0.3) !important; transform: translateY(-1px) !important; }
        .lf:hover { color: rgba(201,168,76,0.55) !important; }
        .le:hover { color: rgba(201,168,76,0.7) !important; }
        .ld:hover { background: rgba(201,168,76,0.05) !important; color: #c9a84c !important; }
      `}</style>

      <div style={S.orb1} />
      <div style={S.orb2} />

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none' }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="lg" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0L0 0 0 60" fill="none" stroke="#c9a84c" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lg)" />
      </svg>

      <div style={S.container}>
        <div style={S.logoArea}>
          <Logo size="lg" variant="dark" />
          <div style={S.tagline}>Espace Client Sécurisé</div>
        </div>

        <div style={S.card}>
          <div style={S.topBar} />

          <div style={S.header}>
            <h1 style={S.h1}>Connectez-vous</h1>
            <p style={S.subtitle}>Accédez à votre plateforme Oriafen Academy</p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            padding: '7px', borderBottom: '1px solid rgba(201,168,76,0.05)',
            background: isConfigured ? 'rgba(16,185,129,0.05)' : 'rgba(201,168,76,0.05)',
          }}>
            <span style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: isConfigured ? '#10b981' : '#c9a84c',
              boxShadow: isConfigured ? '0 0 8px #10b981' : '0 0 8px #c9a84c',
              display: 'inline-block',
            }} />
            <span style={{
              fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase',
              color: isConfigured ? 'rgba(16,185,129,0.7)' : 'rgba(201,168,76,0.7)',
              fontFamily: 'Georgia, serif',
            }}>
              {isConfigured ? 'Authentification Supabase active' : 'Mode démonstration'}
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1.75rem 2rem' }}>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: '10px', padding: '11px 14px', marginBottom: '18px',
                display: 'flex', alignItems: 'center', gap: '9px',
                color: '#fca5a5', fontSize: '12px', fontFamily: 'Georgia, serif',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={S.label}>Adresse email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="li" style={S.input} placeholder="votre@email.com" required autoFocus />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={S.label}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="li" style={{ ...S.input, paddingRight: '44px' }}
                  placeholder="••••••••" required />
                <button type="button" className="le" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(245,240,232,0.25)', padding: 0, display: 'flex', alignItems: 'center',
                    transition: 'color 0.2s',
                  }}>
                  {showPass ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="ls"
              style={{ ...S.submitBtn, opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(7,18,8,0.3)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#071208" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>

            <button type="button" className="lf"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px',
                color: 'rgba(245,240,232,0.25)', fontFamily: 'Georgia, serif',
                display: 'block', margin: '14px auto 0', transition: 'color 0.2s',
              }}>
              Mot de passe oublié ?
            </button>
          </form>

          {!isConfigured && (
            <div style={{ padding: '0 2rem 1.75rem' }}>
              <div style={{
                background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.1)',
                borderRadius: '12px', padding: '14px',
              }}>
                <p style={{
                  fontSize: '9px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase',
                  color: 'rgba(201,168,76,0.4)', margin: '0 0 10px 0', fontFamily: 'Georgia, serif',
                }}>Comptes de démonstration</p>
                {[
                  { label: 'Étudiant', e: 'student@oriafen.com', p: 'demo123', color: '#c9a84c' },
                  { label: 'Admin', e: 'admin@oriafen.com', p: 'admin123', color: '#10b981' },
                ].map(({ label, e, p, color }) => (
                  <button key={label} type="button" className="ld"
                    onClick={() => { setEmail(e); setPassword(p) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                      textAlign: 'left', padding: '7px 8px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', gap: '9px',
                      color: 'rgba(245,240,232,0.35)', fontSize: '11px',
                      fontFamily: 'Georgia, serif', transition: 'all 0.2s',
                    }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
                    <span><strong style={{ color: 'rgba(245,240,232,0.6)' }}>{label} :</strong> {e} / {p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)' }} />
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{ height: '1px', width: '35px', background: 'rgba(201,168,76,0.15)' }} />
          <p style={{ fontSize: '10px', color: 'rgba(201,168,76,0.25)', margin: 0, letterSpacing: '1px', fontFamily: 'Georgia, serif' }}>
            © 2026 Oriafen Academy
          </p>
          <div style={{ height: '1px', width: '35px', background: 'rgba(201,168,76,0.15)' }} />
        </div>
      </div>
    </div>
  )
}
