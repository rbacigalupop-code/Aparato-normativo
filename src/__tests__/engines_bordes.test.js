// ─────────────────────────────────────────────────────────────────────────────
// engines_bordes.test.js — Robustez de bordes (auditoría Fase 0, BAJA)
//
// B1: calcularU sin capas con aporte real devolvía 1/(Rsi+Rse) ≈ 5.88 (U engañoso).
//     Ahora devuelve null → la UI lo trata como "sin dato".
// B2: perdidaPTUnico con un ptId inexistente devolvía 0 (indistinguible de "0
//     pérdida"). Ahora devuelve null → "PT desconocido".
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { calcularU } from '../lib/engines/thermal.js'
import { perdidaPTUnico } from '../lib/engines/puentes_termicos.js'
import { PUENTES_TERMICOS } from '../data/puentes_termicos.js'

const RSI_RSE = { rsi: 0.13, rse: 0.04 }

describe('B1 — calcularU: bordes sin aporte', () => {
  it('capas vacías → null (no ~5.88)', () => {
    expect(calcularU([], [], [], RSI_RSE)).toBeNull()
  })
  it('capas presentes pero sin λ/espesor válidos → null', () => {
    expect(calcularU([{}, {}], [0, 0], [0, 0], RSI_RSE)).toBeNull()
  })
  it('falta rsiRse → null', () => {
    expect(calcularU([1], [0.04], [100], null)).toBeNull()
  })
  it('una capa real sí calcula (EPS 100mm λ=0.04 → ~0.375)', () => {
    const u = calcularU([1], [0.04], [100], RSI_RSE)
    expect(u).not.toBeNull()
    expect(u).toBeCloseTo(0.375, 2)
  })
})

describe('B2 — perdidaPTUnico: id inexistente', () => {
  const validId = PUENTES_TERMICOS[0].id

  it('ptId inexistente → null (no 0)', () => {
    expect(perdidaPTUnico('NO_EXISTE_xyz', 10, 'tipico', 1000)).toBeNull()
  })
  it('ptId válido → número de pérdida ≥ 0', () => {
    const q = perdidaPTUnico(validId, 10, 'tipico', 1000)
    expect(typeof q).toBe('number')
    expect(q).toBeGreaterThan(0)
  })
  it('longitud 0 con ptId válido → 0 (cero legítimo, no null)', () => {
    expect(perdidaPTUnico(validId, 0, 'tipico', 1000)).toBe(0)
  })
})
