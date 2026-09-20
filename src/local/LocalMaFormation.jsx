import { useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import { CheckCircleIcon, LockIcon, AwardIcon, ChevronRightIcon, ChevronDownIcon } from '../components/Icons'
import {
  getFormationState, startUnit, saveChapterProgress, markUnitComplete, saveExamResult,
  IAS1_QUESTIONS,
} from './formationProgressStore'

// Restauration V1 -> V2 (audit 2026-09-19) : src/pages/student/MaFormation.jsx
// (978 lignes, fichier live non modifié) était accessible via l'onglet
// "Formation IAS1" côté client, mais V2 (ClientSpace, LocalCRM.jsx) affichait
// un simple placeholder générique pour cet onglet. Reproduit ici le même
// contenu et la même logique (unités, chapitres, examen final 20 questions),
// avec deux différences assumées :
//   1. Progression pilotée par formationProgressStore.js (localStorage) au
//      lieu de useAuth()/src/lib/api.js — aucun AuthProvider n'existe dans
//      le shell V2, et aucun appel Supabase n'est jamais fait ici.
//   2. Les 20 composants Chapitre*.jsx (contenu interactif par chapitre,
//      quiz inclus) sont RÉUTILISÉS TELS QUELS depuis
//      src/pages/student/ChapitreXX.jsx (aucune dépendance Auth/API — voir
//      leurs imports, uniquement React) : le quiz de chaque chapitre est
//      donc pleinement fonctionnel ici. Les vidéos (hébergées sur Supabase
//      Storage, VIDEO_URL dans chaque ChapitreXX.jsx, même bucket public
//      `formation` sur cgmjjxosgnfsqupjketw.supabase.co) se chargent via
//      une balise <video src=...> classique — correctif CSP "Formation IAS1
//      video" (2026-09-21) : `media-src` autorise désormais explicitement
//      ce seul domaine, en LECTURE de fichiers publics uniquement (aucun
//      appel API/DB Supabase, `connect-src` reste inchangé). Les
//      diapositives (SLIDE_BASE, mêmes fichiers, servies en <img>) restent
//      hors scope de ce correctif et ne sont pas concernées par `img-src`.
import Chapitre11 from '../pages/student/Chapitre11'
import Chapitre12 from '../pages/student/Chapitre12'
import Chapitre13 from '../pages/student/Chapitre13'
import Chapitre14 from '../pages/student/Chapitre14'
import Chapitre15 from '../pages/student/Chapitre15'
import Chapitre16 from '../pages/student/Chapitre16'
import Chapitre17 from '../pages/student/Chapitre17'
import Chapitre21 from '../pages/student/Chapitre21'
import Chapitre22 from '../pages/student/Chapitre22'
import Chapitre23 from '../pages/student/Chapitre23'
import Chapitre31 from '../pages/student/Chapitre31'
import Chapitre32 from '../pages/student/Chapitre32'
import Chapitre33 from '../pages/student/Chapitre33'
import Chapitre41 from '../pages/student/Chapitre41'
import Chapitre42 from '../pages/student/Chapitre42'
import Chapitre51 from '../pages/student/Chapitre51'
import Chapitre52 from '../pages/student/Chapitre52'
import Chapitre53 from '../pages/student/Chapitre53'
import Chapitre54 from '../pages/student/Chapitre54'
import Chapitre55 from '../pages/student/Chapitre55'

const CHAPTER_COMPONENTS = {
  '1.1': Chapitre11, '1.2': Chapitre12, '1.3': Chapitre13, '1.4': Chapitre14, '1.5': Chapitre15, '1.6': Chapitre16, '1.7': Chapitre17,
  '2.1': Chapitre21, '2.2': Chapitre22, '2.3': Chapitre23,
  '3.1': Chapitre31, '3.2': Chapitre32, '3.3': Chapitre33,
  '4.1': Chapitre41, '4.2': Chapitre42,
  '5.1': Chapitre51, '5.2': Chapitre52, '5.3': Chapitre53, '5.4': Chapitre54, '5.5': Chapitre55,
}

const EXAM_DRAW = 20
const EXAM_PASS = 15

function drawQuestions() {
  const shuffled = [...IAS1_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, EXAM_DRAW)
}

function ExamView({ clientId, onDone }) {
  const [questions, setQuestions] = useState(() => drawQuestions())
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)

  const q = questions[current]
  const total = questions.length

  const choose = (i) => { if (result) return; setSelected(i) }

  const next = () => {
    const updated = { ...answers, [q.id]: selected }
    setAnswers(updated)
    if (current < total - 1) {
      setCurrent(current + 1)
      setSelected(null)
    } else {
      const score = questions.reduce((s, q) => s + (updated[q.id] === q.correct ? 1 : 0), 0)
      saveExamResult(clientId, 'ias1', score, total)
      setResult({ score, passed: score >= EXAM_PASS })
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`card p-8 text-center border-2 ${result.passed ? 'border-orias-gold' : 'border-red-300'}`}>
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${result.passed ? 'bg-orias-gold/10 border-2 border-orias-gold' : 'bg-red-50 border-2 border-red-300'}`}>
            <AwardIcon className={`w-10 h-10 ${result.passed ? 'text-orias-gold' : 'text-red-400'}`} />
          </div>
          <h2 className="text-2xl font-bold text-orias-green mb-2">{result.passed ? 'Félicitations !' : 'Examen non validé'}</h2>
          <p className="text-5xl font-bold mt-4 mb-2 text-orias-green">{result.score}<span className="text-2xl text-gray-400">/{total}</span></p>
          <p className="text-gray-500 mb-6">
            {result.passed ? "Vous avez réussi l'examen IAS Niveau 1. Vous pouvez télécharger votre certificat." : `Score minimum requis : ${EXAM_PASS}/${total}. Révisez les modules et retentez l'examen.`}
          </p>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2"><span>Bonnes réponses</span><span className="font-bold">{result.score}/{total}</span></div>
            <ProgressBar value={result.score} max={total} height="h-3" />
          </div>
          <div className="flex flex-col gap-3 items-center w-full">
            {result.passed ? (
              <div style={{ background: 'linear-gradient(135deg,#f5f0e8,#fff)', border: '1px solid #c9a84c', borderRadius: 16, padding: '20px 24px', textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                <p style={{ fontWeight: 700, color: '#1a3d2b', fontSize: 15, marginBottom: 6 }}>Votre livret de stage va être généré.</p>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>Votre <strong>Livret de Stage IAS Niveau 1</strong> officiel sera envoyé<br />par email sous <strong>5 jours ouvrés</strong>.<br />Vous le retrouverez aussi dans vos <strong>Documents Finaux</strong>.</p>
                <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a3d2b', color: '#c9a84c', padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ Dossier en cours de traitement</div>
              </div>
            ) : (
              <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 16, padding: '16px 20px', textAlign: 'center', width: '100%' }}>
                <p style={{ fontWeight: 700, color: '#dc2626', fontSize: 14, marginBottom: 8 }}>❌ Score insuffisant — {result.score}/20 (minimum requis : {EXAM_PASS}/20)</p>
                <p style={{ fontSize: 12, color: '#666', marginBottom: 14, lineHeight: 1.6 }}>Révisez les unités concernées et retentez l'examen.<br />Les 20 questions seront différentes à chaque tentative.</p>
                <button onClick={() => { setResult(null); setAnswers({}); setSelected(null); setCurrent(0); setQuestions(drawQuestions()) }} className="btn-gold flex items-center gap-2 mx-auto">🔄 Repasser l'examen</button>
              </div>
            )}
            <button onClick={onDone} className="btn-outline-green">Retour à la formation</button>
          </div>
        </div>
        <div className="mt-6 card p-5">
          <h3 className="font-bold text-orias-green mb-4">Révision des réponses</h3>
          <div className="space-y-3">
            {questions.map((q) => {
              const given = answers[q.id]
              const ok = given === q.correct
              return (
                <div key={q.id} className={`p-3 rounded-xl text-sm ${ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold mb-1 ${ok ? 'text-emerald-700' : 'text-red-700'}`}>Q{q.id}. {q.question}</p>
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
      <div className="flex items-center justify-between mb-6">
        <button onClick={onDone} className="text-sm text-gray-500 hover:text-orias-green flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Quitter l'examen
        </button>
        <span className="text-sm font-semibold text-orias-gold">{current + 1} / {total}</span>
      </div>
      <div className="mb-4"><ProgressBar value={current + 1} max={total} height="h-1.5" /></div>
      <div className="card p-6">
        <p className="text-xs font-semibold text-orias-gold uppercase tracking-wider mb-3">Question {current + 1}</p>
        <h3 className="text-lg font-bold text-orias-green mb-6 leading-snug">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => choose(i)} className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${selected === i ? 'border-orias-gold bg-orias-gold/10 text-orias-green font-semibold' : 'border-orias-border bg-white hover:border-orias-gold/50 hover:bg-orias-gold/5 text-gray-700'}`}>
              <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold mr-3 border ${selected === i ? 'bg-orias-gold border-orias-gold text-white' : 'border-gray-300 text-gray-400'}`}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={next} disabled={selected === null} className="btn-gold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {current < total - 1 ? <>Question suivante <ChevronRightIcon /></> : "Terminer l'examen"}
          </button>
        </div>
      </div>
    </div>
  )
}

function LessonView({ clientId, unit, completedChapters, onDone, onComplete, onChapterComplete }) {
  const [unitDone, setUnitDone] = useState(unit.status === 'completed')
  const [activeChapter, setActiveChapter] = useState(null)

  const handleChapterComplete = (chapterId) => {
    onChapterComplete(chapterId)
    setActiveChapter(null)
    const allChapterIds = unit.chapters.map((_, i) => `${unit.id}.${i + 1}`)
    const updated = new Set([...completedChapters, chapterId])
    if (allChapterIds.every(id => updated.has(id)) && !unitDone) {
      markUnitComplete(clientId, unit.id, unit.totalHours)
      setUnitDone(true)
      onComplete(unit.id)
    }
  }

  const handleComplete = () => {
    markUnitComplete(clientId, unit.id, unit.totalHours)
    setUnitDone(true)
    onComplete(unit.id)
  }

  if (activeChapter && CHAPTER_COMPONENTS[activeChapter]) {
    const ChapterComponent = CHAPTER_COMPONENTS[activeChapter]
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6" /></svg>
          Retour à l'Unité {unit.id}
        </button>
        <ChapterComponent isCompleted={completedChapters.has(activeChapter)} onComplete={() => handleChapterComplete(activeChapter)} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={onDone} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orias-green transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        Retour aux modules
      </button>
      <div className="card p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold ${unitDone ? 'bg-emerald-100 text-emerald-600' : 'bg-orias-gold/10 text-orias-gold'}`}>
            {unitDone ? <CheckCircleIcon className="w-6 h-6 text-emerald-600" /> : unit.id}
          </div>
          <div>
            <p className="text-xs font-semibold text-orias-gold uppercase tracking-wider mb-1">Unité {unit.id}</p>
            <h2 className="text-xl font-bold text-orias-green">{unit.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{unit.totalHours} heures · {unit.chapters.length} chapitres</p>
          </div>
        </div>
        <p className="text-gray-600 leading-relaxed">{unit.description}</p>
        {unit.status !== 'completed' && <div className="mt-4"><ProgressBar value={unit.completedHours} max={unit.totalHours} height="h-2" showLabel={true} label="Progression" /></div>}
      </div>
      <div className="card p-6">
        <h3 className="font-bold text-orias-green text-lg mb-4">Chapitres du module</h3>
        <div className="space-y-2">
          {unit.chapters.map((ch, i) => {
            const chapterId = `${unit.id}.${i + 1}`
            const prevChapterId = i === 0 ? null : `${unit.id}.${i}`
            const isChapterDone = completedChapters.has(chapterId)
            const isAvailable = i === 0 || completedChapters.has(prevChapterId)
            const hasContent = !!CHAPTER_COMPONENTS[chapterId]
            return (
              <div key={i}
                onClick={() => isAvailable && hasContent && setActiveChapter(chapterId)}
                style={{ cursor: isAvailable && hasContent ? 'pointer' : 'default' }}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${isChapterDone ? 'bg-emerald-50 border-emerald-200' : isAvailable ? 'bg-orias-bg border-orias-border hover:border-orias-gold/60 hover:bg-orias-gold/5' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isChapterDone ? 'bg-emerald-100 text-emerald-600' : isAvailable ? 'bg-orias-gold/10 text-orias-gold' : 'bg-gray-100 text-gray-400'}`}>{isChapterDone ? '✓' : i + 1}</div>
                  <div>
                    <span className={`text-sm font-medium ${isChapterDone ? 'text-emerald-700' : isAvailable ? 'text-gray-700' : 'text-gray-400'}`}>{ch.label}</span>
                    {isChapterDone && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 20 }}>Complété</span>}
                    {!isChapterDone && isAvailable && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#c9a84c', background: 'rgba(201,168,76,0.1)', padding: '1px 6px', borderRadius: 20 }}>Disponible</span>}
                    {!isAvailable && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#9ca3af', background: '#f3f4f6', padding: '1px 6px', borderRadius: 20 }}>🔒 Verrouillé</span>}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${isChapterDone ? 'bg-emerald-100 text-emerald-600' : isAvailable ? 'bg-orias-gold/10 text-orias-gold' : 'bg-gray-100 text-gray-400'}`}>{ch.hours}h</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="card p-5 bg-orias-green text-white">
        <h3 className="font-bold text-orias-gold text-sm uppercase tracking-wider mb-3">Objectifs pédagogiques</h3>
        <ul className="space-y-2 text-sm text-green-100">
          <li className="flex items-start gap-2"><span className="text-orias-gold mt-0.5">✓</span>Comprendre les concepts fondamentaux de ce module</li>
          <li className="flex items-start gap-2"><span className="text-orias-gold mt-0.5">✓</span>Maîtriser la réglementation applicable en France</li>
          <li className="flex items-start gap-2"><span className="text-orias-gold mt-0.5">✓</span>Savoir conseiller vos clients sur ces produits</li>
          <li className="flex items-start gap-2"><span className="text-orias-gold mt-0.5">✓</span>Préparer l'examen final IAS Niveau 1</li>
        </ul>
      </div>
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          {unitDone ? <p className="font-semibold text-emerald-600">Module complété !</p> : <p className="font-semibold text-gray-700">Prêt à valider ce module ?</p>}
          <p className="text-xs text-gray-400 mt-0.5">{unitDone ? 'Votre progression a été enregistrée.' : 'Cliquez pour marquer le module comme terminé.'}</p>
        </div>
        <button onClick={handleComplete} disabled={unitDone} className={unitDone ? 'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold bg-emerald-100 text-emerald-600 cursor-default' : 'btn-gold flex items-center gap-2 disabled:opacity-70'}>
          {unitDone ? <><CheckCircleIcon className="w-4 h-4" />Complété</> : 'Marquer comme terminé'}
        </button>
      </div>
    </div>
  )
}

function UnitCard({ unit, onOpen }) {
  const [open, setOpen] = useState(false)
  const statusConfig = {
    completed: { label: 'Complété' },
    in_progress: { label: 'En cours' },
    locked: { label: 'Verrouillé' },
  }
  const sc = statusConfig[unit.status]
  const btnLabel = unit.status === 'completed' ? 'Revoir' : unit.status === 'in_progress' ? 'Continuer' : 'Verrouillé'
  const btnCls = unit.status === 'completed' ? 'btn-outline-green' : unit.status === 'in_progress' ? 'btn-gold' : 'px-5 py-2.5 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed'

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8e2d6', borderLeft: unit.status === 'completed' ? '4px solid #10b981' : unit.status === 'in_progress' ? '4px solid #c9a84c' : '4px solid #e5e7eb' }}>
      <div className="p-5">
        <div className="flex flex-wrap items-start gap-4 justify-between mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${unit.status === 'completed' ? 'bg-emerald-100' : unit.status === 'in_progress' ? 'bg-orias-gold/10' : 'bg-gray-100'}`}>
              {unit.status === 'completed' ? <CheckCircleIcon className="w-5 h-5 text-emerald-600" /> : unit.status === 'in_progress' ? <span className="text-sm font-bold text-orias-gold">{unit.id}</span> : <LockIcon className="w-4 h-4 text-gray-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ fontWeight: '600', fontSize: '15px', color: unit.status === 'locked' ? '#9ca3af' : '#1a3d2b', fontFamily: "'Montserrat', sans-serif", margin: 0 }}>Unité {unit.id} — {unit.title}</h3>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: unit.status === 'completed' ? '#d1fae5' : unit.status === 'in_progress' ? '#fef3c7' : '#f3f4f6', color: unit.status === 'completed' ? '#10b981' : unit.status === 'in_progress' ? '#d97706' : '#6b7280' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: unit.status === 'completed' ? '#10b981' : unit.status === 'in_progress' ? '#c9a84c' : '#9ca3af', display: 'inline-block' }} />{sc.label}
                </span>
              </div>
              <p className={`text-sm mt-0.5 ${unit.status === 'locked' ? 'text-gray-400' : 'text-gray-500'}`}>{unit.totalHours}h de formation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p style={{ fontSize: '15px', fontWeight: '700', color: unit.status === 'locked' ? '#9ca3af' : '#1a3d2b', margin: 0 }}>{unit.completedHours}/{unit.totalHours}h</p>
            <button className={btnCls} disabled={unit.status === 'locked'} onClick={() => unit.status !== 'locked' && onOpen(unit)}>{btnLabel}</button>
          </div>
        </div>
        {unit.status !== 'locked' && <div className="mb-4"><ProgressBar value={unit.completedHours} max={unit.totalHours} height="h-2" /></div>}
        {unit.description && <p className={`text-sm mb-3 ${unit.status === 'locked' ? 'text-gray-400' : 'text-gray-500'}`}>{unit.description}</p>}
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orias-green transition-colors">
          {open ? <ChevronDownIcon /> : <ChevronRightIcon />}{unit.chapters.length} chapitres
        </button>
        {open && (
          <div className="mt-3 space-y-1.5 pl-5 border-l-2 border-orias-border ml-1">
            {unit.chapters.map((ch, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-orias-bg transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${unit.status === 'locked' ? 'bg-gray-300' : 'bg-orias-gold'}`} />
                  <span className={`text-sm ${unit.status === 'locked' ? 'text-gray-400' : 'text-gray-700'}`}>{ch.label}</span>
                </div>
                <span className={`text-xs font-semibold ${unit.status === 'locked' ? 'text-gray-400' : 'text-orias-gold'}`}>{ch.hours}h</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function LocalMaFormation({ clientId }) {
  const [state, setState] = useState(() => getFormationState(clientId))
  const [view, setView] = useState('list')
  const [activeUnit, setActiveUnit] = useState(null)
  const refresh = () => setState(getFormationState(clientId))

  const { units, completedChapters, examResults } = state
  const totalHours = units.reduce((s, u) => s + u.totalHours, 0)
  const completedHours = units.reduce((s, u) => s + u.completedHours, 0)
  const examUnlocked = units.every(u => u.status === 'completed')
  const ias1Result = examResults.find(r => r.exam_type === 'ias1')

  const openLesson = (unit) => {
    if (unit.status === 'in_progress') startUnit(clientId, unit.id)
    setActiveUnit(unit)
    setView('lesson')
    refresh()
  }

  const handleUnitComplete = () => refresh()
  const handleChapterComplete = (chapterId) => { saveChapterProgress(clientId, chapterId); refresh() }
  const handleExamDone = () => { setView('list'); refresh() }

  if (view === 'lesson' && activeUnit) {
    const liveUnit = units.find(u => u.id === activeUnit.id) || activeUnit
    return <div className="space-y-6"><LessonView clientId={clientId} unit={liveUnit} completedChapters={completedChapters} onDone={() => { setView('list'); refresh() }} onComplete={handleUnitComplete} onChapterComplete={handleChapterComplete} /></div>
  }
  if (view === 'exam') {
    return <div className="space-y-6"><ExamView clientId={clientId} onDone={handleExamDone} /></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ background: 'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 30px rgba(0,0,0,0.15)' }}>
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginBottom: '24px', borderRadius: '2px' }} />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>Formation IAS1</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Programme officiel de formation intermédiaire en assurance</p>
          </div>
          <div className="text-right">
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#c9a84c', fontFamily: "'Cormorant Garamond', serif" }}>{completedHours}<span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>/{totalHours}h</span></p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>heures complétées</p>
          </div>
        </div>
        <ProgressBar value={completedHours} max={totalHours} height="h-3" showLabel={true} label="Progression globale" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
          {[
            { dot: '#10b981', label: 'Complétées', value: units.filter(u => u.status === 'completed').length, color: '#10b981' },
            { dot: '#c9a84c', label: 'En cours', value: units.filter(u => u.status === 'in_progress').length, color: '#c9a84c' },
            { dot: 'rgba(255,255,255,0.3)', label: 'Verrouillées', value: units.filter(u => u.status === 'locked').length, color: 'rgba(255,255,255,0.4)' },
          ].map(({ dot, label, value, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, display: 'inline-block' }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{label} : <strong style={{ color }}>{value}</strong></span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {units.map(unit => <UnitCard key={unit.id} unit={unit} onOpen={openLesson} />)}
      </div>

      <div style={{ background: '#ffffff', border: examUnlocked ? '2px solid #c9a84c' : '1px solid #e8e2d6', borderRadius: '20px', padding: '24px', boxShadow: examUnlocked ? '0 4px 20px rgba(201,168,76,0.15)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${examUnlocked ? 'bg-orias-gold/10 border border-orias-gold/30' : 'bg-gray-100 border border-gray-200'}`}>
              <AwardIcon className={`w-6 h-6 ${examUnlocked ? 'text-orias-gold' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ fontWeight: '700', fontSize: '16px', color: examUnlocked ? '#1a3d2b' : '#9ca3af', margin: 0 }}>Examen Final IAS1</h3>
                {!examUnlocked && <span className="status-badge bg-gray-100 border border-gray-200 text-gray-400 text-xs"><LockIcon className="w-3 h-3" />Complétez tous les modules</span>}
                {ias1Result && <span className={`status-badge border text-xs ${ias1Result.score >= 15 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{ias1Result.score >= 15 ? 'Réussi' : 'Échoué'} — {ias1Result.score}/20</span>}
              </div>
              <div className="flex flex-wrap gap-4 mt-1.5 text-sm text-gray-500">
                <span>20 questions tirées aléatoirement</span><span>·</span><span>Minimum 15/20 pour valider</span><span>·</span><span>Certificat officiel à la clé</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {ias1Result ? (
              ias1Result.score >= 15 ? (
                <div style={{ background: 'linear-gradient(135deg,#f5f0e8,#fff)', border: '1px solid #c9a84c', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, color: '#1a3d2b', fontSize: 13, marginBottom: 4 }}>📋 Livret en cours de génération</p>
                  <p style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>Envoyé sous <strong>5 jours ouvrés</strong> par email<br />et disponible dans vos Documents.</p>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 12, padding: '10px 14px', textAlign: 'center', marginBottom: 4 }}>
                    <p style={{ fontWeight: 700, color: '#dc2626', fontSize: 12, margin: 0 }}>Score insuffisant — {ias1Result.score}/20</p>
                    <p style={{ fontSize: 11, color: '#666', margin: '4px 0 0' }}>Minimum requis : 15/20</p>
                  </div>
                  <button onClick={() => setView('exam')} className="btn-gold flex items-center gap-2"><AwardIcon className="w-4 h-4" />🔄 Repasser l'examen</button>
                </div>
              )
            ) : examUnlocked ? (
              <button onClick={() => setView('exam')} className="btn-gold flex items-center gap-2"><AwardIcon className="w-4 h-4" />Passer l'examen</button>
            ) : (
              <div className="text-right">
                <button disabled className="px-5 py-2.5 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">Verrouillé</button>
                <p className="text-xs text-gray-400 mt-1">{totalHours - completedHours}h restantes</p>
              </div>
            )}
          </div>
        </div>
        {!examUnlocked && <div className="mt-4"><ProgressBar value={completedHours} max={totalHours} height="h-1.5" showLabel={true} label="Progression vers l'examen" /></div>}
      </div>
    </div>
  )
}
