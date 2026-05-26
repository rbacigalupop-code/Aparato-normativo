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

  // Detectar condensación: pv_real > pv_sat
  const ifaces = []
  let condensaMes = false
  let tasaCondTotalMes = 0  // suma de tasas en kg/m²·s (debería ser solo positiva)
  for (let i = 1; i < pv_real_iface.length - 1; i++) {  // ignorar superficies externas (i=0 y final)
    const pr = pv_real_iface[i]
    const ps = pv_sat_iface[i]
    const exceso = pr - ps
    const riesgo = exceso > 0
    if (riesgo) condensaMes = true
    // Tasa de condensación simplificada (kg/m²·s):
    // g = δ · (pv_real_input - pv_sat_iface) / Sd_input_to_iface
    // Para simplificación, usamos exceso / Sd promedio.
    const tasa = riesgo ? Math.max(0, DELTA_AIRE * exceso / Math.max(0.001, Sd[i])) : 0
    tasaCondTotalMes += tasa
    ifaces.push({
      i,
      T:        Math.round(T_iface[i] * 10) / 10,
      pv_real:  Math.round(pr),
      pv_sat:   Math.round(ps),
      margen:   Math.round(ps - pr),
      riesgo,
      tasa_kg_m2_s: tasa,
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

    // Para cada interfaz interna, actualizar acumulación
    for (let i = 0; i < numIfaces; i++) {
      const iface = paso.ifaces[i]
      if (!iface) continue
      if (iface.riesgo) {
        // Condensa este mes
        const delta = iface.tasa_kg_m2_s * SEG_POR_MES
        acumPorInterfaz[i] += delta
      } else {
        // Evaporación simplificada: si hay agua acumulada, se seca con factor
        // proporcional al déficit (mes seco)
        if (acumPorInterfaz[i] > 0) {
          // Tasa de evaporación aprox: 30% del exceso por mes (modelo simplificado)
          const evapRate = Math.min(acumPorInterfaz[i], acumPorInterfaz[i] * 0.30)
          acumPorInterfaz[i] = Math.max(0, acumPorInterfaz[i] - evapRate)
        }
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
