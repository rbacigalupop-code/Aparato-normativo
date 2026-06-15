// ─────────────────────────────────────────────────────────────────────────────
// informe_agregador.js — Agrega los resultados de TODOS los análisis del módulo
// Energético Pro en un solo objeto, listo para mostrar en el informe ejecutivo
// o exportar a PDF.
//
// Hace los cálculos en cadena: demanda → CEV → renovables → priorización.
// ─────────────────────────────────────────────────────────────────────────────

import { balanceTermicoAnual, envolventeFromCalcUInit, ventanasFromFachadas, FACTOR_SOLAR_VIDRIOS } from './demanda.js'
import { analizarFV, analizarSolarTermico, analizarBdC, estimarDemandaTermica } from './renovables.js'
import { calcularCEVEstimada, compararContraBenchmarks } from './cev.js'
import { obtenerHDD18 } from '../../data/grados_dia.js'
import { zonaClimaDeOGUC } from '../../data/zona_clima.js'
import { BENCHMARKS_CHILE, FACTOR_CO2, PRIORIDADES_INVERSION } from '../../data/cev_chile.js'
import { TARIFA_ELEC_DEFAULT, COMBUSTIBLES_CALEFACCION, clpKwhUtil, zonaOGUCaMacrozona } from '../../data/combustibles.js'

const VALOR_UF_DEFAULT = 1800  // UF típica vivienda media chilena

/**
 * Ejecuta todos los análisis del módulo y devuelve el bundle completo.
 *
 * @param {object} params - { proy, calcUInit, fachadas, valorUF, personas }
 */
export function agregarInforme({
  proy = {},
  calcUInit = {},
  fachadas = [],
  valorUF = VALOR_UF_DEFAULT,
  personas = 4,
  consumoElecAnual = 4200,
  superficieUtil = null,
} = {}) {
  const cfg = proy.configEnergetica || {}
  const comunaKey = cfg.comunaKey || ''
  const zonaEf  = zonaClimaDeOGUC(proy.zona, comunaKey || proy.comuna)
  const tarifaElec = cfg.tarifaElec ?? TARIFA_ELEC_DEFAULT
  const hdd18 = obtenerHDD18(comunaKey, zonaEf)
  const areaUtil = superficieUtil || proy.superficie || 100

  // ── 1. BALANCE TÉRMICO ANUAL ─────────────────────────────────────────────
  const elementos = envolventeFromCalcUInit(calcUInit)
  const ventanas  = ventanasFromFachadas(fachadas)
  const balance = balanceTermicoAnual({
    elementos,
    areaUtil,
    volumen: areaUtil * 2.5,
    ach: 0.8,
    areasVidrio: ventanas.areasVidrio,
    factorSolar: FACTOR_SOLAR_VIDRIOS.dvh_4_12_4,
    factorProteccion: 1.0,
    comunaKey, zonaClima: zonaEf,
  })

  // ── 2. CEV ESTIMADA ──────────────────────────────────────────────────────
  const cev = calcularCEVEstimada({
    demandaKwhM2Anio: balance.kwhM2Anio,
    combustibleCalef: cfg.combustibleCalef || 'lena_no_cert',
    tieneFV: false,
    tieneST: false,
    tieneBdC: false,
  })

  // ── 3. COMPARATIVAS ──────────────────────────────────────────────────────
  const comparativas = compararContraBenchmarks(balance.kwhM2Anio, BENCHMARKS_CHILE)

  // ── 4. ANÁLISIS RENOVABLES ───────────────────────────────────────────────
  const fv = analizarFV({
    consumoKwhAnual: consumoElecAnual, proy, tarifaElec, fraccionCobertura: 1.0,
  })

  const st = analizarSolarTermico({
    personas, proy, valorUF, tarifaElec,
  })

  const demandaTermica = estimarDemandaTermica(proy, calcUInit, hdd18)
  const bdcAerotermia = analizarBdC({
    demandaTermicaKwh: demandaTermica,
    potenciaTermicaKw: 8, proy, tipoBdC: 'aerotermia_agua', tarifaElec,
  })

  // ── 5. COSTOS Y EMISIONES ANUALES (situación actual) ─────────────────────
  // Macrozona de precios desde la zona OFICIAL DS N°15 (no la climática zonaEf)
  const macrozona = cfg.macrozona || zonaOGUCaMacrozona(proy.zona || 'D')
  const combId = cfg.combustibleCalef || 'lena_no_cert'
  const cu = clpKwhUtil(combId, macrozona, tarifaElec) || 80
  const costoCalefaccionAnual = Math.round(balance.demandaNeta * cu)
  const costoElecAnual = Math.round(consumoElecAnual * tarifaElec)
  const costoEnergeticoAnual = costoCalefaccionAnual + costoElecAnual

  // Emisiones anuales totales
  const combDef = COMBUSTIBLES_CALEFACCION.find(c => c.id === combId)
  const co2Calefaccion = Math.round(balance.demandaNeta * (combDef?.co2_kg_kwh ?? 0.30))
  const co2Electricidad = Math.round(consumoElecAnual * 0.40)
  const co2TotalAnual = co2Calefaccion + co2Electricidad

  // ── 6. PRIORIZACIÓN DE INVERSIONES ───────────────────────────────────────
  // Tomamos las 3-5 mejoras con mejor relación impacto/inversión según contexto
  const recomendaciones = []
  if (balance.kwhM2Anio > 90) {
    recomendaciones.push({
      titulo: 'Aumentar aislante del techo',
      costoClp: 800000,
      ahorroKwhAnio: Math.round(balance.perdidas.envolvente * 0.25),
      ahorroClpAnio: Math.round(balance.perdidas.envolvente * 0.25 * cu),
      payback:  null,
      impacto: 'Reduce 25-35% pérdidas envolvente',
    })
  }
  if (balance.kwhM2Anio > 130) {
    recomendaciones.push({
      titulo: 'Sellar grietas y mejorar hermeticidad',
      costoClp: 250000,
      ahorroKwhAnio: Math.round(balance.perdidas.infiltracion * 0.40),
      ahorroClpAnio: Math.round(balance.perdidas.infiltracion * 0.40 * cu),
      impacto: 'ACH baja de 1.2 a 0.7 — reduce 40% pérdidas por aire',
    })
  }
  if (fv.paybackAnios && fv.paybackAnios < 10) {
    recomendaciones.push({
      titulo: `Solar fotovoltaico ${fv.kWp} kWp`,
      costoClp: fv.costo,
      ahorroKwhAnio: fv.produccion,
      ahorroClpAnio: fv.ahorroClp,
      payback: fv.paybackAnios,
      impacto: `Cubre ${Math.round(fv.cobertura * 100)}% del consumo eléctrico`,
    })
  }
  if (st.paybackAnios && st.paybackAnios < 12) {
    recomendaciones.push({
      titulo: `Solar térmico ${st.sistema.acum_l}L`,
      costoClp: st.costoNeto,
      ahorroKwhAnio: st.energiaSolar,
      ahorroClpAnio: st.ahorroClp,
      payback: st.paybackAnios,
      impacto: `Cubre ${Math.round(st.cobertura * 100)}% del agua caliente`,
    })
  }
  if (bdcAerotermia?.ahorroClp > 100000) {
    recomendaciones.push({
      titulo: 'Bomba de calor aerotérmica',
      costoClp: bdcAerotermia.inversion,
      ahorroKwhAnio: Math.round(demandaTermica * 0.6),
      ahorroClpAnio: bdcAerotermia.ahorroClp,
      payback: bdcAerotermia.paybackAnios,
      impacto: `COP corregido ${bdcAerotermia.cop} en tu clima`,
    })
  }

  // Calcular payback faltante en recomendaciones
  for (const r of recomendaciones) {
    if (r.payback == null && r.ahorroClpAnio > 0) {
      r.payback = Math.round(r.costoClp / r.ahorroClpAnio * 10) / 10
    }
  }

  // Ordenar por payback ascendente
  recomendaciones.sort((a, b) => (a.payback || 999) - (b.payback || 999))

  // CEV proyectada si se aplican las recomendaciones
  const cevConMejoras = calcularCEVEstimada({
    demandaKwhM2Anio: balance.kwhM2Anio * 0.65,  // mejora típica del 35% con paquete
    combustibleCalef: combId,
    tieneFV: !!recomendaciones.find(r => r.titulo.includes('fotovoltaico')),
    tieneST: !!recomendaciones.find(r => r.titulo.includes('Solar térmico')),
    tieneBdC: !!recomendaciones.find(r => r.titulo.includes('Bomba de calor')),
  })

  return {
    // Identificación
    proyecto:    { nombre: proy.nombre || 'Proyecto sin nombre', comuna: comunaKey, zona: zonaEf, areaUtil },
    fecha:       new Date().toISOString().slice(0, 10),

    // Sección 1: estado actual
    balance,
    cev,
    comparativas,

    // Sección 2: costos y emisiones
    costos: {
      calefaccion: costoCalefaccionAnual,
      electricidad: costoElecAnual,
      total: costoEnergeticoAnual,
      tarifaElec, combId, combNombre: combDef?.nombre || combId,
    },
    emisiones: {
      calefaccion: co2Calefaccion,
      electricidad: co2Electricidad,
      total: co2TotalAnual,
      total30anios: co2TotalAnual * 30,
    },

    // Sección 3: renovables analizadas
    renovables: { fv, st, bdc: bdcAerotermia },

    // Sección 4: recomendaciones priorizadas
    recomendaciones,

    // Sección 5: proyección con mejoras
    cevProyectada: cevConMejoras,
    mejoraDemanda: Math.round((1 - 0.65) * 100), // 35% mejora típica
  }
}
