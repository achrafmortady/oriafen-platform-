# Oriafen V2 — Security Migration Runbook

**STATUS: NOT EXECUTED. REVIEW ONLY. REQUIRES EXPLICIT APPROVAL. NO LIVE CHANGES PERFORMED.**

This document is the single, ordered runbook for taking Oriafen V2 from its
current state (local-only, `PRODUCTION_ADAPTER_ACTIVE=false`, Supabase live
never touched by this repo) to an approved, security-hardened production
activation. Every phase below is a plan. **No phase has been executed.**
Each phase must be individually approved and executed by someone with real
Supabase Dashboard/SQL access — this repo cannot execute any of it
(`src/lib/supabase.js` is hard-disabled in this checkout).

Source documents this runbook consolidates: `docs/PRODUCTION_WIRING_PLAN.md`
(schema/RLS findings, §1-§13), `docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md`
(read-only SQL), `docs/CLIENT_REGRESSION_TEST_PLAN.md` (regression scenarios),
and the SQL proposal files under `supabase/migrations/20260922_proposal_*.sql`
(all `NOT APPLIED — REVIEW ONLY`).

---

## PHASE 0 — PRE-FLIGHT

Read-only checks only. No mutation in this phase.

**Git**
```
git rev-parse origin/main          # expect 960d52038a9162bf774c8e934762c30fb0781ea7 unless main has since moved — reconfirm before proceeding
git rev-parse origin/staging-v2
git branch --show-current          # must be staging-v2
git status --short                 # record exact uncommitted state before any further work
git diff --stat
```

**Supabase (read-only)**
- Exact project ID/URL (confirm which project is being targeted — staging
  or production; NEVER run Phase 2/3 against production without first
  validating on a staging/test project).
- `select proname, prosrc, proowner::regrole from pg_proc where proname = 'is_admin_or_super_admin';`
  — record whether it exists, and if so, its exact body/owner (do not
  assume absent).
- `select relname, relrowsecurity from pg_class where relnamespace='public'::regnamespace and relname in ('users','dossiers','documents','exam_results','brand_briefs');`
  — confirm RLS still enabled on all 5 (baseline, before any change).
- `select policyname, roles, cmd, qual, with_check from pg_policies where schemaname='public' and tablename in ('users','dossiers','documents','exam_results','brand_briefs');`
  — record the EXACT current policies (must match §12 of
  `docs/PRODUCTION_WIRING_PLAN.md`: `users_all`/`dossiers_all`/
  `documents_all`/`exam_results_all` all `public, ALL, true/true`; brand_briefs
  "Public can insert brand briefs"). If it does NOT match, STOP — the
  proposals were written against this exact baseline.
- `select id, public from storage.buckets where id in ('documents','formation');`
  — confirm `documents.public=true`, `formation.public=true` (baseline).
- Full `information_schema.columns`/constraint queries from
  `docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md` §1-§3, if not already
  captured, for a complete before-state snapshot.

**Representative identities** (read metadata only, never full PII beyond
what's needed to pick 3 test rows — never copy personal data into this repo
or any doc):
- One existing converted client (`role='student'`, has a `dossiers` row,
  at least one `documents` row).
- One `role='admin'` account.
- One `role='super_admin'` account.
Record only their `id` (uuid) locally in your own private notes, never in
this repo.

**STOP condition for Phase 0**: any of the baseline reads above doesn't
match what §12 of `PRODUCTION_WIRING_PLAN.md` documents — re-derive the
proposals against the ACTUAL current state before proceeding, do not assume
staleness is safe to ignore.

---

## PHASE 1 — APP COMPATIBILITY DEPLOY

Deploys the ALREADY-WRITTEN local code (this repo, `staging-v2`) — no new
code needs to be written, only reviewed once more and merged/deployed
through the normal release process (out of scope for this repo/session,
which never pushes).

**What ships**: `src/local/adapters/supabase/storageUrl.js`
(`resolveSignedUrl`/`resolveSignedUrls`/`extractStoragePath`), wired into
`documents.supabase.js` (`getDocuments`/`getDocumentsWithDetails`) and
`marketing.supabase.js` (`getBrief`/`uploadAsset`/`getFiles`). This makes
every document/marketing-asset/deliverable READ resilient to both the
current public bucket and a future private one — **before** any bucket
change happens.

**Precondition**: `PRODUCTION_ADAPTER_ACTIVE` stays `false` through this
phase — Phase 1 ships CODE, not activation. The code remains fully inert
until Phase 5.

**Expected result**: no behavior change yet (adapters still guarded/inactive)
— this phase exists purely so the code is ALREADY on the deployed branch
before Phase 3 makes the bucket private, avoiding a window where private
storage ships before the app can handle it.

**STOP condition**: none applicable — this is a no-op from the live
system's perspective until Phase 5 activates the adapter layer.

---

## PHASE 2 — RLS SECURITY MIGRATION

See §G "Exact SQL execution order" below for the precise, numbered sequence.
Source files: `supabase/migrations/20260922_proposal_fix_broad_rls_policies.sql`,
`20260922_proposal_fix_documents_policy.sql`,
`20260922_proposal_brand_briefs_insert_scope.sql`.

**Independent of Phase 1 and Phase 3** — this phase only changes TABLE-level
RLS policies, never touches storage. It can be executed before, after, or
without Phase 1 having shipped, and should be prioritized as the highest-
urgency fix (closes `users_all`/`dossiers_all`/`documents_all`/
`exam_results_all`, the 4 CONFIRMED UNSAFE policies) regardless of the
storage bucket timeline.

**STOP condition**: any single policy replacement's post-check (§G) shows a
regression (client loses own-row access, admin loses cross-client access,
or an unexpected row becomes visible/invisible) — STOP, do not continue to
the next policy, roll back the one just applied (rollback SQL in the same
proposal file) before investigating.

---

## PHASE 3 — DOCUMENTS BUCKET PRIVATE SWITCH

See §H "Documents private bucket runbook" below for the full before/switch/
after/rollback sequence. Source: `20260922_proposal_documents_bucket_privacy.sql`.

**Precondition — HARD BLOCKER**: Phase 1 must already be live (deployed,
verified) before this phase runs. Flipping the bucket to private before
Phase 1 ships would immediately break `uploadBrandAsset`/
`sendDeliverableFile` reads (both currently return/persist bare public
URLs — see `docs/PRODUCTION_WIRING_PLAN.md` §12.4).

**STOP condition**: any existing client document, marketing asset, or
deliverable fails to load after the switch — revert immediately via the
rollback in `20260922_proposal_documents_bucket_privacy.sql` Phase 3/
rollback section (`update storage.buckets set public = true where id = 'documents';`).

---

## PHASE 4 — LIVE SECURITY + CLIENT REGRESSION VERIFICATION

Run, in full, on the same environment Phases 2-3 were applied to:
- `docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md` (re-run every query —
  confirm the NEW policies/bucket state match what was intended, not just
  that SOME policy exists).
- `docs/CLIENT_REGRESSION_TEST_PLAN.md` (all 18 scenarios).
- §I "Existing client full regression plan" below (23-point checklist).
- §J/§K/§L below (admin/super_admin/Finance regression).

**STOP condition**: any item in §M "Stop conditions" below is triggered —
do not proceed to Phase 5.

---

## PHASE 5 — LOCAL AUTH WIRING

Only after Phase 4 passes in full: activate the local production identity/
adapter layer — flip `PRODUCTION_ADAPTER_ACTIVE` to `true` in
`src/local/adapters/supabase/_guard.js`, and wire
`src/local/adapters/supabase/productionEntry.proposal.jsx` into an actual
Vite entry point (it is currently unreachable from `index.html` by design —
see §O below for what changes and what must NOT change).

**Explicitly NOT performed in this session** — see §N "Auth wiring gate".

**STOP condition**: same as §M, re-checked after activation with a real
authenticated session before declaring Phase 5 complete.

---

## PHASE 6 — STAGING/PRODUCTION GO-LIVE REVIEW

Human sign-off checkpoint — no automated criteria. Confirm with product/
engineering leadership: Phase 4 regression results reviewed and accepted;
Finance/Super Admin stakeholders have confirmed no behavior change; a
rollback owner and communication plan exists for the go-live window itself.
Only after this phase does `app.oriafen.com` traffic get routed to the new
entry — entirely outside this repo's/session's scope.

---

## PHASE 7 — ROLLBACK

Each earlier phase's own rollback is already specified in its section/
source file. Global rollback order (reverse of forward order):
Phase 5 (flip `PRODUCTION_ADAPTER_ACTIVE` back to `false`) → Phase 3
(`storage.buckets public = true`) → Phase 2 (recreate `..._all`/original
policies verbatim, SQL in each proposal file's own rollback section) →
Phase 1 (no rollback needed — a plain code revert is safe at any time,
never depends on live state) → Phase 0 (nothing to roll back, read-only).

---

## F. PRE-FLIGHT CHECKLIST (detail)

Already covered under PHASE 0 above — this section exists so §F is easy to
find by name from the final report. See PHASE 0 for the exact commands/
queries.

---

## G. Exact SQL execution order

| # | Prerequisite | Object affected | Proposal file | Expected result | Read-only verification | STOP condition | Rollback |
|---|---|---|---|---|---|---|---|
| 1 | Phase 0 baseline confirmed | — | — | Confirm `is_admin_or_super_admin()` absent OR record its exact existing definition | `select proname, prosrc from pg_proc where proname='is_admin_or_super_admin'` | Function exists with an unrelated/conflicting body | N/A (read-only step) |
| 2 | Step 1 clean | `public.is_admin_or_super_admin()` function | `20260922_proposal_fix_broad_rls_policies.sql` §0 | Function created, owned by a role with BYPASSRLS or table ownership on `users` | `select proowner::regrole, prosecdef from pg_proc where proname='is_admin_or_super_admin'` | Owner lacks BYPASSRLS/table ownership → recursion risk | `drop function if exists public.is_admin_or_super_admin()` |
| 3 | Step 2 done | `users` policies | same file §1 | `users_all` replaced by `users_select_own_or_admin`/`users_insert_self`/`users_update_admin_only` | Log in as the Phase-0 test client → confirm own profile loads; log in as admin → confirm client list loads | Client can't read own row, or admin can't read others | Recreate `users_all` (SQL in file) |
| 4 | Step 3 verified | `dossiers` policies | same file §2 | `dossiers_all` replaced | Test client's dossier loads; admin dossier list loads; admin can advance a TEST dossier's step | Client loses dossier access, or admin update fails | Recreate `dossiers_all` |
| 5 | Step 4 verified | `documents` policies | `20260922_proposal_fix_documents_policy.sql` | `documents_all` replaced | Test client's documents load; upload/replace (upsert) works for that client; admin validate/reject works | Upload/replace fails (upsert needs self-UPDATE, not just INSERT) | Recreate `documents_all` |
| 6 | Step 5 verified | `exam_results` policies | same file as §1 (broad-policies) §3 | `exam_results_all` replaced | Test client's past exam result still visible; submitting a NEW test exam result succeeds | Existing result disappears, or new submission fails | Recreate `exam_results_all` |
| 7 | Step 6 verified, product sign-off obtained | `brand_briefs` INSERT policy | `20260922_proposal_brand_briefs_insert_scope.sql` | Public INSERT replaced by authenticated-self-only | Test client can still submit/resubmit their own brief | Legitimate authenticated submission fails | Recreate "Public can insert brand briefs" |
| 8 | Steps 2-7 done | all 5 tables | — | Full policy audit | Re-run `docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md` §4 for these 5 tables, confirm no `role public`/`ALL true` remains | Any table still shows the old broad pattern | Re-apply the specific rollback for that table |
| 9 | Step 8 clean | `documents` STORAGE bucket | `20260922_proposal_documents_bucket_privacy.sql` | See PHASE 3 / §H | See §H | See §H | See §H |

---

## H. Documents private bucket runbook (detail)

**BEFORE** (must all pass first):
- Phase 1 app code confirmed live (signed-URL resolution active in the
  deployed adapters).
- Documents view test: open an existing client's document as that client —
  must resolve via signed URL already (already true today, `uploadDocumentFile`
  uses `createSignedUrl()` — confirm this hasn't regressed).
- Marketing asset test: open an existing `logo_url`/`photos_urls` entry as
  that client — before Phase 1 ships this is a bare public URL; after
  Phase 1, `resolveSignedUrl()` must transparently convert it.
- Deliverable file test: same, for `deliverable_files.file_url`.
- Admin file test: admin opens the SAME client's document/asset/deliverable
  — must work identically to the client's own view.
- Existing client file test: pick the Phase-0 representative client, open
  every one of their document categories.

**SWITCH** (the only actual mutation in this entire runbook — NOT EXECUTED):
```
-- update storage.buckets set public = false where id = 'documents';
```

**AFTER** (verify all, in this order):
1. The Phase-0 representative client's existing document still opens.
2. A brand-new upload (new test category or replacement) works end-to-end.
3. Replacing/re-uploading a rejected document works (upsert path).
4. Admin opens the same client's file — identical result.
5. A marketing asset (logo/photo) uploaded BEFORE the switch still loads
   (via the resolved signed URL, not the now-dead public URL).
6. A deliverable file sent BEFORE the switch still loads.
7. A signed URL regenerates correctly after its previous expiry (spot
   check with a short `expirySeconds` value on a TEST object first, not a
   real client's file).
8. The OLD bare public URL (`.../object/public/documents/...`) for the same
   path now returns 403/404 — confirms the bucket is actually private, not
   just that the app happens to use signed URLs.

**ROLLBACK**:
```
-- update storage.buckets set public = true where id = 'documents';
```
Expected app behavior after rollback: identical to before the switch — the
app never depended on the bucket being private (it always requests signed
URLs), so reverting the bucket flag alone is sufficient and instantaneous.

---

## I. Existing client full regression plan (23 points)

Superset of `docs/CLIENT_REGRESSION_TEST_PLAN.md` (18 scenarios) plus 5
items specific to this migration — run this AFTER Phase 4, using the
Phase-0 representative client:

1. Login with existing credentials succeeds.
2. Session auto-restores after a page refresh without re-login.
3. `public.users.id` is identical before/after (compare against the Phase-0
   recorded id).
4. Profile (name/email/pack) unchanged.
5. Dossier status unchanged.
6. Dossier current step unchanged.
7. All main documents (6 categories) show the same status as before.
8. Associate documents (if any existed) still present, same status.
9. Document statuses/rejection reasons preserved verbatim.
10. Formation progress (hours/units) unchanged.
11. Completed chapters list unchanged.
12. Exam result (score/passed) unchanged.
13. Payment state (`paymentValidated`/installments) unchanged, no new/
    duplicate payment rows.
14. Marketing brief (if submitted) still visible, unchanged.
15. Deliverables/feedback/files still visible and loadable (signed URLs
    resolve).
16. Support tickets (history/status) unchanged.
17. Client messages (broadcast history) unchanged.
18. Notifications — read/unread state preserved exactly (not reset).
19. Logout then log back in — works normally.
20. Direct route reload (e.g. refresh on `/dashboard`) does not lose state
    or force an unnecessary re-login.
21. No "Client Demo"/id-6 fallback observed anywhere in this client's view.
22. No duplicate `public.users` row was created for this `auth.users.id`.
23. No data belonging to a DIFFERENT client is visible anywhere in this
    client's session (cross-check against the RLS fixes in Phase 2 — this
    is the item most directly protected by this migration).

---

## J. Admin regression plan

Using the Phase-0 representative `admin` account, after Phase 4:
- List clients (Clients tab) — full list loads, same clients as before.
- Inspect one specific client's fiche — all tabs (dossier, documents,
  formation, marketing, support) load.
- Update that client's dossier step — succeeds, same as before.
- Validate and reject a TEST document — both succeed, notification fires.
- View marketing briefs/deliverables — loads, files open (signed URLs).
- Manage deliverables (send a TEST file, add feedback) — succeeds.
- Reply to a support ticket — succeeds, visible to the client.
- Trigger/observe a notification — delivered correctly.
- Formation oversight (view a client's progress) — unchanged.
- CRM conversion — convert a TEST prospect to client, confirm
  `leads.converted_user_id` is set and the new client appears in the
  Clients tab exactly once (no duplicate).
- **No Finance screens touched or modified as part of this plan** — Finance
  is verified separately in §L.

---

## K. Super Admin regression plan

Using the Phase-0 representative `super_admin` account, after Phase 4:
- Existing role still recognized as `super_admin` (not downgraded to
  `admin` by any policy/UI change).
- Every access an `admin` has (§J) still works identically for
  `super_admin`.
- Super-admin-only UI (account deletion button, Finance tab — see
  `src/pages/admin/Dashboard.jsx:997,3892`) still visible/functional, not
  accidentally restricted by the new RLS policies (all 5 migrated tables
  use `is_admin_or_super_admin()`, which by design treats admin and
  super_admin identically for these 5 tables — confirmed no V1 evidence of
  a finer distinction for users/dossiers/documents/exam_results/
  brand_briefs specifically).
- No unexpected redirect to `/dashboard` (the student redirect) — would
  indicate a role-resolution regression.

---

## L. Finance regression plan

**Zero code changes accompany this migration for Finance.** Validation
only, no code review needed beyond confirming zero diff:
- Finance view loads for the `super_admin` account.
- Payment totals (`fetchFinanceSummary`, api.js:539-572) unchanged —
  same `totalRevenuePaid`/`totalPending`/`monthRevenue`/`yearRevenue` as
  before the migration, for the same underlying `payments` rows.
- `amount_ttc`-only summation logic unchanged (api.js:490-495 comment,
  unmodified) — never touched by this migration (Finance/`payments` RLS
  is NOT part of Phase 2's scope; `payments` remains in the "scoped-
  appearing, NEEDS REVIEW (partial evidence)" bucket — see
  `docs/PRODUCTION_WIRING_PLAN.md` §12.3 — a SEPARATE future review, not
  bundled into this migration).
- Permissions unchanged: only `super_admin` can view Finance (UI gate,
  `src/pages/admin/Dashboard.jsx:3860,3892`, unmodified).

---

## M. Stop conditions (complete list)

Migration execution (Phases 2-5) must STOP and roll back to the last known
good state if ANY of the following occurs:
- A live policy's definition doesn't match what Phase 0 recorded before
  applying the next step.
- `is_admin_or_super_admin()` already exists with an unexpected body, or
  its owner lacks BYPASSRLS/table ownership (recursion risk).
- RLS is found disabled on any of the 5 migrated tables at any point.
- The Phase-0 representative client loses access to their own data.
- The Phase-0 representative admin loses access they had before.
- The Phase-0 representative super_admin loses access they had before, or
  is redirected as if they were a student.
- Any cross-client visibility appears (client A sees client B's row).
- Any signed URL fails to resolve for an existing, previously-working
  document/asset/deliverable.
- Any existing document becomes inaccessible (404/403 with no signed-URL
  fallback working).
- Any marketing file or deliverable becomes inaccessible.
- The representative client's `public.users.id` changes across the
  migration (would indicate an account was recreated, not preserved).
- A duplicate `public.users` row appears for the same `auth.users.id`.
- Any dossier/formation-progress/payment state changes unexpectedly
  (value differs from the Phase-0 recorded baseline without an explicit,
  intentional action having caused it).
- A session restores as the WRONG user (identity mismatch).
- A "Client Demo"/id-6 fallback is observed anywhere in a real
  authenticated session.

---

## N. Auth wiring gate

Local Auth wiring (Phase 5) remains **BLOCKED** until ALL of the following
are true, in this order:
1. Phase 1 app-compatibility code is deployed and confirmed live.
2. Phase 2 RLS fixes are applied and individually re-verified (§G step 8).
3. Phase 3 documents-bucket-private switch is complete and §H's AFTER
   checklist passes in full.
4. Phase 4's full regression (§I/§J/§K/§L) passes with zero STOP conditions
   (§M) triggered.
5. Client continuity: PASS. Admin: PASS. Super Admin: PASS. No
   cross-client access observed.

**For this session/task: Auth wiring is NOT activated.**
`PRODUCTION_ADAPTER_ACTIVE` remains `false` (verified, see Q below).
`productionEntry.proposal.jsx` remains unreachable from any active entry
point (verified, see O below).

---

## O. Final Auth wiring preparation (review only, not activated)

`src/local/adapters/supabase/productionEntry.proposal.jsx` reviewed again
this session — confirmed it still implements exactly:

```
V1 AuthProvider (src/context/AuthContext.jsx, unmodified, imported verbatim)
  + V1 ProtectedRoute logic (copied 1:1 in the proposal file, same redirect rules)
  + existing Supabase session/profile/role resolution (via useAuth(), no reimplementation)
  + V2 UI (LocalAdminShell for admin-like roles, LocalCRM mode="client" for students)
```

This is the correct target shape — **not** "LocalAdminShell/local demo
identity replacing V1 auth." No demo/hardcoded identity remains reachable
in this file (grep-verified, see P below): `clientId={user.id}` (the real
authenticated user, resolved by V1's own `AuthContext`) is passed to
`LocalCRM`, which threads it to `ClientSpace` via the `overrideClientId`
prop fixed earlier this audit (`src/local/LocalCRM.jsx`). No changes were
needed this session — the fix already applied in the prior turn remains
correct and was re-verified, not re-applied.

Not imported into `local-main.jsx`, `index.html`, or any active entry
point — confirmed by the existing isolation test
(`local-check-supabase-adapters.mjs`) and by `npm run build`'s unchanged
module count (86).

---

*(Sections A-E, P, Q, R, S of the requesting prompt are covered inline in
the final chat report that accompanies this file, not duplicated here to
avoid drift between two copies of the same content.)*
