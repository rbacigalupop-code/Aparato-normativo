import { useMemo } from 'react'
import { filterMatsByElem } from '../data.js'
import SearchSelect from './SearchSelect.jsx'

// ─────────────────────────────────────────────────────────────────────────────
// MaterialCombobox — buscador de materiales. Wrapper delgado de SearchSelect que
// mapea el catálogo (filterMatsByElem, respeta muro/techo/piso) a opciones
// agrupadas {group, items:[{value,label,hint:λ}]}. Mantiene su API previa para
// que los sitios que lo usan (agregar capa + editor de capas) no cambien.
// searchThreshold=0 → la caja de búsqueda siempre visible (lista larga).
// ─────────────────────────────────────────────────────────────────────────────
export default function MaterialCombobox({
  value,
  onChange,
  elem,
  placeholder = 'Buscar material…',
  width = 200,
  showLambda = true,
  style = {},
}) {
  const options = useMemo(() => (filterMatsByElem(elem) || []).map(g => ({
    group: g.g,
    items: (g.items || []).map(m => ({
      value: m.n,
      label: m.n,
      hint: (showLambda && m.lam != null) ? `λ=${m.lam}` : undefined,
    })),
  })), [elem, showLambda])

  return (
    <SearchSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      width={width}
      style={style}
      allowCustomValue
      searchThreshold={0}
    />
  )
}
