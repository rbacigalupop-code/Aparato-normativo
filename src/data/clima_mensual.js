// ─────────────────────────────────────────────────────────────────────────────
// clima_mensual.js — Modelo climático mensual por comuna chilena.
//
// Para el cálculo Glaser mensual (ISO 13788 método mensual) y modelo de moho
// VTT necesitamos T_ext y HR_ext para los 12 meses.
//
// Aproximación sinusoidal:
//   T(mes) = T_media + Amplitud · cos(2π · (mes - 1) / 12)
//
// En hemisferio sur: mes=1 (enero) es el más cálido, mes=7 (julio) el más frío.
//
// Datos base:
//   · T_invierno (JJA) — ya catalogado por comuna en irradiacion_solar.js
//   · T_verano  (DEF) — ya catalogado por comuna en clima_anual.js
//   · HR_ext anual — aproximada por zona DS N°15 (Chile)
//
// Para el cálculo interior usamos los estándares ISO 13788:
//   · T_int = 20°C (constante)
//   · HR_int = 50–65% según uso (default 55%)
// ─────────────────────────────────────────────────────────────────────────────

import { obtenerTinvierno } from './irradiacion_solar.js'
import { obtenerTverano } from './clima_anual.js'
import { obtenerZonaDS15Comuna } from './comunas_chile.js'

// HR exterior media por zona DS N°15 (%) — Chile
// Norte litoral: alta por la camanchaca
// Norte interior: muy baja (desierto)
// Centro: moderada (60-70%)
// Sur: alta (75-85%)
// Austral: muy alta (80-90%)
export const HR_EXT_POR_ZONA = {
  'A': 78,  // Litoral norte
  'B': 45,  // Desierto interior
  'C': 75,  // Litoral central
  'D': 65,  // Centro interior (Santiago)
  'E': 78,  // Sur litoral (Conce, Valdivia)
  'F': 82,  // Sur interior (Pto Montt, Chiloé)
  'G': 85,  // Austral norte (Coyhaique)
  'H': 87,  // Austral extremo (Magallanes)
}

// HR interior estándar (%)
export const HR_INT_DEFAULT = 55
export const T_INT_DEFAULT  = 20

// Etiquetas de meses
export const MESES_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

/**
 * T_ext mensual estimada con modelo sinusoidal.
 *
 * @param {number} mes        - 1..12
 * @param {string} comunaKey
 * @param {string} zonaDS15
 */
export function obtenerTextMes(mes, comunaKey, zonaDS15 = null) {
  const tInv = obtenerTinvierno(comunaKey, zonaDS15)  // mes 7 aprox
  const tVer = obtenerTverano(comunaKey, zonaDS15)    // mes 1 aprox
  const tMedia = (tInv + tVer) / 2
  const ampl   = (tVer - tInv) / 2
  // mes 1 (Ene) = peak verano → cos(0) = +1
  // mes 7 (Jul) = peak invierno → cos(π) = -1
  return tMedia + ampl * Math.cos(2 * Math.PI * (mes - 1) / 12)
}

/**
 * HR_ext mensual estimada.
 * En Chile la HR varía menos que la T entre meses (excepto en zonas extremas).
 * Aproximación simple: HR anual media (constante por mes). Mejora futura:
 * pequeña oscilación inversa a T.
 */
export function obtenerHRMes(mes, comunaKey, zonaDS15 = null) {
  const zona = zonaDS15 || obtenerZonaDS15Comuna(comunaKey) || 'D'
  const hrAnual = HR_EXT_POR_ZONA[zona] ?? 70
  // Pequeña oscilación: HR mínima en verano (mes 1-2), máxima en invierno
  const desfase = 6  // mes peak HR = julio
  const ampl = 5
  return hrAnual + ampl * Math.cos(2 * Math.PI * (mes - desfase) / 12)
}

/**
 * Genera el array completo de clima mensual para una comuna.
 */
export function climaMensual(comunaKey, zonaDS15 = null) {
  const meses = []
  for (let m = 1; m <= 12; m++) {
    meses.push({
      mes:    m,
      label:  MESES_LABELS[m - 1],
      t_ext:  Math.round(obtenerTextMes(m, comunaKey, zonaDS15) * 10) / 10,
      hr_ext: Math.round(obtenerHRMes(m, comunaKey, zonaDS15)),
      t_int:  T_INT_DEFAULT,
      hr_int: HR_INT_DEFAULT,
    })
  }
  return meses
}

/**
 * Presión de vapor de saturación (Magnus-Tetens) en Pa, según ISO 13788.
 * La norma usa coeficientes distintos sobre agua (T≥0) y sobre hielo (T<0).
 * Crítico en el balance higrotérmico mensual de zonas frías (medias mensuales
 * exteriores bajo 0°C): sobre hielo la psat es menor → balance de condensación
 * correcto. Para T≥0 el resultado es idéntico al anterior.
 * @param {number} T_celsius
 */
export function pvSat(T) {
  if (T == null || isNaN(T)) return 0
  return T >= 0
    ? 610.5 * Math.exp((17.269 * T) / (T + 237.3))   // sobre agua  — ISO 13788
    : 610.5 * Math.exp((21.875 * T) / (T + 265.5))   // sobre hielo — ISO 13788 (T<0)
}

/**
 * Presión de vapor real (Pa) dado T y HR%.
 */
export function pvReal(T, HR_pct) {
  return pvSat(T) * (HR_pct / 100)
}
