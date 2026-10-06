// ─────────────────────────────────────────────────────────────────────────────
// cev.test.js — CEV estimada. Blinda el gating del bono FV: el fotovoltaico solo
// mejora la calificación cuando la calefacción es eléctrica (resistiva o BdC),
// porque solo ahí reduce la energía de calefacción. Con leña/gas no toca la
// demanda térmica (ayuda al consumo eléctrico/CO₂, no a la letra por demanda).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calcularCEVEstimada } from '../lib/engines/cev.js'

describe('calcularCEVEstimada — bono FV condicionado a calefacción eléctrica', () => {
  it('con leña, el FV NO cambia la demanda ajustada ni la letra', () => {
    const sin = calcularCEVEstimada({ demandaKwhM2Anio: 100, combustibleCalef: 'lena_no_cert', tieneFV: false })
    const con = calcularCEVEstimada({ demandaKwhM2Anio: 100, combustibleCalef: 'lena_no_cert', tieneFV: true })
    expect(con.demandaAjustada).toBe(sin.demandaAjustada)
    expect(con.letra).toBe(sin.letra)
  })

  it('con calefacción eléctrica, el FV SÍ reduce la demanda ajustada', () => {
    const sin = calcularCEVEstimada({ demandaKwhM2Anio: 100, combustibleCalef: 'elec_resistiva', tieneFV: false })
    const con = calcularCEVEstimada({ demandaKwhM2Anio: 100, combustibleCalef: 'elec_resistiva', tieneFV: true })
    expect(con.demandaAjustada).toBeLessThan(sin.demandaAjustada)
  })

  it('una BdC habilita el bono FV aunque el combustible base no sea eléctrico', () => {
    const sin = calcularCEVEstimada({ demandaKwhM2Anio: 100, combustibleCalef: 'lena_no_cert', tieneBdC: true, tieneFV: false })
    const con = calcularCEVEstimada({ demandaKwhM2Anio: 100, combustibleCalef: 'lena_no_cert', tieneBdC: true, tieneFV: true })
    expect(con.demandaAjustada).toBeLessThan(sin.demandaAjustada)
  })

  it('devuelve letra, color y percentil', () => {
    const r = calcularCEVEstimada({ demandaKwhM2Anio: 80, combustibleCalef: 'gas_natural' })
    expect(typeof r.letra).toBe('string')
    expect(r.color).toBeTruthy()
    expect(typeof r.percentilChile).toBe('number')
  })
})
