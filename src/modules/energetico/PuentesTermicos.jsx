// ─────────────────────────────────────────────────────────────────────────────
// PuentesTermicos — Inventario de PT con cálculo de pérdidas adicionales.
//
// 3 modos de uso:
//   1. "Empezar con tipología": carga inventario típico según vivienda.
//   2. "Agregar individual": añadir PTs uno por uno seleccionando categoría.
//   3. "Solo informativo": revisar catálogo para diseño.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react'
import {
  PUENTES_TERMICOS, CATEGORIAS_PT, obtenerPT,
  LONGITUDES_TIPICAS, TIPOLOGIAS_LABELS,
} from '../../data/puentes_termicos.js'
import {
  analizarInventarioPT, porcentajeImpactoPT, severidadPT,
} from '../../lib/engines/puentes_termicos.js'
import { envolventeFromCalcUInit, perdidasEnvolvente } from '../../lib/engines/demanda.js'
import { obtenerHDD18 } from '../../data/grados_dia.js'
import AyudaEnergetico, { BadgeOrigen } from './AyudaEnergetico.jsx'

const CALIDAD_LABELS = {
  malo:   '🔴 Mal resuelto',
  tipico: '🟡 Típico chileno',
  mejor:  '🟢 Buena solución',
}

export default function PuentesTermicos({ proy, calcUInit }) {
  const cfg = proy?.configEnergetica || {}
  const zonaEf = cfg.zonaDS15 || proy?.zona
  const hdd18 = obtenerHDD18(cfg.comunaKey, zonaEf)

  // Inventario: array de { ptId, longitud, calidad }
  const [inventario, setInventario] = useState([])
  const [tipologia, setTipologia] = useState('')

  // Cargar tipología
  function cargarTipologia(tipoKey) {
    const longitudes = LONGITUDES_TIPICAS[tipoKey]
    if (!longitudes) return
    const nuevo = Object.entries(longitudes)
      .filter(([_, l]) => l > 0)
      .map(([ptId, longitud]) => ({ ptId, longitud, calidad: 'tipico' }))
    setInventario(nuevo)
    setTipologia(tipoKey)
  }

  function agregarPT(ptId) {
    setInventario(prev => [...prev, { ptId, longitud: 10, calidad: 'tipico' }])
  }

  function actualizarItem(i, patch) {
    setInventario(prev => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item))
  }

  function eliminarItem(i) {
    setInventario(prev => prev.filter((_, idx) => idx !== i))
  }

  // Cálculos
  const analisis = useMemo(() => analizarInventarioPT(inventario, {
    proy, configEnergetica: cfg,
  }), [inventario, proy, cfg, zonaEf, hdd18])

  const perdidaEnvolvente = useMemo(() => {
    const elementos = envolventeFromCalcUInit(calcUInit)
    return perdidasEnvolvente(elementos, hdd18)
  }, [calcUInit, hdd18])

  const pctImpacto = porcentajeImpactoPT(analisis.perdidaTotal, perdidaEnvolvente)
  const sev = severidadPT(pctImpacto)

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>
      <Hero analisis={analisis} pctImpacto={pctImpacto} severidad={sev} />

      <AyudaEnergetico
        icon="🌉"
        titulo="Puentes Térmicos lineales (Ψ)"
        intro="Los puentes térmicos son zonas donde la envolvente pierde calor adicional por discontinuidades constructivas (encuentros, esquinas, marcos). En Chile típicamente representan 15-30% de pérdidas adicionales sobre lo que calcula el U de los muros — pero rara vez se calculan."
        pasos={[
          'Elige tu <b>tipología constructiva</b> para precargar longitudes referenciales, o construye el inventario manualmente.',
          'Para cada PT define la <b>longitud</b> (metros) y la <b>calidad de resolución</b> constructiva (malo/típico/mejor).',
          'La pérdida adicional se calcula como Σ (Ψ × L × HDD18 × 24). Se compara contra las pérdidas de envolvente del proyecto.',
          'Si tu % de impacto supera el 30%, hay problemas constructivos serios (típicamente balcones pasantes o aleros mal resueltos).',
        ]}
        origenDatos={[
          { campo: 'HDD18 — desde la comuna configurada', origen: 'energetico:configuracion' },
          { campo: 'Pérdidas de envolvente (referencia) — desde calcUInit del proyecto', origen: 'normativo:calculo-u' },
          { campo: 'Ψ catalogados — ISO 14683 + CITEC UBB (3 niveles: malo/típico/mejor)', origen: 'auto' },
          { campo: 'Longitudes típicas — por tipología de vivienda (defaults)', origen: 'auto' },
          { campo: 'Inventario de PT — lo defines tú', origen: 'usuario' },
        ]}
        normativa="ISO 14683:2017 (Default values) · NCh853:2021 · DA-DB-HE/3 (catálogo)"
      />

      {/* ── Cargar tipología ──────────────────────────────────────────── */}
      <Card titulo="🏗 Empezar con tipología (opcional)">
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 10 }}>
          Selecciona la tipología más parecida para cargar longitudes referenciales.
          Luego ajustas los valores reales del proyecto.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(TIPOLOGIAS_LABELS).map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => cargarTipologia(k)}
              style={{
                padding: '8px 14px', fontSize: 11, fontWeight: 600,
                border: `1px solid ${tipologia === k ? 'var(--accent)' : 'var(--line)'}`,
                background: tipologia === k ? 'var(--accent)' : 'var(--surface)',
                color: tipologia === k ? '#fff' : 'var(--ink)',
                borderRadius: 6, cursor: 'pointer',
              }}
            >
              {lbl}
            </button>
          ))}
          {inventario.length > 0 && (
            <button
              type="button"
              onClick={() => { setInventario([]); setTipologia('') }}
              style={{
                padding: '8px 14px', fontSize: 11, fontWeight: 600,
                border: '1px solid var(--bad)', background: 'var(--bad-bg)',
                color: 'var(--bad)', borderRadius: 6, cursor: 'pointer',
              }}
            >
              ✕ Limpiar inventario
            </button>
          )}
        </div>
      </Card>

      {/* ── Inventario actual ───────────────────────────────────────────── */}
      {inventario.length > 0 && (
        <Card titulo={`📋 Inventario actual (${inventario.length} PT)`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Puente térmico</th>
                  <th style={th}>Longitud (m)</th>
                  <th style={th}>Calidad</th>
                  <th style={th}>Ψ (W/m·K)</th>
                  <th style={th}>Pérdida kWh/año</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {analisis.detalles.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <td style={td}>
                      <b>{d.nombre}</b>
                      <div style={{ fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                        {d.categoria}
                      </div>
                    </td>
                    <td style={td}>
                      <input
                        type="number" min={0} step={0.5}
                        value={inventario[i].longitud}
                        onChange={e => actualizarItem(i, { longitud: Number(e.target.value) || 0 })}
                        style={{ ...inputStyle, width: 80 }}
                      />
                    </td>
                    <td style={td}>
                      <select
                        value={inventario[i].calidad}
                        onChange={e => actualizarItem(i, { calidad: e.target.value })}
                        style={{ ...inputStyle, width: 140 }}
                      >
                        <option value="malo">{CALIDAD_LABELS.malo}</option>
                        <option value="tipico">{CALIDAD_LABELS.tipico}</option>
                        <option value="mejor">{CALIDAD_LABELS.mejor}</option>
                      </select>
                    </td>
                    <td style={{ ...td, fontFamily: 'var(--font-num)' }}>{d.psi.toFixed(2)}</td>
                    <td style={{ ...td, fontFamily: 'var(--font-num)', fontWeight: 700, color: 'var(--bad)' }}>
                      {d.perdidaKwh.toLocaleString('es-CL')}
                    </td>
                    <td style={td}>
                      <button
                        type="button"
                        onClick={() => eliminarItem(i)}
                        style={{
                          background: 'transparent', border: 'none', color: 'var(--bad)',
                          cursor: 'pointer', fontSize: 14, padding: 4,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--line)' }}>
                  <td colSpan={4} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>
                    Total pérdidas por PT:
                  </td>
                  <td style={{ ...td, fontFamily: 'var(--font-num)', fontWeight: 800, color: 'var(--bad)' }}>
                    {analisis.perdidaTotal.toLocaleString('es-CL')} kWh/año
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* ── Catálogo para agregar manualmente ───────────────────────────── */}
      <Card titulo="📚 Catálogo de puentes térmicos">
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12 }}>
          Selecciona un PT del catálogo para agregarlo al inventario.
        </div>
        {CATEGORIAS_PT.map(cat => (
          <div key={cat.id} style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--ink)',
              marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid var(--line-soft)',
            }}>
              {cat.icon} {cat.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
              {PUENTES_TERMICOS.filter(p => p.categoria === cat.id).map(pt => (
                <div key={pt.id} style={{
                  padding: 10, border: '1px solid var(--line)',
                  borderRadius: 6, background: 'var(--surface)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{pt.nombre}</div>
                  <div style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.4 }}>
                    {pt.descripcion}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--font-num)' }}>
                      Ψ: {pt.psi.malo} / {pt.psi.tipico} / {pt.psi.mejor}
                    </span>
                    <button
                      type="button"
                      onClick={() => agregarPT(pt.id)}
                      style={{
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '3px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      + Agregar
                    </button>
                  </div>
                  {pt.nota && (
                    <div style={{
                      marginTop: 6, fontSize: 9, fontStyle: 'italic',
                      color: 'var(--ink-3)', lineHeight: 1.4,
                    }}>
                      ℹ {pt.nota}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <p style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>
        Valores Ψ basados en ISO 14683 default values y catálogo CITEC UBB. Para
        proyectos sensibles, considera cálculo numérico con software FEM (Therm, Flixo).
      </p>
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero({ analisis, pctImpacto, severidad }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${severidad.color}, #1e293b)`,
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '20px 28px', color: '#fff', marginBottom: 16,
    }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.85, marginBottom: 4 }}>
        Análisis higrotérmico · Puentes térmicos
      </div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        {analisis.perdidaTotal > 0
          ? `${analisis.perdidaTotal.toLocaleString('es-CL')} kWh/año en PT (${pctImpacto}% adicional)`
          : '🌉 Comienza a inventariar tus puentes térmicos'}
      </h2>
      {analisis.perdidaTotal > 0 && (
        <p style={{ fontSize: 12, margin: '6px 0 0', opacity: 0.92 }}>
          {severidad.label} — {analisis.detalles.length} encuentros catalogados.
        </p>
      )}
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

const inputStyle = {
  padding: '4px 8px', fontSize: 11,
  border: '1px solid var(--line)', borderRadius: 4,
  background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit',
}
const th = {
  padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--ink-3)', borderBottom: '2px solid var(--line)',
  textTransform: 'uppercase', letterSpacing: 0.6,
}
const td = { padding: '7px 10px', color: 'var(--ink-2)' }
