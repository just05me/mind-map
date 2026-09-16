import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Standalone marketing site. Port 5180 keeps clear of the app's Vite on 5173.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5180,
    strictPort: true,
  },
  preview: {
    port: 4180,
  },
})
