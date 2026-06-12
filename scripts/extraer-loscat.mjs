// ═══════════════════════════════════════════════════════════════════════════════
// Extractor LOSCAT Ed.14 2026 → src/data/loscat.js
// ═══════════════════════════════════════════════════════════════════════════════
// Lee el PDF oficial (Res. Ex. N°1403, 20-abr-2026) y genera un índice de
// códigos oficiales con título y vigencia.
//
// PRINCIPIO DE EXTRACCIÓN HONESTA: el texto del PDF viene con columnas
// entrelazadas, así que cada campo se extrae solo cuando la asociación es
// inequívoca:
//   - codigo:   regex estricta sobre todo el documento (existencia = confiable)
//   - titulo:   solo desde líneas "COD Título..." con título ≥ 15 chars
//   - vigencia: solo cuando la página contiene UN único código (asociación
//               página↔ficha) o cuando está en la misma línea del código.
//               Si no, queda null — nunca se adivina.
//
// Uso: node scripts/extraer-loscat.mjs [ruta.pdf]
// ═══════════════════════════════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFParse } from 'pdf-parse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PDF_PATH = process.argv[2] || process.env.LOSCAT_PDF || 'C:/Users/UCSC/Downloads/LOSCAT_E14_MAYO_2026.pdf'
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'loscat.js')

// Código LOSCAT: 1.2.M.A25.1 · 1.1.M.B4.1.1 · 3.1.P.M.0.12 · 3.2.V.A.C.0.03 · 2.2.M.MF1.1
// Estructura: d.d.LETRA(s) + 1-3 segmentos alfanuméricos + cierre numérico
const RE_COD = /\b([0-9]\.[0-9]\.[A-Z]{1,2}(?:\.[A-Z0-9]{1,4}){1,3}\.[0-9]{1,2})\b/g
const RE_MES = /(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+(20[2-4][0-9])/g
const MESES = { ENERO:1, FEBRERO:2, MARZO:3, ABRIL:4, MAYO:5, JUNIO:6, JULIO:7, AGOSTO:8, SEPTIEMBRE:9, OCTUBRE:10, NOVIEMBRE:11, DICIEMBRE:12 }

// Familia por prefijo de código (estructura del listado)
function familiaDe(cod) {
  if (cod.startsWith('1.1.')) return 'techumbre'
  if (cod.startsWith('1.2.')) return 'muro'
  if (cod.startsWith('1.3.')) return 'techumbre'   // cubiertas planas
  if (cod.startsWith('1.4.')) return 'piso'
  if (cod.startsWith('2.')) return 'muro'          // series industrializadas
  if (cod.startsWith('3.1.P')) return 'puerta'
  if (cod.startsWith('3.2.V')) return 'ventana'
  return 'otro'
}

const main = async () => {
  console.log('Leyendo', PDF_PATH)
  const parser = new PDFParse({ data: fs.readFileSync(PDF_PATH) })
  const { text } = await parser.getText()

  // ── Segmentar por página (delimitador "-- N of M --" del extractor) ─────────
  const paginas = text.split(/--\s+\d+\s+of\s+\d+\s+--/)
  console.log('Páginas de texto:', paginas.length, '· caracteres:', text.length)

  const index = {}   // cod → { codigo, familia, titulo, vigencia, paginas:[n] }

  const touch = (cod) => {
    if (!index[cod]) index[cod] = { codigo: cod, familia: familiaDe(cod), titulo: null, vigencia: null, vigencia_fuente: null, paginas: [] }
    return index[cod]
  }

  paginas.forEach((pag, nPag) => {
    const codsPagina = new Set()
    const lineas = pag.split('\n')

    for (const linea of lineas) {
      const l = linea.trim()
      let m
      RE_COD.lastIndex = 0
      while ((m = RE_COD.exec(l)) !== null) {
        const cod = m[1]
        codsPagina.add(cod)
        const e = touch(cod)
        if (!e.paginas.includes(nPag)) e.paginas.push(nPag)

        // Título: texto que sigue al código en la misma línea (limpio, largo)
        const resto = l.slice(m.index + cod.length).replace(RE_MES, '').trim()
        if (resto.length >= 15 && !e.titulo && /[a-záéíóúñ]/i.test(resto)) {
          e.titulo = resto.replace(/\s{2,}/g, ' ').slice(0, 160)
        }

        // Vigencia en la MISMA línea del código → asociación directa
        RE_MES.lastIndex = 0
        const mv = RE_MES.exec(l)
        if (mv && !e.vigencia) {
          e.vigencia = `${mv[2]}-${String(MESES[mv[1]]).padStart(2, '0')}`
          e.vigencia_fuente = 'misma_linea'
        }
      }
    }

    // Vigencia por página: solo si la página tiene EXACTAMENTE UN código
    // (página = ficha de esa solución) y al menos una fecha MES AÑO.
    if (codsPagina.size === 1) {
      const cod = [...codsPagina][0]
      const e = index[cod]
      if (!e.vigencia) {
        RE_MES.lastIndex = 0
        const mv = RE_MES.exec(pag)
        if (mv) {
          e.vigencia = `${mv[2]}-${String(MESES[mv[1]]).padStart(2, '0')}`
          e.vigencia_fuente = 'pagina_ficha'
        }
      }
    }
  })

  const entradas = Object.values(index).sort((a, b) => a.codigo.localeCompare(b.codigo))
  const conTitulo = entradas.filter(e => e.titulo).length
  const conVigencia = entradas.filter(e => e.vigencia).length
  const porFamilia = {}
  entradas.forEach(e => porFamilia[e.familia] = (porFamilia[e.familia] || 0) + 1)

  console.log(`\nCódigos oficiales Ed.14: ${entradas.length}`)
  console.log(`  con título extraído:  ${conTitulo}`)
  console.log(`  con vigencia:         ${conVigencia}`)
  console.log('  por familia:', JSON.stringify(porFamilia))

  const out = `// ═══════════════════════════════════════════════════════════════════════════════
// LOSCAT — Listado Oficial de Soluciones Constructivas para Acondicionamiento
// Térmico del MINVU · EDICIÓN 14 (mayo 2026) · Res. Ex. N°1403 del 20/04/2026
// ═══════════════════════════════════════════════════════════════════════════════
//
// Auto-generado por scripts/extraer-loscat.mjs — NO EDITAR A MANO.
//
// Índice de códigos OFICIALES. Campos null = no extraíble con certeza desde el
// PDF (extracción honesta: nunca se adivina). vigencia formato 'YYYY-MM'.
//
// Total códigos: ${entradas.length} · con título: ${conTitulo} · con vigencia: ${conVigencia}
// ═══════════════════════════════════════════════════════════════════════════════

export const LOSCAT_META = {
  edicion: 14,
  resolucion: 'Res. Ex. N°1403 del 20/04/2026',
  publicacion: '2026-05',
  extraido: '${new Date().toISOString().slice(0, 10)}',
}

export const LOSCAT_INDEX = ${JSON.stringify(
    Object.fromEntries(entradas.map(e => [e.codigo, {
      codigo: e.codigo, familia: e.familia, titulo: e.titulo,
      vigencia: e.vigencia, vigencia_fuente: e.vigencia_fuente,
    }])), null, 1).replace(/\n/g, '\n')}

// Helper: ¿el código existe en el listado oficial vigente?
export const enLOSCAT = (cod) => !!LOSCAT_INDEX[cod]

// Helper: estado de vigencia → 'vigente' | 'por_vencer' (≤12 meses) | 'vencida' | null
export function vigenciaLOSCAT(cod, hoy = new Date()) {
  const e = LOSCAT_INDEX[cod]
  if (!e || !e.vigencia) return null
  const [y, m] = e.vigencia.split('-').map(Number)
  const fin = new Date(y, m, 0)                       // último día del mes de vigencia
  const meses = (fin - hoy) / (1000 * 60 * 60 * 24 * 30.44)
  if (meses < 0) return 'vencida'
  if (meses <= 12) return 'por_vencer'
  return 'vigente'
}
`
  fs.writeFileSync(OUTPUT_PATH, out)
  console.log('\nEscrito', OUTPUT_PATH)

  // Muestras de control
  console.log('\nMuestras:')
  for (const c of ['1.2.M.A25.1', '1.2.M.A26.3', '1.2.M.A27.1', '1.2.M.B16.1', '3.1.P.M.0.12']) {
    console.log(' ', c, '→', JSON.stringify(index[c] ? { t: index[c].titulo?.slice(0, 50), v: index[c].vigencia, vf: index[c].vigencia_fuente } : 'NO ESTÁ'))
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
