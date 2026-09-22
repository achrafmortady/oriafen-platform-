# Plan de régression — client existant (audit 2026-09-22)

Plan MANUEL, à exécuter sur un environnement de test réel (jamais en
production, jamais avec ce dépôt qui ne peut de toute façon initier aucune
connexion Supabase — voir `docs/PRODUCTION_WIRING_PLAN.md` §7). Objectif :
vérifier qu'un client déjà existant avant l'activation de V2 conserve
exactement son état après.

Ne PAS exécuter contre production. Ne PAS exécuter si l'une des étapes
exigerait une écriture non désirée (ex. créer un compte de test réel doit
passer par le flux normal de création, jamais un insert manuel).

## Prérequis

- Un compte étudiant de test déjà existant AVANT l'activation de V2, avec :
  un dossier à une étape non-initiale, au moins un document validé et un
  document en attente/refusé, au moins un chapitre de formation complété,
  au moins un résultat d'examen, au moins une échéance de paiement payée,
  au moins un brief marketing soumis, au moins un ticket de support, au
  moins une notification lue et une non lue.
- Relever l'état AVANT (capture d'écran ou export métadonnées — jamais de
  copie de données personnelles au-delà du strict nécessaire au test).

## Scénarios

1. **Connexion / restauration de session** — le compte de test a une
   session Supabase déjà valide (onglet resté ouvert ou reconnecté
   récemment) : après activation de V2, l'utilisateur doit rester connecté
   SANS reconnexion (voir contrat §11.3 de PRODUCTION_WIRING_PLAN.md) — si
   ce n'est pas le cas, documenter précisément la cause avant de continuer
   (clé de storage/domaine/second client Supabase).
2. **Profil** — nom/email/pack affichés = ceux d'avant V2, à l'identique.
3. **Dossier — statut existant** — étape courante affichée = MÊME étape
   qu'avant V2 (comparer `current_step`).
4. **Documents principaux** — les 6 catégories affichent le MÊME statut
   (validé/en attente/refusé/non soumis) qu'avant V2, aucun document perdu.
5. **Documents associé (si présents)** — mêmes catégories, mêmes statuts ;
   absence de documents associé ne doit jamais dégrader/masquer les
   documents principaux.
6. **Formation — progression** — MÊME nombre d'heures complétées, MÊMES
   unités débloquées, MÊME statut par unité qu'avant V2.
7. **Chapitres complétés** — liste identique (comparer un par un si
   possible, sinon le total).
8. **Résultat d'examen** — MÊME score/`passed` qu'avant V2, aucun nouvel
   examen généré automatiquement.
9. **État de paiement** — MÊME `paymentValidated`/statut d'échéances, AUCUN
   nouveau paiement créé, AUCUNE ligne dupliquée (comparer le nombre de
   lignes `payments` avant/après).
10. **Marketing** — brief déjà soumis toujours visible tel quel, AUCUN
    nouveau brief vide créé automatiquement à la connexion.
11. **Support** — tickets existants visibles, statut/réponse préservés,
    AUCUN fil mélangé avec un autre client.
12. **Notifications** — état lu/non lu PRÉSERVÉ (ne doit pas repasser
    "non lu" après activation), aucune notification dupliquée.
13. **Déconnexion / reconnexion** — après déconnexion explicite, la
    reconnexion doit refonctionner normalement (mot de passe existant,
    aucune régression du flux `AuthContext.jsx`, non modifié).
14. **Rafraîchissement de page** — F5 sur chaque écran (dashboard, dossier,
    documents, formation, marketing, support) ne doit jamais perdre l'état
    affiché ni provoquer une reconnexion.
15. **Accès direct par URL** — accéder directement à `/dashboard` ou
    `/admin` sans passer par `/login` doit appliquer EXACTEMENT la même
    règle qu'en V1 (redirection si non authentifié/mauvais rôle — voir
    `ProtectedRoute`, non modifié, réutilisé tel quel dans
    `productionEntry.proposal.jsx`).
16. **Isolation** — se connecter avec un DEUXIÈME compte de test distinct et
    confirmer qu'aucune donnée du premier compte n'apparaît (documents,
    formation, paiements, support, notifications). **MISE À JOUR
    2026-09-21** : ce scénario ne suffit PLUS comme seule preuve pour
    `documents`/`dossiers`/`exam_results`/`users` — un audit live en
    lecture seule a confirmé que leurs policies RLS live (`documents_all`,
    `dossiers_all`, `exam_results_all`, `users_all`) sont actuellement
    `role public, ALL, true/true` (CONFIRMED UNSAFE, voir
    `docs/PRODUCTION_WIRING_PLAN.md` §12.1) — un test applicatif passerait
    même avec ces policies non corrigées, tant que l'UI elle-même filtre
    correctement (ce qui est le cas côté code, voir §11.7) ; l'isolation
    RÉELLE dépend entièrement des correctifs proposés
    (`supabase/migrations/20260922_proposal_fix_*.sql`, NON appliqués)
    étant réellement déployés sur le projet AVANT ce test. Ne jamais
    interpréter un scénario 16 "réussi" comme preuve que ces 4 tables sont
    sûres tant que ces correctifs n'ont pas été appliqués et revérifiés.
    Les autres tables restent NEEDS REVIEW (preuve partielle) — voir §12.3.
17. **Pas de duplication de compte** — vérifier dans `public.users` (lecture
    seule) qu'aucune deuxième ligne n'a été créée pour ce même
    `auth.users.id`.
18. **Pas de réinitialisation de progression** — comparer l'export
    métadonnées "avant" et "après" pour `formation_progress`/
    `chapter_progress`/`exam_results` : doivent être des lignes STRICTEMENT
    identiques (mêmes `id`, pas de nouvelles lignes, pas de valeurs
    remises à zéro).

## Ce que ce plan NE remplace PAS

- La vérification RLS (`docs/SUPABASE_MANUAL_VERIFICATION_CHECKLIST.md`)
  reste un prérequis séparé et obligatoire — un scénario applicatif qui
  "passe" ne prouve jamais qu'une policy RLS manquante ne pourrait pas être
  exploitée hors de l'UI (ex. requête REST directe avec la clé anon).
- Aucune étape ci-dessus n'a été exécutée dans ce dépôt (aucun accès live
  disponible, voir `docs/PRODUCTION_WIRING_PLAN.md` §7/§10). Ce document
  est le plan à suivre, pas un rapport de résultats.
