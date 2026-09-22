// ─────────────────────────────────────────────────────────────────────────────
// barreras_membranas.test.js — Grupo "Barreras y membranas" del catálogo.
//
// Blinda: física del sd (μ·espesor), la distinción barrera de vapor (sd alto,
// cara caliente) vs transpirable agua-viento (sd bajo, cara fría), que todos
// clasifiquen como "membrana" (corte 2D + export a Revit), y que aparezcan en
// el selector de capas. Los valores son por CLASE de producto (EN ISO 10456);
// la marca es referencia comercial, no dato certificado.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { MATS, ALL_MATS, filterMatsByElem } from '../data.js'
import { classifyMaterial } from '../lib/engines/capas.js'

const grupo = MATS.find(g => g.g === 'Barreras y membranas')
const sd = (m) => m.mu * m.esp   // sd = μ · espesor [m]  (mismo cálculo que el Glaser)

describe('Barreras y membranas — catálogo', () => {
  it('el grupo existe y trae varias opciones comerciales', () => {
    expect(grupo).toBeTruthy()
    expect(grupo.items.length).toBeGreaterThanOrEqual(10)
  })

  it('cada ítem tiene λ, μ y espesor físicos (esp en metros, < 1 cm)', () => {
    for (const m of grupo.items) {
      expect(m.lam, m.n).toBeGreaterThan(0)
      expect(m.mu, m.n).toBeGreaterThan(0)
      expect(m.esp, `${m.n} esp`).toBeGreaterThan(0)
      expect(m.esp, `${m.n} esp < 1cm`).toBeLessThan(0.01)
    }
  })

  it('barrera de vapor → sd alto · transpirable → sd bajo (no confundir la cara)', () => {
    const pe = grupo.items.find(m => m.n === 'Barrera de vapor (polietileno 0,2mm)')
    expect(sd(pe)).toBeCloseTo(20, 5)                    // 100000 · 0,0002
    const tyvek = grupo.items.find(m => /HomeWrap/.test(m.n))
    expect(sd(tyvek)).toBeLessThan(0.1)                  // deja salir vapor
    // toda "barrera de vapor" debe superar el sd de toda "transpirable"
    const minVapor  = Math.min(...grupo.items.filter(m => /barrera de vapor/i.test(m.n)).map(sd))
    const maxTransp = Math.max(...grupo.items.filter(m => /transpirable/i.test(m.n)).map(sd))
    expect(minVapor).toBeGreaterThan(maxTransp)
  })

  it('todos clasifican como "membrana" (corte 2D + funcion del export a Revit)', () => {
    for (const m of grupo.items) {
      expect(classifyMaterial(m.n), m.n).toBe('membrana')
    }
  })

  it('las barreras de vapor aparecen en el selector de muro (sin usos = universal)', () => {
    const g = filterMatsByElem('muro').find(x => x.g === 'Barreras y membranas')
    expect(g).toBeTruthy()
    expect(g.items.some(m => m.n === 'Barrera de vapor (polietileno 0,2mm)')).toBe(true)
  })

  it('están en ALL_MATS para autocompletar λ/μ/espesor al elegirlos', () => {
    expect(ALL_MATS.find(x => x.n === 'Barrera de vapor foil aluminio')).toBeTruthy()
    expect(ALL_MATS.find(x => x.n === 'Fieltro asfáltico 15 lb (tipo Wichi/Chova)')).toBeTruthy()
  })
})
