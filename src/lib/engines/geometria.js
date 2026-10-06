// ─────────────────────────────────────────────────────────────────────────────
// geometria.js — Estimación de áreas de envolvente desde datos del proyecto.
//
// Hasta ahora los motores energéticos asumían áreas fijas de "vivienda tipo"
// (muro 80, techo 70, piso 70 m²), lo que para un edificio da resultados
// irreales. Esta función deriva las áreas de envolvente a partir de datos que el
// proyecto ya tiene — superficie total + nº de pisos + altura de cielo + un
// factor de forma — con un modelo geométrico simple y editable.
//
// Modelo (planta rectangular equivalente):
//   footprint   = superficie / pisos                 (huella por piso)
//   lado        = √footprint                          (planta ~cuadrada)
//   perímetro   = 4 · lado · factorForma              (>1 = planta alargada)
//   alturaTotal = pisos · alturaCielo
//   muro  = perímetro · alturaTotal   (muro exterior bruto, incluye vanos)
//   techo = footprint                 (cubierta = huella del piso superior)
//   piso  = footprint                 (piso en contacto con terreno)
//
// Es una ESTIMACIÓN: el usuario puede sobrescribir cada área. Devuelve null si no
// hay superficie válida (el llamador cae entonces a sus defaults).
// ─────────────────────────────────────────────────────────────────────────────

// Fracción del perímetro de un departamento típico que da al exterior (fachada);
// el resto son muros medianeros a vecinos calefaccionados o a pasillo → no
// envolvente. Un depto interior expone ~1-2 de sus 4 caras.
const FRAC_FACHADA_DEPTO = 0.4

export function estimarAreasEnvolvente({ superficie, pisos = 1, alturaCielo = 2.5, factorForma = 1.0, tipoProyecto = 'unifamiliar' } = {}) {
  const sup = Number(superficie)
  if (!Number.isFinite(sup) || sup <= 0) return null

  const esDepto = tipoProyecto === 'depto'
  // Un departamento es un nivel; para vivienda unifamiliar los pisos se apilan.
  const n  = esDepto ? 1 : Math.max(1, Math.floor(Number(pisos) || 1))
  const h  = Number(alturaCielo) > 0 ? Number(alturaCielo) : 2.5
  const ff = Number(factorForma) > 0 ? Number(factorForma) : 1.0

  const footprint   = sup / n
  const lado        = Math.sqrt(footprint)
  const perimetro   = 4 * lado * ff
  const alturaTotal = n * h
  const fracMuro    = esDepto ? FRAC_FACHADA_DEPTO : 1.0

  return {
    // Depto: solo la fachada expuesta. Casa: muro exterior bruto completo.
    muro:  Math.round(perimetro * alturaTotal * fracMuro),
    // Depto (interior): losa superior e inferior dan a recintos calefaccionados
    // → no son envolvente. Casa: cubierta y piso al terreno.
    techo: esDepto ? 0 : Math.round(footprint),
    piso:  esDepto ? 0 : Math.round(footprint),
    tabique: 0,                                   // tabique interior: no es envolvente
    _geom: {
      footprint:   Math.round(footprint),
      perimetro:   Math.round(perimetro * 10) / 10,
      alturaTotal: Math.round(alturaTotal * 10) / 10,
      pisos: n,
      tipo: esDepto ? 'depto' : 'unifamiliar',
    },
  }
}
