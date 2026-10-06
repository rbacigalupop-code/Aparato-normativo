// ─────────────────────────────────────────────────────────────────────────────
// clima_mensual.test.js — Temperatura media mensual por comuna/zona.
//
// obtenerTextMes usa la FORMA de la curva mensual representativa de la macrozona
// (NORMALES_MENSUALES_ZONA), re-escalada al rango Tinv..Tver de la comuna, en vez
// de una sinusoide simétrica de 2 puntos. Alimenta demanda, Glaser y moho.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { obtenerTextMes, NORMALES_MENSUALES_ZONA, climaMensual } from '../data/clima_mensual.js'
import { obtenerTinvierno } from '../data/irradiacion_solar.js'
import { obtenerTverano } from '../data/clima_anual.js'

describe('NORMALES_MENSUALES_ZONA', () => {
  it('cubre las macrozonas A-H con 12 meses cada una', () => {
    for (const z of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      expect(NORMALES_MENSUALES_ZONA[z]).toHaveLength(12)
    }
  })
  it('cada curva tiene su mínimo en invierno (Jun/Jul) y máximo en verano (Ene/Feb)', () => {
    for (const z of Object.keys(NORMALES_MENSUALES_ZONA)) {
      const c = NORMALES_MENSUALES_ZONA[z]
      const idxMin = c.indexOf(Math.min(...c))   // 0-indexed
      const idxMax = c.indexOf(Math.max(...c))
      expect([4, 5, 6]).toContain(idxMin)         // May/Jun/Jul
      expect([0, 1, 11]).toContain(idxMax)        // Ene/Feb/Dic
    }
  })
})

describe('obtenerTextMes', () => {
  it('el mes más cálido ≈ Tverano y el más frío ≈ Tinvierno de la comuna (zona D)', () => {
    const tVer = obtenerTverano(null, 'D')
    const tInv = obtenerTinvierno(null, 'D')
    // zona D: máx normal en Ene (mes 1), mín en Jul (mes 7)
    expect(obtenerTextMes(1, null, 'D')).toBeCloseTo(tVer, 5)
    expect(obtenerTextMes(7, null, 'D')).toBeCloseTo(tInv, 5)
  })

  it('todos los meses quedan dentro del rango Tinv..Tver', () => {
    const tVer = obtenerTverano(null, 'F')
    const tInv = obtenerTinvierno(null, 'F')
    for (let m = 1; m <= 12; m++) {
      const t = obtenerTextMes(m, null, 'F')
      expect(t).toBeGreaterThanOrEqual(Math.min(tInv, tVer) - 0.001)
      expect(t).toBeLessThanOrEqual(Math.max(tInv, tVer) + 0.001)
    }
  })

  it('verano más cálido que invierno', () => {
    expect(obtenerTextMes(1, null, 'D')).toBeGreaterThan(obtenerTextMes(7, null, 'D'))
  })

  it('zona sin curva → fallback sinusoidal (sigue devolviendo un número)', () => {
    const t = obtenerTextMes(1, null, 'ZZ')
    expect(Number.isFinite(t)).toBe(true)
  })

  it('climaMensual genera 12 meses con t_ext numérica', () => {
    const cm = climaMensual(null, 'F')
    expect(cm).toHaveLength(12)
    expect(typeof cm[0].t_ext).toBe('number')
  })
})
