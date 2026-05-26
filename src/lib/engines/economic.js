// ─────────────────────────────────────────────────────────────────────────────
// economic.js — Motor de cálculo costo-beneficio para correcciones térmicas.
//
// Calcula:
//   · Ahorro térmico anual (kWh/año) por mejora de U
//   · Costo de la intervención (CLP)
//   · Ahorro económico (CLP/año) según combustible de calefacción
//   · Payback simple y descontado
//   · Emisiones de CO₂ evitadas
//
// Fórmulas:
//   Q_anual_perdido(U)  = U · A · HDD18 · 24 / 1000        [kWh/año]
//   ahorro_kWh          = (U_antes - U_despues) · A · HDD18 · 24 / 1000
//   ahorro_CLP_año      = ahorro_kWh · CLP_kWh_util_combustible
//   payback_simple      = costo_inversion / ahorro_CLP_año
//
// Donde:
//   U: transmitancia [W/m²K]
//   A: área del elemento [m²]
//   HDD18: grados-día calefacción base 18°C [°C·día]
//   CLP_kWh_util: precio CLP por kWh útil (ya considera η del sistema)
// ─────────────────────────────────────────────────────────────────────────────

import {
  COMBUSTIBLES_CALEFACCION,
  TARIFA_ELEC_DEFAULT,
  zonaOGUCaMacrozona,
  clpKwhUtil,
} from '../../data/combustibles.js'
import { calcularCostoIntervencion } from '../../data/costos_intervencion.js'
import { obtenerHDD18 } from '../../data/grados_dia.js'

/**
 * Calcula el ahorro térmico anual por mejorar U.
 *
 * @param {number} uAntes     - U del elemento sin corregir [W/m²K]
 * @param {number} uDespues   - U del elemento corregido [W/m²K]
 * @param {number} areaM2     - Área del elemento [m²]
 * @param {number} hdd18      - Grados-día calefacción base 18 [°C·día]
 * @returns {number} kWh/año ahorrados (≥ 0)
 */
export function ahorroTermicoAnual(uAntes, uDespues, areaM2, hdd18) {
  if (!uAntes || !uDespues || !areaM2 || !hdd18) return 0
  const deltaU = Math.max(0, uAntes - uDespues)
  return (deltaU * areaM2 * hdd18 * 24) / 1000
}

/**
 * Calcula la economía (ahorro CLP/año) usando el combustible configurado.
 *
 * @param {number} ahorroKwh        - Ahorro térmico anual [kWh/año]
 * @param {object} configEnergetica - { combustibleCalef, macrozona, tarifaElec }
 * @returns {{ahorroClp:number, clpKwhUtil:number, combustibleId:string}}
 */
export function ahorroEconomicoAnual(ahorroKwh, configEnergetica) {
  const {
    combustibleCalef = 'lena_no_cert',
    macrozona        = 'centro',
    tarifaElec       = TARIFA_ELEC_DEFAULT,
  } = configEnergetica || {}

  const cu = clpKwhUtil(combustibleCalef, macrozona, tarifaElec)
  if (cu == null) return { ahorroClp: 0, clpKwhUtil: 0, combustibleId: combustibleCalef }

  return {
    ahorroClp:    Math.round(ahorroKwh * cu),
    clpKwhUtil:   Math.round(cu * 10) / 10,
    combustibleId: combustibleCalef,
  }
}

/**
 * Calcula emisiones de CO₂ evitadas por año.
 *
 * @param {number} ahorroKwh        - Ahorro térmico anual [kWh/año]
 * @param {string} combustibleId    - id del combustible
 * @returns {number} kg CO₂ evitados al año
 */
export function emisionesEvitadasAnual(ahorroKwh, combustibleId) {
  const c = COMBUSTIBLES_CALEFACCION.find(x => x.id === combustibleId)
  if (!c) return 0
  return Math.round(ahorroKwh * (c.co2_kg_kwh || 0))
}

/**
 * Payback simple: costo / ahorro anual. Devuelve años.
 */
export function paybackSimple(costoClp, ahorroClpAnio) {
  if (!ahorroClpAnio || ahorroClpAnio <= 0) return null
  return costoClp / ahorroClpAnio
}

/**
 * Payback descontado a tasa anual (5% default). Suma años hasta que el
 * VAN acumulado iguale el costo.
 */
export function paybackDescontado(costoClp, ahorroClpAnio, tasa = 0.05, maxAnios = 50) {
  if (!ahorroClpAnio || ahorroClpAnio <= 0) return null
  let acumulado = 0
  for (let n = 1; n <= maxAnios; n++) {
    acumulado += ahorroClpAnio / Math.pow(1 + tasa, n)
    if (acumulado >= costoClp) {
      // Interpolar al año fraccional para mayor precisión
      const previo = acumulado - (ahorroClpAnio / Math.pow(1 + tasa, n))
      const fraction = (costoClp - previo) / (acumulado - previo)
      return n - 1 + fraction
    }
  }
  return null  // no se paga en maxAnios años
}

/**
 * VAN a N años con tasa de descuento dada.
 */
export function vanProyecto(costoClp, ahorroClpAnio, anios = 30, tasa = 0.05) {
  if (!ahorroClpAnio || ahorroClpAnio <= 0) return -costoClp
  let van = -costoClp
  for (let n = 1; n <= anios; n++) {
    van += ahorroClpAnio / Math.pow(1 + tasa, n)
  }
  return Math.round(van)
}

/**
 * Función agregadora: dado una corrección, los datos del elemento y la
 * configuración energética del proyecto, devuelve el análisis económico
 * completo para mostrar en la UI.
 *
 * @param {object} params
 *   correccion: el objeto correccion devuelto por generarCorrecciones()
 *   uAntes:     U del caso sin la corrección [W/m²K]
 *   areaM2:     área del elemento (si null usa 10 m² como referencia)
 *   proy:       el proyecto (de App.jsx) — necesita comuna y zona
 *   configEnergetica: { combustibleCalef, macrozona, tarifaElec }
 *
 * @returns {object|null} {
 *   ahorroKwh, ahorroClp, costoTotal, paybackSimpleAnios,
 *   paybackDescAnios, vanProyecto30, emisionesCo2Anual,
 *   detalle: { ... }
 * }
 */
export function analizarCorreccion({
  correccion,
  uAntes,
  areaM2 = 10,
  proy,
  configEnergetica,
}) {
  if (!correccion?.resultado?.U) return null
  const uDespues = parseFloat(correccion.resultado.U)
  const u0       = parseFloat(uAntes)
  if (isNaN(uDespues) || isNaN(u0) || u0 <= uDespues) return null

  // 1) HDD18 por comuna o zona OGUC
  const comunaKey = proy?.comunaKey || proy?.comuna?.toLowerCase()?.replace(/\s/g, '_')
  const hdd18     = obtenerHDD18(comunaKey, proy?.zona)

  // 2) Ahorro kWh anual
  const ahorroKwh = ahorroTermicoAnual(u0, uDespues, areaM2, hdd18)

  // 3) Resolver macrozona si falta
  const macrozona = configEnergetica?.macrozona || zonaOGUCaMacrozona(proy?.zona)

  // 4) Ahorro económico
  const econ = ahorroEconomicoAnual(ahorroKwh, { ...configEnergetica, macrozona })

  // 5) Costo intervención (referencial por correción + factor espesor aislante)
  // Tratamos de extraer el espesor del aislante propuesto del texto de la corrección
  const espesorMatch = correccion.titulo?.match(/(\d+)\s*mm/i)
  const espesorMm    = espesorMatch ? parseInt(espesorMatch[1], 10) : 50
  const costo = calcularCostoIntervencion(correccion, areaM2, espesorMm)
  if (!costo) return null

  // 6) Paybacks
  const psimple = paybackSimple(costo.costoTotal, econ.ahorroClp)
  const pdesc   = paybackDescontado(costo.costoTotal, econ.ahorroClp, 0.05)
  const van30   = vanProyecto(costo.costoTotal, econ.ahorroClp, 30, 0.05)

  // 7) Emisiones evitadas
  const co2 = emisionesEvitadasAnual(ahorroKwh, econ.combustibleId)

  return {
    ahorroKwh:          Math.round(ahorroKwh),
    ahorroClp:          econ.ahorroClp,
    clpKwhUtil:         econ.clpKwhUtil,
    combustibleId:      econ.combustibleId,
    costoTotal:         costo.costoTotal,
    costoUnit:          costo.costoUnit,
    rangoMin:           costo.rangoMin,
    rangoMax:           costo.rangoMax,
    incluye:            costo.incluye,
    paybackSimpleAnios: psimple ? Math.round(psimple * 10) / 10 : null,
    paybackDescAnios:   pdesc   ? Math.round(pdesc * 10) / 10   : null,
    vanProyecto30:      van30,
    emisionesCo2Anual:  co2,
    detalle: {
      uAntes:    u0,
      uDespues:  uDespues,
      areaM2:    areaM2,
      hdd18:     hdd18,
      espesorMm: espesorMm,
      macrozona: macrozona,
    },
  }
}
