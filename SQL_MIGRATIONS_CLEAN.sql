-- NORMACHECK: Migracion a Supabase Auth + Multi-Usuario
-- Ejecuta este script completo en Supabase SQL Editor

-- TABLA 1: organizaciones (workspace/estudio del usuario)
CREATE TABLE IF NOT EXISTS organizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE GENERATED ALWAYS AS (
    LOWER(REPLACE(REPLACE(nombre, ' ', '-'), 'á', 'a'))
  ) STORED,
  descripcion TEXT,
  logo_url TEXT,
  propietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  activa BOOLEAN DEFAULT TRUE,
  max_usuarios INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_org_propietario ON organizaciones(propietario_id);
CREATE INDEX idx_org_slug ON organizaciones(slug);

-- TABLA 2: perfiles_usuario (datos adicionales del usuario)
CREATE TABLE IF NOT EXISTS perfiles_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizacion_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  rol TEXT DEFAULT 'viewer' CHECK (rol IN ('admin', 'viewer')),
  avatar_url TEXT,
  activo BOOLEAN DEFAULT TRUE,
  ultimo_acceso TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, organizacion_id)
);

CREATE INDEX idx_perfil_user ON perfiles_usuario(user_id);
CREATE INDEX idx_perfil_org ON perfiles_usuario(organizacion_id);
CREATE INDEX idx_perfil_rol ON perfiles_usuario(rol);

-- TABLA 3: Modificar proyectos (agregar columnas para nuevo schema)
ALTER TABLE proyectos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS organizacion_id UUID REFERENCES organizaciones(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_proyecto_user ON proyectos(user_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_org ON proyectos(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_template ON proyectos(is_template);

-- TABLA 4: tokens_legado (backward compatibility con sistema anterior)
CREATE TABLE IF NOT EXISTS tokens_legado (
  token TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organizacion_id UUID REFERENCES organizaciones(id) ON DELETE SET NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  proyectos_usados INTEGER DEFAULT 0,
  max_proyectos INTEGER DEFAULT 10,
  migrado_en TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_user ON tokens_legado(user_id);
CREATE INDEX IF NOT EXISTS idx_token_org ON tokens_legado(organizacion_id);

-- TABLA 5: registro_auditoria (audit trail de cambios)
CREATE TABLE IF NOT EXISTS registro_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organizacion_id UUID REFERENCES organizaciones(id) ON DELETE SET NULL,
  accion TEXT NOT NULL,
  tabla TEXT,
  registro_id TEXT,
  antes_json JSONB,
  despues_json JSONB,
  detalles TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON registro_auditoria(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON registro_auditoria(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_audit_accion ON registro_auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON registro_auditoria(created_at DESC);

-- ENABLE RLS (Row Level Security)
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_auditoria ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Usuarios ven su organizacion"
  ON organizaciones FOR SELECT
  USING (
    auth.uid() = propietario_id OR
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE perfiles_usuario.user_id = auth.uid()
      AND perfiles_usuario.organizacion_id = organizaciones.id
    )
  );

CREATE POLICY "Admin puede actualizar su org"
  ON organizaciones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE perfiles_usuario.user_id = auth.uid()
      AND perfiles_usuario.organizacion_id = organizaciones.id
      AND perfiles_usuario.rol = 'admin'
    )
  );

CREATE POLICY "Usuarios ven su propio perfil"
  ON perfiles_usuario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin ve perfiles de su org"
  ON perfiles_usuario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario pu
      WHERE pu.user_id = auth.uid()
      AND pu.organizacion_id = perfiles_usuario.organizacion_id
      AND pu.rol = 'admin'
    )
  );

CREATE POLICY "Usuarios ven sus propios proyectos"
  ON proyectos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear proyectos"
  ON proyectos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden editar sus propios proyectos"
  ON proyectos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios proyectos"
  ON proyectos FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins ven logs de su org"
  ON registro_auditoria FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE perfiles_usuario.user_id = auth.uid()
      AND perfiles_usuario.organizacion_id = registro_auditoria.organizacion_id
      AND perfiles_usuario.rol = 'admin'
    )
  );
