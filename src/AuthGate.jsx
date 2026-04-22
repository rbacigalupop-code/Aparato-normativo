import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import {
  validarEmail,
  validarPassword,
  validarNombre,
  validarCoincidencia,
} from './utils/validation'

export default function AuthGate({ children }) {
  const { session, cargando, isLoggedIn } = useAuth()
  const [modo, setModo] = useState('login') // 'login' | 'signup'
  const [formData, setFormData] = useState({ email: '', password: '', nombreCompleto: '', passwordConfirm: '' })
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const { signIn, signUp } = useAuth()

  // Validar campo individual
  function validarCampo(fieldName, value) {
    let err = null
    switch (fieldName) {
      case 'email':
        err = validarEmail(value)
        break
      case 'password':
        err = validarPassword(value)
        break
      case 'nombreCompleto':
        err = validarNombre(value)
        break
      case 'passwordConfirm':
        if (value && formData.password) {
          err = validarCoincidencia(formData.password, value, 'Contraseñas')
        }
        break
      default:
        break
    }
    return err
  }

  // Actualizar campo y limpiar error
  function handleChangeField(e) {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))

    // Validar en tiempo real
    const fieldErr = validarCampo(name, value)
    setFieldErrors(prev => ({
      ...prev,
      [name]: fieldErr,
    }))
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // Validar campos
    const errors = {}
    const emailErr = validarEmail(formData.email)
    if (emailErr) errors.email = emailErr

    const passwordErr = formData.password ? null : 'Contraseña requerida'
    if (passwordErr) errors.password = passwordErr

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Por favor corrige los errores indicados')
      return
    }

    setProcesando(true)
    const result = await signIn(formData.email, formData.password)
    if (!result.ok) {
      setError(result.error?.message || 'Error al iniciar sesión')
    }
    setProcesando(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // Validar campos
    const errors = {}
    const emailErr = validarEmail(formData.email)
    if (emailErr) errors.email = emailErr

    const passwordErr = validarPassword(formData.password)
    if (passwordErr) errors.password = passwordErr

    const confirmErr = validarCoincidencia(formData.password, formData.passwordConfirm, 'Contraseñas')
    if (confirmErr) errors.passwordConfirm = confirmErr

    const nombreErr = validarNombre(formData.nombreCompleto)
    if (nombreErr) errors.nombreCompleto = nombreErr

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Por favor corrige los errores indicados')
      return
    }

    setProcesando(true)
    const result = await signUp(formData.email, formData.password, formData.nombreCompleto, formData.passwordConfirm)
    if (!result.ok) {
      setError(result.error?.message || 'Error al crear la cuenta')
    } else {
      setModo('login')
      setFormData({ email: '', password: '', nombreCompleto: '', passwordConfirm: '' })
      setFieldErrors({})
      setError(null)
    }
    setProcesando(false)
  }

  // Cargando sesión
  if (cargando) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <img src="/logo.png" alt="NormaCheck" style={{ width: 64, height: 'auto', marginBottom: 16 }} />
          <div style={styles.tagline}>Verificación normativa OGUC</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, marginTop: 24 }}>
            <div style={styles.spinner} />
            Iniciando sesión...
          </div>
        </div>
      </div>
    )
  }

  // Usuario logueado
  if (isLoggedIn && session) {
    return children
  }

  // Formulario de login/signup
  return (
    <div style={styles.overlay}>
      <div style={styles.bgPattern} />
      <div style={styles.card}>
        <img src="/logo.png" alt="NormaCheck" style={{ width: 64, height: 'auto', marginBottom: 16 }} />
        <div style={styles.brand}>NormaCheck</div>
        <div style={styles.tagline}>Verificación normativa OGUC · DS N°15 · LOSCAT</div>

        <div style={styles.divider} />

        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 12, textAlign: 'center' }}>
          {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={modo === 'login' ? handleLogin : handleSignup}>
          {/* Nombre (solo en signup) */}
          {modo === 'signup' && (
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Nombre completo</label>
              <input
                type="text"
                name="nombreCompleto"
                style={{ ...styles.input, borderColor: fieldErrors.nombreCompleto ? '#dc2626' : undefined }}
                placeholder="Juan Pérez"
                value={formData.nombreCompleto}
                onChange={handleChangeField}
                disabled={procesando}
              />
              {fieldErrors.nombreCompleto && <div style={styles.fieldErrorText}>{fieldErrors.nombreCompleto}</div>}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              style={{ ...styles.input, borderColor: fieldErrors.email ? '#dc2626' : undefined }}
              placeholder="usuario@estudio.cl"
              value={formData.email}
              onChange={handleChangeField}
              disabled={procesando}
              autoComplete="email"
            />
            {fieldErrors.email && <div style={styles.fieldErrorText}>{fieldErrors.email}</div>}
          </div>

          {/* Contraseña */}
          <div style={{ marginBottom: modo === 'signup' ? 12 : 16 }}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              name="password"
              style={{ ...styles.input, borderColor: fieldErrors.password ? '#dc2626' : undefined }}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChangeField}
              disabled={procesando}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            />
            {fieldErrors.password && <div style={styles.fieldErrorText}>{fieldErrors.password}</div>}
          </div>

          {/* Confirmar Contraseña (solo en signup) */}
          {modo === 'signup' && (
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Confirmar contraseña</label>
              <input
                type="password"
                name="passwordConfirm"
                style={{ ...styles.input, borderColor: fieldErrors.passwordConfirm ? '#dc2626' : undefined }}
                placeholder="••••••••"
                value={formData.passwordConfirm}
                onChange={handleChangeField}
                disabled={procesando}
                autoComplete="new-password"
              />
              {fieldErrors.passwordConfirm && <div style={styles.fieldErrorText}>{fieldErrors.passwordConfirm}</div>}
            </div>
          )}

          {/* Botón principal */}
          <button
            type="submit"
            style={{
              ...styles.btn,
              opacity: procesando || Object.keys(fieldErrors).length > 0 ? 0.6 : 1,
              cursor: procesando || Object.keys(fieldErrors).length > 0 ? 'not-allowed' : 'pointer',
            }}
            disabled={procesando || Object.keys(fieldErrors).length > 0}
          >
            {procesando ? '⏳ Procesando...' : modo === 'login' ? 'Ingresar →' : 'Crear cuenta →'}
          </button>
        </form>

        {/* Toggle login/signup */}
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          {modo === 'login' ? (
            <>
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => {
                  setModo('signup')
                  setError(null)
                  setFieldErrors({})
                  setFormData({ email: '', password: '', nombreCompleto: '', passwordConfirm: '' })
                }}
                style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', fontWeight: 600 }}
              >
                Crear una
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => {
                  setModo('login')
                  setError(null)
                  setFieldErrors({})
                  setFormData({ email: '', password: '', nombreCompleto: '', passwordConfirm: '' })
                }}
                style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', fontWeight: 600 }}
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid #f1f5f9', width: '100%', display: 'flex', justifyContent: 'center', gap: 16 }}>
          {['DS N°15', 'NCh853', 'LOSCAT Ed.13', 'NCh352'].map(n => (
            <span key={n} style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600 }}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #0f172a 100%)',
  },
  bgPattern: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    opacity: 0.04,
    backgroundImage:
      'repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 40px)',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: '#fff',
    borderRadius: 20,
    padding: '40px 36px',
    width: 400,
    maxWidth: '92vw',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  brand: { fontSize: 26, fontWeight: 900, color: '#1e293b', marginBottom: 4, letterSpacing: -0.5 },
  tagline: { fontSize: 12, color: '#64748b', marginBottom: 4, textAlign: 'center' },
  divider: { width: '100%', height: 1, background: '#f1f5f9', margin: '20px 0' },
  label: { fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: 9,
    fontSize: 14,
    outline: 'none',
    color: '#1e293b',
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    padding: '12px 0',
    background: 'linear-gradient(135deg, #1e40af, #0369a1)',
    color: '#fff',
    border: 'none',
    borderRadius: 9,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 0.3,
    boxShadow: '0 4px 14px rgba(30,64,175,0.35)',
    cursor: 'pointer',
  },
  errorBox: {
    width: '100%',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#991b1b',
    fontSize: 13,
    marginBottom: 14,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
    display: 'block',
  },
  spinner: {
    width: 18,
    height: 18,
    border: '2px solid #e2e8f0',
    borderTopColor: '#1e40af',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  },
}

// Agregar keyframe para spinner
if (!document.getElementById('auth-gate-spin-style')) {
  const st = document.createElement('style')
  st.id = 'auth-gate-spin-style'
  st.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'
  document.head.appendChild(st)
}
