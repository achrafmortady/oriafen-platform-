# Checklist de vérification manuelle Supabase (lecture seule)

Ce dépôt ne peut initier AUCUNE connexion Supabase (`src/lib/supabase.js`
exporte `isConfigured=false`/`supabase=null`, codé en dur — voir ce
fichier). Aucun accès live n'a donc été possible pendant les audits des
2026-09-20/21 : tout ce qui suit a été déduit du code réel déjà commité
(`src/lib/api.js`, V1, lu en lecture seule) — voir
`docs/PRODUCTION_WIRING_PLAN.md` pour le détail complet colonne par
colonne.

Ce document liste les requêtes EXACTES, en lecture seule, à exécuter
manuellement (SQL editor du dashboard Supabase, ou `psql` en lecture seule)
par une personne ayant un accès réel au projet, pour confirmer ou infirmer
les hypothèses du code ci-dessus avant toute activation de
`src/local/adapters/supabase/*` (`PRODUCTION_ADAPTER_ACTIVE=true`).

**Aucune de ces requêtes n'écrit quoi que ce soit.** Ne jamais exécuter
autre chose que ce qui est listé ici sur le projet live sans revue séparée.

## STATUS UPDATE — 2026-09-21 : résultats live reçus (lecture seule)

Une partie des requêtes ci-dessous a depuis été exécutée en environnement
réel (hors de cette session) et les résultats rapportés — voir
`docs/PRODUCTION_WIRING_PLAN.md` §12 "VERIFIED LIVE SUPABASE SECURITY
FINDINGS" pour le détail complet et les propositions de correctif associées
(`supabase/migrations/20260922_proposal_*.sql`, non appliquées).

**Résolu** : §2 (`documents.category` = `text`, nullable, pas de CHECK,
`UNIQUE(user_id, category)`, FK `ON DELETE CASCADE`) ; §4 RLS activée
confirmée sur toutes les tables listées ; 4 policies confirmées non
sécurisées (`documents_all`, `dossiers_all`, `exam_results_all`,
`users_all`) ; `brand_briefs` INSERT public signalé à revoir ; buckets
`documents`/`formation` confirmés `public=true`.

**Toujours ouvert** : le TEXTE EXACT (`qual`/`with_check`) des policies sur
`client_messages`, `support_tickets`, `notifications`, `payments`,
`formation_progress`, `chapter_progress`, `client_deliverables`,
`deliverable_feedback`, `deliverable_files`, `leads` — rapportées comme
"scoped"/sans le motif `ALL true`, mais jamais transcrites mot pour mot :
ne pas les classer PASS avant d'avoir relu le texte exact via la requête
§4 ci-dessous. `leads` entièrement UNVERIFIED LIVE (aucune métadonnée
rapportée). Colonnes/types/contraintes/index (§1-§3) toujours UNVERIFIED
LIVE sauf `documents.category`.

## 1. Colonnes exactes + types (par table)

```sql
select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'users','leads','dossiers','documents','client_messages',
    'support_tickets','notifications','payments','formation_progress',
    'chapter_progress','exam_results','brand_briefs','client_deliverables',
    'deliverable_feedback','deliverable_files','packs',
    'lead_activity','lead_appointments','lead_tasks'
  )
order by table_name, ordinal_position;
```

Points spécifiques à vérifier dans le résultat (voir
`docs/PRODUCTION_WIRING_PLAN.md` pour pourquoi chacun compte) :

- **`documents.category`** — `data_type`/`udt_name` : si `text`/`varchar`
  → CASE A (aucune migration requise pour les catégories `associate_*`,
  voir `supabase/migrations/20260920_notes_associate_documents.sql`) ; si
  `USER-DEFINED` avec un `udt_name` custom → CASE B (migration
  `ALTER TYPE ... ADD VALUE` nécessaire, script déjà préparé dans le même
  fichier).
- **`client_messages`** — confirmer que `broadcast`/`read_at` existent bien
  tels que déduits (api.js:578-609, 1361-1391) et qu'aucune colonne de
  réponse cliente n'existe (confirmerait la nature "annonce à sens unique"
  déjà documentée).
- **`brand_briefs`** — confirmer la liste complète déduite du payload réel
  (`src/pages/student/Marketing.jsx:208-227`) : `pack_id, cabinet_name,
  contact_full_name, email, style_prefere, couleur_principale,
  couleur_secondaire, notes_style, domaine_souhaite,
  types_assurance_prioritaires, demandes_speciales, a_un_logo, logo_url,
  a_des_photos, photos_urls, instagram_existant, facebook_existant,
  reseaux_a_creer, user_id`.
- **`leads`** — jamais sélectionné avec une liste de colonnes explicite dans
  `api.js` (toujours `select('*')`) : cette requête est la SEULE façon de
  connaître le schéma complet de cette table.

## 2. Clés primaires / étrangères

```sql
select
  tc.table_name, kcu.column_name, ccu.table_name as references_table,
  ccu.column_name as references_column, tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name
where tc.constraint_type in ('FOREIGN KEY','PRIMARY KEY')
  and tc.table_schema = 'public'
order by tc.table_name;
```

Vérifier en particulier que `payments.user_id` référence bien
`public.users.id` via la contrainte `payments_user_id_public_users_fkey`
(nom vu tel quel dans api.js:544-546) et que `chapter_progress.user_id`
référence `auth.users` et NON `public.users` (commentaire api.js:634-637 —
à confirmer, jamais vérifié contre un vrai export).

## 2bis. Index existants (pertinents pour les filtres V2 par `user_id`/`clientId`)

```sql
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'users','leads','dossiers','documents','client_messages',
    'support_tickets','notifications','payments','formation_progress',
    'chapter_progress','exam_results','brand_briefs','client_deliverables',
    'deliverable_feedback','deliverable_files'
  )
order by tablename, indexname;
```

Vérifier en particulier qu'un index existe sur chaque colonne `user_id` (ou
équivalent) filtrée systématiquement côté V2 (`.eq('user_id', ...)` dans
tous les adaptateurs `src/local/adapters/supabase/*.supabase.js`) — sans
quoi chaque appel "mes documents"/"ma formation"/"mes paiements" ferait un
scan complet de la table en production.

## 3. Contraintes UNIQUE / CHECK (enums texte, valeurs autorisées)

```sql
select conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid::regclass::text in (
    'documents','payments','leads','support_tickets','notifications'
  )
order by conrelid::regclass::text;
```

Confirme/infirme : `UNIQUE(user_id, category)` sur `documents` (mentionné
dans les fichiers de notes existants, jamais vérifié directement), et toute
contrainte `CHECK` sur `leads.status`/`payments.status`/`payments.milestone`
(actuellement seulement des valeurs vues côté code, jamais une contrainte
DB confirmée).

## 4. RLS — activée/désactivée + policies exactes

```sql
select relname as table_name, relrowsecurity as rls_enabled, relforcerowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relname in (
    'users','leads','dossiers','documents','client_messages',
    'support_tickets','notifications','payments','formation_progress',
    'chapter_progress','exam_results','brand_briefs','client_deliverables',
    'deliverable_feedback','deliverable_files'
  );

select schemaname, tablename, policyname, permissive, roles, cmd,
       qual as using_expression, with_check as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Classer chaque table PASS / NEEDS REVIEW / MISSING en vérifiant :

- un `student` ne peut lire/écrire QUE ses propres lignes (`user_id =
  auth.uid()` ou équivalent) sur : `documents`, `dossiers`,
  `formation_progress`, `chapter_progress`, `exam_results`, `payments`,
  `client_messages`, `support_tickets`, `brand_briefs`,
  `client_deliverables` (via jointure `brand_brief_id`),
  `deliverable_feedback`/`deliverable_files` (via jointure
  `deliverable_id`), `notifications` (`audience='client' AND user_id =
  auth.uid()`).
- `admin`/`super_admin` peuvent lire (et pour certaines tables écrire) sur
  l'ensemble — vérifier qu'aucune policy n'omet `super_admin` en ne listant
  que `admin` (erreur fréquente).
- **Point déjà signalé non résolu** (`supabase/migrations/
  20260916_notes_notifications_schema_TODO.sql:41-44`) : la policy INSERT
  sur `notifications` pour un contexte admin insérant `audience='client'` +
  `user_id` arbitraire n'a jamais été auditée — à vérifier explicitement,
  ne pas supposer qu'elle est permissive.
- **`leads`/`lead_appointments`/`lead_tasks`/`lead_activity`** — ces tables
  n'ont aucune notion de "propriétaire client" (ce sont des prospects, pas
  encore des utilisateurs) : vérifier qu'elles sont bien réservées aux
  rôles admin/super_admin (`auth.uid()` doit correspondre à un `users.role`
  admin-like), jamais lisibles par un `student`.
- **Finance** (`payments`, `fetchFinanceSummary` côté api.js:539-572,
  commenté "Super-admin only") — vérifier qu'aucune policy SELECT sur
  `payments` ne permet à un simple `admin` (non super_admin) de lire les
  lignes d'un autre client au-delà de ce que l'UI Finance autorise déjà.

## 5. Storage — buckets et policies

```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets;

select policyname, roles, cmd, qual as using_expression, with_check as with_check_expression
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
```

Seul bucket trouvé dans le code (`api.js:187,192,1579,1753`) :
**`documents`**, réutilisé avec des préfixes de chemin pour les documents
client, les assets marketing (`marketing/`) et les livrables
(`deliverables/`). Vérifier :

- le bucket est privé (`public=false`) — les URLs client passent par
  `createSignedUrl()` (api.js:192), jamais par une URL publique nue, sauf
  pour `getPublicUrl()` (api.js:1581, 1755 — marketing/deliverables) : à
  confirmer si ces objets-là sont bien dans un sous-chemin public exprès ou
  une incohérence à corriger.
- les policies `storage.objects` empêchent un utilisateur de lister/lire un
  objet hors de son propre préfixe (`user_id`/dossier).
- existence d'un bucket séparé pour les vidéos Formation IAS1 (déjà
  identifié hors de `api.js` — voir le correctif CSP 2026-09-19,
  `cgmjjxosgnfsqupjketw.supabase.co/storage/v1/object/public/formation/...`)
  — ce bucket `formation` est PUBLIC (URLs directes sans signature) ; ce
  document ne s'y attarde pas plus, déjà géré séparément.

## 6. Comment reporter les résultats

Ne pas coller de données réelles de clients dans ce dépôt. Reporter
uniquement : le schéma/types/contraintes (métadonnées), le statut RLS
PASS/NEEDS REVIEW/MISSING par table, et les noms de policies — jamais une
ligne de données. Une fois confirmé, mettre à jour
`docs/PRODUCTION_WIRING_PLAN.md` (classification A/B/C par table) et, si
une policy manque, ajouter un fichier de proposition non exécutée dans
`supabase/migrations/` (même convention que les fichiers `*_notes_*.sql`
déjà présents), jamais l'exécuter directement depuis ce dépôt.
