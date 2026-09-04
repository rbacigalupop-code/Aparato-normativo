import React, { useState, useMemo, useEffect, useRef, forwardRef } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import AuthGate from './AuthGate.jsx'
import MigrationGate from './MigrationGate.jsx'
import { calcularU, calcularGlaser, calcularUSC, sugerirMejorasTermicas, validarCumplimientoTermico } from './lib/engines/thermal.js'
import { rfStringToNumber, obtenerLetraOGUC, obtenerRFdeLetra, obtenerRFOGUC, requiereCajaEscalera, evaluarSeccionResidual } from './lib/engines/fire.js'
import { homologarSolucion } from './lib/engines/homologacion.js'
import { rwFachadaCompuesta, MEJORAS_IMPACTO_PISO, lnwConMejora } from './lib/engines/acoustic.js'
import { corteSVG } from './lib/engines/capas.js'
import Modelo3D from './components/Modelo3D.jsx'

// L'n,w efectivo del entrepiso = base − ΔL,w del revestimiento elegido (si hay).
// Envuelve lnwConMejora del motor para recibir el objeto de estado completo.
const lnwEfectivo = (acImpactoPisos) => lnwConMejora(acImpactoPisos?.lnw, acImpactoPisos?.mejora)
import { resolverAplicacionSC } from './lib/aplicarSolucion.js'
import { analizarGlaserAnual } from './lib/engines/glaser_mensual.js'
import { climaMensual } from './data/clima_mensual.js'
import { cargarDatosOGUC } from './lib/ogucData.js'
import { AyudaPanel } from './components/Ayuda.jsx'
import NotasPanel from './NotasPanel.jsx'
import {
  ZONAS, COMUNAS_ZONA, TIPOS, ESTRUCTURAS,
  RF_DEF, RF_EST, AC_DEF, AC_IMPACT_DEF, RIESGO_INC, RF_PISOS, RF_ELEM_REQ, OBS_EST, CATEG_FUEGO,
  USO_TO_OGUC,
  ACERO_PROT, PERFILES_ACERO,
  ALL_MATS, RSI_MAP, RSE_MAP, RCAMARA, resistenciaCamara, filterMatsByElem,
  SC, BH, SC_CAPAS, VIDRIOS, MARCOS,
  PERM_V, PUERTA_U, PUERTA_P, PUERTA_RF, SOBR_R, INFILT,
  REC_USO, ELEM_NORM, SUBGRUPOS_PUERTA,
  calcU_SC, buildCapas, colSem, ist,
  calcGlaser as calcGlaserCompleto, calcU_ISO6946 as calcU_ISO6946_completo,
  generarCorrecciones,
  STRUCT_MATS,
  getUIdx, MATS
} from './data.js'
import { UMBRALES_U_VENTANA, TABLA3_VENTANAS, maxVidriadoVentana } from './data/ds15_ventanas.js'
import { PDA, PDA_SOLUCIONES, resolvePDA, uMaxEfectiva, climaPDA } from './data/pda.js'
import TabDiag from './modules/TabDiag.jsx'
import AdminZonas from './modules/AdminZonas.jsx'
import UserManager from './modules/UserManager.jsx'
import AdminStats from './modules/AdminStats.jsx'
import AdminTokens from './modules/AdminTokens.jsx'
import AdminFeedback from './modules/AdminFeedback.jsx'
import FeedbackForm from './modules/FeedbackForm.jsx'
import UserHeader from './components/UserHeader.jsx'
import ThemePicker, { useTheme } from './components/ThemePicker.jsx'
import ModeSwitcher from './components/ModeSwitcher.jsx'
import ResultadoU from './components/calculou/ResultadoU.jsx'
import DesgloseR  from './components/calculou/DesgloseR.jsx'
import EnergeticoHome   from './modules/energetico/EnergeticoHome.jsx'
import EnergeticoConfig from './modules/energetico/EnergeticoConfig.jsx'
import DemandaAnual    from './modules/energetico/DemandaAnual.jsx'
import Detalles        from './modules/energetico/Detalles.jsx'
import PuertasDetalladas from './modules/energetico/PuertasDetalladas.jsx'
import {
  HOJAS as PUERTA_HOJAS, MARCOS_PUERTA, SELLOS as PUERTA_SELLOS,
  RF_MINIMO_POR_USO as PUERTA_RF_MIN, RW_MINIMO_POR_USO as PUERTA_RW_MIN,
  SUGERENCIAS_POR_ZONA as PUERTA_SUG_ZONA,
} from './data/puertas_detalladas.js'
import {
  calcularPuertaCombinada, cumpleDS15Puerta,
  cumpleRFPuerta, cumpleRWPuerta, cumpleOGUC,
} from './lib/engines/puertas_detalladas.js'
import Renovables      from './modules/energetico/Renovables.jsx'
import InformeEjecutivo from './modules/energetico/InformeEjecutivo.jsx'
import PaywallGate      from './modules/energetico/PaywallGate.jsx'
import { isPro, estaEnTrial, diasRestantesTrial } from './lib/plan.js'
import { analizarCorreccion } from './lib/engines/economic.js'
import { useProjects } from './useProjects.js'
import ProjectManager from './ProjectManager.jsx'

// ─── Aliases para compatibilidad con código existente ────────────────────────
const rfN = rfStringToNumber
const getLetraOGUC = obtenerLetraOGUC
const getRFDeLetra = obtenerRFdeLetra
const getRFOGUC = obtenerRFOGUC
// IMPORTANTE: usar la implementación COMPLETA de data.js que retorna
// {temps, U, Tdew, ifaces, Rtot, condInter, ...}. La de thermal.js (calcularGlaser)
// es una versión simplificada sin U ni temps que ROMPE el render del calculador.
const calcGlaser = calcGlaserCompleto
const calcU_ISO6946 = calcU_ISO6946_completo

// ─── helpers de estilo ─────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: 'system-ui,sans-serif', fontSize: 13, color: '#1e293b', minHeight: '100vh', background: '#f1f5f9' },
  header: { background: 'linear-gradient(135deg,#0e6560,#0f766e)', color: '#fff', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  tabs: { display: 'flex', gap: 2, background: '#e2e8f0', padding: '4px 8px 0', flexWrap: 'wrap' },
  tab: (a) => ({ padding: '7px 14px', border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontSize: 12, fontWeight: a ? 700 : 400, background: a ? '#fff' : 'transparent', color: a ? '#0e6560' : '#64748b' }),
  body: { padding: 16, maxWidth: 1100, margin: '0 auto' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 12 },
  row: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' },
  col: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, color: '#64748b', fontWeight: 600 },
  input: { ...ist, width: 160 },
  sel: { ...ist, width: 180 },
  btn: (c = '#0e6560') => ({ background: c, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }),
  badge: (ok) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#991b1b' }),
  warn: { background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, padding: '8px 12px', fontSize: 12 },
  err: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991b1b' },
  ok: { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#166534' },
  h2: { fontSize: 15, fontWeight: 700, color: '#0e6560', marginBottom: 8, marginTop: 0 },
  h3: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, marginTop: 0 },
  sep: { borderTop: '1px solid #e2e8f0', margin: '10px 0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { background: '#f8fafc', padding: '6px 8px', textAlign: 'left', fontWeight: 700, borderBottom: '2px solid #e2e8f0' },
  td: { padding: '5px 8px', borderBottom: '1px solid #f1f5f9' },
}


// ─── Densidades kg/m³ para estimación de masa acústica (ley de masa ISO 15712) ─
const MAT_DEN = {
  'Hormigon armado':2400,'Hormigon simple':2300,'Mortero cemento':1800,'Mortero yeso':1200,
  'Ladrillo ceramico macizo':1700,'Ladrillo ceramico perforado':1200,'Bloque hormigon':1500,
  'Bloque ceramico poroso':900,'Madera pino/coigue':500,'OSB/MDF':600,'Yeso carton':700,
  'Fibrocemento':1300,'Contrachapado':500,'EPS 10kg/m3':10,'EPS 15kg/m3':15,
  'EPS 20kg/m3':20,'XPS extruido':35,'Lana vidrio 10kg':10,'Lana vidrio 13kg':13,
  'Lana mineral 30kg':30,'PU proyectado':29,'Fibra poliester':15,'Corcho aglomerado':120,
  'Ceramica/porcelanato':2000,'Vidrio monolitico':2500,'Pintura/estuco':1800,'Lamina impermeable':1200,
}

// ─── SIMULADOR DE CAPAS ────────────────────────────────────────────────────────
// Cumplimiento térmico a 2 decimales: la U-máx del DS N°15 se especifica a 2
// decimales, así que la U calculada se compara redondeada a 2 decimales
// (0.602 → 0.60 ≤ 0.60 = cumple). Evita marcar "no cumple" cuando el valor
// mostrado (redondeado) ya está en el límite. 1e-9 cubre el error de coma flotante.
const uCumpleMax = (u, umax) => Math.round(parseFloat(u) * 100) / 100 <= umax + 1e-9

// ─── FICHA SC — VISOR GRÁFICO ─────────────────────────────────────────────────
function capasParaSC(s) {
  // PDA: capas curadas estructuradas (int→ext) → visor gráfico y ficha.
  if (s.capasStruct?.length) return s.capasStruct.map(c => ({ n: c.mat, esp: c.esp || 0, lam: c.lam, mu: c.mu, esCamara: !!c.esCamara, esAislante: !c.esCamara && c.lam != null && c.lam <= 0.06 }))
  const bh = BH.find(b => b.cod === s.cod)
  if (bh?.capas?.length) return bh.capas.map(c => ({ n: c.n, esp: c.esp || 0, lam: c.lam, mu: c.mu, esCamara: !!c.esCamara, esAislante: !!c.esAislante }))
  const sc = SC_CAPAS[s.cod]
  if (sc?.length) return sc.map(c => ({ n: c.mat, esp: c.esp || 0, lam: c.lam, mu: c.mu, esCamara: !!(c.camara || c.esCamara), esAislante: false }))
  return (s.capas || '').split(' | ').map(part => {
    const m = part.trim().match(/^(.*?)\s+([\d.]+)$/)
    return m
      ? { n: m[1].trim(), esp: parseFloat(m[2]), lam: null, mu: null, esCamara: part.toLowerCase().includes('camara'), esAislante: false }
      : { n: part.trim(), esp: 50, lam: null, mu: null, esCamara: false, esAislante: false }
  })
}

function fichaLayerColor(nombre) {
  const n = (nombre || '').toLowerCase()
  if (n.includes('camara') || n.includes('aire')) return { fill: '#ccfbf1', stroke: '#7dd3fc', pat: 'air' }
  if (n.includes('barrera') || n.includes('membrana') || n.includes('polietileno') || n.includes('epdm') || n.includes('sbs')) return { fill: '#ede9fe', stroke: '#a78bfa', pat: 'mem' }
  if (n.includes('h.a') || n.includes('ha ') || n.includes('hormig') || n.includes('gravilla') || n.includes('malla at') || n.includes('nervad') || n.includes('losa') || n.includes('radier') || n.includes('granit') || n.includes('marmol') || n.includes('piedra')) return { fill: '#cbd5e1', stroke: '#64748b', pat: 'conc' }
  if (n.includes('albanil') || n.includes('ladrillo') || n.includes('ceramica') || n.includes('bloque') || n.includes('teja')) return { fill: '#fecaca', stroke: '#f87171', pat: 'brick' }
  if (n.includes('eps') || n.includes('xps') || n.includes('pu ') || n.includes('proy') || n.includes('lana') || n.includes('fibra') || n.includes('mineral') || n.includes('tiff') || n.includes('isop') || n.includes('sate') || n.includes('aislante')) return { fill: '#fef08a', stroke: '#f59e0b', pat: 'insul' }
  if (n.includes('madera') || n.includes('osb') || n.includes('clt') || n.includes('pino') || n.includes('lvl') || n.includes('contrachap') || n.includes('tablon') || n.includes('tablilla') || n.includes('machihembr') || n.includes('parquet') || n.includes('laminad') || n.includes('cedro') || n.includes('alerce') || n.includes('cercha') || n.includes('viga') || n.includes('mdf')) return { fill: '#fde68a', stroke: '#d97706', pat: 'wood' }
  if (n.includes('acero') || n.includes('zinc') || n.includes('galv') || n.includes('alumin') || n.includes('cobre') || n.includes('titanio')) return { fill: '#64748b', stroke: '#334155', pat: 'metal' }
  if (n.includes('fibrocemento') || n.includes('fibro') || n.includes('cementic') || n.includes('hardiboard') || n.includes('cedral')) return { fill: '#d1d5db', stroke: '#9ca3af', pat: 'fibrc' }
  if (n.includes('yeso') || n.includes('mortero') || n.includes('revoq') || n.includes('revoc') || n.includes('pasta') || n.includes('elastic') || n.includes('latex') || n.includes('vinil') || n.includes('lino') || n.includes('eifs') || n.includes('etics') || n.includes('sto') || n.includes('mineral')) return { fill: '#f0fdf4', stroke: '#86efac', pat: 'plast' }
  if (n.includes('vidrio') || n.includes('dvh') || n.includes('tvh') || n.includes('marco') || n.includes('polica')) return { fill: '#99f6e4', stroke: '#0ea5e9', pat: 'glass' }
  if (n.includes('corcho')) return { fill: '#fef9c3', stroke: '#fde047', pat: 'plain' }
  if (n.includes('alfombra')) return { fill: '#fcd9a3', stroke: '#c2853f', pat: 'plain' }
  return { fill: '#f8fafc', stroke: '#cbd5e1', pat: 'plain' }
}

// ── Diagrama de sección constructiva para el informe (funciona con capas arbitrarias) ──
function capasSeccionSvgStr(capas, opts = {}) {
  if (!capas?.length) return ''
  const { titulo = 'Sección constructiva (int → ext)', uCalc, uMax, label = '' } = opts
  const f = n => Number(n).toFixed(1)
  const uid = Math.random().toString(36).slice(2, 7)

  const W = 660
  const PL = 44, PR = 16, PT = 60  // PT alto: separa la cota superior del subtítulo
  const gW = W - PL - PR           // 600 px usables
  const LAYER_H = 120               // altura del bloque de capas
  const COTA_Y  = PT - 14          // y de la línea horizontal de cotas
  const LEGEND_Y = PT + LAYER_H + 18
  const ROW_H   = 14

  // Proporcionar anchos de capas
  const nCam = capas.filter(c => c.esCamara).length
  const realEsp = capas.filter(c => !c.esCamara).reduce((a, c) => a + Math.max(parseFloat(c.esp || 0), 1), 0)
  const CAM_FRAC = Math.min(0.06, 0.35 / Math.max(nCam, 1))
  const realFrac = 1 - nCam * CAM_FRAC
  const rawW = capas.map(c => c.esCamara
    ? gW * CAM_FRAC
    : realEsp > 0 ? gW * realFrac * (Math.max(parseFloat(c.esp || 0), 1) / realEsp) : gW / capas.length)

  // Cadena de cotas sobre las capas
  const cotaParts = []
  cotaParts.push(`<line x1="${PL}" y1="${COTA_Y}" x2="${PL + gW}" y2="${COTA_Y}" stroke="#475569" stroke-width="1"/>`)
  cotaParts.push(`<line x1="${PL}" y1="${COTA_Y}" x2="${PL}" y2="${PT - 2}" stroke="#475569" stroke-width="0.9"/>`)

  let xCur = PL
  const layerParts = []

  capas.forEach((c, i) => {
    const w = rawW[i]
    const name = c.esCamara ? 'Cámara de aire' : (c.mat || c.name || c.n || '—')
    const col  = fichaLayerColor(name)
    const hasPat = ['insul','conc','wood','brick','air','mem','metal'].includes(col.pat)
    const espMm  = c.esCamara ? '' : `${Math.round(parseFloat(c.esp || 0))}`
    const lamStr = (!c.esCamara && parseFloat(c.lam) > 0) ? `λ=${parseFloat(c.lam).toFixed(3)}` : ''
    const Ri     = (!c.esCamara && parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0)
      ? (parseFloat(c.esp)/1000)/parseFloat(c.lam) : 0
    const rStr   = Ri > 0 ? `R=${Ri.toFixed(3)}` : ''
    const cx = xCur + w/2

    // Rectángulo de capa con clipPath
    layerParts.push(`<rect x="${f(xCur)}" y="${PT}" width="${f(w)}" height="${LAYER_H}" fill="${col.fill}" stroke="${col.stroke}" stroke-width="1.2" clip-path="url(#csl-${uid})"/>`)
    if (hasPat) layerParts.push(`<rect x="${f(xCur)}" y="${PT}" width="${f(w)}" height="${LAYER_H}" fill="url(#cs-${col.pat}-${uid})" clip-path="url(#csl-${uid})"/>`)

    // Badge numérico
    if (w > 10) {
      layerParts.push(`<circle cx="${f(cx)}" cy="${PT + 14}" r="7" fill="${col.stroke}" opacity="0.9" clip-path="url(#csl-${uid})"/>`)
      layerParts.push(`<text x="${f(cx)}" y="${PT + 18}" text-anchor="middle" font-size="8" fill="white" font-weight="700">${i+1}</text>`)
    }
    // λ y R dentro del bloque (si hay espacio)
    if (w > 44 && lamStr) layerParts.push(`<text x="${f(cx)}" y="${f(PT + LAYER_H/2 + 4)}" text-anchor="middle" font-size="8" fill="#374151">${lamStr}</text>`)
    if (w > 44 && rStr)   layerParts.push(`<text x="${f(cx)}" y="${f(PT + LAYER_H/2 + 14)}" text-anchor="middle" font-size="8" fill="#64748b">${rStr}</text>`)

    // Cota: tick derecho + texto de espesor
    const tickX = xCur + w
    cotaParts.push(`<line x1="${f(tickX)}" y1="${COTA_Y}" x2="${f(tickX)}" y2="${PT - 2}" stroke="#475569" stroke-width="0.9"/>`)
    if (espMm) {
      if (w >= 22) {
        cotaParts.push(`<text x="${f(cx)}" y="${COTA_Y - 4}" text-anchor="middle" font-size="8.5" fill="#1e293b" font-weight="700">${espMm}</text>`)
      } else if (w >= 8) {
        cotaParts.push(`<text x="${f(cx)}" y="${COTA_Y - 4}" text-anchor="middle" font-size="7" fill="#1e293b" font-weight="700" transform="rotate(-55 ${f(cx)} ${COTA_Y - 4})">${espMm}</text>`)
      }
    }
    xCur += w
  })

  // Tabla de leyenda. El nombre se trunca para no desbordar sobre la columna de
  // Espesor (anclada en PL+300): el área de nombre es ~PL+14 → ~PL+290.
  const legendRows = capas.map((c, i) => {
    const name = c.esCamara ? 'Cámara de aire' : (c.mat || c.name || c.n || '—')
    const nameShort = name.length > 42 ? name.slice(0, 41) + '…' : name
    const col  = fichaLayerColor(name)
    const esp  = c.esCamara ? '—' : `${Math.round(parseFloat(c.esp || 0))} mm`
    const lam  = (!c.esCamara && parseFloat(c.lam) > 0) ? parseFloat(c.lam).toFixed(3) : '—'
    const Ri   = (!c.esCamara && parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0)
      ? (parseFloat(c.esp)/1000/parseFloat(c.lam)).toFixed(3) : '—'
    const ry   = LEGEND_Y + 24 + i * ROW_H
    return `<rect x="${PL}" y="${ry - 9}" width="9" height="9" fill="${col.fill}" stroke="${col.stroke}" stroke-width="1" rx="1.5"/>
<text x="${PL + 14}" y="${ry}" font-size="8.5" fill="#1e293b"><tspan font-weight="700">${i+1}.</tspan> ${nameShort}</text>
<text x="${PL + 300}" y="${ry}" font-size="8.5" fill="#475569" text-anchor="end">${esp}</text>
<text x="${PL + 370}" y="${ry}" font-size="8.5" fill="#475569" text-anchor="end">λ ${lam}</text>
<text x="${PL + 450}" y="${ry}" font-size="8.5" fill="#475569" text-anchor="end">R ${Ri}</text>`
  }).join('\n')

  const totalEsp = capas.filter(c => !c.esCamara).reduce((a, c) => a + parseFloat(c.esp || 0), 0)
  const cumpleU  = uMax && uCalc != null ? uCumpleMax(uCalc, uMax) : null
  const legendEndY = LEGEND_Y + 24 + capas.length * ROW_H
  const uBadgeY    = legendEndY + 8
  const H          = uBadgeY + (uCalc != null ? 20 : 6)

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <clipPath id="csl-${uid}"><rect x="${PL}" y="${PT}" width="${gW}" height="${LAYER_H}"/></clipPath>
  <pattern id="cs-insul-${uid}" patternUnits="userSpaceOnUse" width="8" height="8"><line x1="0" y1="8" x2="8" y2="0" stroke="#f59e0b" stroke-width="1.5" opacity="0.55"/></pattern>
  <pattern id="cs-conc-${uid}"  patternUnits="userSpaceOnUse" width="8" height="8"><circle cx="2" cy="2" r="1.2" fill="#94a3b8" opacity="0.45"/><circle cx="6" cy="6" r="1.2" fill="#94a3b8" opacity="0.45"/></pattern>
  <pattern id="cs-wood-${uid}"  patternUnits="userSpaceOnUse" width="4" height="10"><line x1="0" y1="0" x2="4" y2="0" stroke="#d97706" stroke-width="1.2" opacity="0.45"/><line x1="0" y1="4" x2="4" y2="4" stroke="#d97706" stroke-width="0.7" opacity="0.3"/></pattern>
  <pattern id="cs-brick-${uid}" patternUnits="userSpaceOnUse" width="16" height="10"><rect x="0" y="0" width="16" height="10" fill="none" stroke="#f87171" stroke-width="0.8" opacity="0.5"/><line x1="8" y1="0" x2="8" y2="5" stroke="#f87171" stroke-width="0.8" opacity="0.5"/><line x1="0" y1="5" x2="16" y2="5" stroke="#f87171" stroke-width="0.8" opacity="0.5"/></pattern>
  <pattern id="cs-air-${uid}"   patternUnits="userSpaceOnUse" width="10" height="10"><circle cx="5" cy="5" r="1.5" fill="#7dd3fc" opacity="0.4"/></pattern>
  <pattern id="cs-mem-${uid}"   patternUnits="userSpaceOnUse" width="6" height="4"><line x1="0" y1="2" x2="6" y2="2" stroke="#a78bfa" stroke-width="2" opacity="0.6"/></pattern>
  <pattern id="cs-metal-${uid}" patternUnits="userSpaceOnUse" width="5" height="5"><line x1="0" y1="0" x2="5" y2="5" stroke="#334155" stroke-width="0.8" opacity="0.4"/></pattern>
</defs>
<rect width="${W}" height="${H}" fill="white" rx="6" stroke="#e2e8f0" stroke-width="1.5"/>
<text x="${W/2}" y="16" text-anchor="middle" font-size="10.5" fill="#0e6560" font-weight="700">${titulo}</text>
<text x="${W/2}" y="29" text-anchor="middle" font-size="8.5" fill="#64748b">${label ? label + ' · ' : ''}${capas.length} capas · Espesor total: ${totalEsp.toFixed(0)} mm</text>
<text x="${PL - 5}" y="${f(PT + LAYER_H/2 + 4)}" text-anchor="end" font-size="9.5" fill="#92400e" font-weight="700">INT</text>
<text x="${PL + gW + 5}" y="${f(PT + LAYER_H/2 + 4)}" text-anchor="start" font-size="9.5" fill="#0e6560" font-weight="700">EXT</text>
<line x1="${PL}" y1="${PT - 2}" x2="${PL}" y2="${PT + LAYER_H + 2}" stroke="#94a3b8" stroke-width="0.9" stroke-dasharray="3,2"/>
<line x1="${PL+gW}" y1="${PT - 2}" x2="${PL+gW}" y2="${PT + LAYER_H + 2}" stroke="#94a3b8" stroke-width="0.9" stroke-dasharray="3,2"/>
${cotaParts.join('\n')}
${layerParts.join('\n')}
<line x1="${PL}" y1="${LEGEND_Y - 3}" x2="${PL+gW}" y2="${LEGEND_Y - 3}" stroke="#e2e8f0" stroke-width="1"/>
<text x="${PL}" y="${LEGEND_Y + 9}" font-size="7.5" fill="#94a3b8" font-weight="600">N°  Material</text>
<text x="${PL + 300}" y="${LEGEND_Y + 9}" font-size="7.5" fill="#94a3b8" text-anchor="end">Espesor</text>
<text x="${PL + 370}" y="${LEGEND_Y + 9}" font-size="7.5" fill="#94a3b8" text-anchor="end">λ W/mK</text>
<text x="${PL + 450}" y="${LEGEND_Y + 9}" font-size="7.5" fill="#94a3b8" text-anchor="end">R m²K/W</text>
${legendRows}
${uCalc != null ? `<rect x="${PL}" y="${uBadgeY - 2}" width="${gW}" height="15" fill="#f1f5f9" rx="2"/>
<text x="${W/2}" y="${uBadgeY + 9}" text-anchor="middle" font-size="9" fill="${cumpleU === false ? '#dc2626' : '#166534'}" font-weight="700">U = ${parseFloat(uCalc).toFixed(4)} W/m²K${uMax ? ` — Límite DS N°15: ≤ ${uMax} W/m²K — ${cumpleU ? '✓ CUMPLE' : '✗ NO CUMPLE'}` : ''}</text>` : ''}
</svg>`
}

// ── Diagrama comparativo original vs modificado ────────────────────────────────
function capasComparacionSvgStr(capasOrig, capasModif, opts = {}) {
  const { label = '', uCalcOrig, uCalcModif, uMax } = opts
  const svgOrig  = capasSeccionSvgStr(capasOrig,  { titulo: `Configuración original — ${label}`, uCalc: uCalcOrig, uMax, label })
  const svgModif = capasSeccionSvgStr(capasModif, { titulo: `Configuración modificada — ${label}`, uCalc: uCalcModif, uMax, label })
  const W = 600, H = 290
  // Devolver ambos SVGs como HTML para mostrarlos apilados en el informe
  return { svgOrig, svgModif }
}

// ── Resolver capas de una solución LOSCAT (utilidad compartida) ────────────────
// Busca primero en SC_CAPAS (tabla principal), luego en BH (banco hormigón),
// y como fallback parsea la cadena "Material1 esp | Material2 esp | ..."
function getCapasParaSC(sc) {
  if (!sc) return null
  // PDA: capas curadas estructuradas (para detalles/encuentros y puentes térmicos).
  if (sc.capasStruct?.length) return sc.capasStruct.map(c => ({ mat: c.mat, lam: c.esCamara ? '' : c.lam, esp: c.esp, mu: c.esCamara ? '' : c.mu, esCamara: !!c.esCamara }))
  const raw = SC_CAPAS[sc.cod]
  if (raw?.length) return raw
  const bh = BH.find(b => b.cod === sc.cod)
  if (bh?.capas?.length) return bh.capas.map(c => ({ mat: c.n, lam: c.lam, esp: c.esp, mu: c.mu, esCamara: c.esCamara }))
  return (sc.capas || '').split(' | ').map(part => {
    const m = part.trim().match(/^(.*?)\s+([\d.]+)$/)
    if (!m) return null
    const nombre = m[1].trim()
    const isCamara = /camara|aire/i.test(nombre)
    const matDat = ALL_MATS.find(x => x.n.toLowerCase() === nombre.toLowerCase()) || {}
    return { mat: nombre, lam: isCamara ? '' : (matDat.lam || ''), esp: m[2], mu: isCamara ? '' : (matDat.mu || '1'), esCamara: isCamara }
  }).filter(Boolean)
}

// ── Detector de aislación: identifica capas de aislación térmica ───────────────
// Devuelve el ÍNDICE de la primera capa aislante encontrada en la lista, o -1.
function findAislacionIdx(capas) {
  if (!capas?.length) return -1
  const aislantes = ['lana vidrio', 'lana mineral', 'lana de roca', 'eps', 'xps',
    'poliuretano', 'pu ', 'poliestireno', 'aislaci', 'aislante', 'celulosa',
    'pir', 'pir/pur', 'corcho', 'fibra de madera', 'lm', 'lv']
  for (let i = 0; i < capas.length; i++) {
    const n = (capas[i].mat || capas[i].n || '').toLowerCase()
    if (aislantes.some(a => n.includes(a))) return i
  }
  return -1
}

// ── ESCANTILLÓN: Detalle constructivo de unión entre 2 elementos ───────────────
// tipo: 'muro-piso' (muro arriba, piso abajo)
//       'muro-cubierta' o 'muro-techumbre' (techo arriba, muro abajo)
// muroCapas: array de capas del muro (orden INT → EXT)
// horizCapas: array de capas del piso/techo (orden INT → EXT)
function escantillonSvgStr(opts) {
  const {
    muroCapas, horizCapas, tipo = 'muro-piso',
    muroLabel = 'Muro', horizLabel = 'Piso',
    muroSc, horizSc, muroU, horizU,
  } = opts
  if (!muroCapas?.length || !horizCapas?.length) return ''

  const f   = n => Number(n).toFixed(1)
  const uid = Math.random().toString(36).slice(2, 7)

  // ── Canvas y geometría ────────────────────────────────────────────
  const W       = 860
  const muroArriba = tipo === 'muro-piso'

  // Bloque del muro (bandas verticales)
  const WALL_X  = 124   // deja 104px a la izquierda para INT + cotas horiz
  const WALL_W  = 220   // ancho visual
  const WALL_H  = 268   // alto visual
  const COTA_H  = 32    // espacio reservado para cadena de cotas encima del muro

  // Bloque horizontal (piso/techo)
  const HORIZ_X = 20
  const HORIZ_W = W - HORIZ_X - 14   // 826 px (ancho total del canvas)
  const HORIZ_H = 116
  const HCOTA_X = HORIZ_X + 54       // x de la línea de cotas vertical del horiz
  // El horizontal (piso/techo) se CORTA en el plano del muro perimetral: no se
  // prolonga hacia el exterior. Termina en la cara exterior del muro (encuentro
  // tipo), con línea de quiebre en el extremo interior (continúa hacia adentro).
  const HORIZ_X2 = WALL_X + WALL_W   // línea de corte = cara exterior del muro
  const HORIZ_WD = HORIZ_X2 - HORIZ_X // ancho dibujado del piso

  // Calcular Y según orientación
  const TOP_PAD = 56
  const WALL_Y = muroArriba
    ? TOP_PAD + COTA_H
    : TOP_PAD + HORIZ_H + 6 + COTA_H
  const HORIZ_Y = muroArriba
    ? WALL_Y + WALL_H
    : TOP_PAD + 6

  const COTA_Y = WALL_Y - 12   // y de la cadena de cotas sobre el muro

  // ── Proporcionar anchos/altos ─────────────────────────────────────
  const CAM_FRAC = 0.05
  const muroTotEsp  = muroCapas.filter(c => !c.esCamara).reduce((a, c) => a + parseFloat(c.esp || 0), 0) || 1
  const muroNCam    = muroCapas.filter(c => c.esCamara).length
  const muroRealFrac = 1 - muroNCam * CAM_FRAC
  const muroLW = muroCapas.map(c => c.esCamara
    ? WALL_W * CAM_FRAC
    : WALL_W * muroRealFrac * (parseFloat(c.esp || 0) / muroTotEsp))

  const horizTotEsp = horizCapas.filter(c => !c.esCamara).reduce((a, c) => a + parseFloat(c.esp || 0), 0) || 1
  const horizNCam   = horizCapas.filter(c => c.esCamara).length
  const horizRealFrac = 1 - horizNCam * CAM_FRAC
  const horizLH = horizCapas.map(c => c.esCamara
    ? HORIZ_H * CAM_FRAC
    : HORIZ_H * horizRealFrac * (parseFloat(c.esp || 0) / horizTotEsp))

  // ── Detectar aislación ────────────────────────────────────────────
  const muroAislIdx  = findAislacionIdx(muroCapas)
  const horizAislIdx = findAislacionIdx(horizCapas)

  // ── Render capas del muro ─────────────────────────────────────────
  let xCur = WALL_X
  const wallRects  = []
  const wallBadges = []
  const cotaMuro   = []

  // Línea horizontal de la cadena de cotas
  cotaMuro.push(`<line x1="${WALL_X}" y1="${COTA_Y}" x2="${WALL_X + WALL_W}" y2="${COTA_Y}" stroke="#475569" stroke-width="1"/>`)
  cotaMuro.push(`<line x1="${WALL_X}" y1="${COTA_Y}" x2="${WALL_X}" y2="${WALL_Y - 2}" stroke="#475569" stroke-width="0.9"/>`)

  muroCapas.forEach((c, i) => {
    const w    = muroLW[i]
    const name = c.esCamara ? 'Cámara de aire' : (c.mat || c.n || '—')
    const col  = fichaLayerColor(name)
    const hasPat = ['insul','conc','wood','brick','air','mem','metal'].includes(col.pat)
    const espMm  = c.esCamara ? '' : `${Math.round(parseFloat(c.esp || 0))}`
    const cx = xCur + w/2

    // Rect con clipPath
    wallRects.push(`<rect x="${f(xCur)}" y="${WALL_Y}" width="${f(w)}" height="${WALL_H}" fill="${col.fill}" stroke="${col.stroke}" stroke-width="1.2" clip-path="url(#cwm-${uid})"/>`)
    if (hasPat) wallRects.push(`<rect x="${f(xCur)}" y="${WALL_Y}" width="${f(w)}" height="${WALL_H}" fill="url(#es-${col.pat}-${uid})" clip-path="url(#cwm-${uid})"/>`)

    // Badge numérico
    if (w > 10) {
      wallBadges.push(`<circle cx="${f(cx)}" cy="${WALL_Y + 14}" r="7.5" fill="${col.stroke}" opacity="0.9"/>`)
      wallBadges.push(`<text x="${f(cx)}" y="${WALL_Y + 18}" text-anchor="middle" font-size="8.5" fill="white" font-weight="700">${i+1}</text>`)
    }

    // Cota: tick derecho + texto
    const tickX = xCur + w
    cotaMuro.push(`<line x1="${f(tickX)}" y1="${COTA_Y}" x2="${f(tickX)}" y2="${WALL_Y - 2}" stroke="#475569" stroke-width="0.9"/>`)
    if (espMm) {
      if (w >= 20) {
        cotaMuro.push(`<text x="${f(cx)}" y="${COTA_Y - 4}" text-anchor="middle" font-size="8.5" fill="#1e293b" font-weight="700">${espMm}</text>`)
      } else if (w >= 8) {
        cotaMuro.push(`<text x="${f(cx)}" y="${COTA_Y - 4}" text-anchor="middle" font-size="7" fill="#1e293b" font-weight="700" transform="rotate(-55 ${f(cx)} ${COTA_Y - 4})">${espMm}</text>`)
      }
    }
    xCur += w
  })

  // ── Render capas del horiz ────────────────────────────────────────
  let yCur = HORIZ_Y
  const horizRects  = []
  const horizBadges = []
  const cotaHoriz   = []

  // Línea vertical de la cadena de cotas del horiz
  cotaHoriz.push(`<line x1="${HCOTA_X}" y1="${HORIZ_Y}" x2="${HCOTA_X}" y2="${HORIZ_Y + HORIZ_H}" stroke="#475569" stroke-width="1"/>`)
  cotaHoriz.push(`<line x1="${HCOTA_X}" y1="${HORIZ_Y}" x2="${HORIZ_X + 62}" y2="${HORIZ_Y}" stroke="#475569" stroke-width="0.9"/>`)

  horizCapas.forEach((c, i) => {
    const h    = horizLH[i]
    const name = c.esCamara ? 'Cámara de aire' : (c.mat || c.n || '—')
    const col  = fichaLayerColor(name)
    const hasPat = ['insul','conc','wood','brick','air','mem','metal'].includes(col.pat)
    const espMm  = c.esCamara ? '' : `${Math.round(parseFloat(c.esp || 0))}`
    const cy = yCur + h/2

    // Rect con clipPath — el piso termina en la cara exterior del muro (HORIZ_WD)
    horizRects.push(`<rect x="${HORIZ_X}" y="${f(yCur)}" width="${HORIZ_WD}" height="${f(h)}" fill="${col.fill}" stroke="${col.stroke}" stroke-width="1.2" clip-path="url(#cwh-${uid})"/>`)
    if (hasPat) horizRects.push(`<rect x="${HORIZ_X}" y="${f(yCur)}" width="${HORIZ_WD}" height="${f(h)}" fill="url(#es-${col.pat}-${uid})" clip-path="url(#cwh-${uid})"/>`)

    // Badge en la zona interior visible del piso (a la izquierda del muro)
    if (h > 12) {
      const bx = WALL_X - 15
      horizBadges.push(`<circle cx="${bx}" cy="${f(cy)}" r="7.5" fill="${col.stroke}" opacity="0.9"/>`)
      horizBadges.push(`<text x="${bx}" y="${f(cy + 3)}" text-anchor="middle" font-size="8.5" fill="white" font-weight="700">${i+1}</text>`)
    }

    // Cota: tick inferior + texto a la izquierda
    const tickY = yCur + h
    cotaHoriz.push(`<line x1="${HCOTA_X - 4}" y1="${f(tickY)}" x2="${HCOTA_X + 4}" y2="${f(tickY)}" stroke="#475569" stroke-width="0.9"/>`)
    if (espMm && h >= 14) {
      cotaHoriz.push(`<text x="${HCOTA_X - 7}" y="${f(cy + 3.5)}" text-anchor="end" font-size="8.5" fill="#1e293b" font-weight="700">${espMm}</text>`)
    }
    yCur += h
  })

  // ── Línea de quiebre (corte) en el extremo interior del piso ──────
  // Indica que el elemento continúa hacia el interior (no termina en el borde).
  const brkN = 6, brkPts = []
  for (let k = 0; k <= brkN; k++) {
    const yy = HORIZ_Y + (HORIZ_H / brkN) * k
    brkPts.push(`${f(HORIZ_X + (k % 2 ? 6 : 0))},${f(yy)}`)
  }
  const quiebrePiso = `<polyline points="${brkPts.join(' ')}" fill="none" stroke="#64748b" stroke-width="1.4" opacity="0.85"/>`

  // ── Zonas INT / EXT ───────────────────────────────────────────────
  const intX = HORIZ_X, intW = WALL_X - HORIZ_X
  const extX = WALL_X + WALL_W
  const extW = HORIZ_W - intW - WALL_W
  const zoneY = muroArriba ? WALL_Y : HORIZ_Y
  const zoneH = muroArriba ? WALL_H : HORIZ_H
  const intZone = `<rect x="${intX}" y="${zoneY}" width="${intW}" height="${zoneH}" fill="#fffbeb" opacity="0.5"/>
<text x="${intX + intW/2}" y="${zoneY + zoneH/2}" text-anchor="middle" font-size="9" fill="#92400e" font-weight="800" opacity="0.65" transform="rotate(-90 ${intX + intW/2} ${zoneY + zoneH/2})">INTERIOR</text>`
  const extZone = `<rect x="${extX}" y="${zoneY}" width="${extW}" height="${zoneH}" fill="#f0fdfa" opacity="0.5"/>
<text x="${extX + extW/2}" y="${zoneY + zoneH/2}" text-anchor="middle" font-size="9" fill="#0e6560" font-weight="800" opacity="0.65" transform="rotate(-90 ${extX + extW/2} ${zoneY + zoneH/2})">EXTERIOR</text>`
  const intLabel = `<text x="${WALL_X - 6}" y="${f(WALL_Y + WALL_H/2 + 4)}" text-anchor="end" font-size="10.5" fill="#92400e" font-weight="700">INT</text>`
  const extLabel = `<text x="${WALL_X + WALL_W + 6}" y="${f(WALL_Y + WALL_H/2 + 4)}" text-anchor="start" font-size="10.5" fill="#0e6560" font-weight="700">EXT</text>`

  // ── Continuidad de aislación ──────────────────────────────────────
  let muroAislX1 = null, muroAislX2 = null
  if (muroAislIdx >= 0) {
    muroAislX1 = WALL_X + muroLW.slice(0, muroAislIdx).reduce((a, w) => a + w, 0)
    muroAislX2 = muroAislX1 + muroLW[muroAislIdx]
  }
  let horizAislY1 = null, horizAislY2 = null
  if (horizAislIdx >= 0) {
    horizAislY1 = HORIZ_Y + horizLH.slice(0, horizAislIdx).reduce((a, h) => a + h, 0)
    horizAislY2 = horizAislY1 + horizLH[horizAislIdx]
  }

  let lineaAislacion = '', zonaPuente = '', estadoContinuidad = ''
  if (muroAislIdx >= 0 && horizAislIdx >= 0) {
    const mx  = (muroAislX1 + muroAislX2) / 2
    const hmy = (horizAislY1 + horizAislY2) / 2
    const junctionY = muroArriba ? HORIZ_Y : WALL_Y
    lineaAislacion = `<line x1="${f(mx)}" y1="${f(junctionY)}" x2="${f(mx)}" y2="${f(hmy)}" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5,3" opacity="0.9"/>
<line x1="${f(mx)}" y1="${f(hmy)}" x2="${f(WALL_X - 20)}" y2="${f(hmy)}" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5,3" opacity="0.9"/>
<text x="${f(mx + 7)}" y="${f(junctionY + 16)}" font-size="8" fill="#92400e" font-weight="700">↕ aislación continua</text>`
    estadoContinuidad = '✓ Ambos elementos tienen aislación identificada. Verificar continuidad en obra para evitar puentes térmicos.'
  } else if (muroAislIdx >= 0 || horizAislIdx >= 0) {
    const ptCx = muroAislX1 != null ? (muroAislX1 + muroAislX2) / 2 : WALL_X + WALL_W/2
    const ptCy = muroArriba ? HORIZ_Y : WALL_Y
    zonaPuente = `<rect x="${f(ptCx - 24)}" y="${f(ptCy - 16)}" width="48" height="32" fill="#fee2e2" stroke="#dc2626" stroke-width="1.8" stroke-dasharray="4,2" opacity="0.75" rx="4"/>
<text x="${f(ptCx)}" y="${f(ptCy + 5)}" text-anchor="middle" font-size="9" fill="#991b1b" font-weight="800">⚠ PT</text>`
    estadoContinuidad = `⚠ Solo ${muroAislIdx >= 0 ? muroLabel : horizLabel} tiene aislación identificada — probable puente térmico en la unión.`
  } else {
    estadoContinuidad = '⚠ Ningún elemento tiene aislación térmica identificada en sus capas.'
  }

  // ── Leyenda tabular ───────────────────────────────────────────────
  const drawingBotY = Math.max(WALL_Y + WALL_H, HORIZ_Y + HORIZ_H)
  const SEP_Y   = drawingBotY + 14
  const ROW_H   = 15
  const COL_ESP = 434, COL_LAM = 514, COL_R = 596

  function legendRows(capas, startY) {
    return capas.map((c, i) => {
      const name = c.esCamara ? 'Cámara de aire' : (c.mat || c.n || '—')
      const col  = fichaLayerColor(name)
      const esp  = c.esCamara ? '—' : `${Math.round(parseFloat(c.esp || 0))} mm`
      const lam  = (!c.esCamara && parseFloat(c.lam) > 0) ? parseFloat(c.lam).toFixed(3) : '—'
      const Ri   = (!c.esCamara && parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0)
        ? (parseFloat(c.esp)/1000/parseFloat(c.lam)).toFixed(3) : '—'
      const ry   = startY + i * ROW_H
      return `<rect x="24" y="${ry - 9}" width="9" height="9" fill="${col.fill}" stroke="${col.stroke}" stroke-width="1" rx="1.5"/>
<text x="36" y="${ry}" font-size="8.5" fill="#1e293b"><tspan font-weight="700">${i+1}.</tspan> ${name}</text>
<text x="${COL_ESP}" y="${ry}" font-size="8.5" fill="#475569" text-anchor="end">${esp}</text>
<text x="${COL_LAM}" y="${ry}" font-size="8.5" fill="#475569" text-anchor="end">λ ${lam}</text>
<text x="${COL_R}"   y="${ry}" font-size="8.5" fill="#475569" text-anchor="end">R ${Ri}</text>`
    }).join('\n')
  }

  const muroHdrY    = SEP_Y + 12
  const muroRowsY   = muroHdrY + 14
  const horizHdrY   = muroRowsY + muroCapas.length * ROW_H + 10
  const horizRowsY  = horizHdrY + 14
  const analBoxY    = horizRowsY + horizCapas.length * ROW_H + 12
  const H           = analBoxY + 36 + 12

  const analBg     = (muroAislIdx >= 0 && horizAislIdx >= 0) ? '#dcfce7' : '#fef2f2'
  const analBorder = (muroAislIdx >= 0 && horizAislIdx >= 0) ? '#86efac' : '#fca5a5'
  const analColor  = (muroAislIdx >= 0 && horizAislIdx >= 0) ? '#166534' : '#991b1b'

  // ── Títulos de elementos ──────────────────────────────────────────
  const tipoLabels = {
    'muro-piso'     : 'Detalle constructivo · Encuentro Muro – Piso',
    'muro-cubierta' : 'Detalle constructivo · Encuentro Muro – Cubierta plana',
    'muro-techumbre': 'Detalle constructivo · Encuentro Muro – Techumbre',
  }
  const titleStr = tipoLabels[tipo] || 'Detalle constructivo'

  const muroTotDisplay  = muroCapas.filter(c=>!c.esCamara).reduce((a,c)=>a+parseFloat(c.esp||0),0)
  const horizTotDisplay = horizCapas.filter(c=>!c.esCamara).reduce((a,c)=>a+parseFloat(c.esp||0),0)

  const wallTitleY  = muroArriba ? WALL_Y - COTA_H - 8 : WALL_Y + WALL_H + 18
  const wallTitleEl = `<text x="${f(WALL_X + WALL_W/2)}" y="${wallTitleY}" text-anchor="middle" font-size="10" fill="#0e6560" font-weight="700">${muroLabel}${muroSc ? ` · ${muroSc}` : ''}${muroU != null ? ` · U=${muroU}` : ''}</text>`

  const hTitleX = 9, hTitleY = HORIZ_Y + HORIZ_H/2
  const horizTitleEl = `<text x="${hTitleX}" y="${hTitleY}" text-anchor="middle" font-size="9.5" fill="#0e6560" font-weight="700" transform="rotate(-90 ${hTitleX} ${hTitleY})">${horizLabel}${horizSc ? ` · ${horizSc}` : ''}${horizU != null ? ` · U=${horizU}` : ''}</text>`

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width:${W}px;height:auto;display:block">
<defs>
  <clipPath id="cwm-${uid}"><rect x="${WALL_X}" y="${WALL_Y}" width="${WALL_W}" height="${WALL_H}"/></clipPath>
  <clipPath id="cwh-${uid}"><rect x="${HORIZ_X}" y="${HORIZ_Y}" width="${HORIZ_WD}" height="${HORIZ_H}"/></clipPath>
  <pattern id="es-insul-${uid}" patternUnits="userSpaceOnUse" width="8" height="8"><line x1="0" y1="8" x2="8" y2="0" stroke="#f59e0b" stroke-width="1.5" opacity="0.55"/></pattern>
  <pattern id="es-conc-${uid}"  patternUnits="userSpaceOnUse" width="8" height="8"><circle cx="2" cy="2" r="1.2" fill="#94a3b8" opacity="0.45"/><circle cx="6" cy="6" r="1.2" fill="#94a3b8" opacity="0.45"/></pattern>
  <pattern id="es-wood-${uid}"  patternUnits="userSpaceOnUse" width="4" height="10"><line x1="0" y1="0" x2="4" y2="0" stroke="#d97706" stroke-width="1.2" opacity="0.45"/><line x1="0" y1="4" x2="4" y2="4" stroke="#d97706" stroke-width="0.7" opacity="0.3"/></pattern>
  <pattern id="es-brick-${uid}" patternUnits="userSpaceOnUse" width="16" height="10"><rect x="0" y="0" width="16" height="10" fill="none" stroke="#f87171" stroke-width="0.8" opacity="0.5"/><line x1="8" y1="0" x2="8" y2="5" stroke="#f87171" stroke-width="0.8" opacity="0.5"/><line x1="0" y1="5" x2="16" y2="5" stroke="#f87171" stroke-width="0.8" opacity="0.5"/></pattern>
  <pattern id="es-air-${uid}"   patternUnits="userSpaceOnUse" width="10" height="10"><circle cx="5" cy="5" r="1.5" fill="#7dd3fc" opacity="0.4"/></pattern>
  <pattern id="es-mem-${uid}"   patternUnits="userSpaceOnUse" width="6" height="4"><line x1="0" y1="2" x2="6" y2="2" stroke="#a78bfa" stroke-width="2" opacity="0.6"/></pattern>
  <pattern id="es-metal-${uid}" patternUnits="userSpaceOnUse" width="5" height="5"><line x1="0" y1="0" x2="5" y2="5" stroke="#334155" stroke-width="0.8" opacity="0.4"/></pattern>
</defs>
<rect width="${W}" height="${H}" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="1.5"/>
<rect x="0" y="0" width="${W}" height="52" fill="#115e59" rx="8"/>
<rect x="0" y="44" width="${W}" height="8" fill="#115e59"/>
<text x="${W/2}" y="22" text-anchor="middle" font-size="13" fill="white" font-weight="800">${titleStr}</text>
<text x="${W/2}" y="40" text-anchor="middle" font-size="9" fill="#99f6e4">${muroLabel}: ${muroTotDisplay} mm · ${horizLabel}: ${horizTotDisplay} mm · espesores en mm · sección esquemática</text>

${intZone}${extZone}${intLabel}${extLabel}
${wallTitleEl}
${horizTitleEl}

${horizRects.join('\n')}
${quiebrePiso}
${wallRects.join('\n')}
${wallBadges.join('\n')}
${horizBadges.join('\n')}
${cotaMuro.join('\n')}
${cotaHoriz.join('\n')}
${lineaAislacion}
${zonaPuente}

<line x1="20" y1="${SEP_Y}" x2="${W - 10}" y2="${SEP_Y}" stroke="#e2e8f0" stroke-width="1.5"/>
<text x="24" y="${muroHdrY}" font-size="10" fill="#0e6560" font-weight="700">🧱 ${muroLabel}</text>
<text x="${COL_ESP}" y="${muroHdrY}" font-size="7.5" fill="#94a3b8" text-anchor="end">Espesor</text>
<text x="${COL_LAM}" y="${muroHdrY}" font-size="7.5" fill="#94a3b8" text-anchor="end">λ W/mK</text>
<text x="${COL_R}"   y="${muroHdrY}" font-size="7.5" fill="#94a3b8" text-anchor="end">R m²K/W</text>
${legendRows(muroCapas, muroRowsY)}
<line x1="24" y1="${horizHdrY - 5}" x2="${W - 10}" y2="${horizHdrY - 5}" stroke="#e2e8f0" stroke-width="1"/>
<text x="24" y="${horizHdrY}" font-size="10" fill="#0e6560" font-weight="700">📐 ${horizLabel}</text>
${legendRows(horizCapas, horizRowsY)}
<rect x="20" y="${analBoxY}" width="${W - 30}" height="34" fill="${analBg}" stroke="${analBorder}" stroke-width="1.5" rx="6"/>
<text x="30" y="${analBoxY + 13}" font-size="9.5" fill="${analColor}" font-weight="700">📊 Análisis de continuidad de aislación</text>
<text x="30" y="${analBoxY + 27}" font-size="8.5" fill="${analColor}">${estadoContinuidad}</text>
</svg>`
}

function fichaScSvgStr(s, capas, opts = {}) {
  // Layout: barras de capas con badge numerado dentro + leyenda debajo (N° →
  // nombre/espesor/λ). Antes las etiquetas iban rotadas 38° desde el centro de
  // cada capa y se superponían en capas delgadas/numerosas.
  const W = 560
  const PL = 38, PR = 38, PT = 40
  const gW = W - PL - PR
  const DIAG_H = 104
  const ROW_H = 13
  const legendHeadY = PT + DIAG_H + 14
  const firstRowY = legendHeadY + 20
  const legendEndY = firstRowY + capas.length * ROW_H
  const badgesTop = legendEndY + 4
  const H = badgesTop + 30

  const nCam = capas.filter(c => c.esCamara).length
  const realEsp = capas.filter(c => !c.esCamara).reduce((a, c) => a + Math.max(parseFloat(c.esp || 0), 1), 0)
  const CAM_FRAC = Math.min(0.07, 0.4 / Math.max(nCam, 1))
  const realFrac = 1 - nCam * CAM_FRAC
  const rawW = capas.map(c => c.esCamara
    ? gW * CAM_FRAC
    : realEsp > 0 ? gW * realFrac * (Math.max(parseFloat(c.esp || 0), 1) / realEsp) : gW / capas.length)

  const defs = `<defs>
<pattern id="fp-insul" patternUnits="userSpaceOnUse" width="8" height="8"><line x1="0" y1="8" x2="8" y2="0" stroke="#f59e0b" stroke-width="1.5" opacity="0.5"/></pattern>
<pattern id="fp-conc" patternUnits="userSpaceOnUse" width="8" height="8"><circle cx="2" cy="2" r="1.2" fill="#94a3b8" opacity="0.4"/><circle cx="6" cy="6" r="1.2" fill="#94a3b8" opacity="0.4"/></pattern>
<pattern id="fp-wood" patternUnits="userSpaceOnUse" width="4" height="10"><line x1="0" y1="0" x2="4" y2="0" stroke="#d97706" stroke-width="1.2" opacity="0.45"/><line x1="0" y1="4" x2="4" y2="4" stroke="#d97706" stroke-width="0.7" opacity="0.3"/><line x1="0" y1="7" x2="4" y2="7" stroke="#d97706" stroke-width="0.5" opacity="0.2"/></pattern>
<pattern id="fp-brick" patternUnits="userSpaceOnUse" width="16" height="10"><rect x="0" y="0" width="16" height="10" fill="none" stroke="#f87171" stroke-width="0.8" opacity="0.5"/><line x1="8" y1="0" x2="8" y2="5" stroke="#f87171" stroke-width="0.8" opacity="0.5"/><line x1="0" y1="5" x2="16" y2="5" stroke="#f87171" stroke-width="0.8" opacity="0.5"/></pattern>
<pattern id="fp-air" patternUnits="userSpaceOnUse" width="10" height="10"><circle cx="5" cy="5" r="1.5" fill="#7dd3fc" opacity="0.4"/></pattern>
<pattern id="fp-mem" patternUnits="userSpaceOnUse" width="6" height="4"><line x1="0" y1="2" x2="6" y2="2" stroke="#a78bfa" stroke-width="2" opacity="0.6"/></pattern>
<pattern id="fp-metal" patternUnits="userSpaceOnUse" width="5" height="5"><line x1="0" y1="0" x2="5" y2="5" stroke="#334155" stroke-width="0.8" opacity="0.4"/></pattern>
</defs>`

  // Barras + badge numerado + espesor dentro del bloque (si hay espacio)
  let xCur = PL
  const layerParts = capas.map((c, i) => {
    const w = rawW[i]
    const col = c.esCamara ? { fill: '#ccfbf1', stroke: '#7dd3fc', pat: 'air' } : fichaLayerColor(c.n || c.mat || c.name || '')
    const hasPat = ['insul', 'conc', 'wood', 'brick', 'air', 'mem', 'metal'].includes(col.pat)
    const mx = xCur + w / 2
    const espStr = c.esCamara ? '' : `${Math.round(parseFloat(c.esp || 0))}`
    const out = [
      `<rect x="${xCur.toFixed(1)}" y="${PT}" width="${w.toFixed(1)}" height="${DIAG_H}" fill="${col.fill}" stroke="${col.stroke}" stroke-width="1.2"/>`,
      hasPat ? `<rect x="${xCur.toFixed(1)}" y="${PT}" width="${w.toFixed(1)}" height="${DIAG_H}" fill="url(#fp-${col.pat})" stroke="none"/>` : '',
      w > 12 ? `<circle cx="${mx.toFixed(1)}" cy="${PT + 13}" r="7" fill="${col.stroke}" opacity="0.92"/>
<text x="${mx.toFixed(1)}" y="${PT + 16}" text-anchor="middle" font-size="8" fill="white" font-weight="700">${i + 1}</text>` : '',
      w > 28 && espStr ? `<text x="${mx.toFixed(1)}" y="${(PT + DIAG_H / 2 + 8).toFixed(1)}" text-anchor="middle" font-size="${w > 40 ? 9 : 7}" fill="#1e293b" font-weight="bold">${espStr} mm</text>` : '',
    ].filter(Boolean).join('\n')
    xCur += w
    return out
  })

  // Leyenda: N° → nombre · espesor · λ (nombre truncado para no desbordar)
  const legendRows = capas.map((c, i) => {
    const col = c.esCamara ? { fill: '#ccfbf1', stroke: '#7dd3fc' } : fichaLayerColor(c.n || c.mat || c.name || '')
    const name = c.esCamara ? 'Cámara de aire' : (c.n || c.mat || c.name || '—')
    const nameShort = name.length > 44 ? name.slice(0, 43) + '…' : name
    const esp = c.esCamara ? '—' : `${Math.round(parseFloat(c.esp || 0))} mm`
    const lam = (!c.esCamara && parseFloat(c.lam) > 0) ? parseFloat(c.lam).toFixed(3) : '—'
    const ry = firstRowY + i * ROW_H
    return `<rect x="${PL}" y="${ry - 8}" width="9" height="9" fill="${col.fill}" stroke="${col.stroke}" stroke-width="1" rx="1.5"/>
<text x="${PL + 14}" y="${ry}" font-size="8.5" fill="#1e293b"><tspan font-weight="700">${i + 1}.</tspan> ${nameShort}</text>
<text x="${PL + gW - 66}" y="${ry}" font-size="8.5" fill="#475569" text-anchor="end">${esp}</text>
<text x="${PL + gW}" y="${ry}" font-size="8.5" fill="#475569" text-anchor="end">λ ${lam}</text>`
  }).join('\n')

  const { uMax, rfReq, acReq } = opts
  const tOk = !uMax || s.u <= uMax
  const fOk = !rfReq || !s.rf || rfN(s.rf) >= rfN(rfReq)
  const aOk = !acReq || !s.ac_rw || s.ac_rw >= acReq
  const bY = badgesTop + 19, bg = W / 3
  const badges = [
    `<rect x="0" y="${badgesTop}" width="${W}" height="30" fill="#f8fafc"/>`,
    `<line x1="0" y1="${badgesTop}" x2="${W}" y2="${badgesTop}" stroke="#e2e8f0" stroke-width="1"/>`,
    `<text x="${(bg * 0.5).toFixed(1)}" y="${bY}" text-anchor="middle" font-size="8.5" fill="${uMax ? (tOk ? '#166534' : '#dc2626') : '#374151'}" font-weight="700">🌡 Térmico: U=${s.u}${uMax ? ` ≤${uMax}` : ''} W/m²K ${uMax ? (tOk ? '✓' : '✗') : ''}</text>`,
    `<text x="${(bg * 1.5).toFixed(1)}" y="${bY}" text-anchor="middle" font-size="8.5" fill="${rfReq ? (fOk ? '#166534' : '#dc2626') : '#374151'}" font-weight="700">🔥 Fuego: RF ${s.rf || '—'}${rfReq ? ` ≥${rfReq}` : ''} ${rfReq ? (fOk ? '✓' : '✗') : ''}</text>`,
    `<text x="${(bg * 2.5).toFixed(1)}" y="${bY}" text-anchor="middle" font-size="8.5" fill="${acReq ? (aOk ? '#166534' : '#dc2626') : '#374151'}" font-weight="700">🔊 Acústico: Rw ${s.ac_rw != null ? s.ac_rw + ' dB' : '—'}${acReq ? ` ≥${acReq} dB` : ''} ${acReq ? (aOk ? '✓' : '✗') : ''}</text>`,
  ].join('\n')

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
${defs}
<rect width="${W}" height="${H}" fill="white" rx="6"/>
<text x="${W / 2}" y="18" text-anchor="middle" font-size="10.5" fill="#0e6560" font-weight="700">${s.cod || ''} — Sección constructiva (int → ext)</text>
<text x="${W / 2}" y="31" text-anchor="middle" font-size="8.5" fill="#64748b">${(s.desc || '').slice(0, 74)}${(s.desc || '').length > 74 ? '…' : ''}</text>
<text x="${PL - 4}" y="${PT + DIAG_H / 2 + 4}" text-anchor="end" font-size="9" fill="#475569" font-weight="600">INT</text>
<line x1="${PL}" y1="${PT - 2}" x2="${PL}" y2="${PT + DIAG_H + 2}" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="3,2"/>
<text x="${PL + gW + 4}" y="${PT + DIAG_H / 2 + 4}" text-anchor="start" font-size="9" fill="#475569" font-weight="600">EXT</text>
<line x1="${PL + gW}" y1="${PT - 2}" x2="${PL + gW}" y2="${PT + DIAG_H + 2}" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="3,2"/>
${layerParts.join('\n')}
<line x1="${PL}" y1="${legendHeadY - 2}" x2="${PL + gW}" y2="${legendHeadY - 2}" stroke="#e2e8f0" stroke-width="1"/>
<text x="${PL + 14}" y="${legendHeadY + 8}" font-size="7.5" fill="#94a3b8" font-weight="600">N°  Material</text>
<text x="${PL + gW - 66}" y="${legendHeadY + 8}" font-size="7.5" fill="#94a3b8" text-anchor="end">Espesor</text>
<text x="${PL + gW}" y="${legendHeadY + 8}" font-size="7.5" fill="#94a3b8" text-anchor="end">λ W/mK</text>
${legendRows}
${badges}
<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#e2e8f0" stroke-width="1.5" rx="6"/>
</svg>`
}

function FichaModuloCards({ s, uMax, rfReq, acReq }) {
  const tOk = !uMax || s.u <= uMax
  const fOk = !rfReq || !s.rf || rfN(s.rf) >= rfN(rfReq)
  const aOk = !acReq || !s.ac_rw || s.ac_rw >= acReq
  const card = (ok, hasReq) => ({
    flex: 1, minWidth: 150,
    border: `1.5px solid ${!hasReq ? '#e2e8f0' : ok ? '#86efac' : '#fca5a5'}`,
    borderRadius: 6, padding: '8px 12px',
    background: !hasReq ? '#f8fafc' : ok ? '#f0fdf4' : '#fef2f2',
  })
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
      <div style={card(tOk, !!uMax)}>
        <div style={{ fontWeight: 700, fontSize: 11, color: '#0e6560', marginBottom: 4 }}>🌡 Módulo Térmico</div>
        <div style={{ fontSize: 11 }}><b>U certificado:</b> {s.u} W/m²K</div>
        {uMax && <div style={{ fontSize: 11 }}><b>U máx. DS N°15:</b> {uMax} W/m²K</div>}
        <div style={{ marginTop: 4 }}><span style={S.badge(tOk)}>{uMax ? (tOk ? 'CUMPLE' : 'NO CUMPLE') : 'Sin límite U'}</span></div>
        <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>NCh853:2021 · ISO 6946 · DS N°15 MINVU</div>
      </div>
      <div style={card(fOk, !!rfReq)}>
        <div style={{ fontWeight: 700, fontSize: 11, color: '#dc2626', marginBottom: 4 }}>🔥 Módulo Fuego</div>
        <div style={{ fontSize: 11 }}><b>RF certificada:</b> {s.rf || '—'}</div>
        {rfReq && <div style={{ fontSize: 11 }}><b>RF mín. OGUC:</b> ≥ {rfReq}</div>}
        <div style={{ marginTop: 4 }}><span style={S.badge(fOk)}>{rfReq ? (fOk ? 'CUMPLE' : 'NO CUMPLE') : 'Sin exigencia RF'}</span></div>
        <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>OGUC Art. 4.5.4 · LOFC Ed.17 2025 · NCh850</div>
      </div>
      <div style={card(aOk, !!acReq)}>
        <div style={{ fontWeight: 700, fontSize: 11, color: '#0f766e', marginBottom: 4 }}>🔊 Módulo Acústico</div>
        <div style={{ fontSize: 11 }}><b>Rw certificado:</b> {s.ac_rw != null ? s.ac_rw + ' dB' : '—'}</div>
        {acReq && <div style={{ fontSize: 11 }}><b>Rw mín. NCh352:</b> ≥ {acReq} dB</div>}
        <div style={{ marginTop: 4 }}><span style={S.badge(aOk)}>{acReq ? (aOk ? 'CUMPLE' : 'NO CUMPLE') : 'Sin exigencia Rw'}</span></div>
        <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>OGUC Art. 4.1.6 · NCh352:2013 · ISO 15712</div>
      </div>
    </div>
  )
}

const FichaSCCompleta = React.memo(function FichaSCCompleta({ s, uMax, rfReq, acReq }) {
  const capas = capasParaSC(s)
  const svgStr = fichaScSvgStr(s, capas, { uMax, rfReq, acReq })
  const totalEsp = capas.filter(c => !c.esCamara).reduce((a, c) => a + parseFloat(c.esp || 0), 0)
  return (
    <div style={{ marginTop: 10, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0e6560', marginBottom: 6 }}>
        📐 Ficha gráfica — {s.cod}
        <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8 }}>{capas.filter(c => !c.esCamara).length} capas · {totalEsp} mm total</span>
      </div>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}
        dangerouslySetInnerHTML={{ __html: svgStr }} />
      <FichaModuloCards s={s} uMax={uMax} rfReq={rfReq} acReq={acReq} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, fontSize: 9, color: '#64748b' }}>
        {[['#cbd5e1', 'Hormigón/HA'], ['#fecaca', 'Albañilería'], ['#fef08a', 'Aislante'], ['#fde68a', 'Madera/OSB'], ['#ccfbf1', 'Cámara aire'], ['#f0fdf4', 'Revoque/Yeso'], ['#64748b', 'Acero']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 10, height: 10, background: c, border: '1px solid #e2e8f0', borderRadius: 2, display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  )
})

// Mejoras: #2 Enviar a CalcU · #4 Glaser · #5 Vista gráfica · #7 Exportar ficha · #9 Variantes
const SimuladorCapas = React.memo(function SimuladorCapas({ s, elem, uMax, rfReq, acReq, proy, onEnviarCalcU, onModificar }) {
  const bhData = BH.find(b => b.cod === s.cod)
  const scRaw  = SC_CAPAS[s.cod]

  // Inicializa capas: formato unificado {id,name,lam,esp,mu,den,esCamara,esAislante}
  function initCapas() {
    if (bhData) {
      return bhData.capas.map((c, i) => ({
        id: i, name: c.n, lam: c.lam ?? null, esp: c.esp,
        mu: c.mu, den: c.den ?? MAT_DEN[c.n] ?? null,
        esCamara: !!c.esCamara, esAislante: !!c.esAislante,
      }))
    }
    if (scRaw) {
      return scRaw.map((c, i) => ({
        id: i, name: c.mat, lam: c.lam ?? null, esp: c.esp,
        mu: c.mu, den: MAT_DEN[c.mat] ?? null,
        esCamara: !!c.camara, esAislante: false,
      }))
    }
    return []
  }

  const [capas,      setCapas]      = useState(initCapas)
  const [extra,      setExtra]      = useState([])
  const [newMat,     setNewMat]     = useState('')
  const [newEsp,     setNewEsp]     = useState('20')
  const [glaserRes,  setGlaserRes]  = useState(null)
  const [showGlaser, setShowGlaser] = useState(false)
  const [varNombre,  setVarNombre]  = useState('')
  const [variantes,  setVariantes]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('oguc_variantes') || '{}')?.[s.cod] || [] }
    catch { return [] }
  })
  const [varSelIdx, setVarSelIdx] = useState('')

  // ── Cálculo U (NCh853 / ISO 6946) ─────────────────────────────────────────
  function calcUmod(base, ext) {
    const rsiKey = elem==='techumbre'?'techo':elem==='piso'?'piso':'muro'
    let R = (RSI_MAP[rsiKey]||0.13) + (RSE_MAP[rsiKey]||0.04)
    for (const c of [...base, ...ext]) {
      if (c.esCamara) { R += resistenciaCamara((parseFloat(c.esp)||0)/1000); continue }
      const lam = parseFloat(c.lam), esp = parseFloat(c.esp)
      if (!isNaN(lam) && lam > 0 && !isNaN(esp) && esp > 0) R += (esp/1000) / lam
    }
    return parseFloat((1/R).toFixed(3))
  }

  // ── Estimación Rw por ley de masa: Rw ≈ 20·log₁₀(m) + 14 ─────────────────
  function calcRwMod(base, ext) {
    const masa = [...base, ...ext].reduce((s, c) => {
      if (c.esCamara) return s
      const den = c.den ?? MAT_DEN[c.name] ?? null
      const esp = parseFloat(c.esp)
      return (den && !isNaN(esp)) ? s + (esp/1000)*den : s
    }, 0)
    if (masa > 0) return Math.round(20 * Math.log10(masa) + 14)
    // Sin densidades: usar masa_base BH + capas extra
    const masaBase = bhData?.masa_kg_m2 ?? 0
    const masaExt  = ext.reduce((s, c) => {
      const den = c.den ?? MAT_DEN[c.name] ?? null
      const esp = parseFloat(c.esp)
      return (den && !isNaN(esp)) ? s + (esp/1000)*den : s
    }, 0)
    return (masaBase + masaExt) > 0 ? Math.round(20*Math.log10(masaBase+masaExt) + 14) : null
  }

  const uMod  = calcUmod(capas, extra)
  const rwMod = calcRwMod(capas, extra)

  const tOkMod = !uMax  || uMod <= uMax
  const fOkMod = !rfReq || !s.rf || rfN(s.rf) >= rfN(rfReq)
  const aOkMod = !acReq || !rwMod || rwMod >= acReq
  const dU     = parseFloat((s.u - uMod).toFixed(3))

  // ── Reportar al padre la modificación del usuario (engrosar aislante, agregar
  //    capas…) para que "Aplicar" use la U recalculada y las capas reales, no el
  //    valor certificado original. Si no hay cambios, reporta null. ─────────────
  const capasIniciales = useMemo(initCapas, [s.cod])
  const modificado =
    extra.length > 0 ||
    capas.length !== capasIniciales.length ||
    capas.some((c, i) => {
      const o = capasIniciales[i]
      return !o || String(c.esp) !== String(o.esp) || c.name !== o.name || String(c.lam) !== String(o.lam)
    })
  useEffect(() => {
    if (!onModificar) return
    if (!modificado) { onModificar(null); return }
    const capasCalcU = [...capas, ...extra].map(c => ({
      id: Date.now() + Math.random(),
      mat: c.name || '', lam: String(c.lam || ''), esp: String(c.esp || ''), mu: String(c.mu || '1'), esCamara: !!c.esCamara,
    }))
    onModificar({ cod: s.cod, u: uMod, rw: rwMod, capas: capasCalcU })
  }, [capas, extra, uMod, rwMod, modificado, s.cod, onModificar])

  // ── #4 Glaser (NCh853 / EN ISO 13788) ─────────────────────────────────────
  function runGlaser() {
    const zona = proy?.zona ? ZONAS[proy.zona] : null
    const ti = zona?.Ti || 20, te = zona?.Te || 5, hr = zona?.HR || 70
    const cv = [...capas, ...extra].map(c =>
      c.esCamara ? { esCamara: true } : {
        mat: c.name, lam: parseFloat(c.lam), esp: parseFloat(c.esp)/1000, mu: parseFloat(c.mu||1)
      }
    ).filter(c => c.esCamara || (!isNaN(c.lam) && c.lam>0 && !isNaN(c.esp) && c.esp>0))
    if (!cv.length) return
    setGlaserRes(calcGlaser(cv, ti, te, hr, elem==='techumbre'?'techumbre':elem))
    setShowGlaser(true)
  }

  // ── #7 Exportar ficha ─────────────────────────────────────────────────────
  function exportarFicha() {
    const allC = [...capas, ...extra]
    const lineas = [
      'FICHA DE SOLUCIÓN CONSTRUCTIVA — Talora',
      `Código: ${s.cod}`,
      `Descripción: ${s.desc}`,
      `Elemento: ${elem}  |  Zonas: ${s.zonas}`,
      '',
      'VALORES CERTIFICADOS (LOSCAT Ed.13 2025):',
      `  U: ${s.u} W/m²K  |  RF: ${s.rf||'—'}  |  Rw: ${s.ac_rw||'—'} dB`,
      '',
      'SIMULACIÓN MODIFICADA:',
      `  U: ${uMod} W/m²K  (${dU>0?'▼'+dU:dU<0?'▲'+Math.abs(dU):'sin cambio'})`,
      rwMod ? `  Rw estimado: ~${rwMod} dB (ley de masa — estimativo)` : null,
      '',
      'CAPAS (interior → exterior):',
      ...allC.map(c => c.esCamara
        ? `  [Cámara de aire]  ${c.esp ? `e=${c.esp}mm  ` : ''}R=${resistenciaCamara((parseFloat(c.esp)||0)/1000).toFixed(2)} m²K/W`
        : `  ${c.name}  λ=${c.lam} W/mK  e=${c.esp}mm  R=${((parseFloat(c.esp)/1000)/parseFloat(c.lam)).toFixed(3)} m²K/W`),
      '',
      `OBSERVACIÓN: ${s.obs}`,
      '',
      'ADVERTENCIAS:',
      '  · RF no varía con espesores — requiere ensayo NCh850 para certificación DOM.',
      '  · Rw estimado por ley de masa (ISO 15712 simplificado) — requiere ensayo NCh352.',
      '  · Responsabilidad técnica del proyectista (OGUC Art. 1.2.2).',
      '',
      'Normativa: LOSCAT Ed.13 2025 | LOFC Ed.17 2025 | DS N°15 MINVU | NCh853:2021',
      `Generado: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`,
    ].filter(l => l !== null)
    const blob = new Blob([lineas.join('\n')], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ficha-${s.cod}.txt`
    a.click()
  }

  // ── #9 Guardar variante ───────────────────────────────────────────────────
  function guardarVariante() {
    const nombre  = varNombre.trim() || `Variante ${variantes.length + 1}`
    const nueva   = { id: Date.now(), nombre, capas: capas.map(c=>({...c})), extra: extra.map(c=>({...c})), uMod, fecha: new Date().toLocaleDateString('es-CL') }
    const nuevas  = [...variantes, nueva]
    setVariantes(nuevas)
    try {
      const all = JSON.parse(localStorage.getItem('oguc_variantes') || '{}')
      all[s.cod] = nuevas
      localStorage.setItem('oguc_variantes', JSON.stringify(all))
    } catch {}
    setVarNombre('')
  }

  // ── #2 Enviar a Cálculo U ─────────────────────────────────────────────────
  function enviarCalcU() {
    const converted = [...capas, ...extra].map(c => ({
      id: Date.now() + Math.random(),
      mat: c.name || '', lam: String(c.lam||''), esp: String(c.esp||''), mu: String(c.mu||'1'), esCamara: !!c.esCamara,
    }))
    onEnviarCalcU?.({ capas: converted, elem, solucion: { cod: s.cod, desc: s.desc, obs: s.obs, u: uMod } })
  }

  // ── #5 Vista gráfica de capas ─────────────────────────────────────────────
  const allForViz = [...capas, ...extra].filter(c => !c.esCamara && parseFloat(c.esp) > 0)
  const totalEsp  = allForViz.reduce((t, c) => t + parseFloat(c.esp), 0)
  function colorCapa(c) {
    if (c.esAislante) return '#99f6e4'
    const n = (c.name||'').toLowerCase()
    if (n.includes('hormig')||n.includes('albanil')||n.includes('ladrillo')||n.includes('bloque')) return '#fecaca'
    if (n.includes('yeso')||n.includes('revoqu')||n.includes('mortero')) return '#d1fae5'
    if (n.includes('madera')||n.includes('osb')||n.includes('fibro')||n.includes('contrachap')) return '#fef3c7'
    return '#f3f4f6'
  }

  function agregarCapa() {
    const m = ALL_MATS.find(x => x.n === newMat)
    if (!m || parseFloat(newEsp) <= 0) return
    setExtra(e => [...e, {
      id: Date.now(), name: m.n, lam: m.lam, esp: parseFloat(newEsp),
      mu: m.mu, den: MAT_DEN[m.n] ?? null, esCamara: false, esAislante: false,
    }])
    setNewMat(''); setNewEsp('20')
  }

  const cs = { padding:'4px 8px', borderBottom:'1px solid #f1f5f9', fontSize:11, verticalAlign:'middle' }
  const ts = { ...cs, background:'#f8fafc', fontWeight:700, fontSize:10, color:'#64748b' }
  const btnSm = (bg,col,border) => ({ background:bg, color:col, border:`1px solid ${border}`, borderRadius:5, padding:'3px 9px', cursor:'pointer', fontSize:11, fontWeight:600 })

  return (
    <div style={{ marginTop:12, borderTop:'1px solid #e2e8f0', paddingTop:12 }}>

      {/* ── Encabezado + acciones rápidas */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, flexWrap:'wrap', gap:6 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#0e6560' }}>
          Simulador de capas
          <span style={{ fontSize:10, fontWeight:400, color:'#64748b', marginLeft:8 }}>
            {bhData ? '· BH homologado (◆ editables)' : '· SC_CAPAS base'}
          </span>
        </span>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {onEnviarCalcU && <button onClick={enviarCalcU} style={btnSm('#f0fdf4','#166534','#86efac')}>→ Enviar a Cálculo U</button>}
          <button onClick={exportarFicha}  style={btnSm('#f8fafc','#374151','#e2e8f0')}>↓ Exportar ficha .txt</button>
        </div>
      </div>

      {/* ── #5 Vista gráfica proporcional */}
      {totalEsp > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:10, color:'#94a3b8', marginBottom:3 }}>Espesor proporcional (int → ext):</div>
          <div style={{ display:'flex', height:22, borderRadius:4, overflow:'hidden', border:'1px solid #e2e8f0' }}>
            {allForViz.map((c,i) => {
              const pct = (parseFloat(c.esp)/totalEsp)*100
              return (
                <div key={i} title={`${c.name}: ${c.esp}mm`}
                  style={{ width:pct+'%', background:colorCapa(c), borderRight:i<allForViz.length-1?'1px solid rgba(0,0,0,0.07)':'none',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#374151', overflow:'hidden', minWidth:0 }}>
                  {pct > 12 ? `${Math.round(c.esp)}` : ''}
                </div>
              )
            })}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:3, flexWrap:'wrap' }}>
            {[['#99f6e4','Aislante'],['#fecaca','Hormigón/Albanilería'],['#d1fae5','Revoque/Yeso'],['#fef3c7','Madera/Derivados'],['#f3f4f6','Otro']].map(([c,l]) => (
              <span key={l} style={{ fontSize:9, color:'#64748b', display:'flex', alignItems:'center', gap:3 }}>
                <span style={{ width:9,height:9,background:c,border:'1px solid #e2e8f0',borderRadius:2,display:'inline-block' }}/>
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabla de capas */}
      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:8 }}>
        <thead><tr>{['Capa (int→ext)','λ W/mK','Espesor mm','R m²K/W'].map(h=><th key={h} style={ts}>{h}</th>)}</tr></thead>
        <tbody>
          {capas.map(c => (
            <tr key={c.id} style={{ background:c.esAislante?'#f0fdfa':'transparent' }}>
              <td style={cs}>{c.esAislante&&<span style={{ fontSize:9,color:'#0e6560',marginRight:3 }}>◆</span>}{c.esCamara?<i>Cámara de aire</i>:c.name}</td>
              <td style={cs}>{c.esCamara?'—':c.lam}</td>
              <td style={cs}>
                {c.esCamara?'—':c.esAislante
                  ?<div style={{ display:'flex',alignItems:'center',gap:6 }}>
                      <input type="range" min={10} max={200} step={5} value={c.esp}
                        onChange={e=>setCapas(cs=>cs.map(x=>x.id===c.id?{...x,esp:parseInt(e.target.value)}:x))} style={{ width:80 }}/>
                      <b style={{ minWidth:28,fontSize:12 }}>{c.esp}</b>
                    </div>
                  :String(c.esp)}
              </td>
              <td style={cs}>{c.esCamara?resistenciaCamara((parseFloat(c.esp)||0)/1000).toFixed(2):(c.lam&&c.esp)?((parseFloat(c.esp)/1000)/parseFloat(c.lam)).toFixed(3):'—'}</td>
            </tr>
          ))}
          {extra.map(c=>(
            <tr key={c.id} style={{ background:'#f0fdf4' }}>
              <td style={cs}><span style={{ fontSize:9,color:'#16a34a',marginRight:3 }}>+</span>{c.name}<span style={{ fontSize:9,color:'#94a3b8',marginLeft:4 }}>agregada</span></td>
              <td style={cs}>{c.lam}</td>
              <td style={cs}>
                <div style={{ display:'flex',gap:4,alignItems:'center' }}>
                  <input type="number" min={5} max={300} value={c.esp}
                    onChange={e=>setExtra(ex=>ex.map(x=>x.id===c.id?{...x,esp:parseFloat(e.target.value)||x.esp}:x))}
                    style={{ width:55,border:'1px solid #cbd5e1',borderRadius:4,padding:'1px 4px',fontSize:11 }}/>
                  <button onClick={()=>setExtra(e=>e.filter(x=>x.id!==c.id))}
                    style={{ background:'#fee2e2',color:'#991b1b',border:'none',borderRadius:3,padding:'1px 6px',cursor:'pointer',fontSize:11 }}>✕</button>
                </div>
              </td>
              <td style={cs}>{((c.esp/1000)/c.lam).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Agregar capa */}
      <div style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginBottom:10 }}>
        <select value={newMat} onChange={e=>setNewMat(e.target.value)}
          style={{ border:'1px solid #cbd5e1',borderRadius:5,padding:'4px 6px',fontSize:11,minWidth:200 }}>
          <option value="">+ Material a agregar...</option>
          {/* Filtra por elemento: si es techo/techumbre, sólo cubiertas y materiales
              universales. Evita que aparezcan revestimientos de muro en techumbres. */}
          {filterMatsByElem(elem).map(g=><optgroup key={g.g} label={g.g}>{g.items.map(m=><option key={m.n} value={m.n}>{m.n} (λ={m.lam})</option>)}</optgroup>)}
        </select>
        <input type="number" min={5} max={300} placeholder="mm" value={newEsp} onChange={e=>setNewEsp(e.target.value)}
          style={{ border:'1px solid #cbd5e1',borderRadius:5,padding:'4px 6px',fontSize:11,width:62 }}/>
        <button onClick={agregarCapa} disabled={!newMat||!newEsp}
          style={{ background:newMat&&newEsp?'#0e6560':'#e2e8f0',color:newMat&&newEsp?'#fff':'#94a3b8',border:'none',borderRadius:5,padding:'5px 12px',cursor:newMat&&newEsp?'pointer':'default',fontSize:11,fontWeight:600 }}>
          Agregar
        </button>
        {extra.length>0&&<button onClick={()=>setExtra([])} style={btnSm('#fef2f2','#991b1b','#fca5a5')}>Limpiar extras</button>}
      </div>

      {/* ── Resultado comparativo */}
      <div style={{ background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:6,padding:'8px 12px',marginBottom:10 }}>
        <div style={{ fontSize:11,fontWeight:700,marginBottom:6 }}>Comparación original vs. simulado:</div>
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead><tr>{['Criterio','Original','Simulado','Exigido','Estado'].map(h=><th key={h} style={ts}>{h}</th>)}</tr></thead>
          <tbody>
            <tr>
              <td style={cs}>🌡 U (W/m²K)</td>
              <td style={{ ...cs,color:'#64748b' }}>{s.u}</td>
              <td style={{ ...cs,fontWeight:700,color:dU>0.005?'#16a34a':dU<-0.005?'#dc2626':'#374151' }}>
                {uMod}{dU>0.005&&<span style={{ fontSize:10,color:'#16a34a',marginLeft:4 }}>▼{dU}</span>}{dU<-0.005&&<span style={{ fontSize:10,color:'#dc2626',marginLeft:4 }}>▲{Math.abs(dU)}</span>}
              </td>
              <td style={cs}>{uMax?`≤${uMax}`:'—'}</td>
              <td style={cs}><span style={S.badge(tOkMod)}>{tOkMod?'CUMPLE':'NO'}</span></td>
            </tr>
            {rfReq&&<tr style={{ background:'#fafafa' }}>
              <td style={cs}>🔥 RF</td>
              <td style={{ ...cs,color:'#64748b' }}>{s.rf||'—'}</td>
              <td style={{ ...cs,color:'#94a3b8',fontSize:10 }}>{s.rf||'—'} *</td>
              <td style={cs}>{`≥${rfReq}`}</td>
              <td style={cs}><span style={S.badge(fOkMod)}>{fOkMod?'CUMPLE':'NO'}</span></td>
            </tr>}
            {acReq&&<tr>
              <td style={cs}>🔊 Rw (dB)</td>
              <td style={{ ...cs,color:'#64748b' }}>{s.ac_rw??'—'}</td>
              <td style={{ ...cs,fontWeight:rwMod?700:400,color:rwMod&&rwMod>(s.ac_rw||0)?'#16a34a':'#374151' }}>
                {rwMod?`~${rwMod}`:'—'}{rwMod?' *':''}
              </td>
              <td style={cs}>{`≥${acReq} dB`}</td>
              <td style={cs}><span style={S.badge(aOkMod)}>{aOkMod?'CUMPLE':'NO'}</span></td>
            </tr>}
          </tbody>
        </table>
        <div style={{ fontSize:10,color:'#94a3b8',marginTop:6 }}>
          * RF estática (ensayo NCh850). Rw estimativo ley de masa ISO 15712 (ensayo NCh352 requerido).
        </div>
      </div>

      {/* ── #4 Glaser */}
      <div style={{ marginBottom:10 }}>
        <button onClick={runGlaser} style={btnSm('#fff','#374151','#e2e8f0')}>
          🌫 Verificar condensación intersticial (Glaser — NCh853)
        </button>
        {glaserRes && showGlaser && (
          <div style={{ marginTop:8,background:glaserRes.condInter?'#fef2f2':'#f0fdf4',border:`1px solid ${glaserRes.condInter?'#fca5a5':'#86efac'}`,borderRadius:6,padding:'8px 12px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
              <span style={{ fontWeight:700,fontSize:12,color:glaserRes.condInter?'#dc2626':'#16a34a' }}>
                {glaserRes.condInter?'⚠ Riesgo de condensación intersticial':'✓ Sin riesgo de condensación'}
              </span>
              <button onClick={()=>setShowGlaser(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'#94a3b8' }}>✕</button>
            </div>
            <div style={{ fontSize:11,color:'#64748b',marginBottom:6 }}>
              T rocío: {glaserRes.Tdew}°C · Zona {proy?.zona||'—'}: Ti={ZONAS[proy?.zona]?.Ti||20}°C · Te={ZONAS[proy?.zona]?.Te||5}°C · HR={ZONAS[proy?.zona]?.HR||70}%
            </div>
            {glaserRes.ifaces?.length>0&&(
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
                <thead><tr>{['Interfaz','T °C','Pv sat Pa','Pv real Pa','Estado'].map(h=><th key={h} style={{ ...ts,padding:'3px 6px' }}>{h}</th>)}</tr></thead>
                <tbody>{glaserRes.ifaces.map(f=>(
                  <tr key={f.i} style={{ background:f.riesgo?'#fee2e2':'transparent' }}>
                    <td style={{ ...cs,padding:'3px 6px' }}>{f.i}</td>
                    <td style={{ ...cs,padding:'3px 6px' }}>{f.T}</td>
                    <td style={{ ...cs,padding:'3px 6px' }}>{f.pvSat}</td>
                    <td style={{ ...cs,padding:'3px 6px' }}>{f.pvReal}</td>
                    <td style={{ ...cs,padding:'3px 6px' }}><span style={{ fontWeight:700,color:f.riesgo?'#dc2626':'#16a34a',fontSize:10 }}>{f.riesgo?'⚠ COND.':'OK'}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── #9 Guardar / cargar variantes */}
      <div style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',paddingTop:8,borderTop:'1px solid #f1f5f9' }}>
        <input placeholder="Nombre variante (opcional)" value={varNombre} onChange={e=>setVarNombre(e.target.value)}
          style={{ border:'1px solid #cbd5e1',borderRadius:5,padding:'4px 8px',fontSize:11,minWidth:170 }}/>
        <button onClick={guardarVariante} style={btnSm('#f8fafc','#374151','#cbd5e1')}>💾 Guardar variante</button>
        {variantes.length>0&&(
          <select value={varSelIdx} onChange={e=>{
            const idx=parseInt(e.target.value)
            if(!isNaN(idx)){const v=variantes[idx];setCapas(v.capas);setExtra(v.extra);setVarSelIdx('')}
          }} style={{ border:'1px solid #cbd5e1',borderRadius:5,padding:'4px 6px',fontSize:11 }}>
            <option value="">Cargar variante guardada...</option>
            {variantes.map((v,i)=><option key={v.id} value={i}>{v.nombre} — U={v.uMod} ({v.fecha})</option>)}
          </select>
        )}
      </div>
    </div>
  )
})

// ─── PESTAÑA SOLUCIONES ────────────────────────────────────────────────────────
const ELEM_LABELS = { muro:'Muro', tabique:'Tabique', techumbre:'Techumbre', piso:'Piso', ventana:'Ventana', puerta:'Puerta' }
const ELEM_LIST   = ['muro','tabique','techumbre','piso','ventana','puerta']

// ─── PANEL: Códigos Normativos (LOSCAT + LOFC + LOSCAA) ─────────────────────
// Muestra los 3 códigos homologados para una solución constructiva.
// Calcula on-demand usando el motor de homologación.
function CodigosNormativos({ sc, rfReq, acReq, omitirTermico = false, modoBaseReferencial = false }) {
  const homolog = useMemo(() => {
    try {
      return homologarSolucion(sc, { rfRequerido: rfReq, rwRequerido: acReq })
    } catch (e) {
      console.warn('Error homologando solución', sc?.cod, e)
      return null
    }
  }, [sc, rfReq, acReq])

  if (!homolog) return null
  const { termico, fuego, acustico, estructura_base } = homolog

  // Modo PDA (referencial): solo confiamos el cruce LOFC/LOSCAA cuando la base
  // detectada es MÁSICA/existente (hormigón, ladrillo, bloque, madera/CLT/SIP).
  // Materiales livianos (acero, panel sándwich, tabique de yeso) en un retrofit
  // casi siempre son el furring/revestimiento AÑADIDO, no la estructura base:
  // homologarlos sobre-acreditaría RF/Rw. En ese caso mostramos "sin cruce".
  const baseConfiable = !modoBaseReferencial
    || ['hormigon_armado', 'ladrillo', 'bloque', 'madera', 'clt', 'sip'].includes(estructura_base?.material)
  const fuegoShow = baseConfiable ? fuego : null
  const acustShow = baseConfiable ? acustico : null

  const Card = ({ icon, titulo, codigo, valor, fuente, intrinseco, oficial, sinMatchTexto, color, descripcion, capasExtras }) => (
    <div style={{
      flex: 1, minWidth: 220,
      background: '#fff',
      border: `1.5px solid ${color}`,
      borderRadius: 8,
      padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 12, color }}>{titulo}</span>
        {oficial === false && (
          <span style={{ marginLeft: 'auto', fontSize: 9, background: '#fef3c7', color: '#92400e', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>
            no oficial — verificar
          </span>
        )}
        {oficial !== false && intrinseco === false && (
          <span style={{ marginLeft: 'auto', fontSize: 9, background: '#fef3c7', color: '#92400e', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>
            requiere capas
          </span>
        )}
        {oficial !== false && intrinseco === true && (
          <span style={{ marginLeft: 'auto', fontSize: 9, background: '#dcfce7', color: '#166534', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>
            intrínseco
          </span>
        )}
      </div>
      {codigo ? (
        <>
          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{codigo}</div>
          {valor && <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{valor}</div>}
          {descripcion && (
            <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.4, marginTop: 4, fontStyle: 'italic' }}>
              {descripcion.slice(0, 80)}{descripcion.length > 80 ? '…' : ''}
            </div>
          )}
          {/* Capa a reforzar para acogerse al ítem certificado (homologación condicionada) */}
          {capasExtras?.length > 0 && (
            <div style={{ marginTop: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 5, padding: '6px 8px' }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>🔧 Para homologar, refuerza:</div>
              {capasExtras.map((cx, i) => (
                <div key={i} style={{ fontSize: 9.5, color: '#92400e', lineHeight: 1.4 }}>
                  {cx.de_mm != null && cx.a_mm != null
                    ? <>Placa protectora <b>{cx.de_mm} → {cx.a_mm} mm</b> (faltan {cx.falta_mm} mm)</>
                    : cx.descripcion}
                </div>
              ))}
            </div>
          )}
          {fuente && <div style={{ fontSize: 9, color: oficial === false ? '#92400e' : '#94a3b8', marginTop: 4 }}>{fuente}</div>}
        </>
      ) : (
        <div style={{ fontSize: 10, color: '#92400e', fontStyle: 'italic', lineHeight: 1.4 }}>
          {sinMatchTexto || 'Sin homologación automática disponible'}
        </div>
      )}
    </div>
  )

  return (
    <div style={{
      background: '#f0fdfa',
      border: '1px solid #99f6e4',
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>📋 Códigos normativos homologados</span>
        {estructura_base?.material && baseConfiable && (
          <span style={{ fontSize: 10, background: '#ccfbf1', color: '#0e6560', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
            Base: {estructura_base.material.replace(/_/g, ' ')}
            {estructura_base.espesor_estructura_mm ? ` ${estructura_base.espesor_estructura_mm}mm` : ''}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!omitirTermico && (
          <Card
            icon="🌡️"
            titulo="Térmico"
            color="#0e6560"
            codigo={termico?.codigo}
            valor={termico?.u ? `U = ${termico.u} W/m²K` : null}
            fuente={termico?.fuente}
            descripcion={termico?.descripcion}
            oficial={termico?.oficial}
          />
        )}
        <Card
          icon="🔥"
          titulo="Fuego"
          color="#dc2626"
          codigo={fuegoShow?.codigo}
          valor={fuegoShow?.rf ? `RF = ${fuegoShow.rf}` : null}
          fuente={fuegoShow?.fuente}
          descripcion={fuegoShow?.descripcion}
          intrinseco={modoBaseReferencial ? undefined : fuegoShow?.intrinseco}
          capasExtras={fuegoShow?.capas_extras}
          sinMatchTexto={modoBaseReferencial
            ? 'Sin cruce en LOFC Ed.17: la estructura base de esta ficha PDA no es reconocible automáticamente. Aplica la guía de fuego de abajo (revestimiento RF certificado + ensayo NCh935).'
            : 'Sin cruce automático en LOFC Ed.17 — el RF declarado es referencial. Respáldalo con ensayo NCh935/1 o certificación del fabricante, o agrega capas certificadas (p. ej. placas yeso cartón RF).'}
        />
        <Card
          icon="🔇"
          titulo="Acústico"
          color="#7c3aed"
          codigo={acustShow?.codigo}
          valor={acustShow?.rw ? `${acustShow.rw_tipo || 'Rw'} = ${acustShow.rw} dB` : null}
          fuente={acustShow?.fuente}
          descripcion={acustShow?.descripcion}
          intrinseco={modoBaseReferencial ? undefined : acustShow?.intrinseco}
          sinMatchTexto={modoBaseReferencial
            ? 'Sin cruce en LOSCAA 2024: la estructura base de esta ficha PDA no es reconocible automáticamente. Usa el Rw estimado de abajo como referencia y verifícalo con ensayo (NCh2786).'
            : 'Sin cruce automático en LOSCAA 2024 — el Rw declarado es referencial. Respáldalo con ensayo (NCh2786 / ISO 10140) o mejora la solución con capas (p. ej. doble placa + lana mineral).'}
        />
      </div>
      <div style={{ fontSize: 10, color: '#64748b', marginTop: 8, lineHeight: 1.4 }}>
        {modoBaseReferencial ? (
          <>🏗️ Ficha PDA: el cruce LOFC/LOSCAA se homologa a la <b>estructura base</b> (p. ej. el muro
          existente). El aislante y revestimiento que agrega el reacondicionamiento tienen su propio
          comportamiento al fuego/acústico — estos códigos son una <b>referencia del elemento base</b>,
          no del conjunto terminado. Valídalos con el profesional responsable.</>
        ) : (
          <>💡 Los códigos LOFC y LOSCAA se homologan automáticamente al material base de la solución.
          El sello "no oficial — verificar" indica un valor calculado o referencial que no proviene de un
          listado oficial: el profesional responsable debe validarlo antes de usarlo en un expediente.</>
        )}
      </div>
    </div>
  )
}

// PDA_SC — soluciones PDA en forma de catálogo, para mezclarlas en Soluciones.
// U/RT/condensación son OFICIALES (no se recalculan); sin RF/Rw ni simulador de
// capas. El U-máx de referencia es el del PDA (reacondicionamiento de vivienda
// existente), NO la U-máx de la zona DS N°15 de obra nueva.
const PDA_SC = PDA_SOLUCIONES.map(s => ({
  cod: s.cod, elem: s.elem, sistemas: null,
  desc: s.desc, capas: s.capas || 'Ver ficha oficial',
  u: s.u, rf: null, ac_rw: null, zonas: null, usos: ['Vivienda'],
  esPDA: true, pda: s.pda, rt: s.rt, cond: s.cond, capasStruct: s.capasStruct || null,
  rwEstimado: s.rwEstimado ?? null,
  obs: `${s.fuente}. U=${s.u} W/m²K oficial (NCh853)`
     + (s.rt ? `, RT=${s.rt} m²K/W` : '')
     + (s.cond === 'sin' ? ', sin riesgo de condensación (NCh1973)'
        : s.cond === 'con' ? ', con riesgo de condensación' : '')
     + `. Reacondicionamiento térmico de vivienda existente — ${PDA[s.pda].nombre}.`,
}))
// U-máx contra la que se evalúa una solución PDA. Las fichas son de vivienda
// existente → se comparan contra el estándar de REACONDICIONAMIENTO (reacond),
// no el de obra nueva (requisitos, que es más estricto).
function pdaUmax(s) {
  const p = PDA[s.pda]; if (!p) return null
  const k = s.elem === 'techumbre' ? 'techo' : s.elem
  return (p.reacond || p.requisitos)?.[k] ?? null
}

function TabSoluciones({ proy, setProy, onAplicar, onEnviarCalcU, notas, setNotas }) {
  const [elem,      setElem]      = useState('muro')
  const [expandido, setExpandido] = useState(null)
  const [soloOk,    setSoloOk]    = useState(false)
  const [orden,     setOrden]     = useState('cumplimiento')
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroRF,       setFiltroRF]       = useState('')
  const [filtroSistema,  setFiltroSistema]  = useState('')
  const [selComp,       setSelComp]       = useState([])
  const [showComp,      setShowComp]      = useState(false)
  const [showAsistente, setShowAsistente] = useState(true)
  // targetSistema: null = global, id = estructura específica (local a esta pestaña)
  const [targetSistema, setTargetSistema] = useState(null)
  // modSim: snapshot de la solución modificada en el simulador de capas (o null).
  // Lo reporta <SimuladorCapas onModificar>; lo usa "Aplicar" para traspasar la
  // U recalculada y las capas reales en vez del valor certificado original.
  const [modSim, setModSim] = useState(null)
  // mostrarOtrosPda: incluir en el catálogo soluciones de PDA de OTRAS comunas
  // (grises "no aplica a tu comuna"). Off = solo el PDA de la comuna del proyecto.
  const [mostrarOtrosPda, setMostrarOtrosPda] = useState(false)
  // catalogRef: para hacer scroll al catálogo cuando el usuario elige un slot
  const catalogRef = React.useRef(null)

  // Aplica la misma solución a TODOS los sistemas (útil para techo/piso de obra única)
  function onAplicarTodos(sc, mod = null) {
    const e = sc.elem === 'techumbre' ? 'techo' : sc.elem
    const { ev: _ev, ...scClean } = sc
    const { isMod, u: uApplied } = resolverAplicacionSC(sc, mod)
    const solucion = isMod ? { ...scClean, u: uApplied, modificada: true, uOriginal: sc.u } : scClean
    const solData  = { u: String(uApplied), rf: sc.rf || '', rw: sc.ac_rw ? String(sc.ac_rw) : '', solucion }
    setProy(p => ({
      ...p,
      estructuras: (p.estructuras || []).map(est => ({
        ...est,
        soluciones: { ...(est.soluciones || {}), [e]: solData },
      }))
    }))
    setTargetSistema(null)
  }

  const zona  = proy.zona  || 'D'
  const uso   = proy.uso   || 'Vivienda'
  const pisos = proy.pisos || '2'
  // PDA de la comuna del proyecto (null si la comuna no está bajo ningún PDA).
  const pdaKey  = resolvePDA(proy.comuna)
  const pdaInfo = pdaKey ? PDA[pdaKey] : null

  // Sincronizar filtroSistema con proy.estructura al montar o cuando cambia
  useEffect(() => {
    if (proy.estructura && !filtroSistema) setFiltroSistema(proy.estructura)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proy.estructura])

  // ── Exigencias normativas según elemento ──────────────────────────────────
  // Térmica — DS N°15 MINVU Tabla 1 / Tabla 3. Si la comuna tiene PDA, la U-máx
  // efectiva de obra nueva es la más estricta entre la zona y el PDA (uMaxObraNueva).
  const _uMaxZona =
    elem==='muro'      ? ZONAS[zona]?.muro   :
    elem==='techumbre' ? ZONAS[zona]?.techo  :
    elem==='piso'      ? ZONAS[zona]?.piso   :
    elem==='puerta'    ? PUERTA_U[zona]      : null
  const uMax = (elem==='muro'||elem==='techumbre'||elem==='piso')
    ? uMaxEfectiva(proy.comuna, elem==='techumbre'?'techo':elem, _uMaxZona, proy.tipoObra)
    : _uMaxZona

  // Resistencia al fuego — fuente única RF_ELEM_REQ (mismo criterio que
  // Térmica/Resultados/Informe; ver src/__tests__/rf_consistencia.test.js)
  // Defensa contra uso vacío/nulo: usar 'Vivienda' como default
  const validUso = (uso && uso.trim()) ? uso : 'Vivienda'
  const rfReq = RF_ELEM_REQ(elem, validUso, pisos, zona) || null

  // Acústica — NCh352 / OGUC Art. 4.1.6
  const acReq =
    (elem==='muro'||elem==='tabique'||elem==='puerta') ? AC_DEF[validUso]?.entre_unidades ?? null :
    (elem==='techumbre'||elem==='piso')                ? AC_DEF[validUso]?.entre_pisos    ?? null :
    elem==='ventana'                                   ? AC_DEF[validUso]?.fachada        ?? null : null

  // ── Evaluación individual ─────────────────────────────────────────────────
  function evaluar(s) {
    // A3: `aplica` = pertinencia por USO. La aptitud térmica por zona NO se gate
    // con el campo `zonas` (curado a mano, podía ocultar soluciones válidas o
    // marcar "aplica" sin cumplir); se deriva del cálculo `tOk = U ≤ U-máx`.
    // PDA: `aplica` exige además que la comuna del proyecto pertenezca al PDA, y
    // lo térmico se juzga contra la U-máx del PDA (reacond.), no la de la zona.
    const validUso = uso && uso.trim() ? uso : 'Vivienda'
    const usoOk  = (s.usos || []).includes(validUso)
    const pdaOk  = !s.esPDA || s.pda === pdaKey
    const aplica = usoOk && pdaOk
    const uLim = s.esPDA ? pdaUmax(s) : uMax
    const tOk = !uLim  || s.u <= uLim
    const fOk = s.esPDA ? true : (!rfReq || !s.rf || rfN(s.rf) >= rfN(rfReq))
    const aOk = s.esPDA ? true : (!acReq || !s.ac_rw || s.ac_rw >= acReq)
    return { aplica, usoOk, pdaOk, esPDA: !!s.esPDA, uLim, tOk, fOk, aOk, total: (tOk?1:0)+(fOk?1:0)+(aOk?1:0) }
  }

  // ── Lista ordenada ────────────────────────────────────────────────────────
  const soluciones = useMemo(() => {
    // evaluar inline para evitar closure stale (uMax/rfReq/acReq dependen de elem)
    // Defensa contra uso vacío/nulo: usar 'Vivienda' como default
    const _validUso = (uso && uso.trim()) ? uso : 'Vivienda'
    const _uMaxZ = elem==='muro'      ? ZONAS[zona]?.muro   :
                   elem==='techumbre' ? ZONAS[zona]?.techo  :
                   elem==='piso'      ? ZONAS[zona]?.piso   :
                   elem==='puerta'    ? PUERTA_U[zona]      : null
    const _uMax = (elem==='muro'||elem==='techumbre'||elem==='piso')
                   ? uMaxEfectiva(proy.comuna, elem==='techumbre'?'techo':elem, _uMaxZ, proy.tipoObra) : _uMaxZ
    const _rfReq = RF_ELEM_REQ(elem, _validUso, pisos, zona) || null
    const _acReq = (elem==='muro'||elem==='tabique'||elem==='puerta') ? AC_DEF[_validUso]?.entre_unidades ?? null :
                   (elem==='techumbre'||elem==='piso')                 ? AC_DEF[_validUso]?.entre_pisos    ?? null :
                   elem==='ventana'                                    ? AC_DEF[_validUso]?.fachada        ?? null : null

    function ev(s) {
      // A3: aplicabilidad por uso; aptitud térmica por zona = tOk (no campo zonas)
      // PDA: aplica solo si la comuna calza; térmico vs U-máx del PDA (reacond.)
      const usoOk  = (s.usos || []).includes(_validUso)
      const pdaOk  = !s.esPDA || s.pda === pdaKey
      const aplica = usoOk && pdaOk
      const uLim = s.esPDA ? pdaUmax(s) : _uMax
      const tOk = !uLim  || s.u <= uLim
      const fOk = s.esPDA ? true : (!_rfReq || !s.rf || rfN(s.rf) >= rfN(_rfReq))
      const aOk = s.esPDA ? true : (!_acReq || !s.ac_rw || s.ac_rw >= _acReq)
      return { aplica, usoOk, pdaOk, esPDA: !!s.esPDA, uLim, tOk, fOk, aOk, total: (tOk?1:0)+(fOk?1:0)+(aOk?1:0) }
    }

    // Base = catálogo SC + soluciones PDA (solo muro/techumbre/piso). Por defecto
    // solo se inyecta el PDA de la comuna del proyecto; con `mostrarOtrosPda` se
    // suman las de otros PDA (grises "no aplica a tu comuna").
    let base = SC
    if (elem === 'muro' || elem === 'techumbre' || elem === 'piso') {
      const pdaList = mostrarOtrosPda ? PDA_SC : PDA_SC.filter(s => s.pda === pdaKey)
      base = [...SC, ...pdaList]
    }
    let list = base.filter(s => s.elem === elem).map(s => ({ ...s, ev: ev(s) }))
    // Filtro por sistema estructural: s.sistemas===null → sin restricción (aplica a todo)
    if (filtroSistema) list = list.filter(s => !s.sistemas || s.sistemas.includes(filtroSistema))
    if (soloOk) list = list.filter(s => s.ev.aplica && s.ev.total === 3)
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      list = list.filter(s => s.desc.toLowerCase().includes(q) || s.cod.toLowerCase().includes(q) || s.capas.toLowerCase().includes(q))
    }
    if (filtroRF) list = list.filter(s => s.rf && rfN(s.rf) >= rfN(filtroRF))
    list.sort((a, b) => {
      if (orden==='cumplimiento') {
        const sa = (a.ev.aplica?10:0) + a.ev.total
        const sb = (b.ev.aplica?10:0) + b.ev.total
        return sb - sa
      }
      if (orden==='u')  return a.u - b.u
      if (orden==='rf') return rfN(b.rf||'F0') - rfN(a.rf||'F0')
      if (orden==='rw') return (b.ac_rw||0) - (a.ac_rw||0)
      return 0
    })
    return list
  }, [elem, zona, uso, pisos, soloOk, orden, busqueda, filtroRF, filtroSistema, proy.comuna, proy.tipoObra, mostrarOtrosPda])

  const totalAplica = soluciones.filter(s => s.ev.aplica).length
  const totalOk     = soluciones.filter(s => s.ev.aplica && s.ev.total === 3).length
  const hasBH       = cod => BH.some(b => b.cod === cod)
  const recoMap     = { muro:'muros', techumbre:'techumbres', piso:'pisos', tabique:'tabiques' }
  const recos       = REC_USO[uso]?.[recoMap[elem]] || []

  function dotColor(ev) {
    if (!ev.aplica)    return '#94a3b8'
    if (ev.total===3)  return '#16a34a'
    if (ev.total===2)  return '#d97706'
    return '#dc2626'
  }
  function borderColor(ev) {
    if (!ev.aplica)    return '#e2e8f0'
    if (ev.total===3)  return '#86efac'
    if (ev.total===2)  return '#fde047'
    return '#fca5a5'
  }
  // Explica POR QUÉ una solución no aplica al uso: enumera los criterios que no
  // alcanzan la exigencia del uso/zona actual (motivo típico de la exclusión del
  // catálogo). Si los 3 criterios calculados pasan, es una restricción de
  // tipificación del catálogo, no un incumplimiento.
  function motivoNoAplica(ev, s) {
    const faltas = []
    if (!ev.fOk) faltas.push(`Fuego: el uso exige RF ≥ ${rfReq} y esta solución declara ${s.rf}`)
    if (!ev.tOk) faltas.push(`Térmico: la zona exige U ≤ ${uMax} y esta solución tiene U = ${s.u}`)
    if (!ev.aOk) faltas.push(`Acústica: el uso exige Rw ≥ ${acReq} dB y esta solución declara ${s.ac_rw} dB`)
    let txt = `No está tipificada para el uso ${uso} en el catálogo.`
    if (faltas.length) {
      txt += `\n\nMotivo probable — no alcanza la exigencia del uso:\n• ` + faltas.join('\n• ')
      if (!ev.fOk) txt += `\n\nSugerencia: agrégale un revestimiento RF certificado (yeso cartón / fibrocemento) con el simulador de capas para subir su resistencia al fuego.`
    } else {
      txt += ` Cumple los 3 criterios calculados, pero está catalogada solo para: ${(s.usos || []).join(', ') || '—'}.`
    }
    return txt
  }

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Soluciones constructivas"
        pasos={[
          'Asegúrate de tener la <b>zona, uso y pisos</b> definidos en Diagnóstico. Las exigencias se calculan automáticamente.',
          'Selecciona el tipo de elemento: <b>Muro, Tabique, Techumbre, Piso, Ventana o Puerta</b>.',
          'Cada solución muestra semáforo triple: <b>T</b> (térmico), <b>F</b> (fuego), <b>A</b> (acústica). Verde = cumple, rojo = no cumple.',
          'Usa <b>"Solo las que cumplen los 3 criterios"</b> para filtrar las soluciones aptas para tu proyecto.',
          'Ordena por <b>Cumplimiento, U↑, RF↓ o Rw↓</b> según el criterio prioritario.',
          'Expande una solución para ver sus capas. Las marcadas <b>"Homologable"</b> permiten editar espesores (◆ deslizador) y agregar capas del catálogo de materiales.',
          'El <b>simulador de capas</b> recalcula U en tiempo real (NCh853). RF es estática (requiere ensayo NCh850). Rw es estimativo por ley de masa (ISO 15712).',
          'Presiona <b>"Aplicar al proyecto"</b> para traspasar los valores a la pestaña Térmica.',
        ]}
        normativa="LOSCAT Ed.13 2025 (DITEC-MINVU) · LOFC Ed.17 2025 · DS N°15 Tabla 1 y 3 · OGUC Art. 4.5.4 · NCh352 · NCh853:2021"
      />
      {/* ── Panel de sistemas estructurales ─────────────────────────────────── */}
      {(proy.estructuras?.length > 0) && (() => {
        const SLOTS = [
          { key:'muro',    label:'Muro',     catElem:'muro'      },
          { key:'techo',   label:'Techo',    catElem:'techumbre' },
          { key:'piso',    label:'Piso',     catElem:'piso'      },
          { key:'tabique', label:'Tabique',  catElem:'tabique'   },
        ]
        const tipoCorto = t => t
          .replace('Albanileria confinada','Alb. confinada')
          .replace('Albanileria armada','Alb. armada')
          .replace('Hormigon armado','H.A.')
          .replace('Estructura de acero','Acero estructural')
          .replace('Metalframe (acero liviano)','Metalframe')
          .replace('Estructura de madera','Madera')
          .replace('Mixta HA + albanileria','Mixta HA+alb.')

        return (
          <div style={{ ...S.card, border:'1.5px solid #99f6e4', background:'#f8faff' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <p style={{ ...S.h2, marginBottom:0, color:'#0e6560' }}>
                Soluciones por sistema estructural
              </p>
              {targetSistema && (
                <button onClick={() => { setTargetSistema(null); setFiltroSistema('') }}
                  style={{ fontSize:11, color:'#64748b', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:6, padding:'3px 10px', cursor:'pointer' }}>
                  ✕ Deseleccionar sistema
                </button>
              )}
            </div>
            <p style={{ fontSize:11, color:'#64748b', marginBottom:12 }}>
              Para cada sistema, haz clic en <b>Asignar</b> → el catálogo se filtra automáticamente → presiona <b>Aplicar</b>.
            </p>

            {proy.estructuras.map(est => {
              const soles = est.soluciones || {}
              const isActive = targetSistema === est.id
              return (
                <div key={est.id} style={{
                  border: isActive ? '2px solid #166534' : '1px solid #e2e8f0',
                  borderRadius:10, padding:'12px 16px', marginBottom:10,
                  background: isActive ? '#f0fdf4' : '#fff',
                  transition:'border-color 0.15s',
                }}>
                  {/* Cabecera del sistema */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div style={{ fontWeight:800, fontSize:13, color: isActive ? '#166534' : '#0e6560' }}>
                      {tipoCorto(est.tipo)}
                    </div>
                    {est.sector && (
                      <span style={{ background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:4, padding:'1px 7px', fontSize:11, color:'#64748b' }}>
                        {est.sector}
                      </span>
                    )}
                    {est.desde && (
                      <span style={{ fontSize:11, color:'#94a3b8' }}>
                        Pisos {est.desde}{est.hasta !== est.desde ? `–${est.hasta}` : ''}
                      </span>
                    )}
                    {isActive && (
                      <span style={{ marginLeft:'auto', fontSize:11, color:'#166534', fontWeight:700, background:'#dcfce7', borderRadius:20, padding:'2px 10px' }}>
                        ← Selecciona una solución abajo
                      </span>
                    )}
                  </div>

                  {/* Slots por elemento */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:8 }}>
                    {SLOTS.map(slot => {
                      const d = soles[slot.key]
                      const isActiveSlot = isActive && elem === slot.catElem
                      return (
                        <div key={slot.key} style={{
                          border: isActiveSlot ? '2px solid #166534' : d ? '1px solid #86efac' : '1.5px dashed #cbd5e1',
                          borderRadius:8, padding:'8px 10px',
                          background: isActiveSlot ? '#dcfce7' : d ? '#f0fdf4' : '#fafafa',
                        }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                            {slot.label}
                          </div>

                          {d ? (
                            <>
                              <div style={{ fontSize:11, fontWeight:700, color:'#0e6560' }}>{d.solucion?.cod}</div>
                              <div style={{ fontSize:10, color:'#374151', marginBottom:4, lineHeight:1.3 }}>{d.solucion?.desc}</div>
                              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
                                {d.u && <span style={{ fontSize:9, background:'#ccfbf1', color:'#0e6560', borderRadius:3, padding:'1px 5px', fontWeight:700 }}>U {d.u}</span>}
                                {d.rf && <span style={{ fontSize:9, background:'#fee2e2', color:'#991b1b', borderRadius:3, padding:'1px 5px', fontWeight:700 }}>{d.rf}</span>}
                                {d.rw && <span style={{ fontSize:9, background:'#f0fdfa', color:'#0f766e', borderRadius:3, padding:'1px 5px', fontWeight:700 }}>Rw {d.rw}dB</span>}
                              </div>
                              <div style={{ display:'flex', gap:4 }}>
                                <button
                                  onClick={() => {
                                    setTargetSistema(est.id)
                                    setElem(slot.catElem)
                                    setFiltroSistema(est.tipo)
                                    setTimeout(() => catalogRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 50)
                                  }}
                                  style={{ fontSize:10, color:'#0e6560', background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:4, padding:'2px 7px', cursor:'pointer' }}>
                                  Cambiar
                                </button>
                                <button
                                  onClick={() => setProy(p => ({
                                    ...p,
                                    estructuras: (p.estructuras || []).map(e => e.id === est.id
                                      ? { ...e, soluciones: Object.fromEntries(Object.entries(e.soluciones||{}).filter(([k]) => k !== slot.key)) }
                                      : e
                                    )
                                  }))}
                                  style={{ fontSize:10, color:'#dc2626', background:'#fff', border:'1px solid #fca5a5', borderRadius:4, padding:'2px 7px', cursor:'pointer' }}>
                                  ✕
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setTargetSistema(est.id)
                                setElem(slot.catElem)
                                setFiltroSistema(est.tipo)
                                setTimeout(() => catalogRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 50)
                              }}
                              style={{
                                width:'100%', padding:'5px 0', fontSize:11, fontWeight:600,
                                background: isActiveSlot ? '#166534' : '#fff',
                                color: isActiveSlot ? '#fff' : '#64748b',
                                border:`1.5px dashed ${isActiveSlot ? '#166534' : '#94a3b8'}`,
                                borderRadius:6, cursor:'pointer',
                              }}>
                              {isActiveSlot ? '← Elige del catálogo ↓' : '+ Asignar'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ── Cabecera de filtros ──────────────────────────────────────────────── */}
      <div ref={catalogRef} style={S.card}>
        <p style={S.h2}>
          {targetSistema
            ? `Catálogo — asignando a: ${proy.estructuras?.find(e=>e.id===targetSistema)?.tipo?.replace('Metalframe (acero liviano)','Metalframe') || ''}`
            : 'Soluciones constructivas — LOSCAT Ed.13 2025 · LOFC Ed.17 2025'
          }
        </p>
        {targetSistema && (
          <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:6, padding:'6px 12px', marginBottom:8, fontSize:11, color:'#166534', fontWeight:600 }}>
            ★ La solución que apliques se guardará en <b>{proy.estructuras?.find(e=>e.id===targetSistema)?.tipo}</b>
            {proy.estructuras?.find(e=>e.id===targetSistema)?.sector && ` — ${proy.estructuras.find(e=>e.id===targetSistema).sector}`}
            {' '}· Elemento: <b>{ELEM_LABELS[elem]}</b>
          </div>
        )}

        {/* Contexto del proyecto */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:10, fontSize:11, color:'#64748b' }}>
          <span>Zona <b>{zona}</b></span>
          <span>Uso <b>{uso}</b></span>
          <span>Pisos <b>{pisos}</b></span>
          {!proy.zona && <span style={{ color:'#d97706', fontWeight:600 }}>⚠ Sin zona — usando D. Define el proyecto en Diagnóstico.</span>}
        </div>

        {/* Selector elemento */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
          {ELEM_LIST.map(e => (
            <button key={e} onClick={() => { setElem(e); setExpandido(null) }}
              style={{ padding:'5px 13px', fontSize:12, fontWeight: elem===e ? 700 : 400,
                border:'1.5px solid', borderRadius:6, cursor:'pointer',
                borderColor: elem===e ? '#0e6560' : '#cbd5e1',
                background: elem===e ? '#f0fdfa' : '#fff',
                color: elem===e ? '#0e6560' : '#374151' }}>
              {ELEM_LABELS[e]}
              <span style={{ marginLeft:4, fontSize:10, color:'#94a3b8' }}>({SC.filter(s=>s.elem===e).length})</span>
            </button>
          ))}
        </div>

        {/* Exigencias calculadas */}
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'8px 14px', marginBottom:10, fontSize:11, display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
          <span><b>Exigencias {ELEM_LABELS[elem]}:</b></span>
          <span style={{ color: uMax ? '#0e6560' : '#94a3b8' }}>
            🌡 U {uMax ? `≤ ${uMax} W/m²K` : 'sin límite'}</span>
          <span style={{ color: rfReq ? '#dc2626' : '#94a3b8' }}>
            🔥 RF {rfReq ? `≥ ${rfReq}` : 'no aplica'}</span>
          <span style={{ color: acReq ? '#0f766e' : '#94a3b8' }}>
            🔊 Rw {acReq ? `≥ ${acReq} dB` : 'no aplica'}</span>
          <span style={{ marginLeft:'auto', fontWeight:700, color:'#166534' }}>
            {totalOk}/{totalAplica} cumplen todo
          </span>
        </div>

        {/* Búsqueda #1 */}
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:8 }}>
          <input
            type="text" placeholder="🔍 Buscar por descripción, código o capas..."
            value={busqueda} onChange={e => { setBusqueda(e.target.value); setExpandido(null) }}
            style={{ border:'1px solid #cbd5e1', borderRadius:6, padding:'5px 10px', fontSize:12, minWidth:280, flex:1 }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')}
              style={{ background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:5, padding:'4px 9px', cursor:'pointer', fontSize:11, color:'#64748b' }}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Controles orden/filtro */}
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer', userSelect:'none' }}>
            <input type="checkbox" checked={soloOk} onChange={e => setSoloOk(e.target.checked)} />
            Solo las que cumplen los 3 criterios
          </label>
          {/* Filtro sistema estructural */}
          <select value={filtroSistema} onChange={e => setFiltroSistema(e.target.value)}
            style={{ border:'1.5px solid', borderRadius:5, padding:'3px 8px', fontSize:11,
              borderColor: filtroSistema ? '#0e6560' : '#cbd5e1',
              color: filtroSistema ? '#0e6560' : '#94a3b8',
              fontWeight: filtroSistema ? 700 : 400 }}>
            <option value="">Sistema: todos</option>
            {ESTRUCTURAS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {/* Filtro RF */}
          <select value={filtroRF} onChange={e => setFiltroRF(e.target.value)}
            style={{ border:'1px solid #cbd5e1', borderRadius:5, padding:'3px 8px', fontSize:11, color: filtroRF ? '#374151' : '#94a3b8' }}>
            <option value="">RF mínimo: todos</option>
            {['F15','F30','F60','F90','F120'].map(f => <option key={f} value={f}>RF ≥ {f}</option>)}
          </select>
          {/* Toggle: incluir soluciones PDA de otras comunas (grises) */}
          {(elem==='muro'||elem==='techumbre'||elem==='piso') && (
            <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer', userSelect:'none' }}
              title="Incluye soluciones de reacondicionamiento de otros PDA (aparecen en gris: no aplican a la comuna del proyecto)">
              <input type="checkbox" checked={mostrarOtrosPda} onChange={e => setMostrarOtrosPda(e.target.checked)} />
              Otros PDA
            </label>
          )}
          <span style={{ fontSize:11, color:'#94a3b8', marginLeft:8 }}>Ordenar:</span>
          {[['cumplimiento','Cumplimiento'],['u','U ↑'],['rf','RF ↓'],['rw','Rw ↓']].map(([k,l]) => (
            <button key={k} onClick={() => setOrden(k)}
              style={{ padding:'3px 10px', fontSize:11, border:'1px solid', borderRadius:5, cursor:'pointer',
                borderColor: orden===k ? '#64748b' : '#e2e8f0',
                background: orden===k ? '#334155' : '#fff',
                color: orden===k ? '#fff' : '#374151', fontWeight: orden===k ? 700 : 400 }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Asistente de selección — preventivo (B) + brecha cuantificada (C) ── */}
      {(() => {
        // Base estable: independiente de búsqueda/filtroRF/soloOk para dar el
        // panorama real del catálogo en la zona/uso/sistema actual.
        const sisActivo = filtroSistema || (targetSistema ? (proy.estructuras?.find(e => e.id === targetSistema)?.tipo || '') : '')
        const base = SC.filter(s => s.elem === elem)
          .filter(s => !sisActivo || !s.sistemas || s.sistemas.includes(sisActivo))
          .map(s => ({ ...s, ev: evaluar(s) }))
        const aplicables = base.filter(s => s.ev.aplica)
        // Sin nada que asistir (p.ej. elemento sin soluciones en el catálogo)
        if (aplicables.length === 0) return null

        const cumplen = aplicables.filter(s => s.ev.total === 3).sort((a, b) => (a.u || 99) - (b.u || 99))
        const hayCumplen = cumplen.length > 0

        // Brecha cuantificada para las más cercanas (cuando nada cumple los 3)
        const cercanas = aplicables
          .map(s => {
            const gapU = (!s.ev.tOk && uMax) ? +(s.u - uMax).toFixed(3) : 0
            const gapF = (!s.ev.fOk && rfReq) ? (rfN(rfReq) - rfN(s.rf || 'F0')) : 0
            const gapA = (!s.ev.aOk && acReq) ? (acReq - (s.ac_rw || 0)) : 0
            const fallos = (s.ev.tOk ? 0 : 1) + (s.ev.fOk ? 0 : 1) + (s.ev.aOk ? 0 : 1)
            return { ...s, gapU, gapF, gapA, fallos }
          })
          .sort((a, b) => a.fallos - b.fallos || a.gapU - b.gapU || (a.u || 99) - (b.u || 99))
          .slice(0, 3)

        const aplicarBtns = (x) => (
          <div style={{ display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
            <button onClick={() => onAplicar(x, targetSistema)}
              style={{ background:'#166534', color:'#fff', border:'none', borderRadius:5, padding:'4px 11px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
              Aplicar →
            </button>
            {targetSistema && (proy.estructuras?.length > 1) && (
              <button onClick={() => onAplicarTodos(x)} title="Aplicar a TODOS los sistemas"
                style={{ background:'#0f766e', color:'#fff', border:'none', borderRadius:5, padding:'4px 9px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                Todos →
              </button>
            )}
          </div>
        )

        return (
          <div style={{ ...S.card, border:`1.5px solid ${hayCumplen ? '#86efac' : '#fca5a5'}`, background: hayCumplen ? '#f0fdf4' : '#fef2f2' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, cursor:'pointer' }}
              onClick={() => setShowAsistente(v => !v)}>
              <p style={{ ...S.h2, marginBottom:0, color: hayCumplen ? '#166534' : '#991b1b' }}>
                🧭 Asistente de selección — {ELEM_LABELS[elem]} · Zona {zona} / {uso}
              </p>
              <span style={{ fontSize:11, color:'#64748b' }}>{showAsistente ? '▲ ocultar' : '▼ mostrar'}</span>
            </div>

            {showAsistente && (
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:12, color:'#475569', marginBottom:10 }}>
                  <b>{cumplen.length}</b> de {aplicables.length} soluciones aplicables a tu zona/uso cumplen los 3 criterios
                  {sisActivo && <> · sistema <b>{sisActivo.replace('Metalframe (acero liviano)','Metalframe')}</b></>}
                  {' · '}exigencias: {uMax ? `U≤${uMax}` : 'U s/l'}{rfReq ? ` · RF≥${rfReq}` : ''}{acReq ? ` · Rw≥${acReq}dB` : ''}
                </div>

                {hayCumplen ? (
                  <>
                    <div style={{ fontSize:11, fontWeight:700, color:'#166534', marginBottom:6 }}>
                      ✓ Recomendadas (mejor desempeño térmico primero)
                    </div>
                    {cumplen.slice(0, 3).map(x => (
                      <div key={x.cod} style={{ background:'#fff', border:'1px solid #86efac', borderRadius:6, padding:'8px 11px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                        <div style={{ minWidth:180, flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:12, color:'#0e6560' }}>{x.cod} — {x.desc}</div>
                          <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{x.capas}</div>
                        </div>
                        <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
                          <span style={{ fontSize:10, background:'#dcfce7', color:'#166534', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>U={x.u}</span>
                          {x.rf && <span style={{ fontSize:10, background:'#fee2e2', color:'#991b1b', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>RF={x.rf}</span>}
                          {x.ac_rw && <span style={{ fontSize:10, background:'#ccfbf1', color:'#0e6560', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>Rw={x.ac_rw}dB</span>}
                          {aplicarBtns(x)}
                        </div>
                      </div>
                    ))}
                    {cumplen.length > 3 && (
                      <div style={{ fontSize:11, color:'#166534', marginTop:2 }}>
                        + {cumplen.length - 3} solución{cumplen.length - 3 > 1 ? 'es' : ''} más cumplen — revisa el catálogo abajo (orden por cumplimiento).
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:11, fontWeight:700, color:'#991b1b', marginBottom:6 }}>
                      ⚠ Ninguna solución del catálogo cumple los 3 criterios en esta combinación. Las más cercanas, con la brecha exacta:
                    </div>
                    {cercanas.map(x => (
                      <div key={x.cod} style={{ background:'#fff', border:'1px solid #fca5a5', borderRadius:6, padding:'8px 11px', marginBottom:6 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                          <div style={{ minWidth:180, flex:1 }}>
                            <div style={{ fontWeight:700, fontSize:12, color:'#0e6560' }}>{x.cod} — {x.desc}</div>
                            <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{x.capas}</div>
                          </div>
                          {aplicarBtns(x)}
                        </div>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
                          {x.gapU > 0 && (
                            <span style={{ fontSize:10, background:'#fef3c7', color:'#92400e', borderRadius:4, padding:'2px 7px', fontWeight:600 }}>
                              🌡 U={x.u} — excede el límite en +{x.gapU} W/m²K
                            </span>
                          )}
                          {x.gapF > 0 && (
                            <span style={{ fontSize:10, background:'#fee2e2', color:'#991b1b', borderRadius:4, padding:'2px 7px', fontWeight:600 }}>
                              🔥 RF {x.rf || '—'} — faltan {x.gapF} min (requiere {rfReq})
                            </span>
                          )}
                          {x.gapA > 0 && (
                            <span style={{ fontSize:10, background:'#ccfbf1', color:'#0e6560', borderRadius:4, padding:'2px 7px', fontWeight:600 }}>
                              🔊 Rw {x.ac_rw || 0}dB — faltan {x.gapA} dB (requiere {acReq})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize:10, color:'#991b1b', marginTop:4 }}>
                      💡 Para cerrar la brecha térmica considera agregar aislación exterior (SATE/EIFS) o un sistema con mejor λ.
                      Expande una solución para usar el simulador de capas y recalcular U en tiempo real.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Recomendaciones para uso+elemento ───────────────────────────────── */}
      {recos.length > 0 && (
        <div style={{ ...S.card, background:'#f0fdf4', borderColor:'#86efac' }}>
          <p style={{ ...S.h3, color:'#166534', marginBottom:8 }}>
            Recomendadas para {uso} — {ELEM_LABELS[elem]}
          </p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {recos.map(r => {
              const s = SC.find(x => x.cod === r.cod)
              if (!s) return null
              return (
                <div key={r.cod} style={{ background:'#fff', border:'1px solid #86efac', borderRadius:6, padding:'7px 11px', maxWidth:280 }}>
                  <div style={{ fontWeight:700, color:'#166534', fontSize:12 }}>{s.desc}</div>
                  <div style={{ color:'#64748b', fontSize:11, marginTop:2 }}>{r.razon}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Lista de soluciones ──────────────────────────────────────────────── */}
      <div style={S.card}>
        {pdaInfo && (elem==='muro'||elem==='techumbre'||elem==='piso') && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', marginBottom:10, fontSize:12, color:'#92400e', lineHeight:1.6 }}>
            📋 <b>{proy.comuna}</b> está bajo el <b>{pdaInfo.nombre}</b> ({pdaInfo.decreto}). La verificación de obra nueva usa la U-máx del PDA (muro {pdaInfo.requisitos.muro} · techo {pdaInfo.requisitos.techo} · piso {pdaInfo.requisitos.piso}) si es más estricta que la zona.
            {pdaInfo.reacond && <> Las fichas <span style={{ background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:4, padding:'0 4px' }}>PDA</span> del catálogo son de <b>reacondicionamiento</b> (vivienda existente, estándar más laxo).</>}
          </div>
        )}
        {soluciones.length === 0 && (
          <div style={S.warn}>Sin resultados con los filtros actuales.</div>
        )}
        {soluciones.map(s => {
          const ev  = s.ev
          const exp = expandido === s.cod
          const isBH = hasBH(s.cod)
          return (
            <div key={s.cod} style={{
              border:`1.5px solid ${borderColor(ev)}`,
              borderRadius:8, marginBottom:6, overflow:'hidden',
              opacity: ev.aplica ? 1 : 0.5,
            }}>
              {/* Cabecera de la solución */}
              <div
                style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'9px 13px', cursor:'pointer', background: exp ? '#f8fafc' : '#fff' }}
                onClick={() => setExpandido(exp ? null : s.cod)}
              >
                <div style={{ width:10, height:10, borderRadius:'50%', background:dotColor(ev), flexShrink:0, marginTop:3 }} />
                <div style={{ flex:1 }}>
                  {/* Título */}
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:3 }}>
                    <span style={{ fontWeight:700, fontSize:12 }}>{s.desc}</span>
                    {isBH && (
                      <span style={{ fontSize:10, background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:4, padding:'1px 5px', color:'#0e6560' }}>
                        Homologable
                      </span>
                    )}
                    {s.esPDA && (
                      <span title={`Solución oficial de reacondicionamiento térmico del ${PDA[s.pda].nombre}. U oficial (NCh853) — no recalculable.`}
                        style={{ fontSize:10, background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:4, padding:'1px 5px', color:'#92400e', cursor:'help' }}>
                        PDA · {PDA[s.pda].nombre}
                      </span>
                    )}
                    {!ev.aplica && (
                      <span title={s.esPDA && !ev.pdaOk
                          ? `Esta solución es del ${PDA[s.pda].nombre}; la comuna del proyecto (${proy.comuna || 'sin definir'}) no pertenece a ese PDA.`
                          : motivoNoAplica(ev, s)}
                        style={{ fontSize:10, background:'#f1f5f9', borderRadius:4, padding:'1px 5px', color:'#94a3b8', cursor:'help' }}>
                        {s.esPDA && !ev.pdaOk ? 'otro PDA — no aplica a tu comuna' : `No aplica al uso ${uso}`} ⓘ
                      </span>
                    )}
                  </div>
                  {/* Capas y código */}
                  <div style={{ fontSize:10, color:'#94a3b8', marginBottom:4 }}>
                    {s.cod} · {s.capas}
                  </div>
                  {/* Semáforo triple T / F / A */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {/* Térmico — siempre visible */}
                    <span style={{
                      fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 8px',
                      color:      !ev.aplica ? '#94a3b8' : ev.tOk ? '#166534' : '#dc2626',
                      background: !ev.aplica ? '#f1f5f9' : ev.tOk ? '#dcfce7' : '#fee2e2',
                    }}>
                      T {ev.aplica ? (ev.tOk ? '✓' : '✗') : '–'} U={s.u}{ev.uLim ? ` (≤${ev.uLim}${s.esPDA ? ' · PDA' : ''})` : ''}
                    </span>
                    {/* Fuego — solo obra nueva (las PDA no traen RF certificado) */}
                    {!s.esPDA && rfReq && (
                      <span style={{
                        fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 8px',
                        color:      !ev.aplica ? '#94a3b8' : ev.fOk ? '#166534' : '#dc2626',
                        background: !ev.aplica ? '#f1f5f9' : ev.fOk ? '#dcfce7' : '#fee2e2',
                      }}>
                        F {ev.aplica ? (ev.fOk ? '✓' : '✗') : '–'} {s.rf || '—'}{` (≥${rfReq})`}
                      </span>
                    )}
                    {/* Acústica — solo obra nueva */}
                    {!s.esPDA && acReq && (
                      <span style={{
                        fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 8px',
                        color:      !ev.aplica ? '#94a3b8' : ev.aOk ? '#166534' : '#dc2626',
                        background: !ev.aplica ? '#f1f5f9' : ev.aOk ? '#dcfce7' : '#fee2e2',
                      }}>
                        A {ev.aplica ? (ev.aOk ? '✓' : '✗') : '–'} Rw {s.ac_rw ?? '—'}{acReq ? ` (≥${acReq}dB)` : ''}
                      </span>
                    )}
                    {/* Condensación (solo PDA — dato oficial de la ficha) */}
                    {s.esPDA && s.cond && (
                      <span style={{
                        fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 8px',
                        color:      s.cond === 'sin' ? '#166534' : '#92400e',
                        background:  s.cond === 'sin' ? '#dcfce7' : '#fef3c7',
                      }}>
                        {s.cond === 'sin' ? '✓ Sin condensación' : '⚠ Riesgo condensación'}
                      </span>
                    )}
                    {/* Acústica ESTIMADA (PDA) — ley de masa, no certificada */}
                    {s.esPDA && s.rwEstimado != null && (
                      <span title="Rw estimado por ley de masa (ISO 15712), NO certificado. Subestima en muros/tabiques con cámara o doble placa (masa-resorte-masa). Verifica con ensayo NCh2786 o una referencia LOSCAA."
                        style={{ fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 8px', color:'#92400e', background:'#fef3c7', cursor:'help' }}>
                        A ~{s.rwEstimado} dB (est.){acReq ? ` · req ≥${acReq}` : ''}
                      </span>
                    )}
                    {/* Fuego (PDA) — no certificado, requiere revestimiento RF */}
                    {s.esPDA && (
                      <span title="Las fichas PDA no certifican resistencia al fuego. El núcleo aislante (EPS/lana) no aporta RF: agrega un revestimiento ignífugo certificado en la cara interior (yeso cartón RF ≈ F30, doble placa ≈ F60) y valídalo con ensayo NCh935 o el LOFC."
                        style={{ fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 8px', color:'#92400e', background:'#fef3c7', cursor:'help' }}>
                        F ⚠ requiere revestimiento RF
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setSelComp(prev => {
                        if (prev.find(x => x.cod === s.cod)) return prev.filter(x => x.cod !== s.cod)
                        if (prev.length >= 2) return [prev[1], s]
                        return [...prev, s]
                      })
                    }}
                    style={{
                      background: selComp.find(x => x.cod === s.cod) ? '#0e6560' : '#f1f5f9',
                      color: selComp.find(x => x.cod === s.cod) ? '#fff' : '#64748b',
                      border: '1px solid #e2e8f0', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer'
                    }}
                  >
                    {selComp.find(x => x.cod === s.cod) ? '✓ Sel.' : 'Comparar'}
                  </button>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>{exp ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Panel expandido */}
              {exp && (
                <div style={{ padding:'10px 16px', background:'#f8fafc', borderTop:'1px solid #e2e8f0' }}>
                  <div style={{ fontSize:12, color:'#374151', marginBottom:8 }}>{s.obs}</div>
                  {!s.esPDA && (
                    <div style={{ fontSize:11, color:'#64748b', marginBottom:10 }}>
                      {/* A3: las zonas se DERIVAN del cálculo (U ≤ U-máx por zona),
                          no del campo `zonas` curado a mano (que podía mentir). */}
                      {(() => {
                        const usosStr = Array.isArray(s.usos) ? s.usos.join(', ') : String(s.usos || '').split('').join(', ')
                        const elemZ = s.elem === 'tabique' ? null : (s.elem === 'techumbre' ? 'techo' : s.elem)
                        let cumpleZonas
                        if (s.elem === 'puerta') cumpleZonas = Object.keys(ZONAS).filter(z => { const m = PUERTA_U[z]; return !m || s.u <= m }).join(', ') || 'ninguna'
                        else if (elemZ) cumpleZonas = Object.keys(ZONAS).filter(z => s.u <= ZONAS[z][elemZ]).join(', ') || 'ninguna'
                        else cumpleZonas = 'sin exigencia de U (tabique)'
                        return <>Cumple térmico (U≤U-máx) en zonas: <b>{cumpleZonas}</b> · Usos: {usosStr || '—'}</>
                      })()}
                    </div>
                  )}

                  {/* PDA: nota de reacondicionamiento (U-máx del plan + comunas) */}
                  {s.esPDA && (
                    <div style={{ fontSize:11, color:'#92400e', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:6, padding:'8px 12px', marginBottom:10, lineHeight:1.6 }}>
                      Cumple el U-máx de <b>reacondicionamiento térmico de vivienda existente</b> del <b>{PDA[s.pda].nombre}</b>: U={s.u} ≤ {pdaUmax(s)} W/m²K.
                      Es una <b>ficha oficial MINVU</b> con U certificado — no se recalcula ni edita.
                      <div style={{ marginTop:6, paddingTop:6, borderTop:'1px dashed #fde68a' }}>
                        <b>⚠ La ficha PDA solo cubre lo térmico</b> (U + condensación). No certifica fuego ni acústica — la propia normativa exige esos criterios pero no los entrega con estas soluciones. Debes completarlos por separado:
                        <div style={{ marginTop:3 }}>🔊 <b>Acústica:</b> Rw estimado <b>~{s.rwEstimado ?? '—'} dB</b> por ley de masa (ISO 15712), <b>no certificado</b>. Subestima si hay cámara/doble placa. Verifica en la pestaña Acústica contra el Rw del uso (NCh352). Si la estructura base es reconocible, abajo aparece la <b>referencia oficial LOSCAA</b>.</div>
                        <div style={{ marginTop:3 }}>🔥 <b>Fuego:</b> el núcleo aislante <b>no aporta RF</b>. Agrega un <b>revestimiento ignífugo certificado</b> en la cara interior (yeso cartón RF ≈ F30, doble placa ≈ F60) y valídalo en la pestaña Fuego (OGUC) con ensayo NCh935. Abajo, si hay cruce, aparece el <b>RF de la estructura base (LOFC)</b>.</div>
                      </div>
                      <div style={{ marginTop:4, color:'#64748b' }}>Comunas del PDA: {PDA[s.pda].comunas.join(', ')}.</div>
                    </div>
                  )}

                  {/* ── Códigos Normativos (LOSCAT + LOFC + LOSCAA) ──────────── */}
                  {!s.esPDA && <CodigosNormativos sc={s} rfReq={rfReq} acReq={acReq} />}
                  {/* PDA: homologación fuego/acústico por estructura base (referencial) */}
                  {s.esPDA && <CodigosNormativos sc={s} rfReq={rfReq} acReq={acReq} omitirTermico modoBaseReferencial />}


                  {/* ── Alternativas LOSCAT cuando incumple (no en tarjetas PDA) ── */}
                  {!ev.aplica && !s.esPDA && (
                    <div style={{ background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:6, padding:'10px 14px', marginBottom:10 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 }}>⚠ No aplica al uso — Alternativas que cumplen los 3 criterios para {zona}/{uso}</div>
                      {SC.filter(x => x.elem===elem && (x.usos || []).includes(uso))
                        .map(x => ({ ...x, ev: evaluar(x) }))
                        .filter(x => x.ev.aplica && x.ev.total===3)
                        .sort((a,b) => a.u - b.u)
                        .slice(0,4)
                        .map(x => (
                          <div key={x.cod} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:'1px solid #e2e8f0', fontSize:11 }}>
                            <span><b style={{ color:'#0e6560' }}>{x.cod}</b> — {x.desc}</span>
                            <span style={{ color:'#16a34a', fontWeight:700, whiteSpace:'nowrap', marginLeft:8 }}>U={x.u} RF={x.rf||'—'} Rw={x.ac_rw||'—'}</span>
                          </div>
                        ))}
                    </div>
                  )}

                  {ev.aplica && !s.esPDA && ev.total < 3 && (() => {
                    const alts = SC.filter(x => x.elem===elem && (x.usos || []).includes(uso) && x.cod!==s.cod)
                      .map(x => ({ ...x, ev: evaluar(x) })).filter(x => x.ev.aplica && x.ev.total===3)
                    const porT = !ev.tOk ? alts.filter(x=>x.u<=uMax).sort((a,b)=>a.u-b.u).slice(0,3) : []
                    const porF = !ev.fOk && rfReq ? alts.filter(x=>x.rf&&rfN(x.rf)>=rfN(rfReq)).sort((a,b)=>rfN(b.rf)-rfN(a.rf)).slice(0,3) : []
                    const porA = !ev.aOk && acReq ? alts.filter(x=>x.ac_rw&&x.ac_rw>=acReq).sort((a,b)=>b.ac_rw-a.ac_rw).slice(0,3) : []
                    const mostrar = [...new Map([...porT,...porF,...porA].map(x=>[x.cod,x])).values()].slice(0,5)
                    if (!mostrar.length) return null
                    return (
                      <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:6, padding:'10px 14px', marginBottom:10 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#c2410c', marginBottom:8 }}>
                          💡 Alternativas LOSCAT que cumplen los 3 criterios para {zona}/{uso}
                          <span style={{ fontWeight:400, marginLeft:6 }}>
                            {!ev.tOk&&`U≤${uMax} `}{!ev.fOk&&rfReq&&`RF≥${rfReq} `}{!ev.aOk&&acReq&&`Rw≥${acReq}dB`}
                          </span>
                        </div>
                        {mostrar.map(x => (
                          <div key={x.cod} style={{ background:'#fff', border:'1px solid #fed7aa', borderRadius:5, padding:'7px 10px', marginBottom:5, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 }}>
                            <div>
                              <div style={{ fontWeight:700, fontSize:11, color:'#0e6560' }}>{x.cod} — {x.desc}</div>
                              <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{x.capas}</div>
                            </div>
                            <div style={{ display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
                              <span style={{ fontSize:10, background:'#dcfce7', color:'#166534', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>U={x.u}</span>
                              {x.rf&&<span style={{ fontSize:10, background:'#fee2e2', color:'#991b1b', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>RF={x.rf}</span>}
                              {x.ac_rw&&<span style={{ fontSize:10, background:'#ccfbf1', color:'#0e6560', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>Rw={x.ac_rw}dB</span>}
                              <button onClick={()=>onAplicar(x, targetSistema)}
                                style={{ background:'#166534', color:'#fff', border:'none', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                                Aplicar →
                              </button>
                              {targetSistema && (proy.estructuras?.length > 1) && (
                                <button onClick={()=>onAplicarTodos(x)}
                                  title="Aplicar a TODOS los sistemas"
                                  style={{ background:'#0f766e', color:'#fff', border:'none', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                                  Todos →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* ── Sugerencias de mejoras térmicas cuando no cumple U ─── */}
                  {ev.aplica && !s.esPDA && !ev.tOk && uMax && (() => {
                    const mejoras = sugerirMejorasTermicas(s, SC.filter(x => x.elem === elem), uMax, { zona, uso })
                    if (!mejoras || mejoras.cumple) return null

                    return (
                      <div style={{ background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:6, padding:'10px 14px', marginBottom:10 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#92400e', marginBottom:8 }}>
                          🔧 Mejoras térmicas sugeridas
                          <span style={{ fontWeight:400, marginLeft:6, fontSize:11 }}>
                            Mejora requerida: {mejoras.mejoraRequerida?.toFixed(3)} W/m²K
                          </span>
                        </div>

                        {mejoras.sugerencias.length > 0 ? (
                          <div style={{ marginBottom:8 }}>
                            <div style={{ fontSize:11, fontWeight:600, color:'#78350f', marginBottom:6 }}>✓ Soluciones estándar que cumplen:</div>
                            {mejoras.sugerencias.map((alt, i) => (
                              <div key={i} style={{ background:'#fff', border:'1px solid #fde047', borderRadius:4, padding:'6px 10px', marginBottom:4, fontSize:10, color:'#374151' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                                  <span><b>{alt.cod}</b> — {alt.desc}</span>
                                  <span style={{ fontWeight:700, color:'#16a34a' }}>U={alt.u}W/m²K (mejora {alt.mejora.toFixed(3)})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : mejoras.recomendacion ? (
                          <div style={{ marginBottom:8 }}>
                            <div style={{ fontSize:11, fontWeight:600, color:'#78350f', marginBottom:6 }}>💡 Medidas de mejora personalizada:</div>
                            {mejoras.recomendacion.medidas.map((med, i) => (
                              <div key={i} style={{ background:'#fff', border:'1px solid #fde047', borderRadius:4, padding:'6px 10px', marginBottom:4, fontSize:10 }}>
                                <div style={{ fontWeight:600, color:'#92400e', marginBottom:2 }}>Opción {med.opcion}: {med.desc}</div>
                                <div style={{ color:'#64748b', fontSize:9 }}>
                                  Impacto: {med.impacto} · Costo: {med.costo}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div style={{ fontSize:10, color:'#92400e', paddingTop:6, borderTop:'1px solid #fde047' }}>
                          💬 <b>Nota:</b> Estas sugerencias se basan en soluciones estándar disponibles o cálculos aproximados.
                          Consulta con el diseñador para validar la solución final.
                        </div>
                      </div>
                    )
                  })()}

                  {/* Ficha gráfica — obra nueva y PDA curadas (con capas estructuradas) */}
                  {(!s.esPDA || s.capasStruct?.length) && (
                    <FichaSCCompleta s={s} uMax={s.esPDA ? pdaUmax(s) : uMax} rfReq={s.esPDA ? null : rfReq} acReq={s.esPDA ? null : acReq} />
                  )}

                  {/* Simulador de capas — solo cuando hay datos BH o SC_CAPAS (evita la violación de hooks) */}
                  {(BH.some(b => b.cod === s.cod) || !!SC_CAPAS[s.cod]) && (
                    <SimuladorCapas
                      s={s} elem={elem}
                      uMax={uMax} rfReq={rfReq} acReq={acReq}
                      proy={proy}
                      onEnviarCalcU={onEnviarCalcU}
                      onModificar={setModSim}
                    />
                  )}
                  <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button style={S.btn('#166534')} onClick={() => onAplicar(s, targetSistema, modSim?.cod === s.cod ? modSim : null)}>
                      {targetSistema ? `Aplicar a ${proy.estructuras?.find(e=>e.id===targetSistema)?.tipo?.split(' ')[0] || 'sistema'} →` : 'Aplicar al proyecto →'}
                      {modSim?.cod === s.cod ? ` (U=${modSim.u} modificada)` : ''}
                    </button>
                    {/* Botón "Aplicar a todos" — cuando hay >1 sistema y se está asignando a uno */}
                    {targetSistema && (proy.estructuras?.length > 1) && (
                      <button
                        style={{ ...S.btn('#0f766e'), display:'flex', alignItems:'center', gap:6 }}
                        title={`Aplica esta solución de ${ELEM_LABELS[s.elem] || s.elem} a TODOS los sistemas del proyecto`}
                        onClick={() => onAplicarTodos(s, modSim?.cod === s.cod ? modSim : null)}
                      >
                        Aplicar a TODOS los sistemas →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Barra flotante de comparación ──────────────────────────────────── */}
      {selComp.length > 0 && (
        <div style={{ position: 'sticky', bottom: 0, background: '#0e6560', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: '12px 12px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, flex: 1 }}>
            {selComp.length === 1 ? `"${selComp[0].desc?.substring(0,40)}..." seleccionada — elige una más` : `2 soluciones seleccionadas`}
          </span>
          {selComp.length === 2 && <button onClick={() => setShowComp(true)} style={{ background: '#fff', color: '#0e6560', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Ver comparación →</button>}
          <button onClick={() => setSelComp([])} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>✕ Limpiar</button>
        </div>
      )}

      {/* ── Modal comparador ──────────────────────────────────────────────────── */}
      {showComp && selComp.length === 2 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ background: '#0e6560', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Comparador de soluciones</span>
              <button onClick={() => setShowComp(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', width: '20%', color: '#64748b', fontSize: 11 }}>CAMPO</th>
                    {selComp.map((sc, i) => (
                      <th key={i} style={{ padding: '8px 12px', textAlign: 'left', background: i === 0 ? '#f0fdfa' : '#f0fdf4', borderBottom: '2px solid #e2e8f0', color: i === 0 ? '#0e6560' : '#166534' }}>
                        {sc.cod}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Descripción', render: sc => sc.desc || '—' },
                    { label: 'U (W/m²K)', render: sc => sc.u ? `${sc.u} W/m²K` : '—' },
                    { label: 'Resistencia al fuego', render: sc => sc.rf || '—' },
                    { label: 'Aislación acústica Rw', render: sc => sc.ac_rw ? `${sc.ac_rw} dB` : '—' },
                    { label: 'Elemento', render: sc => sc.elem || '—' },
                    { label: 'Observaciones', render: sc => sc.obs || '—' },
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #e2e8f0' }}>{row.label}</td>
                      {selComp.map((sc, j) => (
                        <td key={j} style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: row.label === 'U (W/m²K)' ? 700 : 400 }}>{row.render(sc)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap:'wrap' }}>
                {selComp.map((sc, i) => (
                  <React.Fragment key={i}>
                    <button onClick={() => { onAplicar(sc, targetSistema); setShowComp(false) }} style={{ flex: 1, minWidth:120, padding: '10px 0', background: i === 0 ? '#0e6560' : '#166534', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                      Usar {sc.cod}
                    </button>
                    {targetSistema && (proy.estructuras?.length > 1) && (
                      <button onClick={() => { onAplicarTodos(sc); setShowComp(false) }} style={{ flex: 1, minWidth:120, padding: '10px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                        {sc.cod} → todos los sistemas
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <NotasPanel tabKey="soluciones" notas={notas} setNotas={setNotas} />
    </div>
  )
}

// ─── PESTAÑA TÉRMICA ───────────────────────────────────────────────────────────
function TabTermica({ proy, termica, setTermica, setTab, notas, setNotas }) {
  const zona = proy.zona ? ZONAS[proy.zona] : null
  const uso = proy.uso || 'Vivienda'
  const set = (id, field, val) => setTermica(t => ({ ...t, [id]: { ...(t[id] || {}), [field]: val } }))

  // Verificación SOLO térmica (U). La RF se evalúa en la pestaña 4 · Fuego.
  const ELEMS = [
    { id:'muro',    label:'Muro',            umax: zona?.muro },
    { id:'techo',   label:'Techo/Cubierta',  umax: zona?.techo },
    { id:'piso',    label:'Piso',            umax: zona?.piso },
    { id:'tabique', label:'Tabique',         umax: null },
    { id:'ventana', label:'Ventana',         umax: null },
    { id:'puerta',  label:'Puerta exterior', umax: PUERTA_U[proy.zona]||null },
  ]

  const vpctAlerta = zona?.pda

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Verificación Térmica"
        pasos={[
          'Ingresa el valor U (W/m²K) para cada elemento: puedes tomarlo de la solución LOSCAT aplicada o calcularlo en <b>Cálculo U</b>.',
          'El campo <b>Factor puente térmico (TB%)</b> corrige el U real según la presencia de estructura portante. Usa el valor de la solución LOSCAT o MINVU (guía puentes térmicos).',
          'La verificación es solo térmica (U ≤ U-máx DS N°15). La <b>resistencia al fuego (RF)</b> se verifica en la pestaña <b>4 · Fuego</b>.',
          'Las filas en verde cumplen DS N°15 · Zona ' + (proy.zona||'—') + '. Las rojas requieren ajuste.',
        ]}
        normativa="DS N°15 MINVU · NCh853:2021 · ISO 6946:2017 · OGUC Art. 4.1.10"
      />

      {/* ── Soluciones aplicadas (resumen visual) ─────────────────────────── */}
      {(() => {
        const multiSistema = (proy.estructuras?.length > 1)
        const ELEMS_SOL = ['muro','techo','piso','tabique']

        // ── Vista multi-sistema ──────────────────────────────────────────────
        if (multiSistema) {
          const tieneAlgo = proy.estructuras.some(e => e.soluciones && Object.keys(e.soluciones).length > 0)
            || ELEMS_SOL.some(k => termica[k]?.solucion)
          if (!tieneAlgo) return null

          return (
            <div style={S.card}>
              <p style={S.h3}>Soluciones constructivas por sistema estructural</p>
              <p style={{ fontSize:11, color:'#64748b', marginBottom:10 }}>
                Asigna soluciones desde la pestaña <b>Soluciones</b> seleccionando el sistema destino.
              </p>
              {proy.estructuras.map(est => {
                const soles = est.soluciones || {}
                const tiene = Object.keys(soles).length > 0
                return (
                  <div key={est.id} style={{
                    border: tiene ? '1.5px solid #86efac' : '1px dashed #cbd5e1',
                    borderRadius:8, padding:'10px 14px', marginBottom:8,
                  }}>
                    {/* Cabecera del sistema */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: tiene ? 8 : 0 }}>
                      <span style={{ fontWeight:700, fontSize:12, color:'#374151' }}>{est.tipo}</span>
                      {est.sector && <span style={{ fontSize:11, color:'#64748b', background:'#f1f5f9', borderRadius:4, padding:'1px 6px' }}>{est.sector}</span>}
                      {est.desde && <span style={{ fontSize:10, color:'#94a3b8' }}>Pisos {est.desde}–{est.hasta}</span>}
                      {!tiene && <span style={{ fontSize:11, color:'#94a3b8', marginLeft:'auto' }}>Sin soluciones asignadas</span>}
                    </div>
                    {/* Chips de soluciones por elemento */}
                    {tiene && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {ELEMS_SOL.map(k => {
                          const d = soles[k]
                          if (!d) return null
                          const um = ELEMS.find(e=>e.id===k)?.umax
                          const ok = !um || parseFloat(d.u||99) <= um
                          return (
                            <div key={k} style={{ background: ok?'#f0fdf4':'#fff5f5', border:`1px solid ${ok?'#86efac':'#fca5a5'}`, borderRadius:6, padding:'6px 10px', minWidth:160 }}>
                              <div style={{ fontSize:9, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>{k}</div>
                              <div style={{ fontSize:11, fontWeight:700, color:'#0e6560' }}>{d.solucion?.cod}</div>
                              <div style={{ fontSize:10 }}>{d.solucion?.desc}</div>
                              <div style={{ fontSize:11, marginTop:2 }}>
                                U = <b>{d.u} W/m²K</b>
                                {um && <> <span style={{ fontWeight:700, color: ok?'#166534':'#dc2626' }}>{ok?'✓':'✗'}</span></>}
                              </div>
                              {d.rf && <div style={{ fontSize:10, color:'#374151' }}>RF {d.rf}{d.rw ? ` · Rw ${d.rw}dB` : ''}</div>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Global (fallback) si existe */}
              {ELEMS_SOL.some(k => termica[k]?.solucion) && (
                <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:6 }}>
                    Soluciones globales (aplican a todos los sistemas sin asignación específica)
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {ELEMS_SOL.filter(k => termica[k]?.solucion).map(k => {
                      const sol = termica[k].solucion
                      const up = parseFloat(termica[k]?.u || 99)
                      const um = ELEMS.find(e=>e.id===k)?.umax
                      const ok = !um || up <= um
                      return (
                        <div key={k} style={{ background: ok?'#f0fdf4':'#fff5f5', border:`1px solid ${ok?'#86efac':'#fca5a5'}`, borderRadius:6, padding:'6px 10px', minWidth:160 }}>
                          <div style={{ fontSize:9, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>{k}</div>
                          <div style={{ fontSize:11, fontWeight:700, color:'#0e6560' }}>{sol.cod}</div>
                          <div style={{ fontSize:10 }}>{sol.desc}</div>
                          <div style={{ fontSize:11, marginTop:2 }}>U = <b>{termica[k]?.u} W/m²K</b>{um && <> <span style={{ fontWeight:700, color: ok?'#166534':'#dc2626' }}>{ok?'✓':'✗'}</span></>}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        }

        // ── Vista sistema único (comportamiento original) ────────────────────
        const conSol = ELEMS_SOL.filter(k => termica[k]?.solucion)
        if (!conSol.length) return null
        return (
          <div style={S.card}>
            <p style={S.h3}>Soluciones constructivas aplicadas</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {conSol.map(k => {
                const sol = termica[k].solucion
                const up = parseFloat(termica[k]?.u || 99)
                const um = ELEMS.find(e=>e.id===k)?.umax
                const ok = !um || up <= um
                return (
                  <div key={k} style={{ background: ok?'#f0fdf4':'#fff5f5', border:`1px solid ${ok?'#86efac':'#fca5a5'}`, borderRadius:8, padding:'8px 12px', minWidth:180, flex:1 }}>
                    <div style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>{k}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#0e6560' }}>{sol.cod}</div>
                    <div style={{ fontSize:11 }}>{sol.desc}</div>
                    <div style={{ fontSize:11, marginTop:2 }}>
                      U = <b>{termica[k]?.u} W/m²K</b>
                      {um && <> · máx {um} · <span style={{ fontWeight:700, color: ok?'#166534':'#dc2626' }}>{ok?'✓ CUMPLE':'✗ NO CUMPLE'}</span></>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── Tabla de verificación ─────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h2}>Verificación térmica — DS N°15 MINVU · Zona {proy.zona||'—'}</p>
        {!zona && <div style={S.warn}>Selecciona zona térmica en Diagnóstico.</div>}
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Elemento</th>
            <th style={S.th}>U propuesta (W/m²K)</th>
            <th style={S.th}>TB% <span style={{ fontWeight:400, fontSize:10 }}>(opcional)</span></th>
            <th style={S.th}>U corregida</th>
            <th style={S.th}>U máx DS N°15</th>
            <th style={S.th}>Estado</th>
          </tr></thead>
          <tbody>
            {ELEMS.map(({ id, label, umax }) => {
              const sol = termica[id]?.solucion
              const uRaw = termica[id]?.u || ''
              const up = parseFloat(uRaw)
              const tbPct = parseFloat(termica[id]?.tb || 0)
              const uCorr = (!isNaN(up) && up > 0 && tbPct > 0) ? (up * (1 + tbPct/100)) : up
              const uDisplay = (!isNaN(uCorr) && uCorr > 0) ? uCorr.toFixed(3) : ''
              const cumpleU = !umax || !uDisplay || uCumpleMax(uDisplay, umax)
              const uInvalid = uRaw !== '' && (isNaN(up) || up <= 0)
              // Sub-filas por sistema estructural
              const sistemasSolElem = (proy.estructuras?.length > 1)
                ? proy.estructuras.filter(e => e.soluciones?.[id])
                : []
              return (
                <React.Fragment key={id}>
                <tr style={{ background: uDisplay&&!cumpleU?'#fff5f5':'transparent' }}>
                  <td style={S.td}>
                    <b>{label}</b>
                    {sol && <div style={{ fontSize:10, color:'#0e6560', marginTop:2 }}>📋 {sol.cod}</div>}
                    {sistemasSolElem.length > 0 && <div style={{ fontSize:9, color:'#64748b', marginTop:2 }}>+ {sistemasSolElem.length} sistema(s) con solución específica ↓</div>}
                  </td>
                  <td style={S.td}>
                    <input type="number" step="0.01" min="0" max="10" style={{ ...ist, width:75 }}
                      value={uRaw} onChange={e=>set(id,'u',e.target.value)} placeholder="ej. 0.45"/>
                    {uInvalid && <div style={{ fontSize:10, color:'#dc2626', marginTop:2 }}>⚠ Valor inválido</div>}
                  </td>
                  <td style={S.td}>
                    <input type="number" step="1" min="0" max="50" style={{ ...ist, width:55 }}
                      value={termica[id]?.tb||''} onChange={e=>set(id,'tb',e.target.value)} placeholder="0"/>
                    <div style={{ fontSize:9, color:'#94a3b8' }}>% corrección</div>
                  </td>
                  <td style={{ ...S.td, fontWeight: tbPct>0?700:'normal', color: tbPct>0?'#b45309':'inherit' }}>
                    {uDisplay || '—'}
                    {tbPct>0 && uDisplay && <div style={{ fontSize:9, color:'#b45309' }}>+{tbPct}% TB</div>}
                  </td>
                  <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>
                    {umax ? `≤ ${umax}` : <span style={{ color:'#94a3b8' }}>—</span>}
                  </td>
                  <td style={S.td}>
                    {uDisplay ? <span style={S.badge(cumpleU)}>{cumpleU?'CUMPLE':'NO CUMPLE'}</span>
                      : <span style={{ fontSize:11, color:'#94a3b8' }}>—</span>}
                  </td>
                </tr>
                {/* Sub-filas por sistema estructural */}
                {sistemasSolElem.map(est => {
                  const d = est.soluciones[id]
                  const uS = parseFloat(d.u || 0)
                  const okU = !umax || uS <= umax
                  return (
                    <tr key={est.id} style={{ background: okU ? '#f0fdf4' : '#fff5f5' }}>
                      <td style={{ ...S.td, paddingLeft:24, fontSize:11 }}>
                        <span style={{ color:'#64748b' }}>↳ {est.tipo.replace('Albanileria','Alb.').replace('Hormigon armado','H.A.').replace('Estructura de acero','Acero')}</span>
                        {est.sector && <span style={{ marginLeft:4, color:'#94a3b8', fontSize:10 }}>{est.sector}</span>}
                        {est.desde && <span style={{ marginLeft:4, color:'#94a3b8', fontSize:10 }}>P{est.desde}{est.hasta !== est.desde ? `–${est.hasta}` : ''}</span>}
                        {d.solucion && <div style={{ fontSize:10, color:'#0e6560' }}>📋 {d.solucion.cod} — {d.solucion.desc}</div>}
                      </td>
                      <td style={{ ...S.td, fontWeight:700 }}>{d.u}</td>
                      <td style={S.td}><span style={{ color:'#94a3b8', fontSize:10 }}>—</span></td>
                      <td style={{ ...S.td, fontWeight:700, color: okU ? '#166534' : '#dc2626' }}>{d.u || '—'}</td>
                      <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{umax ? `≤ ${umax}` : <span style={{ color:'#94a3b8' }}>—</span>}</td>
                      <td style={S.td}><span style={S.badge(okU)}>{okU ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
                    </tr>
                  )
                })}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        {/* ── Infiltración de referencia ──────────────────────────────────── */}
        {zona && INFILT[proy.zona] && (
          <div style={{ marginTop:10, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'8px 12px', fontSize:11, color:'#374151' }}>
            <b>Permeabilidad al aire de referencia — Zona {proy.zona}:</b> ≤ {INFILT[proy.zona]} m³/h·m² @ 100 Pa
            <span style={{ color:'#64748b', marginLeft:6 }}>(DS N°15 · medición según NCh2485)</span>
          </div>
        )}

        {/* ── Alerta VPCT ────────────────────────────────────────────────── */}
        {vpctAlerta && (
          <div style={{ ...S.warn, marginTop:10, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
            <span>☀ Zona {proy.zona}: <b>protección solar obligatoria</b> — verifica porcentajes de vano por orientación (DS N°15 Art. 4.1.10 / VPCT).</span>
            {setTab && <button onClick={()=>setTab(6)} style={{ ...S.btn('#b45309'), padding:'4px 10px', fontSize:11 }}>→ Ir a Ventana/VPCT</button>}
          </div>
        )}
      </div>
      <NotasPanel tabKey="termica" notas={notas} setNotas={setNotas} />
    </div>
  )
}

// ─── CALCULADOR RF ACERO ──────────────────────────────────────────────────────
function CalcRFAcero({ rfReq, tipo, sector }) {
  const [familia,     setFamilia]     = useState('HEB')
  const [serie,       setSerie]       = useState('200')
  const [caras,       setCaras]       = useState('3')   // '3'=viga, '4'=columna
  const [modoManual,  setModoManual]  = useState(false)
  const [hpManual,    setHpManual]    = useState('')
  const [prot,        setProt]        = useState('hormigon')
  const [mu0,         setMu0]         = useState('0.65')
  // Inputs de acreditación para sistemas calculables
  const [espAplicado, setEspAplicado] = useState('')
  // Inputs para pintura intumescente
  const [dftNominal,  setDftNominal]  = useState('')
  const [etaRef,      setEtaRef]      = useState('')
  const [fabricante,  setFabricante]  = useState('')

  // Factor de sección
  const perfData = PERFILES_ACERO[familia]?.[serie]
  const hpAuto   = perfData ? (caras === '4' ? perfData.Hp4 : perfData.Hp3) : null
  const hpA      = modoManual ? (parseFloat(hpManual) || null) : hpAuto

  // Temperatura crítica EN 1993-1-2 §4.2.4
  const mu0v     = Math.max(0.02, Math.min(0.98, parseFloat(mu0) || 0.65))
  const thetaCr  = 39.19 * Math.log(1 / (0.9674 * Math.pow(mu0v, 3.833)) - 1) + 482

  // Sistema de protección
  const protSys  = ACERO_PROT.find(p => p.id === prot)
  const rfLevels = ['F30', 'F60', 'F90', 'F120']

  function getMinProt(rfTarget) {
    if (!protSys || !hpA || protSys.requiereCertificado) return null
    const filas = protSys.tabla
      .filter(r => r.rf === rfTarget && r.hpMax >= hpA)
      .sort((a, b) => a.hpMax - b.hpMax)
    if (!filas.length) return null
    const f = filas[0]
    if (protSys.tipo === 'capas') return { text: `${f.capas} cap. × ${f.e} mm`, total: f.capas * f.e }
    return { text: `${f.e} mm`, total: f.e }
  }

  // DFT mínimo orientativo para pintura intumescente
  function getDFTMin(rfTarget) {
    if (!hpA) return null
    const filas = (protSys?.tabla || [])
      .filter(r => r.rf === rfTarget && r.hpMax >= hpA)
      .sort((a, b) => a.hpMax - b.hpMax)
    return filas.length ? filas[0].dftMin : null
  }

  // Protección requerida para rfReq (sistemas calculables)
  const protReq   = rfReq ? getMinProt(rfReq) : null
  const dftMinReq = rfReq ? getDFTMin(rfReq)  : null

  // Cumplimiento por espesor real ingresado (sistemas calculables)
  const espNum    = parseFloat(espAplicado) || 0
  const cumpleEsp = protReq && espNum > 0 ? espNum >= protReq.total : null

  // Cumplimiento por DFT (pintura intumescente)
  const dftNum       = parseFloat(dftNominal) || 0
  const cumpleDFT    = dftMinReq && dftNum > 0 ? dftNum >= dftMinReq : null
  const tieneETA     = etaRef.trim().length > 0

  const tdStyle  = { ...S.td, verticalAlign:'middle' }

  return (
    <div style={{ ...S.card, marginTop:14, borderColor:'#fbbf24', background:'#fffbeb' }}>
      <p style={{ ...S.h2, color:'#92400e', marginBottom:8 }}>
        🔥 Calculador RF — {tipo || 'Estructura de Acero'}
        {sector && <span style={{ marginLeft:8, fontSize:12, fontWeight:400, color:'#92400e' }}>· {sector}</span>}
      </p>
      <div style={{ fontSize:11, color:'#78350f', marginBottom:12, background:'#fef3c7',
        border:'1px solid #fcd34d', borderRadius:5, padding:'7px 11px', lineHeight:1.5 }}>
        ⚠ {tipo === 'Metalframe (acero liviano)'
          ? <>Los perfiles de acero galvanizado del <b>metalframe</b> pierden resistencia a ~500°C igual que el acero estructural. <b>RF intrínseca: F0</b> — requiere protección ignífuga (DS N°76 / LOFC Ed.17 Annex B).</>
          : <>El acero estructural <b>no tiene resistencia al fuego intrínseca (F0)</b>. Requiere protección ignífuga según <b>LOFC Ed.17 Annex B</b>.</>}
        {rfReq && <span> &nbsp;RF requerida para este proyecto: <b style={{ color:'#dc2626' }}>{rfReq}</b>.</span>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>

        {/* ── Paso 1: Factor de sección ──────────────────────────────────── */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:6, padding:'10px 12px' }}>
          <div style={{ fontWeight:700, fontSize:12, color:'#374151', marginBottom:8 }}>
            📐 Paso 1 — Factor de sección (Hp/A)
          </div>

          {/* Toggle manual / tabla */}
          <div style={{ display:'flex', gap:6, marginBottom:8 }}>
            {[['tabla','Perfil tabla'],['manual','Manual']].map(([v,lbl]) => (
              <button key={v} onClick={() => setModoManual(v==='manual')}
                style={{ flex:1, padding:'4px 6px', fontSize:11, borderRadius:4, cursor:'pointer',
                  background: (modoManual===(v==='manual')) ? '#f59e0b' : '#f1f5f9',
                  color:      (modoManual===(v==='manual')) ? '#fff'    : '#374151',
                  border:`1px solid ${(modoManual===(v==='manual')) ? '#f59e0b' : '#e2e8f0'}`,
                  fontWeight: (modoManual===(v==='manual')) ? 700 : 400 }}>
                {lbl}
              </button>
            ))}
          </div>

          {!modoManual ? (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6 }}>
                <div>
                  <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>Familia</label>
                  <select style={ist} value={familia} onChange={e => {
                    const f = e.target.value
                    setFamilia(f)
                    setSerie(Object.keys(PERFILES_ACERO[f] || {})[0] || '')
                  }}>
                    {Object.keys(PERFILES_ACERO).map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>Serie</label>
                  <select style={ist} value={serie} onChange={e => setSerie(e.target.value)}>
                    {Object.keys(PERFILES_ACERO[familia] || {}).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:6 }}>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>Exposición al fuego</label>
                <select style={ist} value={caras} onChange={e => setCaras(e.target.value)}>
                  <option value="3">3 caras — viga (cara inferior sobre losa)</option>
                  <option value="4">4 caras — columna (exposición total)</option>
                </select>
              </div>
              {perfData && (
                <div style={{ background:'#f8fafc', borderRadius:4, padding:'5px 8px', fontSize:10, color:'#64748b' }}>
                  A = <b>{perfData.A} cm²</b> &nbsp;·&nbsp;
                  Hp/A 4c = <b>{perfData.Hp4} m⁻¹</b> &nbsp;·&nbsp;
                  Hp/A 3c = <b>{perfData.Hp3} m⁻¹</b>
                </div>
              )}
            </>
          ) : (
            <div>
              <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>
                Hp/A manual (m⁻¹)
              </label>
              <input type="number" style={{ ...ist, maxWidth:120 }} value={hpManual}
                onChange={e => setHpManual(e.target.value)} placeholder="ej: 250" min="1" />
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>
                Hp = perímetro expuesto (m) · A = área sección (m²)
              </div>
            </div>
          )}

          {hpA && (
            <div style={{ marginTop:8, background:'#fef9c3', border:'1px solid #fde68a',
              borderRadius:4, padding:'6px 10px', textAlign:'center' }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#78350f' }}>Hp/A = {hpA} m⁻¹</span>
              <div style={{ fontSize:10, color:'#92400e', marginTop:2 }}>
                {hpA <= 80  ? 'Sección robusta / maciza — favorable'
               : hpA <= 160 ? 'Factor bajo a medio'
               : hpA <= 250 ? 'Factor medio — protección estándar'
               : hpA <= 350 ? 'Factor alto — mayor espesor requerido'
               : '⚠ Factor muy alto — consultar fabricante'}
              </div>
            </div>
          )}
        </div>

        {/* ── Temperatura crítica (EN 1993-1-2) ─────────────────────────── */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:6, padding:'10px 12px' }}>
          <div style={{ fontWeight:700, fontSize:12, color:'#374151', marginBottom:8 }}>
            🌡️ Temperatura crítica (EN 1993-1-2 §4.2.4)
          </div>
          <div style={{ fontSize:11, color:'#64748b', marginBottom:6, lineHeight:1.6 }}>
            θ<sub>cr</sub> = 39,19 · ln[1/(0,9674 · μ₀<sup>3,833</sup>) − 1] + 482
          </div>
          <div style={{ marginBottom:8 }}>
            <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>
              Grado de utilización μ₀
            </label>
            <input type="number" style={{ ...ist, maxWidth:110 }} value={mu0}
              onChange={e => setMu0(e.target.value)}
              step="0.05" min="0.05" max="0.95" />
            <div style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>
              μ₀ = E<sub>fi,d</sub> / R<sub>fi,d,0</sub> — relación carga incendio / resistencia a T° ambiente.
              Valor conservador: 0,65.
            </div>
          </div>
          {thetaCr && (
            <div style={{ background: thetaCr >= 520 ? '#f0fdf4' : thetaCr >= 470 ? '#fffbeb' : '#fff1f2',
              border:`1px solid ${thetaCr>=520?'#86efac':thetaCr>=470?'#fcd34d':'#fecaca'}`,
              borderRadius:4, padding:'8px 10px', textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:700,
                color: thetaCr>=520?'#166534':thetaCr>=470?'#78350f':'#9f1239' }}>
                θ<sub>cr</sub> = {thetaCr.toFixed(0)} °C
              </div>
              <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>
                {thetaCr >= 550 ? 'Baja utilización — sección favorable'
               : thetaCr >= 520 ? 'Temperatura crítica adecuada'
               : thetaCr >= 470 ? 'Moderada — verificar protección mínima'
               : 'Alta utilización — considerar reducir carga o aumentar protección'}
              </div>
            </div>
          )}
          <div style={{ marginTop:8, fontSize:10, color:'#94a3b8', lineHeight:1.5 }}>
            El acero pierde ~50% de su resistencia a <b>500 °C</b> y colapsa entre 600–700 °C.
            La protección debe mantener T° acero &lt; θ<sub>cr</sub> durante el período RF requerido.
          </div>
        </div>
      </div>

      {/* ── Paso 2: Sistema de protección + tabla resultados ──────────────── */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:6, padding:'10px 12px' }}>
        <div style={{ fontWeight:700, fontSize:12, color:'#374151', marginBottom:8 }}>
          🛡️ Paso 2 — Sistema de protección ignífuga
        </div>

        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>
            Sistema de protección
          </label>
          <select style={{ ...ist, maxWidth:420 }} value={prot} onChange={e => setProt(e.target.value)}>
            {ACERO_PROT.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          {protSys?.norma && (
            <span style={{ marginLeft:8, fontSize:10, color:'#94a3b8' }}>
              Ref.: {protSys.norma}
            </span>
          )}
          {protSys?.desc && (
            <div style={{ fontSize:10, color:'#64748b', marginTop:3, lineHeight:1.4 }}>{protSys.desc}</div>
          )}
        </div>

        {protSys?.requiereCertificado ? (
          // ── Pintura intumescente — flujo de acreditación por DFT ──────────
          <>
            {/* Tabla orientativa DFT */}
            {!hpA && (
              <div style={{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:5,
                padding:'6px 10px', fontSize:11, color:'#0e6560', marginBottom:8 }}>
                ℹ Ingresa el factor de sección (Paso 1) para ver los DFT orientativos.
              </div>
            )}
            {hpA && (
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:5 }}>
                  DFT mínimo orientativo para Hp/A = {hpA} m⁻¹ (EN 13381-8, rangos típicos WB)
                </div>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>RF objetivo</th>
                    <th style={S.th}>DFT mín. orientativo (µm)</th>
                    <th style={S.th}>Nota</th>
                  </tr></thead>
                  <tbody>
                    {rfLevels.map(rf => {
                      const dmin = getDFTMin(rf)
                      const esReq = rf === rfReq
                      return (
                        <tr key={rf} style={{ background: esReq ? '#fef9c3' : undefined }}>
                          <td style={{ ...tdStyle, fontWeight: esReq?700:400, color: esReq?'#78350f':undefined }}>
                            {rf}{esReq && <span style={{ fontSize:10, marginLeft:4, color:'#dc2626' }}>← requerido</span>}
                          </td>
                          <td style={tdStyle}>
                            {dmin
                              ? <b style={{ color: esReq?'#78350f':'#374151' }}>≥ {dmin.toLocaleString()} µm</b>
                              : <span style={{ color:'#94a3b8' }}>Hp/A fuera de rango — consultar fabricante</span>}
                          </td>
                          <td style={{ ...tdStyle, fontSize:10, color:'#94a3b8' }}>
                            Rango típico · valor exacto según ETA fabricante
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Formulario de acreditación */}
            <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:7,
              padding:'12px 14px', marginTop:8 }}>
              <div style={{ fontWeight:700, fontSize:12, color:'#166534', marginBottom:8 }}>
                ✅ Acreditar cumplimiento — Pintura intumescente
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
                <div>
                  <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>
                    DFT nominal certificado (µm)
                  </label>
                  <input type="number" style={{ ...ist, width:'100%' }}
                    value={dftNominal} onChange={e => setDftNominal(e.target.value)}
                    placeholder={`ej: ${dftMinReq || 800}`} min="0" />
                  {dftMinReq && dftNum > 0 && (
                    <div style={{ fontSize:10, marginTop:2,
                      color: cumpleDFT ? '#166534' : '#dc2626', fontWeight:700 }}>
                      {cumpleDFT ? `✓ ${dftNum} ≥ ${dftMinReq} µm` : `✗ ${dftNum} < ${dftMinReq} µm mín.`}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>
                    Fabricante / producto
                  </label>
                  <input type="text" style={{ ...ist, width:'100%' }}
                    value={fabricante} onChange={e => setFabricante(e.target.value)}
                    placeholder="ej: Nullifire S707" />
                </div>
                <div>
                  <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>
                    N° ETA / certificado
                  </label>
                  <input type="text" style={{ ...ist, width:'100%' }}
                    value={etaRef} onChange={e => setEtaRef(e.target.value)}
                    placeholder="ej: ETA-04/0074" />
                </div>
              </div>

              {/* Resultado de cumplimiento */}
              {rfReq && (
                <div style={{ padding:'8px 12px', borderRadius:6, marginTop:4,
                  background: cumpleDFT && tieneETA ? '#dcfce7' : cumpleDFT ? '#fef9c3' : dftNum > 0 ? '#fee2e2' : '#f8fafc',
                  border: `1.5px solid ${cumpleDFT && tieneETA ? '#86efac' : cumpleDFT ? '#fcd34d' : dftNum > 0 ? '#fca5a5' : '#e2e8f0'}` }}>
                  {!dftNum ? (
                    <span style={{ fontSize:11, color:'#94a3b8' }}>
                      Ingresa el DFT nominal del fabricante para determinar cumplimiento de RF {rfReq}.
                    </span>
                  ) : cumpleDFT && tieneETA ? (
                    <div>
                      <span style={{ ...S.badge(true), fontSize:12 }}>✓ CUMPLE — RF {rfReq}</span>
                      <div style={{ fontSize:10, color:'#166534', marginTop:4, lineHeight:1.5 }}>
                        DFT {dftNum} µm ≥ {dftMinReq} µm orientativo · {fabricante && <b>{fabricante}</b>} · ETA: {etaRef}<br/>
                        <b>Documentación requerida:</b> ETA vigente + certificado de aplicación (medición DFT en terreno según NCh1198).
                      </div>
                    </div>
                  ) : cumpleDFT && !tieneETA ? (
                    <div>
                      <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:10, fontSize:12,
                        fontWeight:700, background:'#fef9c3', color:'#713f12' }}>
                        ⚠ CUMPLE CONDICIONAL
                      </span>
                      <div style={{ fontSize:10, color:'#713f12', marginTop:4, lineHeight:1.5 }}>
                        DFT ingresado cumple el rango orientativo, pero falta <b>N° ETA / certificado</b> del fabricante.
                        Agrega la referencia ETA para acreditar cumplimiento.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span style={S.badge(false)}>✗ NO CUMPLE — RF {rfReq}</span>
                      <div style={{ fontSize:10, color:'#991b1b', marginTop:4 }}>
                        DFT {dftNum} µm {'<'} {dftMinReq} µm mínimo orientativo para Hp/A {hpA} m⁻¹.
                        Aumentar DFT o consultar ETA de un producto con mayor rendimiento.
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div style={{ fontSize:10, color:'#64748b', marginTop:6, lineHeight:1.5 }}>
                ⚠ Los DFT orientativos son rangos típicos según EN 13381-8. El valor exacto (DFT nominal)
                debe provenir del software del fabricante para el Hp/A y RF específicos con ETA vigente.
                El inspector DOM puede exigir verificación de DFT en terreno (NCh1198).
              </div>
            </div>
          </>
        ) : (
          // ── Sistemas con espesor calculable ──────────────────────────────
          <>
            {!hpA && (
              <div style={{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:5,
                padding:'6px 10px', fontSize:11, color:'#0e6560', marginBottom:8 }}>
                ℹ Ingresa el factor de sección (Paso 1) para ver los espesores requeridos.
              </div>
            )}
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>RF objetivo</th>
                  <th style={S.th}>Protección mínima ({protSys?.unidad || 'mm'})</th>
                  <th style={S.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rfLevels.map(rf => {
                  const result   = hpA ? getMinProt(rf) : null
                  const esReq    = rf === rfReq
                  const factible = result !== null
                  return (
                    <tr key={rf} style={{ background: esReq ? '#fef9c3' : undefined }}>
                      <td style={{ ...tdStyle, fontWeight: esReq?700:400, color: esReq?'#78350f':undefined }}>
                        {rf}{esReq && <span style={{ fontSize:10, marginLeft:4, color:'#dc2626' }}>← requerido</span>}
                      </td>
                      <td style={tdStyle}>
                        {!hpA ? (
                          <span style={{ fontSize:11, color:'#94a3b8' }}>—</span>
                        ) : result ? (
                          <b style={{ color: esReq?'#78350f':'#374151' }}>{result.text}</b>
                        ) : (
                          <span style={{ fontSize:11, color:'#dc2626' }}>
                            ⚠ Hp/A fuera de rango — consultar fabricante
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {!hpA ? (
                          <span style={{ fontSize:11, color:'#94a3b8' }}>—</span>
                        ) : esReq ? (
                          factible
                            ? <span style={S.badge(true)}>✓ CUMPLE si aplica ≥ {result?.text}</span>
                            : <span style={S.badge(false)}>✗ NO CUMPLE — Hp/A fuera de rango</span>
                        ) : (
                          factible
                            ? <span style={{ fontSize:11, color:'#64748b' }}>Factible</span>
                            : <span style={{ fontSize:11, color:'#dc2626' }}>Fuera de rango</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Formulario de acreditación del espesor real */}
            {rfReq && protReq && hpA && (
              <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:7,
                padding:'12px 14px', marginTop:10 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#166534', marginBottom:8 }}>
                  ✅ Acreditar cumplimiento — espesor de protección a aplicar
                </div>
                <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
                  <div>
                    <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>
                      Espesor de protección a aplicar ({protSys?.unidad || 'mm'})
                    </label>
                    <input type="number" style={{ ...ist, width:110 }}
                      value={espAplicado} onChange={e => setEspAplicado(e.target.value)}
                      placeholder={`≥ ${protReq.total}`} min="0" />
                  </div>
                  <div style={{ flex:1, minWidth:200 }}>
                    {espNum > 0 ? (
                      cumpleEsp ? (
                        <div style={{ padding:'8px 12px', background:'#dcfce7',
                          border:'1.5px solid #86efac', borderRadius:6 }}>
                          <span style={{ ...S.badge(true), fontSize:12 }}>✓ CUMPLE — RF {rfReq}</span>
                          <div style={{ fontSize:10, color:'#166534', marginTop:4, lineHeight:1.5 }}>
                            {espNum} {protSys?.unidad||'mm'} ≥ {protReq.total} {protSys?.unidad||'mm'} mín. · {protSys?.nombre}<br/>
                            <b>Documentación:</b> Adjuntar ficha técnica + DOP del fabricante. {protSys?.norma && `Norma: ${protSys.norma}.`}
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding:'8px 12px', background:'#fee2e2',
                          border:'1.5px solid #fca5a5', borderRadius:6 }}>
                          <span style={S.badge(false)}>✗ NO CUMPLE — RF {rfReq}</span>
                          <div style={{ fontSize:10, color:'#991b1b', marginTop:4 }}>
                            {espNum} {protSys?.unidad||'mm'} {'<'} {protReq.total} {protSys?.unidad||'mm'} mínimo requerido.
                            Aumentar espesor hasta ≥ {protReq.total} {protSys?.unidad||'mm'}.
                          </div>
                        </div>
                      )
                    ) : (
                      <div style={{ padding:'7px 12px', background:'#f0fdfa',
                        border:'1px solid #99f6e4', borderRadius:6, fontSize:11, color:'#0e6560' }}>
                        Espesor mínimo requerido: <b>{protReq.text}</b> de {protSys?.nombre?.toLowerCase()}.
                        Ingresa el espesor que se aplicará para confirmar cumplimiento.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ marginTop:8, fontSize:10, color:'#78350f', background:'#fef9c3',
        borderRadius:4, padding:'6px 9px', lineHeight:1.5 }}>
        <b>⚠ Nota normativa:</b> Los espesores son orientativos según LOFC Ed.17 Annex B y EN 13381.
        Para la memoria de cálculo definitiva, verificar con el fabricante del sistema de protección y
        adjuntar ficha técnica, DOP (Declaración de Prestaciones) y ETA. La RF debe respaldarse con
        ensayo NCh850 o clasificación equivalente. LOFC Ed.17 — Capítulo B.
      </div>
    </div>
  )
}

// ─── CALCULADOR RF ESCALERAS (OGUC Art. 4.5.7) ────────────────────────────────
const MAT_ESCAL = [
  { id:'ha',     label:'Hormigón armado (recub. ≥ 20 mm)',  rfBase:'F120', nota:'NCh430 / LOFC Ed.17 Tabla A4. Recubrimiento mínimo 20 mm garantiza F120.' },
  { id:'ha_pref',label:'HA prefabricado (losa/peldaño)',    rfBase:'F90',  nota:'RF depende del recubrimiento. Con ≥ 20 mm → F90–F120. Verificar ficha fabricante.' },
  { id:'acero',  label:'Estructura metálica sin protección',rfBase:'F0',   nota:'RF intrínseca F0. Requiere protección ignífuga para alcanzar RF exigida.' },
  { id:'acero_p',label:'Acero con protección ignífuga',     rfBase:null,   nota:'RF según sistema de protección aplicado (pintura intumescente, yeso, lana de roca). Ver LOFC Ed.17 Annex B.' },
  { id:'madera', label:'Madera maciza (sección ≥ 90 mm)',   rfBase:'F30',  nota:'LOFC Ed.17. Sección ≥ 90 mm → F30. Secciones menores → F15 o menos. No recomendado en edificios de alta ocupación.' },
  { id:'clt',    label:'CLT / madera en masa (e ≥ 90 mm)',  rfBase:'F60',  nota:'LOFC Ed.17 Tabla A6. CLT con e ≥ 90 mm → aprox. F60 sin protección adicional.' },
  { id:'mamp',   label:'Mampostería de ladrillo/bloque',    rfBase:'F60',  nota:'RF intrínseca ≥ F60 según espesor (e ≥ 110 mm). Ver LOFC Ed.17 Tabla A2.' },
]

function CalcRFEscalera({ proy, letraOGUC, rfReqEscalera, rfReqCaja, matId: matIdProp, setMatId: setMatIdProp, escaleras: escalerasProp, setEscaleras: setEscalerasProp }) {
  // Si recibe matId/setMatId por props (lifted), los usa; si no, state local (retrocompat)
  const [matIdLocal, setMatIdLocal] = useState('ha')
  const matId = matIdProp ?? matIdLocal
  const setMatId = setMatIdProp ?? setMatIdLocal
  const uso = proy.uso || ''
  const pisos = parseInt(proy.pisos) || 0

  const mat = MAT_ESCAL.find(m => m.id === matId)
  // Cálculo de si la caja se exige por OGUC (uso + pisos)
  const necesitaCajaOGUC = requiereCajaEscalera(uso, pisos)
  // Override del usuario: tieneCaja === null → usa OGUC; true/false → override
  const tieneCajaOverride = escalerasProp?.tieneCaja
  const necesitaCaja = tieneCajaOverride === null || tieneCajaOverride === undefined
    ? necesitaCajaOGUC
    : !!tieneCajaOverride
  const matCajaId = escalerasProp?.matCajaId || 'ha'
  const matCaja = MAT_ESCAL.find(m => m.id === matCajaId) || MAT_ESCAL[0]
  const setMatCajaId = (v) => setEscalerasProp?.(prev => ({ ...prev, matCajaId: typeof v === 'function' ? v(prev?.matCajaId) : v }))
  const setTieneCaja = (v) => setEscalerasProp?.(prev => ({ ...prev, tieneCaja: v }))
  const rfBase = mat?.rfBase || null
  const rfBaseN = rfBase ? rfN(rfBase) : 0

  // Cumplimiento escalera propia
  const cumpleEscal = !rfReqEscalera || !rfBase || rfBaseN >= rfN(rfReqEscalera)
  // Caja (mampostería/hormigón generalmente): se asume HA o mampostería con RF ≥ F60
  const matCajaOk = rfBase !== 'F0' && rfBase !== null

  const badgeOk  = { display:'inline-block', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700, background:'#dcfce7', color:'#166534' }
  const badgeNo  = { display:'inline-block', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700, background:'#fee2e2', color:'#991b1b' }
  const badgeWarn= { display:'inline-block', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700, background:'#fef9c3', color:'#713f12' }

  return (
    <div style={{ background:'#fff', border:'1.5px solid #ccfbf1', borderRadius:10, padding:16, marginTop:14 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14,
        background:'linear-gradient(90deg,#0f766e,#0d9488)', color:'#fff',
        borderRadius:7, padding:'8px 14px', margin:'-16px -16px 14px' }}>
        <span style={{ fontSize:20 }}>🚶</span>
        <div>
          <div style={{ fontWeight:800, fontSize:13 }}>Escaleras de evacuación — OGUC Art. 4.5.7</div>
          <div style={{ fontSize:10, opacity:0.85 }}>
            Análisis de RF para escaleras y cajas de escalera · LOFC Ed.17 2025 · NCh850
          </div>
        </div>
      </div>

      {/* Banda normativa */}
      <div style={{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:6,
        padding:'8px 12px', marginBottom:12, fontSize:11, lineHeight:1.6 }}>
        <b style={{ color:'#0f766e' }}>OGUC Art. 4.5.7 — Escaleras de evacuación:</b> Todo edificio con más de un piso debe
        contar con escaleras de evacuación. Las escaleras deben ser construidas con materiales cuya RF
        cumpla lo señalado en la Tabla 1 del Tít. 4 Cap. 3, columna (9). La <b>caja de escalera</b> (recinto
        de protección) se exige según uso y número de pisos, con RF según columna (4) de la misma tabla.
        <br/>
        <b style={{ color:'#0f766e' }}>Referencia de columnas OGUC Tabla 1:</b>{' '}
        Col. (4) → Cajas de escalera, ascensores y ductos &nbsp;·&nbsp; Col. (9) → Escaleras
      </div>

      {/* Resumen de exigencias */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        {/* Escalera propia — Col. 9 */}
        <div style={{ background: rfReqEscalera ? '#fef2f2' : '#f8fafc',
          border:`1.5px solid ${rfReqEscalera ? '#fca5a5' : '#e2e8f0'}`,
          borderRadius:7, padding:'10px 12px' }}>
          <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase',
            letterSpacing:'0.05em', marginBottom:4 }}>Escalera — Col. (9)</div>
          <div style={{ fontSize:18, fontWeight:900, color: rfReqEscalera ? '#dc2626' : '#94a3b8' }}>
            {rfReqEscalera ? `≥ ${rfReqEscalera}` : '—'}
          </div>
          <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>
            {letraOGUC
              ? `Letra ${letraOGUC.toUpperCase()} · OGUC Tabla 1 Col. (9)`
              : 'Ingresa m² y destino para calcular con Tabla 1'}
          </div>
        </div>
        {/* Caja de escalera — Col. 4 */}
        <div style={{ background: necesitaCaja ? '#fff7ed' : '#f0fdf4',
          border:`1.5px solid ${necesitaCaja ? '#fed7aa' : '#86efac'}`,
          borderRadius:7, padding:'10px 12px' }}>
          <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase',
            letterSpacing:'0.05em', marginBottom:4 }}>Caja de escalera — Col. (4)</div>
          <div style={{ fontSize:18, fontWeight:900, color: necesitaCaja ? '#d97706' : '#166534' }}>
            {necesitaCaja ? (rfReqCaja ? `≥ ${rfReqCaja}` : '—') : 'No exigida'}
          </div>
          <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>
            {necesitaCaja
              ? (letraOGUC
                  ? `Letra ${letraOGUC.toUpperCase()} · OGUC Tabla 1 Col. (4)`
                  : 'OGUC Art. 4.5.7 — obligatoria por uso/pisos')
              : `${pisos} piso(s) · uso ${uso || '—'} → no requiere caja cerrada`}
          </div>
        </div>
      </div>

      {/* Condición de caja según uso/pisos */}
      <div style={{ marginBottom:12, fontSize:11, padding:'7px 11px',
        background: necesitaCaja ? '#fffbeb' : '#f0fdf4',
        border:`1px solid ${necesitaCaja ? '#fcd34d' : '#86efac'}`,
        borderRadius:6, color: necesitaCaja ? '#713f12' : '#166534' }}>
        {necesitaCaja ? (
          <>
            ⚠ <b>Caja de escalera cerrada {necesitaCajaOGUC ? 'obligatoria' : 'incluida'}</b> — {pisos} piso(s) · uso {uso} · OGUC Art. 4.5.7.
            La caja debe ser un recinto cerrado, con paredes de RF ≥ {rfReqCaja || '—'} y puertas cortafuego
            según OGUC Art. 4.5.4.
          </>
        ) : (
          <>
            ✓ Para {pisos} piso(s) y uso {uso || '—'}, la <b>caja de escalera cerrada no es exigida</b> por OGUC Art. 4.5.7.
            La escalera debe igualmente cumplir la RF requerida para sus elementos.
          </>
        )}
      </div>

      {/* Toggle opt-in: usuario indica si su proyecto incluye caja aunque OGUC no la exija */}
      {!necesitaCajaOGUC && setEscalerasProp && (
        <div style={{ marginBottom:12, fontSize:11, padding:'8px 12px',
          background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:6,
          display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <input type="checkbox" id="opt-caja" checked={!!tieneCajaOverride}
            onChange={e => setTieneCaja(e.target.checked ? true : null)} />
          <label htmlFor="opt-caja" style={{ cursor:'pointer', color:'#374151', flex:1, minWidth:200 }}>
            <b>Mi proyecto incluye caja de escalera cerrada</b> (recinto de protección con RF exigida) — opcional para 1 piso.
          </label>
        </div>
      )}

      {/* Selector de material de la CAJA — visible cuando necesitaCaja */}
      {necesitaCaja && setEscalerasProp && (
        <div style={{ marginBottom:12, padding:'10px 12px', background:'#fff7ed',
          border:'1px solid #fed7aa', borderRadius:7 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'#9a3412', display:'block', marginBottom:5 }}>
            Material de la CAJA de escalera (muros perimetrales)
          </label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:6 }}>
            {MAT_ESCAL.map(m => (
              <button key={'caja-'+m.id}
                onClick={() => setMatCajaId(m.id)}
                style={{ padding:'5px 11px', borderRadius:6, border:`1.5px solid ${matCajaId===m.id?'#9a3412':'#fed7aa'}`,
                  background: matCajaId===m.id ? '#fef3c7' : '#fff',
                  color: matCajaId===m.id ? '#9a3412' : '#374151',
                  fontWeight: matCajaId===m.id ? 700 : 400, fontSize:11, cursor:'pointer' }}>
                {m.label}
              </button>
            ))}
          </div>
          {matCaja && rfReqCaja && (
            <div style={{ fontSize:11, color:'#9a3412' }}>
              <b>RF caja: {matCaja.rfBase || '—'}</b> · requerido ≥ {rfReqCaja} → {' '}
              {matCaja.rfBase && rfStringToNumber(matCaja.rfBase) >= rfStringToNumber(rfReqCaja)
                ? <span style={badgeOk}>✓ CUMPLE</span>
                : <span style={badgeNo}>✗ NO CUMPLE</span>}
            </div>
          )}
        </div>
      )}

      {/* Selector de material */}
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>
          Material / sistema constructivo de la escalera (peldaños + estructura)
        </label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {MAT_ESCAL.map(m => (
            <button key={m.id}
              onClick={() => setMatId(m.id)}
              style={{ padding:'5px 11px', borderRadius:6, border:`1.5px solid ${matId===m.id?'#0f766e':'#e2e8f0'}`,
                background: matId===m.id ? '#ccfbf1' : '#f8fafc',
                color: matId===m.id ? '#0f766e' : '#374151',
                fontWeight: matId===m.id ? 700 : 400, fontSize:11, cursor:'pointer' }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resultado del material seleccionado */}
      {mat && (
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:7,
          padding:'10px 14px', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:10, color:'#64748b', fontWeight:700, marginBottom:2 }}>RF intrínseca del material</div>
              <div style={{ fontSize:20, fontWeight:900,
                color: mat.rfBase === 'F0' ? '#dc2626' : mat.rfBase === null ? '#d97706' : '#166534' }}>
                {mat.rfBase || '—'}
              </div>
            </div>
            <div style={{ flex:1, minWidth:180 }}>
              <div style={{ fontSize:10, color:'#64748b', fontWeight:700, marginBottom:2 }}>Cumplimiento RF escalera</div>
              {mat.rfBase === null ? (
                <span style={badgeWarn}>Verificar con fabricante</span>
              ) : mat.rfBase === 'F0' ? (
                <span style={badgeNo}>F0 — requiere protección ignífuga</span>
              ) : rfReqEscalera ? (
                cumpleEscal
                  ? <span style={badgeOk}>✓ {mat.rfBase} ≥ {rfReqEscalera} — CUMPLE</span>
                  : <span style={badgeNo}>✗ {mat.rfBase} {'<'} {rfReqEscalera} — NO CUMPLE</span>
              ) : (
                <span style={badgeWarn}>Sin RF requerida calculada</span>
              )}
            </div>
            {necesitaCaja && (
              <div style={{ flex:1, minWidth:180 }}>
                <div style={{ fontSize:10, color:'#64748b', fontWeight:700, marginBottom:2 }}>RF caja de escalera</div>
                <span style={badgeWarn}>⚠ Caja debe construirse con HA o mampostería ≥ RF {rfReqCaja || '—'}</span>
              </div>
            )}
          </div>
          <div style={{ fontSize:10, color:'#64748b', marginTop:8, borderTop:'1px solid #e2e8f0',
            paddingTop:6, lineHeight:1.5 }}>
            <b>Nota técnica:</b> {mat.nota}
          </div>
        </div>
      )}

      {/* Tabla orientativa de RF por tipo de escalera */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:6 }}>
          Tabla orientativa — RF de escaleras por material (LOFC Ed.17 2025)
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:'#f1f5f9' }}>
              <th style={{ padding:'5px 8px', textAlign:'left', borderBottom:'2px solid #e2e8f0', fontWeight:700 }}>Material</th>
              <th style={{ padding:'5px 8px', textAlign:'left', borderBottom:'2px solid #e2e8f0', fontWeight:700 }}>RF intrínseca</th>
              <th style={{ padding:'5px 8px', textAlign:'left', borderBottom:'2px solid #e2e8f0', fontWeight:700 }}>Norma de referencia</th>
              <th style={{ padding:'5px 8px', textAlign:'left', borderBottom:'2px solid #e2e8f0', fontWeight:700 }}>Observación</th>
            </tr>
          </thead>
          <tbody>
            {MAT_ESCAL.map((m, i) => (
              <tr key={m.id} style={{ background: i%2===0 ? '#fff' : '#f8fafc',
                outline: matId===m.id ? '2px solid #0f766e' : 'none' }}>
                <td style={{ padding:'5px 8px', borderBottom:'1px solid #f1f5f9', fontWeight: matId===m.id?700:400 }}>{m.label}</td>
                <td style={{ padding:'5px 8px', borderBottom:'1px solid #f1f5f9',
                  fontWeight:700, color: m.rfBase==='F0'?'#dc2626': m.rfBase===null?'#d97706':'#166534' }}>
                  {m.rfBase || 'Variable'}
                </td>
                <td style={{ padding:'5px 8px', borderBottom:'1px solid #f1f5f9', fontSize:10, color:'#64748b' }}>
                  {m.id==='ha'?'NCh430 / LOFC Ed.17 Tabla A4':
                   m.id==='ha_pref'?'LOFC Ed.17 Tabla A4 / Ficha fabricante':
                   m.id==='acero'||m.id==='acero_p'?'EN 13381-8 / LOFC Ed.17 Annex B':
                   m.id==='madera'||m.id==='clt'?'LOFC Ed.17 Tabla A6 / NCh850':'LOFC Ed.17 Tabla A2'}
                </td>
                <td style={{ padding:'5px 8px', borderBottom:'1px solid #f1f5f9', fontSize:10, color:'#64748b' }}>
                  {m.nota.length > 70 ? m.nota.slice(0,70)+'…' : m.nota}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize:10, color:'#64748b', marginTop:10, padding:'6px 10px',
        background:'#f8fafc', borderRadius:5, lineHeight:1.5 }}>
        ⚠ <b>Importante:</b> La RF certificada de la escalera debe respaldarse con ensayo según NCh850 o
        clasificación equivalente vigente (LOFC Ed.17). El proyectista es responsable de verificar que el
        sistema constructivo cumple la RF exigida y cuenta con la documentación técnica correspondiente.
        Ancho mínimo de escalera: 1.10 m (vivienda) / 1.20 m (otros usos) · OGUC Art. 4.5.7.3.
      </div>
    </div>
  )
}

// ─── PESTAÑA FUEGO ────────────────────────────────────────────────────────────
function TabFuego({ proy, termica, setTermica, notas, setNotas, getLetraOGUC, getRFDeLetra, ogucData, escaleras, setEscaleras }) {
  const uso = proy.uso || 'Vivienda'
  const rfDef = RF_DEF[uso] || {}
  const letraOGUCFn = getLetraOGUC || (() => null)
  const getRFDeLetraFn = getRFDeLetra || (() => null)
  const ogucDataReady = ogucData || {
    OGUC_TABLA1: [],
    OGUC_RF_LETRAS: {},
    OGUC_ELEM_COL: {},
  }
  const set = (id, field, val) => setTermica(t => ({ ...t, [id]: { ...(t[id] || {}), [field]: val } }))

  // ── Lógica de escaleras / cajas de escalera ──────────────────────────────────
  // OGUC Art. 4.5.7: la escalera de evacuación es EXIGIBLE según uso y número de
  // pisos (mismo umbral que la caja): educación/salud/industrial 2+, comercio/
  // oficina 3+, vivienda 4+. Las VIVIENDAS UNIFAMILIARES y las escaleras interiores
  // de una unidad están EXENTAS (excepción OGUC) — antes se exigía a todo proyecto
  // de 2 pisos, imponiendo F60 a la escalera de una casa de 2 pisos. Bajo el umbral
  // queda OPCIONAL: el usuario puede habilitarla si su proyecto la incluye.
  const pisosNum = Number(proy.pisos) || 0
  const escalerasObligatorias = requiereCajaEscalera(uso, pisosNum)
  // El estado vive en App.jsx (lifted) — TabFuego y el Informe lo comparten.
  const incluirEscaleras = !!escaleras?.incluido
  const setIncluirEscaleras = (v) => setEscaleras(prev => ({ ...prev, incluido: typeof v === 'function' ? v(prev?.incluido) : v }))
  // Si pisos sube a 2+, fuerza incluido=true automáticamente.
  useEffect(() => { if (escalerasObligatorias && !incluirEscaleras) setIncluirEscaleras(true) }, [escalerasObligatorias])  // eslint-disable-line react-hooks/exhaustive-deps
  const mostrarEscaleras = escalerasObligatorias || incluirEscaleras

  // ── Auto-sync: cuando el usuario cambia el material en CalcRFEscalera,
  // actualizamos el dropdown 'RF propuesta' de Escaleras y Caja escalera
  // al rfBase del material elegido. Sin esto, queda stale (el dropdown
  // muestra el valor del material previo). Reporte usuario 2026-05-27:
  // material cambiado a HA prefabricado F90 pero dropdown seguía en F30.
  useEffect(() => {
    if (!mostrarEscaleras) return
    const matEsc = MAT_ESCAL.find(m => m.id === (escaleras?.matId || 'ha'))
    if (matEsc?.rfBase && termica?.rf_escaleras?.rf !== matEsc.rfBase) {
      setTermica(t => ({ ...t, rf_escaleras: { ...(t.rf_escaleras || {}), rf: matEsc.rfBase } }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escaleras?.matId, mostrarEscaleras])
  useEffect(() => {
    if (!mostrarEscaleras) return
    const cajaActiva = (escaleras?.tieneCaja === null || escaleras?.tieneCaja === undefined)
      ? requiereCajaEscalera(uso, pisosNum)
      : !!escaleras?.tieneCaja
    if (!cajaActiva) return
    const matCaja = MAT_ESCAL.find(m => m.id === (escaleras?.matCajaId || 'ha'))
    if (matCaja?.rfBase && termica?.rf_cajas_esc?.rf !== matCaja.rfBase) {
      setTermica(t => ({ ...t, rf_cajas_esc: { ...(t.rf_cajas_esc || {}), rf: matCaja.rfBase } }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escaleras?.matCajaId, escaleras?.tieneCaja, mostrarEscaleras])

  const VALID_RF = ['F0','F15','F30','F60','F90','F120','F150','F180']

  // ── Resolución RF según OGUC Tabla 1 cuando hay m² y destino OGUC ──────────
  const destinoOGUC = proy.destinoOGUC || (USO_TO_OGUC[uso]?.length === 1 ? USO_TO_OGUC[uso][0] : '')
  const letraOGUC   = letraOGUCFn(destinoOGUC, proy.superficie, proy.pisos)
  // Si hay letra OGUC, usar Tabla de elementos; si no, fallback a RF_DEF/RF_PISOS
  const rfReqFromOGUC = (elemId) => {
    if (letraOGUC) {
      const col = ogucDataReady.OGUC_ELEM_COL[elemId]
      return col ? (getRFDeLetraFn(letraOGUC, elemId) || null) : null
    }
    return null
  }
  const usaTablaOGUC = !!letraOGUC

  // RF desde soluciones constructivas aplicadas + material seleccionado en
  // CalcRFEscalera (para que la tabla muestre el RF del material elegido).
  const _matEscObj  = MAT_ESCAL.find(m => m.id === (escaleras?.matId || 'ha'))
  const _matCajaObj = MAT_ESCAL.find(m => m.id === (escaleras?.matCajaId || 'ha'))
  const _cajaEnUso  = (escaleras?.tieneCaja === null || escaleras?.tieneCaja === undefined)
    ? requiereCajaEscalera(uso, proy.pisos)
    : !!escaleras?.tieneCaja
  const rfFromSol = {
    estructura: termica.muro?.solucion?.rf || termica.techo?.solucion?.rf || termica.piso?.solucion?.rf || '',
    cubierta:   termica.techo?.solucion?.rf || '',
    muros_sep:  termica.tabique?.solucion?.rf || termica.muro?.solucion?.rf || '',
    cajas_esc:  _cajaEnUso ? (_matCajaObj?.rfBase || '') : '',
    escaleras:  _matEscObj?.rfBase || '',
  }
  // Pseudo-"soluciones" para escaleras y caja: muestran el material elegido
  // como una solución constructiva con su RF intrínseca. Inventamos un cod
  // para que renderice como las soluciones LOSCAT.
  const _solEscalera = _matEscObj && _matEscObj.rfBase
    ? { cod: 'MAT.ESC.' + (_matEscObj.id || '').toUpperCase(), rf: _matEscObj.rfBase, _matEsc: true, _label: _matEscObj.label }
    : null
  const _solCaja = (_cajaEnUso && _matCajaObj && _matCajaObj.rfBase)
    ? { cod: 'MAT.CAJA.' + (_matCajaObj.id || '').toUpperCase(), rf: _matCajaObj.rfBase, _matEsc: true, _label: _matCajaObj.label }
    : null
  const solForElem = {
    estructura: [termica.muro?.solucion, termica.techo?.solucion, termica.piso?.solucion].filter(Boolean)[0],
    cubierta:   termica.techo?.solucion,
    muros_sep:  termica.tabique?.solucion || termica.muro?.solucion,
    escaleras:  _solEscalera,
    cajas_esc:  _solCaja,
  }

  const elems = [
    { id:'estructura', label:'Estructura principal',
      rfReq: rfReqFromOGUC('estructura') || (proy.pisos ? RF_PISOS(uso, proy.pisos) : rfDef.estructura),
      obs: usaTablaOGUC ? `OGUC Tít. 4 Cap. 3 Tabla 1 — Letra ${letraOGUC} · Col. (2) soporte de cargas sobre terreno` : 'RF según uso y pisos. LOFC Ed.17 A.1–A.4. Ingresa superficie m² para aplicar Tabla 1 OGUC.' },
    { id:'muros_sep',  label:'Muros de separación entre propietarios / destinos',
      rfReq: rfReqFromOGUC('muros_sep') || rfDef.muros_sep,
      obs: usaTablaOGUC ? `OGUC Tít. 4 Cap. 3 Tabla 1 — Letra ${letraOGUC} · Col. (3) muros entre distintos propietarios o destinos` : 'OGUC Art. 4.5.4. Ingresa superficie m² para aplicar Tabla 1 OGUC.' },
    // Cajas de escalera y Escaleras: sólo aparecen en la tabla cuando corresponde
    // (edificación ≥ 2 pisos, o 1 piso con habilitación manual del usuario).
    ...(mostrarEscaleras ? [
      // Caja de escalera: si OGUC no la exige Y el usuario no la activó manualmente,
      // se marca noAplica=true para que el render muestre "— no aplica" en vez del
      // valor teórico OGUC (que confundía: sugería un requisito que no aplica).
      // Si el usuario marca el checkbox "Mi proyecto incluye caja…" → noAplica=false
      // y se evalúa cumplimiento contra el material elegido.
      { id:'cajas_esc',  label:'Cajas de escalera / ascensores / ductos',
        rfReq: rfReqFromOGUC('cajas_esc'),
        noAplica: !_cajaEnUso,
        obs: usaTablaOGUC ? `OGUC Tít. 4 Cap. 3 Tabla 1 — Letra ${letraOGUC} · Col. (4) cajas de escalera` : _cajaEnUso ? 'OGUC Art. 4.5.7 — caja de escalera exigida según uso y pisos.' : 'OGUC Art. 4.5.7 — caja de escalera no exigida para este uso/pisos.' },
      { id:'escaleras',  label:'Escaleras / Vías de escape',
        rfReq: rfReqFromOGUC('escaleras') || rfDef.escaleras,
        obs: usaTablaOGUC ? `OGUC Tít. 4 Cap. 3 Tabla 1 — Letra ${letraOGUC} · Col. (9) escaleras` : 'OGUC Art. 4.5.7. Verificar ensayo NCh850 específico.' },
    ] : []),
    { id:'cubierta',   label:'Cubierta',
      rfReq: rfReqFromOGUC('cubierta') || rfDef.cubierta,
      obs: usaTablaOGUC ? `OGUC Tít. 4 Cap. 3 Tabla 1 — Letra ${letraOGUC} · Col. (7) cubierta` : 'OGUC Art. 4.5.5.' },
  ]

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Resistencia al Fuego"
        pasos={[
          'El <b>uso del edificio</b> determina la <b>Categoría de riesgo de incendio</b> según <b>OGUC Tít. 4 Cap. 3</b> (R1–R4). Esta categoría se muestra en el banner superior.',
          'Las columnas <b>RF mínima</b> se calculan automáticamente según OGUC Art. 4.5.4 y la función RF_PISOS(uso, pisos).',
          'La columna <b>Solución SC</b> muestra el RF de la solución LOSCAT aplicada si corresponde al elemento. Para <b>escaleras y cajas de escalera</b>, muestra el material elegido más abajo en el calculador específico.',
          'Ingresa la <b>RF propuesta</b> manualmente si difiere de la solución o si el elemento no tiene solución aplicada.',
          '<b>Escaleras de evacuación (Art. 4.5.7):</b> obligatorias para edificios ≥ 2 pisos. Para 1 piso, puedes activarlas opcionalmente con el botón <b>"+ Incluir escaleras"</b> si tu proyecto las tiene (acceso a entretecho, rampas escalonadas, etc.).',
          '<b>Caja de escalera (recinto cerrado de protección):</b> se exige según uso y nº de pisos (OGUC Art. 4.5.7). Si no la exige OGUC pero tu proyecto la incluye, marca el checkbox <b>"Mi proyecto incluye caja de escalera cerrada"</b> y elige el material — el sistema valida RF de la caja además de la escalera.',
          'Cada material elegido en el calculador de escalera (HA, mampostería, CLT, etc.) se refleja como una <b>"solución constructiva"</b> en la tabla principal con su RF intrínseca y estado CUMPLE/NO CUMPLE.',
          'La RF intrínseca del sistema estructural se muestra a continuación de la tabla como referencia.',
        ]}
        normativa="OGUC Tít. 4 Cap. 3 (Categoría de riesgo) · Art. 4.5.4 y 4.5.7 · LOFC Ed.17 2025 · NCh430 · NCh850"
      />
      <div style={S.card}>
        <p style={S.h2}>Resistencia al fuego — {uso || 'sin uso definido'}</p>

        {/* ── Categoría OGUC Tít. 4 Cap. 3 ─────────────────────────────── */}
        {uso && CATEG_FUEGO[uso] && (() => {
          const cf = CATEG_FUEGO[uso]
          return (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12,
              background: cf.bgColor, border:`1px solid ${cf.borderColor}`, borderRadius:6, padding:'8px 12px' }}>
              <div style={{ fontWeight:900, fontSize:16, color: cf.color,
                background:'#fff', border:`2px solid ${cf.borderColor}`,
                borderRadius:6, padding:'3px 12px', letterSpacing:'0.04em', flexShrink:0 }}>
                {cf.cat}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:12, color:'#374151' }}>
                  {cf.desc} — <span style={{ color:'#374151' }}>{cf.grupo}</span>
                </div>
                <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>
                  Clasificación del destino <b>{uso}</b> según <b>OGUC Tít. 4 Cap. 3</b>.
                  Determina las exigencias de RF, compartimentación y evacuación aplicables a este proyecto.
                  Riesgo de incendio: {RIESGO_INC[uso] || '—'}.
                </div>
              </div>
            </div>
          )
        })()}

        {!uso && <div style={S.warn}>Selecciona uso en Diagnóstico.</div>}
        {uso && !proy.pisos && (
          <div style={{ ...S.warn, marginBottom:8 }}>
            ⚠ <b>Número de pisos no definido</b> — completa en Diagnóstico para calcular la RF exacta.
          </div>
        )}

        {/* ── Selector destino OGUC + superficie + indicador de fuente ────── */}
        {uso && (
          <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6,
            padding:'10px 14px', marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:11, color:'#374151', marginBottom:8 }}>
              📐 OGUC Tít. 4 Cap. 3 — Tabla 1: datos para determinar la letra (a/b/c/d)
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end' }}>
              {/* Superficie edificada */}
              <div>
                <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>
                  Superficie edificada total (m²)
                </label>
                <input type="number" style={{ ...ist, width:110 }}
                  value={proy.superficie || ''}
                  onChange={() => {}}
                  placeholder="ej: 320"
                  readOnly
                  title="Ingresa la superficie en la pestaña Diagnóstico"
                />
                {!proy.superficie && (
                  <div style={{ fontSize:10, color:'#d97706', marginTop:2 }}>
                    → Ingresa en pestaña Diagnóstico
                  </div>
                )}
              </div>
              {/* Destino OGUC */}
              {USO_TO_OGUC[uso]?.length > 1 && (
                <div>
                  <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:2 }}>
                    Destino OGUC (Tabla 1)
                  </label>
                  <select style={{ ...ist, minWidth:260 }}
                    value={proy.destinoOGUC || ''}
                    onChange={() => {}}>
                    <option value="">— seleccionar —</option>
                    {USO_TO_OGUC[uso].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {!proy.destinoOGUC && (
                    <div style={{ fontSize:10, color:'#d97706', marginTop:2 }}>
                      → Selecciona destino en pestaña Diagnóstico
                    </div>
                  )}
                </div>
              )}
              {/* Letra resultante */}
              <div style={{ flex:'0 0 auto' }}>
                {letraOGUC ? (
                  <div style={{ background:'#0e6560', color:'#fff', borderRadius:8,
                    padding:'6px 16px', textAlign:'center', fontWeight:900, fontSize:20,
                    letterSpacing:'0.05em', lineHeight:1 }}>
                    {letraOGUC.toUpperCase()}
                    <div style={{ fontSize:10, fontWeight:400, opacity:0.85, marginTop:2 }}>
                      Letra OGUC
                    </div>
                  </div>
                ) : (
                  <div style={{ background:'#f1f5f9', color:'#94a3b8', borderRadius:8,
                    padding:'6px 16px', textAlign:'center', fontWeight:700, fontSize:13,
                    border:'1px dashed #cbd5e1', lineHeight:1.4 }}>
                    ?
                    <div style={{ fontSize:10, marginTop:2 }}>Sin datos m²</div>
                  </div>
                )}
              </div>
              {/* Fuente */}
              <div style={{ flex:'1 1 200px', fontSize:10, color:'#64748b', lineHeight:1.5 }}>
                {letraOGUC ? (
                  <div style={{ background:'#dcfce7', border:'1px solid #86efac',
                    borderRadius:4, padding:'4px 8px', color:'#166534' }}>
                    ✓ <b>RF desde OGUC Tabla 1</b> — {destinoOGUC} ·
                    superficie {proy.superficie} m² · {proy.pisos} piso(s)
                    → <b>Letra {letraOGUC.toUpperCase()}</b>
                  </div>
                ) : USO_TO_OGUC[uso]?.length === 0 ? (
                  <div style={{ background:'#fffbeb', border:'1px solid #fcd34d',
                    borderRadius:4, padding:'4px 8px', color:'#78350f' }}>
                    ⚠ Destino <b>{uso}</b> se rige por <b>Tabla 2 OGUC</b> (máximo de ocupantes).
                    RF mostrada es aproximación basada en RF_DEF — ingresa datos de ocupantes para exactitud.
                  </div>
                ) : (
                  <div style={{ background:'#fffbeb', border:'1px solid #fcd34d',
                    borderRadius:4, padding:'4px 8px', color:'#78350f' }}>
                    ⚠ <b>RF aproximada</b> (RF_DEF fallback) — ingresa superficie edificada
                    para usar la Tabla 1 OGUC Tít. 4 Cap. 3 y obtener la letra (a/b/c/d) exacta.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Elemento</th>
            <th style={S.th}>Solución SC (RF certif.)</th>
            <th style={S.th}>RF propuesta</th>
            <th style={S.th}>RF mínima requerida</th>
            <th style={S.th}>Estado</th>
          </tr></thead>
          <tbody>
            {elems.map(({ id, label, rfReq, obs, noAplica }) => {
              const rfManual = termica['rf_' + id]?.rf || ''
              const rfSol = rfFromSol[id] || ''
              const rfP = rfManual || rfSol
              // Si el elemento no aplica para este proyecto (ej. caja de
              // escalera en 1 piso vivienda), no se evalúa cumplimiento.
              const cumple = noAplica || !rfReq || !rfP || rfN(rfP) >= rfN(rfReq)
              const sol = solForElem[id]
              const rfInvalid = rfManual && !VALID_RF.includes(rfManual)
              return (
                <tr key={id}>
                  <td style={S.td}>
                    <b>{label}</b>
                    <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{obs}</div>
                  </td>
                  <td style={S.td}>
                    {sol ? (
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                          {/* Materiales de escalera/caja: render simplificado con label completo */}
                          {sol._matEsc ? (
                            <>
                              <span style={{ fontSize:10, background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:4, padding:'1px 6px', color:'#9a3412', fontWeight:700 }} title="Material elegido en el calculador de escalera">{sol._label}</span>
                              <span style={{ fontSize:11, fontWeight:700 }}>{rfSol || '—'}</span>
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize:10, background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:4, padding:'1px 6px', color:'#0e6560', fontWeight:700 }} title="Código LOSCAT — térmico">{sol.cod}</span>
                              <span style={{ fontSize:11, fontWeight:700 }}>{rfSol || '—'}</span>
                            </>
                          )}
                        </div>
                        {/* Homologación LOFC para fuego — skip para materiales de escalera */}
                        {!sol._matEsc && (() => {
                          try {
                            const homol = homologarSolucion(sol, { rfRequerido: rfReq })
                            if (homol?.fuego?.codigo_base) {
                              const intrinseco = homol.fuego.intrinseco
                              return (
                                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
                                  <span style={{ fontSize:9, color:'#dc2626', fontWeight:700 }} title="Código LOFC — fuego">🔥</span>
                                  <span style={{ fontSize:9, background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:3, padding:'1px 5px', color:'#991b1b', fontWeight:700, fontFamily:'monospace' }} title={homol.fuego.descripcion || ''}>
                                    LOFC {homol.fuego.codigo_base}
                                  </span>
                                  {intrinseco && (
                                    <span style={{ fontSize:8, color:'#166534', fontWeight:600 }}>✓int</span>
                                  )}
                                </div>
                              )
                            }
                          } catch (e) { /* silent */ }
                          return null
                        })()}
                      </div>
                    ) : (
                      <span style={{ fontSize:11, color:'#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td style={S.td}>
                    <select style={{ ...ist, width:85 }} value={rfManual}
                      onChange={e=>set('rf_'+id,'rf',e.target.value)}>
                      <option value="">—</option>
                      {VALID_RF.map(f=><option key={f}>{f}</option>)}
                    </select>
                    {rfInvalid && <div style={{ fontSize:10, color:'#dc2626' }}>⚠ valor fuera de norma</div>}
                    {!rfManual && rfSol && <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>↑ {rfSol} (solución)</div>}
                  </td>
                  <td style={{ ...S.td, color: noAplica?'#94a3b8':(rfReq?'#dc2626':'#94a3b8'), fontWeight: (rfReq && !noAplica)?700:'normal' }}>
                    {noAplica
                      ? <span title={`Valor OGUC teórico (≥ ${rfReq || '—'}) — no se exige para este uso/pisos`}>— no aplica</span>
                      : (rfReq ? `≥ ${rfReq}` : '—')}
                  </td>
                  <td style={S.td}>
                    {noAplica
                      ? <span style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>No exigida</span>
                      : (rfP && rfReq
                        ? <span style={S.badge(cumple)}>{cumple?'CUMPLE':'NO CUMPLE'}</span>
                        : <span style={{ fontSize:11, color:'#94a3b8' }}>—</span>)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* ── RF intrínseca del sistema ───────────────────────────────────── */}
        {proy.estructura && (
          <div style={{ marginTop:10, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'8px 12px', fontSize:11 }}>
            <b>Sistema estructural — {proy.estructura}:</b> RF base ≈ {RF_EST[proy.estructura]||'—'} ·{' '}
            <span style={{ color:'#64748b' }}>{OBS_EST[proy.estructura]||''}</span>
          </div>
        )}
        <div style={{ ...S.warn, marginTop:8 }}>
          <b>Riesgo de incendio:</b> {RIESGO_INC[uso] || '—'}
        </div>
      </div>

      {/* ── Sugerencias cuando no cumple ───────────────────────────────── */}
      {elems.filter(e => {
        const rp = termica['rf_' + e.id]?.rf || rfFromSol[e.id] || ''
        return e.rfReq && rp && rfN(rp) < rfN(e.rfReq)
      }).map(e => {
        const elemSC = { estructura:'muro', muros_sep:'muro', cajas_esc:null, escaleras:null, cubierta:'techumbre' }[e.id]
        const alts = elemSC ? SC.filter(s => s.elem===elemSC && (s.usos || []).includes(uso||'Vivienda') && s.rf && rfN(s.rf) >= rfN(e.rfReq)).sort((a,b)=>rfN(b.rf)-rfN(a.rf)).slice(0,4) : []
        return (
          <div key={e.id} style={{ ...S.card, borderColor:'#fca5a5', background:'#fff5f5' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#dc2626', marginBottom:6 }}>
              ❌ {e.label}: RF propuesta ({termica['rf_'+e.id]?.rf||rfFromSol[e.id]||'—'}) insuficiente — se requiere ≥ {e.rfReq}
            </div>
            {alts.length > 0 ? (
              <>
                <div style={{ fontSize:11, color:'#374151', marginBottom:6 }}>Soluciones LOSCAT con RF ≥ {e.rfReq}:</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {alts.map(s => (
                    <div key={s.cod} style={{ background:'#fff', border:'1px solid #fca5a5', borderRadius:6, padding:'6px 10px', flex:1, minWidth:180 }}>
                      <div style={{ fontWeight:700, fontSize:11, color:'#dc2626' }}>{s.cod} · RF {s.rf}</div>
                      <div style={{ fontSize:11 }}>{s.desc}</div>
                      <div style={{ fontSize:10, color:'#64748b' }}>U={s.u} W/m²K</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize:11, color:'#64748b' }}>
                {e.id==='escaleras'
                  ? 'Las escaleras requieren ensayo NCh850 específico. Consulta LOFC Ed.17 Capítulo B según material (HA, acero, madera).'
                  : 'Consulta LOFC Ed.17 tabla A para el elemento/material específico. RF depende del ensayo NCh850.'}
              </div>
            )}
            <div style={{ fontSize:10, color:'#64748b', marginTop:6 }}>
              Normativa: LOFC Ed.17 2025 · OGUC Art. 4.5.4 · {OBS_EST[proy.estructura]||'Verificar con tabla LOFC según material y espesor.'}
            </div>
          </div>
        )
      })}
      {/* ── Toggle escaleras opcional (sólo para edificaciones de 1 piso) ─── */}
      {!escalerasObligatorias && (
        <div style={{ ...S.card, background: incluirEscaleras ? '#ecfdf5' : '#f8fafc',
          borderColor: incluirEscaleras ? '#86efac' : '#e2e8f0',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div style={{ fontSize:12, color:'#374151', flex:1, minWidth:260 }}>
            <b>Escaleras / vías de evacuación (opcional)</b><br/>
            <span style={{ color:'#64748b' }}>
              Tu proyecto es de <b>{pisosNum || 1} piso</b>. La OGUC Art. 4.5.7 exige escaleras de
              evacuación sólo para <b>≥ 2 pisos</b>. Si tu proyecto igualmente contempla escaleras
              (p.ej. acceso a entretecho, rampas con tramos escalonados), puedes incluir el cálculo
              en el informe.
            </span>
          </div>
          <button
            onClick={() => setIncluirEscaleras(v => !v)}
            style={{ background: incluirEscaleras ? '#dc2626' : '#166534', color:'#fff',
              border:'none', borderRadius:6, padding:'8px 14px', fontSize:12, fontWeight:700,
              cursor:'pointer', whiteSpace:'nowrap' }}>
            {incluirEscaleras ? '− Quitar escaleras del informe' : '+ Incluir escaleras (opcional)'}
          </button>
        </div>
      )}

      {/* ── Calculador RF Escaleras — OGUC Art. 4.5.7 ────────────────────── */}
      {uso && proy.pisos && mostrarEscaleras && (
        <CalcRFEscalera
          proy={proy}
          letraOGUC={letraOGUC}
          rfReqEscalera={rfReqFromOGUC('escaleras') || rfDef.escaleras || null}
          rfReqCaja={rfReqFromOGUC('cajas_esc') || null}
          matId={escaleras?.matId || 'ha'}
          setMatId={(v) => setEscaleras(prev => ({ ...prev, matId: typeof v === 'function' ? v(prev?.matId) : v }))}
          escaleras={escaleras}
          setEscaleras={setEscaleras}
        />
      )}

      {/* ── Calculador RF Acero/Metalframe — uno por cada sistema que lo requiera ── */}
      {(() => {
        const tiposConRF0 = ['Estructura de acero', 'Metalframe (acero liviano)']
        const rfReq = proy.pisos ? RF_PISOS(uso, proy.pisos) : rfDef.estructura
        const sistemas = (proy.estructuras || []).filter(e => tiposConRF0.includes(e.tipo))
        // Si no hay estructuras[] pero proy.estructura coincide (retrocompat)
        const fallback = sistemas.length === 0 && tiposConRF0.some(t => proy.estructura?.includes(t))
        if (sistemas.length === 0 && !fallback) return null
        return (
          <>
            {sistemas.length > 0
              ? sistemas.map(s => (
                  <CalcRFAcero key={s.id} rfReq={rfReq} tipo={s.tipo} sector={s.sector} />
                ))
              : <CalcRFAcero rfReq={rfReq} tipo={proy.estructura} sector="" />
            }
          </>
        )
      })()}

      <NotasPanel tabKey="fuego" notas={notas} setNotas={setNotas} />
    </div>
  )
}

// ─── PESTAÑA ACÚSTICA ─────────────────────────────────────────────────────────
function TabAcustica({ proy, termica, setTermica, notas, setNotas }) {
  const uso = proy.uso || 'Vivienda'
  const acDef = AC_DEF[uso] || {}
  const acImpact = AC_IMPACT_DEF[uso] || {}
  const set = (id, field, val) => setTermica(t => ({ ...t, [id]: { ...(t[id] || {}), [field]: val } }))

  const acElems = [
    {
      id: 'entre_unidades',
      label: 'Entre unidades habitacionales',
      req: acDef.entre_unidades,
      desc: 'Aislación entre unidades adyacentes (horizontal). Incluye muros, tabiques, puertas de acceso y ductos compartidos. Mayor Rw = mejor aislación.',
    },
    {
      id: 'fachada',
      label: 'Fachada exterior',
      req: acDef.fachada,
      desc: 'Aislación frente a ruido externo (tráfico, viento). Incluye muro, ventana y puerta exterior. El Rw de ventana puede ser determinante — verificar en pestaña Ventana.',
    },
    {
      id: 'entre_pisos',
      label: 'Entre pisos — ruido aéreo',
      req: acDef.entre_pisos,
      desc: 'Aislación aérea vertical (voces, música). Incluye losa, piso flotante y cielo. Mayor Rw = mejor aislación.',
    },
  ]

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Aislamiento Acústico"
        pasos={[
          'Define primero el <b>uso</b> en Diagnóstico: determina los requisitos mínimos de Rw (NCh352:2013).',
          '<b>Entre unidades:</b> aislación horizontal entre departamentos/oficinas contiguas — muros y tabiques.',
          '<b>Fachada:</b> aislación frente a ruido exterior (tráfico, actividad urbana) — incluye ventana y puerta exterior.',
          '<b>Entre pisos ruido aéreo (Rw):</b> aislación vertical de sonido aéreo — losa y terminaciones.',
          '<b>Entre pisos ruido de impacto (L\'n,w):</b> nivel de impacto normalizado — pasos, caída de objetos. <b>MENOR valor = MEJOR aislación</b>.',
          'Ingresa valores medidos o certificados (ensayo NCh352). Tolerancia de medición: ±2 dB típico.',
          'Los valores Rw de soluciones LOSCAT se pre-rellenan automáticamente al aplicar soluciones.',
        ]}
        normativa="OGUC Art. 4.1.6 · NCh352:2013 · NCh353 · ISO 15712 · DS N°594"
      />

      {/* ── Soluciones aplicadas (Rw) ────────────────────────────────────── */}
      {(() => {
        const elemConstrAc = [
          { id:'muro',    label:'Muro / Fachada',       req: acDef.entre_unidades },
          { id:'techo',   label:'Cubierta / Techumbre', req: acDef.entre_pisos },
          { id:'piso',    label:'Piso / Losa',          req: acDef.entre_pisos },
          { id:'tabique', label:'Tabique separación',   req: acDef.entre_unidades },
        ]
        const conSolucion = elemConstrAc.filter(e => termica[e.id]?.solucion)
        if (!conSolucion.length) return null
        return (
          <div style={S.card}>
            <p style={S.h3}>Soluciones constructivas aplicadas — verificación Rw</p>
            {elemConstrAc.map(({ id, label, req }) => {
              const sol = termica[id]?.solucion
              if (!sol) return null
              const rwSol = sol.ac_rw ?? null
              const cumple = !req || rwSol == null || rwSol >= req
              const sinRw = rwSol == null
              // Homologación LOSCAA para acústica
              let codigoLOSCAA = null
              let loscaaIntrinseco = false
              try {
                const homol = homologarSolucion(sol, { rwRequerido: req })
                if (homol?.acustico?.codigo_base) {
                  codigoLOSCAA = homol.acustico.codigo_base
                  loscaaIntrinseco = homol.acustico.intrinseco
                }
              } catch (e) { /* silent */ }

              return (
                <div key={id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', marginBottom:5,
                  background: sinRw?'#fafafa':cumple?'#f0fdf4':'#fff5f5',
                  border:`1px solid ${sinRw?'#e2e8f0':cumple?'#86efac':'#fca5a5'}`, borderRadius:6, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
                    <span style={{ fontSize:10, background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:4, padding:'1px 6px', color:'#0e6560', fontWeight:700 }} title="Código LOSCAT — térmico">
                      {sol.cod}
                    </span>
                    {codigoLOSCAA && (
                      <span style={{ fontSize:9, background:'#f3e8ff', border:'1px solid #d8b4fe', borderRadius:3, padding:'1px 5px', color:'#7c3aed', fontWeight:700, fontFamily:'monospace', whiteSpace:'nowrap' }} title="Código LOSCAA — acústico">
                        🔇 LOSCAA {codigoLOSCAA}{loscaaIntrinseco ? ' ✓' : ''}
                      </span>
                    )}
                  </div>
                  <span style={{ flex:1, fontSize:11, color:'#374151', minWidth:140 }}>
                    <b>{label}:</b> {sol.desc}
                  </span>
                  <span style={{ fontSize:11, fontWeight:700, color:'#374151', flexShrink:0 }}>
                    Rw {rwSol != null ? `${rwSol} dB` : '—'}{req ? ` (req. ≥${req} dB)` : ''}
                  </span>
                  {!sinRw && req && <span style={S.badge(cumple)}>{cumple?'CUMPLE':'NO CUMPLE'}</span>}
                  {sinRw && <span style={{ fontSize:10, color:'#94a3b8' }}>Sin dato Rw</span>}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ── Tabla Rw ruido aéreo ─────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h2}>Aislamiento acústico — ruido aéreo Rw (dB) · {uso || '—'}</p>
        {!uso && <div style={S.warn}>Selecciona uso en Diagnóstico.</div>}

        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Separación</th>
            <th style={S.th}>Rw propuesto (dB)</th>
            <th style={S.th}>Rw mínimo NCh352</th>
            <th style={S.th}>Estado</th>
          </tr></thead>
          <tbody>
            {acElems.map(({ id, label, req, desc }) => {
              const rwFromSol = {
                entre_unidades: parseFloat(termica.muro?.rw||0) || parseFloat(termica.tabique?.rw||0) || '',
                fachada:        parseFloat(termica.muro?.rw||0) || '',
                entre_pisos:    parseFloat(termica.piso?.rw||0) || parseFloat(termica.techo?.rw||0) || '',
              }[id] || ''
              const rwManual = termica['ac_' + id]?.rw || ''
              // Fachada: si el usuario no ingresó un Rw manual y hay Rw de muro +
              // ventana + % vidriado, el Rw real es la composición en paralelo
              // (el vidrio baja el conjunto). El camino más débil domina.
              const comp = id === 'fachada' && !rwManual
                ? rwFachadaCompuesta({ rwMuro: rwFromSol, rwVentana: termica.ac_fachada?.rwVentana, pctVidriado: termica.ac_fachada?.pctVidriado })
                : null
              const rw = comp ? comp.combinado : parseFloat(rwManual || rwFromSol || 0)
              const cumple = !req || !rw || rw >= req
              const filas = [
                <tr key={id}>
                  <td style={S.td}>
                    <b>{label}</b>
                    <div style={{ fontSize:10, color:'#64748b', marginTop:2, lineHeight:1.4 }}>{desc}</div>
                  </td>
                  <td style={S.td}>
                    <input type="number" min={0} max={90} step="0.5" style={{ ...ist, width:70 }}
                      value={rwManual} onChange={e => set('ac_'+id, 'rw', e.target.value)}
                      placeholder="ej. 45"/>
                    {!rwManual && comp ? (
                      <div style={{ fontSize:10, color:'#7c3aed', marginTop:2, fontWeight:600 }}>↓ {comp.combinado} dB (muro {comp.rwMuro} + ventana {comp.rwVentana}, {comp.pctVidriado}% vidriado)</div>
                    ) : !rwManual && rwFromSol ? (
                      <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>↑ {rwFromSol} dB (solución)</div>
                    ) : null}
                  </td>
                  <td style={{ ...S.td, color:'#0f766e', fontWeight:700 }}>{req ? req + ' dB' : '—'}</td>
                  <td style={S.td}>
                    {(rw || rwFromSol) && req
                      ? <span style={S.badge(cumple)}>{cumple?'CUMPLE':'NO CUMPLE'}</span>
                      : '—'}
                    {rw && req && !cumple && Math.abs(rw - req) <= 2 && (
                      <div style={{ fontSize:10, color:'#b45309', marginTop:2 }}>⚠ Déficit ≤ 2 dB — verificar con ensayo NCh352 (tolerancia de medición ±2 dB)</div>
                    )}
                  </td>
                </tr>,
              ]
              // Sub-fila de composición de fachada (muro + ventana en paralelo).
              if (id === 'fachada') {
                filas.push(
                  <tr key={id + '-comp'}>
                    <td style={{ ...S.td, background:'#faf5ff', borderTop:'none' }} colSpan={4}>
                      <div style={{ fontSize:11, color:'#7c3aed', fontWeight:700, marginBottom:4 }}>
                        🪟 Composición de fachada (muro + ventana) <span style={{ fontWeight:400, color:'#64748b' }}>— opcional; el vidrio suele ser el eslabón débil</span>
                      </div>
                      <div style={{ display:'flex', gap:14, alignItems:'flex-end', flexWrap:'wrap' }}>
                        <label style={{ fontSize:10, color:'#64748b' }}>
                          Rw ventana (dB)<br/>
                          <input type="number" min={0} max={60} step="0.5" style={{ ...ist, width:72 }}
                            value={termica.ac_fachada?.rwVentana || ''}
                            onChange={e => set('ac_fachada', 'rwVentana', e.target.value)}
                            placeholder="ej. 32"/>
                          <div style={{ fontSize:9, color:'#94a3b8', marginTop:1 }}>monolítico ~28 · DVH ~32 · laminado acústico ~38</div>
                        </label>
                        <label style={{ fontSize:10, color:'#64748b' }}>
                          % vidriado de fachada<br/>
                          <input type="number" min={0} max={100} step="1" style={{ ...ist, width:72 }}
                            value={termica.ac_fachada?.pctVidriado || ''}
                            onChange={e => set('ac_fachada', 'pctVidriado', e.target.value)}
                            placeholder="ej. 25"/>
                        </label>
                        <div style={{ fontSize:10, color:'#64748b' }}>
                          Muro: <b>{rwFromSol ? rwFromSol + ' dB' : '— (aplica una solución de muro)'}</b>
                        </div>
                        {comp && (
                          <div style={{ fontSize:11, background:'#f3e8ff', border:'1px solid #d8b4fe', borderRadius:6, padding:'6px 10px', color:'#6b21a8' }}>
                            Rw fachada combinado ≈ <b>{comp.combinado} dB</b> · eslabón débil: <b>{comp.debil}</b>
                            {req && <> · {comp.combinado >= req ? '✓ cumple' : `✗ faltan ${(req - comp.combinado).toFixed(1)} dB`} (≥ {req} dB)</>}
                          </div>
                        )}
                      </div>
                      {rwManual && (
                        <div style={{ fontSize:10, color:'#b45309', marginTop:4 }}>Ingresaste un Rw de fachada manual arriba — manda ese valor y la composición queda solo como referencia.</div>
                      )}
                    </td>
                  </tr>
                )
              }
              return filas
            })}
          </tbody>
        </table>
        <div style={{ fontSize:10, color:'#94a3b8', marginTop:6 }}>
          Tolerancia de medición NCh352: ±2 dB típico. Valores ingresados como declarados por el proyectista.
        </div>
      </div>

      {/* ── Tabla L'n,w ruido de impacto ─────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h2}>Aislamiento acústico — ruido de impacto L'n,w (dB) · {uso || '—'}</p>
        <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>
          L'n,w = nivel de ruido de impacto normalizado. <b>MENOR valor = MEJOR aislación.</b>
          Aplica a pisos/entrepisos entre <b>unidades de vivienda</b>.
          Exigencia: <b>Vivienda → OGUC Art. 4.1.6 (L'nT,w ≤ 75 dB)</b>. Otros usos: referencia NCh352:2013.
        </div>
        {!uso && <div style={S.warn}>Selecciona uso en Diagnóstico.</div>}
        {/* B7 · Aplicabilidad: el Art. 4.1.6 solo exige impacto entre unidades distintas */}
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, marginBottom:8, cursor:'pointer', background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:6, padding:'6px 10px' }}>
          <input type="checkbox"
            checked={termica.ac_impacto_pisos?.entreUnidades !== false}
            onChange={e => set('ac_impacto_pisos', 'entreUnidades', e.target.checked)}
            style={{ cursor:'pointer' }} />
          <span>El entrepiso <b>separa unidades de vivienda distintas</b> <span style={{ color:'#64748b' }}>— el Art. 4.1.6 solo exige aislación de impacto entre unidades distintas; en una vivienda unifamiliar (mismo hogar arriba y abajo), desmárcalo y la verificación queda como <b>no aplica</b>.</span></span>
        </label>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Elemento</th>
            <th style={S.th}>L'n,w medido (dB)</th>
            <th style={S.th}>L'n,w máximo{uso==='Vivienda' ? ' (OGUC 4.1.6)' : ' (NCh352)'}</th>
            <th style={S.th}>Estado</th>
          </tr></thead>
          <tbody>
            <tr>
              <td style={S.td}>
                <b>Entre pisos — ruido de impacto</b>
                <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>
                  Pasos, caída de objetos. Incluye losa, piso flotante y terminación. Menor valor = mejor. OGUC Art. 4.1.6 (vivienda) / NCh352.
                </div>
              </td>
              <td style={S.td}>
                <input type="number" min={0} max={100} step="1" style={{ ...ist, width:70 }}
                  value={termica.ac_impacto_pisos?.lnw || ''}
                  onChange={e => set('ac_impacto_pisos', 'lnw', e.target.value)}
                  placeholder="ej. 58"/>
                <div style={{ fontSize:9, color:'#94a3b8', marginTop:2 }}>dB (medido)</div>
              </td>
              <td style={{ ...S.td, color:'#0f766e', fontWeight:700 }}>
                {acImpact.entre_pisos ? `≤ ${acImpact.entre_pisos} dB` : '—'}
              </td>
              <td style={S.td}>
                {(() => {
                  if (termica.ac_impacto_pisos?.entreUnidades === false) return (
                    <span style={{ color:'#64748b', fontSize:11 }}>NO APLICA<div style={{ fontSize:9 }}>misma unidad · Art. 4.1.6 exige entre unidades distintas</div></span>
                  )
                  const { base, mejora, efectivo } = lnwEfectivo(termica.ac_impacto_pisos)
                  if (!base || !acImpact.entre_pisos) return '—'
                  const cumple = efectivo <= acImpact.entre_pisos
                  return (
                    <>
                      <span style={S.badge(cumple)}>{cumple?'CUMPLE':'NO CUMPLE'}</span>
                      {mejora && (
                        <div style={{ fontSize:10, color:'#0e6560', marginTop:2 }}>con {mejora.codigo}: {base} → {efectivo} dB</div>
                      )}
                      {!cumple && efectivo - acImpact.entre_pisos <= 3 && (
                        <div style={{ fontSize:10, color:'#b45309', marginTop:2 }}>⚠ Exceso ≤ 3 dB — verificar con ensayo NCh352</div>
                      )}
                    </>
                  )
                })()}
              </td>
            </tr>
          </tbody>
        </table>
        {/* ── Mejora certificada del impacto (LOSCAA RP.O) ──────────────── */}
        <div style={{ marginTop:10, padding:10, background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:8 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#0e6560', marginBottom:3 }}>
            🔧 Mejorar el impacto con un revestimiento certificado (LOSCAA)
          </div>
          <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>
            Agrega un revestimiento de piso certificado sobre el entrepiso base. La ficha LOSCAA declara su mejora <b>ΔL,w</b> (impacto), que se resta al L'n,w base. Menor = mejor.
          </div>
          <select
            value={termica.ac_impacto_pisos?.mejora || ''}
            onChange={e => set('ac_impacto_pisos', 'mejora', e.target.value)}
            style={{ ...ist, width:'100%', maxWidth:520 }}>
            <option value="">— Sin revestimiento adicional —</option>
            {MEJORAS_IMPACTO_PISO.map(m => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} · {m.titulo} — ΔL,w −{m.delta_lw} dB{m.delta_rw_C != null ? ` · ΔRw+C ${m.delta_rw_C >= 0 ? '+' : ''}${m.delta_rw_C} dB` : ''}
              </option>
            ))}
          </select>
          {(() => {
            const selCod = termica.ac_impacto_pisos?.mejora
            if (!selCod) return null
            const { base, mejora: mej, efectivo: mejorado } = lnwEfectivo(termica.ac_impacto_pisos)
            if (!base || !mej) return (
              <div style={{ fontSize:11, color:'#b45309', marginTop:8 }}>
                Ingresa el L'n,w del entrepiso base (arriba) para ver el resultado con este revestimiento.
              </div>
            )
            const req = acImpact.entre_pisos
            const cumpleBase = req ? base <= req : null
            const cumpleMej = req ? mejorado <= req : null
            return (
              <div style={{ marginTop:8, fontSize:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ color:'#64748b' }}>Base <b>{base} dB</b></span>
                  <span style={{ color:'#0e6560', fontWeight:700 }}>− {mej.delta_lw} (ΔL,w)</span>
                  <span>→</span>
                  <span style={{ fontWeight:800, color: cumpleMej === false ? '#b91c1c' : '#0e6560' }}>{mejorado} dB</span>
                  {req && <span style={{ color:'#0f766e' }}>· máximo ≤ {req} dB</span>}
                  {cumpleMej != null && <span style={S.badge(cumpleMej)}>{cumpleMej ? 'CUMPLE' : 'NO CUMPLE'}</span>}
                </div>
                {cumpleBase === false && cumpleMej === true && (
                  <div style={{ fontSize:11, color:'#0e6560', marginTop:4 }}>
                    ✓ Con {mej.codigo} el entrepiso pasa a cumplir el ruido de impacto.
                  </div>
                )}
                {mej.delta_rw_C != null && mej.delta_rw_C < 0 && (
                  <div style={{ fontSize:10.5, color:'#b45309', marginTop:4 }}>
                    ⚠ Este revestimiento reduce el aislamiento aéreo en {Math.abs(mej.delta_rw_C)} dB (ΔRw+C {mej.delta_rw_C}) — verifica que el Rw+C aéreo siga cumpliendo.
                  </div>
                )}
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>
                  {mej.codigo} · mejora de laboratorio (NCh2786) — se aplica sobre el L'n,w base como aproximación conservadora. Fuente: LOSCAA ED13 2024.
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── Sugerencias Rw cuando no cumple ─────────────────────────────── */}
      {acElems.filter(e => {
        const rw = parseFloat(termica['ac_' + e.id]?.rw || termica[{entre_unidades:'muro',fachada:'muro',entre_pisos:'piso'}[e.id]]?.rw || 0)
        return rw && e.req && rw < e.req
      }).map(e => {
        const elemSC = { entre_unidades:'muro', fachada:'muro', entre_pisos:'piso' }[e.id]
        const alts = elemSC ? SC.filter(s => s.elem===elemSC && (s.usos || []).includes(uso||'Vivienda') && s.ac_rw && s.ac_rw >= e.req).sort((a,b)=>b.ac_rw-a.ac_rw).slice(0,4) : []
        return (
          <div key={e.id} style={{ ...S.card, borderColor:'#99f6e4', background:'#f0f7ff' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#0e6560', marginBottom:6 }}>
              ❌ {e.label}: Rw propuesto ({termica['ac_'+e.id]?.rw||'—'} dB) insuficiente — se requiere ≥ {e.req} dB
            </div>
            {alts.length > 0 ? (
              <>
                <div style={{ fontSize:11, color:'#374151', marginBottom:6 }}>Soluciones LOSCAT con Rw ≥ {e.req} dB:</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {alts.map(s => (
                    <div key={s.cod} style={{ background:'#fff', border:'1px solid #99f6e4', borderRadius:6, padding:'6px 10px', flex:1, minWidth:180 }}>
                      <div style={{ fontWeight:700, fontSize:11, color:'#0e6560' }}>{s.cod} · Rw {s.ac_rw} dB</div>
                      <div style={{ fontSize:11 }}>{s.desc}</div>
                      <div style={{ fontSize:10, color:'#64748b' }}>U={s.u} W/m²K · RF {s.rf||'—'}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize:11, color:'#64748b' }}>
                Considera doble hoja con cámara de aire ≥ 50mm, masa ≥ 200 kg/m² o combinación de ambas.
                Para fachada, verifica Rw de ventana (doble vidrio) en pestaña Ventana.
              </div>
            )}
          </div>
        )
      })}
      <NotasPanel tabKey="acustica" notas={notas} setNotas={setNotas} />
    </div>
  )
}

// ─── GRÁFICO GLASER SVG ───────────────────────────────────────────────────────
const GraficoGlaser = forwardRef(function GraficoGlaser({ res, capas, elemTipo }, svgRef) {
  const W = 560, H = 200, PAD = { t: 18, b: 36, l: 38, r: 16 }
  const gW = W - PAD.l - PAD.r
  const gH = H - PAD.t - PAD.b

  if (!res?.temps?.length) return null

  // ── Posiciones X por resistencia térmica acumulada ─────────────────────────
  const Rs = res.Rs || []
  const Rtot = res.Rtot || 1
  // Puntos de temperatura: interior(0) → tras cada capa → exterior
  // temps tiene n+1 valores: [Ti, T1, T2, ..., Tn_ext_surface]
  // Interfaces de capas están en posiciones acumuladas de Rs (sin RSi/RSe)
  const rsAcum = [0] // posición relativa 0..1 de cada punto de temperatura
  let acc = Rs[0] || 0.13 // RSi
  for (let i = 1; i < Rs.length - 1; i++) { // Rs[1..n] = capas, Rs[n+1] = RSe
    acc += Rs[i]
    rsAcum.push(acc / Rtot)
  }
  rsAcum.push(1) // exterior

  const temps  = res.temps
  const Tdew   = parseFloat(res.Tdew)
  // Filtrar valores válidos para min/max (temps puede tener menos puntos que rsAcum)
  const tempsValidos = temps.filter(t => typeof t === 'number' && !isNaN(t))
  // Si no hay temperaturas válidas o Tdew es NaN, no podemos graficar — salida segura
  if (tempsValidos.length === 0 || isNaN(Tdew)) return null

  const tMin   = Math.min(...tempsValidos, Tdew) - 1
  const tMax   = Math.max(...tempsValidos, Tdew) + 1
  if (isNaN(tMin) || isNaN(tMax) || tMax === tMin) return null

  function xPx(rel) {
    if (typeof rel !== 'number' || isNaN(rel)) return PAD.l
    return PAD.l + rel * gW
  }
  function yPx(t)   {
    if (typeof t !== 'number' || isNaN(t)) return PAD.t + gH  // posición segura
    return PAD.t + gH - ((t - tMin) / (tMax - tMin)) * gH
  }

  // Línea de temperatura — solo puntos con temp definida
  const tempPts = rsAcum
    .map((r, i) => {
      const t = temps[i]
      if (typeof t !== 'number' || isNaN(t)) return null
      return `${xPx(r)},${yPx(t)}`
    })
    .filter(Boolean)
    .join(' ')
  // Línea de punto de rocío (horizontal)
  const yTd = yPx(Tdew)

  // Etiquetas de capas (centradas en cada segmento) — filtra inválidos
  // Nota: se mapea sobre el índice ORIGINAL (rsAcum/Rs incluyen la cámara); filtrar
  // antes del map desalinea la etiqueta cuando hay cámara. Ver B11.
  const capaLabels = capas
    .map((c, i) => ({ c, i }))
    .filter(x => !x.c.esCamara)
    .map(({ c, i }) => {
      const rNext = rsAcum[i + 1]
      if (typeof rNext !== 'number' || isNaN(rNext)) return null
      const rCur = rNext - (Rs[i + 1] || 0) / Rtot
      const x0 = xPx(rCur)
      const x1 = xPx(rNext)
      const cx = (x0 + x1) / 2
      if (isNaN(cx)) return null
      return { label: (c.mat || c.name || '').split(' ').slice(0, 2).join(' '), cx }
    })
    .filter(Boolean)

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block', marginBottom: 4 }} xmlns="http://www.w3.org/2000/svg">
      {/* Fondo */}
      <rect x={PAD.l} y={PAD.t} width={gW} height={gH} fill="#f8fafc" rx={4} />

      {/* Líneas de cuadrícula horizontales */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const t = tMin + f * (tMax - tMin)
        const y = yPx(t)
        return (
          <g key={f}>
            <line x1={PAD.l} x2={PAD.l + gW} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={PAD.l - 3} y={y + 3.5} fontSize={8} fill="#94a3b8" textAnchor="end">{Math.round(t)}</text>
          </g>
        )
      })}

      {/* Líneas de separación de capas */}
      {rsAcum.slice(1, -1).map((r, i) => (
        <line key={i} x1={xPx(r)} x2={xPx(r)} y1={PAD.t} y2={PAD.t + gH} stroke="#cbd5e1" strokeWidth={0.8} strokeDasharray="3,2" />
      ))}

      {/* Zona de riesgo (área bajo Td) */}
      {res.condInter && (
        <rect x={PAD.l} y={yTd} width={gW} height={PAD.t + gH - yTd} fill="#fee2e2" opacity={0.4} />
      )}

      {/* Punto de rocío — línea naranja discontinua */}
      <line x1={PAD.l} x2={PAD.l + gW} y1={yTd} y2={yTd} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6,3" />
      <text x={PAD.l + gW + 2} y={yTd + 3} fontSize={8} fill="#f59e0b">{`Td=${res.Tdew}°`}</text>

      {/* Línea de temperatura — azul */}
      <polyline points={tempPts} fill="none" stroke="#0e6560" strokeWidth={2} strokeLinejoin="round" />

      {/* Puntos de interfaz — solo donde temps[i] esté definido */}
      {rsAcum.map((r, i) => {
        const t = temps[i]
        if (typeof t !== 'number' || isNaN(t)) return null
        const iface = res.ifaces?.[i - 1]
        const riesgo = iface?.riesgo
        return (
          <circle key={i} cx={xPx(r)} cy={yPx(t)}
            r={i === 0 || i === rsAcum.length - 1 ? 3 : 4}
            fill={riesgo ? '#dc2626' : '#0e6560'}
            stroke="#fff" strokeWidth={1.5}
          />
        )
      })}

      {/* Etiquetas int / ext */}
      <text x={PAD.l + 2} y={PAD.t + gH + 14} fontSize={9} fill="#64748b">int</text>
      <text x={PAD.l + gW - 2} y={PAD.t + gH + 14} fontSize={9} fill="#64748b" textAnchor="end">ext</text>

      {/* Etiquetas de capas */}
      {capaLabels.map((cl, i) => (
        <text key={i} x={cl.cx} y={PAD.t + gH + 26} fontSize={7.5} fill="#94a3b8" textAnchor="middle">{cl.label}</text>
      ))}

      {/* Eje °C */}
      <text x={PAD.l - 3} y={PAD.t - 5} fontSize={8} fill="#94a3b8" textAnchor="end">°C</text>
    </svg>
  )
})

// ─── Cubierta ventilada (ISO 6946 §6.9.2) ────────────────────────────────────
// Si la cubierta es ventilada y hay una cámara de aire, el cálculo higrotérmico
// solo considera las capas BAJO la cámara (las superiores están a condiciones
// exteriores y no contribuyen). La cara que da a la cámara venteada usa
// Rse = Rsi del flujo (aire quieto, §6.9.4). Devuelve { cv truncado, rseVent }.
function aplicarCubiertaVentilada(cvFull, camaraVentilada, elemTipo) {
  // ISO 6946 §6.9.3: en una cámara MUY ventilada se desprecia la R de la cámara y
  // la de todas las capas entre ella y el exterior, y se reemplaza Rse por Rsi
  // (aire quieto) en la cara que da a la cámara. Aplica a cubierta Y a muro
  // (fachada ventilada) y piso. B4: antes solo se aplicaba a techo.
  if (!camaraVentilada) return { cv: cvFull, rseVent: undefined }
  const idxCam = cvFull.findIndex(c => c.esCamara || c.camara)
  if (idxCam <= 0) return { cv: cvFull, rseVent: undefined }  // sin cámara (o es la 1ª) → no truncar
  const rsiKey = (elemTipo === 'techumbre' || elemTipo === 'techo') ? 'techo'
    : elemTipo === 'piso' ? 'piso' : 'muro'
  return { cv: cvFull.slice(0, idxCam), rseVent: RSI_MAP[rsiKey] || 0.13 }
}

// ─── PANEL CÁLCULO U (componente por elemento) ────────────────────────────────
function PanelCalcU({ elemKey, elemTipo, label, umax, proy, initData, headerColor, onLimpiarCalcU, onCalcUChange, perfil }) {
  // elemKey puede ser simple ('muro') o compuesto ('abc123::muro').
  // elemId es siempre el tipo de elemento para las comprobaciones condicionales.
  const elemId = elemKey.includes('::') ? elemKey.split('::').pop() : elemKey
  const zona = proy.zona ? ZONAS[proy.zona] : null
  const [collapsed, setCollapsed] = useState(false)
  const [capas, setCapas] = useState([])
  const [res, setRes] = useState(null)
  const [correc, setCorrec] = useState([])
  const [calcuando, setCalcuando] = useState(false)
  // true = correcciones son sugerencias opcionales (ya cumple, cerca del límite)
  // false = correcciones requeridas (no cumple U o hay condensación)
  const [modoOptimiz, setModoOptimiz] = useState(false)
  const [solucion, setSolucion] = useState(null)
  const [origCapas, setOrigCapas] = useState(null)
  const [showHomolog, setShowHomolog] = useState(false)
  const [showInterpret, setShowInterpret] = useState(false)
  const graphRef = useRef(null)
  const esTabique = elemId === 'tabique'
  // Flag para evitar doble cálculo: cuando el propio componente llama a onCalcUChange
  // (desde calcularConCapas o aplicarCorreccion) el efecto initData se dispara de nuevo.
  // Con este ref lo saltamos sin borrar correcciones ya en curso.
  const skipInitEffect = useRef(false)
  // Token de cancelación para operaciones async — incrementa cada vez que cambia
  // initData o el usuario dispara un nuevo cálculo. Las promesas en vuelo verifican
  // este token antes de actualizar estado, evitando race conditions que cuelgan la UI.
  const opToken = useRef(0)
  // Última firma de initData procesada — evita re-trabajo si la referencia cambió
  // pero el contenido es idéntico (caso común con setCalcUInit del padre).
  const lastInitSig = useRef(null)

  // Árbitro mensual (ISO 13788): confirma o exonera el riesgo geométrico de
  // trampa de vapor de una corrección usando el clima real de la comuna/zona del
  // proyecto. En ref para inyectarlo en generarCorrecciones dentro de efectos sin
  // alterar sus dependencias. Devuelve 'seca' | 'acumula' | null.
  const arbitroMensualRef = useRef(null)
  arbitroMensualRef.current = (cvCorr, et) => {
    try {
      const clima = climaMensual(proy.comuna || null, proy.zona || null)
      const a = analizarGlaserAnual(cvCorr, clima, et === 'techumbre' ? 'techo' : et)
      if (!a) return null
      if (a.veredicto === 'sin_riesgo' || a.veredicto === 'autoseca') return 'seca'
      if (a.veredicto === 'acumula' || a.cumpleISO13788 === false) return 'acumula'
      return null
    } catch { return null }
  }

  // ── Estado para opciones normativas avanzadas ──────────────────────────────
  // Piso: tipo de apoyo (ventilado / sobre terreno / sobre espacio no calef.)
  const [pisoTipo, setPisoTipo] = useState('ventilado') // 'ventilado'|'terreno'|'no_calef'
  const [corteInvert, setCorteInvert] = useState(false)   // voltear orden del corte de capas
  const [cortePisoModo, setCortePisoModo] = useState(null) // null=auto · 'radier'|'entrepiso'
  const [pisoAg,   setPisoAg]   = useState('')           // área piso Ag (m²)
  const [pisoPg,   setPisoPg]   = useState('')           // perímetro expuesto Pg (m)
  const [pisoLg,   setPisoLg]   = useState('2.0')        // λ suelo (W/mK)
  // Techo: cubierta ventilada → calcular solo capas bajo cámara (ISO 6946 §6.9.2)
  const [cubiertaVent, setCubiertaVent] = useState(false)
  // Corrección puentes térmicos ΔU (ISO 6946 §6.9.3) — suma al U calculado
  const [deltaU, setDeltaU] = useState('')

  useEffect(() => {
    if (!initData?.capas?.length) return

    // Filtrar capas nulas/undefined para evitar crashes en mapeos
    const capasValidas = initData.capas.filter(c => c != null)
    if (!capasValidas.length) return

    setCapas(capasValidas)
    setOrigCapas(capasValidas.map(c => ({...c})))
    setSolucion(initData.solucion || null)

    // Auto-activar "Cubierta ventilada" si la solución de techo lo indica:
    // descripción menciona ventilación, o ya trae una cámara de aire. Así, al
    // agregar la cámara (si aún no está), el cálculo trunca de inmediato.
    // El usuario puede desmarcarlo si su diseño no es ventilado.
    let autoVent = false
    if (elemId === 'techo') {
      const txtSol = ((initData.solucion?.obs || '') + ' ' + (initData.solucion?.desc || '')).toLowerCase()
      const mencionaVent = /ventilad|ventilaci[oó]n/.test(txtSol)
      const tieneCamara = capasValidas.some(c => c.esCamara)
      autoVent = mencionaVent || tieneCamara
      setCubiertaVent(autoVent)
    }

    // Si el propio componente disparó este cambio de initData (vía onCalcUChange),
    // saltar el recálculo para evitar el doble cálculo que congela la UI.
    if (skipInitEffect.current) { skipInitEffect.current = false; return }

    // Incrementar token de operación. Async pendientes (de calls previos)
    // verán que su myToken != opToken.current y descartarán su resultado.
    const myToken = ++opToken.current

    // Auto-calcular inmediatamente con las capas de la solución. Si la comuna
    // tiene PDA, el clima exterior (Te, He) sale del preset del plan (julio).
    const _clima = climaPDA(proy.comuna)
    const tiZ = zona?.Ti || 20, teZ = _clima ? _clima.te : (zona?.Te || 5), hrZ = zona?.HR || 70
    const hrExtZ = _clima ? _clima.he : 80
    // Cámara: pasar su espesor (metros) para que resistenciaCamara use la R
    // según ISO 6946. Sin espesor → 0.18 (retrocompat con proyectos guardados).
    const cvFull = capasValidas.map(c => c.esCamara ? { esCamara: true, esp: (parseFloat(c.esp) || 0) / 1000 } : {
      mat: c.mat, lam: parseFloat(c.lam), esp: parseFloat(c.esp) / 1000, mu: parseFloat(c.mu),
      ...(c.estructura_integrada ? { estructura_integrada: c.estructura_integrada } : {}),
    }).filter(c => c.esCamara || (!isNaN(c.lam) && c.lam > 0 && !isNaN(c.esp) && c.esp > 0))
    // Aplicar truncación de cubierta ventilada con el valor auto-detectado
    const { cv, rseVent } = aplicarCubiertaVentilada(cvFull, autoVent, elemTipo)
    if (cv.length) {
      // calcGlaser es sync — siempre aplicar el resultado, sin token-check.
      const r = calcGlaser(cv, tiZ, teZ, hrZ, elemTipo, rseVent, hrExtZ)
      setRes(r)
      // Tabique interior: no aplica verificación Glaser (NCh853 → solo envolvente)
      if (elemId !== 'tabique') {
        // Trigger en 3 casos: condensación, no cumple U, o cerca del límite
        const u_actual = parseFloat(r?.U)
        const necesitaU = umax && !uCumpleMax(u_actual, umax)
        const optimizar = umax && u_actual > umax * 0.85
        const nec = r?.condInter || necesitaU || optimizar
        const esOptimizOnly = optimizar && !necesitaU && !r?.condInter
        if (nec) {
          setModoOptimiz(esOptimizOnly)
          setCalcuando(true)
          const targetParaSugerir = esOptimizOnly ? umax * 0.90 : umax
          ;(async () => {
            try {
              const cr = await generarCorrecciones(cv, tiZ, teZ, hrZ, elemTipo, targetParaSugerir, { arbitroMensual: arbitroMensualRef.current })
              // Solo aplicar si esta sigue siendo la operación activa
              if (myToken !== opToken.current) return
              setCorrec(cr)
            } catch (e) {
              console.error('generarCorrecciones error:', e)
              if (myToken === opToken.current) setCorrec([])
            } finally {
              if (myToken === opToken.current) setCalcuando(false)
            }
          })()
        } else { setCorrec([]); setModoOptimiz(false); setCalcuando(false) }
      }
    } else {
      setRes(null); setCorrec([]); setCalcuando(false)
    }
    // No registramos cleanup — bumpear opToken aquí se solapa con calcularConCapas
    // que también bumpea, causando que el cálculo síncrono se pierda.
  }, [initData])

  // Clima de diseño. En comunas con PDA, el exterior (Te, He) usa el preset del
  // plan (julio); el interior (Ti, HR) se mantiene. Ver CLIMA_PDA en data/pda.js.
  const climaPda = climaPDA(proy.comuna)
  const ti = zona?.Ti || 20
  const te = climaPda ? climaPda.te : (zona?.Te || 5)
  const hr = zona?.HR || 70
  const hrExt = climaPda ? climaPda.he : 80

  function addCapa() {
    setCapas(c => [...c, { id: Date.now(), mat: '', lam: '', esp: '', mu: '', esCamara: false }])
  }
  function updCapa(id, field, val) {
    setCapas(cs => cs.map(c => c.id === id ? { ...c, [field]: val } : c))
  }
  function delCapa(id) { setCapas(cs => cs.filter(c => c.id !== id)) }
  // Activa/desactiva o actualiza la estructura integrada de una capa (ISO 6946)
  function updEstructura(id, campo, valor) {
    setCapas(cs => cs.map(c => {
      if (c.id !== id) return c
      if (!campo) {
        // toggle on/off
        return { ...c, estructura_integrada: valor
          ? { tipo: 'madera', lam: STRUCT_MATS.madera.lam, ancho_mm: 38, distancia_mm: 600 }
          : null }
      }
      const eb = { ...c.estructura_integrada, [campo]: campo === 'tipo' ? valor : (parseFloat(valor) || c.estructura_integrada[campo]) }
      if (campo === 'tipo') eb.lam = STRUCT_MATS[valor]?.lam ?? eb.lam
      return { ...c, estructura_integrada: eb }
    }))
    setRes(null)
  }
  function setMat(id, matName) {
    const m = ALL_MATS.find(x => x.n === matName)
    if (m) setCapas(cs => cs.map(c => c.id === id ? {
      ...c,
      mat: m.n,
      lam: String(m.lam),
      mu: String(m.mu),
      // Si el catálogo trae espesor sugerido (cubiertas: esp en METROS),
      // autocompletar en mm. Materiales generales (sin esp) no tocan el campo.
      ...(m.esp ? { esp: String(m.esp * 1000) } : {}),
    } : c))
    else setCapas(cs => cs.map(c => c.id === id ? { ...c, mat: matName } : c))
  }
  function addCamara() {
    setCapas(c => [...c, { id: Date.now(), mat: 'Cámara de aire', lam: '', esp: '', mu: '', esCamara: true }])
  }

  async function calcularConCapas(cs, opts = {}) {
    try {
      const cvFull = cs.map(c => c.esCamara ? { esCamara: true, esp: (parseFloat(c.esp) || 0) / 1000 } : {
        mat: c.mat, lam: parseFloat(c.lam), esp: parseFloat(c.esp) / 1000, mu: parseFloat(c.mu),
        ...(c.estructura_integrada ? { estructura_integrada: c.estructura_integrada } : {}),
      }).filter(c => c.esCamara || (!isNaN(c.lam) && c.lam > 0 && !isNaN(c.esp) && c.esp > 0))
      if (!cvFull.length) return

      // ── Cubierta ventilada (ISO 6946 §6.9.2): si está activa y hay cámara,
      // truncar el stack en la cámara (las capas sobre ella no contribuyen) y
      // usar Rse = Rsi del flujo (aire quieto, §6.9.4) en la cara a la cámara. ──
      const { cv, rseVent } = aplicarCubiertaVentilada(cvFull, cubiertaVent, elemTipo)
      if (!cv.length) return

      // Incrementar token. Promesas async previas se descartarán solas.
      const myToken = ++opToken.current

      // calcGlaser es sync — siempre aplicar el resultado
      const r = calcGlaser(cv, ti, te, hr, elemTipo, rseVent, hrExt)
      setRes(r)
      setShowHomolog(false)
      // Notificar al padre con las capas actualizadas y el resultado calculado.
      // Marcamos el flag para que useEffect([initData]) no vuelva a calcular.
      if (onCalcUChange) { skipInitEffect.current = true; onCalcUChange(elemKey, { capas: cs, res: r, limpiarCorreccion: opts.limpiarCorreccion }) }
      // Tabique interior: no aplica verificación Glaser (NCh853 → solo envolvente)
      if (elemId !== 'tabique') {
        // Trigger corrections en 3 casos:
        // 1. Condensación intersticial detectada (siempre, debe corregirse)
        // 2. U excede el máximo (no cumple, debe corregirse)
        // 3. U está cerca del límite (>=85% del max) — sugerencias de optimización
        const u_actual = parseFloat(r?.U)
        const necesitaU    = umax && !uCumpleMax(u_actual, umax)  // no cumple (2 dec.)
        const optimizar    = umax && u_actual > umax * 0.85       // cerca del límite
        const necesita     = r?.condInter || necesitaU || optimizar
        const esOptimizOnly = optimizar && !necesitaU && !r?.condInter
        if (necesita) {
          setModoOptimiz(esOptimizOnly)
          setCalcuando(true)
          try {
            // Para mostrar opciones de optimización aunque ya cumpla, le pasamos
            // un umaxTarget más estricto (90% del oficial) si estamos en modo optimizar.
            const targetParaSugerir = esOptimizOnly
              ? umax * 0.90    // sugiere mejoras para llegar al 90% del límite
              : umax
            const nuevasCorrec = await generarCorrecciones(cv, ti, te, hr, elemTipo, targetParaSugerir, { arbitroMensual: arbitroMensualRef.current })
            // Descartar resultado si otra operación más reciente está en curso
            if (myToken !== opToken.current) return
            setCorrec(nuevasCorrec)
          } catch (e) {
            console.error('Fallo crítico en el motor de cálculo:', e)
            if (myToken === opToken.current) setCorrec([])
          } finally {
            if (myToken === opToken.current) setCalcuando(false)
          }
        } else { setCorrec([]); setModoOptimiz(false); setCalcuando(false) }
      }
    } catch(e) {
      console.error('calcularConCapas error:', e)
      setRes(null); setCorrec([]); setCalcuando(false)
    }
  }
  function calcular() { calcularConCapas(capas) }

  // Volver a la solución original del LOSCAT: descarta correcciones aplicadas o
  // ediciones manuales, restaura las capas guardadas en origCapas al cargar la
  // solución, recalcula y limpia la corrección registrada en el padre. Permite
  // probar varias correcciones partiendo siempre del mismo punto de origen.
  function restaurarOriginal() {
    if (!origCapas?.length) return
    const restauradas = origCapas.map(c => ({ ...c, id: Date.now() + Math.random() }))
    setCapas(restauradas)
    setShowHomolog(false)
    setModoOptimiz(false)
    calcularConCapas(restauradas, { limpiarCorreccion: true })
  }

  // Recalcular automáticamente al togglear "Cubierta ventilada" (omite el mount)
  const cubVentMount = useRef(true)
  useEffect(() => {
    if (cubVentMount.current) { cubVentMount.current = false; return }
    if (capas.length) calcularConCapas(capas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cubiertaVent])

  function moveUp(id) {
    setCapas(cs => {
      const i = cs.findIndex(c => c.id === id)
      if (i <= 0) return cs
      const next = [...cs]; [next[i-1], next[i]] = [next[i], next[i-1]]
      return next
    })
    setRes(null)
  }
  function moveDown(id) {
    setCapas(cs => {
      const i = cs.findIndex(c => c.id === id)
      if (i >= cs.length - 1) return cs
      const next = [...cs]; [next[i], next[i+1]] = [next[i+1], next[i]]
      return next
    })
    setRes(null)
  }

  function detectarCambios() {
    if (!origCapas) return []
    const cambios = []
    if (capas.length !== origCapas.length) cambios.push(`Número de capas modificado: ${origCapas.length} → ${capas.length}`)
    capas.forEach((c, i) => {
      const o = origCapas[i]
      if (!o) { cambios.push(`Capa ${i+1} añadida: ${c.mat || 'Cámara de aire'}`); return }
      if ((c.mat || '') !== (o.mat || '') || c.esCamara !== o.esCamara)
        cambios.push(`Capa ${i+1}: ${o.mat || 'Cámara'} → ${c.mat || 'Cámara'} (reordenamiento)`)
      else if (String(c.esp) !== String(o.esp) && !c.esCamara)
        cambios.push(`Capa ${i+1} (${c.mat}): espesor ${o.esp}mm → ${c.esp}mm`)
    })
    return cambios
  }

  function generarTextoHomologacion() {
    if (!solucion || !res) return ''
    const zona_nombre = proy.zona ? `Zona ${proy.zona} (${ZONAS[proy.zona]?.n || ''})` : 'zona no definida'
    const uCalc = parseFloat(res.U)
    const cumpleU = !umax || uCumpleMax(uCalc, umax)
    const cambios = detectarCambios()
    const capasOrig = (origCapas || []).map((c,i) => `   ${i+1}. ${c.esCamara ? 'Cámara de aire' : `${c.mat} — λ=${c.lam} W/mK, e=${c.esp}mm, μ=${c.mu||1}`}`).join('\n')
    const capasMod  = capas.map((c,i) => `   ${i+1}. ${c.esCamara ? 'Cámara de aire' : `${c.mat} — λ=${c.lam} W/mK, e=${c.esp}mm, μ=${c.mu||1}`}`).join('\n')
    const motivoCambio = res.condInter
      ? `El análisis higrotérmico (Método de Glaser, NCh1973:2014) de la configuración original detectó riesgo de condensación intersticial en la(s) interfaz(ces): ${res.ifaces.filter(f=>f.riesgo).map(f=>`N°${f.i} (T=${f.T}°C, Pvreal=${f.pvReal}Pa > Pvsat=${f.pvSat}Pa)`).join('; ')}. La modificación elimina dicho riesgo.`
      : `La modificación mejora las condiciones higrotérmicas del elemento sin reducir su desempeño térmico.`

    return `SOLICITUD DE HOMOLOGACIÓN — SOLUCIÓN CONSTRUCTIVA ${solucion.cod}
${'='.repeat(60)}
Normativa base: LOSCAT Edición 13, 2025 (DITEC-MINVU)
Fecha: ${new Date().toLocaleDateString('es-CL')}
Proyecto: ${proy.nombre || '[nombre del proyecto]'}
Profesional responsable: ${proy.arq || '[nombre del proyectista]'}

1. IDENTIFICACIÓN DE LA SOLUCIÓN BASE
   Código LOSCAT: ${solucion.cod}
   Descripción:   ${solucion.desc}
   Observación:   ${solucion.obs || '—'}
   U certificado: ${solucion.u} W/m²K

2. CAPAS DE LA SOLUCIÓN ORIGINAL (int → ext)
${capasOrig || '   [no disponible]'}

3. CAPAS DE LA SOLUCIÓN MODIFICADA (int → ext)
${capasMod}

4. MODIFICACIONES REALIZADAS
${cambios.length ? cambios.map(c=>`   · ${c}`).join('\n') : '   · Sin cambios detectados'}

5. JUSTIFICACIÓN TÉCNICA
   ${motivoCambio}
   La reconfiguración de capas no altera la naturaleza de los materiales utilizados ni su
   certificación individual. La solución modificada es homologable a ${solucion.cod} en
   cuanto a tipo de elemento constructivo, materiales constituyentes y función estructural.

6. VERIFICACIÓN NORMATIVA DE LA SOLUCIÓN MODIFICADA
   a) Transmitancia térmica (NCh853:2021 / ISO 6946:2017):
      U calculado = ${res.U} W/m²K
      U máximo DS N°15 (${zona_nombre}): ${umax ? `≤ ${umax} W/m²K` : 'no aplica'}
      Estado: ${cumpleU ? '✓ CUMPLE' : '✗ NO CUMPLE — requiere ajuste adicional'}

   b) Condensación intersticial (Método Glaser, NCh1973:2014):
      Temperatura de rocío: ${res.Tdew}°C
      Estado: ${res.condInter ? '✗ RIESGO — revisar configuración' : '✓ SIN RIESGO en interfaces internas'}
${res.ifaces.map(f=>`      Int. ${f.i}: T=${f.T}°C | Pvsat=${f.pvSat}Pa | Pvreal=${f.pvReal}Pa | Margen=${f.margen>=0?'+':''}${f.margen}Pa → ${f.riesgo?'RIESGO':'OK'}`).join('\n')}

7. CONCLUSIÓN
   La solución modificada ${cumpleU && !res.condInter ? 'cumple íntegramente' : 'no cumple aún'} con las
   exigencias del DS N°15 del MINVU para ${zona_nombre} y no presenta riesgo de
   condensación intersticial según el Método de Glaser (NCh1973:2014).
   ${cumpleU && !res.condInter ? 'Se solicita su aceptación como homologación de la solución ' + solucion.cod + ' del LOSCAT Ed.13 2025.' : 'Se requieren ajustes adicionales antes de solicitar homologación.'}

   La responsabilidad técnica de la presente homologación recae en el profesional
   competente suscrito, conforme al OGUC Art. 1.2.2.

Normativa aplicable:
   · LOSCAT Edición 13, 2025 — DITEC-MINVU
   · DS N°15 del MINVU (RT-2025)
   · NCh853:2021 — Acondicionamiento Térmico
   · ISO 6946:2017 — Método de resistencias en serie
   · EN ISO 13788 — Método de Glaser (condensación)
   · OGUC Título IV, Art. 4.1.10 y Art. 1.2.2
${'='.repeat(60)}`
  }

  async function aplicarCorreccion(corr) {
    // Incrementar token para cancelar cualquier async previo
    const myToken = ++opToken.current

    const nuevas = corr.capasCorregidas.map(c => ({
      id: Date.now() + Math.random(),
      mat:      c.n || c.mat || '',
      lam:      String(c.lam ?? ''),
      esp:      (c.esCamara || c.camara) ? '' : String(Math.round((c.esp || 0) * 1000)),
      mu:       String(c.mu ?? 1),
      esCamara: !!(c.esCamara || c.camara),
    }))
    setCapas(nuevas)
    const r = corr.resultado
    setRes(r)
    setShowHomolog(false)
    // Propagar corrección aplicada al padre, incluyendo metadata de trazabilidad
    // (para que el informe pueda listar qué correcciones fueron aplicadas).
    // Marcamos el flag para que useEffect([initData]) no vuelva a calcular.
    if (onCalcUChange) {
      skipInitEffect.current = true
      const correccionAplicada = {
        id:           corr.id,
        titulo:       corr.titulo,
        etiqueta:     corr.etiqueta,
        sistema:      corr.sistema,
        color:        corr.color,
        descripcion:  corr.descripcion,
        cambio:       corr.cambio,
        impactoU:     corr.impactoU,
        compatible_loscat: corr.compatible_loscat,
        advertencias: corr.advertencias || [],
        aplicada_en:  new Date().toISOString(),
      }
      onCalcUChange(elemKey, { capas: nuevas, res: r, correccionAplicada })
    }
    const necesita = r?.condInter || (umax && !uCumpleMax(r?.U ?? 99, umax))
    if (necesita) {
      setModoOptimiz(false)   // tras corregir, si aún falla → modo requerido
      const cvCorr = corr.capasCorregidas
      setCalcuando(true)
      try {
        const nuevasCorrec = await generarCorrecciones(cvCorr, ti, te, hr, elemTipo, umax, { arbitroMensual: arbitroMensualRef.current })
        if (myToken !== opToken.current) return
        setCorrec(nuevasCorrec)
      } catch (e) {
        console.error('Fallo crítico en el motor de cálculo:', e)
        if (myToken === opToken.current) setCorrec([])
      } finally {
        if (myToken === opToken.current) setCalcuando(false)
      }
    } else { setCorrec([]); setModoOptimiz(false); setCalcuando(false) }
  }

  function getSvgString() {
    if (!graphRef.current) return ''
    return new XMLSerializer().serializeToString(graphRef.current)
  }

  function exportarInformeDom() {
    if (!res) return
    const uCalc   = parseFloat(res.U)
    const cumpleU = !umax || uCumpleMax(uCalc, umax)
    const svgStr  = getSvgString()
    const cambios = detectarCambios()
    const fechaHoy = new Date().toLocaleDateString('es-CL')

    const filasCapa = (cs) => (cs || []).map((c,i) => `
      <tr>
        <td>${i+1}</td>
        <td>${c.esCamara ? '<i>Cámara de aire</i>' : (c.mat || c.name || '—')}</td>
        <td>${c.esCamara ? '—' : (c.lam ?? '—')}</td>
        <td>${c.esCamara ? '—' : (c.esp ?? '—')}</td>
        <td>${c.esCamara ? '≈1' : (c.mu ?? '—')}</td>
      </tr>`).join('')

    const filasIfaces = res.ifaces.map(f => `
      <tr class="${f.riesgo ? 'riesgo' : ''}">
        <td>Int. ${f.i}</td><td>${f.T}°C</td><td>${f.pvSat} Pa</td>
        <td>${f.pvReal} Pa</td>
        <td style="color:${f.margen>=0?'#166534':'#dc2626'};font-weight:700">${f.margen>=0?'+':''}${f.margen} Pa</td>
        <td><b>${f.riesgo ? '⚠ CONDENSACIÓN' : '✓ OK'}</b></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe DOM — ${solucion?.cod || 'Cálculo U'}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #1e293b; max-width: 800px; margin: 30px auto; padding: 0 20px }
  h1 { font-size: 15pt; color: #0e6560; border-bottom: 2px solid #0e6560; padding-bottom: 6px }
  h2 { font-size: 12pt; color: #0e6560; margin-top: 22px; margin-bottom: 6px; border-left: 4px solid #0e6560; padding-left: 8px }
  h3 { font-size: 11pt; color: #374151; margin-top: 14px; margin-bottom: 4px }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10pt }
  th { background: #f1f5f9; padding: 6px 8px; text-align: left; border: 1px solid #cbd5e1; font-weight: 700 }
  td { padding: 5px 8px; border: 1px solid #e2e8f0 }
  tr.riesgo td { background: #fee2e2 }
  .badge-ok  { background: #dcfce7; color: #166534; font-weight: 700; padding: 2px 8px; border-radius: 4px }
  .badge-no  { background: #fee2e2; color: #991b1b; font-weight: 700; padding: 2px 8px; border-radius: 4px }
  .fig { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin: 10px 0; background: #f8fafc }
  .fig-cap { font-size: 9pt; color: #64748b; text-align: center; margin-top: 4px }
  .homolog { font-family: monospace; font-size: 9pt; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 12px; white-space: pre-wrap; line-height: 1.5 }
  .aviso { background: #fef9c3; border: 1px solid #fde047; border-radius: 6px; padding: 8px 12px; font-size: 10pt; margin: 8px 0 }
  .ok-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 8px 12px; font-size: 10pt; margin: 8px 0; color: #166534 }
  .no-box { background: #fee2e2; border: 1px solid #fca5a5; border-radius: 6px; padding: 8px 12px; font-size: 10pt; margin: 8px 0; color: #991b1b }
  .data-row { display: flex; gap: 20px; flex-wrap: wrap; margin: 6px 0 }
  .data-item label { font-size: 9pt; color: #64748b; display: block }
  .data-item span { font-weight: 700 }
  @media print { body { margin: 10px } }
</style>
</head>
<body>
<h1>Verificación Normativa — Memoria de Cálculo DOM</h1>
<div class="data-row">
  <div class="data-item"><label>Proyecto</label><span>${proy.nombre || '[sin nombre]'}</span></div>
  <div class="data-item"><label>Profesional</label><span>${proy.arq || '[sin nombre]'}</span></div>
  <div class="data-item"><label>Comuna</label><span>${proy.comuna || '—'}</span></div>
  <div class="data-item"><label>Zona térmica</label><span>${proy.zona || '—'} — ${ZONAS[proy.zona]?.n || ''}</span></div>
  <div class="data-item"><label>Uso</label><span>${proy.uso || '—'}</span></div>
  <div class="data-item"><label>Fecha</label><span>${fechaHoy}</span></div>
</div>

${solucion ? `
<h2>1. Solución Constructiva Base (LOSCAT Ed.13 2025)</h2>
<div class="data-row">
  <div class="data-item"><label>Código</label><span>${solucion.cod}</span></div>
  <div class="data-item"><label>Descripción</label><span>${solucion.desc}</span></div>
  <div class="data-item"><label>U certificado</label><span>${solucion.u} W/m²K</span></div>
</div>
<p style="font-size:10pt;color:#64748b">${solucion.obs || ''}</p>
` : '<h2>1. Solución Constructiva</h2>'}

${origCapas && cambios.length ? `
<h2>2. Capas — Configuración Original vs. Modificada</h2>
<div style="display:flex;gap:16px;flex-wrap:wrap">
  <div style="flex:1;min-width:280px">
    <h3>Original (${solucion?.cod || 'base'})</h3>
    <table><tr><th>#</th><th>Material</th><th>λ W/mK</th><th>e mm</th><th>μ</th></tr>
    ${filasCapa(origCapas)}</table>
  </div>
  <div style="flex:1;min-width:280px">
    <h3>Modificada (homologada)</h3>
    <table><tr><th>#</th><th>Material</th><th>λ W/mK</th><th>e mm</th><th>μ</th></tr>
    ${filasCapa(capas)}</table>
  </div>
</div>
<div class="aviso"><b>Cambios aplicados:</b> ${cambios.join(' · ')}</div>
` : `
<h2>2. Capas del Elemento (int → ext)</h2>
<table><tr><th>#</th><th>Material</th><th>λ W/mK</th><th>e mm</th><th>μ</th></tr>
${filasCapa(capas)}</table>`}

<h2>3. Gráfico de Temperatura y Condensación (Método Glaser — NCh1973:2014)</h2>
<div class="fig">
${svgStr}
<div class="fig-cap">Figura 1: Perfil de temperatura (azul) y punto de rocío (naranja) a través del elemento. Ti=${ti}°C · Te=${te}°C · HR=${hr}% · Zona ${proy.zona || '—'}. Elaborado según NCh1973:2014 / EN ISO 13788.</div>
</div>

<h2>4. Verificación Normativa</h2>
<table>
  <tr><th>Criterio</th><th>Valor calculado</th><th>Exigencia</th><th>Estado</th></tr>
  <tr>
    <td>Transmitancia térmica U (NCh853 / ISO 6946)</td>
    <td><b>${res.U} W/m²K</b></td>
    <td>${umax ? `≤ ${umax} W/m²K (DS N°15, Zona ${proy.zona||'—'})` : 'sin límite'}</td>
    <td><span class="${cumpleU?'badge-ok':'badge-no'}">${cumpleU?'CUMPLE':'NO CUMPLE'}</span></td>
  </tr>
  <tr>
    <td>Condensación intersticial (Glaser, NCh1973:2014)</td>
    <td>T rocío: <b>${res.Tdew}°C</b></td>
    <td>Sin condensación en interfaces (NCh1973:2014)</td>
    <td><span class="${!res.condInter?'badge-ok':'badge-no'}">${res.condInter?'RIESGO':'SIN RIESGO'}</span></td>
  </tr>
</table>

<h3>4.1 Detalle de Interfaces</h3>
<table>
  <tr><th>Interfaz</th><th>T °C</th><th>Pvsat Pa</th><th>Pvreal Pa</th><th>Margen</th><th>Estado</th></tr>
  ${filasIfaces}
</table>
<div style="font-size:9pt;color:#64748b">Condiciones: Ti=${ti}°C · Te=${te}°C · HR=${hr}% · RSi=${elemTipo==='piso'?'0.17':elemTipo==='techumbre'?'0.10':'0.13'} m²K/W · RSe=0.04 m²K/W</div>

${res.condInter
  ? `<div class="no-box">⚠ Se detecta riesgo de condensación intersticial — la solución requiere corrección antes de su aprobación DOM.</div>`
  : `<div class="ok-box">✓ Sin condensación intersticial en interfaces internas. La solución cumple las exigencias higrotérmicas de la NCh1973:2014.</div>`
}

${cambios.length && solucion ? `
<h2>5. Texto de Homologación (OGUC Art. 1.2.2)</h2>
<div class="homolog">${generarTextoHomologacion()}</div>
` : ''}

<hr style="margin-top:30px;border:none;border-top:1px solid #e2e8f0">
<p style="font-size:9pt;color:#94a3b8;text-align:center">
  Generado por Talora · ${fechaHoy} ·
  Normativa: LOSCAT Ed.13 2025 · DS N°15 MINVU · NCh853:2021 · ISO 6946:2017 · OGUC Título IV
</p>
</body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 800)
  }

  return (
    <div style={{ marginBottom: 8 }}>
      {/* ── Collapsible header ─────────────────────────────────────────────────── */}
      <div style={{ background: headerColor, color: '#fff', borderRadius: collapsed ? 8 : '8px 8px 0 0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setCollapsed(v => !v)}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
        {solucion && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 8px', fontSize: 11 }}>{solucion.cod}</span>}
        {res && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 8px', fontSize: 11 }}>U = {res.U} W/m²K</span>}
        {res && umax && (() => { const ok = uCumpleMax(res.U, umax); return <span style={{ background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#991b1b', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{ok ? 'CUMPLE' : 'NO CUMPLE'}</span> })()}
        {!res && !solucion && <span style={{ fontSize: 11, opacity: 0.7 }}>Sin datos — aplica una solución o agrega capas</span>}
        <span style={{ marginLeft: 'auto', fontSize: 16 }}>{collapsed ? '▼' : '▲'}</span>
      </div>

      {/* ── Panel body ─────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '12px' }}>
          {solucion && (
            <div style={{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:8, padding:'10px 16px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#0e6560' }}>📋 {solucion.cod} — {solucion.desc}</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{solucion.obs}</div>
                {solucion.esPDA ? (
                  <div style={{ fontSize:10, color:'#92400e', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:5, padding:'5px 8px', marginTop:4, lineHeight:1.5 }}>
                    <b>Ficha oficial PDA.</b> La <b>U oficial de cumplimiento es {solucion.uOficial} W/m²K</b> (NCh853, según la ficha MINVU). La U y la condensación que calcula esta pestaña son <b>referenciales</b> — sirven para analizar el sándwich (Glaser), usan λ estándar NCh853 y pueden diferir levemente del valor oficial.
                  </div>
                ) : (
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>LOSCAT Ed.13 2025 · Capas cargadas automáticamente · Resultado calculado según NCh853:2021 + ISO 6946</div>
                )}
              </div>
              <button onClick={() => { setSolucion(null); setCapas([]); setRes(null); setCorrec([]); if (onLimpiarCalcU) onLimpiarCalcU(elemKey) }}
                style={{ background:'#fff', border:'1px solid #fca5a5', borderRadius:5, padding:'4px 12px', cursor:'pointer', fontSize:11, color:'#dc2626', fontWeight:600 }}>
                🔄 Cambiar solución
              </button>
            </div>
          )}
          <div style={S.card}>
            <p style={S.h2}>Calculadora U + Condensación (NCh853 U · NCh1973 condensación / Glaser)</p>
            {/* ── Hint cuando no hay solución ni capas ───────────────────────── */}
            {!solucion && capas.length === 0 && (
              <div style={{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:6, padding:'8px 14px', marginBottom:10, fontSize:12, color:'#0e6560' }}>
                💡 Ve a la pestaña <b>Soluciones</b> para aplicar una solución constructiva, o agrega capas manualmente con el botón <b>+ Capa</b>.
              </div>
            )}
            <div style={{ ...S.col, fontSize: 12, color: '#64748b', marginBottom: 8 }}>
              <span style={S.label}>Condiciones diseño</span>
              Ti: {ti}°C | Te: {te}°C | HR int: {hr}% | HR ext: {hrExt}% {umax && `| U máx: ${umax} W/m²K`}
              {climaPda && <span style={{ color:'#92400e', fontWeight:600 }}> · clima exterior del PDA (julio)</span>}
            </div>
            {/* ── Tipo de piso (solo piso) ───────────────────────────────────── */}
            {elemId === 'piso' && (
              <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:6, padding:'8px 12px', marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#166534', marginBottom:6 }}>Tipo de piso</div>
                <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:4 }}>
                  {[['ventilado','🌬 Ventilado (sobramiento)'],['terreno','🏗 Sobre terreno (ISO 13370)'],['no_calef','🏠 Sobre espacio no calef.']].map(([v,l]) => (
                    <label key={v} style={{ fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                      <input type="radio" name={`pisoTipo-${elemKey}`} value={v} checked={pisoTipo===v} onChange={()=>setPisoTipo(v)} style={{ cursor:'pointer' }} />
                      {l}
                    </label>
                  ))}
                </div>
                {pisoTipo === 'ventilado' && <div style={{ fontSize:10, color:'#166534' }}>RSi = 0.17 m²K/W · RSe = 0.04 m²K/W (tabla oficial MINVU — descendente). El espacio ventilado se modela con Ru aparte.</div>}
                {pisoTipo === 'terreno' && (
                  <div>
                    <div style={{ fontSize:10, color:'#166534', marginBottom:6 }}>ISO 13370 simplificado — ingresa geometría para calcular Uf equivalente sobre terreno.</div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
                      <div><div style={{ fontSize:10, color:'#64748b', marginBottom:2 }}>Área piso Ag (m²)</div>
                        <input style={{ ...ist, width:70 }} value={pisoAg} onChange={e=>setPisoAg(e.target.value)} placeholder="80" /></div>
                      <div><div style={{ fontSize:10, color:'#64748b', marginBottom:2 }}>Perímetro expuesto Pg (m)</div>
                        <input style={{ ...ist, width:76 }} value={pisoPg} onChange={e=>setPisoPg(e.target.value)} placeholder="36" /></div>
                      <div><div style={{ fontSize:10, color:'#64748b', marginBottom:2 }}>λ suelo W/mK</div>
                        <input style={{ ...ist, width:58 }} value={pisoLg} onChange={e=>setPisoLg(e.target.value)} placeholder="2.0" /></div>
                      <div style={{ fontSize:10, color:'#64748b', lineHeight:1.5 }}>B′ = Ag / (0.5·Pg)</div>
                    </div>
                  </div>
                )}
                {pisoTipo === 'no_calef' && (
                  <div style={{ fontSize:11, color:'#166534', background:'#dcfce7', borderRadius:4, padding:'5px 8px', marginTop:4 }}>
                    ℹ Piso sobre espacio no calefaccionado (subterráneo, estacionamiento, etc.). Usar U calculado por ISO 6946 con RSi=0.17 m²K/W. No aplica corrección ISO 13370.
                  </div>
                )}
              </div>
            )}

            {/* ── Cámara ventilada (techo / muro fachada ventilada / piso) ─────── */}
            {(elemId === 'techo' || elemId === 'muro' || elemId === 'piso') && (
              <div style={{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:6, padding:'8px 12px', marginBottom:8 }}>
                <label style={{ fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={cubiertaVent} onChange={e=>setCubiertaVent(e.target.checked)} style={{ cursor:'pointer' }} />
                  <b style={{ color:'#0e6560' }}>{elemId === 'techo' ? 'Cubierta ventilada' : 'Cámara ventilada'}</b>
                  <span style={{ fontSize:11, color:'#64748b' }}>{elemId === 'techo' ? '(cámara de aire ventilada sobre el aislante)' : elemId === 'muro' ? '(fachada ventilada — cámara tras el revestimiento exterior)' : '(cámara ventilada bajo el piso)'}</span>
                </label>
                {cubiertaVent && !capas.some(c => c.esCamara) && (
                  <div style={{ marginTop:6, fontSize:11, color:'#92400e', background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:4, padding:'6px 10px', lineHeight:1.6 }}>
                    ⚠ <b>Falta la capa de cámara de aire.</b> Esta opción <b>no agrega</b> la cámara: aplica el método de cámara ventilada sobre una cámara que ya exista en las capas. Agrega una capa <b>"Cámara de aire"</b> (botón <b>+ Cámara</b> abajo) del lado exterior del aislante y vuelve a activar. Sin cámara, el cálculo no cambia.
                  </div>
                )}
                {cubiertaVent && capas.some(c => c.esCamara) && (
                  <div style={{ marginTop:6, fontSize:11, color:'#0e6560', background:'#ccfbf1', borderRadius:4, padding:'6px 10px', lineHeight:1.6 }}>
                    <b>ISO 6946 §6.9.3:</b> el cálculo considera <b>sólo las capas hacia el interior de la cámara</b> (las que quedan hacia el exterior están a condiciones exteriores y no contribuyen). La cara que da a la cámara ventilada usa <b>RSe = aire quieto ({(RSI_MAP[elemId === 'techo' ? 'techo' : elemId === 'piso' ? 'piso' : 'muro'] || 0.13).toFixed(2)} m²K/W)</b> (§6.9.4). Recalcula automáticamente.
                  </div>
                )}
              </div>
            )}

            {/* ── Corrección puentes térmicos ΔU (ISO 6946 §6.9.3) ──────────── */}
            {!esTabique && (
              <div style={{ background:'#fafafa', border:'1px solid #e2e8f0', borderRadius:6, padding:'7px 12px', marginBottom:8, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>ΔU puentes térmicos (ISO 6946 §6.9.3)</span>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <input style={{ ...ist, width:66 }} value={deltaU} onChange={e=>setDeltaU(e.target.value)} placeholder="0.00" />
                  <span style={{ fontSize:11, color:'#64748b' }}>W/m²K</span>
                </div>
                <span style={{ fontSize:10, color:'#94a3b8' }}>Corrección por estructuras, perfiles metálicos o juntas (opcional)</span>
              </div>
            )}

            <div style={S.sep} />
        <p style={S.h3}>Capas (interior → exterior)</p>
        <div className="nc-table-scroll">
        <table style={S.table}>
          <thead><tr>
            <th style={{ ...S.th, width:28 }}>#</th>
            <th style={S.th}>Material</th>
            <th style={S.th}>λ (W/mK)</th>
            <th style={S.th}>Espesor (mm)</th>
            <th style={S.th}>μ (—)</th>
            <th style={{ ...S.th, width:80 }}>Mover</th>
            <th style={{ ...S.th, width:36 }}></th>
          </tr></thead>
          <tbody>
            {capas.map((c, idx) => {
              const btnMv = (label, fn, disabled) => (
                <button onClick={fn} disabled={disabled}
                  style={{ background: disabled?'#f1f5f9':'#f8fafc', color: disabled?'#cbd5e1':'#374151', border:'1px solid #e2e8f0', borderRadius:4, padding:'1px 7px', cursor: disabled?'default':'pointer', fontSize:13, marginRight:2 }}>
                  {label}
                </button>
              )
              // Detectar si la capa es aislante (λ ≤ 0.05) para mostrar el toggle de EB
              const lamVal = parseFloat(c.lam) || 0
              const isAislante = !c.esCamara && lamVal > 0 && lamVal <= 0.05
              const tieneEB    = !!c.estructura_integrada
              const esAcero    = c.estructura_integrada?.tipo === 'acero'
              return (
                <React.Fragment key={c.id}>
                  {c.esCamara ? (
                    <tr style={{ background:'#f0fdfa' }}>
                      <td style={{ ...S.td, color:'#94a3b8', fontSize:10, textAlign:'center' }}>{idx+1}</td>
                      <td style={S.td}>
                        <i>Cámara de aire</i>
                        <button
                          onClick={()=>updEstructura(c.id,null,!tieneEB)}
                          title="Definir los rastreles/perfiles que forman la cámara (solo representación en el corte/3D — no altera el U)"
                          style={{ display:'block', marginTop:3, fontSize:10, padding:'1px 7px', borderRadius:3,
                            border:`1px solid ${tieneEB?(esAcero?'#fca5a5':'#fbbf24'):'#99f6e4'}`,
                            background: tieneEB?(esAcero?'#fee2e2':'#fef3c7'):'#f0fdfa',
                            color: tieneEB?(esAcero?'#991b1b':'#92400e'):'#0f766e', cursor:'pointer' }}>
                          {tieneEB ? (esAcero ? '⚡ Perfiles de acero' : '🪵 Rastreles de madera') : '⊕ Estructura de la cámara'}
                        </button>
                      </td>
                      {/* λ col: R según espesor (ISO 6946) */}
                      <td style={{ ...S.td, fontSize:11, color:'#0f766e' }}>
                        R={resistenciaCamara((parseFloat(c.esp)||0)/1000).toFixed(2)}
                      </td>
                      {/* Espesor editable (mm). Vacío → 0.18 legado */}
                      <td style={S.td}>
                        <input style={{ ...ist, width:70 }} value={c.esp} onChange={e=>updCapa(c.id,'esp',e.target.value)} placeholder="≥25" title="Espesor de cámara en mm (ISO 6946: 5→0.11, 10→0.15, ≥25→0.18)"/>
                      </td>
                      <td style={S.td}>≈1</td>
                      <td style={S.td}>{btnMv('↑', ()=>moveUp(c.id), idx===0)}{btnMv('↓', ()=>moveDown(c.id), idx===capas.length-1)}</td>
                      <td style={S.td}><button style={{ ...S.btn('#dc2626'), padding:'2px 8px' }} onClick={()=>delCapa(c.id)}>✕</button></td>
                    </tr>
                  ) : (
                    <tr style={tieneEB ? { background: esAcero ? '#fff1f2' : '#fffbeb' } : {}}>
                      <td style={{ ...S.td, color:'#94a3b8', fontSize:10, textAlign:'center' }}>
                        {idx+1}
                        {tieneEB && <div style={{ fontSize:9, fontWeight:700, color: esAcero ? '#dc2626' : '#92400e', letterSpacing:0, marginTop:1 }}>{esAcero?'⚡TB':'🪵TB'}</div>}
                      </td>
                      <td style={S.td}>
                        <select style={{ ...ist, width:196 }} value={c.mat} onChange={e=>setMat(c.id,e.target.value)}>
                          <option value="">Seleccionar material...</option>
                          {c.mat && !ALL_MATS.find(x=>x.n===c.mat) && (
                            <option value={c.mat}>{c.mat} *</option>
                          )}
                          {/* Filtra por elemento: los techos muestran cubiertas (PV4/PV5/
                              Zincalum/Teja asfáltica/Fibrocemento Gran Onda) + materiales
                              universales; los muros excluyen cubiertas de techumbre. */}
                          {filterMatsByElem(elemTipo).map(g=>(
                            <optgroup key={g.g} label={g.g}>
                              {g.items.map(m=><option key={m.n} value={m.n}>{m.n}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        {isAislante && (
                          <button
                            onClick={()=>updEstructura(c.id,null,!tieneEB)}
                            title="Definir montantes de madera o acero en esta capa (ISO 6946 método combinado)"
                            style={{ display:'block', marginTop:3, fontSize:10, padding:'1px 7px', borderRadius:3,
                              border:`1px solid ${tieneEB?(esAcero?'#fca5a5':'#fbbf24'):'#e2e8f0'}`,
                              background: tieneEB?(esAcero?'#fee2e2':'#fef3c7'):'#f8fafc',
                              color: tieneEB?(esAcero?'#991b1b':'#92400e'):'#94a3b8', cursor:'pointer' }}>
                            {tieneEB ? (esAcero ? '⚡ Acero activo' : '🪵 Madera activa') : '⊕ Estructura integrada'}
                          </button>
                        )}
                      </td>
                      <td style={S.td}><input style={{ ...ist, width:60 }} value={c.lam} onChange={e=>updCapa(c.id,'lam',e.target.value)} placeholder="0.04"/></td>
                      <td style={S.td}><input style={{ ...ist, width:70 }} value={c.esp} onChange={e=>updCapa(c.id,'esp',e.target.value)} placeholder="100"/></td>
                      <td style={S.td}><input style={{ ...ist, width:60 }} value={c.mu} onChange={e=>updCapa(c.id,'mu',e.target.value)} placeholder="1"/></td>
                      <td style={S.td}>{btnMv('↑', ()=>moveUp(c.id), idx===0)}{btnMv('↓', ()=>moveDown(c.id), idx===capas.length-1)}</td>
                      <td style={S.td}><button style={{ ...S.btn('#dc2626'), padding:'2px 8px' }} onClick={()=>delCapa(c.id)}>✕</button></td>
                    </tr>
                  )}
                  {/* ── Panel de estructura integrada (ISO 6946) / rastreles de cámara ─ */}
                  {tieneEB && (
                    <tr style={{ background: esAcero ? '#fff1f2' : '#fffbeb' }}>
                      <td />
                      <td colSpan={6} style={{ padding:'6px 14px 10px' }}>
                        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', fontSize:11 }}>
                          <span style={{ fontWeight:700, color: esAcero?'#dc2626':'#92400e', fontSize:11, whiteSpace:'nowrap' }}>
                            {c.esCamara
                              ? '⚙ Rastreles/perfiles de la cámara · representación (no altera el U)'
                              : '⚙ Estructura integrada · ISO 6946:2017 método combinado'}
                          </span>
                          <select
                            value={c.estructura_integrada.tipo}
                            onChange={e=>updEstructura(c.id,'tipo',e.target.value)}
                            style={{ ...ist, fontSize:11 }}
                          >
                            {Object.entries(STRUCT_MATS).map(([k,v])=>(
                              <option key={k} value={k}>{v.label} — λ={v.lam} W/mK</option>
                            ))}
                          </select>
                          <label style={{ display:'flex', alignItems:'center', gap:4, color:'#64748b', whiteSpace:'nowrap' }}>
                            Ancho montante
                            <input
                              style={{ ...ist, width:46, fontSize:11 }}
                              value={c.estructura_integrada.ancho_mm}
                              onChange={e=>updEstructura(c.id,'ancho_mm',e.target.value)}
                            />
                            mm
                          </label>
                          <label style={{ display:'flex', alignItems:'center', gap:4, color:'#64748b', whiteSpace:'nowrap' }}>
                            Distanciamiento
                            <input
                              style={{ ...ist, width:52, fontSize:11 }}
                              value={c.estructura_integrada.distancia_mm}
                              onChange={e=>updEstructura(c.id,'distancia_mm',e.target.value)}
                            />
                            mm
                          </label>
                          {c.estructura_integrada.distancia_mm > 0 && (
                            <span style={{ fontSize:10, color:'#64748b', fontStyle:'italic', whiteSpace:'nowrap' }}>
                              {c.esCamara
                                ? `modulación cada ${c.estructura_integrada.distancia_mm} mm`
                                : `f_a=${((c.estructura_integrada.ancho_mm/c.estructura_integrada.distancia_mm)*100).toFixed(1)}% estr. · f_b=${((1-c.estructura_integrada.ancho_mm/c.estructura_integrada.distancia_mm)*100).toFixed(1)}% ais.`}
                            </span>
                          )}
                          <button
                            onClick={()=>updEstructura(c.id,null,false)}
                            style={{ marginLeft:'auto', fontSize:10, padding:'2px 8px', background:'#fee2e2', color:'#dc2626', border:'1px solid #fca5a5', borderRadius:4, cursor:'pointer', whiteSpace:'nowrap' }}>
                            ✕ Quitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
        </div>
        <div style={{ ...S.row, marginTop:8 }}>
          <button style={S.btn('#64748b')} onClick={addCapa}>+ Capa</button>
          <button style={S.btn('#0f766e')} onClick={addCamara}>+ Cámara</button>
          <button style={S.btn()} onClick={calcular}>Calcular U</button>
          {origCapas?.length > 0 && detectarCambios().length > 0 && (
            <button style={S.btn('#b45309')} onClick={restaurarOriginal}
              title="Descartar las modificaciones y volver a la solución original del LOSCAT para probar otra corrección">
              ↩ Volver a la solución original
            </button>
          )}
          {capas.length>0 && <span style={{ fontSize:11, color:'#94a3b8', alignSelf:'center' }}>↑↓ Mueve capas y recalcula para homologar</span>}
        </div>
      </div>

      {/* ── Corte de capas (en vivo, se actualiza al reordenar/editar) ────────── */}
      {capas.length > 0 && (() => {
        const pisoSubtipo = elemTipo === 'piso'
          ? (cortePisoModo || (pisoTipo === 'terreno' ? 'radier' : 'entrepiso'))
          : undefined
        return (
        <div style={{ ...S.card }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
            <p style={{ ...S.h2, margin:0, fontSize:13 }}>Corte de capas</p>
            <span style={{ fontSize:11, color:'#94a3b8' }}>· en vivo al reordenar/editar</span>
            <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
              {elemTipo === 'piso' && (
                <div style={{ display:'flex', border:'1px solid #e2e8f0', borderRadius:6, overflow:'hidden' }}>
                  {[['radier','Radier (a suelo)'],['entrepiso','Entrepiso']].map(([v,l]) => {
                    const activo = pisoSubtipo === v
                    return (
                      <button key={v} onClick={() => setCortePisoModo(v)}
                        style={{ fontSize:11, padding:'3px 9px', border:'none', cursor:'pointer',
                          background: activo ? '#0f766e' : '#fff', color: activo ? '#fff' : '#64748b' }}>{l}</button>
                    )
                  })}
                </div>
              )}
              <button onClick={() => setCorteInvert(v => !v)} title="Invertir el orden mostrado (por si el guardado viene al revés)"
                style={{ fontSize:11, padding:'3px 9px', border:'1px solid #e2e8f0', borderRadius:6,
                  background: corteInvert ? '#0f766e' : '#fff', color: corteInvert ? '#fff' : '#64748b', cursor:'pointer' }}>⇅ Invertir</button>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(330px, 1fr))', gap:16, alignItems:'start' }}>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5, fontWeight:600 }}>Corte a escala</div>
              <div style={{ color:'#334155', overflowX:'auto' }}
                   dangerouslySetInnerHTML={{ __html: corteSVG(capas, { elemTipo, invert: corteInvert, pisoSubtipo }) }} />
            </div>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5, fontWeight:600 }}>Modelo 3D <span style={{ fontWeight:400 }}>· arrastra para rotar</span></div>
              <Modelo3D capas={capas} elemTipo={elemTipo} invert={corteInvert} pisoSubtipo={pisoSubtipo} height={300} />
            </div>
          </div>
        </div>
        )
      })()}

      {res && res.temps && res.temps.length > 0 && (()=>{
        // ΔU corrección puentes térmicos (ISO 6946 §6.9.3)
        const dU    = parseFloat(deltaU) || 0
        const uCalc = parseFloat(res.U) + dU
        const uCorrStr = uCalc.toFixed(3)
        const cumpleU      = !umax || uCumpleMax(uCalc, umax)
        const tSupExt      = parseFloat(res.temps[res.temps.length-1]).toFixed(2)
        const supExtBajaTd = parseFloat(tSupExt) < parseFloat(res.Tdew)
        const cumpleTodo   = cumpleU && (esTabique || !res.condInter)

        // ── fRsi — factor de temperatura superficial interior (NCh853:2021 §6) ──
        // RSi desde RSI_MAP (única fuente de verdad) en vez de constantes inline
        // duplicadas — evita que se desincronicen si cambia el mapa.
        const _rsiKey = elemTipo === 'techumbre' ? 'techo' : elemTipo === 'piso' ? 'piso' : 'muro'
        const RSi_val = RSI_MAP[_rsiKey] || 0.13
        const Rtot_val = parseFloat(res.Rtot) || 0
        const fRsi      = Rtot_val > 0 ? 1 - RSi_val / Rtot_val : 1
        const Tsi_int   = Rtot_val > 0 ? ti - (RSi_val / Rtot_val) * (ti - te) : ti
        const Tdew_v    = parseFloat(res.Tdew)
        const fRsi_min  = (ti - te) > 0 ? (Tdew_v - te) / (ti - te) : 0
        const cumpleFRsi = Tsi_int >= Tdew_v

        // ── ISO 13370 — piso sobre terreno ──────────────────────────────────────
        let iso13370 = null
        if (elemId === 'piso' && pisoTipo === 'terreno' && parseFloat(pisoAg)>0 && parseFloat(pisoPg)>0) {
          const Ag = parseFloat(pisoAg), Pg = parseFloat(pisoPg), lg = parseFloat(pisoLg)||2.0
          const Rf_m2K = parseFloat(res.Rtot) - RSi_val - 0.04 // R capas (sin Rs)
          const Bp   = Ag / (0.5 * Pg)
          const w    = 0.20 // espesor muro perimetral supuesto 0.20 m
          const dt   = w + lg * (RSi_val + (Rf_m2K > 0 ? Rf_m2K : 0))
          const Uf   = dt < Bp
            ? (2 * lg) / (Math.PI * Bp + dt) * Math.log(Math.PI * Bp / dt + 1)
            : lg / (0.457 * Bp + dt)
          iso13370 = { Uf: Uf.toFixed(3), Bp: Bp.toFixed(2), dt: dt.toFixed(3), cumple: !umax || uCumpleMax(Uf, umax) }
        }
        const cambios      = detectarCambios()
        const hayModif     = cambios.length > 0

        return (
        <div>
          {/* ── Panel de diagnóstico de incumplimiento ──────────────────────── */}
          {(!cumpleU || (!esTabique && res.condInter)) && (
            <div style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:8, padding:'12px 16px', marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#991b1b', marginBottom:8 }}>❌ Incumplimiento normativo detectado</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {!cumpleU && umax && (
                  <div style={{ fontSize:12 }}>
                    <b style={{ color:'#dc2626' }}>Térmica:</b> U calculado <b>{res.U} W/m²K</b> supera el máximo DS N°15 para zona {proy.zona||'—'}: ≤ {umax} W/m²K.{' '}
                    <span style={{ color:'#374151' }}>
                      Se requiere ΔR adicional de <b>{((1/umax - 1/uCalc)).toFixed(3)} m²K/W</b>.{' '}
                      {(()=>{
                        const ais = capas.find(c => !c.esCamara && parseFloat(c.lam) <= 0.05)
                        if (!ais) return 'Agregue un aislante o aumente el existente.'
                        const dEsp = Math.ceil((1/umax - 1/uCalc) * parseFloat(ais.lam) * 1000 / 5) * 5
                        return `Con ${ais.mat} (λ=${ais.lam}): aumente espesor en ~${dEsp} mm.`
                      })()}
                    </span>
                  </div>
                )}
                {!esTabique && res.condInter && res.ifaces.filter(f=>f.riesgo).map(f=>(
                  <div key={f.i} style={{ fontSize:12 }}>
                    <b style={{ color:'#dc2626' }}>Condensación en Int. {f.i}:</b> T={f.T}°C — Pvreal ({f.pvReal} Pa) {'>'} Pvsat ({f.pvSat} Pa), déficit <b>{Math.abs(f.margen)} Pa</b>.{' '}
                    <span style={{ color:'#374151' }}>Mueva el aislante hacia la cara exterior (↓) y recalcule.</span>
                  </div>
                ))}
              </div>
              {(!esTabique && res.condInter || !cumpleU) && (
                <div style={{ marginTop:8, fontSize:11, color:'#7f1d1d', background:'#fff1f2', borderRadius:5, padding:'6px 10px' }}>
                  💡 Ajusta espesores y presiona <b>Calcular U</b> para verificar.
                </div>
              )}
            </div>
          )}

          <div style={S.card}>
            {/* ── Resultado U destacado (Design) ─────────────────────────────── */}
            {!esTabique && umax && (
              <div style={{ marginBottom: 14 }}>
                <ResultadoU
                  uTotal={uCalc}
                  uMax={umax}
                  zona={proy.zona || '—'}
                />
              </div>
            )}

            {/* ── Cards de resumen ───────────────────────────────────────────── */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              {(esTabique ? [
                { label:'U calculado', val:`${uCorrStr} W/m²K`, bg: colSem(uCalc)+'18', border: colSem(uCalc), col: colSem(uCalc) },
              ] : [
                { label:'T rocío',      val:`${res.Tdew}°C`,                          bg:'#f8fafc', border:'#e2e8f0', col:'#374151' },
                { label:'T sup. ext.',  val:`${tSupExt}°C`,                           bg:'#f8fafc', border:'#e2e8f0', col:'#374151' },
                { label:'T sup. int.',  val:`${Tsi_int.toFixed(1)}°C`,                bg: cumpleFRsi?'#f0fdf4':'#fee2e2', border: cumpleFRsi?'#86efac':'#fca5a5', col: cumpleFRsi?'#166534':'#dc2626' },
                { label:'fRsi',         val:`${fRsi.toFixed(3)}`,                     bg: cumpleFRsi?'#f0fdf4':'#fee2e2', border: cumpleFRsi?'#86efac':'#fca5a5', col: cumpleFRsi?'#166534':'#dc2626' },
                // T sup. ext < Td interior: NO es criterio normativo, solo informativo.
                // NCh853 evalúa fRsi (interior) e intersticial. La cara exterior
                // está en contacto con aire EXTERIOR, no interior — el Td interior
                // no aplica físicamente para evaluar condensación superficial exterior.
                { label:'Sup. exterior',val: supExtBajaTd?'Normal (frío)':'Sobre Td int.', bg: '#f1f5f9', border:'#cbd5e1', col:'#475569' },
                { label:'Intersticial', val: res.condInter?'RIESGO':'SIN RIESGO',     bg: res.condInter?'#fee2e2':'#dcfce7', border: res.condInter?'#fca5a5':'#86efac', col: res.condInter?'#dc2626':'#166534' },
                { label:'U calculado',  val:`${uCorrStr} W/m²K`,                      bg: colSem(uCalc)+'18', border: colSem(uCalc), col: colSem(uCalc) },
              ]).map(c=>(
                <div key={c.label} style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:8, padding:'8px 14px', textAlign:'center', minWidth:100, flex:1 }}>
                  <div style={{ fontSize:10, color:'#64748b', marginBottom:3 }}>{c.label}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:c.col }}>{c.val}</div>
                </div>
              ))}
            </div>
            {umax && <div style={{ marginBottom:10 }}>
              <span style={S.badge(cumpleU)}>{cumpleU?`✓ U cumple DS N°15 (máx ${umax} W/m²K)`:`✗ U no cumple DS N°15 (máx ${umax} W/m²K)`}</span>
              {dU > 0 && <span style={{ fontSize:11, color:'#64748b', marginLeft:8 }}>U ISO 6946: {res.U} + ΔU: {dU.toFixed(3)} = {uCorrStr} W/m²K</span>}
            </div>}

            {/* ── Desglose de R (Design) ──────────────────────────────────────── */}
            {!esTabique && res.Rs?.length > 0 && (
              <div style={{
                background: 'var(--bg-alt)',
                border: '1px solid var(--line-soft)',
                borderRadius: 8,
                padding: '14px 18px',
                marginBottom: 12,
              }}>
                <DesgloseR
                  capas={capas
                    .filter(c => c.esCamara || (parseFloat(c.esp) > 0))
                    .map((c, i) => ({
                      n: c.esCamara
                        ? 'Cámara aire'
                        : (c.mat || '—'),
                      esp: parseFloat(c.esp) || 0,
                      lam: parseFloat(c.lam) || 0.04,
                      R: res.Rs?.[i + 1],   // Rs[0]=RSi, Rs[1..n]=capas, Rs[n+1]=RSe
                      highlight: !c.esCamara && parseFloat(c.lam) > 0 && parseFloat(c.lam) <= 0.05,
                    }))}
                  rsi={res.Rs?.[0] ?? 0.13}
                  rse={res.Rs?.[res.Rs.length - 1] ?? 0.04}
                />
              </div>
            )}

            {/* ── Nota técnica tabique (sin Glaser) ──────────────────────────── */}
            {esTabique && (
              <div style={{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:6, padding:'8px 14px', fontSize:12, color:'#0f766e', marginBottom:8 }}>
                ℹ <b>Tabique interior</b> — La verificación higrotérmica (Método de Glaser, NCh853:2021) aplica exclusivamente a elementos de la envolvente en contacto con el exterior. No corresponde aplicarla a tabiques interiores.
              </div>
            )}

            {/* ── Gráfico SVG (solo envolvente) ──────────────────────────────── */}
            {!esTabique && <>
              <GraficoGlaser ref={graphRef} res={res} capas={capas} elemTipo={elemTipo} />
              <div style={{ fontSize:9, color:'#94a3b8', marginBottom:10 }}>
                Azul = temperatura · Naranja = punto de rocío · Rojo = interfaz con riesgo
              </div>
            </>}

            {/* ── Tabla de interfaces (solo envolvente) ──────────────────────── */}
            {!esTabique && res.ifaces?.length>0&&(
              <>
                <div style={S.sep}/>
                <div className="nc-table-scroll">
                <table style={S.table}>
                  <thead><tr>{['Interfaz','T °C','Pvsat Pa','Pvreal Pa','Margen','Estado'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {res.ifaces.map(f=>(
                      <tr key={f.i} style={{ background:f.riesgo?'#fee2e2':'transparent' }}>
                        <td style={S.td}>Int. {f.i}</td>
                        <td style={S.td}>{f.T}</td>
                        <td style={S.td}>{f.pvSat}</td>
                        <td style={S.td}>{f.pvReal}</td>
                        <td style={{ ...S.td, fontWeight:700, color:f.margen>=0?'#166534':'#dc2626' }}>{f.margen>=0?`+${f.margen}`:f.margen}</td>
                        <td style={S.td}><span style={S.badge(!f.riesgo)}>{f.riesgo?'CONDENSACIÓN':'OK'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}

            {/* ── Banners normativos (solo envolvente) ───────────────────────── */}
            {!esTabique && (
            <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
              {!res.condInter&&<div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:6, padding:'8px 14px', fontSize:12, color:'#166534', fontWeight:600 }}>✓ Sin condensación intersticial — interfaces internas OK.</div>}
              {res.condInter&&<div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, padding:'8px 14px', fontSize:12, color:'#991b1b', fontWeight:600 }}>⚠ Riesgo de condensación intersticial — reordena capas con ↑↓ y recalcula.</div>}
              {supExtBajaTd && !res.condInter && (
                <div style={{ background:'#f0fdfa', border:'1px solid #99f6e4', borderLeft:'4px solid #0f766e', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#115e59', lineHeight:1.6 }}>
                  <b>ℹ Información — no es problema normativo.</b> La superficie exterior está a {tSupExt}°C, bajo el punto de rocío del aire interior ({res.Tdew}°C). Esto es <b>físicamente normal en invierno</b> y no constituye incumplimiento:
                  <ul style={{ margin:'4px 0 0 18px', padding:0 }}>
                    <li><b>NCh853:2021</b> evalúa condensación superficial <b>interior</b> (fRsi ≥ 0.83 ✓ aquí cumple) e <b>intersticial</b> (método Glaser). No exige verificar la cara exterior como criterio de cumplimiento.</li>
                    <li>La cara exterior está en contacto con el <b>aire exterior</b> (no el interior). El punto de rocío relevante sería el exterior, que con HR 80% típica es cercano a Te — por lo que rara vez se condensa por aire exterior.</li>
                    {elemTipo === 'piso' && <li>En <b>piso ventilado</b>, la cara inferior queda expuesta al sobramiento sin recinto habitable detrás — el comportamiento es esperado.</li>}
                    <li>Solo importa para <b>durabilidad del material</b> si es poroso y queda expuesto (madera sin tratamiento, paneles fibrosos hidrofílicos). Para revestimientos cementicios, EIFS, fibrocemento, planchas metálicas con barrera o pinturas hidrofugantes <b>no aplica</b>.</li>
                  </ul>
                </div>
              )}
              {supExtBajaTd&&!res.condInter&&elemTipo==='piso'&&(
                <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:6, padding:'8px 14px', fontSize:12, color:'#9a3412' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', cursor:'pointer' }} onClick={()=>setShowInterpret(v=>!v)}>
                    <b>△ Interpretación técnica — piso ventilado</b><span>{showInterpret?'▲':'▼'}</span>
                  </div>
                  {showInterpret&&<div style={{ marginTop:8, background:'#fffbeb', border:'1px solid #fde68a', borderRadius:5, padding:'10px 12px', fontSize:11, fontStyle:'italic', color:'#78350f', lineHeight:1.6 }}>
                    "El elemento analizado corresponde a losa de piso ventilado. El análisis NCh853 (Método Glaser) no detecta condensación intersticial en ninguna interfaz. La condensación superficial en cara exterior es inherente a la condición de exposición del sobramiento y no constituye riesgo higrotérmico para la habitabilidad. Se cumple U ≤ {umax||'—'} W/m²K conforme DS N°15 MINVU."
                  </div>}
                </div>
              )}
            </div>
            )}

            {/* ── fRsi — condensación superficial interior (NCh853:2021 §6) ──── */}
            {!esTabique && (
              <div style={{ marginTop:8, background: cumpleFRsi?'#f0fdf4':'#fef2f2', border:`1px solid ${cumpleFRsi?'#86efac':'#fca5a5'}`, borderRadius:6, padding:'8px 14px', fontSize:12 }}>
                <div style={{ fontWeight:700, color: cumpleFRsi?'#166534':'#991b1b', marginBottom:4 }}>
                  {cumpleFRsi ? '✓ Sin condensación superficial interior (fRsi OK)' : '⚠ Riesgo de condensación superficial interior'}
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', color:'#374151' }}>
                  <span>T sup. int. = <b>{Tsi_int.toFixed(2)}°C</b></span>
                  <span>T rocío = <b>{res.Tdew}°C</b></span>
                  <span>fRsi = <b>{fRsi.toFixed(4)}</b></span>
                  <span>fRsi mín requerido = <b>{fRsi_min.toFixed(4)}</b></span>
                </div>
                {!cumpleFRsi && <div style={{ marginTop:4, fontSize:11, color:'#991b1b' }}>
                  La temperatura superficial interior ({Tsi_int.toFixed(1)}°C) está bajo el punto de rocío ({res.Tdew}°C). Riesgo de condensación o moho en la cara interior. Mejora el aislamiento (aumenta Rtot) o reduce la HR interior.
                </div>}
                {/* ── Criterio de moho 75% (NCh1973) — INFORMATIVO, no gate ──── */}
                {res.fRsiMin75 != null && (
                  <div style={{ marginTop:6, paddingTop:6, borderTop:'1px dashed #cbd5e1', fontSize:11, color:'#374151' }}>
                    <span style={{ fontWeight:700, color:'#6d28d9' }}>🦠 Criterio de moho (NCh1973 · 75% HR sup.):</span>{' '}
                    fRsi mín (moho) = <b>{res.fRsiMin75}</b> · T sup. mín = <b>{res.TsiMin75}°C</b> →{' '}
                    {res.riesgoMoho
                      ? <span style={{ color:'#b45309', fontWeight:600 }}>riesgo de moho indicativo</span>
                      : <span style={{ color:'#166534', fontWeight:600 }}>sin riesgo de moho</span>}
                    <div style={{ marginTop:2, fontSize:10, color:'#94a3b8', fontStyle:'italic' }}>
                      Indicativo, no normativo para U. Con HR interior alta ({hr}%) el umbral 75% es muy
                      exigente (el aire interior ya está cerca del 75%). El criterio de cumplimiento DOM
                      es la condensación (rocío) y el U; el moho se gestiona con ventilación (NCh3309).
                    </div>
                  </div>
                )}
                <div style={{ marginTop:4, fontSize:10, color:'#64748b' }}>
                  NCh1973:2014 §6 · fRsi = 1 − RSi/Rtot · Tsi = Ti − (RSi/Rtot)·(Ti−Te) · RSi = {RSi_val} m²K/W · Rtot = {res.Rtot} m²K/W
                </div>
              </div>
            )}

            {/* ── ISO 13370 — piso sobre terreno ─────────────────────────────── */}
            {iso13370 && (
              <div style={{ marginTop:8, background:'#fefce8', border:'1px solid #fde047', borderRadius:6, padding:'8px 14px', fontSize:12 }}>
                <div style={{ fontWeight:700, color:'#713f12', marginBottom:4 }}>
                  📐 Transmitancia térmica piso sobre terreno — ISO 13370 (simplificado)
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', color:'#374151', marginBottom:4 }}>
                  <span>Uf = <b>{iso13370.Uf} W/m²K</b></span>
                  <span>B′ = <b>{iso13370.Bp} m</b></span>
                  <span>dt = <b>{iso13370.dt} m</b></span>
                  {umax && <span>Límite DS N°15 = <b>{umax} W/m²K</b> → <b style={{ color: iso13370.cumple?'#166534':'#dc2626' }}>{iso13370.cumple?'CUMPLE':'NO CUMPLE'}</b></span>}
                </div>
                <div style={{ fontSize:11, color:'#92400e' }}>
                  ⚠ Para verificación energética DS N°15, usar <b>Uf (ISO 13370)</b> en lugar del U por ISO 6946. El análisis Glaser sigue siendo válido para verificar condensación intersticial en las capas.
                </div>
                <div style={{ fontSize:10, color:'#64748b', marginTop:3 }}>
                  ISO 13370 §9.1 · B′ = Ag/(0.5·Pg) · dt = w + λg·(RSi + Rf) · Ag = {pisoAg} m² · Pg = {pisoPg} m · λg = {pisoLg} W/mK
                </div>
              </div>
            )}

            {/* ── Puente térmico metálico (alerta ISO 6946) ──────────────────── */}
            {res.aviso_puente && (
              <div style={{ background:'#fff1f2', border:'1.5px solid #fca5a5', borderRadius:8, padding:'12px 16px', marginTop:10 }}>
                <div style={{ fontWeight:700, color:'#dc2626', fontSize:13, marginBottom:6 }}>
                  ⚡ Puente Térmico Metálico Detectado — Alerta Crítica (ISO 6946:2017)
                </div>
                <div style={{ fontSize:12, color:'#991b1b', marginBottom:8 }}>
                  La transmitancia aumentó un <b>{res.aviso_puente.pct}%</b> respecto a un muro sin
                  estructura de acero. Los perfiles metálicos cortocircuitan térmicamente el aislante.{' '}
                  <b>Se recomienda agregar aislación exterior continua (EIFS/SATE) para romper el puente.</b>
                </div>
                <div style={{ display:'flex', gap:20, fontSize:12, color:'#64748b', flexWrap:'wrap', marginBottom:6 }}>
                  <div>U sin puente térmico: <b style={{color:'#166534'}}>{res.aviso_puente.U_sin_tb} W/m²K</b></div>
                  <div>U con puente térmico: <b style={{color:'#dc2626'}}>{res.aviso_puente.U_con_tb} W/m²K</b></div>
                  <div>Incremento: <b style={{color:'#dc2626'}}>+{res.aviso_puente.pct}%</b></div>
                </div>
                {res.iso6946 && (
                  <div style={{ fontSize:10, color:'#94a3b8', borderTop:'1px solid #fecaca', paddingTop:6, marginTop:4, fontFamily:'monospace' }}>
                    ISO 6946 · R'_T (sup.)={res.iso6946.R_upper} m²K/W (caminos paralelos)
                    · R''_T (inf.)={res.iso6946.R_lower} m²K/W (planos isotérmicos)
                    · R_T={(parseFloat(res.iso6946.R_upper)/2+parseFloat(res.iso6946.R_lower)/2).toFixed(4)} m²K/W
                    · f_a={((res.aviso_puente.fa||0)*100).toFixed(1)}%
                  </div>
                )}
              </div>
            )}

            {/* ── Desglose ISO 6946 (madera, sin alerta crítica) ─────────────── */}
            {res.iso6946 && !res.aviso_puente && (
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:6, padding:'8px 14px', marginTop:10, fontSize:11, color:'#92400e' }}>
                <b>⚙ ISO 6946 Método Combinado</b> · Puente térmico de montantes de madera detectado.
                <span style={{ color:'#64748b', marginLeft:8, fontFamily:'monospace', fontSize:10 }}>
                  R'_T (sup.)={res.iso6946.R_upper} · R''_T (inf.)={res.iso6946.R_lower} · R_T={res.iso6946.R_T} m²K/W
                  · f_a={((res.iso6946.fa||0)*100).toFixed(1)}% estr. / f_b={((res.iso6946.fb||0)*100).toFixed(1)}% ais.
                </span>
              </div>
            )}

            {/* ── Correcciones sugeridas ──────────────────────────────────────── */}
            {calcuando&&(
              <div style={{ display:'flex',alignItems:'center',gap:8,color:'#64748b',fontSize:13,padding:'10px 0' }}>
                <div style={{ width:16,height:16,border:'2px solid #e2e8f0',borderTopColor:'#0e6560',borderRadius:'50%',animation:'spin 0.8s linear infinite',flexShrink:0 }}/>
                Calculando correcciones normativas…
              </div>
            )}
            {!calcuando&&correc.length>0&&(
              <>
                <div style={S.sep}/>
                {modoOptimiz ? (
                  <>
                    <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:6, padding:'9px 14px', marginBottom:8, fontSize:12 }}>
                      <b style={{ color:'#166534' }}>✓ La solución ya cumple DS N°15</b>
                      <span style={{ color:'#374151' }}> — U&nbsp;=&nbsp;{parseFloat(res?.U).toFixed(4)}&nbsp;W/m²K ≤ {umax}&nbsp;W/m²K.
                      Las siguientes son sugerencias opcionales para optimizar el desempeño hacia&nbsp;U&nbsp;≤&nbsp;{(umax*0.9).toFixed(2)}&nbsp;W/m²K.</span>
                    </div>
                    <p style={S.h3}>💡 Sugerencias de optimización (opcional)</p>
                  </>
                ) : (
                  <p style={S.h3}>⚠ Correcciones requeridas (NCh853)</p>
                )}
                {correc.map(c=>{
                  // ── Análisis económico (solo Pro) ─────────────────────────
                  const usuarioPro = isPro(perfil)
                  const areaDef = elemId === 'piso' || elemId === 'techo' || elemTipo === 'techumbre' ? 40 : elemId === 'tabique' ? 20 : 30
                  const econ = usuarioPro
                    ? analizarCorreccion({
                        correccion: c,
                        uAntes:     parseFloat(res?.U) || 0,
                        areaM2:     areaDef,
                        proy:       proy,
                        configEnergetica: proy?.configEnergetica,
                      })
                    : null
                  return (
                  <div key={c.id} style={{ border:`1px solid ${c.color}`, borderRadius:6, padding:'10px 12px', marginBottom:8, background: c.compatible_loscat ? '#f0fdf4' : '#fff' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        {/* Título + badges */}
                        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                          <b style={{ color:c.color }}>{c.titulo}</b>
                          {c.sistema && (
                            <span style={{ fontSize:10, background:c.color+'22', color:c.color, borderRadius:4, padding:'1px 7px', fontWeight:700, whiteSpace:'nowrap' }}>
                              {c.sistema}
                            </span>
                          )}
                          {c.compatible_loscat && (
                            <span style={{ fontSize:10, background:'#dcfce7', color:'#166534', borderRadius:4, padding:'1px 7px', fontWeight:600, whiteSpace:'nowrap' }}>
                              ✓ Homologable LOSCAT
                            </span>
                          )}
                        </div>
                        {/* Descripción */}
                        <div style={{ fontSize:12, marginTop:2, color:'#1e293b' }}>{c.descripcion}</div>
                        {/* Cambio → impacto */}
                        <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{c.cambio} → {c.impactoU}</div>

                        {/* ── Chips de análisis económico (Pro) ─────────── */}
                        {econ && (
                          <div style={{
                            display:'flex', gap:6, flexWrap:'wrap', marginTop:8,
                            paddingTop:8, borderTop:'1px dashed #e2e8f0',
                          }}>
                            <span title={`Rango: CLP ${econ.rangoMin.toLocaleString('es-CL')} – ${econ.rangoMax.toLocaleString('es-CL')} para ${areaDef} m²`}
                              style={{ fontSize:11, fontWeight:700, background:'#fef3c7', color:'#92400e', border:'1px solid #fde047', borderRadius:6, padding:'3px 8px', display:'inline-flex', alignItems:'center', gap:4 }}>
                              💰 CLP {econ.costoTotal.toLocaleString('es-CL')}
                            </span>
                            <span title={`Ahorro estimado para ${areaDef} m² de elemento, HDD18 ${econ.detalle.hdd18}`}
                              style={{ fontSize:11, fontWeight:700, background:'#ccfbf1', color:'#0e6560', border:'1px solid #5eead4', borderRadius:6, padding:'3px 8px' }}>
                              ⚡ {econ.ahorroKwh.toLocaleString('es-CL')} kWh/año
                            </span>
                            <span title={`Combustible: ${econ.combustibleId} a ${econ.clpKwhUtil} CLP/kWh útil`}
                              style={{ fontSize:11, fontWeight:700, background:'#dcfce7', color:'#166534', border:'1px solid #86efac', borderRadius:6, padding:'3px 8px' }}>
                              💵 CLP {econ.ahorroClp.toLocaleString('es-CL')}/año
                            </span>
                            {econ.paybackSimpleAnios != null && (() => {
                              // Sobre ~30 años el payback deja de ser un criterio útil (excede el
                              // horizonte razonable e incluso la vida útil probable). La solución ya
                              // cumple; esto es optimización de desempeño, no una inversión con retorno.
                              // Acotamos el titular a ">30 años" en tono neutro y dejamos el valor real
                              // en el tooltip. Coherente con el tope del Informe Ejecutivo.
                              const pb = econ.paybackSimpleAnios
                              const noRentable = pb > 30
                              return (
                                <span title={noRentable
                                  ? `Payback real ≈ ${pb} años · VAN30: CLP ${econ.vanProyecto30.toLocaleString('es-CL')} — no se recupera en un horizonte razonable; es mejora de desempeño, no de retorno.`
                                  : `Descontado 5%: ${econ.paybackDescAnios} años · VAN30: CLP ${econ.vanProyecto30.toLocaleString('es-CL')}`}
                                  style={{ fontSize:11, fontWeight:700, borderRadius:6, padding:'3px 8px',
                                    background: noRentable ? '#f1f5f9' : '#ede9fe',
                                    color:      noRentable ? '#64748b' : '#5b21b6',
                                    border:     `1px solid ${noRentable ? '#cbd5e1' : '#c4b5fd'}` }}>
                                  ⏳ Payback {noRentable ? '>30 años' : `${pb} años`}
                                </span>
                              )
                            })()}
                            {econ.emisionesCo2Anual > 0 && (
                              <span title="Emisiones CO₂eq evitadas anualmente"
                                style={{ fontSize:11, fontWeight:700, background:'#f0fdf4', color:'#15803d', border:'1px solid #bbf7d0', borderRadius:6, padding:'3px 8px' }}>
                                🌱 {econ.emisionesCo2Anual} kg CO₂/año
                              </span>
                            )}
                            <span style={{ fontSize:9, color:'#94a3b8', alignSelf:'center', fontStyle:'italic' }}>
                              Referencial — superficie tipo {areaDef} m²
                            </span>
                          </div>
                        )}

                        {/* ── Hint para usuarios free ───────────────────── */}
                        {!usuarioPro && (
                          <div style={{
                            marginTop:6, fontSize:10, color:'#94a3b8',
                            fontStyle:'italic', display:'flex', alignItems:'center', gap:4,
                          }}>
                            🔒 Activa el plan Pro para ver costo, ahorro y payback de esta corrección
                          </div>
                        )}

                        {/* Advertencias constructivas */}
                        {c.advertencias?.length > 0 && (
                          <ul style={{ margin:'6px 0 0', padding:'0 0 0 16px', fontSize:11, color:'#92400e', lineHeight:1.5 }}>
                            {c.advertencias.map((a,i) => <li key={i}>{a}</li>)}
                          </ul>
                        )}
                      </div>
                      {c.esManual ? (
                        <span style={{ background:'#fef3c7', color:'#92400e', border:'1px solid #fde047', borderRadius:6, padding:'6px 14px', fontSize:11, fontWeight:700, whiteSpace:'nowrap', flexShrink:0, alignSelf:'flex-start' }}>
                          ✋ Acción manual
                        </span>
                      ) : (
                        <button onClick={()=>aplicarCorreccion(c)}
                          style={{ background:c.color, color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:700, whiteSpace:'nowrap', flexShrink:0, alignSelf:'flex-start' }}>
                          ▶ Aplicar y recalcular
                        </button>
                      )}
                    </div>
                  </div>
                  )
                })}
              </>
            )}

            {/* ── Exportar cuando no hay solución LOSCAT ──────────────────────── */}
            {!solucion && cumpleTodo && (
              <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
                <button onClick={exportarInformeDom}
                  style={{ background:'#166534', color:'#fff', border:'none', borderRadius:6, padding:'7px 16px', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                  🖨 Exportar Informe DOM
                </button>
              </div>
            )}

            {/* ── Homologación ────────────────────────────────────────────────── */}
            {solucion && (
              <>
                <div style={S.sep}/>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color: cumpleTodo&&hayModif?'#166534':cumpleTodo?'#0e6560':'#94a3b8' }}>
                      {cumpleTodo && hayModif && '📄 Homologación disponible — solución modificada cumple norma'}
                      {cumpleTodo && !hayModif && '✓ Solución original sin modificaciones — no requiere homologación'}
                  {!solucion && cumpleTodo && '✓ Cálculo cumple norma'}
                      {!cumpleTodo && '⏳ Corrige los incumplimientos antes de generar la homologación'}
                    </div>
                    {hayModif && <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{cambios.join(' · ')}</div>}
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {cumpleTodo && hayModif && (
                      <button onClick={()=>setShowHomolog(v=>!v)}
                        style={{ background:'#0e6560', color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                        {showHomolog?'▲ Ocultar':'📋 Texto de homologación'}
                      </button>
                    )}
                    {cumpleTodo && (
                      <button onClick={exportarInformeDom}
                        style={{ background:'#166534', color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                        🖨 Exportar Informe DOM
                      </button>
                    )}
                  </div>
                </div>
                {showHomolog && cumpleTodo && hayModif && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>Texto listo para copiar en memoria de cálculo o carta DOM:</div>
                    <textarea readOnly value={generarTextoHomologacion()}
                      style={{ width:'100%', minHeight:340, fontFamily:'monospace', fontSize:10.5, border:'1px solid #cbd5e1', borderRadius:6, padding:10, background:'#f8fafc', color:'#1e293b', resize:'vertical', boxSizing:'border-box' }}
                      onClick={e=>e.target.select()}
                    />
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>Haz clic en el texto para seleccionarlo todo · Ajusta nombre de proyecto y profesional en Diagnóstico</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        )
      })()}
        </div>
      )}
    </div>
  )
}

// ─── PESTAÑA CÁLCULO U + GLASER ───────────────────────────────────────────────
// Configuración fija por tipo de elemento
const CALC_U_ELEM_CFG = {
  muro:    { elemTipo:'muro',      label:'Muro',             color:'#0e6560', umaxKey:'muro'  },
  techo:   { elemTipo:'techumbre', label:'Cubierta / Techo', color:'#0d9488', umaxKey:'techo' },
  piso:    { elemTipo:'piso',      label:'Piso',             color:'#166534', umaxKey:'piso'  },
  tabique: { elemTipo:'muro',      label:'Tabique',          color:'#b45309', umaxKey:null    },
}

function TabCalcU({ proy, initData, onLimpiarCalcU, onCalcUChange, notas, setNotas, perfil }) {
  const zona       = proy.zona ? ZONAS[proy.zona] : null
  const estructuras = proy.estructuras || []

  // Generar la lista de paneles:
  // · Si hay sistemas con soluciones asignadas → un panel por (sistema × elemento)
  // · En todos los casos se añade "Tabique" si no está ya cubierto
  // · Si no hay sistemas con soluciones → 4 paneles fijos globales
  const panelesSistema = []
  for (const est of estructuras) {
    const soles = est.soluciones || {}
    for (const elemKey of Object.keys(soles)) {
      const cfg = CALC_U_ELEM_CFG[elemKey]
      if (!cfg) continue
      const sector   = est.sector ? ` · ${est.sector}` : ''
      const tipoCorto = (est.tipo || '').replace('Metalframe (acero liviano)', 'Metalframe')
      panelesSistema.push({
        key:         `${est.id}::${elemKey}`,
        elemKey,
        elemTipo:    cfg.elemTipo,
        label:       `${cfg.label} — ${tipoCorto}${sector}`,
        umax:        cfg.umaxKey ? uMaxEfectiva(proy.comuna, cfg.umaxKey, zona?.[cfg.umaxKey], proy.tipoObra) : null,
        headerColor: cfg.color,
      })
    }
  }

  // Paneles globales (asignación sin sistema específico, claves simples)
  const panalesGlobales = Object.entries(CALC_U_ELEM_CFG).map(([elemKey, cfg]) => ({
    key: elemKey,
    elemKey,
    elemTipo:    cfg.elemTipo,
    label:       cfg.label,
    umax:        cfg.umaxKey ? uMaxEfectiva(proy.comuna, cfg.umaxKey, zona?.[cfg.umaxKey], proy.tipoObra) : null,
    headerColor: cfg.color,
  }))

  // Si hay sistemas con soluciones → mostrar paneles por sistema + los globales
  // que NO estén cubiertos por un sistema y que tengan datos (solución aplicada
  // globalmente). El tabique siempre se incluye (no se gestiona por sistema).
  // Antes solo se conservaba el tabique → un muro/techo/piso aplicado en modo
  // global desaparecía de la calculadora (reportado por tester).
  // Si no hay sistemas con soluciones → mostrar los 4 paneles fijos globales.
  let paneles
  if (panelesSistema.length > 0) {
    const cubiertosPorSistema = new Set(panelesSistema.map(p => p.elemKey))
    const globalesAMostrar = panalesGlobales.filter(p =>
      !cubiertosPorSistema.has(p.elemKey) &&
      (p.elemKey === 'tabique' || initData?.[p.elemKey])
    )
    paneles = [...panelesSistema, ...globalesAMostrar]
  } else {
    paneles = panalesGlobales
  }

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Calculadora U y condensación"
        pasos={[
          'Cada panel corresponde a un elemento constructivo por sistema estructural. Las condiciones Ti/Te/HR se toman de la zona del proyecto.',
          'Al aplicar una solución desde la pestaña <b>Soluciones</b>, sus capas se cargan automáticamente en el panel correspondiente.',
          'Para <b>cambiar una solución</b>: usa el botón 🔄 <b>Cambiar solución</b> en el panel y luego ve a la pestaña Soluciones.',
          'Puedes <b>agregar, editar, mover o eliminar capas</b> manualmente en cada panel y presionar <b>Calcular U</b>.',
          'El sistema calcula U (ISO 6946 método combinado si hay estructura integrada) y verifica condensación intersticial (Método Glaser, NCh1973:2014).',
          'Si hay incumplimientos aparecen <b>correcciones sugeridas</b> y el texto de homologación cuando corresponda.',
          'Usa <b>▼/▲</b> para colapsar paneles ya completos.',
        ]}
        normativa="NCh853:2021 (transmitancia) · NCh1973:2014 (condensación) · ISO 6946:2017 · Método de Glaser (EN ISO 13788) · DS N°15 Tabla 1"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {paneles.map(p => (
          <PanelCalcU
            key={p.key}
            elemKey={p.key}
            elemTipo={p.elemTipo}
            label={p.label}
            umax={p.umax}
            proy={proy}
            initData={initData?.[p.key]}
            headerColor={p.headerColor}
            onLimpiarCalcU={onLimpiarCalcU}
            onCalcUChange={onCalcUChange}
            perfil={perfil}
          />
        ))}
      </div>
      <NotasPanel tabKey="calcU" notas={notas} setNotas={setNotas} />
    </div>
  )
}

// ─── PESTAÑA VENTANA ───────────────────────────────────────────────────────────
function TabVentana({ proy, fachadas, setFachadas, fachadasNextId, setFachadasNextId, notas, setNotas }) {
  const zona = proy.zona || 'D'
  const vpctZona = TABLA3_VENTANAS[zona]   // Tabla 3 oficial DS N°15 (12 brackets U × orientación)
  const permLimit = PERM_V[zona]
  const sobr = SOBR_R[zona]

  // Etiqueta del bracket de U aplicado (DS N°15 Tabla 3): primer ≤bracket que cubre el Uw.
  const bracketLabel = uw => {
    const u = parseFloat(uw)
    if (isNaN(u) || u <= 0) return '—'
    const b = UMBRALES_U_VENTANA.find(x => u <= x + 1e-9)
    return b ? `U≤${b}` : 'U>5.8 (no permitido)'
  }
  const ORIENTS = [{ key: 'N', label: 'Norte' }, { key: 'OP', label: 'Oriente / Poniente' }, { key: 'S', label: 'Sur' }]
  const ORIENT_COLORS = { N: '#0e6560', OP: '#166534', S: '#7c3aed' }

  // ─── Calculadora U ventana ───────────────────────────────────────────────────
  const [vidrio, setVidrio] = useState('')
  const [marco, setMarco] = useState('')
  const [ag, setAg] = useState('')
  const [af, setAf] = useState('')
  const [lg, setLg] = useState('')
  const [resUw, setResUw] = useState(null)
  // Modo asistido: estimar Ag/Af/Lg desde las dimensiones reales de la ventana
  const [winW, setWinW] = useState('')      // ancho (m)
  const [winH, setWinH] = useState('')      // alto (m)
  const [winN, setWinN] = useState('1')     // n° de paños/hojas lado a lado
  const [winB, setWinB] = useState('0.06')  // ancho visible del marco/perfil (m)
  const [estimMsg, setEstimMsg] = useState('')

  const vData = VIDRIOS.flatMap(g => g.items).find(v => v.n === vidrio)
  const mData = MARCOS.flatMap(g => g.items).find(m => m.n === marco)

  function calcularUw() {
    if (!vData || !mData || !ag || !af) return
    const Ag = parseFloat(ag), Af = parseFloat(af), Lg = parseFloat(lg || 0)
    const Ug = vData.ug, Uf = mData.uf, psi = mData.psi
    const Aw = Ag + Af
    const Uw = (Ug * Ag + Uf * Af + psi * Lg) / Aw
    setResUw({ Uw: Uw.toFixed(3), Ag, Af, Lg, Ug, Uf, psi, Aw })
  }

  // Estima Ag/Af/Lg desde las dimensiones de la ventana (EN ISO 10077-1):
  // n paños lado a lado, marco perimetral + montantes de ancho b.
  //   vidrio:  alto Hg=H−2b · ancho total Wg=W−(n+1)b · Ag=Hg·Wg
  //   marco:   Af = W·H − Ag      junta: Lg = 2·(Wg + n·Hg)  (perímetro de cada paño)
  function estimarAreas() {
    const W = parseFloat(winW), H = parseFloat(winH)
    const n = Math.max(1, Math.round(parseFloat(winN) || 1))
    const b = parseFloat(winB) || 0.06
    if (!(W > 0) || !(H > 0)) { setEstimMsg('Ingresa un ancho y un alto válidos (en metros).'); return }
    const Hg = H - 2 * b
    const Wg = W - (n + 1) * b
    if (Hg <= 0 || Wg <= 0) { setEstimMsg('El ancho de marco es demasiado grande para esas dimensiones o ese N° de paños.'); return }
    const Ag = Hg * Wg
    const Aw = W * H
    const Af = Aw - Ag
    const Lg = 2 * (Wg + n * Hg)
    setAg(Ag.toFixed(2)); setAf(Af.toFixed(2)); setLg(Lg.toFixed(1))
    setEstimMsg(`Estimado: ${W}×${H} m · ${n} paño(s) · marco ${(b * 100).toFixed(0)} cm → ventana ${Aw.toFixed(2)} m². Ajusta los valores si tu ventana difiere.`)
  }

  // ─── Analizador multi-fachada VPCT ──────────────────────────────────────────
  function addFachada(orient) {
    setFachadas(prev => [...prev, { id: fachadasNextId, nombre: '', orient, areaFachada: '', vanos: '', uw: '' }])
    setFachadasNextId(n => n + 1)
  }
  function removeFachada(id) { setFachadas(prev => prev.filter(f => f.id !== id)) }
  function updF(id, field, val) { setFachadas(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f)) }

  // ── Detalle de ventanas por fachada (alto × ancho → área, auto-suma a vanos) ──
  const sumVanos = (vs) => (vs || []).reduce((s, v) => s + (parseFloat(v.alto) || 0) * (parseFloat(v.ancho) || 0), 0)
  function addVentana(fid) {
    setFachadas(prev => prev.map(f => {
      if (f.id !== fid) return f
      const ventanas = [...(f.ventanas || []), { id: Date.now() + Math.floor(Math.random() * 1000), alto: '', ancho: '' }]
      return { ...f, ventanas, vanos: sumVanos(ventanas).toFixed(2) }
    }))
  }
  function updVentana(fid, vid, field, val) {
    setFachadas(prev => prev.map(f => {
      if (f.id !== fid) return f
      const ventanas = (f.ventanas || []).map(v => v.id === vid ? { ...v, [field]: val } : v)
      return { ...f, ventanas, vanos: sumVanos(ventanas).toFixed(2) }
    }))
  }
  function removeVentana(fid, vid) {
    setFachadas(prev => prev.map(f => {
      if (f.id !== fid) return f
      const ventanas = (f.ventanas || []).filter(v => v.id !== vid)
      return { ...f, ventanas, ...(ventanas.length ? { vanos: sumVanos(ventanas).toFixed(2) } : {}) }
    }))
  }

  // Resultados por fachada
  const fachadasCalc = fachadas.map(f => {
    const area = parseFloat(f.areaFachada), vanos = parseFloat(f.vanos)
    const limite = maxVidriadoVentana(zona, f.uw, f.orient)   // % oficial Tabla 3
    if (!isNaN(area) && area > 0 && !isNaN(vanos) && vanos >= 0 && limite !== null && f.uw) {
      const pct = (vanos / area) * 100
      return { ...f, pct: pct.toFixed(1), limite, cumple: pct <= limite }
    }
    return { ...f, pct: null, limite: null, cumple: null }
  })

  // Resumen por orientación (caso más restrictivo = Uw más alto del grupo → menor %)
  const orientSummary = ORIENTS.map(({ key, label }) => {
    const group = fachadasCalc.filter(f => f.orient === key && f.pct !== null)
    if (!group.length) return null
    const totalArea = group.reduce((s, f) => s + parseFloat(f.areaFachada), 0)
    const totalVanos = group.reduce((s, f) => s + parseFloat(f.vanos), 0)
    const pct = (totalVanos / totalArea) * 100
    const uwMax = Math.max(...group.map(f => parseFloat(f.uw) || 0))
    const limite = maxVidriadoVentana(zona, uwMax, key)
    return { key, label, totalArea: totalArea.toFixed(1), totalVanos: totalVanos.toFixed(1), pct: pct.toFixed(1), uwMax, limite, cumple: limite !== null ? pct <= limite : null }
  }).filter(Boolean)

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Calculadora de ventanas y análisis VPCT por fachada"
        pasos={[
          'Usa la <b>Calculadora U ventana</b> para obtener Uw según EN 10077 (Ug vidrio + Uf marco + ψ junta).',
          'En el <b>Analizador VPCT</b>, cada fila representa una fachada del edificio (un plano vertical por orientación).',
          'Para edificios con volumen complejo puedes agregar <b>múltiples fachadas por orientación</b> con el botón "+".',
          'Ingresa: área total de la fachada (m²), área total de vanos/ventanas (m²), y Uw de las ventanas.',
          'El % máximo permitido depende del <b>U de la ventana</b> (12 brackets, de ≤0.6 a ≤5.8 W/m²K) y la orientación — DS N°15 Tabla 3. A mayor U, menor % permitido.',
          'El % de vano = Av/At×100 se compara contra el % máx de la zona, orientación y bracket de U.',
          'El <b>resumen por orientación</b> agrega todas las fachadas del mismo eje para la verificación normativa final.',
        ]}
        normativa="DS N°15 MINVU Tabla 3 (VPCT) · EN 10077 (Uw) · NCh-EN 12207 (permeabilidad) · OGUC Art. 4.1.10"
      />

      {/* ── Calculadora Uw ─────────────────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h2}>Calculadora U ventana (EN 10077)</p>
        <div style={{ ...S.row, marginBottom: 12 }}>
          <div style={S.col}>
            <span style={S.label}>Vidrio</span>
            <select style={{ ...S.sel, width: 240 }} value={vidrio} onChange={e => setVidrio(e.target.value)}>
              <option value="">Seleccionar vidrio...</option>
              {VIDRIOS.map(g => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.items.map(v => <option key={v.n} value={v.n}>{v.n} (Ug={v.ug})</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div style={S.col}>
            <span style={S.label}>Marco</span>
            <select style={{ ...S.sel, width: 240 }} value={marco} onChange={e => setMarco(e.target.value)}>
              <option value="">Seleccionar marco...</option>
              {MARCOS.map(g => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.items.map(m => <option key={m.n} value={m.n}>{m.n} (Uf={m.uf}, ψ={m.psi})</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        {/* ── Modo asistido: estimar Ag/Af/Lg desde las medidas de la ventana ─── */}
        <div style={{ background:'#f8fafc', border:'1px dashed #cbd5e1', borderRadius:8, padding:'10px 12px', marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:8 }}>
            ¿No conoces Ag / Af / Lg? Ingresa las medidas de tu ventana y estímalas →
          </div>
          <div style={{ ...S.row, alignItems:'flex-end' }}>
            <div style={S.col}><span style={S.label}>Ancho (m)</span><input style={{ ...S.input, width: 80 }} value={winW} onChange={e => setWinW(e.target.value)} placeholder="1.20" /></div>
            <div style={S.col}><span style={S.label}>Alto (m)</span><input style={{ ...S.input, width: 80 }} value={winH} onChange={e => setWinH(e.target.value)} placeholder="1.00" /></div>
            <div style={S.col}><span style={S.label} title="Paños/hojas de vidrio lado a lado: fija = 1, corredera = 2">N° paños</span><input style={{ ...S.input, width: 64 }} value={winN} onChange={e => setWinN(e.target.value)} placeholder="2" /></div>
            <div style={S.col}><span style={S.label} title="Ancho visible del perfil del marco (típico 5–8 cm)">Ancho marco (m)</span><input style={{ ...S.input, width: 84 }} value={winB} onChange={e => setWinB(e.target.value)} placeholder="0.06" /></div>
            <div style={{ ...S.col, justifyContent: 'flex-end' }}>
              <button style={S.btn('#0f766e')} onClick={estimarAreas}>Estimar áreas →</button>
            </div>
          </div>
          {estimMsg && <div style={{ fontSize: 11, color: '#0f766e', marginTop: 6 }}>{estimMsg}</div>}
        </div>

        <div style={S.row}>
          <div style={S.col}><span style={S.label} title="Superficie transparente del vidrio (m²). Ag + Af = área total de la ventana.">Área vidrio Ag (m²)</span><input style={{ ...S.input, width: 90 }} value={ag} onChange={e => setAg(e.target.value)} placeholder="1.0" /></div>
          <div style={S.col}><span style={S.label} title="Superficie opaca del marco y perfiles (m²). Ag + Af = área total de la ventana.">Área marco Af (m²)</span><input style={{ ...S.input, width: 90 }} value={af} onChange={e => setAf(e.target.value)} placeholder="0.2" /></div>
          <div style={S.col}><span style={S.label} title="Perímetro del vidrio donde se encuentra con el marco (m). Suma los perímetros si hay varios paños.">Long. junta Lg (m)</span><input style={{ ...S.input, width: 90 }} value={lg} onChange={e => setLg(e.target.value)} placeholder="4.0" /></div>
          <div style={{ ...S.col, justifyContent: 'flex-end' }}>
            <button style={S.btn()} onClick={calcularUw}>Calcular U ventana</button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
          Son las medidas <b>reales</b> de tu ventana (no por m²): <b>Ag</b> = vidrio transparente · <b>Af</b> = marco/perfiles · <b>Ag + Af = ventana completa</b> · <b>Lg</b> = perímetro del vidrio. El Uw resultante ya queda expresado por m².
        </div>
        {resUw && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdfa', borderRadius: 8, border: '1px solid #99f6e4' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              U ventana = <span style={{ color: colSem(parseFloat(resUw.Uw)) }}>{resUw.Uw} W/m²K</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Uw = ({resUw.Ug}×{resUw.Ag} + {resUw.Uf}×{resUw.Af} + {resUw.psi}×{resUw.Lg}) / {resUw.Aw.toFixed(2)} m²
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#0f766e' }}>
              → bracket DS N°15 Tabla 3: <b>{bracketLabel(resUw.Uw)}</b> — copia este Uw al ingresar las fachadas abajo
            </div>
          </div>
        )}
      </div>

      {/* ── Permeabilidad ──────────────────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h3}>Permeabilidad al aire — Zona {zona}</p>
        <div style={{ fontSize: 13, color: '#475569' }}>
          Clase mínima de ventana: <b>{permLimit ?? '—'}</b> (NCh-EN 12207) &nbsp;·&nbsp;
          Sobreresistencia requerida: <b>{sobr ?? '—'} Pa</b>
        </div>
      </div>

      {/* ── Analizador VPCT por fachada ────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h2}>Analizador VPCT por fachada — Zona {zona}</p>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: -6, marginBottom: 16 }}>
          Ingresa cada fachada del edificio agrupada por orientación. Para volúmenes con múltiples
          tramos o planos por orientación, agrega las filas necesarias con <b>+ Agregar fachada</b>.
        </p>

        {ORIENTS.map(({ key: oKey, label: oLabel }) => {
          const color = ORIENT_COLORS[oKey]
          const fachs = fachadas.filter(f => f.orient === oKey)
          return (
            <div key={oKey} style={{ marginBottom: 20, border: `2px solid ${color}30`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Header orientación */}
              <div style={{ background: color, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                  {oLabel}
                  <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.85, marginLeft: 10 }}>
                    % máx según U de la ventana — ver tabla de referencia abajo
                  </span>
                </span>
                <button
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '3px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                  onClick={() => addFachada(oKey)}
                >+ Agregar fachada</button>
              </div>

              {/* Filas de fachada */}
              <div style={{ padding: '10px 14px' }}>
                {fachs.length === 0 && (
                  <div style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic', padding: '6px 0' }}>
                    Sin fachadas en esta orientación — pulsa "+ Agregar fachada".
                  </div>
                )}
                {fachs.map((f, idx) => {
                  const fc = fachadasCalc.find(x => x.id === f.id)
                  return (
                    <div key={f.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', padding: '8px 10px', background: '#f8fafc', borderRadius: f.ventanas?.length ? '8px 8px 0 0' : 8, border: '1px solid #e2e8f0', borderBottom: f.ventanas?.length ? 'none' : undefined, flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 20, fontSize: 12, fontWeight: 700, color: color, paddingBottom: 3 }}>{idx + 1}</div>
                      <div style={S.col}>
                        <span style={S.label}>Nombre / tramo</span>
                        <input style={{ ...S.input, width: 130 }} value={f.nombre} onChange={e => updF(f.id, 'nombre', e.target.value)} placeholder={`Fachada ${idx + 1}`} />
                      </div>
                      <div style={S.col}>
                        <span style={S.label}>Área fachada (m²)</span>
                        <input style={{ ...S.input, width: 90 }} value={f.areaFachada} onChange={e => updF(f.id, 'areaFachada', e.target.value)} placeholder="120.0" />
                      </div>
                      <div style={S.col}>
                        <span style={S.label}>Área vanos (m²)</span>
                        {f.ventanas?.length > 0 ? (
                          <div title="Suma automática del detalle de ventanas"
                            style={{ ...S.input, width: 90, background: '#f0fdfa', color: '#0f766e', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {sumVanos(f.ventanas).toFixed(2)}<span style={{ fontSize: 9, color: '#94a3b8' }}>auto</span>
                          </div>
                        ) : (
                          <input style={{ ...S.input, width: 90 }} value={f.vanos} onChange={e => updF(f.id, 'vanos', e.target.value)} placeholder="36.0" />
                        )}
                      </div>
                      <div style={S.col}>
                        <span style={S.label}>Uw ventanas (W/m²K)</span>
                        <input style={{ ...S.input, width: 90 }} value={f.uw} onChange={e => updF(f.id, 'uw', e.target.value)} placeholder="2.0" />
                      </div>
                      {fc?.pct !== null && (
                        <>
                          <div style={S.col}>
                            <span style={S.label}>% vano</span>
                            <div style={{ fontWeight: 700, fontSize: 15, color: fc.cumple ? '#166534' : '#991b1b', paddingTop: 5 }}>{fc.pct}%</div>
                          </div>
                          <div style={S.col}>
                            <span style={S.label}>Límite</span>
                            <div style={{ fontSize: 13, paddingTop: 5, color: '#475569' }}>{fc.limite}% <span style={{ fontSize: 10, color: '#94a3b8' }}>({bracketLabel(f.uw)})</span></div>
                          </div>
                          <div style={{ ...S.col, paddingBottom: 3 }}>
                            <span style={S.label}>&nbsp;</span>
                            <span style={S.badge(fc.cumple)}>{fc.cumple ? 'CUMPLE' : 'NO CUMPLE'}</span>
                          </div>
                        </>
                      )}
                      <button
                        title="Eliminar fachada"
                        style={{ marginBottom: 2, background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 13, fontWeight: 700, alignSelf: 'flex-end' }}
                        onClick={() => removeFachada(f.id)}
                      >✕</button>
                    </div>
                    {/* ── Detalle de ventanas (alto × ancho → área, suma a vanos) ── */}
                    <div style={{ padding: '7px 12px 9px 34px', background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: f.ventanas?.length ? 7 : 0, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Detalle de ventanas</span>
                        <button onClick={() => addVentana(f.id)}
                          style={{ fontSize: 11, padding: '2px 10px', border: '1px solid #99f6e4', borderRadius: 5, background: '#f0fdfa', color: '#0f766e', cursor: 'pointer', fontWeight: 600 }}>+ Ventana</button>
                        {f.ventanas?.length > 0 && (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{f.ventanas.length} ventana(s) · Σ {sumVanos(f.ventanas).toFixed(2)} m²</span>
                        )}
                      </div>
                      {(f.ventanas || []).map((v, vi) => {
                        const av = (parseFloat(v.alto) || 0) * (parseFloat(v.ancho) || 0)
                        return (
                          <div key={v.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: '#94a3b8', width: 16 }}>{vi + 1}</span>
                            <input style={{ ...S.input, width: 78 }} value={v.alto} onChange={e => updVentana(f.id, v.id, 'alto', e.target.value)} placeholder="alto (m)" />
                            <span style={{ color: '#94a3b8' }}>×</span>
                            <input style={{ ...S.input, width: 78 }} value={v.ancho} onChange={e => updVentana(f.id, v.id, 'ancho', e.target.value)} placeholder="ancho (m)" />
                            <span style={{ fontSize: 12.5, color: '#0f766e', fontWeight: 600, minWidth: 80 }}>= {av.toFixed(2)} m²</span>
                            <button onClick={() => removeVentana(f.id, v.id)} title="Quitar ventana"
                              style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                          </div>
                        )
                      })}
                    </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Resumen por orientación ────────────────────────────────────────────── */}
      {orientSummary.length > 0 && (
        <div style={S.card}>
          <p style={S.h3}>Resumen VPCT por orientación — verificación normativa</p>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Orientación</th>
                <th style={S.th}>Área total fachada</th>
                <th style={S.th}>Área total vanos</th>
                <th style={S.th}>% vano total</th>
                <th style={S.th}>Bracket U (peor)</th>
                <th style={S.th}>% máx Tabla 3</th>
                <th style={S.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orientSummary.map(o => (
                <tr key={o.key}>
                  <td style={S.td}><b style={{ color: ORIENT_COLORS[o.key] }}>{o.label}</b></td>
                  <td style={S.td}>{o.totalArea} m²</td>
                  <td style={S.td}>{o.totalVanos} m²</td>
                  <td style={{ ...S.td, fontWeight: 700, color: o.cumple ? '#166534' : '#991b1b' }}>{o.pct}%</td>
                  <td style={S.td}><span style={{ fontSize: 11 }}>{bracketLabel(o.uwMax)}</span></td>
                  <td style={S.td}>{o.limite}%</td>
                  <td style={S.td}><span style={S.badge(o.cumple)}>{o.cumple ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            * El % máx del resumen usa el caso más restrictivo (mayor Uw) entre todas las fachadas de esa orientación. DS N°15 Tabla 3.
          </div>
        </div>
      )}

      {/* ── Tabla referencia DS N°15 Tabla 3 ──────────────────────────────────── */}
      {vpctZona && (
        <div style={S.card}>
          <p style={S.h3}>Tabla de referencia — % máx de vidriado vs U de la ventana (DS N°15 Tabla 3) · Zona {zona}</p>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: -6, marginBottom: 8 }}>
            Columnas = transmitancia U de la ventana (W/m²K). Cada celda es el % máx de superficie vidriada permitido. OGT = orientación global total.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ ...S.table, minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={S.th}>Orient.</th>
                  {UMBRALES_U_VENTANA.map(u => <th key={u} style={{ ...S.th, whiteSpace: 'nowrap' }}>{`≤${u}`}</th>)}
                </tr>
              </thead>
              <tbody>
                {[['N', 'Norte'], ['OP', 'Oriente / Poniente'], ['S', 'Sur'], ['OGT', 'Global total']].map(([k, lbl]) => (
                  <tr key={k}><td style={S.td}><b>{lbl}</b></td>{vpctZona[k].map((v, i) => <td key={i} style={S.td}>{v}%</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <NotasPanel tabKey="ventana" notas={notas} setNotas={setNotas} />
    </div>
  )
}

// ─── Panel de incumplimientos por puerta ─────────────────────────────────────
// Para cada eje normativo que falla (térmica/fuego/acústica/dimensiones),
// cita la norma específica + la magnitud del incumplimiento + acciones
// concretas para resolverlo (qué hoja/marco/sello/dimensión cambiar).
function IncumplimientosPanelPuerta({ puerta: p, zona }) {
  const issues = []

  // ── Térmica (DS N°15 Tabla 1) ────────────────────────────────────────────
  if (p.v?.termica && !p.v.termica.cumple) {
    const hojaActualU = p.r.componentes.hoja.u
    const mejoresHojas = PUERTA_HOJAS
      .filter(h => h.u < hojaActualU)
      .sort((a, b) => a.u - b.u)
      .slice(0, 3)
      .map(h => `${h.nombre} (U=${h.u})`)
      .join(' · ')
    issues.push({
      icon: '🌡',
      titulo: 'Térmica — U excede el máximo',
      norma: `DS N°15 MINVU Tabla 1 · Zona ${zona} · Umax ≤ ${p.v.termica.umax} W/m²K`,
      problema: `U actual = ${p.r.U} W/m²K · excede en ${(p.r.U - p.v.termica.umax).toFixed(2)} W/m²K`,
      soluciones: [
        mejoresHojas
          ? `Cambiar la <b>hoja</b> a una con menor U. Opciones: ${mejoresHojas}.`
          : `Considerar puerta Casa Pasiva certificada (U=0.8) — única opción debajo del actual.`,
        `Cambiar el <b>marco</b> a PVC reforzado (U=2.0) o PVC premium 7 cámaras (U=1.2).`,
        `Mejorar el <b>sello perimetral</b> a "EPDM perimetral + umbral" o "Doble junta acústica" para reducir infiltraciones.`,
      ],
    })
  }

  // ── Fuego (LOFC Ed.17) ───────────────────────────────────────────────────
  if (p.v?.fuego && !p.v.fuego.cumple) {
    const cortafuegos = PUERTA_HOJAS
      .filter(h => /^F(30|60|90|120)/.test(h.rf))
      .map(h => `${h.nombre} (${h.rf})`)
      .join(' · ')
    issues.push({
      icon: '🔥',
      titulo: 'Fuego — RF insuficiente',
      norma: `LOFC Ed.17 2025 · Uso "${p.uso.replace(/_/g, ' ')}" · RF mínima ${p.v.fuego.rfRequerido}`,
      problema: `RF actual = ${p.r.rf} · ${p.v.fuego.nota || ''}`,
      soluciones: [
        `Cambiar la <b>hoja</b> a un modelo cortafuego certificado: ${cortafuegos}.`,
        `Verificar que el <b>marco</b> también tenga clasificación RF compatible (acero con RPT mín. F30, madera maciza para F0).`,
        `Solicitar al fabricante la <b>certificación de ensayo EN 1634-1</b> con el marco específico instalado.`,
        `Verificar gomas intumescentes en el perímetro (obligatorias en F60+).`,
      ],
    })
  }

  // ── Acústica (NCh352:2013) ───────────────────────────────────────────────
  if (p.v?.acust && !p.v.acust.cumple) {
    const hojaActualRw = p.r.componentes.hoja.rw
    const mejoresAcust = PUERTA_HOJAS
      .filter(h => h.rw > hojaActualRw)
      .sort((a, b) => b.rw - a.rw)
      .slice(0, 3)
      .map(h => `${h.nombre} (R'w=${h.rw} dB)`)
      .join(' · ')
    issues.push({
      icon: '🔊',
      titulo: "Acústica — R'w insuficiente",
      norma: `NCh352:2013 · Uso "${p.uso.replace(/_/g, ' ')}" · R'w mínimo ${p.v.acust.rwRequerido} dB`,
      problema: `R'w actual = ${p.r.rw} dB · faltan ${Math.abs(p.v.acust.margen)} dB`,
      soluciones: [
        mejoresAcust
          ? `Cambiar la <b>hoja</b> a una más másica/aislada: ${mejoresAcust}.`
          : `Considerar puerta acústica certificada con núcleo de lana mineral densa o panel sándwich.`,
        `Mejorar el <b>sello perimetral</b> a "Doble junta + umbral acústico" (aporta +8 dB).`,
        `Verificar continuidad del sello en TODO el perímetro (cualquier rendija reduce ≥5 dB el desempeño).`,
        `Para R'w ≥ 40 dB suele requerirse ensayo NCh352 in situ con la puerta instalada.`,
      ],
    })
  }

  // ── Dimensiones (OGUC Tít. IV) ───────────────────────────────────────────
  if (p.v?.dimens && !p.v.dimens.cumple) {
    const articulo = p.uso === 'evacuacion_escalera'
      ? 'OGUC Art. 4.2.13 · Puerta de evacuación'
      : (p.uso === 'acceso_vivienda' || p.uso === 'acceso_unidades')
        ? 'OGUC Art. 4.1.7 · Acceso vivienda'
        : 'OGUC Tít. IV · Puerta interior'
    // Aproximación: cuánto más necesita
    const faltaAncho = p.v.dimens.anchoOK ? 0 : (p.v.dimens.anchoMinReq - p.v.dimens.anchoActual)
    const faltaAlto  = p.v.dimens.altoOK  ? 0 : (p.v.dimens.altoMinReq  - p.v.dimens.altoActual)
    const soluciones = []
    if (!p.v.dimens.anchoOK) {
      soluciones.push(`Aumentar el <b>ancho TOTAL</b> en al menos ${(faltaAncho + 0.01).toFixed(2)} m (libre actual ${p.v.dimens.anchoActual} m vs req. ${p.v.dimens.anchoMinReq} m).`)
      soluciones.push(`O usar un <b>marco más delgado</b> (60 mm en vez de 80 mm) para ganar ancho libre sin tocar el vano.`)
    }
    if (!p.v.dimens.altoOK) {
      soluciones.push(`Aumentar el <b>alto TOTAL</b> en al menos ${(faltaAlto + 0.01).toFixed(2)} m (libre actual ${p.v.dimens.altoActual} m vs req. ${p.v.dimens.altoMinReq} m).`)
    }
    if (p.v.dimens.abreHacia && p.v.dimens.abreHacia !== 'cualquiera') {
      soluciones.push(`<b>Verificar sentido de apertura:</b> debe abrir hacia <b>${p.v.dimens.abreHacia}</b> según el uso (revisar planos).`)
    }
    issues.push({
      icon: '📐',
      titulo: 'Dimensiones — paso libre insuficiente',
      norma: `${articulo} · mín ${p.v.dimens.anchoMinReq} × ${p.v.dimens.altoMinReq} m libres de paso`,
      problema: `Ancho libre: ${p.v.dimens.anchoActual} m ${p.v.dimens.anchoOK ? '✓' : '✗'} · Alto libre: ${p.v.dimens.altoActual} m ${p.v.dimens.altoOK ? '✓' : '✗'}`,
      soluciones,
    })
  }

  if (!issues.length) return null

  return (
    <div style={{ marginTop: 10, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>
        ❌ Incumplimientos detectados ({issues.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {issues.map((it, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 6, padding: '8px 10px', border: '1px solid #fee2e2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>{it.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{it.titulo}</span>
            </div>
            <div style={{ fontSize: 11, color: '#0f766e', marginBottom: 3, fontWeight: 600 }}>
              📖 Norma: {it.norma}
            </div>
            <div style={{ fontSize: 11, color: '#7c2d12', marginBottom: 6 }}>
              ⚠ {it.problema}
            </div>
            <div style={{ fontSize: 11, color: '#1e293b', fontWeight: 600, marginBottom: 3 }}>
              💡 Cómo resolverlo:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
              {it.soluciones.map((sol, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: sol }} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PESTAÑA PUERTA ────────────────────────────────────────────────────────────
// Mirror estructural de TabVentana: usa los mismos helpers S.* y el mismo
// patrón visual (calculadora arriba + lista del proyecto + resumen normativo).
// Valida 4 ejes (térmica DS N°15 · fuego LOFC Ed.17 · acústica NCh352 ·
// dimensiones OGUC Tít. IV).
function TabPuerta({ proy, puertas, setPuertas, puertasNextId, setPuertasNextId, notas, setNotas }) {
  const zona = proy.zona || 'D'
  const sugZona = PUERTA_SUG_ZONA[zona] || PUERTA_SUG_ZONA.D

  // ─── Calculadora U puerta (single, espejo de la calc Uw de Ventana) ───────
  const [hojaCalc, setHojaCalc] = useState('')
  const [marcoCalc, setMarcoCalc] = useState('')
  const [selloCalc, setSelloCalc] = useState('')
  const [anchoCalc, setAnchoCalc] = useState('')
  const [altoCalc, setAltoCalc] = useState('')
  const [resCalc, setResCalc] = useState(null)

  function calcularU() {
    const a = parseFloat(anchoCalc), h = parseFloat(altoCalc)
    if (!hojaCalc || !marcoCalc || !selloCalc || !a || !h) return
    const r = calcularPuertaCombinada({
      ancho_m: a, alto_m: h, hojaId: hojaCalc, marcoId: marcoCalc, selloId: selloCalc,
    })
    setResCalc(r)
  }

  // ─── Lista de puertas del proyecto (estado lifted) ────────────────────────
  function addPuerta() {
    setPuertas(prev => [...prev, {
      id: puertasNextId,
      nombre: `Puerta ${prev.length + 1}`,
      uso: 'acceso_vivienda', ancho: '0.85', alto: '2.00',
      hojaId: sugZona.hoja, marcoId: sugZona.marco, selloId: sugZona.sello,
    }])
    setPuertasNextId(n => n + 1)
  }
  function removePuerta(id) {
    if (puertas.length <= 1) { alert('Debe haber al menos una puerta en el proyecto.'); return }
    if (!confirm('¿Eliminar esta puerta?')) return
    setPuertas(prev => prev.filter(p => p.id !== id))
  }
  function updP(id, field, val) { setPuertas(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p)) }

  // Aplicar defaults sugerencia zona a puertas sin componentes seteados
  // (los dos defaults vienen con hojaId vacío para que el seteo respete la zona)
  const puertasConDefaults = puertas.map(p => ({
    ...p,
    hojaId:  p.hojaId  || sugZona.hoja,
    marcoId: p.marcoId || sugZona.marco,
    selloId: p.selloId || sugZona.sello,
  }))

  // Cálculo por puerta + validaciones de 4 ejes
  const puertasCalc = puertasConDefaults.map(p => {
    const a = parseFloat(p.ancho), h = parseFloat(p.alto)
    if (!a || !h) return { ...p, r: null, v: null }
    const r = calcularPuertaCombinada({
      ancho_m: a, alto_m: h, hojaId: p.hojaId, marcoId: p.marcoId, selloId: p.selloId,
    })
    if (!r) return { ...p, r: null, v: null }
    const usoOGUC = p.uso === 'acceso_vivienda' || p.uso === 'acceso_unidades' || p.uso === 'evacuacion_escalera'
      ? 'acceso_principal' : 'interior_recinto'
    const v = {
      termica: cumpleDS15Puerta(r.U, zona),
      fuego:   cumpleRFPuerta(r.rf, p.uso),
      acust:   cumpleRWPuerta(r.rw, p.uso),
      dimens:  cumpleOGUC(r.anchoLibre_m, r.altoLibre_m, usoOGUC),
    }
    const cumpleAll = v.termica?.cumple && v.fuego?.cumple && v.acust?.cumple && v.dimens?.cumple
    return { ...p, r, v, cumpleAll }
  })

  const totalPuertas = puertasCalc.length
  const cumpleN = puertasCalc.filter(p => p.cumpleAll).length

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Calculadora de puerta y registro de puertas del proyecto"
        pasos={[
          'Usa la <b>Calculadora U puerta</b> para obtener U combinado de UNA configuración (hoja + marco + sello) según ISO 10077-1.',
          'En el <b>Registro del proyecto</b>, cada fila representa una puerta real de la edificación (acceso principal, acceso a patio/loggia, dormitorio, baño, cuarto técnico, etc.).',
          'Por defecto el proyecto arranca con <b>dos puertas</b> típicas de vivienda: acceso principal + acceso a patio/loggia.',
          'Para cada puerta indica: <b>nombre, uso, dimensiones (ancho/alto), hoja, marco y sello</b>. El uso determina los mínimos RF (LOFC) y R\'w (NCh352).',
          'Las 4 columnas de cumplimiento (U / RF / R\'w / Dim.) se calculan en vivo. Verde = cumple · Rojo = no cumple.',
          'El <b>resumen normativo</b> al final agrega todas las puertas para la verificación global.',
        ]}
        normativa="DS N°15 (Umax) · LOFC Ed.17 (RF) · NCh352:2013 (R'w) · OGUC Tít. IV (dimensiones) · NCh3079 / ISO 10077-1 (U combinado)"
      />

      {/* ── Calculadora U puerta ─────────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h2}>Calculadora U puerta (NCh3079 / ISO 10077-1)</p>
        <div style={{ ...S.row, marginBottom: 12 }}>
          <div style={S.col}>
            <span style={S.label} title="La parte sólida de la puerta (panel/tablero). Aporta su U y su resistencia al fuego (RF).">Hoja</span>
            <select style={{ ...S.sel, width: 280 }} value={hojaCalc} onChange={e => setHojaCalc(e.target.value)}>
              <option value="">Seleccionar hoja...</option>
              {PUERTA_HOJAS.map(h => <option key={h.id} value={h.id}>{h.nombre} (U={h.u}, {h.rf})</option>)}
            </select>
          </div>
          <div style={S.col}>
            <span style={S.label} title="El perfil perimetral. Su ancho (definido en el catálogo) determina cuánta superficie de la puerta es marco vs hoja.">Marco</span>
            <select style={{ ...S.sel, width: 240 }} value={marcoCalc} onChange={e => setMarcoCalc(e.target.value)}>
              <option value="">Seleccionar marco...</option>
              {MARCOS_PUERTA.map(m => <option key={m.id} value={m.id}>{m.nombre} (U={m.u})</option>)}
            </select>
          </div>
          <div style={S.col}>
            <span style={S.label} title="Burlete/sello entre hoja y marco. Aporta el puente térmico lineal (ψ) y suma aislación acústica.">Sello perimetral</span>
            <select style={{ ...S.sel, width: 240 }} value={selloCalc} onChange={e => setSelloCalc(e.target.value)}>
              <option value="">Seleccionar sello...</option>
              {PUERTA_SELLOS.map(s => <option key={s.id} value={s.id}>{s.nombre} (Ψ={s.psi}, +{s.bonus_rw_db}dB)</option>)}
            </select>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.col}>
            <span style={S.label} title="Ancho total del vano (hoja + marco), en metros. El sistema descuenta el marco automáticamente.">Ancho total (m)</span>
            <input style={{ ...S.input, width: 90 }} value={anchoCalc} onChange={e => setAnchoCalc(e.target.value)} placeholder="0.90" />
          </div>
          <div style={S.col}>
            <span style={S.label} title="Alto total del vano (hoja + marco), en metros. El sistema descuenta el marco automáticamente.">Alto total (m)</span>
            <input style={{ ...S.input, width: 90 }} value={altoCalc} onChange={e => setAltoCalc(e.target.value)} placeholder="2.00" />
          </div>
          <div style={{ ...S.col, justifyContent: 'flex-end' }}>
            <button style={S.btn()} onClick={calcularU}>Calcular U puerta</button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
          Ingresa las <b>dimensiones reales</b> de la puerta (ancho × alto totales). A diferencia de la ventana, aquí <b>no</b> calculas áreas: el sistema descompone solo el área de hoja, de marco y el perímetro del sello según el ancho del marco elegido. El U resultante ya queda expresado por m².
        </div>
        {resCalc && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdfa', borderRadius: 8, border: '1px solid #99f6e4' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              U puerta = <span style={{ color: colSem(parseFloat(resCalc.U)) }}>{resCalc.U} W/m²K</span>
              {' · '}RF: <b>{resCalc.rf}</b>
              {' · '}R'w: <b>{resCalc.rw} dB</b>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              U = ({resCalc.componentes.hoja.u}×{resCalc.A_hoja} + {resCalc.componentes.marco.u}×{resCalc.A_marco} + {resCalc.componentes.sello.psi}×{resCalc.L_sello}) / {resCalc.A_total} m²
              {' · '}Ancho libre paso: {resCalc.anchoLibre_m} m
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#0f766e' }}>
              → Copia estos valores al registro de puertas abajo, o ajusta según el uso real.
            </div>
          </div>
        )}
      </div>

      {/* ── Registro de puertas del proyecto ──────────────────────────────────── */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={{ ...S.h2, margin: 0 }}>Registro de puertas del proyecto — Zona {zona}</p>
          <button style={S.btn('#0e6560')} onClick={addPuerta}>+ Agregar puerta</button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: -2, marginBottom: 16 }}>
          Cada fila es una puerta del proyecto. Edita nombre, uso, dimensiones y componentes.
          El sistema valida los 4 ejes normativos en vivo.
        </p>

        {puertasCalc.map((p, idx) => (
          <div key={p.id} style={{ marginBottom: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            {/* Fila 1: nombre + uso + dimensiones + botón borrar */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
              <div style={{ minWidth: 20, fontSize: 12, fontWeight: 700, color: '#0e6560', paddingBottom: 3 }}>{idx + 1}</div>
              <div style={S.col}>
                <span style={S.label}>Nombre</span>
                <input style={{ ...S.input, width: 200 }} value={p.nombre} onChange={e => updP(p.id, 'nombre', e.target.value)} placeholder={`Puerta ${idx + 1}`} />
              </div>
              <div style={S.col}>
                <span style={S.label}>Uso</span>
                <select style={{ ...S.sel, width: 220 }} value={p.uso} onChange={e => updP(p.id, 'uso', e.target.value)}>
                  <option value="acceso_vivienda">Acceso vivienda (envolvente)</option>
                  <option value="acceso_unidades">Entre unidades</option>
                  <option value="evacuacion_escalera">Salida evacuación</option>
                  <option value="interior_dormitorio">Interior — dormitorio</option>
                  <option value="estudio_oficina">Estudio / oficina</option>
                  <option value="cuarto_tecnico">Cuarto técnico</option>
                  <option value="cuarto_basura">Sala basura</option>
                  <option value="cuarto_maquinas">Cuarto máquinas</option>
                  <option value="ascensor_maquinas">Sala máq. ascensor</option>
                </select>
              </div>
              <div style={S.col}>
                <span style={S.label}>Ancho (m)</span>
                <input style={{ ...S.input, width: 80 }} value={p.ancho} onChange={e => updP(p.id, 'ancho', e.target.value)} placeholder="0.90" />
              </div>
              <div style={S.col}>
                <span style={S.label}>Alto (m)</span>
                <input style={{ ...S.input, width: 80 }} value={p.alto} onChange={e => updP(p.id, 'alto', e.target.value)} placeholder="2.00" />
              </div>
              <div style={{ ...S.col, justifyContent: 'flex-end' }}>
                <button
                  style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                  onClick={() => removePuerta(p.id)}
                  title="Eliminar puerta"
                >✕</button>
              </div>
            </div>

            {/* Fila 2: hoja + marco + sello + chips de cumplimiento */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 20 }} />
              <div style={S.col}>
                <span style={S.label}>Hoja</span>
                <select style={{ ...S.sel, width: 280 }} value={p.hojaId} onChange={e => updP(p.id, 'hojaId', e.target.value)}>
                  {PUERTA_HOJAS.map(h => <option key={h.id} value={h.id}>{h.nombre} (U={h.u}, {h.rf})</option>)}
                </select>
              </div>
              <div style={S.col}>
                <span style={S.label}>Marco</span>
                <select style={{ ...S.sel, width: 220 }} value={p.marcoId} onChange={e => updP(p.id, 'marcoId', e.target.value)}>
                  {MARCOS_PUERTA.map(m => <option key={m.id} value={m.id}>{m.nombre} (U={m.u})</option>)}
                </select>
              </div>
              <div style={S.col}>
                <span style={S.label}>Sello</span>
                <select style={{ ...S.sel, width: 220 }} value={p.selloId} onChange={e => updP(p.id, 'selloId', e.target.value)}>
                  {PUERTA_SELLOS.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              {p.r && (
                <div style={{ ...S.col, gap: 3, alignItems: 'flex-end' }}>
                  <span style={S.label}>Resultado (4 ejes)</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={S.badge(p.v?.termica?.cumple)} title={`U=${p.r.U} (max ${p.v?.termica?.umax})`}>U {p.r.U}</span>
                    <span style={S.badge(p.v?.fuego?.cumple)} title={`RF requerido: ${p.v?.fuego?.rfRequerido}`}>{p.r.rf}</span>
                    <span style={S.badge(p.v?.acust?.cumple)} title={`R'w mín: ${p.v?.acust?.rwRequerido} dB`}>{p.r.rw} dB</span>
                    <span style={S.badge(p.v?.dimens?.cumple)} title={`Mín OGUC: ${p.v?.dimens?.anchoMinReq}×${p.v?.dimens?.altoMinReq} m`}>{p.r.anchoLibre_m}×{p.r.altoLibre_m}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Panel de incumplimientos: solo si algún eje falla — cita norma + cómo resolver */}
            {p.r && !p.cumpleAll && (
              <IncumplimientosPanelPuerta puerta={p} zona={zona} />
            )}
          </div>
        ))}
      </div>

      {/* ── Resumen normativo ────────────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h3}>Resumen normativo de puertas — Zona {zona}</p>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>#</th>
              <th style={S.th}>Nombre</th>
              <th style={S.th}>Uso</th>
              <th style={S.th}>Dimensiones (m)</th>
              <th style={S.th}>U (W/m²K)</th>
              <th style={S.th}>RF</th>
              <th style={S.th}>R'w (dB)</th>
              <th style={S.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {puertasCalc.map((p, idx) => (
              <tr key={p.id}>
                <td style={S.td}>{idx + 1}</td>
                <td style={S.td}><b>{p.nombre}</b></td>
                <td style={S.td}><span style={{ fontSize: 11 }}>{p.uso.replace(/_/g, ' ')}</span></td>
                <td style={S.td}>{p.ancho} × {p.alto}</td>
                <td style={{ ...S.td, fontWeight: 700, color: p.v?.termica?.cumple ? '#166534' : '#991b1b' }}>{p.r?.U ?? '—'}</td>
                <td style={{ ...S.td, fontWeight: 700, color: p.v?.fuego?.cumple ? '#166534' : '#991b1b' }}>{p.r?.rf ?? '—'}</td>
                <td style={{ ...S.td, fontWeight: 700, color: p.v?.acust?.cumple ? '#166534' : '#991b1b' }}>{p.r?.rw ?? '—'}</td>
                <td style={S.td}><span style={S.badge(p.cumpleAll)}>{p.cumpleAll ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
              </tr>
            ))}
            <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
              <td style={S.td} colSpan={7}>Total: {cumpleN} de {totalPuertas} puertas cumplen los 4 ejes</td>
              <td style={S.td}><span style={S.badge(cumpleN === totalPuertas)}>{cumpleN === totalPuertas ? 'OK' : 'REVISAR'}</span></td>
            </tr>
          </tbody>
        </table>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
          * Cumple = los 4 ejes normativos OK: U (DS N°15) + RF (LOFC) + R'w (NCh352) + dimensiones libres (OGUC Tít. IV).
        </div>
      </div>

      <NotasPanel tabKey="puerta" notas={notas} setNotas={setNotas} />
    </div>
  )
}

// ─── SVG GLASER (pure JS, sin React) ─────────────────────────────────────────
function glaserSvgStr(res, capas) {
  if (!res?.temps?.length) return ''
  const W = 560, H = 200, PAD = { t: 18, b: 36, l: 38, r: 16 }
  const gW = W - PAD.l - PAD.r, gH = H - PAD.t - PAD.b
  const Rs = res.Rs || [], Rtot = res.Rtot || 1
  const rsAcum = [0]
  let acc = Rs[0] || 0.13
  for (let i = 1; i < Rs.length - 1; i++) { acc += Rs[i]; rsAcum.push(acc / Rtot) }
  rsAcum.push(1)
  const temps = res.temps
  const Tdew = parseFloat(res.Tdew)
  const tMin = Math.min(...temps, Tdew) - 1
  const tMax = Math.max(...temps, Tdew) + 1
  const xPx = r => (PAD.l + r * gW).toFixed(1)
  const yPx = t => (PAD.t + gH - ((t - tMin) / (tMax - tMin)) * gH).toFixed(1)
  const tempPts = rsAcum.map((r, i) => temps[i] != null ? `${xPx(r)},${yPx(temps[i])}` : '').filter(Boolean).join(' ')
  const yTd = yPx(Tdew)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const t = tMin + f * (tMax - tMin), y = yPx(t)
    return `<line x1="${PAD.l}" x2="${PAD.l + gW}" y1="${y}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/>` +
      `<text x="${PAD.l - 3}" y="${(parseFloat(y) + 3.5).toFixed(1)}" font-size="8" fill="#94a3b8" text-anchor="end">${Math.round(t)}</text>`
  }).join('')
  const sepLines = rsAcum.slice(1, -1).map(r =>
    `<line x1="${xPx(r)}" x2="${xPx(r)}" y1="${PAD.t}" y2="${PAD.t + gH}" stroke="#cbd5e1" stroke-width="0.8" stroke-dasharray="3,2"/>`
  ).join('')
  const riskRect = res.condInter
    ? `<rect x="${PAD.l}" y="${yTd}" width="${gW}" height="${(PAD.t + gH - parseFloat(yTd)).toFixed(1)}" fill="#fee2e2" opacity="0.4"/>`
    : ''
  const dots = rsAcum.map((r, i) => {
    if (temps[i] == null) return ''
    const iface = res.ifaces[i - 1]
    return `<circle cx="${xPx(r)}" cy="${yPx(temps[i])}" r="${(i === 0 || i === rsAcum.length - 1) ? 3 : 4}" fill="${iface?.riesgo ? '#dc2626' : '#0e6560'}" stroke="#fff" stroke-width="1.5"/>`
  }).join('')
  const capaLabels = (capas || []).map((c, i) => ({ c, i })).filter(x => !x.c.esCamara).map(({ c, i }) => {
    const x0 = parseFloat(xPx(rsAcum[i + 1] - (Rs[i + 1] || 0) / Rtot))
    const x1 = parseFloat(xPx(rsAcum[i + 1]))
    const cx = ((x0 + x1) / 2).toFixed(1)
    const label = (c.mat || '').split(' ').slice(0, 2).join(' ')
    return `<text x="${cx}" y="${PAD.t + gH + 26}" font-size="7.5" fill="#94a3b8" text-anchor="middle">${label}</text>`
  }).join('')
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect x="${PAD.l}" y="${PAD.t}" width="${gW}" height="${gH}" fill="#f8fafc" rx="4"/>
${gridLines}${sepLines}${riskRect}
<line x1="${PAD.l}" x2="${PAD.l + gW}" y1="${yTd}" y2="${yTd}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6,3"/>
<text x="${(PAD.l + gW + 2)}" y="${(parseFloat(yTd) + 3).toFixed(1)}" font-size="8" fill="#f59e0b">Td=${res.Tdew}°</text>
<polyline points="${tempPts}" fill="none" stroke="#0e6560" stroke-width="2" stroke-linejoin="round"/>
${dots}
<text x="${PAD.l + 2}" y="${PAD.t + gH + 14}" font-size="9" fill="#64748b">int</text>
<text x="${PAD.l + gW - 2}" y="${PAD.t + gH + 14}" font-size="9" fill="#64748b" text-anchor="end">ext</text>
${capaLabels}
<text x="${PAD.l - 3}" y="${PAD.t - 5}" font-size="8" fill="#94a3b8" text-anchor="end">°C</text>
</svg>`
}

// ─── PESTAÑA DETALLES CONSTRUCTIVOS — Escantillones de uniones ──────────────────
function TabDetalles({ proy, termica, calcUInit, notas, setNotas, detallesIlustrados = [], setDetallesIlustrados }) {
  // ── Sub-tab: 'auto' (escantillones algorítmicos) | 'ilustrados' (uploads del usuario)
  const [subTab, setSubTab] = useState('ilustrados')
  // Estado para upload modal + selección
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingDetalle, setEditingDetalle] = useState(null)  // detalle en edición de marcadores
  const [viewingDetalle, setViewingDetalle] = useState(null)  // detalle en vista detallada
  // Helper: obtiene capas EFECTIVAS de un elemento (modif si existe, sino original LOSCAT)
  function obtenerCapas(elemKey) {
    // Prioridad 1: capas modificadas en calcUInit (match por solucion.cod)
    const solCod = termica?.[elemKey]?.solucion?.cod
    const entries = Object.entries(calcUInit || {})
      .filter(([k, v]) => (k === elemKey || k.endsWith('::' + elemKey)) && v?.capas?.length)
    if (entries.length && solCod) {
      const match = entries.find(([, v]) => v?.solucion?.cod === solCod)
      if (match) return { capas: match[1].capas, sc: solCod, U: match[1].res?.U }
    }
    if (entries.length) return { capas: entries[0][1].capas, sc: entries[0][1].solucion?.cod, U: entries[0][1].res?.U }
    // Fallback 2: capas originales del LOSCAT aplicado
    const sc = termica?.[elemKey]?.solucion
    if (sc) {
      const orig = getCapasParaSC(sc)
      if (orig?.length) return { capas: orig, sc: sc.cod, U: sc.u }
    }
    return null
  }

  const muro = obtenerCapas('muro')
  const piso = obtenerCapas('piso')
  const techo = obtenerCapas('techo')

  // Detectar tipo de techumbre: si tiene capa de "Lana de vidrio" o "Lana mineral" y "cubierta liviana"
  // o si tiene "Hormigón" como capa principal → asumir cubierta plana
  const techoEsHormigon = techo?.capas?.some(c =>
    (c.mat || c.n || '').toLowerCase().includes('hormig')
  )

  const detalles = [
    {
      id: 'muro-piso',
      titulo: 'Muro + Piso (planta baja)',
      desc: 'Encuentro del muro de fachada con el piso ventilado o sobre terreno. Zona crítica para puentes térmicos perimetrales.',
      muro, horiz: piso, horizLabel: 'Piso',
      disponible: !!(muro && piso),
    },
    {
      id: 'muro-cubierta',
      titulo: 'Muro + Cubierta plana',
      desc: 'Encuentro superior del muro con losa o cubierta de hormigón. Típico en edificios de hormigón armado.',
      muro, horiz: techo, horizLabel: 'Cubierta',
      disponible: !!(muro && techo && techoEsHormigon),
    },
    {
      id: 'muro-techumbre',
      titulo: 'Muro + Techumbre inclinada',
      desc: 'Encuentro alero del muro con techumbre liviana (madera + cubierta). Típico en viviendas unifamiliares.',
      muro, horiz: techo, horizLabel: 'Techumbre',
      disponible: !!(muro && techo && !techoEsHormigon),
    },
  ]

  const [detalleActivo, setDetalleActivo] = useState('muro-piso')
  const activo = detalles.find(d => d.id === detalleActivo) || detalles[0]
  const tieneAlgo = detalles.some(d => d.disponible)

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Detalles constructivos"
        pasos={[
          '<b>📐 Escantillones automáticos:</b> el sistema genera diagramas de las uniones a partir de las capas LOSCAT aplicadas. Útil para validación rápida de continuidad térmica.',
          '<b>📷 Detalles ilustrados:</b> subís tus propios dibujos arquitectónicos (PNG/JPG, p.ej. isométricas dibujadas en Illustrator/SketchUp/Revit), colocás marcadores sobre los elementos del dibujo, y el sistema genera automáticamente la leyenda técnica con capas, espesores y análisis al lado.',
          'En el informe DOM, los detalles ilustrados se incluyen como anexo arquitectónico junto con su análisis técnico.',
          'La definición exacta de la unión y los detalles constructivos finales son responsabilidad del profesional proyectista.',
        ]}
        normativa="NCh853:2021 · MINVU Guía Puentes Térmicos · ISO 14683 · OGUC Art. 4.1.10"
      />

      {/* Selector de sub-tab */}
      <div style={{ display:'flex', gap:0, marginBottom:14, borderBottom:'2px solid #e2e8f0' }}>
        {[
          { id:'ilustrados', label:'📷 Mis detalles ilustrados', desc:'Subí tus dibujos arquitectónicos + análisis técnico automático' },
          { id:'auto',       label:'📐 Escantillones automáticos', desc:'Diagramas generados desde las capas LOSCAT' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding:'10px 18px', background:'transparent', border:'none',
              borderBottom: subTab === t.id ? '3px solid #0e6560' : '3px solid transparent',
              marginBottom:-2, cursor:'pointer', fontSize:13,
              fontWeight: subTab === t.id ? 700 : 500,
              color: subTab === t.id ? '#0e6560' : '#64748b',
              transition:'all 0.15s',
            }}
            title={t.desc}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'ilustrados' && (
        <DetallesIlustradosPanel
          detallesIlustrados={detallesIlustrados}
          setDetallesIlustrados={setDetallesIlustrados}
          termica={termica}
          calcUInit={calcUInit}
          proy={proy}
          showUploadModal={showUploadModal}
          setShowUploadModal={setShowUploadModal}
          editingDetalle={editingDetalle}
          setEditingDetalle={setEditingDetalle}
          viewingDetalle={viewingDetalle}
          setViewingDetalle={setViewingDetalle}
        />
      )}

      {subTab === 'auto' && (<>
      {/* Selector de detalle */}
      <div style={S.card}>
        <p style={S.h2}>📐 Escantillones disponibles</p>
        {!tieneAlgo ? (
          <div style={{ padding:'16px 20px', background:'#fef3c7', border:'1px solid #fde047', borderRadius:8, fontSize:12, color:'#92400e' }}>
            ⚠ Aún no hay datos suficientes para generar escantillones. Asigna primero soluciones LOSCAT a <b>Muro</b> y <b>Piso/Techo</b> en la pestaña Soluciones (o calcúlalos en Cálculo U).
          </div>
        ) : (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            {detalles.map(d => (
              <button
                key={d.id}
                onClick={() => setDetalleActivo(d.id)}
                disabled={!d.disponible}
                style={{
                  padding:'10px 16px', borderRadius:8, border:'2px solid',
                  borderColor: detalleActivo === d.id ? '#0e6560' : (d.disponible ? '#cbd5e1' : '#e2e8f0'),
                  background: detalleActivo === d.id ? '#0e6560' : (d.disponible ? '#fff' : '#f8fafc'),
                  color: detalleActivo === d.id ? '#fff' : (d.disponible ? '#1e293b' : '#94a3b8'),
                  cursor: d.disponible ? 'pointer' : 'not-allowed',
                  fontWeight: 600, fontSize:12, opacity: d.disponible ? 1 : 0.6,
                  transition:'all 0.15s',
                }}
                title={d.disponible ? d.desc : 'Sin datos suficientes para este detalle'}
              >
                {d.titulo}
                {!d.disponible && ' (sin datos)'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Render del detalle activo */}
      {tieneAlgo && activo && activo.disponible && (
        <div style={S.card}>
          <div style={{ marginBottom:12, padding:'10px 14px', background:'#f0fdfa', borderLeft:'4px solid #0e6560', borderRadius:6 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0e6560', marginBottom:3 }}>{activo.titulo}</div>
            <div style={{ fontSize:11, color:'#475569', lineHeight:1.5 }}>{activo.desc}</div>
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: escantillonSvgStr({
              muroCapas: activo.muro.capas,
              horizCapas: activo.horiz.capas,
              tipo: activo.id,
              muroLabel: 'Muro',
              horizLabel: activo.horizLabel,
              muroSc: activo.muro.sc,
              horizSc: activo.horiz.sc,
              muroU: activo.muro.U ? parseFloat(activo.muro.U).toFixed(3) : null,
              horizU: activo.horiz.U ? parseFloat(activo.horiz.U).toFixed(3) : null,
            }) }}
          />

          {/* Análisis Glaser en la línea de unión */}
          {(() => {
            const ti = ZONAS[proy.zona]?.Ti || 20
            const te = ZONAS[proy.zona]?.Te || 5
            const hr = ZONAS[proy.zona]?.HR || 70
            const muroAislIdx = findAislacionIdx(activo.muro.capas)
            const horizAislIdx = findAislacionIdx(activo.horiz.capas)
            return (
              <div style={{ marginTop:14, padding:'12px 16px', background:'#f8fafc', borderRadius:8, fontSize:12, lineHeight:1.6 }}>
                <div style={{ fontWeight:700, color:'#0e6560', fontSize:12, marginBottom:6 }}>🔍 Análisis técnico de la unión</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <div style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 }}>Condiciones</div>
                    <div>Zona {proy.zona || '—'} · T<sub>i</sub>={ti}°C · T<sub>e</sub>={te}°C · HR={hr}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 }}>Aislación</div>
                    <div>
                      Muro: {muroAislIdx >= 0
                        ? <span style={{ color:'#166534', fontWeight:700 }}>✓ capa {muroAislIdx + 1} ({activo.muro.capas[muroAislIdx].mat || activo.muro.capas[muroAislIdx].n})</span>
                        : <span style={{ color:'#dc2626' }}>✗ sin aislación clara</span>}
                    </div>
                    <div>
                      {activo.horizLabel}: {horizAislIdx >= 0
                        ? <span style={{ color:'#166534', fontWeight:700 }}>✓ capa {horizAislIdx + 1} ({activo.horiz.capas[horizAislIdx].mat || activo.horiz.capas[horizAislIdx].n})</span>
                        : <span style={{ color:'#dc2626' }}>✗ sin aislación clara</span>}
                    </div>
                  </div>
                </div>
                {muroAislIdx >= 0 && horizAislIdx >= 0 && (
                  <div style={{ marginTop:8, padding:'8px 12px', background:'#fffbeb', border:'1px dashed #fde68a', borderRadius:6, fontSize:11, color:'#92400e' }}>
                    💡 <b>Recomendación de detalle:</b> Para mantener la continuidad térmica, la aislación del muro debe encontrarse físicamente con la aislación del {activo.horizLabel.toLowerCase()}.
                    {activo.id === 'muro-piso' && ' En piso ventilado, agregar aislante perimetral bajando hasta la fundación. En piso sobre terreno, aislante perimetral en el zócalo (al menos 60 cm de altura).'}
                    {activo.id === 'muro-cubierta' && ' La aislación de cubierta debe sobreponerse al muro por al menos 100 mm o usar antepecho aislado.'}
                    {activo.id === 'muro-techumbre' && ' En el alero, la aislación de techumbre debe envolver el coronamiento del muro y conectar con la del muro vertical.'}
                  </div>
                )}
                {(muroAislIdx < 0 || horizAislIdx < 0) && (
                  <div style={{ marginTop:8, padding:'8px 12px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, fontSize:11, color:'#991b1b' }}>
                    ⚠ <b>Puente térmico probable:</b> Uno de los elementos no tiene aislación identificada. Aplica una estrategia C1/C2/C3 (EIFS, fachada ventilada, trasdosado) para crear envolvente continua.
                  </div>
                )}
              </div>
            )
          })()}

          {/* Tabla resumen de capas (debajo del diagrama) */}
          <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[{ titulo:'Capas del muro (INT → EXT)', capas: activo.muro.capas, sc: activo.muro.sc, U: activo.muro.U },
              { titulo:`Capas del ${activo.horizLabel.toLowerCase()} (INT → EXT)`, capas: activo.horiz.capas, sc: activo.horiz.sc, U: activo.horiz.U }].map((t, i) => (
              <div key={i} style={{ border:'1px solid #e2e8f0', borderRadius:6, padding:'8px 12px', fontSize:11, background:'#fff' }}>
                <div style={{ fontWeight:700, color:'#0e6560', marginBottom:4, fontSize:11.5 }}>
                  {t.titulo}
                  {t.sc && <span style={{ marginLeft:6, color:'#64748b', fontFamily:'monospace', fontSize:10 }}>LOSCAT {t.sc}</span>}
                </div>
                {t.U && <div style={{ fontSize:10, color:'#475569', marginBottom:4 }}>U = {parseFloat(t.U).toFixed(4)} W/m²K</div>}
                <ol style={{ margin:'4px 0 0 18px', padding:0, fontSize:11, color:'#1e293b', lineHeight:1.65 }}>
                  {t.capas.map((c, idx) => (
                    <li key={idx} style={{ marginBottom:2 }}>
                      {c.esCamara ? <i>Cámara de aire</i> : (c.mat || c.n || '—')}
                      {!c.esCamara && c.esp ? <span style={{ color:'#64748b' }}> · {Math.round(parseFloat(c.esp))} mm</span> : ''}
                      {!c.esCamara && c.lam ? <span style={{ color:'#94a3b8', fontSize:9.5 }}> · λ={parseFloat(c.lam).toFixed(3)}</span> : ''}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
      </>)}

      <NotasPanel tabKey="detalles" notas={notas} setNotas={setNotas} />
    </div>
  )
}

// ─── PANEL: Detalles Ilustrados (uploads del usuario con marcadores) ────────────
function DetallesIlustradosPanel({
  detallesIlustrados, setDetallesIlustrados,
  termica, calcUInit, proy,
  showUploadModal, setShowUploadModal,
  editingDetalle, setEditingDetalle,
  viewingDetalle, setViewingDetalle,
}) {
  // Helper para resolver capas de un elemento (reusa lógica de getCapasParaSC)
  function obtenerCapas(elemKey) {
    const solCod = termica?.[elemKey]?.solucion?.cod
    const entries = Object.entries(calcUInit || {})
      .filter(([k, v]) => (k === elemKey || k.endsWith('::' + elemKey)) && v?.capas?.length)
    if (entries.length && solCod) {
      const match = entries.find(([, v]) => v?.solucion?.cod === solCod)
      if (match) return { capas: match[1].capas, sc: solCod, U: match[1].res?.U }
    }
    if (entries.length) return { capas: entries[0][1].capas, sc: entries[0][1].solucion?.cod, U: entries[0][1].res?.U }
    const sc = termica?.[elemKey]?.solucion
    if (sc) {
      const orig = getCapasParaSC(sc)
      if (orig?.length) return { capas: orig, sc: sc.cod, U: sc.u }
    }
    return null
  }

  function eliminarDetalle(id) {
    if (!window.confirm('¿Eliminar este detalle ilustrado? No se puede deshacer.')) return
    setDetallesIlustrados(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div>
      <div style={S.card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:14 }}>
          <div>
            <p style={{ ...S.h2, marginBottom:4 }}>📷 Mis detalles ilustrados</p>
            <div style={{ fontSize:11.5, color:'#64748b', lineHeight:1.5 }}>
              Subí tus dibujos arquitectónicos (isométricas, secciones, esquinas). El sistema generará automáticamente la leyenda técnica con capas, espesores, λ y análisis higrotérmico al lado del dibujo.
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{ padding:'10px 18px', background:'#0e6560', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' }}
          >
            ＋ Subir nuevo detalle
          </button>
        </div>

        {detallesIlustrados.length === 0 ? (
          <div style={{ padding:'28px 20px', background:'#f8fafc', border:'1.5px dashed #cbd5e1', borderRadius:10, textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:10, opacity:0.5 }}>📐</div>
            <div style={{ fontSize:13, color:'#475569', fontWeight:600, marginBottom:6 }}>Aún no has subido detalles arquitectónicos</div>
            <div style={{ fontSize:11, color:'#64748b', lineHeight:1.6, maxWidth:520, margin:'0 auto' }}>
              Dibujá los detalles en tu herramienta favorita (Illustrator, SketchUp, Revit, AutoCAD, incluso a mano escaneada), exportá como PNG o JPG, y subílos aquí. Luego colocá marcadores sobre los elementos del dibujo (muro, piso, techo) y el sistema generará la documentación técnica automáticamente.
            </div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
            {detallesIlustrados.map(d => (
              <div key={d.id} style={{ border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ position:'relative', background:'#f8fafc', minHeight:160, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <img src={d.imagenDataUrl} alt={d.nombre} style={{ maxWidth:'100%', maxHeight:200, display:'block' }} />
                  {/* Marcadores como puntitos */}
                  {d.marcadores?.map(m => (
                    <div key={m.id} style={{
                      position:'absolute', left:`${m.x * 100}%`, top:`${m.y * 100}%`,
                      transform:'translate(-50%,-50%)',
                      width:18, height:18, borderRadius:'50%',
                      background: m.elemento ? '#0e6560' : '#94a3b8',
                      color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:9, fontWeight:800, border:'2px solid #fff',
                      boxShadow:'0 1px 3px rgba(0,0,0,0.3)',
                    }}>{m.label || '?'}</div>
                  ))}
                </div>
                <div style={{ padding:'10px 14px' }}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:'#1e293b', marginBottom:2 }}>{d.nombre}</div>
                  <div style={{ fontSize:10, color:'#64748b', marginBottom:8 }}>
                    {d.tipo || 'otro'} · {d.marcadores?.length || 0} marcadores
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button
                      onClick={() => setViewingDetalle(d)}
                      style={{ flex:1, padding:'5px 8px', background:'#0e6560', color:'#fff', border:'none', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}
                    >👁 Ver con análisis</button>
                    <button
                      onClick={() => setEditingDetalle(d)}
                      style={{ padding:'5px 10px', background:'#f1f5f9', color:'#475569', border:'1px solid #cbd5e1', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}
                      title="Editar marcadores"
                    >✏</button>
                    <button
                      onClick={() => eliminarDetalle(d.id)}
                      style={{ padding:'5px 10px', background:'#fef2f2', color:'#991b1b', border:'1px solid #fca5a5', borderRadius:5, fontSize:11, fontWeight:600, cursor:'pointer' }}
                      title="Eliminar"
                    >🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Subir nuevo detalle */}
      {showUploadModal && (
        <UploadDetalleModal
          onClose={() => setShowUploadModal(false)}
          onUpload={(nuevoDetalle) => {
            setDetallesIlustrados(prev => [...prev, nuevoDetalle])
            setShowUploadModal(false)
            // Abrir editor de marcadores inmediatamente
            setEditingDetalle(nuevoDetalle)
          }}
        />
      )}

      {/* Modal: Editor de marcadores */}
      {editingDetalle && (
        <MarkerEditorModal
          detalle={editingDetalle}
          onClose={() => setEditingDetalle(null)}
          onSave={(detalleActualizado) => {
            setDetallesIlustrados(prev => prev.map(d => d.id === detalleActualizado.id ? detalleActualizado : d))
            setEditingDetalle(null)
          }}
        />
      )}

      {/* Modal: Vista detallada con análisis técnico */}
      {viewingDetalle && (
        <ViewDetalleModal
          detalle={viewingDetalle}
          obtenerCapas={obtenerCapas}
          proy={proy}
          onClose={() => setViewingDetalle(null)}
        />
      )}
    </div>
  )
}

// ─── Modal: Subir nuevo detalle ilustrado ───────────────────────────────────────
function UploadDetalleModal({ onClose, onUpload }) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('muro-piso')
  const [imagenDataUrl, setImagenDataUrl] = useState(null)
  const [imagenW, setImagenW] = useState(0)
  const [imagenH, setImagenH] = useState(0)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('El archivo debe ser una imagen (PNG, JPG, etc.)'); return }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen debe pesar menos de 5MB. Comprimila o reducí su resolución.'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      // Cargar para obtener dimensiones reales
      const img = new Image()
      img.onload = () => {
        setImagenDataUrl(dataUrl)
        setImagenW(img.naturalWidth)
        setImagenH(img.naturalHeight)
        if (!nombre) setNombre(file.name.replace(/\.[^.]+$/, ''))
      }
      img.onerror = () => setError('No se pudo cargar la imagen')
      img.src = dataUrl
    }
    reader.onerror = () => setError('Error leyendo el archivo')
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    setError('')
    if (!nombre.trim()) { setError('Ingresa un nombre para el detalle'); return }
    if (!imagenDataUrl) { setError('Subí una imagen'); return }
    const nuevo = {
      id: 'det_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      nombre: nombre.trim(),
      tipo,
      imagenDataUrl,
      imagenW, imagenH,
      marcadores: [],
      createdAt: new Date().toISOString(),
    }
    onUpload(nuevo)
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:12, maxWidth:560, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:16, fontWeight:800, color:'#0e6560' }}>＋ Subir detalle ilustrado</div>
          <button onClick={onClose} style={{ padding:'4px 10px', background:'#f1f5f9', border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:600 }}>✕</button>
        </div>
        <div style={{ padding:'18px 24px' }}>
          <label style={{ fontSize:11, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:0.4, marginBottom:4, display:'block' }}>Nombre del detalle</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Encuentro muro-piso planta baja" style={{ width:'100%', padding:'8px 10px', border:'1px solid #cbd5e1', borderRadius:6, fontSize:13, marginBottom:14 }} />

          <label style={{ fontSize:11, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:0.4, marginBottom:4, display:'block' }}>Tipo de unión</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #cbd5e1', borderRadius:6, fontSize:13, marginBottom:14, background:'#fff' }}>
            <option value="muro-piso">Muro + Piso (planta baja)</option>
            <option value="muro-cubierta">Muro + Cubierta plana</option>
            <option value="muro-techumbre">Muro + Techumbre inclinada (alero)</option>
            <option value="esquina-muros">Esquina muros perimetrales</option>
            <option value="dintel-ventana">Dintel ventana / vierteaguas</option>
            <option value="otro">Otro detalle</option>
          </select>

          <label style={{ fontSize:11, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:0.4, marginBottom:4, display:'block' }}>Imagen del detalle (PNG/JPG, máx. 5MB)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ width:'100%', marginBottom:14, fontSize:12 }} />

          {imagenDataUrl && (
            <div style={{ marginBottom:14, padding:8, background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0' }}>
              <img src={imagenDataUrl} alt="preview" style={{ maxWidth:'100%', maxHeight:240, display:'block', margin:'0 auto' }} />
              <div style={{ marginTop:6, textAlign:'center', fontSize:10, color:'#64748b' }}>{imagenW} × {imagenH} px</div>
            </div>
          )}

          {error && <div style={{ padding:'8px 12px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, color:'#991b1b', fontSize:12, marginBottom:14 }}>{error}</div>}

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={onClose} style={{ padding:'8px 16px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
            <button onClick={handleSubmit} style={{ padding:'8px 18px', background:'#0e6560', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>Continuar → colocar marcadores</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Editor de marcadores sobre la imagen ───────────────────────────────
function MarkerEditorModal({ detalle, onClose, onSave }) {
  const [marcadores, setMarcadores] = useState(detalle.marcadores || [])
  const imgRef = useRef(null)

  function handleImageClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    if (x < 0 || x > 1 || y < 0 || y > 1) return
    const nuevoLabel = String.fromCharCode(65 + marcadores.length) // A, B, C, D...
    setMarcadores(prev => [...prev, {
      id: 'mk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      x, y,
      elemento: '',  // se asigna luego
      label: nuevoLabel,
      nota: '',
    }])
  }

  function eliminarMarcador(id) { setMarcadores(prev => prev.filter(m => m.id !== id)) }
  function actualizarMarcador(id, campo, valor) {
    setMarcadores(prev => prev.map(m => m.id === id ? { ...m, [campo]: valor } : m))
  }

  function guardar() {
    onSave({ ...detalle, marcadores })
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.85)', zIndex:9999, display:'flex', alignItems:'stretch', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:12, flex:1, display:'flex', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
        {/* Imagen con marcadores (izq) */}
        <div style={{ flex:'1 1 65%', background:'#04302e', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', overflow:'auto' }}>
          <div style={{ position:'relative', display:'inline-block' }}>
            <img
              ref={imgRef}
              src={detalle.imagenDataUrl}
              alt={detalle.nombre}
              onClick={handleImageClick}
              style={{ maxWidth:'100%', maxHeight:'calc(100vh - 80px)', display:'block', cursor:'crosshair' }}
            />
            {marcadores.map(m => (
              <div key={m.id} style={{
                position:'absolute', left:`${m.x * 100}%`, top:`${m.y * 100}%`,
                transform:'translate(-50%,-50%)',
                width:28, height:28, borderRadius:'50%',
                background: m.elemento ? '#0e6560' : '#dc2626',
                color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:800, border:'3px solid #fff',
                boxShadow:'0 2px 8px rgba(0,0,0,0.5)',
                pointerEvents:'none',
              }}>{m.label}</div>
            ))}
          </div>
        </div>

        {/* Panel lateral (der): lista de marcadores */}
        <div style={{ width:340, background:'#fff', borderLeft:'1px solid #e2e8f0', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #e2e8f0' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#0e6560', marginBottom:2 }}>✏ Editor de marcadores</div>
            <div style={{ fontSize:11, color:'#64748b', lineHeight:1.5 }}>
              <b>Clickea sobre la imagen</b> para agregar marcadores. Luego asigná a cada uno el elemento (muro, piso, techo, etc.) al que corresponde en el dibujo.
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
            {marcadores.length === 0 ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'#94a3b8', fontSize:12, fontStyle:'italic' }}>
                Click sobre la imagen para colocar el primer marcador
              </div>
            ) : (
              marcadores.map(m => (
                <div key={m.id} style={{ marginBottom:10, padding:10, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:6 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background: m.elemento ? '#0e6560' : '#dc2626', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }}>{m.label}</div>
                    <input value={m.label} onChange={e => actualizarMarcador(m.id, 'label', e.target.value.slice(0, 3).toUpperCase())} style={{ width:50, padding:'3px 6px', border:'1px solid #cbd5e1', borderRadius:4, fontSize:11, fontWeight:700, textAlign:'center' }} />
                    <select value={m.elemento} onChange={e => actualizarMarcador(m.id, 'elemento', e.target.value)} style={{ flex:1, padding:'4px 6px', border:'1px solid #cbd5e1', borderRadius:4, fontSize:11, background:'#fff' }}>
                      <option value="">— sin asignar —</option>
                      <option value="muro">Muro</option>
                      <option value="piso">Piso</option>
                      <option value="techo">Techo / Cubierta</option>
                      <option value="tabique">Tabique</option>
                      <option value="ventana">Ventana</option>
                      <option value="fundacion">Fundación</option>
                      <option value="estructural">Elemento estructural</option>
                      <option value="otro">Otro</option>
                    </select>
                    <button onClick={() => eliminarMarcador(m.id)} style={{ padding:'3px 7px', background:'#fef2f2', color:'#991b1b', border:'1px solid #fca5a5', borderRadius:4, fontSize:11, cursor:'pointer' }} title="Eliminar marcador">✕</button>
                  </div>
                  <input
                    value={m.nota || ''}
                    onChange={e => actualizarMarcador(m.id, 'nota', e.target.value)}
                    placeholder="Nota opcional (ej: con barrera de vapor)"
                    style={{ width:'100%', padding:'4px 7px', border:'1px solid #e2e8f0', borderRadius:4, fontSize:11 }}
                  />
                </div>
              ))
            )}
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid #e2e8f0', display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'8px 14px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
            <button onClick={guardar} style={{ flex:1, padding:'8px 16px', background:'#16a34a', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>✓ Guardar marcadores</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Vista con análisis técnico automático ──────────────────────────────
function ViewDetalleModal({ detalle, obtenerCapas, proy, onClose }) {
  // ESC para cerrar
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Agrupar marcadores por elemento — para generar la leyenda
  const marcadoresPorElem = {}
  ;(detalle.marcadores || []).forEach(m => {
    if (!m.elemento) return
    if (!marcadoresPorElem[m.elemento]) marcadoresPorElem[m.elemento] = []
    marcadoresPorElem[m.elemento].push(m)
  })

  // Para cada elemento con marcador, obtener las capas
  const elementosConData = Object.entries(marcadoresPorElem).map(([elem, marks]) => ({
    elem, marks, capas: obtenerCapas(elem),
  })).filter(e => e.capas)

  const ELEM_LABELS = { muro:'Muro', piso:'Piso', techo:'Techo / Cubierta', tabique:'Tabique', ventana:'Ventana' }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.85)', zIndex:9999, display:'flex', flexDirection:'column', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:12, flex:1, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
        {/* Toolbar */}
        <div style={{ padding:'12px 22px', background:'#0e6560', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800 }}>👁 {detalle.nombre}</div>
            <div style={{ fontSize:11, opacity:0.85 }}>{detalle.tipo} · {detalle.marcadores?.length || 0} marcadores · {elementosConData.length} elementos identificados</div>
          </div>
          <button onClick={onClose} style={{ padding:'6px 14px', background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>✕ Cerrar (ESC)</button>
        </div>

        {/* Contenido: imagen + leyenda */}
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          {/* Imagen */}
          <div style={{ flex:'1 1 60%', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', overflow:'auto', padding:16 }}>
            <div style={{ position:'relative', display:'inline-block', maxWidth:'100%' }}>
              <img src={detalle.imagenDataUrl} alt={detalle.nombre} style={{ maxWidth:'100%', maxHeight:'calc(100vh - 120px)', display:'block' }} />
              {(detalle.marcadores || []).map(m => (
                <div key={m.id} style={{
                  position:'absolute', left:`${m.x * 100}%`, top:`${m.y * 100}%`,
                  transform:'translate(-50%,-50%)',
                  width:30, height:30, borderRadius:'50%',
                  background: m.elemento ? '#0e6560' : '#94a3b8',
                  color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14, fontWeight:800, border:'3px solid #fff',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.4)',
                }}>{m.label}</div>
              ))}
            </div>
          </div>

          {/* Leyenda técnica automática */}
          <div style={{ width:380, background:'#fff', borderLeft:'1px solid #e2e8f0', overflowY:'auto', padding:'18px 22px' }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#0e6560', marginBottom:14, paddingBottom:8, borderBottom:'2px solid #ccfbf1' }}>
              📋 Leyenda técnica
            </div>

            {elementosConData.length === 0 && (
              <div style={{ padding:14, background:'#fef3c7', border:'1px solid #fde047', borderRadius:6, fontSize:11.5, color:'#92400e', lineHeight:1.55 }}>
                ⚠ Ninguno de los marcadores tiene un elemento asignado, o los elementos no tienen solución LOSCAT. Edita los marcadores y/o asigna soluciones en la pestaña Soluciones.
              </div>
            )}

            {elementosConData.map(({ elem, marks, capas }) => {
              const muroAislIdx = findAislacionIdx(capas.capas)
              return (
                <div key={elem} style={{ marginBottom:18, padding:'12px 14px', background:'#f8fafc', borderLeft:'4px solid #0e6560', borderRadius:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    {marks.map(m => (
                      <div key={m.id} style={{ width:22, height:22, borderRadius:'50%', background:'#0e6560', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>{m.label}</div>
                    ))}
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#0e6560' }}>{ELEM_LABELS[elem] || elem}</div>
                      {capas.sc && <div style={{ fontSize:10, color:'#64748b', fontFamily:'monospace' }}>LOSCAT {capas.sc}{capas.U ? ` · U=${parseFloat(capas.U).toFixed(4)} W/m²K` : ''}</div>}
                    </div>
                  </div>
                  {marks.filter(m => m.nota).length > 0 && (
                    <div style={{ marginBottom:6, fontSize:10.5, color:'#475569', fontStyle:'italic' }}>
                      {marks.filter(m => m.nota).map(m => `${m.label}: ${m.nota}`).join(' · ')}
                    </div>
                  )}
                  <div style={{ fontSize:10.5, color:'#64748b', textTransform:'uppercase', letterSpacing:0.4, marginBottom:4, marginTop:4, fontWeight:700 }}>Capas (int → ext)</div>
                  <ol style={{ margin:'0 0 0 18px', padding:0, fontSize:11, lineHeight:1.65, color:'#1e293b' }}>
                    {capas.capas.map((c, idx) => (
                      <li key={idx} style={{ marginBottom:2, background: idx === muroAislIdx ? '#fef3c7' : 'transparent', padding: idx === muroAislIdx ? '1px 4px' : 0, borderRadius:3 }}>
                        <b>{c.esCamara ? 'Cámara de aire' : (c.mat || c.n || '—')}</b>
                        {!c.esCamara && c.esp && <span style={{ color:'#64748b' }}> · {Math.round(parseFloat(c.esp))} mm</span>}
                        {!c.esCamara && c.lam && <span style={{ color:'#94a3b8', fontSize:10 }}> · λ={parseFloat(c.lam).toFixed(3)}</span>}
                        {idx === muroAislIdx && <span style={{ color:'#d97706', fontWeight:700 }}> ← aislante</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              )
            })}

            {/* Condiciones de zona */}
            {proy.zona && (
              <div style={{ marginTop:14, padding:'10px 14px', background:'#f0fdfa', borderRadius:6, fontSize:10.5, color:'#0e6560', lineHeight:1.5 }}>
                <b>Condiciones Zona {proy.zona}:</b> Ti={ZONAS[proy.zona]?.Ti}°C · Te={ZONAS[proy.zona]?.Te}°C · HR={ZONAS[proy.zona]?.HR}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PESTAÑA RESULTADOS ────────────────────────────────────────────────────────
function TabResultados({ proy, termica, onExportar, notas, setNotas, calcUInit, fachadas, puertas, escaleras, modulosInforme, setModulosInforme, getRFOGUC, getLetraOGUC, getRFDeLetra, ogucData, detallesIlustrados = [] }) {
  // Fallbacks defensivos por si las props no están disponibles
  const getRFOGUC_loaded = getRFOGUC || (() => null)
  const getLetraOGUC_loaded = getLetraOGUC || (() => null)
  const getRFDeLetra_loaded = getRFDeLetra || (() => null)
  const ogucDataReady = ogucData || { OGUC_TABLA1: [], OGUC_RF_LETRAS: {}, OGUC_ELEM_COL: {} }

  const zona = proy.zona ? ZONAS[proy.zona] : null
  const uso = proy.uso || ''

  // ── Determinar qué módulos son requeridos normativamente ─────────────────
  const reqTermica   = !!proy.zona
  const reqFuego     = !!(RF_DEF[uso] && Object.values(RF_DEF[uso]).some(v => v))
  const reqAcustica  = !!(AC_DEF[uso] && (AC_DEF[uso].entre_unidades || AC_DEF[uso].entre_pisos || AC_DEF[uso].fachada))
  const haySistemas  = (proy.estructuras?.length || 0) > 1
  const hayVentanas  = fachadas?.some(f => parseFloat(f.vanos) > 0 || parseFloat(f.areaFachada) > 0)
  const hayPuertas   = (puertas || []).some(p => parseFloat(p.ancho) > 0 && parseFloat(p.alto) > 0 && p.hojaId && p.marcoId && p.selloId)
  const _pisosNum    = Number(proy.pisos) || 0
  const hayEscaleras = _pisosNum >= 2 || !!escaleras?.incluido
  const hayNotas     = Object.values(notas || {}).some(v => v?.toString().trim())
  // Hay escantillones si existe solución/capas para muro + al menos piso o techo
  const hayEscantillones = !!(
    (termica?.muro?.solucion || Object.keys(calcUInit || {}).some(k => (k === 'muro' || k.endsWith('::muro')) && calcUInit[k]?.capas?.length)) &&
    (['piso','techo'].some(el =>
      termica?.[el]?.solucion || Object.keys(calcUInit || {}).some(k => (k === el || k.endsWith('::' + el)) && calcUInit[k]?.capas?.length)
    ))
  )

  // Valor efectivo de cada módulo: modulosInforme sobreescribe el default
  const mods = {
    termica:       modulosInforme?.termica       ?? true,
    fuego:         modulosInforme?.fuego         ?? reqFuego,
    acustica:      modulosInforme?.acustica      ?? reqAcustica,
    sistemas:      modulosInforme?.sistemas      ?? haySistemas,
    ventanas:      modulosInforme?.ventanas      ?? hayVentanas,
    puertas:       modulosInforme?.puertas       ?? hayPuertas,
    escaleras:     modulosInforme?.escaleras     ?? hayEscaleras,
    notas:         modulosInforme?.notas         ?? hayNotas,
    escantillones: modulosInforme?.escantillones ?? hayEscantillones,
  }
  function toggleMod(key) {
    setModulosInforme(prev => ({ ...(prev || mods), [key]: !(prev?.[key] ?? mods[key]) }))
  }
  function resetMods() { setModulosInforme(null) }

  // ── Formato de exportación ────────────────────────────────────────────────
  const [formatoExport, setFormatoExport] = useState('pdf')
  // ── Vista previa (modal con iframe) ───────────────────────────────────────
  const [previewHtml, setPreviewHtml] = useState(null)
  // ESC cierra la vista previa + bloquea scroll del body mientras está abierta
  useEffect(() => {
    if (!previewHtml) return
    const onKey = (e) => { if (e.key === 'Escape') setPreviewHtml(null) }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [previewHtml])

  const ELEMS_DEF = [
    { key: 'muro',    label: 'Muro',            tipo: 'muro',      umax: uMaxEfectiva(proy.comuna,'muro',zona?.muro,proy.tipoObra),  rfReq: RF_ELEM_REQ('muro',uso,proy.pisos), rwReq: AC_DEF[uso]?.entre_unidades },
    { key: 'techo',   label: 'Cubierta/Techo',  tipo: 'techumbre', umax: uMaxEfectiva(proy.comuna,'techo',zona?.techo,proy.tipoObra), rfReq: RF_ELEM_REQ('techo',uso,proy.pisos),  rwReq: AC_DEF[uso]?.entre_pisos },
    { key: 'piso',    label: 'Piso',             tipo: 'piso',      umax: uMaxEfectiva(proy.comuna,'piso',zona?.piso,proy.tipoObra),  rfReq: RF_ELEM_REQ('piso',uso,proy.pisos), rwReq: AC_DEF[uso]?.entre_pisos },
    { key: 'tabique', label: 'Tabique',          tipo: 'muro',      umax: null,        rfReq: RF_ELEM_REQ('tabique',uso,proy.pisos), rwReq: AC_DEF[uso]?.entre_unidades },
    { key: 'puerta',  label: 'Puerta exterior',  tipo: 'muro',      umax: PUERTA_U[proy.zona]||null, rfReq: RF_ELEM_REQ('puerta',uso,proy.pisos,proy.zona), rwReq: null },
  ]

  const checks = useMemo(() => {
    if (!zona || !uso) return []
    const rfReqEstr = RF_PISOS(uso, proy.pisos)
    // Usar U calculado desde PanelCalcU si está disponible.
    // Busca tanto claves simples ('muro') como compuestas ('estId::muro').
    // Si hay varios sistemas devuelve el peor caso (U máximo = más exigente).
    function getCalcUForElem(elemKey) {
      const vals = Object.entries(calcUInit || {})
        .filter(([k, v]) => (k === elemKey || k.endsWith('::' + elemKey)) && v?.res?.U)
        .map(([, v]) => parseFloat(v.res.U))
      if (vals.length === 0) return undefined
      return String(Math.max(...vals))
    }
    const uMuro  = getCalcUForElem('muro')  ?? termica.muro?.u
    const uTecho = getCalcUForElem('techo') ?? termica.techo?.u
    const uPiso  = getCalcUForElem('piso')  ?? termica.piso?.u
    const uPuerta = termica.puerta?.u
    // RF dinámicos desde OGUC Tabla 1 (letra a/b/c/d según superficie + pisos).
    // Si no hay datos OGUC, fallback al estático RF_DEF. CRÍTICO: los checks
    // del resumen DEBEN usar el mismo criterio que la pestaña Fuego, sino
    // aparecen contradicciones (ej. tabla muestra CUMPLE pero resumen NO CUMPLE).
    //
    // Reporte de Martin Contreras 2026-05-27: escaleras F30 vs F15 (OGUC letra
    // D) cumplía en la tabla pero el resumen seguía exigiendo F60 (RF_DEF).
    //
    // Causa raíz descubierta 2026-05-27 (2do screenshot): el wrapper
    // getRFOGUC_loaded en App.jsx:8948 pasa los args a obtenerRFOGUC en
    // ORDEN INCORRECTO (uso, destino, m2, pisos vs uso, superficie, pisos,
    // elemento) y NUNCA pasa elemId. Resultado: siempre retorna null →
    // siempre se usa el fallback RF_DEF.
    //
    // Workaround: usar la MISMA cadena que TabFuego (getLetraOGUC +
    // getRFDeLetra). Bypassa obtenerRFOGUC entera, garantiza coherencia.
    const _destinoOGUC = proy.destinoOGUC || (USO_TO_OGUC[uso]?.length === 1 ? USO_TO_OGUC[uso][0] : '')
    const _letraOgucR  = _destinoOGUC && proy.superficie && getLetraOGUC
      ? getLetraOGUC(_destinoOGUC, parseFloat(proy.superficie) || 0, parseInt(proy.pisos) || 1)
      : null
    const _ogucRfEsc   = _letraOgucR && getRFDeLetra ? getRFDeLetra(_letraOgucR, 'escaleras') : null
    const _ogucRfCub   = _letraOgucR && getRFDeLetra ? getRFDeLetra(_letraOgucR, 'cubierta')  : null
    const _ogucRfCaja  = _letraOgucR && getRFDeLetra ? getRFDeLetra(_letraOgucR, 'cajas_esc') : null
    const _rfReqEsc    = _ogucRfEsc  || RF_DEF[uso]?.escaleras || 'F0'
    const _rfReqCub    = _ogucRfCub  || RF_DEF[uso]?.cubierta  || 'F0'
    const _rfReqCaja   = _ogucRfCaja || RF_DEF[uso]?.cajas_esc || null
    // U-máx efectiva (zona DS N°15 vs PDA según tipo de obra) — misma fuente que
    // los paneles de Cálculo U y Térmica, para que los resúmenes no diverjan.
    const _umMuro  = uMaxEfectiva(proy.comuna, 'muro',  zona.muro,  proy.tipoObra)
    const _umTecho = uMaxEfectiva(proy.comuna, 'techo', zona.techo, proy.tipoObra)
    const _umPiso  = uMaxEfectiva(proy.comuna, 'piso',  zona.piso,  proy.tipoObra)
    // Rw de fachada: prioridad manual (override) → composición muro+ventana en
    // paralelo (el vidrio baja el conjunto) → null. Mismo criterio que el panel
    // Acústica, para que resumen y panel no diverjan.
    const _acFachReq = AC_DEF[uso]?.fachada || 0
    const _rwFachManual = termica.ac_fachada?.rw ? parseFloat(termica.ac_fachada.rw) : null
    const _rwFachComp = _rwFachManual == null
      ? rwFachadaCompuesta({ rwMuro: parseFloat(termica.muro?.rw) || 0, rwVentana: termica.ac_fachada?.rwVentana, pctVidriado: termica.ac_fachada?.pctVidriado })
      : null
    const _rwFachVal = _rwFachManual != null ? _rwFachManual : (_rwFachComp ? _rwFachComp.combinado : null)
    const _rows = [
      { label:'Muro U',            val: uMuro  ? String(parseFloat(uMuro).toFixed(4))  : null, max:`≤ ${_umMuro} W/m²K`,  ok: !uMuro  || uCumpleMax(uMuro,  _umMuro) },
      { label:'Techo U',           val: uTecho ? String(parseFloat(uTecho).toFixed(4)) : null, max:`≤ ${_umTecho} W/m²K`, ok: !uTecho || uCumpleMax(uTecho, _umTecho) },
      { label:'Piso U',            val: uPiso  ? String(parseFloat(uPiso).toFixed(4))  : null, max:`≤ ${_umPiso} W/m²K`,  ok: !uPiso  || uCumpleMax(uPiso,  _umPiso) },
      { label:'Puerta U',          val: uPuerta,                    max: PUERTA_U[proy.zona]?`≤ ${PUERTA_U[proy.zona]} W/m²K`:'—', ok: !uPuerta || !PUERTA_U[proy.zona] || parseFloat(uPuerta) <= PUERTA_U[proy.zona] },
      { label:'RF Estructura',     val: termica.rf_estructura?.rf,  max:`≥ ${rfReqEstr}`,             ok: !termica.rf_estructura?.rf  || rfN(termica.rf_estructura.rf) >= rfN(rfReqEstr) },
      { label:'RF Muros sep.',     val: termica.rf_muros_sep?.rf,   max:`≥ ${RF_DEF[uso]?.muros_sep}`,ok: !termica.rf_muros_sep?.rf   || rfN(termica.rf_muros_sep.rf)  >= rfN(RF_DEF[uso]?.muros_sep||'F0'), norma:'OGUC Art. 4.5.4' },
      // RF Caja escalera: solo se evalúa si la caja está en uso (OGUC obliga
      // o el usuario opt-in vía escaleras.tieneCaja). El val viene del state
      // lifted de escaleras (material elegido en CalcRFEscalera).
      ...(() => {
        const _cajaActiva = escaleras?.tieneCaja === null || escaleras?.tieneCaja === undefined
          ? requiereCajaEscalera(uso, proy.pisos)
          : !!escaleras?.tieneCaja
        if (!_cajaActiva) return []  // no se exige → fuera del resumen
        const _matCajaSel = MAT_ESCAL.find(m => m.id === (escaleras?.matCajaId || 'ha'))
        const _rfCajaSel  = _matCajaSel?.rfBase || null
        return [{
          label:'RF Caja escalera',
          val:   _rfCajaSel,
          max:   _rfReqCaja ? `≥ ${_rfReqCaja}` : '—',
          ok:    !_rfCajaSel || !_rfReqCaja || rfN(_rfCajaSel) >= rfN(_rfReqCaja),
          norma: 'OGUC Art. 4.5.7 Col.(4)',
        }]
      })(),
      // RF Escaleras: prioridad val → 1) input manual del dropdown · 2) material
      // elegido en CalcRFEscalera (escaleras.matId → MAT_ESCAL[].rfBase).
      (() => {
        // Escalera de evacuación exigible según uso/pisos (vivienda unifamiliar exenta)
        const _escReq = requiereCajaEscalera(uso, proy.pisos)
        const _matEscSel = MAT_ESCAL.find(m => m.id === (escaleras?.matId || 'ha'))
        const _valEsc = termica.rf_escaleras?.rf || _matEscSel?.rfBase || null
        if (!_escReq) return {
          label:'RF Escaleras', val:'No aplica — no exigible (uso/pisos)', max:'—', ok:true,
          informativo:true, norma:'OGUC Art. 4.5.7 Col.(9)',
        }
        return {
          label:'RF Escaleras',
          val:   _valEsc,
          max:   `≥ ${_rfReqEsc}`,
          ok:    !_valEsc || rfN(_valEsc) >= rfN(_rfReqEsc),
          norma: 'OGUC Art. 4.5.7 Col.(9)',
        }
      })(),
      { label:'RF Cubierta',       val: termica.rf_cubierta?.rf,    max:`≥ ${_rfReqCub}`,             ok: !termica.rf_cubierta?.rf    || rfN(termica.rf_cubierta.rf)   >= rfN(_rfReqCub), norma:'OGUC Art. 4.5.7 Col.(7)' },
      { label:'Rw entre unidades', val: termica.ac_entre_unidades?.rw ? termica.ac_entre_unidades.rw+' dB':null, max:`≥ ${AC_DEF[uso]?.entre_unidades} dB`, ok: !termica.ac_entre_unidades?.rw || parseFloat(termica.ac_entre_unidades.rw) >= (AC_DEF[uso]?.entre_unidades||0) },
      { label:'Rw fachada',        val: _rwFachVal != null ? `${_rwFachVal} dB${_rwFachComp ? ' (muro+ventana)' : ''}` : null, max:`≥ ${AC_DEF[uso]?.fachada} dB`, ok: _rwFachVal == null || _rwFachVal >= _acFachReq, norma: _rwFachComp ? 'Composición muro+ventana en paralelo (ISO 12354-3)' : undefined },
      { label:'Rw entre pisos',    val: termica.ac_entre_pisos?.rw  ? termica.ac_entre_pisos.rw+' dB':null,   max:`≥ ${AC_DEF[uso]?.entre_pisos} dB`,    ok: !termica.ac_entre_pisos?.rw   || parseFloat(termica.ac_entre_pisos.rw)   >= (AC_DEF[uso]?.entre_pisos||0) },
      (() => {
        // B7 · no aplica si el entrepiso no separa unidades distintas (Art. 4.1.6)
        const noAplicaImp = termica.ac_impacto_pisos?.entreUnidades === false
        const { base, mejora, efectivo } = lnwEfectivo(termica.ac_impacto_pisos)
        const lim = AC_IMPACT_DEF[uso]?.entre_pisos
        return { label:"L'n,w impacto pisos",
          val: noAplicaImp ? 'No aplica — misma unidad' : (base ? (mejora ? `${efectivo} dB (con ${mejora.codigo})` : `${base} dB`) : null),
          max: noAplicaImp ? '—' : `≤ ${lim} dB`,
          ok: noAplicaImp || !base || efectivo <= (lim||99),
          informativo: noAplicaImp || undefined,
          norma: uso==='Vivienda' ? 'OGUC Art. 4.1.6 (L\'nT,w ≤ 75 dB)' : 'NCh352:2013 (referencia)' }
      })(),
    ]
    // Cruce acústico ESTIMADO de una solución PDA de muro (Rw ley de masa vs
    // fachada NCh352). No certificado → informativo: se muestra pero NO gatea el
    // cumplimiento. Solo si el usuario aún no ingresó un Rw certificado de fachada.
    const _pdaMuro = termica.muro?.solucion
    if (_pdaMuro?.esPDA && _pdaMuro.rwEstimado != null && AC_DEF[uso]?.fachada && _rwFachVal == null) {
      _rows.push({
        label: 'Rw fachada (PDA · estimado)',
        val: `~${_pdaMuro.rwEstimado} dB`,
        max: `≥ ${AC_DEF[uso].fachada} dB`,
        ok: _pdaMuro.rwEstimado >= AC_DEF[uso].fachada,
        norma: 'Ley de masa (ISO 15712) — estimado, no certificado',
        informativo: true,
      })
    }
    return _rows.filter(c => c.val)
  }, [proy, termica, calcUInit, zona, uso])

  // allOk excluye los checks informativos (Rw estimado PDA) — no gatean el
  // cumplimiento certificado; el proyectista los verifica/certifica aparte.
  const allOk = checks.filter(c => !c.informativo).every(c => c.ok)

  // getCapasParaSC ahora es una utilidad de nivel de módulo (definida arriba en App.jsx)
  // — se usa por closure tanto aquí como en TabDetalles.

  async function exportarInforme(modo = 'export') {
    // modo === 'preview' → solo abrir vista previa (no consume token ni descarga)
    // modo === 'export'  → flujo normal (consume token + descarga/imprime)
    // ── Módulos activos (respeta selección manual o usa defaults) ─────────────
    const _uso = proy.uso || ''
    const _reqTermica  = !!proy.zona
    const _reqFuego    = !!(RF_DEF[_uso] && Object.values(RF_DEF[_uso]).some(v => v))
    const _reqAcustica = !!(AC_DEF[_uso] && (AC_DEF[_uso].entre_unidades || AC_DEF[_uso].entre_pisos || AC_DEF[_uso].fachada))
    const _haySistemas = (proy.estructuras?.length || 0) > 1
    const _hayVentanas = fachadas?.some(f => parseFloat(f.vanos) > 0 || parseFloat(f.areaFachada) > 0)
    const _hayPuertas  = (puertas || []).some(p => parseFloat(p.ancho) > 0 && parseFloat(p.alto) > 0 && p.hojaId && p.marcoId && p.selloId)
    const _pisosNumE   = Number(proy.pisos) || 0
    const _hayEscaleras = _pisosNumE >= 2 || !!escaleras?.incluido
    const _hayNotas    = Object.values(notas || {}).some(v => v?.toString().trim())
    const mods = {
      termica:   modulosInforme?.termica   ?? true,
      fuego:     modulosInforme?.fuego     ?? _reqFuego,
      acustica:  modulosInforme?.acustica  ?? _reqAcustica,
      sistemas:  modulosInforme?.sistemas  ?? _haySistemas,
      ventanas:  modulosInforme?.ventanas  ?? _hayVentanas,
      puertas:   modulosInforme?.puertas   ?? _hayPuertas,
      escaleras: modulosInforme?.escaleras ?? _hayEscaleras,
      notas:     modulosInforme?.notas     ?? _hayNotas,
    }

    // ── Validación de completitud ──────────────────────────────────────────────
    const faltantes = []
    if (!proy.nombre?.trim())   faltantes.push('Nombre del proyecto')
    if (!proy.zona)             faltantes.push('Zona térmica')
    if (!proy.uso)              faltantes.push('Uso del edificio')
    if (!proy.pisos)            faltantes.push('Número de pisos')
    const tieneTermica = Object.keys(termica).some(k => termica[k]?.u || termica[k]?.solucion)
    const tieneCalcU   = Object.keys(calcUInit || {}).some(k => calcUInit[k]?.res)
    if (!tieneTermica && !tieneCalcU) faltantes.push('Datos térmicos (Térmica o Cálculo U)')
    if (faltantes.length > 0 && modo === 'export') {
      const continuar = window.confirm(
        `⚠ El informe tiene datos incompletos:\n\n${faltantes.map(f => `  • ${f}`).join('\n')}\n\n¿Desea exportar el informe de todas formas?`
      )
      if (!continuar) return
    }
    // Verificar y consumir crédito de proyecto antes de generar
    // En modo 'preview' NO consumimos token — es solo visualización.
    if (onExportar && modo === 'export') {
      const permitido = await onExportar()
      if (!permitido) return
    }
    const fechaHoy = new Date().toLocaleDateString('es-CL')
    const zonaData = zona

    // ── Logo como base64 para embeber en el HTML ──────────────────────────────
    const logoDataUrl = await fetch('/logo.png')
      .then(r => r.blob())
      .then(b => new Promise(res => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.readAsDataURL(b) }))
      .catch(() => '')

    // Helper: busca calcUData para un elemento en claves simples Y compuestas.
    // PRIORIDAD (en orden, primero que matchee):
    // 1. Entry con correccionAplicada (estado más reciente del usuario, ej:
    //    reordenamiento, sustitución de aislante, etc.). Crítico para no
    //    mostrar el orden original cuando ya se aplicó una corrección.
    // 2. Entry cuyo solucion.cod coincide con termica[elemKey] (solución
    //    actualmente aplicada) — evita usar capas STALE de soluciones antiguas.
    // 3. Entry con capas modificadas manualmente (capas presentes + sin match
    //    de solución).
    // 4. Fallback: el de peor U (más conservador).
    function getCalcUData(elemKey) {
      const entries = Object.entries(calcUInit || {})
        .filter(([k, v]) => (k === elemKey || k.endsWith('::' + elemKey)) && v)
      if (!entries.length) return null

      // 1) Prioridad MÁXIMA: entries con correccionAplicada
      //    (representan el estado actual modificado del usuario)
      const conCorreccion = entries.filter(([, v]) => v?.correccionAplicada)
      if (conCorreccion.length) {
        // Si hay varias correcciones, tomar la más reciente por aplicada_en
        conCorreccion.sort((a, b) => {
          const ta = new Date(a[1].correccionAplicada?.aplicada_en || 0).getTime()
          const tb = new Date(b[1].correccionAplicada?.aplicada_en || 0).getTime()
          return tb - ta
        })
        return conCorreccion[0][1]
      }

      // 2) Match exacto con la solución actualmente aplicada
      const solActual = termica?.[elemKey]?.solucion?.cod
      if (solActual) {
        const matching = entries.find(([, v]) => v?.solucion?.cod === solActual)
        if (matching) return matching[1]
      }

      // 3) Entries con capas modificadas (tienen capas pero sin solucion.cod
      //    que matchee — probablemente edición manual del usuario)
      const conCapas = entries.filter(([, v]) => v?.capas?.length > 0)
      if (conCapas.length === 1) return conCapas[0][1]

      // 4) Fallback: peor U
      entries.sort((a, b) => parseFloat(b[1]?.res?.U || 0) - parseFloat(a[1]?.res?.U || 0))
      return entries[0][1]
    }

    // ── Sección térmica por elemento ──────────────────────────────────────────
    const seccionesTermicas = ELEMS_DEF.map(el => {
      const data = termica[el.key]
      const calcUData = getCalcUData(el.key)
      if (!data?.u && !data?.solucion && !calcUData) return ''
      const sc = data?.solucion
      const capasModif = calcUData?.capas    // capas modificadas (si las hay)
      const resModif   = calcUData?.res      // resultado precalculado (si existe)
      const capasOriginal = sc ? getCapasParaSC(sc) : null
      const capas = capasModif?.length ? capasModif : capasOriginal

      const cv = capas ? capas.map(c => c.esCamara
        ? { esCamara: true }
        : { mat: c.mat, lam: parseFloat(c.lam), esp: parseFloat(c.esp) / 1000, mu: parseFloat(c.mu || 1) }
      ).filter(c => c.esCamara || (!isNaN(c.lam) && c.lam > 0 && !isNaN(c.esp) && c.esp > 0)) : null

      // Preferir resultado ya calculado sobre recalcular desde cero
      const res = resModif || ((cv?.length && zonaData) ? calcGlaser(cv, zonaData.Ti, zonaData.Te, zonaData.HR, el.tipo) : null)
      const uCalc = res ? parseFloat(res.U) : (data?.u ? parseFloat(data.u) : null)
      const tbPct = parseFloat(data?.tb || 0)
      const uCalcCorr = (uCalc != null && tbPct > 0) ? uCalc * (1 + tbPct/100) : uCalc
      const cumpleU = el.umax ? (uCalcCorr != null && uCalcCorr <= el.umax) : true

      // Indicador de si hay diferencia REAL con las capas originales del LOSCAT
      // (comparando contenido, no solo presencia). Esto evita mostrar el esquema
      // comparativo cuando capasModif === capasOriginal (caso común al cargar
      // una solución sin modificarla).
      const capasIguales = (a, b) => {
        if (!a || !b || a.length !== b.length) return false
        for (let i = 0; i < a.length; i++) {
          const ca = a[i], cb = b[i]
          if (!!ca?.esCamara !== !!cb?.esCamara) return false
          if ((ca?.mat || '') !== (cb?.mat || '')) return false
          if (String(ca?.lam ?? '') !== String(cb?.lam ?? '')) return false
          if (String(ca?.esp ?? '') !== String(cb?.esp ?? '')) return false
          if (String(ca?.mu ?? '') !== String(cb?.mu ?? '')) return false
        }
        return true
      }
      const hayModifCapas = !!(capasModif?.length && capasOriginal?.length && !capasIguales(capasModif, capasOriginal))

      // Tabla de capas con R por capa
      let tablaCapa = ''
      if (capas?.length) {
        const rsiKey = el.tipo === 'techumbre' ? 'techo' : el.tipo === 'piso' ? 'piso' : 'muro'
        const RSi = RSI_MAP[rsiKey] || 0.13, RSe = RSE_MAP[rsiKey] || 0.04
        let Racum = 0
        const rows = capas.map((c, i) => {
          const rCam = c.esCamara ? resistenciaCamara((parseFloat(c.esp)||0)/1000) : 0
          const rC = c.esCamara ? rCam : (parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0 ? (parseFloat(c.esp) / 1000) / parseFloat(c.lam) : 0)
          Racum += rC
          const matNorm = c.esCamara ? null : ALL_MATS.find(m => m.n?.toLowerCase() === (c.mat||'').toLowerCase())
          const fuenteLam = c.esCamara ? 'ISO 6946:2017 (R según espesor)' : (matNorm ? 'NCh853:2021 Anexo / LOSCAT Ed.13' : (c.lam ? 'Dato fabricante / LOSCAT' : '—'))
          return `<tr>
            <td>${i + 1}</td>
            <td>${c.esCamara ? '<i>Cámara de aire</i>' : (c.mat || '—')}</td>
            <td>${c.esCamara ? '—' : (c.lam ?? '—')}</td>
            <td>${c.esCamara ? (c.esp ? c.esp : '—') : (c.esp ?? '—')}</td>
            <td>${c.esCamara ? '≈ 1' : (c.mu ?? '—')}</td>
            <td>${c.esCamara ? '= ' + rCam.toFixed(2) : (parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0 ? (parseFloat(c.esp) / 1000 / parseFloat(c.lam)).toFixed(4) : '—')}</td>
            <td style="font-size:8.5pt;color:#64748b">${fuenteLam}</td>
          </tr>`
        }).join('')
        // B1 · Fuente única: el R total / U impresos provienen de `res` (el mismo
        // cálculo que alimenta el criterio y el Glaser), NO de un recómputo local.
        // Así los cinco lugares del informe muestran el mismo valor. El recómputo
        // local (RtotLocal, suma directa de todas las capas) solo es fallback y
        // sirve para explicar la cámara ventilada (donde R total < suma directa).
        const RtotLocal = RSi + Racum + RSe
        const RtotFinal = (res && res.Rtot != null) ? parseFloat(res.Rtot) : RtotLocal
        const Ufinal    = (res && res.U != null) ? parseFloat(res.U) : (1 / RtotLocal)
        const ventTrunc = res && res.Rtot != null && Math.abs(parseFloat(res.Rtot) - RtotLocal) > 0.005
        tablaCapa = `<table>
          <tr><th>#</th><th>Material</th><th>λ (W/mK)</th><th>e (mm)</th><th>μ</th><th>R (m²K/W)</th><th>Fuente dato λ</th></tr>
          ${rows}
          <tr class="subtotal"><td colspan="2"><b>RSi — Resistencia sup. interior</b></td><td colspan="3">${rsiKey} (NCh853 Tabla)</td><td><b>${RSi}</b></td><td style="font-size:8.5pt;color:#64748b">NCh853:2021 Tabla E.1</td></tr>
          <tr class="subtotal"><td colspan="2"><b>RSe — Resistencia sup. exterior</b></td><td colspan="3"></td><td><b>${RSe}</b></td><td style="font-size:8.5pt;color:#64748b">NCh853:2021 Tabla E.1</td></tr>
          <tr class="total"><td colspan="2"><b>R<sub>total</sub></b></td><td colspan="3"></td><td><b>${RtotFinal.toFixed(4)} m²K/W</b></td><td></td></tr>
          <tr class="total"><td colspan="2"><b>U = 1 / R<sub>total</sub></b></td><td colspan="3"></td><td><b>${Ufinal.toFixed(4)} W/m²K</b></td><td></td></tr>
        </table>${ventTrunc ? `<div style="font-size:8.5pt;color:#475569;margin-top:4px">Cámara ventilada (ISO 6946 §6.9.3): las capas hacia el exterior de la cámara no contribuyen al R total, por lo que R<sub>total</sub> = <b>${RtotFinal.toFixed(4)}</b> es menor que la suma directa de todas las capas (${RtotLocal.toFixed(4)}). El U impreso proviene del mismo cálculo del criterio y del gráfico de Glaser.</div>` : ''}`
      } else if (data?.u) {
        tablaCapa = `<div class="aviso">Valor U ingresado manualmente: <b>${data.u} W/m²K</b> (sin detalle de capas disponible)</div>`
      }

      // Glaser SVG + tabla de interfaces (solo envolvente — no aplica en tabiques)
      const esTabiqueRpt = el.key === 'tabique'
      let glaserHtml = ''
      if (esTabiqueRpt) {
        glaserHtml = `<div class="ok-box" style="color:#0f766e;background:#f0fdfa;border-color:#99f6e4">ℹ Tabique interior — verificación higrotérmica (Método de Glaser, NCh1973:2014) no aplica. La norma exige esta verificación solo para elementos de la envolvente en contacto con el exterior.</div>`
      } else if (res) {
        const svgStr = glaserSvgStr(res, capas || [])
        glaserHtml = `
<h3>${el.label} — Verificación higrotérmica (Método de Glaser, NCh1973:2014)</h3>
${svgStr ? `<div class="fig">${svgStr}
  <div class="fig-cap">Figura: Perfil de temperatura (azul continuo) y punto de rocío (naranja discontinuo) — <b>${el.label}</b>.<br>
  Ti = ${zonaData.Ti}°C · Te = ${zonaData.Te}°C · HR = ${zonaData.HR}% · Zona ${proy.zona}. Puntos rojos indican condensación.</div>
</div>` : ''}
<div class="data-row">
  <div class="data-item"><label>Temperatura de rocío interior</label><span>${res.Tdew} °C</span></div>
  <div class="data-item"><label>Pvap interior (Ti, HR=${zonaData.HR}%)</label><span>${res.Pvsi} Pa</span></div>
  <div class="data-item"><label>Pvap exterior (Te, HR=80%)</label><span>${res.Pvse} Pa</span></div>
  <div class="data-item"><label>R<sub>total</sub></label><span>${res.Rtot?.toFixed(4)} m²K/W</span></div>
</div>
<table>
  <tr><th>Interfaz</th><th>T (°C)</th><th>Pvsat (Pa)</th><th>Pvreal (Pa)</th><th>Margen (Pa)</th><th>Estado</th></tr>
  ${res.ifaces.map(f => `<tr class="${f.riesgo ? 'riesgo' : ''}">
    <td>Int. ${f.i}</td><td>${f.T} °C</td><td>${f.pvSat} Pa</td><td>${f.pvReal} Pa</td>
    <td style="color:${f.margen >= 0 ? '#166534' : '#dc2626'};font-weight:700">${f.margen >= 0 ? '+' : ''}${f.margen} Pa</td>
    <td><b>${f.riesgo ? '⚠ CONDENSACIÓN' : '✓ OK'}</b></td>
  </tr>`).join('')}
</table>
${res.condInter
  ? `<div class="no-box">⚠ Riesgo de condensación intersticial en ${el.label} — requiere corrección antes de presentar al DOM.</div>`
  : `<div class="ok-box">✓ Sin condensación intersticial. El ${el.label} cumple las exigencias higrotérmicas de la NCh1973:2014.</div>`}
`
      }

      const cumpleRF = !el.rfReq || !data?.rf || rfN(data.rf) >= rfN(el.rfReq)
      const rwNum = parseInt(data?.rw || 0)
      const cumpleRw = !el.rwReq || !rwNum || rwNum >= el.rwReq

      // ── Diagrama SVG de sección ──────────────────────────────────────────
      let seccionHtml = ''
      if (capas?.length) {
        const uParaDiag = uCalcCorr != null ? uCalcCorr : (uCalc != null ? uCalc : null)
        if (hayModifCapas && capasOriginal?.length) {
          // Mostrar ambas secciones: original arriba, modificada abajo
          const uOrigCalc = (() => {
            const cvO = capasOriginal.map(c => c.esCamara ? { esCamara:true } : { mat:c.mat, lam:parseFloat(c.lam), esp:parseFloat(c.esp)/1000, mu:parseFloat(c.mu||1) }).filter(c => c.esCamara||(c.lam>0&&c.esp>0))
            if (!cvO.length || !zonaData) return null
            const rO = calcGlaser(cvO, zonaData.Ti, zonaData.Te, zonaData.HR, el.tipo)
            return rO ? parseFloat(rO.U) : null
          })()
          const svgOrig  = capasSeccionSvgStr(capasOriginal, { titulo:`Configuración original LOSCAT ${sc?.cod} (int → ext)`, uCalc: uOrigCalc, uMax: el.umax, label: el.label })
          const svgModif = capasSeccionSvgStr(capas,         { titulo:`Configuración modificada — ${el.label} (int → ext)`,   uCalc: uParaDiag,  uMax: el.umax, label: el.label })
          seccionHtml = `
<h3>📐 Diagrama de sección — original vs. modificado</h3>
<div class="fig" style="margin-bottom:8px">
  ${svgOrig}
  <div class="fig-cap">Sección original — LOSCAT ${sc?.cod}${uOrigCalc != null ? ` · U = ${uOrigCalc.toFixed(4)} W/m²K` : ''}</div>
</div>
<div class="fig">
  ${svgModif}
  <div class="fig-cap">Sección modificada — ${el.label}${uParaDiag != null ? ` · U = ${parseFloat(uParaDiag).toFixed(4)} W/m²K` : ''}</div>
</div>`
        } else {
          const svgSec = capasSeccionSvgStr(capas, { titulo:`${el.label}${sc ? ` — LOSCAT ${sc.cod}` : ''} (int → ext)`, uCalc: uParaDiag, uMax: el.umax, label: el.label })
          seccionHtml = `
<h3>📐 Diagrama de sección constructiva</h3>
<div class="fig">
  ${svgSec}
  <div class="fig-cap">${el.label}${sc ? ` — LOSCAT ${sc.cod}` : ''} · Sección transversal (int → ext) · ISO 6946</div>
</div>`
        }
      }

      // ── Memoria descriptiva automática ────────────────────────────────────
      const tipoSistema = sc ? sc.desc : (capas?.length ? 'sistema constructivo personalizado' : 'solución ingresada manualmente')
      // B10 · sin redondear: Math.round(0.5)=1 hacía que el zincalum (0.5 mm) saliera
      // como "1 mm" en la memoria descriptiva mientras la tabla mostraba 0.5 mm.
      const capasDescr = capas?.filter(c => !c.esCamara).map(c => `${c.mat} (${parseFloat(c.esp||0)} mm)`).join(', ')
      const espTotal = capas ? capas.filter(c=>!c.esCamara).reduce((a,c)=>a+parseFloat(c.esp||0),0).toFixed(0) : null
      const uValDescr = uCalcCorr != null ? parseFloat(uCalcCorr).toFixed(4) : (data?.u ? parseFloat(data.u).toFixed(4) : null)
      const funciones = { muro:'aislación térmica de la envolvente exterior, control higrotérmico y soporte de cargas laterales', techo:'protección frente a precipitaciones, aislación térmica superior y control de condensación', piso:'aislación térmica del piso ventilado respecto al subsuelo o exterior', tabique:'separación interior entre recintos con control acústico y eventual RF', ventana:'transmisión de luz natural con control de pérdidas térmicas y ganancias solares' }
      const funcion = funciones[el.key] || 'desempeño energético y normativo'
      let memoriaDescriptiva = ''
      if (uValDescr) {
        const margenPct = el.umax ? (((el.umax - parseFloat(uValDescr)) / el.umax) * 100).toFixed(1) : null
        const cumpleTexto = el.umax ? (parseFloat(uValDescr) <= el.umax ? `cumple con la exigencia térmica` : `no cumple con la exigencia térmica`) : `no tiene límite U asignado para esta zona`
        memoriaDescriptiva = `<div class="mem-desc">
  <div class="mem-desc-title">📄 Memoria descriptiva — ${el.label}</div>
  <p>El sistema de <b>${el.label.toLowerCase()}</b> corresponde a ${tipoSistema}${sc ? ` (LOSCAT ${sc.cod})` : ''}${capasDescr ? `, compuesto por las siguientes capas desde interior a exterior: <b>${capasDescr}</b>` : ''}. ${espTotal ? `El espesor total de capas sólidas es de <b>${espTotal} mm</b>.` : ''}</p>
  <p>Este sistema cumple la función de ${funcion}${hayModifCapas ? ' (configuración modificada respecto al LOSCAT original)' : ''}.</p>
  <p><b>Resultado térmico:</b> El coeficiente de transmitancia térmica calculado es <b>U = ${uValDescr} W/m²K</b>${tbPct>0?` (incluyendo corrección por puente térmico de ${tbPct}%)`:''}${el.umax?`, inferior al máximo permitido de <b>${el.umax} W/m²K</b> según <b>DS N°15 MINVU</b> para Zona Térmica ${proy.zona}, por lo que <b>${cumpleTexto}</b>`:''}. ${margenPct !== null ? `El margen de cumplimiento es de <b>${Math.abs(parseFloat(margenPct))}%</b> ${parseFloat(margenPct)>=0?'sobre':'bajo'} el límite exigido.` : ''}</p>
</div>`
      }

      // Calcular homologación de los 3 códigos normativos
      let homologHtml = ''
      if (sc) {
        try {
          const homol = homologarSolucion(sc, { rfRequerido: el.rfReq, rwRequerido: el.rwReq })
          if (homol) {
            const t = homol.termico, f = homol.fuego, a = homol.acustico
            const intr = (v) => v?.intrinseco === true ? '<span style="background:#dcfce7;color:#166534;font-size:8pt;padding:1px 5px;border-radius:3px;font-weight:600">intrínseco</span>'
                            : v?.intrinseco === false ? '<span style="background:#fef3c7;color:#92400e;font-size:8pt;padding:1px 5px;border-radius:3px;font-weight:600">requiere capas</span>'
                            : ''
            homologHtml = `<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:6px;padding:10px 12px;margin:6px 0">
              <div style="font-size:11pt;font-weight:700;color:#0f766e;margin-bottom:6px">📋 Códigos normativos homologados</div>
              <table style="width:100%;border-collapse:collapse;font-size:9pt">
                <tr>
                  <th style="background:#ccfbf1;color:#0e6560;padding:4px 6px;text-align:left;width:33%">🌡️ Térmico (LOSCAT)</th>
                  <th style="background:#fee2e2;color:#dc2626;padding:4px 6px;text-align:left;width:33%">🔥 Fuego (LOFC Ed.17)</th>
                  <th style="background:#f3e8ff;color:#7c3aed;padding:4px 6px;text-align:left;width:34%">🔇 Acústico (LOSCAA 2024)</th>
                </tr>
                <tr style="vertical-align:top">
                  <td style="padding:6px;border:1px solid #e2e8f0;font-family:monospace;font-size:9pt">
                    <b>${t?.codigo_base || '—'}</b>
                    ${t?.u != null ? `<br/><span style="font-family:sans-serif;color:#64748b">U = ${t.u} W/m²K</span>` : ''}
                  </td>
                  <td style="padding:6px;border:1px solid #e2e8f0;font-family:monospace;font-size:9pt">
                    ${f?.codigo_base ? `<b>${f.codigo_base}</b>${intr(f) ? ' ' + intr(f) : ''}` : '<span style="color:#94a3b8">—</span>'}
                    ${f?.rf ? `<br/><span style="font-family:sans-serif;color:#64748b">RF = ${f.rf}</span>` : ''}
                  </td>
                  <td style="padding:6px;border:1px solid #e2e8f0;font-family:monospace;font-size:9pt">
                    ${a?.codigo_base ? `<b>${a.codigo_base}</b>${intr(a) ? ' ' + intr(a) : ''}` : '<span style="color:#94a3b8">—</span>'}
                    ${a?.rw ? `<br/><span style="font-family:sans-serif;color:#64748b">${a.rw_tipo || 'Rw'} = ${a.rw} dB</span>` : ''}
                  </td>
                </tr>
              </table>
              ${homol.estructura_base?.material ? `<div style="font-size:8pt;color:#64748b;margin-top:6px;font-style:italic">Estructura base detectada: ${homol.estructura_base.material.replace(/_/g, ' ')}${homol.estructura_base.espesor_estructura_mm ? ' ' + homol.estructura_base.espesor_estructura_mm + 'mm' : ''}</div>` : ''}
            </div>`
          }
        } catch (e) { /* silent: si falla la homologación, omitir el panel */ }
      }

      // ── Sello visual de estado del elemento ────────────────────────────────
      // Lógica:
      //   ok   → todos los parámetros aplicables cumplen y (si aplica) sin condensación
      //   cond → U/RF/Rw cumplen pero hay riesgo higrotérmico (envolvente solamente)
      //   no   → algún parámetro normativo no cumple
      const fallos = []
      if (el.umax && uCalcCorr != null && !cumpleU)
        fallos.push(`U = ${parseFloat(uCalcCorr).toFixed(4)} W/m²K (máx ${el.umax})`)
      if (el.rfReq && data?.rf && !cumpleRF)
        fallos.push(`RF ${data.rf} (mín ${el.rfReq})`)
      if (el.rwReq && rwNum && !cumpleRw)
        fallos.push(`Rw ${rwNum} dB (mín ${el.rwReq} dB)`)
      const hayCondensacion = !esTabiqueRpt && res?.condInter
      let estadoElem, selloLabel, selloDetalle
      if (fallos.length > 0) {
        estadoElem = 'no'
        selloLabel = '✗ NO CUMPLE'
        selloDetalle = `Incumplimientos: ${fallos.join(' · ')}.${hayCondensacion ? ' Además existe riesgo de condensación intersticial.' : ''}`
      } else if (hayCondensacion) {
        estadoElem = 'cond'
        selloLabel = '⚠ CONDENSACIÓN'
        selloDetalle = 'Los parámetros U, RF y Rw cumplen, pero existe riesgo de condensación intersticial — requiere corrección antes de presentar al DOM.'
      } else {
        estadoElem = 'ok'
        selloLabel = '✓ CUMPLE'
        const cumplidos = []
        if (el.umax && cumpleU) cumplidos.push('U')
        if (el.rfReq && cumpleRF && data?.rf) cumplidos.push('RF')
        if (el.rwReq && cumpleRw && rwNum) cumplidos.push('Rw')
        if (!esTabiqueRpt && res && !res.condInter) cumplidos.push('higrotermia')
        selloDetalle = `Todos los parámetros normativos${cumplidos.length ? ` (${cumplidos.join(', ')})` : ''} conformes a la exigencia.`
      }
      const selloHtml = `<div class="estado-banner estado-${estadoElem}">
  <span class="sello">${selloLabel}</span>
  <span class="detalle">${selloDetalle}</span>
</div>`

      return `
<h3>${el.label}${sc ? ` — LOSCAT ${sc.cod}` : ''}</h3>
${selloHtml}
${sc ? `<div class="data-row">
  <div class="data-item"><label>Código LOSCAT</label><span>${sc.cod}</span></div>
  <div class="data-item"><label>Descripción</label><span>${sc.desc}</span></div>
  ${sc.obs ? `<div class="data-item" style="flex-basis:100%"><label>Nota de la ficha (catálogo LOSCAT)</label><span style="font-weight:normal;font-size:10pt;color:#64748b">${sc.obs} <span style="font-size:8pt">— texto de la ficha de catálogo, no específico de este proyecto</span></span></div>` : ''}
</div>` : ''}
${homologHtml}
${memoriaDescriptiva}
${hayModifCapas ? `<div class="aviso" style="background:#fff7ed;border-color:#fed7aa;color:#92400e">⚙ Capas modificadas en Cálculo U respecto a la solución original LOSCAT ${sc?.cod}. El cálculo de U y la verificación higrotérmica reflejan la configuración modificada.</div>` : ''}

${seccionHtml}

${tablaCapa}

<table>
  <tr><th>Criterio normativo</th><th>Valor de diseño</th><th>Exigencia mínima</th><th>Norma / Fuente</th><th>Estado</th></tr>
  ${el.umax ? `<tr>
    <td>Transmitancia térmica U${tbPct > 0 ? ` <span style="font-size:9pt;color:#b45309">(+${tbPct}% puente térmico)</span>` : ''}${hayModifCapas ? ' <span style="font-size:9pt;color:#92400e">(capas modificadas)</span>' : ''}</td>
    <td><b>${uCalcCorr != null ? uCalcCorr.toFixed(4) + ' W/m²K' : data?.u ? data.u + ' W/m²K' : '—'}</b>${tbPct > 0 && uCalc != null ? ` <span style="font-size:9pt;color:#64748b">(base ${uCalc.toFixed(4)})</span>` : ''}</td>
    <td>≤ ${el.umax} W/m²K</td>
    <td>DS N°15 MINVU · Zona ${proy.zona} · ${el.label}</td>
    <td><span class="${cumpleU ? 'badge-ok' : 'badge-no'}">${cumpleU ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
  </tr>` : ''}
  ${data?.rf ? `<tr>
    <td>Resistencia al fuego RF</td>
    <td><b>${data.rf}</b></td>
    <td>${el.rfReq ? `≥ ${el.rfReq}` : '—'}</td>
    <td>OGUC Art. 4.5.4 · LOFC Ed.17</td>
    <td><span class="${cumpleRF ? 'badge-ok' : 'badge-no'}">${cumpleRF ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
  </tr>` : ''}
  ${data?.rw ? `<tr>
    <td>Aislamiento acústico Rw</td>
    <td><b>${data.rw} dB</b></td>
    <td>${el.rwReq ? `≥ ${el.rwReq} dB` : '—'}</td>
    <td>OGUC Art. 4.1.6 · NCh352:2013</td>
    <td><span class="${cumpleRw ? 'badge-ok' : 'badge-no'}">${cumpleRw ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
  </tr>` : ''}
</table>
${glaserHtml}`
    }).filter(Boolean).join('<hr class="sep">')

    // ── Tabla RF — aplicando OGUC Tít. 4 Cap. 3 Tabla 1 cuando hay m² ─────────
    const _destOGUCRpt = proy.destinoOGUC || (USO_TO_OGUC[uso]?.length===1 ? USO_TO_OGUC[uso][0] : '')
    const _letraRpt    = getLetraOGUC_loaded(_destOGUCRpt, proy.superficie, proy.pisos)
    const rfElemDefsRpt = [
      { id:'estructura', label:'Estructura principal (sobre terreno)',  col:2, colLabel:'(2)' },
      { id:'muros_sep',  label:'Muros separación entre propietarios',   col:3, colLabel:'(3)' },
      { id:'cajas_esc',  label:'Cajas de escalera / ascensores',        col:4, colLabel:'(4)' },
      { id:'escaleras',  label:'Escaleras / Vías de escape',            col:9, colLabel:'(9)' },
      { id:'cubierta',   label:'Cubierta',                              col:7, colLabel:'(7)' },
      { id:'entrepisos', label:'Entrepisos / Losas de separación',      col:8, colLabel:'(8)' },
    ]
    const rfFromSol = {
      estructura: termica.muro?.rf || termica.techo?.rf || termica.piso?.rf || '',
      cubierta:   termica.techo?.rf || '',
      muros_sep:  termica.tabique?.rf || termica.muro?.rf || '',
      escaleras:  '',
    }
    const rfRows = rfElemDefsRpt.map(e => {
      // RF requerida: 1) OGUC Tabla 1 por letra+columna (preferente).
      // 2) Fallback a RF_DEF/RF_PISOS cuando la tabla OGUC no fija ese elemento
      //    en esa letra (p. ej. Cubierta col (7) en Letra D queda vacía). Sin este
      //    fallback el informe mostraba "—" mientras la pestaña Fuego y el resumen
      //    —que sí caen a RF_DEF— mostraban el requerido y CUMPLE (inconsistencia).
      let req = null
      let fuenteReq = ''
      if (_letraRpt) {
        req = ogucDataReady.OGUC_RF_LETRAS[_letraRpt.toLowerCase()]?.[e.col] || null
        if (req) fuenteReq = `Tabla 1 · Letra ${_letraRpt.toUpperCase()} ${e.colLabel}`
      }
      if (!req) {
        req = e.id === 'estructura' ? RF_PISOS(uso, proy.pisos) : (RF_DEF[uso]?.[e.id] || null)
        if (req) fuenteReq = 'RF_DEF (referencial)'
      }
      const rfP = termica['rf_' + e.id]?.rf || rfFromSol[e.id] || ''
      const ok = !req || !rfP || rfN(rfP) >= rfN(req)
      const src = termica['rf_' + e.id]?.rf ? 'manual' : rfFromSol[e.id] ? 'solución' : ''
      return `<tr>
        <td>${e.label}</td>
        <td><b>${rfP || '—'}</b>${src ? ` <span style="font-size:9pt;color:#64748b">(${src})</span>` : ''}</td>
        <td style="color:#dc2626;font-weight:700">${req || '—'}${fuenteReq?`<br><span style="font-size:8pt;font-weight:400;color:#64748b">${fuenteReq}</span>`:''}</td>
        <td style="color:#64748b;font-size:9pt">${e.colLabel}</td>
        <td>${rfP && req ? `<span class="${ok ? 'badge-ok' : 'badge-no'}">${ok ? 'CUMPLE' : 'NO CUMPLE'}</span>` : '—'}</td>
      </tr>`
    }).join('')

    // ── Tabla Rw acústica ─────────────────────────────────────────────────────
    const acElemsRpt = [
      { id: 'entre_unidades', label: 'Entre unidades habitacionales', req: AC_DEF[uso]?.entre_unidades },
      { id: 'fachada',        label: 'Fachada exterior',              req: AC_DEF[uso]?.fachada },
      { id: 'entre_pisos',    label: 'Entre pisos — ruido aéreo',     req: AC_DEF[uso]?.entre_pisos },
    ]
    const rwFromSol = {
      entre_unidades: termica.muro?.rw || termica.tabique?.rw || '',
      fachada:        termica.muro?.rw || '',
      entre_pisos:    termica.piso?.rw || termica.techo?.rw || '',
    }
    const rwRows = acElemsRpt.map(e => {
      const rw = parseFloat(termica['ac_' + e.id]?.rw || rwFromSol[e.id] || 0)
      const src = termica['ac_' + e.id]?.rw ? 'manual' : rwFromSol[e.id] ? 'solución' : ''
      const ok = !e.req || !rw || rw >= e.req
      return `<tr>
        <td>${e.label}</td>
        <td><b>${rw || '—'} ${rw ? 'dB' : ''}</b>${src ? ` <span style="font-size:9pt;color:#64748b">(${src})</span>` : ''}</td>
        <td style="color:#0f766e;font-weight:700">${e.req ? e.req + ' dB' : '—'}</td>
        <td>${rw && e.req ? `<span class="${ok ? 'badge-ok' : 'badge-no'}">${ok ? 'CUMPLE' : 'NO CUMPLE'}</span>` : '—'}</td>
      </tr>`
    }).join('')
    const { base: lnwImpact, mejora: lnwMejora, efectivo: lnwEfec } = lnwEfectivo(termica.ac_impacto_pisos)
    const lnwReq = AC_IMPACT_DEF[uso]?.entre_pisos
    const lnwCumple = !lnwImpact || !lnwReq || lnwEfec <= lnwReq
    const lnwNoAplica = termica.ac_impacto_pisos?.entreUnidades === false  // B7
    const lnwRow = lnwNoAplica
      ? `<tr>
      <td>Entre pisos — ruido de impacto L'n,w</td>
      <td>—</td>
      <td style="color:#0f766e;font-weight:700">—</td>
      <td><span style="color:#64748b">NO APLICA</span> <span style="font-size:8.5pt;color:#64748b">— el entrepiso no separa unidades distintas (OGUC Art. 4.1.6 exige impacto entre unidades de vivienda distintas)</span></td>
    </tr>`
      : lnwImpact ? `<tr>
      <td>Entre pisos — ruido de impacto L'n,w${lnwMejora ? ` <span style="font-size:9pt;color:#64748b">+ ${lnwMejora.codigo} ${lnwMejora.titulo} (ΔL,w −${lnwMejora.delta_lw})</span>` : ''}</td>
      <td><b>${lnwEfec} dB</b>${lnwMejora ? ` <span style="font-size:9pt;color:#64748b">(base ${lnwImpact})</span>` : ''}</td>
      <td style="color:#0f766e;font-weight:700">${lnwReq ? '≤ '+lnwReq+' dB' : '—'}</td>
      <td>${lnwReq ? `<span class="${lnwCumple?'badge-ok':'badge-no'}">${lnwCumple?'CUMPLE':'NO CUMPLE'}</span>` : '—'}</td>
    </tr>` : ''

    // ── Resumen ejecutivo ─────────────────────────────────────────────────────
    // (allOkLocal se calcula DESPUÉS de extender con condensación y VPCT
    // para incluir esos chequeos en el estado global del proyecto)

    // Agregar condensación y VPCT al resumen
    // IMPORTANTE: Sobreescribir U declarado del LOSCAT con U REAL calculado
    // a partir de las capas. Esto evita falsos CUMPLE cuando el LOSCAT declara
    // un U que no coincide con el cálculo correcto (p.ej. piso ventilado con
    // RSi/RSe distintos al muro original que se aplicó).
    const checksExtendido = [...checks]

    // Mapa label → recálculo desde capas
    const _uRecalc = {}
    ELEMS_DEF.forEach(el => {
      if (el.key === 'tabique') return
      const calcUData = getCalcUData(el.key)
      const data = termica[el.key]
      const sc = data?.solucion
      const capasModif = calcUData?.capas
      const capasOriginal = sc ? getCapasParaSC(sc) : null
      const capas = capasModif?.length ? capasModif : capasOriginal
      const resModif = calcUData?.res
      if (!capas?.length || !zonaData) return
      const cv = capas.map(c => c.esCamara ? { esCamara:true } : { mat:c.mat, lam:parseFloat(c.lam), esp:parseFloat(c.esp)/1000, mu:parseFloat(c.mu||1) }).filter(c => c.esCamara||(c.lam>0&&c.esp>0))
      if (!cv.length) return
      const res = resModif || calcGlaser(cv, zonaData.Ti, zonaData.Te, zonaData.HR, el.tipo)
      if (!res) return
      const uReal = parseFloat(res.U)
      _uRecalc[el.label] = { uReal, res, capas }

      // ── Override en checksExtendido para que el resumen use el U REAL ─────
      const labelMap = { muro: 'Muro U', techo: 'Techo U', piso: 'Piso U' }
      const targetLabel = labelMap[el.key]
      if (targetLabel) {
        const idx = checksExtendido.findIndex(c => c.label === targetLabel)
        if (idx >= 0) {
          const umaxEl = el.umax
          checksExtendido[idx] = {
            ...checksExtendido[idx],
            val: uReal.toFixed(4),
            max: umaxEl ? `≤ ${umaxEl} W/m²K` : checksExtendido[idx].max,
            ok: !umaxEl || uCumpleMax(uReal, umaxEl),
          }
        }
      }

      // ── Condensación intersticial ────────────────────────────────────────
      const estado = res.condInter ? 'RIESGO' : 'OK'
      checksExtendido.push({
        label: `Cond. intersticial — ${el.label}`,
        val: res.condInter ? 'Condensación detectada' : 'Sin condensación',
        max: 'Sin condensación (NCh853)',
        ok: !res.condInter,
        norma: 'NCh853:2021 / EN ISO 13788',
        estado
      })
    })

    // VPCT fachadas — DS N°15 Tabla 3 (% máx vidriado vs U de ventana × orientación)
    if (zonaData && (fachadas||[]).filter(f=>parseFloat(f.areaFachada)>0).length > 0) {
      let vpctCumpleTodo = true
      ;(fachadas||[]).filter(f=>parseFloat(f.areaFachada)>0).forEach(f => {
        const limite = maxVidriadoVentana(proy.zona, f.uw, f.orient)
        const pct = parseFloat(f.vanos||0) / parseFloat(f.areaFachada) * 100
        if (limite!==null && pct>limite) vpctCumpleTodo = false
      })
      checksExtendido.push({
        label: 'VPCT — Porcentaje de vanos',
        val: 'Ver detalle por fachada',
        max: 'DS N°15 MINVU Tabla 3',
        ok: vpctCumpleTodo,
        norma: 'DS N°15 MINVU'
      })
    }

    // allOkLocal = cumple TODOS los chequeos incluidos condensación + VPCT
    // (excluye los informativos, p.ej. Rw estimado PDA — no gatean el cumplimiento)
    const allOkLocal = checksExtendido.filter(c => !c.informativo).every(c => c.ok)

    const resumenRows = checksExtendido.map(c => {
      const categoria = c.label.startsWith('Muro') || c.label.startsWith('Techo') || c.label.startsWith('Piso') || c.label.startsWith('Puerta') ? 'Térmico' :
        c.label.startsWith('RF') ? 'Incendio' :
        c.label.startsWith('Rw') || c.label.startsWith("L'n,w") ? 'Acústico' :
        c.label.startsWith('Cond.') ? 'Higrotérmico' : 'Otro'
      const catColor = categoria === 'Térmico' ? '#0e6560' : categoria === 'Incendio' ? '#dc2626' : categoria === 'Acústico' ? '#0f766e' : categoria === 'Higrotérmico' ? '#7c3aed' : '#64748b'
      return `<tr>
        <td><span style="font-size:8pt;color:${catColor};font-weight:700;background:${catColor}15;border-radius:3px;padding:1px 5px;margin-right:4px">${categoria}</span><b>${c.label}</b></td>
        <td>${c.val || '—'}</td>
        <td>${c.max || '—'}</td>
        <td>${c.norma ? `<span style="font-size:8pt;color:#64748b">${c.norma}</span>` : ''}</td>
        <td>${c.val ? (c.informativo
          ? `<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-weight:700;font-size:9pt">${c.ok ? 'CUMPLE (est.)' : 'REVISAR (est.)'}</span>`
          : `<span class="${c.ok ? 'badge-ok' : 'badge-no'}">${c.ok ? 'CUMPLE' : 'NO CUMPLE'}</span>`) : '<span style="color:#94a3b8;font-size:9pt">Sin datos</span>'}</td>
      </tr>`
    }).join('')

    // ── VPCT — análisis por fachada ───────────────────────────────────────────
    const vpctZona = zonaData ? TABLA3_VENTANAS[proy.zona] : null
    const ORIENT_NAME = { N: 'Norte', OP: 'Oriente / Poniente', S: 'Sur' }
    const bracketLabelExp = uw => { const u = parseFloat(uw); if (!uw || isNaN(u) || u <= 0) return '—'; const b = UMBRALES_U_VENTANA.find(x => u <= x + 1e-9); return b ? `U≤${b}` : 'U>5.8' }
    const fachadasValidas = (fachadas || []).filter(f => parseFloat(f.areaFachada) > 0)
    let vpctHtml = ''
    if (vpctZona && fachadasValidas.length > 0) {
      const fachadasRows = fachadasValidas.map(f => {
        const area = parseFloat(f.areaFachada), vanos = parseFloat(f.vanos) || 0
        const pct = (vanos / area * 100).toFixed(1)
        const limite = maxVidriadoVentana(proy.zona, f.uw, f.orient)
        const cumple = limite !== null ? parseFloat(pct) <= limite : true
        const detalle = (f.ventanas && f.ventanas.length)
          ? `<tr><td colspan="8" style="padding:2px 8px 7px 22px;font-size:8.5pt;color:#475569">
              <b>Ventanas:</b> ${f.ventanas.map((v, i) => { const al = parseFloat(v.alto) || 0, an = parseFloat(v.ancho) || 0; return `V${i + 1} ${al.toFixed(2)}×${an.toFixed(2)} = ${(al * an).toFixed(2)} m²` }).join(' &nbsp;·&nbsp; ')}
              &nbsp;→ <b>Σ ${vanos.toFixed(2)} m²</b></td></tr>`
          : ''
        return `<tr>
          <td>${f.nombre || '—'}</td>
          <td>${ORIENT_NAME[f.orient] || f.orient}</td>
          <td>${area.toFixed(1)} m²</td>
          <td>${vanos.toFixed(1)} m²</td>
          <td><b>${pct}%</b></td>
          <td>${f.uw ? f.uw + ' W/m²K' : '—'}<br><span style="font-size:8.5pt;color:#64748b">${bracketLabelExp(f.uw)}</span></td>
          <td>${limite !== null ? limite + '%' : '—'}</td>
          <td><span class="${cumple ? 'badge-ok' : 'badge-no'}">${cumple ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
        </tr>${detalle}`
      }).join('')
      const orientKeys = [...new Set(fachadasValidas.map(f => f.orient))]
      const summaryRows = orientKeys.map(orient => {
        const facs = fachadasValidas.filter(f => f.orient === orient)
        const totalArea = facs.reduce((s, f) => s + (parseFloat(f.areaFachada) || 0), 0)
        const totalVanos = facs.reduce((s, f) => s + (parseFloat(f.vanos) || 0), 0)
        const pct = totalArea > 0 ? (totalVanos / totalArea * 100).toFixed(1) : '—'
        const uwMax = Math.max(...facs.map(f => parseFloat(f.uw) || 0), 0)
        const limite = maxVidriadoVentana(proy.zona, uwMax, orient)
        const cumple = limite !== null && pct !== '—' ? parseFloat(pct) <= limite : true
        return `<tr style="font-weight:600;background:#f8fafc">
          <td><b>${ORIENT_NAME[orient] || orient}</b></td>
          <td>${totalArea.toFixed(1)} m²</td>
          <td>${totalVanos.toFixed(1)} m²</td>
          <td><b>${pct}%</b></td>
          <td>${limite !== null ? limite + '%' : '—'}</td>
          <td>${pct !== '—' && limite !== null ? `<span class="${cumple ? 'badge-ok' : 'badge-no'}">${cumple ? 'CUMPLE' : 'NO CUMPLE'}</span>` : '—'}</td>
        </tr>`
      }).join('')
      vpctHtml = `
<h2 id="modulo-5">Módulo 5 — Ventanas y Vanos (VPCT, DS N°15 MINVU)</h2>
<h3>Detalle por fachada</h3>
<table>
  <tr><th>Fachada</th><th>Orientación</th><th>Área total</th><th>Área vanos</th><th>% vano</th><th>Uw ventana</th><th>VPCT máx</th><th>Estado</th></tr>
  ${fachadasRows}
</table>
<h3>Resumen por orientación</h3>
<table>
  <tr><th>Orientación</th><th>Área total</th><th>Área vanos</th><th>% vano total</th><th>Límite VPCT</th><th>Estado</th></tr>
  ${summaryRows}
</table>
<div style="font-size:8.5pt;color:#64748b;margin-top:4px">VPCT = Porcentaje de Vano / Área de Fachada · DS N°15 MINVU Tabla 3 · Zona ${proy.zona} · El % máx permitido depende del U de la ventana (12 brackets, ≤0.6 a ≤5.8 W/m²K) y la orientación: a mayor U, menor % de vidriado.</div>`
    } else if (vpctZona) {
      vpctHtml = `
<h2 id="modulo-5b">Módulo 5 — Vanos y Ventilación (VPCT, DS N°15)</h2>
<div class="aviso">Sin fachadas ingresadas en la pestaña Ventana. Los límites VPCT para Zona ${proy.zona} son:</div>
<table>
  <tr><th>Orientación</th><th>Nivel 1 (Uw≤2.0)</th><th>Nivel 2 (Uw≤3.5)</th><th>Nivel 3 (Uw>3.5)</th></tr>
  <tr><td><b>Norte</b></td>${vpctZona.N.map(v => `<td>${v}%</td>`).join('')}</tr>
  <tr><td><b>Oriente / Poniente</b></td>${vpctZona.OP.map(v => `<td>${v}%</td>`).join('')}</tr>
  <tr><td><b>Sur</b></td>${vpctZona.S.map(v => `<td>${v}%</td>`).join('')}</tr>
</table>`
    }

    // ── Puertas — registro del proyecto (4 ejes normativos) ───────────────────
    const puertasValidas = (puertas || []).filter(p => parseFloat(p.ancho) > 0 && parseFloat(p.alto) > 0 && p.hojaId && p.marcoId && p.selloId)
    let puertasHtml = ''
    if (puertasValidas.length > 0) {
      const puertasRows = puertasValidas.map((p, idx) => {
        const r = calcularPuertaCombinada({
          ancho_m: parseFloat(p.ancho), alto_m: parseFloat(p.alto),
          hojaId: p.hojaId, marcoId: p.marcoId, selloId: p.selloId,
        })
        if (!r) return ''
        const usoOGUC = (p.uso === 'acceso_vivienda' || p.uso === 'acceso_unidades' || p.uso === 'evacuacion_escalera')
          ? 'acceso_principal' : 'interior_recinto'
        const vT = cumpleDS15Puerta(r.U, proy.zona)
        const vF = cumpleRFPuerta(r.rf, p.uso)
        const vA = cumpleRWPuerta(r.rw, p.uso)
        const vD = cumpleOGUC(r.anchoLibre_m, r.altoLibre_m, usoOGUC)
        const cumpleAll = vT?.cumple && vF?.cumple && vA?.cumple && vD?.cumple
        const cellState = (ok, txt) => `<span class="${ok ? 'badge-ok' : 'badge-no'}" style="font-size:8.5pt">${txt}</span>`
        return `<tr>
          <td>${idx + 1}</td>
          <td><b>${p.nombre || `Puerta ${idx + 1}`}</b><br><span style="font-size:8.5pt;color:#64748b">${p.uso.replace(/_/g, ' ')}</span></td>
          <td>${p.ancho} × ${p.alto} m<br><span style="font-size:8.5pt;color:#64748b">libre ${r.anchoLibre_m} × ${r.altoLibre_m}</span></td>
          <td style="font-size:9pt">${r.componentes.hoja.nombre}<br>${r.componentes.marco.nombre}<br>${r.componentes.sello.nombre}</td>
          <td><b>${r.U}</b> W/m²K<br>${vT ? cellState(vT.cumple, vT.cumple ? `≤ ${vT.umax}` : `> ${vT.umax}`) : '—'}</td>
          <td><b>${r.rf}</b><br>${vF ? cellState(vF.cumple, vF.cumple ? `≥ ${vF.rfRequerido}` : `req. ${vF.rfRequerido}`) : '—'}</td>
          <td><b>${r.rw}</b> dB<br>${vA ? cellState(vA.cumple, vA.cumple ? `≥ ${vA.rwRequerido}` : `req. ${vA.rwRequerido} dB`) : '—'}</td>
          <td>${vD ? cellState(vD.cumple, vD.cumple ? 'OGUC ✓' : `mín ${vD.anchoMinReq}×${vD.altoMinReq}`) : '—'}</td>
          <td><span class="${cumpleAll ? 'badge-ok' : 'badge-no'}">${cumpleAll ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
        </tr>`
      }).filter(Boolean).join('')

      // Resumen agregado
      const total = puertasValidas.length
      const cumpleNum = puertasValidas.filter(p => {
        const r = calcularPuertaCombinada({ ancho_m: parseFloat(p.ancho), alto_m: parseFloat(p.alto), hojaId: p.hojaId, marcoId: p.marcoId, selloId: p.selloId })
        if (!r) return false
        const usoOGUC = (p.uso === 'acceso_vivienda' || p.uso === 'acceso_unidades' || p.uso === 'evacuacion_escalera') ? 'acceso_principal' : 'interior_recinto'
        const vT = cumpleDS15Puerta(r.U, proy.zona), vF = cumpleRFPuerta(r.rf, p.uso), vA = cumpleRWPuerta(r.rw, p.uso), vD = cumpleOGUC(r.anchoLibre_m, r.altoLibre_m, usoOGUC)
        return vT?.cumple && vF?.cumple && vA?.cumple && vD?.cumple
      }).length

      puertasHtml = `
<h2 id="modulo-5c">Módulo 5b — Puertas del proyecto (4 ejes normativos)</h2>
<h3>Detalle por puerta</h3>
<table>
  <tr>
    <th>#</th><th>Nombre / Uso</th><th>Dimensiones</th><th>Componentes (hoja / marco / sello)</th>
    <th>Térmica (DS N°15)</th><th>Fuego (LOFC Ed.17)</th><th>Acústica (NCh352)</th><th>Dimens. (OGUC IV)</th><th>Estado</th>
  </tr>
  ${puertasRows}
  <tr style="font-weight:700;background:#f1f5f9">
    <td colspan="8">Resumen: ${cumpleNum} de ${total} puertas cumplen los 4 ejes normativos</td>
    <td><span class="${cumpleNum === total ? 'badge-ok' : 'badge-no'}">${cumpleNum === total ? 'OK' : 'REVISAR'}</span></td>
  </tr>
</table>
<div style="font-size:8.5pt;color:#64748b;margin-top:4px">
  Cálculo U combinado según <b>NCh3079 / ISO 10077-1</b> (U_hoja·A_hoja + U_marco·A_marco + Ψ_sello·L_sello) / A_total.
  RF del conjunto = mínimo entre hoja y marco (<b>LOFC Ed.17 §7</b>).
  R'w = R'w hoja + bonus sello perimetral (<b>NCh352:2013</b>).
  Dimensiones libres de paso según <b>OGUC Tít. IV</b> (Art. 4.1.7 acceso vivienda · Art. 4.2.13 evacuación).
  Para certificación final: solicitar ensayos in situ (NCh352) y EN 1634-1 (RF) al fabricante.
</div>`
    }

    // ── Escaleras de evacuación — OGUC Art. 4.5.7 ─────────────────────────────
    let escalerasHtml = ''
    if (mods.escaleras) {
      const pisosE = Number(proy.pisos) || 0
      // Art. 4.5.7: la escalera de evacuación es exigible según uso y pisos (vivienda
      // unifamiliar EXENTA). Antes se exigía a todo proyecto de 2 pisos → imponía F60
      // a la escalera de una casa de 2 pisos.
      const escObligatorias = requiereCajaEscalera(uso, pisosE)
      // Cargar requisitos RF directo del OGUC (igual que TabFuego)
      const usoR = proy.uso || ''
      let rfReqEsc = null
      let rfReqCajaEsc = null
      try {
        const letraE = ogucData && proy.destinoOGUC && proy.areaConst
          ? getLetraOGUC?.(proy.destinoOGUC, parseFloat(proy.areaConst), 'segura')
          : null
        if (letraE && getRFDeLetra) {
          rfReqEsc = getRFDeLetra(letraE, 'escaleras') || null
          rfReqCajaEsc = getRFDeLetra(letraE, 'cajas_esc') || null
        }
      } catch (_) {}
      // Fallback a RF_DEF si no se pudo derivar del OGUC
      if (!rfReqEsc && usoR && RF_DEF[usoR]?.escaleras) rfReqEsc = RF_DEF[usoR].escaleras
      if (!rfReqCajaEsc && usoR && requiereCajaEscalera(usoR, pisosE) && RF_DEF[usoR]?.cajas_esc) {
        rfReqCajaEsc = RF_DEF[usoR].cajas_esc
      }
      // Si la escalera de evacuación no es exigible para este uso/pisos (p.ej. vivienda
      // unifamiliar de 2 pisos), no se impone RF: se informa como "sin exigencia".
      if (!escObligatorias) { rfReqEsc = null; rfReqCajaEsc = null }
      // Material seleccionado por el usuario
      const mat = MAT_ESCAL.find(m => m.id === (escaleras?.matId || 'ha')) || MAT_ESCAL[0]
      const rfBaseN = mat.rfBase ? rfStringToNumber(mat.rfBase) : 0
      const rfReqN  = rfReqEsc ? rfStringToNumber(rfReqEsc) : 0
      const cumpleEsc = !rfReqEsc || !mat.rfBase || rfBaseN >= rfReqN
      const necesitaCaja = requiereCajaEscalera(usoR, pisosE)
      // Tiempo en minutos del RF requerido para los cálculos
      const tiempoReqMin = rfReqN
      const tiempoBaseMin = rfBaseN

      // ── Cálculo de respaldo específico por tipo de material ──────────────
      // Genera la fórmula + valores + conclusión técnica que justifica el RF.
      function buildCalculoRespaldo() {
        if (mat.id === 'ha' || mat.id === 'ha_pref') {
          const recubMin = 20  // mm — NCh430 §5.5 para F120
          return `
<table>
  <tr><th colspan="2" style="background:#f0fdfa;color:#0f766e">Cálculo de RF — Hormigón armado (NCh430 · LOFC Ed.17 Tabla A4)</th></tr>
  <tr><td><b>Recubrimiento mínimo del acero (c)</b></td><td>≥ <b>${recubMin} mm</b> (NCh430 §5.5)</td></tr>
  <tr><td><b>Tiempo máximo a temp. crítica</b></td><td>El acero alcanza 500°C en <b>≥ 120 min</b> con c = 20 mm (LOFC Tabla A4)</td></tr>
  <tr><td><b>RF resultante por cálculo</b></td><td><b>F120</b> ${mat.id === 'ha_pref' ? '(F90 si recubrimiento entre 15-19 mm)' : ''}</td></tr>
  <tr><td><b>RF mínimo requerido</b></td><td><b>${rfReqEsc || '—'}</b></td></tr>
  <tr style="background:#f0fdf4"><td><b>Justificación normativa</b></td><td><b>${mat.rfBase} ≥ ${rfReqEsc || '—'}</b> ⇒ <span class="badge-ok">CUMPLE</span> sin protección adicional</td></tr>
</table>
<div style="font-size:9pt;color:#475569;margin-top:6px;line-height:1.5">
  La sección de hormigón armado mantiene su capacidad portante porque el recubrimiento de hormigón aísla térmicamente al acero. Con c ≥ 20 mm, la temperatura del acero permanece bajo 500°C durante ${tiempoBaseMin} minutos (NCh430 §5.5 + LOFC Ed.17 Tabla A4). El acero pierde resistencia a partir de los 500°C, por lo que el RF se garantiza por la combinación recubrimiento × tiempo.
</div>`
        }
        if (mat.id === 'acero' || mat.id === 'acero_p') {
          return `
<table>
  <tr><th colspan="2" style="background:#fef2f2;color:#991b1b">Cálculo de RF — Estructura metálica (LOFC Ed.17 Annex B)</th></tr>
  <tr><td><b>RF intrínseca del acero sin proteger</b></td><td><b>F0</b> — el acero pierde 50% de resistencia a 600°C en ~5 min</td></tr>
  <tr><td><b>RF mínimo requerido</b></td><td><b>${rfReqEsc || '—'}</b></td></tr>
  ${mat.id === 'acero_p'
    ? `<tr><td><b>Sistema de protección aplicado</b></td><td>Por definir según ficha técnica (pintura intumescente / yeso laminado / lana de roca)</td></tr>
       <tr><td><b>Espesor mínimo de protección</b></td><td>Calcular según factor de forma (Hp/A) del perfil + RF objetivo</td></tr>
       <tr style="background:#fef9c3"><td><b>Verificación</b></td><td><b>Requiere ficha del sistema</b> con ensayo NCh850 o EN 13381 que demuestre ${rfReqEsc || 'la RF requerida'}</td></tr>`
    : `<tr style="background:#fef9c3"><td><b>Conclusión</b></td><td>El acero sin protección <b>NO ALCANZA</b> RF estructural. Para cumplir <b>${rfReqEsc || 'la RF requerida'}</b> se debe aplicar un sistema de protección certificado (LOFC Ed.17 Annex B).</td></tr>`
  }
</table>
<div style="font-size:9pt;color:#475569;margin-top:6px;line-height:1.5">
  El cálculo de RF en acero protegido requiere conocer el <b>factor de forma del perfil</b> (perímetro expuesto / área de la sección) y elegir el espesor de protección desde la tabla del fabricante (LOFC Annex B). Sin protección certificada con ensayo NCh850 o EN 13381, no se puede acreditar RF estructural.
</div>`
        }
        if (mat.id === 'madera' || mat.id === 'clt') {
          // Velocidad de carbonización para madera maciza/CLT
          const beta = mat.id === 'clt' ? 0.65 : 0.7  // mm/min (LOFC Ed.17 Tabla A6 / Eurocódigo 5)
          const seccionInicial = 90  // mm — sección de REFERENCIA (informativa)
          const sr = evaluarSeccionResidual(seccionInicial, beta, tiempoBaseMin)
          const carbonTotal = sr.carbon, seccionRes = sr.residual
          // La acreditación de RF es por CLASIFICACIÓN TABULADA (Tabla A6), no por
          // la sección residual (que requiere las solicitaciones del calculista). Ver B2.
          const residualNota = seccionRes <= 0
            ? 'La sección de referencia se carboniza por completo en el tiempo de exposición: el método de sección residual <b>no acredita por sí solo</b>; la verificación estructural del núcleo con las solicitaciones queda a cargo del calculista.'
            : sr.aplicable
              ? 'Informativo — la verificación estructural del núcleo con las solicitaciones queda a cargo del calculista.'
              : `Sección residual insuficiente (${(sr.ratio * 100).toFixed(0)}% de la sección de referencia): el método <b>no acredita por sí solo</b>; la RF se acredita por clasificación tabulada y la verificación estructural del núcleo con las solicitaciones queda a cargo del calculista.`
          return `
<table>
  <tr><th colspan="2" style="background:#f0fdfa;color:#0f766e">Cálculo de RF — ${mat.id === 'clt' ? 'CLT (madera contralaminada)' : 'Madera maciza estructural'} (LOFC Ed.17 Tabla A6)</th></tr>
  <tr><td><b>Sección de referencia (b)</b></td><td>${seccionInicial} mm <span style="font-size:8.5pt;color:#64748b">(referencial)</span></td></tr>
  <tr><td><b>Velocidad de carbonización (β₀)</b></td><td><b>${beta} mm/min</b> ${mat.id === 'clt' ? '(CLT — capas adhesivadas reducen avance)' : '(madera maciza coníferas)'}</td></tr>
  <tr><td><b>Tiempo de exposición al fuego</b></td><td>${tiempoBaseMin} min (= RF base ${mat.rfBase})</td></tr>
  <tr><td><b>Profundidad carbonizada total (d<sub>char</sub>)</b></td><td>β₀ × t = ${beta} × ${tiempoBaseMin} = <b>${carbonTotal.toFixed(1)} mm por cara</b></td></tr>
  <tr><td><b>Sección residual (b − 2·d<sub>char</sub>)</b></td><td>${seccionInicial} − 2×${carbonTotal.toFixed(1)} = <b>${seccionRes.toFixed(1)} mm</b> ${seccionRes <= 0 ? '<span style="color:#b91c1c">(totalmente carbonizada)</span>' : `<span style="font-size:8.5pt;color:#64748b">(${(sr.ratio * 100).toFixed(0)}% de la referencia)</span>`}</td></tr>
  <tr><td><b>RF por clasificación tabulada</b></td><td><b>${mat.rfBase}</b> — LOFC Ed.17 Tabla A6</td></tr>
  <tr><td><b>RF mínimo requerido</b></td><td><b>${rfReqEsc || '—'}</b></td></tr>
  <tr style="background:${cumpleEsc ? '#f0fdf4' : '#fef9c3'}"><td><b>Acreditación</b></td><td><b>${mat.rfBase} ${cumpleEsc ? '≥' : '<'} ${rfReqEsc || '—'}</b> ⇒ ${cumpleEsc ? '<span class="badge-ok">CUMPLE</span> por clasificación tabulada (LOFC Ed.17 Tabla A6)' : 'No alcanza la RF requerida — aumentar sección o aplicar protección certificada'}</td></tr>
  <tr><td><b>Método de sección residual</b></td><td style="font-size:9pt;color:#475569">${residualNota}</td></tr>
</table>
<div style="font-size:9pt;color:#475569;margin-top:6px;line-height:1.5">
  La <b>acreditación de RF se realiza por clasificación tabulada</b> (LOFC Ed.17 Tabla A6). El <b>método de la sección residual</b> (Eurocódigo 5) se muestra a título informativo: la madera carboniza a velocidad β₀ constante y el núcleo no carbonizado debe soportar las cargas remanentes — su verificación estructural, con las solicitaciones reales, es responsabilidad del calculista. ${mat.id === 'clt' ? 'En CLT la velocidad de avance se ralentiza por la transición entre capas adhesivadas.' : 'Para elementos de madera maciza coníferas en Chile (Pino radiata).'}
</div>`
        }
        if (mat.id === 'mamp') {
          const espesorMin = 110  // mm para F60
          return `
<table>
  <tr><th colspan="2" style="background:#f0fdfa;color:#0f766e">Cálculo de RF — Mampostería de ladrillo / bloque (LOFC Ed.17 Tabla A2)</th></tr>
  <tr><td><b>Espesor mínimo del muro (e)</b></td><td>≥ <b>${espesorMin} mm</b> para F60 (LOFC Tabla A2)</td></tr>
  <tr><td><b>Tipo de mampostería</b></td><td>Ladrillo cerámico macizo / perforado · bloque hormigón macizo</td></tr>
  <tr><td><b>Densidad mínima</b></td><td>ρ ≥ 1500 kg/m³</td></tr>
  <tr><td><b>RF intrínseca por espesor</b></td><td><b>${mat.rfBase}</b> (acumula ~F30 por cada 50 mm de espesor adicional)</td></tr>
  <tr><td><b>RF mínimo requerido</b></td><td><b>${rfReqEsc || '—'}</b></td></tr>
  <tr style="background:${cumpleEsc ? '#f0fdf4' : '#fef9c3'}"><td><b>Justificación normativa</b></td><td><b>${mat.rfBase} ${cumpleEsc ? '≥' : '<'} ${rfReqEsc || '—'}</b> ⇒ ${cumpleEsc ? '<span class="badge-ok">CUMPLE</span> por espesor del muro' : 'Aumentar espesor o aplicar protección'}</td></tr>
</table>
<div style="font-size:9pt;color:#475569;margin-top:6px;line-height:1.5">
  El RF de mampostería se obtiene por el <b>espesor del muro + densidad del material</b> (LOFC Ed.17 Tabla A2). La masa térmica retarda la transmisión de calor; muros más gruesos resisten más tiempo. Para escaleras dentro de cajas de escalera de mampostería, el muro perimetral aporta protección al recinto entero (Col. 4 OGUC).
</div>`
        }
        return ''
      }

      // ── Alternativas equivalentes (positiva — solo las que cumplen) ──────
      const alternativasOk = MAT_ESCAL.filter(m => {
        if (m.id === mat.id) return false
        if (!rfReqEsc) return true
        if (!m.rfBase) return false
        return rfStringToNumber(m.rfBase) >= rfReqN
      })

      escalerasHtml = `
<h2 id="modulo-5d">Módulo 5c — Escaleras de evacuación (OGUC Art. 4.5.7)</h2>
<div style="font-size:10pt;color:#475569;margin-bottom:8px;line-height:1.5">
  ${escObligatorias
    ? `<b>Proyecto de ${pisosE} pisos:</b> las escaleras de evacuación son <b>OBLIGATORIAS</b> por OGUC Art. 4.5.7.`
    : `<b>Proyecto de ${pisosE || 1} piso:</b> escaleras de evacuación no son exigibles, pero el proyectista las incluyó voluntariamente en el informe.`}
</div>

<h3>Exigencias normativas</h3>
<table>
  <tr><th>Elemento</th><th>RF mínima requerida</th><th>Referencia OGUC</th><th>Estado</th></tr>
  <tr>
    <td><b>Escalera (peldaños + estructura)</b></td>
    <td><b>${rfReqEsc || '—'}</b></td>
    <td>OGUC Tabla 1 Col. (9)</td>
    <td>${rfReqEsc
      ? `<span class="${cumpleEsc ? 'badge-ok' : 'badge-no'}">${cumpleEsc ? 'CUMPLE' : 'NO CUMPLE'}</span>`
      : '<span style="color:#94a3b8">Sin exigencia para este uso/pisos</span>'}</td>
  </tr>
  <tr>
    <td><b>Caja de escalera (recinto de protección)</b></td>
    <td><b>${rfReqCajaEsc || '—'}</b></td>
    <td>OGUC Tabla 1 Col. (4)</td>
    <td>${necesitaCaja
      ? (rfReqCajaEsc
        ? `<span class="${cumpleEsc ? 'badge-ok' : 'badge-no'}">${cumpleEsc ? 'CUMPLE' : 'NO CUMPLE'}</span>`
        : '<span style="color:#94a3b8">Exigida — definir material</span>')
      : '<span style="color:#94a3b8">Caja no exigida para este uso/pisos</span>'}</td>
  </tr>
</table>

<h3>Solución constructiva propuesta</h3>
<table>
  <tr><th>Material</th><th>RF intrínseca</th><th>Recubrimiento / espesor mínimo</th><th>Norma de respaldo</th></tr>
  <tr>
    <td><b>${mat.label}</b></td>
    <td><b>${mat.rfBase || 'según protección'}</b></td>
    <td>${mat.id === 'ha' ? '≥ 20 mm recubrimiento del acero' : mat.id === 'ha_pref' ? '≥ 15-20 mm recubrimiento' : mat.id === 'mamp' ? '≥ 110 mm espesor del muro' : mat.id === 'madera' ? '≥ 90 mm sección portante' : mat.id === 'clt' ? '≥ 90 mm espesor del panel' : '—'}</td>
    <td><span style="font-size:9pt;color:#475569">${mat.nota}</span></td>
  </tr>
</table>

<h3>Cálculo de respaldo</h3>
${buildCalculoRespaldo()}

${alternativasOk.length > 0 ? `
<h3>Alternativas constructivas equivalentes</h3>
<div style="font-size:9.5pt;color:#475569;margin-bottom:6px">
  Las siguientes soluciones también satisfacen ${rfReqEsc || 'la exigencia normativa'} y pueden ser intercambiadas en el proyecto manteniendo el cumplimiento:
</div>
<ul style="font-size:10pt;color:#1e293b;line-height:1.7;margin:0;padding-left:20px">
  ${alternativasOk.map(m => `<li><b>${m.label}</b> — RF ${m.rfBase}. <span style="color:#64748b">${m.nota}</span></li>`).join('')}
</ul>
` : ''}

<div style="font-size:8.5pt;color:#64748b;margin-top:10px;line-height:1.5;border-top:1px solid #e2e8f0;padding-top:6px">
  <b>Normas de respaldo:</b> OGUC Art. 4.5.7 · LOFC Ed.17 2025 Tabla A2/A4/A6 · NCh430 (hormigón armado) · NCh850 (ensayo experimental de RF) · Eurocódigo 5 §4.2 (madera, método de la sección residual).
  La <b>caja de escalera</b> (recinto cerrado) debe garantizar evacuación segura — sus muros perimetrales y la puerta de acceso requieren RF según Col. (4) de la Tabla 1.
</div>`
    }

    // ── Notas del proyectista ─────────────────────────────────────────────────
    const TAB_NAMES_RPT = { diagnostico:'Diagnóstico', soluciones:'Soluciones', termica:'Térmica', fuego:'Fuego', acustica:'Acústica', calcU:'Cálculo U', ventana:'Ventana', resultados:'Resultados' }
    const notasEntries = Object.entries(notas || {}).filter(([, v]) => v?.trim())
    const notasHtml = notasEntries.length > 0 ? `
<h2 id="modulo-6">Módulo 6 — Notas y observaciones del proyectista</h2>
${notasEntries.map(([k, v]) => `
<div style="margin-bottom:12px">
  <div style="font-weight:700;color:#0e6560;font-size:10pt;margin-bottom:4px;border-left:3px solid #5eead4;padding-left:8px">${TAB_NAMES_RPT[k] || k}</div>
  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:10pt;white-space:pre-wrap;line-height:1.6;color:#1e293b">${v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
</div>`).join('')}` : ''

    // ── Módulo 6b — Correcciones C1-C8 aplicadas al diseño ─────────────────
    // Lista de elementos con correccionAplicada registrada + modificaciones manuales
    const ELEM_LABELS = { muro:'Muro de envolvente', techo:'Techumbre / cubierta', piso:'Piso ventilado', tabique:'Tabique interior', ventana:'Ventana' }
    function labelElemRpt(elemKey) {
      const k = elemKey.includes('::') ? elemKey.split('::').pop() : elemKey
      return ELEM_LABELS[k] || k
    }
    function strategyFromId(id) {
      if (!id) return { code: '—', nombre: 'Corrección personalizada' }
      const m = String(id).match(/^c(\d+)_/i)
      if (!m) return { code: '—', nombre: 'Corrección personalizada' }
      const n = m[1]
      const nombres = {
        '1': 'EIFS / SATE — Aislación exterior con estuco',
        '2': 'Fachada Ventilada',
        '3': 'Trasdosado Interior',
        '4': 'Aumento de espesor del aislante existente',
        '5': 'Barrera de vapor en cara caliente',
        '6': 'Sustitución de aislante por mejor λ',
        '7': 'Reordenamiento de capas por difusividad',
        '8': 'Sugerencia manual (no automatizada)',
      }
      return { code: 'C' + n, nombre: nombres[n] || 'Estrategia C' + n }
    }

    // B6: una sola corrección VIGENTE por elemento base — la más reciente. Al cambiar
    // de solución quedan elemKeys compuestos (sol::muro) con correcciones superadas;
    // no deben listarse como activas. Se colapsa por elemento base tomando aplicada_en.
    const correccionesPorElem = (() => {
      const raw = Object.entries(calcUInit || {})
        .filter(([, v]) => v?.correccionAplicada)
        .map(([k, v]) => ({ elemKey: k, label: labelElemRpt(k), data: v, corr: v.correccionAplicada }))
      const base = (k) => (k.includes('::') ? k.split('::').pop() : k)
      const porBase = new Map()
      for (const item of raw) {
        const b = base(item.elemKey)
        const prev = porBase.get(b)
        const t = new Date(item.corr?.aplicada_en || 0).getTime()
        const tp = prev ? new Date(prev.corr?.aplicada_en || 0).getTime() : -1
        if (!prev || t >= tp) porBase.set(b, item)
      }
      return [...porBase.values()]
    })()

    let correccionesHtml = ''
    if (correccionesPorElem.length > 0) {
      const tarjetas = correccionesPorElem.map(({ elemKey, label, data, corr }) => {
        const strat = strategyFromId(corr.id)
        const advHtml = (corr.advertencias?.length)
          ? `<ul style="margin:6px 0 0 18px;padding:0;font-size:9pt;color:#475569;line-height:1.65">
               ${corr.advertencias.map(a => `<li>${a}</li>`).join('')}
             </ul>`
          : ''
        const uFinal = data.res?.U ? parseFloat(data.res.U).toFixed(4) : '—'
        const fechaAplic = corr.aplicada_en
          ? new Date(corr.aplicada_en).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })
          : ''
        return `<div style="background:#fff;border:1px solid #e2e8f0;border-left:5px solid ${corr.color || '#0e6560'};border-radius:8px;padding:14px 18px;margin:10px 0;page-break-inside:avoid">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="background:${corr.color || '#0e6560'};color:#fff;font-weight:800;font-size:11pt;padding:4px 12px;border-radius:6px;letter-spacing:0.5px">${strat.code}</span>
      <span style="font-weight:700;font-size:11pt;color:#1e293b">${label}</span>
      ${corr.etiqueta ? `<span style="background:#f1f5f9;color:#475569;font-size:9pt;padding:2px 8px;border-radius:4px;font-weight:600">${corr.etiqueta}</span>` : ''}
      ${corr.compatible_loscat
        ? '<span style="background:#dcfce7;color:#166534;font-size:8.5pt;padding:2px 8px;border-radius:4px;font-weight:700">✓ Compatible LOSCAT</span>'
        : '<span style="background:#fef3c7;color:#92400e;font-size:8.5pt;padding:2px 8px;border-radius:4px;font-weight:700">⚠ Homologación requerida</span>'}
    </div>
    ${fechaAplic ? `<span style="font-size:8.5pt;color:#94a3b8">Aplicada: ${fechaAplic}</span>` : ''}
  </div>
  <div style="font-size:9.5pt;color:#0e6560;font-weight:700;margin-bottom:4px">Estrategia: ${strat.nombre}</div>
  <div style="font-size:9.5pt;color:#1e293b;line-height:1.6;margin-bottom:8px">${corr.descripcion || corr.titulo || '—'}</div>
  <table style="width:100%;font-size:9pt;margin:6px 0">
    <tr>
      <td style="background:#f8fafc;width:130px;font-weight:600;color:#475569;padding:5px 8px;border:1px solid #e2e8f0">Cambio aplicado</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-family:monospace;font-size:8.5pt">${corr.cambio || '—'}</td>
    </tr>
    <tr>
      <td style="background:#f8fafc;font-weight:600;color:#475569;padding:5px 8px;border:1px solid #e2e8f0">U resultante</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0"><b>${uFinal} W/m²K</b>${corr.impactoU ? ` <span style="color:#64748b;font-size:8.5pt">— ${corr.impactoU}</span>` : ''}</td>
    </tr>
    <tr>
      <td style="background:#f8fafc;font-weight:600;color:#475569;padding:5px 8px;border:1px solid #e2e8f0">Higrotermia</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0">${data.res?.condInter
        ? '<span style="color:#dc2626;font-weight:700">⚠ Riesgo de condensación intersticial</span>'
        : '<span style="color:#166534;font-weight:700">✓ Sin condensación</span>'}</td>
    </tr>
  </table>
  ${advHtml ? `<div style="margin-top:8px;padding:8px 12px;background:#fef3c7;border:1px solid #fde047;border-radius:6px">
    <div style="font-weight:700;color:#92400e;font-size:9pt;margin-bottom:2px">⚠ Advertencias técnicas:</div>
    ${advHtml}
  </div>` : ''}
</div>`
      }).join('')

      // Tabla resumen al inicio
      const resumenTbl = `<table style="width:100%;margin:8px 0 14px">
  <tr>
    <th style="width:60px">Estrat.</th>
    <th>Elemento</th>
    <th>Estrategia aplicada</th>
    <th style="width:90px">U final</th>
    <th style="width:130px">Compatibilidad</th>
  </tr>
  ${correccionesPorElem.map(({ label, data, corr }) => {
    const strat = strategyFromId(corr.id)
    const uF = data.res?.U ? parseFloat(data.res.U).toFixed(4) : '—'
    return `<tr>
      <td style="text-align:center"><span style="background:${corr.color || '#0e6560'};color:#fff;font-weight:700;font-size:9pt;padding:2px 8px;border-radius:4px">${strat.code}</span></td>
      <td><b>${label}</b></td>
      <td style="font-size:9pt">${corr.etiqueta || strat.nombre}</td>
      <td style="font-family:monospace;font-weight:700">${uF}</td>
      <td>${corr.compatible_loscat
        ? '<span class="badge-ok">LOSCAT</span>'
        : '<span style="background:#fef3c7;color:#92400e;font-weight:700;padding:2px 8px;border-radius:4px">Homologación</span>'}</td>
    </tr>`
  }).join('')}
</table>`

      correccionesHtml = `
<h2 id="modulo-6b">Módulo 6b — Correcciones aplicadas al diseño (C1–C8)</h2>
<div style="font-size:9pt;color:#64748b;margin-bottom:10px;line-height:1.6">
  Esta sección documenta las <b>estrategias de corrección normativa</b> aplicadas mediante el motor de cálculo de Talora para resolver incumplimientos detectados (U sobre límite, condensación intersticial, o ambos). Cada estrategia (C1 a C8) está calibrada según <b>NCh853:2021</b> e <b>ISO 6946</b>, con penalización adicional por puentes térmicos cuando aplica.
</div>
${resumenTbl}
${tarjetas}
<div style="margin-top:14px;font-size:8.5pt;color:#64748b;background:#f0fdfa;border:1px solid #99f6e4;border-radius:6px;padding:10px 14px;line-height:1.7">
  <b>📘 Catálogo de estrategias disponibles en el motor Talora:</b>
  <ul style="margin:4px 0 0 16px;padding:0;line-height:1.7">
    <li><b>C1</b> — Sistema EIFS/SATE: aislación exterior adherida + estuco cemento.</li>
    <li><b>C2</b> — Fachada Ventilada: aislante + barrera transpirable + cámara + fibrocemento.</li>
    <li><b>C3</b> — Trasdosado Interior: yeso cartón + barrera vapor + aislación interior.</li>
    <li><b>C4</b> — Aumento de espesor del aislante existente (mantiene material).</li>
    <li><b>C5</b> — Inserción de barrera de vapor en cara caliente (resuelve condensación).</li>
    <li><b>C6</b> — Sustitución del aislante por otro de mejor λ a igual espesor.</li>
    <li><b>C7</b> — Reordenamiento de capas por difusividad al vapor (μ alto interior).</li>
    <li><b>C8</b> — Sugerencias manuales (no automatizables): cambio de uso, replanteo arquitectónico, ensayos in-situ, etc.</li>
  </ul>
</div>`
    }

    // ── Módulo 8 — Detalles constructivos (escantillones de unión) ────────────
    // Genera diagramas SVG mostrando la unión entre muro y piso/techo/cubierta
    // con análisis de continuidad de aislación térmica.
    function obtenerCapasParaInforme(elemKey) {
      const solCod = termica?.[elemKey]?.solucion?.cod
      const entries = Object.entries(calcUInit || {})
        .filter(([k, v]) => (k === elemKey || k.endsWith('::' + elemKey)) && v?.capas?.length)
      if (entries.length && solCod) {
        const match = entries.find(([, v]) => v?.solucion?.cod === solCod)
        if (match) return { capas: match[1].capas, sc: solCod, U: match[1].res?.U }
      }
      if (entries.length) return { capas: entries[0][1].capas, sc: entries[0][1].solucion?.cod, U: entries[0][1].res?.U }
      const sc = termica?.[elemKey]?.solucion
      if (sc) {
        const orig = getCapasParaSC(sc)
        if (orig?.length) return { capas: orig, sc: sc.cod, U: sc.u }
      }
      return null
    }
    const muroInfo  = obtenerCapasParaInforme('muro')
    const pisoInfo  = obtenerCapasParaInforme('piso')
    const techoInfo = obtenerCapasParaInforme('techo')
    const techoEsHormigon = techoInfo?.capas?.some(c => (c.mat || c.n || '').toLowerCase().includes('hormig'))

    const detallesInforme = [
      { id:'muro-piso',      titulo:'Muro + Piso (planta baja)', horizLabel:'Piso',        info: pisoInfo,  cond: !!(muroInfo && pisoInfo) },
      { id:'muro-cubierta',  titulo:'Muro + Cubierta plana',     horizLabel:'Cubierta',    info: techoInfo, cond: !!(muroInfo && techoInfo && techoEsHormigon) },
      { id:'muro-techumbre', titulo:'Muro + Techumbre inclinada', horizLabel:'Techumbre',   info: techoInfo, cond: !!(muroInfo && techoInfo && !techoEsHormigon) },
    ].filter(d => d.cond)

    let detallesHtml = ''
    if (mods.escantillones && detallesInforme.length > 0 && muroInfo) {
      const cards = detallesInforme.map(d => {
        const muroAislIdx  = findAislacionIdx(muroInfo.capas)
        const horizAislIdx = findAislacionIdx(d.info.capas)
        const recomMap = {
          'muro-piso':      'En piso ventilado, prolongar aislante perimetral bajando hasta fundación. En piso sobre terreno, aislante perimetral en el zócalo (mín. 60 cm de altura).',
          'muro-cubierta':  'La aislación de cubierta debe sobreponerse al muro por al menos 100 mm, o usar antepecho aislado para cerrar la envolvente.',
          'muro-techumbre': 'En el alero, la aislación de techumbre debe envolver el coronamiento del muro y conectar físicamente con la del muro vertical.',
        }
        const svg = escantillonSvgStr({
          muroCapas: muroInfo.capas,
          horizCapas: d.info.capas,
          tipo: d.id,
          muroLabel: 'Muro',
          horizLabel: d.horizLabel,
          muroSc: muroInfo.sc,
          horizSc: d.info.sc,
          muroU: muroInfo.U ? parseFloat(muroInfo.U).toFixed(3) : null,
          horizU: d.info.U ? parseFloat(d.info.U).toFixed(3) : null,
        })
        const recomendacion = (muroAislIdx >= 0 && horizAislIdx >= 0)
          ? `<div style="background:#fffbeb;border:1px dashed #fde68a;border-radius:6px;padding:10px 14px;font-size:9pt;color:#92400e;margin-top:8px;line-height:1.6">
              💡 <b>Recomendación de detalle:</b> ${recomMap[d.id] || ''}
            </div>`
          : `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:10px 14px;font-size:9pt;color:#991b1b;margin-top:8px;line-height:1.6">
              ⚠ <b>Puente térmico probable:</b> Uno de los elementos no tiene aislación claramente identificada. Considera aplicar estrategia C1/C2/C3 para crear envolvente térmica continua.
            </div>`
        return `<div style="page-break-inside:avoid;margin-bottom:18px">
  <h3 style="font-size:10.5pt;color:#0e6560;margin:14px 0 6px;border-left:3px solid #5eead4;padding-left:8px">${d.titulo}</h3>
  <div style="text-align:center;background:#fff;padding:4px;border:1px solid #e2e8f0;border-radius:8px">${svg}</div>
  ${recomendacion}
</div>`
      }).join('')

      detallesHtml = `
<h2 id="modulo-8" style="page-break-before:always">Módulo 8 — Detalles constructivos de unión</h2>
<div style="font-size:9pt;color:#64748b;margin-bottom:12px;line-height:1.6">
  Este módulo presenta los <b>escantillones automáticos</b> de las principales uniones constructivas del proyecto, generados a partir de las capas LOSCAT aplicadas a cada elemento. Cada diagrama muestra en sección las capas del muro y del elemento horizontal (piso, cubierta o techumbre), identificando visualmente la <b>continuidad de la aislación térmica</b> en la línea de encuentro.
</div>
<div style="font-size:9pt;color:#475569;margin-bottom:14px;background:#f0fdfa;border-left:4px solid #0e6560;border-radius:6px;padding:10px 14px;line-height:1.65">
  📚 <b>Marco normativo:</b> La <b>NCh853:2021</b> y la <b>Guía MINVU de Puentes Térmicos</b> establecen que la envolvente térmica debe ser <b>continua</b> en encuentros y singularidades. La interrupción de la aislación en uniones (puentes térmicos lineales) puede aumentar el U efectivo del muro entre 10-30% y generar riesgo de condensación superficial intersticial (<b>ISO 14683</b>).
</div>
${cards}
<div style="margin-top:14px;font-size:8.5pt;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;line-height:1.7">
  <b>📌 Nota interpretativa:</b> Los diagramas son <b>esquemáticos y conceptuales</b>, no constituyen detalles arquitectónicos finales. Su propósito es facilitar la verificación de continuidad de la envolvente térmica a nivel de capas. El detalle constructivo definitivo —incluyendo aristas, encuentros con fundaciones, sellos, impermeabilizaciones y resolución estructural— es responsabilidad del profesional proyectista.
</div>`
    }

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Memoria de Cálculo DOM — ${proy.nombre || 'Proyecto'}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 10.5pt; color: #1e293b; max-width: 820px; margin: 30px auto; padding: 0 24px }
  h1 { font-size: 15pt; color: #0e6560; border-bottom: 3px solid #0e6560; padding-bottom: 8px; margin-bottom: 4px }
  h2 { font-size: 12.5pt; color: #0e6560; margin-top: 28px; margin-bottom: 8px; border-left: 4px solid #0e6560; padding-left: 9px; page-break-before: auto }
  h3 { font-size: 11pt; color: #374151; margin-top: 16px; margin-bottom: 5px; border-left: 3px solid #5eead4; padding-left: 7px }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5pt }
  th { background: #f1f5f9; padding: 6px 8px; text-align: left; border: 1px solid #cbd5e1; font-weight: 700 }
  td { padding: 5px 8px; border: 1px solid #e2e8f0 }
  tr.subtotal td { background: #f8fafc; font-weight: 600 }
  tr.total td { background: #ccfbf1; font-weight: 700 }
  tr.riesgo td { background: #fee2e2 }
  .badge-ok  { background: #dcfce7; color: #166534; font-weight: 700; padding: 2px 8px; border-radius: 4px; white-space: nowrap }
  .badge-no  { background: #fee2e2; color: #991b1b; font-weight: 700; padding: 2px 8px; border-radius: 4px; white-space: nowrap }
  .fig { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 12px 6px; margin: 10px 0; background: #f8fafc }
  .fig-cap { font-size: 8.5pt; color: #64748b; text-align: center; margin-top: 4px; line-height: 1.4 }
  .aviso { background: #fef9c3; border: 1px solid #fde047; border-radius: 6px; padding: 8px 12px; font-size: 9.5pt; margin: 8px 0 }
  .ok-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 8px 12px; font-size: 9.5pt; margin: 8px 0; color: #166534 }
  .no-box { background: #fee2e2; border: 1px solid #fca5a5; border-radius: 6px; padding: 8px 12px; font-size: 9.5pt; margin: 8px 0; color: #991b1b }
  .data-row { display: flex; gap: 18px; flex-wrap: wrap; margin: 8px 0 }
  .data-item { min-width: 160px }
  .data-item label { font-size: 8.5pt; color: #64748b; display: block; margin-bottom: 2px }
  .data-item span { font-weight: 700; font-size: 10pt }
  .resumen-ok  { background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 12px 16px; font-size: 13pt; font-weight: 700; color: #166534; margin: 12px 0 }
  .resumen-no  { background: #fee2e2; border: 2px solid #fca5a5; border-radius: 8px; padding: 12px 16px; font-size: 13pt; font-weight: 700; color: #991b1b; margin: 12px 0 }
  .estado-banner { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 8px; margin: 8px 0 14px; font-size: 10pt; page-break-inside: avoid; border-left-width: 5px; border-left-style: solid }
  .estado-banner .sello { font-size: 11pt; font-weight: 800; letter-spacing: 0.4px; padding: 4px 12px; border-radius: 20px; white-space: nowrap; flex-shrink: 0 }
  .estado-banner .detalle { font-size: 9.5pt; line-height: 1.4; flex: 1 }
  .estado-ok  { background: #f0fdf4; border-color: #16a34a; color: #15803d }
  .estado-ok  .sello { background: #16a34a; color: #fff }
  .estado-cond{ background: #fffbeb; border-color: #d97706; color: #92400e }
  .estado-cond .sello { background: #d97706; color: #fff }
  .estado-no  { background: #fef2f2; border-color: #dc2626; color: #991b1b }
  .estado-no  .sello { background: #dc2626; color: #fff }
  /* ── TOC clickeable ───────────────────────────────────────────────────── */
  .toc { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 24px; margin: 20px 0 28px; page-break-inside: avoid }
  .toc-title { font-size: 12pt; font-weight: 700; color: #0e6560; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #ccfbf1; display: flex; align-items: center; gap: 8px }
  .toc-list { list-style: none; padding: 0; margin: 0; counter-reset: toc-counter }
  .toc-list li { counter-increment: toc-counter; margin: 4px 0; display: flex; align-items: baseline; gap: 8px; font-size: 10pt }
  .toc-list li a { color: #0e6560; text-decoration: none; font-weight: 500 }
  .toc-list li a:hover { text-decoration: underline; color: #115e59 }
  .toc-list li::before { content: counter(toc-counter, decimal-leading-zero); font-family: monospace; color: #94a3b8; font-size: 9pt; font-weight: 700; min-width: 24px }
  .toc-list .toc-dots { flex: 1; border-bottom: 1px dotted #cbd5e1; transform: translateY(-3px) }
  .toc-list .toc-page { font-family: monospace; font-size: 9pt; color: #64748b }
  /* ── Running header (logo en cada página impresa) ─────────────────────── */
  .running-header { display: none }
  hr.sep { margin: 24px 0; border: none; border-top: 1px dashed #cbd5e1 }
  .nota { font-size: 8.5pt; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 10px; text-align: center; line-height: 1.6 }
  .mem-desc { background: #f0fdfa; border: 1px solid #99f6e4; border-left: 4px solid #0f766e; border-radius: 6px; padding: 12px 16px; margin: 10px 0; font-size: 9.5pt; line-height: 1.7 }
  .mem-desc-title { font-weight: 700; color: #0f766e; font-size: 10pt; margin-bottom: 6px }
  .mem-desc p { margin: 4px 0 }
  .traz-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 16px; margin: 8px 0; font-size: 9pt }
  .traz-box table { font-size: 9pt; margin: 0 }
  .traz-box th { background: #f1f5f9; font-size: 8.5pt }
  .traz-box td { padding: 3px 6px }
  .firma-box { border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; margin: 10px 0; page-break-inside: avoid }
  .firma-linea { border-bottom: 1px solid #94a3b8; height: 52px; margin: 8px 0 2px }
  @media print {
    @page { margin: 18mm 12mm 14mm 12mm }
    body { margin: 0; padding: 0 12px }
    h2 { page-break-before: always }
    h2:first-of-type { page-break-before: avoid }
    .fig svg { max-width: 100% }
    /* Running header con logo en cada página */
    .running-header {
      display: flex !important;
      position: fixed;
      top: -16mm;
      left: 0;
      right: 0;
      height: 12mm;
      padding: 2mm 8mm;
      background: linear-gradient(135deg, #0e6560 0%, #0f766e 100%);
      color: #fff;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 8.5pt;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .running-header .rh-left { display: flex; align-items: center; gap: 8px; min-width: 0 }
    .running-header .rh-left img { height: 8mm; width: auto; border-radius: 2px }
    .running-header .rh-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90mm }
    .running-header .rh-right { font-size: 7.5pt; opacity: 0.9; text-align: right; white-space: nowrap }
    /* La portada NO necesita el running header (tiene su propio banner) */
    .cover-page { page-break-after: always }
  }
</style>
</head>
<body>

<!-- ══ RUNNING HEADER (visible solo al imprimir, en cada página) ══════════ -->
<div class="running-header">
  <div class="rh-left">
    ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Talora"/>` : ''}
    <div class="rh-title">${proy.nombre || 'Memoria de Cálculo DOM'}</div>
  </div>
  <div class="rh-right">
    Talora · ${fechaHoy}
  </div>
</div>

<!-- ══ PORTADA TALORA ══════════════════════════════════════════════════ -->
<div style="background:linear-gradient(135deg,#0e6560,#0f766e);color:#fff;padding:24px 32px;border-radius:10px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;gap:20px">
  <div style="display:flex;align-items:center;gap:16px;flex:1">
    ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:80px;width:auto;border-radius:8px;flex-shrink:0" alt="Talora"/>` : '<div style="font-size:24px;font-weight:900">Talora</div>'}
    <div>
      <div style="font-size:11px;opacity:0.8;margin-bottom:6px">Plataforma de Verificación Normativa OGUC</div>
      <div style="font-size:20px;font-weight:800;line-height:1.2;margin-bottom:4px">${proy.nombre || 'Sin nombre de proyecto'}</div>
      ${proy.direccion ? `<div style="font-size:11px;opacity:0.85;margin-bottom:2px">📍 ${proy.direccion}${proy.rolAvaluo ? ` &nbsp;·&nbsp; Rol: ${proy.rolAvaluo}` : ''}</div>` : ''}
      <div style="font-size:12px;opacity:0.85">${proy.comuna ? proy.comuna + ' · ' : ''}Zona Térmica ${proy.zona || '—'} · ${uso || '—'} · ${proy.pisos || '—'} piso(s)</div>
    </div>
  </div>
  <div style="text-align:right;flex-shrink:0">
    <div style="font-size:12px;font-weight:700;margin-bottom:4px;opacity:0.9">Memoria de Cálculo DOM</div>
    <div style="font-size:11px;opacity:0.75;margin-bottom:10px">Fecha: ${fechaHoy}</div>
    <div style="padding:6px 16px;background:${allOkLocal ? '#22c55e' : '#ef4444'};border-radius:20px;font-weight:800;font-size:13px;display:inline-block;letter-spacing:0.5px">
      ${allOkLocal ? '✓ CUMPLE' : '✗ OBSERVACIONES'}
    </div>
  </div>
</div>

<!-- Datos del proyecto y profesional -->
<div class="data-row">
  <div class="data-item"><label>Proyecto</label><span>${proy.nombre || '[sin nombre]'}</span></div>
  ${proy.propietario ? `<div class="data-item"><label>Propietario / Mandante</label><span>${proy.propietario}</span></div>` : ''}
  ${proy.rutPropietario ? `<div class="data-item"><label>RUT propietario</label><span>${proy.rutPropietario}</span></div>` : ''}
  ${proy.direccion ? `<div class="data-item"><label>Dirección</label><span>${proy.direccion}</span></div>` : ''}
  ${proy.rolAvaluo ? `<div class="data-item"><label>Rol de avalúo</label><span>${proy.rolAvaluo}</span></div>` : ''}
  <div class="data-item"><label>Arquitecto / Proyectista</label><span>${proy.arq || '[sin nombre]'}</span></div>
  <div class="data-item"><label>Comuna</label><span>${proy.comuna || '—'}</span></div>
  <div class="data-item"><label>Zona térmica</label><span>${proy.zona || '—'} — ${ZONAS[proy.zona]?.n || '—'}</span></div>
  <div class="data-item"><label>Uso</label><span>${uso || '—'}</span></div>
  <div class="data-item"><label>Pisos</label><span>${proy.pisos || '—'}</span></div>
  <div class="data-item"><label>Sistema estructural</label><span>${proy.estructura || '—'}</span></div>
  <div class="data-item"><label>Fecha emisión</label><span>${fechaHoy}</span></div>
</div>
${zonaData ? `<div class="aviso">Condiciones de diseño Zona ${proy.zona}: Ti = ${zonaData.Ti}°C · Te = ${zonaData.Te}°C · HR = ${zonaData.HR}% · Exigencias DS N°15: U<sub>muro</sub> ≤ ${zonaData.muro} · U<sub>techo</sub> ≤ ${zonaData.techo} · U<sub>piso</sub> ≤ ${zonaData.piso} W/m²K</div>` : ''}
${(proy.profesional || proy.arq || proy.propietario) ? `
<div style="margin-top:12px;padding:12px 16px;background:#f0fdfa;border-radius:8px;border-left:4px solid #0e6560;display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">
  ${proy.propietario ? `
  <div style="flex:1;min-width:180px;padding-right:16px;border-right:1px solid #99f6e4">
    <div style="font-size:9pt;color:#0e6560;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Propietario / Mandante</div>
    <div style="font-weight:700;font-size:12pt;color:#1e293b">${proy.propietario}</div>
    ${proy.rutPropietario ? `<div style="font-size:10pt;color:#475569">RUT: ${proy.rutPropietario}</div>` : ''}
    ${proy.direccion ? `<div style="font-size:10pt;color:#475569">📍 ${proy.direccion}</div>` : ''}
    ${proy.rolAvaluo ? `<div style="font-size:10pt;color:#64748b">Rol de avalúo: ${proy.rolAvaluo}</div>` : ''}
  </div>` : ''}
  <div style="flex:1;min-width:180px">
    <div style="font-size:9pt;color:#0e6560;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Profesional Responsable</div>
    <div style="font-weight:800;font-size:13pt;color:#1e293b">${proy.profesional || proy.arq || '—'}</div>
    ${proy.titulo ? `<div style="font-size:11pt;color:#475569">${proy.titulo}</div>` : ''}
    ${proy.rol ? `<div style="font-size:10pt;color:#64748b">${proy.rol}</div>` : ''}
  </div>
  ${proy.email || proy.telefono ? `
  <div style="flex:1;min-width:140px">
    <div style="font-size:9pt;color:#0e6560;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Contacto</div>
    ${proy.email ? `<div style="font-size:10pt;color:#475569">✉ ${proy.email}</div>` : ''}
    ${proy.telefono ? `<div style="font-size:10pt;color:#475569">☎ ${proy.telefono}</div>` : ''}
  </div>` : ''}
</div>` : ''}

<!-- ══ ÍNDICE / TABLA DE CONTENIDOS ══════════════════════════════════════ -->
<div class="toc">
  <div class="toc-title">📑 Índice de contenidos</div>
  <ol class="toc-list">
    <li><a href="#resumen">Resumen ejecutivo — Estado de cumplimiento</a><span class="toc-dots"></span><span class="toc-page">Módulo de síntesis</span></li>
    <li><a href="#modulo-1">Módulo 1 — Diagnóstico del proyecto</a><span class="toc-dots"></span><span class="toc-page">Datos generales</span></li>
    ${mods.termica  ? `<li><a href="#modulo-2">Módulo 2 — Verificación Térmica</a><span class="toc-dots"></span><span class="toc-page">DS N°15 / NCh853</span></li>` : ''}
    ${mods.sistemas ? `<li><a href="#modulo-2b">Módulo 2b — Sistemas constructivos</a><span class="toc-dots"></span><span class="toc-page">LOSCAT Ed.13</span></li>` : ''}
    ${mods.fuego    ? `<li><a href="#modulo-3">Módulo 3 — Resistencia al Fuego</a><span class="toc-dots"></span><span class="toc-page">OGUC · LOFC Ed.17</span></li>` : ''}
    ${mods.acustica ? `<li><a href="#modulo-4">Módulo 4 — Aislamiento Acústico</a><span class="toc-dots"></span><span class="toc-page">OGUC · NCh352</span></li>` : ''}
    ${mods.ventanas ? `<li><a href="#modulo-5">Módulo 5 — Ventanas y Vanos (VPCT)</a><span class="toc-dots"></span><span class="toc-page">DS N°15</span></li>` : ''}
    ${mods.puertas ? `<li><a href="#modulo-5c">Módulo 5b — Puertas (4 ejes normativos)</a><span class="toc-dots"></span><span class="toc-page">DS N°15 · LOFC · NCh352 · OGUC IV</span></li>` : ''}
    ${mods.escaleras ? `<li><a href="#modulo-5d">Módulo 5c — Escaleras de evacuación</a><span class="toc-dots"></span><span class="toc-page">OGUC Art. 4.5.7 · LOFC Ed.17</span></li>` : ''}
    ${mods.notas    ? `<li><a href="#modulo-6">Módulo 6 — Notas y observaciones</a><span class="toc-dots"></span><span class="toc-page">Profesional</span></li>` : ''}
    ${correccionesPorElem.length > 0 ? `<li><a href="#modulo-6b">Módulo 6b — Correcciones aplicadas (C1–C8)</a><span class="toc-dots"></span><span class="toc-page">NCh853 · Motor Talora</span></li>` : ''}
    ${(mods.escantillones && detallesInforme.length > 0) ? `<li><a href="#modulo-8">Módulo 8 — Detalles constructivos de unión</a><span class="toc-dots"></span><span class="toc-page">Escantillones · NCh853 · ISO 14683</span></li>` : ''}
    ${(detallesIlustrados?.length > 0) ? `<li><a href="#modulo-8b">Módulo 8b — Detalles arquitectónicos del proyectista</a><span class="toc-dots"></span><span class="toc-page">Dibujos + análisis</span></li>` : ''}
    <li><a href="#modulo-7">Módulo 7 — Responsabilidad profesional y firma</a><span class="toc-dots"></span><span class="toc-page">OGUC Art. 1.2.2</span></li>
  </ol>
</div>

<h2 id="resumen">Resumen ejecutivo — Estado de cumplimiento</h2>
<div style="font-size:8.5pt;color:#64748b;margin-bottom:8px">
  Consolidación automática de todas las verificaciones normativas realizadas. Los elementos sin datos ingresados se muestran como "Sin datos" y no afectan el estado general.
</div>
${checksExtendido.length === 0 ? '<div class="aviso">Sin parámetros verificados. Complete los módulos Térmica, Fuego y Acústica.</div>' : `
<div class="${allOkLocal ? 'resumen-ok' : 'resumen-no'}">${allOkLocal ? '✅ El proyecto CUMPLE con todos los parámetros verificados.' : '❌ El proyecto NO CUMPLE con uno o más requisitos — ver detalle a continuación.'}</div>
<table>
  <tr><th>Módulo / Elemento</th><th>Valor calculado</th><th>Exigencia normativa</th><th>Norma / Tabla</th><th>Estado</th></tr>
  ${resumenRows}
</table>`}

<h2 id="modulo-1">Módulo 1 — Diagnóstico del proyecto</h2>
<table>
  <tr><th>Ítem</th><th>Valor</th><th>Fuente / Norma</th></tr>
  <tr><td>Nombre del proyecto</td><td><b>${proy.nombre || '—'}</b></td><td>Expediente DOM</td></tr>
  ${proy.propietario ? `<tr><td>Propietario / Mandante</td><td><b>${proy.propietario}</b>${proy.rutPropietario ? ` &nbsp;·&nbsp; RUT: ${proy.rutPropietario}` : ''}</td><td>Expediente DOM</td></tr>` : ''}
  ${proy.direccion ? `<tr><td>Dirección de la obra</td><td><b>${proy.direccion}</b></td><td>Expediente DOM</td></tr>` : ''}
  ${proy.rolAvaluo ? `<tr><td>Rol de avalúo</td><td><b>${proy.rolAvaluo}</b></td><td>SII — Expediente DOM</td></tr>` : ''}
  <tr><td>Zona térmica</td><td><b>${proy.zona || '—'} — ${ZONAS[proy.zona]?.n || '—'}</b>${ZONAS[proy.zona]?.ej ? ` (${ZONAS[proy.zona].ej})` : ''}</td><td>DS N°15 MINVU Tabla 1</td></tr>
  <tr><td>Uso del edificio</td><td><b>${uso || '—'}</b></td><td>OGUC Art. 4.5.1</td></tr>
  ${CATEG_FUEGO[uso] ? `<tr style="background:${CATEG_FUEGO[uso].bgColor}">
    <td><b>Categoría de riesgo de incendio</b></td>
    <td><b style="color:${CATEG_FUEGO[uso].color};font-size:11pt">${CATEG_FUEGO[uso].cat}</b> — ${CATEG_FUEGO[uso].desc} · ${CATEG_FUEGO[uso].grupo}</td>
    <td style="color:#64748b;font-size:9pt"><b>OGUC Tít. 4 Cap. 3</b></td>
  </tr>` : ''}
  <tr><td>N° de pisos</td><td><b>${proy.pisos || '—'}</b></td><td>RF_PISOS(uso, pisos) → ${RF_PISOS(uso, proy.pisos) || '—'}</td></tr>
  <tr><td>Superficie edificada</td><td><b>${proy.superficie ? `${proy.superficie} m²` : '—'}</b></td><td>OGUC Tít. 4 Cap. 3 Tabla 1</td></tr>
  ${proy.destinoOGUC || (USO_TO_OGUC[uso]?.length === 1 && USO_TO_OGUC[uso][0]) ? `<tr><td>Destino OGUC (Tabla 1)</td><td><b>${proy.destinoOGUC || USO_TO_OGUC[uso]?.[0] || '—'}</b></td><td>OGUC Tít. 4 Cap. 3</td></tr>` : ''}
  ${(() => { const d=proy.destinoOGUC||(USO_TO_OGUC[uso]?.length===1?USO_TO_OGUC[uso][0]:''); const l=getLetraOGUC_loaded(d,proy.superficie,proy.pisos); return l?`<tr style="background:#dcfce7"><td><b>Letra OGUC (Tabla 1)</b></td><td><b style="font-size:12pt;color:#166534">${l.toUpperCase()}</b> — determina RF por elemento constructivo</td><td>OGUC Tít. 4 Cap. 3 Tabla 1</td></tr>`:'' })()}
  <tr><td>Sistema estructural</td><td><b>${proy.estructura || '—'}</b></td><td>LOFC Ed.17 2025</td></tr>
  ${zonaData ? `<tr><td>Ti diseño / Te diseño / HR diseño</td><td><b>${zonaData.Ti}°C / ${zonaData.Te}°C / ${zonaData.HR}%</b></td><td>DS N°15 Tabla 2</td></tr>` : ''}
  ${RIESGO_INC[uso] ? `<tr><td>Riesgo de incendio</td><td><b>${RIESGO_INC[uso]}</b></td><td>OGUC Tít. 4 Cap. 3 / LOFC Ed.17</td></tr>` : ''}
  ${proy.estructura && OBS_EST[proy.estructura] ? `<tr><td>RF intrínseca estimada</td><td colspan="2" style="font-size:9pt">${OBS_EST[proy.estructura]}</td></tr>` : ''}
</table>

${mods.termica ? `<h2 id="modulo-2">Módulo 2 — Verificación Térmica (DS N°15 MINVU / NCh853:2021 / ISO 6946)</h2>
<div class="traz-box">
  <table>
    <tr><th style="min-width:140px">Marco normativo</th><th>Descripción</th></tr>
    <tr><td><b>DS N°15 MINVU</b></td><td>Reglamento de instalaciones térmicas — establece U máx. por elemento y zona</td></tr>
    <tr><td><b>NCh853:2021</b></td><td>Acondicionamiento térmico — cálculo de transmitancia térmica (U)</td></tr>
    <tr><td><b>NCh1973:2014</b></td><td>Verificación de riesgo de condensación superficial e intersticial (método de la planilla MINVU)</td></tr>
    <tr><td><b>ISO 6946:2017</b></td><td>Resistencias térmicas en componentes de edificación — método de cálculo</td></tr>
    <tr><td><b>EN ISO 13788</b></td><td>Método de Glaser — verificación de condensación intersticial</td></tr>
    <tr><td><b>Zona térmica aplicada</b></td><td>${proy.zona || '—'} — ${ZONAS[proy.zona]?.n || '—'} · Ti = ${zonaData?.Ti ?? '—'}°C · Te = ${zonaData?.Te ?? '—'}°C · HR interior = ${zonaData?.HR ?? '—'}%</td></tr>
    <tr><td><b>U máx. muro</b></td><td>${zonaData?.muro ? `≤ ${zonaData.muro} W/m²K (DS N°15 Tabla 3)` : '—'}</td></tr>
    <tr><td><b>U máx. techo</b></td><td>${zonaData?.techo ? `≤ ${zonaData.techo} W/m²K (DS N°15 Tabla 3)` : '—'}</td></tr>
    <tr><td><b>U máx. piso</b></td><td>${zonaData?.piso ? `≤ ${zonaData.piso} W/m²K (DS N°15 Tabla 3)` : '—'}</td></tr>
  </table>
</div>
<div style="font-size:9.5pt;color:#64748b;margin-bottom:8px">
  Método de cálculo: Resistencias en serie ISO 6946 · Condensación intersticial: Método de Glaser (NCh1973:2014 / EN ISO 13788) ·
  Ti = ${zonaData?.Ti ?? '—'}°C · Te = ${zonaData?.Te ?? '—'}°C · HR = ${zonaData?.HR ?? '—'}%
</div>
${seccionesTermicas || '<div class="aviso">Sin soluciones constructivas aplicadas. Aplica soluciones desde la pestaña Soluciones.</div>'}` : ''}

${mods.sistemas ? (() => {
  const ests = (proy.estructuras || []).filter(e => e.soluciones && Object.keys(e.soluciones).length > 0)
  if (!ests.length) return ''
  const ELEMS_RPT = ['muro','techo','piso','tabique']
  const zonaD = ZONAS[proy.zona] || {}
  const umaxMap = { muro: zonaD.muro, techo: zonaD.techo, piso: zonaD.piso, tabique: null }
  return `
<h2 id="modulo-2b">Módulo 2b — Soluciones constructivas por sistema estructural</h2>
<p style="font-size:9.5pt;color:#64748b;margin-bottom:10px">
  El proyecto define <b>${proy.estructuras.length} sistemas estructurales</b> con soluciones asignadas individualmente.
  La siguiente tabla resume las propiedades térmicas y de resistencia al fuego por sistema y elemento constructivo.
</p>
<table>
  <tr>
    <th>Sistema estructural</th>
    <th>Sector / Pisos</th>
    <th>Elemento</th>
    <th>Solución (LOSCAT)</th>
    <th>U catálogo LOSCAT (W/m²K)</th>
    <th>U máx DS N°15</th>
    <th>RF</th>
    <th>Estado (catálogo)</th>
  </tr>
  ${ests.flatMap(est =>
    ELEMS_RPT.filter(k => est.soluciones[k]).map(k => {
      const d = est.soluciones[k]
      const umax = umaxMap[k]
      const uV = parseFloat(d.u || 0)
      const okU = !umax || uV <= umax
      const rfReqMap = { muro: RF_ELEM_REQ('muro',uso,proy.pisos), techo: RF_ELEM_REQ('techo',uso,proy.pisos), piso: RF_ELEM_REQ('piso',uso,proy.pisos), tabique: RF_ELEM_REQ('tabique',uso,proy.pisos) }
      const rfReqK = rfReqMap[k] || ''
      const okRF = !rfReqK || !d.rf || rfN(d.rf) >= rfN(rfReqK)
      const ok = okU && okRF
      return `<tr style="background:${ok ? '#f0fdf4' : '#fff5f5'}">
        <td><b>${est.tipo}</b></td>
        <td>${est.sector || ''}${est.desde ? ` P${est.desde}${est.hasta !== est.desde ? `–${est.hasta}` : ''}` : ''}</td>
        <td>${k.charAt(0).toUpperCase() + k.slice(1)}</td>
        <td>${d.solucion ? `<b>${d.solucion.cod}</b><br/><span style="font-size:8.5pt">${d.solucion.desc || ''}</span>` : '—'}</td>
        <td style="font-weight:700;color:${okU ? '#166534' : '#dc2626'}">${d.u || '—'}</td>
        <td>${umax ? `≤ ${umax}` : '—'}</td>
        <td>${d.rf || '—'}</td>
        <td><span class="${ok ? 'badge-ok' : 'badge-no'}">${ok ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
      </tr>`
    })
  ).join('')}
</table>
<div style="font-size:8.5pt;color:#64748b;margin-top:6px;line-height:1.5">B5 · La columna <b>U catálogo LOSCAT</b> es el valor certificado de la ficha, informativo. La <b>verificación definitiva</b> usa el <b>U del proyecto calculado</b> a partir de las capas reales (incluidas correcciones) — ver <b>Módulo 2</b> y el <b>Resumen ejecutivo</b>. Ante diferencia entre ambos, manda el U calculado.</div>`
})() : ''}

${mods.fuego ? `<h2 id="modulo-3">Módulo 3 — Resistencia al Fuego (OGUC Tít. 4 Cap. 3 · Art. 4.5.4 / LOFC Ed.17 2025)</h2>
<div class="traz-box">
  <table>
    <tr><th style="min-width:140px">Marco normativo</th><th>Descripción</th></tr>
    <tr><td><b>OGUC Tít. 4 Cap. 3</b></td><td>Clasificación de destinos y categorías de riesgo de incendio (R1–R4)</td></tr>
    <tr><td><b>OGUC Art. 4.5.4</b></td><td>Exigencias de RF por elemento constructivo según destino, superficie y pisos</td></tr>
    <tr><td><b>LOFC Ed.17 2025</b></td><td>Lista Oficial de Soluciones Constructivas (RF certificada por elemento)</td></tr>
    <tr><td><b>NCh850</b></td><td>Ensayo de resistencia al fuego de elementos de construcción</td></tr>
    <tr><td><b>Método aplicado</b></td><td>${_letraRpt ? `OGUC Tabla 1 — Letra ${_letraRpt.toUpperCase()} (destino ${_destOGUCRpt || uso} · ${proy.superficie||'—'} m² · ${proy.pisos||'—'} pisos)` : 'Tabla RF_DEF por uso/pisos (fallback — sin superficie/destino ingresado)'}</td></tr>
  </table>
</div>
${uso && CATEG_FUEGO[uso] ? `
<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:${CATEG_FUEGO[uso].bgColor};border:1px solid ${CATEG_FUEGO[uso].borderColor};border-radius:6px;margin-bottom:10px">
  <div style="font-weight:900;font-size:16pt;color:${CATEG_FUEGO[uso].color};background:#fff;border:2px solid ${CATEG_FUEGO[uso].borderColor};border-radius:6px;padding:2px 12px;letter-spacing:0.04em">${CATEG_FUEGO[uso].cat}</div>
  <div>
    <div style="font-weight:700;font-size:11pt;color:#374151">${CATEG_FUEGO[uso].desc} — ${CATEG_FUEGO[uso].grupo}</div>
    <div style="font-size:9pt;color:#64748b">Clasificación del destino <b>${uso}</b> según <b>OGUC Tít. 4 Cap. 3</b>. Determina exigencias de RF, compartimentación y evacuación para este proyecto.</div>
  </div>
</div>` : ''}
${uso && proy.estructura ? `<div class="aviso"><b>Sistema estructural:</b> ${proy.estructura} → RF base ≈ ${RF_EST?.[proy.estructura] || '—'} · <b>Riesgo:</b> ${RIESGO_INC[uso] || '—'}</div>` : ''}
${(() => {
    const d = proy.destinoOGUC || (USO_TO_OGUC[uso]?.length===1 ? USO_TO_OGUC[uso][0] : '')
    const l = getLetraOGUC_loaded(d, proy.superficie, proy.pisos)
    if (!l) return `<div class="aviso">⚠ <b>RF aproximada (RF_DEF fallback)</b> — para aplicar OGUC Tít. 4 Cap. 3 Tabla 1 exacta, ingresa la superficie edificada (m²) y el destino OGUC en el Diagnóstico.</div>`
    return `<div style="display:flex;align-items:center;gap:10px;padding:6px 12px;background:#dcfce7;border:1px solid #86efac;border-radius:6px;margin-bottom:8px">
      <div style="font-weight:900;font-size:16pt;color:#166534;background:#fff;border:2px solid #86efac;border-radius:6px;padding:2px 12px">${l.toUpperCase()}</div>
      <div style="font-size:10pt;color:#166534"><b>Letra ${l.toUpperCase()} — OGUC Tít. 4 Cap. 3 Tabla 1</b><br><span style="font-size:9pt;color:#64748b">${d} · ${proy.superficie} m² · ${proy.pisos} piso(s)</span></div>
    </div>`
  })()}
<table>
  <tr><th>Elemento</th><th>RF propuesta</th><th>RF mínima requerida (OGUC Tabla 1)</th><th>Columna OGUC</th><th>Estado</th></tr>
  ${rfRows || '<tr><td colspan="5" style="color:#94a3b8;text-align:center">Sin datos de resistencia al fuego</td></tr>'}
</table>
${(['Estructura de acero','Metalframe (acero liviano)'].some(t => proy.estructura?.includes(t)) || (proy.estructuras || []).some(e => ['Estructura de acero','Metalframe (acero liviano)'].includes(e.tipo))) ? `
<h3 style="color:#92400e;margin-top:14px">🔥 Protección ignífuga requerida — Sistemas con RF intrínseca F0</h3>
<div class="aviso" style="border-color:#fcd34d;background:#fffbeb;color:#78350f">
  <b>RF intrínseca F0 — requiere protección ignífuga en todos los elementos.</b><br>
  Sistemas afectados: <b>${(proy.estructuras||[]).filter(e=>['Estructura de acero','Metalframe (acero liviano)'].includes(e.tipo)).map(e=>e.tipo+(e.sector?` (${e.sector})`:'') ).join(', ') || proy.estructura}</b><br>
  RF estructural exigida: <b>${RF_PISOS(uso, proy.pisos) || RF_DEF[uso]?.estructura || '—'}</b>
  (${proy.pisos} pisos · uso ${uso}).
</div>
<table>
  <tr><th>Sistema de protección</th><th>Espesores orientativos por RF (Hp/A ≤ 200 m⁻¹)</th><th>Norma</th></tr>
  <tr><td>Hormigón proyectado / encamisado (f'c ≥ 20 MPa)</td><td>F30 → 25 mm · F60 → 35 mm · F120 → 50 mm</td><td>LOFC Ed.17 B.1.2</td></tr>
  <tr><td>Yeso proyectado / vermiculita (ρ ≥ 650 kg/m³)</td><td>F30 → 20 mm · F60 → 25 mm · F90 → 35 mm · F120 → 50 mm</td><td>LOFC Ed.17 B.1.3 / EN 13381-4</td></tr>
  <tr><td>Lana de roca / silicato cálcico (ρ ≥ 100 kg/m³)</td><td>F30 → 25 mm · F60 → 35 mm · F90 → 50 mm · F120 → 65 mm</td><td>EN 13381-4 / ETA fabricante</td></tr>
  <tr><td>Planchas yeso-cartón tipo F (multicapa)</td><td>F30 → 1×15 mm · F60 → 2×15 mm · F90 → 3×15 mm</td><td>EN 520 / EN 13501-2</td></tr>
  <tr><td>Pintura intumescente (WB/SB)</td><td>DFT según ETA fabricante + Hp/A. F30 ≈ 400–800 µm · F60 ≈ 800–1.500 µm</td><td>EN 13381-8 / ETA</td></tr>
</table>
<div style="font-size:9pt;color:#78350f;margin-top:6px;padding:6px 10px;background:#fef9c3;border-radius:4px">
  ⚠ Espesores orientativos LOFC Ed.17 Annex B para Hp/A ≤ 200 m⁻¹. Verificar con el calculador de acero en la aplicación (factor Hp/A específico del perfil). Los valores definitivos requieren ficha técnica del fabricante, DOP y ETA vigente. RF debe respaldarse con ensayo NCh850 o clasificación equivalente.
</div>` : ''}` : ''}

${mods.acustica ? `<h2 id="modulo-4">Módulo 4 — Aislamiento Acústico (OGUC Art. 4.1.6 / NCh352:2013)</h2>
<div class="traz-box">
  <table>
    <tr><th style="min-width:140px">Marco normativo</th><th>Descripción</th></tr>
    <tr><td><b>OGUC Art. 4.1.6</b></td><td>Aislamiento acústico entre recintos en edificios de uso habitacional y mixto</td></tr>
    <tr><td><b>NCh352:2013</b></td><td>Aislamiento acústico — requisitos mínimos de Rw y L'n,w según tipo de separación</td></tr>
    <tr><td><b>ISO 15712</b></td><td>Estimación de desempeño acústico de elementos de edificación</td></tr>
    <tr><td><b>Uso evaluado</b></td><td>${uso || '—'} · Exigencia Rw entre unidades: ≥ ${AC_DEF[uso]?.entre_unidades || '—'} dB · Rw fachada: ≥ ${AC_DEF[uso]?.fachada || '—'} dB</td></tr>
  </table>
</div>
<table>
  <tr><th>Tipo de separación</th><th>Rw propuesto</th><th>Rw mínimo NCh352</th><th>Estado</th></tr>
  ${rwRows || '<tr><td colspan="4" style="color:#94a3b8;text-align:center">Sin datos de aislamiento acústico</td></tr>'}
  ${lnwRow}
</table>` : ''}

${mods.ventanas ? vpctHtml : ''}

${mods.puertas ? puertasHtml : ''}

${mods.escaleras ? escalerasHtml : ''}

${mods.notas ? notasHtml : ''}

${correccionesHtml}

${detallesHtml}

${(() => {
  // ── Módulo 8b — Detalles ilustrados (uploaded por el usuario) ──────────────
  const detallesUsuario = []
  // detallesIlustrados viene del closure
  if (Array.isArray(detallesIlustrados) && detallesIlustrados.length > 0) {
    const ELEM_LABELS_R = { muro:'Muro', piso:'Piso', techo:'Techo / Cubierta', tabique:'Tabique', ventana:'Ventana', fundacion:'Fundación', estructural:'Elemento estructural', otro:'Otro' }
    const cards = detallesIlustrados.map(d => {
      const marcadoresPorElem = {}
      ;(d.marcadores || []).forEach(m => {
        if (!m.elemento) return
        if (!marcadoresPorElem[m.elemento]) marcadoresPorElem[m.elemento] = []
        marcadoresPorElem[m.elemento].push(m)
      })
      const elementosConData = Object.entries(marcadoresPorElem).map(([elem, marks]) => ({
        elem, marks, capas: obtenerCapasParaInforme(elem),
      })).filter(e => e.capas)
      const leyenda = elementosConData.map(({ elem, marks, capas }) => {
        const aislIdx = findAislacionIdx(capas.capas)
        const marksBadges = marks.map(m => `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#0e6560;color:#fff;font-size:9pt;font-weight:800;text-align:center;line-height:18px;margin-right:3px">${m.label}</span>`).join('')
        const capasList = capas.capas.map((c, idx) => {
          const highlight = idx === aislIdx
          return `<li style="margin-bottom:2px;${highlight ? 'background:#fef3c7;padding:1px 4px;border-radius:3px' : ''}">
            <b>${c.esCamara ? 'Cámara de aire' : (c.mat || c.n || '—')}</b>
            ${!c.esCamara && c.esp ? `<span style="color:#64748b"> · ${Math.round(parseFloat(c.esp))} mm</span>` : ''}
            ${!c.esCamara && c.lam ? `<span style="color:#94a3b8;font-size:8.5pt"> · λ=${parseFloat(c.lam).toFixed(3)}</span>` : ''}
            ${highlight ? '<span style="color:#d97706;font-weight:700"> ← aislante</span>' : ''}
          </li>`
        }).join('')
        const notasMarcs = marks.filter(m => m.nota).map(m => `${m.label}: ${m.nota}`).join(' · ')
        return `<div style="margin-bottom:12px;padding:10px 12px;background:#f8fafc;border-left:4px solid #0e6560;border-radius:6px;page-break-inside:avoid">
          <div style="margin-bottom:4px">${marksBadges}<b style="color:#0e6560;font-size:10.5pt">${ELEM_LABELS_R[elem] || elem}</b>
          ${capas.sc ? `<span style="color:#64748b;font-family:monospace;font-size:8.5pt;margin-left:6px">LOSCAT ${capas.sc}${capas.U ? ` · U=${parseFloat(capas.U).toFixed(4)}` : ''}</span>` : ''}</div>
          ${notasMarcs ? `<div style="font-size:9pt;color:#475569;font-style:italic;margin-bottom:4px">${notasMarcs}</div>` : ''}
          <ol style="margin:4px 0 0 18px;padding:0;font-size:9.5pt;line-height:1.6;color:#1e293b">${capasList}</ol>
        </div>`
      }).join('')

      // Insertar imagen con marcadores como HTML (imagen + overlay)
      // En el informe, mostramos la imagen + leyenda en columnas
      return `<div style="page-break-inside:avoid;margin:18px 0;padding:14px;border:1px solid #e2e8f0;border-radius:10px;background:#fff">
        <h3 style="font-size:11pt;color:#0e6560;margin:0 0 4px;border-left:3px solid #5eead4;padding-left:8px">${d.nombre}</h3>
        <div style="font-size:9pt;color:#64748b;margin-bottom:10px">${d.tipo || 'otro'} · ${d.marcadores?.length || 0} marcadores · ${elementosConData.length} elementos identificados</div>
        <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
          <div style="flex:1 1 55%;min-width:280px;position:relative;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px;display:flex;align-items:center;justify-content:center">
            <div style="position:relative;display:inline-block;max-width:100%">
              <img src="${d.imagenDataUrl}" alt="${d.nombre}" style="max-width:100%;height:auto;display:block;border-radius:4px"/>
              ${(d.marcadores || []).map(m => `<div style="position:absolute;left:${(m.x*100).toFixed(2)}%;top:${(m.y*100).toFixed(2)}%;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;background:${m.elemento ? '#0e6560' : '#94a3b8'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:10pt;font-weight:800;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4)">${m.label}</div>`).join('')}
            </div>
          </div>
          <div style="flex:1 1 38%;min-width:240px">
            ${leyenda || '<div style="padding:10px 14px;background:#fef3c7;border:1px solid #fde047;border-radius:6px;font-size:9pt;color:#92400e">Sin elementos asignados a los marcadores.</div>'}
          </div>
        </div>
      </div>`
    }).join('')
    detallesUsuario.push(`
<h2 id="modulo-8b" style="page-break-before:always">Módulo 8b — Detalles arquitectónicos del proyectista</h2>
<div style="font-size:9pt;color:#64748b;margin-bottom:14px;line-height:1.6">
  Esta sección presenta los <b>detalles constructivos dibujados por el profesional proyectista</b>, complementados con la documentación técnica generada automáticamente por Talora a partir de las soluciones LOSCAT aplicadas. Cada marcador sobre el dibujo identifica un elemento constructivo cuyas capas, materiales, espesores y propiedades térmicas se listan en la leyenda lateral.
</div>
${cards}`)
  }
  return detallesUsuario.join('')
})()}

<!-- ══ MÓDULO 7 — RESPONSABILIDAD PROFESIONAL ══════════════════════════════ -->
<h2 id="modulo-7" style="page-break-before:always">Módulo 7 — Responsabilidad Profesional y Firma</h2>
<div style="font-size:9pt;color:#64748b;margin-bottom:14px;line-height:1.6">
  De conformidad con el <b>Art. 1.2.2 de la OGUC</b>, el profesional competente es responsable de la revisión técnica, firma y presentación del expediente ante la Dirección de Obras Municipales (DOM).
  Esta memoria de cálculo es un documento de apoyo técnico que debe ser <b>revisado, firmado y timbrado</b> por el profesional responsable antes de su presentación oficial.
</div>

<!-- Mini-card de cumplimiento + ID documento -->
<div style="display:flex;gap:14px;margin-bottom:14px;flex-wrap:wrap">
  <div style="flex:1;min-width:240px;background:${allOkLocal ? '#f0fdf4' : '#fef2f2'};border:2px solid ${allOkLocal ? '#86efac' : '#fca5a5'};border-radius:8px;padding:14px 16px">
    <div style="font-size:8.5pt;color:${allOkLocal ? '#16a34a' : '#dc2626'};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Estado consolidado de cumplimiento</div>
    <div style="font-size:14pt;font-weight:800;color:${allOkLocal ? '#15803d' : '#991b1b'};margin-bottom:4px">
      ${allOkLocal ? '✓ CUMPLE NORMATIVA' : '✗ CON OBSERVACIONES'}
    </div>
    <div style="font-size:9pt;color:#475569;line-height:1.5">
      ${checksExtendido.length} parámetros · ${checksExtendido.filter(c => !c.informativo && c.ok).length} conformes · ${checksExtendido.filter(c => !c.informativo && !c.ok).length} no conformes · ${checksExtendido.filter(c => c.informativo).length} informativos/no aplica
      <div style="font-size:8pt;color:#94a3b8;margin-top:4px;font-weight:400">Se cuentan solo los parámetros con dato ingresado. Los que quedan sin dato deben completarse en sus módulos. La escalera (Módulo 5c), si aplica, se verifica en su propio módulo.</div>
    </div>
  </div>
  <div style="flex:1;min-width:240px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:14px 16px">
    <div style="font-size:8.5pt;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Identificación del documento</div>
    <div style="font-family:monospace;font-size:11pt;font-weight:700;color:#1e293b;letter-spacing:1px;margin-bottom:4px">
      ${(() => {
        // ID determinista basado en proyecto + fecha (no criptográfico, solo trazabilidad)
        const seed = (proy.nombre || 'proy') + (proy.arq || proy.profesional || '') + fechaHoy
        let h = 0; for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0 }
        const id = Math.abs(h).toString(16).toUpperCase().padStart(8, '0').slice(0, 8)
        const ts = new Date().toISOString().slice(0,16).replace(/[-T:]/g,'').slice(2)
        return `NC-${id}-${ts}`
      })()}
    </div>
    <div style="font-size:8.5pt;color:#64748b;line-height:1.5">
      Generado por Talora · ${new Date().toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' })}
    </div>
  </div>
</div>

<div class="firma-box">
  <table style="width:100%;font-size:10pt">
    <tr>
      <td style="width:48%;padding-right:20px;border-right:1px solid #e2e8f0;vertical-align:top">
        <div style="font-size:9pt;color:#0e6560;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">Profesional Responsable</div>
        <table style="font-size:10pt;width:100%">
          <tr><td style="padding:5px 0;color:#64748b;width:42%;border-bottom:1px solid #f1f5f9">Nombre completo</td><td style="font-weight:700;border-bottom:1px solid #f1f5f9;padding:5px 0">${proy.profesional || proy.arq || '<span style="color:#cbd5e1;font-weight:400">[Pendiente]</span>'}</td></tr>
          <tr><td style="padding:5px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Profesión / Título</td><td style="border-bottom:1px solid #f1f5f9;padding:5px 0">${proy.titulo || '<span style="color:#cbd5e1">[Pendiente]</span>'}</td></tr>
          <tr><td style="padding:5px 0;color:#64748b;border-bottom:1px solid #f1f5f9">RUT</td><td style="border-bottom:1px solid #f1f5f9;padding:5px 0;font-family:monospace">${proy.rutProfesional || '<span style="color:#cbd5e1;font-family:sans-serif">[Pendiente]</span>'}</td></tr>
          <tr><td style="padding:5px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Rol / Cargo</td><td style="border-bottom:1px solid #f1f5f9;padding:5px 0">${proy.rol || '<span style="color:#cbd5e1">[Pendiente]</span>'}</td></tr>
          ${proy.email ? `<tr><td style="padding:5px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Email</td><td style="border-bottom:1px solid #f1f5f9;padding:5px 0">${proy.email}</td></tr>` : ''}
          ${proy.telefono ? `<tr><td style="padding:5px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Teléfono</td><td style="border-bottom:1px solid #f1f5f9;padding:5px 0">${proy.telefono}</td></tr>` : ''}
          <tr><td style="padding:5px 0;color:#64748b">Fecha emisión</td><td style="padding:5px 0"><b>${fechaHoy}</b></td></tr>
        </table>
      </td>
      <td style="width:52%;padding-left:20px;vertical-align:top">
        <div style="font-size:9pt;color:#0e6560;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">Firma, Timbre y Sello Profesional</div>
        <div style="height:120px;border:1.5px dashed #94a3b8;border-radius:6px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px;background:#fafbfc;position:relative">
          <div style="position:absolute;top:8px;left:10px;font-size:7pt;color:#cbd5e1;letter-spacing:1px;font-weight:600">FIRMA · TIMBRE · SELLO</div>
          <span style="font-size:8pt;color:#94a3b8;font-style:italic">Espacio reservado para firma profesional</span>
        </div>
        <div style="margin-top:14px;padding-top:8px;border-top:1px solid #e2e8f0">
          <div style="font-size:8pt;color:#94a3b8;text-align:center;margin-bottom:4px">Nombre y RUT (letra de imprenta)</div>
          <div style="height:30px;border-bottom:1px solid #cbd5e1"></div>
        </div>
        <div style="margin-top:10px;padding:6px 10px;background:#f1f5f9;border-radius:4px;font-size:8pt;color:#475569;text-align:center;line-height:1.5">
          📌 <b>Colegio Profesional</b> · N° Registro: <span style="border-bottom:1px solid #94a3b8;padding:0 30px">&nbsp;</span>
        </div>
      </td>
    </tr>
  </table>
</div>

<!-- Declaración legal expandida -->
<div style="margin-top:14px;font-size:8.5pt;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0e6560;border-radius:6px;padding:12px 16px;line-height:1.7">
  <div style="font-weight:700;color:#0e6560;font-size:9.5pt;margin-bottom:6px">📋 Declaración de responsabilidad profesional</div>
  El profesional que firma el presente documento <b>declara haber revisado</b> los cálculos contenidos en esta memoria y <b>asume la responsabilidad técnica</b> de los resultados obtenidos, en conformidad con la normativa vigente:
  <ul style="margin:6px 0 6px 18px;padding:0;line-height:1.65">
    <li><b>OGUC Art. 1.2.2</b> — Responsabilidad del profesional competente en la presentación de proyectos.</li>
    <li><b>OGUC Art. 4.1.10</b> — Aislación térmica de la envolvente y exigencias por zona térmica (DS N°15 MINVU).</li>
    <li><b>OGUC Tít. IV Cap. 3</b> — Comportamiento al fuego de los elementos constructivos (Tabla 1).</li>
    <li><b>OGUC Art. 4.1.6</b> — Aislación acústica entre unidades habitacionales.</li>
  </ul>
  <div style="margin-top:6px;padding-top:6px;border-top:1px dashed #cbd5e1">
    <b>Notas técnicas:</b> Los valores de <b>RF</b> declarados requieren respaldo mediante ensayo conforme a <b>NCh850</b> o clasificación según <b>LOFC Ed.17 2025</b>. Los valores <b>Rw</b> estimados requieren validación mediante ensayo <b>NCh352:2013</b>. El cumplimiento higrotérmico se verifica según el método de Glaser establecido en <b>NCh1973:2014</b> (equivalente a EN ISO 13788). Para acreditación formal ante la DOM se recomienda la planilla oficial MINVU de análisis higrotérmico.
  </div>
</div>

<!-- ══ PIE DE PÁGINA ════════════════════════════════════════════════════════ -->
<div style="margin-top:32px;padding:14px 20px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
  <div style="flex:1;min-width:200px">
    ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:40px;width:auto;border-radius:5px;margin-bottom:6px" alt="Talora"/>` : '<b style="color:#0e6560">Talora</b>'}
    <div style="font-size:8pt;color:#94a3b8;line-height:1.6">
      Generado: ${fechaHoy} · Plataforma Talora — Verificación Normativa OGUC<br>
      Normativas: LOSCAT Ed.13 2025 · DS N°15 MINVU · NCh853:2021 · ISO 6946:2017 · OGUC Tít. IV · LOFC Ed.17 2025 · NCh352:2013 · EN ISO 13788
    </div>
  </div>
  <div style="font-size:7.5pt;color:#94a3b8;text-align:right;flex-shrink:0">
    ⚠ Documento preliminar — sujeto a revisión profesional<br>OGUC Art. 1.2.2 · Responsabilidad del proyectista competente
  </div>
</div>
</body></html>`

    const nombreArchivo = (proy.nombre || 'informe').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').trim().replace(/\s+/g, '-') + '-' + fechaHoy.replace(/\//g, '-')

    // ── Modo PREVIEW: abrir el modal en lugar de exportar ──────────────────────
    if (modo === 'preview') {
      setPreviewHtml({ html, nombreArchivo })
      return
    }

    if (formatoExport === 'html') {
      // ── Descarga directa como archivo HTML ──────────────────────────────
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${nombreArchivo}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)

    } else if (formatoExport === 'word') {
      // ── Word (.doc) — HTML con cabecera de namespace Word ───────────────
      // Word abre archivos HTML con las directivas <!--[if gte mso 9]> nativamente
      const wordDoc = html
        .replace('<!DOCTYPE html>', '')
        .replace('<html lang="es">', `<html xmlns:o='urn:schemas-microsoft-com:office:office'
  xmlns:w='urn:schemas-microsoft-com:office:word'
  xmlns='http://www.w3.org/TR/REC-html40' lang="es">`)
        .replace('<meta charset="UTF-8">', `<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<!--[if gte mso 9]><xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>90</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
    <w:RelyOnVML/>
  </w:WordDocument>
</xml><![endif]-->`)

      const blob = new Blob(['\ufeff', wordDoc], { type: 'application/msword' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${nombreArchivo}.doc`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)

    } else {
      // ── PDF vía nueva pestaña + auto-print ────────────────────────────────
      // Razones del enfoque:
      //  · html2pdf.js + html2canvas → PDF en blanco (cross-doc, body
      //    descartado en innerHTML, etc.)
      //  · iframe.contentWindow.print() → también blanco con srcDoc + doc
      //    pesado (bug conocido de Chromium con iframes srcDoc).
      //  · window.open(blob) + print() → render nativo del browser, fuente y
      //    SVGs cargan correctamente, "Guardar como PDF" del diálogo funciona.
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const blobUrl = URL.createObjectURL(blob)
      const w = window.open(blobUrl, '_blank')
      if (!w) {
        alert('El navegador bloqueó la nueva pestaña. Permite pop-ups para esta página y vuelve a intentar.\n\nAlternativa: abre Vista previa y usa Ctrl+P.')
        URL.revokeObjectURL(blobUrl)
      } else {
        // Disparar print apenas el doc termine de cargar (no antes), con
        // un buffer corto para fonts/SVGs. Limpiar la URL del blob después.
        w.addEventListener('load', () => {
          setTimeout(() => w.print(), 400)
        })
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
      }
    }
  }

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Resumen y exportación"
        pasos={[
          'Este módulo consolida automáticamente los datos ingresados en <b>Diagnóstico, Soluciones, Térmica, Fuego &amp; Acústica</b>.',
          'Solo aparecen filas para los parámetros que hayas completado. Completa los módulos anteriores para ver el resumen completo.',
          'Las filas en <b>verde</b> indican cumplimiento normativo. Las filas en <b>rojo</b> indican incumplimiento que debe corregirse antes de presentar el expediente.',
          'Presiona <b>"Exportar Informe DOM"</b> para generar un informe HTML completo con tablas de capas, cálculos U, gráficos Glaser y verificación RF/acústica por elemento.',
          '<b>Nota legal:</b> Esta verificación es preliminar. El profesional competente es responsable de la firma del expediente DOM (OGUC Art. 1.2.2).',
        ]}
        normativa="DS N°15 MINVU · OGUC Título 4 · NCh853:2021 · NCh352 · LOSCAT Ed.13 2025 · LOFC Ed.17 2025"
      />

      {/* ── Panel de configuración del informe ──────────────────────────────── */}
      <div style={{ ...S.card, border:'1.5px solid #99f6e4', background:'#f8faff' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <p style={{ ...S.h2, marginBottom:0 }}>📋 Módulos del informe</p>
          {modulosInforme && (
            <button onClick={resetMods}
              style={{ fontSize:11, color:'#64748b', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:6, padding:'3px 10px', cursor:'pointer' }}>
              ↺ Restablecer automático
            </button>
          )}
        </div>
        <p style={{ fontSize:11, color:'#64748b', marginBottom:12 }}>
          Los módulos <b>requeridos</b> se determinan automáticamente según el uso y zona del proyecto.
          Puedes activar o desactivar módulos opcionales antes de exportar.
        </p>
        {!proy.uso && <div style={{ ...S.warn, marginBottom:10 }}>Define el uso del proyecto en Diagnóstico para ver los módulos requeridos.</div>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:8 }}>
          {[
            {
              key: 'termica', icon: '🌡', label: 'Verificación Térmica',
              norma: 'DS N°15 MINVU · NCh853',
              req: reqTermica, reqMsg: reqTermica ? `Zona ${proy.zona} definida` : 'Sin zona — no aplica DS N°15',
            },
            {
              key: 'fuego', icon: '🔥', label: 'Resistencia al Fuego',
              norma: 'OGUC Art. 4.5.4 · LOFC Ed.17',
              req: reqFuego, reqMsg: reqFuego ? `RF requerido para uso ${uso}` : `Uso ${uso||'—'} sin exigencia RF`,
            },
            {
              key: 'acustica', icon: '🔊', label: 'Aislamiento Acústico',
              norma: 'OGUC Art. 4.1.6 · NCh352',
              req: reqAcustica, reqMsg: reqAcustica ? `Acústica exigible para uso ${uso}` : `Uso ${uso||'—'} sin exigencia acústica`,
            },
            {
              key: 'sistemas', icon: '🏗', label: 'Soluciones por sistema estructural',
              norma: 'LOSCAT Ed.13 / LOFC Ed.17',
              req: false, reqMsg: haySistemas ? `${proy.estructuras.length} sistemas definidos` : 'Sin múltiples sistemas',
            },
            {
              key: 'ventanas', icon: '🪟', label: 'Ventanas y Vanos (VPCT)',
              norma: 'DS N°15 Tabla 3 · OGUC Art. 4.1.10',
              req: false, reqMsg: hayVentanas ? 'Datos de fachadas completados' : 'Sin datos de fachadas',
            },
            {
              key: 'puertas', icon: '🚪', label: 'Puertas (4 ejes normativos)',
              norma: 'DS N°15 · LOFC Ed.17 · NCh352 · OGUC Tít. IV',
              req: false, reqMsg: hayPuertas ? `${(puertas || []).length} puertas configuradas` : 'Sin componentes seleccionados en puertas',
            },
            {
              key: 'escaleras', icon: '🚶', label: 'Escaleras de evacuación',
              norma: 'OGUC Art. 4.5.7 · LOFC Ed.17 · NCh430 · NCh850',
              req: _pisosNum >= 2,
              reqMsg: _pisosNum >= 2
                ? `Proyecto de ${_pisosNum} pisos — exigible OGUC Art. 4.5.7`
                : escaleras?.incluido
                  ? `Incluida voluntariamente (proyecto de 1 piso)`
                  : 'Proyecto de 1 piso — no exigible',
            },
            {
              key: 'notas', icon: '📝', label: 'Notas del proyectista',
              norma: '',
              req: false, reqMsg: hayNotas ? 'Hay notas ingresadas' : 'Sin notas',
            },
            {
              key: 'escantillones', icon: '📐', label: 'Escantillones de unión',
              norma: 'NCh853:2021 · Guía MINVU Puentes Térmicos · ISO 14683',
              req: false, reqMsg: hayEscantillones ? 'Capas disponibles para muro + piso/techo' : 'Sin soluciones LOSCAT en muro y piso/techo',
            },
          ].map(({ key, icon, label, norma, req, reqMsg }) => {
            const activo = mods[key]
            return (
              <div key={key} style={{
                border: activo ? (req ? '2px solid #166534' : '1.5px solid #0e6560') : '1px solid #e2e8f0',
                borderRadius:8, padding:'10px 12px',
                background: activo ? (req ? '#f0fdf4' : '#f0fdfa') : '#fafafa',
                opacity: activo ? 1 : 0.65,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <span style={{ fontSize:16 }}>{icon}</span>
                  <span style={{ fontWeight:700, fontSize:12, flex:1, color: activo ? '#1e293b' : '#94a3b8' }}>{label}</span>
                  <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer' }}>
                    <input type="checkbox" checked={activo} onChange={() => toggleMod(key)}
                      style={{ width:15, height:15, cursor:'pointer', accentColor: req ? '#166534' : '#0e6560' }} />
                  </label>
                </div>
                {norma && <div style={{ fontSize:10, color:'#94a3b8', marginBottom:4 }}>{norma}</div>}
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  {req ? (
                    <span style={{ fontSize:10, background:'#dcfce7', color:'#166534', borderRadius:12, padding:'1px 8px', fontWeight:700 }}>
                      ✓ Requerido
                    </span>
                  ) : (
                    <span style={{ fontSize:10, background:'#f1f5f9', color:'#64748b', borderRadius:12, padding:'1px 8px' }}>
                      Opcional
                    </span>
                  )}
                  <span style={{ fontSize:10, color:'#94a3b8' }}>{reqMsg}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={S.card}>
        <p style={S.h2}>Resumen de verificación</p>
        {(!zona || !uso) && <div style={S.warn}>Completa Diagnóstico primero.</div>}
        {checks.length === 0 && zona && uso && <div style={S.warn}>Ingresa datos en Térmica, Fuego y Acústica para ver resultados.</div>}
        {checks.length > 0 && (
          <>
            <div style={{ ...allOk ? S.ok : S.err, marginBottom: 12, fontSize: 14, fontWeight: 700 }}>
              {allOk ? '✅ El proyecto CUMPLE con todos los parámetros verificados.' : '❌ El proyecto NO CUMPLE con uno o más requisitos normativos.'}
            </div>
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>Parámetro</th>
                <th style={S.th}>Valor propuesto</th>
                <th style={S.th}>Exigencia norma</th>
                <th style={S.th}>Estado</th>
              </tr></thead>
              <tbody>
                {checks.map(c => (
                  <tr key={c.label}>
                    <td style={S.td}><b>{c.label}</b></td>
                    <td style={S.td}>{c.val}</td>
                    <td style={S.td}>{c.max}</td>
                    <td style={S.td}>{c.informativo
                      ? <span title="Estimado por ley de masa — no certificado. No afecta el estado general." style={{ background:'#fef3c7', color:'#92400e', borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:700, cursor:'help' }}>{c.ok ? 'CUMPLE (est.)' : '⚠ REVISAR (est.)'}</span>
                      : <span style={S.badge(c.ok)}>{c.ok ? 'CUMPLE' : 'NO CUMPLE'}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* ── Selector de formato + botón exportar ──────────────────── */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Píldoras de formato */}
              <div style={{ display: 'flex', gap: 0, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                {[
                  { id: 'pdf',  icon: '📥', label: 'PDF',  title: 'Descarga directa del informe como archivo .pdf (sin diálogo de impresión)' },
                  { id: 'html', icon: '🌐', label: 'HTML', title: 'Descarga el informe como archivo HTML (se abre en cualquier navegador)' },
                  { id: 'word', icon: '📄', label: 'Word', title: 'Descarga el informe como archivo .doc (se abre en Microsoft Word o LibreOffice)' },
                ].map((f, i) => (
                  <button key={f.id}
                    title={f.title}
                    onClick={() => setFormatoExport(f.id)}
                    style={{
                      padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      borderLeft: i > 0 ? '1px solid #e2e8f0' : 'none',
                      background: formatoExport === f.id ? '#0e6560' : '#f8fafc',
                      color:      formatoExport === f.id ? '#fff'    : '#64748b',
                      transition: 'background 0.15s',
                    }}>
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>

              {/* Botón Vista Previa (no consume token) */}
              <button
                style={{ ...S.btn('#0f766e'), background:'#0f766e' }}
                onClick={() => exportarInforme('preview')}
                title="Revisar el informe antes de generar/descargar — no consume token"
              >
                👁 Vista previa
              </button>

              {/* Botón principal */}
              <button
                style={S.btn('#166534')}
                onClick={() => exportarInforme('export')}
              >
                {formatoExport === 'pdf'  ? '🖨 Imprimir / Guardar PDF'
                : formatoExport === 'html' ? '⬇ Descargar HTML'
                :                            '⬇ Descargar Word'}
              </button>

              {/* Descripción breve del formato */}
              <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                {formatoExport === 'pdf'  && 'Abre vista previa y diálogo de imprimir — elige "Guardar como PDF"'}
                {formatoExport === 'html' && 'Archivo .html — se abre en cualquier navegador, fácil de compartir'}
                {formatoExport === 'word' && 'Archivo .doc — compatible con Microsoft Word y LibreOffice Writer'}
              </span>
            </div>
          </>
        )}
      </div>
      <div style={{ ...S.card, fontSize: 11, color: '#64748b' }}>
        <b>Normativa:</b> DS N°15 MINVU | OGUC Título 4 | NCh853:2021 | NCh1973 | NCh352 | LOSCAT Ed.13 | LOCF Ed.17 2025<br />
        Esta verificación es preliminar. El arquitecto responsable debe firmar el expediente DOM.
      </div>
      <NotasPanel tabKey="resultados" notas={notas} setNotas={setNotas} />

      {/* ── Modal Vista Previa del Informe ─────────────────────────────────── */}
      {previewHtml && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewHtml(null) }}
          style={{
            position:'fixed', inset:0, background:'rgba(15,23,42,0.85)', zIndex:9999,
            display:'flex', flexDirection:'column', padding:'16px',
          }}
        >
          {/* Toolbar superior */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
            padding:'8px 16px', background:'#0e6560', color:'#fff', borderRadius:'8px 8px 0 0',
            boxShadow:'0 -2px 8px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:16, fontWeight:700 }}>👁 Vista previa del informe</span>
              <span style={{ fontSize:11, opacity:0.85, padding:'2px 8px', background:'rgba(255,255,255,0.15)', borderRadius:4 }}>
                {previewHtml.nombreArchivo}
              </span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button
                onClick={() => {
                  // Imprimir/Guardar PDF directo: abre el HTML en nueva
                  // pestaña + auto-print. Independiente del formato elegido.
                  const blob = new Blob([previewHtml.html], { type: 'text/html;charset=utf-8' })
                  const blobUrl = URL.createObjectURL(blob)
                  const w = window.open(blobUrl, '_blank')
                  if (!w) {
                    alert('El navegador bloqueó la nueva pestaña. Permite pop-ups y reintenta.')
                    URL.revokeObjectURL(blobUrl)
                  } else {
                    w.addEventListener('load', () => setTimeout(() => w.print(), 400))
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
                  }
                }}
                style={{ padding:'6px 14px', background:'#fff', color:'#0e6560', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:12 }}
              >
                🖨 Imprimir / Guardar PDF
              </button>
              <button
                onClick={() => {
                  // Descarga real del formato actual desde la vista previa
                  setPreviewHtml(null)
                  setTimeout(() => exportarInforme('export'), 50)
                }}
                style={{ padding:'6px 14px', background:'#16a34a', color:'#fff', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:12 }}
              >
                {formatoExport === 'pdf' ? '🖨 Imprimir / Guardar PDF' : `⬇ Descargar ${formatoExport.toUpperCase()}`}
              </button>
              <button
                onClick={() => setPreviewHtml(null)}
                style={{ padding:'6px 14px', background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:12 }}
                title="Cerrar (ESC)"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>
          {/* iframe con el HTML del informe (solo preview visual — el print
              real va por window.open() en los botones, no por el iframe) */}
          <iframe
            id="preview-iframe"
            srcDoc={previewHtml.html}
            style={{
              flex:1, width:'100%', border:'none', background:'#fff',
              borderRadius:'0 0 8px 8px', boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
            }}
            title="Vista previa del informe DOM"
          />
        </div>
      )}
    </div>
  )
}

// ─── PLANTILLAS RÁPIDAS POR USO ────────────────────────────────────────────────
// Pre-cargan valores RF y Rw normativos típicos según el tipo de proyecto.
// El usuario puede sobrescribir cualquier valor después. NO pre-asignan LOSCAT
// (eso queda al criterio del proyectista en la pestaña Soluciones).
const PLANTILLAS_USO = [
  {
    id: 'viv_unifamiliar_horm',
    icono: '🏠',
    nombre: 'Vivienda unifamiliar — Hormigón',
    descripcion: 'Casa 1-2 pisos, muros HA o albañilería, techumbre liviana, sin medianeros.',
    proy: { uso: 'Vivienda', pisos: '2', estructura: 'Hormigón armado' },
    termica: {
      muro:    { rf: 'F60', rw: '45' },
      techo:   { rf: 'F30', rw: '45' },
      piso:    { rf: 'F60', rw: '45' },
      tabique: { rf: 'F30', rw: '40' },
    },
  },
  {
    id: 'viv_unifamiliar_madera',
    icono: '🌲',
    nombre: 'Vivienda unifamiliar — Madera',
    descripcion: 'Casa con entramado de madera, plataforma, techumbre liviana.',
    proy: { uso: 'Vivienda', pisos: '2', estructura: 'Madera' },
    termica: {
      muro:    { rf: 'F30', rw: '45' },
      techo:   { rf: 'F15', rw: '45' },
      piso:    { rf: 'F30', rw: '45' },
      tabique: { rf: 'F15', rw: '40' },
    },
  },
  {
    id: 'viv_altura_horm',
    icono: '🏢',
    nombre: 'Vivienda en altura — Hormigón',
    descripcion: 'Edificio residencial 3+ pisos, estructura HA, medianeros entre unidades.',
    proy: { uso: 'Vivienda', pisos: '4', estructura: 'Hormigón armado' },
    termica: {
      muro:    { rf: 'F90', rw: '50' },
      techo:   { rf: 'F60', rw: '50' },
      piso:    { rf: 'F90', rw: '55' },
      tabique: { rf: 'F60', rw: '45' },
    },
  },
  {
    id: 'oficina',
    icono: '💼',
    nombre: 'Oficina pequeña — Hormigón',
    descripcion: 'Edificio de oficinas hasta 500 m², HA o albañilería.',
    proy: { uso: 'Oficina', pisos: '3', estructura: 'Hormigón armado' },
    termica: {
      muro:    { rf: 'F60', rw: '40' },
      techo:   { rf: 'F30', rw: '40' },
      piso:    { rf: 'F60', rw: '40' },
      tabique: { rf: 'F30', rw: '35' },
    },
  },
  {
    id: 'educacion',
    icono: '🎓',
    nombre: 'Educación pre/primaria — Hormigón',
    descripcion: 'Establecimiento educacional <1.000 m², exigencias RF y Rw mayores.',
    proy: { uso: 'Educacion', pisos: '2', estructura: 'Hormigón armado' },
    termica: {
      muro:    { rf: 'F60', rw: '45' },
      techo:   { rf: 'F30', rw: '45' },
      piso:    { rf: 'F60', rw: '45' },
      tabique: { rf: 'F60', rw: '40' },
    },
  },
  {
    id: 'comercio',
    icono: '🏬',
    nombre: 'Comercio / Local pequeño',
    descripcion: 'Local comercial hasta 500 m², HA o albañilería.',
    proy: { uso: 'Comercio', pisos: '1', estructura: 'Hormigón armado' },
    termica: {
      muro:    { rf: 'F60', rw: '40' },
      techo:   { rf: 'F30', rw: '40' },
      piso:    { rf: 'F60', rw: '40' },
      tabique: { rf: 'F30', rw: '35' },
    },
  },
]

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
const TABS = ['1 · Diagnóstico', '2 · Soluciones', '3 · Térmica', '4 · Fuego', '5 · Acústica', '6 · Cálculo U', '7 · Ventana', '8 · Puerta', '9 · Detalles', '10 · Resultados', '⚙ Admin']
const ENERG_TABS = ['🏠 Inicio', '⚙ Configuración', '📊 Demanda', '🔬 Detalles', '🌱 Renovables', '📑 Informe']

export default function App() {
  return (
    <MigrationGate>
      <AuthProvider>
        <AuthGate>
          <AppInner />
        </AuthGate>
      </AuthProvider>
    </MigrationGate>
  )
}

// ─── Panel admin con sub-pestañas ─────────────────────────────────────────────
function AdminPanel({ onOverridesChanged }) {
  const [subTab, setSubTab] = useState('stats')
  const stBtnStyle = (active) => ({
    padding: '6px 16px', border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer',
    fontSize: 12, fontWeight: active ? 700 : 400,
    background: active ? '#fff' : 'transparent',
    color: active ? '#0e6560' : '#64748b',
  })
  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 2, background: '#e2e8f0', padding: '4px 4px 0', borderRadius: '8px 8px 0 0', marginBottom: 0, flexWrap: 'wrap' }}>
        <button style={stBtnStyle(subTab === 'stats')}   onClick={() => setSubTab('stats')}>📊 Estadísticas</button>
        <button style={stBtnStyle(subTab === 'tokens')}  onClick={() => setSubTab('tokens')}>🔑 Tokens</button>
        <button style={stBtnStyle(subTab === 'zonas')}   onClick={() => setSubTab('zonas')}>🗺 Zonas</button>
        <button style={stBtnStyle(subTab === 'usuarios')} onClick={() => setSubTab('usuarios')}>👥 Usuarios</button>
        <button style={stBtnStyle(subTab === 'feedback')} onClick={() => setSubTab('feedback')}>📬 Buzon</button>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 8px 8px 8px', padding: 16 }}>
        {subTab === 'stats'    && <AdminStats />}
        {subTab === 'tokens'   && <AdminTokens />}
        {subTab === 'zonas'    && <AdminZonas  onOverridesChanged={onOverridesChanged} />}
        {subTab === 'usuarios' && <UserManager />}
        {subTab === 'feedback' && <AdminFeedback />}
      </div>
    </div>
  )
}

function AppInner() {
  const { user, perfil, orgActual, isAdmin, tokens, consumirToken } = useAuth()
  const [theme, setTheme] = useTheme('base')
  const [appMode, setAppMode] = useState('normativo')   // 'normativo' | 'energetico'
  const [energTab, setEnergTab] = useState(0)           // sub-tabs del módulo energético
  const [tab, setTab] = useState(0)
  const [proy, setProy] = useState({ nombre: '', propietario: '', rutPropietario: '', direccion: '', rolAvaluo: '', arq: '', comuna: '', zona: '', uso: 'Vivienda', pisos: '2', superficie: '', destinoOGUC: '', estructura: '', estructuras: [], profesional: '', rutProfesional: '', titulo: '', rol: '', email: '', telefono: '', ocupantes: '' })
  const [termica, setTermica] = useState({})
  const [calcUInit, setCalcUInit] = useState({})
  const [exportError, setExportError] = useState('')
  const [notas, setNotas] = useState({})
  // modulosInforme: null = auto (determinado por uso/zona), o {termica,fuego,acustica,ventanas,notas,sistemas}
  const [modulosInforme, setModulosInforme] = useState(null)
  // detallesIlustrados: lista de detalles arquitectónicos dibujados por el usuario
  //  cada item: { id, nombre, tipo, imagenDataUrl, imagenW, imagenH, marcadores:[{id,x,y,elemento,label,nota}] }
  //  x,y normalizados [0,1] respecto a las dimensiones de la imagen para ser resolution-independent
  const [detallesIlustrados, setDetallesIlustrados] = useState([])

  const proyectos = useProjects(user?.id, orgActual?.id)
  const [proyectoActual, setProyectoActual] = useState(null)
  const [showProjects, setShowProjects] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const autoSaveTimer = useRef(null)
  const [showAyuda, setShowAyuda] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showFeedbackBanner, setShowFeedbackBanner] = useState(false)

  // Aviso "puedes enviarnos mensajes" — se muestra una vez por usuario
  useEffect(() => {
    if (!user?.id) return
    try {
      if (!localStorage.getItem(`nc_feedback_banner_v1_${user.id}`)) setShowFeedbackBanner(true)
    } catch { /* localStorage no disponible */ }
  }, [user?.id])

  function dismissFeedbackBanner() {
    setShowFeedbackBanner(false)
    try { if (user?.id) localStorage.setItem(`nc_feedback_banner_v1_${user.id}`, '1') } catch { /* noop */ }
  }

  // OGUC normative data (loaded from Supabase with fallback to local)
  // Start with local data to avoid undefined errors during loading
  const [ogucData, setOgucData] = useState(null)
  const [ogucLoading, setOgucLoading] = useState(true)

  // Load OGUC data on mount
  useEffect(() => {
    cargarDatosOGUC()
      .then(data => {
        setOgucData(data)
        setOgucLoading(false)
      })
      .catch(err => {
        console.error('Error loading OGUC data:', err)
        // Continue with loaded data anyway
        setOgucLoading(false)
      })
  }, [])

  // Use loaded data, or fallback to empty objects if still loading
  const ogucDataReady = ogucData || {
    OGUC_RF_LETRAS: {},
    OGUC_TABLA1: {},
    OGUC_ELEM_COL: {},
  }

  // ─── Wrapper functions for OGUC operations (pass loaded data) ───────────────────
  // These replace the global aliases, but with loaded OGUC data captured in closure
  // Memoized to avoid recreation on every render
  const { getLetraOGUC_loaded, getRFDeLetra_loaded, getRFOGUC_loaded } = useMemo(() => ({
    getLetraOGUC_loaded: (destino, m2, pisos) =>
      obtenerLetraOGUC(destino, m2, pisos, ogucDataReady.OGUC_TABLA1),
    getRFDeLetra_loaded: (letra, elemId) =>
      obtenerRFdeLetra(letra, elemId, ogucDataReady.OGUC_RF_LETRAS, ogucDataReady.OGUC_ELEM_COL),
    // Firma externa (uso, destino, m2, pisos, elemId): `uso` se ignora (legado),
    // se usa `destino`. FIX 2026-05-27: antes pasaba (uso, destino, m2, pisos)
    // a obtenerRFOGUC(destino, superficie, pisos, elemento) — descolocado y sin
    // elemId → siempre null. Ahora pasa los args correctos.
    getRFOGUC_loaded: (uso, destino, m2, pisos, elemId) =>
      obtenerRFOGUC(destino, m2, pisos, elemId, ogucDataReady.OGUC_TABLA1, ogucDataReady.OGUC_RF_LETRAS, ogucDataReady.OGUC_ELEM_COL),
  }), [ogucDataReady])

  // Contenido del panel de ayuda por pestaña (índice = tab)
  const ayudaData = useMemo(() => ({
    1: {
      titulo: 'Soluciones constructivas',
      pasos: [
        'Asegúrate de tener la <b>zona, uso y pisos</b> definidos en Diagnóstico. Las exigencias se calculan automáticamente.',
        'Selecciona el tipo de elemento: <b>Muro, Tabique, Techumbre, Piso, Ventana o Puerta</b>.',
        'Cada solución muestra semáforo triple: <b>T</b> (térmico), <b>F</b> (fuego), <b>A</b> (acústica).',
        'Usa <b>"Solo las que cumplen los 3 criterios"</b> para filtrar soluciones aptas.',
        'Ordena por <b>Cumplimiento, U↑, RF↓ o Rw↓</b> según el criterio prioritario.',
        'Expande una solución para ver sus capas. Las marcadas <b>"Homologable"</b> permiten editar espesores.',
        'Presiona <b>"Aplicar al proyecto"</b> para traspasar valores a la pestaña Térmica.',
      ],
      normativa: 'LOSCAT Ed.13 2025 · LOFC Ed.17 2025 · DS N°15 Tabla 1 y 3 · OGUC Art. 4.5.4 · NCh352 · NCh853:2021',
    },
    2: {
      titulo: 'Verificación Térmica',
      pasos: [
        'Ingresa el valor U (W/m²K) para cada elemento desde la solución LOSCAT o desde Cálculo U.',
        'El campo <b>RF propuesta</b> es opcional; si completaste Fuego, se toma automáticamente.',
        'El campo <b>Factor puente térmico (TB%)</b> corrige el U real según la estructura portante.',
        `Las filas en verde cumplen DS N°15 · Zona ${proy.zona||'—'}. Las rojas requieren ajuste.`,
        'La columna <b>Condensación</b> se calcula en la pestaña Cálculo U con el método Glaser.',
      ],
      normativa: 'DS N°15 MINVU · NCh853:2021 · ISO 6946:2017 · OGUC Art. 4.1.10 · LOFC Ed.17',
    },
    3: {
      titulo: 'Resistencia al Fuego',
      pasos: [
        'Define primero el <b>uso y número de pisos</b> en Diagnóstico: determinan las exigencias RF mínimas.',
        'Las columnas <b>RF mínima</b> se calculan automáticamente según OGUC Art. 4.5.4.',
        'La columna <b>Solución SC</b> muestra el RF de la solución LOSCAT aplicada si corresponde.',
        'Ingresa la <b>RF propuesta</b> manualmente si difiere de la solución.',
        '<b>Escaleras:</b> La RF debe respaldarse con ensayo NCh850 específico.',
        'La RF intrínseca del sistema estructural se muestra a continuación como referencia.',
      ],
      normativa: 'OGUC Art. 4.5.4 y 4.5.7 · LOFC Ed.17 2025 · NCh850',
    },
    4: {
      titulo: 'Aislamiento Acústico',
      pasos: [
        'Define primero el <b>uso</b> en Diagnóstico: determina los requisitos mínimos de Rw (NCh352:2013).',
        '<b>Entre unidades:</b> aislación horizontal entre departamentos contiguas — muros y tabiques.',
        '<b>Fachada:</b> aislación frente a ruido exterior — incluye ventana y puerta exterior.',
        '<b>Entre pisos Rw:</b> aislación vertical de sonido aéreo — losa y terminaciones.',
        '<b>Entre pisos L\'n,w:</b> nivel de impacto normalizado — <b>MENOR valor = MEJOR aislación</b>.',
        'Ingresa valores medidos o certificados (ensayo NCh352). Tolerancia ±2 dB típico.',
      ],
      normativa: 'OGUC Art. 4.1.6 · NCh352:2013 · NCh353 · ISO 15712 · DS N°594',
    },
    5: {
      titulo: 'Calculadora U y Condensación',
      pasos: [
        'Cada panel corresponde a un elemento: <b>Muro, Techo, Piso y Tabique</b>.',
        'Al aplicar una solución desde <b>Soluciones</b>, sus capas se cargan automáticamente.',
        'Puedes <b>agregar, editar, mover o eliminar capas</b> y presionar <b>Calcular U</b>.',
        'El sistema calcula U (ISO 6946) y verifica condensación intersticial (Glaser, NCh1973:2014).',
        'Si hay incumplimientos, aparecen <b>correcciones sugeridas</b> y texto de homologación.',
        'Usa <b>▼/▲</b> para colapsar paneles ya completados.',
      ],
      normativa: 'NCh853:2021 (transmitancia) · NCh1973:2014 (condensación) · ISO 6946:2017 · Método de Glaser (EN ISO 13788) · DS N°15 Tabla 1',
    },
    6: {
      titulo: 'Ventanas y análisis VPCT',
      pasos: [
        'Usa la <b>Calculadora U ventana</b> para obtener Uw según EN 10077 (Ug vidrio + Uf marco + ψ junta).',
        'En el <b>Analizador VPCT</b>, cada fila representa una fachada por orientación.',
        'Para volúmenes complejos agrega <b>múltiples fachadas</b> por orientación con el botón "+".',
        'Ingresa: área total fachada (m²), área vanos (m²) y Uw.',
        'Nivel VPCT según Uw: <b>Nivel 1</b> (≤2.0), <b>Nivel 2</b> (≤3.5), <b>Nivel 3</b> ({'>'}3.5).',
        'El % de vano = Av/At×100 se compara contra el límite VPCT de la zona y orientación.',
      ],
      normativa: 'DS N°15 MINVU Tabla 3 (VPCT) · EN 10077 (Uw) · NCh-EN 12207 · OGUC Art. 4.1.10',
    },
    7: {
      titulo: 'Puertas detalladas (4 ejes normativos)',
      pasos: [
        'Selecciona primero el <b>uso</b> de la puerta (acceso vivienda, evacuación, cuarto técnico, etc.) — fija los mínimos de RF y R\'w.',
        'Define <b>dimensiones</b> totales en metros (incluido el marco).',
        'Elige <b>hoja</b>, <b>marco</b> y <b>sello perimetral</b>. La app sugiere lo apropiado a tu zona DS N°15.',
        'Los <b>4 chips de cumplimiento</b> arriba muestran de un vistazo: U (térmica), RF (fuego), R\'w (acústica), dimensiones (OGUC).',
        'Usa el <b>comparativo</b> al final para ver tu config vs sugerida vs Casa Pasiva.',
      ],
      normativa: 'DS N°15 (U) · LOFC Ed.17 (RF) · NCh352 (R\'w) · OGUC Tít. IV (dimensiones) · ISO 10077-1',
    },
    9: {
      titulo: 'Resumen y exportación',
      pasos: [
        'Consolida automáticamente los datos de <b>Diagnóstico, Soluciones, Térmica, Fuego y Acústica</b>.',
        'Solo aparecen filas para los parámetros que hayas completado.',
        'Filas en <b>verde</b> = cumple · filas en <b>rojo</b> = requiere corrección.',
        'Presiona <b>"Exportar Informe DOM"</b> para generar un informe HTML completo.',
        '<b>Nota legal:</b> Verificación preliminar. El profesional es responsable de la firma (OGUC Art. 1.2.2).',
      ],
      normativa: 'DS N°15 MINVU · OGUC Título 4 · NCh853:2021 · NCh352 · LOSCAT Ed.13 2025 · LOFC Ed.17 2025',
    },
  }), [proy.zona])

  // State lifted from TabVentana
  const [fachadas, setFachadas] = useState([
    { id: 1, nombre: '', orient: 'N',  areaFachada: '', vanos: '', uw: '' },
    { id: 2, nombre: '', orient: 'OP', areaFachada: '', vanos: '', uw: '' },
    { id: 3, nombre: '', orient: 'S',  areaFachada: '', vanos: '', uw: '' },
  ])
  const [fachadasNextId, setFachadasNextId] = useState(4)

  // State lifted from TabPuerta — defaults: acceso principal + acceso a patio
  const [puertas, setPuertas] = useState([
    { id: 1, nombre: 'Acceso principal',      uso: 'acceso_vivienda', ancho: '0.90', alto: '2.00', hojaId: '', marcoId: '', selloId: '' },
    { id: 2, nombre: 'Acceso a patio/loggia', uso: 'acceso_vivienda', ancho: '0.80', alto: '2.00', hojaId: '', marcoId: '', selloId: '' },
  ])
  const [puertasNextId, setPuertasNextId] = useState(3)

  // State lifted from TabFuego (CalcRFEscalera) — para que el informe pueda
  // mostrar la sección de escaleras de evacuación (OGUC Art. 4.5.7)
  const [escaleras, setEscaleras] = useState({
    incluido: false,        // se autocompleta a true si pisos ≥ 2 (vía TabFuego)
    matId: 'ha',            // material de la escalera (peldaños + estructura)
    tieneCaja: null,        // null = auto (según OGUC), true/false = override usuario
    matCajaId: 'ha',        // material del recinto/caja de escalera
  })

  const [inventarioPT, setInventarioPT] = useState([])

  // Inyectar CSS responsive móvil
  useEffect(() => {
    if (document.getElementById('nc-mobile-css')) return
    const st = document.createElement('style')
    st.id = 'nc-mobile-css'
    st.textContent = `
      /* ═══ Easing curves (Emil Kowalski) ═════════════════════════════════ */
      :root {
        --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
        --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
      }

      /* ═══ Button polish global (Emil's :active scale + ease-out) ═══════ */
      button {
        transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out), opacity 160ms var(--ease-out);
      }
      @media (hover: hover) and (pointer: fine) {
        button:hover:not(:disabled) { filter: brightness(1.05); }
      }
      button:active:not(:disabled) { transform: scale(0.97); }

      /* ═══ Header global — prevenir overflow en mobile/tablet ═══════════ */
      .nc-header { min-width: 0; }
      .nc-header > * { min-width: 0; }
      .nc-header img { max-width: 30vw; }

      /* ═══ Hero gradient banners (TabPuerta, módulos) ═══════════════════ */
      .nc-hero {
        overflow-wrap: anywhere;
        word-break: normal;
      }
      .nc-hero h2 { font-size: clamp(15px, 4vw, 24px) !important; line-height: 1.2; }

      /* ═══ Sidebar desktop ══════════════════════════════════════════════ */
      @media (min-width: 641px) {
        .nc-with-sidebar {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .nc-with-sidebar .nc-content {
          flex: 1;
          min-width: 0;
        }
        .nc-sidebar {
          width: 270px;
          min-width: 270px;
          position: sticky;
          top: 16px;
          max-height: calc(100vh - 80px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #99f6e4 transparent;
        }
        .nc-sidebar::-webkit-scrollbar { width: 4px; }
        .nc-sidebar::-webkit-scrollbar-thumb { background: #99f6e4; border-radius: 4px; }
        .nc-has-sidebar .nc-ayuda-inline { display: none !important; }
      }

      /* ═══ Tablet (641-1024px) ═════════════════════════════════════════ */
      @media (min-width: 641px) and (max-width: 1024px) {
        .nc-body { padding: 12px !important; }
        .nc-header { padding: 8px 14px !important; }
        .nc-header img { height: 56px !important; }
        .nc-hero { padding: 14px 18px !important; }
        /* Nombre de usuario más compacto en tablet (todavía visible) */
        .nc-user-name { max-width: 120px !important; }
      }
      /* Tablet chico (641-820px): ocultar nombre, dejar solo badges */
      @media (min-width: 641px) and (max-width: 820px) {
        .nc-user-name { display: none !important; }
      }

      /* ═══ Móvil (≤640px) ══════════════════════════════════════════════ */
      @media (max-width: 640px) {
        .nc-body { padding: 8px !important; }
        .nc-tabs { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .nc-tabs::-webkit-scrollbar { display: none; }

        /* Tablas con scroll horizontal + indicador visual de scroll */
        .nc-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          position: relative;
          background:
            linear-gradient(to right, #fff 30%, rgba(255,255,255,0)) 0 0,
            linear-gradient(to right, rgba(255,255,255,0), #fff 70%) 100% 0,
            radial-gradient(farthest-side at 0 50%, rgba(15,23,42,0.18), rgba(0,0,0,0)) 0 0,
            radial-gradient(farthest-side at 100% 50%, rgba(15,23,42,0.18), rgba(0,0,0,0)) 100% 0;
          background-repeat: no-repeat;
          background-size: 40px 100%, 40px 100%, 14px 100%, 14px 100%;
          background-attachment: local, local, scroll, scroll;
        }
        .nc-table-scroll table { min-width: 480px; }
        .nc-table-scroll select { width: 130px !important; min-width: 0 !important; }
        .nc-table-scroll input { width: 48px !important; min-width: 0 !important; }

        /* Header principal: logo más chico + ocultar info redundante */
        .nc-header { padding: 6px 10px !important; gap: 8px !important; }
        .nc-header img { height: 44px !important; max-width: 22vw; }
        .nc-header-info { display: none !important; }
        .nc-header-subtitle { display: none !important; }
        /* UserHeader mobile: ocultar nombre + nombre dropdown abre desde el botón */
        .nc-user-name { display: none !important; }

        /* Hero banners: tipografía más compacta + padding reducido */
        .nc-hero { padding: 12px 14px !important; }
        .nc-hero h2 { font-size: 16px !important; line-height: 1.25; }
        .nc-hero p { font-size: 11px !important; }

        /* Inputs y selects sueltos (fuera de tablas): no exceder pantalla */
        input[type="text"], input[type="number"], input:not([type]), select, textarea {
          max-width: 100% !important;
        }

        /* Sidebar y botón sidebar: ocultos en mobile */
        .nc-sidebar { display: none !important; }
        .nc-sidebar-btn { display: none !important; }
      }

      /* ═══ Mobile chico (≤375px iPhone SE) ═════════════════════════════ */
      @media (max-width: 375px) {
        .nc-header img { height: 36px !important; }
        .nc-hero h2 { font-size: 14px !important; }
      }

      /* ═══ Reduced motion ═════════════════════════════════════════════ */
      @media (prefers-reduced-motion: reduce) {
        button { transition: none; }
        button:active { transform: none; }
      }
    `
    document.head.appendChild(st)
  }, [])

  // Modal de bienvenida al cargar la app: se muestra cuando hay autoguardado
  // detectado, para que el usuario elija (1) continuar el borrador, (2) abrir
  // proyecto guardado, o (3) crear nuevo. Si no hay autoguardado, se omite.
  const [showWelcome, setShowWelcome] = useState(false)
  const [esDemo, setEsDemo] = useState(false)   // proyecto de ejemplo cargado

  // Restore autosave on mount — incluir puertas + escaleras para que no se
  // pierdan al recargar la app (reportado por usuario 2026-05-27).
  useEffect(() => {
    const saved = proyectos.cargarAutoguardado()
    if (saved) {
      if (saved.proy)              setProy(saved.proy)
      if (saved.termica)           setTermica(saved.termica)
      if (saved.calcUInit)         setCalcUInit(saved.calcUInit)
      if (saved.fachadas)          setFachadas(saved.fachadas)
      if (saved.fachadasNextId)    setFachadasNextId(saved.fachadasNextId)
      if (saved.puertas)           setPuertas(saved.puertas)
      if (saved.puertasNextId)     setPuertasNextId(saved.puertasNextId)
      if (saved.escaleras)         setEscaleras(saved.escaleras)
      if (saved.notas)             setNotas(saved.notas)
      if (saved.detallesIlustrados) setDetallesIlustrados(saved.detallesIlustrados)
      // Solo mostrar modal si el borrador tiene contenido real (nombre,
      // soluciones o datos en alguna pestaña). Borrador vacío → directo.
      const tieneContenido = !!(saved.proy?.nombre || saved.proy?.comuna
        || Object.keys(saved.termica || {}).length
        || Object.keys(saved.calcUInit || {}).length)
      if (tieneContenido) setShowWelcome(true)
    } else {
      // Usuario sin borrador (primera vez): mostrar bienvenida para ofrecer el ejemplo
      setShowWelcome(true)
    }
  }, [])

  // Reset completo del state a defaults — usado por 'Crear nuevo proyecto'
  // en el modal de bienvenida.
  function nuevoProyecto() {
    if (!confirm('¿Crear proyecto nuevo? Se perderán los datos del borrador actual a menos que ya los hayas guardado en "📁 Proyectos".')) return
    setProy({ nombre: '', propietario: '', rutPropietario: '', direccion: '', rolAvaluo: '', arq: '', comuna: '', zona: '', uso: 'Vivienda', pisos: '2', superficie: '', destinoOGUC: '', estructura: '', estructuras: [], profesional: '', rutProfesional: '', titulo: '', rol: '', email: '', telefono: '', ocupantes: '' })
    setTermica({})
    setCalcUInit({})
    setFachadas([
      { id: 1, nombre: '', orient: 'N',  areaFachada: '', vanos: '', uw: '' },
      { id: 2, nombre: '', orient: 'OP', areaFachada: '', vanos: '', uw: '' },
      { id: 3, nombre: '', orient: 'S',  areaFachada: '', vanos: '', uw: '' },
    ])
    setFachadasNextId(4)
    setPuertas([
      { id: 1, nombre: 'Acceso principal',      uso: 'acceso_vivienda', ancho: '0.90', alto: '2.00', hojaId: '', marcoId: '', selloId: '' },
      { id: 2, nombre: 'Acceso a patio/loggia', uso: 'acceso_vivienda', ancho: '0.80', alto: '2.00', hojaId: '', marcoId: '', selloId: '' },
    ])
    setPuertasNextId(3)
    setEscaleras({ incluido: false, matId: 'ha', tieneCaja: null, matCajaId: 'ha' })
    setNotas({})
    setDetallesIlustrados([])
    setProyectoActual(null)
    setHasUnsaved(false)
    setEsDemo(false)
    setShowWelcome(false)
  }

  // Carga un proyecto de ejemplo completo (vivienda tipo) para explorar la app.
  // Datos realistas pero ficticios. termica/calcUInit quedan vacíos a propósito:
  // así el usuario practica aplicando soluciones en Soluciones y Cálculo U.
  function cargarDemo() {
    setProy({
      nombre: 'Casa Ejemplo — Vivienda unifamiliar', propietario: 'Juana Pérez (demo)', rutPropietario: '12.345.678-9',
      direccion: 'Av. Alemania 1234, Temuco', rolAvaluo: '1234-56', arq: '',
      comuna: 'Temuco', zona: 'F', uso: 'Vivienda', pisos: '2', superficie: '95',
      destinoOGUC: '', estructura: '', estructuras: [],
      profesional: 'Arq. María González (demo)', rutProfesional: '9.876.543-2', titulo: 'Arquitecta',
      rol: '', email: 'demo@talora.cl', telefono: '+56 9 1234 5678', ocupantes: '4',
      configEnergetica: { comunaKey: 'temuco', zonaClima: 'F', tipoProyecto: 'casa' },
    })
    setTermica({})
    setCalcUInit({})
    setFachadas([
      { id: 1, nombre: 'Frente (Norte)',    orient: 'N', areaFachada: '28', vanos: '6.5', uw: '2.4' },
      { id: 2, nombre: 'Posterior (Sur)',   orient: 'S', areaFachada: '28', vanos: '4.0', uw: '2.4' },
      { id: 3, nombre: 'Lateral (Oriente)', orient: 'E', areaFachada: '22', vanos: '3.0', uw: '2.4' },
      { id: 4, nombre: 'Lateral (Poniente)',orient: 'O', areaFachada: '22', vanos: '2.5', uw: '2.4' },
    ])
    setFachadasNextId(5)
    setPuertas([
      { id: 1, nombre: 'Acceso principal',      uso: 'acceso_vivienda', ancho: '0.90', alto: '2.00', hojaId: '', marcoId: '', selloId: '' },
      { id: 2, nombre: 'Acceso a patio/loggia', uso: 'acceso_vivienda', ancho: '0.80', alto: '2.00', hojaId: '', marcoId: '', selloId: '' },
    ])
    setPuertasNextId(3)
    setEscaleras({ incluido: false, matId: 'ha', tieneCaja: null, matCajaId: 'ha' })
    setNotas({})
    setDetallesIlustrados([])
    setProyectoActual(null)
    setEsDemo(true)
    setShowWelcome(false)
    setTab(0)
  }

  // Auto-save debounced (1.5s after last change)
  // Snapshot extendido: incluye puertas, puertasNextId y escaleras para
  // persistir el módulo de Puertas y el state de Escaleras de evacuación.
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      proyectos.autoGuardar({ proy, termica, calcUInit, fachadas, fachadasNextId, puertas, puertasNextId, escaleras, notas, detallesIlustrados })
      setHasUnsaved(true)
    }, 1500)
    return () => clearTimeout(autoSaveTimer.current)
  }, [proy, termica, calcUInit, fachadas, fachadasNextId, puertas, puertasNextId, escaleras, notas, detallesIlustrados])

  // Callback que llama TabResultados antes de generar el informe.
  // El informe PDF es un beneficio del Plan Pro, no un consumible por token.
  // La vista previa nunca llega aquí — TabResultados llama onExportar
  // solo en modo 'export' (línea 7039), nunca en modo 'preview'.
  async function onExportar() {
    if (isPro(perfil)) {
      // Trial (beta): aviso INFORMATIVO una vez por sesión — no bloquea, el
      // informe se genera igual. Mantiene visible el precio referencial para
      // el sondeo de valor. Los Pro de pago no ven este aviso.
      if (estaEnTrial(perfil) && !sessionStorage.getItem('nc_aviso_trial_informe')) {
        sessionStorage.setItem('nc_aviso_trial_informe', '1')
        const dias = diasRestantesTrial(perfil)
        alert(
          'ℹ MODO PRUEBA ACTIVO' + (dias != null ? ` — ${dias} días restantes` : '') + '\n\n' +
          'Estás generando informes con el Plan Pro liberado durante la beta.\n' +
          'Al finalizar, este beneficio será parte del Plan Pro:\n' +
          '$24.990/mes + IVA (precio de lanzamiento referencial).\n\n' +
          'Tu opinión sobre el precio nos ayuda a definirlo:\n' +
          'contacto@talora.cl\n\n' +
          'El informe se generará ahora sin costo.'
        )
      }
      return true   // Pro/trial: genera sin fricción
    }

    // Free: mostrar bloqueo con opción de upgrade. Durante la beta el precio es
    // referencial (sondeo de valor); el cobro real se activa al cerrar la beta.
    const upgradeUrl = 'mailto:contacto@talora.cl?subject=Activar Plan Pro'
    const ir = window.confirm(
      'Generar el informe PDF completo requiere el Plan Pro.\n\n' +
      '✓ Informes ilimitados listos para expediente DOM\n' +
      '✓ Análisis económico con payback y VAN\n' +
      '✓ Módulo energético CEV completo\n' +
      '✓ Escantillones automáticos de uniones\n\n' +
      'Plan Pro: $24.990/mes + IVA (precio de lanzamiento referencial).\n' +
      'Estamos en beta: tu opinión sobre el precio nos ayuda a definirlo.\n\n' +
      '¿Escribirnos para activar el Plan Pro?'
    )
    if (ir) window.open(upgradeUrl, '_blank')
    return false
  }

  // Snapshot completo del proyecto — usado por ProjectManager para guardar
  // proyectos y cargarlos en otra sesión. Incluye puertas + escaleras desde
  // 2026-05-27 (antes esos módulos perdían sus datos al recargar).
  function getData() {
    return { proy, termica, calcUInit, fachadas, fachadasNextId, puertas, puertasNextId, escaleras, notas, detallesIlustrados }
  }

  function onCargar(data) {
    if (data.proy)               setProy(data.proy)
    if (data.termica)            setTermica(data.termica)
    if (data.calcUInit)          setCalcUInit(data.calcUInit)
    if (data.fachadas)           setFachadas(data.fachadas)
    if (data.fachadasNextId)     setFachadasNextId(data.fachadasNextId)
    if (data.puertas)            setPuertas(data.puertas)
    if (data.puertasNextId)      setPuertasNextId(data.puertasNextId)
    if (data.escaleras)          setEscaleras(data.escaleras)
    if (data.notas)              setNotas(data.notas)
    if (data.detallesIlustrados) setDetallesIlustrados(data.detallesIlustrados)
    setHasUnsaved(false)
  }

  function onAplicar(sc, targetId = null, mod = null) {
    const elem = sc.elem === 'techumbre' ? 'techo' : sc.elem
    const { ev: _ev, ...scClean } = sc
    // ── Modificación del simulador de capas (engrosar aislante, agregar capas…) ─
    //   Si viene `mod` para esta misma solución, se aplica la U recalculada y las
    //   capas modificadas en vez del valor certificado original (sc.u).
    const { isMod, u: uApplied } = resolverAplicacionSC(sc, mod)
    // ── Inyección explícita de atributos Térmica + Fuego + Acústica ──────────
    //   u    : valor térmico U (W/m²K)   — siempre presente en SC
    //   rf   : resistencia al fuego (F15/F30/F60/...)   — usado por TabFuego y PDF
    //   rw   : acústica Rw (dB)                          — usado por TabAcustica y PDF
    //   ac_rw: alias numérico para generadores que lo leen directo del catálogo
    //   solucion: snapshot completo de la fila SC (para poder reconstruir todo)
    const rfVal   = sc.rf ? String(sc.rf) : ''
    const rwVal   = sc.ac_rw ? String(sc.ac_rw) : ''
    const acRwNum = sc.ac_rw != null ? sc.ac_rw : null
    const solucionSnap = isMod
      ? { ...scClean, u: uApplied, modificada: true, uOriginal: sc.u }
      : scClean
    const solData = {
      u:       String(uApplied),
      rf:      rfVal,
      rw:      rwVal,
      ac_rw:   acRwNum,
      solucion: solucionSnap,
    }

    // ── Helper compartido: construir capas para el panel Cálculo U ──────────────
    function buildCalcUCapas() {
      // PDA: usar las capas estructuradas curadas (int→ext, con λ/μ) para el
      // desglose + Glaser. La U OFICIAL (sc.u) manda; el cálculo es análisis.
      if (sc.esPDA && sc.capasStruct?.length) {
        return sc.capasStruct.map(c => ({
          id: Date.now() + Math.random(),
          mat: c.mat, lam: c.esCamara ? '' : String(c.lam ?? ''), esp: String(c.esp),
          mu: c.esCamara ? '' : String(c.mu ?? '1'), esCamara: !!c.esCamara,
        }))
      }
      const rawCapas = buildCapas(sc.cod)
      const bhItem   = BH.find(b => b.cod === sc.cod)
      if (rawCapas?.length) {
        return rawCapas.map(c => ({
          id: Date.now() + Math.random(),
          mat: c.name || c.mat || '', lam: String(c.lam || ''), esp: String(c.esp || ''), mu: String(c.mu || '1'), esCamara: !!c.esCamara,
        }))
      }
      if (bhItem?.capas?.length) {
        return bhItem.capas.map(c => ({
          id: Date.now() + Math.random(),
          mat: c.n || '', lam: String(c.lam || ''), esp: String(c.esp || ''), mu: String(c.mu || '1'), esCamara: !!c.esCamara,
        }))
      }
      // Fallback: parsear cadena "H.A. 150 | EPS 60 | ..."
      const parsed = (sc.capas || '').split(' | ').map(part => {
        const m = part.trim().match(/^(.*?)\s+([\d.]+)$/)
        if (!m) return null
        const nombre = m[1].trim()
        const isCamara = /camara|aire/i.test(nombre)
        const matDat = ALL_MATS.find(x => x.n.toLowerCase() === nombre.toLowerCase()) || {}
        return {
          id: Date.now() + Math.random(),
          mat: nombre,
          lam: isCamara ? '' : String(matDat.lam || ''),
          esp: m[2],
          mu: isCamara ? '' : String(matDat.mu || '1'),
          esCamara: isCamara,
        }
      }).filter(Boolean)
      return parsed.length ? parsed : null
    }

    if (targetId) {
      // Asignar solución a un sistema estructural específico
      setProy(p => ({
        ...p,
        estructuras: (p.estructuras || []).map(e =>
          e.id === targetId
            ? { ...e, soluciones: { ...(e.soluciones || {}), [elem]: solData } }
            : e
        ),
      }))
      // También propagar a `termica[elem]` para que las pestañas Fuego / Acústica
      // y el generador de PDF — que leen de termica — reciban rf, rw y solucion.
      setTermica(t => ({
        ...t,
        [elem]: { ...(t[elem] || {}), ...solData, rw: rwVal || (t[elem]?.rw || '') },
      }))
      // Pre-cargar capas con clave compuesta "estId::elemKey" → un panel propio en Cálculo U
      // LIMPIEZA: al pasar a modo per-sistema, eliminar la entry global stale y la
      // del MISMO sistema/elem (sobrescribir limpio, sin merge de correccionAplicada vieja).
      const calcUCapas = isMod && mod.capas?.length ? mod.capas : buildCalcUCapas()
      setCalcUInit(prev => {
        const next = { ...prev }
        delete next[elem]                       // eliminar global stale
        delete next[`${targetId}::${elem}`]     // eliminar entry previa de este mismo target+elem
        next[`${targetId}::${elem}`] = calcUCapas?.length
          ? { capas: calcUCapas, elem: sc.elem, solucion: { cod: sc.cod, desc: sc.desc, obs: sc.obs, u: uApplied, rf: rfVal, ac_rw: acRwNum, esPDA: !!sc.esPDA, uOficial: sc.esPDA ? sc.u : undefined } }
          : null
        return next
      })
      return
    }

    // Asignación global (sin sistema estructural específico)
    setTermica(t => ({
      ...t,
      [elem]: { ...t[elem], ...solData, rw: rwVal || (t[elem]?.rw || '') },
    }))
    // LIMPIEZA: al pasar a modo global, eliminar todas las entries per-sistema stale
    // para este elemento ("*::elem") + sobrescribir la entry global limpia (no merge).
    const calcUCapas = isMod && mod.capas?.length ? mod.capas : buildCalcUCapas()
    setCalcUInit(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => {
        if (k.endsWith('::' + elem)) delete next[k]
      })
      next[elem] = calcUCapas?.length
        ? { capas: calcUCapas, elem: sc.elem, solucion: { cod: sc.cod, desc: sc.desc, obs: sc.obs, u: uApplied, rf: rfVal, ac_rw: acRwNum, esPDA: !!sc.esPDA, uOficial: sc.esPDA ? sc.u : undefined } }
        : null
      return next
    })
    setTab(2)
  }

  function onEnviarCalcU(data) {
    const key = data.elem === 'techumbre' ? 'techo' : (data.elem || 'muro')
    setCalcUInit(prev => ({ ...prev, [key]: data }))
    setTab(5)
  }

  function onLimpiarCalcU(elemKey) {
    setCalcUInit(prev => ({ ...prev, [elemKey]: null }))
  }

  function onCalcUChange(elemKey, { capas, res, correccionAplicada, limpiarCorreccion }) {
    // Actualizar calcUInit con las capas modificadas y el resultado calculado.
    // Así exportarInforme y los checks siempre usan el U más reciente del usuario.
    setCalcUInit(prev => {
      const base = { ...(prev[elemKey] || {}), capas, res }
      if (limpiarCorreccion) {
        // "Volver a la solución original": descartar la corrección registrada
        // para que el informe deje de listarla como aplicada.
        delete base.correccionAplicada
      } else if (correccionAplicada) {
        base.correccionAplicada = correccionAplicada
      } // else: preservar la previa (ya viene en base por el spread) — caso:
        // el usuario editó capas tras aplicar una corrección.
      return { ...prev, [elemKey]: base }
    })
  }

  return (
    <div style={S.app} className={`nc-app${showAyuda ? ' nc-has-sidebar' : ''}`}>
      <div style={S.header} className="nc-header">
        {/* Logo Talora */}
        <img src="/logo-lockup-light.svg" alt="Talora" style={{ height: 40, width: 'auto', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }} className="nc-header-subtitle">DS N°15 · OGUC Título 4 · NCh853 · NCh1973 · NCh352 · LOSCAT Ed.13 2025</div>
          <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2, fontFamily: 'monospace' }} title="Versión del build">build {typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : ''}·{typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : 'dev'}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <ModeSwitcher mode={appMode} onChange={setAppMode} perfil={perfil} />
        </div>
        {proy.zona && (
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12 }} className="nc-header-info">
            Zona {proy.zona} — {proy.uso || 'sin uso'} {proy.nombre && `| ${proy.nombre}`}
          </div>
        )}
        <button
          onClick={() => setShowProjects(true)}
          style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
        >
          📁 Proyectos {hasUnsaved && proyectoActual && <span style={{ background:'#f59e0b', borderRadius:10, padding:'1px 6px', fontSize:10 }}>●</span>}
        </button>
        <ThemePicker theme={theme} onChange={setTheme} />
        <div style={{ marginLeft: 4 }}>
          <UserHeader onFeedback={() => setShowFeedback(true)} />
        </div>
      </div>
      {exportError && (
        <div style={{ background: '#fef2f2', borderBottom: '2px solid #fca5a5', padding: '10px 20px', color: '#991b1b', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
          ⚠️ {exportError}
        </div>
      )}
      {showFeedbackBanner && (
        <div style={{ background:'#f0fdfa', borderBottom:'2px solid #99f6e4', padding:'10px 20px', display:'flex', alignItems:'center', gap:12, fontSize:13, flexWrap:'wrap' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>📬</span>
          <span style={{ flex:1, minWidth:200, color:'#115e59' }}>
            <b>¿Tienes dudas, encontraste un error o quieres sugerir algo?</b> Ahora puedes escribirnos directo desde la app — leemos todos los mensajes. También lo encuentras en el menú de tu usuario.
          </span>
          <button
            onClick={() => { dismissFeedbackBanner(); setShowFeedback(true) }}
            style={{ background:'#0d9488', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontWeight:700, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
          >
            Enviar un mensaje
          </button>
          <button
            onClick={dismissFeedbackBanner}
            title="No volver a mostrar"
            style={{ background:'transparent', border:'none', color:'#64748b', fontSize:18, cursor:'pointer', padding:'0 4px', flexShrink:0, lineHeight:1 }}
          >
            ✕
          </button>
        </div>
      )}
      <div style={{ ...S.tabs, alignItems: 'center' }} className="nc-tabs">
        {appMode === 'normativo'
          ? TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)
          : ENERG_TABS.map((t, i) => <button key={t} style={S.tab(energTab === i)} onClick={() => setEnergTab(i)}>{t}</button>)
        }
        {appMode === 'normativo' && ayudaData[tab] && (
          <button
            className="nc-sidebar-btn"
            onClick={() => setShowAyuda(v => !v)}
            style={{
              marginLeft: 'auto', marginBottom: 2, padding: '5px 11px',
              background: showAyuda ? '#ccfbf1' : '#f0fdfa',
              border: `1px solid ${showAyuda ? '#5eead4' : '#99f6e4'}`,
              borderRadius: 6, fontSize: 11, fontWeight: 700,
              color: '#0e6560', cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span>ℹ</span>
            {showAyuda ? 'Ocultar guía' : 'Ver guía'}
          </button>
        )}
      </div>
      <div style={S.body} className="nc-body">
        {appMode === 'energetico' ? (
          // ── Módulo Energético ──────────────────────────────────────────
          <div className="nc-content">
            {energTab === 0 && (
              <EnergeticoHome
                perfil={perfil}
                proy={proy}
                onIrAConfig={() => setEnergTab(1)}
              />
            )}
            {energTab === 1 && (
              <EnergeticoConfig
                proy={proy}
                onChangeProy={setProy}
              />
            )}
            {energTab === 2 && (
              <PaywallGate perfil={perfil} feature="Demanda energética anual">
                <DemandaAnual
                  proy={proy}
                  calcUInit={calcUInit}
                  fachadas={fachadas}
                  inventarioPT={inventarioPT}
                />
              </PaywallGate>
            )}
            {energTab === 3 && (
              <Detalles
                proy={proy}
                calcUInit={calcUInit}
                perfil={perfil}
                inventarioPT={inventarioPT}
                setInventarioPT={setInventarioPT}
              />
            )}
            {energTab === 4 && (
              <Renovables
                proy={proy}
                calcUInit={calcUInit}
                perfil={perfil}
              />
            )}
            {energTab === 5 && (
              <PaywallGate perfil={perfil} feature="Informe Ejecutivo + CEV">
                <InformeEjecutivo
                  proy={proy}
                  calcUInit={calcUInit}
                  fachadas={fachadas}
                />
              </PaywallGate>
            )}
          </div>
        ) : (
          // ── Módulo Normativo (original) ────────────────────────────────
          <div className={showAyuda && ayudaData[tab] ? 'nc-with-sidebar' : ''}>
            <div className="nc-content">
              {tab === 0 && (
                <div>
                  <TabDiag proy={proy} setProy={setProy} getLetraOGUC={getLetraOGUC_loaded} termica={termica} setTermica={setTermica} plantillas={PLANTILLAS_USO} />
                  <div style={{ padding: '0 16px 16px' }}>
                    <NotasPanel tabKey="diagnostico" notas={notas} setNotas={setNotas} />
                  </div>
                </div>
              )}
              {tab === 1 && <TabSoluciones proy={proy} setProy={setProy} onAplicar={onAplicar} onEnviarCalcU={onEnviarCalcU} notas={notas} setNotas={setNotas} />}
              {tab === 2 && <TabTermica proy={proy} termica={termica} setTermica={setTermica} setTab={setTab} notas={notas} setNotas={setNotas} />}
              {tab === 3 && <TabFuego proy={proy} termica={termica} setTermica={setTermica} notas={notas} setNotas={setNotas} getLetraOGUC={getLetraOGUC_loaded} getRFDeLetra={getRFDeLetra_loaded} ogucData={ogucDataReady} escaleras={escaleras} setEscaleras={setEscaleras} />}
              {tab === 4 && <TabAcustica proy={proy} termica={termica} setTermica={setTermica} notas={notas} setNotas={setNotas} />}
              {tab === 5 && <TabCalcU proy={proy} initData={calcUInit} onLimpiarCalcU={onLimpiarCalcU} onCalcUChange={onCalcUChange} notas={notas} setNotas={setNotas} perfil={perfil} />}
              {tab === 6 && <TabVentana proy={proy} fachadas={fachadas} setFachadas={setFachadas} fachadasNextId={fachadasNextId} setFachadasNextId={setFachadasNextId} notas={notas} setNotas={setNotas} />}
              {tab === 7 && <TabPuerta proy={proy} puertas={puertas} setPuertas={setPuertas} puertasNextId={puertasNextId} setPuertasNextId={setPuertasNextId} notas={notas} setNotas={setNotas} />}
              {tab === 8 && <TabDetalles proy={proy} termica={termica} calcUInit={calcUInit} notas={notas} setNotas={setNotas} detallesIlustrados={detallesIlustrados} setDetallesIlustrados={setDetallesIlustrados} />}
              {tab === 9 && <TabResultados proy={proy} termica={termica} onExportar={onExportar} notas={notas} setNotas={setNotas} calcUInit={calcUInit} fachadas={fachadas} puertas={puertas} escaleras={escaleras} modulosInforme={modulosInforme} setModulosInforme={setModulosInforme} getRFOGUC={getRFOGUC_loaded} getLetraOGUC={getLetraOGUC_loaded} getRFDeLetra={getRFDeLetra_loaded} ogucData={ogucDataReady} detallesIlustrados={detallesIlustrados} />}
              {tab === 10 && <AdminPanel onOverridesChanged={() => window.dispatchEvent(new Event('oguc:zonas-updated'))} />}
            </div>
            {showAyuda && ayudaData[tab] && (
              <div className="nc-sidebar">
                <AyudaPanel {...ayudaData[tab]} alwaysOpen />
              </div>
            )}
          </div>
        )}
      </div>
      <ProjectManager
        open={showProjects}
        onClose={() => setShowProjects(false)}
        proyectoActual={proyectoActual}
        setProyectoActual={setProyectoActual}
        getData={getData}
        onCargar={onCargar}
        proyectos={proyectos}
      />

      {showFeedback && <FeedbackForm onClose={() => setShowFeedback(false)} />}

      {/* ── Modal de bienvenida ────────────────────────────────────────────
          Aparece al cargar la app si hay un borrador autoguardado con
          contenido. 3 opciones: continuar borrador / abrir guardado / nuevo. */}
      {esDemo && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9000, background:'#0f766e', color:'#fff', padding:'8px 16px', display:'flex', alignItems:'center', gap:12, fontSize:13, boxShadow:'0 2px 8px rgba(0,0,0,0.25)', flexWrap:'wrap' }}>
          <span style={{ fontWeight:700 }}>📘 Proyecto de ejemplo</span>
          <span style={{ opacity:0.92, flex:1, minWidth:180 }}>Explóralo libremente: el Diagnóstico, las Ventanas y Puertas ya traen datos. Prueba Soluciones y Cálculo U. Ningún dato es real.</span>
          <button onClick={() => { setEsDemo(false); setProy(p => ({ ...p, nombre: '' })) }} style={{ background:'#fff', color:'#0f766e', border:'none', borderRadius:6, padding:'5px 12px', fontWeight:700, cursor:'pointer', fontSize:12, whiteSpace:'nowrap' }}>Crear mi proyecto a partir de este</button>
          <button onClick={() => setEsDemo(false)} style={{ background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,0.5)', borderRadius:6, padding:'5px 10px', cursor:'pointer', fontSize:12 }}>Cerrar</button>
        </div>
      )}

      {showWelcome && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowWelcome(false) }}
          style={{
            position:'fixed', inset:0, background:'rgba(15,23,42,0.7)', zIndex:10000,
            display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
          }}
        >
          <div style={{
            background:'#fff', borderRadius:12, padding:'28px 24px', maxWidth:520, width:'100%',
            boxShadow:'0 20px 50px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize:14, color:'#0f766e', fontWeight:700, marginBottom:4 }}>
              👋 Bienvenido a Talora
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:'#1e293b', marginBottom:8 }}>
              ¿Cómo quieres empezar?
            </div>
            <div style={{ fontSize:12, color:'#64748b', marginBottom:18, lineHeight:1.5 }}>
              {proy.nombre
                ? <>Detectamos un <b>borrador autoguardado</b> del proyecto <b style={{ color:'#1e293b' }}>"{proy.nombre}"</b>. Puedes continuar donde quedaste, ver un ejemplo, abrir otro proyecto o empezar uno nuevo.</>
                : <>¿Es tu primera vez? Te recomendamos <b>ver el proyecto de ejemplo</b> para conocer cómo funciona cada módulo. También puedes abrir un proyecto guardado o crear uno nuevo.</>}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {proy.nombre && (
              <button
                onClick={() => setShowWelcome(false)}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
                  background:'#0e6560', color:'#fff', border:'none', borderRadius:8,
                  cursor:'pointer', fontSize:13, fontWeight:700, textAlign:'left',
                }}
              >
                <span style={{ fontSize:18 }}>↩</span>
                <div style={{ flex:1 }}>
                  <div>Continuar borrador autoguardado</div>
                  <div style={{ fontSize:10, opacity:0.85, fontWeight:400, marginTop:2 }}>
                    Retoma exactamente donde dejaste el proyecto.
                  </div>
                </div>
              </button>
              )}

              <button
                onClick={cargarDemo}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
                  background:'#f0fdf4', color:'#166534', border:'1.5px solid #bbf7d0', borderRadius:8,
                  cursor:'pointer', fontSize:13, fontWeight:700, textAlign:'left',
                }}
              >
                <span style={{ fontSize:18 }}>📘</span>
                <div style={{ flex:1 }}>
                  <div>Ver proyecto de ejemplo</div>
                  <div style={{ fontSize:10, color:'#64748b', fontWeight:400, marginTop:2 }}>
                    Carga una vivienda tipo con datos para explorar cómo funciona cada módulo.
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setShowWelcome(false); setShowProjects(true) }}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
                  background:'#fff', color:'#0f766e', border:'1.5px solid #99f6e4', borderRadius:8,
                  cursor:'pointer', fontSize:13, fontWeight:700, textAlign:'left',
                }}
              >
                <span style={{ fontSize:18 }}>📁</span>
                <div style={{ flex:1 }}>
                  <div>Abrir proyecto guardado</div>
                  <div style={{ fontSize:10, color:'#64748b', fontWeight:400, marginTop:2 }}>
                    Lista todos tus proyectos en la nube y abre el que necesites.
                  </div>
                </div>
              </button>

              <button
                onClick={nuevoProyecto}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
                  background:'#fff', color:'#9a3412', border:'1.5px solid #fed7aa', borderRadius:8,
                  cursor:'pointer', fontSize:13, fontWeight:700, textAlign:'left',
                }}
              >
                <span style={{ fontSize:18 }}>＋</span>
                <div style={{ flex:1 }}>
                  <div>Crear proyecto nuevo (limpio)</div>
                  <div style={{ fontSize:10, color:'#64748b', fontWeight:400, marginTop:2 }}>
                    Empiezas desde cero. Se descarta el borrador actual.
                  </div>
                </div>
              </button>
            </div>

            <div style={{ marginTop:14, fontSize:10, color:'#94a3b8', textAlign:'center' }}>
              Tip: el botón <b>📁 Proyectos</b> arriba siempre está disponible para gestionar tus proyectos.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
