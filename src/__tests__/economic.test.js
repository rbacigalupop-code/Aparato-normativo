// ─────────────────────────────────────────────────────────────────────────────
// economic.test.js — Motor costo-beneficio de correcciones térmicas.
//
// Blinda los números que el cliente/mandante ve: ahorro kWh, ahorro CLP por
// combustible, emisiones evitadas, payback simple/descontado y VAN.
// Valores anclados a los datos reales de combustibles.js (precios 2026).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  ahorroTermicoAnual,
  ahorroEconomicoAnual,
  emisionesEvitadasAnual,
  paybackSimple,
  paybackDescontado,
  vanProyecto,
} from '../lib/engines/economic.js'
import { clpKwhUtil } from '../data/combustibles.js'

const cerca = (a, b, tol = 0.01) => Math.abs(a - b) <= tol

describe('ahorroTermicoAnual — ΔU·A·HDD·24/1000', () => {
  it('caso de referencia: (1.0−0.6)·10·2000·24/1000 = 192 kWh', () => {
    expect(ahorroTermicoAnual(1.0, 0.6, 10, 2000)).toBe(192)
  })
  it('ΔU truncado a 0 si NO mejora (uDespues ≥ uAntes) → ahorro 0', () => {
    expect(ahorroTermicoAnual(0.6, 1.0, 10, 2000)).toBe(0)
    expect(ahorroTermicoAnual(0.6, 0.6, 10, 2000)).toBe(0)
  })
  it('argumentos faltantes/0 → 0 (no NaN)', () => {
    expect(ahorroTermicoAnual(0, 0.6, 10, 2000)).toBe(0)
    expect(ahorroTermicoAnual(1, 0.6, 10, 0)).toBe(0)
  })
})

describe('clpKwhUtil — precio por kWh útil según combustible', () => {
  it('leña no certificada centro: 75000/(3200·0.65)', () => {
    expect(cerca(clpKwhUtil('lena_no_cert', 'centro'), 75000 / (3200 * 0.65), 0.1)).toBe(true)
  })
  it('eléctrica resistiva usa tarifa/rend (180/1.0 = 180)', () => {
    expect(cerca(clpKwhUtil('elec_resistiva', 'centro', 180), 180, 0.01)).toBe(true)
  })
  it('bomba de calor (COP>1) es más barata por kWh útil que la resistiva', () => {
    expect(clpKwhUtil('bdc_split', 'centro', 180)).toBeLessThan(clpKwhUtil('elec_resistiva', 'centro', 180))
  })
  it('combustible inexistente → null', () => {
    expect(clpKwhUtil('no_existe', 'centro')).toBeNull()
  })
})

describe('ahorroEconomicoAnual', () => {
  it('ahorroKwh × CLP/kWh del combustible configurado', () => {
    const cu = clpKwhUtil('lena_no_cert', 'centro')
    const r = ahorroEconomicoAnual(200, { combustibleCalef: 'lena_no_cert', macrozona: 'centro' })
    expect(r.ahorroClp).toBe(Math.round(200 * cu))
    expect(r.combustibleId).toBe('lena_no_cert')
  })
  it('combustible inválido → ahorro 0 (no rompe)', () => {
    const r = ahorroEconomicoAnual(200, { combustibleCalef: 'no_existe', macrozona: 'centro' })
    expect(r.ahorroClp).toBe(0)
  })
})

describe('emisionesEvitadasAnual', () => {
  it('ahorroKwh × factor CO₂ (leña no cert = 0.41)', () => {
    expect(emisionesEvitadasAnual(200, 'lena_no_cert')).toBe(Math.round(200 * 0.41))
  })
  it('combustible inexistente → 0', () => {
    expect(emisionesEvitadasAnual(200, 'no_existe')).toBe(0)
  })
})

describe('paybackSimple', () => {
  it('costo / ahorro anual', () => {
    expect(paybackSimple(500000, 100000)).toBe(5)
  })
  it('ahorro ≤ 0 → null (no divide por cero)', () => {
    expect(paybackSimple(500000, 0)).toBeNull()
    expect(paybackSimple(500000, -10)).toBeNull()
  })
})

describe('paybackDescontado', () => {
  it('a tasa 0 coincide con el payback simple', () => {
    expect(cerca(paybackDescontado(500000, 100000, 0), 5, 0.05)).toBe(true)
  })
  it('a tasa > 0 el payback se alarga vs el simple', () => {
    expect(paybackDescontado(500000, 100000, 0.05)).toBeGreaterThan(paybackSimple(500000, 100000))
  })
  it('ahorro ≤ 0 → null', () => {
    expect(paybackDescontado(500000, 0, 0.05)).toBeNull()
  })
  it('inversión impagable dentro de maxAnios → null', () => {
    expect(paybackDescontado(1e12, 100, 0.05, 50)).toBeNull()
  })
})

describe('vanProyecto', () => {
  it('tasa 0: VAN = −costo + años·ahorro', () => {
    expect(vanProyecto(500000, 100000, 10, 0)).toBe(-500000 + 10 * 100000)
  })
  it('ahorro ≤ 0 → VAN = −costo', () => {
    expect(vanProyecto(500000, 0, 30, 0.05)).toBe(-500000)
  })
  it('VAN positivo cuando el ahorro descontado supera el costo', () => {
    expect(vanProyecto(100000, 50000, 30, 0.05)).toBeGreaterThan(0)
  })
})
