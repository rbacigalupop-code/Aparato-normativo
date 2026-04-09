// ─── MÓDULO: DIAGNÓSTICO NORMATIVO ────────────────────────────────────────────
// Normativa: DS N°15 MINVU (vigente 28/11/2025), OGUC Título 4,
//            NCh352, NCh353, NCh1079:2019, LOCF Ed.17 2025
import { useState, useMemo, useRef, useEffect } from 'react'
import { AyudaPanel } from '../components/Ayuda.jsx'
import {
  ZONAS, COMUNAS_ZONA, TIPOS, ESTRUCTURAS,
  RF_DEF, AC_DEF, RIESGO_INC, RF_PISOS, OBS_EST, RF_EST,
  PERM_V, PUERTA_U, PUERTA_P, SOBR_R, INFILT,
} from '../data.js'
import { getOverrides, resolveZona } from '../utils/zonaStorage.js'

// ─── Lookup: todas las comunas (base + overrides) ─────────────────────────────
// Combina las comunas de data.js con las del override (admin).
// Las comunas del override que no están en data.js se agregan dinámicamente.
function buildAllComunas(overrides) {
  const norm = s => s?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()
  const base = Object.entries(COMUNAS_ZONA)
    .flatMap(([zona, comunas]) => comunas.map(c => ({ comuna: c, zona })))

  // Agregar comunas del override que no estén en base
  const extra = Object.entries(overrides)
    .filter(([c]) => !base.some(b => norm(b.comuna) === norm(c)))
    .map(([c, zona]) => ({ comuna: c, zona }))

  return [...base, ...extra].sort((a, b) => a.comuna.localeCompare(b.comuna, 'es'))
}

function comunaAZona(nombre, overrides) {
  return resolveZona(nombre, overrides, COMUNAS_ZONA)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// SOBR_R almacena el valor ×100 (DS N°15). Ej: 45 → 0.45 m²K/W
const sobrDisplay = v => v != null ? (v / 100).toFixed(2) : null

// Zona A es exenta de exigencias térmicas (DS N°15 Art. 1°)
const exenta = zona => zona === 'A'

const na = <span style={{ color: '#94a3b8', fontSize: 11 }}>No aplica — Zona exenta (DS N°15)</span>
const nd = <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>

// ─── Estilos del módulo ───────────────────────────────────────────────────────
const S = {
  card:    { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 12 },
  grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  row:     { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' },
  col:     { display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' },
  label:   (err) => ({ fontSize: 11, fontWeight: 600, color: err ? '#dc2626' : '#64748b' }),
  input:   (err) => ({ border: `1.5px solid ${err ? '#fca5a5' : '#cbd5e1'}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, background: '#fff', width: 180 }),
  sel:     (err) => ({ border: `1.5px solid ${err ? '#fca5a5' : '#cbd5e1'}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, background: '#fff', width: 200 }),
  num:     (err) => ({ border: `1.5px solid ${err ? '#fca5a5' : '#cbd5e1'}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, background: '#fff', width: 70 }),
  h2:      { fontSize: 15, fontWeight: 700, color: '#1e40af', margin: '0 0 12px 0' },
  h3:      { fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  sep:     { borderTop: '1px solid #f1f5f9', margin: '14px 0' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:      { background: '#f8fafc', padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '2px solid #e2e8f0', fontSize: 11, color: '#64748b' },
  td:      { padding: '6px 10px', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  val:     (ok) => ({ fontWeight: 700, color: ok === false ? '#dc2626' : ok === true ? '#166534' : '#1e40af' }),
  chip:    { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#1e40af', fontWeight: 600 },
  warn:    { background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#713f12' },
  err:     { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#991b1b' },
  info:    { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#1e40af' },
  ok:      { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#166534' },
  norm:    { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  dot:     (c) => ({ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, marginRight: 4 }),
}

// ─── Componente: buscador de comunas con typeahead ────────────────────────────
function ComunaSearch({ value, onChange, overrides }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const allComunas = useMemo(() => buildAllComunas(overrides), [overrides])

  // Sincroniza si cambia desde afuera (ej. reset)
  useEffect(() => { setQuery(value || '') }, [value])

  // Cierra dropdown al click afuera
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const resultados = useMemo(() => {
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()
    if (!q || q.length < 2) return []
    return allComunas
      .filter(c => c.comuna.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(q))
      .slice(0, 10)
  }, [query, allComunas])

  function seleccionar(item) {
    setQuery(item.comuna)
    setOpen(false)
    // Usar la zona del override si existe, si no la del item
    const zonaFinal = resolveZona(item.comuna, overrides, COMUNAS_ZONA) || item.zona
    onChange(item.comuna, zonaFinal)
  }

  function handleChange(e) {
    setQuery(e.target.value)
    setOpen(true)
    if (!e.target.value) onChange('', null)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        style={S.input(!!(query && !allComunas.find(c => c.comuna === query)))}
        value={query}
        onChange={handleChange}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder="Escribe para buscar..."
        autoComplete="off"
      />
      {open && resultados.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 999, background: '#fff',
          border: '1px solid #cbd5e1', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          minWidth: 240, maxHeight: 280, overflowY: 'auto', marginTop: 2,
        }}>
          {resultados.map(({ comuna, zona }) => (
            <div key={comuna}
              style={{ padding: '7px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}
              onMouseDown={() => seleccionar({ comuna, zona })}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>{comuna}</span>
              <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', borderRadius: 4, padding: '1px 6px' }}>Zona {zona}</span>
            </div>
          ))}
        </div>
      )}
      {query.length >= 2 && !open && allComunas.find(c => c.comuna === query) && (
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#16a34a', fontSize: 14 }}>✓</span>
      )}
    </div>
  )
}

// ─── Componente: barra de progreso del formulario ────────────────────────────
function ProgresoForm({ proy }) {
  const campos = [
    { key: 'nombre',     label: 'Nombre proyecto',  check: () => !!proy.nombre },
    { key: 'zona',       label: 'Zona térmica',     check: () => !!proy.zona },
    { key: 'uso',        label: 'Uso del edificio', check: () => !!proy.uso },
    { key: 'pisos',      label: 'N° de pisos',      check: () => !!proy.pisos },
    { key: 'estructura', label: 'Estructura',        check: () => (proy.estructuras?.length > 0 && proy.estructuras.every(e => e.tipo)) },
  ]
  const completados = campos.filter(c => c.check()).length
  const pct = Math.round((completados / campos.length) * 100)
  const faltantes = campos.filter(c => !c.check()).map(c => c.label)

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
          Completado: {completados}/{campos.length} campos
        </span>
        {pct === 100
          ? <span style={{ ...S.chip, background: '#dcfce7', borderColor: '#86efac', color: '#166534' }}>✓ Ficha lista</span>
          : <span style={{ fontSize: 11, color: '#94a3b8' }}>Faltan: {faltantes.join(', ')}</span>
        }
      </div>
      <div style={{ background: '#e2e8f0', borderRadius: 99, height: 5, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: pct === 100 ? '#16a34a' : '#3b82f6', transition: 'width 0.3s', borderRadius: 99 }} />
      </div>
    </div>
  )
}

// ─── Componente: chips de zona térmica ───────────────────────────────────────
function ChipsZona({ zona }) {
  if (!zona) return null
  const z = ZONAS[zona]
  const items = [
    { label: 'Muro',    val: exenta(zona) ? null : `≤ ${z.muro} W/m²K`,  ref: 'DS N°15 Tabla 1' },
    { label: 'Techo',   val: exenta(zona) ? null : `≤ ${z.techo} W/m²K`, ref: 'DS N°15 Tabla 1' },
    { label: 'Piso',    val: exenta(zona) ? null : `≤ ${z.piso} W/m²K`,  ref: 'DS N°15 Tabla 1' },
    { label: 'Ti diseño', val: `${z.Ti} °C`,   ref: 'NCh1079' },
    { label: 'Te diseño', val: `${z.Te} °C`,   ref: 'NCh1079' },
    { label: 'HR diseño', val: `${z.HR} %`,    ref: 'NCh1079' },
    { label: 'Prot. solar', val: z.pda ? 'Obligatoria' : 'No aplica', ref: 'OGUC Art. 4.1.10' },
  ]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map(({ label, val, ref }) => (
        <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', minWidth: 110 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
          <div style={{ fontWeight: 700, color: val && val.includes('Oblig') ? '#dc2626' : '#1e40af', fontSize: 13 }}>
            {val ?? <span style={{ color: '#94a3b8', fontSize: 11 }}>Exenta</span>}
          </div>
          <div style={S.norm}>{ref}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Helper: rango de pisos ───────────────────────────────────────────────────
function pisoRange(desde, hasta) {
  const d = parseInt(desde) || 1
  const h = parseInt(hasta) || d
  return Array.from({ length: Math.max(0, h - d + 1) }, (_, i) => d + i)
}

// ─── Helper: número RF para comparación ──────────────────────────────────────
function rfNum(rf) {
  if (!rf) return 0
  const m = String(rf).match(/\d+/)
  return m ? parseInt(m[0]) : 0
}

// ─── Componente: editor de sistemas estructurales por tramo de piso ───────────
function EstructuraMixta({ estructuras, pisos, onChange }) {
  const total = parseInt(pisos) || 1

  function agregar() {
    const usados = new Set(estructuras.flatMap(e => pisoRange(e.desde, e.hasta)))
    const libre = Array.from({ length: total }, (_, i) => i + 1).find(p => !usados.has(p)) || 1
    onChange([...estructuras, { id: Date.now(), tipo: '', desde: String(libre), hasta: String(libre) }])
  }

  function actualizar(id, campo, valor) {
    onChange(estructuras.map(e => e.id === id ? { ...e, [campo]: valor } : e))
  }

  function eliminar(id) {
    onChange(estructuras.filter(e => e.id !== id))
  }

  // Validación de cobertura y solapamientos
  const todos = Array.from({ length: total }, (_, i) => i + 1)
  const asignados = new Set(estructuras.flatMap(e => pisoRange(e.desde, e.hasta)))
  const sinCubrir = todos.filter(p => !asignados.has(p))
  const solapados = estructuras.some((e, i) =>
    estructuras.some((f, j) => i !== j && pisoRange(e.desde, e.hasta).some(p => pisoRange(f.desde, f.hasta).includes(p)))
  )

  const selStyle = { border: '1.5px solid #cbd5e1', borderRadius: 6, padding: '4px 6px', fontSize: 12, background: '#fff', minWidth: 180 }
  const numStyle = { border: '1.5px solid #cbd5e1', borderRadius: 6, padding: '4px 6px', fontSize: 12, background: '#fff', width: 52, textAlign: 'center' }
  const btnDel   = { background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }
  const btnAdd   = { background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }

  return (
    <div>
      {estructuras.length === 0 && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
          Sin estructura definida. Agrega al menos un sistema.
        </div>
      )}

      {estructuras.map((e, idx) => {
        const rfReal = RF_EST[e.tipo]
        return (
          <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
            {/* Tipo */}
            <select style={selStyle} value={e.tipo} onChange={ev => actualizar(e.id, 'tipo', ev.target.value)}>
              <option value="">Tipo de estructura...</option>
              {ESTRUCTURAS.filter(t => t !== 'Mixta HA + albanileria').map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Tramo */}
            <span style={{ fontSize: 11, color: '#64748b' }}>Pisos</span>
            <input
              style={numStyle} type="number" min={1} max={total}
              value={e.desde}
              onChange={ev => actualizar(e.id, 'desde', ev.target.value)}
            />
            <span style={{ fontSize: 11, color: '#64748b' }}>al</span>
            <input
              style={numStyle} type="number" min={1} max={total}
              value={e.hasta}
              onChange={ev => actualizar(e.id, 'hasta', ev.target.value)}
            />

            {/* RF real del sistema */}
            {rfReal && (
              <span style={{ fontSize: 11, fontWeight: 700, color: rfNum(rfReal) >= 150 ? '#166534' : rfNum(rfReal) >= 60 ? '#1e40af' : '#dc2626', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 7px' }}>
                RF real: {rfReal}
              </span>
            )}

            {/* Eliminar */}
            <button style={btnDel} onClick={() => eliminar(e.id)}>✕</button>
          </div>
        )
      })}

      <button style={btnAdd} onClick={agregar}>+ Agregar sistema</button>

      {/* Advertencias */}
      {solapados && (
        <div style={{ ...S.err, marginTop: 6 }}>⚠ Hay pisos con más de un sistema asignado. Corrige los tramos.</div>
      )}
      {!solapados && sinCubrir.length > 0 && estructuras.length > 0 && (
        <div style={{ ...S.warn, marginTop: 6 }}>
          ⚠ Pisos sin sistema estructural asignado: {sinCubrir.join(', ')}
        </div>
      )}
      {!solapados && sinCubrir.length === 0 && estructuras.length > 0 && estructuras.every(e => e.tipo) && (
        <div style={{ ...S.ok, marginTop: 6, fontSize: 10 }}>✓ Todos los pisos cubiertos</div>
      )}
    </div>
  )
}

// ─── Componente principal: TabDiag ───────────────────────────────────────────
export default function TabDiag({ proy, setProy }) {
  // Overrides se leen del localStorage (actualizados por AdminZonas)
  const [overrides, setOverrides] = useState(() => getOverrides())

  // Escuchar cambios de overrides desde AdminZonas (evento custom)
  useEffect(() => {
    function onUpdate() { setOverrides(getOverrides()) }
    window.addEventListener('oguc:zonas-updated', onUpdate)
    return () => window.removeEventListener('oguc:zonas-updated', onUpdate)
  }, [])

  // Guarda la zona que corresponde a la comuna seleccionada (para detectar divergencia)
  const zonaComunal = proy.comuna ? comunaAZona(proy.comuna, overrides) : null
  const zonaDiverge = proy.zona && zonaComunal && proy.zona !== zonaComunal

  // Ficha normativa: reactiva, no requiere botón
  const ficha = useMemo(() => {
    const ests = proy.estructuras || []
    if (!proy.zona || !proy.uso || !proy.pisos || ests.length === 0 || !ests.every(e => e.tipo)) return null
    const z    = ZONAS[proy.zona]
    const uso  = proy.uso
    const pisos = proy.pisos
    const rfReq = RF_PISOS(uso, pisos)   // RF normativa requerida
    // Análisis por segmento estructural
    const segmentos = ests.map(e => ({
      tipo:  e.tipo,
      desde: e.desde,
      hasta: e.hasta,
      rfReal: RF_EST[e.tipo] ?? '—',
      cumple: rfNum(RF_EST[e.tipo]) >= rfNum(rfReq),
    }))
    // Observaciones para todos los tipos distintos
    const tiposDistintos = [...new Set(ests.map(e => e.tipo))]
    const obsEst = tiposDistintos.map(t => OBS_EST[t]).filter(Boolean).join(' / ')
    return {
      z,
      // Térmica (DS N°15 MINVU)
      uMuro:   exenta(proy.zona) ? null : z.muro,
      uTecho:  exenta(proy.zona) ? null : z.techo,
      uPiso:   exenta(proy.zona) ? null : z.piso,
      uPuerta: PUERTA_U[proy.zona] ?? null,
      permVentana: PERM_V[proy.zona] ?? null,
      permPuerta:  PUERTA_P[proy.zona] ?? null,
      sobrR:   SOBR_R[proy.zona] ?? null,
      infilt:  INFILT[proy.zona] ?? null,
      pda:     z.pda,
      // Fuego — OGUC Título 4 + LOCF Ed.17 2025
      rfEstructura: rfReq,
      segmentos,
      rfMurosSep:   RF_DEF[uso]?.muros_sep   ?? '—',
      rfEscaleras:  RF_DEF[uso]?.escaleras   ?? '—',
      rfCubierta:   RF_DEF[uso]?.cubierta    ?? '—',
      riesgoInc:    RIESGO_INC[uso]          ?? '—',
      obsEst,
      // Acústica — NCh352 + OGUC Art. 4.1.6
      acEntreUnidades: AC_DEF[uso]?.entre_unidades ?? null,
      acFachada:       AC_DEF[uso]?.fachada        ?? null,
      acEntrePisos:    AC_DEF[uso]?.entre_pisos     ?? null,
      // Condiciones diseño
      Ti: z.Ti, Te: z.Te, HR: z.HR,
    }
  }, [proy.zona, proy.uso, proy.pisos, proy.estructuras])

  function setPr(field, val) { setProy(p => ({ ...p, [field]: val })) }

  // Sincroniza estructuras[] y deriva estructura (string) para retrocompatibilidad
  function setEstruct(newArr) {
    const tipos = [...new Set(newArr.map(e => e.tipo).filter(Boolean))]
    const derived = tipos.length === 1 ? tipos[0] : tipos.length > 1 ? 'Mixta HA + albanileria' : ''
    setProy(p => ({ ...p, estructuras: newArr, estructura: derived }))
  }

  const campoVacio = f => !proy[f]

  return (
    <div>
      <AyudaPanel
        titulo="Cómo usar — Diagnóstico normativo"
        pasos={[
          'Ingresa el <b>nombre del proyecto</b> y el arquitecto responsable.',
          'Escribe la <b>comuna</b> en el buscador: la zona térmica se asigna automáticamente según DS N°15 / NCh1079:2019.',
          'Si necesitas otra zona (proyecto en altura, override), cámbiala manualmente en el selector de zona.',
          'Selecciona el <b>uso del edificio</b>: determina las exigencias de RF, Rw y riesgo de incendio.',
          'Ingresa el <b>N° de pisos sobre terreno</b>: define la RF mínima de la estructura (RF_PISOS).',
          'Define el <b>sistema estructural</b> por tramo de pisos con "+ Agregar sistema". Puedes combinar tipos (ej: albañilería piso 1, madera pisos 2–3).',
          'La <b>ficha normativa</b> se genera en tiempo real con todos los parámetros exigidos (U, RF, Rw, infiltración, sobrecimiento).',
        ]}
        normativa="DS N°15 MINVU (vigente 28/11/2025) · OGUC Título 4 · NCh1079:2019 · LOFC Ed.17 2025 · NCh352"
      />
      {/* ── DATOS DEL PROYECTO ─────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.h2}>Datos del proyecto</p>
        <ProgresoForm proy={proy} />

        {/* Fila 1: datos generales */}
        <div style={{ marginBottom: 6, fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Identificación
        </div>
        <div style={{ ...S.row, marginBottom: 14 }}>
          <div style={S.col}>
            <label style={S.label(false)}>Nombre del proyecto</label>
            <input style={S.input(false)} value={proy.nombre} onChange={e => setPr('nombre', e.target.value)} placeholder="Ej: Edificio Los Olmos" />
          </div>
          <div style={S.col}>
            <label style={S.label(false)}>Arquitecto responsable</label>
            <input style={S.input(false)} value={proy.arq} onChange={e => setPr('arq', e.target.value)} placeholder="Nombre + N° colegiado" />
          </div>
        </div>

        {/* Fila 2: datos técnicos */}
        <div style={{ marginBottom: 6, fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Datos técnicos normativos
        </div>
        <div style={{ ...S.row, alignItems: 'flex-start', gap: 14 }}>
          {/* Comuna */}
          <div style={S.col}>
            <label style={S.label(campoVacio('zona'))}>
              {campoVacio('zona') && <span style={{ color: '#dc2626' }}>* </span>}
              Comuna
            </label>
            <ComunaSearch
              value={proy.comuna}
              overrides={overrides}
              onChange={(comuna, zona) => setProy(p => ({ ...p, comuna, zona: zona ?? p.zona }))}
            />
            <span style={S.norm}>Asigna zona térmica automáticamente — NCh1079:2019</span>
          </div>

          {/* Zona térmica */}
          <div style={S.col}>
            <label style={S.label(campoVacio('zona'))}>
              {campoVacio('zona') && <span style={{ color: '#dc2626' }}>* </span>}
              Zona térmica
            </label>
            <select style={S.sel(campoVacio('zona'))} value={proy.zona} onChange={e => setPr('zona', e.target.value)}>
              <option value="">Seleccionar...</option>
              {Object.entries(ZONAS).map(([k, v]) => (
                <option key={k} value={k}>{k} — {v.n} ({v.ej})</option>
              ))}
            </select>
            {zonaDiverge && (
              <span style={{ fontSize: 10, color: '#d97706', fontWeight: 600 }}>
                ⚠ La comuna "{proy.comuna}" corresponde a Zona {zonaComunal} (DS N°15). Zona modificada manualmente.
              </span>
            )}
            {!zonaDiverge && zonaComunal && proy.zona && (
              <span style={{ fontSize: 10, color: '#16a34a' }}>✓ Zona asignada según DS N°15 / NCh1079:2019</span>
            )}
          </div>

          {/* Uso */}
          <div style={S.col}>
            <label style={S.label(campoVacio('uso'))}>
              {campoVacio('uso') && <span style={{ color: '#dc2626' }}>* </span>}
              Uso del edificio
            </label>
            <select style={S.sel(campoVacio('uso'))} value={proy.uso} onChange={e => setPr('uso', e.target.value)}>
              <option value="">Seleccionar...</option>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
            <span style={S.norm}>Define RF, Rw y riesgo de incendio — OGUC Art. 4.5.4</span>
          </div>

          {/* Pisos */}
          <div style={S.col}>
            <label style={S.label(campoVacio('pisos'))}>
              {campoVacio('pisos') && <span style={{ color: '#dc2626' }}>* </span>}
              N° de pisos sobre terreno
            </label>
            <input
              style={S.num(campoVacio('pisos'))}
              type="number" min={1} max={50}
              value={proy.pisos}
              onChange={e => setPr('pisos', e.target.value)}
            />
            <span style={S.norm}>Determina RF estructura — OGUC Art. 4.5.4</span>
          </div>

          {/* Estructura (mixta por tramo de piso) */}
          <div style={{ ...S.col, flex: '1 1 320px' }}>
            <label style={S.label(!(proy.estructuras?.length > 0 && proy.estructuras.every(e => e.tipo)))}>
              {!(proy.estructuras?.length > 0 && proy.estructuras.every(e => e.tipo)) && <span style={{ color: '#dc2626' }}>* </span>}
              Sistema estructural
            </label>
            <EstructuraMixta
              estructuras={proy.estructuras || []}
              pisos={proy.pisos}
              onChange={setEstruct}
            />
            <span style={S.norm}>Permite sistemas distintos por tramo de pisos — LOFC Ed.17 2025</span>
          </div>
        </div>

        {/* Fila 3: profesional responsable */}
        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 14, paddingTop: 14 }}>
          <div style={{ marginBottom: 6, fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Profesional responsable
          </div>
          <div style={{ ...S.row, marginBottom: 10 }}>
            <div style={S.col}>
              <label style={S.label(false)}>Nombre completo</label>
              <input style={S.input(false)} value={proy.profesional || ''} onChange={e => setPr('profesional', e.target.value)} placeholder="Nombre del profesional" />
            </div>
            <div style={S.col}>
              <label style={S.label(false)}>Título</label>
              <input style={S.input(false)} value={proy.titulo || ''} onChange={e => setPr('titulo', e.target.value)} placeholder="Arquitecto / Ingeniero Civil / etc." />
            </div>
            <div style={S.col}>
              <label style={S.label(false)}>N° Registro MINVU / Colegio</label>
              <input style={S.input(false)} value={proy.registro || ''} onChange={e => setPr('registro', e.target.value)} placeholder="Ej: 12345" />
            </div>
            <div style={S.col}>
              <label style={S.label(false)}>Email</label>
              <input style={S.input(false)} type="email" value={proy.email || ''} onChange={e => setPr('email', e.target.value)} placeholder="correo@ejemplo.cl" />
            </div>
            <div style={S.col}>
              <label style={S.label(false)}>Teléfono</label>
              <input style={S.input(false)} value={proy.telefono || ''} onChange={e => setPr('telefono', e.target.value)} placeholder="+56 9 ..." />
            </div>
          </div>
        </div>
      </div>

      {/* ── CHIPS ZONA ─────────────────────────────────────────── */}
      {proy.zona && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ ...S.h2, marginBottom: 0 }}>
              Zona {proy.zona} — {ZONAS[proy.zona].n}
              <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b', fontWeight: 400 }}>
                ({ZONAS[proy.zona].ej})
              </span>
            </p>
            {exenta(proy.zona) && (
              <span style={{ ...S.chip, background: '#fef9c3', borderColor: '#fde047', color: '#854d0e' }}>
                Zona exenta de requisitos térmicos — DS N°15 Art. 1°
              </span>
            )}
          </div>
          <ChipsZona zona={proy.zona} />
        </div>
      )}

      {/* ── FICHA NORMATIVA (reactiva) ──────────────────────────── */}
      {!ficha && proy.zona && (
        <div style={S.warn}>
          Completa uso, N° de pisos y agrega al menos un sistema estructural completo para generar la ficha normativa.
        </div>
      )}

      {ficha && (
        <div style={S.card}>
          <p style={S.h2}>
            Ficha normativa — {proy.uso} · {proy.pisos} piso(s) · {proy.estructura || 'Sistema mixto'}
          </p>
          <div style={{ ...S.chip, marginBottom: 14, background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
            DS N°15 MINVU vigente desde 28/11/2025 · OGUC Título 4 · NCh352 · NCh1079:2019
          </div>

          {/* ── Sección 1: Envolvente térmica ── */}
          <p style={S.h3}>1. Envolvente térmica — DS N°15 MINVU · OGUC Art. 4.1.10</p>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Elemento</th>
                <th style={S.th}>U máximo (W/m²K)</th>
                <th style={S.th}>Norma de referencia</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Muro perimetral',    ficha.uMuro,   'DS N°15 Tabla 1 · NCh853:2021'],
                ['Techumbre',          ficha.uTecho,  'DS N°15 Tabla 1 · NCh853:2021'],
                ['Piso ventilado',     ficha.uPiso,   'DS N°15 Tabla 1 · NCh853:2021'],
                ['Puerta exterior',    ficha.uPuerta, 'DS N°15 Tabla 3'],
              ].map(([elem, val, ref]) => (
                <tr key={elem}>
                  <td style={S.td}>{elem}</td>
                  <td style={S.td}>
                    {val == null
                      ? na
                      : <span style={S.val(null)}>≤ {val}</span>
                    }
                  </td>
                  <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>{ref}</td>
                </tr>
              ))}
              <tr>
                <td style={S.td}>Protección solar en ventanas</td>
                <td style={S.td}>
                  <span style={{ fontWeight: 700, color: ficha.pda ? '#dc2626' : '#16a34a' }}>
                    {ficha.pda ? 'Obligatoria' : 'No aplica'}
                  </span>
                </td>
                <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>OGUC Art. 4.1.10 inc. 6°</td>
              </tr>
            </tbody>
          </table>

          {/* ── Sección 2: Hermeticidad e infiltración ── */}
          <div style={S.sep} />
          <p style={S.h3}>2. Hermeticidad e infiltración — DS N°15 MINVU · NCh-EN 12207</p>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Requisito</th>
                <th style={S.th}>Valor mínimo exigido</th>
                <th style={S.th}>Norma de referencia</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>Sobrecimiento (R mínimo)</td>
                <td style={S.td}>
                  {ficha.sobrR == null
                    ? na
                    : <span style={S.val(null)}>R ≥ {sobrDisplay(ficha.sobrR)} m²K/W</span>
                  }
                </td>
                <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>DS N°15 Tabla 2</td>
              </tr>
              <tr>
                <td style={S.td}>Infiltración máxima de envolvente</td>
                <td style={S.td}>
                  {ficha.infilt == null
                    ? na
                    : <span style={S.val(null)}>≤ {ficha.infilt} m³/h·m²</span>
                  }
                </td>
                <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>DS N°15 Art. 4° / NCh-EN 12207</td>
              </tr>
              <tr>
                <td style={S.td}>Clase de permeabilidad al aire — Ventanas</td>
                <td style={S.td}>
                  {ficha.permVentana == null
                    ? na
                    : <span style={S.val(null)}>Clase {ficha.permVentana} (NCh-EN 12207)</span>
                  }
                </td>
                <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>DS N°15 Tabla 3 · NCh-EN 12207</td>
              </tr>
              <tr>
                <td style={S.td}>Clase de permeabilidad al aire — Puertas</td>
                <td style={S.td}>
                  {ficha.permPuerta == null
                    ? na
                    : <span style={S.val(null)}>Clase {ficha.permPuerta} (NCh-EN 12207)</span>
                  }
                </td>
                <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>DS N°15 Tabla 3 · NCh-EN 12207</td>
              </tr>
              <tr>
                <td style={S.td}>Condiciones interiores de diseño</td>
                <td style={S.td}>
                  <span style={S.val(null)}>Ti = {ficha.Ti} °C · HR = {ficha.HR} %</span>
                </td>
                <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>NCh1079:2019</td>
              </tr>
              <tr>
                <td style={S.td}>Temperatura exterior de diseño</td>
                <td style={S.td}>
                  <span style={S.val(null)}>Te = {ficha.Te} °C</span>
                </td>
                <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>NCh1079:2019</td>
              </tr>
            </tbody>
          </table>

          {/* ── Sección 3: Resistencia al fuego ── */}
          <div style={S.sep} />
          <p style={S.h3}>3. Resistencia al fuego — OGUC Art. 4.5.4 · LOCF Ed.17 2025</p>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Elemento</th>
                <th style={S.th}>RF mínima exigida</th>
                <th style={S.th}>Base normativa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>
                  Estructura principal — RF normativa exigida
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Calculado para {proy.uso} · {proy.pisos} piso(s)</div>
                </td>
                <td style={S.td}><span style={{ ...S.val(null), color: '#dc2626', fontSize: 14 }}>{ficha.rfEstructura}</span></td>
                <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>OGUC Art. 4.5.4 · RF_PISOS</td>
              </tr>
              {ficha.segmentos.map((seg, i) => (
                <tr key={i} style={{ background: seg.cumple ? '#f0fdf4' : '#fef2f2' }}>
                  <td style={{ ...S.td, paddingLeft: 24 }}>
                    <span style={{ color: '#64748b' }}>↳ {seg.tipo}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>
                      Piso{parseInt(seg.desde) !== parseInt(seg.hasta) ? `s ${seg.desde}–${seg.hasta}` : ` ${seg.desde}`}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={{ fontWeight: 700, color: seg.cumple ? '#166534' : '#dc2626' }}>
                      {seg.cumple ? '✓' : '✗'} RF real: {seg.rfReal}
                    </span>
                    {!seg.cumple && (
                      <span style={{ fontSize: 10, color: '#dc2626', marginLeft: 6 }}>
                        (exigido: {ficha.rfEstructura})
                      </span>
                    )}
                  </td>
                  <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>LOFC Ed.17 2025</td>
                </tr>
              ))}
              {[
                ['Muros de separación entre unidades', ficha.rfMurosSep, 'OGUC Art. 4.5.4'],
                ['Escaleras y vías de evacuación',     ficha.rfEscaleras,'OGUC Art. 4.5.7'],
                ['Cubierta / Techo',                   ficha.rfCubierta, 'OGUC Art. 4.5.4'],
              ].map(([elem, val, ref]) => (
                <tr key={elem}>
                  <td style={S.td}>{elem}</td>
                  <td style={S.td}><span style={{ ...S.val(null), color: '#dc2626' }}>{val}</span></td>
                  <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>{ref}</td>
                </tr>
              ))}
              <tr style={{ background: '#fef2f2' }}>
                <td style={S.td}>Clasificación de riesgo de incendio</td>
                <td style={{ ...S.td, fontWeight: 700, color: '#991b1b' }} colSpan={2}>{ficha.riesgoInc}</td>
              </tr>
            </tbody>
          </table>
          {ficha.obsEst && (
            <div style={{ ...S.warn, marginTop: 8 }}>
              <b>Sistema estructural — {proy.estructura || 'Sistema mixto'}:</b> {ficha.obsEst}
            </div>
          )}

          {/* ── Sección 4: Acústica ── */}
          <div style={S.sep} />
          <p style={S.h3}>4. Aislamiento acústico — NCh352 · NCh353 · OGUC Art. 4.1.6</p>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Separación</th>
                <th style={S.th}>Rw mínimo (índice ponderado)</th>
                <th style={S.th}>Norma</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Entre unidades habitables',     ficha.acEntreUnidades, 'NCh352 · OGUC Art. 4.1.6'],
                ['Fachada (ruido exterior)',       ficha.acFachada,       'NCh352 · OGUC Art. 4.1.6'],
                ['Entre pisos (impacto + aéreo)',  ficha.acEntrePisos,    'NCh353 · OGUC Art. 4.1.6'],
              ].map(([elem, val, ref]) => (
                <tr key={elem}>
                  <td style={S.td}>{elem}</td>
                  <td style={S.td}>
                    {val == null
                      ? nd
                      : <span style={S.val(null)}>Rw ≥ {val} dB</span>
                    }
                  </td>
                  <td style={{ ...S.td, color: '#94a3b8', fontSize: 11 }}>{ref}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pie de ficha */}
          <div style={{ ...S.info, marginTop: 12, fontSize: 10 }}>
            Esta ficha es de verificación preliminar. La responsabilidad técnica y legal corresponde al profesional
            competente que suscribe el expediente DOM (OGUC Art. 1.2.2).
          </div>
        </div>
      )}
    </div>
  )
}
