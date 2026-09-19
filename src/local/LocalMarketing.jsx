import React, { useState, useEffect } from 'react'
import {
  getMarketingProject, getDeliverables, getModificationRequests,
  createModificationRequest, setModificationStatus, updateMarketingProject,
  subscribeToMarketing, MODIFICATION_STATUSES,
} from './marketingStore'
import { getActiveClientId } from './adapters/identity'

const STATUS_STYLE = {
  'Envoyée': 'bg-blue-50 text-blue-700 border-blue-200',
  'En cours': 'bg-amber-50 text-amber-700 border-amber-200',
  'Traitée': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Refusée': 'bg-red-50 text-red-600 border-red-200',
}

function StatusBadge({ status }) {
  return <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] || STATUS_STYLE['Envoyée']}`}>{status}</span>
}

function ProjectOverviewCard({ project }) {
  return (
    <section className="card p-6">
      <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-4">Aperçu du projet</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Projet</p><p className="font-bold text-gray-800 mt-0.5">{project.name}</p></div>
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Type</p><p className="font-bold text-gray-800 mt-0.5">{project.type}</p></div>
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Statut</p><p className="font-bold text-orias-green mt-0.5">{project.status}</p></div>
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Phase actuelle</p><p className="font-bold text-gray-800 mt-0.5">{project.phase}</p></div>
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Dernière mise à jour</p><p className="font-bold text-gray-800 mt-0.5">{project.lastUpdate}</p></div>
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Progression</p><p className="font-bold text-gray-800 mt-0.5">{project.progressPct}%</p></div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-orias-bg overflow-hidden">
        <div className="h-full bg-orias-gold" style={{ width: `${project.progressPct}%` }} />
      </div>
    </section>
  )
}

function DeliverablesCard({ deliverables }) {
  return (
    <section className="card p-6">
      <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-4">Livrables</h3>
      {!deliverables.length && <p className="text-sm text-gray-400">Aucun livrable pour le moment.</p>}
      <div className="space-y-2">
        {deliverables.map(d => (
          <div key={d.id} className="flex items-center justify-between gap-3 border border-orias-border rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{d.name}</p>
              <p className="text-xs text-gray-400">{d.kind} · {d.version} · {d.updatedAt}</p>
            </div>
            {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="btn-outline-green text-xs flex-shrink-0">Ouvrir</a>}
          </div>
        ))}
      </div>
    </section>
  )
}

function NewRequestModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ section: '', title: '', description: '', priority: 'normale' })
  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="bg-orias-green px-6 py-5 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Demander une modification</h3>
          <button onClick={onClose} className="text-green-300 hover:text-white">✕</button>
        </div>
        <form className="p-6 space-y-4" onSubmit={e => { e.preventDefault(); if (!form.title.trim()) return; onSubmit(form); }}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Section concernée</label>
            <input value={form.section} onChange={e => update('section', e.target.value)} className="input-field text-sm" placeholder="Ex : Page d'accueil, Formulaire de contact..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Titre *</label>
            <input value={form.title} onChange={e => update('title', e.target.value)} className="input-field text-sm" placeholder="Résumez la modification souhaitée" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} className="input-field text-sm resize-none" placeholder="Détaillez ce qui doit changer..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Priorité</label>
            <select value={form.priority} onChange={e => update('priority', e.target.value)} className="input-field text-sm">
              <option value="normale">Normale</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <button type="submit" className="btn-gold w-full" disabled={!form.title.trim()}>Envoyer la demande</button>
        </form>
      </div>
    </div>
  )
}

function RequestsCard({ requests, onNewRequest }) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide">Demandes de modification</h3>
        <button onClick={onNewRequest} className="btn-gold text-xs">＋ Demander une modification</button>
      </div>
      {!requests.length && <p className="text-sm text-gray-400">Aucune demande envoyée pour le moment.</p>}
      <div className="space-y-3">
        {requests.map(r => (
          <div key={r.id} className="border border-orias-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-orias-gold">{r.section}</span>
                <p className="font-bold text-gray-800 mt-0.5">{r.title}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            {r.description && <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{r.description}</p>}
            <p className="text-[11px] text-gray-400 mt-2">Envoyée le {r.createdAt}{r.priority === 'urgente' ? ' · Priorité urgente' : ''}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// Vue CLIENT — feedback #8 : projet, livrables, demandes de modification.
// clientName (optionnel) : transmis à createModificationRequest uniquement
// pour libeller la notification admin ("Nouvelle demande de modification —
// <nom>") — n'affecte rien d'autre.
export function ClientMarketingPanel({ clientId, clientName = null }) {
  const [project, setProject] = useState(() => getMarketingProject(clientId))
  const [deliverables, setDeliverables] = useState(() => getDeliverables(clientId))
  const [requests, setRequests] = useState(() => getModificationRequests(clientId))
  const [showModal, setShowModal] = useState(false)
  const refresh = () => { setProject(getMarketingProject(clientId)); setDeliverables(getDeliverables(clientId)); setRequests(getModificationRequests(clientId)) }
  useEffect(() => subscribeToMarketing(refresh), [clientId])

  return (
    <div className="space-y-5">
      <ProjectOverviewCard project={project} />
      <DeliverablesCard deliverables={deliverables} />
      <RequestsCard requests={requests} onNewRequest={() => setShowModal(true)} />
      {showModal && (
        <NewRequestModal
          onClose={() => setShowModal(false)}
          onSubmit={form => { createModificationRequest(clientId, form, clientName); setShowModal(false); refresh() }}
        />
      )}
    </div>
  )
}

// Vue ADMIN — feedback #8 : traiter les demandes du client (changement de
// statut), garder l'historique. Résolu via l'adaptateur identity.js (jamais
// un id en dur ici) — un seul client de démo aujourd'hui, le même que
// ClientSpace et la fiche admin "Clients".
export function AdminMarketingPanel({ clientId = getActiveClientId() }) {
  const [project, setProject] = useState(() => getMarketingProject(clientId))
  const [requests, setRequests] = useState(() => getModificationRequests(clientId))
  const [phaseDraft, setPhaseDraft] = useState('')
  const refresh = () => { setProject(getMarketingProject(clientId)); setRequests(getModificationRequests(clientId)) }
  useEffect(() => subscribeToMarketing(refresh), [clientId])
  useEffect(() => { setPhaseDraft(project.phase) }, [project.phase])

  return (
    <div className="space-y-5">
      <section className="card p-6">
        <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-4">Projet client (démo)</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Phase actuelle</label>
            <input value={phaseDraft} onChange={e => setPhaseDraft(e.target.value)} className="input-field text-sm" />
          </div>
          <button className="btn-gold text-sm" disabled={phaseDraft === project.phase} onClick={() => { updateMarketingProject(clientId, { phase: phaseDraft }); refresh() }}>Mettre à jour la phase</button>
        </div>
        <p className="text-[11px] text-gray-400 mt-3">Statut : {project.status} · Dernière mise à jour : {project.lastUpdate}</p>
      </section>
      <section className="card p-6">
        <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-4">Demandes de modification client</h3>
        {!requests.length && <p className="text-sm text-gray-400">Aucune demande reçue.</p>}
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="border border-orias-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-orias-gold">{r.section}</span>
                  <p className="font-bold text-gray-800 mt-0.5">{r.title}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.description && <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{r.description}</p>}
              <p className="text-[11px] text-gray-400 mt-2">Envoyée le {r.createdAt}{r.priority === 'urgente' ? ' · Priorité urgente' : ''}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {MODIFICATION_STATUSES.filter(s => s !== r.status).map(s => (
                  <button key={s} onClick={() => { setModificationStatus(clientId, r.id, s); refresh() }} className="btn-outline-green text-xs">Marquer « {s} »</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
