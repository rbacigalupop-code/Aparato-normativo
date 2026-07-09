import { describe, it, expect } from 'vitest'
import { PDA, PDA_SOLUCIONES, PDA_DETALLES, resolvePDA, pdaDeComuna, solucionesPDA, uMaxObraNueva } from '../data/pda.js'
import { homologarSolucion, identificarEstructuraBase } from '../lib/engines/homologacion.js'

const ELEMS = ['muro', 'techumbre', 'piso']
const reqKey = e => (e === 'techumbre' ? 'techo' : e)

describe('PDA — datos', () => {
  it('cada solución tiene forma válida (elem, U>0, pda conocido)', () => {
    for (const s of PDA_SOLUCIONES) {
      expect(ELEMS).toContain(s.elem)
      expect(typeof s.u).toBe('number')
      expect(s.u).toBeGreaterThan(0)
      expect(Object.keys(PDA)).toContain(s.pda)
      expect(s.cod).toMatch(/^PDA-/)
    }
  })

  it('cada PDA declara comunas y requisitos U-máx', () => {
    for (const [k, v] of Object.entries(PDA)) {
      expect(Array.isArray(v.comunas)).toBe(true)
      expect(v.comunas.length).toBeGreaterThan(0)
      expect(v.requisitos).toBeTruthy()
      for (const e of ELEMS) expect(typeof v.requisitos[reqKey(e)]).toBe('number')
    }
  })

  it('INVARIANTE: cada solución cumple el U-máx de REACONDICIONAMIENTO de su PDA', () => {
    // Las soluciones son fichas de vivienda existente → se comparan contra el
    // estándar de reacondicionamiento (reacond), no el de obra nueva (requisitos).
    for (const s of PDA_SOLUCIONES) {
      const req = PDA[s.pda].reacond || PDA[s.pda].requisitos
      const uMax = req[reqKey(s.elem)]
      expect(s.u, `${s.cod} U=${s.u} debe ≤ ${uMax}`).toBeLessThanOrEqual(uMax + 1e-9)
    }
  })

  it('detalles de hermeticidad no traen U (son puentes térmicos)', () => {
    expect(PDA_DETALLES.length).toBeGreaterThan(0)
    for (const d of PDA_DETALLES) expect(d.u).toBeUndefined()
  })
})

describe('PDA — gating por comuna', () => {
  it('resuelve comunas de PDA regionales y singulares', () => {
    expect(resolvePDA('Rancagua')).toBe('ohiggins')
    expect(resolvePDA('MACHALI')).toBe('ohiggins')      // sin acento / mayúsculas
    expect(resolvePDA('Quinta de Tilcoco')).toBe('ohiggins')
    expect(resolvePDA('Talca')).toBe('talca_maule')
    expect(resolvePDA('Osorno')).toBe('osorno')
    expect(resolvePDA('Chillán')).toBe('chillan')
    expect(resolvePDA('Coyhaique')).toBe('coyhaique')
  })

  it('comuna sin PDA → null y sin soluciones', () => {
    // Antofagasta/La Serena no tienen PDA (Santiago ahora sí — PDA RM).
    expect(resolvePDA('Antofagasta')).toBeNull()
    expect(resolvePDA('La Serena')).toBeNull()
    expect(resolvePDA('')).toBeNull()
    expect(solucionesPDA('Antofagasta')).toEqual([])
  })

  it('PDA RM cubre Gran Santiago; obra nueva más estricta que zona', () => {
    expect(resolvePDA('Santiago')).toBe('rm')
    expect(resolvePDA('Las Condes')).toBe('rm')
    // uMaxObraNueva toma la más estricta entre zona y PDA
    expect(uMaxObraNueva('Maule', 'muro', 0.60)).toBe(0.45)   // PDA manda
    expect(uMaxObraNueva('Antofagasta', 'muro', 0.60)).toBe(0.60) // sin PDA, no cambia
  })

  it('solucionesPDA devuelve solo las del PDA de la comuna', () => {
    const sols = solucionesPDA('Rancagua')
    expect(sols.length).toBeGreaterThan(0)
    expect(sols.every(s => s.pda === 'ohiggins')).toBe(true)
    expect(pdaDeComuna('Rancagua').nombre).toMatch(/O.Higgins/)
  })
})

describe('PDA — capas curadas (calculadora)', () => {
  const RSI = { muro: 0.13, techumbre: 0.10, piso: 0.17 }
  const uSerie = (st, elem) => {
    let R = RSI[elem] + 0.04
    for (const c of st) {
      if (c.esCamara) { R += c.esp >= 25 ? 0.18 : c.esp >= 10 ? 0.15 : 0.11; continue }
      if (c.lam && c.esp) R += (c.esp / 1000) / c.lam
    }
    return 1 / R
  }
  const curadas = PDA_SOLUCIONES.filter(s => s.capasStruct)

  it('las soluciones curadas tienen capas estructuradas válidas', () => {
    for (const s of curadas) {
      // ≥2: cubierta ventilada válida con 2 capas (cielo + aislante bajo el ático)
      expect(s.capasStruct.length).toBeGreaterThanOrEqual(2)
      for (const c of s.capasStruct) {
        expect(typeof c.esp).toBe('number')
        if (!c.esCamara) expect(typeof c.lam).toBe('number')
      }
    }
  })

  it('la U calculada de las capas curadas se acerca a la U oficial (≤0.06)', () => {
    for (const s of curadas) {
      const u = uSerie(s.capasStruct, s.elem)
      expect(Math.abs(u - s.u), `${s.cod} calc=${u.toFixed(2)} of=${s.u}`).toBeLessThanOrEqual(0.06)
    }
  })

  it('las soluciones curadas tienen Rw estimado (ley de masa) plausible', () => {
    for (const s of curadas) {
      expect(typeof s.rwEstimado, s.cod).toBe('number')
      expect(s.rwEstimado).toBeGreaterThanOrEqual(20)  // muy liviano
      expect(s.rwEstimado).toBeLessThanOrEqual(75)     // muy pesado (hormigón)
    }
  })
})

describe('PDA — homologación LOFC/LOSCAA por estructura base', () => {
  // Reproduce los campos del PDA_SC (App.jsx) que consume el motor.
  const asSC = s => ({
    cod: s.cod, elem: s.elem, sistemas: null,
    desc: s.desc, capas: s.capas || 'Ver ficha oficial',
    u: s.u, rf: null, ac_rw: null, esPDA: true, pda: s.pda,
    obs: `${s.fuente}. Reacondicionamiento térmico de vivienda existente.`,
  })
  const LIVIANO = ['acero', 'panel_sandwich', 'tabique_drywall']

  it('muro de albañilería con estructura metálica se identifica como LADRILLO, no acero (regresión tilde/furring)', () => {
    // El furring metálico añadido no debe robar la identidad de la base másica.
    const sol = PDA_SOLUCIONES.find(s => /alba[nñ]iler[ií]a/i.test(s.desc || '') && /met[aá]lic/i.test(s.desc || ''))
    expect(sol, 'debe existir un muro albañilería + estructura metálica en el dataset').toBeTruthy()
    const est = identificarEstructuraBase(asSC(sol))
    expect(est?.material, sol.cod).toBe('ladrillo')
  })

  it('retrofit sobre hormigón existente cruza a LOFC (RF) y LOSCAA (Rw) oficiales', () => {
    const sol = PDA_SOLUCIONES.find(s => /hormig[oó]n/i.test(s.desc || '') && /existente/i.test(s.desc || ''))
    expect(sol, 'debe existir un retrofit sobre hormigón existente').toBeTruthy()
    const h = homologarSolucion(asSC(sol), { rfRequerido: 'F30', rwRequerido: 30 })
    expect(h.fuego?.rf, sol.cod).toMatch(/^F\d+/)
    expect(typeof h.acustico?.rw, sol.cod).toBe('number')
  })

  it('INVARIANTE: ninguna homologación PDA se apoya en una base liviana (furring)', () => {
    // Honestidad: si el motor devuelve un cruce, la base debe ser másica/existente,
    // nunca el revestimiento liviano añadido por el reacondicionamiento.
    for (const s of PDA_SOLUCIONES) {
      const sc = asSC(s)
      const est = identificarEstructuraBase(sc)
      const h = homologarSolucion(sc, { rfRequerido: 'F30', rwRequerido: 30 })
      if (h.fuego || h.acustico) {
        expect(LIVIANO, `${s.cod} homologó sobre base liviana ${est?.material}`).not.toContain(est?.material)
      }
    }
  })

  it('una fracción razonable de soluciones PDA obtiene base identificada', () => {
    const conBase = PDA_SOLUCIONES.filter(s => identificarEstructuraBase(asSC(s))?.material).length
    expect(conBase).toBeGreaterThanOrEqual(10)  // hoy 15; guarda contra regresión que las mate
  })
})
