-- ═══════════════════════════════════════════════════════════════════════════════
-- Complete Admin Setup with Organization (Simple Version)
-- ═══════════════════════════════════════════════════════════════════════════════

-- PASO 1: Crear organización personal para el usuario
INSERT INTO public.organizaciones (
  nombre,
  propietario_id,
  plan,
  activa
)
SELECT
  'Mi Workspace',
  id,
  'pro',
  true
FROM auth.users
WHERE email = 'r.bacigalupo.p@gmail.com'
  AND id NOT IN (SELECT DISTINCT propietario_id FROM public.organizaciones WHERE propietario_id IS NOT NULL);

-- PASO 2: Borrar perfil existente si lo hay
DELETE FROM public.perfiles_usuario
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'r.bacigalupo.p@gmail.com');

-- PASO 3: Crear perfil como admin
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
  u.id,
  COALESCE(u.raw_user_meta_data->>'nombre_completo', u.email),
  'admin',
  true,
  (SELECT id FROM public.organizaciones
   WHERE propietario_id = u.id
   ORDER BY created_at DESC LIMIT 1),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'r.bacigalupo.p@gmail.com';

-- PASO 4: Verificar resultado
SELECT
  p.user_id,
  p.nombre_completo,
  p.rol,
  p.activo,
  o.nombre as organizacion,
  u.email
FROM public.perfiles_usuario p
LEFT JOIN public.organizaciones o ON p.organizacion_id = o.id
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'r.bacigalupo.p@gmail.com';
