# Agent Backend

## Responsabilités
- Routes Express.js (API REST)
- Schéma Prisma et migrations
- Authentification JWT (httpOnly cookies)
- Parser YAML → base de données
- Logique XP, badges, progression

## Stack
- Express.js + cors + helmet + cookie-parser
- Prisma 7.x (voir CLAUDE.md pour config datasource)
- bcryptjs pour les mots de passe
- js-yaml pour parser le contenu YAML

## Structure des routes
```
GET    /health
POST   /auth/login
POST   /auth/logout
GET    /api/parcours
GET    /api/parcours/:id/tracks
GET    /api/tracks/:id/modules
GET    /api/modules/:id/tasks
GET    /api/tasks/:id
POST   /api/tasks/:id/complete
GET    /api/users/me
GET    /api/users/me/progress
```

## Modèles Prisma — Mois 1 (prioritaires)
User, Parcours, Track, ParcoursTracks, Module, Task,
TaskProgress, Classe, ClasseMember, Enrollment, XpLog

## Modèles Prisma — Mois 2-3 (gamification)
Badge, UserBadge, Avatar

## Schéma Prisma complet cible

```prisma
generator client {
  provider = "prisma-client-js"
}

// Aucun bloc datasource — voir prisma.config.ts

model User {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String?  @unique
  passwordHash String
  role         Role     @default(STUDENT)
  xp           Int      @default(0)
  level        Int      @default(1)
  avatarId     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  enrollments  Enrollment[]
  taskProgress TaskProgress[]
  badges       UserBadge[]
  xpLogs       XpLog[]
  classes      ClasseMember[]
}

enum Role {
  STUDENT
  TEACHER
  ADMIN
}

model Parcours {
  id          String   @id
  title       String
  description String?
  language    String   @default("fr")
  isPublic    Boolean  @default(false)
  order       Int      @default(0)
  createdAt   DateTime @default(now())

  tracks      ParcoursTracks[]
  enrollments Enrollment[]
  classes     Classe[]
}

model Track {
  id          String   @id
  title       String
  description String?
  icon        String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())

  parcours    ParcoursTracks[]
  modules     Module[]
}

model ParcoursTracks {
  parcoursId String
  trackId    String
  order      Int      @default(0)
  parcours   Parcours @relation(fields: [parcoursId], references: [id])
  track      Track    @relation(fields: [trackId], references: [id])

  @@id([parcoursId, trackId])
}

model Module {
  id          String   @id
  trackId     String
  track       Track    @relation(fields: [trackId], references: [id])
  title       String
  description String?
  order       Int
  xpReward    Int      @default(50)
  createdAt   DateTime @default(now())

  tasks       Task[]
}

model Task {
  id       String   @id
  moduleId String
  module   Module   @relation(fields: [moduleId], references: [id])
  type     TaskType
  title    String
  order    Int
  xpReward Int      @default(15)
  createdAt DateTime @default(now())

  progress TaskProgress[]
}

enum TaskType {
  TASK
  CHALLENGE
}

model TaskProgress {
  id          String    @id @default(cuid())
  userId      String
  taskId      String
  user        User      @relation(fields: [userId], references: [id])
  task        Task      @relation(fields: [taskId], references: [id])
  completed   Boolean   @default(false)
  score       Int?
  completedAt DateTime?
  createdAt   DateTime  @default(now())

  @@unique([userId, taskId])
}

model Classe {
  id         String   @id @default(cuid())
  name       String
  parcoursId String
  parcours   Parcours @relation(fields: [parcoursId], references: [id])
  inviteCode String   @unique @default(cuid())
  createdAt  DateTime @default(now())

  members    ClasseMember[]
}

model ClasseMember {
  userId   String
  classeId String
  user     User   @relation(fields: [userId], references: [id])
  classe   Classe @relation(fields: [classeId], references: [id])

  @@id([userId, classeId])
}

model Enrollment {
  id         String   @id @default(cuid())
  userId     String
  parcoursId String
  user       User     @relation(fields: [userId], references: [id])
  parcours   Parcours @relation(fields: [parcoursId], references: [id])
  enrolledAt DateTime @default(now())

  @@unique([userId, parcoursId])
}

model Badge {
  id          String    @id
  title       String
  description String
  imageUrl    String
  condition   String?
  createdAt   DateTime  @default(now())

  users       UserBadge[]
}

model UserBadge {
  userId   String
  badgeId  String
  user     User   @relation(fields: [userId], references: [id])
  badge    Badge  @relation(fields: [badgeId], references: [id])
  earnedAt DateTime @default(now())

  @@id([userId, badgeId])
}

model XpLog {
  id        String   @id @default(cuid())
  userId    String
  amount    Int
  reason    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

## Règle migration
Après chaque changement de schema.prisma :
1. `docker compose exec backend npx prisma migrate dev --name <description>`
2. `docker compose up -d --build backend`

## Structure fichiers backend
```
packages/backend/
  prisma/
    schema.prisma       ← modèles uniquement, pas de datasource
    migrations/         ← généré automatiquement
  prisma.config.ts      ← datasource URL (Prisma 7)
  src/
    lib/
      prisma.ts         ← instance PrismaClient singleton
    routes/
      auth.ts
      parcours.ts
      tracks.ts
      modules.ts
      tasks.ts
      users.ts
    middleware/
      auth.ts           ← vérification JWT
    index.ts            ← point d'entrée Express
  index.js              ← point d'entrée Docker (appelle src/index.ts via ts-node)
  package.json
  tsconfig.json
```
