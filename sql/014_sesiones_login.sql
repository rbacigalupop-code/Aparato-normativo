-- ═══════════════════════════════════════════════════════════════════════════════
-- 014_sesiones_login.sql — Tracking de logins para calendario de actividad
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Tabla de sesiones de login (1 fila por cada SIGNED_IN)
CREATE TABLE IF NOT EXISTS public.sesiones_login (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil_id       UUID         REFERENCES public.perfiles_usuario(id) ON DELETE CASCADE,
  organizacion_id UUID         REFERENCES public.organizaciones(id) ON DELETE CASCADE,
  login_at        TIMESTAMPTZ  DEFAULT NOW(),
  user_agent      TEXT
);

CREATE INDEX IF NOT EXISTS idx_sesiones_user_fecha    ON public.sesiones_login(user_id, login_at DESC);
CREATE INDEX IF NOT EXISTS idx_sesiones_org_fecha     ON public.sesiones_login(organizacion_id, login_at DESC);

-- 2. RLS — solo admin de la org puede leer; usuario puede insertar el propio
ALTER TABLE public.sesiones_login ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insertar propia sesion" ON public.sesiones_login
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins ven sesiones de su org" ON public.sesiones_login
  FOR SELECT USING (
    organizacion_id IN (
      SELECT organizacion_id FROM public.perfiles_usuario
      WHERE user_id = auth.uid() AND rol = 'admin' AND activo = true
    )
  );

-- 3. RPC para registrar login (usado por el cliente)
CREATE OR REPLACE FUNCTION public.registrar_sesion_login(p_user_agent TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID;
  v_perfil    RECORD;
  v_sesion_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT id, organizacion_id INTO v_perfil
  FROM public.perfiles_usuario
  WHERE user_id = v_user_id AND activo = true
  LIMIT 1;

  IF v_perfil.id IS NULL THEN
    RETURN NULL;  -- usuario sin perfil aún (caso raro)
  END IF;

  INSERT INTO public.sesiones_login (user_id, perfil_id, organizacion_id, user_agent)
  VALUES (v_user_id, v_perfil.id, v_perfil.organizacion_id, p_user_agent)
  RETURNING id INTO v_sesion_id;

  -- Actualizar ultimo_acceso en perfil (mantener compatibilidad con código existente)
  UPDATE public.perfiles_usuario
  SET ultimo_acceso = NOW()
  WHERE id = v_perfil.id;

  RETURN v_sesion_id;
END $$;

GRANT EXECUTE ON FUNCTION public.registrar_sesion_login(TEXT) TO authenticated;

-- 4. RPC para consultar actividad agregada por día
CREATE OR REPLACE FUNCTION public.actividad_usuarios_org(
  p_org_id    UUID,
  p_dias_atras INT DEFAULT 60
)
RETURNS TABLE (
  perfil_id       UUID,
  nombre_completo TEXT,
  fecha           DATE,
  num_logins      INT,
  primera_hora    TIME,
  ultima_hora     TIME
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    s.perfil_id,
    p.nombre_completo,
    DATE(s.login_at AT TIME ZONE 'America/Santiago') AS fecha,
    COUNT(*)::INT                                    AS num_logins,
    MIN(s.login_at AT TIME ZONE 'America/Santiago')::TIME AS primera_hora,
    MAX(s.login_at AT TIME ZONE 'America/Santiago')::TIME AS ultima_hora
  FROM public.sesiones_login s
  JOIN public.perfiles_usuario p ON p.id = s.perfil_id
  WHERE s.organizacion_id = p_org_id
    AND s.login_at >= (NOW() - (p_dias_atras || ' days')::INTERVAL)
    -- Validar que el caller sea admin de esa org
    AND EXISTS (
      SELECT 1 FROM public.perfiles_usuario
      WHERE user_id = auth.uid()
        AND organizacion_id = p_org_id
        AND rol = 'admin'
        AND activo = true
    )
  GROUP BY s.perfil_id, p.nombre_completo, DATE(s.login_at AT TIME ZONE 'America/Santiago')
  ORDER BY fecha DESC, p.nombre_completo;
$$;

GRANT EXECUTE ON FUNCTION public.actividad_usuarios_org(UUID, INT) TO authenticated;

-- 5. RPC resumen rápido (KPIs)
CREATE OR REPLACE FUNCTION public.resumen_actividad_org(p_org_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_logins_30d',     (SELECT COUNT(*) FROM public.sesiones_login
                              WHERE organizacion_id = p_org_id AND login_at >= NOW() - INTERVAL '30 days'),
    'usuarios_activos_30d', (SELECT COUNT(DISTINCT user_id) FROM public.sesiones_login
                              WHERE organizacion_id = p_org_id AND login_at >= NOW() - INTERVAL '30 days'),
    'usuarios_activos_7d',  (SELECT COUNT(DISTINCT user_id) FROM public.sesiones_login
                              WHERE organizacion_id = p_org_id AND login_at >= NOW() - INTERVAL '7 days'),
    'usuarios_inactivos_14d', (
      SELECT COUNT(*) FROM public.perfiles_usuario p
      WHERE p.organizacion_id = p_org_id
        AND p.activo = true
        AND (p.ultimo_acceso IS NULL OR p.ultimo_acceso < NOW() - INTERVAL '14 days')
    )
  )
  WHERE EXISTS (
    SELECT 1 FROM public.perfiles_usuario
    WHERE user_id = auth.uid() AND organizacion_id = p_org_id AND rol = 'admin' AND activo = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.resumen_actividad_org(UUID) TO authenticated;
