// ─── Búsqueda de materiales para el combobox (lógica pura, sin DOM) ──────────
/**
 * Filtra la lista AGRUPADA de materiales por texto. Coincide por NOMBRE de
 * material o por nombre de GRUPO (conjunto): si el texto matchea el grupo, se
 * devuelven todos sus ítems; si no, solo los ítems cuyo nombre contiene el texto.
 * Devuelve únicamente los grupos que quedan con al menos un ítem. Sin texto,
 * devuelve la lista completa tal cual.
 *
 * @param {{g:string, items:{n:string}[]}[]} grupos  salida de filterMatsByElem(elem)
 * @param {string} query  texto escrito por el usuario
 * @returns {{g:string, items:object[]}[]}
 */
export function filtrarMateriales(grupos, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return grupos || []
  return (grupos || [])
    .map(g => {
      const grupoMatch = (g.g || '').toLowerCase().includes(q)
      const items = grupoMatch ? (g.items || []) : (g.items || []).filter(m => (m.n || '').toLowerCase().includes(q))
      return items.length ? { g: g.g, items } : null
    })
    .filter(Boolean)
}
