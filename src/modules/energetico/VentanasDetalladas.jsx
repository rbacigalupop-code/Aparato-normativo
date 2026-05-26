// ─────────────────────────────────────────────────────────────────────────────
// VentanasDetalladas — Cálculo combinado U_ventana (marco+vidrio+intercalario).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react'
import {
  MARCOS, VIDRIOS, INTERCALARIOS, SUGERENCIAS_POR_ZONA,
  obtenerMarco, obtenerVidrio, obtenerIntercalario,
} from '../../data/ventanas_detalladas.js'
import {
  calcularVentanaCombinada, cumpleDS15, UMAX_VENTANA_DS15,
} from '../../lib/engines/ventanas_detalladas.js'
import AyudaEnergetico, { BadgeOrigen } from './AyudaEnergetico.jsx'
import { ZONA_DS15_LABELS } from '../../data/comunas_chile.js'

export default function VentanasDetalladas({ proy }) {
  const cfg = proy?.configEnergetica || {}
  const zonaEf = cfg.zonaDS15 || proy?.zona || 'D'
  const sugerencia = SUGERENCIAS_POR_ZONA[zonaEf] || SUGERENCIAS_POR_ZONA.D

  // Dimensiones + componentes
  const [ancho, setAncho]               = useState(1.2)
  const [alto, setAlto]                 = useState(1.2)
  const [marcoId, setMarcoId]           = useState(sugerencia.marco)
  const [vidrioId, setVidrioId]         = useState(sugerencia.vidrio)
  const [intercalarioId, setIntercalarioId] = useState(sugerencia.intercalario)

  // Cálculo principal
  const r = useMemo(() => calcularVentanaCombinada({
    ancho_m: ancho, alto_m: alto, marcoId, vidrioId, intercalarioId,
  }), [ancho, alto, marcoId, vidrioId, intercalarioId])

  // Validación DS N°15
  const validacion = r ? cumpleDS15(r.U, zonaEf) : null

  // Comparativo: solución actual vs sugerencia óptima vs mejor posible
  const comparativos = useMemo(() => {
    if (!r) return []
    const configs = [
      { lbl: 'Tu configuración', marcoId, vidrioId, intercalarioId, recomendada: false },
      { lbl: 'Sugerida zona ' + zonaEf, marcoId: sugerencia.marco, vidrioId: sugerencia.vidrio, intercalarioId: sugerencia.intercalario, recomendada: true },
      { lbl: 'Mejor posible (Passive House)', marcoId: 'pvc_7camaras', vidrioId: 'triple_low_e_argon', intercalarioId: 'warm_edge_premium', recomendada: false },
    ]
    return configs.map(c => ({ ...c, resultado: calcularVentanaCombinada({ ancho_m: ancho, alto_m: alto, ...c }) }))
  }, [ancho, alto, marcoId, vidrioId, intercalarioId, zonaEf, sugerencia])

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>
      <Hero r={r} validacion={validacion} zonaEf={zonaEf} />

      <AyudaEnergetico
        icon="🪟"
        titulo="Ventanas detalladas (U combinado)"
        intro="Una ventana no se reduce a 'U del vidrio'. La transmitancia real es la combinación ponderada de tres componentes: marco, vidrio e intercalario (separador). Esta pestaña calcula el U_ventana real según NCh3079 / ISO 10077 y compara con el Umax DS N°15 de tu zona."
        pasos={[
          'Define las <b>dimensiones</b> de la ventana en metros (ancho × alto).',
          'Selecciona el <b>marco</b>, <b>vidrio</b> e <b>intercalario</b>. La app pre-selecciona la sugerencia óptima según tu zona DS N°15.',
          'Revisa el <b>U combinado</b> resultante y si <b>cumple Umax DS N°15</b>.',
          'Usa el <b>comparador</b> al final para ver tu configuración vs la sugerida vs Casa Pasiva.',
        ]}
        origenDatos={[
          { campo: 'Zona DS N°15 — para sugerencia y validación Umax', origen: 'energetico:configuracion' },
          { campo: 'Catálogo marcos/vidrios/intercalarios — propiedades industria', origen: 'auto' },
          { campo: 'Dimensiones + selección componentes — los defines tú', origen: 'usuario' },
        ]}
        normativa="NCh3079 · ISO 10077-1 · DS N°15 Tabla 3 (Umax ventana por zona)"
      />

      {/* ── Configurador ─────────────────────────────────────── */}
      <Card titulo="🔧 Configura tu ventana">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
          <Field label="Ancho (m)">
            <input type="number" min={0.4} max={4} step={0.1} value={ancho} onChange={e => setAncho(Number(e.target.value) || 0)} style={inputStyle} />
          </Field>
          <Field label="Alto (m)">
            <input type="number" min={0.4} max={3} step={0.1} value={alto} onChange={e => setAlto(Number(e.target.value) || 0)} style={inputStyle} />
          </Field>
          <Field label="Área total">
            <div style={{ padding: '6px 10px', fontSize: 12, background: 'var(--bg-alt)', borderRadius: 6 }}>
              <b>{r?.A_total} m²</b>
            </div>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <Field label="Marco">
            <select value={marcoId} onChange={e => setMarcoId(e.target.value)} style={inputStyle}>
              {MARCOS.map(m => <option key={m.id} value={m.id}>{m.nombre} (U {m.u})</option>)}
            </select>
            {marcoId === sugerencia.marco && <BadgeInline texto="Sugerido para tu zona" />}
          </Field>
          <Field label="Vidrio (DVH / triple)">
            <select value={vidrioId} onChange={e => setVidrioId(e.target.value)} style={inputStyle}>
              {VIDRIOS.map(v => <option key={v.id} value={v.id}>{v.nombre} (U {v.u} · g {v.g})</option>)}
            </select>
            {vidrioId === sugerencia.vidrio && <BadgeInline texto="Sugerido para tu zona" />}
          </Field>
          <Field label="Intercalario (separador)">
            <select value={intercalarioId} onChange={e => setIntercalarioId(e.target.value)} style={inputStyle}>
              {INTERCALARIOS.map(i => <option key={i.id} value={i.id}>{i.nombre} (Ψ {i.psi})</option>)}
            </select>
            {intercalarioId === sugerencia.intercalario && <BadgeInline texto="Sugerido para tu zona" />}
          </Field>
        </div>
      </Card>

      {/* ── Resultado y desglose ─────────────────────────────── */}
      <Card titulo="📊 Resultado del cálculo combinado">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 16 }}>
          <BigKPI label="U combinado" value={`${r.U} W/m²K`} color={validacion?.cumple ? 'var(--ok)' : 'var(--bad)'} sub={validacion ? (validacion.cumple ? `✅ Cumple zona ${zonaEf}` : `❌ Excede Umax ${validacion.umax}`) : ''} />
          <BigKPI label="Factor solar (g)" value={r.g} sub="ganancia solar relativa" />
          <BigKPI label="Transmisión luminosa" value={r.tl} sub="cuánta luz pasa" />
          <BigKPI label="Área marco / vidrio" value={`${r.pctMarco}% / ${r.pctVidrio}%`} sub={`${r.A_marco} / ${r.A_vidrio} m²`} />
        </div>

        {/* Desglose */}
        <div style={{ background: 'var(--bg-alt)', padding: '12px 16px', borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
            🔬 Desglose de la transmitancia
          </div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th style={th2}>Componente</th>
                <th style={th2}>Propiedad</th>
                <th style={th2}>Magnitud</th>
                <th style={th2}>Aporte W/K</th>
                <th style={th2}>% del total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td2}>Marco</td>
                <td style={td2}>U = {r.componentes.marco.u} W/m²K</td>
                <td style={td2}>{r.A_marco} m²</td>
                <td style={{ ...td2, fontFamily: 'var(--font-num)', fontWeight: 700 }}>{r.Q_marco}</td>
                <td style={td2}>{r.Q_total > 0 ? Math.round(r.Q_marco / r.Q_total * 100) : 0}%</td>
              </tr>
              <tr>
                <td style={td2}>Vidrio</td>
                <td style={td2}>U = {r.componentes.vidrio.u} W/m²K</td>
                <td style={td2}>{r.A_vidrio} m²</td>
                <td style={{ ...td2, fontFamily: 'var(--font-num)', fontWeight: 700 }}>{r.Q_vidrio}</td>
                <td style={td2}>{r.Q_total > 0 ? Math.round(r.Q_vidrio / r.Q_total * 100) : 0}%</td>
              </tr>
              <tr>
                <td style={td2}>Intercalario</td>
                <td style={td2}>Ψ = {r.componentes.intercalario.psi} W/m·K</td>
                <td style={td2}>{r.L_intercalario} m</td>
                <td style={{ ...td2, fontFamily: 'var(--font-num)', fontWeight: 700 }}>{r.Q_intercalario}</td>
                <td style={td2}>{r.Q_total > 0 ? Math.round(r.Q_intercalario / r.Q_total * 100) : 0}%</td>
              </tr>
              <tr style={{ borderTop: '2px solid var(--line)', fontWeight: 700 }}>
                <td style={td2}>Total</td>
                <td style={td2}></td>
                <td style={td2}>{r.A_total} m²</td>
                <td style={{ ...td2, fontFamily: 'var(--font-num)' }}>{r.Q_total}</td>
                <td style={td2}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Comparativo ──────────────────────────────────────── */}
      <Card titulo="⚖ Comparativo: tu configuración vs alternativas">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {comparativos.map((c, i) => (
            <div key={i} style={{
              padding: 14, borderRadius: 8,
              background: c.recomendada ? 'var(--accent-bg)' : 'var(--bg-alt)',
              border: `1px solid ${c.recomendada ? 'var(--accent)' : 'var(--line)'}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                {c.lbl} {c.recomendada && <span style={{ fontSize: 9, color: 'var(--accent)' }}>⭐</span>}
              </div>
              <div style={{
                fontSize: 24, fontWeight: 800, color: 'var(--ink)',
                fontFamily: 'var(--font-display)', lineHeight: 1, margin: '6px 0',
              }}>
                {c.resultado.U} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>W/m²K</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                {c.resultado.componentes.marco.nombre} +<br/>
                {c.resultado.componentes.vidrio.nombre} +<br/>
                {c.resultado.componentes.intercalario.nombre}
              </div>
              <div style={{
                fontSize: 9, marginTop: 8, padding: '3px 8px', display: 'inline-block',
                background: cumpleDS15(c.resultado.U, zonaEf)?.cumple ? 'var(--ok-bg)' : 'var(--bad-bg)',
                color: cumpleDS15(c.resultado.U, zonaEf)?.cumple ? 'var(--ok)' : 'var(--bad)',
                borderRadius: 99, fontWeight: 700,
              }}>
                {cumpleDS15(c.resultado.U, zonaEf)?.cumple ? '✓ Cumple' : '✗ No cumple'} DS N°15
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>
        Cálculo según NCh3079 / ISO 10077-1. El factor solar g_w es el factor del vidrio
        ponderado por la fracción de hueco. Para certificación CEV: confirmar con ETC.
      </p>
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero({ r, validacion, zonaEf }) {
  if (!r) return null
  const cumple = validacion?.cumple
  return (
    <div style={{
      background: `linear-gradient(135deg, ${cumple ? '#16a34a' : '#dc2626'}, #1e293b)`,
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '20px 28px', color: '#fff', marginBottom: 16,
    }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.85, marginBottom: 4 }}>
        Cálculo combinado U_ventana · Zona {zonaEf} · {ZONA_DS15_LABELS[zonaEf]}
      </div>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        U = {r.U} W/m²K · g = {r.g}
      </h2>
      <p style={{ fontSize: 12, margin: '6px 0 0', opacity: 0.92 }}>
        {cumple
          ? `✅ Cumple Umax DS N°15 zona ${zonaEf} (≤${validacion.umax}). Margen: ${validacion.margen} W/m²K`
          : `❌ Excede Umax DS N°15 zona ${zonaEf} (≤${validacion?.umax}). Cambia marco o vidrio para mejorar.`}
      </p>
    </div>
  )
}

// ─── Helpers UI ─────────────────────────────────────────────────────────────
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

function BigKPI({ label, value, sub, color }) {
  return (
    <div>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1.1, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ink-3)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  )
}

function BadgeInline({ texto }) {
  return (
    <div style={{ fontSize: 9, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>
      ⭐ {texto}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '6px 10px', fontSize: 12,
  border: '1px solid var(--line)', borderRadius: 6,
  background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit',
}
const th2 = { padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }
const td2 = { padding: '5px 8px', fontSize: 11, color: 'var(--ink-2)', borderBottom: '1px solid var(--line-soft)' }
