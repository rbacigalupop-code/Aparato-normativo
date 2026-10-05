// ─────────────────────────────────────────────────────────────────────────────
// puentes_termicos.test.js — Motor de puentes térmicos lineales (Ψ).
//
// Blinda calcularSumaPsiL() (que ALIMENTA el balance mensual ISO 13790 vía
// H_D = ΣU·A + ΣΨ·L), analizarInventarioPT, porcentajeImpactoPT y severidadPT.
// perdidaPTUnico ya tiene su regresión de borde en engines_bordes.test.js.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  calcularSumaPsiL,
  analizarInventarioPT,
  porcentajeImpactoPT,
  severidadPT,
} from '../lib/engines/puentes_termicos.js'

// ptId real del catálogo: piso_radier_terreno → psi { malo:0.65, tipico:0.40, mejor:0.15 }
const PT = 'piso_radier_terreno'

describe('calcularSumaPsiL — ΣΨ·L [W/K] para el balance', () => {
  it('suma Ψ·L del inventario (tipico 0.40 · 10 m = 4.0)', () => {
    expect(calcularSumaPsiL([{ ptId: PT, longitud: 10, calidad: 'tipico' }])).toBe(4.0)
  })
  it('respeta la calidad: malo > mejor', () => {
    const malo  = calcularSumaPsiL([{ ptId: PT, longitud: 10, calidad: 'malo' }])
    const mejor = calcularSumaPsiL([{ ptId: PT, longitud: 10, calidad: 'mejor' }])
    expect(malo).toBeGreaterThan(mejor)
    expect(malo).toBe(6.5)   // 0.65·10
    expect(mejor).toBe(1.5)  // 0.15·10
  })
  it('ignora ids inexistentes e items sin longitud', () => {
    const r = calcularSumaPsiL([
      { ptId: 'NO_EXISTE', longitud: 100 },
      { ptId: PT, longitud: 5, calidad: 'tipico' },
      { ptId: PT },   // sin longitud
    ])
    expect(r).toBe(2.0)   // solo 0.40·5
  })
  it('entrada vacía o no-array → 0', () => {
    expect(calcularSumaPsiL([])).toBe(0)
    expect(calcularSumaPsiL(null)).toBe(0)
    expect(calcularSumaPsiL(undefined)).toBe(0)
  })
})

describe('analizarInventarioPT', () => {
  it('devuelve detalles + pérdida total + hdd18', () => {
    const r = analizarInventarioPT(
      [{ ptId: PT, longitud: 10, calidad: 'tipico' }],
      { proy: { zona: 'F' }, configEnergetica: {} },
    )
    expect(r.detalles).toHaveLength(1)
    expect(r.detalles[0].ptId).toBe(PT)
    expect(r.perdidaTotal).toBeGreaterThan(0)
    expect(r.hdd18).toBeGreaterThan(0)
  })
  it('omite items con ptId desconocido', () => {
    const r = analizarInventarioPT(
      [{ ptId: 'NO_EXISTE', longitud: 10 }, { ptId: PT, longitud: 10, calidad: 'tipico' }],
      { proy: { zona: 'F' }, configEnergetica: {} },
    )
    expect(r.detalles).toHaveLength(1)
  })
  it('inventario vacío → sin detalles, pérdida 0', () => {
    const r = analizarInventarioPT([], { proy: { zona: 'F' }, configEnergetica: {} })
    expect(r.detalles).toHaveLength(0)
    expect(r.perdidaTotal).toBe(0)
  })
})

describe('porcentajeImpactoPT', () => {
  it('ratio PT/envolvente × 100 (200/1000 = 20%)', () => {
    expect(porcentajeImpactoPT(200, 1000)).toBe(20)
  })
  it('envolvente 0 o inválida → 0 (no divide por cero)', () => {
    expect(porcentajeImpactoPT(200, 0)).toBe(0)
    expect(porcentajeImpactoPT(200, null)).toBe(0)
  })
})

describe('severidadPT — escala calibrada a Chile', () => {
  it('clasifica por tramos de porcentaje', () => {
    expect(severidadPT(5).nivel).toBe('bajo')
    expect(severidadPT(15).nivel).toBe('normal')
    expect(severidadPT(25).nivel).toBe('medio')
    expect(severidadPT(40).nivel).toBe('alto')
    expect(severidadPT(60).nivel).toBe('critico')
  })
  it('cada nivel trae label y color', () => {
    const s = severidadPT(25)
    expect(typeof s.label).toBe('string')
    expect(s.color).toMatch(/^#/)
  })
})
