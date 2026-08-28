import React, { useRef, useEffect, useState } from 'react'
import { layers3D } from '../lib/engines/capas.js'

// ── color helpers ──────────────────────────────────────────────────────────
function toRGB(s) {
  s = String(s).trim()
  if (s[0] === '#') {
    if (s.length === 4) return [17 * parseInt(s[1], 16), 17 * parseInt(s[2], 16), 17 * parseInt(s[3], 16)]
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
  }
  const m = s.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  return m ? [+m[1], +m[2], +m[3]] : [136, 136, 136]
}
function shade(s, f) {
  const c = toRGB(s)
  return `rgb(${Math.min(255, c[0] * f | 0)},${Math.min(255, c[1] * f | 0)},${Math.min(255, c[2] * f | 0)})`
}
const truncar = (s, max = 15) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s)

// Orientación base del elemento: muro/tabique vertical (0), piso horizontal (+90°),
// cubierta inclinada (+60° ≈ pendiente de techo). Se aplica antes del giro del usuario.
// Signo POSITIVO: deja la capa 0 (terminación/exterior, la "de arriba" en el corte)
// en la cara SUPERIOR — así el 3D coincide con el orden del corte 2D.
function baseTiltDe(elemTipo) {
  if (elemTipo === 'piso') return Math.PI / 2
  if (elemTipo === 'techumbre') return Math.PI / 3
  return 0
}

/**
 * Modelo 3D del elemento (Canvas, sin dependencias). Bloques por capa apiladas
 * en profundidad; la cavidad se arma con montantes (según estructura integrada)
 * y aislante entre ellos, con las placas envolviéndola. Rotar/zoom/despiece.
 */
export default function Modelo3D({ capas, elemTipo, invert, pisoSubtipo, height = 340 }) {
  const canvasRef = useRef(null)
  const view = useRef({ yaw: -0.62, pitch: 0.40, zoom: 1.3, explode: 0.3 })
  const dims = useRef({ W: 0, H: 0 })
  const layersRef = useRef([])
  const drawRef = useRef(() => {})
  const [explode, setExplode] = useState(0.3)

  const { layers } = layers3D(capas, elemTipo, { invert, pisoSubtipo })
  layersRef.current = layers
  const baseTilt = useRef(0)
  baseTilt.current = baseTiltDe(elemTipo)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const L = (() => { const l = [0.42, 0.72, 0.56], m = Math.hypot(l[0], l[1], l[2]); return [l[0] / m, l[1] / m, l[2] / m] })()

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      const W = r.width, H = r.height || height
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dims.current = { W, H }
    }
    function rot(p) {
      // 1) inclinación base (orienta el elemento según su tipo)
      const bt = baseTilt.current, cb = Math.cos(bt), sb = Math.sin(bt)
      const x0 = p[0], y0 = p[1] * cb - p[2] * sb, z0 = p[1] * sb + p[2] * cb
      // 2) giro del usuario: yaw (Y) luego pitch (X)
      const { yaw, pitch } = view.current
      const cy = Math.cos(yaw), sy = Math.sin(yaw), x = x0 * cy + z0 * sy, z = -x0 * sy + z0 * cy, y = y0
      const cx = Math.cos(pitch), sx = Math.sin(pitch)
      return [x, y * cx - z * sx, y * sx + z * cx]
    }
    function pushBox(faces, xr, yr, zr, colStr) {
      const C = [[xr[0], yr[0], zr[0]], [xr[1], yr[0], zr[0]], [xr[1], yr[1], zr[0]], [xr[0], yr[1], zr[0]],
                 [xr[0], yr[0], zr[1]], [xr[1], yr[0], zr[1]], [xr[1], yr[1], zr[1]], [xr[0], yr[1], zr[1]]]
      const FS = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [1, 2, 6, 5], [0, 3, 7, 4]]
      const NR = [[0, 0, -1], [0, 0, 1], [0, -1, 0], [0, 1, 0], [1, 0, 0], [-1, 0, 0]]
      FS.forEach((f, fi) => {
        const pr = [rot(C[f[0]]), rot(C[f[1]]), rot(C[f[2]]), rot(C[f[3]])], rn = rot(NR[fi])
        const br = 0.58 + 0.42 * Math.max(0, rn[0] * L[0] + rn[1] * L[1] + rn[2] * L[2])
        faces.push({ pts: pr, fill: shade(colStr, br), dep: (pr[0][2] + pr[1][2] + pr[2][2] + pr[3][2]) / 4 })
      })
    }
    function draw() {
      const ls = layersRef.current
      let { W, H } = dims.current
      if (!W) { resize(); ({ W, H } = dims.current) }
      ctx.clearRect(0, 0, W, H)
      if (!ls.length) return
      const hw = 56, hh = 56, T = ls.reduce((a, l) => a + (l.mm || 2), 0)
      const D = Math.max(24, Math.min(80, T * 0.34))
      const g = view.current.explode * 16, n = ls.length, totalD = D + (n - 1) * g
      let z = -totalD / 2
      const faces = [], labelData = []
      ls.forEach(lay => {
        const t = (lay.mm || 2) / T * D, za = z, zb = z + t
        labelData.push({ name: lay.name, zc: (za + zb) / 2 })
        if (lay.role === 'cavity') {
          const mY = 8, mX = 4, y0 = -hh + mY, y1 = hh - mY, x0 = -hw + mX, x1 = hw - mX
          const ncols = Math.max(2, Math.min(6, Math.round(900 / (lay.studDist || 600))))
          const sw = 5.5
          let start = x0
          for (let c = 0; c < ncols; c++) {
            const sc = x0 + (x1 - x0) * (c + 0.5) / ncols
            pushBox(faces, [start, sc - sw], [y0, y1], [za, zb], lay.color)     // aislante en el vano
            pushBox(faces, [sc - sw, sc + sw], [y0, y1], [za, zb], lay.studColor || '#334155')  // montante
            start = sc + sw
          }
          pushBox(faces, [start, x1], [y0, y1], [za, zb], lay.color)
        } else {
          pushBox(faces, [-hw, hw], [-hh, hh], [za, zb], lay.color)
        }
        z = zb + g
      })
      faces.sort((a, b) => a.dep - b.dep)
      const LABEL_W = 98, cx = (W - LABEL_W) / 2, cy = H / 2, zoom = view.current.zoom
      faces.forEach(f => {
        ctx.beginPath()
        for (let i = 0; i < 4; i++) { const p = f.pts[i], sx = cx + p[0] * zoom, sy = cy - p[1] * zoom; if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy) }
        ctx.closePath(); ctx.fillStyle = f.fill; ctx.fill()
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1
      })
      // ── etiquetas de material con línea guía a cada capa ──────────────────
      const LABEL_X = W - LABEL_W + 4, nL = labelData.length
      ctx.font = '11px system-ui, sans-serif'; ctx.textBaseline = 'middle'
      labelData.forEach((ld, i) => {
        const a = rot([hw * 0.55, hh * 0.55, ld.zc])
        const ax = cx + a[0] * zoom, ay = cy - a[1] * zoom
        const ly = 22 + (nL > 1 ? i * (H - 70) / (nL - 1) : (H - 70) / 2)
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.globalAlpha = 0.8
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(LABEL_X - 5, ly); ctx.stroke(); ctx.globalAlpha = 1
        ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.arc(ax, ay, 1.8, 0, 6.29); ctx.fill()
        ctx.fillStyle = '#334155'; ctx.textAlign = 'left'
        ctx.fillText(truncar(ld.name), LABEL_X, ly)
      })
    }
    drawRef.current = draw

    // interacción
    let drag = false, px = 0, py = 0
    const down = (x, y) => { drag = true; px = x; py = y }
    const move = (x, y) => {
      if (!drag) return
      view.current.yaw += (x - px) * 0.01
      view.current.pitch = Math.max(-1.35, Math.min(1.35, view.current.pitch + (y - py) * 0.01))
      px = x; py = y; draw()
    }
    const up = () => { drag = false }
    const onMD = e => down(e.clientX, e.clientY)
    const onMM = e => move(e.clientX, e.clientY)
    const onTS = e => { const t = e.touches[0]; down(t.clientX, t.clientY) }
    const onTM = e => { const t = e.touches[0]; move(t.clientX, t.clientY); e.preventDefault() }
    const onWheel = e => { view.current.zoom = Math.max(0.6, Math.min(4, view.current.zoom * (e.deltaY < 0 ? 1.1 : 0.9))); draw(); e.preventDefault() }
    const onResize = () => { resize(); draw() }
    canvas.addEventListener('mousedown', onMD)
    window.addEventListener('mousemove', onMM)
    window.addEventListener('mouseup', up)
    canvas.addEventListener('touchstart', onTS, { passive: true })
    canvas.addEventListener('touchmove', onTM, { passive: false })
    canvas.addEventListener('touchend', up)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', onResize)
    resize(); draw()
    // redibujo tardío por si el modal aún no tenía layout
    const t = setTimeout(draw, 60)
    return () => {
      clearTimeout(t)
      canvas.removeEventListener('mousedown', onMD)
      window.removeEventListener('mousemove', onMM)
      window.removeEventListener('mouseup', up)
      canvas.removeEventListener('touchstart', onTS)
      canvas.removeEventListener('touchmove', onTM)
      canvas.removeEventListener('touchend', up)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onResize)
    }
  }, [height])

  // redibujar cuando cambian las capas/orientación
  useEffect(() => { drawRef.current() }, [layers, invert, pisoSubtipo, elemTipo])

  const zoomBy = f => { view.current.zoom = Math.max(0.6, Math.min(4, view.current.zoom * f)); drawRef.current() }
  const reset = () => { view.current = { yaw: -0.62, pitch: 0.40, zoom: 1.3, explode }; drawRef.current() }
  const onExplode = e => { const v = parseFloat(e.target.value); view.current.explode = v; setExplode(v); drawRef.current() }

  const btn = { width: 30, height: 30, borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 15, lineHeight: 1 }
  return (
    <div>
      <div style={{ position: 'relative', borderRadius: 10, border: '1px solid #e2e8f0',
        background: 'radial-gradient(120% 90% at 50% 8%, #eef2f1, #f6f8f8)', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height, cursor: 'grab', touchAction: 'none' }} />
        <div style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', gap: 6 }}>
          <button style={btn} title="Acercar" onClick={() => zoomBy(1.2)}>+</button>
          <button style={btn} title="Alejar" onClick={() => zoomBy(0.83)}>−</button>
          <button style={btn} title="Reiniciar vista" onClick={reset}>⟲</button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, fontSize: 12, color: '#64748b' }}>
        <span style={{ whiteSpace: 'nowrap' }}>Despiece</span>
        <input type="range" min={0} max={1} step={0.02} value={explode} onChange={onExplode}
          style={{ flex: 1, accentColor: '#0f766e' }} aria-label="Separar las capas" />
        <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>arrastra para rotar</span>
      </div>
    </div>
  )
}
