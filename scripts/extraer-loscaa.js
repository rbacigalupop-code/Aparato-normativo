// ═══════════════════════════════════════════════════════════════════════════════
// Extractor LOSCAA 2024 → JS estructurado
// ═══════════════════════════════════════════════════════════════════════════════
// Lee el PDF oficial del MINVU y genera src/data/loscaa.js con todas las
// soluciones constructivas de aislamiento acústico estructuradas.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require('fs')
const path = require('path')
const { PDFParse } = require('pdf-parse')

const PDF_PATH = process.env.LOSCAA_PDF || 'C:/Users/UCSC/Downloads/LISTADO-OFICIAL-VIGENTE-LOSCAA-2024.pdf'
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'loscaa.js')
const RAW_OUTPUT = 'C:/temp/pdfs/loscaa.txt'

// Patrón de código LOSCAA — muy flexible para capturar todas las variantes:
//   D.M.A.01.01    (Divisorio)
//   I.EP.H.01.02   (Interior)
//   E.V.Al.01.03   (Exterior con material multi-char)
//   ETP.01.01      (3 partes)
//   RM.O.01.01     (Recubrimientos)
const RE_CODIGO = /^([A-Z]{1,4}(?:\.[A-Za-z]{1,3}){1,3}\.\d{2}\.\d{2}(?:\.\d+)?)$/
// Códigos numéricos de anexos: 1-A1, 2-B1.1, 1-E2.1, etc.
const RE_CODIGO_NUM = /^(\d+-[A-Z]\d+(?:\.\d+)*)$/

// Material codes
const MATERIAL_MAP = {
  H: 'hormigon_armado',
  L: 'ladrillo',
  M: 'madera',
  A: 'acero',
  O: 'otros',
  Al: 'aluminio',
  P: 'pvc',
}

// Tipo de elemento
const ELEMENTO_MAP = {
  M: 'muro',
  EP: 'entrepiso',
  T: 'techumbre',
  V: 'ventana',
  P: 'puerta',
  TP: 'ducto_ventilacion',
}

// Categoría
const CATEGORIA_MAP = {
  D: 'divisorio_unidades',     // entre unidades
  I: 'interior_misma_unidad',  // dentro de una unidad
  E: 'exterior',               // fachada/exterior
}

/**
 * Parsea el código LOSCAA y extrae sus componentes
 */
function parsearCodigo(codigo) {
  const partes = codigo.split('.')
  if (partes.length < 4) return null

  const [categoria, elemento, material, ...resto] = partes
  return {
    codigo,
    categoria: CATEGORIA_MAP[categoria] || categoria,
    elemento: ELEMENTO_MAP[elemento] || elemento.toLowerCase(),
    material: MATERIAL_MAP[material] || material.toLowerCase(),
    numero: resto.join('.'),
  }
}

/**
 * Estrategia: Cada solución termina con un marcador "CÓDIGO:".
 * El contenido de la solución son las líneas DESDE el marcador anterior
 * (o inicio del documento) HASTA el marcador actual.
 * El código aparece justo antes del marcador "CÓDIGO:".
 */
function extraerBloques(texto) {
  const lineas = texto.split('\n').map(l => l.trim())
  const bloques = []

  // Encontrar todos los índices de marcadores "CÓDIGO:"
  const indicesCodigo = []
  for (let i = 0; i < lineas.length; i++) {
    if (lineas[i] === 'CÓDIGO:') {
      indicesCodigo.push(i)
    }
  }

  // Para cada marcador, el contenido va desde el marcador previo hasta éste
  for (let j = 0; j < indicesCodigo.length; j++) {
    const idxCodigo = indicesCodigo[j]
    // Inicio: marcador anterior + 1, o 0 si es el primero
    const idxInicio = j === 0 ? 0 : indicesCodigo[j - 1] + 1

    // Buscar el código en las 3 líneas justo antes del marcador
    let codigo = null
    let tipo = null
    for (let k = 1; k <= 3; k++) {
      const lineaAtras = lineas[idxCodigo - k]
      if (!lineaAtras) continue
      const match = lineaAtras.match(RE_CODIGO) || lineaAtras.match(RE_CODIGO_NUM)
      if (match) {
        codigo = match[1]
        // El tipo (GENÉRICO/DE MARCA) puede estar entre el código y CÓDIGO:
        for (let m = idxCodigo - k + 1; m < idxCodigo; m++) {
          if (lineas[m] === 'GENÉRICO' || lineas[m] === 'DE MARCA') {
            tipo = lineas[m]
            break
          }
        }
        break
      }
    }

    if (!codigo) continue

    // Contenido del bloque: desde el marcador anterior hasta éste (exclusivo)
    const contenido = lineas.slice(idxInicio, idxCodigo)
    bloques.push({
      codigo,
      tipo: tipo || 'DESCONOCIDO',
      contenido,
    })
  }

  return bloques
}

/**
 * Extrae el valor Rw o R'w del bloque (índice de reducción acústica).
 * - Rw: Índice de Reducción Acústica Ponderado (lab, NCh10140)
 * - R'w: Índice de Reducción Acústica Aparente Ponderado (in situ, NCh16283)
 * Ambos son aceptados por OGUC art. 4.1.6.
 */
function extraerRw(contenido) {
  const texto = contenido.join('\n')

  // Patrón: "Acústica Ponderado XX" (formato Rw o R'w en líneas siguientes)
  let match = texto.match(/Ac[uú]stica\s*(?:Aparente)?\s*Ponderado\s*\n?\s*(\d+)/i)
  if (match) return { rw: parseInt(match[1]), tipo: texto.includes('Aparente') ? 'Rprime_w' : 'Rw' }

  // Patrón alternativo: número solitario antes de "R'w" o "Rw"
  for (let i = 0; i < contenido.length; i++) {
    const l = contenido[i]
    // "48	Rw" o "46	R'w"
    const m = l.match(/^(\d+)\s+R'?w/)
    if (m) return { rw: parseInt(m[1]), tipo: l.includes("R'w") ? 'Rprime_w' : 'Rw' }
  }

  return { rw: null, tipo: null }
}

/**
 * Extrae Rw+C, Rw+Ctr (o R'w+C, R'w+Ctr)
 */
function extraerRwCorrecciones(contenido) {
  const lineas = contenido
  let rwC = null, rwCtr = null

  for (let i = 0; i < lineas.length; i++) {
    // "Rw + C" o "R'w + C" (no Ctr)
    if (/R'?w\s*\+\s*C\b/.test(lineas[i]) && !lineas[i].includes('Ctr')) {
      const prev = lineas[i - 1]?.trim()
      if (/^\d+$/.test(prev)) rwC = parseInt(prev)
    }
    // "Rw + Ctr" o "R'w + Ctr"
    if (/R'?w\s*\+\s*Ctr/.test(lineas[i])) {
      const prev = lineas[i - 1]?.trim()
      if (/^\d+$/.test(prev)) rwCtr = parseInt(prev)
    }
  }

  return { rwC, rwCtr }
}

/**
 * Extrae masa superficial total
 */
function extraerMasa(contenido) {
  const texto = contenido.join('\n')
  const match = texto.match(/Masa superficial total:\s*\[kg\/m²\]\s*([\d,\.]+)/)
  if (match) return parseFloat(match[1].replace(',', '.'))
  return null
}

/**
 * Extrae espesor total
 */
function extraerEspesor(contenido) {
  const texto = contenido.join('\n')
  // Espesor en cm
  const match = texto.match(/Espesor total:\s*([\d,\.]+)\s*\[cm\]/)
  if (match) return parseFloat(match[1].replace(',', '.')) * 10 // convertir a mm
  return null
}

/**
 * Extrae descripción de la solución.
 * La descripción real aparece justo antes de "VIGENTE HASTA:" en el bloque,
 * o en la línea que describe la estructura.
 */
function extraerDescripcion(contenido, codigo) {
  // Estrategia 1: buscar línea antes de "VIGENTE HASTA:"
  for (let i = 0; i < contenido.length; i++) {
    if (contenido[i].includes('VIGENTE HASTA')) {
      // La línea anterior suele ser la descripción real
      const prev = contenido[i - 1]?.trim()
      if (prev && prev.length > 10 && !prev.startsWith('Volumen') && !prev.includes('Superficie')) {
        return prev.slice(0, 200)
      }
    }
  }

  // Estrategia 2: línea que comienza con palabra estructural típica
  const estructuralWords = /^(Muro|Tabique|Losa|Entrepiso|Techumbre|Cubierta|Panel|Ventana|Puerta|Cielo|Piso)\b/i
  for (const linea of contenido) {
    const t = linea.trim()
    if (estructuralWords.test(t) && t.length > 15) {
      return t.slice(0, 200)
    }
  }

  // Estrategia 3: línea con "Estructura: ..."
  for (const linea of contenido) {
    if (linea.toLowerCase().includes('estructura:')) {
      const match = linea.match(/estructura:\s*([^.]+)/i)
      if (match) return match[1].trim().slice(0, 200)
    }
  }

  return ''
}

/**
 * Extrae información de estructura (HA, albañilería, etc.) del bloque
 */
function extraerEstructura(contenido) {
  const texto = contenido.join('\n')

  const matchHA = texto.match(/horm?ig[oó]n\s+armado.*?espesor\s+(\d+)\s*\[mm\]/i) ||
                  texto.match(/H\.A\.\s*e\s*=\s*(\d+)\s*mm/i)
  if (matchHA) return { tipo: 'hormigon_armado', espesor_mm: parseInt(matchHA[1]) }

  const matchLad = texto.match(/ladrillo[s]?\s+cer[aá]mico[s]?.*?(?:de|tipo)?\s*(Santiago\w*\s*\d+|Princesa\d?|Titán\w*)/i)
  if (matchLad) return { tipo: 'ladrillo', subtipo: matchLad[1].trim() }

  const matchBloque = texto.match(/bloque[s]?\s+(?:de\s+)?horm?ig[oó]n.*?(\d+\s*x\s*\d+\s*x\s*\d+)/i)
  if (matchBloque) return { tipo: 'bloque_hormigon', dim: matchBloque[1] }

  const matchMad = texto.match(/(?:entramado|tabique).*?madera.*?(\d+x\d+)/i)
  if (matchMad) return { tipo: 'madera', perfil: matchMad[1] }

  const matchAcero = texto.match(/(?:estructura|tabique).*?(?:metálic[ao]|acero|galvaniz)/i)
  if (matchAcero) return { tipo: 'acero_galvanizado' }

  return { tipo: 'otro' }
}

/**
 * Procesa un bloque y extrae los datos estructurados
 */
function procesarBloque(bloque) {
  const codigoParsed = parsearCodigo(bloque.codigo) || { codigo: bloque.codigo }
  const rwData = extraerRw(bloque.contenido)
  const correcciones = extraerRwCorrecciones(bloque.contenido)
  const masa = extraerMasa(bloque.contenido)
  const espesor = extraerEspesor(bloque.contenido)
  const descripcion = extraerDescripcion(bloque.contenido, bloque.codigo)
  const estructura = extraerEstructura(bloque.contenido)

  return {
    codigo: bloque.codigo,
    tipo: bloque.tipo, // GENÉRICO o DE MARCA
    ...codigoParsed,
    descripcion,
    espesor_mm: espesor,
    masa_kg_m2: masa,
    rw: rwData.rw,
    rw_tipo: rwData.tipo, // 'Rw' o 'Rprime_w'
    rw_C: correcciones.rwC,
    rw_Ctr: correcciones.rwCtr,
    estructura,
  }
}

/**
 * Genera el archivo JS de salida
 */
function generarJS(soluciones) {
  // Construir objeto por código
  const obj = {}
  for (const s of soluciones) {
    obj[s.codigo] = s
  }

  // Header
  const header = `// ═══════════════════════════════════════════════════════════════════════════════
// LOSCAA — Listado Oficial de Soluciones Constructivas para Acondicionamiento Acústico
// MINVU - DITEC - ED13 2024 - Aprobado por Res. Ex. Nº786 (V. y U.) del 31/05/2024
// ═══════════════════════════════════════════════════════════════════════════════
//
// Auto-generado por scripts/extraer-loscaa.js
// NO EDITAR A MANO. Si necesitas modificar, edita el script y re-ejecuta.
//
// Total soluciones: ${soluciones.length}
// ═══════════════════════════════════════════════════════════════════════════════

export const LOSCAA = ${JSON.stringify(obj, null, 2)}

export const LOSCAA_TOTAL = ${soluciones.length}
`

  return header
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('LOSCAA Extractor')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('PDF:    ', PDF_PATH)
  console.log('Output: ', OUTPUT_PATH)
  console.log('')

  // Leer texto del PDF (o usar caché si existe)
  let texto
  if (fs.existsSync(RAW_OUTPUT)) {
    console.log('✓ Usando texto en caché:', RAW_OUTPUT)
    texto = fs.readFileSync(RAW_OUTPUT, 'utf-8')
  } else {
    console.log('→ Extrayendo texto del PDF...')
    const buffer = fs.readFileSync(PDF_PATH)
    const parser = new PDFParse({ data: buffer })
    const data = await parser.getText()
    texto = data.text
    fs.writeFileSync(RAW_OUTPUT, texto)
    console.log(`✓ Texto extraído: ${data.total} páginas, ${texto.length} chars`)
  }

  // Extraer bloques
  console.log('→ Extrayendo bloques...')
  const bloques = extraerBloques(texto)
  console.log(`✓ ${bloques.length} bloques encontrados`)

  // Procesar cada bloque
  console.log('→ Procesando bloques...')
  const soluciones = bloques.map(procesarBloque)

  // Estadísticas
  const conRw = soluciones.filter(s => s.rw !== null).length
  const conMasa = soluciones.filter(s => s.masa_kg_m2 !== null).length
  const conEspesor = soluciones.filter(s => s.espesor_mm !== null).length

  console.log('')
  console.log('═══ Estadísticas ═══')
  console.log(`  Total soluciones:    ${soluciones.length}`)
  console.log(`  Con Rw extraído:     ${conRw} (${((conRw / soluciones.length) * 100).toFixed(1)}%)`)
  console.log(`  Con masa extraída:   ${conMasa} (${((conMasa / soluciones.length) * 100).toFixed(1)}%)`)
  console.log(`  Con espesor:         ${conEspesor} (${((conEspesor / soluciones.length) * 100).toFixed(1)}%)`)

  // Distribución por categoría
  const porCategoria = {}
  for (const s of soluciones) {
    const cat = s.categoria || 'sin_categoria'
    porCategoria[cat] = (porCategoria[cat] || 0) + 1
  }
  console.log('')
  console.log('═══ Distribución por categoría ═══')
  Object.entries(porCategoria).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`)
  })

  // Distribución por material
  const porMaterial = {}
  for (const s of soluciones) {
    const mat = s.material || 'sin_material'
    porMaterial[mat] = (porMaterial[mat] || 0) + 1
  }
  console.log('')
  console.log('═══ Distribución por material ═══')
  Object.entries(porMaterial).forEach(([mat, count]) => {
    console.log(`  ${mat}: ${count}`)
  })

  // Generar JS
  console.log('')
  console.log('→ Generando archivo JS...')
  const js = generarJS(soluciones)
  fs.writeFileSync(OUTPUT_PATH, js)
  console.log(`✓ Archivo generado: ${OUTPUT_PATH}`)

  // Mostrar muestra
  console.log('')
  console.log('═══ Muestra (5 primeras soluciones) ═══')
  soluciones.slice(0, 5).forEach(s => {
    console.log(`  ${s.codigo}: Rw=${s.rw || '—'}dB, masa=${s.masa_kg_m2 || '—'}kg/m², esp=${s.espesor_mm || '—'}mm`)
    console.log(`    └─ ${s.descripcion?.slice(0, 80) || '(sin descripción)'}`)
  })

  console.log('')
  console.log('✓ Extracción LOSCAA completa.')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
