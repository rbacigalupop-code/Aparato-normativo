-- ═══════════════════════════════════════════════════════════════════════════════
-- FEATURE: Absorber usuario existente — admin agrega un usuario ya registrado
-- a su organización sin tener que invitarlo de nuevo.
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- CASO DE USO:
-- Un usuario se registró directamente (no por invitación) y quedó en su propia
-- organización. Otro admin quiere "adoptarlo" en su org para gestionar sus
-- privilegios. Esta función permite hacerlo en un solo paso.
--
-- SEGURIDAD:
-- - SECURITY DEFINER → corre con privilegios postgres (bypasa RLS para auth.users)
-- - Verifica que el caller sea admin activo del org destino
-- - Verifica que el usuario destino exista en auth.users
-- - No permite absorberse a sí mismo
-- - No permite absorber a alguien ya en la misma org
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.absorber_usuario_existente(
  p_email   TEXT,
  p_org_id  UUID,
  p_rol     TEXT DEFAULT 'viewer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id      UUID;
  v_caller_perfil  RECORD;
  v_target_user_id UUID;
  v_target_meta    JSONB;
  v_target_name    TEXT;
  v_target_perfil  RECORD;
  v_target_old_org UUID;
  v_old_org_owner  UUID;
BEGIN
  -- 1. Quién llama
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autenticado');
  END IF;

  -- 2. Verificar que el caller es admin activo del org destino
  SELECT * INTO v_caller_perfil
  FROM public.perfiles_usuario
  WHERE user_id = v_caller_id
    AND organizacion_id = p_org_id
    AND rol = 'admin'
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No tienes permisos de administrador en esta organización');
  END IF;

  -- 3. Validar rol
  IF p_rol NOT IN ('admin', 'viewer') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Rol inválido (debe ser admin o viewer)');
  END IF;

  -- 4. Validar email
  IF p_email IS NULL OR LENGTH(TRIM(p_email)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Email requerido');
  END IF;

  -- 5. Buscar usuario por email (case-insensitive)
  SELECT id, raw_user_meta_data INTO v_target_user_id, v_target_meta
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(p_email))
  LIMIT 1;

  IF v_target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'No existe ningún usuario registrado con ese email. Para usuarios nuevos, usa "Invitar usuario" en su lugar.'
    );
  END IF;

  -- 6. Determinar nombre completo desde metadata o fallback a email
  v_target_name := COALESCE(
    v_target_meta->>'nombre_completo',
    v_target_meta->>'name',
    p_email
  );

  -- 7. No permitir absorberse a sí mismo
  IF v_target_user_id = v_caller_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No puedes absorberte a ti mismo');
  END IF;

  -- 8. Buscar perfil existente del target
  SELECT id, organizacion_id INTO v_target_perfil
  FROM public.perfiles_usuario
  WHERE user_id = v_target_user_id
  LIMIT 1;

  v_target_old_org := v_target_perfil.organizacion_id;

  -- 9. Si ya está en la misma org, no hacer nada
  IF v_target_old_org = p_org_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'El usuario ya pertenece a esta organización');
  END IF;

  -- 10. Mover o crear perfil
  IF v_target_perfil.id IS NULL THEN
    -- No tiene perfil → crearlo en la org del admin
    INSERT INTO public.perfiles_usuario (
      user_id, nombre_completo, rol, activo, organizacion_id,
      tokens_disponibles, tokens_usados, created_at, ultimo_acceso
    )
    VALUES (
      v_target_user_id, v_target_name, p_rol, true, p_org_id,
      2, 0, NOW(), NOW()
    );
  ELSE
    -- Tiene perfil → mover a la org del admin con el rol indicado
    UPDATE public.perfiles_usuario
    SET organizacion_id = p_org_id,
        rol             = p_rol,
        activo          = true,
        ultimo_acceso   = NOW()
    WHERE id = v_target_perfil.id;
  END IF;

  -- 11. Si tenía workspace personal propio (era propietario), desactivarlo
  IF v_target_old_org IS NOT NULL THEN
    SELECT propietario_id INTO v_old_org_owner
    FROM public.organizaciones
    WHERE id = v_target_old_org;

    IF v_old_org_owner = v_target_user_id THEN
      UPDATE public.organizaciones
      SET activa = false
      WHERE id = v_target_old_org;
    END IF;
  END IF;

  -- 12. Retornar éxito con detalles
  RETURN jsonb_build_object(
    'ok', true,
    'mensaje', 'Usuario ' || v_target_name || ' agregado a la organización como ' || p_rol,
    'usuario', jsonb_build_object(
      'user_id', v_target_user_id,
      'nombre', v_target_name,
      'email', p_email,
      'rol', p_rol,
      'org_anterior', v_target_old_org
    )
  );
END $$;

-- Permitir que usuarios autenticados llamen esta función
GRANT EXECUTE ON FUNCTION public.absorber_usuario_existente(TEXT, UUID, TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- USO (desde el cliente):
--
-- const { data, error } = await supabase.rpc('absorber_usuario_existente', {
--   p_email: 'usuario@ejemplo.com',
--   p_org_id: orgActual.id,
--   p_rol: 'viewer',  // o 'admin'
-- })
--
-- data → { ok: true, mensaje, usuario } | { ok: false, error }
-- ═══════════════════════════════════════════════════════════════════════════════
