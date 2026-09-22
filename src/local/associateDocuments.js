// Documents (optionnels) de l'associé du client — V2 local uniquement
// (src/local/*). Volontairement PAS dans src/data/mockData.js : ce fichier
// est partagé avec le live (src/pages/admin/Dashboard.jsx,
// src/pages/student/*), qu'on ne touche jamais depuis ce chantier V2.
//
// Catégories dédiées, JAMAIS les mêmes IDs que REQUIRED_DOCUMENTS (documents
// du client principal, mockData.js : cin, passeport, domicile,
// certificat_benef, selfie_olky, contrat_mission). documentsStore.js est de
// toute façon keyé par catégorie dans un objet plat — tant que les IDs ne se
// recoupent jamais, un document associé ne peut structurellement pas
// écraser un document du client principal, ni l'inverse.
//
// Section OPTIONNELLE, dont la visibilité est conditionnée par
// associateStore.js::getHasAssociate(clientId) (correctif 2026-09-22, sur
// demande client explicite) : affichée UNIQUEMENT pour un client dont le
// dossier comporte réellement un associé, jamais pour les autres — voir
// LocalMesDocuments.jsx (client) et LocalClientsOverview.jsx (admin).
// Aucun impact sur la progression du dossier principal quand affichée
// (REQUIRED_DOCUMENTS reste le seul dénominateur, LocalMesDocuments.jsx).
export const ASSOCIATE_DOCUMENTS = [
  { id: 'associate_cin_recto', label: "CIN de l'associé — Recto", sublabel: 'Recto', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'associate_cin_verso', label: "CIN de l'associé — Verso", sublabel: 'Verso', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'associate_passeport', label: "Passeport de l'associé", sublabel: 'Pages photo et signature', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'associate_justificatif_domiciliation', label: "Justificatif de domiciliation de l'associé", sublabel: 'Facture ou courrier officiel', accept: '.pdf,.jpg,.jpeg,.png' },
]

export const ASSOCIATE_DOC_PREFIX = 'associate_'
// "Autre document associé" : même schéma que le "Autre document" du client
// principal (id dynamique 'autre_<timestamp>', voir LocalMesDocuments.jsx)
// mais préfixé différemment pour ne jamais pouvoir coïncider avec lui, même
// par accident (autre_123 vs associate_autre_123).
export const ASSOCIATE_AUTRE_PREFIX = 'associate_autre_'

export function isAssociateCategory(categoryId) {
  return typeof categoryId === 'string' && categoryId.startsWith(ASSOCIATE_DOC_PREFIX)
}

// Catégories associé à afficher pour un client donné : les 3 fixes + toute
// catégorie "Autre document associé" déjà envoyée par ce client (id
// dynamique découvert dans `docs`, plusieurs possibles). Lecture seule,
// jamais de mutation de `docs`. Utilisé par la fiche client (upload) ET par
// la vue admin (revue), pour qu'aucun "Autre document associé" existant ne
// reste invisible côté équipe.
export function listAssociateDocCategories(docs) {
  const fixedIds = new Set(ASSOCIATE_DOCUMENTS.map(d => d.id))
  const dynamic = Object.keys(docs || {})
    .filter(id => id.startsWith(ASSOCIATE_AUTRE_PREFIX) && !fixedIds.has(id))
    .sort()
    .map(id => ({
      id,
      label: docs[id]?.categoryLabel || 'Autre document associé',
      sublabel: 'Document complémentaire associé',
      accept: '.pdf,.jpg,.jpeg,.png',
      dynamic: true,
    }))
  return [...ASSOCIATE_DOCUMENTS, ...dynamic]
}

// Compte neutre ("Documents associé : X document envoyé") — jamais utilisé
// dans le dénominateur de progression du dossier principal (REQUIRED_DOCUMENTS
// dans LocalMesDocuments.jsx reste seul dénominateur), jamais présenté comme
// une erreur ou un manque.
export function countAssociateDocsSent(docs) {
  return listAssociateDocCategories(docs).filter(c => docs?.[c.id]?.fileName).length
}
