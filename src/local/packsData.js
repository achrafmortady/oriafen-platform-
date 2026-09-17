// Source locale UNIQUE des packs, partagée par "Nouveau prospect", la fiche
// Prospect et la fiche Client (aucune duplication de liste ailleurs).
//
// PACK_CATEGORY_LABELS est recopié à l'identique (lecture seule) depuis
// src/pages/admin/Dashboard.jsx (constante `PACK_CATEGORY_LABELS`, fichier
// live non modifié).
//
// TVA_RATE = 1.20 (20%) confirmé dans src/lib/api.js (`const TVA_RATE = 1.20
// // 20% TVA, prix HT -> TTC`, lecture seule, fichier non modifié).
//
// Catalogue de packs (noms + prix TTC) fourni explicitement par l'utilisateur
// dans cette session — traité comme donnée autoritaire, pas une invention.
// Le prix HT est dérivé : priceHt = priceTtc / TVA_RATE (même sens de calcul
// que le live, qui stocke le HT et affiche `Math.round(price_ht * TVA_RATE)`
// — ici on part du TTC fourni et on recalcule le HT correspondant).
//
// NOTE (transparence) : la consigne de tests de cette session mentionne
// "11 packs disponibles", mais le catalogue fourni liste explicitement 12
// packs (2 Conseil + 3 Marketing + 3 Academy + 4 Combinés = 12). Implémenté
// fidèlement les 12 packs listés ("ne pas ajouter d'autres packs" a été
// respecté au pied de la lettre) plutôt que d'en retirer un pour forcer un
// total de 11 — signalé ici pour validation humaine si "11" était le nombre
// réellement voulu.

export const PACK_CATEGORY_LABELS = {
  conseil:   '📋 Conseil ORIAS',
  marketing: '🌐 Marketing',
  academy:   '🎓 Academy',
  combine:   '⭐ Packs Combinés',
}

export const TVA_RATE = 1.20

function ht(priceTtc) {
  return Math.round(priceTtc / TVA_RATE)
}

export const LOCAL_PACKS = [
  { id: 'conseil-essentiel',    name: 'Pack Essentiel',    category: 'conseil',   priceTtc: 47880,  priceHt: ht(47880),  paymentType: 'milestone', displayOrder: 1 },
  { id: 'conseil-premium',      name: 'Pack Premium',      category: 'conseil',   priceTtc: 59880,  priceHt: ht(59880),  paymentType: 'milestone', displayOrder: 2 },
  { id: 'marketing-starter',    name: 'Web Starter',       category: 'marketing', priceTtc: 14280,  priceHt: ht(14280),  paymentType: 'milestone', displayOrder: 3 },
  { id: 'marketing-pro',        name: 'Web Pro',           category: 'marketing', priceTtc: 21480,  priceHt: ht(21480),  paymentType: 'milestone', displayOrder: 4 },
  { id: 'marketing-elite',      name: 'Web Elite',         category: 'marketing', priceTtc: 47880,  priceHt: ht(47880),  paymentType: 'milestone', displayOrder: 5 },
  { id: 'academy-ias1',         name: 'Formation IAS1',    category: 'academy',   priceTtc: 9480,   priceHt: ht(9480),   paymentType: 'full',      displayOrder: 6 },
  { id: 'academy-scripts',      name: 'Scripts & Vente',   category: 'academy',   priceTtc: 7080,   priceHt: ht(7080),   paymentType: 'full',      displayOrder: 7 },
  { id: 'academy-complet',      name: 'Academy Complet',   category: 'academy',   priceTtc: 15480,  priceHt: ht(15480),  paymentType: 'full',      displayOrder: 8 },
  { id: 'combine-lancement',    name: 'Pack Lancement',    category: 'combine',   priceTtc: 59880,  priceHt: ht(59880),  paymentType: 'milestone', displayOrder: 9 },
  { id: 'combine-croissance',   name: 'Pack Croissance',   category: 'combine',   priceTtc: 68280,  priceHt: ht(68280),  paymentType: 'milestone', displayOrder: 10 },
  { id: 'combine-acceleration', name: 'Pack Accélération', category: 'combine',   priceTtc: 77472,  priceHt: ht(77472),  paymentType: 'milestone', displayOrder: 11 },
  { id: 'combine-elite',        name: 'Pack Elite',        category: 'combine',   priceTtc: 100680, priceHt: ht(100680), paymentType: 'milestone', displayOrder: 12 },
]

export function packsByCategory() {
  return LOCAL_PACKS.reduce((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p)
    return acc
  }, {})
}

export function findPackByName(name) {
  return LOCAL_PACKS.find(p => p.name === name) || null
}

export function findPackById(id) {
  return LOCAL_PACKS.find(p => p.id === id) || null
}

// Prix de base selon le mode HT/TTC choisi.
export function basePriceFor(pack, pricingMode) {
  if (!pack) return 0
  return pricingMode === 'ht' ? pack.priceHt : pack.priceTtc
}

// Prix final = prix de base * (1 - remise/100), jamais négatif, remise
// toujours ramenée à [0, 100].
export function computeFinalPrice(pack, pricingMode, discountPercent) {
  const base = basePriceFor(pack, pricingMode)
  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0))
  return Math.max(0, Math.round(base * (1 - discount / 100)))
}
