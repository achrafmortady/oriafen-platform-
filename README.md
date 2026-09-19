# Oriafen — CRM / plateforme élèves (checkout local)

Cette checkout est **isolée** de tout environnement Supabase réel : `src/lib/supabase.js`
force `isConfigured = false` et `supabase = null`, quelle que soit la variable
d'environnement fournie (voir le commentaire en tête de ce fichier). Toutes les
fonctions de `src/lib/api.js` passent donc systématiquement par leur branche
« démo », sans jamais effectuer d'appel réseau.

## Activation future

Cette section documente ce qui a été **préparé mais non activé** (tracking des
envois, rejet/versioning des documents, journal d'activité, notifications), et
la marche à suivre avant une mise en production réelle. Rien de ce qui suit
n'a été exécuté sur un Supabase live — voir `supabase/migrations/` pour les
fichiers de migration, tous marqués `DO NOT RUN IN PRODUCTION — TEST/LOCAL ONLY`.

Le plan détaillé de mise en **staging** (préconditions, ordre des migrations,
policies, comptes de test, scénarios de bout en bout, rollback, checklist
Go/No-Go) est dans **[`docs/STAGING_CLIENT_TRACKING_PLAN.md`](docs/STAGING_CLIENT_TRACKING_PLAN.md)**
— lui aussi une préparation uniquement, rien n'y a été exécuté.

### 1. Ce qui a été préparé dans ce repo

- **`src/lib/api.js`** : nouvelles fonctions dormantes (no-op tant que
  `isConfigured` est `false`) — `createNotification`, `markSendSeen`,
  `markSendOpened`, `markSendReminded`, `setSendImportant`,
  `fetchDocumentVersions`, `logActivity`, `fetchActivityLog`,
  `rejectDocumentWithAudit`, `replaceDocumentWithVersioning`. Elles
  réutilisent les fonctions existantes (`updateDocumentStatusWithReason`,
  `uploadDocumentFile`, `recordClientSend`, `fetchClientSendHistory`, …) sans
  les dupliquer ni les modifier.
- **`supabase/migrations/20260916_test_local_*.sql`** : fichiers de migration
  écrits mais **jamais exécutés**, à appliquer d'abord sur un projet Supabase
  de test/staging.
- **`local-check-tracking.mjs`** : tests locaux (Node, sans Supabase) qui
  valident le comportement actuel (`src/local/clientTrackingStore.js`,
  `documentsStore.js`, `activityLog.js`) et le comportement dormant des
  nouvelles fonctions `api.js`. Lancer avec `node local-check-tracking.mjs`.

### 2. Migrations à valider, dans l'ordre recommandé

1. `20260916_test_local_tracking_columns.sql` — ajoute `opened_at`,
   `reminded_at`, `important`, `status`, `last_activity_at` sur
   `client_send_history`. **Prérequis** : `20260915_client_send_tracking.sql`
   (tables `client_send_history` / `client_send_replies`) doit déjà être
   appliqué — cette dernière migration a été écrite pour du développement
   local et n'a, à notre connaissance, jamais été promue en production.
2. `20260916_test_local_documents_rejection.sql` — ajoute `rejected_at`,
   `rejected_by` sur `documents`. Ne touche pas à la contrainte
   `UNIQUE (user_id, category)`.
3. `20260916_test_local_document_versions.sql` — nouvelle table
   `document_versions` (historique complet des documents).
4. `20260916_test_local_activity_log.sql` — nouvelle table `activity_log`
   (journal chronologique, distinct de `src/local/activityLog.js`).
5. `20260916_notes_notifications_schema_TODO.sql` — **pas une migration
   exécutable**, juste une checklist : le schéma réel de la table
   `notifications` (déjà utilisée en prod) doit être exporté depuis le
   dashboard Supabase live avant de brancher `createNotification()`, car ce
   schéma n'existe dans aucun fichier versionné de ce repo.

Chaque migration doit être : appliquée sur un projet Supabase de **test**,
relue, testée manuellement (upload/rejet/remplacement de document, envoi
d'un message, etc.), puis seulement ensuite rejouée sur la production.

### 3. Tables live à vérifier avant toute activation

`supabase/schema.sql` ne reflète pas fidèlement le schéma live actuel : les
tables `packs`, `payments`, `leads`, `lead_appointments`, `lead_tasks`,
`lead_activity`, `support_tickets`, `client_messages`, `notifications`,
`chapter_progress`, `deliverable_files`, `brand_briefs` sont utilisées par
`src/lib/api.js` mais absentes de `schema.sql` et des migrations versionnées
— elles ont été créées directement dans le dashboard Supabase. Avant
d'activer quoi que ce soit ci-dessus :

- Exporter le schéma réel (`information_schema.columns`, ou `supabase db
  dump` côté CLI) pour confirmer les colonnes exactes de `notifications` en
  particulier.
- Confirmer que `client_send_history` / `client_send_replies` n'existent
  effectivement pas encore en prod (leur migration d'origine est marquée
  « Local-only »).

### 4. Variables / credentials nécessaires plus tard

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (voir `.env.example`) — à
  renseigner uniquement sur un environnement de test/staging dans un premier
  temps, jamais dans cette checkout isolée.
- `server/.env` (voir `server/.env.example`) pour la partie WhatsApp/IA — ces
  placeholders existent déjà et **ne doivent pas être renseignés
  maintenant** ; tant qu'ils sont vides, le backend WhatsApp reste en mode
  préparation (aucune connexion réelle à Meta, qualification IA toujours
  `pending`).

### 5. Rollback

Chaque fichier de migration `20260916_test_local_*.sql` contient, en pied de
fichier, les commandes de rollback correspondantes (commentées, à exécuter
manuellement) :

- Colonnes ajoutées (`ALTER TABLE ... ADD COLUMN`) → `DROP COLUMN IF EXISTS`.
- Tables créées (`document_versions`, `activity_log`) → `DROP TABLE IF
  EXISTS`.

En cas d'échec d'une migration en production : ne pas ré-essayer à chaud,
revenir d'abord sur l'environnement de test/staging pour comprendre l'écart
avec le schéma live réel (voir section 3), corriger le fichier de migration,
puis reprogrammer une fenêtre de déploiement.

## Audit final V2 (2026-09-20) — dépendances production restantes

Ce qui suit documente ce qui fonctionne aujourd'hui **uniquement grâce à
localStorage/données de démonstration** dans `src/local/*` (Preview isolée,
`local-main.jsx`) et qui devra être câblé avant une vraie mise en
production. Rien ci-dessous n'a été exécuté sur Supabase live — c'est une
liste, pas une action.

**1. Authentification — bloquant fondamental, au-dessus de tout le reste.**
`local-main.jsx` monte `LocalAdminShell` directement, sans aucun login ni
garde de rôle. Toute la Preview V2 repose sur UN SEUL client canonique
(`CANONICAL_DEMO_CLIENT_ID = 6`, `model.js`) : `ClientSpace` (espace client)
et tous les composants `Local*` qui prennent un prop `clientId` l'utilisent
en dur au lieu de l'id de l'utilisateur connecté. Avant production : réactiver
`src/App.jsx`/`AuthContext` (déjà intacts, jamais modifiés) comme point
d'entrée réel, et remplacer partout `CANONICAL_DEMO_CLIENT_ID`/`clientName`
par `useAuth().user.id`/`user.name`. Sans cette étape, un vrai deuxième
client verrait les données du premier (id partagé).

**2. Documents & documents associé** (`documentsStore.js`,
`associateDocuments.js`) : aucun fichier n'est réellement téléversé (le
"fileName" est stocké, jamais le contenu). Nécessite un vrai stockage
(Supabase Storage) + le schéma `documents`/`document_versions` déjà planifié
section 2-3 ci-dessus — les catégories `associate_*` sont nouvelles et
n'existent dans aucune migration versionnée : à ajouter au schéma live avant
activation.

**3. Marketing** (`marketingStore.js`, ajouté cette session) : projet,
livrables et demandes de modification sont 100% localStorage, aucune table
équivalente n'existe dans les migrations versionnées (le live a
`fetchAdminMarketingBriefs`/`SITE_FEEDBACK_SECTIONS`, un schéma différent et
plus riche — réconciliation nécessaire, pas un simple branchement).

**4. Notifications admin** (`adminNotificationsStore.js`, ajouté cette
session) : n'a AUCUN équivalent live — c'est une fonctionnalité nouvelle
(l'admin live n'était jamais notifié des nouvelles demandes marketing/
support). À concevoir côté Supabase (nouvelle table ou vue dérivée des
tables existantes) avant production.

**5. Formation IAS1 / Vente & Scripts — progression** (`formationProgressStore.js`) :
contrairement aux points 2-4, le live a DÉJÀ les fonctions Supabase
correspondantes (`fetchFormationProgress`, `saveChapterProgress`,
`markUnitComplete`, `saveExamResult` dans `src/lib/api.js`, non modifiées) —
il s'agit ici de reconnecter ce store local à ces fonctions existantes une
fois l'auth réelle en place, pas de créer un nouveau schéma.

**6. Suivi des étapes du dossier** (`dossierStepStore.js`) : même cas que le
point 5 — le live a déjà `updateDossierStep`/`dossierId`, reconnexion
seulement.

**7. Vidéos/diapositives Formation IAS1** (`Chapitre11.jsx`...`Chapitre55.jsx`,
non modifiés) : leurs URLs Supabase Storage ne se chargent pas dans cette
Preview car la CSP de `index.html` (`img-src 'self' data:`, pas de
`media-src` externe) bloque tout domaine externe — volontaire, pour garantir
qu'aucune requête ne sorte vers Supabase depuis l'isolation locale. La CSP
de production devra autoriser explicitement le bucket Storage concerné.

**8. Dossier "Clients" — progression synthétique** (`clientsOverviewData.js`,
antérieur à cette session) : `deriveDossier()` calcule un statut/une étape
déterministes à partir de `lead.id % ...` (donnée de démonstration), pas de
l'état réel du client. En production, ce calcul doit lire les vraies données
(documents validés, étape réelle du dossier), pas une formule modulo.

**9. Paiements/conversion** (`conversion.js`) : `applyPaymentValidation`
enregistre un paiement fictif en localStorage. Le live a déjà
`convertLeadToClient`/`markPaymentPaid` (non modifiés) — reconnexion
nécessaire après l'auth, pas de nouvelle logique de paiement à inventer.
