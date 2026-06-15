// ─────────────────────────────────────────────────────────────────────────────
// clima_anual.js — Datos climáticos anuales para balance energético.
//
// Por comuna chilena:
//   · cdd26: Cooling Degree Days base 26°C (refrigeración / sobrecalentamiento)
//   · t_verano: T media verano (DEF, °C)
//   · radiacion_anual_orient: radiación solar global anual por orientación
//     (kWh/m²·año) para superficie vertical. Útil para ganancias solares.
//
// Fuente:
//   · Explorador Solar MINENERGÍA (radiación global por orientación)
//   · Atlas Solar Chile (Universidad de Chile)
//   · Anuarios DMC (Dirección Meteorológica de Chile)
//   · NCh1079:2008 anexos (T verano referenciales)
//
// Las orientaciones siguen convención chilena:
//   · N: muro mirando al norte (más radiación en hemisferio sur en invierno)
//   · S: muro al sur (menos radiación, fachada fría)
//   · E: muro al este (sol mañana)
//   · O: muro al oeste (sol tarde — crítico para sobrecalentamiento)
// ─────────────────────────────────────────────────────────────────────────────

// CDD26 anual (°C·día) — pre-cargado para las 28 capitales del catálogo
// detallado. Para otras comunas se usa el fallback por zona DS N°15.
export const CDD26 = {
  // Norte — alto CDD (riesgo sobrecalentamiento)
  'arica':          580,
  'iquique':        650,
  'antofagasta':    380,  // costa = morigerado
  'calama':         420,
  'copiapo':        680,
  'la_serena':      280,
  'ovalle':         480,

  // Centro — CDD moderado
  'valparaiso':     180,
  'vina_del_mar':   180,
  'san_felipe':     520,
  'santiago':       450,
  'puente_alto':    420,
  'maipu':          480,
  'rancagua':       550,
  'curico':         620,
  'talca':          680,
  'linares':        700,

  // Sur — CDD bajo (poca demanda refrigeración)
  'chillan':        680,
  'concepcion':     320,
  'los_angeles':    580,
  'temuco':         420,
  'pucon':          320,
  'valdivia':       250,
  'osorno':         220,
  'puerto_montt':   180,
  'castro':         130,
  'ancud':          120,

  // Austral — CDD muy bajo (calefacción dominante)
  'coyhaique':      80,
  'puerto_aysen':   100,
  'punta_arenas':   30,
  'puerto_natales': 25,
  'porvenir':       30,
}

// Fallback por MACROZONA CLIMÁTICA (A-H) si no hay dato detallado.
// NO es la zona oficial DS N°15 (A-I): indexar con la zona climática
// (zonaClimaDeOGUC), no con proy.zona directo.
export const CDD26_POR_ZONA = {
  'A': 620, 'B': 480, 'C': 250, 'D': 500, 'E': 450, 'F': 200, 'G': 90, 'H': 30,
}

// T media verano (DEF) por comuna — °C
export const T_VERANO = {
  'arica':          22, 'iquique':        22, 'antofagasta':    19, 'calama':         18,
  'copiapo':        21, 'la_serena':      18, 'ovalle':         20,
  'valparaiso':     17, 'vina_del_mar':   18, 'san_felipe':     21,
  'santiago':       21, 'puente_alto':    21, 'maipu':          21,
  'rancagua':       21, 'curico':         21, 'talca':          21, 'linares':        22,
  'chillan':        20, 'concepcion':     17, 'los_angeles':    20,
  'temuco':         17, 'pucon':          16, 'valdivia':       15,
  'osorno':         15, 'puerto_montt':   13, 'castro':         13, 'ancud':          13,
  'coyhaique':      12, 'puerto_aysen':   12, 'punta_arenas':   10, 'puerto_natales': 9, 'porvenir':       9,
}

// ─── RADIACIÓN SOLAR ANUAL POR ORIENTACIÓN (kWh/m²·año) ──────────────────────
// Superficie vertical (muro). En Chile (hemisferio sur):
//   · Norte recibe MÁS sol en invierno (clave para ganancias térmicas)
//   · Oeste recibe sol fuerte de tarde (crítico para sobrecalentamiento)
//   · Sur recibe poco (sólo difusa)
//
// Valores aproximados por MACROZONA CLIMÁTICA A-H (fallback genérico).
// NO es la zona oficial DS N°15: usa zonaClimaDeOGUC() para indexar.
export const RADIACION_VERTICAL_POR_ZONA = {
  'A': { N: 1450, E: 1100, S: 480,  O: 1150 },  // Norte litoral - muy soleado
  'B': { N: 1600, E: 1200, S: 520,  O: 1250 },  // Norte desértico
  'C': { N: 1250, E: 950,  S: 420,  O: 1000 },  // Centro litoral
  'D': { N: 1300, E: 1000, S: 430,  O: 1050 },  // Centro interior
  'E': { N: 1050, E: 800,  S: 360,  O: 850  },  // Sur litoral
  'F': { N: 880,  E: 680,  S: 320,  O: 720  },  // Sur interior
  'G': { N: 720,  E: 560,  S: 280,  O: 600  },  // Sur extremo
  'H': { N: 580,  E: 460,  S: 240,  O: 480  },  // Austral
}

// Distribución estacional (verano vs invierno) por orientación.
// Como % del total anual que cae en verano (DEF).
//   · Norte: más sol en invierno (el sol está más al norte y bajo)
//   · Sur: más sol en verano (sol más vertical, llega al sur)
//   · E/O: parejo
export const FRACCION_VERANO = { N: 0.30, E: 0.40, S: 0.55, O: 0.40 }

// ─── Helpers ────────────────────────────────────────────────────────────────
import { obtenerZonaClimaComuna } from './comunas_chile.js'

// En estas funciones `zonaClima` es la MACROZONA CLIMÁTICA (A-H), normalmente
// derivada de la zona oficial elegida vía zonaClimaDeOGUC(). Tiene prioridad
// sobre el clima fijo de la comuna para que las comunas multi-zona sigan la
// selección del usuario.
export function obtenerCDD26(comunaKey, zonaClima = null) {
  const key = comunaKey?.toLowerCase()?.replace(/\s/g, '_')
  if (CDD26[key] != null) return CDD26[key]
  if (zonaClima && CDD26_POR_ZONA[zonaClima] != null) return CDD26_POR_ZONA[zonaClima]
  const zonaComuna = obtenerZonaClimaComuna(key)
  if (zonaComuna && CDD26_POR_ZONA[zonaComuna] != null) return CDD26_POR_ZONA[zonaComuna]
  return 400
}

export function obtenerTverano(comunaKey, zonaClima = null) {
  const key = comunaKey?.toLowerCase()?.replace(/\s/g, '_')
  if (T_VERANO[key] != null) return T_VERANO[key]
  const tablas = { A: 21, B: 22, C: 18, D: 21, E: 17, F: 14, G: 12, H: 10 }
  if (zonaClima && tablas[zonaClima] != null) return tablas[zonaClima]
  const zonaComuna = obtenerZonaClimaComuna(key)
  if (zonaComuna && tablas[zonaComuna] != null) return tablas[zonaComuna]
  return 18
}

export function obtenerRadiacionVertical(zonaClima) {
  return RADIACION_VERTICAL_POR_ZONA[zonaClima] || RADIACION_VERTICAL_POR_ZONA.D
}

// Benchmarks chilenos de demanda energética anual (kWh/m²·año)
// Fuente: estudios CITEC UBB, CDT CChC, encuestas CASEN energía.
export const BENCHMARKS_DEMANDA = [
  { letra: 'A+', max: 25,   nombre: 'Casa Pasiva',           color: '#15803d' },
  { letra: 'A',  max: 40,   nombre: 'Muy eficiente',          color: '#16a34a' },
  { letra: 'B',  max: 65,   nombre: 'Eficiente',              color: '#84cc16' },
  { letra: 'C',  max: 95,   nombre: 'Sobre promedio',         color: '#eab308' },
  { letra: 'D',  max: 130,  nombre: 'Promedio Chile',         color: '#f59e0b' },
  { letra: 'E',  max: 180,  nombre: 'Bajo promedio',          color: '#f97316' },
  { letra: 'F',  max: 250,  nombre: 'Ineficiente',            color: '#dc2626' },
  { letra: 'G',  max: 9999, nombre: 'Muy ineficiente',        color: '#991b1b' },
]

export function calificacionPorDemanda(kwhM2Anio) {
  if (kwhM2Anio == null || isNaN(kwhM2Anio)) return null
  for (const b of BENCHMARKS_DEMANDA) {
    if (kwhM2Anio <= b.max) return b
  }
  return BENCHMARKS_DEMANDA[BENCHMARKS_DEMANDA.length - 1]
}
