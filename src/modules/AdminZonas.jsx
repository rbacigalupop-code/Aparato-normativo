// ─── MÓDULO: ADMIN — GESTIÓN DE ZONAS TÉRMICAS ────────────────────────────────
// Permite al administrador cargar la tabla oficial DITEC (XLSX, CSV o JSON)
// para corregir o actualizar las asignaciones comuna → zona térmica.
// Los datos cargados se persisten en localStorage y tienen prioridad
// sobre los datos hardcoded en data.js.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useCallback } from 'react'
import {
  getOverrides, getMeta, saveOverrides, clearOverrides,
  exportOverridesJSON, parseCSV, parseJSON, parseXLSX,
} from '../utils/zonaStorage.js'
import { COMUNAS_ZONA } from '../data.js'

const VALID_ZONAS = ['A','B','C','D','E','F','G','H','I']
const ZONA_COLORS = { A:'#fbbf24',B:'#f97316',C:'#ef4444',D:'#f43f5e',E:'#06b6d4',F:'#22c55e',G:'#3b82f6',H:'#6366f1',I:'#1e3a8a' }
const zonaChip = z => ({
  display:'inline-block', padding:'1px 7px', borderRadius:10,
  background: ZONA_COLORS[z]+'22', border:`1px solid ${ZONA_COLORS[z]}`,
  fontWeight:700, fontSize:11, color: ZONA_COLORS[z],
})

const S = {
  card:   { background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:16, marginBottom:12 },
  h2:     { fontSize:15, fontWeight:700, color:'#1e40af', margin:'0 0 12px 0' },
  h3:     { fontSize:12, fontWeight:700, color:'#374151', margin:'0 0 8px 0', textTransform:'uppercase', letterSpacing:'0.05em' },
  sep:    { borderTop:'1px solid #f1f5f9', margin:'14px 0' },
  btn:    (c='#1e40af') => ({ background:c, color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', cursor:'pointer', fontSize:12, fontWeight:600 }),
  btnOut: (c='#64748b') => ({ background:'#fff', color:c, border:`1.5px solid ${c}`, borderRadius:6, padding:'6px 13px', cursor:'pointer', fontSize:12, fontWeight:600 }),
  warn:   { background:'#fef9c3', border:'1px solid #fde047', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#713f12' },
  err:    { background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#991b1b' },
  ok:     { background:'#dcfce7', border:'1px solid #86efac', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#166534' },
  info:   { background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#1e40af' },
  table:  { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:     { background:'#f8fafc', padding:'6px 10px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #e2e8f0', fontSize:11, color:'#64748b' },
  td:     { padding:'5px 10px', borderBottom:'1px solid #f8fafc' },
  drop:   (over) => ({
    border:`2px dashed ${over ? '#3b82f6' : '#cbd5e1'}`, borderRadius:10,
    background: over ? '#eff6ff' : '#f8fafc',
    padding:'32px 20px', textAlign:'center', cursor:'pointer',
    transition:'all 0.15s',
  }),
}

// ── Estadísticas de cobertura contra data.js ─────────────────────────────────
function calcCobertura(overrides) {
  const totalBase = Object.values(COMUNAS_ZONA).flat().length
  const cubiertos = Object.values(COMUNAS_ZONA).flat()
    .filter(c => {
      const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()
      return Object.keys(overrides).some(k => norm(k) === norm(c))
    }).length
  return { totalBase, cubiertos, pct: Math.round(cubiertos/totalBase*100) }
}

// ── Detectar diferencias con data.js ─────────────────────────────────────────
function calcDiffs(overrides) {
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()
  const diffs = []
  for (const [overComuna, overZona] of Object.entries(overrides)) {
    for (const [zonaBase, comunas] of Object.entries(COMUNAS_ZONA)) {
      const match = comunas.find(c => norm(c) === norm(overComuna))
      if (match && zonaBase !== overZona) {
        diffs.push({ comuna: overComuna, zonaBase, zonaOverride: overZona })
      }
    }
  }
  return diffs
}

export default function AdminZonas({ onOverridesChanged }) {
  const [drag, setDrag]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [preview, setPreview]   = useState(null)   // resultado del parser
  const [error, setError]       = useState(null)
  const [fileName, setFileName] = useState(null)
  const [overrides, setOvr]     = useState(() => getOverrides())
  const [meta, setMeta]         = useState(() => getMeta())
  const [busqueda, setBusqueda] = useState('')
  const fileRef = useRef()

  const diffs    = calcDiffs(overrides)
  const cobertura = calcCobertura(overrides)

  // ── Procesar archivo ────────────────────────────────────────────────────────
  async function processFile(file) {
    setError(null)
    setPreview(null)
    setLoading(true)
    setFileName(file.name)

    try {
      let result
      const ext = file.name.split('.').pop().toLowerCase()

      if (ext === 'json') {
        const text = await file.text()
        result = parseJSON(text)
      } else if (ext === 'csv') {
        const text = await file.text()
        result = parseCSV(text)
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer()
        result = await parseXLSX(buf)
      } else {
        setError(`Formato no soportado: .${ext}. Usa .xlsx, .csv o .json`)
        setLoading(false)
        return
      }

      if (result.error) { setError(result.error); setLoading(false); return }
      setPreview(result)
    } catch (e) {
      setError(`Error al procesar el archivo: ${e.message}`)
    }
    setLoading(false)
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  // ── Confirmar carga ──────────────────────────────────────────────────────────
  function confirmar() {
    if (!preview?.map) return
    const newOvr = { ...overrides, ...preview.map }
    saveOverrides(newOvr, { source: fileName, comunasEnArchivo: preview.totalComunas })
    const saved = getOverrides()
    setOvr(saved)
    setMeta(getMeta())
    setPreview(null)
    setFileName(null)
    onOverridesChanged?.(saved)
  }

  // ── Limpiar todo ─────────────────────────────────────────────────────────────
  function limpiar() {
    if (!confirm('¿Borrar todas las correcciones y volver a los datos base de data.js?')) return
    clearOverrides()
    setOvr({})
    setMeta(null)
    onOverridesChanged?.({})
  }

  // ── Filtro de búsqueda para tabla de overrides ────────────────────────────
  const norm = s => s?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()
  const ovList = Object.entries(overrides)
    .filter(([c]) => !busqueda || norm(c).includes(norm(busqueda)))
    .sort((a,b) => a[0].localeCompare(b[0],'es'))

  return (
    <div>
      {/* ── ESTADO ACTUAL ───────────────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h2}>⚙️ Administrador de zonas térmicas</p>
        <div style={S.info}>
          Los datos de esta sección <b>tienen prioridad sobre el código fuente</b>.
          La tabla oficial de referencia es <b>TABLA ZT_REGIONES_PROVINCIAS Y COMUNAS</b> publicada
          por DITEC–MINVU (DS N°15 MINVU vigente 28/11/2025).
        </div>

        <div style={S.sep} />

        {Object.keys(overrides).length === 0 ? (
          <div style={S.warn}>
            Sin correcciones activas. La app usa los datos hardcoded de <code>data.js</code>.
            Carga la tabla DITEC para activar datos oficiales.
          </div>
        ) : (
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {[
              ['Total comunas con override', Object.keys(overrides).length, '#1e40af'],
              ['Difieren de data.js',        diffs.length,                  diffs.length ? '#dc2626' : '#16a34a'],
              ['Cobertura vs data.js',       `${cobertura.pct}%`,           '#0369a1'],
              ['Última carga',               meta?.savedAt ? new Date(meta.savedAt).toLocaleDateString('es-CL') : '—', '#374151'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 16px', minWidth:140 }}>
                <div style={{ fontSize:10, color:'#94a3b8', marginBottom:3 }}>{label}</div>
                <div style={{ fontWeight:800, fontSize:18, color }}>{val}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ZONA DE CARGA ───────────────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h3}>Cargar tabla oficial</p>
        <div style={{ fontSize:12, color:'#64748b', marginBottom:10 }}>
          Formatos aceptados: <b>.xlsx</b> (tabla DITEC original), <b>.csv</b> (exportado desde Excel),
          <b> .json</b> <code style={{fontSize:11}}>{`{"NombreComuna":"ZonaLetra"}`}</code>
        </div>

        {/* Drop zone */}
        <div
          style={S.drop(drag)}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.json"
            style={{ display:'none' }}
            onChange={e => e.target.files[0] && processFile(e.target.files[0])}
          />
          <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
          <div style={{ fontWeight:600, color:'#374151', marginBottom:4 }}>
            {loading ? 'Procesando...' : 'Arrastra aquí o haz clic para seleccionar'}
          </div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>
            TABLA ZT_REGIONES_PROVINCIAS Y COMUNAS.xlsx · tabla_zonas.csv · zonas.json
          </div>
        </div>

        {/* Enlace descarga tabla oficial */}
        <div style={{ marginTop:8, fontSize:11, color:'#64748b' }}>
          💡 Descarga la tabla oficial:{' '}
          <a href="https://www.calificacionenergetica.cl/media/TABLA-ZT_REGIONES_PROVINCIAS-Y-COMUNAS.pdf"
            target="_blank" rel="noreferrer" style={{ color:'#1e40af' }}>
            DITEC — calificacionenergetica.cl
          </a>
        </div>

        {/* Error */}
        {error && <div style={{ ...S.err, marginTop:10 }}>❌ {error}</div>}
      </div>

      {/* ── PREVIEW DEL ARCHIVO ─────────────────────────────────────────────── */}
      {preview && (
        <div style={S.card}>
          <p style={S.h3}>Vista previa — {fileName}</p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
            <span style={{ ...S.ok, padding:'4px 10px' }}>✓ {preview.totalComunas} comunas válidas</span>
            {preview.sheetName && <span style={{ fontSize:11, color:'#64748b' }}>Hoja: <b>{preview.sheetName}</b></span>}
            {Object.keys(preview.altMulti || {}).length > 0 && (
              <span style={{ ...S.warn, padding:'4px 10px' }}>
                ⚠ {Object.keys(preview.altMulti).length} comunas con doble zona por altitud
              </span>
            )}
            {(preview.invalidos || []).length > 0 && (
              <span style={{ ...S.err, padding:'4px 10px' }}>
                {preview.invalidos.length} filas con zona inválida (ignoradas)
              </span>
            )}
          </div>

          {/* Comunas con altitud doble */}
          {Object.keys(preview.altMulti || {}).length > 0 && (
            <>
              <p style={{ ...S.h3, color:'#d97706' }}>⚠ Comunas con zona bifurcada por altitud</p>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>
                Estas comunas tienen distintas zonas según altitud (msnm). Se guarda la zona de menor altitud.
                Puedes crear entradas con sufijo de altitud en el JSON si necesitas precisión.
              </div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Comuna</th>
                  <th style={S.th}>Zona guardada</th>
                  <th style={S.th}>Entradas en archivo</th>
                </tr></thead>
                <tbody>
                  {Object.entries(preview.altMulti).slice(0,20).map(([c, entries]) => (
                    <tr key={c}>
                      <td style={S.td}><b>{c}</b></td>
                      <td style={S.td}><span style={zonaChip(preview.map[c])}>{preview.map[c]}</span></td>
                      <td style={S.td}>{entries.map(e => `${e.altCondicion}: ${e.zona}`).join(' | ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={S.sep} />
            </>
          )}

          {/* Primeras 30 comunas del preview */}
          <p style={S.h3}>Muestra (primeras 30 comunas)</p>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Comuna</th>
              <th style={S.th}>Zona asignada</th>
              <th style={S.th}>Zona actual en app</th>
              <th style={S.th}>Cambio</th>
            </tr></thead>
            <tbody>
              {Object.entries(preview.map).slice(0,30).map(([c, z]) => {
                const norm2 = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()
                let zonaActual = overrides[c] || null
                if (!zonaActual) {
                  for (const [zona, comunas] of Object.entries(COMUNAS_ZONA)) {
                    if (comunas.some(x => norm2(x) === norm2(c))) { zonaActual = zona; break }
                  }
                }
                const cambia = zonaActual && zonaActual !== z
                return (
                  <tr key={c} style={{ background: cambia ? '#fef9c3' : 'transparent' }}>
                    <td style={S.td}>{c}</td>
                    <td style={S.td}><span style={zonaChip(z)}>{z}</span></td>
                    <td style={S.td}>{zonaActual ? <span style={zonaChip(zonaActual)}>{zonaActual}</span> : <span style={{ color:'#94a3b8' }}>—</span>}</td>
                    <td style={S.td}>{cambia ? <span style={{ color:'#d97706', fontWeight:700, fontSize:11 }}>⚠ Cambia</span> : <span style={{ color:'#94a3b8' }}>—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button style={S.btn('#166534')} onClick={confirmar}>
              ✓ Confirmar y guardar {preview.totalComunas} comunas
            </button>
            <button style={S.btnOut()} onClick={() => { setPreview(null); setFileName(null) }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── TABLA DE OVERRIDES ACTIVOS ───────────────────────────────────────── */}
      {Object.keys(overrides).length > 0 && (
        <div style={S.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ ...S.h3, margin:0 }}>Correcciones activas ({Object.keys(overrides).length})</p>
            <div style={{ display:'flex', gap:8 }}>
              <button style={S.btnOut('#0369a1')} onClick={() => exportOverridesJSON(overrides)}>
                ⬇ Exportar JSON
              </button>
              <button style={S.btnOut('#dc2626')} onClick={limpiar}>
                🗑 Limpiar todo
              </button>
            </div>
          </div>

          {/* Diferencias con data.js */}
          {diffs.length > 0 && (
            <div style={{ ...S.warn, marginBottom:10 }}>
              <b>{diffs.length} comunas difieren del código fuente (data.js):</b>{' '}
              {diffs.slice(0,8).map(d => `${d.comuna} (${d.zonaBase}→${d.zonaOverride})`).join(', ')}
              {diffs.length > 8 && ` y ${diffs.length - 8} más...`}
            </div>
          )}

          {/* Búsqueda */}
          <input
            style={{ border:'1.5px solid #cbd5e1', borderRadius:6, padding:'5px 10px', fontSize:12, width:240, marginBottom:10 }}
            placeholder="Buscar comuna..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />

          <div style={{ maxHeight:360, overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:6 }}>
            <table style={S.table}>
              <thead><tr>
                <th style={{ ...S.th, position:'sticky', top:0 }}>Comuna</th>
                <th style={{ ...S.th, position:'sticky', top:0 }}>Zona (override)</th>
                <th style={{ ...S.th, position:'sticky', top:0 }}>Zona base (data.js)</th>
                <th style={{ ...S.th, position:'sticky', top:0 }}>Estado</th>
              </tr></thead>
              <tbody>
                {ovList.map(([c, z]) => {
                  const norm2 = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()
                  let zonaBase = null
                  for (const [zona, comunas] of Object.entries(COMUNAS_ZONA)) {
                    if (comunas.some(x => norm2(x) === norm2(c))) { zonaBase = zona; break }
                  }
                  const diff = zonaBase && zonaBase !== z
                  return (
                    <tr key={c} style={{ background: diff ? '#fef9c3' : 'transparent' }}>
                      <td style={S.td}>{c}</td>
                      <td style={S.td}><span style={zonaChip(z)}>{z}</span></td>
                      <td style={S.td}>{zonaBase ? <span style={zonaChip(zonaBase)}>{zonaBase}</span> : <span style={{ color:'#94a3b8' }}>Nueva</span>}</td>
                      <td style={S.td}>{diff
                        ? <span style={{ color:'#d97706', fontSize:11, fontWeight:700 }}>Corregida</span>
                        : zonaBase ? <span style={{ color:'#16a34a', fontSize:11 }}>Igual</span>
                        : <span style={{ color:'#0369a1', fontSize:11 }}>Nueva</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {meta && (
            <div style={{ marginTop:8, fontSize:11, color:'#94a3b8' }}>
              Última carga: {meta.source} — {new Date(meta.savedAt).toLocaleString('es-CL')} —
              {meta.comunasEnArchivo} comunas procesadas
            </div>
          )}
        </div>
      )}
    </div>
  )
}
