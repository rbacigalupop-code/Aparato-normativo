// ─────────────────────────────────────────────────────────────────────────────
// u_efectivo.test.js — uEfectivo (thermal.js)
//
// El Módulo 2b (Verificación térmica) muestra el U de CADA solución por sistema.
// Antes usaba siempre el U de catálogo (sc.u) → divergía del Resumen ejecutivo,
// que ya prefiere el U calculado (peorUPorElemento / nota B5). Ej. real Liucura:
// techo 1.1.G.M2.1 con catálogo 0,38 pero recalculado a 0,296 en Cálculo U →
// el Módulo 2b decía 0,38 y el Resumen 0,296. uEfectivo unifica la precedencia:
// el U calculado MANDA sobre el de catálogo cuando existe.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { uEfectivo } from '../lib/engines/thermal.js'

describe('uEfectivo — U de una solución puntual (calculado manda)', () => {
  it('CASO LIUCURA: hay U calculado para la estructura → manda sobre el catálogo', () => {
    const calcUInit = { 'albanil::techo': { res: { U: 0.296 } } }
    expect(uEfectivo(calcUInit, 'albanil', 'techo', 0.38)).toEqual({ u: '0.296', calc: true })
  })

  it('sin U calculado para la estructura → usa el de catálogo', () => {
    expect(uEfectivo({}, 'madera', 'techo', 0.14)).toEqual({ u: '0.14', calc: false })
  })

  it('clave simple global (estId=null) lee el cálculo global', () => {
    const calcUInit = { techo: { res: { U: 0.27 } } }
    expect(uEfectivo(calcUInit, null, 'techo', 0.38)).toEqual({ u: '0.27', calc: true })
  })

  it('estId=null sin cálculo global → catálogo', () => {
    expect(uEfectivo({}, null, 'muro', 0.34)).toEqual({ u: '0.34', calc: false })
  })

  it('el cálculo de OTRA estructura no contamina (clave compuesta exacta)', () => {
    const calcUInit = { 'albanil::techo': { res: { U: 0.296 } } }
    // Para 'madera' no hay cálculo → cae al catálogo, no toma el 0.296 de albanil.
    expect(uEfectivo(calcUInit, 'madera', 'techo', 0.14)).toEqual({ u: '0.14', calc: false })
  })

  it('el cálculo de OTRO elemento no contamina (::muro no afecta al techo)', () => {
    const calcUInit = { 'est1::muro': { res: { U: 0.9 } } }
    expect(uEfectivo(calcUInit, 'est1', 'techo', 0.2)).toEqual({ u: '0.2', calc: false })
  })

  it('U calculado no numérico o ≤ 0 → cae al catálogo', () => {
    expect(uEfectivo({ 'a::piso': { res: { U: 0 } } }, 'a', 'piso', 0.33)).toEqual({ u: '0.33', calc: false })
    expect(uEfectivo({ 'a::piso': { res: { U: '—' } } }, 'a', 'piso', 0.33)).toEqual({ u: '0.33', calc: false })
  })

  it('sin cálculo ni catálogo válido → null', () => {
    expect(uEfectivo({}, 'a', 'techo', undefined)).toBeNull()
    expect(uEfectivo({}, 'a', 'techo', 0)).toBeNull()
    expect(uEfectivo({}, 'a', 'techo', '—')).toBeNull()
    expect(uEfectivo(null, 'a', 'techo', '')).toBeNull()
  })

  it('res.U como string numérico también se acepta', () => {
    expect(uEfectivo({ 'a::muro': { res: { U: '0.3853' } } }, 'a', 'muro', 0.63)).toEqual({ u: '0.3853', calc: true })
  })
})
