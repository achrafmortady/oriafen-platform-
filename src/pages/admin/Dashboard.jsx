import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import { LogoutIcon, UsersIcon, TrendingUpIcon, AwardIcon, BellIcon, MenuIcon, XIcon, EyeIcon, EditIcon, MessageIcon, SearchIcon, CheckCircleIcon, ClockIcon, BookIcon } from '../../components/Icons'
import { ADMIN_CLIENTS, ADMIN_STATS, FORMATION_UNITS } from '../../data/mockData'
import { fetchAllClients, createClient, updateDossierStep, fetchClientDocumentsWithDetails, updateDocumentStatusWithReason } from '../../lib/api'
import { REQUIRED_DOCUMENTS } from '../../data/mockData'
import ProgressBar from '../../components/ProgressBar'

const NAV_ITEMS = [
  { id: 'clients',    label: 'Clients',         icon: <UsersIcon className="w-4 h-4" /> },
  { id: 'dossiers',   label: 'Dossiers',         icon: <EyeIcon className="w-4 h-4" /> },
  { id: 'formation',  label: 'Formation',        icon: <BookIcon className="w-4 h-4" /> },
  { id: 'notifs',     label: 'Notifications',    icon: <BellIcon className="w-4 h-4" /> },
]

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

function AddClientModal({ onClose, onAdd }) {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [pack,     setPack]     = useState('Essentiel')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await createClient(fullName, email, pack)
    setLoading(false)
    if (result.success) {
      setSuccess(result.tempPassword)
      onAdd()
    } else {
      setError(result.error ?? 'Erreur lors de la création du compte.')
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
              <div className="bg-orias-bg rounded-xl p-4 border border-orias-border text-left">
                <p className="text-xs text-gray-500 font-semibold mb-1">Mot de passe temporaire</p>
                <p className="font-mono font-bold text-orias-green text-lg">{success}</p>
                <p className="text-xs text-gray-400 mt-1">Transmettez ce mot de passe au client. Il pourra le changer à sa première connexion.</p>
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
                <select value={pack} onChange={e => setPack(e.target.value)} className="input-field">
                  <option>Essentiel</option>
                  <option>Starter</option>
                  <option>Premium</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-70">
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

function ClientsSection() {
  const [clients, setClients]   = useState(ADMIN_CLIENTS)
  const [loadingClients, setLoadingClients] = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState('all')
  const [showAdd, setShowAdd]   = useState(false)

  const loadClients = () => fetchAllClients().then(data => setClients(data))

  useEffect(() => {
    loadClients().finally(() => setLoadingClients(false))
  }, [])

  const filtered = clients.filter(c => {
    const matchSearch = `${c.nom} ${c.prenom} ${c.pack}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'cours' && c.statut === 'En cours') || (filter === 'obtenu' && c.statut === 'ORIAS obtenu')
    return matchSearch && matchFilter
  })

  const statusCls = (s) => s === 'ORIAS obtenu'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-amber-50 text-amber-700 border-amber-200'

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
          {[['all','Tous'],['cours','En cours'],['obtenu','ORIAS obtenu']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`px-3 py-2 text-sm font-medium transition-colors ${filter === v ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>{l}</button>
          ))}
        </div>
        <span className="text-sm text-gray-500">{filtered.length} client{filtered.length > 1 ? 's' : ''}</span>
        <button onClick={() => setShowAdd(true)} className="btn-gold flex items-center gap-2 text-sm ml-auto">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un client
        </button>
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
                <tr key={client.id} className={`border-b border-orias-border/50 hover:bg-orias-bg/50 transition-colors ${i % 2 === 0 ? '' : 'bg-orias-bg/20'}`}>
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
                      {client.statut === 'ORIAS obtenu' ? <CheckCircleIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                      <span className="hidden sm:inline">{client.statut}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden xl:table-cell text-xs text-gray-400">{client.activite}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelected(client)} className="p-1.5 rounded-lg text-gray-400 hover:text-orias-green hover:bg-orias-green/10 transition-colors" title="Voir">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-orias-gold hover:bg-orias-gold/10 transition-colors" title="Modifier">
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Message">
                        <MessageIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdd={() => { loadClients(); setShowAdd(false) }} />}

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
                <button className="btn-gold flex-1 flex items-center justify-center gap-2">
                  <MessageIcon className="w-4 h-4" />
                  Message WhatsApp
                </button>
                <button className="btn-outline-green flex items-center gap-2 px-4">
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
  const [clients,        setClients]        = useState(ADMIN_CLIENTS)
  const [selectedClient, setSelectedClient] = useState(null)
  const [docs,           setDocs]           = useState([])
  const [loadingDocs,    setLoadingDocs]    = useState(false)
  const [updatingStep,   setUpdatingStep]   = useState(false)
  const [currentStep,    setCurrentStep]    = useState(1)

  useEffect(() => {
    fetchAllClients().then(data => {
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

            <a
              href="https://wa.me/33600000000"
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


// ─────────────────────────────────────────────────────────────────────────────
// LIVRET DE STAGE — Génération HTML style SARSOUR aux couleurs Oriafen/ASSURYAL
// ─────────────────────────────────────────────────────────────────────────────

function generateLivretHTML(studentName, startDate) {
  // Calcul des dates sur 5 semaines à partir de la date de début
  const d = startDate ? new Date(startDate) : new Date()
  const fmt = (date) => date.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })
  const addDays = (date, n) => { const d2 = new Date(date); d2.setDate(d2.getDate()+n); return d2 }

  // Séances par unité (identique au livret SARSOUR)
  const seances = {
    u1: [
      { dates:[fmt(d)], duree:'3,00', total:'3,00', nature:'La présentation du secteur de l\'assurance' },
      { dates:[fmt(addDays(d,0))], duree:'4,00', total:'4,00', nature:'Les entreprises d\'assurances' },
      { dates:[fmt(addDays(d,1))], duree:'3,00', total:'3,00', nature:'L\'opération d\'assurance' },
      { dates:[fmt(addDays(d,1))], duree:'4,00', total:'4,00', nature:'Les différentes catégories d\'assurance' },
      { dates:[fmt(addDays(d,2))], duree:'2,00', total:'2,00', nature:'L\'intermédiation en assurance' },
      { dates:[fmt(addDays(d,2))], duree:'2,00', total:'2,00', nature:'La relation avec le client' },
      { dates:[fmt(addDays(d,2))], duree:'2,00', total:'2,00', nature:'La lutte contre le blanchiment' },
    ],
    u1total: '20,00',
    u2: [
      { dates:[fmt(addDays(d,3)), fmt(addDays(d,4))], duree:'7,00', total:'10,00', nature:'L\'assurance contre les risques corporels (incapacité – invalidité – décès)' },
      { dates:[fmt(addDays(d,7)), fmt(addDays(d,8))], duree:'7,00', total:'10,00', nature:'La dépendance' },
      { dates:[fmt(addDays(d,9)), fmt(addDays(d,10))], duree:'7,00', total:'10,00', nature:'L\'assurance complémentaire santé' },
    ],
    u2total: '30,00',
    u3: [
      { dates:[fmt(addDays(d,11)), fmt(addDays(d,14))], duree:'7,00', total:'14,00', nature:'La prise en compte des besoins' },
      { dates:[fmt(addDays(d,15)), fmt(addDays(d,16)), fmt(addDays(d,17))], duree:'7,00', total:'21,00', nature:'Les principales catégories de contrats' },
      { dates:[fmt(addDays(d,18)), fmt(addDays(d,21))], duree:'7,00', total:'10,00', nature:'Les spécificités' },
    ],
    u3total: '45,00',
    u4: [
      { dates:[fmt(addDays(d,22))], duree:'5,00', total:'5,00', nature:'L\'assurance de groupe' },
      { dates:[fmt(addDays(d,23))], duree:'5,00', total:'5,00', nature:'Contrats collectifs au profit des salariés' },
    ],
    u4total: '10,00',
    u5: [
      { dates:[fmt(addDays(d,24)), fmt(addDays(d,24))], duree:'7,00', total:'14,00', nature:'L\'appréciation et la sélection du risque' },
      { dates:[fmt(addDays(d,25))], duree:'7,00', total:'7,00', nature:'Les différents types de contrats' },
      { dates:[fmt(addDays(d,28)), fmt(addDays(d,29))], duree:'5,00', total:'10,00', nature:'Les assurances des risques d\'entreprises' },
      { dates:[fmt(addDays(d,30))], duree:'7,00', total:'7,00', nature:'La présentation des garanties et la tarification' },
      { dates:[fmt(addDays(d,32))], duree:'7,00', total:'7,00', nature:'La vie du contrat' },
    ],
    u5total: '45,00',
  }

  const signatureSVG = `<svg viewBox="0 0 220 130" width="140" height="75" style="display:block;margin:0 auto;">
  <g fill="none" stroke="#1a1a6e" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <path d="M95,18 C88,10 78,8 72,14 C64,22 66,36 76,40 C86,44 98,36 100,24 C102,12 94,6 84,8" stroke-width="2.2"/>
    <path d="M96,16 C100,12 106,14 104,20 C102,24 98,22 100,18 C102,14 108,16 107,22" stroke-width="1.4"/>
    <path d="M86,40 L86,110" stroke-width="2.4"/>
    <path d="M72,55 C76,48 80,48 84,55 C88,48 92,48 96,55" stroke-width="1.6"/>
    <path d="M98,62 C96,56 90,55 88,60 C86,65 90,70 96,68 C102,66 103,59 98,57" stroke-width="1.5"/>
    <path d="M104,58 L104,70 M104,61 C107,57 111,58 112,62" stroke-width="1.5"/>
    <path d="M114,52 L114,70 M111,59 L117,59" stroke-width="1.5"/>
    <path d="M122,64 C120,57 115,56 114,62 C113,68 117,71 121,69 C125,67 124,60 122,58 L122,70" stroke-width="1.5"/>
    <path d="M128,52 L128,70 M128,62 C126,56 120,56 119,62 C118,68 122,72 126,70 C130,68 130,60 128,57" stroke-width="1.5"/>
    <path d="M132,58 C134,64 136,68 134,74 C132,80 126,82 124,85" stroke-width="1.5"/>
    <path d="M138,58 L134,74" stroke-width="1.5"/>
    <path d="M76,105 C72,98 74,90 82,88 C90,86 96,92 94,100 C92,108 82,112 76,108 C70,104 72,96 80,94" stroke-width="1.8"/>
    <path d="M88,110 L108,110" stroke-width="1.6"/>
    <path d="M108,108 C112,106 114,110 110,112 C106,114 108,118 113,116" stroke-width="1.4"/>
  </g>
</svg>`

  const cachetSVG = `<svg viewBox="0 0 200 90" width="160" height="72" style="display:block;margin:2px auto;">
  <rect x="2" y="2" width="196" height="86" rx="12" ry="12" fill="rgba(26,40,160,0.03)" stroke="#1a28a0" stroke-width="2.5"/>
  <rect x="6" y="6" width="188" height="78" rx="9" ry="9" fill="none" stroke="#1a28a0" stroke-width="0.7" opacity="0.35"/>
  <text x="100" y="26" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="13" font-weight="900" fill="#1a28a0" letter-spacing="0.8">ASSURYAL CONSEIL</text>
  <line x1="20" y1="32" x2="180" y2="32" stroke="#1a28a0" stroke-width="0.8" opacity="0.4"/>
  <text x="100" y="48" text-anchor="middle" font-family="Arial,sans-serif" font-size="10.5" font-weight="600" fill="#1a28a0">5, Rue d'Armaillé 75017 - Paris</text>
  <text x="100" y="64" text-anchor="middle" font-family="Arial,sans-serif" font-size="10.5" font-weight="700" fill="#1a28a0">RCS N° : 849 409 313</text>
  <text x="100" y="79" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="500" fill="#1a28a0" opacity="0.75">ORIAS N° 22001447</text>
</svg>`

  const endDate = fmt(addDays(d, 34))
  const today = fmt(new Date())

  // ── Tableau séances helper ──────────────────────────────────
  const tableRows = (seanceList) => seanceList.map(s => `
    <tr>
      <td class="tc dates">${s.dates.join('<br/>')}</td>
      <td class="tc">${s.duree}</td>
      <td class="tc">${s.total}</td>
      <td class="tl nature">${s.nature}</td>
      <td class="tc inst">A MORTADY</td>
      <td class="tc qual">Président SAS<br/>Assuryal Conseil</td>
      <td class="tc sig">${signatureSVG}</td>
      <td class="tc obs">OK réalisé</td>
      <td class="tc inst">A MORTADY</td>
      <td class="tc qual">Président SAS<br/>Assuryal Conseil</td>
      <td class="tc sig">${signatureSVG}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Livret de Stage IAS1 — ${studentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;}

    /* ── PAGE BREAKS ── */
    .page{width:297mm;min-height:210mm;padding:14mm 14mm 12mm;page-break-after:always;position:relative;background:#fff;}
    .page:last-child{page-break-after:auto;}

    /* ── HEADER BANDE VERTE ── */
    .header-band{background:#1a3d2b;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;margin-bottom:0;}
    .logo-wrap{display:flex;align-items:center;gap:10px;}
    .logo-text-main{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;color:#f5f0e8;letter-spacing:3px;}
    .logo-text-sub{font-size:7px;font-weight:600;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;margin-top:2px;}
    .header-right{text-align:right;color:#c9a84c;font-size:9px;font-weight:600;letter-spacing:.5px;}
    .gold-bar{height:3px;background:linear-gradient(90deg,#c9a84c,#e8d48a,#c9a84c);margin-bottom:14px;}

    /* ── PAGE 1 COUVERTURE ── */
    .cover-body{text-align:center;padding:30px 40px;}
    .cover-company{font-size:15px;font-weight:700;color:#1a3d2b;margin-bottom:4px;}
    .cover-company-details{font-size:10px;color:#555;line-height:1.8;margin-bottom:6px;}
    .cover-orias{font-size:11px;font-weight:700;color:#c9a84c;margin-bottom:30px;}
    .cover-title-main{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;color:#1a3d2b;margin-bottom:6px;}
    .cover-title-sub{font-size:13px;color:#555;font-style:italic;margin-bottom:4px;}
    .cover-duration{font-size:12px;font-weight:700;color:#1a3d2b;margin-bottom:24px;}
    .cover-doc-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;color:#1a3d2b;border-top:2px solid #c9a84c;border-bottom:2px solid #c9a84c;padding:10px 0;margin:0 60px 6px;}
    .cover-ref{font-size:9px;color:#888;margin-bottom:0;}

    /* ── PAGE 2 TITULAIRE ── */
    .section-title{font-size:11px;font-weight:700;color:#1a3d2b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1a3d2b;padding-bottom:4px;margin-bottom:12px;}
    .info-grid{display:grid;grid-template-columns:120px 1fr;gap:6px 12px;margin-bottom:16px;}
    .info-label{font-weight:700;color:#1a3d2b;}
    .info-value{color:#333;}
    .company-block{background:#f5f0e8;border-left:4px solid #1a3d2b;padding:10px 14px;margin-bottom:14px;border-radius:0 6px 6px 0;}
    .company-block strong{color:#1a3d2b;}

    /* ── PAGE 3 ATTESTATION ── */
    .attest-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;color:#1a3d2b;margin-bottom:4px;}
    .attest-sub{font-style:italic;font-size:12px;color:#555;margin-bottom:20px;}
    .attest-body{font-size:11.5px;line-height:2;color:#333;margin-bottom:20px;}
    .attest-body strong{color:#1a3d2b;}
    .sig-section{display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px;gap:20px;}
    .sig-col{text-align:center;flex:1;}
    .sig-label{font-size:10px;color:#888;margin-bottom:6px;}
    .sig-name{font-size:11px;font-weight:700;color:#1a3d2b;margin-top:6px;}
    .sig-role{font-size:9.5px;color:#666;}

    /* ── TABLEAUX SÉANCES ── */
    .unit-header{background:#1a3d2b;color:#fff;padding:6px 10px;font-weight:700;font-size:10.5px;margin-top:12px;margin-bottom:0;letter-spacing:.3px;}
    table{width:100%;border-collapse:collapse;font-size:9px;}
    th{background:#e8f0ec;color:#1a3d2b;font-weight:700;padding:5px 4px;border:1px solid #b0c8b8;text-align:center;font-size:8.5px;}
    th.tl{text-align:left;}
    td{padding:4px 4px;border:1px solid #c8d8cc;vertical-align:middle;}
    td.tc{text-align:center;}
    td.tl{text-align:left;}
    td.dates{font-size:8px;color:#444;}
    td.nature{font-size:9.5px;color:#1a1a1a;font-weight:500;}
    td.inst{font-size:8px;font-weight:600;color:#1a3d2b;}
    td.qual{font-size:7.5px;color:#555;line-height:1.4;}
    td.obs{font-size:8px;font-weight:600;color:#2e7d4f;}
    td.sig{padding:2px;}
    .total-row td{background:#f5f0e8;font-weight:700;color:#1a3d2b;font-size:10px;}
    .total-formation{background:#1a3d2b;color:#c9a84c;padding:6px 10px;font-weight:700;font-size:11px;text-align:right;margin-top:8px;}

    /* ── MODALITÉS DE VALIDATION ── */
    .validation-box{background:#f9f7f2;border:1px solid #c9a84c;border-radius:6px;padding:14px 18px;margin-top:16px;font-size:10.5px;line-height:1.8;}
    .validation-box strong{color:#1a3d2b;}

    /* ── ACTIONS (non imprimées) ── */
    .actions{position:fixed;top:16px;right:16px;display:flex;gap:10px;z-index:999;}
    .btn-print{background:#1a3d2b;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}
    .btn-close{background:#fff;color:#1a3d2b;border:2px solid #1a3d2b;padding:10px 16px;border-radius:8px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}

    @media print{
      .actions{display:none!important;}
      body{background:#fff;}
      .page{width:100%;padding:10mm 12mm;}
    }
  </style>
</head>
<body>

<div class="actions">
  <button class="btn-print" onclick="window.print()">🖨 Imprimer / PDF</button>
  <button class="btn-close" onclick="window.close()">✕ Fermer</button>
</div>

<!-- ═══════════════════════════════════════ PAGE 1 — COUVERTURE ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band">
    <div class="logo-wrap">
      <svg viewBox="0 0 40 46" width="32" height="32" fill="none">
        <path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/>
        <text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text>
      </svg>
      <div>
        <div class="logo-text-main">ORIAFEN</div>
        <div class="logo-text-sub">Academy · Votre ORIAS, Notre Priorité</div>
      </div>
    </div>
    <div class="header-right">Formation IAS Niveau 1 · 150 heures</div>
  </div>
  <div class="gold-bar"></div>

  <div class="cover-body">
    <div class="cover-company">ASSURYAL CONSEIL</div>
    <div class="cover-company-details">
      SAS au capital de 100,00 €<br/>
      RCS de Paris N° 849 409 313<br/>
      5, Rue d'Armaillé — 75017 Paris
    </div>
    <div class="cover-orias">Inscrite à l'ORIAS sous le N° 22001447</div>

    <div style="margin:0 auto 24px;width:80px;height:3px;background:linear-gradient(90deg,#c9a84c,#e8d48a,#c9a84c);"></div>

    <div class="cover-title-main">FORMATION IAS DE NIVEAU 1</div>
    <div class="cover-title-sub">Durée 150 heures</div>
    <div style="height:20px;"></div>
    <div class="cover-doc-title">ATTESTATION DE FORMATION ET LIVRET DE STAGE</div>
    <div class="cover-ref">(Art. R 514-3 du code des assurances et R 512-11 du code des assurances)</div>
  </div>
</div>

<!-- ═══════════════════════════════════════ PAGE 2 — TITULAIRE + RÈGLES ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band">
    <div class="logo-wrap">
      <svg viewBox="0 0 40 46" width="28" height="28" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg>
      <div><div class="logo-text-main" style="font-size:16px;">ORIAFEN ACADEMY</div></div>
    </div>
    <div class="header-right">Livret de Stage · Niveau I</div>
  </div>
  <div class="gold-bar"></div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
    <div>
      <div class="section-title">TITULAIRE</div>
      <div class="info-grid">
        <span class="info-label">Nom :</span><span class="info-value"><strong>${studentName.split(' ').slice(1).join(' ') || studentName}</strong></span>
        <span class="info-label">Prénom(s) :</span><span class="info-value"><strong>${studentName.split(' ')[0]}</strong></span>
      </div>

      <div class="section-title" style="margin-top:20px;">ENTREPRISE DE STAGE</div>
      <div class="company-block">
        <div style="font-size:12px;font-weight:700;color:#1a3d2b;margin-bottom:6px;">ASSURYAL CONSEIL</div>
        <div style="font-size:10px;color:#444;line-height:1.8;">
          SAS au capital de 100,00 € · RCS Paris N° 849 409 313<br/>
          5, Rue d'Armaillé — 75017 Paris<br/>
          Inscrite à l'ORIAS sous le N° <strong>22001447</strong><br/>
          Qualité : <strong>Cabinet de courtage en assurance</strong><br/>
          Date de début de stage : <strong>${fmt(d)}</strong>
        </div>
      </div>
    </div>

    <div>
      <div class="section-title">EXTRAITS DU CODE DES ASSURANCES</div>
      <div style="font-size:9.5px;color:#444;line-height:1.8;">
        <p style="margin-bottom:8px;"><strong style="color:#1a3d2b;">Article R 512-9</strong><br/>
        Les intermédiaires doivent justifier d'un stage professionnel d'une durée raisonnable et suffisante sans pouvoir être inférieure à <strong>150 heures</strong>.</p>
        <p style="margin-bottom:8px;"><strong style="color:#1a3d2b;">Article R 512-11</strong><br/>
        Le stage professionnel a pour objet de permettre aux stagiaires d'acquérir des compétences en matière juridique, technique, commerciale et administrative.</p>
        <p><strong style="color:#1a3d2b;">Article R 514-3</strong><br/>
        La capacité professionnelle est justifiée par la présentation du livret de stage signé par les personnes auprès desquelles le stage a été effectué.</p>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════ PAGE 3 — ATTESTATION ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band">
    <div class="logo-wrap"><svg viewBox="0 0 40 46" width="28" height="28" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg>
    <div><div class="logo-text-main" style="font-size:16px;">ORIAFEN ACADEMY</div></div></div>
    <div class="header-right">Attestation · Art. R 512-11</div>
  </div>
  <div class="gold-bar"></div>

  <div class="attest-title">ATTESTATION</div>
  <div class="attest-sub">de contrôle des compétences acquises à l'issue du stage du niveau I<br/>(article R 512-11 du code des assurances)</div>

  <div class="attest-body">
    Le soussigné :<br/>
    &nbsp;&nbsp;- Nom : <strong>Achraf MORTADY</strong><br/>
    &nbsp;&nbsp;- Fonction : <strong>Président de la SAS</strong><br/><br/>
    Atteste que : <strong>${studentName}</strong><br/><br/>
    A subi à l'issue de ce stage de <strong>150 heures minimum</strong>, un contrôle des compétences acquises.<br/><br/>
    Ce contrôle a été effectué conformément au programme minimum de formation de niveau I homologué par arrêté du ministre de l'Économie, de l'Industrie et de l'Emploi du 11 juillet 2008 modifiant l'arrêté du 23 juin 2008 portant homologation des programmes minimaux de stage de formation des Intermédiaires en Assurance et des salariés de Niveaux 1 et 2. (Arrêté ECET 0816434A).<br/><br/>
    En application de l'article R512-9 (1°) du Code des assurances, le candidat stagiaire devra avoir suivi, durant la période de 150 heures, une formation lui permettant d'acquérir les connaissances visées dans les 5 unités suivantes.
  </div>

  <div style="font-size:11px;color:#444;margin-bottom:20px;">A PARIS le <strong>${today}</strong></div>
  <div style="font-size:11px;color:#444;margin-bottom:24px;">Signature et cachet de l'entreprise</div>

  <div class="sig-section">
    <div class="sig-col">
      ${signatureSVG}
      <div class="sig-name">Achraf MORTADY</div>
      <div class="sig-role">Président — ASSURYAL CONSEIL</div>
    </div>
    <div class="sig-col">
      ${cachetSVG}
    </div>
    <div class="sig-col">
      <div style="height:75px;"></div>
      <div class="sig-name">Direction Pédagogique</div>
      <div class="sig-role">Oriafen Academy</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════ PAGE 4 — UNITÉ 1 ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ORIAFEN ACADEMY</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
  <div class="gold-bar"></div>

  <div class="unit-header">UNITÉ 1 : LES SAVOIRS GÉNÉRAUX</div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">Dates</th><th rowspan="2">Durée séance (h)</th><th rowspan="2">Durée totale (h)</th>
        <th rowspan="2" class="tl">Nature de l'enseignement</th>
        <th colspan="3">Instructeur</th><th rowspan="2">Observation</th>
        <th colspan="3">Chef d'établissement</th>
      </tr>
      <tr><th>Prénom Nom</th><th>Qualité</th><th>Signature</th><th>Prénom Nom</th><th>Qualité</th><th>Signature</th></tr>
    </thead>
    <tbody>
      ${tableRows(seances.u1)}
      <tr class="total-row"><td colspan="2" class="tc">TOTAL UNITÉ 1</td><td class="tc">${seances.u1total}</td><td colspan="8"></td></tr>
    </tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════ PAGE 5 — UNITÉ 2 ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ORIAFEN ACADEMY</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
  <div class="gold-bar"></div>

  <div class="unit-header">UNITÉ 2 : LES ASSURANCES DE PERSONNES : ASSURANCE - INVALIDITÉ - DÉCÈS - DÉPENDANCE - SANTÉ</div>
  <table>
    <thead>
      <tr><th rowspan="2">Dates</th><th rowspan="2">Durée séance (h)</th><th rowspan="2">Durée totale (h)</th><th rowspan="2" class="tl">Nature de l'enseignement</th><th colspan="3">Instructeur</th><th rowspan="2">Observation</th><th colspan="3">Chef d'établissement</th></tr>
      <tr><th>Prénom Nom</th><th>Qualité</th><th>Signature</th><th>Prénom Nom</th><th>Qualité</th><th>Signature</th></tr>
    </thead>
    <tbody>
      ${tableRows(seances.u2)}
      <tr class="total-row"><td colspan="2" class="tc">TOTAL UNITÉ 2</td><td class="tc">${seances.u2total}</td><td colspan="8"></td></tr>
    </tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════ PAGE 6 — UNITÉ 3 ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ORIAFEN ACADEMY</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
  <div class="gold-bar"></div>

  <div class="unit-header">UNITÉ 3 : LES ASSURANCES DE PERSONNES : ASSURANCE-VIE ET CAPITALISATION</div>
  <table>
    <thead>
      <tr><th rowspan="2">Dates</th><th rowspan="2">Durée séance (h)</th><th rowspan="2">Durée totale (h)</th><th rowspan="2" class="tl">Nature de l'enseignement</th><th colspan="3">Instructeur</th><th rowspan="2">Observation</th><th colspan="3">Chef d'établissement</th></tr>
      <tr><th>Prénom Nom</th><th>Qualité</th><th>Signature</th><th>Prénom Nom</th><th>Qualité</th><th>Signature</th></tr>
    </thead>
    <tbody>
      ${tableRows(seances.u3)}
      <tr class="total-row"><td colspan="2" class="tc">TOTAL UNITÉ 3</td><td class="tc">${seances.u3total}</td><td colspan="8"></td></tr>
    </tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════ PAGE 7 — UNITÉ 4 ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ORIAFEN ACADEMY</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
  <div class="gold-bar"></div>

  <div class="unit-header">UNITÉ 4 : LES ASSURANCES DE PERSONNES : LES CONTRATS COLLECTIFS</div>
  <table>
    <thead>
      <tr><th rowspan="2">Dates</th><th rowspan="2">Durée séance (h)</th><th rowspan="2">Durée totale (h)</th><th rowspan="2" class="tl">Nature de l'enseignement</th><th colspan="3">Instructeur</th><th rowspan="2">Observation</th><th colspan="3">Chef d'établissement</th></tr>
      <tr><th>Prénom Nom</th><th>Qualité</th><th>Signature</th><th>Prénom Nom</th><th>Qualité</th><th>Signature</th></tr>
    </thead>
    <tbody>
      ${tableRows(seances.u4)}
      <tr class="total-row"><td colspan="2" class="tc">TOTAL UNITÉ 4</td><td class="tc">${seances.u4total}</td><td colspan="8"></td></tr>
    </tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════ PAGE 8 — UNITÉ 5 + TOTAL ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ORIAFEN ACADEMY</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
  <div class="gold-bar"></div>

  <div class="unit-header">UNITÉ 5 : LES ASSURANCES DE BIENS ET DE RESPONSABILITÉ</div>
  <table>
    <thead>
      <tr><th rowspan="2">Dates</th><th rowspan="2">Durée séance (h)</th><th rowspan="2">Durée totale (h)</th><th rowspan="2" class="tl">Nature de l'enseignement</th><th colspan="3">Instructeur</th><th rowspan="2">Observation</th><th colspan="3">Chef d'établissement</th></tr>
      <tr><th>Prénom Nom</th><th>Qualité</th><th>Signature</th><th>Prénom Nom</th><th>Qualité</th><th>Signature</th></tr>
    </thead>
    <tbody>
      ${tableRows(seances.u5)}
      <tr class="total-row"><td colspan="2" class="tc">TOTAL UNITÉ 5</td><td class="tc">${seances.u5total}</td><td colspan="8"></td></tr>
    </tbody>
  </table>

  <div class="total-formation">TOTAL FORMATION : 150,00 heures</div>

  <div class="validation-box">
    <strong>MODALITÉS DE VALIDATION DES CONNAISSANCES :</strong><br/>
    L'examen final se présente sous la forme d'un QCM composé de cent questions réparties sur l'ensemble du programme.
    Chaque question propose quatre réponses possibles. Il n'y a qu'une seule réponse exacte.
    Le contrôle final des connaissances est réputé être validé lorsque le nombre total de bonnes réponses est au minimum strictement égal à <strong>cinquante</strong>.
  </div>
</div>

</body>
</html>`
}

function openLivret(studentName, enrolledAt) {
  const html = generateLivretHTML(studentName, enrolledAt)
  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

function FormationTrackingSection() {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="font-bold text-orias-green text-lg mb-5">Suivi des formations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orias-border bg-orias-bg">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Étudiant</th>
                {FORMATION_UNITS.map(u => (
                  <th key={u.id} className="text-center px-3 py-3.5 font-semibold text-gray-600 hidden md:table-cell">U{u.id}</th>
                ))}
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600">Total</th>
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Examen</th>
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Certificat</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_CLIENTS.slice(0, 8).map((c, i) => {
                const hours = Math.floor(Math.random() * 100 + 50)
                const examScore = c.statut === 'ORIAS obtenu' ? Math.floor(Math.random() * 30 + 65) : null
                return (
                  <tr key={c.id} className="border-b border-orias-border/50 hover:bg-orias-bg/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orias-green/10 flex items-center justify-center text-xs font-bold text-orias-green flex-shrink-0">
                          {c.prenom[0]}{c.nom[0]}
                        </div>
                        <span className="font-medium text-gray-700">{c.prenom} {c.nom}</span>
                      </div>
                    </td>
                    {FORMATION_UNITS.map(u => (
                      <td key={u.id} className="px-3 py-3.5 text-center hidden md:table-cell">
                        {c.statut === 'ORIAS obtenu' ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : Math.random() > 0.5 ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <ClockIcon className="w-4 h-4 text-amber-400 mx-auto" />
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-orias-green text-sm">{hours}h</span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                      {examScore ? (
                        <span className="font-bold text-emerald-600 text-sm">{examScore}%</span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center hidden xl:table-cell">
                      {c.statut === 'ORIAS obtenu' ? (
                        <button
                          onClick={() => openLivret(`${c.prenom} ${c.nom}`, c.enrolledAt)}
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
      </div>
    </div>
  )
}

function NotificationsSection() {
  const [tab, setTab] = useState('individual')
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [history] = useState([
    { id: 1, to: 'Sophie Martin', msg: 'Votre dossier a été validé.', date: 'il y a 1h', type: 'individual' },
    { id: 2, to: 'Tous les clients', msg: 'Nouvelle mise à jour de la plateforme disponible.', date: 'il y a 2j', type: 'broadcast' },
    { id: 3, to: 'Karim Benali', msg: 'Félicitations, votre ORIAS a été obtenu !', date: 'il y a 3j', type: 'individual' },
  ])

  const handleSend = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => { setSent(false); setMessage(''); setRecipient('') }, 3000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {ADMIN_CLIENTS.map(c => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                  ))}
                </select>
              </div>
            )}
            {tab === 'broadcast' && (
              <div className="bg-orias-gold/10 rounded-xl p-3 border border-orias-gold/30 text-sm text-orias-gold font-medium">
                Ce message sera envoyé à tous les {ADMIN_CLIENTS.length} clients actifs.
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
        <h3 className="font-bold text-orias-green mb-4">Historique des messages</h3>
        <div className="space-y-3">
          {history.map(h => (
            <div key={h.id} className="p-4 rounded-xl bg-orias-bg border border-orias-border">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-gray-800 text-sm">{h.to}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.type === 'broadcast' ? 'bg-orias-gold/20 text-orias-gold' : 'bg-orias-green/10 text-orias-green'}`}>
                    {h.type === 'broadcast' ? 'Broadcast' : 'Individuel'}
                  </span>
                  <span className="text-xs text-gray-400">{h.date}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{h.msg}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('clients')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<UsersIcon className="w-5 h-5 text-white" />} label="Total clients" value={ADMIN_STATS.totalClients} color="bg-orias-green-light border-white/10" />
            <StatCard icon={<ClockIcon className="w-5 h-5 text-orias-gold" />} label="En cours" value={ADMIN_STATS.enCours} color="bg-orias-gold/20 border-orias-gold/30" />
            <StatCard icon={<AwardIcon className="w-5 h-5 text-emerald-300" />} label="ORIAS obtenus" value={ADMIN_STATS.oriasObtenus} color="bg-emerald-600/30 border-emerald-400/30" />
            <StatCard icon={<TrendingUpIcon className="w-5 h-5 text-orias-gold" />} label="Revenus ce mois" value={`${ADMIN_STATS.revenusMois} DHS`} sub="mai 2026" color="bg-orias-gold/15 border-orias-gold/20" />
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-white border-b border-orias-border sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-orias-green">
            {NAV_ITEMS.find(n => n.id === activeTab)?.label}
          </h2>
        </div>
        {renderSection()}
      </main>

      <footer className="border-t border-orias-border mt-12 py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <Logo size="sm" variant="light" />
          <p className="text-xs text-gray-400">© 2026 Oriafen Academy — Administration</p>
        </div>
      </footer>
    </div>
  )
}
