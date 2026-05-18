import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { saveExamResult } from '../../lib/api'
import { CALL_SCRIPTS, PRODUCT_SCRIPTS, OBJECTIONS, CALL_SCENARIOS, COMMERCIAL_QUIZ } from '../../data/mockData'
import { PhoneIcon, StarIcon, PlayIcon, AwardIcon, ChevronDownIcon, ChevronRightIcon, DownloadIcon, CheckCircleIcon } from '../../components/Icons'

// ─────────────────────────────────────────────────────────────
// Certificate (logique intacte)
// ─────────────────────────────────────────────────────────────
function openCommercialCertificate(userName, score) {
  const pct = Math.round((score / COMMERCIAL_QUIZ.length) * 100)
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Certificat Commercial — Oriafen Academy</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:Georgia,serif;background:#f9f7f3;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:40px 20px;}
    .cert{background:#fff;border:8px solid #1a3d2b;max-width:780px;width:100%;padding:60px 70px;text-align:center;position:relative;}
    .cert::before{content:'';position:absolute;inset:12px;border:2px solid #c49a2a;pointer-events:none;}
    .logo{color:#c49a2a;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;}
    .org{color:#1a3d2b;font-size:28px;font-weight:bold;margin-bottom:40px;}
    .type{color:#555;font-size:12px;text-transform:uppercase;letter-spacing:4px;margin-bottom:16px;}
    .title{color:#1a3d2b;font-size:32px;font-weight:bold;margin-bottom:32px;}
    .certifies{color:#444;font-size:15px;margin-bottom:12px;}
    .name{color:#1a3d2b;font-size:30px;font-style:italic;font-weight:bold;border-bottom:2px solid #c49a2a;display:inline-block;padding-bottom:6px;margin-bottom:28px;}
    .body{color:#444;font-size:15px;line-height:1.9;margin-bottom:36px;}
    .score{color:#c49a2a;font-weight:bold;font-size:18px;}
    .footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:50px;padding-top:30px;border-top:1px solid #e8e2d6;font-size:12px;color:#888;}
    .seal{width:72px;height:72px;border-radius:50%;border:3px solid #1a3d2b;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:8px;color:#1a3d2b;font-weight:bold;letter-spacing:0.5px;line-height:1.4;}
    @media print{body{background:#fff;padding:0;}}
  </style>
</head>
<body>
  <div class="cert">
    <div class="logo">Oriafen Academy</div>
    <div class="org">ORIAFEN ACADEMY</div>
    <div class="type">Certificat de Compétences Commerciales</div>
    <div class="title">Techniques de Vente en Assurance</div>
    <div class="certifies">Oriafen Academy certifie que</div>
    <div class="name">${userName}</div>
    <div class="body">
      a réussi l'évaluation de Formation Commerciale<br>
      avec un score de <span class="score">${score}/${COMMERCIAL_QUIZ.length} (${pct}%)</span><br>
      Maîtrise des scripts d'appel, gestion des objections<br>
      et techniques de closing en assurance
    </div>
    <div class="footer">
      <div>
        <div>Délivré le ${new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}</div>
        <div style="margin-top:4px">Oriafen Academy · Paris, France</div>
      </div>
      <div class="seal"><div>ORIAFEN</div><div>ACADEMY</div><div>✓ COM</div></div>
      <div style="text-align:right">
        <div>Mehdi Alaoui</div>
        <div style="margin-top:4px">Directeur pédagogique</div>
      </div>
    </div>
  </div>
  <script>window.onload=()=>window.print()</script>
</body>
</html>`
  const blob = new Blob([html], { type: 'text/html' })
  window.open(URL.createObjectURL(blob), '_blank')
}

// ─────────────────────────────────────────────────────────────
// Quiz (logique intacte)
// ─────────────────────────────────────────────────────────────
function CommercialQuiz({ userName, userId, onDone }) {
  const [current,  setCurrent]  = useState(0)
  const [answers,  setAnswers]  = useState({})
  const [selected, setSelected] = useState(null)
  const [result,   setResult]   = useState(null)
  const [saving,   setSaving]   = useState(false)

  const q     = COMMERCIAL_QUIZ[current]
  const total = COMMERCIAL_QUIZ.length

  const next = async () => {
    const updated = { ...answers, [current]: selected }
    setAnswers(updated)
    if (current < total - 1) {
      setCurrent(current + 1)
      setSelected(null)
    } else {
      setSaving(true)
      const score  = COMMERCIAL_QUIZ.reduce((s, _, i) => s + (updated[i] === COMMERCIAL_QUIZ[i].correct ? 1 : 0), 0)
      const passed = (score / total) >= 0.7
      await saveExamResult(userId, 'commercial', score, total)
      setResult({ score, passed })
      setSaving(false)
    }
  }

  if (result) {
    return (
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{
          background:'#fff', borderRadius:16, border:`2px solid ${result.passed ? '#c9a84c' : '#fca5a5'}`,
          padding:'40px 32px', textAlign:'center', marginBottom:20,
          boxShadow:'0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width:80, height:80, borderRadius:'50%', margin:'0 auto 20px',
            background: result.passed ? 'rgba(201,168,76,0.12)' : 'rgba(252,165,165,0.15)',
            border:`2px solid ${result.passed ? '#c9a84c' : '#fca5a5'}`,
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <AwardIcon style={{ width:36, height:36, color: result.passed ? '#c9a84c' : '#f87171' }} />
          </div>
          <h2 style={{ fontSize:22, fontWeight:700, color:'#1a3d2b', marginBottom:8 }}>
            {result.passed ? '🎉 Félicitations !' : 'Score insuffisant'}
          </h2>
          <div style={{ fontSize:52, fontWeight:800, color:'#1a3d2b', lineHeight:1.1, margin:'16px 0 4px' }}>
            {result.score}<span style={{ fontSize:24, color:'#9ca3af', fontWeight:400 }}>/{total}</span>
          </div>
          <p style={{ fontSize:15, color:'#6b7280', marginBottom:24 }}>
            {result.passed
              ? "Vous avez validé l'évaluation commerciale avec plus de 70%. Votre certificat est disponible."
              : `Score minimum requis : 70% (${Math.ceil(total * 0.7)}/${total}). Révisez les modules et retentez.`}
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            {result.passed && (
              <button
                onClick={() => openCommercialCertificate(userName, result.score)}
                style={{ display:'flex', alignItems:'center', gap:8, background:'#1a3d2b', color:'#c9a84c', border:'none', borderRadius:10, padding:'12px 24px', fontWeight:700, fontSize:14, cursor:'pointer' }}
              >
                <DownloadIcon style={{ width:16, height:16 }} /> Télécharger mon certificat
              </button>
            )}
            <button
              onClick={onDone}
              style={{ background:'transparent', color:'#1a3d2b', border:'2px solid #1a3d2b', borderRadius:10, padding:'12px 24px', fontWeight:600, fontSize:14, cursor:'pointer' }}
            >
              Retour à la formation
            </button>
          </div>
        </div>
        <div style={{ background:'#fff', borderRadius:16, padding:'24px 28px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontWeight:700, color:'#1a3d2b', marginBottom:16, fontSize:16 }}>Révision des réponses</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {COMMERCIAL_QUIZ.map((q, i) => {
              const given = answers[i]
              const ok    = given === q.correct
              return (
                <div key={i} style={{
                  padding:'12px 16px', borderRadius:10, fontSize:13,
                  background: ok ? '#f0fdf4' : '#fef2f2',
                  border:`1px solid ${ok ? '#bbf7d0' : '#fecaca'}`
                }}>
                  <p style={{ fontWeight:600, color: ok ? '#15803d' : '#dc2626', marginBottom:4 }}>Q{i+1}. {q.q}</p>
                  {!ok && given !== undefined && <p style={{ color:'#ef4444', marginBottom:2 }}>Votre réponse : {q.options[given]}</p>}
                  <p style={{ color:'#15803d', fontWeight: ok ? 400 : 600 }}>✓ Bonne réponse : {q.options[q.correct]}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth:680, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button
          onClick={onDone}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#6b7280', fontSize:13, cursor:'pointer', fontWeight:500 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:16, height:16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Quitter l'évaluation
        </button>
        <span style={{ fontSize:13, fontWeight:700, color:'#c9a84c' }}>Question {current + 1} / {total}</span>
      </div>
      <div style={{ height:6, background:'#e5e7eb', borderRadius:99, marginBottom:20, overflow:'hidden' }}>
        <div style={{ height:'100%', background:'#c9a84c', borderRadius:99, width:`${((current + 1) / total) * 100}%`, transition:'width 0.3s ease' }} />
      </div>
      <div style={{ background:'#fff', borderRadius:16, padding:'28px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#c9a84c', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Question {current + 1}</p>
        <h3 style={{ fontSize:17, fontWeight:700, color:'#1a3d2b', marginBottom:24, lineHeight:1.5 }}>{q.q}</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              style={{
                width:'100%', textAlign:'left', padding:'14px 16px', borderRadius:10, fontSize:14, cursor:'pointer',
                border:`2px solid ${selected === i ? '#c9a84c' : '#e5e7eb'}`,
                background: selected === i ? 'rgba(201,168,76,0.08)' : '#fff',
                color: selected === i ? '#1a3d2b' : '#374151',
                fontWeight: selected === i ? 600 : 400,
                transition:'all 0.15s ease'
              }}
            >
              <span style={{
                display:'inline-flex', width:26, height:26, borderRadius:'50%', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700, marginRight:12,
                background: selected === i ? '#c9a84c' : 'transparent',
                border:`2px solid ${selected === i ? '#c9a84c' : '#d1d5db'}`,
                color: selected === i ? '#fff' : '#9ca3af'
              }}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
        <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end' }}>
          <button
            onClick={next}
            disabled={selected === null || saving}
            style={{
              display:'flex', alignItems:'center', gap:8,
              background: selected === null ? '#e5e7eb' : '#1a3d2b',
              color: selected === null ? '#9ca3af' : '#c9a84c',
              border:'none', borderRadius:10, padding:'12px 24px', fontWeight:700, fontSize:14,
              cursor: selected === null ? 'not-allowed' : 'pointer', transition:'all 0.2s ease'
            }}
          >
            {saving
              ? <><svg style={{ width:16, height:16, animation:'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Envoi…</>
              : current < total - 1 ? <>Suivant <ChevronRightIcon style={{ width:16, height:16 }} /></> : "Terminer l'évaluation"
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Simulation modal (logique intacte)
// ─────────────────────────────────────────────────────────────
function SimulationModal({ scenario, onClose }) {
  const exchanges = scenario.exchanges
  const [step,    setStep]    = useState(0)
  const [input,   setInput]   = useState('')
  const [history, setHistory] = useState([exchanges[0]])
  const [done,    setDone]    = useState(false)

  const currentExchange = exchanges[step + 1]
  const isAgentTurn = currentExchange?.from === 'agent_prompt'

  const handleSend = () => {
    if (!input.trim()) return
    const newHistory = [...history, { from: 'you', text: input }]
    setInput('')
    const nextStep = step + 2
    if (nextStep < exchanges.length) {
      setHistory([...newHistory, exchanges[nextStep]])
      setStep(nextStep)
    } else {
      setHistory(newHistory)
      setDone(true)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 25px 60px rgba(0,0,0,0.3)', width:'100%', maxWidth:520, overflow:'hidden' }}>
        <div style={{ background:'#1a3d2b', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ color:'#c9a84c', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:3 }}>Simulation en cours</div>
            <h3 style={{ color:'#fff', fontWeight:700, fontSize:16, margin:0 }}>{scenario.title}</h3>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width:18, height:18 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ height:280, overflowY:'auto', padding:16, background:'#f9f7f3', display:'flex', flexDirection:'column', gap:10 }}>
          {history.map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent: m.from === 'you' ? 'flex-end' : 'flex-start' }}>
              {m.from === 'client' && (
                <div style={{ maxWidth:'80%', background:'#fff', border:'1px solid #e5e7eb', borderRadius:'14px 14px 14px 2px', padding:'10px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, marginBottom:4, textTransform:'uppercase' }}>Client</div>
                  <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{m.text}</div>
                </div>
              )}
              {m.from === 'you' && (
                <div style={{ maxWidth:'80%', background:'#1a3d2b', borderRadius:'14px 14px 2px 14px', padding:'10px 14px' }}>
                  <div style={{ fontSize:10, color:'#86efac', fontWeight:700, marginBottom:4, textTransform:'uppercase' }}>Vous</div>
                  <div style={{ fontSize:13, color:'#fff', lineHeight:1.5 }}>{m.text}</div>
                </div>
              )}
            </div>
          ))}
          {done && (
            <div style={{ textAlign:'center', padding:'12px 0' }}>
              <CheckCircleIcon style={{ width:28, height:28, color:'#22c55e', margin:'0 auto 6px' }} />
              <p style={{ fontSize:13, fontWeight:600, color:'#16a34a' }}>Simulation terminée avec succès !</p>
            </div>
          )}
        </div>
        {!done && isAgentTurn && (
          <div style={{ padding:'10px 16px', background:'rgba(201,168,76,0.08)', borderTop:'1px solid rgba(201,168,76,0.2)' }}>
            <p style={{ fontSize:12, color:'#92700a', fontWeight:600, margin:0 }}>💡 Conseil : {currentExchange.text}</p>
          </div>
        )}
        {!done ? (
          <div style={{ padding:14, borderTop:'1px solid #f0f0f0', display:'flex', gap:10 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Votre réponse…"
              style={{ flex:1, padding:'10px 14px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, outline:'none', background:'#f9fafb', color:'#1a3d2b' }}
            />
            <button onClick={handleSend} style={{ background:'#1a3d2b', border:'none', borderRadius:10, width:42, height:42, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" style={{ width:16, height:16 }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        ) : (
          <div style={{ padding:16, borderTop:'1px solid #f0f0f0', textAlign:'center' }}>
            <button onClick={onClose} style={{ background:'#1a3d2b', color:'#c9a84c', border:'none', borderRadius:10, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', width:'100%' }}>
              Terminer la simulation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ScriptCard
// ─────────────────────────────────────────────────────────────
function ScriptCard({ script, activeTab }) {
  const [expanded, setExpanded] = useState(false)
  const text = activeTab === 'fr' ? script.fr : script.darija

  const typeConfig = {
    'Script Introduction': { color:'#3b82f6', bg:'#dbeafe', textC:'#1d4ed8', tip:"Utilisez ce script dans les 5 premières secondes. L'objectif : capter l'attention et obtenir 2 minutes d'écoute." },
    'Script Découverte':   { color:'#10b981', bg:'#d1fae5', textC:'#065f46', tip:"Posez ces questions dans l'ordre. Écoutez activement et notez les réponses pour personnaliser votre offre." },
    'Script Closing':      { color:'#f59e0b', bg:'#fef3c7', textC:'#92400e', tip:"N'attendez pas la fin de l'appel. Proposez dès que le prospect exprime un intérêt ou une confirmation de besoin." },
    'Script Relance':      { color:'#8b5cf6', bg:'#ede9fe', textC:'#5b21b6', tip:"Rappelez toujours dans les 24h après un premier contact non concluant. La relance augmente le taux de conversion de 30%." },
  }
  const cfg = typeConfig[script.type] || { color:'#6b7280', bg:'#f3f4f6', textC:'#374151', tip:"Adaptez ce script à votre style naturel tout en conservant les points clés." }

  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #e8e2d6', overflow:'hidden', transition:'box-shadow 0.2s, border-color 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#c9a84c'; e.currentTarget.style.boxShadow='0 4px 16px rgba(201,168,76,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#e8e2d6'; e.currentTarget.style.boxShadow='none' }}
    >
      <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', borderBottom: expanded ? '1px solid #f0ebe0' : 'none' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:cfg.color, flexShrink:0 }} />
          <span style={{ fontSize:13, fontWeight:700, color:'#1a3d2b' }}>{script.type}</span>
          <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:cfg.bg, color:cfg.textC }}>
            {activeTab === 'fr' ? 'Français' : 'Darija'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, color:'#9ca3af' }}>{expanded ? 'Masquer' : 'Voir le script'}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ width:14, height:14, transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      {expanded && (
        <div style={{ padding:'16px 18px', background:'#fafaf8' }}>
          <div style={{ display:'flex', gap:8, alignItems:'flex-start', background:'rgba(201,168,76,0.08)', borderRadius:10, padding:'10px 12px', marginBottom:14, border:'1px solid rgba(201,168,76,0.2)' }}>
            <span style={{ fontSize:14 }}>💡</span>
            <p style={{ fontSize:12, color:'#92700a', lineHeight:1.5, margin:0 }}>{cfg.tip}</p>
          </div>
          <div style={{
            background: activeTab === 'fr' ? '#fff' : 'rgba(26,61,43,0.04)',
            border:`1.5px solid ${activeTab === 'fr' ? '#e8e2d6' : 'rgba(26,61,43,0.15)'}`,
            borderRadius:10, padding:'14px 16px', fontSize:13, color:'#374151', lineHeight:1.8, whiteSpace:'pre-line'
          }}>{text}</div>
          <div style={{ marginTop:12 }}>
            <button
              onClick={() => navigator.clipboard?.writeText(text)}
              style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'#1a3d2b', background:'transparent', border:'1.5px solid #1a3d2b', borderRadius:8, padding:'6px 14px', cursor:'pointer' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:13, height:13 }}>
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copier le script
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ObjectionCard
// ─────────────────────────────────────────────────────────────
function ObjectionCard({ obj, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #e8e2d6', overflow:'hidden', transition:'border-color 0.2s' }}
      onMouseEnter={e => !open && (e.currentTarget.style.borderColor='#c9a84c')}
      onMouseLeave={e => !open && (e.currentTarget.style.borderColor='#e8e2d6')}
    >
      <button style={{ width:'100%', padding:'16px 20px', textAlign:'left', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ width:32, height:32, borderRadius:8, background:'#fef2f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width:15, height:15 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Objection {index + 1}</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#1f2937' }}>"{obj.objection}"</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(201,168,76,0.1)', color:'#92700a', fontWeight:600, flexShrink:0 }}>{obj.technique}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ width:16, height:16, transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', flexShrink:0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>
      {open && (
        <div style={{ padding:'0 20px 20px', borderTop:'1px solid #f0ebe0' }}>
          <div style={{ paddingTop:16, display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#c9a84c', flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight:700, color:'#c9a84c', textTransform:'uppercase', letterSpacing:'0.08em' }}>Technique : {obj.technique}</span>
            </div>
            <div style={{ background:'rgba(26,61,43,0.04)', borderRadius:10, padding:'14px 16px', border:'1px solid rgba(26,61,43,0.12)' }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#1a3d2b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>✅ Réponse recommandée</p>
              <p style={{ fontSize:13, color:'#374151', lineHeight:1.7, margin:0 }}>{obj.response}</p>
            </div>
            <div style={{ background:'#fffbeb', borderRadius:10, padding:'14px 16px', border:'1px solid #fde68a' }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>🎯 Exercice pratique</p>
              <p style={{ fontSize:13, color:'#374151', lineHeight:1.7, margin:0 }}>{obj.exercise}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ScenarioCard
// ─────────────────────────────────────────────────────────────
function ScenarioCard({ scenario, onPlay }) {
  const diffConfig = {
    easy:   { label:'Facile',    bg:'#d1fae5', color:'#065f46' },
    medium: { label:'Moyen',     bg:'#fef3c7', color:'#92400e' },
    hard:   { label:'Difficile', bg:'#fee2e2', color:'#991b1b' },
  }
  const dc = diffConfig[scenario.difficulty] || diffConfig.medium

  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid #e8e2d6', padding:20, display:'flex', flexDirection:'column', gap:14, transition:'all 0.2s ease' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#c9a84c'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(201,168,76,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#e8e2d6'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div>
          <h4 style={{ fontSize:15, fontWeight:700, color:'#1a3d2b', margin:'0 0 4px' }}>{scenario.title}</h4>
          <p style={{ fontSize:12, color:'#6b7280', margin:0, lineHeight:1.4 }}>{scenario.description}</p>
        </div>
        <span style={{ flexShrink:0, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, background:dc.bg, color:dc.color }}>{dc.label}</span>
      </div>
      <div style={{ background:'#f9f7f3', borderRadius:10, padding:'12px 14px', border:'1px solid #e8e2d6' }}>
        <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Le client dit :</p>
        <p style={{ fontSize:13, color:'#374151', fontStyle:'italic', margin:0, lineHeight:1.5 }}>"{scenario.exchanges[0].text}"</p>
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'flex-start', background:'rgba(201,168,76,0.07)', borderRadius:10, padding:'10px 12px', border:'1px solid rgba(201,168,76,0.2)' }}>
        <StarIcon style={{ width:14, height:14, color:'#c9a84c', flexShrink:0, marginTop:1 }} />
        <p style={{ fontSize:12, color:'#92700a', margin:0, lineHeight:1.5 }}>{scenario.tip}</p>
      </div>
      <button
        onClick={() => onPlay(scenario)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#1a3d2b', color:'#c9a84c', border:'none', borderRadius:10, padding:12, fontWeight:700, fontSize:13, cursor:'pointer' }}
        onMouseEnter={e => e.currentTarget.style.opacity='0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity='1'}
      >
        <PlayIcon style={{ width:15, height:15 }} /> Simuler cet appel
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
export default function FormationCommerciale() {
  const { user } = useAuth()
  const [activeModule,   setActiveModule]   = useState(1)
  const [scriptTab,      setScriptTab]      = useState('fr')
  const [activeScenario, setActiveScenario] = useState(null)
  const [takingQuiz,     setTakingQuiz]     = useState(false)

  const modules = [
    { id:1, title:"Scripts d'appel",           sub:'4 scripts · FR + Darija',                    icon:<PhoneIcon style={{ width:17, height:17 }} /> },
    { id:2, title:'Gestion des objections',     sub:`${OBJECTIONS.length} objections traitées`,    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:17, height:17 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { id:3, title:"Simulation d'appels",        sub:`${CALL_SCENARIOS?.length ?? 3} scénarios`,    icon:<PlayIcon style={{ width:17, height:17 }} /> },
    { id:4, title:'Évaluation & Certification', sub:`${COMMERCIAL_QUIZ.length} questions · Certificat`, icon:<AwardIcon style={{ width:17, height:17 }} /> },
  ]

  // Quiz view
  if (takingQuiz) {
    return (
      <div style={{ fontFamily:'Montserrat, sans-serif' }}>
        <div style={{ background:'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)', borderRadius:16, padding:'28px 32px', marginBottom:24, border:'1px solid rgba(201,168,76,0.25)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #c9a84c, #b8960a)' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <h2 style={{ color:'#fff', fontSize:22, fontWeight:700, margin:'0 0 4px', fontFamily:'Cormorant Garamond, serif' }}>Évaluation Commerciale</h2>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:0 }}>Formation Commerciale · Module 4</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {[{v:COMMERCIAL_QUIZ.length,l:'Questions'},{v:'70%',l:'Score min.'}].map((s,i)=>(
                <div key={i} style={{ textAlign:'center', background:'rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 18px', border:'1px solid rgba(201,168,76,0.2)' }}>
                  <div style={{ color:'#c9a84c', fontSize:18, fontWeight:800 }}>{s.v}</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <CommercialQuiz userName={user?.name ?? 'Étudiant'} userId={user?.id} onDone={() => setTakingQuiz(false)} />
      </div>
    )
  }

  return (
    <div style={{ fontFamily:'Montserrat, sans-serif' }}>

      {/* ── Dark header card ── */}
      <div style={{ background:'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)', borderRadius:16, padding:'28px 32px', marginBottom:24, border:'1px solid rgba(201,168,76,0.25)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #c9a84c, #b8960a)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:24 }}>
          <div>
            <h2 style={{ color:'#fff', fontSize:24, fontWeight:700, margin:'0 0 6px', fontFamily:'Cormorant Garamond, serif', letterSpacing:'-0.02em' }}>Formation Commerciale</h2>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13, margin:0 }}>
              Maîtrisez les techniques de vente en assurance — Scripts · Objections · Simulation · Certification
            </p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {[{v:'4',l:'Modules'},{v:'FR+DA',l:'Langues'},{v:COMMERCIAL_QUIZ.length,l:'Questions'}].map((s,i)=>(
              <div key={i} style={{ textAlign:'center', background:'rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 16px', border:'1px solid rgba(201,168,76,0.2)' }}>
                <div style={{ color:'#c9a84c', fontSize:18, fontWeight:800 }}>{s.v}</div>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Module nav tabs */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {modules.map(m => {
            const active = activeModule === m.id
            return (
              <button key={m.id} onClick={() => setActiveModule(m.id)} style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 18px', borderRadius:10, cursor:'pointer',
                background: active ? '#c9a84c' : 'rgba(255,255,255,0.06)',
                border:`1.5px solid ${active ? '#c9a84c' : 'rgba(201,168,76,0.2)'}`,
                color: active ? '#1a3d2b' : 'rgba(255,255,255,0.7)',
                fontWeight: active ? 700 : 500, fontSize:13, transition:'all 0.2s ease'
              }}>
                <span style={{ color: active ? '#1a3d2b' : '#c9a84c' }}>{m.icon}</span>
                <span style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
                  <span style={{ lineHeight:1.2 }}>{m.title}</span>
                  <span style={{ fontSize:10, opacity:0.7, fontWeight:400, lineHeight:1.3 }}>{m.sub}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Module 1 — Scripts ── */}
      {activeModule === 1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', border:'1.5px solid #e8e2d6' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:16 }}>
              <div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#1a3d2b', margin:'0 0 4px' }}>Scripts d'appel universels</h3>
                <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>Cliquez sur un script pour le développer. Copiez et adaptez à votre style.</p>
              </div>
              <div style={{ display:'flex', borderRadius:10, border:'1.5px solid #e8e2d6', overflow:'hidden' }}>
                {[['fr','🇫🇷 Français'],['darija','🇲🇦 Darija']].map(([lang,label]) => (
                  <button key={lang} onClick={() => setScriptTab(lang)} style={{ padding:'8px 16px', fontSize:12, fontWeight:700, cursor:'pointer', border:'none', background: scriptTab===lang ? '#1a3d2b' : 'transparent', color: scriptTab===lang ? '#c9a84c' : '#6b7280', transition:'all 0.2s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Parcours visuel */}
            <div style={{ display:'flex', alignItems:'center', background:'#f9f7f3', borderRadius:12, padding:'14px 18px', border:'1px solid #e8e2d6', marginBottom:20, overflowX:'auto', gap:0 }}>
              {[
                { n:1, label:'Introduction', desc:"Capter l'attention", color:'#3b82f6' },
                { n:2, label:'Découverte',   desc:'Qualifier le besoin', color:'#10b981' },
                { n:3, label:'Argumentation',desc:"Présenter l'offre",  color:'#f59e0b' },
                { n:4, label:'Closing',      desc:'Conclure la vente',  color:'#8b5cf6' },
              ].map((s, i, arr) => (
                <div key={s.n} style={{ display:'flex', alignItems:'center', flex:1, minWidth:90 }}>
                  <div style={{ textAlign:'center', flex:1 }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:s.color, color:'#fff', fontWeight:800, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 6px' }}>{s.n}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#1a3d2b' }}>{s.label}</div>
                    <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{s.desc}</div>
                  </div>
                  {i < arr.length - 1 && <div style={{ flex:0.4, height:2, background:'linear-gradient(90deg, #e5e7eb, #c9a84c)', margin:'0 4px', marginBottom:18 }} />}
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:12 }}>
              {CALL_SCRIPTS.map((s, i) => <ScriptCard key={i} script={s} activeTab={scriptTab} />)}
            </div>
          </div>

          {/* Scripts produits */}
          <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', border:'1.5px solid #e8e2d6' }}>
            <div style={{ marginBottom:16 }}>
              <h3 style={{ fontSize:17, fontWeight:700, color:'#1a3d2b', margin:'0 0 4px' }}>Scripts par produit</h3>
              <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>Scripts personnalisés selon le type d'assurance — cliquez sur l'icône pour copier</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
              {PRODUCT_SCRIPTS.map((ps, i) => {
                const pc = { 'Auto':{ bg:'#dbeafe',color:'#1d4ed8' }, 'Habitation':{ bg:'#d1fae5',color:'#065f46' }, 'Santé':{ bg:'#fce7f3',color:'#9d174d' }, 'Vie':{ bg:'#ede9fe',color:'#5b21b6' }, 'RC Pro':{ bg:'#fef3c7',color:'#92400e' } }[ps.product] || { bg:'#f3f4f6',color:'#374151' }
                return (
                  <div key={i} style={{ background:'#fafaf8', borderRadius:12, padding:16, border:'1.5px solid #e8e2d6', transition:'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#c9a84c'; e.currentTarget.style.background='#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#e8e2d6'; e.currentTarget.style.background='#fafaf8' }}
                  >
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20, background:pc.bg, color:pc.color }}>{ps.product}</span>
                      <button onClick={() => navigator.clipboard?.writeText(ps.script)} style={{ background:'none', border:'none', cursor:'pointer', color:'#c9a84c', padding:4 }} title="Copier">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:14, height:14 }}>
                          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </button>
                    </div>
                    <p style={{ fontSize:12, color:'#4b5563', lineHeight:1.6, margin:0 }}>{ps.script}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Module 2 — Objections ── */}
      {activeModule === 2 && (
        <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', border:'1.5px solid #e8e2d6' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:17, fontWeight:700, color:'#1a3d2b', margin:'0 0 4px' }}>Gestion des objections</h3>
              <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>Chaque objection est une opportunité. Cliquez pour voir la technique et la réponse recommandée.</p>
            </div>
            <span style={{ background:'rgba(201,168,76,0.1)', borderRadius:10, padding:'8px 16px', border:'1px solid rgba(201,168,76,0.3)', fontSize:13, fontWeight:700, color:'#92700a' }}>{OBJECTIONS.length} objections</span>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start', background:'#f0fdf4', borderRadius:12, padding:'14px 16px', border:'1px solid #bbf7d0', marginBottom:16 }}>
            <span style={{ fontSize:16 }}>🎯</span>
            <p style={{ fontSize:12, color:'#166534', lineHeight:1.6, margin:0 }}>
              <strong>Méthode A.I.D.A.</strong> — Accepter l'objection, Isoler la vraie raison, Démontrer votre valeur, Appeler à l'action.
            </p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {OBJECTIONS.map((obj, i) => <ObjectionCard key={i} obj={obj} index={i} />)}
          </div>
        </div>
      )}

      {/* ── Module 3 — Simulations ── */}
      {activeModule === 3 && (
        <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', border:'1.5px solid #e8e2d6' }}>
          <div style={{ marginBottom:20 }}>
            <h3 style={{ fontSize:17, fontWeight:700, color:'#1a3d2b', margin:'0 0 4px' }}>Simulation d'appels</h3>
            <p style={{ fontSize:12, color:'#6b7280', margin:'0 0 14px' }}>Entraînez-vous sur des scénarios réels. Lisez le contexte client et répondez comme en situation réelle.</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[{ n:'1',label:'Choisissez un scénario',c:'#3b82f6' },{ n:'2',label:'Lisez le contexte',c:'#10b981' },{ n:'3',label:'Répondez en direct',c:'#f59e0b' },{ n:'4',label:'Recevez les conseils',c:'#8b5cf6' }].map(s=>(
                <div key={s.n} style={{ display:'flex', alignItems:'center', gap:6, background:'#f9f7f3', borderRadius:8, padding:'6px 12px', border:'1px solid #e8e2d6' }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:s.c, color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{s.n}</div>
                  <span style={{ fontSize:11, fontWeight:600, color:'#4b5563' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
            {CALL_SCENARIOS.map(s => <ScenarioCard key={s.id} scenario={s} onPlay={setActiveScenario} />)}
          </div>
          {activeScenario && <SimulationModal scenario={activeScenario} onClose={() => setActiveScenario(null)} />}
        </div>
      )}

      {/* ── Module 4 — Évaluation ── */}
      {activeModule === 4 && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', border:'1.5px solid #e8e2d6' }}>
            <h3 style={{ fontSize:17, fontWeight:700, color:'#1a3d2b', margin:'0 0 4px' }}>Évaluation commerciale</h3>
            <p style={{ fontSize:12, color:'#6b7280', margin:'0 0 20px' }}>{COMMERCIAL_QUIZ.length} questions sur les scripts, les objections et les techniques de closing. Score minimum : 70%.</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:12, marginBottom:20 }}>
              {[{ id:'M1',title:"Scripts d'appel",icon:'📞' },{ id:'M2',title:'Objections',icon:'🛡️' },{ id:'M3',title:"Simulation",icon:'🎭' }].map(m=>(
                <div key={m.id} style={{ background:'#f9f7f3', borderRadius:12, padding:16, border:'1.5px solid #e8e2d6', textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{m.icon}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1a3d2b', marginBottom:4 }}>{m.title}</div>
                  <div style={{ fontSize:10, color:'#10b981', fontWeight:600, background:'#d1fae5', padding:'2px 8px', borderRadius:20, display:'inline-block' }}>✓ Disponible</div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10 }}>
              {[{ icon:'📝',label:`${COMMERCIAL_QUIZ.length} questions au total` },{ icon:'⏱️',label:'Durée estimée : 15 min' },{ icon:'🎯',label:'Score minimum : 70%' },{ icon:'🏆',label:'Certificat PDF officiel' }].map((r,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#f9f7f3', borderRadius:10, border:'1px solid #e8e2d6' }}>
                  <span style={{ fontSize:16 }}>{r.icon}</span>
                  <span style={{ fontSize:12, color:'#374151', fontWeight:500 }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ background:'#fff', borderRadius:16, padding:'24px 28px', border:'2px solid #c9a84c', boxShadow:'0 4px 20px rgba(201,168,76,0.12)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:56, height:56, borderRadius:14, background:'rgba(201,168,76,0.12)', border:'2px solid rgba(201,168,76,0.4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <AwardIcon style={{ width:26, height:26, color:'#c9a84c' }} />
              </div>
              <div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#1a3d2b', margin:'0 0 4px' }}>Examen Final Commercial</h3>
                <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{COMMERCIAL_QUIZ.length} questions · Minimum 70% · Certificat officiel Oriafen Academy</p>
              </div>
            </div>
            <button
              onClick={() => setTakingQuiz(true)}
              style={{ display:'flex', alignItems:'center', gap:8, background:'#1a3d2b', color:'#c9a84c', border:'none', borderRadius:12, padding:'14px 28px', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 12px rgba(26,61,43,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >
              <AwardIcon style={{ width:16, height:16 }} /> Passer l'évaluation
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform:translateY(40px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  )
}
