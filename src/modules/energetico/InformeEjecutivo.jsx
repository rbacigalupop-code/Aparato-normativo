// ─────────────────────────────────────────────────────────────────────────────
// InformeEjecutivo — Dashboard agregado del módulo + export PDF para cliente.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react'
import { agregarInforme } from '../../lib/engines/informe_agregador.js'
import { ESCALA_CEV, BENCHMARKS_CHILE } from '../../data/cev_chile.js'
import { exportarPDFEjecutivo } from './exportarPDFEjecutivo.js'
import AyudaEnergetico, { BadgeOrigen } from './AyudaEnergetico.jsx'

export default function InformeEjecutivo({ proy, calcUInit, fachadas }) {
  const [personas, setPersonas]     = useState(4)
  const [valorUF, setValorUF]       = useState(1800)
  const [consumoElec, setConsumoElec] = useState(4200)
  const [exportando, setExportando] = useState(false)

  const informe = useMemo(() => agregarInforme({
    proy, calcUInit, fachadas, personas, valorUF, consumoElecAnual: consumoElec,
  }), [proy, calcUInit, fachadas, personas, valorUF, consumoElec])

  async function handleExport() {
    setExportando(true)
    try {
      const nombre = `informe-ejecutivo-${(proy?.nombre || 'proyecto').replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`
      await exportarPDFEjecutivo(informe, nombre)
    } catch (e) {
      console.error('Error exportando PDF:', e)
      alert('Error al generar el PDF: ' + e.message)
    } finally {
      setExportando(false)
    }
  }

  const cev = informe.cev
  const cevProy = informe.cevProyectada
  const recs = informe.recomendaciones.slice(0, 5)
  const totalInversion = recs.reduce((s, r) => s + (r.costoClp || 0), 0)
  const totalAhorro    = recs.reduce((s, r) => s + (r.ahorroClpAnio || 0), 0)

  // Payback acotado: sobre la vida útil (~30 años) el retorno por ahorro deja de
  // ser relevante (la construcción no dura tanto). En vez de un número absurdo
  // (>100 años) se muestra "> 30" — la inversión igual se justifica por confort,
  // salud y cumplimiento (obligatorio / exigencia PDA).
  const UMBRAL_PAYBACK = 30
  const fmtPayback = p =>
    p == null ? { val: '—', muted: true, sinRetorno: false }
    : p > UMBRAL_PAYBACK ? { val: `> ${UMBRAL_PAYBACK}`, muted: true, sinRetorno: true }
    : { val: p, muted: false, sinRetorno: false }
  const globalPay = totalAhorro > 0 ? totalInversion / totalAhorro : null
  const hayLargos = recs.some(r => r.payback != null && r.payback > UMBRAL_PAYBACK)

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>

      {/* Hero con CEV */}
      <div style={{
        background: `linear-gradient(135deg, ${cev.color}, #1e293b)`,
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '24px 32px', color: '#fff', marginBottom: 16,
        display: 'grid', gridTemplateColumns: '120px 1fr', gap: 22, alignItems: 'center',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.16)',
          border: '2px solid rgba(255,255,255,0.5)',
          borderRadius: 12, padding: 14, textAlign: 'center',
        }}>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1, letterSpacing: -2, fontFamily: 'var(--font-display)' }}>
            {cev.letra}
          </div>
          <div style={{ fontSize: 9, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
            CEV estimada
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.85, marginBottom: 4 }}>
            Informe Ejecutivo · {informe.proyecto.nombre}
          </div>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.5,
            fontFamily: 'var(--font-display)',
          }}>
            {cev.demandaOriginal} kWh/m²·año
          </h1>
          <p style={{ fontSize: 13, margin: '6px 0 0', opacity: 0.92 }}>
            {cev.descripcion}
          </p>
        </div>
      </div>

      <AyudaEnergetico
        icon="📑"
        titulo="Informe Ejecutivo + CEV estimada"
        intro="Esta pestaña agrega TODOS los análisis del módulo Pro en un solo dashboard listo para presentar a un cliente, mandante u oferente. Calcula la CEV estimada (A+→G) y permite exportar un PDF elegante distinto al informe DOM técnico."
        pasos={[
          'Ajusta los <b>parámetros del hogar</b>: nº personas, valor UF de la vivienda, consumo eléctrico anual.',
          'Revisa la <b>letra CEV estimada</b> de tu proyecto y compárala contra benchmarks chilenos (Casa Pasiva, Promedio CL, Vivienda social).',
          'Mira las <b>5 mejores recomendaciones</b> ordenadas por payback — son las inversiones con mejor relación impacto/costo.',
          'Exporta el <b>PDF ejecutivo</b> con un solo clic. Diseñado para presentar a clientes, no a la DOM.',
        ]}
        origenDatos={[
          { campo: 'Demanda térmica anual — desde balance ISO 13790', origen: 'auto' },
          { campo: 'Áreas y U — desde Cálculo U del Normativo', origen: 'normativo:calculo-u' },
          { campo: 'Ventanas por orientación — desde Ventana del Normativo', origen: 'normativo:ventana' },
          { campo: 'Tarifa eléctrica + combustible — desde Configuración', origen: 'energetico:configuracion' },
          { campo: 'Solar FV, Solar térmico y BdC — análisis paralelos del Sprint 2', origen: 'auto' },
          { campo: 'Parámetros del hogar (personas, UF, consumo) — los defines tú', origen: 'usuario' },
        ]}
        normativa="DS N°50/2018 RT-CEV (referencial) · CCTE_CL MINVU para certificación oficial"
      />

      {/* Configuración del hogar */}
      <Card titulo="🏠 Parámetros del hogar">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Field label="Nº personas residentes">
            <input type="number" min={1} max={20} value={personas} onChange={e => setPersonas(Number(e.target.value) || 1)} style={inputStyle} />
          </Field>
          <Field label="Valor vivienda (UF)">
            <input type="number" min={500} max={10000} step={100} value={valorUF} onChange={e => setValorUF(Number(e.target.value) || 0)} style={inputStyle} />
          </Field>
          <Field label="Consumo eléctrico anual (kWh)">
            <input type="number" min={500} max={50000} step={100} value={consumoElec} onChange={e => setConsumoElec(Number(e.target.value) || 0)} style={inputStyle} />
          </Field>
        </div>
      </Card>

      {/* Comparativas */}
      <Card titulo="📊 Tu proyecto vs benchmarks chilenos">
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 10 }}>
          Posición de <b style={{ color: 'var(--ink)' }}>{informe.balance.kwhM2Anio} kWh/m²·año</b> en la distribución chilena
          (mejor que el <b style={{ color: 'var(--ink)' }}>{cev.percentilChile}%</b> de las viviendas).
        </div>
        {informe.comparativas.map(b => {
          const max = 250
          const pctTuyo = Math.min(100, (b.tuValor / max) * 100)
          const pctBench = Math.min(100, (b.valor / max) * 100)
          return (
            <div key={b.id} style={{
              display: 'grid', gridTemplateColumns: '160px 1fr 80px', gap: 8,
              alignItems: 'center', fontSize: 11, marginBottom: 4,
            }}>
              <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{b.label}</span>
              <div style={{ background: 'var(--bg-alt)', height: 18, borderRadius: 4, position: 'relative' }}>
                <div style={{
                  height: '100%', width: `${pctBench}%`, background: b.color, opacity: 0.5, borderRadius: 4,
                }} />
                <div style={{
                  position: 'absolute', left: `calc(${pctTuyo}% - 2px)`, top: -3, bottom: -3,
                  width: 4, background: 'var(--ink)', borderRadius: 2,
                }} title="Tu proyecto" />
              </div>
              <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, color: b.color, textAlign: 'right' }}>
                {b.valor} kWh
              </span>
            </div>
          )
        })}
      </Card>

      {/* Plan de acción */}
      <Card titulo={`🎯 Plan de acción priorizado (top ${recs.length})`}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12 }}>
          Si aplicas estas mejoras, tu CEV pasaría de <b style={{ color: cev.color }}>{cev.letra}</b> a{' '}
          <b style={{ color: cevProy.color }}>{cevProy.letra}</b> (reducción aprox. {informe.mejoraDemanda}% de demanda).
        </div>
        {recs.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '32px 1fr 160px 80px',
            gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--line-soft)',
            alignItems: 'center',
          }}>
            <div style={{
              background: 'var(--accent)', color: '#fff',
              borderRadius: '50%', width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13,
            }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{r.titulo}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{r.impacto}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-num)', fontSize: 11 }}>
              <div style={{ color: 'var(--bad)' }}>Inv: CLP {(r.costoClp || 0).toLocaleString('es-CL')}</div>
              <div style={{ color: 'var(--ok)', fontWeight: 700, marginTop: 2 }}>
                Ahorro: CLP {(r.ahorroClpAnio || 0).toLocaleString('es-CL')}/año
              </div>
            </div>
            <div style={{
              background: 'var(--bg-alt)', padding: '6px 4px', borderRadius: 6, textAlign: 'center',
            }}>
              {(() => {
                const f = fmtPayback(r.payback)
                return <>
                  <div style={{ fontSize: f.muted ? 14 : 18, fontWeight: 800, color: f.muted ? 'var(--ink-3)' : 'var(--accent)', lineHeight: 1 }}>
                    {f.val}
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                    {f.sinRetorno ? 'años · no se recupera' : 'años payback'}
                  </div>
                </>
              })()}
            </div>
          </div>
        ))}

        {/* Totales del plan */}
        <div style={{
          marginTop: 14, padding: '12px 18px',
          background: 'linear-gradient(135deg, var(--ok-bg), var(--surface))',
          border: '2px solid var(--ok)', borderRadius: 8,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
          textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Inversión total</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ok)' }}>CLP {totalInversion.toLocaleString('es-CL')}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Ahorro anual</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ok)' }}>CLP {totalAhorro.toLocaleString('es-CL')}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Payback promedio</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: globalPay != null && globalPay > UMBRAL_PAYBACK ? 'var(--ink-3)' : 'var(--ok)' }}>
              {globalPay == null ? '—' : globalPay > UMBRAL_PAYBACK ? `> ${UMBRAL_PAYBACK} años` : `${globalPay.toFixed(1)} años`}
            </div>
          </div>
        </div>
        {hayLargos && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5, fontStyle: 'italic' }}>
            Las mejoras marcadas <b>"no se recupera"</b> tienen un retorno por ahorro energético superior a la vida útil ({UMBRAL_PAYBACK} años) — habitual en climas templados o energía barata. Su justificación no es económica sino de <b>confort térmico, salud (menos humedad/moho) y cumplimiento normativo</b> (obligatorio en obra nueva, exigido por el PDA en reacondicionamiento).
          </div>
        )}
      </Card>

      {/* Impacto ambiental */}
      <Card titulo="🌱 Impacto ambiental proyectado">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <KPI label="Emisiones actuales" value={`${(informe.emisiones.total / 1000).toFixed(1)} t CO₂/año`} color="var(--bad)" />
          <KPI label="Evitadas con plan" value={`${Math.round(informe.emisiones.total * informe.mejoraDemanda / 100)} kg CO₂/año`} color="var(--ok)" />
          <KPI label="Acumulado 30 años" value={`${(informe.emisiones.total * informe.mejoraDemanda / 100 * 30 / 1000).toFixed(1)} t CO₂`} color="var(--ok)" />
          <KPI label="Equivalente a" value={`${Math.round(informe.emisiones.total * informe.mejoraDemanda / 100 * 30 / 22)} árboles`} color="var(--ok)" sub="plantados al año" />
        </div>
      </Card>

      {/* Botón export PDF */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button
          onClick={handleExport}
          disabled={exportando}
          style={{
            padding: '14px 40px', fontSize: 14, fontWeight: 700,
            background: exportando ? 'var(--ink-3)' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 8,
            cursor: exportando ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--shadow)',
          }}
        >
          {exportando ? '⏳ Generando PDF...' : '📄 Exportar Informe Ejecutivo (PDF)'}
        </button>
      </div>

      <p style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', marginTop: 16, fontStyle: 'italic', lineHeight: 1.5 }}>
        Informe referencial generado el {new Date().toLocaleDateString('es-CL')}.
        Para certificación CEV oficial requiere evaluador acreditado MINVU con CCTE_CL.
        Sin embargo, los rangos y prioridades son válidos para decisiones de diseño y de inversión.
      </p>
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
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

function KPI({ label, value, sub, color }) {
  return (
    <div>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1.1, marginTop: 3 }}>{value}</div>
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
