// ─── Regular Expressions ───────────────────────────────────────────────────
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_MIN_LENGTH = 8
export const PROYECTO_NAME_MAX_LENGTH = 200

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

/**
 * Valida un rol de usuario
 * @param {string} rol - Rol a validar (admin, viewer)
 * @returns {string|null} - Mensaje de error o null
 */
export function validarRol(rol) {
  const rolesValidos = ['admin', 'viewer']
  if (!rol || !rolesValidos.includes(rol)) {
    return `Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}`
  }
  return null
}

/**
 * Valida que un email no esté duplicado en una lista
 * @param {string} email - Email a validar
 * @param {string[]} emailsExistentes - Lista de emails ya registrados
 * @returns {string|null} - Mensaje de error o null
 */
export function validarEmailUnico(email, emailsExistentes = []) {
  if (!email) return null

  const emailLower = email.toLowerCase()
  const existe = emailsExistentes.some(e => e.toLowerCase() === emailLower)

  if (existe) {
    return 'Este email ya está registrado'
  }

  return null
}

/**
 * Valida que el email sea diferente del usuario actual
 * @param {string} email - Email a validar
 * @param {string} emailActual - Email del usuario actual
 * @returns {string|null} - Mensaje de error o null
 */
export function validarEmailDiferente(email, emailActual) {
  if (!email || !emailActual) return null

  if (email.toLowerCase() === emailActual.toLowerCase()) {
    return 'No puedes invitar a tu propio email'
  }

  return null
}

/**
 * Valida número de pisos
 * @param {number|string} pisos - Número de pisos
 * @returns {string|null} - Mensaje de error o null
 */
export function validarPisos(pisos) {
  if (pisos === null || pisos === undefined || pisos === '') {
    return 'Número de pisos requerido'
  }
  const num = parseInt(pisos)
  if (isNaN(num) || num < 1) {
    return 'Debe ser al menos 1 piso'
  }
  if (num > 100) {
    return 'Número de pisos no válido'
  }
  return null
}

/**
 * Valida superficie en m²
 * @param {number|string} superficie - Superficie a validar
 * @returns {string|null} - Mensaje de error o null
 */
export function validarSuperficie(superficie) {
  if (!superficie && superficie !== 0) {
    return 'Superficie requerida'
  }
  const num = parseFloat(superficie)
  if (isNaN(num) || num <= 0) {
    return 'Superficie debe ser un número positivo'
  }
  if (num > 999999) {
    return 'Superficie no válida'
  }
  return null
}

/**
 * Calcula fortaleza de contraseña (0-4)
 * @param {string} password - Contraseña a evaluar
 * @returns {number} - Puntuación de fortaleza
 */
export function calcularFortalezaPassword(password) {
  if (!password) return 0

  let score = 0
  if (password.length >= PASSWORD_RULES.minLength) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*]/.test(password)) score++

  return score
}

/**
 * Obtiene descripción de fortaleza de contraseña
 * @param {number} score - Puntuación (0-4)
 * @returns {{nivel: string, color: string}} - Descripción y color
 */
export function describirFortaleza(score) {
  switch (score) {
    case 0:
    case 1:
      return { nivel: 'Débil', color: '#dc2626' }
    case 2:
      return { nivel: 'Regular', color: '#ea580c' }
    case 3:
      return { nivel: 'Buena', color: '#eab308' }
    case 4:
      return { nivel: 'Fuerte', color: '#16a34a' }
    default:
      return { nivel: 'Desconocido', color: '#6b7280' }
  }
}

/**
 * Valida formulario completo de signup
 * @param {Object} data - {nombre, email, password, passwordConfirmar}
 * @returns {{valido: boolean, errores: Object}} - Resultado y errores por campo
 */
export function validarFormularioSignup(data) {
  const errores = {}

  const errorNombre = validarNombre(data.nombre)
  if (errorNombre) errores.nombre = errorNombre

  const errorEmail = validarEmail(data.email)
  if (errorEmail) errores.email = errorEmail

  const errorPassword = validarPassword(data.password)
  if (errorPassword) errores.password = errorPassword

  if (data.password !== data.passwordConfirmar) {
    errores.passwordConfirmar = 'Las contraseñas no coinciden'
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  }
}

/**
 * Valida formulario completo de login
 * @param {Object} data - {email, password}
 * @returns {{valido: boolean, errores: Object}} - Resultado y errores por campo
 */
export function validarFormularioLogin(data) {
  const errores = {}

  const errorEmail = validarEmail(data.email)
  if (errorEmail) errores.email = errorEmail

  if (!data.password) {
    errores.password = 'Contraseña requerida'
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  }
}

/**
 * Valida invitación de usuario
 * @param {Object} data - {email, rol}
 * @param {Object} extras - {emailActual, emailsExistentes}
 * @returns {{valido: boolean, errores: Object}} - Resultado y errores por campo
 */
export function validarInvitacionUsuario(data, extras = {}) {
  const errores = {}

  const errorEmail = validarEmail(data.email)
  if (errorEmail) errores.email = errorEmail

  if (extras.emailActual) {
    const errorDiferente = validarEmailDiferente(data.email, extras.emailActual)
    if (errorDiferente) errores.email = errorDiferente
  }

  if (extras.emailsExistentes) {
    const errorUnico = validarEmailUnico(data.email, extras.emailsExistentes)
    if (errorUnico) errores.email = errorUnico
  }

  const errorRol = validarRol(data.rol)
  if (errorRol) errores.rol = errorRol

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  }
}

/**
 * Valida datos de creación de proyecto
 * @param {Object} data - {nombre}
 * @returns {{valido: boolean, errores: Object}} - Resultado y errores por campo
 */
export function validarCrearProyecto(data) {
  const errores = {}

  const errorNombre = validarNombreProyecto(data.nombre)
  if (errorNombre) errores.nombre = errorNombre

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  }
}
