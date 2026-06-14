// ─────────────────────────────────────────────────────────────────────────────
// cierre_piso.test.js — La terminación de un piso es un PAVIMENTO, no fibrocemento.
//
// Bug reportado: la solución propuesta para cumplimiento de piso terminaba con
// fibrocemento. El fibrocemento/OSB es base estructural; la superficie pisable
// debe ser un pavimento. validarCierre() ahora distingue por elemento.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { validarCierre } from '../data.js'

const conOSBExpuesto = () => ([
  { n: 'Cielo YC', lam: 0.26, esp: 0.013, mu: 8 },
  { n: 'Lana mineral 30kg', lam: 0.035, esp: 0.10, mu: 1 },
  { n: 'OSB/MDF', lam: 0.23, esp: 0.018, mu: 200 },   // deck expuesto → necesita terminación
])
const ultima = cv => cv[cv.length - 1].n.toLowerCase()

describe('validarCierre — terminación por elemento', () => {
  it('PISO cierra con pavimento, NO con fibrocemento', () => {
    const r = validarCierre(conOSBExpuesto(), 'piso')
    expect(ultima(r)).toContain('pavimento')
    expect(ultima(r)).not.toContain('fibrocemento')
  })
  it('MURO sigue cerrando con fibrocemento (sin regresión)', () => {
    const r = validarCierre(conOSBExpuesto(), 'muro')
    expect(ultima(r)).toContain('fibrocemento')
  })
  it('TECHUMBRE sigue cerrando con material de cubierta (Gran Onda)', () => {
    const r = validarCierre(conOSBExpuesto(), 'techumbre')
    expect(ultima(r)).toContain('gran onda')
  })
})
