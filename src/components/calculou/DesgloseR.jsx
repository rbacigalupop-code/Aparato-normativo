// DesgloseR — tabla compacta con la resistencia térmica de cada capa,
// más Rsi (interior) y Rse (exterior), y la suma R total.
//
// Props:
//   capas : Array<{ n: string, esp: number, lam: number, R?: number, highlight?: boolean }>
//   rsi   : number   // m²K/W — resistencia superficial interior
//   rse   : number   // m²K/W — resistencia superficial exterior

import React from 'react'

function Rcapa(c) {
  if (c.R != null) return Number(c.R)
  const lam = Number(c.lam) || 0.04
  return (Number(c.esp || 0) / 1000) / lam
}

export default function DesgloseR({ capas, rsi, rse }) {
  const filas = [
    { lab: 'Rsi (interior)', val: rsi },
    ...capas.map((c) => ({ lab: c.n, val: Rcapa(c), highlight: c.highlight })),
    { lab: 'Rse (exterior)', val: rse },
  ]
  const Rt = filas.reduce((s, f) => s + Number(f.val || 0), 0)

  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      <div style={{
        fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.2,
        fontWeight: 600, color: 'var(--ink-3)', marginBottom: 10,
      }}>
        Desglose de R
      </div>

      {filas.map((r, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '5px 0', fontSize: 11,
        }}>
          <span style={{
            color: r.highlight ? 'var(--accent)' : 'var(--ink-2)',
            fontWeight: r.highlight ? 600 : 400,
          }}>
            {r.lab}
          </span>
          <span style={{
            fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums',
            fontWeight: 500,
            color: r.highlight ? 'var(--accent)' : 'var(--ink)',
          }}>
            {Number(r.val).toFixed(3)}
          </span>
        </div>
      ))}

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '8px 0 0', marginTop: 6,
        borderTop: '1px solid var(--line)',
        fontSize: 12, fontWeight: 600,
      }}>
        <span style={{ color: 'var(--ink)' }}>R total</span>
        <span style={{
          fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums',
          color: 'var(--ink)',
        }}>
          {Rt.toFixed(3)} m²K/W
        </span>
      </div>
    </div>
  )
}
