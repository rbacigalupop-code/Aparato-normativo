// ─────────────────────────────────────────────────────────────────────────────
// fuego.js — RF efectivo por elemento (fuente ÚNICA de verdad)
//
// El Resumen y el Módulo 3 (Fuego) deben derivar la RF del MISMO lugar, o se
// contradicen (el módulo muestra F60 CUMPLE y el Resumen "sin dato / INCOMPLETO").
// La regla del módulo es: RF efectiva = override manual del profesional si existe,
// si no, la RF de la solución constructiva aplicada. Aquí se extrae esa regla a
// funciones puras que leen tanto el módulo como el Resumen → no pueden divergir.
//
// NO falsea cumplimiento: si no hay manual NI solución, devuelve '' y el check
// obligatorio queda NO_VERIFICADO (ver status.js).
// ─────────────────────────────────────────────────────────────────────────────

// RF que aporta la solución constructiva aplicada a cada elemento estructural.
//   estructura: la primera solución con RF entre muro/techo/piso (soporte de cargas).
//   cubierta:   la solución de techo.
//   muros_sep:  tabique si existe, si no el muro.
export function rfSolucionPorElemento(termica) {
  const t = termica || {}
  return {
    estructura: t.muro?.solucion?.rf || t.techo?.solucion?.rf || t.piso?.solucion?.rf || '',
    cubierta:   t.techo?.solucion?.rf || '',
    muros_sep:  t.tabique?.solucion?.rf || t.muro?.solucion?.rf || '',
  }
}

// RF efectiva de un elemento = override manual (termica.rf_<id>.rf) si existe,
// si no la de la solución aplicada. Misma regla que usa TabFuego para `rfP`.
export function rfEfectivo(termica, id) {
  const manual = termica?.['rf_' + id]?.rf || ''
  return manual || rfSolucionPorElemento(termica)[id] || ''
}
