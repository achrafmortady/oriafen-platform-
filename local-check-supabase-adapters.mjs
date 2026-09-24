// Vérifie (Node, aucun navigateur, aucun accès réseau) que la nouvelle
// couche src/local/adapters/supabase/* (implémentation "production" réelle,
// écrite lors de l'audit "read-only live schema + local Supabase adapter
// implementation", 2026-09-21) :
//   1. n'exécute AUCUN appel réseau/Supabase à la simple importation,
//   2. refuse tout appel tant que PRODUCTION_ADAPTER_ACTIVE=false,
//   3. n'est JAMAIS importée par la couche Preview (adapters/index.js,
//      identity.js, les 4 adaptateurs locaux, ou tout composant Local*.jsx)
//      — isolation Preview/Production garantie statiquement.
//
// AUCUNE écriture live, AUCUN accès réseau : les fonctions exportées par
// src/lib/api.js elles-mêmes ne font rien tant que isConfigured=false
// (src/lib/supabase.js, non modifié) — ce test vérifie une DEUXIÈME
// barrière indépendante (le guard local à ces fichiers), jamais la seule.
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { readFileSync, readdirSync } from 'node:fs'

register('./local-check-loader.mjs', import.meta.url)

let passed = 0
function check(label, fn) {
  fn()
  passed += 1
  console.log(`  ok - ${label}`)
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = `${dir}/${e.name}`
    if (e.isDirectory()) return walk(p)
    return (e.name.endsWith('.js') || e.name.endsWith('.jsx')) ? [p] : []
  })
}

// ================================================================
// 1. Isolation statique : aucun fichier Preview (src/local, hors le dossier
//    supabase/ lui-même) n'importe src/local/adapters/supabase/* ni
//    src/lib/api.js.
// ================================================================
check('Aucun fichier Preview (src/local, hors adapters/supabase/) n\'importe adapters/supabase/* ni src/lib/api.js', () => {
  const files = walk('./src/local').filter(f => !f.startsWith('./src/local/adapters/supabase/'))
  assert.ok(files.length > 20)
  files.forEach(f => {
    const src = readFileSync(f, 'utf8')
    assert.doesNotMatch(src, /from\s+['"][^'"]*adapters\/supabase[^'"]*['"]/, `${f} ne doit jamais importer adapters/supabase/*`)
    assert.doesNotMatch(src, /from\s+['"][^'"]*\/lib\/api['"]/, `${f} ne doit jamais importer src/lib/api.js`)
  })
})

check('adapters/index.js (barrel Preview) n\'exporte/n\'importe jamais le dossier supabase/', () => {
  const src = readFileSync('./src/local/adapters/index.js', 'utf8')
  assert.doesNotMatch(src, /from\s+['"]\.\/supabase/i, 'aucun import/export ne doit cibler ./supabase/*')
})

// ================================================================
// 2. Chaque fichier adapters/supabase/*.js s'importe sans erreur (aucun
//    appel réseau à l'import) et refuse tout appel tant que
//    PRODUCTION_ADAPTER_ACTIVE=false.
// ================================================================
const { PRODUCTION_ADAPTER_ACTIVE } = await import('./src/local/adapters/supabase/_guard.js')
check('PRODUCTION_ADAPTER_ACTIVE=false (constante codée en dur, jamais lue depuis l\'environnement)', () => {
  assert.equal(PRODUCTION_ADAPTER_ACTIVE, false)
})

const modules = [
  ['crm.supabase.js', 'listLeads', []],
  ['documents.supabase.js', 'getDocuments', ['user-1']],
  ['marketing.supabase.js', 'getStatus', []],
  ['notifications.supabase.js', 'getMine', ['user-1']],
  ['support.supabase.js', 'getAllTickets', []],
  ['formation.supabase.js', 'getProgress', ['user-1']],
  ['dossier.supabase.js', 'getDossier', ['user-1']],
  ['payments.supabase.js', 'getFinanceSummary', []],
  ['identity.supabase.js', 'getIdentityFromAuthUser', [{ id: 'u1', role: 'student' }]],
  ['storageUrl.js', 'resolveSignedUrl', ['https://x.supabase.co/storage/v1/object/public/documents/u1/cin/1.pdf']],
]

for (const [file, fnName, args] of modules) {
  const mod = await import(`./src/local/adapters/supabase/${file}`)
  check(`${file} : import sans effet de bord réseau, ${fnName}() refuse tant que PRODUCTION_ADAPTER_ACTIVE=false`, () => {
    assert.equal(typeof mod[fnName], 'function', `${fnName} doit être exporté par ${file}`)
    assert.throws(() => mod[fnName](...args), /PRODUCTION_ADAPTER_ACTIVE=false|adaptateur production désactivé/)
  })
}

// ================================================================
// 3. identity.supabase.js : jamais de repli "Client Démo" en production.
// ================================================================
const identitySupabase = await import('./src/local/adapters/supabase/identity.supabase.js')
check('identity.supabase.js n\'importe jamais model.js (donc ne peut structurellement pas utiliser CANONICAL_DEMO_CLIENT_ID comme repli) et lève sans utilisateur authentifié', () => {
  const src = readFileSync('./src/local/adapters/supabase/identity.supabase.js', 'utf8')
  assert.doesNotMatch(src, /from\s+['"][^'"]*model['"]/, 'identity.supabase.js ne doit jamais importer ../../model (source de CANONICAL_DEMO_CLIENT_ID)')
  assert.match(src, /aucun utilisateur authentifié/, 'doit lever explicitement sans utilisateur — jamais un repli client de démo silencieux')
  assert.ok(typeof identitySupabase.getIdentityFromAuthUser === 'function')
})

check('identity.supabase.js renvoie authUser.id tel quel (jamais un id synthétique/partagé) — garantit l\'isolation client A / client B au niveau du code, indépendamment de la RLS live non vérifiable', () => {
  const src = readFileSync('./src/local/adapters/supabase/identity.supabase.js', 'utf8')
  assert.match(src, /id:\s*authUser\.id/, 'getIdentityFromAuthUser doit renvoyer authUser.id sans transformation')
})

// ================================================================
// Audit "client data/access preservation" (2026-09-22) : ClientSpace
// (LocalCRM.jsx) résolvait toujours getActiveIdentity() SANS argument ->
// toujours le client de démo, quel que soit l'utilisateur authentifié.
// Corrigé par un prop `clientId` additif sur LocalCRM, transmis en
// `overrideClientId` à ClientSpace. Garde de régression : le prop doit
// continuer d'exister et productionEntry.proposal.jsx doit continuer de le
// fournir depuis le vrai utilisateur authentifié (jamais depuis un id en
// dur).
// ================================================================
check('LocalCRM.jsx accepte un prop clientId (transmis à ClientSpace) — plus de repli "Client Démo" forcé quand un clientId réel est fourni', () => {
  const src = readFileSync('./src/local/LocalCRM.jsx', 'utf8')
  assert.match(src, /export default function LocalCRM\(\{/, 'précondition : signature LocalCRM trouvée')
  assert.match(src, /export default function LocalCRM\(\{[\s\S]{0,300}?clientId\s*=\s*null/, 'LocalCRM doit accepter un prop clientId optionnel (défaut null = comportement Preview inchangé)')
  assert.match(src, /overrideClientId=\{clientId\}/, 'LocalCRM doit transmettre ce prop à ClientSpace')
  assert.match(src, /getActiveIdentity\(overrideIdentity[\s\S]{0,60}?overrideClientId/, 'ClientSpace doit utiliser le mécanisme d\'override existant de getActiveIdentity, jamais un second système d\'identité')
})

check('productionEntry.proposal.jsx fournit clientId={user.id} au shell client (jamais un id en dur/démo)', () => {
  const src = readFileSync('./src/local/adapters/supabase/productionEntry.proposal.jsx', 'utf8')
  assert.match(src, /<LocalCRM\s+mode="client"[\s\S]*?clientId=\{user\.id\}/, 'le shell client doit recevoir l\'id de l\'utilisateur réellement authentifié')
  assert.doesNotMatch(src, /clientId=\{6\}|clientId=CANONICAL_DEMO_CLIENT_ID/, 'jamais un id de démo en dur')
})

// ================================================================
// 4. Audit "strict read-only schema/RLS verification" (2026-09-22) :
//    garde contre toute fabrication future d'un statut RLS PASS/MISSING
//    sans accès live réel — la documentation doit rester honnête (voir
//    docs/PRODUCTION_WIRING_PLAN.md §10) tant qu'aucune lecture live n'a
//    eu lieu.
// ================================================================
check('docs/PRODUCTION_WIRING_PLAN.md §10 (RLS) ne prétend aucun statut PASS/NEEDS REVIEW/MISSING sans accès live — uniquement UNVERIFIED LIVE', () => {
  const doc = readFileSync('./docs/PRODUCTION_WIRING_PLAN.md', 'utf8')
  const start = doc.indexOf('## 10. RLS')
  const nextHeadingIdx = doc.indexOf('\n## ', start + 1)
  const section = doc.slice(start, nextHeadingIdx === -1 ? undefined : nextHeadingIdx)
  assert.match(section, /UNVERIFIED LIVE/, 'la section RLS doit exister et marquer explicitement le statut comme non vérifié')
  assert.doesNotMatch(section, /\|\s*PASS\s*\|/, 'aucune ligne du tableau RLS ne doit prétendre PASS sans accès live réel')
})

check('docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md couvre bien colonnes/types, FK/PK, index, contraintes, RLS et storage', () => {
  const doc = readFileSync('./docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md', 'utf8')
  assert.match(doc, /information_schema\.columns/)
  assert.match(doc, /pg_indexes/)
  assert.match(doc, /pg_policies/)
  assert.match(doc, /storage\.buckets/)
})

// ================================================================
// 5. Audit "verified live security findings" (2026-09-22) : les 4
//    propositions SQL RLS + la proposition storage doivent rester des
//    fichiers de REVUE UNIQUEMENT, jamais du DDL exécutable par accident,
//    et documents.supabase.js ne doit jamais prétendre que le bucket est
//    privé (repris de l'audit live : public=true).
// ================================================================
const sqlProposals = [
  'supabase/migrations/20260922_proposal_fix_broad_rls_policies.sql',
  'supabase/migrations/20260922_proposal_fix_documents_policy.sql',
  'supabase/migrations/20260922_proposal_brand_briefs_insert_scope.sql',
  'supabase/migrations/20260922_proposal_documents_bucket_privacy.sql',
]
for (const path of sqlProposals) {
  check(`${path} : marqué "NOT APPLIED — REVIEW ONLY", aucune ligne DDL non commentée (jamais exécutable par accident)`, () => {
    const src = readFileSync(`./${path}`, 'utf8')
    assert.match(src, /NOT APPLIED — REVIEW ONLY/, 'doit porter le marqueur explicite')
    const executableLines = src.split('\n').filter(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('--')) return false
      return /^(create|drop|alter|insert|update|delete|grant|revoke)\b/i.test(trimmed)
    })
    assert.equal(executableLines.length, 0, `toute instruction DDL/DML doit rester commentée (--) — trouvé : ${executableLines.join(' | ')}`)
  })
}

check('documents.supabase.js avertit explicitement que le bucket "documents" est public=true (confirmé live) — jamais présenté comme déjà sécurisé', () => {
  const src = readFileSync('./src/local/adapters/supabase/documents.supabase.js', 'utf8')
  assert.match(src, /public=true/, 'doit rappeler l\'état live confirmé du bucket')
  assert.match(src, /HIGH[\s\S]{0,10}PRIORITY/, 'doit conserver la sévérité du constat')
})

check('PRODUCTION_ADAPTER_ACTIVE reste false malgré les findings de sécurité confirmés (auth wiring toujours bloqué)', () => {
  assert.equal(PRODUCTION_ADAPTER_ACTIVE, false)
  const src = readFileSync('./src/local/adapters/supabase/_guard.js', 'utf8')
  assert.doesNotMatch(src, /PRODUCTION_ADAPTER_ACTIVE\s*=\s*true/)
})

// ================================================================
// 6. Audit "local security compatibility" (2026-09-22) : storageUrl.js —
//    extractStoragePath() est pure (aucun guard, documenté comme
//    testable sans PRODUCTION_ADAPTER_ACTIVE) et doit reconnaître les 3
//    formes (chemin nu / URL publique / URL déjà signée) sans jamais
//    lever, même sur une valeur inattendue.
// ================================================================
const { extractStoragePath } = await import('./src/local/adapters/supabase/storageUrl.js')
check('extractStoragePath() : URL publique -> chemin ; chemin nu -> inchangé ; URL déjà signée -> null (rien à refaire) ; valeur inconnue -> null (jamais de devinette)', () => {
  assert.equal(
    extractStoragePath('https://x.supabase.co/storage/v1/object/public/documents/u1/cin/1.pdf'),
    'u1/cin/1.pdf'
  )
  assert.equal(extractStoragePath('u1/cin/1.pdf'), 'u1/cin/1.pdf')
  assert.equal(
    extractStoragePath('https://x.supabase.co/storage/v1/object/sign/documents/u1/cin/1.pdf?token=abc'),
    null
  )
  assert.equal(extractStoragePath('https://example.com/unrelated.pdf'), null)
  assert.equal(extractStoragePath(null), null)
})

check('documents.supabase.js/marketing.supabase.js résolvent les URLs de stockage via resolveSignedUrl/resolveSignedUrls (getDocuments/getDocumentsWithDetails/getBrief/uploadAsset/getFiles) — jamais un fetch getPublicUrl() nu réexposé tel quel', () => {
  const docsSrc = readFileSync('./src/local/adapters/supabase/documents.supabase.js', 'utf8')
  assert.match(docsSrc, /resolveSignedUrl/)
  const mktSrc = readFileSync('./src/local/adapters/supabase/marketing.supabase.js', 'utf8')
  assert.match(mktSrc, /resolveSignedUrl/)
  assert.match(mktSrc, /resolveSignedUrls/)
})

// ================================================================
// 7. Audit "final pre-production hardening" (2026-09-22) : aucun id de
//    démo/en dur (notamment id 6) ne doit jamais réapparaître dans le
//    chemin production — même contrôle que la garde déjà en place pour
//    identity.supabase.js, étendu ici explicitement à
//    productionEntry.proposal.jsx (grep littéral sur "6" en tant que valeur
//    de clientId, pas seulement sur le nom CANONICAL_DEMO_CLIENT_ID).
// ================================================================
check('productionEntry.proposal.jsx ne contient aucun id client en dur (notamment "6"/id du client de démo) — uniquement clientId={user.id}', () => {
  const src = readFileSync('./src/local/adapters/supabase/productionEntry.proposal.jsx', 'utf8')
  assert.doesNotMatch(src, /clientId=\{6\}|clientId=\{['"]6['"]\}|clientId=6\b/, 'aucun id littéral ne doit jamais remplacer user.id')
  assert.doesNotMatch(src, /from\s+['"][^'"]*\/model['"]/, 'ne doit jamais importer model.js (source de CANONICAL_DEMO_CLIENT_ID)')
})

check('docs/SECURITY_MIGRATION_RUNBOOK.md existe et est marqué NOT EXECUTED / REVIEW ONLY / NO LIVE CHANGES PERFORMED', () => {
  const doc = readFileSync('./docs/SECURITY_MIGRATION_RUNBOOK.md', 'utf8')
  assert.match(doc, /NOT EXECUTED/)
  assert.match(doc, /REVIEW ONLY/)
  assert.match(doc, /NO LIVE CHANGES PERFORMED/)
  assert.match(doc, /PHASE 0/)
  assert.match(doc, /PHASE 7/)
})

console.log(`PASS (${passed} checks): couche adapters/supabase/* (implémentation production réelle) isolée de la Preview, désactivée par défaut, aucun accès réseau à l'import.`)
