// ─────────────────────────────────────────────────────────────────────────────
// cruce_normativo.test.js — Honestidad y trazabilidad del catálogo SC.
//
// Dos garantías:
//  1. El motor de homologación NUNCA rotula como "LOSCAT" una solución que no
//     cita un código LOSCAT real (auditoría 2026-06-12: el motor etiquetaba
//     TODA solución como "LOSCAT Ed.13 2025", incluidas las calculadas).
//  2. Ratchet de trazabilidad: toda solución debe citar un listado oficial
//     (LOSCAT/LOFC/LOSCAA) o declarar su método (ISO 6946, NCh853, EN 10077,
//     ensayo, fabricante…). Las sin marca no pueden CRECER — baseline abajo.
//
// Informe completo: node scripts/auditar-cruce-normativo.mjs
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { SC } from '../data.js'
import { homologarSolucion } from '../lib/engines/homologacion.js'

// Mantener en sincronía con scripts/auditar-cruce-normativo.mjs
const citaLOSCAT = (s) => /LOSCAT\s*[0-9]|\(LOSCAT/i.test(`${s.desc || ''} ${s.obs || ''}`)
const tieneMarca = (s) => citaLOSCAT(s) ||
  /ISO\s*6946|ISO\s*13370|NCh\s*853|EN\s*(ISO\s*)?10077|LOFC|LOSCAA|calculad|estimad|ley de masa|fabricante|referencial|ensayo/i
    .test(`${s.desc || ''} ${s.obs || ''}`)

// Baseline 2026-06-12: 86 soluciones sin marca de origen (de 123).
// Este número SOLO puede bajar. Meta: 0. Si agregas una solución nueva,
// declara su origen en obs (cita oficial o método de cálculo).
const BASELINE_SIN_MARCA = 86

describe('Honestidad del motor de homologación', () => {
  it('con cita LOSCAT → térmico oficial, fuente LOSCAT', () => {
    const conCita = SC.find(citaLOSCAT)
    expect(conCita).toBeTruthy()
    const h = homologarSolucion(conCita)
    expect(h.termico.oficial).toBe(true)
    expect(h.termico.codigo).toBe(`LOSCAT ${conCita.cod}`)
    expect(h.termico.fuente).toMatch(/LOSCAT/)
  })

  it('sin cita LOSCAT → térmico NO oficial y lo declara', () => {
    const sinCita = SC.find(s => !citaLOSCAT(s))
    expect(sinCita).toBeTruthy()
    const h = homologarSolucion(sinCita)
    expect(h.termico.oficial).toBe(false)
    expect(h.termico.codigo).not.toMatch(/^LOSCAT/)
    expect(h.termico.fuente).toMatch(/no es ítem LOSCAT/i)
  })

  it('ninguna solución sin cita se presenta con código "LOSCAT ..."', () => {
    for (const s of SC.filter(x => !citaLOSCAT(x))) {
      const h = homologarSolucion(s)
      expect(h.termico.oficial, `${s.cod} sin cita no puede ser oficial`).toBe(false)
    }
  })
})

describe('Ratchet de trazabilidad del catálogo', () => {
  it(`soluciones sin marca de origen ≤ ${BASELINE_SIN_MARCA} (solo puede bajar)`, () => {
    const sinMarca = SC.filter(s => !tieneMarca(s))
    if (sinMarca.length > BASELINE_SIN_MARCA) {
      const nuevos = sinMarca.map(s => s.cod).join(', ')
      throw new Error(
        `Hay ${sinMarca.length} soluciones sin marca de origen (baseline ${BASELINE_SIN_MARCA}). ` +
        `Toda solución nueva debe citar un listado oficial o declarar su método en obs. Revisar: ${nuevos}`
      )
    }
    expect(sinMarca.length).toBeLessThanOrEqual(BASELINE_SIN_MARCA)
  })

  it('todas las soluciones tienen cod único y U numérico válido', () => {
    const cods = SC.map(s => s.cod)
    expect(new Set(cods).size).toBe(cods.length)
    for (const s of SC) {
      expect(typeof s.u, `${s.cod} U debe ser número`).toBe('number')
      expect(s.u, `${s.cod} U fuera de rango plausible`).toBeGreaterThan(0)
      expect(s.u, `${s.cod} U fuera de rango plausible`).toBeLessThan(8)
    }
  })
})
