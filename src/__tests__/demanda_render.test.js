// ─────────────────────────────────────────────────────────────────────────────
// demanda_render.test.js — Render de humo de la pestaña Demanda.
//
// El build y los unit-tests NO detectan ReferenceError de render (p.ej. una
// variable del componente principal usada dentro de un sub-componente sin
// pasarla como prop). Este test monta DemandaAnual en sus rutas principales y
// falla si el render lanza. Regresión del bug "areasBase is not defined".
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DemandaAnual from '../modules/energetico/DemandaAnual.jsx'

const calcUInit = {
  muro:  { res: { U: '0.5' }, capas: [] },
  techo: { res: { U: '0.3' }, capas: [] },
  piso:  { res: { U: '0.4' }, capas: [] },
}
const render = (proy) => renderToStaticMarkup(
  React.createElement(DemandaAnual, { proy, onChangeProy: () => {}, calcUInit, fachadas: [], inventarioPT: [] })
)

describe('DemandaAnual — render de humo (sin ReferenceError)', () => {
  it('vivienda unifamiliar multi-piso', () => {
    const html = render({ zona: 'F', superficie: 120, pisos: 2, configEnergetica: {} })
    expect(html).toContain('kWh')
  })
  it('departamento (tipoProyecto depto)', () => {
    const html = render({ zona: 'F', superficie: 90, pisos: 1, configEnergetica: { tipoProyecto: 'depto' } })
    expect(html.length).toBeGreaterThan(100)
  })
  it('con zonas térmicas definidas (multi-zona usuario)', () => {
    const html = render({
      zona: 'F', superficie: 1000, pisos: 5, configEnergetica: {},
      zonasTermicas: [
        { id: 'z1', nombre: 'Deptos', superficie: 800, tocaTerreno: false, tocaCubierta: true, calefaccionada: true },
        { id: 'z2', nombre: 'Local PB', superficie: 200, tocaTerreno: true, tocaCubierta: false, calefaccionada: true },
      ],
    })
    expect(html.length).toBeGreaterThan(100)
  })
})
