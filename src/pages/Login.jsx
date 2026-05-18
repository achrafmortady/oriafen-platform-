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
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1f0f 0%, #0d2818 40%, #0a1a10 70%, #071208 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
          animation: 'float1 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,90,40,0.15) 0%, transparent 70%)',
          animation: 'float2 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '10%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)',
          animation: 'float3 12s ease-in-out infinite',
        }} />

        {/* Geometric grid lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#c9a84c" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Diagonal accent line */}
        <div style={{
          position: 'absolute', top: 0, right: '30%',
          width: '1px', height: '100%',
          background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.15), transparent)',
        }} />
        <div style={{
          position: 'absolute', top: 0, right: '31%',
          width: '1px', height: '100%',
          background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.06), transparent)',
        }} />
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.05); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.03); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15px, 25px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .login-card {
          animation: fadeInUp 0.6s ease forwards;
        }
        .input-premium {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 10px;
          padding: 14px 16px;
          color: #f5f0e8;
          font-size: 14px;
          font-family: 'Georgia', serif;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .input-premium::placeholder { color: rgba(245,240,232,0.3); }
        .input-premium:focus {
          border-color: rgba(201,168,76,0.6);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.08), 0 0 20px rgba(201,168,76,0.05);
        }
        .btn-submit {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #c9a84c, #b8960a, #c9a84c);
          background-size: 200% auto;
          border: none;
          border-radius: 10px;
          color: #0a1f0f;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Georgia', serif;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-submit:hover:not(:disabled) {
          background-position: right center;
          box-shadow: 0 8px 30px rgba(201,168,76,0.3);
          transform: translateY(-1px);
        }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .demo-btn:hover { color: #c9a84c !important; }
        .forgot-btn:hover { color: #c9a84c !important; }
        .label-premium {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(201,168,76,0.7);
          margin-bottom: 8px;
          font-family: 'Georgia', serif;
        }
      `}</style>

      <div className="login-card" style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        opacity: mounted ? 1 : 0,
      }}>

        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Logo size="lg" variant="dark" />
          <div style={{
            marginTop: '12px',
            fontSize: '11px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.5)',
            fontFamily: 'Georgia, serif',
          }}>
            Espace Client Sécurisé
          </div>
        </div>

        {/* Main card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
        }}>

          {/* Top gold accent bar */}
          <div style={{
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #c9a84c, #f0d080, #c9a84c, transparent)',
          }} />

          {/* Header */}
          <div style={{
            padding: '2rem 2rem 1.5rem',
            textAlign: 'center',
            borderBottom: '1px solid rgba(201,168,76,0.08)',
          }}>
            <h1 style={{
              fontSize: '22px',
              fontWeight: '400',
              color: '#f5f0e8',
              margin: 0,
              letterSpacing: '0.5px',
              fontFamily: 'Georgia, serif',
            }}>
              Connectez-vous
            </h1>
            <p style={{
              fontSize: '13px',
              color: 'rgba(245,240,232,0.4)',
              marginTop: '6px',
              marginBottom: 0,
              letterSpacing: '0.3px',
            }}>
              Accédez à votre plateforme Oriafen Academy
            </p>
          </div>

          {/* Status badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px',
            background: isConfigured ? 'rgba(16,185,129,0.06)' : 'rgba(201,168,76,0.06)',
            borderBottom: '1px solid rgba(201,168,76,0.06)',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: isConfigured ? '#10b981' : '#c9a84c',
              boxShadow: isConfigured ? '0 0 6px #10b981' : '0 0 6px #c9a84c',
              display: 'inline-block',
            }} />
            <span style={{
              fontSize: '10px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: isConfigured ? 'rgba(16,185,129,0.8)' : 'rgba(201,168,76,0.8)',
              fontFamily: 'Georgia, serif',
            }}>
              {isConfigured ? 'Authentification Supabase active' : 'Mode démonstration'}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#fca5a5',
                fontSize: '13px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label className="label-premium">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-premium"
                placeholder="votre@email.com"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label className="label-premium">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-premium"
                  placeholder="••••••••"
                  style={{ paddingRight: '48px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(245,240,232,0.3)', padding: 0,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(201,168,76,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(10,31,15,0.3)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#0a1f0f" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Connexion en cours…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Se connecter
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                className="forgot-btn"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '12px', color: 'rgba(245,240,232,0.3)',
                  letterSpacing: '0.5px', transition: 'color 0.2s',
                  fontFamily: 'Georgia, serif',
                }}
              >
                Mot de passe oublié ?
              </button>
            </div>
          </form>

          {/* Demo accounts */}
          {!isConfigured && (
            <div style={{
              padding: '0 2rem 2rem',
            }}>
              <div style={{
                background: 'rgba(201,168,76,0.04)',
                border: '1px solid rgba(201,168,76,0.12)',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <p style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: 'rgba(201,168,76,0.5)',
                  margin: '0 0 10px 0',
                  fontFamily: 'Georgia, serif',
                }}>
                  Comptes de démonstration
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Étudiant', email: 'student@oriafen.com', pass: 'demo123', color: '#c9a84c' },
                    { label: 'Admin', email: 'admin@oriafen.com', pass: 'admin123', color: '#10b981' },
                  ].map(({ label, email: e, pass, color }) => (
                    <button
                      key={label}
                      type="button"
                      className="demo-btn"
                      onClick={() => { setEmail(e); setPassword(pass) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left', padding: '6px 8px',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        color: 'rgba(245,240,232,0.4)',
                        fontSize: '12px',
                        transition: 'all 0.2s',
                        fontFamily: 'Georgia, serif',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(201,168,76,0.05)'
                        e.currentTarget.style.color = '#c9a84c'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'none'
                        e.currentTarget.style.color = 'rgba(245,240,232,0.4)'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
                      <span><strong style={{ color: 'rgba(245,240,232,0.7)' }}>{label} :</strong> {e} / {pass}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom gold bar */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)',
          }} />
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}>
          <div style={{ height: '1px', width: '40px', background: 'rgba(201,168,76,0.2)' }} />
          <p style={{
            fontSize: '11px',
            color: 'rgba(201,168,76,0.3)',
            margin: 0,
            letterSpacing: '1px',
            fontFamily: 'Georgia, serif',
          }}>
            © 2026 Oriafen Academy
          </p>
          <div style={{ height: '1px', width: '40px', background: 'rgba(201,168,76,0.2)' }} />
        </div>
      </div>
    </div>
  )
}
