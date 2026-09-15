import type { Context, Next } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import { env } from './env.js'

export const SESSION_COOKIE = 'session'
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7

export type SessionPayload = {
  sub: string
  email: string
}

type AppContext = Context<{ Variables: { userId: string; email: string } }>

function cookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'Lax' as const,
    maxAge: SESSION_MAX_AGE_SEC,
  }
}

export async function writeSession(c: Context, user: SessionPayload): Promise<void> {
  const token = await sign(
    {
      sub: user.sub,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
    },
    env.sessionSecret,
    'HS256',
  )
  setCookie(c, SESSION_COOKIE, token, cookieOptions())
}

export function clearSession(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, {
    path: '/',
    secure: env.nodeEnv === 'production',
  })
}

export async function readSession(c: Context): Promise<SessionPayload | null> {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  try {
    const payload = await verify(token, env.sessionSecret, 'HS256')
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null
    return { sub: payload.sub, email: payload.email }
  } catch {
    return null
  }
}

export async function requireUser(c: AppContext, next: Next) {
  const session = await readSession(c)
  if (!session) {
    return c.json({ error: 'Нужна авторизация' }, 401)
  }
  c.set('userId', session.sub)
  c.set('email', session.email)
  await next()
}
