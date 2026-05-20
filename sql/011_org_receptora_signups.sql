-- ═══════════════════════════════════════════════════════════════════════════════
-- FEATURE: Org receptora de signups directos
-- ═══════════════════════════════════════════════════════════════════════════════
-- Permite designar UNA organización como "receptora" de todos los nuevos
-- registros directos (signups por email/password sin invitación previa).
-- Los usuarios que se registren así quedan automáticamente como 'viewer'
-- en esa organización, en lugar de obtener su propio workspace.
--
-- Comportamiento del trigger handle_new_user:
--   1. ¿Hay invitación pendiente para este email? → vincular (rol heredado)
--   2. ¿Existe una org marcada como receptora? → entrar como viewer ahí
--   3. Fallback (no hay receptora) → crear workspace personal como admin
--
-- DESACTIVAR: poner recibe_signups = FALSE en la org → vuelve al comportamiento
-- original (cada usuario obtiene su propio workspace).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Agregar columna recibe_signups a organizaciones
ALTER TABLE public.organizaciones
ADD COLUMN IF NOT EXISTS recibe_signups BOOLEAN DEFAULT FALSE;

-- Índice para lookup rápido (solo habrá ~1 fila con TRUE)
CREATE INDEX IF NOT EXISTS idx_org_recibe_signups
  ON public.organizaciones(recibe_signups)
  WHERE recibe_signups = TRUE;

-- 2. Reemplazar trigger handle_new_user con la nueva lógica
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invitacion_existente RECORD;
  org_receptora        UUID;
  nueva_org_id         UUID;
  nombre_completo_val  TEXT;
BEGIN
  nombre_completo_val := COALESCE(
    NEW.raw_user_meta_data->>'nombre_completo',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

  -- ── PASO 1: ¿hay invitación pendiente para este email? ──────────────────
  SELECT * INTO invitacion_existente
  FROM public.perfiles_usuario
  WHERE user_id IS NULL
    AND nombre_completo = NEW.email
  LIMIT 1;

  IF invitacion_existente.id IS NOT NULL THEN
    -- Caso A: usuario invitado — vincular el perfil pendiente con su rol original
    UPDATE public.perfiles_usuario
    SET user_id            = NEW.id,
        activo             = true,
        ultimo_acceso      = NOW(),
        nombre_completo    = nombre_completo_val,
        tokens_disponibles = GREATEST(tokens_disponibles, 2)
    WHERE id = invitacion_existente.id;
    RETURN NEW;
  END IF;

  -- ── PASO 2: ¿hay una org marcada como receptora? ────────────────────────
  SELECT id INTO org_receptora
  FROM public.organizaciones
  WHERE recibe_signups = TRUE
    AND activa = TRUE
  ORDER BY created_at ASC
  LIMIT 1;

  IF org_receptora IS NOT NULL THEN
    -- Caso B: registro directo + hay org receptora → entrar como viewer
    INSERT INTO public.perfiles_usuario (
      user_id, nombre_completo, rol, activo, organizacion_id,
      tokens_disponibles, tokens_usados, created_at, ultimo_acceso
    )
    VALUES (
      NEW.id, nombre_completo_val, 'viewer', true, org_receptora,
      2, 0, NOW(), NOW()
    )
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  -- ── PASO 3: fallback (sin receptora) → crear workspace personal admin ───
  INSERT INTO public.organizaciones (nombre, propietario_id, plan, activa)
  VALUES (nombre_completo_val || ' - Workspace', NEW.id, 'free', true)
  RETURNING id INTO nueva_org_id;

  INSERT INTO public.perfiles_usuario (
    user_id, nombre_completo, rol, activo, organizacion_id,
    tokens_disponibles, tokens_usados, created_at, ultimo_acceso
  )
  VALUES (
    NEW.id, nombre_completo_val, 'admin', true, nueva_org_id,
    2, 0, NOW(), NOW()
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-crear el trigger (en caso de que no exista)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. RPC para que el admin pueda toggle desde la app
CREATE OR REPLACE FUNCTION public.set_org_recibe_signups(
  p_org_id UUID,
  p_recibe BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_es_admin  BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autenticado');
  END IF;

  -- Solo admin del org puede cambiar el setting
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles_usuario
    WHERE user_id = v_caller_id
      AND organizacion_id = p_org_id
      AND rol = 'admin'
      AND activo = true
  ) INTO v_es_admin;

  IF NOT v_es_admin THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No tienes permisos de administrador');
  END IF;

  -- Si activamos esta org, desactivar las demás (solo una receptora a la vez)
  IF p_recibe THEN
    UPDATE public.organizaciones
    SET recibe_signups = FALSE
    WHERE id != p_org_id AND recibe_signups = TRUE;
  END IF;

  UPDATE public.organizaciones
  SET recibe_signups = p_recibe
  WHERE id = p_org_id;

  RETURN jsonb_build_object(
    'ok', true,
    'recibe', p_recibe,
    'mensaje', CASE WHEN p_recibe
      THEN 'Activado: nuevos registros entrarán a esta organización como viewer'
      ELSE 'Desactivado: nuevos registros volverán a crear su propio workspace'
    END
  );
END $$;

GRANT EXECUTE ON FUNCTION public.set_org_recibe_signups(UUID, BOOLEAN) TO authenticated;

-- 4. RPC para consultar el estado actual
CREATE OR REPLACE FUNCTION public.get_org_recibe_signups(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(recibe_signups, FALSE)
  FROM public.organizaciones
  WHERE id = p_org_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_org_recibe_signups(UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- USO desde el cliente:
--
-- // Activar/desactivar
-- await supabase.rpc('set_org_recibe_signups', { p_org_id: orgId, p_recibe: true })
--
-- // Consultar
-- const { data } = await supabase.rpc('get_org_recibe_signups', { p_org_id: orgId })
-- // data → true | false
-- ═══════════════════════════════════════════════════════════════════════════════
