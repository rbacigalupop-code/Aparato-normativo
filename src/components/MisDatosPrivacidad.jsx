// ─────────────────────────────────────────────────────────────────────────────
// MisDatosPrivacidad.jsx — Panel ARCO+ del usuario (Ley 21.719)
//
// Derechos del titular accesibles desde su propia cuenta:
//   · Acceso / Portabilidad → "Descargar mis datos" (JSON con cuenta, perfil y
//     proyectos).
//   · Cancelación → "Eliminar mi cuenta y datos" (RPC eliminar_mi_cuenta).
//   · Enlace a la Política de Privacidad.
// El resto de derechos (rectificación, oposición, bloqueo) se ejercen por correo
// según indica la política.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { exportarMisDatos, eliminarMiCuenta } from '../supabase'
import { PoliticaPrivacidadModal, POLITICA_VERSION } from './PoliticaPrivacidad'

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { background: '#fff', borderRadius: 12, maxWidth: 520, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid #e2e8f0' },
  body: { padding: '18px 22px', overflowY: 'auto' },
  h1: { fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 },
  close: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b', lineHeight: 1 },
  sect: { border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', marginBottom: 12 },
  sTit: { fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sTxt: { fontSize: 12, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 },
  btn: (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }),
  btnGhost: { background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, textDecoration: 'underline', padding: 0 },
  input: { width: '100%', boxSizing: 'border-box', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12.5, marginTop: 6 },
  err: { fontSize: 11.5, color: '#dc2626', marginTop: 8, lineHeight: 1.4 },
}

export default function MisDatosPrivacidad({ onClose }) {
  const { user, orgActual, signOut } = useAuth()
  const [showPolitica, setShowPolitica] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [pedirConfirm, setPedirConfirm] = useState(false)
  const [textoConfirm, setTextoConfirm] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState(null)

  async function descargar() {
    setDescargando(true); setError(null)
    try {
      const { perfil, proyectos } = await exportarMisDatos(user?.id, orgActual?.id)
      const dump = {
        exportado_el: new Date().toISOString(),
        politica_version: POLITICA_VERSION,
        cuenta: {
          id: user?.id,
          email: user?.email,
          nombre: user?.user_metadata?.nombre_completo || perfil?.nombre_completo || null,
          creada_el: user?.created_at || perfil?.created_at || null,
          consentimiento: {
            version: user?.user_metadata?.consent_privacidad_version || null,
            fecha: user?.user_metadata?.consent_privacidad_at || null,
          },
        },
        perfil,
        proyectos,
      }
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `normacheck-mis-datos-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setError('No se pudieron exportar los datos: ' + (e?.message || e))
    }
    setDescargando(false)
  }

  async function borrar() {
    setBorrando(true); setError(null)
    const r = await eliminarMiCuenta()
    if (!r.ok) {
      setError('No se pudo eliminar la cuenta. Detalle: ' + (r.error || 'desconocido') + '. Si persiste, escríbenos a privacidad para procesarlo manualmente.')
      setBorrando(false)
      return
    }
    await signOut() // sesión cerrada → vuelve al login
  }

  const confirmOk = textoConfirm.trim().toUpperCase() === 'ELIMINAR'

  return (
    <div style={S.overlay} onMouseDown={onClose}>
      {showPolitica && <PoliticaPrivacidadModal onClose={() => setShowPolitica(false)} />}
      <div style={S.card} onMouseDown={e => e.stopPropagation()}>
        <div style={S.head}>
          <h1 style={S.h1}>🔒 Mis datos y privacidad</h1>
          <button style={S.close} onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div style={S.body}>
          {/* Acceso / portabilidad */}
          <div style={S.sect}>
            <p style={S.sTit}>Descargar mis datos</p>
            <p style={S.sTxt}>Obtén una copia de tu cuenta, perfil y proyectos en formato JSON (derecho de acceso y portabilidad).</p>
            <button style={S.btn('#2563eb')} onClick={descargar} disabled={descargando}>
              {descargando ? '⏳ Generando…' : '⬇ Descargar mis datos'}
            </button>
          </div>

          {/* Política */}
          <div style={S.sect}>
            <p style={S.sTit}>Política de Privacidad</p>
            <p style={S.sTxt}>Cómo tratamos tus datos y cómo ejercer tus derechos (acceso, rectificación, cancelación, oposición, portabilidad y bloqueo).</p>
            <button style={S.btnGhost} onClick={() => setShowPolitica(true)}>Ver Política de Privacidad</button>
          </div>

          {/* Cancelación */}
          <div style={{ ...S.sect, borderColor: '#fecaca', background: '#fef2f2' }}>
            <p style={{ ...S.sTit, color: '#991b1b' }}>Eliminar mi cuenta y datos</p>
            <p style={S.sTxt}>Borra de forma permanente tu cuenta, perfil y proyectos. <b>Esta acción no se puede deshacer.</b></p>
            {!pedirConfirm ? (
              <button style={S.btn('#dc2626')} onClick={() => { setPedirConfirm(true); setError(null) }}>
                Eliminar mi cuenta…
              </button>
            ) : (
              <div>
                <p style={{ ...S.sTxt, marginBottom: 2 }}>Escribe <b>ELIMINAR</b> para confirmar:</p>
                <input
                  style={S.input}
                  value={textoConfirm}
                  onChange={e => setTextoConfirm(e.target.value)}
                  placeholder="ELIMINAR"
                  disabled={borrando}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    style={{ ...S.btn('#dc2626'), opacity: confirmOk && !borrando ? 1 : 0.5, cursor: confirmOk && !borrando ? 'pointer' : 'not-allowed' }}
                    onClick={borrar}
                    disabled={!confirmOk || borrando}
                  >
                    {borrando ? '⏳ Eliminando…' : 'Eliminar definitivamente'}
                  </button>
                  <button style={{ ...S.btn('#64748b') }} onClick={() => { setPedirConfirm(false); setTextoConfirm('') }} disabled={borrando}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && <div style={S.err}>{error}</div>}
        </div>
      </div>
    </div>
  )
}
