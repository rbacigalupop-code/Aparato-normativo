-- ═══════════════════════════════════════════════════════════════════════════════
-- 018_rate_limit_feedback.sql — Rate limit server-side del buzón de feedback
-- Ejecutar en Supabase SQL Editor.
--
-- Un usuario autenticado podría insertar miles de filas en `feedback` (spam /
-- abuso de almacenamiento). El límite se aplica con un trigger BEFORE INSERT en
-- la base, así NO se puede saltar pegándole directo al REST (a diferencia de un
-- límite en el cliente). SECURITY DEFINER para contar todas las filas del
-- usuario sin que la RLS interfiera.
--
-- Límites: 5 mensajes / hora · 20 mensajes / 24h por usuario. Suficiente para
-- feedback genuino, corta el flooding. Ajustables abajo.
-- Idempotente.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rl_feedback_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hora integer;
  v_dia  integer;
  c_max_hora constant integer := 5;
  c_max_dia  constant integer := 20;
BEGIN
  SELECT count(*) INTO v_hora
  FROM public.feedback
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 hour';

  IF v_hora >= c_max_hora THEN
    RAISE EXCEPTION 'rate_limit_hora: maximo % mensajes por hora', c_max_hora
      USING errcode = 'P0001';
  END IF;

  SELECT count(*) INTO v_dia
  FROM public.feedback
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '24 hours';

  IF v_dia >= c_max_dia THEN
    RAISE EXCEPTION 'rate_limit_dia: maximo % mensajes por dia', c_max_dia
      USING errcode = 'P0001';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_rl_feedback_insert ON public.feedback;
CREATE TRIGGER trg_rl_feedback_insert
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.rl_feedback_insert();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN: el 6° insert del mismo usuario en una hora debe fallar con
-- "rate_limit_hora". El cliente (enviarFeedback) traduce ese error a un mensaje
-- amistoso en español.
-- ═══════════════════════════════════════════════════════════════════════════════
