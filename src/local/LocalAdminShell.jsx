import React, { useState, useEffect } from 'react'
import LocalCRM from './LocalCRM'
import LocalClientsOverview from './LocalClientsOverview'
import { AdminMarketingPanel } from './LocalMarketing'
import LocalAdminNotificationBell from './LocalAdminNotificationBell'
import LocalDossierSection from './LocalDossierSection'
import LocalNotificationsSection from './LocalNotificationsSection'
import LocalFormationTrackingSection from './LocalFormationTrackingSection'
import Logo from '../components/Logo'
import { BellIcon, MessageIcon, LogoutIcon, UsersIcon, TargetIcon, StarIcon, EyeIcon, BookIcon, ClockIcon, XCircleIcon } from '../components/Icons'
import { stages, today, cleanPreviewLeads } from './model'
import { buildClientsOverview } from './clientsOverviewData'

const NAV_ITEMS = [
  { id: 'clients',    label: 'Clients',      icon: <UsersIcon className="w-4 h-4" /> },
  { id: 'crm',         label: 'CRM',          icon: <TargetIcon className="w-4 h-4" /> },
  { id: 'marketing',  label: 'Marketing',     icon: <StarIcon className="w-4 h-4" /> },
  { id: 'dossiers',   label: 'Dossiers',      icon: <EyeIcon className="w-4 h-4" /> },
  { id: 'formation',  label: 'Formation',     icon: <BookIcon className="w-4 h-4" /> },
  { id: 'notifs',     label: 'Notifications', icon: <BellIcon className="w-4 h-4" /> },
]

// Filet de sécurité défensif uniquement — tous les NAV_ITEMS ci-dessus
// résolvent déjà un composant réel dans renderSection() (audit final
// 2026-09-20 : les anciens libellés "sera disponible dans cette démo" par
// onglet étaient devenus du texte mort, chaque onglet étant maintenant
// implémenté). Ne s'affiche que si `activeTab` prenait une valeur inconnue
// (jamais le cas via la navigation normale).
function LocalAdminPlaceholder({ tab }) {
  return (
    <div className="card p-10 max-w-2xl mx-auto text-center">
      <span className="text-[10px] font-bold tracking-wide text-orias-gold uppercase">Administration</span>
      <h1 className="text-2xl font-bold text-orias-green mt-2 mb-2">Section inconnue</h1>
      <p className="text-sm text-gray-500">L'onglet « {tab} » n'existe pas.</p>
    </div>
  )
}

function CompactKpiCard({ icon, label, value, sub, accent = 'green', onClick }) {
  const badgeBg = accent === 'gold' ? 'bg-orias-gold/10' : 'bg-orias-green/10'
  const iconColor = accent === 'gold' ? 'text-orias-gold' : 'text-orias-green'
  const valueColor = accent === 'gold' ? 'text-orias-gold' : 'text-orias-green'
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bg-white rounded-xl border border-orias-border shadow-sm px-4 py-3 flex items-center gap-3 w-full text-left ${
        onClick ? 'cursor-pointer transition-all hover:shadow-md hover:border-orias-gold/50 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orias-gold' : ''
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${badgeBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold leading-none ${valueColor}`}>{value}</p>
        <p className="text-xs font-medium text-gray-600 mt-1 truncate">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 truncate">{sub}</p>}
      </div>
    </Tag>
  )
}

function useLocalLeadStats() {
  const [leads, setLeads] = useState(() => {
    try { const raw = JSON.parse(localStorage.getItem('oriafen-isolated-crm-v1')); return cleanPreviewLeads(raw || []) } catch { return [] }
  })
  useEffect(() => {
    const onStorage = () => { try { const raw = JSON.parse(localStorage.getItem('oriafen-isolated-crm-v1')); setLeads(cleanPreviewLeads(raw || [])) } catch { /* ignore */ } }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  return leads
}

export default function LocalAdminShell() {
  const [activeTab, setActiveTab] = useState('crm')
  const [showReportIssue, setShowReportIssue] = useState(false)
  const [clientPreview, setClientPreview] = useState(false)
  const [clientPreviewIdentity, setClientPreviewIdentity] = useState(null)
  const leads = useLocalLeadStats()
  const dossiersEnCours = leads.filter(l => !['Client', 'Perdu'].includes(l.stage)).length
  const actionsEnRetard = leads.filter(l => !l.done && l.due < today).length
  const { kpis: clientKpis, rows: clientRows } = buildClientsOverview(leads)
  const reponsesEnAttente = clientRows.filter(r => r.nextAction === 'Attendre réponse').length
  const latestClientPreview = clientRows[0]
    ? { id: clientRows[0].id, name: `${clientRows[0].prenom || ''} ${clientRows[0].nom || ''}`.trim() || clientRows[0].email || `Client #${clientRows[0].id}`, email: clientRows[0].email || null }
    : null

  const handleTabClick = (id) => setActiveTab(id)

  // Cartes KPI du header cliquables : réutilisent uniquement les onglets et
  // filtres déjà existants (onglet "Clients" + ses puces de filtre, preset
  // "À relancer en retard" déjà présent dans le CRM) — aucune nouvelle
  // logique métier, juste de la navigation + un préréglage.
  const [clientsFilterRequest, setClientsFilterRequest] = useState(null)
  const [crmPresetRequest, setCrmPresetRequest] = useState(null)
  const openClientsFiltered = (kind, value) => {
    setClientsFilterRequest({ kind, value, ts: Date.now() })
    setActiveTab('clients')
  }
  const openCrmPreset = (presetLabel) => {
    setCrmPresetRequest({ preset: presetLabel, ts: Date.now() })
    setActiveTab('crm')
  }

  // Deep-link depuis une notification admin (marketing/support) — même
  // mécanisme de "requête" que les KPI cliquables ci-dessus (un objet avec
  // un `ts` unique pour forcer l'effet même si la même cible est redemandée).
  // context.tab==='clients' ouvre directement la fiche du client concerné
  // (LocalClientsOverview > openClientId), context.tab==='marketing' ouvre
  // simplement l'onglet Marketing (vue admin unique, pas de routage par id
  // pour l'instant).
  const [openClientRequest, setOpenClientRequest] = useState(null)
  const handleNotificationNavigate = (context) => {
    if (!context?.tab) return
    if (context.tab === 'clients' && context.clientId != null) {
      setOpenClientRequest({ clientId: context.clientId, ts: Date.now() })
    }
    setActiveTab(context.tab)
  }

  const renderSection = () => {
    if (activeTab === 'crm') {
      return (
        <LocalCRM
          mode={clientPreview ? 'client' : 'admin'}
          onEnterClient={(identity = latestClientPreview) => { setClientPreviewIdentity(identity); setClientPreview(true) }}
          onExitClient={() => { setClientPreview(false); setClientPreviewIdentity(null) }}
          presetRequest={crmPresetRequest}
          clientId={clientPreviewIdentity?.id}
          clientIdentity={clientPreviewIdentity}
        />
      )
    }
    if (activeTab === 'clients') return <LocalClientsOverview initialFilter={clientsFilterRequest} openClientRequest={openClientRequest} />
    if (activeTab === 'marketing') return <AdminMarketingPanel />
    if (activeTab === 'dossiers') return <LocalDossierSection />
    if (activeTab === 'formation') return <LocalFormationTrackingSection />
    if (activeTab === 'notifs') return <LocalNotificationsSection />
    return <LocalAdminPlaceholder tab={activeTab} />
  }

  if (clientPreview) return renderSection()

  return (
    <div className="min-h-screen bg-orias-bg">
      {/* Header */}
      <header className="bg-orias-green sticky top-0 z-40 shadow-lg shadow-orias-green/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Logo size="sm" variant="dark" />
              <div className="hidden md:block h-6 w-px bg-white/20" />
              <span className="hidden md:block text-green-300 text-sm font-medium">Administration</span>
            </div>
            <div className="flex items-center gap-2">
              <LocalAdminNotificationBell onNavigate={handleNotificationNavigate} />
              <div className="hidden md:flex items-center gap-4">
                <button onClick={() => setShowReportIssue(true)} className="flex items-center gap-2 text-amber-300 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10 border border-amber-300/30">
                  <MessageIcon className="w-4 h-4" />
                  Signaler un problème
                </button>
                <span className="text-white font-semibold text-sm">Salma Démo</span>
                <button className="flex items-center gap-2 text-green-300 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10">
                  <LogoutIcon className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-orias-green border-t border-orias-green-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* "Total clients" (audit "top KPI card" 2026-09-21) : affichait
                auparavant clientKpis.actifs (sous-ensemble hors dossiers
                "Complété"), en désaccord avec la carte Conversion du CRM
                ("X clients sur Y prospects", tous statuts confondus). Lit
                désormais clientKpis.total (buildClientsOverview,
                clientsOverviewData.js — même source que la carte
                Conversion), jamais un chiffre recalculé ici. Clic : ouvre
                l'onglet Clients SANS filtre de statut (kind=null = puce
                "Tous"), cohérent avec "total" — "Actifs"/Bloqué/ORIAS
                obtenu restent des puces de filtre séparées dans cet onglet. */}
            <CompactKpiCard icon={<UsersIcon className="w-4 h-4" />} label="Total clients" value={clientKpis.total} accent="green" onClick={() => openClientsFiltered(null)} />
            <CompactKpiCard icon={<ClockIcon className="w-4 h-4" />} label="Dossiers en cours" value={dossiersEnCours} accent="gold" onClick={() => openCrmPreset('Tous les prospects')} />
            <CompactKpiCard icon={<XCircleIcon className="w-4 h-4" />} label="Actions en retard" value={actionsEnRetard} accent="gold" onClick={() => openCrmPreset('À relancer en retard')} />
            <CompactKpiCard icon={<MessageIcon className="w-4 h-4" />} label="Réponses en attente" value={reponsesEnAttente} accent="green" onClick={() => openClientsFiltered('nextAction', 'Attendre réponse')} />
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-white border-b border-orias-border sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex overflow-x-auto scrollbar-hide gap-1 py-2" aria-label="Navigation administration">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  activeTab === item.id
                    ? 'bg-orias-green text-white shadow-sm'
                    : 'text-gray-600 hover:text-orias-green hover:bg-orias-bg'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      {activeTab === 'crm' ? renderSection() : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-orias-green">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h2>
          </div>
          {renderSection()}
        </main>
      )}

      {showReportIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportIssue(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-orias-green px-6 py-5 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">Signaler un problème</h3>
              <button onClick={() => setShowReportIssue(false)} className="text-green-300 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-600">
              <p>Cette fonctionnalité envoie normalement un ticket au super admin.</p>
              <p className="text-xs text-gray-400">Démonstration locale · aucun envoi réel n'est effectué ici.</p>
              <button onClick={() => setShowReportIssue(false)} className="btn-gold w-full">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
