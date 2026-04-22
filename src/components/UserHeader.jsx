import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * UserHeader
 * Muestra el rol, nombre de usuario y botón de logout en el header
 */
export default function UserHeader() {
  const { perfil, isAdmin, signOut } = useAuth()
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

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
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
        }}
      >
        <span style={{
          background: rolBg,
          color: rolColor,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
        }}>
          {rol}
        </span>
        <span>{nombreUsuario}</span>
        <span style={{ fontSize: 10 }}>▼</span>
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
            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 8, paddingTop: 8 }}>
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
