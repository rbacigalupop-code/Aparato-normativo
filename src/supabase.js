import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://srukzfoerdgcaymnriax.supabase.co'
const SUPABASE_KEY = 'sb_publishable_mVfmSTULecLaZdoCN6dAmg_PSyqdmlj'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Validar token ─────────────────────────────────────────────────────────────
// Retorna: { ok: true, data } | { ok: false, motivo: 'invalid'|'expired'|'exhausted'|'inactive' }
export async function validarToken(tokenStr) {
  const tok = tokenStr.trim().toUpperCase()
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('token', tok)
    .single()

  if (error || !data)                         return { ok: false, motivo: 'invalid' }
  if (!data.activo)                           return { ok: false, motivo: 'inactive' }
  if (new Date(data.expires_at) < new Date()) return { ok: false, motivo: 'expired' }
  if (data.max_proyectos > 0 && data.proyectos_usados >= data.max_proyectos)
                                              return { ok: false, motivo: 'exhausted' }
  return { ok: true, data }
}

// ─── Incrementar uso al exportar informe ──────────────────────────────────────
// Retorna true si ok, false si error o ya sin proyectos
export async function usarProyecto(tokenStr) {
  const tok = tokenStr.trim().toUpperCase()

  // Leer valor actual
  const { data, error } = await supabase
    .from('tokens')
    .select('proyectos_usados, max_proyectos')
    .eq('token', tok)
    .single()

  if (error || !data) return false

  // Verificar que todavía tiene cupo (0 = ilimitado)
  if (data.max_proyectos > 0 && data.proyectos_usados >= data.max_proyectos) return false

  // Incrementar
  const { error: updError } = await supabase
    .from('tokens')
    .update({ proyectos_usados: data.proyectos_usados + 1 })
    .eq('token', tok)

  return !updError
}

// ─── Admin: gestión de tokens ─────────────────────────────────────────────────
export async function listarTokens() {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return null
  return data
}

export async function crearToken({ token, descripcion, max_proyectos, expires_at }) {
  const { error } = await supabase
    .from('tokens')
    .insert([{ token: token.toUpperCase(), descripcion, max_proyectos, expires_at, proyectos_usados: 0, activo: true }])
  return !error ? { ok: true } : { ok: false, msg: error.message }
}

export async function actualizarToken(token, campos) {
  const { error } = await supabase
    .from('tokens')
    .update(campos)
    .eq('token', token.toUpperCase())
  return !error ? { ok: true } : { ok: false, msg: error.message }
}

export async function eliminarToken(token) {
  const { error } = await supabase
    .from('tokens')
    .delete()
    .eq('token', token.toUpperCase())
  return !error
}

// ─── Proyectos en Supabase ─────────────────────────────────────────────────────
export async function listarProyectosDB(token) {
  const { data, error } = await supabase
    .from('proyectos')
    .select('id, token, nombre, saved_at, updated_at, snapshots, data')
    .eq('token', token.trim().toUpperCase())
    .order('updated_at', { ascending: false })
  if (error) { console.warn('listarProyectosDB error:', error); return null }
  return data
}

export async function guardarProyectoDB(token, id, nombre, data, snapshots = []) {
  const tok = token.trim().toUpperCase()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('proyectos')
    .upsert(
      { id, token: tok, nombre, data, snapshots, updated_at: now, saved_at: now },
      { onConflict: 'id,token' }
    )
  if (error) { console.warn('guardarProyectoDB error:', error); return false }
  return true
}

export async function sobrescribirProyectoDB(token, id, nombre, data, snapshots = []) {
  const tok = token.trim().toUpperCase()
  const { error } = await supabase
    .from('proyectos')
    .update({ nombre, data, snapshots, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('token', tok)
  if (error) { console.warn('sobrescribirProyectoDB error:', error); return false }
  return true
}

export async function eliminarProyectoDB(token, id) {
  const tok = token.trim().toUpperCase()
  const { error } = await supabase
    .from('proyectos')
    .delete()
    .eq('id', id)
    .eq('token', tok)
  if (error) { console.warn('eliminarProyectoDB error:', error); return false }
  return true
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── NUEVA FUNCIONALIDAD: Autenticación Supabase Auth ──────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Signup: Crear nueva cuenta
// NOTA: La creación de organización + perfil se hace automáticamente por el
// trigger SQL handle_new_user (sql/008_fix_signup_trigger.sql). El cliente NO
// hace INSERTs directos porque al momento de signUp() aún no tiene sesión
// autenticada y RLS rechaza los inserts con 401 Unauthorized.
export async function signUp(email, password, nombreCompleto) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre_completo: nombreCompleto,
        name: nombreCompleto,
      },
    },
  })

  if (authError || !authData.user) {
    return { ok: false, error: authError?.message || 'Error en signup' }
  }

  // El trigger crea org + perfil automáticamente con SECURITY DEFINER.
  // Si el usuario necesita confirmar email, authData.session será null.
  return {
    ok: true,
    user: authData.user,
    needsConfirmation: !authData.session,
  }
}

// Login: Acceder con email/password
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    // Traducir errores típicos de Supabase a mensajes amigables
    const raw = (error?.message || '').toLowerCase()
    let mensaje = error?.message || 'Email o contraseña incorrectos'

    if (raw.includes('email not confirmed')) {
      mensaje = 'Tu email aún no está confirmado. Revisa tu bandeja (y la carpeta de spam) y haz click en el link de confirmación.'
    } else if (raw.includes('invalid login credentials') || raw.includes('invalid_credentials')) {
      mensaje = 'Email o contraseña incorrectos. Verifica e intenta de nuevo.'
    } else if (raw.includes('email link is invalid') || raw.includes('expired')) {
      mensaje = 'El link de confirmación expiró. Pide uno nuevo desde "¿No tienes cuenta? Crear una".'
    } else if (raw.includes('rate limit') || raw.includes('too many')) {
      mensaje = 'Demasiados intentos. Espera unos minutos antes de volver a intentar.'
    } else if (raw.includes('user not found')) {
      mensaje = 'No existe una cuenta con este email. ¿Quieres crear una?'
    }

    return { ok: false, error: mensaje, errorCode: error?.code, raw: error?.message }
  }

  // Obtener perfil del usuario (crea uno si no existe)
  const perfil = await obtenerPerfil(data.user.id)

  if (!perfil) {
    return {
      ok: false,
      error: 'Sesión iniciada pero no se pudo cargar tu perfil. Contacta al administrador.',
    }
  }

  return { ok: true, user: data.user, perfil }
}

// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return !error
}

// Obtener sesión actual
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return data?.session || null
}

// Obtener perfil del usuario actual
export async function obtenerPerfil(userId) {
  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('id, user_id, nombre_completo, rol, activo, organizacion_id, ultimo_acceso, created_at')
    .eq('user_id', userId)
    .maybeSingle()  // Changed from .single() to handle empty result gracefully (406 error)

  if (error) {
    console.error('Error obtenerPerfil:', error)
    return null
  }

  // If no profile exists, return null (caller should handle creation if needed)
  if (!data) {
    console.warn('No profile found for user:', userId)
    return null
  }

  // Si tenemos organizacion_id, obtener org por separado
  if (data?.organizacion_id) {
    const { data: org } = await supabase
      .from('organizaciones')
      .select('*')
      .eq('id', data.organizacion_id)
      .maybeSingle()  // Also use maybeSingle for consistency
    if (org) {
      data.organizaciones = org
    }
  }

  return data
}

// Obtener todas las organizaciones del usuario
export async function obtenerOrganizacionesUsuario(userId) {
  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('organizaciones(id, nombre, slug, descripcion, plan, activa)')
    .eq('user_id', userId)

  if (error) return []
  return data.map(p => p.organizaciones).filter(Boolean)
}

// Absorber usuario existente — agrega un usuario ya registrado en auth.users
// a la organización del admin (sin enviar email de invitación).
// Útil cuando el usuario se registró directamente y quedó en su propia org.
// Requiere SQL function absorber_usuario_existente (sql/010_absorber_usuario.sql).
export async function absorberUsuarioExistente(orgId, email, rol = 'viewer') {
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Email inválido' }
  }
  if (!orgId) {
    return { ok: false, error: 'Organización no especificada' }
  }
  try {
    const { data, error } = await supabase.rpc('absorber_usuario_existente', {
      p_email: email.trim().toLowerCase(),
      p_org_id: orgId,
      p_rol: rol,
    })
    if (error) {
      console.warn('absorberUsuarioExistente error:', error)
      return { ok: false, error: error.message || 'Error al absorber usuario' }
    }
    // data viene como JSONB: { ok, error?, mensaje?, usuario? }
    if (!data?.ok) {
      return { ok: false, error: data?.error || 'No se pudo absorber el usuario' }
    }
    return { ok: true, mensaje: data.mensaje, usuario: data.usuario }
  } catch (err) {
    console.error('absorberUsuarioExistente exception:', err)
    return { ok: false, error: 'Error procesando solicitud' }
  }
}

// Activar/desactivar: ¿esta organización recibe todos los nuevos signups directos como viewer?
// Requiere SQL function set_org_recibe_signups (sql/011_org_receptora_signups.sql).
export async function setOrgRecibeSignups(orgId, recibe) {
  if (!orgId) return { ok: false, error: 'Organización no especificada' }
  try {
    const { data, error } = await supabase.rpc('set_org_recibe_signups', {
      p_org_id: orgId,
      p_recibe: !!recibe,
    })
    if (error) {
      console.warn('setOrgRecibeSignups error:', error)
      return { ok: false, error: error.message || 'Error al actualizar setting' }
    }
    if (!data?.ok) return { ok: false, error: data?.error || 'No se pudo actualizar' }
    return { ok: true, recibe: data.recibe, mensaje: data.mensaje }
  } catch (err) {
    console.error('setOrgRecibeSignups exception:', err)
    return { ok: false, error: 'Error procesando solicitud' }
  }
}

// Consultar si esta organización es receptora de signups directos
export async function getOrgRecibeSignups(orgId) {
  if (!orgId) return false
  try {
    const { data, error } = await supabase.rpc('get_org_recibe_signups', { p_org_id: orgId })
    if (error) {
      console.warn('getOrgRecibeSignups error:', error)
      return false
    }
    return !!data
  } catch (err) {
    console.error('getOrgRecibeSignups exception:', err)
    return false
  }
}

// Invitar usuario a organización (con envío real de email vía Supabase Auth)
export async function invitarUsuario(orgId, email, rol = 'viewer') {
  try {
    // Validar email
    if (!email || !email.includes('@')) {
      return { ok: false, error: 'Email inválido' }
    }

    const emailLower = email.trim().toLowerCase()

    // 1. Verificar que el usuario no existe ya en la organización
    const { data: existente } = await supabase
      .from('perfiles_usuario')
      .select('id, user_id')
      .eq('organizacion_id', orgId)
      .ilike('nombre_completo', emailLower)
      .maybeSingle()

    if (existente) {
      return { ok: false, error: 'Este usuario ya está en la organización' }
    }

    // 2. Crear el registro de invitación en perfiles_usuario
    const { data: invitacionData, error: insertError } = await supabase
      .from('perfiles_usuario')
      .insert([{
        nombre_completo: emailLower,
        organizacion_id: orgId,
        rol,
        activo: false, // Inactivo hasta que se registre
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Error crear invitación:', insertError)
      return { ok: false, error: 'Error al crear invitación' }
    }

    // 3. Enviar email de invitación usando Supabase Auth (magic link / OTP)
    // Esto envía un email REAL usando el sistema de email de Supabase
    const redirectUrl = window.location.origin
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email: emailLower,
      options: {
        shouldCreateUser: true, // Crear cuenta automáticamente al hacer click
        emailRedirectTo: redirectUrl,
        data: {
          invitacion_id: invitacionData.id,
          invited_role: rol,
          invited_org: orgId,
        },
      },
    })

    if (emailError) {
      // El email falló pero la invitación está creada
      console.warn('Error enviando email:', emailError)
      return {
        ok: true,
        emailEnviado: false,
        warning: `Invitación creada pero email no se envió: ${emailError.message}`,
        message: `Invitación creada para ${emailLower}. Copia el link manualmente.`,
        data: invitacionData,
      }
    }

    return {
      ok: true,
      emailEnviado: true,
      message: `✓ Invitación enviada por email a ${emailLower}`,
      data: invitacionData,
    }
  } catch (err) {
    console.error('invitarUsuario error:', err)
    return { ok: false, error: 'Error procesando invitación' }
  }
}

// Listar usuarios activos (con user_id) de una organización
export async function listarUsuariosOrg(orgId) {
  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('id, user_id, nombre_completo, rol, activo, ultimo_acceso, created_at, plan, trial_expira')
    .eq('organizacion_id', orgId)
    .not('user_id', 'is', null) // Solo usuarios registrados
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

// Listar invitaciones pendientes (sin user_id) de una organización
export async function listarInvitacionesPendientes(orgId) {
  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('id, nombre_completo, rol, activo, created_at')
    .eq('organizacion_id', orgId)
    .is('user_id', null) // Solo invitaciones pendientes
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('listarInvitacionesPendientes error:', error)
    return []
  }
  return data || []
}

// Cancelar/eliminar invitación pendiente
export async function cancelarInvitacion(invitacionId) {
  try {
    const { error } = await supabase
      .from('perfiles_usuario')
      .delete()
      .eq('id', invitacionId)
      .is('user_id', null) // Solo eliminar si es invitación pendiente

    if (error) {
      console.warn('cancelarInvitacion error:', error)
      return { ok: false, error: 'Error al cancelar invitación' }
    }

    return { ok: true, message: 'Invitación cancelada' }
  } catch (err) {
    console.error('cancelarInvitacion error:', err)
    return { ok: false, error: 'Error procesando cancelación' }
  }
}

// Re-enviar invitación (actualiza fecha y envía email nuevamente)
export async function reenviarInvitacion(invitacionId) {
  try {
    // 1. Obtener datos de la invitación
    const { data: invitacion, error: getError } = await supabase
      .from('perfiles_usuario')
      .select('id, nombre_completo, rol, organizacion_id')
      .eq('id', invitacionId)
      .is('user_id', null)
      .maybeSingle()

    if (getError || !invitacion) {
      return { ok: false, error: 'Invitación no encontrada' }
    }

    // 2. Actualizar timestamp
    const { error: updateError } = await supabase
      .from('perfiles_usuario')
      .update({
        ultimo_acceso: new Date().toISOString(),
      })
      .eq('id', invitacionId)

    if (updateError) {
      console.warn('reenviarInvitacion update error:', updateError)
    }

    // 3. Re-enviar email
    const redirectUrl = window.location.origin
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email: invitacion.nombre_completo,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectUrl,
        data: {
          invitacion_id: invitacion.id,
          invited_role: invitacion.rol,
          invited_org: invitacion.organizacion_id,
        },
      },
    })

    if (emailError) {
      console.warn('Error re-enviando email:', emailError)
      return {
        ok: true,
        emailEnviado: false,
        warning: `No se pudo enviar email: ${emailError.message}`,
        message: 'Invitación actualizada pero email no se envió',
      }
    }

    return {
      ok: true,
      emailEnviado: true,
      message: `✓ Email re-enviado a ${invitacion.nombre_completo}`,
    }
  } catch (err) {
    console.error('reenviarInvitacion error:', err)
    return { ok: false, error: 'Error procesando re-envío' }
  }
}

// Generar link de invitación (para copiar al clipboard)
export function generarLinkInvitacion(email) {
  const baseUrl = window.location.origin
  const params = new URLSearchParams({
    invitar: 'true',
    email: email,
  })
  return `${baseUrl}/?${params.toString()}`
}

// Actualizar rol de usuario
export async function actualizarRolUsuario(perfilId, nuevoRol) {
  const { error } = await supabase
    .from('perfiles_usuario')
    .update({ rol: nuevoRol })
    .eq('id', perfilId)

  return !error
}

// Deactivar usuario
export async function desactivarUsuario(perfilId) {
  const { error } = await supabase
    .from('perfiles_usuario')
    .update({ activo: false })
    .eq('id', perfilId)

  return !error
}

// Reactivar usuario y enviar email con link de acceso
export async function reactivarYEnviarEmail(perfilId) {
  try {
    // 1. Obtener datos del usuario
    const { data: perfil, error: getError } = await supabase
      .from('perfiles_usuario')
      .select('id, user_id, nombre_completo, rol, organizacion_id')
      .eq('id', perfilId)
      .maybeSingle()

    if (getError || !perfil) {
      return { ok: false, error: 'Usuario no encontrado' }
    }

    // 2. Reactivar el usuario
    const { error: updateError } = await supabase
      .from('perfiles_usuario')
      .update({
        activo: true,
        ultimo_acceso: new Date().toISOString(),
      })
      .eq('id', perfilId)

    if (updateError) {
      console.warn('reactivarYEnviarEmail update error:', updateError)
      return { ok: false, error: 'Error al reactivar usuario' }
    }

    // 3. Enviar email magic link
    const email = perfil.nombre_completo
    const redirectUrl = window.location.origin

    const { error: emailError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Ya existe el usuario
        emailRedirectTo: redirectUrl,
        data: {
          perfil_id: perfil.id,
          rol: perfil.rol,
          org: perfil.organizacion_id,
        },
      },
    })

    if (emailError) {
      console.warn('Error enviando email reactivación:', emailError)
      return {
        ok: true,
        emailEnviado: false,
        warning: `Usuario reactivado pero email no se envió: ${emailError.message}`,
        message: 'Usuario reactivado',
      }
    }

    return {
      ok: true,
      emailEnviado: true,
      message: `✓ Usuario reactivado y email enviado a ${email}`,
    }
  } catch (err) {
    console.error('reactivarYEnviarEmail error:', err)
    return { ok: false, error: 'Error procesando reactivación' }
  }
}

// Eliminar usuario completamente (borra el perfil)
// Nota: El registro en auth.users no se borra desde el cliente
// Si el usuario intenta acceder, no tendrá perfil y no podrá usar la app
export async function eliminarUsuario(perfilId) {
  try {
    const { error } = await supabase
      .from('perfiles_usuario')
      .delete()
      .eq('id', perfilId)

    if (error) {
      console.warn('eliminarUsuario error:', error)
      return { ok: false, error: 'Error al eliminar usuario' }
    }

    return { ok: true, message: 'Usuario eliminado correctamente' }
  } catch (err) {
    console.error('eliminarUsuario error:', err)
    return { ok: false, error: 'Error procesando eliminación' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Sistema de Tokens por Usuario (Generación de Informes) ──────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtener tokens disponibles del usuario actual
 * @param {string} userId
 * @returns {Promise<{disponibles: number, usados: number}>}
 */
export async function obtenerTokensUsuario(userId) {
  if (!userId) return { disponibles: 0, usados: 0 }

  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('tokens_disponibles, tokens_usados')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    console.warn('obtenerTokensUsuario error:', error)
    return { disponibles: 0, usados: 0 }
  }

  return {
    disponibles: data.tokens_disponibles ?? 0,
    usados: data.tokens_usados ?? 0,
  }
}

/**
 * Consumir 1 token (al generar un informe)
 * @param {string} userId
 * @returns {Promise<{ok: boolean, tokensRestantes?: number, error?: string}>}
 */
export async function consumirToken(userId) {
  if (!userId) return { ok: false, error: 'Usuario no identificado' }

  try {
    // 1. Verificar tokens disponibles
    const { data: perfil, error: getError } = await supabase
      .from('perfiles_usuario')
      .select('id, tokens_disponibles, tokens_usados')
      .eq('user_id', userId)
      .maybeSingle()

    if (getError || !perfil) {
      return { ok: false, error: 'Perfil no encontrado' }
    }

    if (perfil.tokens_disponibles <= 0) {
      return {
        ok: false,
        error: 'No tienes tokens disponibles. Contacta al administrador para obtener más.',
        sinTokens: true,
      }
    }

    // 2. Descontar 1 token y aumentar usados
    const { error: updateError } = await supabase
      .from('perfiles_usuario')
      .update({
        tokens_disponibles: perfil.tokens_disponibles - 1,
        tokens_usados: perfil.tokens_usados + 1,
      })
      .eq('id', perfil.id)

    if (updateError) {
      console.warn('consumirToken update error:', updateError)
      return { ok: false, error: 'Error al consumir token' }
    }

    return {
      ok: true,
      tokensRestantes: perfil.tokens_disponibles - 1,
      tokensUsados: perfil.tokens_usados + 1,
    }
  } catch (err) {
    console.error('consumirToken error:', err)
    return { ok: false, error: 'Error procesando consumo' }
  }
}

/**
 * Asignar tokens a un usuario (admin)
 * @param {string} perfilId
 * @param {number} cantidad - Tokens a agregar (positivo) o quitar (negativo)
 * @returns {Promise<{ok: boolean, nuevoTotal?: number, error?: string}>}
 */
export async function asignarTokens(perfilId, cantidad) {
  if (!perfilId) return { ok: false, error: 'Perfil no especificado' }

  try {
    // Obtener tokens actuales
    const { data: perfil, error: getError } = await supabase
      .from('perfiles_usuario')
      .select('id, tokens_disponibles, nombre_completo')
      .eq('id', perfilId)
      .maybeSingle()

    if (getError || !perfil) {
      return { ok: false, error: 'Usuario no encontrado' }
    }

    const nuevoTotal = Math.max(0, (perfil.tokens_disponibles ?? 0) + cantidad)

    const { error: updateError } = await supabase
      .from('perfiles_usuario')
      .update({ tokens_disponibles: nuevoTotal })
      .eq('id', perfilId)

    if (updateError) {
      console.warn('asignarTokens error:', updateError)
      return { ok: false, error: 'Error al asignar tokens' }
    }

    return {
      ok: true,
      nuevoTotal,
      message: `Tokens actualizados: ${perfil.nombre_completo} ahora tiene ${nuevoTotal} tokens`,
    }
  } catch (err) {
    console.error('asignarTokens error:', err)
    return { ok: false, error: 'Error procesando asignación' }
  }
}

/**
 * Establecer cantidad exacta de tokens (admin)
 * @param {string} perfilId
 * @param {number} cantidad - Total absoluto de tokens
 */
export async function establecerTokens(perfilId, cantidad) {
  if (!perfilId) return { ok: false, error: 'Perfil no especificado' }
  const total = Math.max(0, parseInt(cantidad) || 0)

  try {
    const { error } = await supabase
      .from('perfiles_usuario')
      .update({ tokens_disponibles: total })
      .eq('id', perfilId)

    if (error) {
      return { ok: false, error: 'Error al establecer tokens' }
    }

    return { ok: true, nuevoTotal: total }
  } catch (err) {
    console.error('establecerTokens error:', err)
    return { ok: false, error: 'Error procesando' }
  }
}

/**
 * Resetear contador de tokens usados (admin)
 * @param {string} perfilId
 */
export async function resetearTokensUsados(perfilId) {
  if (!perfilId) return { ok: false, error: 'Perfil no especificado' }

  try {
    const { error } = await supabase
      .from('perfiles_usuario')
      .update({ tokens_usados: 0 })
      .eq('id', perfilId)

    if (error) {
      return { ok: false, error: 'Error al resetear' }
    }

    return { ok: true, message: 'Contador de tokens reseteado' }
  } catch (err) {
    console.error('resetearTokensUsados error:', err)
    return { ok: false, error: 'Error procesando' }
  }
}

/**
 * Listar usuarios con info de tokens (para panel admin)
 * @param {string} orgId
 */
export async function listarUsuariosConTokens(orgId) {
  if (!orgId) return []

  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('id, user_id, nombre_completo, rol, activo, tokens_disponibles, tokens_usados, created_at, ultimo_acceso')
    .eq('organizacion_id', orgId)
    .not('user_id', 'is', null) // Solo usuarios registrados
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('listarUsuariosConTokens error:', error)
    return []
  }
  return data || []
}

// Migración de token a usuario
export async function migrarTokenAUsuario(token, userId, orgId) {
  const { error } = await supabase
    .from('tokens_legado')
    .insert([{
      token,
      user_id: userId,
      organizacion_id: orgId,
      migrado_en: new Date().toISOString(),
    }])

  return !error
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Proyectos con nuevo schema (user_id + org_id) ─────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Listar proyectos del usuario
export async function listarProyectosUsuario(userId, orgId) {
  if (!userId || !orgId) return []

  const { data, error } = await supabase
    .from('proyectos')
    .select('id, user_id, organizacion_id, nombre, saved_at, updated_at, snapshots, data')
    .eq('user_id', userId)
    .eq('organizacion_id', orgId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.warn('listarProyectosUsuario error:', error)
    return null
  }
  return data
}

// Guardar proyecto nuevo
export async function guardarProyectoUsuario(userId, orgId, id, nombre, data, snapshots = []) {
  if (!userId || !orgId) return false

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('proyectos')
    .insert([{
      id,
      user_id: userId,
      organizacion_id: orgId,
      nombre,
      data,
      snapshots,
      creado_por: userId,
      saved_at: now,
      updated_at: now,
    }])

  if (error) {
    console.warn('guardarProyectoUsuario error:', error)
    return false
  }
  return true
}

// Actualizar proyecto existente
export async function actualizarProyectoUsuario(userId, orgId, id, nombre, data, snapshots = []) {
  if (!userId || !orgId) return false

  const { error } = await supabase
    .from('proyectos')
    .update({
      nombre,
      data,
      snapshots,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .eq('organizacion_id', orgId)

  if (error) {
    console.warn('actualizarProyectoUsuario error:', error)
    return false
  }
  return true
}

// Eliminar proyecto
export async function eliminarProyectoUsuario(userId, orgId, id) {
  if (!userId || !orgId) return false

  const { error } = await supabase
    .from('proyectos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('organizacion_id', orgId)

  if (error) {
    console.warn('eliminarProyectoUsuario error:', error)
    return false
  }
  return true
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Token Legacy: Migración automática de tokens antiguos ─────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtener token legado de la tabla de tokens antiguos
 * @param {string} token - Token en formato OGUC-XXXX-XXXX-XXXX
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function obtenerTokenLegacy(token) {
  const tok = token.trim().toUpperCase()
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('token', tok)
    .single()

  if (error || !data) {
    return { ok: false, error: 'Token no válido o expirado' }
  }

  if (!data.activo) {
    return { ok: false, error: 'Token inactivo' }
  }

  if (new Date(data.expires_at) < new Date()) {
    return { ok: false, error: 'Token expirado' }
  }

  return { ok: true, data }
}

/**
 * Contar proyectos asociados a un token
 * @param {string} token - Token en formato OGUC-XXXX-XXXX-XXXX
 * @returns {Promise<number>} - Cantidad de proyectos
 */
export async function contarProyectosToken(token) {
  const tok = token.trim().toUpperCase()
  const { count, error } = await supabase
    .from('proyectos')
    .select('*', { count: 'exact', head: true })
    .eq('token', tok)

  if (error) {
    console.warn('contarProyectosToken error:', error)
    return 0
  }

  return count || 0
}

/**
 * Convertir token legado a usuario con Auth
 * Crea usuario en Auth, perfil, org, y migra proyectos
 * @param {string} token - Token antiguo
 * @param {string} email - Email nuevo
 * @param {string} password - Contraseña nueva
 * @param {string} nombreCompleto - Nombre del usuario
 * @returns {Promise<{ok: boolean, user?: object, orgId?: string, error?: string}>}
 */
export async function convertirTokenAUsuario(token, email, password, nombreCompleto) {
  try {
    const tok = token.trim().toUpperCase()

    // 1. Validar token legado
    const { data: tokenData, error: tokenErr } = await supabase
      .from('tokens')
      .select('*')
      .eq('token', tok)
      .single()

    if (tokenErr || !tokenData) {
      return { ok: false, error: 'Token no encontrado' }
    }

    if (!tokenData.activo) {
      return { ok: false, error: 'Token inactivo' }
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return { ok: false, error: 'Token expirado' }
    }

    // 2. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      return { ok: false, error: authError?.message || 'Error al crear usuario' }
    }

    const userId = authData.user.id

    // 3. Crear organización personal
    const { data: orgData, error: orgError } = await supabase
      .from('organizaciones')
      .insert([{
        nombre: `${nombreCompleto} - Workspace (migrado)`,
        propietario_id: userId,
        plan: 'free',
        activa: true,
      }])
      .select()
      .single()

    if (orgError) {
      console.warn('Error creando org:', orgError)
      return { ok: false, error: 'Error al crear workspace' }
    }

    const orgId = orgData.id

    // 4. Crear perfil usuario
    const { error: perfilError } = await supabase
      .from('perfiles_usuario')
      .insert([{
        user_id: userId,
        organizacion_id: orgId,
        nombre_completo: nombreCompleto,
        rol: 'admin',
        activo: true,
      }])

    if (perfilError) {
      console.warn('Error creando perfil:', perfilError)
      return { ok: false, error: 'Error al crear perfil' }
    }

    // 5. Migrar proyectos (update projects del token a los nuevos user_id + org_id)
    const { error: migrateErr } = await supabase
      .from('proyectos')
      .update({ user_id: userId, organizacion_id: orgId, creado_por: userId })
      .eq('token', tok)

    if (migrateErr) {
      console.warn('Error migrando proyectos:', migrateErr)
      // No es crítico si no se migran los proyectos, continuamos
    }

    // 6. Registrar migración en tokens_legado
    const { error: migracionErr } = await supabase
      .from('tokens_legado')
      .insert([{
        token: tok,
        user_id: userId,
        organizacion_id: orgId,
        migrado_en: new Date().toISOString(),
      }])

    if (migracionErr) {
      console.warn('Error registrando migración:', migracionErr)
    }

    return { ok: true, user: authData.user, orgId }
  } catch (err) {
    console.error('convertirTokenAUsuario error:', err)
    return { ok: false, error: 'Error al procesar migración' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Admin Stats: Estadísticas para administradores ──────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtener estadísticas de una organización
 * @param {string} orgId - ID de la organización
 * @returns {Promise<{ok: boolean, data?: object}>}
 */
export async function obtenerStatsOrganizacion(orgId) {
  if (!orgId) return { ok: false, data: null }

  try {
    // Total usuarios
    const { count: totalUsuarios } = await supabase
      .from('perfiles_usuario')
      .select('*', { count: 'exact', head: true })
      .eq('organizacion_id', orgId)
      .eq('activo', true)

    // Total proyectos
    const { count: totalProyectos } = await supabase
      .from('proyectos')
      .select('*', { count: 'exact', head: true })
      .eq('organizacion_id', orgId)

    // Proyectos este mes (usa saved_at, no created_at)
    const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { count: proyectosEsteMes } = await supabase
      .from('proyectos')
      .select('*', { count: 'exact', head: true })
      .eq('organizacion_id', orgId)
      .gte('saved_at', primerDiaMes)

    // Último acceso
    const { data: ultimoAcceso } = await supabase
      .from('perfiles_usuario')
      .select('ultimo_acceso')
      .eq('organizacion_id', orgId)
      .eq('activo', true)
      .order('ultimo_acceso', { ascending: false })
      .limit(1)

    const ultimoAccesoTime = ultimoAcceso?.[0]?.ultimo_acceso
      ? formatTiempoTranscurrido(ultimoAcceso[0].ultimo_acceso)
      : 'Sin registro'

    return {
      ok: true,
      data: {
        totalUsuarios: totalUsuarios || 0,
        totalProyectos: totalProyectos || 0,
        proyectosEsteMes: proyectosEsteMes || 0,
        ultimoAcceso: ultimoAccesoTime,
      },
    }
  } catch (err) {
    console.warn('obtenerStatsOrganizacion error:', err)
    return { ok: false, data: null }
  }
}

/**
 * Obtener actividad reciente de una organización
 * @param {string} orgId - ID de la organización
 * @param {number} limit - Cantidad de registros a retornar (default: 20)
 * @returns {Promise<array>}
 */
export async function obtenerActividadOrganizacion(orgId, limit = 20) {
  if (!orgId) return []

  try {
    const { data, error } = await supabase
      .from('registro_auditoria')
      .select('*')
      .eq('organizacion_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('obtenerActividadOrganizacion error:', error)
      return []
    }

    return data?.map(item => ({
      ...item,
      tiempoTranscurrido: formatTiempoTranscurrido(item.created_at),
    })) || []
  } catch (err) {
    console.warn('obtenerActividadOrganizacion error:', err)
    return []
  }
}

/**
 * Obtener usuarios más activos (con más proyectos)
 * @param {string} orgId - ID de la organización
 * @param {number} limit - Cantidad de usuarios a retornar (default: 5)
 * @returns {Promise<array>}
 */
export async function obtenerUsuariosActivos(orgId, limit = 5) {
  if (!orgId) return []

  try {
    // Obtener usuariosy contar sus proyectos
    const { data: usuarios } = await supabase
      .from('perfiles_usuario')
      .select('id, nombre_completo, user_id')
      .eq('organizacion_id', orgId)
      .eq('activo', true)

    if (!usuarios || usuarios.length === 0) return []

    // Contar proyectos por usuario
    const usuariosConCuenta = await Promise.all(
      usuarios.map(async (user) => {
        const { count } = await supabase
          .from('proyectos')
          .select('*', { count: 'exact', head: true })
          .eq('organizacion_id', orgId)
          .eq('user_id', user.user_id)

        return {
          id: user.id,
          nombre_completo: user.nombre_completo,
          cantidad_proyectos: count || 0,
        }
      })
    )

    return usuariosConCuenta
      .sort((a, b) => b.cantidad_proyectos - a.cantidad_proyectos)
      .slice(0, limit)
  } catch (err) {
    console.warn('obtenerUsuariosActivos error:', err)
    return []
  }
}

// ─── Uso de plataforma (métricas para panel Admin) ────────────────────────────
export async function obtenerUsagePlatforma() {
  try {
    const { data, error } = await supabase.rpc('get_platform_usage')
    if (error) throw error
    return { ok: true, data }
  } catch (err) {
    console.warn('obtenerUsagePlatforma error:', err)
    return { ok: false, error: err.message }
  }
}

// ─── Org receptora de signups directos ────────────────────────────────────────
export async function obtenerRecibeSignups(orgId) {
  if (!orgId) return { ok: false, data: false }
  try {
    const { data, error } = await supabase.rpc('get_org_recibe_signups', { p_org_id: orgId })
    if (error) throw error
    return { ok: true, data: !!data }
  } catch (err) {
    console.warn('obtenerRecibeSignups error:', err)
    return { ok: false, data: false }
  }
}

export async function setRecibeSignups(orgId, recibe) {
  if (!orgId) return { ok: false, error: 'Sin orgId' }
  try {
    const { data, error } = await supabase.rpc('set_org_recibe_signups', {
      p_org_id: orgId,
      p_recibe: recibe,
    })
    if (error) throw error
    return { ok: data?.ok ?? true, mensaje: data?.mensaje }
  } catch (err) {
    console.warn('setRecibeSignups error:', err)
    return { ok: false, error: err.message }
  }
}

// ─── Planes de usuario (Pro / Trial / Free) ──────────────────────────────────
export async function activarPruebaPro(perfilId, dias = 14) {
  if (!perfilId) return { ok: false, error: 'Sin perfilId' }
  try {
    const { data, error } = await supabase.rpc('activar_prueba_pro', {
      p_perfil_id: perfilId, p_dias: dias,
    })
    if (error) throw error
    return data?.ok ? data : { ok: false, error: data?.error || 'Error desconocido' }
  } catch (err) {
    console.warn('activarPruebaPro error:', err)
    return { ok: false, error: err.message }
  }
}

export async function cambiarPlanUsuario(perfilId, plan) {
  if (!perfilId || !['free', 'pro'].includes(plan)) {
    return { ok: false, error: 'Parámetros inválidos' }
  }
  try {
    const { data, error } = await supabase.rpc('cambiar_plan_usuario', {
      p_perfil_id: perfilId, p_plan: plan,
    })
    if (error) throw error
    return data?.ok ? data : { ok: false, error: data?.error || 'Error desconocido' }
  } catch (err) {
    console.warn('cambiarPlanUsuario error:', err)
    return { ok: false, error: err.message }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatTiempoTranscurrido(fechaISO) {
  if (!fechaISO) return '—'

  const fecha = new Date(fechaISO)
  const ahora = new Date()
  const diffMs = ahora - fecha
  const diffSeg = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSeg / 60)
  const diffHoras = Math.floor(diffMin / 60)
  const diffDias = Math.floor(diffHoras / 24)

  if (diffSeg < 60) return 'hace unos segundos'
  if (diffMin < 60) return `hace ${diffMin}m`
  if (diffHoras < 24) return `hace ${diffHoras}h`
  if (diffDias < 7) return `hace ${diffDias}d`

  return fecha.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })
}

// ─── Inicializar tablas OGUC en Supabase (si no existen) ─────────────────────
// Datos de OGUC Tabla 1 (Tít. 4 Cap. 3 - Seguridad contra incendios)
const OGUC_RF_LETRAS_DATA = {
  a: { 1:'F180', 2:'F120', 3:'F120', 4:'F120', 5:'F120', 6:'F30',  7:'F60',  8:'F120', 9:'F60'  },
  b: { 1:'F150', 2:'F120', 3:'F90',  4:'F90',  5:'F90',  6:'F15',  7:'F30',  8:'F90',  9:'F60'  },
  c: { 1:'F120', 2:'F90',  3:'F60',  4:'F60',  5:'F60',  6:null,   7:'F15',  8:'F60',  9:'F30'  },
  d: { 1:'F120', 2:'F60',  3:'F60',  4:'F60',  5:'F30',  6:null,   7:null,   8:'F30',  9:'F15'  },
}

const OGUC_ELEM_COL_DATA = {
  estructura:   2,
  muros_sep:    3,
  cajas_esc:    4,
  muros_mismo:  5,
  paredes_div:  6,
  cubierta:     7,
  entrepisos:   8,
  escaleras:    9,
}

const OGUC_TABLA1_DATA = {
  Habitacional: [
    { m2Min: 0, m2Max: Infinity, letras: ['d','d','c','c','b','a','a'] },
  ],
  'Hoteles o similares': [
    { m2Min: 5001, m2Max: Infinity, letras: ['c','b','a','a','a','a','a'] },
    { m2Min: 1501, m2Max: 5000,     letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 501,  m2Max: 1500,     letras: ['c','c','b','b','a','a','a'] },
    { m2Min: 0,    m2Max: 500,      letras: ['d','c','b','b','a','a','a'] },
  ],
  Oficinas: [
    { m2Min: 1501, m2Max: Infinity, letras: ['c','c','b','b','a','a','a'] },
    { m2Min: 501,  m2Max: 1500,     letras: ['c','c','c','b','b','a','a'] },
    { m2Min: 0,    m2Max: 500,      letras: ['d','c','c','b','b','a','a'] },
  ],
  Museos: [
    { m2Min: 1501, m2Max: Infinity, letras: ['c','c','b','b','b','a','a'] },
    { m2Min: 501,  m2Max: 1500,     letras: ['c','c','c','b','b','a','a'] },
    { m2Min: 0,    m2Max: 500,      letras: ['d','c','c','b','b','a','a'] },
  ],
  'Salud (clínica, hospital, laboratorio)': [
    { m2Min: 1001, m2Max: Infinity, letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 1000,     letras: ['c','c','b','b','a','a','a'] },
  ],
  'Salud (policlínico)': [
    { m2Min: 401,  m2Max: Infinity, letras: ['c','c','b','b','b','a','a'] },
    { m2Min: 0,    m2Max: 400,      letras: ['d','c','c','b','b','a','a'] },
  ],
  'Restaurantes y fuentes de soda': [
    { m2Min: 501,  m2Max: Infinity, letras: ['b','a','a','a','a','a','a'] },
    { m2Min: 251,  m2Max: 500,      letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 250,      letras: ['d','c','c','b','b','a','a'] },
  ],
  'Locales comerciales': [
    { m2Min: 501,  m2Max: Infinity, letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 201,  m2Max: 500,      letras: ['c','c','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 200,      letras: ['d','c','b','b','b','a','a'] },
  ],
  'Educación (pre/primaria)': [
    { m2Min: 1001, m2Max: Infinity, letras: ['b','a','a','a','a','a','a'] },
    { m2Min: 0,    m2Max: 1000,     letras: ['c','b','b','a','a','a','a'] },
  ],
  'Educación (secundaria/superior)': [
    { m2Min: 5001, m2Max: Infinity, letras: ['b','a','a','a','a','a','a'] },
    { m2Min: 1001, m2Max: 5000,     letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 1000,     letras: ['c','c','b','b','a','a','a'] },
  ],
}

/**
 * Inicializa tablas OGUC en Supabase (idempotente)
 * Se ejecuta en background, no bloquea
 */
export async function inicializarTablasOGUC() {
  try {
    // Verificar si ya existen
    const { count: countRF } = await supabase
      .from('oguc_rf_letras')
      .select('*', { count: 'exact', head: true })

    if ((countRF || 0) > 0) {
      console.log('✓ Tablas OGUC ya inicializadas')
      return { ok: true, msg: 'Already initialized' }
    }

    // Crear tabla oguc_rf_letras
    const { error: errRF } = await supabase.from('oguc_rf_letras').insert({
      id: 'main',
      data: OGUC_RF_LETRAS_DATA,
      created_at: new Date().toISOString(),
    })

    if (errRF) throw errRF

    // Crear tabla oguc_elem_col
    const { error: errElem } = await supabase.from('oguc_elem_col').insert({
      id: 'main',
      data: OGUC_ELEM_COL_DATA,
      created_at: new Date().toISOString(),
    })

    if (errElem) throw errElem

    // Crear tabla oguc_tabla1
    const { error: errTab } = await supabase.from('oguc_tabla1').insert({
      id: 'main',
      data: OGUC_TABLA1_DATA,
      created_at: new Date().toISOString(),
    })

    if (errTab) throw errTab

    console.log('✓ Tablas OGUC inicializadas correctamente')
    return { ok: true, msg: 'Initialized' }
  } catch (error) {
    console.warn('⚠ Error inicializando tablas OGUC:', error.message)
    return { ok: false, error: error.message }
  }
}

// ─── PostgreSQL TRIGGER PARA AUTO-CREAR PERFIL AL REGISTRARSE ──────────────────
//
// IMPORTANTE: Ejecuta una sola vez en la consola SQL de Supabase:
// Ver: /sql/001_create_user_profile_trigger.sql
//
// El trigger automáticamente crea un perfil en perfiles_usuario cuando:
// - Un usuario se registra en auth.users
//
// Evita el error 406 "Cannot coerce result" en obtenerPerfil() porque:
// - Antes: Usuario se registra → No hay perfil → obtenerPerfil retorna null
// - Después: Usuario se registra → Trigger crea perfil → obtenerPerfil lo encuentra
//
// Estado: ⚠ Pendiente de ejecutar el SQL una sola vez en Supabase console
// Ubicación: https://app.supabase.com/project/srukzfoerdgcaymnriax/sql/
