// ─────────────────────────────────────────────────────────────────────────────
// revit_import.test.js — Round-trip de la vía de retorno Talora ⇄ Revit.
//
// Verifica que procesarEntradaRevit():
//   · conserva la identidad por revit_uid (nunca por nombre),
//   · agrupa vanos por cara y calcula % vidriado (puertas NO suman),
//   · usa PEOR CASO de U por cara para el límite de % vidriado,
//   · aplica la regla de puertas (U ≤ 1.70 opaco) por separado,
//   · emite el veredicto global OGT.
//
// Escenario (zona E), valores contra Tabla 3 oficial (ds15_ventanas.js):
//   cara N  (20 m²): 2 ventanas U=2.0, 3 m² c/u  → 30% vidriado · límite N@2.0=83 → CUMPLE
//   cara S  (10 m²): 1 ventana  U=3.2, 6 m²        → 60% vidriado · límite S@3.2=35 → NO CUMPLE
//   cara E  (10 m²): 1 ventana  U=1.2, 2 m² (OP)   → 20% vidriado · límite OP@1.2=60 → CUMPLE
//                    + 1 puerta U=1.5, 1.8 m²      → PUERTA_U[E]=1.7 → CUMPLE
//   OGT: Σvent 14 m² / Σcaras 40 m² = 35% · U peor 3.2 · OGT@3.2=28 → NO CUMPLE
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  procesarEntradaRevit,
  normalizarZona,
  normalizarOrientacion,
  maxUVentanaParaPct,
  orientacionDesdeAzimut,
} from '../lib/engines/revit-import.js'

const ENTRADA = {
  proyecto: { comuna: 'Quillón', zona_termica: 'E' },
  caras: [
    { revit_uid: 'cara-N', orientacion: 'N', area_m2: 20, muro_uid: 'm-N' },
    { revit_uid: 'cara-S', orientacion: 'S', area_m2: 10, muro_uid: 'm-S' },
    { revit_uid: 'cara-E', orientacion: 'E', area_m2: 10, muro_uid: 'm-E' },
  ],
  vanos: [
    { revit_uid: 'v1', tipo: 'ventana', area_m2: 3, cara_uid: 'cara-N', ancho_m: 1.5, alto_m: 2, U_actual: 2.0 },
    { revit_uid: 'v2', tipo: 'ventana', area_m2: 3, cara_uid: 'cara-N', ancho_m: 1.5, alto_m: 2, U_actual: 2.0 },
    { revit_uid: 'v3', tipo: 'ventana', area_m2: 6, cara_uid: 'cara-S', ancho_m: 2, alto_m: 3, U_actual: 3.2 },
    { revit_uid: 'v4', tipo: 'ventana', area_m2: 2, cara_uid: 'cara-E', ancho_m: 1, alto_m: 2, U_actual: 1.2 },
    { revit_uid: 'p1', tipo: 'puerta', area_m2: 1.8, cara_uid: 'cara-E', ancho_m: 0.9, alto_m: 2, U_actual: 1.5 },
  ],
}

describe('revit-import — helpers de normalización', () => {
  it('zona acepta letra y número (1→A … 9→I)', () => {
    expect(normalizarZona('E')).toBe('E')
    expect(normalizarZona('e')).toBe('E')
    expect(normalizarZona(5)).toBe('E')
    expect(normalizarZona('5')).toBe('E')
    expect(normalizarZona('Z')).toBeNull()
    expect(normalizarZona(null)).toBeNull()
  })
  it('orientación mapea E/O/W → OP (Oriente-Poniente)', () => {
    expect(normalizarOrientacion('N')).toBe('N')
    expect(normalizarOrientacion('S')).toBe('S')
    expect(normalizarOrientacion('E')).toBe('OP')
    expect(normalizarOrientacion('O')).toBe('OP')
    expect(normalizarOrientacion('W')).toBe('OP')
    expect(normalizarOrientacion('xx')).toBeNull()
  })
  it('orientacionDesdeAzimut clasifica por Tabla 4 (centros de sector)', () => {
    expect(orientacionDesdeAzimut(0)).toBe('N')     // norte
    expect(orientacionDesdeAzimut(360)).toBe('N')   // norte (wrap)
    expect(orientacionDesdeAzimut(90)).toBe('OP')   // oriente → OP
    expect(orientacionDesdeAzimut(180)).toBe('S')   // sur
    expect(orientacionDesdeAzimut(270)).toBe('OP')  // poniente → OP
    expect(orientacionDesdeAzimut(-90)).toBe('OP')  // -90 → 270 → poniente
    expect(orientacionDesdeAzimut(null)).toBeNull()
    expect(orientacionDesdeAzimut('abc')).toBeNull()
  })

  it('orientacionDesdeAzimut: bordes al sector MÁS restrictivo (45/135/225/315)', () => {
    // Justo antes/después de cada límite:
    expect(orientacionDesdeAzimut(44.9)).toBe('N')
    expect(orientacionDesdeAzimut(45)).toBe('OP')    // 45 → OP (más restrictivo que N)
    expect(orientacionDesdeAzimut(134.9)).toBe('OP')
    expect(orientacionDesdeAzimut(135)).toBe('S')    // 135 → S (más restrictivo que OP)
    expect(orientacionDesdeAzimut(225)).toBe('S')    // 225 → S (más restrictivo que OP)
    expect(orientacionDesdeAzimut(225.1)).toBe('OP')
    expect(orientacionDesdeAzimut(315)).toBe('OP')   // 315 → OP (más restrictivo que N)
    expect(orientacionDesdeAzimut(315.1)).toBe('N')
  })

  it('maxUVentanaParaPct es el inverso de la Tabla 3', () => {
    // A 30% en N (zona E): el límite baja al subir U. A U=4.4 el límite es 61 ≥ 30,
    // pero a U=5.8 el límite cae a 10 < 30 → la U máx admisible es 4.4 (no 5.8).
    expect(maxUVentanaParaPct('E', 'N', 30)).toBe(4.4)
    // A 60% en S (zona E): ni el mejor vidrio admite tanto (límite S máx = 51 < 60).
    expect(maxUVentanaParaPct('E', 'S', 60)).toBe(0)
  })
})

describe('revit-import — round-trip de veredictos', () => {
  const out = procesarEntradaRevit(ENTRADA)

  it('conserva la identidad por revit_uid (caras y vanos)', () => {
    expect(out.caras.map((c) => c.revit_uid)).toEqual(['cara-N', 'cara-S', 'cara-E'])
    expect(out.vanos.map((v) => v.revit_uid)).toEqual(['v1', 'v2', 'v3', 'v4', 'p1'])
  })

  it('eco del proyecto + zona normalizada', () => {
    expect(out.proyecto.comuna).toBe('Quillón')
    expect(out.proyecto.zona_termica).toBe('E')
  })

  it('cara N: 30% vidriado, cumple', () => {
    const cN = out.caras.find((c) => c.revit_uid === 'cara-N')
    expect(cN.orientacion).toBe('N')
    expect(cN.pct_vidriado).toBe(30)
    expect(cN.limite_pct).toBe(83)
    expect(cN.cumple).toBe(true)
  })

  it('cara S: 60% vidriado, NO cumple', () => {
    const cS = out.caras.find((c) => c.revit_uid === 'cara-S')
    expect(cS.pct_vidriado).toBe(60)
    expect(cS.limite_pct).toBe(35)
    expect(cS.cumple).toBe(false)
  })

  it('cara E (OP): 20% vidriado (la puerta NO suma), cumple', () => {
    const cE = out.caras.find((c) => c.revit_uid === 'cara-E')
    expect(cE.orientacion).toBe('OP')
    expect(cE.pct_vidriado).toBe(20) // 2 m² ventana / 10 m²; la puerta de 1.8 m² no cuenta
    expect(cE.cumple).toBe(true)
  })

  it('vano ventana: veredicto por su propia U + % de su cara', () => {
    const v3 = out.vanos.find((v) => v.revit_uid === 'v3')
    expect(v3.tipo).toBe('ventana')
    expect(v3.cumple).toBe(false)
    expect(v3.zona_termica).toBe('E')
    expect(typeof v3.mensaje).toBe('string')
  })

  it('vano puerta: regla propia U ≤ 1.70', () => {
    const p1 = out.vanos.find((v) => v.revit_uid === 'p1')
    expect(p1.tipo).toBe('puerta')
    expect(p1.U_exigido).toBe(1.7)
    expect(p1.cumple).toBe(true)
  })

  it('OGT global: 35% vidriado, NO cumple', () => {
    expect(out.proyecto.ogt.pct_vidriado).toBe(35)
    expect(out.proyecto.ogt.limite_pct).toBe(28)
    expect(out.proyecto.ogt.cumple).toBe(false)
  })
})

describe('revit-import — orientación por azimuth_deg (Tabla 4)', () => {
  it('usa azimuth_deg para clasificar las caras', () => {
    const out = procesarEntradaRevit({
      proyecto: { zona_termica: 'E' },
      caras: [
        { revit_uid: 'c-n', azimuth_deg: 10, area_m2: 10 },   // → N
        { revit_uid: 'c-s', azimuth_deg: 175, area_m2: 10 },  // → S
        { revit_uid: 'c-op', azimuth_deg: 95, area_m2: 10 },  // → OP
      ],
      vanos: [
        { revit_uid: 'v', tipo: 'ventana', area_m2: 2, cara_uid: 'c-s', U_actual: 2.0 },
      ],
    })
    expect(out.caras.find((c) => c.revit_uid === 'c-n').orientacion).toBe('N')
    expect(out.caras.find((c) => c.revit_uid === 'c-s').orientacion).toBe('S')
    expect(out.caras.find((c) => c.revit_uid === 'c-op').orientacion).toBe('OP')
  })

  it('azimuth_deg tiene prioridad sobre la letra orientacion', () => {
    const out = procesarEntradaRevit({
      proyecto: { zona_termica: 'E' },
      // La letra dice N pero el azimut (180°) dice Sur → gana el azimut.
      caras: [{ revit_uid: 'c1', orientacion: 'N', azimuth_deg: 180, area_m2: 10 }],
      vanos: [],
    })
    expect(out.caras[0].orientacion).toBe('S')
  })

  it('edificio girado al NE: fachadas caen en sectores, sin categorías diagonales', () => {
    // Normales a NE(45)/SE(135)/SO(225)/NO(315): bordes → OP/S/S/OP (conservador).
    const out = procesarEntradaRevit({
      proyecto: { zona_termica: 'E' },
      caras: [
        { revit_uid: 'ne', azimuth_deg: 45, area_m2: 10 },
        { revit_uid: 'se', azimuth_deg: 135, area_m2: 10 },
        { revit_uid: 'so', azimuth_deg: 225, area_m2: 10 },
        { revit_uid: 'no', azimuth_deg: 315, area_m2: 10 },
      ],
      vanos: [],
    })
    expect(out.caras.map((c) => c.orientacion)).toEqual(['OP', 'S', 'S', 'OP'])
  })
})

describe('revit-import — casos límite', () => {
  it('ventana sin U_actual → cumple null + mensaje', () => {
    const out = procesarEntradaRevit({
      proyecto: { zona_termica: 'E' },
      caras: [{ revit_uid: 'c1', orientacion: 'N', area_m2: 10 }],
      vanos: [{ revit_uid: 'v1', tipo: 'ventana', area_m2: 2, cara_uid: 'c1' }],
    })
    expect(out.vanos[0].cumple).toBeNull()
    expect(out.vanos[0].mensaje).toMatch(/Falta U_actual/)
  })

  it('zona A: puerta sin exigencia → cumple true', () => {
    const out = procesarEntradaRevit({
      proyecto: { zona_termica: 'A' },
      caras: [{ revit_uid: 'c1', orientacion: 'N', area_m2: 10 }],
      vanos: [{ revit_uid: 'p1', tipo: 'puerta', area_m2: 1.8, cara_uid: 'c1', U_actual: 3.0 }],
    })
    expect(out.vanos[0].cumple).toBe(true)
    expect(out.vanos[0].mensaje).toMatch(/sin exigencia/)
  })

  it('vano huérfano (cara_uid inexistente) → no evaluable, sin crash', () => {
    const out = procesarEntradaRevit({
      proyecto: { zona_termica: 'E' },
      caras: [],
      vanos: [{ revit_uid: 'v1', tipo: 'ventana', area_m2: 2, cara_uid: 'no-existe', U_actual: 2.0 }],
    })
    expect(out.vanos[0].cumple).toBeNull()
    expect(out.vanos[0].mensaje).toMatch(/sin cara asociada/)
  })

  it('entrada vacía no crashea', () => {
    const out = procesarEntradaRevit({})
    expect(out.caras).toEqual([])
    expect(out.vanos).toEqual([])
    expect(out.proyecto.ogt.cumple).toBeNull()
  })
})
