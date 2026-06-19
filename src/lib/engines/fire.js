/**
 * Fire Engine — Funciones puras de validación Resistencia al Fuego (RF)
 * No contiene React, solo lógica de negocio normativa
 */

// ─── Conversión RF string a número (F30=30, F60=60, F0=0) ─────────────────────
export function rfStringToNumber(rfStr) {
  if (!rfStr) return 0
  const match = rfStr.match(/F(\d+)/)
  return match ? parseInt(match[1]) : 0
}

// Alias
export const rfN = rfStringToNumber

// ─── Validación si se requiere caja de escalera cerrada ──────────────────────
export function requiereCajaEscalera(uso, numPisos) {
  const pisos = parseInt(numPisos) || 0

  // OGUC Art. 4.5.7
  if (pisos <= 1) return false

  // Salud y Educación: 2+ pisos
  if (uso === 'Salud' || uso === 'Educacion') return pisos >= 2

  // Industrial: 2+ pisos
  if (uso === 'Industrial') return pisos >= 2

  // Comercio y Oficina: 3+ pisos
  if (uso === 'Comercio' || uso === 'Oficina') return pisos >= 3

  // Vivienda y otros: 4+ pisos
  return pisos >= 4
}

// ─── Obtener letra OGUC según destino, superficie y pisos ────────────────────
export function obtenerLetraOGUC(destino, superficie, numPisos, OGUC_TABLA1 = {}) {
  if (!destino || !OGUC_TABLA1) return null

  const tabla = OGUC_TABLA1[destino]
  if (!tabla) return null

  const pisos = Math.min(Math.max(parseInt(numPisos) || 1, 1), 7)
  const m2 = parseFloat(superficie) || 0

  // Buscar fila de rango m² adecuada
  const fila = tabla.find(f => m2 >= f.m2Min && m2 <= f.m2Max)
  if (!fila || !fila.letras) return null

  // Retornar letra según piso (índice pisos-1)
  return fila.letras[pisos - 1] || fila.letras[fila.letras.length - 1]
}

// ─── Obtener RF de letra OGUC para elemento específico ───────────────────────
export function obtenerRFdeLetra(letra, elemento, OGUC_RF_LETRAS = {}, OGUC_ELEM_COL = {}) {
  if (!letra || !elemento) return null

  const letraLower = letra.toLowerCase()
  const col = OGUC_ELEM_COL[elemento]

  if (!col || !OGUC_RF_LETRAS[letraLower]) return null

  return OGUC_RF_LETRAS[letraLower][col] || null
}

// ─── Obtener RF de tabla OGUC para elemento ───────────────────────────────
// Firma: (destino OGUC, superficie m², pisos, elemento, ...tablas OGUC).
// IMPORTANTE: el primer argumento es el DESTINO OGUC (string de la Tabla 1),
// NO el "uso" interno de la app. Antes el parámetro se llamaba `uso` lo que
// confundía a los callers (el wrapper en App.jsx pasaba los args descolocados
// y nunca pasaba `elemento` → siempre devolvía null). Ver auditoría 2026-05-27.
export function obtenerRFOGUC(destino, superficie, pisos, elemento, OGUC_TABLA1 = {}, OGUC_RF_LETRAS = {}, OGUC_ELEM_COL = {}) {
  const letra = obtenerLetraOGUC(destino, superficie, pisos, OGUC_TABLA1)
  if (!letra) return null
  return obtenerRFdeLetra(letra, elemento, OGUC_RF_LETRAS, OGUC_ELEM_COL)
}
