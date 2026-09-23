import { LOCAL_PACKS, findPackById, computeFinalPrice } from './packsData.js'
import { formatNowLabel } from './dateUtils.js'
import { buildMockPaymentRows } from './conversion.js'

// Client de démo CANONIQUE (feedback session 2026-09-18, "client demo is
// not mapped to admin client data") — UN SEUL id/nom, partagé par TOUS les
// stores locaux (leads/CRM, documentsStore, associateDocuments,
// marketingStore, clientTrackingStore) au lieu d'un id "6" épars et d'un nom
// "Client Démo" recréé séparément côté espace client (voir ClientSpace,
// LocalCRM.jsx) sans lien avec aucun lead admin réel. L'id est choisi égal à
// celui déjà utilisé par ClientSpace avant ce correctif (6) pour ne rien
// casser côté données déjà en localStorage chez un testeur.
export const CANONICAL_DEMO_CLIENT_ID = 6
export const CANONICAL_DEMO_CLIENT_NAME = 'Client Démo'
export const CANONICAL_DEMO_CLIENT_PACK_ID = 'combine-acceleration' // "Pack Accélération"

// "RDV pris" retiré comme étape CRM (le rendez-vous reste une fonctionnalité
// à part entière : lead.appointments[], Rendez-vous en fiche Prospect,
// Agenda/Calendrier — voir MIGRATION_RDV_PRIS_TO plus bas pour le mapping
// des anciennes données). "Intéressé – à relancer" passe en 2e position,
// juste après "Nouveau", comme demandé.
export const stages = ['Nouveau','Intéressé – à relancer','Qualifié','Engagé (Commit)','Client','Injoignable','Perdu'];
export const owners = ['Salma Démo','Yanis Démo','Non attribué'];
export const sources = ['WhatsApp','Site web','Instagram','Facebook','Autre'];
export const today = new Date().toISOString().slice(0,10);

// Mapping de migration non destructif pour les prospects locaux existants
// (localStorage) qui auraient encore stage === "RDV pris" d'une session
// précédente : repositionnés sur "Qualifié" (un RDV déjà pris signifie un
// premier contact qualifiant passé — le stage le plus proche dans la
// nouvelle liste). Les rendez-vous eux-mêmes (lead.appointments[]) et tout
// le reste du lead restent inchangés — seule l'étiquette `stage` change.
export const MIGRATION_RDV_PRIS_TO = 'Qualifié';
export function normalizeLeadsStage(leads) {
  return (leads || []).map(l => l && l.stage === 'RDV pris' ? { ...l, stage: MIGRATION_RDV_PRIS_TO } : l);
}

const DEMO_MESSAGES=[
  "Bonjour, je souhaiterais avoir plus d'informations sur l'accompagnement ORIAS.",
  "Intéressé(e) par votre pack formation, combien de temps dure le parcours ?",
  "Pouvez-vous me rappeler pour un premier échange ?",
  "Je cherche à me reconvertir dans le courtage en assurance, vous proposez quoi ?",
];
export function seed(){return Array.from({length:24},(_,i)=>{
  const d=new Date();d.setDate(d.getDate()+(i%9)-3);
  // Date de première entrée réelle et interprétable (au lieu de la chaîne
  // "Données de démonstration" d'origine, qui rendait "Première entrée"
  // impossible à afficher côté fiche client 360°) — antérieure à `due`.
  const createdAt=new Date();createdAt.setDate(createdAt.getDate()-(30+i));createdAt.setHours(9+(i%8),(i*7)%60,0,0);
  const packRef=LOCAL_PACKS[i%LOCAL_PACKS.length];
  const pricingMode=i%2===0?'ttc':'ht';
  const discountPercent=[0,0,10,10,0,15][i%6];
  const basePrice=pricingMode==='ht'?packRef.priceHt:packRef.priceTtc;
  const finalPrice=computeFinalPrice(packRef,pricingMode,discountPercent);
  const stage=stages[i%stages.length];
  // Les leads de démo déjà au stage "Client" sont considérés comme déjà
  // convertis (paiement validé) — sinon la vue Clients serait vide par
  // défaut. Pour un lead fraîchement passé à "Client" via l'UI, voir
  // applyPaymentValidation() dans conversion.js : la conversion réelle
  // reste toujours une action explicite séparée.
  const paymentValidated=stage==='Client';
  const payments=paymentValidated?buildMockPaymentRows(packRef,finalPrice):[];
  if(payments.length)payments[0]={...payments[0],status:'paid'};
  const convertedAt=paymentValidated?formatNowLabel(createdAt):null;
  const lead={id:i+1,name:['Amine','Lina','Nora','Sami','Inès','Adam','Maya','Rayan'][i%8]+' Exemple '+(Math.floor(i/8)+1),email:`prospect${i+1}@example.invalid`,phone:'Non renseigné',city:['Casablanca','Rabat','Tanger'][i%3],stage,owner:owners[i%3],source:sources[i%5],value:12000+(i%5)*3000,pack:packRef.name,packId:packRef.id,pricingMode,discountPercent,basePrice,finalPrice,paymentValidated,convertedAt,payments,message:DEMO_MESSAGES[i%DEMO_MESSAGES.length],due:d.toISOString().slice(0,10),action:i%3===0?'Rendez-vous découverte':'Relancer le prospect',done:false,appointments:[],tasks:[],createdAt:createdAt.getTime(),activity:[{text:'Prospect fictif créé pour la démonstration',at:formatNowLabel(createdAt)}]};
  return lead.id===CANONICAL_DEMO_CLIENT_ID?applyCanonicalDemoClientIdentity(lead):lead;
})}

export function blankLeadTemplate() {
  const packRef = LOCAL_PACKS[0]
  const pricingMode = 'ttc'
  const discountPercent = 0
  const basePrice = basePriceForSafe(packRef, pricingMode)
  return {
    id: Date.now(),
    name: 'Prospect sans nom',
    email: '',
    phone: 'Non renseigné',
    city: '',
    stage: 'Nouveau',
    owner: owners[0],
    source: sources[0],
    value: 0,
    pack: packRef?.name || '',
    packId: packRef?.id || '',
    pricingMode,
    discountPercent,
    basePrice,
    finalPrice: computeFinalPrice(packRef, pricingMode, discountPercent),
    paymentValidated: false,
    convertedAt: null,
    payments: [],
    message: '',
    due: today,
    action: 'Premier contact',
    done: false,
    appointments: [],
    tasks: [],
    createdAt: Date.now(),
    activity: [],
  }
}

function basePriceForSafe(pack, pricingMode) {
  if (!pack) return 0
  return pricingMode === 'ht' ? pack.priceHt : pack.priceTtc
}

export function isDemoLead(lead) {
  const name = String(lead?.name || '').toLowerCase()
  const email = String(lead?.email || '').toLowerCase()
  const activityText = (lead?.activity || []).map(a => String(a?.text || '')).join(' ').toLowerCase()
  return (
    email.endsWith('@example.invalid') ||
    name.includes('exemple') ||
    name === CANONICAL_DEMO_CLIENT_NAME.toLowerCase() ||
    activityText.includes('prospect fictif') ||
    String(lead?.message || '').includes('ORIAS') && email.startsWith('prospect')
  )
}

export function cleanPreviewLeads(raw) {
  return normalizeCanonicalDemoClient(normalizeInconsistentClientStage(normalizeLeadsStage(raw || [])))
    .filter(lead => !isDemoLead(lead))
}

// Champs d'identité forcés sur le lead canonique — préserve tout le reste
// (activity, appointments, tasks, owner, source, value, message, due...) :
// seule l'identité "qui est ce client" est standardisée, jamais son
// historique CRM. Réutilisée à la fois à la génération (seed) et en
// migration non destructive (normalizeCanonicalDemoClient, pour un lead
// déjà présent en localStorage avant ce correctif).
function applyCanonicalDemoClientIdentity(lead) {
  const pack = findPackById(CANONICAL_DEMO_CLIENT_PACK_ID)
  const pricingMode = lead.pricingMode === 'ht' ? 'ht' : 'ttc'
  const discountPercent = 0
  const basePrice = pack ? (pricingMode === 'ht' ? pack.priceHt : pack.priceTtc) : lead.basePrice
  const finalPrice = pack ? computeFinalPrice(pack, pricingMode, discountPercent) : lead.finalPrice
  const paymentValidated = true
  const payments = lead.paymentValidated && lead.payments?.length ? lead.payments : buildMockPaymentRows(pack, finalPrice)
  if (payments.length && payments[0].status !== 'paid') payments[0] = { ...payments[0], status: 'paid' }
  return {
    ...lead,
    name: CANONICAL_DEMO_CLIENT_NAME,
    stage: 'Client',
    pack: pack?.name || lead.pack,
    packId: CANONICAL_DEMO_CLIENT_PACK_ID,
    pricingMode,
    discountPercent,
    basePrice,
    finalPrice,
    paymentValidated,
    convertedAt: lead.convertedAt || formatNowLabel(),
    payments,
  }
}

// Migration non destructive (même convention que normalizeLeadsStage
// ci-dessus) : un testeur avec des leads déjà en localStorage avant ce
// correctif n'a pas le lead #6 à l'identité canonique — cette fonction le
// corrige sans jamais toucher aux autres leads ni à l'historique du lead #6
// (activity/appointments/tasks conservés tels quels).
export function normalizeCanonicalDemoClient(leads) {
  return (leads || []).map(l => l && l.id === CANONICAL_DEMO_CLIENT_ID && l.name !== CANONICAL_DEMO_CLIENT_NAME
    ? applyCanonicalDemoClientIdentity(l)
    : l)
}

// Migration non destructive (même convention que les deux ci-dessus) —
// correctif "CRM count mismatch" (2026-09-21) : un lead avec stage==='Client'
// mais paymentValidated !== true a été repéré en localStorage (créé avant le
// gate paiement ajouté au correctif "final blocker — payment gate", qui ne
// bloque que les NOUVELLES tentatives, jamais les données déjà persistées).
// Ce lead était compté dans la puce "Client" du Kanban/stagebar (comptage
// brut par `stage`) mais pas dans "Total clients"/"Conversion" (qui, eux,
// exigent déjà paymentValidated — voir buildClientsOverview,
// clientsOverviewData.js) : deux définitions de "client" en désaccord sur
// les mêmes données. Règle unique désormais partout : un "vrai" client est
// stage==='Client' ET paymentValidated===true (voir canSetStageToClient,
// conversion.js). Un lead qui viole cette règle n'a donc jamais été
// réellement converti — il est ramené à la dernière étape du pipeline avant
// "Client" plutôt que laissé dans un état "Client" trompeur ; son historique
// (activity/appointments/tasks/paiements) reste intact, une entrée
// d'historique documente la correction.
export function normalizeInconsistentClientStage(leads) {
  return (leads || []).map(l => {
    if (!l || l.stage !== 'Client' || l.paymentValidated) return l
    const fallbackStage = stages[stages.indexOf('Client') - 1] || 'Qualifié'
    return {
      ...l,
      stage: fallbackStage,
      activity: [
        { text: `Statut corrigé : Client -> ${fallbackStage} (paiement jamais validé)`, at: formatNowLabel() },
        ...(l.activity || []),
      ],
    }
  })
}

// Recent-first (createdAt DESC) — utilisé par la vue Kanban (feedback #4 :
// un nouveau prospect doit apparaître en tête de sa colonne d'étape,
// indépendamment du tri choisi par l'utilisateur dans la vue Liste). Ne
// modifie jamais l'ordre des étapes elles-mêmes, seulement l'ordre des
// cartes à l'intérieur d'une même étape. `createdAt` manquant (données
// anciennes en localStorage sans ce champ) est traité comme le plus ancien,
// jamais placé arbitrairement en tête.
export function sortRecentFirst(leads) {
  return [...leads].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
}
export function selectLeads(leads,{search='',stage='',owner='',source='',overdue=false,sort='name',desc=false}) {return leads.filter(l=>(!search||`${l.name} ${l.email} ${l.city}`.toLowerCase().includes(search.toLowerCase()))&&(!stage||l.stage===stage)&&(!owner||l.owner===owner)&&(!source||l.source===source)&&(!overdue||(!l.done&&l.due<today))).sort((a,b)=>(typeof a[sort]==='number'?a[sort]-b[sort]:String(a[sort]).localeCompare(String(b[sort]),'fr'))*(desc?-1:1))}
