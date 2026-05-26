// ─────────────────────────────────────────────────────────────────────────────
// cev_chile.js — Datos para Calificación Energética de Viviendas (CEV) MINVU.
//
// CEV oficial: certificación de eficiencia energética de viviendas en Chile,
// emitida por evaluadores acreditados con software CCTE_CL. Escala A+ a G,
// donde A+ es la más eficiente.
//
// Esta app entrega una CEV ESTIMADA basada en demanda térmica y emisiones.
// Es referencial — NO reemplaza certificación oficial — pero da el rango
// esperado y permite priorizar inversiones.
//
// Fuente:
//   · MINVU - CEV (calificacionenergetica.minvu.cl)
//   · DS N°50/2018 RT-CEV
//   · Estudios CITEC UBB sobre vivienda chilena
// ─────────────────────────────────────────────────────────────────────────────

// Escala CEV oficial — rangos de demanda + emisiones combinados
// El método CEV oficial es más complejo (CCTE_CL); aquí usamos una versión
// simplificada equivalente al "letrero CEV" residencial.
export const ESCALA_CEV = [
  { letra: 'A+', max: 25,    color: '#15803d', desc: 'Vivienda muy eficiente — estándar Casa Pasiva' },
  { letra: 'A',  max: 40,    color: '#16a34a', desc: 'Vivienda eficiente — alto rendimiento' },
  { letra: 'B',  max: 65,    color: '#65a30d', desc: 'Vivienda con buen desempeño' },
  { letra: 'C',  max: 95,    color: '#84cc16', desc: 'Vivienda sobre el promedio' },
  { letra: 'D',  max: 130,   color: '#eab308', desc: 'Promedio nacional (referencia)' },
  { letra: 'E',  max: 180,   color: '#f59e0b', desc: 'Vivienda bajo el promedio' },
  { letra: 'F',  max: 250,   color: '#dc2626', desc: 'Vivienda ineficiente' },
  { letra: 'G',  max: 9999,  color: '#991b1b', desc: 'Vivienda muy ineficiente — alta intervención' },
]

// Benchmarks chilenos (kWh/m²·año demanda térmica neta)
export const BENCHMARKS_CHILE = [
  {
    id: 'pasiva',
    label: 'Casa Pasiva',
    valor: 15,
    color: '#15803d',
    descripcion: 'Estándar PassivHaus certificado (Alemania/Chile)',
  },
  {
    id: 'a',
    label: 'Vivienda A',
    valor: 40,
    color: '#16a34a',
    descripcion: 'Letra A CEV MINVU',
  },
  {
    id: 'nueva_2024',
    label: 'Vivienda nueva DS N°15',
    valor: 90,
    color: '#84cc16',
    descripcion: 'Vivienda nueva cumpliendo DS N°15 actualizado',
  },
  {
    id: 'promedio_cl',
    label: 'Promedio Chile',
    valor: 130,
    color: '#eab308',
    descripcion: 'Vivienda promedio chilena (CASEN energía)',
  },
  {
    id: 'social',
    label: 'Vivienda social DS19',
    valor: 170,
    color: '#f59e0b',
    descripcion: 'Vivienda social subsidiada típica',
  },
  {
    id: 'antigua',
    label: 'Vivienda antigua sin aislar',
    valor: 240,
    color: '#dc2626',
    descripcion: 'Vivienda pre-2000 sin intervenciones',
  },
]

// Factor de energía primaria por combustible (kWh primaria / kWh útil)
// Convención CTE-HE / CEV-MINVU
// Indica cuánta energía primaria se gasta por cada kWh útil entregado.
// Renovables tienen factor ~0 (son energía primaria por sí mismas).
export const FACTOR_EP = {
  elec_resistiva:   2.0,    // Mix SIC ~50% renovable, factor 2.0 típico
  elec_red:         2.0,
  gas_natural:      1.07,
  glp_granel:       1.10,
  glp_cilindro_11:  1.10,
  glp_cilindro_15:  1.10,
  glp_cilindro_45:  1.10,
  diesel:           1.18,
  kerosene:         1.18,
  lena_no_cert:     1.05,   // Biomasa renovable
  lena_certificada: 1.05,
  pellets:          1.05,
  briquetas:        1.05,
  carbon_mineral:   1.15,
  caldera_biomasa:  1.05,
  bdc_split:        2.0,    // alimentado por elec
  bdc_aerotermia:   2.0,
  bdc_geotermia:    2.0,
  solar_termico:    0,      // renovable
  solar_fv:         0,
}

// Factor CO2 oficial 2024 (kg CO2eq / kWh útil)
// Fuentes: SEC, MMA, CNE
export const FACTOR_CO2 = {
  elec_resistiva:   0.40,   // SIC actual ~400 g/kWh
  gas_natural:      0.20,
  glp_cilindro_15:  0.24,
  diesel:           0.27,
  kerosene:         0.26,
  lena_no_cert:     0.41,   // biomasa: contaminación local alta
  lena_certificada: 0.37,
  pellets:          0.05,
  carbon_mineral:   0.34,
  bdc_split:        0.13,   // factor elec / COP 3
  bdc_aerotermia:   0.11,
  bdc_geotermia:    0.09,
  solar_termico:    0,
  solar_fv:         0,
}

// Categorías de mejora con orden de prioridad típico (por costo-efectividad)
export const PRIORIDADES_INVERSION = [
  { tipo: 'ventilacion_nocturna', costo_aprox: 0,        impacto: 'Reduce sobrecalentamiento verano',
    descripcion: 'Implementar ventilación cruzada nocturna en verano — costo cero, alto impacto.' },
  { tipo: 'aleros_norte',         costo_aprox: 350000,   impacto: 'Reduce ganancia solar verano norte',
    descripcion: 'Agregar aleros de 60-80cm en ventanas norte — protege en verano, deja pasar invierno.' },
  { tipo: 'aislante_techo',       costo_aprox: 800000,   impacto: 'Reduce 25-35% demanda calefacción',
    descripcion: 'Aumentar aislante del techo a 100mm+ (el techo es donde más se pierde calor).' },
  { tipo: 'sellado_aire',         costo_aprox: 250000,   impacto: 'Reduce 15-25% pérdidas por infiltración',
    descripcion: 'Sellar grietas en marcos, juntas, pasadas de instalaciones (n50 baja a 0.8-1.0).' },
  { tipo: 'aislante_muro',        costo_aprox: 1500000,  impacto: 'Reduce 20-30% demanda',
    descripcion: 'EIFS/SATE o trasdosado interior con 50mm aislante.' },
  { tipo: 'cambiar_ventanas',     costo_aprox: 3500000,  impacto: 'Reduce 15-25% pérdidas + sobrecalentamiento',
    descripcion: 'DVH low-e con marco RPT o PVC. Mayor confort + reduce sobrecalentamiento O y N.' },
  { tipo: 'solar_termico',        costo_aprox: 1500000,  impacto: 'Cubre 50-80% ACS',
    descripcion: 'Solar térmico con franquicia Ley 20.365 (descuento ~55% si vivienda ≤2000 UF).' },
  { tipo: 'bdc',                  costo_aprox: 2500000,  impacto: 'Reduce 60-70% costos calefacción',
    descripcion: 'Bomba de calor reemplaza combustión. COP 3-4 vs eficiencia 0.7 leña.' },
  { tipo: 'fotovoltaico',         costo_aprox: 4500000,  impacto: 'Cubre 60-100% consumo eléctrico',
    descripcion: 'Solar FV bajo Net-billing Ley 21.118. Payback típico 6-9 años en Chile.' },
]

// Helper: posición en escala CEV
export function letraCEVporDemanda(kwhM2Anio) {
  if (kwhM2Anio == null || isNaN(kwhM2Anio)) return ESCALA_CEV[ESCALA_CEV.length - 1]
  for (const e of ESCALA_CEV) {
    if (kwhM2Anio <= e.max) return e
  }
  return ESCALA_CEV[ESCALA_CEV.length - 1]
}

// Helper: percentil en distribución chilena (qué % de viviendas son peores)
export function percentilChile(kwhM2Anio) {
  // Aproximación: en Chile la distribución de demanda es ~log-normal con
  // mediana 130 kWh/m²·año y desviación amplia. Damos un % aproximado.
  if (kwhM2Anio <= 25)  return 99
  if (kwhM2Anio <= 40)  return 95
  if (kwhM2Anio <= 65)  return 85
  if (kwhM2Anio <= 95)  return 70
  if (kwhM2Anio <= 130) return 50
  if (kwhM2Anio <= 180) return 25
  if (kwhM2Anio <= 250) return 10
  return 2
}
