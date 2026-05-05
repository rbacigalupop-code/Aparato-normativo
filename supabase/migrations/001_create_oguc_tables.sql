-- Migration: Create OGUC data tables
-- Description: Tables for storing Chilean building normative (OGUC) data
-- Created: 2026-05-05

-- ─── Table: oguc_rf_letras ─────────────────────────────────────────
-- Stores mapping of OGUC letter classifications to fire resistance requirements
-- Structure: { a: {1: 'F180', 2: 'F120', ...}, b: {...}, c: {...}, d: {...} }
CREATE TABLE IF NOT EXISTS oguc_rf_letras (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT oguc_rf_letras_id_check CHECK (id = 'main')
);

-- ─── Table: oguc_tabla1 ────────────────────────────────────────────
-- Stores OGUC Table 1: Building use → m² range → Letter classification
-- Structure: { "Habitacional": [{m2Min, m2Max, letras: [...]}, ...], ... }
CREATE TABLE IF NOT EXISTS oguc_tabla1 (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT oguc_tabla1_id_check CHECK (id = 'main')
);

-- ─── Table: oguc_elem_col ──────────────────────────────────────────
-- Stores mapping of building elements to OGUC table columns
-- Structure: { estructura: 2, muros_sep: 3, cajas_esc: 4, ... }
CREATE TABLE IF NOT EXISTS oguc_elem_col (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT oguc_elem_col_id_check CHECK (id = 'main')
);

-- ─── Insert initial data ────────────────────────────────────────────

-- Insert OGUC_RF_LETRAS
INSERT INTO oguc_rf_letras (id, data) VALUES (
  'main',
  '{
    "a": {"1":"F180", "2":"F120", "3":"F120", "4":"F120", "5":"F120", "6":"F30", "7":"F60", "8":"F120", "9":"F60"},
    "b": {"1":"F150", "2":"F120", "3":"F90", "4":"F90", "5":"F90", "6":"F15", "7":"F30", "8":"F90", "9":"F60"},
    "c": {"1":"F120", "2":"F90", "3":"F60", "4":"F60", "5":"F60", "6":null, "7":"F15", "8":"F60", "9":"F30"},
    "d": {"1":"F120", "2":"F60", "3":"F60", "4":"F60", "5":"F30", "6":null, "7":null, "8":"F30", "9":"F15"}
  }'
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Insert OGUC_TABLA1
INSERT INTO oguc_tabla1 (id, data) VALUES (
  'main',
  '{
    "Habitacional": [
      {"m2Min": 0, "m2Max": 999999, "letras": ["d","d","c","c","b","a","a"]}
    ],
    "Hoteles o similares": [
      {"m2Min": 5001, "m2Max": 999999, "letras": ["c","b","a","a","a","a","a"]},
      {"m2Min": 1501, "m2Max": 5000, "letras": ["c","b","b","a","a","a","a"]},
      {"m2Min": 501, "m2Max": 1500, "letras": ["c","c","b","b","a","a","a"]},
      {"m2Min": 0, "m2Max": 500, "letras": ["d","c","b","b","a","a","a"]}
    ],
    "Oficinas": [
      {"m2Min": 1501, "m2Max": 999999, "letras": ["c","c","b","b","a","a","a"]},
      {"m2Min": 501, "m2Max": 1500, "letras": ["c","c","c","b","b","a","a"]},
      {"m2Min": 0, "m2Max": 500, "letras": ["d","c","c","b","b","a","a"]}
    ],
    "Museos": [
      {"m2Min": 1501, "m2Max": 999999, "letras": ["c","c","b","b","b","a","a"]},
      {"m2Min": 501, "m2Max": 1500, "letras": ["c","c","c","b","b","a","a"]},
      {"m2Min": 0, "m2Max": 500, "letras": ["d","c","c","b","b","a","a"]}
    ],
    "Salud (clínica, hospital, laboratorio)": [
      {"m2Min": 1001, "m2Max": 999999, "letras": ["c","b","b","a","a","a","a"]},
      {"m2Min": 0, "m2Max": 1000, "letras": ["c","c","b","b","a","a","a"]}
    ],
    "Salud (policlínico)": [
      {"m2Min": 401, "m2Max": 999999, "letras": ["c","c","b","b","b","a","a"]},
      {"m2Min": 0, "m2Max": 400, "letras": ["d","c","c","b","b","a","a"]}
    ],
    "Restaurantes y fuentes de soda": [
      {"m2Min": 501, "m2Max": 999999, "letras": ["b","a","a","a","a","a","a"]},
      {"m2Min": 251, "m2Max": 500, "letras": ["c","b","b","a","a","a","a"]},
      {"m2Min": 0, "m2Max": 250, "letras": ["d","c","c","b","b","a","a"]}
    ],
    "Locales comerciales": [
      {"m2Min": 501, "m2Max": 999999, "letras": ["c","b","b","a","a","a","a"]},
      {"m2Min": 201, "m2Max": 500, "letras": ["c","c","b","a","a","a","a"]},
      {"m2Min": 0, "m2Max": 200, "letras": ["d","c","b","b","b","a","a"]}
    ],
    "Educación (pre/primaria)": [
      {"m2Min": 1001, "m2Max": 999999, "letras": ["b","a","a","a","a","a","a"]},
      {"m2Min": 0, "m2Max": 1000, "letras": ["c","b","b","a","a","a","a"]}
    ],
    "Educación (secundaria/superior)": [
      {"m2Min": 5001, "m2Max": 999999, "letras": ["b","a","a","a","a","a","a"]},
      {"m2Min": 1001, "m2Max": 5000, "letras": ["c","b","b","a","a","a","a"]},
      {"m2Min": 0, "m2Max": 1000, "letras": ["c","c","b","b","a","a","a"]}
    ]
  }'
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Insert OGUC_ELEM_COL
INSERT INTO oguc_elem_col (id, data) VALUES (
  'main',
  '{
    "estructura": 2,
    "muros_sep": 3,
    "cajas_esc": 4,
    "muros_mismo": 5,
    "paredes_div": 6,
    "cubierta": 7,
    "entrepisos": 8,
    "escaleras": 9
  }'
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- ─── Create indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_oguc_rf_letras_created ON oguc_rf_letras(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oguc_tabla1_created ON oguc_tabla1(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oguc_elem_col_created ON oguc_elem_col(created_at DESC);

-- ─── Enable RLS (optional) ─────────────────────────────────────────
ALTER TABLE oguc_rf_letras ENABLE ROW LEVEL SECURITY;
ALTER TABLE oguc_tabla1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE oguc_elem_col ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read OGUC data (public)
CREATE POLICY "allow_read_oguc_rf_letras" ON oguc_rf_letras FOR SELECT USING (true);
CREATE POLICY "allow_read_oguc_tabla1" ON oguc_tabla1 FOR SELECT USING (true);
CREATE POLICY "allow_read_oguc_elem_col" ON oguc_elem_col FOR SELECT USING (true);
