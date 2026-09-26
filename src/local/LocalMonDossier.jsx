import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ClockIcon, LockIcon } from '../components/Icons'
import { getActiveClientId } from './adapters/identity'
import { getDossierStep, subscribeToDossierSteps } from './dossierStepStore'
import { ORIAS_STEPS, defaultStepIndexFor } from './clientsOverviewData'
import { getClientDocuments, subscribeToDocuments } from './documentsStore'
import { REQUIRED_DOCUMENTS } from '../data/mockData'
import { getFormationState, subscribeToFormationProgress } from './formationProgressStore'
import { cleanPreviewLeads } from './model'

const CRM_STORAGE_KEY = 'oriafen-isolated-crm-v1'

// Reprend la structure/le style (styles inline) de
// src/pages/student/MonDossier.jsx (fichier live non modifié) — MAIS les
// chiffres viennent désormais des MÊMES stores que les pages détaillées
// (dossierStepStore / documentsStore / formationProgressStore), au lieu de
// constantes statiques de démonstration (STEPS/FORMATION_UNITS/VALID_DOCS
// etc. codées en dur) — corrige la désynchronisation entre ce widget
// résumé et les onglets Dossiers/Formation IAS1/Documents pour le même
// client (audit "final data consistency" 2026-09-20).

// Libellés + descriptions restent statiques (contenu éditorial, jamais une
// donnée métier) — mêmes 6 étapes que ORIAS_STEPS (clientsOverviewData.js,
// même store que l'onglet admin "Dossiers"), avec leur description longue.
const STEP_META = [
  { label: 'Consultation initiale', description: "Premier entretien avec votre conseiller pour évaluer votre projet et définir les étapes." },
  { label: 'Montage dossier', description: "Rassemblement et vérification de tous les documents nécessaires à votre dossier ORIAS." },
  { label: 'Structure juridique', description: "Création ou validation de votre structure juridique (SASU, SAS, auto-entrepreneur…)." },
  { label: 'Soumission ORIAS', description: "Envoi officiel de votre dossier complet à l'ORIAS pour immatriculation." },
  { label: 'Obtention ORIAS', description: "Réception de votre numéro ORIAS et validation officielle de votre statut d'intermédiaire." },
  { label: 'Lancement activité', description: "Vous êtes officiellement autorisé à exercer ! Lancement de votre activité." },
]

function StepIcon({ status }) {
  if (status === 'done') return <CheckCircleIcon className="w-5 h-5 text-white" />
  if (status === 'current') return <ClockIcon className="w-5 h-5 text-white" />
  return <LockIcon className="w-4 h-4 text-gray-400" />
}

export default function LocalMonDossier({ clientId = getActiveClientId() }) {
  const [selectedStep, setSelectedStep] = useState(null)
  const [, forceRefresh] = useState(0)
  useEffect(() => {
    const unsub = [
      subscribeToDossierSteps(() => forceRefresh(n => n + 1)),
      subscribeToDocuments(() => forceRefresh(n => n + 1)),
      subscribeToFormationProgress(() => forceRefresh(n => n + 1)),
    ]
    return () => unsub.forEach(u => u())
  }, [])

  // Correctif "Pack Accélération" en dur (audit inspection navigateur,
  // 2026-09-24) : ce widget affichait toujours ce pack, quel que soit le
  // pack réellement choisi/payé par le prospect converti — même correctif
  // que l'en-tête ClientSpace dans LocalCRM.jsx, même lecture directe du
  // lead réel (aucun store dédié "pack du client" n'existe séparément).
  const clientLead = (() => { try { const raw = JSON.parse(localStorage.getItem(CRM_STORAGE_KEY)); return cleanPreviewLeads(raw || []).find(l => l.id === clientId) || null } catch { return null } })()
  // Correctif "numéro de dossier dupliqué OR-2026-1236" (audit inspection
  // navigateur, 2026-09-26) : identique en dur pour tous les clients —
  // dérivé désormais du clientId (déterministe, unique par client, jamais
  // stocké séparément puisqu'aucune donnée réelle "numéro de dossier"
  // n'existe ailleurs dans ce store local).
  const dossierNumber = `OR-${new Date().getFullYear()}-${String(Math.abs(Number(clientId) || 0) % 9000 + 1000)}`
  const pack = clientLead?.pack || 'Non renseigné'
  const status = 'En cours'

  // Étape courante : MÊME store que l'onglet admin "Dossiers"
  // (dossierStepStore.js) — jamais une valeur figée par étape.
  const currentStep = getDossierStep(clientId, defaultStepIndexFor(clientId) + 1)
  const STEPS = ORIAS_STEPS.map((label, i) => ({
    id: i + 1,
    label,
    description: STEP_META[i]?.description ?? '',
    status: i + 1 < currentStep ? 'done' : i + 1 === currentStep ? 'current' : 'locked',
  }))

  // Documents : MÊME store que la page "Documents" (documentsStore.js).
  const docs = getClientDocuments(clientId)
  const VALID_DOCS = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'valid').length
  const PENDING_DOCS = REQUIRED_DOCUMENTS.filter(r => docs[r.id]?.status === 'pending').length
  const REQUIRED_DOCUMENTS_COUNT = REQUIRED_DOCUMENTS.length
  const MISSING_DOCS = REQUIRED_DOCUMENTS_COUNT - VALID_DOCS - PENDING_DOCS
  const PROGRESS_PCT = REQUIRED_DOCUMENTS_COUNT > 0 ? Math.round((VALID_DOCS / REQUIRED_DOCUMENTS_COUNT) * 100) : 0

  // Formation : MÊME store que la page "Formation IAS1"
  // (formationProgressStore.js) — mêmes 5 unités, mêmes heures réelles.
  const { units: FORMATION_UNITS } = getFormationState(clientId)
  const DISPLAYED_FORMATION_UNITS = FORMATION_UNITS.slice(0, 3).map(u => ({ id: u.id, title: u.title, status: u.status, totalHours: u.totalHours, completedHours: u.completedHours }))
  const totalH = FORMATION_UNITS.reduce((s, u) => s + u.totalHours, 0)
  const doneH = FORMATION_UNITS.reduce((s, u) => s + u.completedHours, 0)
  const formationPct = totalH > 0 ? Math.round((doneH / totalH) * 100) : 0

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .step-btn:hover .step-circle { transform: scale(1.1); box-shadow: 0 0 20px rgba(201,168,76,0.3) !important; }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', gap:'24px', animation:'fadeIn 0.5s ease' }}>

        {/* ── Dossier Overview Card ── */}
        <div style={{ background:'linear-gradient(135deg, rgba(26,61,43,0.8) 0%, rgba(13,40,24,0.9) 100%)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:'20px', padding:'28px', backdropFilter:'blur(10px)', boxShadow:'0 4px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ height:'2px', background:'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginBottom:'24px', borderRadius:'2px' }} />

          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', marginBottom:'28px' }}>
            <div>
              <h2 style={{ margin:0, fontSize:'26px', fontWeight:'400', color:'#ffffff', fontFamily:"'Cormorant Garamond', serif", letterSpacing:'1px' }}>Mon Dossier ORIAS</h2>
              <p style={{ margin:'4px 0 0', fontSize:'13px', color:'rgba(255,255,255,0.65)', fontFamily:"'Montserrat', sans-serif", fontWeight:'300' }}>Suivi de votre immatriculation en temps réel</p>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
              {[
                { label:'N° Dossier', value: dossierNumber, color:'#c9a84c' },
                { label:'Pack', value: pack, color:'#c9a84c' },
                { label:'Statut', value: status, color:'#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'8px 16px' }}>
                  <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.6)', fontFamily:"'Montserrat', sans-serif", fontWeight:'600', letterSpacing:'1px', textTransform:'uppercase' }}>{label}</p>
                  <p style={{ margin:'2px 0 0', fontWeight:'700', color, fontSize:'14px', fontFamily:"'Montserrat', sans-serif" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Steps timeline */}
          <div style={{ position:'relative', marginBottom:'8px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'8px', position:'relative', zIndex:1 }}>
              {STEPS.map(step => (
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
              <p style={{ margin:0, opacity:0.8 }}>{selectedStep.description}</p>
            </div>
          )}
        </div>

        {/* ── Main grid ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'24px' }} className="lg-grid">
          <style>{`.lg-grid { @media (min-width:1024px) { grid-template-columns: 2fr 1fr !important; } }`}</style>

          {/* Infos & Formation */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Documents résumé rapide */}
            <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'16px', padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ margin:'0 0 14px', fontSize:'10px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a', fontFamily:"'Montserrat', sans-serif" }}>📋 Documents ORIAS</p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                <span style={{ fontSize:'13px', color:'#4b5563', fontFamily:"'Montserrat', sans-serif" }}>Progression</span>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#1a3d2b', fontFamily:"'Montserrat', sans-serif" }}>{VALID_DOCS} / {REQUIRED_DOCUMENTS_COUNT} validés</span>
              </div>
              <div style={{ height:'8px', background:'#e5e7eb', borderRadius:'10px', overflow:'hidden', marginBottom:'12px' }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg, #c9a84c, #f0d080)', borderRadius:'10px', width:`${PROGRESS_PCT}%`, transition:'width 0.7s ease' }} />
              </div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {[
                  { label:'Validés', value: VALID_DOCS, color:'#10b981', bg:'#d1fae5' },
                  { label:'En attente', value: PENDING_DOCS, color:'#d97706', bg:'#fef3c7' },
                  { label:'Manquants', value: MISSING_DOCS, color:'#6b7280', bg:'#f3f4f6' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ flex:1, minWidth:'70px', textAlign:'center', padding:'8px', borderRadius:'10px', background:bg }}>
                    <p style={{ margin:0, fontSize:'18px', fontWeight:'700', color, fontFamily:"'Montserrat', sans-serif" }}>{value}</p>
                    <p style={{ margin:0, fontSize:'10px', color, fontFamily:"'Montserrat', sans-serif", opacity:0.8 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formation IAS1 progression */}
            <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'16px', padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ margin:'0 0 14px', fontSize:'10px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a', fontFamily:"'Montserrat', sans-serif" }}>🎓 Formation IAS1</p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'13px', color:'#4b5563', fontFamily:"'Montserrat', sans-serif" }}>Progression globale</span>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#1a3d2b', fontFamily:"'Montserrat', sans-serif" }}>{doneH} / {totalH}h</span>
              </div>
              <div style={{ height:'8px', background:'#e5e7eb', borderRadius:'10px', overflow:'hidden', marginBottom:'12px' }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg, #1a3d2b, #2d6b45)', borderRadius:'10px', width:`${formationPct}%`, transition:'width 0.7s ease' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {DISPLAYED_FORMATION_UNITS.map(u => (
                  <div key={u.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:'8px', background: u.status==='completed' ? '#f0fdf4' : u.status==='in_progress' ? '#fefce8' : '#f9fafb' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'12px' }}>{u.status==='completed' ? '✅' : u.status==='in_progress' ? '⏳' : '🔒'}</span>
                      <span style={{ fontSize:'12px', color: u.status==='locked' ? '#9ca3af' : '#1a3d2b', fontFamily:"'Montserrat', sans-serif", fontWeight:'500' }}>{u.title}</span>
                    </div>
                    <span style={{ fontSize:'11px', fontWeight:'600', color: u.status==='completed' ? '#10b981' : u.status==='in_progress' ? '#d97706' : '#9ca3af', fontFamily:"'Montserrat', sans-serif" }}>{u.completedHours}/{u.totalHours}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conseils pratiques */}
            <div style={{ background:'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(26,61,43,0.04))', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'16px', padding:'20px' }}>
              <p style={{ margin:'0 0 12px', fontSize:'10px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a', fontFamily:"'Montserrat', sans-serif" }}>💡 Conseils pratiques</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {[
                  'Tous vos documents doivent dater de moins de 3 mois',
                  'Le Kbis doit être en cours de validité',
                  "La RCP doit couvrir votre activité d'intermédiaire",
                  'Votre attestation IAS1 doit être certifiante (150h)',
                ].map((tip, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'12px', color:'#4b5563', fontFamily:"'Montserrat', sans-serif", lineHeight:'1.5' }}>
                    <span style={{ color:'#c9a84c', fontWeight:'700', flexShrink:0 }}>✓</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right sidebar */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Current step */}
            <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'16px', padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ margin:'0 0 12px', fontSize:'10px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a', fontFamily:"'Montserrat', sans-serif" }}>Étape actuelle</p>
              <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'12px', fontWeight:'700', color:'#c9a84c', fontFamily:"'Montserrat', sans-serif" }}>{currentStep}</span>
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:'600', color:'#1a3d2b', fontSize:'14px', fontFamily:"'Montserrat', sans-serif" }}>{STEPS.find(s => s.status === 'current')?.label ?? 'Terminé'}</p>
                  <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#6b7280', fontFamily:"'Montserrat', sans-serif" }}>Cliquez sur une étape pour voir les détails.</p>
                </div>
              </div>
            </div>

            {/* Doc summary */}
            <div style={{ background:'#ffffff', border:'1px solid #e8e2d6', borderRadius:'16px', padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ margin:'0 0 14px', fontSize:'10px', fontWeight:'600', letterSpacing:'1.5px', textTransform:'uppercase', color:'#c49a2a', fontFamily:"'Montserrat', sans-serif" }}>Résumé documents</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {[
                  { label:'Validés', value:`${VALID_DOCS} / ${REQUIRED_DOCUMENTS_COUNT}`, color:'#10b981' },
                  { label:'En attente', value: PENDING_DOCS, color:'#f59e0b' },
                  { label:'Manquants', value: MISSING_DOCS, color:'#6b7280' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'13px' }}>
                    <span style={{ color:'#4b5563', fontFamily:"'Montserrat', sans-serif" }}>{label}</span>
                    <span style={{ fontWeight:'700', color, fontFamily:"'Montserrat', sans-serif" }}>{value}</span>
                  </div>
                ))}
                <div style={{ paddingTop:'10px', borderTop:'1px solid #f3f4f6' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                    <span style={{ fontSize:'11px', color:'#6b7280', fontFamily:"'Montserrat', sans-serif" }}>Complétude</span>
                    <span style={{ fontSize:'11px', fontWeight:'700', color:'#1a3d2b', fontFamily:"'Montserrat', sans-serif" }}>{PROGRESS_PCT}%</span>
                  </div>
                  <div style={{ height:'4px', background:'#e5e7eb', borderRadius:'10px', overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'linear-gradient(90deg, #c9a84c, #f0d080)', borderRadius:'10px', width:`${PROGRESS_PCT}%`, transition:'width 0.7s ease' }} />
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
