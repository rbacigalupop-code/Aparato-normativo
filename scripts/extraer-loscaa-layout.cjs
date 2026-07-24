// ═══════════════════════════════════════════════════════════════════════════════
// Extractor COMPLETO del LOSCAA usando `pdftotext -layout`
// ═══════════════════════════════════════════════════════════════════════════════
// Reemplaza la heurística sobre el volcado desordenado. Con -layout, poppler
// preserva la alineación etiqueta↔valor ("Rw = 47 [dB]"), así que el parseo es
// directo y no necesita adivinar.
//
// Distingue DOS tipos de ficha, que NO deben mezclarse:
//   · ABSOLUTA  → Rw / Ln,w del elemento completo (muros, entrepisos, ventanas…)
//   · MEJORA    → ΔRw / ΔLw que un revestimiento APORTA a un elemento base
//                 (familias RM.O revestimiento de muro y RP.O de piso). La propia
//                 ficha dice: "puede sumarse al de otros elementos de base
//                 similares para determinar el desempeño del conjunto".
//     Confundir un ΔLw=10 con un Ln,w=10 sería un error grave: uno es una mejora
//     de 10 dB, el otro un nivel de impacto excelente inalcanzable.
//
//   node scripts/extraer-loscaa-layout.cjs           → tabla
//   node scripts/extraer-loscaa-layout.cjs --emit    → escribe el módulo de datos
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require('fs')
const { execSync } = require('child_process')

const PDF = process.env.LOSCAA_PDF || 'C:/Users/UCSC/Downloads/LISTADO-OFICIAL-VIGENTE-LOSCAA-2024.pdf'

const ELEMENTO_MAP = { M: 'muro', EP: 'entrepiso', T: 'techumbre', V: 'ventana', P: 'puerta', TP: 'ducto_ventilacion', O: 'otros' }
const MATERIAL_MAP = { H: 'hormigon_armado', L: 'ladrillo', M: 'madera', A: 'acero', O: 'otros', Al: 'aluminio', P: 'pvc' }
const CATEGORIA_MAP = {
  D: 'divisorio_unidades', I: 'interior_misma_unidad', E: 'exterior',
  RM: 'revestimiento_muro', RP: 'revestimiento_piso',
}

const RE_COD = /\b((?:RM|RP|[DIE])\.[A-Za-z]{1,3}(?:\.[A-Za-z]{1,3})?\.\d{2}\.\d{2})\b/
const n = (s) => (s == null ? null : parseFloat(String(s).replace(',', '.')))

function parsePagina(txt) {
  // La ficha declara su código bajo "CÓDIGO:"; los índices no traen ese rótulo.
  if (!/C[ÓO]DIGO:/i.test(txt)) return null
  const m = txt.match(new RegExp(`^\\s*${RE_COD.source}\\s*(.*)$`, 'm'))
  if (!m) return null
  const codigo = m[1]
  const titulo = (m[2] || '').trim()

  const partes = codigo.split('.')
  const cat = partes[0]
  const elem = partes.length >= 5 ? partes[1] : partes[1]
  const mat = partes.length >= 5 ? partes[2] : partes[1]

  const esMejora = /Mejora Aislamiento/i.test(txt)
  // En fichas de terreno los índices llevan apóstrofo (R'w) y en laboratorio no.
  const terreno = /R'w|Ln',w/.test(txt)

  const g = (re) => { const x = txt.match(re); return x ? n(x[1]) : null }

  const out = {
    codigo, titulo,
    categoria: CATEGORIA_MAP[cat] || null,
    elemento: ELEMENTO_MAP[elem] || null,
    material: MATERIAL_MAP[mat] || null,
    tipo: /GEN[ÉE]RICO/i.test(txt) ? 'GENÉRICO' : (/DE MARCA/i.test(txt) ? 'DE MARCA' : null),
    espesor_cm: g(/Espesor total:\s*(-?[\d,\.]+)\s*\[cm\]/),
    masa_kg_m2: g(/Masa superficial total:\s*(-?[\d,\.]+)\s*\[kg/),
    vigencia: (txt.match(/VIGENTE HASTA:\s*([^\n]+?)\s*$/m) || [])[1] || null,
    medicion: terreno ? 'terreno' : 'laboratorio',
    es_mejora: esMejora,
  }

  if (esMejora) {
    // ΔRw / ΔLw — aportes que se SUMAN a un elemento base
    out.delta_rw     = g(/Rw\s*=\s*(-?\d+)\s*\[dB\]/)
    out.delta_rw_C   = g(/Rw \+ C\s*=\s*(-?\d+)/)
    out.delta_rw_Ctr = g(/Rw \+ Ctr\s*=\s*(-?\d+)/)
    out.delta_lw     = g(/\bL,w\s*=\s*(-?\d+)\s*\[dB\]/)
    out.delta_lw_Ci  = g(/\bL,w\+Ci\s*=\s*(-?\d+)/)
  } else {
    out.rw      = g(/R'?w\s*=\s*(-?\d+)\s*\[dB\]/)
    out.rw_C    = g(/R'?w \+ C\s*=\s*(-?\d+)/)
    out.rw_Ctr  = g(/R'?w \+ Ctr\s*=\s*(-?\d+)/)
    out.lnw     = g(/Ln'?,w\s*=\s*(-?\d+)\s*\[dB\]/)
    out.lnw_Ci  = g(/Ln'?,w\+Ci\s*=\s*(-?\d+)/)
    out.rw_tipo  = terreno ? "R'w" : 'Rw'
    out.lnw_tipo = out.lnw != null ? (terreno ? "Ln',w" : 'Ln,w') : null
  }

  const d = txt.match(/DETALLLES?\s*\n([\s\S]*?)(?:\n\s*Leyenda|\n\s*f\s|\Z)/)
  out.detalle = d ? d[1].split('\n').map(s => s.trim()).filter(Boolean).join(' ').replace(/\s{2,}/g, ' ').slice(0, 600) : null
  return out
}

const texto = execSync(`pdftotext -layout "${PDF}" -`, { encoding: 'binary', maxBuffer: 5e8 })
const fichas = []
texto.split('\f').forEach((pag, i) => {
  const f = parsePagina(pag)
  if (f) fichas.push({ pagina_pdf: i + 1, ...f })
})

// dedup: quedarse con la primera aparición de cada código
const porCod = {}
for (const f of fichas) if (!porCod[f.codigo]) porCod[f.codigo] = f

if (process.argv.includes('--emit')) {
  const head = `// ═══════════════════════════════════════════════════════════════════════════════
// LOSCAA — Listado Oficial de Soluciones Constructivas de Aislamiento Acústico
// MINVU · DITEC · ED13 2024  —  extracción COMPLETA (${Object.keys(porCod).length} fichas)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Auto-generado por scripts/extraer-loscaa-layout.cjs — NO EDITAR A MANO.
// Fuente: pdftotext -layout (poppler), que preserva la alineación etiqueta↔valor.
//
// DOS TIPOS DE FICHA, que no deben mezclarse:
//   es_mejora=false → valores ABSOLUTOS del elemento (rw, lnw)
//   es_mejora=true  → APORTE de un revestimiento (delta_rw, delta_lw) que la
//                     propia ficha autoriza a SUMAR a un elemento base similar.
//                     Familias RM.O (revestimiento de muro) y RP.O (de piso).
//   Un delta_lw=10 es "mejora 10 dB", NO un nivel de impacto de 10 dB.
//
// rw_tipo/medicion: R'w y Ln',w son medición aparente en TERRENO
// (NCh2785/NCh16283); Rw y Ln,w son ensayo de LABORATORIO (NCh2786/ISO10140).
// No son intercambiables.
// ═══════════════════════════════════════════════════════════════════════════════

export const LOSCAA_FULL = ${JSON.stringify(porCod, null, 2)}
`
  fs.writeFileSync('src/data/loscaa_full.js', head)
  console.log(`escrito src/data/loscaa_full.js · ${Object.keys(porCod).length} fichas`)
} else {
  const abs = Object.values(porCod).filter(f => !f.es_mejora)
  const mej = Object.values(porCod).filter(f => f.es_mejora)
  console.log(`fichas: ${Object.keys(porCod).length}  (absolutas ${abs.length} · mejoras ${mej.length})\n`)
  console.log('cód             elem        tipo      Rw/ΔRw  Ln,w/ΔLw  título')
  for (const f of Object.values(porCod)) {
    console.log(
      f.codigo.padEnd(15),
      String(f.elemento).padEnd(11),
      (f.es_mejora ? 'MEJORA' : 'abs').padEnd(9),
      String(f.es_mejora ? f.delta_rw : f.rw).padStart(6),
      String(f.es_mejora ? f.delta_lw : f.lnw).padStart(9),
      ' ', (f.titulo || '').slice(0, 34))
  }
}
