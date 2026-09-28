// ─────────────────────────────────────────────────────────────────────────────
// registry.js — Registro normativo central (Talora)
//
// PROMPT 4: la edición/vigencia normativa es un DATO del sistema, no una cadena
// escrita a mano en cada archivo. Una sola fuente para toda la app.
//
// Fuente oficial (MINVU): "Listado Oficial de Soluciones Constructivas para
// Acondicionamiento Térmico" (LOSCAT) — Edición 14 (2026), texto aprobado por
// Resolución Exenta N° 1403 del 20 de abril de 2026. Reemplaza a la Edición 13.
// Marco: Art. 4.1.10 del D.S. N° 47 (V. y U.) de 1992 (OGUC).
// Condensación: Resolución Exenta N° 1802 del 26 de noviembre de 2025.
// Regla 1.6 del Listado: "Las Fichas cuya vigencia se encuentre vencida no
// podrán ser utilizadas para acreditar el cumplimiento del Art. 4.1.10 OGUC."
// ─────────────────────────────────────────────────────────────────────────────

export const ESTADO_NORMA = Object.freeze({
  VIGENTE:   'VIGENTE',
  HISTORICO: 'HISTORICO',
})

// Fuentes normativas conocidas. Cada una es un dato con edición, fechas y origen.
export const NORMAS = Object.freeze({
  LOSCAT: {
    id: 'LOSCAT',
    nombre: 'Listado Oficial de Soluciones Constructivas para Acondicionamiento Térmico',
    edicionVigente: {
      edicion: 14,
      anio: 2026,
      resolucion: 'Resolución Exenta N° 1403',
      fechaResolucion: '2026-04-20',
      estado: ESTADO_NORMA.VIGENTE,
      fuente: 'MINVU — División Técnica de Estudio y Fomento Habitacional',
    },
    edicionAnterior: {
      edicion: 13,
      anio: 2025,
      estado: ESTADO_NORMA.HISTORICO, // reemplazada por E14
    },
  },
  // Condensación intersticial/superficial: condiciones de cálculo del Art. 4.1.10.
  CONDENSACION: {
    id: 'CONDENSACION',
    nombre: 'Condiciones de cálculo de condensación (Art. 4.1.10 OGUC)',
    resolucion: 'Resolución Exenta N° 1802',
    fechaResolucion: '2025-11-26',
    estado: ESTADO_NORMA.VIGENTE,
    fuente: 'MINVU',
  },
})

// Etiquetas legibles derivadas del registro — ÚNICA fuente de los textos de
// edición que se muestran en UI e informes. No escribir "Ed.13"/"Ed.14" a mano.
export const EDICION_LOSCAT = `Ed.${NORMAS.LOSCAT.edicionVigente.edicion}`               // "Ed.14"
export const LISTADO_LOSCAT = `LOSCAT ${EDICION_LOSCAT} ${NORMAS.LOSCAT.edicionVigente.anio}` // "LOSCAT Ed.14 2026"

// ── Vigencia por ficha ───────────────────────────────────────────────────────
// El Listado E14 fija una fecha de vigencia POR FICHA (columna VIGENCIA). La
// mayoría vence en DICIEMBRE 2026; algunas fichas de ladrillo "Santiago" en
// MAYO 2029 y los materiales R100 (lanas) en ABRIL 2031.
// Nota: aquí se modela el DEFAULT (fin de mes indicado) y las excepciones que se
// vayan cargando desde el PDF oficial. El default es el más temprano conocido
// (DIC 2026): fail-safe — ante duda, marca "por vencer/revisar" antes, nunca
// declara vigencia más larga que la real para la mayoría de las fichas.
export const VIGENCIA_LOSCAT = Object.freeze({
  default: '2026-12-31', // DICIEMBRE 2026
  // Excepciones por código exacto (fin del mes de vigencia oficial):
  excepciones: {
    // Ladrillos "Santiago/Santiagote" base (MAYO 2029)
    '1.2.M.B6': '2029-05-31',
    '1.2.M.B7': '2029-05-31',
    '1.2.M.B9': '2029-05-31',
    '1.2.M.B10': '2029-05-31',
    '1.2.M.B11': '2029-05-31',
    // Materiales aislantes R100 (ABRIL 2031)
    'R100/LV.2.3': '2031-04-30',
    'R100/LV.2.2': '2031-04-30',
  },
})

const finDeHoy = () => new Date().toISOString().slice(0, 10)

// Fecha de vigencia (ISO) de una ficha por su código. Si no hay excepción, usa
// el default del Listado.
export function vigenciaDeFicha(codigo) {
  if (codigo && VIGENCIA_LOSCAT.excepciones[codigo]) return VIGENCIA_LOSCAT.excepciones[codigo]
  return VIGENCIA_LOSCAT.default
}

// ¿La ficha está vigente a la fecha de evaluación? (regla 1.6 del Listado)
//   Devuelve { vigente:boolean, vence:'YYYY-MM-DD', estado, motivo? }
export function validarVigenciaFicha(codigo, fechaEval = finDeHoy()) {
  const vence = vigenciaDeFicha(codigo)
  const vigente = String(fechaEval) <= String(vence)
  return {
    vigente,
    vence,
    estado: vigente ? ESTADO_NORMA.VIGENTE : ESTADO_NORMA.HISTORICO,
    motivo: vigente ? undefined : `Ficha vencida el ${vence} — no acredita el Art. 4.1.10 OGUC (Listado ${LISTADO_LOSCAT}, regla 1.6). Debe reemplazarse por una ficha vigente.`,
  }
}

// Edición vigente de una norma (para encabezados/trazabilidad).
export function obtenerEdicionVigente(normaId = 'LOSCAT') {
  return NORMAS[normaId]?.edicionVigente || null
}
