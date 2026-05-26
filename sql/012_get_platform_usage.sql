-- ─────────────────────────────────────────────────────────────────────────────
-- 012_get_platform_usage.sql
-- Función RPC para mostrar métricas de uso en el panel Admin de la app.
-- Ejecutar en Supabase → SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_platform_usage()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT json_build_object(
    -- Tamaño total de la base de datos (incluye tablas, índices, TOAST, etc.)
    'db_size_bytes',        pg_database_size(current_database()),
    'db_size_mb',           ROUND(pg_database_size(current_database()) / 1024.0 / 1024.0, 2),

    -- Tamaño de la tabla más pesada (proyectos guarda JSONB con snapshots e imágenes)
    'proyectos_size_bytes', pg_total_relation_size('public.proyectos'),
    'proyectos_size_mb',    ROUND(pg_total_relation_size('public.proyectos') / 1024.0 / 1024.0, 2),

    -- Conteos de filas
    'total_proyectos',      (SELECT COUNT(*) FROM proyectos WHERE NOT COALESCE(is_template, false)),
    'total_templates',      (SELECT COUNT(*) FROM proyectos WHERE COALESCE(is_template, false)),
    'total_usuarios',       (SELECT COUNT(*) FROM perfiles_usuario),
    'total_orgs',           (SELECT COUNT(*) FROM organizaciones),
    'tokens_legado',        (SELECT COUNT(*) FROM tokens_legado WHERE NOT COALESCE(migrado_en, false)),
    'registros_auditoria',  (SELECT COUNT(*) FROM registro_auditoria)
  )
$$;

-- Permitir ejecución a usuarios autenticados
-- (la app verifica el rol admin antes de llamarla)
GRANT EXECUTE ON FUNCTION get_platform_usage() TO authenticated;
