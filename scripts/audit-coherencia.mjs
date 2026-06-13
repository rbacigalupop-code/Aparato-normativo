// ═══════════════════════════════════════════════════════════════════════════════
// audit-coherencia.mjs — Barrido de coherencia Fase 0 (QA del sistema)
// Solo lectura. Reporta incongruencias; no modifica nada.
//   node scripts/audit-coherencia.mjs
// ═══════════════════════════════════════════════════════════════════════════════
import {
  ZONAS, SC, BH, SC_CAPAS, REC_USO, AC_DEF, RF_DEF, RF_PISOS, RF_ELEM_REQ,
  PUERTA_U, PUERTA_RF,
} from '../src/data.js'
import { homologarSolucion } from '../src/lib/engines/homologacion.js'

const findings = []
const F = (sev, area, msg) => findings.push({ sev, area, msg })

// ── 1. Monotonicidad de exigencias por zona (A→I debe ser no-creciente) ──────
const Z = Object.keys(ZONAS)  // A..I en orden
for (const elem of ['techo', 'muro', 'piso']) {
  for (let i = 1; i < Z.length; i++) {
    const prev = ZONAS[Z[i - 1]][elem], cur = ZONAS[Z[i]][elem]
    if (cur > prev) {
      F('ALTA', 'ZONAS', `${elem}: zona ${Z[i]} (U≤${cur}) es MENOS exigente que ${Z[i - 1]} (U≤${prev}) — la zona más fría no debería permitir más U`)
    }
  }
}
// Te (temp exterior) debe bajar de A a I (coherencia climática)
for (let i = 1; i < Z.length; i++) {
  if (ZONAS[Z[i]].Te > ZONAS[Z[i - 1]].Te)
    F('MEDIA', 'ZONAS', `Te: zona ${Z[i]} (${ZONAS[Z[i]].Te}°C) más cálida que ${Z[i - 1]} (${ZONAS[Z[i - 1]].Te}°C)`)
}

// ── 2. Integridad del catálogo SC ────────────────────────────────────────────
const ELEMS_OK = ['muro', 'tabique', 'techumbre', 'piso', 'ventana', 'puerta']
const cods = new Set()
for (const s of SC) {
  if (cods.has(s.cod)) F('ALTA', 'SC', `código duplicado: ${s.cod}`)
  cods.add(s.cod)
  if (!ELEMS_OK.includes(s.elem)) F('ALTA', 'SC', `${s.cod}: elem inválido "${s.elem}"`)
  if (typeof s.u !== 'number' || s.u <= 0 || s.u > 8) F('ALTA', 'SC', `${s.cod}: U fuera de rango (${s.u})`)
  if (s.zonas && /[^ABCDEFGHI]/.test(s.zonas)) F('MEDIA', 'SC', `${s.cod}: zonas con letra inválida "${s.zonas}"`)
  if (s.rf && !/^F\d+$/.test(s.rf)) F('MEDIA', 'SC', `${s.cod}: rf con formato raro "${s.rf}"`)
  if (s.ac_rw != null && (typeof s.ac_rw !== 'number' || s.ac_rw < 10 || s.ac_rw > 80)) F('MEDIA', 'SC', `${s.cod}: Rw fuera de rango (${s.ac_rw})`)
  if (!Array.isArray(s.usos) || s.usos.length === 0) F('BAJA', 'SC', `${s.cod}: sin usos`)
  // Coherencia interna: si zonas incluye una zona, ¿el U cumple el U-max de muro/piso/techo de esa zona?
  const elemZ = s.elem === 'tabique' ? null : (s.elem === 'techumbre' ? 'techo' : s.elem)
  if (elemZ && s.zonas) {
    for (const z of s.zonas) {
      const umax = ZONAS[z]?.[elemZ]
      if (umax && s.u > umax + 0.001)
        F('ALTA', 'SC', `${s.cod}: declara aplicar en zona ${z} pero U=${s.u} > U-max ${elemZ} ${umax}`)
    }
  }
}

// ── 3. Referencias huérfanas (BH, SC_CAPAS, REC_USO → deben existir en SC) ────
for (const k of Object.keys(BH || {})) if (!cods.has(k) && !(Array.isArray(BH) && BH.find(b=>b.cod===k))) { /* BH puede ser array */ }
if (Array.isArray(BH)) {
  for (const b of BH) if (b.cod && !cods.has(b.cod)) F('BAJA', 'BH', `BH ${b.cod} no existe en SC (huérfano del simulador U)`)
} else {
  for (const k of Object.keys(BH || {})) if (!cods.has(k)) F('BAJA', 'BH', `BH "${k}" no existe en SC`)
}
for (const k of Object.keys(SC_CAPAS || {})) if (!cods.has(k)) F('BAJA', 'SC_CAPAS', `SC_CAPAS "${k}" no existe en SC (capas huérfanas)`)

// REC_USO: estructura {uso:{categoria:[{cod,razon}|cod]}}
let recRefs = 0, recOrphans = 0
for (const uso of Object.keys(REC_USO || {})) {
  for (const cat of Object.keys(REC_USO[uso] || {})) {
    const arr = REC_USO[uso][cat]
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      const cod = typeof item === 'string' ? item : item?.cod
      if (!cod) continue
      recRefs++
      if (!cods.has(cod)) { recOrphans++; F('MEDIA', 'REC_USO', `${uso}/${cat}: recomienda ${cod} que NO existe en SC`) }
    }
  }
}

// ── 4. Coherencia de exigencias cruzadas por zona×uso×pisos ──────────────────
const USOS = ['Vivienda', 'Educacion', 'Salud', 'Oficina', 'Comercio', 'Industrial']
for (const uso of USOS) {
  for (const pisos of ['1', '2', '4']) {
    for (const elem of ['muro', 'piso', 'techo', 'tabique', 'puerta']) {
      const rf = RF_ELEM_REQ(elem, uso, pisos, 'F')
      if (rf && !/^F\d+$/.test(rf)) F('MEDIA', 'RF_ELEM_REQ', `${elem}/${uso}/${pisos}p: RF formato raro "${rf}"`)
    }
  }
}

// ── 5. Homologación: ninguna SC debe lanzar excepción ────────────────────────
let homOk = 0
for (const s of SC) {
  try { const h = homologarSolucion(s, { rfRequerido: s.rf, rwRequerido: s.ac_rw }); if (h) homOk++ }
  catch (e) { F('ALTA', 'homologacion', `${s.cod}: excepción "${e.message}"`) }
}

// ── Reporte ──────────────────────────────────────────────────────────────────
const bySev = { ALTA: [], MEDIA: [], BAJA: [] }
findings.forEach(f => bySev[f.sev].push(f))
console.log('═══════════════════════════════════════════════════════════════════')
console.log(`AUDITORÍA DE COHERENCIA — ${SC.length} SC · ${new Date().toISOString().slice(0,10)}`)
console.log(`Homologación OK: ${homOk}/${SC.length} · REC_USO refs: ${recRefs} (${recOrphans} huérfanas)`)
console.log('═══════════════════════════════════════════════════════════════════')
for (const sev of ['ALTA', 'MEDIA', 'BAJA']) {
  console.log(`\n── ${sev} (${bySev[sev].length}) ──`)
  bySev[sev].forEach(f => console.log(`  [${f.area}] ${f.msg}`))
}
console.log(`\nTOTAL: ${findings.length} hallazgos (${bySev.ALTA.length} alta · ${bySev.MEDIA.length} media · ${bySev.BAJA.length} baja)`)
