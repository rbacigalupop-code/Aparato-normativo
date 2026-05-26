// CurvaGlaser — gráfico SVG inline (sin librerías externas) que dibuja:
//   • Presión de vapor real (línea sólida acento)
//   • Presión de vapor de saturación (línea punteada gris)
//   • Separadores verticales entre capas
//   • Etiquetas con nombre y temperatura por capa
//   • Badge "SIN CONDENSACIÓN" / "CONDENSA" en el header
//
// Props:
//   capas        : Array<{ n: string, esp: number }>   // n usado para etiqueta, esp para ancho relativo
//   presionReal  : number[]                            // Pa, longitud = capas.length + 1 (interfaces)
//   presionSat   : number[]                            // Pa, longitud = capas.length + 1
//   temperaturas : number[]                            // °C, longitud = capas.length (centro de cada capa)
//   condensacion : boolean                             // true ⇒ badge rojo "Condensa"
//
// Notas:
//   • Si presionReal / presionSat vienen con length = capas.length se asume que es
//     el valor en cada interfaz dejando fuera la última; el gráfico repite el último
//     punto para cerrar la curva.

import React from 'react'

export default function CurvaGlaser({
  capas,
  presionReal,
  presionSat,
  temperaturas = [],
  condensacion = false,
}) {
  // viewBox; se renderiza escalado al ancho del contenedor.
  const W = 700, H = 320
  const padL = 60, padR = 50, padT = 30, padB = 80
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  // Posiciones x según el espesor de cada capa (acumulado)
  const totalE = capas.reduce((s, c) => s + (Number(c.esp) || 0), 0) || 1
  let acc = 0
  const positions = capas.map((c) => {
    const x0 = padL + (acc / totalE) * plotW
    acc += Number(c.esp) || 0
    const x1 = padL + (acc / totalE) * plotW
    return { c, x0, x1 }
  })
  const ifaces = positions.map(p => p.x1)
  const xsForGraph = [padL, ...ifaces]

  // Normalizar arrays de presión: necesitamos length = capas.length + 1
  const norm = (arr) => {
    if (!arr || arr.length === 0) return Array(capas.length + 1).fill(0)
    if (arr.length === capas.length + 1) return arr
    if (arr.length === capas.length) return [...arr, arr[arr.length - 1]]
    return arr.slice(0, capas.length + 1)
  }
  const pReal = norm(presionReal)
  const pSat = norm(presionSat)

  const maxP = Math.max(...pReal, ...pSat) || 1
  const yP = (v) => padT + plotH - (v / maxP) * plotH

  const psatPts = xsForGraph.map((x, i) => [x, yP(pSat[i])])
  const prealPts = xsForGraph.map((x, i) => [x, yP(pReal[i])])

  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg, 12px)',
      overflow: 'hidden',
      fontFamily: 'var(--font-ui)',
    }}>
      {/* Header con badge */}
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid var(--line-soft)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14,
      }}>
        <div>
          <div style={{
            fontSize: 14, fontWeight: 600, color: 'var(--ink)',
            fontFamily: 'var(--font-display)',
            fontStyle: 'var(--display-italic, normal)',
          }}>
            Curva Glaser — condensación intersticial
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.4 }}>
            Si la presión real cruza la curva de saturación, hay riesgo de condensación.
            Método NCh1973 / ISO 13788.
          </div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '5px 11px',
          background: condensacion ? 'var(--bad-bg)' : 'var(--ok-bg)',
          color: condensacion ? 'var(--bad)' : 'var(--ok)',
          border: `1px solid ${condensacion ? 'var(--bad)' : 'var(--ok)'}`,
          borderRadius: 999, fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.6,
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: condensacion ? 'var(--bad)' : 'var(--ok)',
          }} />
          {condensacion ? 'Condensa' : 'Sin condensación'}
        </div>
      </div>

      {/* SVG */}
      <div style={{ padding: 18, background: 'var(--bg-alt)' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          {/* Grid horizontal con etiquetas Pa */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = padT + t * plotH
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={padL + plotW} y2={y}
                      stroke="var(--line-soft)" strokeWidth="0.5"
                      strokeDasharray={t === 0 || t === 1 ? 'none' : '2 3'} />
                <text x={padL - 8} y={y + 3} fontSize="9" fill="var(--ink-3)"
                      textAnchor="end" fontFamily="var(--font-num)"
                      style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round(maxP * (1 - t))}
                </text>
              </g>
            )
          })}

          {/* Label eje Y */}
          <text x={20} y={padT + plotH / 2} fontSize="9" fill="var(--ink-3)"
                textAnchor="middle" fontFamily="var(--font-ui)"
                transform={`rotate(-90, 20, ${padT + plotH / 2})`}
                letterSpacing="1.5">
            PRESIÓN VAPOR (Pa)
          </text>

          {/* Separadores verticales entre capas */}
          {ifaces.slice(0, -1).map((x, i) => (
            <line key={i} x1={x} y1={padT} x2={x} y2={padT + plotH}
                  stroke="var(--line-soft)" strokeWidth="0.5" strokeDasharray="2 3" />
          ))}

          {/* Curva saturación */}
          <path d={toPath(psatPts)} fill="none"
                stroke="var(--ink-3)" strokeWidth="1.5" strokeDasharray="5 3" />

          {/* Área bajo presión real */}
          <path
            d={`${toPath(prealPts)} L${xsForGraph[xsForGraph.length - 1]},${padT + plotH} L${padL},${padT + plotH} Z`}
            fill="var(--accent)" opacity="0.08"
          />

          {/* Curva presión real */}
          <path d={toPath(prealPts)} fill="none" stroke="var(--accent)" strokeWidth="2.2" />

          {/* Puntos en cada interfaz */}
          {prealPts.map((p, i) => (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r={3.5} fill="var(--accent)" />
              <circle cx={psatPts[i][0]} cy={psatPts[i][1]} r={3}
                      fill="var(--surface)" stroke="var(--ink-3)" strokeWidth={1.2} />
            </g>
          ))}

          {/* Etiquetas por capa: nombre + temperatura */}
          {positions.map((p, i) => {
            const cx = (p.x0 + p.x1) / 2
            const wide = (p.x1 - p.x0) > 40
            if (!wide) return null
            const T = temperaturas[i]
            return (
              <g key={i} fontFamily="var(--font-ui)">
                <text x={cx} y={padT + plotH + 18} fontSize="10"
                      fill="var(--ink-2)" textAnchor="middle" fontWeight={500}>
                  {p.c.n}
                </text>
                {T != null && (
                  <text x={cx} y={padT + plotH + 32} fontSize="9"
                        fill="var(--ink-3)" textAnchor="middle"
                        fontFamily="var(--font-num)"
                        style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {Number(T).toFixed(1)}°C
                  </text>
                )}
              </g>
            )
          })}

          {/* INT / EXT */}
          <text x={padL - 28} y={padT + plotH + 18} fontSize="9"
                fill="var(--ink-3)" fontFamily="var(--font-ui)"
                fontWeight={600} letterSpacing="1">INT</text>
          <text x={padL + plotW + 18} y={padT + plotH + 18} fontSize="9"
                fill="var(--ink-3)" fontFamily="var(--font-ui)"
                fontWeight={600} letterSpacing="1">EXT</text>

          {/* Leyenda */}
          <g transform={`translate(${padL + plotW - 200}, ${padT + 6})`} fontFamily="var(--font-ui)">
            <rect x={0} y={-4} width={200} height={36} rx={4}
                  fill="var(--surface)" stroke="var(--line-soft)" />
            <line x1={8} x2={26} y1={9} y2={9} stroke="var(--accent)" strokeWidth={2} />
            <text x={32} y={12} fontSize="10" fill="var(--ink-2)">Presión real</text>
            <line x1={8} x2={26} y1={25} y2={25} stroke="var(--ink-3)"
                  strokeDasharray="3 2" strokeWidth={1.5} />
            <text x={32} y={28} fontSize="10" fill="var(--ink-2)">Presión saturación</text>
          </g>
        </svg>
      </div>
    </div>
  )
}
