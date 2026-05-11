-- ═══════════════════════════════════════════════════════════════════════════════
-- Create or Update Admin Profile
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Objetivo:
--   Crear o actualizar el perfil de usuario como admin
--   Esto maneja tanto usuarios nuevos como existentes
--
-- Ejecutar esto en la consola SQL de Supabase
-- ═══════════════════════════════════════════════════════════════════════════════

-- Primero, obtener el user_id
WITH user_data AS (
  SELECT id as user_id, email, raw_user_meta_data->>'nombre_completo' as nombre_meta
  FROM auth.users
  WHERE email = 'r.bacigalupo.p@gmail.com'
)

-- Insertar o actualizar el perfil
INSERT INTO public.perfiles_usuario (
  user_id,
  nombre_completo,
  rol,
  activo,
  organizacion_id,
  created_at,
  ultimo_acceso
)
SELECT
  user_id,
  COALESCE(nombre_meta, 'r.bacigalupo.p@gmail.com') as nombre_completo,
  'admin' as rol,
  true as activo,
  NULL as organizacion_id,
  NOW() as created_at,
  NOW() as ultimo_acceso
FROM user_data

ON CONFLICT (user_id) DO UPDATE SET
  rol = 'admin',
  activo = true,
  ultimo_acceso = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- Verificar que se creó o actualizó correctamente
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  p.user_id,
  p.nombre_completo,
  p.rol,
  p.activo,
  p.organizacion_id,
  p.created_at,
  p.ultimo_acceso,
  u.email
FROM public.perfiles_usuario p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'r.bacigalupo.p@gmail.com';
