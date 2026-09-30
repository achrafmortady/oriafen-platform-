import React, { useState, useEffect } from 'react'
import {
  getMarketingProject, getDeliverables, getModificationRequests,
  createModificationRequest, setModificationStatus, updateMarketingProject,
  subscribeToMarketing, MODIFICATION_STATUSES,
  getMarketingChannels, updateMarketingChannel, CHANNEL_STATUSES,
  getBrandIntake, submitBrandIntake, addDeliverable, DELIVERABLE_TYPES,
} from './marketingStore'

const CHANNEL_STATUS_STYLE = {
  'À démarrer': 'bg-gray-50 text-gray-500 border-gray-200',
  'En cours': 'bg-amber-50 text-amber-700 border-amber-200',
  'En révision': 'bg-blue-50 text-blue-700 border-blue-200',
  'Terminé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

// Progression PAR CANAL, affichée séparément pour chaque canal (correctif
// 2026-09-22, retour client) — jamais un statut global unique. Même carte
// réutilisée côté client (lecture seule) et admin (`editable`).
//
// Correctif "progression incohérente avec le statut" (audit inspection
// navigateur, 2026-09-24) : statut et pourcentage étaient deux contrôles
// totalement indépendants — choisir "Terminé" laissait la barre à 0%, et
// passer à "En cours" ne bougeait jamais un pourcentage resté à 0%. La
// progression déduite reste un point de départ raisonnable ; l'admin garde
// la main pour l'ajuster ensuite via le curseur (jamais figée).
function statusToPatch(status, currentProgressPct) {
  if (status === 'Terminé') return { status, progressPct: 100 }
  if (status === 'En cours' && currentProgressPct === 0) return { status, progressPct: 40 }
  if (status === 'À démarrer') return { status, progressPct: 0 }
  return { status }
}

// ================================================================
// Redesign "Mon site & communication" (simplification UX, 2026-09-30) :
// la page était trop chargée (plusieurs grosses cartes empilées, tout le
// brief affiché en permanence) — aucune donnée/logique nouvelle ici,
// uniquement une lecture combinée de ce qui existe déjà (brandIntake/
// project/channels/deliverables) pour donner un résumé + un stepper en
// haut de page, compréhensible en quelques secondes.
// ================================================================
const STEP_STATE_STYLE = {
  done: { icon: '✓', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { icon: '●', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  waiting: { icon: '○', cls: 'bg-gray-50 text-gray-400 border-gray-200' },
}

function deriveMarketingSteps(brandIntake, channels, deliverables) {
  const hasIntake = Boolean(brandIntake)
  const anyChannelStarted = channels.some(ch => ch.status !== 'À démarrer' || ch.progressPct > 0)
  const allChannelsDone = channels.length > 0 && channels.every(ch => ch.status === 'Terminé')
  const hasDeliverables = deliverables.length > 0

  const steps = [
    {
      id: 'brief',
      label: 'Informations de marque',
      state: hasIntake ? 'done' : 'waiting',
      hint: hasIntake ? 'Brief reçu' : 'En attente du brief client',
    },
    {
      id: 'brandkit',
      label: 'Brand kit',
      state: !hasIntake ? 'waiting' : anyChannelStarted ? 'done' : 'in_progress',
      hint: !hasIntake ? 'En attente du brief' : anyChannelStarted ? 'Brand kit prêt' : 'Préparation en cours',
    },
    {
      id: 'production',
      label: 'Production des canaux',
      state: !hasIntake ? 'waiting' : allChannelsDone ? 'done' : anyChannelStarted ? 'in_progress' : 'waiting',
      hint: !hasIntake ? 'En attente du brand kit' : allChannelsDone ? 'Tous les canaux terminés' : anyChannelStarted ? 'En cours' : 'Pas encore démarrée',
    },
    {
      id: 'deliverables',
      label: 'Livrables & modifications',
      state: hasDeliverables ? 'in_progress' : 'waiting',
      hint: hasDeliverables ? 'Livrables disponibles' : 'Aucun livrable pour le moment',
    },
  ]
  const next = steps.find(s => s.state !== 'done')
  return { steps, nextStepLabel: next ? `${next.label} — ${next.hint}` : 'Tout est à jour' }
}

function MarketingSummaryCard({ project, steps, nextStepLabel }) {
  return (
    <section className="card p-6">
      <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Votre projet communication</p>
      <h3 className="text-lg font-bold text-orias-green mb-4">{project.name}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-5">
        <div><p className="text-[10px] text-gray-400 font-semibold uppercase">Phase actuelle</p><p className="font-bold text-gray-800 mt-0.5">{project.phase}</p></div>
        <div><p className="text-[10px] text-gray-400 font-semibold uppercase">Statut</p><p className="font-bold text-gray-800 mt-0.5">{project.status}</p></div>
        <div><p className="text-[10px] text-gray-400 font-semibold uppercase">Prochaine étape</p><p className="font-bold text-orias-green mt-0.5">{nextStepLabel}</p></div>
        <div><p className="text-[10px] text-gray-400 font-semibold uppercase">Dernière mise à jour</p><p className="font-bold text-gray-800 mt-0.5">{project.lastUpdate || 'Non renseigné'}</p></div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
        {steps.map((s, i) => {
          const st = STEP_STATE_STYLE[s.state]
          return (
            <div key={s.id} className="flex-1 flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs font-bold flex-shrink-0 ${st.cls}`}>{st.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{s.label}</p>
                <p className="text-[11px] text-gray-400 truncate">{s.hint}</p>
              </div>
              {i < steps.length - 1 && <span className="hidden sm:block flex-1 h-px bg-orias-border mx-2" />}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// Correctif simplification UX (2026-09-30) : remplace les grosses cartes
// empilées (une par canal, barre de progression pleine largeur + tous les
// champs toujours visibles) par des lignes compactes — statut, %, dernière
// mise à jour visibles d'un coup d'oeil ; le détail (étape actuelle/reste à
// faire, et côté admin le curseur + les champs texte) reste disponible
// derrière "Voir détail", jamais retiré. Même données/onUpdate qu'avant.
function ChannelRow({ ch, editable, onUpdate }) {
  const [open, setOpen] = useState(false)
  const hasDetail = Boolean(ch.currentStep || ch.remainingWork)
  return (
    <div className="border border-orias-border rounded-xl px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="font-bold text-gray-800 text-sm flex-shrink-0 w-full sm:w-40">{ch.label}</p>
        {editable ? (
          <select
            value={ch.status}
            onChange={e => onUpdate(ch.id, statusToPatch(e.target.value, ch.progressPct))}
            className={`text-xs font-bold px-2 py-1 rounded-full border cursor-pointer flex-shrink-0 ${CHANNEL_STATUS_STYLE[ch.status]}`}
          >
            {CHANNEL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${CHANNEL_STATUS_STYLE[ch.status]}`}>{ch.status}</span>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-[100px]">
          <div className="h-1.5 flex-1 rounded-full bg-orias-bg overflow-hidden">
            <div className="h-full bg-orias-gold" style={{ width: `${ch.progressPct}%` }} />
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0">{ch.progressPct}%</span>
        </div>
        <span className="text-[11px] text-gray-400 flex-shrink-0 hidden md:inline">{ch.updatedAt ? `MAJ ${ch.updatedAt}` : 'Pas encore mis à jour'}</span>
        {(editable || hasDetail) && (
          <button type="button" onClick={() => setOpen(o => !o)} className="text-xs font-semibold text-orias-green hover:underline flex-shrink-0 ml-auto sm:ml-0">
            {open ? 'Masquer' : 'Voir détail'}
          </button>
        )}
      </div>
      <span className="text-[11px] text-gray-400 md:hidden block mt-1">{ch.updatedAt ? `Mis à jour le ${ch.updatedAt}` : 'Pas encore mis à jour'}</span>
      {open && (
        <div className="mt-3 pt-3 border-t border-orias-border">
          {editable ? (
            <div className="space-y-2">
              <input
                type="range" min="0" max="100" value={ch.progressPct}
                onChange={e => onUpdate(ch.id, { progressPct: Number(e.target.value) })}
                className="w-full"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={ch.currentStep || ''}
                  onChange={e => onUpdate(ch.id, { currentStep: e.target.value })}
                  placeholder="Étape actuelle"
                  className="input-field text-xs"
                />
                <input
                  value={ch.remainingWork || ''}
                  onChange={e => onUpdate(ch.id, { remainingWork: e.target.value })}
                  placeholder="Reste à faire"
                  className="input-field text-xs"
                />
              </div>
            </div>
          ) : (
            <>
              {ch.currentStep && <p className="text-xs text-gray-600"><span className="font-semibold">Étape actuelle :</span> {ch.currentStep}</p>}
              {ch.remainingWork && <p className="text-xs text-gray-600 mt-1"><span className="font-semibold">Reste à faire :</span> {ch.remainingWork}</p>}
              {!hasDetail && <p className="text-xs text-gray-400">Aucun détail renseigné pour l'instant.</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ChannelsCard({ channels, editable = false, onUpdate }) {
  return (
    <section className="card p-6">
      <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-1">Production par canal</h3>
      <p className="text-xs text-gray-400 mb-4">Site web, Instagram, Facebook, Meta Business Manager / Ads Manager — chacun avance séparément.</p>
      <div className="space-y-2">
        {channels.map(ch => <ChannelRow key={ch.id} ch={ch} editable={editable} onUpdate={onUpdate} />)}
      </div>
    </section>
  )
}

function BrandIntakeForm({ clientName, onSubmit }) {
  const [form, setForm] = useState({
    brandName: '',
    activity: '',
    audience: '',
    offer: '',
    values: '',
    tone: '',
    colors: ['#1a3d2b', '#c9a84c', '#ffffff'],
    logoStatus: 'À créer',
    logoInfo: '',
    websiteGoal: '',
    instagramStatus: 'À créer',
    instagram: '',
    facebookStatus: 'À créer',
    facebook: '',
    metaBusinessStatus: 'À créer',
    metaBusiness: '',
    notes: '',
  })
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const updateColor = (index, value) => setForm(prev => ({ ...prev, colors: prev.colors.map((c, i) => i === index ? value : c) }))
  const canSubmit = form.brandName.trim() && form.activity.trim() && form.websiteGoal.trim()
  const assetOptions = ['À créer', 'Existe déjà', 'À améliorer']

  return (
    <section className="card p-6">
      <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Étape 1 — Brand kit & informations de marque</p>
      <h3 className="text-xl font-bold text-orias-green mb-2">Avant Mon site & communication, envoyez les bases de votre marque</h3>
      <p className="text-sm text-gray-500 mb-5">Ces informations lancent le brand kit, puis le site web, Instagram, Facebook, Meta Business Manager / Ads Manager et les livrables de communication.</p>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (canSubmit) onSubmit(form) }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Nom de marque / cabinet *</span>
            <input className="input-field text-sm" value={form.brandName} onChange={e => update('brandName', e.target.value)} placeholder={clientName || 'Nom du cabinet'} required />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Activité principale *</span>
            <input className="input-field text-sm" value={form.activity} onChange={e => update('activity', e.target.value)} placeholder="Courtier assurance, mutuelle, prévoyance..." required />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Clientèle cible</span>
            <input className="input-field text-sm" value={form.audience} onChange={e => update('audience', e.target.value)} placeholder="Particuliers, indépendants, TPE..." />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Offres à mettre en avant</span>
            <input className="input-field text-sm" value={form.offer} onChange={e => update('offer', e.target.value)} placeholder="Santé, auto, habitation, pro..." />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Ton souhaité</span>
            <select className="input-field text-sm" value={form.tone} onChange={e => update('tone', e.target.value)}>
              <option value="">Sélectionner</option>
              <option>Professionnel et rassurant</option>
              <option>Premium et institutionnel</option>
              <option>Simple et accessible</option>
              <option>Dynamique et commercial</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Logo</span>
            <select className="input-field text-sm" value={form.logoStatus} onChange={e => update('logoStatus', e.target.value)}>
              {assetOptions.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </label>
          {form.logoStatus !== 'À créer' && (
            <label className="block md:col-span-2">
              <span className="block text-xs font-semibold text-gray-500 mb-1">Lien ou infos du logo existant</span>
              <input className="input-field text-sm" value={form.logoInfo} onChange={e => update('logoInfo', e.target.value)} placeholder="Lien Drive, site actuel, fichier à envoyer, remarques..." />
            </label>
          )}
          <div className="md:col-span-2">
            <span className="block text-xs font-semibold text-gray-500 mb-2">Couleurs souhaitées</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {form.colors.map((color, index) => (
                <label key={index} className="flex items-center gap-3 rounded-xl border border-orias-border bg-orias-bg/40 px-3 py-2">
                  <input type="color" value={color} onChange={e => updateColor(index, e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-orias-border bg-white p-1" />
                  <span className="text-xs font-semibold text-gray-600">Couleur {index + 1}</span>
                  <span className="ml-auto text-xs text-gray-400">{color}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="block md:col-span-2">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Valeurs, inspirations</span>
            <input className="input-field text-sm" value={form.values} onChange={e => update('values', e.target.value)} placeholder="Valeurs, sites ou marques de référence..." />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <span className="block text-xs font-semibold text-gray-500 mb-1">Objectif du site web *</span>
            <textarea className="input-field text-sm resize-none" rows={3} value={form.websiteGoal} onChange={e => update('websiteGoal', e.target.value)} placeholder="Ex : présenter le cabinet, capter des demandes de devis, prise de RDV..." required />
          </label>
          <div className="space-y-2">
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-1">Instagram</span>
              <select className="input-field text-sm" value={form.instagramStatus} onChange={e => update('instagramStatus', e.target.value)}>
                <option>À créer</option>
                <option>Existe déjà</option>
                <option>À récupérer / améliorer</option>
              </select>
            </label>
            {form.instagramStatus !== 'À créer' && <input className="input-field text-sm" value={form.instagram} onChange={e => update('instagram', e.target.value)} placeholder="@compte, lien, identifiant ou infos d'accès" />}
          </div>
          <div className="space-y-2">
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-1">Facebook</span>
              <select className="input-field text-sm" value={form.facebookStatus} onChange={e => update('facebookStatus', e.target.value)}>
                <option>À créer</option>
                <option>Existe déjà</option>
                <option>À récupérer / améliorer</option>
              </select>
            </label>
            {form.facebookStatus !== 'À créer' && <input className="input-field text-sm" value={form.facebook} onChange={e => update('facebook', e.target.value)} placeholder="Lien page Facebook, nom de page ou infos d'accès" />}
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-1">Meta Business Manager / Ads Manager</span>
              <select className="input-field text-sm" value={form.metaBusinessStatus} onChange={e => update('metaBusinessStatus', e.target.value)}>
                <option>À créer</option>
                <option>Existe déjà</option>
                <option>À configurer / relier</option>
              </select>
            </label>
            {form.metaBusinessStatus !== 'À créer' && <input className="input-field text-sm" value={form.metaBusiness} onChange={e => update('metaBusiness', e.target.value)} placeholder="Business ID, email admin, lien Business Manager ou infos utiles" />}
          </div>
        </div>
        <label className="block">
          <span className="block text-xs font-semibold text-gray-500 mb-1">Notes complémentaires</span>
          <textarea className="input-field text-sm resize-none" rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Contraintes, délais, exemples, informations légales..." />
        </label>
        <button type="submit" disabled={!canSubmit} className="btn-gold text-sm disabled:opacity-50">Envoyer mes informations de marque</button>
      </form>
    </section>
  )
}

// Correctif simplification UX (2026-09-30) : le brief complet ne doit plus
// occuper toute la première vue — repliable par défaut derrière "Voir les
// informations transmises". Mêmes champs qu'avant (audience/offres/tone/
// logo/site/Instagram/Facebook/Meta Ads/couleurs/notes), rien retiré,
// uniquement masqué tant que le client ne l'a pas demandé.
function BrandSummaryCard({ intake }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="card p-6 border-orias-gold/40">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Brand kit reçu ✓</p>
          <h3 className="text-lg font-bold text-orias-green">{intake.brandName}</h3>
        </div>
        <button type="button" onClick={() => setOpen(o => !o)} className="btn-outline-green text-xs flex-shrink-0">
          {open ? 'Masquer les informations' : 'Voir les informations transmises'}
        </button>
      </div>
      {open && (
        <>
          {/* Correctif "résumé client incomplet" (audit inspection navigateur,
              2026-09-24) : audience/offres/valeurs/notes étaient bien envoyées
              et sauvegardées (submitBrandIntake), mais jamais réaffichées ici —
              le client ne pouvait donc pas relire ce qu'il avait réellement
              transmis. Ajoutés sans rien retirer des champs déjà présents. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
            <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Activité</p><p className="font-semibold text-gray-800">{intake.activity || 'Non renseigné'}</p></div>
            <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Clientèle cible</p><p className="font-semibold text-gray-800">{intake.audience || 'Non renseigné'}</p></div>
            <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Offres à mettre en avant</p><p className="font-semibold text-gray-800">{intake.offer || 'Non renseigné'}</p></div>
            <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Ton</p><p className="font-semibold text-gray-800">{intake.tone || 'Non renseigné'}</p></div>
            <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Valeurs / inspirations</p><p className="font-semibold text-gray-800">{intake.values || 'Non renseigné'}</p></div>
            <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Logo</p><p className="font-semibold text-gray-800">{intake.logoStatus}{intake.logoInfo ? ` — ${intake.logoInfo}` : ''}</p></div>
            <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Site web</p><p className="font-semibold text-gray-800">{intake.websiteGoal || 'Non renseigné'}</p></div>
            <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Instagram</p><p className="font-semibold text-gray-800">{intake.instagramStatus || 'À créer'}{intake.instagram ? ` — ${intake.instagram}` : ''}</p></div>
            <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Facebook</p><p className="font-semibold text-gray-800">{intake.facebookStatus || 'À créer'}{intake.facebook ? ` — ${intake.facebook}` : ''}</p></div>
            <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Meta Ads</p><p className="font-semibold text-gray-800">{intake.metaBusinessStatus || 'À créer'}{intake.metaBusiness ? ` — ${intake.metaBusiness}` : ''}</p></div>
          </div>
          {intake.notes && (
            <div className="mt-4">
              <p className="text-[11px] text-gray-400 font-semibold uppercase">Notes complémentaires</p>
              <p className="text-sm font-semibold text-gray-800 whitespace-pre-wrap mt-1">{intake.notes}</p>
            </div>
          )}
          {Array.isArray(intake.colors) && intake.colors.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {intake.colors.map((color, index) => <span key={`${color}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-orias-border px-3 py-1 text-xs font-semibold text-gray-600"><i className="h-4 w-4 rounded-full border border-gray-200" style={{ background: color }} />{color}</span>)}
            </div>
          )}
          <p className="text-[11px] text-gray-400 mt-4">Envoyé le {intake.submittedAt}</p>
        </>
      )}
    </section>
  )
}

// Génère un fichier texte lisible (nom/email client + date d'envoi + tout
// le brief) que l'équipe peut ouvrir directement — aucun accès réseau,
// aucune dépendance Supabase, uniquement un Blob local téléchargé par le
// navigateur (feedback : "l'admin doit pouvoir télécharger/exporter le
// brief brand kit").
function buildBrandIntakeText(intake, clientName, clientEmail) {
  return [
    'ORIAFEN — BRIEF BRAND KIT CLIENT',
    '================================',
    '',
    `Client : ${clientName || intake.brandName || 'Non renseigné'}`,
    `Email : ${clientEmail || 'Non renseigné'}`,
    `Envoyé le : ${intake.submittedAt || 'Non renseigné'}`,
    '',
    `Marque / cabinet : ${intake.brandName || 'Non renseigné'}`,
    `Activité : ${intake.activity || 'Non renseigné'}`,
    `Clientèle cible : ${intake.audience || 'Non renseigné'}`,
    `Offres à mettre en avant : ${intake.offer || 'Non renseigné'}`,
    `Ton / style souhaité : ${intake.tone || 'Non renseigné'}`,
    `Valeurs / inspirations : ${intake.values || 'Non renseigné'}`,
    '',
    `Logo : ${intake.logoStatus || 'À créer'}${intake.logoInfo ? ` — ${intake.logoInfo}` : ''}`,
    `Couleurs choisies : ${(Array.isArray(intake.colors) ? intake.colors : []).join(', ') || 'Non renseigné'}`,
    `Objectif du site web : ${intake.websiteGoal || 'Non renseigné'}`,
    '',
    `Instagram : ${intake.instagramStatus || 'À créer'}${intake.instagram ? ` — ${intake.instagram}` : ''}`,
    `Facebook : ${intake.facebookStatus || 'À créer'}${intake.facebook ? ` — ${intake.facebook}` : ''}`,
    `Meta Business Manager / Ads Manager : ${intake.metaBusinessStatus || 'À créer'}${intake.metaBusiness ? ` — ${intake.metaBusiness}` : ''}`,
    '',
    'Notes complémentaires :',
    intake.notes || 'Non renseigné',
  ].join('\n')
}

function downloadBrandIntake(intake, clientName, clientEmail) {
  const text = buildBrandIntakeText(intake, clientName, clientEmail)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const safeName = (clientName || intake.brandName || 'client').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  const a = document.createElement('a')
  a.href = url
  a.download = `brief-brand-kit-${safeName}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function AdminBrandIntakeCard({ intake, clientName = null, clientEmail = null }) {
  if (!intake) {
    return (
      <section className="card p-6 border-dashed border-orias-border">
        <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Brief client</p>
        <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-2">Informations de marque non reçues</h3>
        <p className="text-sm text-gray-400">Le client n'a pas encore envoyé son brand kit / brief projet.</p>
      </section>
    )
  }
  const rows = [
    ['Marque / cabinet', intake.brandName],
    ['Activité', intake.activity],
    ['Clientèle cible', intake.audience],
    ['Offres', intake.offer],
    ['Ton', intake.tone],
    ['Logo', `${intake.logoStatus || 'À créer'}${intake.logoInfo ? ` — ${intake.logoInfo}` : ''}`],
    ['Objectif site', intake.websiteGoal],
    ['Instagram', `${intake.instagramStatus || 'À créer'}${intake.instagram ? ` — ${intake.instagram}` : ''}`],
    ['Facebook', `${intake.facebookStatus || 'À créer'}${intake.facebook ? ` — ${intake.facebook}` : ''}`],
    ['Meta Business / Ads', `${intake.metaBusinessStatus || 'À créer'}${intake.metaBusiness ? ` — ${intake.metaBusiness}` : ''}`],
    ['Valeurs / inspirations', intake.values],
    ['Notes', intake.notes],
  ]
  // Correctif simplification UX (2026-09-30) : le détail complet du brief
  // (12 champs) était toujours affiché, dominant toute la vue admin — replié
  // par défaut derrière "Voir le brief complet", le bouton de téléchargement
  // reste lui toujours visible (jamais masqué par le repli).
  return (
    <AdminBrandIntakeCardBody intake={intake} rows={rows} clientName={clientName} clientEmail={clientEmail} />
  )
}

function AdminBrandIntakeCardBody({ intake, rows, clientName, clientEmail }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <div>
          <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Brief client reçu ✓</p>
          <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide">{intake.brandName}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Ce sont les informations transmises par le client — toujours la première étape du projet.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" className="btn-outline-green text-xs" onClick={() => setOpen(o => !o)}>{open ? 'Masquer le brief' : 'Voir le brief complet'}</button>
          <button type="button" className="btn-outline-green text-xs" onClick={() => downloadBrandIntake(intake, clientName, clientEmail)}>⬇ Télécharger le brief brand kit</button>
        </div>
      </div>
      {open && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-4">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-orias-border bg-orias-bg/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                <p className="mt-1 font-semibold text-gray-800 whitespace-pre-wrap">{value || 'Non renseigné'}</p>
              </div>
            ))}
          </div>
          {Array.isArray(intake.colors) && intake.colors.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {intake.colors.map((color, index) => <span key={`${color}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-orias-border px-3 py-1 text-xs font-semibold text-gray-600"><i className="h-4 w-4 rounded-full border border-gray-200" style={{ background: color }} />Couleur {index + 1}: {color}</span>)}
            </div>
          )}
          <p className="text-[11px] text-gray-400 mt-4">Envoyé le {intake.submittedAt}</p>
        </>
      )}
    </section>
  )
}

const STATUS_STYLE = {
  'Envoyée': 'bg-blue-50 text-blue-700 border-blue-200',
  'En cours': 'bg-amber-50 text-amber-700 border-amber-200',
  'Traitée': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Refusée': 'bg-red-50 text-red-600 border-red-200',
}

function StatusBadge({ status }) {
  return <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] || STATUS_STYLE['Envoyée']}`}>{status}</span>
}

// Correctif simplification UX (2026-09-30) : ProjectOverviewCard (grosse
// carte "Aperçu du projet" avec 6 champs + barre de progression pleine
// largeur) est remplacée par MarketingSummaryCard (résumé + stepper) en
// haut de ClientMarketingPanel — mêmes données (project.*), présentation
// condensée. La précision "ce pourcentage ne mesure que le brief" reste
// nécessaire : reprise dans MarketingSummaryCard via le stepper lui-même
// (chaque étape a son propre état, jamais un pourcentage unique ambigu).

// Correctif "livrables non séparés par type" (audit inspection navigateur,
// 2026-09-26) : regroupe désormais les livrables par type
// (DELIVERABLE_TYPES, marketingStore.js) au lieu d'une liste plate unique —
// admin peut voir chaque type séparément, et publier un nouveau livrable
// (editable=true) via addDeliverable().
function DeliverablesCard({ deliverables, editable = false, onAdd }) {
  const [form, setForm] = useState({ type: 'posts', name: '', url: '' })
  const grouped = Object.keys(DELIVERABLE_TYPES).map(type => ({
    type,
    label: DELIVERABLE_TYPES[type],
    items: deliverables.filter(d => (d.type || 'other') === type),
  })).filter(g => g.items.length > 0 || editable)

  // Correctif simplification UX (2026-09-30) : côté client sans livrable,
  // un état vide simple et court remplace 5 sous-sections vides répétées
  // ("Aucun livrable de ce type...") — jamais affiché côté admin (editable),
  // qui a besoin de voir chaque type pour en publier un.
  if (!deliverables.length && !editable) {
    return (
      <section className="card p-6">
        <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-2">Livrables</h3>
        <p className="text-sm text-gray-400">Aucun livrable disponible pour le moment.</p>
        <p className="text-xs text-gray-400 mt-1">Vous les verrez ici dès qu'ils seront prêts.</p>
      </section>
    )
  }

  return (
    <section className="card p-6">
      <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-4">Livrables</h3>
      <div className="space-y-4">
        {grouped.map(g => (
          <div key={g.type}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-orias-gold mb-2">{g.label} ({g.items.length})</p>
            {!g.items.length && <p className="text-xs text-gray-400 mb-2">Aucun livrable de ce type pour le moment.</p>}
            <div className="space-y-2">
              {g.items.map(d => (
                <div key={d.id} className="flex items-center justify-between gap-3 border border-orias-border rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.version} · {d.updatedAt}</p>
                  </div>
                  {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="btn-outline-green text-xs flex-shrink-0">Ouvrir</a>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {editable && (
        <form className="mt-4 pt-4 border-t border-orias-border flex flex-wrap gap-2 items-end" onSubmit={e => { e.preventDefault(); if (!form.name.trim()) return; onAdd(form); setForm({ type: form.type, name: '', url: '' }) }}>
          <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))} className="input-field text-sm w-auto">
            {Object.entries(DELIVERABLE_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nom du livrable" className="input-field text-sm flex-1 min-w-[160px]" />
          <input value={form.url} onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))} placeholder="Lien (optionnel)" className="input-field text-sm flex-1 min-w-[160px]" />
          <button type="submit" disabled={!form.name.trim()} className="btn-gold text-sm disabled:opacity-50">＋ Publier</button>
        </form>
      )}
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
  const [brandIntake, setBrandIntake] = useState(() => getBrandIntake(clientId))
  const [project, setProject] = useState(() => getMarketingProject(clientId))
  const [channels, setChannels] = useState(() => getMarketingChannels(clientId))
  const [deliverables, setDeliverables] = useState(() => getDeliverables(clientId))
  const [requests, setRequests] = useState(() => getModificationRequests(clientId))
  const [showModal, setShowModal] = useState(false)
  const refresh = () => { setBrandIntake(getBrandIntake(clientId)); setProject(getMarketingProject(clientId)); setChannels(getMarketingChannels(clientId)); setDeliverables(getDeliverables(clientId)); setRequests(getModificationRequests(clientId)) }
  useEffect(() => subscribeToMarketing(refresh), [clientId])

  const { steps, nextStepLabel } = deriveMarketingSteps(brandIntake, channels, deliverables)

  return (
    <div className="space-y-5">
      <MarketingSummaryCard project={project} steps={steps} nextStepLabel={nextStepLabel} />
      {brandIntake
        ? <BrandSummaryCard intake={brandIntake} />
        : <BrandIntakeForm clientName={clientName} onSubmit={form => { submitBrandIntake(clientId, form, clientName); refresh() }} />}
      <ChannelsCard channels={channels} />
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
// statut), garder l'historique.
//
// Correctif "pas de sélecteur de client" (audit inspection navigateur,
// 2026-09-24) : avec plusieurs clients convertis, cette vue n'affichait
// toujours que le dernier converti, sans aucun moyen de choisir un autre
// client ni indication claire de qui était affiché. `clients` (liste
// complète des clients réellement convertis, transmise par
// LocalAdminShell via buildClientsOverview — même source que l'onglet
// "Clients") remplace le clientId unique ; `defaultClientId` (client
// converti le plus récent, même sélection que "Voir l'espace client")
// reste le choix par défaut tant que l'admin n'a rien sélectionné lui-même.
// SANS repli implicite sur le client de démo : tant qu'aucun client réel
// n'est converti, `clients` est vide et cette vue affiche un état vide
// explicite (même garantie que "Voir l'espace client" dans LocalCRM.jsx).
// Correctif "Marketing admin ouvre directement le détail d'un client"
// (2026-10-03) : la première vue doit être une liste des clients, jamais
// le brief/projet complet d'un client précis — même données que la vue
// détail (getBrandIntake/getMarketingProject/getMarketingChannels), lues
// pour chaque client de la liste, aucune nouvelle logique métier.
function MarketingClientListRow({ client, onView }) {
  const brandIntake = getBrandIntake(client.id)
  const project = getMarketingProject(client.id)
  const channels = getMarketingChannels(client.id)
  const channelStatus = id => {
    const ch = channels.find(c => c.id === id)
    return ch ? <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${CHANNEL_STATUS_STYLE[ch.status]}`}>{ch.status}</span> : <span className="text-xs text-gray-300">—</span>
  }
  return (
    <tr className="border-b border-orias-border/50 hover:bg-orias-bg/50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-800">{client.name}</p>
        {client.email && <p className="text-xs text-gray-400">{client.email}</p>}
      </td>
      <td className="px-4 py-3 hidden md:table-cell"><span className="inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold bg-orias-green/10 text-orias-green border border-orias-green/20">{client.pack || '—'}</span></td>
      <td className="px-4 py-3"><span className={`text-xs font-semibold ${brandIntake ? 'text-emerald-700' : 'text-gray-400'}`}>{brandIntake ? 'Reçu' : 'En attente'}</span></td>
      <td className="px-4 py-3 hidden lg:table-cell">{channelStatus('site')}</td>
      <td className="px-4 py-3 hidden lg:table-cell">{channelStatus('instagram')}</td>
      <td className="px-4 py-3 hidden lg:table-cell">{channelStatus('facebook')}</td>
      <td className="px-4 py-3 hidden lg:table-cell">{channelStatus('ads_manager')}</td>
      <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-400">{project.lastUpdate || '—'}</td>
      <td className="px-4 py-3 text-right">
        <button onClick={() => onView(client.id)} className="btn-outline-green text-xs">Voir</button>
      </td>
    </tr>
  )
}

function MarketingClientListView({ clients, onView }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Marketing</p>
        <h1 className="text-xl font-bold text-orias-green">Sélectionnez un client</h1>
        <p className="text-sm text-gray-500 mt-1">{clients.length} client{clients.length > 1 ? 's' : ''} converti{clients.length > 1 ? 's' : ''}. Cliquez sur "Voir" pour ouvrir le brief, les canaux et les demandes de modification d'un client.</p>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orias-border bg-orias-bg">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Pack</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Brief</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Site web</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Instagram</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Facebook</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Meta Ads</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden xl:table-cell">Dernière mise à jour</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => <MarketingClientListRow key={c.id} client={c} onView={onView} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function AdminMarketingPanel({ clients = [], defaultClientId = null }) {
  const [selectedClientId, setSelectedClientId] = useState(null)
  useEffect(() => {
    if (selectedClientId != null && !clients.some(c => c.id === selectedClientId)) setSelectedClientId(null)
  }, [clients])
  const clientId = selectedClientId
  const selectedClient = clients.find(c => c.id === clientId) || null
  const clientName = selectedClient?.name || null
  const clientEmail = selectedClient?.email || null

  const [brandIntake, setBrandIntake] = useState(() => clientId != null ? getBrandIntake(clientId) : null)
  const [project, setProject] = useState(() => clientId != null ? getMarketingProject(clientId) : null)
  const [channels, setChannels] = useState(() => clientId != null ? getMarketingChannels(clientId) : [])
  const [deliverables, setDeliverables] = useState(() => clientId != null ? getDeliverables(clientId) : [])
  const [requests, setRequests] = useState(() => clientId != null ? getModificationRequests(clientId) : [])
  const [phaseDraft, setPhaseDraft] = useState('')
  const refresh = () => {
    if (clientId == null) return
    setBrandIntake(getBrandIntake(clientId)); setProject(getMarketingProject(clientId)); setChannels(getMarketingChannels(clientId)); setDeliverables(getDeliverables(clientId)); setRequests(getModificationRequests(clientId))
  }
  useEffect(refresh, [clientId])
  useEffect(() => subscribeToMarketing(refresh), [clientId])
  useEffect(() => { if (project) setPhaseDraft(project.phase) }, [project?.phase])

  if (!clients.length) {
    return (
      <section className="card p-10 max-w-2xl mx-auto text-center border-dashed border-orias-border">
        <span className="text-[10px] font-bold tracking-wide text-orias-gold uppercase">Marketing</span>
        <h1 className="text-xl font-bold text-orias-green mt-2 mb-2">Aucun client converti pour l'instant</h1>
        <p className="text-sm text-gray-500">Convertissez d'abord un prospect en client (paiement validé) pour voir son brief marketing ici.</p>
      </section>
    )
  }

  // Correctif "Marketing admin ouvre directement le détail" (2026-10-03) :
  // tant qu'aucun client n'a été explicitement choisi via "Voir", on
  // affiche la liste — jamais un client présélectionné automatiquement.
  if (clientId == null || !project) {
    return <MarketingClientListView clients={clients} onView={setSelectedClientId} />
  }

  const { nextStepLabel } = deriveMarketingSteps(brandIntake, channels, deliverables)

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => setSelectedClientId(null)} className="text-sm font-semibold text-orias-green hover:underline flex items-center gap-1">← Retour à la liste</button>
      {/* Correctif simplification UX (2026-09-30) : résumé opérationnel
          unique (client/pack/brief/prochaine action équipe/dernière mise à
          jour + édition de la phase) — remplace 2 cartes séparées
          ("Client affiché" + "Étape 1 — Informations de marque"), mêmes
          données/actions (updateMarketingProject inchangé). */}
      <section className="card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-orias-gold mb-0.5">Client affiché</p>
            <p className="font-bold text-gray-800 truncate">{clientName}{clientEmail ? <span className="text-gray-400 font-normal"> · {clientEmail}</span> : ''}</p>
            {selectedClient?.pack && <p className="text-xs text-gray-400 mt-0.5">{selectedClient.pack}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm border-t border-orias-border mt-4 pt-4">
          <div><p className="text-[10px] text-gray-400 font-semibold uppercase">Brief</p><p className="font-bold text-gray-800 mt-0.5">{brandIntake ? 'Reçu' : 'En attente'}</p></div>
          <div><p className="text-[10px] text-gray-400 font-semibold uppercase">Prochaine action équipe</p><p className="font-bold text-orias-green mt-0.5">{nextStepLabel}</p></div>
          <div><p className="text-[10px] text-gray-400 font-semibold uppercase">Dernière mise à jour</p><p className="font-bold text-gray-800 mt-0.5">{project.lastUpdate || 'Non renseigné'}</p></div>
          <div>
            <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Phase</label>
            <div className="flex gap-1">
              <input value={phaseDraft} onChange={e => setPhaseDraft(e.target.value)} className="input-field text-xs" />
              <button className="btn-outline-green text-xs flex-shrink-0" disabled={phaseDraft === project.phase} onClick={() => { updateMarketingProject(clientId, { phase: phaseDraft }); refresh() }}>OK</button>
            </div>
          </div>
        </div>
      </section>
      <AdminBrandIntakeCard intake={brandIntake} clientName={clientName} clientEmail={clientEmail} />
      <ChannelsCard channels={channels} editable onUpdate={(channelId, patch) => { updateMarketingChannel(clientId, channelId, patch); refresh() }} />
      {/* Correctif "masquer Livrables côté admin uniquement" (2026-10-02) :
          section retirée de l'UI admin sur demande — logique/store/données
          intacts (état deliverables, getDeliverables, addDeliverable,
          composant DeliverablesCard, DELIVERABLE_TYPES tous inchangés). Le
          client continue de voir ses livrables normalement dans
          ClientMarketingPanel plus bas dans ce fichier, non modifié. */}
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
