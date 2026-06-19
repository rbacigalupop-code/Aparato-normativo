// ─────────────────────────────────────────────────────────────────────────────
// audit-deadcode-engines.mjs — Sonda de código muerto en los engines (solo lectura).
//
// Por cada export de src/lib/engines/*.js cuenta referencias en todo src/:
//   · externas → otros .js/.jsx que NO son tests (uso en la app)
//   · en tests → archivos bajo __tests__
//   · internas → el mismo archivo (fuera de la línea de declaración)
//
// Clasifica:
//   VIVO         → usado por la app (ext>0)
//   SOLO-TEST    → solo lo referencian tests (validado/reutilizable, no en UI)
//   SOLO-INTERNO → solo se usa dentro de su propio archivo (export innecesario)
//   MUERTO       → nadie lo referencia → candidato a eliminar
//
// Uso: node scripts/audit-deadcode-engines.mjs
// Nota: heurística textual; revisar antes de borrar (puede haber falsos positivos
// por acceso dinámico). Tras la limpieza de la auditoría Fase 0, debe dar 0 MUERTO.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const SRC = 'src'
const ENGINES_DIR = join('src', 'lib', 'engines')

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (/\.(js|jsx)$/.test(e) && !p.includes('.backup')) acc.push(p)
  }
  return acc
}

const ALL = walk(SRC)
const text = Object.fromEntries(ALL.map(p => [p, readFileSync(p, 'utf8')]))
const exportRe = /^export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z0-9_]+)/gm

const rows = []
for (const file of ALL.filter(p => p.replaceAll('\\', '/').includes('lib/engines/'))) {
  exportRe.lastIndex = 0
  let m
  while ((m = exportRe.exec(text[file]))) {
    const name = m[1]
    const word = new RegExp(`\\b${name}\\b`, 'g')
    let ext = 0, test = 0, intern = 0
    for (const [p, t] of Object.entries(text)) {
      const n = (t.match(word) || []).length
      if (!n) continue
      if (p === file) intern += Math.max(0, n - 1) // descontar la propia declaración
      else if (p.includes('__tests__')) test += n
      else ext += n
    }
    const clase = ext > 0 ? 'VIVO' : test > 0 ? 'SOLO-TEST' : intern > 0 ? 'SOLO-INTERNO' : 'MUERTO'
    rows.push({ name, file: file.replace(/.*engines[\\/]/, ''), ext, test, intern, clase })
  }
}

const orden = { MUERTO: 0, 'SOLO-INTERNO': 1, 'SOLO-TEST': 2, VIVO: 3 }
rows.sort((a, b) => orden[a.clase] - orden[b.clase] || a.file.localeCompare(b.file))
for (const r of rows) {
  console.log(`${r.clase.padEnd(13)} ${r.file.padEnd(26)} ${r.name.padEnd(34)} ext=${r.ext} test=${r.test} int=${r.intern}`)
}
const resumen = rows.reduce((a, r) => (a[r.clase] = (a[r.clase] || 0) + 1, a), {})
console.log('\nRESUMEN:', JSON.stringify(resumen))
if (resumen.MUERTO) {
  console.error(`\n⚠ ${resumen.MUERTO} export(s) MUERTO — revisar y limpiar.`)
  process.exit(1)
}
