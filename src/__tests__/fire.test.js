// ─────────────────────────────────────────────────────────────────────────────
// fire.test.js — Regresión de las funciones OGUC/RF (fire.js).
//
// Bloquea el contrato de obtenerLetraOGUC / obtenerRFdeLetra / obtenerRFOGUC.
// Este test habría atrapado el bug de la firma descolocada (auditoría 2026-05-27),
// donde obtenerRFOGUC recibía los argumentos en orden incorrecto y nunca pasaba
// el elemento → siempre devolvía null → contradicciones CUMPLE/NO CUMPLE.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  obtenerLetraOGUC, obtenerRFdeLetra, obtenerRFOGUC, rfStringToNumber,
} from '../lib/engines/fire.js'

// ── Fixture mínimo OGUC Tabla 1 (Habitacional, simplificado) ─────────────────
// Letra según pisos: 1p→a, 2p→b, 3p→c, 4p+→d
const OGUC_TABLA1 = {
  Habitacional: [
    { m2Min: 0, m2Max: 500, letras: ['a', 'b', 'c', 'd', 'd', 'd', 'd'] },
    { m2Min: 501, m2Max: 5000, letras: ['b', 'c', 'd', 'd', 'd', 'd', 'd'] },
  ],
}
// RF por letra y columna
const OGUC_RF_LETRAS = {
  a: { esc: 'F15', cub: 'F15', estr: 'F30' },
  b: { esc: 'F15', cub: 'F15', estr: 'F60' },
  c: { esc: 'F30', cub: 'F30', estr: 'F90' },
  d: { esc: 'F60', cub: 'F30', estr: 'F120' },
}
const OGUC_ELEM_COL = { escaleras: 'esc', cubierta: 'cub', estructura: 'estr' }

describe('obtenerLetraOGUC', () => {
  it('Habitacional 100m² 1 piso → letra a', () => {
    expect(obtenerLetraOGUC('Habitacional', 100, 1, OGUC_TABLA1)).toBe('a')
  })
  it('Habitacional 100m² 2 pisos → letra b', () => {
    expect(obtenerLetraOGUC('Habitacional', 100, 2, OGUC_TABLA1)).toBe('b')
  })
  it('destino inexistente → null', () => {
    expect(obtenerLetraOGUC('NoExiste', 100, 1, OGUC_TABLA1)).toBe(null)
  })
})

describe('obtenerRFdeLetra', () => {
  it('letra a, escaleras → F15', () => {
    expect(obtenerRFdeLetra('a', 'escaleras', OGUC_RF_LETRAS, OGUC_ELEM_COL)).toBe('F15')
  })
  it('letra d, escaleras → F60', () => {
    expect(obtenerRFdeLetra('d', 'escaleras', OGUC_RF_LETRAS, OGUC_ELEM_COL)).toBe('F60')
  })
})

describe('obtenerRFOGUC — contrato corregido (destino, m², pisos, elemento, …)', () => {
  it('Habitacional 100m² 1 piso, escaleras → F15', () => {
    // Caso de Martin Contreras: vivienda 100m² 1 piso → letra a → escaleras F15.
    // (Antes el wrapper roto devolvía null → fallback a F60 → contradicción.)
    const rf = obtenerRFOGUC('Habitacional', 100, 1, 'escaleras', OGUC_TABLA1, OGUC_RF_LETRAS, OGUC_ELEM_COL)
    expect(rf).toBe('F15')
  })
  it('Habitacional 100m² 1 piso, cubierta → F15', () => {
    const rf = obtenerRFOGUC('Habitacional', 100, 1, 'cubierta', OGUC_TABLA1, OGUC_RF_LETRAS, OGUC_ELEM_COL)
    expect(rf).toBe('F15')
  })
  it('Habitacional 100m² 4 pisos, estructura → F120', () => {
    const rf = obtenerRFOGUC('Habitacional', 100, 4, 'estructura', OGUC_TABLA1, OGUC_RF_LETRAS, OGUC_ELEM_COL)
    expect(rf).toBe('F120')
  })
  it('sin elemento → null (no crashea)', () => {
    expect(obtenerRFOGUC('Habitacional', 100, 1, null, OGUC_TABLA1, OGUC_RF_LETRAS, OGUC_ELEM_COL)).toBe(null)
  })
})

describe('rfStringToNumber — orden de RF', () => {
  it('F15 < F30 < F60 < F120', () => {
    expect(rfStringToNumber('F15')).toBeLessThan(rfStringToNumber('F30'))
    expect(rfStringToNumber('F30')).toBeLessThan(rfStringToNumber('F60'))
    expect(rfStringToNumber('F60')).toBeLessThan(rfStringToNumber('F120'))
  })
})
