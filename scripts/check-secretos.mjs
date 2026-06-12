// ═══════════════════════════════════════════════════════════════════════════════
// check-secretos.mjs — Guard anti-exposición de claves Supabase service_role
// ═══════════════════════════════════════════════════════════════════════════════
// Falla (exit 1) si encuentra una clave SECRETA en el repo o en el bundle:
//   · sb_secret_…              → clave secreta nuevo formato (bypassa RLS)
//   · JWT con role=service_role → clave secreta formato JWT (bypassa RLS)
//
// NO marca la palabra "service_role" suelta (comentarios de seguridad legítimos):
// solo el prefijo de clave real y JWTs que decodifican a service_role.
//
// Uso:  node scripts/check-secretos.mjs   ·   npm run check:secretos
// En CI corre tras el build, así escanea también dist/ (lo que ve el navegador).
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'node:fs'
import { execSync } from 'node:child_process'

const SELF = 'scripts/check-secretos.mjs'
const RE_SECRET = /sb_secret_[A-Za-z0-9]/
const RE_JWT = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}/g
const SKIP_EXT = /\.(png|jpe?g|gif|pdf|ico|svg|woff2?|ttf|map)$/i

function archivos() {
  let lista = []
  try {
    // Trackeados + nuevos sin commitear (respetando .gitignore) → atrapa un
    // secreto antes incluso de hacer git add.
    const tracked = execSync('git ls-files', { encoding: 'utf8' }).trim().split('\n')
    const nuevos = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' }).trim().split('\n')
    lista = [...tracked, ...nuevos].filter(Boolean)
  } catch { /* no git: seguimos solo con dist */ }
  if (fs.existsSync('dist')) {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`])
    lista = lista.concat(walk('dist'))
  }
  return [...new Set(lista)].filter(f =>
    f !== SELF && !f.includes('node_modules') && !SKIP_EXT.test(f))
}

const hits = []
for (const f of archivos()) {
  let txt
  try { txt = fs.readFileSync(f, 'utf8') } catch { continue }

  if (RE_SECRET.test(txt)) hits.push(`${f} → contiene 'sb_secret_' (clave secreta de Supabase)`)

  for (const jwt of (txt.match(RE_JWT) || [])) {
    try {
      const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'))
      if (payload.role === 'service_role') hits.push(`${f} → JWT con role=service_role`)
    } catch { /* no es un JWT válido, ignorar */ }
  }
}

if (hits.length) {
  console.error('⛔ SECRETO service_role EXPUESTO — el build se detiene:\n')
  hits.forEach(h => console.error('   ' + h))
  console.error('\nUna clave service_role / sb_secret_ bypassa RLS y NUNCA puede estar en el')
  console.error('repo ni en el bundle. Quítala, rótala en Supabase (Settings → API Keys) y,')
  console.error('si quedó en git, límpiala del historial. La publishable (sb_publishable_) sí va en el front.')
  process.exit(1)
}

console.log('✅ check-secretos: sin claves service_role / sb_secret_ en repo ni bundle.')
