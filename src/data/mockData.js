// ── Dossier steps ─────────────────────────────────────────────
export const DOSSIER_STEPS = [
  { id: 1, label: 'Consultation initiale',  status: 'done' },
  { id: 2, label: 'Montage dossier',        status: 'done' },
  { id: 3, label: 'Structure juridique',    status: 'done' },
  { id: 4, label: 'Soumission ORIAS',       status: 'current' },
  { id: 5, label: 'Obtention ORIAS',        status: 'locked' },
  { id: 6, label: 'Lancement activité',     status: 'locked' },
]

// ── Documents checklist ───────────────────────────────────────
export const DOCUMENTS_CHECKLIST = [
  { id: 'id',   label: "Pièce d'identité",      status: 'valid' },
  { id: 'cas',  label: 'Casier judiciaire B3',   status: 'valid' },
  { id: 'ias',  label: 'Attestation IAS1',       status: 'pending' },
  { id: 'kbis', label: 'Kbis société',           status: 'valid' },
  { id: 'rcp',  label: 'Attestation RCP',        status: 'valid' },
  { id: 'rib',  label: 'RIB professionnel',      status: 'missing' },
]

// ── Required document categories (9 official ORIAS documents) ─
export const REQUIRED_DOCUMENTS = [
  { id: 'identity',        label: "Pièce d'identité",          sublabel: 'Passeport ou CIN',          accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'casier',          label: 'Casier judiciaire B3',       sublabel: 'Moins de 3 mois',           accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'attestation_ias', label: 'Attestation IAS1',           sublabel: 'Formation certifiante',     accept: '.pdf' },
  { id: 'kbis',            label: 'Kbis de la société',         sublabel: 'Moins de 3 mois',           accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'rcp',             label: 'Attestation RCP',            sublabel: 'Responsabilité Civile Pro', accept: '.pdf' },
  { id: 'domicile',        label: 'Justificatif de domicile',   sublabel: 'Facture ou courrier officiel', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'statuts',         label: 'Statuts de la société',      sublabel: 'Document signé',            accept: '.pdf' },
  { id: 'rib',             label: "Relevé d'identité bancaire", sublabel: 'RIB professionnel',         accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'photo',           label: "Photo d'identité",           sublabel: 'Format numérique JPG/PNG',  accept: '.jpg,.jpeg,.png' },
]

// ── Demo document state (mirrors DB rows for demo mode) ───────
export const DEMO_DOCS_BY_CATEGORY = {
  identity:        { id: 'dd-1', status: 'valid',   fileName: 'passeport.pdf',      fileUrl: null, rejectionReason: null },
  casier:          { id: 'dd-2', status: 'valid',   fileName: 'casier_b3.pdf',      fileUrl: null, rejectionReason: null },
  attestation_ias: { id: 'dd-3', status: 'pending', fileName: 'attestation_ias.pdf',fileUrl: null, rejectionReason: null },
  kbis:            { id: 'dd-4', status: 'valid',   fileName: 'kbis_2026.pdf',      fileUrl: null, rejectionReason: null },
  rcp:             { id: 'dd-5', status: 'valid',   fileName: 'rcp_pro.pdf',        fileUrl: null, rejectionReason: null },
  rib:             { id: 'dd-6', status: 'missing', fileName: null,                 fileUrl: null, rejectionReason: 'Document illisible, veuillez renvoyer une version lisible.' },
}

// ── Formation units ───────────────────────────────────────────
export const FORMATION_UNITS = [
  {
    id: 1,
    title: 'Les savoirs généraux',
    totalHours: 20,
    completedHours: 20,
    status: 'completed',
    description: "Introduction au secteur de l'assurance en France. Vous apprendrez les fondamentaux du marché, les acteurs principaux et le cadre réglementaire.",
    chapters: [
      { label: 'La présentation du secteur', hours: 3 },
      { label: "Les entreprises d'assurance", hours: 4 },
      { label: "L'opération d'assurance", hours: 3 },
      { label: "Les catégories d'assurance", hours: 4 },
      { label: "L'intermédiation", hours: 2 },
      { label: 'La relation client', hours: 2 },
      { label: 'Lutte contre blanchiment', hours: 2 },
    ],
  },
  {
    id: 2,
    title: 'Assurances personnes',
    totalHours: 30,
    completedHours: 25,
    status: 'in_progress',
    description: "Approfondissement des contrats d'assurance de personnes : prévoyance, dépendance et complémentaire santé.",
    chapters: [
      { label: 'Invalidité/Décès/Dépendance', hours: 10 },
      { label: 'La dépendance', hours: 10 },
      { label: 'Complémentaire santé', hours: 10 },
    ],
  },
  {
    id: 3,
    title: 'Assurance vie',
    totalHours: 45,
    completedHours: 0,
    status: 'locked',
    description: "Maîtrisez les contrats d'assurance vie, leur fiscalité avantageuse et les stratégies patrimoniales associées.",
    chapters: [
      { label: 'Analyse des besoins', hours: 14 },
      { label: 'Catégories de contrats', hours: 21 },
      { label: 'Les spécificités', hours: 10 },
    ],
  },
  {
    id: 4,
    title: 'Contrats collectifs',
    totalHours: 10,
    completedHours: 0,
    status: 'locked',
    description: "Les régimes collectifs obligatoires et facultatifs pour les entreprises, ainsi que la protection sociale des salariés.",
    chapters: [
      { label: 'Assurance de groupe', hours: 5 },
      { label: 'Contrats collectifs salariés', hours: 5 },
    ],
  },
  {
    id: 5,
    title: 'Biens & Responsabilité',
    totalHours: 45,
    completedHours: 0,
    status: 'locked',
    description: "Assurances IARD, évaluation des risques, garanties et tarification. Indispensable pour conseiller entreprises et particuliers.",
    chapters: [
      { label: 'Appréciation du risque', hours: 14 },
      { label: 'Types de contrats', hours: 7 },
      { label: 'Assurances entreprise', hours: 10 },
      { label: 'Garanties et tarification', hours: 7 },
      { label: 'Vie du contrat', hours: 7 },
    ],
  },
]

// ── IAS1 final exam — 20 questions ────────────────────────────
export const IAS1_QUESTIONS = [
  {
    id: 1,
    question: "Que signifie ORIAS ?",
    options: [
      "Office de Régulation des Intermédiaires en Assurances et Sécurité",
      "Organisme pour le Registre des Intermédiaires en Assurance",
      "Organisation Régionale des Intermédiaires",
      "Office de Référencement des Intermédiaires",
    ],
    correct: 1,
  },
  {
    id: 2,
    question: "Quelle est la durée minimale de la formation IAS Niveau 1 ?",
    options: ["50 heures", "100 heures", "150 heures", "200 heures"],
    correct: 2,
  },
  {
    id: 3,
    question: "Quelle assurance est obligatoire pour un courtier ORIAS ?",
    options: ["Assurance vie", "Responsabilité Civile Professionnelle", "Assurance habitation", "Assurance auto"],
    correct: 1,
  },
  {
    id: 4,
    question: "Quel est le seuil minimum de bonnes réponses à l'examen final ?",
    options: ["40 sur 100", "50 sur 100", "60 sur 100", "70 sur 100"],
    correct: 1,
  },
  {
    id: 5,
    question: "Qu'est-ce que la directive DDA ?",
    options: [
      "Document de divulgation d'assurance",
      "Directive sur la distribution d'assurance",
      "Déclaration des droits des assurés",
      "Dossier de demande d'agrément",
    ],
    correct: 1,
  },
  {
    id: 6,
    question: "Le renouvellement ORIAS se fait :",
    options: ["Tous les 5 ans", "Tous les 3 ans", "Chaque année", "Tous les 2 ans"],
    correct: 2,
  },
  {
    id: 7,
    question: "La formation continue annuelle obligatoire est de :",
    options: ["5 heures", "10 heures", "15 heures", "20 heures"],
    correct: 2,
  },
  {
    id: 8,
    question: "Un courtier peut exercer :",
    options: [
      "Sans aucune assurance",
      "Avec une RCP uniquement",
      "Avec une assurance vie uniquement",
      "Sans inscription ORIAS",
    ],
    correct: 1,
  },
  {
    id: 9,
    question: "La fiche conseil doit être remise :",
    options: [
      "Après la signature du contrat",
      "Avant la signature du contrat",
      "30 jours après la souscription",
      "Elle n'est pas obligatoire",
    ],
    correct: 1,
  },
  {
    id: 10,
    question: "Le délai de renonciation pour une assurance vie est de :",
    options: ["14 jours", "30 jours", "7 jours", "60 jours"],
    correct: 1,
  },
  {
    id: 11,
    question: "L'assurance IARD couvre :",
    options: [
      "Uniquement les personnes",
      "Incendie, Accidents, Risques Divers",
      "Investissement, Actions, Risques Diversifiés",
      "Uniquement les entreprises",
    ],
    correct: 1,
  },
  {
    id: 12,
    question: "La garantie décès est :",
    options: [
      "Facultative",
      "Obligatoire pour tous les contrats",
      "Une assurance de personnes",
      "Une assurance de biens",
    ],
    correct: 2,
  },
  {
    id: 13,
    question: "Le document d'information sur le produit d'assurance s'appelle :",
    options: ["DIPA", "DIRA", "DIPA ou IPID en anglais", "Fiche produit standard"],
    correct: 0,
  },
  {
    id: 14,
    question: "En cas de fausse déclaration intentionnelle, le contrat est :",
    options: ["Modifié", "Suspendu", "Nul", "Continué normalement"],
    correct: 2,
  },
  {
    id: 15,
    question: "La subrogation permet à l'assureur de :",
    options: [
      "Résilier le contrat",
      "Se retourner contre le responsable du sinistre",
      "Augmenter la prime",
      "Refuser le sinistre",
    ],
    correct: 1,
  },
  {
    id: 16,
    question: "Le taux de commission moyen en assurance auto est de :",
    options: ["5-7%", "8-15%", "20-30%", "1-3%"],
    correct: 1,
  },
  {
    id: 17,
    question: "La MRH couvre :",
    options: [
      "Uniquement l'incendie",
      "Multi-Risques Habitation",
      "Uniquement le vol",
      "Uniquement la responsabilité civile",
    ],
    correct: 1,
  },
  {
    id: 18,
    question: "L'analyse des besoins client est obligatoire selon :",
    options: ["Le Code civil", "La directive DDA", "Le Code pénal", "Le règlement RGPD"],
    correct: 1,
  },
  {
    id: 19,
    question: "Un contrat d'assurance vie peut être souscrit pour :",
    options: ["Maximum 10 ans", "Durée illimitée", "Maximum 30 ans", "Minimum 20 ans"],
    correct: 1,
  },
  {
    id: 20,
    question: "Le devoir de conseil implique :",
    options: [
      "Vendre le produit le plus cher",
      "Proposer le produit le mieux adapté aux besoins du client",
      "Proposer uniquement les produits de son compagnie",
      "Ne pas informer sur les exclusions",
    ],
    correct: 1,
  },
]

// ── Commercial scripts ────────────────────────────────────────
export const CALL_SCRIPTS = [
  {
    type: 'Script Introduction',
    fr: "Bonjour, je suis [Prénom] du cabinet Oriafen. Je vous appelle car vous avez manifesté de l'intérêt pour une assurance [produit]. Avez-vous 2 minutes ?",
    darija: "Salam, ana [Ism] men cabinet Oriafen. Kan9der n3awen professionals bhal lik bach y7aydo ta'min dyalhom. 3andek chwiya d waqt ?",
  },
  {
    type: 'Script Découverte',
    fr: "Pour vous proposer la meilleure offre, j'ai quelques questions :\n1. Vous êtes locataire ou propriétaire ?\n2. Avez-vous des enfants à charge ?\n3. Avez-vous déjà une assurance ?",
    darija: "Bach n9der n3awnek mezyan, 3andi chwiya d su'alat :\n1. Nta sakn b kra wella 3andek dar ?\n2. 3andek drari ?\n3. 3andek ta'min daba ?",
  },
  {
    type: 'Script Closing',
    fr: "Je vous propose de démarrer votre contrat aujourd'hui. Je vous envoie les documents par email dans 5 minutes. Ça vous convient ?",
    darija: "Kan9tarah nbdaw 3aqd dyalk lyom. Ghadi nsifet lik les documents f email f 5 da9a9. Wach had chi mzyan lik ?",
  },
]

export const PRODUCT_SCRIPTS = [
  { product: 'Auto', script: "Votre véhicule est votre outil de travail. Notre assurance auto professionnelle vous couvre 24h/24 avec assistance immédiate et zéro franchise..." },
  { product: 'Habitation', script: "Votre domicile mérite une protection complète. Notre formule habitation couvre tous les risques avec un rapport qualité-prix imbattable..." },
  { product: 'Santé', script: "Votre santé est votre capital le plus précieux. Notre complémentaire santé rembourse jusqu'à 300% des frais médicaux..." },
  { product: 'Vie', script: "Préparez l'avenir de vos proches avec notre assurance vie. Des versements flexibles, une fiscalité avantageuse..." },
  { product: 'RC Pro', script: "Protégez votre activité professionnelle. Notre RC Pro couvre tous les risques liés à votre exercice professionnel..." },
]

// ── Commercial objections ─────────────────────────────────────
export const OBJECTIONS = [
  {
    objection: "C'est trop cher",
    technique: 'Restructuration du coût',
    response: "Je comprends. Mais regardons ensemble — pour [X]€ par mois, vous êtes couvert pour [avantages]. C'est moins qu'un café par jour.",
    exercise: "Calculez le coût journalier et comparez-le à une dépense quotidienne banale (café, cigarettes, etc.).",
  },
  {
    objection: "Je dois réfléchir",
    technique: 'Clarification des freins',
    response: "Bien sûr. Qu'est-ce qui vous fait hésiter ? Le prix ? La couverture ? Je peux adapter l'offre.",
    exercise: "Listez les vraies objections cachées derrière \"je dois réfléchir\" et préparez une réponse pour chacune.",
  },
  {
    objection: "J'ai déjà une assurance",
    technique: 'Audit comparatif gratuit',
    response: "Parfait ! Je peux analyser votre contrat actuel gratuitement et vous dire si vous êtes bien couvert ou si on peut faire mieux pour moins cher.",
    exercise: "Proposez un audit gratuit de 10 minutes. Préparez 3 questions de comparaison pertinentes.",
  },
  {
    objection: "Je rappellerai",
    technique: 'Ancrage du rendez-vous',
    response: "Je comprends que vous êtes occupé. Quand seriez-vous disponible ? Je vous réserve un créneau maintenant.",
    exercise: "Proposez toujours deux créneaux précis, jamais une question ouverte. Ex: 'Mardi 10h ou jeudi 15h ?'",
  },
  {
    objection: "Je n'ai pas le temps",
    technique: 'Mini-engagement chrono',
    response: "Il me faut exactement 3 minutes pour vous montrer comment économiser [X]€ par an. Est-ce que 3 minutes ça vous convient ?",
    exercise: "Préparez un pitch de 3 minutes chronométré. Entraînez-vous jusqu'à tenir dans le temps imparti.",
  },
  {
    objection: "Envoyez-moi par email",
    technique: "Valeur ajoutée de l'appel",
    response: "Bien sûr, je peux vous envoyer une documentation. Mais par email vous ne pourrez pas poser de questions et obtenir une offre personnalisée. C'est pour ça que je préfère vous guider directement...",
    exercise: "Démontrez la valeur d'une conversation live vs un document statique.",
  },
]

// ── Commercial call scenarios (3 interactive) ─────────────────
export const CALL_SCENARIOS = [
  {
    id: 1,
    title: 'Client facile',
    difficulty: 'easy',
    description: 'Client réceptif, peu d\'objections, prêt à écouter.',
    exchanges: [
      { from: 'client', text: "Bonjour, oui j'ai un peu de temps. Mon assurance expire bientôt et je cherche quelque chose de mieux." },
      { from: 'agent_prompt', text: "Introduisez-vous et qualifiez les besoins du client." },
      { from: 'client', text: "Oui, je suis propriétaire. Pas d'enfants. J'ai une assurance auto basique." },
      { from: 'agent_prompt', text: "Proposez un produit adapté et expliquez les avantages." },
      { from: 'client', text: "C'est intéressant. Quel est le prix ?" },
      { from: 'agent_prompt', text: "Annoncez le prix et proposez de finaliser le contrat." },
      { from: 'client', text: "D'accord, ça me convient. Comment on procède ?" },
    ],
    tip: "Allez droit au but, qualifiez rapidement et proposez une solution claire. Ce client est déjà motivé.",
  },
  {
    id: 2,
    title: 'Client hésitant',
    difficulty: 'medium',
    description: 'Client intéressé mais indécis, a besoin d\'être rassuré.',
    exchanges: [
      { from: 'client', text: "Je ne sais pas... j'ai déjà essayé plusieurs assurances et je n'étais jamais satisfait." },
      { from: 'agent_prompt', text: "Écoutez ses expériences passées et montrez en quoi vous êtes différent." },
      { from: 'client', text: "Les prix étaient toujours trop élevés au final, avec plein de frais cachés." },
      { from: 'agent_prompt', text: "Répondez à l'objection prix et offrez de la transparence." },
      { from: 'client', text: "Hmm... si vous me garantissez ça, pourquoi pas. C'est combien ?" },
      { from: 'agent_prompt', text: "Présentez l'offre transparente et proposez de démarrer." },
    ],
    tip: "Validez ses frustrations passées, montrez votre transparence avec des chiffres concrets et des exemples.",
  },
  {
    id: 3,
    title: 'Objection prix',
    difficulty: 'hard',
    description: 'Client intéressé mais bloque systématiquement sur le prix.',
    exchanges: [
      { from: 'client', text: "Votre offre m'intéresse mais c'est vraiment trop cher pour moi en ce moment." },
      { from: 'agent_prompt', text: "Restructurez le coût — ramenez-le à un montant journalier comparable." },
      { from: 'client', text: "Oui mais quand même, 45€ par mois c'est beaucoup." },
      { from: 'agent_prompt', text: "Proposez une alternative moins chère ou des modalités de paiement." },
      { from: 'client', text: "Un paiement trimestriel ça serait mieux. Et les garanties sont les mêmes ?" },
      { from: 'agent_prompt', text: "Confirmez les garanties identiques et concluez sur le paiement trimestriel." },
    ],
    tip: "Décomposez le prix en coût journalier, proposez des alternatives de paiement, ne baissez pas le prix sans contrepartie.",
  },
]

// ── Commercial quiz (10 questions) ───────────────────────────
export const COMMERCIAL_QUIZ = [
  { q: "Quelle est la première étape d'un appel de vente réussi ?", options: ["Annoncer le prix", "Se présenter et créer le lien", "Proposer le produit", "Demander la carte bancaire"], correct: 1 },
  { q: "Quand un client dit 'c'est trop cher', que faites-vous ?", options: ["Baisser le prix immédiatement", "Raccrocher", "Restructurer le coût en valeur journalière", "Insister sur le même prix"], correct: 2 },
  { q: "La technique SONCAS identifie les motivations d'achat. Que signifie le S ?", options: ["Satisfaction", "Sécurité", "Service", "Succès"], correct: 1 },
  { q: "Combien de fois faut-il relancer un prospect en moyenne avant d'obtenir un rendez-vous ?", options: ["1 fois", "2 fois", "5 à 7 fois", "10 fois"], correct: 2 },
  { q: "La découverte des besoins doit se faire :", options: ["Après la présentation produit", "Avant toute présentation", "Pendant la signature", "Par email"], correct: 1 },
  { q: "Face à l'objection 'je rappellerai', la meilleure réponse est :", options: ["D'accord, bonne journée", "Proposer deux créneaux précis", "Insister longuement", "Envoyer un email"], correct: 1 },
  { q: "Le closing consiste à :", options: ["Terminer l'appel", "Obtenir l'engagement du client", "Faire une remise", "Présenter les inconvénients"], correct: 1 },
  { q: "Quelle question ouvre le mieux une découverte des besoins ?", options: ["Voulez-vous une assurance ?", "Quelle est votre situation actuelle ?", "Avez-vous de l'argent ?", "Vous connaissez nos offres ?"], correct: 1 },
  { q: "Un client dit 'j'ai déjà une assurance'. Vous proposez :", options: ["De raccrocher", "Un audit comparatif gratuit", "Un prix moins cher sans information", "De ne rien faire"], correct: 1 },
  { q: "La règle des 3 C en vente signifie :", options: ["Convaincre, Conclure, Célébrer", "Contacter, Comprendre, Conclure", "Calculer, Communiquer, Clore", "Créer, Convertir, Capitaliser"], correct: 1 },
]

// ── FAQ ───────────────────────────────────────────────────────
export const FAQ_ITEMS = [
  { question: "Combien de temps dure le processus d'immatriculation ORIAS ?", answer: "Le processus d'immatriculation ORIAS dure généralement entre 4 et 8 semaines à compter de la soumission de votre dossier complet. Votre conseiller dédié suit l'avancement en temps réel et vous tient informé à chaque étape." },
  { question: "Quels documents sont obligatoires pour le dossier ORIAS ?", answer: "Les documents obligatoires sont : une pièce d'identité valide, un casier judiciaire B3 de moins de 3 mois, une attestation de formation IAS1, un extrait Kbis de moins de 3 mois pour les sociétés, une attestation RCP et un RIB professionnel." },
  { question: "Comment accéder aux modules de formation IAS1 ?", answer: "Les modules de formation sont accessibles depuis la section 'Ma Formation' de votre tableau de bord. Les unités se débloquent progressivement. Vous devez compléter au minimum 150 heures de formation avant de pouvoir passer l'examen final." },
  { question: "Mon certificat de formation est-il reconnu officiellement ?", answer: "Oui, notre attestation de formation IAS1 est reconnue par l'ORIAS et conforme aux exigences de la DDA (Directive sur la Distribution d'Assurances). Elle est délivrée une fois l'examen final réussi avec un minimum de 10 bonnes réponses sur 20." },
  { question: "Comment contacter mon conseiller dédié ?", answer: "Votre conseiller dédié Mehdi Alaoui est disponible via WhatsApp de 9h à 20h (GMT+1), du lundi au samedi. Vous pouvez aussi prendre rendez-vous via le module de réservation Calendly disponible dans la section Support." },
]

// ── Admin mock data ───────────────────────────────────────────
export const ADMIN_CLIENTS = [
  { id: 1,  nom: 'Martin',  prenom: 'Sophie',  pack: 'Essentiel', progression: 67,  statut: 'En cours',      activite: 'il y a 2h',    email: 'student@oriafen.com' },
  { id: 2,  nom: 'Benali',  prenom: 'Karim',   pack: 'Premium',   progression: 100, statut: 'ORIAS obtenu',  activite: 'il y a 1j',    email: 'karim@example.com' },
  { id: 3,  nom: 'Dupont',  prenom: 'Claire',  pack: 'Starter',   progression: 33,  statut: 'En cours',      activite: 'il y a 3j',    email: 'claire@example.com' },
  { id: 4,  nom: 'Khalil',  prenom: 'Yassine', pack: 'Premium',   progression: 100, statut: 'ORIAS obtenu',  activite: 'il y a 5j',    email: 'yassine@example.com' },
  { id: 5,  nom: 'Morel',   prenom: 'Lucas',   pack: 'Essentiel', progression: 20,  statut: 'En cours',      activite: 'il y a 1h',    email: 'lucas@example.com' },
  { id: 6,  nom: 'Amrani',  prenom: 'Sara',    pack: 'Premium',   progression: 100, statut: 'ORIAS obtenu',  activite: 'il y a 2j',    email: 'sara@example.com' },
  { id: 7,  nom: 'Petit',   prenom: 'Thomas',  pack: 'Starter',   progression: 50,  statut: 'En cours',      activite: 'il y a 4h',    email: 'thomas@example.com' },
  { id: 8,  nom: 'Idrissi', prenom: 'Nadia',   pack: 'Essentiel', progression: 85,  statut: 'En cours',      activite: 'il y a 6h',    email: 'nadia@example.com' },
  { id: 9,  nom: 'Robert',  prenom: 'Emma',    pack: 'Premium',   progression: 100, statut: 'ORIAS obtenu',  activite: 'il y a 8j',    email: 'emma@example.com' },
  { id: 10, nom: 'Tazi',    prenom: 'Hassan',  pack: 'Starter',   progression: 10,  statut: 'En cours',      activite: 'il y a 30min', email: 'hassan@example.com' },
]

export const ADMIN_STATS = {
  totalClients: 63,
  enCours: 12,
  oriasObtenus: 51,
  revenusMois: '127 000',
}
