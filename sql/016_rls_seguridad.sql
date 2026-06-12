-- ═══════════════════════════════════════════════════════════════════════════════
-- 016_rls_seguridad.sql — Blindaje de seguridad (RLS + validación)
-- Ejecutar UNA VEZ en Supabase SQL Editor:
-- https://app.supabase.com/project/srukzfoerdgcaymnriax/sql/
--
-- CIERRA (verificado por REST el 2026-06-12, sin autenticar con la clave pública):
--   · perfiles_usuario: lectura completa de los 10 perfiles (nombre/email, rol,
--     plan, tokens) y escritura sin login. → FUGA DE PII + posible escalada.
--   · tokens: lectura completa de los strings de token (credenciales) sin login.
-- Y AÑADE: límites de largo en feedback (anti-inyección de datos basura).
--
-- DISEÑO SEGURO:
--   · es_admin_de_org() es SECURITY DEFINER → evita la recursión infinita de RLS
--     (una policy sobre perfiles_usuario NO puede consultar perfiles_usuario
--      directamente sin recursión).
--   · Los usuarios NO tienen UPDATE directo sobre su perfil → no pueden auto-
--     ascenderse a admin ni regalarse tokens. El consumo de token va por el RPC
--     consumir_token_propio() (SECURITY DEFINER, descuento controlado).
--   · El trigger de alta de usuarios (001) es SECURITY DEFINER → sigue insertando
--     perfiles en signup sin verse afectado por estas políticas.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Helper: ¿el usuario actual es admin activo de la organización p_org?
--    SECURITY DEFINER para leer perfiles_usuario SIN gatillar la RLS de la
--    propia tabla (evita recursión). STABLE = sin efectos secundarios.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.es_admin_de_org(p_org uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles_usuario
    WHERE user_id = auth.uid()
      AND organizacion_id = p_org
      AND rol = 'admin'
      AND activo = true
  );
$$;
GRANT EXECUTE ON FUNCTION public.es_admin_de_org(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RPC para que el usuario consuma UN token propio sin tener UPDATE directo
--    sobre perfiles_usuario (cierra la escalada de privilegios por columnas).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.consumir_token_propio()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perfil RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autenticado');
  END IF;

  SELECT id, tokens_disponibles, tokens_usados INTO v_perfil
  FROM public.perfiles_usuario
  WHERE user_id = auth.uid() AND activo = true
  LIMIT 1;

  IF v_perfil.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Perfil no encontrado');
  END IF;

  IF v_perfil.tokens_disponibles <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'sinTokens', true,
      'error', 'No tienes tokens disponibles. Contacta al administrador para obtener más.');
  END IF;

  UPDATE public.perfiles_usuario
  SET tokens_disponibles = tokens_disponibles - 1,
      tokens_usados      = tokens_usados + 1
  WHERE id = v_perfil.id;

  RETURN jsonb_build_object('ok', true,
    'tokensRestantes', v_perfil.tokens_disponibles - 1,
    'tokensUsados',    v_perfil.tokens_usados + 1);
END $$;
GRANT EXECUTE ON FUNCTION public.consumir_token_propio() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. perfiles_usuario — habilitar RLS y políticas (lectura propia + admin org)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfiles_select_propio_o_admin" ON public.perfiles_usuario;
CREATE POLICY "perfiles_select_propio_o_admin" ON public.perfiles_usuario
  FOR SELECT USING (
    user_id = auth.uid() OR public.es_admin_de_org(organizacion_id)
  );

-- Inserción: solo admin de la org (invitaciones). El signup va por trigger DEFINER.
DROP POLICY IF EXISTS "perfiles_insert_admin" ON public.perfiles_usuario;
CREATE POLICY "perfiles_insert_admin" ON public.perfiles_usuario
  FOR INSERT WITH CHECK ( public.es_admin_de_org(organizacion_id) );

-- Actualización: solo admin de la org (rol, tokens, activo). El usuario común
-- NO actualiza su perfil directamente (token va por RPC).
DROP POLICY IF EXISTS "perfiles_update_admin" ON public.perfiles_usuario;
CREATE POLICY "perfiles_update_admin" ON public.perfiles_usuario
  FOR UPDATE USING ( public.es_admin_de_org(organizacion_id) )
              WITH CHECK ( public.es_admin_de_org(organizacion_id) );

-- Borrado: solo admin de la org.
DROP POLICY IF EXISTS "perfiles_delete_admin" ON public.perfiles_usuario;
CREATE POLICY "perfiles_delete_admin" ON public.perfiles_usuario
  FOR DELETE USING ( public.es_admin_de_org(organizacion_id) );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. tokens y tokens_legado — sistema LEGADO, sin uso en la UI actual.
--    Lockdown total: RLS habilitada sin políticas = nadie desde el cliente
--    (solo service_role / RPC DEFINER). Cierra la fuga de strings de token.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tokens_admin_only" ON public.tokens;
-- (sin políticas: acceso solo vía service_role)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='tokens_legado') THEN
    EXECUTE 'ALTER TABLE public.tokens_legado ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. feedback — límites de largo (anti-inyección de datos basura / abuso).
--    Idempotente: drop + add.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_asunto_len;
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_mensaje_len;
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_respuesta_len;
ALTER TABLE public.feedback
  ADD CONSTRAINT feedback_asunto_len    CHECK (char_length(asunto)  BETWEEN 1 AND 200),
  ADD CONSTRAINT feedback_mensaje_len   CHECK (char_length(mensaje) BETWEEN 1 AND 5000),
  ADD CONSTRAINT feedback_respuesta_len CHECK (respuesta_admin IS NULL OR char_length(respuesta_admin) <= 5000);

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN POST-EJECUCIÓN (debe devolver las 3 tablas con rowsecurity=true):
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('perfiles_usuario','tokens','feedback');
--
-- ROLLBACK de emergencia (si algo se rompe, reabre lectura — NO recomendado):
--   ALTER TABLE public.perfiles_usuario DISABLE ROW LEVEL SECURITY;
-- ═══════════════════════════════════════════════════════════════════════════════
