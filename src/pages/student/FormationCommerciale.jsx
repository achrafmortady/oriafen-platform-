import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { saveExamResult } from '../../lib/api'
import { CALL_SCRIPTS, PRODUCT_SCRIPTS, OBJECTIONS, CALL_SCENARIOS, COMMERCIAL_QUIZ } from '../../data/mockData'
import { PhoneIcon, StarIcon, PlayIcon, AwardIcon, ChevronDownIcon, ChevronRightIcon, DownloadIcon, CheckCircleIcon } from '../../components/Icons'

// ── Certificate ───────────────────────────────────────────────

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

// ── Quiz component ────────────────────────────────────────────

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
      const score = COMMERCIAL_QUIZ.reduce((s, _, i) => s + (updated[i] === COMMERCIAL_QUIZ[i].correct ? 1 : 0), 0)
      const passed = (score / total) >= 0.7
      await saveExamResult(userId, 'commercial', score, total)
      setResult({ score, passed })
      setSaving(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className={`card p-8 text-center border-2 ${result.passed ? 'border-orias-gold' : 'border-red-300'}`}>
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
            result.passed ? 'bg-orias-gold/10 border-2 border-orias-gold' : 'bg-red-50 border-2 border-red-300'
          }`}>
            <AwardIcon className={`w-10 h-10 ${result.passed ? 'text-orias-gold' : 'text-red-400'}`} />
          </div>
          <h2 className="text-2xl font-bold text-orias-green mb-2">
            {result.passed ? 'Félicitations !' : 'Résultat insuffisant'}
          </h2>
          <p className="text-5xl font-bold mt-4 mb-2 text-orias-green">
            {result.score}<span className="text-2xl text-gray-400">/{total}</span>
          </p>
          <p className="text-gray-500 mb-6">
            {result.passed
              ? 'Vous avez validé l\'évaluation commerciale avec plus de 70%. Téléchargez votre certificat !'
              : `Score minimum requis : 70% (${Math.ceil(total * 0.7)}/${total}). Révisez et retentez.`}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {result.passed && (
              <button onClick={() => openCommercialCertificate(userName, result.score)} className="btn-gold flex items-center gap-2">
                <DownloadIcon className="w-4 h-4" />Télécharger mon certificat
              </button>
            )}
            <button onClick={onDone} className="btn-outline-green">Retour à la formation</button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-orias-green mb-4">Révision</h3>
          <div className="space-y-3">
            {COMMERCIAL_QUIZ.map((q, i) => {
              const given = answers[i]
              const ok    = given === q.correct
              return (
                <div key={i} className={`p-3 rounded-xl text-sm ${ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold mb-1 ${ok ? 'text-emerald-700' : 'text-red-700'}`}>Q{i+1}. {q.q}</p>
                  {!ok && given !== undefined && <p className="text-red-600">Votre réponse : {q.options[given]}</p>}
                  <p className={ok ? 'text-emerald-600' : 'text-emerald-700 font-medium'}>Bonne réponse : {q.options[q.correct]}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onDone} className="text-sm text-gray-500 hover:text-orias-green flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Quitter
        </button>
        <span className="text-sm font-semibold text-orias-gold">{current + 1} / {total}</span>
      </div>

      <div className="mb-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-orias-gold transition-all duration-300" style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>

      <div className="card p-6">
        <p className="text-xs font-semibold text-orias-gold uppercase tracking-wider mb-3">Question {current + 1}</p>
        <h3 className="text-lg font-bold text-orias-green mb-6 leading-snug">{q.q}</h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected === i
                  ? 'border-orias-gold bg-orias-gold/10 text-orias-green font-semibold'
                  : 'border-orias-border bg-white hover:border-orias-gold/50 text-gray-700'
              }`}
            >
              <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold mr-3 border ${
                selected === i ? 'bg-orias-gold border-orias-gold text-white' : 'border-gray-300 text-gray-400'
              }`}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={next}
            disabled={selected === null || saving}
            className="btn-gold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Envoi…</>
              : current < total - 1 ? <>Suivant <ChevronRightIcon /></> : "Terminer"
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Simulation modal ──────────────────────────────────────────

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
      const nextClient = exchanges[nextStep]
      setHistory([...newHistory, nextClient])
      setStep(nextStep)
    } else {
      setHistory(newHistory)
      setDone(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-orias-green px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">{scenario.title}</h3>
            <p className="text-green-300 text-sm">Simulation en cours</p>
          </div>
          <button onClick={onClose} className="text-green-300 hover:text-white transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-orias-bg">
          {history.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'you' ? 'justify-end' : 'justify-start'}`}>
              {m.from === 'client' && (
                <div className="max-w-xs px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm bg-white border border-orias-border text-gray-700 shadow-sm">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Client</p>
                  {m.text}
                </div>
              )}
              {m.from === 'you' && (
                <div className="max-w-xs px-4 py-2.5 rounded-2xl rounded-br-sm text-sm bg-orias-green text-white">
                  <p className="text-xs text-green-300 font-semibold mb-1">Vous</p>
                  {m.text}
                </div>
              )}
            </div>
          ))}
          {done && (
            <div className="text-center py-3">
              <CheckCircleIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-600">Simulation terminée !</p>
            </div>
          )}
        </div>

        {!done ? (
          <>
            {isAgentTurn && (
              <div className="px-4 py-2 bg-orias-gold/10 border-t border-orias-gold/20">
                <p className="text-xs text-orias-gold font-semibold">Conseil : {currentExchange.text}</p>
              </div>
            )}
            <div className="p-4 border-t border-orias-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="input-field flex-1 py-2.5 text-sm"
                placeholder="Votre réponse…"
              />
              <button onClick={handleSend} className="btn-gold px-4">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 border-t border-orias-border text-center">
            <button onClick={onClose} className="btn-green w-full">Terminer la simulation</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function ScriptCard({ script, activeTab }) {
  return (
    <div className="bg-orias-bg rounded-xl p-5 border border-orias-border">
      <h4 className="font-bold text-orias-green text-sm mb-3">{script.type}</h4>
      <div className={`text-sm text-gray-700 leading-relaxed p-4 rounded-lg border whitespace-pre-line ${activeTab === 'fr' ? 'bg-white border-orias-border' : 'bg-orias-green/5 border-orias-green/20'}`}>
        {activeTab === 'fr' ? script.fr : script.darija}
      </div>
    </div>
  )
}

function ObjectionCard({ obj }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card border border-orias-border overflow-hidden">
      <button
        className="w-full p-5 text-left flex items-center justify-between gap-3 hover:bg-orias-bg/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-800">"{obj.objection}"</span>
        </div>
        {open ? <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-orias-border">
          <div className="pt-4">
            <span className="text-xs font-bold text-orias-gold uppercase tracking-wider">Technique : {obj.technique}</span>
          </div>
          <div className="bg-orias-green/5 rounded-xl p-4 border border-orias-green/20">
            <p className="text-xs font-semibold text-orias-green uppercase tracking-wider mb-2">Réponse recommandée</p>
            <p className="text-sm text-gray-700 leading-relaxed">{obj.response}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Exercice pratique</p>
            <p className="text-sm text-gray-700 leading-relaxed">{obj.exercise}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ScenarioCard({ scenario, onPlay }) {
  const diffConfig = {
    easy:   { label: 'Facile',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    medium: { label: 'Moyen',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    hard:   { label: 'Difficile', cls: 'bg-red-50 text-red-700 border-red-200' },
  }
  const dc = diffConfig[scenario.difficulty]
  return (
    <div className="card p-5 hover:border-orias-gold/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-bold text-orias-green">{scenario.title}</h4>
            <span className={`status-badge border ${dc.cls} text-xs`}>{dc.label}</span>
          </div>
          <p className="text-sm text-gray-500">{scenario.description}</p>
        </div>
      </div>
      <div className="bg-orias-bg rounded-lg p-3 border border-orias-border mb-4">
        <p className="text-xs font-semibold text-gray-500 mb-1">Ouverture du client :</p>
        <p className="text-sm text-gray-700 italic">"{scenario.exchanges[0].text}"</p>
      </div>
      <div className="flex items-start gap-2 text-xs text-orias-gold bg-orias-gold/5 rounded-lg p-3 border border-orias-gold/20 mb-4">
        <StarIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>{scenario.tip}</p>
      </div>
      <button onClick={() => onPlay(scenario)} className="btn-gold w-full flex items-center justify-center gap-2">
        <PlayIcon className="w-4 h-4" />
        Simuler cet appel
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────

export default function FormationCommerciale() {
  const { user } = useAuth()
  const [activeModule, setActiveModule] = useState(1)
  const [scriptTab,    setScriptTab]    = useState('fr')
  const [activeScenario, setActiveScenario] = useState(null)
  const [takingQuiz,   setTakingQuiz]   = useState(false)

  const modules = [
    { id: 1, title: "Scripts d'appel",           icon: <PhoneIcon className="w-5 h-5" /> },
    { id: 2, title: "Gestion des objections",     icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { id: 3, title: "Simulation d'appels",        icon: <PlayIcon className="w-5 h-5" /> },
    { id: 4, title: "Évaluation & Certification", icon: <AwardIcon className="w-5 h-5" /> },
  ]

  if (takingQuiz) {
    return (
      <div className="space-y-6">
        <div className="card p-4 flex items-center justify-between">
          <h2 className="section-title">Formation Commerciale</h2>
          <span className="text-sm text-gray-500">Module 4 — Évaluation</span>
        </div>
        <CommercialQuiz
          userName={user?.name ?? 'Étudiant'}
          userId={user?.id}
          onDone={() => setTakingQuiz(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="section-title">Formation Commerciale</h2>
        <p className="section-subtitle">Maîtrisez les techniques de vente en assurance</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {modules.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeModule === m.id
                  ? 'bg-orias-green text-white shadow-md'
                  : 'bg-orias-bg text-gray-600 hover:bg-orias-border border border-orias-border'
              }`}
            >
              {m.icon}
              <span className="hidden sm:inline">{m.title}</span>
              <span className="sm:hidden">M{m.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Module 1 — Scripts */}
      {activeModule === 1 && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
              <h3 className="font-bold text-orias-green text-lg">Scripts d'appel universels</h3>
              <div className="flex rounded-xl border border-orias-border overflow-hidden">
                <button onClick={() => setScriptTab('fr')} className={`px-4 py-2 text-sm font-semibold transition-colors ${scriptTab === 'fr' ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>Français</button>
                <button onClick={() => setScriptTab('darija')} className={`px-4 py-2 text-sm font-semibold transition-colors ${scriptTab === 'darija' ? 'bg-orias-green text-white' : 'text-gray-600 hover:bg-orias-bg'}`}>Darija</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CALL_SCRIPTS.map((s, i) => <ScriptCard key={i} script={s} activeTab={scriptTab} />)}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-bold text-orias-green text-lg mb-4">Scripts par produit</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRODUCT_SCRIPTS.map((ps, i) => (
                <div key={i} className="bg-orias-bg rounded-xl p-4 border border-orias-border hover:border-orias-gold/40 transition-colors">
                  <span className="inline-block bg-orias-green text-white text-xs font-bold px-2.5 py-1 rounded-full mb-2">{ps.product}</span>
                  <p className="text-sm text-gray-600 leading-relaxed">{ps.script}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Module 2 — Objections */}
      {activeModule === 2 && (
        <div className="card p-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div>
              <h3 className="font-bold text-orias-green text-lg">Gestion des objections</h3>
              <p className="text-sm text-gray-500 mt-1">Cliquez sur une objection pour voir la technique et l'exercice</p>
            </div>
            <span className="status-badge bg-orias-gold/10 border border-orias-gold/30 text-orias-gold">{OBJECTIONS.length} objections</span>
          </div>
          <div className="space-y-3">
            {OBJECTIONS.map((obj, i) => <ObjectionCard key={i} obj={obj} />)}
          </div>
        </div>
      )}

      {/* Module 3 — Simulations */}
      {activeModule === 3 && (
        <div className="card p-6">
          <div className="mb-5">
            <h3 className="font-bold text-orias-green text-lg">Simulation d'appels</h3>
            <p className="text-sm text-gray-500 mt-1">Entraînez-vous sur des scénarios réels avec guidage à chaque étape</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {CALL_SCENARIOS.map(s => (
              <ScenarioCard key={s.id} scenario={s} onPlay={setActiveScenario} />
            ))}
          </div>
          {activeScenario && (
            <SimulationModal scenario={activeScenario} onClose={() => setActiveScenario(null)} />
          )}
        </div>
      )}

      {/* Module 4 — Évaluation */}
      {activeModule === 4 && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-bold text-orias-green text-lg mb-2">Évaluation commerciale</h3>
            <p className="text-sm text-gray-500 mb-5">10 questions sur les scripts, les objections et les techniques de closing. Score minimum : 70%.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {['Scripts d\'appel', 'Gestion des objections', 'Simulation d\'appels'].map((mod, i) => (
                <div key={i} className="bg-orias-bg rounded-xl p-4 border border-orias-border text-center">
                  <div className="w-10 h-10 rounded-full bg-orias-green/10 border-2 border-orias-green/20 flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-orias-green text-sm">M{i+1}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm">{mod}</h4>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 border-2 border-orias-gold">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-orias-gold/10 border-2 border-orias-gold/40 flex items-center justify-center flex-shrink-0">
                  <AwardIcon className="w-7 h-7 text-orias-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-orias-green text-lg">Examen Final Commercial</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{COMMERCIAL_QUIZ.length} questions · Minimum 70% · Certificat téléchargeable</p>
                </div>
              </div>
              <button onClick={() => setTakingQuiz(true)} className="btn-gold flex items-center gap-2">
                <AwardIcon className="w-4 h-4" />
                Passer l'évaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
