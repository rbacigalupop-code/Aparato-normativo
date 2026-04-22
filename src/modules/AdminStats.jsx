import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { obtenerStatsOrganizacion, obtenerActividadOrganizacion, obtenerUsuariosActivos } from '../supabase'

export default function AdminStats() {
  const { orgActual, isAdmin } = useAuth()

  const [stats, setStats] = useState(null)
  const [actividad, setActividad] = useState([])
  const [usuariosActivos, setUsuariosActivos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (orgActual?.id && isAdmin) {
      cargarDatos()
    }
  }, [orgActual?.id, isAdmin])

  async function cargarDatos() {
    setCargando(true)
    setError(null)

    try {
      const [statsRes, actividadRes, usuariosRes] = await Promise.all([
        obtenerStatsOrganizacion(orgActual.id),
        obtenerActividadOrganizacion(orgActual.id, 20),
        obtenerUsuariosActivos(orgActual.id, 5),
      ])

      if (statsRes.ok) {
        setStats(statsRes.data)
      } else {
        setError('Error al cargar estadísticas')
      }

      setActividad(actividadRes || [])
      setUsuariosActivos(usuariosRes || [])
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos')
    } finally {
      setCargando(false)
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ ...S.card, color: '#dc2626' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: '0 0 8px 0' }}>Acceso denegado</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>Solo administradores pueden acceder a estadísticas.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ ...S.h1, margin: 0 }}>📊 Estadísticas</h1>
        <button style={S.btnSm('#0369a1')} onClick={cargarDatos} disabled={cargando}>
          {cargando ? '⏳ Actualizando...' : '↺ Actualizar'}
        </button>
      </div>

      {/* Error */}
      {error && <div style={{ ...S.err, marginBottom: 16 }}>{error}</div>}

      {/* Cards de resumen */}
      <div style={S.cardsGrid}>
        <MetricCard
          icon="👥"
          label="Total Usuarios"
          value={stats?.totalUsuarios || '—'}
          loading={cargando}
        />
        <MetricCard
          icon="📁"
          label="Total Proyectos"
          value={stats?.totalProyectos || '—'}
          loading={cargando}
        />
        <MetricCard
          icon="📅"
          label="Este mes"
          value={stats?.proyectosEsteMes || '—'}
          sublabel="proyectos"
          loading={cargando}
        />
        <MetricCard
          icon="🕐"
          label="Último acceso"
          value={stats?.ultimoAcceso || '—'}
          small={true}
          loading={cargando}
        />
      </div>

      {/* Actividad reciente */}
      <div style={{ ...S.card, marginTop: 20, marginBottom: 20 }}>
        <h2 style={S.h2}>📋 Actividad reciente {actividad.length > 0 && `(${actividad.length})`}</h2>

        {cargando && <div style={{ color: '#94a3b8', fontSize: 12 }}>⏳ Cargando...</div>}

        {!cargando && actividad.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: 12 }}>No hay actividad registrada.</div>
        )}

        {!cargando && actividad.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Acción', 'Usuario', 'Tabla', 'Hora'].map(h => (
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
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actividad.map((item, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#fff' }}>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: getActionColor(item.accion).bg,
                          color: getActionColor(item.accion).color,
                        }}
                      >
                        {item.accion}
                      </span>
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', color: '#374151' }}>
                      {item.usuario_nombre || item.user_id || '—'}
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 11 }}>
                      {item.tabla_nombre || '—'}
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontSize: 11 }}>
                      {item.tiempoTranscurrido}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usuarios más activos */}
      <div style={{ ...S.card, marginTop: 20 }}>
        <h2 style={S.h2}>🌟 Top usuarios {usuariosActivos.length > 0 && `(${usuariosActivos.length})`}</h2>

        {cargando && <div style={{ color: '#94a3b8', fontSize: 12 }}>⏳ Cargando...</div>}

        {!cargando && usuariosActivos.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: 12 }}>No hay datos de usuarios.</div>
        )}

        {!cargando && usuariosActivos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {usuariosActivos.map((user, idx) => (
              <div
                key={idx}
                style={{
                  padding: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>#{idx + 1}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  {user.nombre_completo}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0369a1', marginBottom: 2 }}>
                  {user.cantidad_proyectos}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>
                  proyecto{user.cantidad_proyectos !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, sublabel, small, loading }) {
  return (
    <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: small ? 16 : 24, fontWeight: 700, color: '#0369a1' }}>
        {loading ? '...' : value}
      </div>
      {sublabel && <div style={{ fontSize: 10, color: '#94a3b8' }}>{sublabel}</div>}
    </div>
  )
}

function getActionColor(accion) {
  const actions = {
    INSERT: { bg: '#dcfce7', color: '#166534' },
    UPDATE: { bg: '#dbeafe', color: '#0c4a6e' },
    DELETE: { bg: '#fee2e2', color: '#991b1b' },
    SELECT: { bg: '#fef3c7', color: '#713f12' },
  }
  return actions[accion] || { bg: '#f1f5f9', color: '#475569' }
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = {
  h1: { fontSize: 22, fontWeight: 700, color: '#1e40af' },
  h2: { fontSize: 15, fontWeight: 700, color: '#1e40af', margin: '0 0 12px 0' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 },
  btnSm: (c = '#64748b') => ({ background: '#fff', color: c, border: `1px solid ${c}`, borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }),
  ok: { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#166534' },
  err: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991b1b' },
}
