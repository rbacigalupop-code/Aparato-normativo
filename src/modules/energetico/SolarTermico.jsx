// ─────────────────────────────────────────────────────────────────────────────
// SolarTermico — Solar térmico para ACS con franquicia Ley 20.365.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { analizarSolarTermico } from '../../lib/engines/renovables.js'
import { TARIFA_ELEC_DEFAULT, SISTEMAS_ACS } from '../../data/combustibles.js'
import { FRANQUICIA_LEY_20365 } from '../../data/precios_renovables.js'

export default function SolarTermico({ proy }) {
  const cfg = proy?.configEnergetica || {}
  const tarifaElec = cfg.tarifaElec ?? TARIFA_ELEC_DEFAULT

  const [personas, setPersonas] = useState(4)
  const [valorUF, setValorUF] = useState(1800)
  const [combustibleACS, setCombustibleACS] = useState(
    cfg.sistemaACS === 'termo_elec' ? 'elec_resistiva' : 'glp_cilindro_15'
  )

  const analisis = analizarSolarTermico({
    personas, proy, valorUF, combustibleACS, tarifaElec,
  })

  const tipoFranquicia = valorUF <= FRANQUICIA_LEY_20365.uf_corte_total
    ? 'Total (55%)'
    : valorUF <= FRANQUICIA_LEY_20365.uf_corte_parcial
      ? 'Parcial (25%)'
      : 'No aplica (>3000 UF)'

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>
      <Hero />

      {/* ── Configuración ─────────────────────────────────────── */}
      <Card titulo="👨‍👩‍👧 Configuración de la vivienda">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Nº personas residentes">
            <input
              type="number" min={1} max={20}
              value={personas}
              onChange={e => setPersonas(Math.max(1, Number(e.target.value) || 1))}
              style={inputStyle}
            />
          </Field>
          <Field label="Valor vivienda (UF)">
            <input
              type="number" min={500} max={10000} step={100}
              value={valorUF}
              onChange={e => setValorUF(Number(e.target.value) || 0)}
              style={inputStyle}
            />
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
              Franquicia tributaria: <b style={{
                color: tipoFranquicia.includes('Total') ? 'var(--ok)'
                     : tipoFranquicia.includes('Parcial') ? 'var(--warn)'
                     : 'var(--bad)',
              }}>{tipoFranquicia}</b>
            </div>
          </Field>
          <Field label="Sistema ACS actual (a sustituir)">
            <select
              value={combustibleACS}
              onChange={e => setCombustibleACS(e.target.value)}
              style={inputStyle}
            >
              <option value="elec_resistiva">Termo eléctrico</option>
              <option value="glp_cilindro_15">Calefón GLP cilindro 15kg</option>
              <option value="glp_cilindro_45">Calefón GLP cilindro 45kg</option>
              <option value="gas_natural">Calefón gas natural</option>
              <option value="glp_granel">GLP granel</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* ── Resultado principal ─────────────────────────────────── */}
      <Card titulo="♨️ Sistema solar térmico recomendado">
        <div style={{
          background: 'var(--bg-alt)', borderRadius: 8, padding: '12px 16px', marginBottom: 14,
        }}>
          <b style={{ color: 'var(--ink)' }}>{analisis.sistema.colectores} colectores</b> de 2 m² c/u
          {' · '}
          Acumulador de <b>{analisis.sistema.acum_l} L</b>
          {' · '}
          Cobertura hasta <b>{analisis.sistema.personas_max} personas</b>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          <BigKPI label="Demanda ACS anual" value={`${analisis.demanda.toLocaleString('es-CL')} kWh`} sub="agua a 45°C, 40 L/persona/día" />
          <BigKPI label="Cobertura solar"   value={`${(analisis.cobertura * 100).toFixed(0)}%`} color="var(--ok)" sub={`Apoyo: ${(100 - analisis.cobertura * 100).toFixed(0)}% con sistema actual`} />
          <BigKPI label="Ahorro anual"      value={`CLP ${(analisis.ahorroClp / 1000).toFixed(0)}k`} color="var(--ok)" />
          <BigKPI label="CO₂ evitado"       value={`${(analisis.co2EvitadoAnual / 1000).toFixed(1)} t/año`} sub={`${(analisis.co2Evitado20 / 1000).toFixed(0)} t a 20 años`} color="var(--ok)" />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '16px 0' }} />

        {/* ── Análisis económico con franquicia ─────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          <BigKPI label="Costo bruto sistema" value={`CLP ${(analisis.costoBruto / 1e6).toFixed(2)}M`} />
          <BigKPI label="Descuento Ley 20.365" value={`− CLP ${(analisis.descuento / 1e6).toFixed(2)}M`} color="var(--accent)" sub="franquicia tributaria" />
          <BigKPI label="Costo neto"           value={`CLP ${(analisis.costoNeto / 1e6).toFixed(2)}M`} color="var(--ink)" />
          <BigKPI label="Payback simple"       value={analisis.paybackAnios ? `${analisis.paybackAnios} años` : '—'} sub={`VAN20: CLP ${(analisis.van20 / 1e6).toFixed(1)}M`} />
        </div>

        {/* Info Ley 20.365 */}
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: tipoFranquicia.includes('No aplica') ? 'var(--bad-bg)' : 'var(--ok-bg)',
          border: `1px solid ${tipoFranquicia.includes('No aplica') ? 'var(--bad)' : 'var(--ok)'}`,
          borderRadius: 8, fontSize: 11,
          color: tipoFranquicia.includes('No aplica') ? 'var(--bad)' : 'var(--ok)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>📜 Ley 20.365 — Franquicia Tributaria SST</div>
          <div style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>
            La Ley 20.365 (extendida por Ley 21.706 hasta 2027) otorga al <b>constructor</b> un crédito tributario
            por viviendas nuevas equipadas con sistema solar térmico. El beneficio se descuenta del precio final
            de la vivienda y se traspasa al comprador.
            <br/><br/>
            Para esta vivienda de <b>{valorUF.toLocaleString('es-CL')} UF</b>:
            {valorUF <= 2000 && <> ✅ Aplica el <b>100% del beneficio</b> (~55% del costo del sistema).</>}
            {valorUF > 2000 && valorUF <= 3000 && <> ⚠️ Aplica el <b>beneficio parcial</b> (~25% del costo).</>}
            {valorUF > 3000 && <> ❌ <b>No aplica franquicia</b>. El costo bruto se mantiene.</>}
          </div>
        </div>
      </Card>

      <p style={{ fontSize: 11, color: 'var(--ink-3)', fontStyle: 'italic', textAlign: 'center', marginTop: 16 }}>
        Valores referenciales. La cobertura real depende de la orientación del techo, la altura de las casas
        vecinas (sombras) y la calidad del colector. Marco normativo: <b>Ley 20.365</b> + <b>NCh3076:2008</b> (colectores solares planos).
      </p>
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #ea580c, #dc2626)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '20px 28px', color: '#fff', marginBottom: 16,
    }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.9, marginBottom: 4 }}>
        Energías renovables · Solar térmico ACS
      </div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        ♨️ Solar Térmico — Ley 20.365 SST
      </h2>
      <p style={{ fontSize: 12, margin: '6px 0 0', opacity: 0.92 }}>
        Calentamiento solar de agua para uso sanitario, con franquicia tributaria
        para viviendas hasta 3000 UF.
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

const inputStyle = {
  width: '100%', padding: '6px 10px', fontSize: 12,
  border: '1px solid var(--line)', borderRadius: 6,
  background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit',
}
