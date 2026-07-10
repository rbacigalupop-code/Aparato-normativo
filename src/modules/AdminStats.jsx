import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  obtenerStatsOrganizacion,
  obtenerActividadOrganizacion,
  obtenerUsuariosActivos,
  obtenerUsagePlatforma,
  obtenerRecibeSignups,
  setRecibeSignups,
} from '../supabase'
import ActividadUsuarios from './ActividadUsuarios.jsx'

// ─── Límites del plan Supabase Free ──────────────────────────────────────────
const LIMITE_DB_MB   = 500    // 500 MB base de datos
const LIMITE_BW_GB   = 5      // 5 GB ancho de banda / mes (no medible desde la app)

export default function AdminStats() {
  const { orgActual, isAdmin } = useAuth()

  const [stats, setStats]               = useState(null)
  const [actividad, setActividad]       = useState([])
  const [usuariosActivos, setUsuariosActivos] = useState([])
  const [usage, setUsage]               = useState(null)
  const [recibeSignups, setRecibeSignupsState] = useState(null)   // null = cargando
  const [togglingSignups, setTogglingSignups]  = useState(false)
  const [cargando, setCargando]         = useState(false)
  const [error, setError]               = useState(null)

  useEffect(() => {
    if (orgActual?.id && isAdmin) cargarDatos()
  }, [orgActual?.id, isAdmin])

  async function cargarDatos() {
    setCargando(true)
    setError(null)
    try {
      const [statsRes, actividadRes, usuariosRes, usageRes, signupsRes] = await Promise.all([
        obtenerStatsOrganizacion(orgActual.id),
        obtenerActividadOrganizacion(orgActual.id, 20),
        obtenerUsuariosActivos(orgActual.id, 5),
        obtenerUsagePlatforma(),
        obtenerRecibeSignups(orgActual.id),
      ])

      if (statsRes.ok) setStats(statsRes.data)
      else setError('Error al cargar estadísticas')

      setActividad(actividadRes || [])
      setUsuariosActivos(usuariosRes || [])
      if (usageRes.ok) setUsage(usageRes.data)
      if (signupsRes.ok) setRecibeSignupsState(signupsRes.data)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos')
    } finally {
      setCargando(false)
    }
  }

  async function toggleRecibeSignups() {
    if (togglingSignups || !orgActual?.id) return
    setTogglingSignups(true)
    const nuevoValor = !recibeSignups
    const res = await setRecibeSignups(orgActual.id, nuevoValor)
    if (res.ok) setRecibeSignupsState(nuevoValor)
    else setError('No se pudo cambiar el ajuste de registro. Intenta de nuevo.')
    setTogglingSignups(false)
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

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ ...S.h1, margin: 0 }}>📊 Estadísticas</h1>
        <button style={S.btnSm('#0f766e')} onClick={cargarDatos} disabled={cargando}>
          {cargando ? '⏳ Actualizando...' : '↺ Actualizar'}
        </button>
      </div>

      {error && <div style={{ ...S.err, marginBottom: 16 }}>{error}</div>}

      {/* ── Registro abierto ──────────────────────────────────────────────── */}
      <RecibeSignupsCard
        activo={recibeSignups}
        cargando={cargando || recibeSignups === null}
        toggling={togglingSignups}
        onToggle={toggleRecibeSignups}
      />

      {/* ── Cards resumen org ──────────────────────────────────────────────── */}
      <div style={S.cardsGrid}>
        <MetricCard icon="👥" label="Total Usuarios"   value={stats?.totalUsuarios   || '—'} loading={cargando} />
        <MetricCard icon="📁" label="Total Proyectos"  value={stats?.totalProyectos  || '—'} loading={cargando} />
        <MetricCard icon="📅" label="Este mes"         value={stats?.proyectosEsteMes || '—'} sublabel="proyectos" loading={cargando} />
        <MetricCard icon="🕐" label="Último acceso"    value={stats?.ultimoAcceso    || '—'} small loading={cargando} />
      </div>

      {/* ── Uso de plataforma (Supabase Free limits) ──────────────────────── */}
      <UsagePlatforma usage={usage} cargando={cargando} />

      {/* ── Actividad reciente ─────────────────────────────────────────────── */}
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
                    <th key={h} style={{
                      background: '#f8fafc', padding: '6px 10px', textAlign: 'left',
                      fontWeight: 700, borderBottom: '2px solid #e2e8f0', fontSize: 11, color: '#64748b',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actividad.map((item, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#fff' }}>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                        fontSize: 10, fontWeight: 600,
                        background: getActionColor(item.accion).bg,
                        color: getActionColor(item.accion).color,
                      }}>{item.accion}</span>
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

      {/* ── Top usuarios ──────────────────────────────────────────────────── */}
      <div style={{ ...S.card, marginTop: 20 }}>
        <h2 style={S.h2}>🌟 Top usuarios {usuariosActivos.length > 0 && `(${usuariosActivos.length})`}</h2>
        {cargando && <div style={{ color: '#94a3b8', fontSize: 12 }}>⏳ Cargando...</div>}
        {!cargando && usuariosActivos.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: 12 }}>No hay datos de usuarios.</div>
        )}
        {!cargando && usuariosActivos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {usuariosActivos.map((user, idx) => (
              <div key={idx} style={{
                padding: 12, background: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>#{idx + 1}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  {user.nombre_completo}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f766e', marginBottom: 2 }}>
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

      {/* ── Calendario de actividad por usuario ──────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <ActividadUsuarios />
      </div>
    </div>
  )
}

// ─── Toggle: registro abierto ─────────────────────────────────────────────────
function RecibeSignupsCard({ activo, cargando, toggling, onToggle }) {
  const encendido = activo === true

  return (
    <div style={{
      ...S.card,
      marginBottom: 16,
      borderLeft: `4px solid ${encendido ? '#16a34a' : '#94a3b8'}`,
      display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
    }}>
      {/* Ícono + estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
        <span style={{ fontSize: 28 }}>{encendido ? '🟢' : '⚫'}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
            Registro abierto
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, marginTop: 2,
            color: encendido ? '#16a34a' : '#64748b',
          }}>
            {cargando ? 'Verificando…' : encendido ? 'ACTIVO' : 'INACTIVO'}
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div style={{ flex: 1, minWidth: 200 }}>
        {encendido ? (
          <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
            Cualquier persona que se registre con email/contraseña queda automáticamente
            en <b>esta organización</b> como <b>viewer</b>. Lo verás de inmediato en el panel
            y podrás cambiarle el rol cuando quieras.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            Los usuarios que se registren directamente crearán <b>su propio workspace</b> y
            no aparecerán en tu organización. Activa esta opción para captarlos automáticamente.
          </p>
        )}
      </div>

      {/* Botón */}
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={onToggle}
          disabled={cargando || toggling}
          style={{
            padding: '7px 18px', borderRadius: 6, fontWeight: 700, fontSize: 12,
            cursor: cargando || toggling ? 'not-allowed' : 'pointer',
            border: 'none',
            background: encendido ? '#fee2e2' : '#dcfce7',
            color:      encendido ? '#991b1b' : '#166534',
            opacity:    cargando || toggling ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          {toggling ? '⏳ Guardando…' : encendido ? '🔴 Desactivar' : '🟢 Activar'}
        </button>
      </div>
    </div>
  )
}

// ─── Sección uso de plataforma ─────────────────────────────────────────────────
function UsagePlatforma({ usage, cargando }) {
  const dbMb     = usage ? Number(usage.db_size_mb)      : null
  const proyMb   = usage ? Number(usage.proyectos_size_mb) : null
  const dbPct    = dbMb != null ? Math.min(100, (dbMb / LIMITE_DB_MB) * 100) : null

  // Color de la barra según % de uso
  function barColor(pct) {
    if (pct >= 85) return { bar: '#dc2626', bg: '#fee2e2', text: '#991b1b' }
    if (pct >= 60) return { bar: '#f59e0b', bg: '#fef3c7', text: '#92400e' }
    return { bar: '#16a34a', bg: '#dcfce7', text: '#166534' }
  }

  const dbCol = dbPct != null ? barColor(dbPct) : null

  // Etiqueta de alerta
  function alertaDb(pct) {
    if (pct >= 85) return { icon: '🔴', msg: 'Crítico — actualiza a Supabase Pro pronto' }
    if (pct >= 60) return { icon: '🟡', msg: 'Atención — planifica la actualización' }
    return { icon: '🟢', msg: 'Holgado' }
  }

  return (
    <div style={{ ...S.card, marginTop: 20, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ ...S.h2, margin: 0 }}>💾 Uso de plataforma</h2>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>Plan Supabase Free</span>
      </div>

      {cargando && <div style={{ color: '#94a3b8', fontSize: 12 }}>⏳ Cargando métricas...</div>}

      {!cargando && !usage && (
        <div style={{ ...S.warn, fontSize: 12 }}>
          No se pudieron cargar las métricas. Ejecuta la migración <code>012_get_platform_usage.sql</code> en el SQL Editor de Supabase.
        </div>
      )}

      {!cargando && usage && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          {/* ── Base de datos ─────────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Base de datos</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                <b style={{ color: '#1e293b' }}>{dbMb?.toFixed(1)} MB</b> / {LIMITE_DB_MB} MB
              </span>
            </div>
            {/* Barra principal */}
            <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${dbPct?.toFixed(1) || 0}%`,
                background: dbCol?.bar,
                transition: 'width 0.5s ease',
              }} />
            </div>
            {/* % y alerta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 99,
                background: dbCol?.bg, color: dbCol?.text,
              }}>
                {dbPct?.toFixed(1)}%
              </span>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {alertaDb(dbPct).icon} {alertaDb(dbPct).msg}
              </span>
            </div>
            {/* Desglose */}
            {proyMb != null && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>DESGLOSE</div>
                <DesgloseFila label="Proyectos (datos + snapshots)" mb={proyMb} total={dbMb} color="#0f766e" />
                <DesgloseFila label="Resto (auth, índices, auditoría)" mb={Math.max(0, dbMb - proyMb)} total={dbMb} color="#94a3b8" />
              </div>
            )}
          </div>

          {/* ── Conteos globales ─────────────────────────────────────── */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Registros</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: '📁', label: 'Proyectos',  val: usage.total_proyectos },
                { icon: '📋', label: 'Templates',  val: usage.total_templates },
                { icon: '👤', label: 'Usuarios',   val: usage.total_usuarios  },
                { icon: '🏢', label: 'Orgs',       val: usage.total_orgs      },
                { icon: '🔑', label: 'Tokens activos', val: usage.tokens_legado },
                { icon: '📜', label: 'Auditoría',  val: usage.registros_auditoria },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', background: '#f8fafc',
                  border: '1px solid #f1f5f9', borderRadius: 6,
                }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{val ?? '—'}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Ancho de banda y links ─────────────────────────────── */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Ancho de banda y dashboards</div>
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 6, padding: '10px 12px', fontSize: 11,
              color: '#64748b', lineHeight: 1.7, marginBottom: 10,
            }}>
              ℹ️ El ancho de banda mensual no es consultable desde la app.
              Límite Free: <b>5 GB Supabase</b> · <b>100 GB Vercel</b>.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ExternalLink href="https://supabase.com/dashboard/project/_/settings/billing" label="Supabase → Billing &amp; Usage" icon="🔗" />
              <ExternalLink href="https://vercel.com/dashboard" label="Vercel → Usage" icon="🔗" />
            </div>
            {/* Consejo según uso */}
            {dbPct != null && dbPct >= 60 && (
              <div style={{
                marginTop: 12, background: '#fef3c7',
                border: '1px solid #fde68a', borderRadius: 6,
                padding: '8px 12px', fontSize: 11, color: '#92400e',
              }}>
                💡 Para escalar, considera separar las imágenes de detalles ilustrados a Supabase Storage (reduce el tamaño de DB hasta 10×).
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
function DesgloseFila({ label, mb, total, color }) {
  const pct = total > 0 ? (mb / total) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct.toFixed(1)}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 10, color: '#64748b', minWidth: 56, textAlign: 'right' }}>
        {mb.toFixed(1)} MB
      </span>
      <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 120 }}>{label}</span>
    </div>
  )
}

function ExternalLink({ href, label, icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', background: '#f0fdfa',
        border: '1px solid #99f6e4', borderRadius: 6,
        fontSize: 11, color: '#0e6560', textDecoration: 'none', fontWeight: 600,
      }}
    >
      {icon} {label}
    </a>
  )
}

function MetricCard({ icon, label, value, sublabel, small, loading }) {
  return (
    <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: small ? 16 : 24, fontWeight: 700, color: '#0f766e' }}>
        {loading ? '...' : value}
      </div>
      {sublabel && <div style={{ fontSize: 10, color: '#94a3b8' }}>{sublabel}</div>}
    </div>
  )
}

function getActionColor(accion) {
  const actions = {
    INSERT: { bg: '#dcfce7', color: '#166534' },
    UPDATE: { bg: '#ccfbf1', color: '#115e59' },
    DELETE: { bg: '#fee2e2', color: '#991b1b' },
    SELECT: { bg: '#fef3c7', color: '#713f12' },
  }
  return actions[accion] || { bg: '#f1f5f9', color: '#475569' }
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = {
  h1: { fontSize: 22, fontWeight: 700, color: '#0e6560' },
  h2: { fontSize: 15, fontWeight: 700, color: '#0e6560', margin: '0 0 12px 0' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 },
  btnSm: (c = '#64748b') => ({ background: '#fff', color: c, border: `1px solid ${c}`, borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }),
  warn: { background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, padding: '8px 12px', fontSize: 12 },
  ok:   { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#166534' },
  err:  { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#991b1b' },
}
