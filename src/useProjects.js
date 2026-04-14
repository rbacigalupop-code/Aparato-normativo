import {
  listarProyectosDB,
  guardarProyectoDB,
  sobrescribirProyectoDB,
  eliminarProyectoDB,
} from './supabase.js'

const LS_AUTOSAVE  = 'nc_autosave_v1'
const LS_PROJECTS  = 'nc_projects_v1'   // fallback cuando no hay token

export function useProjects(token) {
  const hasToken = !!token

  // ── Listar ────────────────────────────────────────────────────────────────
  async function listarProyectos() {
    if (hasToken) {
      const rows = await listarProyectosDB(token)
      if (rows !== null) return rows.map(r => ({
        ...r,
        savedAt: r.updated_at,
        ...(r.data || {}),
      }))
    }
    // fallback localStorage
    try {
      const raw = JSON.parse(localStorage.getItem(LS_PROJECTS)) || []
      return raw.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
    } catch { return [] }
  }

  // ── Guardar nuevo ─────────────────────────────────────────────────────────
  async function guardarNuevo(nombre, data) {
    const id = Date.now().toString()
    if (hasToken) {
      await guardarProyectoDB(token, id, nombre, data, [])
    } else {
      const item = { id, nombre, savedAt: new Date().toISOString(), snapshots: [], ...data }
      const lista = listarProyectosLS()
      localStorage.setItem(LS_PROJECTS, JSON.stringify([item, ...lista]))
    }
    return id
  }

  // ── Sobrescribir (actualizar) ──────────────────────────────────────────────
  async function sobrescribir(id, nombre, data) {
    if (hasToken) {
      // Obtener snapshots anteriores
      const lista = await listarProyectos()
      const original = lista.find(p => p.id === id)
      const prevSnaps = original?.snapshots || []
      const snap = {
        savedAt: original?.savedAt || new Date().toISOString(),
        proy: original?.proy,
        termica: original?.termica,
        calcUInit: original?.calcUInit,
        fachadas: original?.fachadas,
        fachadasNextId: original?.fachadasNextId,
        notas: original?.notas,
      }
      const newSnapshots = [snap, ...prevSnaps].slice(0, 10)
      await sobrescribirProyectoDB(token, id, nombre, data, newSnapshots)
    } else {
      const lista = listarProyectosLS()
      const original = lista.find(p => p.id === id)
      const snapshots = original?.snapshots || []
      const snap = {
        savedAt: original?.savedAt || new Date().toISOString(),
        proy: original?.proy, termica: original?.termica,
        calcUInit: original?.calcUInit, fachadas: original?.fachadas,
        fachadasNextId: original?.fachadasNextId, notas: original?.notas,
      }
      const newSnapshots = [snap, ...snapshots].slice(0, 10)
      const updated = lista.map(p =>
        p.id === id ? { ...p, nombre, savedAt: new Date().toISOString(), snapshots: newSnapshots, ...data } : p
      )
      localStorage.setItem(LS_PROJECTS, JSON.stringify(updated))
    }
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────
  async function eliminarProyecto(id) {
    if (hasToken) {
      await eliminarProyectoDB(token, id)
    } else {
      const lista = listarProyectosLS().filter(p => p.id !== id)
      localStorage.setItem(LS_PROJECTS, JSON.stringify(lista))
    }
  }

  // ── Duplicar ──────────────────────────────────────────────────────────────
  async function duplicarProyecto(id) {
    const lista = await listarProyectos()
    const original = lista.find(p => p.id === id)
    if (!original) return null
    const newId = Date.now().toString()
    const nombre = `Copia de ${original.nombre}`
    const data = {
      proy: original.proy, termica: original.termica,
      calcUInit: original.calcUInit, fachadas: original.fachadas,
      fachadasNextId: original.fachadasNextId, notas: original.notas,
    }
    if (hasToken) {
      await guardarProyectoDB(token, newId, nombre, data, [])
    } else {
      const copia = { ...original, id: newId, nombre, savedAt: new Date().toISOString(), snapshots: [] }
      localStorage.setItem(LS_PROJECTS, JSON.stringify([copia, ...listarProyectosLS()]))
    }
    return newId
  }

  // ── Restaurar snapshot ────────────────────────────────────────────────────
  async function restaurarSnapshot(id, snapIdx) {
    const lista = await listarProyectos()
    const proyecto = lista.find(p => p.id === id)
    return proyecto?.snapshots?.[snapIdx] ?? null
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
    if (!hasToken) return 0
    const local = listarProyectosLS()
    if (!local.length) return 0
    let count = 0
    for (const p of local) {
      const data = { proy: p.proy, termica: p.termica, calcUInit: p.calcUInit, fachadas: p.fachadas, fachadasNextId: p.fachadasNextId, notas: p.notas }
      const ok = await guardarProyectoDB(token, p.id, p.nombre, data, p.snapshots || [])
      if (ok) count++
    }
    return count
  }

  return {
    listarProyectos, guardarNuevo, sobrescribir, eliminarProyecto,
    duplicarProyecto, restaurarSnapshot, autoGuardar, cargarAutoguardado,
    exportarJSON, importarJSON, migrarDesdeLocalStorage,
  }
}

// ── helper local (no export) ────────────────────────────────────────────────
function listarProyectosLS() {
  try { return JSON.parse(localStorage.getItem('nc_projects_v1')) || [] } catch { return [] }
}
