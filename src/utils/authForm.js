import { hayErrores } from './errors'

// ─── Gating del botón de enviar del formulario de auth (AuthGate) ────────────
/**
 * ¿Debe estar deshabilitado el botón de enviar (Ingresar / Crear cuenta)?
 * Motivos:
 *   · procesando            → hay una request en curso.
 *   · errores de campo      → hayErrores() usa Object.values(...).some(Boolean),
 *     ACTIVOS                 así ignora claves con valor undefined. NO usar
 *                             Object.keys().length: contaba claves fantasma (p. ej.
 *                             'politica' al limpiarse) y dejaba el botón bloqueado
 *                             para siempre (ver signup_boton_bloqueado.test.js).
 *   · consentimiento        → SOLO en signup: hasta aceptar la Política de
 *     pendiente               Privacidad (Ley 21.719) el botón queda deshabilitado,
 *                             para que la exigencia sea visible antes de enviar.
 *                             En login no aplica (no hay casilla).
 * @param {{procesando?:boolean, fieldErrors?:Object, modo?:'login'|'signup', aceptaPolitica?:boolean}} p
 * @returns {boolean}
 */
export function botonAuthDeshabilitado({
  procesando = false,
  fieldErrors = {},
  modo = 'login',
  aceptaPolitica = false,
} = {}) {
  return Boolean(procesando)
    || hayErrores(fieldErrors)
    || (modo === 'signup' && !aceptaPolitica)
}
