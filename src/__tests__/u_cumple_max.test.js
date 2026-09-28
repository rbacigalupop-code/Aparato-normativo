// ─────────────────────────────────────────────────────────────────────────────
// u_cumple_max.test.js — uCumpleMax (thermal.js)
//
// Bug C: la comparación de cumplimiento redondeaba el U a 2 decimales ANTES de
// comparar (Math.round(u*100)/100 <= umax), así que U=0,454 se evaluaba como
// 0,45 y "cumplía" el límite 0,45. El redondeo es solo de presentación; la
// evaluación usa el valor real.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { uCumpleMax } from '../lib/engines/thermal.js'

describe('uCumpleMax — compara el U REAL, sin redondear a 2 decimales', () => {
  it('U = 0.4499, límite 0.45 → CUMPLE', () => {
    expect(uCumpleMax(0.4499, 0.45)).toBe(true)
  })
  it('U = 0.4500, límite 0.45 → CUMPLE', () => {
    expect(uCumpleMax(0.45, 0.45)).toBe(true)
  })
  it('U = 0.4501, límite 0.45 → NO CUMPLE (antes daba CUMPLE por redondeo)', () => {
    expect(uCumpleMax(0.4501, 0.45)).toBe(false)
  })
  it('U = 0.454, límite 0.45 → NO CUMPLE (caso de la crítica)', () => {
    expect(uCumpleMax(0.454, 0.45)).toBe(false)
  })
  it('acepta strings (los checks pasan U con toFixed)', () => {
    expect(uCumpleMax('0.2960', 0.28)).toBe(false)
    expect(uCumpleMax('0.2799', 0.28)).toBe(true)
  })
  it('tolera error de punto flotante (0,45 exacto cumple ≤ 0,45)', () => {
    expect(uCumpleMax(0.1 + 0.35, 0.45)).toBe(true) // 0.1+0.35 = 0.44999999999999996
    expect(uCumpleMax(0.15 + 0.30, 0.45)).toBe(true)
  })
  it('valor o límite no numérico → false (fail-safe, no CUMPLE por dato inválido)', () => {
    expect(uCumpleMax(NaN, 0.45)).toBe(false)
    expect(uCumpleMax('—', 0.45)).toBe(false)
    expect(uCumpleMax(0.3, undefined)).toBe(false)
    expect(uCumpleMax(null, 0.45)).toBe(false)
  })
  it('el margen es numérico (1e-9), no un margen normativo: 0,4501 no cumple', () => {
    expect(uCumpleMax(0.4501, 0.45)).toBe(false)
    expect(uCumpleMax(0.45000000005, 0.45)).toBe(true)
  })
})
