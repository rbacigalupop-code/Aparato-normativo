// ─────────────────────────────────────────────────────────────────────────────
// glaserLabels.js — reparto anti-solape de las etiquetas de capa del eje X del
// diagrama de Glaser (perfil de temperatura/condensación).
//
// Las capas muy finas y contiguas (p.ej. yeso cartón 10mm + barrera de vapor
// 0.2mm) tienen centros casi coincidentes, así que sus nombres se encimaban. Este
// reparto coloca las etiquetas en hasta 2 filas (stagger) evitando el solape
// horizontal; la que no cabe en ninguna fila se omite (su nombre completo sigue en
// el despiece de capas). Lo usan los DOS generadores de Glaser (GraficoGlaser en
// pantalla y glaserSvgStr del informe) para que se vean igual.
// ─────────────────────────────────────────────────────────────────────────────

// Ancho aproximado de media etiqueta (sin medir el texto): fontSize 7.5 ≈ 4.4 px/char.
const ANCHO_CHAR = 4.4
const GAP = 3        // separación mínima entre etiquetas de la misma fila (px)
const ROW_DY = 9     // separación vertical entre las dos filas (px)

// items: [{ label, cx }] en orden interior→exterior. baseY: y de la 1ª fila.
// Devuelve [{ label, x, y }] sin solape horizontal.
export function glaserLabelLayout(items, baseY) {
  const rowEnd = [-Infinity, -Infinity] // borde derecho ocupado por cada fila
  const out = []
  for (const it of (items || [])) {
    if (!it || !it.label) continue
    const half = Math.max(10, (it.label.length * ANCHO_CHAR) / 2)
    const left = it.cx - half
    const row = left > rowEnd[0] + GAP ? 0 : (left > rowEnd[1] + GAP ? 1 : -1)
    if (row === -1) continue // no cabe en ninguna fila sin encimarse → se omite
    rowEnd[row] = it.cx + half
    out.push({ label: it.label, x: it.cx, y: baseY + row * ROW_DY })
  }
  return out
}
