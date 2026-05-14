// ═══════════════════════════════════════════════════════════════════════════════
// Motor de Homologación Normativa LOSCAT → LOFC + LOSCAA
// ═══════════════════════════════════════════════════════════════════════════════
//
// Dada una solución constructiva LOSCAT (térmica), homologa automáticamente
// a su(s) código(s) equivalente(s) en:
//   · LOFC Ed.17 2025 → comportamiento al fuego (RF)
//   · LOSCAA 2024     → aislamiento acústico (Rw)
//
// Si el requerimiento normativo del proyecto excede la capacidad intrínseca
// de la solución, sugiere capas adicionales y devuelve el código homologado
// con la mejora.
//
// Estrategia "más restrictiva": ante varias opciones de homologación, elige
// la de mayor RF / mayor Rw (más conservador para certificación).
//
// Pure functions: NO dependencias de React. Recibe LOSCAT/LOFC/LOSCAA como
// argumentos y retorna objeto de homologación.
// ═══════════════════════════════════════════════════════════════════════════════

import { LOFC, LOFC_MACIZOS } from '../../data/lofc.js'
import { LOSCAA } from '../../data/loscaa.js'

// ─── Conversión RF string ↔ minutos ──────────────────────────────────────────
function rfToMinutos(rf) {
  if (!rf) return 0
  const m = String(rf).match(/F[-\s]?(\d+)/i)
  return m ? parseInt(m[1]) : 0
}

function minutosToRF(min) {
  return `F${min}`
}

// ─── Identificación de Estructura Base ───────────────────────────────────────
// Dado un objeto LOSCAT (cod, desc, capas, sistemas, obs), identifica el
// material primario y sus parámetros clave (espesor, tipo).
//
// Returns: {
//   material: 'hormigon_armado' | 'ladrillo' | 'madera' | 'acero' | 'sip' | 'clt' | 'bloque' | null
//   subtipo: '...',                  // ej: 'Santiago 9'
//   espesor_estructura_mm: 150,      // espesor del elemento estructural
//   sistemas: ['HA', 'Metalframe'],   // sistemas declarados por LOSCAT
//   confianza: 0.0 - 1.0              // qué tan seguro estamos
// }
export function identificarEstructuraBase(loscat) {
  if (!loscat) return null

  const texto = [
    loscat.desc || '',
    loscat.obs || '',
    loscat.capas || '',
    (loscat.sistemas || []).join(' '),
  ].join(' ').toLowerCase()

  // ── Hormigón Armado ────────────────────────────────────────────────────────
  const matchHA = texto.match(/h(?:orm)?(?:ig[oó]n)?\.?\s*a(?:rmado)?\.?\s*(\d{2,3})\s*(?:mm|cm)/i)
                  || texto.match(/h\.?a\.?\s+(\d{2,3})\s*(?:mm|cm)/i)
                  || texto.match(/(\d{2,3})\s*(?:mm|cm)?\s*(?:de\s+)?h\.?\s*a\.?/i)
  if (matchHA) {
    let esp = parseInt(matchHA[1])
    // Heurística: si número < 30, probablemente está en cm
    if (esp < 30 && /cm/i.test(matchHA[0])) esp = esp * 10
    return {
      material: 'hormigon_armado',
      subtipo: 'HA',
      espesor_estructura_mm: esp,
      sistemas: loscat.sistemas || [],
      confianza: 0.95,
    }
  }

  // ── Albañilería de Ladrillo ────────────────────────────────────────────────
  const matchLad = texto.match(/(?:ladrillo|albani[lñ]er[ií]a).*?(santiago\s*\d+|princesa\s*\d?|t[ií]tan\s*\w*|s9|s7)/i)
                   || texto.match(/santiago\s*(\d+)/i)
  if (matchLad || /ladrillo|albani[lñ]er[ií]a/i.test(texto)) {
    const subtipo = matchLad ? matchLad[1].trim() : 'genérico'
    const matchEsp = texto.match(/(\d{2,3})\s*mm\s*(?:de\s+)?(?:espesor|ladrillo|albani)/i)
                     || texto.match(/(?:e=|espesor\s*=?)\s*(\d{2,3})\s*mm/i)
    return {
      material: 'ladrillo',
      subtipo,
      espesor_estructura_mm: matchEsp ? parseInt(matchEsp[1]) : null,
      sistemas: loscat.sistemas || [],
      confianza: 0.85,
    }
  }

  // ── Bloques de Hormigón ────────────────────────────────────────────────────
  const matchBloque = texto.match(/bloque[s]?\s+(?:de\s+)?horm?ig[oó]n.*?(\d+\s*x\s*\d+\s*x\s*\d+)/i)
  if (matchBloque) {
    return {
      material: 'bloque',
      subtipo: matchBloque[1],
      sistemas: loscat.sistemas || [],
      confianza: 0.9,
    }
  }

  // ── CLT (Madera Contralaminada) ────────────────────────────────────────────
  const matchCLT = texto.match(/clt|contralaminada/i)
  if (matchCLT) {
    const matchEsp = texto.match(/clt[^0-9]*(\d{2,3})\s*mm/i)
                     || texto.match(/(\d{2,3})\s*mm.*?(?:clt|contralaminada)/i)
    return {
      material: 'clt',
      subtipo: 'CLT',
      espesor_estructura_mm: matchEsp ? parseInt(matchEsp[1]) : null,
      sistemas: loscat.sistemas || [],
      confianza: 0.9,
    }
  }

  // ── Panel SIP ──────────────────────────────────────────────────────────────
  if (/panel\s+sip|sip\s+(?:osb|panel)/i.test(texto)) {
    const matchEsp = texto.match(/sip[^0-9]*(\d{2,3})\s*mm/i)
                     || texto.match(/(\d{2,3})\s*mm.*?sip/i)
    return {
      material: 'sip',
      subtipo: 'SIP',
      espesor_estructura_mm: matchEsp ? parseInt(matchEsp[1]) : null,
      sistemas: loscat.sistemas || [],
      confianza: 0.85,
    }
  }

  // ── Metalframe (Acero Liviano) ─────────────────────────────────────────────
  if (/metalframe|steel\s+framing|acero\s+liviano|metalcon/i.test(texto)) {
    const matchEsp = texto.match(/metalframe[^0-9]*(\d{2,3})\s*mm/i)
                     || texto.match(/mf\s*(\d{2,3})/i)
    return {
      material: 'acero',
      subtipo: 'metalframe',
      espesor_estructura_mm: matchEsp ? parseInt(matchEsp[1]) : null,
      sistemas: loscat.sistemas || [],
      confianza: 0.85,
    }
  }

  // ── Madera Estructura (Entramado) ──────────────────────────────────────────
  if (/entramado.*?madera|estructura.*?madera|madera.*?2x\d|2x\d.*?madera|cercha\s+madera/i.test(texto)) {
    const matchPerfil = texto.match(/2x(\d+)/)
    return {
      material: 'madera',
      subtipo: matchPerfil ? `2x${matchPerfil[1]}` : 'entramado',
      sistemas: loscat.sistemas || [],
      confianza: 0.85,
    }
  }

  // ── Acero Estructura ───────────────────────────────────────────────────────
  if (/estructura.*?acero|cercha\s+acero|panel\s+sandwich\s+(?:acero|zinc)/i.test(texto)) {
    return {
      material: 'acero',
      subtipo: 'estructura_acero',
      sistemas: loscat.sistemas || [],
      confianza: 0.75,
    }
  }

  // ── Tabique ligero genérico (yeso + lana, sin estructura macizada) ────────
  // Para tabiques tipo drywall sin marco estructural explícito en la descripción
  if (loscat?.elem === 'tabique' && /yeso|gyplac|volcanita|drywall/i.test(texto)) {
    if (/lana/i.test(texto)) {
      return {
        material: 'tabique_drywall',
        subtipo: 'yeso_lana',
        sistemas: loscat.sistemas || [],
        confianza: 0.7,
      }
    }
    // Tabique de yeso sin lana (más raro)
    return {
      material: 'tabique_drywall',
      subtipo: 'yeso',
      sistemas: loscat.sistemas || [],
      confianza: 0.6,
    }
  }

  // ── Panel sandwich genérico (zinc/acero + aislante + zinc/acero) ──────────
  if (/panel\s+sandwich|sandwich.*?(?:zinc|acero|aluminio)/i.test(texto)) {
    return {
      material: 'panel_sandwich',
      subtipo: 'metalico',
      sistemas: loscat.sistemas || [],
      confianza: 0.7,
    }
  }

  return {
    material: null,
    subtipo: 'desconocido',
    sistemas: loscat.sistemas || [],
    confianza: 0,
  }
}

// ─── Homologación con tabla de macizos (rápido y exacto) ─────────────────────
// Para HA, ladrillo, madera maciza, bloque: usa LOFC_MACIZOS directamente.
function homologarMacizo(estructura, reqRfMin) {
  if (!estructura) return null

  // Albañilería de ladrillo cerámico → A.2.2 (Santiago)
  // Tabla manual basada en LOFC Ed.17:
  //   Santiago 7 (140mm) = F240
  //   Santiago 9 (140mm) = F180
  //   Bloque Graublock GST-10 (90mm) = F30
  if (estructura.material === 'ladrillo') {
    const sub = (estructura.subtipo || '').toLowerCase()
    let row = null
    if (/santiago\s*9|s9/i.test(sub) || sub.includes('estructural')) {
      row = { codigo: 'A.2.2.180.05', desc: 'Ladrillo Santiago 9 (Estructural S9E)', rf: 'F180', rf_min: 180 }
    } else if (/santiago\s*7|s7/i.test(sub)) {
      row = { codigo: 'A.2.2.240.01', desc: 'Ladrillo Santiago 7', rf: 'F240', rf_min: 240 }
    } else if (/princesa/i.test(sub)) {
      row = { codigo: 'A.2.2.180.XX', desc: 'Ladrillo cerámico Princesa', rf: 'F180', rf_min: 180 }
    }
    if (row && row.rf_min >= reqRfMin) {
      return {
        codigo: `LOFC ${row.codigo}`,
        codigo_base: row.codigo,
        rf: row.rf,
        rf_minutos: row.rf_min,
        descripcion: row.desc,
        intrinseco: true,
        capas_extras: [],
        fuente: 'LOFC Ed.17 A.2.2 (Paramentos de ladrillos)',
      }
    }
  }

  // Hormigón Armado → A.1.3
  if (estructura.material === 'hormigon_armado' && estructura.espesor_estructura_mm) {
    const tabla = LOFC_MACIZOS['A.1.3'].tabla
    // Buscar la primera entrada que cumple
    const e = estructura.espesor_estructura_mm
    // Tabla: 100→F90, 150→F150, 200→F180
    let mejor = null
    for (const row of tabla) {
      if (row.espesor_mm <= e && row.rf_minutos >= reqRfMin) {
        if (!mejor || row.rf_minutos > mejor.rf_minutos) mejor = row
      }
    }
    if (mejor) {
      return {
        codigo: `LOFC A.1.3 (HA ${mejor.espesor_mm}mm)`,
        codigo_base: 'A.1.3',
        rf: mejor.rf,
        rf_minutos: mejor.rf_minutos,
        descripcion: `Muro de hormigón armado e=${mejor.espesor_mm}mm`,
        intrinseco: true,           // RF lograda sin capas extras
        capas_extras: [],
        fuente: 'LOFC Ed.17 A.1.3 (tabla macizos)',
      }
    }
  }

  // Bloques de Hormigón → A.1.4
  if (estructura.material === 'bloque') {
    const tabla = LOFC_MACIZOS['A.1.4'].tabla
    // Buscar por dimensiones aproximadas
    for (const row of tabla) {
      if (row.rf_minutos >= reqRfMin) {
        return {
          codigo: `LOFC A.1.4 (${row.nota || row.dimensiones})`,
          codigo_base: 'A.1.4',
          rf: row.rf,
          rf_minutos: row.rf_minutos,
          descripcion: `Bloque de hormigón ${row.dimensiones}`,
          intrinseco: true,
          capas_extras: [],
          fuente: 'LOFC Ed.17 A.1.4 (tabla bloques)',
        }
      }
    }
  }

  // Madera Maciza → A.1.5
  if (estructura.material === 'clt' && estructura.espesor_estructura_mm) {
    const tabla = LOFC_MACIZOS['A.1.5'].tabla
    const e = estructura.espesor_estructura_mm
    let mejor = null
    for (const row of tabla) {
      if (row.espesor_mm <= e && row.rf_minutos >= reqRfMin) {
        if (!mejor || row.rf_minutos > mejor.rf_minutos) mejor = row
      }
    }
    if (mejor) {
      return {
        codigo: `LOFC A.1.5 (Madera ${mejor.espesor_mm}mm)`,
        codigo_base: 'A.1.5',
        rf: mejor.rf,
        rf_minutos: mejor.rf_minutos,
        descripcion: `Panel de madera maciza e=${mejor.espesor_mm}mm`,
        intrinseco: true,
        capas_extras: [],
        fuente: 'LOFC Ed.17 A.1.5 (tabla madera maciza)',
      }
    }
  }

  return null
}

// ─── Tabla de compatibilidad elemento LOSCAT ↔ LOFC ──────────────────────────
// LOSCAT.elem    →  LOFC.tipo_elemento permitidos
const ELEM_COMPATIBILIDAD_LOFC = {
  'muro':      ['muro_macizo', 'muro_albanileria', 'panel', 'tabique', 'tabique_o_panel', 'bloque'],
  'tabique':   ['tabique', 'panel', 'tabique_o_panel'],
  'techumbre': ['muro_macizo', 'panel', 'tabique_o_panel', 'panel_madera_macizo', 'bloque'],  // techos de mismo material
  'piso':      ['muro_macizo', 'panel_madera_macizo', 'bloque'],                              // pisos como losas/paneles
  'puerta':    ['puerta'],
  'ventana':   [],  // no aplica
}

// ─── Tabla de compatibilidad elemento LOSCAT ↔ LOSCAA ────────────────────────
const ELEM_COMPATIBILIDAD_LOSCAA = {
  'muro':      ['muro'],           // muros divisorios, exteriores, interiores
  'tabique':   ['muro'],           // tabiques también en LOSCAA muros (D.M.x)
  'techumbre': ['techumbre'],      // techumbres específicas (E.T.x)
  'piso':      ['entrepiso'],      // pisos en entrepisos (D.EP.x)
  'puerta':    ['puerta'],
  'ventana':   ['ventana'],
}

// ─── Score de coincidencia para items LOFC ───────────────────────────────────
// Devuelve 0-100 según qué tan bien matchea un item LOFC con una estructura.
// IMPORTANTE: requiere coincidencia de material primario + al menos un
// material secundario (revestimiento o aislante) para puntaje significativo.
// Penaliza items con RF muy superior al declarado por el LOSCAT (over-spec).
// Si elemSource está definido, FILTRA por compatibilidad de tipo de elemento.
function scoreLOFC(item, estructura, loscat, elemSource) {
  if (!item || !estructura?.material) return 0

  // ── Filtro estricto por tipo de elemento (no asociar entrepiso a muro, etc.) ──
  if (elemSource) {
    const tiposPermitidos = ELEM_COMPATIBILIDAD_LOFC[elemSource]
    if (tiposPermitidos && tiposPermitidos.length === 0) return 0  // no aplica
    if (tiposPermitidos && !tiposPermitidos.includes(item.tipo_elemento)) return 0
  }

  let score = 0

  const matTags = item.materiales || []
  const loscatTexto = ((loscat?.desc || '') + ' ' + (loscat?.capas || '') + ' ' + (loscat?.obs || '')).toLowerCase()

  // ── Material primario obligatorio (sin él, score = 0) ────────────────────
  let primaryMatch = false

  if (estructura.material === 'hormigon_armado') {
    primaryMatch = matTags.includes('hormigon_armado')
    if (primaryMatch) score += 50
  } else if (estructura.material === 'ladrillo') {
    primaryMatch = matTags.includes('ladrillo')
    if (primaryMatch) score += 50
  } else if (estructura.material === 'clt') {
    primaryMatch = matTags.includes('clt')
    if (primaryMatch) score += 60
  } else if (estructura.material === 'sip') {
    primaryMatch = matTags.includes('sip')
    if (primaryMatch) score += 60
  } else if (estructura.material === 'madera') {
    primaryMatch = matTags.includes('madera') && !matTags.includes('acero')
    if (primaryMatch) score += 50
    // Penalizar si tiene "acero" — no es entramado de madera puro
    if (matTags.includes('acero') && matTags.includes('madera')) score += 20  // débil
  } else if (estructura.material === 'acero') {
    primaryMatch = matTags.includes('acero')
    if (primaryMatch) score += 50
    // Para metalframe: requerir también yeso_carton (es el sistema típico)
    if (estructura.subtipo === 'metalframe' && matTags.includes('yeso_carton')) score += 15
  } else if (estructura.material === 'bloque') {
    primaryMatch = matTags.includes('bloque') || matTags.includes('ladrillo')
    if (primaryMatch) score += 40
  } else if (estructura.material === 'tabique_drywall') {
    // Tabique ligero: yeso, puede tener perfilería de acero o madera
    primaryMatch = matTags.includes('yeso_carton')
    if (primaryMatch) score += 50
    if (matTags.includes('lana_mineral')) score += 10
  } else if (estructura.material === 'panel_sandwich') {
    // Panel sandwich: acero + aislante (lana, EPS, PU, etc)
    primaryMatch = matTags.includes('acero') && (matTags.includes('lana_mineral') || matTags.includes('eps') || matTags.includes('pu'))
    if (primaryMatch) score += 55
  }

  if (!primaryMatch) return 0  // No tiene sentido el match

  // ── Materiales secundarios (aislante + revestimiento) ────────────────────
  // Coincidencia con materiales declarados en el LOSCAT
  const matchSecundario = []
  if (/lana\s+(?:mineral|vidrio|roca)/i.test(loscatTexto) && matTags.includes('lana_mineral')) matchSecundario.push('lana')
  if (/yeso\s+cart|gyplac|volcanita/i.test(loscatTexto) && matTags.includes('yeso_carton')) matchSecundario.push('yeso')
  if (/fibrocemento|volcanboard|simplisima/i.test(loscatTexto) && matTags.includes('fibrocemento')) matchSecundario.push('fibrocemento')
  if (/eps|expandido/i.test(loscatTexto) && matTags.includes('eps')) matchSecundario.push('eps')
  if (/xps|extruido/i.test(loscatTexto) && matTags.includes('xps')) matchSecundario.push('xps')
  if (/pu\s+proyectado|poliuretano/i.test(loscatTexto) && matTags.includes('pu')) matchSecundario.push('pu')

  score += matchSecundario.length * 10  // hasta +30 si 3 coincidencias

  // ── Espesor cercano ──────────────────────────────────────────────────────
  if (item.espesor_mm && estructura.espesor_estructura_mm) {
    const diff = Math.abs(item.espesor_mm - estructura.espesor_estructura_mm)
    if (diff <= 10) score += 15
    else if (diff <= 30) score += 10
    else if (diff <= 60) score += 5
    else if (diff > 100) score -= 10  // penaliza grandes diferencias
  }

  // ── Penalizar over-spec en RF ────────────────────────────────────────────
  // Si LOSCAT declara F30 y el LOFC item es F240, es un over-match
  const rfLoscat = rfToMinutos(loscat?.rf)
  if (rfLoscat > 0 && item.rf_minutos > rfLoscat) {
    const overSpec = item.rf_minutos - rfLoscat
    if (overSpec > 90) score -= 20      // F30 → F120+ es excesivo
    else if (overSpec > 60) score -= 10
    else if (overSpec > 30) score -= 5
  }

  return Math.max(0, score)
}

// ─── Homologación LOFC (Fuego) ────────────────────────────────────────────────
// Estrategia: priorizar score de match (constructivo similar) y luego RF.
// El "más restrictiva" se aplica cuando hay empate de score: elegir el de mayor RF.
// FILTRA estrictamente por tipo de elemento (no asociar entrepiso a muro, etc.).
export function homologarLOFC(loscat, reqRF) {
  const reqRfMin = rfToMinutos(reqRF)
  const estructura = identificarEstructuraBase(loscat)
  if (!estructura) return null

  const elemSource = loscat?.elem || null

  // 1. Intentar primero con tabla macizos (más confiable) — solo para muros/techos/pisos macizos
  if (elemSource === 'muro' || elemSource === 'techumbre' || elemSource === 'piso' || !elemSource) {
    const macizo = homologarMacizo(estructura, reqRfMin)
    if (macizo) return macizo
  }

  // 2. Buscar en items LOFC individuales por score (con filtro de elemento)
  const candidatos = Object.values(LOFC)
    .filter(item => item.rf_minutos >= reqRfMin)
    .map(item => ({ item, score: scoreLOFC(item, estructura, loscat, elemSource) }))
    .filter(c => c.score >= 60)  // umbral más alto = match más confiable
    .sort((a, b) => {
      // Priorizar score (similitud constructiva)
      if (b.score !== a.score) return b.score - a.score
      // Empate: elegir el de mayor RF (más restrictiva)
      return b.item.rf_minutos - a.item.rf_minutos
    })

  if (candidatos.length === 0) return null

  const mejor = candidatos[0]
  return {
    codigo: `LOFC ${mejor.item.codigo}`,
    codigo_base: mejor.item.codigo,
    rf: mejor.item.rf,
    rf_minutos: mejor.item.rf_minutos,
    descripcion: mejor.item.descripcion,
    intrinseco: mejor.item.rf_minutos >= rfToMinutos(loscat.rf || 'F0'),
    capas_extras: [],
    fuente: `LOFC Ed.17 ${mejor.item.seccion} (item)`,
    score: mejor.score,
  }
}

// ─── Score de coincidencia para LOSCAA ───────────────────────────────────────
// FILTRA estrictamente por tipo de elemento — no asociar entrepiso a muro, etc.
function scoreLOSCAA(item, estructura, loscat, elemSource) {
  if (!item) return 0

  // ── Filtro estricto por tipo de elemento ──────────────────────────────────
  if (elemSource) {
    const elementosPermitidos = ELEM_COMPATIBILIDAD_LOSCAA[elemSource]
    if (elementosPermitidos && elementosPermitidos.length === 0) return 0
    if (elementosPermitidos && !elementosPermitidos.includes(item.elemento)) return 0
  }

  let score = 0
  let materialMatch = false

  const itemMat = item.material || ''
  const estMat = estructura?.material || ''

  // Material primario coincide (REQUERIDO — si no, score = 0)
  if (estMat === 'hormigon_armado' && itemMat === 'hormigon_armado') { score += 50; materialMatch = true }
  if (estMat === 'ladrillo' && itemMat === 'ladrillo') { score += 50; materialMatch = true }
  if (estMat === 'madera' && itemMat === 'madera') { score += 50; materialMatch = true }
  if (estMat === 'acero' && itemMat === 'acero') { score += 50; materialMatch = true }
  if (estMat === 'panel_sandwich' && itemMat === 'acero') { score += 45; materialMatch = true }
  // Tabique drywall: matchear con tabiques LOSCAA en muros (acero o madera)
  if (estMat === 'tabique_drywall' && (itemMat === 'acero' || itemMat === 'madera')) { score += 40; materialMatch = true }
  // CLT y SIP: matchear como madera
  if ((estMat === 'clt' || estMat === 'sip') && itemMat === 'madera') { score += 40; materialMatch = true }
  // Bloque hormigón: matchear como hormigon
  if (estMat === 'bloque' && itemMat === 'hormigon_armado') { score += 30; materialMatch = true }

  if (!materialMatch) return 0  // Sin match de material, no es homologable

  // Bonus si LOSCAT también tiene Rw declarado y es similar
  const rwLOSCAT = parseFloat(loscat?.ac_rw || 0)
  if (rwLOSCAT && item.rw && Math.abs(rwLOSCAT - item.rw) <= 3) score += 30
  else if (rwLOSCAT && item.rw && Math.abs(rwLOSCAT - item.rw) <= 7) score += 15

  // Bonus si espesor cercano
  if (item.espesor_mm && estructura?.espesor_estructura_mm) {
    const diff = Math.abs(item.espesor_mm - estructura.espesor_estructura_mm)
    if (diff <= 15) score += 10
    else if (diff <= 40) score += 5
  }

  return score
}

// ─── Homologación LOSCAA (Acústica) ──────────────────────────────────────────
// FILTRA por tipo de elemento del LOSCAT (muro→muro, techumbre→techumbre, etc.)
// Y por material — si no hay match de material, no devuelve nada.
export function homologarLOSCAA(loscat, reqRw) {
  const estructura = identificarEstructuraBase(loscat)
  if (!estructura) return null

  const reqRwNum = parseFloat(reqRw) || 0
  const elemSource = loscat?.elem || null

  // Buscar en LOSCAA por score (filtrando por elemento + material)
  // No filtramos por Rw aquí — el score se encarga, y queremos mostrar match
  // de material aunque no cumpla Rw exacto.
  const candidatos = Object.values(LOSCAA)
    .filter(item => item.rw)  // solo items con Rw definido
    .map(item => ({ item, score: scoreLOSCAA(item, estructura, loscat, elemSource) }))
    .filter(c => c.score >= 40)  // requiere match de material (material da min 30 score)
    .sort((a, b) => {
      // Priorizar score (similitud constructiva con material match)
      if (b.score !== a.score) return b.score - a.score
      // Empate: mayor Rw (más restrictivo)
      return b.item.rw - a.item.rw
    })

  if (candidatos.length === 0) return null

  const mejor = candidatos[0]
  // intrinseco: el LOSCAT cumple el req sin necesidad de capas extras
  const intrinseco = reqRwNum > 0
    ? (parseFloat(loscat?.ac_rw || 0)) >= reqRwNum
    : true
  return {
    codigo: `LOSCAA ${mejor.item.codigo}`,
    codigo_base: mejor.item.codigo,
    rw: mejor.item.rw,
    rw_tipo: mejor.item.rw_tipo || 'Rw',
    masa_kg_m2: mejor.item.masa_kg_m2,
    descripcion: mejor.item.descripcion,
    intrinseco,
    capas_extras: [],
    fuente: `LOSCAA 2024 ED13 (${mejor.item.categoria || 'unidad'})`,
    score: mejor.score,
  }
}

// ─── Función Principal: Homologar Solución Completa ──────────────────────────
// Dada una solución LOSCAT y los requerimientos del proyecto, retorna los
// 3 códigos normativos: térmico (mismo LOSCAT), fuego (LOFC), acústico (LOSCAA).
export function homologarSolucion(loscat, requerimientos = {}) {
  if (!loscat) return null

  const { rfRequerido, rwRequerido } = requerimientos
  const estructura = identificarEstructuraBase(loscat)

  // 1. Térmico: el propio LOSCAT
  const termico = {
    codigo: `LOSCAT ${loscat.cod}`,
    codigo_base: loscat.cod,
    u: parseFloat(loscat.u) || null,
    descripcion: loscat.desc,
    fuente: 'LOSCAT Ed.13 2025',
  }

  // 2. Fuego: homologar a LOFC
  const fuego = homologarLOFC(loscat, rfRequerido || loscat.rf)

  // 3. Acústico: homologar a LOSCAA
  const acustico = homologarLOSCAA(loscat, rwRequerido || loscat.ac_rw)

  return {
    termico,
    fuego,
    acustico,
    estructura_base: estructura,
  }
}
