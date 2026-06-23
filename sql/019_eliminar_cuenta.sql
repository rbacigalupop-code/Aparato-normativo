-- ─────────────────────────────────────────────────────────────────────────────
-- 019_eliminar_cuenta.sql — ARCO+ (Ley 21.719): auto-eliminación de cuenta
--
-- Permite al usuario eliminar su propia cuenta y datos (derecho de cancelación).
-- Función SECURITY DEFINER: borra proyectos + perfil + usuario de auth del
-- PROPIO llamante (auth.uid()), nunca de otro. feedback y sesiones_login tienen
-- FK ON DELETE CASCADE hacia auth.users, así que se limpian al borrar el usuario.
--
-- Correr en el SQL Editor de Supabase. La app llama: supabase.rpc('eliminar_mi_cuenta').
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.eliminar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  -- Datos propios (explícito, por si el FK no tuviera ON DELETE CASCADE)
  delete from public.proyectos        where user_id = uid;
  delete from public.perfiles_usuario where user_id = uid;

  -- Borrar el usuario de auth elimina en cascada feedback y sesiones_login
  delete from auth.users where id = uid;
end;
$$;

-- Solo usuarios autenticados pueden invocarla; cada uno borra únicamente su cuenta.
revoke all on function public.eliminar_mi_cuenta() from public;
grant execute on function public.eliminar_mi_cuenta() to authenticated;
