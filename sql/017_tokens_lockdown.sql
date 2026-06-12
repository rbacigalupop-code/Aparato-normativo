-- ═══════════════════════════════════════════════════════════════════════════════
-- 017_tokens_lockdown.sql — Cerrar fuga residual en `tokens`
-- Ejecutar en Supabase SQL Editor.
--
-- La 016 activó RLS en `tokens` pero la tabla tenía una política PERMISIVA
-- preexistente (creada en el panel, tipo "lectura para todos"). RLS combina
-- políticas con OR, así que el string de token seguía siendo legible sin login
-- (verificado por REST: tokens?select=token devolvía OGUC-TEST-0001-DEMO).
--
-- Este script elimina TODA política existente en tokens / tokens_legado y deja
-- RLS habilitada SIN políticas = acceso solo vía service_role (sistema legado,
-- 0 uso en la UI actual). Idempotente.
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  pol RECORD;
BEGIN
  -- tokens
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='tokens') THEN
    EXECUTE 'ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY';
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename='tokens'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tokens', pol.policyname);
    END LOOP;
  END IF;

  -- tokens_legado
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='tokens_legado') THEN
    EXECUTE 'ALTER TABLE public.tokens_legado ENABLE ROW LEVEL SECURITY';
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename='tokens_legado'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tokens_legado', pol.policyname);
    END LOOP;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN: no debe quedar ninguna política en estas tablas.
--   SELECT tablename, policyname FROM pg_policies
--   WHERE tablename IN ('tokens','tokens_legado');   -- 0 filas esperadas
-- ═══════════════════════════════════════════════════════════════════════════════
