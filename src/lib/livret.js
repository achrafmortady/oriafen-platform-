// ── Livret de Stage IAS1 — ASSURYAL CONSEIL ──────────────────────────────────
// Fichier séparé pour éviter les problèmes de bundle size avec les base64

const SIG_SMALL = 'data:image/png;base64,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'
const SIG_BIG   = 'data:image/jpeg;base64,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'
const CACHET    = 'data:image/jpeg;base64,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'


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

  const signatureSVG = `<img src="${SIG_SMALL}" style="width:110px;height:50px;display:block;margin:0 auto;object-fit:contain;" alt="sig"/>`
  const sigBigHTML = `<img src="${SIG_BIG}" style="width:160px;height:72px;display:block;margin:0 auto;object-fit:contain;" alt="sig"/>`

  const cachetSVG = `<img src="${CACHET}" style="width:200px;height:91px;display:block;margin:0 auto;object-fit:contain;" alt="cachet"/>`

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
    <div class="sig-col">
      <div style="height:75px;"></div>
      <div class="sig-name">Direction Pédagogique</div>
      <div class="sig-role">ASSURYAL CONSEIL</div>
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
