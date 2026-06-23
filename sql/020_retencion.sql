-- ─────────────────────────────────────────────────────────────────────────────
-- 020_retencion.sql — Retención / minimización (Ley 21.719)
--
-- Purga registros de inicio de sesión (auditoría) con más de 12 meses. Los datos
-- de cuenta y proyectos NO se purgan automáticamente: se conservan mientras la
-- cuenta esté activa y se eliminan a solicitud del titular (ARCO+, ver
-- sql/019_eliminar_cuenta.sql). feedback se conserva como historial de soporte y
-- cae por cascada al eliminar la cuenta.
--
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.purgar_datos_antiguos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.sesiones_login
   where login_at < now() - interval '12 months';
  get diagnostics n = row_count;
  return n;  -- filas eliminadas
end;
$$;

revoke all on function public.purgar_datos_antiguos() from public;

-- ── Programación automática (opcional, recomendado) ──────────────────────────
-- Requiere la extensión pg_cron (disponible en Supabase: Database → Extensions).
-- Descomenta para purgar el día 1 de cada mes a las 03:00:
--
--   create extension if not exists pg_cron;
--   select cron.schedule(
--     'purga-sesiones-mensual',
--     '0 3 1 * *',
--     $$ select public.purgar_datos_antiguos(); $$
--   );
--
-- Si prefieres no usar pg_cron, ejecuta manualmente cada cierto tiempo:
--   select public.purgar_datos_antiguos();
