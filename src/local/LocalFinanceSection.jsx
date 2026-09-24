// Section Finance — vue V2 preview/local UNIQUEMENT (feedback : "la section
// Finance doit être visible dans V2, comme en V1"). Dérivée exclusivement
// des données locales déjà existantes (leads convertis en Client avec
// paymentValidated=true, leur tableau `payments` généré par
// applyPaymentValidation/buildMockPaymentRows dans conversion.js) — aucune
// nouvelle logique de paiement, aucun accès Supabase, rien inventé.
//
// Libellés d'étapes (MILESTONE_LABELS) et répartition CA encaissé/CA du
// mois/CA de l'année/en attente repris à l'identique de FinanceSection dans
// src/pages/admin/Dashboard.jsx (V1, fichier live non modifié, lu seulement
// comme référence) pour donner le même vocabulaire à l'équipe. La logique
// Finance LIVE (Supabase, markPaymentPaid, etc.) n'est ni appelée ni
// modifiée ici : cette vue est en lecture seule sur les données locales.
import React, { useMemo, useState } from 'react'
import { parseFlexibleDate } from './dateUtils'

const MILESTONE_LABELS = {
  souscription:   'Souscription (50%)',
  kbis_formation: 'Kbis + Formation (25%)',
  orias:          'ORIAS obtenu (25%)',
  full:           'Paiement unique (100%)',
}

const money = n => new Intl.NumberFormat('fr-MA').format(Math.round(n || 0)) + ' DH'

function buildFinanceData(leads) {
  const clients = leads.filter(l => l.stage === 'Client' && l.paymentValidated)
  const now = new Date()
  let totalPaid = 0, totalPending = 0, monthRevenue = 0, yearRevenue = 0, pendingCount = 0
  const rows = []
  clients.forEach(lead => {
    const convertedDate = parseFlexibleDate(lead.convertedAt) || (lead.createdAt ? new Date(lead.createdAt) : null)
    ;(lead.payments || []).forEach((p, index) => {
      if (p.status === 'paid') {
        totalPaid += p.amount
        if (convertedDate && convertedDate.getFullYear() === now.getFullYear()) {
          yearRevenue += p.amount
          if (convertedDate.getMonth() === now.getMonth()) monthRevenue += p.amount
        }
      } else {
        totalPending += p.amount
        pendingCount += 1
      }
      rows.push({
        key: `${lead.id}-${index}`,
        clientId: lead.id,
        clientName: lead.name,
        clientEmail: lead.email || null,
        pack: lead.pack || null,
        milestone: p.milestone,
        amount: p.amount,
        status: p.status,
        convertedAt: lead.convertedAt || null,
      })
    })
  })
  return { totalPaid, totalPending, monthRevenue, yearRevenue, pendingCount, rows, clients }
}

export default function LocalFinanceSection({ leads }) {
  const { totalPaid, totalPending, monthRevenue, yearRevenue, pendingCount, rows, clients } = useMemo(() => buildFinanceData(leads), [leads])
  const [selectedClientId, setSelectedClientId] = useState('all')
  const visibleRows = selectedClientId === 'all' ? rows : rows.filter(r => String(r.clientId) === String(selectedClientId))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Administration</p>
        <h1 className="text-2xl font-bold text-orias-green">Finance</h1>
        <p className="text-sm text-gray-500 mt-1">Vue locale (aperçu V2) — dérivée des clients réellement convertis et de leurs paiements. Aucune donnée Supabase live, aucune logique Finance en production touchée ici.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-emerald-50 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700 mb-1">CA encaissé (total)</p>
          <p className="text-2xl font-bold text-emerald-800">{money(totalPaid)}</p>
        </div>
        <div className="card p-5 bg-orias-gold/10 border-orias-gold/30">
          <p className="text-xs font-semibold text-orias-gold mb-1">CA ce mois-ci</p>
          <p className="text-2xl font-bold text-orias-green">{money(monthRevenue)}</p>
        </div>
        <div className="card p-5 bg-emerald-50/60 border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700 mb-1">CA année {new Date().getFullYear()}</p>
          <p className="text-2xl font-bold text-emerald-800">{money(yearRevenue)}</p>
        </div>
        <div className="card p-5 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">En attente ({pendingCount} paiement{pendingCount > 1 ? 's' : ''})</p>
          <p className="text-2xl font-bold text-amber-800">{money(totalPending)}</p>
        </div>
      </div>

      <section className="card p-6">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <h3 className="font-bold text-orias-green">Paiements par client ({clients.length})</h3>
          {clients.length > 0 && (
            <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="input-field text-sm w-auto">
              <option value="all">Tous les clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
        {!rows.length ? (
          <p className="text-sm text-gray-400">Aucun client converti pour l'instant — cette vue se remplit automatiquement dès qu'un prospect est converti en client (paiement validé).</p>
        ) : (
          <div className="space-y-3">
            {visibleRows.map(r => (
              <div key={r.key} className="rounded-xl border border-orias-border p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">{r.clientName}{r.clientEmail ? <span className="text-gray-400 font-normal"> · {r.clientEmail}</span> : ''}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.pack || '—'} · {MILESTONE_LABELS[r.milestone] ?? r.milestone}{r.convertedAt ? ` · converti le ${r.convertedAt}` : ''}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-gray-800">{money(r.amount)}</span>
                  <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${r.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {r.status === 'paid' ? 'Payé' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
