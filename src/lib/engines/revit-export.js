// ─────────────────────────────────────────────────────────────────────────────
// revit-export.js — Serializa las soluciones constructivas APLICADAS del proyecto
// a un JSON que RevitMind consume para crear tipos multicapa (muro/losa/cubierta).
//
// Contrato de salida: { proyecto, zona_termica, generado, sistemas: [...] }.
//
// Reglas de mapeo críticas:
//   1. Talora guarda las capas INTERIOR → EXTERIOR; Revit espera EXTERIOR → INTERIOR
//      → el array de capas se INVIERTE.
//   2. Cámara de aire (esCamara) → material "Aire", funcion "air".
//   3. Elemento: muro/tabique → "wall"; techo → "roof"; piso → "floor".
//   4. funcion por capa: air → insulation (λ≤0.06) → structure → membrane → finish.
//   5. U por elemento = U consistente con las capas efectivas (res.U de la entry de
//      Cálculo U cuando las capas vienen de ahí); si no, termica[elem].u; si no, sc.u.
//      RF = sc.rf (valor certificado de ficha, NO recalculado); Rw = sc.ac_rw (ídem).
//   6. Capas efectivas: primero las modificadas en Cálculo U (calcUInit, incluyendo
//      claves compuestas "estId::elem"); si no hay, las del catálogo vía capasDeSC.
//
// Nota: RF y Rw NO se derivan de las capas — provienen de la ficha LOSCAT certificada
// (requieren ensayo NCh850/NCh352 para el expediente DOM). El campo `norma` lo declara.
// ─────────────────────────────────────────────────────────────────────────────

import { SC_CAPAS, BH, ALL_MATS } from '../../data.js'

// Elemento Talora → categoría Revit
const ELEM_A_REVIT = { muro: 'wall', tabique: 'wall', techo: 'roof', piso: 'floor' }
// Solo elementos con capas (la puerta es family instance, no tipo multicapa)
const ELEMS_EXPORTABLES = ['muro', 'techo', 'piso', 'tabique']

/**
 * Resuelve las capas de una solución LOSCAT — espejo de getCapasParaSC (App.jsx).
 * Devuelve capas INTERIOR → EXTERIOR con forma { mat, lam, esp(mm), mu, esCamara }.
 */
export function capasDeSC(sc) {
  if (!sc) return null
  if (sc.capasStruct?.length) {
    return sc.capasStruct.map(c => ({
      mat: c.mat, lam: c.esCamara ? '' : c.lam, esp: c.esp,
      mu: c.esCamara ? '' : c.mu, esCamara: !!c.esCamara,
    }))
  }
  const raw = SC_CAPAS[sc.cod]
  if (raw?.length) return raw
  const bh = BH.find(b => b.cod === sc.cod)
  if (bh?.capas?.length) {
    return bh.capas.map(c => ({ mat: c.n, lam: c.lam, esp: c.esp, mu: c.mu, esCamara: c.esCamara }))
  }
  return (sc.capas || '').split(' | ').map(part => {
    const m = part.trim().match(/^(.*?)\s+([\d.]+)$/)
    if (!m) return null
    const nombre = m[1].trim()
    const isCamara = /camara|aire/i.test(nombre)
    const matDat = ALL_MATS.find(x => x.n.toLowerCase() === nombre.toLowerCase()) || {}
    return {
      mat: nombre, lam: isCamara ? '' : (matDat.lam || ''), esp: m[2],
      mu: isCamara ? '' : (matDat.mu || '1'), esCamara: isCamara,
    }
  }).filter(Boolean)
}

/**
 * Resuelve las capas EFECTIVAS de un elemento + el U consistente con ellas.
 * Espejo de obtenerCapas (App.jsx): prioriza las capas modificadas en Cálculo U.
 * @returns { capas, U } (capas int→ext) o null.
 */
export function capasEfectivas(elemKey, termica, calcUInit) {
  const sc = termica?.[elemKey]?.solucion
  const solCod = sc?.cod
  const entries = Object.entries(calcUInit || {})
    .filter(([k, v]) => (k === elemKey || k.endsWith('::' + elemKey)) && v?.capas?.length)
  if (entries.length && solCod) {
    const match = entries.find(([, v]) => v?.solucion?.cod === solCod)
    if (match) return { capas: match[1].capas, U: match[1].res?.U }
  }
  if (entries.length) return { capas: entries[0][1].capas, U: entries[0][1].res?.U }
  if (sc) {
    const orig = capasDeSC(sc)
    if (orig?.length) return { capas: orig, U: sc.u }
  }
  return null
}

/**
 * Deriva la función Revit de una capa (orden: air → insulation → structure →
 * membrane → finish).
 */
export function funcionCapa(c) {
  if (c.esCamara) return 'air'
  const lam = parseFloat(c.lam)
  if (Number.isFinite(lam) && lam <= 0.06) return 'insulation'
  const n = (c.mat || '').toLowerCase()
  if (/hormig|ladrillo|bloque|acero|metal|madera|clt|osb|albanil/.test(n)) return 'structure'
  if (/barrera|membrana|polietileno|fieltro|lamina|vapor/.test(n)) return 'membrane'
  return 'finish'
}

// Convierte a número finito o null (JSON no admite NaN).
function numOrNull(v) {
  if (v == null || v === '') return null
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Serializa las soluciones constructivas aplicadas del proyecto.
 * @param {object} proy       - proyecto ({ nombre, zona, ... })
 * @param {object} termica    - estado térmico por elemento ({ muro, techo, piso, tabique })
 * @param {object} calcUInit  - capas modificadas en Cálculo U (claves simples o "estId::elem")
 * @returns {object} payload { proyecto, zona_termica, generado, sistemas }
 */
export function exportarSistemasRevit(proy, termica, calcUInit) {
  const sistemas = []
  for (const elem of ELEMS_EXPORTABLES) {
    const sc = termica?.[elem]?.solucion
    if (!sc) continue
    const eff = capasEfectivas(elem, termica, calcUInit)
    if (!eff?.capas?.length) continue

    const capas_ext_a_int = eff.capas
      .map(c => ({
        material: c.esCamara ? 'Aire' : c.mat,
        espesor_mm: numOrNull(c.esp) ?? 0,
        lambda: c.esCamara ? null : numOrNull(c.lam),
        funcion: funcionCapa(c),
      }))
      // Mantener cámaras (aunque no tengan espesor) y capas con espesor real
      .filter(c => c.funcion === 'air' || c.espesor_mm > 0)
      .reverse() // int→ext  →  ext→int

    const U = numOrNull(eff.U) ?? numOrNull(termica?.[elem]?.u) ?? numOrNull(sc.u)

    sistemas.push({
      id: sc.cod,
      nombre: sc.desc,
      elemento: ELEM_A_REVIT[elem],
      zona_termica: proy?.zona ?? null,
      capas_ext_a_int,
      criterio: {
        U,
        RF: sc.rf || null,
        Rw: numOrNull(sc.ac_rw),
      },
      fuente: 'Talora',
      norma: 'LOSCAT Ed.13 / DS N°15',
    })
  }
  return {
    proyecto: proy?.nombre ?? null,
    zona_termica: proy?.zona ?? null,
    generado: new Date().toISOString(),
    sistemas,
  }
}
