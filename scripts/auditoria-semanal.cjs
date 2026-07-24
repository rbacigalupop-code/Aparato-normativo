#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// AUDITORÍA SEMANAL DEL SISTEMA
// ═══════════════════════════════════════════════════════════════════════════════
// Un solo comando que revisa la salud del producto y dice DÓNDE está fallando.
// Pensado para correr cada semana (y ante cualquier edición nueva de un listado).
//
//   npm run auditoria
//
// Revisa cinco frentes:
//   1. Suite de tests          — ¿algo se rompió?
//   2. Build de producción     — ¿compila?
//   3. Cobertura de listados   — ¿el PDF oficial trae códigos que no cargamos?
//   4. Cruce normativo         — ¿qué % de soluciones obtiene su par LOFC/LOSCAA?
//   5. Integridad de datos     — invariantes físicas y taxonomía
//
// Sale con código 1 si hay algo CRÍTICO. Los avisos no bloquean.
// ═══════════════════════════════════════════════════════════════════════════════

const { execSync } = require('child_process')

const C = { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[36m', d: '\x1b[2m', x: '\x1b[0m' }
const hallazgos = { critico: [], aviso: [], ok: [] }

const titulo = (t) => console.log(`\n${C.b}${'─'.repeat(72)}\n${t}\n${'─'.repeat(72)}${C.x}`)
const critico = (m) => { hallazgos.critico.push(m); console.log(`  ${C.r}✗ ${m}${C.x}`) }
const aviso   = (m) => { hallazgos.aviso.push(m);   console.log(`  ${C.y}⚠ ${m}${C.x}`) }
const bien    = (m) => { hallazgos.ok.push(m);      console.log(`  ${C.g}✓ ${m}${C.x}`) }

function sh(cmd, opts = {}) {
  try { return { ok: true, out: execSync(cmd, { encoding: 'utf8', stdio: 'pipe', maxBuffer: 5e8, ...opts }) } }
  catch (e) { return { ok: false, out: (e.stdout || '') + (e.stderr || '') } }
}

;(async () => {
  console.log(`${C.b}AUDITORÍA DEL SISTEMA · ${new Date().toLocaleString('es-CL')}${C.x}`)

  // ── 1. Tests ────────────────────────────────────────────────────────────────
  titulo('1. Suite de tests')
  const t = sh('npx vitest run')
  const mT = t.out.match(/Tests\s+(?:(\d+)\s+failed[^\n]*?\|\s*)?(\d+)\s+passed/)
  const rotos = mT && mT[1] ? mT[1] : (t.out.match(/(\d+)\s+failed/) || [, null])[1]
  if (t.ok && !rotos) bien(`${mT ? mT[2] : '?'} tests pasan`)
  else critico(`la suite FALLA — ${rotos || '?'} test(s) rotos. Corre: npx vitest run`)

  // ── 2. Build ────────────────────────────────────────────────────────────────
  titulo('2. Build de producción')
  const b = sh('npm run build')
  if (b.ok && /built in/.test(b.out)) bien('compila sin errores')
  else critico('el BUILD falla — la app no se puede desplegar')

  // ── 3. Cobertura de los listados oficiales ──────────────────────────────────
  titulo('3. Cobertura de listados oficiales (PDF vs cargado)')
  const cob = sh('node scripts/auditar-cobertura-listados.cjs')
  // Cada listado imprime su nombre y luego su bloque de conteos.
  const secciones = cob.out.split(/\n(?=(?:LOSCAT|LOFC|LOSCAA)[^\n]*\n═)/)
  let evaluados = 0
  for (const sec of secciones) {
    const nom = (sec.match(/^((?:LOSCAT|LOFC|LOSCAA)[^\n]*)/m) || [])[1]
    if (!nom || !/FALTAN/.test(sec)) continue
    evaluados++
    const faltan = parseInt((sec.match(/FALTAN\s*:\s*(\d+)/) || [, '0'])[1])
    const fams = [...sec.matchAll(/^\s{5}(\S+)\s+(\d+)\s/gm)].map(m => `${m[1]}(${m[2]})`)
    if (faltan === 0) bien(`${nom.trim()}: completo`)
    else aviso(`${nom.trim()}: faltan ${faltan} — ${fams.join(' ') || '—'}`)
  }
  if (!evaluados) aviso('no se pudo evaluar la cobertura (¿PDFs disponibles? revisa PDF_DIR)')

  // ── 4. Cruce normativo (el diferenciador) ───────────────────────────────────
  titulo('4. Cruce normativo LOSCAT → LOFC / LOSCAA')
  try {
    const { SC } = await import('../src/data.js')
    const H = await import('../src/lib/engines/homologacion.js')
    const st = {}
    for (const s of SC) {
      const e = s.elem || '?'
      st[e] = st[e] || { n: 0, f: 0, a: 0 }
      st[e].n++
      const req = e === 'puerta' ? 'F60' : 'F15'
      const h = H.homologarSolucion(s, { rfRequerido: req, rwRequerido: 30 })
      if (h?.fuego) st[e].f++
      if (h?.acustico) st[e].a++
    }
    let tot = 0, tf = 0, ta = 0
    for (const [e, v] of Object.entries(st).sort((a, b) => b[1].n - a[1].n)) {
      tot += v.n; tf += v.f; ta += v.a
      const pf = Math.round(v.f / v.n * 100), pa = Math.round(v.a / v.n * 100)
      console.log(`     ${e.padEnd(11)} ${String(v.n).padStart(3)} sol · fuego ${String(pf).padStart(3)}% · acústico ${String(pa).padStart(3)}%`)
    }
    const pf = Math.round(tf / tot * 100), pa = Math.round(ta / tot * 100)
    if (pf < 40 || pa < 35) aviso(`cobertura global baja: fuego ${pf}% · acústico ${pa}% (referencia: 50%/44%)`)
    else bien(`cobertura global: fuego ${pf}% · acústico ${pa}%`)
  } catch (e) { critico(`el motor de homologación no corre: ${e.message}`) }

  // ── 5. Integridad de datos ──────────────────────────────────────────────────
  titulo('5. Integridad de los datos normativos')
  try {
    const ep = (await import('../src/data/loscaa_entrepisos.js')).LOSCAA_ENTREPISOS
    let malos = 0
    for (const i of Object.values(ep)) {
      if (!(i.rw >= 30 && i.rw <= 80)) malos++
      if (i.rw_C != null && i.rw_C > i.rw) malos++
      if (i.lnw != null && !(i.lnw >= 40 && i.lnw <= 95)) malos++
    }
    malos ? critico(`${malos} violaciones de invariantes en entrepisos LOSCAA`) : bien('entrepisos LOSCAA: invariantes OK')
  } catch (e) { aviso('no se pudo revisar entrepisos LOSCAA') }

  const v = sh('node scripts/verificar-loscaa-entrepisos.cjs')
  const mv = v.out.match(/Coinciden (\d+) · Discrepan (\d+)/)
  if (mv) (mv[2] === '0' ? bien : critico)(`entrepisos vs PDF: ${mv[1]} coinciden, ${mv[2]} discrepan`)
  else aviso('no se pudo contrastar entrepisos contra el PDF (¿poppler / PDF disponible?)')

  // ── Resumen ─────────────────────────────────────────────────────────────────
  titulo('RESUMEN')
  console.log(`  ${C.g}OK: ${hallazgos.ok.length}${C.x}   ${C.y}avisos: ${hallazgos.aviso.length}${C.x}   ${C.r}críticos: ${hallazgos.critico.length}${C.x}`)
  if (hallazgos.critico.length) {
    console.log(`\n  ${C.r}DÓNDE ESTÁ FALLANDO:${C.x}`)
    hallazgos.critico.forEach(m => console.log(`    · ${m}`))
  }
  if (hallazgos.aviso.length) {
    console.log(`\n  ${C.y}ATENCIÓN (no bloquea):${C.x}`)
    hallazgos.aviso.forEach(m => console.log(`    · ${m}`))
  }
  if (!hallazgos.critico.length && !hallazgos.aviso.length) console.log(`\n  ${C.g}Sistema sano.${C.x}`)
  process.exit(hallazgos.critico.length ? 1 : 0)
})()
