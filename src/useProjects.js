const LS_PROJECTS = 'nc_projects_v1'
const LS_AUTOSAVE = 'nc_autosave_v1'

export function useProjects() {
  function listarProyectos() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_PROJECTS)) || []
      return raw.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
    } catch { return [] }
  }

  function guardarNuevo(nombre, data) {
    const id = Date.now().toString()
    const item = { id, nombre, savedAt: new Date().toISOString(), snapshots: [], ...data }
    const lista = listarProyectos()
    localStorage.setItem(LS_PROJECTS, JSON.stringify([item, ...lista]))
    return id
  }

  function sobrescribir(id, nombre, data) {
    const lista = listarProyectos()
    const original = lista.find(p => p.id === id)
    const snapshots = original?.snapshots || []

    // Save current state as snapshot before overwriting
    const snap = {
      savedAt: original?.savedAt || new Date().toISOString(),
      proy: original?.proy,
      termica: original?.termica,
      calcUInit: original?.calcUInit,
      fachadas: original?.fachadas,
      fachadasNextId: original?.fachadasNextId,
      notas: original?.notas,
    }
    const newSnapshots = [snap, ...snapshots].slice(0, 10)

    const updated = lista.map(p =>
      p.id === id ? { ...p, nombre, savedAt: new Date().toISOString(), snapshots: newSnapshots, ...data } : p
    )
    localStorage.setItem(LS_PROJECTS, JSON.stringify(updated))
  }

  function eliminarProyecto(id) {
    const lista = listarProyectos().filter(p => p.id !== id)
    localStorage.setItem(LS_PROJECTS, JSON.stringify(lista))
  }

  function duplicarProyecto(id) {
    const lista = listarProyectos()
    const original = lista.find(p => p.id === id)
    if (!original) return null
    const newId = Date.now().toString()
    const copia = { ...original, id: newId, nombre: `Copia de ${original.nombre}`, savedAt: new Date().toISOString(), snapshots: [] }
    localStorage.setItem(LS_PROJECTS, JSON.stringify([copia, ...lista]))
    return newId
  }

  function restaurarSnapshot(id, snapIdx) {
    const lista = listarProyectos()
    const proyecto = lista.find(p => p.id === id)
    if (!proyecto?.snapshots?.[snapIdx]) return null
    return proyecto.snapshots[snapIdx]
  }

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

  function exportarJSON(data, nombre) {
    const blob = new Blob([JSON.stringify({ version: 1, nombre, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nombre.replace(/[^a-z0-9]/gi, '_')}_normacheck.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importarJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        try { resolve(JSON.parse(e.target.result)) }
        catch { reject(new Error('Archivo JSON inválido')) }
      }
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsText(file)
    })
  }

  return { listarProyectos, guardarNuevo, sobrescribir, eliminarProyecto, duplicarProyecto, restaurarSnapshot, autoGuardar, cargarAutoguardado, exportarJSON, importarJSON }
}
