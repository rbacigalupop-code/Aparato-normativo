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
  evaluarSeccionResidual,
} from '../lib/engines/fire.js'

// ── B2 · método de sección residual (madera/CLT) — no acredita solo ──────────
describe('evaluarSeccionResidual — no acredita con sección insuficiente (B2)', () => {
  it('90mm, β₀=0.65, t=60 → residual 12mm, NO aplicable', () => {
    const r = evaluarSeccionResidual(90, 0.65, 60)
    expect(r.carbon).toBeCloseTo(39, 5)
    expect(r.residual).toBeCloseTo(12, 5)   // 90 − 2×39
    expect(r.aplicable).toBe(false)          // 13% de la sección → no acredita por sí solo
  })
  it('sección amplia con residual ≥ 50% → aplicable', () => {
    const r = evaluarSeccionResidual(200, 0.7, 30)  // carbon 21, residual 158 = 79%
    expect(r.aplicable).toBe(true)
  })
  it('sección totalmente carbonizada → residual ≤ 0, NO aplicable', () => {
    const r = evaluarSeccionResidual(60, 0.7, 60)   // carbon 42, residual −24
    expect(r.residual).toBeLessThan(0)
    expect(r.aplicable).toBe(false)
  })
})

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
