// ─────────────────────────────────────────────────────────────────────────────
// puertas_loscaa.test.js — Catálogo P3
//
// Puertas exteriores certificadas acústicamente, importadas de LOSCAA Ed.13 con
// su código y Rw oficiales. La U es estimada NCh853 (LOSCAA no la certifica).
//
// Invariantes:
//  · el ac_rw debe ser EXACTAMENTE el certificado LOSCAA (no estimaciones infladas);
//  · u debe ser numérica (nunca null/undefined → evita falso-cumple en `u <= uMax`);
//  · rf null (LOSCAA no certifica fuego).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { SC } from '../data.js'
import { LOSCAA } from '../data/loscaa.js'

const CODES = ['E.P.M.01.01', 'E.P.M.01.02', 'E.P.M.01.03']

describe('Puertas LOSCAA en el catálogo', () => {
  for (const cod of CODES) {
    const sc = SC.find(s => s.cod === cod)

    it(`${cod} existe como puerta`, () => {
      expect(sc).toBeTruthy()
      expect(sc.elem).toBe('puerta')
    })

    it(`${cod} usa el Rw CERTIFICADO de LOSCAA (no estimado)`, () => {
      expect(sc.ac_rw).toBe(LOSCAA[cod].rw)
    })

    it(`${cod} tiene U numérica (no null) para no falsear el chequeo térmico`, () => {
      expect(typeof sc.u).toBe('number')
      expect(Number.isFinite(sc.u)).toBe(true)
      expect(sc.u).toBeGreaterThan(0)
    })

    it(`${cod} no inventa RF (LOSCAA no lo certifica)`, () => {
      expect(sc.rf).toBeNull()
    })
  }

  it('una puerta básica de madera no cumple U≤1.70 (solo zona A)', () => {
    const sc = SC.find(s => s.cod === 'E.P.M.01.01')
    expect(sc.u).toBeGreaterThan(1.70) // honesto: requiere núcleo aislante para B-I
  })
})
