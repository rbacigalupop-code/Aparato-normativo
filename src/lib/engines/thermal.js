/**
 * Thermal Engine — Funciones puras de cálculo térmico
 * No contiene React, solo lógica de negocio
 */

// ─── Cálculo de Transmitancia U según ISO 6946 ───────────────────────────────
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
  // Sin capas con aporte real, las resistencias superficiales solas darían un U
  // engañoso (~5.88). Devolver null para que la UI lo trate como "sin dato".
  return (aporto && Rtot > 0) ? 1 / Rtot : null
}

// ─── Cálculo de Transmitancia U de secciones constructivas (SC) ──────────────
export function calcularUSC(sc, RSI_MAP, RSE_MAP) {
  if (!sc) return null
  const rsi = RSI_MAP[sc.int] || 0.13
  const rse = RSE_MAP[sc.ext] || 0.04
  const rsc = parseFloat(sc.r) || 0
  const rtot = rsi + rsc + rse
  return rtot > 0 ? 1 / rtot : null
}

// ─── Método de Glaser — Validación de condensación ──────────────────────────
export function calcularGlaser(capas, Ti, Te, HR, tipoElem) {
  if (!capas || !Ti || !Te || !HR) return null

  const P_sat = (t) => {
    const a = t >= 0 ? 6.112 : 6.112
    const b = t >= 0 ? 17.62 : 22.46
    const c = t >= 0 ? 243.12 : 272.62
    return 6.112 * Math.exp((b * t) / (c + t))
  }

  const psat_i = P_sat(Ti)
  const psat_e = P_sat(Te)
  const pv_i = (HR / 100) * P_sat(Ti)
  const delta_p = pv_i - (P_sat(Te) * Math.max(50, HR)) / 100

  let Sd_total = 0
  for (const c of capas) {
    if (c.esCamara) continue
    const mu = parseFloat(c.mu) || 0
    const esp = parseFloat(c.esp) || 0
    if (mu > 0 && esp > 0) {
      Sd_total += (mu * esp) / 1000
    }
  }

  let Rv_max = 0
  let Rv_acum = 0
  let tieneCondensacion = false
  let posCondensacion = null

  for (let i = 0; i < capas.length; i++) {
    const c = capas[i]
    if (c.esCamara) {
      Rv_acum += 0.1
      continue
    }

    const mu = parseFloat(c.mu) || 0
    const esp = parseFloat(c.esp) || 0
    if (mu > 0 && esp > 0) {
      const dv = (mu * esp) / 1000
      Rv_max = Math.max(Rv_max, dv)
      Rv_acum += dv

      const pv_capa = pv_i - (delta_p * Rv_acum) / Sd_total
      const psat_capa = P_sat(Ti - ((Ti - Te) * Rv_acum) / (Sd_total || 1))

      if (pv_capa > psat_capa && !tieneCondensacion) {
        tieneCondensacion = true
        posCondensacion = i
      }
    }
  }

  return {
    tieneCondensacion,
    posCondensacion,
    pvInterno: pv_i,
    psatInterno: psat_i,
    pvExterno: (HR / 100) * P_sat(Te),
    psatExterno: P_sat(Te),
    sd_total: Sd_total,
    rv_max: Rv_max,
    tipo: tipoElem,
  }
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

  // Si ya cumple, no hay sugerencias necesarias
  if (uActual <= uMax) {
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

// ─── Validar compliance térmico con sugerencias ────────────────────────
export function validarCumplimientoTermico(solucion, uMax, soluciones, filtros = {}) {
  if (!solucion || !uMax) return null

  const uActual = parseFloat(solucion.u) || null
  if (!uActual) return { ok: false, error: 'U no calculada' }

  const cumple = uActual <= uMax
  const mejoras = sugerirMejorasTermicas(solucion, soluciones, uMax, filtros)

  return {
    cumple,
    uActual,
    uMax,
    diferencia: uActual - uMax,
    mejoras: mejoras?.sugerencias || [],
    recomendacion: mejoras?.recomendacion || null,
  }
}
