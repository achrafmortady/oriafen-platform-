import React,{useState,useEffect,useRef} from 'react';
import {stages,owners,sources,today,seed,selectLeads,normalizeLeadsStage} from './model';
import {getAdminSendStatus,getClientLastActivity,getClientSends,getImportantUnseen,getReminderCount,markClientSendOpened,markClientSendReminded,markClientSendSeen,replyToClientSend,setClientSendImportant,subscribeToClientTracking} from './clientTrackingStore';
import Logo from '../components/Logo';
import {LogoutIcon} from '../components/Icons';
import LocalNotificationBell from './LocalNotificationBell';
import LocalMonDossier from './LocalMonDossier';
import LocalMesDocuments from './LocalMesDocuments';
import {logActivity} from './activityLog';
import {LOCAL_PACKS,findPackById,basePriceFor,computeFinalPrice} from './packsData';
import {formatNowLabel,toDisplayDateSafe} from './dateUtils';
import {buildLeadTimeline,applyNextActionUpdate} from './clientHistory';
import {applyPaymentValidation} from './conversion';
const money=n=>new Intl.NumberFormat('fr-MA').format(n)+' DH';
// Reprend les couleurs de SOURCE_BADGE_STYLES (src/pages/admin/Dashboard.jsx,
// live non modifié) pour le badge source de l'en-tête de fiche prospect.
const SOURCE_BADGE_STYLES={'Site web':'#eaf3ec','WhatsApp':'#dcfce7','Instagram':'#fce7f3','Facebook':'#dbeafe','Autre':'#f3f4f6'};
const SOURCE_BADGE_TEXT={'Site web':'#1a4a2e','WhatsApp':'#15803d','Instagram':'#be185d','Facebook':'#1d4ed8','Autre':'#4b5563'};
// Pondération par étape, mêmes valeurs que STAGE_WEIGHTS dans src/lib/api.js
// (nouveau 10% / a_relancer 25% / qualifie 50% / engage 80% / client 100% /
// injoignable 5% / perdu 0%) — réindexée pour matcher l'ordre local de
// `stages` (model.js) : Nouveau, Intéressé – à relancer, Qualifié, Engagé,
// Client, Injoignable, Perdu ("RDV pris"/rdv_pris retiré, voir model.js).
const STAGE_WEIGHTS=[0.1,0.25,0.5,0.8,1,0.05,0];
// Reprend APPOINTMENT_TYPE_LABELS (src/lib/api.js, fichier live non modifié).
const APPOINTMENT_TYPE_LABELS={appel:'Appel téléphonique',visio:'Visio',presentiel:'En personne'};
const defaults={search:'',stage:'',owner:'',source:'',overdue:false,sort:'name',desc:false};
const storage='oriafen-isolated-crm-v1';
const sendStatus={
 waiting:{label:'En attente de réponse',className:'sendstatus waiting'},
 replied:{label:'Répondu',className:'sendstatus answered'},
 no_response_required:{label:'Information',className:'sendstatus none'},
};
function ClientSendTracking({lead}){
 const [items,setItems]=useState(()=>getClientSends(lead.id));
 const [filter,setFilter]=useState('all');
 const [lastActivity,setLastActivity]=useState(()=>getClientLastActivity(lead.id));
 const refresh=()=>{setItems(getClientSends(lead.id));setLastActivity(getClientLastActivity(lead.id));};
 useEffect(()=>subscribeToClientTracking(refresh),[lead.id]);
 const visible=items.filter(item=>filter==='all'||(filter==='reply'&&item.response)|| (filter==='remind'&&getAdminSendStatus(item).key==='remind'));
 return <section className="detailbox sendtracking"><div className="sendtrackinghead"><div><h3>Suivi des envois client</h3><small>Historique local des messages et fichiers envoyés</small>{lastActivity&&<p className="last-activity">Dernière activité : {lastActivity}</p>}</div><span className="sendcount">{items.length} envoi{items.length>1?'s':''}</span></div><div className="sendfilters">{[['all','Tous'],['remind','À relancer'],['reply','Répondu']].map(([value,label])=><button key={value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{label}</button>)}</div><div className="sendlist">{visible.map(item=>{const status=sendStatus[item.status]||sendStatus.waiting;const adminStatus=getAdminSendStatus(item);const reminderCount=getReminderCount(item);
 // Relance illimitée : le bouton reste disponible tant qu'une action du
 // client est encore attendue, indépendamment du statut dérivé (vu/ouvert)
 // — auparavant conditionné à adminStatus.key==='remind', qui devenait faux
 // dès l'ouverture du message alors même qu'aucune réponse n'était arrivée.
 const canRemind=item.responseRequired&&!item.response;
 return <article className="senditem" key={item.id}><div className="senditemtop"><div><span className={`sender-badge ${item.senderType==='client'?'client':'team'}`}>{item.senderType==='client'?'Client':'Équipe Oriafen'}</span><span className="sendkind">{item.kind}</span><strong>{item.title}</strong></div><small>{item.sentAt}</small></div>{item.message&&<p className="sendmessage">{item.message}</p>}{item.fileName&&<p className="sendfile">{item.fileName}</p>}<div className="send-meta"><span className={status.className}>{status.label}</span><span className={`adminstatus ${adminStatus.key}`}>{adminStatus.label}</span>{item.important&&<span className="important-badge">Important</span>}</div><div className="senddates"><span>Vu : {item.seenAt||'—'}</span><span>Ouvert : {item.openedAt||'—'}</span><span>Réponse : {item.repliedAt||'—'}</span></div>{item.response&&<div className="sendreply"><small><span className="sender-badge client">Client</span> Réponse reçue · {item.response.respondedAt}</small><p>{item.response.message}</p></div>}{reminderCount>0&&<div className="reminders-history"><small>{reminderCount} relance{reminderCount>1?'s':''} effectuée{reminderCount>1?'s':''} :</small><ul>{item.reminders.map((r,i)=><li key={i}>Relance n°{i+1} — {r.at} · {r.by}</li>)}</ul></div>}{canRemind&&<button className="remind-button" onClick={()=>markClientSendReminded(item.id)}>Relancer{reminderCount>0?` (relance n°${reminderCount+1})`:''}</button>}<button className="important-toggle" onClick={()=>setClientSendImportant(item.id,!item.important)}>{item.important?'Retirer Important':'Marquer Important'}</button></article>})}</div></section>;
}
// Reproduit la structure exacte de AddLeadModal (src/pages/admin/Dashboard.jsx,
// fichier live non modifié, lu seulement comme référence visuelle) : même
// conteneur (fixed inset-0 z-50, backdrop, carte centrée max-w-md), même
// en-tête vert Oriafen, mêmes classes de champs (.input-field), même ordre
// de champs (Source, Prénom/Nom, Téléphone, Email, Ville, Pack, Notes).
// Seule différence : les actions restent 100% locales (setLeads), pas de
// Supabase.
// Champs Pack + tarification partagés entre "Nouveau prospect" et la fiche
// Prospect ("Pack & potentiel") — une seule implémentation, jamais dupliquée.
// packId/pricingMode/discountPercent en entrée, prix de base et prix final
// recalculés à chaque changement (jamais négatif, remise 0-100).
function PackPricingFields({ packId, pricingMode, discountPercent, onChange }) {
  const pack = findPackById(packId)
  const basePrice = basePriceFor(pack, pricingMode)
  const finalPrice = computeFinalPrice(pack, pricingMode, discountPercent)
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Pack intéressé</label>
        {/* Liste plate (aucune catégorie visible), "Nom — prix HT" exact, local only. */}
        <select value={packId} onChange={e => onChange({ packId: e.target.value })} className="input-field text-sm">
          <option value="">Sélectionner un pack...</option>
          {LOCAL_PACKS.map(p => <option key={p.id} value={p.id}>{p.name} — {money(p.priceHt)} HT</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Base tarifaire</label>
          <select value={pricingMode} onChange={e => onChange({ pricingMode: e.target.value })} className="input-field text-sm">
            <option value="ttc">TTC</option>
            <option value="ht">HT</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Remise (%)</label>
          <input type="number" min="0" max="100" value={discountPercent} onChange={e => onChange({ discountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} className="input-field text-sm" />
        </div>
      </div>
      {pack && (
        <div className="rounded-lg bg-orias-bg border border-orias-border p-3 text-xs text-gray-600 space-y-1">
          <div className="flex justify-between"><span>Prix initial</span><strong>{money(basePrice)} {pricingMode.toUpperCase()}</strong></div>
          <div className="flex justify-between"><span>Remise</span><strong>{discountPercent}%</strong></div>
          <div className="flex justify-between text-orias-green font-bold pt-1 border-t border-orias-border/60 mt-1"><span>Prix final</span><strong>{money(finalPrice)} {pricingMode.toUpperCase()}</strong></div>
        </div>
      )}
    </>
  )
}

function NewProspectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ source: sources[0], prenom: '', nom: '', phone: '', email: '', city: '', packId: LOCAL_PACKS[0]?.id || '', pricingMode: 'ttc', discountPercent: 0, message: '', owner: owners[0] })
  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const updatePricing = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const prenom = form.prenom.trim(), nom = form.nom.trim()
    const fullName = `${prenom} ${nom}`.trim() || form.email || form.phone || 'Prospect sans nom'
    const message = form.message.trim()
    const pack = findPackById(form.packId)
    const basePrice = basePriceFor(pack, form.pricingMode)
    const finalPrice = computeFinalPrice(pack, form.pricingMode, form.discountPercent)
    const lead = {
      ...seed()[0],
      id: Date.now(),
      name: fullName,
      email: form.email || '',
      phone: form.phone || 'Non renseigné',
      city: form.city || '',
      pack: pack?.name || '',
      packId: form.packId,
      pricingMode: form.pricingMode,
      discountPercent: form.discountPercent,
      basePrice,
      finalPrice,
      message,
      stage: 'Nouveau',
      owner: form.owner,
      value: 0,
      source: form.source || 'Autre',
      due: today,
      done: false,
      appointments: [],
      tasks: [],
      activity: [{ text: message ? `Message initial : ${message}` : 'Prospect créé localement', at: formatNowLabel() }],
    }
    onCreated(lead)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-orias-green px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <h3 className="font-bold text-white text-lg">Ajouter un prospect manuellement</h3>
          <button onClick={onClose} className="text-green-300 hover:text-white">✕</button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Source *</label>
              <select value={form.source} onChange={e => update('source', e.target.value)} className="input-field text-sm">
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Prénom</label>
                <input value={form.prenom} onChange={e => update('prenom', e.target.value)} className="input-field text-sm" placeholder="Prénom" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nom</label>
                <input value={form.nom} onChange={e => update('nom', e.target.value)} className="input-field text-sm" placeholder="Nom" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">WhatsApp / Téléphone</label>
              <input value={form.phone} onChange={e => update('phone', e.target.value)} className="input-field text-sm" placeholder="+212 6XX XXX XXX" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-field text-sm" placeholder="email@exemple.com" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Ville</label>
              <input value={form.city} onChange={e => update('city', e.target.value)} className="input-field text-sm" placeholder="Casablanca, Rabat..." />
            </div>

            <PackPricingFields packId={form.packId} pricingMode={form.pricingMode} discountPercent={form.discountPercent} onChange={updatePricing} />

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Notes / Message</label>
              <textarea value={form.message} onChange={e => update('message', e.target.value)} rows={3} className="input-field text-sm resize-none" placeholder="Notes sur ce prospect, contexte de la conversation..." />
            </div>

            {/* Champ local supplémentaire (absent du live) — conservé après les
                champs live, comme demandé, sans remplacer aucun d'entre eux. */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Responsable</label>
              <select value={form.owner} onChange={e => update('owner', e.target.value)} className="input-field text-sm">
                {owners.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <button type="submit" className="btn-gold w-full">Ajouter ce prospect</button>
          </form>
        </div>
      </div>
    </div>
  )
}

const LOCAL_SEND_STATUS = {
 waiting: { label: 'En attente de réponse', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
 replied: { label: 'Répondu', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
 no_response_required: { label: 'Information', cls: 'bg-orias-bg text-gray-600 border-orias-border' },
}

// Reprend exactement le markup/style de LocalTrackedCommunications dans
// src/pages/student/Support.jsx (composant officiel déjà branché sur ce même
// clientTrackingStore) — fichier live non modifié, uniquement dupliqué ici.
function LocalTrackedCommunications({ items, drafts, setDrafts, sendingId, sendReply, onOpenFile }) {
 return (
  <div className="space-y-3">
   {items.map(item => {
    const status = LOCAL_SEND_STATUS[item.status] || LOCAL_SEND_STATUS.waiting
    return (
     <article key={item.id} className="rounded-2xl border border-[#e8e2d6] bg-white p-5 space-y-3 shadow-[0_4px_18px_rgba(26,61,43,0.04)]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
       <div className="min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orias-gold">{item.kind}</span>
        <h3 className="font-bold text-orias-green mt-1">{item.title}</h3>
       </div>
       <time className="text-xs text-gray-400 flex-shrink-0">{item.sentAt}</time>
      </div>
      {item.message && <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.message}</p>}
      {item.fileName && (
       <button type="button" onClick={() => onOpenFile(item)} className="inline-flex items-center gap-2 rounded-xl bg-orias-bg border border-orias-border px-3 py-2 text-sm font-medium text-orias-green hover:bg-orias-green/10 transition-colors">
        <span className="text-orias-gold" aria-hidden="true">▣</span>{item.fileName}
       </button>
      )}
      <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${status.cls}`}>{status.label}</span>
      {item.response && (
       <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
        <p className="text-xs text-emerald-700 font-semibold mb-1">Votre réponse · {item.response.respondedAt}</p>
        <p className="text-sm text-emerald-900 whitespace-pre-wrap">{item.response.message}</p>
       </div>
      )}
      {item.responseRequired && item.status !== 'replied' && (
       <div className="border-t border-orias-border pt-3">
        <textarea
         value={drafts[item.id] || ''}
         onChange={e => setDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
         rows={2}
         className="input-field text-sm resize-none border-[#e8e2d6] focus:border-orias-gold"
         placeholder="Écrire une réponse à l'équipe…"
        />
        <button
         onClick={() => sendReply(item)}
         disabled={sendingId === item.id || !(drafts[item.id] || '').trim()}
         className="btn-green mt-2 text-sm shadow-sm disabled:opacity-50"
        >
         {sendingId === item.id ? 'Envoi…' : 'Répondre'}
        </button>
       </div>
      )}
     </article>
    )
   })}
  </div>
 )
}

function ClientSpace({onBack}){
 const clientId=6;
 const [items,setItems]=useState(()=>getClientSends(clientId));
 const [drafts,setDrafts]=useState({});
 const [sending,setSending]=useState(null);
 const sessionDismissKey='oriafen-client-important-dismissed-v1';
 const dismissedForSession=()=>{try{return JSON.parse(sessionStorage.getItem(sessionDismissKey)||'[]')}catch{return[]}};
 const getPopupItems=()=>getImportantUnseen(clientId).filter(item=>!dismissedForSession().includes(item.id));
 const [popupItems,setPopupItems]=useState(getPopupItems);
 const [activeTab,setActiveTab]=useState('dossier');
 const refreshClientTracking=()=>{setItems(getClientSends(clientId));};
 useEffect(()=>subscribeToClientTracking(refreshClientTracking),[]);
 useEffect(()=>{logActivity(clientId,{author:'Client',action:"Connexion à l'espace client"})},[]);
 useEffect(()=>{items.filter(item=>!item.important&&!item.seenAt).forEach(item=>markClientSendSeen(item.id));},[]);
 useEffect(()=>{setPopupItems(getPopupItems())},[items]);
 function openFile(item){markClientSendOpened(item.id);setItems(getClientSends(clientId));setActiveTab('documents');}
 function dismissPopup(){
  const dismissed=new Set(dismissedForSession());
  popupItems.forEach(item=>dismissed.add(item.id));
  sessionStorage.setItem(sessionDismissKey,JSON.stringify([...dismissed]));
  setPopupItems([]);
 }
 function viewImportant(){
  // Équivalent local de link_tab : un popup important de type document (ex:
  // rejet de document) doit ouvrir Documents, pas Mes échanges.
  const target=popupItems[0]?.type==='document'?'documents':'support';
  popupItems.forEach(item=>markClientSendSeen(item.id));
  setPopupItems([]);
  setActiveTab(target);
 }
 function sendReply(item){
  const message=(drafts[item.id]||'').trim();
  if(!message||sending===item.id||item.status==='replied')return;
  setSending(item.id);
  if(replyToClientSend(item.id,message))setDrafts(prev=>({...prev,[item.id]:''}));
  setSending(null);
 }
 const nav=[['dossier','Mon Dossier'],['marketing','Mon site & communication'],['formation','Formation IAS1'],['commercial','Vente & Scripts'],['documents','Documents'],['support','Mes échanges']];
 const clientName='Client Démo';
 const clientPack='Pack Accélération';
 const initials=clientName.split(' ').map(n=>n[0]).join('').slice(0,2);

 // Header/nav/footer ci-dessous reproduisent exactement (mêmes styles inline)
 // src/pages/student/Dashboard.jsx — fichier live non modifié, uniquement dupliqué ici.
 return (
  <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:"'Montserrat', sans-serif"}}>
   <style>{`
     .nav-btn { background:none; border:none; cursor:pointer; padding:8px 16px; border-radius:10px; font-size:13px; font-weight:500; font-family:'Montserrat',sans-serif; transition:all 0.2s; white-space:nowrap; letter-spacing:0.3px; }
     .nav-btn:hover { background:rgba(255,255,255,0.15) !important; color:#fff !important; }
     .nav-btn-active { background:linear-gradient(135deg,#c9a84c,#b8960a) !important; color:#1a3d2b !important; font-weight:700 !important; box-shadow:0 2px 12px rgba(201,168,76,0.35) !important; }
     .nav-btn-inactive { color:rgba(255,255,255,0.7) !important; }
     .logout-btn:hover { color:#fff !important; background:rgba(255,255,255,0.1) !important; }
   `}</style>

   <header style={{
     background:'linear-gradient(135deg, #1a3d2b 0%, #0d2818 100%)',
     position:'sticky', top:0, zIndex:40,
     boxShadow:'0 4px 30px rgba(0,0,0,0.25)',
     borderBottom:'1px solid rgba(201,168,76,0.15)',
   }}>
    <div style={{height:'2px', background:'linear-gradient(90deg, transparent, #c9a84c 30%, #f0d080 50%, #c9a84c 70%, transparent)'}} />
    <div style={{maxWidth:'1280px', margin:'0 auto', padding:'0 1.5rem'}}>
     <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px'}}>
      <div style={{display:'flex', alignItems:'center'}}>
       <Logo size="sm" variant="dark" />
      </div>
      <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
       <LocalNotificationBell clientId={clientId} onNavigate={setActiveTab} dark />
       <div style={{textAlign:'right', display:'flex', flexDirection:'column'}}>
        <span style={{color:'#fff', fontWeight:'600', fontSize:'13px', fontFamily:"'Montserrat', sans-serif"}}>{clientName}</span>
        <span style={{color:'#c9a84c', fontSize:'11px', fontFamily:"'Montserrat', sans-serif", fontWeight:'400'}}>Pack {clientPack}</span>
       </div>
       <div style={{width:'38px', height:'38px', borderRadius:'50%', background:'rgba(201,168,76,0.15)', border:'2px solid rgba(201,168,76,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'700', color:'#c9a84c', flexShrink:0, fontFamily:"'Montserrat', sans-serif"}}>
        {initials}
       </div>
       <button onClick={onBack} className="logout-btn"
        style={{display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.5)', background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'7px 12px', cursor:'pointer', fontSize:'12px', fontFamily:"'Montserrat', sans-serif", transition:'all 0.2s'}}>
        <LogoutIcon className="w-4 h-4" />
        <span>Déconnexion</span>
       </button>
      </div>
     </div>
    </div>

    <div style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
     <div style={{maxWidth:'1280px', margin:'0 auto', padding:'0 1.5rem'}}>
      <nav style={{display:'flex', gap:'4px', padding:'8px 0', overflowX:'auto'}}>
       {nav.map(([id,label]) => (
        <button key={id} onClick={()=>setActiveTab(id)}
         className={`nav-btn ${activeTab===id?'nav-btn-active':'nav-btn-inactive'}`}>
         {label}
        </button>
       ))}
      </nav>
     </div>
    </div>
   </header>

   <main style={{maxWidth:'1280px', margin:'0 auto', padding:'2rem 1.5rem'}}>
    <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px', fontSize:'12px', fontFamily:"'Montserrat', sans-serif"}}>
     <span style={{color:'#9ca3af'}}>Tableau de bord</span>
     <span style={{color:'#d1d5db'}}>/</span>
     <span style={{color:'#c49a2a', fontWeight:'600'}}>{nav.find(([id])=>id===activeTab)?.[1]}</span>
    </div>

    {activeTab==='dossier' ? (
     <LocalMonDossier />
    ) : activeTab==='documents' ? (
     <LocalMesDocuments clientId={clientId} />
    ) : activeTab==='support' ? (
     <section>
      <div style={{
       background:'linear-gradient(135deg, #3d604d 0%, #1a3d2b 100%)',
       borderRadius:'20px', padding:'30px 34px',
       boxShadow:'0 4px 24px rgba(26,61,43,0.14)',
       border:'1px solid rgba(201,168,76,0.18)',
      }}>
       <div style={{height:'2px', background:'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginBottom:'22px', borderRadius:'2px'}} />
       <p style={{margin:0, color:'#c9a84c', fontSize:'10px', fontWeight:700, letterSpacing:'1.6px', textTransform:'uppercase', fontFamily:"'Montserrat', sans-serif"}}>Espace client</p>
       <h2 style={{margin:'8px 0 6px', color:'#fff', fontSize:'30px', fontWeight:400, letterSpacing:'0.5px', fontFamily:"'Cormorant Garamond', Georgia, serif"}}>Mes échanges</h2>
       <p style={{margin:0, color:'rgba(255,255,255,0.68)', fontSize:'13px', fontWeight:300, fontFamily:"'Montserrat', sans-serif"}}>Retrouvez ici vos messages, documents et réponses avec l’équipe Oriafen.</p>
       <p style={{margin:'16px 0 0', color:'rgba(255,255,255,0.42)', fontSize:'10px', fontFamily:"'Montserrat', sans-serif"}}>Démonstration locale · données fictives</p>
      </div>
      <div style={{marginTop:'22px'}}>
       <LocalTrackedCommunications items={items} drafts={drafts} setDrafts={setDrafts} sendingId={sending} sendReply={sendReply} onOpenFile={openFile} />
      </div>
     </section>
    ) : (
     <div className="card p-10 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-bold text-orias-green mb-2">{nav.find(([id])=>id===activeTab)?.[1]}</h1>
      <p className="text-sm text-gray-500">Cette section est disponible dans l’espace client local.</p>
      <button onClick={()=>setActiveTab('support')} className="btn-outline-green mt-5">Voir Mes échanges</button>
     </div>
    )}
   </main>

   <footer style={{borderTop:'1px solid #e8e2d6', marginTop:'3rem', padding:'1.5rem', background:'#fff'}}>
    <div style={{maxWidth:'1280px', margin:'0 auto', padding:'0 1.5rem', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'16px'}}>
     <Logo size="sm" variant="light" />
     <p style={{fontSize:'11px', color:'#9ca3af', margin:0, fontFamily:"'Montserrat', sans-serif"}}>© 2026 Oriafen Academy · Tous droits réservés</p>
    </div>
   </footer>

   {popupItems.length>0 && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
     <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="bg-orias-green px-6 py-5">
       <h3 className="font-bold text-white text-lg">Vous avez reçu un nouvel élément important</h3>
      </div>
      <div className="p-6 space-y-4 text-center">
       <p className="text-sm text-gray-700">
        {popupItems.length===1 ? popupItems[0].title : `${popupItems.length} nouveaux éléments importants`}
       </p>
       {popupItems.length===1 && popupItems[0].sentAt && (
        <p className="text-xs text-gray-400">{popupItems[0].sentAt}</p>
       )}
       <div className="flex gap-3">
        <button onClick={dismissPopup} className="flex-1 btn-outline-green">Plus tard</button>
        <button onClick={viewImportant} className="flex-1 btn-gold">Voir maintenant</button>
       </div>
      </div>
     </div>
    </div>
   )}
  </div>
 )
}
export default function LocalCRM({mode='admin',onEnterClient=()=>{},onExitClient=()=>{},presetRequest=null}){
 const [leads,setLeads]=useState(()=>{try{const raw=JSON.parse(localStorage.getItem(storage));return raw&&raw.length?normalizeLeadsStage(raw):seed()}catch{return seed()}});
 const [filter,setFilter]=useState(defaults),[view,setView]=useState('Liste'),[selected,setSelected]=useState(null),[note,setNote]=useState(''),[saved,setSaved]=useState('Tous les prospects'),[creating,setCreating]=useState(false),[toast,setToast]=useState('');
 const [newApptDate,setNewApptDate]=useState(''),[newApptType,setNewApptType]=useState('appel'),[newTaskTitle,setNewTaskTitle]=useState(''),[newTaskDue,setNewTaskDue]=useState('');
 const [notesDraft,setNotesDraft]=useState('');
 const [editingInfo,setEditingInfo]=useState(false),[infoName,setInfoName]=useState(''),[infoEmail,setInfoEmail]=useState(''),[infoPhone,setInfoPhone]=useState(''),[infoCity,setInfoCity]=useState('');
 const board=useRef(null),close=useRef(null),opener=useRef(null); const lead=leads.find(l=>l.id===selected),rows=selectLeads(leads,filter);
 useEffect(()=>{localStorage.setItem(storage,JSON.stringify(leads))},[leads]);
 // Requête de préréglage venant d'une carte KPI du shell admin (voir
 // LocalAdminShell.jsx) : réutilise le preset() existant plus bas — aucune
 // nouvelle logique de filtrage, juste un déclenchement externe.
 useEffect(()=>{if(presetRequest?.preset)preset(presetRequest.preset)},[presetRequest]);
 useEffect(()=>{
  // Ce polling suppose un backend WhatsApp local (server/, voir .gitignore)
  // lancé sur la machine du développeur — jamais accessible depuis un
  // déploiement hébergé (Vercel Preview). Le try/catch plus bas rend déjà
  // l'échec silencieux, mais on évite ici toute tentative réseau hors
  // localhost : aucune connexion vers un quelconque backend "live" ne doit
  // jamais partir du navigateur sur une Preview.
  if (!['localhost','127.0.0.1','[::1]'].includes(location.hostname)) return;
  let cancelled=false;
  async function pollWhatsappLeads(){
   try{
    const res=await fetch('http://127.0.0.1:3001/api/leads');
    if(!res.ok||cancelled)return;
    const data=await res.json();
    const waLeads=(data.leads||[]).filter(l=>l.source==='whatsapp');
    if(!waLeads.length||cancelled)return;
    setLeads(prev=>{
     let changed=false;
     const next=[...prev];
     waLeads.forEach(wl=>{
      const idx=next.findIndex(l=>l.whatsappId&&l.whatsappId===wl.whatsappId);
      if(idx===-1){
       changed=true;
       const nextId=next.reduce((m,l)=>Math.max(m,l.id),0)+1;
       next.push({
        id:nextId,name:wl.name||wl.phone||'Contact WhatsApp',email:'',phone:wl.phone||'',
        whatsappId:wl.whatsappId,city:'',stage:'Nouveau',owner:'Non attribué',source:'WhatsApp',
        value:0,pack:'Essentiel',due:(wl.lastMessageAt||wl.createdAt||new Date().toISOString()).slice(0,10),
        action:'Répondre au message WhatsApp',done:false,
        lastMessage:wl.lastMessage,lastMessageAt:wl.lastMessageAt,
        activity:[{text:`Lead créé automatiquement depuis WhatsApp — "${wl.firstMessage||wl.lastMessage||''}"`,at:new Date().toLocaleString('fr-FR')}],
       });
      }else if(next[idx].lastMessage!==wl.lastMessage){
       changed=true;
       next[idx]={...next[idx],lastMessage:wl.lastMessage,lastMessageAt:wl.lastMessageAt};
      }
     });
     return changed?next:prev;
    });
   }catch{
    // Backend WhatsApp local non lancé — ignoré silencieusement (fonctionnalité optionnelle).
   }
  }
  pollWhatsappLeads();
  const timer=setInterval(pollWhatsappLeads,4000);
  return()=>{cancelled=true;clearInterval(timer)};
 },[]);
 useEffect(()=>{if(!lead&&!creating)return;close.current?.focus();function key(e){if(e.key==='Escape'){setSelected(null);setCreating(false)}if(e.key==='Tab'){const els=[...document.querySelectorAll('[role="dialog"] button,[role="dialog"] input,[role="dialog"] select,[role="dialog"] textarea')];const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);opener.current?.focus()}},[selected,creating]);
 function patch(id,data,event){setLeads(prev=>prev.map(l=>l.id===id?{...l,...data,activity:event?[{text:event,at:formatNowLabel()},...l.activity]:l.activity}:l));if(data.stage)logActivity(id,{author:'Équipe',action:'Étape du parcours modifiée',detail:data.stage})}
 // RDV / tâches locales sur la fiche prospect (absentes du modèle local avant
 // cette session) — mêmes champs que live (lead_appointments/lead_tasks dans
 // src/lib/api.js : scheduledAt+type, title+dueAt), mais stockées sur l'objet
 // lead lui-même (localStorage) plutôt que dans une table séparée.
 function addAppointment(id,{scheduledAt,type}){if(!scheduledAt)return;setLeads(prev=>prev.map(l=>l.id===id?{...l,appointments:[...(l.appointments||[]),{id:Date.now(),scheduledAt,type,status:'planifie'}],activity:[{text:`RDV planifié (${APPOINTMENT_TYPE_LABELS[type]||type}) — ${scheduledAt}`,at:formatNowLabel()},...l.activity]}:l))}
 function addTask(id,{title,dueAt}){if(!title?.trim())return;setLeads(prev=>prev.map(l=>l.id===id?{...l,tasks:[...(l.tasks||[]),{id:Date.now(),title:title.trim(),dueAt:dueAt||null,done:false}],activity:[{text:`Tâche ajoutée : ${title.trim()}`,at:formatNowLabel()},...l.activity]}:l))}
 function toggleTaskDone(id,taskId){setLeads(prev=>prev.map(l=>l.id===id?{...l,tasks:(l.tasks||[]).map(t=>t.id===taskId?{...t,done:!t.done}:t)}:l))}
 // Reproduit handleConvert (src/pages/admin/Dashboard.jsx, lecture seule) :
 // passer stage='Client' via le select ci-dessus est un simple changement de
 // statut, TOUJOURS possible — mais ne crée pas le compte/dossier. Seule
 // cette action explicite (bouton "Valider le paiement & créer le compte")
 // exécute réellement la conversion (voir src/local/conversion.js).
 function validatePayment(id){setLeads(prev=>applyPaymentValidation(prev,id))}
 function open(l,e){opener.current=e.currentTarget;setNote('');setNewApptDate('');setNewApptType('appel');setNewTaskTitle('');setNewTaskDue('');setNotesDraft(l.notes||'');setEditingInfo(false);setSelected(l.id)}
 function change(k,v){setFilter(f=>({...f,[k]:v}));setSaved('Personnalisée')}
 function preset(label){setSaved(label);setFilter({...defaults,...(label==='À relancer en retard'?{overdue:true}:label==='Mes prospects'?{owner:owners[0]}:{})})}
 function sort(k){setFilter(f=>({...f,sort:k,desc:f.sort===k?!f.desc:false}))}
 const count=s=>leads.filter(l=>l.stage===s).length;
 if(mode==='client')return <ClientSpace onBack={onExitClient}/>;
 return <div className="oriafenlocal"><main><div className="demo"><span>● Démonstration locale · données fictives</span><span>Modifications enregistrées sur ce navigateur</span></div><header><div><div className="eyebrow">RELATION CLIENT</div><h1>Votre pipeline commercial</h1><p>Les bonnes priorités, au bon moment.</p></div><div className="header-actions"><button className="client-switch" onClick={onEnterClient}>Voir l'espace client</button><button className="primary" onClick={e=>{opener.current=e.currentTarget;setCreating(true)}}>＋ Nouveau prospect</button></div></header><section className="metrics" aria-label="Indicateurs CRM"><article><span>Prospects</span><strong>{leads.length}</strong><small>Toutes les étapes</small></article><article><span>Potentiel ouvert</span><strong>{money(leads.filter(l=>!['Client','Perdu'].includes(l.stage)).reduce((n,l)=>n+l.value,0))}</strong><small>Hors clients et prospects perdus</small></article><article><span>Actions en retard</span><strong>{leads.filter(l=>!l.done&&l.due<today).length}</strong><small>À traiter en priorité</small></article><article><span>Conversion</span><strong>{leads.length?Math.round(count('Client')/leads.length*100):0}%</strong><small>{count('Client')} clients sur {leads.length} prospects</small></article></section>
 <section className="stagebar" aria-label="Répartition par étape">{stages.map((s,i)=><button key={s} className={'stagechip '+(count(s)?'':'zero ')+(filter.stage===s?'chosen':'')} onClick={()=>change('stage',filter.stage===s?'':s)}><i className={'dot d'+i}/><span>{s}</span><b>{count(s)}</b></button>)}<div className="sources"><span>Sources</span>{sources.filter(s=>leads.some(l=>l.source===s)).map(s=><span key={s}>{s} <b>{leads.filter(l=>l.source===s).length}</b></span>)}</div></section>
 <section className="panel"><div className="paneltop"><div className="saved">{['Tous les prospects','À relancer en retard','Mes prospects'].map(s=><button className={saved===s?'active':''} key={s} onClick={()=>preset(s)}>{s}</button>)}</div><div className="views">{['Liste','Kanban','Agenda','Calendrier'].map(v=><button key={v} className={view===v?'active':''} onClick={()=>setView(v)}>{v}</button>)}</div></div><div className="filters"><input aria-label="Rechercher" placeholder="Rechercher un nom, un email, une ville…" value={filter.search} onChange={e=>change('search',e.target.value)}/>{[['stage','Toutes les étapes',stages],['owner','Tous les responsables',owners],['source','Toutes les sources',sources]].map(([key,label,items])=><select aria-label={label} key={key} value={filter[key]} onChange={e=>change(key,e.target.value)}><option value="">{label}</option>{items.map(x=><option key={x}>{x}</option>)}</select>)}<label className="check"><input type="checkbox" checked={filter.overdue} onChange={e=>change('overdue',e.target.checked)}/>En retard</label><button onClick={()=>preset('Tous les prospects')}>Réinitialiser</button></div><div className="results"><span>{rows.length} prospect{rows.length!==1?'s':''} · {saved}</span><span>Cliquer sur un prospect pour ouvrir sa fiche</span></div>
 {rows.length===0?<div className="empty"><h3>Aucun prospect ne correspond</h3><p>Essayez une autre recherche ou réinitialisez les filtres.</p><button onClick={()=>preset('Tous les prospects')}>Voir tous les prospects</button></div>:view==='Liste'?<div className="tablewrap"><table><thead><tr>{[['name','Prospect'],['stage','Étape'],['source','Source'],['owner','Responsable'],['value','Potentiel'],['due','Prochaine action']].map(([k,t])=><th key={k} aria-sort={filter.sort===k?(filter.desc?'descending':'ascending'):'none'}><button onClick={()=>sort(k)}>{t} {filter.sort===k?(filter.desc?'↓':'↑'):'↕'}</button></th>)}</tr></thead><tbody>{rows.map(l=><tr key={l.id}><td><button className="person" onClick={e=>open(l,e)}><span className="avatar">{l.name.slice(0,2).toUpperCase()}</span><span><b>{l.name}</b><small>{l.email}</small></span></button></td><td><span className="status"><i className={'dot d'+stages.indexOf(l.stage)}/>{l.stage}</span></td><td>{l.source}</td><td>{l.owner}</td><td className="amount">{money(l.value)}</td><td><button className={'action '+(!l.done&&l.due<today?'late':'')} onClick={e=>open(l,e)}>{l.done?'✓ Terminée':l.action}<small>{l.due}{!l.done&&l.due<today?' · En retard':''}</small></button></td></tr>)}</tbody></table></div>:view==='Kanban'?<><div className="boardnav"><span>{stages.length} étapes · faites défiler horizontalement pour explorer le pipeline</span><div><button aria-label="Étapes précédentes" onClick={()=>board.current.scrollBy({left:-600,behavior:'smooth'})}>←</button><button aria-label="Étapes suivantes" onClick={()=>board.current.scrollBy({left:600,behavior:'smooth'})}>→</button></div></div><div className="board" ref={board}>{stages.map((s,i)=>{const colLeads=rows.filter(l=>l.stage===s);const total=colLeads.reduce((n,l)=>n+l.value,0);const weighted=total*STAGE_WEIGHTS[i];return <section className="column" key={s}><div className="column-head"><h3><i className={'dot d'+i}/><span>{s}</span><b>{colLeads.length}</b></h3></div><div className="column-body">{colLeads.map(l=><button className="leadcard" key={l.id} onClick={e=>open(l,e)}><b>{l.name}</b><small>{l.source} · {l.owner}</small><strong>{money(l.value)}</strong><div className={!l.done&&l.due<today?'late':''}>{l.done?'✓ Terminée':l.action}<small>{l.due}</small></div></button>)}{!colLeads.length&&<p className="muted">Aucun prospect</p>}</div>{total>0&&<div className="column-foot"><div><b>{money(total)}</b> · Potentiel total</div><div><b>{money(weighted)}</b> · Pondéré ({Math.round(STAGE_WEIGHTS[i]*100)}%)</div></div>}</section>})}</div></>:<div className={view==='Calendrier'?'calendar':'agenda'}>{[...new Set(rows.map(l=>l.due))].sort().map(d=><section key={d}><h3>{new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</h3>{rows.filter(l=>l.due===d).map(l=><button key={l.id} onClick={e=>open(l,e)}><b>{l.name}</b><span>{l.done?'✓ Terminée':l.action}</span><small>{l.owner}</small></button>)}</section>)}</div>}</section><footer>Oriafen CRM · Aperçu isolé · Aucun envoi d’email ni synchronisation externe</footer></main>
 {creating && <NewProspectModal onClose={()=>setCreating(false)} onCreated={l=>{setLeads([...leads,l]);setCreating(false);setSelected(l.id)}} />}
{lead && <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
 <section className="drawer" role="dialog" aria-modal="true" aria-label={lead.name}>
  <div className="drawerhead">
   <div>
    <small>FICHE PROSPECT</small>
    <h2>{lead.name}</h2>
    <span style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'6px',flexWrap:'wrap'}}>
     <b style={{background:SOURCE_BADGE_STYLES[lead.source]||SOURCE_BADGE_STYLES['Autre'],color:SOURCE_BADGE_TEXT[lead.source]||SOURCE_BADGE_TEXT['Autre'],borderRadius:'999px',padding:'2px 9px',fontSize:'10px',fontWeight:700}}>{lead.source}</b>
     <b style={{background:'#e3eadf',color:'#2f5038',borderRadius:'999px',padding:'2px 9px',fontSize:'10px',fontWeight:700}}>{lead.stage}</b>
     {lead.city}
    </span>
   </div>
   <button ref={close} aria-label="Fermer la fiche" onClick={()=>setSelected(null)}>✕</button>
  </div>
  <div className="drawergrid">
   <div>
    {lead.message && <section className="detailbox">
     <h3>Message du lead</h3>
     <p style={{fontSize:'12px',lineHeight:'1.6',color:'#3c4f42',whiteSpace:'pre-wrap',margin:0}}>{lead.message}</p>
    </section>}

    <section className="detailbox">
     <h3>Rendez-vous</h3>
     {!(lead.appointments||[]).length && <p className="muted">Aucun rendez-vous planifié.</p>}
     <div className="timeline">
      {(lead.appointments||[]).map(a=><article key={a.id}><i/><div><p>{APPOINTMENT_TYPE_LABELS[a.type]||a.type}</p><small>{a.scheduledAt}</small></div></article>)}
     </div>
     <div className="twocol">
      <label>Date/heure<input type="datetime-local" value={newApptDate} onChange={e=>setNewApptDate(e.target.value)}/></label>
      <label>Type<select value={newApptType} onChange={e=>setNewApptType(e.target.value)}>{Object.entries(APPOINTMENT_TYPE_LABELS).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
     </div>
     <button className="primary" disabled={!newApptDate} onClick={()=>{addAppointment(lead.id,{scheduledAt:newApptDate,type:newApptType});setNewApptDate('')}}>Planifier le RDV</button>
    </section>

    <section className="detailbox">
     <h3>Tâches</h3>
     {!(lead.tasks||[]).length && <p className="muted">Aucune tâche.</p>}
     <div style={{display:'flex',flexDirection:'column',gap:'8px',margin:'10px 0'}}>
      {(lead.tasks||[]).map(t=><label key={t.id} style={{display:'flex',alignItems:'center',gap:'8px',flexDirection:'row',margin:0}}><input type="checkbox" checked={t.done} onChange={()=>toggleTaskDone(lead.id,t.id)}/><span style={{textDecoration:t.done?'line-through':'none',flex:1,fontSize:'12px'}}>{t.title}</span>{t.dueAt && <small>{t.dueAt}</small>}</label>)}
     </div>
     <div className="twocol">
      <label>Titre<input value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)}/></label>
      <label>Échéance<input type="date" value={newTaskDue} onChange={e=>setNewTaskDue(e.target.value)}/></label>
     </div>
     <button className="primary" disabled={!newTaskTitle.trim()} onClick={()=>{addTask(lead.id,{title:newTaskTitle,dueAt:newTaskDue});setNewTaskTitle('');setNewTaskDue('')}}>Ajouter la tâche</button>
    </section>

    <section className="detailbox">
     <h3>Notes internes</h3>
     <textarea aria-label="Notes internes" placeholder="Notes générales sur ce prospect…" value={notesDraft} onChange={e=>setNotesDraft(e.target.value)}/>
     <button className="primary" disabled={notesDraft===(lead.notes||'')} onClick={()=>patch(lead.id,{notes:notesDraft})}>Enregistrer les notes</button>
    </section>

    <section className="detailbox history">
     <h3>Historique d'activité</h3>
     <form onSubmit={e=>{e.preventDefault();if(note.trim()){patch(lead.id,{},note.trim());setNote('')}}}>
      <input aria-label="Ajouter un commentaire à l'historique" placeholder="Ajouter un commentaire à l'historique..." value={note} onChange={e=>setNote(e.target.value)} required/>
      <button disabled={!note.trim()}>Ajouter</button>
     </form>
     <div className="timeline">
      {buildLeadTimeline(lead).map(ev=><article key={ev.key}><i/><div><p>{ev.action}{ev.detail?` — ${ev.detail}`:''}</p><small>{ev.display||'Non renseigné'}</small></div></article>)}
     </div>
    </section>
   </div>
   <div>
    <section className="detailbox">
     <h3>Statut</h3>
     <select value={lead.stage} onChange={e=>patch(lead.id,{stage:e.target.value},'Étape : '+e.target.value)}>{stages.map(s=><option key={s}>{s}</option>)}</select>
    </section>

    <section className="detailbox">
     <h3>Actions rapides</h3>
     <div className="twocol">
      <button onClick={()=>patch(lead.id,{},'Appel effectué')}>📞 Logger un appel</button>
      <button onClick={()=>patch(lead.id,{},'Email envoyé')}>✉️ Logger un email</button>
     </div>
    </section>

    <section className="detailbox contact">
     <h3>Coordonnées</h3>
     {editingInfo?<>
      <label>Nom complet<input value={infoName} onChange={e=>setInfoName(e.target.value)}/></label>
      <label>Email<input type="email" value={infoEmail} onChange={e=>setInfoEmail(e.target.value)}/></label>
      <label>Téléphone<input value={infoPhone} onChange={e=>setInfoPhone(e.target.value)}/></label>
      <label>Ville<input value={infoCity} onChange={e=>setInfoCity(e.target.value)}/></label>
      <div className="twocol">
       <button className="primary" onClick={()=>{patch(lead.id,{name:infoName||lead.name,email:infoEmail,phone:infoPhone,city:infoCity});setEditingInfo(false)}}>Enregistrer</button>
       <button onClick={()=>setEditingInfo(false)}>Annuler</button>
      </div>
     </>:<>
      <small>Email</small><p>{lead.email}</p>
      <small>Téléphone</small><p>{lead.phone}</p>
      <small>Ville</small><p>{lead.city}</p>
      <small>Source</small><p>{lead.source}</p>
      <small>Pack intéressé</small><p>{lead.pack||'Non renseigné'}</p>
      <button onClick={()=>{setInfoName(lead.name);setInfoEmail(lead.email);setInfoPhone(lead.phone);setInfoCity(lead.city);setEditingInfo(true)}}>✎ Modifier les infos</button>
     </>}
    </section>

    <section className="detailbox">
     <h3>Pack & potentiel</h3>
     <PackPricingFields packId={lead.packId||''} pricingMode={lead.pricingMode||'ttc'} discountPercent={lead.discountPercent||0} onChange={changes=>{const merged={packId:lead.packId,pricingMode:lead.pricingMode||'ttc',discountPercent:lead.discountPercent||0,...changes};const pk=findPackById(merged.packId);patch(lead.id,{packId:merged.packId,pack:pk?.name||lead.pack,pricingMode:merged.pricingMode,discountPercent:merged.discountPercent,basePrice:basePriceFor(pk,merged.pricingMode),finalPrice:computeFinalPrice(pk,merged.pricingMode,merged.discountPercent)})}} />
     {/* Potentiel commercial : distinct du prix du pack (valeur pondérée du deal, éditable indépendamment) */}
     <label>Potentiel (DH)<input type="number" min="0" value={lead.value} onChange={e=>patch(lead.id,{value:Math.max(0,Number(e.target.value))})}/></label>
    </section>

    {lead.stage==='Client'&&<section className="detailbox conversion-card">
     {lead.paymentValidated?<>
      <h3>✓ Compte client créé</h3>
      <p className="muted">Premier paiement validé le {lead.convertedAt}. Ce prospect apparaît désormais dans l'onglet Clients.</p>
      {lead.payments?.length>0&&<ul className="payment-rows">{lead.payments.map((p,i)=><li key={i}><span>{p.milestone}</span><b>{money(p.amount)}</b><span className={`paystatus ${p.status}`}>{p.status==='paid'?'Payé':'En attente'}</span></li>)}</ul>}
     </>:<>
      <h3>Valider le premier paiement</h3>
      <p className="muted">Crée le compte client, génère les paiements ({lead.packId&&findPackById(lead.packId)?.paymentType==='full'?'100%':'50% / 25% / 25%'}) et marque le premier comme réglé. Tant que cette action n'a pas été effectuée, ce prospect n'apparaît pas dans l'onglet Clients.</p>
      <button className="primary" disabled={!lead.packId} onClick={()=>validatePayment(lead.id)}>{lead.packId?'📌 Valider le paiement & créer le compte':'Sélectionnez un pack ci-dessus'}</button>
     </>}
    </section>}

    <section className="detailbox next">
     <h3>Prochaine action</h3>
     {/* Toute modification de cette section (action/échéance/responsable/
         terminée) alimente automatiquement "Dernière activité" et
         "Historique d'activité" via applyNextActionUpdate — fonction pure
         partagée avec les tests (clientHistory.js), append-only, jamais
         d'écrasement des entrées précédentes. */}
     <label>Action<input value={lead.action} onChange={e=>setLeads(prev=>applyNextActionUpdate(prev,lead.id,'action',e.target.value))}/></label>
     <div className="twocol">
      <label>Échéance<input type="date" value={lead.due} onChange={e=>setLeads(prev=>applyNextActionUpdate(prev,lead.id,'due',e.target.value))}/></label>
      <label>Responsable<select value={lead.owner} onChange={e=>setLeads(prev=>applyNextActionUpdate(prev,lead.id,'owner',e.target.value))}>{owners.map(o=><option key={o}>{o}</option>)}</select></label>
     </div>
     <button className="primary" onClick={()=>setLeads(prev=>applyNextActionUpdate(prev,lead.id,'done',!lead.done))}>{lead.done?'Rouvrir l’action':'✓ Marquer comme terminée'}</button>
    </section>

    <ClientSendTracking lead={lead}/>

    <p className="muted">Les modifications sont enregistrées automatiquement sur ce navigateur.</p>
   </div></div>
 </section>
</div>}
</div>
}
