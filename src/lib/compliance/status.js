// ─────────────────────────────────────────────────────────────────────────────
// status.js — Motor único de estados de cumplimiento normativo (Talora)
//
// PROMPT 1 del refactor: una sola estructura de estado para todo Talora.
// Regla central e innegociable para un software que acredita cumplimiento DOM:
//   La AUSENCIA de un dato requerido NUNCA equivale a CUMPLE.
//
// Antes, los checks se construían con `ok: !valor || calculo(...)` y luego se
// filtraban los que no tenían valor (`_rows.filter(c => c.val)`). Efecto:
//   · una exigencia obligatoria sin dato desaparecía del resumen, y
//   · un proyecto sin datos daba `[].every() === true` → CUMPLE.
// Este módulo reemplaza ese patrón por cinco estados explícitos y una
// consolidación que hace fail-safe (a favor de la seguridad normativa).
// ─────────────────────────────────────────────────────────────────────────────

export const ESTADO = Object.freeze({
  CUMPLE:        'CUMPLE',
  NO_CUMPLE:     'NO_CUMPLE',
  NO_VERIFICADO: 'NO_VERIFICADO',
  NO_APLICA:     'NO_APLICA',
  INFORMATIVO:   'INFORMATIVO',
})

// ¿El check trae un valor real ingresado/calculado?
// Nota: 'Sin datos' nunca se usa como val; un val vacío o nulo = sin dato.
export function tieneDato(check) {
  const v = check?.val
  return v != null && String(v).trim() !== ''
}

// Deriva el estado de UN check a partir de sus banderas.
// Precedencia: NO_APLICA > INFORMATIVO > (dato ? CUMPLE/NO_CUMPLE : según obligatoriedad).
//   · noAplica           → NO_APLICA   (no gatea; "no exigible" manda sobre informativo)
//   · informativo        → INFORMATIVO (estimado/no certificado; nunca gatea el global)
//   · con dato           → ok ? CUMPLE : NO_CUMPLE
//   · sin dato + oblig.  → NO_VERIFICADO  (bloquea el global)
//   · sin dato + opcion. → NO_APLICA      (no exigido / no ingresado)
// Si el check ya trae un `estado` explícito válido, se respeta.
export function estadoDeCheck(check) {
  if (!check) return ESTADO.NO_APLICA
  if (check.estado && Object.values(ESTADO).includes(check.estado)) return check.estado
  if (check.noAplica)    return ESTADO.NO_APLICA
  if (check.informativo) return ESTADO.INFORMATIVO
  if (tieneDato(check))  return check.ok ? ESTADO.CUMPLE : ESTADO.NO_CUMPLE
  return check.obligatorio ? ESTADO.NO_VERIFICADO : ESTADO.NO_APLICA
}

// ¿Este check bloquea el estado global CUMPLE?
// Bloquean: NO_CUMPLE (siempre) y NO_VERIFICADO de una exigencia obligatoria.
export function esBloqueador(check) {
  const e = estadoDeCheck(check)
  if (e === ESTADO.NO_CUMPLE) return true
  if (e === ESTADO.NO_VERIFICADO && check?.obligatorio) return true
  return false
}

export function contarEstados(checks) {
  const c = { CUMPLE: 0, NO_CUMPLE: 0, NO_VERIFICADO: 0, NO_APLICA: 0, INFORMATIVO: 0 }
  for (const chk of (checks || [])) c[estadoDeCheck(chk)]++
  return c
}

// Consolida el estado global del proyecto.
//   · NO_CUMPLE    si existe al menos un check obligatorio NO_CUMPLE.
//   · NO_VERIFICADO si no hay NO_CUMPLE pero existe un obligatorio NO_VERIFICADO.
//   · CUMPLE       si todos los obligatorios están CUMPLE o NO_APLICA.
// Devuelve además los bloqueadores (para listarlos en el informe) y los conteos.
export function consolidar(checks) {
  const lista = checks || []
  const contadores = contarEstados(lista)
  const bloqueadores = lista.filter(esBloqueador)

  const hayNoCumple = lista.some(c => estadoDeCheck(c) === ESTADO.NO_CUMPLE && c?.obligatorio !== false)
  const hayNoVerificado = lista.some(c => estadoDeCheck(c) === ESTADO.NO_VERIFICADO && c?.obligatorio)

  let estado
  if (hayNoCumple)           estado = ESTADO.NO_CUMPLE
  else if (hayNoVerificado)  estado = ESTADO.NO_VERIFICADO
  else                       estado = ESTADO.CUMPLE

  return { estado, contadores, bloqueadores }
}

// Etiqueta corta legible para UI/informe.
export function etiquetaEstado(estado) {
  switch (estado) {
    case ESTADO.CUMPLE:        return 'CUMPLE'
    case ESTADO.NO_CUMPLE:     return 'NO CUMPLE'
    case ESTADO.NO_VERIFICADO: return 'NO VERIFICADO'
    case ESTADO.NO_APLICA:     return 'NO APLICA'
    case ESTADO.INFORMATIVO:   return 'INFORMATIVO'
    default:                   return '—'
  }
}
