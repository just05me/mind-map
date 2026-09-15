import { serveStatic } from '@hono/node-server/serve-static'
import type { Prisma } from '@prisma/client'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { db } from './db.js'
import { env } from './env.js'
import {
  assertPayloadSize,
  isProjectPayload,
  stripSessionFlags,
  type ProjectPayload,
} from './project-payload.js'
import { hashPassword, verifyPassword } from './password.js'
import { clientKey, rateLimitAuth } from './rate-limit.js'
import { clearSession, readSession, requireUser, writeSession } from './session.js'

export type AppVariables = {
  userId: string
  email: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8
const MAX_PASSWORD = 72

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function parseAuthBody(body: unknown): { email: string; password: string } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Некорректные данные' }
  const { email, password } = body as { email?: unknown; password?: unknown }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'Укажите почту и пароль' }
  }
  const normalized = normalizeEmail(email)
  if (!EMAIL_RE.test(normalized) || normalized.length > 254) {
    return { error: 'Некорректная почта' }
  }
  if (password.length < MIN_PASSWORD) {
    return { error: `Пароль не короче ${MIN_PASSWORD} символов` }
  }
  if (password.length > MAX_PASSWORD) {
    return { error: `Пароль не длиннее ${MAX_PASSWORD} символов` }
  }
  return { email: normalized, password }
}

function parseProjectBody(body: unknown): ProjectPayload | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Некорректные данные' }
  const raw = (body as { project?: unknown }).project ?? body
  if (!isProjectPayload(raw)) return { error: 'Некорректный проект' }
  try {
    assertPayloadSize(raw)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Проект слишком большой' }
  }
  return stripSessionFlags(raw)
}

function publicUser(user: { id: string; email: string; createdAt: Date }) {
  return { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() }
}

function toJson(project: ProjectPayload): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(project)) as Prisma.InputJsonValue
}

function toClientProject(row: {
  id: string
  name: string
  payload: unknown
  updatedAt: Date
}): ProjectPayload | null {
  if (!isProjectPayload(row.payload)) return null
  return {
    ...row.payload,
    id: row.id,
    title: row.name,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>()

  app.use('*', logger())
  app.use('*', secureHeaders())
  app.use(
    '/api/*',
    cors({
      origin: env.corsOrigins,
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    }),
  )

  app.get('/api/health', async (c) => {
    try {
      await db.$queryRaw`SELECT 1`
      return c.json({ ok: true, db: 'up' as const })
    } catch {
      return c.json({ ok: false, db: 'down' as const }, 503)
    }
  })

  app.get('/api/auth/me', async (c) => {
    const session = await readSession(c)
    if (!session) return c.json({ error: 'Нужна авторизация' }, 401)
    const user = await db.user.findUnique({ where: { id: session.sub } })
    if (!user) {
      clearSession(c)
      return c.json({ error: 'Нужна авторизация' }, 401)
    }
    return c.json({ user: publicUser(user) })
  })

  app.post('/api/auth/register', async (c) => {
    if (!rateLimitAuth(clientKey(c.req.header('x-forwarded-for'), 'register'))) {
      return c.json({ error: 'Слишком много попыток, подождите' }, 429)
    }
    const parsed = parseAuthBody(await c.req.json().catch(() => null))
    if ('error' in parsed) return c.json({ error: parsed.error }, 400)
    const exists = await db.user.findUnique({ where: { email: parsed.email } })
    if (exists) return c.json({ error: 'Такая почта уже зарегистрирована' }, 409)
    const user = await db.user.create({
      data: {
        email: parsed.email,
        passwordHash: await hashPassword(parsed.password),
      },
    })
    await writeSession(c, { sub: user.id, email: user.email })
    return c.json({ user: publicUser(user) }, 201)
  })

  app.post('/api/auth/login', async (c) => {
    if (!rateLimitAuth(clientKey(c.req.header('x-forwarded-for'), 'login'))) {
      return c.json({ error: 'Слишком много попыток, подождите' }, 429)
    }
    const parsed = parseAuthBody(await c.req.json().catch(() => null))
    if ('error' in parsed) return c.json({ error: parsed.error }, 400)
    const user = await db.user.findUnique({ where: { email: parsed.email } })
    if (!user || !(await verifyPassword(parsed.password, user.passwordHash))) {
      return c.json({ error: 'Неверная почта или пароль' }, 401)
    }
    await writeSession(c, { sub: user.id, email: user.email })
    return c.json({ user: publicUser(user) })
  })

  app.post('/api/auth/logout', async (c) => {
    clearSession(c)
    return c.json({ ok: true })
  })

  app.get('/api/projects', requireUser, async (c) => {
    const rows = await db.project.findMany({
      where: { userId: c.get('userId') },
      orderBy: { updatedAt: 'desc' },
    })
    const projects = rows.flatMap((row) => {
      const project = toClientProject(row)
      return project ? [project] : []
    })
    return c.json({ projects })
  })

  app.get('/api/projects/:id', requireUser, async (c) => {
    const row = await db.project.findFirst({
      where: { id: c.req.param('id'), userId: c.get('userId') },
    })
    if (!row) return c.json({ error: 'Проект не найден' }, 404)
    const project = toClientProject(row)
    if (!project) return c.json({ error: 'Проект повреждён' }, 500)
    return c.json({ project })
  })

  app.post('/api/projects', requireUser, async (c) => {
    const parsed = parseProjectBody(await c.req.json().catch(() => null))
    if ('error' in parsed) return c.json({ error: parsed.error }, 400)
    const userId = c.get('userId')
    const existing = await db.project.findUnique({ where: { id: parsed.id } })
    if (existing && existing.userId !== userId) {
      return c.json({ error: 'Проект с таким id уже есть' }, 409)
    }
    const row = await db.project.upsert({
      where: { id: parsed.id },
      create: {
        id: parsed.id,
        userId,
        name: parsed.title,
        payload: toJson(parsed),
      },
      update: {
        name: parsed.title,
        payload: toJson(parsed),
      },
    })
    const project = toClientProject(row)
    if (!project) return c.json({ error: 'Не удалось сохранить проект' }, 500)
    return c.json({ project }, existing ? 200 : 201)
  })

  app.put('/api/projects/:id', requireUser, async (c) => {
    const parsed = parseProjectBody(await c.req.json().catch(() => null))
    if ('error' in parsed) return c.json({ error: parsed.error }, 400)
    const id = c.req.param('id')
    if (parsed.id !== id) return c.json({ error: 'id проекта не совпадает' }, 400)
    const userId = c.get('userId')
    const existing = await db.project.findUnique({ where: { id } })
    if (existing && existing.userId !== userId) {
      return c.json({ error: 'Нет доступа к проекту' }, 403)
    }
    const row = await db.project.upsert({
      where: { id },
      create: {
        id,
        userId,
        name: parsed.title,
        payload: toJson(parsed),
      },
      update: {
        name: parsed.title,
        payload: toJson(parsed),
      },
    })
    const project = toClientProject(row)
    if (!project) return c.json({ error: 'Не удалось сохранить проект' }, 500)
    return c.json({ project })
  })

  app.delete('/api/projects/:id', requireUser, async (c) => {
    const deleted = await db.project.deleteMany({
      where: { id: c.req.param('id'), userId: c.get('userId') },
    })
    if (deleted.count === 0) return c.json({ error: 'Проект не найден' }, 404)
    return c.json({ ok: true })
  })

  app.notFound((c) => {
    if (c.req.path.startsWith('/api/')) {
      return c.json({ error: 'Не найдено' }, 404)
    }
    return c.text('Не найдено', 404)
  })

  if (env.nodeEnv === 'production') {
    app.use(
      '/*',
      serveStatic({
        root: './dist',
      }),
    )
    app.get('*', serveStatic({ path: './dist/index.html' }))
  }

  return app
}
