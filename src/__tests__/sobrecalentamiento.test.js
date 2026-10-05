// ─────────────────────────────────────────────────────────────────────────────
// sobrecalentamiento.test.js — Análisis de riesgo de sobrecalentamiento (verano).
//
// Blinda analizarSobrecalentamiento(): ganancias solares de verano por
// orientación, WWR + alertas, índice cualitativo y recomendaciones.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { analizarSobrecalentamiento } from '../lib/engines/demanda.js'

describe('analizarSobrecalentamiento — estructura', () => {
  it('devuelve el bloque completo', () => {
    const r = analizarSobrecalentamiento({ areasVidrio: { N: 4, E: 2, S: 2, O: 2 }, zonaClima: 'D' })
    expect(r.gananciasVerano.total).toBeGreaterThanOrEqual(0)
    expect(['minimo', 'bajo', 'medio', 'alto']).toContain(r.indice)
    expect(typeof r.score).toBe('number')
    expect(Array.isArray(r.alertas)).toBe(true)
    expect(Array.isArray(r.recomendaciones)).toBe(true)
  })
})

describe('WWR y alertas', () => {
  it('sin areasMuroOrient → sin alertas de WWR', () => {
    const r = analizarSobrecalentamiento({ areasVidrio: { N: 4, E: 2, S: 2, O: 2 }, zonaClima: 'D' })
    expect(r.alertas.filter(a => a.tipo === 'wwr_excedido')).toHaveLength(0)
  })

  it('WWR = área vidrio / área muro por orientación', () => {
    const r = analizarSobrecalentamiento({
      areasVidrio: { N: 3, E: 0, S: 0, O: 0 },
      areasMuroOrient: { N: 10, E: 10, S: 10, O: 10 },
      zonaClima: 'D',
    })
    expect(r.wwr.N).toBe(0.3)   // 3/10
  })

  it('WWR oeste excedido → alerta de severidad ALTA (sol de tarde)', () => {
    const r = analizarSobrecalentamiento({
      areasVidrio: { N: 0, E: 0, S: 0, O: 10 },
      areasMuroOrient: { N: 10, E: 10, S: 10, O: 10 },
      zonaClima: 'D',
    })
    const aO = r.alertas.find(a => a.orient === 'O')
    expect(aO).toBeTruthy()
    expect(aO.severidad).toBe('alta')
    expect(r.wwr.O).toBe(1)
  })
})

describe('ganancias solares de verano', () => {
  it('más superficie vidriada → más ganancias de verano', () => {
    const poco  = analizarSobrecalentamiento({ areasVidrio: { N: 0, E: 0, S: 0, O: 4 }, zonaClima: 'D' })
    const mucho = analizarSobrecalentamiento({ areasVidrio: { N: 0, E: 0, S: 0, O: 12 }, zonaClima: 'D' })
    expect(mucho.gananciasVerano.total).toBeGreaterThan(poco.gananciasVerano.total)
  })

  it('la protección solar reduce las ganancias de verano', () => {
    const sin = analizarSobrecalentamiento({ areasVidrio: { N: 0, E: 0, S: 0, O: 10 }, zonaClima: 'D', factorProteccion: 1.0 })
    const con = analizarSobrecalentamiento({ areasVidrio: { N: 0, E: 0, S: 0, O: 10 }, zonaClima: 'D', factorProteccion: 0.5 })
    expect(con.gananciasVerano.total).toBeLessThan(sin.gananciasVerano.total)
  })
})

describe('índice de sobrecalentamiento', () => {
  it('escenario benigno (clima frío, poco vidrio, masa alta, vent. nocturna) → mínimo/bajo', () => {
    const r = analizarSobrecalentamiento({
      areasVidrio: { N: 2, E: 0, S: 0, O: 0 },
      zonaClima: 'H', factorProteccion: 0.5, masaTermica: 'alta', ventilacionNocturna: true,
    })
    expect(['minimo', 'bajo']).toContain(r.indice)
  })

  it('escenario crítico (oeste grande sin protección, clima cálido, masa baja) → alto', () => {
    const r = analizarSobrecalentamiento({
      areasVidrio: { N: 0, E: 0, S: 0, O: 20 },
      areasMuroOrient: { N: 10, E: 10, S: 10, O: 10 },
      zonaClima: 'B', factorProteccion: 1.0, masaTermica: 'baja', ventilacionNocturna: false,
      areaUtil: 50,
    })
    expect(r.indice).toBe('alto')
  })

  it('masa alta + ventilación nocturna reducen el score', () => {
    const argsBase = { areasVidrio: { N: 0, E: 0, S: 0, O: 16 }, zonaClima: 'B', factorProteccion: 1.0, areaUtil: 60 }
    const peor  = analizarSobrecalentamiento({ ...argsBase, masaTermica: 'baja', ventilacionNocturna: false })
    const mejor = analizarSobrecalentamiento({ ...argsBase, masaTermica: 'alta', ventilacionNocturna: true })
    expect(mejor.score).toBeLessThan(peor.score)
  })

  it('una alerta oeste alta genera la recomendación de reducir ventanas oeste', () => {
    const r = analizarSobrecalentamiento({
      areasVidrio: { N: 0, E: 0, S: 0, O: 10 },
      areasMuroOrient: { N: 10, E: 10, S: 10, O: 10 },
      zonaClima: 'B',
    })
    expect(r.recomendaciones.some(x => /oeste/i.test(x))).toBe(true)
  })
})
