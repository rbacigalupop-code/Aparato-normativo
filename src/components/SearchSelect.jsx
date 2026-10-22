import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { filtrarMateriales } from '../utils/materialSearch.js'

// ─────────────────────────────────────────────────────────────────────────────
// SearchSelect — reemplazo genérico del <select> con BÚSQUEDA automática.
//
// Drop-in de cualquier <select>:  value = valor elegido · onChange(valor).
// `options` acepta DOS formas:
//   · plano:    [{value,label,hint?}]  (o ['a','b'] → value=label=string)
//   · agrupado: [{group, items:[{value,label,hint?}]}]
// La caja de búsqueda aparece sola cuando hay más de `searchThreshold` opciones
// (listas largas) y se oculta en las cortas: mismo look en todos los desplegables,
// sin caja inútil donde no aporta. El panel usa position:fixed anclado al input
// para no recortarse dentro de contenedores con overflow; se reposiciona con
// scroll/resize y se voltea hacia arriba si no hay espacio. `allowCustomValue`
// conserva un value que no está en las opciones (se muestra como "personalizado").
// ─────────────────────────────────────────────────────────────────────────────
function normItem(o) {
  return (o && typeof o === 'object')
    ? { value: o.value, label: o.label ?? String(o.value ?? ''), hint: o.hint }
    : { value: o, label: String(o) }
}
function normalizarGrupos(options) {
  const arr = Array.isArray(options) ? options.filter(Boolean) : []
  const agrupado = arr.some(o => o && Array.isArray(o.items))
  if (agrupado) return arr.map(g => ({ group: g.group ?? g.g ?? '', items: (g.items || []).map(normItem) }))
  return [{ group: '', items: arr.map(normItem) }]
}

export default function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  width = 200,
  searchThreshold = 6,
  allowCustomValue = false,
  showHint = true,
  disabled = false,
  style = {},
  inputStyle = {},
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hi, setHi] = useState(0)
  const [pos, setPos] = useState(null)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const grupos = useMemo(() => normalizarGrupos(options), [options])
  const total = useMemo(() => grupos.reduce((n, g) => n + g.items.length, 0), [grupos])
  const searchable = total > searchThreshold

  const filtrado = useMemo(() => (searchable ? filtrarMateriales(grupos, query) : grupos), [grupos, query, searchable])
  const flat = useMemo(() => filtrado.flatMap(g => g.items.map(i => i.value)), [filtrado])

  const sel = useMemo(() => {
    for (const g of grupos) for (const it of g.items) if (it.value === value) return it
    return null
  }, [grupos, value])
  const esConocido = !!sel
  const labelSel = sel ? sel.label : (value || '')

  const recomputar = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const abajo = (window.innerHeight - r.bottom) >= 180 || (window.innerHeight - r.bottom) >= r.top
    const maxH = Math.max(120, Math.min(300, (abajo ? window.innerHeight - r.bottom : r.top) - 12))
    setPos({ left: r.left, width: r.width, maxH, top: abajo ? r.bottom + 2 : undefined, bottom: abajo ? undefined : window.innerHeight - r.top + 2 })
  }, [])

  const abrir = useCallback(() => { if (disabled) return; recomputar(); setOpen(true); setQuery(''); setHi(0) }, [recomputar, disabled])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQuery('') } }
    const onMove = () => recomputar()
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open, recomputar])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector('[data-hi="1"]')
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [hi, open])

  function seleccionar(v) { onChange(v); setOpen(false); setQuery('') }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) abrir(); setHi(h => Math.min(h + 1, flat.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { if (open && flat[hi] !== undefined) { e.preventDefault(); seleccionar(flat[hi]) } }
    else if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  // Input: si es buscable y está abierto, muestra lo tecleado; si no, el label elegido.
  const display = (searchable && open) ? query : labelSel

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block', width, ...style }}>
      <input
        ref={inputRef}
        value={display}
        placeholder={labelSel || placeholder}
        readOnly={!searchable}
        disabled={disabled}
        onMouseDown={e => { if (!searchable) { e.preventDefault(); open ? setOpen(false) : abrir() } }}
        onFocus={() => { if (searchable) abrir() }}
        onChange={e => { if (searchable) { setQuery(e.target.value); if (!open) { recomputar(); setOpen(true) } setHi(0) } }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        style={{
          width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 5,
          padding: '4px 22px 4px 6px', fontSize: 11, outline: 'none',
          cursor: searchable ? 'text' : 'pointer', color: labelSel ? '#1e293b' : '#94a3b8',
          background: `#fff url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M1 3l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>") no-repeat right 7px center`,
          ...inputStyle,
        }}
      />
      {open && pos && (
        <div
          ref={listRef}
          style={{
            position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width,
            zIndex: 99999, maxHeight: pos.maxH, overflowY: 'auto', background: '#fff',
            border: '1px solid #cbd5e1', borderRadius: 6, boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
          }}
        >
          {allowCustomValue && value && !esConocido && (
            <div onMouseDown={e => { e.preventDefault(); seleccionar(value) }}
              style={{ padding: '5px 8px', fontSize: 11, cursor: 'pointer', color: '#92400e', background: '#fffbeb' }}>
              {value} <span style={{ opacity: 0.7 }}>(personalizado)</span>
            </div>
          )}
          {filtrado.length === 0 && (
            <div style={{ padding: '8px', fontSize: 11, color: '#94a3b8' }}>Sin coincidencias para «{query}».</div>
          )}
          {filtrado.map((g, gi) => (
            <div key={(g.group || '·') + gi}>
              {g.group && (
                <div style={{
                  padding: '3px 8px', fontSize: 9.5, fontWeight: 700, color: '#64748b', background: '#f1f5f9',
                  textTransform: 'uppercase', letterSpacing: 0.3, position: 'sticky', top: 0,
                }}>{g.group}</div>
              )}
              {g.items.map(it => {
                const idx = flat.indexOf(it.value)
                const activo = idx === hi
                const marcado = it.value === value
                return (
                  <div key={String(it.value)}
                    data-hi={activo ? '1' : '0'}
                    onMouseDown={e => { e.preventDefault(); seleccionar(it.value) }}
                    onMouseEnter={() => setHi(idx)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 8px',
                      fontSize: 11, cursor: 'pointer', color: '#1e293b',
                      background: activo ? '#e0f2f1' : (marcado ? '#f0fdfa' : '#fff'),
                    }}>
                    <span>{it.label}{marcado && ' ✓'}</span>
                    {showHint && it.hint != null && it.hint !== '' && (
                      <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{it.hint}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
