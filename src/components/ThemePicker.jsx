import { useState, useEffect, useRef } from 'react'

export const THEMES = [
  { id: 'base',    lab: 'Base',    desc: 'Actual · System UI',       swatch: ['#f1f5f9', '#0e6560'] },
  { id: 'tecnico', lab: 'Claro',   desc: 'Papel · Inter Tight',      swatch: ['#fafaf7', '#0d9488'] },
  { id: 'papel',   lab: 'Papel',   desc: 'Crema · Source Serif',     swatch: ['#f5efe0', '#5b7c3f'] },
  { id: 'nordico', lab: 'Nórdico', desc: 'Petróleo · IBM Plex',      swatch: ['#f1f4f7', '#0f766e'] },
  { id: 'tinta',   lab: 'Tinta',   desc: 'Editorial · EB Garamond',  swatch: ['#ffffff', '#111111'] },
  { id: 'tech',    lab: 'Tech',    desc: 'Oscuro · Geist',           swatch: ['#1e2230', '#5eead4'] },
]

/**
 * Hook que sincroniza el tema con <html data-theme> y localStorage.
 * Uso: const [theme, setTheme] = useTheme('base')
 */
export function useTheme(initial = 'base') {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return initial
    return localStorage.getItem('nc_theme') || initial
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('nc_theme', theme)
  }, [theme])
  return [theme, setTheme]
}

/**
 * Botón flotante en el header que abre un panel de selección de tema.
 * Props: { theme, onChange }
 */
export default function ThemePicker({ theme, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const actual = THEMES.find(t => t.id === theme) || THEMES[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Botón trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Cambiar apariencia"
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 6,
          padding: '5px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {/* Muestra los dos swatches del tema activo */}
        <span style={{ display: 'flex', gap: 2 }}>
          {actual.swatch.map((c, i) => (
            <span key={i} style={{
              display: 'inline-block', width: 10, height: 10,
              borderRadius: 2, background: c,
              border: '1px solid rgba(255,255,255,0.4)',
            }} />
          ))}
        </span>
        <span style={{ opacity: 0.9 }}>{actual.lab}</span>
        <span style={{ opacity: 0.6, fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Panel desplegable */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          zIndex: 9999,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,.18)',
          padding: 10,
          minWidth: 220,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: 0.5 }}>
            APARIENCIA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {THEMES.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange(o.id); setOpen(false) }}
                style={{
                  padding: '9px 10px',
                  border: `1.5px solid ${theme === o.id ? '#0e6560' : '#e2e8f0'}`,
                  background: theme === o.id ? '#f0fdfa' : '#f8fafc',
                  borderRadius: 7,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', gap: 3 }}>
                  {o.swatch.map((c, i) => (
                    <div key={i} style={{
                      width: 14, height: 14, borderRadius: 3,
                      background: c, border: '1px solid rgba(0,0,0,.10)',
                    }} />
                  ))}
                  {theme === o.id && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#0e6560' }}>✓</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{o.lab}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{o.desc}</div>
                </div>
              </button>
            ))}
          </div>
          {theme !== 'base' && (
            <button
              onClick={() => { onChange('base'); setOpen(false) }}
              style={{
                marginTop: 8, width: '100%', padding: '6px 0',
                background: 'transparent', border: '1px dashed #cbd5e1',
                borderRadius: 6, cursor: 'pointer', fontSize: 11,
                color: '#64748b', fontWeight: 500,
              }}
            >
              ↩ Volver a la apariencia base
            </button>
          )}
        </div>
      )}
    </div>
  )
}
