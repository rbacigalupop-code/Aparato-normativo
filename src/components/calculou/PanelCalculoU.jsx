// PanelCalculoU — módulo completo de "Cálculo de transmitancia U".
// Compone: TablaCapas (editor) + CurvaGlaser (gráfico) + ResultadoU (sidebar) + DesgloseR (sidebar).
//
// Props:
//   capas        : Array<{ n, esp, lam, R?, highlight? }>
//   uTotal       : number
//   uMax         : number
//   zona         : string          // p.ej. "E"
//   rsi          : number          // p.ej. 0.130
//   rse          : number          // p.ej. 0.040
//   presionReal  : number[]
//   presionSat   : number[]
//   temperaturas : number[]
//   condensacion : boolean
//   onChangeCapas: (capas) => void // opcional, hace la tabla editable
//   onAddCapa    : () => void      // opcional
//   onRemoveCapa : (i) => void     // opcional
//
// Si no recibe onChangeCapas, la tabla se renderiza en modo lectura.

import React from 'react'
import TablaCapas from './TablaCapas.jsx'
import ResultadoU from './ResultadoU.jsx'
import DesgloseR from './DesgloseR.jsx'
import CurvaGlaser from './CurvaGlaser.jsx'

export default function PanelCalculoU({
  capas,
  uTotal,
  uMax,
  zona,
  rsi,
  rse,
  presionReal,
  presionSat,
  temperaturas,
  condensacion,
  onChangeCapas,
  onAddCapa,
  onRemoveCapa,
}) {
  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto', padding: '24px 32px 56px',
      fontFamily: 'var(--font-body)',
      color: 'var(--ink)',
      background: 'var(--bg)',
    }}>
      {/* Header de la página */}
      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2,
          fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6,
        }}>
          Etapa 06 · Cálculo U + Glaser
        </div>
        <h1 style={{
          margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: -0.5,
          fontFamily: 'var(--font-display)',
          fontStyle: 'var(--display-italic, normal)',
          color: 'var(--ink)',
        }}>
          Verificación térmica detallada
        </h1>
        <p style={{
          fontSize: 13, color: 'var(--ink-2)', marginTop: 6,
          maxWidth: 580, lineHeight: 1.5,
        }}>
          Cálculo de transmitancia U según ISO 6946 y análisis de condensación
          intersticial (método Glaser). Verifica capa por capa el cumplimiento térmico.
        </p>
      </div>

      {/* Grid principal: izquierda (tabla + glaser) · derecha (resultado + desglose) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>
        <div>
          <TablaCapas
            capas={capas}
            onChange={onChangeCapas}
            onAddCapa={onAddCapa}
            onRemoveCapa={onRemoveCapa}
          />

          <div style={{ marginTop: 16 }}>
            <CurvaGlaser
              capas={capas}
              presionReal={presionReal}
              presionSat={presionSat}
              temperaturas={temperaturas}
              condensacion={condensacion}
            />
          </div>
        </div>

        <aside style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
          <ResultadoU uTotal={uTotal} uMax={uMax} zona={zona} />
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: 22, marginTop: 14,
          }}>
            <DesgloseR capas={capas} rsi={rsi} rse={rse} />
          </div>
        </aside>
      </div>
    </div>
  )
}
