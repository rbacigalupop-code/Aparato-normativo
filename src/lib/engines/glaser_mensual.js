// ─────────────────────────────────────────────────────────────────────────────
// glaser_mensual.js — Método Glaser mensual (ISO 13788).
//
// Diferencia clave con Glaser estacionario:
//   · Glaser anual: 1 punto (peor caso) → riesgo binario "condensa / no condensa"
//   · Glaser mensual: 12 puntos + balance → "condensa en invierno y se seca en
//     verano" o "condensa progresivamente sin secarse" (problema serio)
//
// Para cada mes:
//   1. T_ext, HR_ext del mes
//   2. T en cada interfaz por estado-estacionario
//   3. pv_sat en cada interfaz
//   4. pv_real interpolando entre pv_int y pv_ext según Sd acumulado
//   5. Si pv_real > pv_sat → condensación. Estimamos tasa con difusión.
//   6. Si pv_real < pv_sat y había acumulación → secado
//
// Resultado anual por interfaz:
//   · acumulación máxima (kg/m²) — debe ser ≤200 g/m² (criterio ISO 13788)
//   · acumulación al final del año (kg/m²) — debe ser ≤0 (todo se seca)
// ─────────────────────────────────────────────────────────────────────────────

import { climaMensual, pvSat, pvReal, T_INT_DEFAULT, HR_INT_DEFAULT, MESES_LABELS } from '../../data/clima_mensual.js'

// Permeabilidad al vapor del aire (kg / m·s·Pa)
const DELTA_AIRE = 2e-10

/**
 * Calcula Glaser para UN solo mes.
 *
 * @param {Array} capas - [{ lam, esp, mu, esCamara? }] desde el panel Cálculo U
 * @param {number} T_ext, HR_ext, T_int, HR_int
 * @returns {{ T_iface, pv_sat_iface, pv_real_iface, condensa, tasaCond_g_m2_s }}
 */
export function glaserMensualPaso(capas, T_ext, HR_ext, T_int = T_INT_DEFAULT, HR_int = HR_INT_DEFAULT, elemTipo = 'muro') {
  if (!Array.isArray(capas) || capas.length === 0) return null

  // RSi/RSe según orientación (NCh853)
  const RSi = elemTipo === 'techumbre' ? 0.10 : elemTipo === 'piso' ? 0.17 : 0.13
  const RSe = elemTipo === 'piso'      ? 0.04 : 0.04

  // Resistencias térmicas por capa (con cámara como R=0.18)
  const Rs = [RSi]
  for (const c of capas) {
    if (c.esCamara) Rs.push(0.18)
    else {
      const lam = parseFloat(c.lam) || 0.04
      const esp = parseFloat(c.esp) || 0   // espesor en METROS (vía calcGlaser)
      Rs.push(esp / lam)
    }
  }
  Rs.push(RSe)
  const Rtot = Rs.reduce((s, r) => s + r, 0) || 1

  // Temperaturas en cada interfaz (n+1 puntos = capas.length+1)
  // T_int → tras cada capa → T_ext (saliendo de Rs[i] cada paso)
  const T_iface = [T_int]
  let acc = RSi
  for (let i = 0; i < capas.length; i++) {
    acc += Rs[i + 1]
    const T = T_int - (acc / Rtot) * (T_int - T_ext)
    T_iface.push(T)
  }
  // T_iface tiene capas.length + 1 elementos (todas las interfaces entre capas)

  // Sd acumulado (m de aire equivalente)
  const Sd = [0]
  for (const c of capas) {
    if (c.esCamara) Sd.push(Sd[Sd.length - 1] + 0)  // cámara sin resistencia al vapor
    else {
      const mu = parseFloat(c.mu) || 1
      const esp = parseFloat(c.esp) || 0
      Sd.push(Sd[Sd.length - 1] + mu * esp)
    }
  }
  const Sd_total = Sd[Sd.length - 1] || 0.001

  // Presiones de vapor
  const pv_int = pvReal(T_int, HR_int)
  const pv_ext = pvReal(T_ext, HR_ext)

  // pv_real interpola entre pv_int y pv_ext según Sd
  const pv_real_iface = Sd.map(s => pv_int - (s / Sd_total) * (pv_int - pv_ext))
  // pv_sat depende de T en cada interfaz
  const pv_sat_iface  = T_iface.map(T => pvSat(T))

  // Detectar condensación + tasas por FLUJO NETO (ISO 13788 §6.2).
  //
  // En un plano de condensación la presión de vapor se "clava" a pv_sat. La tasa
  // de condensación NETA es el flujo que ENTRA desde el lado caliente menos el
  // que SALE al lado frío:
  //   g_in  = δ·(pv_int − pv_sat_plano) / Sd_in    (interior → plano)
  //   g_out = δ·(pv_sat_plano − pv_ext) / Sd_out   (plano → exterior)
  //   g_cond = g_in − g_out                         (acumulación neta)
  // El modelo anterior usaba δ·exceso/Sd_in (solo g_in con Sd mal) → sobreestimaba
  // la acumulación ~10x. Ver docs/AUDITORIA_CALCULADORA_U.md.
  //
  // En mes seco (sin condensación) un plano con agua almacenada se SECA hacia
  // ambos lados:  g_evap = δ·(pv_sat_plano − pv_int)/Sd_in + δ·(pv_sat_plano − pv_ext)/Sd_out
  // Identificar el ÚNICO plano de condensación: la interfaz con mayor exceso
  // (pv_real − pv_sat). Físicamente ISO 13788 condensa en el punto tangente,
  // no en todas las interfaces supersaturadas — sumarlas sobreestimaría.
  let idxPlano = -1, maxExceso = 0
  for (let i = 1; i < pv_real_iface.length - 1; i++) {
    const ex = pv_real_iface[i] - pv_sat_iface[i]
    if (ex > maxExceso) { maxExceso = ex; idxPlano = i }
  }
  const condensaMes = idxPlano >= 0

  const ifaces = []
  let tasaCondTotalMes = 0  // kg/m²·s (neta, solo en el plano crítico)
  for (let i = 1; i < pv_real_iface.length - 1; i++) {  // ignorar superficies externas
    const pr = pv_real_iface[i]
    const ps = pv_sat_iface[i]
    const esPlano = (i === idxPlano)

    const Sd_in  = Math.max(0.001, Sd[i])               // interior → plano
    const Sd_out = Math.max(0.001, Sd_total - Sd[i])    // plano → exterior

    // Condensación NETA solo en el plano crítico (g_in − g_out)
    const g_in   = DELTA_AIRE * (pv_int - ps) / Sd_in
    const g_out  = DELTA_AIRE * (ps - pv_ext) / Sd_out
    const g_cond = esPlano ? Math.max(0, g_in - g_out) : 0

    // Secado potencial (agua sale del plano hacia ambos lados secos)
    const g_evap = Math.max(0, DELTA_AIRE * (ps - pv_int) / Sd_in)
                 + Math.max(0, DELTA_AIRE * (ps - pv_ext) / Sd_out)

    tasaCondTotalMes += g_cond
    ifaces.push({
      i,
      T:        Math.round(T_iface[i] * 10) / 10,
      pv_real:  Math.round(pr),
      pv_sat:   Math.round(ps),
      margen:   Math.round(ps - pr),
      riesgo:   (pr - ps) > 0,    // supersaturada (para display)
      esPlano,                     // plano de condensación efectivo del mes
      tasa_kg_m2_s:  g_cond,      // condensación neta (0 salvo en el plano)
      evap_kg_m2_s:  g_evap,      // secado potencial
    })
  }

  return {
    condensa: condensaMes,
    tasaCond_g_m2_s: tasaCondTotalMes * 1000,
    T_iface, pv_real_iface, pv_sat_iface,
    ifaces, Rs, Sd, Rtot, Sd_total,
  }
}

/**
 * Análisis anual: corre Glaser para los 12 meses y acumula condensación/secado.
 *
 * @param {Array} capas
 * @param {object} clima - array de climaMensual()
 * @param {string} elemTipo
 * @returns {object}
 */
export function analizarGlaserAnual(capas, clima, elemTipo = 'muro') {
  if (!capas?.length || !clima?.length) return null

  const SEG_POR_MES = 30.4 * 24 * 3600   // ~2.6M segundos/mes

  // Encontrar interfaz crítica: la que tiene mayor riesgo en algún mes
  // Por simplicidad, trackeamos acumulación en CADA interfaz interna
  const numIfaces = capas.length - 1  // interfaces entre capas (n-1)

  const acumPorInterfaz = Array(numIfaces).fill(0)  // kg/m² acumulada
  const peakPorInterfaz = Array(numIfaces).fill(0)  // peak histórico

  const detallesMensual = []
  let mesesConCondensacion = 0

  for (const cm of clima) {
    const paso = glaserMensualPaso(capas, cm.t_ext, cm.hr_ext, cm.t_int, cm.hr_int, elemTipo)
    if (!paso) continue
    if (paso.condensa) mesesConCondensacion++

    // Para cada interfaz interna, actualizar acumulación con flujo neto.
    for (let i = 0; i < numIfaces; i++) {
      const iface = paso.ifaces[i]
      if (!iface) continue
      if (iface.riesgo) {
        // Condensa este mes: suma la tasa NETA (g_in − g_out) × segundos/mes
        acumPorInterfaz[i] += iface.tasa_kg_m2_s * SEG_POR_MES
      } else if (acumPorInterfaz[i] > 0) {
        // Mes seco con agua almacenada: se evapora a la tasa FÍSICA de secado
        // (g_evap × segundos/mes), sin pasar de 0.
        const secado = iface.evap_kg_m2_s * SEG_POR_MES
        acumPorInterfaz[i] = Math.max(0, acumPorInterfaz[i] - secado)
      }
      if (acumPorInterfaz[i] > peakPorInterfaz[i]) peakPorInterfaz[i] = acumPorInterfaz[i]
    }

    detallesMensual.push({
      mes:     cm.mes,
      label:   cm.label,
      t_ext:   cm.t_ext,
      hr_ext:  cm.hr_ext,
      condensa: paso.condensa,
      ifaces:  paso.ifaces,
      acumulado: [...acumPorInterfaz],
    })
  }

  // Determinar la interfaz crítica
  let idxCritica = 0
  let peakCritica = 0
  for (let i = 0; i < peakPorInterfaz.length; i++) {
    if (peakPorInterfaz[i] > peakCritica) {
      peakCritica = peakPorInterfaz[i]
      idxCritica = i
    }
  }

  // Criterios ISO 13788
  // · Peak ≤ 0.2 kg/m² (200 g/m²): aceptable
  // · Acumulación final año ≤ 0: el material se seca el año
  const peakCriticaG = peakCritica * 1000  // a gramos
  const acumFinalCriticaG = acumPorInterfaz[idxCritica] * 1000

  const cumple = peakCriticaG <= 200 && acumFinalCriticaG <= 1  // pequeña tolerancia

  return {
    mesesConCondensacion,
    detallesMensual,
    acumPorInterfaz: acumPorInterfaz.map(v => Math.round(v * 1000 * 100) / 100),  // g/m² con 2 decimales
    peakPorInterfaz: peakPorInterfaz.map(v => Math.round(v * 1000 * 100) / 100),
    interfazCritica: {
      idx: idxCritica,
      peakG: Math.round(peakCriticaG * 100) / 100,
      acumFinalG: Math.round(acumFinalCriticaG * 100) / 100,
    },
    cumpleISO13788: cumple,
    veredicto: cumple
      ? (mesesConCondensacion === 0 ? 'sin_riesgo' : 'autoseca')
      : (acumFinalCriticaG > 1 ? 'acumula' : 'peak_alto'),
  }
}
