// ─────────────────────────────────────────────────────────────────────────────
// plan.js — Helpers para chequear el plan del usuario (free / trial / pro).
//
// El plan vive en perfiles_usuario.plan y trial_expira (sql/013_user_plans.sql).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ¿El usuario tiene acceso Pro?
 * - plan === 'pro' → siempre sí
 * - plan === 'trial' → sí, si trial_expira > NOW
 * - plan === 'free' → no
 * - perfil null/undefined → no
 */
export function isPro(perfil) {
  if (!perfil) return false
  if (perfil.plan === 'pro') return true
  if (perfil.plan === 'trial' && perfil.trial_expira) {
    const expira = new Date(perfil.trial_expira)
    if (!isNaN(expira.getTime()) && expira > new Date()) return true
  }
  return false
}

/**
 * ¿El usuario está en prueba activa? (informativo para mostrar countdown)
 */
export function estaEnTrial(perfil) {
  if (!perfil || perfil.plan !== 'trial' || !perfil.trial_expira) return false
  const expira = new Date(perfil.trial_expira)
  return !isNaN(expira.getTime()) && expira > new Date()
}

/**
 * Días restantes de prueba. null si no está en trial activo.
 */
export function diasRestantesTrial(perfil) {
  if (!estaEnTrial(perfil)) return null
  const expira = new Date(perfil.trial_expira)
  const ahora = new Date()
  const ms = expira - ahora
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

/**
 * Label del plan para mostrar.
 */
export function labelPlan(perfil) {
  if (!perfil) return 'Sin plan'
  if (perfil.plan === 'pro')   return 'Pro'
  if (perfil.plan === 'trial') {
    const dias = diasRestantesTrial(perfil)
    return dias != null ? `Prueba (${dias}d)` : 'Prueba expirada'
  }
  return 'Free'
}
