// ─────────────────────────────────────────────────────────────────────────────
// ModeSwitcher — Toggle entre el módulo Normativo (gratis) y Energético (Pro).
//
// Se ubica en el header de la app. Cuando el usuario clickea "Energético",
// si no tiene plan Pro/Trial, igualmente entra al módulo pero verá paywalls
// internos en las secciones avanzadas (FV, BdC, CEV, etc.).
//
// Props:
//   mode       : 'normativo' | 'energetico'
//   onChange   : (newMode) => void
//   perfil     : el perfil del usuario (para chequear plan)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { isPro, labelPlan, estaEnTrial } from '../lib/plan.js'

export default function ModeSwitcher({ mode, onChange, perfil }) {
  const pro = isPro(perfil)
  const enTrial = estaEnTrial(perfil)

  const btnBase = {
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }
  const btnActive = {
    ...btnBase,
    background: 'rgba(255,255,255,0.95)',
    color: '#0e6560',
    borderColor: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
  }

  return (
    <div style={{
      display: 'inline-flex', gap: 4,
      background: 'rgba(0,0,0,0.18)',
      borderRadius: 8, padding: 3,
    }}>
      <button
        type="button"
        onClick={() => onChange('normativo')}
        style={mode === 'normativo' ? btnActive : btnBase}
        title="Verificador normativo (OGUC, DS N°15, NCh)"
      >
        📐 Normativo
      </button>
      <button
        type="button"
        onClick={() => onChange('energetico')}
        style={mode === 'energetico' ? btnActive : btnBase}
        title={pro ? 'Análisis energético avanzado' : 'Pestaña Pro — algunas secciones requieren upgrade'}
      >
        ⚡ Energético
        {!pro && (
          <span style={{
            fontSize: 9, fontWeight: 800, background: '#fbbf24', color: '#78350f',
            padding: '1px 5px', borderRadius: 3, marginLeft: 2, letterSpacing: 0.3,
          }}>PRO</span>
        )}
        {enTrial && (
          <span style={{
            fontSize: 9, fontWeight: 800, background: '#34d399', color: '#064e3b',
            padding: '1px 5px', borderRadius: 3, marginLeft: 2,
          }}>TRIAL</span>
        )}
      </button>
    </div>
  )
}
