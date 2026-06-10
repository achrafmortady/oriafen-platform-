import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SetPassword() {
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [verifying,   setVerifying]   = useState(true)
  const [error,       setError]       = useState('')
  const [verified,    setVerified]    = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyToken = async () => {
      // Méthode 1 : token_hash dans l'URL (nouveau format Supabase)
      const tokenHash = searchParams.get('token_hash')
      const type      = searchParams.get('type') || 'signup'

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if (!error) {
          setVerified(true)
          setVerifying(false)
          return
        }
      }

      // Méthode 2 : access_token dans le hash de l'URL (ancien format)
      const hash   = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || '' })
        if (!error) {
          setVerified(true)
          setVerifying(false)
          return
        }
      }

      setError('Lien invalide ou expiré. Demandez à votre administrateur de renvoyer l\'invitation.')
      setVerifying(false)
    }

    verifyToken()
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.')
    if (password !== confirm)  return setError('Les mots de passe ne correspondent pas.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a3d2b 0%, #0f2419 50%, #1a3d2b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: 20, padding: '40px 36px',
        width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, background: '#1a3d2b', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
          }}>
            <svg viewBox="0 0 40 46" width="28" height="28" fill="none">
              <path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" strokeWidth="1.8" fill="rgba(201,168,76,.15)"/>
              <text x="20" y="30" textAnchor="middle" fontFamily="serif" fontSize="14" fontWeight="700" fill="#c9a84c">O</text>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: '#1a3d2b', margin: '0 0 4px' }}>
            Oriafen Academy
          </h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Choisissez votre mot de passe</p>
        </div>

        {verifying ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#666', fontSize: 13 }}>
            Vérification en cours...
          </div>
        ) : !verified ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', color: '#dc2626', padding: '16px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
            <button onClick={() => navigate('/login')} style={{
              background: '#1a3d2b', color: '#c9a84c', border: 'none', padding: '12px 24px',
              borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer'
            }}>
              Retour à la connexion
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#1a3d2b', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '1.5px solid #e0ddd6', fontSize: 14, outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#1a3d2b', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Répétez le mot de passe"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '1.5px solid #e0ddd6', fontSize: 14, outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
            </div>

            {error && (
              <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #c9a84c, #b8960a)',
                color: '#1a3d2b', fontWeight: 700, fontSize: 15,
                cursor: loading ? 'default' : 'pointer', letterSpacing: 0.5
              }}
            >
              {loading ? 'Enregistrement...' : 'Accéder à ma formation →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
