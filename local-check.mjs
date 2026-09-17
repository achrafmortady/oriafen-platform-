import assert from 'node:assert/strict';
import {seed,selectLeads,stages,today} from './src/local/model.js';
const leads=seed();assert.equal(leads.length,24);assert.equal(stages.length,7);assert.ok(leads.every(l=>l.email.endsWith('@example.invalid')));
// 7 étapes (RDV pris retiré) : 24 leads répartis par i%7 -> Nouveau (remainder 0) sur 4 leads (i=0,7,14,21).
assert.equal(selectLeads(leads,{stage:'Nouveau'}).length,4);
assert.ok(selectLeads(leads,{owner:'Salma Démo',source:'WhatsApp'}).every(l=>l.owner==='Salma Démo'&&l.source==='WhatsApp'));
assert.ok(selectLeads(leads,{overdue:true}).every(l=>l.due<today&&!l.done));
assert.equal(selectLeads(leads,{search:'no-such-lead'}).length,0);
const sorted=selectLeads(leads,{sort:'value',desc:true});assert.ok(sorted.every((l,i)=>i===0||sorted[i-1].value>=l.value));
console.log('PASS: synthetic data, stage counts, combined filters, overdue view, empty search, numeric sort');
