/**
 * Generador de tokens de acceso — Verificador OGUC
 *
 * Uso:
 *   node scripts/genToken.js --desc "Nombre Colega" --dias 30 --proyectos 2
 *   node scripts/genToken.js --desc "Cliente VIP"   --dias 90 --proyectos 0   (ilimitado)
 *
 * Requiere: SERVICE ROLE KEY de Supabase (no la anon key)
 *   → Supabase Dashboard → Settings → API → service_role (secret)
 *   Pégala en la variable SUPABASE_SERVICE_KEY abajo.
 */

const SUPABASE_URL = 'https://srukzfoerdgcaymnriax.supabase.co'
const SUPABASE_SERVICE_KEY = 'PEGAR_AQUI_SERVICE_ROLE_KEY'   // ← reemplazar

// ─── Parsear argumentos ────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const get = (flag, def) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : def }

const descripcion  = get('--desc', 'Sin descripción')
const dias         = parseInt(get('--dias', '30'))
const maxProyectos = parseInt(get('--proyectos', '1'))

// ─── Generar token legible ─────────────────────────────────────────────────────
function genToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  // sin 0/O/I/1 para evitar confusión
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `OGUC-${seg()}-${seg()}-${seg()}`
}

async function main() {
  if (SUPABASE_SERVICE_KEY === 'PEGAR_AQUI_SERVICE_ROLE_KEY') {
    console.error('\n❌ Debes pegar la SERVICE ROLE KEY de Supabase en este script.')
    console.error('   Dashboard → Settings → API → service_role\n')
    process.exit(1)
  }

  const token     = genToken()
  const expiresAt = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString()

  const body = JSON.stringify({
    token,
    descripcion,
    expires_at:       expiresAt,
    max_proyectos:    maxProyectos,
    proyectos_usados: 0,
    activo:           true,
  })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/tokens`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer':        'return=representation',
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('❌ Error al insertar token:', err)
    process.exit(1)
  }

  const [created] = await res.json()
  console.log('\n✅ Token creado exitosamente:')
  console.log('─'.repeat(44))
  console.log(`   Token:       ${created.token}`)
  console.log(`   Descripción: ${created.descripcion}`)
  console.log(`   Expira:      ${new Date(created.expires_at).toLocaleDateString('es-CL')} (${dias} días)`)
  console.log(`   Proyectos:   ${created.max_proyectos === 0 ? 'Ilimitados' : created.max_proyectos}`)
  console.log('─'.repeat(44))
  console.log('\n   Envía este token al usuario para que ingrese a la app.\n')
}

main().catch(e => { console.error(e); process.exit(1) })
