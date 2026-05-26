// ─────────────────────────────────────────────────────────────────────────────
// SolarFV — Sub-módulo de dimensionamiento y análisis de Solar Fotovoltaico.
// Ley 21.118 Net-billing. Calcula kWp, producción anual, payback, VAN25, CO₂.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { analizarFV } from '../../lib/engines/renovables.js'
import { TARIFA_ELEC_DEFAULT } from '../../data/combustibles.js'

const CONSUMO_TIPICO = {
  bajo:   2400,   // 200 kWh/mes — vivienda pequeña, 1-2 personas
  medio:  4200,   // 350 kWh/mes — vivienda promedio chilena
  alto:   7200,   // 600 kWh/mes — vivienda grande o uso intensivo
  custom: null,
}

export default function SolarFV({ proy }) {
  const cfg = proy?.configEnergetica || {}
  const tarifaElec = cfg.tarifaElec ?? TARIFA_ELEC_DEFAULT

  const [perfilConsumo, setPerfilConsumo] = useState('medio')
  const [consumoCustom, setConsumoCustom] = useState('')
  const [kWpForzar, setKWpForzar] = useState('')

  const consumo = perfilConsumo === 'custom'
    ? (parseFloat(consumoCustom) || 4200)
    : CONSUMO_TIPICO[perfilConsumo]

  const analisis = analizarFV({
    consumoKwhAnual: consumo,
    proy: proy,
    tarifaElec,
    kWpForzar: kWpForzar ? parseFloat(kWpForzar) : null,
    fraccionCobertura: 1.0,
  })

  // Comparador: 3 tamaños de sistema
  const sizes = [
    Math.max(1, analisis.kWp - 1),
    analisis.kWp,
    analisis.kWp + 2,
  ]
  const comparativos = sizes.map(kWp => analizarFV({
    consumoKwhAnual: consumo, proy, tarifaElec, kWpForzar: kWp,
  }))

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>
      <Hero />

      {/* ── Configuración ─────────────────────────────────────── */}
      <Card titulo="📊 Consumo eléctrico del hogar">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          {[
            { id: 'bajo',   lab: '🏠 Bajo',   sub: '~200 kWh/mes' },
            { id: 'medio',  lab: '🏡 Medio',  sub: '~350 kWh/mes' },
            { id: 'alto',   lab: '🏘 Alto',    sub: '~600 kWh/mes' },
            { id: 'custom', lab: '✏ Custom',  sub: 'kWh/año' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPerfilConsumo(p.id)}
              style={{
                padding: '10px 14px', borderRadius: 8,
                background: perfilConsumo === p.id ? 'var(--accent)' : 'var(--surface)',
                color: perfilConsumo === p.id ? '#fff' : 'var(--ink)',
                border: `1px solid ${perfilConsumo === p.id ? 'var(--accent)' : 'var(--line)'}`,
                cursor: 'pointer', fontWeight: 600, fontSize: 12, minWidth: 100,
              }}
            >
              <div>{p.lab}</div>
              <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>{p.sub}</div>
            </button>
          ))}
        </div>
        {perfilConsumo === 'custom' && (
          <input
            type="number" min={500} max={50000}
            value={consumoCustom}
            placeholder="Ingresa kWh/año"
            onChange={e => setConsumoCustom(e.target.value)}
            style={{ width: 180, padding: '6px 10px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--surface)' }}
          />
        )}
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>
          Tu consumo configurado: <b style={{ color: 'var(--ink)' }}>{consumo.toLocaleString('es-CL')} kWh/año</b>
          {' · '}
          Tarifa eléctrica: <b style={{ color: 'var(--ink)' }}>{tarifaElec} CLP/kWh</b>
        </div>
      </Card>

      {/* ── Resultado principal ─────────────────────────────────── */}
      <Card titulo={`☀️ Sistema recomendado para tu consumo`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          <BigKPI label="Potencia"       value={`${analisis.kWp.toFixed(1)} kWp`}  color="var(--accent)" />
          <BigKPI label="Producción anual" value={`${analisis.produccion.toLocaleString('es-CL')} kWh`} />
          <BigKPI label="Cobertura"      value={`${(analisis.cobertura * 100).toFixed(0)}%`} sub="de tu consumo" />
          <BigKPI label="Inversión"      value={`CLP ${(analisis.costo / 1e6).toFixed(1)}M`} sub="instalación llave en mano" />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '16px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          <BigKPI label="Ahorro anual"   value={`CLP ${(analisis.ahorroClp / 1000).toFixed(0)}k`}     color="var(--ok)" />
          <BigKPI label="Payback simple" value={analisis.paybackAnios ? `${analisis.paybackAnios} años` : '—'} />
          <BigKPI label="VAN a 25 años"  value={`CLP ${(analisis.van25 / 1e6).toFixed(1)}M`} color={analisis.van25 > 0 ? 'var(--ok)' : 'var(--bad)'} sub="valor presente neto" />
          <BigKPI label="CO₂ evitado/año" value={`${(analisis.co2EvitadoAnual / 1000).toFixed(1)} t`} sub={`${(analisis.co2Evitado25 / 1000).toFixed(0)} t a 25 años`} color="var(--ok)" />
        </div>

        {/* Desglose Net-billing */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-alt)', borderRadius: 8, fontSize: 11, color: 'var(--ink-2)' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>📋 Cómo se calcula el ahorro Net-billing</div>
          Autoconsumo simultáneo: <b>{analisis.autoconsumo.toLocaleString('es-CL')} kWh</b> a {tarifaElec} CLP/kWh = <b>CLP {(analisis.autoconsumo * tarifaElec).toLocaleString('es-CL')}</b><br/>
          Inyección a la red: <b>{analisis.inyeccion.toLocaleString('es-CL')} kWh</b> a ~{Math.round(tarifaElec * 0.62)} CLP/kWh (Ley 21.118) = <b>CLP {Math.round(analisis.inyeccion * tarifaElec * 0.62).toLocaleString('es-CL')}</b><br/>
          <span style={{ fontSize: 10, color: 'var(--ink-3)', fontStyle: 'italic' }}>
            Asume 35% autoconsumo y 65% inyección, típico residencial. Sistemas con batería elevan el ahorro.
          </span>
        </div>
      </Card>

      {/* ── Comparador 3 sistemas ────────────────────────────────── */}
      <Card titulo="⚖ Comparador de tamaños">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Tamaño</th>
                <th style={th}>Producción anual</th>
                <th style={th}>Cobertura</th>
                <th style={th}>Inversión</th>
                <th style={th}>Ahorro/año</th>
                <th style={th}>Payback</th>
                <th style={th}>VAN 25a</th>
              </tr>
            </thead>
            <tbody>
              {comparativos.map((c, i) => (
                <tr key={c.kWp} style={{
                  background: i === 1 ? 'var(--accent-bg)' : 'transparent',
                  fontWeight: i === 1 ? 600 : 400,
                }}>
                  <td style={td}><b>{c.kWp} kWp</b>{i === 1 && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--accent)', fontWeight: 700 }}>⭐ Recomendado</span>}</td>
                  <td style={td}>{c.produccion.toLocaleString('es-CL')} kWh</td>
                  <td style={td}>{(c.cobertura * 100).toFixed(0)}%</td>
                  <td style={td}>CLP {(c.costo / 1e6).toFixed(1)}M</td>
                  <td style={td}>CLP {(c.ahorroClp / 1000).toFixed(0)}k</td>
                  <td style={td}>{c.paybackAnios ? `${c.paybackAnios}a` : '—'}</td>
                  <td style={{ ...td, color: c.van25 > 0 ? 'var(--ok)' : 'var(--bad)', fontWeight: 700 }}>
                    CLP {(c.van25 / 1e6).toFixed(1)}M
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Datos del cálculo ───────────────────────────────────── */}
      <Card titulo="🌐 Datos de cálculo usados">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 11 }}>
          <DataRow label="Comuna" value={proy?.configEnergetica?.comunaKey || 'No configurada'} />
          <DataRow label="Irradiación anual" value={`${analisis.irrad.anual} kWh/m²·día`} />
          <DataRow label="Factor de capacidad" value={`${(analisis.irrad.fc_fv * 100).toFixed(1)}%`} />
          <DataRow label="Performance Ratio" value="0.78 (incluye pérdidas)" />
          <DataRow label="Vida útil sistema" value="25 años" />
          <DataRow label="Degradación anual" value="0.5% / año" />
        </div>
      </Card>

      <p style={{ fontSize: 11, color: 'var(--ink-3)', fontStyle: 'italic', textAlign: 'center', marginTop: 16 }}>
        Valores referenciales. Una cotización en terreno puede variar ±15% según orientación de techo,
        sombras, distancia al CGD y marca de equipos. Marco normativo: <b>Ley 21.118 Net-billing</b> + <b>DS 88/2020</b>.
      </p>
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '20px 28px', color: '#fff', marginBottom: 16,
    }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.9, marginBottom: 4 }}>
        Energías renovables · Solar fotovoltaico
      </div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        ☀️ Solar FV — Ley 21.118 Net-billing
      </h2>
      <p style={{ fontSize: 12, margin: '6px 0 0', opacity: 0.92 }}>
        Dimensionamiento e impacto económico de un sistema fotovoltaico residencial
        conectado a la red, según la normativa de generación distribuida vigente.
      </p>
    </div>
  )
}

function Card({ titulo, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg, 12px)', padding: 18, marginBottom: 14,
    }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
        {titulo}
      </h3>
      {children}
    </div>
  )
}

function BigKPI({ label, value, sub, color }) {
  return (
    <div>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ink-3)', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: color || 'var(--ink)',
        fontFamily: 'var(--font-display)', lineHeight: 1.1, marginTop: 3,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px dashed var(--line-soft)' }}>
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ color: 'var(--ink)', fontWeight: 500, fontFamily: 'var(--font-num)' }}>{value}</span>
    </div>
  )
}

const th = { padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700,
             color: 'var(--ink-3)', borderBottom: '2px solid var(--line)', textTransform: 'uppercase', letterSpacing: 0.6 }
const td = { padding: '8px 10px', borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-2)' }
