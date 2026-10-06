// ─────────────────────────────────────────────────────────────────────────────
// geometria.test.js — Estimación de áreas de envolvente desde superficie + pisos.
//
// Reemplaza los defaults fijos de "vivienda tipo" (80/70/70) por áreas derivadas
// de la geometría del proyecto — base para un análisis de edificio creíble.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { estimarAreasEnvolvente } from '../lib/engines/geometria.js'

describe('estimarAreasEnvolvente', () => {
  it('sin superficie válida → null (el llamador cae a su default)', () => {
    expect(estimarAreasEnvolvente({ superficie: 0 })).toBeNull()
    expect(estimarAreasEnvolvente({ superficie: -50 })).toBeNull()
    expect(estimarAreasEnvolvente({})).toBeNull()
    expect(estimarAreasEnvolvente()).toBeNull()
  })

  it('caso base: 100 m², 1 piso, h=2.5 → huella 100, muro = perímetro·altura', () => {
    const a = estimarAreasEnvolvente({ superficie: 100, pisos: 1, alturaCielo: 2.5 })
    // footprint=100, lado=10, perímetro=40, alturaTotal=2.5 → muro=100
    expect(a.techo).toBe(100)
    expect(a.piso).toBe(100)
    expect(a.muro).toBe(100)
    expect(a.tabique).toBe(0)         // tabique interior no es envolvente
    expect(a._geom.pisos).toBe(1)
    expect(a._geom.footprint).toBe(100)
  })

  it('edificio: 1000 m², 5 pisos → huella 200, muro grande', () => {
    const a = estimarAreasEnvolvente({ superficie: 1000, pisos: 5 })
    // footprint=200, lado≈14.14, perímetro≈56.57, alturaTotal=12.5 → muro≈707
    expect(a.techo).toBe(200)
    expect(a.piso).toBe(200)
    expect(a.muro).toBeGreaterThan(650)
    expect(a.muro).toBeLessThan(760)
  })

  it('más pisos (misma superficie) → más muro (más alto y angosto)', () => {
    const p1 = estimarAreasEnvolvente({ superficie: 200, pisos: 1 })
    const p2 = estimarAreasEnvolvente({ superficie: 200, pisos: 2 })
    expect(p2.muro).toBeGreaterThan(p1.muro)
  })

  it('factor de forma > 1 (planta alargada) aumenta el muro', () => {
    const cuadrada = estimarAreasEnvolvente({ superficie: 200, pisos: 1, factorForma: 1.0 })
    const alargada = estimarAreasEnvolvente({ superficie: 200, pisos: 1, factorForma: 1.4 })
    expect(alargada.muro).toBeGreaterThan(cuadrada.muro)
  })

  it('pisos inválido → trata como 1', () => {
    const a = estimarAreasEnvolvente({ superficie: 100, pisos: 0 })
    expect(a._geom.pisos).toBe(1)
  })
})
