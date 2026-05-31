// ─────────────────────────────────────────────────────────────────────────────
// puertas_detalladas.js (engine) — Cálculo combinado U_puerta + validaciones
// normativas (térmica, fuego, acústica, dimensiones OGUC).
//
// Norma base: NCh3079 / ISO 10077-1 (cálculo U combinado, idéntico a ventanas).
//
//   U_puerta = (U_h·A_h + U_m·A_m + Ψ_s·L_s) / A_total
//
// Donde:
//   U_h: U de la hoja                  [W/m²K]
//   A_h: área de la hoja               [m²]
//   U_m: U del marco                   [W/m²K]
//   A_m: área del marco                [m²]
//   Ψ_s: Ψ del sello perimetral        [W/m·K]
//   L_s: perímetro de contacto         [m]
//   A_total = A_h + A_m
// ─────────────────────────────────────────────────────────────────────────────

import {
  obtenerHoja, obtenerMarcoPuerta, obtenerSello, obtenerDimensionOGUC,
  rfConjunto, compararRF, UMAX_PUERTA_DS15,
  RF_MINIMO_POR_USO, RW_MINIMO_POR_USO,
} from '../../data/puertas_detalladas.js'

/**
 * Calcula U combinado + propiedades del conjunto puerta.
 *
 * @param {object} params
 *   ancho_m, alto_m              - dimensiones totales (incl. marco)
 *   hojaId, marcoId, selloId
 *   anchoMarcoOverride_mm        - sobrescribir ancho marco (opcional)
 *
 * @returns objeto con U, RF, R'w del conjunto, áreas, aportes Q, componentes
 */
export function calcularPuertaCombinada({
  ancho_m = 0.90,
  alto_m  = 2.00,
  hojaId,
  marcoId,
  selloId,
  anchoMarcoOverride_mm = null,
}) {
  const hoja  = obtenerHoja(hojaId)
  const marco = obtenerMarcoPuerta(marcoId)
  const sello = obtenerSello(selloId)
  if (!hoja || !marco || !sello) return null

  // ── Geometría ──────────────────────────────────────────────────────────────
  const ancho_marco_m = (anchoMarcoOverride_mm ?? marco.ancho_mm) / 1000
  const A_total = ancho_m * alto_m
  // Área de hoja = total menos marco perimetral
  // (puerta tiene marco solo en 3 lados típicamente: jamba sup. + 2 jambas
  //  laterales. El umbral no se cuenta como marco térmico → resto 1·ancho_marco
  //  en altura y 2·ancho_marco en ancho)
  const ancho_h_m = Math.max(0, ancho_m - 2 * ancho_marco_m)
  const alto_h_m  = Math.max(0, alto_m  -   1 * ancho_marco_m)  // solo dintel
  const A_hoja    = ancho_h_m * alto_h_m
  const A_marco   = Math.max(0, A_total - A_hoja)

  // Perímetro de sello = perímetro de la hoja
  const L_sello = 2 * (ancho_h_m + alto_h_m)

  // ── Aportes de calor (W/K) ─────────────────────────────────────────────────
  const Q_hoja  = hoja.u  * A_hoja
  const Q_marco = marco.u * A_marco
  const Q_sello = sello.psi * L_sello
  const Q_total = Q_hoja + Q_marco + Q_sello

  // ── U combinado ────────────────────────────────────────────────────────────
  const U = A_total > 0 ? Q_total / A_total : 0

  // ── RF del conjunto = mínimo entre hoja y marco ────────────────────────────
  const rf = rfConjunto(hoja.rf, marco.rf)

  // ── R'w del conjunto = R'w hoja + bonus sello ──────────────────────────────
  // Estimación práctica (NCh352 + ISO 717). En la realidad depende de ensayo
  // pero la heurística captura bien el orden de magnitud.
  const rw = hoja.rw + sello.bonus_rw_db

  return {
    U: Math.round(U * 100) / 100,
    rf,
    rw,
    A_total:  Math.round(A_total  * 100) / 100,
    A_hoja:   Math.round(A_hoja   * 100) / 100,
    A_marco:  Math.round(A_marco  * 100) / 100,
    L_sello:  Math.round(L_sello  * 100) / 100,
    Q_hoja:   Math.round(Q_hoja   * 100) / 100,
    Q_marco:  Math.round(Q_marco  * 100) / 100,
    Q_sello:  Math.round(Q_sello  * 100) / 100,
    Q_total:  Math.round(Q_total  * 100) / 100,
    pctHoja:  A_total > 0 ? Math.round(A_hoja  / A_total * 100) : 0,
    pctMarco: A_total > 0 ? Math.round(A_marco / A_total * 100) : 0,
    // Ancho libre de paso = ancho hoja (resto los 2 marcos laterales)
    anchoLibre_m: Math.round(ancho_h_m * 100) / 100,
    altoLibre_m:  Math.round(alto_h_m  * 100) / 100,
    componentes: { hoja, marco, sello },
  }
}

// ─── Validaciones normativas ─────────────────────────────────────────────────

/**
 * Valida transmitancia U contra DS N°15 zona.
 */
export function cumpleDS15Puerta(U, zona) {
  const umax = UMAX_PUERTA_DS15[zona]
  if (!umax) return null
  return { umax, cumple: U <= umax, margen: Math.round((umax - U) * 100) / 100 }
}

/**
 * Valida RF del conjunto contra LOFC Ed.17 según uso de la puerta.
 */
export function cumpleRFPuerta(rf, uso) {
  const req = RF_MINIMO_POR_USO[uso]
  if (!req) return null
  return {
    rfRequerido: req.rf,
    rfActual: rf,
    cumple: compararRF(rf, req.rf) >= 0,
    nota: req.nota,
  }
}

/**
 * Valida R'w del conjunto contra NCh352 según uso.
 */
export function cumpleRWPuerta(rw, uso) {
  const req = RW_MINIMO_POR_USO[uso]
  if (!req) return null
  return {
    rwRequerido: req.rw,
    rwActual: rw,
    cumple: rw >= req.rw,
    margen: rw - req.rw,
    nota: req.nota,
  }
}

/**
 * Valida ancho/alto libres contra dimensiones OGUC según uso.
 */
export function cumpleOGUC(anchoLibre_m, altoLibre_m, uso) {
  const req = obtenerDimensionOGUC(uso)
  if (!req) return null
  const anchoOK = anchoLibre_m >= req.ancho_libre_min_m
  const altoOK  = altoLibre_m  >= req.alto_libre_min_m
  return {
    anchoMinReq: req.ancho_libre_min_m,
    altoMinReq:  req.alto_libre_min_m,
    anchoActual: anchoLibre_m,
    altoActual:  altoLibre_m,
    anchoOK,
    altoOK,
    cumple: anchoOK && altoOK,
    abreHacia: req.abre_hacia,
    nota: req.nota,
  }
}

/**
 * Compara varias configuraciones de puerta en paralelo.
 */
export function compararPuertas(configs) {
  return configs.map(c => ({ ...c, resultado: calcularPuertaCombinada(c) }))
}
