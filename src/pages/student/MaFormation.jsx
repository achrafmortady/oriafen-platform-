import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchFormationProgress,
  fetchExamResults,
  saveExamResult,
  markUnitComplete,
  startUnit,
} from '../../lib/api'
import { FORMATION_UNITS, IAS1_QUESTIONS } from '../../data/mockData'
import ProgressBar from '../../components/ProgressBar'
import {
  CheckCircleIcon, LockIcon, AwardIcon, ChevronRightIcon,
  ChevronDownIcon, DownloadIcon, BookIcon,
} from '../../components/Icons'
import Chapitre11 from './Chapitre11'
import Chapitre12 from './Chapitre12'
import Chapitre13 from './Chapitre13'
import Chapitre14 from './Chapitre14'
import Chapitre15 from './Chapitre15'
import Chapitre16 from './Chapitre16'
import Chapitre17 from './Chapitre17'
import Chapitre21 from './Chapitre21'
import Chapitre22 from './Chapitre22'

// ── Certificate ───────────────────────────────────────────────

function openCertificate(userName, score) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Certificat IAS1 — Oriafen Academy</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Georgia, serif; background:#f9f7f3; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:40px 20px; }
    .cert { background:#fff; border:8px solid #1a3d2b; max-width:780px; width:100%; padding:60px 70px; text-align:center; position:relative; }
    .cert::before { content:''; position:absolute; inset:12px; border:2px solid #c49a2a; pointer-events:none; }
    .logo-line { color:#c49a2a; font-size:13px; letter-spacing:3px; text-transform:uppercase; margin-bottom:6px; }
    .org { color:#1a3d2b; font-size:28px; font-weight:bold; letter-spacing:1px; margin-bottom:40px; }
    .decree { color:#555; font-size:13px; text-transform:uppercase; letter-spacing:4px; margin-bottom:16px; }
    .title { color:#1a3d2b; font-size:36px; font-weight:bold; margin-bottom:32px; line-height:1.2; }
    .certifies { color:#444; font-size:15px; margin-bottom:12px; }
    .name { color:#1a3d2b; font-size:30px; font-style:italic; font-weight:bold; border-bottom:2px solid #c49a2a; display:inline-block; padding-bottom:6px; margin-bottom:28px; }
    .body { color:#444; font-size:15px; line-height:1.8; margin-bottom:36px; }
    .score { color:#c49a2a; font-weight:bold; font-size:18px; }
    .footer { display:flex; justify-content:space-between; align-items:flex-end; margin-top:50px; padding-top:30px; border-top:1px solid #e8e2d6; font-size:12px; color:#888; }
    .seal { width:72px; height:72px; border-radius:50%; border:3px solid #1a3d2b; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:8px; color:#1a3d2b; font-weight:bold; letter-spacing:0.5px; line-height:1.4; }
    @media print { body { background:#fff; padding:0; } }
  </style>
</head>
<body>
  <div class="cert">
    <div class="logo-line">Oriafen Academy</div>
    <div class="org">ORIAFEN ACADEMY</div>
    <div class="decree">Certificat Officiel</div>
    <div class="title">Examen de Connaissance<br>IAS Niveau 1</div>
    <div class="certifies">Oriafen Academy certifie que</div>
    <div class="name">${userName}</div>
    <div class="body">
      a validé l'examen de connaissance IAS Niveau 1<br>
      avec un score de <span class="score">${score}/20</span><br>
      conformément au programme officiel de formation des<br>
      intermédiaires en assurance (Directive DDA)
    </div>
    <div class="footer">
      <div>
        <div>Délivré le ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}</div>
        <div style="margin-top:4px">Oriafen Academy · Paris, France</div>
      </div>
      <div class="seal">
        <div>ORIAFEN</div>
        <div>ACADEMY</div>
        <div>✓ IAS1</div>
      </div>
      <div style="text-align:right">
        <div>Mehdi Alaoui</div>
        <div style="margin-top:4px">Directeur pédagogique</div>
      </div>
    </div>
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

// ── Exam view ─────────────────────────────────────────────────

function ExamView({ userName, userId, onDone }) {
  const [current,  setCurrent]  = useState(0)
  const [answers,  setAnswers]  = useState({})
  const [selected, setSelected] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [result,   setResult]   = useState(null)

  const q    = IAS1_QUESTIONS[current]
  const total = IAS1_QUESTIONS.length

  const choose = (i) => { if (result) return; setSelected(i) }

  const next = async () => {
    const updated = { ...answers, [q.id]: selected }
    setAnswers(updated)

    if (current < total - 1) {
      setCurrent(current + 1)
      setSelected(null)
    } else {
      setSaving(true)
      const score = IAS1_QUESTIONS.reduce((s, q) => s + (updated[q.id] === q.correct ? 1 : 0), 0)
      const res   = await saveExamResult(userId, 'ias1', score, total)
      setResult({ score, passed: res.passed })
      setSaving(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`card p-8 text-center border-2 ${result.passed ? 'border-orias-gold' : 'border-red-300'}`}>
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
            result.passed ? 'bg-orias-gold/10 border-2 border-orias-gold' : 'bg-red-50 border-2 border-red-300'
          }`}>
            <AwardIcon className={`w-10 h-10 ${result.passed ? 'text-orias-gold' : 'text-red-400'}`} />
          </div>
          <h2 className="text-2xl font-bold text-orias-green mb-2">
            {result.passed ? 'Félicitations !' : 'Examen non validé'}
          </h2>
          <p className="text-5xl font-bold mt-4 mb-2 text-orias-green">{result.score}<span className="text-2xl text-gray-400">/{total}</span></p>
          <p className="text-gray-500 mb-6">
            {result.passed
              ? 'Vous avez réussi l\'examen IAS Niveau 1. Vous pouvez télécharger votre certificat.'
              : `Score minimum requis : 10/${total}. Révisez les modules et retentez l'examen.`}
          </p>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Bonnes réponses</span>
              <span className="font-bold">{result.score}/{total}</span>
            </div>
            <ProgressBar value={result.score} max={total} height="h-3" />
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {result.passed && (
              <button
                onClick={() => openCertificate(userName, result.score)}
                className="btn-gold flex items-center gap-2"
              >
                <DownloadIcon className="w-4 h-4" />
                Télécharger mon certificat
              </button>
            )}
            <button onClick={onDone} className="btn-outline-green">
              Retour à la formation
            </button>
          </div>
        </div>

        {/* Answer review */}
        <div className="mt-6 card p-5">
          <h3 className="font-bold text-orias-green mb-4">Révision des réponses</h3>
          <div className="space-y-3">
            {IAS1_QUESTIONS.map((q) => {
              const given   = answers[q.id]
              const correct = q.correct
              const ok      = given === correct
              return (
                <div key={q.id} className={`p-3 rounded-xl text-sm ${ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold mb-1 ${ok ? 'text-emerald-700' : 'text-red-700'}`}>
                    Q{q.id}. {q.question}
                  </p>
                  {!ok && given !== undefined && (
                    <p className="text-red-600">Votre réponse : {q.options[given]}</p>
                  )}
                  <p className={ok ? 'text-emerald-600' : 'text-emerald-700 font-medium'}>
                    Bonne réponse : {q.options[correct]}
                  </p>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onDone} className="text-sm text-gray-500 hover:text-orias-green flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Quitter l'examen
        </button>
        <span className="text-sm font-semibold text-orias-gold">{current + 1} / {total}</span>
      </div>

      <div className="mb-4">
        <ProgressBar value={current + 1} max={total} height="h-1.5" />
      </div>

      <div className="card p-6">
        <p className="text-xs font-semibold text-orias-gold uppercase tracking-wider mb-3">Question {current + 1}</p>
        <h3 className="text-lg font-bold text-orias-green mb-6 leading-snug">{q.question}</h3>

        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                selected === i
                  ? 'border-orias-gold bg-orias-gold/10 text-orias-green font-semibold'
                  : 'border-orias-border bg-white hover:border-orias-gold/50 hover:bg-orias-gold/5 text-gray-700'
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
              : current < total - 1 ? <>Question suivante <ChevronRightIcon /></> : 'Terminer l\'examen'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Lesson view ───────────────────────────────────────────────

function LessonView({ unit, userId, onDone, onComplete }) {
  const [marking, setMarking] = useState(false)
  const [done,    setDone]    = useState(unit.status === 'completed')
  const [activeChapter, setActiveChapter] = useState(null)

  const handleComplete = async () => {
    setMarking(true)
    await markUnitComplete(userId, unit.id, unit.totalHours)
    setDone(true)
    setMarking(false)
    onComplete(unit.id)
  }

  // ── Unité 1 — contenu interactif Chapitre 1.1 ──
  if (unit.id === 1 && activeChapter === '1.1') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 1
        </button>
        <Chapitre11 isCompleted={done} onComplete={handleComplete} />
      </div>
    )
  }

  // ── Unité 1 — contenu interactif Chapitre 1.3 ──
  if (unit.id === 1 && activeChapter === '1.3') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 1
        </button>
        <Chapitre13 isCompleted={done} onComplete={handleComplete} />
      </div>
    )
  }

  // ── Unité 1 — contenu interactif Chapitre 1.4 ──
  if (unit.id === 1 && activeChapter === '1.4') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 1
        </button>
        <Chapitre14 isCompleted={done} onComplete={handleComplete} />
      </div>
    )
  }

  // ── Unité 1 — contenu interactif Chapitre 1.5 ──
  if (unit.id === 1 && activeChapter === '1.5') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 1
        </button>
        <Chapitre15 isCompleted={done} onComplete={handleComplete} />
      </div>
    )
  }

  // ── Unité 1 — contenu interactif Chapitre 1.6 ──
  if (unit.id === 1 && activeChapter === '1.6') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 1
        </button>
        <Chapitre16 isCompleted={done} onComplete={handleComplete} />
      </div>
    )
  }

  // ── Unité 1 — contenu interactif Chapitre 1.7 ──
  if (unit.id === 1 && activeChapter === '1.7') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 1
        </button>
        <Chapitre17 isCompleted={done} onComplete={handleComplete} />
      </div>
    )
  }

  // ── Unité 2 — contenu interactif Chapitre 2.1 ──
  if (unit.id === 2 && activeChapter === '2.1') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 2
        </button>
        <Chapitre21 isCompleted={done} onComplete={handleComplete} />
      </div>
    )
  }

  // ── Unité 2 — contenu interactif Chapitre 2.2 ──
  if (unit.id === 2 && activeChapter === '2.2') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 2
        </button>
        <Chapitre22 isCompleted={done} onComplete={handleComplete} />
      </div>
    )
  }

  // ── Unité 1 — contenu interactif Chapitre 1.2 ──
  if (unit.id === 1 && activeChapter === '1.2') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 1
        </button>
        <Chapitre12 isCompleted={done} onComplete={handleComplete} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={onDone} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orias-green transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Retour aux modules
      </button>

      {/* Unit header */}
      <div className="card p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold ${
            done ? 'bg-emerald-100 text-emerald-600' : 'bg-orias-gold/10 text-orias-gold'
          }`}>
            {done ? <CheckCircleIcon className="w-6 h-6 text-emerald-600" /> : unit.id}
          </div>
          <div>
            <p className="text-xs font-semibold text-orias-gold uppercase tracking-wider mb-1">Unité {unit.id}</p>
            <h2 className="text-xl font-bold text-orias-green">{unit.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{unit.totalHours} heures · {unit.chapters.length} chapitres</p>
          </div>
        </div>
        <p className="text-gray-600 leading-relaxed">{unit.description}</p>

        {unit.status !== 'completed' && (
          <div className="mt-4">
            <ProgressBar value={unit.completedHours} max={unit.totalHours} height="h-2" showLabel={true} label="Progression" />
          </div>
        )}
      </div>

      {/* Chapters — cliquable pour Unité 1 */}
      <div className="card p-6">
        <h3 className="font-bold text-orias-green text-lg mb-4">Chapitres du module</h3>
        <div className="space-y-2">
          {unit.chapters.map((ch, i) => {
            const chapterId = `${unit.id}.${i + 1}`
            const isAvailable = (unit.id === 1 && i <= 6) || (unit.id === 2 && i <= 1) // U1 complète + U2 ch2.1-2.2
            return (
              <div key={i}
                onClick={() => isAvailable && setActiveChapter(chapterId)}
                style={{ cursor: isAvailable ? 'pointer' : 'default' }}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                  isAvailable
                    ? 'bg-orias-bg border-orias-border hover:border-orias-gold/60 hover:bg-orias-gold/5'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    done ? 'bg-emerald-100 text-emerald-600' : isAvailable ? 'bg-orias-gold/10 text-orias-gold' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isAvailable ? 'text-gray-700' : 'text-gray-400'}`}>{ch.label}</span>
                    {isAvailable && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#c9a84c', background: 'rgba(201,168,76,0.1)', padding: '1px 6px', borderRadius: 20 }}>Disponible</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${isAvailable ? 'bg-orias-gold/10 text-orias-gold' : 'bg-gray-100 text-gray-400'}`}>{ch.hours}h</span>
                  {isAvailable && <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="9 18 15 12 9 6"/></svg>}
                </div>
              </div>
            )
          })}
        </div>
        {unit.id === 1 && (
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, fontFamily: 'Montserrat, sans-serif' }}>
            ✅ L'Unité 1 est complète ! Tous les 7 chapitres sont disponibles.
          </p>
        )}
      </div>

      {/* Objectives */}
      <div className="card p-5 bg-orias-green text-white">
        <h3 className="font-bold text-orias-gold text-sm uppercase tracking-wider mb-3">Objectifs pédagogiques</h3>
        <ul className="space-y-2 text-sm text-green-100">
          <li className="flex items-start gap-2"><span className="text-orias-gold mt-0.5">✓</span>Comprendre les concepts fondamentaux de ce module</li>
          <li className="flex items-start gap-2"><span className="text-orias-gold mt-0.5">✓</span>Maîtriser la réglementation applicable en France</li>
          <li className="flex items-start gap-2"><span className="text-orias-gold mt-0.5">✓</span>Savoir conseiller vos clients sur ces produits</li>
          <li className="flex items-start gap-2"><span className="text-orias-gold mt-0.5">✓</span>Préparer l'examen final IAS Niveau 1</li>
        </ul>
      </div>

      {/* Action */}
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          {done
            ? <p className="font-semibold text-emerald-600">Module complété !</p>
            : <p className="font-semibold text-gray-700">Prêt à valider ce module ?</p>}
          <p className="text-xs text-gray-400 mt-0.5">
            {done ? 'Votre progression a été enregistrée.' : 'Cliquez pour marquer le module comme terminé.'}
          </p>
        </div>
        <button
          onClick={handleComplete}
          disabled={done || marking}
          className={done
            ? 'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold bg-emerald-100 text-emerald-600 cursor-default'
            : 'btn-gold flex items-center gap-2 disabled:opacity-70'}
        >
          {marking
            ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Enregistrement…</>
            : done
              ? <><CheckCircleIcon className="w-4 h-4" />Complété</>
              : <>Marquer comme terminé</>
          }
        </button>
      </div>
    </div>
  )
}

// ── Unit card ─────────────────────────────────────────────────

function UnitCard({ unit, onOpen }) {
  const [open, setOpen] = useState(false)

  const statusConfig = {
    completed:   { label: 'Complété',   dot: 'bg-emerald-500', textCls: 'text-emerald-600', bgCls: 'bg-emerald-50 border-emerald-200' },
    in_progress: { label: 'En cours',   dot: 'bg-orias-gold',  textCls: 'text-orias-gold',  bgCls: 'bg-amber-50 border-amber-200' },
    locked:      { label: 'Verrouillé', dot: 'bg-gray-400',    textCls: 'text-gray-400',    bgCls: 'bg-gray-50 border-gray-200' },
  }
  const sc = statusConfig[unit.status]

  const btnLabel = unit.status === 'completed' ? 'Revoir' : unit.status === 'in_progress' ? 'Continuer' : 'Verrouillé'
  const btnCls   = unit.status === 'completed' ? 'btn-outline-green' : unit.status === 'in_progress' ? 'btn-gold' : 'px-5 py-2.5 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed'

  return (
    <div style={{ background:'#ffffff', borderRadius:'16px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #e8e2d6', borderLeft: unit.status === 'completed' ? '4px solid #10b981' : unit.status === 'in_progress' ? '4px solid #c9a84c' : '4px solid #e5e7eb', transition:'all 0.2s' }} className={`
`}>
      <div className="p-5">
        <div className="flex flex-wrap items-start gap-4 justify-between mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              unit.status === 'completed'   ? 'bg-emerald-100' :
              unit.status === 'in_progress' ? 'bg-orias-gold/10' : 'bg-gray-100'
            }`}>
              {unit.status === 'completed'
                ? <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                : unit.status === 'in_progress'
                  ? <span className="text-sm font-bold text-orias-gold">{unit.id}</span>
                  : <LockIcon className="w-4 h-4 text-gray-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ fontWeight:'600', fontSize:'15px', color: unit.status === 'locked' ? '#9ca3af' : '#1a3d2b', fontFamily:"'Montserrat', sans-serif", margin:0 }}>
                  Unité {unit.id} — {unit.title}
                </h3>
                <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background: unit.status==='completed' ? '#d1fae5' : unit.status==='in_progress' ? '#fef3c7' : '#f3f4f6', color: unit.status==='completed' ? '#10b981' : unit.status==='in_progress' ? '#d97706' : '#6b7280', fontFamily:"'Montserrat', sans-serif" }}>
                  <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: unit.status==='completed' ? '#10b981' : unit.status==='in_progress' ? '#c9a84c' : '#9ca3af', display:'inline-block' }} />{sc.label}
                </span>
              </div>
              <p className={`text-sm mt-0.5 ${unit.status === 'locked' ? 'text-gray-400' : 'text-gray-500'}`}>
                {unit.totalHours}h de formation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p style={{ fontSize:'15px', fontWeight:'700', color: unit.status==='locked' ? '#9ca3af' : '#1a3d2b', fontFamily:"'Montserrat', sans-serif", margin:0 }}>
              {unit.completedHours}/{unit.totalHours}h
            </p>
            <button
              className={btnCls}
              disabled={unit.status === 'locked'}
              onClick={() => unit.status !== 'locked' && onOpen(unit)}
            >
              {btnLabel}
            </button>
          </div>
        </div>

        {unit.status !== 'locked' && (
          <div className="mb-4">
            <ProgressBar value={unit.completedHours} max={unit.totalHours} height="h-2" />
          </div>
        )}

        {unit.description && (
          <p className={`text-sm mb-3 ${unit.status === 'locked' ? 'text-gray-400' : 'text-gray-500'}`}>
            {unit.description}
          </p>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orias-green transition-colors"
        >
          {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
          {unit.chapters.length} chapitres
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

// ── Main component ────────────────────────────────────────────

export default function MaFormation() {
  const { user } = useAuth()
  const [units,       setUnits]       = useState(FORMATION_UNITS)
  const [examResults, setExamResults] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [view,        setView]        = useState('list') // 'list' | 'lesson' | 'exam'
  const [activeUnit,  setActiveUnit]  = useState(null)

  useEffect(() => {
    if (!user?.id) { setLoadingData(false); return }
    Promise.all([
      fetchFormationProgress(user.id),
      fetchExamResults(user.id),
    ]).then(([progress, results]) => {
      setUnits(progress)
      setExamResults(results)
    }).finally(() => setLoadingData(false))
  }, [user?.id])

  const totalHours     = units.reduce((s, u) => s + u.totalHours, 0)
  const completedHours = units.reduce((s, u) => s + u.completedHours, 0)
  const examUnlocked   = units.every(u => u.status === 'completed')
  const ias1Result     = examResults.find(r => r.exam_type === 'ias1')

  const openLesson = async (unit) => {
    if (unit.status === 'in_progress' && user?.id) await startUnit(user.id, unit.id)
    setActiveUnit(unit)
    setView('lesson')
  }

  const handleUnitComplete = (unitId) => {
    setUnits(prev => {
      const updated = prev.map((u, idx) => {
        if (u.id === unitId) return { ...u, status: 'completed', completedHours: u.totalHours }
        if (idx > 0 && prev[idx - 1].id === unitId && u.status === 'locked')
          return { ...u, status: 'in_progress' }
        return u
      })
      return updated
    })
  }

  const handleExamDone = (result) => {
    if (result) setExamResults(prev => [result, ...prev])
    setView('list')
  }

  if (view === 'lesson' && activeUnit) {
    return (
      <div className="space-y-6">
        <LessonView
          unit={activeUnit}
          userId={user?.id}
          onDone={() => setView('list')}
          onComplete={handleUnitComplete}
        />
      </div>
    )
  }

  if (view === 'exam') {
    return (
      <div className="space-y-6">
        <ExamView
          userName={user?.name ?? 'Étudiant'}
          userId={user?.id}
          onDone={() => setView('list')}
        />
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px', fontFamily:"'Montserrat', sans-serif" }}>
      {/* Global progress */}
      <div style={{ background:'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'20px', padding:'28px', boxShadow:'0 4px 30px rgba(0,0,0,0.15)' }}>
        <div style={{ height:'2px', background:'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginBottom:'24px', borderRadius:'2px' }} />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 style={{ margin:0, fontSize:'20px', fontWeight:'700', color:'#ffffff', fontFamily:"'Montserrat', sans-serif", letterSpacing:'0.3px' }}>Formation IAS1</h2>
            <p style={{ margin:'4px 0 0', fontSize:'12px', color:'rgba(255,255,255,0.5)', fontFamily:"'Montserrat', sans-serif" }}>Programme officiel de formation intermédiaire en assurance</p>
          </div>
          {loadingData ? (
            <svg className="animate-spin w-6 h-6 text-orias-gold" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <div className="text-right">
              <p style={{ margin:0, fontSize:'32px', fontWeight:'700', color:'#c9a84c', fontFamily:"'Cormorant Garamond', serif" }}>{completedHours}<span style={{ fontSize:'16px', color:'rgba(255,255,255,0.4)' }}>/{totalHours}h</span></p>
              <p style={{ margin:'2px 0 0', fontSize:'11px', color:'rgba(255,255,255,0.4)', fontFamily:"'Montserrat', sans-serif" }}>heures complétées</p>
            </div>
          )}
        </div>
        <ProgressBar value={completedHours} max={totalHours} height="h-3" showLabel={true} label="Progression globale" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', marginTop:'16px' }}>
          {[
            { dot:'#10b981', label:'Complétées', value: units.filter(u => u.status === 'completed').length, color:'#10b981' },
            { dot:'#c9a84c', label:'En cours', value: units.filter(u => u.status === 'in_progress').length, color:'#c9a84c' },
            { dot:'rgba(255,255,255,0.3)', label:'Verrouillées', value: units.filter(u => u.status === 'locked').length, color:'rgba(255,255,255,0.4)' },
          ].map(({ dot, label, value, color }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 14px', borderRadius:'20px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:dot, display:'inline-block', boxShadow:`0 0 6px ${dot}` }} />
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', fontFamily:"'Montserrat', sans-serif" }}>{label} : <strong style={{ color }}>{value}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Units */}
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {units.map(unit => (
          <UnitCard key={unit.id} unit={unit} onOpen={openLesson} />
        ))}
      </div>

      {/* Final exam */}
      <div style={{ background:'#ffffff', border: examUnlocked ? '2px solid #c9a84c' : '1px solid #e8e2d6', borderRadius:'20px', padding:'24px', boxShadow: examUnlocked ? '0 4px 20px rgba(201,168,76,0.15)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              examUnlocked ? 'bg-orias-gold/10 border border-orias-gold/30' : 'bg-gray-100 border border-gray-200'
            }`}>
              <AwardIcon className={`w-6 h-6 ${examUnlocked ? 'text-orias-gold' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ fontWeight:'700', fontSize:'16px', color: examUnlocked ? '#1a3d2b' : '#9ca3af', fontFamily:"'Montserrat', sans-serif", margin:0 }}>Examen Final IAS1</h3>
                {!examUnlocked && (
                  <span className="status-badge bg-gray-100 border border-gray-200 text-gray-400 text-xs">
                    <LockIcon className="w-3 h-3" />Complétez tous les modules
                  </span>
                )}
                {ias1Result && (
                  <span className={`status-badge border text-xs ${ias1Result.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {ias1Result.passed ? 'Réussi' : 'Échoué'} — {ias1Result.score}/20
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-1.5 text-sm text-gray-500">
                <span>20 questions QCM</span><span>·</span>
                <span>Minimum 10/20 pour valider</span><span>·</span>
                <span>Certificat officiel à la clé</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {ias1Result?.passed ? (
              <button
                onClick={() => openCertificate(user?.name ?? 'Étudiant', ias1Result.score)}
                className="btn-gold flex items-center gap-2"
              >
                <DownloadIcon className="w-4 h-4" />
                Mon certificat
              </button>
            ) : examUnlocked ? (
              <button onClick={() => setView('exam')} className="btn-gold flex items-center gap-2">
                <AwardIcon className="w-4 h-4" />
                Passer l'examen
              </button>
            ) : (
              <div className="text-right">
                <button disabled className="px-5 py-2.5 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">Verrouillé</button>
                <p className="text-xs text-gray-400 mt-1">{totalHours - completedHours}h restantes</p>
              </div>
            )}
          </div>
        </div>

        {!examUnlocked && (
          <div className="mt-4">
            <ProgressBar value={completedHours} max={totalHours} height="h-1.5" showLabel={true} label="Progression vers l'examen" />
          </div>
        )}
      </div>
    </div>
  )
}
