import { useState } from 'react'

/**
 * Panel de instrucciones colapsable.
 * Props:
 *   titulo    — texto del encabezado
 *   pasos     — array de strings (pasos numerados)
 *   normativa — string con las normas de referencia (opcional)
 */
export function AyudaPanel({ titulo, pasos, normativa }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      border: '1px solid #bfdbfe',
      borderRadius: 7,
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* Cabecera */}
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

      {/* Contenido */}
      {open && (
        <div style={{ padding: '10px 16px 12px', background: '#f8fbff' }}>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            {pasos.map((p, i) => (
              <li key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 2 }}
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
