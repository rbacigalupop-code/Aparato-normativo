// ─────────────────────────────────────────────────────────────────────────────
// irradiacion_solar.js — Irradiación solar global horizontal por comuna chilena.
//
// Fuente:
//   · Explorador Solar MINENERGÍA (https://solar.minenergia.cl)
//   · NASA POWER 22-year average
//   · Atlas de Energía Solar Chile (Universidad de Chile)
//
// Datos en kWh/m²/día:
//   · anual_kwh_m2_dia: promedio anual
//   · verano:  Dic-Ene-Feb (peak)
//   · invierno: Jun-Jul-Ago (mínimo)
//
// El factor de capacidad FV anual aproximado se calcula como:
//   FC ≈ (anual_kwh_m2_dia × 365) / (8760 × 1 kW/m²) × performance_ratio
//   con PR típico de 0.78 para Chile (incluye pérdidas DC, inversor, suciedad).
//
// Producción anual FV específica (kWh/kWp·año) ≈ anual × 365 × 0.78
// ─────────────────────────────────────────────────────────────────────────────

export const IRRADIACION_SOLAR = {
  // ─── Norte (mejor zona FV de Chile, Atacama es récord mundial) ────────────
  'arica':          { anual: 6.1, verano: 7.0, invierno: 5.2, fc_fv: 0.218 },
  'iquique':        { anual: 6.0, verano: 7.0, invierno: 5.0, fc_fv: 0.214 },
  'antofagasta':    { anual: 7.0, verano: 8.2, invierno: 5.8, fc_fv: 0.249 },
  'calama':         { anual: 7.4, verano: 8.5, invierno: 6.3, fc_fv: 0.264 },  // récord mundial Atacama
  'copiapo':        { anual: 6.5, verano: 8.0, invierno: 5.0, fc_fv: 0.232 },
  'la_serena':      { anual: 5.8, verano: 7.2, invierno: 4.4, fc_fv: 0.207 },
  'ovalle':         { anual: 5.7, verano: 7.1, invierno: 4.3, fc_fv: 0.203 },

  // ─── Centro (zona con muy buena radiación, óptima FV residencial) ─────────
  'valparaiso':     { anual: 5.0, verano: 6.5, invierno: 3.5, fc_fv: 0.178 },
  'vina_del_mar':   { anual: 5.0, verano: 6.5, invierno: 3.5, fc_fv: 0.178 },
  'san_felipe':     { anual: 5.3, verano: 7.0, invierno: 3.7, fc_fv: 0.189 },
  'santiago':       { anual: 5.2, verano: 7.0, invierno: 3.4, fc_fv: 0.185 },
  'puente_alto':    { anual: 5.2, verano: 7.0, invierno: 3.4, fc_fv: 0.185 },
  'maipu':          { anual: 5.2, verano: 7.0, invierno: 3.4, fc_fv: 0.185 },
  'rancagua':       { anual: 5.1, verano: 6.9, invierno: 3.3, fc_fv: 0.181 },
  'curico':         { anual: 5.0, verano: 6.8, invierno: 3.2, fc_fv: 0.178 },
  'talca':          { anual: 5.0, verano: 6.8, invierno: 3.2, fc_fv: 0.178 },
  'linares':        { anual: 4.9, verano: 6.7, invierno: 3.1, fc_fv: 0.175 },

  // ─── Sur (radiación menor pero FV sigue siendo viable) ────────────────────
  'chillan':        { anual: 4.6, verano: 6.4, invierno: 2.8, fc_fv: 0.164 },
  'concepcion':     { anual: 4.3, verano: 5.9, invierno: 2.6, fc_fv: 0.153 },
  'los_angeles':    { anual: 4.4, verano: 6.1, invierno: 2.7, fc_fv: 0.157 },
  'temuco':         { anual: 4.0, verano: 5.6, invierno: 2.4, fc_fv: 0.143 },
  'pucon':          { anual: 4.0, verano: 5.6, invierno: 2.3, fc_fv: 0.143 },
  'valdivia':       { anual: 3.7, verano: 5.2, invierno: 2.1, fc_fv: 0.132 },
  'osorno':         { anual: 3.5, verano: 5.0, invierno: 1.9, fc_fv: 0.125 },
  'puerto_montt':   { anual: 3.3, verano: 4.8, invierno: 1.7, fc_fv: 0.118 },
  'castro':         { anual: 3.0, verano: 4.5, invierno: 1.5, fc_fv: 0.107 },
  'ancud':          { anual: 3.1, verano: 4.6, invierno: 1.6, fc_fv: 0.110 },

  // ─── Austral (FV poco viable, sobre todo en invierno) ─────────────────────
  'coyhaique':      { anual: 3.0, verano: 4.8, invierno: 1.2, fc_fv: 0.107 },
  'puerto_aysen':   { anual: 2.8, verano: 4.6, invierno: 1.1, fc_fv: 0.100 },
  'punta_arenas':   { anual: 2.7, verano: 5.2, invierno: 0.7, fc_fv: 0.096 },
  'puerto_natales': { anual: 2.7, verano: 5.2, invierno: 0.7, fc_fv: 0.096 },
  'porvenir':       { anual: 2.6, verano: 5.0, invierno: 0.7, fc_fv: 0.093 },
}

// Fallback por MACROZONA CLIMÁTICA (A-H) — no es la zona oficial DS N°15
export const IRRADIACION_POR_ZONA = {
  'A': { anual: 6.5, fc_fv: 0.232 },
  'B': { anual: 6.8, fc_fv: 0.243 },
  'C': { anual: 5.5, fc_fv: 0.196 },
  'D': { anual: 5.1, fc_fv: 0.181 },
  'E': { anual: 4.2, fc_fv: 0.150 },
  'F': { anual: 3.3, fc_fv: 0.118 },
  'G': { anual: 2.9, fc_fv: 0.103 },
  'H': { anual: 2.7, fc_fv: 0.096 },
}

import { obtenerZonaClimaComuna } from './comunas_chile.js'

// `zonaClima` = macrozona climática (A-H), normalmente derivada de la zona
// oficial elegida vía zonaClimaDeOGUC(); tiene prioridad sobre el clima fijo
// de la comuna (comunas multi-zona siguen la selección del usuario).
export function obtenerIrradiacion(comunaKey, zonaClima = null) {
  const key = comunaKey?.toLowerCase()?.replace(/\s/g, '_')
  const c = IRRADIACION_SOLAR[key]
  if (c) return c
  if (zonaClima && IRRADIACION_POR_ZONA[zonaClima]) {
    return { ...IRRADIACION_POR_ZONA[zonaClima], verano: null, invierno: null }
  }
  const zonaComuna = obtenerZonaClimaComuna(key)
  if (zonaComuna && IRRADIACION_POR_ZONA[zonaComuna]) {
    return { ...IRRADIACION_POR_ZONA[zonaComuna], verano: null, invierno: null }
  }
  return { anual: 5.0, verano: 6.5, invierno: 3.5, fc_fv: 0.178 }  // Santiago default
}

// ─── Temperatura media mensual invierno por comuna (para COP de BdC) ────────
// JJA (Junio-Julio-Agosto) — período crítico para bombas de calor
export const T_MEDIA_INVIERNO = {
  'arica':          13.5, 'iquique':        15.0, 'antofagasta':    14.0, 'calama':         5.5,
  'copiapo':        10.5, 'la_serena':      10.0, 'ovalle':         8.5,
  'valparaiso':     11.5, 'vina_del_mar':   11.5, 'san_felipe':     7.0,
  'santiago':       7.5,  'puente_alto':    7.0,  'maipu':          7.5,
  'rancagua':       7.0,  'curico':         6.5,  'talca':          6.0,  'linares':        6.0,
  'chillan':        5.5,  'concepcion':     7.5,  'los_angeles':    5.5,
  'temuco':         6.0,  'pucon':          5.0,  'valdivia':       6.5,
  'osorno':         5.5,  'puerto_montt':   5.5,  'castro':         5.5,  'ancud':          5.5,
  'coyhaique':      2.5,  'puerto_aysen':   3.5,
  'punta_arenas':   1.5,  'puerto_natales': 1.0,  'porvenir':       1.0,
}

export function obtenerTinvierno(comunaKey, zonaClima = null) {
  const key = comunaKey?.toLowerCase()?.replace(/\s/g, '_')
  const t = T_MEDIA_INVIERNO[key]
  if (t != null) return t
  // Fallback aproximado por macrozona climática (A-H)
  const tablas = { 'A': 13, 'B': 11, 'C': 9, 'D': 7, 'E': 5.5, 'F': 5, 'G': 3, 'H': 1.5 }
  if (zonaClima && tablas[zonaClima]) return tablas[zonaClima]
  const zonaComuna = obtenerZonaClimaComuna(key)
  if (zonaComuna && tablas[zonaComuna]) return tablas[zonaComuna]
  return 7
}
