// ─────────────────────────────────────────────────────────────────────────────
// comuna_multizona.test.js
//
// Algunas comunas abarcan más de una zona térmica DS N°15 según altitud/sector.
// Bug: la app colapsaba la comuna a una sola zona (la primera) y, al elegir la
// otra, la marcaba como "modificada manualmente". resolveZonas() debe devolver
// TODAS las zonas oficiales de la comuna.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { COMUNAS_ZONA } from '../data.js'
import { resolveZonas, resolveZona, getOverrideZona } from '../utils/zonaStorage.js'

// Comunas que en los datos aparecen en 2 zonas
const MULTI = {
  Putre: ['A', 'H'],
  'General Lagos': ['A', 'H'],
  'San Pedro de Atacama': ['A', 'H'],
  Lonquimay: ['F', 'H'],
  Curarrehue: ['F', 'H'],
  Curacautin: ['F', 'H'],
}

describe('resolveZonas — comunas multi-zona', () => {
  for (const [comuna, zonas] of Object.entries(MULTI)) {
    it(`${comuna} → ${zonas.join(', ')}`, () => {
      const r = resolveZonas(comuna, {}, COMUNAS_ZONA)
      expect(r.sort()).toEqual([...zonas].sort())
      expect(r.length).toBe(2)
    })
  }

  it('case-insensitive y sin acentos', () => {
    expect(resolveZonas('PUTRE', {}, COMUNAS_ZONA).sort()).toEqual(['A', 'H'])
    expect(resolveZonas('curacautín', {}, COMUNAS_ZONA).sort()).toEqual(['F', 'H'])
  })

  it('comuna de zona única devuelve un solo elemento', () => {
    expect(resolveZonas('Temuco', {}, COMUNAS_ZONA)).toEqual(['F'])
    expect(resolveZonas('Santiago', {}, COMUNAS_ZONA)).toEqual(['D'])
  })

  it('comuna inexistente → []', () => {
    expect(resolveZonas('Narnia', {}, COMUNAS_ZONA)).toEqual([])
  })
})

describe('override del admin tiene prioridad', () => {
  it('un override define una única zona, ignora las base', () => {
    const ov = { Putre: 'H' }
    expect(getOverrideZona('Putre', ov)).toBe('H')
    expect(resolveZonas('Putre', ov, COMUNAS_ZONA)).toEqual(['H'])
  })
  it('sin override, getOverrideZona → null', () => {
    expect(getOverrideZona('Putre', {})).toBeNull()
  })
})

describe('resolveZona (singular) — compatibilidad', () => {
  it('devuelve la primera zona cuando hay varias', () => {
    expect(resolveZona('Putre', {}, COMUNAS_ZONA)).toBe('A')
    expect(resolveZona('Lonquimay', {}, COMUNAS_ZONA)).toBe('F')
  })
})
