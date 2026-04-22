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
