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
import { LOSCAA_FULL } from '../../data/loscaa_full.js'

// ─── Qué valor exige la OGUC para el cumplimiento acústico ───────────────────
// El art. 4.1.6 exige 45 **dB(A)**, y la nota al pie de toda ficha LOSCAA dice:
// "Al sumar los términos de corrección 'C' o 'Ctr' en [dB] el resultado es
// equivalente a [dBA]". Por eso la ficha ENNEGRECE `Rw + C` (y `Ln,w`) como los
// indicadores de cumplimiento: Rw+C es el valor en dBA.
//
// Consecuencia: para verificar cumplimiento se usa `rw_C`, NO el `rw` ponderado.
// (El extractor antiguo guardaba Rw+C dentro del campo `rw`, así que acertaba
// por accidente; los entrepisos que se agregaron después guardaban el Rw crudo
// y sobre-declaraban hasta 3 dB. Con el dataset completo ambos campos vienen
// rotulados y esta función elimina la ambigüedad.)
const rwCumplimiento = (item) => (item?.rw_C ?? item?.rw ?? null)

// Dataset completo extraído con `pdftotext -layout` (80 fichas, campos
// explícitos). Reemplaza a loscaa.js + loscaa_entrepisos.js, que tenían
// semánticas mezcladas en el campo `rw`.
// Se normaliza `descripcion` (el nombre corto de la ficha) porque el resto del
// motor y la UI lo consumen con ese nombre; en el dataset nuevo se llama `titulo`
// y `detalle` guarda la memoria constructiva completa.
const LOSCAA = Object.fromEntries(
  Object.entries(LOSCAA_FULL)
    .filter(([, v]) => !v.es_mejora)            // las mejoras (ΔRw/ΔLw) no son elementos
    .map(([k, v]) => [k, { ...v, descripcion: v.titulo || v.detalle || k }])
)

// Revestimientos que APORTAN mejora (ΔRw/ΔLw) sumable a un elemento base —
// familias RM.O (muro) y RP.O (piso). La ficha lo autoriza explícitamente.
export const LOSCAA_MEJORAS = Object.fromEntries(
  Object.entries(LOSCAA_FULL).filter(([, v]) => v.es_mejora)
)
import { LOSCAT_INDEX, vigenciaLOSCAT } from '../../data/loscat.js'

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
  const matchLad = texto.match(/(?:ladrillo|alba[nñ]iler[ií]a).*?(santiago\s*\d+|princesa\s*\d?|t[ií]tan\s*\w*|s9|s7)/i)
                   || texto.match(/santiago\s*(\d+)/i)
  if (matchLad || /ladrillo|alba[nñ]iler[ií]a/i.test(texto)) {
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

// ─── Tipo de elemento EFECTIVO de un ítem LOFC ───────────────────────────────
// El extractor clasificó los ítems horizontales del LOFC como tipo_elemento
// "otro" (la taxonomía extraída no tiene techumbre/entrepiso). Derivamos el tipo
// real desde el CÓDIGO DE SECCIÓN del LOFC, que es semánticamente estable:
//
//   A.*  muros, tabiques y entramados ligeros   → vertical (usa tipo_elemento crudo)
//   B.*  pilares / estructura                    → estructura
//   C.*  puertas                                 → puerta
//   D.*  losas                                   → entrepiso
//   F.*  TECHUMBRES: F.2.1 cubierta · F.2.2 cielo → techumbre
//   G.*  entrepisos                              → entrepiso
//
// Clasificar por sección (y no por palabras de la descripción) es lo correcto:
// los ítems F.2.2 se describen como "Cielo con Envigado de madera" — no dicen
// "techumbre" ni "cubierta" — y con un regex de descripción quedaban fuera,
// perdiendo el cruce válido de toda techumbre de entramado de madera (cuyo RF
// lo aporta justamente el CIELO, no la cubierta).
const SECCION_ELEM_LOFC = { B: 'estructura', C: 'puerta', D: 'entrepiso', F: 'techumbre', G: 'entrepiso' }

function tipoElementoLOFC(item) {
  const letra = String(item.codigo || '').charAt(0).toUpperCase()
  if (letra === 'A') return item.tipo_elemento || 'otro'   // verticales: taxonomía cruda sirve
  return SECCION_ELEM_LOFC[letra] || item.tipo_elemento || 'otro'
}

// ─── Espesor de la capa protectora declarada en la solución LOSCAT ───────────
// En entramados (madera/acero) el RF lo aporta la placa protectora — yeso
// cartón, fibrocemento, volcanita. El LOFC certifica un espesor mínimo de esa
// placa (item.espesor_mm). Extraemos el de la solución para poder decir si
// alcanza o cuánto falta.
function espesorProtectorLOSCAT(loscat) {
  const txt = `${loscat?.capas || ''} ${loscat?.desc || ''} ${loscat?.obs || ''}`
  const m = txt.match(/(?:yeso\s*cart[oó]n?|gyplac|volcanita|volcanboard|fibrocemento|terciado)[^0-9]{0,14}(\d{1,2}(?:[.,]\d)?)\s*(?:mm)?/i)
  return m ? parseFloat(m[1].replace(',', '.')) : null
}

// ─── Tabla de compatibilidad elemento LOSCAT ↔ LOFC ──────────────────────────
// LOSCAT.elem    →  tipo efectivo LOFC permitido (ver tipoElementoLOFC)
const ELEM_COMPATIBILIDAD_LOFC = {
  'muro':      ['muro_macizo', 'muro_albanileria', 'panel', 'tabique', 'tabique_o_panel', 'bloque'],
  'tabique':   ['tabique', 'panel', 'tabique_o_panel'],
  'techumbre': ['techumbre'],   // SOLO techumbres certificadas — nunca muros/tabiques
  'piso':      ['entrepiso'],   // SOLO entrepisos/losas certificados
  'puerta':    ['puerta'],
  'ventana':   [],  // no aplica
}

// ─── ABERTURAS (puertas y ventanas) ──────────────────────────────────────────
// El cruce de aberturas NO va por material estructural: identificarEstructuraBase
// devuelve null para "Ventana Al sin RPT + DVH 4/12/4" (no es hormigón, ladrillo
// ni entramado), y por eso ambos motores puntuaban 0 y las 50 puertas/ventanas
// del catálogo quedaban sin ningún cruce pese a existir 13 ítems LOSCAA aplicables.
// Se homologan por: material del marco/hoja + tipo de vidrio + tipo de apertura.
export function perfilAbertura(sc) {
  const t = `${sc?.desc || ''} ${sc?.capas || ''} ${sc?.obs || ''}`.toLowerCase()
  const marco =
    /composite/.test(t)                          ? 'composite' :
    /\bpvc\b/.test(t)                            ? 'pvc' :
    /alumin|ventana al\b|\bal\s+(?:rpt|sin)/.test(t) ? 'aluminio' :
    /acero|met[aá]lic/.test(t)                   ? 'acero' :
    /madera|pino|terciado|oreg[oó]n|lvl|osb/.test(t) ? 'madera' : null
  return {
    marco,
    vidrio:   /\btvh\b|triple\s*vidr/.test(t) ? 'tvh'
            : /\bdvh\b|termopanel|doble\s*vidr/.test(t) ? 'dvh'
            : /vidrio\s*simple|monol[ií]t/.test(t) ? 'simple' : null,
    apertura: /corredera/.test(t) ? 'corredera' : /proyectante/.test(t) ? 'proyectante'
            : /guillotina/.test(t) ? 'guillotina' : /abatible|batiente/.test(t) ? 'abatible' : null,
    hoja:     /maciza|s[oó]lida/.test(t) ? 'solida' : /hueca|contraplacada/.test(t) ? 'hueca'
            : /livian/.test(t) ? 'liviana' : /n[uú]cleo/.test(t) ? 'nucleo' : null,
    cortafuego: /cortafuego|corta.fuego|rf-?\d+\s*homologad/.test(t),
  }
}

// Homologación acústica de aberturas → LOSCAA (E.P.* puertas, E.V.*/I.P.* etc.)
// Criterio conservador: ante empate se elige el Rw MENOR — nunca sobre-declarar
// aislación acústica que el proyectista no puede respaldar.
function homologarAberturaLOSCAA(sc, elemSource) {
  const perfil = perfilAbertura(sc)
  if (!perfil.marco) return null

  const candidatos = Object.values(LOSCAA)
    .filter(i => rwCumplimiento(i) != null && i.elemento === elemSource)
    .map(item => {
      const pi = perfilAbertura({ desc: item.descripcion })
      // Los ítems E.V.O.* ("Vidrio simple 4 mm", "DVH 4-12-4") son el VIDRIO
      // suelto, no una ventana: su Rw es mayor que el de cualquier ventana
      // completa porque no incluye marco ni infiltraciones. Usarlos como
      // referencia sobre-declararía la aislación. Se excluyen.
      const matItem = item.material === 'otros' ? null : item.material
      if (!matItem || matItem !== perfil.marco) return { item, score: 0 }
      let score = 50
      if (elemSource === 'ventana' && perfil.vidrio && pi.vidrio && perfil.vidrio === pi.vidrio) score += 30
      if (elemSource === 'puerta'  && perfil.hoja   && pi.hoja   && perfil.hoja   === pi.hoja)   score += 30
      if (perfil.apertura && pi.apertura && perfil.apertura === pi.apertura) score += 20
      return { item, score }
    })
    // Umbral 70: coincidir SOLO en material no basta ("las dos son de madera"
    // no hace equivalentes una puerta maciza y una liviana con celosía). Se
    // exige material + al menos un atributo distintivo (vidrio/hoja/apertura).
    .filter(c => c.score >= 70)
    .sort((a, b) => (b.score !== a.score) ? b.score - a.score : rwCumplimiento(a.item) - rwCumplimiento(b.item))

  if (!candidatos.length) return null
  const mejor = candidatos[0]
  return {
    codigo: `LOSCAA ${mejor.item.codigo}`,
    codigo_base: mejor.item.codigo,
    // rw = valor de CUMPLIMIENTO (dBA, Rw+C) que exige el art. 4.1.6 OGUC.
    rw: rwCumplimiento(mejor.item),
    rw_ponderado: mejor.item.rw ?? null,   // índice ponderado sin corrección
    rw_tipo: mejor.item.rw_tipo || 'Rw',
    // Ruido de IMPACTO (solo entrepisos lo traen certificado). MENOR = MEJOR.
    lnw: mejor.item.lnw ?? null,
    lnw_tipo: mejor.item.lnw_tipo || null,
    medicion: mejor.item.medicion || null,
    masa_kg_m2: mejor.item.masa_kg_m2,
    descripcion: mejor.item.descripcion,
    intrinseco: true,
    capas_extras: [],
    fuente: `LOSCAA 2024 ED13 (${elemSource} · referencia conservadora)`,
    score: mejor.score,
  }
}

// Homologación al fuego de PUERTAS → LOFC C.2.1.*
// Regla normativa: una puerta solo se cruza cuando el PROYECTO le exige RF
// (puerta de escape, caja de escalera — OGUC). Sin exigencia no corresponde
// cruce. Y el LOFC solo certifica puertas METÁLICAS cortafuego: una puerta de
// madera no puede heredar el RF de una puerta de acero, así que si no es
// cortafuego se devuelve null y la UI pide certificación/ensayo.
function homologarPuertaLOFC(sc, reqRfMin, perfil) {
  if (!(reqRfMin > 0)) return null                                   // sin exigencia → no aplica
  if (!(perfil.cortafuego || perfil.marco === 'acero')) return null   // no es puerta cortafuego
  // La puerta debe CUMPLIR la exigencia para cruzarse: no se acredita como
  // cortafuego una puerta que declara menos RF del exigido (o que no lo declara).
  if (rfToMinutos(sc?.rf || 'F0') < reqRfMin) return null
  const cand = Object.values(LOFC)
    .filter(i => tipoElementoLOFC(i) === 'puerta' && i.rf_minutos >= reqRfMin)
    .sort((a, b) => a.rf_minutos - b.rf_minutos)   // la menor certificada que cumple
  if (!cand.length) return null
  const it = cand[0]
  return {
    codigo: `LOFC ${it.codigo}`,
    codigo_base: it.codigo,
    rf: it.rf,
    rf_minutos: it.rf_minutos,
    descripcion: it.descripcion,
    intrinseco: rfToMinutos(sc.rf || 'F0') >= it.rf_minutos,
    capas_extras: [],
    fuente: `LOFC Ed.17 ${it.seccion} (puerta cortafuego certificada)`,
  }
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

  // ── Filtro estricto por tipo de elemento (no asociar muro a techumbre, etc.) ──
  // Usa el tipo EFECTIVO (tipoElementoLOFC), no el crudo del extractor.
  if (elemSource) {
    const tiposPermitidos = ELEM_COMPATIBILIDAD_LOFC[elemSource]
    if (tiposPermitidos && tiposPermitidos.length === 0) return 0  // no aplica
    if (tiposPermitidos && !tiposPermitidos.includes(tipoElementoLOFC(item))) return 0
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
  // RF declarado por la PROPIA solución — es el ANCLA del cruce LOFC. El
  // requerimiento del proyecto (reqRfMin) NO debe elegir el ítem homologado:
  // filtrar el pool por él inflaba la RF al escalón exigido (F30→F60→F90…) y la
  // marcaba como intrínseca, pintando de verde un RF que la construcción no
  // sostiene. El requerimiento se evalúa aguas abajo (cumple/capas_extras).
  // Criterio conservador, igual que el lado acústico: nunca sobre-declarar.
  const baseRfMin = rfToMinutos(loscat?.rf)
  const estructura = identificarEstructuraBase(loscat)
  if (!estructura) return null

  const elemSource = loscat?.elem || null

  // 0. Aberturas: ruta propia (no tienen "estructura base" reconocible).
  //    Ventanas: el LOFC no las certifica → nunca hay cruce (no es un fallo).
  //    Puertas: solo si el proyecto exige RF y la puerta es cortafuego.
  if (elemSource === 'ventana') return null
  if (elemSource === 'puerta') return homologarPuertaLOFC(loscat, reqRfMin, perfilAbertura(loscat))

  // 1. Intentar primero con tabla macizos (más confiable) — SOLO MUROS.
  //    Las tablas A.1.x del LOFC (HA, bloques, madera maciza, ladrillo) son de
  //    muros/elementos verticales: no acreditan techumbres ni pisos. Antes se
  //    aplicaban también a techumbre/piso y generaban códigos de muro inválidos.
  if (elemSource === 'muro' || !elemSource) {
    const macizo = homologarMacizo(estructura, baseRfMin)
    if (macizo) return macizo
  }

  // 2. Buscar en items LOFC individuales por score (con filtro de elemento).
  //    Para cada candidato evaluamos si la PLACA PROTECTORA de la solución
  //    alcanza el espesor certificado del ítem. Si no alcanza, el cruce sigue
  //    siendo válido pero condicionado: se declara la capa a reforzar en
  //    `capas_extras` en vez de descartar el ítem (o peor, presentarlo como si
  //    ya se cumpliera).
  const espSol = espesorProtectorLOSCAT(loscat)
  // El campo espesor_mm del LOFC es, en algunos ítems, el espesor de la PLACA
  // protectora (12,5 mm) y en otros el espesor TOTAL del complejo (p. ej.
  // 134,6 mm) — la extracción automática no los distingue. El faltante de placa
  // solo tiene sentido contra una placa: si espesor_mm excede un rango creíble
  // de placa (≤ MAX_PLACA_MM), no se puede derivar un déficit de revestimiento,
  // así que no se genera refuerzo (evita "engrosar la placa a 134,6 mm").
  const MAX_PLACA_MM = 40
  const candidatos = Object.values(LOFC)
    // Sin pre-filtro por el requerimiento del proyecto: el cruce se ancla a la
    // CONSTRUCCIÓN y al RF declarado, nunca al escalón exigido (evita inflar).
    .map(item => {
      const score = scoreLOFC(item, estructura, loscat, elemSource)
      // faltante > 0 → hay que engrosar la placa para acogerse a ese ítem
      const faltante = (espSol != null && item.espesor_mm > 0 && item.espesor_mm <= MAX_PLACA_MM && espSol < item.espesor_mm)
        ? Math.round((item.espesor_mm - espSol) * 10) / 10
        : 0
      return { item, score, faltante }
    })
    .filter(c => c.score >= 60)  // umbral más alto = match más confiable
    .sort((a, b) => {
      // 1) Preferir el ítem certificado EN EL MISMO escalón de RF declarado:
      //    es el único que acredita la RF de la solución de forma intrínseca.
      //    Un entramado F30 se cruza con un ítem F30 (aunque exija engrosar la
      //    placa → se declara en capas_extras) antes que con el F15 de abajo o
      //    el F60 cortafuego de arriba. Esto mantiene la guía de refuerzo
      //    "engrosa la placa para alcanzar tu F30" sin inflar al escalón exigido.
      const ea = (a.item.rf_minutos === baseRfMin) ? 0 : 1
      const eb = (b.item.rf_minutos === baseRfMin) ? 0 : 1
      if (ea !== eb) return ea - eb
      // 2) Dentro del mismo escalón, preferir el que YA cumple sin engrosar
      if ((a.faltante > 0) !== (b.faltante > 0)) return a.faltante - b.faltante
      // 3) Score (similitud constructiva)
      if (b.score !== a.score) return b.score - a.score
      // 4) RF más CERCANO al declarado (nunca saltar de escalón por capricho).
      const da = Math.abs(a.item.rf_minutos - baseRfMin)
      const db = Math.abs(b.item.rf_minutos - baseRfMin)
      if (da !== db) return da - db
      // 5) A igual cercanía, el MENOR RF (nunca sobre-declarar)
      return a.item.rf_minutos - b.item.rf_minutos
    })

  if (candidatos.length === 0) return null

  const mejor = candidatos[0]
  const capasExtras = mejor.faltante > 0 ? [{
    tipo: 'refuerzo_protector',
    descripcion: `Engrosar la placa protectora a ${mejor.item.espesor_mm} mm (la solución declara ${espSol} mm) para acogerse a ${mejor.item.codigo}`,
    de_mm: espSol,
    a_mm: mejor.item.espesor_mm,
    falta_mm: mejor.faltante,
  }] : []
  return {
    codigo: `LOFC ${mejor.item.codigo}`,
    codigo_base: mejor.item.codigo,
    rf: mejor.item.rf,
    rf_minutos: mejor.item.rf_minutos,
    descripcion: mejor.item.descripcion,
    // Intrínseco SOLO cuando hay un ítem LOFC certificado EN EL MISMO escalón
    // de RF que declara la solución, sin engrosar capas: ahí sí la RF está
    // acreditada por un ensayo de una construcción equivalente. Si el ítem más
    // parecido queda por encima (no se logra sin refuerzo/ensayo) o por debajo
    // (el equivalente certificado da menos que lo declarado), el cruce es
    // REFERENCIAL — se muestra el código pero NO en verde, y pide ensayo NCh935.
    intrinseco: capasExtras.length === 0 && mejor.item.rf_minutos === baseRfMin,
    capas_extras: capasExtras,
    espesor_certificado_mm: mejor.item.espesor_mm || null,
    espesor_solucion_mm: espSol,
    fuente: `LOFC Ed.17 ${mejor.item.seccion} (item)`,
    score: mejor.score,
  }
}

// ─── RF máximo que la construcción ACTUAL (modificada) certifica ──────────────
// A diferencia de homologarLOFC (que se ancla al RF DECLARADO, conservador para
// el catálogo sin tocar), esta función responde "¿qué RF acredita lo que hay
// dibujado AHORA?". La usa la pestaña Fuego cuando el usuario modifica las capas
// (engrosar/añadir placa protectora): así la mejora SÍ sube el veredicto.
//
// Reglas:
//  · Másicos (HA, albañilería, bloque, CLT): RF intrínseco real por masa/espesor
//    (tabla de macizos) — un radier/losa más grueso sube solo.
//  · Entramado ligero: el ítem LOFC de MAYOR RF cuya construcción calza
//    (score ≥ 60) y cuya placa protectora certificada está REALMENTE satisfecha
//    por la placa de la solución (espSol ≥ espesor_mm del ítem).
//
// Guarda anti-dato-sucio: solo cuentan ítems con espesor de PLACA creíble
// (0 < espesor_mm ≤ MAX_PLACA_MM). Los ítems cuyo espesor_mm es el total del
// complejo (p. ej. 134,6 mm) NO pueden inflar el RF: sin una comparación de
// placa válida, no se acreditan. Devuelve null si no hay calce certificado.
export function rfMaximoCertificado(loscat) {
  const estructura = identificarEstructuraBase(loscat)
  if (!estructura) return null
  const elemSource = loscat?.elem || null
  if (elemSource === 'ventana' || elemSource === 'puerta') return null

  // Másicos: su RF es intrínseco a la masa (reqRfMin=0 → el mayor que da su espesor).
  if (elemSource === 'muro' || !elemSource) {
    const macizo = homologarMacizo(estructura, 0)
    if (macizo) return macizo
  }

  const espSol = espesorProtectorLOSCAT(loscat)
  const MAX_PLACA_MM = 40
  // Piso de plausibilidad de la PLACA protectora por escalón de RF (mm). Base:
  // ingeniería de fuego — una placa de yeso cartón aporta ~15–20 min por cada
  // ~12,5 mm; un F60 de entramado típico lleva doble placa (~25 mm) o placa RF
  // gruesa. El LOFC a veces guarda un espesor parcial irreal (p. ej. F60 con
  // 11,1 mm); si la placa certificada es más delgada que este piso, se descarta
  // como DATO SUCIO para no sobre-certificar (un tabique de una placa de 13 mm
  // NO es F60). Para F120+ no hay entramado ligero realista → esos van por la
  // vía de macizos, no por ítem.
  const PLACA_MIN_POR_RF = { 15: 9, 30: 12.5, 60: 25, 90: 38 }
  const cand = Object.values(LOFC)
    .map(item => ({ item, score: scoreLOFC(item, estructura, loscat, elemSource) }))
    .filter(({ item, score }) => {
      if (score < 60) return false
      if (espSol == null) return false
      if (!(item.espesor_mm > 0 && item.espesor_mm <= MAX_PLACA_MM)) return false
      const piso = PLACA_MIN_POR_RF[item.rf_minutos]
      if (piso != null && item.espesor_mm < piso) return false  // placa implausible → dato sucio
      return espSol >= item.espesor_mm       // la placa de la solución YA satisface la certificada
    })
    .sort((a, b) => b.item.rf_minutos - a.item.rf_minutos)   // el MAYOR RF certificado

  if (!cand.length) return null
  const m = cand[0]
  return {
    codigo: `LOFC ${m.item.codigo}`,
    codigo_base: m.item.codigo,
    rf: m.item.rf,
    rf_minutos: m.item.rf_minutos,
    descripcion: m.item.descripcion,
    intrinseco: true,
    capas_extras: [],
    espesor_certificado_mm: m.item.espesor_mm,
    espesor_solucion_mm: espSol,
    fuente: `LOFC Ed.17 ${m.item.seccion} (máx. certificado por capas modificadas)`,
    score: m.score,
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
  const elemSource = loscat?.elem || null

  // Aberturas: ruta propia por marco/vidrio/hoja (ver homologarAberturaLOSCAA).
  if (elemSource === 'puerta' || elemSource === 'ventana') {
    return homologarAberturaLOSCAA(loscat, elemSource)
  }

  const estructura = identificarEstructuraBase(loscat)
  if (!estructura) return null

  const reqRwNum = parseFloat(reqRw) || 0

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
    // rw = valor de CUMPLIMIENTO (dBA, Rw+C) que exige el art. 4.1.6 OGUC.
    rw: rwCumplimiento(mejor.item),
    rw_ponderado: mejor.item.rw ?? null,   // índice ponderado sin corrección
    rw_tipo: mejor.item.rw_tipo || 'Rw',
    // Ruido de IMPACTO (solo entrepisos lo traen certificado). MENOR = MEJOR.
    lnw: mejor.item.lnw ?? null,
    lnw_tipo: mejor.item.lnw_tipo || null,
    medicion: mejor.item.medicion || null,
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

  // 1. Térmico: SOLO se declara LOSCAT cuando la solución cita un código
  //    LOSCAT real en desc/obs Y ese código existe en el índice oficial
  //    Ed.14 (src/data/loscat.js). Sin ambas condiciones, el U es del
  //    catálogo Talora (calculado/referencial) y se rotula como tal —
  //    nunca presentar un valor calculado como ítem oficial.
  const citaLOSCAT = /LOSCAT\s*[0-9]|\(LOSCAT/i.test(`${loscat.desc || ''} ${loscat.obs || ''}`)
  const enEd14 = !!LOSCAT_INDEX[loscat.cod]
  const vig = enEd14 ? vigenciaLOSCAT(loscat.cod) : null
  const vigTxt = vig === 'vencida' ? ' · ⛔ VIGENCIA VENCIDA'
    : vig === 'por_vencer' ? ` · ⚠ vence ${LOSCAT_INDEX[loscat.cod].vigencia}`
    : ''
  const termico = (citaLOSCAT && enEd14) ? {
    codigo: `LOSCAT ${loscat.cod}`,
    codigo_base: loscat.cod,
    u: parseFloat(loscat.u) || null,
    descripcion: loscat.desc,
    oficial: true,
    vigencia: LOSCAT_INDEX[loscat.cod].vigencia || null,
    fuente: `LOSCAT Ed.14 2026 — verificado en índice oficial${vigTxt}`,
  } : {
    codigo: `${loscat.cod} — catálogo Talora`,
    codigo_base: loscat.cod,
    u: parseFloat(loscat.u) || null,
    descripcion: loscat.desc,
    oficial: false,
    vigencia: null,
    fuente: citaLOSCAT
      ? 'Cita LOSCAT no encontrada en Ed.14 — verificar (posible retiro del listado).'
      : 'U calculado/referencial — no es ítem LOSCAT. Verificar con EE o ensayo.',
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
