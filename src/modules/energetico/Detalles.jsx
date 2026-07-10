// ─────────────────────────────────────────────────────────────────────────────
// Detalles — Contenedor con sub-tabs:
//   🌉 Puentes Térmicos       (Ψ catalogados)
//   🪟 Ventanas Detalladas    (U combinado)
//   🚪 Puertas Detalladas     (U + RF + R'w + OGUC dimensiones)
//   💧 Higrotérmico (WUFI)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import PuentesTermicos     from './PuentesTermicos.jsx'
import VentanasDetalladas  from './VentanasDetalladas.jsx'
import PuertasDetalladas   from './PuertasDetalladas.jsx'
import Higrotermico        from './Higrotermico.jsx'
import PaywallGate         from './PaywallGate.jsx'

const SUB_TABS = [
  { id: 'pt',  label: '🌉 Puentes Térmicos',     color: '#7c3aed' },
  { id: 'vd',  label: '🪟 Ventanas Detalladas',  color: '#0d9488' },
  { id: 'pd',  label: '🚪 Puertas Detalladas',   color: '#b45309' },
  { id: 'hg',  label: '💧 Higrotérmico (WUFI)',  color: '#0e7490' },
]

export default function Detalles({ proy, calcUInit, perfil, inventarioPT, setInventarioPT }) {
  const [activeSub, setActiveSub] = useState('pt')

  return (
    <PaywallGate perfil={perfil} feature="Detalles: Puentes Térmicos + Ventanas">
      <div>
        {/* Sub-tab bar */}
        <div style={{
          display: 'flex', gap: 4, padding: '12px 28px 0',
          background: 'var(--bg-alt)', borderBottom: '1px solid var(--line)',
        }}>
          {SUB_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveSub(t.id)}
              style={{
                padding: '8px 16px', fontSize: 12, fontWeight: 700,
                border: 'none',
                borderBottom: `3px solid ${activeSub === t.id ? t.color : 'transparent'}`,
                background: 'transparent',
                color: activeSub === t.id ? 'var(--ink)' : 'var(--ink-3)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido del sub-tab */}
        <div>
          {activeSub === 'pt' && <PuentesTermicos     proy={proy} calcUInit={calcUInit} inventarioPT={inventarioPT} setInventarioPT={setInventarioPT} />}
          {activeSub === 'vd' && <VentanasDetalladas  proy={proy} />}
          {activeSub === 'pd' && <PuertasDetalladas   proy={proy} />}
          {activeSub === 'hg' && <Higrotermico        proy={proy} calcUInit={calcUInit} />}
        </div>
      </div>
    </PaywallGate>
  )
}
