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
import Chapitre23 from './Chapitre23'
import Chapitre31 from './Chapitre31'
import Chapitre32 from './Chapitre32'
import Chapitre33 from './Chapitre33'
import Chapitre41 from './Chapitre41'
import Chapitre42 from './Chapitre42'
import Chapitre51 from './Chapitre51'
import Chapitre52 from './Chapitre52'
import Chapitre53 from './Chapitre53'
import Chapitre54 from './Chapitre54'
import Chapitre55 from './Chapitre55'

// ── Certificate ───────────────────────────────────────────────

function openCertificate(userName, score) {
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const pct = Math.round((score / 20) * 100)
  const certNum = 'OA-IAS1-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5)

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Attestation IAS Niveau 1 — Oriafen Academy</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:100%;min-height:100vh;background:#e8e2d4;}
    body{font-family:'Montserrat',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:40px 20px 60px;}

    /* ── BUTTONS ── */
    .actions{display:flex;gap:12px;margin-bottom:28px;no-print:true;}
    .btn{padding:10px 24px;border-radius:6px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:600;cursor:pointer;letter-spacing:.5px;border:none;transition:all .2s;}
    .btn-print{background:#1a3d2b;color:#fff;}
    .btn-print:hover{background:#0f2419;}
    .btn-close{background:#fff;color:#1a3d2b;border:2px solid #1a3d2b;}

    /* ── PAGE ── */
    .page{background:#fff;width:794px;min-height:1123px;position:relative;overflow:hidden;box-shadow:0 20px 80px rgba(0,0,0,.25);}

    /* ── HEADER BAND ── */
    .header-band{background:#1a3d2b;width:100%;padding:32px 60px 28px;display:flex;align-items:center;justify-content:space-between;}
    .logo-block{display:flex;align-items:center;gap:16px;}
    .logo-shield{width:52px;height:52px;}
    .logo-text{display:flex;flex-direction:column;}
    .logo-main{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:#f5f0e8;letter-spacing:3px;line-height:1;}
    .logo-sub{font-family:'Montserrat',sans-serif;font-size:7.5px;font-weight:500;color:#c9a84c;letter-spacing:4px;text-transform:uppercase;margin-top:3px;}
    .header-right{text-align:right;}
    .header-label{font-size:9px;font-weight:500;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;}
    .header-ref{font-size:11px;font-weight:600;color:#f5f0e8;margin-top:3px;letter-spacing:.5px;}

    /* ── GOLD LINE ── */
    .gold-line{height:4px;background:linear-gradient(90deg,#c9a84c 0%,#e8d48a 50%,#c9a84c 100%);}

    /* ── BODY ── */
    .body{padding:50px 60px 40px;}

    /* ── DECREE SECTION ── */
    .decree-wrap{text-align:center;margin-bottom:36px;}
    .decree-top{font-size:9px;font-weight:700;color:#c9a84c;letter-spacing:5px;text-transform:uppercase;margin-bottom:10px;}
    .decree-title{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:700;color:#1a3d2b;line-height:1.15;margin-bottom:6px;}
    .decree-sub{font-family:'Cormorant Garamond',serif;font-size:20px;font-style:italic;color:#4a6d5a;margin-bottom:18px;}
    .decree-rule{height:1px;background:linear-gradient(90deg,transparent,#c9a84c,transparent);margin:0 auto;width:320px;}

    /* ── LEGAL BLOCK ── */
    .legal-box{background:#f9f7f2;border-left:3px solid #c9a84c;padding:14px 20px;margin-bottom:32px;border-radius:0 6px 6px 0;}
    .legal-box p{font-size:10.5px;color:#555;line-height:1.75;}
    .legal-box strong{color:#1a3d2b;font-weight:600;}

    /* ── CERTIFIE ── */
    .certifie-label{font-size:10px;font-weight:700;color:#888;letter-spacing:3px;text-transform:uppercase;text-align:center;margin-bottom:8px;}
    .name-wrap{text-align:center;margin-bottom:28px;}
    .candidate-name{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:700;font-style:italic;color:#1a3d2b;display:inline-block;border-bottom:2px solid #c9a84c;padding-bottom:6px;line-height:1.2;}

    /* ── ATTESTATION TEXT ── */
    .attest-text{font-size:12px;color:#444;line-height:2;text-align:center;margin-bottom:32px;}
    .attest-text .highlight{color:#1a3d2b;font-weight:700;}
    .attest-text .score-chip{background:#1a3d2b;color:#c9a84c;padding:2px 12px;border-radius:20px;font-weight:700;font-size:14px;}

    /* ── 5 UNITS ── */
    .units-title{font-size:9px;font-weight:700;color:#c9a84c;letter-spacing:4px;text-transform:uppercase;margin-bottom:12px;text-align:center;}
    .units-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:32px;}
    .unit-item{background:#f5f0e8;border:1px solid #e8dfc8;border-radius:6px;padding:10px 14px;display:flex;align-items:center;gap:10px;}
    .unit-num{width:28px;height:28px;background:#1a3d2b;color:#c9a84c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
    .unit-text{font-size:10px;color:#3a3a3a;line-height:1.4;font-weight:500;}
    .unit-hours{margin-left:auto;font-size:10px;font-weight:700;color:#c9a84c;white-space:nowrap;}
    /* 5th unit full width */
    .unit-item.full{grid-column:1/-1;}

    /* ── DIVIDER ── */
    .divider{height:1px;background:#e8e2d6;margin:0 0 28px;}

    /* ── LEGAL FOOTER ── */
    .legal-footer{font-size:9.5px;color:#666;line-height:1.7;margin-bottom:28px;padding:12px 16px;background:#fafaf8;border:1px solid #ede8de;border-radius:6px;}

    /* ── SIGNATURES ── */
    .sig-row{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:0;}
    .sig-block{text-align:center;flex:1;}
    .sig-block.center{flex:0 0 auto;padding:0 20px;}
    .sig-line{height:1px;background:#ccc;width:160px;margin:0 auto 8px;}
    .sig-name{font-size:11px;font-weight:700;color:#1a3d2b;}
    .sig-role{font-size:9.5px;color:#888;margin-top:2px;}
    .sig-date{font-size:9px;color:#aaa;margin-top:1px;}

    /* ── CACHET ── */
    .cachet{width:100px;height:100px;border-radius:50%;border:3px double #1a3d2b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;margin:0 auto;}
    .cachet-main{font-family:'Cormorant Garamond',serif;font-size:11px;font-weight:700;color:#1a3d2b;letter-spacing:1px;text-align:center;line-height:1.2;}
    .cachet-sub{font-size:7px;color:#c9a84c;font-weight:700;letter-spacing:2px;text-transform:uppercase;}
    .cachet-check{font-size:16px;color:#1a3d2b;}

    /* ── FOOTER BAND ── */
    .footer-band{background:#1a3d2b;padding:14px 60px;display:flex;justify-content:space-between;align-items:center;margin-top:auto;}
    .footer-legal{font-size:8.5px;color:#a0b8aa;letter-spacing:.3px;line-height:1.5;}
    .footer-orias{font-size:8.5px;color:#c9a84c;font-weight:600;letter-spacing:.5px;}

    /* ── WATERMARK ── */
    .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-family:'Cormorant Garamond',serif;font-size:96px;font-weight:700;color:rgba(26,61,43,.04);pointer-events:none;white-space:nowrap;z-index:0;}

    /* ── CORNER ORNAMENTS ── */
    .corner{position:absolute;width:40px;height:40px;}
    .corner.tl{top:8px;left:8px;border-top:2px solid #c9a84c;border-left:2px solid #c9a84c;}
    .corner.tr{top:8px;right:8px;border-top:2px solid #c9a84c;border-right:2px solid #c9a84c;}
    .corner.bl{bottom:8px;left:8px;border-bottom:2px solid #c9a84c;border-left:2px solid #c9a84c;}
    .corner.br{bottom:8px;right:8px;border-bottom:2px solid #c9a84c;border-right:2px solid #c9a84c;}

    @media print{
      html,body{background:#fff;padding:0;}
      .actions{display:none!important;}
      .page{box-shadow:none;width:100%;min-height:100vh;}
    }
  </style>
</head>
<body>
  <div class="actions no-print">
    <button class="btn btn-print" onclick="window.print()">🖨 Imprimer / Télécharger PDF</button>
    <button class="btn btn-close" onclick="window.close()">✕ Fermer</button>
  </div>

  <div class="page">
    <!-- Corner ornaments -->
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>
    <!-- Watermark -->
    <div class="watermark">ORIAFEN</div>

    <!-- Header -->
    <div class="header-band">
      <div class="logo-block">
        <svg class="logo-shield" viewBox="0 0 52 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M26 2L4 12v18c0 13 9.5 24.5 22 28 12.5-3.5 22-15 22-28V12L26 2z" fill="#c9a84c" opacity=".15"/>
          <path d="M26 2L4 12v18c0 13 9.5 24.5 22 28 12.5-3.5 22-15 22-28V12L26 2z" stroke="#c9a84c" stroke-width="1.5" fill="none"/>
          <path d="M26 8L8 16v14c0 10 7.5 19.5 18 22.5 10.5-3 18-12.5 18-22.5V16L26 8z" fill="#c9a84c" opacity=".08"/>
          <text x="26" y="38" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="16" font-weight="700" fill="#c9a84c" letter-spacing="1">O</text>
        </svg>
        <div class="logo-text">
          <span class="logo-main">ORIAFEN</span>
          <span class="logo-sub">Academy · Votre ORIAS, Notre Priorité</span>
        </div>
      </div>
      <div class="header-right">
        <div class="header-label">Référence du document</div>
        <div class="header-ref">${certNum}</div>
      </div>
    </div>
    <div class="gold-line"></div>

    <!-- Body -->
    <div class="body">

      <!-- Decree -->
      <div class="decree-wrap">
        <div class="decree-top">Art. R 512-11 · Code des assurances</div>
        <div class="decree-title">Attestation de Formation</div>
        <div class="decree-sub">et de Contrôle des Compétences Acquises</div>
        <div class="decree-rule"></div>
      </div>

      <!-- Legal issuer box -->
      <div class="legal-box">
        <p>
          <strong>ASSURYAL CONSEIL</strong> — Société par actions simplifiée au capital de 100,00 €<br>
          RCS Paris N° <strong>102 963 881</strong> — SIREN <strong>FR7501.102963881</strong><br>
          Siège social : <strong>6 rue d'Armaillé, 75017 Paris</strong><br>
          Inscrite à l'ORIAS sous le N° <strong>22001447</strong> · Qualité : <strong>Cabinet de courtage en assurance</strong>
        </p>
      </div>

      <!-- Certifie -->
      <div class="certifie-label">Certifie que</div>
      <div class="name-wrap">
        <div class="candidate-name">${userName}</div>
      </div>

      <!-- Attestation text -->
      <div class="attest-text">
        a suivi et validé, conformément à l'article R 512-9 (1°) du Code des assurances,<br>
        un stage professionnel de <span class="highlight">150 heures minimum</span> — Formation IAS de <span class="highlight">Niveau 1</span><br>
        et a réussi le contrôle final des compétences avec un score de&nbsp;
        <span class="score-chip">${score} / 20</span>&nbsp;
        (${pct}%)<br><br>
        Ce contrôle a été effectué conformément au programme minimum de formation de Niveau I<br>
        homologué par arrêté du ministre de l'Économie du 11 juillet 2008<br>
        <em style="font-size:10.5px;color:#888">(Arrêté ECET 0816434A — modifiant l'arrêté du 23 juin 2008)</em>
      </div>

      <!-- 5 Units -->
      <div class="units-title">Programme des 5 unités validées · Total 150 heures</div>
      <div class="units-grid">
        <div class="unit-item">
          <div class="unit-num">1</div>
          <div class="unit-text">Les savoirs généraux<br>de l'assurance</div>
          <div class="unit-hours">20h</div>
        </div>
        <div class="unit-item">
          <div class="unit-num">2</div>
          <div class="unit-text">Assurances de personnes<br>Invalidité · Décès · Dépendance · Santé</div>
          <div class="unit-hours">30h</div>
        </div>
        <div class="unit-item">
          <div class="unit-num">3</div>
          <div class="unit-text">Assurance-vie<br>et capitalisation</div>
          <div class="unit-hours">45h</div>
        </div>
        <div class="unit-item">
          <div class="unit-num">4</div>
          <div class="unit-text">Assurances de personnes<br>Contrats collectifs</div>
          <div class="unit-hours">10h</div>
        </div>
        <div class="unit-item full">
          <div class="unit-num">5</div>
          <div class="unit-text">Assurances de biens et de responsabilité</div>
          <div class="unit-hours">45h</div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Legal footer text -->
      <div class="legal-footer">
        En application de l'article R 514-3 II a) du Code des assurances, cette attestation justifie de la capacité professionnelle prévue par l'article L. 512-5.
        Elle est délivrée conformément à l'article R 514-4 dans les plus brefs délais à son titulaire et constitue une pièce justificative pour l'inscription à l'ORIAS.
      </div>

      <!-- Signatures -->
      <div class="sig-row">

        <!-- Signature Président -->
        <div class="sig-block">
          <svg viewBox="0 0 180 70" width="180" height="70" style="display:block;margin:0 auto 6px;">
            <!-- Signature Achraf Mortady reconstituée -->
            <g fill="none" stroke="#1a1a6e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
              <!-- Grande boucle gauche -->
              <path d="M20,52 C18,38 22,28 30,30 C38,32 36,48 28,50 C22,51 18,44 22,36 C26,28 38,22 48,26"/>
              <!-- Trait montant -->
              <path d="M48,26 C56,20 62,18 68,24 C72,28 70,36 64,38"/>
              <!-- Boucle centrale -->
              <path d="M64,38 C58,42 52,44 54,38 C56,32 66,28 72,32 C78,36 76,44 68,46"/>
              <!-- Queue descendante avec remontée -->
              <path d="M68,46 C78,48 90,46 96,40 C100,36 98,30 92,28 C86,26 80,30 82,38 C84,46 92,50 102,48 C112,46 118,38 116,30"/>
              <!-- Trait final montant -->
              <path d="M116,30 C118,22 124,18 130,20 C138,24 136,34 128,36 C120,38 114,32 118,26 C122,20 132,18 140,22 C148,26 150,36 144,40"/>
              <!-- Petite boucle finale -->
              <path d="M144,40 C148,44 152,44 156,40 C160,36 158,30 152,28 C146,26 142,30 146,36"/>
            </g>
          </svg>
          <div class="sig-name">Achraf MORTADY</div>
          <div class="sig-role">Président — ASSURYAL CONSEIL</div>
          <div class="sig-date">Paris, le ${dateStr}</div>
        </div>

        <!-- Cachet officiel SVG -->
        <div class="sig-block center">
          <svg viewBox="0 0 160 80" width="160" height="80" style="display:block;margin:0 auto;">
            <!-- Fond rectangle arrondi bleu transparent -->
            <rect x="2" y="2" width="156" height="76" rx="10" ry="10"
              fill="rgba(20,40,160,0.04)" stroke="#1a28a0" stroke-width="2.5"/>
            <!-- Ligne intérieure -->
            <rect x="6" y="6" width="148" height="68" rx="7" ry="7"
              fill="none" stroke="#1a28a0" stroke-width="0.8" opacity="0.4"/>
            <!-- ASSURYAL CONSEIL -->
            <text x="80" y="24" text-anchor="middle"
              font-family="Arial Black, sans-serif" font-size="11.5" font-weight="900"
              fill="#1a28a0" letter-spacing="1">ASSURYAL CONSEIL</text>
            <!-- Ligne séparatrice -->
            <line x1="18" y1="30" x2="142" y2="30" stroke="#1a28a0" stroke-width="0.8" opacity="0.5"/>
            <!-- Adresse -->
            <text x="80" y="44" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="9.5" font-weight="600"
              fill="#1a28a0">5, Rue d'Armaillé 75017 - Paris</text>
            <!-- RCS -->
            <text x="80" y="58" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="9.5" font-weight="700"
              fill="#1a28a0">RCS N° : 849 409 313</text>
            <!-- ORIAS -->
            <text x="80" y="71" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="8" font-weight="500"
              fill="#1a28a0" opacity="0.7">ORIAS N° 22001447</text>
          </svg>
        </div>

        <!-- Signature Direction pédagogique -->
        <div class="sig-block">
          <svg viewBox="0 0 180 70" width="180" height="70" style="display:block;margin:0 auto 6px;">
            <g fill="none" stroke="#1a1a6e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
              <path d="M30,50 C28,38 34,26 44,28 C52,30 50,44 40,46 C32,47 28,40 34,32 C40,24 54,20 64,26"/>
              <path d="M64,26 C72,22 80,24 82,32 C84,40 76,46 68,42 C62,38 64,30 72,28 C80,26 90,30 92,40"/>
              <path d="M92,40 C94,48 102,52 110,46 C116,42 114,32 106,30 C98,28 92,36 96,44 C100,52 112,52 122,46"/>
              <path d="M122,46 C130,40 134,32 128,26 C122,20 114,24 116,32 C118,40 128,44 138,40 C148,36 152,26 146,20"/>
            </g>
          </svg>
          <div class="sig-name">Direction Pédagogique</div>
          <div class="sig-role">Oriafen Academy</div>
          <div class="sig-date">Paris, le ${dateStr}</div>
        </div>

      </div>

    </div><!-- /body -->

    <!-- Footer band -->
    <div class="footer-band">
      <div class="footer-legal">
        ASSURYAL CONSEIL · SAS au capital de 100,00 € · RCS Paris 102 963 881<br>
        6 rue d'Armaillé, 75017 Paris · contact@oriafen.com
      </div>
      <div class="footer-orias">ORIAS N° 22001447 · oriafen.com</div>
    </div>

  </div><!-- /page -->
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

// ── Exam view ─────────────────────────────────────────────────

const EXAM_DRAW = 20
const EXAM_PASS = 15

function drawQuestions() {
  const shuffled = [...IAS1_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, EXAM_DRAW)
}

function ExamView({ userName, userId, onDone }) {
  const [questions, setQuestions] = useState(() => drawQuestions())
  const [current,  setCurrent]  = useState(0)
  const [answers,  setAnswers]  = useState({})
  const [selected, setSelected] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [result,   setResult]   = useState(null)

  const q     = questions[current]
  const total = questions.length

  const choose = (i) => { if (result) return; setSelected(i) }

  const next = async () => {
    const updated = { ...answers, [q.id]: selected }
    setAnswers(updated)

    if (current < total - 1) {
      setCurrent(current + 1)
      setSelected(null)
    } else {
      setSaving(true)
      const score = questions.reduce((s, q) => s + (updated[q.id] === q.correct ? 1 : 0), 0)
      const res   = await saveExamResult(userId, 'ias1', score, total)
      setResult({ score, passed: score >= EXAM_PASS })
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
              : `Score minimum requis : ${EXAM_PASS}/${total}. Révisez les modules et retentez l'examen.`}
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
            {questions.map((q) => {
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

function LessonView({ unit, userId, onDone, onComplete, completedChapters: initialCompleted }) {
  const [marking, setMarking] = useState(false)
  const [unitDone, setUnitDone] = useState(unit.status === 'completed')
  const [activeChapter, setActiveChapter] = useState(null)
  const [completedChapters, setCompletedChapters] = useState(() => initialCompleted ?? new Set())

  const allChapterIds = unit.chapters.map((_, i) => `${unit.id}.${i + 1}`)

  const handleChapterComplete = async (chapterId) => {
    const updated = new Set([...completedChapters, chapterId])
    setCompletedChapters(updated)
    setActiveChapter(null)
    const allDone = allChapterIds.every(id => updated.has(id))
    if (allDone && !unitDone) {
      setMarking(true)
      await markUnitComplete(userId, unit.id, unit.totalHours)
      setUnitDone(true)
      setMarking(false)
      onComplete(unit.id)
    }
  }

  const handleComplete = async () => {
    setMarking(true)
    await markUnitComplete(userId, unit.id, unit.totalHours)
    setUnitDone(true)
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
        <Chapitre11 isCompleted={completedChapters.has('1.1')} onComplete={() => handleChapterComplete('1.1')} />
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
        <Chapitre13 isCompleted={completedChapters.has('1.3')} onComplete={() => handleChapterComplete('1.3')} />
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
        <Chapitre14 isCompleted={completedChapters.has('1.4')} onComplete={() => handleChapterComplete('1.4')} />
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
        <Chapitre15 isCompleted={completedChapters.has('1.5')} onComplete={() => handleChapterComplete('1.5')} />
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
        <Chapitre16 isCompleted={completedChapters.has('1.6')} onComplete={() => handleChapterComplete('1.6')} />
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
        <Chapitre17 isCompleted={completedChapters.has('1.7')} onComplete={() => handleChapterComplete('1.7')} />
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
        <Chapitre21 isCompleted={completedChapters.has('2.1')} onComplete={() => handleChapterComplete('2.1')} />
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
        <Chapitre22 isCompleted={completedChapters.has('2.2')} onComplete={() => handleChapterComplete('2.2')} />
      </div>
    )
  }

  // ── Unité 2 — contenu interactif Chapitre 2.3 ──
  if (unit.id === 2 && activeChapter === '2.3') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 2
        </button>
        <Chapitre23 isCompleted={completedChapters.has('2.3')} onComplete={() => handleChapterComplete('2.3')} />
      </div>
    )
  }

  // ── Unité 3 — contenu interactif Chapitre 3.1 ──
  if (unit.id === 3 && activeChapter === '3.1') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 3
        </button>
        <Chapitre31 isCompleted={completedChapters.has('3.1')} onComplete={() => handleChapterComplete('3.1')} />
      </div>
    )
  }

  // ── Unité 3 — contenu interactif Chapitre 3.2 ──
  if (unit.id === 3 && activeChapter === '3.2') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 3
        </button>
        <Chapitre32 isCompleted={completedChapters.has('3.2')} onComplete={() => handleChapterComplete('3.2')} />
      </div>
    )
  }

  // ── Unité 3 — contenu interactif Chapitre 3.3 ──
  if (unit.id === 3 && activeChapter === '3.3') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 3
        </button>
        <Chapitre33 isCompleted={completedChapters.has('3.3')} onComplete={() => handleChapterComplete('3.3')} />
      </div>
    )
  }

  // ── Unité 4 — contenu interactif Chapitre 4.1 ──
  if (unit.id === 4 && activeChapter === '4.1') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 4
        </button>
        <Chapitre41 isCompleted={completedChapters.has('4.1')} onComplete={() => handleChapterComplete('4.1')} />
      </div>
    )
  }

  // ── Unité 4 — contenu interactif Chapitre 4.2 ──
  if (unit.id === 4 && activeChapter === '4.2') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 4
        </button>
        <Chapitre42 isCompleted={completedChapters.has('4.2')} onComplete={() => handleChapterComplete('4.2')} />
      </div>
    )
  }

  // ── Unité 5 — contenu interactif Chapitre 5.1 ──
  if (unit.id === 5 && activeChapter === '5.1') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 5
        </button>
        <Chapitre51 isCompleted={completedChapters.has('5.1')} onComplete={() => handleChapterComplete('5.1')} />
      </div>
    )
  }

  // ── Unité 5 — contenu interactif Chapitre 5.2 ──
  if (unit.id === 5 && activeChapter === '5.2') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 5
        </button>
        <Chapitre52 isCompleted={completedChapters.has('5.2')} onComplete={() => handleChapterComplete('5.2')} />
      </div>
    )
  }

  // ── Unité 5 — contenu interactif Chapitre 5.3 ──
  if (unit.id === 5 && activeChapter === '5.3') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 5
        </button>
        <Chapitre53 isCompleted={completedChapters.has('5.3')} onComplete={() => handleChapterComplete('5.3')} />
      </div>
    )
  }

  // ── Unité 5 — contenu interactif Chapitre 5.4 ──
  if (unit.id === 5 && activeChapter === '5.4') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 5
        </button>
        <Chapitre54 isCompleted={completedChapters.has('5.4')} onComplete={() => handleChapterComplete('5.4')} />
      </div>
    )
  }

  // ── Unité 5 — contenu interactif Chapitre 5.5 ──
  if (unit.id === 5 && activeChapter === '5.5') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => setActiveChapter(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'Unité 5
        </button>
        <Chapitre55 isCompleted={completedChapters.has('5.5')} onComplete={() => handleChapterComplete('5.5')} />
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
        <Chapitre12 isCompleted={completedChapters.has('1.2')} onComplete={() => handleChapterComplete('1.2')} />
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
            unitDone ? 'bg-emerald-100 text-emerald-600' : 'bg-orias-gold/10 text-orias-gold'
          }`}>
            {unitDone ? <CheckCircleIcon className="w-6 h-6 text-emerald-600" /> : unit.id}
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
            const prevChapterId = i === 0 ? null : `${unit.id}.${i}`
            const isChapterDone = completedChapters.has(chapterId)
            // Premier chapitre toujours dispo ; les suivants débloqués si le précédent est complété
            const isAvailable = i === 0 || completedChapters.has(prevChapterId)
            return (
              <div key={i}
                onClick={() => isAvailable && setActiveChapter(chapterId)}
                style={{ cursor: isAvailable ? 'pointer' : 'default' }}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                  isChapterDone
                    ? 'bg-emerald-50 border-emerald-200'
                    : isAvailable
                      ? 'bg-orias-bg border-orias-border hover:border-orias-gold/60 hover:bg-orias-gold/5'
                      : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isChapterDone ? 'bg-emerald-100 text-emerald-600' : isAvailable ? 'bg-orias-gold/10 text-orias-gold' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isChapterDone ? '✓' : i + 1}
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isChapterDone ? 'text-emerald-700' : isAvailable ? 'text-gray-700' : 'text-gray-400'}`}>{ch.label}</span>
                    {isChapterDone && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 20 }}>Complété</span>}
                    {!isChapterDone && isAvailable && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#c9a84c', background: 'rgba(201,168,76,0.1)', padding: '1px 6px', borderRadius: 20 }}>Disponible</span>}
                    {!isAvailable && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#9ca3af', background: '#f3f4f6', padding: '1px 6px', borderRadius: 20 }}>🔒 Verrouillé</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${isChapterDone ? 'bg-emerald-100 text-emerald-600' : isAvailable ? 'bg-orias-gold/10 text-orias-gold' : 'bg-gray-100 text-gray-400'}`}>{ch.hours}h</span>
                  {isChapterDone && <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" style={{ width: 14, height: 14 }}><polyline points="20 6 9 17 4 12"/></svg>}
                  {!isChapterDone && isAvailable && <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="9 18 15 12 9 6"/></svg>}
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
          {unitDone
            ? <p className="font-semibold text-emerald-600">Module complété !</p>
            : <p className="font-semibold text-gray-700">Prêt à valider ce module ?</p>}
          <p className="text-xs text-gray-400 mt-0.5">
            {unitDone ? 'Votre progression a été enregistrée.' : 'Cliquez pour marquer le module comme terminé.'}
          </p>
        </div>
        <button
          onClick={handleComplete}
          disabled={unitDone || marking}
          className={unitDone
            ? 'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold bg-emerald-100 text-emerald-600 cursor-default'
            : 'btn-gold flex items-center gap-2 disabled:opacity-70'}
        >
          {marking
            ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Enregistrement…</>
            : unitDone
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
                <span>20 questions tirées aléatoirement</span><span>·</span>
                <span>Minimum 15/20 pour valider</span><span>·</span>
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
