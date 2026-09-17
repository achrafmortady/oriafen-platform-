# Plan de mise en staging — Suivi client / documents rejetés / notifications / activity log

Ce document est une **préparation uniquement**. Rien ici n'a été exécuté. Il ne
sera activé qu'après validation humaine explicite, sur un projet Supabase de
**staging** dédié — jamais directement sur le CRM/Supabase live.

## 1. Préconditions staging

- Un projet Supabase **distinct** du live, dédié aux tests (jamais le projet
  de production).
- Accès admin à ce projet staging (SQL Editor + Table Editor + Auth).
- Le schéma live actuel exporté au préalable (voir section 6) pour vérifier
  que le staging reflète fidèlement la prod avant d'y appliquer quoi que ce
  soit — en particulier les tables non versionnées dans ce repo (`packs`,
  `payments`, `leads`, `lead_appointments`, `lead_tasks`, `lead_activity`,
  `support_tickets`, `client_messages`, `notifications`, `chapter_progress`,
  `deliverable_files`, `brand_briefs`).
- `.env` de staging avec `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  pointant vers le projet staging — jamais vers le live.

## 2. Tables / colonnes à ajouter

| Table | Nature | Fichier de migration test/local correspondant |
|---|---|---|
| `client_send_history` (colonnes `opened_at`, `reminded_at`, `replied_at`, `important`, `status`, `last_activity_at`) | ALTER (additif) | `supabase/migrations/20260916_test_local_tracking_columns.sql` |
| `client_send_history` / `client_send_replies` (création, si pas déjà fait) | CREATE | `supabase/migrations/20260915_client_send_tracking.sql` |
| `documents` (colonnes `rejected_at`, `rejected_by`) | ALTER (additif) | `supabase/migrations/20260916_test_local_documents_rejection.sql` |
| `document_versions` | CREATE | `supabase/migrations/20260916_test_local_document_versions.sql` |
| `activity_log` | CREATE | `supabase/migrations/20260916_test_local_activity_log.sql` |
| `notifications` | AUCUNE migration — schéma déjà confirmé live | `supabase/migrations/20260916_notes_notifications_schema_TODO.sql` (notes uniquement) |

Aucun de ces fichiers ne doit être exécuté sans avoir retiré au préalable
l'analyse "DO NOT RUN IN PRODUCTION" de sa raison d'être — c'est-à-dire
seulement après revue humaine, et uniquement sur staging dans un premier
temps.

## 3. Ordre des migrations

1. `20260915_client_send_tracking.sql` (si `client_send_history` /
   `client_send_replies` n'existent pas encore sur ce projet)
2. `20260916_test_local_tracking_columns.sql`
3. `20260916_test_local_documents_rejection.sql`
4. `20260916_test_local_document_versions.sql`
5. `20260916_test_local_activity_log.sql`
6. Aucune migration pour `notifications` — mais lire attentivement
   `20260916_notes_notifications_schema_TODO.sql` avant d'activer
   `createNotification()` dans `src/lib/api.js`.

Chaque étape : appliquer → vérifier dans le Table Editor que les colonnes/
tables existent avec le bon type → tester manuellement le scénario associé
(section 8) → seulement ensuite passer à la migration suivante.

## 4. Policies à ajouter — UNIQUEMENT sur les nouvelles tables

Les migrations 2 à 5 ci-dessus créent leurs propres policies RLS
(`document_versions`, `activity_log`) ou n'en nécessitent pas de nouvelles
(les colonnes ajoutées à `client_send_history`/`documents` héritent des
policies déjà en place sur ces tables). **Aucune policy existante ne doit
être modifiée**, en particulier :

- `documents_all`, `dossiers_all`, `users_all` (policies legacy larges,
  confirmées en usage live — ne jamais y toucher)
- Les policies déjà en place sur `client_messages`, `notifications`,
  `documents`, `support_tickets`, `payments` (confirmées lors de l'audit du
  2026-09-16)

Les nouvelles policies (`document_versions`, `activity_log`) suivent le
pattern déjà en usage live : propriétaire (`auth.uid() = user_id` /
`client_id`) en lecture seule, `admin`/`super_admin` en accès complet.

## 5. Vérification policy INSERT sur `notifications`

**Non confirmée à ce jour.** Avant tout premier appel réel à
`createNotification()` sur staging :

1. Vérifier dans le dashboard (Authentication → Policies, ou
   `select * from pg_policies where tablename = 'notifications'`) qu'une
   policy autorise un contexte admin/service à faire un `INSERT` avec
   `audience = 'client'` et un `user_id` arbitraire (celui du client
   concerné, pas forcément `auth.uid()` de l'appelant).
2. Si aucune policy INSERT n'existe pour ce cas, ne pas la créer sans
   validation humaine explicite — documenter le blocage et remonter la
   question plutôt que de la contourner (ex: RPC `SECURITY DEFINER` côté
   staging, à valider au cas par cas).
3. Tant que ce point n'est pas vérifié, `createNotification()` reste
   dormant (jamais appelé automatiquement par le code applicatif).

## 6. Backup / export du schéma avant migration

Avant la moindre migration sur staging (et a fortiori avant toute idée de
prod) :

```sql
-- À exécuter en lecture seule sur le projet STAGING pour capturer son état avant migration
select table_name from information_schema.tables where table_schema = 'public' order by 1;
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns where table_schema = 'public' order by 1, ordinal_position;
```

Ou, via Supabase CLI (staging uniquement, jamais live) :
`supabase db dump --schema public --linked > backup_pre_migration.sql`

Conserver ce dump horodaté avant chaque étape de la section 3.

## 7. Comptes de test staging

À créer manuellement sur le projet staging (jamais sur le live) :

- **admin** : `role = 'admin'`, sans accès Finance/Super Admin si le
  staging reproduit la distinction de rôles live.
- **client** : `role = 'student'`, avec un dossier + au moins un document
  déjà uploadé (pour pouvoir tester un rejet immédiatement).

Ne jamais réutiliser un compte ou un email réel du CRM live.

## 8. Scénarios de bout en bout à rejouer sur staging

1. **Admin** envoie un message avec réponse requise → **Client** le voit
   dans la cloche, l'ouvre, répond → **Admin** voit `seen_at`/`opened_at`/
   `replied_at` se remplir et le statut dérivé passer par
   Envoyé → Vu → Ouvert → Répondu.
2. **Admin** marque un envoi important → **Client** voit le popup importance
   à la connexion suivante.
3. Un envoi reste sans réponse au-delà du délai de relance → **Admin** voit
   le statut "À relancer", clique "Relancer" → `reminded_at` posé →
   vérifier qu'une ouverture/consultation ultérieure fait bien passer le
   statut à "Ouvert"/"Vu" (et non l'inverse — c'est le bug de priorité
   corrigé en local, à revalider ici).
4. **Admin** rejette un document avec motif → vérifier `rejection_reason`,
   `rejected_at`, `rejected_by` posés sur `documents`, une ligne archivée
   dans `document_versions`, une entrée `activity_log` (`document_rejected`),
   et (une fois la policy INSERT confirmée, section 5) une notification
   `audience='client'` créée.
5. **Client** voit le document refusé avec motif, clique "Remplacer le
   document", uploade un nouveau fichier → le document repasse `en_attente`,
   l'ancienne version reste visible dans l'historique, `activity_log`
   (`document_replaced`) créé.
6. **Admin** voit dans la fiche client : le nouveau statut du document, le
   journal d'activité à jour, et la "Prochaine action" qui doit refléter
   "Vérifier le document remplacé" tant que l'admin n'a pas validé/rejeté à
   nouveau.

## 9. Plan de rollback

Chaque fichier de migration (`20260916_test_local_*.sql`) contient en pied
de fichier les commandes de rollback correspondantes, commentées :

- Colonnes ajoutées → `ALTER TABLE ... DROP COLUMN IF EXISTS ...`
- Tables créées (`document_versions`, `activity_log`) → `DROP TABLE IF
  EXISTS ...`

Procédure en cas d'échec sur staging :

1. Ne pas retenter la migration à chaud.
2. Exécuter le rollback du fichier concerné (staging uniquement).
3. Comparer le dump de la section 6 avec l'état actuel pour comprendre
   l'écart.
4. Corriger le fichier de migration localement, re-tester `node
   local-check-tracking.mjs` + `npm run build`, puis reprogrammer une
   fenêtre de test staging.
5. Ne proposer une exécution sur le live qu'après un cycle staging complet
   réussi ET une validation humaine explicite distincte de celle-ci.

## 10. Checklist Go / No-Go (staging)

- [ ] Schéma live exporté et comparé au schéma staging avant toute migration
- [ ] Migrations appliquées dans l'ordre de la section 3, une par une, avec
      vérification manuelle après chacune
- [ ] Policy INSERT sur `notifications` confirmée (section 5) avant tout
      test de `createNotification()`
- [ ] Les 9 scénarios de la section 8 rejoués avec succès
- [ ] `node local-check.mjs`, `node local-check-tracking.mjs` et `npm run
      build` toujours au vert après tout ajustement fait pendant les tests
      staging
- [ ] Aucune policy legacy (`documents_all`, `dossiers_all`, `users_all`) ni
      table Finance/Super Admin touchée pendant les tests
- [ ] Dump de rollback conservé et testé au moins une fois
- [ ] Validation humaine explicite obtenue avant d'envisager une étape
      suivante vers la production

Aucune étape de ce document n'a été exécutée. La suite (staging réel) ne
doit être entreprise qu'après validation humaine explicite, distincte de la
préparation de ce plan.
