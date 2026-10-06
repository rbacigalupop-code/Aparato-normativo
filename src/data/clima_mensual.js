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
import { obtenerZonaClimaComuna } from './comunas_chile.js'

// HR exterior media por MACROZONA CLIMÁTICA A-H (%) — Chile (no es zona DS N°15)
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

// ─── Curvas MENSUALES representativas por MACROZONA climática A-H (°C) ────────
// Temperatura media mensual (Ene..Dic) de una estación representativa de cada
// macrozona, basada en la climatología chilena conocida. Son REFERENCIALES (no
// reemplazan las normales DMC de la estación específica). Se usan por su FORMA
// (qué meses son fríos/cálidos, asimetría otoño/primavera, mes más frío real):
// la magnitud se re-escala a los Tinv/Tver de la comuna, así cada comuna
// conserva su rango propio pero gana la forma real del año (mejor que una
// sinusoide simétrica de 2 puntos).
export const NORMALES_MENSUALES_ZONA = {
  'A': [20, 20, 19, 18, 16, 15, 14, 14, 15, 16, 17, 19],  // Litoral norte (marítimo, muy atenuado)
  'B': [19, 18, 17, 14, 11,  9,  8, 10, 12, 14, 16, 18],  // Desértico interior (fuerte estacionalidad)
  'C': [18, 18, 17, 15, 14, 13, 12, 12, 13, 14, 15, 17],  // Litoral centro
  'D': [22, 21, 19, 15, 12,  9,  8, 10, 12, 15, 18, 21],  // Interior centro (mediterráneo)
  'E': [17, 17, 15, 13, 11,  9,  9,  9, 10, 12, 14, 16],  // Litoral sur
  'F': [16, 16, 14, 12,  9,  7,  7,  8,  9, 11, 13, 15],  // Interior sur
  'G': [14, 13, 11,  8,  5,  3,  2,  3,  5,  8, 10, 12],  // Austral norte
  'H': [11, 11,  9,  7,  4,  2,  2,  3,  5,  7,  9, 10],  // Austral extremo
}

/**
 * T_ext media mensual. Usa la FORMA de la curva mensual representativa de la
 * macrozona (NORMALES_MENSUALES_ZONA) re-escalada al rango Tinv..Tver de la
 * comuna; si no hay curva para la zona, cae al modelo sinusoidal de 2 puntos.
 *
 * @param {number} mes        - 1..12
 * @param {string} comunaKey
 * @param {string} zonaClima  - macrozona A-H
 */
export function obtenerTextMes(mes, comunaKey, zonaClima = null) {
  const tInv = obtenerTinvierno(comunaKey, zonaClima)  // invierno JJA (frío)
  const tVer = obtenerTverano(comunaKey, zonaClima)    // verano DEF (cálido)
  const zona = zonaClima || obtenerZonaClimaComuna(comunaKey) || 'D'
  const normales = NORMALES_MENSUALES_ZONA[zona]

  if (normales) {
    const min = Math.min(...normales), max = Math.max(...normales)
    if (max > min) {
      // forma 0 (mes más frío) .. 1 (mes más cálido), re-escalada a Tinv..Tver
      const forma = (normales[mes - 1] - min) / (max - min)
      return tInv + forma * (tVer - tInv)
    }
  }

  // Fallback sinusoidal (2 puntos): Ene = peak verano, Jul = peak invierno
  const tMedia = (tInv + tVer) / 2
  const ampl   = (tVer - tInv) / 2
  return tMedia + ampl * Math.cos(2 * Math.PI * (mes - 1) / 12)
}

/**
 * HR_ext mensual estimada.
 * En Chile la HR varía menos que la T entre meses (excepto en zonas extremas).
 * Aproximación simple: HR anual media (constante por mes). Mejora futura:
 * pequeña oscilación inversa a T.
 */
export function obtenerHRMes(mes, comunaKey, zonaClima = null) {
  const zona = zonaClima || obtenerZonaClimaComuna(comunaKey) || 'D'
  const hrAnual = HR_EXT_POR_ZONA[zona] ?? 70
  // Pequeña oscilación: HR mínima en verano (mes 1-2), máxima en invierno
  const desfase = 6  // mes peak HR = julio
  const ampl = 5
  return hrAnual + ampl * Math.cos(2 * Math.PI * (mes - desfase) / 12)
}

/**
 * Genera el array completo de clima mensual para una comuna.
 */
export function climaMensual(comunaKey, zonaClima = null) {
  const meses = []
  for (let m = 1; m <= 12; m++) {
    meses.push({
      mes:    m,
      label:  MESES_LABELS[m - 1],
      t_ext:  Math.round(obtenerTextMes(m, comunaKey, zonaClima) * 10) / 10,
      hr_ext: Math.round(obtenerHRMes(m, comunaKey, zonaClima)),
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
