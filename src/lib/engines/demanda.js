// ─────────────────────────────────────────────────────────────────────────────
// demanda.js — Motor de balance térmico anual de la vivienda.
//
// Calcula:
//   · Pérdidas por envolvente (Σ U·A·HDD18)
//   · Pérdidas por infiltración (n × V × Cp × HDD18)
//   · Ganancias solares por orientación (ventanas)
//   · Ganancias internas (ocupantes, iluminación, equipos)
//   · Balance térmico anual neto → demanda calefacción
//   · Análisis sobrecalentamiento verano (ganancias > pérdidas)
//   · Calificación tipo CEV aproximada (A+ → G)
//
// Método: balance estacionario simplificado tipo ISO 13790 / CEN
// (cuasi-estacionario mensual aproximado a anual). Es referencial — para
// certificación CEV oficial se requiere CCTE_CL.
// ─────────────────────────────────────────────────────────────────────────────

import { obtenerHDD18 } from '../../data/grados_dia.js'
import { obtenerCDD26, obtenerTverano, obtenerRadiacionVertical, FRACCION_VERANO, calificacionPorDemanda } from '../../data/clima_anual.js'
import { obtenerZonaClimaComuna } from '../../data/comunas_chile.js'
import { obtenerTextMes } from '../../data/clima_mensual.js'

// Constantes físicas
const Cp_AIRE = 0.34  // Wh/m³·K — calor específico del aire (ρ·Cp / 3600)

// Ganancias internas estándar (W/m²) — convención CEV / CTE-HE
const GANANCIAS_INTERNAS_W_M2 = 4.5

// Capacidad térmica interna Cm por clase de masa (ISO 13790 Tabla 12),
// en J/(K·m²) de superficie útil. Mapea las clases de la UI:
//   baja  = 'light'  (steel-frame, drywall)
//   media = 'medium' (mixta, ladrillo)
//   alta  = 'heavy'  (hormigón, adobe, piedra)
export const CM_POR_MASA = { baja: 110000, media: 165000, alta: 260000 }

/**
 * Factor de utilización de ganancias η — fórmula EXACTA ISO 13790 §12.2.1.1
 * (método estacional: a0=0.8, τ0=30 h).
 *   γ = ganancias/pérdidas · a = a0 + τ/τ0 · τ = Cm/(3600·H) [h]
 *   η = (1−γ^a)/(1−γ^(a+1))   (γ≠1)   ·   η = a/(a+1)   (γ=1)
 * Más masa térmica → mayor τ → mayor a → más ganancias aprovechadas.
 * @param {number} gamma - razón ganancias/pérdidas (>0)
 * @param {number} a     - parámetro numérico adimensional (>0)
 * @returns {number} η en [0,1]
 */
export function etaUtilizacion13790(gamma, a) {
  if (!(gamma > 0)) return 1            // sin ganancias: η irrelevante
  if (!(a > 0)) a = 1
  if (Math.abs(gamma - 1) < 1e-6) return a / (a + 1)
  const eta = (1 - Math.pow(gamma, a)) / (1 - Math.pow(gamma, a + 1))
  return Math.min(1, Math.max(0, eta))
}

// Factor solar (g) típico por tipo de vidrio
export const FACTOR_SOLAR_VIDRIOS = {
  monolitico_4mm:     0.85,
  monolitico_6mm:     0.82,
  dvh_4_12_4:         0.75,
  dvh_low_e:          0.55,
  dvh_low_e_argon:    0.50,
  triple_low_e:       0.45,
  default:            0.70,
}

// U de ventana completa Uw [W/m²K] (vidrio + marco típico) por tipo de vidrio.
// Alimenta la pérdida conductiva por ventanas en el balance (ISO 13790 H_tr).
export const U_VENTANA_VIDRIOS = {
  monolitico_4mm:     5.8,
  monolitico_6mm:     5.7,
  dvh_4_12_4:         2.8,
  dvh_low_e:          1.9,
  dvh_low_e_argon:    1.6,
  triple_low_e:       1.1,
  default:            3.0,
}

// ═════════════════════════════════════════════════════════════════════════════
// PÉRDIDAS (invierno)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Pérdidas por envolvente: Σ (U × A × HDD18 × 24 / 1000)
 *
 * @param {Array<{U: number, area: number}>} elementos
 * @param {number} hdd18
 * @returns {number} kWh/año
 */
export function perdidasEnvolvente(elementos, hdd18) {
  if (!Array.isArray(elementos) || !hdd18) return 0
  let q = 0
  for (const e of elementos) {
    const u = parseFloat(e.U) || 0
    const a = parseFloat(e.area) || 0
    if (u > 0 && a > 0) q += u * a * hdd18 * 24 / 1000
  }
  return Math.round(q)
}

/**
 * Pérdidas por puentes térmicos lineales: ΣΨ·L × HDD18 × 24 / 1000
 * @param {number} psiLTotal - suma de Ψ·L en W/K (de calcularSumaPsiL)
 * @param {number} hdd18
 * @returns {number} kWh/año
 */
export function perdidasPuentesTermicos(psiLTotal, hdd18) {
  if (!psiLTotal || !hdd18) return 0
  return Math.round(psiLTotal * hdd18 * 24 / 1000)
}

/**
 * Pérdidas por infiltración: n × V × Cp × HDD18 × 24 / 1000
 *
 * @param {number} volumen_m3 - volumen interior calefaccionado
 * @param {number} ach        - renovaciones de aire por hora (h⁻¹)
 *                              0.5 = vivienda nueva hermética
 *                              0.8 = vivienda nueva estándar
 *                              1.2 = vivienda antigua
 *                              2.0 = vivienda con grietas, antiguas mal selladas
 * @param {number} hdd18
 */
export function perdidasInfiltracion(volumen_m3, ach, hdd18) {
  if (!volumen_m3 || !ach || !hdd18) return 0
  return Math.round(ach * volumen_m3 * Cp_AIRE * hdd18 * 24 / 1000)
}

// ═════════════════════════════════════════════════════════════════════════════
// GANANCIAS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Ganancias solares anuales por orientación.
 *
 * @param {{N,E,S,O}} areasVidrio - m² de ventana por orientación
 * @param {number} factorSolar    - g del vidrio (0..1)
 * @param {string} zonaClima
 * @param {number} factorProteccion - 0..1 (1 sin protección, 0.5 con aleros, etc.)
 * @returns {{total: number, porOrient: object}}
 */
export function gananciasSolares(areasVidrio, factorSolar, zonaClima, factorProteccion = 1) {
  const rad = obtenerRadiacionVertical(zonaClima)
  const orient = ['N', 'E', 'S', 'O']
  const porOrient = {}
  let total = 0
  for (const o of orient) {
    const a = parseFloat(areasVidrio?.[o]) || 0
    const g = a * factorSolar * rad[o] * factorProteccion
    porOrient[o] = Math.round(g)
    total += g
  }
  return { total: Math.round(total), porOrient }
}

/**
 * Ganancias internas anuales.
 * @param {number} areaUtil_m2
 * @param {number} wm2 - W/m² promedio (default 4.5)
 */
export function gananciasInternas(areaUtil_m2, wm2 = GANANCIAS_INTERNAS_W_M2) {
  if (!areaUtil_m2) return 0
  return Math.round(wm2 * areaUtil_m2 * 8760 / 1000)
}

// ═════════════════════════════════════════════════════════════════════════════
// BALANCE TÉRMICO INVIERNO
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Demanda térmica neta de calefacción.
 *
 * @param {object} params
 *   elementos:       Array de envolvente [{U, area}]
 *   areaUtil:        m² útiles
 *   volumen:         m³ calefaccionados (default areaUtil × 2.5)
 *   ach:             renovaciones aire (default 0.8)
 *   areasVidrio:     {N, E, S, O}
 *   factorSolar:     g del vidrio (default 0.70)
 *   factorProteccion: 0..1 (default 1)
 *   gananciasInternasWm2: default 4.5
 *   comunaKey, zonaClima
 */
export function balanceTermicoAnual({
  elementos = [],
  areaUtil = 100,
  volumen = null,
  ach = 0.8,
  areasVidrio = { N: 0, E: 0, S: 0, O: 0 },
  factorSolar = 0.70,
  factorProteccion = 1,
  gananciasInternasWm2 = GANANCIAS_INTERNAS_W_M2,
  masaTermica = 'media',
  psiLTotal = 0,
  comunaKey = null,
  zonaClima = null,
}) {
  const v = volumen || areaUtil * 2.5
  const hdd18 = obtenerHDD18(comunaKey, zonaClima)
  const zonaEf = zonaClima || obtenerZonaClimaComuna(comunaKey) || 'D'

  const pEnv = perdidasEnvolvente(elementos, hdd18)
  const pPT  = perdidasPuentesTermicos(psiLTotal, hdd18)
  const pInf = perdidasInfiltracion(v, ach, hdd18)
  const gSol = gananciasSolares(areasVidrio, factorSolar, zonaEf, factorProteccion)
  const gInt = gananciasInternas(areaUtil, gananciasInternasWm2)

  // ISO 13790: H_tr = ΣU·A + ΣΨ·L ; H_ve = Cp·n·V
  const perdidasTot = pEnv + pPT + pInf
  const gananciasTot = gSol.total + gInt
  const H_env = elementos.reduce((s, e) => {
    const u = parseFloat(e.U) || 0, a = parseFloat(e.area) || 0
    return (u > 0 && a > 0) ? s + u * a : s
  }, 0)
  const H = H_env + (psiLTotal || 0) + Cp_AIRE * ach * v
  // Constante de tiempo τ [h] = Cm/(3600·H); Cm de la clase de masa térmica
  const cmM2 = CM_POR_MASA[masaTermica] ?? CM_POR_MASA.media
  const tau = H > 0 ? (cmM2 * areaUtil) / (3600 * H) : 0
  const aNum = 0.8 + tau / 30                      // método estacional: a0=0.8, τ0=30 h
  const gamma = gananciasTot / Math.max(1, perdidasTot)
  const factorUtilizacion = etaUtilizacion13790(gamma, aNum)
  const gananciasUtiles = gananciasTot * factorUtilizacion

  const demandaNeta = Math.max(0, Math.round(perdidasTot - gananciasUtiles))
  const kwhM2Anio = areaUtil > 0 ? Math.round(demandaNeta / areaUtil) : 0
  const calificacion = calificacionPorDemanda(kwhM2Anio)

  return {
    perdidas: {
      envolvente:      pEnv,
      puentesTermicos: pPT,
      infiltracion:    pInf,
      total:           perdidasTot,
    },
    ganancias: {
      solares:        gSol.total,
      solaresPorOrient: gSol.porOrient,
      internas:       gInt,
      total:          gananciasTot,
      utilizadas:     Math.round(gananciasUtiles),
      factorUtilizacion: Math.round(factorUtilizacion * 100) / 100,
    },
    iso13790: {
      gamma: Math.round(gamma * 100) / 100,
      tauHoras: Math.round(tau * 10) / 10,
      aNum: Math.round(aNum * 100) / 100,
      H_WK: Math.round(H * 10) / 10,
      psiLTotal: Math.round((psiLTotal || 0) * 100) / 100,
    },
    demandaNeta,
    kwhM2Anio,
    calificacion,
    hdd18,
    parametros: { areaUtil, volumen: v, ach, factorSolar, factorProteccion, masaTermica },
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MÉTODO MENSUAL (ISO 13790 §12) — más preciso que el anual/estacional
// ═════════════════════════════════════════════════════════════════════════════

// Días por mes (hemisferio sur: mes 1 = enero = verano)
const DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
// Temperatura de consigna de calefacción (°C). El método mensual usa el setpoint
// real (20 °C) y acredita las ganancias explícitamente vía η, en vez del HDD18
// (base 18) que incorpora un margen fijo de 2 °C por ganancias.
const T_SET_CALEF = 20
// cos de los 3 meses de verano (Dic, Ene, Feb) para calibrar la forma solar:
// cos(0)=1 (Ene) + cos(30°) (Feb) + cos(330°) (Dic) ≈ 2.732
const COS_VERANO = Math.cos(0) + Math.cos((2 * Math.PI) / 12) + Math.cos((2 * Math.PI * 11) / 12)

/**
 * Distribuye la radiación vertical ANUAL por orientación en 12 meses.
 * Forma sinusoidal (máx en enero = verano) calibrada por orientación con
 * FRACCION_VERANO, luego NORMALIZADA para que la suma de los 12 meses sea
 * exactamente la radiación anual de esa orientación (invariante testeable).
 * @param {string} zonaClima  macrozona A-H
 * @returns {Array<{N:number,E:number,S:number,O:number}>}  12 filas, kWh/m²·mes
 */
export function radiacionVerticalMensual(zonaClima) {
  const anual = obtenerRadiacionVertical(zonaClima)
  const orient = ['N', 'E', 'S', 'O']
  // k por orientación: fracción verano (3 meses) = (3 + k·COS_VERANO)/12
  const K = {}
  for (const o of orient) {
    const fv = FRACCION_VERANO[o] ?? 0.33
    K[o] = (12 * fv - 3) / COS_VERANO
  }
  const pesos = []
  const sumaPeso = { N: 0, E: 0, S: 0, O: 0 }
  for (let m = 1; m <= 12; m++) {
    const c = Math.cos((2 * Math.PI * (m - 1)) / 12)
    const fila = {}
    for (const o of orient) {
      const w = Math.max(0, 1 + K[o] * c)   // clamp ≥0 (orientaciones muy estacionales)
      fila[o] = w
      sumaPeso[o] += w
    }
    pesos.push(fila)
  }
  // normalizar → cada orientación suma exactamente su radiación anual
  return pesos.map(fila => {
    const r = {}
    for (const o of orient) r[o] = sumaPeso[o] > 0 ? (anual[o] * fila[o]) / sumaPeso[o] : 0
    return r
  })
}

/**
 * Balance térmico por el MÉTODO MENSUAL ISO 13790 (§12.2).
 * Para cada mes usa el ΔT real (setpoint − T_ext del mes), las ganancias solares
 * e internas del mes, y aplica el factor de utilización η mes a mes; la demanda
 * de calefacción se trunca a 0 por mes y se suma en el año.
 *
 * Corrige el sesgo del método anual, que mezclaba pérdidas de temporada fría
 * (HDD18) con ganancias de año completo (8760 h) y aplicaba η sobre el γ anual,
 * sub-estimando la demanda. Parámetro a del factor η en su variante MENSUAL
 * (a0=1.0, τ0=15 h), distinta de la estacional (0.8, 30 h).
 *
 * Mismos parámetros y forma de retorno que balanceTermicoAnual, con un campo
 * extra `meses` (desglose) e iso13790.metodo = 'mensual'.
 */
export function balanceTermicoMensual({
  elementos = [],
  areaUtil = 100,
  volumen = null,
  ach = 0.8,
  areasVidrio = { N: 0, E: 0, S: 0, O: 0 },
  factorSolar = 0.70,
  factorProteccion = 1,
  gananciasInternasWm2 = GANANCIAS_INTERNAS_W_M2,
  masaTermica = 'media',
  psiLTotal = 0,
  uVentana = 0,          // U de la ventana [W/m²K]; 0 = no contar pérdida por ventana (legado)
  comunaKey = null,
  zonaClima = null,
}) {
  const v = volumen || areaUtil * 2.5
  const zonaEf = zonaClima || obtenerZonaClimaComuna(comunaKey) || 'D'

  // Área de ventana total. Si se cuenta su pérdida (uVentana>0), se DESCUENTA del
  // muro para no doble-contar el mismo paño (el hueco pierde por el vidrio, no por
  // el muro opaco).
  const areaVentana = (parseFloat(areasVidrio?.N) || 0) + (parseFloat(areasVidrio?.E) || 0)
    + (parseFloat(areasVidrio?.S) || 0) + (parseFloat(areasVidrio?.O) || 0)
  const elementosEf = (uVentana > 0 && areaVentana > 0)
    ? elementos.map(e => e.elemKey === 'muro'
        ? { ...e, area: Math.max(0, (parseFloat(e.area) || 0) - areaVentana) }
        : e)
    : elementos

  // Coeficiente global de pérdidas H = H_tr + H_ve [W/K] (constante en el año)
  const H_env = elementosEf.reduce((s, e) => {
    const u = parseFloat(e.U) || 0, a = parseFloat(e.area) || 0
    return (u > 0 && a > 0) ? s + u * a : s
  }, 0)
  const H_vent = (uVentana > 0 ? uVentana : 0) * areaVentana   // pérdida conductiva por ventanas
  const H_inf = Cp_AIRE * ach * v
  const H = H_env + H_vent + (psiLTotal || 0) + H_inf

  // Constante de tiempo τ [h] y parámetro a — variante MENSUAL (a0=1.0, τ0=15 h)
  const cmM2 = CM_POR_MASA[masaTermica] ?? CM_POR_MASA.media
  const tau = H > 0 ? (cmM2 * areaUtil) / (3600 * H) : 0
  const aNum = 1.0 + tau / 15

  const radMes = radiacionVerticalMensual(zonaEf)
  const orient = ['N', 'E', 'S', 'O']

  let needTot = 0, lossEnv = 0, lossPT = 0, lossInf = 0, lossVent = 0
  let solTot = 0, intTot = 0, utilTot = 0
  const solPorOrient = { N: 0, E: 0, S: 0, O: 0 }
  const meses = []

  for (let m = 1; m <= 12; m++) {
    const te = obtenerTextMes(m, comunaKey, zonaEf)
    const dT = T_SET_CALEF - te
    const horas = DIAS_MES[m - 1] * 24
    if (dT <= 0) {               // mes sin necesidad de calefacción
      meses.push({ mes: m, te: Math.round(te * 10) / 10, perdidas: 0, solar: 0, interna: 0, eta: 0, demanda: 0, calefacciona: false })
      continue
    }
    const qEnv  = (H_env * dT * horas) / 1000
    const qVent = (H_vent * dT * horas) / 1000
    const qPT   = ((psiLTotal || 0) * dT * horas) / 1000
    const qInf  = (H_inf * dT * horas) / 1000
    const qLoss = qEnv + qVent + qPT + qInf

    let qSol = 0
    for (const o of orient) {
      const a = parseFloat(areasVidrio?.[o]) || 0
      const g = a * factorSolar * (radMes[m - 1][o] || 0) * factorProteccion
      solPorOrient[o] += g
      qSol += g
    }
    const qInt = (gananciasInternasWm2 * areaUtil * horas) / 1000
    const qGn = qSol + qInt

    const gamma = qGn / Math.max(1e-6, qLoss)
    const eta = etaUtilizacion13790(gamma, aNum)
    const need = Math.max(0, qLoss - eta * qGn)

    needTot += need
    lossEnv += qEnv; lossVent += qVent; lossPT += qPT; lossInf += qInf
    solTot += qSol; intTot += qInt; utilTot += eta * qGn

    meses.push({
      mes: m, te: Math.round(te * 10) / 10,
      perdidas: Math.round(qLoss), solar: Math.round(qSol), interna: Math.round(qInt),
      eta: Math.round(eta * 100) / 100, demanda: Math.round(need), calefacciona: true,
    })
  }

  const perdidasTot = lossEnv + lossVent + lossPT + lossInf
  const gananciasTot = solTot + intTot
  const demandaNeta = Math.round(needTot)
  const kwhM2Anio = areaUtil > 0 ? Math.round(demandaNeta / areaUtil) : 0
  const factorUtilizacion = gananciasTot > 0 ? utilTot / gananciasTot : 0

  return {
    perdidas: {
      envolvente:      Math.round(lossEnv),
      ventanas:        Math.round(lossVent),
      puentesTermicos: Math.round(lossPT),
      infiltracion:    Math.round(lossInf),
      total:           Math.round(perdidasTot),
    },
    ganancias: {
      solares:          Math.round(solTot),
      solaresPorOrient: { N: Math.round(solPorOrient.N), E: Math.round(solPorOrient.E), S: Math.round(solPorOrient.S), O: Math.round(solPorOrient.O) },
      internas:         Math.round(intTot),
      total:            Math.round(gananciasTot),
      utilizadas:       Math.round(utilTot),
      factorUtilizacion: Math.round(factorUtilizacion * 100) / 100,
    },
    iso13790: {
      gamma:     Math.round((gananciasTot / Math.max(1, perdidasTot)) * 100) / 100,
      tauHoras:  Math.round(tau * 10) / 10,
      aNum:      Math.round(aNum * 100) / 100,
      H_WK:      Math.round(H * 10) / 10,
      psiLTotal: Math.round((psiLTotal || 0) * 100) / 100,
      metodo:    'mensual',
    },
    demandaNeta,
    kwhM2Anio,
    calificacion: calificacionPorDemanda(kwhM2Anio),
    hdd18: obtenerHDD18(comunaKey, zonaEf),
    meses,
    parametros: { areaUtil, volumen: v, ach, factorSolar, factorProteccion, masaTermica },
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ANÁLISIS SOBRECALENTAMIENTO (verano)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Análisis de riesgo de sobrecalentamiento en verano.
 *
 * Calcula:
 *   · Ganancias solares en verano por orientación
 *   · WWR (Window-to-Wall Ratio) por orientación
 *   · Alertas si WWR excede umbrales
 *   · Índice cualitativo de sobrecalentamiento (bajo/medio/alto)
 *
 * @param {object} params
 *   areasVidrio:    {N,E,S,O}
 *   areasMuroOrient: {N,E,S,O} — opcional, para WWR
 *   factorSolar:     g
 *   factorProteccion: 0..1
 *   zonaClima
 *   comunaKey
 *   masaTermica:     'baja' | 'media' | 'alta' (default 'media')
 *   ventilacionNocturna: bool
 */
export function analizarSobrecalentamiento({
  areasVidrio = { N: 0, E: 0, S: 0, O: 0 },
  areasMuroOrient = null,
  factorSolar = 0.70,
  factorProteccion = 1,
  zonaClima = 'D',
  comunaKey = null,
  masaTermica = 'media',
  ventilacionNocturna = false,
  areaUtil = 100,
}) {
  const rad = obtenerRadiacionVertical(zonaClima)
  const cdd26 = obtenerCDD26(comunaKey, zonaClima)
  const tVer = obtenerTverano(comunaKey, zonaClima)

  // Ganancias solares solo verano (fracción del anual)
  const orient = ['N', 'E', 'S', 'O']
  const gVerano = {}
  let gVeranoTotal = 0
  for (const o of orient) {
    const a = parseFloat(areasVidrio?.[o]) || 0
    const g = a * factorSolar * rad[o] * FRACCION_VERANO[o] * factorProteccion
    gVerano[o] = Math.round(g)
    gVeranoTotal += g
  }

  // WWR por orientación si tenemos áreas de muro
  const wwr = {}
  const alertas = []
  if (areasMuroOrient) {
    const umbrales = { N: 0.35, E: 0.30, S: 0.40, O: 0.25 }  // O más estricto (sol tarde)
    for (const o of orient) {
      const aV = parseFloat(areasVidrio?.[o]) || 0
      const aM = parseFloat(areasMuroOrient?.[o]) || 0
      const ratio = aM > 0 ? aV / aM : 0
      wwr[o] = Math.round(ratio * 100) / 100
      if (ratio > umbrales[o]) {
        alertas.push({
          tipo: 'wwr_excedido',
          orient: o,
          ratio,
          umbral: umbrales[o],
          severidad: o === 'O' ? 'alta' : 'media',
          mensaje: `WWR ${o} = ${(ratio*100).toFixed(0)}% supera el umbral recomendado de ${(umbrales[o]*100).toFixed(0)}%.${o === 'O' ? ' Las ventanas al oeste reciben sol fuerte de tarde.' : ''}`,
        })
      }
    }
  }

  // Índice cualitativo de sobrecalentamiento
  // Considera: ganancias verano / area útil + CDD26 + protecciones + masa
  const gSolM2 = gVeranoTotal / Math.max(1, areaUtil)
  let score = 0
  if (gSolM2 > 200) score += 3
  else if (gSolM2 > 120) score += 2
  else if (gSolM2 > 60) score += 1
  if (cdd26 > 500) score += 2
  else if (cdd26 > 250) score += 1
  if (tVer > 22) score += 1
  if (factorProteccion >= 0.9) score += 1   // sin protección suma
  if (masaTermica === 'baja') score += 1
  if (masaTermica === 'alta') score -= 1
  if (ventilacionNocturna) score -= 1
  if (alertas.some(a => a.severidad === 'alta')) score += 1

  const indice = score >= 5 ? 'alto' : score >= 3 ? 'medio' : score >= 1 ? 'bajo' : 'minimo'

  // Recomendaciones contextuales
  const recomendaciones = []
  if (alertas.some(a => a.orient === 'O' && a.severidad === 'alta'))
    recomendaciones.push('Reduce ventanas oeste o agrega protección vertical (celosías, persianas, vegetación).')
  if (factorSolar > 0.7 && gVeranoTotal > 5000)
    recomendaciones.push('Cambia a vidrio low-e selectivo (g ≤ 0.50) para reducir ganancias solares en verano sin perder transparencia.')
  if (factorProteccion >= 0.9 && cdd26 > 200)
    recomendaciones.push('Agrega aleros norte de 60–80 cm: protegen del sol vertical de verano pero dejan pasar el invierno.')
  if (!ventilacionNocturna && cdd26 > 250)
    recomendaciones.push('Implementa ventilación cruzada nocturna: aprovecha la baja T° de madrugada para enfriar la masa térmica.')
  if (masaTermica === 'baja' && indice !== 'minimo')
    recomendaciones.push('Aumenta la masa térmica interior (radier expuesto, muro divisorio pesado) para amortiguar oscilación térmica diaria.')

  return {
    gananciasVerano: { porOrient: gVerano, total: Math.round(gVeranoTotal) },
    wwr,
    alertas,
    indice,
    score,
    cdd26,
    tVerano: tVer,
    recomendaciones,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Helpers para extraer datos del proyecto existente
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Convierte el calcUInit del proyecto al formato de envolvente que demanda.js
 * espera (array de {U, area, elemKey}). Usa áreas por defecto.
 */
export function envolventeFromCalcUInit(calcUInit = {}, areasOverride = null, areasBase = null) {
  // Áreas por defecto: las derivadas de la geometría del proyecto (areasBase) si
  // se pasan, si no las de "vivienda tipo". Un override explícito del usuario
  // manda sobre ambas.
  const AREAS = { muro: 80, piso: 70, techo: 70, tabique: 30, ...(areasBase || {}) }
  const elementos = []
  for (const [key, data] of Object.entries(calcUInit)) {
    if (!data?.res?.U) continue
    const elemKey = key.includes('::') ? key.split('::').pop() : key
    const u = parseFloat(data.res.U)
    if (isNaN(u) || u <= 0) continue
    // Área expuesta al exterior. Respeta un override explícito INCLUIDO el 0
    // (un entrepiso entre recintos calefaccionados no es envolvente → 0 pérdidas;
    // un piso parcialmente en voladizo cuenta solo el área del voladizo).
    const ov = areasOverride?.[key] ?? areasOverride?.[elemKey]
    const area = (ov !== undefined && ov !== null && ov !== '') ? Number(ov) : (AREAS[elemKey] ?? 40)
    elementos.push({ U: u, area, elemKey, key })
  }
  return elementos
}

/**
 * Convierte fachadas (estado del proyecto) en areasVidrio y areasMuroOrient.
 * fachadas es típicamente Array<{ orientacion, areaMuro, areaVentana, ... }>
 */
export function ventanasFromFachadas(fachadas = []) {
  const areasVidrio = { N: 0, E: 0, S: 0, O: 0 }
  const areasMuroOrient = { N: 0, E: 0, S: 0, O: 0 }
  if (!Array.isArray(fachadas)) return { areasVidrio, areasMuroOrient }
  for (const f of fachadas) {
    // Mapear orientación (puede venir 'N', 'NORTE', 'norte', etc.)
    const ori = (f.orientacion || '').toString().toUpperCase().charAt(0)
    if (!['N', 'E', 'S', 'O'].includes(ori)) continue
    areasVidrio[ori] += parseFloat(f.areaVentana || f.area_ventana || f.av || 0) || 0
    areasMuroOrient[ori] += parseFloat(f.areaMuro || f.area_muro || f.am || 0) || 0
  }
  return { areasVidrio, areasMuroOrient }
}
