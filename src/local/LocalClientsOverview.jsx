import React, { useState, useEffect } from 'react'
import { seed, stages, normalizeLeadsStage } from './model'
import { buildClientsOverview } from './clientsOverviewData'
import { buildLeadTimeline, findConversionEntry, findFirstEntry, applyStatusChange, addManualComment, STAGE_BADGE_STYLES } from './clientHistory'
import { toDisplayDateSafe } from './dateUtils'
import { findPackById } from './packsData'
import ProgressBar from '../components/ProgressBar'
import { UsersIcon, XCircleIcon, ClockIcon, AwardIcon, SearchIcon, EyeIcon, XIcon, MessageIcon } from '../components/Icons'
import { getClientSends, subscribeToClientTracking, getAdminSendStatus, respondToClientRequest } from './clientTrackingStore'
import { subscribeToActivityLog } from './activityLog'
import { REQUIRED_DOCUMENTS } from '../data/mockData'
import { getClientDocuments, subscribeToDocuments, rejectDocument, validateDocument } from './documentsStore'
import { listAssociateDocCategories } from './associateDocuments'

// ============================================================
// SOURCE DE VÉRITÉ VISUELLE UNIQUE : src/pages/admin/Dashboard.jsx,
// fonction `ClientsSection` (onglet "Clients" du live, lue en lecture
// seule, non modifiée). Ce fichier reproduit EXACTEMENT :
//   - la barre de filtres (recherche + compteur) — mêmes classes Tailwind
//   - le tableau (mêmes colonnes, mêmes classes de cellule/ligne)
//   - le modal "Voir" (mêmes classes, même en-tête vert, mêmes cards
//     Pack/Statut/Progression/Dernière activité/Marketing, même bouton
//     WhatsApp)
// `<ClientSendHistoryPanel>` (composant live, Supabase) est remplacé par
// `LocalClientSendHistoryPanel` ci-dessous : MÊME JSX/classes, mais
// alimenté par clientTrackingStore.js (store local) au lieu de
// src/lib/api.js — aucune fonction live n'est importée ni activée.
//
// Les AJOUTS locaux (Statut CRM, Message initial, Pack & tarification,
// Historique 360°, commentaire manuel, Suivi du parcours étendu, Documents
// rejet/remplacement, Prochaine action, KPI cliquables, filtres avancés)
// sont ajoutés APRÈS cette reproduction, dans un bloc clairement délimité,
// jamais à la place d'un élément live.
//
// Différences assumées et documentées (aucun équivalent local sensé) :
//   - Colonne "Marketing" conservée dans le tableau (même classe/structure)
//     mais affiche toujours "—" : aucune donnée de brief marketing n'existe
//     dans le modèle local — TODO staging si cette donnée doit être modélisée.
//   - Actions de ligne "Modifier" / WhatsApp / "Annuler le dossier" /
//     "Supprimer définitivement" (live) ne sont PAS reproduites : elles
//     appellent des fonctions Supabase live (update/delete) sans équivalent
//     local pertinent. Seule "Voir" (ouverture de la fiche) est conservée,
//     car c'est la seule action structurante pour cette tâche.
// ============================================================

const STORAGE_KEY = 'oriafen-isolated-crm-v1'

function useLocalLeads() {
  const [leads, setLeads] = useState(() => {
    try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); return raw ? normalizeLeadsStage(raw) : seed() } catch { return seed() }
  })
  useEffect(() => {
    const refresh = () => { try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); setLeads(raw ? normalizeLeadsStage(raw) : seed()) } catch { /* ignore */ } }
    window.addEventListener('storage', refresh)
    const timer = setInterval(refresh, 4000)
    return () => { window.removeEventListener('storage', refresh); clearInterval(timer) }
  }, [])
  const persist = (next) => {
    setLeads(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }
  return [leads, persist]
}

function KpiCard({ icon, label, value, color }) {
  return (
    <div className={`rounded-2xl p-5 border ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm font-medium text-white/80 mt-1">{label}</p>
    </div>
  )
}

// Statuts dossier locaux (calcul déterministe existant, utilisé par les KPI
// cliquables et "Prochaine action" — conservé tel quel, voir consigne
// "ne pas casser KPI/Prochaine action"). "Complété" est affiché "ORIAS
// obtenu" dans le tableau/modal pour matcher le vocabulaire live exact ;
// "Bloqué"/"À relancer" n'ont pas d'équivalent dans le vocabulaire live à
// 3 valeurs (En cours/ORIAS obtenu/Annulé) — variante locale assumée.
const STATUS_DISPLAY_LABEL = { 'Complété': 'ORIAS obtenu', 'En cours': 'En cours', 'À relancer': 'À relancer', 'Bloqué': 'Bloqué' }
const STATUS_STYLES = {
  'Complété': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En cours': 'bg-amber-50 text-amber-700 border-amber-200',
  'À relancer': 'bg-orange-50 text-orange-700 border-orange-200',
  'Bloqué': 'bg-red-50 text-red-700 border-red-200',
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-800">{value || 'Non renseigné'}</p>
    </div>
  )
}

// ── Reproduit exactement ClientSendHistoryPanel (src/components/ClientSendHistoryPanel.jsx,
// composant live, Supabase) — même JSX/classes — mais alimenté par
// clientTrackingStore.js (store local) au lieu de fetchClientSendHistory().
//
// Correctif (feedback "support/messages/notifications flow is unclear") :
// ce panneau était en LECTURE SEULE — une demande de support initiée par le
// client (senderType:'client', ex: "＋ Nouvelle demande" côté espace client)
// n'avait aucun moyen d'être traitée depuis l'onglet "Clients" (l'endroit
// naturel où l'admin gère un client déjà converti) ; il fallait passer par
// l'onglet CRM > fiche prospect. Ajoute la même zone de réponse que
// ClientSendTracking (LocalCRM.jsx), réutilisant respondToClientRequest —
// même thread (sendId précis), jamais de nouveau système.
function LocalClientSendHistoryPanel({ clientId }) {
  const [items, setItems] = useState(() => getClientSends(clientId))
  const [replyDrafts, setReplyDrafts] = useState({})
  useEffect(() => subscribeToClientTracking(() => setItems(getClientSends(clientId))), [clientId])

  const sendReply = (itemId) => {
    const msg = (replyDrafts[itemId] || '').trim()
    if (!msg) return
    if (respondToClientRequest(itemId, msg)) setReplyDrafts(prev => ({ ...prev, [itemId]: '' }))
  }

  const waiting = items.filter(item => item.responseRequired && !item.response).length
  const answered = items.filter(item => !!item.response).length

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="font-bold text-orias-green">Historique des envois et réponses</h4>
          <p className="text-xs text-gray-500 mt-1">Messages, documents et fichiers envoyés au client.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{waiting} en attente</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{answered} répondu</span>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Aucun envoi suivi pour ce client.</p>
      ) : (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {items.map(item => {
            const hasReply = !!item.response
            const statusLabel = !item.responseRequired ? 'Pas de réponse requise' : hasReply ? 'Répondu' : 'En attente de réponse'
            const statusCls = !item.responseRequired
              ? 'bg-gray-50 text-gray-600 border-gray-200'
              : hasReply
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            const adminStatus = getAdminSendStatus(item)
            const fromClient = item.senderType === 'client'
            const awaitingAdminReply = fromClient && item.responseRequired && !item.response
            const responseAuthor = item.response?.author === 'Équipe' ? "Réponse envoyée par l'équipe" : 'Réponse du client'

            return (
              <div key={item.id} className="rounded-xl border border-orias-border overflow-hidden">
                <div className="p-4 bg-orias-bg/50">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${fromClient ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orias-green/10 text-orias-green border-orias-green/20'}`}>{fromClient ? 'Client' : 'Équipe Oriafen'}</span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-orias-gold">{item.kind}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCls}`}>{statusLabel}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white text-gray-500 border-orias-border">{adminStatus.label}</span>
                      </div>
                      {item.title && <p className="font-semibold text-gray-800 mt-1">{item.title}</p>}
                    </div>
                    <span className="text-xs text-gray-400">{item.sentAt}</span>
                  </div>
                  {item.message && <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{item.message}</p>}
                  {item.fileName && (
                    <span className="inline-flex mt-2 text-sm font-medium text-orias-green">▣ {item.fileName}</span>
                  )}
                </div>

                {item.response && (
                  <div className="p-4 space-y-2 bg-white border-t border-orias-border">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{responseAuthor}</p>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                      <p className="text-sm text-emerald-900 whitespace-pre-wrap">{item.response.message}</p>
                      <p className="text-xs text-emerald-600 mt-1">{item.response.respondedAt}</p>
                    </div>
                  </div>
                )}

                {awaitingAdminReply && (
                  <div className="p-4 space-y-2 bg-white border-t border-orias-border">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Répondre à cette demande</p>
                    <textarea
                      value={replyDrafts[item.id] || ''}
                      onChange={e => setReplyDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                      rows={2}
                      className="input-field text-sm resize-none"
                      placeholder="Écrire une réponse au client…"
                    />
                    <button
                      onClick={() => sendReply(item.id)}
                      disabled={!(replyDrafts[item.id] || '').trim()}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-orias-green hover:bg-orias-green-light disabled:opacity-50"
                    >
                      Répondre
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Parcours CRM (avant conversion) puis dossier ORIAS (après conversion) —
// ajout local (voir §5/D de la consigne), n'existe pas tel quel côté live.
const DOSSIER_JOURNEY_STEPS = ['Consultation initiale', 'Montage dossier', 'Structure juridique', 'Soumission ORIAS', 'Obtention ORIAS', 'Lancement activité']

function JourneySection({ client }) {
  const stageChanges = (client.leadActivity || [])
    .filter(e => e.text?.startsWith('Étape : ') || e.text?.startsWith('Statut changé : '))
    .map(e => ({ to: e.text, at: e.at }))
    .reverse()

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Parcours CRM (avant conversion)</p>
        {stageChanges.length ? (
          <div className="space-y-1.5">
            {stageChanges.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-orias-gold flex-shrink-0" />
                <span className="font-semibold text-orias-green">{c.to}</span>
                <span className="text-gray-400 ml-auto whitespace-nowrap">{c.at}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Aucun changement d'étape journalisé pour ce prospect.</p>
        )}
      </div>
      <div className="pt-3 border-t border-orias-border">
        <p className="text-xs font-semibold text-gray-500 mb-2">Parcours dossier ORIAS (après conversion)</p>
        <div className="space-y-1.5">
          {DOSSIER_JOURNEY_STEPS.map((step, i) => {
            const done = i < client.stepIndex
            const active = i === client.stepIndex
            return (
              <div key={step} className={`flex items-center gap-2 text-xs ${done ? 'text-emerald-600' : active ? 'text-amber-600 font-semibold' : 'text-gray-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${done ? 'bg-emerald-500' : active ? 'bg-amber-500' : 'bg-gray-200'}`} />
                {step}
                {active && <span className="ml-auto text-[10px] uppercase tracking-wide">En cours</span>}
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          TODO (staging) : la date/heure/acteur de chaque changement d'étape dossier n'est pas journalisée
          individuellement en local (seule l'étape courante `current_step` existe côté live, table `dossiers`).
        </p>
      </div>
    </div>
  )
}

// Historique 360° + commentaire manuel — ajout local (§6 de la consigne).
function HistoryTimeline({ client }) {
  const [, force] = useState(0)
  const [comment, setComment] = useState('')
  useEffect(() => subscribeToActivityLog(() => force(n => n + 1)), [client.id])

  const events = buildLeadTimeline({ activity: client.leadActivity }, client.id)

  const submitComment = () => {
    if (addManualComment(client.id, comment)) setComment('')
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submitComment() }}
          placeholder="Ajouter un commentaire à l'historique…"
          className="input-field text-sm flex-1"
        />
        <button type="button" onClick={submitComment} disabled={!comment.trim()} className="btn-gold text-sm px-4 disabled:opacity-50">
          Ajouter
        </button>
      </div>
      {!events.length ? (
        <p className="text-sm text-gray-400">Aucun événement enregistré pour le moment.</p>
      ) : (
        // Hauteur de scroll fixée en dur (indépendante de tout calcul flex
        // parent/enfant) : garantit le scroll interne même si la chaîne
        // flex-1/min-h-0 des niveaux englobants n'est pas respectée pour une
        // raison ou une autre (voir carte englobante : h-[420px] + padding
        // p-5 (40px) + titre (~28px) + formulaire (~56px) -> ~280px restants,
        // marge de sécurité incluse). Le contenu ne dépend d'aucune donnée
        // changée : mêmes commentaires/dates/tri qu'avant.
        <div className="overflow-y-auto pr-1 space-y-0" style={{ maxHeight: '270px' }}>
          {events.map(ev => (
            <div key={ev.key} className="flex gap-3 py-2 border-b border-orias-border/60 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: ev.author === 'Équipe' ? '#c49a2a' : ev.author === 'Client' ? '#1a3d2b' : '#9ca3af' }} />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">{ev.display || 'Non renseigné'}</p>
                <p className="text-sm text-gray-700">
                  <span className={`font-semibold ${ev.author === 'Équipe' ? 'text-orias-gold' : ev.author === 'Client' ? 'text-orias-green' : 'text-gray-500'}`}>{ev.author}</span>
                  {' · '}{ev.action}
                  {ev.detail ? ` — ${ev.detail}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const DOC_STATUS_STYLES = {
  valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  missing: 'bg-red-50 text-red-700 border-red-200',
  correction: 'bg-orange-50 text-orange-700 border-orange-200',
  none: 'bg-gray-100 text-gray-500 border-gray-200',
}
const DOC_STATUS_LABELS = { valid: 'Validé', pending: 'En attente', missing: 'Refusé', correction: 'Correction demandée', none: 'Non soumis' }

// Documents — rejet avec motif / validation / historique de versions (ajout
// local, §5/§8 — sans équivalent direct dans le modal ClientsSection live).
// `categories` : liste de catégories à afficher (REQUIRED_DOCUMENTS pour le
// client principal, listAssociateDocCategories(docs) pour l'associé — voir
// AssociateClientDocumentsPanel ci-dessous) — même composant, même workflow
// (valider/rejeter/motif/historique), jamais un système parallèle.
function ClientDocumentsPanel({ clientId, categories = REQUIRED_DOCUMENTS, emptyLabel = null }) {
  const [docs, setDocs] = useState(() => getClientDocuments(clientId))
  const [rejectingId, setRejectingId] = useState(null)
  const [reason, setReason] = useState('')

  useEffect(() => subscribeToDocuments(() => setDocs(getClientDocuments(clientId))), [clientId])

  const confirmReject = (categoryId) => {
    rejectDocument(clientId, categoryId, reason)
    setRejectingId(null)
    setReason('')
  }

  if (!categories.length && emptyLabel) {
    return <p className="text-xs text-gray-400 italic">{emptyLabel}</p>
  }

  return (
    <div className="space-y-2">
      {categories.map(req => {
        const doc = docs[req.id]
        const status = doc?.status || 'none'
        const canReview = doc?.fileName && status !== 'valid'
        return (
          <div key={req.id} className="rounded-lg border border-orias-border p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">{req.label}</p>
                {doc?.fileName && <p className="text-xs text-orias-green mt-0.5">▣ {doc.fileName}</p>}
              </div>
              <span className={`status-badge border text-xs flex-shrink-0 ${DOC_STATUS_STYLES[status]}`}>{DOC_STATUS_LABELS[status]}</span>
            </div>
            {status === 'missing' && doc.rejectionReason && (
              <p className="text-xs text-red-600 mt-2">Motif : {doc.rejectionReason}{doc.rejectedAt ? ` · refusé le ${doc.rejectedAt}` : ''}</p>
            )}
            {canReview && (
              rejectingId === req.id ? (
                <div className="mt-2 space-y-2">
                  <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Motif du rejet (visible par le client)…" className="input-field text-xs resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => { setRejectingId(null); setReason('') }} className="btn-outline-green text-xs px-3 py-1.5">Annuler</button>
                    <button onClick={() => confirmReject(req.id)} className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700">Rejeter avec ce motif</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => validateDocument(clientId, req.id)} className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-orias-green hover:bg-orias-green-light">Valider</button>
                  <button onClick={() => { setRejectingId(req.id); setReason('') }} className="text-xs px-3 py-1.5 rounded-lg font-semibold text-red-600 border border-red-200 hover:bg-red-50">Rejeter</button>
                </div>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

// Documents de l'associé, vus par l'admin — mêmes catégories que côté
// client (associateDocuments.js, y compris les "Autre document associé"
// dynamiques déjà envoyés), même workflow (ClientDocumentsPanel), jamais
// mélangées aux documents du client principal (catégories associate_* dédiées).
function AssociateDocumentsPanel({ clientId }) {
  const [docs, setDocs] = useState(() => getClientDocuments(clientId))
  useEffect(() => subscribeToDocuments(() => setDocs(getClientDocuments(clientId))), [clientId])
  const categories = listAssociateDocCategories(docs)
  return <ClientDocumentsPanel clientId={clientId} categories={categories} emptyLabel="Aucun document associé pour ce client." />
}

// Filtres avancés locaux (KPI cliquables du header admin — voir
// LocalAdminShell.jsx) — ajout local, s'appliquent en plus de la recherche
// texte (qui, elle, reproduit exactement le champ live).
const FILTER_CHIPS = [
  { kind: null, label: 'Tous' },
  { kind: 'actifs', label: 'Actifs' },
  { kind: 'status', value: 'En cours', label: 'En cours' },
  { kind: 'status', value: 'À relancer', label: 'À relancer' },
  { kind: 'status', value: 'Bloqué', label: 'Bloqué' },
  { kind: 'status', value: 'Complété', label: 'ORIAS obtenu' },
  { kind: 'nextAction', value: 'Attendre réponse', label: 'Réponses en attente' },
]

function matchesFilter(row, filter) {
  if (!filter || !filter.kind) return true
  if (filter.kind === 'actifs') return row.status !== 'Complété'
  if (filter.kind === 'status') return row.status === filter.value
  if (filter.kind === 'nextAction') return row.nextAction === filter.value
  return true
}

function sameFilter(a, b) {
  if (!a && !b) return true
  if (!a || !b) return false
  return a.kind === b.kind && a.value === b.value
}

// openClientRequest : deep-link depuis une notification admin (feedback
// "marketing request does not notify admin" / "support flow unclear") — même
// mécanisme que `initialFilter` (un objet {clientId, ts} pour forcer l'effet
// même si le même client est redemandé deux fois de suite).
export default function LocalClientsOverview({ initialFilter = null, openClientRequest = null }) {
  const [leads, persistLeads] = useLocalLeads()
  const { rows: allRows, kpis } = buildClientsOverview(leads)
  const [filter, setFilter] = useState(initialFilter)
  useEffect(() => { if (initialFilter) setFilter(initialFilter) }, [initialFilter])
  const chipFiltered = allRows.filter(r => matchesFilter(r, filter))

  // Recherche texte — reproduit exactement `filtered` de ClientsSection
  // (live) : `${nom} ${prenom} ${pack}`.toLowerCase().includes(search).
  const [search, setSearch] = useState('')
  const rows = chipFiltered.filter(c => `${c.name} ${c.pack}`.toLowerCase().includes(search.toLowerCase()))

  // `selected` — même nom d'état que ClientsSection (live) pour le client
  // ouvert dans le modal "Voir".
  const [selectedId, setSelectedId] = useState(null)
  useEffect(() => { if (openClientRequest?.clientId != null) setSelectedId(openClientRequest.clientId) }, [openClientRequest])
  const selected = rows.find(r => r.id === selectedId) || allRows.find(r => r.id === selectedId) || null

  const conversionEntry = selected ? findConversionEntry({ activity: selected.leadActivity }) : null
  const firstEntry = selected ? findFirstEntry({ activity: selected.leadActivity }) : null

  const handleStatusChange = (clientId, newStage) => {
    persistLeads(applyStatusChange(leads, clientId, newStage))
  }

  return (
    <div className="space-y-4">
      {/* ==================== AJOUT LOCAL : KPI cliquables ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<UsersIcon className="w-5 h-5 text-white" />} label="Clients actifs" value={kpis.actifs} color="bg-orias-green border-orias-green-light" />
        <KpiCard icon={<XCircleIcon className="w-5 h-5 text-white" />} label="Clients bloqués" value={kpis.bloques} color="bg-red-500/90 border-red-400/40" />
        <KpiCard icon={<ClockIcon className="w-5 h-5 text-orias-green" />} label="À relancer" value={kpis.aRelancer} color="bg-orias-gold/90 border-orias-gold/40" />
        <KpiCard icon={<AwardIcon className="w-5 h-5 text-emerald-100" />} label="ORIAS obtenus" value={kpis.obtenus} color="bg-emerald-600 border-emerald-400/40" />
      </div>

      {/* ==================== AJOUT LOCAL : filtres avancés (chips) ==================== */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.label}
            onClick={() => setFilter(chip.kind ? { kind: chip.kind, value: chip.value } : null)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              sameFilter(filter, chip.kind ? { kind: chip.kind, value: chip.value } : null)
                ? 'bg-orias-green text-white border-orias-green'
                : 'bg-white text-gray-600 border-orias-border hover:border-orias-green/40'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ==================== REPRODUCTION EXACTE — barre de filtres (ClientsSection, live) ==================== */}
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
        <span className="text-sm text-gray-500">{rows.length} client{rows.length > 1 ? 's' : ''}</span>
      </div>

      {/* ==================== REPRODUCTION EXACTE — tableau (ClientsSection, live) ==================== */}
      {allRows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-gray-500">Aucun client pour le moment — les prospects passent en statut "Client" dans le CRM pour apparaître ici.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-gray-500">Aucun client ne correspond à cette recherche/ce filtre.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orias-border bg-orias-bg">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Client</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Pack</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Progression</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-600 hidden sm:table-cell">Marketing</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Activité</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((client, i) => (
                  <tr key={client.id} className={`border-b border-orias-border/50 hover:bg-orias-bg/50 transition-colors ${i % 2 === 0 ? '' : 'bg-orias-bg/20'}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orias-green/10 border border-orias-green/20 flex items-center justify-center text-sm font-bold text-orias-green flex-shrink-0">
                          {client.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{client.name}</p>
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
                          <span className="text-xs text-gray-500">{client.progressPct}%</span>
                        </div>
                        <ProgressBar value={client.progressPct} max={100} height="h-1.5" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`status-badge border ${STATUS_STYLES[client.status]} text-xs`}>
                        {client.status === 'Complété' ? <AwardIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                        <span className="hidden sm:inline">{STATUS_DISPLAY_LABEL[client.status]}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-xs text-gray-300">—</span>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell text-xs text-gray-400">{client.lastActivity ? `${client.lastActivity.label} · ${client.lastActivity.at}` : '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedId(client.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-orias-green hover:bg-orias-green/10 transition-colors" title="Voir">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== REPRODUCTION EXACTE — modal "Voir" (ClientsSection, live) ==================== */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedId(null)}>
          {/* max-h-[90vh] overflow-y-auto : ajout technique nécessaire pour accueillir
              les sections locales supplémentaires ci-dessous (le live n'en a pas besoin,
              son contenu est plus court) — reste rounded-2xl shadow-2xl comme le live. */}
          {/* max-w-5xl (plus large que le live, autorisé par la consigne) : permet un
              layout 2 colonnes équilibré pour accueillir les ajouts locaux sans
              empiler une longue colonne unique ni laisser d'espace vide. */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-orias-green px-6 py-5 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orias-gold/20 border-2 border-orias-gold flex items-center justify-center text-lg font-bold text-orias-gold">
                    {selected.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{selected.name}</h3>
                    <p className="text-green-300 text-sm">{selected.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-green-300 hover:text-white transition-colors">
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* ==================== REPRODUCTION EXACTE — bandeau de résumé (ClientsSection, live) ====================
                Cartes Pack/Statut/Progression/Dernière activité/Marketing + bouton WhatsApp,
                mêmes classes que le live, simplement alignées en bandeau pleine largeur
                (contenu compact, pas besoin d'une colonne dédiée) plutôt qu'empilées. */}
            <div className="p-6 pb-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-orias-bg rounded-xl p-3 border border-orias-border">
                  <p className="text-xs text-gray-500 font-medium">Pack</p>
                  <p className="font-bold text-orias-green">{selected.pack}</p>
                </div>
                <div className="bg-orias-bg rounded-xl p-3 border border-orias-border">
                  <p className="text-xs text-gray-500 font-medium">Statut</p>
                  <p className={`font-bold ${selected.status === 'Complété' ? 'text-emerald-600' : 'text-amber-600'}`}>{STATUS_DISPLAY_LABEL[selected.status]}</p>
                </div>
                <div className="bg-orias-bg rounded-xl p-3 border border-orias-border">
                  <p className="text-xs text-gray-500 font-medium">Dernière activité</p>
                  <p className="font-semibold text-gray-700 text-sm truncate">{selected.lastActivity ? selected.lastActivity.label : 'Non renseigné'}</p>
                </div>
                <div className="bg-orias-bg rounded-xl p-3 border border-orias-border">
                  <p className="text-xs text-gray-500 font-medium">Marketing</p>
                  <p className="text-sm font-semibold text-gray-400">Non modélisé en local</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500 font-medium mb-1.5">Progression dossier</p>
                <ProgressBar value={selected.progressPct} max={100} height="h-2.5" showLabel={true} label="" />
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => window.open(`https://wa.me/?text=Bonjour%20${encodeURIComponent(selected.name.split(' ')[0])}%2C%20`, '_blank')}
                  className="btn-gold flex items-center justify-center gap-2 px-5"
                >
                  <MessageIcon className="w-4 h-4" />
                  Message WhatsApp
                </button>
              </div>
            </div>

            {/* ==================== AJOUTS LOCAUX — layout 2 colonnes (au-delà du live) ====================
                GAUCHE = contenu "flux" (potentiellement long) : Message initial, Parcours
                complet, Documents, Historique. DROITE = cartes de propriétés compactes :
                Statut CRM, Identité/origine, Pack & tarification, Suivi du parcours,
                Prochaine action, Suivi des envois. Objectif : aucune grande zone vide,
                les deux colonnes se remplissent naturellement à hauteur comparable. */}
            <div className="p-6 pt-4">
              <p className="text-[11px] font-bold text-orias-gold uppercase tracking-wide mb-4">Fonctionnalités locales (en plus du live)</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* Colonne gauche */}
                <div className="space-y-4">
                  {selected.message && (
                    <div className="card p-5">
                      <p className="text-xs font-semibold text-orias-gold uppercase tracking-wide mb-3">Message initial du lead</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.message}</p>
                    </div>
                  )}

                  <div className="card p-5">
                    <p className="text-xs font-semibold text-orias-gold uppercase tracking-wide mb-3">Parcours complet</p>
                    <JourneySection client={selected} />
                  </div>

                  <div className="card p-5">
                    <p className="text-xs font-semibold text-orias-gold uppercase tracking-wide mb-3">Documents du client (rejet / remplacement / versions)</p>
                    <ClientDocumentsPanel clientId={selected.id} />
                  </div>

                  {/* Documents de l'associé — section admin clairement séparée des
                      documents du client principal (feedback session 2026-09-18) :
                      libellés distincts, jamais confondus, même workflow (valider/
                      rejeter/motif/historique de versions) via ClientDocumentsPanel,
                      catégories dédiées (associate_*) — voir associateDocuments.js. */}
                  <div className="card p-5 border-l-4 border-orias-green">
                    <p className="text-xs font-semibold text-orias-green uppercase tracking-wide mb-1">Documents de l'associé</p>
                    <p className="text-[11px] text-gray-400 mb-3">Optionnel côté client — présent uniquement si le dossier comporte un associé.</p>
                    <AssociateDocumentsPanel clientId={selected.id} />
                  </div>

                  {/* Hauteur maîtrisée : le titre et le formulaire (dans HistoryTimeline)
                      gardent leur hauteur naturelle ; seule la liste des événements a un
                      style={{maxHeight}} explicite en dur + overflow-y-auto (voir
                      HistoryTimeline ci-dessus) — indépendant de tout calcul flex
                      parent/enfant, donc garanti de scroller quel que soit le rendu.
                      overflow-hidden ici est une sécurité supplémentaire au cas où le
                      contenu dépasserait malgré tout les 420px. */}
                  <div className="card p-5 h-[420px] overflow-hidden">
                    <p className="text-xs font-semibold text-orias-gold uppercase tracking-wide mb-3">Historique d'activité</p>
                    <HistoryTimeline client={selected} />
                  </div>
                </div>

                {/* Colonne droite */}
                <div className="space-y-4">
                  <div className="card p-5">
                    <label className="block text-xs font-semibold text-gray-500 mb-2">Statut CRM</label>
                    <select
                      value={selected.stage}
                      onChange={e => handleStatusChange(selected.id, e.target.value)}
                      className={`text-sm font-semibold rounded-full px-3 py-1.5 border cursor-pointer ${STAGE_BADGE_STYLES[selected.stage] || STAGE_BADGE_STYLES['Nouveau']}`}
                    >
                      {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="card p-5">
                    <p className="text-xs font-semibold text-orias-gold uppercase tracking-wide mb-3">Identité / origine</p>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField label="Téléphone" value={selected.phone} />
                      <InfoField label="Ville" value={selected.city} />
                      <InfoField label="Source" value={selected.source} />
                      <InfoField label="Responsable" value={selected.owner} />
                      <InfoField label="Date de création (lead)" value={firstEntry?.at ? (toDisplayDateSafe(firstEntry.at) || firstEntry.at) : 'Non renseigné'} />
                      <InfoField label="Date de conversion client" value={conversionEntry?.at ? (toDisplayDateSafe(conversionEntry.at) || conversionEntry.at) : 'Non renseigné'} />
                    </div>
                  </div>

                  {selected.packId && (
                    <div className="card p-5">
                      <p className="text-xs font-semibold text-orias-gold uppercase tracking-wide mb-3">Pack & tarification</p>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoField label="Pack" value={findPackById(selected.packId)?.name || selected.pack} />
                        <InfoField label="Base tarifaire" value={selected.pricingMode ? selected.pricingMode.toUpperCase() : 'Non renseigné'} />
                        <InfoField label="Prix de base" value={selected.basePrice != null ? `${new Intl.NumberFormat('fr-MA').format(selected.basePrice)} DH ${selected.pricingMode?.toUpperCase() || ''}` : 'Non renseigné'} />
                        <InfoField label="Remise" value={selected.discountPercent != null ? `${selected.discountPercent}%` : 'Non renseigné'} />
                      </div>
                      <div className="mt-3 pt-3 border-t border-orias-border flex items-center justify-between">
                        <span className="text-xs text-gray-500">Prix final</span>
                        <span className="font-bold text-orias-green">{selected.finalPrice != null ? `${new Intl.NumberFormat('fr-MA').format(selected.finalPrice)} DH ${selected.pricingMode?.toUpperCase() || ''}` : 'Non renseigné'}</span>
                      </div>
                    </div>
                  )}

                  <div className="card p-5">
                    <p className="text-xs font-semibold text-orias-gold uppercase tracking-wide mb-3">Suivi du parcours</p>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField label="Documents" value={`${selected.validDocs} / 6 validés${selected.missingDocs > 0 ? ` · ${selected.missingDocs} manquant${selected.missingDocs > 1 ? 's' : ''}` : ''}`} />
                      <InfoField label="Formation" value={`${selected.formationDoneH} / ${selected.formationTotalH}h`} />
                    </div>
                  </div>

                  <div className="card p-5">
                    <p className="text-xs font-semibold text-orias-gold uppercase tracking-wide mb-3">Prochaine action</p>
                    <span className={`status-badge border ${STATUS_STYLES[selected.status]} text-xs`}>{selected.nextAction}</span>
                  </div>

                  <LocalClientSendHistoryPanel clientId={selected.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
