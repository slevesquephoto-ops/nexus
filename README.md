# NEXUS

Plateforme d'apprentissage gamifiée pour les enseignants et les élèves du DEP québécois en
informatique, inspirée de plateformes comme Hack The Box. Les élèves progressent sur une carte
d'îlots, débloquent les modules un à un et gagnent de l'expérience (XP), des niveaux, des
avatars et une place au classement de leur classe.

> **Statut : projet en cours.** La plateforme n'est pas hébergée publiquement pour le moment.
> Une démonstration est possible sur demande.

## Parcours

| Parcours | Contenu | Langues |
| --- | --- | --- |
| Linux | Linux Fundamentals : ligne de commande et environnement Linux, avec examen | FR / EN |
| Cyber Security | Introduction à la cybersécurité pour techniciens, dont un premier lab d'investigation de type SOC sur le site d'une entreprise fictive | FR |
| Windows | En préparation | FR |
| Guide Nexus | Prise en main de la plateforme | FR / EN |

Le contenu est écrit en YAML, hors du code : Parcours → Track → Module → Task (`task` ou
`challenge`). Les modules combinent plusieurs types de blocs : théorie, quiz, mission,
avertissement, indices, exercice en terminal, validation et note réservée à l'enseignant.

## Fonctionnalités

**Côté élève**
- Connexion sécurisée (JWT dans un cookie `httpOnly`)
- Carte visuelle des parcours, avec déverrouillage progressif des îlots
- Tâches corrigées automatiquement et défis soumis à l'enseignant
- Profil avec XP, niveaux, badges, avatars à débloquer et historique
- Classement de la classe

**Côté enseignant**
- Gestion des classes, avec un ou plusieurs parcours par classe et restriction des tracks
- Tableau de bord et carte de chaleur de la progression
- Correction des défis soumis, avec attribution d'XP et possibilité de réinitialiser un défi
- Gestion des mots de passe des élèves et des comptes enseignants

**Bilingue** : interface et contenu en français et en anglais.

## Stack

| Couche | Technologies |
| --- | --- |
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, Express 5, Prisma 7 (adaptateur `pg`), JWT |
| Base de données | PostgreSQL 16 |
| Lancement | Docker Compose (développement et production identiques) |

## Développement assisté par IA

Le projet a été développé avec **Claude Code**, en s'appuyant sur des sous-agents
spécialisés (`agents/` : backend, frontend, contenu, design system, devops) et sur des
fichiers de référence technique (`skills/`). Mon rôle : concevoir la plateforme et son
modèle de contenu, écrire les parcours, diriger les agents, réviser et tester le code produit.

## Lancer le projet

Prérequis : Docker avec Docker Compose.

```bash
cp .env.example .env      # puis remplir DB_PASSWORD et JWT_SECRET (openssl rand -base64 48)
docker compose up -d
docker compose exec backend node seed.js   # comptes de test (développement seulement)
```

Ouvrir http://localhost:3000 (l'API répond sur http://localhost:4000). Le fichier `.env`
n'est jamais commité.

Pour installer NEXUS sur un serveur Ubuntu (staging), voir
**[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md)** : guide complet pas à pas, opérations
courantes et dépannage.

## Structure

```
packages/
  frontend/   Next.js : carte, tâches, profil, classe, administration
  backend/    Express + Prisma : authentification, API, XP
  content/    Parcours en YAML
agents/       Instructions des sous-agents Claude Code
skills/       Références techniques partagées
docs/         Guide de déploiement
```
