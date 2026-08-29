// ─────────────────────────────────────────────────────────────────────────────
// capas_corte.test.js — Visor de Capas (corte a escala en SVG).
// Cubre el motor puro: clasificación de material, orden/orientación físicos
// y generación del SVG (bandas, cámara, montantes de estructura integrada).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { classifyMaterial, layersForCorte, orientacion, corteSVG, layers3D } from '../lib/engines/capas.js'

describe('classifyMaterial', () => {
  it('reconoce materiales comunes', () => {
    expect(classifyMaterial('Hormigon armado')).toBe('hormigon')
    expect(classifyMaterial('Lana de Vidrio 11 kg/m³')).toBe('lana')
    expect(classifyMaterial('Yeso Cartón ST 10mm')).toBe('yeso')
    expect(classifyMaterial('Fibrocemento')).toBe('fibro')
    expect(classifyMaterial('EPS 15kg/m3')).toBe('eps')
    expect(classifyMaterial('OSB/MDF')).toBe('madera')
  })
  it('cámara y aislante por flag', () => {
    expect(classifyMaterial('lo que sea', { esCamara: true })).toBe('camara')
    expect(classifyMaterial('material raro', { esAislante: true })).toBe('lana')
    expect(classifyMaterial('material raro')).toBe('otro')
  })
})

describe('layersForCorte — orden físico y orientación', () => {
  // la app almacena INTERIOR → EXTERIOR
  const capas = [
    { mat: 'Yeso carton', esp: 10 },      // interior
    { mat: 'Lana mineral', esp: 90 },
    { mat: 'Fibrocemento', esp: 8 },      // exterior
  ]
  it('muro: exterior arriba (invierte por defecto), interior abajo', () => {
    const { layers, orient } = layersForCorte(capas, 'muro')
    expect(orient).toEqual({ top: 'Exterior', bottom: 'Interior' })
    expect(layers[0].name).toBe('Fibrocemento')     // exterior arriba
    expect(layers[2].name).toBe('Yeso carton')      // interior abajo
  })
  // caso del usuario: radier [hormigón(interior) ... porcelanato(exterior)] salía
  // con hormigón arriba (mal). Ahora la terminación queda arriba.
  it('piso radier: terminación arriba, Terreno abajo', () => {
    const radier = [{ mat: 'Hormigon armado', esp: 100 }, { mat: 'Porcelanato', esp: 10 }]
    const { layers, orient } = layersForCorte(radier, 'piso', { pisoSubtipo: 'radier' })
    expect(layers[0].name).toBe('Porcelanato')      // terminación arriba
    expect(orient).toEqual({ top: 'Interior · terminación', bottom: 'Terreno' })
  })
  it('piso entrepiso: rótulos piso/cielo', () => {
    expect(orientacion('piso', 'entrepiso')).toEqual({ top: 'Piso · unidad superior', bottom: 'Cielo · unidad inferior' })
  })
  it('invert voltea el orden mostrado', () => {
    const a = layersForCorte(capas, 'muro').layers.map(l => l.name)
    const b = layersForCorte(capas, 'muro', { invert: true }).layers.map(l => l.name)
    expect(b).toEqual(a.slice().reverse())
  })
})

describe('corteSVG', () => {
  it('vacío → string vacío', () => {
    expect(corteSVG([], { elemTipo: 'muro' })).toBe('')
  })
  it('genera un <svg> con una banda por capa y el espesor total', () => {
    const capas = [{ mat: 'Hormigon armado', esp: 150 }, { mat: 'EPS', esp: 80 }, { mat: 'Mortero', esp: 6 }]
    const svg = corteSVG(capas, { elemTipo: 'muro' })
    expect(svg.startsWith('<svg')).toBe(true)
    expect((svg.match(/<rect /g) || []).length).toBeGreaterThanOrEqual(3)
    expect(svg).toContain('Espesor 236 mm')
    expect(svg).toContain('Exterior')
  })
  it('dibuja montantes cuando la capa trae estructura_integrada', () => {
    const capas = [
      { mat: 'Fibrocemento', esp: 8 },
      { mat: 'Lana de Vidrio', esp: 90, estructura_integrada: { tipo: 'acero', ancho_mm: 38, distancia_mm: 600 } },
      { mat: 'Yeso Cartón', esp: 10 },
    ]
    const svg = corteSVG(capas, { elemTipo: 'tabique' })
    // color del acero (STRUCT_MATS.acero.color = #334155) aparece → hay montantes
    expect(svg).toContain('#334155')
    expect(svg).toContain('estructura integrada')
  })
  it('marca la cámara de aire', () => {
    const capas = [{ mat: 'Ladrillo', esp: 140 }, { esCamara: true, esp: 30 }, { mat: 'Yeso', esp: 10 }]
    const svg = corteSVG(capas, { elemTipo: 'muro' })
    expect(svg).toContain('Cámara de aire')
    expect(svg).toContain('url(#cc-cam)')
  })
  // una cámara con estructura declara sus rastreles/perfiles → montantes en corte y 3D
  it('cámara con estructura_integrada dibuja rastreles (madera) en corte y 3D', () => {
    const capas = [
      { mat: 'Fibrocemento', esp: 8 },
      { esCamara: true, esp: 30, estructura_integrada: { tipo: 'madera', ancho_mm: 38, distancia_mm: 400 } },
      { mat: 'Lana mineral', esp: 80 },
      { mat: 'Yeso carton', esp: 10 },
    ]
    expect(corteSVG(capas, { elemTipo: 'muro' })).toContain('#92400e')   // color madera del rastrel
    const cam = layers3D(capas, 'muro').layers.find(l => l.name === 'Cámara de aire')
    expect(cam.role).toBe('cavity')
    expect(cam.studColor).toBe('#92400e')
    expect(cam.studDist).toBe(400)
  })
})
