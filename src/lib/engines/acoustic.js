/**
 * Acoustic Engine — Funciones puras de cálculo acústico
 * No contiene React, solo lógica de negocio normativa.
 *
 * `rwFachadaCompuesta` se usa EN VIVO en el cruce acústico de fachada (App.jsx):
 * combina el Rw del muro opaco con el de la ventana en paralelo (el camino débil
 * domina). `validarRwCumplimiento` y `calcularMejoraAcustica` quedan como API
 * reutilizable (el Rw de elemento simple se calcula inline por ley de masa).
 * Todas cubiertas por tests (acoustic_engine.test.js).
 */

import { LOSCAA_FULL } from '../../data/loscaa_full.js'

// ─── Mejora de ruido de impacto con revestimiento de piso certificado ────────
// LOSCAA familia RP.O: revestimientos que declaran una mejora ΔL,w (impacto),
// sumable a un entrepiso base. Menor L'n,w = mejor. Ordenados por ΔL,w desc.
export const MEJORAS_IMPACTO_PISO = Object.values(LOSCAA_FULL)
  .filter(m => m.es_mejora && m.delta_lw != null && m.delta_lw > 0)
  .sort((a, b) => b.delta_lw - a.delta_lw)

const MEJORAS_IMPACTO_MAP = Object.fromEntries(MEJORAS_IMPACTO_PISO.map(m => [m.codigo, m]))

/**
 * L'n,w efectivo de un entrepiso = base − ΔL,w del revestimiento elegido.
 * @param {number|string} lnwBase  L'n,w del entrepiso base (dB)
 * @param {string} codigo          código LOSCAA del revestimiento (o vacío)
 * @returns {{ base:number, mejora:object|null, efectivo:number }}
 */
export function lnwConMejora(lnwBase, codigo) {
  const base = parseFloat(lnwBase) || 0
  const mejora = base ? (MEJORAS_IMPACTO_MAP[codigo] || null) : null
  return { base, mejora, efectivo: mejora ? base - mejora.delta_lw : base }
}

// ─── Validación de cumplimiento Rw (índice de reducción acústica) ────────────
export function validarRwCumplimiento(rwActual, rwRequerida) {
  if (!rwRequerida) return { cumple: true, motivo: 'Sin requisito' }
  if (!rwActual) return { cumple: false, motivo: 'Rw no especificado' }

  const numActual = parseFloat(rwActual) || 0
  const numRequerida = parseFloat(rwRequerida) || 0

  return {
    cumple: numActual >= numRequerida,
    actual: numActual,
    requerida: numRequerida,
    diferencia: numActual - numRequerida,
  }
}

// ─── Estimación de Rw de un elemento COMPUESTO (paralelo) ──────────────────
// Para elementos que transmiten sonido EN PARALELO (p. ej. muro + ventana en
// una misma fachada). El índice combinado se obtiene del coeficiente de
// transmisión τ=10^(-R/10) ponderado por área (ISO 12354-3):
//   τ_comp = Σ(Si·τi) / ΣSi   →   R_comp = -10·log10(τ_comp)
// El factor es 10 (relación de potencia/intensidad), NO 20 (relación de presión).
// El camino más débil (menor Rw) domina el resultado.
// `elem.area` es opcional; si falta, se asume igual área para todos.
export function estimarRwComposicion(elementos) {
  if (!elementos || !elementos.length) return null

  let sumaSt = 0 // Σ Si·τi
  let sumaS = 0  // Σ Si
  for (const elem of elementos) {
    const rw = parseFloat(elem.rw) || 0
    const area = parseFloat(elem.area) || 1 // área unitaria si no se especifica
    if (rw > 0 && area > 0) {
      sumaSt += area * Math.pow(10, -rw / 10)
      sumaS += area
    }
  }

  if (sumaSt <= 0 || sumaS <= 0) return null
  const tauComp = sumaSt / sumaS
  const rwTotal = -10 * Math.log10(tauComp)

  return {
    rwEstimado: Math.round(rwTotal * 10) / 10,
    elementos: elementos.length,
    metodo: 'Composición en paralelo ponderada por área (ISO 12354-3)',
  }
}

// ─── Cálculo de mejora acústica al añadir capas EN SERIE ────────────────────
// Añadir capas a un cerramiento (doble placa, lana mineral, banda resiliente…)
// SUBE el Rw. No existe ley simple cerrada para la combinación en serie
// (es masa-resorte-masa, depende de cavidad y frecuencia), por lo que se usa el
// modelo aditivo de incrementos ΔRw — el mismo criterio que `calcularRwmodificado`
// en thermal.js: cada `elem.rw` es la MEJORA (ΔRw, dB) que aporta esa capa.
//   Rw_mejorado = Rw_base + Σ ΔRwi   (mejora ≥ 0 siempre)
// Es una estimación; el valor real requiere ensayo NCh352 / ISO 10140.
export function calcularMejoraAcustica(rwBase, elementosAdicionales) {
  if (!rwBase || !elementosAdicionales || !elementosAdicionales.length) return null

  const rw0 = parseFloat(rwBase) || 0
  let deltaTotal = 0
  for (const elem of elementosAdicionales) {
    const drw = parseFloat(elem.rw) || 0 // ΔRw aportado por la capa
    if (drw > 0) deltaTotal += drw
  }

  const rwMejorado = rw0 + deltaTotal

  return {
    rwBase: Math.round(rw0 * 10) / 10,
    rwMejorado: Math.round(rwMejorado * 10) / 10,
    mejora: Math.round(deltaTotal * 10) / 10,
    elementosAgregados: elementosAdicionales.length,
  }
}

// ─── Rw combinado de una FACHADA (muro opaco + ventana) ──────────────────────
// Una fachada transmite ruido en paralelo por el muro y por la ventana. El Rw
// real del conjunto NO es el del muro: lo baja el vidrio (camino más débil),
// ponderado por el % de superficie vidriada. Usa estimarRwComposicion.
//   pctVidriado = % de la fachada que es ventana (0-100).
// Devuelve null si faltan datos (muro Rw, ventana Rw o % válido) → el llamador
// cae a su comportamiento previo (Rw del muro) sin inventar nada.
export function rwFachadaCompuesta({ rwMuro, rwVentana, pctVidriado }) {
  const muro = parseFloat(rwMuro) || 0
  const vent = parseFloat(rwVentana) || 0
  const pct = parseFloat(pctVidriado)
  if (!(muro > 0) || !(vent > 0) || !(pct > 0 && pct <= 100)) return null

  const comp = estimarRwComposicion([
    { rw: muro, area: 100 - pct },
    { rw: vent, area: pct },
  ])
  if (!comp) return null

  return {
    combinado: comp.rwEstimado,
    rwMuro: muro,
    rwVentana: vent,
    pctVidriado: pct,
    debil: vent <= muro ? 'ventana' : 'muro',   // camino que domina la pérdida
    metodo: 'Composición fachada muro+ventana en paralelo (ISO 12354-3, ponderada por área)',
  }
}
