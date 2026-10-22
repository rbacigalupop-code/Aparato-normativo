// ─────────────────────────────────────────────────────────────────────────────
// material_search.test.js — Búsqueda del combobox de materiales (MaterialCombobox)
//
// filtrarMateriales() filtra la lista AGRUPADA (salida de filterMatsByElem) por
// texto, coincidiendo por nombre de material O por nombre de grupo (conjunto).
// Es la lógica detrás del box «escribir y buscar» que reemplazó al <select>.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { filtrarMateriales } from '../utils/materialSearch.js'
import { filterMatsByElem } from '../data.js'

const GRUPOS = filterMatsByElem('muro') // lista real del catálogo para muros
const nombres = (res) => res.flatMap(g => g.items.map(m => m.n))

describe('filtrarMateriales — buscar por material o por conjunto', () => {
  it('sin texto → devuelve la lista completa', () => {
    expect(filtrarMateriales(GRUPOS, '')).toBe(GRUPOS)
    expect(filtrarMateriales(GRUPOS, '   ')).toBe(GRUPOS)
  })

  it('busca por NOMBRE de material (substring, case-insensitive)', () => {
    const res = filtrarMateriales(GRUPOS, 'lana')
    const n = nombres(res)
    expect(n.length).toBeGreaterThan(0)
    expect(n.every(x => x.toLowerCase().includes('lana'))).toBe(true)
    expect(n).toEqual(nombres(filtrarMateriales(GRUPOS, 'LANA'))) // case-insensitive
  })

  it('busca por nombre de CONJUNTO/grupo → devuelve todos los ítems del grupo', () => {
    const res = filtrarMateriales(GRUPOS, 'aislantes')
    expect(res.length).toBe(1)
    expect(res[0].g.toLowerCase()).toContain('aislantes')
    // trae TODO el grupo, no solo los que contienen "aislantes" en el nombre
    const grupoOriginal = GRUPOS.find(g => g.g === res[0].g)
    expect(res[0].items.length).toBe(grupoOriginal.items.length)
  })

  it('encuentra el material nuevo Volcapol al escribir «volcapol»', () => {
    const n = nombres(filtrarMateriales(GRUPOS, 'volcapol'))
    expect(n).toContain('EPS Volcapol D15 (Volcán)')
    expect(nombres(filtrarMateriales(GRUPOS, 'VOLCAPOL'))).toContain('EPS Volcapol D15 (Volcán)')
  })

  it('sin coincidencias → arreglo vacío', () => {
    expect(filtrarMateriales(GRUPOS, 'zzzqxyno')).toEqual([])
  })

  it('no revienta con entradas nulas', () => {
    expect(filtrarMateriales(null, 'x')).toEqual([])
    expect(filtrarMateriales(undefined, '')).toEqual([])
    // grupo sin ítems que igual matchea por nombre → se descarta (queda vacío)
    expect(filtrarMateriales([{ g: 'G', items: null }], 'g')).toEqual([])
  })
})
