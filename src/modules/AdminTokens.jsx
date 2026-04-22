// ─── MÓDULO: ADMIN — GESTIÓN DE TOKENS ────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { listarTokens, crearToken, actualizarToken, eliminarToken } from '../supabase.js'

// Genera un token aleatorio con formato OGUC-XXXX-XXXX-XXXX
function generarToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `OGUC-${seg(4)}-${seg(4)}-${seg(4)}`
}

// Fecha por defecto: 1 año desde hoy
function fechaDefault() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

const S = {
  card:   { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 12 },
  h2:     { fontSize: 15, fontWeight: 700, color: '#1e40af', margin: '0 0 12px 0' },
  h3:     { fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  label:  { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 },
  input:  { border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 12, width: '100%', boxSizing: 'border-box' },
  btn:    (c = '#1e40af') => ({ background: c, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }),
  btnSm:  (c = '#64748b') => ({ background: '#fff', color: c, border: `1px solid ${c}`, borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }),
  row:    { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 },
  col:    (w = 160) => ({ display: 'flex', flexDirection: 'column', gap: 3, minWidth: w }),
  ok:     { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#166534' },
  err:    { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991b1b' },
  warn:   { background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#713f12' },
}

export default function AdminTokens() {
  const { isAdmin } = useAuth()

  const [tokens,      setTokens]        = useState(null)
  const [cargando,    setCargando]      = useState(false)
  const [msg,         setMsg]           = useState(null)  // { tipo: 'ok'|'err', texto }

  // ── Form nuevo token ─────────────────────────────────────────────────────────
  const [nuevo, setNuevo] = useState({ token: generarToken(), descripcion: '', max_proyectos: '10', expires_at: fechaDefault() })
  const setN = (k, v) => setNuevo(p => ({ ...p, [k]: v }))

  // ── Cargar tokens ────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    const data = await listarTokens()
    setCargando(false)
    setTokens(data)
    if (!data) setMsg({ tipo: 'err', texto: 'No se pudo conectar a Supabase. Verifica la clave de servicio o los permisos RLS.' })
  }, [])

  useEffect(() => { if (isAdmin) cargar() }, [isAdmin, cargar])

  // ── Crear token ──────────────────────────────────────────────────────────────
  async function handleCrear(e) {
    e.preventDefault()
    if (!nuevo.token.trim() || !nuevo.expires_at) return
    const max = parseInt(nuevo.max_proyectos) || 0
    const res = await crearToken({ ...nuevo, max_proyectos: max })
    if (res.ok) {
      setMsg({ tipo: 'ok', texto: `Token ${nuevo.token} creado exitosamente.` })
      setNuevo({ token: generarToken(), descripcion: '', max_proyectos: '10', expires_at: fechaDefault() })
      cargar()
    } else {
      setMsg({ tipo: 'err', texto: `Error al crear: ${res.msg}` })
    }
    setTimeout(() => setMsg(null), 5000)
  }

  // ── Resetear contador ────────────────────────────────────────────────────────
  async function resetearUso(token) {
    const res = await actualizarToken(token, { proyectos_usados: 0 })
    if (res.ok) { setMsg({ tipo: 'ok', texto: `Contador de ${token} reseteado a 0.` }); cargar() }
    else        { setMsg({ tipo: 'err', texto: `Error: ${res.msg}` }) }
    setTimeout(() => setMsg(null), 4000)
  }

  // ── Activar/Desactivar token ─────────────────────────────────────────────────
  async function toggleActivo(token, activo) {
    const res = await actualizarToken(token, { activo: !activo })
    if (res.ok) { cargar() }
    else        { setMsg({ tipo: 'err', texto: `Error: ${res.msg}` }); setTimeout(() => setMsg(null), 4000) }
  }

  // ── Cambiar max_proyectos ────────────────────────────────────────────────────
  async function cambiarMax(token, max) {
    const v = parseInt(max)
    if (isNaN(v) || v < 0) return
    const res = await actualizarToken(token, { max_proyectos: v })
    if (res.ok) cargar()
    else        { setMsg({ tipo: 'err', texto: `Error: ${res.msg}` }); setTimeout(() => setMsg(null), 4000) }
  }

  // ── Eliminar token ───────────────────────────────────────────────────────────
  async function handleEliminar(token) {
    if (!window.confirm(`¿Eliminar permanentemente el token ${token}?`)) return
    const ok = await eliminarToken(token)
    if (ok) { setMsg({ tipo: 'ok', texto: `Token ${token} eliminado.` }); cargar() }
    else    { setMsg({ tipo: 'err', texto: 'No se pudo eliminar.' }) }
    setTimeout(() => setMsg(null), 4000)
  }

  // ── Verificar permiso de admin ──────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 380, margin: '40px auto' }}>
        <div style={{ ...S.card, textAlign: 'center', padding: '32px 28px', color: '#dc2626' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={{ ...S.h2, textAlign: 'center', color: '#dc2626' }}>Acceso denegado</h2>
          <p style={{ fontSize: 12, color: '#64748b' }}>
            Solo administradores pueden gestionar tokens.
          </p>
        </div>
      </div>
    )
  }

  // ── Panel principal ──────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ ...S.h2, margin: 0 }}>🔑 Gestión de tokens de acceso</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={S.btnSm('#1e40af')} onClick={cargar} disabled={cargando}>
            {cargando ? '⏳ Cargando...' : '↺ Recargar'}
          </button>
          <button style={S.btnSm('#dc2626')} onClick={() => setAutenticado(false)}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Mensaje de estado */}
      {msg && <div style={{ ...(msg.tipo === 'ok' ? S.ok : S.err), marginBottom: 12 }}>{msg.texto}</div>}

      {/* ── Crear nuevo token ───────────────────────────────────────────────── */}
      <div style={S.card}>
        <h3 style={S.h3}>➕ Crear nuevo token</h3>
        <form onSubmit={handleCrear}>
          <div style={S.row}>
            <div style={S.col(230)}>
              <label style={S.label}>Token</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ ...S.input, fontFamily: 'monospace', flex: 1 }}
                  value={nuevo.token} onChange={e => setN('token', e.target.value.toUpperCase())}
                  placeholder="OGUC-XXXX-XXXX-XXXX" required />
                <button type="button" style={S.btnSm('#0369a1')} onClick={() => setN('token', generarToken())}
                  title="Generar aleatorio">⚄</button>
              </div>
            </div>
            <div style={S.col(200)}>
              <label style={S.label}>Descripción / usuario</label>
              <input style={S.input} value={nuevo.descripcion}
                onChange={e => setN('descripcion', e.target.value)} placeholder="Ej: Estudio UCSC Prueba" />
            </div>
            <div style={S.col(120)}>
              <label style={S.label}>Máx. proyectos <span style={{ fontWeight: 400 }}>(0=∞)</span></label>
              <input style={S.input} type="number" min="0" value={nuevo.max_proyectos}
                onChange={e => setN('max_proyectos', e.target.value)} />
            </div>
            <div style={S.col(140)}>
              <label style={S.label}>Expira</label>
              <input style={S.input} type="date" value={nuevo.expires_at}
                onChange={e => setN('expires_at', e.target.value)} required />
            </div>
            <button type="submit" style={S.btn('#166534')}>Crear token</button>
          </div>
        </form>
      </div>

      {/* ── Tabla de tokens ─────────────────────────────────────────────────── */}
      <div style={S.card}>
        <h3 style={S.h3}>📋 Tokens existentes {tokens !== null && `(${tokens.length})`}</h3>

        {tokens === null && !cargando && (
          <div style={S.warn}>
            No se pudieron cargar los tokens. Verifica que la tabla <code>tokens</code> exista
            en Supabase y que la política RLS permita operaciones con la clave anon.
          </div>
        )}

        {cargando && <div style={{ color: '#94a3b8', fontSize: 12 }}>⏳ Cargando tokens...</div>}

        {tokens?.length === 0 && <div style={{ color: '#94a3b8', fontSize: 12 }}>No hay tokens creados.</div>}

        {tokens?.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Token', 'Descripción', 'Proyectos', 'Expira', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ background: '#f8fafc', padding: '6px 10px', textAlign: 'left',
                      fontWeight: 700, borderBottom: '2px solid #e2e8f0', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tokens.map(t => {
                  const expirado = new Date(t.expires_at) < new Date()
                  const agotado  = t.max_proyectos > 0 && t.proyectos_usados >= t.max_proyectos
                  const expStr   = new Date(t.expires_at).toLocaleDateString('es-CL')
                  return (
                    <tr key={t.token} style={{ background: !t.activo ? '#fafafa' : '#fff' }}>
                      {/* Token */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>
                        {t.token}
                      </td>
                      {/* Descripción */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', color: '#374151' }}>
                        {t.descripcion || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      {/* Proyectos — editable inline */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                        <span style={{ color: agotado ? '#dc2626' : '#166534', fontWeight: 700, marginRight: 4 }}>
                          {t.proyectos_usados} / {t.max_proyectos === 0 ? '∞' : t.max_proyectos}
                        </span>
                        <span style={{ display: 'inline-flex', gap: 4 }}>
                          <button style={S.btnSm('#0369a1')} onClick={() => resetearUso(t.token)} title="Resetear contador a 0">
                            ↺ reset
                          </button>
                          <select
                            style={{ fontSize: 10, border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 4px', cursor: 'pointer' }}
                            value={t.max_proyectos}
                            onChange={e => cambiarMax(t.token, e.target.value)}
                            title="Cambiar máximo">
                            <option value="0">∞ ilimitado</option>
                            {[1, 2, 3, 5, 10, 20, 50, 100].map(n => (
                              <option key={n} value={n}>{n} proy.</option>
                            ))}
                          </select>
                        </span>
                      </td>
                      {/* Expira */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9',
                        color: expirado ? '#dc2626' : '#166534', fontWeight: expirado ? 700 : 400, whiteSpace: 'nowrap' }}>
                        {expStr} {expirado && '⚠ vencido'}
                      </td>
                      {/* Estado */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>
                        <button
                          style={{ ...S.btnSm(t.activo ? '#166534' : '#dc2626'), minWidth: 70 }}
                          onClick={() => toggleActivo(t.token, t.activo)}>
                          {t.activo ? '✓ activo' : '✗ inactivo'}
                        </button>
                      </td>
                      {/* Acciones */}
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                        <button style={S.btnSm('#dc2626')} onClick={() => handleEliminar(t.token)}>
                          🗑 eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Nota sobre permisos RLS ─────────────────────────────────────────── */}
      <div style={{ ...S.warn, fontSize: 11 }}>
        <b>Nota RLS Supabase:</b> Si las operaciones fallan, asegúrate de que la tabla <code>tokens</code> tenga
        políticas RLS que permitan INSERT, UPDATE y DELETE con la clave anon, o desactiva RLS para esa tabla
        en el dashboard de Supabase (Dashboard → Authentication → Policies → tokens).
      </div>
    </div>
  )
}
