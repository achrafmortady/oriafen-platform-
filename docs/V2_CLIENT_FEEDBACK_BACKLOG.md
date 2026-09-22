# Backlog feedback client — V2 (2026-09-22, corrigé après retour client)

LOCAL V2 uniquement — aucun changement live, aucune écriture Supabase live,
aucun push, aucun deploy pour ce backlog. Ne touche pas à `main`, Finance ou
Super Admin.

## 1. Marketing — profil par plateforme (site, Instagram, Facebook, Ads Manager) — ✅ FAIT (2026-09-22, round 2)

Progression par canal ajoutée : site web, Instagram, Facebook, Meta
Business Manager/Ads Manager — chacun avec son propre statut (`À
démarrer`/`En cours`/`En révision`/`Terminé`), pourcentage, étape actuelle
et reste à faire, indépendants les uns des autres. Aucune progression
fabriquée (0%/"À démarrer" par défaut, modifiable uniquement par l'admin).
L'aperçu du projet (infos de marque transmises par le client) reste
affiché en premier ("Étape 1 — Informations de marque").

**Champ 100% LOCAL** — aucune table live équivalente confirmée
(classification C, mapping production à concevoir plus tard, voir
`docs/PRODUCTION_WIRING_PLAN.md` §4).

**Fichiers modifiés** : `src/local/marketingStore.js`,
`src/local/LocalMarketing.jsx`.
**Tests** : `local-check-feedback-round2.mjs`.

## 2. Documents associés — ✅ FAIT (2026-09-22)

Règle implémentée exactement telle que corrigée par le client :
- si le client A un associé → la section "Documents de mon associé"
  s'affiche (client ET admin)
- si le client N'A PAS d'associé → la section ne s'affiche PAS du tout

Nouveau store dédié `src/local/associateStore.js`
(`getHasAssociate`/`setHasAssociate`/`subscribeToAssociate`, localStorage,
même convention que `dossierStepStore.js`) — `false` par défaut, réglable
UNIQUEMENT par l'admin (case à cocher "Ce dossier comporte un associé"
dans la fiche client, `LocalClientsOverview.jsx`). Même source pour le
client (`LocalMesDocuments.jsx`) et l'admin — un seul point de vérité par
`clientId`.

**Passeport ajouté** : `associate_passeport` dans `ASSOCIATE_DOCUMENTS`
(`associateDocuments.js`).

**Fichiers modifiés** : `src/local/associateStore.js` (nouveau),
`src/local/associateDocuments.js`, `src/local/LocalMesDocuments.jsx`,
`src/local/LocalClientsOverview.jsx`.
**Tests** : `local-check-feedback-2026-09-22.mjs`.

## 3. Bug — "Client Démo" affiche statut "À relancer" alors qu'il est déjà client — ✅ CORRIGÉ (2026-09-22, round 2)

**Cause racine confirmée** (deux causes distinctes, toutes deux corrigées) :
1. Le statut dossier "À relancer" (`clientsOverviewData.js`, déclenché par
   `missingDocs>=2`, concept "documents à suivre") est calculé UNIQUEMENT
   pour des clients déjà convertis (`stage==='Client' && paymentValidated`)
   — mais réutilisait le même libellé que le statut du pipeline CRM
   pré-conversion ("Intéressé – à relancer"), prêtant à confusion :
   un client déjà acquis semblait "encore à relancer" comme un prospect.
   **`lead.stage` n'était jamais redéfini** (le calcul ne touche que le
   statut de dossier), mais le LIBELLÉ affiché l'était trop peu distinct.
   → Libellé affiché renommé en **"Documents à relancer"** (clé interne
   `status` inchangée, aucune logique/priorité/filtre modifié).
2. `applyPaymentValidation` (conversion) n'effaçait jamais une relance
   programmée (`lead.relance`) avant la conversion — un prospect relancé
   juste avant de devenir client continuait d'afficher le badge de relance
   hérité sur sa fiche. → `relance: null` ajouté à la conversion.

**Fichiers modifiés** : `src/local/LocalClientsOverview.jsx`,
`src/local/conversion.js`.
**Tests** : `local-check-feedback-round2.mjs` (couvre aussi la
non-régression : la relance reste pleinement fonctionnelle pour les
prospects non-clients).

## 4. "Réponse en attente" — ✅ VÉRIFIÉ CORRECT (aucun changement nécessaire)

Logique confirmée déjà exactement conforme à la règle demandée :
- `hasPendingReply()` (`clientsOverviewData.js`) = `responseRequired &&
  status !== 'replied'` — dérivé de l'état réel de la conversation, jamais
  un flag statique indépendant.
- `status` ne passe à `'replied'` QUE lorsqu'une vraie réponse (`response:
  {message, respondedAt, author}`) est posée dans la MÊME opération
  (`respondToClientRequest`/`replyToClientSend`) — jamais séparément.
- Les notifications AUTOMATIQUES (`addClientNotification`, ex. document
  refusé) ont déjà `responseRequired: false` codé en dur — elles ne
  déclenchent jamais "Réponse en attente".

**Tests ajoutés** pour verrouiller ce comportement :
`local-check-feedback-2026-09-22.mjs`.

## 5. Admin — tooltip "pourquoi bloqué" sur les clients bloqués — ✅ FAIT (2026-09-22, round 2)

Tooltip accessible (`title` + `aria-label`, hover ET focus clavier via
`tabIndex`) ajouté sur le badge de statut, dans le tableau ET le panneau
détail — appliqué aux 4 statuts (Bloqué/Documents à relancer/En cours/
ORIAS obtenu), pas seulement "Bloqué". Raison dérivée UNIQUEMENT de
données réelles déjà calculées (`missingDocs`, `nextAction`,
`clientsOverviewData.js`) — jamais un texte inventé.

**Fichiers modifiés** : `src/local/LocalClientsOverview.jsx`.
**Tests** : `local-check-feedback-round2.mjs`.

## 6. Fiche client — retirer "Tâche", garder uniquement "Prochaine action" — ✅ FAIT (2026-09-22, round 2)

Confirmé : "Tâche" désignait bien `lead.tasks[]` (section dédiée dans la
fiche prospect/client, jamais rendue ailleurs — vérifié par recherche
globale avant suppression). Section JSX retirée avec son état/fonctions
dédiés (`addTask`, `toggleTaskDone`, `newTaskTitle`, `newTaskDue`) —
"Prochaine action" (section distincte, `actionDraft`/
`applyNextActionUpdate`) intacte et non affectée.

**Fichiers modifiés** : `src/local/LocalCRM.jsx`.
**Tests** : `local-check-feedback-round2.mjs`.

## 7. Gate email obligatoire avant conversion prospect → client

**Statut : backlog, non implémenté.**

Bloquer la conversion (validation du paiement) si `lead.email` est vide —
symétrique au garde-fou déjà existant sur `packId`.

**Zone concernée** : `conversion.js::applyPaymentValidation`.

## 8. "Montant potentiel" — ✅ VÉRIFIÉ DÉJÀ STRUCTURÉ (aucun changement nécessaire)

Confirmé : `lead.value` est déjà une vraie donnée CRM structurée —
numérique (`<input type="number">`), persistée (`patch()`), modifiable,
liée au lead, utilisée dans le Kanban (total + pondéré par étape) et le
KPI dashboard "Potentiel ouvert". Rien à changer ; aucun écran identifié
où le montant serait seulement du texte libre.

**Tests ajoutés** : `local-check-feedback-2026-09-22.mjs`.

## 9. Email d'activation de compte automatique — stratégie sécurisée (non implémenté, LOCAL uniquement)

**Statut : stratégie documentée, AUCUN code/envoi réel — nécessite Supabase
Auth live, hors de portée de ce staging V2 local.**

Besoin métier : le client ne doit jamais rester bloqué par un lien expiré.
**Un token non-expirant n'est PAS une solution sécurisée acceptable**
(risque de fuite/réutilisation illimitée) — stratégie proposée à la place :

1. À la conversion (`convertLeadToClient`), déclencher l'envoi d'un lien
   d'invitation Supabase Auth (`admin.generateLink({ type: 'invite', ... })`
   ou `inviteUserByEmail`) — ce type de lien a une durée de vie généreuse
   configurable côté projet (contrairement à un lien de reset mot de passe,
   plus court par défaut), sans jamais être non-expirant.
2. Si le lien expire avant utilisation : prévoir un flux de **renvoi
   contrôlé** — un bouton admin "Renvoyer le lien d'activation" (ou un
   lien côté page de connexion "Vous n'avez pas reçu votre lien ?") qui
   déclenche un NOUVEAU lien (le précédent devient caduc), jamais une
   prolongation du même token.
3. Traçabilité : journaliser chaque envoi/renvoi (qui, quand) — réutilise
   le pattern `logActivity` déjà en place pour toute autre action
   administrative.

**Aucun envoi réel ni création d'utilisateur live dans cette tâche** — ce
point reste un PLAN à exécuter uniquement lors d'une session de câblage
production dédiée, avec accès Supabase Auth réel.

## 10. Notifications — ✅ FAIT (présentation "centre d'activité", localement)

Présentation harmonisée sur les critères demandés, SANS fusionner les
modèles de données (confirmé : `clientTrackingStore.js`,
`adminNotificationsStore.js` restent deux stores distincts, clés
localStorage différentes) :
- **chronologique** : déjà trié récent-en-tête (`sortSendsRecentFirst`,
  inchangé)
- **source/sender clair** : ajout d'une ligne "Équipe Oriafen"/"Vous" côté
  client, nom du client concerné côté admin (`item.clientName`)
- **type/contexte clair** : ajout d'un badge texte (`TYPE_LABEL`) en plus
  de l'icône (auparavant icône seule)
- **lu/non lu** : déjà présent (point doré + gras), inchangé
- **action liée** : déjà présent (clic → navigation vers l'onglet
  concerné), inchangé

**Fichiers modifiés** : `src/local/LocalNotificationBell.jsx`,
`src/local/LocalAdminNotificationBell.jsx`.
**Tests** : `local-check-feedback-2026-09-22.mjs`.

---

**Résumé (round 2, 2026-09-22)** : points 1, 2, 3, 4, 5, 6, 8, 10 tous
traités — 6 implémentations réelles + 2 vérifications confirmant qu'aucun
changement n'était nécessaire. Seul le point 7 (gate email obligatoire
avant conversion) reste en backlog, non implémenté. Le point 9 (email
d'activation) reste une stratégie documentée, jamais un code exécuté
(nécessite Supabase Auth live). Aucun changement live, aucun push, aucun
deploy.
