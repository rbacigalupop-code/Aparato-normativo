// ─────────────────────────────────────────────────────────────────────────────
// cev.js — Cálculo de Calificación Energética de Viviendas (CEV) estimada.
//
// La CEV oficial usa CCTE_CL del MINVU con metodología compleja basada en:
//   · Demanda térmica neta (kWh/m²·año)
//   · Emisiones CO2eq por uso de energía
//   · Eficiencia de los sistemas activos
//   · Aporte de renovables
//
// Este módulo calcula una CEV ESTIMADA simplificada usando principalmente la
// demanda térmica + emisiones del combustible de calefacción. Es referencial.
// ─────────────────────────────────────────────────────────────────────────────

import {
  letraCEVporDemanda, percentilChile, FACTOR_CO2, FACTOR_EP, ESCALA_CEV,
} from '../../data/cev_chile.js'
import { COMBUSTIBLES_CALEFACCION } from '../../data/combustibles.js'

/**
 * Calcula la CEV estimada de un proyecto.
 *
 * @param {object} params
 *   demandaKwhM2Anio: demanda térmica neta calculada por demanda.js
 *   combustibleCalef: id del combustible (para emisiones)
 *   tieneFV: boolean — si hay solar FV instalado
 *   tieneST: boolean — si hay solar térmico
 *   tieneBdC: boolean — si tiene bomba de calor
 *
 * @returns {object}
 */
export function calcularCEVEstimada({
  demandaKwhM2Anio,
  combustibleCalef = 'lena_no_cert',
  tieneFV = false,
  tieneST = false,
  tieneBdC = false,
}) {
  const dem = demandaKwhM2Anio || 0

  // Penalizaciones / bonificaciones por uso de combustibles
  // - Leña no certificada en zonas saturadas → penaliza
  // - BdC reemplazando combustión → bonifica (mismo trabajo con menos energía primaria)
  // - Renovables FV/ST → bonifican
  let demandaAjustada = dem
  if (tieneBdC) demandaAjustada *= 0.85
  if (tieneFV) demandaAjustada *= 0.80
  if (tieneST) demandaAjustada *= 0.93
  // Penalización leve si el combustible es muy contaminante
  const combDef = COMBUSTIBLES_CALEFACCION.find(c => c.id === combustibleCalef)
  if (combDef?.co2_kg_kwh > 0.30 && !tieneBdC) demandaAjustada *= 1.05

  const letraInfo = letraCEVporDemanda(demandaAjustada)
  const percentil = percentilChile(demandaAjustada)
  const factorCO2 = FACTOR_CO2[combustibleCalef] ?? 0.30
  const emisionesAnualKg = Math.round(dem * factorCO2)  // kg CO2/m²·año equivalente

  return {
    letra:        letraInfo.letra,
    color:        letraInfo.color,
    descripcion:  letraInfo.desc,
    demandaOriginal:   Math.round(dem),
    demandaAjustada:   Math.round(demandaAjustada),
    percentilChile:    percentil,
    emisionesPorM2:    emisionesAnualKg,
    bonificaciones: {
      fv:  tieneFV,
      st:  tieneST,
      bdc: tieneBdC,
    },
  }
}

/**
 * Comparar el proyecto contra benchmarks chilenos.
 * Retorna posición relativa en cada benchmark (% mejor o peor).
 */
export function compararContraBenchmarks(demandaKwhM2Anio, BENCHMARKS_CHILE) {
  return BENCHMARKS_CHILE.map(b => {
    const dif = demandaKwhM2Anio - b.valor
    const pct = b.valor > 0 ? Math.round((dif / b.valor) * 100) : 0
    return {
      ...b,
      tuValor: demandaKwhM2Anio,
      diferencia: dif,
      porcentaje: pct,
      mejorQue: dif < 0,  // tu valor es menor → eres más eficiente
    }
  })
}
