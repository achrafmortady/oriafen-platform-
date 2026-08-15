import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import { LogoutIcon, UsersIcon, TrendingUpIcon, AwardIcon, BellIcon, MenuIcon, XIcon, EyeIcon, EditIcon, MessageIcon, SearchIcon, CheckCircleIcon, ClockIcon, BookIcon, TargetIcon, PhoneIcon, CalendarIcon } from '../../components/Icons'
import { FORMATION_UNITS } from '../../data/mockData'
import { fetchAllClients, createClient, updateClientInfo, deleteClientAccount, updateDossierStep, fetchClientDocumentsWithDetails, updateDocumentStatusWithReason, fetchPacks, markPaymentPaid, fetchFinanceSummary, fetchClientPayments, createAdminAccount, cancelClientDossier, reactivateClientDossier, fetchLeads, updateLeadStatus, updateLeadNotes, updateLeadInfo, subscribeToLeads, LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, STAGE_WEIGHTS, fetchLeadActivity, addLeadNote, logQuickActivity, setLeadPack, setLeadPricing, convertLeadToClient, fetchLeadAppointments, addLeadAppointment, updateAppointmentStatus, fetchUpcomingAppointments, APPOINTMENT_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, fetchLeadTasks, addLeadTask, toggleTaskDone, fetchUpcomingTasks, fetchAdmins, toggleUserBlocked, deleteAdminAccount, submitAdminTicket, fetchSupportTickets, updateTicketStatus, subscribeToSupportTickets, TICKET_STATUS_LABELS } from '../../lib/api'
import { openLivret } from '../../lib/livret'
import { REQUIRED_DOCUMENTS } from '../../data/mockData'
import ProgressBar from '../../components/ProgressBar'
import { supabase } from '../../lib/supabase'

const FINAL_DOCS_CATALOGUE = [
  { type: 'attestation_ias1', label: 'Attestation IAS1' },
  { type: 'kbis',             label: 'Kbis de la société' },
  { type: 'numero_orias',     label: 'Numéro ORIAS officiel' },
  { type: 'attestation_rc',   label: 'Attestation RC Pro' },
  { type: 'domiciliation',    label: 'Domiciliation' },
  { type: 'statuts',          label: 'Statuts de la société' },
]

const NAV_ITEMS = [
  { id: 'clients',    label: 'Clients',         icon: <UsersIcon className="w-4 h-4" /> },
  { id: 'leads',      label: 'CRM',             icon: <TargetIcon className="w-4 h-4" /> },
  { id: 'dossiers',   label: 'Dossiers',         icon: <EyeIcon className="w-4 h-4" /> },
  { id: 'formation',  label: 'Formation',        icon: <BookIcon className="w-4 h-4" /> },
  { id: 'notifs',     label: 'Notifications',    icon: <BellIcon className="w-4 h-4" /> },
]
const FINANCE_NAV_ITEM = { id: 'finance', label: 'Finance', icon: <TrendingUpIcon className="w-4 h-4" /> }
const TEAM_NAV_ITEM = { id: 'equipe', label: 'Équipe', icon: <UsersIcon className="w-4 h-4" /> }

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`rounded-2xl p-5 border ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm font-medium text-white/80 mt-1">{label}</p>
      {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
    </div>
  )
}

const PACK_CATEGORY_LABELS = {
  conseil:   '📋 Conseil ORIAS',
  marketing: '🌐 Marketing',
  academy:   '🎓 Academy',
  combine:   '⭐ Packs Combinés',
}

function AddAdminModal({ onClose, onAdd }) {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await createAdminAccount(fullName, email)
    setLoading(false)
    if (result.success) {
      setSuccess(true)
      onAdd()
    } else {
      setError(result.error ?? 'Erreur lors de la création du compte.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-orias-green px-6 py-5 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Ajouter un collaborateur admin</h3>
          <button onClick={onClose} className="text-green-300 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircleIcon className="w-14 h-14 text-emerald-500 mx-auto" />
              <p className="font-bold text-orias-green text-lg">Compte admin créé !</p>
              <div className="bg-orias-bg rounded-xl p-4 border border-orias-border text-left space-y-2">
                <p className="text-sm font-semibold text-orias-green">📧 Email envoyé automatiquement</p>
                <p className="text-xs text-gray-500">Le collaborateur reçoit un lien pour créer son mot de passe et accéder au dashboard admin (sans la section Finance).</p>
              </div>
              <button onClick={onClose} className="btn-green w-full">Fermer</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} required
                  className="input-field" placeholder="Wahiba Alami" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="input-field" placeholder="collegue@oriafen.com" />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                Ce compte aura accès à Clients, Dossiers, Formation et Notifications — mais pas à la section Finance.
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-70">
                {loading
                  ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Création…</>
                  : 'Créer le compte admin'
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function ReportIssueModal({ onClose, onSent }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await submitAdminTicket({ subject, message, priority })
    setLoading(false)
    if (result.success) {
      onSent()
    } else {
      setError(result.error ?? 'Erreur lors de l\'envoi.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-orias-green px-6 py-5 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Signaler un problème</h3>
          <button onClick={onClose} className="text-green-300 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sujet</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} required className="input-field" placeholder="Ex: Erreur sur la fiche client X" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Détails</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} className="input-field resize-none" placeholder="Décrivez le problème rencontré..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="input-field">
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-70">
              {loading ? 'Envoi...' : 'Envoyer au super admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function AddClientModal({ onClose, onAdd }) {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [packId,   setPackId]   = useState('')
  const [discount, setDiscount] = useState(0)
  const [packs,    setPacks]    = useState([])
  const [loadingPacks, setLoadingPacks] = useState(true)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(null)

  useEffect(() => {
    fetchPacks().then(data => {
      setPacks(data)
      if (data.length) setPackId(data[0].id)
      setLoadingPacks(false)
    })
  }, [])

  const packsByCategory = packs.reduce((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p)
    return acc
  }, {})

  const selectedPack = packs.find(p => p.id === packId)
  const discountedTtc = selectedPack ? Math.round(selectedPack.price_ttc * (1 - discount / 100)) : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await createClient(fullName, email, packId, discount)
    setLoading(false)
    if (result.success) {
      setSuccess(result.tempPassword)
      onAdd()
    } else {
      const errMsg = typeof result.error === 'string'
        ? result.error
        : result.error?.message || JSON.stringify(result.error) || 'Erreur lors de la création du compte.'
      setError(errMsg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-orias-green px-6 py-5 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Ajouter un client</h3>
          <button onClick={onClose} className="text-green-300 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircleIcon className="w-14 h-14 text-emerald-500 mx-auto" />
              <p className="font-bold text-orias-green text-lg">Compte créé avec succès !</p>
              <div className="bg-orias-bg rounded-xl p-4 border border-orias-border text-left space-y-2">
                <p className="text-sm font-semibold text-orias-green">📧 Email envoyé automatiquement</p>
                <p className="text-xs text-gray-500">L'étudiant a reçu un email de confirmation Oriafen Academy.</p>
                <p className="text-xs text-gray-500">Il clique sur le lien → choisit son mot de passe → accède directement à sa formation.</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ Si l'email n'arrive pas</p>
                <p className="text-xs text-amber-600">Vérifiez les spams. Vous pouvez aussi renvoyer l'invitation depuis Supabase → Auth → Users.</p>
              </div>
              <button onClick={onClose} className="btn-green w-full">Fermer</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} required
                  className="input-field" placeholder="Sophie Martin" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="input-field" placeholder="client@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pack</label>
                {loadingPacks ? (
                  <div className="input-field text-sm text-gray-400">Chargement des packs…</div>
                ) : (
                  <select value={packId} onChange={e => setPackId(e.target.value)} className="input-field">
                    {Object.entries(packsByCategory).map(([cat, list]) => (
                      <optgroup key={cat} label={PACK_CATEGORY_LABELS[cat] ?? cat}>
                        {list.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.price_ttc.toLocaleString('fr-FR')} DHS TTC
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                <input
                  type="number" min="0" max="100" step="1"
                  value={discount}
                  onChange={e => setDiscount(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="input-field" placeholder="0"
                />
                {selectedPack && discount > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Prix après discount : <span className="font-semibold text-orias-green">{discountedTtc.toLocaleString('fr-FR')} DHS TTC</span>
                    {' '}<span className="line-through text-gray-400">{selectedPack.price_ttc.toLocaleString('fr-FR')} DHS</span>
                  </p>
                )}
              </div>
              <button type="submit" disabled={loading || loadingPacks} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-70">
                {loading
                  ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Création…</>
                  : 'Créer le compte client'
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function EditClientModal({ client, onClose, onSaved }) {
  const [fullName, setFullName] = useState(`${client.prenom || ''} ${client.nom || ''}`.trim())
  const [packId, setPackId] = useState(client.packId || '')
  const [packs, setPacks] = useState([])
  const [loadingPacks, setLoadingPacks] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPacks().then(data => {
      setPacks(data)
      setLoadingPacks(false)
    })
  }, [])

  const packsByCategory = packs.reduce((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p)
    return acc
  }, {})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const result = await updateClientInfo(client.id, { fullName, packId })
    setSaving(false)
    if (result.success) {
      onSaved()
    } else {
      setError(result.error || 'Erreur lors de la mise à jour.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-orias-gold px-6 py-5 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Modifier — {client.prenom} {client.nom}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><XIcon className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="input-field bg-orias-bg text-gray-500">{client.email}</div>
              <p className="text-xs text-gray-400 mt-1">L'email de connexion ne se modifie pas ici — contactez le support Supabase pour un changement d'adresse.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pack</label>
              {loadingPacks ? (
                <div className="input-field text-sm text-gray-400">Chargement des packs…</div>
              ) : (
                <select value={packId} onChange={e => setPackId(e.target.value)} className="input-field">
                  {Object.entries(packsByCategory).map(([cat, list]) => (
                    <optgroup key={cat} label={PACK_CATEGORY_LABELS[cat] ?? cat}>
                      {list.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {p.price_ttc.toLocaleString('fr-FR')} DHS TTC</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>
            <div className="bg-orias-bg rounded-xl p-3 border border-orias-border flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Statut dossier</span>
              <span className={`font-semibold ${client.statut === 'ORIAS obtenu' ? 'text-emerald-600' : 'text-amber-600'}`}>{client.statut}</span>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=Bonjour%20${encodeURIComponent(client.prenom)}%2C%20`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#25d366] hover:bg-[#20bd5a] transition-colors"
              >
                <MessageIcon className="w-4 h-4" />
                WhatsApp
              </a>
              <button type="button" onClick={onClose} className="flex-1 btn-outline-green">Annuler</button>
              <button type="submit" disabled={saving || loadingPacks} className="flex-1 btn-gold disabled:opacity-70">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function ClientsSection({ isSuperAdmin }) {
  const [clients, setClients]   = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState('all')
  const [showAdd, setShowAdd]   = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [busyDossier, setBusyDossier] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [busyDelete, setBusyDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadClients = () => fetchAllClients().then(data => setClients(data))

  useEffect(() => {
    loadClients().finally(() => setLoadingClients(false))
  }, [])

  const filtered = clients.filter(c => {
    const matchSearch = `${c.nom} ${c.prenom} ${c.pack}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all'
      ? true
      : filter === 'cours' ? c.statut === 'En cours'
      : filter === 'obtenu' ? c.statut === 'ORIAS obtenu'
      : filter === 'annule' ? c.statut === 'Annulé'
      : true
    return matchSearch && matchFilter
  })

  const statusCls = (s) => s === 'ORIAS obtenu'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : s === 'Annulé'
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-amber-50 text-amber-700 border-amber-200'

  const handleConfirmCancel = async () => {
    if (!cancelTarget?.dossierId) { setCancelTarget(null); return }
    setBusyDossier(true)
    if (cancelTarget.statut === 'Annulé') {
      await reactivateClientDossier(cancelTarget.dossierId)
    } else {
      await cancelClientDossier(cancelTarget.dossierId)
    }
    await loadClients()
    setBusyDossier(false)
    setCancelTarget(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setBusyDelete(true)
    setDeleteError('')
    const result = await deleteClientAccount(deleteTarget.id)
    setBusyDelete(false)
    if (result.success) {
      setDeleteTarget(null)
      setDeleteConfirmText('')
      loadClients()
    } else {
      setDeleteError(result.error || 'Erreur lors de la suppression.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 py-2.5 text-sm"
            placeholder="Rechercher un client..."
          />
        </div>
        <div className="flex rounded-xl border border-orias-border overflow-hidden">
          {[['all','Tous'],['cours','En cours'],['obtenu','ORIAS obtenu'],['annule','Annulé']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`px-3 py-2 text-sm font-medium transition-colors ${filter === v ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>{l}</button>
          ))}
        </div>
        <span className="text-sm text-gray-500">{filtered.length} client{filtered.length > 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setShowAdd(true)} className="btn-gold flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter un client
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orias-border bg-orias-bg">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Client</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Pack</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Progression</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Statut</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Activité</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client, i) => (
                <tr key={client.id} className={`border-b border-orias-border/50 hover:bg-orias-bg/50 transition-colors ${i % 2 === 0 ? '' : 'bg-orias-bg/20'} ${client.statut === 'Annulé' ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orias-green/10 border border-orias-green/20 flex items-center justify-center text-sm font-bold text-orias-green flex-shrink-0">
                        {client.prenom[0]}{client.nom[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{client.prenom} {client.nom}</p>
                        <p className="text-xs text-gray-400 hidden sm:block">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orias-green/10 text-orias-green border border-orias-green/20">{client.pack}</span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell min-w-32">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">{client.progression}%</span>
                      </div>
                      <ProgressBar value={client.progression} max={100} height="h-1.5" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`status-badge border ${statusCls(client.statut)} text-xs`}>
                      {client.statut === 'ORIAS obtenu' ? <CheckCircleIcon className="w-3 h-3" /> : client.statut === 'Annulé' ? <XIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                      <span className="hidden sm:inline">{client.statut}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden xl:table-cell text-xs text-gray-400">{client.activite}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelected(client)} className="p-1.5 rounded-lg text-gray-400 hover:text-orias-green hover:bg-orias-green/10 transition-colors" title="Voir">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditClient(client)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-orias-gold hover:bg-orias-gold/10 transition-colors" title="Modifier"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(`https://wa.me/?text=Bonjour%20${encodeURIComponent(client.prenom)}%2C%20voici%20un%20message%20de%20l%27équipe%20Oriafen%20Academy.`, '_blank')}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Message WhatsApp"
                      >
                        <MessageIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCancelTarget(client)}
                        className={`p-1.5 rounded-lg transition-colors ${client.statut === 'Annulé' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                        title={client.statut === 'Annulé' ? 'Réactiver' : 'Annuler'}
                      >
                        {client.statut === 'Annulé'
                          ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                          : <XIcon className="w-4 h-4" />
                        }
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => { setDeleteTarget(client); setDeleteConfirmText(''); setDeleteError('') }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-700 hover:bg-red-50 transition-colors" title="Supprimer définitivement"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdd={() => { loadClients(); setShowAdd(false) }} />}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCancelTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center space-y-4">
              <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${cancelTarget.statut === 'Annulé' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <XIcon className={`w-7 h-7 ${cancelTarget.statut === 'Annulé' ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
              <p className="font-bold text-gray-800">
                {cancelTarget.statut === 'Annulé' ? 'Réactiver' : 'Annuler'} le dossier de {cancelTarget.prenom} {cancelTarget.nom} ?
              </p>
              <p className="text-sm text-gray-500">
                {cancelTarget.statut === 'Annulé'
                  ? 'Le dossier repassera en statut "En cours".'
                  : 'Le client gardera son historique de paiements et ses données, avec un badge "Annulé" visible dans Clients et Finance.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCancelTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm border border-orias-border text-gray-600 hover:bg-orias-bg transition-colors">Annuler</button>
                <button onClick={handleConfirmCancel} disabled={busyDossier} className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors disabled:opacity-60 ${cancelTarget.statut === 'Annulé' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  {busyDossier ? '...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suppression definitive — super_admin uniquement */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-red-50">
                <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </div>
              <p className="font-bold text-gray-800 text-center">
                Supprimer définitivement {deleteTarget.prenom} {deleteTarget.nom} ?
              </p>
              <p className="text-sm text-gray-500 text-center">
                Contrairement à "Annuler", cette action supprime <strong>tout</strong> : le compte, le dossier, les documents, la progression et <strong>tout l'historique de paiements de ce client dans Finance</strong>. C'est irréversible.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tapez <span className="font-mono text-red-600">SUPPRIMER</span> pour confirmer</label>
                <input
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="input-field text-sm"
                  placeholder="SUPPRIMER"
                />
              </div>
              {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm border border-orias-border text-gray-600 hover:bg-orias-bg transition-colors">Annuler</button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={busyDelete || deleteConfirmText !== 'SUPPRIMER'}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {busyDelete ? 'Suppression…' : 'Supprimer définitivement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editClient && (
        <EditClientModal
          client={editClient}
          onClose={() => setEditClient(null)}
          onSaved={() => { loadClients(); setEditClient(null) }}
        />
      )}

      {/* Client detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-orias-green px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orias-gold/20 border-2 border-orias-gold flex items-center justify-center text-lg font-bold text-orias-gold">
                    {selected.prenom[0]}{selected.nom[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{selected.prenom} {selected.nom}</h3>
                    <p className="text-green-300 text-sm">{selected.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-green-300 hover:text-white transition-colors">
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orias-bg rounded-xl p-3 border border-orias-border">
                  <p className="text-xs text-gray-500 font-medium">Pack</p>
                  <p className="font-bold text-orias-green">{selected.pack}</p>
                </div>
                <div className="bg-orias-bg rounded-xl p-3 border border-orias-border">
                  <p className="text-xs text-gray-500 font-medium">Statut</p>
                  <p className={`font-bold ${selected.statut === 'ORIAS obtenu' ? 'text-emerald-600' : 'text-amber-600'}`}>{selected.statut}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Progression dossier</p>
                <ProgressBar value={selected.progression} max={100} height="h-2.5" showLabel={true} label="" />
              </div>
              <div className="bg-orias-bg rounded-xl p-3 border border-orias-border">
                <p className="text-xs text-gray-500 font-medium">Dernière activité</p>
                <p className="font-semibold text-gray-700 text-sm">{selected.activite}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => window.open(`https://wa.me/?text=Bonjour%20${encodeURIComponent(selected.prenom)}%2C%20`, '_blank')}
                  className="btn-gold flex-1 flex items-center justify-center gap-2"
                >
                  <MessageIcon className="w-4 h-4" />
                  Message WhatsApp
                </button>
                <button
                  onClick={() => { setEditClient(selected); setSelected(null) }}
                  className="btn-outline-green flex items-center gap-2 px-4"
                >
                  <EditIcon className="w-4 h-4" />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Admin: send document to client (received docs)
function AdminSendDocPanel({ clientId }) {
  const inputRef = useRef(null)
  const [label, setLabel] = useState("")
  const [type, setType]   = useState("document")
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !label.trim()) return
    setSending(true)
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase()
      const path = `received/${clientId}/${Date.now()}.${ext}`
      const { error: storageErr } = await _supabase.storage.from("documents").upload(path, file, { upsert: true })
      if (storageErr) throw storageErr
      const { data: { signedUrl } } = await _supabase.storage.from("documents").createSignedUrl(path, 365 * 24 * 3600)
      await _supabase.from("client_received_docs").insert({
        user_id: clientId, file_url: signedUrl, file_name: file.name, label: label.trim(), type
      })
      setSent(true)
      setLabel("")
      setTimeout(() => setSent(false), 3000)
    } catch(err) {
      alert("Erreur: " + err.message)
    } finally {
      setSending(false)
      e.target.value = ""
    }
  }

  return (
    <div className="card p-5">
      <h4 className="font-bold text-orias-green mb-3">📥 Envoyer un document au client</h4>
      {sent ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-emerald-700 font-semibold text-sm">✅ Document envoyé avec succès !</div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nom du document</label>
            <input value={label} onChange={e => setLabel(e.target.value)} className="input-field text-sm" placeholder="Ex: Contrat de mission signé" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="input-field text-sm">
              <option value="document">Document</option>
              <option value="contrat">Contrat</option>
              <option value="convention">Convention</option>
              <option value="guide">Guide</option>
            </select>
          </div>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={handleFile} />
          <button
            onClick={() => label.trim() && inputRef.current?.click()}
            disabled={!label.trim() || sending}
            className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? "Envoi en cours..." : "📤 Choisir et envoyer le fichier"}
          </button>
        </div>
      )}
    </div>
  )
}

// Admin: send final doc to client
function AdminSendFinalDocPanel({ clientId }) {
  const inputRef = useRef(null)
  const [docType, setDocType]   = useState("attestation_ias1")
  const [customLabel, setCustomLabel] = useState("")
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)

  const isCustom = docType === "autre"

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (isCustom && !customLabel.trim()) { alert("Entrez un nom de document"); return }
    setSending(true)
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase()
      const path = `final/${clientId}/${Date.now()}.${ext}`
      const { error: storageErr } = await _supabase.storage.from("documents").upload(path, file, { upsert: true })
      if (storageErr) throw storageErr
      const { data: { signedUrl } } = await _supabase.storage.from("documents").createSignedUrl(path, 365 * 24 * 3600)
      const finalType = isCustom ? customLabel.trim() : docType
      await _supabase.from("client_final_docs").upsert(
        { user_id: clientId, doc_type: finalType, file_url: signedUrl, file_name: file.name },
        { onConflict: "user_id,doc_type" }
      )
      setSent(true)
      setCustomLabel("")
      setTimeout(() => setSent(false), 3000)
    } catch(err) {
      alert("Erreur: " + err.message)
    } finally {
      setSending(false)
      e.target.value = ""
    }
  }

  const handleAutoLivret = async () => {
    setSending(true)
    try {
      const { data: userData } = await _supabase.from("users").select("full_name, created_at").eq("id", clientId).single()
      const studentName = userData?.full_name || "Étudiant"
      const enrolledAt  = userData?.created_at || new Date().toISOString()
      const { generateLivretHTML } = await import("../../lib/livret")
      const html = generateLivretHTML(studentName, enrolledAt)
      const blob = new Blob([html], { type: "text/html" })
      const fileName = `Livret_IAS1_${studentName.replace(/\s+/g,"_")}.html`
      const path = `final/${clientId}/${Date.now()}_livret.html`
      const { error: storageErr } = await _supabase.storage.from("documents").upload(path, blob, { upsert: true, contentType: "text/html" })
      if (storageErr) throw storageErr
      const { data: { signedUrl } } = await _supabase.storage.from("documents").createSignedUrl(path, 365 * 24 * 3600)
      await _supabase.from("client_final_docs").upsert(
        { user_id: clientId, doc_type: "attestation_ias1", file_url: signedUrl, file_name: fileName },
        { onConflict: "user_id,doc_type" }
      )
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch(err) {
      alert("Erreur génération livret: " + err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card p-5">
      <h4 className="font-bold text-orias-green mb-3">🏆 Envoyer un document final</h4>
      {sent ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-emerald-700 font-semibold text-sm">✅ Document final envoyé — déverrouillé chez le client !</div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Type de document</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className="input-field text-sm">
              {FINAL_DOCS_CATALOGUE.map(c => <option key={c.type} value={c.type}>{c.label}</option>)}
              <option value="autre">Autre document...</option>
            </select>
          </div>
          {isCustom && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nom du document</label>
              <input value={customLabel} onChange={e => setCustomLabel(e.target.value)} className="input-field text-sm" placeholder="Ex: Attestation de domiciliation" />
            </div>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={handleFile} />
          {docType === "attestation_ias1" && !isCustom ? (
            <button
              onClick={handleAutoLivret}
              disabled={sending}
              className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? "Génération en cours..." : "✨ Générer automatiquement le livret IAS1"}
            </button>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={sending || (isCustom && !customLabel.trim())}
              className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? "Envoi en cours..." : "📤 Choisir et envoyer le fichier"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const STEP_LABELS = ['Consultation initiale','Montage dossier','Structure juridique','Soumission ORIAS','Obtention ORIAS','Lancement activité']

// ── Inline reason dialog ──────────────────────────────────────

function ReasonDialog({ docLabel, action, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  const placeholder = action === 'correction'
    ? 'Ex: La date est illisible, merci de renvoyer un document plus récent.'
    : 'Ex: Document expiré ou illisible, veuillez envoyer la version correcte.'

  return (
    <div className="mt-2 p-3 rounded-xl border bg-white shadow-sm space-y-2">
      <p className="text-xs font-semibold text-gray-600">
        {action === 'correction' ? '💬 Message de correction pour le client :' : '❌ Raison du rejet :'}
      </p>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="input-field resize-none text-xs py-2"
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Annuler</button>
        <button
          onClick={() => onConfirm(reason)}
          disabled={!reason.trim()}
          className={`text-xs px-3 py-1.5 rounded-lg font-semibold text-white disabled:opacity-40 ${
            action === 'correction' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          Confirmer
        </button>
      </div>
    </div>
  )
}

// ── Admin document row ────────────────────────────────────────

function AdminDocRow({ doc, catLabel, onAction }) {
  const [showDialog, setShowDialog] = useState(null) // 'reject' | 'correction' | null

  const statusCfg = {
    valid:      { badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: '✅', label: 'Validé' },
    pending:    { badge: 'bg-amber-50 border-amber-200 text-amber-700',      icon: '⏳', label: 'En attente' },
    missing:    { badge: 'bg-red-50 border-red-200 text-red-700',            icon: '❌', label: 'Rejeté' },
    correction: { badge: 'bg-orange-50 border-orange-200 text-orange-700',   icon: '💬', label: 'Correction dem.' },
    none:       { badge: 'bg-gray-50 border-gray-200 text-gray-500',         icon: '➖', label: 'Non soumis' },
  }
  const cfg = statusCfg[doc?.status ?? 'none']

  return (
    <div className="p-3 rounded-xl border border-orias-border bg-white">
      <div className="flex flex-wrap items-center gap-2">
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{catLabel}</p>
          {doc?.fileName && (
            <p className="text-xs text-gray-400 truncate">📎 {doc.fileName}</p>
          )}
          {doc?.rejectionReason && (
            <p className="text-xs text-red-500 mt-0.5 truncate">"{doc.rejectionReason}"</p>
          )}
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.badge}`}>
          {cfg.icon} {cfg.label}
        </span>

        {/* Download */}
        {doc?.fileUrl && (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1.5 rounded-lg bg-orias-bg border border-orias-border text-orias-green hover:bg-orias-green hover:text-white transition-colors"
            title="Voir / télécharger"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
        )}

        {/* Action buttons (only when doc submitted and not already valid) */}
        {doc && doc.status !== 'valid' && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onAction(doc.id, 'valide', null)}
              className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold transition-colors"
              title="Valider"
            >✅ Valider</button>
            <button
              onClick={() => setShowDialog(showDialog === 'reject' ? null : 'reject')}
              className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 font-semibold transition-colors"
              title="Rejeter"
            >❌ Rejeter</button>
            <button
              onClick={() => setShowDialog(showDialog === 'correction' ? null : 'correction')}
              className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 font-semibold transition-colors"
              title="Demander correction"
            >💬 Correction</button>
          </div>
        )}
        {doc?.status === 'valid' && (
          <button
            onClick={() => onAction(doc.id, 'en_attente', null)}
            className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 font-semibold transition-colors flex-shrink-0"
            title="Annuler la validation"
          >Annuler</button>
        )}
      </div>

      {showDialog === 'reject' && (
        <ReasonDialog
          docLabel={catLabel}
          action="reject"
          onConfirm={reason => { onAction(doc.id, 'manquant', reason); setShowDialog(null) }}
          onCancel={() => setShowDialog(null)}
        />
      )}
      {showDialog === 'correction' && (
        <ReasonDialog
          docLabel={catLabel}
          action="correction"
          onConfirm={reason => { onAction(doc.id, 'correction_demandee', reason); setShowDialog(null) }}
          onCancel={() => setShowDialog(null)}
        />
      )}
    </div>
  )
}

// ── Dossier section ───────────────────────────────────────────

function DossierSection() {
  const [clients,        setClients]        = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [docs,           setDocs]           = useState([])
  const [loadingDocs,    setLoadingDocs]    = useState(false)
  const [updatingStep,   setUpdatingStep]   = useState(false)
  const [currentStep,    setCurrentStep]    = useState(1)

  useEffect(() => {
    fetchAllClients(false).then(data => {
      setClients(data)
      if (data.length > 0) selectClient(data[0])
    })
  }, [])

  const selectClient = (c) => {
    setSelectedClient(c)
    setCurrentStep(c.dossierStep ?? 1)
    setLoadingDocs(true)
    fetchClientDocumentsWithDetails(c.id)
      .then(setDocs)
      .finally(() => setLoadingDocs(false))
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
    setDocs(prev => prev.map(d =>
      d.id === docId
        ? {
            ...d,
            status:          status === 'valide' ? 'valid' : status === 'manquant' ? 'missing' : status === 'correction_demandee' ? 'correction' : 'pending',
            rejectionReason: reason,
          }
        : d
    ))
  }

  // Build a map of category → doc for the 9 required categories
  const docsByCategory = {}
  docs.forEach(d => { if (d.category) docsByCategory[d.category] = d })

  // Pending doc count for selected client
  const pendingCount = docs.filter(d => d.status === 'pending').length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Client selector */}
      <div className="card p-4">
        <h3 className="font-bold text-orias-green mb-3">Sélectionner un client</h3>
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {clients.map(c => (
            <button
              key={c.id}
              onClick={() => selectClient(c)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                selectedClient?.id === c.id ? 'bg-orias-green text-white' : 'hover:bg-orias-bg text-gray-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedClient?.id === c.id ? 'bg-white/20 text-white' : 'bg-orias-green/10 text-orias-green'}`}>
                {c.prenom[0]}{c.nom[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{c.prenom} {c.nom}</p>
                <p className={`text-xs truncate ${selectedClient?.id === c.id ? 'text-green-300' : 'text-gray-400'}`}>{c.pack} · Étape {c.dossierStep ?? 1}</p>
              </div>
              {/* Notification badge */}
              {(c.pendingDocCount ?? 0) > 0 && (
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {c.pendingDocCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dossier detail */}
      <div className="lg:col-span-2 space-y-4">
        {selectedClient ? (
          <>
            {/* Client header */}
            <div className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-orias-green text-lg">{selectedClient.prenom} {selectedClient.nom}</h3>
                  <p className="text-sm text-gray-500">{selectedClient.email}</p>
                  {selectedClient.dossierNumber && (
                    <p className="text-xs font-semibold text-orias-gold mt-0.5">N° {selectedClient.dossierNumber}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`status-badge border ${selectedClient.statut === 'ORIAS obtenu' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {selectedClient.statut}
                  </span>
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                      🔴 {pendingCount} doc{pendingCount > 1 ? 's' : ''} à valider
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Étape actuelle</span>
                <span className="font-bold text-orias-green">{currentStep} / 6</span>
              </div>
              <ProgressBar value={currentStep - 1} max={5} height="h-2" />
            </div>

            {/* Step manager */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-orias-green">Étapes du dossier</h4>
                {updatingStep && (
                  <svg className="animate-spin w-4 h-4 text-orias-gold" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                )}
              </div>
              <div className="space-y-2">
                {STEP_LABELS.map((step, i) => {
                  const stepNum = i + 1
                  const done    = stepNum < currentStep
                  const active  = stepNum === currentStep
                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${
                      done ? 'bg-emerald-50 border-emerald-200' : active ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          done ? 'bg-emerald-500' : active ? 'bg-orias-gold' : 'bg-gray-300'
                        }`}>
                          {done ? <CheckCircleIcon className="w-4 h-4 text-white" /> : <span className="text-xs font-bold text-white">{stepNum}</span>}
                        </div>
                        <span className={`text-sm font-medium ${done ? 'text-emerald-700' : active ? 'text-amber-700' : 'text-gray-400'}`}>{step}</span>
                      </div>
                      {active && (
                        <button
                          onClick={() => handleStepUpdate(Math.min(stepNum + 1, 6))}
                          disabled={updatingStep}
                          className="text-xs font-semibold px-3 py-1 rounded-full bg-orias-gold/20 text-orias-gold hover:bg-orias-gold/30 border border-orias-gold/40 disabled:opacity-40 transition-colors"
                        >
                          Valider →
                        </button>
                      )}
                      {done && <span className="text-xs text-emerald-600 font-semibold">✓ Validé</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-orias-green">Documents ({REQUIRED_DOCUMENTS.length} requis)</h4>
                <div className="flex gap-2 text-xs">
                  <span className="text-emerald-600 font-semibold">
                    {docs.filter(d => d.status === 'valid').length} validés
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-amber-600 font-semibold">
                    {pendingCount} en attente
                  </span>
                </div>
              </div>

              {loadingDocs ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin w-5 h-5 text-orias-gold" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              ) : (
                <div className="space-y-2">
                  {REQUIRED_DOCUMENTS.map(req => (
                    <AdminDocRow
                      key={req.id}
                      doc={docsByCategory[req.id] ?? null}
                      catLabel={req.label}
                      onAction={handleDocAction}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Send received doc to client */}
            <AdminSendDocPanel clientId={selectedClient.id} type="received" />

            {/* Send final doc to client */}
            <AdminSendFinalDocPanel clientId={selectedClient.id} />

            <a
              href={`https://wa.me/?text=Bonjour+${encodeURIComponent(selectedClient.prenom)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#25d366] hover:bg-[#20bd5a] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </>
        ) : (
          <div className="card p-10 text-center text-gray-400">
            <EyeIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Sélectionnez un client pour gérer son dossier.</p>
          </div>
        )}
      </div>
    </div>
  )
}



function FormationTrackingSection() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllClients().then(data => {
      setStudents(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="font-bold text-orias-green text-lg mb-5">Suivi des formations</h3>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin w-5 h-5 text-orias-gold" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Aucun étudiant inscrit pour l'instant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orias-border bg-orias-bg">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Étudiant</th>
                  {FORMATION_UNITS.map(u => (
                    <th key={u.id} className="text-center px-3 py-3.5 font-semibold text-gray-600 hidden md:table-cell">U{u.id}</th>
                  ))}
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">Progression</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Examen</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Livret</th>
                </tr>
              </thead>
              <tbody>
                {students.map((c) => {
                  const prog = Math.min(c.progression ?? 0, 100)
                  const examPassed = c.examPassed ?? false
                  const examScore = c.examScore ?? null
                  const unitsCompleted = Math.min(Math.floor(prog / 20), 5)
                  return (
                    <tr key={c.id} className="border-b border-orias-border/50 hover:bg-orias-bg/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orias-green/10 flex items-center justify-center text-xs font-bold text-orias-green flex-shrink-0">
                            {c.prenom?.[0]}{c.nom?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">{c.prenom} {c.nom}</p>
                            <p className="text-xs text-gray-400">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      {FORMATION_UNITS.map(u => (
                        <td key={u.id} className="px-3 py-3.5 text-center hidden md:table-cell">
                          {unitsCompleted >= u.id
                            ? <CheckCircleIcon className="w-4 h-4 text-emerald-500 mx-auto" />
                            : <ClockIcon className="w-4 h-4 text-gray-300 mx-auto" />
                          }
                        </td>
                      ))}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-orias-green text-sm">{prog}%</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orias-green rounded-full transition-all" style={{width: `${prog}%`}}/>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        {examPassed
                          ? <span className="font-bold text-emerald-600 text-sm">{examScore}/20 ✅</span>
                          : examScore
                            ? <span className="font-bold text-red-500 text-sm">{examScore}/20 ❌</span>
                            : <span className="text-gray-300 text-sm">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5 text-center hidden xl:table-cell">
                        {examPassed ? (
                          <button
                            onClick={() => openLivret(`${c.prenom} ${c.nom}`, c.created_at ?? c.enrolledAt)}
                            className="text-xs font-semibold text-orias-gold hover:text-orias-gold-light flex items-center gap-1 mx-auto border border-orias-gold/30 px-2 py-1 rounded-lg hover:bg-orias-gold/10 transition-colors"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Livret
                          </button>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const STATUS_BADGE_STYLES = {
  nouveau:  'bg-blue-100 text-blue-700 border-blue-200',
  rdv_pris: 'bg-purple-100 text-purple-700 border-purple-200',
  qualifie: 'bg-amber-100 text-amber-700 border-amber-200',
  engage:   'bg-orange-100 text-orange-700 border-orange-200',
  client:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  perdu:    'bg-gray-100 text-gray-500 border-gray-200',
}

const SOURCE_BADGE_STYLES = {
  site_web:  'bg-orias-green/10 text-orias-green',
  whatsapp:  'bg-green-100 text-green-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook:  'bg-blue-100 text-blue-700',
  autre:     'bg-gray-100 text-gray-600',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `il y a ${days}j`
}

const ACTIVITY_META = {
  creation:    { icon: <TargetIcon className="w-3.5 h-3.5" />,       color: 'text-orias-green bg-orias-green/10' },
  statut:      { icon: <CheckCircleIcon className="w-3.5 h-3.5" />,  color: 'text-amber-600 bg-amber-100' },
  rdv:         { icon: <CalendarIcon className="w-3.5 h-3.5" />,     color: 'text-purple-600 bg-purple-100' },
  note:        { icon: <MessageIcon className="w-3.5 h-3.5" />,      color: 'text-blue-600 bg-blue-100' },
  assignation: { icon: <UsersIcon className="w-3.5 h-3.5" />,        color: 'text-gray-600 bg-gray-100' },
  appel:       { icon: <PhoneIcon className="w-3.5 h-3.5" />,        color: 'text-teal-600 bg-teal-100' },
  email:       { icon: <MessageIcon className="w-3.5 h-3.5" />,      color: 'text-indigo-600 bg-indigo-100' },
  tache:       { icon: <CheckCircleIcon className="w-3.5 h-3.5" />,  color: 'text-orias-gold bg-orias-gold/15' },
  pack:        { icon: <TrendingUpIcon className="w-3.5 h-3.5" />,   color: 'text-emerald-600 bg-emerald-100' },
}

function formatDateTimeFR(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDateFR(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDH(n) {
  if (n === null || n === undefined || n === '') return null
  return Math.round(Number(n)).toLocaleString('fr-FR') + ' DH'
}

function isOverdue(dateStr) {
  return dateStr && new Date(dateStr).getTime() < Date.now()
}

// Slide-over detail panel for a single lead — contact info, pipeline status,
// pack & montant potentiel, rendez-vous multiples, tâches, actions rapides (appel/email),
// notes, et historique d'activité complet (HubSpot-style).
function LeadDetailPanel({ lead, packs, onClose, onStatusChange, onSaveNotes, onAddNote, onSetPack, onLogQuick, onConverted, onSaveInfo }) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)

  const [editingInfo, setEditingInfo] = useState(false)
  const [infoFirstName, setInfoFirstName] = useState(lead.first_name || '')
  const [infoLastName, setInfoLastName] = useState(lead.last_name || '')
  const [infoEmail, setInfoEmail] = useState(lead.email || '')
  const [infoPhone, setInfoPhone] = useState(lead.phone || '')
  const [infoCity, setInfoCity] = useState(lead.city || '')
  const [savingInfo, setSavingInfo] = useState(false)
  const [activity, setActivity] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const [packId, setPackId] = useState(lead.pack_id || '')
  const [potentialAmount, setPotentialAmount] = useState(lead.potential_amount ?? '')
  const [discountPercent, setDiscountPercent] = useState(lead.discount_percent || 0)
  const [amountBasis, setAmountBasis] = useState(lead.amount_basis || 'ht')
  const [savingPack, setSavingPack] = useState(false)

  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState('')
  const [convertResult, setConvertResult] = useState(null)

  const [appointments, setAppointments] = useState([])
  const [loadingAppts, setLoadingAppts] = useState(true)
  const [newApptDate, setNewApptDate] = useState('')
  const [newApptType, setNewApptType] = useState('appel')
  const [addingAppt, setAddingAppt] = useState(false)

  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || '—'
  const selectedPack = packs.find(p => p.id === packId)

  const loadActivity = () => {
    setLoadingActivity(true)
    fetchLeadActivity(lead.id).then(data => { setActivity(data); setLoadingActivity(false) })
  }
  const loadAppointments = () => {
    setLoadingAppts(true)
    fetchLeadAppointments(lead.id).then(data => { setAppointments(data); setLoadingAppts(false) })
  }
  const loadTasks = () => {
    setLoadingTasks(true)
    fetchLeadTasks(lead.id).then(data => { setTasks(data); setLoadingTasks(false) })
  }

  useEffect(() => {
    setNotes(lead.notes || '')
    setPackId(lead.pack_id || '')
    setPotentialAmount(lead.potential_amount ?? '')
    setDiscountPercent(lead.discount_percent || 0)
    setAmountBasis(lead.amount_basis || 'ht')
    setConvertResult(null)
    setConvertError('')
    setEditingInfo(false)
    setInfoFirstName(lead.first_name || '')
    setInfoLastName(lead.last_name || '')
    setInfoEmail(lead.email || '')
    setInfoPhone(lead.phone || '')
    setInfoCity(lead.city || '')
    loadActivity()
    loadAppointments()
    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id])

  // Recalcule le montant affiché à chaque changement de pack / remise / base HT-TTC
  const recomputeAmount = (pack, discount, basis) => {
    if (!pack) return ''
    const discounted = pack.price_ht * (1 - (Number(discount) || 0) / 100)
    return Math.round(basis === 'ttc' ? discounted * 1.2 : discounted)
  }

  const handlePackChange = (newPackId) => {
    setPackId(newPackId)
    const pack = packs.find(p => p.id === newPackId)
    setPotentialAmount(recomputeAmount(pack, discountPercent, amountBasis))
  }

  const handleDiscountChange = (value) => {
    setDiscountPercent(value)
    if (selectedPack) setPotentialAmount(recomputeAmount(selectedPack, value, amountBasis))
  }

  const handleBasisChange = (basis) => {
    setAmountBasis(basis)
    if (selectedPack) setPotentialAmount(recomputeAmount(selectedPack, discountPercent, basis))
  }

  const handleSavePack = async () => {
    setSavingPack(true)
    await onSetPack(lead.id, { packId: packId || null, potentialAmount: potentialAmount === '' ? null : Number(potentialAmount) }, { discountPercent: Number(discountPercent) || 0, amountBasis })
    setSavingPack(false)
    loadActivity()
  }

  const handleConvert = async () => {
    setConverting(true)
    setConvertError('')
    const result = await convertLeadToClient({ ...lead, pack_id: packId, discount_percent: discountPercent })
    setConverting(false)
    if (result.success) {
      setConvertResult(result)
      onConverted(lead.id, result.userId)
    } else {
      setConvertError(result.error || 'Erreur lors de la conversion.')
    }
  }

  const handleSaveNotesClick = async () => {
    setSavingNotes(true)
    await onSaveNotes(lead.id, notes)
    setSavingNotes(false)
  }

  const handleSaveInfoClick = async () => {
    setSavingInfo(true)
    await onSaveInfo(lead.id, {
      firstName: infoFirstName.trim(),
      lastName: infoLastName.trim(),
      email: infoEmail.trim(),
      phone: infoPhone.trim(),
      city: infoCity.trim(),
    })
    setSavingInfo(false)
    setEditingInfo(false)
  }

  const handleAddNoteClick = async () => {
    if (!newNote.trim()) return
    setAddingNote(true)
    await onAddNote(lead.id, newNote.trim())
    setNewNote('')
    setAddingNote(false)
    loadActivity()
  }

  const handleStatusSelect = async (newStatus) => {
    await onStatusChange(lead.id, newStatus)
  }

  const handleAddAppointment = async () => {
    if (!newApptDate) return
    setAddingAppt(true)
    await addLeadAppointment(lead.id, { scheduledAt: new Date(newApptDate).toISOString(), type: newApptType })
    setNewApptDate('')
    setAddingAppt(false)
    loadAppointments()
    loadActivity()
  }

  const handleApptStatus = async (apptId, status) => {
    await updateAppointmentStatus(apptId, status)
    loadAppointments()
    loadActivity()
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    await addLeadTask(lead.id, { title: newTaskTitle.trim(), dueAt: newTaskDue ? new Date(newTaskDue).toISOString() : null })
    setNewTaskTitle('')
    setNewTaskDue('')
    setAddingTask(false)
    loadTasks()
    loadActivity()
  }

  const handleToggleTask = async (taskId, done) => {
    await toggleTaskDone(taskId, done)
    loadTasks()
  }

  const handleQuickLog = async (type, label) => {
    await onLogQuick(lead.id, type, label)
    loadActivity()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:w-[460px] bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-orias-green text-white px-6 py-5 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-lg">{fullName}</h3>
            <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_BADGE_STYLES[lead.source] || SOURCE_BADGE_STYLES.autre}`}>
              {LEAD_SOURCE_LABELS[lead.source] || lead.source}
            </span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><XIcon className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Statut / pipeline */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Statut</label>
            <select
              value={lead.status}
              onChange={e => handleStatusSelect(e.target.value)}
              className={`text-sm font-semibold rounded-full px-3 py-1.5 border cursor-pointer ${STATUS_BADGE_STYLES[lead.status]}`}
            >
              {LEAD_STATUSES.map(s => (
                <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Actions rapides */}
          <div className="flex gap-2">
            <button onClick={() => handleQuickLog('appel', 'Appel effectué')} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg px-3 py-2 transition-colors">
              <PhoneIcon className="w-3.5 h-3.5" /> Logger un appel
            </button>
            <button onClick={() => handleQuickLog('email', 'Email envoyé')} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-2 transition-colors">
              <MessageIcon className="w-3.5 h-3.5" /> Logger un email
            </button>
          </div>

          {/* Contact info */}
          {editingInfo ? (
            <div className="space-y-2 text-sm bg-orias-bg rounded-lg p-3 border border-orias-border">
              <div className="grid grid-cols-2 gap-2">
                <input value={infoFirstName} onChange={e => setInfoFirstName(e.target.value)} className="input-field text-sm py-1.5" placeholder="Prénom" />
                <input value={infoLastName} onChange={e => setInfoLastName(e.target.value)} className="input-field text-sm py-1.5" placeholder="Nom" />
              </div>
              <input type="email" value={infoEmail} onChange={e => setInfoEmail(e.target.value)} className="input-field text-sm py-1.5 w-full" placeholder="Email" />
              <input value={infoPhone} onChange={e => setInfoPhone(e.target.value)} className="input-field text-sm py-1.5 w-full" placeholder="Téléphone" />
              <input value={infoCity} onChange={e => setInfoCity(e.target.value)} className="input-field text-sm py-1.5 w-full" placeholder="Ville" />
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveInfoClick} disabled={savingInfo} className="btn-green flex-1 text-xs py-2 disabled:opacity-60">
                  {savingInfo ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button onClick={() => setEditingInfo(false)} className="btn-outline-green flex-1 text-xs py-2">Annuler</button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-sm">
              {lead.email && <div className="text-gray-700">{lead.email}</div>}
              {lead.phone && <div className="text-gray-700 flex items-center gap-1.5"><PhoneIcon className="w-3.5 h-3.5 text-gray-400" />{lead.phone}</div>}
              {lead.city && <div className="text-gray-700">{lead.city}</div>}
              {lead.pack_interest && <div className="text-orias-green font-medium">Intéressé par : {lead.pack_interest}</div>}
              <button onClick={() => setEditingInfo(true)} className="flex items-center gap-1.5 text-xs font-semibold text-orias-gold hover:text-orias-green transition-colors mt-1">
                <EditIcon className="w-3.5 h-3.5" /> Modifier les infos
              </button>
            </div>
          )}

          {lead.message && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Message du lead</label>
              <div className="bg-orias-bg rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{lead.message}</div>
            </div>
          )}

          {/* Pack & montant potentiel */}
          <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-orias-green">Pack & potentiel</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select value={packId} onChange={e => handlePackChange(e.target.value)} className="input-field text-sm py-2 col-span-2">
                <option value="">Sélectionner un pack...</option>
                {packs.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {fmtDH(p.price_ht)} HT</option>
                ))}
              </select>

              <div className="col-span-2 flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Remise</span>
                <select value={discountPercent} onChange={e => handleDiscountChange(e.target.value)} className="input-field text-sm py-2">
                  <option value="0">Aucune</option>
                  <option value="5">5 %</option>
                  <option value="10">10 %</option>
                  <option value="15">15 %</option>
                  <option value="20">20 %</option>
                </select>
                <div className="flex rounded-lg border border-orias-border overflow-hidden flex-shrink-0">
                  <button type="button" onClick={() => handleBasisChange('ht')} className={`px-3 py-2 text-xs font-semibold ${amountBasis === 'ht' ? 'bg-orias-green text-white' : 'text-gray-600 bg-white'}`}>HT</button>
                  <button type="button" onClick={() => handleBasisChange('ttc')} className={`px-3 py-2 text-xs font-semibold ${amountBasis === 'ttc' ? 'bg-orias-green text-white' : 'text-gray-600 bg-white'}`}>TTC</button>
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Potentiel ({amountBasis.toUpperCase()})</span>
                <input
                  type="number"
                  value={potentialAmount}
                  onChange={e => setPotentialAmount(e.target.value)}
                  placeholder="Montant"
                  className="input-field text-sm py-2"
                />
              </div>
            </div>
            <button
              onClick={handleSavePack}
              disabled={savingPack}
              className="text-xs font-semibold text-orias-green hover:underline disabled:opacity-50"
            >
              {savingPack ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {/* Validation du passage en Client : crée le compte, les paiements 50/25/25,
              valide le premier paiement, et envoie l'email de creation de session. */}
          {lead.status === 'client' && (
            <div className={`rounded-xl p-4 border ${lead.converted_user_id ? 'border-emerald-300 bg-emerald-50' : 'border-orias-gold bg-orias-gold/10'}`}>
              {lead.converted_user_id || convertResult ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircleIcon className="w-5 h-5" />
                  Compte client créé — premier paiement validé. Visible dans l'onglet Clients & Finance.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <AwardIcon className="w-4 h-4 text-orias-gold" />
                    <span className="text-sm font-bold text-orias-green">Valider le premier paiement</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Crée le compte client (email de connexion envoyé automatiquement), génère les paiements 50% / 25% / 25%, et marque le premier comme réglé.
                  </p>
                  {convertError && <p className="text-xs text-red-600 mb-2">{convertError}</p>}
                  <button
                    onClick={handleConvert}
                    disabled={converting || !packId}
                    className="btn-gold w-full text-sm py-2 disabled:opacity-50"
                  >
                    {converting ? 'Création en cours...' : !packId ? 'Sélectionnez un pack ci-dessus' : '📌 Valider le paiement & créer le compte'}
                  </button>
                </>
              )}
            </div>
          )}


          <div className="border border-orias-gold/30 bg-orias-gold/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="w-4 h-4 text-orias-gold" />
              <span className="text-sm font-bold text-orias-green">Rendez-vous</span>
            </div>

            {loadingAppts ? (
              <div className="text-xs text-gray-400 mb-2">Chargement...</div>
            ) : appointments.length === 0 ? (
              <div className="text-xs text-gray-400 mb-2">Aucun rendez-vous programmé.</div>
            ) : (
              <div className="space-y-2 mb-3">
                {appointments.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-white rounded-lg border border-orias-border px-3 py-2">
                    <div>
                      <div className={`text-xs font-semibold ${a.status === 'annule' ? 'text-gray-400 line-through' : isOverdue(a.scheduled_at) && a.status === 'planifie' ? 'text-red-600' : 'text-gray-800'}`}>
                        {formatDateTimeFR(a.scheduled_at)}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {APPOINTMENT_TYPE_LABELS[a.type] || a.type} · {APPOINTMENT_STATUS_LABELS[a.status]}
                        {isOverdue(a.scheduled_at) && a.status === 'planifie' && <span className="text-red-600 font-bold ml-1">En retard</span>}
                      </div>
                    </div>
                    {a.status === 'planifie' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApptStatus(a.id, 'termine')} title="Marquer terminé" className="text-emerald-600 hover:bg-emerald-100 rounded p-1"><CheckCircleIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleApptStatus(a.id, 'annule')} title="Annuler" className="text-gray-400 hover:bg-gray-100 rounded p-1"><XIcon className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="datetime-local"
                value={newApptDate}
                onChange={e => setNewApptDate(e.target.value)}
                className="input-field text-sm py-2"
              />
              <select value={newApptType} onChange={e => setNewApptType(e.target.value)} className="input-field text-sm py-2">
                {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddAppointment}
              disabled={addingAppt || !newApptDate}
              className="text-xs font-semibold text-orias-green hover:underline disabled:opacity-50"
            >
              {addingAppt ? 'Ajout...' : '+ Ajouter un rendez-vous'}
            </button>
          </div>

          {/* Tâches */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-orias-green">Tâches</span>
            </div>

            {loadingTasks ? (
              <div className="text-xs text-gray-400 mb-2">Chargement...</div>
            ) : tasks.length === 0 ? (
              <div className="text-xs text-gray-400 mb-2">Aucune tâche.</div>
            ) : (
              <div className="space-y-1.5 mb-3">
                {tasks.map(t => (
                  <label key={t.id} className="flex items-center gap-2 bg-white rounded-lg border border-orias-border px-3 py-2 cursor-pointer">
                    <input type="checkbox" checked={t.done} onChange={e => handleToggleTask(t.id, e.target.checked)} className="w-4 h-4 accent-orias-green" />
                    <div className="flex-1">
                      <div className={`text-sm ${t.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</div>
                      {t.due_at && (
                        <div className={`text-[11px] ${!t.done && isOverdue(t.due_at) ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                          Échéance : {formatDateFR(t.due_at)} {!t.done && isOverdue(t.due_at) && '— En retard'}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Ex: Rappeler le client demain"
                className="input-field text-sm py-2"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={e => setNewTaskDue(e.target.value)}
                  className="input-field text-sm py-2 flex-1"
                />
                <button
                  onClick={handleAddTask}
                  disabled={addingTask || !newTaskTitle.trim()}
                  className="btn-green text-xs px-3 py-2 disabled:opacity-50 whitespace-nowrap"
                >
                  + Tâche
                </button>
              </div>
            </div>
          </div>

          {/* Notes internes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes internes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes générales sur ce lead..."
              className="input-field text-sm resize-none mb-2"
            />
            <button
              onClick={handleSaveNotesClick}
              disabled={savingNotes}
              className="text-xs font-semibold text-orias-green hover:underline disabled:opacity-50"
            >
              {savingNotes ? 'Enregistrement...' : 'Enregistrer les notes'}
            </button>
          </div>

          {/* Historique d'activité */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-3">Historique d'activité</label>

            <div className="flex gap-2 mb-4">
              <input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Ajouter un commentaire à l'historique..."
                className="input-field text-sm py-2 flex-1"
                onKeyDown={e => { if (e.key === 'Enter') handleAddNoteClick() }}
              />
              <button
                onClick={handleAddNoteClick}
                disabled={addingNote || !newNote.trim()}
                className="btn-green text-sm px-4 py-2 disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>

            {loadingActivity ? (
              <div className="text-sm text-gray-400">Chargement...</div>
            ) : activity.length === 0 ? (
              <div className="text-sm text-gray-400">Aucune activité.</div>
            ) : (
              <div className="space-y-3">
                {activity.map(a => (
                  <div key={a.id} className="flex gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${ACTIVITY_META[a.type]?.color || 'bg-gray-100 text-gray-500'}`}>
                      {ACTIVITY_META[a.type]?.icon || <ClockIcon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 pb-3 border-b border-orias-border last:border-0">
                      <p className="text-sm text-gray-700">{a.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KanbanCard({ lead, onOpen, onDragStart }) {
  const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || '—'
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, lead.id)}
      onClick={() => onOpen(lead.id)}
      className="bg-white rounded-xl border border-orias-border p-3 cursor-pointer hover:shadow-md transition-shadow active:cursor-grabbing"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-semibold text-sm text-gray-900 truncate">{fullName}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${SOURCE_BADGE_STYLES[lead.source] || SOURCE_BADGE_STYLES.autre}`}>
          {LEAD_SOURCE_LABELS[lead.source] || lead.source}
        </span>
      </div>
      {lead.email && <div className="text-xs text-gray-500 truncate">{lead.email}</div>}
      {lead.phone && <div className="text-xs text-gray-500">{lead.phone}</div>}
      {lead.potential_amount != null && (
        <div className="text-xs font-bold text-emerald-700 mt-1.5">{fmtDH(lead.potential_amount)}</div>
      )}
      {lead.next_appointment_at && (
        <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${isOverdue(lead.next_appointment_at) ? 'text-red-600' : 'text-purple-600'}`}>
          <CalendarIcon className="w-3 h-3" />
          {formatDateTimeFR(lead.next_appointment_at)}
          {isOverdue(lead.next_appointment_at) && <span className="font-bold">En retard</span>}
        </div>
      )}
      <div className="text-[11px] text-gray-400 mt-1.5">{timeAgo(lead.created_at)}</div>
    </div>
  )
}

function KanbanColumn({ status, leads, onOpen, onDragStart, onDrop }) {
  const [isOver, setIsOver] = useState(false)
  const totalAmount = leads.reduce((sum, l) => sum + (Number(l.potential_amount) || 0), 0)
  const weightedAmount = totalAmount * (STAGE_WEIGHTS[status] ?? 0)

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={e => { e.preventDefault(); setIsOver(false); onDrop(status) }}
      className={`flex-shrink-0 w-[260px] rounded-xl transition-colors ${isOver ? 'bg-orias-gold/10 ring-2 ring-orias-gold/40' : 'bg-orias-bg'} p-3 flex flex-col`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-sm font-bold text-orias-green">{LEAD_STATUS_LABELS[status]}</span>
        <span className="text-xs font-semibold text-gray-400 bg-white rounded-full px-2 py-0.5">{leads.length}</span>
      </div>
      <div className="space-y-2 min-h-[80px] flex-1">
        {leads.map(lead => (
          <KanbanCard key={lead.id} lead={lead} onOpen={onOpen} onDragStart={onDragStart} />
        ))}
      </div>
      {totalAmount > 0 && (
        <div className="mt-3 pt-2 border-t border-orias-border/60 px-1 text-[11px] text-gray-500">
          <div className="font-semibold text-gray-700">{fmtDH(totalAmount)} <span className="font-normal text-gray-400">| Potentiel total</span></div>
          <div>{fmtDH(weightedAmount)} <span className="text-gray-400">| Pondéré ({Math.round((STAGE_WEIGHTS[status] ?? 0) * 100)}%)</span></div>
        </div>
      )}
    </div>
  )
}

function LeadCard({ lead, onStatusChange, onSaveNotes, onOpen }) {
  const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || '—'

  return (
    <div className="card p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpen(lead.id)}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-gray-900">{fullName}</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_BADGE_STYLES[lead.source] || SOURCE_BADGE_STYLES.autre}`}>
              {LEAD_SOURCE_LABELS[lead.source] || lead.source}
            </span>
            {lead.potential_amount != null && (
              <span className="text-[11px] font-bold text-emerald-700">{fmtDH(lead.potential_amount)}</span>
            )}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-3 flex-wrap">
            {lead.email && <span>{lead.email}</span>}
            {lead.phone && <span className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" />{lead.phone}</span>}
            {lead.city && <span>{lead.city}</span>}
          </div>
          {lead.pack_interest && (
            <div className="text-xs text-orias-green font-medium mt-1">Intéressé par : {lead.pack_interest}</div>
          )}
          {lead.next_appointment_at && (
            <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${isOverdue(lead.next_appointment_at) ? 'text-red-600' : 'text-purple-600'}`}>
              <CalendarIcon className="w-3 h-3" />{formatDateTimeFR(lead.next_appointment_at)}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <select
            value={lead.status}
            onChange={e => onStatusChange(lead.id, e.target.value)}
            className={`text-xs font-semibold rounded-full px-3 py-1.5 border cursor-pointer ${STATUS_BADGE_STYLES[lead.status]}`}
          >
            {LEAD_STATUSES.map(s => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <span className="text-[11px] text-gray-400">{timeAgo(lead.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

// Vue Agenda — tous les rendez-vous et tâches à venir, tous leads confondus,
// regroupés Aujourd'hui / Cette semaine / Plus tard, avec badge "En retard".
function AgendaView({ onOpenLead }) {
  const [appointments, setAppointments] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchUpcomingAppointments(), fetchUpcomingTasks()]).then(([appts, tks]) => {
      setAppointments(appts)
      setTasks(tks)
      setLoading(false)
    })
  }, [])

  const groupByPeriod = (items, dateKey) => {
    const now = new Date()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000)
    const groups = { overdue: [], today: [], week: [], later: [] }
    items.forEach(item => {
      const dateVal = item[dateKey]
      if (!dateVal) { groups.later.push(item); return }
      const d = new Date(dateVal)
      if (d < now) groups.overdue.push(item)
      else if (d <= todayEnd) groups.today.push(item)
      else if (d <= weekEnd) groups.week.push(item)
      else groups.later.push(item)
    })
    return groups
  }

  const apptGroups = groupByPeriod(appointments, 'scheduled_at')
  const taskGroups = groupByPeriod(tasks, 'due_at')

  const renderApptRow = (a) => {
    const fullName = `${a.leads?.first_name || ''} ${a.leads?.last_name || ''}`.trim() || '—'
    return (
      <div key={a.id} onClick={() => onOpenLead(a.lead_id)} className="card p-3 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">{fullName}</div>
            <div className="text-xs text-gray-500">{APPOINTMENT_TYPE_LABELS[a.type] || a.type} · {a.leads?.phone || a.leads?.email || ''}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${isOverdue(a.scheduled_at) ? 'text-red-600' : 'text-gray-800'}`}>{formatDateTimeFR(a.scheduled_at)}</div>
          {isOverdue(a.scheduled_at) && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">En retard</span>}
        </div>
      </div>
    )
  }

  const renderTaskRow = (t) => {
    const fullName = `${t.leads?.first_name || ''} ${t.leads?.last_name || ''}`.trim() || '—'
    return (
      <div key={t.id} onClick={() => onOpenLead(t.lead_id)} className="card p-3 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <CheckCircleIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">{t.title}</div>
            <div className="text-xs text-gray-500">{fullName}</div>
          </div>
        </div>
        {t.due_at && (
          <div className="text-right">
            <div className={`text-sm font-semibold ${isOverdue(t.due_at) ? 'text-red-600' : 'text-gray-800'}`}>{formatDateFR(t.due_at)}</div>
            {isOverdue(t.due_at) && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">En retard</span>}
          </div>
        )}
      </div>
    )
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement de l'agenda...</div>

  const sections = [
    { key: 'overdue', label: 'En retard' },
    { key: 'today',   label: "Aujourd'hui" },
    { key: 'week',    label: 'Cette semaine' },
    { key: 'later',   label: 'Plus tard' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="font-bold text-orias-green mb-3 flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Rendez-vous</h3>
        <div className="space-y-4">
          {sections.map(({ key, label }) => apptGroups[key].length > 0 && (
            <div key={key}>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</div>
              <div className="space-y-2">{apptGroups[key].map(renderApptRow)}</div>
            </div>
          ))}
          {appointments.length === 0 && <div className="text-sm text-gray-400">Aucun rendez-vous à venir.</div>}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-orias-green mb-3 flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Tâches</h3>
        <div className="space-y-4">
          {sections.map(({ key, label }) => taskGroups[key].length > 0 && (
            <div key={key}>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</div>
              <div className="space-y-2">{taskGroups[key].map(renderTaskRow)}</div>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-sm text-gray-400">Aucune tâche en attente.</div>}
        </div>
      </div>
    </div>
  )
}

function AddLeadModal({ packs, onClose, onAdded }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    city: '', pack_interest: '', message: '', source: 'whatsapp',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.first_name && !form.phone && !form.email) {
      setError('Renseignez au moins un nom, email ou téléphone.')
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('leads').insert({
      source: form.source,
      status: 'nouveau',
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      email: form.email || null,
      phone: form.phone || null,
      city: form.city || null,
      pack_interest: form.pack_interest || null,
      message: form.message || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-orias-green px-6 py-5 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Ajouter un lead manuellement</h3>
          <button onClick={onClose} className="text-green-300 hover:text-white"><XIcon className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Source *</label>
              <select value={form.source} onChange={e => update('source', e.target.value)} className="input-field text-sm">
                {Object.entries(LEAD_SOURCE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Prénom</label>
                <input value={form.first_name} onChange={e => update('first_name', e.target.value)} className="input-field text-sm" placeholder="Prénom" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nom</label>
                <input value={form.last_name} onChange={e => update('last_name', e.target.value)} className="input-field text-sm" placeholder="Nom" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">WhatsApp / Téléphone</label>
              <input value={form.phone} onChange={e => update('phone', e.target.value)} className="input-field text-sm" placeholder="+212 6XX XXX XXX" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-field text-sm" placeholder="email@exemple.com" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Ville</label>
              <input value={form.city} onChange={e => update('city', e.target.value)} className="input-field text-sm" placeholder="Casablanca, Rabat..." />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Pack intéressé</label>
              <select value={form.pack_interest} onChange={e => update('pack_interest', e.target.value)} className="input-field text-sm">
                <option value="">Sélectionner...</option>
                {packs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                <option value="Je ne sais pas encore">Je ne sais pas encore</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Notes / Message</label>
              <textarea value={form.message} onChange={e => update('message', e.target.value)} rows={3} className="input-field text-sm resize-none" placeholder="Notes sur ce lead, contexte de la conversation..." />
            </div>

            <button type="submit" disabled={saving} className="btn-gold w-full disabled:opacity-60">
              {saving ? 'Ajout en cours...' : 'Ajouter ce lead'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function CRMSection() {
  const [leads, setLeads] = useState([])
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [showAddLead, setShowAddLead] = useState(false)

  const enrichWithNextAppointment = async (leadsData) => {
    const upcoming = await fetchUpcomingAppointments()
    const nextByLead = {}
    upcoming.forEach(a => {
      if (!nextByLead[a.lead_id] || new Date(a.scheduled_at) < new Date(nextByLead[a.lead_id])) {
        nextByLead[a.lead_id] = a.scheduled_at
      }
    })
    return leadsData.map(l => ({ ...l, next_appointment_at: nextByLead[l.id] || null }))
  }

  useEffect(() => {
    Promise.all([fetchLeads(), fetchPacks()]).then(async ([leadsData, packsData]) => {
      const enriched = await enrichWithNextAppointment(leadsData)
      setLeads(enriched)
      setPacks(packsData)
      setLoading(false)
    })

    const unsubscribe = subscribeToLeads(({ event, lead }) => {
      if (!lead) return
      if (event === 'INSERT') {
        setLeads(prev => [{ ...lead, _isNew: true }, ...prev])
        setToast(`Nouveau lead reçu — ${lead.first_name || lead.email || 'Inconnu'} (${LEAD_SOURCE_LABELS[lead.source] || lead.source})`)
        setTimeout(() => {
          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, _isNew: false } : l))
        }, 6000)
      } else if (event === 'UPDATE') {
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...lead } : l))
      } else if (event === 'DELETE') {
        setLeads(prev => prev.filter(l => l.id !== lead.id))
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast])

  const handleStatusChange = async (leadId, status) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))
    await updateLeadStatus(leadId, status)
  }

  const handleSaveNotes = async (leadId, notes) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l))
    await updateLeadNotes(leadId, notes)
  }

  const handleSaveInfo = async (leadId, { firstName, lastName, email, phone, city }) => {
    setLeads(prev => prev.map(l => l.id === leadId ? {
      ...l, first_name: firstName || null, last_name: lastName || null, email: email || null, phone: phone || null, city: city || null,
    } : l))
    await updateLeadInfo(leadId, { firstName, lastName, email, phone, city })
    setToast('Informations du lead mises à jour ✓')
  }

  const handleAddNote = async (leadId, note) => {
    await addLeadNote(leadId, note)
  }

  const handleSetPack = async (leadId, { packId, potentialAmount }, pricing) => {
    setLeads(prev => prev.map(l => l.id === leadId ? {
      ...l,
      pack_id: packId,
      potential_amount: potentialAmount,
      ...(pricing ? { discount_percent: pricing.discountPercent, amount_basis: pricing.amountBasis } : {}),
    } : l))
    await setLeadPack(leadId, { packId, potentialAmount })
    if (pricing) await setLeadPricing(leadId, pricing)
  }

  const handleConverted = (leadId, userId) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, converted_user_id: userId } : l))
    setToast('Client créé avec succès — email de connexion envoyé.')
  }

  const handleLogQuick = async (leadId, type, description) => {
    await logQuickActivity(leadId, type, description)
  }

  const handleDrop = (status) => {
    const draggedId = window.__draggedLeadId
    if (draggedId) handleStatusChange(draggedId, status)
  }

  const handleDragStart = (e, leadId) => {
    window.__draggedLeadId = leadId
    e.dataTransfer.effectAllowed = 'move'
  }

  const filtered = leads.filter(l => {
    if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
    if (search) {
      const hay = `${l.first_name || ''} ${l.last_name || ''} ${l.email || ''} ${l.phone || ''}`.toLowerCase()
      if (!hay.includes(search.toLowerCase())) return false
    }
    return true
  })

  const total = leads.length
  const clientsCount = leads.filter(l => l.status === 'client').length
  const conversionRate = total > 0 ? Math.round((clientsCount / total) * 100) : 0
  const totalPotential = leads.reduce((sum, l) => sum + (Number(l.potential_amount) || 0), 0)

  const countsBySource = leads.reduce((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1
    return acc
  }, {})

  const selectedLead = selectedLeadId ? leads.find(l => l.id === selectedLeadId) : null

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement du CRM...</div>
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-orias-green text-white px-5 py-3 rounded-xl shadow-2xl shadow-black/20 flex items-center gap-3 animate-pulse">
          <BellIcon className="w-5 h-5 text-orias-gold flex-shrink-0" />
          <span className="text-sm font-semibold">{toast}</span>
          <button onClick={() => setToast(null)} className="text-white/60 hover:text-white"><XIcon className="w-4 h-4" /></button>
        </div>
      )}

      {showAddLead && (
        <AddLeadModal
          packs={packs}
          onClose={() => setShowAddLead(false)}
          onAdded={() => {
            fetchLeads().then(async data => {
              const enriched = await enrichWithNextAppointment(data)
              setLeads(enriched)
            })
            setToast('Lead ajouté avec succès ✓')
          }}
        />
      )}

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          packs={packs}
          onClose={() => setSelectedLeadId(null)}
          onStatusChange={handleStatusChange}
          onSaveNotes={handleSaveNotes}
          onSaveInfo={handleSaveInfo}
          onAddNote={handleAddNote}
          onSetPack={handleSetPack}
          onLogQuick={handleLogQuick}
          onConverted={handleConverted}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<TargetIcon className="w-5 h-5 text-white" />} label="Total leads" value={total} color="bg-orias-green-light border-white/10" />
        <StatCard icon={<TrendingUpIcon className="w-5 h-5 text-orias-gold" />} label="Potentiel total" value={fmtDH(totalPotential) || '0 DH'} color="bg-orias-gold/15 border-orias-gold/20" />
        <StatCard icon={<CheckCircleIcon className="w-5 h-5 text-emerald-600" />} label="Clients" value={clientsCount} color="bg-emerald-100 border-emerald-200" />
        <StatCard icon={<AwardIcon className="w-5 h-5 text-orias-gold" />} label="Taux de conversion" value={`${conversionRate}%`} color="bg-orias-gold/15 border-orias-gold/20" />
      </div>

      <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
          {LEAD_STATUSES.map(s => (
            <span key={s} className={`px-2 py-1 rounded-full font-semibold border ${STATUS_BADGE_STYLES[s]}`}>
              {LEAD_STATUS_LABELS[s]}: {leads.filter(l => l.status === s).length}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
          {Object.entries(countsBySource).map(([src, count]) => (
            <span key={src} className={`px-2 py-1 rounded-full font-semibold ${SOURCE_BADGE_STYLES[src] || SOURCE_BADGE_STYLES.autre}`}>
              {LEAD_SOURCE_LABELS[src] || src}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Filters + view toggle */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-orias-border overflow-hidden flex-shrink-0">
          <button onClick={() => setView('kanban')} className={`px-4 py-2 text-sm font-semibold transition-colors ${view === 'kanban' ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>Kanban</button>
          <button onClick={() => setView('agenda')} className={`px-4 py-2 text-sm font-semibold transition-colors ${view === 'agenda' ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>Agenda</button>
          <button onClick={() => setView('liste')} className={`px-4 py-2 text-sm font-semibold transition-colors ${view === 'liste' ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>Liste</button>
        </div>
        {view !== 'agenda' && (
          <>
            <div className="relative flex-1 min-w-[180px]">
              <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un lead..."
                className="input-field pl-9 text-sm"
              />
            </div>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="input-field text-sm w-auto">
              <option value="all">Toutes les sources</option>
              {Object.entries(LEAD_SOURCE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </>
        )}
        <button
          onClick={() => setShowAddLead(true)}
          className="btn-gold flex items-center gap-2 text-sm ml-auto flex-shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un lead
        </button>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {LEAD_STATUSES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              leads={filtered.filter(l => l.status === status)}
              onOpen={setSelectedLeadId}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {/* Agenda view */}
      {view === 'agenda' && (
        <AgendaView onOpenLead={setSelectedLeadId} />
      )}

      {/* List view */}
      {view === 'liste' && (
        filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Aucun lead pour le moment.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(lead => (
              <LeadCard key={lead.id} lead={lead} onStatusChange={handleStatusChange} onSaveNotes={handleSaveNotes} onOpen={setSelectedLeadId} />
            ))}
          </div>
        )
      )}
    </div>
  )
}


function TeamSection() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () => fetchAdmins().then(data => { setAdmins(data); setLoading(false) })

  useEffect(() => { load() }, [])

  const handleToggleBlock = async (admin) => {
    setBusy(true)
    await toggleUserBlocked(admin.id, !admin.blocked)
    await load()
    setBusy(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    setError('')
    const result = await deleteAdminAccount(deleteTarget.id)
    setBusy(false)
    if (result.success) {
      setDeleteTarget(null)
      load()
    } else {
      setError(result.error || 'Erreur lors de la suppression.')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement de l'équipe...</div>

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-orias-green text-lg">Équipe</h2>
          <p className="text-sm text-gray-500">{admins.length} compte{admins.length > 1 ? 's' : ''} avec accès admin</p>
        </div>
        <button onClick={() => setShowAddAdmin(true)} className="btn-gold flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Ajouter un admin
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-orias-bg text-left text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orias-border">
            {admins.map(admin => (
              <tr key={admin.id} className="hover:bg-orias-bg/50">
                <td className="px-5 py-3 font-semibold text-gray-800">{admin.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{admin.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${admin.role === 'super_admin' ? 'bg-orias-gold/20 text-orias-gold' : 'bg-orias-green/10 text-orias-green'}`}>
                    {admin.role === 'super_admin' ? 'Super admin' : 'Admin'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {admin.blocked ? (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-600">Bloqué</span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Actif</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {admin.role !== 'super_admin' && (
                      <>
                        <button
                          onClick={() => handleToggleBlock(admin)}
                          disabled={busy}
                          className={`p-1.5 rounded-lg transition-colors ${admin.blocked ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                          title={admin.blocked ? 'Débloquer' : 'Bloquer'}
                        >
                          {admin.blocked
                            ? <CheckCircleIcon className="w-4 h-4" />
                            : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          }
                        </button>
                        <button
                          onClick={() => setDeleteTarget(admin)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddAdmin && <AddAdminModal onClose={() => setShowAddAdmin(false)} onAdd={() => { load(); setShowAddAdmin(false) }} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Supprimer ce compte ?</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{deleteTarget.full_name}</strong> ({deleteTarget.email}) sera définitivement supprimé. Cette action est irréversible.
            </p>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-orias-border text-gray-600 font-semibold text-sm">Annuler</button>
              <button onClick={handleDelete} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-60">
                {busy ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationsSection() {
  const [tab, setTab] = useState('individual')
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [allClients, setAllClients] = useState([])

  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [ticketFilter, setTicketFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [expandedTicket, setExpandedTicket] = useState(null)
  const [responseDrafts, setResponseDrafts] = useState({})

  const loadTickets = () => fetchSupportTickets().then(data => { setTickets(data); setLoadingTickets(false) })

  useEffect(() => {
    fetchAllClients().then(data => setAllClients(data.filter(c => c.email !== 'admin@oriafen.com')))
    loadTickets()
    const unsubscribe = subscribeToSupportTickets(({ event, ticket }) => {
      if (!ticket) return
      if (event === 'INSERT') {
        loadTickets()
        setToast(`Nouveau ${ticket.source === 'client' ? 'message client' : 'ticket interne'} — ${ticket.subject}`)
        setTimeout(() => setToast(null), 6000)
      } else {
        loadTickets()
      }
    })
    return unsubscribe
  }, [])

  const handleSend = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => { setSent(false); setMessage(''); setRecipient('') }, 3000)
  }

  const handleStatusChange = async (ticketId, status) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t))
    await updateTicketStatus(ticketId, status)
  }

  const handleSendResponse = async (ticketId) => {
    const response = responseDrafts[ticketId]
    if (!response?.trim()) return
    await updateTicketStatus(ticketId, 'resolu', response.trim())
    setResponseDrafts(prev => ({ ...prev, [ticketId]: '' }))
    loadTickets()
  }

  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === 'client') return t.source === 'client'
    if (ticketFilter === 'admin_interne') return t.source === 'admin_interne'
    if (ticketFilter === 'nouveau') return t.status === 'nouveau'
    return true
  })

  const newCount = tickets.filter(t => t.status === 'nouveau').length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-orias-green text-white px-5 py-3 rounded-xl shadow-2xl shadow-black/20 flex items-center gap-3 animate-pulse col-span-full">
          <BellIcon className="w-5 h-5 text-orias-gold flex-shrink-0" />
          <span className="text-sm font-semibold">{toast}</span>
          <button onClick={() => setToast(null)} className="text-white/60 hover:text-white"><XIcon className="w-4 h-4" /></button>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex rounded-xl border border-orias-border overflow-hidden">
            <button onClick={() => setTab('individual')} className={`px-4 py-2 text-sm font-semibold transition-colors ${tab === 'individual' ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>Individuel</button>
            <button onClick={() => setTab('broadcast')} className={`px-4 py-2 text-sm font-semibold transition-colors ${tab === 'broadcast' ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>Tous les clients</button>
          </div>
        </div>
        {sent ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
            <CheckCircleIcon className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-emerald-700">Message envoyé avec succès !</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            {tab === 'individual' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Destinataire</label>
                <select value={recipient} onChange={e => setRecipient(e.target.value)} className="input-field" required>
                  <option value="">Sélectionner un client...</option>
                  {allClients.map(c => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                  ))}
                </select>
              </div>
            )}
            {tab === 'broadcast' && (
              <div className="bg-orias-gold/10 rounded-xl p-3 border border-orias-gold/30 text-sm text-orias-gold font-medium">
                Ce message sera envoyé à tous les {allClients.length} clients actifs.
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="input-field resize-none"
                rows={4}
                placeholder="Rédiger votre message..."
                required
              />
            </div>
            <button type="submit" className="btn-gold w-full flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Envoyer le message
            </button>
          </form>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-orias-green flex items-center gap-2">
            Messages reçus
            {newCount > 0 && <span className="text-xs font-bold bg-orias-gold text-orias-green rounded-full px-2 py-0.5">{newCount} nouveau{newCount > 1 ? 'x' : ''}</span>}
          </h3>
          <div className="flex rounded-lg border border-orias-border overflow-hidden text-xs">
            {[['all','Tous'],['client','Clients'],['admin_interne','Équipe'],['nouveau','Non traités']].map(([v,l]) => (
              <button key={v} onClick={() => setTicketFilter(v)} className={`px-2.5 py-1.5 font-semibold transition-colors ${ticketFilter === v ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>{l}</button>
            ))}
          </div>
        </div>

        {loadingTickets ? (
          <div className="text-sm text-gray-400 text-center py-8">Chargement...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">Aucun message.</div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredTickets.map(t => (
              <div key={t.id} className="p-4 rounded-xl bg-orias-bg border border-orias-border">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.subject}</p>
                    <p className="text-xs text-gray-400">{t.users?.full_name || t.users?.email} · {timeAgo(t.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {t.priority === 'urgent' && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600">Urgent</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.source === 'admin_interne' ? 'bg-purple-100 text-purple-700' : 'bg-orias-green/10 text-orias-green'}`}>
                      {t.source === 'admin_interne' ? 'Équipe' : 'Client'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2 cursor-pointer" onClick={() => setExpandedTicket(expandedTicket === t.id ? null : t.id)}>
                  {expandedTicket === t.id ? t.message : (t.message.length > 100 ? t.message.slice(0, 100) + '...' : t.message)}
                </p>

                {t.response && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-2 text-xs text-emerald-700">
                    <span className="font-semibold">Réponse :</span> {t.response}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <select
                    value={t.status}
                    onChange={e => handleStatusChange(t.id, e.target.value)}
                    className="text-xs font-semibold rounded-full px-2 py-1 border border-orias-border bg-white"
                  >
                    {Object.entries(TICKET_STATUS_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>

                {expandedTicket === t.id && t.status !== 'resolu' && (
                  <div className="flex gap-2 mt-2">
                    <input
                      value={responseDrafts[t.id] || ''}
                      onChange={e => setResponseDrafts(prev => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="Répondre..."
                      className="input-field text-xs py-1.5 flex-1"
                    />
                    <button onClick={() => handleSendResponse(t.id)} className="btn-green text-xs px-3 py-1.5">Répondre</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const MILESTONE_LABELS = {
  souscription:   'Souscription (50%)',
  kbis_formation: 'Kbis + Formation (25%)',
  orias:          'ORIAS obtenu (25%)',
  full:           'Paiement unique (100%)',
}

const MILESTONE_ORDER = { souscription: 0, kbis_formation: 1, orias: 2, full: 0 }

function FinanceSection() {
  const [summary, setSummary] = useState({ totalRevenuePaid: 0, totalPending: 0, monthRevenue: 0, payments: [] })
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState({})
  const [allClientsList, setAllClientsList] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('all')

  const load = () => {
    setLoading(true)
    Promise.all([fetchFinanceSummary(), fetchAllClients()]).then(([financeData, clients]) => {
      setSummary(financeData)
      setAllClientsList(clients.filter(c => c.email !== 'admin@oriafen.com'))
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const handleMarkPaid = async (paymentId) => {
    setMarking(prev => ({ ...prev, [paymentId]: true }))
    await markPaymentPaid(paymentId)
    await load()
    setMarking(prev => ({ ...prev, [paymentId]: false }))
  }

  const fmt = (n) => Math.round(n).toLocaleString('fr-FR') + ' DHS'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-8 h-8 text-orias-gold" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  // Group all payments by client
  const byClient = {}
  summary.payments.forEach(p => {
    const key = p.user_id
    if (!byClient[key]) byClient[key] = { clientId: key, client: p.users, pack: p.packs, payments: [] }
    byClient[key].payments.push(p)
  })
  // Add clients who have no payments at all yet (e.g. no pack assigned), so they're still selectable
  allClientsList.forEach(c => {
    if (!byClient[c.id]) {
      byClient[c.id] = { clientId: c.id, client: { full_name: `${c.prenom} ${c.nom}`, email: c.email }, pack: c.packId ? { name: c.pack } : null, payments: [] }
    }
  })
  const statusByClientId = {}
  allClientsList.forEach(c => { statusByClientId[c.id] = c.statut })
  let clientGroups = Object.values(byClient).map(g => ({
    ...g,
    payments: [...g.payments].sort((a, b) => (MILESTONE_ORDER[a.milestone] ?? 0) - (MILESTONE_ORDER[b.milestone] ?? 0)),
  }))
  if (selectedClientId !== 'all') {
    clientGroups = clientGroups.filter(g => g.clientId === selectedClientId)
  }

  const allPaid = summary.payments.filter(p => p.status === 'paid')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700 mb-1">CA encaissé (total)</p>
          <p className="text-2xl font-bold text-emerald-800">{fmt(summary.totalRevenuePaid)}</p>
        </div>
        <div className="card p-5 bg-orias-gold/10 border-orias-gold/30">
          <p className="text-xs font-semibold text-orias-gold mb-1">CA ce mois-ci</p>
          <p className="text-2xl font-bold text-orias-green">{fmt(summary.monthRevenue)}</p>
        </div>
        <div className="card p-5 bg-emerald-50/60 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700 mb-1">CA année {new Date().getFullYear()}</p>
          <p className="text-2xl font-bold text-emerald-800">{fmt(summary.yearRevenue)}</p>
        </div>
        <div className="card p-5 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">En attente ({summary.pendingCount} paiement{summary.pendingCount > 1 ? 's' : ''})</p>
          <p className="text-2xl font-bold text-amber-800">{fmt(summary.totalPending)}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <h3 className="font-bold text-orias-green">Paiements par client ({clientGroups.length})</h3>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="input-field text-sm max-w-xs"
          >
            <option value="all">Tous les clients</option>
            {Object.values(byClient).map(g => (
              <option key={g.clientId} value={g.clientId}>
                {g.client?.full_name ?? g.client?.email ?? '—'}
              </option>
            ))}
          </select>
        </div>
        {clientGroups.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun client avec un pack assigné.</p>
        ) : (
          <div className="space-y-4">
            {clientGroups.map(group => {
              // Find index of the first non-paid payment — that's the only one currently actionable
              const firstPendingIdx = group.payments.findIndex(p => p.status === 'pending')
              const totalDue = group.payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount_ttc), 0)
              const isCancelled = statusByClientId[group.clientId] === 'Annulé'
              return (
                <div key={group.clientId ?? Math.random()} className={`rounded-xl border overflow-hidden ${isCancelled ? 'border-red-200 opacity-70' : 'border-orias-border'}`}>
                  <div className="bg-orias-bg px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{group.client?.full_name ?? group.client?.email ?? '—'}</p>
                        {isCancelled && (
                          <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Annulé</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{group.pack?.name ?? 'Aucun pack assigné'}</p>
                    </div>
                    {totalDue > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-amber-600 font-medium">Reste à payer</p>
                        <p className="text-sm font-bold text-amber-700">{fmt(totalDue)}</p>
                      </div>
                    )}
                  </div>
                  {group.payments.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-400">Aucun paiement enregistré pour ce client.</div>
                  ) : (
                  <div className="divide-y divide-orias-border">
                    {group.payments.map((p, idx) => {
                      const isPaid = p.status === 'paid'
                      const isActionable = !isPaid && idx === firstPendingIdx
                      const isLocked = !isPaid && idx !== firstPendingIdx
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between gap-3 px-4 py-3 ${isLocked ? 'opacity-40 bg-gray-50' : isPaid ? 'bg-emerald-50/40' : 'bg-white'}`}
                        >
                          <div className="flex items-center gap-2">
                            {isPaid ? (
                              <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <ClockIcon className={`w-4 h-4 flex-shrink-0 ${isActionable ? 'text-orias-gold' : 'text-gray-300'}`} />
                            )}
                            <div>
                              <p className="text-sm text-gray-700">{MILESTONE_LABELS[p.milestone] ?? p.milestone}</p>
                              {isPaid && p.paid_at && (
                                <p className="text-xs text-emerald-600">payé le {new Date(p.paid_at).toLocaleDateString('fr-FR')}</p>
                              )}
                              {p.discount_percent > 0 && (
                                <p className="text-xs text-orias-gold">-{p.discount_percent}% discount appliqué</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`font-bold text-sm ${isPaid ? 'text-emerald-700' : isActionable ? 'text-orias-green' : 'text-gray-400'}`}>{fmt(p.amount_ttc)}</span>
                            {isPaid ? (
                              <span className="text-xs font-semibold text-emerald-600 px-2 py-1 rounded-full bg-emerald-100">Payé</span>
                            ) : isActionable ? (
                              <button
                                onClick={() => handleMarkPaid(p.id)}
                                disabled={marking[p.id]}
                                className="btn-gold text-xs px-3 py-1.5 disabled:opacity-60"
                              >
                                {marking[p.id] ? '...' : 'Valider'}
                              </button>
                            ) : (
                              <span className="text-xs font-medium text-gray-400 px-2 py-1 rounded-full bg-gray-100">En attente</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-orias-green mb-4">Historique des paiements reçus ({allPaid.length})</h3>
        {allPaid.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun paiement reçu pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {allPaid.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{p.users?.full_name ?? p.users?.email ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.packs?.name ?? '—'} · {MILESTONE_LABELS[p.milestone] ?? p.milestone} · payé le {p.paid_at ? new Date(p.paid_at).toLocaleDateString('fr-FR') : '—'}</p>
                </div>
                <span className="font-bold text-emerald-700 text-sm flex-shrink-0">{fmt(p.amount_ttc)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('clients')
  const [allClients, setAllClients] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [newLeadsBadge, setNewLeadsBadge] = useState(0)
  const [newTicketsBadge, setNewTicketsBadge] = useState(0)
  const [showReportIssue, setShowReportIssue] = useState(false)
  const [issueSent, setIssueSent] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    fetchAllClients().then(data => setAllClients(data.filter(c => c.email !== 'admin@oriafen.com')))
  }, [])

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchFinanceSummary().then(s => setMonthRevenue(s.monthRevenue))
    }
  }, [user?.role])

  // Live badge on the Leads nav tab — increments whenever a new lead arrives,
  // regardless of which tab the admin currently has open. Resets when they open Leads.
  useEffect(() => {
    const unsubscribe = subscribeToLeads(({ event }) => {
      if (event === 'INSERT') {
        setNewLeadsBadge(prev => prev + 1)
      }
    })
    return unsubscribe
  }, [])

  // Live badge on Notifications — new client message or internal ticket.
  useEffect(() => {
    const unsubscribe = subscribeToSupportTickets(({ event }) => {
      if (event === 'INSERT') {
        setNewTicketsBadge(prev => prev + 1)
      }
    })
    return unsubscribe
  }, [])

  const handleTabClick = (id) => {
    setActiveTab(id)
    if (id === 'leads') setNewLeadsBadge(0)
    if (id === 'notifs') setNewTicketsBadge(0)
  }

  const isSuperAdmin = user?.role === 'super_admin'
  const navItems = isSuperAdmin ? [...NAV_ITEMS, TEAM_NAV_ITEM, FINANCE_NAV_ITEM] : NAV_ITEMS

  const renderSection = () => {
    switch (activeTab) {
      case 'clients':   return <ClientsSection isSuperAdmin={isSuperAdmin} />
      case 'leads':     return <CRMSection />
      case 'dossiers':  return <DossierSection />
      case 'formation': return <FormationTrackingSection />
      case 'notifs':    return <NotificationsSection />
      case 'equipe':    return isSuperAdmin ? <TeamSection /> : <ClientsSection />
      case 'finance':   return isSuperAdmin ? <FinanceSection /> : <ClientsSection />
      default:          return <ClientsSection />
    }
  }

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
            <div className="hidden md:flex items-center gap-4">
              {!isSuperAdmin && (
                <button onClick={() => setShowReportIssue(true)} className="flex items-center gap-2 text-amber-300 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10 border border-amber-300/30">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Signaler un problème
                </button>
              )}
              <span className="text-white font-semibold text-sm">{user?.name}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 text-green-300 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10">
                <LogoutIcon className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-green-300 hover:text-white hover:bg-white/10">
              {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-orias-green-light bg-orias-green">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <button onClick={handleLogout} className="flex items-center gap-2 w-full p-3 text-red-300 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium">
                <LogoutIcon className="w-4 h-4" />Se déconnecter
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Stats bar */}
      <div className="bg-orias-green border-t border-orias-green-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className={`grid grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3`}>
            <StatCard icon={<UsersIcon className="w-5 h-5 text-white" />} label="Total clients" value={allClients.length} color="bg-orias-green-light border-white/10" />
            <StatCard icon={<ClockIcon className="w-5 h-5 text-orias-gold" />} label="En cours" value={allClients.filter(c => c.statut !== 'ORIAS obtenu').length} color="bg-orias-gold/20 border-orias-gold/30" />
            <StatCard icon={<AwardIcon className="w-5 h-5 text-emerald-300" />} label="ORIAS obtenus" value={allClients.filter(c => c.statut === 'ORIAS obtenu').length} color="bg-emerald-600/30 border-emerald-400/30" />
            {isSuperAdmin && (
              <StatCard icon={<TrendingUpIcon className="w-5 h-5 text-orias-gold" />} label="Revenus ce mois" value={`${Math.round(monthRevenue).toLocaleString('fr-FR')} DHS`} sub={new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'})} color="bg-orias-gold/15 border-orias-gold/20" />
            )}
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-white border-b border-orias-border sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
            {navItems.map(item => (
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
                {item.id === 'leads' && newLeadsBadge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orias-gold text-orias-green text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {newLeadsBadge > 9 ? '9+' : newLeadsBadge}
                  </span>
                )}
                {item.id === 'notifs' && newTicketsBadge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orias-gold text-orias-green text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {newTicketsBadge > 9 ? '9+' : newTicketsBadge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-orias-green">
            {navItems.find(n => n.id === activeTab)?.label}
          </h2>
        </div>
        {renderSection()}
      </main>

      <footer className="border-t border-orias-border mt-12 py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <Logo size="sm" variant="light" />
          <p className="text-xs text-gray-400">© 2026 Oriafen — Administration</p>
        </div>
      </footer>

      {showReportIssue && (
        <ReportIssueModal
          onClose={() => setShowReportIssue(false)}
          onSent={() => { setShowReportIssue(false); setIssueSent(true); setTimeout(() => setIssueSent(false), 4000) }}
        />
      )}

      {issueSent && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" />
          <span className="text-sm font-semibold">Problème signalé au super admin.</span>
        </div>
      )}
    </div>
  )
}
