// TablaCapas — editor de capas constructivas.
// Tabla con columnas: #, material, espesor (mm), λ (W/mK), R (m²K/W), eliminar.
// Si recibe onChange, los inputs son editables; en caso contrario son solo lectura.
// El cálculo de R por capa se hace localmente: R = (esp/1000) / λ.
//
// Props:
//   capas       : Array<{ n: string, esp: number, lam: number, R?: number, highlight?: boolean }>
//   onChange    : (nuevasCapas) => void        // opcional
//   onAddCapa   : () => void                   // opcional, muestra el botón "+ Capa"
//   onRemoveCapa: (index) => void              // opcional, muestra el botón de eliminar

import React from 'react'
import { IconPlus, IconX } from './icons.jsx'

export default function TablaCapas({ capas, onChange, onAddCapa, onRemoveCapa }) {
  const totalE = capas.reduce((s, c) => s + (Number(c.esp) || 0), 0)
  const editable = typeof onChange === 'function'

  const updateCapa = (i, key, value) => {
    if (!editable) return
    const next = capas.map((c, idx) => idx === i ? { ...c, [key]: value } : c)
    onChange(next)
  }

  const Rcalc = (c) => {
    const lam = Number(c.lam) || 0.04
    return (Number(c.esp || 0) / 1000) / lam
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg, 12px)',
      overflow: 'hidden',
      fontFamily: 'var(--font-ui)',
    }}>
      {/* Encabezado del bloque */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--line)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg-alt)',
      }}>
        <div>
          <div style={{
            fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2,
            fontWeight: 600, color: 'var(--ink-3)',
          }}>
            Editor de capas
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            Orden interior → exterior · Espesor total{' '}
            <span style={{
              fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums',
              fontWeight: 500, color: 'var(--ink-2)',
            }}>
              {totalE} mm
            </span>
          </div>
        </div>

        {onAddCapa && (
          <button
            type="button"
            onClick={onAddCapa}
            style={{
              padding: '6px 10px', fontSize: 11, fontWeight: 500,
              background: 'var(--ink)', color: 'var(--bg)',
              border: '1px solid var(--ink)', borderRadius: 6,
              cursor: 'pointer', fontFamily: 'var(--font-ui)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
          >
            <IconPlus size={11} /> Capa
          </button>
        )}
      </div>

      {/* Encabezados de columna */}
      <div style={{
        padding: '8px 16px',
        display: 'grid',
        gridTemplateColumns: '20px 1fr 80px 80px 70px 32px',
        gap: 10, alignItems: 'center',
        fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6,
        fontWeight: 600, color: 'var(--ink-3)',
        borderBottom: '1px solid var(--line)',
      }}>
        <span></span>
        <span>Material</span>
        <span style={{ textAlign: 'right' }}>Espesor (mm)</span>
        <span style={{ textAlign: 'right' }}>λ (W/mK)</span>
        <span style={{ textAlign: 'right' }}>R (m²K/W)</span>
        <span></span>
      </div>

      {/* Filas */}
      {capas.map((c, i) => (
        <div key={i} style={{
          padding: '8px 16px',
          display: 'grid',
          gridTemplateColumns: '20px 1fr 80px 80px 70px 32px',
          gap: 10, alignItems: 'center',
          borderBottom: i < capas.length - 1 ? '1px solid var(--line-soft)' : 'none',
          background: c.highlight ? 'var(--accent-bg)' : 'transparent',
        }}>
          <span style={{
            color: 'var(--ink-3)',
            fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums',
          }}>
            {i + 1}
          </span>

          <input
            value={c.n}
            readOnly={!editable}
            onChange={editable ? (e) => updateCapa(i, 'n', e.target.value) : undefined}
            style={{
              padding: '5px 8px', fontSize: 12,
              border: '1px solid transparent', background: 'transparent',
              fontFamily: 'inherit', color: 'var(--ink)', width: '100%',
            }}
          />

          <input
            value={c.esp}
            readOnly={!editable}
            onChange={editable ? (e) => updateCapa(i, 'esp', Number(e.target.value) || 0) : undefined}
            style={{
              padding: '5px 8px', fontSize: 12, textAlign: 'right',
              border: '1px solid transparent', background: 'transparent',
              fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums',
              color: 'var(--ink)', width: '100%',
            }}
          />

          <span style={{
            fontSize: 11, color: 'var(--ink-3)', textAlign: 'right',
            fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums',
          }}>
            {(Number(c.lam) || 0.04).toFixed(3)}
          </span>

          <span style={{
            fontSize: 11, color: 'var(--ink-2)', textAlign: 'right', fontWeight: 500,
            fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums',
          }}>
            {(c.R != null ? Number(c.R) : Rcalc(c)).toFixed(2)}
          </span>

          {onRemoveCapa ? (
            <button
              type="button"
              onClick={() => onRemoveCapa(i)}
              aria-label={`Eliminar capa ${i + 1}`}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--ink-3)', padding: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconX size={12} />
            </button>
          ) : <span />}
        </div>
      ))}
    </div>
  )
}
