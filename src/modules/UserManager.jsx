import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { validarEmail } from '../utils/validation'

export default function UserManager() {
  const { orgActual, isAdmin, invitarUsuario, listarUsuarios, cambiarRol, desactivarUsuario } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState(null)
  const [emailInvitar, setEmailInvitar] = useState('')
  const [rolInvitar, setRolInvitar] = useState('viewer')

  // Cargar usuarios cuando cambio orgActual
  useEffect(() => {
    if (orgActual) {
      cargarUsuarios()
    }
  }, [orgActual])

  // Cargar usuarios de la org
  async function cargarUsuarios() {
    setCargando(true)
    const data = await listarUsuarios()
    setUsuarios(data || [])
    setCargando(false)
  }

  // Invitar usuario
  async function handleInvitar(e) {
    e.preventDefault()

    // Validar email
    const emailErr = validarEmail(emailInvitar)
    if (emailErr) {
      setMsg({ tipo: 'err', texto: `Error: ${emailErr}` })
      setTimeout(() => setMsg(null), 5000)
      return
    }

    // Verificar si el usuario ya existe en esta organización
    const usuarioExistente = usuarios.some(u => u.user_id || u.email === emailInvitar)
    if (usuarioExistente) {
      setMsg({ tipo: 'err', texto: 'Este usuario ya existe en la organización' })
      setTimeout(() => setMsg(null), 5000)
      return
    }

    setCargando(true)
    const result = await invitarUsuario(emailInvitar, rolInvitar)
    setCargando(false)

    if (result.ok) {
      setMsg({ tipo: 'ok', texto: `Invitación enviada a ${emailInvitar}` })
      setEmailInvitar('')
      setRolInvitar('viewer')
      cargarUsuarios()
    } else {
      const errorMsg = result.error?.message || result.error || 'Error desconocido'
      setMsg({ tipo: 'err', texto: `Error: ${errorMsg}` })
    }

    setTimeout(() => setMsg(null), 5000)
  }

  // Cambiar rol
  async function handleCambiarRol(perfilId, nuevoRol) {
    const ok = await cambiarRol(perfilId, nuevoRol)
    if (ok) {
      setMsg({ tipo: 'ok', texto: 'Rol actualizado' })
      cargarUsuarios()
    } else {
      setMsg({ tipo: 'err', texto: 'Error al actualizar rol' })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  // Desactivar usuario
  async function handleDesactivar(perfilId) {
    if (!window.confirm('¿Desactivar este usuario?')) return

    const ok = await desactivarUsuario(perfilId)
    if (ok) {
      setMsg({ tipo: 'ok', texto: 'Usuario desactivado' })
      cargarUsuarios()
    } else {
      setMsg({ tipo: 'err', texto: 'Error al desactivar usuario' })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  // Si no es admin, mostrar acceso denegado
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ ...S.card, color: '#dc2626' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: '0 0 8px 0' }}>Acceso denegado</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>Solo administradores pueden acceder a este panel.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ ...S.h1, margin: 0 }}>👥 Gestión de usuarios</h1>
        <button style={S.btnSm('#0369a1')} onClick={cargarUsuarios} disabled={cargando}>
          {cargando ? '⏳ Cargando...' : '↺ Recargar'}
        </button>
      </div>

      {/* Mensaje */}
      {msg && <div style={{ ...(msg.tipo === 'ok' ? S.ok : S.err), marginBottom: 16 }}>{msg.texto}</div>}

      {/* ─── Invitar usuario ──────────────────────────────────────────────── */}
      <div style={S.card}>
        <h2 style={S.h2}>➕ Invitar nuevo usuario</h2>
        <form onSubmit={handleInvitar}>
          <div style={S.row}>
            <div style={S.col(250)}>
              <label style={S.label}>Email del usuario</label>
              <input
                style={S.input}
                type="email"
                placeholder="usuario@estudio.cl"
                value={emailInvitar}
                onChange={e => setEmailInvitar(e.target.value)}
                required
                disabled={cargando}
              />
            </div>
            <div style={S.col(140)}>
              <label style={S.label}>Rol</label>
              <select style={S.input} value={rolInvitar} onChange={e => setRolInvitar(e.target.value)}>
                <option value="viewer">👁️ Viewer (lectura)</option>
                <option value="admin">👨‍💼 Admin (completo)</option>
              </select>
            </div>
            <button type="submit" style={S.btn('#166534')} disabled={cargando}>
              Enviar invitación
            </button>
          </div>
        </form>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          💡 El usuario recibirá un email con un enlace para confirmar su cuenta.
        </div>
      </div>

      {/* ─── Tabla de usuarios ────────────────────────────────────────────── */}
      <div style={{ ...S.card, marginTop: 16 }}>
        <h2 style={S.h2}>📋 Usuarios en esta organización {usuarios?.length > 0 && `(${usuarios.length})`}</h2>

        {cargando && <div style={{ color: '#94a3b8', fontSize: 12 }}>⏳ Cargando...</div>}

        {usuarios?.length === 0 && !cargando && <div style={{ color: '#94a3b8', fontSize: 12 }}>No hay usuarios aún.</div>}

        {usuarios?.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Email', 'Nombre', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map(h => (
                    <th
                      key={h}
                      style={{
                        background: '#f8fafc',
                        padding: '6px 10px',
                        textAlign: 'left',
                        fontWeight: 700,
                        borderBottom: '2px solid #e2e8f0',
                        fontSize: 11,
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const ultimoAcceso = u.ultimo_acceso
                    ? new Date(u.ultimo_acceso).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })
                    : '—'
                  return (
                    <tr key={u.id} style={{ background: !u.activo ? '#fafafa' : '#fff' }}>
                      {/* Email */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', fontSize: 11 }}>
                        {u.nombre_completo}
                      </td>
                      {/* Nombre */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', color: '#374151' }}>
                        {u.nombre_completo}
                      </td>
                      {/* Rol — editable */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>
                        <select
                          style={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 4, padding: '3px 6px', cursor: 'pointer' }}
                          value={u.rol}
                          onChange={e => handleCambiarRol(u.id, e.target.value)}
                          disabled={cargando}
                        >
                          <option value="viewer">👁️ Viewer</option>
                          <option value="admin">👨‍💼 Admin</option>
                        </select>
                      </td>
                      {/* Estado */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 600,
                            background: u.activo ? '#dcfce7' : '#fee2e2',
                            color: u.activo ? '#166534' : '#991b1b',
                          }}
                        >
                          {u.activo ? '✓ activo' : '✗ inactivo'}
                        </span>
                      </td>
                      {/* Último acceso */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 11 }}>
                        {ultimoAcceso}
                      </td>
                      {/* Acciones */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                        {u.activo && (
                          <button
                            style={S.btnSm('#dc2626')}
                            onClick={() => handleDesactivar(u.id)}
                            disabled={cargando}
                            title="Desactivar usuario"
                          >
                            🚫
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div style={{ ...S.warn, fontSize: 11, marginTop: 16 }}>
        <b>Información:</b> Los usuarios inactivos no pueden acceder a la aplicación. Puedes reactivarlos creando una nueva invitación
        con el mismo email.
      </div>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = {
  h1: { fontSize: 22, fontWeight: 700, color: '#1e40af' },
  h2: { fontSize: 15, fontWeight: 700, color: '#1e40af', margin: '0 0 12px 0' },
  label: { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 },
  input: { border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 12, width: '100%', boxSizing: 'border-box' },
  btn: (c = '#1e40af') => ({ background: c, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }),
  btnSm: (c = '#64748b') => ({ background: '#fff', color: c, border: `1px solid ${c}`, borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }),
  row: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 },
  col: (w = 160) => ({ display: 'flex', flexDirection: 'column', gap: 3, minWidth: w }),
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 0 },
  ok: { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#166534' },
  err: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991b1b' },
  warn: { background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#713f12' },
}
