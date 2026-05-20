-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX USUARIOS HUÉRFANOS: usuarios en auth.users sin perfil_usuario
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- CONTEXTO:
-- Algunos usuarios se registraron ANTES de instalar el trigger handle_new_user
-- (sql/008_fix_signup_trigger.sql). El cliente intentó crear org + perfil con
-- INSERT directos y falló con 401 Unauthorized debido a RLS. El auth.users sí
-- se creó pero el perfil + org no.
--
-- Esta migración detecta esos usuarios huérfanos y les crea su organización +
-- perfil manualmente (replicando la lógica del trigger).
--
-- IDEMPOTENTE: se puede ejecutar varias veces sin causar duplicados.
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  user_record  RECORD;
  nueva_org_id UUID;
  nombre_val   TEXT;
  updated_count INT;
BEGIN
  FOR user_record IN
    SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
    FROM auth.users u
    LEFT JOIN public.perfiles_usuario p ON p.user_id = u.id
    WHERE p.id IS NULL
    ORDER BY u.created_at
  LOOP
    -- Determinar nombre completo
    nombre_val := COALESCE(
      user_record.raw_user_meta_data->>'nombre_completo',
      user_record.raw_user_meta_data->>'name',
      user_record.email
    );

    -- ── CASO A: ¿existe invitación pendiente para este email? ──────────
    UPDATE public.perfiles_usuario
    SET user_id            = user_record.id,
        activo             = true,
        ultimo_acceso      = NOW(),
        nombre_completo    = nombre_val,
        tokens_disponibles = GREATEST(tokens_disponibles, 2)
    WHERE user_id IS NULL
      AND nombre_completo = user_record.email;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    -- ── CASO B: sin invitación → crear org + perfil nuevos ─────────────
    IF updated_count = 0 THEN
      INSERT INTO public.organizaciones (nombre, propietario_id, plan, activa)
      VALUES (nombre_val || ' - Workspace', user_record.id, 'free', true)
      RETURNING id INTO nueva_org_id;

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
        user_record.id,
        nombre_val,
        'admin',
        true,
        nueva_org_id,
        2,
        0,
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Creado org + perfil para usuario huérfano: %', user_record.email;
    ELSE
      RAISE NOTICE 'Vinculado perfil de invitación para: %', user_record.email;
    END IF;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════
-- Ejecuta esto después para confirmar que NO quedan usuarios huérfanos:

-- SELECT u.email, u.created_at, p.id AS perfil_id, o.nombre AS organizacion
-- FROM auth.users u
-- LEFT JOIN public.perfiles_usuario p ON p.user_id = u.id
-- LEFT JOIN public.organizaciones o ON o.id = p.organizacion_id
-- ORDER BY u.created_at DESC;
