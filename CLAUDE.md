# NEXUS — Instructions pour Claude Code

## Contexte du projet
NEXUS est une plateforme d'apprentissage gamifiée pour enseignants du DEP québécois.
Stack : Next.js 14 (frontend) + Express.js + Prisma ORM (backend) + PostgreSQL + Docker Compose.
Développeur : seul, Windows 11, Node.js v20, Docker Desktop avec WSL2.

## Architecture
```
packages/
  frontend/   → Next.js 14, Tailwind CSS, App Router
  backend/    → Express.js, Prisma ORM, JWT auth
  content/    → fichiers YAML (parcours, tracks, modules, tasks)
agents/       → sous-agents spécialisés
skills/       → fichiers de référence technique
```

## Hiérarchie du contenu
Parcours → Track → Module → Task (type: task | challenge)
Un Track peut appartenir à plusieurs Parcours (table de jointure ParcoursTracks).

## Règles absolues
- Toujours utiliser Prisma pour accéder à la DB, jamais de SQL brut
- JWT dans httpOnly cookies uniquement, jamais localStorage
- Variables d'environnement via .env, jamais hardcodées
- Docker Compose est la seule façon de lancer le projet (dev et prod identiques)
- Après toute migration Prisma : rebuilder le container backend
- Effacer .next/ après tout changement de route Next.js

## Environnement Docker
- Backend  : http://localhost:4000
- Frontend : http://localhost:3000
- DB       : localhost:5432 (postgres, user: nexus)
- DATABASE_URL est injectée par Docker Compose via .env

## Version Prisma
Prisma 7.8.x est installé. Le format exact vérifié en production :

**prisma.config.ts** (à la racine de packages/backend) :
```typescript
import { defineConfig } from 'prisma/config'
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
```

**prisma/schema.prisma** : bloc datasource SANS `url` + generator uniquement :
```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}
// ... modèles ...
```

Règle : `url` est INTERDITE dans schema.prisma (Prisma 7.8+ la rejette).
L'URL vient uniquement de `prisma.config.ts → datasource.url`.

**PrismaClient** (Prisma 7 requiert un driver adapter, pas de new PrismaClient() seul) :
```javascript
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```
Packages requis : `pg`, `@prisma/adapter-pg` (en plus de `@prisma/client` et `prisma`).

## Commandes utiles backend
```bash
# Seed (créer utilisateurs de test)
docker compose exec backend node seed.js
```

## Commandes utiles
```bash
# Lancer le projet
docker compose up -d

# Rebuild après changement backend
docker compose up -d --build backend

# Migration Prisma
docker compose exec backend npx prisma migrate dev --name <nom>

# IMPORTANT — après chaque migration, régénérer le client dans le container
# (docker compose up --build réutilise l'ancien volume node_modules = client désynchronisé)
docker compose exec backend npx prisma generate

# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Réinitialiser complètement
docker compose down -v && docker compose up -d --build
```

## Palette visuelle NEXUS
- Fond       : #080b14
- Jaune actif : #f5c030
- Cyan complété : #00d4c8
- Gris verrouillé : #1c2a4a
- Police : Segoe UI / système

## Ne jamais faire
- npm install @radix-ui/react-* (wildcard invalide — installer composant par composant)
- Modifier docker-compose.yml sans rebuild
- Committer le fichier .env
- Utiliser localStorage pour le JWT
- Mettre un bloc datasource dans schema.prisma (Prisma 7 — utiliser prisma.config.ts)
