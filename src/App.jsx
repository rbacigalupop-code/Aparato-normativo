import { useState, useMemo, useEffect, useRef, forwardRef } from 'react'
import TokenGate, { useToken } from './TokenGate.jsx'
import { usarProyecto } from './supabase.js'
import { AyudaPanel } from './components/Ayuda.jsx'
import NotasPanel from './NotasPanel.jsx'
import {
  ZONAS, COMUNAS_ZONA, TIPOS, ESTRUCTURAS,
  RF_DEF, RF_EST, AC_DEF, AC_IMPACT_DEF, RIESGO_INC, RF_PISOS, RF_ELEM_REQ, OBS_EST,
  ALL_MATS, RSI_MAP, RSE_MAP, RCAMARA,
  SC, BH, SC_CAPAS, VIDRIOS, MARCOS,
  VPCT, PERM_V, PUERTA_U, PUERTA_P, PUERTA_RF, SOBR_R, INFILT,
  REC_USO, ELEM_NORM, SUBGRUPOS_PUERTA,
  calcU_SC, buildCapas, rfN, colSem, ist,
  calcGlaser, generarCorrecciones,
  getUIdx, MATS
} from './data.js'
import TabDiag from './modules/TabDiag.jsx'
import AdminZonas from './modules/AdminZonas.jsx'
import { useProjects } from './useProjects.js'
import ProjectManager from './ProjectManager.jsx'

// ─── helpers de estilo ─────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: 'system-ui,sans-serif', fontSize: 13, color: '#1e293b', minHeight: '100vh', background: '#f1f5f9' },
  header: { background: 'linear-gradient(135deg,#1e40af,#0369a1)', color: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 },
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

function FichaSCCompleta({ s, uMax, rfReq, acReq }) {
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
}

// Mejoras: #2 Enviar a CalcU · #4 Glaser · #5 Vista gráfica · #7 Exportar ficha · #9 Variantes
function SimuladorCapas({ s, elem, uMax, rfReq, acReq, proy, onEnviarCalcU }) {
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

  if (!bhData && !scRaw) return null

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
}

// ─── PESTAÑA SOLUCIONES ────────────────────────────────────────────────────────
const ELEM_LABELS = { muro:'Muro', tabique:'Tabique', techumbre:'Techumbre', piso:'Piso', ventana:'Ventana', puerta:'Puerta' }
const ELEM_LIST   = ['muro','tabique','techumbre','piso','ventana','puerta']

function TabSoluciones({ proy, onAplicar, onEnviarCalcU, notas, setNotas }) {
  const [elem,      setElem]      = useState('muro')
  const [expandido, setExpandido] = useState(null)
  const [soloOk,    setSoloOk]    = useState(false)
  const [orden,     setOrden]     = useState('cumplimiento')
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroRF,       setFiltroRF]       = useState('')
  const [filtroSistema,  setFiltroSistema]  = useState('')
  const [selComp,   setSelComp]   = useState([])
  const [showComp,  setShowComp]  = useState(false)

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
    const aplica = s.zonas.includes(zona) && s.usos.includes(uso)
    const tOk = !uMax  || s.u <= uMax
    const fOk = !rfReq || !s.rf || rfN(s.rf) >= rfN(rfReq)
    const aOk = !acReq || !s.ac_rw || s.ac_rw >= acReq
    return { aplica, tOk, fOk, aOk, total: (tOk?1:0)+(fOk?1:0)+(aOk?1:0) }
  }

  // ── Lista ordenada ────────────────────────────────────────────────────────
  const soluciones = useMemo(() => {
    let list = SC.filter(s => s.elem === elem).map(s => ({ ...s, ev: evaluar(s) }))
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* ── Cabecera de filtros ──────────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h2}>Soluciones constructivas — LOSCAT Ed.13 2025 · LOFC Ed.17 2025</p>

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
                    {!ev.aplica && (
                      <span style={{ fontSize:10, background:'#f1f5f9', borderRadius:4, padding:'1px 5px', color:'#94a3b8' }}>
                        Fuera de zona/uso
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
                      color: ev.tOk ? '#166534' : '#dc2626',
                      background: ev.tOk ? '#dcfce7' : '#fee2e2',
                    }}>
                      T {ev.tOk ? '✓' : '✗'} U={s.u}{uMax ? ` (≤${uMax})` : ''}
                    </span>
                    {/* Fuego — solo si hay exigencia */}
                    {rfReq && (
                      <span style={{
                        fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 8px',
                        color: ev.fOk ? '#166534' : '#dc2626',
                        background: ev.fOk ? '#dcfce7' : '#fee2e2',
                      }}>
                        F {ev.fOk ? '✓' : '✗'} {s.rf || '—'}{` (≥${rfReq})`}
                      </span>
                    )}
                    {/* Acústica — solo si hay exigencia */}
                    {acReq && (
                      <span style={{
                        fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 8px',
                        color: ev.aOk ? '#166534' : '#dc2626',
                        background: ev.aOk ? '#dcfce7' : '#fee2e2',
                      }}>
                        A {ev.aOk ? '✓' : '✗'} Rw {s.ac_rw ?? '—'}{acReq ? ` (≥${acReq}dB)` : ''}
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
                    Zonas aplicables: {s.zonas} · Usos: {s.usos.join(', ')}
                  </div>

                  {/* ── Alternativas LOSCAT cuando incumple ──────────────────── */}
                  {!ev.aplica && (
                    <div style={{ background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:6, padding:'10px 14px', marginBottom:10 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 }}>⚠ Fuera de zona/uso — Alternativas aplicables para {zona}/{uso}</div>
                      {SC.filter(x => x.elem===elem && x.zonas.includes(zona) && x.usos.includes(uso))
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
                    const alts = SC.filter(x => x.elem===elem && x.zonas.includes(zona) && x.usos.includes(uso) && x.cod!==s.cod)
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
                              <button onClick={()=>onAplicar(x)}
                                style={{ background:'#166534', color:'#fff', border:'none', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                                Aplicar →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Ficha gráfica */}
                  <FichaSCCompleta s={s} uMax={uMax} rfReq={rfReq} acReq={acReq} />

                  {/* Simulador de capas */}
                  <SimuladorCapas
                    s={s} elem={elem}
                    uMax={uMax} rfReq={rfReq} acReq={acReq}
                    proy={proy}
                    onEnviarCalcU={onEnviarCalcU}
                  />
                  <div style={{ marginTop:12 }}>
                    <button style={S.btn('#166534')} onClick={() => onAplicar(s)}>
                      Aplicar al proyecto →
                    </button>
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
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                {selComp.map((sc, i) => (
                  <button key={i} onClick={() => { onAplicar(sc); setShowComp(false) }} style={{ flex: 1, padding: '10px 0', background: i === 0 ? '#1e40af' : '#166534', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    Usar {sc.cod}
                  </button>
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
        const conSol = ['muro','techo','piso','tabique'].filter(k => termica[k]?.solucion)
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
              return (
                <tr key={id} style={{ background: uDisplay&&!cumpleTodo?'#fff5f5':'transparent' }}>
                  <td style={S.td}>
                    <b>{label}</b>
                    {sol && <div style={{ fontSize:10, color:'#1e40af', marginTop:2 }}>📋 {sol.cod}</div>}
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

// ─── PESTAÑA FUEGO ────────────────────────────────────────────────────────────
function TabFuego({ proy, termica, setTermica, notas, setNotas }) {
  const uso = proy.uso || ''
  const rfDef = RF_DEF[uso] || {}
  const set = (id, field, val) => setTermica(t => ({ ...t, [id]: { ...(t[id] || {}), [field]: val } }))

  const VALID_RF = ['F0','F15','F30','F60','F90','F120','F150','F180']

  // RF desde soluciones constructivas aplicadas
  const rfFromSol = {
    estructura: termica.muro?.solucion?.rf || termica.techo?.solucion?.rf || termica.piso?.solucion?.rf || '',
    cubierta:   termica.techo?.solucion?.rf || '',
    muros_sep:  termica.tabique?.solucion?.rf || termica.muro?.solucion?.rf || '',
    escaleras:  '',
  }
  const solForElem = {
    estructura: [termica.muro?.solucion, termica.techo?.solucion, termica.piso?.solucion].filter(Boolean)[0],
    cubierta:   termica.techo?.solucion,
    muros_sep:  termica.tabique?.solucion || termica.muro?.solucion,
    escaleras:  null,
  }

  const elems = [
    { id:'estructura', label:'Estructura principal',       rfReq: proy.pisos ? RF_PISOS(uso, proy.pisos) : rfDef.estructura,
      obs: 'RF según material, pisos y uso. LOFC Ed.17 A.1–A.4.' },
    { id:'muros_sep',  label:'Muros de separación',        rfReq: rfDef.muros_sep,
      obs: 'Muros entre unidades y entre piso/techo de escape. OGUC Art. 4.5.4.' },
    { id:'escaleras',  label:'Escaleras / Vías de escape', rfReq: rfDef.escaleras,
      obs: 'Verificar ensayo NCh850 específico. No hay soluciones SC predefinidas para escaleras.' },
    { id:'cubierta',   label:'Cubierta',                   rfReq: rfDef.cubierta,
      obs: 'Cubierta y estructura de techumbre. OGUC Art. 4.5.5.' },
  ]

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Resistencia al Fuego"
        pasos={[
          'Define primero el <b>uso y número de pisos</b> en Diagnóstico: determinan las exigencias RF mínimas.',
          'Las columnas <b>RF mínima</b> se calculan automáticamente según OGUC Art. 4.5.4 y RF_PISOS(uso, pisos).',
          'La columna <b>Solución SC</b> muestra el RF de la solución LOSCAT aplicada si corresponde al elemento.',
          'Ingresa la <b>RF propuesta</b> manualmente si difiere de la solución o si el elemento no tiene solución aplicada.',
          '<b>Escaleras:</b> No existen soluciones SC predefinidas — la RF debe respaldarse con ensayo NCh850 específico.',
          'La RF intrínseca del sistema estructural se muestra a continuación de la tabla como referencia.',
        ]}
        normativa="OGUC Art. 4.5.4 y 4.5.7 · LOFC Ed.17 2025 · NCh850"
      />
      <div style={S.card}>
        <p style={S.h2}>Resistencia al fuego — {uso || 'sin uso definido'}</p>
        {!uso && <div style={S.warn}>Selecciona uso en Diagnóstico.</div>}
        {uso && !proy.pisos && (
          <div style={{ ...S.warn, marginBottom:8 }}>
            ⚠ <b>Número de pisos no definido</b> — completa el campo en Diagnóstico para calcular la RF de estructura exacta.
            La RF mostrada usa el valor por defecto del uso.
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
        const elemSC = { estructura:'muro', muros_sep:'muro', escaleras:null, cubierta:'techumbre' }[e.id]
        const alts = elemSC ? SC.filter(s => s.elem===elemSC && s.zonas.includes(proy.zona||'D') && s.usos.includes(uso||'Vivienda') && s.rf && rfN(s.rf) >= rfN(e.rfReq)).sort((a,b)=>rfN(b.rf)-rfN(a.rf)).slice(0,4) : []
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
        const alts = elemSC ? SC.filter(s => s.elem===elemSC && s.zonas.includes(proy.zona||'D') && s.usos.includes(uso||'Vivienda') && s.ac_rw && s.ac_rw >= e.req).sort((a,b)=>b.ac_rw-a.ac_rw).slice(0,4) : []
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
function PanelCalcU({ elemKey, elemTipo, label, umax, proy, initData, headerColor }) {
  const zona = proy.zona ? ZONAS[proy.zona] : null
  const [collapsed, setCollapsed] = useState(false)
  const [capas, setCapas] = useState([])
  const [res, setRes] = useState(null)
  const [correc, setCorrec] = useState([])
  const [solucion, setSolucion] = useState(null)
  const [origCapas, setOrigCapas] = useState(null)
  const [showHomolog, setShowHomolog] = useState(false)
  const [showInterpret, setShowInterpret] = useState(false)
  const graphRef = useRef(null)

  useEffect(() => {
    if (!initData?.capas?.length) return
    setCapas(initData.capas)
    setOrigCapas(initData.capas.map(c => ({...c})))
    setSolucion(initData.solucion || null)
    // Auto-calcular inmediatamente con las capas de la solución
    const tiZ = zona?.Ti || 20, teZ = zona?.Te || 5, hrZ = zona?.HR || 70
    const cv = initData.capas.map(c => c.esCamara ? { esCamara: true } : {
      mat: c.mat, lam: parseFloat(c.lam), esp: parseFloat(c.esp) / 1000, mu: parseFloat(c.mu)
    }).filter(c => c.esCamara || (!isNaN(c.lam) && c.lam > 0 && !isNaN(c.esp) && c.esp > 0))
    if (cv.length) {
      const r = calcGlaser(cv, tiZ, teZ, hrZ, elemTipo)
      setRes(r)
      const nec = r?.condInter || (umax && parseFloat(r?.U || 99) > umax)
      setCorrec(nec ? generarCorrecciones(cv, tiZ, teZ, hrZ, elemTipo, umax) : [])
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
  function setMat(id, matName) {
    const m = ALL_MATS.find(x => x.n === matName)
    if (m) setCapas(cs => cs.map(c => c.id === id ? { ...c, mat: m.n, lam: String(m.lam), mu: String(m.mu) } : c))
    else setCapas(cs => cs.map(c => c.id === id ? { ...c, mat: matName } : c))
  }
  function addCamara() {
    setCapas(c => [...c, { id: Date.now(), mat: 'Cámara de aire', lam: '', esp: '', mu: '', esCamara: true }])
  }

  function calcularConCapas(cs) {
    const cv = cs.map(c => c.esCamara ? { esCamara: true } : {
      mat: c.mat, lam: parseFloat(c.lam), esp: parseFloat(c.esp) / 1000, mu: parseFloat(c.mu)
    }).filter(c => c.esCamara || (!isNaN(c.lam) && c.lam > 0 && !isNaN(c.esp) && c.esp > 0))
    if (!cv.length) return
    const r = calcGlaser(cv, ti, te, hr, elemTipo)
    setRes(r)
    const necesita = r?.condInter || (umax && parseFloat(r?.U || 99) > umax)
    setCorrec(necesita ? generarCorrecciones(cv, ti, te, hr, elemTipo, umax) : [])
    setShowHomolog(false)
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

  function aplicarCorreccion(corr) {
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
    const necesita = r?.condInter || (umax && parseFloat(r?.U || 99) > umax)
    setCorrec(necesita ? generarCorrecciones(corr.capasCorregidas, ti, te, hr, elemTipo, umax) : [])
    setShowHomolog(false)
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
              <button onClick={() => { setSolucion(null); setCapas([]); setRes(null); setCorrec([]) }}
                style={{ background:'none', border:'1px solid #bfdbfe', borderRadius:5, padding:'3px 10px', cursor:'pointer', fontSize:11, color:'#64748b' }}>
                ✕ Limpiar
              </button>
            </div>
          )}
          <div style={S.card}>
            <p style={S.h2}>Calculadora U + Condensación (NCh853 / Glaser)</p>
            <div style={{ ...S.col, fontSize: 12, color: '#64748b', marginBottom: 8 }}>
              <span style={S.label}>Condiciones diseño</span>
              Ti: {ti}°C | Te: {te}°C | HR: {hr}% {umax && `| U máx: ${umax} W/m²K`}
            </div>
            <div style={S.sep} />
        <p style={S.h3}>Capas (interior → exterior)</p>
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
              return c.esCamara ? (
                <tr key={c.id} style={{ background:'#eff6ff' }}>
                  <td style={{ ...S.td, color:'#94a3b8', fontSize:10, textAlign:'center' }}>{idx+1}</td>
                  <td style={S.td} colSpan={3}><i>Cámara de aire (R = {RCAMARA} m²K/W)</i></td>
                  <td style={S.td}>≈1</td>
                  <td style={S.td}>{btnMv('↑', ()=>moveUp(c.id), idx===0)}{btnMv('↓', ()=>moveDown(c.id), idx===capas.length-1)}</td>
                  <td style={S.td}><button style={{ ...S.btn('#dc2626'), padding:'2px 8px' }} onClick={()=>delCapa(c.id)}>✕</button></td>
                </tr>
              ) : (
                <tr key={c.id}>
                  <td style={{ ...S.td, color:'#94a3b8', fontSize:10, textAlign:'center' }}>{idx+1}</td>
                  <td style={S.td}>
                    <select style={{ ...ist, width:200 }} value={c.mat} onChange={e=>setMat(c.id,e.target.value)}>
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
                  </td>
                  <td style={S.td}><input style={{ ...ist, width:60 }} value={c.lam} onChange={e=>updCapa(c.id,'lam',e.target.value)} placeholder="0.04"/></td>
                  <td style={S.td}><input style={{ ...ist, width:70 }} value={c.esp} onChange={e=>updCapa(c.id,'esp',e.target.value)} placeholder="100"/></td>
                  <td style={S.td}><input style={{ ...ist, width:60 }} value={c.mu} onChange={e=>updCapa(c.id,'mu',e.target.value)} placeholder="1"/></td>
                  <td style={S.td}>{btnMv('↑', ()=>moveUp(c.id), idx===0)}{btnMv('↓', ()=>moveDown(c.id), idx===capas.length-1)}</td>
                  <td style={S.td}><button style={{ ...S.btn('#dc2626'), padding:'2px 8px' }} onClick={()=>delCapa(c.id)}>✕</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ ...S.row, marginTop:8 }}>
          <button style={S.btn('#64748b')} onClick={addCapa}>+ Capa</button>
          <button style={S.btn('#0369a1')} onClick={addCamara}>+ Cámara</button>
          <button style={S.btn()} onClick={calcular}>Calcular U</button>
          {capas.length>0 && <span style={{ fontSize:11, color:'#94a3b8', alignSelf:'center' }}>↑↓ Mueve capas y recalcula para homologar</span>}
        </div>
      </div>

      {res && (()=>{
        const uCalc        = parseFloat(res.U)
        const cumpleU      = !umax || uCalc <= umax
        const tSupExt      = parseFloat(res.temps[res.temps.length-1]).toFixed(2)
        const supExtBajaTd = parseFloat(tSupExt) < parseFloat(res.Tdew)
        const cumpleTodo   = cumpleU && !res.condInter
        const cambios      = detectarCambios()
        const hayModif     = cambios.length > 0

        return (
        <div>
          {/* ── Panel de diagnóstico de incumplimiento ──────────────────────── */}
          {(!cumpleU || res.condInter) && (
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
                {res.condInter && res.ifaces.filter(f=>f.riesgo).map(f=>(
                  <div key={f.i} style={{ fontSize:12 }}>
                    <b style={{ color:'#dc2626' }}>Condensación en Int. {f.i}:</b> T={f.T}°C — Pvreal ({f.pvReal} Pa) {'>'} Pvsat ({f.pvSat} Pa), déficit <b>{Math.abs(f.margen)} Pa</b>.{' '}
                    <span style={{ color:'#374151' }}>Mueva el aislante hacia la cara exterior (↓) y recalcule.</span>
                  </div>
                ))}
              </div>
              {(res.condInter || !cumpleU) && (
                <div style={{ marginTop:8, fontSize:11, color:'#7f1d1d', background:'#fff1f2', borderRadius:5, padding:'6px 10px' }}>
                  💡 Usa los botones <b>↑↓</b> de la tabla para reordenar capas, ajusta espesores y presiona <b>Calcular U</b> para verificar. Cuando cumpla, se habilitará la homologación.
                </div>
              )}
            </div>
          )}

          <div style={S.card}>
            {/* ── Cards de resumen ───────────────────────────────────────────── */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              {[
                { label:'T rocío',      val:`${res.Tdew}°C`,                             bg:'#f8fafc', border:'#e2e8f0', col:'#374151' },
                { label:'T sup. ext.',  val:`${tSupExt}°C`,                              bg:'#f8fafc', border:'#e2e8f0', col:'#374151' },
                { label:'Sup. exterior',val: supExtBajaTd?'Bajo Td':'Sobre Td',          bg: supExtBajaTd?'#fef9c3':'#f0fdf4', border: supExtBajaTd?'#fde047':'#86efac', col: supExtBajaTd?'#854d0e':'#166534' },
                { label:'Intersticial', val: res.condInter?'RIESGO':'SIN RIESGO',        bg: res.condInter?'#fee2e2':'#dcfce7', border: res.condInter?'#fca5a5':'#86efac', col: res.condInter?'#dc2626':'#166534' },
                { label:'U calculado',  val:`${res.U} W/m²K`,                            bg: colSem(uCalc)+'18', border: colSem(uCalc), col: colSem(uCalc) },
              ].map(c=>(
                <div key={c.label} style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:8, padding:'8px 14px', textAlign:'center', minWidth:100, flex:1 }}>
                  <div style={{ fontSize:10, color:'#64748b', marginBottom:3 }}>{c.label}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:c.col }}>{c.val}</div>
                </div>
              ))}
            </div>
            {umax && <div style={{ marginBottom:10 }}><span style={S.badge(cumpleU)}>{cumpleU?`✓ U cumple DS N°15 (máx ${umax} W/m²K)`:`✗ U no cumple DS N°15 (máx ${umax} W/m²K)`}</span></div>}

            {/* ── Gráfico SVG ────────────────────────────────────────────────── */}
            <GraficoGlaser ref={graphRef} res={res} capas={capas} elemTipo={elemTipo} />
            <div style={{ fontSize:9, color:'#94a3b8', marginBottom:10 }}>
              Azul = temperatura · Naranja = punto de rocío · Rojo = interfaz con riesgo
            </div>

            {/* ── Tabla de interfaces ─────────────────────────────────────────── */}
            {res.ifaces?.length>0&&(
              <>
                <div style={S.sep}/>
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
              </>
            )}

            {/* ── Banners normativos ──────────────────────────────────────────── */}
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

            {/* ── Correcciones sugeridas ──────────────────────────────────────── */}
            {correc.length>0&&(
              <>
                <div style={S.sep}/>
                <p style={S.h3}>Correcciones sugeridas (NCh853)</p>
                {correc.map(c=>(
                  <div key={c.id} style={{ border:`1px solid ${c.color}`, borderRadius:6, padding:'8px 12px', marginBottom:6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
                      <div>
                        <b style={{ color:c.color }}>{c.titulo}</b>
                        <div style={{ fontSize:12, marginTop:4 }}>{c.descripcion}</div>
                        <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{c.cambio} → {c.impactoU}</div>
                      </div>
                      <button onClick={()=>aplicarCorreccion(c)}
                        style={{ background:c.color, color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>
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
function TabCalcU({ proy, initData, notas, setNotas }) {
  const zona = proy.zona ? ZONAS[proy.zona] : null
  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Calculadora U y condensación"
        pasos={[
          'Cada panel corresponde a un elemento constructivo: <b>Muro, Techo, Piso y Tabique</b>. Las condiciones Ti/Te/HR se toman de la zona del proyecto.',
          'Al aplicar una solución constructiva desde la pestaña <b>Soluciones</b>, sus capas se cargan automáticamente en el panel correspondiente.',
          'Puedes <b>agregar, editar, mover o eliminar capas</b> manualmente en cada panel y presionar <b>Calcular U</b>.',
          'El sistema calcula U (ISO 6946) y verifica condensación intersticial (Método de Glaser, NCh853:2021).',
          'Si hay incumplimientos, aparecen <b>correcciones sugeridas</b> y el texto de homologación cuando corresponda.',
          'Usa <b>▼/▲</b> para colapsar paneles que ya estén completos y enfocarte en los pendientes.',
        ]}
        normativa="NCh853:2021 · ISO 6946:2017 · Método de Glaser (EN ISO 13788) · DS N°15 Tabla 1"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PanelCalcU elemKey="muro"    elemTipo="muro"      label="Muro"            umax={zona?.muro}  proy={proy} initData={initData?.muro}    headerColor="#1e40af" />
        <PanelCalcU elemKey="techo"   elemTipo="techumbre" label="Cubierta / Techo" umax={zona?.techo} proy={proy} initData={initData?.techo}   headerColor="#4f46e5" />
        <PanelCalcU elemKey="piso"    elemTipo="piso"      label="Piso"            umax={zona?.piso}  proy={proy} initData={initData?.piso}    headerColor="#166534" />
        <PanelCalcU elemKey="tabique" elemTipo="muro"      label="Tabique"         umax={null}        proy={proy} initData={initData?.tabique} headerColor="#b45309" />
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
function TabResultados({ proy, termica, onExportar, notas, setNotas }) {
  const zona = proy.zona ? ZONAS[proy.zona] : null
  const uso = proy.uso || ''

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
    return [
      { label:'Muro U',            val: termica.muro?.u,            max:`≤ ${zona.muro} W/m²K`,       ok: !termica.muro?.u            || parseFloat(termica.muro.u)            <= zona.muro },
      { label:'Techo U',           val: termica.techo?.u,           max:`≤ ${zona.techo} W/m²K`,      ok: !termica.techo?.u           || parseFloat(termica.techo.u)           <= zona.techo },
      { label:'Piso U',            val: termica.piso?.u,            max:`≤ ${zona.piso} W/m²K`,       ok: !termica.piso?.u            || parseFloat(termica.piso.u)            <= zona.piso },
      { label:'Puerta U',          val: termica.puerta?.u,          max: PUERTA_U[proy.zona]?`≤ ${PUERTA_U[proy.zona]} W/m²K`:'—', ok: !termica.puerta?.u || !PUERTA_U[proy.zona] || parseFloat(termica.puerta.u) <= PUERTA_U[proy.zona] },
      { label:'RF Estructura',     val: termica.rf_estructura?.rf,  max:`≥ ${rfReqEstr}`,             ok: !termica.rf_estructura?.rf  || rfN(termica.rf_estructura.rf) >= rfN(rfReqEstr) },
      { label:'RF Muros sep.',     val: termica.rf_muros_sep?.rf,   max:`≥ ${RF_DEF[uso]?.muros_sep}`,ok: !termica.rf_muros_sep?.rf   || rfN(termica.rf_muros_sep.rf)  >= rfN(RF_DEF[uso]?.muros_sep||'F0') },
      { label:'RF Escaleras',      val: termica.rf_escaleras?.rf,   max:`≥ ${RF_DEF[uso]?.escaleras}`,ok: !termica.rf_escaleras?.rf   || rfN(termica.rf_escaleras.rf)  >= rfN(RF_DEF[uso]?.escaleras||'F0') },
      { label:'RF Cubierta',       val: termica.rf_cubierta?.rf,    max:`≥ ${RF_DEF[uso]?.cubierta}`, ok: !termica.rf_cubierta?.rf    || rfN(termica.rf_cubierta.rf)   >= rfN(RF_DEF[uso]?.cubierta||'F0') },
      { label:'Rw entre unidades', val: termica.ac_entre_unidades?.rw ? termica.ac_entre_unidades.rw+' dB':null, max:`≥ ${AC_DEF[uso]?.entre_unidades} dB`, ok: !termica.ac_entre_unidades?.rw || parseFloat(termica.ac_entre_unidades.rw) >= (AC_DEF[uso]?.entre_unidades||0) },
      { label:'Rw fachada',        val: termica.ac_fachada?.rw      ? termica.ac_fachada.rw+'  dB':null,      max:`≥ ${AC_DEF[uso]?.fachada} dB`,        ok: !termica.ac_fachada?.rw       || parseFloat(termica.ac_fachada.rw)       >= (AC_DEF[uso]?.fachada||0) },
      { label:'Rw entre pisos',    val: termica.ac_entre_pisos?.rw  ? termica.ac_entre_pisos.rw+' dB':null,   max:`≥ ${AC_DEF[uso]?.entre_pisos} dB`,    ok: !termica.ac_entre_pisos?.rw   || parseFloat(termica.ac_entre_pisos.rw)   >= (AC_DEF[uso]?.entre_pisos||0) },
      { label:"L'n,w impacto pisos", val: termica.ac_impacto_pisos?.lnw ? termica.ac_impacto_pisos.lnw+' dB':null, max:`≤ ${AC_IMPACT_DEF[uso]?.entre_pisos} dB`, ok: !termica.ac_impacto_pisos?.lnw || parseFloat(termica.ac_impacto_pisos.lnw) <= (AC_IMPACT_DEF[uso]?.entre_pisos||99) },
    ].filter(c => c.val)
  }, [proy, termica, zona, uso])

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
    // Verificar y consumir crédito de proyecto antes de generar
    if (onExportar) {
      const permitido = await onExportar()
      if (!permitido) return
    }
    const fechaHoy = new Date().toLocaleDateString('es-CL')
    const zonaData = zona

    // ── Sección térmica por elemento ──────────────────────────────────────────
    const seccionesTermicas = ELEMS_DEF.map(el => {
      const data = termica[el.key]
      if (!data?.u && !data?.solucion) return ''
      const sc = data?.solucion
      const capas = sc ? getCapasParaSC(sc) : null
      const cv = capas ? capas.map(c => c.esCamara
        ? { esCamara: true }
        : { mat: c.mat, lam: parseFloat(c.lam), esp: parseFloat(c.esp) / 1000, mu: parseFloat(c.mu || 1) }
      ).filter(c => c.esCamara || (!isNaN(c.lam) && c.lam > 0 && !isNaN(c.esp) && c.esp > 0)) : null

      const res = (cv?.length && zonaData) ? calcGlaser(cv, zonaData.Ti, zonaData.Te, zonaData.HR, el.tipo) : null
      const uCalc = res ? parseFloat(res.U) : (data?.u ? parseFloat(data.u) : null)
      const tbPct = parseFloat(data?.tb || 0)
      const uCalcCorr = (uCalc != null && tbPct > 0) ? uCalc * (1 + tbPct/100) : uCalc
      const cumpleU = el.umax ? (uCalcCorr != null && uCalcCorr <= el.umax) : true

      // Tabla de capas con R por capa
      let tablaCapa = ''
      if (capas?.length) {
        const rsiKey = el.tipo === 'techumbre' ? 'techo' : el.tipo === 'piso' ? 'piso' : 'muro'
        const RSi = RSI_MAP[rsiKey] || 0.13, RSe = RSE_MAP[rsiKey] || 0.04
        let Racum = 0
        const rows = capas.map((c, i) => {
          const rC = c.esCamara ? RCAMARA : (parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0 ? (parseFloat(c.esp) / 1000) / parseFloat(c.lam) : 0)
          Racum += rC
          return `<tr>
            <td>${i + 1}</td>
            <td>${c.esCamara ? '<i>Cámara de aire</i>' : (c.mat || '—')}</td>
            <td>${c.esCamara ? '—' : (c.lam ?? '—')}</td>
            <td>${c.esCamara ? '—' : (c.esp ?? '—')}</td>
            <td>${c.esCamara ? '≈ 1' : (c.mu ?? '—')}</td>
            <td>${c.esCamara ? '= ' + RCAMARA : (parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0 ? (parseFloat(c.esp) / 1000 / parseFloat(c.lam)).toFixed(4) : '—')}</td>
          </tr>`
        }).join('')
        const Rtot = RSi + Racum + RSe
        tablaCapa = `<table>
          <tr><th>#</th><th>Material</th><th>λ (W/mK)</th><th>e (mm)</th><th>μ</th><th>R (m²K/W)</th></tr>
          ${rows}
          <tr class="subtotal"><td colspan="2"><b>RSi — Resistencia sup. interior</b></td><td colspan="3">${rsiKey} (NCh853 Tabla)</td><td><b>${RSi}</b></td></tr>
          <tr class="subtotal"><td colspan="2"><b>RSe — Resistencia sup. exterior</b></td><td colspan="3"></td><td><b>${RSe}</b></td></tr>
          <tr class="total"><td colspan="2"><b>R<sub>total</sub> = RSi + ΣR<sub>i</sub> + RSe</b></td><td colspan="3"></td><td><b>${Rtot.toFixed(4)} m²K/W</b></td></tr>
          <tr class="total"><td colspan="2"><b>U = 1 / R<sub>total</sub></b></td><td colspan="3"></td><td><b>${(1 / Rtot).toFixed(4)} W/m²K</b></td></tr>
        </table>`
      } else if (data?.u) {
        tablaCapa = `<div class="aviso">Valor U ingresado manualmente: <b>${data.u} W/m²K</b> (sin detalle de capas disponible)</div>`
      }

      // Glaser SVG + tabla de interfaces
      let glaserHtml = ''
      if (res) {
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

      return `
<h3>${el.label}${sc ? ` — LOSCAT ${sc.cod}` : ''}</h3>
${sc ? `<div class="data-row">
  <div class="data-item"><label>Código LOSCAT</label><span>${sc.cod}</span></div>
  <div class="data-item"><label>Descripción</label><span>${sc.desc}</span></div>
  ${sc.obs ? `<div class="data-item" style="flex-basis:100%"><label>Observaciones técnicas</label><span style="font-weight:normal;font-size:10pt">${sc.obs}</span></div>` : ''}
</div>` : ''}

${tablaCapa}

<table>
  <tr><th>Criterio normativo</th><th>Valor de diseño</th><th>Exigencia mínima</th><th>Norma / Fuente</th><th>Estado</th></tr>
  ${el.umax ? `<tr>
    <td>Transmitancia térmica U${tbPct > 0 ? ` <span style="font-size:9pt;color:#b45309">(+${tbPct}% puente térmico)</span>` : ''}</td>
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

    // ── Tabla RF por categoría estructural ────────────────────────────────────
    const rfElems = [
      { id: 'estructura', label: 'Estructura principal', req: RF_PISOS(uso, proy.pisos) },
      { id: 'muros_sep',  label: 'Muros de separación',  req: RF_DEF[uso]?.muros_sep },
      { id: 'escaleras',  label: 'Escaleras / Vías de escape', req: RF_DEF[uso]?.escaleras },
      { id: 'cubierta',   label: 'Cubierta',              req: RF_DEF[uso]?.cubierta },
    ]
    const rfFromSol = {
      estructura: termica.muro?.rf || termica.techo?.rf || termica.piso?.rf || '',
      cubierta:   termica.techo?.rf || '',
      muros_sep:  termica.tabique?.rf || termica.muro?.rf || '',
      escaleras:  '',
    }
    const rfRows = rfElems.map(e => {
      const rfP = termica['rf_' + e.id]?.rf || rfFromSol[e.id] || ''
      const ok = !e.req || !rfP || rfN(rfP) >= rfN(e.req)
      const src = termica['rf_' + e.id]?.rf ? 'manual' : rfFromSol[e.id] ? 'solución' : ''
      return `<tr>
        <td>${e.label}</td>
        <td><b>${rfP || '—'}</b>${src ? ` <span style="font-size:9pt;color:#64748b">(${src})</span>` : ''}</td>
        <td style="color:#dc2626;font-weight:700">${e.req || '—'}</td>
        <td>${rfP && e.req ? `<span class="${ok ? 'badge-ok' : 'badge-no'}">${ok ? 'CUMPLE' : 'NO CUMPLE'}</span>` : '—'}</td>
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
    const resumenRows = checks.map(c => `<tr>
      <td><b>${c.label}</b></td>
      <td>${c.val}</td>
      <td>${c.max}</td>
      <td><span class="${c.ok ? 'badge-ok' : 'badge-no'}">${c.ok ? 'CUMPLE' : 'NO CUMPLE'}</span></td>
    </tr>`).join('')

    // ── VPCT ─────────────────────────────────────────────────────────────────
    const vpctZona = zonaData ? VPCT[proy.zona] : null
    const vpctHtml = vpctZona ? `
<h2>Módulo 5 — Vanos y Ventilación (VPCT, DS N°15)</h2>
<table>
  <tr><th>Orientación</th><th>Nivel 1</th><th>Nivel 2</th><th>Nivel 3</th></tr>
  <tr><td><b>Norte</b></td>${vpctZona.N.map(v => `<td>${v}%</td>`).join('')}</tr>
  <tr><td><b>Oriente / Poniente</b></td>${vpctZona.OP.map(v => `<td>${v}%</td>`).join('')}</tr>
  <tr><td><b>Sur</b></td>${vpctZona.S.map(v => `<td>${v}%</td>`).join('')}</tr>
</table>
<div style="font-size:9pt;color:#64748b">VPCT = % vano / fachada por orientación · DS N°15 MINVU · Zona ${proy.zona}</div>` : ''

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
  @media print {
    body { margin: 10px; padding: 0 12px }
    h2 { page-break-before: always }
    h2:first-of-type { page-break-before: avoid }
    .fig svg { max-width: 100% }
  }
</style>
</head>
<body>
<h1>Memoria de Cálculo — Verificación Normativa OGUC</h1>
<div class="data-row">
  <div class="data-item"><label>Proyecto</label><span>${proy.nombre || '[sin nombre]'}</span></div>
  <div class="data-item"><label>Profesional responsable</label><span>${proy.arq || '[sin nombre]'}</span></div>
  <div class="data-item"><label>Comuna</label><span>${proy.comuna || '—'}</span></div>
  <div class="data-item"><label>Zona térmica</label><span>${proy.zona || '—'} — ${ZONAS[proy.zona]?.n || '—'}</span></div>
  <div class="data-item"><label>Uso</label><span>${uso || '—'}</span></div>
  <div class="data-item"><label>Pisos</label><span>${proy.pisos || '—'}</span></div>
  <div class="data-item"><label>Sistema estructural</label><span>${proy.estructura || '—'}</span></div>
  <div class="data-item"><label>Fecha emisión</label><span>${fechaHoy}</span></div>
</div>
${zonaData ? `<div class="aviso">Condiciones de diseño Zona ${proy.zona}: Ti = ${zonaData.Ti}°C · Te = ${zonaData.Te}°C · HR = ${zonaData.HR}% · Exigencias DS N°15: U<sub>muro</sub> ≤ ${zonaData.muro} · U<sub>techo</sub> ≤ ${zonaData.techo} · U<sub>piso</sub> ≤ ${zonaData.piso} W/m²K</div>` : ''}
${proy.profesional ? `
<div style="margin-top:12px; padding:10px 16px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0">
  <div style="font-size:11px; color:#64748b; margin-bottom:4px">PROFESIONAL RESPONSABLE</div>
  <div style="font-weight:700">${proy.profesional}</div>
  ${proy.titulo ? `<div style="font-size:12px; color:#475569">${proy.titulo}</div>` : ''}
  ${proy.registro ? `<div style="font-size:12px; color:#475569">Reg. N° ${proy.registro}</div>` : ''}
  ${proy.email ? `<div style="font-size:12px; color:#475569">${proy.email}</div>` : ''}
</div>` : ''}

<h2>Resumen ejecutivo — Estado de cumplimiento</h2>
${checks.length === 0 ? '<div class="aviso">Sin parámetros verificados. Complete los módulos Térmica, Fuego y Acústica.</div>' : `
<div class="${allOkLocal ? 'resumen-ok' : 'resumen-no'}">${allOkLocal ? '✅ El proyecto CUMPLE con todos los parámetros verificados.' : '❌ El proyecto NO CUMPLE con uno o más requisitos — ver detalle a continuación.'}</div>
<table>
  <tr><th>Parámetro</th><th>Valor propuesto</th><th>Exigencia normativa</th><th>Estado</th></tr>
  ${resumenRows}
</table>`}

<h2>Módulo 1 — Diagnóstico del proyecto</h2>
<table>
  <tr><th>Ítem</th><th>Valor</th><th>Fuente / Norma</th></tr>
  <tr><td>Zona térmica</td><td><b>${proy.zona || '—'} — ${ZONAS[proy.zona]?.n || '—'}</b>${ZONAS[proy.zona]?.ej ? ` (${ZONAS[proy.zona].ej})` : ''}</td><td>DS N°15 MINVU Tabla 1</td></tr>
  <tr><td>Uso del edificio</td><td><b>${uso || '—'}</b></td><td>OGUC Art. 4.5.1</td></tr>
  <tr><td>N° de pisos</td><td><b>${proy.pisos || '—'}</b></td><td>RF_PISOS(uso, pisos) → ${RF_PISOS(uso, proy.pisos) || '—'}</td></tr>
  <tr><td>Sistema estructural</td><td><b>${proy.estructura || '—'}</b></td><td>LOFC Ed.17 2025</td></tr>
  ${zonaData ? `<tr><td>Ti diseño / Te diseño / HR diseño</td><td><b>${zonaData.Ti}°C / ${zonaData.Te}°C / ${zonaData.HR}%</b></td><td>DS N°15 Tabla 2</td></tr>` : ''}
  ${RIESGO_INC[uso] ? `<tr><td>Riesgo de incendio</td><td><b>${RIESGO_INC[uso]}</b></td><td>OGUC / LOFC Ed.17</td></tr>` : ''}
  ${proy.estructura && OBS_EST[proy.estructura] ? `<tr><td>RF intrínseca estimada</td><td colspan="2" style="font-size:9pt">${OBS_EST[proy.estructura]}</td></tr>` : ''}
</table>

<h2>Módulo 2 — Verificación Térmica (DS N°15 MINVU / NCh853:2021 / ISO 6946)</h2>
<div style="font-size:9.5pt;color:#64748b;margin-bottom:8px">
  Método: Resistencias en serie ISO 6946 · Condensación intersticial: Método de Glaser (NCh853:2021 / EN ISO 13788) ·
  Ti = ${zonaData?.Ti ?? '—'}°C · Te = ${zonaData?.Te ?? '—'}°C · HR = ${zonaData?.HR ?? '—'}%
</div>
${seccionesTermicas || '<div class="aviso">Sin soluciones constructivas aplicadas. Aplica soluciones desde la pestaña Soluciones.</div>'}

<h2>Módulo 3 — Resistencia al Fuego (OGUC Art. 4.5.4 / LOFC Ed.17 2025)</h2>
${uso && proy.estructura ? `<div class="aviso"><b>Sistema estructural:</b> ${proy.estructura} → RF base ≈ ${RF_EST?.[proy.estructura] || '—'} · <b>Riesgo:</b> ${RIESGO_INC[uso] || '—'}</div>` : ''}
<table>
  <tr><th>Categoría</th><th>RF propuesta</th><th>RF mínima requerida</th><th>Estado</th></tr>
  ${rfRows || '<tr><td colspan="4" style="color:#94a3b8;text-align:center">Sin datos de resistencia al fuego</td></tr>'}
</table>

<h2>Módulo 4 — Aislamiento Acústico (OGUC Art. 4.1.6 / NCh352:2013)</h2>
<table>
  <tr><th>Tipo de separación</th><th>Rw propuesto</th><th>Rw mínimo NCh352</th><th>Estado</th></tr>
  ${rwRows || '<tr><td colspan="4" style="color:#94a3b8;text-align:center">Sin datos de aislamiento acústico</td></tr>'}
  ${lnwRow}
</table>

${vpctHtml}

<p class="nota">
  Generado por <b>NormaCheck</b> · ${fechaHoy}<br>
  Normativa aplicada: LOSCAT Ed.13 2025 · DS N°15 MINVU · NCh853:2021 · ISO 6946:2017 · OGUC Título IV · LOFC Ed.17 2025 · NCh352:2013<br>
  <b>Nota legal:</b> Esta memoria es de carácter preliminar. El profesional competente es responsable de la revisión, firma y presentación del expediente DOM (OGUC Art. 1.2.2).
</p>
</body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 1000)
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
            <div style={{ marginTop: 12 }}>
              <button style={S.btn('#166534')} onClick={exportarInforme}>🖨 Exportar Informe DOM</button>
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

function AppInner() {
  const tokenCtx = useToken()
  const [tab, setTab] = useState(0)
  const [proy, setProy] = useState({ nombre: '', arq: '', comuna: '', zona: '', uso: '', pisos: '2', estructura: '', estructuras: [], profesional: '', titulo: '', registro: '', email: '', telefono: '' })
  const [termica, setTermica] = useState({})
  const [calcUInit, setCalcUInit] = useState({})
  const [exportError, setExportError] = useState('')
  const [notas, setNotas] = useState({})

  const proyectos = useProjects()
  const [proyectoActual, setProyectoActual] = useState(null)
  const [showProjects, setShowProjects] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const autoSaveTimer = useRef(null)

  // State lifted from TabVentana
  const [fachadas, setFachadas] = useState([
    { id: 1, nombre: '', orient: 'N',  areaFachada: '', vanos: '', uw: '' },
    { id: 2, nombre: '', orient: 'OP', areaFachada: '', vanos: '', uw: '' },
    { id: 3, nombre: '', orient: 'S',  areaFachada: '', vanos: '', uw: '' },
  ])
  const [fachadasNextId, setFachadasNextId] = useState(4)

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

  function onAplicar(sc) {
    const elem = sc.elem === 'techumbre' ? 'techo' : sc.elem
    setTermica(t => ({
      ...t,
      [elem]: {
        ...t[elem],
        u:       String(sc.u),
        rf:      sc.rf      || '',
        rw:      sc.ac_rw   ? String(sc.ac_rw) : (t[elem]?.rw || ''),
        solucion: sc,          // objeto SC completo para mostrar en todos los módulos
      },
    }))
    // Pre-cargar capas en Cálculo U: SC_CAPAS → BH → parse de sc.capas
    const rawCapas = buildCapas(sc.cod)
    const bhItem   = BH.find(b => b.cod === sc.cod)
    let calcUCapas = null

    if (rawCapas?.length) {
      calcUCapas = rawCapas.map(c => ({
        id: Date.now() + Math.random(),
        mat: c.name || c.mat || '', lam: String(c.lam || ''), esp: String(c.esp || ''), mu: String(c.mu || '1'), esCamara: !!c.esCamara,
      }))
    } else if (bhItem?.capas?.length) {
      calcUCapas = bhItem.capas.map(c => ({
        id: Date.now() + Math.random(),
        mat: c.n || '', lam: String(c.lam || ''), esp: String(c.esp || ''), mu: String(c.mu || '1'), esCamara: !!c.esCamara,
      }))
    } else {
      // Fallback: parsear la cadena sc.capas (ej. "H.A. 150 | EPS 60 | ...")
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
      if (parsed.length) calcUCapas = parsed
    }

    // Siempre actualizar calcUInit para reflejar la solución seleccionada
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

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={{ fontSize: 20 }}>🏗️</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>NormaCheck</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>DS N°15 | OGUC Título 4 | NCh853 | NCh1973 | NCh352 | LOSCAT Ed.13 2025</div>
        </div>
        {proy.zona && (
          <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>
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
      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>
      <div style={S.body}>
        {tab === 0 && (
          <div>
            <TabDiag proy={proy} setProy={setProy} />
            <div style={{ padding: '0 16px 16px' }}>
              <NotasPanel tabKey="diagnostico" notas={notas} setNotas={setNotas} />
            </div>
          </div>
        )}
        {tab === 1 && <TabSoluciones proy={proy} onAplicar={onAplicar} onEnviarCalcU={onEnviarCalcU} notas={notas} setNotas={setNotas} />}
        {tab === 2 && <TabTermica proy={proy} termica={termica} setTermica={setTermica} setTab={setTab} notas={notas} setNotas={setNotas} />}
        {tab === 3 && <TabFuego proy={proy} termica={termica} setTermica={setTermica} notas={notas} setNotas={setNotas} />}
        {tab === 4 && <TabAcustica proy={proy} termica={termica} setTermica={setTermica} notas={notas} setNotas={setNotas} />}
        {tab === 5 && <TabCalcU proy={proy} initData={calcUInit} notas={notas} setNotas={setNotas} />}
        {tab === 6 && <TabVentana proy={proy} fachadas={fachadas} setFachadas={setFachadas} fachadasNextId={fachadasNextId} setFachadasNextId={setFachadasNextId} notas={notas} setNotas={setNotas} />}
        {tab === 7 && <TabResultados proy={proy} termica={termica} onExportar={onExportar} notas={notas} setNotas={setNotas} />}
        {tab === 8 && <AdminZonas onOverridesChanged={() => window.dispatchEvent(new Event('oguc:zonas-updated'))} />}
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
