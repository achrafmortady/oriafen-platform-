import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
// Chapitre 1.1 — La présentation du secteur de l'assurance (3h)
// Composant interactif : accordéons + flip cards + mini-quiz
// ─────────────────────────────────────────────────────────────

// ── Accordéon ────────────────────────────────────────────────
function Accordeon({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1.5px solid #e8e2d6', borderRadius: 14, overflow: 'hidden', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => !open && (e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.1)')}
      onMouseLeave={e => !open && (e.currentTarget.style.boxShadow = 'none')}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: open ? 'linear-gradient(135deg, #1a3d2b, #0d2818)' : '#fff', border: 'none', cursor: 'pointer', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: open ? '#c9a84c' : '#1a3d2b', fontFamily: 'Montserrat, sans-serif', textAlign: 'left' }}>{title}</span>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke={open ? '#c9a84c' : '#9ca3af'} strokeWidth="2"
          style={{ width: 18, height: 18, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '20px 24px', background: '#fafaf8', borderTop: '1px solid #e8e2d6', animation: 'fadeIn 0.2s ease' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Flip Card ─────────────────────────────────────────────────
function FlipCard({ front, back, color = '#1a3d2b' }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{ cursor: 'pointer', perspective: '1000px', height: 140 }}
      title="Cliquez pour retourner"
    >
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s ease',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Face avant */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>
          <span style={{ fontSize: 24, marginBottom: 8 }}>🃏</span>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.4, margin: 0 }}>{front}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 8, margin: '8px 0 0' }}>Cliquez pour voir</p>
        </div>
        {/* Face arrière */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          background: '#fff', border: `2px solid ${color}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.6, margin: 0 }}>{back}</p>
        </div>
      </div>
    </div>
  )
}

// ── Mini Quiz ─────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    q: "Quel est le rôle principal de l'assurance ?",
    options: ["Générer des bénéfices pour les actionnaires", "Transférer et mutualiser les risques entre les assurés", "Financer les dépenses publiques de l'État", "Remplacer la Sécurité Sociale"],
    correct: 1,
    explication: "L'assurance est un mécanisme de transfert et de mutualisation des risques — chacun cotise pour que tous soient couverts."
  },
  {
    q: "Quel est le rang de la France dans le marché mondial de l'assurance ?",
    options: ["1ère mondiale", "2ème européenne, 4ème mondiale", "1ère européenne", "3ème mondiale"],
    correct: 1,
    explication: "La France est le 2ème marché européen et le 4ème mondial, avec plus de 300 milliards d'euros de primes collectées par an."
  },
  {
    q: "Qu'est-ce qu'une mutuelle relevant du Code mutualité ?",
    options: ["Une société anonyme à but lucratif", "Une société sans but lucratif gérée par ses membres", "Un organisme paritaire employeurs/salariés", "Une filiale d'un groupe bancaire"],
    correct: 1,
    explication: "Les mutuelles (Code mutualité) sont des sociétés sans but lucratif, gérées démocratiquement par leurs adhérents."
  },
  {
    q: "Le principe indemnitaire signifie que :",
    options: ["L'indemnité peut dépasser le préjudice pour compenser la souffrance", "L'indemnité ne peut pas dépasser le préjudice réel subi", "L'indemnité est fixée forfaitairement à la souscription", "L'indemnité est toujours plafonnée à 10 000€"],
    correct: 1,
    explication: "Le principe indemnitaire garantit qu'on ne peut pas 's'enrichir' avec une assurance — l'indemnité = le préjudice réel, pas plus."
  },
  {
    q: "Le principe forfaitaire s'applique à :",
    options: ["Les assurances de biens (incendie, vol)", "Les assurances de responsabilité", "Les assurances de personnes (vie, décès)", "Les assurances automobiles"],
    correct: 2,
    explication: "Le principe forfaitaire s'applique aux assurances de personnes : la prestation est fixée contractuellement à l'avance, indépendamment du préjudice réel."
  },
]

function MiniQuiz() {
  const [current,  setCurrent]  = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score,    setScore]    = useState(0)
  const [done,     setDone]     = useState(false)

  const q = QUIZ_QUESTIONS[current]

  const handleSelect = (i) => {
    if (revealed) return
    setSelected(i)
  }

  const handleValidate = () => {
    if (selected === null) return
    setRevealed(true)
    if (selected === q.correct) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (current < QUIZ_QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      setDone(true)
    }
  }

  const handleReset = () => {
    setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setDone(false)
  }

  if (done) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100)
    const pass = score >= 3
    return (
      <div style={{ textAlign: 'center', padding: '24px 16px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: pass ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `2px solid ${pass ? '#10b981' : '#ef4444'}` }}>
          <span style={{ fontSize: 28 }}>{pass ? '🎉' : '📚'}</span>
        </div>
        <h3 style={{ fontWeight: 800, fontSize: 20, color: '#1a3d2b', marginBottom: 6 }}>{pass ? 'Bravo !' : 'Continuez à réviser'}</h3>
        <p style={{ fontSize: 28, fontWeight: 800, color: '#1a3d2b', margin: '0 0 4px' }}>
          {score}<span style={{ fontSize: 18, color: '#9ca3af' }}>/{QUIZ_QUESTIONS.length}</span>
        </p>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
          {pass ? 'Vous maîtrisez bien le chapitre 1.1 !' : 'Relisez les sections et retentez le quiz.'}
        </p>
        <button onClick={handleReset} style={{ background: '#1a3d2b', color: '#c9a84c', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
          Refaire le quiz
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Montserrat, sans-serif' }}>Question {current + 1} / {QUIZ_QUESTIONS.length}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#c9a84c', fontFamily: 'Montserrat, sans-serif' }}>Score : {score}/{current}</span>
      </div>
      <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#c9a84c', borderRadius: 99, width: `${((current + 1) / QUIZ_QUESTIONS.length) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Question */}
      <p style={{ fontWeight: 700, fontSize: 15, color: '#1a3d2b', marginBottom: 16, lineHeight: 1.5, fontFamily: 'Montserrat, sans-serif' }}>{q.q}</p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {q.options.map((opt, i) => {
          let bg = '#fff', border = '#e5e7eb', color = '#374151', fw = 400
          if (revealed) {
            if (i === q.correct) { bg = '#f0fdf4'; border = '#86efac'; color = '#15803d'; fw = 700 }
            else if (i === selected && i !== q.correct) { bg = '#fef2f2'; border = '#fca5a5'; color = '#dc2626'; fw = 600 }
          } else if (i === selected) {
            bg = 'rgba(201,168,76,0.08)'; border = '#c9a84c'; color = '#1a3d2b'; fw = 600
          }
          return (
            <button key={i} onClick={() => handleSelect(i)} style={{
              width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10, fontSize: 13,
              border: `2px solid ${border}`, background: bg, color, fontWeight: fw,
              cursor: revealed ? 'default' : 'pointer', transition: 'all 0.15s',
              fontFamily: 'Montserrat, sans-serif', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: i === selected ? (revealed && i !== q.correct ? '#fca5a5' : '#c9a84c') : '#f3f4f6', color: i === selected ? '#fff' : '#9ca3af' }}>
                {revealed && i === q.correct ? '✓' : revealed && i === selected && i !== q.correct ? '✗' : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* Explication */}
      {revealed && (
        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#92700a', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.6 }}>
          💡 <strong>Explication :</strong> {q.explication}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {!revealed ? (
          <button onClick={handleValidate} disabled={selected === null} style={{
            background: selected === null ? '#e5e7eb' : '#1a3d2b', color: selected === null ? '#9ca3af' : '#c9a84c',
            border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 13,
            cursor: selected === null ? 'not-allowed' : 'pointer', fontFamily: 'Montserrat, sans-serif'
          }}>Valider</button>
        ) : (
          <button onClick={handleNext} style={{ background: '#1a3d2b', color: '#c9a84c', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
            {current < QUIZ_QUESTIONS.length - 1 ? 'Question suivante →' : 'Voir les résultats'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function Chapitre11({ onComplete, isCompleted }) {
  const [activeSection, setActiveSection] = useState('cours') // 'cours' | 'flashcards' | 'quiz'

  const sections = [
    { id: 'cours',      label: '📖 Cours',       desc: 'Contenu théorique' },
    { id: 'flashcards', label: '🃏 Flashcards',   desc: 'Mémoriser les concepts' },
    { id: 'quiz',       label: '✅ Quiz',          desc: '5 questions' },
  ]

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Header du chapitre */}
      <div style={{ background: 'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)', borderRadius: 16, padding: '24px 28px', border: '1px solid rgba(201,168,76,0.25)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #c9a84c, #b8960a)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>Unité 1 · Chapitre 1.1</p>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 6px', fontFamily: 'Cormorant Garamond, serif', letterSpacing: '-0.01em' }}>
              La présentation du secteur de l'assurance
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              Durée : 3 heures · Objectifs pédagogiques : 3
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ v: '3h', l: 'Durée' }, { v: '5', l: 'Quiz' }, { v: '8', l: 'Flashcards' }].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 14px', border: '1px solid rgba(201,168,76,0.2)' }}>
                <div style={{ color: '#c9a84c', fontSize: 16, fontWeight: 800 }}>{s.v}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Objectifs */}
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Comprendre le rôle économique de l\'assurance', 'Identifier les acteurs du marché', 'Connaître les chiffres clés du secteur'].map((obj, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}>
              ✓ {obj}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation sections */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
            padding: '12px 18px', borderRadius: 12, border: `2px solid ${activeSection === s.id ? '#c9a84c' : '#e8e2d6'}`,
            background: activeSection === s.id ? 'rgba(201,168,76,0.08)' : '#fff',
            cursor: 'pointer', transition: 'all 0.15s'
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: activeSection === s.id ? '#1a3d2b' : '#6b7280' }}>{s.label}</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{s.desc}</span>
          </button>
        ))}
      </div>

      {/* ── SECTION COURS ── */}
      {activeSection === 'cours' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeIn 0.2s ease' }}>

          <Accordeon title="Le rôle de l'assurance" icon="🛡️" defaultOpen={true}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, margin: 0 }}>
                L'assurance est un <strong>mécanisme de transfert et de mutualisation des risques</strong>. Elle permet à un individu ou une entreprise de se prémunir contre les conséquences financières d'un événement aléatoire en échange du paiement d'une <strong>prime</strong>.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {[
                  { icon: '💰', title: 'Indemnisation', desc: 'Réparer les préjudices financiers après un sinistre' },
                  { icon: '🔒', title: 'Prévention', desc: 'Inciter les assurés à réduire les risques' },
                  { icon: '📈', title: 'Financement', desc: 'Les primes collectées sont investies dans l\'économie' },
                  { icon: '🏥', title: 'Protection sociale', desc: 'Complément indispensable de la Sécurité Sociale' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1.5px solid #e8e2d6' }}>
                    <span style={{ fontSize: 22, display: 'block', marginBottom: 6 }}>{icon}</span>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#1a3d2b', margin: '0 0 4px' }}>{title}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{desc}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(201,168,76,0.08)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(201,168,76,0.25)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#92700a', margin: '0 0 4px' }}>💡 À retenir</p>
                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>L'assurance repose sur le principe de <strong>mutualisation</strong> : chacun cotise pour tous. Un sinistre rare mais coûteux est ainsi supporté collectivement.</p>
              </div>
            </div>
          </Accordeon>

          <Accordeon title="Le marché français de l'assurance" icon="🇫🇷">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {[
                  { value: '300 Md€', label: 'Primes collectées/an', color: '#1a3d2b' },
                  { value: '4ème', label: 'Rang mondial', color: '#c9a84c' },
                  { value: '2ème', label: 'Rang européen', color: '#3b82f6' },
                  { value: '150 000', label: 'Salariés du secteur', color: '#10b981' },
                ].map(({ value, label, color }) => (
                  <div key={label} style={{ textAlign: 'center', background: '#fff', borderRadius: 12, padding: '14px 10px', border: '1.5px solid #e8e2d6' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color, margin: '0 0 4px', fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: 0, fontWeight: 600 }}>{label}</p>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#1a3d2b', marginBottom: 8 }}>Deux grandes branches :</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { title: 'Vie / Capitalisation', icon: '🌱', desc: 'Épargne, retraite, décès, prévoyance long terme', color: '#10b981' },
                    { title: 'IARD', icon: '🏠', desc: 'Incendie, Accidents, Risques Divers — biens et responsabilités', color: '#3b82f6' },
                  ].map(({ title, icon, desc, color }) => (
                    <div key={title} style={{ borderRadius: 12, padding: '14px', border: `2px solid ${color}20`, background: `${color}08` }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <p style={{ fontWeight: 700, fontSize: 13, color, margin: '6px 0 4px' }}>{title}</p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Accordeon>

          <Accordeon title="Les grandes familles d'assureurs" icon="🏢">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { type: 'Sociétés anonymes d\'assurance', desc: 'Entreprises commerciales à but lucratif. Capital détenu par des actionnaires. Ex : AXA, Allianz, Generali.', badge: 'Lucratif', color: '#ef4444' },
                { type: 'Mutuelles (Code mutualité)', desc: 'Sociétés sans but lucratif, gérées démocratiquement par leurs membres. Ex : MGEN, Harmonie Mutuelle.', badge: 'Non lucratif', color: '#10b981' },
                { type: 'Institutions de prévoyance', desc: 'Organismes paritaires gérés conjointement par employeurs et salariés. Ex : Malakoff Humanis, AG2R.', badge: 'Paritaire', color: '#3b82f6' },
                { type: 'Mutuelles (Code assurances)', desc: 'Mutuelles soumises au Code des assurances (distinctes des mutuelles du Code mutualité). Ex : MAIF, MAAF.', badge: 'Code assurances', color: '#8b5cf6' },
              ].map(({ type, desc, badge, color }) => (
                <div key={type} style={{ display: 'flex', gap: 12, padding: '14px', borderRadius: 12, border: '1.5px solid #e8e2d6', background: '#fff', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: `${color}15`, color, border: `1px solid ${color}30` }}>{badge}</span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#1a3d2b', margin: '0 0 4px' }}>{type}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Accordeon>

          <Accordeon title="Principes fondamentaux à maîtriser" icon="⚖️">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { title: 'Principe indemnitaire', tag: 'Assurances de dommages', color: '#ef4444', content: "L'indemnité versée ne peut jamais dépasser le préjudice réel subi par l'assuré. On ne peut pas s'enrichir grâce à une assurance.", exemple: "Un bien assuré pour 20 000€ mais valant réellement 15 000€ sera indemnisé 15 000€ maximum en cas de destruction totale." },
                { title: 'Principe forfaitaire', tag: 'Assurances de personnes', color: '#3b82f6', content: "La prestation est fixée contractuellement à l'avance, indépendamment du préjudice réel. Elle est versée dès que le risque se réalise.", exemple: "Un capital décès de 100 000€ sera versé aux bénéficiaires, quels que soient les revenus perdus réellement par la famille." },
                { title: 'Principe de mutualisation', tag: 'Fondement de l\'assurance', color: '#10b981', content: "Chaque assuré cotise à un fonds commun. Les sinistres des uns sont payés par les primes de tous. La loi des grands nombres permet de prédire les sinistres.", exemple: "Sur 1 000 assurés auto, les statistiques permettent de prévoir que 50 auront un sinistre. Chacun cotise pour couvrir ces 50 sinistres." },
              ].map(({ title, tag, color, content, exemple }) => (
                <div key={title} style={{ borderRadius: 12, border: `1.5px solid ${color}25`, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: `${color}08`, borderBottom: `1px solid ${color}20` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#1a3d2b' }}>{title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${color}15`, color, marginLeft: 'auto', whiteSpace: 'nowrap' }}>{tag}</span>
                  </div>
                  <div style={{ padding: '14px 16px', background: '#fff' }}>
                    <p style={{ fontSize: 13, color: '#374151', margin: '0 0 10px', lineHeight: 1.7 }}>{content}</p>
                    <div style={{ background: '#f9f7f3', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${color}` }}>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}><strong>Exemple :</strong> {exemple}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Accordeon>
        </div>
      )}

      {/* ── SECTION FLASHCARDS ── */}
      {activeSection === 'flashcards' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: 'rgba(201,168,76,0.08)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(201,168,76,0.3)', marginBottom: 16, fontSize: 13, color: '#92700a', fontWeight: 600 }}>
            🃏 Cliquez sur une carte pour révéler la réponse. Mémorisez chaque concept avant de passer au quiz.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {[
              { front: 'Qu\'est-ce que la mutualisation des risques ?', back: 'Chacun cotise pour tous. Les sinistres des uns sont payés par les primes de l\'ensemble des assurés.', color: '#1a3d2b' },
              { front: 'Qu\'est-ce que le principe indemnitaire ?', back: 'L\'indemnité ne peut pas dépasser le préjudice réel subi. On ne peut pas s\'enrichir avec une assurance.', color: '#c9a84c' },
              { front: 'À quoi s\'applique le principe forfaitaire ?', back: 'Aux assurances de personnes (vie, décès). La prestation est fixée à l\'avance dans le contrat.', color: '#3b82f6' },
              { front: 'Rang de la France dans l\'assurance mondiale ?', back: '4ème marché mondial, 2ème marché européen. Plus de 300 milliards d\'euros de primes par an.', color: '#10b981' },
              { front: 'Quelle est la différence entre une SA et une Mutuelle ?', back: 'Une SA est à but lucratif (actionnaires). Une Mutuelle est sans but lucratif, gérée par ses membres.', color: '#8b5cf6' },
              { front: 'Qu\'est-ce qu\'une Institution de prévoyance ?', back: 'Organisme paritaire géré conjointement par représentants des employeurs ET des salariés.', color: '#ef4444' },
              { front: 'Que sont les branches IARD ?', back: 'Incendie, Accidents, Risques Divers. Toutes les assurances de biens et de responsabilité hors assurance vie.', color: '#f59e0b' },
              { front: 'Quelles sont les 4 fonctions de l\'assurance ?', back: '1. Indemnisation des sinistres\n2. Prévention des risques\n3. Financement de l\'économie\n4. Protection sociale', color: '#06b6d4' },
            ].map((card, i) => (
              <FlipCard key={i} front={card.front} back={card.back} color={card.color} />
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION QUIZ ── */}
      {activeSection === 'quiz' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8e2d6', padding: '24px', animation: 'fadeIn 0.2s ease', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: '#1a3d2b', margin: '0 0 4px' }}>Quiz — Chapitre 1.1</h3>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>5 questions · Révisez le cours avant de commencer · Score minimum recommandé : 3/5</p>
          </div>
          <MiniQuiz />
        </div>
      )}

      {/* ── Bouton compléter ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: isCompleted ? '2px solid #c9a84c' : '1.5px solid #e8e2d6', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, boxShadow: isCompleted ? '0 4px 16px rgba(201,168,76,0.12)' : 'none' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: isCompleted ? '#10b981' : '#1a3d2b', margin: '0 0 2px' }}>
            {isCompleted ? '✅ Chapitre complété !' : 'Terminer le chapitre'}
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            {isCompleted ? 'Votre progression a été enregistrée.' : 'Parcourez le cours, les flashcards et le quiz avant de valider.'}
          </p>
        </div>
        {!isCompleted && (
          <button onClick={onComplete} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a3d2b', color: '#c9a84c', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,61,43,0.25)', fontFamily: 'Montserrat, sans-serif' }}>
            Valider le chapitre →
          </button>
        )}
      </div>
    </div>
  )
}
