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
  { id: 'identity',        label: "Pièce d'identité",          sublabel: 'Passeport ou CIN',             accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'casier',          label: 'Casier judiciaire B3',       sublabel: 'Moins de 3 mois',              accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'attestation_ias', label: 'Attestation IAS1',           sublabel: 'Formation certifiante',        accept: '.pdf' },
  { id: 'kbis',            label: 'Kbis de la société',         sublabel: 'Moins de 3 mois',              accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'rcp',             label: 'Attestation RCP',            sublabel: 'Responsabilité Civile Pro',    accept: '.pdf' },
  { id: 'domicile',        label: 'Justificatif de domicile',   sublabel: 'Facture ou courrier officiel', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'statuts',         label: 'Statuts de la société',      sublabel: 'Document signé',               accept: '.pdf' },
  { id: 'rib',             label: "Relevé d'identité bancaire", sublabel: 'RIB professionnel',            accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'photo',           label: "Photo d'identité",           sublabel: 'Format numérique JPG/PNG',     accept: '.jpg,.jpeg,.png' },
]

// ── Demo document state ───────────────────────────────────────
export const DEMO_DOCS_BY_CATEGORY = {
  identity:        { id: 'dd-1', status: 'valid',   fileName: 'passeport.pdf',       fileUrl: null, rejectionReason: null },
  casier:          { id: 'dd-2', status: 'valid',   fileName: 'casier_b3.pdf',       fileUrl: null, rejectionReason: null },
  attestation_ias: { id: 'dd-3', status: 'pending', fileName: 'attestation_ias.pdf', fileUrl: null, rejectionReason: null },
  kbis:            { id: 'dd-4', status: 'valid',   fileName: 'kbis_2026.pdf',       fileUrl: null, rejectionReason: null },
  rcp:             { id: 'dd-5', status: 'valid',   fileName: 'rcp_pro.pdf',         fileUrl: null, rejectionReason: null },
  rib:             { id: 'dd-6', status: 'missing', fileName: null,                  fileUrl: null, rejectionReason: 'Document illisible, veuillez renvoyer une version lisible.' },
}

// ── Formation units ───────────────────────────────────────────
export const FORMATION_UNITS = [
  {
    id: 1, title: 'Les savoirs généraux', totalHours: 20, completedHours: 20, status: 'completed',
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
    id: 2, title: 'Assurances personnes', totalHours: 30, completedHours: 25, status: 'in_progress',
    description: "Approfondissement des contrats d'assurance de personnes : prévoyance, dépendance et complémentaire santé.",
    chapters: [
      { label: 'Invalidité/Décès/Dépendance', hours: 10 },
      { label: 'La dépendance', hours: 10 },
      { label: 'Complémentaire santé', hours: 10 },
    ],
  },
  {
    id: 3, title: 'Assurance vie', totalHours: 45, completedHours: 0, status: 'locked',
    description: "Maîtrisez les contrats d'assurance vie, leur fiscalité avantageuse et les stratégies patrimoniales associées.",
    chapters: [
      { label: 'Analyse des besoins', hours: 14 },
      { label: 'Catégories de contrats', hours: 21 },
      { label: 'Les spécificités', hours: 10 },
    ],
  },
  {
    id: 4, title: 'Contrats collectifs', totalHours: 10, completedHours: 0, status: 'locked',
    description: "Les régimes collectifs obligatoires et facultatifs pour les entreprises, ainsi que la protection sociale des salariés.",
    chapters: [
      { label: 'Assurance de groupe', hours: 5 },
      { label: 'Contrats collectifs salariés', hours: 5 },
    ],
  },
  {
    id: 5, title: 'Biens & Responsabilité', totalHours: 45, completedHours: 0, status: 'locked',
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
  { id: 1,  question: "Que signifie ORIAS ?", options: ["Office de Régulation des Intermédiaires en Assurances et Sécurité", "Organisme pour le Registre des Intermédiaires en Assurance", "Organisation Régionale des Intermédiaires", "Office de Référencement des Intermédiaires"], correct: 1 },
  { id: 2,  question: "Quelle est la durée minimale de la formation IAS Niveau 1 ?", options: ["50 heures", "100 heures", "150 heures", "200 heures"], correct: 2 },
  { id: 3,  question: "Quelle assurance est obligatoire pour un courtier ORIAS ?", options: ["Assurance vie", "Responsabilité Civile Professionnelle", "Assurance habitation", "Assurance auto"], correct: 1 },
  { id: 4,  question: "Quel est le seuil minimum de bonnes réponses à l'examen final ?", options: ["40 sur 100", "50 sur 100", "60 sur 100", "70 sur 100"], correct: 1 },
  { id: 5,  question: "Qu'est-ce que la directive DDA ?", options: ["Document de divulgation d'assurance", "Directive sur la distribution d'assurance", "Déclaration des droits des assurés", "Dossier de demande d'agrément"], correct: 1 },
  { id: 6,  question: "Le renouvellement ORIAS se fait :", options: ["Tous les 5 ans", "Tous les 3 ans", "Chaque année", "Tous les 2 ans"], correct: 2 },
  { id: 7,  question: "La formation continue annuelle obligatoire est de :", options: ["5 heures", "10 heures", "15 heures", "20 heures"], correct: 2 },
  { id: 8,  question: "Un courtier peut exercer :", options: ["Sans aucune assurance", "Avec une RCP uniquement", "Avec une assurance vie uniquement", "Sans inscription ORIAS"], correct: 1 },
  { id: 9,  question: "La fiche conseil doit être remise :", options: ["Après la signature du contrat", "Avant la signature du contrat", "30 jours après la souscription", "Elle n'est pas obligatoire"], correct: 1 },
  { id: 10, question: "Le délai de renonciation pour une assurance vie est de :", options: ["14 jours", "30 jours", "7 jours", "60 jours"], correct: 1 },
  { id: 11, question: "L'assurance IARD couvre :", options: ["Uniquement les personnes", "Incendie, Accidents, Risques Divers", "Investissement, Actions, Risques Diversifiés", "Uniquement les entreprises"], correct: 1 },
  { id: 12, question: "La garantie décès est :", options: ["Facultative", "Obligatoire pour tous les contrats", "Une assurance de personnes", "Une assurance de biens"], correct: 2 },
  { id: 13, question: "Le document d'information sur le produit d'assurance s'appelle :", options: ["DIPA", "DIRA", "DIPA ou IPID en anglais", "Fiche produit standard"], correct: 0 },
  { id: 14, question: "En cas de fausse déclaration intentionnelle, le contrat est :", options: ["Modifié", "Suspendu", "Nul", "Continué normalement"], correct: 2 },
  { id: 15, question: "La subrogation permet à l'assureur de :", options: ["Résilier le contrat", "Se retourner contre le responsable du sinistre", "Augmenter la prime", "Refuser le sinistre"], correct: 1 },
  { id: 16, question: "Le taux de commission moyen en assurance auto est de :", options: ["5-7%", "8-15%", "20-30%", "1-3%"], correct: 1 },
  { id: 17, question: "La MRH couvre :", options: ["Uniquement l'incendie", "Multi-Risques Habitation", "Uniquement le vol", "Uniquement la responsabilité civile"], correct: 1 },
  { id: 18, question: "L'analyse des besoins client est obligatoire selon :", options: ["Le Code civil", "La directive DDA", "Le Code pénal", "Le règlement RGPD"], correct: 1 },
  { id: 19, question: "Un contrat d'assurance vie peut être souscrit pour :", options: ["Maximum 10 ans", "Durée illimitée", "Maximum 30 ans", "Minimum 20 ans"], correct: 1 },
  { id: 20, question: "Le devoir de conseil implique :", options: ["Vendre le produit le plus cher", "Proposer le produit le mieux adapté aux besoins du client", "Proposer uniquement les produits de son compagnie", "Ne pas informer sur les exclusions"], correct: 1 },
]

// ════════════════════════════════════════════════════════════════
// COMMERCIAL — CALL SCRIPTS (variants réels avec flow Oui/Non)
// ════════════════════════════════════════════════════════════════
export const CALL_SCRIPTS = [
  {
    type: 'Script Introduction',
    variants: [
      {
        name: 'Lead entrant',
        fr: `Bonjour [Prénom], c'est [Votre Prénom] du cabinet Oriafen. Je vous appelle suite à votre demande d'information sur nos solutions d'assurance.

J'ai votre dossier sous les yeux — vous avez indiqué être intéressé par [produit]. Est-ce que je vous dérange ou vous avez 3 minutes ?

→ SI OUI (pas dérangé) :
Parfait ! Mon objectif n'est pas de vous vendre quoi que ce soit aujourd'hui, mais de comprendre votre situation et voir si on peut vous faire économiser de l'argent tout en étant mieux couvert. On commence par quelques questions rapides ?

→ SI NON (mauvais moment) :
Pas de souci. Je vous rappelle — vous seriez disponible plutôt en début de matinée ou fin d'après-midi ? [Proposer deux créneaux précis : ex. "Demain à 10h ou jeudi à 16h ?"]`,
      },
      {
        name: 'Recommandation',
        fr: `Bonjour [Prénom], c'est [Votre Prénom] du cabinet Oriafen à Paris. C'est [Nom du référent] qui m'a transmis votre contact — il m'a dit que vous cherchiez à optimiser votre couverture assurance.

Je ne prends que 2 minutes. Est-ce que c'est le bon moment ?

→ SI OUI :
[Nom du référent] m'a dit beaucoup de bien de vous. Mon rôle chez Oriafen c'est de trouver la meilleure solution assurance pour des professionnels comme vous, souvent à meilleur tarif. Pour voir si je peux vraiment vous aider, j'ai besoin de comprendre votre situation actuelle. Vous êtes couvert par quelle compagnie actuellement ?

→ SI NON :
Je comprends. Quand est-ce que je pourrais vous rappeler ? Je bloque un créneau pour vous. Mardi matin ou mercredi après-midi, ça vous irait ?`,
      },
      {
        name: 'Prospect froid',
        fr: `Bonjour [Prénom], c'est [Votre Prénom], conseiller en assurance au cabinet Oriafen. Je vous appelle car on accompagne des [profil : indépendants / chefs d'entreprise...] dans votre secteur.

En général nos clients économisent entre 15 et 30% sur leurs contrats en passant par nous. Vous avez 2 minutes pour voir si c'est votre cas ?

→ SI OUI :
Super. Vous êtes actuellement assuré ? Vous avez une ou plusieurs compagnies ?

→ SI NON / PAS INTÉRESSÉ :
Je comprends. C'est une question de timing ou vous êtes déjà très bien couvert ? [Identifier la vraie raison — ça peut débloquer la conversation]`,
      },
    ],
  },
  {
    type: 'Script Découverte',
    variants: [
      {
        name: '5 questions clés',
        fr: `Pour vous proposer exactement ce dont vous avez besoin, j'ai 5 questions rapides. C'est parti ?

1. SITUATION
"Vous êtes salarié, indépendant ou chef d'entreprise ?"
→ Si salarié : "Avez-vous une mutuelle d'entreprise ou vous cotisez à titre personnel ?"
→ Si indépendant : "Depuis combien de temps ? Vous avez une structure juridique ?"

2. COUVERTURE ACTUELLE
"Vous avez des contrats d'assurance actuellement ?"
→ Si oui : "Vous êtes satisfait ? Vous savez combien vous payez par mois en tout ?"
→ Si non : "On part de zéro — c'est plus simple."

3. SITUATION FAMILIALE
"Vous avez des personnes à charge ?"
→ Si oui : "Votre conjoint a sa propre mutuelle ?"

4. PRIORITÉS
"Si vous deviez prioriser : votre santé, votre bien immobilier, votre véhicule, ou votre responsabilité professionnelle ?"

5. BUDGET
"Sans engagement, vous avez une idée du budget que vous pourriez consacrer à votre protection mensuelle ?"
→ "Si on vous couvre correctement pour moins que ce que vous payez aujourd'hui, c'est une bonne nouvelle non ?"`,
      },
      {
        name: 'Découverte approfondie',
        fr: `Je vais vous poser quelques questions pour vraiment comprendre votre situation — c'est important pour ne pas vous proposer quelque chose qui ne vous correspond pas.

HISTORIQUE
"Vous avez déjà eu des expériences avec d'autres courtiers ou compagnies ?"
→ Si mauvaise expérience : "Qu'est-ce qui s'est passé ? [Écouter — c'est votre opportunité de vous différencier]"

VIE PROFESSIONNELLE
"Parlez-moi de votre activité. Vous vous déplacez chez des clients ?"
→ Un professionnel mobile a des besoins très différents d'un sédentaire.

PERCEPTION DU RISQUE
"Dans votre métier, qu'est-ce qui vous ferait le plus de tort — un pépin de santé, un problème avec un client, un accident ?"
→ Cette question révèle ce qui l'inquiète vraiment.

CRÉDIT IMMOBILIER
"Vous avez un crédit immobilier en cours ? [Si oui] L'assurance emprunteur a été prise à la banque ?"
→ Souvent une énorme opportunité d'économie.

DÉCISION
"Quand vous prenez une décision comme ça, vous décidez seul ou vous en parlez avec quelqu'un ?"
→ Identifier si un tiers est impliqué avant de faire votre offre.`,
      },
    ],
  },
  {
    type: 'Script Argumentation',
    variants: [
      {
        name: 'Structure CAB',
        fr: `Basé sur ce que vous venez de me dire, voici ce que je recommande et pourquoi.

CARACTÉRISTIQUE → AVANTAGE → BÉNÉFICE CLIENT

Exemple Mutuelle Santé :
"Notre formule inclut un remboursement à 200% du tarif sécu pour les soins dentaires et optiques [Caractéristique] — vous n'avez quasiment plus rien à payer de votre poche [Avantage] — et pour vous qui avez des frais d'optique réguliers, ça représente une économie réelle d'environ [X]€ par an [Bénéfice]."

Exemple RC Pro :
"La garantie couvre les dommages jusqu'à 1,5 million d'euros [Caractéristique] — en cas de litige, c'est notre assureur qui prend en charge tous les frais de défense [Avantage] — pour vous qui travaillez en prestation de service, une erreur ne peut pas mettre en danger votre entreprise [Bénéfice]."

APRÈS L'ARGUMENTATION — Vérifier l'adhésion :
"Est-ce que ça répond bien à ce que vous cherchiez ?"

→ SI OUI : Passer directement au closing.
→ SI OBJECTION : Traiter l'objection puis revenir à cette question.`,
      },
    ],
  },
  {
    type: 'Script Closing',
    variants: [
      {
        name: 'Closing assumé (client chaud)',
        fr: `Bien, je pense qu'on a fait le tour. La formule [Nom] à [X]€/mois est vraiment la plus adaptée à votre situation.

Pour démarrer, j'ai besoin de deux choses :
1. Votre email pour vous envoyer les documents
2. Une date d'effet — le 1er du mois prochain ou dès maintenant ?

→ SI CLIENT CONFIRME :
Parfait. Je vous envoie le dossier dans les 5 prochaines minutes sur [email]. Signature électronique, 3 minutes maximum de votre côté.

→ SI CLIENT HÉSITE :
"Qu'est-ce qui vous empêche de démarrer aujourd'hui ? [Écouter sans interrompre] C'est une question de budget, de timing, ou il manque une information ?"`,
      },
      {
        name: 'Closing doux (client tiède)',
        fr: `Je ne veux pas vous brusquer. Voilà ce que je vous propose :

Je vous envoie un récapitulatif complet par email — les garanties, le tarif, une comparaison avec ce que vous avez. Vous avez tout sous les yeux pour décider tranquillement.

Et je vous rappelle [dans 2 jours] pour répondre à vos dernières questions. Ça vous convient ?

→ SI OUI : "Votre email c'est [email] ? Vous le recevez d'ici ce soir. [Mettre un rappel immédiatement dans le CRM]"

→ SI "Je verrai" sans engagement : "Je veux être sûr de ne pas vous oublier. Vendredi à [heure précise] — vous êtes disponible ?"

RÈGLE : Ne jamais raccrocher sans une action concrète — soit une signature, soit une date de rappel précise.`,
      },
      {
        name: 'Closing après objection prix',
        fr: `Je vous entends sur le budget. Voilà ce qu'on peut faire.

Option 1 — Formule allégée :
"On retire la garantie [X] qui ne correspond pas à votre usage → [Y]€/mois. Vous gardez l'essentiel."

Option 2 — Paiement annuel :
"Si vous optez pour le paiement annuel, vous économisez [Z]€ sur l'année. Soit [montant/mois] en équivalent mensuel."

Option 3 — Valeur vs coût :
"[X]€/mois c'est [X/30]€ par jour. En échange, si [risque principal identifié] arrive, vous êtes couvert. Est-ce que ça vaut ce prix pour vous ?"

→ SI TOUJOURS BLOQUÉ : "Quel serait le budget qui vous conviendrait ? [Écouter] D'accord, voyons ce qu'on peut faire dans cette enveloppe."`,
      },
    ],
  },
  {
    type: 'Script Relance',
    variants: [
      {
        name: 'Relance J+2',
        fr: `Bonjour [Prénom], c'est [Votre Prénom] d'Oriafen. On s'est parlé [lundi], je vous avais envoyé un récapitulatif.

Je voulais juste m'assurer que vous l'aviez bien reçu et voir si vous aviez des questions.

→ SI LU MAIS PAS RÉPONDU :
"Qu'est-ce qui vous a arrêté ? Quelque chose n'était pas clair ?"

→ SI PAS LU :
"Pas de souci. Je vous le renvoie maintenant. Vous pouvez y jeter un œil dans la journée ? Je vous rappelle demain à [heure]."

→ SI REFUS DÉFINITIF :
"Je comprends. Puis-je vous demander ce qui vous a fait décider autrement ? C'est pour m'améliorer." [Ces infos sont précieuses]`,
      },
      {
        name: 'Relance J+7',
        fr: `Bonjour [Prénom], c'est [Votre Prénom] d'Oriafen. Je reviens vers vous car je vous avais fait parvenir une proposition la semaine dernière.

Je ne veux pas vous harceler — si vous avez trouvé une meilleure solution ailleurs, dites-le moi franchement.

Mais s'il reste un doute, c'est exactement le moment d'en parler. Qu'est-ce qui s'est passé depuis notre dernier échange ?

→ ÉCOUTER ACTIVEMENT. Ne pas parler pendant au moins 15 secondes après la question.

→ SI "J'ai été occupé" : "Pas de problème. On reprend — votre priorité c'était [rappeler son besoin]. La proposition tient toujours. On peut finaliser maintenant ?"`,
      },
    ],
  },
]

// ════════════════════════════════════════════════════════════════
// COMMERCIAL — PRODUCT SCRIPTS (complets avec flow et objections)
// ════════════════════════════════════════════════════════════════
export const PRODUCT_SCRIPTS = [
  {
    product: 'Mutuelle Santé',
    tagline: 'Produit le plus vendu — fort potentiel upsell',
    intro: `"Vous avez actuellement une mutuelle ? [Si non] Alors vous payez 100% de vos frais médicaux de votre poche. [Si oui] Vous savez ce qu'elle vous rembourse exactement sur les lunettes et les soins dentaires ?"`,
    script: `PRÉSENTATION :
"Notre complémentaire santé couvre jusqu'à 200% du tarif sécu sur les soins courants, 300% sur les soins dentaires complexes, et inclut un forfait optique de [X]€/an.

Points différenciants :
— Réseau partenaires : tiers payant intégral, vous ne sortez rien de votre poche
— Remboursement en 48h sur votre compte
— Téléconsultation 7j/7 incluse depuis votre téléphone

Sur la base de ce que vous m'avez dit : si vous dépensez [X]€/an en santé, vous récupéreriez [estimation] — le contrat vous coûte réellement [prix net] après remboursements."

OBJECTIONS :

1. "C'est plus cher que ma mutuelle actuelle"
→ "Vous savez ce que votre mutuelle rembourse sur les lunettes ? La plupart : 150-200€. Nous : [X]€. Si vous dépensez [montant] en optique tous les 2 ans, on rentabilise la différence en [durée]. On fait le calcul ensemble ?"

2. "J'ai déjà la mutuelle de mon entreprise"
→ "Ça couvre le salarié. Mais votre famille ? Si conjoint ou enfants ne sont pas couverts à 100%, vous payez le reste de votre poche. Notre formule famille coûte [X]€ de plus/mois — ça s'autofinance souvent dès le premier trimestre."

3. "Je suis jeune, je ne suis jamais malade"
→ "Justement ! Souscrite jeune, la prime est basse. Vous êtes allé chez l'ophtalmo récemment ? Les lunettes correctrices c'est [X]€ en moyenne. Avec notre forfait, vous payez [Y]€. La différence finance la moitié de votre cotisation annuelle."

CLOSING :
"Pour votre profil, je recommande la formule [X] à [Y]€/mois. Pour activer, j'ai besoin de votre RIB et d'une pièce d'identité. Je vous envoie le lien de souscription maintenant ?"`,
  },
  {
    product: 'RC Pro / Décennale',
    tagline: 'Obligatoire pour les indépendants — vente facile si bien expliquée',
    intro: `"Vous exercez en indépendant ou en société ? Alors vous êtes personnellement responsable de tout dommage causé dans le cadre de votre activité. Sans RC Pro, c'est votre patrimoine personnel qui est en jeu — votre voiture, votre épargne, votre appartement."`,
    script: `PRÉSENTATION :
"La RC Pro couvre :
— Dommages corporels, matériels et immatériels causés à vos clients ou tiers
— Frais de défense juridique en cas de litige
— Protection des données et responsabilité cyber
— Erreurs professionnelles — même sans faute intentionnelle

Exemple concret : vous êtes consultant, vous livrez une analyse et le client prend une mauvaise décision qui lui coûte 50 000€. Sans RC Pro, il peut se retourner contre vous personnellement. Avec elle, notre assureur prend en charge sa réclamation et vos frais d'avocat."

OBJECTIONS :

1. "Ma micro-entreprise ne fait pas assez de CA"
→ "La responsabilité n'est pas proportionnelle au CA. Un consultant qui facture 2 000€/mois peut causer un préjudice de 100 000€. La vraie question : pouvez-vous vous permettre de perdre un procès ?"

2. "Mon client ne m'a jamais demandé de RC Pro"
→ "Pas encore. Mais les grands groupes et administrations l'exigent systématiquement. Et même sans qu'on vous le demande, si vous causez un dommage, vous êtes responsable."

3. "J'ai déjà souscrit une RC chez [compagnie]"
→ "Vous savez si elle couvre les dommages immatériels — les pertes financières causées à un client ? Beaucoup de contrats RC de base les excluent. C'est pourtant le risque n°1 pour un prestataire de service."

CLOSING :
"Pour votre activité de [métier], la formule [X] avec couverture jusqu'à [montant] est à [Y]€/mois, déductible à 100% de vos charges pro. Je vous prépare le devis maintenant ?"`,
  },
  {
    product: 'Assurance Auto Pro',
    tagline: 'Usage professionnel — fort panier moyen',
    intro: `"Vous utilisez votre voiture pour votre activité — rendez-vous clients, déplacements ? Alors sachez qu'un contrat auto classique ne couvre pas les accidents en usage professionnel. Si vous êtes en déplacement pro et avez un accident, votre assureur peut refuser d'indemniser."`,
    script: `PRÉSENTATION :
"Notre assurance auto professionnelle couvre :
— Usage professionnel ET personnel, 24h/24 — un seul contrat
— Assistance 0 km : en panne devant chez vous, on vient quand même
— Véhicule de remplacement immédiat en cas de sinistre
— Protection conducteur jusqu'à [X]€ d'indemnisation corporelle
— Pas de franchise si accident responsable avec tiers identifié"

OBJECTIONS :

1. "Mon assurance actuelle me suffit"
→ "Vous avez vérifié qu'elle couvre l'usage professionnel ? C'est souvent une clause cachée. Je vous propose qu'on vérifie ensemble — si vous êtes bien couvert, parfait. Sinon, c'est une faille à corriger avant d'avoir un sinistre."

2. "C'est plus cher que ce que je paye"
→ "Si on retire votre franchise actuelle et qu'on ajoute la valeur du véhicule de remplacement — combien ça vous coûterait de louer une voiture pendant 15 jours ? [X]€ au moins. Notre offre absorbe ce risque."

3. "J'ai un malus"
→ "On travaille avec des assureurs spécialisés profils malussés. Votre coefficient actuel c'est combien ? Je fais tourner nos comparateurs et je reviens vers vous avec une offre dans 24h."

CLOSING :
"Je vous fais la proposition avec 3 niveaux de garanties — vous choisissez. J'ai besoin de votre carte grise, permis et relevé d'informations. On part là-dessus ?"`,
  },
  {
    product: 'Multirisque Habitation',
    tagline: 'Obligatoire locataires — propriétaires souvent sous-couverts',
    intro: `"Vous êtes locataire ou propriétaire ? [Locataire] L'assurance habitation est obligatoire — votre bailleur peut résilier votre bail si vous n'en avez pas. [Propriétaire] Votre MRH couvre bien la valeur à neuf de votre mobilier ?"`,
    script: `PRÉSENTATION :
"Notre MRH couvre :
— Incendie, dégât des eaux, vol, vandalisme, catastrophes naturelles
— Responsabilité civile vie privée : si votre enfant casse une vitre chez le voisin, on prend en charge
— Valeur à neuf sur le mobilier pendant 5 ans
— Protection juridique : litiges bailleur, syndic, voisins
— Assistance 24h/24 : serrurier, plombier, électricien sans avance de frais"

OBJECTIONS :

1. "Je suis déjà assuré via ma banque"
→ "Les assurances bancaires ont des plafonds bas. Sur le vol, beaucoup plafonnent à 1 500€. Si vous avez un ordinateur, un vélo de qualité ou des bijoux, vous n'êtes pas vraiment couvert. Vous connaissez vos plafonds actuels ?"

2. "C'est quoi la différence avec ce que j'ai ?"
→ "Envoyez-moi votre attestation actuelle par email — je fais une comparaison garantie par garantie et vous montre les différences en noir sur blanc."

3. "J'habite en colocation"
→ "En colocation, chaque colocataire est responsable de ses propres dommages. Si vous laissez couler un robinet et inondez l'appartement d'en dessous, c'est vous qui payez. Une MRH à [X]€/mois vous couvre entièrement."

CLOSING :
"Pour votre logement de [X]m², la formule [Y] est à [Z]€/mois, résiliable à tout moment. J'ai besoin de votre adresse, la surface et votre date d'entrée. On le fait maintenant en 5 minutes ?"`,
  },
  {
    product: 'Assurance Emprunteur',
    tagline: 'Économie de 5 000€ à 20 000€ possible — loi Lemoine 2022',
    intro: `"Vous avez un crédit immobilier en cours ? Saviez-vous que depuis la loi Lemoine 2022, vous pouvez changer d'assurance emprunteur à tout moment, sans frais, même si votre prêt date de 10 ans ? La plupart des gens économisent entre 5 000€ et 20 000€ sur la durée."`,
    script: `PRÉSENTATION :
"L'assurance de votre banque est calculée sur le capital initial. La nôtre est calculée sur le capital restant dû — votre prime diminue chaque année au fur et à mesure que vous remboursez.

Sur un crédit de [montant] sur [durée] ans, la différence peut représenter [X]€ d'économie totale.

On prend en charge 100% des démarches de résiliation et transfert. Vous signez un mandat, on s'occupe de tout avec votre banque."

OBJECTIONS :

1. "Ma banque va mal le prendre"
→ "Votre banque ne peut pas refuser — c'est la loi. Depuis la loi Lemoine, elle a l'obligation d'accepter un contrat externe équivalent. Elle peut demander 10 jours ouvrés de délai de réponse, c'est tout."

2. "J'ai des problèmes de santé"
→ "La loi Lemoine a supprimé le questionnaire de santé pour les prêts inférieurs à 200 000€ remboursés avant 60 ans. Pour les montants plus élevés, on a des assureurs spécialisés risques aggravés."

3. "Je n'ai pas le temps de m'en occuper"
→ "C'est précisément pour ça que je suis là. Vous me donnez une procuration, je gère tout. Votre seule action : signer les documents que je vous envoie par email. 20 minutes de votre côté en tout."

CLOSING :
"Pour commencer, j'ai besoin de votre tableau d'amortissement et votre contrat d'assurance actuel. Je vous fais un devis comparatif sous 48h. Votre email c'est [email] ?"`,
  },
]

// ════════════════════════════════════════════════════════════════
// COMMERCIAL — OBJECTIONS (31 traitées)
// ════════════════════════════════════════════════════════════════
export const OBJECTIONS = [
  { category: 'Prix', objection: "C'est trop cher", technique: 'Coût journalier', response: `"Je comprends. Mais [X]€/mois c'est [X/30]€ par jour — le prix d'un café. En échange vous êtes couvert pour [avantage]. La vraie question : qu'est-ce que ça vous coûterait si le risque se réalise sans couverture ?"`, exercise: "Calculez le coût journalier de 3 de vos offres. Comparez à une dépense quotidienne banale." },
  { category: 'Prix', objection: "Votre concurrent est moins cher", technique: 'Comparaison qualitative', response: `"C'est possible. Avez-vous comparé les mêmes garanties ? Souvent la différence de prix s'explique par des plafonds plus bas ou des exclusions supplémentaires. On met les deux offres côte à côte ?"`, exercise: "Préparez un tableau de comparaison pour vos 3 concurrents principaux." },
  { category: 'Prix', objection: "Je ne peux pas me permettre ça en ce moment", technique: 'Empathie + alternative', response: `"Je vous entends. C'est une question de timing ou structurel ? Si timing, je peux faire démarrer le contrat au [date future] et vous envoyer les documents maintenant pour ne pas y revenir."`, exercise: "Préparez toujours une version allégée à 20-30% moins cher. Mieux vaut vendre basique que rien." },
  { category: 'Prix', objection: "J'ai un budget limité de X€ par mois", technique: 'Adaptation au budget', response: `"On travaille avec [X]€. Dans cette enveloppe : [formule adaptée]. Vous ne couvrez pas tout, mais vous couvrez le risque principal — [risque n°1 identifié]. On pourra augmenter la couverture quand votre situation évolue."`, exercise: "Construisez une gamme 3 niveaux pour chaque produit : essentiel, standard, premium." },
  { category: 'Timing', objection: "Je dois réfléchir", technique: 'Clarification des freins', response: `"Bien sûr. Sur quoi porte votre réflexion — le prix ? Une garantie ? Un doute sur l'assureur ? Si vous me dites le frein, je peux peut-être lever le doute maintenant."`, exercise: "Listez les 5 vraies raisons derrière 'je dois réfléchir' : prix, conjoint, confiance, besoin, urgence." },
  { category: 'Timing', objection: "Rappelez-moi dans 3 mois", technique: 'Ancrage d\'intérêt', response: `"Je note. Qu'est-ce qui va changer dans 3 mois ? Si c'est budgétaire, on peut anticiper. Si c'est autre chose, dites-moi."`, exercise: "Ne jamais accepter 'rappellez dans X mois' sans comprendre pourquoi." },
  { category: 'Timing', objection: "Je n'ai pas le temps là", technique: 'Mini-engagement 3 min', response: `"Il me faut exactement 3 minutes pour vous montrer un chiffre qui pourrait vous surprendre. Si après 3 minutes ça ne vous intéresse pas, je ne vous rappelle plus. Vous avez 3 minutes ?"`, exercise: "Chronométrez un pitch de 2m30 : qualification + chiffre d'économie + question de closing." },
  { category: 'Timing', objection: "Je rappellerai", technique: 'Prendre l\'initiative', response: `"Je préfère que ce soit moi qui rappelle. Je vous propose [jour] à [heure] ou [autre jour] à [autre heure]. Lequel vous convient ?"`, exercise: "Proposez toujours deux créneaux précis. Le prospect qui choisit lui-même se sent engagé à décrocher." },
  { category: 'Timing', objection: "Ce n'est pas le bon moment de l'année", technique: 'Résiliation à tout moment', response: `"Bonne nouvelle : depuis la loi Hamon, vous pouvez souscrire à n'importe quel moment — c'est notre assureur qui résilie votre ancienne couverture à date anniversaire. Il n'y a pas de mauvais moment."`, exercise: "Maîtrisez les délais légaux de résiliation pour vos 5 produits principaux." },
  { category: 'Confiance', objection: "Je ne connais pas Oriafen", technique: 'Légitimité ORIAS', response: `"Tout à fait normal. Mais les contrats que je propose sont ceux de compagnies que vous connaissez : [noms]. Notre valeur : comparer 20+ assureurs pour vous. Nous sommes immatriculés ORIAS — vérifiable sur orias.fr."`, exercise: "Apprenez par cœur votre numéro ORIAS et vos 5 compagnies partenaires principales." },
  { category: 'Confiance', objection: "J'ai eu de mauvaises expériences avec les courtiers", technique: 'Validation + différenciation', response: `"Je vous crois. Racontez-moi ce qui s'est passé. [Écouter] Ce que vous décrivez c'est [résumer]. Chez nous, voici comment c'est différent : [point concret]. Est-ce que ça rassure ?"`, exercise: "Transformez les 3 mauvaises pratiques du secteur en 3 engagements différenciants concrets." },
  { category: 'Confiance', objection: "Est-ce que je peux voir un contrat avant ?", technique: 'Oui + lecture guidée', response: `"Absolument. Je vous envoie les conditions générales. Je vous propose qu'on en fasse une lecture guidée ensemble — 20 minutes au téléphone — pour vous expliquer les clauses importantes. On fait ça quand ?"`, exercise: "Préparez un guide de lecture 1 page pour vos 3 produits phares." },
  { category: 'Confiance', objection: "Comment je sais que vous ne disparaissez pas après ?", technique: 'Engagement de suivi', response: `"Après signature : vous recevez mes coordonnées directes. Je vous appelle 30 jours après pour m'assurer que tout est en ordre. En cas de sinistre, c'est moi qui coordonne le dossier avec l'assureur."`, exercise: "Mettez en place : appel J+30, email anniversaire, contact proactif si conditions changent." },
  { category: 'Besoin', objection: "Je n'en ai pas besoin", technique: 'Réveil du risque', response: `"Si demain vous avez un gros problème de santé et êtes arrêté 6 mois, qu'est-ce qui se passe financièrement ? Et si un client vous attaque en justice ? La plupart des gens se croient à l'abri jusqu'au jour où le risque se concrétise."`, exercise: "Préparez 3 scénarios de sinistres réels anonymisés. Un sinistre concret vaut 10 arguments théoriques." },
  { category: 'Besoin', objection: "J'ai déjà une assurance", technique: 'Audit gratuit', response: `"Vous savez exactement ce que votre contrat couvre et ne couvre pas ? La plupart de mes clients découvrent en faisant l'audit qu'ils ont des lacunes ou paient trop cher. L'audit est gratuit, 15 minutes. On le fait ?"`, exercise: "Préparez 5 questions d'audit qui révèlent systématiquement une lacune. Ex : 'Couvre-t-il les dommages immatériels chez un client ?'" },
  { category: 'Besoin', objection: "Ma banque s'occupe de tout", technique: 'Indépendance courtier', response: `"Votre banque ne propose que ses propres produits — elle ne peut pas comparer le marché. Un courtier compare 20+ compagnies et sélectionne la meilleure pour votre profil. C'est littéralement pour ça que les courtiers existent."`, exercise: "Connaissez les produits des 5 principales banques françaises pour chaque produit que vous vendez." },
  { category: 'Besoin', objection: "Je règle ça plus tard", technique: 'Coût de l\'inaction', response: `"Plus on attend, plus la prime augmente — surtout santé et prévoyance. À [âge + 5 ans], la même couverture coûtera [X]% plus cher. Et si un problème de santé survient entre temps, vous pourriez ne plus être assurable aux mêmes conditions."`, exercise: "Pour chaque produit, calculez l'augmentation de prime entre 30, 40 et 50 ans." },
  { category: 'Besoin', objection: "Je suis fonctionnaire / bien couvert via mon employeur", technique: 'Lacunes du régime général', response: `"La couverture de base est souvent suffisante pour les soins courants. Mais vos plafonds dentaire et optique ? Et votre prévoyance si arrêt long terme — combien toucheriez-vous par mois pendant 6 mois d'arrêt maladie ?"`, exercise: "Apprenez les niveaux de remboursement du régime général pour soins courants, optique, dentaire, IJ." },
  { category: 'Procrastination', objection: "Envoyez-moi ça par email", technique: 'Valeur du contact direct', response: `"Je peux. Mais par email vous ne pouvez pas poser de questions, et 40 pages d'assurance sans explication... Je vous envoie un résumé d'une page et on se rappelle dans 24h pour 10 minutes. Ça vous va ?"`, exercise: "Préparez un résumé d'une page par produit — max 5 points clés avec chiffres. Se lit en 2 minutes." },
  { category: 'Procrastination', objection: "Je n'ai pas le temps de m'en occuper", technique: 'Simplicité du processus', response: `"La souscription se fait en ligne, signature électronique, aucun déplacement. Pour la plupart de nos contrats c'est moins de 15 minutes de votre temps total — je gère tout le reste. Vous avez 15 minutes cette semaine ?"`, exercise: "Chronométrez votre processus de souscription. Si c'est plus de 15 minutes client, simplifiez." },
  { category: 'Décision', objection: "Je dois en parler à mon conjoint / associé", technique: 'Impliquer le décideur', response: `"Bien sûr. On peut organiser un appel à trois ? Comme ça je réponds directement à ses questions et vous n'avez pas à tout retransmettre. Quand êtes-vous disponibles tous les deux ?"`, exercise: "Ne laissez jamais un intermédiaire porter votre proposition seul. 80% des décisions se prennent quand vous êtes présent." },
  { category: 'Décision', objection: "Ce n'est pas moi qui décide", technique: 'Accès au décideur', response: `"Je comprends. Qui est la bonne personne pour ce type de décision ? Vous pouvez me la mettre en relation, ou préférez-vous que je vous envoie un support qu'elle pourra consulter ?"`, exercise: "Qualifiez toujours le pouvoir décisionnel en découverte : 'La décision c'est vous seul ou avec quelqu'un ?'" },
  { category: 'Décision', objection: "Je vais demander un autre devis", technique: 'Confiance + suivi', response: `"Absolument, c'est une bonne pratique. Je vous demande juste une chose : quand vous aurez leur devis, envoyez-le moi avant de décider — je vous dis honnêtement si c'est mieux. Si c'est le cas, je vous aide à comprendre pourquoi."`, exercise: "Cette posture de confiance vous repositionne comme conseiller plutôt que vendeur." },
  { category: 'Expérience négative', objection: "Mon dernier assureur n'a pas payé", technique: 'Transparence exclusions', response: `"C'est la pire expérience. Racontez-moi ce qui s'est passé. [Écouter] La plupart des refus sont liés à une exclusion cachée. Ma façon de travailler : avant de signer, on lit ensemble les exclusions importantes. Plus de mauvaises surprises."`, exercise: "Pour chaque contrat, listez les 5 exclusions fréquentes qui causent des litiges. Expliquez-les proactivement." },
  { category: 'Expérience négative', objection: "Les assurances augmentent le prix chaque année", technique: 'Révision annuelle proactive', response: `"C'est vrai que les primes sont indexées chaque année. Mais voici ma valeur ajoutée : à chaque date anniversaire, je benchmark votre contrat. Si vous n'êtes plus dans le meilleur rapport qualité-prix, je vous propose une alternative."`, exercise: "Mettez en place une révision annuelle pour tous vos clients. Un client suivi renouvelle et recommande." },
  { category: 'Spécifique', objection: "Je suis en bonne santé, pas besoin de mutuelle", technique: 'ROI concret', response: `"La mutuelle ne sert pas qu'aux malades. La dernière fois que vous avez changé vos lunettes, ça coûtait combien ? Un couronnement dentaire c'est 800-1200€, la sécu rembourse 70€. Notre mutuelle rembourse jusqu'à [X]€. Sur l'année, les chiffres parlent."`, exercise: "Préparez un calcul type sur 1 an : 1 paire lunettes + 1 soin dentaire + 4 consultations généraliste." },
  { category: 'Spécifique', objection: "Je vais sur un comparateur en ligne", technique: 'Limites des comparateurs', response: `"Très bonne initiative. Mais les comparateurs affichent souvent les contrats les moins chers — qui ont aussi les plus petites garanties. Ils ne peuvent pas prendre en compte votre situation spécifique. Si vous trouvez quelque chose, envoyez-le moi — je l'analyse avec vous."`, exercise: "Faites le tour des 3 principaux comparateurs pour chaque produit. Connaissez leurs limites." },
  { category: 'Spécifique', objection: "Je vais attendre le renouvellement de mon contrat", technique: 'Loi Hamon', response: `"Vous n'avez pas à attendre. Depuis la loi Hamon, vous pouvez changer à tout moment après la première année. Notre assureur envoie lui-même la lettre de résiliation à votre assureur actuel. Vous ne gérez rien."`, exercise: "Maîtrisez parfaitement les lois Hamon, Chatel et Lemoine. Ce sont vos meilleurs arguments de timing." },
  { category: 'Spécifique', objection: "Je préfère aller directement en compagnie", technique: 'Valeur courtier vs direct', response: `"Quand vous allez chez [compagnie X], leur conseiller propose uniquement les produits de [compagnie X]. Moi, je compare 20+ compagnies. Et si dans 2 ans une meilleure offre existe ailleurs, je vous le dis. Un conseiller en compagnie ne le fera jamais."`, exercise: "Calculez pour 3 profils types combien le client économise via courtier vs en direct." },
  { category: 'Spécifique', objection: "Mes revenus sont irréguliers", technique: 'Souplesse contractuelle', response: `"On a des formules adaptées aux indépendants et revenus variables. Vous pouvez ajuster votre couverture chaque année. Certains contrats permettent une suspension temporaire ou réduction des garanties sans résiliation."`, exercise: "Identifiez les contrats de votre portefeuille offrant le plus de souplesse. Ce sont vos produits phares pour indépendants." },
  { category: 'Spécifique', objection: "Je n'ai pas confiance dans le secteur de l'assurance", technique: 'Transparence totale', response: `"Je vous comprends — le secteur a des pratiques très variables. Ma façon de travailler : je vous montre comment je suis rémunéré, je vous explique toutes les exclusions avant signature, et je reste votre interlocuteur après. Jugez sur pièces."`, exercise: "Formalisez votre charte de service en 5 points. C'est un outil de différenciation fort." },
]

// ════════════════════════════════════════════════════════════════
// COMMERCIAL — CALL SCENARIOS
// ════════════════════════════════════════════════════════════════
export const CALL_SCENARIOS = [
  {
    id: 1,
    title: 'Lead entrant — Mutuelle santé',
    difficulty: 'easy',
    description: "Client qui a rempli un formulaire. Il cherche une mutuelle, a un budget et est disponible.",
    tip: "Ce client est déjà motivé. Allez directement à la découverte, proposez vite.",
    exchanges: [
      { from: 'client', text: "Bonjour, j'ai rempli un formulaire sur votre site pour une mutuelle. Je cherche quelque chose de correct, pas trop cher." },
      { from: 'agent_prompt', text: "Présentez-vous brièvement et posez une question de découverte sur sa situation actuelle." },
      { from: 'client', text: "Non je n'ai pas de mutuelle actuellement. Je suis auto-entrepreneur depuis 6 mois." },
      { from: 'agent_prompt', text: "Qualifiez : santé globale, optique/dentaire, budget approximatif." },
      { from: 'client', text: "Je mets des lunettes, et j'ai des soins dentaires à prévoir. Budget entre 40 et 60€ par mois." },
      { from: 'agent_prompt', text: "Présentez la formule adaptée en mettant en avant le ROI concret sur optique + dentaire." },
      { from: 'client', text: "Ça m'a l'air bien. C'est combien exactement pour cette formule ?" },
      { from: 'agent_prompt', text: "Annoncez le prix, puis proposez de finaliser directement avec le closing assumé." },
      { from: 'client', text: "Ok 52€ c'est dans mon budget. Comment on fait pour démarrer ?" },
    ],
  },
  {
    id: 2,
    title: 'Client hésitant — RC Pro',
    difficulty: 'medium',
    description: "Indépendant qui sait qu'il devrait être couvert mais reporte depuis des mois.",
    tip: "Réveillez le risque latent avec un exemple chiffré. Ne débattez pas du prix avant d'avoir créé l'urgence.",
    exchanges: [
      { from: 'client', text: "J'y pense depuis un moment mais je ne suis pas sûr que ça soit vraiment utile pour moi. Je suis juste consultant indépendant." },
      { from: 'agent_prompt', text: "Réveillez le risque. Posez une question sur ce qui se passerait si un client lui reprochait une erreur professionnelle." },
      { from: 'client', text: "Hmm... ça ne m'est jamais arrivé. Mais je vois ce que vous voulez dire." },
      { from: 'agent_prompt', text: "Donnez un exemple concret et chiffré de sinistre RC Pro pour un consultant. Rendez le risque réel." },
      { from: 'client', text: "Ok je comprends le principe. Mais ça va coûter combien ? J'ai pas envie de payer pour quelque chose qui ne servira peut-être jamais." },
      { from: 'agent_prompt', text: "Répondez avec le coût de l'inaction : comparez le prix mensuel au risque financier réel. Décomposez en valeur journalière." },
      { from: 'client', text: "Ouais... 1,50€ par jour pour ne pas risquer de perdre mon entreprise, vu comme ça c'est différent." },
      { from: 'agent_prompt', text: "Momentum favorable ! Proposez le closing maintenant pendant qu'il est convaincu." },
    ],
  },
  {
    id: 3,
    title: 'Objection prix — Assurance auto',
    difficulty: 'hard',
    description: "Client intéressé mais qui bloque sur le prix. Compare avec son assurance actuelle.",
    tip: "Ne baissez jamais le prix sans contrepartie. Proposez alternative ou paiement annuel. Restez ferme sur la valeur.",
    exchanges: [
      { from: 'client', text: "Votre offre m'intéresse mais c'est 20€ de plus que ce que je paye actuellement. Je ne vois pas pourquoi je paierais plus." },
      { from: 'agent_prompt', text: "Ne défendez pas le prix immédiatement. Demandez d'abord ce que couvre son contrat actuel." },
      { from: 'client', text: "Il couvre le tiers, vol et incendie. C'est basique mais ça me suffit." },
      { from: 'agent_prompt', text: "Révélez la lacune : son contrat ne couvre pas l'usage professionnel. Posez une question qui fait réaliser le risque." },
      { from: 'client', text: "Attendez, vous me dites que si j'ai un accident en allant voir un client, mon assurance ne couvre pas ?" },
      { from: 'agent_prompt', text: "Confirmez le risque clairement, puis proposez une alternative légèrement moins chère qui couvre quand même l'usage pro." },
      { from: 'client', text: "Ok je comprends. Mais 20€ de plus c'est quand même beaucoup sur le budget mensuel." },
      { from: 'agent_prompt', text: "Proposez le paiement annuel avec économie, ou décomposez en coût journalier vs coût d'un sinistre non couvert." },
      { from: 'client', text: "Si le paiement annuel me fait économiser 40€... ok c'est acceptable. On peut faire ça ?" },
      { from: 'agent_prompt', text: "Confirmez et fermez immédiatement. Demandez la carte grise et le permis pour préparer le dossier." },
    ],
  },
]

// ════════════════════════════════════════════════════════════════
// COMMERCIAL QUIZ — pool 100 questions + tirage aléatoire
// ════════════════════════════════════════════════════════════════
const QUIZ_POOL = [
  { q: "Quelle est la première étape d'un appel de vente structuré ?", options: ["Annoncer le prix", "Se présenter et créer le lien de confiance", "Proposer le produit directement", "Demander le numéro de carte bancaire"], correct: 1 },
  { q: "La méthode SONCAS — que signifie le S ?", options: ["Satisfaction", "Sécurité", "Service", "Succès"], correct: 1 },
  { q: "Que signifie la méthode CAB en argumentation ?", options: ["Client, Achat, Budget", "Caractéristique, Avantage, Bénéfice", "Contact, Accord, Bilan", "Coût, Analyse, Bénéfice"], correct: 1 },
  { q: "Combien de relances en moyenne avant d'obtenir un rendez-vous ?", options: ["1 fois", "2 fois", "5 à 7 fois", "15 fois"], correct: 2 },
  { q: "La découverte des besoins doit se faire :", options: ["Après la présentation produit", "Avant toute présentation de produit", "Pendant la signature", "Uniquement par email"], correct: 1 },
  { q: "Quelle question ouvre le mieux une phase de découverte ?", options: ["Voulez-vous acheter une assurance ?", "Quelle est votre situation actuelle ?", "Avez-vous beaucoup d'argent ?", "Connaissez-vous nos offres ?"], correct: 1 },
  { q: "Le closing consiste à :", options: ["Terminer la conversation rapidement", "Obtenir l'engagement ferme du client", "Faire une remise de dernière minute", "Présenter les points négatifs"], correct: 1 },
  { q: "Face à 'je rappellerai', la meilleure réponse :", options: ["D'accord, bonne journée", "Proposer deux créneaux précis", "Insister longuement", "Envoyer un email de relance"], correct: 1 },
  { q: "La technique de restructuration du coût consiste à :", options: ["Baisser le prix", "Ramener le coût mensuel à un coût journalier", "Offrir une garantie gratuite", "Proposer un paiement en plusieurs fois"], correct: 1 },
  { q: "Un client dit 'j'ai déjà une assurance'. Vous :", options: ["Raccrochez poliment", "Proposez un audit comparatif gratuit", "Dites que vous êtes moins cher sans vérifier", "Ignorez cette information"], correct: 1 },
  { q: "La règle des 3C en vente signifie :", options: ["Convaincre, Conclure, Célébrer", "Contacter, Comprendre, Conclure", "Calculer, Communiquer, Clore", "Créer, Convertir, Capitaliser"], correct: 1 },
  { q: "Quand un client dit 'c'est trop cher', vous faites EN PREMIER :", options: ["Baisser immédiatement le prix", "Raccrocher et rappeler plus tard", "Comprendre ce qu'il compare", "Insister sur les qualités du produit"], correct: 2 },
  { q: "La découverte doit utiliser principalement :", options: ["Des questions fermées uniquement", "Des questions ouvertes", "Uniquement des affirmations", "Des statistiques de marché"], correct: 1 },
  { q: "La technique de l'écho consiste à :", options: ["Parler plus fort", "Répéter les derniers mots du client pour l'inciter à continuer", "Faire écho à ses objections sans répondre", "Répéter son argumentation deux fois"], correct: 1 },
  { q: "AIDA en marketing signifie :", options: ["Analyser, Informer, Décider, Agir", "Attention, Intérêt, Désir, Action", "Approche, Investigation, Diagnostic, Application", "Accueil, Identification, Démonstration, Accord"], correct: 1 },
  { q: "Durée idéale d'un appel de prospection à froid :", options: ["30 secondes", "5 à 10 minutes", "30 minutes minimum", "1 heure"], correct: 1 },
  { q: "La technique du 'pied dans la porte' consiste à :", options: ["S'imposer physiquement", "Obtenir un petit accord avant d'en demander un grand", "Forcer la signature immédiate", "Appeler sans rendez-vous"], correct: 1 },
  { q: "La meilleure façon de traiter une objection :", options: ["La nier immédiatement", "L'accepter, la clarifier, puis y répondre", "Changer de sujet", "Proposer une remise"], correct: 1 },
  { q: "Un prospect dit 'Envoyez par email'. Vous :", options: ["Envoyez sans rien dire", "Envoyez et rappellez dans 1 mois", "Envoyez un résumé et fixez un rappel rapide", "Refusez et insistez pour parler maintenant"], correct: 2 },
  { q: "A.I.D.A. pour traiter les objections :", options: ["Accepter, Ignorer, Détailler, Argumenter", "Accepter, Isoler, Démontrer, Appeler à l'action", "Analyser, Identifier, Démontrer, Anticiper", "Approuver, Informer, Différencier, Agir"], correct: 1 },
  { q: "Un client dit 'je dois en parler à mon conjoint'. Vous :", options: ["Proposez un appel à trois", "Attendez qu'il rappelle", "Insistez pour une décision maintenant", "Baissez le prix"], correct: 0 },
  { q: "Face à 'je vais voir sur internet', vous répondez :", options: ["Internet est peu fiable", "Bonne idée, comparez et revenez", "Les comparateurs ont des limites précises que j'explique", "Ne vous embêtez pas, prenez ici directement"], correct: 2 },
  { q: "Quand un client dit 'ma banque s'occupe de tout', vous expliquez :", options: ["Que les banques sont peu fiables", "Que les banques proposent uniquement leurs propres produits", "Que les banques coûtent plus cher dans tous les cas", "Rien, vous raccrochez"], correct: 1 },
  { q: "La meilleure façon d'identifier la vraie objection :", options: ["Poser directement : 'Qu'est-ce qui vous bloque vraiment ?'", "Faire semblant de ne pas entendre", "Baisser le prix immédiatement", "Envoyer de la documentation"], correct: 0 },
  { q: "Face à 'je n'ai pas besoin d'assurance', la meilleure approche :", options: ["Accepter et raccrocher", "Argumenter immédiatement sur les avantages", "Poser des questions sur ce qui se passerait si le risque se réalise", "Proposer une formule gratuite"], correct: 2 },
  { q: "Depuis quelle loi peut-on changer d'assurance emprunteur à tout moment ?", options: ["Loi Chatel", "Loi Hamon", "Loi Lemoine", "Loi PACTE"], correct: 2 },
  { q: "La loi Hamon (2015) permet de résilier un contrat auto :", options: ["Seulement à date anniversaire", "À tout moment après 1 an de contrat", "Après 3 ans minimum", "Jamais avant terme"], correct: 1 },
  { q: "Un contrat MRH couvre principalement :", options: ["Uniquement les dommages aux tiers", "Incendie, dégâts des eaux, vol, catastrophes naturelles et RC vie privée", "Uniquement le mobilier", "Uniquement la structure"], correct: 1 },
  { q: "La RC Pro couvre :", options: ["Uniquement les accidents de voiture en mission", "Les dommages causés à des tiers dans le cadre de l'activité professionnelle", "Uniquement les dommages corporels", "Les amendes professionnelles"], correct: 1 },
  { q: "Le tiers payant en mutuelle signifie :", options: ["Que le tiers paye votre assurance", "Vous n'avancez pas les frais chez les partenaires", "Vous payez en 3 fois", "La mutuelle paye 33% des frais"], correct: 1 },
  { q: "La franchise en assurance représente :", options: ["La partie à la charge de l'assureur", "La partie à la charge de l'assuré", "Le montant total de la prime", "Le délai de carence"], correct: 1 },
  { q: "La portabilité de la mutuelle (loi ANI) permet :", options: ["De changer de mutuelle librement", "De conserver sa mutuelle d'entreprise après chômage", "De bénéficier de la mutuelle de son conjoint", "D'accéder aux soins à l'étranger"], correct: 1 },
  { q: "Le délai de carence en assurance santé c'est :", options: ["Le délai de remboursement", "La période après souscription où certaines garanties ne s'appliquent pas", "Le délai pour résilier", "Le délai de franchise optique"], correct: 1 },
  { q: "ORIAS signifie :", options: ["Office de Régulation des Intermédiaires en Assurances et Sécurité", "Organisme pour le Registre des Intermédiaires en Assurance", "Organisation Régionale des Intermédiaires Agréés", "Office de Référencement des Intermédiaires Assureurs"], correct: 1 },
  { q: "La DDA impose notamment :", options: ["Un prix maximum pour les contrats", "L'analyse des besoins et le devoir de conseil avant toute vente", "La gratuité de la souscription", "La vente uniquement en agence physique"], correct: 1 },
  { q: "Le renouvellement ORIAS se fait :", options: ["Tous les 5 ans", "Tous les 3 ans", "Chaque année avant le 31 décembre", "Uniquement sur demande"], correct: 2 },
  { q: "La formation continue annuelle obligatoire :", options: ["5 heures", "10 heures", "15 heures", "20 heures"], correct: 2 },
  { q: "La fiche conseil doit être remise :", options: ["Après la signature et le paiement", "Avant la proposition de tout contrat", "Uniquement pour les contrats de plus de 1000€", "Elle n'est plus obligatoire depuis 2020"], correct: 1 },
  { q: "La lutte anti-blanchiment oblige le courtier à :", options: ["Refuser tout paiement en espèces", "Vérifier l'identité du client et l'origine des fonds pour les opérations sensibles", "Déclarer tous les contrats à Tracfin", "Refuser les clients étrangers"], correct: 1 },
  { q: "En cas de fausse déclaration non intentionnelle :", options: ["Le contrat est nul de plein droit", "L'assureur peut réduire l'indemnité ou résilier", "L'assuré est poursuivi pénalement", "Rien, l'assureur ne peut rien faire"], correct: 1 },
  { q: "Le délai de renonciation pour une assurance vie :", options: ["7 jours calendaires", "30 jours calendaires", "14 jours ouvrés", "60 jours calendaires"], correct: 1 },
  { q: "La subrogation légale de l'assureur :", options: ["L'assureur se substitue à l'assuré pour ses droits contre le responsable", "L'assuré cède son contrat à un tiers", "L'assureur annule le contrat", "Le contrat est transféré à un nouvel assureur"], correct: 0 },
  { q: "Commission moyenne pour une mutuelle santé individuelle :", options: ["2-5%", "8-15%", "20-30%", "Zéro, payé par le client"], correct: 1 },
  { q: "La recommandation client est efficace car :", options: ["Elle est gratuite", "Un prospect recommandé a 3 à 5 fois plus de probabilité de convertir", "Elle ne nécessite aucun effort commercial", "Elle est obligatoire par la loi"], correct: 1 },
  { q: "Le NPS (Net Promoter Score) mesure :", options: ["Le chiffre d'affaires mensuel", "La probabilité qu'un client recommande votre service", "Le taux de résiliation", "La satisfaction après sinistre uniquement"], correct: 1 },
  { q: "L'écoute active implique :", options: ["Parler 80% du temps", "Écouter le client au moins 60-70% du temps", "Poser des questions fermées uniquement", "Prendre des notes sans interagir"], correct: 1 },
  { q: "Un client insatisfait parle de son expérience à :", options: ["1 à 2 personnes", "3 à 5 personnes", "10 à 15 personnes", "Personne"], correct: 2 },
  { q: "La fidélisation coûte :", options: ["Plus cher que l'acquisition", "Le même prix", "5 à 7 fois moins cher qu'acquérir un nouveau client", "Rien, les clients fidèles restent automatiquement"], correct: 2 },
  { q: "Le CRM sert principalement à :", options: ["Calculer les commissions", "Suivre les interactions clients et gérer le pipeline de vente", "Rédiger les contrats automatiquement", "Calculer les primes"], correct: 1 },
  { q: "La technique SPIN signifie :", options: ["Speed, Precision, Innovation, Negotiation", "Situation, Problème, Implication, Need-payoff", "Service, Prix, Information, Negociation", "Standard, Personnalisé, Intensif, Numérique"], correct: 1 },
  { q: "Le principe de réciprocité dit :", options: ["Un client à qui on a rendu service refuse toujours d'acheter", "Un client à qui on a rendu service est naturellement enclin à rendre la pareille", "Il faut toujours rendre service en échange d'un achat", "La réciprocité est illégale en vente d'assurance"], correct: 1 },
  { q: "La social proof en vente consiste à :", options: ["Montrer des posts sur les réseaux sociaux", "Citer des témoignages clients et chiffres de satisfaction", "Avoir une page Instagram active", "Montrer les avis négatifs pour paraître honnête"], correct: 1 },
  { q: "La règle des 80/20 (Pareto) en vente signifie :", options: ["80% des ventes viennent de 80% des clients", "80% du CA provient de 20% des clients", "Il faut travailler 80h par semaine", "20% des produits représentent 80% des marges"], correct: 1 },
  { q: "Qu'est-ce qu'un pipeline de vente ?", options: ["Un outil de plomberie", "L'ensemble des opportunités à différents stades d'avancement", "Le fichier de contacts froids", "La liste des contrats signés"], correct: 1 },
  { q: "Le biais de confirmation signifie que le prospect :", options: ["Confirme toujours sa commande", "Cherche des informations qui confirment ses croyances préexistantes", "Confirme son rendez-vous", "Valide le contrat sans lire"], correct: 1 },
  { q: "La garantie décennale est obligatoire pour :", options: ["Tous les artisans", "Les professionnels de la construction (BTP)", "Les consultants uniquement", "Les médecins libéraux"], correct: 1 },
  { q: "La loi ANI de 2013 a imposé aux entreprises :", options: ["De payer toutes les primes de leurs salariés", "De mettre en place une complémentaire santé collective pour tous les salariés", "De supprimer les mutuelles individuelles", "De cotiser à une retraite supplémentaire obligatoire"], correct: 1 },
  { q: "Qu'est-ce que la valeur agréée ?", options: ["La valeur marchande actuelle", "La valeur fixée à la souscription, sans expertise après sinistre", "La valeur de remplacement à neuf", "La valeur fiscale du bien"], correct: 1 },
  { q: "La garantie indemnités journalières couvre :", options: ["Uniquement les accidents du travail", "Une compensation de revenu en cas d'arrêt pour maladie ou accident", "Les frais d'hospitalisation uniquement", "Le remboursement des médicaments"], correct: 1 },
  { q: "La prescription en assurance dommages est généralement de :", options: ["1 an", "2 ans", "5 ans", "10 ans"], correct: 1 },
  { q: "La bancassurance représente en distribution d'assurance vie en France :", options: ["10%", "20%", "40%", "Plus de 60%"], correct: 3 },
  { q: "La méthode SMART pour les objectifs : le A signifie :", options: ["Ambitieux", "Atteignable", "Analytique", "Automatique"], correct: 1 },
  { q: "Le DIPA doit être remis :", options: ["Après la signature", "Avant la signature, en temps utile", "Seulement sur demande", "Uniquement pour les contrats vie"], correct: 1 },
  { q: "En assurance auto, qu'est-ce que la valeur de remplacement à dire d'expert (VRDE) ?", options: ["Le prix d'achat initial du véhicule", "La valeur vénale du véhicule au moment du sinistre selon un expert", "Le coût de réparation total", "La valeur assurée dans le contrat"], correct: 1 },
  { q: "Un contrat à adhésion obligatoire :", options: ["Est souscrit par l'employeur pour tous ses salariés sans exception", "Est souscrit par plusieurs assureurs ensemble", "Est imposé par l'État", "Ne peut pas être résilié"], correct: 0 },
  { q: "Le principe de rareté en persuasion consiste à :", options: ["Mentir sur la disponibilité", "Souligner légitimement une disponibilité limitée pour créer une urgence", "Refuser de vendre à certains clients", "Proposer uniquement des contrats annuels"], correct: 1 },
  { q: "Combien d'appels de prospection viser par jour en moyenne ?", options: ["5 appels", "10-15 appels", "50 appels", "100 appels"], correct: 1 },
  { q: "Le DIPA signifie :", options: ["Déclaration d'Information sur les Produits d'Assurance", "Document d'Information sur le Produit d'Assurance", "Dossier d'Instruction des Produits Assurés", "Directive Interne sur les Prix d'Assurance"], correct: 1 },
  { q: "L'assurance emprunteur calculée sur capital restant dû signifie :", options: ["Une cotisation fixe pendant toute la durée du prêt", "Une cotisation qui diminue chaque année au fur et à mesure du remboursement", "Une cotisation calculée sur les intérêts uniquement", "Une cotisation annuelle révisable par l'assureur"], correct: 1 },
  { q: "Face à 'mon assureur n'a pas payé mon sinistre', vous :", options: ["Critiquez l'ancien assureur", "Écoutez, validez, puis expliquez que vous lisez ensemble les exclusions avant signature", "Proposez de faire pareil", "Évitez le sujet"], correct: 1 },
  { q: "La technique du miroir (mirroring) consiste à :", options: ["Montrer un miroir au client", "Imiter subtilement le langage et le rythme du client pour créer de la confiance", "Répéter mot pour mot ce que dit le client", "Montrer la même offre à plusieurs clients"], correct: 1 },
  { q: "La loi Lemoine a supprimé le questionnaire de santé pour :", options: ["Tous les emprunteurs sans exception", "Les prêts inférieurs à 200 000€ remboursés avant 60 ans", "Les emprunteurs de moins de 30 ans uniquement", "Les fonctionnaires uniquement"], correct: 1 },
  { q: "Le pic-fin (peak-end rule) signifie que le client :", options: ["Se souvient surtout du moment le plus intense et de la fin de l'interaction", "Achète toujours à la fin de la conversation", "La première impression n'a aucune importance", "Il faut toujours finir sur une remise"], correct: 0 },
  { q: "Qu'est-ce qu'un trigger event en prospection ?", options: ["Un événement négatif chez le prospect", "Un événement déclencheur qui crée le bon moment pour appeler", "La signature du contrat", "Le premier refus d'un client"], correct: 1 },
  { q: "La garantie décès est :", options: ["Facultative", "Obligatoire pour tous les contrats", "Une assurance de personnes", "Une assurance de biens"], correct: 2 },
  { q: "L'assurance IARD couvre :", options: ["Uniquement les personnes", "Incendie, Accidents, Risques Divers", "Investissement, Actions, Risques Diversifiés", "Uniquement les entreprises"], correct: 1 },
  { q: "La subrogation de l'assureur permet de :", options: ["Résilier le contrat", "Se retourner contre le responsable du sinistre", "Augmenter la prime", "Refuser le sinistre"], correct: 1 },
  { q: "Le délai de renonciation pour une assurance vie :", options: ["14 jours", "30 jours", "7 jours", "60 jours"], correct: 1 },
  { q: "La fiche conseil doit être remise :", options: ["Après la signature", "Avant la signature", "30 jours après souscription", "Elle n'est pas obligatoire"], correct: 1 },
  { q: "Le renouvellement ORIAS :", options: ["Tous les 5 ans", "Tous les 3 ans", "Chaque année", "Tous les 2 ans"], correct: 2 },
  { q: "En cas de fausse déclaration intentionnelle :", options: ["Modifié", "Suspendu", "Nul", "Continué normalement"], correct: 2 },
  { q: "La MRH couvre :", options: ["Uniquement l'incendie", "Multi-Risques Habitation complet", "Uniquement le vol", "Uniquement la responsabilité civile"], correct: 1 },
  { q: "La formation continue annuelle :", options: ["5 heures", "10 heures", "15 heures", "20 heures"], correct: 2 },
  { q: "L'analyse des besoins est obligatoire selon :", options: ["Le Code civil", "La directive DDA", "Le Code pénal", "Le règlement RGPD"], correct: 1 },
  { q: "Le devoir de conseil implique :", options: ["Vendre le produit le plus cher", "Proposer le produit le mieux adapté aux besoins du client", "Proposer uniquement les produits de sa compagnie", "Ne pas informer sur les exclusions"], correct: 1 },
  { q: "Un courtier peut exercer :", options: ["Sans aucune assurance", "Avec une RCP uniquement", "Sans inscription ORIAS", "Avec une assurance vie uniquement"], correct: 1 },
  { q: "La durée minimale de la formation IAS1 :", options: ["50 heures", "100 heures", "150 heures", "200 heures"], correct: 2 },
  { q: "ORIAS — quel est son rôle principal ?", options: ["Fixer les tarifs des assurances", "Enregistrer et contrôler les intermédiaires en assurance", "Gérer les sinistres des assurés", "Réguler les compagnies d'assurance"], correct: 1 },
  { q: "Qu'est-ce que la garantie RC vie privée ?", options: ["Couvre les dommages causés à des tiers dans la vie personnelle", "Couvre uniquement les accidents de sport", "Protège contre les litiges professionnels", "Couvre le domicile en cas de cambriolage"], correct: 0 },
  { q: "La cotisation sur le capital initial (banque) vs capital restant dû (courtier) : la différence sur 20 ans est :", options: ["Identique", "Inférieure avec la banque", "Supérieure avec la banque — coût total plus élevé", "Dépend uniquement du taux d'intérêt"], correct: 2 },
  { q: "Pourquoi la présentation du prix APRÈS la découverte des besoins ?", options: ["C'est une obligation légale", "Pour créer l'impatience", "Pour que le client comprenne la valeur avant d'entendre le coût", "Pour gagner du temps"], correct: 2 },
  { q: "La technique de l'urgence légitime consiste à :", options: ["Inventer une fausse promotion", "Souligner un vrai changement de situation ou de tarif à venir", "Forcer la signature en moins de 5 minutes", "Menacer de ne plus rappeler"], correct: 1 },
  { q: "Qu'est-ce que le taux de transformation en prospection ?", options: ["Le pourcentage de clients qui changent d'avis après signature", "Le ratio entre appels passés et contrats signés", "La vitesse de traitement des dossiers", "Le nombre de relances par prospect"], correct: 1 },
  { q: "La garantie perte d'emploi dans un crédit :", options: ["Est obligatoire depuis 2020", "Est facultative et souvent peu intéressante au regard du coût", "Est gratuite si souscrite avec une RC Pro", "Couvre tous types de fins de contrat"], correct: 1 },
  { q: "Un prospect dit 'je vais réfléchir'. Le signe le plus positif est quand il dit ensuite :", options: ["'Rappellez-moi dans 6 mois'", "'Envoyez-moi juste un email'", "'Quel est votre numéro si j'ai des questions ?'", "'Je vais voir avec ma femme'"], correct: 2 },
  { q: "La règle des 48h en closing signifie :", options: ["Il faut signer dans les 48h ou c'est annulé", "L'intérêt d'un prospect chaud diminue significativement après 48h sans relance", "Les documents sont valables 48h maximum", "Il faut rappeler exactement 48h après"], correct: 1 },
  { q: "L'objection la plus difficile à traiter est généralement :", options: ["Le prix", "Le timing", "Le manque de confiance / mauvaise expérience passée", "Le besoin non identifié"], correct: 2 },
  { q: "Combien d'arguments maximum présenter lors d'une argumentation efficace ?", options: ["1 seul argument très fort", "2 à 3 arguments adaptés au profil", "Le maximum possible", "10 arguments pour couvrir tous les cas"], correct: 1 },
]

// Tirage aléatoire de n questions parmi le pool
export function getRandomQuiz(n = 20) {
  const shuffled = [...QUIZ_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

// Export COMMERCIAL_QUIZ pour compatibilité avec les autres pages
export const COMMERCIAL_QUIZ = getRandomQuiz(20)

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
