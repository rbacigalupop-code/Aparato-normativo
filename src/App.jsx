import React, { useState, useMemo, useEffect, useRef, forwardRef } from 'react'
import TokenGate, { useToken } from './TokenGate.jsx'
import { usarProyecto } from './supabase.js'
import { AyudaPanel } from './components/Ayuda.jsx'
import NotasPanel from './NotasPanel.jsx'
import {
  ZONAS, COMUNAS_ZONA, TIPOS, ESTRUCTURAS,
  RF_DEF, RF_EST, AC_DEF, AC_IMPACT_DEF, RIESGO_INC, RF_PISOS, RF_ELEM_REQ, OBS_EST, CATEG_FUEGO,
  OGUC_RF_LETRAS, OGUC_TABLA1, OGUC_ELEM_COL, USO_TO_OGUC, getLetraOGUC, getRFDeLetra, getRFOGUC,
  ACERO_PROT, PERFILES_ACERO,
  ALL_MATS, RSI_MAP, RSE_MAP, RCAMARA,
  SC, BH, SC_CAPAS, VIDRIOS, MARCOS,
  VPCT, PERM_V, PUERTA_U, PUERTA_P, PUERTA_RF, SOBR_R, INFILT,
  REC_USO, ELEM_NORM, SUBGRUPOS_PUERTA,
  calcU_SC, buildCapas, rfN, colSem, ist,
  calcGlaser, generarCorrecciones,
  calcU_ISO6946, STRUCT_MATS,
  getUIdx, MATS
} from './data.js'
import TabDiag from './modules/TabDiag.jsx'
import AdminZonas from './modules/AdminZonas.jsx'
import AdminTokens from './modules/AdminTokens.jsx'
import { useProjects } from './useProjects.js'
import ProjectManager from './ProjectManager.jsx'

// ─── helpers de estilo ─────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: 'system-ui,sans-serif', fontSize: 13, color: '#1e293b', minHeight: '100vh', background: '#f1f5f9' },
  header: { background: 'linear-gradient(135deg,#1e40af,#0369a1)', color: '#fff', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12 },
  tabs: { display: 'flex', gap: 2, background: '#e2e8f0', padding: '4px 8px 0', flexWrap: 'wrap' },
  tab: (a) => ({ padding: '7px 14px', border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontSize: 12, fontWeight: a ? 700 : 400, background: a ? '#fff' : 'transparent', color: a ? '#1e40af' : '#64748b' }),
  body: { padding: 16, maxWidth: 1100, margin: '0 auto' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 12 },
  row: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' },
  col: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, color: '#64748b', fontWeight: 600 },
  input: { ...ist, width: 160 },
  sel: { ...ist, width: 180 },
  btn: (c = '#1e40af') => ({ background: c, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }),
  badge: (ok) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#991b1b' }),
  warn: { background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, padding: '8px 12px', fontSize: 12 },
  err: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991b1b' },
  ok: { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#166534' },
  h2: { fontSize: 15, fontWeight: 700, color: '#1e40af', marginBottom: 8, marginTop: 0 },
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
// ─── FICHA SC — VISOR GRÁFICO ─────────────────────────────────────────────────
function capasParaSC(s) {
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
  if (n.includes('camara') || n.includes('aire')) return { fill: '#e0f2fe', stroke: '#7dd3fc', pat: 'air' }
  if (n.includes('barrera') || n.includes('membrana') || n.includes('polietileno')) return { fill: '#ede9fe', stroke: '#a78bfa', pat: 'mem' }
  if (n.includes('h.a') || n.includes('ha ') || n.includes('hormig') || n.includes('gravilla') || n.includes('malla at') || n.includes('nervad') || n.includes('losa')) return { fill: '#cbd5e1', stroke: '#64748b', pat: 'conc' }
  if (n.includes('albanil') || n.includes('ladrillo') || n.includes('ceramica') || n.includes('bloque')) return { fill: '#fecaca', stroke: '#f87171', pat: 'brick' }
  if (n.includes('eps') || n.includes('xps') || n.includes('pu ') || n.includes('proy') || n.includes('lana') || n.includes('fibra') || n.includes('mineral') || n.includes('tiff') || n.includes('isop') || n.includes('sate') || n.includes('aislante')) return { fill: '#fef08a', stroke: '#f59e0b', pat: 'insul' }
  if (n.includes('madera') || n.includes('osb') || n.includes('clt') || n.includes('pino') || n.includes('lvl') || n.includes('contrachap') || n.includes('tablon') || n.includes('cercha') || n.includes('viga') || n.includes('mdf')) return { fill: '#fde68a', stroke: '#d97706', pat: 'wood' }
  if (n.includes('acero') || n.includes('zinc') || n.includes('galv')) return { fill: '#64748b', stroke: '#334155', pat: 'metal' }
  if (n.includes('fibrocemento') || n.includes('fibro')) return { fill: '#d1d5db', stroke: '#9ca3af', pat: 'fibrc' }
  if (n.includes('yeso') || n.includes('mortero') || n.includes('revoq') || n.includes('pasta') || n.includes('elastic') || n.includes('sto') || n.includes('mineral')) return { fill: '#f0fdf4', stroke: '#86efac', pat: 'plast' }
  if (n.includes('vidrio') || n.includes('dvh') || n.includes('tvh') || n.includes('marco')) return { fill: '#bae6fd', stroke: '#0ea5e9', pat: 'glass' }
  if (n.includes('corcho')) return { fill: '#fef9c3', stroke: '#fde047', pat: 'plain' }
  return { fill: '#f8fafc', stroke: '#cbd5e1', pat: 'plain' }
}

// ── Diagrama de sección constructiva para el informe (funciona con capas arbitrarias) ──
function capasSeccionSvgStr(capas, opts = {}) {
  if (!capas?.length) return ''
  const { titulo = 'Sección constructiva (int → ext)', uCalc, uMax, label = '' } = opts
  const W = 600, H = 290
  const PL = 44, PR = 12, PT = 46, PB = 110
  const gW = W - PL - PR, gH = H - PT - PB

  const nCam = capas.filter(c => c.esCamara).length
  const realEsp = capas.filter(c => !c.esCamara).reduce((a, c) => a + Math.max(parseFloat(c.esp || 0), 1), 0)
  const CAM_FRAC = Math.min(0.06, 0.35 / Math.max(nCam, 1))
  const realFrac = 1 - nCam * CAM_FRAC
  const rawW = capas.map(c => c.esCamara
    ? gW * CAM_FRAC
    : realEsp > 0 ? gW * realFrac * (Math.max(parseFloat(c.esp || 0), 1) / realEsp) : gW / capas.length)

  const defs = `<defs>
<pattern id="cs-insul" patternUnits="userSpaceOnUse" width="8" height="8"><line x1="0" y1="8" x2="8" y2="0" stroke="#f59e0b" stroke-width="1.5" opacity="0.55"/></pattern>
<pattern id="cs-conc"  patternUnits="userSpaceOnUse" width="8" height="8"><circle cx="2" cy="2" r="1.2" fill="#94a3b8" opacity="0.45"/><circle cx="6" cy="6" r="1.2" fill="#94a3b8" opacity="0.45"/></pattern>
<pattern id="cs-wood"  patternUnits="userSpaceOnUse" width="4" height="10"><line x1="0" y1="0" x2="4" y2="0" stroke="#d97706" stroke-width="1.2" opacity="0.45"/><line x1="0" y1="4" x2="4" y2="4" stroke="#d97706" stroke-width="0.7" opacity="0.3"/></pattern>
<pattern id="cs-brick" patternUnits="userSpaceOnUse" width="16" height="10"><rect x="0" y="0" width="16" height="10" fill="none" stroke="#f87171" stroke-width="0.8" opacity="0.5"/><line x1="8" y1="0" x2="8" y2="5" stroke="#f87171" stroke-width="0.8" opacity="0.5"/><line x1="0" y1="5" x2="16" y2="5" stroke="#f87171" stroke-width="0.8" opacity="0.5"/></pattern>
<pattern id="cs-air"   patternUnits="userSpaceOnUse" width="10" height="10"><circle cx="5" cy="5" r="1.5" fill="#7dd3fc" opacity="0.4"/></pattern>
<pattern id="cs-mem"   patternUnits="userSpaceOnUse" width="6" height="4"><line x1="0" y1="2" x2="6" y2="2" stroke="#a78bfa" stroke-width="2" opacity="0.6"/></pattern>
<pattern id="cs-metal" patternUnits="userSpaceOnUse" width="5" height="5"><line x1="0" y1="0" x2="5" y2="5" stroke="#334155" stroke-width="0.8" opacity="0.4"/></pattern>
</defs>`

  let xCur = PL
  const layerParts = capas.map((c, i) => {
    const w = rawW[i]
    const name = c.esCamara ? 'Cámara de aire' : (c.mat || c.name || c.n || '—')
    const col = fichaLayerColor(name)
    const patKey = ['insul','conc','wood','brick','air','mem','metal'].includes(col.pat) ? col.pat : null
    const mx = xCur + w / 2
    const espStr  = c.esCamara ? '' : `${Math.round(parseFloat(c.esp || 0))} mm`
    const lamStr  = c.esCamara ? '' : (parseFloat(c.lam) > 0 ? `λ=${parseFloat(c.lam).toFixed(3)}` : '')
    const Ri = c.esCamara ? 0.13 : (parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0 ? (parseFloat(c.esp)/1000)/parseFloat(c.lam) : 0)
    const rStr = Ri > 0 ? `R=${Ri.toFixed(3)}` : ''
    const shortN = name.length > 18 ? name.slice(0, 17) + '…' : name

    // Tick lines at top+bottom of layer block
    const tickT = `<line x1="${xCur.toFixed(1)}" x2="${xCur.toFixed(1)}" y1="${PT - 6}" y2="${PT}" stroke="#94a3b8" stroke-width="0.8"/>`
    const tickB = `<line x1="${xCur.toFixed(1)}" x2="${xCur.toFixed(1)}" y1="${PT+gH}" y2="${PT+gH+6}" stroke="#94a3b8" stroke-width="0.8"/>`
    // espesor label top, centrado
    const espLblT = w > 24 ? `<text x="${mx.toFixed(1)}" y="${PT - 8}" text-anchor="middle" font-size="8" fill="#1e293b" font-weight="700">${espStr}</text>` : ''
    // capa number badge
    const numBadge = `<rect x="${(mx - 6).toFixed(1)}" y="${(PT + 4).toFixed(1)}" width="12" height="12" rx="3" fill="${col.stroke}" opacity="0.85"/>
<text x="${mx.toFixed(1)}" y="${(PT + 13).toFixed(1)}" text-anchor="middle" font-size="8" fill="white" font-weight="bold">${i + 1}</text>`
    // λ and R inside block (only if wide enough)
    const lamLbl = (w > 44 && lamStr) ? `<text x="${mx.toFixed(1)}" y="${(PT + gH/2 + 4).toFixed(1)}" text-anchor="middle" font-size="8" fill="#374151">${lamStr}</text>` : ''
    const rLbl   = (w > 44 && rStr)   ? `<text x="${mx.toFixed(1)}" y="${(PT + gH/2 + 14).toFixed(1)}" text-anchor="middle" font-size="8" fill="#64748b">${rStr}</text>` : ''
    // Rotated label at bottom
    const lY = PT + gH + 14
    const nameLabel = `<text x="${mx.toFixed(1)}" y="${lY}" text-anchor="start" font-size="8.5" fill="#1e293b" font-weight="600"
      transform="rotate(40 ${mx.toFixed(1)} ${lY})">${shortN}</text>`

    const out = [
      `<rect x="${xCur.toFixed(1)}" y="${PT}" width="${w.toFixed(1)}" height="${gH}" fill="${col.fill}" stroke="${col.stroke}" stroke-width="1.2"/>`,
      patKey ? `<rect x="${xCur.toFixed(1)}" y="${PT}" width="${w.toFixed(1)}" height="${gH}" fill="url(#cs-${patKey})" stroke="none"/>` : '',
      tickT, tickB, espLblT, numBadge, lamLbl, rLbl, nameLabel,
    ].filter(Boolean).join('\n')
    xCur += w
    return out
  })
  // Closing tick at right edge
  const tickEnd = `<line x1="${(PL+gW).toFixed(1)}" x2="${(PL+gW).toFixed(1)}" y1="${PT-6}" y2="${PT}" stroke="#94a3b8" stroke-width="0.8"/>
<line x1="${(PL+gW).toFixed(1)}" x2="${(PL+gW).toFixed(1)}" y1="${PT+gH}" y2="${PT+gH+6}" stroke="#94a3b8" stroke-width="0.8"/>`

  const totalEsp = capas.filter(c => !c.esCamara).reduce((a, c) => a + parseFloat(c.esp || 0), 0)
  const cumpleU  = uMax && uCalc != null ? parseFloat(uCalc) <= uMax : null
  const uBadge   = uCalc != null ? `<text x="${W/2}" y="${H - 6}" text-anchor="middle" font-size="9" fill="${cumpleU === false ? '#dc2626' : '#166534'}" font-weight="700">
    U = ${parseFloat(uCalc).toFixed(4)} W/m²K${uMax ? ` — Límite DS N°15: ≤ ${uMax} W/m²K — ${cumpleU ? '✓ CUMPLE' : '✗ NO CUMPLE'}` : ''}</text>` : ''

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
${defs}
<rect width="${W}" height="${H}" fill="white" rx="6" stroke="#e2e8f0" stroke-width="1.5"/>
<text x="${W/2}" y="16" text-anchor="middle" font-size="10.5" fill="#1e40af" font-weight="700">${titulo}</text>
<text x="${W/2}" y="28" text-anchor="middle" font-size="8.5" fill="#64748b">${label} · ${capas.length} capas · Espesor total: ${totalEsp.toFixed(0)} mm</text>
<text x="${PL - 4}" y="${PT + gH/2 + 4}" text-anchor="end" font-size="9" fill="#475569" font-weight="700">INT</text>
<text x="${PL + gW + 4}" y="${PT + gH/2 + 4}" text-anchor="start" font-size="9" fill="#475569" font-weight="700">EXT</text>
<line x1="${PL}" y1="${PT-2}" x2="${PL}" y2="${PT+gH+2}" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="3,2"/>
<line x1="${PL+gW}" y1="${PT-2}" x2="${PL+gW}" y2="${PT+gH+2}" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="3,2"/>
${layerParts.join('\n')}
${tickEnd}
<rect x="${PL}" y="${H-22}" width="${gW}" height="14" fill="#f1f5f9" rx="2"/>
${uBadge}
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

function fichaScSvgStr(s, capas, opts = {}) {
  const W = 560, H = 270
  const PL = 38, PR = 38, PT = 38, PB = 96
  const gW = W - PL - PR, gH = H - PT - PB

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

  let xCur = PL
  const layerParts = capas.map((c, i) => {
    const w = rawW[i]
    const col = c.esCamara ? { fill: '#e0f2fe', stroke: '#7dd3fc', pat: 'air' } : fichaLayerColor(c.n || c.mat || c.name || '')
    const hasPat = ['insul', 'conc', 'wood', 'brick', 'air', 'mem', 'metal'].includes(col.pat)
    const mx = xCur + w / 2
    const name = c.esCamara ? 'Cámara' : (c.n || c.mat || c.name || '—')
    const espStr = c.esCamara ? '' : `${Math.round(parseFloat(c.esp || 0))} mm`
    const shortN = name.length > 16 ? name.slice(0, 15) + '…' : name
    const lY = PT + gH + 10
    const out = [
      `<rect x="${xCur.toFixed(1)}" y="${PT}" width="${w.toFixed(1)}" height="${gH}" fill="${col.fill}" stroke="${col.stroke}" stroke-width="1.2"/>`,
      hasPat ? `<rect x="${xCur.toFixed(1)}" y="${PT}" width="${w.toFixed(1)}" height="${gH}" fill="url(#fp-${col.pat})" stroke="none"/>` : '',
      w > 26 ? `<text x="${mx.toFixed(1)}" y="${(PT + gH / 2 + 4).toFixed(1)}" text-anchor="middle" font-size="${w > 40 ? 9 : 7}" fill="#1e293b" font-weight="bold">${espStr}</text>` : '',
      `<text x="${mx.toFixed(1)}" y="${lY}" text-anchor="start" font-size="8" fill="#374151" transform="rotate(38 ${mx.toFixed(1)} ${lY})">${shortN}</text>`,
    ].filter(Boolean).join('\n')
    xCur += w
    return out
  })

  const { uMax, rfReq, acReq } = opts
  const tOk = !uMax || s.u <= uMax
  const fOk = !rfReq || !s.rf || rfN(s.rf) >= rfN(rfReq)
  const aOk = !acReq || !s.ac_rw || s.ac_rw >= acReq
  const bY = H - 12, bg = W / 3
  const badges = [
    `<rect x="0" y="${H - 28}" width="${W}" height="28" fill="#f8fafc"/>`,
    `<line x1="0" y1="${H - 28}" x2="${W}" y2="${H - 28}" stroke="#e2e8f0" stroke-width="1"/>`,
    `<text x="${(bg * 0.5).toFixed(1)}" y="${bY}" text-anchor="middle" font-size="8.5" fill="${uMax ? (tOk ? '#166534' : '#dc2626') : '#374151'}" font-weight="700">🌡 Térmico: U=${s.u}${uMax ? ` ≤${uMax}` : ''} W/m²K ${uMax ? (tOk ? '✓' : '✗') : ''}</text>`,
    `<text x="${(bg * 1.5).toFixed(1)}" y="${bY}" text-anchor="middle" font-size="8.5" fill="${rfReq ? (fOk ? '#166534' : '#dc2626') : '#374151'}" font-weight="700">🔥 Fuego: RF ${s.rf || '—'}${rfReq ? ` ≥${rfReq}` : ''} ${rfReq ? (fOk ? '✓' : '✗') : ''}</text>`,
    `<text x="${(bg * 2.5).toFixed(1)}" y="${bY}" text-anchor="middle" font-size="8.5" fill="${acReq ? (aOk ? '#166534' : '#dc2626') : '#374151'}" font-weight="700">🔊 Acústico: Rw ${s.ac_rw != null ? s.ac_rw + ' dB' : '—'}${acReq ? ` ≥${acReq} dB` : ''} ${acReq ? (aOk ? '✓' : '✗') : ''}</text>`,
  ].join('\n')

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
${defs}
<rect width="${W}" height="${H}" fill="white" rx="6"/>
<text x="${W / 2}" y="18" text-anchor="middle" font-size="10.5" fill="#1e40af" font-weight="700">${s.cod || ''} — Sección constructiva (int → ext)</text>
<text x="${W / 2}" y="31" text-anchor="middle" font-size="8.5" fill="#64748b">${(s.desc || '').slice(0, 74)}${(s.desc || '').length > 74 ? '…' : ''}</text>
<text x="${PL - 4}" y="${PT + gH / 2 + 4}" text-anchor="end" font-size="9" fill="#475569" font-weight="600">INT</text>
<line x1="${PL}" y1="${PT - 2}" x2="${PL}" y2="${PT + gH + 2}" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="3,2"/>
<text x="${PL + gW + 4}" y="${PT + gH / 2 + 4}" text-anchor="start" font-size="9" fill="#475569" font-weight="600">EXT</text>
<line x1="${PL + gW}" y1="${PT - 2}" x2="${PL + gW}" y2="${PT + gH + 2}" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="3,2"/>
${layerParts.join('\n')}
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
        <div style={{ fontWeight: 700, fontSize: 11, color: '#1e40af', marginBottom: 4 }}>🌡 Módulo Térmico</div>
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
        <div style={{ fontWeight: 700, fontSize: 11, color: '#0369a1', marginBottom: 4 }}>🔊 Módulo Acústico</div>
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
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>
        📐 Ficha gráfica — {s.cod}
        <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8 }}>{capas.filter(c => !c.esCamara).length} capas · {totalEsp} mm total</span>
      </div>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}
        dangerouslySetInnerHTML={{ __html: svgStr }} />
      <FichaModuloCards s={s} uMax={uMax} rfReq={rfReq} acReq={acReq} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, fontSize: 9, color: '#64748b' }}>
        {[['#cbd5e1', 'Hormigón/HA'], ['#fecaca', 'Albañilería'], ['#fef08a', 'Aislante'], ['#fde68a', 'Madera/OSB'], ['#e0f2fe', 'Cámara aire'], ['#f0fdf4', 'Revoque/Yeso'], ['#64748b', 'Acero']].map(([c, l]) => (
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
const SimuladorCapas = React.memo(function SimuladorCapas({ s, elem, uMax, rfReq, acReq, proy, onEnviarCalcU }) {
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
      if (c.esCamara) { R += RCAMARA; continue }
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
      'FICHA DE SOLUCIÓN CONSTRUCTIVA — NormaCheck',
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
        ? '  [Cámara de aire]  R=0.18 m²K/W'
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
    if (c.esAislante) return '#bfdbfe'
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
        <span style={{ fontSize:12, fontWeight:700, color:'#1e40af' }}>
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
            {[['#bfdbfe','Aislante'],['#fecaca','Hormigón/Albanilería'],['#d1fae5','Revoque/Yeso'],['#fef3c7','Madera/Derivados'],['#f3f4f6','Otro']].map(([c,l]) => (
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
            <tr key={c.id} style={{ background:c.esAislante?'#eff6ff':'transparent' }}>
              <td style={cs}>{c.esAislante&&<span style={{ fontSize:9,color:'#1e40af',marginRight:3 }}>◆</span>}{c.esCamara?<i>Cámara de aire</i>:c.name}</td>
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
              <td style={cs}>{c.esCamara?RCAMARA.toFixed(2):(c.lam&&c.esp)?((parseFloat(c.esp)/1000)/parseFloat(c.lam)).toFixed(3):'—'}</td>
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
          {MATS.map(g=><optgroup key={g.g} label={g.g}>{g.items.map(m=><option key={m.n} value={m.n}>{m.n} (λ={m.lam})</option>)}</optgroup>)}
        </select>
        <input type="number" min={5} max={300} placeholder="mm" value={newEsp} onChange={e=>setNewEsp(e.target.value)}
          style={{ border:'1px solid #cbd5e1',borderRadius:5,padding:'4px 6px',fontSize:11,width:62 }}/>
        <button onClick={agregarCapa} disabled={!newMat||!newEsp}
          style={{ background:newMat&&newEsp?'#1e40af':'#e2e8f0',color:newMat&&newEsp?'#fff':'#94a3b8',border:'none',borderRadius:5,padding:'5px 12px',cursor:newMat&&newEsp?'pointer':'default',fontSize:11,fontWeight:600 }}>
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
  // targetSistema: null = global, id = estructura específica (local a esta pestaña)
  const [targetSistema, setTargetSistema] = useState(null)
  // catalogRef: para hacer scroll al catálogo cuando el usuario elige un slot
  const catalogRef = React.useRef(null)

  // Aplica la misma solución a TODOS los sistemas (útil para techo/piso de obra única)
  function onAplicarTodos(sc) {
    const e = sc.elem === 'techumbre' ? 'techo' : sc.elem
    const { ev: _ev, ...scClean } = sc
    const solData = { u: String(sc.u), rf: sc.rf || '', rw: sc.ac_rw ? String(sc.ac_rw) : '', solucion: scClean }
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

  // Sincronizar filtroSistema con proy.estructura al montar o cuando cambia
  useEffect(() => {
    if (proy.estructura && !filtroSistema) setFiltroSistema(proy.estructura)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proy.estructura])

  // ── Exigencias normativas según elemento ──────────────────────────────────
  // Térmica — DS N°15 MINVU Tabla 1 / Tabla 3
  const uMax =
    elem==='muro'      ? ZONAS[zona]?.muro   :
    elem==='techumbre' ? ZONAS[zona]?.techo  :
    elem==='piso'      ? ZONAS[zona]?.piso   :
    elem==='puerta'    ? PUERTA_U[zona]      : null

  // Resistencia al fuego — OGUC Art. 4.5.4 + RF_PISOS
  const rfReq =
    elem==='muro'      ? RF_PISOS(uso, pisos)          :
    elem==='tabique'   ? RF_DEF[uso]?.muros_sep ?? null :
    elem==='techumbre' ? RF_DEF[uso]?.cubierta  ?? null :
    elem==='piso'      ? RF_DEF[uso]?.estructura ?? null :
    elem==='puerta'    ? RF_DEF[uso]?.muros_sep ?? null : null

  // Acústica — NCh352 / OGUC Art. 4.1.6
  const acReq =
    (elem==='muro'||elem==='tabique'||elem==='puerta') ? AC_DEF[uso]?.entre_unidades ?? null :
    (elem==='techumbre'||elem==='piso')                ? AC_DEF[uso]?.entre_pisos    ?? null :
    elem==='ventana'                                   ? AC_DEF[uso]?.fachada        ?? null : null

  // ── Evaluación individual ─────────────────────────────────────────────────
  function evaluar(s) {
    // Blindaje: s.zonas debe ser string; s.usos debe ser array. Fallback defensivo.
    const aplica = (s.zonas || '').includes(zona) && (s.usos || []).includes(uso)
    const tOk = !uMax  || s.u <= uMax
    const fOk = !rfReq || !s.rf || rfN(s.rf) >= rfN(rfReq)
    const aOk = !acReq || !s.ac_rw || s.ac_rw >= acReq
    return { aplica, tOk, fOk, aOk, total: (tOk?1:0)+(fOk?1:0)+(aOk?1:0) }
  }

  // ── Lista ordenada ────────────────────────────────────────────────────────
  const soluciones = useMemo(() => {
    // evaluar inline para evitar closure stale (uMax/rfReq/acReq dependen de elem)
    const _uMax  = elem==='muro'      ? ZONAS[zona]?.muro   :
                   elem==='techumbre' ? ZONAS[zona]?.techo  :
                   elem==='piso'      ? ZONAS[zona]?.piso   :
                   elem==='puerta'    ? PUERTA_U[zona]      : null
    const _rfReq = elem==='muro'      ? RF_PISOS(uso, pisos)          :
                   elem==='tabique'   ? RF_DEF[uso]?.muros_sep ?? null :
                   elem==='techumbre' ? RF_DEF[uso]?.cubierta  ?? null :
                   elem==='piso'      ? RF_DEF[uso]?.estructura ?? null :
                   elem==='puerta'    ? RF_DEF[uso]?.muros_sep ?? null : null
    const _acReq = (elem==='muro'||elem==='tabique'||elem==='puerta') ? AC_DEF[uso]?.entre_unidades ?? null :
                   (elem==='techumbre'||elem==='piso')                 ? AC_DEF[uso]?.entre_pisos    ?? null :
                   elem==='ventana'                                    ? AC_DEF[uso]?.fachada        ?? null : null

    function ev(s) {
      const aplica = (s.zonas || '').includes(zona) && (s.usos || []).includes(uso)
      const tOk = !_uMax  || s.u <= _uMax
      const fOk = !_rfReq || !s.rf || rfN(s.rf) >= rfN(_rfReq)
      const aOk = !_acReq || !s.ac_rw || s.ac_rw >= _acReq
      return { aplica, tOk, fOk, aOk, total: (tOk?1:0)+(fOk?1:0)+(aOk?1:0) }
    }

    let list = SC.filter(s => s.elem === elem).map(s => ({ ...s, ev: ev(s) }))
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
  }, [elem, zona, uso, pisos, soloOk, orden, busqueda, filtroRF, filtroSistema])

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
          <div style={{ ...S.card, border:'1.5px solid #bfdbfe', background:'#f8faff' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <p style={{ ...S.h2, marginBottom:0, color:'#1e40af' }}>
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
                    <div style={{ fontWeight:800, fontSize:13, color: isActive ? '#166534' : '#1e40af' }}>
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
                              <div style={{ fontSize:11, fontWeight:700, color:'#1e40af' }}>{d.solucion?.cod}</div>
                              <div style={{ fontSize:10, color:'#374151', marginBottom:4, lineHeight:1.3 }}>{d.solucion?.desc}</div>
                              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
                                {d.u && <span style={{ fontSize:9, background:'#dbeafe', color:'#1e40af', borderRadius:3, padding:'1px 5px', fontWeight:700 }}>U {d.u}</span>}
                                {d.rf && <span style={{ fontSize:9, background:'#fee2e2', color:'#991b1b', borderRadius:3, padding:'1px 5px', fontWeight:700 }}>{d.rf}</span>}
                                {d.rw && <span style={{ fontSize:9, background:'#eff6ff', color:'#1d4ed8', borderRadius:3, padding:'1px 5px', fontWeight:700 }}>Rw {d.rw}dB</span>}
                              </div>
                              <div style={{ display:'flex', gap:4 }}>
                                <button
                                  onClick={() => {
                                    setTargetSistema(est.id)
                                    setElem(slot.catElem)
                                    setFiltroSistema(est.tipo)
                                    setTimeout(() => catalogRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 50)
                                  }}
                                  style={{ fontSize:10, color:'#1e40af', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:4, padding:'2px 7px', cursor:'pointer' }}>
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
                borderColor: elem===e ? '#1e40af' : '#cbd5e1',
                background: elem===e ? '#eff6ff' : '#fff',
                color: elem===e ? '#1e40af' : '#374151' }}>
              {ELEM_LABELS[e]}
              <span style={{ marginLeft:4, fontSize:10, color:'#94a3b8' }}>({SC.filter(s=>s.elem===e).length})</span>
            </button>
          ))}
        </div>

        {/* Exigencias calculadas */}
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'8px 14px', marginBottom:10, fontSize:11, display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
          <span><b>Exigencias {ELEM_LABELS[elem]}:</b></span>
          <span style={{ color: uMax ? '#1e40af' : '#94a3b8' }}>
            🌡 U {uMax ? `≤ ${uMax} W/m²K` : 'sin límite'}</span>
          <span style={{ color: rfReq ? '#dc2626' : '#94a3b8' }}>
            🔥 RF {rfReq ? `≥ ${rfReq}` : 'no aplica'}</span>
          <span style={{ color: acReq ? '#0369a1' : '#94a3b8' }}>
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
              borderColor: filtroSistema ? '#1e40af' : '#cbd5e1',
              color: filtroSistema ? '#1e40af' : '#94a3b8',
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
                      <span style={{ fontSize:10, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:4, padding:'1px 5px', color:'#1e40af' }}>
                        Homologable
                      </span>
                    )}
                    {!ev.aplica && (() => {
                      const faltaZona = !(s.zonas || '').includes(zona)
                      const faltaUso  = !(s.usos || []).includes(uso)
                      const msg = faltaZona && faltaUso ? `No aplica zona ${zona} ni uso ${uso}`
                               : faltaZona ? `No aplica zona ${zona} (aplica: ${(s.zonas || '').split('').join(', ')})`
                               : `No aplica uso ${uso}`
                      return (
                        <span title={msg} style={{ fontSize:10, background:'#f1f5f9', borderRadius:4, padding:'1px 5px', color:'#94a3b8', cursor:'help' }}>
                          Fuera de zona/uso ⓘ
                        </span>
                      )
                    })()}
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
                      T {ev.aplica ? (ev.tOk ? '✓' : '✗') : '–'} U={s.u}{uMax ? ` (≤${uMax})` : ''}
                    </span>
                    {/* Fuego — solo si hay exigencia */}
                    {rfReq && (
                      <span style={{
                        fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 8px',
                        color:      !ev.aplica ? '#94a3b8' : ev.fOk ? '#166534' : '#dc2626',
                        background: !ev.aplica ? '#f1f5f9' : ev.fOk ? '#dcfce7' : '#fee2e2',
                      }}>
                        F {ev.aplica ? (ev.fOk ? '✓' : '✗') : '–'} {s.rf || '—'}{` (≥${rfReq})`}
                      </span>
                    )}
                    {/* Acústica — solo si hay exigencia */}
                    {acReq && (
                      <span style={{
                        fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 8px',
                        color:      !ev.aplica ? '#94a3b8' : ev.aOk ? '#166534' : '#dc2626',
                        background: !ev.aplica ? '#f1f5f9' : ev.aOk ? '#dcfce7' : '#fee2e2',
                      }}>
                        A {ev.aplica ? (ev.aOk ? '✓' : '✗') : '–'} Rw {s.ac_rw ?? '—'}{acReq ? ` (≥${acReq}dB)` : ''}
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
                      background: selComp.find(x => x.cod === s.cod) ? '#1e40af' : '#f1f5f9',
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
                  <div style={{ fontSize:11, color:'#64748b', marginBottom:10 }}>
                    Zonas aplicables: {s.zonas || '—'} · Usos: {(s.usos || []).join(', ')}
                  </div>

                  {/* ── Alternativas LOSCAT cuando incumple ──────────────────── */}
                  {!ev.aplica && (
                    <div style={{ background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:6, padding:'10px 14px', marginBottom:10 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 }}>⚠ Fuera de zona/uso — Alternativas aplicables para {zona}/{uso}</div>
                      {SC.filter(x => x.elem===elem && (x.zonas || '').includes(zona) && (x.usos || []).includes(uso))
                        .map(x => ({ ...x, ev: evaluar(x) }))
                        .filter(x => x.ev.total===3)
                        .sort((a,b) => a.u - b.u)
                        .slice(0,4)
                        .map(x => (
                          <div key={x.cod} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:'1px solid #e2e8f0', fontSize:11 }}>
                            <span><b style={{ color:'#1e40af' }}>{x.cod}</b> — {x.desc}</span>
                            <span style={{ color:'#16a34a', fontWeight:700, whiteSpace:'nowrap', marginLeft:8 }}>U={x.u} RF={x.rf||'—'} Rw={x.ac_rw||'—'}</span>
                          </div>
                        ))}
                    </div>
                  )}

                  {ev.aplica && ev.total < 3 && (() => {
                    const alts = SC.filter(x => x.elem===elem && (x.zonas || '').includes(zona) && (x.usos || []).includes(uso) && x.cod!==s.cod)
                      .map(x => ({ ...x, ev: evaluar(x) })).filter(x => x.ev.total===3)
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
                              <div style={{ fontWeight:700, fontSize:11, color:'#1e40af' }}>{x.cod} — {x.desc}</div>
                              <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{x.capas}</div>
                            </div>
                            <div style={{ display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
                              <span style={{ fontSize:10, background:'#dcfce7', color:'#166534', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>U={x.u}</span>
                              {x.rf&&<span style={{ fontSize:10, background:'#fee2e2', color:'#991b1b', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>RF={x.rf}</span>}
                              {x.ac_rw&&<span style={{ fontSize:10, background:'#dbeafe', color:'#1e40af', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>Rw={x.ac_rw}dB</span>}
                              <button onClick={()=>onAplicar(x, targetSistema)}
                                style={{ background:'#166534', color:'#fff', border:'none', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                                Aplicar →
                              </button>
                              {targetSistema && (proy.estructuras?.length > 1) && (
                                <button onClick={()=>onAplicarTodos(x)}
                                  title="Aplicar a TODOS los sistemas"
                                  style={{ background:'#0369a1', color:'#fff', border:'none', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                                  Todos →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Ficha gráfica */}
                  <FichaSCCompleta s={s} uMax={uMax} rfReq={rfReq} acReq={acReq} />

                  {/* Simulador de capas — solo cuando hay datos BH o SC_CAPAS (evita la violación de hooks) */}
                  {(BH.some(b => b.cod === s.cod) || !!SC_CAPAS[s.cod]) && (
                    <SimuladorCapas
                      s={s} elem={elem}
                      uMax={uMax} rfReq={rfReq} acReq={acReq}
                      proy={proy}
                      onEnviarCalcU={onEnviarCalcU}
                    />
                  )}
                  <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button style={S.btn('#166534')} onClick={() => onAplicar(s, targetSistema)}>
                      {targetSistema ? `Aplicar a ${proy.estructuras?.find(e=>e.id===targetSistema)?.tipo?.split(' ')[0] || 'sistema'} →` : 'Aplicar al proyecto →'}
                    </button>
                    {/* Botón "Aplicar a todos" — cuando hay >1 sistema y se está asignando a uno */}
                    {targetSistema && (proy.estructuras?.length > 1) && (
                      <button
                        style={{ ...S.btn('#0369a1'), display:'flex', alignItems:'center', gap:6 }}
                        title={`Aplica esta solución de ${ELEM_LABELS[s.elem] || s.elem} a TODOS los sistemas del proyecto`}
                        onClick={() => onAplicarTodos(s)}
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
        <div style={{ position: 'sticky', bottom: 0, background: '#1e40af', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: '12px 12px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, flex: 1 }}>
            {selComp.length === 1 ? `"${selComp[0].desc?.substring(0,40)}..." seleccionada — elige una más` : `2 soluciones seleccionadas`}
          </span>
          {selComp.length === 2 && <button onClick={() => setShowComp(true)} style={{ background: '#fff', color: '#1e40af', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Ver comparación →</button>}
          <button onClick={() => setSelComp([])} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>✕ Limpiar</button>
        </div>
      )}

      {/* ── Modal comparador ──────────────────────────────────────────────────── */}
      {showComp && selComp.length === 2 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ background: '#1e40af', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Comparador de soluciones</span>
              <button onClick={() => setShowComp(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', width: '20%', color: '#64748b', fontSize: 11 }}>CAMPO</th>
                    {selComp.map((sc, i) => (
                      <th key={i} style={{ padding: '8px 12px', textAlign: 'left', background: i === 0 ? '#eff6ff' : '#f0fdf4', borderBottom: '2px solid #e2e8f0', color: i === 0 ? '#1e40af' : '#166534' }}>
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
                    <button onClick={() => { onAplicar(sc, targetSistema); setShowComp(false) }} style={{ flex: 1, minWidth:120, padding: '10px 0', background: i === 0 ? '#1e40af' : '#166534', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                      Usar {sc.cod}
                    </button>
                    {targetSistema && (proy.estructuras?.length > 1) && (
                      <button onClick={() => { onAplicarTodos(sc); setShowComp(false) }} style={{ flex: 1, minWidth:120, padding: '10px 0', background: '#0369a1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
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
  const uso = proy.uso || ''
  const set = (id, field, val) => setTermica(t => ({ ...t, [id]: { ...(t[id] || {}), [field]: val } }))

  const ELEMS = [
    { id:'muro',    label:'Muro',            umax: zona?.muro,  rfReq: RF_ELEM_REQ('muro',uso,proy.pisos) },
    { id:'techo',   label:'Techo/Cubierta',  umax: zona?.techo, rfReq: RF_ELEM_REQ('techo',uso,proy.pisos) },
    { id:'piso',    label:'Piso',            umax: zona?.piso,  rfReq: RF_ELEM_REQ('piso',uso,proy.pisos) },
    { id:'tabique', label:'Tabique',         umax: null,        rfReq: RF_ELEM_REQ('tabique',uso,proy.pisos) },
    { id:'ventana', label:'Ventana',         umax: null,        rfReq: '' },
    { id:'puerta',  label:'Puerta exterior', umax: PUERTA_U[proy.zona]||null, rfReq: PUERTA_RF[proy.zona]||'' },
  ]

  const vpctAlerta = zona?.pda

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Verificación Térmica"
        pasos={[
          'Ingresa el valor U (W/m²K) para cada elemento: puedes tomarlo de la solución LOSCAT aplicada o calcularlo en <b>Cálculo U</b>.',
          'El campo <b>RF propuesta</b> es opcional; si completaste Fuego, se toma automáticamente.',
          'El campo <b>Factor puente térmico (TB%)</b> corrige el U real según la presencia de estructura portante. Usa el valor de la solución LOSCAT o MINVU (guía puentes térmicos).',
          'Las filas en verde cumplen DS N°15 · Zona ' + (proy.zona||'—') + '. Las rojas requieren ajuste.',
          'La columna <b>Condensación</b> se calcula en la pestaña Cálculo U con el método Glaser.',
        ]}
        normativa="DS N°15 MINVU · NCh853:2021 · ISO 6946:2017 · OGUC Art. 4.1.10 · LOFC Ed.17"
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
                              <div style={{ fontSize:11, fontWeight:700, color:'#1e40af' }}>{d.solucion?.cod}</div>
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
                          <div style={{ fontSize:11, fontWeight:700, color:'#1e40af' }}>{sol.cod}</div>
                          <div style={{ fontSize:10 }}>{sol.desc}</div>
                          <div style={{ fontSize:11, marginTop:2 }}>U = <b>{termica[k]?.u} W/m²K</b>{um && <> <span style={{ fontWeight:700, color: ok?'#166534':'#dc2626' }}>{ok?'✓':'✗'}</span></>}</div>
                          {sol.rf && <div style={{ fontSize:10, color:'#374151' }}>RF {sol.rf}</div>}
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
                    <div style={{ fontSize:11, fontWeight:700, color:'#1e40af' }}>{sol.cod}</div>
                    <div style={{ fontSize:11 }}>{sol.desc}</div>
                    <div style={{ fontSize:11, marginTop:2 }}>
                      U = <b>{termica[k]?.u} W/m²K</b>
                      {um && <> · máx {um} · <span style={{ fontWeight:700, color: ok?'#166534':'#dc2626' }}>{ok?'✓ CUMPLE':'✗ NO CUMPLE'}</span></>}
                    </div>
                    {sol.rf && <div style={{ fontSize:10, color:'#374151' }}>RF {sol.rf} · Rw {sol.ac_rw!=null?sol.ac_rw+'dB':'—'}</div>}
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
            <th style={S.th}>RF propuesta</th>
            <th style={S.th}>RF mín OGUC</th>
            <th style={S.th}>Estado</th>
          </tr></thead>
          <tbody>
            {ELEMS.map(({ id, label, umax, rfReq }) => {
              const sol = termica[id]?.solucion
              const uRaw = termica[id]?.u || ''
              const up = parseFloat(uRaw)
              const tbPct = parseFloat(termica[id]?.tb || 0)
              const uCorr = (!isNaN(up) && up > 0 && tbPct > 0) ? (up * (1 + tbPct/100)) : up
              const uDisplay = (!isNaN(uCorr) && uCorr > 0) ? uCorr.toFixed(3) : ''
              const cumpleU = !umax || !uDisplay || parseFloat(uDisplay) <= umax
              const rfProp = termica[id]?.rf || (sol?.rf||'')
              const cumpleRF = !rfReq || !rfProp || rfN(rfProp) >= rfN(rfReq)
              const cumpleTodo = cumpleU && cumpleRF
              const uInvalid = uRaw !== '' && (isNaN(up) || up <= 0)
              // Sub-filas por sistema estructural
              const sistemasSolElem = (proy.estructuras?.length > 1)
                ? proy.estructuras.filter(e => e.soluciones?.[id])
                : []
              return (
                <React.Fragment key={id}>
                <tr style={{ background: uDisplay&&!cumpleTodo?'#fff5f5':'transparent' }}>
                  <td style={S.td}>
                    <b>{label}</b>
                    {sol && <div style={{ fontSize:10, color:'#1e40af', marginTop:2 }}>📋 {sol.cod}</div>}
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
                    <select style={{ ...ist, width:75 }} value={termica[id]?.rf||''}
                      onChange={e=>set(id,'rf',e.target.value)}>
                      <option value="">—</option>
                      {['F0','F15','F30','F60','F90','F120','F150','F180'].map(f=><option key={f}>{f}</option>)}
                    </select>
                    {sol?.rf && !termica[id]?.rf && <div style={{ fontSize:10, color:'#94a3b8' }}>↑ {sol.rf} (sol.)</div>}
                  </td>
                  <td style={{ ...S.td, color: rfReq?'#dc2626':'#94a3b8', fontWeight: rfReq?700:'normal' }}>
                    {rfReq || '—'}
                  </td>
                  <td style={S.td}>
                    {uDisplay ? <span style={S.badge(cumpleTodo)}>{cumpleTodo?'CUMPLE':'NO CUMPLE'}</span>
                      : <span style={{ fontSize:11, color:'#94a3b8' }}>—</span>}
                  </td>
                </tr>
                {/* Sub-filas por sistema estructural */}
                {sistemasSolElem.map(est => {
                  const d = est.soluciones[id]
                  const uS = parseFloat(d.u || 0)
                  const okU = !umax || uS <= umax
                  const rfS = d.rf || ''
                  const okRF = !rfReq || !rfS || rfN(rfS) >= rfN(rfReq)
                  const okTodo = okU && okRF
                  return (
                    <tr key={est.id} style={{ background: okTodo ? '#f0fdf4' : '#fff5f5' }}>
                      <td style={{ ...S.td, paddingLeft:24, fontSize:11 }}>
                        <span style={{ color:'#64748b' }}>↳ {est.tipo.replace('Albanileria','Alb.').replace('Hormigon armado','H.A.').replace('Estructura de acero','Acero')}</span>
                        {est.sector && <span style={{ marginLeft:4, color:'#94a3b8', fontSize:10 }}>{est.sector}</span>}
                        {est.desde && <span style={{ marginLeft:4, color:'#94a3b8', fontSize:10 }}>P{est.desde}{est.hasta !== est.desde ? `–${est.hasta}` : ''}</span>}
                        {d.solucion && <div style={{ fontSize:10, color:'#1e40af' }}>📋 {d.solucion.cod} — {d.solucion.desc}</div>}
                      </td>
                      <td style={{ ...S.td, fontWeight:700 }}>{d.u}</td>
                      <td style={S.td}><span style={{ color:'#94a3b8', fontSize:10 }}>—</span></td>
                      <td style={{ ...S.td, fontWeight:700, color: okU ? '#166534' : '#dc2626' }}>{d.u || '—'}</td>
                      <td style={{ ...S.td, color:'#dc2626', fontWeight:700 }}>{umax ? `≤ ${umax}` : <span style={{ color:'#94a3b8' }}>—</span>}</td>
                      <td style={{ ...S.td, fontWeight:700 }}>{rfS || <span style={{ color:'#94a3b8' }}>—</span>}</td>
                      <td style={{ ...S.td, color: rfReq?'#dc2626':'#94a3b8', fontWeight: rfReq?700:'normal' }}>{rfReq || '—'}</td>
                      <td style={S.td}><span style={S.badge(okTodo)}>{okTodo ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
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
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:5,
                padding:'6px 10px', fontSize:11, color:'#1e40af', marginBottom:8 }}>
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
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:5,
                padding:'6px 10px', fontSize:11, color:'#1e40af', marginBottom:8 }}>
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
                      <div style={{ padding:'7px 12px', background:'#eff6ff',
                        border:'1px solid #bfdbfe', borderRadius:6, fontSize:11, color:'#1e40af' }}>
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

// OGUC Art. 4.5.7: condición de caja de escalera cerrada (enclosure) según uso y pisos
function requiereCajaEscalera(uso, pisos) {
  const n = parseInt(pisos) || 0
  if (n <= 1) return false
  if (uso === 'Salud' || uso === 'Educacion') return n >= 2
  if (uso === 'Industrial') return n >= 2
  if (uso === 'Comercio' || uso === 'Oficina') return n >= 3
  return n >= 4   // Vivienda y otros: ≥ 4 pisos
}

function CalcRFEscalera({ proy, letraOGUC, rfReqEscalera, rfReqCaja }) {
  const [matId, setMatId] = useState('ha')
  const uso = proy.uso || ''
  const pisos = parseInt(proy.pisos) || 0

  const mat = MAT_ESCAL.find(m => m.id === matId)
  const necesitaCaja = requiereCajaEscalera(uso, pisos)
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
    <div style={{ background:'#fff', border:'1.5px solid #e0f2fe', borderRadius:10, padding:16, marginTop:14 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14,
        background:'linear-gradient(90deg,#0369a1,#0284c7)', color:'#fff',
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
      <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:6,
        padding:'8px 12px', marginBottom:12, fontSize:11, lineHeight:1.6 }}>
        <b style={{ color:'#0369a1' }}>OGUC Art. 4.5.7 — Escaleras de evacuación:</b> Todo edificio con más de un piso debe
        contar con escaleras de evacuación. Las escaleras deben ser construidas con materiales cuya RF
        cumpla lo señalado en la Tabla 1 del Tít. 4 Cap. 3, columna (9). La <b>caja de escalera</b> (recinto
        de protección) se exige según uso y número de pisos, con RF según columna (4) de la misma tabla.
        <br/>
        <b style={{ color:'#0369a1' }}>Referencia de columnas OGUC Tabla 1:</b>{' '}
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
            ⚠ <b>Caja de escalera cerrada obligatoria</b> — {pisos} piso(s) · uso {uso} · OGUC Art. 4.5.7.
            La caja debe ser un recinto cerrado, con paredes de RF ≥ {rfReqCaja || '—'} y puertas cortafuego
            según OGUC Art. 4.5.4 (PUERTA_RF: {proy.zona ? (RF_DEF[uso]?.muros_sep || '—') : '—'}).
          </>
        ) : (
          <>
            ✓ Para {pisos} piso(s) y uso {uso || '—'}, la <b>caja de escalera cerrada no es exigida</b> por OGUC Art. 4.5.7.
            La escalera debe igualmente cumplir la RF requerida para sus elementos.
          </>
        )}
      </div>

      {/* Selector de material */}
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>
          Material / sistema constructivo de la escalera
        </label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {MAT_ESCAL.map(m => (
            <button key={m.id}
              onClick={() => setMatId(m.id)}
              style={{ padding:'5px 11px', borderRadius:6, border:`1.5px solid ${matId===m.id?'#0369a1':'#e2e8f0'}`,
                background: matId===m.id ? '#e0f2fe' : '#f8fafc',
                color: matId===m.id ? '#0369a1' : '#374151',
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
                outline: matId===m.id ? '2px solid #0369a1' : 'none' }}>
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
function TabFuego({ proy, termica, setTermica, notas, setNotas }) {
  const uso = proy.uso || ''
  const rfDef = RF_DEF[uso] || {}
  const set = (id, field, val) => setTermica(t => ({ ...t, [id]: { ...(t[id] || {}), [field]: val } }))

  const VALID_RF = ['F0','F15','F30','F60','F90','F120','F150','F180']

  // ── Resolución RF según OGUC Tabla 1 cuando hay m² y destino OGUC ──────────
  const destinoOGUC = proy.destinoOGUC || (USO_TO_OGUC[uso]?.length === 1 ? USO_TO_OGUC[uso][0] : '')
  const letraOGUC   = getLetraOGUC(destinoOGUC, proy.superficie, proy.pisos)
  // Si hay letra OGUC, usar Tabla de elementos; si no, fallback a RF_DEF/RF_PISOS
  const rfReqFromOGUC = (elemId) => {
    if (letraOGUC) {
      const col = OGUC_ELEM_COL[elemId]
      return col ? (getRFDeLetra(letraOGUC, col) || null) : null
    }
    return null
  }
  const usaTablaOGUC = !!letraOGUC

  // RF desde soluciones constructivas aplicadas
  const rfFromSol = {
    estructura: termica.muro?.solucion?.rf || termica.techo?.solucion?.rf || termica.piso?.solucion?.rf || '',
    cubierta:   termica.techo?.solucion?.rf || '',
    muros_sep:  termica.tabique?.solucion?.rf || termica.muro?.solucion?.rf || '',
    cajas_esc:  '',
    escaleras:  '',
  }
  const solForElem = {
    estructura: [termica.muro?.solucion, termica.techo?.solucion, termica.piso?.solucion].filter(Boolean)[0],
    cubierta:   termica.techo?.solucion,
    muros_sep:  termica.tabique?.solucion || termica.muro?.solucion,
    cajas_esc:  null,
    escaleras:  null,
  }

  const elems = [
    { id:'estructura', label:'Estructura principal',
      rfReq: rfReqFromOGUC('estructura') || (proy.pisos ? RF_PISOS(uso, proy.pisos) : rfDef.estructura),
      obs: usaTablaOGUC ? `OGUC Tít. 4 Cap. 3 Tabla 1 — Letra ${letraOGUC} · Col. (2) soporte de cargas sobre terreno` : 'RF según uso y pisos. LOFC Ed.17 A.1–A.4. Ingresa superficie m² para aplicar Tabla 1 OGUC.' },
    { id:'muros_sep',  label:'Muros de separación entre propietarios / destinos',
      rfReq: rfReqFromOGUC('muros_sep') || rfDef.muros_sep,
      obs: usaTablaOGUC ? `OGUC Tít. 4 Cap. 3 Tabla 1 — Letra ${letraOGUC} · Col. (3) muros entre distintos propietarios o destinos` : 'OGUC Art. 4.5.4. Ingresa superficie m² para aplicar Tabla 1 OGUC.' },
    { id:'cajas_esc',  label:'Cajas de escalera / ascensores / ductos',
      rfReq: rfReqFromOGUC('cajas_esc'),
      obs: usaTablaOGUC ? `OGUC Tít. 4 Cap. 3 Tabla 1 — Letra ${letraOGUC} · Col. (4) cajas de escalera` : requiereCajaEscalera(uso, proy.pisos) ? 'OGUC Art. 4.5.7 — caja de escalera exigida según uso y pisos.' : 'OGUC Art. 4.5.7 — caja de escalera no exigida para este uso/pisos.' },
    { id:'escaleras',  label:'Escaleras / Vías de escape',
      rfReq: rfReqFromOGUC('escaleras') || rfDef.escaleras,
      obs: usaTablaOGUC ? `OGUC Tít. 4 Cap. 3 Tabla 1 — Letra ${letraOGUC} · Col. (9) escaleras` : 'OGUC Art. 4.5.7. Verificar ensayo NCh850 específico.' },
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
          'La columna <b>Solución SC</b> muestra el RF de la solución LOSCAT aplicada si corresponde al elemento.',
          'Ingresa la <b>RF propuesta</b> manualmente si difiere de la solución o si el elemento no tiene solución aplicada.',
          '<b>Escaleras:</b> No existen soluciones SC predefinidas — la RF debe respaldarse con ensayo NCh850 específico.',
          'La RF intrínseca del sistema estructural se muestra a continuación de la tabla como referencia.',
        ]}
        normativa="OGUC Tít. 4 Cap. 3 (Categoría de riesgo) · Art. 4.5.4 y 4.5.7 · LOFC Ed.17 2025 · NCh850"
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
                  <div style={{ background:'#1e40af', color:'#fff', borderRadius:8,
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
            {elems.map(({ id, label, rfReq, obs }) => {
              const rfManual = termica['rf_' + id]?.rf || ''
              const rfSol = rfFromSol[id] || ''
              const rfP = rfManual || rfSol
              const cumple = !rfReq || !rfP || rfN(rfP) >= rfN(rfReq)
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
                        <span style={{ fontSize:10, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:4, padding:'1px 6px', color:'#1e40af', fontWeight:700 }}>{sol.cod}</span>
                        <span style={{ fontSize:11, marginLeft:5, fontWeight:700 }}>{rfSol || '—'}</span>
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
                  <td style={{ ...S.td, color: rfReq?'#dc2626':'#94a3b8', fontWeight: rfReq?700:'normal' }}>
                    {rfReq ? `≥ ${rfReq}` : '—'}
                  </td>
                  <td style={S.td}>
                    {rfP && rfReq
                      ? <span style={S.badge(cumple)}>{cumple?'CUMPLE':'NO CUMPLE'}</span>
                      : <span style={{ fontSize:11, color:'#94a3b8' }}>—</span>}
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
        const alts = elemSC ? SC.filter(s => s.elem===elemSC && (s.zonas || '').includes(proy.zona||'D') && (s.usos || []).includes(uso||'Vivienda') && s.rf && rfN(s.rf) >= rfN(e.rfReq)).sort((a,b)=>rfN(b.rf)-rfN(a.rf)).slice(0,4) : []
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
      {/* ── Calculador RF Escaleras — OGUC Art. 4.5.7 ────────────────────── */}
      {uso && proy.pisos && (
        <CalcRFEscalera
          proy={proy}
          letraOGUC={letraOGUC}
          rfReqEscalera={rfReqFromOGUC('escaleras') || rfDef.escaleras || null}
          rfReqCaja={rfReqFromOGUC('cajas_esc') || null}
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
  const uso = proy.uso || ''
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
              return (
                <div key={id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', marginBottom:5,
                  background: sinRw?'#fafafa':cumple?'#f0fdf4':'#fff5f5',
                  border:`1px solid ${sinRw?'#e2e8f0':cumple?'#86efac':'#fca5a5'}`, borderRadius:6 }}>
                  <span style={{ fontSize:10, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:4, padding:'1px 6px', color:'#1e40af', fontWeight:700, flexShrink:0 }}>
                    {sol.cod}
                  </span>
                  <span style={{ flex:1, fontSize:11, color:'#374151' }}>
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
              const rw = parseFloat(rwManual || rwFromSol || 0)
              const cumple = !req || !rw || rw >= req
              return (
                <tr key={id}>
                  <td style={S.td}>
                    <b>{label}</b>
                    <div style={{ fontSize:10, color:'#64748b', marginTop:2, lineHeight:1.4 }}>{desc}</div>
                  </td>
                  <td style={S.td}>
                    <input type="number" min={0} max={90} step="0.5" style={{ ...ist, width:70 }}
                      value={rwManual} onChange={e => set('ac_'+id, 'rw', e.target.value)}
                      placeholder="ej. 45"/>
                    {!rwManual && rwFromSol ? (
                      <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>↑ {rwFromSol} dB (solución)</div>
                    ) : null}
                  </td>
                  <td style={{ ...S.td, color:'#0369a1', fontWeight:700 }}>{req ? req + ' dB' : '—'}</td>
                  <td style={S.td}>
                    {(rw || rwFromSol) && req
                      ? <span style={S.badge(cumple)}>{cumple?'CUMPLE':'NO CUMPLE'}</span>
                      : '—'}
                    {rw && req && !cumple && Math.abs(rw - req) <= 2 && (
                      <div style={{ fontSize:10, color:'#b45309', marginTop:2 }}>⚠ Déficit ≤ 2 dB — verificar con ensayo NCh352 (tolerancia de medición ±2 dB)</div>
                    )}
                  </td>
                </tr>
              )
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
          Aplica principalmente a pisos/losas entre unidades habitables.
          Fuente: NCh352:2013 / DS N°594.
        </div>
        {!uso && <div style={S.warn}>Selecciona uso en Diagnóstico.</div>}
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Elemento</th>
            <th style={S.th}>L'n,w medido (dB)</th>
            <th style={S.th}>L'n,w máximo NCh352</th>
            <th style={S.th}>Estado</th>
          </tr></thead>
          <tbody>
            <tr>
              <td style={S.td}>
                <b>Entre pisos — ruido de impacto</b>
                <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>
                  Pasos, caída de objetos. Incluye losa, piso flotante y terminación. Menor valor = mejor. NCh352 / DS N°594.
                </div>
              </td>
              <td style={S.td}>
                <input type="number" min={0} max={100} step="1" style={{ ...ist, width:70 }}
                  value={termica.ac_impacto_pisos?.lnw || ''}
                  onChange={e => set('ac_impacto_pisos', 'lnw', e.target.value)}
                  placeholder="ej. 58"/>
                <div style={{ fontSize:9, color:'#94a3b8', marginTop:2 }}>dB (medido)</div>
              </td>
              <td style={{ ...S.td, color:'#0369a1', fontWeight:700 }}>
                {acImpact.entre_pisos ? `≤ ${acImpact.entre_pisos} dB` : '—'}
              </td>
              <td style={S.td}>
                {(() => {
                  const lnw = parseFloat(termica.ac_impacto_pisos?.lnw || 0)
                  if (!lnw || !acImpact.entre_pisos) return '—'
                  const cumple = lnw <= acImpact.entre_pisos
                  return (
                    <>
                      <span style={S.badge(cumple)}>{cumple?'CUMPLE':'NO CUMPLE'}</span>
                      {!cumple && lnw - acImpact.entre_pisos <= 3 && (
                        <div style={{ fontSize:10, color:'#b45309', marginTop:2 }}>⚠ Exceso ≤ 3 dB — verificar con ensayo NCh352</div>
                      )}
                    </>
                  )
                })()}
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ ...S.warn, marginTop:8 }}>
          <b>Piso flotante:</b> agrega R≈0.10–0.15 m²K/W (térmico) y reduce L'n,w en ~15–25 dB (impacto).
          Para cumplir impacto, considerar losa + piso flotante con material absorbente (lana mineral, EPS).
        </div>
      </div>

      {/* ── Sugerencias Rw cuando no cumple ─────────────────────────────── */}
      {acElems.filter(e => {
        const rw = parseFloat(termica['ac_' + e.id]?.rw || termica[{entre_unidades:'muro',fachada:'muro',entre_pisos:'piso'}[e.id]]?.rw || 0)
        return rw && e.req && rw < e.req
      }).map(e => {
        const elemSC = { entre_unidades:'muro', fachada:'muro', entre_pisos:'piso' }[e.id]
        const alts = elemSC ? SC.filter(s => s.elem===elemSC && (s.zonas || '').includes(proy.zona||'D') && (s.usos || []).includes(uso||'Vivienda') && s.ac_rw && s.ac_rw >= e.req).sort((a,b)=>b.ac_rw-a.ac_rw).slice(0,4) : []
        return (
          <div key={e.id} style={{ ...S.card, borderColor:'#bfdbfe', background:'#f0f7ff' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#1e40af', marginBottom:6 }}>
              ❌ {e.label}: Rw propuesto ({termica['ac_'+e.id]?.rw||'—'} dB) insuficiente — se requiere ≥ {e.req} dB
            </div>
            {alts.length > 0 ? (
              <>
                <div style={{ fontSize:11, color:'#374151', marginBottom:6 }}>Soluciones LOSCAT con Rw ≥ {e.req} dB:</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {alts.map(s => (
                    <div key={s.cod} style={{ background:'#fff', border:'1px solid #bfdbfe', borderRadius:6, padding:'6px 10px', flex:1, minWidth:180 }}>
                      <div style={{ fontWeight:700, fontSize:11, color:'#1e40af' }}>{s.cod} · Rw {s.ac_rw} dB</div>
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
  const tMin   = Math.min(...temps, Tdew) - 1
  const tMax   = Math.max(...temps, Tdew) + 1

  function xPx(rel) { return PAD.l + rel * gW }
  function yPx(t)   { return PAD.t + gH - ((t - tMin) / (tMax - tMin)) * gH }

  // Línea de temperatura
  const tempPts = rsAcum.map((r, i) => `${xPx(r)},${yPx(temps[i])}`).join(' ')
  // Línea de punto de rocío (horizontal)
  const yTd = yPx(Tdew)

  // Etiquetas de capas (centradas en cada segmento)
  const capaLabels = capas
    .filter(c => !c.esCamara)
    .map((c, i) => {
      const x0 = xPx(rsAcum[i + 1] - (Rs[i + 1] || 0) / Rtot)
      const x1 = xPx(rsAcum[i + 1])
      return { label: (c.mat || c.name || '').split(' ').slice(0, 2).join(' '), cx: (x0 + x1) / 2 }
    })

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
      <polyline points={tempPts} fill="none" stroke="#1e40af" strokeWidth={2} strokeLinejoin="round" />

      {/* Puntos de interfaz */}
      {rsAcum.map((r, i) => {
        const iface = res.ifaces[i - 1]
        const riesgo = iface?.riesgo
        return (
          <circle key={i} cx={xPx(r)} cy={yPx(temps[i])}
            r={i === 0 || i === rsAcum.length - 1 ? 3 : 4}
            fill={riesgo ? '#dc2626' : '#1e40af'}
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

// ─── PANEL CÁLCULO U (componente por elemento) ────────────────────────────────
function PanelCalcU({ elemKey, elemTipo, label, umax, proy, initData, headerColor, onLimpiarCalcU, onCalcUChange }) {
  // elemKey puede ser simple ('muro') o compuesto ('abc123::muro').
  // elemId es siempre el tipo de elemento para las comprobaciones condicionales.
  const elemId = elemKey.includes('::') ? elemKey.split('::').pop() : elemKey
  const zona = proy.zona ? ZONAS[proy.zona] : null
  const [collapsed, setCollapsed] = useState(false)
  const [capas, setCapas] = useState([])
  const [res, setRes] = useState(null)
  const [correc, setCorrec] = useState([])
  const [calcuando, setCalcuando] = useState(false)
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

  // ── Estado para opciones normativas avanzadas ──────────────────────────────
  // Piso: tipo de apoyo (ventilado / sobre terreno / sobre espacio no calef.)
  const [pisoTipo, setPisoTipo] = useState('ventilado') // 'ventilado'|'terreno'|'no_calef'
  const [pisoAg,   setPisoAg]   = useState('')           // área piso Ag (m²)
  const [pisoPg,   setPisoPg]   = useState('')           // perímetro expuesto Pg (m)
  const [pisoLg,   setPisoLg]   = useState('2.0')        // λ suelo (W/mK)
  // Techo: cubierta ventilada → calcular solo capas bajo cámara (ISO 6946 §6.9.2)
  const [cubiertaVent, setCubiertaVent] = useState(false)
  // Corrección puentes térmicos ΔU (ISO 6946 §6.9.3) — suma al U calculado
  const [deltaU, setDeltaU] = useState('')

  useEffect(() => {
    if (!initData?.capas?.length) return
    setCapas(initData.capas)
    setOrigCapas(initData.capas.map(c => ({...c})))
    setSolucion(initData.solucion || null)
    // Si el propio componente disparó este cambio de initData (vía onCalcUChange),
    // saltar el recálculo para evitar el doble cálculo que congela la UI.
    if (skipInitEffect.current) { skipInitEffect.current = false; return }
    // Auto-calcular inmediatamente con las capas de la solución
    const tiZ = zona?.Ti || 20, teZ = zona?.Te || 5, hrZ = zona?.HR || 70
    const cv = initData.capas.map(c => c.esCamara ? { esCamara: true } : {
      mat: c.mat, lam: parseFloat(c.lam), esp: parseFloat(c.esp) / 1000, mu: parseFloat(c.mu),
      ...(c.estructura_integrada ? { estructura_integrada: c.estructura_integrada } : {}),
    }).filter(c => c.esCamara || (!isNaN(c.lam) && c.lam > 0 && !isNaN(c.esp) && c.esp > 0))
    if (cv.length) {
      const r = calcGlaser(cv, tiZ, teZ, hrZ, elemTipo)
      setRes(r)
      // Tabique interior: no aplica verificación Glaser (NCh853 → solo envolvente)
      if (elemId !== 'tabique') {
        const nec = r?.condInter || (umax && parseFloat(r?.U || 99) > umax)
        if (nec) {
          setCalcuando(true)
          ;(async () => {
            try {
              const cr = await generarCorrecciones(cv, tiZ, teZ, hrZ, elemTipo, umax)
              setCorrec(cr)
            } catch (e) {
              console.error('generarCorrecciones error:', e); setCorrec([])
            } finally {
              setCalcuando(false)
            }
          })()
        } else { setCorrec([]) }
      }
    } else {
      setRes(null); setCorrec([])
    }
  }, [initData])

  const ti = zona?.Ti || 20
  const te = zona?.Te || 5
  const hr = zona?.HR || 70

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
    if (m) setCapas(cs => cs.map(c => c.id === id ? { ...c, mat: m.n, lam: String(m.lam), mu: String(m.mu) } : c))
    else setCapas(cs => cs.map(c => c.id === id ? { ...c, mat: matName } : c))
  }
  function addCamara() {
    setCapas(c => [...c, { id: Date.now(), mat: 'Cámara de aire', lam: '', esp: '', mu: '', esCamara: true }])
  }

  async function calcularConCapas(cs) {
    try {
      const cv = cs.map(c => c.esCamara ? { esCamara: true } : {
        mat: c.mat, lam: parseFloat(c.lam), esp: parseFloat(c.esp) / 1000, mu: parseFloat(c.mu),
        ...(c.estructura_integrada ? { estructura_integrada: c.estructura_integrada } : {}),
      }).filter(c => c.esCamara || (!isNaN(c.lam) && c.lam > 0 && !isNaN(c.esp) && c.esp > 0))
      if (!cv.length) return
      const r = calcGlaser(cv, ti, te, hr, elemTipo)
      setRes(r)
      setShowHomolog(false)
      // Notificar al padre con las capas actualizadas y el resultado calculado.
      // Marcamos el flag para que useEffect([initData]) no vuelva a calcular.
      if (onCalcUChange) { skipInitEffect.current = true; onCalcUChange(elemKey, { capas: cs, res: r }) }
      // Tabique interior: no aplica verificación Glaser (NCh853 → solo envolvente)
      if (elemId !== 'tabique') {
        const necesita = r?.condInter || (umax && parseFloat(r?.U || 99) > umax)
        if (necesita) {
          setCalcuando(true)
          try {
            // 🔥 Esperamos al motor asíncrono. El spinner se ve porque
            // generarCorrecciones cede el hilo con setTimeout(0).
            const nuevasCorrec = await generarCorrecciones(cv, ti, te, hr, elemTipo, umax)
            setCorrec(nuevasCorrec)
          } catch (e) {
            console.error('Fallo crítico en el motor de cálculo:', e)
            setCorrec([])
          } finally {
            setCalcuando(false)
          }
        } else { setCorrec([]) }
      }
    } catch(e) {
      console.error('calcularConCapas error:', e)
      setRes(null); setCorrec([])
    }
  }
  function calcular() { calcularConCapas(capas) }

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
    const cumpleU = !umax || uCalc <= umax
    const cambios = detectarCambios()
    const capasOrig = (origCapas || []).map((c,i) => `   ${i+1}. ${c.esCamara ? 'Cámara de aire' : `${c.mat} — λ=${c.lam} W/mK, e=${c.esp}mm, μ=${c.mu||1}`}`).join('\n')
    const capasMod  = capas.map((c,i) => `   ${i+1}. ${c.esCamara ? 'Cámara de aire' : `${c.mat} — λ=${c.lam} W/mK, e=${c.esp}mm, μ=${c.mu||1}`}`).join('\n')
    const motivoCambio = res.condInter
      ? `El análisis higrotérmico (Método de Glaser, NCh853:2021) de la configuración original detectó riesgo de condensación intersticial en la(s) interfaz(ces): ${res.ifaces.filter(f=>f.riesgo).map(f=>`N°${f.i} (T=${f.T}°C, Pvreal=${f.pvReal}Pa > Pvsat=${f.pvSat}Pa)`).join('; ')}. La modificación elimina dicho riesgo.`
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

   b) Condensación intersticial (Método Glaser, NCh853:2021):
      Temperatura de rocío: ${res.Tdew}°C
      Estado: ${res.condInter ? '✗ RIESGO — revisar configuración' : '✓ SIN RIESGO en interfaces internas'}
${res.ifaces.map(f=>`      Int. ${f.i}: T=${f.T}°C | Pvsat=${f.pvSat}Pa | Pvreal=${f.pvReal}Pa | Margen=${f.margen>=0?'+':''}${f.margen}Pa → ${f.riesgo?'RIESGO':'OK'}`).join('\n')}

7. CONCLUSIÓN
   La solución modificada ${cumpleU && !res.condInter ? 'cumple íntegramente' : 'no cumple aún'} con las
   exigencias del DS N°15 del MINVU para ${zona_nombre} y no presenta riesgo de
   condensación intersticial según el Método de Glaser (NCh853:2021).
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
    // Propagar corrección aplicada al padre.
    // Marcamos el flag para que useEffect([initData]) no vuelva a calcular.
    if (onCalcUChange) { skipInitEffect.current = true; onCalcUChange(elemKey, { capas: nuevas, res: r }) }
    const necesita = r?.condInter || (umax && parseFloat(r?.U || 99) > umax)
    if (necesita) {
      const cvCorr = corr.capasCorregidas
      setCalcuando(true)
      try {
        // 🔥 Esperamos al motor asíncrono. Cero setTimeouts falsos.
        const nuevasCorrec = await generarCorrecciones(cvCorr, ti, te, hr, elemTipo, umax)
        setCorrec(nuevasCorrec)
      } catch (e) {
        console.error('Fallo crítico en el motor de cálculo:', e)
        setCorrec([])
      } finally {
        setCalcuando(false)
      }
    } else { setCorrec([]) }
  }

  function getSvgString() {
    if (!graphRef.current) return ''
    return new XMLSerializer().serializeToString(graphRef.current)
  }

  function exportarInformeDom() {
    if (!res) return
    const uCalc   = parseFloat(res.U)
    const cumpleU = !umax || uCalc <= umax
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
  h1 { font-size: 15pt; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 6px }
  h2 { font-size: 12pt; color: #1e40af; margin-top: 22px; margin-bottom: 6px; border-left: 4px solid #1e40af; padding-left: 8px }
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

<h2>3. Gráfico de Temperatura y Condensación (Método Glaser — NCh853:2021)</h2>
<div class="fig">
${svgStr}
<div class="fig-cap">Figura 1: Perfil de temperatura (azul) y punto de rocío (naranja) a través del elemento. Ti=${ti}°C · Te=${te}°C · HR=${hr}% · Zona ${proy.zona || '—'}. Elaborado según NCh853:2021 / EN ISO 13788.</div>
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
    <td>Condensación intersticial (Glaser, NCh853)</td>
    <td>T rocío: <b>${res.Tdew}°C</b></td>
    <td>Sin condensación en interfaces (NCh853:2021)</td>
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
  : `<div class="ok-box">✓ Sin condensación intersticial en interfaces internas. La solución cumple las exigencias higrotérmicas de la NCh853:2021.</div>`
}

${cambios.length && solucion ? `
<h2>5. Texto de Homologación (OGUC Art. 1.2.2)</h2>
<div class="homolog">${generarTextoHomologacion()}</div>
` : ''}

<hr style="margin-top:30px;border:none;border-top:1px solid #e2e8f0">
<p style="font-size:9pt;color:#94a3b8;text-align:center">
  Generado por NormaCheck · ${fechaHoy} ·
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
        {res && umax && <span style={{ background: parseFloat(res.U) <= umax ? '#dcfce7' : '#fee2e2', color: parseFloat(res.U) <= umax ? '#166534' : '#991b1b', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{parseFloat(res.U) <= umax ? 'CUMPLE' : 'NO CUMPLE'}</span>}
        {!res && !solucion && <span style={{ fontSize: 11, opacity: 0.7 }}>Sin datos — aplica una solución o agrega capas</span>}
        <span style={{ marginLeft: 'auto', fontSize: 16 }}>{collapsed ? '▼' : '▲'}</span>
      </div>

      {/* ── Panel body ─────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '12px' }}>
          {solucion && (
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'10px 16px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#1e40af' }}>📋 {solucion.cod} — {solucion.desc}</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{solucion.obs}</div>
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>LOSCAT Ed.13 2025 · Capas cargadas automáticamente · Resultado calculado según NCh853:2021 + ISO 6946</div>
              </div>
              <button onClick={() => { setSolucion(null); setCapas([]); setRes(null); setCorrec([]); if (onLimpiarCalcU) onLimpiarCalcU(elemKey) }}
                style={{ background:'#fff', border:'1px solid #fca5a5', borderRadius:5, padding:'4px 12px', cursor:'pointer', fontSize:11, color:'#dc2626', fontWeight:600 }}>
                🔄 Cambiar solución
              </button>
            </div>
          )}
          <div style={S.card}>
            <p style={S.h2}>Calculadora U + Condensación (NCh853 / Glaser)</p>
            {/* ── Hint cuando no hay solución ni capas ───────────────────────── */}
            {!solucion && capas.length === 0 && (
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6, padding:'8px 14px', marginBottom:10, fontSize:12, color:'#1e40af' }}>
                💡 Ve a la pestaña <b>Soluciones</b> para aplicar una solución constructiva, o agrega capas manualmente con el botón <b>+ Capa</b>.
              </div>
            )}
            <div style={{ ...S.col, fontSize: 12, color: '#64748b', marginBottom: 8 }}>
              <span style={S.label}>Condiciones diseño</span>
              Ti: {ti}°C | Te: {te}°C | HR: {hr}% {umax && `| U máx: ${umax} W/m²K`}
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
                {pisoTipo === 'ventilado' && <div style={{ fontSize:10, color:'#166534' }}>RSi = 0.17 m²K/W · RSe = 0.13 m²K/W (ISO 6946 Tabla 1 — piso expuesto al exterior/sobramiento)</div>}
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

            {/* ── Cubierta ventilada (solo techo) ────────────────────────────── */}
            {elemId === 'techo' && (
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6, padding:'8px 12px', marginBottom:8 }}>
                <label style={{ fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={cubiertaVent} onChange={e=>setCubiertaVent(e.target.checked)} style={{ cursor:'pointer' }} />
                  <b style={{ color:'#1e40af' }}>Cubierta ventilada</b>
                  <span style={{ fontSize:11, color:'#64748b' }}>(cámara de aire ventilada sobre el aislante)</span>
                </label>
                {cubiertaVent && (
                  <div style={{ marginTop:6, fontSize:11, color:'#1e40af', background:'#dbeafe', borderRadius:4, padding:'6px 10px', lineHeight:1.6 }}>
                    <b>ISO 6946 §6.9.2:</b> Para cubierta con cámara ventilada, introduce sólo las capas <b>bajo</b> la cámara. Las capas superiores (p.ej. teja, tablero exterior) no contribuyen. Usa RSe = 0.13 m²K/W para la cara que da a la cámara. El U resultante aplica al modelo energético.
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
                    <tr style={{ background:'#eff6ff' }}>
                      <td style={{ ...S.td, color:'#94a3b8', fontSize:10, textAlign:'center' }}>{idx+1}</td>
                      <td style={S.td} colSpan={3}><i>Cámara de aire (R = {RCAMARA} m²K/W)</i></td>
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
                          {MATS.map(g=>(
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
                  {/* ── Panel de estructura integrada (ISO 6946) ─────────────── */}
                  {tieneEB && !c.esCamara && (
                    <tr style={{ background: esAcero ? '#fff1f2' : '#fffbeb' }}>
                      <td />
                      <td colSpan={6} style={{ padding:'6px 14px 10px' }}>
                        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', fontSize:11 }}>
                          <span style={{ fontWeight:700, color: esAcero?'#dc2626':'#92400e', fontSize:11, whiteSpace:'nowrap' }}>
                            ⚙ Estructura integrada · ISO 6946:2017 método combinado
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
                              f_a={((c.estructura_integrada.ancho_mm/c.estructura_integrada.distancia_mm)*100).toFixed(1)}% estr.
                              · f_b={((1-c.estructura_integrada.ancho_mm/c.estructura_integrada.distancia_mm)*100).toFixed(1)}% ais.
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
          <button style={S.btn('#0369a1')} onClick={addCamara}>+ Cámara</button>
          <button style={S.btn()} onClick={calcular}>Calcular U</button>
          {capas.length>0 && <span style={{ fontSize:11, color:'#94a3b8', alignSelf:'center' }}>↑↓ Mueve capas y recalcula para homologar</span>}
        </div>
      </div>

      {res && (()=>{
        // ΔU corrección puentes térmicos (ISO 6946 §6.9.3)
        const dU    = parseFloat(deltaU) || 0
        const uCalc = parseFloat(res.U) + dU
        const uCorrStr = uCalc.toFixed(3)
        const cumpleU      = !umax || uCalc <= umax
        const tSupExt      = parseFloat(res.temps[res.temps.length-1]).toFixed(2)
        const supExtBajaTd = parseFloat(tSupExt) < parseFloat(res.Tdew)
        const cumpleTodo   = cumpleU && (esTabique || !res.condInter)

        // ── fRsi — factor de temperatura superficial interior (NCh853:2021 §6) ──
        const RSi_val = elemTipo === 'techumbre' ? 0.10 : elemTipo === 'piso' ? 0.17 : 0.13
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
          iso13370 = { Uf: Uf.toFixed(3), Bp: Bp.toFixed(2), dt: dt.toFixed(3), cumple: !umax || Uf <= umax }
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
            {/* ── Cards de resumen ───────────────────────────────────────────── */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              {(esTabique ? [
                { label:'U calculado', val:`${uCorrStr} W/m²K`, bg: colSem(uCalc)+'18', border: colSem(uCalc), col: colSem(uCalc) },
              ] : [
                { label:'T rocío',      val:`${res.Tdew}°C`,                          bg:'#f8fafc', border:'#e2e8f0', col:'#374151' },
                { label:'T sup. ext.',  val:`${tSupExt}°C`,                           bg:'#f8fafc', border:'#e2e8f0', col:'#374151' },
                { label:'T sup. int.',  val:`${Tsi_int.toFixed(1)}°C`,                bg: cumpleFRsi?'#f0fdf4':'#fee2e2', border: cumpleFRsi?'#86efac':'#fca5a5', col: cumpleFRsi?'#166534':'#dc2626' },
                { label:'fRsi',         val:`${fRsi.toFixed(3)}`,                     bg: cumpleFRsi?'#f0fdf4':'#fee2e2', border: cumpleFRsi?'#86efac':'#fca5a5', col: cumpleFRsi?'#166534':'#dc2626' },
                { label:'Sup. exterior',val: supExtBajaTd?'Bajo Td':'Sobre Td',       bg: supExtBajaTd?'#fef9c3':'#f0fdf4', border: supExtBajaTd?'#fde047':'#86efac', col: supExtBajaTd?'#854d0e':'#166534' },
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

            {/* ── Nota técnica tabique (sin Glaser) ──────────────────────────── */}
            {esTabique && (
              <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:6, padding:'8px 14px', fontSize:12, color:'#0369a1', marginBottom:8 }}>
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
              {supExtBajaTd&&elemTipo==='piso'&&<div style={{ background:'#fef9c3', border:'1px solid #fde047', borderRadius:6, padding:'8px 14px', fontSize:12, color:'#713f12' }}><b>△ Condensación superficial exterior — caso aceptado en piso ventilado.</b> La cara inferior queda expuesta al sobramiento, no a un recinto habitable. La NCh853 exige control intersticial, no superficial en caras exteriores expuestas.</div>}
              {supExtBajaTd&&elemTipo!=='piso'&&<div style={{ background:'#fef9c3', border:'1px solid #fde047', borderRadius:6, padding:'8px 14px', fontSize:12, color:'#713f12' }}><b>△ Condensación superficial exterior.</b> T ext. ({tSupExt}°C) bajo el punto de rocío ({res.Tdew}°C). Verificar protección exterior (NCh853).</div>}
              {supExtBajaTd&&elemTipo==='piso'&&(
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
                <div style={{ marginTop:4, fontSize:10, color:'#64748b' }}>
                  NCh853:2021 §6 · fRsi = 1 − RSi/Rtot · Tsi = Ti − (RSi/Rtot)·(Ti−Te) · RSi = {RSi_val} m²K/W · Rtot = {res.Rtot} m²K/W
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
                    ISO 6946 · R_T,upper={res.iso6946.R_upper} m²K/W (planos isotérmicos)
                    · R_T,lower={res.iso6946.R_lower} m²K/W (caminos paralelos)
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
                  R_T,upper={res.iso6946.R_upper} · R_T,lower={res.iso6946.R_lower} · R_T={res.iso6946.R_T} m²K/W
                  · f_a={((res.iso6946.fa||0)*100).toFixed(1)}% estr. / f_b={((res.iso6946.fb||0)*100).toFixed(1)}% ais.
                </span>
              </div>
            )}

            {/* ── Correcciones sugeridas ──────────────────────────────────────── */}
            {calcuando&&(
              <div style={{ display:'flex',alignItems:'center',gap:8,color:'#64748b',fontSize:13,padding:'10px 0' }}>
                <div style={{ width:16,height:16,border:'2px solid #e2e8f0',borderTopColor:'#1e40af',borderRadius:'50%',animation:'spin 0.8s linear infinite',flexShrink:0 }}/>
                Calculando correcciones normativas…
              </div>
            )}
            {!calcuando&&correc.length>0&&(
              <>
                <div style={S.sep}/>
                <p style={S.h3}>Correcciones sugeridas (NCh853)</p>
                {correc.map(c=>(
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
                        {/* Advertencias constructivas */}
                        {c.advertencias?.length > 0 && (
                          <ul style={{ margin:'6px 0 0', padding:'0 0 0 16px', fontSize:11, color:'#92400e', lineHeight:1.5 }}>
                            {c.advertencias.map((a,i) => <li key={i}>{a}</li>)}
                          </ul>
                        )}
                      </div>
                      <button onClick={()=>aplicarCorreccion(c)}
                        style={{ background:c.color, color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:700, whiteSpace:'nowrap', flexShrink:0, alignSelf:'flex-start' }}>
                        ▶ Aplicar y recalcular
                      </button>
                    </div>
                  </div>
                ))}
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
                    <div style={{ fontSize:12, fontWeight:700, color: cumpleTodo&&hayModif?'#166534':cumpleTodo?'#1e40af':'#94a3b8' }}>
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
                        style={{ background:'#1e40af', color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', cursor:'pointer', fontSize:12, fontWeight:600 }}>
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
  muro:    { elemTipo:'muro',      label:'Muro',             color:'#1e40af', umaxKey:'muro'  },
  techo:   { elemTipo:'techumbre', label:'Cubierta / Techo', color:'#4f46e5', umaxKey:'techo' },
  piso:    { elemTipo:'piso',      label:'Piso',             color:'#166534', umaxKey:'piso'  },
  tabique: { elemTipo:'muro',      label:'Tabique',          color:'#b45309', umaxKey:null    },
}

function TabCalcU({ proy, initData, onLimpiarCalcU, onCalcUChange, notas, setNotas }) {
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
        umax:        cfg.umaxKey ? zona?.[cfg.umaxKey] : null,
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
    umax:        cfg.umaxKey ? zona?.[cfg.umaxKey] : null,
    headerColor: cfg.color,
  }))

  // Si hay sistemas con soluciones → mostrar paneles por sistema + tabique global
  // Si no → mostrar 4 paneles fijos globales
  let paneles
  if (panelesSistema.length > 0) {
    // Añadir Tabique global (no se gestiona por sistema)
    const tabiquePanelGlobal = panalesGlobales.find(p => p.elemKey === 'tabique')
    paneles = [...panelesSistema, tabiquePanelGlobal]
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
          'El sistema calcula U (ISO 6946 método combinado si hay estructura integrada) y verifica condensación intersticial (Método Glaser, NCh853:2021).',
          'Si hay incumplimientos aparecen <b>correcciones sugeridas</b> y el texto de homologación cuando corresponda.',
          'Usa <b>▼/▲</b> para colapsar paneles ya completos.',
        ]}
        normativa="NCh853:2021 · ISO 6946:2017 · Método de Glaser (EN ISO 13788) · DS N°15 Tabla 1"
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
  const vpctZona = VPCT[zona]
  const permLimit = PERM_V[zona]
  const sobr = SOBR_R[zona]

  // Nivel VPCT según Uw: 0=Niv1 (mejor vidrio, más % permitido) … 2=Niv3 (peor)
  const getVpctNivel = uw => { const u = parseFloat(uw); if (isNaN(u)) return null; return u <= 2.0 ? 0 : u <= 3.5 ? 1 : 2 }
  const NIVEL_LABELS = ['Nivel 1 (Uw≤2.0)', 'Nivel 2 (Uw≤3.5)', 'Nivel 3 (Uw>3.5)']
  const ORIENTS = [{ key: 'N', label: 'Norte' }, { key: 'OP', label: 'Oriente / Poniente' }, { key: 'S', label: 'Sur' }]
  const ORIENT_COLORS = { N: '#1e40af', OP: '#166534', S: '#7c3aed' }

  // ─── Calculadora U ventana ───────────────────────────────────────────────────
  const [vidrio, setVidrio] = useState('')
  const [marco, setMarco] = useState('')
  const [ag, setAg] = useState('')
  const [af, setAf] = useState('')
  const [lg, setLg] = useState('')
  const [resUw, setResUw] = useState(null)

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

  // ─── Analizador multi-fachada VPCT ──────────────────────────────────────────
  function addFachada(orient) {
    setFachadas(prev => [...prev, { id: fachadasNextId, nombre: '', orient, areaFachada: '', vanos: '', uw: '' }])
    setFachadasNextId(n => n + 1)
  }
  function removeFachada(id) { setFachadas(prev => prev.filter(f => f.id !== id)) }
  function updF(id, field, val) { setFachadas(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f)) }

  // Resultados por fachada
  const fachadasCalc = fachadas.map(f => {
    const area = parseFloat(f.areaFachada), vanos = parseFloat(f.vanos), niv = getVpctNivel(f.uw)
    if (!isNaN(area) && area > 0 && !isNaN(vanos) && vanos >= 0 && niv !== null && vpctZona) {
      const pct = (vanos / area) * 100
      const limite = vpctZona[f.orient]?.[niv] ?? null
      return { ...f, pct: pct.toFixed(1), limite, cumple: limite !== null ? pct <= limite : null, niv }
    }
    return { ...f, pct: null, limite: null, cumple: null, niv }
  })

  // Resumen por orientación (nivel más restrictivo = Uw más alto del grupo)
  const orientSummary = ORIENTS.map(({ key, label }) => {
    const group = fachadasCalc.filter(f => f.orient === key && f.pct !== null)
    if (!group.length) return null
    const totalArea = group.reduce((s, f) => s + parseFloat(f.areaFachada), 0)
    const totalVanos = group.reduce((s, f) => s + parseFloat(f.vanos), 0)
    const pct = (totalVanos / totalArea) * 100
    const nivMax = Math.max(...group.map(f => f.niv))
    const limite = vpctZona?.[key]?.[nivMax] ?? null
    return { key, label, totalArea: totalArea.toFixed(1), totalVanos: totalVanos.toFixed(1), pct: pct.toFixed(1), nivMax, limite, cumple: limite !== null ? pct <= limite : null }
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
          'El nivel VPCT se determina según Uw: <b>Nivel 1</b> (Uw≤2.0), <b>Nivel 2</b> (Uw≤3.5), <b>Nivel 3</b> (Uw>3.5).',
          'El % de vano = Av/At×100 se compara contra el límite VPCT de la zona y orientación.',
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
        <div style={S.row}>
          <div style={S.col}><span style={S.label}>Área vidrio Ag (m²)</span><input style={{ ...S.input, width: 90 }} value={ag} onChange={e => setAg(e.target.value)} placeholder="1.0" /></div>
          <div style={S.col}><span style={S.label}>Área marco Af (m²)</span><input style={{ ...S.input, width: 90 }} value={af} onChange={e => setAf(e.target.value)} placeholder="0.2" /></div>
          <div style={S.col}><span style={S.label}>Long. junta Lg (m)</span><input style={{ ...S.input, width: 90 }} value={lg} onChange={e => setLg(e.target.value)} placeholder="4.0" /></div>
          <div style={{ ...S.col, justifyContent: 'flex-end' }}>
            <button style={S.btn()} onClick={calcularUw}>Calcular U ventana</button>
          </div>
        </div>
        {resUw && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              U ventana = <span style={{ color: colSem(parseFloat(resUw.Uw)) }}>{resUw.Uw} W/m²K</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Uw = ({resUw.Ug}×{resUw.Ag} + {resUw.Uf}×{resUw.Af} + {resUw.psi}×{resUw.Lg}) / {resUw.Aw.toFixed(2)} m²
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#0369a1' }}>
              → <b>{NIVEL_LABELS[getVpctNivel(resUw.Uw)]}</b> — copia este Uw al ingresar las fachadas abajo
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
          const vpctLims = vpctZona?.[oKey]
          const fachs = fachadas.filter(f => f.orient === oKey)
          return (
            <div key={oKey} style={{ marginBottom: 20, border: `2px solid ${color}30`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Header orientación */}
              <div style={{ background: color, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                  {oLabel}
                  {vpctLims && <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.85, marginLeft: 10 }}>
                    Límites: N1={vpctLims[0]}% / N2={vpctLims[1]}% / N3={vpctLims[2]}%
                  </span>}
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
                    <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
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
                        <input style={{ ...S.input, width: 90 }} value={f.vanos} onChange={e => updF(f.id, 'vanos', e.target.value)} placeholder="36.0" />
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
                            <div style={{ fontSize: 13, paddingTop: 5, color: '#475569' }}>{fc.limite}% <span style={{ fontSize: 10, color: '#94a3b8' }}>({NIVEL_LABELS[fc.niv]})</span></div>
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
                <th style={S.th}>Nivel (conserv.)</th>
                <th style={S.th}>Límite VPCT</th>
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
                  <td style={S.td}><span style={{ fontSize: 11 }}>{NIVEL_LABELS[o.nivMax]}</span></td>
                  <td style={S.td}>{o.limite}%</td>
                  <td style={S.td}><span style={S.badge(o.cumple)}>{o.cumple ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            * El nivel VPCT del resumen es el más restrictivo (mayor Uw) entre todas las fachadas de esa orientación.
          </div>
        </div>
      )}

      {/* ── Tabla referencia VPCT ─────────────────────────────────────────────── */}
      {vpctZona && (
        <div style={S.card}>
          <p style={S.h3}>Tabla de referencia VPCT — Zona {zona}</p>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Orientación</th>
                <th style={S.th}>Nivel 1 (Uw≤2.0 W/m²K)</th>
                <th style={S.th}>Nivel 2 (Uw≤3.5 W/m²K)</th>
                <th style={S.th}>{'Nivel 3 (Uw>3.5 W/m²K)'}</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={S.td}><b>Norte</b></td>{vpctZona.N.map((v, i) => <td key={i} style={S.td}>{v}%</td>)}</tr>
              <tr><td style={S.td}><b>Oriente / Poniente</b></td>{vpctZona.OP.map((v, i) => <td key={i} style={S.td}>{v}%</td>)}</tr>
              <tr><td style={S.td}><b>Sur</b></td>{vpctZona.S.map((v, i) => <td key={i} style={S.td}>{v}%</td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
      <NotasPanel tabKey="ventana" notas={notas} setNotas={setNotas} />
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
    return `<circle cx="${xPx(r)}" cy="${yPx(temps[i])}" r="${(i === 0 || i === rsAcum.length - 1) ? 3 : 4}" fill="${iface?.riesgo ? '#dc2626' : '#1e40af'}" stroke="#fff" stroke-width="1.5"/>`
  }).join('')
  const capaLabels = (capas || []).filter(c => !c.esCamara).map((c, i) => {
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
<polyline points="${tempPts}" fill="none" stroke="#1e40af" stroke-width="2" stroke-linejoin="round"/>
${dots}
<text x="${PAD.l + 2}" y="${PAD.t + gH + 14}" font-size="9" fill="#64748b">int</text>
<text x="${PAD.l + gW - 2}" y="${PAD.t + gH + 14}" font-size="9" fill="#64748b" text-anchor="end">ext</text>
${capaLabels}
<text x="${PAD.l - 3}" y="${PAD.t - 5}" font-size="8" fill="#94a3b8" text-anchor="end">°C</text>
</svg>`
}

// ─── PESTAÑA RESULTADOS ────────────────────────────────────────────────────────
function TabResultados({ proy, termica, onExportar, notas, setNotas, calcUInit, fachadas, modulosInforme, setModulosInforme }) {
  const zona = proy.zona ? ZONAS[proy.zona] : null
  const uso = proy.uso || ''

  // ── Determinar qué módulos son requeridos normativamente ─────────────────
  const reqTermica   = !!proy.zona
  const reqFuego     = !!(RF_DEF[uso] && Object.values(RF_DEF[uso]).some(v => v))
  const reqAcustica  = !!(AC_DEF[uso] && (AC_DEF[uso].entre_unidades || AC_DEF[uso].entre_pisos || AC_DEF[uso].fachada))
  const haySistemas  = (proy.estructuras?.length || 0) > 1
  const hayVentanas  = fachadas?.some(f => parseFloat(f.vanos) > 0 || parseFloat(f.areaFachada) > 0)
  const hayNotas     = Object.values(notas || {}).some(v => v?.toString().trim())

  // Valor efectivo de cada módulo: modulosInforme sobreescribe el default
  const mods = {
    termica:  modulosInforme?.termica  ?? true,
    fuego:    modulosInforme?.fuego    ?? reqFuego,
    acustica: modulosInforme?.acustica ?? reqAcustica,
    sistemas: modulosInforme?.sistemas ?? haySistemas,
    ventanas: modulosInforme?.ventanas ?? hayVentanas,
    notas:    modulosInforme?.notas    ?? hayNotas,
  }
  function toggleMod(key) {
    setModulosInforme(prev => ({ ...(prev || mods), [key]: !(prev?.[key] ?? mods[key]) }))
  }
  function resetMods() { setModulosInforme(null) }

  // ── Formato de exportación ────────────────────────────────────────────────
  const [formatoExport, setFormatoExport] = useState('pdf')

  const ELEMS_DEF = [
    { key: 'muro',    label: 'Muro',            tipo: 'muro',      umax: zona?.muro,  rfReq: RF_DEF[uso]?.muros_sep, rwReq: AC_DEF[uso]?.entre_unidades },
    { key: 'techo',   label: 'Cubierta/Techo',  tipo: 'techumbre', umax: zona?.techo, rfReq: RF_DEF[uso]?.cubierta,  rwReq: AC_DEF[uso]?.entre_pisos },
    { key: 'piso',    label: 'Piso',             tipo: 'piso',      umax: zona?.piso,  rfReq: RF_DEF[uso]?.estructura, rwReq: AC_DEF[uso]?.entre_pisos },
    { key: 'tabique', label: 'Tabique',          tipo: 'muro',      umax: null,        rfReq: RF_DEF[uso]?.muros_sep, rwReq: AC_DEF[uso]?.entre_unidades },
    { key: 'puerta',  label: 'Puerta exterior',  tipo: 'muro',      umax: PUERTA_U[proy.zona]||null, rfReq: PUERTA_RF[proy.zona]||'', rwReq: null },
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
    return [
      { label:'Muro U',            val: uMuro  ? String(parseFloat(uMuro).toFixed(4))  : null, max:`≤ ${zona.muro} W/m²K`,  ok: !uMuro  || parseFloat(uMuro)  <= zona.muro },
      { label:'Techo U',           val: uTecho ? String(parseFloat(uTecho).toFixed(4)) : null, max:`≤ ${zona.techo} W/m²K`, ok: !uTecho || parseFloat(uTecho) <= zona.techo },
      { label:'Piso U',            val: uPiso  ? String(parseFloat(uPiso).toFixed(4))  : null, max:`≤ ${zona.piso} W/m²K`,  ok: !uPiso  || parseFloat(uPiso)  <= zona.piso },
      { label:'Puerta U',          val: uPuerta,                    max: PUERTA_U[proy.zona]?`≤ ${PUERTA_U[proy.zona]} W/m²K`:'—', ok: !uPuerta || !PUERTA_U[proy.zona] || parseFloat(uPuerta) <= PUERTA_U[proy.zona] },
      { label:'RF Estructura',     val: termica.rf_estructura?.rf,  max:`≥ ${rfReqEstr}`,             ok: !termica.rf_estructura?.rf  || rfN(termica.rf_estructura.rf) >= rfN(rfReqEstr) },
      { label:'RF Muros sep.',     val: termica.rf_muros_sep?.rf,   max:`≥ ${RF_DEF[uso]?.muros_sep}`,ok: !termica.rf_muros_sep?.rf   || rfN(termica.rf_muros_sep.rf)  >= rfN(RF_DEF[uso]?.muros_sep||'F0'), norma:'OGUC Art. 4.5.4' },
      { label:'RF Caja escalera',  val: termica.rf_cajas_esc?.rf,   max: getRFOGUC(uso, proy.destinoOGUC||(USO_TO_OGUC[uso]?.length===1?USO_TO_OGUC[uso][0]:''), proy.superficie, proy.pisos, 'cajas_esc') ? `≥ ${getRFOGUC(uso, proy.destinoOGUC||(USO_TO_OGUC[uso]?.length===1?USO_TO_OGUC[uso][0]:''), proy.superficie, proy.pisos, 'cajas_esc')?.rf}` : '—', ok: !termica.rf_cajas_esc?.rf || true, norma:'OGUC Art. 4.5.7 Col.(4)' },
      { label:'RF Escaleras',      val: termica.rf_escaleras?.rf,   max:`≥ ${RF_DEF[uso]?.escaleras}`,ok: !termica.rf_escaleras?.rf   || rfN(termica.rf_escaleras.rf)  >= rfN(RF_DEF[uso]?.escaleras||'F0'), norma:'OGUC Art. 4.5.7 Col.(9)' },
      { label:'RF Cubierta',       val: termica.rf_cubierta?.rf,    max:`≥ ${RF_DEF[uso]?.cubierta}`, ok: !termica.rf_cubierta?.rf    || rfN(termica.rf_cubierta.rf)   >= rfN(RF_DEF[uso]?.cubierta||'F0') },
      { label:'Rw entre unidades', val: termica.ac_entre_unidades?.rw ? termica.ac_entre_unidades.rw+' dB':null, max:`≥ ${AC_DEF[uso]?.entre_unidades} dB`, ok: !termica.ac_entre_unidades?.rw || parseFloat(termica.ac_entre_unidades.rw) >= (AC_DEF[uso]?.entre_unidades||0) },
      { label:'Rw fachada',        val: termica.ac_fachada?.rw      ? termica.ac_fachada.rw+'  dB':null,      max:`≥ ${AC_DEF[uso]?.fachada} dB`,        ok: !termica.ac_fachada?.rw       || parseFloat(termica.ac_fachada.rw)       >= (AC_DEF[uso]?.fachada||0) },
      { label:'Rw entre pisos',    val: termica.ac_entre_pisos?.rw  ? termica.ac_entre_pisos.rw+' dB':null,   max:`≥ ${AC_DEF[uso]?.entre_pisos} dB`,    ok: !termica.ac_entre_pisos?.rw   || parseFloat(termica.ac_entre_pisos.rw)   >= (AC_DEF[uso]?.entre_pisos||0) },
      { label:"L'n,w impacto pisos", val: termica.ac_impacto_pisos?.lnw ? termica.ac_impacto_pisos.lnw+' dB':null, max:`≤ ${AC_IMPACT_DEF[uso]?.entre_pisos} dB`, ok: !termica.ac_impacto_pisos?.lnw || parseFloat(termica.ac_impacto_pisos.lnw) <= (AC_IMPACT_DEF[uso]?.entre_pisos||99) },
    ].filter(c => c.val)
  }, [proy, termica, calcUInit, zona, uso])

  const allOk = checks.every(c => c.ok)

  function getCapasParaSC(sc) {
    if (!sc) return null
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

  async function exportarInforme() {
    // ── Módulos activos (respeta selección manual o usa defaults) ─────────────
    const _uso = proy.uso || ''
    const _reqTermica  = !!proy.zona
    const _reqFuego    = !!(RF_DEF[_uso] && Object.values(RF_DEF[_uso]).some(v => v))
    const _reqAcustica = !!(AC_DEF[_uso] && (AC_DEF[_uso].entre_unidades || AC_DEF[_uso].entre_pisos || AC_DEF[_uso].fachada))
    const _haySistemas = (proy.estructuras?.length || 0) > 1
    const _hayVentanas = fachadas?.some(f => parseFloat(f.vanos) > 0 || parseFloat(f.areaFachada) > 0)
    const _hayNotas    = Object.values(notas || {}).some(v => v?.toString().trim())
    const mods = {
      termica:  modulosInforme?.termica  ?? true,
      fuego:    modulosInforme?.fuego    ?? _reqFuego,
      acustica: modulosInforme?.acustica ?? _reqAcustica,
      sistemas: modulosInforme?.sistemas ?? _haySistemas,
      ventanas: modulosInforme?.ventanas ?? _hayVentanas,
      notas:    modulosInforme?.notas    ?? _hayNotas,
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
    if (faltantes.length > 0) {
      const continuar = window.confirm(
        `⚠ El informe tiene datos incompletos:\n\n${faltantes.map(f => `  • ${f}`).join('\n')}\n\n¿Desea exportar el informe de todas formas?`
      )
      if (!continuar) return
    }
    // Verificar y consumir crédito de proyecto antes de generar
    if (onExportar) {
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
    // Si hay varios sistemas usa el de peor U (más conservador para el informe).
    function getCalcUData(elemKey) {
      const entries = Object.entries(calcUInit || {})
        .filter(([k, v]) => (k === elemKey || k.endsWith('::' + elemKey)) && v)
      if (!entries.length) return null
      // Ordenar por U descendente → tomar el peor caso
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

      // Indicador de si hay diferencia con las capas originales del LOSCAT
      const hayModifCapas = !!(capasModif?.length && capasOriginal?.length)

      // Tabla de capas con R por capa
      let tablaCapa = ''
      if (capas?.length) {
        const rsiKey = el.tipo === 'techumbre' ? 'techo' : el.tipo === 'piso' ? 'piso' : 'muro'
        const RSi = RSI_MAP[rsiKey] || 0.13, RSe = RSE_MAP[rsiKey] || 0.04
        let Racum = 0
        const rows = capas.map((c, i) => {
          const rC = c.esCamara ? RCAMARA : (parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0 ? (parseFloat(c.esp) / 1000) / parseFloat(c.lam) : 0)
          Racum += rC
          const matNorm = c.esCamara ? null : ALL_MATS.find(m => m.n?.toLowerCase() === (c.mat||'').toLowerCase())
          const fuenteLam = c.esCamara ? '—' : (matNorm ? 'NCh853:2021 Anexo / LOSCAT Ed.13' : (c.lam ? 'Dato fabricante / LOSCAT' : '—'))
          return `<tr>
            <td>${i + 1}</td>
            <td>${c.esCamara ? '<i>Cámara de aire</i>' : (c.mat || '—')}</td>
            <td>${c.esCamara ? '—' : (c.lam ?? '—')}</td>
            <td>${c.esCamara ? '—' : (c.esp ?? '—')}</td>
            <td>${c.esCamara ? '≈ 1' : (c.mu ?? '—')}</td>
            <td>${c.esCamara ? '= ' + RCAMARA : (parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0 ? (parseFloat(c.esp) / 1000 / parseFloat(c.lam)).toFixed(4) : '—')}</td>
            <td style="font-size:8.5pt;color:#64748b">${fuenteLam}</td>
          </tr>`
        }).join('')
        const Rtot = RSi + Racum + RSe
        tablaCapa = `<table>
          <tr><th>#</th><th>Material</th><th>λ (W/mK)</th><th>e (mm)</th><th>μ</th><th>R (m²K/W)</th><th>Fuente dato λ</th></tr>
          ${rows}
          <tr class="subtotal"><td colspan="2"><b>RSi — Resistencia sup. interior</b></td><td colspan="3">${rsiKey} (NCh853 Tabla)</td><td><b>${RSi}</b></td><td style="font-size:8.5pt;color:#64748b">NCh853:2021 Tabla E.1</td></tr>
          <tr class="subtotal"><td colspan="2"><b>RSe — Resistencia sup. exterior</b></td><td colspan="3"></td><td><b>${RSe}</b></td><td style="font-size:8.5pt;color:#64748b">NCh853:2021 Tabla E.1</td></tr>
          <tr class="total"><td colspan="2"><b>R<sub>total</sub> = RSi + ΣR<sub>i</sub> + RSe</b></td><td colspan="3"></td><td><b>${Rtot.toFixed(4)} m²K/W</b></td><td></td></tr>
          <tr class="total"><td colspan="2"><b>U = 1 / R<sub>total</sub></b></td><td colspan="3"></td><td><b>${(1 / Rtot).toFixed(4)} W/m²K</b></td><td></td></tr>
        </table>`
      } else if (data?.u) {
        tablaCapa = `<div class="aviso">Valor U ingresado manualmente: <b>${data.u} W/m²K</b> (sin detalle de capas disponible)</div>`
      }

      // Glaser SVG + tabla de interfaces (solo envolvente — no aplica en tabiques)
      const esTabiqueRpt = el.key === 'tabique'
      let glaserHtml = ''
      if (esTabiqueRpt) {
        glaserHtml = `<div class="ok-box" style="color:#0369a1;background:#f0f9ff;border-color:#bae6fd">ℹ Tabique interior — verificación higrotérmica (Método de Glaser, NCh853:2021) no aplica. La norma exige esta verificación solo para elementos de la envolvente en contacto con el exterior.</div>`
      } else if (res) {
        const svgStr = glaserSvgStr(res, capas || [])
        glaserHtml = `
<h3>${el.label} — Verificación higrotérmica (Método de Glaser, NCh853:2021)</h3>
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
  : `<div class="ok-box">✓ Sin condensación intersticial. El ${el.label} cumple las exigencias higrotérmicas de la NCh853:2021.</div>`}
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
      const capasDescr = capas?.filter(c => !c.esCamara).map(c => `${c.mat} (${Math.round(parseFloat(c.esp||0))} mm)`).join(', ')
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

      return `
<h3>${el.label}${sc ? ` — LOSCAT ${sc.cod}` : ''}</h3>
${sc ? `<div class="data-row">
  <div class="data-item"><label>Código LOSCAT</label><span>${sc.cod}</span></div>
  <div class="data-item"><label>Descripción</label><span>${sc.desc}</span></div>
  ${sc.obs ? `<div class="data-item" style="flex-basis:100%"><label>Observaciones técnicas</label><span style="font-weight:normal;font-size:10pt">${sc.obs}</span></div>` : ''}
</div>` : ''}
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
    const _letraRpt    = getLetraOGUC(_destOGUCRpt, proy.superficie, proy.pisos)
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
      // RF requerida: Tabla 1 OGUC si hay letra; si no, fallback a RF_DEF/RF_PISOS
      let req = null
      let fuenteReq = ''
      if (_letraRpt) {
        req = getRFDeLetra(_letraRpt, e.col)
        fuenteReq = `Tabla 1 · Letra ${_letraRpt.toUpperCase()} ${e.colLabel}`
      } else if (e.id === 'estructura') {
        req = RF_PISOS(uso, proy.pisos); fuenteReq = 'RF_DEF approx'
      } else {
        req = RF_DEF[uso]?.[e.id]; fuenteReq = 'RF_DEF approx'
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
        <td style="color:#0369a1;font-weight:700">${e.req ? e.req + ' dB' : '—'}</td>
        <td>${rw && e.req ? `<span class="${ok ? 'badge-ok' : 'badge-no'}">${ok ? 'CUMPLE' : 'NO CUMPLE'}</span>` : '—'}</td>
      </tr>`
    }).join('')
    const lnwImpact = parseFloat(termica.ac_impacto_pisos?.lnw || 0)
    const lnwReq = AC_IMPACT_DEF[uso]?.entre_pisos
    const lnwCumple = !lnwImpact || !lnwReq || lnwImpact <= lnwReq
    const lnwRow = lnwImpact ? `<tr>
      <td>Entre pisos — ruido de impacto L'n,w</td>
      <td><b>${lnwImpact} dB</b></td>
      <td style="color:#0369a1;font-weight:700">${lnwReq ? '≤ '+lnwReq+' dB' : '—'}</td>
      <td>${lnwReq ? `<span class="${lnwCumple?'badge-ok':'badge-no'}">${lnwCumple?'CUMPLE':'NO CUMPLE'}</span>` : '—'}</td>
    </tr>` : ''

    // ── Resumen ejecutivo ─────────────────────────────────────────────────────
    const allOkLocal = checks.every(c => c.ok)

    // Agregar condensación y VPCT al resumen
    const checksExtendido = [...checks]

    // Condensación intersticial por elemento
    const condRows = []
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

    // VPCT fachadas
    const vpctZona2 = zonaData ? VPCT[proy.zona] : null
    if (vpctZona2 && (fachadas||[]).filter(f=>parseFloat(f.areaFachada)>0).length > 0) {
      let vpctCumpleTodo = true
      ;(fachadas||[]).filter(f=>parseFloat(f.areaFachada)>0).forEach(f => {
        const niv = (() => { const u=parseFloat(f.uw); if(!f.uw||isNaN(u)) return null; return u<=2.0?0:u<=3.5?1:2 })()
        const limite = niv!==null && vpctZona2[f.orient] ? vpctZona2[f.orient][niv] : null
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

    const resumenRows = checksExtendido.map(c => {
      const categoria = c.label.startsWith('Muro') || c.label.startsWith('Techo') || c.label.startsWith('Piso') || c.label.startsWith('Puerta') ? 'Térmico' :
        c.label.startsWith('RF') ? 'Incendio' :
        c.label.startsWith('Rw') || c.label.startsWith("L'n,w") ? 'Acústico' :
        c.label.startsWith('Cond.') ? 'Higrotérmico' : 'Otro'
      const catColor = categoria === 'Térmico' ? '#1e40af' : categoria === 'Incendio' ? '#dc2626' : categoria === 'Acústico' ? '#0369a1' : categoria === 'Higrotérmico' ? '#7c3aed' : '#64748b'
      return `<tr>
        <td><span style="font-size:8pt;color:${catColor};font-weight:700;background:${catColor}15;border-radius:3px;padding:1px 5px;margin-right:4px">${categoria}</span><b>${c.label}</b></td>
        <td>${c.val || '—'}</td>
        <td>${c.max || '—'}</td>
        <td>${c.norma ? `<span style="font-size:8pt;color:#64748b">${c.norma}</span>` : ''}</td>
        <td>${c.val ? `<span class="${c.ok ? 'badge-ok' : 'badge-no'}">${c.ok ? 'CUMPLE' : 'NO CUMPLE'}</span>` : '<span style="color:#94a3b8;font-size:9pt">Sin datos</span>'}</td>
      </tr>`
    }).join('')

    // ── VPCT — análisis por fachada ───────────────────────────────────────────
    const vpctZona = zonaData ? VPCT[proy.zona] : null
    const ORIENT_NAME = { N: 'Norte', OP: 'Oriente / Poniente', S: 'Sur' }
    const NIVEL_LABEL = ['Nivel 1 (Uw ≤ 2.0)', 'Nivel 2 (Uw ≤ 3.5)', 'Nivel 3 (Uw > 3.5)']
    const getVpctNivExp = uw => { const u = parseFloat(uw); if (!uw || isNaN(u)) return null; return u <= 2.0 ? 0 : u <= 3.5 ? 1 : 2 }
    const fachadasValidas = (fachadas || []).filter(f => parseFloat(f.areaFachada) > 0)
    let vpctHtml = ''
    if (vpctZona && fachadasValidas.length > 0) {
      const fachadasRows = fachadasValidas.map(f => {
        const area = parseFloat(f.areaFachada), vanos = parseFloat(f.vanos) || 0
        const pct = (vanos / area * 100).toFixed(1)
        const niv = getVpctNivExp(f.uw)
        const limite = niv !== null && vpctZona[f.orient] ? vpctZona[f.orient][niv] : null
        const cumple = limite !== null ? parseFloat(pct) <= limite : true
        return `<tr>
          <td>${f.nombre || '—'}</td>
          <td>${ORIENT_NAME[f.orient] || f.orient}</td>
          <td>${area.toFixed(1)} m²</td>
          <td>${vanos.toFixed(1)} m²</td>
          <td><b>${pct}%</b></td>
          <td>${f.uw ? f.uw + ' W/m²K' : '—'}<br><span style="font-size:8.5pt;color:#64748b">${niv !== null ? NIVEL_LABEL[niv] : '—'}</span></td>
          <td>${limite !== null ? limite + '%' : '—'}</td>
          <td><span class="${cumple ? 'badge-ok' : 'badge-no'}">${cumple ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
        </tr>`
      }).join('')
      const orientKeys = [...new Set(fachadasValidas.map(f => f.orient))]
      const summaryRows = orientKeys.map(orient => {
        const facs = fachadasValidas.filter(f => f.orient === orient)
        const totalArea = facs.reduce((s, f) => s + (parseFloat(f.areaFachada) || 0), 0)
        const totalVanos = facs.reduce((s, f) => s + (parseFloat(f.vanos) || 0), 0)
        const pct = totalArea > 0 ? (totalVanos / totalArea * 100).toFixed(1) : '—'
        const nivMax = Math.max(...facs.map(f => getVpctNivExp(f.uw)).filter(n => n !== null), 0)
        const limite = vpctZona[orient] ? vpctZona[orient][nivMax] : null
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
<h2>Módulo 5 — Ventanas y Vanos (VPCT, DS N°15 MINVU)</h2>
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
<div style="font-size:8.5pt;color:#64748b;margin-top:4px">VPCT = Porcentaje de Vano / Área de Fachada · DS N°15 MINVU Tabla 3 · Zona ${proy.zona} · Nivel VPCT según Uw: Nivel 1 (≤2.0 W/m²K) · Nivel 2 (≤3.5 W/m²K) · Nivel 3 ({'>'}3.5 W/m²K)</div>`
    } else if (vpctZona) {
      vpctHtml = `
<h2>Módulo 5 — Vanos y Ventilación (VPCT, DS N°15)</h2>
<div class="aviso">Sin fachadas ingresadas en la pestaña Ventana. Los límites VPCT para Zona ${proy.zona} son:</div>
<table>
  <tr><th>Orientación</th><th>Nivel 1 (Uw≤2.0)</th><th>Nivel 2 (Uw≤3.5)</th><th>Nivel 3 (Uw>3.5)</th></tr>
  <tr><td><b>Norte</b></td>${vpctZona.N.map(v => `<td>${v}%</td>`).join('')}</tr>
  <tr><td><b>Oriente / Poniente</b></td>${vpctZona.OP.map(v => `<td>${v}%</td>`).join('')}</tr>
  <tr><td><b>Sur</b></td>${vpctZona.S.map(v => `<td>${v}%</td>`).join('')}</tr>
</table>`
    }

    // ── Notas del proyectista ─────────────────────────────────────────────────
    const TAB_NAMES_RPT = { diagnostico:'Diagnóstico', soluciones:'Soluciones', termica:'Térmica', fuego:'Fuego', acustica:'Acústica', calcU:'Cálculo U', ventana:'Ventana', resultados:'Resultados' }
    const notasEntries = Object.entries(notas || {}).filter(([, v]) => v?.trim())
    const notasHtml = notasEntries.length > 0 ? `
<h2>Módulo 6 — Notas y observaciones del proyectista</h2>
${notasEntries.map(([k, v]) => `
<div style="margin-bottom:12px">
  <div style="font-weight:700;color:#1e40af;font-size:10pt;margin-bottom:4px;border-left:3px solid #93c5fd;padding-left:8px">${TAB_NAMES_RPT[k] || k}</div>
  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:10pt;white-space:pre-wrap;line-height:1.6;color:#1e293b">${v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
</div>`).join('')}` : ''

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Memoria de Cálculo DOM — ${proy.nombre || 'Proyecto'}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 10.5pt; color: #1e293b; max-width: 820px; margin: 30px auto; padding: 0 24px }
  h1 { font-size: 15pt; color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 8px; margin-bottom: 4px }
  h2 { font-size: 12.5pt; color: #1e40af; margin-top: 28px; margin-bottom: 8px; border-left: 4px solid #1e40af; padding-left: 9px; page-break-before: auto }
  h3 { font-size: 11pt; color: #374151; margin-top: 16px; margin-bottom: 5px; border-left: 3px solid #93c5fd; padding-left: 7px }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5pt }
  th { background: #f1f5f9; padding: 6px 8px; text-align: left; border: 1px solid #cbd5e1; font-weight: 700 }
  td { padding: 5px 8px; border: 1px solid #e2e8f0 }
  tr.subtotal td { background: #f8fafc; font-weight: 600 }
  tr.total td { background: #dbeafe; font-weight: 700 }
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
  hr.sep { margin: 24px 0; border: none; border-top: 1px dashed #cbd5e1 }
  .nota { font-size: 8.5pt; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 10px; text-align: center; line-height: 1.6 }
  .mem-desc { background: #f0f9ff; border: 1px solid #bae6fd; border-left: 4px solid #0369a1; border-radius: 6px; padding: 12px 16px; margin: 10px 0; font-size: 9.5pt; line-height: 1.7 }
  .mem-desc-title { font-weight: 700; color: #0369a1; font-size: 10pt; margin-bottom: 6px }
  .mem-desc p { margin: 4px 0 }
  .traz-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 16px; margin: 8px 0; font-size: 9pt }
  .traz-box table { font-size: 9pt; margin: 0 }
  .traz-box th { background: #f1f5f9; font-size: 8.5pt }
  .traz-box td { padding: 3px 6px }
  .firma-box { border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; margin: 10px 0; page-break-inside: avoid }
  .firma-linea { border-bottom: 1px solid #94a3b8; height: 52px; margin: 8px 0 2px }
  @media print {
    body { margin: 10px; padding: 0 12px }
    h2 { page-break-before: always }
    h2:first-of-type { page-break-before: avoid }
    .fig svg { max-width: 100% }
  }
</style>
</head>
<body>

<!-- ══ PORTADA NORMACHECK ══════════════════════════════════════════════════ -->
<div style="background:linear-gradient(135deg,#1e40af,#0369a1);color:#fff;padding:24px 32px;border-radius:10px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;gap:20px">
  <div style="display:flex;align-items:center;gap:16px;flex:1">
    ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:80px;width:auto;border-radius:8px;flex-shrink:0" alt="NormaCheck"/>` : '<div style="font-size:24px;font-weight:900">NormaCheck</div>'}
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
<div style="margin-top:12px;padding:12px 16px;background:#eff6ff;border-radius:8px;border-left:4px solid #1e40af;display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">
  ${proy.propietario ? `
  <div style="flex:1;min-width:180px;padding-right:16px;border-right:1px solid #bfdbfe">
    <div style="font-size:9pt;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Propietario / Mandante</div>
    <div style="font-weight:700;font-size:12pt;color:#1e293b">${proy.propietario}</div>
    ${proy.rutPropietario ? `<div style="font-size:10pt;color:#475569">RUT: ${proy.rutPropietario}</div>` : ''}
    ${proy.direccion ? `<div style="font-size:10pt;color:#475569">📍 ${proy.direccion}</div>` : ''}
    ${proy.rolAvaluo ? `<div style="font-size:10pt;color:#64748b">Rol de avalúo: ${proy.rolAvaluo}</div>` : ''}
  </div>` : ''}
  <div style="flex:1;min-width:180px">
    <div style="font-size:9pt;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Profesional Responsable</div>
    <div style="font-weight:800;font-size:13pt;color:#1e293b">${proy.profesional || proy.arq || '—'}</div>
    ${proy.titulo ? `<div style="font-size:11pt;color:#475569">${proy.titulo}</div>` : ''}
    ${proy.rol ? `<div style="font-size:10pt;color:#64748b">${proy.rol}</div>` : ''}
  </div>
  ${proy.email || proy.telefono ? `
  <div style="flex:1;min-width:140px">
    <div style="font-size:9pt;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Contacto</div>
    ${proy.email ? `<div style="font-size:10pt;color:#475569">✉ ${proy.email}</div>` : ''}
    ${proy.telefono ? `<div style="font-size:10pt;color:#475569">☎ ${proy.telefono}</div>` : ''}
  </div>` : ''}
</div>` : ''}

<h2>Resumen ejecutivo — Estado de cumplimiento</h2>
<div style="font-size:8.5pt;color:#64748b;margin-bottom:8px">
  Consolidación automática de todas las verificaciones normativas realizadas. Los elementos sin datos ingresados se muestran como "Sin datos" y no afectan el estado general.
</div>
${checksExtendido.length === 0 ? '<div class="aviso">Sin parámetros verificados. Complete los módulos Térmica, Fuego y Acústica.</div>' : `
<div class="${allOkLocal ? 'resumen-ok' : 'resumen-no'}">${allOkLocal ? '✅ El proyecto CUMPLE con todos los parámetros verificados.' : '❌ El proyecto NO CUMPLE con uno o más requisitos — ver detalle a continuación.'}</div>
<table>
  <tr><th>Módulo / Elemento</th><th>Valor calculado</th><th>Exigencia normativa</th><th>Norma / Tabla</th><th>Estado</th></tr>
  ${resumenRows}
</table>`}

<h2>Módulo 1 — Diagnóstico del proyecto</h2>
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
  ${(() => { const d=proy.destinoOGUC||(USO_TO_OGUC[uso]?.length===1?USO_TO_OGUC[uso][0]:''); const l=getLetraOGUC(d,proy.superficie,proy.pisos); return l?`<tr style="background:#dcfce7"><td><b>Letra OGUC (Tabla 1)</b></td><td><b style="font-size:12pt;color:#166534">${l.toUpperCase()}</b> — determina RF por elemento constructivo</td><td>OGUC Tít. 4 Cap. 3 Tabla 1</td></tr>`:'' })()}
  <tr><td>Sistema estructural</td><td><b>${proy.estructura || '—'}</b></td><td>LOFC Ed.17 2025</td></tr>
  ${zonaData ? `<tr><td>Ti diseño / Te diseño / HR diseño</td><td><b>${zonaData.Ti}°C / ${zonaData.Te}°C / ${zonaData.HR}%</b></td><td>DS N°15 Tabla 2</td></tr>` : ''}
  ${RIESGO_INC[uso] ? `<tr><td>Riesgo de incendio</td><td><b>${RIESGO_INC[uso]}</b></td><td>OGUC Tít. 4 Cap. 3 / LOFC Ed.17</td></tr>` : ''}
  ${proy.estructura && OBS_EST[proy.estructura] ? `<tr><td>RF intrínseca estimada</td><td colspan="2" style="font-size:9pt">${OBS_EST[proy.estructura]}</td></tr>` : ''}
</table>

${mods.termica ? `<h2>Módulo 2 — Verificación Térmica (DS N°15 MINVU / NCh853:2021 / ISO 6946)</h2>
<div class="traz-box">
  <table>
    <tr><th style="min-width:140px">Marco normativo</th><th>Descripción</th></tr>
    <tr><td><b>DS N°15 MINVU</b></td><td>Reglamento de instalaciones térmicas — establece U máx. por elemento y zona</td></tr>
    <tr><td><b>NCh853:2021</b></td><td>Acondicionamiento térmico — cálculo de transmitancia y verificación higrotérmica</td></tr>
    <tr><td><b>ISO 6946:2017</b></td><td>Resistencias térmicas en componentes de edificación — método de cálculo</td></tr>
    <tr><td><b>EN ISO 13788</b></td><td>Método de Glaser — verificación de condensación intersticial</td></tr>
    <tr><td><b>Zona térmica aplicada</b></td><td>${proy.zona || '—'} — ${ZONAS[proy.zona]?.n || '—'} · Ti = ${zonaData?.Ti ?? '—'}°C · Te = ${zonaData?.Te ?? '—'}°C · HR interior = ${zonaData?.HR ?? '—'}%</td></tr>
    <tr><td><b>U máx. muro</b></td><td>${zonaData?.muro ? `≤ ${zonaData.muro} W/m²K (DS N°15 Tabla 3)` : '—'}</td></tr>
    <tr><td><b>U máx. techo</b></td><td>${zonaData?.techo ? `≤ ${zonaData.techo} W/m²K (DS N°15 Tabla 3)` : '—'}</td></tr>
    <tr><td><b>U máx. piso</b></td><td>${zonaData?.piso ? `≤ ${zonaData.piso} W/m²K (DS N°15 Tabla 3)` : '—'}</td></tr>
  </table>
</div>
<div style="font-size:9.5pt;color:#64748b;margin-bottom:8px">
  Método de cálculo: Resistencias en serie ISO 6946 · Condensación intersticial: Método de Glaser (NCh853:2021 / EN ISO 13788) ·
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
<h2>Módulo 2b — Soluciones constructivas por sistema estructural</h2>
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
    <th>U propuesta (W/m²K)</th>
    <th>U máx DS N°15</th>
    <th>RF</th>
    <th>Estado</th>
  </tr>
  ${ests.flatMap(est =>
    ELEMS_RPT.filter(k => est.soluciones[k]).map(k => {
      const d = est.soluciones[k]
      const umax = umaxMap[k]
      const uV = parseFloat(d.u || 0)
      const okU = !umax || uV <= umax
      const rfReqMap = { muro: RF_PISOS(uso, proy.pisos), techo: RF_DEF[uso]?.cubierta, piso: RF_PISOS(uso, proy.pisos), tabique: RF_DEF[uso]?.muros_sep }
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
</table>`
})() : ''}

${mods.fuego ? `<h2>Módulo 3 — Resistencia al Fuego (OGUC Tít. 4 Cap. 3 · Art. 4.5.4 / LOFC Ed.17 2025)</h2>
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
    const l = getLetraOGUC(d, proy.superficie, proy.pisos)
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

${mods.acustica ? `<h2>Módulo 4 — Aislamiento Acústico (OGUC Art. 4.1.6 / NCh352:2013)</h2>
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

${mods.notas ? notasHtml : ''}

<!-- ══ MÓDULO 7 — RESPONSABILIDAD PROFESIONAL ══════════════════════════════ -->
<h2>Módulo 7 — Responsabilidad Profesional</h2>
<div style="font-size:9pt;color:#64748b;margin-bottom:10px">
  Según OGUC Art. 1.2.2, el profesional competente es responsable de la revisión técnica, firma y presentación del expediente al DOM.
  Esta memoria de cálculo es un documento de apoyo técnico que debe ser revisado, firmado y timbrado por el profesional responsable antes de su presentación oficial.
</div>
<div class="firma-box">
  <table style="width:100%;font-size:10pt">
    <tr>
      <td style="width:50%;padding-right:20px;border-right:1px solid #e2e8f0;vertical-align:top">
        <div style="font-size:9pt;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Profesional Responsable</div>
        <table style="font-size:10pt;width:100%">
          <tr><td style="padding:4px 0;color:#64748b;width:40%">Nombre</td><td style="font-weight:700">${proy.profesional || proy.arq || '[No ingresado]'}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">Profesión / Título</td><td>${proy.titulo || '[No ingresado]'}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">RUT</td><td>${proy.rutProfesional || '[No ingresado]'}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">Rol</td><td>${proy.rol || '[No ingresado]'}</td></tr>
          ${proy.email ? `<tr><td style="padding:4px 0;color:#64748b">Email</td><td>${proy.email}</td></tr>` : ''}
          ${proy.telefono ? `<tr><td style="padding:4px 0;color:#64748b">Teléfono</td><td>${proy.telefono}</td></tr>` : ''}
          <tr><td style="padding:4px 0;color:#64748b">Fecha de emisión</td><td><b>${fechaHoy}</b></td></tr>
        </table>
      </td>
      <td style="width:50%;padding-left:20px;vertical-align:top">
        <div style="font-size:9pt;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Firma y Timbre</div>
        <div style="height:90px;border:1px dashed #cbd5e1;border-radius:6px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px">
          <span style="font-size:8pt;color:#94a3b8">Firma, timbre y sello del profesional responsable</span>
        </div>
        <div style="margin-top:12px;height:40px;border:1px dashed #e2e8f0;border-radius:4px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px">
          <span style="font-size:8pt;color:#94a3b8">Nombre y RUT (letra de imprenta)</span>
        </div>
      </td>
    </tr>
  </table>
</div>
<div style="margin-top:10px;font-size:8.5pt;color:#64748b;background:#f8fafc;border-radius:6px;padding:10px 14px;line-height:1.7">
  <b>Declaración de responsabilidad:</b> El profesional que firma el presente documento declara haber revisado los cálculos contenidos en esta memoria y asume la responsabilidad técnica de los resultados obtenidos, en conformidad con la OGUC y la normativa vigente aplicable. Los valores de RF requieren respaldo mediante ensayo NCh850 o clasificación LOFC para certificación DOM. Los valores Rw estimados requieren ensayo NCh352.
</div>

<!-- ══ PIE DE PÁGINA ════════════════════════════════════════════════════════ -->
<div style="margin-top:32px;padding:14px 20px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
  <div style="flex:1;min-width:200px">
    ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:40px;width:auto;border-radius:5px;margin-bottom:6px" alt="NormaCheck"/>` : '<b style="color:#1e40af">NormaCheck</b>'}
    <div style="font-size:8pt;color:#94a3b8;line-height:1.6">
      Generado: ${fechaHoy} · Plataforma NormaCheck — Verificación Normativa OGUC<br>
      Normativas: LOSCAT Ed.13 2025 · DS N°15 MINVU · NCh853:2021 · ISO 6946:2017 · OGUC Tít. IV · LOFC Ed.17 2025 · NCh352:2013 · EN ISO 13788
    </div>
  </div>
  <div style="font-size:7.5pt;color:#94a3b8;text-align:right;flex-shrink:0">
    ⚠ Documento preliminar — sujeto a revisión profesional<br>OGUC Art. 1.2.2 · Responsabilidad del proyectista competente
  </div>
</div>
</body></html>`

    const nombreArchivo = (proy.nombre || 'informe').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').trim().replace(/\s+/g, '-') + '-' + fechaHoy.replace(/\//g, '-')

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
      // ── PDF vía diálogo de impresión del navegador (formato por defecto) ─
      const w = window.open('', '_blank')
      if (!w) { alert('El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio y vuelve a intentarlo.'); return }
      w.document.write(html)
      w.document.close()
      setTimeout(() => w.print(), 1000)
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
      <div style={{ ...S.card, border:'1.5px solid #bfdbfe', background:'#f8faff' }}>
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
              key: 'notas', icon: '📝', label: 'Notas del proyectista',
              norma: '',
              req: false, reqMsg: hayNotas ? 'Hay notas ingresadas' : 'Sin notas',
            },
          ].map(({ key, icon, label, norma, req, reqMsg }) => {
            const activo = mods[key]
            return (
              <div key={key} style={{
                border: activo ? (req ? '2px solid #166534' : '1.5px solid #1e40af') : '1px solid #e2e8f0',
                borderRadius:8, padding:'10px 12px',
                background: activo ? (req ? '#f0fdf4' : '#eff6ff') : '#fafafa',
                opacity: activo ? 1 : 0.65,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <span style={{ fontSize:16 }}>{icon}</span>
                  <span style={{ fontWeight:700, fontSize:12, flex:1, color: activo ? '#1e293b' : '#94a3b8' }}>{label}</span>
                  <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer' }}>
                    <input type="checkbox" checked={activo} onChange={() => toggleMod(key)}
                      style={{ width:15, height:15, cursor:'pointer', accentColor: req ? '#166534' : '#1e40af' }} />
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
                    <td style={S.td}><span style={S.badge(c.ok)}>{c.ok ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* ── Selector de formato + botón exportar ──────────────────── */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Píldoras de formato */}
              <div style={{ display: 'flex', gap: 0, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                {[
                  { id: 'pdf',  icon: '🖨',  label: 'PDF',  title: 'Abre el diálogo de impresión → Guardar como PDF' },
                  { id: 'html', icon: '🌐',  label: 'HTML', title: 'Descarga el informe como archivo HTML (se abre en cualquier navegador)' },
                  { id: 'word', icon: '📄',  label: 'Word', title: 'Descarga el informe como archivo .doc (se abre en Microsoft Word o LibreOffice)' },
                ].map((f, i) => (
                  <button key={f.id}
                    title={f.title}
                    onClick={() => setFormatoExport(f.id)}
                    style={{
                      padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      borderLeft: i > 0 ? '1px solid #e2e8f0' : 'none',
                      background: formatoExport === f.id ? '#1e40af' : '#f8fafc',
                      color:      formatoExport === f.id ? '#fff'    : '#64748b',
                      transition: 'background 0.15s',
                    }}>
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>

              {/* Botón principal */}
              <button style={S.btn('#166534')} onClick={exportarInforme}>
                {formatoExport === 'pdf'  && '🖨 Generar PDF'}
                {formatoExport === 'html' && '⬇ Descargar HTML'}
                {formatoExport === 'word' && '⬇ Descargar Word'}
              </button>

              {/* Descripción breve del formato */}
              <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                {formatoExport === 'pdf'  && 'El navegador abre el diálogo de impresión — elige «Guardar como PDF»'}
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
    </div>
  )
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
const TABS = ['Diagnóstico', 'Soluciones', 'Térmica', 'Fuego', 'Acústica', 'Cálculo U', 'Ventana', 'Resultados', '⚙ Admin']

export default function App() {
  return <TokenGate><AppInner /></TokenGate>
}

// ─── Panel admin con sub-pestañas ─────────────────────────────────────────────
function AdminPanel({ onOverridesChanged }) {
  const [subTab, setSubTab] = useState('zonas')
  const stBtnStyle = (active) => ({
    padding: '6px 16px', border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer',
    fontSize: 12, fontWeight: active ? 700 : 400,
    background: active ? '#fff' : 'transparent',
    color: active ? '#1e40af' : '#64748b',
  })
  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 2, background: '#e2e8f0', padding: '4px 4px 0', borderRadius: '8px 8px 0 0', marginBottom: 0 }}>
        <button style={stBtnStyle(subTab === 'zonas')}  onClick={() => setSubTab('zonas')}>🗺 Zonas térmicas</button>
        <button style={stBtnStyle(subTab === 'tokens')} onClick={() => setSubTab('tokens')}>🔑 Tokens</button>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 8px 8px 8px', padding: 16 }}>
        {subTab === 'zonas'  && <AdminZonas  onOverridesChanged={onOverridesChanged} />}
        {subTab === 'tokens' && <AdminTokens />}
      </div>
    </div>
  )
}

function AppInner() {
  const tokenCtx = useToken()
  const [tab, setTab] = useState(0)
  const [proy, setProy] = useState({ nombre: '', propietario: '', rutPropietario: '', direccion: '', rolAvaluo: '', arq: '', comuna: '', zona: '', uso: '', pisos: '2', superficie: '', destinoOGUC: '', estructura: '', estructuras: [], profesional: '', rutProfesional: '', titulo: '', rol: '', email: '', telefono: '', ocupantes: '' })
  const [termica, setTermica] = useState({})
  const [calcUInit, setCalcUInit] = useState({})
  const [exportError, setExportError] = useState('')
  const [notas, setNotas] = useState({})
  // modulosInforme: null = auto (determinado por uso/zona), o {termica,fuego,acustica,ventanas,notas,sistemas}
  const [modulosInforme, setModulosInforme] = useState(null)

  const proyectos = useProjects(tokenCtx?.tokenData?.token)
  const [proyectoActual, setProyectoActual] = useState(null)
  const [showProjects, setShowProjects] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const autoSaveTimer = useRef(null)
  const [showAyuda, setShowAyuda] = useState(false)

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
        'El sistema calcula U (ISO 6946) y verifica condensación intersticial (Glaser, NCh853:2021).',
        'Si hay incumplimientos, aparecen <b>correcciones sugeridas</b> y texto de homologación.',
        'Usa <b>▼/▲</b> para colapsar paneles ya completados.',
      ],
      normativa: 'NCh853:2021 · ISO 6946:2017 · Método de Glaser (EN ISO 13788) · DS N°15 Tabla 1',
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

  // Inyectar CSS responsive móvil
  useEffect(() => {
    if (document.getElementById('nc-mobile-css')) return
    const st = document.createElement('style')
    st.id = 'nc-mobile-css'
    st.textContent = `
      /* ── Sidebar desktop ─────────────────────────── */
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
          scrollbar-color: #bfdbfe transparent;
        }
        .nc-sidebar::-webkit-scrollbar { width: 4px; }
        .nc-sidebar::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 4px; }
        /* Ocultar paneles inline cuando sidebar activo */
        .nc-has-sidebar .nc-ayuda-inline { display: none !important; }
      }
      /* ── Móvil ───────────────────────────────────── */
      @media (max-width: 640px) {
        .nc-body { padding: 8px !important; }
        .nc-tabs { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .nc-tabs::-webkit-scrollbar { display: none; }
        .nc-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .nc-table-scroll table { min-width: 480px; }
        .nc-table-scroll select { width: 130px !important; min-width: 0 !important; }
        .nc-table-scroll input { width: 48px !important; min-width: 0 !important; }
        .nc-header-info { display: none !important; }
        .nc-header-subtitle { display: none !important; }
        .nc-sidebar { display: none !important; }
        .nc-sidebar-btn { display: none !important; }
      }
    `
    document.head.appendChild(st)
  }, [])

  // Restore autosave on mount
  useEffect(() => {
    const saved = proyectos.cargarAutoguardado()
    if (saved) {
      if (saved.proy)            setProy(saved.proy)
      if (saved.termica)         setTermica(saved.termica)
      if (saved.calcUInit)       setCalcUInit(saved.calcUInit)
      if (saved.fachadas)        setFachadas(saved.fachadas)
      if (saved.fachadasNextId)  setFachadasNextId(saved.fachadasNextId)
      if (saved.notas)           setNotas(saved.notas)
    }
  }, [])

  // Auto-save debounced (1.5s after last change)
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      proyectos.autoGuardar({ proy, termica, calcUInit, fachadas, fachadasNextId, notas })
      setHasUnsaved(true)
    }, 1500)
    return () => clearTimeout(autoSaveTimer.current)
  }, [proy, termica, calcUInit, fachadas, fachadasNextId, notas])

  // Callback que llama TabResultados antes de generar el informe
  async function onExportar() {
    const td = tokenCtx?.tokenData
    if (!td) return true  // sin gate (dev) → siempre ok

    // max_proyectos = 0 → ilimitado
    if (td.max_proyectos > 0 && td.proyectos_usados >= td.max_proyectos) {
      setExportError('Has alcanzado el límite de proyectos de tu licencia. Contacta al administrador para renovar.')
      setTimeout(() => setExportError(''), 6000)
      return false
    }

    const ok = await usarProyecto(td.token)
    if (ok && tokenCtx.refreshTokenData) {
      tokenCtx.refreshTokenData({ proyectos_usados: td.proyectos_usados + 1 })
    }
    if (!ok) {
      setExportError('Error al registrar el uso del proyecto. Revisa tu conexión.')
      setTimeout(() => setExportError(''), 5000)
    }
    return ok
  }

  function getData() {
    return { proy, termica, calcUInit, fachadas, fachadasNextId, notas }
  }

  function onCargar(data) {
    if (data.proy)           setProy(data.proy)
    if (data.termica)        setTermica(data.termica)
    if (data.calcUInit)      setCalcUInit(data.calcUInit)
    if (data.fachadas)       setFachadas(data.fachadas)
    if (data.fachadasNextId) setFachadasNextId(data.fachadasNextId)
    if (data.notas)          setNotas(data.notas)
    setHasUnsaved(false)
  }

  function onAplicar(sc, targetId = null) {
    const elem = sc.elem === 'techumbre' ? 'techo' : sc.elem
    const { ev: _ev, ...scClean } = sc
    const solData = {
      u:       String(sc.u),
      rf:      sc.rf    || '',
      rw:      sc.ac_rw ? String(sc.ac_rw) : '',
      solucion: scClean,
    }

    // ── Helper compartido: construir capas para el panel Cálculo U ──────────────
    function buildCalcUCapas() {
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
      // Pre-cargar capas con clave compuesta "estId::elemKey" → un panel propio en Cálculo U
      const calcUCapas = buildCalcUCapas()
      setCalcUInit(prev => ({
        ...prev,
        [`${targetId}::${elem}`]: calcUCapas?.length
          ? { capas: calcUCapas, elem: sc.elem, solucion: { cod: sc.cod, desc: sc.desc, obs: sc.obs, u: sc.u } }
          : null,
      }))
      return
    }

    // Asignación global (sin sistema estructural específico)
    setTermica(t => ({
      ...t,
      [elem]: { ...t[elem], ...solData, rw: sc.ac_rw ? String(sc.ac_rw) : (t[elem]?.rw || '') },
    }))
    const calcUCapas = buildCalcUCapas()
    setCalcUInit(prev => ({
      ...prev,
      [elem]: calcUCapas?.length ? { capas: calcUCapas, elem: sc.elem, solucion: { cod: sc.cod, desc: sc.desc, obs: sc.obs, u: sc.u } } : null,
    }))
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

  function onCalcUChange(elemKey, { capas, res }) {
    // Actualizar calcUInit con las capas modificadas y el resultado calculado.
    // Así exportarInforme y los checks siempre usan el U más reciente del usuario.
    setCalcUInit(prev => ({
      ...prev,
      [elemKey]: {
        ...(prev[elemKey] || {}),
        capas,
        res,  // resultado calcGlaser: { U, Rtot, condInter, ifaces, Tdew, ... }
      }
    }))
  }

  return (
    <div style={S.app} className={`nc-app${showAyuda ? ' nc-has-sidebar' : ''}`}>
      <div style={S.header}>
        {/* Logo NormaCheck */}
        <img src="/logo.png" alt="NormaCheck" style={{ height: 72, width: 'auto', flexShrink: 0, borderRadius: 8 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }} className="nc-header-subtitle">DS N°15 · OGUC Título 4 · NCh853 · NCh1973 · NCh352 · LOSCAT Ed.13 2025</div>
        </div>
        {proy.zona && (
          <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12 }} className="nc-header-info">
            Zona {proy.zona} — {proy.uso || 'sin uso'} {proy.nombre && `| ${proy.nombre}`}
          </div>
        )}
        <button
          onClick={() => setShowProjects(true)}
          style={{ marginLeft: proy.zona ? 8 : 'auto', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
        >
          📁 Proyectos {hasUnsaved && proyectoActual && <span style={{ background:'#f59e0b', borderRadius:10, padding:'1px 6px', fontSize:10 }}>●</span>}
        </button>
      </div>
      {exportError && (
        <div style={{ background: '#fef2f2', borderBottom: '2px solid #fca5a5', padding: '10px 20px', color: '#991b1b', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
          ⚠️ {exportError}
        </div>
      )}
      <div style={{ ...S.tabs, alignItems: 'center' }} className="nc-tabs">
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
        {ayudaData[tab] && (
          <button
            className="nc-sidebar-btn"
            onClick={() => setShowAyuda(v => !v)}
            style={{
              marginLeft: 'auto', marginBottom: 2, padding: '5px 11px',
              background: showAyuda ? '#dbeafe' : '#eff6ff',
              border: `1px solid ${showAyuda ? '#93c5fd' : '#bfdbfe'}`,
              borderRadius: 6, fontSize: 11, fontWeight: 700,
              color: '#1e40af', cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span>ℹ</span>
            {showAyuda ? 'Ocultar guía' : 'Ver guía'}
          </button>
        )}
      </div>
      <div style={S.body} className="nc-body">
        <div className={showAyuda && ayudaData[tab] ? 'nc-with-sidebar' : ''}>
          <div className="nc-content">
            {tab === 0 && (
              <div>
                <TabDiag proy={proy} setProy={setProy} />
                <div style={{ padding: '0 16px 16px' }}>
                  <NotasPanel tabKey="diagnostico" notas={notas} setNotas={setNotas} />
                </div>
              </div>
            )}
            {tab === 1 && <TabSoluciones proy={proy} setProy={setProy} onAplicar={onAplicar} onEnviarCalcU={onEnviarCalcU} notas={notas} setNotas={setNotas} />}
            {tab === 2 && <TabTermica proy={proy} termica={termica} setTermica={setTermica} setTab={setTab} notas={notas} setNotas={setNotas} />}
            {tab === 3 && <TabFuego proy={proy} termica={termica} setTermica={setTermica} notas={notas} setNotas={setNotas} />}
            {tab === 4 && <TabAcustica proy={proy} termica={termica} setTermica={setTermica} notas={notas} setNotas={setNotas} />}
            {tab === 5 && <TabCalcU proy={proy} initData={calcUInit} onLimpiarCalcU={onLimpiarCalcU} onCalcUChange={onCalcUChange} notas={notas} setNotas={setNotas} />}
            {tab === 6 && <TabVentana proy={proy} fachadas={fachadas} setFachadas={setFachadas} fachadasNextId={fachadasNextId} setFachadasNextId={setFachadasNextId} notas={notas} setNotas={setNotas} />}
            {tab === 7 && <TabResultados proy={proy} termica={termica} onExportar={onExportar} notas={notas} setNotas={setNotas} calcUInit={calcUInit} fachadas={fachadas} modulosInforme={modulosInforme} setModulosInforme={setModulosInforme} />}
            {tab === 8 && <AdminPanel onOverridesChanged={() => window.dispatchEvent(new Event('oguc:zonas-updated'))} />}
          </div>
          {showAyuda && ayudaData[tab] && (
            <div className="nc-sidebar">
              <AyudaPanel {...ayudaData[tab]} alwaysOpen />
            </div>
          )}
        </div>
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
    </div>
  )
}
