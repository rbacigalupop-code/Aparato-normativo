// ─────────────────────────────────────────────────────────────────────────────
// sentido_vapor.test.js — Alerta "barrera de vapor en la cara fría".
//
// Regla: la barrera de vapor (sd alto) va en la cara interior/caliente. Si queda
// en la cara exterior/fría del aislante (sin barrera equivalente al interior) →
// aviso de condensación intersticial. Advisory, complementa el Glaser.
// capas en orden INTERIOR → EXTERIOR. Solo muro/techumbre.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { alertaSentidoVapor, alertasSentidoConstructivo } from '../lib/engines/capas.js'

const yeso    = { mat: 'Yeso carton',              lam: 0.26,  esp: 13,  mu: 8 }
const barrera = { mat: 'Barrera vapor',            lam: 0.50,  esp: 0.2, mu: 100000 } // sd≈20 · membrana
const lana    = { mat: 'Lana mineral 30kg',        lam: 0.035, esp: 100, mu: 1 }       // aislante
const osb     = { mat: 'OSB/MDF',                  lam: 0.23,  esp: 18,  mu: 200 }     // sd≈3,6 · no barrera
const eifs    = { mat: 'EIFS (Sistema ETICS)',     lam: 0.87,  esp: 40,  mu: 25 }
const zinc    = { mat: 'PV-4 / PV-5 Zincalum',     lam: 50,    esp: 0.5, mu: 100000 }  // sd≈50 · barrera por sd
const camara  = { esCamara: true, esp: 30 }
const tyvek   = { mat: 'Membrana transpirable agua-viento (tipo Tyvek HomeWrap)', lam: 0.20, esp: 0.5, mu: 50 } // sd≈0,025 · transpirable

describe('alertaSentidoVapor', () => {
  it('barrera de vapor en la cara EXTERIOR del aislante → avisa', () => {
    const a = alertaSentidoVapor([yeso, lana, osb, barrera, eifs], 'muro')
    expect(a).toBeTruthy()
    expect(a.tipo).toBe('barrera_vapor_cara_fria')
    expect(a.capa).toMatch(/barrera vapor/i)
    expect(a.sd).toBeGreaterThan(10)
  })

  it('barrera de vapor en la cara INTERIOR (correcto) → no avisa', () => {
    expect(alertaSentidoVapor([yeso, barrera, lana, osb, eifs], 'muro')).toBeNull()
  })

  it('capa impermeable exterior tras una cámara ventilada → no avisa (viene venteada)', () => {
    expect(alertaSentidoVapor([yeso, lana, camara, zinc], 'muro')).toBeNull()
  })

  it('sin aislante identificable → la regla no aplica', () => {
    const ha = { mat: 'Hormigon armado', lam: 2.5, esp: 150, mu: 130 }
    expect(alertaSentidoVapor([ha, barrera], 'muro')).toBeNull()
  })

  it('techumbre también se evalúa', () => {
    expect(alertaSentidoVapor([yeso, lana, osb, barrera, eifs], 'techumbre')).toBeTruthy()
  })

  it('piso NO se evalúa (orden de capas no normalizado)', () => {
    expect(alertaSentidoVapor([yeso, lana, osb, barrera, eifs], 'piso')).toBeNull()
  })
})

describe('alertasSentidoConstructivo — avisos adicionales', () => {
  const tipos = (capas, el = 'muro') => alertasSentidoConstructivo(capas, el).map(a => a.tipo)

  it('membrana transpirable en la cara INTERIOR → avisa (va en la exterior)', () => {
    expect(tipos([tyvek, lana, osb, eifs])).toContain('transpirable_cara_caliente')
  })

  it('aislante entre DOS barreras de vapor → avisa "doble_barrera_vapor" (y no la de cara fría)', () => {
    const t = tipos([yeso, barrera, lana, zinc])
    expect(t).toContain('doble_barrera_vapor')
    expect(t).not.toContain('barrera_vapor_cara_fria')
  })

  it('la barrera solo al interior (correcto) → sin avisos', () => {
    expect(alertasSentidoConstructivo([yeso, barrera, lana, osb, eifs], 'muro')).toEqual([])
  })

  it('devuelve un array (agregador) y el wrapper puntual sigue funcionando', () => {
    expect(Array.isArray(alertasSentidoConstructivo([yeso, lana, barrera], 'muro'))).toBe(true)
    expect(alertaSentidoVapor([yeso, lana, barrera], 'muro').tipo).toBe('barrera_vapor_cara_fria')
  })
})
