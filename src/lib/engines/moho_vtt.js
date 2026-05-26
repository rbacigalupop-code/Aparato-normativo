// ─────────────────────────────────────────────────────────────────────────────
// moho_vtt.js — Modelo VTT (Viitanen-Hukka) de crecimiento de moho.
//
// El modelo VTT calcula un índice M (Mold Index) de 0 a 6 que estima el
// crecimiento de moho en una superficie según T, HR y la sensibilidad del
// material.
//
// Escala M:
//   0: Sin crecimiento
//   1: Pequeñas cantidades sólo visibles al microscopio
//   2: Varias colonias visibles al microscopio
//   3: Crecimiento visible a simple vista (<10% de cobertura)
//   4: Crecimiento visible (10–50% de cobertura)
//   5: Crecimiento extensivo (>50% cobertura)
//   6: Cobertura total
//
// Criterio práctico:
//   M ≤ 1: OK (no problema)
//   M ≤ 2: Aceptable
//   M ≥ 3: Inaceptable (moho visible)
//
// Sensibilidad del material:
//   1 (muy sensible): madera sin tratar, papel pintado, fibras orgánicas
//   2 (sensible): yeso cartón, lana mineral
//   3 (medio): hormigón, ladrillo
//   4 (resistente): vidrio, metales
//
// Referencias:
//   · Viitanen, H., Hukka, A. (1999) "A mathematical model of mould growth..."
//   · Ojanen et al. (2010) — actualización del modelo VTT
// ─────────────────────────────────────────────────────────────────────────────

// HR crítica (%) por debajo de la cual NO crece moho (a una T dada)
// Aproximación: para T entre 0-25°C, RH_crit ≈ 100 si T<0, sino ~80-85% típica
export function HRcritico(T_celsius, sensibilidad = 2) {
  if (T_celsius < 0) return 100  // por debajo de 0°C no crece
  // Modelo simplificado: HR_crit = max(80, 100 - T*0.4) ajustado por sensibilidad
  const base = Math.max(80, 100 - T_celsius * 0.4)
  // Materiales muy sensibles tienen HR_crit más baja (más fácil moho)
  const ajuste = { 1: -5, 2: 0, 3: 5, 4: 10 }
  return Math.max(75, base + (ajuste[sensibilidad] ?? 0))
}

/**
 * Tasa de crecimiento mensual del M (índice moho).
 *
 * @param {number} T_celsius
 * @param {number} HR_pct
 * @param {number} sensibilidad - 1-4
 * @param {number} M_actual - M del mes anterior
 * @returns {number} Nuevo M (mes siguiente)
 */
export function actualizarM_mensual(T_celsius, HR_pct, sensibilidad, M_actual) {
  const hrCrit = HRcritico(T_celsius, sensibilidad)

  if (HR_pct < hrCrit) {
    // Secado: M decrece lentamente
    // Tasa secado proporcional a déficit
    const deficitHR = hrCrit - HR_pct
    const tasaSecado = 0.10 + Math.min(0.20, deficitHR / 100)  // hasta 0.30/mes
    return Math.max(0, M_actual - tasaSecado)
  }

  // Crecimiento: tasa proporcional a (HR - HR_crit) y T
  // Curva favorable: T = 20°C óptima, 0°C y 40°C casi nulo
  const factorT = Math.max(0, 1 - Math.pow((T_celsius - 20) / 25, 2))

  const excesoHR = HR_pct - hrCrit
  const factorHR = Math.min(1, excesoHR / 15)  // saturación a HR_crit+15

  const factorMaterial = { 1: 1.2, 2: 1.0, 3: 0.7, 4: 0.4 }[sensibilidad] ?? 1.0

  // Tasa de crecimiento (índice / mes) — calibrada para que en condiciones
  // óptimas alcance M=3 (visible) en ~6 meses.
  const tasaCrecimiento = 0.50 * factorT * factorHR * factorMaterial

  // M satura asintóticamente en 6
  const incremento = tasaCrecimiento * (1 - M_actual / 7)
  return Math.min(6, M_actual + incremento)
}

/**
 * Analiza el crecimiento de moho durante el año completo en una interfaz.
 *
 * @param {Array<{T, HR}>} mesesData - 12 entradas con T y HR de la interfaz interior crítica
 * @param {number} sensibilidad
 * @returns {{ M_mensual, M_max, M_final, veredicto }}
 */
export function analizarMohoAnual(mesesData, sensibilidad = 2) {
  if (!Array.isArray(mesesData) || mesesData.length === 0) return null

  const M_mensual = []
  let M = 0
  let M_max = 0

  // Correr 2 años (24 meses) para estabilizar
  for (let ciclo = 0; ciclo < 2; ciclo++) {
    for (const m of mesesData) {
      M = actualizarM_mensual(m.T, m.HR, sensibilidad, M)
      if (M > M_max) M_max = M
      if (ciclo === 1) M_mensual.push(Math.round(M * 100) / 100)
    }
  }

  const M_final = Math.round(M * 100) / 100
  const M_max_round = Math.round(M_max * 100) / 100

  let veredicto = ''
  if (M_max_round < 1)      veredicto = 'sin_riesgo'
  else if (M_max_round < 2) veredicto = 'aceptable'
  else if (M_max_round < 3) veredicto = 'atencion'
  else if (M_max_round < 4) veredicto = 'inaceptable'
  else                       veredicto = 'critico'

  return { M_mensual, M_max: M_max_round, M_final, veredicto, sensibilidad }
}

// Sensibilidad por material (para auto-detección)
export const SENSIBILIDAD_MATERIAL = {
  'madera':         1, 'pino':         1, 'oviedo':        1,
  'osb':            1, 'tablero':      1, 'mdf':           1,
  'yeso cartón':    2, 'yeso':         2, 'volcanita':     2,
  'lana':           2, 'lana mineral': 2, 'lana de vidrio':2, 'celulosa':    2,
  'aislapol':       3, 'eps':          3, 'poliestireno':  3, 'xps':         3, 'poliuretano': 3,
  'hormigón':       3, 'concreto':     3, 'ladrillo':      3, 'estuco':      3,
  'fibrocemento':   3,
  'aluminio':       4, 'acero':        4, 'metal':         4, 'vidrio':      4,
}

export function detectarSensibilidad(nombreMaterial = '') {
  if (!nombreMaterial) return 2
  const lower = nombreMaterial.toLowerCase()
  for (const [k, v] of Object.entries(SENSIBILIDAD_MATERIAL)) {
    if (lower.includes(k)) return v
  }
  return 2  // default sensibilidad media
}

export const VEREDICTO_LABELS = {
  sin_riesgo:    { label: '✅ Sin riesgo',    color: '#16a34a', detalle: 'No hay crecimiento de moho proyectado.' },
  aceptable:     { label: '🟢 Aceptable',     color: '#65a30d', detalle: 'Pequeñas colonias microscópicas, no visibles a simple vista.' },
  atencion:      { label: '🟡 Atención',      color: '#eab308', detalle: 'Riesgo de moho visible. Considerar mejorar ventilación o aislación.' },
  inaceptable:   { label: '🟠 Inaceptable',   color: '#ea580c', detalle: 'Moho visible esperado. Intervención necesaria.' },
  critico:       { label: '🔴 Crítico',       color: '#dc2626', detalle: 'Crecimiento extensivo. Problemas higrotérmicos serios.' },
}
