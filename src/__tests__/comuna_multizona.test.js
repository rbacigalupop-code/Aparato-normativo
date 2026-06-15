// ─────────────────────────────────────────────────────────────────────────────
// comuna_multizona.test.js
//
// Muchas comunas abarcan más de una zona térmica DS N°15 porque la zona depende
// de la COTA (altitud) del predio. Tras reconstruir COMUNAS_ZONA desde la tabla
// oficial DITEC (src/data/zonas_oficial.js), son 59 comunas multi-zona (antes 6).
//
// El mecanismo A4 (resolveZonas conserva TODAS las filas de la comuna; el buscador
// muestra una por zona; getOverrideZona del admin manda) se preserva: resolveZonas()
// debe devolver todas las zonas oficiales de la comuna, no colapsar a una.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { COMUNAS_ZONA } from '../data.js'
import { resolveZonas, resolveZona, getOverrideZona } from '../utils/zonaStorage.js'

// Comunas multi-zona oficiales (por cota) — verificadas contra la tabla DITEC.
const MULTI = {
  Arica: ['A', 'B', 'H'],
  Camarones: ['A', 'B', 'H'],
  Huara: ['A', 'B', 'H'],
  Antofagasta: ['A', 'B', 'H'],
  Calama: ['B', 'H'],
  'San Pedro de Atacama': ['B', 'H'],
}

// Comunas mono-zona (incluye varias que el dato viejo creía multi-zona).
const MONO = {
  Putre: 'H',
  Lonquimay: 'H',
  Curacautin: 'F',
  Temuco: 'F',
  Santiago: 'D',
  Valparaiso: 'C',
}

describe('resolveZonas — comunas multi-zona (por cota, DITEC)', () => {
  for (const [comuna, zonas] of Object.entries(MULTI)) {
    it(`${comuna} → ${zonas.join(', ')}`, () => {
      const r = resolveZonas(comuna, {}, COMUNAS_ZONA)
      expect(r.sort()).toEqual([...zonas].sort())
      expect(r.length).toBe(zonas.length)
    })
  }

  it('case-insensitive y sin acentos', () => {
    expect(resolveZonas('ARICA', {}, COMUNAS_ZONA).sort()).toEqual(['A', 'B', 'H'])
    expect(resolveZonas('san pedro de atacama', {}, COMUNAS_ZONA).sort()).toEqual(['B', 'H'])
  })
})

describe('resolveZonas — comunas mono-zona', () => {
  for (const [comuna, zona] of Object.entries(MONO)) {
    it(`${comuna} → ${zona}`, () => {
      expect(resolveZonas(comuna, {}, COMUNAS_ZONA)).toEqual([zona])
    })
  }

  it('comuna inexistente → []', () => {
    expect(resolveZonas('Narnia', {}, COMUNAS_ZONA)).toEqual([])
  })
})

describe('override del admin tiene prioridad', () => {
  it('un override define una única zona, ignora las base', () => {
    const ov = { Arica: 'B' }
    expect(getOverrideZona('Arica', ov)).toBe('B')
    expect(resolveZonas('Arica', ov, COMUNAS_ZONA)).toEqual(['B'])
  })
  it('sin override, getOverrideZona → null', () => {
    expect(getOverrideZona('Arica', {})).toBeNull()
  })
})

describe('resolveZona (singular) — compatibilidad', () => {
  it('mono-zona devuelve su zona', () => {
    expect(resolveZona('Santiago', {}, COMUNAS_ZONA)).toBe('D')
    expect(resolveZona('Putre', {}, COMUNAS_ZONA)).toBe('H')
  })
  it('multi-zona devuelve una de sus zonas oficiales', () => {
    expect(['A', 'B', 'H']).toContain(resolveZona('Arica', {}, COMUNAS_ZONA))
  })
})
