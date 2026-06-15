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
//
// NOTA: el campo `zona_clima` de cada comuna es la MACROZONA CLIMÁTICA (A-H,
// proxy de clima), NO la zona térmica oficial DS N°15 (A-I de COMUNAS_ZONA).
// Es informativo; el cálculo usa `hdd18` directo o el fallback por zona climática.
// ─────────────────────────────────────────────────────────────────────────────

export const GRADOS_DIA = {
  // ─── Norte (I–IV) ─────────────────────────────────────────────────────────
  'arica':          { region: 'XV', hdd18: 280,  zona_clima: 'A' },
  'iquique':        { region: 'I',  hdd18: 340,  zona_clima: 'A' },
  'antofagasta':    { region: 'II', hdd18: 580,  zona_clima: 'B' },
  'calama':         { region: 'II', hdd18: 2150, zona_clima: 'E' },  // desierto altura
  'copiapo':        { region: 'III',hdd18: 980,  zona_clima: 'B' },
  'la_serena':      { region: 'IV', hdd18: 1150, zona_clima: 'C' },
  'ovalle':         { region: 'IV', hdd18: 1380, zona_clima: 'C' },

  // ─── Centro (V–VII + RM) ──────────────────────────────────────────────────
  'valparaiso':     { region: 'V',  hdd18: 1280, zona_clima: 'C' },
  'vina_del_mar':   { region: 'V',  hdd18: 1320, zona_clima: 'C' },
  'san_felipe':     { region: 'V',  hdd18: 1620, zona_clima: 'D' },
  'santiago':       { region: 'RM', hdd18: 1480, zona_clima: 'D' },
  'puente_alto':    { region: 'RM', hdd18: 1520, zona_clima: 'D' },
  'maipu':          { region: 'RM', hdd18: 1490, zona_clima: 'D' },
  'rancagua':       { region: 'VI', hdd18: 1650, zona_clima: 'D' },
  'curico':         { region: 'VII',hdd18: 1820, zona_clima: 'D' },
  'talca':          { region: 'VII',hdd18: 1890, zona_clima: 'D' },
  'linares':        { region: 'VII',hdd18: 1950, zona_clima: 'D' },

  // ─── Sur (VIII–XIV + XVI) ─────────────────────────────────────────────────
  'chillan':        { region: 'XVI',hdd18: 2050, zona_clima: 'E' },
  'concepcion':     { region: 'VIII',hdd18: 1980, zona_clima: 'E' },
  'los_angeles':    { region: 'VIII',hdd18: 2180, zona_clima: 'E' },
  'temuco':         { region: 'IX', hdd18: 2240, zona_clima: 'E' },
  'pucon':          { region: 'IX', hdd18: 2480, zona_clima: 'E' },
  'valdivia':       { region: 'XIV',hdd18: 2380, zona_clima: 'E' },
  'osorno':         { region: 'X',  hdd18: 2580, zona_clima: 'F' },
  'puerto_montt':   { region: 'X',  hdd18: 2680, zona_clima: 'F' },
  'castro':         { region: 'X',  hdd18: 2820, zona_clima: 'F' },
  'ancud':          { region: 'X',  hdd18: 2780, zona_clima: 'F' },

  // ─── Austral (XI–XII) ─────────────────────────────────────────────────────
  'coyhaique':      { region: 'XI', hdd18: 3580, zona_clima: 'G' },
  'puerto_aysen':   { region: 'XI', hdd18: 3320, zona_clima: 'G' },
  'punta_arenas':   { region: 'XII',hdd18: 4180, zona_clima: 'H' },
  'puerto_natales': { region: 'XII',hdd18: 4280, zona_clima: 'H' },
  'porvenir':       { region: 'XII',hdd18: 4350, zona_clima: 'H' },
}

// Fallback por MACROZONA CLIMÁTICA (A-H) si la comuna no está catalogada.
// NO indexar con la zona oficial DS N°15 (A-I); usa zonaClimaDeOGUC() antes.
export const HDD18_POR_ZONA_CLIMA = {
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
import { COMUNAS_CHILE, obtenerZonaClimaComuna } from './comunas_chile.js'

/**
 * Obtiene HDD18 de una comuna.
 * `zonaClima` es la MACROZONA CLIMÁTICA (A-H) — normalmente derivada de la zona
 * oficial elegida vía zonaClimaDeOGUC() — y tiene prioridad sobre el valor fijo
 * de la comuna para que las comunas multi-zona sigan la selección del usuario.
 * Prioridad: GRADOS_DIA detallado (28 comunas) → zonaClima pasada → clima fijo
 * de la comuna → Santiago.
 */
export function obtenerHDD18(comunaKey, zonaClima = null) {
  const key = comunaKey?.toLowerCase()?.replace(/\s/g, '_')
  // 1. Tabla detallada (más precisa)
  const detallado = GRADOS_DIA[key]
  if (detallado) return detallado.hdd18
  // 2. Macrozona climática pasada (sigue la zona oficial elegida)
  if (zonaClima && HDD18_POR_ZONA_CLIMA[zonaClima]) return HDD18_POR_ZONA_CLIMA[zonaClima]
  // 3. Clima fijo de la comuna
  const zonaComuna = obtenerZonaClimaComuna(key)
  if (zonaComuna && HDD18_POR_ZONA_CLIMA[zonaComuna]) return HDD18_POR_ZONA_CLIMA[zonaComuna]
  // 4. Default Santiago
  return 1480
}

// Lista ordenada — para retrocompatibilidad con código anterior.
// Para uso nuevo: usa listarComunasOrdenadas() de comunas_chile.js.
export const COMUNAS_LISTA = Object.keys(GRADOS_DIA)
  .map(k => ({ key: k, nombre: k.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), ...GRADOS_DIA[k] }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre))
