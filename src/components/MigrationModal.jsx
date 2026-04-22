import { useState } from 'react'
import { convertirTokenAUsuario } from '../supabase'
import {
  validarEmail,
  validarPassword,
  validarNombre,
  validarCoincidencia,
} from '../utils/validation'

export default function MigrationModal({ token, datosToken, proyectosMigrables, onMigrationComplete, onSkip }) {
  const [formData, setFormData] = useState({ email: '', password: '', passwordConfirm: '', nombreCompleto: '' })
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [procesando, setProcesando] = useState(false)
  const [migrationSuccess, setMigrationSuccess] = useState(false)

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

  function handleChangeField(e) {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))

    const fieldErr = validarCampo(name, value)
    setFieldErrors(prev => ({
      ...prev,
      [name]: fieldErr,
    }))
  }

  async function handleConvertir(e) {
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
    const result = await convertirTokenAUsuario(
      token,
      formData.email,
      formData.password,
      formData.nombreCompleto
    )
    setProcesando(false)

    if (!result.ok) {
      setError(result.error || 'Error al procesar la migración')
      return
    }

    // Éxito
    setMigrationSuccess(true)
    setTimeout(() => {
      onMigrationComplete()
    }, 2000)
  }

  // Pantalla de éxito
  if (migrationSuccess) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#166534', marginBottom: 8, textAlign: 'center' }}>
            ¡Migración exitosa!
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 8 }}>
            Tu token ha sido convertido en una cuenta de usuario.
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
            {proyectosMigrables} proyecto{proyectosMigrables !== 1 ? 's' : ''} serán migrado{proyectosMigrables !== 1 ? 's' : ''}.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, marginTop: 24 }}>
            <div style={styles.spinner} />
            Iniciando sesión...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.bgPattern} />
      <div style={styles.card}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 4, textAlign: 'center' }}>
          Convertir token antiguo
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
          Tu token OGUC-{token?.slice(-12)} será convertido en una cuenta de usuario.
          <br />
          {proyectosMigrables > 0 && (
            <>
              <strong style={{ color: '#166534' }}>
                {proyectosMigrables} proyecto{proyectosMigrables !== 1 ? 's' : ''} serán migrado{proyectosMigrables !== 1 ? 's' : ''}
              </strong>
              <br />
            </>
          )}
        </p>

        <div style={styles.divider} />

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleConvertir}>
          {/* Nombre */}
          <div style={{ marginBottom: 12 }}>
            <label style={styles.label}>Nombre completo</label>
            <input
              type="text"
              name="nombreCompleto"
              style={{ ...styles.input, borderColor: fieldErrors.nombreCompleto ? '#dc2626' : undefined }}
              placeholder="Tu nombre"
              value={formData.nombreCompleto}
              onChange={handleChangeField}
              disabled={procesando}
            />
            {fieldErrors.nombreCompleto && <div style={styles.fieldErrorText}>{fieldErrors.nombreCompleto}</div>}
          </div>

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
          <div style={{ marginBottom: 12 }}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              name="password"
              style={{ ...styles.input, borderColor: fieldErrors.password ? '#dc2626' : undefined }}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChangeField}
              disabled={procesando}
              autoComplete="new-password"
            />
            {fieldErrors.password && <div style={styles.fieldErrorText}>{fieldErrors.password}</div>}
          </div>

          {/* Confirmar Contraseña */}
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

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={onSkip}
              disabled={procesando}
              style={{
                ...styles.btnSecondary,
                opacity: procesando ? 0.5 : 1,
                cursor: procesando ? 'not-allowed' : 'pointer',
              }}
            >
              Ahora no
            </button>
            <button
              type="submit"
              style={{
                ...styles.btn,
                opacity: procesando || Object.keys(fieldErrors).length > 0 ? 0.6 : 1,
                cursor: procesando || Object.keys(fieldErrors).length > 0 ? 'not-allowed' : 'pointer',
              }}
              disabled={procesando || Object.keys(fieldErrors).length > 0}
            >
              {procesando ? '⏳ Convirtiendo...' : 'Convertir cuenta →'}
            </button>
          </div>
        </form>

        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          💡 Después podrás acceder con tu nuevo email y contraseña. Tus proyectos estarán disponibles en tu workspace.
        </div>
      </div>
    </div>
  )
}

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
  },
  divider: { width: '100%', height: 1, background: '#f1f5f9', margin: '12px 0' },
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
  fieldErrorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
    display: 'block',
  },
  btn: {
    flex: 1,
    padding: '12px 0',
    background: 'linear-gradient(135deg, #1e40af, #0369a1)',
    color: '#fff',
    border: 'none',
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 700,
    boxShadow: '0 4px 14px rgba(30,64,175,0.35)',
    cursor: 'pointer',
  },
  btnSecondary: {
    flex: 1,
    padding: '12px 0',
    background: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 700,
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
