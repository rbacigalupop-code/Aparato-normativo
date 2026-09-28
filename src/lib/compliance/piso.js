// ─────────────────────────────────────────────────────────────────────────────
// piso.js — Clasificación del piso como dato del proyecto (PROMPT 5)
//
// Antes de aplicar un Umáx, hay que saber QUÉ piso es. La clasificación estaba
// escondida como estado local del panel Cálculo U con default 'ventilado', así
// que a cualquier piso se le aplicaba automáticamente el límite de piso
// ventilado. Ahora es un dato explícito del proyecto (proy.tipoPiso) y, si no
// está definido, el cumplimiento del piso queda NO_VERIFICADO (no se asume).
// ─────────────────────────────────────────────────────────────────────────────

export const TIPO_PISO = Object.freeze({
  VENTILADO:     'VENTILADO',      // piso ventilado (sobramiento) — Umáx DS N°15 Tabla 1
  SOBRE_TERRENO: 'SOBRE_TERRENO',  // losa/radier en contacto con el terreno (ISO 13370)
  NO_CALEF:      'NO_CALEF',       // sobre espacio no calefaccionado (subterráneo, etc.)
  NO_DEFINIDO:   'NO_DEFINIDO',
})

export const TIPO_PISO_LABEL = Object.freeze({
  VENTILADO:     'Ventilado (sobramiento)',
  SOBRE_TERRENO: 'Sobre terreno (ISO 13370)',
  NO_CALEF:      'Sobre espacio no calefaccionado',
  NO_DEFINIDO:   'Sin clasificar',
})

// Normaliza distintas formas al enum (incluye las claves legacy del panel
// Cálculo U: 'ventilado' | 'terreno' | 'no_calef').
export function normalizarTipoPiso(v) {
  if (!v) return TIPO_PISO.NO_DEFINIDO
  const s = String(v).toLowerCase()
  if (s === 'ventilado' || s === TIPO_PISO.VENTILADO.toLowerCase()) return TIPO_PISO.VENTILADO
  if (s === 'terreno' || s === 'sobre_terreno' || s.includes('terreno')) return TIPO_PISO.SOBRE_TERRENO
  if (s === 'no_calef' || s.includes('calef')) return TIPO_PISO.NO_CALEF
  return TIPO_PISO.NO_DEFINIDO
}

// Reglas de aplicación del Umáx del piso según su clasificación.
//   requiereClasificar → true cuando el tipo es NO_DEFINIDO: el check de piso
//     debe quedar NO_VERIFICADO (no se aplica ningún límite por defecto).
//   aplicaUmax → si corresponde comparar el U contra el Umáx de zona.
//   label / nota → texto para la UI/informe (deja explícito el criterio).
export function reglaPiso(tipoPisoRaw) {
  const tipo = normalizarTipoPiso(tipoPisoRaw)
  switch (tipo) {
    case TIPO_PISO.VENTILADO:
      return { tipo, requiereClasificar: false, aplicaUmax: true, label: 'Piso ventilado', nota: 'Umáx DS N°15 (piso ventilado).' }
    case TIPO_PISO.SOBRE_TERRENO:
      return { tipo, requiereClasificar: false, aplicaUmax: true, label: 'Piso sobre terreno', nota: 'Verificar con Uf equivalente (ISO 13370); no es el mismo caso que piso ventilado.' }
    case TIPO_PISO.NO_CALEF:
      return { tipo, requiereClasificar: false, aplicaUmax: true, label: 'Piso sobre espacio no calefaccionado', nota: 'U por ISO 6946 (RSi interior); no aplica corrección ISO 13370.' }
    default:
      return { tipo: TIPO_PISO.NO_DEFINIDO, requiereClasificar: true, aplicaUmax: false, label: 'Piso sin clasificar', nota: 'Clasifique el piso (ventilado / sobre terreno / sobre espacio no calef.) para determinar la exigencia.' }
  }
}
