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
