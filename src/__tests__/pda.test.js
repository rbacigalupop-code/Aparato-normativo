import { describe, it, expect } from 'vitest'
import { PDA, PDA_SOLUCIONES, PDA_DETALLES, resolvePDA, pdaDeComuna, solucionesPDA } from '../data/pda.js'

const ELEMS = ['muro', 'techumbre', 'piso']
const reqKey = e => (e === 'techumbre' ? 'techo' : e)

describe('PDA — datos', () => {
  it('cada solución tiene forma válida (elem, U>0, pda conocido)', () => {
    for (const s of PDA_SOLUCIONES) {
      expect(ELEMS).toContain(s.elem)
      expect(typeof s.u).toBe('number')
      expect(s.u).toBeGreaterThan(0)
      expect(Object.keys(PDA)).toContain(s.pda)
      expect(s.cod).toMatch(/^PDA-/)
    }
  })

  it('cada PDA declara comunas y requisitos U-máx', () => {
    for (const [k, v] of Object.entries(PDA)) {
      expect(Array.isArray(v.comunas)).toBe(true)
      expect(v.comunas.length).toBeGreaterThan(0)
      expect(v.requisitos).toBeTruthy()
      for (const e of ELEMS) expect(typeof v.requisitos[reqKey(e)]).toBe('number')
    }
  })

  it('INVARIANTE: cada solución cumple el U-máx (vivienda existente) de su PDA', () => {
    for (const s of PDA_SOLUCIONES) {
      const uMax = PDA[s.pda].requisitos[reqKey(s.elem)]
      expect(s.u, `${s.cod} U=${s.u} debe ≤ ${uMax}`).toBeLessThanOrEqual(uMax + 1e-9)
    }
  })

  it('detalles de hermeticidad no traen U (son puentes térmicos)', () => {
    expect(PDA_DETALLES.length).toBeGreaterThan(0)
    for (const d of PDA_DETALLES) expect(d.u).toBeUndefined()
  })
})

describe('PDA — gating por comuna', () => {
  it('resuelve comunas de PDA regionales y singulares', () => {
    expect(resolvePDA('Rancagua')).toBe('ohiggins')
    expect(resolvePDA('MACHALI')).toBe('ohiggins')      // sin acento / mayúsculas
    expect(resolvePDA('Quinta de Tilcoco')).toBe('ohiggins')
    expect(resolvePDA('Talca')).toBe('talca_maule')
    expect(resolvePDA('Osorno')).toBe('osorno')
    expect(resolvePDA('Chillán')).toBe('chillan')
    expect(resolvePDA('Coyhaique')).toBe('coyhaique')
  })

  it('comuna sin PDA → null y sin soluciones', () => {
    expect(resolvePDA('Santiago')).toBeNull()
    expect(resolvePDA('')).toBeNull()
    expect(solucionesPDA('Santiago')).toEqual([])
  })

  it('solucionesPDA devuelve solo las del PDA de la comuna', () => {
    const sols = solucionesPDA('Rancagua')
    expect(sols.length).toBeGreaterThan(0)
    expect(sols.every(s => s.pda === 'ohiggins')).toBe(true)
    expect(pdaDeComuna('Rancagua').nombre).toMatch(/O.Higgins/)
  })
})
