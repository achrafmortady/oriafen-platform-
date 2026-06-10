// ── Livret de Stage IAS1 — ASSURYAL CONSEIL ──────────────────────────────────
// Fichier séparé pour éviter les problèmes de bundle size avec les base64

const SIG_SMALL = `<img src="data:image/png;base64,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" style="width:160px;height:60px;display:block;margin:0 auto;object-fit:contain;" alt="signature"/>`
const SIG_BIG   = `<img src="data:image/png;base64,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" style="width:220px;height:82px;display:block;margin:0 auto;object-fit:contain;" alt="signature"/>`
const CACHET    = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 260 118' width='260' height='118' style='display:block;margin:0 auto'><rect x='2' y='2' width='256' height='114' rx='14' fill='rgba(26,40,160,0.03)' stroke='#1a28a0' stroke-width='3'/><rect x='7' y='7' width='246' height='104' rx='10' fill='none' stroke='#1a28a0' stroke-width='0.8' opacity='0.4'/><text x='130' y='34' text-anchor='middle' font-family='Arial Black,sans-serif' font-size='15' font-weight='900' fill='#1a28a0' letter-spacing='1'>ASSURYAL CONSEIL</text><line x1='25' y1='42' x2='235' y2='42' stroke='#1a28a0' stroke-width='0.9' opacity='0.5'/><text x='130' y='62' text-anchor='middle' font-family='Arial,sans-serif' font-size='13' font-weight='600' fill='#1a28a0'>6, Rue d&apos;Armaillé 75017 - Paris</text><text x='130' y='82' text-anchor='middle' font-family='Arial,sans-serif' font-size='13' font-weight='700' fill='#1a28a0'>RCS N° : 849 409 313</text><text x='130' y='100' text-anchor='middle' font-family='Arial,sans-serif' font-size='10' font-weight='500' fill='#1a28a0' opacity='0.75'>ORIAS N° 22001447</text></svg>`


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
