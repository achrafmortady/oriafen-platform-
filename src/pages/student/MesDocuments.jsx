import { useState } from 'react'
import { UploadIcon, DownloadIcon, FileIcon, SendIcon } from '../../components/Icons'

// ── Mock data ─────────────────────────────────────────────────
const DOCS_ENVOYES = [
  { id: 1, name: "Pièce d'identité.pdf",    size: '2.3 MB', date: '12/03/2026', status: 'valid' },
  { id: 2, name: 'Casier judiciaire B3.pdf', size: '1.1 MB', date: '15/03/2026', status: 'valid' },
  { id: 3, name: 'Attestation IAS1.pdf',     size: '0.8 MB', date: '18/03/2026', status: 'pending' },
  { id: 4, name: 'Attestation RCP.pdf',      size: '3.2 MB', date: '20/03/2026', status: 'valid' },
]

const DOCS_RECUS = [
  { id: 1, name: 'Contrat de mission signé.pdf',     size: '1.4 MB', date: '14/03/2026', type: 'contrat' },
  { id: 2, name: 'Convention Oriafen Academy.pdf',   size: '0.9 MB', date: '16/03/2026', type: 'convention' },
  { id: 3, name: 'Guide démarrage rapide.pdf',       size: '2.1 MB', date: '18/03/2026', type: 'guide' },
]

const DOCS_FINAUX = [
  { id: 1, name: 'Numéro ORIAS officiel.pdf',        size: '0.5 MB', date: '—',          locked: true },
  { id: 2, name: 'Attestation immatriculation.pdf',  size: '—',      date: '—',          locked: true },
  { id: 3, name: 'Certificat IAS1.pdf',              size: '—',      date: '—',          locked: true },
]

const STATUS_CONFIG = {
  valid:   { label: 'Validé',      bg: '#d1fae5', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  pending: { label: 'En attente',  bg: '#fef3c7', color: '#d97706', border: 'rgba(245,158,11,0.3)' },
  missing: { label: 'Manquant',    bg: '#fee2e2', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
}

const TYPE_CONFIG = {
  contrat:    { icon: '📋', label: 'Contrat' },
  convention: { icon: '🤝', label: 'Convention' },
  guide:      { icon: '📖', label: 'Guide' },
}

export default function MesDocuments() {
  const [docs, setDocs] = useState(DOCS_ENVOYES)
  const [dragOver, setDragOver] = useState(false)
  const [sent, setSent] = useState(false)
  const [activeSection, setActiveSection] = useState('envoyes')

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer?.files || [])
    files.forEach(f => {
      setDocs(prev => [...prev, {
        id: Date.now() + Math.random(),
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        date: new Date().toLocaleDateString('fr-FR'),
        status: 'pending',
      }])
    })
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(f => {
      setDocs(prev => [...prev, {
        id: Date.now() + Math.random(),
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        date: new Date().toLocaleDateString('fr-FR'),
        status: 'pending',
      }])
    })
  }

  const handleSendAll = () => {
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const SECTIONS = [
    { id: 'envoyes', label: '📤 Documents envoyés', count: docs.length },
    { id: 'recus',   label: '📥 Documents reçus',   count: DOCS_RECUS.length },
    { id: 'finaux',  label: '🏆 Documents finaux',  count: 0 },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px', fontFamily:"'Montserrat', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .doc-row:hover { background: #f9f7f3 !important; border-color: rgba(201,168,76,0.3) !important; }
        .section-tab:hover { background: rgba(201,168,76,0.08) !important; }
        .download-btn:hover { color: #1a3d2b !important; background: #f0f9f4 !important; }
        .upload-zone:hover { border-color: rgba(201,168,76,0.6) !important; background: rgba(201,168,76,0.03) !important; }
      `}</style>

      {/* ── Header card ── */}
      <div style={{ background:'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'20px', padding:'28px', boxShadow:'0 4px 30px rgba(0,0,0,0.15)' }}>
        <div style={{ height:'2px', background:'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginBottom:'20px', borderRadius:'2px' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <h2 style={{ margin:0, fontSize:'20px', fontWeight:'700', color:'#ffffff', fontFamily:"'Montserrat', sans-serif" }}>Centre de Documents</h2>
            <p style={{ margin:'4px 0 0', fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>Gérez tous vos documents en un seul endroit</p>
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {[
              { label:'Envoyés', value: docs.filter(d => d.status === 'valid').length, color:'#10b981' },
              { label:'En attente', value: docs.filter(d => d.status === 'pending').length, color:'#f59e0b' },
              { label:'Reçus', value: DOCS_RECUS.length, color:'#c9a84c' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'8px 16px', textAlign:'center' }}>
                <p style={{ margin:0, fontSize:'18px', fontWeight:'700', color }}>{value}</p>
                <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.5px' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section tabs ── */}
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.id} className="section-tab"
            onClick={() => setActiveSection(s.id)}
            style={{
              padding:'10px 20px', borderRadius:'12px', fontSize:'13px', fontWeight:'600',
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

      {/* ── Section: Documents envoyés ── */}
      {activeSection === 'envoyes' && (
        <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'20px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', animation:'fadeIn 0.3s ease' }}>
          <p style={{ margin:'0 0 6px', fontSize:'11px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a' }}>Documents envoyés à votre conseiller</p>
          <p style={{ margin:'0 0 20px', fontSize:'12px', color:'#9ca3af' }}>Ces documents sont liés à votre dossier ORIAS — gérez-les depuis "Mon Dossier"</p>

          {/* Upload zone */}
          <div className="upload-zone"
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input-docs').click()}
            style={{
              border: `2px dashed ${dragOver ? '#c9a84c' : '#e8e2d6'}`,
              borderRadius:'16px', padding:'32px', textAlign:'center',
              cursor:'pointer', marginBottom:'20px', transition:'all 0.2s',
              background: dragOver ? 'rgba(201,168,76,0.04)' : '#fafafa',
            }}>
            <input id="file-input-docs" type="file" multiple style={{ display:'none' }} onChange={handleFileSelect} />
            <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'rgba(201,168,76,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <UploadIcon className="w-6 h-6" style={{ color:'#c9a84c' }} />
            </div>
            <p style={{ margin:0, fontWeight:'600', color:'#1a3d2b', fontSize:'14px' }}>Déposer vos documents ici</p>
            <p style={{ margin:'6px 0 0', fontSize:'12px', color:'#9ca3af' }}>ou <span style={{ color:'#c49a2a', fontWeight:'600' }}>cliquez pour parcourir</span></p>
            <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#d1d5db' }}>PDF, JPG, PNG — max 10 MB</p>
          </div>

          {/* Doc list header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <p style={{ margin:0, fontWeight:'700', color:'#1a3d2b', fontSize:'14px' }}>Documents ({docs.length})</p>
            <button onClick={handleSendAll}
              style={{
                display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px',
                borderRadius:'10px', fontSize:'12px', fontWeight:'600', cursor:'pointer',
                border: sent ? '1px solid rgba(16,185,129,0.3)' : '1px solid #1a3d2b',
                background: sent ? '#d1fae5' : '#1a3d2b',
                color: sent ? '#10b981' : '#fff',
                transition:'all 0.2s', fontFamily:"'Montserrat', sans-serif",
              }}>
              <SendIcon className="w-4 h-4" />
              {sent ? 'Envoyé ✓' : 'Envoyer à mon conseiller'}
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {docs.map(doc => {
              const sc = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending
              return (
                <div key={doc.id} className="doc-row"
                  style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', border:'1px solid #e8e2d6', transition:'all 0.2s', background:'#ffffff' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(26,61,43,0.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <FileIcon className="w-5 h-5" style={{ color:'#1a3d2b' }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontWeight:'600', color:'#1a3d2b', fontSize:'13px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.name}</p>
                    <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#9ca3af' }}>{doc.size} · {doc.date}</p>
                  </div>
                  <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, whiteSpace:'nowrap', flexShrink:0 }}>
                    {sc.label}
                  </span>
                  <button className="download-btn"
                    style={{ width:'34px', height:'34px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'1px solid #e8e2d6', cursor:'pointer', color:'#9ca3af', flexShrink:0, transition:'all 0.2s' }}>
                    <DownloadIcon className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Section: Documents reçus ── */}
      {activeSection === 'recus' && (
        <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'20px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', animation:'fadeIn 0.3s ease' }}>
          <p style={{ margin:'0 0 6px', fontSize:'11px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a' }}>Documents reçus d'Oriafen</p>
          <p style={{ margin:'0 0 20px', fontSize:'12px', color:'#9ca3af' }}>Contrats, conventions et guides envoyés par votre conseiller</p>

          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {DOCS_RECUS.map(doc => {
              const tc = TYPE_CONFIG[doc.type] ?? { icon:'📄', label:'Document' }
              return (
                <div key={doc.id} className="doc-row"
                  style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px', borderRadius:'14px', border:'1px solid #e8e2d6', transition:'all 0.2s', background:'#ffffff' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'20px' }}>
                    {tc.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontWeight:'600', color:'#1a3d2b', fontSize:'13px' }}>{doc.name}</p>
                    <p style={{ margin:'3px 0 0', fontSize:'11px', color:'#9ca3af' }}>{doc.size} · Reçu le {doc.date}</p>
                  </div>
                  <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:'rgba(201,168,76,0.08)', color:'#c49a2a', border:'1px solid rgba(201,168,76,0.2)', flexShrink:0 }}>
                    {tc.label}
                  </span>
                  <button className="download-btn"
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'10px', background:'none', border:'1px solid #e8e2d6', cursor:'pointer', color:'#6b7280', fontSize:'12px', fontWeight:'600', fontFamily:"'Montserrat', sans-serif", flexShrink:0, transition:'all 0.2s' }}>
                    <DownloadIcon className="w-4 h-4" />
                    Télécharger
                  </button>
                </div>
              )
            })}
          </div>

          {/* Info */}
          <div style={{ marginTop:'16px', padding:'14px 16px', borderRadius:'14px', background:'#f0f9f4', border:'1px solid rgba(16,185,129,0.2)', fontSize:'12px', color:'#065f46', display:'flex', gap:'10px', alignItems:'flex-start' }}>
            <span style={{ flexShrink:0 }}>ℹ️</span>
            <p style={{ margin:0, lineHeight:'1.6' }}>Ces documents vous ont été envoyés directement par votre conseiller Oriafen. Pour toute question, contactez <strong>Mehdi Alaoui</strong> via WhatsApp.</p>
          </div>
        </div>
      )}

      {/* ── Section: Documents finaux ── */}
      {activeSection === 'finaux' && (
        <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'20px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', animation:'fadeIn 0.3s ease' }}>
          <p style={{ margin:'0 0 6px', fontSize:'11px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a' }}>Documents officiels finaux</p>
          <p style={{ margin:'0 0 20px', fontSize:'12px', color:'#9ca3af' }}>Disponibles après l'obtention de votre numéro ORIAS</p>

          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {DOCS_FINAUX.map(doc => (
              <div key={doc.id}
                style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px', borderRadius:'14px', border:'1px solid #e8e2d6', background:'#fafafa', opacity: 0.7 }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'20px' }}>
                  🔒
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontWeight:'600', color:'#9ca3af', fontSize:'13px' }}>{doc.name}</p>
                  <p style={{ margin:'3px 0 0', fontSize:'11px', color:'#d1d5db' }}>Disponible après obtention ORIAS</p>
                </div>
                <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:'#f3f4f6', color:'#9ca3af', border:'1px solid #e5e7eb', flexShrink:0 }}>
                  Verrouillé
                </span>
              </div>
            ))}
          </div>

          {/* Progress hint */}
          <div style={{ marginTop:'20px', padding:'20px', borderRadius:'16px', background:'linear-gradient(135deg, rgba(26,61,43,0.04), rgba(201,168,76,0.04))', border:'1px solid rgba(201,168,76,0.15)', textAlign:'center' }}>
            <p style={{ margin:'0 0 6px', fontSize:'24px' }}>🎯</p>
            <p style={{ margin:'0 0 4px', fontWeight:'700', color:'#1a3d2b', fontSize:'14px' }}>Complétez votre dossier ORIAS</p>
            <p style={{ margin:0, fontSize:'12px', color:'#6b7280', lineHeight:'1.6' }}>Une fois votre immatriculation obtenue, tous ces documents seront automatiquement disponibles au téléchargement.</p>
          </div>
        </div>
      )}
    </div>
  )
}
