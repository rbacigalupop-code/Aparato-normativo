// ─────────────────────────────────────────────────────────────────────────────
// PuertasDetalladas — Cálculo combinado U_puerta + validaciones DS N°15 (U),
// LOFC Ed.17 (RF), NCh352 (R'w) y OGUC Tít. IV (dimensiones).
//
// Mirrors VentanasDetalladas pero adapta los 4 ejes de cumplimiento que
// aplican a puertas (térmica + fuego + acústica + dimensiones físicas).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react'
import {
  HOJAS, MARCOS_PUERTA, SELLOS,
  DIMENSIONES_OGUC, RF_MINIMO_POR_USO, RW_MINIMO_POR_USO,
  SUGERENCIAS_POR_ZONA,
} from '../../data/puertas_detalladas.js'
import {
  calcularPuertaCombinada,
  cumpleDS15Puerta, cumpleRFPuerta, cumpleRWPuerta, cumpleOGUC,
} from '../../lib/engines/puertas_detalladas.js'
import AyudaEnergetico from './AyudaEnergetico.jsx'
import { ZONA_DS15_LABELS } from '../../data/comunas_chile.js'

export default function PuertasDetalladas({ proy }) {
  const cfg = proy?.configEnergetica || {}
  const zonaEf = cfg.zonaDS15 || proy?.zona || 'D'
  const sugerencia = SUGERENCIAS_POR_ZONA[zonaEf] || SUGERENCIAS_POR_ZONA.D

  // Dimensiones + componentes + uso
  const [ancho, setAncho]     = useState(0.90)
  const [alto, setAlto]       = useState(2.00)
  const [hojaId, setHojaId]   = useState(sugerencia.hoja)
  const [marcoId, setMarcoId] = useState(sugerencia.marco)
  const [selloId, setSelloId] = useState(sugerencia.sello)
  const [uso, setUso]         = useState('acceso_vivienda')

  // Cálculo principal
  const r = useMemo(() => calcularPuertaCombinada({
    ancho_m: ancho, alto_m: alto, hojaId, marcoId, selloId,
  }), [ancho, alto, hojaId, marcoId, selloId])

  // Validaciones (4 ejes)
  const vTermica = r ? cumpleDS15Puerta(r.U,  zonaEf) : null
  const vFuego   = r ? cumpleRFPuerta(r.rf,   uso)    : null
  const vAcust   = r ? cumpleRWPuerta(r.rw,   uso)    : null
  const vDimens  = r ? cumpleOGUC(r.anchoLibre_m, r.altoLibre_m, uso === 'acceso_vivienda' ? 'acceso_principal' : 'interior_recinto') : null

  // Comparativo
  const comparativos = useMemo(() => {
    if (!r) return []
    const configs = [
      { lbl: 'Tu configuración',          hojaId, marcoId, selloId, recomendada: false },
      { lbl: `Sugerida zona ${zonaEf}`,   hojaId: sugerencia.hoja, marcoId: sugerencia.marco, selloId: sugerencia.sello, recomendada: true },
      { lbl: 'Mejor posible (Casa Pasiva)', hojaId: 'pasiva', marcoId: 'pvc_premium', selloId: 'doble_junta_acustica', recomendada: false },
    ]
    return configs.map(c => ({ ...c, resultado: calcularPuertaCombinada({ ancho_m: ancho, alto_m: alto, ...c }) }))
  }, [ancho, alto, hojaId, marcoId, selloId, zonaEf, sugerencia])

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>
      <Hero r={r} vTermica={vTermica} vFuego={vFuego} vAcust={vAcust} vDimens={vDimens} zonaEf={zonaEf} uso={uso} />

      <AyudaEnergetico
        icon="🚪"
        titulo="Puertas detalladas (4 ejes normativos)"
        intro="Una puerta debe cumplir simultáneamente 4 requisitos: transmitancia térmica U (DS N°15), resistencia al fuego RF (LOFC), aislamiento acústico R'w (NCh352), y dimensiones libres de paso (OGUC Tít. IV). Este módulo calcula los 4 ejes para una puerta con hoja + marco + sello, según su uso (acceso vivienda, evacuación, cuarto técnico, etc.)."
        pasos={[
          'Define el <b>uso</b> de la puerta (acceso, evacuación, interior, cuarto técnico…). Esto fija los mínimos RF, R\'w y dimensiones.',
          'Define las <b>dimensiones</b> totales (incluido el marco) en metros.',
          'Selecciona <b>hoja</b>, <b>marco</b> y <b>sello perimetral</b>. Por defecto sugerimos lo apropiado a tu zona.',
          'Revisa los <b>4 chips de cumplimiento</b> arriba y los detalles abajo. Cada eje se valida independientemente.',
          'Usa el <b>comparativo</b> al final para ver tu configuración vs sugerida vs Casa Pasiva.',
        ]}
        origenDatos={[
          { campo: 'Zona DS N°15 — sugerencia y validación U', origen: 'energetico:configuracion' },
          { campo: 'Catálogo hojas/marcos/sellos — propiedades industria', origen: 'auto' },
          { campo: 'Uso + dimensiones + selección componentes — los defines tú', origen: 'usuario' },
        ]}
        normativa="DS N°15 (U) · LOFC Ed.17 (RF) · NCh352 (R'w) · OGUC Tít. IV (dimensiones) · ISO 10077-1"
      />

      {/* ── Uso de la puerta ─────────────────────────────────── */}
      <Card titulo="🎯 Uso de la puerta">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Field label="Tipo de uso">
            <select value={uso} onChange={e => setUso(e.target.value)} style={inputStyle}>
              <option value="acceso_vivienda">Acceso a vivienda (envolvente)</option>
              <option value="acceso_unidades">Entre unidades de vivienda</option>
              <option value="evacuacion_escalera">Salida de evacuación</option>
              <option value="entre_unidades">Interior — entre unidades</option>
              <option value="interior_dormitorio">Interior — dormitorio</option>
              <option value="estudio_oficina">Estudio / oficina</option>
              <option value="cuarto_tecnico">Cuarto técnico</option>
              <option value="cuarto_basura">Sala de basura</option>
              <option value="cuarto_maquinas">Cuarto de máquinas</option>
              <option value="ascensor_maquinas">Sala máquinas ascensor</option>
            </select>
            <small style={smallNote}>
              {RF_MINIMO_POR_USO[uso]?.nota || 'Sin requisito RF específico.'}
            </small>
          </Field>
        </div>
      </Card>

      {/* ── Configurador ─────────────────────────────────────── */}
      <Card titulo="🔧 Configura tu puerta">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
          <Field label="Ancho total (m)">
            <input type="number" min={0.6} max={2.4} step={0.05} value={ancho} onChange={e => setAncho(Number(e.target.value) || 0)} style={inputStyle} />
          </Field>
          <Field label="Alto total (m)">
            <input type="number" min={1.8} max={2.6} step={0.05} value={alto} onChange={e => setAlto(Number(e.target.value) || 0)} style={inputStyle} />
          </Field>
          <Field label="Ancho libre paso">
            <div style={readonlyBox}>
              <b style={numStyle}>{r?.anchoLibre_m} m</b>
            </div>
          </Field>
          <Field label="Área total">
            <div style={readonlyBox}>
              <b style={numStyle}>{r?.A_total} m²</b>
            </div>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <Field label="Hoja (material + núcleo)">
            <select value={hojaId} onChange={e => setHojaId(e.target.value)} style={inputStyle}>
              {HOJAS.map(h => <option key={h.id} value={h.id}>{h.nombre} · U {h.u} · {h.rf} · R&apos;w {h.rw}</option>)}
            </select>
            {hojaId === sugerencia.hoja && <BadgeInline texto="Sugerido para tu zona" />}
          </Field>
          <Field label="Marco">
            <select value={marcoId} onChange={e => setMarcoId(e.target.value)} style={inputStyle}>
              {MARCOS_PUERTA.map(m => <option key={m.id} value={m.id}>{m.nombre} · U {m.u} · {m.rf}</option>)}
            </select>
            {marcoId === sugerencia.marco && <BadgeInline texto="Sugerido para tu zona" />}
          </Field>
          <Field label="Sello perimetral">
            <select value={selloId} onChange={e => setSelloId(e.target.value)} style={inputStyle}>
              {SELLOS.map(s => <option key={s.id} value={s.id}>{s.nombre} · clase {s.infiltracion_clase} · +{s.bonus_rw_db} dB</option>)}
            </select>
            {selloId === sugerencia.sello && <BadgeInline texto="Sugerido para tu zona" />}
          </Field>
        </div>
      </Card>

      {/* ── Resultado: 4 KPIs + desglose ─────────────────────── */}
      <Card titulo="📊 Resultado del cálculo combinado">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 16 }}>
          <BigKPI label="U combinado"   value={`${r.U} W/m²K`} color={vTermica?.cumple ? 'var(--ok)' : 'var(--bad)'} sub={vTermica ? (vTermica.cumple ? `✅ Cumple DS N°15` : `❌ Excede Umax ${vTermica.umax}`) : ''} />
          <BigKPI label="Resistencia fuego" value={r.rf} color={vFuego?.cumple ? 'var(--ok)' : 'var(--bad)'} sub={vFuego ? (vFuego.cumple ? `✅ Cumple LOFC (req. ${vFuego.rfRequerido})` : `❌ Requiere ${vFuego.rfRequerido}`) : ''} />
          <BigKPI label="Aislamiento R'w" value={`${r.rw} dB`} color={vAcust?.cumple ? 'var(--ok)' : 'var(--bad)'} sub={vAcust ? (vAcust.cumple ? `✅ Cumple NCh352 (req. ${vAcust.rwRequerido})` : `❌ Requiere ${vAcust.rwRequerido} dB`) : ''} />
          <BigKPI label="Dimensiones OGUC" value={`${r.anchoLibre_m}×${r.altoLibre_m}`} color={vDimens?.cumple ? 'var(--ok)' : 'var(--bad)'} sub={vDimens ? (vDimens.cumple ? `✅ Cumple (mín ${vDimens.anchoMinReq}×${vDimens.altoMinReq})` : `❌ Mín ${vDimens.anchoMinReq}×${vDimens.altoMinReq} m`) : ''} />
        </div>

        {/* Desglose térmico */}
        <div style={panelStyle}>
          <div style={panelTitle}>🔬 Desglose de la transmitancia</div>
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
                <td style={td2}>Hoja</td>
                <td style={td2}>U = {r.componentes.hoja.u} W/m²K</td>
                <td style={{ ...td2, ...tdNum }}>{r.A_hoja} m²</td>
                <td style={{ ...td2, ...tdNumStrong }}>{r.Q_hoja}</td>
                <td style={{ ...td2, ...tdNum }}>{r.Q_total > 0 ? Math.round(r.Q_hoja / r.Q_total * 100) : 0}%</td>
              </tr>
              <tr>
                <td style={td2}>Marco</td>
                <td style={td2}>U = {r.componentes.marco.u} W/m²K</td>
                <td style={{ ...td2, ...tdNum }}>{r.A_marco} m²</td>
                <td style={{ ...td2, ...tdNumStrong }}>{r.Q_marco}</td>
                <td style={{ ...td2, ...tdNum }}>{r.Q_total > 0 ? Math.round(r.Q_marco / r.Q_total * 100) : 0}%</td>
              </tr>
              <tr>
                <td style={td2}>Sello perimetral</td>
                <td style={td2}>Ψ = {r.componentes.sello.psi} W/m·K</td>
                <td style={{ ...td2, ...tdNum }}>{r.L_sello} m</td>
                <td style={{ ...td2, ...tdNumStrong }}>{r.Q_sello}</td>
                <td style={{ ...td2, ...tdNum }}>{r.Q_total > 0 ? Math.round(r.Q_sello / r.Q_total * 100) : 0}%</td>
              </tr>
              <tr style={{ borderTop: '2px solid var(--line)', fontWeight: 700 }}>
                <td style={td2}>Total</td>
                <td style={td2}></td>
                <td style={{ ...td2, ...tdNum }}>{r.A_total} m²</td>
                <td style={{ ...td2, ...tdNum }}>{r.Q_total}</td>
                <td style={{ ...td2, ...tdNum }}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Detalle de validaciones */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 14 }}>
          {vFuego && (
            <ValidationCard
              titulo="🔥 Fuego (LOFC Ed.17)"
              cumple={vFuego.cumple}
              actual={vFuego.rfActual}
              requerido={vFuego.rfRequerido}
              nota={vFuego.nota}
            />
          )}
          {vAcust && (
            <ValidationCard
              titulo="🔊 Acústica (NCh352)"
              cumple={vAcust.cumple}
              actual={`${vAcust.rwActual} dB`}
              requerido={`${vAcust.rwRequerido} dB`}
              nota={vAcust.nota}
            />
          )}
          {vDimens && (
            <ValidationCard
              titulo="📐 Dimensiones (OGUC)"
              cumple={vDimens.cumple}
              actual={`${vDimens.anchoActual}×${vDimens.altoActual} m`}
              requerido={`≥ ${vDimens.anchoMinReq}×${vDimens.altoMinReq} m`}
              nota={`Abre hacia ${vDimens.abreHacia} · ${vDimens.nota}`}
            />
          )}
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
                fontVariantNumeric: 'tabular-nums',
              }}>
                {c.resultado.U} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>W/m²K</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                {c.resultado.componentes.hoja.nombre} +<br/>
                {c.resultado.componentes.marco.nombre} +<br/>
                {c.resultado.componentes.sello.nombre}
              </div>
              <div style={{
                display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap',
              }}>
                <Pill label={`${c.resultado.rf}`} ok={cumpleRFPuerta(c.resultado.rf, uso)?.cumple} />
                <Pill label={`${c.resultado.rw} dB`} ok={cumpleRWPuerta(c.resultado.rw, uso)?.cumple} />
                <Pill label={cumpleDS15Puerta(c.resultado.U, zonaEf)?.cumple ? '✓ DS15' : '✗ DS15'} ok={cumpleDS15Puerta(c.resultado.U, zonaEf)?.cumple} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>
        Cálculo U según NCh3079 / ISO 10077-1. RF según LOFC Ed.17 (mínimo
        entre hoja y marco). R'w estimado según NCh352 (R'w hoja + bonus sello).
        Dimensiones según OGUC Tít. IV. Para certificación final: confirmar con ETC.
      </p>
    </div>
  )
}

// ─── Hero (gradiente verde/rojo + slate, sin púrpura "AI") ──────────────────
function Hero({ r, vTermica, vFuego, vAcust, vDimens, zonaEf, uso }) {
  if (!r) return null
  const todosOK = vTermica?.cumple && vFuego?.cumple && vAcust?.cumple && vDimens?.cumple
  return (
    <div style={{
      background: `linear-gradient(135deg, ${todosOK ? '#16a34a' : '#dc2626'}, #1e293b)`,
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '20px 28px', color: '#fff', marginBottom: 16,
    }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.85, marginBottom: 4 }}>
        Cálculo combinado puerta · Zona {zonaEf} · {ZONA_DS15_LABELS[zonaEf]} · uso: {uso.replace(/_/g, ' ')}
      </div>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
        U = {r.U} W/m²K · RF {r.rf} · R'w {r.rw} dB
      </h2>
      <p style={{ fontSize: 12, margin: '6px 0 0', opacity: 0.92 }}>
        {todosOK
          ? `✅ Cumple los 4 ejes normativos (térmica + fuego + acústica + dimensiones).`
          : `⚠ Revisa los ejes en rojo abajo. Ajusta hoja, marco o sello para resolver.`}
      </p>
    </div>
  )
}

// ─── ValidationCard (chip detallado por eje normativo) ───────────────────────
function ValidationCard({ titulo, cumple, actual, requerido, nota }) {
  return (
    <div style={{
      padding: 10, borderRadius: 8,
      background: cumple ? 'var(--ok-bg)' : 'var(--bad-bg)',
      border: `1px solid ${cumple ? 'var(--ok)' : 'var(--bad)'}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: cumple ? 'var(--ok)' : 'var(--bad)', marginBottom: 4 }}>
        {cumple ? '✓' : '✗'} {titulo}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink)', fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums' }}>
        <b>{actual}</b> <span style={{ color: 'var(--ink-3)' }}>vs req. {requerido}</span>
      </div>
      {nota && <div style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.4 }}>{nota}</div>}
    </div>
  )
}

// ─── Helpers UI compartidos ──────────────────────────────────────────────────
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
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1.1, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
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

function Pill({ label, ok }) {
  return (
    <span style={{
      fontSize: 9, padding: '2px 6px', borderRadius: 99, fontWeight: 700,
      background: ok ? 'var(--ok-bg)' : 'var(--bad-bg)',
      color: ok ? 'var(--ok)' : 'var(--bad)',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {label}
    </span>
  )
}

const inputStyle = {
  width: '100%', padding: '6px 10px', fontSize: 12,
  border: '1px solid var(--line)', borderRadius: 6,
  background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit',
  fontVariantNumeric: 'tabular-nums',
}
const readonlyBox = {
  padding: '6px 10px', fontSize: 12, background: 'var(--bg-alt)', borderRadius: 6,
}
const numStyle    = { fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-num)' }
const smallNote   = { display: 'block', fontSize: 10, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.4 }
const panelStyle  = { background: 'var(--bg-alt)', padding: '12px 16px', borderRadius: 8 }
const panelTitle  = { fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }
const th2 = { padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }
const td2 = { padding: '5px 8px', fontSize: 11, color: 'var(--ink-2)', borderBottom: '1px solid var(--line-soft)' }
const tdNum       = { fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-num)' }
const tdNumStrong = { ...tdNum, fontWeight: 700 }
