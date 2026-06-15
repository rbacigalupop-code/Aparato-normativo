// ─────────────────────────────────────────────────────────────────────────────
// zonas_oficial.js — FUENTE ÚNICA comuna → zona térmica oficial DS N°15 (A-I).
//
// Construido sobre la tabla oficial DITEC (src/data/zonas_ditec.js, COMUNAS_ZT),
// que asigna zona por ALTITUD (msnm) y, en 8 comunas, por MERIDIANO. Muchas
// comunas son MULTI-ZONA por cota (umbrales típicos 1.100 / 3.000 msnm): la zona
// depende de la altitud del predio.
//
// Reemplaza el COMUNAS_ZONA hecho a mano que divergía de la tabla oficial en ~110
// comunas. Expone:
//   · COMUNAS_ZONA            — zona → [nombres]  (compat con resolveZonas/A4)
//   · zonasOficialesDeComuna  — comuna → [zonas]  (acepta nombre o clave)
//   · resolverZonaPorCota     — comuna + cota(msnm) → zona única (o null si falta
//                               la cota o el corte es por meridiano)
//   · umbralesDeComuna        — bandas legibles para la UI
// ─────────────────────────────────────────────────────────────────────────────

import { COMUNAS_ZT } from './zonas_ditec.js'

// Comunas ausentes en la tabla DITEC (p.ej. Antártica) — zona asignada a mano.
const MANUAL = {
  'antartica': { region: 'XII', nombre: 'Antártica', reglas: [{ zona: 'I' }] },
}

// Display preferido cuando la app usa otra grafía que la tabla oficial.
const DISPLAY_ALIAS = { 'coihaique': 'Coyhaique' }

// canon(app o catálogo) → canon(clave oficial) cuando el nombre difiere de fondo.
const LOOKUP_ALIAS = {
  coyhaique: 'coihaique',
  puertoaysen: 'aisen',
  puertonatales: 'natales',
  sanpedrorm: 'sanpedro',
}

// Solo se eliminan los enlaces "de/del" (el catálogo a veces los omite, p.ej.
// "san_pedro_atacama" ↔ "San Pedro de Atacama"). NO se quitan los artículos
// la/el/los/las: distinguen comunas distintas (Florida VIII vs La Florida RM).
const STOP = new Set(['de', 'del'])
// minúsculas, sin acentos, sin apóstrofes, sin separadores ni enlaces
function canon(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['']/g, '')
    .replace(/[_\s]+/g, ' ').trim()
    .split(' ').filter(w => w && !STOP.has(w)).join('')
}

// Índice canon → entry {region, nombre, reglas}
const _idx = {}
for (const [k, v] of Object.entries({ ...COMUNAS_ZT, ...MANUAL })) {
  _idx[canon(k)] = v
}

function entryDe(comuna) {
  const c = canon(comuna)
  return _idx[c] || _idx[LOOKUP_ALIAS[c]] || null
}

/** Reglas oficiales {zona, altMin?, altMax?, meridiano?} de una comuna, o null. */
export function reglasDeComuna(comuna) {
  return entryDe(comuna)?.reglas || null
}

/** Zonas térmicas oficiales DS N°15 de una comuna (acepta nombre o clave). */
export function zonasOficialesDeComuna(comuna) {
  const r = reglasDeComuna(comuna)
  return r ? [...new Set(r.map(x => x.zona))].sort() : []
}

// Una regla sin banda de altitud (solo meridiano, p.ej. Antofagasta A ≥70°)
// pertenece de hecho a la franja BAJO el primer umbral de altitud de la comuna:
// si existe una zona ≥ altMin (p.ej. H ≥3.000), esa altitud manda por encima de
// la regla sin altitud. Por eso a esas reglas les damos un altMax implícito.
function reglaMatchCota(r, cota, minAltMin) {
  let altMax = r.altMax ?? null
  if (r.altMin == null && altMax == null && minAltMin !== Infinity) altMax = minAltMin
  if (r.altMin != null && cota < r.altMin) return false
  if (altMax != null && cota >= altMax) return false
  return true
}

/**
 * Resuelve la zona única según la cota (msnm). Devuelve null si:
 *   · no se pasa cota y la comuna es multi-zona, o
 *   · el corte a esa cota es por meridiano y la altitud no desambigua
 *     (la UI debe mostrar las opciones y dejar elegir).
 * @param {string} comuna
 * @param {number|null} cotaMsnm
 * @returns {string|null}
 */
// "70° 44'" → 70.733 (grados decimales). El meridiano se expresa en °O (positivo).
function meridDeg(s) {
  const m = String(s || '').match(/(\d+)°(?:\s*(\d+)')?/)
  return m ? +m[1] + (m[2] ? +m[2] / 60 : 0) : null
}
function reglaMatchMeridiano(r, lngOeste) {
  if (!r.meridiano || lngOeste == null) return true
  const deg = meridDeg(r.meridiano); if (deg == null) return true
  if (/[≥]|>/.test(r.meridiano)) return lngOeste >= deg  // más al oeste (costa)
  if (/[≤]|</.test(r.meridiano)) return lngOeste <= deg  // más al este (interior)
  return true
}

/**
 * Resuelve la zona única de una comuna usando la cota y/o la longitud del predio.
 * Desambigua la duplicidad por ALTITUD (cota) y por MERIDIANO (longitud).
 * @param {string} comuna
 * @param {{cota?:number|null, lng?:number|null}} coords
 *   cota: msnm. lng: longitud (se usa su valor absoluto en °O; acepta -73.0 o 73.0).
 * @returns {string|null} zona única, o null si los datos no desambiguan.
 */
export function resolverZona(comuna, { cota = null, lng = null } = {}) {
  const reglas = reglasDeComuna(comuna)
  if (!reglas) return null
  const lngO = (lng != null && !isNaN(lng)) ? Math.abs(lng) : null
  let cand = reglas
  if (cota != null && !isNaN(cota)) {
    const minAltMin = Math.min(Infinity, ...reglas.filter(r => r.altMin != null).map(r => r.altMin))
    let m = cand.filter(r => reglaMatchCota(r, cota, minAltMin))
    // Cota bajo la banda más baja (p.ej. Camiña sin tramo <1.100 m) → banda inferior.
    if (m.length === 0 && minAltMin !== Infinity && cota < minAltMin) {
      const baja = reglas.filter(r => r.altMin != null).sort((a, b) => a.altMin - b.altMin)[0]
      m = baja ? [baja] : []
    }
    cand = m
  }
  if (lngO != null) cand = cand.filter(r => reglaMatchMeridiano(r, lngO))
  const zs = [...new Set(cand.map(r => r.zona))]
  return zs.length === 1 ? zs[0] : null
}

/** Compat: resuelve solo por cota (altitud). Ver resolverZona() para incluir longitud. */
export function resolverZonaPorCota(comuna, cotaMsnm = null) {
  return resolverZona(comuna, { cota: cotaMsnm })
}

/** ¿La comuna se divide en >1 zona (por cota o meridiano)? */
export function esMultiZona(comuna) {
  return zonasOficialesDeComuna(comuna).length > 1
}

/**
 * Bandas legibles para la UI: [{zona, alt, meridiano}] donde alt es texto
 * (p.ej. '< 1.100 msnm', '1.100–3.000 msnm', '≥ 3.000 msnm') o null.
 */
export function umbralesDeComuna(comuna) {
  const reglas = reglasDeComuna(comuna)
  if (!reglas) return []
  return reglas.map(r => {
    const a = r.altMin != null, b = r.altMax != null
    const alt = a && b ? `${r.altMin.toLocaleString('es-CL')}–${r.altMax.toLocaleString('es-CL')} msnm`
      : a ? `≥ ${r.altMin.toLocaleString('es-CL')} msnm`
      : b ? `< ${r.altMax.toLocaleString('es-CL')} msnm` : null
    return { zona: r.zona, alt, meridiano: r.meridiano || null }
  })
}

// ── COMUNAS_ZONA derivado: zona → [nombres] (compat resolveZonas/A4) ──────────
export const COMUNAS_ZONA = (() => {
  const out = {}
  for (const [k, v] of Object.entries({ ...COMUNAS_ZT, ...MANUAL })) {
    const nombre = DISPLAY_ALIAS[canon(k)] || v.nombre
    for (const z of new Set(v.reglas.map(r => r.zona))) {
      (out[z] ||= []).push(nombre)
    }
  }
  for (const z of Object.keys(out)) out[z].sort((a, b) => a.localeCompare(b, 'es'))
  return out
})()
