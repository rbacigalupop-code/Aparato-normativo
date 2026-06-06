// ─────────────────────────────────────────────────────────────────────────────
// calcU.test.js — Suite de regresión del motor de cálculo térmico/higrotérmico.
//
// Objetivo: blindar las funciones puras de data.js contra regresiones. Los
// valores esperados están calculados a mano (primeros principios) o validados
// contra casos reales de la sesión y la planilla oficial MINVU (NCh853:2021 +
// NCh1973:2014). Si un cambio futuro altera estos números, el test lo detecta.
//
// Ejecutar: npm test   (o npx vitest run)
//
// Referencias normativas:
//   · ISO 6946:2017 — resistencia térmica (método combinado upper/lower)
//   · NCh853:2021    — transmitancia térmica U
//   · NCh1973:2014 / ISO 13788 — condensación (Glaser) + psat agua/hielo
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { satP, dewPoint, tempDeSatP, fRsiMinMoho, calcGlaser, calcU_ISO6946, calcU_SC, resistenciaCamara, ALL_MATS, filterMatsByElem, validarCierre, clasificarCapa, generarCorrecciones, riesgoTrampaVapor, espesorComercial } from '../data.js'

// Tolerancia para comparaciones de punto flotante
const cerca = (a, b, tol = 0.01) => Math.abs(a - b) <= tol

describe('satP — presión de saturación (ISO 13788, agua/hielo)', () => {
  it('T≥0 usa fórmula sobre agua (sin regresión)', () => {
    expect(cerca(satP(20), 2338.3, 0.5)).toBe(true)   // condición interior típica
    expect(cerca(satP(0), 610.8, 0.1)).toBe(true)     // límite agua/hielo
    expect(cerca(satP(10), 1227.7, 1)).toBe(true)
  })

  it('T<0 usa fórmula sobre HIELO (fix ISO 13788)', () => {
    // A −6°C la fórmula sobre hielo da ~368 Pa (vs ~390 sobre agua).
    // Esto es lo que exige ISO 13788 / NCh1973 para zonas frías chilenas.
    expect(cerca(satP(-6), 368.3, 1)).toBe(true)
    expect(cerca(satP(-2), 517.4, 1)).toBe(true)
  })

  it('continuidad en el límite T=0', () => {
    // Ambas ramas deben dar el mismo valor en 0°C (sin salto)
    expect(cerca(satP(-0.0001), satP(0.0001), 0.5)).toBe(true)
  })
})

describe('dewPoint — temperatura de rocío', () => {
  it('20°C / 73% HR (condición interior oficial MINVU) ≈ 15.0°C', () => {
    expect(cerca(dewPoint(20, 73), 15.0, 0.2)).toBe(true)
  })
  it('saturación (100% HR) → rocío = temperatura del aire', () => {
    expect(cerca(dewPoint(20, 100), 20.0, 0.1)).toBe(true)
  })
})

describe('tempDeSatP — inversa de satP', () => {
  it('es la inversa de satP (T≥0)', () => {
    expect(cerca(tempDeSatP(satP(15)), 15, 0.05)).toBe(true)
    expect(cerca(tempDeSatP(satP(5)), 5, 0.05)).toBe(true)
    expect(cerca(tempDeSatP(satP(20)), 20, 0.05)).toBe(true)
  })
})

describe('fRsiMinMoho — factor mínimo criterio de moho (NCh1973 75%)', () => {
  it('condiciones suaves (20/10/60%) → fRsi,min ≈ 0.64', () => {
    expect(cerca(fRsiMinMoho(20, 10, 60, 0.75), 0.644, 0.01)).toBe(true)
  })
  it('HR interior alta dispara un fRsi,min muy alto (cerca de 1)', () => {
    // A 73% interior (condición oficial MINVU) el margen con 75% es mínimo →
    // se requiere una superficie casi tan caliente como el aire interior.
    expect(fRsiMinMoho(20, 1, 73, 0.75)).toBeGreaterThan(0.9)
  })
})

describe('calcGlaser — transmitancia U (resistencias en serie)', () => {
  it('muro hormigón simple 150mm (λ=2.5) → U ≈ 4.35', () => {
    // R = Rsi(0.13) + Rse(0.04) + 0.15/2.5(0.06) = 0.23 → U = 4.348
    const r = calcGlaser([{ lam: 2.5, esp: 0.15, mu: 130 }], 20, 5, 70, 'muro')
    expect(cerca(parseFloat(r.U), 4.3478, 0.01)).toBe(true)
  })

  it('muro HA 150mm + EPS 60mm (λ=0.04) → U ≈ 0.578', () => {
    // R = 0.13+0.04+0.06+1.5 = 1.73 → U = 0.578
    const r = calcGlaser(
      [{ lam: 2.5, esp: 0.15, mu: 130 }, { lam: 0.04, esp: 0.06, mu: 60 }],
      20, 5, 70, 'muro'
    )
    expect(cerca(parseFloat(r.U), 0.5780, 0.01)).toBe(true)
  })

  it('piso usa Rse=0.04 (tabla oficial MINVU descendente) → U ≈ 0.569', () => {
    // Piso HA 120mm + EPS 60mm. R = Rsi(0.17)+Rse(0.04)+0.048+1.5 = 1.758 → U=0.569.
    // (Con el Rse=0.13 incorrecto anterior daba 0.541 — fix verificado vs planilla.)
    const r = calcGlaser(
      [{ lam: 2.5, esp: 0.12, mu: 130 }, { lam: 0.04, esp: 0.06, mu: 60 }],
      20, 5, 70, 'piso'
    )
    expect(cerca(parseFloat(r.U), 0.5688, 0.005)).toBe(true)
  })

  it('devuelve estructura completa de resultado', () => {
    const r = calcGlaser([{ lam: 0.04, esp: 0.10, mu: 60 }], 20, 10, 50, 'muro')
    expect(r).toHaveProperty('U')
    expect(r).toHaveProperty('temps')
    expect(r).toHaveProperty('ifaces')
    expect(r).toHaveProperty('Tdew')
    expect(typeof r.condInter).toBe('boolean')
    expect(Array.isArray(r.temps)).toBe(true)
  })
})

describe('Cubierta ventilada — truncar stack + Rse aire quieto (ISO 6946 §6.9.2)', () => {
  // Caso reportado: cubierta cercha madera + lana 150 + cámara + OSB en zona F.
  const stackCompleto = [
    { lam: 0.26, esp: 0.013, mu: 8 },     // Yeso cartón
    { lam: 0.035, esp: 0.150, mu: 1 },    // Lana mineral
    { esCamara: true, esp: 0.030 },       // Cámara ventilada
    { lam: 0.23, esp: 0.020, mu: 200 },   // OSB (sobre la cámara)
  ]
  const stackTruncado = stackCompleto.slice(0, 2)  // solo capas bajo la cámara

  it('stack COMPLETO (sin truncar) condensa — el bug reportado', () => {
    const r = calcGlaser(stackCompleto, 20, -1, 80, 'techumbre')
    expect(r.condInter).toBe(true)
  })
  it('stack TRUNCADO con Rse aire quieto (0.10) NO condensa — CUMPLE', () => {
    const r = calcGlaser(stackTruncado, 20, -1, 80, 'techumbre', 0.10)
    expect(r.condInter).toBe(false)
  })
  it('rseOverride cambia el Rse usado (U distinto)', () => {
    const sin = calcGlaser(stackTruncado, 20, -1, 80, 'techumbre')        // Rse=0.04
    const con = calcGlaser(stackTruncado, 20, -1, 80, 'techumbre', 0.10)  // Rse=0.10
    expect(parseFloat(con.U)).toBeLessThan(parseFloat(sin.U))  // más Rse → menos U
  })
})

describe('calcGlaser — detección de condensación (Glaser)', () => {
  it('cubierta con PV-4 Zincalum exterior (μ=100000) → CONDENSA', () => {
    // Caso real validado en sesión: OSB | Lana | Yeso | PV-4 (int→ext).
    // El PV-4 (μ=100000) bloquea el vapor en la cara fría → condensación.
    const cv = [
      { lam: 0.23, esp: 0.020, mu: 200 },     // OSB
      { lam: 0.035, esp: 0.150, mu: 1 },      // Lana mineral
      { lam: 0.26, esp: 0.013, mu: 8 },       // Yeso cartón
      { lam: 50, esp: 0.0005, mu: 100000 },   // PV-4 Zincalum
    ]
    const r = calcGlaser(cv, 20, 1, 78, 'techumbre')   // zona E
    expect(r.condInter).toBe(true)
  })

  it('muro aislado vapor-abierto en clima templado → NO condensa', () => {
    // Yeso | Lana | Fibrocemento, μ moderados, condiciones suaves.
    const cv = [
      { lam: 0.26, esp: 0.013, mu: 8 },
      { lam: 0.035, esp: 0.100, mu: 1 },
      { lam: 0.23, esp: 0.006, mu: 50 },
    ]
    const r = calcGlaser(cv, 20, 10, 55, 'muro')
    expect(r.condInter).toBe(false)
  })
})

describe('calcU_ISO6946 — método combinado con puente térmico', () => {
  it('muro entramado madera (montante 38mm @ 600mm) → U ≈ 0.40', () => {
    // Yeso 13 | Lana 90 con montante madera | OSB 11.
    // R_T = (R_upper + R_lower)/2 ≈ 2.494 → U ≈ 0.401.
    const cv = [
      { lam: 0.26, esp: 0.013, mu: 8 },
      { lam: 0.035, esp: 0.090, mu: 1,
        estructura_integrada: { tipo: 'madera', lam: 0.13, ancho_mm: 38, distancia_mm: 600 } },
      { lam: 0.23, esp: 0.011, mu: 200 },
    ]
    const r = calcU_ISO6946(cv, 'muro')
    expect(cerca(parseFloat(r.U), 0.401, 0.015)).toBe(true)
    // Convención ISO 6946: R_upper (límite superior) ≥ R_lower (límite inferior)
    expect(parseFloat(r.R_upper)).toBeGreaterThanOrEqual(parseFloat(r.R_lower))
    // R_T (promedio) debe estar entre ambos límites
    const rT = parseFloat(r.R_T)
    expect(rT).toBeGreaterThanOrEqual(parseFloat(r.R_lower) - 1e-6)
    expect(rT).toBeLessThanOrEqual(parseFloat(r.R_upper) + 1e-6)
    expect(r.method).toBe('iso6946')
  })

  it('sin estructura integrada → serie simple (upper = lower)', () => {
    const cv = [{ lam: 0.04, esp: 0.10, mu: 60 }]
    const r = calcU_ISO6946(cv, 'muro')
    expect(parseFloat(r.R_upper)).toBeCloseTo(parseFloat(r.R_lower), 4)
    expect(r.method).toBe('serie')
  })
})

describe('Biblioteca oficial de materiales (ISO 10456 / NCh853) — integración', () => {
  it('los materiales oficiales están en ALL_MATS (autofill funciona)', () => {
    const m = ALL_MATS.find(x => x.n === 'Armado (2% de acero) (ρ=2400)')
    expect(m).toBeTruthy()
    expect(m.lam).toBe(2.5)
    expect(m.mu).toBe(130)
  })
  it('respeta usos: recubrimientos de piso aparecen en piso, NO en muro', () => {
    const gruposMuro = filterMatsByElem('muro').map(g => g.g)
    const gruposPiso = filterMatsByElem('piso').map(g => g.g)
    expect(gruposPiso).toContain('Oficial NCh853 — Recubrimientos de piso')
    expect(gruposMuro).not.toContain('Oficial NCh853 — Recubrimientos de piso')
  })
  it('grupos oficiales universales aparecen en todos los elementos', () => {
    const gruposMuro = filterMatsByElem('muro').map(g => g.g)
    expect(gruposMuro).toContain('Oficial NCh853 — Hormigón')
  })
  it('metales (revestimiento/cubierta) en muro y techo, NO en piso', () => {
    const gMuro = filterMatsByElem('muro').map(g => g.g)
    const gTecho = filterMatsByElem('techumbre').map(g => g.g)
    const gPiso = filterMatsByElem('piso').map(g => g.g)
    expect(gMuro).toContain('Oficial NCh853 — metales')
    expect(gTecho).toContain('Oficial NCh853 — metales')
    expect(gPiso).not.toContain('Oficial NCh853 — metales')
    // metales impermeables: μ=100000 (convertido de "inf")
    const zinc = ALL_MATS.find(m => m.n === 'Zinc (ρ=7200)')
    expect(zinc.mu).toBe(100000)
  })
})

describe('resistenciaCamara — R de cámara según espesor (ISO 6946)', () => {
  it('valores tabulados exactos', () => {
    expect(cerca(resistenciaCamara(0.005), 0.11, 0.001)).toBe(true)   // 5mm
    expect(cerca(resistenciaCamara(0.007), 0.13, 0.001)).toBe(true)   // 7mm
    expect(cerca(resistenciaCamara(0.010), 0.15, 0.001)).toBe(true)   // 10mm
    expect(cerca(resistenciaCamara(0.015), 0.17, 0.001)).toBe(true)   // 15mm
  })
  it('interpolación lineal (20mm entre 15 y 25)', () => {
    // 0.17 + (0.18-0.17)*(20-15)/(25-15) = 0.175
    expect(cerca(resistenciaCamara(0.020), 0.175, 0.001)).toBe(true)
  })
  it('≥25mm satura en 0.18', () => {
    expect(resistenciaCamara(0.025)).toBe(0.18)
    expect(resistenciaCamara(0.050)).toBe(0.18)
    expect(resistenciaCamara(0.300)).toBe(0.18)
  })
  it('retrocompat: sin espesor → 0.18 (legado)', () => {
    expect(resistenciaCamara(0)).toBe(0.18)
    expect(resistenciaCamara(undefined)).toBe(0.18)
    expect(resistenciaCamara(NaN)).toBe(0.18)
  })
  it('el espesor de cámara afecta el U calculado en calcGlaser', () => {
    // Cámara 10mm (R=0.15) da U distinto a cámara sin espesor (0.18)
    const base = [{ lam: 0.26, esp: 0.013, mu: 8 }, { lam: 0.23, esp: 0.006, mu: 50 }]
    const con10mm = calcGlaser([base[0], { esCamara: true, esp: 0.010 }, base[1]], 20, 5, 70, 'muro')
    const sinEsp  = calcGlaser([base[0], { esCamara: true }, base[1]], 20, 5, 70, 'muro')
    expect(parseFloat(con10mm.U)).not.toBe(parseFloat(sinEsp.U))   // distintos
    expect(parseFloat(con10mm.U)).toBeGreaterThan(parseFloat(sinEsp.U))  // menos R → más U
  })
})

describe('calcU_SC — U de soluciones constructivas del catálogo', () => {
  it('cubierta 1.1.G.M1.2 (Yeso+Lana150+OSB) → U ≈ 0.2192', () => {
    // Valor de referencia confirmado en la UI durante la sesión.
    const u = calcU_SC('1.1.G.M1.2', 'techumbre')
    expect(cerca(u, 0.2192, 0.001)).toBe(true)
  })

  it('código inexistente → null', () => {
    expect(calcU_SC('NO.EXISTE', 'muro')).toBe(null)
  })
})

describe('validarCierre — terminación exterior (cierre constructivo)', () => {
  // Una capa representativa de cada tipo constructivo
  const yesoCarton = { n: 'Yeso carton', lam: 0.26, esp: 0.013, mu: 8 }
  const lana       = { n: 'Lana mineral 30kg', lam: 0.035, esp: 0.100, mu: 1 }
  const osb        = { n: 'OSB 11.1mm', lam: 0.13, esp: 0.011, mu: 200 }
  const osbBarra   = { n: 'OSB/MDF', lam: 0.13, esp: 0.015, mu: 200 }
  const mdf        = { n: 'Tablero MDF', lam: 0.14, esp: 0.015, mu: 100 }
  const estuco     = { n: 'Estuco cemento', lam: 0.87, esp: 0.020, mu: 15 }
  const fibro      = { n: 'Fibrocemento', lam: 0.23, esp: 0.006, mu: 50 }
  const hormigon   = { n: 'Hormigón armado', lam: 2.5, esp: 0.150, mu: 130 }

  const tieneCierreExt = cv => cv.some(c => c._rol === 'cierre_ext')

  // ── Clasificación: confirma el origen del bug ───────────────────────────
  it('clasificarCapa: OSB → estructura (por eso quedaba expuesto)', () => {
    expect(clasificarCapa(osb)).toBe('estructura')
  })
  it('clasificarCapa: yeso cartón → rev_int', () => {
    expect(clasificarCapa(yesoCarton)).toBe('rev_int')
  })
  it('clasificarCapa: estuco → rev_ext (terminación válida)', () => {
    expect(clasificarCapa(estuco)).toBe('rev_ext')
  })

  // ── Refuerzo: OSB/MDF/yeso al exterior → agrega terminación ─────────────
  it('OSB como última capa (muro) → agrega cierre exterior al final', () => {
    const r = validarCierre([yesoCarton, lana, osb], 'muro')
    expect(tieneCierreExt(r)).toBe(true)
    expect(r[r.length - 1]._rol).toBe('cierre_ext')   // va lo más al exterior
  })
  it('OSB/MDF (nombre con barra) como última capa → agrega cierre', () => {
    const r = validarCierre([yesoCarton, lana, osbBarra], 'muro')
    expect(tieneCierreExt(r)).toBe(true)
  })
  it('yeso cartón como última capa (muro) → agrega cierre exterior', () => {
    const r = validarCierre([yesoCarton, lana, yesoCarton], 'muro')
    expect(tieneCierreExt(r)).toBe(true)
  })
  it('MDF como última capa (muro) → agrega cierre exterior', () => {
    const r = validarCierre([yesoCarton, lana, mdf], 'muro')
    expect(tieneCierreExt(r)).toBe(true)
  })
  it('OSB como última capa (techumbre) → agrega CUBIERTA real, no estuco', () => {
    const r = validarCierre([yesoCarton, lana, osb], 'techumbre')
    expect(tieneCierreExt(r)).toBe(true)
    expect(r[r.length - 1].n).toMatch(/Gran Onda/)   // producto de techumbre
  })

  // ── Regresión: terminaciones válidas NO se tocan ───────────────────────
  it('estuco al exterior → NO agrega cierre (ya es rev_ext)', () => {
    const r = validarCierre([yesoCarton, lana, estuco], 'muro')
    expect(tieneCierreExt(r)).toBe(false)
    expect(r).toHaveLength(3)
  })
  it('fibrocemento al exterior → NO agrega cierre', () => {
    expect(tieneCierreExt(validarCierre([yesoCarton, lana, fibro], 'muro'))).toBe(false)
  })
  it('hormigón a la vista al exterior → NO agrega (válido a la vista)', () => {
    expect(tieneCierreExt(validarCierre([yesoCarton, lana, hormigon], 'muro'))).toBe(false)
  })

  // ── Regresión: el criterio previo (aislante) sigue intacto ─────────────
  it('aislante como última capa → sigue agregando cierre (criterio previo)', () => {
    expect(tieneCierreExt(validarCierre([yesoCarton, lana], 'muro'))).toBe(true)
  })

  // ── La cara INTERIOR no se volvió más estricta ─────────────────────────
  it('yeso cartón como primera capa (interior) → NO agrega cierre interior', () => {
    const r = validarCierre([yesoCarton, lana, estuco], 'muro')
    expect(r.some(c => c._rol === 'cierre_int')).toBe(false)
    expect(r[0].n).toMatch(/Yeso/)   // sigue empezando en el yeso original
  })
})

describe('generarCorrecciones — coherencia constructiva (blindaje)', () => {
  // Caso real 1.2.G.C1.3: entramado de madera con OSB intermedio (zona F).
  // Las lanas llevan estructura_integrada (madera) → activa el castigo ×0.90.
  const casoOSB = [
    { n: 'Yeso carton',      lam: 0.26,  esp: 0.010, mu: 8 },
    { n: 'Lana vidrio 10kg', lam: 0.046, esp: 0.060, mu: 1, estructura_integrada: { tipo: 'madera' } },
    { n: 'OSB/MDF',          lam: 0.23,  esp: 0.009, mu: 200 },
    { n: 'Lana vidrio 10kg', lam: 0.046, esp: 0.040, mu: 1, estructura_integrada: { tipo: 'madera' } },
    { n: 'Fibrocemento',     lam: 0.23,  esp: 0.006, mu: 50 },
  ]

  it('riesgoTrampaVapor: muro limpio NO, PU exterior sobre OSB SÍ', () => {
    expect(riesgoTrampaVapor([{ mu: 8, esp: 0.01 }, { mu: 1, esp: 0.1 }, { mu: 15, esp: 0.02 }])).toBe(false)
    // PU (sd alto) al exterior de un OSB (sd notable) → trampa
    expect(riesgoTrampaVapor([
      { mu: 8, esp: 0.01 }, { mu: 1, esp: 0.06 }, { mu: 200, esp: 0.009 },
      { mu: 1, esp: 0.04 }, { mu: 50, esp: 0.15 }, { mu: 50, esp: 0.006 },
    ])).toBe(true)
  })

  it('genera la estrategia combinada Cc (antes suprimida por el castigo)', async () => {
    const corrs = await generarCorrecciones(casoOSB, 20, -1, 80, 'muro', 0.45)
    expect(corrs.length).toBeGreaterThan(1)
    expect(corrs.some(c => c.id === 'cc_bv_reubicar_tablero')).toBe(true)
  })

  it('ordena: soluciones limpias ANTES que las con trampa de vapor', async () => {
    const corrs = await generarCorrecciones(casoOSB, 20, -1, 80, 'muro', 0.45)
    const conCapas = corrs.filter(c => c.capasCorregidas)
    let vistaTrampa = false
    for (const c of conCapas) {
      if (c._trampaVapor) vistaTrampa = true
      else expect(vistaTrampa).toBe(false)   // ninguna limpia después de una con trampa
    }
    // la fachada ventilada (fuerza bruta, PU sobre OSB) queda marcada
    const c2 = corrs.find(c => c.id.startsWith('c2_ventilada'))
    if (c2) expect(c2._trampaVapor).toBe(true)
  })

  it('NINGUNA corrección automática deja terminación exterior inválida', async () => {
    const corrs = await generarCorrecciones(casoOSB, 20, -1, 80, 'muro', 0.45)
    for (const c of corrs) {
      if (!c.capasCorregidas) continue          // C8 manuales no aplican stack
      const func = c.capasCorregidas.filter(x => !x.esCamara && !x.camara)
      const ultima = func[func.length - 1]
      expect(clasificarCapa(ultima)).not.toBe('rev_int')          // no yeso/enlucido expuesto
      expect(/\bosb\b|\bmdf\b/.test((ultima.n || '').toLowerCase())).toBe(false)  // no tablero expuesto
    }
  })

  it('muro de hormigón (estructura pesada): NO activa Cc', async () => {
    const horm = [
      { n: 'Yeso carton',      lam: 0.26, esp: 0.010, mu: 8 },
      { n: 'Hormigón armado',  lam: 2.5,  esp: 0.150, mu: 130 },
      { n: 'Lana vidrio 10kg', lam: 0.046, esp: 0.050, mu: 1 },
      { n: 'Estuco cemento',   lam: 0.87, esp: 0.020, mu: 15 },
    ]
    const corrs = await generarCorrecciones(horm, 20, -1, 80, 'muro', 0.45)
    expect(corrs.some(c => c.id === 'cc_bv_reubicar_tablero')).toBe(false)
  })

  it('árbitro mensual: "seca" exonera la trampa, "acumula" la confirma', async () => {
    // Mock determinista (no depende del clima real → test estable). Targets
    // 0.47/0.48 para no colisionar con la caché de los tests previos.
    const corrsSeca = await generarCorrecciones(casoOSB, 20, -1, 80, 'muro', 0.47, { arbitroMensual: () => 'seca' })
    expect(corrsSeca.every(c => !c._trampaVapor)).toBe(true)
    const c2seca = corrsSeca.find(c => c.id.startsWith('c2_ventilada'))
    if (c2seca) expect(c2seca._secaMensual).toBe(true)

    const corrsAcum = await generarCorrecciones(casoOSB, 20, -1, 80, 'muro', 0.48, { arbitroMensual: () => 'acumula' })
    const c2acum = corrsAcum.find(c => c.id.startsWith('c2_ventilada'))
    if (c2acum) expect(c2acum._trampaVapor).toBe(true)
  })

  it('los espesores de aislante propuestos son comerciales', async () => {
    // Caso que fuerza C1/C2 (agregar aislante). El espesor del aislante nuevo
    // debe ser un valor de mercado (no 70/90/110/130 mm).
    const corrs = await generarCorrecciones(casoOSB, 20, -1, 80, 'muro', 0.45)
    const noComercial = [70, 90, 110, 130, 170, 190]
    for (const c of corrs) {
      if (!c.capasCorregidas) continue
      for (const capa of c.capasCorregidas) {
        if (capa.esCamara || capa.camara) continue
        const espMm = Math.round((capa.esp || 0) * 1000)
        expect(noComercial).not.toContain(espMm)
      }
    }
  })
})

describe('espesorComercial — redondeo a espesor de mercado', () => {
  it('redondea hacia arriba al siguiente comercial', () => {
    expect(espesorComercial(55)).toBe(60)
    expect(espesorComercial(70)).toBe(80)
    expect(espesorComercial(90)).toBe(100)
    expect(espesorComercial(110)).toBe(120)
    expect(espesorComercial(130)).toBe(140)
  })
  it('valores ya comerciales no cambian', () => {
    expect(espesorComercial(50)).toBe(50)
    expect(espesorComercial(100)).toBe(100)
    expect(espesorComercial(150)).toBe(150)
  })
  it('nunca queda por debajo del mínimo que cumple', () => {
    for (let mm = 21; mm <= 250; mm++) expect(espesorComercial(mm)).toBeGreaterThanOrEqual(mm)
  })
  it('sobre el máximo de la tabla → múltiplo de 10', () => {
    expect(espesorComercial(263)).toBe(270)
  })
})
