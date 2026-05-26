-- ═══════════════════════════════════════════════════════════════════════════════
-- 013_user_plans.sql
-- Sistema de planes (free / trial / pro) para gating del módulo Energético Pro.
-- Ejecutar en Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Columnas en perfiles_usuario
ALTER TABLE public.perfiles_usuario
  ADD COLUMN IF NOT EXISTS plan         TEXT        DEFAULT 'free'
    CHECK (plan IN ('free', 'trial', 'pro')),
  ADD COLUMN IF NOT EXISTS trial_expira TIMESTAMPTZ DEFAULT NULL;

-- 2. Índice para queries de planes (panel admin)
CREATE INDEX IF NOT EXISTS idx_perfiles_plan ON public.perfiles_usuario(plan);

-- 3. RPC para activar prueba — solo admins de la organización pueden invocarlo
CREATE OR REPLACE FUNCTION public.activar_prueba_pro(
  p_perfil_id UUID,
  p_dias      INT DEFAULT 14
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_org_id    UUID;
  v_es_admin  BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autenticado');
  END IF;

  -- Verificar que el caller sea admin de la organización del perfil objetivo
  SELECT organizacion_id INTO v_org_id
  FROM public.perfiles_usuario WHERE id = p_perfil_id;

  SELECT EXISTS (
    SELECT 1 FROM public.perfiles_usuario
    WHERE user_id = v_caller_id
      AND organizacion_id = v_org_id
      AND rol = 'admin'
      AND activo = true
  ) INTO v_es_admin;

  IF NOT v_es_admin THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solo administradores pueden activar pruebas');
  END IF;

  -- Activar prueba
  UPDATE public.perfiles_usuario
  SET plan         = 'trial',
      trial_expira = NOW() + (p_dias || ' days')::INTERVAL
  WHERE id = p_perfil_id;

  RETURN jsonb_build_object(
    'ok',         true,
    'plan',       'trial',
    'expira_en',  (NOW() + (p_dias || ' days')::INTERVAL)::TEXT,
    'mensaje',    'Prueba activada por ' || p_dias || ' días'
  );
END $$;

GRANT EXECUTE ON FUNCTION public.activar_prueba_pro(UUID, INT) TO authenticated;

-- 4. RPC para cambiar plan directamente (free / pro) — admin only
CREATE OR REPLACE FUNCTION public.cambiar_plan_usuario(
  p_perfil_id UUID,
  p_plan      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_org_id    UUID;
  v_es_admin  BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autenticado');
  END IF;

  IF p_plan NOT IN ('free', 'pro') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Plan inválido. Use activar_prueba_pro() para trials');
  END IF;

  SELECT organizacion_id INTO v_org_id
  FROM public.perfiles_usuario WHERE id = p_perfil_id;

  SELECT EXISTS (
    SELECT 1 FROM public.perfiles_usuario
    WHERE user_id = v_caller_id
      AND organizacion_id = v_org_id
      AND rol = 'admin'
      AND activo = true
  ) INTO v_es_admin;

  IF NOT v_es_admin THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solo administradores pueden cambiar planes');
  END IF;

  UPDATE public.perfiles_usuario
  SET plan         = p_plan,
      trial_expira = NULL   -- limpia el trial si lo había
  WHERE id = p_perfil_id;

  RETURN jsonb_build_object('ok', true, 'plan', p_plan);
END $$;

GRANT EXECUTE ON FUNCTION public.cambiar_plan_usuario(UUID, TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Verificación post-instalación:
-- SELECT id, nombre_completo, rol, plan, trial_expira FROM perfiles_usuario;
-- ═══════════════════════════════════════════════════════════════════════════════
