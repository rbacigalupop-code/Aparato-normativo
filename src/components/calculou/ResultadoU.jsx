// ResultadoU — panel lateral con el valor U total, comparación con U máx
// de la zona, y badge de cumplimiento (verde/rojo).
//
// Props:
//   uTotal : number   // W/m²K — transmitancia calculada
//   uMax   : number   // W/m²K — máximo permitido para la zona
//   zona   : string   // p.ej. "E"

import React from 'react'
import { IconCheck, IconX } from './icons.jsx'

export default function ResultadoU({ uTotal, uMax, zona }) {
  // Cumplimiento a 2 decimales: la U-máx del DS N°15 se especifica a 2 decimales
  // y el número grande se muestra a 2 decimales, así que la comparación usa la U
  // redondeada (0.602 → 0.60 ≤ 0.60 = cumple). Evita el "no cumple" al límite.
  const uRound = Math.round(uTotal * 100) / 100
  const cumple = uRound <= uMax + 1e-9
  const margen = ((1 - uRound / uMax) * 100)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: 22,
      fontFamily: 'var(--font-ui)',
    }}>
      <div style={{
        fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2,
        fontWeight: 600, color: 'var(--ink-3)', marginBottom: 10,
      }}>
        Resultado del cálculo
      </div>

      {/* Número grande */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontVariantNumeric: 'tabular-nums',
          fontStyle: 'var(--display-italic, normal)',
          fontSize: 48, fontWeight: 600,
          color: cumple ? 'var(--ink)' : 'var(--bad)',
          lineHeight: 1, letterSpacing: -1,
        }}>
          {Number(uTotal).toFixed(2)}
        </span>
        <span style={{
          fontFamily: 'var(--font-num)',
          fontSize: 13, color: 'var(--ink-3)',
        }}>
          W/m²K
        </span>
      </div>

      <div style={{
        fontFamily: 'var(--font-num)',
        fontVariantNumeric: 'tabular-nums',
        fontSize: 11, color: 'var(--ink-3)',
      }}>
        U máx Zona {zona} ≤ {Number(uMax).toFixed(2)} W/m²K
      </div>

      {/* Badge de cumplimiento */}
      <div style={{
        marginTop: 14, padding: '8px 12px',
        background: cumple ? 'var(--ok-bg)' : 'var(--bad-bg)',
        color: cumple ? 'var(--ok)' : 'var(--bad)',
        border: `1px solid ${cumple ? 'var(--ok)' : 'var(--bad)'}`,
        borderRadius: 8, fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {cumple ? <IconCheck size={14} /> : <IconX size={14} />}
        {cumple
          ? `Cumple — ${margen.toFixed(0)}% bajo el máximo`
          : `No cumple — ${Math.abs(margen).toFixed(0)}% sobre el máximo`}
      </div>
    </div>
  )
}
