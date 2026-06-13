// ─────────────────────────────────────────────────────────────────────────────
// ds15_ventanas.test.js — Bloquea la Tabla 3 oficial + la lógica de verificación.
// Valores verificados contra el Diario Oficial 27-05-2024 (imagen oficial).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  UMBRALES_U_VENTANA, TABLA3_VENTANAS, maxVidriadoVentana, cumpleVentana,
} from '../data/ds15_ventanas.js'

describe('Tabla 3 — estructura', () => {
  it('12 brackets de U', () => {
    expect(UMBRALES_U_VENTANA).toEqual([0.6, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 5.8])
  })
  it('9 zonas × 4 orientaciones × 12 valores', () => {
    for (const z of ['A','B','C','D','E','F','G','H','I']) {
      for (const o of ['N','OP','S','OGT']) {
        expect(TABLA3_VENTANAS[z][o], `${z}/${o}`).toHaveLength(12)
      }
    }
  })
})

describe('Tabla 3 — valores oficiales (muestras verificadas)', () => {
  it('A Norte', () => expect(TABLA3_VENTANAS.A.N).toEqual([100,100,100,100,100,98,97,95,94,91,88,50]))
  it('A OGT', () => expect(TABLA3_VENTANAS.A.OGT).toEqual([54,53,52,51,50,49,48,46,44,42,40,25]))
  it('F Sur', () => expect(TABLA3_VENTANAS.F.S).toEqual([41,40,38,36,34,31,28,25,21,17,12,0]))
  it('I Norte', () => expect(TABLA3_VENTANAS.I.N).toEqual([75,73,70,67,64,61,57,52,46,39,30,0]))
  it('I O-P es idéntica a G O-P (quirk oficial)', () => {
    expect(TABLA3_VENTANAS.I.OP).toEqual(TABLA3_VENTANAS.G.OP)
  })
})

describe('maxVidriadoVentana — selección de bracket', () => {
  it('U=2.0 zona D Norte → bracket ≤2.0 (col 4) = 87%', () => {
    expect(maxVidriadoVentana('D', 2.0, 'N')).toBe(87)
  })
  it('U=2.3 cae en bracket ≤2.4 (col 5)', () => {
    expect(maxVidriadoVentana('D', 2.3, 'N')).toBe(85) // D N col5
  })
  it('U=0.5 cae en primer bracket ≤0.6', () => {
    expect(maxVidriadoVentana('A', 0.5, 'N')).toBe(100)
  })
  it('U>5.8 → 0% (no permitido)', () => {
    expect(maxVidriadoVentana('A', 6.0, 'N')).toBe(0)
  })
  it('zona/orientación inválida → null', () => {
    expect(maxVidriadoVentana('Z', 2, 'N')).toBe(null)
    expect(maxVidriadoVentana('A', 2, 'X')).toBe(null)
  })
})

describe('cumpleVentana', () => {
  it('cumple cuando %real ≤ máximo', () => {
    const r = cumpleVentana('D', 2.0, 'N', 50) // max 87
    expect(r.cumple).toBe(true); expect(r.maxPct).toBe(87); expect(r.margen).toBe(37)
  })
  it('no cumple cuando %real > máximo', () => {
    const r = cumpleVentana('F', 3.0, 'S', 30) // U=3.0 → bracket ≤3.2 (col7); F Sur=25
    expect(r.maxPct).toBe(25); expect(r.cumple).toBe(false)
  })
})
