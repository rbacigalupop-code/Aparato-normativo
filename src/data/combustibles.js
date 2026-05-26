// ─────────────────────────────────────────────────────────────────────────────
// combustibles.js — Catálogo de combustibles y sistemas energéticos chilenos.
//
// Para cada combustible: PCI (poder calorífico inferior), rendimientos típicos
// por sistema, y precio referencial 2026 por macrozona (norte/centro/sur).
//
// IMPORTANTE: estos son valores REFERENCIALES. El usuario debe poder
// ajustarlos en la pestaña Energético de cada proyecto.
// ─────────────────────────────────────────────────────────────────────────────

// Macrozonas para precios diferenciados (combustibles y leña varían mucho)
export const MACROZONAS = {
  norte:  { label: 'Norte (I–IV región)',          zonasOGUC: ['A', 'B'] },
  centro: { label: 'Centro (V–VII + RM)',          zonasOGUC: ['C', 'D'] },
  sur:    { label: 'Sur (VIII–XIV + XVI)',         zonasOGUC: ['E', 'F'] },
  austral:{ label: 'Austral (X–XI–XII)',           zonasOGUC: ['G', 'H'] },
}

// ─── DISTRIBUIDORAS ELÉCTRICAS chilenas (8 principales) ─────────────────────
// Tarifa BT1-A residencial promedio 2026 — CLP/kWh
export const DISTRIBUIDORAS_ELEC = [
  { id: 'enel',       nombre: 'Enel Distribución',          zonas: ['RM', 'V'],                       tarifa_clp_kwh: 175 },
  { id: 'cge',        nombre: 'CGE',                        zonas: ['IV', 'V', 'VI', 'VII', 'XIV'],   tarifa_clp_kwh: 188 },
  { id: 'chilquinta', nombre: 'Chilquinta',                 zonas: ['V'],                             tarifa_clp_kwh: 195 },
  { id: 'copelec',    nombre: 'COPELEC (Coop. Ñuble)',      zonas: ['XVI', 'VIII'],                   tarifa_clp_kwh: 198 },
  { id: 'frontel',    nombre: 'Frontel (Saesa Group)',      zonas: ['VIII', 'IX', 'XIV'],             tarifa_clp_kwh: 222 },
  { id: 'saesa',      nombre: 'Saesa',                      zonas: ['X', 'XIV'],                      tarifa_clp_kwh: 215 },
  { id: 'luzosorno',  nombre: 'Luz Osorno (Saesa Group)',   zonas: ['X'],                             tarifa_clp_kwh: 210 },
  { id: 'edelaysen',  nombre: 'Edelaysén',                  zonas: ['XI'],                            tarifa_clp_kwh: 245 },
  { id: 'edelmag',    nombre: 'Edelmag',                    zonas: ['XII'],                           tarifa_clp_kwh: 235 },
  { id: 'otro',       nombre: 'Otro / Coop. local',         zonas: [],                                tarifa_clp_kwh: 180 },
]

export const TARIFA_ELEC_DEFAULT = 180 // CLP/kWh — promedio nacional BT1-A

// ─── COMBUSTIBLES PARA CALEFACCIÓN ──────────────────────────────────────────
// PCI: poder calorífico inferior (kWh / unidad)
// rendTipico: rendimiento típico del sistema asociado (decimal, 1 = 100%)
// precio: CLP por unidad nativa (cilindro, m³, kg…) por macrozona
//   → clp_kwh_util = (precio / PCI / rendTipico)

export const COMBUSTIBLES_CALEFACCION = [
  {
    id: 'lena_no_cert',
    nombre: 'Leña no certificada',
    unidad: 'm³ estéreo',
    pci_kwh_unidad: 3200,    // PCI 3.200 kWh/m³ estéreo (humedad 30%)
    rendTipico: 0.65,        // estufa común
    precios: { norte: 90000, centro: 75000, sur: 55000, austral: 50000 },
    co2_kg_kwh: 0.41,        // emisiones (kg CO₂eq por kWh útil — biomasa neta)
    notas: 'Mayoritaria en uso real. PCI dependiente de humedad y especie.',
  },
  {
    id: 'lena_certificada',
    nombre: 'Leña certificada SNCL',
    unidad: 'm³ estéreo',
    pci_kwh_unidad: 3500,    // PCI mayor por menor humedad (<25%)
    rendTipico: 0.72,
    precios: { norte: 110000, centro: 90000, sur: 70000, austral: 65000 },
    co2_kg_kwh: 0.37,
    notas: 'Humedad ≤25%, mayor eficiencia. Requerida por norma en zonas saturadas.',
  },
  {
    id: 'pellets',
    nombre: 'Pellets de madera',
    unidad: 'kg',
    pci_kwh_unidad: 4.7,
    rendTipico: 0.88,        // estufa pellet doble combustión
    precios: { norte: 380, centro: 360, sur: 340, austral: 360 },
    co2_kg_kwh: 0.05,
    notas: 'Sistema con alta eficiencia y baja emisión particulada.',
  },
  {
    id: 'briquetas',
    nombre: 'Briquetas de aserrín',
    unidad: 'kg',
    pci_kwh_unidad: 4.5,
    rendTipico: 0.70,
    precios: { norte: 420, centro: 400, sur: 380, austral: 400 },
    co2_kg_kwh: 0.08,
    notas: 'Uso menor pero existente, similar a leña pero seca.',
  },
  {
    id: 'carbon_mineral',
    nombre: 'Carbón mineral',
    unidad: 'kg',
    pci_kwh_unidad: 7.5,
    rendTipico: 0.60,
    precios: { norte: 600, centro: 580, sur: 480, austral: 520 },
    co2_kg_kwh: 0.34,
    notas: 'Uso histórico en zonas mineras (Lota, Coronel).',
  },
  {
    id: 'kerosene',
    nombre: 'Kerosene (parafina)',
    unidad: 'L',
    pci_kwh_unidad: 9.5,
    rendTipico: 0.72,        // estufa japonesa típica
    precios: { norte: 1100, centro: 1050, sur: 1050, austral: 1150 },
    co2_kg_kwh: 0.26,
    notas: 'Estufas "japonesas" — uso muy común en centro y sur.',
  },
  {
    id: 'gas_natural',
    nombre: 'Gas natural (cañería)',
    unidad: 'm³',
    pci_kwh_unidad: 10.8,
    rendTipico: 0.88,        // caldera moderna
    precios: { norte: 0, centro: 1400, sur: 1450, austral: 0 },
    co2_kg_kwh: 0.20,
    disponibilidad: ['centro', 'sur'],
    notas: 'RM, V Región, Concepción. No disponible en norte ni austral.',
  },
  {
    id: 'glp_granel',
    nombre: 'GLP granel (estanque)',
    unidad: 'kg',
    pci_kwh_unidad: 12.9,
    rendTipico: 0.86,
    precios: { norte: 1180, centro: 1100, sur: 1150, austral: 1280 },
    co2_kg_kwh: 0.24,
    notas: 'Estanque domiciliario, reparto periódico.',
  },
  {
    id: 'glp_cilindro_11',
    nombre: 'GLP cilindro 11 kg',
    unidad: 'cilindro 11kg',
    pci_kwh_unidad: 142,     // 11 × 12.9
    rendTipico: 0.80,
    precios: { norte: 22000, centro: 19500, sur: 20500, austral: 23500 },
    co2_kg_kwh: 0.24,
    notas: 'Masivo, especialmente zonas sin red de gas.',
  },
  {
    id: 'glp_cilindro_15',
    nombre: 'GLP cilindro 15 kg',
    unidad: 'cilindro 15kg',
    pci_kwh_unidad: 194,     // 15 × 12.9
    rendTipico: 0.80,
    precios: { norte: 29000, centro: 26000, sur: 27500, austral: 30500 },
    co2_kg_kwh: 0.24,
    notas: 'Tamaño común en uso permanente.',
  },
  {
    id: 'glp_cilindro_45',
    nombre: 'GLP cilindro 45 kg',
    unidad: 'cilindro 45kg',
    pci_kwh_unidad: 581,     // 45 × 12.9
    rendTipico: 0.82,
    precios: { norte: 78000, centro: 70000, sur: 73000, austral: 82000 },
    co2_kg_kwh: 0.24,
    notas: 'Industria pequeña, panaderías, edificios.',
  },
  {
    id: 'diesel',
    nombre: 'Diesel (caldera)',
    unidad: 'L',
    pci_kwh_unidad: 10.0,
    rendTipico: 0.82,        // caldera condensación
    precios: { norte: 1180, centro: 1150, sur: 1170, austral: 1280 },
    co2_kg_kwh: 0.27,
    notas: 'Calderas rurales/industriales, raro en residencial nuevo.',
  },
  {
    id: 'elec_resistiva',
    nombre: 'Electricidad (resistiva)',
    unidad: 'kWh',
    pci_kwh_unidad: 1,
    rendTipico: 1.00,        // resistencia = 100% pero costoso
    precios: null,           // usa tarifa eléctrica del proyecto
    usaTarifaElec: true,
    co2_kg_kwh: 0.40,        // emisiones SIC chileno ~400 g CO₂/kWh
    notas: 'Estufa eléctrica común. Alto costo operacional.',
  },
  {
    id: 'bdc_split',
    nombre: 'Bomba de calor (split aire-aire)',
    unidad: 'kWh elec',
    pci_kwh_unidad: 1,
    rendTipico: 3.0,         // COP estacional típico ~3
    precios: null,
    usaTarifaElec: true,
    co2_kg_kwh: 0.13,        // 0.40 / 3.0
    cop_nominal: 3.5,
    notas: 'COP cae con Te bajo. Para zonas E-H usar BdC con compresor inverter.',
  },
  {
    id: 'bdc_aerotermia',
    nombre: 'Bomba de calor aerotérmica (agua)',
    unidad: 'kWh elec',
    pci_kwh_unidad: 1,
    rendTipico: 3.5,
    precios: null,
    usaTarifaElec: true,
    co2_kg_kwh: 0.11,
    cop_nominal: 4.0,
    notas: 'Alimenta losa radiante o radiadores. Premium pero muy eficiente.',
  },
  {
    id: 'bdc_geotermia',
    nombre: 'Bomba de calor geotérmica',
    unidad: 'kWh elec',
    pci_kwh_unidad: 1,
    rendTipico: 4.5,         // COP estable por T suelo constante
    precios: null,
    usaTarifaElec: true,
    co2_kg_kwh: 0.09,
    cop_nominal: 5.0,
    notas: 'Inversión alta (~CLP 8-15M). COP estable año redondo.',
  },
  {
    id: 'caldera_biomasa',
    nombre: 'Caldera biomasa + acumulador',
    unidad: 'kg pellet',
    pci_kwh_unidad: 4.7,
    rendTipico: 0.92,
    precios: { norte: 380, centro: 360, sur: 340, austral: 360 },
    co2_kg_kwh: 0.04,
    notas: 'Mayor eficiencia que estufa puntual. Para casas grandes.',
  },
]

// ─── SISTEMAS PARA AGUA CALIENTE SANITARIA (ACS) ────────────────────────────
export const SISTEMAS_ACS = [
  { id: 'calefon_gas',     nombre: 'Calefón a gas (GLP/GN)',       rend: 0.78, combustibleAsoc: 'glp_cilindro_15' },
  { id: 'termo_elec',      nombre: 'Termo eléctrico',              rend: 0.95, combustibleAsoc: 'elec_resistiva' },
  { id: 'termo_gas',       nombre: 'Termo a gas',                  rend: 0.82, combustibleAsoc: 'glp_cilindro_45' },
  { id: 'caldera_mixta',   nombre: 'Caldera mixta (calefacción+ACS)', rend: 0.85, combustibleAsoc: 'gas_natural' },
  { id: 'bdc_acs',         nombre: 'Bomba calor para ACS',         rend: 3.0,  combustibleAsoc: 'elec_resistiva', esBdC: true },
  { id: 'solar_termico',   nombre: 'Solar térmico + apoyo eléctrico', rend: 0.70, combustibleAsoc: 'elec_resistiva', cobertura: 0.70 },
  { id: 'solar_termico_g', nombre: 'Solar térmico + apoyo gas',    rend: 0.75, combustibleAsoc: 'glp_cilindro_15', cobertura: 0.70 },
]

// ─── SISTEMAS PARA COCCIÓN ──────────────────────────────────────────────────
export const SISTEMAS_COCINA = [
  { id: 'gas_natural',  nombre: 'Cocina a gas natural',  combustibleAsoc: 'gas_natural' },
  { id: 'gas_glp',      nombre: 'Cocina a GLP cilindro', combustibleAsoc: 'glp_cilindro_15' },
  { id: 'elec_resist',  nombre: 'Eléctrica resistiva',   combustibleAsoc: 'elec_resistiva' },
  { id: 'induccion',    nombre: 'Inducción',             combustibleAsoc: 'elec_resistiva', rend: 0.90 },
  { id: 'lena_cocina',  nombre: 'Cocina combinada a leña', combustibleAsoc: 'lena_no_cert' },
]

// ─── Helper: zona OGUC → macrozona ──────────────────────────────────────────
export function zonaOGUCaMacrozona(zonaOGUC) {
  for (const [key, m] of Object.entries(MACROZONAS)) {
    if (m.zonasOGUC.includes(zonaOGUC)) return key
  }
  return 'centro'  // fallback
}

// ─── Helper: obtener CLP/kWh útil de un combustible ──────────────────────────
export function clpKwhUtil(combId, macrozona, tarifaElecKwh = TARIFA_ELEC_DEFAULT) {
  const c = COMBUSTIBLES_CALEFACCION.find(x => x.id === combId)
  if (!c) return null
  if (c.usaTarifaElec) return tarifaElecKwh / c.rendTipico
  const precio = c.precios?.[macrozona] || 0
  if (!precio) return null
  return precio / (c.pci_kwh_unidad * c.rendTipico)
}
