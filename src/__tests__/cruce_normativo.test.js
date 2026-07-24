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
import { LOSCAT_INDEX, LOSCAT_META } from '../data/loscat.js'

// Mantener en sincronía con scripts/auditar-cruce-normativo.mjs
const citaLOSCAT = (s) => /LOSCAT\s*[0-9]|\(LOSCAT/i.test(`${s.desc || ''} ${s.obs || ''}`)
const tieneMarca = (s) => citaLOSCAT(s) ||
  /ISO\s*6946|ISO\s*13370|NCh\s*853|EN\s*(ISO\s*)?10077|LOFC|LOSCAA|calculad|estimad|ley de masa|fabricante|referencial|ensayo/i
    .test(`${s.desc || ''} ${s.obs || ''}`)

// Baseline 2026-06-12: 85 soluciones sin marca de origen (de 123).
// Este número SOLO puede bajar. Meta: 0. Si agregas una solución nueva,
// declara su origen en obs (cita oficial o método de cálculo).
const BASELINE_SIN_MARCA = 85

describe('Honestidad del motor de homologación (índice Ed.14)', () => {
  it('el índice oficial Ed.14 está cargado y poblado', () => {
    expect(LOSCAT_META.edicion).toBe(14)
    expect(Object.keys(LOSCAT_INDEX).length).toBeGreaterThan(300)
  })

  it('con cita LOSCAT + código en Ed.14 → térmico oficial verificado', () => {
    const verificada = SC.find(s => citaLOSCAT(s) && LOSCAT_INDEX[s.cod])
    expect(verificada).toBeTruthy()
    const h = homologarSolucion(verificada)
    expect(h.termico.oficial).toBe(true)
    expect(h.termico.codigo).toBe(`LOSCAT ${verificada.cod}`)
    expect(h.termico.fuente).toMatch(/Ed\.14.*verificado/i)
  })

  it('sin cita LOSCAT → térmico NO oficial y lo declara', () => {
    const sinCita = SC.find(s => !citaLOSCAT(s) && !LOSCAT_INDEX[s.cod])
    expect(sinCita).toBeTruthy()
    const h = homologarSolucion(sinCita)
    expect(h.termico.oficial).toBe(false)
    expect(h.termico.codigo).not.toMatch(/^LOSCAT/)
    expect(h.termico.fuente).toMatch(/no es ítem LOSCAT/i)
  })

  it('cita a código inexistente en Ed.14 → NO oficial, con aviso de retiro', () => {
    const fantasma = { cod: '9.9.X.Z99.9', elem: 'muro', desc: 'Falsa (LOSCAT Ed.13)', capas: 'X 10', u: 0.4, obs: 'LOSCAT 9.9.X.Z99.9' }
    const h = homologarSolucion(fantasma)
    expect(h.termico.oficial).toBe(false)
    expect(h.termico.fuente).toMatch(/no encontrada en Ed\.14/i)
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

// ─────────────────────────────────────────────────────────────────────────────
// Coherencia de elemento en la homologación LOFC (bug 2026-07-13):
// una techumbre (cercha madera + lana, 1.1.G.M1.2) homologaba a
// A.2.3.60.131 "Muro perimetral o divisorio" — el RF certificado de un
// elemento VERTICAL no acredita uno HORIZONTAL. Causa: el extractor clasificó
// losas/techumbres/entrepisos como "otro" y el mapa de compatibilidad dejaba
// pasar tabiques/paneles para techumbre.
// ─────────────────────────────────────────────────────────────────────────────
import { homologarLOFC } from '../lib/engines/homologacion.js'

// La coherencia se valida por SECCIÓN del LOFC, no por palabras: A.* son
// verticales (muros/tabiques); D.* losas, F.* techumbres (F.2.1 cubierta,
// F.2.2 cielo) y G.* entrepisos son horizontales. Validar por sección evita el
// falso negativo de anoche: "Cielo con Envigado de madera" es un elemento
// horizontal legítimo aunque su descripción no diga "techo".
const SECCION_HORIZONTAL = /^[DFG]\./
const SECCION_VERTICAL = /^A\./

describe('Homologación LOFC — coherencia vertical/horizontal', () => {
  const TECHO_CERCHA = {
    cod: '1.1.G.M1.2', elem: 'techumbre', rf: 'F30',
    desc: 'Cercha madera + lana mineral 150mm + barrera vapor sobre cielo',
    capas: 'Yeso carton 13 | Barrera vapor | Lana mineral 150 | Tablon OSB',
    obs: 'estructura de madera, entramado',
  }

  it('REGRESIÓN: la cercha de madera (techumbre) no homologa a un muro', () => {
    const h = homologarLOFC(TECHO_CERCHA, 'F15')
    expect(h).toBeTruthy()
    expect(h.codigo_base).not.toBe('A.2.3.60.131')
    expect(SECCION_VERTICAL.test(h.codigo_base), `${h.codigo_base} es sección vertical`).toBe(false)
    expect(SECCION_HORIZONTAL.test(h.codigo_base), `${h.codigo_base}: ${h.descripcion}`).toBe(true)
  })

  it('la techumbre de entramado cruza al CIELO F.2.2 que ya cumple por espesor', () => {
    // El RF de un entramado de madera lo aporta el cielo (yeso cartón), no la
    // cubierta. Con placa de 13 mm debe elegir el ítem de 12,5 mm (ya cumple),
    // no los de 15 mm que exigirían engrosar.
    const h = homologarLOFC(TECHO_CERCHA, 'F30')
    expect(h.codigo_base).toBe('F.2.2.30.04')
    expect(h.rf).toBe('F30')
    expect(h.espesor_certificado_mm).toBe(12.5)
    expect(h.espesor_solucion_mm).toBe(13)
    expect(h.capas_extras).toEqual([])
    expect(h.intrinseco).toBe(true)
  })

  it('si la placa no alcanza, declara la capa a reforzar en vez de callarlo', () => {
    const placaFina = { ...TECHO_CERCHA, cod: 'T-FINA', capas: 'Yeso carton 10 | Lana mineral 150 | Tablon OSB' }
    const h = homologarLOFC(placaFina, 'F30')
    expect(h).toBeTruthy()
    expect(h.intrinseco).toBe(false)
    expect(h.capas_extras).toHaveLength(1)
    expect(h.capas_extras[0].a_mm).toBeGreaterThan(h.capas_extras[0].de_mm)
    expect(h.capas_extras[0].descripcion).toMatch(/engrosar/i)
  })

  it('INVARIANTE catálogo: ninguna techumbre/piso homologa a un ítem vertical (A.*)', () => {
    for (const s of SC.filter(x => x.elem === 'techumbre' || x.elem === 'piso')) {
      const h = homologarSolucion(s, { rfRequerido: 'F15' })
      if (h?.fuego) {
        expect(
          SECCION_VERTICAL.test(h.fuego.codigo_base),
          `${s.cod} (${s.elem}) homologó a ${h.fuego.codigo_base} "${h.fuego.descripcion}"`
        ).toBe(false)
      }
    }
  })

  it('los muros siguen homologando (la restricción no mató la vía de macizos)', () => {
    const muroHA = { cod: 'T-HA', elem: 'muro', desc: 'Muro hormigón armado 150 mm', capas: 'H.A. 150', obs: '' }
    const h = homologarLOFC(muroHA, 'F60')
    expect(h).toBeTruthy()
    expect(h.rf_minutos).toBeGreaterThanOrEqual(60)
  })
})
