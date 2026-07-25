// ═══════════════════════════════════════════════════════════════════════════════
// Extractor LOFC Ed.17 2025 → JS estructurado
// ═══════════════════════════════════════════════════════════════════════════════
// Lee el PDF oficial del MINVU-DITEC y genera src/data/lofc.js con todas
// las soluciones de comportamiento al fuego estructuradas.
//
// LOFC Edición 17 (Enero 2025) — Listado Oficial de Comportamiento al Fuego
// de Elementos y Componentes de la Construcción.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require('fs')
const path = require('path')
const { PDFParse } = require('pdf-parse')

const PDF_PATH = process.env.LOFC_PDF || 'C:/Users/UCSC/Downloads/Listado-Oficial-de-Comportamiento-al-Fuego-de-Elementos-y-Componentes-de-la-Construccion_-ED17-2025.pdf'
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'lofc.js')
const RAW_OUTPUT = 'C:/temp/pdfs/lofc.txt'

// ─── Patrones de códigos LOFC ─────────────────────────────────────────────────
// A.2.3.15.137 = Sección A.2.3 (Paneles), F-15, item 137
// A.2.2.30.01  = Sección A.2.2 (Paramentos de ladrillos), F-30, item 01
// B.1.2        = Sección B.1.2 (header de sección, no item)
const RE_CODIGO_ITEM = /^([A-Z])\.(\d+)\.(\d+)\.(\d+)\.(\d+)\s+(.+?)$/

// Tablas macizos: A.1.1, A.1.2, A.1.3, A.1.4, A.1.5
const RE_CODIGO_TABLA = /^([A-Z])\.(\d+)\.(\d+)\s+(.+?)(\s+\d+)?$/

// ─── Categorías por sección ───────────────────────────────────────────────────
const SECCION_DESC = {
  'A': 'Muros, paneles, tabiques y entrepisos',
  'A.1': 'Elementos macizos',
  'A.1.1': 'Muro de albañilería de adobe',
  'A.1.2': 'Muro de albañilería de piedra',
  'A.1.3': 'Muro de hormigón (armado y sin armadura)',
  'A.1.4': 'Bloques de hormigón',
  'A.1.5': 'Paneles de madera macizos',
  'A.2': 'Albañilería y paneles ligeros',
  'A.2.2': 'Paramentos de ladrillos',
  'A.2.3': 'Paneles, tabiques y entramados ligeros',
  'B': 'Pilares y elementos estructurales',
  'B.1': 'Pilares - elementos estructurales verticales',
  'B.1.1': 'Pilares aislados de madera',
  'B.1.2': 'Elementos estructurales verticales de acero con revestimiento de placas',
  'B.1.3': 'Acero con revestimiento de hormigón o mortero',
  'B.2': 'Vigas - elementos estructurales horizontales',
  'C': 'Puertas y otros elementos',
  'C.2.1': 'Puertas',
}

// Tipo de elemento por sección
function tipoElemento(seccion, elementoText) {
  const sec = seccion.split('.').slice(0, 3).join('.')
  const elem = (elementoText || '').toLowerCase()
  if (sec === 'A.1.1' || sec === 'A.1.2' || sec === 'A.1.3') return 'muro_macizo'
  if (sec === 'A.1.4') return 'bloque'
  if (sec === 'A.1.5') return 'panel_madera_macizo'
  if (sec === 'A.2.2') return 'muro_albanileria'
  if (sec === 'A.2.3') {
    if (elem.includes('tabique')) return 'tabique'
    if (elem.includes('panel')) return 'panel'
    return 'tabique_o_panel'
  }
  if (sec === 'B.1.1' || sec === 'B.1.2' || sec === 'B.1.3') return 'pilar'
  if (sec === 'B.2') return 'viga'
  if (sec === 'C.2.1') return 'puerta'
  return 'otro'
}

/**
 * Extrae bloques de item LOFC desde el texto.
 * Cada item empieza con "A.X.Y.Z.NN Descripción" en una línea.
 * El bloque continúa hasta el próximo código o sección.
 */
function extraerItems(texto) {
  const lineas = texto.split('\n').map(l => l.trim())
  const items = []
  let bloqueActual = null

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i]
    const match = linea.match(RE_CODIGO_ITEM)
    if (match) {
      // Guardar bloque anterior
      if (bloqueActual) items.push(bloqueActual)
      const [, prefijo, n1, n2, fClass, item, rest] = match
      bloqueActual = {
        codigo: `${prefijo}.${n1}.${n2}.${fClass}.${item}`,
        seccion: `${prefijo}.${n1}.${n2}`,
        fClass: parseInt(fClass),
        item: parseInt(item),
        primeraLinea: rest,
        contenido: [linea],
        lineaInicio: i,
      }
      continue
    }
    // Continúa el bloque actual
    if (bloqueActual) {
      bloqueActual.contenido.push(linea)
    }
  }
  if (bloqueActual) items.push(bloqueActual)
  return items
}

/**
 * Extrae descripción/producto del item LOFC.
 * Patrón típico: "{codigo} Paneles F-XX {descripción del producto}"
 */
function extraerDescripcion(item) {
  const texto = item.contenido.slice(0, 5).join(' ')
  // Quitar el código y la categoría "Paneles F-XX"
  const sinCodigo = texto.replace(new RegExp('^' + item.codigo.replace(/\./g, '\\.') + '\\s+', ''), '')
  // Quitar el patrón "Paneles F-XX" o "Paramentos F-XX"
  const match = sinCodigo.match(/^(?:Paneles|Paramentos|Bloques|Entrepisos|Cielos|Techumbres)\s+F\s*-?\s*\d+\s+(.+?)(?:\s+\(ED\d+-\d+\)|$)/)
  if (match) return match[1].trim().slice(0, 300)
  // Fallback
  return sinCodigo.split('(ED')[0].trim().slice(0, 300)
}

/**
 * Detecta espesor total en mm desde la descripción.
 * Ej: "e=140 mm", "e= 90 mm", "espesor 110 mm"
 */
function extraerEspesor(texto) {
  const matches = [
    texto.match(/e\s*=\s*(\d+(?:[.,]\d+)?)\s*mm/i),
    texto.match(/espesor\s+(?:total\s+)?(\d+(?:[.,]\d+)?)\s*mm/i),
    texto.match(/(\d+(?:[.,]\d+)?)\s*mm\s*de\s+espesor/i),
  ]
  for (const m of matches) {
    if (m) return parseFloat(m[1].replace(',', '.'))
  }
  return null
}

/**
 * Detecta materiales clave en la descripción.
 * Esto será útil para el matching con LOSCAT después.
 */
function extraerMateriales(texto) {
  const mats = []
  const lt = texto.toLowerCase()
  // Estructura
  if (/horm[ií]gon\s+armado|h\.a\.|h\.\s*a\./i.test(texto)) mats.push('hormigon_armado')
  if (/albani[lñ]er[ií]a|ladrillo/i.test(texto)) mats.push('ladrillo')
  if (/estructura.*?madera|entramado.*?madera|2x\d/i.test(texto)) mats.push('madera')
  if (/estructura.*?acero|perfiles\s+(?:de\s+)?acero|metalcon|metalframe|galvanizado/i.test(texto)) mats.push('acero')
  if (/clt|contralaminada/i.test(texto)) mats.push('clt')
  if (/sip|panel\s+sip/i.test(texto)) mats.push('sip')
  if (/bloque/i.test(texto)) mats.push('bloque')
  // Revestimientos
  if (/volcanita|yeso\s+cart[oó]n|gyplac/i.test(texto)) mats.push('yeso_carton')
  if (/volcanboard|fibrocemento|simplisima|permanit|cedral/i.test(texto)) mats.push('fibrocemento')
  if (/aislan|lana\s+(?:mineral|vidrio|roca)/i.test(texto)) mats.push('lana_mineral')
  if (/eps|expandido/i.test(texto)) mats.push('eps')
  if (/xps|extruido/i.test(texto)) mats.push('xps')
  if (/pu\s+proyectado|poliuretano/i.test(texto)) mats.push('pu')
  return mats
}

/**
 * Procesa un item y extrae los datos estructurados.
 */
function procesarItem(item) {
  const descripcion = extraerDescripcion(item)
  const espesor = extraerEspesor(item.contenido.join(' '))
  const materiales = extraerMateriales(item.contenido.join(' '))
  const elementoText = item.primeraLinea.split(/\s+/).slice(0, 3).join(' ')

  return {
    codigo: item.codigo,
    seccion: item.seccion,
    seccion_desc: SECCION_DESC[item.seccion] || '',
    rf: 'F' + item.fClass,           // F15, F30, F60, F90, F120, F180, etc
    rf_minutos: item.fClass,         // valor numérico para comparar
    item: item.item,
    descripcion,
    espesor_mm: espesor,
    materiales,
    tipo_elemento: tipoElemento(item.seccion, elementoText),
    edicion: descripcion.includes('ED17') ? 'ED17-2025' : 'anterior',
  }
}

// ─── Extractor de tablas A.1.x (macizos) ──────────────────────────────────────
// Estas tablas mapean directamente espesor → RF para cada material macizo.
const TABLAS_MACIZOS = {
  // A.1.1: Adobe — sin info en el extracto directo
  // A.1.2: Piedra — sin info en el extracto directo

  'A.1.3': {
    descripcion: 'Muro de hormigón (armado y sin armadura)',
    material: 'hormigon_armado',
    tipo: 'muro_macizo',
    tabla: [
      { espesor_mm: 100, rf: 'F90',  rf_minutos: 90 },
      { espesor_mm: 150, rf: 'F150', rf_minutos: 150 },
      { espesor_mm: 200, rf: 'F180', rf_minutos: 180 },
    ],
  },

  'A.1.4': {
    descripcion: 'Bloques de hormigón',
    material: 'bloque_hormigon',
    tipo: 'bloque',
    tabla: [
      { dimensiones: '390x190x140', rf: 'F120', rf_minutos: 120, nota: 'Bloque tipo A' },
      { dimensiones: '390x190x190', rf: 'F150', rf_minutos: 150, nota: 'Bloque tipo B' },
    ],
  },

  'A.1.5': {
    descripcion: 'Paneles de madera macizos (machihembrados, lengüetas o adhesivos)',
    material: 'madera_maciza',
    tipo: 'panel_madera_macizo',
    tabla: [
      { espesor_mm: 20,  rf: 'F15',  rf_minutos: 15 },
      { espesor_mm: 45,  rf: 'F30',  rf_minutos: 30 },
      { espesor_mm: 90,  rf: 'F60',  rf_minutos: 60 },
      { espesor_mm: 140, rf: 'F90',  rf_minutos: 90 },
      { espesor_mm: 190, rf: 'F120', rf_minutos: 120 },
    ],
  },

  'B.1.1': {
    descripcion: 'Pilares aislados de madera (sin revestimiento)',
    material: 'madera_maciza',
    tipo: 'pilar',
    tabla: [
      { espesor_min_mm: 45,  rf: 'F15', rf_minutos: 15 },
      { espesor_min_mm: 90,  rf: 'F30', rf_minutos: 30 },
      { espesor_min_mm: 160, rf: 'F60', rf_minutos: 60 },
    ],
  },
}

/**
 * Genera el archivo JS de salida
 */
// 28 ítems Ed.17 recuperados manualmente con `pdftotext -layout -enc UTF-8`
// (el parser de arriba no los captura: la descripción arranca en la línea
//  superior al código, con blancos internos de celda). Verificados contra el PDF.
const ITEMS_RECUPERADOS_ED17 = {
  "A.2.3.120.107": {
    "codigo": "A.2.3.120.107",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F120",
    "rf_minutos": 120,
    "item": 107,
    "descripcion": "Tabique Perimetral, Doble placa Knauf RF 15 mm, Doble placa de cemento Aquapanel Outdoor 12.5 mm, e= 144 mm",
    "espesor_mm": 144,
    "materiales": [
      "fibrocemento"
    ],
    "tipo_elemento": "tabique",
    "edicion": "ED17-2025"
  },
  "A.2.3.120.61": {
    "codigo": "A.2.3.120.61",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F120",
    "rf_minutos": 120,
    "item": 61,
    "descripcion": "Tabique Divisorio Estructura de acero galvanizado con revestimiento de 2 yeso carton RF por ambas caras, con aislacion",
    "espesor_mm": null,
    "materiales": [
      "acero",
      "yeso_carton"
    ],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.120.85": {
    "codigo": "A.2.3.120.85",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F120",
    "rf_minutos": 120,
    "item": 85,
    "descripcion": "Tabique Interior con 4 placas de yeso carton Knauf Impact de 15 mm y marco de madera 32x32 mm e=60 mm",
    "espesor_mm": 60,
    "materiales": [
      "madera",
      "yeso_carton"
    ],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.15.110": {
    "codigo": "A.2.3.15.110",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F15",
    "rf_minutos": 15,
    "item": 110,
    "descripcion": "Muro de estructura madera con revestimiento interior de yeso carton 10 mm y exterior de fibrocemento 6 mm, con aislacion",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "yeso_carton",
      "fibrocemento"
    ],
    "tipo_elemento": "tabique_o_panel",
    "edicion": "anterior"
  },
  "A.2.3.15.112": {
    "codigo": "A.2.3.15.112",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F15",
    "rf_minutos": 15,
    "item": 112,
    "descripcion": "Muro estructurado en MGP10, 35 x 70 mm revestimiento interior de yeso – carton 10 mm y exterior Smart Panel con aislacion de celulosa",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "yeso_carton"
    ],
    "tipo_elemento": "panel",
    "edicion": "anterior"
  },
  "A.2.3.15.113": {
    "codigo": "A.2.3.15.113",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F15",
    "rf_minutos": 15,
    "item": 113,
    "descripcion": "Muro perimetral estructurado con madera impregnada de 2 x 3, revestimiento exterior madera machihembrada ¾ x 5 e interior yeso carton ST 10 mm, con aislacion",
    "espesor_mm": null,
    "materiales": [
      "madera"
    ],
    "tipo_elemento": "tabique_o_panel",
    "edicion": "anterior"
  },
  "A.2.3.15.114": {
    "codigo": "A.2.3.15.114",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F15",
    "rf_minutos": 15,
    "item": 114,
    "descripcion": "Muro perimetral estructurado con madera impregnada de 2 x 3, revestimiento exterior madera machihembrada ¾ x 5 e interior fibrocemento de 6 mm, con aislacion",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "fibrocemento"
    ],
    "tipo_elemento": "tabique_o_panel",
    "edicion": "anterior"
  },
  "A.2.3.15.134": {
    "codigo": "A.2.3.15.134",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F15",
    "rf_minutos": 15,
    "item": 134,
    "descripcion": "Tabique placas de terciado marino estructural de 18 [mm], Placas de OSB con terminacion exterior de 11,1 [mm] e=98,2 mm",
    "espesor_mm": 98.2,
    "materiales": [
      "madera"
    ],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.150.15": {
    "codigo": "A.2.3.150.15",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F150",
    "rf_minutos": 150,
    "item": 15,
    "descripcion": "Tabique Perimetral, Doble placa de yeso-carton Volcan® RH de 12,5 [mm] mas Ceramica pulida de 9 [mm] de espesor, Doble placa de yeso- carton Volcan® RF de 12,5 [mm], e=149 mm",
    "espesor_mm": 149,
    "materiales": [
      "yeso_carton"
    ],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.30.150": {
    "codigo": "A.2.3.30.150",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F30",
    "rf_minutos": 30,
    "item": 150,
    "descripcion": "Muro estructurado en MGP10, 35 x 70 mm revestimiento interior de fibrocemento 6 mm y exterior Smart Panel con aislacion de celulosa",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "fibrocemento"
    ],
    "tipo_elemento": "panel",
    "edicion": "anterior"
  },
  "A.2.3.30.172": {
    "codigo": "A.2.3.30.172",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F30",
    "rf_minutos": 30,
    "item": 172,
    "descripcion": "Tabique Divisorio, doble placa yeso-carton “Volcan® ST” de 10 [mm] de espesor, Doble placa de yeso-carton “Volcan® ST” de 10 [mm] de espesor e=130 mm",
    "espesor_mm": 130,
    "materiales": [
      "yeso_carton"
    ],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.30.178": {
    "codigo": "A.2.3.30.178",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F30",
    "rf_minutos": 30,
    "item": 178,
    "descripcion": "Tabique Interior con placa Knauf ST de 10 mm, placa SPGlass Knauf de 12,5 mm y acabado EIFS de 30 mm e=112,5 mm",
    "espesor_mm": 112.5,
    "materiales": [],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.30.179": {
    "codigo": "A.2.3.30.179",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F30",
    "rf_minutos": 30,
    "item": 179,
    "descripcion": "Tabique Perimetral con placas Knauf ST 10 mm, Aquapanel Residential 8 mm y estructura de madera pino radiata 2x3” e=94 mm",
    "espesor_mm": 94,
    "materiales": [
      "madera",
      "fibrocemento"
    ],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.30.180": {
    "codigo": "A.2.3.30.180",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F30",
    "rf_minutos": 30,
    "item": 180,
    "descripcion": "Tabique Perimetral, con placas de cemento Aquapanel Outdoor de 12,5 mm, Poliestireno expandido de 90 mm, Panel SIP AQUAPANEL, e=117 mm",
    "espesor_mm": 117,
    "materiales": [
      "sip",
      "fibrocemento",
      "eps"
    ],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.60.100": {
    "codigo": "A.2.3.60.100",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F60",
    "rf_minutos": 60,
    "item": 100,
    "descripcion": "Muro divisorio compuesto por dos paneles estructurados en madera graduada revestidos con Aislanforte 12 mm mas fibra de vidrio y aislacion de lana mineral",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "lana_mineral"
    ],
    "tipo_elemento": "panel",
    "edicion": "anterior"
  },
  "A.2.3.60.101": {
    "codigo": "A.2.3.60.101",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F60",
    "rf_minutos": 60,
    "item": 101,
    "descripcion": "Muro estructurado en MGP10, 35 x 70 mm revestimiento interior de yeso – carton XR 15 mm mas fibrocemento 8 mm y exterior Smart Panel con aislacion de celulosa",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "yeso_carton",
      "fibrocemento"
    ],
    "tipo_elemento": "panel",
    "edicion": "anterior"
  },
  "A.2.3.60.142": {
    "codigo": "A.2.3.60.142",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F60",
    "rf_minutos": 60,
    "item": 142,
    "descripcion": "Tabique Perimetral con placa Knauf Impact RH 15mm, Knauf SPGLASS 12,5 mm + EIFS 30 mm e=147,5 mm",
    "espesor_mm": 147.5,
    "materiales": [],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.60.99": {
    "codigo": "A.2.3.60.99",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F60",
    "rf_minutos": 60,
    "item": 99,
    "descripcion": "Muro divisorio compuesto por dos paneles estructurados en madera graduada con revestimiento de yeso carton XR 15mm y Fibrocemento 8 mm, con aislacion de celulosa",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "yeso_carton",
      "fibrocemento"
    ],
    "tipo_elemento": "panel",
    "edicion": "anterior"
  },
  "A.2.3.90.54": {
    "codigo": "A.2.3.90.54",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F90",
    "rf_minutos": 90,
    "item": 54,
    "descripcion": "Tabique Exterior, Sistema Promatect H/Permanit, FS Fibrocilicato 10 mm + FC Permanit 10 mm",
    "espesor_mm": null,
    "materiales": [
      "fibrocemento"
    ],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.90.55": {
    "codigo": "A.2.3.90.55",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F90",
    "rf_minutos": 90,
    "item": 55,
    "descripcion": "Tabique Perimetral con placa cemento Aquapanel Outdoor de Knauf 12,5mm, placa cemento Aquapanel Residential Knauf 8 mm, placa cemento Aquapanel Outdoor de Knauf 12,5 mm e=33 mm",
    "espesor_mm": 33,
    "materiales": [
      "fibrocemento"
    ],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "A.2.3.90.58": {
    "codigo": "A.2.3.90.58",
    "seccion": "A.2.3",
    "seccion_desc": "Paneles, tabiques y entramados ligeros",
    "rf": "F90",
    "rf_minutos": 90,
    "item": 58,
    "descripcion": "Tabique Perimetral con doble placa yeso carton Knauf Diamant de 15 mm, placa de cemento Aquapanel Outdoor de 12,5 mm e=133 mm",
    "espesor_mm": 133,
    "materiales": [
      "yeso_carton",
      "fibrocemento"
    ],
    "tipo_elemento": "tabique",
    "edicion": "anterior"
  },
  "B.2.1.30.01": {
    "codigo": "B.2.1.30.01",
    "seccion": "B.2.1",
    "seccion_desc": "",
    "rf": "F30",
    "rf_minutos": 30,
    "item": 1,
    "descripcion": "Pilar de acero tipo cajon plegado mas mortero Igniver espesor 12 mm mas base hormigon armado en ambos extremos del pilar",
    "espesor_mm": 12,
    "materiales": [
      "acero"
    ],
    "tipo_elemento": "otro",
    "edicion": "anterior"
  },
  "B.2.1.60.03": {
    "codigo": "B.2.1.60.03",
    "seccion": "B.2.1",
    "seccion_desc": "",
    "rf": "F60",
    "rf_minutos": 60,
    "item": 3,
    "descripcion": "Pilar de acero tipo cajon plegado mas mortero Igniver espesor 23 mm mas base hormigon armado en ambos extremos del pilar",
    "espesor_mm": 23,
    "materiales": [
      "acero"
    ],
    "tipo_elemento": "otro",
    "edicion": "anterior"
  },
  "B.2.1.90.03": {
    "codigo": "B.2.1.90.03",
    "seccion": "B.2.1",
    "seccion_desc": "",
    "rf": "F90",
    "rf_minutos": 90,
    "item": 3,
    "descripcion": "Pilar de acero tipo cajon plegado mas mortero Igniver espesor 26 mm mas base hormigon armado en ambos extremos del pilar",
    "espesor_mm": 26,
    "materiales": [
      "acero"
    ],
    "tipo_elemento": "otro",
    "edicion": "anterior"
  },
  "F.2.1.15.57": {
    "codigo": "F.2.1.15.57",
    "seccion": "F.2.1",
    "seccion_desc": "",
    "rf": "F15",
    "rf_minutos": 15,
    "item": 57,
    "descripcion": "Techumbre tipo caseton de un agua, estructurada en madera cubierta de zincalum y revesitimiento interior de yeso carton de 10 mm, con aislacion",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "yeso_carton"
    ],
    "tipo_elemento": "otro",
    "edicion": "anterior"
  },
  "F.2.1.15.58": {
    "codigo": "F.2.1.15.58",
    "seccion": "F.2.1",
    "seccion_desc": "",
    "rf": "F15",
    "rf_minutos": 15,
    "item": 58,
    "descripcion": "Techumbre con cerchas de madera MGP10, 35 x 70 mm revestimiento superior zincalum 0,35 mm e inferior yeso carton 10 mm, con aislacion de celulosa",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "yeso_carton"
    ],
    "tipo_elemento": "otro",
    "edicion": "anterior"
  },
  "G.2.1.15.10": {
    "codigo": "G.2.1.15.10",
    "seccion": "G.2.1",
    "seccion_desc": "",
    "rf": "F15",
    "rf_minutos": 15,
    "item": 10,
    "descripcion": "Entrepiso estructurado en MGP10, 35 x 138 mm revestimiento superior Araucoply 15 mm e inferior yeso carton 10 mm",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "yeso_carton"
    ],
    "tipo_elemento": "otro",
    "edicion": "anterior"
  },
  "G.2.1.15.11": {
    "codigo": "G.2.1.15.11",
    "seccion": "G.2.1",
    "seccion_desc": "",
    "rf": "F15",
    "rf_minutos": 15,
    "item": 11,
    "descripcion": "Entrepiso estructurado en MGP10, 35 x 138 mm revestimiento superior Araucoply 15 mm e inferior fibrocemento 6 mm",
    "espesor_mm": null,
    "materiales": [
      "madera",
      "fibrocemento"
    ],
    "tipo_elemento": "otro",
    "edicion": "anterior"
  }
}

function generarJS(items, tablas) {
  // Construir objeto por código
  const obj = {}
  for (const it of items) {
    obj[it.codigo] = it
  }
  // 28 ítems Ed.17 que el parser lineal no captura (la descripción arranca en la
  // línea SUPERIOR al código, con blancos internos de celda). Verificados a mano
  // contra el PDF con `pdftotext -layout -enc UTF-8`.
  Object.assign(obj, ITEMS_RECUPERADOS_ED17)

  const header = `// ═══════════════════════════════════════════════════════════════════════════════
// LOFC — Listado Oficial de Comportamiento al Fuego de Elementos y Componentes
// MINVU - DITEC - ED17 2025 - Enero 2025
// ═══════════════════════════════════════════════════════════════════════════════
//
// Auto-generado por scripts/extraer-lofc.js
// NO EDITAR A MANO. Si necesitas modificar, edita el script y re-ejecuta.
//
// Total items LOFC: ${Object.keys(obj).length}
// Tablas macizos: ${Object.keys(tablas).length}
// ═══════════════════════════════════════════════════════════════════════════════

// Items individuales LOFC (códigos como A.2.3.30.198)
export const LOFC = ${JSON.stringify(obj, null, 2)}

// Tablas de macizos LOFC (mapean material+espesor → RF directamente)
// Ej: HA 150mm = F150 (A.1.3), Madera maciza 90mm = F60 (A.1.5)
export const LOFC_MACIZOS = ${JSON.stringify(tablas, null, 2)}

export const LOFC_TOTAL_ITEMS = ${Object.keys(obj).length}
`

  return header
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('LOFC Extractor (Ed.17 2025)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('PDF:    ', PDF_PATH)
  console.log('Output: ', OUTPUT_PATH)
  console.log('')

  // Leer texto del PDF (o caché)
  let texto
  if (fs.existsSync(RAW_OUTPUT)) {
    console.log('✓ Usando texto en caché:', RAW_OUTPUT)
    texto = fs.readFileSync(RAW_OUTPUT, 'utf-8')
  } else {
    console.log('→ Extrayendo texto del PDF (puede tardar 30s)...')
    const buffer = fs.readFileSync(PDF_PATH)
    const parser = new PDFParse({ data: buffer })
    const data = await parser.getText()
    texto = data.text
    fs.writeFileSync(RAW_OUTPUT, texto)
    console.log(`✓ Texto extraído: ${data.total} páginas, ${texto.length} chars`)
  }

  // Extraer items
  console.log('→ Extrayendo items...')
  const items = extraerItems(texto)
  console.log(`✓ ${items.length} items detectados`)

  // Filtrar duplicados (algunos items aparecen varias veces en TOC + detalle)
  const itemsUnicos = new Map()
  for (const it of items) {
    if (!itemsUnicos.has(it.codigo) || it.contenido.length > itemsUnicos.get(it.codigo).contenido.length) {
      itemsUnicos.set(it.codigo, it)
    }
  }
  const itemsFinales = [...itemsUnicos.values()]
  console.log(`✓ ${itemsFinales.length} items únicos tras deduplicar`)

  // Procesar cada item
  console.log('→ Procesando items...')
  const itemsProcesados = itemsFinales.map(procesarItem)

  // Estadísticas por F-class
  const porFClass = {}
  for (const it of itemsProcesados) {
    porFClass[it.rf] = (porFClass[it.rf] || 0) + 1
  }

  // Estadísticas por sección
  const porSeccion = {}
  for (const it of itemsProcesados) {
    porSeccion[it.seccion] = (porSeccion[it.seccion] || 0) + 1
  }

  // Estadísticas por material
  const porMaterial = {}
  for (const it of itemsProcesados) {
    for (const m of (it.materiales || [])) {
      porMaterial[m] = (porMaterial[m] || 0) + 1
    }
  }

  console.log('')
  console.log('═══ Distribución por RF ═══')
  Object.entries(porFClass).sort((a, b) => parseInt(a[0].slice(1)) - parseInt(b[0].slice(1))).forEach(([rf, c]) => {
    console.log(`  ${rf}: ${c}`)
  })

  console.log('')
  console.log('═══ Distribución por sección ═══')
  Object.entries(porSeccion).sort().forEach(([s, c]) => {
    console.log(`  ${s}: ${c} (${SECCION_DESC[s] || '?'})`)
  })

  console.log('')
  console.log('═══ Distribución por material (multi-tag) ═══')
  Object.entries(porMaterial).sort((a, b) => b[1] - a[1]).forEach(([m, c]) => {
    console.log(`  ${m}: ${c}`)
  })

  // Estadísticas de datos extraídos
  const conEspesor = itemsProcesados.filter(it => it.espesor_mm !== null).length
  const conDesc = itemsProcesados.filter(it => it.descripcion && it.descripcion.length > 10).length

  console.log('')
  console.log('═══ Calidad de extracción ═══')
  console.log(`  Total items:      ${itemsProcesados.length}`)
  console.log(`  Con descripción:  ${conDesc} (${(conDesc / itemsProcesados.length * 100).toFixed(1)}%)`)
  console.log(`  Con espesor:      ${conEspesor} (${(conEspesor / itemsProcesados.length * 100).toFixed(1)}%)`)

  // Generar JS
  console.log('')
  console.log('→ Generando archivo JS...')
  const js = generarJS(itemsProcesados, TABLAS_MACIZOS)
  fs.writeFileSync(OUTPUT_PATH, js)
  console.log(`✓ Archivo generado: ${OUTPUT_PATH}`)

  // Muestra
  console.log('')
  console.log('═══ Muestra (5 items aleatorios) ═══')
  const muestra = [
    itemsProcesados.find(i => i.codigo.startsWith('A.2.3.15')),
    itemsProcesados.find(i => i.codigo.startsWith('A.2.3.30')),
    itemsProcesados.find(i => i.codigo.startsWith('A.2.3.60')),
    itemsProcesados.find(i => i.codigo.startsWith('A.2.3.90')),
    itemsProcesados.find(i => i.codigo.startsWith('A.2.3.120')),
  ].filter(Boolean)

  for (const it of muestra) {
    console.log(`  ${it.codigo} (${it.rf}, ${it.espesor_mm || '?'}mm)`)
    console.log(`    └─ ${it.descripcion?.slice(0, 90) || '(sin descripción)'}`)
    console.log(`    └─ materiales: ${(it.materiales || []).join(', ') || '—'}`)
  }

  console.log('')
  console.log('✓ Extracción LOFC completa.')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
