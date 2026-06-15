// ─────────────────────────────────────────────────────────────────────────────
// extraer-zt-ditec.mjs — Extrae la TABLA ZT oficial DITEC/MINVU
// (REGIÓN | PROVINCIA | COMUNA | ZONA | LÍMITE{MERIDIANO | ALTITUD msnm})
// reconstruyendo columnas por coordenada x, y genera src/data/zonas_ditec.js.
//
// Uso:
//   node scripts/extraer-zt-ditec.mjs [ruta.pdf] [--debug] [--write]
//   (sin --write solo imprime resumen; con --write genera el módulo)
//
// La asignación de zona depende de ALTITUD (msnm) y a veces de MERIDIANO (long.).
// Muchas comunas son multi-zona por altitud (umbrales 1.100 y 3.000 msnm).
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const RUTA = process.argv.find(a => a.endsWith('.pdf'))
  || 'C:/Users/UCSC/Downloads/TABLA-ZT_REGIONES_PROVINCIAS-Y-COMUNAS.pdf'
const DEBUG = process.argv.includes('--debug')
const WRITE = process.argv.includes('--write')
const OUT = new URL('../src/data/zonas_ditec.js', import.meta.url)

// Límites de columna por x (calibrados con el encabezado del PDF)
const COL = { provincia: 205, comuna: 272, zona: 360, meridiano: 402, altitud: 466 }
const colDe = x =>
  x < COL.provincia ? 'region' :
  x < COL.comuna    ? 'provincia' :
  x < COL.zona      ? 'comuna' :
  x < COL.meridiano ? 'zona' :
  x < COL.altitud   ? 'meridiano' : 'altitud'

const norm = s => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

const REGIONES = [
  ['arica y parinacota', 'XV'], ['tarapaca', 'I'], ['antofagasta', 'II'],
  ['atacama', 'III'], ['coquimbo', 'IV'], ['valparaiso', 'V'],
  ['metropolitana', 'RM'], ["o'higgins", 'VI'], ['libertador', 'VI'],
  ['maule', 'VII'], ['nuble', 'XVI'], ['biobio', 'VIII'], ['bio bio', 'VIII'],
  ['araucania', 'IX'], ['los rios', 'XIV'], ['los lagos', 'X'],
  ['aysen', 'XI'], ['aisen', 'XI'], ['magallanes', 'XII'],
]
const regionCode = raw => {
  const n = norm(raw).replace(/^de(l)?\s+/, '')
  for (const [k, c] of REGIONES) if (n.includes(k)) return c
  return null
}

// "1.100 ≤ altitud < 3.000" → {altMin:1100, altMax:3000}; "< 3.000" → {altMax:3000};
// "≥ 3.000" → {altMin:3000}; "-"/"" → {}
function parseAlt(raw) {
  const s = String(raw || '').replace(/\./g, '').replace(/\s+/g, ' ').trim()
  if (!s || s === '-') return {}
  const nums = [...s.matchAll(/\d+/g)].map(m => +m[0])
  if (!nums.length) return {}
  const tieneInf = /≤/.test(s)
  const tieneSup = /[<]/.test(s)
  if (tieneInf && tieneSup && nums.length >= 2) return { altMin: nums[0], altMax: nums[1] }
  if (/[≥]|>/.test(s)) return { altMin: nums[0] }
  if (/[<]/.test(s)) return { altMax: nums[0] }
  return {}
}

const data = new Uint8Array(fs.readFileSync(RUTA))
const doc = await getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise

const filasRaw = [] // {region, provincia, comuna, zona, meridiano, altitud}
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p)
  const { items } = await page.getTextContent()
  const filas = new Map()
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue
    const x = it.transform[4], y = Math.round(it.transform[5])
    let key = [...filas.keys()].find(k => Math.abs(k - y) <= 3)
    if (key === undefined) { key = y; filas.set(key, []) }
    filas.get(key).push({ x, s: it.str })
  }
  for (const [, celdas] of [...filas.entries()].sort((a, b) => b[0] - a[0])) {
    const cols = { region: [], provincia: [], comuna: [], zona: [], meridiano: [], altitud: [] }
    for (const c of celdas.sort((a, b) => a.x - b.x)) cols[colDe(c.x)].push(c.s)
    const row = {}
    for (const k of Object.keys(cols)) row[k] = cols[k].join(' ').replace(/\s+/g, ' ').trim()
    if (!/^[A-I]$/.test(row.zona)) continue // descarta encabezados / filas envueltas
    filasRaw.push(row)
  }
}

// Agrupa por comuna (clave normalizada). Avisa colisiones de región.
const comunas = {} // normKey -> { region, provincia, nombre, reglas:[] }
const regionesNoMapeadas = new Set()
const colisiones = []
for (const r of filasRaw) {
  const code = regionCode(r.region)
  if (!code) regionesNoMapeadas.add(r.region)
  const k = norm(r.comuna)
  if (!k) continue
  if (!comunas[k]) comunas[k] = { region: code, provincia: r.provincia, nombre: r.comuna, reglas: [] }
  else if (comunas[k].region !== code) colisiones.push(`${r.comuna}: ${comunas[k].region} vs ${code}`)
  const regla = { zona: r.zona, ...parseAlt(r.altitud) }
  if (r.meridiano && r.meridiano !== '-') regla.meridiano = r.meridiano.replace(/\s+/g, ' ').trim()
  comunas[k].reglas.push(regla)
}

// ── Resumen / validación ──
const arr = Object.values(comunas)
const multiZona = arr.filter(c => new Set(c.reglas.map(x => x.zona)).size > 1)
const conAlt = arr.filter(c => c.reglas.some(x => x.altMin != null || x.altMax != null))
const conMer = arr.filter(c => c.reglas.some(x => x.meridiano))
const sinRegion = arr.filter(c => !c.region)
console.log('Comunas:', arr.length)
console.log('  multi-zona:', multiZona.length, '| con altitud:', conAlt.length, '| con meridiano:', conMer.length)
console.log('  sin región mapeada:', sinRegion.length)
if (regionesNoMapeadas.size) console.log('  ⚠ regiones no mapeadas:', [...regionesNoMapeadas])
if (colisiones.length) console.log('  ⚠ colisiones comuna/región:', colisiones)

if (DEBUG) {
  console.log('\n— Muestra multi-zona —')
  for (const c of multiZona.slice(0, 12)) {
    console.log(`${c.nombre} [${c.region}]:`, JSON.stringify(c.reglas))
  }
}

if (WRITE) {
  const ordenadas = Object.keys(comunas).sort()
  const cuerpo = ordenadas.map(k => {
    const c = comunas[k]
    const reglas = c.reglas.map(r => JSON.stringify(r)).join(', ')
    return `  ${JSON.stringify(k)}: { region: ${JSON.stringify(c.region)}, nombre: ${JSON.stringify(c.nombre)}, reglas: [${reglas}] },`
  }).join('\n')
  const out = `// ─────────────────────────────────────────────────────────────────────────────
// zonas_ditec.js — AUTO-GENERADO por scripts/extraer-zt-ditec.mjs.  NO EDITAR A MANO.
// Fuente: TABLA-ZT_REGIONES_PROVINCIAS-Y-COMUNAS (DITEC/MINVU, DS N°15).
//
// Mapa comuna → zona térmica oficial DS N°15 (A-I) según ALTITUD (msnm) y, en
// algunas comunas, MERIDIANO (longitud). Cada comuna tiene una o más \`reglas\`:
//   { zona, altMin?, altMax?, meridiano? }
//   · altMin/altMax en msnm definen la banda de altitud donde aplica la zona.
//   · meridiano es informativo (corte por longitud; el proyectista no suele tenerlo).
// Las comunas con >1 zona son multi-zona por cota: la zona depende de la altitud
// del predio. ${arr.length} comunas, ${multiZona.length} multi-zona.
// ─────────────────────────────────────────────────────────────────────────────
export const COMUNAS_ZT = {
${cuerpo}
}
`
  fs.writeFileSync(OUT, out)
  console.log('\n✔ escrito', OUT.pathname)
}
