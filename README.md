# NEXUS

Plateforme d'apprentissage gamifiée pour les enseignants et les élèves du DEP québécois,
inspirée de plateformes comme Hack The Box. Les élèves progressent sur une carte d'îlots,
débloquent les modules un à un et gagnent de l'expérience (XP), des niveaux et des badges.
Le premier parcours porte sur les fondamentaux de Linux.

> **Statut : projet en cours.** La plateforme n'est pas hébergée publiquement pour le moment.
> Une démonstration est possible sur demande.

## Fonctionnalités

**Côté élève**
- Connexion sécurisée (JWT dans un cookie `httpOnly`)
- Carte visuelle des parcours, avec déverrouillage progressif des modules
- Tâches et défis : théorie, blocs de code, exercices
- Profil avec XP, niveaux, badges et historique

**Côté enseignant**
- Gestion des classes et tableau de bord
- Carte de chaleur de la progression des élèves
- Correction manuelle (tâches notées par l'enseignant) et attribution d'XP, avec recalcul
  des niveaux

**Contenu**
- Les parcours sont écrits en YAML, hors du code : Parcours → Track → Module → Task
  (`task` ou `challenge`). Un track peut appartenir à plusieurs parcours.
- Parcours actuels : `comp10` (Linux) et `nexus-guide` (prise en main de la plateforme)

## Stack

| Couche | Technologies |
| --- | --- |
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Node.js, Express 5, Prisma 7 (adaptateur `pg`), JWT |
| Base de données | PostgreSQL |
| Lancement | Docker Compose (développement et production identiques) |

## Développement assisté par IA

Le projet a été développé avec **Claude Code**, en s'appuyant sur des sous-agents
spécialisés (`agents/` : backend, frontend, contenu, design system, devops) et sur des
fichiers de référence technique (`skills/`). Mon rôle : concevoir la plateforme et son
modèle de contenu, diriger les agents, réviser et tester le code produit.

## Lancer le projet

Prérequis : Docker avec Docker Compose.

1. Créer un fichier `.env` à la racine (il n'est jamais commité) :
   ```
   DB_PASSWORD=
   JWT_SECRET=
   ```
2. Démarrer :
   ```bash
   docker compose up -d
   docker compose exec backend node seed.js   # comptes de test (développement seulement)
   ```
3. Ouvrir http://localhost:3000 (l'API répond sur http://localhost:4000).

## Structure

```
packages/
  frontend/   Next.js : carte, tâches, profil, administration
  backend/    Express + Prisma : authentification, API, XP
  content/    Parcours en YAML
agents/       Instructions des sous-agents Claude Code
skills/       Références techniques partagées
```
