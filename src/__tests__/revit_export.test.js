// ─────────────────────────────────────────────────────────────────────────────
// revit_export.test.js — Contrato del exportador Talora → RevitMind.
//
// Verifica: inversión de capas (int→ext ⇒ ext→int), cámara de aire, mapeo de
// elemento, derivación de funcion, U consistente con las capas efectivas, y el
// criterio {U, RF, Rw}. Las capas se proveen vía calcUInit para no depender del
// catálogo real (SC_CAPAS/BH).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { exportarSistemasRevit, funcionCapa } from '../lib/engines/revit-export.js'

const proy = { nombre: 'Casa Demo', zona: 'D' }

const termica = {
  // U aplicado (string) distinto del res.U → prueba la prioridad de fuente
  muro:  { u: '0.45', solucion: { cod: 'M1', desc: 'Muro hormigón + EPS',  rf: 'F30', ac_rw: 45,   u: 0.50 } },
  techo: { u: '0.33', solucion: { cod: 'T1', desc: 'Cubierta zinc + LV',   rf: 'F15', ac_rw: null, u: 0.40 } },
}

const calcUInit = {
  muro: {
    solucion: { cod: 'M1' },
    res: { U: 0.42 },                         // U consistente con estas capas
    capas: [                                  // INTERIOR → EXTERIOR
      { mat: 'Yeso-cartón',    lam: '0.25',  esp: '15',  mu: '10', esCamara: false },
      { mat: 'EPS',            lam: '0.038', esp: '80',  mu: '30', esCamara: false },
      { mat: 'Hormigón armado', lam: '1.63', esp: '150', mu: '80', esCamara: false },
    ],
  },
  techo: {
    solucion: { cod: 'T1' },
    res: { U: 0.30 },
    capas: [                                  // INTERIOR → EXTERIOR
      { mat: 'Yeso-cartón',    lam: '0.25',  esp: '10',  mu: '10', esCamara: false },
      { esCamara: true, esp: '50' },
      { mat: 'Lana de vidrio', lam: '0.042', esp: '100', mu: '1',  esCamara: false },
      { mat: 'Zincalum',       lam: '50',    esp: '0.5', mu: '1',  esCamara: false },
    ],
  },
}

describe('exportarSistemasRevit', () => {
  it('exporta 2 sistemas (muro + techo) con metadatos del proyecto', () => {
    const p = exportarSistemasRevit(proy, termica, calcUInit)
    expect(p.sistemas).toHaveLength(2)
    expect(p.proyecto).toBe('Casa Demo')
    expect(p.zona_termica).toBe('D')
    expect(p.generado).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('muro → wall; capas invertidas a EXTERIOR → INTERIOR; espesor en mm', () => {
    const p = exportarSistemasRevit(proy, termica, calcUInit)
    const muro = p.sistemas.find(s => s.id === 'M1')
    expect(muro.elemento).toBe('wall')
    // int→ext era [Yeso, EPS, Hormigón] ⇒ ext→int debe ser [Hormigón, EPS, Yeso]
    expect(muro.capas_ext_a_int.map(c => c.material))
      .toEqual(['Hormigón armado', 'EPS', 'Yeso-cartón'])
    expect(muro.capas_ext_a_int[0].espesor_mm).toBe(150)
    expect(muro.capas_ext_a_int.map(c => c.funcion))
      .toEqual(['structure', 'insulation', 'finish'])
  })

  it('U = res.U (consistente con las capas), no termica.u ni sc.u; criterio {U,RF,Rw}', () => {
    const p = exportarSistemasRevit(proy, termica, calcUInit)
    const muro = p.sistemas.find(s => s.id === 'M1')
    expect(muro.criterio.U).toBe(0.42)   // no 0.45 (termica.u) ni 0.50 (sc.u)
    expect(muro.criterio.RF).toBe('F30')
    expect(muro.criterio.Rw).toBe(45)
  })

  it('techo → roof; cámara de aire ⇒ { material:"Aire", funcion:"air", lambda:null }', () => {
    const p = exportarSistemasRevit(proy, termica, calcUInit)
    const techo = p.sistemas.find(s => s.id === 'T1')
    expect(techo.elemento).toBe('roof')
    const aire = techo.capas_ext_a_int.find(c => c.funcion === 'air')
    expect(aire).toBeTruthy()
    expect(aire.material).toBe('Aire')
    expect(aire.lambda).toBeNull()
    expect(techo.criterio.Rw).toBeNull()  // ac_rw null ⇒ null
  })

  it('sin soluciones aplicadas ⇒ sistemas vacío', () => {
    const p = exportarSistemasRevit({ nombre: 'X', zona: 'C' }, {}, {})
    expect(p.sistemas).toHaveLength(0)
  })
})

describe('funcionCapa', () => {
  it('cámara → air', () => expect(funcionCapa({ esCamara: true })).toBe('air'))
  it('λ ≤ 0.06 → insulation', () => expect(funcionCapa({ mat: 'EPS', lam: '0.038' })).toBe('insulation'))
  it('estructural → structure', () => expect(funcionCapa({ mat: 'Hormigón armado', lam: '1.63' })).toBe('structure'))
  it('membrana/barrera → membrane', () => expect(funcionCapa({ mat: 'Barrera de vapor', lam: '0.5' })).toBe('membrane'))
  it('resto → finish', () => expect(funcionCapa({ mat: 'Yeso-cartón', lam: '0.25' })).toBe('finish'))
})
