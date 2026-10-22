import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { filterMatsByElem, ALL_MATS } from '../data.js'
import { filtrarMateriales } from '../utils/materialSearch.js'

// ─────────────────────────────────────────────────────────────────────────────
// MaterialCombobox — reemplazo con BÚSQUEDA del <select> de materiales.
//
// Drop-in: mismo contrato que el <select> nativo que sustituye —
//   value   = nombre del material seleccionado (string)
//   onChange(nombre) = se llama SOLO al elegir una opción de la lista
// Se escribe para filtrar por NOMBRE de material o por CONJUNTO (grupo). No crea
// materiales nuevos: solo busca en el catálogo (filterMatsByElem respeta el
// elemento muro/techo/piso). Si el value actual no está en el catálogo (material
// "personalizado" heredado de una cadena), se muestra igual para no perderlo.
//
// El panel se posiciona con position:fixed anclado al input (getBoundingClientRect)
// para NO recortarse dentro de contenedores con overflow (p. ej. la tabla de capas
// de la Calculadora U tiene overflowX:auto). Se reposiciona con scroll/resize y se
// voltea hacia arriba si no hay espacio abajo.
// ─────────────────────────────────────────────────────────────────────────────
export default function MaterialCombobox({
  value,
  onChange,
  elem,
  placeholder = 'Buscar material…',
  width = 200,
  showLambda = true,
  style = {},
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hi, setHi] = useState(0) // índice resaltado (sobre la lista plana)
  const [pos, setPos] = useState(null) // {left, top?, bottom?, width, maxH}
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const grupos = useMemo(() => filterMatsByElem(elem) || [], [elem])
  const filtrado = useMemo(() => filtrarMateriales(grupos, query), [grupos, query])
  const flat = useMemo(() => filtrado.flatMap(g => g.items.map(m => m.n)), [filtrado])
  const esConocido = useMemo(() => !!ALL_MATS.find(x => x.n === value), [value])

  // Calcula la posición del panel (fixed) a partir del rect del input.
  const recomputar = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const espacioAbajo = window.innerHeight - r.bottom
    const espacioArriba = r.top
    const abajo = espacioAbajo >= 180 || espacioAbajo >= espacioArriba
    const maxH = Math.max(120, Math.min(280, (abajo ? espacioAbajo : espacioArriba) - 12))
    setPos({
      left: r.left,
      width: r.width,
      maxH,
      top: abajo ? r.bottom + 2 : undefined,
      bottom: abajo ? undefined : window.innerHeight - r.top + 2,
    })
  }, [])

  const abrir = useCallback(() => { recomputar(); setOpen(true); setQuery(''); setHi(0) }, [recomputar])

  // Cerrar al click afuera + reposicionar con scroll/resize mientras está abierto.
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

  // Mantener visible la opción resaltada.
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector('[data-hi="1"]')
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [hi, open])

  function seleccionar(nombre) {
    onChange(nombre)
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) abrir(); setHi(h => Math.min(h + 1, flat.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { if (open && flat[hi]) { e.preventDefault(); seleccionar(flat[hi]) } }
    else if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  // Texto en el input: al abrir se limpia para escribir; el value queda de placeholder.
  const display = open ? query : (value || '')

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block', width, ...style }}>
      <input
        ref={inputRef}
        value={display}
        placeholder={value || placeholder}
        onFocus={abrir}
        onChange={e => { setQuery(e.target.value); if (!open) { recomputar(); setOpen(true) } setHi(0) }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        style={{
          width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1',
          borderRadius: 5, padding: '4px 22px 4px 6px', fontSize: 11, outline: 'none',
          background: `#fff url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M1 3l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>") no-repeat right 7px center`,
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
          {value && !esConocido && (
            <div
              onMouseDown={e => { e.preventDefault(); seleccionar(value) }}
              style={{ padding: '5px 8px', fontSize: 11, cursor: 'pointer', color: '#92400e', background: '#fffbeb' }}
            >
              {value} <span style={{ opacity: 0.7 }}>(personalizado)</span>
            </div>
          )}
          {filtrado.length === 0 && (
            <div style={{ padding: '8px', fontSize: 11, color: '#94a3b8' }}>Sin coincidencias para «{query}».</div>
          )}
          {filtrado.map(g => (
            <div key={g.g}>
              <div style={{
                padding: '3px 8px', fontSize: 9.5, fontWeight: 700, color: '#64748b',
                background: '#f1f5f9', textTransform: 'uppercase', letterSpacing: 0.3,
                position: 'sticky', top: 0,
              }}>{g.g}</div>
              {g.items.map(m => {
                const idx = flat.indexOf(m.n)
                const activo = idx === hi
                const sel = m.n === value
                return (
                  <div
                    key={g.g + '·' + m.n}
                    data-hi={activo ? '1' : '0'}
                    onMouseDown={e => { e.preventDefault(); seleccionar(m.n) }}
                    onMouseEnter={() => setHi(idx)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', gap: 8,
                      padding: '5px 8px', fontSize: 11, cursor: 'pointer', color: '#1e293b',
                      background: activo ? '#e0f2f1' : (sel ? '#f0fdfa' : '#fff'),
                    }}
                  >
                    <span>{m.n}{sel && ' ✓'}</span>
                    {showLambda && m.lam != null && (
                      <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>λ={m.lam}</span>
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
