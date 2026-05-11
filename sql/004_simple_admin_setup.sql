-- ═══════════════════════════════════════════════════════════════════════════════
-- Simple Admin Setup (Sin ON CONFLICT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- PASO 1: Borrar perfil existente si lo hay
DELETE FROM public.perfiles_usuario
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'r.bacigalupo.p@gmail.com'
);

-- PASO 2: Crear nuevo perfil con rol admin
INSERT INTO public.perfiles_usuario (
  user_id,
  nombre_completo,
  rol,
  activo,
  created_at,
  ultimo_acceso
)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'nombre_completo', email),
  'admin',
  true,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'r.bacigalupo.p@gmail.com';

-- PASO 3: Verificar que se creó correctamente
SELECT
  p.user_id,
  p.nombre_completo,
  p.rol,
  p.activo,
  u.email,
  p.created_at
FROM public.perfiles_usuario p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'r.bacigalupo.p@gmail.com';
