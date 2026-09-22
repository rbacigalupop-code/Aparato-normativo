// ═══════════════════════════════════════════════════════════════════════════════
// Visor de Capas — corte a escala de un elemento constructivo (SVG)
// ═══════════════════════════════════════════════════════════════════════════════
// Genera el corte de capas desde el array `capas` de la Calculadora U
// (shape {mat, esp, lam, mu, esCamara, esAislante, estructura_integrada}).
// Funciones PURAS (sin React) → testeables y reutilizables en el informe.
//
//   corteSVG(capas, { elemTipo }) → string SVG
//
// La app almacena las capas INTERIOR → EXTERIOR (ver GraficoGlaser). El corte
// las muestra en orden físico según el elemento (exterior arriba en muro/
// tabique/techumbre; interior/superior arriba en piso).
// ═══════════════════════════════════════════════════════════════════════════════

import { STRUCT_MATS } from '../../data.js'

// Paleta de materiales (tonos medios que leen sobre fondo claro u oscuro).
export const MATERIAL_COLORS = {
  hormigon: '#b4bbbd', ladrillo: '#c08457', madera: '#c99a5f', xps: '#77bccd',
  eps: '#a6d3c6', lana: '#e8c85c', pu: '#e6b49b', yeso: '#c9d2d8', fibro: '#b7bfbf',
  membrana: '#33474d', mortero: '#d9ddd9', camara: '#e7eef1', otro: '#c2c9c7',
}

const FUNC = {
  hormigon: 'estructura / masa', ladrillo: 'albañilería', madera: 'tablero / placa de madera',
  xps: 'aislación rígida', eps: 'aislación', lana: 'aislación', pu: 'aislación proyectada',
  yeso: 'placa / revestimiento', fibro: 'placa fibrocemento / tablero', membrana: 'barrera / control de vapor',
  mortero: 'terminación', camara: 'cámara de aire', otro: 'capa',
}

// Orden: lo más específico primero.
const MATCLASS = [
  [/fibrocemento|volcanboard|aquapanel|permanit|siding/i, 'fibro'],
  [/yeso|volcanita|cart[oó]n|gyplac|knauf|diamant/i, 'yeso'],
  [/hormig[oó]n|\bh\.?\s*a\.?\b|concreto/i, 'hormigon'],
  [/ladrillo|cer[aá]mic|alba[nñ]iler|bloque/i, 'ladrillo'],
  [/\bxps\b|extru[ií]d/i, 'xps'],
  [/\beps\b|expandido|poliestireno/i, 'eps'],
  [/lana|fibra\s*de\s*vidrio|vidrio|lana\s*mineral|roca/i, 'lana'],
  [/\bpu\b|poliuretano/i, 'pu'],
  [/madera|pino|\bosb\b|mdf|terciado|contrachap|mgp|arauco|machihembr/i, 'madera'],
  [/membrana|polietileno|barrera|fieltro|l[aá]mina|vapor/i, 'membrana'],
  [/mortero|revoque|pasta|corcho|malla|estuco|eifs|revest|elastom[eé]ric/i, 'mortero'],
]

/** Clasifica un material a una clave de MATERIAL_COLORS. */
export function classifyMaterial(mat, flags = {}) {
  if (flags.esCamara) return 'camara'
  const n = String(mat || '')
  for (const [re, k] of MATCLASS) if (re.test(n)) return k
  if (flags.esAislante) return 'lana'
  return 'otro'
}

/**
 * Rótulos de orientación según el tipo de elemento y, en pisos, el subtipo.
 * pisoSubtipo: 'radier' (a suelo → Terreno abajo) | 'entrepiso' (Cielo abajo).
 */
export function orientacion(elemTipo, pisoSubtipo) {
  if (elemTipo === 'piso') {
    return pisoSubtipo === 'entrepiso'
      ? { top: 'Piso · unidad superior', bottom: 'Cielo · unidad inferior' }
      : { top: 'Interior · terminación', bottom: 'Terreno' }   // radier a suelo (default)
  }
  return { top: 'Exterior', bottom: 'Interior' }   // muro / tabique / techumbre
}

/**
 * Normaliza el array de capas de la app a capas de dibujo, en orden físico.
 * La app almacena interior→exterior; por defecto se muestra el lado exterior /
 * la terminación ARRIBA (invierte). Como el orden guardado en pisos no está
 * normalizado, `invert` permite voltearlo a mano desde la UI.
 * @returns {{ layers: Array, orient: {top, bottom} }}
 */
export function layersForCorte(capas, elemTipo, opt = {}) {
  const arr = (capas || []).map(c => ({
    name: c.esCamara ? 'Cámara de aire' : (c.mat || '—'),
    mm: c.esCamara ? (parseFloat(c.esp) || 20) : (parseFloat(c.esp) || 0),
    matKey: classifyMaterial(c.mat, c),
    esCamara: !!c.esCamara,
    estructura: c.estructura_integrada || null,
  }))
  const reverse = !opt.invert       // default: exterior/terminación arriba
  const layers = reverse ? arr.slice().reverse() : arr
  return { layers, orient: orientacion(elemTipo, opt.pisoSubtipo) }
}

/**
 * Capas listas para el modelo 3D: color resuelto + rol + datos de montante.
 * Reusa el orden/orientación del corte 2D.
 */
export function layers3D(capas, elemTipo, opt = {}) {
  const { layers, orient } = layersForCorte(capas, elemTipo, opt)
  return {
    orient,
    layers: layers.map(L => ({
      name: L.name,
      mm: L.mm || 2,
      color: MATERIAL_COLORS[L.matKey] || MATERIAL_COLORS.otro,
      role: L.estructura ? 'cavity' : (L.esCamara ? 'camara' : 'solid'),
      studColor: L.estructura ? (STRUCT_MATS[L.estructura.tipo]?.color || '#334155') : null,
      studDist: L.estructura ? (parseFloat(L.estructura.distancia_mm) || 600) : null,
    })),
  }
}

const escSVG = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Corte a escala en SVG (string). Bandas ∝ espesor, rótulos, cotas, orientación,
 * cámara de aire y montantes de la estructura integrada con su modulación real.
 */
const truncar = (s, max = 20) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s)

export function corteSVG(capas, opt = {}) {
  const { layers, orient } = layersForCorte(capas, opt.elemTipo, opt)
  if (!layers.length) return ''
  const scale = opt.scale || 0.92, MINH = 11, Wb = 170, bx = 148, padT = 40, padB = 44
  const rows = layers.map(L => {
    const mm = L.mm || 2, tH = mm * scale, vH = Math.max(tH, MINH)
    return { L, vH, exagg: vH > tH + 0.6 }
  })
  const H = rows.reduce((a, r) => a + r.vH, 0)
  const W = 462, VBH = H + padT + padB, dimX = bx + Wb + 22
  const o = []
  o.push(`<svg viewBox="0 0 ${W} ${VBH.toFixed(1)}" role="img" aria-label="Corte a escala de las capas del elemento" style="display:block;width:100%;min-width:420px;max-width:540px;height:auto;font-family:inherit">`)
  o.push(`<defs>
    <pattern id="cc-lana" width="20" height="8" patternUnits="userSpaceOnUse"><path d="M0 4 Q5 -1 10 4 T20 4" fill="none" stroke="#8a7320" stroke-width="0.7" opacity="0.5"/></pattern>
    <pattern id="cc-cam" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9" stroke="currentColor" stroke-width="0.6" opacity="0.3"/></pattern>
  </defs>`)
  o.push(`<text x="${bx + Wb / 2}" y="${padT - 15}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.8">▼ ${escSVG(orient.top)}</text>`)
  let y = padT
  rows.forEach(r => {
    const L = r.L, col = MATERIAL_COLORS[L.matKey] || MATERIAL_COLORS.otro
    o.push(`<rect x="${bx}" y="${y.toFixed(1)}" width="${Wb}" height="${r.vH.toFixed(1)}" fill="${col}" stroke="currentColor" stroke-opacity="0.55" stroke-width="0.8"/>`)
    if (L.esCamara) o.push(`<rect x="${bx}" y="${y.toFixed(1)}" width="${Wb}" height="${r.vH.toFixed(1)}" fill="url(#cc-cam)"/>`)
    else if (L.matKey === 'lana') o.push(`<rect x="${bx}" y="${y.toFixed(1)}" width="${Wb}" height="${r.vH.toFixed(1)}" fill="url(#cc-lana)"/>`)
    // montantes de estructura integrada (con su modulación real)
    if (L.estructura) {
      const scol = STRUCT_MATS[L.estructura.tipo]?.color || '#334155'
      const dist = parseFloat(L.estructura.distancia_mm) || 600
      const n = Math.max(2, Math.min(6, Math.round(900 / dist)))
      const sw = 8
      for (let s = 0; s < n; s++) {
        const sc = bx + Wb * (s + 0.5) / n
        o.push(`<rect x="${(sc - sw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${sw}" height="${r.vH.toFixed(1)}" fill="${scol}" stroke="currentColor" stroke-opacity="0.5" stroke-width="0.5"/>`)
      }
    }
    const cy = y + r.vH / 2
    o.push(`<line x1="${bx - 6}" y1="${cy.toFixed(1)}" x2="${bx}" y2="${cy.toFixed(1)}" stroke="currentColor" stroke-opacity="0.5" stroke-width="0.8"/>`)
    o.push(`<text x="${bx - 10}" y="${(cy + 3.5).toFixed(1)}" text-anchor="end" font-size="11" fill="currentColor"><title>${escSVG(L.name)}${L.estructura ? ' (con estructura integrada)' : ''}</title>${escSVG(truncar(L.name))}${L.estructura ? ' <tspan opacity="0.6" font-size="9">+est</tspan>' : ''}</text>`)
    const lbl = L.mm ? `${L.mm} mm` : '—'
    o.push(`<line x1="${dimX}" y1="${y.toFixed(1)}" x2="${dimX + 5}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-opacity="0.5" stroke-width="0.8"/>`)
    o.push(`<text x="${dimX + 10}" y="${(cy + 3.5).toFixed(1)}" font-size="11" fill="currentColor" opacity="0.9">${escSVG(lbl)}${r.exagg ? ' <tspan font-size="9" opacity="0.55">*</tspan>' : ''}</text>`)
    y += r.vH
  })
  o.push(`<line x1="${dimX}" y1="${padT}" x2="${dimX}" y2="${(padT + H).toFixed(1)}" stroke="currentColor" stroke-opacity="0.3" stroke-width="0.8"/>`)
  o.push(`<line x1="${dimX}" y1="${(padT + H).toFixed(1)}" x2="${dimX + 5}" y2="${(padT + H).toFixed(1)}" stroke="currentColor" stroke-opacity="0.5" stroke-width="0.8"/>`)
  const tot = layers.reduce((a, l) => a + (l.mm || 0), 0)
  o.push(`<text x="${dimX}" y="${(padT + H + 16).toFixed(1)}" font-size="10.5" fill="currentColor" opacity="0.9">Espesor ${Math.round(tot)} mm</text>`)
  o.push(`<path d="M${bx + Wb / 2} ${padT + H + 7} l0 6 m-3 -3 l3 3 l3 -3" stroke="currentColor" stroke-width="1" fill="none" opacity="0.75"/>`)
  o.push(`<text x="${bx + Wb / 2}" y="${padT + H + 30}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.8">▲ ${escSVG(orient.bottom)}</text>`)
  if (rows.some(r => r.exagg)) o.push(`<text x="6" y="${VBH - 6}" font-size="8.5" fill="currentColor" opacity="0.5">* capa fina, no a escala</text>`)
  o.push('</svg>')
  return o.join('')
}

// ─────────────────────────────────────────────────────────────────────────────
// Alerta de SENTIDO CONSTRUCTIVO: barrera de vapor en la cara fría.
//
// Regla (clima de calefacción, interior = cara caliente): la barrera de vapor
// (control de vapor dominante, sd alto) va en la cara INTERIOR/caliente. Si queda
// en la cara exterior/fría del aislante y no hay una barrera equivalente en la
// interior, el vapor condensa dentro del aislante (condensación intersticial).
// Aviso de buenas prácticas (advisory) — complementa el Glaser, no lo reemplaza.
//
// `capas` en orden INTERIOR → EXTERIOR. Solo muro/techumbre (en piso el orden no
// está normalizado). Un layer es "barrera" si su rol es membrana con sd≥1 m, o su
// sd≥5 m. Una cámara de aire hacia el exterior corta el conteo: lo que está más
// afuera de una cámara ventilada ya no atrapa humedad contra el aislante.
// ─────────────────────────────────────────────────────────────────────────────
const SD_BARRERA_MIN = 1     // m · una membrana con al menos este sd cuenta como barrera
const SD_BARRERA_SOLO = 5    // m · cualquier capa con este sd es barrera aunque no sea membrana
const SD_TRANSPIRABLE_MAX = 0.5  // m · membrana con sd bajo = transpirable (deja pasar el vapor)
// Zonas térmicas frías donde un entramado ligero suele requerir barrera de vapor
// (el catálogo MINVU la exige entre ~C–I; umbral D–I, inclusivo por ser advisory;
// el Glaser es el juez final).
const ZONAS_FRIAS = new Set(['D', 'E', 'F', 'G', 'H', 'I'])

/**
 * Avisos de SENTIDO CONSTRUCTIVO a partir de las capas (interior→exterior).
 * Solo muro/techumbre. Devuelve un array de { tipo, capa, mensaje, sd? }.
 * Chequeos: barrera de vapor en la cara fría · aislante entre dos barreras ·
 * membrana transpirable en la cara caliente · entramado ligero sin barrera en
 * zona fría (requiere opts.zona). Todos advisory (complementan el Glaser).
 * @param {object} opts - { zona: 'A'..'I' } letra de zona térmica del proyecto.
 */
export function alertasSentidoConstructivo(capas, elemTipo, opts = {}) {
  const el = elemTipo === 'techumbre' ? 'techo' : elemTipo
  if (el !== 'muro' && el !== 'techo') return []
  const arr = (capas || []).map(c => {
    const esp = parseFloat(c.esp) || 0
    const mu = parseFloat(c.mu) || 0
    const lam = parseFloat(c.lam)
    return {
      mat: c.mat || '',
      esCamara: !!c.esCamara,
      esMembrana: !c.esCamara && classifyMaterial(c.mat) === 'membrana',
      sd: (mu * esp) / 1000,                        // m
      R: lam > 0 ? (esp / 1000) / lam : 0,          // m²K/W
      esAislante: !c.esCamara && lam > 0 && lam <= 0.06,
    }
  })
  if (arr.length < 2) return []
  const esBarrera = (c) => !c.esCamara && ((c.esMembrana && c.sd >= SD_BARRERA_MIN) || c.sd >= SD_BARRERA_SOLO)
  const esTranspirable = (c) => c.esMembrana && c.sd < SD_TRANSPIRABLE_MAX

  // Aislante principal = mayor R entre las capas aislantes.
  let idxAisl = -1, bestR = 0
  arr.forEach((c, i) => { if (c.esAislante && c.R > bestR) { bestR = c.R; idxAisl = i } })
  if (idxAisl < 0) return []   // sin aislante identificable → las reglas no aplican

  // Barrera en cada cara (la exterior corta en cámara ventilada: lo de más afuera
  // de una cámara no atrapa humedad contra el aislante).
  let barreraInterior = null
  for (let i = idxAisl - 1; i >= 0; i--) { if (esBarrera(arr[i])) { barreraInterior = arr[i]; break } }
  let barreraExterior = null
  for (let i = idxAisl + 1; i < arr.length; i++) {
    if (arr[i].esCamara) break
    if (esBarrera(arr[i])) { barreraExterior = arr[i]; break }
  }

  const avisos = []

  // 1. Barrera de vapor en la cara fría (exterior) sin equivalente al interior.
  if (barreraExterior && !barreraInterior) {
    avisos.push({
      tipo: 'barrera_vapor_cara_fria', capa: barreraExterior.mat, sd: Math.round(barreraExterior.sd * 10) / 10,
      mensaje: `La barrera de vapor «${barreraExterior.mat}» (sd≈${Math.round(barreraExterior.sd)} m) está en la cara fría/exterior del aislante. En clima de calefacción la barrera de vapor va en la cara interior/caliente; en esta posición puede condensar dentro del aislante. Revisa el orden de las capas, o si esta capa va al exterior usa una membrana transpirable (sd bajo).`,
    })
  }

  // 2. Aislante entre DOS barreras de vapor: no puede secar hacia ningún lado.
  if (barreraExterior && barreraInterior) {
    avisos.push({
      tipo: 'doble_barrera_vapor', capa: `${barreraInterior.mat} / ${barreraExterior.mat}`,
      mensaje: `El aislante queda entre dos capas de alto control de vapor («${barreraInterior.mat}» al interior y «${barreraExterior.mat}» al exterior): no puede secar hacia ningún lado. Deja una sola barrera (en la cara interior/caliente) y una cara exterior más abierta (membrana transpirable) o una cámara ventilada.`,
    })
  }

  // 3. Membrana TRANSPIRABLE en la cara interior/caliente (va en la exterior).
  for (let i = idxAisl - 1; i >= 0; i--) {
    if (esTranspirable(arr[i])) {
      avisos.push({
        tipo: 'transpirable_cara_caliente', capa: arr[i].mat,
        mensaje: `La membrana transpirable «${arr[i].mat}» (sd bajo) está en la cara interior/caliente. Va en la cara exterior/fría: ahí frena agua y viento y deja salir el vapor. Al interior, en cambio, conviene una barrera de vapor (sd alto).`,
      })
      break
    }
  }

  // 4. Entramado ligero (sin capa másica: hormigón/ladrillo/bloque) en zona fría
  //    y sin control de vapor por la cara interior → suele requerir barrera.
  const zona = String(opts.zona || '').toUpperCase()
  if (ZONAS_FRIAS.has(zona) && !barreraExterior) {
    const hayMasico = arr.some(c => !c.esCamara && ['hormigon', 'ladrillo'].includes(classifyMaterial(c.mat)))
    let sdInterior = 0
    for (let i = 0; i < idxAisl; i++) { if (!arr[i].esCamara) sdInterior += arr[i].sd }  // control por el interior
    if (!hayMasico && sdInterior < 1) {
      avisos.push({
        tipo: 'entramado_sin_barrera_zona_fria', capa: null,
        mensaje: `Entramado ligero en zona ${zona} (fría) sin barrera ni freno de vapor por la cara interior/caliente. En estas zonas suele requerirse una barrera de vapor en la cara interior para evitar condensación dentro del aislante. Agrégala (o confírmalo con el análisis de Glaser).`,
      })
    }
  }

  return avisos
}

// Compat: el aviso puntual de barrera de vapor en la cara fría (o null).
export function alertaSentidoVapor(capas, elemTipo) {
  return alertasSentidoConstructivo(capas, elemTipo).find(a => a.tipo === 'barrera_vapor_cara_fria') || null
}
