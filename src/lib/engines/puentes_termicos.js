// ─────────────────────────────────────────────────────────────────────────────
// puentes_termicos.js (engine) — Cálculo de pérdidas adicionales por PT.
//
// Pérdida lineal anual de un PT: Q = Ψ · L · HDD18 · 24 / 1000 [kWh/año]
// Pérdida total: Σ de todos los PT inventariados.
//
// % de impacto sobre envolvente = Q_PT_total / Q_envolvente
// ─────────────────────────────────────────────────────────────────────────────

import { obtenerPT, PUENTES_TERMICOS } from '../../data/puentes_termicos.js'
import { obtenerHDD18 } from '../../data/grados_dia.js'

/**
 * Calcula la pérdida anual de un único PT.
 *
 * @param {string} ptId    - id del PT (ver puentes_termicos.js)
 * @param {number} longitud_m
 * @param {string} calidad - 'malo' | 'tipico' | 'mejor'
 * @param {number} hdd18
 * @returns {number} kWh/año
 */
export function perdidaPTUnico(ptId, longitud_m, calidad, hdd18) {
  const pt = obtenerPT(ptId)
  if (!pt) return 0
  const psi = pt.psi[calidad] ?? pt.psi.tipico
  if (!psi || !longitud_m || !hdd18) return 0
  return Math.round(psi * longitud_m * hdd18 * 24 / 1000)
}

/**
 * Calcula el inventario completo de PT.
 *
 * @param {Array<{ptId, longitud, calidad}>} inventario
 * @param {object} params - { proy, configEnergetica } para resolver hdd18
 */
export function analizarInventarioPT(inventario, { proy, configEnergetica }) {
  const comunaKey = configEnergetica?.comunaKey || proy?.comunaKey
  const zonaEf = configEnergetica?.zonaDS15 || proy?.zona
  const hdd18 = obtenerHDD18(comunaKey, zonaEf)

  const detalles = []
  let perdidaTotal = 0
  for (const item of inventario || []) {
    if (!item.ptId || !item.longitud) continue
    const pt = obtenerPT(item.ptId)
    if (!pt) continue
    const psi = pt.psi[item.calidad || 'tipico']
    const q = perdidaPTUnico(item.ptId, item.longitud, item.calidad || 'tipico', hdd18)
    perdidaTotal += q
    detalles.push({
      ptId:      item.ptId,
      nombre:    pt.nombre,
      categoria: pt.categoria,
      longitud:  item.longitud,
      calidad:   item.calidad || 'tipico',
      psi,
      perdidaKwh: q,
    })
  }

  return {
    detalles,
    perdidaTotal: Math.round(perdidaTotal),
    hdd18,
  }
}

/**
 * Calcula el % de impacto de los PT sobre las pérdidas totales de envolvente.
 *
 * @param {number} perdidaPT_kwh
 * @param {number} perdidaEnvolvente_kwh
 * @returns {number} 0..100 (porcentaje)
 */
export function porcentajeImpactoPT(perdidaPT_kwh, perdidaEnvolvente_kwh) {
  if (!perdidaEnvolvente_kwh || perdidaEnvolvente_kwh <= 0) return 0
  return Math.round((perdidaPT_kwh / perdidaEnvolvente_kwh) * 1000) / 10
}

/**
 * Categoriza la severidad del impacto de PT.
 * Estudios muestran que en construcción chilena típica los PT suelen aportar
 * 15-30% adicional. > 30% indica fallas constructivas serias.
 */
export function severidadPT(porcentaje) {
  if (porcentaje < 10)  return { nivel: 'bajo',     label: '✅ Excelente',  color: '#16a34a' }
  if (porcentaje < 20)  return { nivel: 'normal',   label: '🟢 Adecuado',    color: '#65a30d' }
  if (porcentaje < 30)  return { nivel: 'medio',    label: '🟡 Mejorable',   color: '#eab308' }
  if (porcentaje < 50)  return { nivel: 'alto',     label: '🟠 Alto',        color: '#f97316' }
  return                       { nivel: 'critico',  label: '🔴 Crítico',     color: '#dc2626' }
}
