import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { enviarFeedback, listarFeedbackUsuario } from '../supabase.js'

const TIPOS = [
  { value: 'bug', label: 'Reportar un error', icon: '🐛' },
  { value: 'sugerencia', label: 'Sugerencia de mejora', icon: '💡' },
  { value: 'pregunta', label: 'Pregunta o duda', icon: '❓' },
  { value: 'general', label: 'Comentario general', icon: '💬' },
]

const ESTADO_BADGE = {
  pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
  leido: { bg: '#ccfbf1', color: '#0e6560', label: 'Leido' },
  respondido: { bg: '#d1fae5', color: '#065f46', label: 'Respondido' },
  cerrado: { bg: '#f3f4f6', color: '#6b7280', label: 'Cerrado' },
}

export default function FeedbackForm({ onClose }) {
  const { user, perfil, orgActual } = useAuth()
  const [vista, setVista] = useState('form')
  const [tipo, setTipo] = useState('general')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (vista === 'historial' && user) {
      setCargando(true)
      listarFeedbackUsuario(user.id).then(data => {
        setHistorial(data)
        setCargando(false)
      })
    }
  }, [vista, user])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!asunto.trim() || !mensaje.trim()) {
      setError('Completa el asunto y el mensaje.')
      return
    }
    setEnviando(true)
    setError('')
    const res = await enviarFeedback({
      userId: user.id,
      orgId: orgActual?.id,
      nombreUsuario: perfil?.nombre_completo,
      tipo,
      asunto: asunto.trim(),
      mensaje: mensaje.trim(),
    })
    setEnviando(false)
    if (res.ok) {
      setEnviado(true)
      setAsunto('')
      setMensaje('')
    } else {
      setError(res.error || 'Error al enviar. Intenta de nuevo.')
    }
  }

  const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' },
    header: { padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 },
    body: { padding: 20 },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 },
    input: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, minHeight: 100, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
    select: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', boxSizing: 'border-box' },
    btn: { padding: '8px 20px', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnPrimary: { background: '#0d9488', color: '#fff' },
    btnGhost: { background: 'transparent', color: '#64748b' },
    field: { marginBottom: 14 },
    tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', padding: '0 20px' },
    tab: (active) => ({ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 400, color: active ? '#0d9488' : '#64748b', borderBottom: active ? '2px solid #0d9488' : '2px solid transparent', marginBottom: -1 }),
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.header}>
          <p style={S.title}>Buzon de feedback</p>
          <button onClick={onClose} style={{ ...S.btn, ...S.btnGhost, fontSize: 18, padding: '2px 8px' }}>✕</button>
        </div>

        <div style={S.tabs}>
          <button style={S.tab(vista === 'form')} onClick={() => { setVista('form'); setEnviado(false) }}>Nuevo mensaje</button>
          <button style={S.tab(vista === 'historial')} onClick={() => setVista('historial')}>Mis mensajes</button>
        </div>

        <div style={S.body}>
          {vista === 'form' && !enviado && (
            <form onSubmit={onSubmit}>
              <div style={S.field}>
                <label style={S.label}>Tipo</label>
                <select style={S.select} value={tipo} onChange={e => setTipo(e.target.value)}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Asunto</label>
                <input style={S.input} value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Resumen breve" maxLength={120} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Mensaje</label>
                <textarea style={S.textarea} value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Describe tu consulta, error o sugerencia con el mayor detalle posible..." maxLength={2000} />
                <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 2 }}>{mensaje.length}/2000</div>
              </div>
              {error && <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 8px' }}>{error}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={onClose} style={{ ...S.btn, ...S.btnGhost }}>Cancelar</button>
                <button type="submit" disabled={enviando} style={{ ...S.btn, ...S.btnPrimary, opacity: enviando ? 0.6 : 1 }}>
                  {enviando ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          )}

          {vista === 'form' && enviado && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#065f46', margin: '0 0 8px' }}>Mensaje enviado</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>Revisaremos tu feedback lo antes posible. Puedes ver el estado en "Mis mensajes".</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button onClick={() => setEnviado(false)} style={{ ...S.btn, ...S.btnPrimary }}>Enviar otro</button>
                <button onClick={onClose} style={{ ...S.btn, ...S.btnGhost }}>Cerrar</button>
              </div>
            </div>
          )}

          {vista === 'historial' && (
            <div>
              {cargando && <p style={{ color: '#94a3b8', fontSize: 13 }}>Cargando...</p>}
              {!cargando && historial.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tienes mensajes enviados.</p>
              )}
              {!cargando && historial.map(fb => {
                const badge = ESTADO_BADGE[fb.estado] || ESTADO_BADGE.pendiente
                const tipoInfo = TIPOS.find(t => t.value === fb.tipo)
                return (
                  <div key={fb.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                        {tipoInfo?.icon} {fb.asunto}
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: badge.bg, color: badge.color, fontWeight: 600 }}>
                        {badge.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#475569', margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>{fb.mensaje}</p>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {new Date(fb.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {fb.respuesta_admin && (
                      <div style={{ marginTop: 8, padding: '8px 10px', background: '#f0fdf4', borderRadius: 6, borderLeft: '3px solid #22c55e' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#065f46', marginBottom: 2 }}>Respuesta del equipo:</div>
                        <p style={{ fontSize: 12, color: '#1e293b', margin: 0, whiteSpace: 'pre-wrap' }}>{fb.respuesta_admin}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
