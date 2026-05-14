// Debug detallado: probar estrategias manualmente
import { calcGlaser } from '../src/data.js'

const cv = [
  { mat: 'Yeso carton', lam: 0.26, esp: 0.013, mu: 8 },
  { mat: 'Lana mineral 30kg', lam: 0.035, esp: 0.140, mu: 1 },
  { mat: 'OSB/MDF', lam: 0.23, esp: 0.011, mu: 200 },
  { mat: 'Fibrocemento', lam: 0.23, esp: 0.008, mu: 50 },
]

const ti = 20, te = -1, hr = 80, elemTipo = 'muro', umax = 0.45

console.log('═══ ORIGINAL ═══')
const r0 = calcGlaser(cv, ti, te, hr, elemTipo)
console.log('U:', r0.U, 'condInter:', r0.condInter)

// Estrategia A: Agregar BV simple después de Yeso
console.log('\n═══ A: BV después de yeso ═══')
const cvA = [
  cv[0],
  { mat: 'Barrera vapor PE', lam: 0.23, esp: 0.0002, mu: 9999 },
  cv[1], cv[2], cv[3]
]
const rA = calcGlaser(cvA, ti, te, hr, elemTipo)
console.log('U:', rA.U, 'condInter:', rA.condInter, 'capas:', cvA.length)

// Estrategia B: BV más fuerte (lámina más gruesa)
console.log('\n═══ B: BV más fuerte (μ=20000) ═══')
const cvB = [
  cv[0],
  { mat: 'BV reforzada', lam: 0.23, esp: 0.0005, mu: 20000 },
  cv[1], cv[2], cv[3]
]
const rB = calcGlaser(cvB, ti, te, hr, elemTipo)
console.log('U:', rB.U, 'condInter:', rB.condInter)

// Estrategia C: Remover OSB y poner Yeso final
console.log('\n═══ C: Sin OSB (Yeso → Lana → Fibrocemento) ═══')
const cvC = [cv[0], cv[1], cv[3]]
const rC = calcGlaser(cvC, ti, te, hr, elemTipo)
console.log('U:', rC.U, 'condInter:', rC.condInter)

// Estrategia D: Cámara ventilada entre OSB y Fibrocemento
console.log('\n═══ D: Cámara ventilada entre OSB y Fibrocemento ═══')
const cvD = [cv[0], cv[1], cv[2], { esCamara: true, esp: 0.040 }, cv[3]]
const rD = calcGlaser(cvD, ti, te, hr, elemTipo)
console.log('U:', rD.U, 'condInter:', rD.condInter)

// Estrategia E: Aumentar mucho la lana
console.log('\n═══ E: Lana mineral 300mm ═══')
const cvE = [cv[0], {...cv[1], esp: 0.300}, cv[2], cv[3]]
const rE = calcGlaser(cvE, ti, te, hr, elemTipo)
console.log('U:', rE.U, 'condInter:', rE.condInter)

// Estrategia F: Reordenar - OSB al interior
console.log('\n═══ F: Reordenar (OSB al interior) ═══')
const cvF = [cv[2], cv[1], cv[3], cv[0]]
const rF = calcGlaser(cvF, ti, te, hr, elemTipo)
console.log('U:', rF.U, 'condInter:', rF.condInter, 'orden:', cvF.map(c=>c.mat).join(' → '))

// Estrategia G: Reorden + BV
console.log('\n═══ G: Yeso → BV → Lana → Fibrocemento (sin OSB) ═══')
const cvG = [
  cv[0],
  { mat: 'BV PE', lam: 0.23, esp: 0.0002, mu: 9999 },
  cv[1], cv[3]
]
const rG = calcGlaser(cvG, ti, te, hr, elemTipo)
console.log('U:', rG.U, 'condInter:', rG.condInter)
