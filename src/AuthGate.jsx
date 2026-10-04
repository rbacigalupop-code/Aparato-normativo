import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import {
  validarEmail,
  validarPassword,
  validarNombre,
  validarCoincidencia,
} from './utils/validation'
import { botonAuthDeshabilitado } from './utils/authForm'
import { PoliticaPrivacidadModal, POLITICA_VERSION } from './components/PoliticaPrivacidad'

export default function AuthGate({ children }) {
  const { session, cargando, isLoggedIn, modoRecovery, actualizarPassword, cancelarRecovery, enviarResetPassword } = useAuth()
  const [modo, setModo] = useState('login') // 'login' | 'signup' | 'recuperar'
  const [formData, setFormData] = useState({ email: '', password: '', nombreCompleto: '', passwordConfirm: '' })
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [aceptaPolitica, setAceptaPolitica] = useState(false) // consentimiento Ley 21.719
  const [showPolitica, setShowPolitica] = useState(false)
  const [aviso, setAviso] = useState(null)   // mensaje de éxito (p. ej. correo enviado)
  // Form "definir nueva contraseña" (modo recovery, tras el link del correo)
  const [recPass, setRecPass] = useState({ p1: '', p2: '' })

  const { signIn, signUp } = useAuth()

  // Self-service: enviar correo de reseteo de contraseña ("olvidé mi contraseña")
  async function handleEnviarRecuperacion(e) {
    e.preventDefault()
    setError(null); setAviso(null)
    const emailErr = validarEmail(formData.email)
    if (emailErr) { setFieldErrors({ email: emailErr }); setError(emailErr); return }
    setProcesando(true)
    const result = await enviarResetPassword(formData.email)
    setProcesando(false)
    if (result.ok) {
      setAviso('Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña. Revisa tu bandeja (y spam).')
    } else {
      setError(result.error || 'No se pudo enviar el correo')
    }
  }

  // Modo recovery: definir la nueva contraseña (ya hay sesión de recuperación).
  async function handleDefinirPassword(e) {
    e.preventDefault()
    setError(null); setAviso(null)
    const passErr = validarPassword(recPass.p1)
    if (passErr) { setError(passErr); return }
    const confErr = validarCoincidencia(recPass.p1, recPass.p2, 'Contraseñas')
    if (confErr) { setError(confErr); return }
    setProcesando(true)
    const result = await actualizarPassword(recPass.p1)
    setProcesando(false)
    if (result.ok) {
      setRecPass({ p1: '', p2: '' })
      setModo('login')
      setAviso('Contraseña actualizada. Inicia sesión con tu nueva contraseña.')
    } else {
      setError(result.error || 'No se pudo actualizar la contraseña')
    }
  }

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
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      if (fieldErr) {
        newErrors[name] = fieldErr
      } else {
        delete newErrors[name]
      }
      return newErrors
    })
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
      // result.error puede ser string (desde supabase.js) o objeto (desde useAuth)
      const msg = typeof result.error === 'string'
        ? result.error
        : (result.error?.message || 'Error al iniciar sesión')
      setError(msg)
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

    if (!aceptaPolitica) errors.politica = 'Debes aceptar la Política de Privacidad para crear una cuenta'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Por favor corrige los errores indicados')
      return
    }

    setProcesando(true)
    const result = await signUp(formData.email, formData.password, formData.nombreCompleto, formData.passwordConfirm, POLITICA_VERSION)
    if (!result.ok) {
      const msg = typeof result.error === 'string'
        ? result.error
        : (result.error?.message || 'Error al crear la cuenta')
      setError(msg)
    } else {
      setModo('login')
      setFormData({ email: '', password: '', nombreCompleto: '', passwordConfirm: '' })
      setFieldErrors({})
      setAceptaPolitica(false)
      setError(null)
    }
    setProcesando(false)
  }

  // Cargando sesión
  if (cargando) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <img src="/logo-lockup.svg" alt="Talora" style={{ width: 190, height: 'auto', marginBottom: 14 }} />
          <div style={styles.tagline}>Copiloto de diseño técnico · OGUC · DS N°15</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, marginTop: 24 }}>
            <div style={styles.spinner} />
            Iniciando sesión...
          </div>
        </div>
      </div>
    )
  }

  // Modo recuperación de contraseña (volvió desde el link del correo). Se evalúa
  // ANTES de "usuario logueado" porque el link abre una sesión de recuperación:
  // sin este corte, la app entraría normal y nunca pediría la nueva contraseña.
  if (modoRecovery) {
    return (
      <div style={styles.overlay}>
        <div style={styles.bgPattern} />
        <div style={styles.card}>
          <img src="/logo-lockup.svg" alt="Talora" style={{ width: 200, height: 'auto', marginBottom: 14 }} />
          <div style={styles.tagline}>Restablecer contraseña</div>
          <div style={styles.divider} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 12, textAlign: 'center' }}>
            Define tu nueva contraseña
          </h2>
          {error && <div style={styles.errorBox}>{error}</div>}
          <form onSubmit={handleDefinirPassword} style={{ width: '100%' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Nueva contraseña</label>
              <input
                type="password" name="new-password" autoComplete="new-password"
                style={styles.input} placeholder="••••••••"
                value={recPass.p1} onChange={e => setRecPass(p => ({ ...p, p1: e.target.value }))}
                disabled={procesando}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Repite la contraseña</label>
              <input
                type="password" name="confirm-password" autoComplete="new-password"
                style={styles.input} placeholder="••••••••"
                value={recPass.p2} onChange={e => setRecPass(p => ({ ...p, p2: e.target.value }))}
                disabled={procesando}
              />
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14, lineHeight: 1.5 }}>
              Mínimo 8 caracteres, con mayúscula, número y un símbolo (!@#$%^&amp;*).
            </div>
            <button type="submit" style={{ ...styles.btn, opacity: procesando ? 0.6 : 1, cursor: procesando ? 'wait' : 'pointer' }} disabled={procesando}>
              {procesando ? '⏳ Guardando...' : 'Guardar contraseña →'}
            </button>
          </form>
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button type="button" onClick={cancelarRecovery}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Usuario logueado
  if (isLoggedIn && session) {
    return children
  }

  // El botón se deshabilita si: está procesando, hay errores de campo activos, o
  // —solo en signup— aún no se acepta la Política de Privacidad (Ley 21.719). Así
  // la exigencia del consentimiento es visible ANTES de intentar enviar. En login
  // no aplica (no hay casilla). Lógica pura y testeada en utils/authForm.js.
  const botonDeshabilitado = botonAuthDeshabilitado({ procesando, fieldErrors, modo, aceptaPolitica })

  // Formulario de login/signup
  return (
    <div style={styles.overlay}>
      {showPolitica && <PoliticaPrivacidadModal onClose={() => setShowPolitica(false)} />}
      <div style={styles.bgPattern} />
      <div style={styles.card}>
        <img src="/logo-lockup.svg" alt="Talora" style={{ width: 200, height: 'auto', marginBottom: 14 }} />
        <div style={styles.tagline}>Copiloto de diseño técnico · OGUC · DS N°15 · LOSCAT</div>

        <div style={styles.divider} />

        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 12, textAlign: 'center' }}>
          {modo === 'login' ? 'Iniciar sesión' : modo === 'recuperar' ? 'Recuperar contraseña' : 'Crear cuenta'}
        </h2>

        {error && <div style={styles.errorBox}>{error}</div>}
        {aviso && <div style={styles.avisoBox}>{aviso}</div>}

        {modo === 'recuperar' && (
          <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14, lineHeight: 1.5, textAlign: 'center' }}>
            Ingresa tu email y te enviaremos un enlace para definir una nueva contraseña.
          </div>
        )}

        <form onSubmit={modo === 'login' ? handleLogin : modo === 'recuperar' ? handleEnviarRecuperacion : handleSignup}>
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

          {/* Contraseña (no aplica en modo recuperar) */}
          {modo !== 'recuperar' && (
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
            {modo === 'login' && (
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <button type="button"
                  onClick={() => { setModo('recuperar'); setError(null); setAviso(null); setFieldErrors({}) }}
                  style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </div>
          )}

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

          {/* Consentimiento Política de Privacidad (Ley 21.719) — solo signup */}
          {modo === 'signup' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#475569', cursor: 'pointer', lineHeight: 1.4 }}>
                <input
                  type="checkbox"
                  checked={aceptaPolitica}
                  onChange={e => { setAceptaPolitica(e.target.checked); setFieldErrors(prev => { const n = { ...prev }; delete n.politica; return n }) }}
                  disabled={procesando}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <span>
                  He leído y acepto la{' '}
                  <button
                    type="button"
                    onClick={() => setShowPolitica(true)}
                    style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline', fontSize: 'inherit' }}
                  >
                    Política de Privacidad
                  </button>
                  {' '}y el tratamiento de mis datos personales.
                </span>
              </label>
              {fieldErrors.politica && <div style={styles.fieldErrorText}>{fieldErrors.politica}</div>}
            </div>
          )}

          {/* Botón principal — ver `botonDeshabilitado` arriba.
              NOTA: hayErrores() usa Object.values(...).some(Boolean); NO usar
              Object.keys().length, que contaba claves con valor undefined (p. ej.
              'politica' al limpiarse) y dejaba el botón bloqueado para siempre. */}
          <button
            type="submit"
            style={{
              ...styles.btn,
              opacity: botonDeshabilitado ? 0.6 : 1,
              cursor: botonDeshabilitado ? 'not-allowed' : 'pointer',
            }}
            disabled={botonDeshabilitado}
          >
            {procesando ? '⏳ Procesando...' : modo === 'login' ? 'Ingresar →' : modo === 'recuperar' ? 'Enviar enlace de reseteo →' : 'Crear cuenta →'}
          </button>
        </form>

        {/* Toggle login/signup/recuperar */}
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          {modo === 'recuperar' ? (
            <button
              onClick={() => { setModo('login'); setError(null); setAviso(null); setFieldErrors({}) }}
              style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontWeight: 600 }}
            >
              ← Volver a iniciar sesión
            </button>
          ) : modo === 'login' ? (
            <>
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => {
                  setModo('signup')
                  setError(null)
                  setFieldErrors({})
                  setAceptaPolitica(false)
                  setFormData({ email: '', password: '', nombreCompleto: '', passwordConfirm: '' })
                }}
                style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontWeight: 600 }}
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
                  setAceptaPolitica(false)
                  setFormData({ email: '', password: '', nombreCompleto: '', passwordConfirm: '' })
                }}
                style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontWeight: 600 }}
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>

        {/* Enlace a Política de Privacidad (siempre accesible) */}
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowPolitica(true)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}
          >
            Política de Privacidad
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', width: '100%', display: 'flex', justifyContent: 'center', gap: 16 }}>
          {['DS N°15', 'NCh853', 'LOSCAT Ed.14', 'NCh352'].map(n => (
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
    background: 'linear-gradient(135deg, #04302e 0%, #115e59 60%, #04302e 100%)',
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
    background: 'linear-gradient(135deg, #0e6560, #0f766e)',
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
  avisoBox: {
    width: '100%',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#065f46',
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
    borderTopColor: '#0e6560',
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
