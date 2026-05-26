// ─────────────────────────────────────────────────────────────────────────────
// EnergeticoConfig — Pestaña de configuración energética por proyecto.
//
// Permite al usuario definir:
//   · Comuna (auto-selecciona macrozona, HDD18 y distribuidora referencial)
//   · Tarifa eléctrica BT1-A (override del valor referencial)
//   · Combustible de calefacción principal (+ precio editable)
//   · Sistema ACS
//   · Sistema cocción
//
// Persiste todo en proy.configEnergetica (objeto en el proyecto). El motor
// económico (economic.js) lee este objeto.
//
// Props:
//   proy: proyecto actual
//   onChangeProy: (newProy) => void
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import {
  MACROZONAS,
  DISTRIBUIDORAS_ELEC,
  TARIFA_ELEC_DEFAULT,
  COMBUSTIBLES_CALEFACCION,
  SISTEMAS_ACS,
  SISTEMAS_COCINA,
  zonaOGUCaMacrozona,
  clpKwhUtil,
} from '../../data/combustibles.js'
import { COMUNAS_LISTA, obtenerHDD18 } from '../../data/grados_dia.js'

export default function EnergeticoConfig({ proy, onChangeProy }) {
  const cfg = proy?.configEnergetica || {}

  function patchCfg(patch) {
    onChangeProy({
      ...proy,
      configEnergetica: { ...cfg, ...patch },
    })
  }

  // Defaults derivados
  const macrozona = cfg.macrozona || zonaOGUCaMacrozona(proy?.zona)
  const tarifaElec = cfg.tarifaElec ?? TARIFA_ELEC_DEFAULT
  const combCalefId = cfg.combustibleCalef || 'lena_no_cert'
  const combCalef = COMBUSTIBLES_CALEFACCION.find(c => c.id === combCalefId)
  const sistemaAcsId = cfg.sistemaACS || 'calefon_gas'
  const sistemaCocId = cfg.sistemaCocina || 'gas_glp'

  // Precio del combustible: override del usuario o el referencial de la macrozona
  const precioRef = combCalef?.precios?.[macrozona] || 0
  const precioComb = cfg.precioCombustible ?? precioRef

  // CLP/kWh útil calculado
  const clpKwh = combCalef?.usaTarifaElec
    ? tarifaElec / combCalef.rendTipico
    : (precioComb && combCalef) ? precioComb / (combCalef.pci_kwh_unidad * combCalef.rendTipico) : 0

  // HDD18 detectado
  const comunaKey = cfg.comunaKey || ''
  const hdd18 = obtenerHDD18(comunaKey, proy?.zona)

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2,
          fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6,
        }}>
          Módulo Energético · Configuración
        </div>
        <h1 style={{
          margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.3,
          color: 'var(--ink)', fontFamily: 'var(--font-display)',
          fontStyle: 'var(--display-italic, normal)',
        }}>
          Sistema energético del proyecto
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6, maxWidth: 720, lineHeight: 1.5 }}>
          Define los combustibles y tarifas reales del proyecto. Estos valores se usarán
          para calcular el costo de cada corrección, el payback de las inversiones y la
          demanda económica anual.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>

        {/* ── Localización ───────────────────────────────────────────────── */}
        <Card titulo="📍 Localización" descripcion="La comuna determina los grados-día y el clima.">
          <Field label="Comuna">
            <select value={comunaKey} onChange={e => patchCfg({ comunaKey: e.target.value })} style={inputStyle}>
              <option value="">— Selecciona comuna —</option>
              {COMUNAS_LISTA.map(c => (
                <option key={c.key} value={c.key}>{c.nombre} (Z{c.zona_ds15} · HDD {c.hdd18})</option>
              ))}
            </select>
          </Field>
          <DataRow label="Zona DS N°15" value={proy?.zona || '—'} />
          <DataRow label="Macrozona" value={MACROZONAS[macrozona]?.label || macrozona} />
          <DataRow label="Grados-día base 18°C" value={`${hdd18} °C·día`} highlight />
        </Card>

        {/* ── Electricidad ───────────────────────────────────────────────── */}
        <Card titulo="⚡ Tarifa eléctrica" descripcion="Define la tarifa BT1-A real del cliente.">
          <Field label="Distribuidora">
            <select
              value={cfg.distribuidora || 'otro'}
              onChange={e => {
                const d = DISTRIBUIDORAS_ELEC.find(x => x.id === e.target.value)
                patchCfg({ distribuidora: e.target.value, tarifaElec: d?.tarifa_clp_kwh ?? tarifaElec })
              }}
              style={inputStyle}
            >
              {DISTRIBUIDORAS_ELEC.map(d => (
                <option key={d.id} value={d.id}>{d.nombre} ({d.tarifa_clp_kwh} CLP/kWh)</option>
              ))}
            </select>
          </Field>
          <Field label="Tarifa CLP/kWh (editable)">
            <input
              type="number" min={50} max={500} step={5}
              value={tarifaElec}
              onChange={e => patchCfg({ tarifaElec: Math.max(0, Number(e.target.value) || 0) })}
              style={inputStyle}
            />
          </Field>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
            ℹ Si el cliente conoce su tarifa exacta (último recibo), úsala. Si no, deja la referencia.
          </div>
        </Card>

        {/* ── Calefacción ────────────────────────────────────────────────── */}
        <Card titulo="🔥 Calefacción principal" descripcion="El combustible más usado del hogar.">
          <Field label="Combustible / sistema">
            <select value={combCalefId} onChange={e => patchCfg({ combustibleCalef: e.target.value, precioCombustible: null })} style={inputStyle}>
              {COMBUSTIBLES_CALEFACCION.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </Field>
          {combCalef?.usaTarifaElec ? (
            <DataRow label="Tarifa" value={`${tarifaElec} CLP/kWh elec`} />
          ) : (
            <Field label={`Precio (${combCalef?.unidad || ''}) en ${MACROZONAS[macrozona]?.label}`}>
              <input
                type="number" min={0} step={500}
                value={precioComb || ''}
                placeholder={`${precioRef} (ref.)`}
                onChange={e => patchCfg({ precioCombustible: Number(e.target.value) || 0 })}
                style={inputStyle}
              />
            </Field>
          )}
          <DataRow label="Rendimiento" value={`${Math.round((combCalef?.rendTipico || 0) * 100)} %`} />
          <DataRow label="CLP por kWh útil" value={`${Math.round(clpKwh)} CLP`} highlight />
          {combCalef?.notas && (
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 8, fontStyle: 'italic' }}>
              {combCalef.notas}
            </div>
          )}
        </Card>

        {/* ── ACS ────────────────────────────────────────────────────────── */}
        <Card titulo="🚿 Agua caliente sanitaria" descripcion="Sistema usado para baños y lavado.">
          <Field label="Sistema">
            <select value={sistemaAcsId} onChange={e => patchCfg({ sistemaACS: e.target.value })} style={inputStyle}>
              {SISTEMAS_ACS.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </Field>
        </Card>

        {/* ── Cocción ────────────────────────────────────────────────────── */}
        <Card titulo="🍳 Cocina" descripcion="Sistema de cocción habitual.">
          <Field label="Sistema">
            <select value={sistemaCocId} onChange={e => patchCfg({ sistemaCocina: e.target.value })} style={inputStyle}>
              {SISTEMAS_COCINA.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </Field>
        </Card>

      </div>

      {/* ── Resumen ─────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 22, padding: '14px 18px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius-lg, 12px)',
        fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.7,
      }}>
        ✅ Configuración guardada. Con estos valores se calcularán automáticamente:<br/>
        • <b>Ahorro económico de cada corrección</b> propuesta en el módulo de Cálculo U<br/>
        • <b>Payback simple y descontado</b> de cada inversión<br/>
        • <b>Emisiones CO₂ evitadas</b> por año y a 30 años<br/>
        • <b>Demanda térmica y costos anuales</b> del proyecto completo (próximos sprints)
      </div>
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
function Card({ titulo, descripcion, children }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
        {titulo}
      </div>
      {descripcion && (
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 12 }}>
          {descripcion}
        </div>
      )}
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8,
        color: 'var(--ink-3)', marginBottom: 4, fontWeight: 600,
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function DataRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '4px 0', fontSize: 11,
      borderTop: '1px dashed var(--line-soft)',
    }}>
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums',
        fontWeight: highlight ? 700 : 500,
        color: highlight ? 'var(--accent)' : 'var(--ink)',
      }}>
        {value}
      </span>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '6px 10px',
  fontSize: 12,
  border: '1px solid var(--line)',
  borderRadius: 6,
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
}
