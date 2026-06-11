import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * UserHeader
 * Muestra el rol, nombre de usuario y botón de logout en el header
 */
export default function UserHeader({ onFeedback }) {
  const { perfil, isAdmin, signOut, tokens } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  async function handleLogout() {
    const ok = await signOut()
    if (ok) {
      setShowMenu(false)
    }
  }

  const nombreUsuario = perfil?.nombre_completo || perfil?.user_id || '—'
  const rol = isAdmin ? 'Admin' : 'Viewer'
  const rolColor = isAdmin ? '#166534' : '#64748b'
  const rolBg = isAdmin ? '#dcfce7' : '#f1f5f9'

  const tokensDisponibles = tokens?.disponibles ?? 0
  const tokensBajos = tokensDisponibles > 0 && tokensDisponibles < 2
  const tokensAgotados = tokensDisponibles === 0
  const tokenBg = tokensAgotados ? '#fee2e2' : tokensBajos ? '#fef3c7' : '#dbeafe'
  const tokenColor = tokensAgotados ? '#991b1b' : tokensBajos ? '#a16207' : '#1e40af'

  return (
    <div className="nc-user-header" style={{ position: 'relative', minWidth: 0, maxWidth: '100%' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        title={nombreUsuario}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          borderRadius: 8,
          padding: '5px 12px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: '100%',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <span style={{
          background: rolBg,
          color: rolColor,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {rol}
        </span>
        {/* Badge de tokens */}
        <span
          style={{
            background: tokenBg,
            color: tokenColor,
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            flexShrink: 0,
          }}
          title={`${tokensDisponibles} informe${tokensDisponibles !== 1 ? 's' : ''} disponible${tokensDisponibles !== 1 ? 's' : ''}`}
        >
          🎫 {tokensDisponibles}
        </span>
        {/* Nombre usuario: oculto en mobile (clase nc-user-name), truncado con ellipsis en desktop */}
        <span
          className="nc-user-name"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 180,
            minWidth: 0,
          }}
        >
          {nombreUsuario}
        </span>
        <span style={{ fontSize: 10, flexShrink: 0 }}>▼</span>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: 200,
          }}
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ padding: '8px 16px', fontSize: 11, color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
              {nombreUsuario}
            </div>
            <div style={{ padding: '8px 16px', fontSize: 11, color: '#64748b' }}>
              Rol: <strong style={{ color: rolColor }}>{rol}</strong>
            </div>
            <div style={{ padding: '8px 16px', fontSize: 11, color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
              🎫 Tokens disponibles: <strong style={{ color: tokenColor }}>{tokensDisponibles}</strong>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                Informes generados: {tokens?.usados ?? 0}
              </div>
              {tokensAgotados && (
                <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>
                  ⚠ Sin tokens. Contacta al admin.
                </div>
              )}
            </div>
            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 8, paddingTop: 8 }}>
              {onFeedback && (
                <button
                  onClick={() => { setShowMenu(false); onFeedback() }}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    borderRadius: 0,
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#2563eb',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#eff6ff'}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  📬 Enviar feedback
                </button>
              )}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderRadius: 0,
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#dc2626',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
