import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { listenOnIpv6Localhost } from './vite.listen-ipv6.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), listenOnIpv6Localhost()],
  server: {
    // IPv4 on all interfaces. The plugin also binds ::1 so Safari's
    // localhost → IPv6 lookup succeeds (macOS does not dual-stack 0.0.0.0).
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
