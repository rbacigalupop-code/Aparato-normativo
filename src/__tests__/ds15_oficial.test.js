// ─────────────────────────────────────────────────────────────────────────────
// ds15_oficial.test.js — Bloquea las exigencias del DS N°15 contra la fuente.
//
// Valores verificados contra la Tabla 1 oficial del decreto que modifica la
// OGUC 4.1.10, publicado en el Diario Oficial el 27-05-2024 (CVE 2494861),
// vigente desde 28-11-2025. Extraída por coordenadas (scripts/pdf-tabla.mjs) y
// confirmada visualmente.
//
// Si alguien cambia un U-max de zona, este test falla y obliga a re-verificar
// contra el decreto. Atrapó: B piso 0.87→0.70 y puertas F-I 2.0→1.70.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { ZONAS, PUERTA_U } from '../data.js'
import { UMAX_PUERTA_DS15 } from '../data/puertas_detalladas.js'

// Tabla 1 oficial — U-max (W/m²K): [techo, muro, piso ventilado]
const OFICIAL = {
  A: [0.84, 2.10, 3.60],
  B: [0.47, 0.80, 0.70],
  C: [0.47, 0.80, 0.87],
  D: [0.38, 0.80, 0.60],
  E: [0.33, 0.60, 0.60],
  F: [0.28, 0.45, 0.50],
  G: [0.28, 0.40, 0.39],
  H: [0.25, 0.30, 0.32],
  I: [0.25, 0.35, 0.35],
}
// Puertas opacas — U-max 1.70 uniforme B-I; zona A sin exigencia.
const PUERTA_OFICIAL = { A: null, B: 1.7, C: 1.7, D: 1.7, E: 1.7, F: 1.7, G: 1.7, H: 1.7, I: 1.7 }

describe('DS N°15 Tabla 1 — techo/muro/piso por zona', () => {
  for (const [z, [techo, muro, piso]] of Object.entries(OFICIAL)) {
    it(`zona ${z}: techo ${techo} · muro ${muro} · piso ${piso}`, () => {
      expect(ZONAS[z].techo).toBe(techo)
      expect(ZONAS[z].muro).toBe(muro)
      expect(ZONAS[z].piso).toBe(piso)
    })
  }
})

describe('DS N°15 Tabla 1 — puertas opacas (1.70 uniforme B-I)', () => {
  for (const [z, u] of Object.entries(PUERTA_OFICIAL)) {
    it(`zona ${z}: puerta U-max ${u}`, () => {
      expect(PUERTA_U[z]).toBe(u)
    })
  }
  it('módulo Puertas detallado usa el mismo U-max (no el de ventanas)', () => {
    for (const z of ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']) {
      expect(UMAX_PUERTA_DS15[z], `puerta zona ${z} debe ser 1.7`).toBe(1.7)
    }
  })
})

describe('La norma NO es monótona (no asumir orden A→I)', () => {
  it('zona H (cordillera) más exigente que I (austral) en muro y piso', () => {
    expect(ZONAS.H.muro).toBeLessThan(ZONAS.I.muro)  // 0.30 < 0.35
    expect(ZONAS.H.piso).toBeLessThan(ZONAS.I.piso)  // 0.32 < 0.35
  })
})
