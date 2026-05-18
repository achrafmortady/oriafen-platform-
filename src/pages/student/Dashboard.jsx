import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogoutIcon, MenuIcon, XIcon } from '../../components/Icons'
import Logo from '../../components/Logo'
import MonDossier from './MonDossier'
import MaFormation from './MaFormation'
import FormationCommerciale from './FormationCommerciale'
import MesDocuments from './MesDocuments'
import Support from './Support'


const NAV_ITEMS = [
  { id: 'dossier',     label: 'Mon Dossier',  short: 'Dossier' },
  { id: 'formation',   label: 'Formation IAS1', short: 'IAS1' },
  { id: 'commercial',  label: 'Vente & Scripts', short: 'Vente' },
  { id: 'documents',   label: 'Documents',    short: 'Documents' },
  { id: 'support',     label: 'Support',      short: 'Support' },
]

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dossier')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }
  const handleNav = (id) => { setActiveTab(id); setMobileMenuOpen(false) }

  const renderSection = () => {
    switch (activeTab) {
      case 'dossier':    return <MonDossier />
      case 'formation':  return <MaFormation />
      case 'commercial': return <FormationCommerciale />
      case 'documents':  return <MesDocuments />
      case 'support':    return <Support />
      default:           return <MonDossier />
    }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? 'U'

  return (
    <div style={{ minHeight:'100vh', background:'#f5f0e8', fontFamily:"'Montserrat', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600;700&display=swap');
        .nav-btn { background:none; border:none; cursor:pointer; padding:8px 16px; border-radius:10px; font-size:13px; font-weight:500; font-family:'Montserrat',sans-serif; transition:all 0.2s; white-space:nowrap; letter-spacing:0.3px; }
        .nav-btn:hover { background:rgba(255,255,255,0.15) !important; color:#fff !important; }
        .nav-btn-active { background:linear-gradient(135deg,#c9a84c,#b8960a) !important; color:#1a3d2b !important; font-weight:700 !important; box-shadow:0 2px 12px rgba(201,168,76,0.35) !important; }
        .nav-btn-inactive { color:rgba(255,255,255,0.7) !important; }
        .logout-btn:hover { color:#fff !important; background:rgba(255,255,255,0.1) !important; }
        .mobile-nav-btn { background:none; border:none; cursor:pointer; width:100%; text-align:left; padding:12px 16px; border-radius:12px; font-size:14px; font-weight:500; font-family:'Montserrat',sans-serif; transition:all 0.2s; color:rgba(255,255,255,0.7); }
        .mobile-nav-btn:hover { background:rgba(255,255,255,0.1); color:#fff; }
        .mobile-nav-btn-active { background:linear-gradient(135deg,#c9a84c,#b8960a) !important; color:#1a3d2b !important; font-weight:700 !important; }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background:'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)',
        position:'sticky', top:0, zIndex:40,
        boxShadow:'0 4px 30px rgba(0,0,0,0.25)',
        borderBottom:'1px solid rgba(201,168,76,0.15)',
      }}>
        {/* Gold top accent */}
        <div style={{ height:'2px', background:'linear-gradient(90deg, transparent, #c9a84c 30%, #f0d080 50%, #c9a84c 70%, transparent)' }} />

        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px' }}>

            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center' }}>
              <Logo size="sm" variant="dark" />
            </div>

            {/* Desktop: user + logout */}
            <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
              {/* User info */}
              <div style={{ textAlign:'right', display:'flex', flexDirection:'column' }}>
                <span style={{ color:'#fff', fontWeight:'600', fontSize:'13px', fontFamily:"'Montserrat', sans-serif" }}>{user?.name}</span>
                <span style={{ color:'#c9a84c', fontSize:'11px', fontFamily:"'Montserrat', sans-serif", fontWeight:'400' }}>Pack {user?.pack}</span>
              </div>
              {/* Avatar */}
              <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(201,168,76,0.15)', border:'2px solid rgba(201,168,76,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'700', color:'#c9a84c', flexShrink:0, fontFamily:"'Montserrat', sans-serif" }}>
                {initials}
              </div>
              {/* Logout */}
              <button onClick={handleLogout} className="logout-btn"
                style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.5)', background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'7px 12px', cursor:'pointer', fontSize:'12px', fontFamily:"'Montserrat', sans-serif", transition:'all 0.2s' }}>
                <LogoutIcon className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 1.5rem' }}>
            <nav style={{ display:'flex', gap:'4px', padding:'8px 0', overflowX:'auto' }}>
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => handleNav(item.id)}
                  className={`nav-btn ${activeTab === item.id ? 'nav-btn-active' : 'nav-btn-inactive'}`}>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth:'1280px', margin:'0 auto', padding:'2rem 1.5rem' }}>
        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px', fontSize:'12px', fontFamily:"'Montserrat', sans-serif" }}>
          <span style={{ color:'#9ca3af' }}>Tableau de bord</span>
          <span style={{ color:'#d1d5db' }}>/</span>
          <span style={{ color:'#c49a2a', fontWeight:'600' }}>
            {NAV_ITEMS.find(n => n.id === activeTab)?.label}
          </span>
        </div>

        {renderSection()}
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop:'1px solid #e8e2d6', marginTop:'3rem', padding:'1.5rem', background:'#fff' }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 1.5rem', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'16px' }}>
          <Logo size="sm" variant="light" />
          <p style={{ fontSize:'11px', color:'#9ca3af', margin:0, fontFamily:"'Montserrat', sans-serif" }}>© 2026 Oriafen Academy · Tous droits réservés</p>
        </div>
      </footer>
    </div>
  )
}
