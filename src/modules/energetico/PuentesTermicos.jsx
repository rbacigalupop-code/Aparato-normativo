// ─────────────────────────────────────────────────────────────────────────────
// PuentesTermicos — Inventario de PT con cálculo de pérdidas adicionales.
//
// Layout: 2 columnas (contenido + sidebar guía sticky).
//
// Secciones:
//   1. Hero con resultado
//   2. AyudaEnergetico (intro general)
//   3. Diagrama SVG de vivienda mostrando dónde está cada PT
//   4. Empezar con tipología (4 botones)
//   5. Ejemplo numérico desplegable
//   6. Inventario actual (editable) + validación de longitudes
//   7. Recomendaciones automáticas (aplicar mejoras)
//   8. Catálogo completo de PTs
//
// Sidebar: pasos, glosario, tips.
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
import { zonaClimaDeOGUC } from '../../data/zona_clima.js'
import AyudaEnergetico, { BadgeOrigen } from './AyudaEnergetico.jsx'

const CALIDAD_LABELS = {
  malo:   '🔴 Mal resuelto',
  tipico: '🟡 Típico chileno',
  mejor:  '🟢 Buena solución',
}

const CATEGORIA_COLORS = {
  piso:        '#f97316',
  cubierta:    '#0d9488',
  esquinas:    '#7c3aed',
  aberturas:   '#eab308',
  intermedios: '#0f766e',
  voladizos:   '#dc2626',
}

export default function PuentesTermicos({ proy, calcUInit, inventarioPT, setInventarioPT }) {
  const cfg = proy?.configEnergetica || {}
  const zonaEf = zonaClimaDeOGUC(proy?.zona, cfg.comunaKey || proy?.comuna)
  const hdd18 = obtenerHDD18(cfg.comunaKey, zonaEf)

  // Inventario: array de { ptId, longitud, calidad } — estado levantado a App.jsx
  const inventario = inventarioPT || []
  const setInventario = setInventarioPT || (() => {})
  const [tipologia, setTipologia] = useState('')
  const [verEjemplo, setVerEjemplo] = useState(false)

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

  // Validación de longitudes
  const alertas = useMemo(() => validarLongitudes(inventario, tipologia, proy), [inventario, tipologia, proy])

  // Recomendaciones automáticas
  const recomendaciones = useMemo(() => generarRecomendaciones(inventario, hdd18), [inventario, hdd18])

  function aplicarRecomendacion(idx, nuevaCalidad) {
    actualizarItem(idx, { calidad: nuevaCalidad })
  }

  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto', padding: '24px 28px',
      fontFamily: 'var(--font-body)',
      display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px',
      gap: 20,
    }} className="nc-pt-layout">
      {/* ═══ COLUMNA PRINCIPAL ═══════════════════════════════════════════════ */}
      <div style={{ minWidth: 0 }}>
        <Hero analisis={analisis} pctImpacto={pctImpacto} severidad={sev} />

        <AyudaEnergetico
          icon="🌉"
          titulo="Puentes Térmicos lineales (Ψ)"
          intro="Los puentes térmicos son zonas donde la envolvente pierde calor adicional por discontinuidades constructivas (encuentros, esquinas, marcos). En Chile típicamente representan 15-30% de pérdidas adicionales sobre lo que calcula el U de los muros — pero rara vez se calculan."
          pasos={[
            'Mira el <b>diagrama visual</b> para identificar qué PT existen en tu proyecto.',
            'Elige tu <b>tipología constructiva</b> para precargar longitudes referenciales.',
            'Ajusta cada PT con su <b>longitud real</b> (medida del plano) y <b>calidad constructiva</b>.',
            'Revisa las <b>recomendaciones automáticas</b> al final para ver mejoras priorizadas.',
            'Si tu % impacto supera el 30%, hay problemas constructivos serios (típicamente balcones pasantes).',
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

        {/* ── Diagrama visual ───────────────────────────────────────────── */}
        <Card titulo="📐 Diagrama: dónde está cada puente térmico">
          <DiagramaVivienda />
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 8, fontStyle: 'italic' }}>
            Sección esquemática de una vivienda de dos pisos con balcón. Cada zona coloreada
            indica una categoría de PT. Los números coinciden con el catálogo del final.
          </div>
        </Card>

        {/* ── Tipología ──────────────────────────────────────────────────── */}
        <Card titulo="🏗 Empezar con tipología (opcional)">
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 10 }}>
            Selecciona la tipología más parecida para cargar longitudes referenciales.
            Luego ajustas los valores reales del proyecto.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(TIPOLOGIAS_LABELS).map(([k, lbl]) => (
              <button
                key={k} type="button"
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

        {/* ── Ejemplo numérico desplegable ───────────────────────────────── */}
        <EjemploNumerico abierto={verEjemplo} onToggle={() => setVerEjemplo(v => !v)} hdd18Comuna={hdd18} />

        {/* ── Alertas de validación ──────────────────────────────────────── */}
        {alertas.length > 0 && (
          <div style={{
            background: 'var(--warn-bg)', border: '1px solid var(--warn)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warn)', marginBottom: 6 }}>
              ⚠ Validación de longitudes — revisa estos valores
            </div>
            {alertas.map((a, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--warn)', lineHeight: 1.5, marginBottom: 3 }}>
                • {a}
              </div>
            ))}
          </div>
        )}

        {/* ── Inventario actual ─────────────────────────────────────────── */}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: 2,
                            background: CATEGORIA_COLORS[d.categoria], flexShrink: 0,
                          }} />
                          <b>{d.nombre}</b>
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', marginLeft: 14 }}>
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

        {/* ── Recomendaciones automáticas ─────────────────────────────── */}
        {recomendaciones.length > 0 && (
          <Card titulo="⚡ Recomendaciones automáticas">
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 10 }}>
              Las 3 mejoras con mayor impacto en tu inventario actual. Hacer click en "Aplicar mejora"
              actualiza la calidad del PT al nivel "Buena solución".
            </div>
            {recomendaciones.map((r, i) => {
              const calidadActual = inventario[r.idx]?.calidad
              const yaEsMejor = calidadActual === 'mejor'
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '30px 1fr 120px',
                  gap: 12, padding: '12px 14px', marginBottom: 8,
                  background: yaEsMejor ? 'var(--ok-bg)' : 'var(--bg-alt)',
                  border: `1px solid ${yaEsMejor ? 'var(--ok)' : 'var(--line)'}`,
                  borderRadius: 8, alignItems: 'center',
                }}>
                  <div style={{
                    background: yaEsMejor ? 'var(--ok)' : 'var(--accent)',
                    color: '#fff', borderRadius: '50%', width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 13,
                  }}>{yaEsMejor ? '✓' : i + 1}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                      {r.ptNombre} <span style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 400 }}>({r.longitud}m)</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.4 }}>
                      {yaEsMejor
                        ? `Ya está en calidad "Buena solución" (Ψ = ${r.psiMejor})`
                        : `${CALIDAD_LABELS[calidadActual]} (Ψ ${r.psiActual}) → 🟢 Buena solución (Ψ ${r.psiMejor})`}
                    </div>
                  </div>
                  {yaEsMejor ? (
                    <div style={{
                      fontSize: 10, color: 'var(--ok)', fontWeight: 700, textAlign: 'center',
                    }}>
                      ✅ Mejor solución aplicada
                    </div>
                  ) : (
                    <button
                      onClick={() => aplicarRecomendacion(r.idx, 'mejor')}
                      style={{
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        borderRadius: 6, padding: '8px 10px', fontSize: 10, fontWeight: 700,
                        cursor: 'pointer', lineHeight: 1.2, textAlign: 'center',
                      }}
                    >
                      Aplicar<br/>
                      <span style={{ fontSize: 11, fontWeight: 800 }}>
                        −{r.ahorro.toLocaleString('es-CL')} kWh
                      </span>
                    </button>
                  )}
                </div>
              )
            })}
          </Card>
        )}

        {/* ── Catálogo ──────────────────────────────────────────────────── */}
        <Card titulo="📚 Catálogo de puentes térmicos">
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12 }}>
            Selecciona un PT del catálogo para agregarlo al inventario.
          </div>
          {CATEGORIAS_PT.map(cat => (
            <div key={cat.id} style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--ink)',
                marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid var(--line-soft)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 2,
                  background: CATEGORIA_COLORS[cat.id],
                }} />
                {cat.icon} {cat.label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
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
                        type="button" onClick={() => agregarPT(pt.id)}
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

      {/* ═══ SIDEBAR GUÍA STICKY ═══════════════════════════════════════════ */}
      <SidebarGuia hdd18={hdd18} zonaEf={zonaEf} comunaKey={cfg.comunaKey} />

      {/* Estilos responsive */}
      <style>{`
        @media (max-width: 1100px) {
          .nc-pt-layout {
            grid-template-columns: 1fr !important;
          }
          .nc-pt-sidebar {
            position: static !important;
          }
        }
      `}</style>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SIDEBAR — Guía paso a paso + glosario + tips
// ═════════════════════════════════════════════════════════════════════════════
function SidebarGuia({ hdd18, zonaEf, comunaKey }) {
  return (
    <div className="nc-pt-sidebar" style={{ position: 'sticky', top: 20, alignSelf: 'start', minWidth: 0 }}>
      {/* Pasos */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--accent)',
        borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden', marginBottom: 12,
      }}>
        <div style={{
          padding: '10px 14px', background: 'var(--accent)', color: '#fff',
          fontSize: 12, fontWeight: 700,
        }}>
          📖 Cómo usar esta pestaña
        </div>
        <div style={{ padding: 14, fontSize: 11, lineHeight: 1.55, color: 'var(--ink-2)' }}>
          <Paso n={1} titulo="Identifica con el diagrama">
            Mira el dibujo para entender qué PT existen en una vivienda real.
          </Paso>
          <Paso n={2} titulo="Carga tipología (atajo)">
            Elige el tipo de vivienda parecido al tuyo — la app pre-carga longitudes.
          </Paso>
          <Paso n={3} titulo="Ajusta longitudes reales">
            En la tabla de inventario, edita los metros de cada PT con los del plano.
          </Paso>
          <Paso n={4} titulo="Define calidad constructiva">
            Selecciona malo/típico/mejor según cómo está resuelto cada encuentro.
          </Paso>
          <Paso n={5} titulo="Aplica recomendaciones" ultimo>
            Las 3 mejoras con mayor impacto aparecen automáticamente con botón "aplicar".
          </Paso>
        </div>
      </div>

      {/* Glosario */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden', marginBottom: 12,
      }}>
        <div style={{
          padding: '10px 14px', background: 'var(--bg-alt)',
          fontSize: 12, fontWeight: 700, color: 'var(--ink)',
        }}>
          📘 Glosario rápido
        </div>
        <div style={{ padding: 12, fontSize: 11, lineHeight: 1.5 }}>
          <Term sigla="Ψ (psi)" desc="Transmitancia lineal en W/m·K. Es la pérdida adicional por metro lineal del PT." />
          <Term sigla="U" desc="Transmitancia superficial en W/m²K. Pérdida por m² del elemento (muro, techo)." />
          <Term sigla="HDD18" desc={`Grados-día calefacción base 18°C de tu comuna. Tu valor: ${hdd18} °C·día.`} />
          <Term sigla="RPT" desc="Rotura de Puente Térmico — sello plástico que corta la conducción en marcos metálicos." />
        </div>
      </div>

      {/* Datos del proyecto */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden', marginBottom: 12,
      }}>
        <div style={{
          padding: '10px 14px', background: 'var(--bg-alt)',
          fontSize: 12, fontWeight: 700, color: 'var(--ink)',
        }}>
          📍 Tu proyecto
        </div>
        <div style={{ padding: 12, fontSize: 11, lineHeight: 1.6 }}>
          <DataRow lbl="Comuna" val={comunaKey ? tituloComuna(comunaKey) : '— (configurar)'} />
          <DataRow lbl="Zona DS N°15" val={zonaEf || '—'} />
          <DataRow lbl="HDD18" val={`${hdd18} °C·día`} />
        </div>
      </div>

      {/* Tips */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 14px', background: 'var(--bg-alt)',
          fontSize: 12, fontWeight: 700, color: 'var(--ink)',
        }}>
          💡 Tips
        </div>
        <div style={{ padding: 12, fontSize: 11, lineHeight: 1.5, color: 'var(--ink-2)' }}>
          <Tip>El <b>balcón pasante</b> es el peor PT residencial. Ψ típico 0.65 W/m·K.</Tip>
          <Tip>Casa Pasiva exige <b>% impacto &lt; 10%</b>. Promedio chileno: 15–25%.</Tip>
          <Tip>Marcos PVC eliminan el PT de jamba casi por completo (Ψ ~0.04).</Tip>
          <Tip>Aislante perimetral de radier reduce su Ψ de 0.65 a 0.15.</Tip>
        </div>
      </div>
    </div>
  )
}

function Paso({ n, titulo, children, ultimo }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: ultimo ? 0 : 10 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 11, flexShrink: 0,
      }}>{n}</div>
      <div>
        <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 11 }}>{titulo}</div>
        <div style={{ marginTop: 2, color: 'var(--ink-2)' }}>{children}</div>
      </div>
    </div>
  )
}

function Term({ sigla, desc }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-num)' }}>{sigla}</span>
      <span style={{ color: 'var(--ink-2)' }}> — {desc}</span>
    </div>
  )
}

function Tip({ children }) {
  return <div style={{ marginBottom: 6, paddingLeft: 4 }}>• {children}</div>
}

function DataRow({ lbl, val }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ color: 'var(--ink-3)' }}>{lbl}</span>
      <span style={{ color: 'var(--ink)', fontWeight: 600, fontFamily: 'var(--font-num)' }}>{val}</span>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// DIAGRAMA SVG — Sección de vivienda mostrando los PTs
// ═════════════════════════════════════════════════════════════════════════════
function DiagramaVivienda() {
  return (
    <svg viewBox="0 0 600 420" style={{ width: '100%', maxWidth: 600, display: 'block', margin: '0 auto' }}>
      {/* ── Fondo: terreno ─────────────────────────────────────────────── */}
      <rect x={0} y={380} width={600} height={40} fill="#84613b" />
      <text x={20} y={405} fontSize={9} fill="#fff">Terreno</text>

      {/* ── Radier ─────────────────────────────────────────────────────── */}
      <rect x={100} y={360} width={400} height={20} fill="#737373" stroke="#525252" />
      <text x={290} y={374} fontSize={9} fill="#fff" fontWeight={700}>RADIER (hormigón)</text>

      {/* ── Muros piso 1 ─────────────────────────────────────────────── */}
      <rect x={100} y={240} width={20} height={120} fill="#e7d4b5" stroke="#a16207" />
      <rect x={480} y={240} width={20} height={120} fill="#e7d4b5" stroke="#a16207" />
      <rect x={120} y={240} width={360} height={120} fill="#fef3c7" />
      <text x={300} y={300} fontSize={11} fill="#92400e" textAnchor="middle" fontWeight={600}>PISO 1</text>

      {/* ── Losa entrepiso (un poco saliente para balcón) ─────────────── */}
      <rect x={100} y={230} width={420} height={12} fill="#737373" stroke="#525252" />

      {/* ── Muros piso 2 ─────────────────────────────────────────────── */}
      <rect x={100} y={130} width={20} height={100} fill="#e7d4b5" stroke="#a16207" />
      <rect x={480} y={130} width={20} height={100} fill="#e7d4b5" stroke="#a16207" />
      <rect x={120} y={130} width={360} height={100} fill="#fef3c7" />
      <text x={300} y={190} fontSize={11} fill="#92400e" textAnchor="middle" fontWeight={600}>PISO 2</text>

      {/* ── Balcón piso 2 (voladizo crítico) ─────────────────────────── */}
      <rect x={500} y={230} width={50} height={10} fill="#737373" stroke="#525252" />
      <rect x={545} y={210} width={3} height={30} fill="#525252" />
      <text x={525} y={224} fontSize={8} fill="#fff" textAnchor="middle">BALCÓN</text>

      {/* ── Cubierta (techo a dos aguas) ─────────────────────────────── */}
      <polygon points="100,130 300,40 500,130" fill="#dc2626" stroke="#991b1b" />
      <text x={300} y={95} fontSize={11} fill="#fff" textAnchor="middle" fontWeight={700}>CUBIERTA</text>

      {/* ── Ventana en piso 1 ─────────────────────────────────────────── */}
      <rect x={170} y={270} width={70} height={70} fill="#99f6e4" stroke="#0f766e" strokeWidth={2} />
      <text x={205} y={310} fontSize={9} fill="#115e59" textAnchor="middle" fontWeight={600}>Ventana</text>

      {/* ═══ PUNTEROS DE PT (rojo = crítico, naranja = importante, otros) ═══ */}

      {/* (1) PISO — Muro-Radier */}
      <PTMarker x={100} y={368} color={CATEGORIA_COLORS.piso} n={1} />
      <text x={50} y={375} fontSize={10} fill={CATEGORIA_COLORS.piso} fontWeight={700} textAnchor="end">
        1 · Muro-Radier
      </text>

      {/* (2) CUBIERTA — Muro-Techo */}
      <PTMarker x={100} y={130} color={CATEGORIA_COLORS.cubierta} n={2} />
      <PTMarker x={500} y={130} color={CATEGORIA_COLORS.cubierta} n={2} />
      <text x={50} y={130} fontSize={10} fill={CATEGORIA_COLORS.cubierta} fontWeight={700} textAnchor="end">
        2 · Muro-Techo
      </text>

      {/* (3) ESQUINAS — Esquina vertical */}
      <line x1={100} y1={130} x2={100} y2={360} stroke={CATEGORIA_COLORS.esquinas} strokeWidth={3} strokeDasharray="4 2" />
      <text x={68} y={250} fontSize={10} fill={CATEGORIA_COLORS.esquinas} fontWeight={700} textAnchor="end">
        3 · Esquina
      </text>

      {/* (4) ABERTURAS — Marco ventana (jamba/alféizar/dintel) */}
      <PTMarker x={170} y={270} color={CATEGORIA_COLORS.aberturas} n={4} small />
      <PTMarker x={240} y={270} color={CATEGORIA_COLORS.aberturas} n={4} small />
      <PTMarker x={170} y={340} color={CATEGORIA_COLORS.aberturas} n={4} small />
      <text x={310} y={355} fontSize={10} fill={CATEGORIA_COLORS.aberturas} fontWeight={700}>
        4 · Marco (jamba/alféizar/dintel)
      </text>

      {/* (5) INTERMEDIOS — Losa entrepiso */}
      <PTMarker x={500} y={236} color={CATEGORIA_COLORS.intermedios} n={5} />
      <text x={555} y={240} fontSize={10} fill={CATEGORIA_COLORS.intermedios} fontWeight={700}>
        5 · Losa entrepiso
      </text>

      {/* (6) VOLADIZOS — Balcón pasante (CRÍTICO) */}
      <PTMarker x={500} y={235} color={CATEGORIA_COLORS.voladizos} n={6} />
      <text x={520} y={205} fontSize={10} fill={CATEGORIA_COLORS.voladizos} fontWeight={800} textAnchor="middle">
        ⚠ 6 · Balcón (crítico)
      </text>

      {/* ── Leyenda inferior ──────────────────────────────────────────── */}
      <g transform="translate(20, 405)">
        <text fontSize={9} fill="#64748b" fontWeight={600}>
          Colores: <tspan fill={CATEGORIA_COLORS.piso}>■ Piso</tspan> <tspan fill={CATEGORIA_COLORS.cubierta}>■ Cubierta</tspan> <tspan fill={CATEGORIA_COLORS.esquinas}>■ Esquinas</tspan> <tspan fill={CATEGORIA_COLORS.aberturas}>■ Aberturas</tspan> <tspan fill={CATEGORIA_COLORS.intermedios}>■ Intermedios</tspan> <tspan fill={CATEGORIA_COLORS.voladizos} fontWeight={800}>■ Voladizos</tspan>
        </text>
      </g>
    </svg>
  )
}

function PTMarker({ x, y, color, n, small }) {
  const r = small ? 7 : 10
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} stroke="#fff" strokeWidth={2} />
      <text x={x} y={y + (small ? 3 : 4)} fontSize={small ? 9 : 11} fill="#fff" textAnchor="middle" fontWeight={800}>
        {n}
      </text>
    </g>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// EJEMPLO NUMÉRICO desplegable
// ═════════════════════════════════════════════════════════════════════════════
function EjemploNumerico({ abierto, onToggle, hdd18Comuna }) {
  const hdd = hdd18Comuna || 1480  // Santiago como ejemplo
  const filas = [
    { lbl: 'Muro–Radier',     L: 44, psi: 0.40 },
    { lbl: 'Muro–Techo',      L: 44, psi: 0.22 },
    { lbl: 'Esquinas',        L: 10, psi: 0.10 },
    { lbl: 'Jambas (RPT)',    L: 24, psi: 0.10 },
    { lbl: 'Alféizares',      L: 15, psi: 0.20 },
    { lbl: 'Dinteles',        L: 15, psi: 0.22 },
  ].map(f => ({ ...f, kwh: Math.round(f.psi * f.L * hdd * 24 / 1000) }))
  const total = filas.reduce((s, f) => s + f.kwh, 0)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden', marginBottom: 14,
    }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%', padding: '12px 18px',
          background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span style={{ fontSize: 18 }}>🧮</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
            Ejemplo numérico paso a paso
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
            Cómo se calcula la pérdida anual por PT. Vivienda 120 m² en tu comuna.
          </div>
        </div>
        <span style={{ fontSize: 14, color: 'var(--accent)', transform: abierto ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {abierto && (
        <div style={{ padding: '14px 18px', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>
            Vivienda media de <b>120 m²</b> en tu comuna (HDD18 = <b>{hdd}</b>), calidad
            constructiva <b>típica chilena</b>. La fórmula para cada PT es:
          </p>
          <div style={{
            background: 'var(--bg-alt)', padding: '8px 12px', borderRadius: 6, marginTop: 8,
            fontFamily: 'var(--font-num)', fontSize: 12, textAlign: 'center', color: 'var(--ink)',
          }}>
            <b>Pérdida = Ψ × L × HDD18 × 24 / 1000</b> [kWh/año]
          </div>

          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: 'var(--font-num)' }}>
              <thead>
                <tr>
                  <th style={th}>PT</th>
                  <th style={th}>L (m)</th>
                  <th style={th}>Ψ (W/m·K)</th>
                  <th style={th}>HDD18</th>
                  <th style={th}>kWh/año</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <td style={td}>{f.lbl}</td>
                    <td style={td}>{f.L}</td>
                    <td style={td}>{f.psi}</td>
                    <td style={td}>{hdd}</td>
                    <td style={{ ...td, fontWeight: 700, color: 'var(--bad)' }}>{f.kwh}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--line)' }}>
                  <td colSpan={4} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>Total PT:</td>
                  <td style={{ ...td, fontWeight: 800, color: 'var(--bad)' }}>{total.toLocaleString('es-CL')}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p style={{ marginTop: 12 }}>
            Si tu envolvente "limpia" pierde <b>~5.000 kWh/año</b>, el impacto PT sería{' '}
            <b>{Math.round(total / 5000 * 100)}%</b> — severidad{' '}
            <span style={{ background: 'var(--warn-bg)', color: 'var(--warn)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
              🟡 Mejorable
            </span> — típico chileno promedio.
          </p>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN de longitudes
// ═════════════════════════════════════════════════════════════════════════════
function validarLongitudes(inventario, tipologia, proy) {
  if (!Array.isArray(inventario) || inventario.length === 0) return []
  const alertas = []
  const sup = proy?.superficie || 120

  // Suma totales por tipo
  const totales = {}
  for (const item of inventario) {
    totales[item.ptId] = (totales[item.ptId] || 0) + (item.longitud || 0)
  }

  // Comparación con tipología (si hay)
  if (tipologia && LONGITUDES_TIPICAS[tipologia]) {
    const referencias = LONGITUDES_TIPICAS[tipologia]
    for (const [ptId, longTotal] of Object.entries(totales)) {
      const ref = referencias[ptId]
      if (ref && longTotal > ref * 2.5) {
        const pt = obtenerPT(ptId)
        alertas.push(`"${pt?.nombre}" tiene ${longTotal}m — supera 2,5× la referencia (${ref}m) de la tipología seleccionada. ¿Es correcto?`)
      }
    }
  }

  // Validaciones absolutas (límites físicos razonables)
  const perimetroEstimado = Math.sqrt(sup) * 4  // perímetro aprox de planta cuadrada
  if (totales.piso_radier_terreno && totales.piso_radier_terreno > perimetroEstimado * 1.5) {
    alertas.push(`Muro–Radier: ${totales.piso_radier_terreno}m supera el perímetro razonable para ${sup}m² (~${Math.round(perimetroEstimado)}m).`)
  }
  if (totales.esq_vert_ext && totales.esq_vert_ext > 30) {
    alertas.push(`Esquinas exteriores: ${totales.esq_vert_ext}m sugiere >10 esquinas. ¿Vivienda muy irregular o múltiples cuerpos?`)
  }
  if (totales.vol_balcon_pasante && totales.vol_balcon_pasante > 20) {
    alertas.push(`⚠ Balcón pasante: ${totales.vol_balcon_pasante}m es mucho — Ψ ≥ 0.65 puede aportar 30–50% de pérdidas totales. Considerar Schöck Isokorb o cambiar a balcón independiente.`)
  }

  return alertas
}

// ═════════════════════════════════════════════════════════════════════════════
// RECOMENDACIONES automáticas
// ═════════════════════════════════════════════════════════════════════════════
function generarRecomendaciones(inventario, hdd18) {
  if (!Array.isArray(inventario) || inventario.length === 0) return []

  const candidatos = inventario.map((item, idx) => {
    const pt = obtenerPT(item.ptId)
    if (!pt) return null
    const psiActual = pt.psi[item.calidad] ?? pt.psi.tipico
    const psiMejor  = pt.psi.mejor
    const delta = psiActual - psiMejor
    if (delta <= 0) return null  // ya está en "mejor"
    const ahorro = Math.round(delta * (item.longitud || 0) * hdd18 * 24 / 1000)
    if (ahorro <= 0) return null
    return {
      idx, ptId: item.ptId, ptNombre: pt.nombre,
      longitud: item.longitud,
      calidadActual: item.calidad,
      psiActual, psiMejor, ahorro,
    }
  }).filter(Boolean)

  // Ordenar descendente por ahorro y tomar top 3
  candidatos.sort((a, b) => b.ahorro - a.ahorro)
  return candidatos.slice(0, 3)
}

// ═════════════════════════════════════════════════════════════════════════════
// Hero + helpers
// ═════════════════════════════════════════════════════════════════════════════
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

function tituloComuna(key) {
  if (!key) return '—'
  return key.split('_').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')
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
