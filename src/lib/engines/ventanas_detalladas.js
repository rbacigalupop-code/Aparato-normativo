// ─────────────────────────────────────────────────────────────────────────────
// ventanas_detalladas.js (engine) — Cálculo combinado U_ventana.
//
// Norma de referencia: NCh3079 / ISO 10077-1.
//
//   U_ventana = (U_m·A_m + U_v·A_v + Ψ_i·L_i) / A_total
//
// Donde:
//   U_m: U del marco          [W/m²K]
//   A_m: área del marco       [m²]
//   U_v: U del vidrio         [W/m²K]
//   A_v: área del vidrio      [m²]
//   Ψ_i: Ψ del intercalario   [W/m·K]
//   L_i: perímetro vidrio = L_intercalario [m]
//   A_total = A_m + A_v
//
// Factor solar combinado:
//   g_w ≈ g_v · (A_v / A_total)
// ─────────────────────────────────────────────────────────────────────────────

import { obtenerMarco, obtenerVidrio, obtenerIntercalario } from '../../data/ventanas_detalladas.js'

/**
 * Calcula U de una ventana con dimensiones específicas + componentes.
 *
 * @param {object} params
 *   ancho_m, alto_m              - dimensiones totales de la ventana
 *   marcoId, vidrioId, intercalarioId
 *   anchoMarcoOverride_mm        - sobrescribir ancho marco (opcional)
 *
 * @returns {{ U, g, tl, A_total, A_marco, A_vidrio, L_intercalario, Q_marco, Q_vidrio, Q_intercalario }}
 */
export function calcularVentanaCombinada({
  ancho_m = 1.2,
  alto_m  = 1.2,
  marcoId,
  vidrioId,
  intercalarioId,
  anchoMarcoOverride_mm = null,
}) {
  const marco        = obtenerMarco(marcoId)
  const vidrio       = obtenerVidrio(vidrioId)
  const intercalario = obtenerIntercalario(intercalarioId)
  if (!marco || !vidrio || !intercalario) return null

  // Geometría
  const ancho_marco_m = (anchoMarcoOverride_mm ?? marco.ancho_mm) / 1000
  const A_total       = ancho_m * alto_m
  // Área de vidrio (hueco): ventana menos marco perimetral
  const ancho_v_m = Math.max(0, ancho_m - 2 * ancho_marco_m)
  const alto_v_m  = Math.max(0, alto_m  - 2 * ancho_marco_m)
  const A_vidrio  = ancho_v_m * alto_v_m
  const A_marco   = Math.max(0, A_total - A_vidrio)
  // Perímetro del vidrio (largo del intercalario)
  const L_intercalario = 2 * (ancho_v_m + alto_v_m)

  // Aportes de calor (W/K)
  const Q_marco         = marco.u * A_marco
  const Q_vidrio        = vidrio.u * A_vidrio
  const Q_intercalario  = intercalario.psi * L_intercalario
  const Q_total         = Q_marco + Q_vidrio + Q_intercalario

  // U combinado
  const U = A_total > 0 ? Q_total / A_total : 0
  // Factor solar combinado
  const g = A_total > 0 ? vidrio.g * (A_vidrio / A_total) : 0
  // Transmisión luminosa combinada
  const tl = A_total > 0 ? vidrio.tl * (A_vidrio / A_total) : 0

  return {
    U: Math.round(U * 100) / 100,
    g: Math.round(g * 100) / 100,
    tl: Math.round(tl * 100) / 100,
    A_total: Math.round(A_total * 100) / 100,
    A_marco: Math.round(A_marco * 100) / 100,
    A_vidrio: Math.round(A_vidrio * 100) / 100,
    L_intercalario: Math.round(L_intercalario * 100) / 100,
    Q_marco: Math.round(Q_marco * 100) / 100,
    Q_vidrio: Math.round(Q_vidrio * 100) / 100,
    Q_intercalario: Math.round(Q_intercalario * 100) / 100,
    Q_total: Math.round(Q_total * 100) / 100,
    pctMarco:   A_total > 0 ? Math.round(A_marco / A_total * 100) : 0,
    pctVidrio:  A_total > 0 ? Math.round(A_vidrio / A_total * 100) : 0,
    componentes: { marco, vidrio, intercalario },
  }
}

/**
 * Compara varias configuraciones de ventana en paralelo.
 */
export function compararVentanas(configs) {
  return configs.map(c => ({ ...c, resultado: calcularVentanaCombinada(c) }))
}

/**
 * Validación contra DS N°15 según zona.
 * Devuelve si cumple el Umax de ventanas para la zona dada.
 */
export const UMAX_VENTANA_DS15 = {
  'A': 5.8, 'B': 4.6, 'C': 4.0, 'D': 3.6, 'E': 3.0, 'F': 2.4, 'G': 2.0, 'H': 1.8,
}

export function cumpleDS15(U, zona) {
  const umax = UMAX_VENTANA_DS15[zona]
  if (!umax) return null
  return { umax, cumple: U <= umax, margen: Math.round((umax - U) * 100) / 100 }
}
