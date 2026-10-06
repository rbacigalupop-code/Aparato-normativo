// ─────────────────────────────────────────────────────────────────────────────
// zonas.js — Balance térmico MULTI-ZONA (Fase 2 del módulo Energético).
//
// Un edificio no es una sola zona: distintos pisos/unidades/zonas comunes tienen
// envolvente y exposición distintas. La diferencia física clave:
//   · Piso en contacto con TERRENO → solo el piso inferior pierde por el suelo.
//   · CUBIERTA → solo el piso superior pierde por el techo.
//   · Pisos intermedios → solo pierden por los MUROS (el entrepiso entre zonas
//     calefaccionadas no es envolvente).
//
// Cada zona define su geometría (superficie, pisos, altura, factor de forma) y su
// exposición (tocaTerreno, tocaCubierta); comparte los U del proyecto (o los suyos)
// y sus ventanas. El balance de cada zona reusa balanceTermicoMensual (ISO 13790
// §12) y el total agrega las zonas. Es aditivo: nada cambia si no se usan zonas.
//
// Modelo de UNA zona:
//   { id, nombre, superficie, pisos=1, alturaCielo=2.5, factorForma=1.0,
//     tocaTerreno=true, tocaCubierta=true,
//     uValues?:{muro,techo,piso}, areasVidrio?:{N,E,S,O},
//     ach?, masaTermica?, gananciasInternasWm2?, psiLTotal? }
// ─────────────────────────────────────────────────────────────────────────────

import { balanceTermicoMensual } from './demanda.js'
import { estimarAreasEnvolvente } from './geometria.js'
import { calificacionPorDemanda } from '../../data/clima_anual.js'

/**
 * Extrae los U {muro, techo, piso} del calcUInit del proyecto (W/m²K).
 * Toma el primer cálculo válido de cada elemento.
 */
export function uValuesFromCalcUInit(calcUInit = {}) {
  const U = {}
  for (const [key, data] of Object.entries(calcUInit)) {
    if (!data?.res?.U) continue
    const elemKey = key.includes('::') ? key.split('::').pop() : key
    const u = parseFloat(data.res.U)
    if (!(u > 0)) continue
    if (U[elemKey] == null) U[elemKey] = u   // primero gana
  }
  return U
}

/**
 * Construye los `elementos` de envolvente de una zona según su geometría y
 * exposición. Un muro siempre expone; techo solo si tocaCubierta; piso solo si
 * tocaTerreno. Usa los U de la zona o, si no, los uValues base del proyecto.
 */
export function elementosDeZona(zona = {}, uValuesBase = {}) {
  const geom = estimarAreasEnvolvente({
    superficie: zona.superficie,
    pisos: zona.pisos,
    alturaCielo: zona.alturaCielo,
    factorForma: zona.factorForma,
  })
  if (!geom) return []

  const U = { ...uValuesBase, ...(zona.uValues || {}) }
  const els = []
  if (U.muro > 0) els.push({ U: U.muro, area: geom.muro, elemKey: 'muro' })
  if (zona.tocaCubierta !== false && U.techo > 0) els.push({ U: U.techo, area: geom.techo, elemKey: 'techo' })
  if (zona.tocaTerreno !== false && U.piso > 0) els.push({ U: U.piso, area: geom.piso, elemKey: 'piso' })
  return els
}

/**
 * Balance térmico multi-zona: corre balanceTermicoMensual por cada zona y agrega.
 *
 * @param {Array} zonas
 * @param {object} params - clima + defaults compartidos:
 *   { uValues, comunaKey, zonaClima, factorSolar, factorProteccion,
 *     gananciasInternasWm2, masaTermica, ach }
 * @returns {object} { porZona, superficieTotal, demandaNetaTotal,
 *   kwhM2AnioPromedio, calificacion, perdidas, ganancias }
 */
export function balanceMultiZona(zonas = [], params = {}) {
  const lista = Array.isArray(zonas) ? zonas.filter(z => Number(z?.superficie) > 0) : []
  const porZona = lista.map(z => {
    const elementos = elementosDeZona(z, params.uValues)
    const balance = balanceTermicoMensual({
      elementos,
      areaUtil: Number(z.superficie),
      ach: z.ach ?? params.ach ?? 0.8,
      areasVidrio: z.areasVidrio ?? { N: 0, E: 0, S: 0, O: 0 },
      factorSolar: params.factorSolar ?? 0.70,
      factorProteccion: params.factorProteccion ?? 1,
      uVentana: z.uVentana ?? params.uVentana ?? 0,
      gananciasInternasWm2: z.gananciasInternasWm2 ?? params.gananciasInternasWm2,
      masaTermica: z.masaTermica ?? params.masaTermica ?? 'media',
      psiLTotal: z.psiLTotal ?? 0,
      comunaKey: params.comunaKey,
      zonaClima: params.zonaClima,
    })
    const kwhM2 = Number(z.superficie) > 0 ? Math.round(balance.demandaNeta / Number(z.superficie)) : 0
    return { id: z.id, nombre: z.nombre || 'Zona', superficie: Number(z.superficie), kwhM2, balance }
  })

  const superficieTotal  = porZona.reduce((s, z) => s + z.superficie, 0)
  const demandaNetaTotal = porZona.reduce((s, z) => s + z.balance.demandaNeta, 0)
  const sumar = (sel) => porZona.reduce((s, z) => s + sel(z.balance), 0)

  const kwhM2AnioPromedio = superficieTotal > 0 ? Math.round(demandaNetaTotal / superficieTotal) : 0

  return {
    porZona,
    superficieTotal,
    demandaNetaTotal: Math.round(demandaNetaTotal),
    kwhM2AnioPromedio,
    calificacion: calificacionPorDemanda(kwhM2AnioPromedio),
    perdidas: {
      envolvente:      Math.round(sumar(b => b.perdidas.envolvente)),
      puentesTermicos: Math.round(sumar(b => b.perdidas.puentesTermicos)),
      infiltracion:    Math.round(sumar(b => b.perdidas.infiltracion)),
      total:           Math.round(sumar(b => b.perdidas.total)),
    },
    ganancias: {
      solares:    Math.round(sumar(b => b.ganancias.solares)),
      internas:   Math.round(sumar(b => b.ganancias.internas)),
      utilizadas: Math.round(sumar(b => b.ganancias.utilizadas)),
      total:      Math.round(sumar(b => b.ganancias.total)),
    },
  }
}

/**
 * Genera automáticamente una zona por piso a partir de la geometría del edificio,
 * asignando la exposición correcta: el piso inferior toca el terreno, el superior
 * la cubierta, los intermedios ninguno. Reparte superficie y ventanas por igual.
 *
 * @param {object} p - { superficie, pisos, alturaCielo, factorForma, areasVidrio }
 * @returns {Array} zonas
 */
export function zonificarPorPiso({ superficie, pisos = 1, alturaCielo = 2.5, factorForma = 1.0, areasVidrio = null } = {}) {
  const sup = Number(superficie)
  const n = Math.max(1, Math.floor(Number(pisos) || 1))
  if (!(sup > 0)) return []

  const supPiso = sup / n
  const vidrioPiso = areasVidrio
    ? { N: (areasVidrio.N || 0) / n, E: (areasVidrio.E || 0) / n, S: (areasVidrio.S || 0) / n, O: (areasVidrio.O || 0) / n }
    : { N: 0, E: 0, S: 0, O: 0 }

  const zonas = []
  for (let i = 1; i <= n; i++) {
    zonas.push({
      id: `piso-${i}`,
      nombre: n === 1 ? 'Edificio' : `Piso ${i}`,
      superficie: supPiso,
      pisos: 1,
      alturaCielo,
      factorForma,
      tocaTerreno: i === 1,     // solo el piso inferior
      tocaCubierta: i === n,    // solo el piso superior
      areasVidrio: { ...vidrioPiso },
    })
  }
  return zonas
}
