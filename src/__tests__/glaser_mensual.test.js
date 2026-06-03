// ─────────────────────────────────────────────────────────────────────────────
// glaser_mensual.test.js — Regresión del método Glaser mensual (ISO 13788).
//
// Blinda glaserMensualPaso (1 mes) y analizarGlaserAnual (12 meses + balance de
// acumulación/secado). Este motor alimenta el módulo Higrotérmico (WUFI) y no
// tenía tests. Usa entradas sintéticas (no depende de los módulos de clima por
// comuna), así que es puro y determinista.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { glaserMensualPaso, analizarGlaserAnual } from '../lib/engines/glaser_mensual.js'

// Muro aislado vapor-abierto (yeso | lana | fibrocemento). esp en METROS.
const muroOk = [
  { lam: 0.26, esp: 0.013, mu: 8 },
  { lam: 0.035, esp: 0.100, mu: 1 },
  { lam: 0.23, esp: 0.006, mu: 50 },
]

// Muro con barrera de vapor MAL puesta al exterior (μ alto en cara fría) → condensa
const muroMalo = [
  { lam: 0.26, esp: 0.013, mu: 8 },
  { lam: 0.035, esp: 0.100, mu: 1 },
  { lam: 0.23, esp: 0.002, mu: 100000 },   // barrera vapor al exterior (error)
]

// Clima sintético: 12 meses, invierno frío (jun-ago) / verano cálido (dic-feb)
function climaSintetico(tMin = 4, tMax = 20, hr = 72) {
  const meses = []
  for (let m = 1; m <= 12; m++) {
    const tMedia = (tMin + tMax) / 2
    const ampl = (tMax - tMin) / 2
    // mes 1 (ene) cálido, mes 7 (jul) frío (hemisferio sur)
    const t = tMedia + ampl * Math.cos(2 * Math.PI * (m - 1) / 12)
    meses.push({ mes: m, label: `M${m}`, t_ext: Math.round(t * 10) / 10, hr_ext: hr, t_int: 20, hr_int: 55 })
  }
  return meses
}

describe('glaserMensualPaso — un mes', () => {
  it('devuelve estructura completa con T_iface decreciente int→ext', () => {
    const r = glaserMensualPaso(muroOk, 5, 80, 20, 55, 'muro')
    expect(r).not.toBeNull()
    expect(Array.isArray(r.T_iface)).toBe(true)
    expect(typeof r.condensa).toBe('boolean')
    // Primera interfaz (interior) más caliente que la última (exterior)
    expect(r.T_iface[0]).toBeGreaterThan(r.T_iface[r.T_iface.length - 1])
  })

  it('capas vacías → null', () => {
    expect(glaserMensualPaso([], 5, 80)).toBeNull()
  })

  it('barrera de vapor al exterior en mes frío → condensa', () => {
    const r = glaserMensualPaso(muroMalo, 2, 85, 20, 60, 'muro')
    expect(r.condensa).toBe(true)
  })
})

describe('analizarGlaserAnual — 12 meses + balance', () => {
  it('clima templado SIN condensación → cumple y sin_riesgo', () => {
    // Clima cálido (inviernos suaves, sin meses bajo punto de rocío) →
    // ningún mes condensa → peak 0 → cumple ISO 13788, veredicto sin_riesgo.
    const clima = climaSintetico(13, 24, 65)
    const a = analizarGlaserAnual(muroOk, clima, 'muro')
    expect(a).not.toBeNull()
    expect(a.mesesConCondensacion).toBe(0)
    expect(a.cumpleISO13788).toBe(true)
    expect(a.veredicto).toBe('sin_riesgo')
  })

  it('devuelve 12 detalles mensuales + interfaz crítica', () => {
    const clima = climaSintetico()
    const a = analizarGlaserAnual(muroOk, clima, 'muro')
    expect(a.detallesMensual).toHaveLength(12)
    expect(a.interfazCritica).toHaveProperty('peakG')
    expect(a.interfazCritica).toHaveProperty('acumFinalG')
  })

  it('clima frío → registra meses con condensación (>0)', () => {
    // NOTA: el motor sobreestima la TASA absoluta de condensación (modelo
    // simplificado δ·exceso/Sd). El veredicto cualitativo (cuántos meses
    // condensan, se acumula o se seca) es el output usable; los g/m²
    // absolutos no son confiables. Ver docs/AUDITORIA_CALCULADORA_U.md.
    const clima = climaSintetico(2, 18, 80)
    const a = analizarGlaserAnual(muroOk, clima, 'muro')
    expect(a.mesesConCondensacion).toBeGreaterThan(0)
    expect(['sin_riesgo', 'autoseca', 'peak_alto', 'acumula']).toContain(a.veredicto)
  })

  it('sin capas o sin clima → null', () => {
    expect(analizarGlaserAnual([], climaSintetico())).toBeNull()
    expect(analizarGlaserAnual(muroOk, [])).toBeNull()
  })
})
