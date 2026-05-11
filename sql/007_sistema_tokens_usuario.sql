-- ═══════════════════════════════════════════════════════════════════════════════
-- Sistema de Tokens por Usuario (Reemplaza tokens legacy)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Objetivo:
--   - Cada usuario tiene una cuota de "tokens" para generar informes
--   - 2 tokens de bienvenida al registrarse
--   - 1 token = 1 informe generado
--   - Admin puede asignar más tokens
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Agregar columnas de tokens a perfiles_usuario ──────────────────────────
ALTER TABLE public.perfiles_usuario
  ADD COLUMN IF NOT EXISTS tokens_disponibles INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS tokens_usados INTEGER NOT NULL DEFAULT 0;

-- ─── 2. Asegurar que usuarios existentes tengan tokens de bienvenida ──────────
UPDATE public.perfiles_usuario
SET tokens_disponibles = 2
WHERE tokens_disponibles IS NULL OR tokens_disponibles = 0;

-- ─── 3. Actualizar trigger para dar tokens de bienvenida a nuevos usuarios ────
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
    -- Vincular invitación existente (mantiene tokens si los tiene)
    UPDATE public.perfiles_usuario
    SET user_id = NEW.id,
        activo = true,
        ultimo_acceso = NOW(),
        nombre_completo = COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
        -- Asegurar al menos 2 tokens si la invitación no los tenía
        tokens_disponibles = GREATEST(tokens_disponibles, 2)
    WHERE id = invitacion_existente.id;
  ELSE
    -- Crear perfil nuevo con 2 tokens de bienvenida
    INSERT INTO public.perfiles_usuario (
      user_id,
      nombre_completo,
      rol,
      activo,
      organizacion_id,
      tokens_disponibles,
      tokens_usados,
      created_at,
      ultimo_acceso
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
      'viewer',
      true,
      NULL,
      2,  -- 🎁 Welcome tokens
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── 4. (Opcional) Eliminar tablas legacy de tokens ───────────────────────────
-- Descomenta estas líneas si quieres eliminar el sistema legacy completamente.
-- ATENCIÓN: Esto borra los datos del sistema antiguo de tokens.

-- DROP TABLE IF EXISTS public.tokens_legado CASCADE;
-- DROP TABLE IF EXISTS public.tokens CASCADE;

-- ─── 5. Verificar el resultado ────────────────────────────────────────────────
SELECT
  p.user_id,
  p.nombre_completo,
  p.rol,
  p.tokens_disponibles,
  p.tokens_usados,
  p.activo
FROM public.perfiles_usuario p
WHERE p.user_id IS NOT NULL
ORDER BY p.created_at DESC;
