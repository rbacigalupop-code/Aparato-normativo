-- ═══════════════════════════════════════════════════════════════════════════════
-- Permitir invitaciones (user_id puede ser NULL hasta que se registre)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Objetivo:
--   Permitir crear invitaciones en perfiles_usuario sin un user_id
--   Cuando el usuario se registra, el trigger handle_new_user vincula automáticamente
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Permitir que user_id sea NULL (para invitaciones pendientes)
ALTER TABLE public.perfiles_usuario
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Actualizar el trigger para que al registrarse, vincule las invitaciones existentes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invitacion_existente RECORD;
BEGIN
  -- Buscar si hay invitación pendiente para este email
  SELECT * INTO invitacion_existente
  FROM public.perfiles_usuario
  WHERE user_id IS NULL
    AND nombre_completo = NEW.email
  LIMIT 1;

  IF invitacion_existente.id IS NOT NULL THEN
    -- Vincular la invitación existente con el nuevo user_id
    UPDATE public.perfiles_usuario
    SET user_id = NEW.id,
        activo = true,
        ultimo_acceso = NOW(),
        nombre_completo = COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email)
    WHERE id = invitacion_existente.id;
  ELSE
    -- No hay invitación, crear perfil nuevo
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
      COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
      'viewer',
      true,
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar el cambio
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'perfiles_usuario'
  AND column_name = 'user_id';
