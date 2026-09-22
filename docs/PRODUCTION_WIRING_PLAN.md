# Oriafen V2 — Plan de câblage production (préparation uniquement)

Ce document est une **préparation**. Rien ici n'a été exécuté sur Supabase
live, aucune migration n'a été appliquée, aucun environnement de production
n'a été touché. Il complète (sans le remplacer) le plan déjà présent dans
`README.md` (§ Activation future) et `docs/STAGING_CLIENT_TRACKING_PLAN.md`,
en couvrant les fonctionnalités V2 ajoutées depuis (associate documents,
Marketing, notifications admin, Formation IAS1/Vente & Scripts, Dossiers,
suivi Formation, identité canonique).

Toute la Preview V2 (`local-main.jsx` → `LocalAdminShell`) reste isolée :
`src/lib/supabase.js` garde `isConfigured = false` / `supabase = null`, et la
nouvelle couche `src/local/adapters/*` a `ADAPTER_MODE = 'local'` codé en
dur (jamais lu depuis une variable d'environnement — voir §7).

## 1. Authentification / session

**État actuel** : `local-main.jsx` monte `LocalAdminShell` directement, sans
`AuthProvider`, sans écran de login. Toute la session repose sur UN SEUL
client canonique (`CANONICAL_DEMO_CLIENT_ID`, `src/local/model.js`),
désormais résolu via `src/local/adapters/identity.js::getActiveIdentity()`
plutôt qu'importé en dur dans chaque composant.

**Architecture V1 (inspectée, non modifiée)** — `src/context/AuthContext.jsx` :

```
auth.users (Supabase Auth, session)
  id (UUID)
        │
        │ même PK, ligne auto-créée au 1er login (fetchOrCreateProfile)
        ▼
public.users
  id (UUID, = auth.users.id)
  email, full_name, role ('student'|'admin'|'super_admin')
  pack_purchased, blocked
```

- Connexion : `supabase.auth.signInWithPassword(email, password)`.
- Rôle : lu depuis `public.users.role` (repli sur l'email si la lecture DB
  time-out — `roleFromEmail()`).
- Blocage : `public.users.blocked` → déconnexion forcée.
- Étudiant annulé : `dossiers.status = 'Annulé'` (lié par `user_id`) →
  connexion refusée.
- Mode démo (`isConfigured=false`, ce qui est le cas de CE dépôt entier
  aujourd'hui, y compris côté V1) : comptes en dur
  `student@oriafen.com` / `admin@oriafen.com`.

**Contrat de câblage (préparé dans `identity.js`, PAS activé)** :

```js
// Preview (actuel) :
getActiveIdentity() → { id: CANONICAL_DEMO_CLIENT_ID, name: 'Client Démo', role: 'client' }

// Production (à activer plus tard, ADAPTER_MODE='supabase') :
getActiveIdentity() → dérivé de useAuth().user :
  { id: user.id /* = public.users.id, UUID */, name: user.name, email: user.email, role: user.role }
```

Étapes concrètes (non exécutées) :
1. Réactiver `src/App.jsx`/`AuthProvider` comme point d'entrée réel (ou une
   variante V2 qui les réutilise) — ces fichiers sont déjà intacts.
2. Transformer `getActiveIdentity()` en hook (`useActiveIdentity()`) qui lit
   `useAuth()` quand `ADAPTER_MODE==='supabase'`, garde le comportement
   actuel sinon.
3. Remplacer, dans chaque composant `Local*` qui reçoit un `clientId`, la
   source par l'identité résolue (déjà fait pour `ClientSpace` et
   `AdminMarketingPanel` cette session — reste à étendre à `LocalMesDocuments`,
   `LocalMaFormation`, etc. quand ils sont montés côté client réel, plutôt
   que de continuer à recevoir un simple prop `clientId` figé).
4. Réintroduire les gardes de rôle (`ProtectedRoute`, déjà présents dans
   `src/App.jsx`, non modifiés) pour l'admin shell.

## 2. Identité canonique — chaîne complète

```
auth.users.id  ===  public.users.id  (rôle: student/admin/super_admin)
                        ▲
                        │ leads.converted_user_id (après conversion)
                        │
                     leads.id  (pipeline CRM, PRE-conversion — id différent)
```

**Règle unique** : tout ce qui est scope-par-client (documents, associate
documents, marketing, support/messages, notifications, formation, dossier,
paiements) est TOUJOURS indexé par `public.users.id`, jamais par `leads.id`
directement. Un admin qui ouvre une fiche CRM (`leads.id`) doit résoudre
`leads.converted_user_id` avant d'appeler un des adaptateurs ci-dessous.

**État V2 aujourd'hui** : `CANONICAL_DEMO_CLIENT_ID` joue artificiellement
les deux rôles à la fois (c'est un `leads.id` ET l'id utilisé par tous les
stores locaux) parce qu'il n'existe qu'un seul client de démo, toujours déjà
converti. En production, ces deux id seront différents (un UUID vs un entier
CRM) — l'adaptateur `identity.js` est le seul endroit qui devra faire cette
résolution.

**Aucun id parallèle n'a été créé** : chaque store local (`documentsStore`,
`clientTrackingStore`, `marketingStore`, `formationProgressStore`,
`dossierStepStore`) prend le même paramètre `clientId` et ne connaît rien
d'autre — la même valeur résolue par `identity.js` traverse tous les modules
sans transformation.

## 3. Documents + documents associé

| V1 (origin/main, lecture seule) | État |
|---|---|
| Table `documents` : `id, user_id, category, status, file_url, rejection_reason, rejected_at, rejected_by, uploaded_at` | Existe en live |
| Bucket Storage pour les fichiers | Existe en live (nom exact non documenté dans ce dépôt — à confirmer sur le dashboard) |
| Versioning (plusieurs versions par catégorie) | **N'existe PAS en live** — préparé uniquement (`supabase/migrations/20260916_test_local_document_versions.sql`, jamais appliqué) |
| Catégories `associate_*` (CIN associé recto/verso, justificatif domiciliation, autre) | **N'existe dans aucun schéma versionné** — nouveau |

**Classification** : B (extension du schéma existant) pour le versioning ;
**A dans le cas le plus probable, sinon B** pour les catégories associé —
voir `supabase/migrations/20260920_notes_associate_documents.sql` (nouveau,
2026-09-20) : si `documents.category` est un simple `text` (cas le plus
probable au vu des catégories existantes), aucune migration n'est
nécessaire, seulement de nouvelles valeurs de `category` ; si c'est un enum
Postgres, une migration `ALTER TYPE ... ADD VALUE` est nécessaire (détail
dans ce fichier de notes, non exécuté).

**Migrations déjà préparées (non exécutées)**, à valider dans l'ordre — voir
`supabase/migrations/README.md` pour l'ordre complet et à jour :
1. `20260916_test_local_tracking_columns.sql`
2. `20260916_test_local_documents_rejection.sql`
3. `20260916_test_local_document_versions.sql`
4. `20260920_notes_associate_documents.sql` (nouveau — mapping/cas A vs B)

Pas de nouvelle colonne `owner_type` recommandée : les catégories
`associate_*` sont déjà des valeurs de `category` distinctes, jamais
réutilisées entre client et associé (garanti côté code —
`isAssociateCategory()`).

**Adaptateur** : `src/local/adapters/documentsAdapter.js` (créé cette
session) — enveloppe `documentsStore.js`/`associateDocuments.js`, même
interface prévue pour un futur module Supabase (upload réel vers Storage +
insert/update `documents`).

**Optionnalité préservée** : le dénominateur de progression du dossier
principal (`LocalMesDocuments.jsx`) ne compte que `REQUIRED_DOCUMENTS` — les
catégories `associate_*` n'y entrent jamais, quel que soit l'adaptateur.

## 4. Marketing + notifications

**Corrigé 2026-09-20** (relecture des corps de fonction `src/lib/api.js` +
du fichier de notes existant sur `public.notifications`) :

| Fonctionnalité | V1 équivalent | Classification |
|---|---|---|
| Projet/livrables/demandes de modification (`marketingStore.js`) | `brand_briefs` (projet), `client_deliverables` (statut/lien/notes), `deliverable_files` (livrables), `deliverable_feedback` (une ligne = une remarque, avec `section`/`status` — `SITE_FEEDBACK_SECTIONS` fournit déjà la liste de sections en langage client) | **B — mapping de champs, pas une nouvelle table.** Mapping exact dans `supabase/migrations/20260920_notes_marketing_reconciliation.sql` (nouveau). Le schéma live est en fait un bon candidat : `deliverable_feedback` correspond presque terme à terme aux "demandes de modification" locales. |

**`brand_briefs` — colonnes CONFIRMÉES (2026-09-21)**, lues directement dans
le payload réel construit et envoyé par `src/pages/student/Marketing.jsx:208-227`
(`handleSubmit` → `submitBrandBrief(payload)`, V1, non modifié) : `pack_id,
cabinet_name, contact_full_name, email, style_prefere, couleur_principale,
couleur_secondaire, notes_style, domaine_souhaite,
types_assurance_prioritaires (array), demandes_speciales, a_un_logo,
logo_url, a_des_photos, photos_urls (array), instagram_existant,
facebook_existant, reseaux_a_creer`, plus `user_id` (ajouté par
`submitBrandBrief`, api.js:1561-1563) et `id`/`created_at` (implicites). Le
gap précédemment noté ("payload spread, colonnes inconnues") est résolu —
plus aucune inconnue sur cette table.

**Progression par canal — NOUVEAU champ LOCAL UNIQUEMENT (2026-09-22, retour
client)** : `marketingStore.js::CHANNEL_DEFS`/`getMarketingChannels`/
`updateMarketingChannel` — statut/progression/étape/reste-à-faire
individuels pour site web, Instagram, Facebook, Ads Manager. **Aucune
colonne live confirmée pour cette donnée** dans l'audit schéma (ni
`brand_briefs`, ni `client_deliverables`, ni `deliverable_feedback` n'ont
de colonne de progression par canal) — **classification C (nouveau
schéma requis)**, à confirmer/concevoir lors d'une session de câblage
production dédiée (probablement une table `marketing_channel_progress`
avec `user_id, channel_id, status, progress_pct, current_step,
remaining_work, updated_at`, ou des colonnes dédiées ajoutées à
`client_deliverables` si un canal = un livrable). Jamais deviné/exécuté
ici — champ 100% local, migration non destructive
(`ensureClient`/`defaultChannels`), jamais une valeur inventée (0%/"À
démarrer" par défaut, modifiable UNIQUEMENT par l'admin).
| Notifications admin (`adminNotificationsStore.js`) | `public.notifications` supporte déjà `audience='admin'` (colonnes confirmées : `audience, user_id, type, title, body, link_tab, related_id, read_at` — voir `20260916_notes_notifications_schema_TODO.sql`) | **A — table déjà existante et déjà compatible**, corrigé depuis un classement initial erroné en C. Mapping exact champ par champ dans `supabase/migrations/20260920_notes_admin_notifications_mapping.sql` (nouveau) — `message` locale devient `body`, `context.tab`/`context.clientId` deviennent `link_tab`/`related_id`. Seuls deux points restent à confirmer avant activation : la policy RLS d'INSERT pour une ligne `audience='admin'`, et l'ajout éventuel d'un index UNIQUE pour le dédoublonnage (`dedupe_key`, actuel uniquement local). |

**Adaptateur** : `src/local/adapters/marketingAdapter.js` (le contrat
`support`/notifications admin reste dans `supportAdapter.js`, voir §5).

**RLS à prévoir (nouveau schéma)** : un client ne doit lire/écrire que ses
propres demandes (`user_id = auth.uid()`) ; l'admin/super_admin lit tout ;
`admin_notifications` lisible uniquement par les rôles admin/super_admin.

## 5. Support / messages

| V1 équivalent | Colonnes connues (README §3, api.js) |
|---|---|
| `support_tickets` | `id, user_id, subject, message, category, priority, status, response, source, created_at` |
| `client_messages` | **CONFIRMÉ (2026-09-21)** : `id, user_id, message, broadcast (bool), read_at, created_at` — `sendAdminMessage()` (api.js:578-609) insère `user_id, message, broadcast` ; `fetchMyMessages()`/`markMessageRead()` (api.js:1361-1391) confirment `read_at`/`created_at`. |
| `notifications` | déjà utilisée en prod, schéma non versionné (README §2, point 5) |

**`client_messages` — nature confirmée (2026-09-21)** : c'est un canal
UNIDIRECTIONNEL admin → client (annonce/broadcast), PAS un fil de discussion
avec réponse — aucune fonction `api.js` n'insère de réponse client dans
cette table (`subscribeToMyCommunications`, api.js:1393-1409, l'écoute en
lecture seule). Les réponses client passent exclusivement par
`support_tickets.response`. Le modèle V2 local (`clientTrackingStore.js`,
un item = un fil bidirectionnel) NE correspond PAS 1:1 à `client_messages` —
il correspond à `support_tickets`. `client_messages` doit plutôt être
mappée aux "annonces"/diffusions ponctuelles, un usage plus proche de
`notifications` que de `support_tickets`. À trancher avant activation :
soit mapper les annonces admin de `clientTrackingStore.js` vers
`client_messages` (broadcast) séparément des fils de support (déjà mappés à
`support_tickets`), soit ne pas les distinguer et tout faire passer par
`support_tickets` (plus simple, perd la distinction "annonce large diffusion
vs fil dédié"). Décision produit à prendre, pas un blocage technique.

**Classification** : **A/B — schéma existant probablement suffisant**. Le
modèle V2 (`clientTrackingStore.js` : un item = un fil, `senderType`
'team'|'client', `.response` pour la réponse, `reminders[]` pour les
relances) correspond à `support_tickets` (un ticket = un fil, `response` =
réponse admin), PAS à `client_messages` (voir ci-dessus) — pas de
réécriture de schéma nécessaire, seule la colonne `notifications` reste à
confirmer sur le schéma live (déjà signalé README §3).

**Isolation des fils** : garantie par construction (id stable par item,
jamais recyclé) — testée dans `local-check-adapters.mjs` et
`local-check-support-ordering.mjs`. Le contrat production doit préserver
cette propriété : chaque réponse cible un `id` de ticket précis, jamais une
recherche floue par client+sujet.

**Adaptateur** : `src/local/adapters/supportAdapter.js`.

## 6. Formation / dossier / paiements

Ce sont les trois domaines où le **schéma live existe déjà et n'a besoin
d'aucune extension** — reconnexion uniquement.

| Domaine | Store local (V2) | Fonctions live équivalentes (api.js, non modifiées) |
|---|---|---|
| Progression Formation IAS1 | `formationProgressStore.js` | `fetchFormationProgress`, `fetchChapterProgress`, `saveChapterProgress`, `markUnitComplete`, `startUnit`, `fetchExamResults`, `saveExamResult` |
| Étapes du dossier | `dossierStepStore.js` | `updateDossierStep` (table `dossiers`, colonne `current_step`) |
| Paiements / conversion | `conversion.js` | `convertLeadToClient`, `markPaymentPaid`, `fetchClientPayments` (table `payments`) |

**Classification : A (schéma existant suffisant)** pour les trois.
`src/local/adapters/formationAdapter.js` documente exactement quelle
fonction locale remplacer par quelle fonction `api.js` — le swap se fait à
l'intérieur de ce seul fichier, sans toucher aux composants qui l'appellent.

**Règle de paiement préservée** : `applyPaymentValidation()` exige déjà un
pack sélectionné avant de valider (même garde que le bouton live
`disabled={!packId}`) — testé dans `local-check-adapters.mjs` (§7 :
"gate de paiement jamais contourné"). Aucune règle métier Finance n'a été
modifiée ni ne doit l'être lors de la reconnexion.

## 7. Séparation Preview / Production

- `ADAPTER_MODE` (`src/local/adapters/identity.js` et chaque adaptateur) est
  une **constante codée en dur**, jamais lue depuis `import.meta.env` ou une
  variable Vercel — aucune configuration de déploiement ne peut donc jamais
  faire basculer la Preview vers un mode "supabase" par accident.
- Chaque fonction d'adaptateur appelle `assertLocalMode()` en premier, qui
  lève une exception explicite si `ADAPTER_MODE !== 'local'` — double
  verrou (constante + garde d'exécution).
- `src/lib/supabase.js` reste `isConfigured=false`/`supabase=null` — non
  modifié.
- Activation future : un adaptateur `*.supabase.js` par domaine (identity,
  documents, marketing, support, formation) devra être écrit, revu, testé
  sur un projet Supabase de **test/staging** (jamais directement en prod),
  puis `ADAPTER_MODE` changé fichier par fichier — jamais globalement d'un
  coup — pour permettre un rollback ciblé.

## 8. Récapitulatif schéma — classification complète

| Fonctionnalité | Classification | Action requise avant activation |
|---|---|---|
| Auth / session (users, dossiers.status) | A | Aucune — reconnecter `identity.js` |
| Documents client (6 catégories) | A | Aucune — reconnecter `documentsAdapter.js` |
| Versioning des documents | B | Appliquer la migration déjà écrite (`document_versions`) sur un projet de test |
| Documents associé | **A — CONFIRMÉ LIVE (2026-09-21)** | `documents.category` est `text`, nullable, aucune contrainte CHECK, `UNIQUE(user_id, category)`, `user_id` → `users(id)` `ON DELETE CASCADE`. Aucune migration nécessaire pour `associate_cin_recto`/`associate_cin_verso`/`associate_justificatif_domiciliation`/`associate_autre_*` — voir `20260922_proposal_fix_documents_policy.sql`. |
| Marketing (projet/livrables/demandes) | B | Mapper vers `brand_briefs`/`client_deliverables`/`deliverable_feedback`/`deliverable_files` (voir `20260920_notes_marketing_reconciliation.sql`) — pas de nouvelle table |
| Notifications admin | A | `public.notifications` supporte déjà `audience='admin'` (voir `20260920_notes_admin_notifications_mapping.sql`) — confirmer seulement la policy RLS INSERT + un éventuel index de dédoublonnage |
| Support / tickets | A/B | Confirmer les colonnes exactes de `client_messages`/`notifications` |
| Formation IAS1 (progression, examen) | A | Aucune — reconnecter `formationAdapter.js` |
| Vente & Scripts (évaluation) | A | Aucune — `exam_results` avec `exam_type='commercial'` déjà supporté côté live |
| Dossier (étapes) | A | Aucune — reconnecter `formationAdapter.js` |
| Paiements / conversion | A | Aucune — reconnecter `formationAdapter.js` |
| Vidéos/diapositives Formation | — | CSP de production à autoriser pour le bucket Storage concerné (déploiement, pas schéma) |

**Correction 2026-09-20** : sur relecture complète de `src/lib/api.js` et du
fichier de notes déjà présent sur `public.notifications`, AUCUNE nouvelle
table n'est en fait nécessaire pour l'ensemble des fonctionnalités
auditées — seulement des mappings de champs (Marketing, notifications
admin) et une vérification de type de colonne (documents associé). Ordre de
migration recommandé, mis à jour : 1) valider les 3 migrations déjà
préparées (tracking/rejection/versions) sur un projet de test, 2) confirmer
les colonnes exactes de `client_messages`/`brand_briefs`/
`client_deliverables`/`deliverable_feedback`/`documents.category` sur le
schéma live (un seul export de schéma peut répondre à plusieurs de ces
questions à la fois), 3) écrire les vraies migrations de mapping une fois
ces colonnes confirmées, 4) reconnecter en dernier les adaptateurs "A"
(formation/dossier/paiements/notifications admin), qui ne nécessitent
aucun changement de schéma et peuvent donc être faits sans attendre les
autres.

## 9. CRM (prospects, statut, prochaine action, historique, RDV, relances)

**Gap comblé (2026-09-21)** : aucun adaptateur n'existait pour le pipeline
CRM lui-même (`leads` — model.js/clientHistory.js/relance.js/
appointments.js), alors que documents/marketing/support/formation en
avaient déjà un chacun. `src/local/adapters/crmAdapter.js` (créé cette
session) comble ce trou, même convention que les autres : enveloppe fine,
`assertLocalMode()` sur chaque fonction, aucune règle métier réécrite.

| Fonctionnalité locale | Table live équivalente (api.js, non modifiée) |
|---|---|
| Prospects (liste/filtre/tri) | `leads` (`fetchLeads`) |
| Statut / étape CRM | `leads.status` (`updateLeadStatus`) — le gate paiement (`canSetStageToClient`, conversion.js) s'applique de la même façon en production : un statut ne peut jamais devenir "Client" sans paiement validé |
| Prochaine action | `leads.next_action`/`next_action_due`/`next_action_owner` (`updateLeadNextAction`) |
| Historique / commentaires | `lead_activity` ou équivalent (`addLeadComment`) — même contrat que `buildLeadTimeline` (clientHistory.js), qui fusionne déjà activity + activityLog post-conversion |
| RDV | `lead_appointments` |
| Tâches | `lead_tasks` |
| Relances | dérivées des dates de tracking existantes, aucune nouvelle colonne |
| Conversion / paiement | `convertLeadToClient`, réutilise le même `applyPaymentValidation` déjà réexporté par `formationAdapter.js` — UN SEUL point de vérité, jamais une seconde implémentation dans `crmAdapter.js` |

**Classification : A (schéma existant suffisant)** — aucune migration
requise pour reconnecter le CRM, seule l'authentification réelle
(§1) doit être en place au préalable (résolution `leads.converted_user_id`
→ `public.users.id`, voir §2).

## 10. RLS — statut par table (audit "strict read-only schema/RLS verification", 2026-09-22)

**Accès live disponible : NON**, re-confirmé à cette date — `src/lib/supabase.js`
exporte `isConfigured=false`/`supabase=null` codé en dur dans ce checkout,
aucune variable d'environnement Supabase n'est présente, aucun CLI
`supabase`, aucun outil MCP Supabase. Ce n'est pas un choix de ce commit :
c'est une contrainte d'environnement absolue, vérifiée explicitement à
chaque audit (2026-09-21 et 2026-09-22, même résultat).

Conséquence : AUCUNE table ci-dessous ne peut être classée PASS / NEEDS
REVIEW / MISSING de bonne foi — ces trois verdicts supposent tous d'avoir
lu `pg_policies`/`pg_class.relrowsecurity` au moins une fois, ce qui n'a
jamais été possible. Chaque table reste donc **UNVERIFIED LIVE** tant que
la checklist ci-dessous n'a pas été exécutée manuellement par quelqu'un
disposant d'un accès réel :

**Mise à jour 2026-09-21/22** : un audit live en lecture seule a depuis été
rapporté pour une partie de ces tables — voir §12 "VERIFIED LIVE SUPABASE
SECURITY FINDINGS" ci-dessous pour le détail exact (policies nommées,
propositions de correctif). Table mise à jour en conséquence ; les lignes
non mentionnées en §12 restent UNVERIFIED LIVE au sens strict (RLS
activée : oui pour toutes, confirmé ; texte exact des policies : non
transcrit pour ces lignes-là).

| Table | RLS activée | Policies | Statut |
|---|---|---|---|
| users | OUI (confirmé live) | `users_all` (public, ALL, true/true) | **CONFIRMED UNSAFE** — voir §12.1 |
| leads | ? | ? | UNVERIFIED LIVE |
| dossiers | OUI (confirmé live) | `dossiers_all` (public, ALL, true/true) | **CONFIRMED UNSAFE** — voir §12.1 |
| documents | OUI (confirmé live) | `documents_all` (public, ALL, true/true) | **CONFIRMED UNSAFE** — voir §12.1 |
| client_messages | OUI (confirmé live) | non transcrites (rapporté "scoped", motif `ALL true` absent) | NEEDS REVIEW (preuve partielle) — voir §12.3 |
| support_tickets | OUI (confirmé live) | non transcrites (rapporté "scoped") | NEEDS REVIEW (preuve partielle) — voir §12.3 |
| notifications | OUI (confirmé live) | non transcrites (rapporté "scoped") | NEEDS REVIEW (preuve partielle) — voir §12.3 ; point déjà signalé non audité : policy INSERT pour `audience='admin'` (`20260916_notes_notifications_schema_TODO.sql:41-44`) |
| payments | OUI (confirmé live) | non transcrites (rapporté "scoped") | NEEDS REVIEW (preuve partielle) — voir §12.3 ; sensibilité Finance (super_admin only, `fetchFinanceSummary`, api.js:538) |
| formation_progress | OUI (confirmé live) | non transcrites (rapporté "scoped") | NEEDS REVIEW (preuve partielle) — voir §12.3 |
| chapter_progress | OUI (confirmé live) | non transcrites (rapporté "scoped") | NEEDS REVIEW (preuve partielle) — voir §12.3 ; référence `auth.users` et non `public.users` d'après un commentaire du code (api.js:634), à confirmer |
| exam_results | OUI (confirmé live) | `exam_results_all` (public, ALL, true/true) | **CONFIRMED UNSAFE** — voir §12.1 |
| brand_briefs | OUI (confirmé live) | "Public can insert brand briefs" (public, INSERT, with_check true) | NEEDS REVIEW — voir §12.2 |
| client_deliverables | OUI (confirmé live) | non transcrites (rapporté "scoped") | NEEDS REVIEW (preuve partielle) — voir §12.3 |
| deliverable_feedback | OUI (confirmé live) | non transcrites (rapporté "scoped") | NEEDS REVIEW (preuve partielle) — voir §12.3 |
| deliverable_files | OUI (confirmé live) | non transcrites (rapporté "scoped") | NEEDS REVIEW (preuve partielle) — voir §12.3 |

Seule table où le CODE (jamais la DB) montre déjà un filtrage cohérent par
utilisateur (`select().eq('user_id', userId)` systématique côté client, admin
utilisant des fonctions séparées sans filtre) : toutes celles ci-dessus,
sans exception — mais ceci prouve seulement que l'APPLICATION filtre côté
client, jamais que la policy RLS empêcherait un accès direct contournant
l'application (ex. via l'API REST Supabase avec le anon key). Seule une
lecture réelle de `pg_policies` peut trancher — voir
`docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md` §4, requêtes prêtes à
copier-coller, jamais exécutées ici.

**Isolation client A / client B** : ne peut donc pas non plus être
confirmée au niveau base de données cette session — seulement au niveau
Preview locale (testé : `local-check-adapters.mjs`, "aucune fuite de
données entre deux clients à travers les 4 adaptateurs"), ce qui prouve que
le CODE de l'adaptateur ne mélange jamais deux `clientId`, mais ne dit rien
de la policy RLS réelle côté production.

## 11. CLIENT DATA & ACCESS PRESERVATION CONTRACT (audit 2026-09-22)

Ce que DOIT rester inchangé pour un client existant une fois V2 activée —
aucun de ces points n'est négociable, une régression sur l'un d'eux bloque
l'activation quelle que soit la couverture de tests par ailleurs.

### 11.1 Identité — chaîne canonique confirmée par le code (V1, lecture seule)

```
auth.users.id  ===  public.users.id  (même PK)
                        ▲
                        │ leads.converted_user_id (une fois converti)
                     leads.id  (pipeline CRM, PRE-conversion)
```

Tous les modules côté client (dossier, documents, documents associé,
formation, chapitre, examens, paiements, marketing, support, notifications)
sont indexés par `public.users.id` — JAMAIS `leads.id` — confirmé dans
`src/lib/api.js` pour chaque table (voir §§1-10 ci-dessus, chaque appel
`.eq('user_id', userId)` prend l'id résolu depuis la session, jamais
`leadId`). Un client déjà converti garde donc le MÊME `public.users.id`
avant/après V2 : aucune recréation, aucun nouvel id, tant que
`identity.supabase.js::getIdentityFromAuthUser()` (préparé, non activé)
reste le seul point de résolution utilisé.

### 11.2 GAP TROUVÉ ET CORRIGÉ CETTE SESSION — repli "Client Démo" réel

**Constat** : `ClientSpace` (composant interne de `src/local/LocalCRM.jsx`,
monté par `productionEntry.proposal.jsx` en mode client) appelait
`getActiveIdentity()` SANS AUCUN ARGUMENT — cette fonction (Preview,
`identity.js`) renvoie alors TOUJOURS l'identité de démo
(`CANONICAL_DEMO_CLIENT_ID`), quel que soit l'utilisateur réellement
authentifié par `AuthContext`. Si ce point d'entrée avait été activé sans
correction, TOUT étudiant connecté aurait silencieusement vu les données du
"Client Démo" (id 6) au lieu des siennes — un vrai risque de fuite de
données, pas une simple valeur par défaut cosmétique.

**Correctif appliqué (additif, Preview inchangée)** : `LocalCRM` accepte
désormais un prop optionnel `clientId` (défaut `null`, comportement Preview
identique), transmis à `ClientSpace` via `overrideClientId`, qui l'utilise
avec le mécanisme d'override déjà existant de `getActiveIdentity(override)`
(le même que celui utilisé par l'admin pour consulter la fiche d'un autre
client). `productionEntry.proposal.jsx` passe désormais `clientId={user.id}`.
Fichiers modifiés : `src/local/LocalCRM.jsx`,
`src/local/adapters/supabase/productionEntry.proposal.jsx`.

**Portée du correctif** : uniquement `ClientSpace`/`LocalCRM`. Les autres
composants client (`LocalMesDocuments`, `LocalMaFormation`,
`ClientMarketingPanel`) exigent déjà un prop `clientId` obligatoire (aucun
repli interne) — ils étaient déjà sûrs. `LocalMonDossier`/
`AdminMarketingPanel` utilisaient déjà le pattern `clientId =
getActiveClientId()` (paramètre par défaut, surchageable) — déjà sûrs eux
aussi. `ClientSpace` était le seul point sans aucun mécanisme de surcharge.

### 11.3 Contrat de préservation de SESSION

**Réponse (fondée sur le code V1, pas une supposition)** : **A — la session
existante devrait se restaurer automatiquement**, À CONDITION que V2 :
- réutilise le MÊME client Supabase singleton que V1 (même URL de projet,
  même clé anon, aucune seconde instance `createClient()` créée séparément
  dans `identity.supabase.js` ou ailleurs — aucun de ces fichiers n'en crée
  une, vérifié : ils importent `../../../lib/api.js`, jamais
  `@supabase/supabase-js` directement) ;
- est servie depuis le MÊME domaine que V1 (`app.oriafen.com`) — le
  `localStorage` du SDK Supabase est scindé par origine, pas par bundle JS ;
  aucun sous-domaine séparé ne doit être introduit pour V2 sans revalider ce
  point ;
- ne modifie pas l'option `storageKey` de `supabase.auth` (aucun code de ce
  dépôt, local ou proposé, ne le fait — confirmé par lecture de
  `src/lib/supabase.js` et de tous les fichiers `*.supabase.js`).

`AuthContext.jsx` (`getSession()` + `onAuthStateChange()`, lignes 121-160)
gère déjà la restauration de session — non modifié, non dupliqué par la
couche V2.

**Causes de déconnexion forcée identifiées** (à éviter, aucune n'est
présente dans le code actuel de ce dépôt) : clé de storage Supabase
changée ; second client Supabase initialisé en parallèle ; domaine/origine
différent entre V1 et V2 ; retrait/relecture différente de
`AuthProvider`/`ProtectedRoute` (non modifiés ici) ; timeout de chargement
du profil (comportement PRÉEXISTANT côté V1, `AuthContext.jsx` bascule déjà
sur `roleFromEmail()` en repli — pas une régression V2 si le même code est
réutilisé tel quel, ce qui est le cas dans `productionEntry.proposal.jsx`).

**Compte bloqué/annulé** : logique déjà présente et réutilisée telle quelle
(`AuthContext.jsx`, blocage → déconnexion forcée ; `dossiers.status ===
'Annulé'` → déconnexion forcée) — non réimplémentée, non modifiée.

### 11.4 Matrice de préservation des données client

| Domaine | Source V1 (table) | Clé d'identité | Source V2 (préparée) | Statut |
|---|---|---|---|---|
| Profil utilisateur | `public.users` | `id` | `identity.supabase.js` | PASS (délègue à `api.js`, aucune donnée locale) |
| Dossier / étape courante | `dossiers.current_step` | `user_id` | `dossier.supabase.js` | PASS |
| Historique des étapes | — (absent côté V1) | — | proposition non appliquée (`20260921_notes_dossier_step_history_gap.sql`) | LOCAL-ONLY (fonctionnalité V2 sans équivalent live — voir §12) |
| Documents (6 catégories) | `documents` | `user_id` | `documents.supabase.js` | PASS |
| Documents associé | `documents` (mêmes lignes, `category` distincte) | `user_id` | `documents.supabase.js` | PASS — type de `category` CONFIRMÉ LIVE (`text`, voir §12), aucune migration requise |
| Formation (unités/heures) | `formation_progress` | `user_id` | `formation.supabase.js` | PASS |
| Chapitres complétés | `chapter_progress` | `user_id` (référence `auth.users`, pas `public.users` d'après un commentaire du code — à confirmer) | `formation.supabase.js` | PARTIAL — FK exacte UNVERIFIED LIVE |
| Résultats d'examen | `exam_results` | `user_id` | `formation.supabase.js` | PASS |
| Paiements | `payments` | `user_id` | `payments.supabase.js` | PASS |
| Brief marketing | `brand_briefs` | `user_id` | `marketing.supabase.js` | PASS (schéma désormais entièrement confirmé, voir §4) |
| Livrables | `client_deliverables` | via `brand_brief_id` (jointure) | `marketing.supabase.js` | PASS |
| Feedback / fichiers livrables | `deliverable_feedback` / `deliverable_files` | `deliverable_id` | `marketing.supabase.js` | PASS |
| Support | `support_tickets` | `created_by` | `support.supabase.js` | PASS |
| Messages/annonces | `client_messages` (unidirectionnel, voir §5) | `user_id` | `support.supabase.js` | PASS (mais modèle différent de V2 local, voir §5) |
| Notifications | `notifications` | `user_id` / `audience` | `notifications.supabase.js` | PASS (schéma), RLS UNVERIFIED LIVE |
| Rattachement CRM → client | `leads.converted_user_id` | `leads.id` → `public.users.id` | `crm.supabase.js` (`convertToClient`) | PASS |

Aucune ligne "BLOCKED" : aucun domaine n'exige de réécriture de schéma pour
préserver les données existantes. Les deux lignes "PARTIAL" ne bloquent pas
la préservation des données déjà existantes (elles concernent des détails
non encore confirmés, pas une incompatibilité connue) ; la ligne
"LOCAL-ONLY" concerne une fonctionnalité AJOUTÉE par V2 (historique des
étapes), jamais une donnée existante qui serait perdue.

### 11.5 Continuité formation — attentes de non-régression

Exemple concret (à valider en environnement de test réel avant activation,
jamais simulé avec des données inventées ici) :

- Avant V2 : chapitre X marqué complété (`chapter_progress`), unité Y à
  `hours_completed` = H, examen Z avec `passed=true`/`score=S`.
- Après V2 (adaptateur `formation.supabase.js` activé) : MÊME chapitre X
  complété, MÊME H, MÊME `passed`/`score` — car `fetchFormationProgress`/
  `fetchChapterProgress`/`fetchExamResults` (api.js) sont appelées SANS
  transformation par l'adaptateur (`getProgress`/`getChapters`/
  `getExamResults`, wrappers directs).
- Le widget dashboard et la page Formation IAS1 lisent déjà la MÊME source
  côté V2 local (correctif "final data consistency", 2026-09-20) — ce
  contrat de source unique s'applique identiquement une fois
  `formation.supabase.js` activé (aucune double implémentation).

### 11.6 Continuité dossier — étape/statut/documents/rejets

Même principe : `dossier.supabase.js::getDossier()` délègue à
`fetchDossier()` (api.js, non modifié) — `current_step`, `status`,
documents liés restent EXACTEMENT ceux déjà en base. Seul
`getStepHistory()` lève intentionnellement (voir §9/§dossier.supabase.js) —
aucun historique n'est inventé pour masquer l'absence de la fonctionnalité
côté live.

### 11.7 Aucun repli "Client Démo" restant dans le chemin production

Recherche exhaustive (2026-09-22) sur `src/local/adapters/supabase/*` et
`src/local/adapters/crmAdapter.js` :

```
grep -rn "CANONICAL_DEMO_CLIENT\|Client Démo\|getActiveClientId()\|getActiveIdentity()" \
  src/local/adapters/supabase src/local/adapters/crmAdapter.js
```

Résultat : AUCUNE occurrence hors commentaires explicatifs (voir
`local-check-supabase-adapters.mjs`, test dédié). Le seul repli identité
trouvé était `ClientSpace` (§11.2 ci-dessus), maintenant corrigé.
`identity.supabase.js::getIdentityFromAuthUser()` lève explicitement s'il
n'y a pas d'utilisateur authentifié — jamais un repli silencieux.

## 12. VERIFIED LIVE SUPABASE SECURITY FINDINGS — 2026-09-21

Ce qui suit provient d'un audit métadonnées Supabase EN LECTURE SEULE,
fourni par l'utilisateur (accès live réel obtenu hors de cet
environnement — cette session ne peut toujours initier aucune connexion
Supabase elle-même, voir §7/§10). Remplace le statut "UNVERIFIED LIVE" du
§10 pour les tables concernées ci-dessous ; les autres tables du §10 (celles
non listées ici) restent UNVERIFIED LIVE tant qu'aucune métadonnée les
concernant n'a été rapportée.

### 12.1 CONFIRMED UNSAFE

Policy avec `role public`, `cmd ALL`, `qual true`, `with_check true` — sans
restriction, n'importe quelle requête (y compris non authentifiée) peut
lire/écrire/supprimer n'importe quelle ligne :

| Table | Policy | Impact concret |
|---|---|---|
| `documents` | `documents_all` | N'importe qui peut lire/modifier/supprimer les documents d'identité de N'IMPORTE QUEL client (CIN, passeport, justificatif de domicile...). |
| `dossiers` | `dossiers_all` | N'importe qui peut lire/modifier l'étape/statut du dossier ORIAS de n'importe quel client, y compris annuler un dossier. |
| `exam_results` | `exam_results_all` | N'importe qui peut lire/modifier les résultats d'examen de n'importe quel client. |
| `users` | `users_all` | N'importe qui peut lire/modifier le profil (y compris `role`, `blocked`) de n'importe quel utilisateur — le plus critique des quatre : un accès non authentifié pourrait potentiellement s'auto-promouvoir `role='admin'` ou débloquer un compte bloqué. |

Propositions de correctif (non appliquées) : voir
`supabase/migrations/20260922_proposal_fix_broad_rls_policies.sql` (users,
dossiers, exam_results) et
`supabase/migrations/20260922_proposal_fix_documents_policy.sql`
(documents).

### 12.2 NEEDS REVIEW (intention produit à confirmer avant toute action)

| Table | Policy | Constat | Action proposée |
|---|---|---|---|
| `brand_briefs` | "Public can insert brand briefs" (role public, INSERT, with_check true) | Aucun formulaire public non authentifié n'existe dans le code V1 commité — le seul appelant (`Marketing.jsx`) est déjà un étudiant connecté insérant SON PROPRE `user_id` | Restriction proposée (non appliquée) dans `20260922_proposal_brand_briefs_insert_scope.sql`, à valider seulement si aucun formulaire public externe n'existe réellement en production |
| `contact_messages` | "Public can insert contact messages" (role anon, INSERT, with_check true) | Probablement un formulaire de contact public intentionnel (page marketing/landing hors de ce dépôt V1) — AUCUNE preuve de mésusage dans le code inspecté | Aucune proposition de correctif — classée POSSIBLY INTENTIONAL, à confirmer par le produit, pas par le code |
| `packs` | `anyone_read_packs` (role public, SELECT, qual true) | Cohérent avec un catalogue de prix public affiché avant connexion (page tarifs) — AUCUNE preuve de mésusage | Aucune proposition de correctif — classée POSSIBLY INTENTIONAL |

### 12.3 VERIFIED SCOPED (n'affiche PAS le motif `ALL true`)

Rapporté par l'audit live comme n'ayant PAS le même motif que §12.1, mais
sans le texte exact de chaque policy — classées **NEEDS REVIEW (preuve
partielle)**, jamais PASS, conformément à la consigne de ne jamais affirmer
plus que ce que l'évidence permet : `chapter_progress`, `formation_progress`,
`client_messages`, `support_tickets`, `notifications`, `client_deliverables`,
`deliverable_feedback`, `deliverable_files`, `leads`, `payments`. Reste à
faire avant de les classer PASS : relire le texte exact de `qual`/
`with_check` de chaque policy (même requête `pg_policies` que
`docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md` §4) et confirmer qu'aucune
n'autorise `role public`.

### 12.4 Storage

| Bucket | public | Statut |
|---|---|---|
| `documents` | **true** | **HIGH PRIORITY SECURITY ISSUE** — bucket contenant des documents d'identité sensibles, accessible par URL publique sans authentification, indépendamment des policies `storage.objects` (`storage_admin_all`/`storage_insert_own`/`storage_select_own`, elles-mêmes correctement scopées mais qui ne s'appliquent qu'à l'API Storage, pas à la surface d'URL publique du bucket). Stratégie de migration détaillée (non appliquée) : `supabase/migrations/20260922_proposal_documents_bucket_privacy.sql`. Point clé découvert : les documents client eux-mêmes utilisent déjà `createSignedUrl()` (api.js:187-192) — le vrai risque vient des chemins marketing/livrables qui, eux, utilisent encore `getPublicUrl()` sur ce MÊME bucket (api.js:1581, 1755) et casseraient si le bucket passait `public=false` sans un changement de code V1 préalable (documenté comme prérequis, non exécuté). |
| `formation` | true | NEEDS REVIEW — voir `20260922_proposal_documents_bucket_privacy.sql` en fin de fichier : les 19 composants `Chapitre*.jsx` chargent les vidéos/diapositives via des URLs publiques codées en dur, sans génération d'URL signée nulle part dans le code — un bucket public semble REQUIS pour ce modèle de lecture actuel. Aucun changement proposé sans confirmation produit de l'intention (contrôle d'accès par abonnement souhaité ou non). |

## 13. Séquence de migration finale (pour approbation future uniquement — AUCUNE phase exécutée)

Ordre recommandé, chaque phase testée sur un projet Supabase de test avant
la suivante — jamais directement en production, jamais toutes à la fois.

**Phase 1 — Compatibilité applicative (FAITE cette session, LOCAL uniquement,
jamais activée)** : `src/local/adapters/supabase/storageUrl.js` (nouveau) —
`resolveSignedUrl()`/`resolveSignedUrls()`, branché dans
`documents.supabase.js` (`getDocuments`/`getDocumentsWithDetails`) et
`marketing.supabase.js` (`getBrief`/`uploadAsset`/`getFiles`). Reste inerte
tant que `PRODUCTION_ADAPTER_ACTIVE=false`. Objectif : que le passage à la
Phase 3 ne casse rien côté lecture, sans toucher `src/lib/api.js`.

**Phase 2 — Remplacement des policies RLS** (non exécuté) :
`supabase/migrations/20260922_proposal_fix_broad_rls_policies.sql`
(users/dossiers/exam_results + fonction `is_admin_or_super_admin()`),
`20260922_proposal_fix_documents_policy.sql` (documents),
`20260922_proposal_brand_briefs_insert_scope.sql` (sous réserve de
confirmation produit — voir §12.2). Peut être appliquée indépendamment de
la Phase 3 (corrige l'accès à la TABLE, pas au STORAGE).

**Phase 3 — Bascule privée du bucket `documents`** (non exécutée) : suit le
séquencement détaillé dans
`20260922_proposal_documents_bucket_privacy.sql` (sous-phases 1 à 4 :
changement de code V1 pour `uploadBrandAsset`/`sendDeliverableFile`,
backfill des URLs publiques déjà stockées, puis
`update storage.buckets set public = false`). Ne JAMAIS exécuter avant que
la Phase 1 soit en production ET que le backfill soit terminé.

**Phase 4 — Vérification** (non exécutée) : rejouer
`docs/CLIENT_REGRESSION_TEST_PLAN.md` en entier sur le projet de test après
Phases 2+3 ; relire `pg_policies`/`storage.buckets` (mêmes requêtes que
`docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md`) pour confirmer l'état
attendu ; vérifier qu'aucun document/livrable/asset marketing existant n'a
perdu son URL fonctionnelle.

**Phase 5 — Plan de rollback** (non exécuté) : chaque fichier de
proposition SQL contient sa propre section ROLLBACK (recrée la policy
`..._all` d'origine exactement, ou `update storage.buckets set public =
true`). Rollback Phase 1 : aucun (purement additif côté code, un simple
revert de commit suffit, ne dépend d'aucun état live). Rollback global :
Phase 3 → Phase 2 → (Phase 1 n'a pas besoin d'être annulée, elle reste
compatible avec l'état pré-migration).

## 14. V2 LOCAL COMPLETION STATUS (audit "complete all remaining local work", 2026-09-22)

Couverture complète module par module. "Adaptateur" = fichier dans
`src/local/adapters/supabase/*` (ou `crmAdapter.js`), tous à l'état
`PRODUCTION_ADAPTER_ACTIVE=false` — aucun n'est activé. Aucun module listé
n'a d'adaptateur manquant ; aucune nouvelle implémentation n'était
nécessaire cette session.

| Module | Source locale (Preview) | Source production (V1) | Clé d'identité | Lecture (api.js) | Écriture (api.js) | Adaptateur | Statut |
|---|---|---|---|---|---|---|---|
| CRM (prospects/statut/RDV/relances) | `model.js`/`clientHistory.js`/`relance.js`/`appointments.js` | `leads`, `lead_appointments`, `lead_tasks`, `lead_activity` | `leads.id` (pré-conversion) → `converted_user_id` (post) | `fetchLeads` | `updateLeadStatus`/`updateLeadNotes`/`addLeadAppointment`/`addLeadTask` | `crmAdapter.js` | UI: fait · Adaptateur: fait · Mapping identité: fait · Continuité: PASS · Tests: oui · Blocage futur: RLS `leads` NEEDS REVIEW (preuve partielle) |
| Dossier | `dossierStepStore.js` | `dossiers` | `user_id` | `fetchDossier` | `updateDossierStep` | `dossier.supabase.js` | UI: fait · Adaptateur: fait · Continuité: PASS · Tests: oui · Blocage futur: RLS `dossiers_all` CONFIRMED UNSAFE (proposition prête) |
| Documents | `documentsStore.js` | `documents` (+ storage bucket `documents`) | `user_id` | `fetchDocumentsByCategory`/`fetchClientDocumentsWithDetails` | `uploadDocumentFile`/`updateDocumentStatusWithReason` | `documents.supabase.js` (+ `storageUrl.js`) | UI: fait · Adaptateur: fait · Continuité: PASS · Tests: oui · Blocage futur: RLS `documents_all` CONFIRMED UNSAFE + bucket public=true (propositions prêtes) |
| Documents associé | `associateDocuments.js` | `documents` (mêmes lignes, `category` distincte) | `user_id` | idem Documents | idem Documents | `documents.supabase.js` | UI: fait · Schéma: CONFIRMÉ A (live) · Continuité: PASS · Tests: oui · Blocage futur: identique à Documents |
| Formation IAS1 | `formationProgressStore.js` | `formation_progress`, `chapter_progress` | `user_id` | `fetchFormationProgress`/`fetchChapterProgress` | `markUnitComplete`/`startUnit`/`saveChapterProgress` | `formation.supabase.js` | UI: fait · Adaptateur: fait · Continuité: PASS · Tests: oui · Blocage futur: RLS NEEDS REVIEW (preuve partielle), `chapter_progress` FK à confirmer |
| Examens | `formationProgressStore.js` | `exam_results` | `user_id` | `fetchExamResults` | `saveExamResult` | `formation.supabase.js` | UI: fait · Adaptateur: fait · Continuité: PASS (immuable après soumission) · Tests: oui · Blocage futur: RLS `exam_results_all` CONFIRMED UNSAFE (proposition prête) |
| Paiements | `conversion.js` | `payments` | `user_id` | `fetchClientPayments` | `markPaymentPaid` (+ `convertLeadToClient` pour le premier paiement) | `payments.supabase.js` (+ `crm.supabase.js::convertToClient`) | UI: fait · Adaptateur: fait · Continuité: PASS · Finance: ZÉRO modification · Tests: oui · Blocage futur: RLS `payments` NEEDS REVIEW (preuve partielle) |
| Marketing (brief) | `marketingStore.js` | `brand_briefs` | `user_id` | `fetchBrandBrief` | `submitBrandBrief`/`uploadBrandAsset` | `marketing.supabase.js` | UI: fait · Adaptateur: fait · Schéma: CONFIRMÉ (17 colonnes réelles) · Continuité: PASS · Tests: oui · Blocage futur: INSERT public à restreindre (proposition prête) |
| Livrables | `marketingStore.js` | `client_deliverables` | via `brand_brief_id` | nested via `fetchBrandBrief`/`fetchAdminMarketingBriefs` | `updateClientDeliverables` | `marketing.supabase.js` | UI: fait · Adaptateur: fait · Continuité: PASS · Tests: oui · Blocage futur: RLS NEEDS REVIEW (preuve partielle) |
| Feedback / fichiers livrables | `marketingStore.js` | `deliverable_feedback`/`deliverable_files` | `deliverable_id` | `fetchDeliverableFeedback`/`fetchDeliverableFiles` | `submitSiteFeedback`/`sendDeliverableFile` | `marketing.supabase.js` (+ `storageUrl.js` pour les fichiers) | UI: fait · Adaptateur: fait · Continuité: PASS · Tests: oui · Blocage futur: bucket `documents` public=true (même correctif que Documents) |
| Support | `clientTrackingStore.js` | `support_tickets` | `created_by` | `fetchSupportTickets`/`fetchMyTickets` | `submitSupportTicket`/`updateTicketStatus` | `support.supabase.js` | UI: fait · Adaptateur: fait · Continuité: PASS · Tests: oui · Blocage futur: RLS NEEDS REVIEW (preuve partielle) |
| Messages client (annonces) | `clientTrackingStore.js` | `client_messages` (unidirectionnel, PAS un fil bidirectionnel) | `user_id` | `fetchMyMessages` | `sendAdminMessage` | `support.supabase.js` | UI: fait · Adaptateur: fait · Modèle: CONFIRMÉ distinct de support_tickets · Tests: oui · Blocage futur: RLS NEEDS REVIEW (preuve partielle) |
| Notifications | `adminNotificationsStore.js` | `notifications` | `user_id` / `audience` | `fetchMyNotifications`/`fetchAdminNotifications` | `createNotification` | `notifications.supabase.js` | UI: fait · Adaptateur: fait · Schéma: CONFIRMÉ (le plus solide de l'audit) · Continuité: PASS · Tests: oui · Blocage futur: policy INSERT `audience='admin'` jamais auditée |

**Aucun module sans adaptateur.** Les seuls blocages restants avant
activation sont ceux déjà documentés en §10/§12/§13 (RLS/storage), jamais
un trou d'implémentation locale.

### 14.1 Auth / routage — statut

- `AuthProvider`/`ProtectedRoute` : réutilisés VERBATIM depuis V1
  (`src/context/AuthContext.jsx`, `src/App.jsx`), jamais réimplémentés —
  voir `productionEntry.proposal.jsx` (checklist de complétude ajoutée
  cette session, aucun changement fonctionnel nécessaire).
- Routage rôle : `/dashboard` (student) via `LocalCRM mode="client"
  clientId={user.id}` ; `/admin` (admin + super_admin, traités de façon
  identique — aucune distinction V1 trouvée pour les 5 tables migrées) via
  `LocalAdminShell`.
- Bloqué/annulé : géré exclusivement par `AuthContext.jsx` (déconnexion
  forcée), non dupliqué.
- Finance : reste dans `src/pages/admin/Dashboard.jsx` (super_admin
  uniquement, ligne 3892) — AUCUN routage V2 ne remplace cette page, elle
  n'est pas dans le périmètre de `productionEntry.proposal.jsx`
  (uniquement `/dashboard` et `/admin`, qui montent respectivement
  `LocalCRM`/`LocalAdminShell` — Finance resterait servie par la page V1
  existante tant qu'elle n'est pas explicitement migrée, ce qui n'a jamais
  été demandé).

### 14.2 Mode Preview vs Production — design final (non activé)

| | Preview/local (actuel, actif) | Production (préparé, inactif) |
|---|---|---|
| Entrée | `local-main.jsx` → `LocalAdminShell` | `productionEntry.proposal.jsx` → `AuthProvider` → routage par rôle |
| Identité | `identity.js::getActiveIdentity()` (démo, `ADAPTER_MODE='local'` codé en dur) | `identity.supabase.js::getIdentityFromAuthUser(useAuth().user)` |
| Stores | `src/local/*Store.js` (localStorage) | `src/lib/api.js` via `src/local/adapters/supabase/*.supabase.js` |
| Garde | Aucune bascule possible (pas de variable d'env lue) | `PRODUCTION_ADAPTER_ACTIVE` codé en dur, `false` aujourd'hui |
| Risque de mode mixte | Nul — les deux couches n'importent jamais l'une l'autre (testé, `local-check-supabase-adapters.mjs`) | Idem — activer un module ne peut jamais faire fuiter des données démo, car `identity.supabase.js` lève plutôt que de retomber sur `CANONICAL_DEMO_CLIENT_ID` |

Aucune bascule automatique n'existe ni n'est proposée — le passage
Preview → Production reste un changement de code déployé explicitement
(Phase 5 du runbook), jamais une détection runtime.
