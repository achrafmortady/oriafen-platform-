import { useState, useRef } from 'react'

const SUPABASE = 'https://cgmjjxosgnfsqupjketw.supabase.co/storage/v1/object/public/formation'
const VIDEO_URL  = `${SUPABASE}/oriafen_ch54_video.mp4`
const TOTAL_SLIDES = 12
const SLIDE_URLS = Array.from({ length: TOTAL_SLIDES }, (_, i) =>
  `${SUPABASE}/ch54_slide_${String(i + 1).padStart(2, '0')}.jpg`
)

const QUIZ = [
  {
    q: "Quels sont les éléments principaux qui composent une prime d'assurance ?",
    options: ["Le salaire des agents d'assurance uniquement", "La prime pure (coût technique des sinistres) + les chargements (frais de gestion, commerciaux, bénéfice) + les taxes", "Le rendement des placements financiers uniquement", "Uniquement le coût des sinistres"], correct: 1,
    explication: "La prime commerciale = prime pure (probabilité × coût moyen des sinistres) + chargements de gestion (frais fixes et variables) + chargements commerciaux (commissions) + bénéfice de l'assureur + taxes (taxe d'assurance)."
  },
  {
    q: "Qu'est-ce que la prime pure en actuariat ?",
    options: ["La prime minimale fixée par l'État", "La prime sans les taxes", "Le coût théorique des sinistres calculé statistiquement : fréquence × coût moyen", "La prime payée uniquement en cas de sinistre"], correct: 2,
    explication: "La prime pure représente le coût technique pur des sinistres : c'est le produit de la fréquence des sinistres (probabilité de survenance) par leur coût moyen. C'est la base du calcul actuariel avant ajout des frais et marges."
  },
  {
    q: "Qu'est-ce que le taux de sinistralité (S/P) ?",
    options: ["Le rapport entre les sinistres payés et les primes encaissées — indicateur de rentabilité technique", "Le pourcentage de sinistres refusés par l'assureur", "Le délai moyen de traitement des sinistres", "Le nombre de sinistres par assuré"], correct: 0,
    explication: "Le taux S/P (Sinistres sur Primes) mesure la part des primes consacrée au paiement des sinistres. Un S/P de 70% signifie que 70€ sont versés en sinistres pour 100€ de primes. C'est l'indicateur clé de la rentabilité technique d'un portefeuille."
  },
  {
    q: "Qu'est-ce qu'une exclusion de garantie ?",
    options: ["Une garantie optionnelle payante", "Un cas ou une situation expressément exclu(e) du champ de la couverture d'assurance", "Un sinistre dont le montant dépasse le plafond", "Une clause qui réduit la prime en échange d'une limitation des garanties"], correct: 1,
    explication: "Les exclusions délimitent le périmètre exact de la garantie. Elles peuvent être légales (imposées par la loi : faute intentionnelle, guerre) ou conventionnelles (définies contractuellement). Elles doivent être rédigées en caractères apparents et compréhensibles."
  },
  {
    q: "Qu'est-ce que la coassurance ?",
    options: ["Quand un assuré souscrit plusieurs contrats pour le même risque", "Un contrat d'assurance collectif pour une association", "Une assurance souscrite en couple", "Quand plusieurs assureurs se partagent la couverture d'un même risque selon des quotes-parts définies à l'avance"], correct: 3,
    explication: "La coassurance permet à plusieurs assureurs de partager un risque important selon des proportions fixes (apériteur + co-assureurs). Chaque assureur ne couvre que sa quote-part et n'est responsable que de celle-ci, contrairement à la réassurance où l'assureur reste l'interlocuteur unique."
  },
]

// ─── Step indicator ───────────────────────────────────────────
function StepBar({ step }) {
  const steps = [
    { n: 1, label: 'Vidéo',  icon: '🎬' },
    { n: 2, label: 'Slides', icon: '📊' },
    { n: 3, label: 'Quiz',   icon: '✅' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {steps.map((s, i) => {
        const done   = step > s.n
        const active = step === s.n
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 18 : 20,
                background: done ? '#10b981' : active ? '#1a3d2b' : '#e5e7eb',
                border: active ? '3px solid #c9a84c' : 'none',
                transition: 'all 0.3s', marginBottom: 6,
              }}>
                {done ? '✓' : s.icon}
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: done ? '#10b981' : active ? '#1a3d2b' : '#9ca3af', fontFamily: 'Montserrat, sans-serif' }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 2, height: 3, background: step > s.n ? '#10b981' : '#e5e7eb', borderRadius: 99, margin: '0 8px', marginBottom: 24, transition: 'background 0.3s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1 — Video ───────────────────────────────────────────
function VideoStep({ onComplete }) {
  const videoRef   = useRef(null)
  const [watched,  setWatched]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const pct = (v.currentTime / v.duration) * 100
    setProgress(pct)
    if (pct >= 95 && !watched) setWatched(true)
  }

  const formatTime = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(201,168,76,0.08)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(201,168,76,0.3)' }}>
        <span style={{ fontSize: 18 }}>🎬</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#92700a', margin: '0 0 2px', fontFamily: 'Montserrat, sans-serif' }}>Regardez la vidéo en entier</p>
          <p style={{ fontSize: 12, color: '#92700a', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>Les slides et le quiz se débloquent une fois la vidéo terminée.</p>
        </div>
      </div>
      <div style={{ borderRadius: 16, overflow: 'hidden', background: '#000', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <video ref={videoRef} src={VIDEO_URL} controls controlsList="nodownload"
          onContextMenu={e => e.preventDefault()}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
          style={{ width: '100%', display: 'block', maxHeight: 580 }}
        />
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'Montserrat, sans-serif' }}>Progression de visionnage</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: watched ? '#10b981' : '#1a3d2b', fontFamily: 'Montserrat, sans-serif' }}>
            {watched ? '✓ Complété' : `${Math.round(progress)}%`}
          </span>
        </div>
        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: watched ? '#10b981' : '#c9a84c', borderRadius: 99, width: `${progress}%`, transition: 'width 0.5s ease' }} />
        </div>
        {duration > 0 && <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0', fontFamily: 'Montserrat, sans-serif' }}>Durée totale : {formatTime(duration)}</p>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onComplete} disabled={!watched} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: watched ? '#1a3d2b' : '#e5e7eb',
          color: watched ? '#c9a84c' : '#9ca3af',
          border: 'none', borderRadius: 12, padding: '14px 28px',
          fontWeight: 700, fontSize: 14, cursor: watched ? 'pointer' : 'not-allowed',
          fontFamily: 'Montserrat, sans-serif', transition: 'all 0.2s',
          boxShadow: watched ? '0 4px 12px rgba(26,61,43,0.25)' : 'none'
        }}>
          {watched ? 'Passer aux slides →' : '🔒 Finissez la vidéo d\'abord'}
        </button>
      </div>
    </div>
  )
}

// ─── Step 2 — Slides ──────────────────────────────────────────
function SlidesStep({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(1)
  const [visited,      setVisited]      = useState(new Set([1]))
  const slideRef = useRef(null)
  const allVisited = visited.size >= TOTAL_SLIDES

  const goTo = (n) => {
    if (n < 1 || n > TOTAL_SLIDES) return
    const scrollY = window.scrollY || document.documentElement.scrollTop
    setCurrentSlide(n)
    setVisited(prev => new Set([...prev, n]))
    // Double RAF to ensure render is complete before restoring scroll
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' })
        document.documentElement.scrollTop = scrollY
        document.body.scrollTop = scrollY
      })
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(201,168,76,0.08)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(201,168,76,0.3)' }}>
        <span style={{ fontSize: 18 }}>📊</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#92700a', margin: '0 0 2px', fontFamily: 'Montserrat, sans-serif' }}>Parcourez toutes les slides</p>
          <p style={{ fontSize: 12, color: '#92700a', margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
            Vous devez consulter les {TOTAL_SLIDES} slides pour débloquer le quiz. {!allVisited && `(${visited.size}/${TOTAL_SLIDES} vues)`}
          </p>
        </div>
      </div>

      <div ref={slideRef} style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid #e8e2d6', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', background: '#000', position: 'relative', aspectRatio: '16/9' }}>
        <img key={currentSlide} src={SLIDE_URLS[currentSlide - 1]} alt={`Slide ${currentSlide}`}
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain', position: 'absolute', top: 0, left: 0 }}
        />
        <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(26,61,43,0.9)', color: '#c9a84c', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>
          {currentSlide} / {TOTAL_SLIDES}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: TOTAL_SLIDES }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => goTo(n)} style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 11, fontFamily: 'Montserrat, sans-serif',
            background: currentSlide === n ? '#1a3d2b' : visited.has(n) ? 'rgba(16,185,129,0.15)' : '#e5e7eb',
            color: currentSlide === n ? '#c9a84c' : visited.has(n) ? '#10b981' : '#6b7280',
            border: `2px solid ${currentSlide === n ? '#c9a84c' : visited.has(n) ? '#10b981' : '#d1d5db'}`,
            transition: 'all 0.15s'
          }}>
            {visited.has(n) && n !== currentSlide ? '✓' : n}
          </button>
        ))}
      </div>

      {/* Prev / Next */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button onClick={() => goTo(currentSlide - 1)} disabled={currentSlide === 1} style={{
          background: 'transparent', color: currentSlide === 1 ? '#d1d5db' : '#1a3d2b',
          border: `1.5px solid ${currentSlide === 1 ? '#e5e7eb' : '#1a3d2b'}`,
          borderRadius: 10, padding: '11px 22px', fontWeight: 600, fontSize: 13,
          cursor: currentSlide === 1 ? 'not-allowed' : 'pointer', fontFamily: 'Montserrat, sans-serif'
        }}>← Précédent</button>

        <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Montserrat, sans-serif' }}>{visited.size}/{TOTAL_SLIDES} slides vues</span>

        {currentSlide < TOTAL_SLIDES ? (
          <button onClick={() => goTo(currentSlide + 1)} style={{
            background: '#1a3d2b', color: '#c9a84c', border: 'none',
            borderRadius: 10, padding: '11px 22px', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'
          }}>Suivant →</button>
        ) : (
          <button onClick={onComplete} disabled={!allVisited} style={{
            background: allVisited ? '#1a3d2b' : '#e5e7eb',
            color: allVisited ? '#c9a84c' : '#9ca3af',
            border: 'none', borderRadius: 12, padding: '11px 24px',
            fontWeight: 700, fontSize: 13, cursor: allVisited ? 'pointer' : 'not-allowed',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            {allVisited ? 'Passer au quiz →' : `🔒 Vues ${visited.size}/${TOTAL_SLIDES}`}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Step 3 — Quiz ────────────────────────────────────────────
function QuizStep({ onComplete }) {
  const [current,  setCurrent]  = useState(0)
  const [answers,  setAnswers]  = useState({})
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [result,   setResult]   = useState(null)
  const MIN_PASS = 3
  const total    = QUIZ.length
  const q        = QUIZ[current]

  const handleValidate = () => {
    if (selected === null) return
    setRevealed(true)
    setAnswers(prev => ({ ...prev, [current]: selected }))
  }

  const handleNext = () => {
    if (current < total - 1) {
      setCurrent(c => c + 1); setSelected(null); setRevealed(false)
    } else {
      const final = { ...answers, [current]: selected }
      const score = QUIZ.reduce((s, item, i) => s + (final[i] === item.correct ? 1 : 0), 0)
      setResult({ score, passed: score >= MIN_PASS })
    }
  }

  if (result) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: result.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `2px solid ${result.passed ? '#10b981' : '#ef4444'}` }}>
          {result.passed ? '🎉' : '📚'}
        </div>
        <h3 style={{ fontWeight: 800, fontSize: 22, color: '#1a3d2b', marginBottom: 8, fontFamily: 'Cormorant Garamond, serif' }}>
          {result.passed ? 'Félicitations !' : 'Score insuffisant'}
        </h3>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#1a3d2b', lineHeight: 1, margin: '12px 0 4px' }}>
          {result.score}<span style={{ fontSize: 22, color: '#9ca3af', fontWeight: 400 }}>/{total}</span>
        </div>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '8px 0 24px', fontFamily: 'Montserrat, sans-serif' }}>
          {result.passed ? 'Vous avez validé le Chapitre 5.4. Excellent travail !' : `Score minimum requis : ${MIN_PASS}/${total}. Révisez les slides et retentez.`}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {result.passed ? (
            <button onClick={onComplete} style={{ background: '#1a3d2b', color: '#c9a84c', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', boxShadow: '0 4px 12px rgba(26,61,43,0.25)' }}>
              ✅ Valider le chapitre →
            </button>
          ) : (
            <button onClick={() => { setCurrent(0); setAnswers({}); setSelected(null); setRevealed(false); setResult(null) }}
              style={{ background: '#1a3d2b', color: '#c9a84c', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
              Réessayer le quiz
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Montserrat, sans-serif' }}>Question {current + 1} / {total}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#c9a84c', fontFamily: 'Montserrat, sans-serif' }}>Minimum {MIN_PASS}/{total} pour valider</span>
      </div>
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#c9a84c', borderRadius: 99, width: `${((current + 1) / total) * 100}%`, transition: 'width 0.3s' }} />
      </div>
      <p style={{ fontWeight: 700, fontSize: 15, color: '#1a3d2b', marginBottom: 16, lineHeight: 1.5, fontFamily: 'Montserrat, sans-serif' }}>{q.q}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {q.options.map((opt, i) => {
          let bg = '#fff', border = '#e5e7eb', color = '#374151', fw = 400
          if (revealed) {
            if (i === q.correct) { bg = '#f0fdf4'; border = '#86efac'; color = '#15803d'; fw = 700 }
            else if (i === selected && i !== q.correct) { bg = '#fef2f2'; border = '#fca5a5'; color = '#dc2626'; fw = 600 }
          } else if (i === selected) { bg = 'rgba(201,168,76,0.08)'; border = '#c9a84c'; color = '#1a3d2b'; fw = 600 }
          return (
            <button key={i} onClick={() => !revealed && setSelected(i)} style={{
              width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10, fontSize: 13,
              border: `2px solid ${border}`, background: bg, color, fontWeight: fw,
              cursor: revealed ? 'default' : 'pointer', transition: 'all 0.15s',
              fontFamily: 'Montserrat, sans-serif', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: revealed && i === q.correct ? '#10b981' : revealed && i === selected ? '#ef4444' : i === selected ? '#c9a84c' : '#f3f4f6', color: (revealed || i === selected) ? '#fff' : '#9ca3af' }}>
                {revealed && i === q.correct ? '✓' : revealed && i === selected && i !== q.correct ? '✗' : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          )
        })}
      </div>
      {revealed && (
        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#92700a', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.6 }}>
          💡 <strong>Explication :</strong> {q.explication}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!revealed ? (
          <button onClick={handleValidate} disabled={selected === null} style={{ background: selected === null ? '#e5e7eb' : '#1a3d2b', color: selected === null ? '#9ca3af' : '#c9a84c', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, fontSize: 13, cursor: selected === null ? 'not-allowed' : 'pointer', fontFamily: 'Montserrat, sans-serif' }}>Valider</button>
        ) : (
          <button onClick={handleNext} style={{ background: '#1a3d2b', color: '#c9a84c', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
            {current < total - 1 ? 'Question suivante →' : 'Voir les résultats'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function Chapitre54({ onComplete, isCompleted }) {
  const [step,      setStep]      = useState(1)
  const [reviewing, setReviewing] = useState(false)

  if (isCompleted && !reviewing) {
    return (
      <div style={{ fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '2px solid #c9a84c', padding: '28px 32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(201,168,76,0.12)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <h3 style={{ fontWeight: 800, fontSize: 20, color: '#1a3d2b', marginBottom: 6, fontFamily: 'Cormorant Garamond, serif' }}>Chapitre 5.4 complété !</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Vous avez visionné la vidéo, parcouru les slides et réussi le quiz.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setStep(1); setReviewing(true) }} style={{ background: '#1a3d2b', color: '#c9a84c', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🎬 Revoir la vidéo</button>
            <button onClick={() => { setStep(2); setReviewing(true) }} style={{ background: 'transparent', color: '#1a3d2b', border: '1.5px solid #1a3d2b', borderRadius: 10, padding: '12px 24px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>📊 Revoir les slides</button>
            <button onClick={() => { setStep(3); setReviewing(true) }} style={{ background: 'transparent', color: '#1a3d2b', border: '1.5px solid #1a3d2b', borderRadius: 10, padding: '12px 24px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>✅ Refaire le quiz</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)', borderRadius: 16, padding: '22px 28px', marginBottom: 20, border: '1px solid rgba(201,168,76,0.25)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #c9a84c, #b8960a)' }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>Unité 5 · Chapitre 5.4</p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 4px', fontFamily: 'Cormorant Garamond, serif' }}>Garanties et tarification — Architecture des prix en assurance</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Durée : 12 heures · Vidéo + Slides + Quiz</p>
      </div>

      <StepBar step={step} />

      {reviewing && (
        <button onClick={() => setReviewing(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontWeight: 500, marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour au résumé
        </button>
      )}

      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8e2d6', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', animation: 'fadeIn 0.25s ease' }}>
        {step === 1 && <VideoStep onComplete={() => setStep(2)} />}
        {step === 2 && <SlidesStep onComplete={() => setStep(3)} />}
        {step === 3 && <QuizStep onComplete={reviewing ? () => setReviewing(false) : onComplete} />}
      </div>
    </div>
  )
}
