// ─────────────────────────────────────────────────────────────────────────────
// lofc_cobertura.test.js — Blindaje de los 28 ítems Ed.17 recuperados (2026-07-24).
//
// El extractor lineal (scripts/extraer-lofc.js) descartaba en silencio 28 códigos
// cuya descripción arranca en la línea SUPERIOR al código (celda de tabla alta).
// Se recuperaron a mano con `pdftotext -layout -enc UTF-8` y se cablearon como
// ITEMS_RECUPERADOS_ED17 en el generador. Este test evita que se vuelvan a perder.
//
// Además garantiza que los 4 horizontales de madera (F.2/G.2) tengan el tag
// `madera` SIN `acero` — condición que scoreLOFC exige para que crucen
// (homologacion.js: primaryMatch madera = madera && !acero).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { LOFC, LOFC_TOTAL_ITEMS } from '../data/lofc.js'

const RECUPERADOS_ED17 = [
  'A.2.3.120.107', 'A.2.3.120.61', 'A.2.3.120.85', 'A.2.3.15.110', 'A.2.3.15.112',
  'A.2.3.15.113', 'A.2.3.15.114', 'A.2.3.15.134', 'A.2.3.150.15', 'A.2.3.30.150',
  'A.2.3.30.172', 'A.2.3.30.178', 'A.2.3.30.179', 'A.2.3.30.180', 'A.2.3.60.100',
  'A.2.3.60.101', 'A.2.3.60.142', 'A.2.3.60.99', 'A.2.3.90.54', 'A.2.3.90.55',
  'A.2.3.90.58', 'B.2.1.30.01', 'B.2.1.60.03', 'B.2.1.90.03', 'F.2.1.15.57',
  'F.2.1.15.58', 'G.2.1.15.10', 'G.2.1.15.11',
]

// Horizontales de madera: sin estos tags no cruzan desde una solución de madera.
const CRUCE_MADERA = ['F.2.1.15.57', 'F.2.1.15.58', 'G.2.1.15.10', 'G.2.1.15.11']

describe('LOFC Ed.17 — cobertura completa 303/303', () => {
  it('el listado carga los 303 códigos oficiales', () => {
    expect(Object.keys(LOFC).length).toBe(303)
    expect(LOFC_TOTAL_ITEMS).toBe(303)
  })

  it('sin claves duplicadas', () => {
    const keys = Object.keys(LOFC)
    expect(keys.length).toBe(new Set(keys).size)
  })

  it('los 28 ítems recuperados están presentes y bien formados', () => {
    for (const cod of RECUPERADOS_ED17) {
      const it = LOFC[cod]
      expect(it, `falta ${cod}`).toBeTruthy()
      expect(it.codigo).toBe(cod)
      expect(it.rf_minutos).toBeGreaterThan(0)
      expect(it.descripcion.length).toBeGreaterThan(10)
    }
  })

  it('los horizontales de madera F.2/G.2 tienen tag madera SIN acero (condición de cruce)', () => {
    for (const cod of CRUCE_MADERA) {
      const mats = LOFC[cod].materiales
      expect(mats, `${cod} sin madera`).toContain('madera')
      expect(mats, `${cod} contamina acero`).not.toContain('acero')
    }
  })
})
