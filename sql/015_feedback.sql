-- 015_feedback.sql — Buzon de feedback usuarios → admin
-- Ejecutar UNA VEZ en Supabase SQL Editor
-- https://app.supabase.com/project/srukzfoerdgcaymnriax/sql/

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizacion_id uuid REFERENCES organizaciones(id) ON DELETE SET NULL,
  nombre_usuario text,
  tipo text NOT NULL DEFAULT 'general'
    CHECK (tipo IN ('bug', 'sugerencia', 'pregunta', 'general')),
  asunto text NOT NULL,
  mensaje text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'leido', 'respondido', 'cerrado')),
  respuesta_admin text,
  respondido_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_feedback_org ON feedback(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_estado ON feedback(estado);

-- 3. RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden insertar su propio feedback
CREATE POLICY "feedback_insert_own" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden leer su propio feedback (para ver respuestas)
CREATE POLICY "feedback_select_own" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Admin puede leer todo el feedback de su organizacion
CREATE POLICY "feedback_select_admin" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE perfiles_usuario.user_id = auth.uid()
        AND perfiles_usuario.organizacion_id = feedback.organizacion_id
        AND perfiles_usuario.rol = 'admin'
    )
  );

-- Admin puede actualizar feedback de su organizacion (responder, cambiar estado)
CREATE POLICY "feedback_update_admin" ON feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM perfiles_usuario
      WHERE perfiles_usuario.user_id = auth.uid()
        AND perfiles_usuario.organizacion_id = feedback.organizacion_id
        AND perfiles_usuario.rol = 'admin'
    )
  );
