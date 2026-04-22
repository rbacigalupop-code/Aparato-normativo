import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import {
  signUp,
  signIn,
  signOut,
  getSession,
  obtenerPerfil,
  obtenerOrganizacionesUsuario,
  invitarUsuario,
  listarUsuariosOrg,
  actualizarRolUsuario,
  desactivarUsuario,
  supabase,
} from '../supabase'
import {
  validarEmail,
  validarPassword,
  validarNombre,
  validarCoincidencia,
} from '../utils/validation'
import { createError, createSuccess } from '../utils/errors'

// Crear contexto de autenticación
export const AuthContext = createContext(null)

// Hook para usar el contexto de autenticación
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe estar dentro de <AuthProvider>')
  }
  return ctx
}

// Provider de autenticación
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [organizaciones, setOrganizaciones] = useState([])
  const [orgActual, setOrgActual] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Monitorear cambios de sesión
  useEffect(() => {
    setCargando(true)

    // Obtener sesión actual
    getSession().then(sess => {
      setSession(sess)
      if (sess?.user) {
        cargarDatosUsuario(sess.user.id)
      } else {
        setCargando(false)
      }
    })

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess)
      if (sess?.user) {
        cargarDatosUsuario(sess.user.id)
      } else {
        setUser(null)
        setPerfil(null)
        setOrganizaciones([])
        setOrgActual(null)
        setCargando(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  // Cargar datos del usuario (perfil + organizaciones)
  async function cargarDatosUsuario(userId) {
    try {
      const perfil = await obtenerPerfil(userId)
      const orgs = await obtenerOrganizacionesUsuario(userId)

      setUser({ id: userId })
      setPerfil(perfil)
      setOrganizaciones(orgs)

      // Establecer org actual (la primera)
      if (perfil) {
        setOrgActual(perfil.organizaciones)
      }
    } catch (err) {
      console.error('Error cargando datos de usuario:', err)
      setError('Error al cargar datos de usuario')
    } finally {
      setCargando(false)
    }
  }

  // Función: Registrarse
  const handleSignUp = useCallback(async (email, password, nombreCompleto, passwordConfirm) => {
    setError(null)

    // Validaciones locales
    const emailErr = validarEmail(email)
    if (emailErr) {
      const err = createError(emailErr, 'VALIDATION')
      setError(emailErr)
      return err
    }

    const passwordErr = validarPassword(password)
    if (passwordErr) {
      const err = createError(passwordErr, 'VALIDATION')
      setError(passwordErr)
      return err
    }

    if (passwordConfirm) {
      const confirmErr = validarCoincidencia(password, passwordConfirm, 'Contraseñas')
      if (confirmErr) {
        const err = createError(confirmErr, 'VALIDATION')
        setError(confirmErr)
        return err
      }
    }

    const nombreErr = validarNombre(nombreCompleto)
    if (nombreErr) {
      const err = createError(nombreErr, 'VALIDATION')
      setError(nombreErr)
      return err
    }

    const result = await signUp(email, password, nombreCompleto)
    if (!result.ok) {
      setError(result.error?.message || result.error)
      return result
    }
    return createSuccess()
  }, [])

  // Función: Iniciar sesión
  const handleSignIn = useCallback(async (email, password) => {
    setError(null)

    // Validaciones locales
    const emailErr = validarEmail(email)
    if (emailErr) {
      const err = createError(emailErr, 'VALIDATION')
      setError(emailErr)
      return err
    }

    if (!password || password.trim() === '') {
      const err = createError('Contraseña requerida', 'VALIDATION')
      setError('Contraseña requerida')
      return err
    }

    const result = await signIn(email, password)
    if (!result.ok) {
      setError(result.error?.message || result.error)
      return result
    }
    return createSuccess()
  }, [])

  // Función: Cerrar sesión
  const handleSignOut = useCallback(async () => {
    const ok = await signOut()
    if (ok) {
      setSession(null)
      setUser(null)
      setPerfil(null)
      setOrganizaciones([])
      setOrgActual(null)
    }
    return ok
  }, [])

  // Función: Cambiar organización activa
  const switchOrganzacion = useCallback((orgId) => {
    const org = organizaciones.find(o => o.id === orgId)
    if (org) {
      setOrgActual(org)
    }
  }, [organizaciones])

  // Función: Invitar usuario
  const handleInvitarUsuario = useCallback(
    async (email, rol = 'viewer') => {
      if (!orgActual) return { ok: false, error: 'No hay organización seleccionada' }
      return await invitarUsuario(orgActual.id, email, rol)
    },
    [orgActual]
  )

  // Función: Listar usuarios de la org
  const handleListarUsuarios = useCallback(async () => {
    if (!orgActual) return []
    return await listarUsuariosOrg(orgActual.id)
  }, [orgActual])

  // Función: Cambiar rol de usuario
  const handleCambiarRol = useCallback(
    (perfilId, nuevoRol) => actualizarRolUsuario(perfilId, nuevoRol),
    []
  )

  // Función: Desactivar usuario
  const handleDesactivarUsuario = useCallback(
    (perfilId) => desactivarUsuario(perfilId),
    []
  )

  // Valor del contexto
  const value = {
    // Estado
    session,
    user,
    perfil,
    organizaciones,
    orgActual,
    cargando,
    error,

    // Funciones de autenticación
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,

    // Funciones de organización
    switchOrganzacion,

    // Funciones de gestión de usuarios
    invitarUsuario: handleInvitarUsuario,
    listarUsuarios: handleListarUsuarios,
    cambiarRol: handleCambiarRol,
    desactivarUsuario: handleDesactivarUsuario,

    // Helpers
    isAdmin: perfil?.rol === 'admin',
    isLoggedIn: !!session,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
