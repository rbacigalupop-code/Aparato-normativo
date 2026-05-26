// ─────────────────────────────────────────────────────────────────────────────
// EnergeticoHome — Dashboard inicial del módulo Energético.
//
// Sprint 1: muestra el estado del proyecto + roadmap del módulo.
// Sprints siguientes irán completando cada tarjeta.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { labelPlan, estaEnTrial, diasRestantesTrial } from '../../lib/plan.js'
import AyudaEnergetico from './AyudaEnergetico.jsx'

const ROADMAP = [
  { id: 's1', sprint: 1, label: 'Configuración energética + Payback en correcciones', estado: 'completado' },
  { id: 's2', sprint: 2, label: 'Energías renovables (FV · Solar térmico · Bomba de calor)', estado: 'completado' },
  { id: 's3', sprint: 3, label: 'Demanda energética anual + Sobrecalentamiento verano', estado: 'completado' },
  { id: 's4', sprint: 4, label: 'Puentes térmicos catalogados (Ψ) + Ventanas detalladas', estado: 'completado' },
  { id: 's5', sprint: 5, label: 'Calculadora higrotérmica dinámica (inspirada WUFI) + Índice moho VTT', estado: 'activo' },
  { id: 's6', sprint: 6, label: 'Informe ejecutivo + CEV estimada + Comparativas', estado: 'proximo' },
]

export default function EnergeticoHome({ perfil, proy, onIrAConfig }) {
  const enTrial = estaEnTrial(perfil)
  const diasTrial = diasRestantesTrial(perfil)
  const hayConfig = !!proy?.configEnergetica?.combustibleCalef

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 32px', fontFamily: 'var(--font-body)' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent), var(--ink))',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '28px 36px',
        color: '#fff',
        marginBottom: 24,
      }}>
        <div style={{
          fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5,
          opacity: 0.85, marginBottom: 6,
        }}>
          Módulo Energético Avanzado · Plan {labelPlan(perfil)}
        </div>
        <h1 style={{
          margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.5,
          fontFamily: 'var(--font-display)',
          fontStyle: 'var(--display-italic, normal)',
        }}>
          Análisis energético, costos y descarbonización
        </h1>
        <p style={{ fontSize: 13, margin: '8px 0 0', maxWidth: 680, opacity: 0.92, lineHeight: 1.5 }}>
          Calcula la demanda anual, evalúa renovables, cuantifica el payback de cada mejora y
          genera informes ejecutivos para clientes, mandantes y oferentes.
        </p>

        {enTrial && (
          <div style={{
            marginTop: 16,
            display: 'inline-block',
            background: 'rgba(52,211,153,0.20)',
            border: '1px solid rgba(52,211,153,0.5)',
            borderRadius: 999, padding: '5px 14px',
            fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
          }}>
            🎁 Período de prueba — quedan {diasTrial} día{diasTrial === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {/* Guía de bienvenida */}
      <AyudaEnergetico
        icon="🚀"
        titulo="Módulo Energético Avanzado"
        intro="Este módulo va más allá del cumplimiento normativo OGUC: calcula la demanda energética anual del proyecto, evalúa renovables, cuantifica el ahorro de cada mejora y genera informes ejecutivos. Trabaja sobre los datos ya capturados en el módulo Normativo."
        pasos={[
          'Empieza en <b>⚙ Configuración</b>: define la <b>comuna</b> (de ahí se deriva la zona DS N°15 oficial y los grados-día) y el <b>combustible</b> real del cliente.',
          'En <b>📐 Cálculo U del módulo Normativo</b> aparecerán automáticamente los chips de <b>costo · ahorro · payback</b> sobre cada corrección propuesta.',
          'Ve a <b>📊 Demanda</b> para el balance térmico anual del proyecto completo: kWh/m²·año + calificación A+→G + análisis de sobrecalentamiento de verano.',
          'En <b>🌱 Renovables</b> dimensiona FV (Ley 21.118), solar térmico (Ley 20.365) y bomba de calor con COP corregido por clima local.',
        ]}
        origenDatos={[
          { campo: 'Zona DS N°15 y grados-día — derivados de la comuna que elijas en ⚙ Configuración', origen: 'energetico:configuracion' },
          { campo: 'Áreas y transmitancia U de la envolvente — desde tus cálculos del módulo Normativo', origen: 'normativo:calculo-u' },
          { campo: 'Áreas de ventanas por orientación — desde la pestaña Ventana del módulo Normativo', origen: 'normativo:ventana' },
          { campo: 'Superficie útil del proyecto — desde Diagnóstico del módulo Normativo', origen: 'normativo:diagnostico' },
        ]}
        normativa="ISO 13790 · CTE-HE simplificado · Ley 21.118 (Net-billing) · Ley 20.365 (Solar térmico SST)"
      />

      {/* Estado del proyecto actual */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: 'var(--ink)',
        }}>
          📊 Estado del proyecto
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <EstadoCard
            icon={hayConfig ? '✅' : '⚠'}
            titulo="Configuración energética"
            valor={hayConfig ? 'Lista' : 'Pendiente'}
            descripcion={hayConfig
              ? `Calefacción: ${proy?.configEnergetica?.combustibleCalef || '—'}`
              : 'Define combustibles y tarifas para activar el cálculo de payback'}
            onClick={onIrAConfig}
            cta={hayConfig ? 'Editar' : 'Configurar'}
          />
          <EstadoCard
            icon="📐"
            titulo="Datos normativos"
            valor={proy?.zona ? `Zona ${proy.zona}` : 'Sin zona'}
            descripcion={proy?.comuna ? `${proy.comuna}` : 'Define la comuna en Diagnóstico'}
          />
          <EstadoCard
            icon="🏗️"
            titulo="Cálculo U"
            valor="Disponible en Normativo"
            descripcion="El payback aparecerá automáticamente sobre cada corrección propuesta."
          />
        </div>
      </div>

      {/* Roadmap del módulo */}
      <div>
        <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
          🗺️ Roadmap del módulo
        </h2>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: 4,
        }}>
          {ROADMAP.map((item, i) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px',
              borderBottom: i < ROADMAP.length - 1 ? '1px solid var(--line-soft)' : 'none',
              background: item.estado === 'activo' ? 'var(--accent-bg)' : 'transparent',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: item.estado === 'completado' ? 'var(--ok)'
                          : item.estado === 'activo' ? 'var(--accent)' : 'var(--bg-alt)',
                color: item.estado === 'completado' || item.estado === 'activo' ? '#fff' : 'var(--ink-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
                fontFamily: 'var(--font-num)',
                flexShrink: 0,
              }}>
                {item.estado === 'completado' ? '✓' : item.sprint}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                  {item.estado === 'completado' && '✅ Completado'}
                  {item.estado === 'activo'     && '🟢 En desarrollo activo'}
                  {item.estado === 'proximo'    && '🟡 Próximo sprint'}
                  {item.estado === 'pendiente'  && '⚪ Programado'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EstadoCard({ icon, titulo, valor, descripcion, onClick, cta }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: 16,
    }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{
        fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8,
        color: 'var(--ink-3)', fontWeight: 600,
      }}>{titulo}</div>
      <div style={{
        fontSize: 18, fontWeight: 700, color: 'var(--ink)',
        margin: '4px 0', lineHeight: 1.2,
        fontFamily: 'var(--font-display)',
      }}>{valor}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>{descripcion}</div>
      {onClick && cta && (
        <button onClick={onClick} style={{
          marginTop: 10, padding: '5px 12px',
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
        }}>
          {cta} →
        </button>
      )}
    </div>
  )
}
