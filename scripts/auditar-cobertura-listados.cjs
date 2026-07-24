// ═══════════════════════════════════════════════════════════════════════════════
// Auditoría de COBERTURA de los listados oficiales
// ═══════════════════════════════════════════════════════════════════════════════
// Compara los códigos presentes en el PDF oficial contra los que tenemos
// cargados en src/data/. Nace del caso LOSCAA: el extractor descartó en SILENCIO
// una familia entera (22 entrepisos) y nadie se enteró por meses.
//
// Usa `pdftotext -layout` (poppler), que preserva la alineación del PDF.
//
//   node scripts/auditar-cobertura-listados.cjs
//
// Sale con código 1 si falta algún código → usable en CI al subir una edición.
// ═══════════════════════════════════════════════════════════════════════════════

const { execSync } = require('child_process')
const path = require('path')

const DL = process.env.PDF_DIR || 'C:/Users/UCSC/Downloads'

const LISTADOS = [
  {
    nombre: 'LOSCAT Ed.14 2026',
    pdf: path.join(DL, 'LOSCAT_E14_MAYO_2026.pdf'),
    // 1.1.G.M1.2 · 1.4.M.B4.1.1 · 3.2.V.A.C.0.03
    // Exige terminar en .<dígitos> para no contar los ENCABEZADOS de familia
    // ("1.2.G.B.A  Muro de Hormigón Armado…"), que no son códigos de solución.
    re: /\b\d\.\d\.[A-Z]\.[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*\.\d+\b/g,
    cargar: async () => Object.keys((await import('../src/data/loscat.js')).LOSCAT_INDEX),
  },
  {
    nombre: 'LOFC Ed.17 2025',
    pdf: path.join(DL, 'Listado-Oficial-de-Comportamiento-al-Fuego-de-Elementos-y-Componentes-de-la-Construccion_-ED17-2025.pdf'),
    // A.2.3.60.131 · C.2.1.90.04 · G.2.1.30.08
    re: /\b[A-G]\.\d\.\d\.\d+\.\d+\b/g,
    cargar: async () => Object.keys((await import('../src/data/lofc.js')).LOFC),
  },
  {
    nombre: 'LOSCAA ED13 2024',
    pdf: path.join(DL, 'LISTADO-OFICIAL-VIGENTE-LOSCAA-2024.pdf'),
    // D.M.H.01.01 · E.V.Al.01.03 · D.EP.M.01.01
    re: /\b[A-Z]{1,3}\.[A-Za-z]{1,3}(?:\.[A-Za-z]{1,3})?\.\d{2}\.\d{2}\b/g,
    cargar: async () => {
      const base = Object.keys((await import('../src/data/loscaa.js')).LOSCAA)
      const ep = Object.keys((await import('../src/data/loscaa_entrepisos.js')).LOSCAA_ENTREPISOS)
      return [...base, ...ep]
    },
  },
]

function codigosDelPdf(pdf, re) {
  const txt = execSync(`pdftotext -layout "${pdf}" -`, { encoding: 'binary', maxBuffer: 5e8 })
  return new Set(txt.match(re) || [])
}

;(async () => {
  let fallo = false
  for (const L of LISTADOS) {
    console.log(`\n${'═'.repeat(70)}\n${L.nombre}\n${'═'.repeat(70)}`)
    let enPdf
    try { enPdf = codigosDelPdf(L.pdf, L.re) }
    catch (e) { console.log('  ⚠ no se pudo leer el PDF:', path.basename(L.pdf)); continue }

    const cargados = new Set(await L.cargar())
    const faltan = [...enPdf].filter(c => !cargados.has(c)).sort()
    const sobran = [...cargados].filter(c => !enPdf.has(c)).sort()

    console.log(`  en el PDF : ${enPdf.size}`)
    console.log(`  cargados  : ${cargados.size}`)
    console.log(`  FALTAN    : ${faltan.length}`)
    console.log(`  sobran    : ${sobran.length}  (cargados que el PDF ya no lista)`)

    if (faltan.length) {
      fallo = true
      // agrupar por familia para ver si falta una rama entera (el caso entrepisos)
      const fam = {}
      for (const c of faltan) {
        const k = c.split('.').slice(0, 2).join('.')
        ;(fam[k] = fam[k] || []).push(c)
      }
      console.log('  ── faltantes por familia ──')
      for (const [k, v] of Object.entries(fam).sort((a, b) => b[1].length - a[1].length))
        console.log(`     ${k.padEnd(10)} ${String(v.length).padStart(4)}   ej: ${v.slice(0, 3).join(', ')}`)
    }
    if (sobran.length && sobran.length <= 15) console.log('  sobran:', sobran.join(', '))
  }
  process.exit(fallo ? 1 : 0)
})()
