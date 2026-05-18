import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchDossier,
  createDossierIfNeeded,
} from '../../lib/api'
import { DOSSIER_STEPS } from '../../data/mockData'
import {
  CheckCircleIcon, ClockIcon, LockIcon, WhatsAppIcon,
} from '../../components/Icons'

const STEP_LABELS_FULL = [
  { id: 1, description: "Premier entretien avec votre conseiller pour évaluer votre projet et définir les étapes." },
  { id: 2, description: "Rassemblement et vérification de tous les documents nécessaires à votre dossier ORIAS." },
  { id: 3, description: "Création ou validation de votre structure juridique (SASU, SAS, auto-entrepreneur…)." },
  { id: 4, description: "Envoi officiel de votre dossier complet à l'ORIAS pour immatriculation." },
  { id: 5, description: "Réception de votre numéro ORIAS et validation officielle de votre statut d'intermédiaire." },
  { id: 6, description: "Vous êtes officiellement autorisé à exercer ! Lancement de votre activité." },
]

// ── Toast ─────────────────────────────────────────────────────
function Toast({ toasts, onDismiss }) {
  return (
    <div style={{ position:'fixed', top:'1rem', right:'1rem', zIndex:50, display:'flex', flexDirection:'column', gap:'8px', pointerEvents:'none', maxWidth:'360px' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'flex-start', gap:'10px',
          padding:'12px 16px', borderRadius:'14px',
          border: t.type==='success' ? '1px solid rgba(16,185,129,0.3)' : t.type==='error' ? '1px solid rgba(239,68,68,0.3)' : t.type==='warning' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(201,168,76,0.2)',
          background: t.type==='success' ? 'rgba(16,185,129,0.1)' : t.type==='error' ? 'rgba(239,68,68,0.1)' : t.type==='warning' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.9)',
          backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
          boxShadow:'0 8px 30px rgba(0,0,0,0.15)',
          pointerEvents:'auto', color: t.type==='success' ? '#10b981' : t.type==='error' ? '#ef4444' : t.type==='warning' ? '#f59e0b' : '#1a3d2b',
          fontFamily:"'Montserrat', sans-serif", fontSize:'13px',
        }}>
          <span style={{flexShrink:0}}>{t.type==='success'?'✅':t.type==='error'?'❌':t.type==='warning'?'⚠️':'ℹ️'}</span>
          <p style={{flex:1, margin:0, lineHeight:'1.4'}}>{t.message}</p>
          <button onClick={()=>onDismiss(t.id)} style={{background:'none',border:'none',cursor:'pointer',opacity:0.5,flexShrink:0,color:'inherit',fontSize:'14px'}}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Step Icon ─────────────────────────────────────────────────
function StepIcon({ status }) {
  if (status === 'done')    return <CheckCircleIcon className="w-5 h-5 text-white" />
  if (status === 'current') return <ClockIcon className="w-5 h-5 text-white" />
  return <LockIcon className="w-4 h-4 text-gray-400" />
}

// ── Main ──────────────────────────────────────────────────────
export default function MonDossier() {
  const { user } = useAuth()

  const [steps,         setSteps]         = useState(DOSSIER_STEPS)
  const [dossierNumber, setDossierNumber] = useState('OR-2026-0001')
  const [status,        setStatus]        = useState('En cours')
  const [currentStep,   setCurrentStep]   = useState(4)
  const [loadingData,   setLoadingData]   = useState(true)
  const [selectedStep,  setSelectedStep]  = useState(null)
  const [toasts,        setToasts]        = useState([])
  const toastIdRef = useRef(0)

  const pushToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const dismissToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  useEffect(() => {
    if (!user?.id) { setLoadingData(false); return }
    createDossierIfNeeded(user.id).then(() =>
      fetchDossier(user.id).then(dossierData => {
          setSteps(dossierData.steps); setDossierNumber(dossierData.dossierNumber)
          setStatus(dossierData.status); setCurrentStep(dossierData.currentStep)
        }).finally(() => setLoadingData(false))
    )
    }, [user?.id, handleDocChange])

  const completedCount = steps.filter(s => s.status === 'done').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .doc-row-hover:hover { background: rgba(255,255,255,0.06) !important; transform: translateX(2px); }
        .step-btn:hover .step-circle { transform: scale(1.1); box-shadow: 0 0 20px rgba(201,168,76,0.3) !important; }
        .upload-btn:hover:not(:disabled) { background: linear-gradient(135deg, #2d6b45, #3d8b5e) !important; box-shadow: 0 4px 20px rgba(45,107,69,0.5) !important; transform: translateY(-1px); }
      `}</style>

      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div style={{ display:'flex', flexDirection:'column', gap:'24px', animation:'fadeIn 0.5s ease' }}>

        {/* ── Dossier Overview Card ── */}
        <div style={{ background:'linear-gradient(135deg, rgba(26,61,43,0.8) 0%, rgba(13,40,24,0.9) 100%)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:'20px', padding:'28px', backdropFilter:'blur(10px)', boxShadow:'0 4px 30px rgba(0,0,0,0.2)' }}>
          {/* Top bar */}
          <div style={{ height:'2px', background:'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginBottom:'24px', borderRadius:'2px' }} />

          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', marginBottom:'28px' }}>
            <div>
              <h2 style={{ margin:0, fontSize:'26px', fontWeight:'400', color:'#ffffff', fontFamily:"'Cormorant Garamond', serif", letterSpacing:'1px' }}>Mon Dossier ORIAS</h2>
              <p style={{ margin:'4px 0 0', fontSize:'13px', color:'rgba(255,255,255,0.65)', fontFamily:"'Montserrat', sans-serif", fontWeight:'300' }}>Suivi de votre immatriculation en temps réel</p>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
              {[
                { label:'N° Dossier', value: dossierNumber, color:'#c9a84c' },
                { label:'Pack', value: user?.pack ?? 'Essentiel', color:'#c9a84c' },
                { label:'Statut', value: status, color:'#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'8px 16px' }}>
                  <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.6)', fontFamily:"'Montserrat', sans-serif", fontWeight:'600', letterSpacing:'1px', textTransform:'uppercase' }}>{label}</p>
                  <p style={{ margin:'2px 0 0', fontWeight:'700', color, fontSize:'14px', fontFamily:"'Montserrat', sans-serif" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {loadingData ? (
            <div style={{ height:'80px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg style={{ animation:'spin 1s linear infinite', width:'28px', height:'28px', color:'#c9a84c' }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75"/>
              </svg>
            </div>
          ) : (
            <>
              {/* Steps timeline */}
              <div style={{ position:'relative', marginBottom:'8px' }}>
                {/* Connector line */}
                <div style={{ position:'absolute', top:'20px', left:'calc(100%/12)', right:'calc(100%/12)', height:'2px', background:'rgba(255,255,255,0.08)', display:'none' }} className="sm-show" />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'8px', position:'relative', zIndex:1 }}>
                  {steps.map(step => (
                    <button key={step.id} className="step-btn"
                      onClick={() => setSelectedStep(selectedStep?.id === step.id ? null : step)}
                      style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'8px', padding:'4px' }}>
                      <div className="step-circle" style={{
                        width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                        transition:'all 0.3s',
                        background: step.status==='done' ? 'linear-gradient(135deg, #1a4a2e, #2d6b45)' : step.status==='current' ? 'linear-gradient(135deg, #c9a84c, #f0d080)' : 'rgba(255,255,255,0.05)',
                        border: step.status==='done' ? '2px solid rgba(45,107,69,0.6)' : step.status==='current' ? '2px solid #c9a84c' : '2px solid rgba(255,255,255,0.1)',
                        boxShadow: step.status==='current' ? '0 0 20px rgba(201,168,76,0.4)' : 'none',
                      }}>
                        <StepIcon status={step.status} />
                      </div>
                      <p style={{ margin:0, fontSize:'10px', fontWeight:'600', fontFamily:"'Montserrat', sans-serif", lineHeight:'1.3',
                        color: step.status==='done' ? '#6ee7b7' : step.status==='current' ? '#fcd34d' : 'rgba(255,255,255,0.5)',
                      }}>{step.label}</p>
                      <p style={{ margin:0, fontSize:'9px', fontFamily:"'Montserrat', sans-serif",
                        color: step.status==='done' ? 'rgba(110,231,183,0.9)' : step.status==='current' ? 'rgba(252,211,77,0.9)' : 'rgba(255,255,255,0.4)',
                      }}>
                        {step.status==='done' ? 'Complété' : step.status==='current' ? 'En cours' : 'En attente'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedStep && (
                <div style={{ marginTop:'16px', padding:'16px', borderRadius:'14px', fontSize:'13px', fontFamily:"'Montserrat', sans-serif",
                  background: selectedStep.status==='done' ? 'rgba(16,185,129,0.08)' : selectedStep.status==='current' ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedStep.status==='done' ? 'rgba(16,185,129,0.2)' : selectedStep.status==='current' ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  color: selectedStep.status==='done' ? '#6ee7b7' : selectedStep.status==='current' ? '#fcd34d' : 'rgba(255,255,255,0.7)',
                }}>
                  <p style={{ margin:'0 0 4px', fontWeight:'600' }}>Étape {selectedStep.id} — {selectedStep.label}</p>
                  <p style={{ margin:0, opacity:0.8 }}>{STEP_LABELS_FULL.find(s => s.id === selectedStep.id)?.description}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Main grid ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'24px' }} className="lg-grid">
          <style>{`.lg-grid { @media (min-width:1024px) { grid-template-columns: 2fr 1fr !important; } }`}</style>

          {/* Documents */}
          <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'20px', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            {/* Header */}
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'12px', marginBottom:'20px' }}>
              <h3 style={{ margin:0, fontSize:'18px', fontWeight:'600', color:'#1a3d2b', fontFamily:"'Cormorant Garamond', serif", letterSpacing:'0.5px' }}>Documents du dossier</h3>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:'rgba(16,185,129,0.1)', color:'#10b981', border:'1px solid rgba(16,185,129,0.25)', fontFamily:"'Montserrat', sans-serif" }}>
                  ✓ {validDocs} validé{validDocs>1?'s':''}
                </span>
                {pendingDocs > 0 && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:'rgba(245,158,11,0.1)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.25)', fontFamily:"'Montserrat', sans-serif" }}>
                    ⏳ {pendingDocs} en attente
                  </span>
                )}
                {missingDocs > 0 && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.1)', fontFamily:"'Montserrat', sans-serif" }}>
                    — {missingDocs} manquant{missingDocs>1?'s':''}
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <span style={{ fontSize:'11px', color:'#6b7280', fontFamily:"'Montserrat', sans-serif" }}>Documents complétés</span>
                <span style={{ fontSize:'11px', fontWeight:'700', color:'#1a3d2b', fontFamily:"'Montserrat', sans-serif" }}>{validDocs} / {REQUIRED_DOCUMENTS.length}</span>
              </div>
              <div style={{ height:'6px', background:'#e5e7eb', borderRadius:'10px', overflow:'hidden' }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg, #c9a84c, #f0d080)', borderRadius:'10px', width:`${progressPct}%`, transition:'width 0.7s ease' }} />
              </div>
            </div>

            {/* Doc rows */}
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {REQUIRED_DOCUMENTS.map(req => (
                <DocRow key={req.id} required={req} doc={docs[req.id]} uploading={!!uploading[req.id]} onUpload={handleUpload} />
              ))}
            </div>

            {/* Info */}
            <div style={{ marginTop:'16px', display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px 16px', borderRadius:'14px', background:'#fefce8', border:'1px solid #fde68a', fontSize:'12px', color:'#78716c', fontFamily:"'Montserrat', sans-serif" }}>
              <span style={{flexShrink:0}}>ℹ️</span>
              <p style={{margin:0, lineHeight:'1.6'}}>Formats acceptés : <strong style={{color:'#b45309'}}>PDF, JPG, PNG</strong> — max 10 Mo par fichier. Les documents sont vérifiés sous <strong style={{color:'#b45309'}}>24–48h</strong> par votre conseiller.</p>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Conseiller card */}
            <div style={{ background:'linear-gradient(135deg, #1a4a2e 0%, #0d2818 100%)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'20px', padding:'24px', boxShadow:'0 8px 30px rgba(0,0,0,0.2)' }}>
              <p style={{ margin:'0 0 16px', fontSize:'10px', fontWeight:'600', letterSpacing:'2px', textTransform:'uppercase', color:'rgba(201,168,76,0.7)', fontFamily:"'Montserrat', sans-serif" }}>Votre Conseiller Dédié</p>
              <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'rgba(201,168,76,0.15)', border:'2px solid rgba(201,168,76,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'700', color:'#c9a84c', flexShrink:0, fontFamily:"'Montserrat', sans-serif" }}>MA</div>
                <div>
                  <p style={{ margin:0, fontWeight:'600', color:'#f5f0e8', fontSize:'16px', fontFamily:"'Cormorant Garamond', serif" }}>Mehdi Alaoui</p>
                  <p style={{ margin:'2px 0 0', fontSize:'12px', color:'rgba(201,168,76,0.7)', fontFamily:"'Montserrat', sans-serif", fontWeight:'300' }}>Conseiller ORIAS</p>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
                {[
                  { icon:'🕐', text:'Disponible 9h – 20h GMT+1' },
                  { icon:'📅', text:'Lundi – Samedi' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'rgba(255,255,255,0.65)', fontFamily:"'Montserrat', sans-serif" }}>
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
              <a href="https://wa.me/33600000000" target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'13px', borderRadius:'14px', fontWeight:'600', color:'#fff', background:'linear-gradient(135deg, #25d366, #1db954)', textDecoration:'none', fontSize:'13px', fontFamily:"'Montserrat', sans-serif", boxShadow:'0 4px 20px rgba(37,211,102,0.25)', transition:'all 0.2s' }}>
                <WhatsAppIcon className="w-5 h-5" />
                Contacter sur WhatsApp
              </a>
            </div>

            {/* Current step */}
            <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'16px', padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ margin:'0 0 12px', fontSize:'10px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a', fontFamily:"'Montserrat', sans-serif" }}>Étape actuelle</p>
              <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'12px', fontWeight:'700', color:'#c9a84c', fontFamily:"'Montserrat', sans-serif" }}>{currentStep}</span>
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:'600', color:'#1a3d2b', fontSize:'14px', fontFamily:"'Montserrat', sans-serif" }}>{steps.find(s => s.status === 'current')?.label ?? 'Terminé'}</p>
                  <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#6b7280', fontFamily:"'Montserrat', sans-serif" }}>Cliquez sur une étape pour voir les détails.</p>
                </div>
              </div>
            </div>

            {/* Doc summary */}
            <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'16px', padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ margin:'0 0 14px', fontSize:'10px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a', fontFamily:"'Montserrat', sans-serif" }}>Résumé documents</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {[
                  { label:'Validés', value:`${validDocs} / ${REQUIRED_DOCUMENTS.length}`, color:'#10b981' },
                  { label:'En attente', value: pendingDocs, color:'#f59e0b' },
                  { label:'Manquants', value: missingDocs, color:'#6b7280' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'13px' }}>
                    <span style={{ color:'#4b5563', fontFamily:"'Montserrat', sans-serif" }}>{label}</span>
                    <span style={{ fontWeight:'700', color, fontFamily:"'Montserrat', sans-serif" }}>{value}</span>
                  </div>
                ))}
                <div style={{ paddingTop:'10px', borderTop:'1px solid #f3f4f6' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                    <span style={{ fontSize:'11px', color:'#6b7280', fontFamily:"'Montserrat', sans-serif" }}>Complétude</span>
                    <span style={{ fontSize:'11px', fontWeight:'700', color:'#1a3d2b', fontFamily:"'Montserrat', sans-serif" }}>{progressPct}%</span>
                  </div>
                  <div style={{ height:'4px', background:'#e5e7eb', borderRadius:'10px', overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'linear-gradient(90deg, #c9a84c, #f0d080)', borderRadius:'10px', width:`${progressPct}%`, transition:'width 0.7s ease' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
