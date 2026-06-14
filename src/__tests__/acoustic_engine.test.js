// ─────────────────────────────────────────────────────────────────────────────
// acoustic_engine.test.js — M2
//
// Bug histórico: estimarRwComposicion y calcularMejoraAcustica usaban una fórmula
// de paralelo con factor -20 (presión) en vez de -10 (potencia), y "mejorar"
// daba un Rw MENOR (añadir aislación "empeoraba"). Corregido:
//  · estimarRwComposicion = composición en PARALELO (ISO 12354-3), factor -10,
//    ponderada por área. El camino más débil domina.
//  · calcularMejoraAcustica = capas EN SERIE, modelo aditivo ΔRw → mejora ≥ 0.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  estimarRwComposicion,
  calcularMejoraAcustica,
  validarRwCumplimiento,
} from '../lib/engines/acoustic.js'

describe('estimarRwComposicion — paralelo (ISO 12354-3)', () => {
  it('dos elementos idénticos no cambian el Rw', () => {
    const r = estimarRwComposicion([{ rw: 40 }, { rw: 40 }])
    expect(r.rwEstimado).toBeCloseTo(40, 1)
  })

  it('el elemento débil baja el conjunto por debajo del fuerte', () => {
    // muro Rw=50 + ventana Rw=30, igual área → τ=(1e-5+1e-3)/2 → ~33 dB
    const r = estimarRwComposicion([{ rw: 50 }, { rw: 30 }])
    expect(r.rwEstimado).toBeCloseTo(33.0, 1)
    expect(r.rwEstimado).toBeLessThan(50)   // peor que el fuerte
    expect(r.rwEstimado).toBeGreaterThan(30) // mejor que el débil puro (es parte del área)
  })

  it('ponderación por área: más superficie débil empeora más el conjunto', () => {
    const pocoDebil = estimarRwComposicion([{ rw: 50, area: 9 }, { rw: 30, area: 1 }])
    const muchoDebil = estimarRwComposicion([{ rw: 50, area: 1 }, { rw: 30, area: 9 }])
    expect(muchoDebil.rwEstimado).toBeLessThan(pocoDebil.rwEstimado)
  })

  it('lista vacía / sin rw válido → null', () => {
    expect(estimarRwComposicion([])).toBeNull()
    expect(estimarRwComposicion([{ rw: 0 }])).toBeNull()
  })
})

describe('calcularMejoraAcustica — serie aditiva', () => {
  it('añadir capas SUBE el Rw (mejora ≥ 0)', () => {
    const r = calcularMejoraAcustica(45, [{ rw: 5 }, { rw: 3 }])
    expect(r.rwMejorado).toBe(53)
    expect(r.mejora).toBe(8)
    expect(r.mejora).toBeGreaterThanOrEqual(0)
  })

  it('nunca empeora: rwMejorado ≥ rwBase', () => {
    const r = calcularMejoraAcustica(50, [{ rw: 0 }, { rw: 2 }])
    expect(r.rwMejorado).toBeGreaterThanOrEqual(50)
  })

  it('sin base o sin elementos → null', () => {
    expect(calcularMejoraAcustica(0, [{ rw: 5 }])).toBeNull()
    expect(calcularMejoraAcustica(45, [])).toBeNull()
  })
})

describe('validarRwCumplimiento — sin regresión', () => {
  it('cumple cuando actual ≥ requerido', () => {
    expect(validarRwCumplimiento(45, 40).cumple).toBe(true)
    expect(validarRwCumplimiento(35, 40).cumple).toBe(false)
  })
  it('sin requisito → cumple', () => {
    expect(validarRwCumplimiento(30, null).cumple).toBe(true)
  })
})
