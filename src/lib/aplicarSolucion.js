// ─────────────────────────────────────────────────────────────────────────────
// aplicarSolucion.js — Regla de aplicación de una solución constructiva (SC).
//
// El simulador de capas permite modificar una SC (engrosar el aislante, agregar
// capas). Cuando el usuario aplica, debe traspasarse la U RECALCULADA y las capas
// modificadas, no el valor certificado original. Esta función centraliza esa
// decisión para que `onAplicar` y `onAplicarTodos` se comporten igual.
//
// `mod` es el snapshot del simulador: { cod, u, rw, capas } o null.
// Solo se considera modificación si `mod.cod === sc.cod` y trae U numérica.
// ─────────────────────────────────────────────────────────────────────────────
export function resolverAplicacionSC(sc, mod = null) {
  const isMod = !!(mod && mod.u != null && mod.cod === sc.cod)
  return {
    isMod,
    u: isMod ? mod.u : sc.u,        // U a aplicar (modificada o certificada)
    uOriginal: sc.u,               // U certificada original (trazabilidad)
    capas: isMod && mod.capas?.length ? mod.capas : null, // capas para Cálculo U
  }
}
