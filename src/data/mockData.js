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

// ── Demo document state ───────────────────────────────────────
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
  { id: 1, question: "Que signifie ORIAS ?", options: ["Office de Régulation des Intermédiaires en Assurances et Sécurité", "Organisme pour le Registre des Intermédiaires en Assurance", "Organisation Régionale des Intermédiaires", "Office de Référencement des Intermédiaires"], correct: 1 },
  { id: 2, question: "Quelle est la durée minimale de la formation IAS Niveau 1 ?", options: ["50 heures", "100 heures", "150 heures", "200 heures"], correct: 2 },
  { id: 3, question: "Quelle assurance est obligatoire pour un courtier ORIAS ?", options: ["Assurance vie", "Responsabilité Civile Professionnelle", "Assurance habitation", "Assurance auto"], correct: 1 },
  { id: 4, question: "Quel est le seuil minimum de bonnes réponses à l'examen final ?", options: ["40 sur 100", "50 sur 100", "60 sur 100", "70 sur 100"], correct: 1 },
  { id: 5, question: "Qu'est-ce que la directive DDA ?", options: ["Document de divulgation d'assurance", "Directive sur la distribution d'assurance", "Déclaration des droits des assurés", "Dossier de demande d'agrément"], correct: 1 },
  { id: 6, question: "Le renouvellement ORIAS se fait :", options: ["Tous les 5 ans", "Tous les 3 ans", "Chaque année", "Tous les 2 ans"], correct: 2 },
  { id: 7, question: "La formation continue annuelle obligatoire est de :", options: ["5 heures", "10 heures", "15 heures", "20 heures"], correct: 2 },
  { id: 8, question: "Un courtier peut exercer :", options: ["Sans aucune assurance", "Avec une RCP uniquement", "Avec une assurance vie uniquement", "Sans inscription ORIAS"], correct: 1 },
  { id: 9, question: "La fiche conseil doit être remise :", options: ["Après la signature du contrat", "Avant la signature du contrat", "30 jours après la souscription", "Elle n'est pas obligatoire"], correct: 1 },
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
// COMMERCIAL — CALL SCRIPTS
// ════════════════════════════════════════════════════════════════

export const CALL_SCRIPTS = [
  // ── Introduction ─────────────────────────────────────────────
  {
    type: 'Script Introduction',
    variants: [
      {
        name: 'Approche directe (lead entrant)',
        fr: `Bonjour [Prénom du client], c'est [Votre Prénom] du cabinet Oriafen. Je vous appelle suite à votre demande d'information sur nos solutions d'assurance.

J'ai bien votre dossier sous les yeux — vous avez indiqué être intéressé par [produit]. Est-ce que je vous dérange ou vous avez 3 minutes ?

→ SI OUI (pas dérangé) :
Parfait ! Mon objectif aujourd'hui n'est pas de vous vendre quoi que ce soit, mais de comprendre votre situation et voir si on peut vous faire économiser de l'argent tout en étant mieux couvert. Ça vous convient si on commence par quelques questions rapides ?

→ SI NON (mauvais moment) :
Pas de souci du tout. Je peux vous rappeler — vous seriez disponible plutôt en début de matinée ou en fin d'après-midi ? [Proposer deux créneaux précis : "Demain à 10h ou jeudi à 16h ?"]`,
      },
      {
        name: 'Approche réseau / recommandation',
        fr: `Bonjour [Prénom], c'est [Votre Prénom] du cabinet Oriafen à Paris. C'est [Nom du référent] qui m'a transmis votre contact — il m'a dit que vous cherchiez à optimiser votre couverture assurance.

Je ne prends que 2 minutes de votre temps. Est-ce que c'est le bon moment ?

→ SI OUI :
Très bien. [Nom du référent] m'a dit beaucoup de bien de vous. Je vais être direct : mon rôle chez Oriafen c'est de trouver la meilleure solution assurance pour des professionnels comme vous, souvent à un meilleur tarif que ce que vous avez aujourd'hui. Pour voir si je peux vraiment vous aider, j'ai besoin de comprendre votre situation actuelle. Vous êtes actuellement couvert par quelle compagnie ?

→ SI NON (mauvais moment) :
Je comprends parfaitement. Quand est-ce que je pourrais vous rappeler ? Je vais bloquer un créneau pour vous. Mardi matin ou mercredi après-midi, ça vous irait ?`,
      },
      {
        name: 'Approche prospect froid',
        fr: `Bonjour [Prénom], c'est [Votre Prénom], je suis conseiller en assurance au cabinet Oriafen. Je vous appelle car on accompagne des [profil : indépendants / chefs d'entreprise / agents immobiliers...] dans votre région et j'ai pensé que notre service pouvait vous intéresser.

Je serai honnête avec vous : en général nos clients économisent entre 15 et 30% sur leurs contrats d'assurance en passant par nous. Vous avez 2 minutes pour qu'on voit si c'est votre cas ?

→ SI OUI :
Super. Dites-moi — vous êtes actuellement assuré ? Vous avez une ou plusieurs compagnies ?

→ SI NON / PAS INTÉRESSÉ :
Je comprends tout à fait. Est-ce que c'est une question de timing ou plutôt que vous êtes déjà très bien couvert ? [Identifier la vraie raison avant de raccrocher — ça peut débloquer la conversation]`,
      },
    ],
  },

  // ── Découverte ───────────────────────────────────────────────
  {
    type: 'Script Découverte',
    variants: [
      {
        name: 'Découverte standard (5 questions clés)',
        fr: `Pour vous proposer exactement ce dont vous avez besoin, j'ai 5 questions rapides. C'est parti ?

1. SITUATION PERSONNELLE
"Vous êtes salarié, indépendant ou chef d'entreprise ?"
→ Si salarié : "Avez-vous une mutuelle d'entreprise ou vous cotisez à titre personnel ?"
→ Si indépendant/dirigeant : "Depuis combien de temps ? Vous avez une structure juridique ?"

2. COUVERTURE ACTUELLE
"Vous avez actuellement des contrats d'assurance ? Lesquels ?"
→ Si oui : "Vous êtes satisfait ? Vous savez à peu près combien vous payez par mois en tout ?"
→ Si non : "Vous n'avez aucune couverture actuellement — OK, on part de zéro, c'est plus simple."

3. SITUATION FAMILIALE
"Vous avez des personnes à charge — conjoint, enfants ?"
→ Si oui : "Votre conjoint travaille ? Il a sa propre mutuelle ?"

4. BESOINS PRIORITAIRES
"Si vous deviez prioriser, qu'est-ce qui vous inquiète le plus : votre santé, votre bien immobilier, votre véhicule, ou votre responsabilité professionnelle ?"

5. BUDGET
"Sans engagement, vous avez une idée du budget que vous pourriez consacrer à votre protection mensuelle ?"
→ Reformuler : "Si on peut vous couvrir correctement pour moins que ce que vous payez aujourd'hui, c'est une bonne nouvelle non ?"`,
      },
      {
        name: 'Découverte approfondie (prospect indécis)',
        fr: `Je vais vous poser quelques questions pour vraiment comprendre votre situation — c'est important pour moi de ne pas vous proposer quelque chose qui ne vous correspond pas.

HISTORIQUE ASSURANCE
"Vous avez déjà eu des expériences avec d'autres courtiers ou directement avec des compagnies ?"
→ Si mauvaise expérience : "Qu'est-ce qui s'est passé exactement ? [Écouter activement — c'est votre opportunité de vous différencier]"

VIE PROFESSIONNELLE
"Parlez-moi de votre activité. Vous travaillez depuis chez vous, vous vous déplacez chez des clients ?"
→ Note : Un professionnel mobile a des besoins très différents d'un sédentaire.

PERCEPTION DU RISQUE
"Dans votre métier, qu'est-ce qui vous ferait le plus de tort si ça arrivait — un pépin de santé, un problème avec un client, un accident ?"
→ Cette question révèle ce qui l'inquiète vraiment.

SITUATION FINANCIÈRE (indirecte)
"Vous avez un crédit immobilier en cours ? [Si oui] : Est-ce que l'assurance emprunteur a été négociée ou prise directement à la banque ?"
→ Souvent énorme opportunité d'économie sur l'assurance emprunteur.

DÉCISION
"En général, quand vous prenez une décision comme ça, vous décidez seul ou vous en parlez avec quelqu'un ?"
→ Identifier si un tiers est impliqué avant de faire votre offre.`,
      },
    ],
  },

  // ── Argumentation ────────────────────────────────────────────
  {
    type: 'Script Argumentation',
    variants: [
      {
        name: "Structure CAB (Caractéristique / Avantage / Bénéfice)",
        fr: `Basé sur ce que vous venez de me dire, voici ce que je vous recommande et pourquoi.

CARACTÉRISTIQUE → AVANTAGE → BÉNÉFICE CLIENT

Exemple Mutuelle Santé :
"Notre formule [Nom] inclut un remboursement à 200% du tarif sécu pour les soins dentaires et optiques [Caractéristique] — ce qui veut dire que vous n'avez quasiment plus rien à payer de votre poche [Avantage] — et pour vous qui m'avez dit que vous avez des frais d'optique réguliers, ça représente une économie réelle d'environ [X]€ par an [Bénéfice personnalisé]."

Exemple RC Pro :
"La garantie couvre les dommages causés à vos clients jusqu'à 1,5 million d'euros [Caractéristique] — en cas de litige, c'est notre assureur qui prend en charge tous les frais de défense [Avantage] — pour vous qui travaillez en prestation de service, c'est la tranquillité d'esprit de savoir qu'une erreur ne peut pas mettre en danger votre entreprise [Bénéfice]."

APRÈS L'ARGUMENTATION — Vérifier l'adhésion :
"Est-ce que ça répond bien à ce que vous cherchiez ? Est-ce qu'il y a un point sur lequel vous voulez qu'on revienne ?"

→ SI OUI, adhésion : Passer au closing.
→ SI OBJECTION : Traiter l'objection puis reprendre la question de vérification.`,
      },
    ],
  },

  // ── Closing ──────────────────────────────────────────────────
  {
    type: 'Script Closing',
    variants: [
      {
        name: 'Closing assumé (client chaud)',
        fr: `Bien, je pense qu'on a fait le tour. Sur la base de ce qu'on a vu ensemble, la formule [Nom] à [X]€ par mois est vraiment la plus adaptée à votre situation.

Pour démarrer, j'ai besoin de deux choses de votre part :
1. Votre email pour vous envoyer les documents à compléter
2. Une date d'effet — vous préférez le 1er du mois prochain ou on peut faire courir le contrat dès maintenant ?

→ SI CLIENT CONFIRME :
Parfait. Je vous envoie le dossier dans les 5 prochaines minutes. Vous le recevrez sur [email], c'est bien ça ? Il suffit de signer électroniquement, ça prend 3 minutes maximum.

→ SI CLIENT HÉSITE :
"Qu'est-ce qui vous empêche de démarrer aujourd'hui ? [Écouter sans interrompre] Est-ce que c'est une question de budget, de timing, ou est-ce qu'il manque une information pour vous décider ?"`,
      },
      {
        name: 'Closing doux (client tiède)',
        fr: `Je ne veux pas vous brusquer. Voilà ce que je vous propose :

Je vous envoie un récapitulatif complet par email — le détail des garanties, le tarif, et une comparaison avec ce que vous avez actuellement. Comme ça vous avez tout sous les yeux pour décider tranquillement.

Et je vous rappelle [dans 2 jours / vendredi matin] pour répondre à vos dernières questions. Ça vous convient ?

→ SI OUI : "Votre email c'est bien [email] ? Parfait. Vous le recevrez d'ici ce soir. [Mettre un rappel immédiatement dans le CRM]"

→ SI "Je verrai" sans engagement : "Je veux être sûr de ne pas vous oublier. Je vous propose vendredi à [heure précise] — vous êtes disponible ?"

NOTE IMPORTANT : Ne jamais raccrocher sans avoir une action concrète : soit une signature, soit une date de rappel précise.`,
      },
      {
        name: 'Closing après objection prix',
        fr: `Je vous entends sur le budget. Voilà ce qu'on peut faire.

Option 1 — Formule allégée :
"On retire la garantie [X] qui ne correspond pas à votre usage, et on arrive à [Y]€ par mois. Vous gardez l'essentiel."

Option 2 — Paiement annuel :
"Si vous optez pour le paiement annuel, vous économisez [Z]€ sur l'année. Ça revient à [montant mensuel équivalent] par mois — c'est plus accessible."

Option 3 — Valeur vs coût :
"Regardons les choses autrement : [X]€ par mois, c'est [X/30]€ par jour. En échange, vous dormez tranquille sachant que si [risque principal identifié en découverte] arrive, vous êtes couvert. Est-ce que ça vaut ce prix pour vous ?"

→ SI TOUJOURS BLOQUÉ SUR LE PRIX : "Quel serait le budget qui vous conviendrait ? [Écouter sans juger] D'accord, voyons ce qu'on peut faire dans cette enveloppe."`,
      },
    ],
  },

  // ── Relance ──────────────────────────────────────────────────
  {
    type: 'Script Relance',
    variants: [
      {
        name: 'Relance J+2 (pas de réponse)',
        fr: `Bonjour [Prénom], c'est [Votre Prénom] d'Oriafen. On s'est parlé [lundi/mardi], je vous avais envoyé un récapitulatif de notre offre.

Je voulais juste m'assurer que vous l'aviez bien reçu et voir si vous aviez des questions.

→ SI LU MAIS PAS RÉPONDU :
"Qu'est-ce qui vous a arrêté ? Est-ce que quelque chose dans la proposition n'était pas clair ?"

→ SI PAS LU :
"Pas de souci. Je vous le renvoie maintenant. Vous pouvez y jeter un œil dans la journée ? Je vous rappelle demain à [heure]."

→ SI REFUS DÉFINITIF :
"Je comprends tout à fait. Puis-je vous demander ce qui vous a fait décider autrement ? C'est pour m'améliorer." [Ces informations sont précieuses pour affiner votre approche]`,
      },
      {
        name: 'Relance J+7 (devis envoyé, silence)',
        fr: `Bonjour [Prénom], c'est [Votre Prénom] d'Oriafen. Je reviens vers vous car je vous avais fait parvenir une proposition la semaine dernière et je n'ai pas eu de nouvelles.

Je ne veux pas vous harceler — si vous avez trouvé une meilleure solution ailleurs, dites-le moi franchement, je comprends.

Mais s'il reste un doute ou une question, c'est exactement le moment d'en parler. Qu'est-ce qui s'est passé depuis notre dernier échange ?

→ ÉCOUTER ACTIVEMENT. Ne pas parler pendant au moins 15 secondes après la question.

→ SI "J'ai été occupé" : "Pas de problème. On reprend où on en était — votre principale priorité c'était [rappeler son besoin]. La proposition tient toujours. On peut finaliser maintenant ?"`,
      },
    ],
  },
]

// ════════════════════════════════════════════════════════════════
// COMMERCIAL — PRODUCT SCRIPTS (longs, avec flow et objections)
// ════════════════════════════════════════════════════════════════

export const PRODUCT_SCRIPTS = [
  {
    product: 'Mutuelle Santé',
    tagline: 'Le produit le plus vendu — fort potentiel upsell',
    intro: `"Vous avez actuellement une mutuelle ? [Si non] Alors vous payez 100% de vos frais médicaux de votre poche — c'est souvent plusieurs centaines d'euros par an que vous pourriez récupérer. [Si oui] Vous savez ce qu'elle vous rembourse exactement sur les lunettes et les soins dentaires ?"`,
    script: `PRÉSENTATION :
"Notre complémentaire santé [Nom formule] couvre jusqu'à 200% du tarif de base sécu sur les soins courants, 300% sur les soins dentaires complexes, et inclut un forfait optique de [X]€ par an.

Ce qui fait vraiment la différence par rapport aux mutuelles classiques :
— Réseau de soins partenaires : des milliers de médecins et dentaires qui pratiquent le tiers payant intégral. Vous ne sortez rien de votre poche.
— Remboursement en 48h sur votre compte
— Téléconsultation médicale incluse, 7j/7, accessible depuis votre téléphone

Pour vous concrètement, sur la base de ce que vous m'avez dit : si vous dépensez [X]€/an en santé, vous récupéreriez [estimation] — ce qui veut dire que le contrat vous coûte réellement [prix net après remboursements]."

OBJECTIONS FRÉQUENTES :

Objection 1 : "C'est trop cher par rapport à ma mutuelle actuelle"
→ "Vous savez exactement ce que votre mutuelle actuelle vous rembourse sur les lunettes ? La plupart des gens me disent 150-200€. Nous c'est [X]€. Si vous dépensez [montant] en optique chaque 2 ans, on rentabilise la différence de prime en [durée]. On fait le calcul ensemble ?"

Objection 2 : "J'ai déjà la mutuelle de mon entreprise"
→ "Super, ça couvre le salarié. Mais votre famille ? Si votre conjoint ou vos enfants ne sont pas couverts à 100%, vous payez le reste de votre poche. Vous avez des enfants chez le dentiste régulièrement ? [Si oui] Notre formule famille vous coûte [X]€ de plus par mois et couvre toute votre famille — ça s'autofinance souvent dès le premier trimestre."

Objection 3 : "Je suis jeune, je ne suis jamais malade"
→ "Justement ! Souscrite jeune, la prime est beaucoup plus faible et elle ne bougera pas significativement. Vous êtes déjà allé chez l'ophtalmo ? Les lunettes correctrices c'est [X]€ en moyenne. Avec notre forfait, vous payez [Y]€. La différence finance la moitié de votre cotisation annuelle."

CLOSING :
"Sur la base de votre profil, je vous recommande la formule [X] à [Y]€/mois. Ça couvre tout ce dont on a parlé. Pour activer le contrat, j'ai juste besoin de votre RIB et d'une pièce d'identité. Je vous envoie le lien de souscription maintenant ?"`,
  },
  {
    product: 'RC Pro / Décennale',
    tagline: 'Obligatoire pour les indépendants — vente facile si bien expliquée',
    intro: `"Vous exercez en tant qu'indépendant / dirigeant ? Alors vous êtes personnellement responsable de tout dommage causé dans le cadre de votre activité. Sans RC Pro, c'est votre patrimoine personnel qui est en jeu — votre voiture, votre épargne, votre appartement."`,
    script: `PRÉSENTATION :
"La RC Pro qu'on propose couvre :
— Les dommages corporels, matériels et immatériels causés à vos clients ou tiers
— Les frais de défense juridique en cas de litige
— La protection des données et la responsabilité cyber (de plus en plus important)
— Les erreurs professionnelles — même si vous n'avez pas fait de faute intentionnelle

Exemple concret : vous êtes consultant, vous livrez une analyse à un client qui prend une mauvaise décision basée dessus et perd 50 000€. Sans RC Pro, il peut se retourner contre vous personnellement. Avec elle, notre assureur prend en charge sa réclamation et vos frais d'avocat.

Le coût : à partir de [X]€/mois selon votre activité et votre chiffre d'affaires."

OBJECTIONS FRÉQUENTES :

Objection 1 : "Ma micro-entreprise ne fait pas assez de CA pour avoir besoin de ça"
→ "La responsabilité professionnelle n'est pas proportionnelle au CA. Un consultant qui facture 2 000€/mois peut causer un préjudice de 100 000€ à un client. Et en France, même les auto-entrepreneurs peuvent être poursuivis personnellement. La bonne question c'est : est-ce que vous pouvez vous permettre de perdre un procès ?"

Objection 2 : "Mon client ne m'a jamais demandé de RC Pro"
→ "Pas encore. Mais les grands groupes et les administrations publiques l'exigent systématiquement depuis 2020. Et même sans qu'on vous le demande, si vous causez un dommage, vous êtes responsable. Attendez-vous qu'un problème arrive avant de vous couvrir ?"

Objection 3 : "J'ai déjà souscrit une RC chez [compagnie]"
→ "Super. Vous savez à quelle hauteur vous êtes couvert ? Beaucoup de contrats RC de base excluent les dommages immatériels — c'est-à-dire les pertes financières causées à un client. C'est pourtant le risque numéro 1 pour un prestataire de service. Je peux regarder votre contrat actuel avec vous ?"

CLOSING :
"Pour votre activité de [métier], je vous recommande la formule [X] avec une couverture jusqu'à [montant]. La prime est de [Y]€/mois, déductible à 100% de vos charges professionnelles. Je vous prépare le devis maintenant ?"`,
  },
  {
    product: 'Assurance Auto Pro',
    tagline: 'Véhicule d\'entreprise ou usage professionnel — fort panier moyen',
    intro: `"Vous utilisez votre voiture pour votre activité professionnelle ? Rendez-vous clients, livraisons, déplacements ? Alors sachez qu'un contrat auto classique ne couvre pas les accidents en usage professionnel. Si vous êtes en déplacement pro et que vous avez un accident, votre assureur peut refuser d'indemniser."`,
    script: `PRÉSENTATION :
"Notre assurance auto professionnelle couvre :
— L'usage professionnel et personnel, 24h/24 — un seul contrat pour tout
— Assistance 0 km : en panne devant chez vous, on vient quand même
— Véhicule de remplacement immédiat en cas de sinistre (même catégorie)
— Protection du conducteur jusqu'à [X]€ d'indemnisation corporelle
— Pas de franchise en cas d'accident responsable avec un tiers identifié

Pour un véhicule de [type] avec votre profil, on est à [X]€/mois tout compris."

OBJECTIONS FRÉQUENTES :

Objection 1 : "Mon assurance actuelle me suffit"
→ "Vous avez vérifié qu'elle couvre l'usage professionnel ? C'est souvent une clause cachée dans les conditions générales. Je vous propose qu'on vérifie ensemble — si vous êtes bien couvert, parfait. Mais si ce n'est pas le cas, c'est une faille que vous voulez corriger avant d'avoir un sinistre."

Objection 2 : "C'est plus cher que ce que je paye"
→ "À première vue oui. Mais si on retire votre franchise actuelle, et qu'on ajoute la valeur du véhicule de remplacement immédiat — combien ça vous coûterait de louer une voiture pendant 15 jours si la vôtre est au garage ? [X]€ au moins. Notre offre absorbe ce risque. Sur l'année, le bilan est souvent en votre faveur."

Objection 3 : "J'ai un malus"
→ "On travaille avec des assureurs spécialisés dans les profils malussés. On peut trouver une solution. Votre coefficient actuel c'est combien ? [X] — d'accord, je fais tourner nos comparateurs et je reviens vers vous avec une offre dans 24h."

CLOSING :
"Je vous fais la proposition complète avec 3 niveaux de garanties — vous choisissez ce qui vous convient. J'ai besoin de votre carte grise, votre permis et votre relevé d'informations (votre assureur actuel est obligé de vous le fournir gratuitement en 24h). On part là-dessus ?"`,
  },
  {
    product: 'Multirisque Habitation (MRH)',
    tagline: 'Propriétaires et locataires — assurance obligatoire pour les locataires',
    intro: `"Vous êtes locataire ou propriétaire ? [Locataire] L'assurance habitation est obligatoire pour les locataires — votre bailleur peut résilier votre bail si vous n'en avez pas. [Propriétaire] Est-ce que votre MRH couvre bien la valeur à neuf de votre mobilier et vos équipements ?"`,
    script: `PRÉSENTATION :
"Notre MRH couvre :
— Incendie, dégât des eaux, vol, vandalisme, catastrophes naturelles
— Responsabilité civile vie privée : si votre enfant casse une vitre chez le voisin, on prend en charge
— Valeur à neuf sur le mobilier pendant les 5 premières années
— Protection juridique incluse : litiges avec le bailleur, le syndic, les voisins
— Assistance 24h/24 : serrurier, plombier, électricien en urgence sans avance de frais

Pour un appartement de [X] m² en [ville], la prime est de [Y]€/mois."

OBJECTIONS FRÉQUENTES :

Objection 1 : "Je suis déjà assuré via ma banque"
→ "Les assurances bancaires sont souvent pratiques mais elles ont des plafonds de remboursement bas. Par exemple, sur le vol d'objets de valeur, beaucoup plafonnent à 1 500€. Si vous avez un ordinateur, un vélo de qualité ou des bijoux, vous n'êtes pas vraiment couvert. Vous connaissez vos plafonds actuels ?"

Objection 2 : "C'est quoi la différence avec ce que j'ai ?"
→ "Envoyez-moi votre attestation actuelle par email — je fais une comparaison garantie par garantie et je vous montre les différences en noir sur blanc. Comme ça vous décidez en connaissance de cause."

Objection 3 : "J'habite en colocation, j'ai pas besoin"
→ "En colocation, chaque colocataire est en principe responsable de ses propres dommages. Si c'est vous qui laissez couler un robinet et que ça inonde l'appartement d'en dessous, c'est vous personnellement qui payez. Une MRH à [X]€/mois vous couvre entièrement."

CLOSING :
"Pour votre logement de [X] m², je vous recommande la formule [Y] à [Z]€/mois. Elle est résiliable à tout moment. Pour activer, j'ai besoin de votre adresse complète, la surface du logement et votre date d'entrée. On peut le faire maintenant en 5 minutes ?"`,
  },
  {
    product: 'Assurance Emprunteur',
    tagline: 'Énorme économie potentielle — souvent 2x moins cher que la banque',
    intro: `"Vous avez un crédit immobilier en cours ? Vous savez que depuis la loi Lemoine 2022, vous pouvez changer d'assurance emprunteur à tout moment, sans frais, et sans justification — même si votre prêt date de 10 ans ? La plupart des gens économisent entre 5 000€ et 20 000€ sur la durée de leur crédit en changeant."`,
    script: `PRÉSENTATION :
"L'assurance emprunteur de votre banque est calculée sur le capital initial. La nôtre est calculée sur le capital restant dû — ce qui veut dire que votre prime diminue chaque année au fur et à mesure que vous remboursez.

Sur un crédit de [montant] sur [durée] ans, la différence peut représenter [X]€ d'économie totale. C'est souvent une ligne budgétaire que les gens oublient complètement.

On prend en charge 100% des démarches de résiliation et de transfert. Vous signez un mandat, on s'occupe de tout avec votre banque."

OBJECTIONS FRÉQUENTES :

Objection 1 : "Ma banque va mal le prendre"
→ "Votre banque ne peut pas refuser. C'est la loi. Depuis la loi Lemoine, elle a l'obligation d'accepter un contrat externe équivalent. Elle peut demander un délai de réponse de 10 jours ouvrés, c'est tout. On gère ça avec vous."

Objection 2 : "J'ai des problèmes de santé, on va me refuser"
→ "La loi Lemoine a aussi supprimé le questionnaire de santé pour les prêts inférieurs à 200 000€ remboursés avant 60 ans. Pour les montants plus élevés, on a des assureurs spécialisés dans les risques aggravés. Dites-moi votre situation et je vous dis ce qu'on peut faire."

Objection 3 : "Je n'ai pas le temps de m'en occuper"
→ "C'est précisément pour ça que je suis là. Vous me donnez une procuration, je gère tout. Votre seule action c'est de signer les documents que je vous envoie par email. Ça prend 20 minutes de votre côté en tout."

CLOSING :
"Pour commencer, j'ai besoin de votre tableau d'amortissement (votre banque vous l'envoie gratuitement par email) et votre contrat d'assurance actuel. Je vous fais un devis comparatif sous 48h. Votre email c'est [email] ?"`,
  },
]

// ════════════════════════════════════════════════════════════════
// COMMERCIAL — OBJECTIONS (30+)
// ════════════════════════════════════════════════════════════════

export const OBJECTIONS = [
  // PRIX ────────────────────────────────────────────────────────
  {
    category: 'Prix',
    objection: "C'est trop cher",
    technique: 'Restructuration du coût en valeur journalière',
    response: `"Je comprends. Mais regardons ensemble ce que ça représente vraiment : [X]€/mois, c'est [X/30]€ par jour — le prix d'un café. En échange, vous êtes couvert pour [avantage principal]. Mais la vraie question c'est : qu'est-ce que ça vous coûterait si le risque se réalise sans couverture ?"`,
    exercise: "Calculez le coût journalier de 3 de vos offres et préparez une comparaison avec une dépense quotidienne banale (café, transport, cigarettes). Entraînez-vous à l'annoncer naturellement.",
  },
  {
    category: 'Prix',
    objection: "Votre concurrent est moins cher",
    technique: 'Comparaison qualitative — pas de guerre de prix',
    response: `"C'est possible. Est-ce que vous avez comparé les mêmes garanties ? Souvent la différence de prix s'explique par des plafonds plus bas, des exclusions supplémentaires ou une franchise plus élevée. Je vous propose qu'on mette les deux offres côte à côte. Si après comparaison votre offre est vraiment meilleure, je vous le dirai franchement."`,
    exercise: "Préparez un tableau de comparaison pour vos 3 concurrents principaux. Identifiez les points sur lesquels vous gagnez systématiquement.",
  },
  {
    category: 'Prix',
    objection: "Je ne peux pas me permettre ça en ce moment",
    technique: 'Empathie + alternative budgétaire',
    response: `"Je vous entends. Qu'est-ce qui se passe en ce moment, si ce n'est pas indiscret ? [Écouter] D'accord. Est-ce que c'est une question de timing — dans 2 ou 3 mois ce serait plus simple — ou c'est structurel ? Si c'est du timing, je peux faire démarrer le contrat au [date future] et vous envoyer tous les documents maintenant pour ne pas avoir à y revenir."`,
    exercise: "Préparez toujours une version allégée de chaque offre à 20-30% moins cher. Mieux vaut vendre une formule basique que de ne rien vendre.",
  },
  {
    category: 'Prix',
    objection: "J'ai un budget limité de X€ par mois",
    technique: 'Adaptation de l\'offre au budget déclaré',
    response: `"Très bien, on travaille avec [X]€. Dans cette enveloppe, voici ce que je peux vous proposer : [formule adaptée]. Vous ne couvrez pas tout, mais vous couvrez le risque principal — [risque n°1 identifié en découverte]. C'est mieux que rien, et on pourra augmenter la couverture quand votre situation évolue."`,
    exercise: "Construisez une gamme de 3 niveaux de couverture pour chaque produit : essentiel, standard, premium. Soyez capable de les présenter en moins de 60 secondes chacun.",
  },

  // TIMING ─────────────────────────────────────────────────────
  {
    category: 'Timing',
    objection: "Je dois réfléchir",
    technique: 'Clarification des freins réels',
    response: `"Bien sûr. Pour vous aider à réfléchir dans la bonne direction, qu'est-ce qui vous fait hésiter ? C'est le prix ? Une garantie qui ne vous convient pas ? Un doute sur la fiabilité de l'assureur ? Si vous me dites sur quoi porte votre réflexion, je peux peut-être lever le doute maintenant."`,
    exercise: "Listez les 5 vraies raisons cachées derrière 'je dois réfléchir' et préparez une réponse pour chacune. Souvent c'est : prix, besoin de valider avec le conjoint, manque de confiance, pas convaincu de l'utilité.",
  },
  {
    category: 'Timing',
    objection: "Rappelez-moi dans 3 mois",
    technique: 'Ancrage d\'un intérêt et d\'une date précise',
    response: `"Je note. Mais pour être sûr de vous rappeler au bon moment — qu'est-ce qui va changer dans 3 mois ? Si c'est une question budgétaire, on peut anticiper. Si c'est autre chose, dites-moi et je comprends mieux."`,
    exercise: "Ne jamais accepter un 'rappellez dans X mois' sans comprendre pourquoi. Cette information est cruciale pour qualifier le prospect.",
  },
  {
    category: 'Timing',
    objection: "Je n'ai pas le temps là",
    technique: 'Mini-engagement de 3 minutes',
    response: `"Je vous respecte. Il me faut exactement 3 minutes pour vous montrer un chiffre qui pourrait vous surprendre. Si après 3 minutes ça ne vous intéresse pas, je ne vous rappelle plus. Vous avez 3 minutes ?"`,
    exercise: "Chronométrez-vous. Préparez un pitch de 2m30 qui inclut : une question de qualification, un chiffre d'économie potentielle, et une question de closing. Entraînez-vous jusqu'à ce que ce soit fluide.",
  },
  {
    category: 'Timing',
    objection: "Je rappellerai",
    technique: 'Ancrage du prochain contact — prendre l\'initiative',
    response: `"Je préfère que ce soit moi qui rappelle — comme ça vous n'avez rien à gérer de votre côté. Je vous propose [jour] à [heure] ou [autre jour] à [autre heure]. Lequel vous convient le mieux ?"`,
    exercise: "Proposez toujours deux créneaux précis. Jamais 'quand vous voulez'. Le prospect qui choisit lui-même un créneau se sent engagé à décrocher.",
  },
  {
    category: 'Timing',
    objection: "Ce n'est pas le bon moment de l'année",
    technique: 'Résiliation à tout moment — avantage légal',
    response: `"Bonne nouvelle : depuis la loi Hamon et la loi Chatel, vous pouvez souscrire un nouveau contrat à n'importe quel moment de l'année — c'est notre assureur qui se charge de résilier votre ancienne couverture à la date anniversaire. Donc il n'y a pas de mauvais moment."`,
    exercise: "Maîtrisez les délais légaux de résiliation pour les 5 principales catégories de produits. C'est un argument rassurant très efficace.",
  },

  // CONFIANCE ──────────────────────────────────────────────────
  {
    category: 'Confiance',
    objection: "Je ne connais pas Oriafen",
    technique: 'Preuve sociale + légitimité ORIAS',
    response: `"Tout à fait normal, on est un cabinet spécialisé, pas une compagnie nationale. Mais les contrats qu'on propose sont ceux de compagnies que vous connaissez : [noms]. Notre valeur ajoutée c'est de vous trouver la meilleure offre parmi 20+ assureurs sans que vous ayez à faire le tour vous-même. Nous sommes immatriculés ORIAS — c'est le registre officiel des courtiers en France. Vous pouvez vérifier notre numéro sur le site orias.fr."`,
    exercise: "Apprenez par cœur votre numéro ORIAS et les 5 compagnies partenaires principales. La transparence sur votre légitimité renforce la confiance immédiatement.",
  },
  {
    category: 'Confiance',
    objection: "J'ai eu de mauvaises expériences avec les courtiers",
    technique: 'Validation + différenciation concrète',
    response: `"Je vous crois. Le secteur a malheureusement ses brebis galeuses. Racontez-moi ce qui s'est passé — pas pour me défendre, mais pour comprendre ce que je dois éviter avec vous. [Écouter] Ce que vous décrivez c'est [résumer]. Chez nous, voici comment on fonctionne différemment : [point concret]. Est-ce que ça rassure un minimum ?"`,
    exercise: "Transformez les 3 mauvaises pratiques les plus courantes en secteur en 3 engagements différenciants concrets pour votre cabinet.",
  },
  {
    category: 'Confiance',
    objection: "Est-ce que je peux voir un contrat avant de décider ?",
    technique: 'Oui systématique + guidage actif',
    response: `"Absolument, et je vous encourage à le lire attentivement. Je vous envoie les conditions générales et particulières maintenant. Je vous propose qu'on en fasse une lecture guidée ensemble — 20 minutes au téléphone ou en vidéo — comme ça je peux vous expliquer les clauses importantes et vous éviter les mauvaises surprises. On fait ça quand ?"`,
    exercise: "Préparez un guide de lecture de 1 page pour vos 3 produits phares. Soulignez les garanties clés, les exclusions importantes, et les conditions de résiliation.",
  },
  {
    category: 'Confiance',
    objection: "Comment je sais que vous ne disparaissez pas après la vente ?",
    technique: 'Engagement de suivi concret',
    response: `"Bonne question. Voici ce qui se passe après la signature : vous recevez mes coordonnées directes — téléphone et email. Je vous appelle 30 jours après la souscription pour m'assurer que tout est en ordre. Et si vous avez un sinistre, c'est moi qui coordonne le dossier avec l'assureur. Vous ne gérez jamais seul."`,
    exercise: "Mettez en place un processus de suivi post-vente : appel J+30, email à l'anniversaire du contrat, contact proactif si l'assureur change ses conditions.",
  },

  // BESOIN ─────────────────────────────────────────────────────
  {
    category: 'Besoin',
    objection: "Je n'en ai pas besoin",
    technique: 'Réveil du risque latent par questions',
    response: `"Dites-moi — si demain vous avez un gros problème de santé et que vous êtes arrêté 6 mois, qu'est-ce qui se passe financièrement ? Et si un client vous attaque en justice ? [Pause] La plupart des gens se croient à l'abri jusqu'au jour où le risque se concrétise. Mon rôle c'est de m'assurer que vous n'êtes pas dans ce cas."`,
    exercise: "Pour chaque produit, préparez 3 scénarios de sinistres réels (vous pouvez utiliser des cas anonymisés). Un sinistre concret vaut 10 arguments théoriques.",
  },
  {
    category: 'Besoin',
    objection: "J'ai déjà une assurance",
    technique: 'Audit comparatif gratuit',
    response: `"Super. Ça me facilite la tâche. Est-ce que vous savez exactement ce que votre contrat couvre et ne couvre pas ? La plupart de mes clients qui me disent ça découvrent en faisant l'audit qu'ils ont des lacunes ou qu'ils paient trop cher pour leur niveau de garanties. L'audit est gratuit et sans engagement — ça vous prend 15 minutes. On le fait ?"`,
    exercise: "Préparez 5 questions d'audit courtes qui révèlent systématiquement une lacune de couverture. Par exemple : 'Votre contrat couvre-t-il les dommages immatériels chez un client ?' — la majorité des contrats standard ne le font pas.",
  },
  {
    category: 'Besoin',
    objection: "Ma banque s'occupe de tout",
    technique: 'Limite des offres bancaires + indépendance du courtier',
    response: `"Votre banque ne propose que ses propres produits — elle ne peut pas comparer le marché pour vous. Un courtier comme moi compare 20+ compagnies et sélectionne la meilleure offre pour votre profil spécifique. Et la plupart du temps, le prix est plus bas et les garanties meilleures. C'est littéralement pour ça que les courtiers existent."`,
    exercise: "Connaissez les produits d'assurance des 5 principales banques françaises et préparez une comparaison sur 3 critères clés pour chaque produit que vous vendez.",
  },
  {
    category: 'Besoin',
    objection: "Je règle ça plus tard, j'ai d'autres priorités",
    technique: 'Coût de l\'inaction',
    response: `"Je comprends. Mais sachez que plus on attend, plus la prime augmente — surtout pour la santé et la prévoyance. À [âge du prospect + 5 ans], la même couverture coûtera [X]% plus cher. Et si un problème de santé survient entre temps, vous pourriez ne plus être assurable aux mêmes conditions. Qu'est-ce qui vient avant ça dans vos priorités ?"`,
    exercise: "Pour chaque produit, calculez l'augmentation de prime entre 30, 40 et 50 ans. Ce chiffre concret transforme 'plus tard' en 'maintenant'.",
  },
  {
    category: 'Besoin',
    objection: "Je suis bien couvert via mon statut de fonctionnaire / salarié",
    technique: 'Identification des lacunes du régime général',
    response: `"La couverture de base est souvent suffisante pour les soins courants. Mais avez-vous vérifié vos plafonds de remboursement dentaire et optique ? Et votre prévoyance en cas d'arrêt long terme — savez-vous combien vous toucheriez par mois si vous étiez en arrêt maladie pendant 6 mois ?"`,
    exercise: "Apprenez les niveaux de remboursement du régime général pour les soins courants, optique, dentaire, et les IJ en cas d'arrêt maladie. C'est la base pour montrer les lacunes.",
  },

  // PROCRASTINATION ────────────────────────────────────────────
  {
    category: 'Procrastination',
    objection: "Envoyez-moi ça par email",
    technique: 'Valeur du contact direct vs document statique',
    response: `"Je peux le faire. Mais par email vous ne pouvez pas poser de questions, et un document d'assurance sans explication c'est 40 pages que personne ne lit. Ce que je vous propose c'est de vous envoyer un résumé d'une page des points clés, et on se rappelle dans [24h] pour 10 minutes. Comme ça vous avez le temps de regarder et je réponds à vos questions. Ça vous va ?"`,
    exercise: "Préparez un résumé d'une page par produit — maximum 5 points clés avec chiffres. Ce document doit pouvoir se lire en 2 minutes.",
  },
  {
    category: 'Procrastination',
    objection: "Je n'ai pas le temps de m'en occuper maintenant",
    technique: 'Simplicité du processus de souscription',
    response: `"Je comprends et c'est justement pour ça qu'on a simplifié au maximum. La souscription se fait en ligne, signature électronique, aucun déplacement. Pour la plupart de nos contrats, c'est moins de 15 minutes de votre temps total — je gère tout le reste. Vous avez 15 minutes cette semaine ?"`,
    exercise: "Chronométrez votre processus de souscription de bout en bout. Si c'est plus de 15 minutes pour le client, simplifiez.",
  },

  // AUTORITÉ / DÉCISION ────────────────────────────────────────
  {
    category: 'Décision',
    objection: "Je dois en parler à mon associé / conjoint / comptable",
    technique: 'Impliquer le décideur dès maintenant',
    response: `"Bien sûr. Est-ce qu'on peut organiser un appel à trois ? Comme ça je réponds directement à ses questions et vous n'avez pas à tout retransmettre. Quand est-ce que vous êtes disponibles tous les deux en même temps ?"`,
    exercise: "Ne laissez jamais un intermédiaire porter votre proposition seul. 80% des décisions se prennent quand vous êtes présent pour répondre aux objections.",
  },
  {
    category: 'Décision',
    objection: "Ce n'est pas moi qui décide",
    technique: 'Identification et accès au vrai décideur',
    response: `"Je comprends. Qui est la bonne personne avec qui parler pour ce type de décision ? Est-ce que vous pouvez me la mettre en relation, ou préférez-vous que je vous envoie un support qu'elle pourra consulter ?"`,
    exercise: "Qualifiez toujours le pouvoir décisionnel en phase de découverte : 'Est-ce que la décision finale c'est vous ou vous la prenez avec quelqu'un ?'",
  },
  {
    category: 'Décision',
    objection: "Je vais demander un autre devis ailleurs",
    technique: 'Encourager la comparaison en position de force',
    response: `"Absolument, c'est votre droit et c'est même une bonne pratique. Faites vos comparaisons. Je vous demande juste une chose : quand vous aurez leur devis, envoyez-le moi avant de décider — je vous dis honnêtement si c'est mieux que le nôtre, et si c'est le cas, je vous aide à comprendre pourquoi."`,
    exercise: "Cette posture de confiance rassure le client et vous repositionne comme conseiller plutôt que vendeur. Pratiquez-la jusqu'à ce qu'elle soit naturelle.",
  },

  // EXPÉRIENCE NÉGATIVE ────────────────────────────────────────
  {
    category: 'Expérience négative',
    objection: "Mon dernier assureur n'a pas payé quand j'ai eu un sinistre",
    technique: 'Écoute active + transparence sur les exclusions',
    response: `"C'est la pire expérience qu'on puisse avoir. Racontez-moi ce qui s'est passé. [Écouter attentivement] La plupart des refus d'indemnisation sont liés à une exclusion cachée dans les conditions générales. Ma façon de travailler c'est différente : avant de signer, on lit ensemble les exclusions importantes. Vous savez exactement ce qui est couvert et ce qui ne l'est pas. Plus de mauvaises surprises."`,
    exercise: "Pour chaque contrat que vous vendez, listez les 5 exclusions les plus fréquentes qui causent des litiges. Expliquez-les proactivement avant la signature.",
  },
  {
    category: 'Expérience négative',
    objection: "J'ai eu des problèmes avec un courtier avant",
    technique: 'Validation + preuves de différenciation',
    response: `"Je suis vraiment désolé que vous ayez eu cette expérience. Le secteur a des pratiques très variables et certains courtiers manquent de rigueur. Voici ce qui nous différencie concrètement : [1. transparence totale sur les commissions, 2. documentation complète remise avant signature, 3. suivi post-vente avec un interlocuteur dédié]. Est-ce que ces points répondent à ce qui vous a posé problème avant ?"`,
    exercise: "Formalisez votre charte de service client en 5 points. C'est un outil de différenciation fort face aux mauvaises expériences passées.",
  },
  {
    category: 'Expérience négative',
    objection: "Les assurances augmentent le prix chaque année",
    technique: 'Transparence sur la révision tarifaire + valeur du courtier',
    response: `"C'est vrai que les primes sont indexées chaque année — c'est lié à l'inflation et aux statistiques sinistres du secteur. Mais voici où je vous apporte de la valeur : chaque année à la date anniversaire, je benchmark votre contrat par rapport au marché. Si vous n'êtes plus dans le meilleur rapport qualité-prix, je vous propose une alternative. Vous avez un conseiller actif, pas un contrat qui prend la poussière."`,
    exercise: "Mettez en place un processus de révision annuelle pour tous vos clients. Un client qui sent qu'on s'occupe de lui renouvelle et vous recommande.",
  },

  // SPÉCIFIQUES ────────────────────────────────────────────────
  {
    category: 'Spécifique',
    objection: "Je suis en bonne santé, je n'ai pas besoin de mutuelle",
    technique: 'Remboursement vs prévention + coûts cachés',
    response: `"La mutuelle ne sert pas qu'aux malades chroniques. La dernière fois que vous avez changé vos lunettes, ça vous a coûté combien ? Les soins dentaires ? Un simple couronnement c'est 800 à 1200€ — la sécu rembourse 70€. Notre mutuelle vous rembourse jusqu'à [X]€. Sur l'année, les chiffres parlent d'eux-mêmes."`,
    exercise: "Préparez un calcul type sur 1 an pour une personne en bonne santé : 1 paire de lunettes + 1 soin dentaire + 4 consultations généraliste. Le résultat surprend souvent.",
  },
  {
    category: 'Spécifique',
    objection: "Je vais sur une comparaison en ligne",
    technique: 'Limites des comparateurs + valeur du conseil personnalisé',
    response: `"Très bonne initiative. Mais sachez que les comparateurs affichent souvent les contrats les moins chers — qui sont aussi ceux avec les plus petites garanties. Ils ne peuvent pas prendre en compte votre situation spécifique, vos antécédents, vos besoins réels. Mon rôle c'est d'aller plus loin que l'algorithme. Si vous trouvez quelque chose qui vous intéresse, envoyez-le moi — je l'analyse avec vous."`,
    exercise: "Faites le tour des 3 principaux comparateurs pour chaque produit. Connaissez leurs limites et leurs biais pour pouvoir en parler avec crédibilité.",
  },
  {
    category: 'Spécifique',
    objection: "Je vais attendre le renouvellement de mon contrat",
    technique: 'Résiliation infra-annuelle — droits du consommateur',
    response: `"Vous n'avez pas à attendre. Depuis la loi Hamon, vous pouvez changer d'assurance à tout moment après la première année. Et depuis la loi Lemoine pour l'emprunteur, même les contrats de moins d'un an peuvent être résiliés. Concrètement, si vous souscrivez aujourd'hui, notre assureur se charge d'envoyer la lettre de résiliation à votre assureur actuel. Vous ne gérez rien."`,
    exercise: "Maîtrisez parfaitement les lois Hamon, Chatel et Lemoine. Ce sont vos meilleurs arguments pour lever les blocages liés au timing.",
  },
  {
    category: 'Spécifique',
    objection: "Je préfère aller directement chez une compagnie",
    technique: 'Indépendance du courtier = avantage client',
    response: `"Vous pouvez. Mais quand vous allez chez [compagnie X], leur conseiller ne peut vous proposer que les produits de [compagnie X]. Moi, je peux comparer 20+ compagnies et sélectionner celle qui correspond le mieux à votre profil et votre budget. Et si dans 2 ans une meilleure offre existe ailleurs, je vous le dis. Un conseiller en compagnie ne le fera jamais."`,
    exercise: "Calculez pour 3 profils types combien le client économise en passant par un courtier vs en direct. Ces exemples chiffrés sont très convaincants.",
  },
  {
    category: 'Spécifique',
    objection: "Mes revenus sont irréguliers, je ne peux pas m'engager",
    technique: 'Modularité et souplesse contractuelle',
    response: `"On a précisément des formules adaptées aux indépendants et aux revenus variables. Vous pouvez ajuster votre niveau de couverture chaque année. Et si vous avez une période difficile, certains contrats permettent une suspension temporaire ou une réduction des garanties sans résiliation. Quel est votre revenu moyen mensuel pour qu'on voit ce qui est réaliste ?"`,
    exercise: "Identifiez les contrats de votre portefeuille qui offrent le plus de souplesse (suspension, modulation, résiliation facilitée). Ce sont vos produits phares pour les indépendants.",
  },
]

// ════════════════════════════════════════════════════════════════
// COMMERCIAL — CALL SCENARIOS
// ════════════════════════════════════════════════════════════════

export const CALL_SCENARIOS = [
  {
    id: 1,
    title: 'Lead entrant — Mutuelle santé',
    difficulty: 'easy',
    description: 'Client qui a rempli un formulaire en ligne. Il cherche une mutuelle, a un budget et est disponible.',
    tip: "Ce client est déjà motivé. Allez directement à la découverte des besoins sans trop vous présenter. Proposez vite.",
    exchanges: [
      { from: 'client', text: "Bonjour, j'ai rempli un formulaire sur votre site pour une mutuelle. Je cherche quelque chose de correct, pas trop cher." },
      { from: 'agent_prompt', text: "Parfait ! Présentez-vous brièvement et posez directement une question de découverte sur sa situation actuelle." },
      { from: 'client', text: "Non je n'ai pas de mutuelle actuellement. Je suis auto-entrepreneur depuis 6 mois." },
      { from: 'agent_prompt', text: "Qualifiez ses besoins : santé globale, optique/dentaire, budget approximatif." },
      { from: 'client', text: "Je mets des lunettes, et j'ai des soins dentaires à prévoir. Budget entre 40 et 60€ par mois." },
      { from: 'agent_prompt', text: "Présentez la formule adaptée avec les garanties optique et dentaire en mettant en avant le ROI concret." },
      { from: 'client', text: "Ça m'a l'air bien. C'est combien exactement pour cette formule ?" },
      { from: 'agent_prompt', text: "Annoncez le prix, puis proposez de finaliser directement. Utilisez le closing assumé." },
      { from: 'client', text: "Ok 52€ c'est dans mon budget. Comment on fait pour démarrer ?" },
    ],
  },
  {
    id: 2,
    title: 'Client hésitant — RC Pro',
    difficulty: 'medium',
    description: 'Indépendant qui sait qu\'il devrait être couvert mais reporte depuis des mois. A des objections sur le prix et le besoin.',
    tip: "Réveillez le risque latent avec un exemple concret de sinistre. Ne débattez pas du prix avant d'avoir créé l'urgence.",
    exchanges: [
      { from: 'client', text: "J'y pense depuis un moment mais je ne suis pas sûr que ça soit vraiment utile pour moi. Je suis juste consultant indépendant." },
      { from: 'agent_prompt', text: "Réveillez le risque. Posez-lui une question sur ce qui se passerait si un client lui reprochait une erreur professionnelle." },
      { from: 'client', text: "Hmm... ça ne m'est jamais arrivé. Mais je vois ce que vous voulez dire." },
      { from: 'agent_prompt', text: "Donnez un exemple concret et chiffré de sinistre RC Pro pour un consultant. Rendez le risque réel." },
      { from: 'client', text: "Ok je comprends le principe. Mais ça va coûter combien ? J'ai pas envie de payer pour quelque chose qui ne servira peut-être jamais." },
      { from: 'agent_prompt', text: "Répondez à l'objection coût de l'inaction : comparez le prix mensuel au risque financier réel. Décomposez en valeur journalière." },
      { from: 'client', text: "Ouais... 1,50€ par jour pour ne pas risquer de perdre mon entreprise, vu comme ça c'est différent." },
      { from: 'agent_prompt', text: "Momentum favorable ! Proposez le closing maintenant pendant qu'il est convaincu." },
    ],
  },
  {
    id: 3,
    title: 'Objection prix — Assurance auto',
    difficulty: 'hard',
    description: 'Client intéressé mais qui bloque sur le prix. Compare avec son assurance actuelle et cherche à négocier.',
    tip: "Ne baissez jamais le prix sans contrepartie. Proposez une formule alternative ou un paiement annuel. Restez ferme sur la valeur.",
    exchanges: [
      { from: 'client', text: "Votre offre m'intéresse mais c'est 20€ de plus que ce que je paye actuellement. Je ne vois pas pourquoi je paierais plus." },
      { from: 'agent_prompt', text: "Ne défendez pas le prix immédiatement. Demandez d'abord ce que couvre son contrat actuel pour montrer la différence de garanties." },
      { from: 'client', text: "Il couvre le tiers, vol et incendie. C'est basique mais ça me suffit." },
      { from: 'agent_prompt', text: "Révélez la lacune : son contrat ne couvre pas l'usage professionnel ni l'assistance 0km. Posez une question qui fait réaliser le risque." },
      { from: 'client', text: "Attendez, vous me dites que si j'ai un accident en allant voir un client, mon assurance actuelle ne couvre pas ?" },
      { from: 'agent_prompt', text: "Confirmez le risque clairement. Puis proposez une alternative légèrement moins chère que l'offre initiale mais qui couvre l'usage pro." },
      { from: 'client', text: "Ok je comprends. Mais 20€ de plus c'est quand même beaucoup sur le budget mensuel." },
      { from: 'agent_prompt', text: "Proposez le paiement annuel avec économie, ou décomposez en coût journalier comparé au coût d'un sinistre non couvert." },
      { from: 'client', text: "Si le paiement annuel me fait économiser 40€... ok c'est acceptable. On peut faire ça ?" },
      { from: 'agent_prompt', text: "Confirmez et fermez immédiatement. Demandez la carte grise et le permis pour préparer le dossier." },
    ],
  },
]

// ════════════════════════════════════════════════════════════════
// COMMERCIAL QUIZ — POOL DE 100+ QUESTIONS + TIRAGE ALÉATOIRE
// ════════════════════════════════════════════════════════════════

// Pool complet de 100 questions
export const COMMERCIAL_QUIZ_POOL = [
  // TECHNIQUES DE VENTE ─────────────────────────────────────
  { q: "Quelle est la première étape d'un appel de vente structuré ?", options: ["Annoncer le prix", "Se présenter et créer le lien de confiance", "Proposer le produit directement", "Demander le numéro de carte bancaire"], correct: 1 },
  { q: "La méthode SONCAS identifie les motivations d'achat. Que signifie le S ?", options: ["Satisfaction", "Sécurité", "Service", "Succès"], correct: 1 },
  { q: "Que signifie la méthode CAB en argumentation commerciale ?", options: ["Client, Achat, Budget", "Caractéristique, Avantage, Bénéfice", "Contact, Accord, Bilan", "Coût, Analyse, Bénéfice"], correct: 1 },
  { q: "Combien de fois faut-il relancer un prospect en moyenne avant d'obtenir un rendez-vous ?", options: ["1 fois", "2 fois", "5 à 7 fois", "15 fois"], correct: 2 },
  { q: "La phase de découverte des besoins doit se faire :", options: ["Après la présentation produit", "Avant toute présentation de produit", "Pendant la signature du contrat", "Uniquement par email"], correct: 1 },
  { q: "Quelle question ouvre le mieux une phase de découverte ?", options: ["Voulez-vous acheter une assurance ?", "Quelle est votre situation actuelle ?", "Avez-vous beaucoup d'argent ?", "Connaissez-vous nos offres ?"], correct: 1 },
  { q: "Le closing consiste à :", options: ["Terminer la conversation rapidement", "Obtenir l'engagement ferme du client", "Faire une remise de dernière minute", "Présenter les points négatifs du contrat"], correct: 1 },
  { q: "Face à l'objection 'je rappellerai', la meilleure réponse est :", options: ["D'accord, bonne journée", "Proposer deux créneaux précis", "Insister longuement", "Envoyer un email de relance"], correct: 1 },
  { q: "La technique de restructuration du coût consiste à :", options: ["Baisser le prix", "Ramener le coût mensuel à un coût journalier", "Offrir une garantie supplémentaire gratuite", "Proposer un paiement en plusieurs fois"], correct: 1 },
  { q: "Un client dit 'j'ai déjà une assurance'. La meilleure réponse est :", options: ["Raccrocher poliment", "Proposer un audit comparatif gratuit", "Dire que votre offre est moins chère sans vérifier", "Ignorer cette information"], correct: 1 },
  { q: "La règle des 3C en vente signifie :", options: ["Convaincre, Conclure, Célébrer", "Contacter, Comprendre, Conclure", "Calculer, Communiquer, Clore", "Créer, Convertir, Capitaliser"], correct: 1 },
  { q: "Quand un client dit 'c'est trop cher', que faites-vous EN PREMIER ?", options: ["Baisser immédiatement le prix", "Raccrocher et rappeler plus tard", "Comprendre ce qu'il compare", "Insister sur les qualités du produit"], correct: 2 },
  { q: "La découverte des besoins doit idéalement utiliser :", options: ["Des questions fermées uniquement", "Des questions ouvertes principalement", "Uniquement des affirmations", "Des statistiques de marché"], correct: 1 },
  { q: "Qu'est-ce que la technique de l'écho en écoute active ?", options: ["Parler plus fort", "Répéter les derniers mots du client pour l'inciter à continuer", "Faire écho à ses objections sans y répondre", "Répéter son argumentation deux fois"], correct: 1 },
  { q: "Le principe AIDA en marketing signifie :", options: ["Analyser, Informer, Décider, Agir", "Attention, Intérêt, Désir, Action", "Approche, Investigation, Diagnostic, Application", "Accueil, Identification, Démonstration, Accord"], correct: 1 },
  { q: "Quelle est la durée idéale d'un appel de prospection à froid ?", options: ["30 secondes", "5 à 10 minutes", "30 minutes minimum", "1 heure"], correct: 1 },
  { q: "La technique du 'pied dans la porte' consiste à :", options: ["S'imposer physiquement chez le client", "Obtenir un petit accord avant d'en demander un grand", "Forcer la signature immédiate", "Appeler sans rendez-vous"], correct: 1 },
  { q: "Qu'est-ce qu'une objection de fond ?", options: ["Une objection liée au prix uniquement", "Une vraie résistance à l'achat (besoin, confiance, budget)", "Une question sur les conditions générales", "Un refus de rappeler"], correct: 1 },
  { q: "La meilleure façon de traiter une objection est :", options: ["La nier immédiatement", "L'accepter, la clarifier, puis y répondre", "Changer de sujet", "Proposer une remise"], correct: 1 },
  { q: "Qu'est-ce que le 'trigger event' en prospection ?", options: ["Un événement négatif chez le prospect", "Un événement déclencheur qui crée le bon moment pour appeler", "La signature du contrat", "Le premier refus d'un client"], correct: 1 },

  // OBJECTIONS & RÉPONSES ──────────────────────────────────
  { q: "Un prospect dit 'Envoyez-moi ça par email'. Quelle est la bonne réponse ?", options: ["Envoyer sans rien dire", "Envoyer et rappeler dans 1 mois", "Envoyer un résumé et fixer un rappel rapide pour répondre aux questions", "Refuser et insister pour parler maintenant"], correct: 2 },
  { q: "La technique A.I.D.A. pour traiter les objections signifie :", options: ["Accepter, Ignorer, Détailler, Argumenter", "Accepter, Isoler, Démontrer, Appeler à l'action", "Analyser, Identifier, Démontrer, Anticiper", "Approuver, Informer, Différencier, Agir"], correct: 1 },
  { q: "Un client dit 'je dois en parler à mon conjoint'. Que faites-vous ?", options: ["Demandez si vous pouvez les appeler ensemble", "Attendez qu'il vous rappelle", "Insistez pour une décision maintenant", "Baissez le prix pour faciliter la décision"], correct: 0 },
  { q: "Face à 'je vais voir sur internet', vous répondez :", options: ["Internet est peu fiable", "Bonne idée, comparez et revenez me voir", "Les comparateurs ont des limites — je peux vous expliquer lesquelles", "Ne vous embêtez pas, prenez ici directement"], correct: 2 },
  { q: "Quand un client dit 'ma banque s'occupe de tout', vous lui expliquez :", options: ["Que les banques sont peu fiables", "Que les banques ne proposent que leurs propres produits, pas le meilleur du marché", "Que les banques coûtent plus cher dans tous les cas", "Rien, et vous raccrochez"], correct: 1 },
  { q: "La meilleure façon d'identifier la vraie objection cachée est :", options: ["Poser la question directement : 'Qu'est-ce qui vous bloque vraiment ?'", "Faire semblant de ne pas entendre l'objection", "Baisser le prix immédiatement", "Envoyer de la documentation supplémentaire"], correct: 0 },
  { q: "Un client dit 'j'ai eu de mauvaises expériences'. Vous :", options: ["Minimisez sa mauvaise expérience", "Écoutez, validez, puis différenciez concrètement votre approche", "Critiquez la compagnie précédente", "Proposez un prix encore plus bas"], correct: 1 },
  { q: "Face à 'je n'ai pas besoin d'assurance', la meilleure approche est :", options: ["Accepter et raccrocher", "Argumenter immédiatement sur les avantages", "Poser des questions sur ce qui se passerait si le risque se réalise", "Proposer une formule gratuite"], correct: 2 },

  // PRODUITS ASSURANCE ──────────────────────────────────────
  { q: "Depuis quelle loi un assuré peut-il changer d'assurance emprunteur à tout moment ?", options: ["Loi Chatel", "Loi Hamon", "Loi Lemoine", "Loi PACTE"], correct: 2 },
  { q: "La loi Hamon (2015) permet de résilier un contrat d'assurance auto :", options: ["Seulement à date anniversaire", "À tout moment après 1 an de contrat", "Après 3 ans minimum", "Jamais avant terme"], correct: 1 },
  { q: "Un contrat MRH couvre principalement :", options: ["Uniquement les dommages aux tiers", "Incendie, dégâts des eaux, vol, catastrophes naturelles et RC vie privée", "Uniquement le mobilier", "Uniquement la structure du bâtiment"], correct: 1 },
  { q: "L'assurance RC Pro couvre :", options: ["Uniquement les accidents de voiture en mission", "Les dommages causés à des tiers dans le cadre de l'activité professionnelle", "Uniquement les dommages corporels", "Les amendes professionnelles"], correct: 1 },
  { q: "Le tiers payant en mutuelle santé signifie :", options: ["Que le tiers paye votre assurance", "Que vous n'avancez pas les frais chez les professionnels partenaires", "Que vous payez en 3 fois", "Que la mutuelle paye 33% des frais"], correct: 1 },
  { q: "Qu'est-ce que la cotisation sur le capital restant dû pour l'assurance emprunteur ?", options: ["Une cotisation fixe pendant toute la durée du prêt", "Une cotisation qui diminue chaque année en proportion du capital remboursé", "Une cotisation calculée sur les intérêts uniquement", "Une cotisation annuelle révisable"], correct: 1 },
  { q: "La garantie décennale est obligatoire pour :", options: ["Tous les artisans", "Les professionnels de la construction (BTP)", "Les consultants uniquement", "Les médecins libéraux"], correct: 1 },
  { q: "Un contrat d'assurance vie en unités de compte présente :", options: ["Un capital garanti à terme", "Un rendement garanti de 3%", "Un risque de perte en capital lié aux marchés financiers", "Aucun risque car géré par l'assureur"], correct: 2 },
  { q: "La franchise en assurance représente :", options: ["La partie du sinistre à la charge de l'assureur", "La partie du sinistre restant à la charge de l'assuré", "Le montant total de la prime annuelle", "Le délai de carence"], correct: 1 },
  { q: "Qu'est-ce que la valeur agréée en assurance ?", options: ["La valeur marchande actuelle du bien", "La valeur fixée d'accord-parties à la souscription, sans recours à l'expertise après sinistre", "La valeur de remplacement à neuf", "La valeur fiscale du bien"], correct: 1 },
  { q: "La portabilité de la mutuelle santé (loi ANI) permet :", options: ["De changer de mutuelle librement", "De conserver sa mutuelle d'entreprise après une période de chômage", "De bénéficier de la mutuelle de son conjoint", "D'accéder aux soins à l'étranger"], correct: 1 },
  { q: "Qu'est-ce que le délai de carence en assurance santé ?", options: ["Le délai de remboursement après un sinistre", "La période après souscription pendant laquelle certaines garanties ne s'appliquent pas", "Le délai pour résilier le contrat", "Le délai de franchise sur les soins optiques"], correct: 1 },
  { q: "La garantie indemnités journalières couvre :", options: ["Uniquement les accidents du travail", "Une compensation de revenu en cas d'arrêt de travail pour maladie ou accident", "Les frais d'hospitalisation uniquement", "Le remboursement des médicaments"], correct: 1 },

  // RÉGLEMENTATION ──────────────────────────────────────────
  { q: "ORIAS signifie :", options: ["Office de Régulation des Intermédiaires en Assurances et Sécurité", "Organisme pour le Registre des Intermédiaires en Assurance", "Organisation Régionale des Intermédiaires Agréés en Assurance", "Office de Référencement des Intermédiaires Assureurs"], correct: 1 },
  { q: "La DDA (Directive Distribution Assurance) impose notamment :", options: ["Un prix maximum pour les contrats", "L'analyse des besoins et le devoir de conseil avant toute vente", "La gratuité de la souscription", "La vente uniquement en agence physique"], correct: 1 },
  { q: "Le renouvellement de l'inscription ORIAS se fait :", options: ["Tous les 5 ans", "Tous les 3 ans", "Chaque année avant le 31 décembre", "Uniquement sur demande"], correct: 2 },
  { q: "La formation continue annuelle obligatoire pour un intermédiaire en assurance est de :", options: ["5 heures", "10 heures", "15 heures", "20 heures"], correct: 2 },
  { q: "La fiche conseil (ou document de recueil des besoins) doit être remise :", options: ["Après la signature et le paiement", "Avant la proposition de tout contrat d'assurance", "Uniquement pour les contrats de plus de 1000€", "Elle n'est plus obligatoire depuis 2020"], correct: 1 },
  { q: "Le DIPA (Document d'Information sur le Produit d'Assurance) doit être remis :", options: ["Après la signature", "Avant la signature, en temps utile", "Seulement sur demande du client", "Uniquement pour les contrats vie"], correct: 1 },
  { q: "La lutte anti-blanchiment (LCB-FT) oblige le courtier à :", options: ["Refuser tout paiement en espèces", "Vérifier l'identité du client et l'origine des fonds pour les opérations sensibles", "Déclarer tous les contrats à Tracfin", "Refuser les clients étrangers"], correct: 1 },
  { q: "En cas de fausse déclaration non intentionnelle à la souscription :", options: ["Le contrat est nul de plein droit", "L'assureur peut réduire l'indemnité ou résilier le contrat", "L'assuré est poursuivi pénalement", "Rien, l'assureur ne peut rien faire"], correct: 1 },
  { q: "Le délai de renonciation pour une assurance vie est de :", options: ["7 jours calendaires", "30 jours calendaires", "14 jours ouvrés", "60 jours calendaires"], correct: 1 },
  { q: "La subrogation légale de l'assureur signifie :", options: ["L'assureur se substitue à l'assuré pour ses droits contre le responsable", "L'assuré cède son contrat à un tiers", "L'assureur annule le contrat", "Le contrat est transféré à un nouvel assureur"], correct: 0 },
  { q: "La prescription en assurance dommages est généralement de :", options: ["1 an", "2 ans", "5 ans", "10 ans"], correct: 1 },

  // CONNAISSANCE MARCHÉ ─────────────────────────────────────
  { q: "Quel est le taux de commission moyen pour un contrat de mutuelle santé individuelle ?", options: ["2-5%", "8-15%", "20-30%", "Zéro, le courtier est payé par le client"], correct: 1 },
  { q: "Quelle part du marché de l'assurance représentent les courtiers en France (environ) ?", options: ["5%", "15%", "30%", "50%"], correct: 2 },
  { q: "Le marché de l'assurance emprunteur représente en France :", options: ["500 millions €/an", "2 milliards €/an", "8 milliards €/an", "50 milliards €/an"], correct: 2 },
  { q: "La bancassurance représente quelle part de la distribution d'assurance vie en France ?", options: ["10%", "20%", "40%", "Plus de 60%"], correct: 3 },
  { q: "Qu'est-ce qu'un contrat collectif à adhésion obligatoire ?", options: ["Un contrat souscrit par l'employeur pour tous ses salariés sans exception", "Un contrat souscrit par plusieurs assureurs ensemble", "Un contrat imposé par l'État", "Un contrat qui ne peut pas être résilié"], correct: 0 },
  { q: "La loi ANI de 2013 a imposé aux entreprises :", options: ["De payer toutes les primes de leurs salariés", "De mettre en place une complémentaire santé collective pour tous les salariés", "De supprimer les mutuelles individuelles", "De cotiser à une retraite supplémentaire obligatoire"], correct: 1 },

  // RELATION CLIENT ─────────────────────────────────────────
  { q: "La recommandation client (parrainage) est efficace car :", options: ["Elle est gratuite", "Un prospect recommandé a 3 à 5 fois plus de probabilité de convertir", "Elle ne nécessite aucun effort commercial", "Elle est obligatoire par la loi"], correct: 1 },
  { q: "Le NPS (Net Promoter Score) mesure :", options: ["Le chiffre d'affaires mensuel", "La probabilité qu'un client recommande votre service", "Le taux de résiliation", "La satisfaction après un sinistre uniquement"], correct: 1 },
  { q: "Le principe de l'écoute active implique :", options: ["Parler 80% du temps", "Écouter le client au moins 60-70% du temps", "Poser des questions fermées uniquement", "Prendre des notes sans interagir"], correct: 1 },
  { q: "Quelle est la valeur ajoutée principale d'un courtier par rapport à une vente directe ?", options: ["Un prix toujours moins élevé", "L'indépendance et la comparaison multi-compagnies pour un conseil personnalisé", "Un service après-vente exclusif", "L'absence de commission"], correct: 1 },
  { q: "Un client insatisfait parle en moyenne de son expérience à :", options: ["1 à 2 personnes", "3 à 5 personnes", "10 à 15 personnes", "Personne"], correct: 2 },
  { q: "La fidélisation d'un client existant coûte :", options: ["Plus cher que l'acquisition d'un nouveau client", "Le même prix qu'acquérir un nouveau client", "5 à 7 fois moins cher qu'acquérir un nouveau client", "Rien, les clients fidèles restent automatiquement"], correct: 2 },
  { q: "Lors d'une relance J+2 sans réponse, vous devez :", options: ["Abandonner le prospect", "Appeler en changeant légèrement l'accroche pour apporter de la nouveauté", "Envoyer un email agressif", "Attendre 1 mois avant de rappeler"], correct: 1 },
  { q: "Le CRM (Customer Relationship Management) sert principalement à :", options: ["Calculer les commissions", "Suivre les interactions clients et gérer le pipeline de vente", "Rédiger les contrats automatiquement", "Calculer les primes d'assurance"], correct: 1 },

  // PSYCHOLOGIE DE LA VENTE ─────────────────────────────────
  { q: "Le biais de confirmation en vente signifie que le prospect :", options: ["Confirme toujours sa commande", "Cherche des informations qui confirment ses croyances préexistantes", "Confirme son rendez-vous", "Valide le contrat sans lire"], correct: 1 },
  { q: "Le principe de rareté en persuasion consiste à :", options: ["Mentir sur la disponibilité d'un produit", "Souligner légitimement la disponibilité limitée pour créer un sentiment d'urgence", "Refuser de vendre à certains clients", "Proposer uniquement des contrats annuels"], correct: 1 },
  { q: "La technique du miroir (mirroring) consiste à :", options: ["Montrer un miroir au client", "Imiter subtilement le langage et le rythme du client pour créer de la confiance", "Répéter mot pour mot ce que dit le client", "Montrer la même offre à plusieurs clients"], correct: 1 },
  { q: "Le principe de réciprocité dit qu'un client à qui on a rendu service :", options: ["N'achète jamais par principe", "Est naturellement enclin à rendre la pareille (acheter, recommander)", "Demande toujours une remise en échange", "Ne peut pas refuser l'offre"], correct: 1 },
  { q: "La social proof (preuve sociale) en vente consiste à :", options: ["Montrer des posts sur les réseaux sociaux", "Citer des témoignages clients et des chiffres de clients satisfaits", "Avoir une page Instagram active", "Montrer les avis négatifs pour paraître honnête"], correct: 1 },
  { q: "Le pic-fin (peak-end rule) en psychologie du client signifie que :", options: ["Il se souvient surtout du moment le plus intense et de la fin de l'interaction", "Il achète toujours à la fin de la conversation", "La première impression n'a aucune importance", "Il faut toujours finir sur une remise"], correct: 0 },

  // GESTION DU TEMPS ET ORGANISATION ───────────────────────
  { q: "Combien d'appels de prospection un commercial doit-il viser par jour en moyenne ?", options: ["5 appels", "10-15 appels", "50 appels", "100 appels"], correct: 1 },
  { q: "La méthode SMART pour les objectifs signifie :", options: ["Simple, Motivant, Agréable, Réaliste, Temporel", "Spécifique, Mesurable, Atteignable, Réaliste, Temporel", "Stratégique, Managérial, Analytique, Reproductible, Transparent", "Standard, Minimum, Ambitieux, Régulier, Transparent"], correct: 1 },
  { q: "La règle des 80/20 (Pareto) en vente signifie :", options: ["80% des ventes viennent de 80% des clients", "80% du chiffre d'affaires provient de 20% des clients", "Il faut travailler 80h par semaine", "20% des produits représentent 80% des marges"], correct: 1 },
  { q: "Qu'est-ce qu'un 'pipe commercial' ou pipeline de vente ?", options: ["Un outil de plomberie", "L'ensemble des opportunités commerciales à différents stades d'avancement", "Le fichier de contacts froids", "La liste des contrats signés"], correct: 1 },
  { q: "La technique de vente SPIN signifie :", options: ["Speed, Precision, Innovation, Negotiation", "Situation, Problème, Implication, Need-payoff (besoin-solution)", "Service, Prix, Information, Negociation", "Standard, Personnalisé, Intensif, Numérique"], correct: 1 },
]

// ── Fonction de tirage aléatoire — 20 questions parmi 100+ ──
export function getRandomQuiz(n = 20) {
  const shuffled = [...COMMERCIAL_QUIZ_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// COMMERCIAL_QUIZ reste pour compatibilité ascendante (tirage dynamique)
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
