// ─────────────────────────────────────────────────────────────────────────────
// ActividadUsuarios — Calendario heatmap de logins por usuario de la org.
//
// Estilo "GitHub contributions": matriz usuarios × días con intensidad de color
// según número de logins por día.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { obtenerActividadUsuarios, obtenerResumenActividad } from '../supabase'

const RANGOS = [
  { dias: 30,  label: '30 días' },
  { dias: 60,  label: '60 días' },
  { dias: 90,  label: '90 días' },
  { dias: 180, label: '6 meses' },
]

// Escala de color según número de logins en el día
function colorPorLogins(n) {
  if (!n)          return 'var(--bg-alt)'
  if (n === 1)     return '#a7f3d0'
  if (n <= 3)      return '#34d399'
  if (n <= 6)      return '#10b981'
  if (n <= 12)     return '#059669'
  return '#047857'
}

export default function ActividadUsuarios() {
  const { orgActual, isAdmin } = useAuth()
  const [datos, setDatos]       = useState([])
  const [resumen, setResumen]   = useState(null)
  const [diasAtras, setDiasAtras] = useState(60)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (orgActual?.id && isAdmin) cargar()
  }, [orgActual?.id, isAdmin, diasAtras])

  async function cargar() {
    setCargando(true)
    const [a, r] = await Promise.all([
      obtenerActividadUsuarios(orgActual.id, diasAtras),
      obtenerResumenActividad(orgActual.id),
    ])
    if (a.ok) setDatos(a.data)
    if (r.ok) setResumen(r.data)
    setCargando(false)
  }

  // ── Procesar datos: agrupar por usuario, generar lista de fechas ───────────
  const { usuarios, fechas, matriz } = useMemo(() => {
    const usuariosMap = new Map()
    const fechasSet = new Set()

    for (const d of datos) {
      if (!usuariosMap.has(d.perfil_id)) {
        usuariosMap.set(d.perfil_id, { id: d.perfil_id, nombre: d.nombre_completo, total: 0 })
      }
      usuariosMap.get(d.perfil_id).total += d.num_logins
      fechasSet.add(d.fecha)
    }

    // Generar todas las fechas del rango (incluso sin actividad)
    const hoy = new Date()
    const todasFechas = []
    for (let i = diasAtras - 1; i >= 0; i--) {
      const d = new Date(hoy)
      d.setDate(d.getDate() - i)
      todasFechas.push(d.toISOString().slice(0, 10))
    }

    const usuariosArr = Array.from(usuariosMap.values()).sort((a, b) => b.total - a.total)

    // Matriz [perfil_id][fecha] = num_logins
    const m = {}
    for (const u of usuariosArr) m[u.id] = {}
    for (const d of datos) {
      m[d.perfil_id][d.fecha] = d.num_logins
    }

    return { usuarios: usuariosArr, fechas: todasFechas, matriz: m }
  }, [datos, diasAtras])

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ ...S.card, color: '#dc2626' }}>
          🔒 Solo administradores pueden ver actividad de usuarios.
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={S.h1}>📅 Calendario de actividad</h1>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
            Logins por usuario en los últimos {diasAtras} días — hora Chile.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {RANGOS.map(r => (
            <button key={r.dias}
              onClick={() => setDiasAtras(r.dias)}
              style={{
                padding: '6px 12px', fontSize: 11, fontWeight: 600,
                background: diasAtras === r.dias ? '#0f766e' : '#fff',
                color: diasAtras === r.dias ? '#fff' : '#0f766e',
                border: '1px solid #0f766e', borderRadius: 5,
                cursor: 'pointer',
              }}>
              {r.label}
            </button>
          ))}
          <button onClick={cargar} disabled={cargando}
            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600,
                     background: '#fff', color: '#64748b', border: '1px solid #cbd5e1',
                     borderRadius: 5, cursor: 'pointer' }}>
            {cargando ? '⏳' : '↻'}
          </button>
        </div>
      </div>

      {/* KPIs resumen */}
      {resumen && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10, marginBottom: 16,
        }}>
          <KPI label="Logins últimos 30 días"        value={resumen.total_logins_30d ?? 0} icon="📊" />
          <KPI label="Usuarios activos (30d)"        value={resumen.usuarios_activos_30d ?? 0} icon="👥" />
          <KPI label="Usuarios activos (7d)"         value={resumen.usuarios_activos_7d ?? 0} icon="🔥" />
          <KPI label="Inactivos > 14 días"           value={resumen.usuarios_inactivos_14d ?? 0} icon="💤" warn />
        </div>
      )}

      {/* Heatmap */}
      <div style={S.card}>
        <h2 style={S.h2}>Matriz de actividad</h2>
        {cargando && <div style={{ color: '#94a3b8', fontSize: 12 }}>⏳ Cargando…</div>}

        {!cargando && usuarios.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: 13, padding: 20, textAlign: 'center' }}>
            Aún no hay sesiones registradas en este rango. La tabla empieza a llenarse
            con cada login a partir de ahora.
          </div>
        )}

        {!cargando && usuarios.length > 0 && (
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 1, fontSize: 9 }}>
              <thead>
                <tr>
                  <th style={{ ...thLeft, minWidth: 160 }}>Usuario</th>
                  <th style={thLeft}>Total</th>
                  {fechas.map((f, i) => {
                    const d = new Date(f)
                    const dia = d.getDate()
                    const esLunes = d.getDay() === 1
                    return (
                      <th key={f} style={{
                        width: 12, height: 24, padding: 0,
                        fontSize: 8, color: '#94a3b8', fontWeight: 500,
                        textAlign: 'center', borderBottom: '1px solid #e2e8f0',
                      }}>
                        {dia === 1 || (esLunes && diasAtras <= 60) ? dia : ''}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td style={tdLeft}>
                      <div style={{ fontWeight: 600, fontSize: 11 }}>{u.nombre || '—'}</div>
                    </td>
                    <td style={{ ...tdLeft, fontWeight: 700, color: '#0f766e', fontSize: 11, fontFamily: 'var(--font-num)' }}>
                      {u.total}
                    </td>
                    {fechas.map(f => {
                      const n = matriz[u.id]?.[f] || 0
                      return (
                        <td key={f}
                          title={`${formatFecha(f)} · ${n} login${n === 1 ? '' : 's'}`}
                          style={{
                            width: 12, height: 12,
                            background: colorPorLogins(n),
                            borderRadius: 2,
                            cursor: n ? 'help' : 'default',
                          }}
                        />
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Leyenda */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 12, fontSize: 10, color: '#64748b',
            }}>
              <span>Menos</span>
              {[0, 1, 3, 6, 12].map(n => (
                <span key={n} style={{
                  width: 12, height: 12, background: colorPorLogins(n),
                  borderRadius: 2, display: 'inline-block',
                }} />
              ))}
              <span>Más</span>
              <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
                Pasá el cursor sobre cada celda para ver detalle
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function KPI({ icon, label, value, warn }) {
  return (
    <div style={{
      background: warn && value > 0 ? '#fef3c7' : '#fff',
      border: `1px solid ${warn && value > 0 ? '#fde047' : '#e2e8f0'}`,
      borderRadius: 8, padding: 12,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', fontFamily: 'var(--font-num)' }}>
          {value}
        </div>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  )
}

function formatFecha(f) {
  const d = new Date(f + 'T00:00:00')
  return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
}

const S = {
  h1: { fontSize: 22, fontWeight: 700, color: '#0e6560', margin: 0 },
  h2: { fontSize: 14, fontWeight: 700, color: '#0e6560', margin: '0 0 12px 0' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 },
}
const thLeft = { padding: '4px 10px', textAlign: 'left', fontSize: 10, color: '#64748b', fontWeight: 700,
                 borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: 0.5,
                 background: '#f8fafc', position: 'sticky', left: 0, zIndex: 1 }
const tdLeft = { padding: '3px 10px', borderBottom: '1px solid #f1f5f9',
                 background: '#fff', position: 'sticky', left: 0, zIndex: 1 }
