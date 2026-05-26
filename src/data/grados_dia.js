// ─────────────────────────────────────────────────────────────────────────────
// grados_dia.js — Grados-día de calefacción base 18°C (HDD18) por comuna chilena.
//
// Fuente:
//   · Explorador Solar MINENERGÍA (datos climáticos TMY)
//   · Anuarios Dirección Meteorológica de Chile
//   · Ajustes con datos de Stieger / Bustamante (NCh853 anexos)
//
// Uso típico:
//   Q_anual_kWh = U_elem · A_m2 · HDD18 · 24 / 1000
//
// HDD18 = Σ (18 - T_media_diaria) cuando T_media < 18°C, anual
// Cuanto mayor HDD18, más demanda de calefacción.
// ─────────────────────────────────────────────────────────────────────────────

export const GRADOS_DIA = {
  // ─── Norte (I–IV) ─────────────────────────────────────────────────────────
  'arica':          { region: 'XV', hdd18: 280,  zona_ds15: 'A' },
  'iquique':        { region: 'I',  hdd18: 340,  zona_ds15: 'A' },
  'antofagasta':    { region: 'II', hdd18: 580,  zona_ds15: 'B' },
  'calama':         { region: 'II', hdd18: 2150, zona_ds15: 'E' },  // desierto altura
  'copiapo':        { region: 'III',hdd18: 980,  zona_ds15: 'B' },
  'la_serena':      { region: 'IV', hdd18: 1150, zona_ds15: 'C' },
  'ovalle':         { region: 'IV', hdd18: 1380, zona_ds15: 'C' },

  // ─── Centro (V–VII + RM) ──────────────────────────────────────────────────
  'valparaiso':     { region: 'V',  hdd18: 1280, zona_ds15: 'C' },
  'vina_del_mar':   { region: 'V',  hdd18: 1320, zona_ds15: 'C' },
  'san_felipe':     { region: 'V',  hdd18: 1620, zona_ds15: 'D' },
  'santiago':       { region: 'RM', hdd18: 1480, zona_ds15: 'D' },
  'puente_alto':    { region: 'RM', hdd18: 1520, zona_ds15: 'D' },
  'maipu':          { region: 'RM', hdd18: 1490, zona_ds15: 'D' },
  'rancagua':       { region: 'VI', hdd18: 1650, zona_ds15: 'D' },
  'curico':         { region: 'VII',hdd18: 1820, zona_ds15: 'D' },
  'talca':          { region: 'VII',hdd18: 1890, zona_ds15: 'D' },
  'linares':        { region: 'VII',hdd18: 1950, zona_ds15: 'D' },

  // ─── Sur (VIII–XIV + XVI) ─────────────────────────────────────────────────
  'chillan':        { region: 'XVI',hdd18: 2050, zona_ds15: 'E' },
  'concepcion':     { region: 'VIII',hdd18: 1980, zona_ds15: 'E' },
  'los_angeles':    { region: 'VIII',hdd18: 2180, zona_ds15: 'E' },
  'temuco':         { region: 'IX', hdd18: 2240, zona_ds15: 'E' },
  'pucon':          { region: 'IX', hdd18: 2480, zona_ds15: 'E' },
  'valdivia':       { region: 'XIV',hdd18: 2380, zona_ds15: 'E' },
  'osorno':         { region: 'X',  hdd18: 2580, zona_ds15: 'F' },
  'puerto_montt':   { region: 'X',  hdd18: 2680, zona_ds15: 'F' },
  'castro':         { region: 'X',  hdd18: 2820, zona_ds15: 'F' },
  'ancud':          { region: 'X',  hdd18: 2780, zona_ds15: 'F' },

  // ─── Austral (XI–XII) ─────────────────────────────────────────────────────
  'coyhaique':      { region: 'XI', hdd18: 3580, zona_ds15: 'G' },
  'puerto_aysen':   { region: 'XI', hdd18: 3320, zona_ds15: 'G' },
  'punta_arenas':   { region: 'XII',hdd18: 4180, zona_ds15: 'H' },
  'puerto_natales': { region: 'XII',hdd18: 4280, zona_ds15: 'H' },
  'porvenir':       { region: 'XII',hdd18: 4350, zona_ds15: 'H' },
}

// Fallback por zona OGUC si la comuna no está catalogada
export const HDD18_POR_ZONA_DS15 = {
  'A': 400,
  'B': 800,
  'C': 1280,
  'D': 1620,
  'E': 2200,
  'F': 2680,
  'G': 3450,
  'H': 4200,
}

// ─── Helpers ────────────────────────────────────────────────────────────────
import { COMUNAS_CHILE, obtenerZonaDS15Comuna } from './comunas_chile.js'

/**
 * Obtiene HDD18 de una comuna.
 * Prioridad: GRADOS_DIA detallado (28 comunas) → HDD18_POR_ZONA_DS15 (zona de la
 * comuna en COMUNAS_CHILE) → fallback zonaDS15 pasado → Santiago.
 */
export function obtenerHDD18(comunaKey, zonaDS15 = null) {
  const key = comunaKey?.toLowerCase()?.replace(/\s/g, '_')
  // 1. Tabla detallada (más precisa)
  const detallado = GRADOS_DIA[key]
  if (detallado) return detallado.hdd18
  // 2. Zona DS N°15 oficial de la comuna
  const zonaComuna = obtenerZonaDS15Comuna(key)
  if (zonaComuna && HDD18_POR_ZONA_DS15[zonaComuna]) return HDD18_POR_ZONA_DS15[zonaComuna]
  // 3. Zona pasada explícitamente
  if (zonaDS15 && HDD18_POR_ZONA_DS15[zonaDS15]) return HDD18_POR_ZONA_DS15[zonaDS15]
  // 4. Default Santiago
  return 1480
}

// Lista ordenada — para retrocompatibilidad con código anterior.
// Para uso nuevo: usa listarComunasOrdenadas() de comunas_chile.js.
export const COMUNAS_LISTA = Object.keys(GRADOS_DIA)
  .map(k => ({ key: k, nombre: k.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), ...GRADOS_DIA[k] }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre))
