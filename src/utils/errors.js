// ─── Friendly Error Messages ───────────────────────────────────────────────
const ERROR_MESSAGES = {
  'invalid_credentials': 'Email o contraseña incorrectos',
  'email_already_exists': 'Este email ya está registrado',
  'weak_password': 'La contraseña es muy débil',
  'user_not_confirmed': 'Por favor confirma tu email antes de ingresar',
  'invalid_request_body': 'Datos inválidos enviados',
  'rate_limit': 'Demasiados intentos. Intenta más tarde.',
  'permission_denied': 'No tienes permiso para esta acción',
  'not_found': 'El recurso no fue encontrado',
  'network_error': 'Error de conexión. Verifica tu internet.',
  'email_already_in_use': 'Este email ya está registrado',
  'validation_failed': 'Los datos enviados no son válidos',
  'auth_error': 'Error de autenticación',
  'db_error': 'Error en la base de datos',
  'unknown_error': 'Algo salió mal. Intenta nuevamente.',
}

/**
 * Mapea errores de Supabase a mensajes amigables para el usuario
 * @param {Error|Object} error - Error de Supabase
 * @returns {{code: string, message: string, details?: string}} - Error mapeado
 */
export function mapSupabaseError(error) {
  if (!error) {
    return {
      code: 'UNKNOWN',
      message: ERROR_MESSAGES['unknown_error'],
    }
  }

  // Extraer código de error de Supabase
  let errorCode = error.code || error.message || 'unknown_error'
  let friendlyMessage = ERROR_MESSAGES[errorCode] || error.message || ERROR_MESSAGES['unknown_error']

  // Casos especiales de Supabase
  if (error.message?.includes('invalid email')) {
    errorCode = 'VALIDATION'
    friendlyMessage = 'Email inválido'
  } else if (error.message?.includes('Password')) {
    errorCode = 'VALIDATION'
    friendlyMessage = 'La contraseña no cumple con los requisitos'
  } else if (error.message?.includes('already registered')) {
    errorCode = 'VALIDATION'
    friendlyMessage = 'Este email ya está registrado'
  } else if (error.message?.includes('email not confirmed')) {
    errorCode = 'AUTH'
    friendlyMessage = 'Por favor confirma tu email antes de ingresar'
  } else if (error.status === 429) {
    errorCode = 'RATE_LIMIT'
    friendlyMessage = 'Demasiados intentos. Intenta más tarde.'
  } else if (error.status >= 500) {
    errorCode = 'DB'
    friendlyMessage = 'Error del servidor. Intenta más tarde.'
  }

  return {
    code: errorCode,
    message: friendlyMessage,
    details: error.message || error.toString(),
  }
}

/**
 * Crea un objeto de error estándar
 * @param {string} message - Mensaje de error
 * @param {string} code - Código de error
 * @param {string} details - Detalles técnicos
 * @returns {Object} - Error estándar {ok: false, error: {...}}
 */
export function createError(message, code = 'UNKNOWN', details = null) {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  }
}

/**
 * Crea un objeto de éxito estándar
 * @param {*} data - Datos a retornar
 * @returns {Object} - Éxito estándar {ok: true, data: ...}
 */
export function createSuccess(data = null) {
  return {
    ok: true,
    ...(data && { data }),
  }
}

/**
 * Extrae mensaje de error de diferentes formatos
 * @param {Error|string|Object} error - Error en cualquier formato
 * @returns {string} - Mensaje de error legible
 */
export function extractErrorMessage(error) {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error?.message) return error.error.message
  return 'Error desconocido'
}

/**
 * Categoriza errores por tipo
 * @param {Error|Object} error - Error a categorizar
 * @returns {string} - Tipo de error (VALIDATION, AUTH, DB, NETWORK, UNKNOWN)
 */
export function categorizarError(error) {
  if (!error) return 'UNKNOWN'

  const msg = (error.message || '').toLowerCase()

  if (msg.includes('invalid') || msg.includes('validation')) return 'VALIDATION'
  if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('credentials')) return 'AUTH'
  if (msg.includes('not found') || msg.includes('404')) return 'NOT_FOUND'
  if (msg.includes('permission') || msg.includes('forbidden')) return 'PERMISSION'
  if (msg.includes('network') || msg.includes('timeout')) return 'NETWORK'
  if (error.status >= 500) return 'DB'

  return 'UNKNOWN'
}

/**
 * Limpia objeto de errores de campos vacíos/nulos
 * @param {Object} errores - Objeto con errores por campo
 * @returns {Object} - Objeto limpio sin valores falsy
 */
export function limpiarErrores(errores) {
  if (!errores) return {}
  return Object.keys(errores)
    .filter(key => errores[key])
    .reduce((acc, key) => {
      acc[key] = errores[key]
      return acc
    }, {})
}

/**
 * Verifica si hay algún error
 * @param {Object} errores - Objeto de errores por campo
 * @returns {boolean} - True si hay errores
 */
export function hayErrores(errores) {
  return Object.values(errores || {}).some(e => !!e)
}

/**
 * Obtiene el primer error de un objeto
 * @param {Object} errores - Objeto de errores por campo
 * @returns {string|null} - Primer error encontrado o null
 */
export function obtenerPrimerError(errores) {
  const keys = Object.keys(errores || {})
  for (const key of keys) {
    if (errores[key]) return errores[key]
  }
  return null
}

/**
 * Convierte errores de campo a string legible
 * @param {Object} errores - Objeto de errores por campo
 * @param {string} separador - Separador entre errores (default: ' | ')
 * @returns {string} - String con todos los errores
 */
export function formatearErrores(errores, separador = ' | ') {
  return Object.values(errores || {})
    .filter(e => !!e)
    .join(separador)
}
