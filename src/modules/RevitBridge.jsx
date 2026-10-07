// ─── MÓDULO: ADMIN — PUENTE BIDIRECCIONAL REVIT (DS N°15 de vanos) ────────────
// Vía de RETORNO del puente Talora ⇄ Revit (RevitMind): lee el estado real del
// modelo (revit_to_talora.json) y emite veredictos DS N°15 por elemento,
// indexados por `revit_uid`, para descargar como talora_to_revit.json.
//
// Funcionalidad EXPERIMENTAL y oculta: vive dentro del panel Admin y está
// protegida por el guard isAdmin (igual que el resto de módulos admin). No
// aparece para usuarios normales.
//
// El motor (procesarEntradaRevit) es puro y vive en lib/engines/revit-import.js;
// este componente solo es la UI de prueba (pegar/subir JSON → ver → descargar).
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { procesarEntradaRevit } from '../lib/engines/revit-import.js'

const S = {
  card:   { background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:16, marginBottom:12 },
  h1:     { fontSize:17, fontWeight:800, color:'#1e293b', margin:0 },
  h2:     { fontSize:15, fontWeight:700, color:'#0e6560', margin:'0 0 12px 0' },
  h3:     { fontSize:12, fontWeight:700, color:'#374151', margin:'0 0 8px 0', textTransform:'uppercase', letterSpacing:'0.05em' },
  btn:    (c='#0e6560') => ({ background:c, color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', cursor:'pointer', fontSize:12, fontWeight:600 }),
  btnOut: (c='#64748b') => ({ background:'#fff', color:c, border:`1.5px solid ${c}`, borderRadius:6, padding:'6px 13px', cursor:'pointer', fontSize:12, fontWeight:600 }),
  ta:     { width:'100%', minHeight:160, fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:11.5, border:'1px solid #cbd5e1', borderRadius:6, padding:10, boxSizing:'border-box', resize:'vertical' },
  err:    { background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#991b1b', marginBottom:12 },
  info:   { background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#0e6560', marginBottom:12 },
  warn:   { background:'#fef9c3', border:'1px solid #fde047', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#713f12', marginBottom:12 },
  table:  { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:     { background:'#f8fafc', padding:'6px 10px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #e2e8f0', fontSize:11, color:'#64748b' },
  td:     { padding:'5px 10px', borderBottom:'1px solid #f8fafc', verticalAlign:'top' },
  mono:   { fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:11 },
}

// Ejemplo de entrada (2-3 caras, varias ventanas + 1 puerta), zona E.
const EJEMPLO = {
  proyecto: { comuna: 'Quillón', zona_termica: 'E' },
  caras: [
    { revit_uid: 'cara-N', azimuth_deg: 10, area_m2: 20, muro_uid: 'm-N' },
    { revit_uid: 'cara-S', azimuth_deg: 175, area_m2: 10, muro_uid: 'm-S' },
    { revit_uid: 'cara-E', azimuth_deg: 95, area_m2: 10, muro_uid: 'm-E' },
  ],
  vanos: [
    { revit_uid: 'v1', tipo: 'ventana', area_m2: 3, cara_uid: 'cara-N', ancho_m: 1.5, alto_m: 2, U_actual: 2.0 },
    { revit_uid: 'v2', tipo: 'ventana', area_m2: 3, cara_uid: 'cara-N', ancho_m: 1.5, alto_m: 2, U_actual: 2.0 },
    { revit_uid: 'v3', tipo: 'ventana', area_m2: 6, cara_uid: 'cara-S', ancho_m: 2, alto_m: 3, U_actual: 3.2 },
    { revit_uid: 'v4', tipo: 'ventana', area_m2: 2, cara_uid: 'cara-E', ancho_m: 1, alto_m: 2, U_actual: 1.2 },
    { revit_uid: 'p1', tipo: 'puerta', area_m2: 1.8, cara_uid: 'cara-E', ancho_m: 0.9, alto_m: 2, U_actual: 1.5 },
  ],
}

// Chip de veredicto: true=verde, false=rojo, null=gris (no evaluable).
function Veredicto({ ok }) {
  const map = ok === true
    ? { bg:'#dcfce7', bd:'#86efac', fg:'#166534', txt:'Cumple' }
    : ok === false
    ? { bg:'#fee2e2', bd:'#fca5a5', fg:'#991b1b', txt:'No cumple' }
    : { bg:'#f1f5f9', bd:'#cbd5e1', fg:'#64748b', txt:'s/ dato' }
  return (
    <span style={{ display:'inline-block', padding:'1px 8px', borderRadius:10, background:map.bg, border:`1px solid ${map.bd}`, color:map.fg, fontWeight:700, fontSize:11 }}>
      {map.txt}
    </span>
  )
}

export default function RevitBridge() {
  const { isAdmin } = useAuth()
  const [texto, setTexto] = useState('')
  const [salida, setSalida] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ ...S.card, color: '#dc2626' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: '0 0 8px 0' }}>Acceso denegado</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>Solo administradores pueden acceder al puente Revit.</p>
        </div>
      </div>
    )
  }

  function procesar(raw) {
    setError('')
    setSalida(null)
    let entrada
    try {
      entrada = JSON.parse(raw)
    } catch (e) {
      setError('El JSON no es válido: ' + (e?.message || 'error de parseo') + '.')
      return
    }
    try {
      setSalida(procesarEntradaRevit(entrada))
    } catch (e) {
      setError('Error procesando la entrada: ' + (e?.message || String(e)) + '.')
    }
  }

  function cargarArchivo(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const raw = String(reader.result || '')
      setTexto(raw)
      procesar(raw)
    }
    reader.onerror = () => setError('No se pudo leer el archivo.')
    reader.readAsText(file)
  }

  function cargarEjemplo() {
    const raw = JSON.stringify(EJEMPLO, null, 2)
    setTexto(raw)
    procesar(raw)
  }

  function descargar() {
    if (!salida) return
    const blob = new Blob([JSON.stringify(salida, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'talora_to_revit.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
        <h1 style={S.h1}>🔗 Puente Revit (DS N°15 de vanos)</h1>
        <span style={{ fontSize: 11, fontWeight: 700, color:'#b45309', background:'#fffbeb', border:'1px solid #fde68a', borderRadius: 10, padding:'2px 10px' }}>
          Experimental · solo admin
        </span>
      </div>

      <div style={S.info}>
        Vía de retorno del puente con RevitMind. Carga <b>revit_to_talora.json</b> (estado real del modelo:
        caras + vanos por <span style={S.mono}>revit_uid</span>) y Talora devuelve los veredictos DS N°15
        por elemento para descargar como <b>talora_to_revit.json</b>. El flujo de 1 vía (Talora → Revit) no cambia.
      </div>

      {/* ── Entrada ───────────────────────────────────────────────────────────── */}
      <div style={S.card}>
        <h3 style={S.h3}>Entrada — revit_to_talora.json</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          <button style={S.btn()} onClick={() => procesar(texto)}>▶ Procesar</button>
          <button style={S.btnOut()} onClick={() => fileRef.current?.click()}>📂 Subir archivo…</button>
          <button style={S.btnOut('#0e6560')} onClick={cargarEjemplo}>🧪 Cargar ejemplo</button>
          <button style={S.btnOut('#94a3b8')} onClick={() => { setTexto(''); setSalida(null); setError('') }}>Limpiar</button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display:'none' }}
                 onChange={e => cargarArchivo(e.target.files?.[0])} />
        </div>
        <textarea
          style={S.ta}
          placeholder='Pega aquí el contenido de revit_to_talora.json…'
          value={texto}
          onChange={e => setTexto(e.target.value)}
        />
      </div>

      {error && <div style={S.err}>⚠ {error}</div>}

      {/* ── Salida ────────────────────────────────────────────────────────────── */}
      {salida && (
        <>
          {/* OGT global */}
          <div style={S.card}>
            <h3 style={S.h3}>Veredicto global (OGT) — envolvente completa</h3>
            <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap', fontSize:13 }}>
              <div><b>Zona térmica:</b> {salida.proyecto.zona_termica ?? '—'}</div>
              <div><b>% vidriado total:</b> {salida.proyecto.ogt.pct_vidriado}%</div>
              <div><b>Límite OGT:</b> {salida.proyecto.ogt.limite_pct ?? '—'}%</div>
              <div><Veredicto ok={salida.proyecto.ogt.cumple} /></div>
            </div>
          </div>

          {/* Caras */}
          <div style={S.card}>
            <h3 style={S.h3}>Caras — % vidriado por orientación</h3>
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>revit_uid</th><th style={S.th}>Orient.</th>
                <th style={S.th}>% vidriado</th><th style={S.th}>Límite</th><th style={S.th}>Veredicto</th>
              </tr></thead>
              <tbody>
                {salida.caras.map(c => (
                  <tr key={c.revit_uid}>
                    <td style={{ ...S.td, ...S.mono }}>{c.revit_uid}</td>
                    <td style={S.td}>{c.orientacion ?? '—'}</td>
                    <td style={S.td}>{c.pct_vidriado}%</td>
                    <td style={S.td}>{c.limite_pct ?? '—'}%</td>
                    <td style={S.td}><Veredicto ok={c.cumple} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vanos */}
          <div style={S.card}>
            <h3 style={S.h3}>Vanos — veredicto por elemento</h3>
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>revit_uid</th><th style={S.th}>Tipo</th>
                <th style={S.th}>U exigido</th><th style={S.th}>Veredicto</th><th style={S.th}>Mensaje</th>
              </tr></thead>
              <tbody>
                {salida.vanos.map(v => (
                  <tr key={v.revit_uid}>
                    <td style={{ ...S.td, ...S.mono }}>{v.revit_uid}</td>
                    <td style={S.td}>{v.tipo}</td>
                    <td style={S.td}>{v.U_exigido ?? '—'}</td>
                    <td style={S.td}><Veredicto ok={v.cumple} /></td>
                    <td style={{ ...S.td, color:'#475569' }}>{v.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button style={S.btn()} onClick={descargar}>⬇ Descargar talora_to_revit.json</button>
          </div>
        </>
      )}
    </div>
  )
}
