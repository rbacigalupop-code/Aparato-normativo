// ─────────────────────────────────────────────────────────────────────────────
// revit-import.js — Vía de RETORNO del puente Talora ⇄ Revit (RevitMind).
//
// Lee el estado real del modelo (caras envolventes + vanos) y emite veredictos
// DS N°15 por elemento, indexados por `revit_uid` (UniqueId de Revit). NUNCA
// empareja por nombre: la identidad estable es `revit_uid`.
//
// Esta capa es un ADAPTADOR: toda la lógica normativa se reutiliza tal cual de
//   · ds15_ventanas.js  → maxVidriadoVentana / cumpleVentana (Tabla 3 oficial)
//   · data.js           → PUERTA_U (U-máx opaco puertas, Tabla 1)
// No toca el flujo de 1 vía (revit-export.js) ni ningún engine existente.
//
// Contrato de ENTRADA (revit_to_talora.json), generado desde Revit:
//   { proyecto:{ comuna, zona_termica },
//     caras:[ { revit_uid, azimuth_deg?, orientacion?:'N|S|E|O', area_m2, muro_uid } ],
//     vanos:[ { revit_uid, tipo:'ventana|puerta', area_m2, cara_uid,
//               ancho_m, alto_m, U_actual? } ] }
//   Orientación de la cara: se prefiere `azimuth_deg` (normal del muro desde el
//   norte geográfico, Tabla 4); `orientacion` (letra) es el fallback.
//
// Contrato de SALIDA (talora_to_revit.json):
//   { proyecto:{ comuna, zona_termica, ogt:{ pct_vidriado, limite_pct, cumple } },
//     caras:[ { revit_uid, orientacion, pct_vidriado, limite_pct, cumple } ],
//     vanos:[ { revit_uid, tipo, U_exigido, zona_termica, cumple, mensaje } ],
//     generado }
//
// DECISIONES normativas (confirmadas):
//   · OGT: se devuelve el veredicto global (envolvente completa) además del
//     veredicto por cara.
//   · U por cara: PEOR CASO (U más alto de las ventanas de la cara) para el
//     límite de % vidriado de esa cara (conservador).
//   · Puertas: regla propia (U ≤ 1.70 opaco, B-I; zona A sin exigencia), NO la
//     Tabla 3 de % vidriado. No cuentan para el % vidriado de la cara.
// ─────────────────────────────────────────────────────────────────────────────

import {
  maxVidriadoVentana,
  cumpleVentana,
  UMBRALES_U_VENTANA,
} from '../../data/ds15_ventanas.js'
import { PUERTA_U } from '../../data.js'

// ── Normalización de zona térmica ──────────────────────────────────────────────
// Talora opera con letras A–I (DS N°15 2024). Aceptamos la letra directamente,
// o un número 1–9 (1→A … 9→I) por si Revit lo envía numérico.
const LETRAS_ZONA = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
export function normalizarZona(z) {
  if (z == null) return null
  const s = String(z).trim().toUpperCase()
  if (/^[A-I]$/.test(s)) return s
  const n = parseInt(s, 10)
  if (Number.isInteger(n) && n >= 1 && n <= 9) return LETRAS_ZONA[n - 1]
  return null
}

// ── Normalización de orientación ───────────────────────────────────────────────
// La Tabla 3 usa N · OP (Oriente-Poniente combinados) · S. Oriente y Poniente
// (E/O/W) caen en la MISMA columna OP.
const MAPA_ORIENT = {
  N: 'N', NORTE: 'N',
  S: 'S', SUR: 'S',
  E: 'OP', O: 'OP', W: 'OP', OP: 'OP', EW: 'OP',
  ORIENTE: 'OP', PONIENTE: 'OP', ESTE: 'OP', OESTE: 'OP',
}
export function normalizarOrientacion(o) {
  if (o == null) return null
  return MAPA_ORIENT[String(o).trim().toUpperCase()] ?? null
}

// ── Orientación desde azimut (Tabla 4, DS N°15, art. 4.1.10 OGUC) ───────────────
// La orientación predominante de un muro se determina por su dirección NORMAL en
// grados sexagesimales, con 0° = norte geográfico. Tabla 4:
//   Norte     315° → 45°
//   Oriente    45° → 135°   ┐ ambos caen en la columna OP de la Tabla 3
//   Poniente  225° → 315°   ┘
//   Sur       135° → 225°
// Devuelve la columna de la Tabla 3: 'N' | 'OP' | 'S'.
//
// Bordes (45/135/225/315 = NE/SE/SO/NO): se asignan al sector MÁS RESTRICTIVO de
// los dos adyacentes (en el hemisferio sur la permisividad decrece N → OP → S),
// criterio conservador para el expediente. Resultado de los límites: 45→OP,
// 135→S, 225→S, 315→OP.
export function orientacionDesdeAzimut(deg) {
  const n = parseFloat(deg)
  if (!Number.isFinite(n)) return null
  let a = n % 360
  if (a < 0) a += 360                    // normaliza a [0, 360)
  if (a >= 45 && a < 135) return 'OP'    // Oriente  [45, 135)
  if (a >= 135 && a <= 225) return 'S'   // Sur      [135, 225]
  if (a > 225 && a <= 315) return 'OP'   // Poniente (225, 315]
  return 'N'                             // Norte    (315, 360) ∪ [0, 45)
}

// Orientación efectiva de una cara: prioriza `azimuth_deg` (Tabla 4) y cae en
// `orientacion` (letra N/S/E/O) por retrocompatibilidad.
export function orientacionDeCara(cara) {
  if (cara == null) return null
  if (cara.azimuth_deg != null && cara.azimuth_deg !== '') {
    const o = orientacionDesdeAzimut(cara.azimuth_deg)
    if (o) return o
  }
  return normalizarOrientacion(cara.orientacion)
}

// ── Inverso de la Tabla 3: U máxima admisible a un % vidriado dado ──────────────
// Como a mayor U el % permitido baja (límite monótono no creciente en U), la U
// máxima admisible para un % real es el mayor bracket cuyo límite ≥ % real.
// Devuelve el valor de U [W/m²K], o 0 si ni el mejor vidrio (U más bajo) admite
// ese % (→ vano/cara no admisible a ese % de vidriado).
export function maxUVentanaParaPct(zona, orientacion, pctReal) {
  const pct = parseFloat(pctReal) || 0
  let best = 0
  for (const u of UMBRALES_U_VENTANA) {
    const lim = maxVidriadoVentana(zona, u, orientacion)
    if (lim != null && pct <= lim) best = u
  }
  return best
}

const num = (v) => (v == null || v === '' || !Number.isFinite(parseFloat(v)) ? null : parseFloat(v))
const r1 = (v) => Math.round(v * 10) / 10

/**
 * Procesa la entrada de Revit y emite los veredictos DS N°15.
 * @param {object} entrada  revit_to_talora.json (ver contrato arriba)
 * @returns {object} talora_to_revit.json
 */
export function procesarEntradaRevit(entrada) {
  const proy = entrada?.proyecto || {}
  const zona = normalizarZona(proy.zona_termica)
  const carasIn = Array.isArray(entrada?.caras) ? entrada.caras : []
  const vanosIn = Array.isArray(entrada?.vanos) ? entrada.vanos : []

  // Índice de caras por revit_uid + agrupación de vanos por cara_uid.
  const caraPorUid = new Map()
  for (const c of carasIn) {
    if (c?.revit_uid != null) caraPorUid.set(c.revit_uid, c)
  }
  const vanosDeCara = new Map() // cara_uid → vanos[]
  for (const v of vanosIn) {
    const k = v?.cara_uid
    if (!vanosDeCara.has(k)) vanosDeCara.set(k, [])
    vanosDeCara.get(k).push(v)
  }

  // ── Veredictos por cara ──────────────────────────────────────────────────────
  const carasOut = carasIn.map((c) => {
    const orient = orientacionDeCara(c)
    const area = num(c.area_m2) || 0
    const vanos = vanosDeCara.get(c.revit_uid) || []
    const ventanas = vanos.filter((v) => String(v.tipo).toLowerCase() === 'ventana')

    // % vidriado = Σ área ventanas / área cara (las puertas no suman: son opacas).
    const areaVent = ventanas.reduce((a, v) => a + (num(v.area_m2) || 0), 0)
    const pct = area > 0 ? r1((areaVent / area) * 100) : 0

    // U de la cara = PEOR CASO (U más alto) entre sus ventanas con U conocido.
    const usConocidos = ventanas.map((v) => num(v.U_actual)).filter((u) => u != null && u > 0)
    const uPeor = usConocidos.length ? Math.max(...usConocidos) : null

    let limite = null
    let cumple = null
    if (zona && orient && uPeor != null) {
      const ev = cumpleVentana(zona, uPeor, orient, pct)
      if (ev) {
        limite = ev.maxPct
        cumple = ev.cumple
      }
    }
    return {
      revit_uid: c.revit_uid,
      orientacion: orient, // ya mapeada a N/OP/S
      pct_vidriado: pct,
      limite_pct: limite,
      cumple,
    }
  })

  // ── Veredictos por vano ──────────────────────────────────────────────────────
  const vanosOut = vanosIn.map((v) => {
    const tipo = String(v.tipo || '').toLowerCase()
    const uAct = num(v.U_actual)
    const cara = caraPorUid.get(v.cara_uid)
    const orient = cara ? orientacionDeCara(cara) : null

    const base = { revit_uid: v.revit_uid, tipo, zona_termica: zona }

    if (!zona) {
      return { ...base, U_exigido: null, cumple: null, mensaje: 'Zona térmica no reconocida en la entrada.' }
    }

    // ── PUERTA: U-máx opaco (Tabla 1). Zona A sin exigencia. No usa % vidriado. ──
    if (tipo === 'puerta') {
      const uMax = PUERTA_U[zona] ?? null
      if (uMax == null) {
        return { ...base, U_exigido: null, cumple: true, mensaje: `Zona ${zona}: sin exigencia de U para puertas.` }
      }
      if (uAct == null) {
        return { ...base, U_exigido: uMax, cumple: null, mensaje: `Falta U_actual de la puerta (exigido ≤ ${uMax}).` }
      }
      const ok = uAct <= uMax + 1e-9
      return {
        ...base,
        U_exigido: uMax,
        cumple: ok,
        mensaje: ok
          ? `Puerta cumple: U ${uAct} ≤ ${uMax} W/m²K.`
          : `Puerta no cumple: U ${uAct} > ${uMax} W/m²K.`,
      }
    }

    // ── VENTANA: trade-off Tabla 3 (% vidriado ↔ U ↔ orientación) ──────────────
    if (!cara || !orient) {
      return { ...base, U_exigido: null, cumple: null, mensaje: 'Ventana sin cara asociada (cara_uid no encontrado).' }
    }
    const caraOut = carasOut.find((c) => c.revit_uid === cara.revit_uid)
    const pctCara = caraOut ? caraOut.pct_vidriado : 0
    // U_exigido = U máxima admisible al % vidriado real de su cara.
    const uExigido = maxUVentanaParaPct(zona, orient, pctCara)

    if (uAct == null) {
      return {
        ...base,
        U_exigido: uExigido,
        cumple: null,
        mensaje: `Falta U_actual de la ventana (a ${pctCara}% vidriado en cara ${orient}, U máx admisible ${uExigido} W/m²K).`,
      }
    }
    const ev = cumpleVentana(zona, uAct, orient, pctCara)
    const ok = ev ? ev.cumple : null
    return {
      ...base,
      U_exigido: uExigido,
      cumple: ok,
      mensaje:
        ok == null
          ? 'No evaluable con los datos entregados.'
          : ok
          ? `Ventana cumple: a U ${uAct} el máx de vidriado (cara ${orient}) es ${ev.maxPct}% y hay ${pctCara}%.`
          : `Ventana no cumple: a U ${uAct} el máx de vidriado (cara ${orient}) es ${ev.maxPct}% pero hay ${pctCara}%.`,
    }
  })

  // ── Veredicto GLOBAL TOTAL (OGT) sobre la envolvente completa ──────────────────
  const areaTotalCaras = carasIn.reduce((a, c) => a + (num(c.area_m2) || 0), 0)
  const todasVentanas = vanosIn.filter((v) => String(v.tipo).toLowerCase() === 'ventana')
  const areaVentTotal = todasVentanas.reduce((a, v) => a + (num(v.area_m2) || 0), 0)
  const pctGlobal = areaTotalCaras > 0 ? r1((areaVentTotal / areaTotalCaras) * 100) : 0
  const usGlobal = todasVentanas.map((v) => num(v.U_actual)).filter((u) => u != null && u > 0)
  const uGlobalPeor = usGlobal.length ? Math.max(...usGlobal) : null

  let ogt = { pct_vidriado: pctGlobal, limite_pct: null, cumple: null }
  if (zona && uGlobalPeor != null) {
    const limOgt = maxVidriadoVentana(zona, uGlobalPeor, 'OGT')
    if (limOgt != null) ogt = { pct_vidriado: pctGlobal, limite_pct: limOgt, cumple: pctGlobal <= limOgt }
  }

  return {
    proyecto: {
      comuna: proy.comuna ?? null,
      zona_termica: zona,
      ogt,
    },
    caras: carasOut,
    vanos: vanosOut,
    generado: new Date().toISOString(),
  }
}
