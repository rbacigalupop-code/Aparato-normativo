// ─────────────────────────────────────────────────────────────────────────────
// Higrotermico — Análisis higrotérmico mensual (ISO 13788) + Moho VTT.
//
// Aporta:
//   1. Glaser mensual: ve qué meses condensan y cuáles secan
//   2. Balance anual: ¿se acumula o se evapora todo en verano?
//   3. Índice de moho VTT por capa (0-6)
//   4. Conclusión comparativa vs Glaser estacionario
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { climaMensual, MESES_LABELS, HR_INT_DEFAULT, T_INT_DEFAULT } from '../../data/clima_mensual.js'
import { zonaClimaDeOGUC } from '../../data/zona_clima.js'
import { analizarGlaserAnual } from '../../lib/engines/glaser_mensual.js'
import { analizarMohoAnual, detectarSensibilidad, VEREDICTO_LABELS } from '../../lib/engines/moho_vtt.js'
import AyudaEnergetico, { BadgeOrigen } from './AyudaEnergetico.jsx'

const VEREDICTO_BALANCE = {
  sin_riesgo: { lbl: '✅ Sin riesgo',       color: '#16a34a', detalle: 'Nunca hay condensación en ningún mes del año.' },
  autoseca:   { lbl: '🟢 Auto-secante',     color: '#65a30d', detalle: 'Hay condensación en algunos meses pero todo se evapora en verano. Aceptable por ISO 13788.' },
  peak_alto:  { lbl: '🟡 Peak alto',        color: '#eab308', detalle: 'La acumulación supera 200 g/m² en algún mes — revisar.' },
  acumula:    { lbl: '🔴 Acumula',          color: '#dc2626', detalle: 'Al final del año queda agua sin secar. Problema progresivo.' },
}

export default function Higrotermico({ proy, calcUInit }) {
  const cfg = proy?.configEnergetica || {}
  const zonaEf = zonaClimaDeOGUC(proy?.zona, cfg.comunaKey || proy?.comuna)

  // ── Encontrar el primer elemento del proyecto con capas (priorizar muro) ──
  const elemento = useMemo(() => {
    if (!calcUInit) return null
    const entries = Object.entries(calcUInit)
    // Buscar muro primero
    const muro = entries.find(([k]) => k === 'muro' || k.endsWith('::muro'))
    const cualquiera = muro || entries.find(([_, v]) => v?.capas?.length > 0)
    if (!cualquiera) return null
    const [key, data] = cualquiera
    const elemKey = key.includes('::') ? key.split('::').pop() : key
    const elemTipo = elemKey === 'techo' ? 'techumbre' : elemKey === 'piso' ? 'piso' : 'muro'
    // Filtrar y normalizar capas: el motor espera esp en metros
    const capas = (data.capas || [])
      .filter(c => c && (c.esCamara || (parseFloat(c.lam) > 0 && parseFloat(c.esp) > 0)))
      .map(c => c.esCamara ? { esCamara: true, mat: c.mat || 'Cámara' } : {
        mat: c.mat,
        lam: parseFloat(c.lam),
        esp: parseFloat(c.esp) / 1000,  // mm → m
        mu:  parseFloat(c.mu) || 1,
      })
    return { key, elemKey, elemTipo, capas, label: data.label || elemKey }
  }, [calcUInit])

  // ── Clima mensual ─────────────────────────────────────────────────────────
  const clima = useMemo(() => climaMensual(cfg.comunaKey, zonaEf), [cfg.comunaKey, zonaEf])

  // ── Glaser mensual ────────────────────────────────────────────────────────
  const analisis = useMemo(() => {
    if (!elemento) return null
    return analizarGlaserAnual(elemento.capas, clima, elemento.elemTipo)
  }, [elemento, clima])

  // ── Moho VTT — para la capa interior crítica ──────────────────────────────
  const mohos = useMemo(() => {
    if (!elemento || !analisis) return []
    // Para cada capa NO-cámara, analizar la condición en su cara interior.
    return elemento.capas.map((capa, idx) => {
      if (capa.esCamara) return null
      // T y HR de la interfaz interior de esta capa = T_iface[idx]
      // Sacamos los 12 valores
      const mesesData = analisis.detallesMensual.map(d => {
        const ifaceData = d.ifaces[idx - 1]  // ifaces son interfaces internas (i=1..n-1)
        // Para la cara más interior del muro (idx=0), usar T_int directamente
        const T = ifaceData?.T ?? d.t_ext
        // HR cerca de saturación si hay condensación, si no estimar con pv_real/pv_sat
        let HR_local = 50
        if (ifaceData) {
          HR_local = Math.min(100, (ifaceData.pv_real / Math.max(1, ifaceData.pv_sat)) * 100)
        } else {
          HR_local = HR_INT_DEFAULT
        }
        return { T, HR: HR_local }
      })

      const sens = detectarSensibilidad(capa.mat || '')
      const moho = analizarMohoAnual(mesesData, sens)
      return { capaIdx: idx, capaMat: capa.mat, sensibilidad: sens, moho }
    }).filter(Boolean)
  }, [elemento, analisis])

  // ── Render ────────────────────────────────────────────────────────────────
  if (!elemento) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💧</div>
        <h2 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>
          Análisis higrotérmico dinámico
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
          Para usar esta calculadora necesitas tener al menos un <b>cálculo U completo</b>
          en el módulo Normativo (pestaña Cálculo U). El análisis se aplicará al primer
          elemento de envolvente con capas válidas.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>
      <Hero analisis={analisis} elemento={elemento} />

      <AyudaEnergetico
        icon="💧"
        titulo="Análisis higrotérmico dinámico"
        intro="Método Glaser mensual (ISO 13788) + Modelo VTT de crecimiento de moho. Mientras Glaser anual responde sí/no a la condensación, este análisis dinámico distingue casos críticos: ¿se acumula humedad año tras año? ¿Se evapora en verano? ¿En qué meses crece moho?"
        pasos={[
          'El análisis usa automáticamente el <b>primer elemento de envolvente</b> con cálculo U completo.',
          'Revisa la <b>tabla de 12 meses</b>: cada mes muestra T_ext, HR_ext y si hay condensación.',
          'El <b>balance anual</b> indica si la humedad acumulada se seca o queda atrapada (criterio ISO 13788: peak ≤ 200 g/m²).',
          'El <b>índice de moho VTT</b> por capa estima el riesgo en escala 0-6 (M ≥ 3 es problemático).',
          'Compara el veredicto dinámico contra el Glaser estacionario para entender cuándo el riesgo es real vs solo teórico.',
        ]}
        origenDatos={[
          { campo: 'Capas y espesores del muro analizado — desde Cálculo U', origen: 'normativo:calculo-u' },
          { campo: 'T_ext mensual estimada por modelo sinusoidal según comuna', origen: 'auto' },
          { campo: 'HR_ext anual por zona DS N°15 (45% norte, 78% sur, 87% Magallanes)', origen: 'auto' },
          { campo: 'T_int = 20°C, HR_int = 55% — estándar ISO 13788', origen: 'auto' },
          { campo: 'Sensibilidad a moho por material — auto-detectada', origen: 'auto' },
        ]}
        normativa="EN ISO 13788 (método mensual) · Modelo VTT (Viitanen-Hukka 1999) · NCh1973 / NCh853"
      />

      {/* ── Veredicto general ───────────────────────────────────────────── */}
      <Card titulo="🎯 Veredicto del análisis dinámico">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <KPIVeredicto
            titulo="Balance higrotérmico anual"
            veredicto={analisis?.veredicto}
            labels={VEREDICTO_BALANCE}
            dato={`Peak: ${analisis?.interfazCritica.peakG} g/m² · Final año: ${analisis?.interfazCritica.acumFinalG} g/m²`}
          />
          <KPIDato
            titulo="Meses con condensación"
            valor={`${analisis?.mesesConCondensacion || 0} / 12`}
            color={analisis?.mesesConCondensacion === 0 ? 'var(--ok)' : analisis?.mesesConCondensacion <= 4 ? 'var(--warn)' : 'var(--bad)'}
          />
          <KPIDato
            titulo="ISO 13788"
            valor={analisis?.cumpleISO13788 ? '✓ Cumple' : '✗ No cumple'}
            color={analisis?.cumpleISO13788 ? 'var(--ok)' : 'var(--bad)'}
            sub={analisis?.cumpleISO13788 ? 'Peak ≤ 200 g/m² y balance ≤ 0' : 'Excede criterios'}
          />
        </div>
      </Card>

      {/* ── Detalle por mes ─────────────────────────────────────────────── */}
      <Card titulo="📅 Análisis mes a mes">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Mes</th>
                <th style={th}>T ext</th>
                <th style={th}>HR ext</th>
                <th style={th}>Condensa</th>
                <th style={th}>Interfaz más crítica</th>
                <th style={th}>Acum. crítica (g/m²)</th>
              </tr>
            </thead>
            <tbody>
              {analisis?.detallesMensual.map(d => {
                const criticIdx = analisis.interfazCritica.idx
                const ifaceCrit = d.ifaces[criticIdx]
                const acum = (d.acumulado[criticIdx] || 0) * 1000
                return (
                  <tr key={d.mes} style={{
                    background: d.condensa ? 'var(--bad-bg)' : 'transparent',
                    borderBottom: '1px solid var(--line-soft)',
                  }}>
                    <td style={{ ...td, fontWeight: 700 }}>{d.label}</td>
                    <td style={td}>{d.t_ext}°C</td>
                    <td style={td}>{d.hr_ext}%</td>
                    <td style={{ ...td, color: d.condensa ? 'var(--bad)' : 'var(--ok)', fontWeight: 700 }}>
                      {d.condensa ? '💧 Sí' : '✓ No'}
                    </td>
                    <td style={td}>
                      {ifaceCrit ? `Int.${ifaceCrit.i} · T=${ifaceCrit.T}°C` : '—'}
                    </td>
                    <td style={{ ...td, fontFamily: 'var(--font-num)', fontWeight: 700, color: acum > 200 ? 'var(--bad)' : acum > 50 ? 'var(--warn)' : 'var(--ink)' }}>
                      {acum.toFixed(1)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Gráfico de barras de acumulación */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
            📊 Acumulación de agua condensada en la interfaz crítica (g/m²)
          </div>
          <GraficoMensual detalles={analisis?.detallesMensual || []} idxCritica={analisis?.interfazCritica.idx || 0} />
        </div>
      </Card>

      {/* ── Moho VTT por capa ───────────────────────────────────────────── */}
      <Card titulo="🦠 Crecimiento de moho proyectado (Modelo VTT)">
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12 }}>
          Índice M (0-6): 0 = sin moho, 3 = visible a simple vista (inaceptable), 6 = cobertura total.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {mohos.map(m => {
            if (!m.moho) return null
            const ver = VEREDICTO_LABELS[m.moho.veredicto] || VEREDICTO_LABELS.sin_riesgo
            return (
              <div key={m.capaIdx} style={{
                padding: 14, borderRadius: 8,
                background: `${ver.color}11`,
                border: `1px solid ${ver.color}66`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                  Capa {m.capaIdx}: {m.capaMat || '—'}
                </div>
                <div style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 8 }}>
                  Sensibilidad: {['', 'Muy alta', 'Alta', 'Media', 'Baja'][m.sensibilidad]}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: ver.color, fontFamily: 'var(--font-display)' }}>
                    M={m.moho.M_max}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>peak</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: ver.color, marginBottom: 4 }}>
                  {ver.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4 }}>
                  {ver.detalle}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <p style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', marginTop: 12, fontStyle: 'italic', lineHeight: 1.5 }}>
        Cálculo según ISO 13788 método mensual + Modelo VTT (Viitanen-Hukka 1999). Es una
        aproximación cuasi-estacionaria. Para certificación oficial: requiere simulación
        dinámica horaria (WUFI, Delphin) con datos climáticos completos y propiedades
        higrotérmicas medidas de los materiales. Sin embargo, los órdenes de magnitud y
        el veredicto cualitativo (auto-seca vs acumula) son válidos para decisiones de
        diseño.
      </p>
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero({ analisis, elemento }) {
  const ver = analisis ? VEREDICTO_BALANCE[analisis.veredicto] : VEREDICTO_BALANCE.sin_riesgo
  return (
    <div style={{
      background: `linear-gradient(135deg, ${ver.color}, #1e293b)`,
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '22px 28px', color: '#fff', marginBottom: 16,
    }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.85, marginBottom: 4 }}>
        Análisis higrotérmico dinámico · {elemento.label}
      </div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        {ver.lbl}
      </h2>
      <p style={{ fontSize: 12, margin: '6px 0 0', opacity: 0.92, maxWidth: 700, lineHeight: 1.5 }}>
        {ver.detalle}
      </p>
    </div>
  )
}

// ─── Gráfico SVG mensual ─────────────────────────────────────────────────────
function GraficoMensual({ detalles, idxCritica }) {
  if (!detalles?.length) return null
  const W = 600, H = 140
  const padL = 40, padR = 10, padT = 10, padB = 24
  const gW = W - padL - padR
  const gH = H - padT - padB
  const barW = gW / 12

  const valores = detalles.map(d => (d.acumulado[idxCritica] || 0) * 1000)  // gramos
  const maxV = Math.max(50, ...valores)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
      {/* Grid horizontal */}
      {[0, 0.5, 1].map(f => {
        const y = padT + (1 - f) * gH
        const v = Math.round(maxV * f)
        return (
          <g key={f}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={padL - 4} y={y + 3} fontSize={9} fill="#94a3b8" textAnchor="end">{v}</text>
          </g>
        )
      })}

      {/* Línea criterio 200 g/m² */}
      {200 < maxV && (() => {
        const y = padT + (1 - 200 / maxV) * gH
        return (
          <g>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#dc2626" strokeWidth={1} strokeDasharray="4 3" />
            <text x={W - padR - 2} y={y - 2} fontSize={8} fill="#dc2626" textAnchor="end">Límite ISO 13788 (200 g/m²)</text>
          </g>
        )
      })()}

      {/* Barras */}
      {valores.map((v, i) => {
        const x = padL + i * barW + 2
        const h = (v / maxV) * gH
        const y = padT + gH - h
        const color = v > 200 ? '#dc2626' : v > 50 ? '#f59e0b' : '#0d9488'
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW - 4} height={Math.max(0, h)} fill={color} rx={1} />
            <text x={x + (barW - 4) / 2} y={H - padB + 12} fontSize={8} fill="#64748b" textAnchor="middle">
              {detalles[i].label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Helpers UI ──────────────────────────────────────────────────────────────
function Card({ titulo, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg, 12px)', padding: 18, marginBottom: 14,
    }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{titulo}</h3>
      {children}
    </div>
  )
}

function KPIVeredicto({ titulo, veredicto, labels, dato }) {
  const v = labels[veredicto] || labels.sin_riesgo
  return (
    <div style={{
      padding: 12, borderRadius: 8,
      background: `${v.color}11`, border: `1px solid ${v.color}55`,
    }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ink-3)', fontWeight: 600 }}>{titulo}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: v.color, fontFamily: 'var(--font-display)', lineHeight: 1.1, marginTop: 4 }}>
        {v.lbl}
      </div>
      {dato && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>{dato}</div>}
      <div style={{ fontSize: 10, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.4 }}>{v.detalle}</div>
    </div>
  )
}

function KPIDato({ titulo, valor, sub, color }) {
  return (
    <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-alt)' }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ink-3)', fontWeight: 600 }}>{titulo}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1.1, marginTop: 4 }}>
        {valor}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

const th = { padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700,
             color: 'var(--ink-3)', borderBottom: '2px solid var(--line)', textTransform: 'uppercase', letterSpacing: 0.6 }
const td = { padding: '7px 10px', color: 'var(--ink-2)' }
