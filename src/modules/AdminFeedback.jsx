import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { listarFeedbackAdmin, responderFeedback, cambiarEstadoFeedback } from '../supabase.js'

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', bg: '#fef3c7', color: '#92400e' },
  { value: 'leido', label: 'Leido', bg: '#dbeafe', color: '#1e40af' },
  { value: 'respondido', label: 'Respondido', bg: '#d1fae5', color: '#065f46' },
  { value: 'cerrado', label: 'Cerrado', bg: '#f3f4f6', color: '#6b7280' },
]

const TIPO_ICON = { bug: '🐛', sugerencia: '💡', pregunta: '❓', general: '💬' }

export default function AdminFeedback() {
  const { orgActual } = useAuth()
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [respondiendo, setRespondiendo] = useState(null)
  const [respuesta, setRespuesta] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    const data = await listarFeedbackAdmin(orgActual?.id)
    setItems(data)
    setCargando(false)
  }

  useEffect(() => { if (orgActual?.id) cargar() }, [orgActual?.id])

  const onResponder = async (id) => {
    if (!respuesta.trim()) return
    setGuardando(true)
    const res = await responderFeedback(id, respuesta.trim())
    setGuardando(false)
    if (res.ok) {
      setRespondiendo(null)
      setRespuesta('')
      cargar()
    }
  }

  const onCambiarEstado = async (id, estado) => {
    await cambiarEstadoFeedback(id, estado)
    cargar()
  }

  const filtrados = filtro === 'todos' ? items : items.filter(i => i.estado === filtro)
  const pendientes = items.filter(i => i.estado === 'pendiente').length

  const S = {
    badge: (est) => {
      const e = ESTADOS.find(x => x.value === est) || ESTADOS[0]
      return { fontSize: 11, padding: '2px 8px', borderRadius: 10, background: e.bg, color: e.color, fontWeight: 600, border: 'none', cursor: 'pointer' }
    },
    card: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 10, background: '#fff' },
    meta: { fontSize: 11, color: '#94a3b8' },
    btnSm: { padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, cursor: 'pointer', background: '#fff', color: '#475569' },
    btnPrimary: { padding: '4px 10px', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', background: '#2563eb', color: '#fff', fontWeight: 600 },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Buzon de feedback</span>
          {pendientes > 0 && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
              {pendientes} pendiente{pendientes > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button onClick={cargar} style={S.btnSm}>Actualizar</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          style={{ ...S.btnSm, fontWeight: filtro === 'todos' ? 700 : 400, background: filtro === 'todos' ? '#e2e8f0' : '#fff' }}
          onClick={() => setFiltro('todos')}
        >Todos ({items.length})</button>
        {ESTADOS.map(e => {
          const count = items.filter(i => i.estado === e.value).length
          return (
            <button
              key={e.value}
              style={{ ...S.btnSm, fontWeight: filtro === e.value ? 700 : 400, background: filtro === e.value ? e.bg : '#fff' }}
              onClick={() => setFiltro(e.value)}
            >{e.label} ({count})</button>
          )
        })}
      </div>

      {cargando && <p style={{ color: '#94a3b8', fontSize: 13 }}>Cargando feedback...</p>}

      {!cargando && filtrados.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
          {items.length === 0 ? 'No hay feedback recibido.' : 'Sin resultados para este filtro.'}
        </p>
      )}

      {!cargando && filtrados.map(fb => (
        <div key={fb.id} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                {TIPO_ICON[fb.tipo] || '💬'} {fb.asunto}
              </span>
              <div style={S.meta}>
                {fb.nombre_usuario || 'Usuario'} — {new Date(fb.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <select
              value={fb.estado}
              onChange={e => onCambiarEstado(fb.id, e.target.value)}
              style={S.badge(fb.estado)}
            >
              {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>

          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 8px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{fb.mensaje}</p>

          {fb.respuesta_admin && (
            <div style={{ padding: '8px 10px', background: '#f0fdf4', borderRadius: 6, borderLeft: '3px solid #22c55e', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#065f46', marginBottom: 2 }}>Tu respuesta:</div>
              <p style={{ fontSize: 12, color: '#1e293b', margin: 0, whiteSpace: 'pre-wrap' }}>{fb.respuesta_admin}</p>
              {fb.respondido_at && (
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                  {new Date(fb.respondido_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          )}

          {respondiendo === fb.id ? (
            <div style={{ marginTop: 8 }}>
              <textarea
                value={respuesta}
                onChange={e => setRespuesta(e.target.value)}
                placeholder="Escribe tu respuesta..."
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, minHeight: 60, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                maxLength={1000}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                <button style={S.btnSm} onClick={() => { setRespondiendo(null); setRespuesta('') }}>Cancelar</button>
                <button style={S.btnPrimary} disabled={guardando} onClick={() => onResponder(fb.id)}>
                  {guardando ? 'Guardando...' : 'Enviar respuesta'}
                </button>
              </div>
            </div>
          ) : (
            <button style={S.btnSm} onClick={() => { setRespondiendo(fb.id); setRespuesta(fb.respuesta_admin || '') }}>
              {fb.respuesta_admin ? 'Editar respuesta' : 'Responder'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
