// ── Livret de Stage IAS1 — ASSURYAL CONSEIL ──────────────────────────────────
// Fichier séparé pour éviter les problèmes de bundle size avec les base64

const SIG_SMALL_URI = 'data:image/png;base64,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'
const SIG_BIG_URI   = 'data:image/png;base64,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'
const CACHET_URI    = 'data:image/jpeg;base64,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'


// ─────────────────────────────────────────────────────────────────────────────
// LIVRET DE STAGE — Génération HTML style SARSOUR aux couleurs Oriafen/ASSURYAL
// ─────────────────────────────────────────────────────────────────────────────

function generateLivretHTML(studentName, startDate) {
  // Calcul des dates sur 5 semaines à partir de la date de début
  const d = startDate ? new Date(startDate) : new Date()
  const fmt = (date) => date.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })
  const addDays = (date, n) => { const d2 = new Date(date); d2.setDate(d2.getDate()+n); return d2 }

  // Séances par unité (identique au livret SARSOUR)
  const seances = {
    u1: [
      { dates:[fmt(d)], duree:'3,00', total:'3,00', nature:'La présentation du secteur de l\'assurance' },
      { dates:[fmt(addDays(d,0))], duree:'4,00', total:'4,00', nature:'Les entreprises d\'assurances' },
      { dates:[fmt(addDays(d,1))], duree:'3,00', total:'3,00', nature:'L\'opération d\'assurance' },
      { dates:[fmt(addDays(d,1))], duree:'4,00', total:'4,00', nature:'Les différentes catégories d\'assurance' },
      { dates:[fmt(addDays(d,2))], duree:'2,00', total:'2,00', nature:'L\'intermédiation en assurance' },
      { dates:[fmt(addDays(d,2))], duree:'2,00', total:'2,00', nature:'La relation avec le client' },
      { dates:[fmt(addDays(d,2))], duree:'2,00', total:'2,00', nature:'La lutte contre le blanchiment' },
    ],
    u1total: '20,00',
    u2: [
      { dates:[fmt(addDays(d,3)), fmt(addDays(d,4))], duree:'7,00', total:'10,00', nature:'L\'assurance contre les risques corporels (incapacité – invalidité – décès)' },
      { dates:[fmt(addDays(d,7)), fmt(addDays(d,8))], duree:'7,00', total:'10,00', nature:'La dépendance' },
      { dates:[fmt(addDays(d,9)), fmt(addDays(d,10))], duree:'7,00', total:'10,00', nature:'L\'assurance complémentaire santé' },
    ],
    u2total: '30,00',
    u3: [
      { dates:[fmt(addDays(d,11)), fmt(addDays(d,14))], duree:'7,00', total:'14,00', nature:'La prise en compte des besoins' },
      { dates:[fmt(addDays(d,15)), fmt(addDays(d,16)), fmt(addDays(d,17))], duree:'7,00', total:'21,00', nature:'Les principales catégories de contrats' },
      { dates:[fmt(addDays(d,18)), fmt(addDays(d,21))], duree:'7,00', total:'10,00', nature:'Les spécificités' },
    ],
    u3total: '45,00',
    u4: [
      { dates:[fmt(addDays(d,22))], duree:'5,00', total:'5,00', nature:'L\'assurance de groupe' },
      { dates:[fmt(addDays(d,23))], duree:'5,00', total:'5,00', nature:'Contrats collectifs au profit des salariés' },
    ],
    u4total: '10,00',
    u5: [
      { dates:[fmt(addDays(d,24)), fmt(addDays(d,24))], duree:'7,00', total:'14,00', nature:'L\'appréciation et la sélection du risque' },
      { dates:[fmt(addDays(d,25))], duree:'7,00', total:'7,00', nature:'Les différents types de contrats' },
      { dates:[fmt(addDays(d,28)), fmt(addDays(d,29))], duree:'5,00', total:'10,00', nature:'Les assurances des risques d\'entreprises' },
      { dates:[fmt(addDays(d,30))], duree:'7,00', total:'7,00', nature:'La présentation des garanties et la tarification' },
      { dates:[fmt(addDays(d,32))], duree:'7,00', total:'7,00', nature:'La vie du contrat' },
    ],
    u5total: '45,00',
  }

  const signatureSVG = '<img src="' + SIG_SMALL_URI + '" width="120" height="45" style="display:block;margin:0 auto" alt="sig"/>'
  const sigBigHTML = '<img src="' + SIG_BIG_URI + '" width="180" height="67" style="display:block;margin:0 auto" alt="sig"/>'

  const cachetSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 110" width="220" height="95" style="display:block;margin:0 auto">
  <rect x="3" y="3" width="254" height="104" rx="8" ry="8" fill="white" stroke="#1a28a0" stroke-width="3"/>
  <rect x="7" y="7" width="246" height="96" rx="6" ry="6" fill="none" stroke="#1a28a0" stroke-width="1" opacity="0.4"/>
  <text x="130" y="32" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="15" font-weight="900" fill="#1a28a0" letter-spacing="1">ASSURYAL CONSEIL</text>
  <line x1="20" y1="40" x2="240" y2="40" stroke="#1a28a0" stroke-width="1" opacity="0.5"/>
  <text x="130" y="58" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#1a28a0">6, Rue d&apos;Armaillé 75017 - Paris</text>
  <text x="130" y="76" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#1a28a0">RCS N° : 849 409 313</text>
  <text x="130" y="94" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#1a28a0" opacity="0.8">ORIAS N° 22001447</text>
</svg>`

  const endDate = fmt(addDays(d, 34))
  const today = fmt(new Date())

  // ── Tableau séances helper ──────────────────────────────────
  const tableRows = (seanceList) => seanceList.map(s => `
    <tr>
      <td class="tc dates">${s.dates.join('<br/>')}</td>
      <td class="tc">${s.duree}</td>
      <td class="tc">${s.total}</td>
      <td class="tl nature">${s.nature}</td>
      <td class="tc inst">A MORTADY</td>
      <td class="tc qual">Président SAS<br/>Assuryal Conseil</td>
      <td class="tc sig">${signatureSVG}</td>
      <td class="tc obs">OK réalisé</td>
      <td class="tc inst">A MORTADY</td>
      <td class="tc qual">Président SAS<br/>Assuryal Conseil</td>
      <td class="tc sig">${signatureSVG}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Livret de Stage IAS1 — ${studentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;}

    /* ── PAGE BREAKS ── */
    .page{width:297mm;min-height:210mm;padding:14mm 14mm 12mm;page-break-after:always;position:relative;background:#fff;}
    .page:last-child{page-break-after:auto;}

    /* ── HEADER BANDE VERTE ── */
    .header-band{background:#1a3d2b;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;margin-bottom:0;}
    .logo-wrap{display:flex;align-items:center;gap:10px;}
    .logo-text-main{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;color:#f5f0e8;letter-spacing:3px;}
    .logo-text-sub{font-size:7px;font-weight:600;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;margin-top:2px;}
    .header-right{text-align:right;color:#c9a84c;font-size:9px;font-weight:600;letter-spacing:.5px;}
    .gold-bar{height:3px;background:linear-gradient(90deg,#c9a84c,#e8d48a,#c9a84c);margin-bottom:14px;}

    /* ── PAGE 1 COUVERTURE ── */
    .cover-body{text-align:center;padding:30px 40px;}
    .cover-company{font-size:15px;font-weight:700;color:#1a3d2b;margin-bottom:4px;}
    .cover-company-details{font-size:10px;color:#555;line-height:1.8;margin-bottom:6px;}
    .cover-orias{font-size:11px;font-weight:700;color:#c9a84c;margin-bottom:30px;}
    .cover-title-main{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;color:#1a3d2b;margin-bottom:6px;}
    .cover-title-sub{font-size:13px;color:#555;font-style:italic;margin-bottom:4px;}
    .cover-duration{font-size:12px;font-weight:700;color:#1a3d2b;margin-bottom:24px;}
    .cover-doc-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;color:#1a3d2b;border-top:2px solid #c9a84c;border-bottom:2px solid #c9a84c;padding:10px 0;margin:0 60px 6px;}
    .cover-ref{font-size:9px;color:#888;margin-bottom:0;}

    /* ── PAGE 2 TITULAIRE ── */
    .section-title{font-size:11px;font-weight:700;color:#1a3d2b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1a3d2b;padding-bottom:4px;margin-bottom:12px;}
    .info-grid{display:grid;grid-template-columns:120px 1fr;gap:6px 12px;margin-bottom:16px;}
    .info-label{font-weight:700;color:#1a3d2b;}
    .info-value{color:#333;}
    .company-block{background:#f5f0e8;border-left:4px solid #1a3d2b;padding:10px 14px;margin-bottom:14px;border-radius:0 6px 6px 0;}
    .company-block strong{color:#1a3d2b;}

    /* ── PAGE 3 ATTESTATION ── */
    .attest-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;color:#1a3d2b;margin-bottom:4px;}
    .attest-sub{font-style:italic;font-size:12px;color:#555;margin-bottom:20px;}
    .attest-body{font-size:11.5px;line-height:2;color:#333;margin-bottom:20px;}
    .attest-body strong{color:#1a3d2b;}
    .sig-section{display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px;gap:20px;}
    .sig-col{text-align:center;flex:1;}
    .sig-label{font-size:10px;color:#888;margin-bottom:6px;}
    .sig-name{font-size:11px;font-weight:700;color:#1a3d2b;margin-top:6px;}
    .sig-role{font-size:9.5px;color:#666;}

    /* ── TABLEAUX SÉANCES ── */
    .unit-header{background:#1a3d2b;color:#fff;padding:6px 10px;font-weight:700;font-size:10.5px;margin-top:12px;margin-bottom:0;letter-spacing:.3px;}
    table{width:100%;border-collapse:collapse;font-size:9px;}
    th{background:#e8f0ec;color:#1a3d2b;font-weight:700;padding:5px 4px;border:1px solid #b0c8b8;text-align:center;font-size:8.5px;}
    th.tl{text-align:left;}
    td{padding:4px 4px;border:1px solid #c8d8cc;vertical-align:middle;}
    td.tc{text-align:center;}
    td.tl{text-align:left;}
    td.dates{font-size:8px;color:#444;}
    td.nature{font-size:9.5px;color:#1a1a1a;font-weight:500;}
    td.inst{font-size:8px;font-weight:600;color:#1a3d2b;}
    td.qual{font-size:7.5px;color:#555;line-height:1.4;}
    td.obs{font-size:8px;font-weight:600;color:#2e7d4f;}
    td.sig{padding:2px;}
    .total-row td{background:#f5f0e8;font-weight:700;color:#1a3d2b;font-size:10px;}
    .total-formation{background:#1a3d2b;color:#c9a84c;padding:6px 10px;font-weight:700;font-size:11px;text-align:right;margin-top:8px;}

    /* ── MODALITÉS DE VALIDATION ── */
    .validation-box{background:#f9f7f2;border:1px solid #c9a84c;border-radius:6px;padding:14px 18px;margin-top:16px;font-size:10.5px;line-height:1.8;}
    .validation-box strong{color:#1a3d2b;}

    /* ── ACTIONS (non imprimées) ── */
    .actions{position:fixed;top:16px;right:16px;display:flex;gap:10px;z-index:999;}
    .btn-print{background:#1a3d2b;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}
    .btn-close{background:#fff;color:#1a3d2b;border:2px solid #1a3d2b;padding:10px 16px;border-radius:8px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}

    @media print{
      .actions{display:none!important;}
      body{background:#fff;}
      .page{width:100%;padding:10mm 12mm;}
    }
  </style>
</head>
<body>

<div class="actions">
  <button class="btn-print" onclick="window.print()">🖨 Imprimer / PDF</button>
  <button class="btn-close" onclick="window.close()">✕ Fermer</button>
</div>

<!-- ═══════════════════════════════════════ PAGE 1 — COUVERTURE ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band">
    <div class="logo-wrap">
      <svg viewBox="0 0 40 46" width="32" height="32" fill="none">
        <path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/>
        <text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text>
      </svg>
      <div>
        <div class="logo-text-main">ORIAFEN</div>
        <div class="logo-text-sub">Cabinet de courtage en assurance · ORIAS N° 22001447</div>
      </div>
    </div>
    <div class="header-right">Formation IAS Niveau 1 · 150 heures</div>
  </div>
  <div class="gold-bar"></div>

  <div class="cover-body">
    <div class="cover-company">ASSURYAL CONSEIL</div>
    <div class="cover-company-details">
      SAS au capital de 100,00 €<br/>
      RCS de Paris N° 849 409 313<br/>
      5, Rue d'Armaillé — 75017 Paris
    </div>
    <div class="cover-orias">Inscrite à l'ORIAS sous le N° 22001447</div>

    <div style="margin:0 auto 24px;width:80px;height:3px;background:linear-gradient(90deg,#c9a84c,#e8d48a,#c9a84c);"></div>

    <div class="cover-title-main">FORMATION IAS DE NIVEAU 1</div>
    <div class="cover-title-sub">Durée 150 heures</div>
    <div style="height:20px;"></div>
    <div class="cover-doc-title">ATTESTATION DE FORMATION ET LIVRET DE STAGE</div>
    <div class="cover-ref">(Art. R 514-3 du code des assurances et R 512-11 du code des assurances)</div>
  </div>
</div>

<!-- ═══════════════════════════════════════ PAGE 2 — TITULAIRE + RÈGLES ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band">
    <div class="logo-wrap">
      <svg viewBox="0 0 40 46" width="28" height="28" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg>
      <div><div class="logo-text-main" style="font-size:16px;">ASSURYAL CONSEIL</div></div>
    </div>
    <div class="header-right">Livret de Stage · Niveau I</div>
  </div>
  <div class="gold-bar"></div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
    <div>
      <div class="section-title">TITULAIRE</div>
      <div class="info-grid">
        <span class="info-label">Nom :</span><span class="info-value"><strong>${studentName.split(' ').slice(1).join(' ') || studentName}</strong></span>
        <span class="info-label">Prénom(s) :</span><span class="info-value"><strong>${studentName.split(' ')[0]}</strong></span>
      </div>

      <div class="section-title" style="margin-top:20px;">ENTREPRISE DE STAGE</div>
      <div class="company-block">
        <div style="font-size:12px;font-weight:700;color:#1a3d2b;margin-bottom:6px;">ASSURYAL CONSEIL</div>
        <div style="font-size:10px;color:#444;line-height:1.8;">
          SAS au capital de 100,00 € · RCS Paris N° 849 409 313<br/>
          5, Rue d'Armaillé — 75017 Paris<br/>
          Inscrite à l'ORIAS sous le N° <strong>22001447</strong><br/>
          Qualité : <strong>Cabinet de courtage en assurance</strong><br/>
          Date de début de stage : <strong>${fmt(d)}</strong>
        </div>
      </div>
    </div>

    <div>
      <div class="section-title">EXTRAITS DU CODE DES ASSURANCES</div>
      <div style="font-size:9.5px;color:#444;line-height:1.8;">
        <p style="margin-bottom:8px;"><strong style="color:#1a3d2b;">Article R 512-9</strong><br/>
        Les intermédiaires doivent justifier d'un stage professionnel d'une durée raisonnable et suffisante sans pouvoir être inférieure à <strong>150 heures</strong>.</p>
        <p style="margin-bottom:8px;"><strong style="color:#1a3d2b;">Article R 512-11</strong><br/>
        Le stage professionnel a pour objet de permettre aux stagiaires d'acquérir des compétences en matière juridique, technique, commerciale et administrative.</p>
        <p><strong style="color:#1a3d2b;">Article R 514-3</strong><br/>
        La capacité professionnelle est justifiée par la présentation du livret de stage signé par les personnes auprès desquelles le stage a été effectué.</p>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════ PAGE 3 — ATTESTATION ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band">
    <div class="logo-wrap"><svg viewBox="0 0 40 46" width="28" height="28" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg>
    <div><div class="logo-text-main" style="font-size:16px;">ASSURYAL CONSEIL</div></div></div>
    <div class="header-right">Attestation · Art. R 512-11</div>
  </div>
  <div class="gold-bar"></div>

  <div class="attest-title">ATTESTATION</div>
  <div class="attest-sub">de contrôle des compétences acquises à l'issue du stage du niveau I<br/>(article R 512-11 du code des assurances)</div>

  <div class="attest-body">
    Le soussigné :<br/>
    &nbsp;&nbsp;- Nom : <strong>Achraf MORTADY</strong><br/>
    &nbsp;&nbsp;- Fonction : <strong>Président de la SAS</strong><br/><br/>
    Atteste que : <strong>${studentName}</strong><br/><br/>
    A subi à l'issue de ce stage de <strong>150 heures minimum</strong>, un contrôle des compétences acquises.<br/><br/>
    Ce contrôle a été effectué conformément au programme minimum de formation de niveau I homologué par arrêté du ministre de l'Économie, de l'Industrie et de l'Emploi du 11 juillet 2008 modifiant l'arrêté du 23 juin 2008 portant homologation des programmes minimaux de stage de formation des Intermédiaires en Assurance et des salariés de Niveaux 1 et 2. (Arrêté ECET 0816434A).<br/><br/>
    En application de l'article R512-9 (1°) du Code des assurances, le candidat stagiaire devra avoir suivi, durant la période de 150 heures, une formation lui permettant d'acquérir les connaissances visées dans les 5 unités suivantes.
  </div>

  <div style="font-size:11px;color:#444;margin-bottom:20px;">A PARIS le <strong>${today}</strong></div>
  <div style="font-size:11px;color:#444;margin-bottom:24px;">Signature et cachet de l'entreprise</div>

  <div class="sig-section">
    <div class="sig-col">
      ${signatureSVG}
      <div class="sig-name">Achraf MORTADY</div>
      <div class="sig-role">Président — ASSURYAL CONSEIL</div>
    </div>
    <div class="sig-col">
      ${cachetSVG}
    </div>

  </div>
</div>

<!-- ═══════════════════════════════════════ PAGE 4 — UNITÉ 1 ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ASSURYAL CONSEIL</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
  <div class="gold-bar"></div>

  <div class="unit-header">UNITÉ 1 : LES SAVOIRS GÉNÉRAUX</div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">Dates</th><th rowspan="2">Durée séance (h)</th><th rowspan="2">Durée totale (h)</th>
        <th rowspan="2" class="tl">Nature de l'enseignement</th>
        <th colspan="3">Instructeur</th><th rowspan="2">Observation</th>
        <th colspan="3">Chef d'établissement</th>
      </tr>
      <tr><th>Prénom Nom</th><th>Qualité</th><th>Signature</th><th>Prénom Nom</th><th>Qualité</th><th>Signature</th></tr>
    </thead>
    <tbody>
      ${tableRows(seances.u1)}
      <tr class="total-row"><td colspan="2" class="tc">TOTAL UNITÉ 1</td><td class="tc">${seances.u1total}</td><td colspan="8"></td></tr>
    </tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════ PAGE 5 — UNITÉ 2 ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ASSURYAL CONSEIL</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
  <div class="gold-bar"></div>

  <div class="unit-header">UNITÉ 2 : LES ASSURANCES DE PERSONNES : ASSURANCE - INVALIDITÉ - DÉCÈS - DÉPENDANCE - SANTÉ</div>
  <table>
    <thead>
      <tr><th rowspan="2">Dates</th><th rowspan="2">Durée séance (h)</th><th rowspan="2">Durée totale (h)</th><th rowspan="2" class="tl">Nature de l'enseignement</th><th colspan="3">Instructeur</th><th rowspan="2">Observation</th><th colspan="3">Chef d'établissement</th></tr>
      <tr><th>Prénom Nom</th><th>Qualité</th><th>Signature</th><th>Prénom Nom</th><th>Qualité</th><th>Signature</th></tr>
    </thead>
    <tbody>
      ${tableRows(seances.u2)}
      <tr class="total-row"><td colspan="2" class="tc">TOTAL UNITÉ 2</td><td class="tc">${seances.u2total}</td><td colspan="8"></td></tr>
    </tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════ PAGE 6 — UNITÉ 3 ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ASSURYAL CONSEIL</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
  <div class="gold-bar"></div>

  <div class="unit-header">UNITÉ 3 : LES ASSURANCES DE PERSONNES : ASSURANCE-VIE ET CAPITALISATION</div>
  <table>
    <thead>
      <tr><th rowspan="2">Dates</th><th rowspan="2">Durée séance (h)</th><th rowspan="2">Durée totale (h)</th><th rowspan="2" class="tl">Nature de l'enseignement</th><th colspan="3">Instructeur</th><th rowspan="2">Observation</th><th colspan="3">Chef d'établissement</th></tr>
      <tr><th>Prénom Nom</th><th>Qualité</th><th>Signature</th><th>Prénom Nom</th><th>Qualité</th><th>Signature</th></tr>
    </thead>
    <tbody>
      ${tableRows(seances.u3)}
      <tr class="total-row"><td colspan="2" class="tc">TOTAL UNITÉ 3</td><td class="tc">${seances.u3total}</td><td colspan="8"></td></tr>
    </tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════ PAGE 7 — UNITÉ 4 ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ASSURYAL CONSEIL</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
  <div class="gold-bar"></div>

  <div class="unit-header">UNITÉ 4 : LES ASSURANCES DE PERSONNES : LES CONTRATS COLLECTIFS</div>
  <table>
    <thead>
      <tr><th rowspan="2">Dates</th><th rowspan="2">Durée séance (h)</th><th rowspan="2">Durée totale (h)</th><th rowspan="2" class="tl">Nature de l'enseignement</th><th colspan="3">Instructeur</th><th rowspan="2">Observation</th><th colspan="3">Chef d'établissement</th></tr>
      <tr><th>Prénom Nom</th><th>Qualité</th><th>Signature</th><th>Prénom Nom</th><th>Qualité</th><th>Signature</th></tr>
    </thead>
    <tbody>
      ${tableRows(seances.u4)}
      <tr class="total-row"><td colspan="2" class="tc">TOTAL UNITÉ 4</td><td class="tc">${seances.u4total}</td><td colspan="8"></td></tr>
    </tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════ PAGE 8 — UNITÉ 5 + TOTAL ═══════════════════════════════════════ -->
<div class="page">
  <div class="header-band"><div class="logo-wrap"><svg viewBox="0 0 40 46" width="24" height="24" fill="none"><path d="M20 1L2 9v14c0 10 7.3 19 18 21.5C31 42 38 33 38 23V9L20 1z" stroke="#c9a84c" stroke-width="1.4" fill="rgba(201,168,76,.12)"/><text x="20" y="30" text-anchor="middle" font-family="serif" font-size="14" font-weight="700" fill="#c9a84c">O</text></svg><div><div class="logo-text-main" style="font-size:14px;">ASSURYAL CONSEIL</div></div></div><div class="header-right">Livret de Stage · Formation IAS Niveau 1</div></div>
  <div class="gold-bar"></div>

  <div class="unit-header">UNITÉ 5 : LES ASSURANCES DE BIENS ET DE RESPONSABILITÉ</div>
  <table>
    <thead>
      <tr><th rowspan="2">Dates</th><th rowspan="2">Durée séance (h)</th><th rowspan="2">Durée totale (h)</th><th rowspan="2" class="tl">Nature de l'enseignement</th><th colspan="3">Instructeur</th><th rowspan="2">Observation</th><th colspan="3">Chef d'établissement</th></tr>
      <tr><th>Prénom Nom</th><th>Qualité</th><th>Signature</th><th>Prénom Nom</th><th>Qualité</th><th>Signature</th></tr>
    </thead>
    <tbody>
      ${tableRows(seances.u5)}
      <tr class="total-row"><td colspan="2" class="tc">TOTAL UNITÉ 5</td><td class="tc">${seances.u5total}</td><td colspan="8"></td></tr>
    </tbody>
  </table>

  <div class="total-formation">TOTAL FORMATION : 150,00 heures</div>

  <div class="validation-box">
    <strong>MODALITÉS DE VALIDATION DES CONNAISSANCES :</strong><br/>
    L'examen final se présente sous la forme d'un QCM composé de cent questions réparties sur l'ensemble du programme.
    Chaque question propose quatre réponses possibles. Il n'y a qu'une seule réponse exacte.
    Le contrôle final des connaissances est réputé être validé lorsque le nombre total de bonnes réponses est au minimum strictement égal à <strong>cinquante</strong>.
  </div>
</div>

</body>
</html>`
}

export function openLivret(studentName, enrolledAt) {
  const html = generateLivretHTML(studentName, enrolledAt)
  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
