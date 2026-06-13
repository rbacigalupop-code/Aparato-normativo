// ═══════════════════════════════════════════════════════════════════════════════
// ds15_ventanas.js — Tabla 3 oficial DS N°15: % máximo de superficie de ventanas
// según valor U de la ventana y orientación, por zona térmica.
// ═══════════════════════════════════════════════════════════════════════════════
// Fuente: Diario Oficial 27-05-2024 (CVE 2494861), Tabla 3 del art. modificatorio
// de la OGUC 4.1.10. Extraída por coordenadas (pdfjs-dist) y verificada contra la
// imagen oficial. Reemplaza el modelo simplificado (UMAX_VENTANA_DS15 = U-máx fijo)
// y la tabla recortada VPCT (solo 3 brackets).
//
// El cumplimiento de ventanas NO es un U-máx por zona: es un trade-off entre el U
// de la ventana y el % de superficie vidriada por orientación. A mayor U, menor %.
//
// Orientaciones: N (Norte) · OP (Oriente-Poniente) · S (Sur) · OGT (global total).
// ═══════════════════════════════════════════════════════════════════════════════

// Brackets de U de la ventana (columnas). El valor aplica para U ≤ bracket.
export const UMBRALES_U_VENTANA = [0.6, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 5.8]

// % máximo de superficie vidriada [12 valores por bracket de U].
export const TABLA3_VENTANAS = {
  A: { N:[100,100,100,100,100,98,97,95,94,91,88,50], OP:[100,100,99,96,94,91,87,84,80,75,69,30], S:[94,93,91,89,85,82,78,74,69,63,57,25], OGT:[54,53,52,51,50,49,48,46,44,42,40,25] },
  B: { N:[100,99,98,97,96,94,92,90,88,85,82,30], OP:[92,91,89,87,84,81,78,75,71,66,60,20], S:[86,84,81,78,75,71,68,64,59,54,47,10], OGT:[52,51,49,47,46,45,43,42,40,38,35,10] },
  C: { N:[96,95,94,93,91,90,88,85,83,79,75,40], OP:[82,81,79,77,75,72,69,66,62,58,52,35], S:[75,73,70,67,64,61,58,54,49,44,38,15], OGT:[47,46,45,44,42,41,39,37,35,33,30,15] },
  D: { N:[94,93,91,89,87,85,83,80,77,73,69,25], OP:[73,72,70,68,65,63,60,57,53,49,44,15], S:[62,61,59,57,54,51,48,44,40,35,29,10], OGT:[43,42,41,40,38,37,35,33,31,28,25,10] },
  E: { N:[90,89,87,85,83,80,78,75,71,67,61,10], OP:[63,62,60,58,56,54,51,48,45,41,35,8], S:[51,50,48,46,44,41,38,35,31,26,20,5], OGT:[39,38,37,36,34,32,30,28,26,23,19,5] },
  F: { N:[88,86,83,80,78,76,73,69,65,60,54,0], OP:[54,53,51,49,47,45,42,40,36,32,27,0], S:[41,40,38,36,34,31,28,25,21,17,12,0], OGT:[36,35,33,31,30,28,26,24,21,17,13,0] },
  G: { N:[84,82,79,76,74,71,67,64,59,54,46,0], OP:[43,42,41,40,38,36,34,31,28,24,20,0], S:[31,30,28,26,24,21,19,16,13,8,0,0], OGT:[32,31,29,27,26,24,21,19,16,12,0,0] },
  H: { N:[77,76,74,72,69,66,62,58,53,47,38,0], OP:[34,33,32,31,29,27,25,23,20,16,12,0], S:[30,29,27,25,23,20,18,15,12,7,0,0], OGT:[31,30,28,26,25,23,20,18,15,11,0,0] },
  I: { N:[75,73,70,67,64,61,57,52,46,39,30,0], OP:[43,42,41,40,38,36,34,31,28,24,20,0], S:[28,27,25,23,21,18,16,13,10,5,0,0], OGT:[29,28,26,24,23,21,18,16,13,10,0,0] },
}

const ORIENTACIONES = ['N', 'OP', 'S', 'OGT']

// Índice de columna para un U de ventana dado (primer bracket ≥ U).
function colParaU(U) {
  const u = parseFloat(U)
  if (!isFinite(u) || u <= 0) return -1
  const i = UMBRALES_U_VENTANA.findIndex(b => u <= b + 1e-9)
  return i // -1 si U > 5.8 (fuera de tabla → no permitido)
}

/**
 * % máximo de superficie vidriada permitido para zona/U/orientación.
 * @returns {number|null} % (0-100), 0 si U fuera de rango, null si datos inválidos.
 */
export function maxVidriadoVentana(zona, U, orientacion) {
  const z = TABLA3_VENTANAS[zona]
  if (!z || !ORIENTACIONES.includes(orientacion)) return null
  const col = colParaU(U)
  if (col === -1) return 0 // U > 5.8 W/m²K: no permitido
  return z[orientacion][col]
}

/**
 * Verifica si el % real de vidriado cumple el máximo para zona/U/orientación.
 * @returns {{maxPct:number, cumple:boolean, margen:number}|null}
 */
export function cumpleVentana(zona, U, orientacion, pctReal) {
  const maxPct = maxVidriadoVentana(zona, U, orientacion)
  if (maxPct === null) return null
  const real = parseFloat(pctReal) || 0
  return { maxPct, cumple: real <= maxPct, margen: Math.round((maxPct - real) * 10) / 10 }
}
