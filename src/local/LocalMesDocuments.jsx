import React, { useState, useEffect, useRef } from 'react'
import { REQUIRED_DOCUMENTS } from '../data/mockData'
import { getClientDocuments, subscribeToDocuments, uploadDocument, getDocVersions } from './documentsStore'
import { ASSOCIATE_AUTRE_PREFIX, listAssociateDocCategories, countAssociateDocsSent } from './associateDocuments'
import { CheckCircleIcon, ClockIcon, XCircleIcon, UploadIcon } from '../components/Icons'

// Reprend le style de src/pages/student/MesDocuments.jsx (fichier live non
// modifié, uniquement dupliqué ici) : mêmes couleurs de statut, même
// disposition de ligne. Ajouts : motif de rejet déjà présent côté live —
// on ajoute rejectedAt/rejectedBy, bouton "Remplacer le document" explicite,
// et un historique de versions simple.

const STATUS_CONFIG = {
  valid: { label: 'Validé', bg: '#d1fae5', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  pending: { label: 'En attente', bg: '#fef3c7', color: '#d97706', border: 'rgba(245,158,11,0.3)' },
  missing: { label: 'Refusé', bg: '#fee2e2', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  correction: { label: 'Correction demandée', bg: '#ffedd5', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  none: { label: 'Manquant', bg: '#f3f4f6', color: '#6b7280', border: 'rgba(148,163,184,0.2)' },
}

// optional : true pour une catégorie facultative (documents associé) — un
// statut 'none' n'y est jamais présenté comme un manque ("Manquant" ->
// "Non requis"), conformément à la règle "aucun avertissement de document
// manquant" pour cette section. Ne change rien pour les documents requis du
// client principal (optional=false par défaut).
function DocRow({ required, doc, uploading, onUpload, optional = false }) {
  const inputRef = useRef(null)
  const status = doc?.status ?? 'none'
  const sc = status === 'none' && optional ? { ...STATUS_CONFIG.none, label: 'Non requis' } : (STATUS_CONFIG[status] ?? STATUS_CONFIG.none)
  const rejected = status === 'missing' || status === 'correction'
  const btnLabel = rejected ? 'Remplacer le document' : status === 'none' ? 'Envoyer' : 'Remplacer'

  const rowBg = { valid: '#f0fdf4', pending: '#fffbeb', missing: '#fef2f2', correction: '#fff7ed', none: '#ffffff' }[status] ?? '#ffffff'
  const rowBorder = { valid: 'rgba(16,185,129,0.25)', pending: 'rgba(245,158,11,0.25)', missing: 'rgba(239,68,68,0.25)', correction: 'rgba(249,115,22,0.25)', none: '#e8e2d6' }[status] ?? '#e8e2d6'

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (file) { onUpload(required.id, required.label, file); e.target.value = '' }
  }

  return (
    <div style={{ background: rowBg, border: `1px solid ${rowBorder}`, borderRadius: '14px', padding: '14px 16px', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: status === 'valid' ? '#d1fae5' : status === 'pending' ? '#fef3c7' : status === 'missing' ? '#fee2e2' : '#f3f4f6' }}>
          {status === 'valid' ? <CheckCircleIcon className="w-4 h-4" style={{ color: '#10b981' }} />
            : status === 'pending' ? <ClockIcon className="w-4 h-4" style={{ color: '#f59e0b' }} />
            : status === 'missing' ? <XCircleIcon className="w-4 h-4" style={{ color: '#ef4444' }} />
            : <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '700' }}>?</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: '600', color: '#1a3d2b', fontSize: '13px', fontFamily: "'Montserrat', sans-serif" }}>{required.label}</p>
          <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontFamily: "'Montserrat', sans-serif", marginTop: '2px' }}>{required.sublabel}</p>
          {doc?.fileName && <p style={{ margin: 0, fontSize: '11px', color: '#c49a2a', marginTop: '3px', fontFamily: "'Montserrat', sans-serif" }}>📎 {doc.fileName}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap', fontFamily: "'Montserrat', sans-serif" }}>
            {status === 'valid' ? '✓ ' : status === 'pending' ? '⏳ ' : status === 'missing' ? '✕ ' : status === 'correction' ? '💬 ' : '— '}{sc.label}
          </span>
          {status !== 'valid' && (
            <>
              <input ref={inputRef} type="file" accept={required.accept} style={{ display: 'none' }} onChange={handleFileChange} />
              <button onClick={() => inputRef.current?.click()} disabled={uploading}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', border: 'none',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  background: uploading ? '#f3f4f6' : rejected ? 'linear-gradient(135deg, #c9a84c, #b8960a)' : 'linear-gradient(135deg, #1a4a2e, #2d6b45)',
                  color: uploading ? '#9ca3af' : '#fff', fontFamily: "'Montserrat', sans-serif",
                  boxShadow: uploading ? 'none' : '0 2px 10px rgba(26,74,46,0.3)', transition: 'all 0.2s' }}>
                <UploadIcon className="w-3.5 h-3.5" />{uploading ? 'Envoi…' : btnLabel}
              </button>
            </>
          )}
        </div>
      </div>

      {rejected && (
        <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontFamily: "'Montserrat', sans-serif",
          background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ margin: 0 }}>✕ Motif du rejet : <strong>{doc.rejectionReason || 'Non précisé'}</strong></p>
          {doc.rejectedAt && <p style={{ margin: '4px 0 0', opacity: 0.85 }}>Refusé le {doc.rejectedAt}{doc.rejectedBy ? ` par ${doc.rejectedBy}` : ''} — merci d'envoyer un nouveau document.</p>}
        </div>
      )}

      {(() => { const allVersions = getDocVersions(doc); return allVersions.length > 1 && (
        <details style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '11px', color: '#9ca3af', fontFamily: "'Montserrat', sans-serif" }}>Historique des versions ({allVersions.length})</summary>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {allVersions.map((v, i) => {
              const vc = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.none
              return (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#6b7280', fontFamily: "'Montserrat', sans-serif" }}>
                  <span style={{ fontWeight: '600', color: '#9ca3af' }}>Version {i + 1}</span>
                  <span>📎 {v.fileName}</span>
                  <span style={{ padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: vc.bg, color: vc.color }}>{vc.label}</span>
                  <span style={{ marginLeft: 'auto', color: '#c1c7cd' }}>{v.rejectedAt ? `Refusé le ${v.rejectedAt}` : `Envoyé le ${v.uploadedAt}`}</span>
                </div>
              )
            })}
          </div>
        </details>
      ) })()}
    </div>
  )
}

// "Autre document" — reprend exactement src/pages/student/MesDocuments.jsx
// (fichier live non modifié, uniquement dupliqué ici) : mêmes styles inline,
// même placeholder/libellé/bouton. Réutilise le même handleUpload() que les
// documents obligatoires (donc le même documentsStore local), avec un id de
// catégorie dynamique 'autre_<timestamp>' pour ne jamais entrer en conflit
// avec les catégories obligatoires de REQUIRED_DOCUMENTS.
// categoryPrefix : préfixe d'id dynamique ('autre_' pour le client principal,
// 'associate_autre_' pour l'associé — voir associateDocuments.js) — garantit
// que les deux ne peuvent jamais générer le même id de catégorie, même par
// coïncidence de timestamp.
function AutreDocRow({ onUpload, uploading, categoryPrefix = 'autre_', title = 'Autre document (facultatif)' }) {
  const inputRef = useRef(null)
  const [label, setLabel] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && label.trim()) {
      onUpload(categoryPrefix + Date.now(), label.trim(), file)
      setLabel('')
      e.target.value = ''
    }
  }

  return (
    // Fond crème + liseré or (identité Oriafen) au lieu du gris pointillé
    // d'origine : ce bloc facultatif se perdait visuellement en bas de la
    // liste. Reste volontairement sobre (pas de rouge/couleur d'alerte) —
    // c'est une option, pas un avertissement.
    <div style={{ background: '#faf7ef', border: '1.5px solid #e3d5ac', borderLeft: '4px solid #c9a84c', borderRadius: '14px', padding: '18px 20px' }}>
      <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#8a6821', fontSize: '13px', fontFamily: "'Montserrat', sans-serif" }}>
        📎 {title}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Nom du document..."
          style={{ flex: 1, minWidth: '160px', padding: '7px 12px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '12px', fontFamily: "'Montserrat', sans-serif", outline: 'none' }}
        />
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
        <button
          onClick={() => label.trim() && inputRef.current?.click()}
          disabled={!label.trim() || uploading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', border: 'none',
            cursor: (!label.trim() || uploading) ? 'not-allowed' : 'pointer',
            background: (!label.trim() || uploading) ? '#f3f4f6' : 'linear-gradient(135deg, #1a4a2e, #2d6b45)',
            color: (!label.trim() || uploading) ? '#9ca3af' : '#fff',
            fontFamily: "'Montserrat', sans-serif",
          }}>
          {uploading ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
    </div>
  )
}

export default function LocalMesDocuments({ clientId }) {
  const [docs, setDocs] = useState(() => getClientDocuments(clientId))
  const [uploading, setUploading] = useState({})

  useEffect(() => subscribeToDocuments(() => setDocs(getClientDocuments(clientId))), [clientId])

  const handleUpload = (categoryId, categoryLabel, file) => {
    setUploading(prev => ({ ...prev, [categoryId]: true }))
    uploadDocument(clientId, categoryId, categoryLabel, file)
    setDocs(getClientDocuments(clientId))
    setUploading(prev => ({ ...prev, [categoryId]: false }))
  }

  // Progression du dossier principal : UNIQUEMENT REQUIRED_DOCUMENTS (client
  // principal). Les documents associé ne sont jamais ajoutés à ce
  // dénominateur ni à validDocs — une section associé vide ne fait jamais
  // baisser ce pourcentage, ni ne bloque quoi que ce soit ici.
  const validDocs = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'valid').length
  const progressPct = Math.round((validDocs / REQUIRED_DOCUMENTS.length) * 100)

  // Documents associé : catégories dédiées (jamais REQUIRED_DOCUMENTS),
  // affichage neutre uniquement — jamais un statut d'erreur/manquant global.
  const associateCategories = listAssociateDocCategories(docs)
  const associateSentCount = countAssociateDocsSent(docs)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div style={{ background: '#ffffff', border: '1px solid #e8e2d6', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#c49a2a', fontFamily: "'Montserrat', sans-serif" }}>Documents du dossier ORIAS</p>
      <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#9ca3af', fontFamily: "'Montserrat', sans-serif" }}>Envoyez les {REQUIRED_DOCUMENTS.length} documents requis pour votre immatriculation</p>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: "'Montserrat', sans-serif" }}>Documents complétés</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a3d2b', fontFamily: "'Montserrat', sans-serif" }}>{validDocs} / {REQUIRED_DOCUMENTS.length}</span>
        </div>
        <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #c9a84c, #f0d080)', borderRadius: '10px', width: `${progressPct}%`, transition: 'width 0.7s ease' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {REQUIRED_DOCUMENTS.map(req => (
          <DocRow key={req.id} required={req} doc={docs[req.id]} uploading={!!uploading[req.id]} onUpload={handleUpload} />
        ))}
        <AutreDocRow onUpload={handleUpload} uploading={!!uploading['autre']} />
      </div>

      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', borderRadius: '14px', background: '#fefce8', border: '1px solid #fde68a', fontSize: '12px', color: '#78716c', fontFamily: "'Montserrat', sans-serif" }}>
        <span style={{ flexShrink: 0 }}>ℹ️</span>
        <p style={{ margin: 0, lineHeight: '1.6' }}>Formats acceptés : <strong style={{ color: '#b45309' }}>PDF, JPG, PNG</strong> — max 10 Mo. Vérification sous <strong style={{ color: '#b45309' }}>24–48h</strong> par votre conseiller. Démonstration locale · aucun fichier n'est réellement téléversé.</p>
      </div>
    </div>

    {/* Section associé — TOUJOURS visible (aucun flag hasAssociate), 100%
        optionnelle. Design volontairement distinct de la carte "Mes
        documents" ci-dessus (fond vert très clair + liseré vert foncé au
        lieu du blanc/or) mais dans la même charte Oriafen — jamais un
        statut d'erreur/manquant : un dossier sans associé la laisse vide,
        sans aucun impact sur la progression ou le blocage du dossier
        principal (validDocs/progressPct ci-dessus ne portent QUE sur
        REQUIRED_DOCUMENTS). */}
    <div style={{ background: '#f2f7f3', border: '1px solid #c9d8cc', borderLeft: '4px solid #1a4a2e', borderRadius: '20px', padding: '24px' }}>
      <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1a4a2e', fontFamily: "'Montserrat', sans-serif" }}>Documents de mon associé</p>
      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#4b5563', fontFamily: "'Montserrat', sans-serif" }}>À compléter uniquement si votre dossier comporte un associé.</p>
      <p style={{ margin: '0 0 20px', fontSize: '11px', color: '#6b7280', fontStyle: 'italic', fontFamily: "'Montserrat', sans-serif" }}>Documents associé : {associateSentCount} document{associateSentCount > 1 ? 's' : ''} envoyé{associateSentCount > 1 ? 's' : ''}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {associateCategories.map(req => (
          <DocRow key={req.id} required={req} doc={docs[req.id]} uploading={!!uploading[req.id]} onUpload={handleUpload} optional />
        ))}
        <AutreDocRow onUpload={handleUpload} uploading={!!uploading[ASSOCIATE_AUTRE_PREFIX]} categoryPrefix={ASSOCIATE_AUTRE_PREFIX} title="Autre document associé (facultatif)" />
      </div>

      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', borderRadius: '14px', background: '#ffffff', border: '1px solid #c9d8cc', fontSize: '12px', color: '#4b5563', fontFamily: "'Montserrat', sans-serif" }}>
        <span style={{ flexShrink: 0 }}>ℹ️</span>
        <p style={{ margin: 0, lineHeight: '1.6' }}>Section facultative — elle n'est jamais comptée dans la progression de votre dossier principal ci-dessus et ne bloque aucune étape si elle reste vide.</p>
      </div>
    </div>
    </div>
  )
}
