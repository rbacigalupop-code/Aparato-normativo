/**
 * Fire Engine — Funciones puras de validación Resistencia al Fuego (RF)
 * No contiene React, solo lógica de negocio normativa
 */

// ─── Conversión RF string a número (F30=30, F60=60, F0=0) ─────────────────────
export function rfStringToNumber(rfStr) {
  if (!rfStr) return 0
  const match = rfStr.match(/F(\d+)/)
  return match ? parseInt(match[1]) : 0
}

// Alias
export const rfN = rfStringToNumber

// ─── Conversión inversa: número a string RF ────────────────────────────────
export function numberToRfString(num) {
  if (!num || num <= 0) return 'F0'
  if (num <= 15) return 'F15'
  if (num <= 30) return 'F30'
  if (num <= 60) return 'F60'
  if (num <= 90) return 'F90'
  if (num <= 120) return 'F120'
  return 'F120'
}

// ─── Obtener RF requerida según uso y número de pisos ──────────────────────
export function obtenerRFpisos(uso, numPisos, RF_PISOS_MAP = {}) {
  if (!RF_PISOS_MAP || !uso) return null

  const pisos = parseInt(numPisos) || 0
  if (pisos <= 1) return null

  const rfPorUso = RF_PISOS_MAP[uso]
  if (!rfPorUso) return null

  // Buscar RF según número de pisos
  for (let i = pisos; i <= 10; i++) {
    if (rfPorUso[i]) return rfPorUso[i]
  }

  return rfPorUso[7] || null // Default a 7 pisos
}

// ─── Validación si se requiere caja de escalera cerrada ──────────────────────
export function requiereCajaEscalera(uso, numPisos) {
  const pisos = parseInt(numPisos) || 0

  // OGUC Art. 4.5.7
  if (pisos <= 1) return false

  // Salud y Educación: 2+ pisos
  if (uso === 'Salud' || uso === 'Educacion') return pisos >= 2

  // Industrial: 2+ pisos
  if (uso === 'Industrial') return pisos >= 2

  // Comercio y Oficina: 3+ pisos
  if (uso === 'Comercio' || uso === 'Oficina') return pisos >= 3

  // Vivienda y otros: 4+ pisos
  return pisos >= 4
}

// ─── Obtener RF requerida para escalera según letra OGUC ──────────────────────
export function obtenerRFescalera(letraOGUC, OGUC_RF_LETRAS = {}) {
  if (!letraOGUC || !OGUC_RF_LETRAS) return null
  const letra = letraOGUC.toLowerCase()
  return OGUC_RF_LETRAS[letra]?.[9] || null // Columna 9 = escaleras
}

// ─── Obtener RF requerida para caja de escalera según letra OGUC ──────────────
export function obtenerRFcajaEscalera(letraOGUC, OGUC_RF_LETRAS = {}) {
  if (!letraOGUC || !OGUC_RF_LETRAS) return null
  const letra = letraOGUC.toLowerCase()
  return OGUC_RF_LETRAS[letra]?.[4] || null // Columna 4 = cajas de escalera
}

// ─── Obtener letra OGUC según destino, superficie y pisos ────────────────────
export function obtenerLetraOGUC(destino, superficie, numPisos, OGUC_TABLA1 = {}) {
  if (!destino || !OGUC_TABLA1) return null

  const tabla = OGUC_TABLA1[destino]
  if (!tabla) return null

  const pisos = Math.min(Math.max(parseInt(numPisos) || 1, 1), 7)
  const m2 = parseFloat(superficie) || 0

  // Buscar fila de rango m² adecuada
  const fila = tabla.find(f => m2 >= f.m2Min && m2 <= f.m2Max)
  if (!fila || !fila.letras) return null

  // Retornar letra según piso (índice pisos-1)
  return fila.letras[pisos - 1] || fila.letras[fila.letras.length - 1]
}

// ─── Obtener RF de letra OGUC para elemento específico ───────────────────────
export function obtenerRFdeLetra(letra, elemento, OGUC_RF_LETRAS = {}, OGUC_ELEM_COL = {}) {
  if (!letra || !elemento) return null

  const letraLower = letra.toLowerCase()
  const col = OGUC_ELEM_COL[elemento]

  if (!col || !OGUC_RF_LETRAS[letraLower]) return null

  return OGUC_RF_LETRAS[letraLower][col] || null
}

// ─── Obtener RF de tabla OGUC para elemento ───────────────────────────────
// Firma: (destino OGUC, superficie m², pisos, elemento, ...tablas OGUC).
// IMPORTANTE: el primer argumento es el DESTINO OGUC (string de la Tabla 1),
// NO el "uso" interno de la app. Antes el parámetro se llamaba `uso` lo que
// confundía a los callers (el wrapper en App.jsx pasaba los args descolocados
// y nunca pasaba `elemento` → siempre devolvía null). Ver auditoría 2026-05-27.
export function obtenerRFOGUC(destino, superficie, pisos, elemento, OGUC_TABLA1 = {}, OGUC_RF_LETRAS = {}, OGUC_ELEM_COL = {}) {
  const letra = obtenerLetraOGUC(destino, superficie, pisos, OGUC_TABLA1)
  if (!letra) return null
  return obtenerRFdeLetra(letra, elemento, OGUC_RF_LETRAS, OGUC_ELEM_COL)
}

// ─── Validación de cumplimiento RF ──────────────────────────────────────────
export function validarRFcumplimiento(rfActual, rfRequerida) {
  if (!rfRequerida) return { cumple: true, motivo: 'Sin requisito' }
  if (!rfActual) return { cumple: false, motivo: 'RF no especificado' }

  const numActual = rfStringToNumber(rfActual)
  const numRequerida = rfStringToNumber(rfRequerida)

  return {
    cumple: numActual >= numRequerida,
    actual: numActual,
    requerida: numRequerida,
    diferencia: numActual - numRequerida,
  }
}

// ─── Búsqueda de soluciones RF por criterio ────────────────────────────────
export function buscarSolucionesRF(soluciones, rfRequerida, filtros = {}) {
  if (!soluciones || !rfRequerida) return []

  const rfReqNum = rfStringToNumber(rfRequerida)

  return soluciones
    .filter(s => {
      // Filtro por zona
      if (filtros.zona && s.zonas && !s.zonas.includes(filtros.zona)) return false

      // Filtro por uso
      if (filtros.uso && s.usos && !s.usos.includes(filtros.uso)) return false

      // Filtro por RF cumplimiento
      if (!s.rf) return false
      const rfSolNum = rfStringToNumber(s.rf)
      return rfSolNum >= rfReqNum
    })
    .sort((a, b) => rfStringToNumber(b.rf) - rfStringToNumber(a.rf)) // Mayor RF primero
}

// ─── Validación de acero: cálculo de protección requerida ──────────────────
export function calcularProteccionAcero(rfRequerida, factorSeccion, materialProteccion) {
  if (!rfRequerida || !factorSeccion || !materialProteccion) return null

  const rfNum = rfStringToNumber(rfRequerida)
  const filas = (materialProteccion.tabla || [])
    .filter(r => rfStringToNumber(r.rf) >= rfNum && r.hpMax >= factorSeccion)
    .sort((a, b) => a.hpMax - b.hpMax)

  if (!filas.length) return null

  const fila = filas[0]
  const esCapas = materialProteccion.tipo === 'capas'

  return {
    rfCumple: rfStringToNumber(fila.rf) >= rfNum,
    proteccion: esCapas
      ? { tipo: 'capas', cantidad: fila.capas, espesorCapas: fila.e, totalMm: fila.capas * fila.e }
      : { tipo: 'espesor', cantidad: fila.e, totalMm: fila.e },
    dftMin: fila.dftMin || null,
    hpMax: fila.hpMax,
  }
}

// ─── Validación de cumplimiento de protección ──────────────────────────────
export function validarProteccionAcero(espesoreAplicados, proteccionRequerida) {
  if (!proteccionRequerida || !espesoreAplicados) return { cumple: false, razon: 'Datos incompletos' }

  const esTotal = espesoreAplicados.reduce((a, b) => a + (parseFloat(b) || 0), 0)
  const reqTotal = proteccionRequerida.totalMm || 0

  return {
    cumple: esTotal >= reqTotal,
    aplicado: esTotal,
    requerido: reqTotal,
    diferencia: esTotal - reqTotal,
  }
}

// ─── Validación de escalera de evacuación ──────────────────────────────────
export function validarEscaleraEvacuacion(uso, numPisos, materialEscalera, rfMaterialEscalera, rfRequeridaEscalera) {
  const pisos = parseInt(numPisos) || 0
  const necesitaCaja = requiereCajaEscalera(uso, pisos)

  const validEscalera = {
    necesaria: pisos > 1,
    rfRequerida: rfRequeridaEscalera,
    cumpleEscalera: !rfRequeridaEscalera || validarRFcumplimiento(rfMaterialEscalera, rfRequeridaEscalera).cumple,
    material: materialEscalera,
  }

  const validCaja = {
    necesaria: necesitaCaja,
    razon: necesitaCaja ? `${pisos} pisos · uso ${uso}` : `${pisos} pisos · no requiere caja cerrada`,
  }

  return {
    escalera: validEscalera,
    caja: validCaja,
    cumpleTotal: validEscalera.cumpleEscalera && (!validCaja.necesaria || validCaja.necesaria),
  }
}

// ─── Mapa de RF por elemento y uso (helper para búsquedas) ──────────────────
export function crearMapaRFrequericParaProyecto(destino, superficie, pisos, OGUC_TABLA1, OGUC_RF_LETRAS, OGUC_ELEM_COL) {
  const letra = obtenerLetraOGUC(destino, superficie, pisos, OGUC_TABLA1)
  if (!letra) return {}

  const mapa = {}
  for (const [elem, col] of Object.entries(OGUC_ELEM_COL)) {
    const rf = obtenerRFdeLetra(letra, elem, OGUC_RF_LETRAS, OGUC_ELEM_COL)
    if (rf) mapa[elem] = rf
  }
  return mapa
}
