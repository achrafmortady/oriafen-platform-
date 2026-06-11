import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchDocumentsByCategory,
  uploadDocumentFile,
  subscribeToDocuments,
} from '../../lib/api'
import { REQUIRED_DOCUMENTS } from '../../data/mockData'
import { CheckCircleIcon, ClockIcon, XCircleIcon, DownloadIcon } from '../../components/Icons'
import { createClient } from '@supabase/supabase-js'

const _supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Final docs catalogue - always shown, locked until admin uploads
const FINAL_DOCS_CATALOGUE = [
  { type: 'attestation_ias1', label: 'Attestation IAS1' },
  { type: 'kbis',             label: 'Kbis de la société' },
  { type: 'numero_orias',     label: 'Numéro ORIAS officiel' },
  { type: 'attestation_rc',   label: 'Attestation RC Pro' },
  { type: 'domiciliation',    label: 'Domiciliation' },
  { type: 'statuts',          label: 'Statuts de la société' },
]

const TYPE_CONFIG = {
  contrat:    { icon: '📋', label: 'Contrat' },
  convention: { icon: '🤝', label: 'Convention' },
  guide:      { icon: '📖', label: 'Guide' },
  document:   { icon: '📄', label: 'Document' },
}

const STATUS_CONFIG = {
  valid:      { label: 'Validé',              bg: '#d1fae5', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  pending:    { label: 'En attente',          bg: '#fef3c7', color: '#d97706', border: 'rgba(245,158,11,0.3)' },
  missing:    { label: 'Rejeté',              bg: '#fee2e2', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  correction: { label: 'Correction demandée', bg: '#ffedd5', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  none:       { label: 'Manquant',            bg: '#f3f4f6', color: '#6b7280', border: 'rgba(148,163,184,0.2)' },
}

// Toast
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

// DocRow - student upload
function DocRow({ required, doc, uploading, onUpload }) {
  const inputRef = useRef(null)
  const status   = doc?.status ?? 'none'
  const hasFile  = !!doc?.fileName
  const sc       = STATUS_CONFIG[status] ?? STATUS_CONFIG.none
  const btnLabel = (status === 'none' || status === 'missing' || status === 'correction') ? 'Envoyer' : 'Remplacer'

  const rowBg = { valid:'#f0fdf4', pending:'#fffbeb', missing:'#fef2f2', correction:'#fff7ed', none:'#ffffff' }[status] ?? '#ffffff'
  const rowBorder = { valid:'rgba(16,185,129,0.25)', pending:'rgba(245,158,11,0.25)', missing:'rgba(239,68,68,0.25)', correction:'rgba(249,115,22,0.25)', none:'#e8e2d6' }[status] ?? '#e8e2d6'

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) { onUpload(required.id, required.label, file); e.target.value = '' }
  }

  return (
    <div style={{ background:rowBg, border:`1px solid ${rowBorder}`, borderRadius:'14px', padding:'14px 16px', transition:'all 0.2s' }}>
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'12px' }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'10px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
          background: status==='valid' ? '#d1fae5' : status==='pending' ? '#fef3c7' : status==='missing' ? '#fee2e2' : '#f3f4f6',
        }}>
          {status==='valid' ? <CheckCircleIcon className="w-4 h-4" style={{color:'#10b981'}} />
            : status==='pending' ? <ClockIcon className="w-4 h-4" style={{color:'#f59e0b'}} />
            : status==='missing' ? <XCircleIcon className="w-4 h-4" style={{color:'#ef4444'}} />
            : <span style={{fontSize:'13px', color:'#9ca3af', fontWeight:'700'}}>?</span>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontWeight:'600', color:'#1a3d2b', fontSize:'13px', fontFamily:"'Montserrat', sans-serif" }}>{required.label}</p>
          <p style={{ margin:0, fontSize:'11px', color:'#6b7280', fontFamily:"'Montserrat', sans-serif", marginTop:'2px' }}>{required.sublabel}</p>
          {hasFile && <p style={{ margin:0, fontSize:'11px', color:'#c49a2a', marginTop:'3px', fontFamily:"'Montserrat', sans-serif" }}>📎 {doc.fileName}</p>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
          <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, whiteSpace:'nowrap', fontFamily:"'Montserrat', sans-serif" }}>
            {status==='valid'?'✓ ':status==='pending'?'⏳ ':status==='missing'?'✕ ':status==='correction'?'💬 ':'— '}{sc.label}
          </span>
          {status !== 'valid' && (
            <>
              <input ref={inputRef} type="file" accept={required.accept} style={{display:'none'}} onChange={handleFileChange} />
              <button onClick={() => inputRef.current?.click()} disabled={uploading}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', border:'none',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  background: uploading ? '#f3f4f6' : 'linear-gradient(135deg, #1a4a2e, #2d6b45)',
                  color: uploading ? '#9ca3af' : '#fff',
                  fontFamily:"'Montserrat', sans-serif", boxShadow: uploading ? 'none' : '0 2px 10px rgba(26,74,46,0.3)',
                  transition:'all 0.2s',
                }}>
                {uploading
                  ? <><svg style={{animation:'spin 0.8s linear infinite',width:'12px',height:'12px'}} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75"/></svg>Envoi…</>
                  : <><svg style={{width:'12px',height:'12px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>{btnLabel}</>
                }
              </button>
            </>
          )}
        </div>
      </div>
      {(status === 'missing' || status === 'correction') && doc?.rejectionReason && (
        <div style={{ marginTop:'10px', padding:'8px 12px', borderRadius:'10px', fontSize:'11px', fontFamily:"'Montserrat', sans-serif",
          background: status==='missing' ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)',
          color: status==='missing' ? '#ef4444' : '#f97316',
          border: `1px solid ${status==='missing' ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)'}`,
        }}>
          {status==='missing' ? '✕ Raison du rejet : ' : '💬 Correction : '}
          <strong>{doc.rejectionReason}</strong> — Veuillez renvoyer le document corrigé.
        </div>
      )}
    </div>
  )
}

// "Autre document" upload row
function AutreDocRow({ onUpload, uploading }) {
  const inputRef = useRef(null)
  const [label, setLabel] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && label.trim()) {
      onUpload('autre_' + Date.now(), label.trim(), file)
      setLabel('')
      e.target.value = ''
    }
  }

  return (
    <div style={{ background:'#f8f9fa', border:'2px dashed #d1d5db', borderRadius:'14px', padding:'14px 16px' }}>
      <p style={{ margin:'0 0 10px', fontWeight:'600', color:'#6b7280', fontSize:'12px', fontFamily:"'Montserrat', sans-serif" }}>
        📎 Autre document (facultatif)
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'center' }}>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Nom du document..."
          style={{ flex:1, minWidth:'160px', padding:'7px 12px', borderRadius:'10px', border:'1px solid #d1d5db', fontSize:'12px', fontFamily:"'Montserrat', sans-serif", outline:'none' }}
        />
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={handleFileChange} />
        <button
          onClick={() => label.trim() && inputRef.current?.click()}
          disabled={!label.trim() || uploading}
          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', border:'none',
            cursor: (!label.trim() || uploading) ? 'not-allowed' : 'pointer',
            background: (!label.trim() || uploading) ? '#f3f4f6' : 'linear-gradient(135deg, #1a4a2e, #2d6b45)',
            color: (!label.trim() || uploading) ? '#9ca3af' : '#fff',
            fontFamily:"'Montserrat', sans-serif",
          }}>
          {uploading ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
    </div>
  )
}

// Main component
export default function MesDocuments() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('orias')
  const [docs,       setDocs]       = useState({})
  const [uploading,  setUploading]  = useState({})
  const [toasts,     setToasts]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [docsRecus,  setDocsRecus]  = useState([])
  const [docsFinaux, setDocsFinaux] = useState([])
  const [loadingRecus,  setLoadingRecus]  = useState(true)
  const [loadingFinaux, setLoadingFinaux] = useState(true)
  const toastIdRef = useRef(0)

  const pushToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const dismissToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const handleDocChange = useCallback((updated) => {
    const { category, status: newStatus, rejectionReason, fileName, fileUrl } = updated
    if (!category) return
    setDocs(prev => {
      const old = prev[category]
      if (old?.status && old.status !== newStatus) {
        const label = REQUIRED_DOCUMENTS.find(r => r.id === category)?.label ?? category
        if (newStatus === 'valid') pushToast(`${label} validé ✓`, 'success')
        else if (newStatus === 'missing') pushToast(`${label} rejeté.${rejectionReason ? ` Raison : ${rejectionReason}` : ''}`, 'error', 8000)
        else if (newStatus === 'correction') pushToast(`Correction demandée pour ${label}.`, 'warning', 8000)
      }
      return { ...prev, [category]: { ...old, status: newStatus, rejectionReason, fileName: fileName ?? old?.fileName, fileUrl: fileUrl ?? old?.fileUrl } }
    })
  }, [pushToast])

  useEffect(() => {
    if (!user?.id) { setLoading(false); setLoadingRecus(false); setLoadingFinaux(false); return }

    // Dossier ORIAS docs
    fetchDocumentsByCategory(user.id).then(data => setDocs(data)).finally(() => setLoading(false))
    const unsub = subscribeToDocuments(user.id, handleDocChange)

    // Documents reçus (admin → client)
    _supabase.from('client_received_docs').select('*').eq('user_id', user.id).order('sent_at', { ascending: false })
      .then(({ data }) => setDocsRecus(data ?? []))
      .finally(() => setLoadingRecus(false))

    // Documents finaux
    _supabase.from('client_final_docs').select('*').eq('user_id', user.id)
      .then(({ data }) => setDocsFinaux(data ?? []))
      .finally(() => setLoadingFinaux(false))

    return unsub
  }, [user?.id, handleDocChange])

  const handleUpload = async (categoryId, categoryLabel, file) => {
    setUploading(prev => ({ ...prev, [categoryId]: true }))
    const result = await uploadDocumentFile(user?.id, categoryId, categoryLabel, file)
    if (result.autoRejected) pushToast(result.message, 'error')
    else if (result.success) { setDocs(prev => ({ ...prev, [categoryId]: result.doc })); pushToast(`${categoryLabel} envoyé — en attente de validation.`, 'success') }
    else pushToast(`Erreur lors de l'envoi : ${result.error ?? 'réessayez.'}`, 'error')
    setUploading(prev => ({ ...prev, [categoryId]: false }))
  }

  const validDocs   = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'valid').length
  const pendingDocs = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'pending').length
  const progressPct = Math.round((validDocs / REQUIRED_DOCUMENTS.length) * 100)

  const SECTIONS = [
    { id: 'orias',  label: '📋 Dossier ORIAS',   count: validDocs + '/' + REQUIRED_DOCUMENTS.length },
    { id: 'recus',  label: '📥 Documents reçus',  count: docsRecus.length },
    { id: 'finaux', label: '🏆 Documents finaux', count: docsFinaux.length },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .doc-tab:hover { background: rgba(201,168,76,0.06) !important; }
        .doc-row-hover:hover { border-color: rgba(201,168,76,0.3) !important; }
        .dl-btn:hover { color: #1a3d2b !important; background: #f0f9f4 !important; }
      `}</style>

      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div style={{ display:'flex', flexDirection:'column', gap:'24px', fontFamily:"'Montserrat', sans-serif" }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'20px', padding:'28px', boxShadow:'0 4px 30px rgba(0,0,0,0.15)' }}>
          <div style={{ height:'2px', background:'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginBottom:'20px', borderRadius:'2px' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
            <div>
              <h2 style={{ margin:0, fontSize:'20px', fontWeight:'700', color:'#ffffff', fontFamily:"'Montserrat', sans-serif" }}>Mes Documents</h2>
              <p style={{ margin:'4px 0 0', fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>Gérez tous vos documents en un seul endroit</p>
            </div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {[
                { label:'Validés',    value: validDocs,          color:'#10b981' },
                { label:'En attente', value: pendingDocs,         color:'#f59e0b' },
                { label:'Reçus',      value: docsRecus.length,    color:'#c9a84c' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'8px 16px', textAlign:'center' }}>
                  <p style={{ margin:0, fontSize:'18px', fontWeight:'700', color }}>{value}</p>
                  <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.5px' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          {SECTIONS.map(s => (
            <button key={s.id} className="doc-tab" onClick={() => setActiveSection(s.id)}
              style={{ padding:'10px 20px', borderRadius:'12px', fontSize:'13px', fontWeight:'600',
                border: activeSection === s.id ? '1px solid rgba(201,168,76,0.4)' : '1px solid #e8e2d6',
                background: activeSection === s.id ? 'linear-gradient(135deg, #1a3d2b, #2d6b45)' : '#ffffff',
                color: activeSection === s.id ? '#ffffff' : '#4b5563',
                cursor:'pointer', transition:'all 0.2s', fontFamily:"'Montserrat', sans-serif",
                boxShadow: activeSection === s.id ? '0 4px 15px rgba(26,61,43,0.25)' : 'none',
                display:'flex', alignItems:'center', gap:'8px',
              }}>
              {s.label}
              <span style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'700',
                background: activeSection === s.id ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                color: activeSection === s.id ? '#fff' : '#6b7280',
              }}>{s.count}</span>
            </button>
          ))}
        </div>

        {/* Dossier ORIAS */}
        {activeSection === 'orias' && (
          <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'20px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', animation:'fadeIn 0.3s ease' }}>
            <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a' }}>Documents du dossier ORIAS</p>
            <p style={{ margin:'0 0 20px', fontSize:'12px', color:'#9ca3af' }}>Envoyez les {REQUIRED_DOCUMENTS.length} documents requis pour votre immatriculation</p>

            <div style={{ marginBottom:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <span style={{ fontSize:'11px', color:'#6b7280' }}>Documents complétés</span>
                <span style={{ fontSize:'11px', fontWeight:'700', color:'#1a3d2b' }}>{validDocs} / {REQUIRED_DOCUMENTS.length}</span>
              </div>
              <div style={{ height:'6px', background:'#e5e7eb', borderRadius:'10px', overflow:'hidden' }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg, #c9a84c, #f0d080)', borderRadius:'10px', width:`${progressPct}%`, transition:'width 0.7s ease' }} />
              </div>
            </div>

            {loading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'40px' }}>
                <svg style={{ animation:'spin 1s linear infinite', width:'28px', height:'28px', color:'#c9a84c' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75"/>
                </svg>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {REQUIRED_DOCUMENTS.map(req => (
                  <DocRow key={req.id} required={req} doc={docs[req.id]} uploading={!!uploading[req.id]} onUpload={handleUpload} />
                ))}
                <AutreDocRow onUpload={handleUpload} uploading={!!uploading['autre']} />
              </div>
            )}

            <div style={{ marginTop:'16px', display:'flex', alignItems:'flex-start', gap:'10px', padding:'14px 16px', borderRadius:'14px', background:'#fefce8', border:'1px solid #fde68a', fontSize:'12px', color:'#78716c' }}>
              <span style={{flexShrink:0}}>ℹ️</span>
              <p style={{margin:0, lineHeight:'1.6'}}>Formats acceptés : <strong style={{color:'#b45309'}}>PDF, JPG, PNG</strong> — max 10 Mo. Vérification sous <strong style={{color:'#b45309'}}>24–48h</strong> par votre conseiller.</p>
            </div>
          </div>
        )}

        {/* Documents reçus */}
        {activeSection === 'recus' && (
          <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'20px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', animation:'fadeIn 0.3s ease' }}>
            <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a' }}>Documents reçus d'Oriafen</p>
            <p style={{ margin:'0 0 20px', fontSize:'12px', color:'#9ca3af' }}>Contrats, conventions et documents envoyés par votre conseiller</p>

            {loadingRecus ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'40px' }}>
                <svg style={{ animation:'spin 1s linear infinite', width:'24px', height:'24px' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#c9a84c" strokeWidth="3" opacity="0.25"/>
                  <path fill="#c9a84c" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75"/>
                </svg>
              </div>
            ) : docsRecus.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', color:'#9ca3af' }}>
                <p style={{ fontSize:'32px', marginBottom:'12px' }}>📭</p>
                <p style={{ fontWeight:'600', fontSize:'14px', color:'#6b7280', marginBottom:'6px' }}>Aucun document reçu pour l'instant</p>
                <p style={{ fontSize:'12px' }}>Votre conseiller vous enverra vos documents ici au fur et à mesure.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {docsRecus.map(doc => {
                  const tc = TYPE_CONFIG[doc.type] ?? { icon:'📄', label:'Document' }
                  const sentDate = new Date(doc.sent_at).toLocaleDateString('fr-FR')
                  return (
                    <div key={doc.id} className="doc-row-hover"
                      style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px', borderRadius:'14px', border:'1px solid #e8e2d6', background:'#ffffff', transition:'all 0.2s' }}>
                      <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'20px' }}>
                        {tc.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:0, fontWeight:'600', color:'#1a3d2b', fontSize:'13px' }}>{doc.label}</p>
                        <p style={{ margin:'3px 0 0', fontSize:'11px', color:'#9ca3af' }}>📎 {doc.file_name} · Reçu le {sentDate}</p>
                      </div>
                      <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:'rgba(201,168,76,0.08)', color:'#c49a2a', border:'1px solid rgba(201,168,76,0.2)', flexShrink:0 }}>
                        {tc.label}
                      </span>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="dl-btn"
                        style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'10px', background:'none', border:'1px solid #e8e2d6', cursor:'pointer', color:'#6b7280', fontSize:'12px', fontWeight:'600', fontFamily:"'Montserrat', sans-serif", flexShrink:0, transition:'all 0.2s', textDecoration:'none' }}>
                        <DownloadIcon className="w-4 h-4" />
                        Télécharger
                      </a>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop:'16px', padding:'14px 16px', borderRadius:'14px', background:'#f0fdf4', border:'1px solid rgba(16,185,129,0.2)', fontSize:'12px', color:'#065f46', display:'flex', gap:'10px', alignItems:'flex-start' }}>
              <span style={{flexShrink:0}}>ℹ️</span>
              <p style={{ margin:0, lineHeight:'1.6' }}>Documents envoyés par votre conseiller Oriafen. Pour toute question, contactez votre conseiller via WhatsApp.</p>
            </div>
          </div>
        )}

        {/* Documents finaux */}
        {activeSection === 'finaux' && (
          <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'20px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', animation:'fadeIn 0.3s ease' }}>
            <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a' }}>Documents officiels finaux</p>
            <p style={{ margin:'0 0 20px', fontSize:'12px', color:'#9ca3af' }}>Disponibles une fois votre dossier ORIAS traité</p>

            {loadingFinaux ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'40px' }}>
                <svg style={{ animation:'spin 1s linear infinite', width:'24px', height:'24px' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#c9a84c" strokeWidth="3" opacity="0.25"/>
                  <path fill="#c9a84c" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75"/>
                </svg>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {FINAL_DOCS_CATALOGUE.map(cat => {
                  const uploaded = docsFinaux.find(d => d.doc_type === cat.type)
                  return (
                    <div key={cat.type} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px', borderRadius:'14px',
                      border: uploaded ? '1px solid rgba(201,168,76,0.3)' : '1px solid #e8e2d6',
                      background: uploaded ? '#fffdf5' : '#fafafa',
                      opacity: uploaded ? 1 : 0.65,
                    }}>
                      <div style={{ width:'44px', height:'44px', borderRadius:'12px', background: uploaded ? 'rgba(201,168,76,0.1)' : '#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'20px' }}>
                        {uploaded ? '📄' : '🔒'}
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0, fontWeight:'600', color: uploaded ? '#1a3d2b' : '#9ca3af', fontSize:'13px' }}>{cat.label}</p>
                        <p style={{ margin:'3px 0 0', fontSize:'11px', color: uploaded ? '#c49a2a' : '#d1d5db' }}>
                          {uploaded ? `📎 ${uploaded.file_name}` : 'En attente de validation ORIAS'}
                        </p>
                      </div>
                      {uploaded ? (
                        <a href={uploaded.file_url} target="_blank" rel="noopener noreferrer" className="dl-btn"
                          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'10px', background:'none', border:'1px solid #e8e2d6', cursor:'pointer', color:'#6b7280', fontSize:'12px', fontWeight:'600', fontFamily:"'Montserrat', sans-serif", flexShrink:0, transition:'all 0.2s', textDecoration:'none' }}>
                          <DownloadIcon className="w-4 h-4" />
                          Télécharger
                        </a>
                      ) : (
                        <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:'#f3f4f6', color:'#9ca3af', border:'1px solid #e5e7eb', flexShrink:0 }}>
                          Verrouillé
                        </span>
                      )}
                    </div>
                  )
                })}

                {/* Extra docs from admin */}
                {docsFinaux.filter(d => !FINAL_DOCS_CATALOGUE.find(c => c.type === d.doc_type)).map(doc => (
                  <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px', borderRadius:'14px', border:'1px solid rgba(201,168,76,0.3)', background:'#fffdf5' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'rgba(201,168,76,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'20px' }}>📄</div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontWeight:'600', color:'#1a3d2b', fontSize:'13px' }}>{doc.doc_type}</p>
                      <p style={{ margin:'3px 0 0', fontSize:'11px', color:'#c49a2a' }}>📎 {doc.file_name}</p>
                    </div>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="dl-btn"
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'10px', background:'none', border:'1px solid #e8e2d6', cursor:'pointer', color:'#6b7280', fontSize:'12px', fontWeight:'600', fontFamily:"'Montserrat', sans-serif", flexShrink:0, transition:'all 0.2s', textDecoration:'none' }}>
                      <DownloadIcon className="w-4 h-4" />
                      Télécharger
                    </a>
                  </div>
                ))}
              </div>
            )}

            {docsFinaux.length === 0 && !loadingFinaux && (
              <div style={{ marginTop:'20px', padding:'20px', borderRadius:'16px', background:'linear-gradient(135deg, rgba(26,61,43,0.04), rgba(201,168,76,0.04))', border:'1px solid rgba(201,168,76,0.15)', textAlign:'center' }}>
                <p style={{ margin:'0 0 6px', fontSize:'24px' }}>🎯</p>
                <p style={{ margin:'0 0 4px', fontWeight:'700', color:'#1a3d2b', fontSize:'14px' }}>Complétez votre dossier ORIAS</p>
                <p style={{ margin:0, fontSize:'12px', color:'#6b7280', lineHeight:'1.6' }}>Une fois votre immatriculation obtenue, tous ces documents seront disponibles au téléchargement.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}
