import {
  listarProyectosUsuario,
  guardarProyectoUsuario,
  actualizarProyectoUsuario,
  eliminarProyectoUsuario,
  listarProyectosDB,
  guardarProyectoDB,
  sobrescribirProyectoDB,
  eliminarProyectoDB,
} from '../supabase.js'

const LS_PROJECTS = 'nc_projects_v1'

// ─── Base class ────────────────────────────────────────────────────────────
class ProjectStore {
  async list() { throw new Error('Must implement list()') }
  async create(nombre, data) { throw new Error('Must implement create()') }
  async update(id, nombre, data, snapshots) { throw new Error('Must implement update()') }
  async delete(id) { throw new Error('Must implement delete()') }
  async duplicate(id, nombre, data) { throw new Error('Must implement duplicate()') }
  async getSnapshot(id, snapIdx) { throw new Error('Must implement getSnapshot()') }
}

// ─── Supabase Store ────────────────────────────────────────────────────────
export class SupabaseStore extends ProjectStore {
  constructor(userId, orgId) {
    super()
    this.userId = userId
    this.orgId = orgId
  }

  async list() {
    const rows = await listarProyectosUsuario(this.userId, this.orgId)
    if (rows === null) return null
    return rows.map(r => ({
      ...r,
      savedAt: r.updated_at,
      ...(r.data || {}),
    }))
  }

  async create(nombre, data) {
    const id = Date.now().toString()
    const ok = await guardarProyectoUsuario(this.userId, this.orgId, id, nombre, data, [])
    return ok ? id : null
  }

  async update(id, nombre, data, snapshots) {
    const snap = {
      savedAt: new Date().toISOString(),
      ...data,
    }
    const newSnapshots = [snap, ...snapshots].slice(0, 10)
    return await actualizarProyectoUsuario(this.userId, this.orgId, id, nombre, data, newSnapshots)
  }

  async delete(id) {
    return await eliminarProyectoUsuario(this.userId, this.orgId, id)
  }

  async duplicate(id, lista) {
    const original = lista.find(p => p.id === id)
    if (!original) return null
    const newId = Date.now().toString()
    const nombre = `Copia de ${original.nombre}`
    const data = { ...original }
    delete data.id
    delete data.savedAt
    delete data.updated_at
    delete data.snapshots
    const ok = await guardarProyectoUsuario(this.userId, this.orgId, newId, nombre, data, [])
    return ok ? newId : null
  }

  async getSnapshot(id, lista, snapIdx) {
    const proyecto = lista.find(p => p.id === id)
    return proyecto?.snapshots?.[snapIdx] ?? null
  }
}

// ─── LocalStorage Store ─────────────────────────────────────────────────────
export class LocalStorageStore extends ProjectStore {
  async list() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_PROJECTS)) || []
      return raw.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
    } catch {
      return []
    }
  }

  async create(nombre, data) {
    const id = Date.now().toString()
    const item = { id, nombre, savedAt: new Date().toISOString(), snapshots: [], ...data }
    const lista = await this.list()
    localStorage.setItem(LS_PROJECTS, JSON.stringify([item, ...lista]))
    return id
  }

  async update(id, nombre, data, snapshots) {
    const snap = {
      savedAt: new Date().toISOString(),
      ...data,
    }
    const newSnapshots = [snap, ...snapshots].slice(0, 10)
    const lista = await this.list()
    const updated = lista.map(p =>
      p.id === id ? { ...p, nombre, savedAt: new Date().toISOString(), snapshots: newSnapshots, ...data } : p
    )
    localStorage.setItem(LS_PROJECTS, JSON.stringify(updated))
    return true
  }

  async delete(id) {
    const lista = await this.list()
    const filtered = lista.filter(p => p.id !== id)
    localStorage.setItem(LS_PROJECTS, JSON.stringify(filtered))
    return true
  }

  async duplicate(id, lista) {
    const original = lista.find(p => p.id === id)
    if (!original) return null
    const newId = Date.now().toString()
    const nombre = `Copia de ${original.nombre}`
    const copia = { ...original, id: newId, nombre, savedAt: new Date().toISOString(), snapshots: [] }
    localStorage.setItem(LS_PROJECTS, JSON.stringify([copia, ...lista]))
    return newId
  }

  async getSnapshot(id, lista, snapIdx) {
    const proyecto = lista.find(p => p.id === id)
    return proyecto?.snapshots?.[snapIdx] ?? null
  }
}

// ─── Factory function ──────────────────────────────────────────────────────
export function createProjectStore(userId, orgId) {
  if (userId && orgId) {
    return new SupabaseStore(userId, orgId)
  }
  return new LocalStorageStore()
}
