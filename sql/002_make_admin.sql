-- ═══════════════════════════════════════════════════════════════════════════════
-- Make user admin
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Objetivo:
--   Actualizar el rol de un usuario a 'admin'
--
-- Ejecutar esto UNA SOLA VEZ en la consola SQL de Supabase
-- ═══════════════════════════════════════════════════════════════════════════════

-- Actualizar rol de r.bacigalupo.p@gmail.com a admin
UPDATE public.perfiles_usuario
SET rol = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'r.bacigalupo.p@gmail.com'
);

-- Verificar que se actualizó correctamente
SELECT user_id, nombre_completo, rol, organizacion_id
FROM public.perfiles_usuario
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'r.bacigalupo.p@gmail.com'
);
