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
import { obtenerHDD18 } from '../../data/grados_dia.js'
import {
  listarComunasOrdenadas,
  obtenerZonaDS15Comuna,
  obtenerDistribuidoraComuna,
  obtenerDistribuidoraAlt,
  ZONA_DS15_LABELS,
  REGIONES_LABELS,
} from '../../data/comunas_chile.js'
import AyudaEnergetico, { BadgeOrigen } from './AyudaEnergetico.jsx'

export default function EnergeticoConfig({ proy, onChangeProy }) {
  const cfg = proy?.configEnergetica || {}

  function patchCfg(patch) {
    onChangeProy({
      ...proy,
      configEnergetica: { ...cfg, ...patch },
    })
  }

  // ── Resolución de zona/macrozona ──────────────────────────────────────────
  // Prioridad de fuente de verdad para el módulo Energético:
  //   1. comunaKey en configEnergetica → deriva zona oficial DS N°15
  //   2. cfg.zonaDS15 manual (override)
  //   3. proy.zona del módulo Normativo (fallback)
  const comunaKey = cfg.comunaKey || ''
  const zonaDerivadaComuna = obtenerZonaDS15Comuna(comunaKey)
  const zonaEfectiva = zonaDerivadaComuna || cfg.zonaDS15 || proy?.zona || null
  const macrozona = zonaEfectiva ? zonaOGUCaMacrozona(zonaEfectiva) : 'centro'

  // Cuando el usuario selecciona una comuna, sincronizamos zona, macrozona,
  // distribuidora eléctrica y tarifa referencial automáticamente.
  function elegirComuna(nuevaKey) {
    const z = obtenerZonaDS15Comuna(nuevaKey)
    const distribId = obtenerDistribuidoraComuna(nuevaKey)
    const distrib   = DISTRIBUIDORAS_ELEC.find(d => d.id === distribId)
    patchCfg({
      comunaKey:    nuevaKey,
      zonaDS15:     z || null,
      macrozona:    z ? zonaOGUCaMacrozona(z) : 'centro',
      distribuidora: distribId,
      tarifaElec:   distrib?.tarifa_clp_kwh ?? TARIFA_ELEC_DEFAULT,
    })
  }

  const tarifaElec = cfg.tarifaElec ?? TARIFA_ELEC_DEFAULT
  const combCalefId = cfg.combustibleCalef || 'lena_no_cert'
  const combCalef = COMBUSTIBLES_CALEFACCION.find(c => c.id === combCalefId)
  const sistemaAcsId = cfg.sistemaACS || 'calefon_gas'
  const sistemaCocId = cfg.sistemaCocina || 'gas_glp'

  // Tipo de proyecto (default: unifamiliar)
  const tipoProy = cfg.tipoProyecto || 'unifamiliar'

  // Precio del combustible: override del usuario o el referencial de la macrozona
  const precioRef = combCalef?.precios?.[macrozona] || 0
  const precioComb = cfg.precioCombustible ?? precioRef

  // CLP/kWh útil calculado
  const clpKwh = combCalef?.usaTarifaElec
    ? tarifaElec / combCalef.rendTipico
    : (precioComb && combCalef) ? precioComb / (combCalef.pci_kwh_unidad * combCalef.rendTipico) : 0

  // HDD18 detectado (la función ya prioriza catálogo detallado → zona de comuna)
  const hdd18 = obtenerHDD18(comunaKey, zonaEfectiva)

  // Lista de comunas agrupadas por región para el selector
  const todasComunas = listarComunasOrdenadas()
  const comunasPorRegion = todasComunas.reduce((acc, c) => {
    if (!acc[c.region]) acc[c.region] = { label: c.regionLabel, items: [] }
    acc[c.region].items.push(c)
    return acc
  }, {})

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

      <AyudaEnergetico
        icon="⚙"
        titulo="Configuración energética del proyecto"
        intro="Esta pestaña define los parámetros base que alimentarán todos los cálculos económicos y de renovables. La comuna es la entrada más importante: de ella se derivan automáticamente la zona DS N°15 oficial, los grados-día de calefacción (HDD18) y la radiación solar."
        pasos={[
          'Selecciona la <b>comuna</b> del proyecto del catálogo completo (~346 comunas). Si no encuentras tu comuna, elige la más cercana.',
          'Verifica la <b>tarifa eléctrica</b>. Si conoces la del cliente (último recibo), usa ese valor. Si no, la app sugiere por distribuidora.',
          'Indica el <b>combustible real de calefacción</b> usado en el hogar (no el ideal). Los precios por macrozona son referenciales — sobrescríbelos si conoces el local.',
          'Define los sistemas de <b>ACS</b> (agua caliente sanitaria) y <b>cocina</b>. Esto afecta el análisis de solar térmico y bomba de calor en la pestaña Renovables.',
        ]}
        origenDatos={[
          { campo: 'Comuna — la eliges tú directamente (~346 comunas chilenas)', origen: 'usuario' },
          { campo: 'Zona DS N°15 y HDD18 — se derivan automáticamente de la comuna', origen: 'auto' },
          { campo: 'Macrozona (norte/centro/sur/austral) — auto desde zona DS N°15', origen: 'auto' },
          { campo: 'Distribuidora eléctrica — sugerida por zona de concesión SEC', origen: 'auto' },
          { campo: 'Tarifa BT1-A referencial — promedio actual por distribuidora (editable)', origen: 'auto' },
          { campo: 'Precio combustible — referencial por macrozona (editable)', origen: 'usuario' },
        ]}
        normativa="DS N°15 MINVU · NCh853:2021 · Tarifas CNE BT1-A"
      />

      {/* ── Tipo de proyecto (alcance v1) ────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <Card titulo="🏗 Tipo de proyecto" descripcion="Esta versión del módulo Energético está optimizada para viviendas. Para edificios comerciales, oficinas o educacionales se recomienda software especializado.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {[
              { id: 'unifamiliar', icon: '🏠', label: 'Vivienda unifamiliar', desc: 'Casa individual con envolvente completa expuesta. ACH típico 0.8.' },
              { id: 'depto',       icon: '🏢', label: 'Vivienda en altura',   desc: 'Departamento con muros medianeros (menor envolvente expuesta). ACH típico 0.6.' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => patchCfg({ tipoProyecto: t.id })}
                style={{
                  padding: '12px 14px', textAlign: 'left',
                  background: tipoProy === t.id ? 'var(--accent-bg)' : 'var(--surface)',
                  border: `1.5px solid ${tipoProy === t.id ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 8, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 4,
                  fontFamily: 'var(--font-ui)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: tipoProy === t.id ? 'var(--accent)' : 'var(--ink)',
                  }}>
                    {t.label}
                  </span>
                  {tipoProy === t.id && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 9, fontWeight: 700,
                      background: 'var(--accent)', color: '#fff',
                      padding: '2px 6px', borderRadius: 99,
                    }}>SELECCIONADO</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  {t.desc}
                </div>
              </button>
            ))}
          </div>
          <div style={{
            marginTop: 10, padding: '8px 12px',
            background: 'var(--bg-alt)', border: '1px solid var(--line-soft)',
            borderRadius: 6, fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.5,
          }}>
            ℹ Esta selección informa el contexto del proyecto. La calificación <b>CEV oficial MINVU</b> y
            los benchmarks (Casa Pasiva, Vivienda Social DS19) aplican a ambos tipos. Para edificios no
            residenciales (oficinas, comercio, salud, educación) se requeriría un módulo dedicado con
            otros parámetros de ocupación y certificación (CES MOP, LEED, EDGE).
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>

        {/* ── Localización ───────────────────────────────────────────────── */}
        <Card titulo="📍 Localización" descripcion="La comuna determina la zona DS N°15, los grados-día y el clima.">
          <Field label="Comuna (todas las ~346 de Chile)">
            <select value={comunaKey} onChange={e => elegirComuna(e.target.value)} style={inputStyle}>
              <option value="">— Selecciona comuna —</option>
              {Object.entries(comunasPorRegion).map(([regionCode, data]) => (
                <optgroup key={regionCode} label={data.label}>
                  {data.items.map(c => (
                    <option key={c.key} value={c.key}>
                      {c.nombre} (Zona {c.zona_ds15})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <DataRow
            label="Zona DS N°15 (auto)"
            value={zonaEfectiva ? ZONA_DS15_LABELS[zonaEfectiva] || zonaEfectiva : '—'}
            highlight={!!zonaDerivadaComuna}
          />
          <DataRow label="Macrozona" value={MACROZONAS[macrozona]?.label || macrozona} />
          <DataRow label="Grados-día base 18°C" value={`${hdd18} °C·día`} highlight />
          {zonaEfectiva && proy?.zona && zonaEfectiva !== proy.zona && (
            <div style={{
              marginTop: 8, fontSize: 10, color: 'var(--warn)',
              background: 'var(--warn-bg)', border: '1px solid var(--warn)',
              padding: '6px 10px', borderRadius: 6, lineHeight: 1.5,
            }}>
              ⚠ La zona del proyecto Normativo es <b>{proy.zona}</b>, pero aquí se usa zona <b>{zonaEfectiva}</b>.{' '}
              <button
                type="button"
                onClick={() => {
                  const cKey = proy.comuna
                    ? proy.comuna.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_')
                    : ''
                  const z = obtenerZonaDS15Comuna(cKey)
                  if (cKey) {
                    const distribId = obtenerDistribuidoraComuna(cKey)
                    const distrib = DISTRIBUIDORAS_ELEC.find(d => d.id === distribId)
                    patchCfg({
                      comunaKey: cKey,
                      zonaDS15: z || proy.zona,
                      distribuidora: distribId || cfg.distribuidora,
                      tarifaElec: distrib?.tarifa_clp_kwh ?? cfg.tarifaElec,
                    })
                  } else {
                    patchCfg({ zonaDS15: proy.zona })
                  }
                }}
                style={{
                  background: 'var(--warn)', color: '#fff', border: 'none',
                  borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                  cursor: 'pointer', marginLeft: 4,
                }}
              >
                Sincronizar con Normativo
              </button>
            </div>
          )}
          {!comunaKey && proy?.comuna && (
            <div style={{
              marginTop: 8, fontSize: 10, color: 'var(--accent)',
              background: 'var(--accent-bg)', border: '1px solid var(--accent)',
              padding: '6px 10px', borderRadius: 6, lineHeight: 1.5,
            }}>
              💡 En Diagnóstico tienes comuna <b>{proy.comuna}</b> (Zona {proy.zona}).
              Al seleccionar una comuna aquí se configurará el módulo energético de forma independiente.
            </div>
          )}
        </Card>

        {/* ── Electricidad ───────────────────────────────────────────────── */}
        <Card titulo="⚡ Tarifa eléctrica" descripcion="Distribuidora y tarifa sugeridas según la comuna.">
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
            {comunaKey && (() => {
              const distrAlt = obtenerDistribuidoraAlt(comunaKey)
              const distrAltMeta = distrAlt ? DISTRIBUIDORAS_ELEC.find(d => d.id === distrAlt) : null
              return (
                <>
                  <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <BadgeOrigen origen="auto" small label="Auto" />
                    <span>Sugerida por zona de concesión SEC para tu comuna</span>
                  </div>
                  {distrAltMeta && (
                    <div style={{
                      marginTop: 6, padding: '6px 10px',
                      background: 'var(--warn-bg)', border: '1px solid var(--warn)',
                      borderRadius: 6, fontSize: 10, color: 'var(--warn)', lineHeight: 1.5,
                    }}>
                      ⓘ <b>Dualidad detectada:</b> en esta comuna también opera{' '}
                      <b>{distrAltMeta.nombre}</b> ({distrAltMeta.tarifa_clp_kwh} CLP/kWh).
                      Verifica con el cliente cuál es su empresa real (típicamente
                      depende de si está en zona urbana o rural).{' '}
                      <button
                        type="button"
                        onClick={() => patchCfg({ distribuidora: distrAlt, tarifaElec: distrAltMeta.tarifa_clp_kwh })}
                        style={{
                          background: 'var(--warn)', color: '#fff', border: 'none',
                          borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                          cursor: 'pointer', marginLeft: 4,
                        }}
                      >
                        Cambiar a {distrAltMeta.nombre.split(' ')[0]}
                      </button>
                    </div>
                  )}
                </>
              )
            })()}
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
