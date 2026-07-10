// ─────────────────────────────────────────────────────────────────────────────
// AyudaEnergetico — Panel de guía contextual para cada pestaña Pro.
//
// Tiene 4 secciones, cualquiera opcional:
//   1. Intro (descripción de qué hace la pestaña)
//   2. Pasos de uso recomendados
//   3. Origen de los datos (qué viene del módulo Normativo)
//   4. Marco normativo / referencias técnicas
//
// Props:
//   icon, titulo, intro, pasos, origenDatos, normativa, defaultOpen
//
// origenDatos: array de { campo, origen }
//   origen puede ser: 'normativo:diagnostico', 'normativo:calculo-u',
//                     'normativo:ventana', 'energetico:configuracion',
//                     'energetico:proyecto', 'usuario'
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'

const ORIGEN_LABELS = {
  'normativo:diagnostico':   { label: 'Diagnóstico',   color: '#0e6560', modulo: 'Normativo' },
  'normativo:calculo-u':     { label: 'Cálculo U',     color: '#0f766e', modulo: 'Normativo' },
  'normativo:ventana':       { label: 'Ventana',       color: '#7c3aed', modulo: 'Normativo' },
  'normativo:soluciones':    { label: 'Soluciones',    color: '#166534', modulo: 'Normativo' },
  'energetico:configuracion':{ label: 'Configuración', color: '#ea580c', modulo: 'Energético' },
  'energetico:proyecto':     { label: 'Proyecto',      color: '#64748b', modulo: 'Proyecto' },
  'usuario':                 { label: 'Tú',            color: '#475569', modulo: 'Input directo' },
  'auto':                    { label: 'Auto',          color: '#0d9488', modulo: 'Calculado' },
}

export default function AyudaEnergetico({
  icon = '💡',
  titulo,
  intro,
  pasos = [],
  origenDatos = [],
  normativa,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-lg, 12px)',
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Header colapsable */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'var(--accent-bg)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textAlign: 'left',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
            Cómo usar — {titulo}
          </div>
          {intro && !open && (
            <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.4 }}>
              {intro.length > 110 ? intro.slice(0, 110) + '…' : intro}
            </div>
          )}
        </div>
        <span style={{ fontSize: 14, color: 'var(--accent)', transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          ▾
        </span>
      </button>

      {/* Cuerpo */}
      {open && (
        <div style={{ padding: '14px 18px', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          {intro && (
            <p style={{ margin: '0 0 12px', color: 'var(--ink)' }}>
              {intro}
            </p>
          )}

          {pasos.length > 0 && (
            <div style={{ marginBottom: origenDatos.length > 0 || normativa ? 14 : 0 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.1, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 6 }}>
                📋 Pasos recomendados
              </div>
              <ol style={{ margin: 0, paddingLeft: 22, color: 'var(--ink-2)' }}>
                {pasos.map((p, i) => (
                  <li key={i} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </ol>
            </div>
          )}

          {origenDatos.length > 0 && (
            <div style={{ marginBottom: normativa ? 14 : 0 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.1, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 6 }}>
                🔗 De dónde vienen los datos
              </div>
              <div style={{
                background: 'var(--bg-alt)',
                border: '1px solid var(--line-soft)',
                borderRadius: 8,
                padding: '10px 12px',
              }}>
                {origenDatos.map((d, i) => {
                  const meta = ORIGEN_LABELS[d.origen] || ORIGEN_LABELS.auto
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '4px 0',
                      borderTop: i > 0 ? '1px dashed var(--line-soft)' : 'none',
                    }}>
                      <BadgeOrigen origen={d.origen} small />
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--ink-2)' }}>
                        {d.campo}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 6, fontStyle: 'italic' }}>
                El análisis Pro se nutre del módulo Normativo. Si los datos están incompletos,
                completa primero las pestañas del verificador OGUC.
              </div>
            </div>
          )}

          {normativa && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.1, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 6 }}>
                📜 Marco normativo
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-2)', fontStyle: 'italic' }}>
                {normativa}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── BadgeOrigen — chip pequeño "↩ Cálculo U" ────────────────────────────────
// Reutilizable inline para marcar de dónde viene un dato puntual.
export function BadgeOrigen({ origen, small = false, label = null }) {
  const meta = ORIGEN_LABELS[origen] || ORIGEN_LABELS.auto
  const txt = label || meta.label
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: small ? '1px 6px' : '2px 8px',
      borderRadius: 99,
      background: `${meta.color}18`,
      color: meta.color,
      fontSize: small ? 9 : 10,
      fontWeight: 700,
      letterSpacing: 0.3,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      border: `1px solid ${meta.color}40`,
    }}>
      <span style={{ fontSize: small ? 8 : 9 }}>↩</span>
      {txt}
    </span>
  )
}
