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
**C (nouveau)** pour les catégories associé.

**Migrations déjà préparées (non exécutées)**, à valider dans l'ordre —
inchangé depuis `README.md` §2 :
1. `20260916_test_local_tracking_columns.sql`
2. `20260916_test_local_documents_rejection.sql`
3. `20260916_test_local_document_versions.sql`

**À ajouter (nouveau, pas encore écrit en migration)** pour les documents
associé : soit (a) réutiliser la table `documents` telle quelle — les
catégories `associate_*` sont déjà des valeurs de `category` distinctes,
aucune colonne supplémentaire n'est strictement nécessaire — soit (b) une
colonne `owner_type` (`'client'|'associate'`) si une distinction structurelle
plus explicite est préférée côté schéma. Recommandation : (a), pas de
nouvelle migration nécessaire au-delà de ce qui est déjà préparé, tant que
les valeurs de `category` restent uniques et jamais réutilisées entre client
et associé (déjà garanti côté code — `isAssociateCategory()`).

**Adaptateur** : `src/local/adapters/documentsAdapter.js` (créé cette
session) — enveloppe `documentsStore.js`/`associateDocuments.js`, même
interface prévue pour un futur module Supabase (upload réel vers Storage +
insert/update `documents`).

**Optionnalité préservée** : le dénominateur de progression du dossier
principal (`LocalMesDocuments.jsx`) ne compte que `REQUIRED_DOCUMENTS` — les
catégories `associate_*` n'y entrent jamais, quel que soit l'adaptateur.

## 4. Marketing + notifications

| Fonctionnalité | V1 équivalent | Classification |
|---|---|---|
| Projet/livrables/demandes de modification (`marketingStore.js`) | `fetchAdminMarketingBriefs`, `updateClientDeliverables`, `SITE_FEEDBACK_SECTIONS`, `sendDeliverableFile` — schéma **différent et plus riche** (briefs + fichiers + feedback structuré par section) | **C — réconciliation nécessaire**, pas un simple branchement. Le modèle V2 (projet/livrables/demandes) est plus simple que le modèle live existant ; avant activation, décider lequel des deux devient la référence, ou faire correspondre les champs. |
| Notifications admin (`adminNotificationsStore.js`) | **Aucun équivalent live** — l'admin n'était jamais notifié des nouvelles demandes marketing/support avant cette session | **C — nouveau**. Options : (i) nouvelle table `admin_notifications` (clientId, type, title, message, context, seen_at, dedupe_key) ; (ii) vue dérivée calculée à la volée depuis `support_tickets`/`marketing` sans nouvelle table de stockage. Recommandation : (i), plus simple à indexer/marquer lu, avec `dedupe_key` UNIQUE pour préserver la garantie "une action = une notification" déjà testée côté local. |

**Adaptateur** : `src/local/adapters/marketingAdapter.js`.

**RLS à prévoir (nouveau schéma)** : un client ne doit lire/écrire que ses
propres demandes (`user_id = auth.uid()`) ; l'admin/super_admin lit tout ;
`admin_notifications` lisible uniquement par les rôles admin/super_admin.

## 5. Support / messages

| V1 équivalent | Colonnes connues (README §3, api.js) |
|---|---|
| `support_tickets` | `id, user_id, subject, message, category, priority, status, response, source, created_at` |
| `client_messages` | utilisé par `sendAdminMessage`/`fetchMyMessages` — colonnes exactes non confirmées dans ce dépôt |
| `notifications` | déjà utilisée en prod, schéma non versionné (README §2, point 5) |

**Classification** : **A/B — schéma existant probablement suffisant**. Le
modèle V2 (`clientTrackingStore.js` : un item = un fil, `senderType`
'team'|'client', `.response` pour la réponse, `reminders[]` pour les
relances) correspond raisonnablement à `support_tickets` (un ticket = un
fil, `response` = réponse admin) — pas de réécriture de schéma nécessaire a
priori, sous réserve de confirmer les colonnes exactes de `client_messages`
et `notifications` sur le schéma live (déjà signalé README §3).

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
| Documents associé | C | Nouvelles valeurs de `category` (pas de nouvelle table a priori) |
| Marketing (projet/livrables/demandes) | C | Réconcilier avec le schéma live existant (briefs/deliverable_files) |
| Notifications admin | C | Nouvelle table `admin_notifications` (ou vue dérivée) |
| Support / tickets | A/B | Confirmer les colonnes exactes de `client_messages`/`notifications` |
| Formation IAS1 (progression, examen) | A | Aucune — reconnecter `formationAdapter.js` |
| Vente & Scripts (évaluation) | A | Aucune — `exam_results` avec `exam_type='commercial'` déjà supporté côté live |
| Dossier (étapes) | A | Aucune — reconnecter `formationAdapter.js` |
| Paiements / conversion | A | Aucune — reconnecter `formationAdapter.js` |
| Vidéos/diapositives Formation | — | CSP de production à autoriser pour le bucket Storage concerné (déploiement, pas schéma) |

Ordre de migration recommandé si applicable : 1) valider les 3 migrations
déjà préparées (tracking/rejection/versions) sur un projet de test, 2)
confirmer les colonnes exactes de `client_messages`/`notifications` sur le
schéma live, 3) concevoir la nouvelle table `admin_notifications`, 4)
réconcilier le schéma Marketing, 5) seulement ensuite reconnecter les
adaptateurs "A" (formation/dossier/paiements), qui ne nécessitent aucun
changement de schéma et peuvent donc être faits en dernier sans bloquer les
autres.
