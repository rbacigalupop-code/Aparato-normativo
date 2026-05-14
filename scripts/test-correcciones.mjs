// Test manual simulando estrategias de generarCorrecciones
import { generarCorrecciones, calcGlaser } from '../src/data.js'

const cv = [
  { mat: 'Yeso carton', lam: 0.26, esp: 0.013, mu: 8 },
  { mat: 'Lana mineral 30kg', lam: 0.035, esp: 0.150, mu: 1 },
  { mat: 'OSB/MDF', lam: 0.23, esp: 0.020, mu: 200 },
]

const ti = 20
const te = -1
const hr = 80

// Test 1: Agregar barrera de vapor interior (simula C5)
console.log('═══ Test 1: + Barrera vapor interior (yeso → BV → lana → OSB) ═══')
const cvBV = [
  { mat: 'Yeso carton', lam: 0.26, esp: 0.013, mu: 8 },
  { mat: 'Barrera vapor PE', lam: 0.23, esp: 0.0002, mu: 9999 },
  { mat: 'Lana mineral 30kg', lam: 0.035, esp: 0.150, mu: 1 },
  { mat: 'OSB/MDF', lam: 0.23, esp: 0.020, mu: 200 },
]
const r1 = calcGlaser(cvBV, ti, te, hr, 'techumbre')
console.log('U:', r1.U, 'condInter:', r1.condInter)
for (const f of r1.ifaces) {
  console.log(`  Int ${f.i}: T=${f.T}°C, pvReal=${f.pvReal}, pvSat=${f.pvSat}, margen=${f.margen}, riesgo=${f.riesgo}`)
}

// Test 2: Trasdosado interior (yeso → BV → aislante → lana → OSB)
console.log('\n═══ Test 2: Trasdosado (yeso → BV → XPS 50 → lana → OSB) ═══')
const cvTras = [
  { mat: 'Yeso carton', lam: 0.26, esp: 0.013, mu: 8 },
  { mat: 'Barrera vapor PE', lam: 0.23, esp: 0.0002, mu: 9999 },
  { mat: 'XPS', lam: 0.036, esp: 0.050, mu: 100 },
  { mat: 'Lana mineral 30kg', lam: 0.035, esp: 0.150, mu: 1 },
  { mat: 'OSB/MDF', lam: 0.23, esp: 0.020, mu: 200 },
]
const r2 = calcGlaser(cvTras, ti, te, hr, 'techumbre')
console.log('U:', r2.U, 'condInter:', r2.condInter)
for (const f of r2.ifaces) {
  console.log(`  Int ${f.i}: T=${f.T}°C, pvReal=${f.pvReal}, pvSat=${f.pvSat}, riesgo=${f.riesgo}`)
}

// Test 3: Reordenar (OSB → lana → yeso, exterior a interior)
console.log('\n═══ Test 3: Reordenar (OSB interior, yeso exterior) ═══')
const cvReord = [
  { mat: 'OSB/MDF', lam: 0.23, esp: 0.020, mu: 200 },
  { mat: 'Lana mineral 30kg', lam: 0.035, esp: 0.150, mu: 1 },
  { mat: 'Yeso carton', lam: 0.26, esp: 0.013, mu: 8 },
]
const r3 = calcGlaser(cvReord, ti, te, hr, 'techumbre')
console.log('U:', r3.U, 'condInter:', r3.condInter)
for (const f of r3.ifaces) {
  console.log(`  Int ${f.i}: T=${f.T}°C, pvReal=${f.pvReal}, pvSat=${f.pvSat}, riesgo=${f.riesgo}`)
}
