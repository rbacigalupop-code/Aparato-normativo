// ─────────────────────────────────────────────────────────────────────────────
// glaser_labels.test.js — las etiquetas de capa del Glaser no se enciman.
// Reproduce el reporte de Susana (yeso 10mm + barrera 0.2mm con centros casi
// coincidentes) y fija que el reparto en 2 filas lo resuelve.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { glaserLabelLayout } from '../lib/charts/glaserLabels.js'

// Dos etiquetas se enciman si, en la MISMA fila (y), sus cajas [x±half] se cruzan.
function seEnciman(a, b) {
  if (a.y !== b.y) return false
  const halfA = Math.max(10, (a.label.length * 4.4) / 2)
  const halfB = Math.max(10, (b.label.length * 4.4) / 2)
  return Math.abs(a.x - b.x) < (halfA + halfB)
}
function sinSolapes(out) {
  for (let i = 0; i < out.length; i++)
    for (let j = i + 1; j < out.length; j++)
      if (seEnciman(out[i], out[j])) return false
  return true
}

describe('glaserLabelLayout — reparto anti-solape del eje X del Glaser', () => {
  it('capas finas y contiguas no se enciman (yeso 10mm + barrera 0.2mm)', () => {
    const items = [
      { label: 'Yeso cartón', cx: 50 },
      { label: 'Barrera vapor', cx: 58 },   // centro casi coincidente con el yeso
      { label: 'XPS extruido', cx: 180 },
      { label: 'OSB/MDF', cx: 300 },
      { label: 'XPS extruido', cx: 420 },
      { label: 'Fibrocemento', cx: 520 },
    ]
    const out = glaserLabelLayout(items, 188)
    expect(sinSolapes(out)).toBe(true)
    // las dos finas se conservan, en filas distintas (stagger)
    const yeso = out.find(o => o.label === 'Yeso cartón')
    const barrera = out.find(o => o.label === 'Barrera vapor')
    expect(yeso).toBeTruthy()
    expect(barrera).toBeTruthy()
    expect(yeso.y).not.toBe(barrera.y)
  })

  it('usa a lo sumo 2 filas (baseY y baseY+9)', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ label: 'Capa larga ' + i, cx: 40 + i * 4 }))
    const out = glaserLabelLayout(items, 188)
    const ys = [...new Set(out.map(o => o.y))]
    expect(ys.every(y => y === 188 || y === 197)).toBe(true)
    expect(ys.length).toBeLessThanOrEqual(2)
  })

  it('si ni 2 filas alcanzan, omite el sobrante — nunca encima', () => {
    const items = ['A', 'B', 'C', 'D'].map(l => ({ label: 'Capa ' + l, cx: 100 }))
    const out = glaserLabelLayout(items, 188)
    expect(out.length).toBeLessThanOrEqual(2)
    expect(sinSolapes(out)).toBe(true)
  })

  it('capas bien espaciadas quedan todas en la fila base', () => {
    const items = [
      { label: 'Hormigón', cx: 80 },
      { label: 'EPS', cx: 280 },
      { label: 'Fibrocemento', cx: 480 },
    ]
    const out = glaserLabelLayout(items, 188)
    expect(out.length).toBe(3)
    expect(out.every(o => o.y === 188)).toBe(true)
  })

  it('tolera entrada vacía o nula', () => {
    expect(glaserLabelLayout([], 188)).toEqual([])
    expect(glaserLabelLayout(undefined, 188)).toEqual([])
  })
})
