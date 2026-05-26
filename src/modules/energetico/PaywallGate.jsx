// ─────────────────────────────────────────────────────────────────────────────
// PaywallGate — Envuelve secciones Pro. Si el usuario no es Pro, muestra una
// pantalla con CTA para que pida acceso a su admin.
//
// Props:
//   perfil    : el perfil del usuario
//   feature   : string descriptivo (p.ej. "Solar fotovoltaico")
//   children  : el contenido normal (se muestra si es Pro)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { isPro, labelPlan } from '../../lib/plan.js'

export default function PaywallGate({ perfil, feature = 'Esta sección', children }) {
  if (isPro(perfil)) return children

  return (
    <div style={{
      maxWidth: 640, margin: '40px auto', padding: 0,
      fontFamily: 'var(--font-ui)',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '32px 36px',
        textAlign: 'center',
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>

        <h2 style={{
          margin: '0 0 8px',
          fontSize: 22, fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--ink)',
        }}>
          {feature} es parte del plan Pro
        </h2>

        <p style={{
          margin: '0 0 24px',
          fontSize: 13, lineHeight: 1.6,
          color: 'var(--ink-2)',
        }}>
          El módulo Energético Avanzado incluye análisis de demanda anual,
          payback en correcciones, energías renovables (FV, solar térmico,
          bomba de calor), calificación CEV estimada e informe ejecutivo
          para clientes.
        </p>

        {/* Plan actual */}
        <div style={{
          display: 'inline-block',
          background: 'var(--bg-alt)',
          border: '1px solid var(--line)',
          borderRadius: 999,
          padding: '5px 14px',
          fontSize: 11, color: 'var(--ink-2)',
          marginBottom: 20,
        }}>
          Tu plan actual: <b style={{ color: 'var(--ink)' }}>{labelPlan(perfil)}</b>
        </div>

        {/* Beneficios */}
        <div style={{
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent)',
          borderRadius: 8,
          padding: '14px 16px',
          marginBottom: 20,
          textAlign: 'left',
          fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.8,
        }}>
          <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 6, textAlign: 'center' }}>
            Con el plan Pro accedes a:
          </div>
          ✅ Demanda energética anual (kWh/m²·año)<br/>
          ✅ Costo de intervención y payback en cada corrección<br/>
          ✅ Dimensionamiento de Solar FV (Net-billing Ley 21.118)<br/>
          ✅ Solar térmico con franquicia tributaria Ley 20.365<br/>
          ✅ Bomba de calor con COP corregido por clima<br/>
          ✅ Calificación CEV estimada<br/>
          ✅ Informe ejecutivo para clientes / mandantes / oferentes
        </div>

        <div style={{
          fontSize: 12, color: 'var(--ink-3)',
          background: 'var(--bg-alt)', borderRadius: 6, padding: '10px 14px',
        }}>
          💬 Solicita acceso al administrador de tu organización
          para activar una prueba gratuita.
        </div>
      </div>
    </div>
  )
}
