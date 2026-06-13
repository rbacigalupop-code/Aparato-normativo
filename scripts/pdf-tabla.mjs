// Extrae texto de un PDF reconstruyendo filas/columnas por coordenadas (x,y).
// Uso: node scripts/pdf-tabla.mjs <ruta.pdf> [pagInicio] [pagFin]
import fs from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const [, , ruta, pi = '1', pf] = process.argv
const data = new Uint8Array(fs.readFileSync(ruta))
const doc = await getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise
const desde = parseInt(pi), hasta = pf ? parseInt(pf) : doc.numPages

for (let p = desde; p <= hasta && p <= doc.numPages; p++) {
  const page = await doc.getPage(p)
  const { items } = await page.getTextContent()
  // Agrupar por fila: redondear y (transform[5]) con tolerancia
  const filas = new Map()
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue
    const x = it.transform[4], y = Math.round(it.transform[5])
    // buscar fila existente dentro de ±3px
    let key = [...filas.keys()].find(k => Math.abs(k - y) <= 3)
    if (key === undefined) { key = y; filas.set(key, []) }
    filas.get(key).push({ x, s: it.str })
  }
  const ordenadas = [...filas.entries()].sort((a, b) => b[0] - a[0]) // y desc = arriba→abajo
  console.log(`\n═══════ PÁGINA ${p} ═══════`)
  for (const [, celdas] of ordenadas) {
    const linea = celdas.sort((a, b) => a.x - b.x).map(c => c.s).join(' | ').replace(/\s+\|/g, ' |').trim()
    if (linea) console.log(linea)
  }
}
