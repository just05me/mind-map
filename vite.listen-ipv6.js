import { createServer } from 'node:http'

/** Safari on macOS resolves localhost to ::1; Vite's host:true only binds IPv4. */
export function listenOnIpv6Localhost() {
  return {
    name: 'listen-on-ipv6-localhost',
    configureServer(server) {
      let extra

      const attach = () => {
        const httpServer = server.httpServer
        if (!httpServer || extra) {
          return
        }

        const address = httpServer.address()
        const port = typeof address === 'object' && address ? address.port : undefined
        if (port == null) {
          return
        }

        extra = createServer((req, res) => {
          httpServer.emit('request', req, res)
        })

        extra.on('upgrade', (req, socket, head) => {
          httpServer.emit('upgrade', req, socket, head)
        })

        extra.on('error', (error) => {
          if (error.code !== 'EADDRINUSE') {
            console.error(`[listen-on-ipv6-localhost] ${error.message}`)
          }
        })

        extra.listen(port, '::1', () => {
          console.log(`  ➜  Safari:  http://localhost:${port}/  (IPv6 ::1)`)
        })
      }

      if (server.httpServer?.listening) {
        attach()
      } else {
        server.httpServer?.once('listening', attach)
      }

      server.httpServer?.once('close', () => {
        extra?.close()
        extra = undefined
      })
    },
  }
}
