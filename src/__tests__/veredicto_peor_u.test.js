// ─────────────────────────────────────────────────────────────────────────────
// veredicto_peor_u.test.js — peorUPorElemento (thermal.js)
//
// El Resumen ejecutivo reporta UN U por elemento (muro/techo/piso). En un
// proyecto con varios sistemas estructurales, ese U debe ser el PEOR caso
// (máximo) considerando TODAS las soluciones asignadas — no solo las que el
// usuario abrió en Cálculo U. Si no, una solución no conforme desaparece del
// veredicto y el resumen dice CUMPLE mientras el Módulo 2b marca NO CUMPLE.
//
// Caso real («vivienda Liucura», Zona F, techo ≤ 0,28):
//   · Estructura de madera → techo 1.1.G.M1.2 recalculado U=0,2353 (CUMPLE)
//   · Albañilería confinada → techo 1.1.G.M2.1 lana 80mm, U catálogo 0,38,
//     nunca recalculado (NO CUMPLE) → NO debe quedar oculto.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { peorUPorElemento } from '../lib/engines/thermal.js'

describe('peorUPorElemento — peor U por elemento para el resumen', () => {
  it('un solo sistema con U calculado → devuelve ese U', () => {
    const calcUInit = { 'est1::techo': { res: { U: 0.2353 } } }
    const ests = [{ id: 'est1', soluciones: { techo: { solucion: { cod: '1.1.G.M1.2' }, u: 0.22 } } }]
    expect(peorUPorElemento(calcUInit, ests, 'techo')).toBe('0.2353')
  })

  it('CASO LIUCURA: techo calculado conforme + techo asignado (catálogo) NO conforme → devuelve el PEOR (0.38)', () => {
    const calcUInit = {
      'madera::techo': { res: { U: 0.2353 } },          // recalculado, conforme
      // Albañilería: asignada pero NUNCA recalculada → sin res.U
    }
    const ests = [
      { id: 'madera',   soluciones: { techo: { solucion: { cod: '1.1.G.M1.2' }, u: 0.22 } } },
      { id: 'albanil',  soluciones: { techo: { solucion: { cod: '1.1.G.M2.1' }, u: 0.38 } } },
    ]
    // El peor caso (0.38) no puede desaparecer aunque el otro techo cumpla.
    expect(peorUPorElemento(calcUInit, ests, 'techo')).toBe('0.38')
  })

  it('el U CALCULADO manda sobre el catálogo para la misma estructura (mejora)', () => {
    // Catálogo 0.38 pero el usuario la recalculó a 0.25 (agregó aislante) → 0.25.
    const calcUInit = { 'albanil::techo': { res: { U: 0.25 } } }
    const ests = [{ id: 'albanil', soluciones: { techo: { solucion: { cod: '1.1.G.M2.1' }, u: 0.38 } } }]
    expect(peorUPorElemento(calcUInit, ests, 'techo')).toBe('0.25')
  })

  it('solución asignada sin cálculo (sin ningún res.U) → usa su U de catálogo', () => {
    const calcUInit = {}
    const ests = [{ id: 'albanil', soluciones: { techo: { solucion: { cod: '1.1.G.M2.1' }, u: 0.38 } } }]
    expect(peorUPorElemento(calcUInit, ests, 'techo')).toBe('0.38')
  })

  it('sin datos → undefined (deja que el resumen use el fallback termica[elem].u)', () => {
    expect(peorUPorElemento({}, [], 'techo')).toBeUndefined()
    expect(peorUPorElemento(null, null, 'techo')).toBeUndefined()
  })

  it('ignora entradas de otros elementos (::muro no contamina el techo)', () => {
    const calcUInit = { 'est1::muro': { res: { U: 0.90 } }, 'est1::techo': { res: { U: 0.20 } } }
    const ests = [{ id: 'est1', soluciones: { muro: { u: 0.90 }, techo: { u: 0.20 } } }]
    expect(peorUPorElemento(calcUInit, ests, 'techo')).toBe('0.2')
  })

  it('toma el peor entre dos sistemas calculados', () => {
    const calcUInit = { 'a::piso': { res: { U: 0.45 } }, 'b::piso': { res: { U: 0.49 } } }
    const ests = [
      { id: 'a', soluciones: { piso: { u: 0.45 } } },
      { id: 'b', soluciones: { piso: { u: 0.49 } } },
    ]
    expect(peorUPorElemento(calcUInit, ests, 'piso')).toBe('0.49')
  })

  it('clave simple global (sin sistema) también cuenta', () => {
    const calcUInit = { techo: { res: { U: 0.27 } } }
    expect(peorUPorElemento(calcUInit, [], 'techo')).toBe('0.27')
  })

  it('descarta U de catálogo no numérico o ≤ 0', () => {
    const ests = [
      { id: 'a', soluciones: { techo: { u: '—' } } },
      { id: 'b', soluciones: { techo: { u: 0 } } },
    ]
    expect(peorUPorElemento({}, ests, 'techo')).toBeUndefined()
  })
})
