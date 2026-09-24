import React, { useState, useEffect } from 'react'
import {
  getMarketingProject, getDeliverables, getModificationRequests,
  createModificationRequest, setModificationStatus, updateMarketingProject,
  subscribeToMarketing, MODIFICATION_STATUSES,
  getMarketingChannels, updateMarketingChannel, CHANNEL_STATUSES,
  getBrandIntake, submitBrandIntake,
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

function ChannelsCard({ channels, editable = false, onUpdate }) {
  return (
    <section className="card p-6">
      <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-1">Étape 2 — Production par canal</h3>
      <p className="text-xs text-gray-400 mb-4">Chaque partie avance séparément : Site web, Instagram, Facebook, Meta Business Manager / Ads Manager.</p>
      <div className="space-y-4">
        {channels.map(ch => (
          <div key={ch.id} className="border border-orias-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
              <p className="font-bold text-gray-800 text-sm">{ch.label}</p>
              {editable ? (
                <select
                  value={ch.status}
                  onChange={e => onUpdate(ch.id, statusToPatch(e.target.value, ch.progressPct))}
                  className={`text-xs font-bold px-2 py-1 rounded-full border cursor-pointer ${CHANNEL_STATUS_STYLE[ch.status]}`}
                >
                  {CHANNEL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full border ${CHANNEL_STATUS_STYLE[ch.status]}`}>{ch.status}</span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-orias-bg overflow-hidden mb-2">
              <div className="h-full bg-orias-gold" style={{ width: `${ch.progressPct}%` }} />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-gray-500 mb-2">
              <span>{ch.progressPct}%</span>
              {editable && (
                <input
                  type="range" min="0" max="100" value={ch.progressPct}
                  onChange={e => onUpdate(ch.id, { progressPct: Number(e.target.value) })}
                  className="flex-1 mx-2"
                />
              )}
            </div>
            {editable ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
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
            ) : (
              <>
                {ch.currentStep && <p className="text-xs text-gray-600 mt-1"><span className="font-semibold">Étape actuelle :</span> {ch.currentStep}</p>}
                {ch.remainingWork && <p className="text-xs text-gray-600 mt-1"><span className="font-semibold">Reste à faire :</span> {ch.remainingWork}</p>}
              </>
            )}
            {ch.updatedAt && <p className="text-[11px] text-gray-400 mt-2">Mis à jour le {ch.updatedAt}</p>}
          </div>
        ))}
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

function BrandSummaryCard({ intake }) {
  return (
    <section className="card p-6 border-orias-gold/40">
      <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Étape 1 — Brand kit reçu</p>
      <h3 className="text-lg font-bold text-orias-green mb-4">{intake.brandName}</h3>
      {/* Correctif "résumé client incomplet" (audit inspection navigateur,
          2026-09-24) : audience/offres/valeurs/notes étaient bien envoyées
          et sauvegardées (submitBrandIntake), mais jamais réaffichées ici —
          le client ne pouvait donc pas relire ce qu'il avait réellement
          transmis. Ajoutés sans rien retirer des champs déjà présents. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Brief client reçu</p>
          <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide">Demandes client pour brand kit, site, réseaux et ads</h3>
        </div>
        <button type="button" className="btn-outline-green text-sm flex-shrink-0" onClick={() => downloadBrandIntake(intake, clientName, clientEmail)}>⬇ Télécharger le brief brand kit</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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

function ProjectOverviewCard({ project }) {
  return (
    <section className="card p-6">
      <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Étape 1 — Informations de marque</p>
      <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-4">Aperçu du projet — basé sur les informations transmises par le client</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Projet</p><p className="font-bold text-gray-800 mt-0.5">{project.name}</p></div>
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Type</p><p className="font-bold text-gray-800 mt-0.5">{project.type}</p></div>
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Statut</p><p className="font-bold text-orias-green mt-0.5">{project.status}</p></div>
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Phase actuelle</p><p className="font-bold text-gray-800 mt-0.5">{project.phase}</p></div>
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Dernière mise à jour</p><p className="font-bold text-gray-800 mt-0.5">{project.lastUpdate}</p></div>
        <div><p className="text-[11px] text-gray-400 font-semibold uppercase">Progression du brief</p><p className="font-bold text-gray-800 mt-0.5">{project.progressPct}%</p></div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-orias-bg overflow-hidden">
        <div className="h-full bg-orias-gold" style={{ width: `${project.progressPct}%` }} />
      </div>
      {/* Correctif "progression globale incohérente avec les canaux" (audit
          inspection navigateur, 2026-09-24) : ce pourcentage ne mesure QUE
          la réception/l'avancement du brief (Étape 1), jamais une moyenne
          des canaux ci-dessous (Site web/Instagram/Facebook/Meta Business
          Manager, chacun avec sa propre progression indépendante) — précisé
          explicitement pour ne pas laisser croire à un résumé global. */}
      <p className="text-[11px] text-gray-400 mt-2">Ce pourcentage mesure uniquement l'avancement du brief (Étape 1) — la progression de chaque canal (Site web, Instagram, Facebook, Meta Business Manager) est suivie séparément ci-dessous.</p>
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
  const [brandIntake, setBrandIntake] = useState(() => getBrandIntake(clientId))
  const [project, setProject] = useState(() => getMarketingProject(clientId))
  const [channels, setChannels] = useState(() => getMarketingChannels(clientId))
  const [deliverables, setDeliverables] = useState(() => getDeliverables(clientId))
  const [requests, setRequests] = useState(() => getModificationRequests(clientId))
  const [showModal, setShowModal] = useState(false)
  const refresh = () => { setBrandIntake(getBrandIntake(clientId)); setProject(getMarketingProject(clientId)); setChannels(getMarketingChannels(clientId)); setDeliverables(getDeliverables(clientId)); setRequests(getModificationRequests(clientId)) }
  useEffect(() => subscribeToMarketing(refresh), [clientId])

  return (
    <div className="space-y-5">
      {brandIntake
        ? <BrandSummaryCard intake={brandIntake} />
        : <BrandIntakeForm clientName={clientName} onSubmit={form => { submitBrandIntake(clientId, form, clientName); refresh() }} />}
      <ProjectOverviewCard project={project} />
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
export function AdminMarketingPanel({ clients = [], defaultClientId = null }) {
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId)
  useEffect(() => {
    if (selectedClientId == null || !clients.some(c => c.id === selectedClientId)) setSelectedClientId(defaultClientId)
  }, [defaultClientId, clients])
  const clientId = selectedClientId
  const selectedClient = clients.find(c => c.id === clientId) || null
  const clientName = selectedClient?.name || null
  const clientEmail = selectedClient?.email || null

  const [brandIntake, setBrandIntake] = useState(() => clientId != null ? getBrandIntake(clientId) : null)
  const [project, setProject] = useState(() => clientId != null ? getMarketingProject(clientId) : null)
  const [channels, setChannels] = useState(() => clientId != null ? getMarketingChannels(clientId) : [])
  const [requests, setRequests] = useState(() => clientId != null ? getModificationRequests(clientId) : [])
  const [phaseDraft, setPhaseDraft] = useState('')
  const refresh = () => {
    if (clientId == null) return
    setBrandIntake(getBrandIntake(clientId)); setProject(getMarketingProject(clientId)); setChannels(getMarketingChannels(clientId)); setRequests(getModificationRequests(clientId))
  }
  useEffect(refresh, [clientId])
  useEffect(() => subscribeToMarketing(refresh), [clientId])
  useEffect(() => { if (project) setPhaseDraft(project.phase) }, [project?.phase])

  if (!clients.length || clientId == null) {
    return (
      <section className="card p-10 max-w-2xl mx-auto text-center border-dashed border-orias-border">
        <span className="text-[10px] font-bold tracking-wide text-orias-gold uppercase">Marketing</span>
        <h1 className="text-xl font-bold text-orias-green mt-2 mb-2">Aucun client converti pour l'instant</h1>
        <p className="text-sm text-gray-500">Convertissez d'abord un prospect en client (paiement validé) pour voir son brief marketing ici.</p>
      </section>
    )
  }

  return (
    <div className="space-y-5">
      <section className="card p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-orias-gold mb-0.5">Client affiché</p>
          <p className="font-bold text-gray-800 truncate">{clientName}{clientEmail ? <span className="text-gray-400 font-normal"> · {clientEmail}</span> : ''}</p>
        </div>
        {clients.length > 1 && (
          <select value={clientId} onChange={e => setSelectedClientId(Number(e.target.value))} className="input-field text-sm w-auto flex-shrink-0">
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </section>
      <AdminBrandIntakeCard intake={brandIntake} clientName={clientName} clientEmail={clientEmail} />
      <section className="card p-6">
        <p className="text-[11px] font-semibold text-orias-gold uppercase tracking-wide mb-1">Étape 1 — Informations de marque</p>
        <h3 className="text-sm font-bold text-orias-green uppercase tracking-wide mb-4">Projet client — basé sur les informations transmises par le client</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Phase actuelle</label>
            <input value={phaseDraft} onChange={e => setPhaseDraft(e.target.value)} className="input-field text-sm" />
          </div>
          <button className="btn-gold text-sm" disabled={phaseDraft === project.phase} onClick={() => { updateMarketingProject(clientId, { phase: phaseDraft }); refresh() }}>Mettre à jour la phase</button>
        </div>
        <p className="text-[11px] text-gray-400 mt-3">Statut : {project.status} · Dernière mise à jour : {project.lastUpdate}</p>
      </section>
      <ChannelsCard channels={channels} editable onUpdate={(channelId, patch) => { updateMarketingChannel(clientId, channelId, patch); refresh() }} />
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
