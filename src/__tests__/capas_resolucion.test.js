// ─────────────────────────────────────────────────────────────────────────────
// capas_resolucion.test.js — resolverCapaToken / validarCapasParaCalculo (bug D)
//
// Un dato que no se puede resolver no se inventa (50 mm) ni se descarta en
// silencio: se marca `unresolved` y bloquea el cálculo (→ NO_VERIFICADO).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  resolverCapaToken, parsearCapasString, validarCapasParaCalculo, capaResuelta, CAPA_SOURCE,
} from '../lib/compliance/capas.js'

const MATS = [
  { n: 'Yeso carton', lam: 0.26, mu: 8, esp: 0.012 },
  { n: 'PU proyectado', lam: 0.026, mu: 60 },
  { n: 'Ladrillo ceramico macizo', lam: 0.87, mu: 10 },
  { n: 'Barrera de vapor (polietileno 0,2mm)', lam: 0.5, mu: 100000, esp: 0.0002 },
]

describe('resolverCapaToken — nunca inventa λ ni espesor', () => {
  it('material conocido con espesor → resuelto (source MATERIAL_DB)', () => {
    const c = resolverCapaToken('Yeso carton 12', MATS)
    expect(c).toMatchObject({ mat: 'Yeso carton', lam: 0.26, esp: '12', esCamara: false, source: CAPA_SOURCE.MATERIAL_DB })
    expect(c.unresolved).toBeFalsy()
  })

  it('CASO ~68 SC: material NO reconocido con espesor → unresolved (no λ inventado)', () => {
    const c = resolverCapaToken('Lana mineral 80mm', MATS) // no matchea exacto en el catálogo
    expect(c.unresolved).toBe(true)
    expect(c.source).toBe(CAPA_SOURCE.UNKNOWN)
    expect(c.esp).toBe('') // "80mm" no es un número puro al final → sin espesor válido
  })

  it('material desconocido con espesor numérico → unresolved (tiene esp pero no λ)', () => {
    const c = resolverCapaToken('Materialraro 50', MATS)
    expect(c.unresolved).toBe(true)
    expect(c.esp).toBe('50')      // conserva el espesor declarado
    expect(c.lam).toBe('')        // pero NO inventa λ
  })

  it('cámara de aire → resuelta (no requiere λ)', () => {
    const c = resolverCapaToken('Camara de aire 20', MATS)
    expect(c).toMatchObject({ esCamara: true, esp: '20' })
    expect(c.unresolved).toBeFalsy()
  })

  it('token sin espesor pero material con espesor por defecto → resuelto', () => {
    const c = resolverCapaToken('Barrera de vapor (polietileno 0,2mm)', MATS)
    expect(c.unresolved).toBeFalsy()
    expect(c.esCamara).toBe(false)
    expect(parseFloat(c.esp)).toBeCloseTo(0.2, 5) // 0.0002 m * 1000
  })

  it('token sin espesor y material desconocido → unresolved (no inventa 50 mm)', () => {
    const c = resolverCapaToken('Algo raro', MATS)
    expect(c.unresolved).toBe(true)
    expect(c.esp).toBe('')
    expect(c.esp).not.toBe(50)
  })

  it('separador vacío → null (se ignora)', () => {
    expect(resolverCapaToken('   ', MATS)).toBeNull()
  })
})

describe('validarCapasParaCalculo — detecta la capa que impide calcular', () => {
  it('todas resueltas → ok', () => {
    const capas = parsearCapasString('Ladrillo ceramico macizo 140 | PU proyectado 60', MATS)
    expect(validarCapasParaCalculo(capas)).toEqual({ ok: true })
  })

  it('una capa no resuelta → NO ok, señalando cuál', () => {
    const capas = parsearCapasString('Ladrillo ceramico macizo 140 | Materialraro 50', MATS)
    const r = validarCapasParaCalculo(capas)
    expect(r.ok).toBe(false)
    expect(r.capa?.mat).toBe('Materialraro')
    expect(r.indice).toBe(1)
  })

  it('sin capas → NO ok', () => {
    expect(validarCapasParaCalculo([]).ok).toBe(false)
  })

  it('solo cámara/barrera sin capa opaca con aporte → NO ok', () => {
    const capas = parsearCapasString('Camara de aire 20', MATS)
    expect(validarCapasParaCalculo(capas).ok).toBe(false)
  })

  it('capaResuelta: opaca necesita λ>0 y esp>0', () => {
    expect(capaResuelta({ mat: 'X', lam: 0.04, esp: '100' })).toBe(true)
    expect(capaResuelta({ mat: 'X', lam: '', esp: '100' })).toBe(false)
    expect(capaResuelta({ unresolved: true })).toBe(false)
    expect(capaResuelta({ esCamara: true })).toBe(true)
  })
})
