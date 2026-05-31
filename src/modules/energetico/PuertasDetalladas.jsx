// ─────────────────────────────────────────────────────────────────────────────
// PuertasDetalladas — Registro de PUERTAS del proyecto con cálculo combinado
// U_puerta + validaciones DS N°15 (U), LOFC Ed.17 (RF), NCh352 (R'w) y OGUC
// Tít. IV (dimensiones).
//
// Estructura: lista de puertas (CRUD), cada una colapsable. Por defecto el
// proyecto arranca con 2 puertas (acceso principal + acceso secundario/patio).
// El estado vive component-local; cada cambio recalcula la puerta y agrega
// se refleja en el resumen agregado del hero.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react'
import {
  HOJAS, MARCOS_PUERTA, SELLOS,
  RF_MINIMO_POR_USO, RW_MINIMO_POR_USO,
  SUGERENCIAS_POR_ZONA,
} from '../../data/puertas_detalladas.js'
import {
  calcularPuertaCombinada,
  cumpleDS15Puerta, cumpleRFPuerta, cumpleRWPuerta, cumpleOGUC,
} from '../../lib/engines/puertas_detalladas.js'
import AyudaEnergetico from './AyudaEnergetico.jsx'
import { ZONA_DS15_LABELS } from '../../data/comunas_chile.js'

// ─── Defaults: arranque con 2 puertas típicas de vivienda ───────────────────
function getDefaultPuertas(zonaEf) {
  const sug = SUGERENCIAS_POR_ZONA[zonaEf] || SUGERENCIAS_POR_ZONA.D
  return [
    {
      id: 1, nombre: 'Acceso principal',
      uso: 'acceso_vivienda', ancho: 0.90, alto: 2.00,
      hojaId: sug.hoja, marcoId: sug.marco, selloId: sug.sello,
    },
    {
      id: 2, nombre: 'Acceso a patio / loggia',
      uso: 'acceso_vivienda', ancho: 0.80, alto: 2.00,
      hojaId: sug.hoja, marcoId: sug.marco, selloId: sug.sello,
    },
  ]
}

export default function PuertasDetalladas({ proy }) {
  const cfg = proy?.configEnergetica || {}
  const zonaEf = cfg.zonaDS15 || proy?.zona || 'D'
  const sugerencia = SUGERENCIAS_POR_ZONA[zonaEf] || SUGERENCIAS_POR_ZONA.D

  const [puertas, setPuertas] = useState(() => getDefaultPuertas(zonaEf))
  const [expandedId, setExpandedId] = useState(1)
  const [nextId, setNextId] = useState(3)

  // ─── CRUD de puertas ──────────────────────────────────────────────────────
  function addPuerta() {
    const nueva = {
      id: nextId,
      nombre: `Puerta ${puertas.length + 1}`,
      uso: 'acceso_vivienda', ancho: 0.85, alto: 2.00,
      hojaId: sugerencia.hoja, marcoId: sugerencia.marco, selloId: sugerencia.sello,
    }
    setPuertas([...puertas, nueva])
    setNextId(nextId + 1)
    setExpandedId(nueva.id)
  }

  function removePuerta(id) {
    if (puertas.length <= 1) {
      alert('Debe haber al menos una puerta en el proyecto.')
      return
    }
    if (!confirm('¿Eliminar esta puerta del proyecto?')) return
    setPuertas(puertas.filter(p => p.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function duplicarPuerta(id) {
    const orig = puertas.find(p => p.id === id)
    if (!orig) return
    const copia = { ...orig, id: nextId, nombre: `${orig.nombre} (copia)` }
    const idx = puertas.findIndex(p => p.id === id)
    const nuevas = [...puertas]
    nuevas.splice(idx + 1, 0, copia)
    setPuertas(nuevas)
    setNextId(nextId + 1)
    setExpandedId(copia.id)
  }

  function updatePuerta(id, partial) {
    setPuertas(puertas.map(p => p.id === id ? { ...p, ...partial } : p))
  }

  // ─── Cálculos por puerta + agregado ───────────────────────────────────────
  const computed = useMemo(() => puertas.map(p => {
    const r = calcularPuertaCombinada({
      ancho_m: p.ancho, alto_m: p.alto,
      hojaId: p.hojaId, marcoId: p.marcoId, selloId: p.selloId,
    })
    if (!r) return { ...p, r: null, valid: null }
    const usoOGUC = p.uso === 'acceso_vivienda' || p.uso === 'acceso_unidades' || p.uso === 'evacuacion_escalera'
      ? 'acceso_principal' : 'interior_recinto'
    const valid = {
      termica: cumpleDS15Puerta(r.U, zonaEf),
      fuego:   cumpleRFPuerta(r.rf, p.uso),
      acust:   cumpleRWPuerta(r.rw, p.uso),
      dimens:  cumpleOGUC(r.anchoLibre_m, r.altoLibre_m, usoOGUC),
    }
    return { ...p, r, valid }
  }), [puertas, zonaEf])

  // Resumen agregado para el Hero
  const resumen = useMemo(() => {
    const total = computed.length
    const todasCumplen = computed.every(p => p.valid && p.valid.termica?.cumple && p.valid.fuego?.cumple && p.valid.acust?.cumple && p.valid.dimens?.cumple)
    const cumpleN = computed.filter(p => p.valid && p.valid.termica?.cumple && p.valid.fuego?.cumple && p.valid.acust?.cumple && p.valid.dimens?.cumple).length
    const areaTotal = computed.reduce((s, p) => s + (p.r?.A_total || 0), 0)
    const uPromedio = computed.length > 0
      ? Math.round(computed.reduce((s, p) => s + (p.r?.U || 0) * (p.r?.A_total || 0), 0) / Math.max(areaTotal, 0.01) * 100) / 100
      : 0
    return { total, cumpleN, todasCumplen, areaTotal: Math.round(areaTotal * 100) / 100, uPromedio }
  }, [computed])

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>
      <HeroResumen resumen={resumen} zonaEf={zonaEf} />

      <AyudaEnergetico
        icon="🚪"
        titulo="Puertas del proyecto (4 ejes normativos)"
        intro="Registro de las puertas del proyecto. Cada puerta se evalúa simultáneamente en 4 ejes: U (DS N°15), RF (LOFC), R'w (NCh352) y dimensiones (OGUC Tít. IV). Por defecto el proyecto arranca con dos puertas típicas de vivienda (acceso principal + acceso a patio/loggia). Podés agregar, duplicar o eliminar según las puertas reales del proyecto."
        pasos={[
          'Revisá las dos puertas <b>iniciales</b> (acceso principal + acceso a patio). Editá nombre, uso, dimensiones y componentes según corresponda.',
          'Usá <b>[+ Agregar puerta]</b> para sumar más puertas (cocina, despensa, baños, cuartos técnicos…).',
          'Cada puerta muestra <b>4 chips</b> de cumplimiento (✓/✗ por eje). Click en la card para expandir y editar.',
          'El <b>hero arriba</b> resume cuántas puertas cumplen los 4 ejes y muestra el U promedio ponderado por área.',
          '<b>Duplicar</b> es útil para puertas similares (varios dormitorios, varios baños) — solo cambiás el nombre.',
        ]}
        origenDatos={[
          { campo: 'Zona DS N°15 — sugerencia inicial y validación U', origen: 'energetico:configuracion' },
          { campo: 'Catálogo hojas/marcos/sellos — propiedades industria', origen: 'auto' },
          { campo: 'Lista de puertas + cada configuración — los defines tú', origen: 'usuario' },
        ]}
        normativa="DS N°15 (U) · LOFC Ed.17 (RF) · NCh352 (R'w) · OGUC Tít. IV (dimensiones) · ISO 10077-1"
      />

      {/* ── Toolbar de la lista ──────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, padding: '12px 18px', marginBottom: 12,
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg, 12px)',
      }}>
        <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 700 }}>
          📋 {puertas.length} puerta{puertas.length !== 1 ? 's' : ''} en el proyecto
        </div>
        <button onClick={addPuerta} style={btnPrimaryStyle}>+ Agregar puerta</button>
      </div>

      {/* ── Lista de puertas ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {computed.map(p => (
          <PuertaCard
            key={p.id}
            puerta={p}
            expanded={expandedId === p.id}
            sugerencia={sugerencia}
            zonaEf={zonaEf}
            onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
            onUpdate={(partial) => updatePuerta(p.id, partial)}
            onRemove={() => removePuerta(p.id)}
            onDuplicate={() => duplicarPuerta(p.id)}
            puedeEliminar={puertas.length > 1}
          />
        ))}
      </div>

      <p style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>
        Cálculo U según NCh3079 / ISO 10077-1. RF según LOFC Ed.17 (mínimo entre hoja y marco).
        R'w estimado según NCh352 (R'w hoja + bonus sello). Dimensiones según OGUC Tít. IV.
        La lista de puertas vive en este formulario (no se persiste con el proyecto todavía).
      </p>
    </div>
  )
}

// ─── Hero con resumen agregado ──────────────────────────────────────────────
function HeroResumen({ resumen, zonaEf }) {
  const color = resumen.todasCumplen ? '#16a34a' : (resumen.cumpleN > 0 ? '#b45309' : '#dc2626')
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}, #1e293b)`,
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '20px 28px', color: '#fff', marginBottom: 16,
    }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.85, marginBottom: 4 }}>
        Puertas del proyecto · Zona {zonaEf} · {ZONA_DS15_LABELS[zonaEf]}
      </div>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
        {resumen.cumpleN} de {resumen.total} cumplen los 4 ejes · U̅ = {resumen.uPromedio} W/m²K
      </h2>
      <p style={{ fontSize: 12, margin: '6px 0 0', opacity: 0.92 }}>
        {resumen.todasCumplen
          ? `✅ Todas las puertas cumplen DS N°15, LOFC, NCh352 y OGUC.`
          : resumen.cumpleN > 0
            ? `⚠ ${resumen.total - resumen.cumpleN} puerta(s) con algún eje en rojo. Expandí cada card para ver detalles.`
            : `❌ Ninguna puerta cumple los 4 ejes simultáneamente. Revisá componentes y dimensiones.`}
        {' · '}Área total: <b style={{ fontVariantNumeric: 'tabular-nums' }}>{resumen.areaTotal} m²</b>
      </p>
    </div>
  )
}

// ─── PuertaCard ──────────────────────────────────────────────────────────────
// Card colapsable: cerrada muestra nombre + 4 chips; abierta el editor completo
function PuertaCard({ puerta, expanded, sugerencia, zonaEf, onToggle, onUpdate, onRemove, onDuplicate, puedeEliminar }) {
  const { r, valid } = puerta
  if (!r) return null

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden',
    }}>
      {/* Header siempre visible */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: expanded ? 'var(--bg-alt)' : 'transparent',
        borderBottom: expanded ? '1px solid var(--line)' : 'none',
        cursor: 'pointer',
      }} onClick={onToggle}>
        <span style={{ fontSize: 16 }}>🚪</span>
        <input
          type="text"
          value={puerta.nombre}
          onChange={e => onUpdate({ nombre: e.target.value })}
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1, padding: '4px 8px', fontSize: 13, fontWeight: 700,
            border: '1px solid transparent', background: 'transparent', color: 'var(--ink)',
            borderRadius: 4,
          }}
          onFocus={e => { e.target.style.border = '1px solid var(--line)'; e.target.style.background = 'var(--surface)' }}
          onBlur={e => { e.target.style.border = '1px solid transparent'; e.target.style.background = 'transparent' }}
        />
        {/* Pills de cumplimiento */}
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <Pill icon="🌡" label={`U ${r.U}`}     ok={valid.termica?.cumple} />
          <Pill icon="🔥" label={r.rf}            ok={valid.fuego?.cumple} />
          <Pill icon="🔊" label={`${r.rw} dB`}   ok={valid.acust?.cumple} />
          <Pill icon="📐" label={`${r.anchoLibre_m}×${r.altoLibre_m}`} ok={valid.dimens?.cumple} />
        </div>
        {/* Acciones */}
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <IconButton title="Duplicar" onClick={onDuplicate}>⎘</IconButton>
          <IconButton title="Eliminar" onClick={onRemove} disabled={!puedeEliminar} danger>✕</IconButton>
          <IconButton title={expanded ? 'Colapsar' : 'Expandir'} onClick={onToggle}>{expanded ? '▲' : '▼'}</IconButton>
        </div>
      </div>

      {/* Body expandible */}
      {expanded && (
        <PuertaEditor puerta={puerta} sugerencia={sugerencia} zonaEf={zonaEf} onUpdate={onUpdate} />
      )}
    </div>
  )
}

// ─── PuertaEditor: el configurador completo (cuando la card está expandida) ─
function PuertaEditor({ puerta, sugerencia, zonaEf, onUpdate }) {
  const { r, valid } = puerta
  return (
    <div style={{ padding: 18 }}>
      {/* Uso */}
      <div style={{ marginBottom: 16 }}>
        <Field label="Tipo de uso">
          <select value={puerta.uso} onChange={e => onUpdate({ uso: e.target.value })} style={inputStyle}>
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
            {RF_MINIMO_POR_USO[puerta.uso]?.nota || 'Sin requisito RF específico.'}
          </small>
        </Field>
      </div>

      {/* Dimensiones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
        <Field label="Ancho total (m)">
          <input type="number" min={0.6} max={2.4} step={0.05} value={puerta.ancho}
            onChange={e => onUpdate({ ancho: Number(e.target.value) || 0 })} style={inputStyle} />
        </Field>
        <Field label="Alto total (m)">
          <input type="number" min={1.8} max={2.6} step={0.05} value={puerta.alto}
            onChange={e => onUpdate({ alto: Number(e.target.value) || 0 })} style={inputStyle} />
        </Field>
        <Field label="Ancho libre paso">
          <div style={readonlyBox}><b style={numStyle}>{r.anchoLibre_m} m</b></div>
        </Field>
        <Field label="Área total">
          <div style={readonlyBox}><b style={numStyle}>{r.A_total} m²</b></div>
        </Field>
      </div>

      {/* Componentes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
        <Field label="Hoja (material + núcleo)">
          <select value={puerta.hojaId} onChange={e => onUpdate({ hojaId: e.target.value })} style={inputStyle}>
            {HOJAS.map(h => <option key={h.id} value={h.id}>{h.nombre} · U {h.u} · {h.rf} · R&apos;w {h.rw}</option>)}
          </select>
          {puerta.hojaId === sugerencia.hoja && <BadgeInline texto="Sugerido para tu zona" />}
        </Field>
        <Field label="Marco">
          <select value={puerta.marcoId} onChange={e => onUpdate({ marcoId: e.target.value })} style={inputStyle}>
            {MARCOS_PUERTA.map(m => <option key={m.id} value={m.id}>{m.nombre} · U {m.u} · {m.rf}</option>)}
          </select>
          {puerta.marcoId === sugerencia.marco && <BadgeInline texto="Sugerido para tu zona" />}
        </Field>
        <Field label="Sello perimetral">
          <select value={puerta.selloId} onChange={e => onUpdate({ selloId: e.target.value })} style={inputStyle}>
            {SELLOS.map(s => <option key={s.id} value={s.id}>{s.nombre} · clase {s.infiltracion_clase} · +{s.bonus_rw_db} dB</option>)}
          </select>
          {puerta.selloId === sugerencia.sello && <BadgeInline texto="Sugerido para tu zona" />}
        </Field>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 16 }}>
        <BigKPI label="U combinado"      value={`${r.U} W/m²K`}     color={valid.termica?.cumple ? 'var(--ok)' : 'var(--bad)'} sub={valid.termica ? (valid.termica.cumple ? `✅ ≤ ${valid.termica.umax}` : `❌ > ${valid.termica.umax}`) : ''} />
        <BigKPI label="Resistencia fuego"  value={r.rf}              color={valid.fuego?.cumple   ? 'var(--ok)' : 'var(--bad)'} sub={valid.fuego   ? (valid.fuego.cumple   ? `✅ ≥ ${valid.fuego.rfRequerido}` : `❌ req. ${valid.fuego.rfRequerido}`) : ''} />
        <BigKPI label="Aislamiento R'w"    value={`${r.rw} dB`}      color={valid.acust?.cumple   ? 'var(--ok)' : 'var(--bad)'} sub={valid.acust   ? (valid.acust.cumple   ? `✅ ≥ ${valid.acust.rwRequerido}` : `❌ req. ${valid.acust.rwRequerido} dB`) : ''} />
        <BigKPI label="Dimensiones OGUC"   value={`${r.anchoLibre_m}×${r.altoLibre_m}`} color={valid.dimens?.cumple ? 'var(--ok)' : 'var(--bad)'} sub={valid.dimens ? (valid.dimens.cumple ? `✅ ≥ ${valid.dimens.anchoMinReq}×${valid.dimens.altoMinReq}` : `❌ mín ${valid.dimens.anchoMinReq}×${valid.dimens.altoMinReq} m`) : ''} />
      </div>

      {/* Desglose térmico */}
      <details style={{ background: 'var(--bg-alt)', borderRadius: 8, padding: '8px 12px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>
          🔬 Desglose de la transmitancia
        </summary>
        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginTop: 8 }}>
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
      </details>
    </div>
  )
}

// ─── Helpers UI ──────────────────────────────────────────────────────────────
function Pill({ icon, label, ok }) {
  return (
    <span style={{
      fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 700,
      background: ok ? 'var(--ok-bg)' : 'var(--bad-bg)',
      color: ok ? 'var(--ok)' : 'var(--bad)',
      fontVariantNumeric: 'tabular-nums',
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      <span style={{ fontSize: 9, opacity: 0.7 }}>{icon}</span>
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}

function IconButton({ title, onClick, disabled, danger, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 8px', fontSize: 13,
        background: 'transparent',
        border: '1px solid var(--line)', borderRadius: 6,
        color: disabled ? 'var(--ink-3)' : (danger ? 'var(--bad)' : 'var(--ink-2)'),
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--bg-alt)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(1px)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {children}
    </button>
  )
}

function BigKPI({ label, value, sub, color }) {
  return (
    <div>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1.1, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
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
  fontVariantNumeric: 'tabular-nums',
}
const btnPrimaryStyle = {
  padding: '8px 14px', fontSize: 12, fontWeight: 700,
  background: '#1e40af', color: '#fff',
  border: 'none', borderRadius: 6, cursor: 'pointer',
  transition: 'background 0.15s, transform 0.1s',
}
const readonlyBox = {
  padding: '6px 10px', fontSize: 12, background: 'var(--bg-alt)', borderRadius: 6,
}
const numStyle   = { fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-num)' }
const smallNote  = { display: 'block', fontSize: 10, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.4 }
const th2 = { padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }
const td2 = { padding: '5px 8px', fontSize: 11, color: 'var(--ink-2)', borderBottom: '1px solid var(--line-soft)' }
const tdNum       = { fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-num)' }
const tdNumStrong = { ...tdNum, fontWeight: 700 }
