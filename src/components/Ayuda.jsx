import { useState } from 'react'

/**
 * Panel de instrucciones colapsable.
 * Props:
 *   titulo      — texto del encabezado
 *   pasos       — array de strings (pasos numerados)
 *   normativa   — string con las normas de referencia (opcional)
 *   alwaysOpen  — si true, muestra contenido sin toggle (modo sidebar)
 */
export function AyudaPanel({ titulo, pasos, normativa, alwaysOpen = false }) {
  const [open, setOpen] = useState(false)
  const isOpen = alwaysOpen || open

  return (
    <div
      className="nc-ayuda-inline"
      style={{
        border: '1px solid #bfdbfe',
        borderRadius: 7,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {/* Cabecera — oculta en modo sidebar (alwaysOpen) */}
      {!alwaysOpen && (
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '7px 13px',
            background: open ? '#dbeafe' : '#eff6ff',
            border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#1e40af', fontWeight: 600, textAlign: 'left',
            transition: 'background 0.15s',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>ℹ</span>
            {titulo}
          </span>
          <span style={{ fontSize: 11, color: '#93c5fd' }}>{open ? '▲ cerrar' : '▼ ver instrucciones'}</span>
        </button>
      )}

      {/* Cabecera sidebar (alwaysOpen) */}
      {alwaysOpen && (
        <div style={{
          padding: '10px 13px 8px',
          background: '#dbeafe',
          fontSize: 12, color: '#1e40af', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>ℹ</span>
          {titulo}
        </div>
      )}

      {/* Contenido */}
      {isOpen && (
        <div style={{ padding: '10px 16px 12px', background: '#f8fbff' }}>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            {pasos.map((p, i) => (
              <li key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}
                dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </ol>
          {normativa && (
            <div style={{
              marginTop: 10, paddingTop: 8, borderTop: '1px solid #e2e8f0',
              fontSize: 10, color: '#64748b', lineHeight: 1.6,
            }}>
              <b>Normativa aplicable:</b> {normativa}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
