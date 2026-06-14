// ─────────────────────────────────────────────────────────────────────────────
// aplicar_solucion_modificada.test.js
//
// Bug: al modificar una solución en el simulador de capas (engrosar el aislante)
// hasta que cumple, al apretar "Aplicar" se traspasaba la U CERTIFICADA original
// (que no cumple) en vez de la U recalculada. resolverAplicacionSC() decide qué U
// y capas se aplican.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { resolverAplicacionSC } from '../lib/aplicarSolucion.js'

const sc = { cod: '1.2.M.X1', u: 0.45, rf: 'F60', ac_rw: 45 }

describe('resolverAplicacionSC', () => {
  it('sin modificación → usa la U certificada original', () => {
    const r = resolverAplicacionSC(sc, null)
    expect(r.isMod).toBe(false)
    expect(r.u).toBe(0.45)
    expect(r.capas).toBeNull()
  })

  it('con modificación de la MISMA solución → usa la U recalculada', () => {
    const mod = { cod: '1.2.M.X1', u: 0.28, rw: 46, capas: [{ id: 1, mat: 'EPS', esp: '120' }] }
    const r = resolverAplicacionSC(sc, mod)
    expect(r.isMod).toBe(true)
    expect(r.u).toBe(0.28)            // U modificada, no la certificada 0.45
    expect(r.uOriginal).toBe(0.45)    // se conserva la original para trazabilidad
    expect(r.capas).toEqual(mod.capas)
  })

  it('modificación de OTRA solución → se ignora (no coincide cod)', () => {
    const mod = { cod: 'OTRA', u: 0.10, capas: [{ id: 1 }] }
    const r = resolverAplicacionSC(sc, mod)
    expect(r.isMod).toBe(false)
    expect(r.u).toBe(0.45)
    expect(r.capas).toBeNull()
  })

  it('mod sin U → se ignora', () => {
    const r = resolverAplicacionSC(sc, { cod: '1.2.M.X1', capas: [] })
    expect(r.isMod).toBe(false)
    expect(r.u).toBe(0.45)
  })

  it('mod con U=0 válida (caso límite) se respeta', () => {
    const r = resolverAplicacionSC(sc, { cod: '1.2.M.X1', u: 0 })
    // u:0 no es realista pero != null → se considera modificación
    expect(r.isMod).toBe(true)
    expect(r.u).toBe(0)
  })
})
