// ─────────────────────────────────────────────────────────────────────────────
// auditar-zt-ditec.mjs — Auditoría de fidelidad/cobertura de la extracción ZT.
// Re-extrae la tabla oficial y reporta CUALQUIER anomalía que pudiera producir
// una zonificación errada:
//   · filas de datos descartadas (deberían ser solo encabezados)
//   · formatos de ALTITUD/MERIDIANO no reconocidos (parse vacío sobre texto real)
//   · huecos/solapes en la cobertura de altitud de una comuna
//   · comunas del catálogo sin zona y comunas oficiales huérfanas
//   · divergencia entre esta re-extracción y el zonas_ditec.js commiteado
// Uso: node scripts/auditar-zt-ditec.mjs [ruta.pdf]
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { COMUNAS_ZT } from '../src/data/zonas_ditec.js'
import { COMUNAS_CHILE } from '../src/data/comunas_chile.js'
import { zonasOficialesDeComuna } from '../src/data/zonas_oficial.js'

const RUTA = process.argv.find(a => a.endsWith('.pdf'))
  || 'C:/Users/UCSC/Downloads/TABLA-ZT_REGIONES_PROVINCIAS-Y-COMUNAS.pdf'
const COL = { provincia: 205, comuna: 272, zona: 360, meridiano: 402, altitud: 466 }
const colDe = x => x < COL.provincia ? 'region' : x < COL.comuna ? 'provincia'
  : x < COL.zona ? 'comuna' : x < COL.meridiano ? 'zona' : x < COL.altitud ? 'meridiano' : 'altitud'
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[_\s]+/g, ' ').trim()
const STOP = new Set(['de', 'del'])  // igual que zonas_oficial.js (mantiene artículos)
const canon = s => norm(s).replace(/['']/g, '').split(' ').filter(w => w && !STOP.has(w)).join('')

function parseAlt(raw) {
  const s = String(raw || '').replace(/\./g, '').replace(/\s+/g, ' ').trim()
  if (!s || s === '-') return {}
  const nums = [...s.matchAll(/\d+/g)].map(m => +m[0])
  if (!nums.length) return {}
  const inf = /≤/.test(s), sup = /[<]/.test(s)
  if (inf && sup && nums.length >= 2) return { altMin: nums[0], altMax: nums[1] }
  if (/[≥]|>/.test(s)) return { altMin: nums[0] }
  if (/[<]/.test(s)) return { altMax: nums[0] }
  return {}
}

const data = new Uint8Array(fs.readFileSync(RUTA))
const doc = await getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise
const filas = [], skipped = []
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p)
  const { items } = await page.getTextContent()
  const rows = new Map()
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue
    const x = it.transform[4], y = Math.round(it.transform[5])
    let key = [...rows.keys()].find(k => Math.abs(k - y) <= 3)
    if (key === undefined) { key = y; rows.set(key, []) }
    rows.get(key).push({ x, s: it.str })
  }
  for (const [, celdas] of [...rows.entries()].sort((a, b) => b[0] - a[0])) {
    const cols = { region: [], provincia: [], comuna: [], zona: [], meridiano: [], altitud: [] }
    for (const c of celdas.sort((a, b) => a.x - b.x)) cols[colDe(c.x)].push(c.s)
    const row = {}; for (const k of Object.keys(cols)) row[k] = cols[k].join(' ').replace(/\s+/g, ' ').trim()
    if (/^[A-I]$/.test(row.zona)) filas.push({ ...row, page: p })
    else if (Object.values(row).some(v => v)) skipped.push(`p${p}: ${JSON.stringify(row)}`)
  }
}

console.log('═══ FIDELIDAD DE EXTRACCIÓN ═══')
console.log('Páginas:', doc.numPages, '| filas de datos (zona A-I):', filas.length, '| filas descartadas:', skipped.length)

// 1) Tokens de ALTITUD distintos y su parseo → flag de los no reconocidos
const altMap = new Map()
for (const f of filas) {
  if (!altMap.has(f.altitud)) altMap.set(f.altitud, parseAlt(f.altitud))
}
console.log('\n— Formatos de ALTITUD distintos (', altMap.size, ') → parseo —')
const altMal = []
for (const [raw, p] of altMap) {
  const vacio = Object.keys(p).length === 0
  if (vacio && raw && raw !== '-') altMal.push(raw)
  console.log(`  ${JSON.stringify(raw).padEnd(34)} → ${JSON.stringify(p)}`)
}
console.log(altMal.length ? `  ⚠ NO RECONOCIDOS: ${JSON.stringify(altMal)}` : '  ✓ todos los formatos no triviales se parsean')

// 2) Tokens de MERIDIANO distintos
const merSet = [...new Set(filas.map(f => f.meridiano).filter(m => m && m !== '-'))]
console.log('\n— Cortes por MERIDIANO distintos —')
for (const m of merSet) console.log('  ', JSON.stringify(m))

// 3) Filas descartadas (deben ser solo encabezados)
console.log('\n— Filas descartadas (confirmar que son encabezados) —')
for (const s of skipped) console.log('  ', s)

// 4) Cobertura de altitud por comuna: huecos / solapes
console.log('\n═══ COHERENCIA POR COMUNA ═══')
const huecos = [], solapes = []
for (const [k, v] of Object.entries(COMUNAS_ZT)) {
  const conAlt = v.reglas.filter(r => r.altMin != null || r.altMax != null)
  if (conAlt.length < 2) continue
  // construir intervalos [min,max) y revisar 0..6000 m
  const ivs = v.reglas.map(r => [r.altMin ?? 0, r.altMax ?? Infinity, r.zona, r.meridiano])
  for (let cota = 0; cota <= 6000; cota += 100) {
    const hit = ivs.filter(([a, b]) => cota >= a && cota < b)
    const zonas = new Set(hit.map(h => h[2]))
    const sinMer = hit.filter(h => !h[3])
    if (hit.length === 0) { huecos.push(`${v.nombre} @${cota}m sin zona`); break }
    if (zonas.size > 1 && sinMer.length > 1) { solapes.push(`${v.nombre} @${cota}m → ${[...zonas].join('/')}`); break }
  }
}
console.log('Comunas con HUECO de cobertura (cota sin zona):', huecos.length); huecos.slice(0, 20).forEach(h => console.log('  ⚠', h))
console.log('Comunas con SOLAPE no-meridiano (cota con >1 zona):', solapes.length); solapes.slice(0, 20).forEach(s => console.log('  ⚠', s))

// 5) Re-extracción vs commiteado
const reExtraido = {}
for (const f of filas) {
  const k = canon(f.comuna); if (!k) continue
  ;(reExtraido[k] ||= []).push(f.zona)
}
let divergen = 0
for (const [k, v] of Object.entries(COMUNAS_ZT)) {
  const a = [...new Set(v.reglas.map(r => r.zona))].sort().join('')
  const b = [...new Set(reExtraido[canon(k)] || [])].sort().join('')
  if (a !== b) { divergen++; if (divergen <= 10) console.log(`  ⚠ ${v.nombre}: commit ${a} vs re-extr ${b}`) }
}
console.log('\nRe-extracción vs zonas_ditec.js commiteado — comunas que difieren:', divergen)

// 6) Cobertura del catálogo
console.log('\n═══ COBERTURA DE COMUNAS ═══')
console.log('COMUNAS_ZT:', Object.keys(COMUNAS_ZT).length, '| COMUNAS_CHILE:', Object.keys(COMUNAS_CHILE).length)
const sinZona = Object.keys(COMUNAS_CHILE).filter(k => zonasOficialesDeComuna(k).length === 0)
console.log('Catálogo SIN zona oficial:', sinZona.length, sinZona)
const ztCanon = new Set(Object.keys(COMUNAS_ZT).map(canon))
const chCanon = new Set(Object.keys(COMUNAS_CHILE).map(canon))
console.log('En oficial pero NO en catálogo (huérfanas):', [...ztCanon].filter(k => !chCanon.has(k)))
console.log('En catálogo pero NO en oficial (revisar alias):', [...chCanon].filter(k => !ztCanon.has(k)))
