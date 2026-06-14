// ─────────────────────────────────────────────────────────────────────────────
// obs_sin_cumplimiento_falso.test.js — A3b
//
// Una solución cuyo `obs` afirma "cumple todas las zonas A-I" debe realmente
// cumplir el U-máx más estricto de su elemento en TODAS las zonas A-I.
// Antes había obs que sobre-declaraban cumplimiento (ej. 1.2.M.D2.2 decía
// "Cumple todas las zonas A-I" con U=0.31 > 0.30 de zona H).
//
// Ventanas se excluyen: su cumplimiento es por % vidriado (Tabla 3), no por U sola.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { SC, ZONAS } from '../data.js'

const ZKEYS = Object.keys(ZONAS) // A..I
// elem de la SC → clave de U-máx en ZONAS
const ELEM_A_ZONA = { muro: 'muro', techumbre: 'techo', piso: 'piso' }
const UMAX_PUERTA = 1.70 // DS N°15: puerta opaca 1.70 uniforme B-I

// U-máx más estricto (mínimo) sobre A-I para un elemento
const uMaxMasEstricto = (zonaKey) => Math.min(...ZKEYS.map(z => ZONAS[z][zonaKey]))

// ¿el obs afirma cumplimiento universal A-I / todas las zonas?
const afirmaUniversal = (obs) =>
  /todas? las zonas|todas zonas|\bA-I\b|\bA–I\b/i.test(obs || '')

describe('A3b — obs no sobre-declara cumplimiento', () => {
  const universales = SC.filter(s => s.obs && afirmaUniversal(s.obs))

  it('hay soluciones con afirmación universal para verificar', () => {
    expect(universales.length).toBeGreaterThan(0)
  })

  for (const s of universales) {
    if (s.elem === 'ventana') continue // Tabla 3, no aplica U-máx único
    it(`${s.cod} (${s.elem}, U=${s.u}) cumple su U-máx en todas las zonas A-I`, () => {
      const u = parseFloat(s.u)
      const uMax = s.elem === 'puerta'
        ? UMAX_PUERTA
        : uMaxMasEstricto(ELEM_A_ZONA[s.elem] ?? s.elem)
      expect(uMax).toBeGreaterThan(0) // elem mapeado
      expect(u).toBeLessThanOrEqual(uMax + 1e-9)
    })
  }
})
