/**
 * OGUC Data Functions — Cargar datos normativos desde Supabase
 * En desarrollo/offline: fallback a datos locales
 */

// Datos locales fallback (mismos que en data.js)
const OGUC_RF_LETRAS_LOCAL = {
  a: { 1:'F180', 2:'F120', 3:'F120', 4:'F120', 5:'F120', 6:'F30',  7:'F60',  8:'F120', 9:'F60'  },
  b: { 1:'F150', 2:'F120', 3:'F90',  4:'F90',  5:'F90',  6:'F15',  7:'F30',  8:'F90',  9:'F60'  },
  c: { 1:'F120', 2:'F90',  3:'F60',  4:'F60',  5:'F60',  6:null,   7:'F15',  8:'F60',  9:'F30'  },
  d: { 1:'F120', 2:'F60',  3:'F60',  4:'F60',  5:'F30',  6:null,   7:null,   8:'F30',  9:'F15'  },
}

const OGUC_ELEM_COL_LOCAL = {
  estructura:   2,
  muros_sep:    3,
  cajas_esc:    4,
  muros_mismo:  5,
  paredes_div:  6,
  cubierta:     7,
  entrepisos:   8,
  escaleras:    9,
}

const OGUC_TABLA1_LOCAL = {
  Habitacional: [
    { m2Min: 0, m2Max: Infinity, letras: ['d','d','c','c','b','a','a'] },
  ],
  'Hoteles o similares': [
    { m2Min: 5001, m2Max: Infinity, letras: ['c','b','a','a','a','a','a'] },
    { m2Min: 1501, m2Max: 5000,     letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 501,  m2Max: 1500,     letras: ['c','c','b','b','a','a','a'] },
    { m2Min: 0,    m2Max: 500,      letras: ['d','c','b','b','a','a','a'] },
  ],
  Oficinas: [
    { m2Min: 1501, m2Max: Infinity, letras: ['c','c','b','b','a','a','a'] },
    { m2Min: 501,  m2Max: 1500,     letras: ['c','c','c','b','b','a','a'] },
    { m2Min: 0,    m2Max: 500,      letras: ['d','c','c','b','b','a','a'] },
  ],
  Museos: [
    { m2Min: 1501, m2Max: Infinity, letras: ['c','c','b','b','b','a','a'] },
    { m2Min: 501,  m2Max: 1500,     letras: ['c','c','c','b','b','a','a'] },
    { m2Min: 0,    m2Max: 500,      letras: ['d','c','c','b','b','a','a'] },
  ],
  'Salud (clínica, hospital, laboratorio)': [
    { m2Min: 1001, m2Max: Infinity, letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 1000,     letras: ['c','c','b','b','a','a','a'] },
  ],
  'Salud (policlínico)': [
    { m2Min: 401,  m2Max: Infinity, letras: ['c','c','b','b','b','a','a'] },
    { m2Min: 0,    m2Max: 400,      letras: ['d','c','c','b','b','a','a'] },
  ],
  'Restaurantes y fuentes de soda': [
    { m2Min: 501,  m2Max: Infinity, letras: ['b','a','a','a','a','a','a'] },
    { m2Min: 251,  m2Max: 500,      letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 250,      letras: ['d','c','c','b','b','a','a'] },
  ],
  'Locales comerciales': [
    { m2Min: 501,  m2Max: Infinity, letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 201,  m2Max: 500,      letras: ['c','c','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 200,      letras: ['d','c','b','b','b','a','a'] },
  ],
  'Educación (pre/primaria)': [
    { m2Min: 1001, m2Max: Infinity, letras: ['b','a','a','a','a','a','a'] },
    { m2Min: 0,    m2Max: 1000,     letras: ['c','b','b','a','a','a','a'] },
  ],
  'Educación (secundaria/superior)': [
    { m2Min: 5001, m2Max: Infinity, letras: ['b','a','a','a','a','a','a'] },
    { m2Min: 1001, m2Max: 5000,     letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 1000,     letras: ['c','c','b','b','a','a','a'] },
  ],
}

/**
 * Obtiene OGUC_RF_LETRAS (mapping de letra → RF por columna)
 * Intenta desde Supabase, fallback a local
 */
export async function obtenerOGUCRFLetras() {
  try {
    const { supabase } = await import('./supabaseClient.js')
    if (!supabase) return OGUC_RF_LETRAS_LOCAL

    const { data, error } = await supabase
      .from('oguc_rf_letras')
      .select('*')
      .single()

    if (error) {
      console.warn('Error cargando OGUC_RF_LETRAS desde DB:', error.message)
      return OGUC_RF_LETRAS_LOCAL
    }

    return data?.data || OGUC_RF_LETRAS_LOCAL
  } catch (err) {
    console.warn('Usando OGUC_RF_LETRAS local:', err.message)
    return OGUC_RF_LETRAS_LOCAL
  }
}

/**
 * Obtiene OGUC_TABLA1 (mapping de destino + m² + pisos → letra)
 * Intenta desde Supabase, fallback a local
 */
export async function obtenerOGUCTabla1() {
  try {
    const { supabase } = await import('./supabaseClient.js')
    if (!supabase) return OGUC_TABLA1_LOCAL

    const { data, error } = await supabase
      .from('oguc_tabla1')
      .select('*')
      .single()

    if (error) {
      console.warn('Error cargando OGUC_TABLA1 desde DB:', error.message)
      return OGUC_TABLA1_LOCAL
    }

    return data?.data || OGUC_TABLA1_LOCAL
  } catch (err) {
    console.warn('Usando OGUC_TABLA1 local:', err.message)
    return OGUC_TABLA1_LOCAL
  }
}

/**
 * Obtiene OGUC_ELEM_COL (mapping de elemento → columna OGUC)
 * Intenta desde Supabase, fallback a local
 */
export async function obtenerOGUCElemCol() {
  try {
    const { supabase } = await import('./supabaseClient.js')
    if (!supabase) return OGUC_ELEM_COL_LOCAL

    const { data, error } = await supabase
      .from('oguc_elem_col')
      .select('*')
      .single()

    if (error) {
      console.warn('Error cargando OGUC_ELEM_COL desde DB:', error.message)
      return OGUC_ELEM_COL_LOCAL
    }

    return data?.data || OGUC_ELEM_COL_LOCAL
  } catch (err) {
    console.warn('Usando OGUC_ELEM_COL local:', err.message)
    return OGUC_ELEM_COL_LOCAL
  }
}

/**
 * Carga todos los datos OGUC en paralelo
 * Retorna { OGUC_RF_LETRAS, OGUC_TABLA1, OGUC_ELEM_COL }
 */
export async function cargarDatosOGUC() {
  const [rfLetras, tabla1, elemCol] = await Promise.all([
    obtenerOGUCRFLetras(),
    obtenerOGUCTabla1(),
    obtenerOGUCElemCol(),
  ])

  return {
    OGUC_RF_LETRAS: rfLetras,
    OGUC_TABLA1: tabla1,
    OGUC_ELEM_COL: elemCol,
  }
}

/**
 * Exporta datos locales para bootstrap/offline
 */
export {
  OGUC_RF_LETRAS_LOCAL,
  OGUC_TABLA1_LOCAL,
  OGUC_ELEM_COL_LOCAL,
}
