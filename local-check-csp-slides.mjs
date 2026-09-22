// Régression ciblée — CSP bloquait les slides Formation IAS1 (Chrome
// DevTools : "violates ... img-src 'self' data:") car les images
// (SLIDE_BASE, src/pages/student/ChapitreXX.jsx) viennent du même bucket
// Supabase Storage public que les vidéos (cgmjjxosgnfsqupjketw.supabase.co),
// jamais autorisé dans img-src (seul media-src l'avait, depuis le correctif
// vidéo du 2026-09-19). 100% local, aucun accès réseau/Supabase.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const SUPABASE_HOST = 'https://cgmjjxosgnfsqupjketw.supabase.co'
let passed = 0
function check(label, fn) { fn(); passed += 1; console.log(`  ok - ${label}`) }

function extractCsp(source) {
  const match = source.match(/img-src[^";]*/)
  return match ? match[0] : null
}

check('index.html : img-src autorise le bucket Supabase Storage des slides, garde "self"/data:, aucun wildcard', () => {
  const html = readFileSync('./index.html', 'utf8')
  const imgSrc = extractCsp(html)
  assert.ok(imgSrc, 'img-src doit exister dans la CSP')
  assert.match(imgSrc, /'self'/)
  assert.match(imgSrc, /data:/)
  assert.match(imgSrc, new RegExp(SUPABASE_HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.doesNotMatch(imgSrc, /\*/, 'jamais de wildcard dans img-src')
})

check('index.html : media-src (vidéos) toujours présent et inchangé (régression du correctif CSP vidéo 2026-09-19)', () => {
  const html = readFileSync('./index.html', 'utf8')
  assert.match(html, new RegExp(`media-src 'self' ${SUPABASE_HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
})

check('serve-local.mjs (serveur de preview local) : même politique img-src/media-src que index.html, pour que "npm run preview" reproduise fidèlement le comportement Vercel', () => {
  const src = readFileSync('./serve-local.mjs', 'utf8')
  const imgSrc = extractCsp(src)
  assert.ok(imgSrc)
  assert.match(imgSrc, new RegExp(SUPABASE_HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(src, new RegExp(`media-src 'self' ${SUPABASE_HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
  assert.doesNotMatch(imgSrc, /\*/, 'jamais de wildcard dans img-src')
})

check('connect-src reste inchangé (aucun accès API Supabase autorisé — lecture de fichiers statiques uniquement)', () => {
  const html = readFileSync('./index.html', 'utf8')
  assert.doesNotMatch(html, /connect-src[^"']*supabase/i, 'connect-src ne doit jamais autoriser Supabase — media-src/img-src suffisent pour de la lecture de fichiers statiques (vidéo/image), aucun appel API')
})

console.log(`PASS (${passed} checks): CSP autorise les slides ET vidéos Formation depuis le bucket Supabase Storage, politique restrictive préservée (pas de wildcard, connect-src inchangé).`)
