import React, { useState, useLayoutEffect, useCallback } from 'react'

// ─── Tour guiado de primera vez ────────────────────────────────────────────────
// Recorrido de onboarding que orienta sobre el FLUJO de la app (las pestañas son
// un pipeline de izquierda a derecha). En cada paso cambia la pestaña activa vía
// onIrATab() y resalta el botón correspondiente con un "spotlight". Es saltable y
// el estado "ya visto" lo persiste App.jsx en localStorage.
//
// El resaltado ancla al botón de pestaña por su atributo [data-tab-idx=N]
// (ver App.jsx, TABS.map). getBoundingClientRect funciona aunque las pestañas se
// envuelvan en varias filas (responsive).

const PASOS = [
  {
    tab: null,
    titulo: '👋 Bienvenido a Talora',
    cuerpo: 'Talora verifica tu proyecto contra la norma chilena (OGUC, DS N°15, LOSCAT). Las pestañas de arriba son un flujo: avanzas de izquierda a derecha. Te muestro el recorrido en menos de un minuto.',
  },
  {
    tab: 0,
    titulo: '1 · Diagnóstico — el punto de partida',
    cuerpo: 'Defines comuna, uso, N° de pisos y superficie. De aquí Talora deduce tu zona térmica y las exigencias que debes cumplir (U máximo, resistencia al fuego). Todo lo demás parte de esto.',
  },
  {
    tab: 1,
    titulo: '2 · Soluciones constructivas',
    cuerpo: 'Eliges del catálogo los constructivos de muro, techo y piso. Puedes filtrar por sistema estructural (albañilería, madera, metalcon…). Lo que apliques aquí alimenta las verificaciones.',
  },
  {
    tab: 2,
    titulo: '3 a 5 · Verificaciones normativas',
    cuerpo: 'Tres pestañas contrastan tus soluciones con la norma: Térmica (transmitancia vs U máximo), Fuego (resistencia al fuego RF según OGUC) y Acústica (aislamiento según LOSCAT). Verde = cumple, rojo = no cumple.',
  },
  {
    tab: 5,
    titulo: '6 · Calculadora U — el corazón de Talora',
    cuerpo: 'La herramienta más potente: recalcula la transmitancia capa por capa, detecta condensación intersticial (Glaser) y aplica correcciones por puentes térmicos. Es lo que hace que el cálculo sea defendible ante la DOM, no solo un valor de catálogo.',
  },
  {
    tab: 9,
    titulo: '10 · Resultados e informe',
    cuerpo: 'El resumen consolida todo y te permite exportar el informe en PDF o Excel, listo para presentar ante la DOM.',
  },
  {
    tab: null,
    titulo: '¿Y si me pierdo después?',
    cuerpo: 'Cada pestaña tiene su panel «Cómo usar» (botón ℹ arriba a la derecha). Y puedes reabrir este tour cuando quieras con el botón 🧭 Tour. ¡Listo para empezar!',
  },
]

function rectDeTab(idx) {
  if (idx == null) return null
  try {
    const el = document.querySelector(`.nc-tabs button[data-tab-idx="${idx}"]`)
    if (!el) return null
    const r = el.getBoundingClientRect()
    if (!r.width && !r.height) return null
    return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom }
  } catch {
    return null
  }
}

export default function TourGuiado({ onIrATab, onCerrar }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const paso = PASOS[i]
  const esUltimo = i === PASOS.length - 1

  // Cambia la pestaña activa al entrar a cada paso (si el paso apunta a una).
  useLayoutEffect(() => {
    if (paso.tab != null) onIrATab?.(paso.tab)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  // Recalcula el rect del botón resaltado tras el cambio de pestaña y en resize.
  const recomputar = useCallback(() => setRect(rectDeTab(paso.tab)), [paso.tab])
  useLayoutEffect(() => {
    // rAF: deja que el layout (pestaña activa / wrap) se asiente antes de medir.
    const id = requestAnimationFrame(recomputar)
    window.addEventListener('resize', recomputar)
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', recomputar) }
  }, [recomputar])

  const siguiente = () => { if (esUltimo) onCerrar?.(); else setI(v => v + 1) }
  const atras = () => setI(v => Math.max(0, v - 1))

  // Posición de la tarjeta: bajo la pestaña resaltada, o centrada si no hay tab.
  const anchoTarjeta = 360
  const margen = 16
  const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 1024) - anchoTarjeta - margen
  let cardStyle
  if (rect) {
    const left = Math.min(Math.max(margen, rect.left), Math.max(margen, maxLeft))
    cardStyle = { position: 'fixed', top: rect.bottom + 14, left, width: anchoTarjeta, maxWidth: `calc(100vw - ${margen * 2}px)` }
  } else {
    cardStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: anchoTarjeta, maxWidth: `calc(100vw - ${margen * 2}px)` }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }}>
      {/* Fondo oscuro. Con rect, el "agujero" lo hace el box-shadow del anillo. */}
      {!rect && <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)' }} />}

      {/* Spotlight sobre la pestaña: centro transparente + sombra enorme que oscurece el resto. */}
      {rect && (
        <div style={{
          position: 'fixed',
          top: rect.top - 4, left: rect.left - 4,
          width: rect.width + 8, height: rect.height + 8,
          borderRadius: 8, border: '2px solid #2dd4bf',
          boxShadow: '0 0 0 9999px rgba(15,23,42,0.55)',
          pointerEvents: 'none', transition: 'all .18s ease',
        }} />
      )}

      {/* Tarjeta de instrucción */}
      <div style={{
        ...cardStyle,
        background: '#fff', borderRadius: 12, padding: 18,
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)', zIndex: 9999,
        fontFamily: 'system-ui,sans-serif', color: '#1e293b',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <strong style={{ fontSize: 15, color: '#0e6560' }}>{paso.titulo}</strong>
          <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{i + 1} / {PASOS.length}</span>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.5, margin: '0 0 14px' }}>{paso.cuerpo}</p>

        {/* Puntos de progreso */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
          {PASOS.map((_, k) => (
            <span key={k} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: k === i ? '#0e6560' : '#cbd5e1',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => onCerrar?.()}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', padding: '6px 2px' }}
          >
            Saltar tour
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {i > 0 && (
              <button
                onClick={atras}
                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Atrás
              </button>
            )}
            <button
              onClick={siguiente}
              style={{ background: '#0e6560', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
            >
              {esUltimo ? '¡Empezar!' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
