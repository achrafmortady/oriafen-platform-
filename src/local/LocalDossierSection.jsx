import React, { useState, useEffect } from 'react'
import { seed, normalizeLeadsStage, normalizeCanonicalDemoClient } from './model'
import { buildClientsOverview } from './clientsOverviewData'
import { ClientDocumentsPanel, AssociateDocumentsPanel } from './LocalClientsOverview'
import { STEP_LABELS, getDossierStep, setDossierStep, subscribeToDossierSteps } from './dossierStepStore'
import { CheckCircleIcon, EyeIcon } from '../components/Icons'
import ProgressBar from '../components/ProgressBar'

// Restauration V1 -> V2 (audit 2026-09-19) : src/pages/admin/Dashboard.jsx
// > DossierSection (227 lignes, live non modifié) — onglet admin "Dossiers"
// dédié au suivi étape par étape d'un dossier client, resté un simple
// placeholder générique dans V2 (LocalAdminShell.jsx). Reproduit ici :
// sélecteur de client, suivi des 6 étapes ORIAS avec avancement manuel
// ("Valider →"), et récapitulatif documents (client + associé) — en
// réutilisant les mêmes données/composants que l'onglet "Clients"
// (buildClientsOverview, ClientDocumentsPanel, AssociateDocumentsPanel),
// jamais un second système de gestion documentaire.
//
// Scope assumé (documenté, pas un oubli) : "Envoyer un document reçu/final
// au client" (AdminSendDocPanel/AdminSendFinalDocPanel côté live) n'est pas
// porté dans cette passe — aucun upload de fichier réel n'existe nulle part
// dans cette démo locale (les documents stockent un nom de fichier, jamais
// un contenu). À prévoir en production avec un vrai stockage de fichiers.

const STORAGE_KEY = 'oriafen-isolated-crm-v1'

function useLocalLeads() {
  const [leads, setLeads] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (!raw) return seed()
      const normalized = normalizeCanonicalDemoClient(normalizeLeadsStage(raw))
      if (JSON.stringify(normalized) !== JSON.stringify(raw)) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    } catch { return seed() }
  })
  useEffect(() => {
    const refresh = () => {
      try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
        if (raw) setLeads(normalizeCanonicalDemoClient(normalizeLeadsStage(raw)))
      } catch { /* ignore */ }
    }
    window.addEventListener('storage', refresh)
    const timer = setInterval(refresh, 4000)
    return () => { window.removeEventListener('storage', refresh); clearInterval(timer) }
  }, [])
  return leads
}

export default function LocalDossierSection() {
  const leads = useLocalLeads()
  const { rows: clients } = buildClientsOverview(leads)
  const [selectedId, setSelectedId] = useState(null)
  const [, forceRefresh] = useState(0)

  useEffect(() => subscribeToDossierSteps(() => forceRefresh(n => n + 1)), [])
  useEffect(() => { if (!selectedId && clients.length) setSelectedId(clients[0].id) }, [clients, selectedId])

  const selected = clients.find(c => c.id === selectedId) || null
  const currentStep = selected ? getDossierStep(selected.id, selected.stepIndex + 1) : 1
  const pendingCount = selected ? selected.pendingDocs : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="card p-4">
        <h3 className="font-bold text-orias-green mb-3">Sélectionner un client</h3>
        {!clients.length && <p className="text-sm text-gray-400">Aucun client (paiement validé) pour le moment.</p>}
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {clients.map(c => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${selected?.id === c.id ? 'bg-orias-green text-white' : 'hover:bg-orias-bg text-gray-700'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selected?.id === c.id ? 'bg-white/20 text-white' : 'bg-orias-green/10 text-orias-green'}`}>
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{c.name}</p>
                <p className={`text-xs truncate ${selected?.id === c.id ? 'text-green-300' : 'text-gray-400'}`}>{c.pack} · Étape {getDossierStep(c.id, c.stepIndex + 1)}</p>
              </div>
              {c.pendingDocs > 0 && <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{c.pendingDocs}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {selected ? (
          <>
            <div className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-orias-green text-lg">{selected.name}</h3>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`status-badge border ${selected.status === 'Complété' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{selected.status}</span>
                  {pendingCount > 0 && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white">🔴 {pendingCount} doc{pendingCount > 1 ? 's' : ''} à valider</span>}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Étape actuelle</span>
                <span className="font-bold text-orias-green">{currentStep} / {STEP_LABELS.length}</span>
              </div>
              <ProgressBar value={currentStep - 1} max={STEP_LABELS.length - 1} height="h-2" />
            </div>

            <div className="card p-5">
              <h4 className="font-bold text-orias-green mb-4">Étapes du dossier</h4>
              <div className="space-y-2">
                {STEP_LABELS.map((step, i) => {
                  const stepNum = i + 1
                  const done = stepNum < currentStep
                  const active = stepNum === currentStep
                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${done ? 'bg-emerald-50 border-emerald-200' : active ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-500' : active ? 'bg-orias-gold' : 'bg-gray-300'}`}>
                          {done ? <CheckCircleIcon className="w-4 h-4 text-white" /> : <span className="text-xs font-bold text-white">{stepNum}</span>}
                        </div>
                        <span className={`text-sm font-medium ${done ? 'text-emerald-700' : active ? 'text-amber-700' : 'text-gray-400'}`}>{step}</span>
                      </div>
                      {active && stepNum < STEP_LABELS.length && (
                        <button onClick={() => setDossierStep(selected.id, Math.min(stepNum + 1, STEP_LABELS.length))} className="text-xs font-semibold px-3 py-1 rounded-full bg-orias-gold/20 text-orias-gold hover:bg-orias-gold/30 border border-orias-gold/40 transition-colors">Valider →</button>
                      )}
                      {done && <span className="text-xs text-emerald-600 font-semibold">✓ Validé</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-5">
              <h4 className="font-bold text-orias-green mb-3">Documents du client</h4>
              <ClientDocumentsPanel clientId={selected.id} />
            </div>

            <div className="card p-5 border-l-4 border-orias-green">
              <h4 className="font-bold text-orias-green mb-1">Documents de l'associé</h4>
              <p className="text-[11px] text-gray-400 mb-3">Optionnel côté client.</p>
              <AssociateDocumentsPanel clientId={selected.id} />
            </div>

            <a href={`https://wa.me/?text=Bonjour+${encodeURIComponent(selected.name.split(' ')[0])}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#25d366] hover:bg-[#20bd5a] transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
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
