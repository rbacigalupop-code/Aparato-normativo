import { useState, useEffect, createContext, useContext } from 'react'
import { validarToken } from './supabase'

export const TokenCtx = createContext(null)
export const useToken = () => useContext(TokenCtx)

const LS_KEY = 'oguc_token_v1'

function guardarEnLS(tokenData) {
  localStorage.setItem(LS_KEY, JSON.stringify({
    token:            tokenData.token,
    expires_at:       tokenData.expires_at,
    max_proyectos:    tokenData.max_proyectos,
    proyectos_usados: tokenData.proyectos_usados,
    descripcion:      tokenData.descripcion || '',
    cached_at:        new Date().toISOString(),
  }))
}

function leerDeLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) } catch { return null }
}

export function borrarToken() { localStorage.removeItem(LS_KEY) }

const ERRORES = {
  invalid:   { titulo: 'Token no reconocido',           msg: 'Verifica que lo hayas ingresado correctamente o contacta al administrador.' },
  expired:   { titulo: 'Token vencido',                 msg: 'Este token ha expirado. Solicita uno nuevo al administrador.' },
  exhausted: { titulo: 'Límite de proyectos alcanzado', msg: 'Este token ya no tiene proyectos disponibles. Solicita una renovación.' },
  inactive:  { titulo: 'Token desactivado',             msg: 'Este token ha sido desactivado. Contacta al administrador.' },
  network:   { titulo: 'Error de conexión',             msg: 'No se pudo verificar el token. Revisa tu conexión a internet.' },
}

// ─── Logo NormaCheck ──────────────────────────────────────────────────────────
function NormaCheckLogo({ size = 56 }) {
  return (
    <img
      src="/logo.png"
      alt="NormaCheck"
      style={{ width: size * 1.6, height: 'auto', objectFit: 'contain' }}
    />
  )
}

// ─── TokenGate ────────────────────────────────────────────────────────────────
export default function TokenGate({ children }) {
  const [status, setStatus]    = useState('init')
  const [tokenInput, setInput] = useState('')
  const [errorKey, setErrorKey] = useState(null)
  const [tokenData, setTData]  = useState(null)

  useEffect(() => {
    const cached = leerDeLS()
    if (!cached) { setStatus('idle'); return }
    if (new Date(cached.expires_at) < new Date()) { borrarToken(); setStatus('idle'); return }

    setStatus('checking')
    validarToken(cached.token).then(res => {
      if (res.ok) { guardarEnLS(res.data); setTData(res.data); setStatus('valid') }
      else        { borrarToken(); setErrorKey(res.motivo); setStatus('idle') }
    }).catch(() => { setTData(cached); setStatus('valid') })
  }, [])

  async function handleValidar() {
    if (!tokenInput.trim()) return
    setStatus('checking'); setErrorKey(null)
    try {
      const res = await validarToken(tokenInput)
      if (res.ok) { guardarEnLS(res.data); setTData(res.data); setStatus('valid') }
      else        { setErrorKey(res.motivo); setStatus('idle') }
    } catch { setErrorKey('network'); setStatus('idle') }
  }

  function refreshTokenData(updates) {
    setTData(prev => { const next = { ...prev, ...updates }; guardarEnLS(next); return next })
  }

  // ── Cargando ─────────────────────────────────────────────────────────────────
  if (status === 'init' || status === 'checking') {
    return (
      <div style={gS.overlay}>
        <div style={gS.card}>
          <NormaCheckLogo size={64} />
          <div style={gS.tagline}>Verificación normativa OGUC</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, marginTop: 24 }}>
            <div style={gS.spinner} />
            {status === 'init' ? 'Iniciando...' : 'Verificando acceso...'}
          </div>
        </div>
      </div>
    )
  }

  // ── Login ─────────────────────────────────────────────────────────────────────
  if (status === 'idle') {
    const err = errorKey ? ERRORES[errorKey] : null
    return (
      <div style={gS.overlay}>
        {/* Fondo con patrón sutil */}
        <div style={gS.bgPattern} />
        <div style={gS.card}>
          {/* Logo */}
          <NormaCheckLogo size={64} />
          <div style={gS.tagline}>Verificación normativa OGUC · DS N°15 · LOSCAT</div>

          <div style={gS.divider} />

          {/* Error */}
          {err && (
            <div style={gS.errorBox}>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>⚠ {err.titulo}</div>
              <div style={{ fontSize: 12 }}>{err.msg}</div>
            </div>
          )}

          {/* Token input */}
          <div style={{ width: '100%', marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 7, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Token de acceso
            </label>
            <input
              style={{ ...gS.input, borderColor: err ? '#fca5a5' : '#e2e8f0' }}
              value={tokenInput}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleValidar()}
              placeholder="OGUC-XXXX-XXXX-XXXX"
              autoFocus
              spellCheck={false}
            />
          </div>

          <button
            style={{ ...gS.btn, opacity: tokenInput.trim() ? 1 : 0.5, cursor: tokenInput.trim() ? 'pointer' : 'not-allowed' }}
            onClick={handleValidar}
            disabled={!tokenInput.trim()}
          >
            Ingresar →
          </button>

          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 20, textAlign: 'center', lineHeight: 1.6 }}>
            ¿No tienes token?<br/>Contacta al administrador del sistema.
          </div>

          {/* Footer */}
          <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid #f1f5f9', width: '100%', display: 'flex', justifyContent: 'center', gap: 16 }}>
            {['DS N°15', 'NCh853', 'LOSCAT Ed.13', 'NCh352'].map(n => (
              <span key={n} style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600 }}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── App activa ────────────────────────────────────────────────────────────────
  return (
    <TokenCtx.Provider value={{ tokenData, refreshTokenData }}>
      {children}
      {tokenData && <TokenBadge tokenData={tokenData} />}
    </TokenCtx.Provider>
  )
}

// ─── Badge flotante ───────────────────────────────────────────────────────────
function TokenBadge({ tokenData }) {
  const [open, setOpen] = useState(false)
  const restantes = tokenData.max_proyectos === 0 ? '∞' : tokenData.max_proyectos - tokenData.proyectos_usados
  const agotado   = tokenData.max_proyectos > 0 && restantes <= 0
  const expira    = new Date(tokenData.expires_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
      {open && (
        <div style={gS.popover}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <NormaCheckLogo size={28} />
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Licencia activa</div>
          </div>
          {tokenData.descripcion && <div style={gS.popRow}><span>Usuario</span><b>{tokenData.descripcion}</b></div>}
          <div style={gS.popRow}><span>Token</span><b style={{ fontFamily: 'monospace', fontSize: 11 }}>{tokenData.token}</b></div>
          <div style={gS.popRow}><span>Expira</span><b>{expira}</b></div>
          <div style={gS.popRow}>
            <span>Proyectos</span>
            <b style={{ color: agotado ? '#dc2626' : '#166534' }}>
              {tokenData.max_proyectos === 0 ? 'Ilimitados' : `${tokenData.proyectos_usados} / ${tokenData.max_proyectos} usados`}
            </b>
          </div>
          <button
            style={{ marginTop: 10, width: '100%', padding: '6px 0', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
            onClick={() => { borrarToken(); window.location.reload() }}
          >Cerrar sesión</button>
        </div>
      )}
      <button
        style={{ ...gS.badgeBtn, background: agotado ? '#fee2e2' : '#f0fdf4', border: `1px solid ${agotado ? '#fca5a5' : '#86efac'}`, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => setOpen(o => !o)}
        title="Información de licencia"
      >
        <span style={{ fontSize: 14 }}>{agotado ? '⛔' : '✅'}</span>
        <span style={{ color: agotado ? '#991b1b' : '#166534' }}>
          {tokenData.max_proyectos === 0 ? '∞ proy.' : `${restantes} proy.`}
        </span>
      </button>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const gS = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #0f172a 100%)',
  },
  bgPattern: {
    position: 'fixed', inset: 0, zIndex: 0, opacity: 0.04,
    backgroundImage: 'repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 40px)',
  },
  card: {
    position: 'relative', zIndex: 1,
    background: '#fff', borderRadius: 20, padding: '40px 36px', width: 400, maxWidth: '92vw',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  brand: { fontSize: 26, fontWeight: 900, color: '#1e293b', marginTop: 14, marginBottom: 4, letterSpacing: -0.5 },
  tagline: { fontSize: 12, color: '#64748b', marginBottom: 4, textAlign: 'center' },
  divider: { width: '100%', height: 1, background: '#f1f5f9', margin: '20px 0' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '11px 14px', border: '2px solid #e2e8f0',
    borderRadius: 9, fontSize: 16, fontFamily: 'monospace', letterSpacing: 3, textAlign: 'center',
    outline: 'none', color: '#1e293b', transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%', padding: '12px 0', background: 'linear-gradient(135deg, #1e40af, #0369a1)',
    color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700,
    letterSpacing: 0.3, boxShadow: '0 4px 14px rgba(30,64,175,0.35)',
  },
  errorBox: {
    width: '100%', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
    padding: '10px 14px', color: '#991b1b', fontSize: 13, marginBottom: 14,
  },
  spinner: {
    width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: '#1e40af',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0,
  },
  badgeBtn: { padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: '#f0fdf4' },
  popover: {
    position: 'absolute', bottom: '110%', right: 0, width: 270,
    background: '#fff', borderRadius: 12, padding: '14px 16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
  },
  popRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6, gap: 8 },
}

if (!document.getElementById('tg-spin-style')) {
  const st = document.createElement('style')
  st.id = 'tg-spin-style'
  st.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'
  document.head.appendChild(st)
}
