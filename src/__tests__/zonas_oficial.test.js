// ─────────────────────────────────────────────────────────────────────────────
// zonas_oficial.test.js — Fuente única comuna→zona DS N°15 desde tabla DITEC,
// con resolución por COTA (altitud) y cobertura del catálogo.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  COMUNAS_ZONA, zonasOficialesDeComuna, resolverZonaPorCota, resolverZona,
  umbralesDeComuna, esMultiZona, reglasDeComuna,
} from '../data/zonas_oficial.js'
import { COMUNAS_ZT } from '../data/zonas_ditec.js'
import { COMUNAS_CHILE } from '../data/comunas_chile.js'

describe('resolverZonaPorCota — la altitud resuelve la zona', () => {
  it('Arica (A<1.100 / B 1.100–3.000 / H≥3.000)', () => {
    expect(resolverZonaPorCota('Arica', 500)).toBe('A')
    expect(resolverZonaPorCota('Arica', 2000)).toBe('B')
    expect(resolverZonaPorCota('Arica', 3500)).toBe('H')
  })

  it('Calama (B<3.000 / H≥3.000)', () => {
    expect(resolverZonaPorCota('Calama', 2200)).toBe('B')
    expect(resolverZonaPorCota('Calama', 3500)).toBe('H')
  })

  it('mono-zona: la cota es irrelevante', () => {
    expect(resolverZonaPorCota('Santiago', null)).toBe('D')
    expect(resolverZonaPorCota('Santiago', 9999)).toBe('D')
    expect(resolverZonaPorCota('Putre', null)).toBe('H')
  })

  it('cota bajo la banda más baja → aplica la banda inferior (Camiña sin <1.100)', () => {
    // Camiña: B (1.100–3.000) / H (≥3.000); no hay tramo <1.100 m en la tabla.
    expect(resolverZonaPorCota('Camiña', 500)).toBe('B')
    expect(resolverZonaPorCota('Camiña', 2000)).toBe('B')
    expect(resolverZonaPorCota('Camiña', 3500)).toBe('H')
  })

  it('multi-zona sin cota → null (la UI muestra opciones)', () => {
    expect(resolverZonaPorCota('Arica', null)).toBeNull()
    expect(resolverZonaPorCota('Calama', null)).toBeNull()
  })

  it('corte por meridiano sin desambiguar por cota → null', () => {
    // Antofagasta: A (≥70°) o B (<70°) bajo 3.000 m — la cota no decide A vs B.
    expect(resolverZonaPorCota('Antofagasta', 1000)).toBeNull()
    // pero sobre 3.000 m sí es H sin ambigüedad
    expect(resolverZonaPorCota('Antofagasta', 3500)).toBe('H')
  })

  it('acepta nombre o clave de catálogo (con/sin "de", acentos)', () => {
    expect(zonasOficialesDeComuna('san_pedro_atacama').sort()).toEqual(['B', 'H'])
    expect(zonasOficialesDeComuna('Coyhaique')).toEqual(['I'])     // alias Coihaique
    expect(zonasOficialesDeComuna('puerto_aysen')).toEqual(['I'])  // alias Aisén
  })
})

describe('resolverZona — desambigua por longitud (meridiano)', () => {
  it('Antofagasta: costa (A) vs interior (B) bajo 3.000 m según longitud', () => {
    expect(resolverZona('Antofagasta', { cota: 50, lng: -70.4 })).toBe('A')
    expect(resolverZona('Antofagasta', { cota: 1000, lng: -69.5 })).toBe('B')
    expect(resolverZona('Antofagasta', { cota: 3500 })).toBe('H')   // la cota basta
    expect(resolverZona('Antofagasta', { cota: 1000 })).toBeNull()  // falta la longitud
  })
  it('La Serena (C >71° / B ≤71°) se resuelve solo por longitud', () => {
    expect(resolverZona('La Serena', { lng: -71.25 })).toBe('C')
    expect(resolverZona('La Serena', { lng: -70.8 })).toBe('B')
  })
  it('acepta longitud negativa o positiva (°O)', () => {
    expect(resolverZona('La Union', { lng: -73.4 })).toBe('G')
    expect(resolverZona('La Union', { lng: 73.0 })).toBe('F')
  })
})

describe('umbralesDeComuna — bandas para la UI', () => {
  it('devuelve bandas legibles con zona y altitud', () => {
    const u = umbralesDeComuna('Arica')
    expect(u).toHaveLength(3)
    expect(u[0]).toMatchObject({ zona: 'A' })
    expect(u.map(x => x.zona)).toEqual(['A', 'B', 'H'])
    expect(u.every(x => typeof x.alt === 'string')).toBe(true)
  })
  it('mono-zona: una banda sin altitud', () => {
    const u = umbralesDeComuna('Santiago')
    expect(u).toHaveLength(1)
    expect(u[0]).toMatchObject({ zona: 'D', alt: null })
  })
})

describe('Sin colisiones de nombre (round-trip) — guard del bug Florida', () => {
  it('cada comuna oficial resuelve a SUS propias zonas (ninguna pisa a otra)', () => {
    const fallos = []
    for (const v of Object.values(COMUNAS_ZT)) {
      const propias = [...new Set(v.reglas.map(r => r.zona))].sort().join('')
      const got = zonasOficialesDeComuna(v.nombre).join('')
      if (propias !== got) fallos.push(`${v.nombre}: propias ${propias} vs resuelto ${got}`)
    }
    expect(fallos).toEqual([])
  })

  it('Florida (VIII) y La Florida (RM) no se confunden (el artículo distingue)', () => {
    expect(zonasOficialesDeComuna('Florida')).toEqual(['F'])
    expect(zonasOficialesDeComuna('La Florida')).toEqual(['D'])
  })
})

describe('Cobertura — toda comuna del catálogo tiene zona oficial', () => {
  it('ningún comuna de COMUNAS_CHILE queda sin reglas DS N°15', () => {
    const sinZona = Object.keys(COMUNAS_CHILE).filter(k => zonasOficialesDeComuna(k).length === 0)
    expect(sinZona).toEqual([])
  })

  it('COMUNAS_ZONA solo contiene zonas válidas A-I', () => {
    for (const z of Object.keys(COMUNAS_ZONA)) expect('ABCDEFGHI').toContain(z)
  })

  it('hay ~59 comunas multi-zona (vs 6 del dato viejo)', () => {
    const keys = new Set(Object.keys(COMUNAS_CHILE))
    const multi = [...keys].filter(k => esMultiZona(k))
    expect(multi.length).toBeGreaterThan(40)
  })

  it('toda regla tiene zona A-I y, si trae banda, números coherentes', () => {
    for (const k of Object.keys(COMUNAS_CHILE)) {
      for (const r of reglasDeComuna(k) || []) {
        expect('ABCDEFGHI').toContain(r.zona)
        if (r.altMin != null && r.altMax != null) expect(r.altMin).toBeLessThan(r.altMax)
      }
    }
  })
})
