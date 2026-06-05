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

  const signatureSVG = `<img src="data:image/png;base64,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" style="width:100px;height:45px;display:block;margin:0 auto;object-fit:contain;" alt="signature"/>`
  const sigBigHTML = `<img src="data:image/png;base64,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" style="width:160px;height:72px;display:block;margin:0 auto;object-fit:contain;" alt="signature"/>`

  const cachetSVG = `<img src="data:image/jpeg;base64,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" style="width:200px;height:90px;display:block;margin:0 auto;object-fit:contain;" alt="cachet"/>`

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
        <div class="logo-text-sub">Cabinet de courtage en assurance · ORIAS N° 22001447</div>
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
      <div><div class="logo-text-main" style="font-size:16px;">ASSURYAL CONSEIL</div></div>
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
    <div><div class="logo-text-main" style="font-size:16px;">ASSURYAL CONSEIL</div></div></div>
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
      <div class="sig-role">ASSURYAL CONSEIL</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════ PAGE 4 — UNITÉ 1 ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ASSURYAL CONSEIL</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
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
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ASSURYAL CONSEIL</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
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
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ASSURYAL CONSEIL</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
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
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ASSURYAL CONSEIL</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
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
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ASSURYAL CONSEIL</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
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
                  const prog = c.progression ?? 0
                  const examPassed = c.examPassed ?? false
                  const examScore = c.examScore ?? null
                  const unitsCompleted = Math.floor(prog / 20)
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
        )}
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
          <p className="text-xs text-gray-400">© 2026 ASSURYAL CONSEIL — Administration</p>
        </div>
      </footer>
    </div>
  )
}
