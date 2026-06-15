// ─────────────────────────────────────────────────────────────────────────────
// demanda.test.js — Regresión del balance térmico anual (ISO 13790).
//
// Blinda la fórmula EXACTA del factor de utilización de ganancias
// (§12.2.1.1, método estacional a0=0.8 τ0=30h) que reemplazó a la
// aproximación 1−e^(−1/γ). Valores de referencia calculados a mano.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { etaUtilizacion13790, balanceTermicoAnual, CM_POR_MASA, perdidasPuentesTermicos } from '../lib/engines/demanda.js'

const cerca = (a, b, tol = 0.01) => Math.abs(a - b) <= tol

describe('etaUtilizacion13790 — fórmula exacta ISO 13790', () => {
  it('caso de referencia: γ=0.45, a=1.56 → η≈0.817 (calculado a mano)', () => {
    // η = (1−0.45^1.56)/(1−0.45^2.56) = 0.712/0.871 ≈ 0.817
    expect(cerca(etaUtilizacion13790(0.45, 1.56), 0.817, 0.005)).toBe(true)
  })

  it('γ=1 exacto → η = a/(a+1) (límite de la fórmula)', () => {
    expect(cerca(etaUtilizacion13790(1, 2), 2 / 3, 0.001)).toBe(true)
    expect(cerca(etaUtilizacion13790(1, 0.8), 0.8 / 1.8, 0.001)).toBe(true)
  })

  it('η siempre acotado en [0,1]', () => {
    for (const g of [0.1, 0.5, 1, 2, 5, 20]) {
      for (const a of [0.8, 1.5, 3, 10]) {
        const eta = etaUtilizacion13790(g, a)
        expect(eta).toBeGreaterThanOrEqual(0)
        expect(eta).toBeLessThanOrEqual(1)
      }
    }
  })

  it('física: más masa térmica (a mayor) → más ganancias aprovechadas', () => {
    // A γ fijo <1, a=3 debe aprovechar más que a=1.56
    expect(etaUtilizacion13790(0.45, 3)).toBeGreaterThan(etaUtilizacion13790(0.45, 1.56))
  })

  it('física: γ grande (muchas ganancias) → η→1/γ (se desperdician)', () => {
    // γ=5: gran parte de las ganancias no se aprovecha
    expect(etaUtilizacion13790(5, 1.5)).toBeLessThan(0.35)
  })

  it('sin ganancias (γ≤0) → η=1 (irrelevante, no rompe)', () => {
    expect(etaUtilizacion13790(0, 1.5)).toBe(1)
  })
})

describe('balanceTermicoAnual — integración con masa térmica', () => {
  const base = {
    elementos: [
      { U: 0.4, area: 90 },   // muros
      { U: 0.28, area: 60 },  // techo
      { U: 0.5, area: 60 },   // piso
    ],
    areaUtil: 100,
    ach: 0.8,
    areasVidrio: { N: 6, E: 3, S: 4, O: 3 },
    factorSolar: 0.7,
    zonaClima: 'F',
  }

  it('estructura completa con bloque iso13790 (γ, τ, a, H)', () => {
    const b = balanceTermicoAnual(base)
    expect(b.iso13790).toBeTruthy()
    expect(b.iso13790.tauHoras).toBeGreaterThan(0)
    expect(b.iso13790.H_WK).toBeGreaterThan(0)
    expect(b.demandaNeta).toBeGreaterThanOrEqual(0)
    expect(b.ganancias.factorUtilizacion).toBeGreaterThan(0)
    expect(b.ganancias.factorUtilizacion).toBeLessThanOrEqual(1)
  })

  it('física: masa alta aprovecha más ganancias → demanda ≤ masa baja', () => {
    const baja = balanceTermicoAnual({ ...base, masaTermica: 'baja' })
    const alta = balanceTermicoAnual({ ...base, masaTermica: 'alta' })
    expect(alta.ganancias.factorUtilizacion).toBeGreaterThanOrEqual(baja.ganancias.factorUtilizacion)
    expect(alta.demandaNeta).toBeLessThanOrEqual(baja.demandaNeta)
  })

  it('retrocompat: sin masaTermica usa "media" (no rompe llamadas existentes)', () => {
    const sinParam = balanceTermicoAnual(base)
    const media = balanceTermicoAnual({ ...base, masaTermica: 'media' })
    expect(sinParam.demandaNeta).toBe(media.demandaNeta)
    expect(CM_POR_MASA.media).toBe(165000)   // ISO 13790 Tabla 12
  })

  it('H coherente: ΣU·A + 0.34·n·V', () => {
    const b = balanceTermicoAnual(base)
    // ΣU·A = 0.4·90 + 0.28·60 + 0.5·60 = 36+16.8+30 = 82.8 W/K
    // infiltración = 0.34·0.8·250 = 68 W/K → H = 150.8
    expect(cerca(b.iso13790.H_WK, 150.8, 0.5)).toBe(true)
  })

  it('retrocompat: sin psiLTotal → pérdidas PT = 0, no rompe', () => {
    const b = balanceTermicoAnual(base)
    expect(b.perdidas.puentesTermicos).toBe(0)
    expect(b.iso13790.psiLTotal).toBe(0)
  })
})

describe('integración de puentes térmicos (Ψ·L) en balance', () => {
  const base = {
    elementos: [
      { U: 0.4, area: 90 },
      { U: 0.28, area: 60 },
      { U: 0.5, area: 60 },
    ],
    areaUtil: 100,
    ach: 0.8,
    areasVidrio: { N: 6, E: 3, S: 4, O: 3 },
    factorSolar: 0.7,
    zonaClima: 'F',
  }

  it('perdidasPuentesTermicos: Ψ·L × HDD18 × 24 / 1000', () => {
    // psiL=10 W/K, HDD18=2000 → 10·2000·24/1000 = 480 kWh
    expect(perdidasPuentesTermicos(10, 2000)).toBe(480)
    expect(perdidasPuentesTermicos(0, 2000)).toBe(0)
    expect(perdidasPuentesTermicos(10, 0)).toBe(0)
  })

  it('psiLTotal se suma a pérdidas y a H', () => {
    const sin = balanceTermicoAnual(base)
    const con = balanceTermicoAnual({ ...base, psiLTotal: 15 })
    expect(con.perdidas.puentesTermicos).toBeGreaterThan(0)
    expect(con.perdidas.total).toBeGreaterThan(sin.perdidas.total)
    // H debe incluir ΣΨ·L
    expect(con.iso13790.H_WK).toBeGreaterThan(sin.iso13790.H_WK)
    expect(cerca(con.iso13790.H_WK - sin.iso13790.H_WK, 15, 0.5)).toBe(true)
  })

  it('más PT → más demanda neta', () => {
    const sin  = balanceTermicoAnual(base)
    const poco = balanceTermicoAnual({ ...base, psiLTotal: 5 })
    const mucho = balanceTermicoAnual({ ...base, psiLTotal: 25 })
    expect(poco.demandaNeta).toBeGreaterThanOrEqual(sin.demandaNeta)
    expect(mucho.demandaNeta).toBeGreaterThan(poco.demandaNeta)
  })

  it('τ baja con más PT (H sube → τ=Cm/(3600·H) baja)', () => {
    const sin = balanceTermicoAnual(base)
    const con = balanceTermicoAnual({ ...base, psiLTotal: 20 })
    expect(con.iso13790.tauHoras).toBeLessThan(sin.iso13790.tauHoras)
  })

  it('psiLTotal se reporta en iso13790', () => {
    const b = balanceTermicoAnual({ ...base, psiLTotal: 12.5 })
    expect(b.iso13790.psiLTotal).toBe(12.5)
  })
})
