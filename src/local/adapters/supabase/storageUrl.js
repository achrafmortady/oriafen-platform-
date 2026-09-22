// ============================================================
// STORAGE URL RESOLUTION — production implementation (NOT activated, see
// ./_guard.js). Shared by documents.supabase.js and marketing.supabase.js.
//
// WHY THIS FILE EXISTS (audit "local security compatibility", 2026-09-22):
// the `documents` Supabase Storage bucket is confirmed LIVE public=true
// (see docs/PRODUCTION_WIRING_PLAN.md §12.4) — a proposed future fix
// (supabase/migrations/20260922_proposal_documents_bucket_privacy.sql, NOT
// APPLIED) would flip it to private. Once private, any ALREADY-STORED bare
// public URL (`.../object/public/documents/...`) stops resolving — but
// re-deriving a signed URL from the same underlying storage PATH always
// works, private bucket or not, because createSignedUrl() is a storage API
// call gated by the storage.objects RLS policies (already confirmed
// correctly scoped to authenticated users/own folders), not by the
// bucket's public flag.
//
// Two functions in src/lib/api.js (V1, unmodified, never touched here)
// persist bare public URLs today: uploadBrandAsset (api.js:1574-1587,
// getPublicUrl at line 1581) and sendDeliverableFile (api.js:1748-1778,
// getPublicUrl at line 1755, writes directly into
// deliverable_files.file_url — the URL is never even returned to the
// caller, so there is no "wrap the return value" fix available for that
// one; it can only be fixed by resolving at READ time). Client documents
// (uploadDocumentFile, api.js:161-227) already use createSignedUrl(), so
// they need this resolver only as a defensive no-op for consistency, not a
// functional fix.
//
// THIS FILE DOES NOT MODIFY, MIGRATE, OR REWRITE ANY STORED VALUE. It only
// resolves a URL/path to a usable one at the moment it's about to be
// displayed — exactly the "document compatibility only, no DB rewrite"
// requirement. No business logic is duplicated: uploads/inserts stay
// 100% inside src/lib/api.js, untouched.
// ============================================================
import { assertProductionAdapterActive } from './_guard'
import { supabase } from '../../../lib/supabase' // V1, unmodified — same singleton client as api.js

const BUCKET = 'documents'
const PUBLIC_URL_MARKER = `/storage/v1/object/public/${BUCKET}/`
const SIGNED_URL_MARKER = `/storage/v1/object/sign/${BUCKET}/`

function guard() { assertProductionAdapterActive('storageUrl.js') }

// extractStoragePath(fileUrlOrPath) — pure, no I/O, safe to unit-test
// without PRODUCTION_ADAPTER_ACTIVE. Returns:
//   - the bucket-relative path, if `fileUrlOrPath` is a bare path or a
//     public URL for this exact bucket,
//   - null if it's already a signed URL (nothing to do) or unrecognized
//     (caller should leave the value untouched rather than guess).
export function extractStoragePath(fileUrlOrPath) {
  if (!fileUrlOrPath) return null
  if (fileUrlOrPath.includes(SIGNED_URL_MARKER)) return null // already signed, leave as-is
  if (!/^https?:\/\//.test(fileUrlOrPath)) return fileUrlOrPath // bare path already
  const idx = fileUrlOrPath.indexOf(PUBLIC_URL_MARKER)
  if (idx === -1) return null // not a public URL for this bucket — unrecognized, leave as-is
  return fileUrlOrPath.slice(idx + PUBLIC_URL_MARKER.length).split('?')[0]
}

// resolveSignedUrl(fileUrlOrPath) — given ANY of: a bare storage path, an
// existing public URL for the `documents` bucket, or an existing signed
// URL, returns a URL that will keep working whether the bucket is public
// or private. Never throws on an unrecognized shape (returns the input
// unchanged) — a resolution failure must never hide/break an existing
// document, only best-effort improve it.
// guard() is the literal first statement of a non-async function (throws
// synchronously) — the actual work happens in the returned async IIFE, same
// convention as every other adapter export in this codebase.
export function resolveSignedUrl(fileUrlOrPath, expirySeconds = 365 * 24 * 3600) {
  guard()
  return (async () => {
    if (!fileUrlOrPath) return fileUrlOrPath
    const path = extractStoragePath(fileUrlOrPath)
    if (!path) return fileUrlOrPath // already signed, or unrecognized shape
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expirySeconds)
    if (error || !data?.signedUrl) return fileUrlOrPath // never break display on a resolution error
    return data.signedUrl
  })()
}

// resolveSignedUrls(urls) — batch helper for arrays (e.g. brand_briefs.photos_urls).
export function resolveSignedUrls(urls, expirySeconds = 365 * 24 * 3600) {
  guard()
  if (!Array.isArray(urls)) return urls
  return Promise.all(urls.map(u => resolveSignedUrl(u, expirySeconds)))
}
