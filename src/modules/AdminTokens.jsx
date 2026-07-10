// ─── MÓDULO: ADMIN — GESTIÓN DE TOKENS POR USUARIO ────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'

const S = {
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 12 },
  h1: { fontSize: 22, fontWeight: 700, color: '#0e6560', margin: '0 0 16px 0' },
  h2: { fontSize: 15, fontWeight: 700, color: '#0e6560', margin: '0 0 12px 0' },
  label: { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 },
  input: { border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 12, width: '100%', boxSizing: 'border-box' },
  btn: (c = '#0e6560') => ({ background: c, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }),
  btnSm: (c = '#64748b') => ({ background: '#fff', color: c, border: `1px solid ${c}`, borderRadius: 5, padding: '4px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }),
  ok: { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#166534', marginBottom: 12 },
  err: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991b1b', marginBottom: 12 },
  warn: { background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#713f12', marginBottom: 12 },
  metric: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 16,
    textAlign: 'center',
    flex: 1,
    minWidth: 140,
  },
  metricValue: { fontSize: 28, fontWeight: 800, color: '#0e6560', lineHeight: 1 },
  metricLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
}

export default function AdminTokens() {
  const {
    isAdmin,
    orgActual,
    listarUsuariosConTokens,
    asignarTokens,
    establecerTokens,
    resetearTokensUsados,
  } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState(null)

  // Modal de asignar tokens
  const [modalAsignar, setModalAsignar] = useState(null) // { usuario, cantidad }

  // ── Cargar usuarios con tokens ──────────────────────────────────────────────
  const cargar = useCallback(async () => {
    if (!orgActual?.id) return
    setCargando(true)
    const data = await listarUsuariosConTokens(orgActual.id)
    setUsuarios(data || [])
    setCargando(false)
  }, [orgActual?.id, listarUsuariosConTokens])

  useEffect(() => {
    if (isAdmin) cargar()
  }, [isAdmin, cargar])

  // ── Agregar tokens rápido (+5, +10) ────────────────────────────────────────
  async function handleAgregar(perfilId, cantidad, email) {
    setCargando(true)
    const result = await asignarTokens(perfilId, cantidad)
    setCargando(false)

    if (result.ok) {
      setMsg({ tipo: 'ok', texto: `✓ ${cantidad > 0 ? `+${cantidad}` : cantidad} tokens para ${email}. Total: ${result.nuevoTotal}` })
      cargar()
    } else {
      setMsg({ tipo: 'err', texto: result.error || 'Error al asignar tokens' })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  // ── Establecer cantidad exacta ─────────────────────────────────────────────
  async function handleEstablecer() {
    if (!modalAsignar) return
    const cantidad = parseInt(modalAsignar.cantidad)
    if (isNaN(cantidad) || cantidad < 0) {
      setMsg({ tipo: 'err', texto: 'Cantidad inválida' })
      setTimeout(() => setMsg(null), 3000)
      return
    }

    setCargando(true)
    const result = await establecerTokens(modalAsignar.usuario.id, cantidad)
    setCargando(false)

    if (result.ok) {
      setMsg({ tipo: 'ok', texto: `✓ ${modalAsignar.usuario.nombre_completo}: ${result.nuevoTotal} tokens` })
      setModalAsignar(null)
      cargar()
    } else {
      setMsg({ tipo: 'err', texto: result.error || 'Error' })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  // ── Resetear contador de usados ────────────────────────────────────────────
  async function handleResetear(perfilId, email) {
    if (!window.confirm(`¿Resetear el contador de tokens usados de ${email} a 0?\nLos tokens disponibles NO se modifican.`)) return

    const result = await resetearTokensUsados(perfilId)
    if (result.ok) {
      setMsg({ tipo: 'ok', texto: `✓ Contador reseteado para ${email}` })
      cargar()
    } else {
      setMsg({ tipo: 'err', texto: result.error || 'Error al resetear' })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  // ── Estadísticas globales ─────────────────────────────────────────────────
  const totalDisponibles = usuarios.reduce((s, u) => s + (u.tokens_disponibles || 0), 0)
  const totalUsados = usuarios.reduce((s, u) => s + (u.tokens_usados || 0), 0)
  const totalUsuarios = usuarios.length

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ ...S.card, color: '#dc2626' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: 0 }}>Acceso denegado</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#94a3b8' }}>Solo administradores pueden gestionar tokens.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ ...S.h1, margin: 0 }}>🎫 Gestión de Tokens</h1>
        <button style={S.btn('#0f766e')} onClick={cargar} disabled={cargando}>
          {cargando ? '⏳ Cargando...' : '↺ Recargar'}
        </button>
      </div>

      {msg && <div style={msg.tipo === 'ok' ? S.ok : S.err}>{msg.texto}</div>}

      {/* ─── Estadísticas globales ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={S.metric}>
          <div style={S.metricValue}>{totalUsuarios}</div>
          <div style={S.metricLabel}>👥 Usuarios</div>
        </div>
        <div style={{ ...S.metric, background: '#ccfbf1', borderColor: '#5eead4' }}>
          <div style={{ ...S.metricValue, color: '#0e6560' }}>{totalDisponibles}</div>
          <div style={S.metricLabel}>🎫 Tokens disponibles</div>
        </div>
        <div style={{ ...S.metric, background: '#dcfce7', borderColor: '#86efac' }}>
          <div style={{ ...S.metricValue, color: '#166534' }}>{totalUsados}</div>
          <div style={S.metricLabel}>📊 Informes generados</div>
        </div>
      </div>

      {/* ─── Info / Reglas ──────────────────────────────────────────────── */}
      <div style={S.warn}>
        <strong>💡 Cómo funcionan los tokens:</strong>
        <ul style={{ margin: '4px 0 0 0', paddingLeft: 20, lineHeight: 1.6 }}>
          <li>Cada token equivale a <strong>1 informe generado</strong></li>
          <li>Los nuevos usuarios reciben <strong>2 tokens de bienvenida</strong></li>
          <li>Cuando un usuario se queda sin tokens, no puede generar más informes</li>
          <li>Solo el admin puede asignar más tokens</li>
        </ul>
      </div>

      {/* ─── Tabla de usuarios con tokens ───────────────────────────────── */}
      <div style={S.card}>
        <h2 style={S.h2}>👥 Usuarios y sus tokens ({usuarios.length})</h2>

        {cargando && <div style={{ color: '#94a3b8', fontSize: 12 }}>⏳ Cargando...</div>}

        {!cargando && usuarios.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>
            No hay usuarios en esta organización.
          </div>
        )}

        {usuarios.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Email', 'Rol', 'Disponibles', 'Usados', 'Acciones'].map(h => (
                    <th
                      key={h}
                      style={{
                        background: '#f8fafc',
                        padding: '8px 10px',
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
                  const disponibles = u.tokens_disponibles ?? 0
                  const usados = u.tokens_usados ?? 0
                  const bajos = disponibles < 2
                  return (
                    <tr key={u.id} style={{ background: !u.activo ? '#fafafa' : '#fff' }}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', fontSize: 11 }}>
                        {u.nombre_completo}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 600,
                          background: u.rol === 'admin' ? '#ccfbf1' : '#f1f5f9',
                          color: u.rol === 'admin' ? '#0e6560' : '#64748b',
                        }}>
                          {u.rol === 'admin' ? '👨‍💼 Admin' : '👁️ Viewer'}
                        </span>
                      </td>
                      {/* Tokens Disponibles */}
                      <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{
                          display: 'inline-block',
                          background: bajos ? '#fee2e2' : '#ccfbf1',
                          color: bajos ? '#991b1b' : '#0e6560',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 700,
                          minWidth: 30,
                          textAlign: 'center',
                        }}>
                          {disponibles}
                        </div>
                        {bajos && <span style={{ fontSize: 10, color: '#dc2626', marginLeft: 6 }}>⚠ bajos</span>}
                      </td>
                      {/* Tokens Usados */}
                      <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                        {usados}
                      </td>
                      {/* Acciones */}
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <button
                            style={S.btnSm('#166534')}
                            onClick={() => handleAgregar(u.id, 5, u.nombre_completo)}
                            disabled={cargando}
                            title="Agregar 5 tokens"
                          >
                            +5
                          </button>
                          <button
                            style={S.btnSm('#166534')}
                            onClick={() => handleAgregar(u.id, 10, u.nombre_completo)}
                            disabled={cargando}
                            title="Agregar 10 tokens"
                          >
                            +10
                          </button>
                          <button
                            style={S.btnSm('#0f766e')}
                            onClick={() => setModalAsignar({ usuario: u, cantidad: String(disponibles) })}
                            disabled={cargando}
                            title="Establecer cantidad exacta"
                          >
                            ✎ Editar
                          </button>
                          <button
                            style={S.btnSm('#a16207')}
                            onClick={() => handleResetear(u.id, u.nombre_completo)}
                            disabled={cargando}
                            title="Resetear contador de usados a 0"
                          >
                            🔄 Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal: Editar cantidad de tokens ─────────────────────────── */}
      {modalAsignar && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16,
          }}
          onClick={() => setModalAsignar(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', maxWidth: 420, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#04302e', margin: '0 0 4px 0' }}>
              🎫 Editar tokens
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px 0' }}>
              Usuario: <strong style={{ color: '#0e6560', fontFamily: 'monospace' }}>{modalAsignar.usuario.nombre_completo}</strong>
            </p>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: '#64748b' }}>
              <div>Disponibles actuales: <strong style={{ color: '#0e6560' }}>{modalAsignar.usuario.tokens_disponibles ?? 0}</strong></div>
              <div>Usados (histórico): <strong>{modalAsignar.usuario.tokens_usados ?? 0}</strong></div>
            </div>

            <label style={S.label}>Nueva cantidad de tokens disponibles</label>
            <input
              type="number"
              min="0"
              style={{ ...S.input, fontSize: 16, padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}
              value={modalAsignar.cantidad}
              onChange={e => setModalAsignar({ ...modalAsignar, cantidad: e.target.value })}
              autoFocus
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[5, 10, 25, 50, 100].map(n => (
                <button
                  key={n}
                  style={S.btnSm('#0f766e')}
                  onClick={() => setModalAsignar({ ...modalAsignar, cantidad: String(n) })}
                >
                  {n}
                </button>
              ))}
              <button
                style={S.btnSm('#7c3aed')}
                onClick={() => setModalAsignar({ ...modalAsignar, cantidad: '999' })}
                title="Ilimitado simbólico"
              >
                ∞ (999)
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ ...S.btn('#94a3b8'), flex: 1 }}
                onClick={() => setModalAsignar(null)}
              >
                Cancelar
              </button>
              <button
                style={{ ...S.btn('#166534'), flex: 1 }}
                onClick={handleEstablecer}
                disabled={cargando}
              >
                ✓ Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
