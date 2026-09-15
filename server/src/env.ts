import { config } from 'dotenv'

config()

const WEAK_SECRETS = new Set([
  'changeme',
  'secret',
  'replace-me',
  'session-secret',
  'local-dev-only-change-me',
])

export type AppEnv = {
  nodeEnv: 'development' | 'production' | 'test'
  port: number
  databaseUrl: string
  sessionSecret: string
  corsOrigins: string[]
}

function readNodeEnv(): AppEnv['nodeEnv'] {
  const value = process.env.NODE_ENV
  if (value === 'production' || value === 'test' || value === 'development') {
    return value
  }
  return 'development'
}

function requireValue(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Задайте ${name} в .env (см. .env.example)`)
  }
  return value
}

function parseCorsOrigins(raw: string): string[] {
  const origins = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (origins.length === 0) {
    throw new Error('CORS_ORIGIN не должен быть пустым')
  }
  if (origins.includes('*')) {
    throw new Error('CORS_ORIGIN не может быть *: для cookie нужна явная origin')
  }
  return origins
}

export function loadEnv(): AppEnv {
  const nodeEnv = readNodeEnv()
  const sessionSecret = requireValue('SESSION_SECRET')
  if (nodeEnv === 'production') {
    if (sessionSecret.length < 32 || WEAK_SECRETS.has(sessionSecret)) {
      throw new Error('SESSION_SECRET в production должен быть случайной строкой ≥ 32 символов')
    }
  }

  const portRaw = process.env.PORT ?? '3000'
  const port = Number(portRaw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Некорректный PORT: ${portRaw}`)
  }

  return {
    nodeEnv,
    port,
    databaseUrl: requireValue('DATABASE_URL'),
    sessionSecret,
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN ?? 'http://localhost:5173'),
  }
}

export const env = loadEnv()
