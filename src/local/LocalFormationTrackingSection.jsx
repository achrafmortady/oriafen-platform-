import React, { useState, useEffect } from 'react'
import { seed, normalizeLeadsStage, normalizeCanonicalDemoClient } from './model'
import { buildClientsOverview } from './clientsOverviewData'
import { getFormationState, subscribeToFormationProgress } from './formationProgressStore'
import { FORMATION_UNITS } from '../data/mockData'
import { openLivret } from '../lib/livret'
import { CheckCircleIcon, ClockIcon } from '../components/Icons'

// Restauration V1 -> V2 (audit 2026-09-19) : src/pages/admin/Dashboard.jsx
// > FormationTrackingSection (live non modifié) — tableau admin listant la
// progression Formation IAS1 de chaque client, resté un placeholder
// générique dans V2. Reproduit ici en lisant formationProgressStore.js
// (même store que LocalMaFormation.jsx côté client) pour chaque client de
// buildClientsOverview (même liste que l'onglet "Clients"). openLivret()
// (src/lib/livret.js, live non modifié) est réutilisé tel quel : génération
// HTML 100% locale (data URIs), aucun appel réseau/Supabase.

const STORAGE_KEY = 'oriafen-isolated-crm-v1'

// Réécrit la version migrée dans localStorage si elle diffère des données
// brutes (même correctif que LocalClientsOverview.jsx/LocalDossierSection.jsx
// — audit final 2026-09-19 : cet onglet appliquait déjà la migration en
// mémoire mais ne la persistait jamais, seule différence avec le bug
// "Client Démo absent d'Admin > Clients" déjà corrigé ailleurs. Sans cette
// réécriture, ouvrir CET onglet en premier ne préserverait pas la correction
// pour les autres vues qui liraient encore les données brutes.
function normalizeAndPersist(raw) {
  const normalized = normalizeCanonicalDemoClient(normalizeLeadsStage(raw))
  if (JSON.stringify(normalized) !== JSON.stringify(raw)) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

function useLocalLeads() {
  const [leads, setLeads] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
      return raw ? normalizeAndPersist(raw) : seed()
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

export default function LocalFormationTrackingSection() {
  const leads = useLocalLeads()
  const { rows: clients } = buildClientsOverview(leads)
  const [, forceRefresh] = useState(0)
  useEffect(() => subscribeToFormationProgress(() => forceRefresh(n => n + 1)), [])

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="font-bold text-orias-green text-lg mb-5">Suivi des formations</h3>
        {clients.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Aucun étudiant inscrit pour l'instant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orias-border bg-orias-bg">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Étudiant</th>
                  {FORMATION_UNITS.map(u => <th key={u.id} className="text-center px-3 py-3.5 font-semibold text-gray-600 hidden md:table-cell">U{u.id}</th>)}
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">Progression</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Examen</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600 hidden xl:table-cell">Livret</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => {
                  const { units, examResults } = getFormationState(c.id)
                  const totalHours = units.reduce((s, u) => s + u.totalHours, 0)
                  const completedHours = units.reduce((s, u) => s + u.completedHours, 0)
                  const prog = totalHours ? Math.round((completedHours / totalHours) * 100) : 0
                  const ias1Result = examResults.find(r => r.exam_type === 'ias1')
                  const examPassed = ias1Result ? ias1Result.score >= 15 : false
                  const examScore = ias1Result?.score ?? null
                  const initials = c.name.slice(0, 2).toUpperCase()
                  return (
                    <tr key={c.id} className="border-b border-orias-border/50 hover:bg-orias-bg/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orias-green/10 flex items-center justify-center text-xs font-bold text-orias-green flex-shrink-0">{initials}</div>
                          <div>
                            <p className="font-medium text-gray-700">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      {units.map(u => (
                        <td key={u.id} className="px-3 py-3.5 text-center hidden md:table-cell">
                          {u.status === 'completed' ? <CheckCircleIcon className="w-4 h-4 text-emerald-500 mx-auto" /> : <ClockIcon className="w-4 h-4 text-gray-300 mx-auto" />}
                        </td>
                      ))}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-orias-green text-sm">{prog}%</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orias-green rounded-full transition-all" style={{ width: `${prog}%` }} /></div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        {examPassed ? <span className="font-bold text-emerald-600 text-sm">{examScore}/20 ✅</span>
                          : examScore ? <span className="font-bold text-red-500 text-sm">{examScore}/20 ❌</span>
                          : <span className="text-gray-300 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center hidden xl:table-cell">
                        {examPassed ? (
                          <button onClick={() => openLivret(c.name)} className="text-xs font-semibold text-orias-gold hover:text-orias-gold-light flex items-center gap-1 mx-auto border border-orias-gold/30 px-2 py-1 rounded-lg hover:bg-orias-gold/10 transition-colors">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Livret
                          </button>
                        ) : <span className="text-gray-300 text-sm">—</span>}
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
