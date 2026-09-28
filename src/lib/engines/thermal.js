/**
 * Thermal Engine — Funciones puras de cálculo térmico
 * No contiene React, solo lógica de negocio
 */

// ─── Motor de U/Glaser de la app: FUENTE ÚNICA en data.js ────────────────────
// El cálculo que consume la app —U con temperaturas e interfaces + Glaser/
// condensación (calcGlaser) y el método combinado ISO 6946 (calcU_ISO6946)—
// vive en src/data.js y lo cubren los tests de calcU.test.js. Las versiones
// simplificadas que existían aquí (calcularUSC, calcularGlaser) y la muerta
// validarCumplimientoTermico se eliminaron: estaban sin usar y duplicaban ese
// motor (bug A). Antes App.jsx las importaba y luego las tapaba con
// `const calcGlaser = calcGlaserCompleto`.

// calcularU: helper básico de R en serie (Σ e/λ + Rsi+Rse). NO es el motor
// ISO 6946 combinado (ese es calcU_ISO6946 en data.js); es una utilidad de
// bajo nivel con test propio (engines_bordes.test.js): sin capas con aporte
// real devuelve null, no el U engañoso 1/(Rsi+Rse) ≈ 5,88.
export function calcularU(capas, lam, esp, rsiRse) {
  if (!capas || !capas.length || !lam || !esp || !rsiRse) return null
  let Rtot = rsiRse.rsi + rsiRse.rse
  let aporto = false // ¿alguna capa aportó resistencia? (evita devolver 1/(Rsi+Rse))
  for (let i = 0; i < capas.length; i++) {
    const lamCapa = parseFloat(lam[i]) || 0
    const espCapa = parseFloat(esp[i]) || 0
    if (lamCapa > 0 && espCapa > 0) {
      Rtot += espCapa / 1000 / lamCapa
      aporto = true
    }
  }
  return (aporto && Rtot > 0) ? 1 / Rtot : null
}

// ─── Cálculo de Rw modificado (índice de reducción acústica) ──────────────────
export function calcularRwmodificado(rwBase, pesoCapas) {
  if (!rwBase) return null
  const masPesos = pesoCapas.reduce((a, b) => a + (parseFloat(b) || 0), 0)
  return Math.max(0, rwBase + masPesos)
}

// ─── Búsqueda de soluciones térmicas por criterio ───────────────────────────
export function buscarSolucionesTermicas(soluciones, uMax, acMax, filtros = {}) {
  if (!soluciones) return []

  return soluciones.filter(s => {
    // A3: la aptitud por zona la da el filtro de U-máx (abajo), NO el campo
    // `zonas` curado a mano. Solo se filtra por uso.
    if (filtros.uso && s.usos && !s.usos.includes(filtros.uso)) return false

    // Filtro por U máxima (= cumplimiento térmico real en la zona)
    if (uMax && s.u && parseFloat(s.u) > uMax) return false

    // Filtro por Rw mínimo (acústica)
    if (acMax && s.ac_rw && parseFloat(s.ac_rw) < acMax) return false

    return true
  })
}

// ─── Sugerir mejoras cuando solución no cumple U ─────────────────────────
export function sugerirMejorasTermicas(solucionActual, soluciones, uMax, filtros = {}) {
  if (!solucionActual || !uMax || !soluciones) return null

  const uActual = parseFloat(solucionActual.u) || Infinity

  // Cumplimiento a 2 decimales (la U-máx del DS N°15 se especifica a 2 decimales)
  // Si ya cumple, no hay sugerencias necesarias
  if (Math.round(uActual * 100) / 100 <= uMax + 1e-9) {
    return {
      cumple: true,
      sugerencias: [],
    }
  }

  // Buscar soluciones que cumplan
  const solucionesCumplen = buscarSolucionesTermicas(
    soluciones.filter(s => s.elem === solucionActual.elem),
    uMax,
    null,
    filtros
  )

  // Si hay soluciones que cumplen, usarlas
  if (solucionesCumplen.length > 0) {
    return {
      cumple: false,
      mejoraRequerida: uActual - uMax,
      sugerencias: solucionesCumplen
        .slice(0, 3) // Top 3
        .sort((a, b) => parseFloat(a.u) - parseFloat(b.u))
        .map(s => ({
          cod: s.cod,
          desc: s.desc,
          u: s.u,
          rf: s.rf || '—',
          mejora: uActual - parseFloat(s.u),
        })),
    }
  }

  // Si no hay soluciones estándar, sugerir mejoras de aislación
  const mejoraRequerida = uActual - uMax
  return {
    cumple: false,
    mejoraRequerida: mejoraRequerida,
    sugerencias: [],
    recomendacion: {
      tipo: 'personalizada',
      medidas: generarMedidasAislacion(solucionActual, mejoraRequerida),
    },
  }
}

// ─── Generar medidas de aislación ──────────────────────────────────────
function generarMedidasAislacion(solucion, mejoraRequerida) {
  // Conversión aproximada: 1 cm de EPS ~= 0.01 W/m²K de mejora
  const espesorAproximado = Math.ceil(mejoraRequerida * 100)

  return [
    {
      opcion: 1,
      desc: `Aumentar aislación (EPS/lana mineral): +${espesorAproximado} mm`,
      impacto: `Mejora U aproximadamente a ${(parseFloat(solucion.u) - mejoraRequerida * 1.1).toFixed(3)} W/m²K`,
      costo: 'Moderado',
    },
    {
      opcion: 2,
      desc: 'Mejorar vidriería: cambiar a DVH o TVH de mejor desempeño',
      impacto: 'Reduce U de ventanas significativamente (hasta 0.1-0.2 W/m²K)',
      costo: 'Moderado-Alto',
    },
    {
      opcion: 3,
      desc: 'Combinar mejoras: aislación + vidriería + sellos mejorados',
      impacto: 'Mejora térmica integral, cumple fácilmente',
      costo: 'Alto',
    },
    {
      opcion: 4,
      desc: 'Usar paneles SIP o sistemas constructivos integrados',
      impacto: 'Mejora 0.2-0.4 W/m²K, mejor desempeño global',
      costo: 'Muy Alto',
    },
  ]
}

// (validarCumplimientoTermico eliminada — estaba muerta y comparaba con U
//  redondeado a 2 decimales, el mismo bug C corregido en uCumpleMax.)

// ─── Peor U por elemento (para el resumen ejecutivo) ─────────────────────────
// Devuelve el U MÁXIMO (más exigente) de un elemento (muro/techo/piso)
// combinando DOS fuentes, para que el veredicto no oculte una solución no
// conforme cuando el proyecto tiene varios sistemas estructurales:
//   1) U CALCULADOS en Cálculo U (res.U) — claves 'elem' y 'estId::elem'.
//   2) U de CATÁLOGO de cada solución ASIGNADA por sistema (est.soluciones)
//      que NO tenga un U calculado propio. Una solución asignada pero nunca
//      recalculada conserva su U de ficha y no puede desaparecer del veredicto:
//      sin esto, un techo de 0,38 (p.ej. lana 80 mm, no conforme) queda oculto
//      tras otro techo de 0,23 sí calculado → el Resumen dice CUMPLE mientras el
//      Módulo 2b marca NO CUMPLE. Cuando existe, MANDA el U calculado (coincide
//      con la nota B5 del informe). Retorna string (compat. con toFixed) o
//      undefined si no hay ningún dato.
export function peorUPorElemento(calcUInit, estructuras, elemKey) {
  const cu = calcUInit || {}
  const vals = []
  // 1) U calculados (res.U) — clave simple o compuesta 'estId::elem'
  for (const [k, v] of Object.entries(cu)) {
    if ((k === elemKey || k.endsWith('::' + elemKey)) && v?.res?.U) {
      const u = parseFloat(v.res.U)
      if (Number.isFinite(u) && u > 0) vals.push(u)
    }
  }
  // 2) U de catálogo de soluciones asignadas por sistema sin cálculo propio
  for (const est of (estructuras || [])) {
    const d = est?.soluciones?.[elemKey]
    if (!d) continue
    if (cu[`${est.id}::${elemKey}`]?.res?.U) continue  // ya entró como calculado (manda)
    const uCat = parseFloat(d.u)
    if (Number.isFinite(uCat) && uCat > 0) vals.push(uCat)
  }
  if (vals.length === 0) return undefined
  return String(Math.max(...vals))
}

// ─── U efectivo de UNA solución puntual ──────────────────────────────────────
// Para las vistas por-sistema (Módulo 2b), donde se muestra el U de CADA
// solución, no el peor del elemento. Aplica la MISMA precedencia que
// peorUPorElemento / la nota B5 del informe: el U calculado en Cálculo U MANDA
// sobre el U de catálogo cuando existe. Así el Módulo 2b muestra el mismo número
// que el Resumen ejecutivo y que la Calculadora U (antes divergían: catálogo
// 0,38 en el Módulo 2b vs calculado 0,296 en el Resumen para el mismo techo).
//   estId=null → solución global (clave simple 'elem'); estId → 'estId::elem'.
// Devuelve { u: string, calc: boolean } o null si no hay ningún dato.
export function uEfectivo(calcUInit, estId, elemKey, uCatalogo) {
  const key = estId ? `${estId}::${elemKey}` : elemKey
  const uCalc = parseFloat(calcUInit?.[key]?.res?.U)
  if (Number.isFinite(uCalc) && uCalc > 0) return { u: String(uCalc), calc: true }
  const uCat = parseFloat(uCatalogo)
  if (Number.isFinite(uCat) && uCat > 0) return { u: String(uCatalogo), calc: false }
  return null
}

// ─── Comparación de cumplimiento de U ────────────────────────────────────────
// ¿El U propuesto cumple el máximo normativo?  U ≤ Umáx.
// CRÍTICO (bug C): compara el VALOR REAL, no un U redondeado a 2 decimales.
// Antes: Math.round(u*100)/100 <= umax → U=0,454 se redondeaba a 0,45 y "cumplía"
// pese a superar el límite 0,45. El redondeo es solo de PRESENTACIÓN, nunca de
// evaluación. `tol` es una tolerancia numérica anti-error de punto flotante
// (1e-9), NO un margen normativo: 0,4501 NO cumple ≤ 0,45.
export function uCumpleMax(u, umax, tol = 1e-9) {
  const v = parseFloat(u)
  const m = parseFloat(umax)
  if (!Number.isFinite(v) || !Number.isFinite(m)) return false
  return v <= m + tol
}
