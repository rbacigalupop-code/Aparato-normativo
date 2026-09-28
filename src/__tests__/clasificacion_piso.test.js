// ─────────────────────────────────────────────────────────────────────────────
// clasificacion_piso.test.js — clasificación del piso (PROMPT 5)
//
// No se aplica automáticamente el límite de piso ventilado: la clasificación es
// un dato del proyecto y, sin ella, el piso queda NO_VERIFICADO.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { TIPO_PISO, normalizarTipoPiso, reglaPiso } from '../lib/compliance/piso.js'

describe('normalizarTipoPiso', () => {
  it('mapea claves legacy del panel Cálculo U', () => {
    expect(normalizarTipoPiso('ventilado')).toBe(TIPO_PISO.VENTILADO)
    expect(normalizarTipoPiso('terreno')).toBe(TIPO_PISO.SOBRE_TERRENO)
    expect(normalizarTipoPiso('no_calef')).toBe(TIPO_PISO.NO_CALEF)
  })
  it('acepta el enum directo', () => {
    expect(normalizarTipoPiso('SOBRE_TERRENO')).toBe(TIPO_PISO.SOBRE_TERRENO)
    expect(normalizarTipoPiso(TIPO_PISO.VENTILADO)).toBe(TIPO_PISO.VENTILADO)
  })
  it('vacío / desconocido → NO_DEFINIDO', () => {
    expect(normalizarTipoPiso('')).toBe(TIPO_PISO.NO_DEFINIDO)
    expect(normalizarTipoPiso(undefined)).toBe(TIPO_PISO.NO_DEFINIDO)
    expect(normalizarTipoPiso(null)).toBe(TIPO_PISO.NO_DEFINIDO)
  })
})

describe('reglaPiso — no asume ventilado', () => {
  it('sin clasificar → requiere clasificar, no aplica Umáx (→ NO_VERIFICADO)', () => {
    const r = reglaPiso(undefined)
    expect(r.tipo).toBe(TIPO_PISO.NO_DEFINIDO)
    expect(r.requiereClasificar).toBe(true)
    expect(r.aplicaUmax).toBe(false)
  })
  it('ventilado → aplica Umáx de piso ventilado', () => {
    const r = reglaPiso('ventilado')
    expect(r.requiereClasificar).toBe(false)
    expect(r.aplicaUmax).toBe(true)
    expect(r.label).toMatch(/ventilado/i)
  })
  it('sobre terreno → aplica pero con criterio distinto (ISO 13370), etiquetado', () => {
    const r = reglaPiso('terreno')
    expect(r.requiereClasificar).toBe(false)
    expect(r.label).toMatch(/terreno/i)
    expect(r.nota).toMatch(/13370/)
  })
  it('sobre espacio no calefaccionado → aplica, sin corrección ISO 13370', () => {
    const r = reglaPiso('no_calef')
    expect(r.requiereClasificar).toBe(false)
    expect(r.aplicaUmax).toBe(true)
  })
})
