import { useState } from 'react'

export default function NotasPanel({ tabKey, notas, setNotas }) {
  const [open, setOpen] = useState(false)
  const valor = notas?.[tabKey] || ''
  const tieneNota = valor.trim().length > 0

  return (
    <div style={{ marginTop: 12, borderRadius: 8, border: `1px solid ${tieneNota ? '#fbbf24' : '#e2e8f0'}`, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 14px', background: tieneNota ? '#fffbeb' : '#f8fafc', border: 'none', cursor: 'pointer', fontSize: 12, color: tieneNota ? '#92400e' : '#64748b', fontWeight: tieneNota ? 700 : 400 }}
      >
        <span>📝 {tieneNota ? 'Notas' : 'Agregar nota...'} {tieneNota && `(${valor.trim().split('\n').length} línea${valor.trim().split('\n').length > 1 ? 's' : ''})`}</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '8px 12px', background: '#fffbeb' }}>
          <textarea
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 80, padding: '8px 10px', border: '1px solid #fcd34d', borderRadius: 6, fontSize: 12, fontFamily: 'system-ui', resize: 'vertical', outline: 'none', background: '#fff', color: '#1e293b' }}
            placeholder="Escribe observaciones, pendientes o comentarios sobre esta sección..."
            value={valor}
            onChange={e => setNotas(prev => ({ ...prev, [tabKey]: e.target.value }))}
          />
        </div>
      )}
    </div>
  )
}
