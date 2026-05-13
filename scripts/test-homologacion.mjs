// Test de homologación LOSCAT → LOFC + LOSCAA
import { SC } from '../src/data.js'
import { homologarSolucion, identificarEstructuraBase } from '../src/lib/engines/homologacion.js'

const muestras = [
  '1.2.M.A25.1',   // HA 150mm + PU 60mm
  '1.2.M.B16.1',   // Albañilería Santiago 9 + PU
  '1.2.G.M1.1',    // Entramado madera 2x4 + LM
  '1.2.G.M2.1',    // Panel SIP OSB/EPS 100mm
  '2.2.M.MF1.1',   // Metalframe 90 + LM + 1 YF
  '1.2.G.M3.1',    // CLT 90mm
]

console.log('═══ Test de Homologación LOSCAT → LOFC + LOSCAA ═══\n')

for (const cod of muestras) {
  const sc = SC.find(s => s.cod === cod)
  if (!sc) { console.log(`✗ No encontrado: ${cod}\n`); continue }

  console.log(`▶ LOSCAT ${cod}`)
  console.log(`  Desc: ${sc.desc}`)
  console.log(`  U=${sc.u}  RF=${sc.rf}  Rw=${sc.ac_rw || '—'}`)

  const est = identificarEstructuraBase(sc)
  console.log(`  → Estructura: ${est.material} (${est.subtipo}) ${est.espesor_estructura_mm || '?'}mm — conf ${est.confianza}`)

  const homol = homologarSolucion(sc, { rfRequerido: 'F60', rwRequerido: 45 })

  if (homol.fuego) {
    console.log(`  🔥 Fuego: ${homol.fuego.codigo}`)
    console.log(`            RF=${homol.fuego.rf}, ${homol.fuego.intrinseco ? '✓ intrínseco' : '⚠ requiere capas'}`)
  } else {
    console.log(`  🔥 Fuego: ✗ sin match`)
  }

  if (homol.acustico) {
    console.log(`  🔇 Acústico: ${homol.acustico.codigo}`)
    console.log(`              Rw=${homol.acustico.rw}dB, ${homol.acustico.intrinseco ? '✓ intrínseco' : '⚠ requiere capas'}`)
  } else {
    console.log(`  🔇 Acústico: ✗ sin match`)
  }
  console.log()
}
