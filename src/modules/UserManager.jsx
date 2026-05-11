import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { validarEmail, validarRol, validarEmailDiferente, validarEmailUnico } from '../utils/validation'

export default function UserManager() {
  const {
    orgActual,
    isAdmin,
    user,
    invitarUsuario,
    listarUsuarios,
    listarInvitacionesPendientes,
    cancelarInvitacion,
    reenviarInvitacion,
    cambiarRol,
    desactivarUsuario,
    generarLinkInvitacion,
  } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState(null)
  const [emailInvitar, setEmailInvitar] = useState('')
  const [rolInvitar, setRolInvitar] = useState('viewer')

  // Modal de confirmación de invitación exitosa
  const [confirmacionInvitacion, setConfirmacionInvitacion] = useState(null)

  // Cargar usuarios cuando cambio orgActual
  useEffect(() => {
    if (orgActual) {
      cargarTodo()
    }
  }, [orgActual])

  // Cargar usuarios e invitaciones de la org
  async function cargarTodo() {
    setCargando(true)
    const [usuariosData, invitacionesData] = await Promise.all([
      listarUsuarios(),
      listarInvitacionesPendientes(),
    ])
    setUsuarios(usuariosData || [])
    setInvitaciones(invitacionesData || [])
    setCargando(false)
  }

  // Mantener compatibilidad con el nombre anterior
  const cargarUsuarios = cargarTodo

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

    // Validar que el email sea diferente del usuario actual
    const emailDiferenteErr = validarEmailDiferente(emailInvitar, user?.email)
    if (emailDiferenteErr) {
      setMsg({ tipo: 'err', texto: `Error: ${emailDiferenteErr}` })
      setTimeout(() => setMsg(null), 5000)
      return
    }

    // Validar rol
    const rolErr = validarRol(rolInvitar)
    if (rolErr) {
      setMsg({ tipo: 'err', texto: `Error: ${rolErr}` })
      setTimeout(() => setMsg(null), 5000)
      return
    }

    // Verificar si el usuario ya existe en esta organización (en usuarios o invitaciones)
    const emailsExistentes = [
      ...usuarios.map(u => u.email || u.nombre_completo),
      ...invitaciones.map(i => i.nombre_completo),
    ].filter(Boolean)
    const emailUnicoErr = validarEmailUnico(emailInvitar, emailsExistentes)
    if (emailUnicoErr) {
      setMsg({ tipo: 'err', texto: `Error: ${emailUnicoErr}` })
      setTimeout(() => setMsg(null), 5000)
      return
    }

    setCargando(true)
    const result = await invitarUsuario(emailInvitar, rolInvitar)
    setCargando(false)

    if (result.ok) {
      // Guardar detalles para mostrar modal de confirmación
      setConfirmacionInvitacion({
        email: emailInvitar,
        rol: rolInvitar,
        organizacion: orgActual?.nombre || 'Mi Workspace',
        fecha: new Date().toLocaleString('es-CL', {
          dateStyle: 'long',
          timeStyle: 'short',
        }),
        mensaje: result.message || `Invitación creada para ${emailInvitar}`,
      })
      setEmailInvitar('')
      setRolInvitar('viewer')
      cargarUsuarios()
    } else {
      const errorMsg = result.error?.message || result.error || 'Error desconocido'
      setMsg({ tipo: 'err', texto: `Error: ${errorMsg}` })
      setTimeout(() => setMsg(null), 5000)
    }
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

  // Cancelar invitación pendiente
  async function handleCancelarInvitacion(invitacionId, email) {
    if (!window.confirm(`¿Cancelar la invitación para ${email}?\nEsta acción no se puede deshacer.`)) return

    const result = await cancelarInvitacion(invitacionId)
    if (result.ok) {
      setMsg({ tipo: 'ok', texto: `Invitación a ${email} cancelada` })
      cargarTodo()
    } else {
      setMsg({ tipo: 'err', texto: result.error || 'Error al cancelar invitación' })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  // Re-enviar invitación
  async function handleReenviarInvitacion(invitacionId, email) {
    const result = await reenviarInvitacion(invitacionId)
    if (result.ok) {
      // Generar link de invitación y copiarlo al clipboard
      const link = generarLinkInvitacion(email)
      try {
        await navigator.clipboard.writeText(link)
        setMsg({ tipo: 'ok', texto: `✓ Invitación re-enviada y link copiado al portapapeles para ${email}` })
      } catch (err) {
        setMsg({ tipo: 'ok', texto: `✓ Invitación re-enviada a ${email}` })
      }
      cargarTodo()
    } else {
      setMsg({ tipo: 'err', texto: result.error || 'Error al re-enviar invitación' })
    }
    setTimeout(() => setMsg(null), 5000)
  }

  // Copiar link de invitación al clipboard
  async function handleCopiarLink(email) {
    const link = generarLinkInvitacion(email)
    try {
      await navigator.clipboard.writeText(link)
      setMsg({ tipo: 'ok', texto: `✓ Link de invitación copiado al portapapeles` })
    } catch (err) {
      setMsg({ tipo: 'err', texto: 'No se pudo copiar el link' })
    }
    setTimeout(() => setMsg(null), 3000)
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
          💡 El usuario debe registrarse con este email. Su perfil se vinculará automáticamente.
        </div>
      </div>

      {/* ─── Invitaciones Pendientes ──────────────────────────────────────── */}
      {invitaciones.length > 0 && (
        <div style={{ ...S.card, marginTop: 16, background: '#fffbeb', borderColor: '#fde047' }}>
          <h2 style={{ ...S.h2, color: '#a16207' }}>
            ⏳ Invitaciones pendientes ({invitaciones.length})
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Email', 'Rol', 'Invitado', 'Acciones'].map(h => (
                    <th
                      key={h}
                      style={{
                        background: '#fef3c7',
                        padding: '6px 10px',
                        textAlign: 'left',
                        fontWeight: 700,
                        borderBottom: '2px solid #fde047',
                        fontSize: 11,
                        color: '#713f12',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invitaciones.map(inv => {
                  const fechaInvitacion = inv.created_at
                    ? new Date(inv.created_at).toLocaleDateString('es-CL', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'
                  return (
                    <tr key={inv.id} style={{ background: '#fff' }}>
                      {/* Email */}
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #fef3c7', fontFamily: 'monospace', fontSize: 11 }}>
                        {inv.nombre_completo}
                      </td>
                      {/* Rol */}
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #fef3c7' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 600,
                          background: inv.rol === 'admin' ? '#dbeafe' : '#f1f5f9',
                          color: inv.rol === 'admin' ? '#1e40af' : '#64748b',
                        }}>
                          {inv.rol === 'admin' ? '👨‍💼 Admin' : '👁️ Viewer'}
                        </span>
                      </td>
                      {/* Fecha invitación */}
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #fef3c7', color: '#64748b', fontSize: 11 }}>
                        {fechaInvitacion}
                      </td>
                      {/* Acciones */}
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #fef3c7', whiteSpace: 'nowrap' }}>
                        <button
                          style={{ ...S.btnSm('#0369a1'), marginRight: 4 }}
                          onClick={() => handleCopiarLink(inv.nombre_completo)}
                          title="Copiar link de invitación"
                        >
                          🔗 Link
                        </button>
                        <button
                          style={{ ...S.btnSm('#166534'), marginRight: 4 }}
                          onClick={() => handleReenviarInvitacion(inv.id, inv.nombre_completo)}
                          disabled={cargando}
                          title="Re-enviar invitación"
                        >
                          📧 Re-enviar
                        </button>
                        <button
                          style={S.btnSm('#dc2626')}
                          onClick={() => handleCancelarInvitacion(inv.id, inv.nombre_completo)}
                          disabled={cargando}
                          title="Cancelar invitación"
                        >
                          ✕ Cancelar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: '#a16207', marginTop: 10, paddingTop: 10, borderTop: '1px solid #fde047' }}>
            💡 Estas invitaciones se activarán automáticamente cuando el usuario se registre con su email.
          </div>
        </div>
      )}

      {/* ─── Tabla de usuarios ────────────────────────────────────────────── */}
      <div style={{ ...S.card, marginTop: 16 }}>
        <h2 style={S.h2}>📋 Usuarios activos {usuarios?.length > 0 && `(${usuarios.length})`}</h2>

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

      {/* ─── Modal: Confirmación de invitación exitosa ─────────────────────── */}
      {confirmacionInvitacion && (
        <div style={S.modalOverlay} onClick={() => setConfirmacionInvitacion(null)}>
          <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Icono de éxito */}
            <div style={S.modalIcon}>
              <div style={S.checkCircle}>✓</div>
            </div>

            {/* Título */}
            <h2 style={S.modalTitle}>¡Invitación enviada con éxito!</h2>
            <p style={S.modalSubtitle}>
              Los siguientes detalles de la invitación han sido registrados:
            </p>

            {/* Detalles */}
            <div style={S.detailsBox}>
              <div style={S.detailRow}>
                <span style={S.detailLabel}>📧 Email invitado:</span>
                <span style={S.detailValue}>{confirmacionInvitacion.email}</span>
              </div>
              <div style={S.detailRow}>
                <span style={S.detailLabel}>👤 Rol asignado:</span>
                <span style={S.detailValue}>
                  {confirmacionInvitacion.rol === 'admin' ? '👨‍💼 Admin (acceso completo)' : '👁️ Viewer (solo lectura)'}
                </span>
              </div>
              <div style={S.detailRow}>
                <span style={S.detailLabel}>🏢 Organización:</span>
                <span style={S.detailValue}>{confirmacionInvitacion.organizacion}</span>
              </div>
              <div style={S.detailRow}>
                <span style={S.detailLabel}>📅 Fecha:</span>
                <span style={S.detailValue}>{confirmacionInvitacion.fecha}</span>
              </div>
            </div>

            {/* Mensaje informativo */}
            <div style={S.infoMessage}>
              <strong>💡 Próximos pasos:</strong>
              <ul style={S.infoList}>
                <li>Comparte el link de invitación con <strong>{confirmacionInvitacion.email}</strong></li>
                <li>El usuario debe registrarse en NormaCheck con ese email</li>
                <li>Al registrarse, su perfil se vinculará automáticamente a tu organización</li>
                <li>Recibirá el rol <strong>{confirmacionInvitacion.rol === 'admin' ? 'Admin' : 'Viewer'}</strong> que asignaste</li>
              </ul>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{
                  flex: 1,
                  background: '#fff',
                  color: '#0369a1',
                  border: '2px solid #0369a1',
                  borderRadius: 8,
                  padding: '12px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={async () => {
                  const link = generarLinkInvitacion(confirmacionInvitacion.email)
                  try {
                    await navigator.clipboard.writeText(link)
                    setMsg({ tipo: 'ok', texto: '✓ Link copiado al portapapeles' })
                    setTimeout(() => setMsg(null), 3000)
                  } catch (err) {
                    console.error('Error copiando link:', err)
                  }
                }}
              >
                🔗 Copiar link
              </button>
              <button
                style={{ ...S.modalCloseBtn, flex: 1 }}
                onClick={() => setConfirmacionInvitacion(null)}
              >
                ✓ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
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

  // ─── Estilos del modal de confirmación ────────────────────────────────────
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
    animation: 'fadeIn 0.2s ease-out',
  },
  modalCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '32px 28px',
    maxWidth: 480,
    width: '100%',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s ease-out',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalIcon: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: '#fff',
    fontSize: 36,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(22, 163, 74, 0.35)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
    margin: '0 0 8px 0',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  detailsBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1e293b',
    textAlign: 'right',
  },
  infoMessage: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 8,
    padding: 14,
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 20,
  },
  infoList: {
    margin: '8px 0 0 0',
    paddingLeft: 20,
    lineHeight: 1.6,
  },
  modalCloseBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #166534, #15803d)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
    transition: 'transform 0.1s',
  },
}

// Inyectar animaciones CSS para el modal
if (typeof document !== 'undefined' && !document.getElementById('user-manager-modal-animations')) {
  const styleEl = document.createElement('style')
  styleEl.id = 'user-manager-modal-animations'
  styleEl.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `
  document.head.appendChild(styleEl)
}
