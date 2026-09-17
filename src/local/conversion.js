// Reproduit LOCALEMENT (mock, aucun Supabase) le workflow historique
// live de conversion Prospect -> Client — inspecté en lecture seule dans :
//   - src/pages/admin/Dashboard.jsx : LeadDetailPanel.handleConvert(),
//     et le bloc JSX "{lead.status === 'client' && (...)}" qui affiche la
//     carte "Valider le premier paiement" tant que `lead.converted_user_id`
//     n'est pas défini (fichier live non modifié, lu seulement comme
//     référence).
//   - src/lib/api.js : convertLeadToClient, buildPaymentRows et
//     markPaymentPaid — lecture seule, non modifiés, non appelés.
//
// Point clé du comportement live reproduit ici : passer le CRM `status`
// (ici `stage`) à "Client" est un simple changement de champ, TOUJOURS
// possible sans condition — mais cela ne crée PAS de compte/dossier/
// paiement. Une action explicite et séparée ("Valider le paiement & créer
// le compte") est nécessaire pour que la conversion soit réellement
// effective. Tant qu'elle n'a pas eu lieu, le lead n'apparaît PAS dans la
// vue "Clients" locale (voir buildClientsOverview, clientsOverviewData.js),
// exactement comme en live où fetchAllClients() ne lit que les comptes
// réellement créés (table users/dossiers), pas les leads status='client'
// non convertis.

import { findPackById } from './packsData.js'
import { formatNowLabel } from './dateUtils.js'

// Reproduit EXACTEMENT la répartition de buildPaymentRows, définie dans
// src/lib/api.js — lecture seule : pack.payment_type === 'full' -> une seule ligne à 100% ;
// sinon 50% (souscription) / 25% (kbis_formation) / 25% (orias).
export function buildMockPaymentRows(pack, finalPrice) {
  if (!pack) return []
  const amount = Number(finalPrice) || 0
  if (pack.paymentType === 'full') {
    return [{ milestone: 'full', amount, status: 'pending' }]
  }
  const half = Math.round(amount * 0.5)
  const quarter = Math.round(amount * 0.25)
  return [
    { milestone: 'souscription', amount: half, status: 'pending' },
    { milestone: 'kbis_formation', amount: quarter, status: 'pending' },
    { milestone: 'orias', amount: quarter, status: 'pending' },
  ]
}

// Reproduit handleConvert -> convertLeadToClient -> markPaymentPaid, tous
// lus en lecture seule dans src/pages/admin/Dashboard.jsx et src/lib/api.js :
// génère les paiements, marque le PREMIER comme payé, journalise la
// conversion. Pure (pas d'effet de bord) ; idempotent si déjà validé.
// Exige un pack sélectionné, comme le bouton live (`disabled={!packId}`).
export function applyPaymentValidation(leads, leadId) {
  const lead = leads.find(l => l.id === leadId)
  if (!lead || lead.paymentValidated) return leads
  const pack = findPackById(lead.packId)
  if (!pack) return leads // même garde-fou que le live : pas de pack -> pas de conversion possible
  const payments = buildMockPaymentRows(pack, lead.finalPrice ?? pack.priceTtc)
  if (payments.length) payments[0] = { ...payments[0], status: 'paid' }
  const now = formatNowLabel()
  const firstAmount = payments[0]?.amount ?? 0
  return leads.map(l => l.id === leadId
    ? {
        ...l,
        paymentValidated: true,
        convertedAt: now,
        payments,
        activity: [
          { text: `Paiement validé — compte client créé (${firstAmount} DH réglés)`, at: now },
          ...(l.activity || []),
        ],
      }
    : l)
}
