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
const fibro   = { mat: 'Fibrocemento',             lam: 0.23,  esp: 8,   mu: 50 }
const ha      = { mat: 'Hormigon armado',          lam: 2.50,  esp: 150, mu: 130 }   // capa másica

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

describe('alertasSentidoConstructivo — entramado ligero sin barrera en zona fría', () => {
  const tipos = (capas, zona) => alertasSentidoConstructivo(capas, 'muro', { zona }).map(a => a.tipo)

  it('entramado ligero sin barrera en zona D (fría, umbral) → avisa', () => {
    expect(tipos([yeso, lana, osb, fibro], 'D')).toContain('entramado_sin_barrera_zona_fria')
  })

  it('mismo entramado en zona B/C (templada, bajo el umbral) → no avisa', () => {
    expect(tipos([yeso, lana, osb, fibro], 'B')).not.toContain('entramado_sin_barrera_zona_fria')
    expect(tipos([yeso, lana, osb, fibro], 'C')).not.toContain('entramado_sin_barrera_zona_fria')
  })

  it('muro MÁSICO (hormigón) en zona F → no avisa (no es entramado ligero)', () => {
    expect(tipos([yeso, ha, lana, fibro], 'F')).not.toContain('entramado_sin_barrera_zona_fria')
  })

  it('entramado CON barrera de vapor al interior en zona F → no avisa', () => {
    expect(tipos([yeso, barrera, lana, osb, fibro], 'F')).toEqual([])
  })

  it('sin zona (opts vacío) → no evalúa esta regla', () => {
    expect(alertasSentidoConstructivo([yeso, lana, osb, fibro], 'muro'))
      .not.toContainEqual(expect.objectContaining({ tipo: 'entramado_sin_barrera_zona_fria' }))
  })
})

describe('regresión: barrera de vapor SIN espesor se clasifica por μ, no por sd', () => {
  // Caso real (imagen): muro metalcon zona F bien resuelto —
  // yeso | BARRERA DE VAPOR (sin espesor cargado, sd=0) | lana | cámara | OSB |
  // membrana transpirable | zincalum. Antes: la BV (sd=0) se confundía con
  // "transpirable" y además no se reconocía como barrera → 2 falsos positivos.
  const bvSinEsp = { mat: 'Barrera de vapor (polietileno 0,2mm)', lam: 0.50, esp: 0, mu: 100000 } // sd=0
  const zinc2    = { mat: 'PV-4 / PV-5 Zincalum', lam: 50, esp: 0.5, mu: 100000 }
  const muroReal = [yeso, bvSinEsp, lana, camara, osb, tyvek, zinc2]

  it('la BV sin espesor NO se marca como transpirable en la cara caliente', () => {
    const tipos = alertasSentidoConstructivo(muroReal, 'muro', { zona: 'F' }).map(a => a.tipo)
    expect(tipos).not.toContain('transpirable_cara_caliente')
  })

  it('la BV sin espesor SÍ cuenta como barrera al interior (no dispara "entramado sin barrera")', () => {
    const tipos = alertasSentidoConstructivo(muroReal, 'muro', { zona: 'F' }).map(a => a.tipo)
    expect(tipos).not.toContain('entramado_sin_barrera_zona_fria')
  })

  it('el único aviso correcto es que la BV no tiene espesor cargado (dato faltante)', () => {
    const tipos = alertasSentidoConstructivo(muroReal, 'muro', { zona: 'F' }).map(a => a.tipo)
    expect(tipos).toEqual(['barrera_sin_espesor'])
  })

  it('con el espesor de la BV cargado (0,2 mm) el muro no genera ningún aviso', () => {
    const bvConEsp = { mat: 'Barrera de vapor (polietileno 0,2mm)', lam: 0.50, esp: 0.2, mu: 100000 }
    const muroOk = [yeso, bvConEsp, lana, camara, osb, tyvek, zinc2]
    expect(alertasSentidoConstructivo(muroOk, 'muro', { zona: 'F' })).toEqual([])
  })
})
