// ─────────────────────────────────────────────────────────────────────────────
// precios_renovables.js — Precios referenciales 2026 para sistemas renovables.
//
// Fuente:
//   · Cotizaciones de instaladores Chile (Solar Plus, Heliplast, Heliosphera)
//   · Catastro CER (Centro de Energías Renovables) MINENERGÍA
//   · SOFOFA / ACERA precios típicos del mercado
//
// IMPORTANTE: son referenciales — varían por:
//   · Volumen del proyecto (>5kWp baja unitario ~15%)
//   · Marca de equipos (panel chino vs tier 1, inversor central vs micros)
//   · Complejidad de instalación (techo plano vs inclinado, distancia al CGD)
//   · Región (logística + mano de obra)
// ─────────────────────────────────────────────────────────────────────────────

// ─── SOLAR FOTOVOLTAICO ─────────────────────────────────────────────────────
// Precios por kWp instalado "llave en mano" (paneles + inversor + estructura
// + cableado + protecciones + instalación + permiso DAR SEC + conexión).
//
// Tiers según escala del proyecto:
//   tier_residencial_chico: 1.5–3 kWp (1 inversor monofásico)
//   tier_residencial_grande: 3–10 kWp
//   tier_comercial:  10–100 kWp (más eficiente por escala)
export const PRECIOS_FV = {
  tier_residencial_chico:  { clp_por_kwp: 1350000, kwp_min: 1.5, kwp_max: 3  },
  tier_residencial_grande: { clp_por_kwp: 1100000, kwp_min: 3,   kwp_max: 10 },
  tier_comercial:          { clp_por_kwp: 950000,  kwp_min: 10,  kwp_max: 100},
}

// Net-billing (Ley 21.118): la energía inyectada se valora al "costo evitado"
// que es la tarifa BT1 menos costos de distribución. Aproximado 50-70% de la
// tarifa de compra. CNE publica el valor exacto trimestralmente.
export const FACTOR_NETBILLING = 0.62   // Precio inyección / Precio compra

// Vida útil sistema FV: 25-30 años, garantía paneles 25 años con degradación
// típica 0.5%/año (panel tier 1).
export const VIDA_UTIL_FV_ANIOS = 25
export const DEGRADACION_ANUAL_FV = 0.005  // 0.5% año

// Performance Ratio (PR) — pérdidas DC + inversor + suciedad + temperatura.
// Para Chile residencial bien instalado: 0.78-0.82.
export const PR_FV = 0.78

// ─── SOLAR TÉRMICO (ACS) ────────────────────────────────────────────────────
// Sistemas típicos residenciales (kit colector + acumulador + estanque + apoyo).
//
// Costo total instalado (incluyendo IVA, mano de obra, ferretería):
export const PRECIOS_SOLAR_TERMICO = {
  // 2 colectores + acumulador 200L (para 3-4 personas)
  sistema_200l_2col: { clp_total: 1450000, colectores: 2, m2_total: 4.0, acum_l: 200, personas_max: 4 },
  // 3 colectores + acumulador 300L (para 5-6 personas)
  sistema_300l_3col: { clp_total: 1950000, colectores: 3, m2_total: 6.0, acum_l: 300, personas_max: 6 },
  // 4 colectores + acumulador 500L (familia numerosa o pequeño edificio)
  sistema_500l_4col: { clp_total: 2850000, colectores: 4, m2_total: 8.0, acum_l: 500, personas_max: 10 },
}

// Ley 20.365 (vigente, extensión Ley 21.706 hasta 2027):
// Franquicia tributaria al constructor por viviendas con SST.
// Las viviendas nuevas se clasifican por valor UF:
//   ≤ 2000 UF → 100% del crédito tributario
//   2001-3000 UF → reducción gradual
//   > 3000 UF → no aplica
//
// El crédito tributario máximo por vivienda es función del tamaño del sistema.
// Para una vivienda residencial típica (cubertura ACS 65-75%), el descuento
// efectivo al precio final está entre 35-55% del costo del sistema.
export const FRANQUICIA_LEY_20365 = {
  uf_corte_total:     2000,   // viviendas ≤ → 100% beneficio
  uf_corte_parcial:   3000,   // viviendas > → 0% beneficio
  // Tope CT (Crédito Tributario): porcentaje efectivo del costo del sistema
  // descontable al precio final de la vivienda (escala 2026).
  pct_descuento_total:   0.55,  // viviendas ≤ 2000 UF → 55% del costo
  pct_descuento_parcial: 0.25,  // entre 2000-3000 UF → ~25%
}

// Cobertura típica anual del sistema solar térmico sobre demanda ACS:
//   Norte (alta radiación): 70-85%
//   Centro: 60-75%
//   Sur: 45-60%
//   Austral: 30-45%
export const COBERTURA_ACS = {
  'A': 0.78, 'B': 0.80,  // Norte
  'C': 0.70, 'D': 0.68,  // Centro
  'E': 0.55, 'F': 0.48,  // Sur
  'G': 0.40, 'H': 0.35,  // Austral
}

export const VIDA_UTIL_ST_ANIOS = 20
export const EFICIENCIA_COLECTOR = 0.55  // colector plano selectivo bien instalado

// ─── BOMBAS DE CALOR ────────────────────────────────────────────────────────
// Costo instalado por kW térmico:
export const PRECIOS_BDC = {
  split_aire_aire: {
    nombre:           'Split aire-aire (calefacción reversible)',
    cop_nominal:      4.0,
    cop_min_zona_fria: 2.2,
    clp_por_kw_term:  450000,   // CLP por kW térmico instalado (residencial)
    descripcion:      'Multi-split. Ideal complemento, no sustituto total en zona F-H.',
    vida_util:        12,
    aplica_acs:       false,
  },
  aerotermia_agua: {
    nombre:           'Aerotermia aire-agua (agua caliente + calefacción)',
    cop_nominal:      4.2,
    cop_min_zona_fria: 2.5,
    clp_por_kw_term:  1200000,  // unidad exterior + interior + acumulador
    descripcion:      'Premium pero alimenta losa radiante o radiadores + ACS.',
    vida_util:        18,
    aplica_acs:       true,
  },
  geotermica: {
    nombre:           'Geotérmica (sonda vertical)',
    cop_nominal:      5.0,
    cop_min_zona_fria: 4.5,
    clp_por_kw_term:  2800000,  // sonda + bomba + obras de perforación
    descripcion:      'Inversión alta, COP estable año redondo. Requiere terreno.',
    vida_util:        25,
    aplica_acs:       true,
  },
  bdc_acs_dedicada: {
    nombre:           'BdC dedicada a ACS (termo bomba calor)',
    cop_nominal:      3.5,
    cop_min_zona_fria: 2.4,
    clp_por_kw_term:  650000,
    descripcion:      'Reemplaza calefón o termo eléctrico solo para ACS.',
    vida_util:        15,
    aplica_acs:       true,
  },
}

// Corrección COP por T exterior (curva simplificada).
// COP_real = COP_nominal × factor(Te)
// Te en °C; factor lineal entre puntos clave.
export function factorCopPorTexterior(tExt) {
  // Curva típica: a 7°C factor 1, a -5°C factor 0.55, a 15°C factor 1.1
  if (tExt >= 15) return 1.10
  if (tExt >= 7)  return 1.0 - (15 - tExt) / 80
  if (tExt >= 0)  return 0.78 - (7 - tExt) / 22 * 0.18
  if (tExt >= -5) return 0.60 - Math.abs(tExt) / 5 * 0.05
  return 0.55  // muy frío, factor estable
}
