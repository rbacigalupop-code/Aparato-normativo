// ─── Regular Expressions ───────────────────────────────────────────────────
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Password Requirements ─────────────────────────────────────────────────
export const PASSWORD_RULES = {
  minLength: 8,
  requiresUppercase: true,
  requiresNumber: true,
  requiresSpecial: true,
}

// ─── Validators ────────────────────────────────────────────────────────────

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validarEmail(email) {
  if (!email || !email.trim()) {
    return 'Email requerido'
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Email inválido'
  }
  return null
}

/**
 * Valida una contraseña según reglas de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {string|null} - Mensaje de error o null si es válida
 */
export function validarPassword(password) {
  if (!password) {
    return 'Contraseña requerida'
  }
  if (password.length < PASSWORD_RULES.minLength) {
    return `Mínimo ${PASSWORD_RULES.minLength} caracteres`
  }
  if (PASSWORD_RULES.requiresUppercase && !/[A-Z]/.test(password)) {
    return 'Al menos 1 mayúscula'
  }
  if (PASSWORD_RULES.requiresNumber && !/[0-9]/.test(password)) {
    return 'Al menos 1 número'
  }
  if (PASSWORD_RULES.requiresSpecial && !/[!@#$%^&*]/.test(password)) {
    return 'Al menos 1 carácter especial (!@#$%^&*)'
  }
  return null
}

/**
 * Valida un nombre completo
 * @param {string} nombre - Nombre a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validarNombre(nombre) {
  if (!nombre || !nombre.trim()) {
    return 'Nombre requerido'
  }
  if (nombre.trim().length < 3) {
    return 'Mínimo 3 caracteres'
  }
  if (nombre.length > 100) {
    return 'Máximo 100 caracteres'
  }
  if (/[0-9]/.test(nombre)) {
    return 'El nombre no debe contener números'
  }
  return null
}

/**
 * Valida que dos valores sean iguales (ej: password === passwordConfirm)
 * @param {string} value1 - Primer valor
 * @param {string} value2 - Segundo valor
 * @param {string} fieldName - Nombre del campo para el mensaje
 * @returns {string|null} - Mensaje de error o null si coinciden
 */
export function validarCoincidencia(value1, value2, fieldName = 'Valores') {
  if (value1 !== value2) {
    return `${fieldName} no coinciden`
  }
  return null
}

/**
 * Valida un nombre de proyecto
 * @param {string} nombre - Nombre del proyecto
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export function validarNombreProyecto(nombre) {
  if (!nombre || !nombre.trim()) {
    return 'Nombre de proyecto requerido'
  }
  if (nombre.trim().length < 1) {
    return 'Nombre no puede estar vacío'
  }
  if (nombre.length > 200) {
    return 'Máximo 200 caracteres'
  }
  return null
}

/**
 * Valida que un valor no esté vacío
 * @param {string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {string|null} - Mensaje de error o null
 */
export function validarNoVacio(value, fieldName = 'Campo') {
  if (!value || !value.toString().trim()) {
    return `${fieldName} requerido`
  }
  return null
}
