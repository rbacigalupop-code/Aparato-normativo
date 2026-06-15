// ─────────────────────────────────────────────────────────────────────────────
// renovables.js — Motor de cálculo para sistemas de energía renovable.
//
// Calcula:
//   · Solar fotovoltaico: dimensionamiento, producción, Net-billing, payback
//   · Solar térmico ACS: cobertura, ahorro, franquicia Ley 20.365
//   · Bombas de calor: COP corregido, ahorro vs combustión, payback
//
// Fórmulas clave:
//
//   PRODUCCIÓN FV ANUAL:
//     E_anual_kWh = P_kWp × FC_anual × 8760
//     o equivalente: P_kWp × irrad_anual × 365 × PR
//
//   NET-BILLING (Ley 21.118):
//     valor_inyeccion = energía_inyectada × tarifa × factor_NB
//     factor_NB ≈ 0.62 (precio inyección / precio compra)
//
//   COBERTURA SOLAR TÉRMICO:
//     E_solar = m²_col × eficiencia × irrad_anual × 365
//     %cobertura = min(E_solar / E_demanda_ACS, 1)
//
//   COP REAL BdC:
//     COP_real = COP_nominal × factor(Te_invierno)
//     Ahorro_kWh = (E_calefaccion / COP_real) − (E_calefaccion / η_actual)
// ─────────────────────────────────────────────────────────────────────────────

import {
  PRECIOS_FV, FACTOR_NETBILLING, VIDA_UTIL_FV_ANIOS, DEGRADACION_ANUAL_FV, PR_FV,
  PRECIOS_SOLAR_TERMICO, FRANQUICIA_LEY_20365, COBERTURA_ACS, VIDA_UTIL_ST_ANIOS,
  EFICIENCIA_COLECTOR,
  PRECIOS_BDC, factorCopPorTexterior,
} from '../../data/precios_renovables.js'
import {
  obtenerIrradiacion, obtenerTinvierno,
} from '../../data/irradiacion_solar.js'
import {
  COMBUSTIBLES_CALEFACCION, TARIFA_ELEC_DEFAULT, clpKwhUtil, zonaOGUCaMacrozona,
} from '../../data/combustibles.js'
import { zonaClimaDeOGUC } from '../../data/zona_clima.js'

// ═════════════════════════════════════════════════════════════════════════════
// SOLAR FOTOVOLTAICO
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Dimensiona un sistema FV para cubrir un consumo eléctrico anual dado.
 *
 * @param {number} consumoKwhAnual - Consumo eléctrico anual (kWh)
 * @param {object} irrad - { anual: kWh/m²/día, fc_fv: factor de capacidad }
 * @param {number} fraccionCobertura - 0..1, qué fracción del consumo cubrir
 * @returns {number} kWp recomendado (redondeado a 0.5)
 */
export function dimensionarFV(consumoKwhAnual, irrad, fraccionCobertura = 1.0) {
  if (!consumoKwhAnual || !irrad) return 0
  const objetivo = consumoKwhAnual * fraccionCobertura
  const especPorKwp = irrad.anual * 365 * PR_FV   // kWh/kWp·año
  if (!especPorKwp) return 0
  const kWp = objetivo / especPorKwp
  // Redondear a múltiplos de 0.5 (los paneles vienen de ~400-550W)
  return Math.ceil(kWp * 2) / 2
}

/**
 * Producción anual estimada de un sistema FV.
 *
 * @param {number} kWp - Potencia instalada
 * @param {object} irrad - irradiación
 * @returns {number} kWh/año
 */
export function producirFV(kWp, irrad) {
  if (!kWp || !irrad) return 0
  return Math.round(kWp * irrad.anual * 365 * PR_FV)
}

/**
 * Costo de instalación FV según escala (tier).
 */
export function costoFV(kWp) {
  if (!kWp) return 0
  const tier = kWp <= 3       ? PRECIOS_FV.tier_residencial_chico
             : kWp <= 10      ? PRECIOS_FV.tier_residencial_grande
             :                  PRECIOS_FV.tier_comercial
  return Math.round(kWp * tier.clp_por_kwp)
}

/**
 * Ahorro económico anual con Net-billing.
 * Asume que toda la producción "neta" se aprovecha (autoconsumo o inyección).
 *
 * @param {number} produccionKwh - Producción FV anual
 * @param {number} consumoKwh    - Consumo eléctrico anual del hogar
 * @param {number} tarifaCompra  - CLP/kWh tarifa BT1-A
 * @returns {{ ahorroClp, autoconsumo, inyeccion }}
 */
export function ahorroNetBilling(produccionKwh, consumoKwh, tarifaCompra) {
  if (!produccionKwh || !tarifaCompra) {
    return { ahorroClp: 0, autoconsumo: 0, inyeccion: 0 }
  }
  // Autoconsumo simultáneo típico residencial: ~30-40% de la generación
  // (el resto se inyecta porque genera más cuando los habitantes no están)
  const factorAutoconsumo = 0.35
  const autoconsumo = Math.min(produccionKwh * factorAutoconsumo, consumoKwh)
  const inyeccion   = Math.max(0, produccionKwh - autoconsumo)
  // El autoconsumo evita comprar al precio completo
  // La inyección se paga al precio del Net-billing
  const ahorro = autoconsumo * tarifaCompra + inyeccion * tarifaCompra * FACTOR_NETBILLING
  return {
    ahorroClp: Math.round(ahorro),
    autoconsumo: Math.round(autoconsumo),
    inyeccion:   Math.round(inyeccion),
  }
}

/**
 * Análisis FV completo para un proyecto.
 *
 * @param {object} params
 *   consumoKwhAnual: kWh/año del hogar (default 4200 estimado para Chile)
 *   proy: el proyecto (para comuna y zona)
 *   tarifaElec: CLP/kWh (override opcional)
 *   kWpForzar: si está, usa este kWp en lugar de dimensionar automáticamente
 *   fraccionCobertura: 0..1
 */
export function analizarFV({
  consumoKwhAnual = 4200,
  proy = {},
  tarifaElec = TARIFA_ELEC_DEFAULT,
  kWpForzar = null,
  fraccionCobertura = 1.0,
}) {
  const comunaKey = proy.configEnergetica?.comunaKey || proy.comuna?.toLowerCase()?.replace(/\s/g, '_')
  const zonaEfectiva = zonaClimaDeOGUC(proy.zona, comunaKey || proy.comuna)
  const irrad = obtenerIrradiacion(comunaKey, zonaEfectiva)

  const kWp = kWpForzar != null
    ? Number(kWpForzar)
    : dimensionarFV(consumoKwhAnual, irrad, fraccionCobertura)

  const produccion = producirFV(kWp, irrad)
  const costo      = costoFV(kWp)
  const econ       = ahorroNetBilling(produccion, consumoKwhAnual, tarifaElec)
  const payback    = econ.ahorroClp > 0 ? costo / econ.ahorroClp : null

  // VAN 25 años con degradación 0.5%/año y tasa descuento 5%
  let van = -costo
  for (let n = 1; n <= VIDA_UTIL_FV_ANIOS; n++) {
    const degradacion = Math.pow(1 - DEGRADACION_ANUAL_FV, n - 1)
    van += (econ.ahorroClp * degradacion) / Math.pow(1.05, n)
  }

  // Emisiones evitadas: cada kWh FV evita ~0.40 kg CO₂ del SIC chileno
  const co2Anual = Math.round(produccion * 0.40)

  return {
    kWp, produccion, costo,
    ahorroClp:        econ.ahorroClp,
    autoconsumo:      econ.autoconsumo,
    inyeccion:        econ.inyeccion,
    paybackAnios:     payback ? Math.round(payback * 10) / 10 : null,
    van25:            Math.round(van),
    co2EvitadoAnual:  co2Anual,
    co2Evitado25:     co2Anual * VIDA_UTIL_FV_ANIOS,
    irrad,
    cobertura:        produccion > 0 && consumoKwhAnual > 0
                       ? Math.min(1, produccion / consumoKwhAnual) : 0,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SOLAR TÉRMICO (ACS)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Demanda ACS anual de un hogar.
 * Norma: 40 L/persona/día a 45°C, agua fría ~15°C → ΔT 30°C.
 * Q = m × Cp × ΔT
 */
export function demandaACS(personas, tFria = 15, tCaliente = 45) {
  const litros_dia = personas * 40
  const kWh_dia = litros_dia * 1 * (tCaliente - tFria) * 4.186 / 3600   // kg × kJ/kgK × K / 3600 = kWh
  return Math.round(kWh_dia * 365)
}

/**
 * Recomienda el sistema solar térmico según personas.
 */
export function recomendarSistemaST(personas) {
  if (personas <= 4)  return PRECIOS_SOLAR_TERMICO.sistema_200l_2col
  if (personas <= 6)  return PRECIOS_SOLAR_TERMICO.sistema_300l_3col
  return PRECIOS_SOLAR_TERMICO.sistema_500l_4col
}

/**
 * Aplica la franquicia Ley 20.365 según UF de la vivienda.
 */
export function aplicarFranquicia20365(costo, valorUF) {
  if (!valorUF || valorUF <= FRANQUICIA_LEY_20365.uf_corte_total) {
    return Math.round(costo * FRANQUICIA_LEY_20365.pct_descuento_total)
  }
  if (valorUF <= FRANQUICIA_LEY_20365.uf_corte_parcial) {
    return Math.round(costo * FRANQUICIA_LEY_20365.pct_descuento_parcial)
  }
  return 0
}

/**
 * Análisis solar térmico completo.
 */
export function analizarSolarTermico({
  personas = 4,
  proy = {},
  valorUF = 2000,
  combustibleACS = null,   // si null, asume electricidad (peor caso)
  tarifaElec = TARIFA_ELEC_DEFAULT,
}) {
  const zonaEfectiva = zonaClimaDeOGUC(proy.zona, proy.configEnergetica?.comunaKey || proy.comuna)
  const sistema = recomendarSistemaST(personas)
  const demanda = demandaACS(personas)
  const cobertura = COBERTURA_ACS[zonaEfectiva] || 0.65

  const energiaSolar = Math.round(demanda * cobertura)
  const energiaApoyo = demanda - energiaSolar

  // Ahorro económico: lo que dejas de gastar en el combustible actual
  const macrozona = proy.configEnergetica?.macrozona || zonaOGUCaMacrozona(proy.zona || 'D')
  const combId = combustibleACS || proy.configEnergetica?.combustibleCalef || 'elec_resistiva'
  const cu = clpKwhUtil(combId, macrozona, tarifaElec) || (tarifaElec / 0.95)
  const ahorroClp = Math.round(energiaSolar * cu)

  // Costo neto tras franquicia
  const descuento = aplicarFranquicia20365(sistema.clp_total, valorUF)
  const costoNeto = sistema.clp_total - descuento

  const payback = ahorroClp > 0 ? costoNeto / ahorroClp : null

  // VAN 20 años
  let van = -costoNeto
  for (let n = 1; n <= VIDA_UTIL_ST_ANIOS; n++) {
    van += ahorroClp / Math.pow(1.05, n)
  }

  // CO₂ evitado
  const combDef = COMBUSTIBLES_CALEFACCION.find(c => c.id === combId)
  const co2Anual = Math.round(energiaSolar * (combDef?.co2_kg_kwh || 0.40))

  return {
    sistema,
    demanda,
    cobertura,
    energiaSolar,
    energiaApoyo,
    costoBruto: sistema.clp_total,
    descuento,
    costoNeto,
    ahorroClp,
    paybackAnios: payback ? Math.round(payback * 10) / 10 : null,
    van20: Math.round(van),
    co2EvitadoAnual: co2Anual,
    co2Evitado20: co2Anual * VIDA_UTIL_ST_ANIOS,
    combustibleId: combId,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// BOMBAS DE CALOR
// ═════════════════════════════════════════════════════════════════════════════

/**
 * COP estacional corregido por temperatura exterior invierno.
 */
export function copEstacional(tipoBdC, tInvierno) {
  const bdc = PRECIOS_BDC[tipoBdC]
  if (!bdc) return 0
  // Geotérmica usa T del suelo ~10-12°C estable → factor casi 1
  if (tipoBdC === 'geotermica') return bdc.cop_nominal
  const factor = factorCopPorTexterior(tInvierno)
  return Math.round(bdc.cop_nominal * factor * 10) / 10
}

/**
 * Análisis BdC: compara contra el sistema actual del proyecto.
 *
 * @param {object} params
 *   demandaTermicaKwh: demanda anual de calefacción (kWh)
 *   potenciaTermicaKw: potencia térmica requerida (kW)
 *   proy: el proyecto
 *   tipoBdC: clave de PRECIOS_BDC
 *   tarifaElec: CLP/kWh
 */
export function analizarBdC({
  demandaTermicaKwh,
  potenciaTermicaKw = 8,
  proy = {},
  tipoBdC = 'split_aire_aire',
  tarifaElec = TARIFA_ELEC_DEFAULT,
}) {
  const bdc = PRECIOS_BDC[tipoBdC]
  if (!bdc) return null

  const comunaKey = proy.configEnergetica?.comunaKey || proy.comuna?.toLowerCase()?.replace(/\s/g, '_')
  const zonaEfectiva = zonaClimaDeOGUC(proy.zona, comunaKey || proy.comuna)
  const tInv = obtenerTinvierno(comunaKey, zonaEfectiva)

  const cop = copEstacional(tipoBdC, tInv)
  const consumoElecBdC = demandaTermicaKwh / cop
  const costoBdC = Math.round(consumoElecBdC * tarifaElec)

  // Sistema actual (referencia para comparar)
  const macrozona = proy.configEnergetica?.macrozona || zonaOGUCaMacrozona(proy.zona || 'D')
  const combActualId = proy.configEnergetica?.combustibleCalef || 'lena_no_cert'
  const cuActual = clpKwhUtil(combActualId, macrozona, tarifaElec) || 80
  const costoActual = Math.round(demandaTermicaKwh * cuActual)

  const ahorroClp = costoActual - costoBdC
  const inversion = Math.round(potenciaTermicaKw * bdc.clp_por_kw_term)
  const payback = ahorroClp > 0 ? inversion / ahorroClp : null

  let van = -inversion
  for (let n = 1; n <= bdc.vida_util; n++) {
    van += ahorroClp / Math.pow(1.05, n)
  }

  // CO₂ evitado: comparativa actual vs BdC (factor SIC ~0.40 kg/kWh elec)
  const combActual = COMBUSTIBLES_CALEFACCION.find(c => c.id === combActualId)
  const co2Actual = demandaTermicaKwh * (combActual?.co2_kg_kwh || 0.40)
  const co2BdC    = consumoElecBdC * 0.40
  const co2EvitadoAnual = Math.round(co2Actual - co2BdC)

  return {
    tipoBdC,
    bdc,
    tInv,
    cop,
    consumoElecBdC: Math.round(consumoElecBdC),
    costoBdC,
    costoActual,
    ahorroClp,
    inversion,
    paybackAnios: payback ? Math.round(payback * 10) / 10 : null,
    vanVidaUtil: Math.round(van),
    co2EvitadoAnual: Math.max(0, co2EvitadoAnual),
    co2EvitadoVidaUtil: Math.max(0, co2EvitadoAnual) * bdc.vida_util,
    combustibleActual: combActualId,
  }
}

/**
 * Helper: estima demanda térmica anual del proyecto a partir de los U-values
 * calculados. Esto es muy simplificado — el cálculo riguroso vendrá en Sprint 3.
 *
 * @param {object} proy - proyecto
 * @param {object} calcUInit - estado de cálculos U del proyecto
 * @param {number} hdd18 - grados-día calefacción base 18°C
 * @returns {number} kWh/año demanda térmica estimada
 */
export function estimarDemandaTermica(proy, calcUInit = {}, hdd18 = 1500) {
  // Áreas referenciales por elemento (sin geometría detallada)
  const AREAS_DEF = { muro: 80, piso: 70, techo: 70, tabique: 30 }
  let qAnual = 0
  for (const [key, data] of Object.entries(calcUInit)) {
    if (!data?.res?.U) continue
    const elemKey = key.includes('::') ? key.split('::').pop() : key
    const area = AREAS_DEF[elemKey] || 40
    const u = parseFloat(data.res.U)
    qAnual += u * area * hdd18 * 24 / 1000  // kWh/año
  }
  // Si no hay cálculos U → estimación gruesa por macrozona climática (A-H)
  if (qAnual === 0) {
    const zonaEf = zonaClimaDeOGUC(proy?.zona, proy?.configEnergetica?.comunaKey || proy?.comuna)
    qAnual = ({ A: 2500, B: 4000, C: 6000, D: 8000, E: 11000, F: 14000, G: 17000, H: 20000 })[zonaEf] || 8000
  }
  return Math.round(qAnual)
}
