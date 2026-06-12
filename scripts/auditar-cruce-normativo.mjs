// ═══════════════════════════════════════════════════════════════════════════════
// Auditoría de cruce normativo — LOSCAT × LOFC × LOSCAA
//
// Recorre TODAS las soluciones del catálogo SC y clasifica cada valor declarado
// (U térmico, RF fuego, Rw acústico) según su respaldo:
//
//   Térmico (U):
//     OFICIAL    → la solución cita un código LOSCAT en desc/obs
//     CALCULADO  → declara método de cálculo (ISO 6946 / NCh853 / referencia)
//     SIN_MARCA  → no cita LOSCAT ni declara cálculo → PROHIBIDO (información
//                  sin trazabilidad). El test de CI falla con estos.
//
//   Fuego (RF): cruce contra LOFC Ed.17 (275 ítems + tablas macizos)
//     CRUZADO    → homologación con RF del ítem LOFC ≥ RF declarado
//     PARCIAL    → hay match constructivo pero el RF declarado excede el LOFC
//     SIN_CRUCE  → sin match en LOFC → el RF declarado depende de la cita en obs
//
//   Acústico (Rw): cruce contra LOSCAA Ed.13 2024 (49 soluciones)
//     CRUZADO / PARCIAL / SIN_CRUCE (igual lógica, tolerancia ±3 dB)
//
// Uso:  node scripts/auditar-cruce-normativo.mjs [--json]
// Exit: 0 siempre (es informe). El enforcement duro vive en
//       src/__tests__/cruce_normativo.test.js (sin marca térmico = falla).
// ═══════════════════════════════════════════════════════════════════════════════

import { SC } from '../src/data.js'
import { homologarLOFC, homologarLOSCAA } from '../src/lib/engines/homologacion.js'

const rfMin = (rf) => { const m = String(rf || '').match(/F[-\s]?(\d+)/i); return m ? parseInt(m[1]) : 0 }

// ── Clasificación térmica por trazabilidad declarada ─────────────────────────
function clasificarTermico(s) {
  const texto = `${s.desc || ''} ${s.obs || ''}`
  if (/LOSCAT\s+[0-9]|\(LOSCAT/i.test(texto)) return 'OFICIAL'
  if (/ISO\s*6946|NCh\s*853|calculad|estimad|ley de masa|fabricante|referencial/i.test(texto)) return 'CALCULADO'
  return 'SIN_MARCA'
}

// ── Cruce fuego contra LOFC ──────────────────────────────────────────────────
function clasificarFuego(s) {
  if (!s.rf) return { clase: 'NO_DECLARA' }
  // ¿El propio obs cita LOFC? (cita textual = respaldo declarado)
  const citaLOFC = /LOFC/i.test(`${s.desc || ''} ${s.obs || ''}`)
  // Cruce automático: pedimos que el LOFC respalde el RF declarado
  const h = homologarLOFC(s, s.rf)
  if (h && rfMin(h.rf) >= rfMin(s.rf)) return { clase: 'CRUZADO', codigo: h.codigo_base, rf_lofc: h.rf, cita: citaLOFC }
  // Match constructivo pero con RF menor al declarado (pedimos F0 para ver si existe match)
  const h0 = homologarLOFC(s, 'F0')
  if (h0) return { clase: 'PARCIAL', codigo: h0.codigo_base, rf_lofc: h0.rf, cita: citaLOFC }
  return { clase: 'SIN_CRUCE', cita: citaLOFC }
}

// ── Cruce acústico contra LOSCAA ─────────────────────────────────────────────
function clasificarAcustico(s) {
  if (!s.ac_rw) return { clase: 'NO_DECLARA' }
  const citaLOSCAA = /LOSCAA/i.test(`${s.desc || ''} ${s.obs || ''}`)
  const h = homologarLOSCAA(s, s.ac_rw)
  if (h && h.rw >= s.ac_rw - 3) return { clase: 'CRUZADO', codigo: h.codigo_base, rw_loscaa: h.rw, cita: citaLOSCAA }
  if (h) return { clase: 'PARCIAL', codigo: h.codigo_base, rw_loscaa: h.rw, cita: citaLOSCAA }
  return { clase: 'SIN_CRUCE', cita: citaLOSCAA }
}

// ── Auditoría completa ───────────────────────────────────────────────────────
const resultados = SC.map(s => ({
  cod: s.cod, elem: s.elem, desc: s.desc, u: s.u, rf: s.rf || null, rw: s.ac_rw || null,
  termico: clasificarTermico(s),
  fuego: clasificarFuego(s),
  acustico: clasificarAcustico(s),
}))

const count = (arr, fn) => arr.filter(fn).length
const T = resultados

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(resultados, null, 2))
  process.exit(0)
}

console.log('═══════════════════════════════════════════════════════════════════')
console.log(`AUDITORÍA DE CRUCE NORMATIVO — ${T.length} soluciones · ${new Date().toISOString().slice(0, 10)}`)
console.log('LOSCAT Ed.13 (citas) × LOFC Ed.17 (275 ítems) × LOSCAA Ed.13 2024 (49)')
console.log('═══════════════════════════════════════════════════════════════════\n')

console.log('── TÉRMICO (U) ──────────────────────────────────────────────────')
console.log(`  OFICIAL (cita LOSCAT):     ${count(T, r => r.termico === 'OFICIAL')}`)
console.log(`  CALCULADO (método declarado): ${count(T, r => r.termico === 'CALCULADO')}`)
console.log(`  SIN_MARCA (⛔ prohibido):  ${count(T, r => r.termico === 'SIN_MARCA')}`)

console.log('\n── FUEGO (RF) — cruce LOFC ──────────────────────────────────────')
console.log(`  CRUZADO (LOFC respalda RF declarado): ${count(T, r => r.fuego.clase === 'CRUZADO')}`)
console.log(`  PARCIAL (match, RF menor):            ${count(T, r => r.fuego.clase === 'PARCIAL')}`)
console.log(`  SIN_CRUCE:                            ${count(T, r => r.fuego.clase === 'SIN_CRUCE')}`)
console.log(`  NO_DECLARA RF:                        ${count(T, r => r.fuego.clase === 'NO_DECLARA')}`)

console.log('\n── ACÚSTICO (Rw) — cruce LOSCAA ─────────────────────────────────')
console.log(`  CRUZADO (LOSCAA respalda Rw ±3dB): ${count(T, r => r.acustico.clase === 'CRUZADO')}`)
console.log(`  PARCIAL (match, Rw menor):         ${count(T, r => r.acustico.clase === 'PARCIAL')}`)
console.log(`  SIN_CRUCE:                         ${count(T, r => r.acustico.clase === 'SIN_CRUCE')}`)
console.log(`  NO_DECLARA Rw:                     ${count(T, r => r.acustico.clase === 'NO_DECLARA')}`)

const sinMarca = T.filter(r => r.termico === 'SIN_MARCA')
if (sinMarca.length) {
  console.log('\n⛔ TÉRMICO SIN TRAZABILIDAD (corregir obs — cita LOSCAT o método):')
  sinMarca.forEach(r => console.log(`   ${r.cod} [${r.elem}] ${r.desc.slice(0, 60)}`))
}

const fuegoSin = T.filter(r => r.fuego.clase === 'SIN_CRUCE' && !r.fuego.cita)
if (fuegoSin.length) {
  console.log('\n⚠ RF SIN CRUCE LOFC NI CITA (revisar o marcar "verificar con ensayo"):')
  fuegoSin.forEach(r => console.log(`   ${r.cod} [${r.elem}] RF=${r.rf} — ${r.desc.slice(0, 55)}`))
}

const fuegoParcial = T.filter(r => r.fuego.clase === 'PARCIAL')
if (fuegoParcial.length) {
  console.log('\n⚠ RF PARCIAL (match LOFC con RF menor al declarado → requiere capas o cita):')
  fuegoParcial.forEach(r => console.log(`   ${r.cod} RF declarado=${r.rf} vs LOFC ${r.fuego.codigo}=${r.fuego.rf_lofc}${r.fuego.cita ? ' (cita LOFC en obs)' : ''}`))
}

const acuSin = T.filter(r => r.acustico.clase === 'SIN_CRUCE')
if (acuSin.length) {
  console.log(`\nℹ Rw SIN CRUCE LOSCAA (${acuSin.length} — esperable: LOSCAA solo tiene 49 soluciones):`)
  acuSin.slice(0, 15).forEach(r => console.log(`   ${r.cod} Rw=${r.rw}dB — ${r.desc.slice(0, 55)}`))
  if (acuSin.length > 15) console.log(`   … y ${acuSin.length - 15} más`)
}

console.log('\n═══ FIN AUDITORÍA ═══')
