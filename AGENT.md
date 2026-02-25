# Instructions Agent — Japan Trip Planner

Ce fichier est lu **obligatoirement** au début de chaque conversation ou tâche.

## 🚨 Règles Obligatoires

Avant toute implémentation, tu DOIS lire et appliquer **tous** les fichiers dans `.agent/workflows/` :

| Workflow | Quand l'appliquer |
|---|---|
| [`/planning-rule`](.agent/workflows/planning-rule.md) | Avant tout code — plan + validation USER obligatoires |
| [`/unit-test-rule`](.agent/workflows/unit-test-rule.md) | Après chaque fichier modifié — créer/mettre à jour son `.spec.ts` (Backend et Frontend) |
| [`/regression-test-rule`](.agent/workflows/regression-test-rule.md) | Avant de terminer — lancer tous les tests, documenter dans le walkthrough |
| [`/changelog-rule`](.agent/workflows/changelog-rule.md) | Pour toute feature/refacto visible — migration de changelog obligatoire |
| [`/mobile-responsive-rule`](.agent/workflows/mobile-responsive-rule.md) | Pour tout changement UI — vérifier et garantir l'adaptabilité sur écrans mobiles (<= 768px) |
| [`/pre-deployment-checks`](.agent/workflows/pre-deployment-checks.md) | Avant tout `git commit` / `git push` |

## 📋 Checklist de départ (à chaque tâche)

- [ ] Lire le contenu complet de chaque fichier dans `.agent/workflows/`
- [ ] Créer `task.md` avec la décomposition en sous-tâches
- [ ] Créer `implementation_plan.md` en **français** et attendre validation
- [ ] Ne toucher aucun code avant approbation explicite du USER

## 🛠️ Règles de développement métier
- **Erreurs Backend** : Les messages d'erreur (`Exceptions`, `Validators`) **doivent être détaillés et explicites** (ex: "Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial, et faire 8 caractères minimum") pour faciliter le débogage et l'expérience utilisateur.

## 📋 Checklist de fin (avant de clore une tâche)

- [ ] Tests unitaires créés/mis à jour pour chaque fichier modifié
- [ ] `ng test` (frontend) et/ou `npm run test` (backend) passent à 100%
- [ ] Migration de changelog créée si feature visible
- [ ] `README.md` / Documentation globale mis à jour en fonction des nouveaux développements AVANT le `git push` !
- [ ] `walkthrough.md` mis à jour avec section "🧪 Regression Testing"

## 🌐 Stack technique

- **Frontend** : Angular 19 (standalone components, TypeScript)
- **Backend** : NestJS + TypeORM + PostgreSQL
- **Tests frontend** : Jasmine + Karma (`ng test --watch=false --browsers=ChromeHeadless`)
- **Tests backend** : Jest (`npm run test`)
- **Migrations** : TypeORM dans `backend/src/migrations/`
- **Langue des artefacts** : Français 🇫🇷
