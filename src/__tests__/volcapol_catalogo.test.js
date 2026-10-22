// ─────────────────────────────────────────────────────────────────────────────
// volcapol_catalogo.test.js — Fija el material y las soluciones Volcapol (Volcán)
//
// Volcapol = revestimiento interior compuesto: plancha de Volcanita (yeso-cartón,
// λ0.26) + EPS densidad 15 kg/m³ (λ0.041) ± barrera de vapor. Ficha Volcán 2021.
// Es aislación POR EL INTERIOR → mejora modesta: ni a 55 mm pasa de zonas A-D.
//
// Bloquea: (1) el λ del núcleo EPS D15, (2) el U que el motor calcula desde las
// capas, (3) la coherencia entre el U/zonas declarados en el catálogo y el
// calculado, contra la tabla de U-máx de muro del DS N°15. Si alguien toca el λ
// o las capas, este test lo atrapa.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { calcU_SC, ALL_MATS, SC, ZONAS } from '../data.js'

const COD = ['NC-1.2.M.V1.1', 'NC-1.2.M.V1.2', 'NC-1.2.M.V2.1']
const ESPERADO = {
  'NC-1.2.M.V1.1': { u: 1.32, zonas: 'A' },     // H.A. + Volcapol 30mm (EPS20)
  'NC-1.2.M.V1.2': { u: 0.79, zonas: 'ABCD' },  // H.A. + Volcapol 55mm (EPS40)
  'NC-1.2.M.V2.1': { u: 0.67, zonas: 'ABCD' },  // Albañilería + Volcapol 55mm
}

// Reproduce la regla de Talora: round(U*100)/100 <= U-max + 1e-9
const cumple = (u, umax) => Math.round(u * 100) / 100 <= umax + 1e-9
const zonasQueCumplen = (u) =>
  Object.entries(ZONAS).filter(([, z]) => cumple(u, z.muro)).map(([k]) => k).join('')

describe('Catálogo Volcapol — material núcleo EPS D15', () => {
  it('existe "EPS Volcapol D15 (Volcán)" con λ=0.041, μ=40', () => {
    const m = ALL_MATS.find(x => x.n === 'EPS Volcapol D15 (Volcán)')
    expect(m).toBeTruthy()
    expect(m.lam).toBe(0.041)
    expect(m.mu).toBe(40)
  })
})

describe('Catálogo Volcapol — soluciones de revestimiento interior', () => {
  for (const cod of COD) {
    it(`${cod}: U calculado y declarado coinciden (${ESPERADO[cod].u})`, () => {
      const uCalc = calcU_SC(cod, 'muro')
      expect(uCalc).not.toBeNull()
      expect(Math.round(uCalc * 100) / 100).toBe(ESPERADO[cod].u)

      const sol = SC.find(s => s.cod === cod)
      expect(sol, `solución ${cod} debe estar en SC`).toBeTruthy()
      expect(sol.u).toBe(ESPERADO[cod].u)            // u declarado = calculado
      expect(sol.elem).toBe('muro')
    })

    it(`${cod}: las zonas declaradas = las que cumplen el U-máx DS N°15 (${ESPERADO[cod].zonas})`, () => {
      const uCalc = calcU_SC(cod, 'muro')
      const sol = SC.find(s => s.cod === cod)
      expect(sol.zonas).toBe(ESPERADO[cod].zonas)
      expect(zonasQueCumplen(uCalc)).toBe(ESPERADO[cod].zonas)  // no sobre-declara zonas
    })
  }

  it('aislación interior modesta: Volcapol 30mm (el del link) solo cumple zona A', () => {
    expect(zonasQueCumplen(calcU_SC('NC-1.2.M.V1.1', 'muro'))).toBe('A')
  })

  it('ni el Volcapol 55mm alcanza zonas frías E-I (U-máx E=0.60)', () => {
    const u = calcU_SC('NC-1.2.M.V1.2', 'muro')
    expect(cumple(u, ZONAS.E.muro)).toBe(false)
  })
})
