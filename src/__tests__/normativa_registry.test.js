// ─────────────────────────────────────────────────────────────────────────────
// normativa_registry.test.js — registro normativo central (PROMPT 4)
//
// La edición y la vigencia son datos del sistema; la regla 1.6 del Listado
// (fichas vencidas no acreditan el Art. 4.1.10) se evalúa por fecha.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  NORMAS, EDICION_LOSCAT, LISTADO_LOSCAT, ESTADO_NORMA,
  vigenciaDeFicha, validarVigenciaFicha, obtenerEdicionVigente,
} from '../data/normativa/registry.js'

describe('edición vigente LOSCAT', () => {
  it('la edición vigente es E14 (2026), Res. Ex. 1403', () => {
    const e = obtenerEdicionVigente('LOSCAT')
    expect(e.edicion).toBe(14)
    expect(e.anio).toBe(2026)
    expect(e.resolucion).toContain('1403')
    expect(e.fechaResolucion).toBe('2026-04-20')
    expect(e.estado).toBe(ESTADO_NORMA.VIGENTE)
  })
  it('las etiquetas salen del registro (no strings a mano)', () => {
    expect(EDICION_LOSCAT).toBe('Ed.14')
    expect(LISTADO_LOSCAT).toBe('LOSCAT Ed.14 2026')
  })
  it('la Ed.13 quedó como histórica', () => {
    expect(NORMAS.LOSCAT.edicionAnterior.edicion).toBe(13)
    expect(NORMAS.LOSCAT.edicionAnterior.estado).toBe(ESTADO_NORMA.HISTORICO)
  })
})

describe('vigencia por ficha (regla 1.6)', () => {
  it('ficha común: default DICIEMBRE 2026', () => {
    expect(vigenciaDeFicha('1.2.G.C1.3')).toBe('2026-12-31')
  })
  it('excepciones: ladrillo Santiago → MAYO 2029; R100 → ABRIL 2031', () => {
    expect(vigenciaDeFicha('1.2.M.B7')).toBe('2029-05-31')
    expect(vigenciaDeFicha('R100/LV.2.3')).toBe('2031-04-30')
  })
  it('ficha vigente a una fecha anterior a su vencimiento', () => {
    const r = validarVigenciaFicha('1.2.G.C1.3', '2026-09-28')
    expect(r.vigente).toBe(true)
    expect(r.vence).toBe('2026-12-31')
    expect(r.estado).toBe(ESTADO_NORMA.VIGENTE)
  })
  it('ficha VENCIDA a una fecha posterior → no acredita (motivo explícito)', () => {
    const r = validarVigenciaFicha('1.2.G.C1.3', '2027-01-15')
    expect(r.vigente).toBe(false)
    expect(r.estado).toBe(ESTADO_NORMA.HISTORICO)
    expect(r.motivo).toContain('4.1.10')
  })
  it('en el límite exacto de la fecha de vigencia sigue vigente', () => {
    expect(validarVigenciaFicha('1.2.G.C1.3', '2026-12-31').vigente).toBe(true)
    expect(validarVigenciaFicha('1.2.G.C1.3', '2027-01-01').vigente).toBe(false)
  })
})
