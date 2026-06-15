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
export function envolventeFromCalcUInit(calcUInit = {}, areasOverride = null) {
  const AREAS_DEF = { muro: 80, piso: 70, techo: 70, tabique: 30 }
  const elementos = []
  for (const [key, data] of Object.entries(calcUInit)) {
    if (!data?.res?.U) continue
    const elemKey = key.includes('::') ? key.split('::').pop() : key
    const u = parseFloat(data.res.U)
    if (isNaN(u) || u <= 0) continue
    const areaOverride = areasOverride?.[key] || areasOverride?.[elemKey]
    const area = areaOverride || AREAS_DEF[elemKey] || 40
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
