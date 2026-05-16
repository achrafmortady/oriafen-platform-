import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import { LogoutIcon, MenuIcon, XIcon } from '../../components/Icons'
import MonDossier from './MonDossier'
import MaFormation from './MaFormation'
import FormationCommerciale from './FormationCommerciale'
import MesDocuments from './MesDocuments'
import Support from './Support'

const NAV_ITEMS = [
  { id: 'dossier',     label: 'Mon Dossier',  short: 'Dossier' },
  { id: 'formation',   label: 'Ma Formation', short: 'Formation' },
  { id: 'commercial',  label: 'Commercial',   short: 'Commercial' },
  { id: 'documents',   label: 'Documents',    short: 'Documents' },
  { id: 'support',     label: 'Support',      short: 'Support' },
]

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dossier')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleNav = (id) => {
    setActiveTab(id)
    setMobileMenuOpen(false)
  }

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

  return (
    <div className="min-h-screen bg-orias-bg">
      {/* Header */}
      <header className="bg-orias-green sticky top-0 z-40 shadow-lg shadow-orias-green/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Logo size="sm" variant="dark" />

            {/* User info — desktop */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-white font-semibold text-sm leading-tight">{user?.name}</p>
                <p className="text-orias-gold text-xs font-medium">Pack {user?.pack}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-orias-gold/20 border-2 border-orias-gold flex items-center justify-center text-sm font-bold text-orias-gold flex-shrink-0">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-green-300 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
              >
                <LogoutIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Déconnexion</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-green-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Navigation bar */}
        <div className="border-t border-orias-green-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`nav-tab flex-shrink-0 text-sm ${
                    activeTab === item.id
                      ? 'bg-orias-gold text-white shadow-sm'
                      : 'text-green-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.short}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-orias-green-light bg-orias-green-light/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {/* User info mobile */}
              <div className="flex items-center gap-3 p-3 mb-2 bg-white/10 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-orias-gold/20 border-2 border-orias-gold flex items-center justify-center text-sm font-bold text-orias-gold flex-shrink-0">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user?.name}</p>
                  <p className="text-orias-gold text-xs">Pack {user?.pack}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full p-3 text-red-300 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
              >
                <LogoutIcon className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Section header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <span>Tableau de bord</span>
            <span>/</span>
            <span className="text-orias-gold font-medium">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </span>
          </div>
        </div>
        {renderSection()}
      </main>

      {/* Footer */}
      <footer className="border-t border-orias-border mt-12 py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <Logo size="sm" variant="light" />
          <p className="text-xs text-gray-400">© 2026 Oriafen Academy · Tous droits réservés</p>
        </div>
      </footer>
    </div>
  )
}
