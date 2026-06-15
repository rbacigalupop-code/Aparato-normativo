// ─────────────────────────────────────────────────────────────────────────────
// zona_clima.js — Puente entre la zona térmica OFICIAL DS N°15 (A-I) y la
// MACROZONA CLIMÁTICA (A-H) que usa el módulo energético.
//
// Hay DOS taxonomías distintas en la app y NO deben confundirse:
//
//   1. Zona térmica oficial DS N°15 — `COMUNAS_ZONA` / `ZONAS` (src/data.js).
//      9 zonas A-I, regulatorias (U-max de envolvente, cumplimiento OGUC).
//      Es `proy.zona`. Verificada contra la Tabla 1 del decreto.
//      Es deliberadamente gruesa: p.ej. la zona A agrupa Arica, Antofagasta,
//      Calama, Putre y San Pedro de Atacama, climáticamente muy distintas.
//
//   2. Macrozona climática — `zona_clima` (src/data/comunas_chile.js).
//      8 zonas A-H, proxy de clima para estimar demanda energética
//      (HDD/CDD/radiación/HR/irradiación). Inspirada en NCh1079, más granular
//      climáticamente (Calama=E, Ollague=F, Putre=E).
//
// Este módulo provee el mapeo explícito 1→2 (MAPA_OGUC_CLIMA) y el resolver
// zonaClimaDeOGUC(), de modo que:
//   · En comunas MULTI-ZONA oficial (Putre, Lonquimay…) el clima SIGUE la zona
//     oficial que eligió el usuario (no un valor fijo de la comuna).
//   · En comunas mono-zona se prefiere su clima propio (más granular).
// ─────────────────────────────────────────────────────────────────────────────

import { obtenerZonaClimaComuna, buscarComunaKey } from './comunas_chile.js'
import { zonasOficialesDeComuna } from './zonas_oficial.js'

// Re-export: la resolución oficial comuna→zonas (con alias y multi-zona por cota)
// vive en zonas_oficial.js, derivada de la tabla DITEC.
export { zonasOficialesDeComuna }

// Zona térmica oficial DS N°15 (A-I) → macrozona climática (A-H).
// Se usa cuando la comuna es multi-zona oficial (el usuario eligió un sector) o
// cuando no hay clima propio catalogado para la comuna.
//   · A-G mapean 1:1 (misma letra ≈ mismo significado climático grueso).
//   · H (cordillera sur, muy fría) → G (sur extremo) como clima representativo.
//   · I (austral, Coyhaique/Magallanes) → H (sur austral).
export const MAPA_OGUC_CLIMA = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  H: 'G',
  I: 'H',
}

/**
 * Resuelve la MACROZONA CLIMÁTICA (A-H) a usar en el módulo energético.
 *
 * Prioridad:
 *   1. Comuna MULTI-ZONA oficial + zona elegida → mapeo oficial→clima
 *      (el clima sigue la selección del usuario; p.ej. Putre A vs Putre H).
 *   2. Clima propio de la comuna (más granular; p.ej. Calama=E aunque su zona
 *      oficial sea A).
 *   3. Mapeo oficial→clima de la zona pasada.
 *   4. 'D' (centro interior) como último recurso.
 *
 * @param {string|null} zonaOGUC  zona oficial DS N°15 (A-I), normalmente proy.zona
 * @param {string|null} comuna    nombre o clave de la comuna
 * @returns {string} 'A'..'H'
 */
export function zonaClimaDeOGUC(zonaOGUC, comuna = null) {
  const oficiales = zonasOficialesDeComuna(comuna)
  if (oficiales.length > 1 && zonaOGUC && MAPA_OGUC_CLIMA[zonaOGUC]) {
    return MAPA_OGUC_CLIMA[zonaOGUC]
  }
  const propia = obtenerZonaClimaComuna(buscarComunaKey(comuna) || comuna)
  if (propia) return propia
  return MAPA_OGUC_CLIMA[zonaOGUC] || 'D'
}
