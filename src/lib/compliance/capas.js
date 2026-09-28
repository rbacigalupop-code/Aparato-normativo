// ─────────────────────────────────────────────────────────────────────────────
// capas.js — Resolución y validación de capas para cálculo (Talora)
//
// PROMPT 3: para un software normativo, un dato que no se puede resolver JAMÁS
// debe transformarse en un valor físico inventado ni descartarse en silencio.
//
// Antes:
//   · capasParaSC (visor) representaba una capa no resuelta con 50 mm arbitrarios.
//   · getCapasParaSC (cálculo) emitía λ='' para un material desconocido, y el
//     motor la filtraba (c.lam>0) → el U se calculaba con capas PARCIALES y se
//     presentaba como válido ("fail open").
// Ahora: una capa que no se puede resolver se marca `unresolved:true` con su
// `source` y `reason`; validarCapasParaCalculo() detecta exactamente cuál capa
// impide calcular, para que el cálculo asociado quede NO_VERIFICADO.
// ─────────────────────────────────────────────────────────────────────────────

export const CAPA_SOURCE = Object.freeze({
  LOSCAT:      'LOSCAT',
  BH:          'BH',
  MATERIAL_DB: 'MATERIAL_DB',
  USER:        'USER',
  PDA:         'PDA',
  UNKNOWN:     'UNKNOWN',
})

const esCamaraNombre = (nombre) => /camara|cámara|aire/i.test(nombre || '')

// Resuelve UN token de la cadena "Material espesor" (p.ej. "Yeso carton 12").
// Devuelve la capa en la forma del motor de cálculo ({mat, lam, esp(mm str),
// mu, esCamara}) más `source`. Si no se puede resolver con datos suficientes,
// devuelve `unresolved:true` con motivo — nunca inventa λ ni espesor.
//   allMats: catálogo de materiales (ALL_MATS de data.js) para lookup de λ/μ.
export function resolverCapaToken(part, allMats = []) {
  const t = String(part || '').trim()
  if (!t) return null // separador vacío: se ignora (no es una capa)

  const m = t.match(/^(.*?)\s+([\d.]+)$/)
  const buscarMat = (nombre) => allMats.find(x => x.n.toLowerCase() === nombre.toLowerCase())

  // Token SIN espesor explícito (p.ej. "Barrera de vapor")
  if (!m) {
    if (esCamaraNombre(t)) return { mat: t, lam: '', esp: '', mu: '', esCamara: true, source: CAPA_SOURCE.MATERIAL_DB }
    const mb = buscarMat(t)
    if (mb && mb.esp) {
      return { mat: mb.n, lam: mb.lam ?? '', esp: String(mb.esp * 1000), mu: String(mb.mu ?? '1'), esCamara: false, source: CAPA_SOURCE.MATERIAL_DB }
    }
    // No sabemos ni el espesor ni el material → NO inventar.
    return { mat: t, lam: '', esp: '', mu: '', esCamara: false, unresolved: true, reason: 'Capa sin espesor y material no reconocido', source: CAPA_SOURCE.UNKNOWN }
  }

  const nombre = m[1].trim()
  const esp = m[2]
  if (esCamaraNombre(nombre)) {
    return { mat: nombre, lam: '', esp, mu: '', esCamara: true, source: CAPA_SOURCE.MATERIAL_DB }
  }
  const matDat = buscarMat(nombre)
  if (matDat && matDat.lam != null) {
    return { mat: nombre, lam: matDat.lam, esp, mu: String(matDat.mu ?? '1'), esCamara: false, source: CAPA_SOURCE.MATERIAL_DB }
  }
  // Material desconocido: tenemos el espesor pero NO la conductividad λ. Antes se
  // emitía λ='' y el motor la descartaba, calculando el U con capas parciales.
  // Ahora se marca no resuelta para que el cálculo quede NO_VERIFICADO.
  return { mat: nombre, lam: '', esp, mu: '1', esCamara: false, unresolved: true, reason: `Material no reconocido en el catálogo (sin λ): "${nombre}"`, source: CAPA_SOURCE.UNKNOWN }
}

// Parsea la cadena completa "Mat1 e1 | Mat2 e2 | ..." a capas resueltas/no.
// A diferencia del parser viejo, NO descarta en silencio los tokens no resueltos
// (salvo separadores vacíos): los conserva con `unresolved` para que se vean y
// bloqueen el cálculo.
export function parsearCapasString(cadena, allMats = []) {
  return String(cadena || '')
    .split(' | ')
    .map(part => resolverCapaToken(part, allMats))
    .filter(Boolean)
}

// ¿Una capa aporta datos suficientes para el cálculo?
export function capaResuelta(c) {
  if (!c) return false
  if (c.unresolved) return false
  if (c.esCamara) return true // la cámara usa R fija, no necesita λ
  const lam = parseFloat(c.lam)
  const esp = parseFloat(c.esp)
  // Una capa opaca real necesita λ>0 y espesor>0 para aportar resistencia.
  return Number.isFinite(lam) && lam > 0 && Number.isFinite(esp) && esp > 0
}

// Valida un set de capas ANTES de calcular. Devuelve qué capa impide el cálculo.
//   { ok:true }                              → se puede calcular
//   { ok:false, motivo, capa, indice }       → NO se puede (→ NO_VERIFICADO)
export function validarCapasParaCalculo(capas) {
  const lista = Array.isArray(capas) ? capas : []
  if (lista.length === 0) return { ok: false, motivo: 'Sin capas', capa: null, indice: -1 }
  for (let i = 0; i < lista.length; i++) {
    const c = lista[i]
    if (c?.unresolved) {
      return { ok: false, motivo: c.reason || 'Capa no resuelta', capa: c, indice: i }
    }
  }
  // Debe existir al menos una capa opaca con aporte real (no solo cámaras/barreras).
  const hayAporte = lista.some(c => capaResuelta(c) && !c.esCamara)
  if (!hayAporte) return { ok: false, motivo: 'Ninguna capa aporta resistencia (λ y espesor válidos)', capa: null, indice: -1 }
  return { ok: true }
}
