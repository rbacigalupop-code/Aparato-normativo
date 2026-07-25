// ─────────────────────────────────────────────────────────────────────────────
// acoustic_engine.test.js — M2
//
// Bug histórico: estimarRwComposicion y calcularMejoraAcustica usaban una fórmula
// de paralelo con factor -20 (presión) en vez de -10 (potencia), y "mejorar"
// daba un Rw MENOR (añadir aislación "empeoraba"). Corregido:
//  · estimarRwComposicion = composición en PARALELO (ISO 12354-3), factor -10,
//    ponderada por área. El camino más débil domina.
//  · calcularMejoraAcustica = capas EN SERIE, modelo aditivo ΔRw → mejora ≥ 0.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  estimarRwComposicion,
  calcularMejoraAcustica,
  validarRwCumplimiento,
  rwFachadaCompuesta,
  MEJORAS_IMPACTO_PISO,
  lnwConMejora,
} from '../lib/engines/acoustic.js'

describe('estimarRwComposicion — paralelo (ISO 12354-3)', () => {
  it('dos elementos idénticos no cambian el Rw', () => {
    const r = estimarRwComposicion([{ rw: 40 }, { rw: 40 }])
    expect(r.rwEstimado).toBeCloseTo(40, 1)
  })

  it('el elemento débil baja el conjunto por debajo del fuerte', () => {
    // muro Rw=50 + ventana Rw=30, igual área → τ=(1e-5+1e-3)/2 → ~33 dB
    const r = estimarRwComposicion([{ rw: 50 }, { rw: 30 }])
    expect(r.rwEstimado).toBeCloseTo(33.0, 1)
    expect(r.rwEstimado).toBeLessThan(50)   // peor que el fuerte
    expect(r.rwEstimado).toBeGreaterThan(30) // mejor que el débil puro (es parte del área)
  })

  it('ponderación por área: más superficie débil empeora más el conjunto', () => {
    const pocoDebil = estimarRwComposicion([{ rw: 50, area: 9 }, { rw: 30, area: 1 }])
    const muchoDebil = estimarRwComposicion([{ rw: 50, area: 1 }, { rw: 30, area: 9 }])
    expect(muchoDebil.rwEstimado).toBeLessThan(pocoDebil.rwEstimado)
  })

  it('lista vacía / sin rw válido → null', () => {
    expect(estimarRwComposicion([])).toBeNull()
    expect(estimarRwComposicion([{ rw: 0 }])).toBeNull()
  })
})

describe('calcularMejoraAcustica — serie aditiva', () => {
  it('añadir capas SUBE el Rw (mejora ≥ 0)', () => {
    const r = calcularMejoraAcustica(45, [{ rw: 5 }, { rw: 3 }])
    expect(r.rwMejorado).toBe(53)
    expect(r.mejora).toBe(8)
    expect(r.mejora).toBeGreaterThanOrEqual(0)
  })

  it('nunca empeora: rwMejorado ≥ rwBase', () => {
    const r = calcularMejoraAcustica(50, [{ rw: 0 }, { rw: 2 }])
    expect(r.rwMejorado).toBeGreaterThanOrEqual(50)
  })

  it('sin base o sin elementos → null', () => {
    expect(calcularMejoraAcustica(0, [{ rw: 5 }])).toBeNull()
    expect(calcularMejoraAcustica(45, [])).toBeNull()
  })
})

describe('validarRwCumplimiento — sin regresión', () => {
  it('cumple cuando actual ≥ requerido', () => {
    expect(validarRwCumplimiento(45, 40).cumple).toBe(true)
    expect(validarRwCumplimiento(35, 40).cumple).toBe(false)
  })
  it('sin requisito → cumple', () => {
    expect(validarRwCumplimiento(30, null).cumple).toBe(true)
  })
})

describe('rwFachadaCompuesta — muro + ventana en paralelo', () => {
  it('el vidrio baja el Rw de fachada por debajo del muro', () => {
    // muro 50, ventana 30, 30% vidriado → combinado < 50
    const r = rwFachadaCompuesta({ rwMuro: 50, rwVentana: 30, pctVidriado: 30 })
    expect(r).not.toBeNull()
    expect(r.combinado).toBeLessThan(50)
    expect(r.combinado).toBeGreaterThan(30)
    expect(r.debil).toBe('ventana')
  })

  it('más superficie vidriada baja más el conjunto', () => {
    const poco  = rwFachadaCompuesta({ rwMuro: 50, rwVentana: 30, pctVidriado: 15 })
    const mucho = rwFachadaCompuesta({ rwMuro: 50, rwVentana: 30, pctVidriado: 50 })
    expect(mucho.combinado).toBeLessThan(poco.combinado)
  })

  it('marca el muro como débil si la ventana aísla más', () => {
    const r = rwFachadaCompuesta({ rwMuro: 32, rwVentana: 40, pctVidriado: 20 })
    expect(r.debil).toBe('muro')
  })

  it('datos faltantes o % fuera de rango → null (cae a comportamiento previo)', () => {
    expect(rwFachadaCompuesta({ rwMuro: 50, rwVentana: 0, pctVidriado: 30 })).toBeNull()
    expect(rwFachadaCompuesta({ rwMuro: 0, rwVentana: 30, pctVidriado: 30 })).toBeNull()
    expect(rwFachadaCompuesta({ rwMuro: 50, rwVentana: 30, pctVidriado: 0 })).toBeNull()
    expect(rwFachadaCompuesta({ rwMuro: 50, rwVentana: 30, pctVidriado: 120 })).toBeNull()
  })
})

describe('MEJORAS_IMPACTO_PISO — revestimientos certificados de impacto (LOSCAA RP.O)', () => {
  it('carga la familia RP.O con ΔL,w positivo, ordenada desc', () => {
    expect(MEJORAS_IMPACTO_PISO.length).toBeGreaterThanOrEqual(9)
    for (const m of MEJORAS_IMPACTO_PISO) {
      expect(m.es_mejora).toBe(true)
      expect(m.delta_lw).toBeGreaterThan(0)
    }
    // orden descendente por ΔL,w
    for (let i = 1; i < MEJORAS_IMPACTO_PISO.length; i++)
      expect(MEJORAS_IMPACTO_PISO[i - 1].delta_lw).toBeGreaterThanOrEqual(MEJORAS_IMPACTO_PISO[i].delta_lw)
  })

  it('RP.O.01.05 tiene título real (no el glitch "INSTITUCIÓN: MINVU…")', () => {
    const m = MEJORAS_IMPACTO_PISO.find(x => x.codigo === 'RP.O.01.05')
    expect(m).toBeTruthy()
    expect(m.titulo).not.toMatch(/INSTITUCI[ÓO]N/i)
    expect(m.titulo).toMatch(/cielo falso/i)
  })
})

describe("lnwConMejora — L'n,w efectivo = base − ΔL,w", () => {
  it('resta el ΔL,w del revestimiento elegido (menor = mejor)', () => {
    // RP.O.01.04 Piso fotolaminado: ΔL,w 20 → 78 pasa a 58 (cumple ≤ 75)
    const r = lnwConMejora(78, 'RP.O.01.04')
    expect(r.base).toBe(78)
    expect(r.mejora.codigo).toBe('RP.O.01.04')
    expect(r.efectivo).toBe(58)
  })

  it('sin código o sin base no altera nada', () => {
    expect(lnwConMejora(78, '')).toEqual({ base: 78, mejora: null, efectivo: 78 })
    expect(lnwConMejora(0, 'RP.O.01.04')).toEqual({ base: 0, mejora: null, efectivo: 0 })
    expect(lnwConMejora('', 'RP.O.01.04').efectivo).toBe(0)
  })

  it('código inexistente se ignora (no rompe)', () => {
    expect(lnwConMejora(70, 'NO.EXISTE')).toEqual({ base: 70, mejora: null, efectivo: 70 })
  })
})
