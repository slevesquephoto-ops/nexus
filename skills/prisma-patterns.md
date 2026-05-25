# Prisma 7 — Patterns pour NEXUS

## IMPORTANT — Prisma 7 change la config datasource

### Ne PAS faire (ancienne syntaxe Prisma 6)
```prisma
// ❌ NE PAS METTRE datasource dans schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Faire (Prisma 7)
**schema.prisma** — generator uniquement :
```prisma
generator client {
  provider = "prisma-client-js"
}

// Aucun bloc datasource ici
// La connexion est dans prisma.config.ts
```

**prisma.config.ts** — à la racine de packages/backend :
```typescript
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasourceUrl: process.env.DATABASE_URL,
})
```

## Initialisation PrismaClient singleton
```typescript
// packages/backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
export default prisma
```

## Patterns de requêtes courants

### Trouver un utilisateur avec sa progression
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    taskProgress: {
      where: { completed: true }
    },
    badges: {
      include: { badge: true }
    }
  }
})
```

### Progression d'un track pour un utilisateur
```typescript
const modules = await prisma.module.findMany({
  where: { trackId },
  orderBy: { order: 'asc' },
  include: {
    tasks: {
      orderBy: { order: 'asc' },
      include: {
        progress: {
          where: { userId }
        }
      }
    }
  }
})
```

### Compléter une task + attribuer XP
```typescript
await prisma.$transaction(async (tx) => {
  // Marquer la task comme complétée
  await tx.taskProgress.upsert({
    where: { userId_taskId: { userId, taskId } },
    update: { completed: true, completedAt: new Date() },
    create: { userId, taskId, completed: true, completedAt: new Date() }
  })

  // Ajouter XP à l'utilisateur
  await tx.user.update({
    where: { id: userId },
    data: { xp: { increment: task.xpReward } }
  })

  // Logger l'XP
  await tx.xpLog.create({
    data: { userId, amount: task.xpReward, reason: `Task completed: ${taskId}` }
  })
})
```

## Migration workflow
```bash
# 1. Modifier schema.prisma
# 2. Créer la migration
docker compose exec backend npx prisma migrate dev --name description_courte

# 3. Rebuilder le container (important — Prisma génère du code)
docker compose up -d --build backend

# 4. Vérifier
docker compose exec backend npx prisma studio
```

## Réinitialiser la DB en dev
```bash
docker compose down -v
docker compose up -d
docker compose exec backend npx prisma migrate dev --name init
```
