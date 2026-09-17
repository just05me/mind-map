import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { listenOnIpv6Localhost } from './vite.listen-ipv6.js'

/**
 * Long-lived vendor chunks: app code changes every deploy, React / XYFlow / Motion do not,
 * so returning visitors re-download only the small app chunk (assets are content-hashed).
 */
const VENDOR_CHUNKS: { name: string; packages: string[] }[] = [
  { name: 'react', packages: ['react', 'react-dom', 'scheduler'] },
  {
    name: 'xyflow',
    packages: ['@xyflow/react', '@xyflow/system', 'zustand', 'classcat', 'use-sync-external-store'],
  },
  { name: 'motion', packages: ['motion', 'motion-dom', 'motion-utils', 'framer-motion'] },
  // Only imported on demand (auto-layout, PNG export); named so the lazy chunks are recognisable.
  { name: 'dagre', packages: ['@dagrejs/dagre', '@dagrejs/graphlib'] },
  { name: 'html-to-image', packages: ['html-to-image'] },
]

function vendorChunk(id: string): string | undefined {
  // Keep all CSS in the single app stylesheet.
  if (/\.css(\?|$)/.test(id)) return undefined
  const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/)
  if (!match) return undefined
  const pkg = match[1]
  if (pkg.startsWith('d3-')) return 'xyflow'
  return VENDOR_CHUNKS.find((chunk) => chunk.packages.includes(pkg))?.name
}

export default defineConfig({
  plugins: [react(), tailwindcss(), listenOnIpv6Localhost()],
  // The root .env belongs to the Hono server. Its `NODE_ENV=development` would otherwise
  // leak into `vite build` and ship the development build of React (2.4x larger, StrictMode
  // double-effects, console warnings). The frontend reads no `import.meta.env`, so nothing is lost.
  envDir: false,
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
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
