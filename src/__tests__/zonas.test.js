// ─────────────────────────────────────────────────────────────────────────────
// zonas.test.js — Balance térmico MULTI-ZONA (Fase 2).
//
// Blinda que cada zona reciba la exposición correcta (terreno/cubierta), que el
// total agregue bien, y que los pisos extremos (con techo o piso al exterior)
// demanden más que los intermedios — lo que un modelo de una sola zona oculta.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  uValuesFromCalcUInit,
  elementosDeZona,
  balanceMultiZona,
  zonificarPorPiso,
} from '../lib/engines/zonas.js'
import { estimarAreasEnvolvente } from '../lib/engines/geometria.js'

const U = { muro: 0.5, techo: 0.3, piso: 0.4 }

describe('uValuesFromCalcUInit', () => {
  it('extrae U {muro, techo, piso} del calcUInit', () => {
    const u = uValuesFromCalcUInit({ muro: { res: { U: '0.5' } }, techo: { res: { U: '0.3' } } })
    expect(u.muro).toBe(0.5)
    expect(u.techo).toBe(0.3)
  })
  it('ignora U inválidos y toma el primero por elemento', () => {
    const u = uValuesFromCalcUInit({ 'A::muro': { res: { U: '0.6' } }, 'B::muro': { res: { U: '0.9' } }, piso: { res: { U: '0' } } })
    expect(u.muro).toBe(0.6)   // primero gana
    expect(u.piso).toBeUndefined()
  })
})

describe('elementosDeZona — exposición', () => {
  it('piso inferior (toca terreno, no cubierta) → muro + piso, sin techo', () => {
    const els = elementosDeZona({ superficie: 200, tocaTerreno: true, tocaCubierta: false }, U)
    const tipos = els.map(e => e.elemKey)
    expect(tipos).toContain('muro')
    expect(tipos).toContain('piso')
    expect(tipos).not.toContain('techo')
  })
  it('piso intermedio (ni terreno ni cubierta) → solo muro', () => {
    const els = elementosDeZona({ superficie: 200, tocaTerreno: false, tocaCubierta: false }, U)
    expect(els.map(e => e.elemKey)).toEqual(['muro'])
  })
  it('piso superior (toca cubierta, no terreno) → muro + techo, sin piso', () => {
    const els = elementosDeZona({ superficie: 200, tocaTerreno: false, tocaCubierta: true }, U)
    const tipos = els.map(e => e.elemKey)
    expect(tipos).toContain('techo')
    expect(tipos).not.toContain('piso')
  })
  it('sin superficie válida → sin elementos', () => {
    expect(elementosDeZona({ superficie: 0 }, U)).toEqual([])
  })
  it('la zona puede sobreescribir los U del proyecto', () => {
    const els = elementosDeZona({ superficie: 200, uValues: { muro: 1.2 } }, U)
    expect(els.find(e => e.elemKey === 'muro').U).toBe(1.2)
  })
})

describe('zonificarPorPiso', () => {
  it('genera N zonas con exposición correcta', () => {
    const z = zonificarPorPiso({ superficie: 1000, pisos: 5 })
    expect(z).toHaveLength(5)
    expect(z[0].tocaTerreno).toBe(true)
    expect(z[0].tocaCubierta).toBe(false)
    expect(z[4].tocaCubierta).toBe(true)
    expect(z[4].tocaTerreno).toBe(false)
    expect(z[2].tocaTerreno).toBe(false)   // intermedio
    expect(z[2].tocaCubierta).toBe(false)
    expect(z[0].superficie).toBe(200)       // 1000/5
  })
  it('1 piso → una zona "Edificio" con ambas exposiciones', () => {
    const z = zonificarPorPiso({ superficie: 300, pisos: 1 })
    expect(z).toHaveLength(1)
    expect(z[0].tocaTerreno).toBe(true)
    expect(z[0].tocaCubierta).toBe(true)
  })
  it('reparte las ventanas por piso', () => {
    const z = zonificarPorPiso({ superficie: 1000, pisos: 4, areasVidrio: { N: 40, E: 0, S: 0, O: 0 } })
    expect(z[0].areasVidrio.N).toBe(10)   // 40/4
  })
  it('sin superficie → sin zonas', () => {
    expect(zonificarPorPiso({ superficie: 0, pisos: 3 })).toEqual([])
  })
})

describe('balanceMultiZona — agregación', () => {
  const zonas = zonificarPorPiso({ superficie: 1000, pisos: 5, areasVidrio: { N: 40, E: 20, S: 20, O: 20 } })
  const mz = balanceMultiZona(zonas, { uValues: U, zonaClima: 'F' })

  it('superficie total = suma de zonas', () => {
    expect(mz.superficieTotal).toBe(1000)
  })
  it('demanda total = suma de las demandas por zona', () => {
    const suma = mz.porZona.reduce((s, z) => s + z.balance.demandaNeta, 0)
    expect(mz.demandaNetaTotal).toBe(Math.round(suma))
  })
  it('kWh/m² promedio y calificación coherentes', () => {
    expect(mz.kwhM2AnioPromedio).toBe(Math.round(mz.demandaNetaTotal / 1000))
    expect(mz.calificacion).toBeTruthy()
  })
  it('FÍSICA: los pisos extremos (techo/piso expuesto) demandan más que los intermedios', () => {
    const inferior   = mz.porZona[0].balance.demandaNeta
    const intermedio = mz.porZona[2].balance.demandaNeta
    const superior   = mz.porZona[4].balance.demandaNeta
    expect(inferior).toBeGreaterThan(intermedio)
    expect(superior).toBeGreaterThan(intermedio)
  })
  it('CONSISTENCIA: la suma de áreas por piso ≈ el modelo agregado (lumped)', () => {
    const areas = zonas.reduce((acc, z) => {
      for (const e of elementosDeZona(z, U)) acc[e.elemKey] = (acc[e.elemKey] || 0) + e.area
      return acc
    }, {})
    const lumped = estimarAreasEnvolvente({ superficie: 1000, pisos: 5 })
    expect(areas.techo).toBe(lumped.techo)
    expect(areas.piso).toBe(lumped.piso)
    expect(Math.abs(areas.muro - lumped.muro)).toBeLessThanOrEqual(5)   // redondeo por piso
  })
  it('ignora zonas sin superficie; lista vacía → totales 0', () => {
    const vacio = balanceMultiZona([{ nombre: 'x', superficie: 0 }], { uValues: U, zonaClima: 'F' })
    expect(vacio.superficieTotal).toBe(0)
    expect(vacio.demandaNetaTotal).toBe(0)
    expect(balanceMultiZona([], { uValues: U }).demandaNetaTotal).toBe(0)
  })
})
