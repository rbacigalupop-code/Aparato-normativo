// ─────────────────────────────────────────────────────────────────────────────
// renovables.test.js — Motor de energías renovables (FV, solar térmico, BdC).
//
// Blinda los números que ve el cliente: dimensionamiento y payback FV
// (net-billing Ley 21.118), ACS + franquicia Ley 20.365, y bomba de calor con
// COP corregido por clima. Incluye la unificación de estimarDemandaTermica()
// con el método mensual ISO 13790 (balanceTermicoMensual).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  dimensionarFV, producirFV, costoFV, ahorroNetBilling, analizarFV,
  demandaACS, aplicarFranquicia20365, analizarSolarTermico,
  copEstacional, analizarBdC, estimarDemandaTermica,
} from '../lib/engines/renovables.js'
import { balanceTermicoMensual, envolventeFromCalcUInit, ventanasFromFachadas } from '../lib/engines/demanda.js'
import { zonaClimaDeOGUC } from '../data/zona_clima.js'
import { PR_FV, FACTOR_NETBILLING } from '../data/precios_renovables.js'

const cerca = (a, b, tol = 1) => Math.abs(a - b) <= tol

describe('Solar fotovoltaico', () => {
  it('producirFV = kWp · irrad·365 · PR', () => {
    expect(producirFV(5, { anual: 5 })).toBe(Math.round(5 * 5 * 365 * PR_FV))
  })
  it('producirFV con args nulos → 0', () => {
    expect(producirFV(0, { anual: 5 })).toBe(0)
    expect(producirFV(5, null)).toBe(0)
  })
  it('dimensionarFV redondea a múltiplos de 0.5 kWp', () => {
    expect(dimensionarFV(4200, { anual: 5 })).toBe(3)   // 4200/(5·365·0.78)=2.95 → 3.0
    expect(dimensionarFV(0, { anual: 5 })).toBe(0)
  })
  it('costoFV aplica el tier según escala', () => {
    expect(costoFV(3)).toBe(3 * 1350000)   // residencial chico
    expect(costoFV(5)).toBe(5 * 1100000)   // residencial grande
  })
  it('ahorroNetBilling: autoconsumo a tarifa plena + inyección a factor NB', () => {
    const r = ahorroNetBilling(7000, 4200, 180)
    expect(r.autoconsumo).toBe(2450)   // 35% de 7000
    expect(r.inyeccion).toBe(4550)
    expect(r.ahorroClp).toBe(Math.round(2450 * 180 + 4550 * 180 * FACTOR_NETBILLING))
  })
  it('ahorroNetBilling sin producción → todo 0', () => {
    expect(ahorroNetBilling(0, 4200, 180)).toEqual({ ahorroClp: 0, autoconsumo: 0, inyeccion: 0 })
  })
  it('analizarFV devuelve dimensionamiento y economía coherentes', () => {
    const r = analizarFV({ consumoKwhAnual: 4200, proy: { zona: 'D' } })
    expect(r.kWp).toBeGreaterThan(0)
    expect(r.produccion).toBeGreaterThan(0)
    expect(r.cobertura).toBeGreaterThanOrEqual(0)
    expect(r.cobertura).toBeLessThanOrEqual(1)
  })
})

describe('Solar térmico (ACS)', () => {
  it('demandaACS: Q = m·Cp·ΔT anual (4 personas ≈ 2037 kWh)', () => {
    expect(cerca(demandaACS(4), 2037, 2)).toBe(true)
  })
  it('más personas → más demanda ACS', () => {
    expect(demandaACS(6)).toBeGreaterThan(demandaACS(4))
  })
  it('franquicia Ley 20.365 por tramos UF', () => {
    expect(aplicarFranquicia20365(1450000, 1500)).toBe(Math.round(1450000 * 0.55)) // ≤2000 UF
    expect(aplicarFranquicia20365(1450000, 2500)).toBe(Math.round(1450000 * 0.25)) // 2000-3000
    expect(aplicarFranquicia20365(1450000, 3500)).toBe(0)                           // >3000
  })
  it('analizarSolarTermico: cobertura parcial y descuento aplicado', () => {
    const r = analizarSolarTermico({ personas: 4, proy: { zona: 'D' }, valorUF: 1500 })
    expect(r.demanda).toBeGreaterThan(0)
    expect(r.cobertura).toBeGreaterThan(0)
    expect(r.energiaSolar).toBeLessThanOrEqual(r.demanda)
    expect(r.costoNeto).toBeLessThan(r.costoBruto)   // franquicia descontó
  })
})

describe('Bomba de calor — COP corregido por clima', () => {
  it('geotérmica usa COP nominal estable (no cae con el frío)', () => {
    expect(copEstacional('geotermica', 2)).toBe(5.0)
  })
  it('el COP del split cae con la temperatura exterior', () => {
    expect(copEstacional('split_aire_aire', 12)).toBeGreaterThan(copEstacional('split_aire_aire', -5))
  })
  it('tipo inexistente → COP 0', () => {
    expect(copEstacional('zzz', 5)).toBe(0)
  })
  it('analizarBdC: shape y consumo = demanda/COP', () => {
    const r = analizarBdC({ demandaTermicaKwh: 8000, proy: { zona: 'F', configEnergetica: { combustibleCalef: 'lena_no_cert' } }, tipoBdC: 'split_aire_aire' })
    expect(r.cop).toBeGreaterThan(0)
    expect(r.consumoElecBdC).toBe(Math.round(8000 / r.cop))
    expect(r.inversion).toBeGreaterThan(0)
  })
  it('tipo de BdC inexistente → null', () => {
    expect(analizarBdC({ demandaTermicaKwh: 8000, proy: { zona: 'F' }, tipoBdC: 'zzz' })).toBeNull()
  })
})

describe('estimarDemandaTermica — unificada con el método mensual', () => {
  it('sin cálculos U → fallback por macrozona climática', () => {
    expect(estimarDemandaTermica({ zona: 'F' }, {})).toBe(14000)
    expect(estimarDemandaTermica({ zona: 'A' }, {})).toBe(2500)
    expect(estimarDemandaTermica({}, {})).toBe(8000)   // sin zona → D
  })

  it('CON cálculos U delega EXACTAMENTE en balanceTermicoMensual().demandaNeta', () => {
    const calcU = { muro: { res: { U: '0.5' } }, techo: { res: { U: '0.3' } }, piso: { res: { U: '0.4' } } }
    const proy = { zona: 'F', superficie: 100 }
    const zonaEf = zonaClimaDeOGUC('F', undefined)
    const esperado = balanceTermicoMensual({
      elementos: envolventeFromCalcUInit(calcU),
      areaUtil: 100,
      ach: 0.8,
      areasVidrio: ventanasFromFachadas(proy.fachadas).areasVidrio,
      comunaKey: undefined,
      zonaClima: zonaEf,
    }).demandaNeta
    expect(estimarDemandaTermica(proy, calcU)).toBe(esperado)
  })

  it('la demanda neta (con ganancias) es menor que el bruto de envolvente', () => {
    const calcU = { muro: { res: { U: '0.5' } }, techo: { res: { U: '0.3' } }, piso: { res: { U: '0.4' } } }
    const proy = { zona: 'F', superficie: 100 }
    const neta = estimarDemandaTermica(proy, calcU)
    expect(neta).toBeGreaterThan(0)
    expect(neta).toBeLessThan(14000)   // < el fallback grueso de la misma zona
  })
})
