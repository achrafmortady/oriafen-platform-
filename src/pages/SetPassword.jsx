import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function SetPassword() {
  const [password, setPassword]       = useState('')
  const [confirm,  setConfirm]        = useState('')
  const [loading,  setLoading]        = useState(false)
  const [error,    setError]          = useState('')
  const [ready,    setReady]          = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase injecte le token dans l'URL après clic sur le lien email
    // On laisse Supabase gérer la session automatiquement
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.')
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.')
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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Logo style={{ width: 48, height: 48, margin: '0 auto 12px' }} />
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 700, color: '#1a3d2b' }}>
            Oriafen Academy
          </h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Choisissez votre mot de passe</p>
        </div>

        {!ready ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 13, color: '#666' }}>Vérification du lien en cours...</div>
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
                  fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box'
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
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '1.5px solid #e0ddd6', fontSize: 14, outline: 'none',
                  fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box'
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
                color: '#1a3d2b', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
                fontFamily: 'Montserrat, sans-serif', letterSpacing: 0.5
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
