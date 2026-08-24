import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchUserMarketingProfile,
  fetchBrandBrief,
  fetchMarketingStatus,
  submitBrandBrief,
  uploadBrandAsset,
} from '../../lib/api'

const STYLE_OPTIONS = [
  { id: 'prestige',   label: 'Prestige',   desc: 'Élégant, classique, rassurant' },
  { id: 'clarte',     label: 'Clarté',     desc: 'Épuré, moderne, simple' },
  { id: 'dynamique',  label: 'Dynamique',  desc: 'Vif, énergique, percutant' },
]

const INSURANCE_TYPES = [
  { id: 'auto',             label: 'Automobile' },
  { id: 'moto',              label: 'Moto / 2-roues' },
  { id: 'habitation',       label: 'Habitation' },
  { id: 'sante',             label: 'Santé' },
  { id: 'prevoyance',       label: 'Prévoyance' },
  { id: 'emprunteur',       label: 'Emprunteur' },
  { id: 'voyage',            label: 'Voyage' },
  { id: 'rc_pro',           label: 'RC Pro' },
  { id: 'multirisque_pro',  label: 'Multirisque Professionnelle' },
]

const DELIVERABLE_STEPS = [
  { key: 'brand_kit_status', label: 'Brand kit',    emoji: '🎨' },
  { key: 'site_status',      label: 'Site internet', emoji: '🌐' },
  { key: 'social_status',    label: 'Réseaux sociaux', emoji: '📱' },
  { key: 'ads_status',       label: 'Créatifs pub',  emoji: '📣' },
]

const STATUS_CONFIG = {
  a_faire:  { label: 'À faire',   bg: '#f3f4f6', color: '#9ca3af', border: '#e5e7eb' },
  en_cours: { label: 'En cours',  bg: '#fef3c7', color: '#d97706', border: 'rgba(245,158,11,0.3)' },
  livre:    { label: 'Livré',     bg: '#d1fae5', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
}

function Toast({ toasts, onDismiss }) {
  return (
    <div style={{ position:'fixed', top:'1rem', right:'1rem', zIndex:50, display:'flex', flexDirection:'column', gap:'8px', pointerEvents:'none', maxWidth:'360px' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'flex-start', gap:'10px', padding:'12px 16px', borderRadius:'14px',
          border: t.type==='success' ? '1px solid rgba(16,185,129,0.3)' : t.type==='error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.3)',
          background: t.type==='success' ? 'rgba(16,185,129,0.1)' : t.type==='error' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
          backdropFilter:'blur(12px)', boxShadow:'0 8px 30px rgba(0,0,0,0.15)',
          pointerEvents:'auto', color: t.type==='success' ? '#10b981' : t.type==='error' ? '#ef4444' : '#f59e0b',
          fontFamily:"'Montserrat', sans-serif", fontSize:'13px',
        }}>
          <span style={{flexShrink:0}}>{t.type==='success'?'✅':t.type==='error'?'❌':'⚠️'}</span>
          <p style={{flex:1, margin:0, lineHeight:'1.4'}}>{t.message}</p>
          <button onClick={()=>onDismiss(t.id)} style={{background:'none',border:'none',cursor:'pointer',opacity:0.5,flexShrink:0,color:'inherit',fontSize:'14px'}}>✕</button>
        </div>
      ))}
    </div>
  )
}

function SectionCard({ eyebrow, title, children }) {
  return (
    <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'20px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      {eyebrow && <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a' }}>{eyebrow}</p>}
      {title && <p style={{ margin:'0 0 18px', fontSize:'15px', fontWeight:'700', color:'#1a3d2b' }}>{title}</p>}
      {children}
    </div>
  )
}

function TextField({ label, required, hint, ...props }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <span style={{ fontSize:'12px', fontWeight:'600', color:'#374151' }}>
        {label}{required && <span style={{ color:'#ef4444' }}> *</span>}
      </span>
      <input {...props}
        style={{ padding:'10px 14px', borderRadius:'10px', border:'1px solid #d1d5db', fontSize:'13px', fontFamily:"'Montserrat', sans-serif", outline:'none', ...(props.style||{}) }}
      />
      {hint && <span style={{ fontSize:'11px', color:'#9ca3af' }}>{hint}</span>}
    </label>
  )
}

function TextAreaField({ label, hint, ...props }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <span style={{ fontSize:'12px', fontWeight:'600', color:'#374151' }}>{label}</span>
      <textarea {...props}
        style={{ padding:'10px 14px', borderRadius:'10px', border:'1px solid #d1d5db', fontSize:'13px', fontFamily:"'Montserrat', sans-serif", outline:'none', resize:'vertical', minHeight:'80px', ...(props.style||{}) }}
      />
      {hint && <span style={{ fontSize:'11px', color:'#9ca3af' }}>{hint}</span>}
    </label>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <span style={{ fontSize:'12px', fontWeight:'600', color:'#374151' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <input type="color" value={value || '#1a3d2b'} onChange={e => onChange(e.target.value)}
          style={{ width:'42px', height:'38px', borderRadius:'10px', border:'1px solid #d1d5db', padding:'2px', cursor:'pointer' }} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="#1a3d2b"
          style={{ flex:1, padding:'10px 14px', borderRadius:'10px', border:'1px solid #d1d5db', fontSize:'13px', fontFamily:"'Montserrat', sans-serif", outline:'none' }} />
      </div>
    </label>
  )
}

function YesNoToggle({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:'8px' }}>
      {[{ v:true, label:'Oui' }, { v:false, label:'Non' }].map(opt => (
        <button key={String(opt.v)} type="button" onClick={() => onChange(opt.v)}
          style={{ padding:'8px 20px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', cursor:'pointer',
            border: value === opt.v ? '1px solid rgba(201,168,76,0.5)' : '1px solid #d1d5db',
            background: value === opt.v ? 'linear-gradient(135deg,#1a3d2b,#2d6b45)' : '#ffffff',
            color: value === opt.v ? '#ffffff' : '#6b7280',
            fontFamily:"'Montserrat', sans-serif", transition:'all 0.2s',
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Questionnaire (3a) ──────────────────────────────────────

function BriefForm({ userId, profile, pushToast, onSubmitted }) {
  const [cabinetName, setCabinetName]         = useState('')
  const [contactFullName, setContactFullName] = useState(profile?.full_name || '')
  const [email, setEmail]                     = useState(profile?.email || '')
  const [whatsapp, setWhatsapp]               = useState('')
  const [villeFrance, setVilleFrance]         = useState('')

  const [stylePrefere, setStylePrefere]       = useState('')
  const [notesStyle, setNotesStyle]           = useState('')
  const [couleurPrincipale, setCouleurPrincipale] = useState('#1a3d2b')
  const [couleurSecondaire, setCouleurSecondaire] = useState('#c9a84c')
  const [domaineSouhaite, setDomaineSouhaite] = useState('')

  const [typesAssurance, setTypesAssurance]   = useState([])
  const [autreType, setAutreType]             = useState('')

  const [demandesSpeciales, setDemandesSpeciales] = useState('')

  const [aUnLogo, setAUnLogo]     = useState(false)
  const [logoUrl, setLogoUrl]     = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [aDesPhotos, setADesPhotos] = useState(false)
  const [photosUrls, setPhotosUrls] = useState([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  const [instagramExistant, setInstagramExistant] = useState('')
  const [facebookExistant, setFacebookExistant]   = useState('')
  const [reseauxACreer, setReseauxACreer]         = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const logoInputRef = useRef(null)
  const photosInputRef = useRef(null)

  useEffect(() => {
    if (profile?.full_name) setContactFullName(profile.full_name)
    if (profile?.email) setEmail(profile.email)
  }, [profile])

  const toggleType = (id) => {
    setTypesAssurance(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const res = await uploadBrandAsset(userId, 'logo', file)
    if (res.success) { setLogoUrl(res.url); pushToast('Logo envoyé.', 'success') }
    else pushToast(`Erreur envoi logo : ${res.error ?? 'réessayez.'}`, 'error')
    setUploadingLogo(false)
    e.target.value = ''
  }

  const handlePhotosFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingPhotos(true)
    for (const file of files) {
      const res = await uploadBrandAsset(userId, 'photos', file)
      if (res.success) setPhotosUrls(prev => [...prev, { url: res.url, name: res.fileName }])
      else pushToast(`Erreur envoi photo : ${res.error ?? 'réessayez.'}`, 'error')
    }
    setUploadingPhotos(false)
    e.target.value = ''
  }

  const removePhoto = (url) => setPhotosUrls(prev => prev.filter(p => p.url !== url))

  const canSubmit = cabinetName.trim() && contactFullName.trim() && email.trim() && stylePrefere && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) { pushToast('Merci de compléter les champs obligatoires (*).', 'error'); return }
    setSubmitting(true)

    const typesFinal = [...typesAssurance]
    if (autreType.trim()) typesFinal.push(`autre:${autreType.trim()}`)

    const payload = {
      pack_id: profile?.pack_id,
      cabinet_name: cabinetName.trim(),
      contact_full_name: contactFullName.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim() || null,
      ville_france: villeFrance.trim() || null,
      style_prefere: stylePrefere,
      couleur_principale: couleurPrincipale,
      couleur_secondaire: couleurSecondaire,
      notes_style: notesStyle.trim() || null,
      domaine_souhaite: domaineSouhaite.trim() || null,
      types_assurance_prioritaires: typesFinal,
      demandes_speciales: demandesSpeciales.trim() || null,
      a_un_logo: aUnLogo,
      logo_url: aUnLogo ? (logoUrl || null) : null,
      a_des_photos: aDesPhotos,
      photos_urls: aDesPhotos ? photosUrls.map(p => p.url) : [],
      instagram_existant: instagramExistant.trim() || null,
      facebook_existant: facebookExistant.trim() || null,
      reseaux_a_creer: reseauxACreer,
    }

    const res = await submitBrandBrief(payload)
    setSubmitting(false)
    if (res.success) { pushToast('Brief envoyé — merci !', 'success'); onSubmitted(res.brief) }
    else pushToast(`Erreur lors de l'envoi : ${res.error ?? 'réessayez.'}`, 'error')
  }

  const chipStyle = (active) => ({
    padding:'8px 16px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', cursor:'pointer',
    border: active ? '1px solid rgba(201,168,76,0.5)' : '1px solid #d1d5db',
    background: active ? 'linear-gradient(135deg,#1a3d2b,#2d6b45)' : '#ffffff',
    color: active ? '#ffffff' : '#6b7280',
    fontFamily:"'Montserrat', sans-serif", transition:'all 0.2s',
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

      <SectionCard eyebrow="Vos coordonnées" title="Qui contacter pour la production">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'16px' }}>
          <TextField label="Nom du cabinet / de la marque" required value={cabinetName} onChange={e => setCabinetName(e.target.value)} placeholder="Ex. Cabinet Martin Assurances" />
          <TextField label="Nom du contact" required value={contactFullName} onChange={e => setContactFullName(e.target.value)} />
          <TextField label="Email" required type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <TextField label="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+212 6..." />
          <TextField label="Ville d'exercice (France)" value={villeFrance} onChange={e => setVilleFrance(e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard eyebrow="Site internet" title="Style et identité visuelle">
        <div style={{ marginBottom:'18px' }}>
          <span style={{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'10px' }}>Style souhaité <span style={{color:'#ef4444'}}>*</span></span>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'10px' }}>
            {STYLE_OPTIONS.map(opt => (
              <button key={opt.id} type="button" onClick={() => setStylePrefere(opt.id)}
                style={{ textAlign:'left', padding:'14px 16px', borderRadius:'14px', cursor:'pointer',
                  border: stylePrefere === opt.id ? '2px solid #c9a84c' : '1px solid #e8e2d6',
                  background: stylePrefere === opt.id ? '#fffdf5' : '#ffffff',
                  transition:'all 0.2s',
                }}>
                <p style={{ margin:0, fontWeight:'700', fontSize:'13px', color:'#1a3d2b' }}>{opt.label}</p>
                <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#9ca3af' }}>{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <TextAreaField label="Précisions sur le style souhaité (optionnel)" value={notesStyle} onChange={e => setNotesStyle(e.target.value)}
          placeholder="Sites que vous aimez, ambiance recherchée..." style={{ minHeight:'60px', marginBottom:'18px' }} />

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'16px' }}>
          <ColorField label="Couleur principale" value={couleurPrincipale} onChange={setCouleurPrincipale} />
          <ColorField label="Couleur secondaire" value={couleurSecondaire} onChange={setCouleurSecondaire} />
          <TextField label="Nom de domaine souhaité (optionnel)" value={domaineSouhaite} onChange={e => setDomaineSouhaite(e.target.value)} placeholder="www.moncabinet.fr" />
        </div>
      </SectionCard>

      <SectionCard eyebrow="Sur quoi se concentrer" title="Types d'assurance à mettre en avant">
        <p style={{ margin:'0 0 14px', fontSize:'12px', color:'#9ca3af' }}>Détermine les pages de votre site — sélectionnez tout ce qui s'applique.</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'14px' }}>
          {INSURANCE_TYPES.map(t => (
            <button key={t.id} type="button" onClick={() => toggleType(t.id)} style={chipStyle(typesAssurance.includes(t.id))}>
              {t.label}
            </button>
          ))}
        </div>
        <TextField label="Autre (facultatif)" value={autreType} onChange={e => setAutreType(e.target.value)} placeholder="Précisez..." />
      </SectionCard>

      <SectionCard eyebrow="Demandes spéciales" title="Éléments particuliers à intégrer">
        <TextAreaField label="" value={demandesSpeciales} onChange={e => setDemandesSpeciales(e.target.value)}
          placeholder="Partenaires spécifiques, mentions légales, éléments de votre parcours..." />
      </SectionCard>

      <SectionCard eyebrow="Actifs existants" title="Logo, photos et réseaux">
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          <div>
            <span style={{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'10px' }}>Avez-vous déjà un logo ?</span>
            <YesNoToggle value={aUnLogo} onChange={setAUnLogo} />
            {aUnLogo && (
              <div style={{ marginTop:'12px', display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center' }}>
                <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.svg,.pdf,.webp" style={{ display:'none' }} onChange={handleLogoFile} />
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                  style={{ padding:'9px 16px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', border:'none', cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                    background: uploadingLogo ? '#f3f4f6' : 'linear-gradient(135deg, #1a4a2e, #2d6b45)', color: uploadingLogo ? '#9ca3af' : '#fff', fontFamily:"'Montserrat', sans-serif" }}>
                  {uploadingLogo ? 'Envoi…' : '📤 Envoyer le logo'}
                </button>
                <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="ou collez un lien vers votre logo"
                  style={{ flex:1, minWidth:'220px', padding:'9px 14px', borderRadius:'10px', border:'1px solid #d1d5db', fontSize:'12px', fontFamily:"'Montserrat', sans-serif", outline:'none' }} />
                {logoUrl && <span style={{ fontSize:'11px', color:'#10b981' }}>✓ prêt</span>}
              </div>
            )}
          </div>

          <div>
            <span style={{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'10px' }}>Avez-vous des photos existantes ?</span>
            <YesNoToggle value={aDesPhotos} onChange={setADesPhotos} />
            {aDesPhotos && (
              <div style={{ marginTop:'12px' }}>
                <input ref={photosInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" multiple style={{ display:'none' }} onChange={handlePhotosFiles} />
                <button type="button" onClick={() => photosInputRef.current?.click()} disabled={uploadingPhotos}
                  style={{ padding:'9px 16px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', border:'none', cursor: uploadingPhotos ? 'not-allowed' : 'pointer',
                    background: uploadingPhotos ? '#f3f4f6' : 'linear-gradient(135deg, #1a4a2e, #2d6b45)', color: uploadingPhotos ? '#9ca3af' : '#fff', fontFamily:"'Montserrat', sans-serif" }}>
                  {uploadingPhotos ? 'Envoi…' : '📤 Envoyer des photos'}
                </button>
                {photosUrls.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'12px' }}>
                    {photosUrls.map(p => (
                      <div key={p.url} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', borderRadius:'10px', background:'#f8f9fa', border:'1px solid #e8e2d6', fontSize:'11px' }}>
                        <span>🖼️ {p.name}</span>
                        <button type="button" onClick={() => removePhoto(p.url)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'16px' }}>
            <TextField label="Instagram existant (si applicable)" value={instagramExistant} onChange={e => setInstagramExistant(e.target.value)} placeholder="@moncabinet" />
            <TextField label="Facebook existant (si applicable)" value={facebookExistant} onChange={e => setFacebookExistant(e.target.value)} placeholder="facebook.com/moncabinet" />
          </div>

          <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }}>
            <input type="checkbox" checked={reseauxACreer} onChange={e => setReseauxACreer(e.target.checked)} style={{ width:'16px', height:'16px' }} />
            <span style={{ fontSize:'12px', color:'#374151' }}>Créer les pages Instagram / Facebook si elles n'existent pas encore</span>
          </label>
        </div>
      </SectionCard>

      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button type="button" onClick={handleSubmit} disabled={!canSubmit}
          style={{ padding:'13px 32px', borderRadius:'12px', fontSize:'13px', fontWeight:'700', border:'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            background: canSubmit ? 'linear-gradient(135deg,#c9a84c,#b8960a)' : '#f3f4f6',
            color: canSubmit ? '#1a3d2b' : '#9ca3af',
            fontFamily:"'Montserrat', sans-serif", boxShadow: canSubmit ? '0 4px 15px rgba(201,168,76,0.35)' : 'none',
          }}>
          {submitting ? 'Envoi…' : 'Envoyer mon brief'}
        </button>
      </div>
    </div>
  )
}

// ── Statut de production (3b) ──────────────────────────────────

function StatusStepper({ status }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'12px' }}>
      {DELIVERABLE_STEPS.map(step => {
        const val = status?.[step.key] || 'a_faire'
        const sc = STATUS_CONFIG[val] ?? STATUS_CONFIG.a_faire
        return (
          <div key={step.key} style={{ padding:'18px', borderRadius:'16px', border:`1px solid ${sc.border}`, background: val === 'a_faire' ? '#fafafa' : sc.bg + '22', textAlign:'center' }}>
            <p style={{ fontSize:'26px', margin:'0 0 8px' }}>{step.emoji}</p>
            <p style={{ margin:'0 0 8px', fontWeight:'700', fontSize:'13px', color:'#1a3d2b' }}>{step.label}</p>
            <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>
              {sc.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function StatusView({ brief, status }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <SectionCard eyebrow="Votre brief" title={brief.cabinet_name}>
        <p style={{ margin:0, fontSize:'13px', color:'#6b7280', lineHeight:'1.7' }}>
          Merci, votre brief a bien été reçu le {new Date(brief.created_at).toLocaleDateString('fr-FR')}.
          Notre équipe s'appuie dessus pour produire votre brand kit, votre site et vos réseaux.
        </p>
      </SectionCard>

      <SectionCard eyebrow="Suivi de production" title="Où en est votre projet">
        <StatusStepper status={status} />
        {status?.site_status === 'livre' && status?.site_url && (
          <div style={{ marginTop:'18px', padding:'16px', borderRadius:'14px', background:'#f0fdf4', border:'1px solid rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
            <p style={{ margin:0, fontSize:'13px', color:'#065f46' }}>🌐 Votre site est en ligne !</p>
            <a href={status.site_url} target="_blank" rel="noopener noreferrer"
              style={{ padding:'8px 18px', borderRadius:'10px', background:'#10b981', color:'#fff', fontSize:'12px', fontWeight:'700', textDecoration:'none' }}>
              Voir le site →
            </a>
          </div>
        )}
        <div style={{ marginTop:'18px', padding:'14px 16px', borderRadius:'14px', background:'#fefce8', border:'1px solid #fde68a', fontSize:'12px', color:'#78716c', display:'flex', gap:'10px', alignItems:'flex-start' }}>
          <span style={{flexShrink:0}}>ℹ️</span>
          <p style={{margin:0, lineHeight:'1.6'}}>Une question sur votre projet ? Contactez votre conseiller via l'onglet Support.</p>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Composant principal ──────────────────────────────────────

export default function Marketing() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [brief, setBrief]     = useState(null)
  const [status, setStatus]   = useState(null)
  const [toasts, setToasts]   = useState([])
  const toastIdRef = useRef(0)

  const pushToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])
  const dismissToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      const [prof, existingBrief] = await Promise.all([
        fetchUserMarketingProfile(user.id),
        fetchBrandBrief(user.id),
      ])
      if (cancelled) return
      setProfile(prof)
      setBrief(existingBrief)
      if (existingBrief) {
        const st = await fetchMarketingStatus()
        if (!cancelled) setStatus(st)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [user?.id])

  const handleSubmitted = async (newBrief) => {
    setBrief(newBrief)
    const st = await fetchMarketingStatus()
    setStatus(st)
  }

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px' }}>
        <svg style={{ animation:'spin 1s linear infinite', width:'28px', height:'28px', color:'#c9a84c' }} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75"/>
        </svg>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div style={{ display:'flex', flexDirection:'column', gap:'24px', fontFamily:"'Montserrat', sans-serif" }}>
        <div style={{ background:'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'20px', padding:'28px', boxShadow:'0 4px 30px rgba(0,0,0,0.15)' }}>
          <div style={{ height:'2px', background:'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginBottom:'20px', borderRadius:'2px' }} />
          <h2 style={{ margin:0, fontSize:'20px', fontWeight:'700', color:'#ffffff' }}>Mon site & communication</h2>
          <p style={{ margin:'4px 0 0', fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>
            {brief ? 'Suivi de la production de votre identité digitale.' : 'Quelques questions pour lancer la création de votre site et de votre communication.'}
          </p>
        </div>

        {brief ? <StatusView brief={brief} status={status} /> : <BriefForm userId={user.id} profile={profile} pushToast={pushToast} onSubmitted={handleSubmitted} />}
      </div>
    </>
  )
}
