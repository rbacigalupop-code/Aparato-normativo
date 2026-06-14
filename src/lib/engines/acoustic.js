/**
 * Acoustic Engine — Funciones puras de cálculo acústico
 * No contiene React, solo lógica de negocio normativa
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

// ─── Obtener Rw requerido según uso y piso ──────────────────────────────────
export function obtenerRwRequerido(uso, numPisos, RW_PISOS_MAP = {}) {
  if (!RW_PISOS_MAP || !uso) return null

  const pisos = parseInt(numPisos) || 0
  if (pisos <= 1) return null

  const rwPorUso = RW_PISOS_MAP[uso]
  if (!rwPorUso) return null

  // Buscar Rw según número de pisos
  for (let i = pisos; i <= 10; i++) {
    if (rwPorUso[i]) return rwPorUso[i]
  }

  return rwPorUso[7] || null // Default a 7 pisos
}

// ─── Validación de Rw según NCh352 (vivienda) ──────────────────────────────
export function validarNCh352(rwActual, tipoAislamiento, ubicacion) {
  // NCh352-2000: Acústica - Aislamiento acústico en edificios
  if (!rwActual || !tipoAislamiento || !ubicacion) return null

  const rw = parseFloat(rwActual) || 0

  // Requisitos mínimos NCh352:2000 para vivienda
  const nch352_requisitos = {
    'fachada_interior': { minimo: 30, zona: 'Ruido bajo' },
    'fachada_normal': { minimo: 35, zona: 'Ruido normal' },
    'fachada_alto_trafico': { minimo: 40, zona: 'Ruido alto' },
    'medianeria': { minimo: 50, zona: 'Entre viviendas' },
    'piso_techo': { minimo: 55, zona: 'Entre pisos' },
  }

  const requisito = nch352_requisitos[ubicacion]
  if (!requisito) return null

  return {
    cumpleNCh352: rw >= requisito.minimo,
    minimo_nch352: requisito.minimo,
    actual: rw,
    zona: requisito.zona,
    diferencia: rw - requisito.minimo,
  }
}

// ─── Cálculo de atenuación acústica en cámara de aire ──────────────────────
export function calcularAtenuacionCamara(anchoMm, frecuencia = 500) {
  if (!anchoMm || anchoMm <= 0) return 0

  const ancho = parseFloat(anchoMm)
  // Aproximación: atenuación cámara = 10*log10(f*d/12500)
  // donde f=frecuencia(Hz), d=ancho(mm)
  const atenuacion = 10 * Math.log10((frecuencia * ancho) / 12500)
  return Math.max(0, atenuacion)
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

// ─── Validación de índice de aislamiento acústico ponderado (Dw) ────────────
export function validarDw(dwActual, dwRequerida) {
  if (!dwRequerida) return { cumple: true, motivo: 'Sin requisito' }
  if (!dwActual) return { cumple: false, motivo: 'Dw no especificado' }

  const numActual = parseFloat(dwActual) || 0
  const numRequerida = parseFloat(dwRequerida) || 0

  return {
    cumple: numActual >= numRequerida,
    actual: numActual,
    requerida: numRequerida,
    diferencia: numActual - numRequerida,
  }
}

// ─── Búsqueda de soluciones acústicas por criterio ────────────────────────
export function buscarSolucionesAcusticas(soluciones, rwMin, dwMin, filtros = {}) {
  if (!soluciones) return []

  const rwMinNum = parseFloat(rwMin) || 0
  const dwMinNum = parseFloat(dwMin) || 0

  return soluciones
    .filter(s => {
      // Filtro por zona climática
      if (filtros.zona && s.zonas && !s.zonas.includes(filtros.zona)) return false

      // Filtro por uso
      if (filtros.uso && s.usos && !s.usos.includes(filtros.uso)) return false

      // Filtro por Rw mínimo
      if (rwMinNum > 0 && s.rw) {
        const sRw = parseFloat(s.rw) || 0
        if (sRw < rwMinNum) return false
      }

      // Filtro por Dw mínimo
      if (dwMinNum > 0 && s.dw) {
        const sDw = parseFloat(s.dw) || 0
        if (sDw < dwMinNum) return false
      }

      return true
    })
    .sort((a, b) => {
      const aRw = parseFloat(a.rw) || 0
      const bRw = parseFloat(b.rw) || 0
      return bRw - aRw // Mayor Rw primero
    })
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

// ─── Validación de aislamiento acústico a ruido exterior ───────────────────
export function validarAislamientoExterior(rwFachada, tipoZona, usoBuild) {
  // Basado en NCh352 y LOFC
  if (!rwFachada || !tipoZona) return null

  const rw = parseFloat(rwFachada) || 0

  // Requisitos mínimos por zona de ruido
  const req_zonas = {
    'bajo': { minimo: 25, max_noche: 30, max_dia: 35 },
    'normal': { minimo: 30, max_noche: 35, max_dia: 45 },
    'alto': { minimo: 35, max_noche: 40, max_dia: 50 },
    'muy_alto': { minimo: 40, max_noche: 45, max_dia: 55 },
  }

  const req = req_zonas[tipoZona]
  if (!req) return null

  return {
    cumpleZona: rw >= req.minimo,
    rwActual: rw,
    rwRequerido: req.minimo,
    limiteNoche: req.max_noche,
    limiteDia: req.max_dia,
    zona: tipoZona,
    uso: usoBuild,
  }
}

// ─── Cálculo de coeficiente de absorción acústica promedio (αw) ────────────
export function calcularAlphaPromedio(coeficientes) {
  if (!coeficientes || !coeficientes.length) return null

  // αw es el promedio ponderado de coeficientes por banda de frecuencia
  // Típicamente se promedian las bandas de 250Hz, 500Hz, 1000Hz, 2000Hz
  const bandas = coeficientes.filter(c => c.frecuencia && c.coef)

  if (!bandas.length) return null

  const suma = bandas.reduce((acc, b) => acc + (parseFloat(b.coef) || 0), 0)
  const alpha = suma / bandas.length

  return {
    alphaPromedio: Math.round(alpha * 100) / 100,
    bandas: bandas.length,
    clasificacion: clasificarAbsorcion(alpha),
  }
}

// ─── Clasificación de material por absorción acústica ──────────────────────
function clasificarAbsorcion(alpha) {
  if (alpha < 0.2) return 'Muy reflectante'
  if (alpha < 0.4) return 'Reflectante'
  if (alpha < 0.6) return 'Mediano'
  if (alpha < 0.8) return 'Absorbente'
  return 'Muy absorbente'
}

// ─── Validación de cumplimiento combinado (Rw + α) ───────────────────────
export function validarCumplimientoAcusticoTotal(rwActual, rwReq, alphaActual, alphaReq) {
  const validRw = validarRwCumplimiento(rwActual, rwReq)
  const validAlpha = alphaActual && alphaReq
    ? { cumple: alphaActual >= alphaReq, actual: alphaActual, requerida: alphaReq }
    : { cumple: true }

  return {
    cumpleRw: validRw.cumple,
    cumpleAlpha: validAlpha.cumple,
    cumpletotal: validRw.cumple && validAlpha.cumple,
    detallesRw: validRw,
    detallesAlpha: validAlpha,
  }
}

// ─── Mapa de Rw requerido para proyecto (helper para búsquedas) ────────────
export function crearMapaRwrequeridoParaProyecto(uso, numPisos, RW_PISOS_MAP) {
  const mapa = {}

  // Aislamiento a ruido exterior
  const rwExt = obtenerRwRequerido(uso, numPisos, RW_PISOS_MAP)
  if (rwExt) mapa.exterior = rwExt

  // Aislamiento a ruido entre unidades
  if (numPisos >= 2) {
    mapa.medianeria = rwExt ? parseInt(rwExt) + 5 : 45
    mapa.piso_techo = rwExt ? parseInt(rwExt) + 10 : 55
  }

  return mapa
}
