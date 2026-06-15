// ─────────────────────────────────────────────────────────────────────────────
// BombaCalor — Comparador de 4 tipos de bomba de calor con COP corregido
// por la temperatura exterior de invierno de la comuna del proyecto.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { analizarBdC, estimarDemandaTermica } from '../../lib/engines/renovables.js'
import { TARIFA_ELEC_DEFAULT, COMBUSTIBLES_CALEFACCION } from '../../data/combustibles.js'
import { PRECIOS_BDC } from '../../data/precios_renovables.js'
import { obtenerHDD18 } from '../../data/grados_dia.js'
import { zonaClimaDeOGUC } from '../../data/zona_clima.js'
import AyudaEnergetico, { BadgeOrigen } from './AyudaEnergetico.jsx'

const TIPOS_BDC = ['split_aire_aire', 'aerotermia_agua', 'geotermica', 'bdc_acs_dedicada']

export default function BombaCalor({ proy, calcUInit }) {
  const cfg = proy?.configEnergetica || {}
  const tarifaElec = cfg.tarifaElec ?? TARIFA_ELEC_DEFAULT

  // Estimación inicial de demanda y potencia
  const hdd18 = obtenerHDD18(cfg.comunaKey, zonaClimaDeOGUC(proy?.zona, cfg.comunaKey || proy?.comuna))
  const demandaEstimada = estimarDemandaTermica(proy, calcUInit, hdd18)

  const [demandaKwh, setDemandaKwh] = useState(demandaEstimada)
  const [potenciaKw, setPotenciaKw] = useState(8)

  // Analizar los 4 tipos en paralelo
  const analisis = TIPOS_BDC.map(tipo => analizarBdC({
    demandaTermicaKwh: demandaKwh,
    potenciaTermicaKw: potenciaKw,
    proy, tipoBdC: tipo, tarifaElec,
  }))

  const combActual = COMBUSTIBLES_CALEFACCION.find(c => c.id === cfg.combustibleCalef) ||
                     { nombre: 'Sin configurar', co2_kg_kwh: 0.40 }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>
      <Hero />

      <AyudaEnergetico
        icon="🌡️"
        titulo="Bomba de calor — comparador de 4 tipos"
        intro="Compara 4 tecnologías de bomba de calor (split aire-aire, aerotermia agua, geotérmica y BdC dedicada a ACS) contra tu sistema actual. El COP se corrige automáticamente por la temperatura media de invierno de tu comuna — clave para evitar sorpresas en zonas frías."
        pasos={[
          'La <b>demanda térmica anual</b> se estima desde los cálculos U del módulo Normativo. Si no tienes cálculos U, ajústala manualmente.',
          'Define la <b>potencia térmica requerida</b>. Regla práctica: 50-80 W por m² (clima frío, mayor).',
          'La <b>T° media invierno</b> de tu comuna determina el COP real de cada equipo. En zonas F-H la BdC aire-aire pierde rendimiento — la aerotermia con inverter o geotérmica compensan mejor.',
          'Revisa la <b>tabla resumen</b> al final: muestra el caso base (tu combustible actual) vs los 4 tipos de BdC en costo anual, ahorro y payback.',
        ]}
        origenDatos={[
          { campo: 'Demanda térmica anual — calculada desde calcUInit + HDD18', origen: 'normativo:calculo-u' },
          { campo: 'T° media invierno (JJA) — por comuna del proyecto', origen: 'energetico:configuracion' },
          { campo: 'Combustible actual del cliente — definido en Configuración', origen: 'energetico:configuracion' },
          { campo: 'Tarifa eléctrica — para costo operacional BdC', origen: 'energetico:configuracion' },
          { campo: 'COP nominal por tipo (3.5 split · 4.0 aerotermia · 5.0 geotérmica) — catálogo industria', origen: 'auto' },
          { campo: 'Potencia térmica requerida — la defines tú', origen: 'usuario' },
        ]}
        normativa="NCh2989/1 (Clasificación BdC) · NCh3304 (Eficiencia mínima EER/COP) · ISO 13256 / EN 14511"
      />

      {/* ── Configuración ─────────────────────────────────────── */}
      <Card titulo="🏠 Demanda térmica del proyecto">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Demanda anual calefacción (kWh)">
            <input
              type="number" min={500} max={50000} step={500}
              value={demandaKwh}
              onChange={e => setDemandaKwh(Number(e.target.value) || 0)}
              style={inputStyle}
            />
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {demandaEstimada > 0 ? (
                <>
                  <BadgeOrigen origen="normativo:calculo-u" small />
                  <span>Estimado del proyecto: {demandaEstimada.toLocaleString('es-CL')} kWh/año</span>
                </>
              ) : (
                <>
                  <BadgeOrigen origen="auto" small label="Default" />
                  <span>Sin cálculo U previo — completa el módulo Normativo para mejor precisión</span>
                </>
              )}
            </div>
          </Field>
          <Field label="Potencia térmica requerida (kW)">
            <input
              type="number" min={3} max={30} step={1}
              value={potenciaKw}
              onChange={e => setPotenciaKw(Number(e.target.value) || 0)}
              style={inputStyle}
            />
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
              Regla práctica: 50-80 W/m² (clima frío más alto)
            </div>
          </Field>
          <Field label="Sistema actual (referencia)">
            <div style={{
              padding: '7px 10px', border: '1px solid var(--line)',
              borderRadius: 6, background: 'var(--bg-alt)', fontSize: 12,
              color: 'var(--ink)',
            }}>
              {combActual.nombre}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
              T° media invierno: <b>{analisis[0]?.tInv}°C</b>
            </div>
          </Field>
        </div>
      </Card>

      {/* ── Comparador de los 4 tipos ─────────────────────────── */}
      <Card titulo="🌡️ Comparativa de 4 tipos de bomba de calor">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {analisis.map((a, i) => (
            <TipoBdCCard key={a.tipoBdC} analisis={a} demandaKwh={demandaKwh} />
          ))}
        </div>
      </Card>

      {/* ── Tabla resumen ─────────────────────────────────────── */}
      <Card titulo="📊 Resumen comparativo">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Sistema</th>
                <th style={th}>COP real</th>
                <th style={th}>Consumo eléctrico</th>
                <th style={th}>Costo anual</th>
                <th style={th}>Ahorro vs actual</th>
                <th style={th}>Inversión</th>
                <th style={th}>Payback</th>
                <th style={th}>CO₂ evitado</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: 'var(--bad-bg)' }}>
                <td style={td}><b>📉 Caso base</b><br/><span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{combActual.nombre}</span></td>
                <td style={td}>—</td>
                <td style={td}>—</td>
                <td style={{ ...td, fontWeight: 700 }}>CLP {(analisis[0]?.costoActual / 1000).toFixed(0)}k</td>
                <td style={td}>—</td>
                <td style={td}>—</td>
                <td style={td}>—</td>
                <td style={td}>—</td>
              </tr>
              {analisis.map(a => (
                <tr key={a.tipoBdC} style={{ background: a.ahorroClp > 0 ? 'var(--ok-bg)' : 'transparent' }}>
                  <td style={td}><b>{a.bdc.nombre}</b></td>
                  <td style={td}><b style={{ color: a.cop >= 3 ? 'var(--ok)' : 'var(--warn)' }}>{a.cop}</b></td>
                  <td style={td}>{a.consumoElecBdC.toLocaleString('es-CL')} kWh</td>
                  <td style={td}>CLP {(a.costoBdC / 1000).toFixed(0)}k</td>
                  <td style={{ ...td, color: a.ahorroClp > 0 ? 'var(--ok)' : 'var(--bad)', fontWeight: 700 }}>
                    {a.ahorroClp > 0 ? '+' : ''}CLP {(a.ahorroClp / 1000).toFixed(0)}k
                  </td>
                  <td style={td}>CLP {(a.inversion / 1e6).toFixed(1)}M</td>
                  <td style={td}>{a.paybackAnios ? `${a.paybackAnios}a` : '—'}</td>
                  <td style={{ ...td, color: 'var(--ok)' }}>{a.co2EvitadoAnual} kg/año</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p style={{ fontSize: 11, color: 'var(--ink-3)', fontStyle: 'italic', textAlign: 'center', marginTop: 16 }}>
        El COP real considera la temperatura media de invierno de tu comuna ({analisis[0]?.tInv}°C).
        En zonas frías (T° {'<'} 0°C) la BdC aire-aire pierde rendimiento — la aerotermia con compresor
        inverter de baja temperatura compensa mejor, y la geotérmica es la más estable. Marco normativo:
        <b> NCh2989/1 (clasificación)</b>, <b>NCh3304 (eficiencia mín. EER/COP)</b>.
      </p>
    </div>
  )
}

// ─── Tarjeta de cada tipo de BdC ─────────────────────────────────────────────
function TipoBdCCard({ analisis, demandaKwh }) {
  const a = analisis
  const esBuena = a.ahorroClp > 0 && a.paybackAnios && a.paybackAnios < 15

  return (
    <div style={{
      background: esBuena ? 'var(--ok-bg)' : 'var(--bg-alt)',
      border: `1px solid ${esBuena ? 'var(--ok)' : 'var(--line)'}`,
      borderRadius: 'var(--radius-lg, 12px)',
      padding: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, minHeight: 32 }}>
        {a.bdc.nombre}
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.4, marginBottom: 12 }}>
        {a.bdc.descripcion}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>COP real (a {a.tInv}°C):</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: a.cop >= 3.5 ? 'var(--ok)' : a.cop >= 2.5 ? 'var(--warn)' : 'var(--bad)' }}>
          {a.cop}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Inversión:</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
          CLP {(a.inversion / 1e6).toFixed(1)}M
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Ahorro anual:</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: a.ahorroClp > 0 ? 'var(--ok)' : 'var(--bad)' }}>
          {a.ahorroClp > 0 ? '+' : ''}CLP {(a.ahorroClp / 1000).toFixed(0)}k
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Payback:</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {a.paybackAnios ? `${a.paybackAnios} años` : 'No recuperable'}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>CO₂ evitado:</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ok)' }}>
          {a.co2EvitadoAnual} kg/año
        </span>
      </div>
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0891b2, #1e40af)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '20px 28px', color: '#fff', marginBottom: 16,
    }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.9, marginBottom: 4 }}>
        Energías renovables · Bombas de calor
      </div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        🌡️ Bombas de Calor — COP corregido por clima
      </h2>
      <p style={{ fontSize: 12, margin: '6px 0 0', opacity: 0.92 }}>
        Comparativa de 4 sistemas con factor de corrección por temperatura exterior real
        de invierno de tu comuna. Decide cuál sustituye mejor tu sistema actual.
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
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{titulo}</h3>
      {children}
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

const inputStyle = {
  width: '100%', padding: '6px 10px', fontSize: 12,
  border: '1px solid var(--line)', borderRadius: 6,
  background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit',
}
const th = { padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700,
             color: 'var(--ink-3)', borderBottom: '2px solid var(--line)', textTransform: 'uppercase', letterSpacing: 0.6 }
const td = { padding: '8px 10px', borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-2)' }
