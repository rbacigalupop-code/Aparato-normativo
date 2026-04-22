import { useState, useEffect } from 'react'
import { obtenerTokenLegacy, contarProyectosToken } from './supabase'
import MigrationModal from './components/MigrationModal'

/**
 * MigrationGate
 * Detecta si el usuario tiene un token antiguo (OGUC-XXXX-XXXX-XXXX)
 * y ofrece convertirlo a una cuenta de usuario.
 * Si no, pasa al flujo normal de AuthGate.
 */
export default function MigrationGate({ children }) {
  const [estado, setEstado] = useState('checking') // 'checking' | 'auth_required' | 'migration_available' | 'proceeding'
  const [tokenDetectado, setTokenDetectado] = useState(null)
  const [datosToken, setDatosToken] = useState(null)
  const [proyectosMigrables, setProyectosMigrables] = useState(0)

  useEffect(() => {
    detectarToken()
  }, [])

  async function detectarToken() {
    try {
      // 1. Buscar token en localStorage
      let token = localStorage.getItem('nc_token_legacy')

      // 2. Buscar en URL (query param)
      if (!token) {
        const params = new URLSearchParams(window.location.search)
        token = params.get('token')
      }

      if (!token) {
        // No hay token, proceder a auth normal
        setEstado('auth_required')
        return
      }

      // 3. Validar token legado
      const result = await obtenerTokenLegacy(token)

      if (!result.ok) {
        // Token inválido, limpiar y proceder a auth
        localStorage.removeItem('nc_token_legacy')
        setEstado('auth_required')
        return
      }

      // 4. Token válido, contar proyectos migrables
      const count = await contarProyectosToken(token)

      setTokenDetectado(token)
      setDatosToken(result.data)
      setProyectosMigrables(count)
      setEstado('migration_available')
    } catch (err) {
      console.error('Error detectando token:', err)
      setEstado('auth_required')
    }
  }

  function handleMigrationComplete() {
    // Limpiar token del localStorage
    localStorage.removeItem('nc_token_legacy')
    // Mostrar children (app)
    setEstado('proceeding')
  }

  function handleSkipMigration() {
    // Limpiar token y proceder a auth normal
    localStorage.removeItem('nc_token_legacy')
    setEstado('auth_required')
  }

  // Mientras se detecta
  if (estado === 'checking') {
    return <LoadingScreen />
  }

  // Si hay token antiguo disponible para migrar
  if (estado === 'migration_available' && tokenDetectado && datosToken) {
    return (
      <MigrationModal
        token={tokenDetectado}
        datosToken={datosToken}
        proyectosMigrables={proyectosMigrables}
        onMigrationComplete={handleMigrationComplete}
        onSkip={handleSkipMigration}
      />
    )
  }

  // Si no hay token o migración completada, mostrar los children (AuthGate + App)
  return children
}

function LoadingScreen() {
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <img src="/logo.png" alt="NormaCheck" style={{ width: 64, height: 'auto', marginBottom: 16 }} />
        <div style={styles.tagline}>Verificación normativa OGUC</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, marginTop: 24 }}>
          <div style={styles.spinner} />
          Inicializando...
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
  tagline: { fontSize: 12, color: '#64748b', marginBottom: 4, textAlign: 'center' },
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
if (!document.getElementById('migration-gate-spin-style')) {
  const st = document.createElement('style')
  st.id = 'migration-gate-spin-style'
  st.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'
  document.head.appendChild(st)
}
