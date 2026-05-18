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

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  const doRedirect = (role) => navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    timerRef.current = setTimeout(() => {
      doRedirect(email.toLowerCase().includes('admin') ? 'admin' : 'student')
    }, 5000)
    try {
      const result = await login(email, password)
      clearTimeout(timerRef.current)
      setLoading(false)
      if (result.success) doRedirect(result.role)
      else setError(result.error ?? 'Erreur de connexion.')
    } catch {
      clearTimeout(timerRef.current)
      setLoading(false)
      setError('Erreur inattendue. Veuillez réessayer.')
    }
  }

  return (
    <div id="login-root" style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #1c4a2e 0%, #2d6b45 30%, #1c4a2e 60%, #163822 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .li-login { 
          outline: none !important; 
          width: 100%;
          background: rgba(255,255,255,0.08) !important;
          border: 1px solid rgba(201,168,76,0.25) !important;
          border-radius: 12px !important;
          padding: 14px 18px !important;
          color: #fff !important;
          font-size: 14px !important;
          font-family: 'Montserrat', sans-serif !important;
          box-sizing: border-box !important;
          transition: all 0.2s !important;
        }
        .li-login:focus { 
          border-color: rgba(201,168,76,0.7) !important; 
          background: rgba(255,255,255,0.12) !important; 
          box-shadow: 0 0 0 3px rgba(201,168,76,0.12) !important; 
        }
        .li-login::placeholder { color: rgba(255,255,255,0.35) !important; }
        .btn-login:not(:disabled):hover { 
          box-shadow: 0 10px 40px rgba(201,168,76,0.4) !important; 
          transform: translateY(-2px) !important; 
        }
        .btn-login:not(:disabled):active { transform: translateY(0) !important; }
        .forgot-login:hover { color: #c9a84c !important; }
        .eye-login:hover { color: rgba(201,168,76,0.9) !important; }
      `}</style>

      {/* Light orbs */}
      <div style={{ position:'absolute', top:'-15%', right:'-10%', width:'700px', height:'700px', borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 60%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-15%', left:'-10%', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(45,107,69,0.4) 0%, transparent 60%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'30%', left:'5%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', pointerEvents:'none', animation:'float 6s ease-in-out infinite' }} />

      {/* Subtle grid */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04, pointerEvents:'none' }} preserveAspectRatio="xMidYMid slice">
        <defs><pattern id="lg2" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0L0 0 0 80" fill="none" stroke="#c9a84c" strokeWidth="0.5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#lg2)" />
      </svg>

      <div style={{
        position:'relative', width:'100%', maxWidth:'460px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>

        {/* Logo — transparent background */}
        <div style={{ textAlign:'center', marginBottom:'1.8rem' }}>
          <div style={{ 
            display:'inline-block',
            padding: '16px 32px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(201,168,76,0.12)',
          }}>
            <Logo size="lg" variant="dark" />
          </div>
          <div style={{ marginTop:'10px', fontSize:'10px', letterSpacing:'4px', textTransform:'uppercase', color:'rgba(201,168,76,0.55)', fontFamily:"'Montserrat', sans-serif", fontWeight:'300' }}>
            Academy · Espace Client
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.1) inset',
        }}>

          {/* Gold top line */}
          <div style={{ height:'2px', background:'linear-gradient(90deg, transparent, #c9a84c 25%, #f5d76e 50%, #c9a84c 75%, transparent)' }} />

          {/* Header */}
          <div style={{ padding:'2rem 2.5rem 1.5rem', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <h1 style={{ fontSize:'26px', fontWeight:'300', color:'#ffffff', margin:0, letterSpacing:'2px', fontFamily:"'Cormorant Garamond', serif" }}>
              Connectez-vous
            </h1>
            <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', marginTop:'6px', marginBottom:0, fontFamily:"'Montserrat', sans-serif", fontWeight:'300', letterSpacing:'0.5px' }}>
              Accédez à votre espace Oriafen Academy
            </p>
          </div>

          {/* Status badge */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'8px 16px', background: isConfigured ? 'rgba(16,185,129,0.08)' : 'rgba(201,168,76,0.08)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: isConfigured ? '#10b981' : '#c9a84c', boxShadow: isConfigured ? '0 0 10px #10b981' : '0 0 10px #c9a84c', display:'inline-block', flexShrink:0 }} />
            <span style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase', color: isConfigured ? 'rgba(16,185,129,0.9)' : 'rgba(201,168,76,0.9)', fontFamily:"'Montserrat', sans-serif", fontWeight:'500' }}>
              {isConfigured ? 'Authentification sécurisée' : 'Mode démonstration'}
            </span>
          </div>

          {/* Form */}
          <div style={{ padding:'2rem 2.5rem' }}>
            {error && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'12px 16px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px', color:'#fca5a5', fontSize:'13px', fontFamily:"'Montserrat', sans-serif" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}

            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'10px', fontWeight:'600', letterSpacing:'2px', textTransform:'uppercase', color:'rgba(201,168,76,0.8)', marginBottom:'9px', fontFamily:"'Montserrat', sans-serif" }}>
                Adresse email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="li-login"
                placeholder="votre@email.com" required autoFocus />
            </div>

            <div style={{ marginBottom:'28px' }}>
              <label style={{ display:'block', fontSize:'10px', fontWeight:'600', letterSpacing:'2px', textTransform:'uppercase', color:'rgba(201,168,76,0.8)', marginBottom:'9px', fontFamily:"'Montserrat', sans-serif" }}>
                Mot de passe
              </label>
              <div style={{ position:'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="li-login"
                  style={{ paddingRight:'48px' }}
                  placeholder="••••••••" required />
                <button type="button" className="eye-login" onClick={() => setShowPass(!showPass)}
                  style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:0, display:'flex', alignItems:'center', transition:'color 0.2s' }}>
                  {showPass
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-login"
              style={{
                width:'100%', padding:'16px',
                background:'linear-gradient(135deg, #c9a84c 0%, #e8c96a 50%, #c9a84c 100%)',
                backgroundSize: '200% auto',
                border:'none', borderRadius:'12px',
                color:'#1a3d2b', fontSize:'14px', fontWeight:'600',
                fontFamily:"'Montserrat', sans-serif", letterSpacing:'1.5px',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                transition:'all 0.3s', opacity: loading ? 0.75 : 1,
                boxShadow: '0 4px 20px rgba(201,168,76,0.2)',
              }}>
              {loading ? (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ animation:'spin 0.8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(26,61,43,0.3)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#1a3d2b" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </>
              )}
            </button>

            <button type="button" className="forgot-login"
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:'12px', color:'rgba(255,255,255,0.3)', fontFamily:"'Montserrat', sans-serif", display:'block', margin:'14px auto 0', transition:'color 0.2s', letterSpacing:'0.5px' }}>
              Mot de passe oublié ?
            </button>
          </div>

          {!isConfigured && (
            <div style={{ padding:'0 2.5rem 2rem' }}>
              <div style={{ background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:'14px', padding:'16px' }}>
                <p style={{ fontSize:'9px', fontWeight:'600', letterSpacing:'2px', textTransform:'uppercase', color:'rgba(201,168,76,0.5)', margin:'0 0 12px 0', fontFamily:"'Montserrat', sans-serif" }}>
                  Comptes de démonstration
                </p>
                {[
                  { label:'Étudiant', e:'student@oriafen.com', p:'demo123', color:'#c9a84c' },
                  { label:'Admin', e:'admin@oriafen.com', p:'admin123', color:'#10b981' },
                ].map(({ label, e, p, color }) => (
                  <button key={label} type="button"
                    onClick={() => { setEmail(e); setPassword(p) }}
                    style={{ background:'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left', padding:'8px 10px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'10px', color:'rgba(255,255,255,0.4)', fontSize:'12px', fontFamily:"'Montserrat', sans-serif", transition:'all 0.2s' }}
                    onMouseEnter={ev => { ev.currentTarget.style.background='rgba(201,168,76,0.08)'; ev.currentTarget.style.color='#c9a84c' }}
                    onMouseLeave={ev => { ev.currentTarget.style.background='none'; ev.currentTarget.style.color='rgba(255,255,255,0.4)' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:color, flexShrink:0, boxShadow:`0 0 8px ${color}` }} />
                    <span><strong style={{ color:'rgba(255,255,255,0.65)' }}>{label} :</strong> {e} / {p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ height:'1px', background:'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)' }} />
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:'1.5rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
          <div style={{ height:'1px', width:'40px', background:'rgba(201,168,76,0.2)' }} />
          <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', margin:0, letterSpacing:'1px', fontFamily:"'Montserrat', sans-serif", fontWeight:'300' }}>
            © 2026 Oriafen Academy
          </p>
          <div style={{ height:'1px', width:'40px', background:'rgba(201,168,76,0.2)' }} />
        </div>
      </div>
    </div>
  )
}
