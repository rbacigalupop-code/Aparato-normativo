// ─────────────────────────────────────────────────────────────────────────────
// Renovables — Contenedor del módulo de Energías Renovables.
// Sub-tabs: Solar FV / Solar Térmico / Bomba de Calor.
// Va envuelto en PaywallGate (es feature Pro).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import SolarFV       from './SolarFV.jsx'
import SolarTermico  from './SolarTermico.jsx'
import BombaCalor    from './BombaCalor.jsx'
import PaywallGate   from './PaywallGate.jsx'

const SUB_TABS = [
  { id: 'fv',     label: '☀️ Solar FV',          color: '#f59e0b' },
  { id: 'st',     label: '♨️ Solar Térmico',      color: '#ea580c' },
  { id: 'bdc',    label: '🌡️ Bomba de Calor',    color: '#0891b2' },
]

export default function Renovables({ proy, calcUInit, perfil }) {
  const [activeSub, setActiveSub] = useState('fv')

  return (
    <PaywallGate perfil={perfil} feature="Energías Renovables">
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
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido del sub-tab */}
        <div>
          {activeSub === 'fv'  && <SolarFV       proy={proy} />}
          {activeSub === 'st'  && <SolarTermico  proy={proy} />}
          {activeSub === 'bdc' && <BombaCalor    proy={proy} calcUInit={calcUInit} />}
        </div>
      </div>
    </PaywallGate>
  )
}
