import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import {
  LogoutIcon, UsersIcon, TrendingUpIcon, AwardIcon, BellIcon,
  MenuIcon, XIcon, EyeIcon, EditIcon, MessageIcon, SearchIcon,
  CheckCircleIcon, ClockIcon, BookIcon,
} from '../../components/Icons'
import { ADMIN_CLIENTS, ADMIN_STATS, FORMATION_UNITS, REQUIRED_DOCUMENTS } from '../../data/mockData'
import {
  fetchAllClients, createClient, updateDossierStep,
  fetchClientDocumentsWithDetails, updateDocumentStatusWithReason,
} from '../../lib/api'
import ProgressBar from '../../components/ProgressBar'

// ─── Palette ──────────────────────────────────────────────────
const C = {
  green:     '#1a3d2b',
  greenDark: '#0d2818',
  gold:      '#c9a84c',
  goldLight: '#f5f0e8',
  cream:     '#f9f7f3',
  border:    '#e8e2d6',
  white:     '#ffffff',
}

const NAV_ITEMS = [
  { id: 'clients',   label: 'Clients',      icon: <UsersIcon className="w-4 h-4" /> },
  { id: 'dossiers',  label: 'Dossiers',     icon: <EyeIcon className="w-4 h-4" /> },
  { id: 'formation', label: 'Formation',    icon: <BookIcon className="w-4 h-4" /> },
  { id: 'notifs',    label: 'Notifications',icon: <BellIcon className="w-4 h-4" /> },
]

// ─── Reusable card wrapper ─────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', ...style }}>
    {children}
  </div>
)

// ─── Stat card (dark header style) ───────────────────────────
function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', padding: '18px 20px' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        {icon}
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: C.white, lineHeight: 1, marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: sub ? 2 : 0 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{sub}</p>}
    </div>
  )
}

// ─── Add client modal (logic intact, inline styles) ───────────
function AddClientModal({ onClose, onAdd }) {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [pack,     setPack]     = useState('Essentiel')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(null)

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: 'none', background: C.cream, color: C.green, fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await createClient(fullName, email, pack)
    setLoading(false)
    if (result.success) { setSuccess(result.tempPassword); onAdd() }
    else setError(result.error ?? 'Erreur lors de la création du compte.')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: C.white, borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 440, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 700, color: C.white, fontSize: 17, margin: 0 }}>Ajouter un client</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <XIcon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircleIcon className="w-14 h-14" style={{ color: '#10b981', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700, color: C.green, fontSize: 16, marginBottom: 16 }}>Compte créé avec succès !</p>
              <div style={{ background: C.cream, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, textAlign: 'left', marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mot de passe temporaire</p>
                <p style={{ fontFamily: 'monospace', fontWeight: 800, color: C.green, fontSize: 20, marginBottom: 6 }}>{success}</p>
                <p style={{ fontSize: 11, color: '#9ca3af' }}>Transmettez ce mot de passe au client. Il pourra le changer à sa première connexion.</p>
              </div>
              <button onClick={onClose} style={{ width: '100%', background: C.green, color: C.gold, border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Fermer</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>{error}</div>}
              {[
                { label: 'Nom complet', el: <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} placeholder="Sophie Martin" /> },
                { label: 'Email', el: <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="client@email.com" /> },
                { label: 'Pack', el: <select value={pack} onChange={e => setPack(e.target.value)} style={inputStyle}><option>Essentiel</option><option>Starter</option><option>Premium</option></select> },
              ].map(({ label, el }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                  {el}
                </div>
              ))}
              <button type="button" onClick={handleSubmit} disabled={loading} style={{ background: loading ? '#e5e7eb' : C.green, color: loading ? '#9ca3af' : C.gold, border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Création…</> : 'Créer le compte client'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Clients section (logic intact) ───────────────────────────
function ClientsSection() {
  const [clients,        setClients]        = useState(ADMIN_CLIENTS)
  const [loadingClients, setLoadingClients] = useState(true)
  const [search,         setSearch]         = useState('')
  const [selected,       setSelected]       = useState(null)
  const [filter,         setFilter]         = useState('all')
  const [showAdd,        setShowAdd]        = useState(false)

  const loadClients = () => fetchAllClients().then(data => setClients(data))
  useEffect(() => { loadClients().finally(() => setLoadingClients(false)) }, [])

  const filtered = clients.filter(c => {
    const matchSearch = `${c.nom} ${c.prenom} ${c.pack}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'cours' && c.statut === 'En cours') || (filter === 'obtenu' && c.statut === 'ORIAS obtenu')
    return matchSearch && matchFilter
  })

  const statusStyle = (s) => s === 'ORIAS obtenu'
    ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
    : { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters bar */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <SearchIcon className="w-4 h-4" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client…"
              style={{ width: '100%', paddingLeft: 36, padding: '10px 14px 10px 36px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', background: C.cream, color: C.green, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', borderRadius: 10, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
            {[['all', 'Tous'], ['cours', 'En cours'], ['obtenu', 'ORIAS obtenu']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === v ? C.green : 'transparent', color: filter === v ? C.gold : '#6b7280', transition: 'all 0.15s' }}>{l}</button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length} client{filtered.length > 1 ? 's' : ''}</span>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.gold, color: C.green, border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginLeft: 'auto' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Ajouter un client
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.border}`, background: C.cream }}>
                {['Client', 'Pack', 'Progression', 'Statut', 'Activité', 'Actions'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 5 ? 'right' : 'left', padding: '12px 16px', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingClients ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  <svg style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={C.gold} strokeWidth="4" strokeOpacity="0.25" /><path fill={C.gold} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Chargement…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Aucun client trouvé</td></tr>
              ) : filtered.map((client, i) => (
                <tr key={client.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.cream, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0ede8'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : C.cream}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(26,61,43,0.1)', border: `1px solid rgba(26,61,43,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.green, flexShrink: 0 }}>
                        {client.prenom[0]}{client.nom[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>{client.prenom} {client.nom}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(26,61,43,0.08)', color: C.green, border: `1px solid rgba(26,61,43,0.15)` }}>{client.pack}</span>
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: client.progression >= 80 ? '#10b981' : C.gold, borderRadius: 99, width: `${client.progression}%` }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', flexShrink: 0 }}>{client.progression}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, ...statusStyle(client.statut) }}>
                      {client.statut === 'ORIAS obtenu' ? <CheckCircleIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                      {client.statut}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#9ca3af' }}>{client.activite}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      {[
                        { icon: <EyeIcon className="w-4 h-4" />, action: () => setSelected(client), title: 'Voir', hoverColor: C.green },
                        { icon: <EditIcon className="w-4 h-4" />, action: () => {}, title: 'Modifier', hoverColor: C.gold },
                        { icon: <MessageIcon className="w-4 h-4" />, action: () => {}, title: 'Message', hoverColor: '#3b82f6' },
                      ].map(({ icon, action, title }) => (
                        <button key={title} onClick={action} title={title}
                          style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.cream; e.currentTarget.style.color = C.green }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
                        >{icon}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdd={() => { loadClients(); setShowAdd(false) }} />}

      {/* Client detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSelected(null)}>
          <div style={{ background: C.white, borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 420, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`, padding: '20px 24px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.gold}, #b8960a)` }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(201,168,76,0.2)', border: `2px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: C.gold }}>
                    {selected.prenom[0]}{selected.nom[0]}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: C.white, fontSize: 16, margin: 0 }}>{selected.prenom} {selected.nom}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>{selected.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <XIcon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
                </button>
              </div>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ label: 'Pack', value: selected.pack, color: C.green }, { label: 'Statut', value: selected.statut, color: selected.statut === 'ORIAS obtenu' ? '#15803d' : '#b45309' }].map(({ label, value, color }) => (
                  <div key={label} style={{ background: C.cream, borderRadius: 12, padding: '12px 14px', border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
                    <p style={{ fontWeight: 700, color, margin: 0, fontSize: 14 }}>{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Progression dossier</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: selected.progression >= 80 ? '#10b981' : C.gold, borderRadius: 99, width: `${selected.progression}%` }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{selected.progression}%</span>
                </div>
              </div>
              <div style={{ background: C.cream, borderRadius: 12, padding: '12px 14px', border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Dernière activité</p>
                <p style={{ fontWeight: 600, color: '#374151', margin: 0, fontSize: 13 }}>{selected.activite}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25d366', color: C.white, border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
                  WhatsApp
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', color: C.green, border: `1.5px solid ${C.green}`, borderRadius: 10, padding: '12px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  <EditIcon className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reason dialog (logic intact) ─────────────────────────────
function ReasonDialog({ docLabel, action, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  const isReject = action === 'reject'
  return (
    <div style={{ marginTop: 8, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
        {isReject ? '❌ Raison du rejet :' : '💬 Message de correction pour le client :'}
      </p>
      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} autoFocus
        placeholder={isReject ? 'Ex: Document expiré ou illisible.' : 'Ex: La date est illisible, merci de renvoyer.'}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 12, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'Montserrat, sans-serif' }}
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onCancel} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: '#f3f4f6', border: 'none', color: '#6b7280', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
        <button onClick={() => onConfirm(reason)} disabled={!reason.trim()}
          style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', color: C.white, cursor: reason.trim() ? 'pointer' : 'not-allowed', fontWeight: 700, background: isReject ? '#ef4444' : '#f59e0b', opacity: reason.trim() ? 1 : 0.4 }}>
          Confirmer
        </button>
      </div>
    </div>
  )
}

// ─── Admin doc row (logic intact) ─────────────────────────────
function AdminDocRow({ doc, catLabel, onAction }) {
  const [showDialog, setShowDialog] = useState(null)
  const statusCfg = {
    valid:      { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: '✅', label: 'Validé' },
    pending:    { bg: '#fffbeb', border: '#fde68a', color: '#b45309', icon: '⏳', label: 'En attente' },
    missing:    { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: '❌', label: 'Manquant' },
    correction: { bg: '#fff7ed', border: '#fed7aa', color: '#c2410c', icon: '💬', label: 'Correction' },
    none:       { bg: '#f9fafb', border: '#e5e7eb', color: '#9ca3af', icon: '➖', label: 'Non soumis' },
  }
  const cfg = statusCfg[doc?.status ?? 'none']

  return (
    <div style={{ padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{catLabel}</p>
          {doc?.fileName && <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>📎 {doc.fileName}</p>}
          {doc?.rejectionReason && <p style={{ fontSize: 11, color: '#ef4444', margin: '2px 0 0' }}>"{doc.rejectionReason}"</p>}
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, flexShrink: 0 }}>
          {cfg.icon} {cfg.label}
        </span>
        {doc?.fileUrl && (
          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
            style={{ flexShrink: 0, padding: 6, borderRadius: 8, background: C.cream, border: `1px solid ${C.border}`, color: C.green, display: 'flex', alignItems: 'center' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
        )}
        {doc && doc.status !== 'valid' && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {[
              { label: '✅ Valider', bg: '#d1fae5', color: '#065f46', action: () => onAction(doc.id, 'valide', null) },
              { label: '❌ Rejeter', bg: '#fee2e2', color: '#991b1b', action: () => setShowDialog(showDialog === 'reject' ? null : 'reject') },
              { label: '💬 Corriger', bg: '#fef3c7', color: '#92400e', action: () => setShowDialog(showDialog === 'correction' ? null : 'correction') },
            ].map(({ label, bg, color, action }) => (
              <button key={label} onClick={action}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: bg, color, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                {label}
              </button>
            ))}
          </div>
        )}
        {doc?.status === 'valid' && (
          <button onClick={() => onAction(doc.id, 'en_attente', null)}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
            Annuler
          </button>
        )}
      </div>
      {showDialog === 'reject' && <ReasonDialog docLabel={catLabel} action="reject" onConfirm={r => { onAction(doc.id, 'manquant', r); setShowDialog(null) }} onCancel={() => setShowDialog(null)} />}
      {showDialog === 'correction' && <ReasonDialog docLabel={catLabel} action="correction" onConfirm={r => { onAction(doc.id, 'correction_demandee', r); setShowDialog(null) }} onCancel={() => setShowDialog(null)} />}
    </div>
  )
}

// ─── Dossier section (logic intact) ───────────────────────────
const STEP_LABELS = ['Consultation initiale', 'Montage dossier', 'Structure juridique', 'Soumission ORIAS', 'Obtention ORIAS', 'Lancement activité']

function DossierSection() {
  const [clients,        setClients]        = useState(ADMIN_CLIENTS)
  const [selectedClient, setSelectedClient] = useState(null)
  const [docs,           setDocs]           = useState([])
  const [loadingDocs,    setLoadingDocs]    = useState(false)
  const [updatingStep,   setUpdatingStep]   = useState(false)
  const [currentStep,    setCurrentStep]    = useState(1)

  useEffect(() => {
    fetchAllClients().then(data => { setClients(data); if (data.length > 0) selectClient(data[0]) })
  }, [])

  const selectClient = (c) => {
    setSelectedClient(c)
    setCurrentStep(c.dossierStep ?? 1)
    setLoadingDocs(true)
    fetchClientDocumentsWithDetails(c.id).then(setDocs).finally(() => setLoadingDocs(false))
  }

  const handleStepUpdate = async (step) => {
    if (!selectedClient?.dossierId) return
    setUpdatingStep(true)
    await updateDossierStep(selectedClient.dossierId, step)
    setCurrentStep(step)
    setUpdatingStep(false)
  }

  const handleDocAction = async (docId, status, reason) => {
    await updateDocumentStatusWithReason(docId, status, reason)
    setDocs(prev => prev.map(d => d.id === docId
      ? { ...d, status: status === 'valide' ? 'valid' : status === 'manquant' ? 'missing' : status === 'correction_demandee' ? 'correction' : 'pending', rejectionReason: reason }
      : d
    ))
  }

  const docsByCategory = {}
  docs.forEach(d => { if (d.category) docsByCategory[d.category] = d })
  const pendingCount = docs.filter(d => d.status === 'pending').length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) 1fr', gap: 16, alignItems: 'start' }}>
        {/* Client list */}
        <Card style={{ padding: 16 }}>
          <h3 style={{ fontWeight: 700, color: C.green, marginBottom: 12, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sélectionner un client</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 400, overflowY: 'auto' }}>
            {clients.map(c => {
              const active = selectedClient?.id === c.id
              return (
                <button key={c.id} onClick={() => selectClient(c)} style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? C.green : 'transparent', color: active ? C.white : '#374151',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.2)' : 'rgba(26,61,43,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: active ? C.white : C.green, flexShrink: 0 }}>
                    {c.prenom[0]}{c.nom[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.prenom} {c.nom}</p>
                    <p style={{ fontSize: 11, margin: 0, color: active ? 'rgba(255,255,255,0.6)' : '#9ca3af' }}>{c.pack} · Étape {c.dossierStep ?? 1}</p>
                  </div>
                  {(c.pendingDocCount ?? 0) > 0 && (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#ef4444', color: C.white, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.pendingDocCount}</span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Dossier detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {selectedClient ? (
            <>
              {/* Client header */}
              <Card style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, color: C.green, fontSize: 17, margin: '0 0 2px' }}>{selectedClient.prenom} {selectedClient.nom}</h3>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{selectedClient.email}</p>
                    {selectedClient.dossierNumber && <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '4px 0 0' }}>N° {selectedClient.dossierNumber}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, ...(selectedClient.statut === 'ORIAS obtenu' ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' } : { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }) }}>
                      {selectedClient.statut}
                    </span>
                    {pendingCount > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                        🔴 {pendingCount} doc{pendingCount > 1 ? 's' : ''} à valider
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Étape actuelle</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{currentStep} / 6</span>
                </div>
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: C.gold, borderRadius: 99, width: `${((currentStep - 1) / 5) * 100}%`, transition: 'width 0.4s ease' }} />
                </div>
              </Card>

              {/* Steps */}
              <Card style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h4 style={{ fontWeight: 700, color: C.green, margin: 0, fontSize: 14 }}>Étapes du dossier</h4>
                  {updatingStep && <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: C.gold }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {STEP_LABELS.map((step, i) => {
                    const n = i + 1, done = n < currentStep, active = n === currentStep
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${done ? '#bbf7d0' : active ? '#fde68a' : '#e5e7eb'}`, background: done ? '#f0fdf4' : active ? '#fffbeb' : '#f9fafb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#10b981' : active ? C.gold : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {done ? <CheckCircleIcon className="w-4 h-4" style={{ color: C.white }} /> : <span style={{ fontSize: 11, fontWeight: 800, color: C.white }}>{n}</span>}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: done ? '#15803d' : active ? '#b45309' : '#9ca3af' }}>{step}</span>
                        </div>
                        {active && (
                          <button onClick={() => handleStepUpdate(Math.min(n + 1, 6))} disabled={updatingStep}
                            style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: 'rgba(201,168,76,0.15)', color: C.gold, border: `1px solid rgba(201,168,76,0.4)`, cursor: 'pointer', opacity: updatingStep ? 0.5 : 1 }}>
                            Valider →
                          </button>
                        )}
                        {done && <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>✓ Validé</span>}
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Documents */}
              <Card style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h4 style={{ fontWeight: 700, color: C.green, margin: 0, fontSize: 14 }}>Documents ({REQUIRED_DOCUMENTS.length} requis)</h4>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: '#15803d' }}>{docs.filter(d => d.status === 'valid').length} validés</span>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <span style={{ fontWeight: 700, color: '#b45309' }}>{pendingCount} en attente</span>
                  </div>
                </div>
                {loadingDocs ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                    <svg style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={C.gold} strokeWidth="4" strokeOpacity="0.25" /><path fill={C.gold} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {REQUIRED_DOCUMENTS.map(req => (
                      <AdminDocRow key={req.id} doc={docsByCategory[req.id] ?? null} catLabel={req.label} onAction={handleDocAction} />
                    ))}
                  </div>
                )}
              </Card>

              <a href="https://wa.me/33600000000" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, color: C.white, background: '#25d366', textDecoration: 'none', width: 'fit-content' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
                WhatsApp
              </a>
            </>
          ) : (
            <Card style={{ padding: 48, textAlign: 'center' }}>
              <EyeIcon className="w-10 h-10" style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
              <p style={{ color: '#9ca3af', fontSize: 14 }}>Sélectionnez un client pour gérer son dossier.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Formation tracking (logic intact) ────────────────────────
function FormationTrackingSection() {
  return (
    <Card style={{ padding: 24 }}>
      <h3 style={{ fontWeight: 700, color: C.green, fontSize: 16, marginBottom: 20 }}>Suivi des formations</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.border}`, background: C.cream }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Étudiant</th>
              {FORMATION_UNITS.map(u => (
                <th key={u.id} style={{ textAlign: 'center', padding: '12px 10px', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>U{u.id}</th>
              ))}
              <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</th>
              <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Examen</th>
              <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Certificat</th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_CLIENTS.slice(0, 8).map((c, i) => {
              const hours = Math.floor(Math.random() * 100 + 50)
              const examScore = c.statut === 'ORIAS obtenu' ? Math.floor(Math.random() * 30 + 65) : null
              return (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.cream }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(26,61,43,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.green, flexShrink: 0 }}>
                        {c.prenom[0]}{c.nom[0]}
                      </div>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{c.prenom} {c.nom}</span>
                    </div>
                  </td>
                  {FORMATION_UNITS.map(u => (
                    <td key={u.id} style={{ padding: '12px 10px', textAlign: 'center' }}>
                      {c.statut === 'ORIAS obtenu' || Math.random() > 0.5
                        ? <CheckCircleIcon className="w-4 h-4" style={{ color: '#10b981', margin: '0 auto' }} />
                        : <ClockIcon className="w-4 h-4" style={{ color: C.gold, margin: '0 auto' }} />}
                    </td>
                  ))}
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: C.green, fontSize: 13 }}>{hours}h</span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    {examScore
                      ? <span style={{ fontWeight: 700, color: '#15803d', fontSize: 13 }}>{examScore}%</span>
                      : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    {c.statut === 'ORIAS obtenu'
                      ? <button style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          PDF
                        </button>
                      : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─── Notifications section (logic intact) ─────────────────────
function NotificationsSection() {
  const [tab,       setTab]       = useState('individual')
  const [recipient, setRecipient] = useState('')
  const [message,   setMessage]   = useState('')
  const [sent,      setSent]      = useState(false)
  const [history]   = useState([
    { id: 1, to: 'Sophie Martin',     msg: 'Votre dossier a été validé.',                         date: 'il y a 1h', type: 'individual' },
    { id: 2, to: 'Tous les clients',  msg: 'Nouvelle mise à jour de la plateforme disponible.',   date: 'il y a 2j', type: 'broadcast' },
    { id: 3, to: 'Karim Benali',      msg: 'Félicitations, votre ORIAS a été obtenu !',           date: 'il y a 3j', type: 'individual' },
  ])

  const handleSend = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => { setSent(false); setMessage(''); setRecipient('') }, 3000)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', background: C.cream, color: C.green, fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', marginBottom: 20, borderRadius: 10, border: `1.5px solid ${C.border}`, overflow: 'hidden', width: 'fit-content' }}>
          {[['individual', 'Individuel'], ['broadcast', 'Tous les clients']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: tab === v ? C.green : 'transparent', color: tab === v ? C.gold : '#6b7280', transition: 'all 0.15s' }}>{l}</button>
          ))}
        </div>
        {sent ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '32px 24px', textAlign: 'center' }}>
            <CheckCircleIcon className="w-12 h-12" style={{ color: '#10b981', margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 700, color: '#15803d', fontSize: 15 }}>Message envoyé avec succès !</p>
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'individual' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Destinataire</label>
                <select value={recipient} onChange={e => setRecipient(e.target.value)} required style={inputStyle}>
                  <option value="">Sélectionner un client…</option>
                  {ADMIN_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                </select>
              </div>
            )}
            {tab === 'broadcast' && (
              <div style={{ background: 'rgba(201,168,76,0.08)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(201,168,76,0.3)', fontSize: 13, color: '#92700a', fontWeight: 600 }}>
                Ce message sera envoyé à tous les {ADMIN_CLIENTS.length} clients actifs.
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} required
                placeholder="Rédiger votre message…"
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>
            <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.green, color: C.gold, border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              Envoyer le message
            </button>
          </form>
        )}
      </Card>

      <Card style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, color: C.green, marginBottom: 16, fontSize: 15 }}>Historique des messages</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map(h => (
            <div key={h.id} style={{ padding: '14px 16px', borderRadius: 12, background: C.cream, border: `1.5px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <p style={{ fontWeight: 700, color: '#1f2937', fontSize: 13, margin: 0 }}>{h.to}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, ...(h.type === 'broadcast' ? { background: 'rgba(201,168,76,0.15)', color: C.gold } : { background: 'rgba(26,61,43,0.08)', color: C.green }) }}>
                    {h.type === 'broadcast' ? 'Broadcast' : 'Individuel'}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{h.date}</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{h.msg}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// MAIN — AdminDashboard
// ═════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [activeTab,       setActiveTab]       = useState('clients')
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false)

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  const renderSection = () => {
    switch (activeTab) {
      case 'clients':   return <ClientsSection />
      case 'dossiers':  return <DossierSection />
      case 'formation': return <FormationTrackingSection />
      case 'notifs':    return <NotificationsSection />
      default:          return <ClientsSection />
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Header ── */}
      <header style={{ background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%)`, position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 4px 20px rgba(13,40,24,0.3)' }}>
        {/* Gold top line */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, #b8960a)` }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Logo size="sm" variant="dark" />
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Administration</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: C.white, fontWeight: 600, fontSize: 13 }}>{user?.name}</span>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = C.white }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              >
                <LogoutIcon className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div style={{ background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%)`, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <StatCard icon={<UsersIcon className="w-5 h-5" style={{ color: C.gold }} />} label="Total clients" value={ADMIN_STATS.totalClients} />
            <StatCard icon={<ClockIcon className="w-5 h-5" style={{ color: C.gold }} />} label="En cours" value={ADMIN_STATS.enCours} />
            <StatCard icon={<AwardIcon className="w-5 h-5" style={{ color: C.gold }} />} label="ORIAS obtenus" value={ADMIN_STATS.oriasObtenus} />
            <StatCard icon={<TrendingUpIcon className="w-5 h-5" style={{ color: C.gold }} />} label="Revenus ce mois" value={`${ADMIN_STATS.revenusMois} €`} sub="mai 2026" />
          </div>
        </div>
      </div>

      {/* ── Nav tabs ── */}
      <div style={{ background: C.white, borderBottom: `1.5px solid ${C.border}`, position: 'sticky', top: 63, zIndex: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <nav style={{ display: 'flex', gap: 4, padding: '8px 0', overflowX: 'auto' }}>
            {NAV_ITEMS.map(item => {
              const active = activeTab === item.id
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none',
                  fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  background: active ? C.green : 'transparent',
                  color: active ? C.gold : '#6b7280',
                }}>
                  {item.icon} {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.green, margin: '0 0 2px', fontFamily: 'Cormorant Garamond, serif' }}>
            {NAV_ITEMS.find(n => n.id === activeTab)?.label}
          </h2>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            {activeTab === 'clients'   && `${ADMIN_STATS.totalClients} clients au total`}
            {activeTab === 'dossiers'  && 'Gérez les dossiers ORIAS de vos clients'}
            {activeTab === 'formation' && 'Suivez la progression des formations'}
            {activeTab === 'notifs'    && 'Envoyez des messages à vos clients'}
          </p>
        </div>
        {renderSection()}
      </main>

      <footer style={{ borderTop: `1.5px solid ${C.border}`, marginTop: 48, padding: '24px', background: C.white }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Logo size="sm" variant="light" />
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>© 2026 Oriafen Academy — Administration</p>
        </div>
      </footer>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
