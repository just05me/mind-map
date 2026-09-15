import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { db } from './db.js'
import { env } from './env.js'

const app = createApp()

const server = serve(
  {
    fetch: app.fetch,
    port: env.port,
    hostname: '0.0.0.0',
  },
  (info) => {
    console.log(`API слушает http://127.0.0.1:${info.port}`)
  },
)

async function shutdown() {
  server.close()
  await db.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown()
})
process.on('SIGTERM', () => {
  void shutdown()
})
