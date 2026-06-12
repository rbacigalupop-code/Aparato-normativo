-- ═══════════════════════════════════════════════════════════════════════════════
-- 017_tokens_lockdown.sql — Cerrar fugas residuales (pizarra limpia de políticas)
-- Ejecutar en Supabase SQL Editor.
--
-- Motivo: ENABLE RLS (016) NO borra políticas preexistentes creadas en el panel.
-- RLS combina políticas con OR, así que una vieja "lectura para todos/autenticados"
-- sigue exponiendo datos. Verificado: tokens?select=token devolvía el string sin
-- login pese a la 016.
--
-- Este script:
--   · tokens / tokens_legado: elimina TODA política → RLS sin políticas = solo
--     service_role (sistema legado, 0 uso en la UI).
--   · perfiles_usuario: elimina TODA política preexistente y recrea SOLO las 4
--     canónicas (propio+admin lectura; insert/update/delete solo admin de la org).
--     Evita que una política vieja sobre-exponga perfiles a usuarios con sesión.
-- Idempotente. Requiere la función es_admin_de_org() creada en 016.
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  pol RECORD;
BEGIN
  -- ── tokens: lockdown total ──────────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='tokens') THEN
    EXECUTE 'ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY';
    FOR pol IN SELECT policyname FROM pg_policies
               WHERE schemaname='public' AND tablename='tokens' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tokens', pol.policyname);
    END LOOP;
  END IF;

  -- ── tokens_legado: lockdown total ───────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='tokens_legado') THEN
    EXECUTE 'ALTER TABLE public.tokens_legado ENABLE ROW LEVEL SECURITY';
    FOR pol IN SELECT policyname FROM pg_policies
               WHERE schemaname='public' AND tablename='tokens_legado' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tokens_legado', pol.policyname);
    END LOOP;
  END IF;

  -- ── perfiles_usuario: borrar TODA política preexistente (pizarra limpia) ─────
  EXECUTE 'ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY';
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE schemaname='public' AND tablename='perfiles_usuario' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.perfiles_usuario', pol.policyname);
  END LOOP;
END $$;

-- ── Recrear SOLO las 4 políticas canónicas de perfiles_usuario ────────────────
CREATE POLICY "perfiles_select_propio_o_admin" ON public.perfiles_usuario
  FOR SELECT USING ( user_id = auth.uid() OR public.es_admin_de_org(organizacion_id) );

CREATE POLICY "perfiles_insert_admin" ON public.perfiles_usuario
  FOR INSERT WITH CHECK ( public.es_admin_de_org(organizacion_id) );

CREATE POLICY "perfiles_update_admin" ON public.perfiles_usuario
  FOR UPDATE USING ( public.es_admin_de_org(organizacion_id) )
              WITH CHECK ( public.es_admin_de_org(organizacion_id) );

CREATE POLICY "perfiles_delete_admin" ON public.perfiles_usuario
  FOR DELETE USING ( public.es_admin_de_org(organizacion_id) );

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN:
--   SELECT tablename, policyname FROM pg_policies
--   WHERE tablename IN ('tokens','tokens_legado','perfiles_usuario')
--   ORDER BY tablename;
-- Esperado: tokens/tokens_legado → 0 filas · perfiles_usuario → exactamente 4.
-- ═══════════════════════════════════════════════════════════════════════════════
