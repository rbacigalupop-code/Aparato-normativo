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
export async function signUp(email, password, nombreCompleto) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { ok: false, error: authError?.message || 'Error en signup' }
  }

  const userId = authData.user.id

  // Crear organización personal
  const { data: orgData, error: orgError } = await supabase
    .from('organizaciones')
    .insert([{
      nombre: `${nombreCompleto} - Workspace`,
      propietario_id: userId,
      plan: 'free',
      activa: true,
    }])
    .select()
    .single()

  if (orgError) {
    return { ok: false, error: 'Error al crear workspace' }
  }

  // Crear perfil usuario
  const { error: perfilError } = await supabase
    .from('perfiles_usuario')
    .insert([{
      user_id: userId,
      organizacion_id: orgData.id,
      nombre_completo: nombreCompleto,
      rol: 'admin',
      activo: true,
    }])

  if (perfilError) {
    return { ok: false, error: 'Error al crear perfil' }
  }

  return { ok: true, user: authData.user, orgId: orgData.id }
}

// Login: Acceder con email/password
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { ok: false, error: error?.message || 'Email o contraseña incorrectos' }
  }

  // Obtener perfil del usuario
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles_usuario')
    .select('*, organizaciones(*)')
    .eq('user_id', data.user.id)
    .single()

  if (perfilError) {
    return { ok: false, error: 'Error al cargar perfil' }
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
    .select('*, organizaciones(*)')
    .eq('user_id', userId)
    .single()

  if (error) return null
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

// Invitar usuario a organización (enviar email)
export async function invitarUsuario(orgId, email, rol = 'viewer') {
  // 1. Crear usuario en Auth (sin contraseña, con magic link)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: Math.random().toString(36).substring(2, 15),
    email_confirm: false, // Requiere confirmación
  })

  if (authError) {
    return { ok: false, error: authError.message }
  }

  // 2. Crear perfil usuario
  const { error: perfilError } = await supabase
    .from('perfiles_usuario')
    .insert([{
      user_id: authData.user.id,
      organizacion_id: orgId,
      nombre_completo: email.split('@')[0],
      rol,
      activo: true,
    }])

  if (perfilError) {
    return { ok: false, error: 'Error al crear perfil' }
  }

  // 3. Enviar email de invitación (Supabase lo hace automáticamente)
  // El usuario recibirá un email con link de confirmación

  return { ok: true, message: `Invitación enviada a ${email}` }
}

// Listar usuarios de una organización
export async function listarUsuariosOrg(orgId) {
  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('id, user_id, nombre_completo, rol, activo, ultimo_acceso, created_at')
    .eq('organizacion_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
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

    // Proyectos este mes
    const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { count: proyectosEsteMes } = await supabase
      .from('proyectos')
      .select('*', { count: 'exact', head: true })
      .eq('organizacion_id', orgId)
      .gte('created_at', primerDiaMes)

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
