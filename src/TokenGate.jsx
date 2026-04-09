import { useState, useEffect, createContext, useContext } from 'react'
import { validarToken } from './supabase'

// ─── Contexto token (disponible en toda la app) ───────────────────────────────
export const TokenCtx = createContext(null)
export const useToken = () => useContext(TokenCtx)

const LS_KEY = 'oguc_token_v1'

function guardarEnLS(tokenData) {
  localStorage.setItem(LS_KEY, JSON.stringify({
    token:           tokenData.token,
    expires_at:      tokenData.expires_at,
    max_proyectos:   tokenData.max_proyectos,
    proyectos_usados: tokenData.proyectos_usados,
    descripcion:     tokenData.descripcion || '',
    cached_at:       new Date().toISOString(),
  }))
}

function leerDeLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) } catch { return null }
}

export function borrarToken() {
  localStorage.removeItem(LS_KEY)
}

// ─── Mensajes de error ────────────────────────────────────────────────────────
const ERRORES = {
  invalid:   { titulo: 'Token no reconocido', msg: 'Verifica que lo hayas ingresado correctamente o contacta al administrador.' },
  expired:   { titulo: 'Token vencido',        msg: 'Este token ha expirado. Solicita uno nuevo al administrador.' },
  exhausted: { titulo: 'Límite de proyectos alcanzado', msg: 'Este token ya no tiene proyectos disponibles. Solicita una renovación.' },
  inactive:  { titulo: 'Token desactivado',    msg: 'Este token ha sido desactivado. Contacta al administrador.' },
  network:   { titulo: 'Error de conexión',    msg: 'No se pudo verificar el token. Revisa tu conexión a internet.' },
}

// ─── Componente TokenGate ─────────────────────────────────────────────────────
export default function TokenGate({ children }) {
  const [status, setStatus]     = useState('init')   // init|idle|checking|valid|error
  const [tokenInput, setInput]  = useState('')
  const [errorKey, setErrorKey] = useState(null)
  const [tokenData, setTData]   = useState(null)

  // Al montar: intentar restaurar desde localStorage
  useEffect(() => {
    const cached = leerDeLS()
    if (!cached) { setStatus('idle'); return }

    // Verificar expiry local antes de ir a red
    if (new Date(cached.expires_at) < new Date()) {
      borrarToken()
      setStatus('idle')
      return
    }

    // Volver a validar contra Supabase (token puede haber sido desactivado)
    setStatus('checking')
    validarToken(cached.token).then(res => {
      if (res.ok) {
        const updated = { ...res.data }
        guardarEnLS(updated)
        setTData(updated)
        setStatus('valid')
      } else {
        borrarToken()
        setErrorKey(res.motivo)
        setStatus('idle')
      }
    }).catch(() => {
      // Sin red: confiar en cache local si no expiró
      setTData(cached)
      setStatus('valid')
    })
  }, [])

  async function handleValidar() {
    if (!tokenInput.trim()) return
    setStatus('checking')
    setErrorKey(null)
    try {
      const res = await validarToken(tokenInput)
      if (res.ok) {
        guardarEnLS(res.data)
        setTData(res.data)
        setStatus('valid')
      } else {
        setErrorKey(res.motivo)
        setStatus('idle')
      }
    } catch {
      setErrorKey('network')
      setStatus('idle')
    }
  }

  // Actualizar datos del token en contexto (ej. tras exportar)
  function refreshTokenData(updates) {
    setTData(prev => {
      const next = { ...prev, ...updates }
      guardarEnLS(next)
      return next
    })
  }

  // ── Pantalla de acceso ──────────────────────────────────────────────────────
  if (status === 'init' || status === 'checking') {
    return (
      <div style={gS.overlay}>
        <div style={gS.card}>
          <img src="/vite.svg" style={{ width: 40, marginBottom: 8, opacity: 0.4 }} />
          <div style={gS.appName}>Verificador OGUC / DS N°15</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
            {status === 'init' ? 'Iniciando...' : 'Verificando acceso...'}
          </div>
          <div style={gS.spinner} />
        </div>
      </div>
    )
  }

  if (status === 'idle') {
    const err = errorKey ? ERRORES[errorKey] : null
    return (
      <div style={gS.overlay}>
        <div style={gS.card}>
          {/* Logo / título */}
          <div style={{ fontSize: 28, marginBottom: 4 }}>🏗️</div>
          <div style={gS.appName}>Verificador OGUC</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 28 }}>DS N°15 · LOSCAT Ed.13 · NCh</div>

          {/* Error previo */}
          {err && (
            <div style={gS.errorBox}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{err.titulo}</div>
              <div style={{ fontSize: 12 }}>{err.msg}</div>
            </div>
          )}

          {/* Input token */}
          <div style={{ width: '100%', marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Ingresa tu token de acceso
            </label>
            <input
              style={gS.input}
              value={tokenInput}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleValidar()}
              placeholder="OGUC-XXXX-XXXX-XXXX"
              autoFocus
              spellCheck={false}
            />
          </div>
          <button style={gS.btn} onClick={handleValidar} disabled={!tokenInput.trim()}>
            Ingresar
          </button>

          <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 20 }}>
            ¿No tienes token? Contacta al administrador del sistema.
          </div>
        </div>
      </div>
    )
  }

  // ── App activa ──────────────────────────────────────────────────────────────
  return (
    <TokenCtx.Provider value={{ tokenData, refreshTokenData }}>
      {children}
      {/* Indicador flotante de token */}
      {tokenData && <TokenBadge tokenData={tokenData} />}
    </TokenCtx.Provider>
  )
}

// ─── Badge flotante (esquina inferior derecha) ────────────────────────────────
function TokenBadge({ tokenData }) {
  const [open, setOpen] = useState(false)

  const restantes = tokenData.max_proyectos === 0
    ? '∞'
    : tokenData.max_proyectos - tokenData.proyectos_usados

  const expira = new Date(tokenData.expires_at).toLocaleDateString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  const agotado = tokenData.max_proyectos > 0 && restantes <= 0

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
      {open && (
        <div style={gS.popover}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#1e293b' }}>
            Información de licencia
          </div>
          {tokenData.descripcion && (
            <div style={gS.popRow}><span>Usuario</span><b>{tokenData.descripcion}</b></div>
          )}
          <div style={gS.popRow}><span>Token</span><b style={{ fontFamily: 'monospace' }}>{tokenData.token}</b></div>
          <div style={gS.popRow}><span>Expira</span><b>{expira}</b></div>
          <div style={gS.popRow}>
            <span>Proyectos</span>
            <b style={{ color: agotado ? '#dc2626' : '#166534' }}>
              {tokenData.max_proyectos === 0 ? 'Ilimitados' : `${tokenData.proyectos_usados} / ${tokenData.max_proyectos} usados`}
            </b>
          </div>
          <button
            style={{ marginTop: 10, width: '100%', padding: '5px 0', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
            onClick={() => { borrarToken(); window.location.reload() }}
          >Cerrar sesión</button>
        </div>
      )}
      <button
        style={{ ...gS.badgeBtn, background: agotado ? '#fee2e2' : '#f0fdf4', border: `1px solid ${agotado ? '#fca5a5' : '#86efac'}` }}
        onClick={() => setOpen(o => !o)}
        title="Información de licencia"
      >
        🔑 {tokenData.max_proyectos === 0 ? '∞' : `${restantes} proy.`}
      </button>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const gS = {
  overlay: {
    position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '40px 36px', width: 380, maxWidth: '90vw',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  appName: { fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 4, textAlign: 'center' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '2px solid #e2e8f0',
    borderRadius: 8, fontSize: 16, fontFamily: 'monospace', letterSpacing: 2, textAlign: 'center',
    outline: 'none', color: '#1e293b',
  },
  btn: {
    width: '100%', padding: '11px 0', background: '#1e40af', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  errorBox: {
    width: '100%', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
    padding: '10px 14px', color: '#991b1b', fontSize: 13, marginBottom: 16,
  },
  spinner: {
    width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#1e40af',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  badgeBtn: {
    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', color: '#166534',
  },
  popover: {
    position: 'absolute', bottom: '110%', right: 0, width: 260,
    background: '#fff', borderRadius: 10, padding: '14px 16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
  },
  popRow: {
    display: 'flex', justifyContent: 'space-between', fontSize: 12,
    color: '#64748b', marginBottom: 6, gap: 8,
  },
}

// CSS para spinner (inyectado una vez)
if (!document.getElementById('tg-spin-style')) {
  const st = document.createElement('style')
  st.id = 'tg-spin-style'
  st.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'
  document.head.appendChild(st)
}
