import { useState, useRef } from 'react'

export default function ProjectManager({ open, onClose, proyectoActual, setProyectoActual, getData, onCargar, proyectos }) {
  const [nombre, setNombre] = useState('')
  const [lista, setLista] = useState(() => proyectos.listarProyectos())
  const [msg, setMsg] = useState('')
  const [historialOpen, setHistorialOpen] = useState(null)
  const fileRef = useRef()

  function refrescar() { setLista(proyectos.listarProyectos()) }

  function showMsg(text, ms = 2500) {
    setMsg(text)
    setTimeout(() => setMsg(''), ms)
  }

  function handleGuardarNuevo() {
    const n = nombre.trim() || 'Proyecto sin nombre'
    const id = proyectos.guardarNuevo(n, getData())
    setProyectoActual({ id, nombre: n })
    refrescar()
    showMsg(`✅ Guardado como "${n}"`)
    setNombre('')
  }

  function handleSobrescribir() {
    if (!proyectoActual) return
    proyectos.sobrescribir(proyectoActual.id, proyectoActual.nombre, getData())
    refrescar()
    showMsg(`✅ Proyecto actualizado`)
  }

  function handleAbrir(p) {
    onCargar(p)
    setProyectoActual({ id: p.id, nombre: p.nombre })
    onClose()
  }

  function handleEliminar(id) {
    proyectos.eliminarProyecto(id)
    if (proyectoActual?.id === id) setProyectoActual(null)
    refrescar()
  }

  function handleExportar(p) {
    proyectos.exportarJSON(p, p.nombre)
  }

  async function handleImportar(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const data = await proyectos.importarJSON(file)
      onCargar(data)
      const n = data.nombre || data.proy?.nombre || 'Importado'
      const id = proyectos.guardarNuevo(n + ' (importado)', data)
      setProyectoActual({ id, nombre: n + ' (importado)' })
      refrescar()
      showMsg(`✅ Proyecto importado como "${n}"`)
    } catch(err) {
      showMsg(`❌ ${err.message}`)
    }
    e.target.value = ''
  }

  function fmtFecha(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (!open) return null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ background:'#1e40af', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <span style={{ color:'#fff', fontWeight:800, fontSize:16 }}>📁 Proyectos guardados</span>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:16 }}>✕</button>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:20 }}>
          {/* Mensaje de feedback */}
          {msg && <div style={{ background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border:`1px solid ${msg.startsWith('✅') ? '#86efac' : '#fca5a5'}`, color: msg.startsWith('✅') ? '#166534' : '#991b1b', borderRadius:8, padding:'8px 14px', marginBottom:14, fontSize:13, fontWeight:600 }}>{msg}</div>}

          {/* Guardar actual */}
          <div style={{ background:'#f8fafc', borderRadius:10, padding:14, marginBottom:16, border:'1px solid #e2e8f0' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1e293b', marginBottom:10 }}>Guardar proyecto actual</div>
            {proyectoActual && (
              <div style={{ fontSize:12, color:'#64748b', marginBottom:8 }}>
                Proyecto abierto: <b style={{ color:'#1e40af' }}>{proyectoActual.nombre}</b>
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              <input
                style={{ flex:1, padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none' }}
                placeholder="Nombre del proyecto..."
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuardarNuevo()}
              />
              <button onClick={handleGuardarNuevo} style={{ background:'#166534', color:'#fff', border:'none', borderRadius:7, padding:'8px 14px', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                Guardar nuevo
              </button>
              {proyectoActual && (
                <button onClick={handleSobrescribir} style={{ background:'#b45309', color:'#fff', border:'none', borderRadius:7, padding:'8px 14px', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                  Actualizar
                </button>
              )}
            </div>
          </div>

          {/* Importar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>Proyectos guardados ({lista.length})</span>
            <button onClick={() => fileRef.current.click()} style={{ background:'#475569', color:'#fff', border:'none', borderRadius:7, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              📂 Importar .json
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display:'none' }} onChange={handleImportar} />
          </div>

          {/* Lista de proyectos */}
          {lista.length === 0 ? (
            <div style={{ textAlign:'center', color:'#94a3b8', fontSize:13, padding:'30px 0', fontStyle:'italic' }}>
              Sin proyectos guardados aún.<br/>Guarda el proyecto actual para verlo aquí.
            </div>
          ) : (
            lista.map(p => (
              <div key={p.id}>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, marginBottom:4, background: proyectoActual?.id === p.id ? '#eff6ff' : '#fff', borderColor: proyectoActual?.id === p.id ? '#93c5fd' : '#e2e8f0' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {proyectoActual?.id === p.id && <span style={{ color:'#1e40af', marginRight:4 }}>●</span>}
                      {p.nombre}
                    </div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>{fmtFecha(p.savedAt)}</div>
                  </div>
                  <button onClick={() => handleAbrir(p)} style={{ background:'#1e40af', color:'#fff', border:'none', borderRadius:6, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Abrir</button>
                  <button onClick={() => handleExportar(p)} style={{ background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0', borderRadius:6, padding:'5px 8px', fontSize:12, cursor:'pointer' }} title="Exportar como .json">↓</button>
                  <button onClick={() => { proyectos.duplicarProyecto(p.id); refrescar(); showMsg('✅ Proyecto duplicado') }} style={{ background:'#f0f9ff', color:'#0369a1', border:'1px solid #bae6fd', borderRadius:6, padding:'5px 8px', fontSize:12, cursor:'pointer' }} title="Duplicar">📋</button>
                  <button onClick={() => setHistorialOpen(historialOpen === p.id ? null : p.id)} style={{ background:'#f5f3ff', color:'#6d28d9', border:'1px solid #ddd6fe', borderRadius:6, padding:'5px 8px', fontSize:12, cursor:'pointer' }} title="Historial">🕐</button>
                  <button onClick={() => handleEliminar(p.id)} style={{ background:'#fee2e2', color:'#991b1b', border:'none', borderRadius:6, padding:'5px 8px', fontSize:12, cursor:'pointer' }} title="Eliminar">🗑</button>
                </div>

                {historialOpen === p.id && p.snapshots?.length > 0 && (
                  <div style={{ margin:'4px 0 8px 0', padding:'8px 12px', background:'#faf5ff', borderRadius:8, border:'1px solid #e9d5ff' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#6d28d9', marginBottom:6 }}>Historial de versiones</div>
                    {p.snapshots.map((snap, idx) => (
                      <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom: idx < p.snapshots.length - 1 ? '1px solid #ede9fe' : 'none' }}>
                        <span style={{ fontSize:11, color:'#64748b' }}>{fmtFecha(snap.savedAt)}</span>
                        <button
                          onClick={() => { const data = proyectos.restaurarSnapshot(p.id, idx); if(data) { onCargar(data); setProyectoActual({ id: p.id, nombre: p.nombre }); onClose(); showMsg('✅ Versión restaurada') } }}
                          style={{ background:'#6d28d9', color:'#fff', border:'none', borderRadius:5, padding:'3px 8px', fontSize:11, cursor:'pointer' }}
                        >Restaurar</button>
                      </div>
                    ))}
                  </div>
                )}
                {historialOpen === p.id && (!p.snapshots || p.snapshots.length === 0) && (
                  <div style={{ margin:'4px 0 8px 0', padding:'8px 12px', background:'#faf5ff', borderRadius:8, border:'1px solid #e9d5ff', fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>
                    Sin versiones anteriores. El historial se genera al usar "Actualizar".
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ padding:'10px 20px', borderTop:'1px solid #e2e8f0', fontSize:11, color:'#94a3b8', flexShrink:0 }}>
          Los proyectos se guardan localmente en este navegador. Usa "Exportar .json" para respaldarlos o moverlos a otro equipo.
        </div>
      </div>
    </div>
  )
}
