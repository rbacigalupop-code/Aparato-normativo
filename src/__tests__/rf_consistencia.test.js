// ─────────────────────────────────────────────────────────────────────────────
// rf_consistencia.test.js — Una sola fuente de verdad para la RF requerida.
//
// Bloquea el contrato de RF_ELEM_REQ (data.js), usada por Soluciones, Térmica,
// Resultados e Informe. Habría atrapado el bug 2026-06-11: Térmica y Resultados
// exigían al muro de envolvente la RF de muros divisorios (muros_sep → F60 en
// Vivienda) mientras el catálogo/asistente exigía RF_PISOS (F30) → una solución
// marcada "cumple los 3 criterios" salía NO CUMPLE al aplicarla en Térmica.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { RF_ELEM_REQ, RF_PISOS, RF_DEF, PUERTA_RF } from '../data.js'

const USOS = ['Vivienda', 'Educacion', 'Salud', 'Oficina', 'Comercio', 'Industrial']
const PISOS = ['1', '2', '3', '4', '5', '6', '8']
const ZONAS_RF = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

describe('RF_ELEM_REQ — fuente única de RF requerida por elemento', () => {
  it('muro (perimetral portante) usa RF_PISOS — col (2) OGUC, NO muros_sep', () => {
    for (const uso of USOS) for (const p of PISOS) {
      expect(RF_ELEM_REQ('muro', uso, p)).toBe(RF_PISOS(uso, p))
    }
  })

  it('regresión 2026-06-11: muro Vivienda 2 pisos exige F30 (no F60 de muros_sep)', () => {
    expect(RF_ELEM_REQ('muro', 'Vivienda', '2')).toBe('F30')
    // El valor que se filtraba a Térmica/Resultados y producía el falso NO CUMPLE:
    expect(RF_DEF.Vivienda.muros_sep).toBe('F60')
  })

  it('piso (entrepiso soportante) usa RF_PISOS — col (8) OGUC', () => {
    for (const uso of USOS) for (const p of PISOS) {
      expect(RF_ELEM_REQ('piso', uso, p)).toBe(RF_PISOS(uso, p))
    }
  })

  it('techo y techumbre son alias y usan RF_DEF.cubierta — col (7)', () => {
    for (const uso of USOS) {
      expect(RF_ELEM_REQ('techo', uso, '2')).toBe(RF_DEF[uso].cubierta)
      expect(RF_ELEM_REQ('techumbre', uso, '2')).toBe(RF_ELEM_REQ('techo', uso, '2'))
    }
  })

  it('tabique usa RF_DEF.muros_sep — separación entre unidades, col (3)/(5)', () => {
    for (const uso of USOS) {
      expect(RF_ELEM_REQ('tabique', uso, '2')).toBe(RF_DEF[uso].muros_sep)
    }
  })

  it('puerta exterior usa PUERTA_RF por zona (módulo puertas), no muros_sep', () => {
    for (const z of ZONAS_RF) {
      expect(RF_ELEM_REQ('puerta', 'Vivienda', '2', z)).toBe(PUERTA_RF[z] || '')
    }
    // Sin zona → sin exigencia (no hereda muros_sep)
    expect(RF_ELEM_REQ('puerta', 'Vivienda', '2')).toBe('')
  })

  it('ventana y elementos desconocidos → sin exigencia RF', () => {
    expect(RF_ELEM_REQ('ventana', 'Vivienda', '2', 'F')).toBe('')
    expect(RF_ELEM_REQ('otro', 'Vivienda', '2')).toBe('')
  })
})
