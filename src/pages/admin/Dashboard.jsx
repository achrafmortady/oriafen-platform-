import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import { LogoutIcon, UsersIcon, TrendingUpIcon, AwardIcon, BellIcon, MenuIcon, XIcon, EyeIcon, EditIcon, MessageIcon, SearchIcon, CheckCircleIcon, ClockIcon, BookIcon } from '../../components/Icons'
import { FORMATION_UNITS } from '../../data/mockData'
import { fetchAllClients, createClient, updateDossierStep, fetchClientDocumentsWithDetails, updateDocumentStatusWithReason, fetchPacks, markPaymentPaid, fetchFinanceSummary, fetchClientPayments } from '../../lib/api'
import { openLivret } from '../../lib/livret'
import { REQUIRED_DOCUMENTS } from '../../data/mockData'
import ProgressBar from '../../components/ProgressBar'
import { supabase as _supabase } from '../../lib/supabase'

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
  { id: 'dossiers',   label: 'Dossiers',         icon: <EyeIcon className="w-4 h-4" /> },
  { id: 'formation',  label: 'Formation',        icon: <BookIcon className="w-4 h-4" /> },
  { id: 'notifs',     label: 'Notifications',    icon: <BellIcon className="w-4 h-4" /> },
]
const FINANCE_NAV_ITEM = { id: 'finance', label: 'Finance', icon: <TrendingUpIcon className="w-4 h-4" /> }

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

function AddClientModal({ onClose, onAdd }) {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [packId,   setPackId]   = useState('')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await createClient(fullName, email, packId)
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

function ClientsSection() {
  const [clients, setClients]   = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState('all')
  const [showAdd, setShowAdd]   = useState(false)
  const [editClient, setEditClient] = useState(null)

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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdd={() => { loadClients(); setShowAdd(false) }} />}

      {editClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditClient(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-orias-gold px-6 py-5 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">Modifier — {editClient.prenom} {editClient.nom}</h3>
              <button onClick={() => setEditClient(null)} className="text-white/80 hover:text-white"><XIcon className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-orias-bg rounded-xl p-4 border border-orias-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Email</span>
                  <span className="font-semibold text-gray-700">{editClient.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Pack</span>
                  <span className="font-semibold text-orias-green">{editClient.pack}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Statut</span>
                  <span className={`font-semibold ${editClient.statut === 'ORIAS obtenu' ? 'text-emerald-600' : 'text-amber-600'}`}>{editClient.statut}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Progression</span>
                  <span className="font-semibold text-orias-green">{editClient.progression ?? 0}%</span>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=Bonjour%20${encodeURIComponent(editClient.prenom)}%2C%20`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#25d366] hover:bg-[#20bd5a] transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <button onClick={() => setEditClient(null)} className="flex-1 btn-outline-green">Fermer</button>
              </div>
            </div>
          </div>
        </div>
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

  const load = () => {
    setLoading(true)
    fetchFinanceSummary().then(data => { setSummary(data); setLoading(false) })
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
    if (!byClient[key]) byClient[key] = { client: p.users, pack: p.packs, payments: [] }
    byClient[key].payments.push(p)
  })
  const clientGroups = Object.values(byClient).map(g => ({
    ...g,
    payments: [...g.payments].sort((a, b) => (MILESTONE_ORDER[a.milestone] ?? 0) - (MILESTONE_ORDER[b.milestone] ?? 0)),
  }))

  const allPaid = summary.payments.filter(p => p.status === 'paid')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700 mb-1">CA encaissé (total)</p>
          <p className="text-2xl font-bold text-emerald-800">{fmt(summary.totalRevenuePaid)}</p>
        </div>
        <div className="card p-5 bg-orias-gold/10 border-orias-gold/30">
          <p className="text-xs font-semibold text-orias-gold mb-1">CA ce mois-ci</p>
          <p className="text-2xl font-bold text-orias-green">{fmt(summary.monthRevenue)}</p>
        </div>
        <div className="card p-5 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">En attente de paiement</p>
          <p className="text-2xl font-bold text-amber-800">{fmt(summary.totalPending)}</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-orias-green mb-4">Paiements par client ({clientGroups.length})</h3>
        {clientGroups.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun client avec un pack assigné.</p>
        ) : (
          <div className="space-y-4">
            {clientGroups.map(group => {
              // Find index of the first non-paid payment — that's the only one currently actionable
              const firstPendingIdx = group.payments.findIndex(p => p.status === 'pending')
              return (
                <div key={group.client?.email ?? Math.random()} className="rounded-xl border border-orias-border overflow-hidden">
                  <div className="bg-orias-bg px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{group.client?.full_name ?? group.client?.email ?? '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{group.pack?.name ?? '—'}</p>
                    </div>
                  </div>
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

  const isSuperAdmin = user?.role === 'super_admin'
  const navItems = isSuperAdmin ? [...NAV_ITEMS, FINANCE_NAV_ITEM] : NAV_ITEMS

  const renderSection = () => {
    switch (activeTab) {
      case 'clients':   return <ClientsSection />
      case 'dossiers':  return <DossierSection />
      case 'formation': return <FormationTrackingSection />
      case 'notifs':    return <NotificationsSection />
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
