-- ═══════════════════════════════════════════════════════════════════════════════
-- Trigger para crear perfil automáticamente cuando se registra un nuevo usuario
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Objetivo:
--   Evitar el error 406 "Cannot coerce result" cuando obtenerPerfil() intenta
--   buscar un perfil que no existe después del signup.
--
-- Cómo funciona:
--   1. Cuando auth.users inserta un nuevo registro (nuevo usuario se registra)
--   2. Se ejecuta la función handle_new_user()
--   3. Que inserta automáticamente un perfil en perfiles_usuario
--
-- Ejecutar esto UNA SOLA VEZ en la consola SQL de Supabase
-- ═══════════════════════════════════════════════════════════════════════════════

-- Paso 1: Crear función que inserta el perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles_usuario (
    user_id,
    nombre_completo,
    rol,
    activo,
    organizacion_id,
    created_at,
    ultimo_acceso
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.user_metadata->>'nombre_completo', NEW.email),
    'viewer',
    true,
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Paso 2: Crear el trigger que llama a la función
-- (Primero drop si existe, para evitar errores)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- Listo. Ahora cuando un usuario se registre:
-- 1. auth.users inserta nuevo usuario
-- 2. Trigger dispara handle_new_user()
-- 3. Se crea automáticamente su perfil en perfiles_usuario
-- 4. El obtenerPerfil() no retorna null, obtiene el perfil
-- 5. No más error 406
-- ═══════════════════════════════════════════════════════════════════════════════
