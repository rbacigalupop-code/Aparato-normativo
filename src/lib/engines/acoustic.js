/**
 * Acoustic Engine — Funciones puras de cálculo acústico
 * No contiene React, solo lógica de negocio normativa.
 *
 * Nota: la app calcula el Rw inline por ley de masa (ver TabSoluciones). Estas
 * funciones puras están cubiertas por tests (acoustic_engine.test.js) y quedan
 * como API reutilizable para cruces Rw / composición de elementos.
 */

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
