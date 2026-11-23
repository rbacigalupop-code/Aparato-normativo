// ─────────────────────────────────────────────────────────────────────────────
// coherencia_resumen_modulos.test.js — fija "Resumen == módulos"
//
// El Resumen y los módulos (Fuego, Soluciones) deben derivar el estado de la MISMA
// función pura, o se contradicen (módulo CUMPLE / Resumen INCOMPLETO). Estos tests
// bloquean esa regresión: el RF y el tipo de piso salen de un selector único.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { rfSolucionPorElemento, rfEfectivo } from '../lib/compliance/fuego.js'
import { TIPO_PISO, inferirTipoPiso, tipoPisoEfectivo, tipoPisoInferido } from '../lib/compliance/piso.js'

describe('rfEfectivo — misma fuente que el Módulo 3 (manual || solución)', () => {
  it('cae a la RF de la solución aplicada cuando no hay override manual', () => {
    const termica = { muro: { solucion: { rf: 'F60' } } }
    expect(rfEfectivo(termica, 'estructura')).toBe('F60')
  })
  it('el override manual manda sobre la solución', () => {
    const termica = { rf_estructura: { rf: 'F120' }, muro: { solucion: { rf: 'F60' } } }
    expect(rfEfectivo(termica, 'estructura')).toBe('F120')
  })
  it('sin manual ni solución → vacío (sigue incompleto, NO se falsea cumplimiento)', () => {
    expect(rfEfectivo({}, 'estructura')).toBe('')
    expect(rfEfectivo(undefined, 'cubierta')).toBe('')
  })
  it('cubierta sale del techo; muros_sep del tabique o muro', () => {
    const t = { techo: { solucion: { rf: 'F30' } }, tabique: { solucion: { rf: 'F15' } } }
    expect(rfSolucionPorElemento(t)).toEqual({ estructura: 'F30', cubierta: 'F30', muros_sep: 'F15' })
  })
  it('estructura toma la primera con RF entre muro/techo/piso', () => {
    expect(rfSolucionPorElemento({ piso: { solucion: { rf: 'F60' } } }).estructura).toBe('F60')
  })
})

describe('tipoPisoEfectivo / inferirTipoPiso — clasificación desde la solución', () => {
  it('"piso ventilado sobre terreno" → VENTILADO (ventilado manda)', () => {
    expect(inferirTipoPiso({ desc: 'Viguería madera + membrana (piso ventilado sobre terreno)' })).toBe(TIPO_PISO.VENTILADO)
  })
  it('radier → SOBRE_TERRENO', () => {
    expect(inferirTipoPiso({ desc: 'Radier HA 100mm + EPS', obs: 'U por ISO 13370' })).toBe(TIPO_PISO.SOBRE_TERRENO)
  })
  it('sin señal clara → NO_DEFINIDO (no se adivina)', () => {
    expect(inferirTipoPiso({ desc: 'Losa H.A. 120mm + EPS inferior' })).toBe(TIPO_PISO.NO_DEFINIDO)
    expect(inferirTipoPiso(null)).toBe(TIPO_PISO.NO_DEFINIDO)
  })
  it('el override explícito de Diagnóstico manda sobre la inferencia', () => {
    const proy = { tipoPiso: 'SOBRE_TERRENO' }
    const termica = { piso: { solucion: { desc: 'piso ventilado' } } }
    expect(tipoPisoEfectivo(proy, termica)).toBe(TIPO_PISO.SOBRE_TERRENO)
    expect(tipoPisoInferido(proy, termica)).toBe(false)
  })
  it('sin override, infiere de la solución y marca inferido', () => {
    const proy = {}
    const termica = { piso: { solucion: { desc: 'piso ventilado sobre terreno' } } }
    expect(tipoPisoEfectivo(proy, termica)).toBe(TIPO_PISO.VENTILADO)
    expect(tipoPisoInferido(proy, termica)).toBe(true)
  })
  it('sin override ni solución inferible → NO_DEFINIDO (Piso U sigue sin clasificar)', () => {
    expect(tipoPisoEfectivo({}, {})).toBe(TIPO_PISO.NO_DEFINIDO)
    expect(tipoPisoInferido({}, {})).toBe(false)
  })
})
