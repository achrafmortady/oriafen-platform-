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
//
// Correctif "final blocker — payment gate" (2026-09-20) : la QA a signalé
// que passer `stage` à "Client" via le select Statut change immédiatement
// l'étiquette affichée sur la fiche, ce qui donne l'impression trompeuse
// qu'un compte client existe déjà — alors même que la vue "Clients" (elle)
// reste correctement vide tant que paymentValidated n'est pas vrai. Décision
// produit pour V2 (ne reproduit plus ce point précis du comportement live
// décrit ci-dessus) : le champ `stage` lui-même ne doit plus pouvoir passer
// à "Client" tant que le paiement n'est pas validé — voir canSetStageToClient()
// ci-dessous, seul point de vérité du gate, réutilisé par TOUS les chemins
// capables de modifier `stage` (select Statut fiche Prospect dans
// LocalCRM.jsx, select Statut CRM fiche Client dans LocalClientsOverview.jsx
// via applyStatusChange(), et tout futur chemin — aucune logique dupliquée).
// applyPaymentValidation() reste la SEULE action qui fait réellement passer
// un prospect à "Client" : elle fixe désormais `stage: 'Client'` dans la
// MÊME mise à jour que la validation du paiement (un seul évènement
// d'historique, jamais un doublon "Statut changé" + "Paiement validé").
// Logique de paiement (répartition des échéances, montants, statut
// 'paid'/'pending') strictement inchangée.

import { findPackById } from './packsData.js'
import { formatNowLabel } from './dateUtils.js'

// Message affiché quand une tentative de changement de statut vers "Client"
// est bloquée faute de paiement validé — un seul texte, réutilisé partout où
// le gate peut se déclencher, pour ne jamais désynchroniser le message.
export const PAYMENT_GATE_MESSAGE = "Ce prospect ne peut pas passer au statut \"Client\" tant que le paiement n'a pas été validé. Utilisez le bouton \"Valider le paiement & créer le compte\" pour convertir ce prospect."
export const EMAIL_GATE_MESSAGE = "Ajoutez l'email du prospect avant de créer le compte client. Il servira d'identifiant de connexion et évite un compte client incomplet."

// origin : pris depuis window.location quand disponible (navigateur) —
// jamais un accès direct non protégé, pour rester utilisable tel quel dans
// les scripts de test Node (local-check-*.mjs, aucun window.location réel)
// sans faire planter applyPaymentValidation, qui appelle cette fonction.
export function buildActivationLink(lead) {
  const origin = (typeof window !== 'undefined' && window.location?.origin) || ''
  const params = new URLSearchParams({
    email: String(lead?.email || '').trim(),
    name: String(lead?.name || '').trim(),
    localActivation: String(lead?.id || Date.now()),
  })
  return `${origin}/set-password?${params.toString()}`
}

export function buildActivationEmail(lead) {
  const firstName = String(lead?.name || 'client').trim().split(/\s+/)[0] || 'client'
  const activationLink = buildActivationLink(lead)
  return {
    to: String(lead?.email || '').trim(),
    subject: 'Activez votre compte Oriafen Academy',
    activationLink,
    text: [
      `Bienvenue ${firstName} 👋`,
      '',
      'Votre compte Oriafen Academy a été créé par notre équipe.',
      'Cliquez sur le lien ci-dessous pour choisir votre mot de passe et accéder à votre formation.',
      '',
      activationLink,
      '',
      'Une question ? Contactez-nous sur WhatsApp.',
      '',
      'Oriafen Academy',
    ].join('\n'),
  }
}

// Seul point de vérité du gate paiement — un prospect ne peut passer à
// stage==='Client' que si paymentValidated est déjà vrai (compte déjà créé
// via applyPaymentValidation, la seule action qui le fixe à true).
export function canSetStageToClient(lead) {
  return Boolean(lead?.paymentValidated)
}

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
  if (!String(lead.email || '').trim()) return leads
  const pack = findPackById(lead.packId)
  if (!pack) return leads // même garde-fou que le live : pas de pack -> pas de conversion possible
  const payments = buildMockPaymentRows(pack, lead.finalPrice ?? pack.priceTtc)
  if (payments.length) payments[0] = { ...payments[0], status: 'paid' }
  const now = formatNowLabel()
  const firstAmount = payments[0]?.amount ?? 0
  const activationEmail = buildActivationEmail(lead)
  // stage: 'Client' fixé ICI, dans la même mise à jour que la validation du
  // paiement — c'est désormais la SEULE façon pour un prospect de devenir
  // "Client" (voir canSetStageToClient ci-dessus). Une seule entrée
  // d'historique couvre les deux à la fois, jamais un "Statut changé" séparé.
  //
  // relance: null (correctif 2026-09-22, retour client "Client Démo statut
  // à relancer alors qu'il est déjà client") : une relance programmée AVANT
  // la conversion (relance.js, indépendant du statut CRM par conception)
  // n'était jamais nettoyée — un prospect relancé juste avant de devenir
  // client continuait donc d'afficher le badge "À relancer" sur sa fiche
  // après conversion (relanceReason() ne filtre pas par stage). Une fois
  // converti, la relance programmée n'a plus de sens : elle est annulée
  // ici, jamais recréée ailleurs. `stage` n'est jamais redéfini par ce
  // nettoyage (règle explicite du correctif).
  return leads.map(l => l.id === leadId
    ? {
        ...l,
        stage: 'Client',
        paymentValidated: true,
        convertedAt: now,
        payments,
        relance: null,
        // action/done (correctif "Premier contact" persistant en Agenda,
        // audit inspection navigateur 2026-09-24) : la prochaine action
        // pré-conversion (ex: "Premier contact") n'a plus de sens une fois
        // le client converti — jamais nettoyée avant ce correctif, elle
        // restait affichée indéfiniment dans les vues Agenda/Calendrier du
        // CRM. `done: true` la fait apparaître "✓ Terminée" (même
        // convention d'affichage que toute autre action terminée), et la
        // retire aussi de "Actions en retard" (qui filtre déjà sur !done).
        action: 'Aucune action programmée',
        done: true,
        activationEmail,
        activationEmailPreparedAt: now,
        activity: [
          { text: `Email d'activation préparé pour ${activationEmail.to}`, at: now },
          { text: `Paiement validé — compte client créé (${firstAmount} DH réglés)`, at: now },
          ...(l.activity || []),
        ],
      }
    : l)
}
