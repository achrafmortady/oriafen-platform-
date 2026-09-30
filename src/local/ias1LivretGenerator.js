// Génération LOCALE (staging V2, aucun Supabase) du livret/attestation
// IAS1 — bouton "Générer automatiquement le livret IAS1" dans l'onglet
// admin Dossiers (LocalDossierSection.jsx).
//
// Volontairement un fichier .html téléchargeable (pas de génération PDF
// côté client pour cette première implémentation, comme prévu par la
// tâche) — jamais un faux succès sans artefact réel : generateIas1Livret()
// renvoie un vrai Blob/URL téléchargeable, construit à partir des données
// réellement disponibles localement pour ce client (nom/email/pack via le
// lead converti, numéro de dossier via dossierStepStore.dossierNumberFor,
// progression réelle via formationProgressStore — jamais une valeur
// inventée). N'importe PAS src/lib/livret.js (fichier partagé avec V1,
// src/pages/admin/Dashboard.jsx) pour ne jamais risquer de le modifier —
// génération entièrement séparée, propre à ce bouton admin V2.
import { formatNowLabel } from './dateUtils'
import { getFormationState } from './formationProgressStore'
import { logActivity } from './activityLog'
import { dossierNumberFor } from './dossierStepStore'

const FORMATION_STATUS_LABEL = { completed: 'Terminé', in_progress: 'En cours', locked: 'À venir' }

export function buildIas1LivretHtml({ clientId, clientName, clientEmail, pack }) {
  const dossierNumber = dossierNumberFor(clientId)
  const { units } = getFormationState(clientId)
  const totalH = units.reduce((sum, u) => sum + u.totalHours, 0)
  const doneH = units.reduce((sum, u) => sum + u.completedHours, 0)
  const generatedAt = formatNowLabel()
  const unitsRows = units.map(u => `<tr><td>${u.title}</td><td>${u.completedHours} / ${u.totalHours} h</td><td>${FORMATION_STATUS_LABEL[u.status] || u.status}</td></tr>`).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Livret IAS1 — ${clientName}</title>
<style>
  body { font-family: 'Montserrat', Arial, sans-serif; color: #1a3d2b; max-width: 800px; margin: 0 auto; padding: 40px 32px; }
  .header { background: linear-gradient(135deg, #1a3d2b, #0d2818); color: #c9a84c; padding: 26px; text-align: center; border-radius: 14px; margin-bottom: 28px; font-weight: 700; font-size: 22px; letter-spacing: 1px; }
  h1 { font-family: Georgia, serif; color: #1a3d2b; border-bottom: 3px solid #c9a84c; padding-bottom: 10px; font-size: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 18px 0; }
  td, th { border: 1px solid #e8e2d6; padding: 8px 12px; text-align: left; font-size: 13px; }
  th { background: #f5f0e8; }
  .meta { font-size: 13px; color: #4b5563; margin: 4px 0; }
  .meta strong { color: #1a3d2b; }
  .footer { margin-top: 36px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e8e2d6; padding-top: 14px; }
</style>
</head>
<body>
  <div class="header">ORIAFEN ACADEMY — Livret de formation IAS1</div>
  <h1>${clientName}</h1>
  <p class="meta"><strong>Email :</strong> ${clientEmail || 'Non renseigné'}</p>
  <p class="meta"><strong>Pack :</strong> ${pack || 'Non renseigné'}</p>
  <p class="meta"><strong>Numéro de dossier :</strong> ${dossierNumber}</p>
  <p class="meta"><strong>Progression formation IAS1 :</strong> ${doneH} / ${totalH} heures</p>
  <table>
    <thead><tr><th>Unité de formation</th><th>Heures</th><th>Statut</th></tr></thead>
    <tbody>${unitsRows}</tbody>
  </table>
  <p class="meta"><strong>Document généré le :</strong> ${generatedAt}</p>
  <div class="footer">Document généré automatiquement — Oriafen Academy · Environnement de test (staging), généré localement sans valeur juridique tant qu'il n'a pas été validé et remis par l'équipe.</div>
</body>
</html>`
}

// Génère le livret ET journalise l'évènement dans l'historique 360° du
// client (activityLog.js — même mécanisme que tout autre évènement CRM,
// jamais un second système de "documents finaux" créé ici). Renvoie un
// artefact réel (Blob + URL objet) prêt à être téléchargé/ouvert par
// l'appelant — jamais un faux succès sans fichier.
export function generateIas1Livret({ clientId, clientName, clientEmail, pack }) {
  const html = buildIas1LivretHtml({ clientId, clientName, clientEmail, pack })
  const generatedAt = formatNowLabel()
  const safeName = (clientName || 'client').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  const fileName = `livret-ias1-${safeName}-${Date.now()}.html`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  logActivity(clientId, {
    author: 'Équipe',
    action: 'Livret IAS1 généré',
    detail: fileName,
    at: generatedAt,
  })

  return { fileName, generatedAt, url, html }
}
