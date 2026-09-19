import React, { useState, useEffect } from 'react'
import { seed, normalizeLeadsStage, normalizeCanonicalDemoClient, CANONICAL_DEMO_CLIENT_ID, CANONICAL_DEMO_CLIENT_NAME } from './model'
import { buildClientsOverview } from './clientsOverviewData'
import {
  getAllClientInitiatedItems, respondToClientRequest, addClientNotification,
  getAdminSendStatus, subscribeToClientTracking,
} from './clientTrackingStore'
import { BellIcon, CheckCircleIcon, XIcon } from '../components/Icons'

// Restauration V1 -> V2 (audit 2026-09-19) : src/pages/admin/Dashboard.jsx
// > NotificationsSection (223 lignes, live non modifié) — onglet admin
// "Notifications" dédié : (1) envoyer un message à un client ou à tous les
// clients, (2) un inbox unique agrégeant les demandes reçues de TOUS les
// clients (au lieu de devoir ouvrir chaque fiche client séparément comme
// c'est le cas dans le reste de V2). Réutilise clientTrackingStore.js
// (addClientNotification / respondToClientRequest / getAllClientInitiatedItems)
// — jamais un second système de messagerie.
//
// Différence assumée avec le live : pas de catégories de ticket dédiées
// (TICKET_CATEGORY_LABELS) ni de broadcast réellement massif au-delà des
// clients de démo existants — cette maquette locale n'a qu'un seul client
// converti par défaut (Client Démo).

const STORAGE_KEY = 'oriafen-isolated-crm-v1'

// Même correctif que LocalClientsOverview.jsx/LocalDossierSection.jsx
// (audit final 2026-09-19) : réécrit la version migrée dans localStorage,
// jamais seulement en mémoire — aucune dépendance à l'ordre de montage des
// autres onglets.
function normalizeAndPersist(raw) {
  const normalized = normalizeCanonicalDemoClient(normalizeLeadsStage(raw))
  if (JSON.stringify(normalized) !== JSON.stringify(raw)) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

function useLocalLeads() {
  const [leads, setLeads] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (!raw) return seed()
      return normalizeAndPersist(raw)
    } catch { return seed() }
  })
  useEffect(() => {
    const refresh = () => {
      try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
        if (raw) setLeads(normalizeAndPersist(raw))
      } catch { /* ignore */ }
    }
    window.addEventListener('storage', refresh)
    const timer = setInterval(refresh, 4000)
    return () => { window.removeEventListener('storage', refresh); clearInterval(timer) }
  }, [])
  return leads
}

const FILTERS = [['all', 'Tous'], ['nouveau', 'Non traités'], ['replied', 'Répondus']]

export default function LocalNotificationsSection() {
  const leads = useLocalLeads()
  const { rows: clients } = buildClientsOverview(leads)

  const [tab, setTab] = useState('individual')
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const [items, setItems] = useState(() => getAllClientInitiatedItems())
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [drafts, setDrafts] = useState({})

  useEffect(() => subscribeToClientTracking(() => setItems(getAllClientInitiatedItems())), [])

  const nameFor = (clientId) => {
    if (String(clientId) === String(CANONICAL_DEMO_CLIENT_ID)) return CANONICAL_DEMO_CLIENT_NAME
    return clients.find(c => String(c.id) === String(clientId))?.name || `Client #${clientId}`
  }

  const handleSend = (e) => {
    e.preventDefault()
    const clean = message.trim()
    if (!clean) return
    const targets = tab === 'individual' ? (recipient ? [recipient] : []) : clients.map(c => c.id)
    targets.forEach(clientId => addClientNotification(clientId, { kind: 'Message', title: 'Message de l\'équipe Oriafen', message: clean }))
    setSent(true)
    setTimeout(() => { setSent(false); setMessage(''); setRecipient('') }, 2500)
  }

  const handleReply = (itemId) => {
    const draft = (drafts[itemId] || '').trim()
    if (!draft) return
    if (respondToClientRequest(itemId, draft)) setDrafts(prev => ({ ...prev, [itemId]: '' }))
  }

  const filteredItems = items.filter(item => {
    const status = getAdminSendStatus(item)
    if (filter === 'nouveau') return status.key !== 'replied'
    if (filter === 'replied') return status.key === 'replied'
    return true
  })
  const newCount = items.filter(item => getAdminSendStatus(item).key !== 'replied').length

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
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {tab === 'broadcast' && (
              <div className="bg-orias-gold/10 rounded-xl p-3 border border-orias-gold/30 text-sm text-orias-gold font-medium">
                Ce message sera envoyé à tous les {clients.length} client{clients.length > 1 ? 's' : ''} actif{clients.length > 1 ? 's' : ''}.
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} className="input-field resize-none" rows={4} placeholder="Rédiger votre message..." required />
            </div>
            <button type="submit" disabled={tab === 'individual' && !recipient} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-60">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              Envoyer le message
            </button>
          </form>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-orias-green flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-orias-gold" />
            Messages reçus
            {newCount > 0 && <span className="text-xs font-bold bg-orias-gold text-orias-green rounded-full px-2 py-0.5">{newCount} nouveau{newCount > 1 ? 'x' : ''}</span>}
          </h3>
          <div className="flex rounded-lg border border-orias-border overflow-hidden text-xs">
            {FILTERS.map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} className={`px-2.5 py-1.5 font-semibold transition-colors ${filter === v ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>{l}</button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">Aucun message.</div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredItems.map(item => {
              const status = getAdminSendStatus(item)
              const awaitingReply = status.key !== 'replied' && item.responseRequired
              const expanded = expandedId === item.id
              return (
                <div key={item.id} className="p-4 rounded-xl bg-orias-bg border border-orias-border">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-400">{nameFor(item.clientId)} · {item.sentAt}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.key === 'replied' ? 'bg-emerald-100 text-emerald-700' : 'bg-orias-green/10 text-orias-green'}`}>{status.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 cursor-pointer" onClick={() => setExpandedId(expanded ? null : item.id)}>
                    {expanded || (item.message || '').length <= 100 ? item.message : `${item.message.slice(0, 100)}...`}
                  </p>
                  {item.response && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-2 text-xs text-emerald-700">
                      <span className="font-semibold">Réponse :</span> {item.response.message}
                    </div>
                  )}
                  {expanded && awaitingReply && (
                    <div className="flex gap-2 mt-2">
                      <input value={drafts[item.id] || ''} onChange={e => setDrafts(prev => ({ ...prev, [item.id]: e.target.value }))} placeholder="Répondre..." className="input-field text-xs py-1.5 flex-1" />
                      <button onClick={() => handleReply(item.id)} className="btn-green text-xs px-3 py-1.5">Répondre</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
