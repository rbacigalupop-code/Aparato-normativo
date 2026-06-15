// ─────────────────────────────────────────────────────────────────────────────
// zona_clima_cruce.test.js — Cruza las DOS taxonomías de zona que conviven en la
// app y bloquea divergencias no intencionadas:
//
//   1. Zona térmica OFICIAL DS N°15 (A-I) — COMUNAS_ZONA / ZONAS (src/data.js).
//      Regulatoria (U-max, cumplimiento OGUC). Es proy.zona.
//   2. MACROZONA CLIMÁTICA (A-H) — zona_clima (src/data/comunas_chile.js).
//      Proxy de clima para el módulo energético (HDD/CDD/radiación/HR).
//
// Son taxonomías DISTINTAS por diseño: divergen en valores (p.ej. Calama es
// oficial A pero clima E). El puente explícito es MAPA_OGUC_CLIMA /
// zonaClimaDeOGUC() (src/data/zona_clima.js). Este test congela:
//   · que el mapeo cubra las 9 zonas oficiales A-I,
//   · que toda zona climática tenga datos en TODAS las tablas de clima,
//   · que la macrozona de precios cubra A-I (incluida la I, antes ausente),
//   · que las comunas multi-zona sigan la zona oficial elegida,
//   · y las divergencias INTENCIONADAS norte (Antofagasta/Calama/…), para que
//     si alguien cambia una fuente, el test falle y obligue a decidir.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { COMUNAS_ZONA, ZONAS } from '../data.js'
import { COMUNAS_CHILE, obtenerZonaClimaComuna } from '../data/comunas_chile.js'
import {
  MAPA_OGUC_CLIMA, zonaClimaDeOGUC, zonasOficialesDeComuna,
} from '../data/zona_clima.js'
import { CDD26_POR_ZONA, RADIACION_VERTICAL_POR_ZONA } from '../data/clima_anual.js'
import { HDD18_POR_ZONA_CLIMA } from '../data/grados_dia.js'
import { IRRADIACION_POR_ZONA } from '../data/irradiacion_solar.js'
import { HR_EXT_POR_ZONA } from '../data/clima_mensual.js'
import { MACROZONAS, zonaOGUCaMacrozona } from '../data/combustibles.js'

const ZONAS_OFICIALES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
const ZONAS_CLIMA     = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

describe('MAPA_OGUC_CLIMA — puente oficial (A-I) → clima (A-H)', () => {
  it('cubre las 9 zonas oficiales y mapea a una zona climática válida', () => {
    expect(Object.keys(MAPA_OGUC_CLIMA).sort()).toEqual(ZONAS_OFICIALES)
    for (const z of ZONAS_OFICIALES) {
      expect(ZONAS_CLIMA, `oficial ${z} → clima inválida`).toContain(MAPA_OGUC_CLIMA[z])
    }
  })

  it('la zona oficial existe en ZONAS (data.js) — no inventa zonas', () => {
    for (const z of ZONAS_OFICIALES) expect(ZONAS[z]).toBeTruthy()
  })
})

describe('Tablas de clima — todas indexadas por las mismas zonas A-H', () => {
  const tablas = {
    CDD26_POR_ZONA, HDD18_POR_ZONA_CLIMA, IRRADIACION_POR_ZONA,
    RADIACION_VERTICAL_POR_ZONA, HR_EXT_POR_ZONA,
  }
  for (const [nombre, tabla] of Object.entries(tablas)) {
    it(`${nombre} tiene exactamente las zonas climáticas A-H`, () => {
      expect(Object.keys(tabla).sort()).toEqual(ZONAS_CLIMA)
    })
  }

  it('toda zona del mapeo oficial→clima resuelve en cada tabla (sin huérfanas)', () => {
    for (const z of ZONAS_OFICIALES) {
      const clima = MAPA_OGUC_CLIMA[z]
      for (const [nombre, tabla] of Object.entries(tablas)) {
        expect(tabla[clima], `${nombre} sin dato para clima ${clima} (oficial ${z})`).toBeDefined()
      }
    }
  })
})

describe('Macrozona de precios — cubre A-I (incluida la zona I austral)', () => {
  it('cada zona oficial A-I cae en exactamente una macrozona', () => {
    for (const z of ZONAS_OFICIALES) {
      const enZonas = Object.values(MACROZONAS).filter(m => m.zonasOGUC.includes(z))
      expect(enZonas.length, `zona ${z} debe estar en 1 macrozona`).toBe(1)
    }
  })

  it('zona I (Coyhaique/Magallanes) → austral, no centro (bug histórico)', () => {
    expect(zonaOGUCaMacrozona('I')).toBe('austral')
    expect(zonaOGUCaMacrozona('H')).toBe('austral')
    expect(zonaOGUCaMacrozona('A')).toBe('norte')
    expect(zonaOGUCaMacrozona('D')).toBe('centro')
  })
})

describe('Comunas — zona_clima válida y catalogada', () => {
  it('cada comuna tiene zona_clima en A-H', () => {
    for (const [key, c] of Object.entries(COMUNAS_CHILE)) {
      expect(ZONAS_CLIMA, `${key} con zona_clima inválida (${c.zona_clima})`).toContain(c.zona_clima)
    }
  })
})

describe('zonaClimaDeOGUC — multi-zona sigue la selección; mono-zona usa su clima', () => {
  // Comunas que el DS N°15 parte en 2 zonas (ver comuna_multizona.test.js).
  it('Calama (B/H por cota): el clima cambia según la zona oficial elegida', () => {
    const climaB = zonaClimaDeOGUC('B', 'Calama')
    const climaH = zonaClimaDeOGUC('H', 'Calama')
    expect(climaB).toBe(MAPA_OGUC_CLIMA.B)   // 'B'
    expect(climaH).toBe(MAPA_OGUC_CLIMA.H)   // 'G'
    expect(climaB).not.toBe(climaH)          // sigue la selección, no es fijo
  })

  it('Arica (A/B/H por cota): idem, sigue la zona elegida', () => {
    expect(zonaClimaDeOGUC('A', 'Arica')).toBe(MAPA_OGUC_CLIMA.A)
    expect(zonaClimaDeOGUC('H', 'Arica')).toBe(MAPA_OGUC_CLIMA.H)
  })

  it('mono-zona conserva su clima granular, ignora lo grueso del mapeo', () => {
    // Ollague y Putre son mono-zona oficial H, pero su clima propio (F/E, altiplano
    // frío) es más granular que el mapeo MAPA_OGUC_CLIMA.H ('G').
    expect(zonaClimaDeOGUC('H', 'Ollague')).toBe('F')
    expect(zonaClimaDeOGUC('H', 'Putre')).toBe('E')
  })

  it('acepta nombre o clave (San Pedro de Atacama / san_pedro_atacama)', () => {
    expect(zonasOficialesDeComuna('San Pedro de Atacama').sort()).toEqual(['B', 'H'])
    expect(zonasOficialesDeComuna('san_pedro_atacama').sort()).toEqual(['B', 'H'])
  })

  it('nunca devuelve vacío para una zona oficial válida', () => {
    for (const z of ZONAS_OFICIALES) {
      expect(ZONAS_CLIMA).toContain(zonaClimaDeOGUC(z, null))
    }
  })
})

describe('Divergencias INTENCIONADAS oficial vs clima (norte) — congeladas', () => {
  // Si alguien cambia COMUNAS_ZONA o zona_clima de estas comunas, este test
  // falla a propósito: la divergencia es de diseño (la oficial es gruesa en el
  // norte; el clima es más realista). Re-verificar antes de actualizar.
  const CASOS = {
    antofagasta:       { oficial: ['A', 'B', 'H'], clima: 'B' },
    calama:            { oficial: ['B', 'H'],      clima: 'E' },
    ollague:           { oficial: ['H'],           clima: 'F' },
    san_pedro_atacama: { oficial: ['B', 'H'],      clima: 'E' },
    putre:             { oficial: ['H'],           clima: 'E' },
  }
  for (const [key, { oficial, clima }] of Object.entries(CASOS)) {
    it(`${key}: oficial ${oficial.join('+')} vs clima ${clima}`, () => {
      expect(zonasOficialesDeComuna(key).sort()).toEqual([...oficial].sort())
      expect(obtenerZonaClimaComuna(key)).toBe(clima)
    })
  }
})
