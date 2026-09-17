import { LOCAL_PACKS, computeFinalPrice } from './packsData.js'
import { formatNowLabel } from './dateUtils.js'
import { buildMockPaymentRows } from './conversion.js'

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
  return {id:i+1,name:['Amine','Lina','Nora','Sami','Inès','Adam','Maya','Rayan'][i%8]+' Exemple '+(Math.floor(i/8)+1),email:`prospect${i+1}@example.invalid`,phone:'Non renseigné',city:['Casablanca','Rabat','Tanger'][i%3],stage,owner:owners[i%3],source:sources[i%5],value:12000+(i%5)*3000,pack:packRef.name,packId:packRef.id,pricingMode,discountPercent,basePrice,finalPrice,paymentValidated,convertedAt,payments,message:DEMO_MESSAGES[i%DEMO_MESSAGES.length],due:d.toISOString().slice(0,10),action:i%3===0?'Rendez-vous découverte':'Relancer le prospect',done:false,appointments:[],tasks:[],activity:[{text:'Prospect fictif créé pour la démonstration',at:formatNowLabel(createdAt)}]}})}
export function selectLeads(leads,{search='',stage='',owner='',source='',overdue=false,sort='name',desc=false}) {return leads.filter(l=>(!search||`${l.name} ${l.email} ${l.city}`.toLowerCase().includes(search.toLowerCase()))&&(!stage||l.stage===stage)&&(!owner||l.owner===owner)&&(!source||l.source===source)&&(!overdue||(!l.done&&l.due<today))).sort((a,b)=>(typeof a[sort]==='number'?a[sort]-b[sort]:String(a[sort]).localeCompare(String(b[sort]),'fr'))*(desc?-1:1))}
