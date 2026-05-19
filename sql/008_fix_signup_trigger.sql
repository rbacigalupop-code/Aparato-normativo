-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX SIGNUP: Trigger crea organización + perfil automáticamente
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PROBLEMA:
-- Cuando un usuario se registra, el cliente intenta hacer INSERT a la tabla
-- 'organizaciones' inmediatamente después de signUp(). Pero a ese momento el
-- cliente NO está autenticado todavía (no tiene sesión activa), por lo que el
-- INSERT falla con 401 Unauthorized (si RLS activo) o con permission denied.
--
-- SOLUCIÓN:
-- Mover toda la creación de org + perfil al TRIGGER 'handle_new_user' que ya
-- existe en la base de datos. El trigger usa SECURITY DEFINER por lo que corre
-- con privilegios de superuser, bypaseando RLS.
--
-- El trigger ya crea perfiles_usuario. Esta migración lo extiende para crear
-- también la organización personal del usuario.
--
-- Ejecutar UNA SOLA VEZ en Supabase Console (SQL Editor).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invitacion_existente RECORD;
  nueva_org_id        UUID;
  nombre_completo_val TEXT;
BEGIN
  -- Determinar nombre completo del usuario
  nombre_completo_val := COALESCE(
    NEW.raw_user_meta_data->>'nombre_completo',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

  -- ── PASO 1: Buscar si hay invitación pendiente para este email ──────────
  SELECT * INTO invitacion_existente
  FROM public.perfiles_usuario
  WHERE user_id IS NULL
    AND nombre_completo = NEW.email
  LIMIT 1;

  IF invitacion_existente.id IS NOT NULL THEN
    -- Caso A: usuario invitado — vincular el perfil pendiente con el nuevo user_id
    UPDATE public.perfiles_usuario
    SET user_id          = NEW.id,
        activo           = true,
        ultimo_acceso    = NOW(),
        nombre_completo  = nombre_completo_val,
        tokens_disponibles = GREATEST(tokens_disponibles, 2)
    WHERE id = invitacion_existente.id;
  ELSE
    -- Caso B: usuario nuevo (sin invitación) — crear organización + perfil

    -- 1) Crear organización personal
    INSERT INTO public.organizaciones (
      nombre,
      propietario_id,
      plan,
      activa
    )
    VALUES (
      nombre_completo_val || ' - Workspace',
      NEW.id,
      'free',
      true
    )
    RETURNING id INTO nueva_org_id;

    -- 2) Crear perfil con admin rol y vinculado a la org
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
      nombre_completo_val,
      'admin',                -- usuarios nuevos son admin de su propia org
      true,
      nueva_org_id,
      2,                      -- 2 tokens de bienvenida
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICAR
-- Ejecuta esta consulta después del trigger para verificar que un nuevo usuario
-- tenga tanto perfil como organización:
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- SELECT
--   u.email,
--   p.nombre_completo,
--   p.rol,
--   p.tokens_disponibles,
--   o.nombre AS organizacion
-- FROM auth.users u
-- LEFT JOIN public.perfiles_usuario p ON p.user_id = u.id
-- LEFT JOIN public.organizaciones o ON o.id = p.organizacion_id
-- ORDER BY u.created_at DESC
-- LIMIT 5;
