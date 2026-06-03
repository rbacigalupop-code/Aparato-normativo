// ─────────────────────────────────────────────────────────────────────────────
// calcU.test.js — Suite de regresión del motor de cálculo térmico/higrotérmico.
//
// Objetivo: blindar las funciones puras de data.js contra regresiones. Los
// valores esperados están calculados a mano (primeros principios) o validados
// contra casos reales de la sesión y la planilla oficial MINVU (NCh853:2021 +
// NCh1973:2014). Si un cambio futuro altera estos números, el test lo detecta.
//
// Ejecutar: npm test   (o npx vitest run)
//
// Referencias normativas:
//   · ISO 6946:2017 — resistencia térmica (método combinado upper/lower)
//   · NCh853:2021    — transmitancia térmica U
//   · NCh1973:2014 / ISO 13788 — condensación (Glaser) + psat agua/hielo
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { satP, dewPoint, calcGlaser, calcU_ISO6946, calcU_SC } from '../data.js'

// Tolerancia para comparaciones de punto flotante
const cerca = (a, b, tol = 0.01) => Math.abs(a - b) <= tol

describe('satP — presión de saturación (ISO 13788, agua/hielo)', () => {
  it('T≥0 usa fórmula sobre agua (sin regresión)', () => {
    expect(cerca(satP(20), 2338.3, 0.5)).toBe(true)   // condición interior típica
    expect(cerca(satP(0), 610.8, 0.1)).toBe(true)     // límite agua/hielo
    expect(cerca(satP(10), 1227.7, 1)).toBe(true)
  })

  it('T<0 usa fórmula sobre HIELO (fix ISO 13788)', () => {
    // A −6°C la fórmula sobre hielo da ~368 Pa (vs ~390 sobre agua).
    // Esto es lo que exige ISO 13788 / NCh1973 para zonas frías chilenas.
    expect(cerca(satP(-6), 368.3, 1)).toBe(true)
    expect(cerca(satP(-2), 517.4, 1)).toBe(true)
  })

  it('continuidad en el límite T=0', () => {
    // Ambas ramas deben dar el mismo valor en 0°C (sin salto)
    expect(cerca(satP(-0.0001), satP(0.0001), 0.5)).toBe(true)
  })
})

describe('dewPoint — temperatura de rocío', () => {
  it('20°C / 73% HR (condición interior oficial MINVU) ≈ 15.0°C', () => {
    expect(cerca(dewPoint(20, 73), 15.0, 0.2)).toBe(true)
  })
  it('saturación (100% HR) → rocío = temperatura del aire', () => {
    expect(cerca(dewPoint(20, 100), 20.0, 0.1)).toBe(true)
  })
})

describe('calcGlaser — transmitancia U (resistencias en serie)', () => {
  it('muro hormigón simple 150mm (λ=2.5) → U ≈ 4.35', () => {
    // R = Rsi(0.13) + Rse(0.04) + 0.15/2.5(0.06) = 0.23 → U = 4.348
    const r = calcGlaser([{ lam: 2.5, esp: 0.15, mu: 130 }], 20, 5, 70, 'muro')
    expect(cerca(parseFloat(r.U), 4.3478, 0.01)).toBe(true)
  })

  it('muro HA 150mm + EPS 60mm (λ=0.04) → U ≈ 0.578', () => {
    // R = 0.13+0.04+0.06+1.5 = 1.73 → U = 0.578
    const r = calcGlaser(
      [{ lam: 2.5, esp: 0.15, mu: 130 }, { lam: 0.04, esp: 0.06, mu: 60 }],
      20, 5, 70, 'muro'
    )
    expect(cerca(parseFloat(r.U), 0.5780, 0.01)).toBe(true)
  })

  it('devuelve estructura completa de resultado', () => {
    const r = calcGlaser([{ lam: 0.04, esp: 0.10, mu: 60 }], 20, 10, 50, 'muro')
    expect(r).toHaveProperty('U')
    expect(r).toHaveProperty('temps')
    expect(r).toHaveProperty('ifaces')
    expect(r).toHaveProperty('Tdew')
    expect(typeof r.condInter).toBe('boolean')
    expect(Array.isArray(r.temps)).toBe(true)
  })
})

describe('calcGlaser — detección de condensación (Glaser)', () => {
  it('cubierta con PV-4 Zincalum exterior (μ=100000) → CONDENSA', () => {
    // Caso real validado en sesión: OSB | Lana | Yeso | PV-4 (int→ext).
    // El PV-4 (μ=100000) bloquea el vapor en la cara fría → condensación.
    const cv = [
      { lam: 0.23, esp: 0.020, mu: 200 },     // OSB
      { lam: 0.035, esp: 0.150, mu: 1 },      // Lana mineral
      { lam: 0.26, esp: 0.013, mu: 8 },       // Yeso cartón
      { lam: 50, esp: 0.0005, mu: 100000 },   // PV-4 Zincalum
    ]
    const r = calcGlaser(cv, 20, 1, 78, 'techumbre')   // zona E
    expect(r.condInter).toBe(true)
  })

  it('muro aislado vapor-abierto en clima templado → NO condensa', () => {
    // Yeso | Lana | Fibrocemento, μ moderados, condiciones suaves.
    const cv = [
      { lam: 0.26, esp: 0.013, mu: 8 },
      { lam: 0.035, esp: 0.100, mu: 1 },
      { lam: 0.23, esp: 0.006, mu: 50 },
    ]
    const r = calcGlaser(cv, 20, 10, 55, 'muro')
    expect(r.condInter).toBe(false)
  })
})

describe('calcU_ISO6946 — método combinado con puente térmico', () => {
  it('muro entramado madera (montante 38mm @ 600mm) → U ≈ 0.40', () => {
    // Yeso 13 | Lana 90 con montante madera | OSB 11.
    // R_T = (R_upper + R_lower)/2 ≈ 2.494 → U ≈ 0.401.
    const cv = [
      { lam: 0.26, esp: 0.013, mu: 8 },
      { lam: 0.035, esp: 0.090, mu: 1,
        estructura_integrada: { tipo: 'madera', lam: 0.13, ancho_mm: 38, distancia_mm: 600 } },
      { lam: 0.23, esp: 0.011, mu: 200 },
    ]
    const r = calcU_ISO6946(cv, 'muro')
    expect(cerca(parseFloat(r.U), 0.401, 0.015)).toBe(true)
    // R_T debe estar entre los límites superior e inferior (independiente del nombre)
    const rT = parseFloat(r.R_T)
    const lo = Math.min(parseFloat(r.R_upper), parseFloat(r.R_lower))
    const hi = Math.max(parseFloat(r.R_upper), parseFloat(r.R_lower))
    expect(rT).toBeGreaterThanOrEqual(lo - 1e-6)
    expect(rT).toBeLessThanOrEqual(hi + 1e-6)
    expect(r.method).toBe('iso6946')
  })

  it('sin estructura integrada → serie simple (upper = lower)', () => {
    const cv = [{ lam: 0.04, esp: 0.10, mu: 60 }]
    const r = calcU_ISO6946(cv, 'muro')
    expect(parseFloat(r.R_upper)).toBeCloseTo(parseFloat(r.R_lower), 4)
    expect(r.method).toBe('serie')
  })
})

describe('calcU_SC — U de soluciones constructivas del catálogo', () => {
  it('cubierta 1.1.G.M1.2 (Yeso+Lana150+OSB) → U ≈ 0.2192', () => {
    // Valor de referencia confirmado en la UI durante la sesión.
    const u = calcU_SC('1.1.G.M1.2', 'techumbre')
    expect(cerca(u, 0.2192, 0.001)).toBe(true)
  })

  it('código inexistente → null', () => {
    expect(calcU_SC('NO.EXISTE', 'muro')).toBe(null)
  })
})
