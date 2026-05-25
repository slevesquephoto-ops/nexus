# API Patterns — NEXUS Backend

## Structure d'une route Express type
```typescript
// packages/backend/src/routes/tasks.ts
import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/tasks/:id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { module: true }
    })

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json({ task })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
```

## Middleware d'authentification JWT
```typescript
// packages/backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      role: string
    }
    req.userId = payload.userId
    req.userRole = payload.role
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireTeacher(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'TEACHER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Teacher access required' })
  }
  next()
}
```

## Login + génération JWT
```typescript
// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  res
    .cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    .json({ user: { id: user.id, username: user.username, role: user.role } })
})
```

## Format de réponse API standard
```typescript
// Succès
res.json({ data: result })

// Erreur
res.status(400).json({ error: 'Message d\'erreur clair' })

// Liste avec pagination éventuelle
res.json({ items: results, total: count })
```

## index.ts principal
```typescript
// packages/backend/src/index.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

import authRoutes from './routes/auth'
import parcoursRoutes from './routes/parcours'
import tracksRoutes from './routes/tracks'
import modulesRoutes from './routes/modules'
import tasksRoutes from './routes/tasks'
import usersRoutes from './routes/users'

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'nexus-backend' }))

app.use('/auth', authRoutes)
app.use('/api/parcours', parcoursRoutes)
app.use('/api/tracks', tracksRoutes)
app.use('/api/modules', modulesRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/users', usersRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`NEXUS backend running on port ${PORT}`))
```
