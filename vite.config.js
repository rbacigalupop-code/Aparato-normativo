import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// Identificador de commit para el sello de versión del build.
// En Vercel usa la env var del deploy; en local cae a git; si no hay, 'local'.
function gitCommit() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'local' }
}

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: {
    rollupOptions: {
      output: {
        // Separa las librerías de terceros en chunks propios y estables: como
        // cambian poco, el navegador las cachea entre deploys y solo re-descarga
        // el código de la app. xlsx y html2pdf ya se separan solos (import dinámico).
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react') || id.includes('/scheduler')) return 'vendor-react'
            if (id.includes('@supabase')) return 'vendor-supabase'
          }
        },
      },
    },
  },
  define: {
    // Fecha en hora de Chile (en-CA da formato ISO YYYY-MM-DD), coherente con el resto de la UI
    __BUILD_DATE__: JSON.stringify(
      new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date())
    ),
    __BUILD_COMMIT__: JSON.stringify(gitCommit()),
  },
})
