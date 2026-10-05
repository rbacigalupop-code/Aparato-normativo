// ─────────────────────────────────────────────────────────────────────────────
// demanda_mensual.test.js — Método MENSUAL ISO 13790 §12 del balance térmico.
//
// Blinda balanceTermicoMensual() y radiacionVerticalMensual(), que reemplazan
// al método anual/estacional como motor de la pestaña Demanda y del informe.
// El mensual corrige el sesgo del anual (mezclaba pérdidas de temporada fría
// con ganancias de año completo) → da una demanda mayor y más honesta.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  balanceTermicoAnual,
  balanceTermicoMensual,
  radiacionVerticalMensual,
} from '../lib/engines/demanda.js'
import { obtenerRadiacionVertical } from '../data/clima_anual.js'

const cerca = (a, b, tol = 0.5) => Math.abs(a - b) <= tol

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

describe('radiacionVerticalMensual — distribución mensual de radiación', () => {
  it('devuelve 12 filas con las 4 orientaciones', () => {
    const rm = radiacionVerticalMensual('D')
    expect(rm).toHaveLength(12)
    for (const fila of rm) {
      for (const o of ['N', 'E', 'S', 'O']) expect(typeof fila[o]).toBe('number')
    }
  })

  it('INVARIANTE: la suma de los 12 meses = radiación anual por orientación', () => {
    for (const z of ['A', 'D', 'F', 'H']) {
      const rm = radiacionVerticalMensual(z)
      const anual = obtenerRadiacionVertical(z)
      for (const o of ['N', 'E', 'S', 'O']) {
        const suma = rm.reduce((s, f) => s + f[o], 0)
        expect(cerca(suma, anual[o], 1)).toBe(true)
      }
    }
  })

  it('todos los valores mensuales son ≥ 0 (nunca radiación negativa)', () => {
    const rm = radiacionVerticalMensual('F')
    for (const fila of rm) for (const o of ['N', 'E', 'S', 'O']) expect(fila[o]).toBeGreaterThanOrEqual(0)
  })

  it('estacionalidad: para E (verano-dominante) enero > julio', () => {
    const rm = radiacionVerticalMensual('D')
    expect(rm[0].E).toBeGreaterThan(rm[6].E)   // mes 1 (ene) > mes 7 (jul)
  })
})

describe('balanceTermicoMensual — estructura y física', () => {
  it('devuelve forma compatible con el anual + bloque mensual', () => {
    const b = balanceTermicoMensual(base)
    expect(b.perdidas).toBeTruthy()
    expect(b.ganancias).toBeTruthy()
    expect(b.iso13790.metodo).toBe('mensual')
    expect(b.meses).toHaveLength(12)
    expect(b.demandaNeta).toBeGreaterThanOrEqual(0)
    expect(b.ganancias.factorUtilizacion).toBeGreaterThan(0)
    expect(b.ganancias.factorUtilizacion).toBeLessThanOrEqual(1)
    expect(b.calificacion).toBeTruthy()
  })

  it('H coherente: ΣU·A + 0.34·n·V (= 150.8 W/K en el caso base)', () => {
    // ΣU·A = 0.4·90+0.28·60+0.5·60 = 82.8 ; inf = 0.34·0.8·250 = 68 → 150.8
    expect(cerca(balanceTermicoMensual(base).iso13790.H_WK, 150.8, 0.5)).toBe(true)
  })

  it('parámetro a usa la variante MENSUAL (a = 1 + τ/15)', () => {
    const b = balanceTermicoMensual(base)
    expect(cerca(b.iso13790.aNum, 1 + b.iso13790.tauHoras / 15, 0.02)).toBe(true)
  })

  it('la suma de la demanda mensual ≈ demandaNeta', () => {
    const b = balanceTermicoMensual(base)
    const sumaMeses = b.meses.reduce((s, m) => s + m.demanda, 0)
    expect(cerca(sumaMeses, b.demandaNeta, 2)).toBe(true)
  })

  it('perfil estacional: julio (invierno) demanda más que enero (verano)', () => {
    const b = balanceTermicoMensual(base)
    const ene = b.meses.find(m => m.mes === 1).demanda
    const jul = b.meses.find(m => m.mes === 7).demanda
    expect(jul).toBeGreaterThan(ene)
  })

  it('física: masa alta aprovecha más ganancias → demanda ≤ masa baja', () => {
    const baja = balanceTermicoMensual({ ...base, masaTermica: 'baja' })
    const alta = balanceTermicoMensual({ ...base, masaTermica: 'alta' })
    expect(alta.ganancias.factorUtilizacion).toBeGreaterThanOrEqual(baja.ganancias.factorUtilizacion)
    expect(alta.demandaNeta).toBeLessThanOrEqual(baja.demandaNeta)
  })

  it('física: más puentes térmicos → más demanda y H incluye ΣΨ·L', () => {
    const sin = balanceTermicoMensual(base)
    const con = balanceTermicoMensual({ ...base, psiLTotal: 20 })
    expect(con.perdidas.puentesTermicos).toBeGreaterThan(0)
    expect(con.demandaNeta).toBeGreaterThan(sin.demandaNeta)
    expect(cerca(con.iso13790.H_WK - sin.iso13790.H_WK, 20, 0.5)).toBe(true)
  })

  it('física: clima más frío (H) exige más demanda que uno templado (A)', () => {
    const calido = balanceTermicoMensual({ ...base, zonaClima: 'A' })
    const frio   = balanceTermicoMensual({ ...base, zonaClima: 'H' })
    expect(frio.demandaNeta).toBeGreaterThan(calido.demandaNeta)
  })
})

describe('mensual vs anual — la corrección aumenta la demanda (anti-subestimación)', () => {
  it('en zona fría el método mensual da ≥ demanda que el anual', () => {
    const an = balanceTermicoAnual(base)
    const me = balanceTermicoMensual(base)
    // el anual mezclaba pérdidas de temporada con ganancias de año completo →
    // subestimaba; el mensual corrige al alza (o al menos no baja).
    expect(me.demandaNeta).toBeGreaterThanOrEqual(an.demandaNeta)
  })

  it('no rompe retrocompat: balanceTermicoAnual sigue existiendo y calculando', () => {
    const an = balanceTermicoAnual(base)
    expect(an.iso13790.metodo).toBeUndefined()   // el anual no marca metodo
    expect(an.demandaNeta).toBeGreaterThanOrEqual(0)
  })
})
