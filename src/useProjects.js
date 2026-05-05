import { createProjectStore } from './lib/projectStorage.js'
import { validarNombreProyecto } from './utils/validation.js'
import { createError, createSuccess } from './utils/errors.js'

const LS_AUTOSAVE = 'nc_autosave_v1'

export function useProjects(userId, orgId) {
  const store = createProjectStore(userId, orgId)

  // ── Listar ────────────────────────────────────────────────────────────────
  async function listarProyectos() {
    return await store.list()
  }

  // ── Guardar nuevo ─────────────────────────────────────────────────────────
  async function guardarNuevo(nombre, data) {
    // Validar nombre
    const errorNombre = validarNombreProyecto(nombre)
    if (errorNombre) {
      return createError(errorNombre, 'VALIDATION')
    }

    // Validar que data sea un objeto
    if (!data || typeof data !== 'object') {
      return createError('Datos de proyecto inválidos', 'VALIDATION')
    }

    try {
      const id = await store.create(nombre, data)
      return createSuccess({ id })
    } catch (error) {
      return createError(
        error.message || 'Error al guardar proyecto',
        'DB',
        error.toString()
      )
    }
  }

  // ── Sobrescribir (actualizar) ──────────────────────────────────────────────
  async function sobrescribir(id, nombre, data) {
    // Validar que id exista
    if (!id) {
      return createError('ID de proyecto requerido', 'VALIDATION')
    }

    // Validar nombre
    const errorNombre = validarNombreProyecto(nombre)
    if (errorNombre) {
      return createError(errorNombre, 'VALIDATION')
    }

    // Validar que data sea un objeto
    if (!data || typeof data !== 'object') {
      return createError('Datos de proyecto inválidos', 'VALIDATION')
    }

    try {
      const lista = await listarProyectos()
      const original = lista.find(p => p.id === id)
      if (!original) {
        return createError('Proyecto no encontrado', 'NOT_FOUND')
      }

      const prevSnaps = original?.snapshots || []
      const ok = await store.update(id, nombre, data, prevSnaps)
      return createSuccess({ ok })
    } catch (error) {
      return createError(
        error.message || 'Error al actualizar proyecto',
        'DB',
        error.toString()
      )
    }
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────
  async function eliminarProyecto(id) {
    return await store.delete(id)
  }

  // ── Duplicar ──────────────────────────────────────────────────────────────
  async function duplicarProyecto(id) {
    const lista = await listarProyectos()
    return await store.duplicate(id, lista)
  }

  // ── Restaurar snapshot ────────────────────────────────────────────────────
  async function restaurarSnapshot(id, snapIdx) {
    const lista = await listarProyectos()
    return await store.getSnapshot(id, lista, snapIdx)
  }

  // ── AutoGuardar (solo localStorage, demasiado frecuente para DB) ──────────
  function autoGuardar(data) {
    try {
      localStorage.setItem(LS_AUTOSAVE, JSON.stringify({ ...data, lastSaved: new Date().toISOString() }))
    } catch(e) {
      console.warn('AutoSave error:', e)
    }
  }

  function cargarAutoguardado() {
    try { return JSON.parse(localStorage.getItem(LS_AUTOSAVE)) } catch { return null }
  }

  // ── Export / Import JSON ──────────────────────────────────────────────────
  function exportarJSON(data, nombre) {
    const blob = new Blob([JSON.stringify({ version: 1, nombre, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${nombre.replace(/[^a-z0-9]/gi, '_')}_normacheck.json`; a.click()
    URL.revokeObjectURL(url)
  }

  function importarJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => { try { resolve(JSON.parse(e.target.result)) } catch { reject(new Error('Archivo JSON inválido')) } }
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsText(file)
    })
  }

  // ── Migrar desde localStorage a Supabase ──────────────────────────────────
  async function migrarDesdeLocalStorage() {
    if (!userId || !orgId) return 0
    const localStore = createProjectStore(null, null)
    const local = await localStore.list()
    if (!local.length) return 0
    let count = 0
    for (const p of local) {
      const data = { ...p }
      delete data.id
      delete data.savedAt
      delete data.nombre
      delete data.snapshots
      const id = await store.create(p.nombre, data)
      if (id) count++
    }
    return count
  }

  return {
    listarProyectos, guardarNuevo, sobrescribir, eliminarProyecto,
    duplicarProyecto, restaurarSnapshot, autoGuardar, cargarAutoguardado,
    exportarJSON, importarJSON, migrarDesdeLocalStorage,
  }
}
