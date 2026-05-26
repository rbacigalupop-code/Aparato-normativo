// ─────────────────────────────────────────────────────────────────────────────
// costos_intervencion.js — Costos referenciales CLP/m² por corrección.
//
// Valores estimados a Mayo 2026 con base en:
//   · Precios SODIMAC, EASY, Construmart (materiales)
//   · BBR Construction Cost Index Chile
//   · Estudios CDT (Corporación Desarrollo Tecnológico CChC)
//   · Cotizaciones de instaladores especializados
//
// IMPORTANTE: son referenciales — varían por:
//   · Región (mano de obra ±25%)
//   · Volumen (intervenciones grandes bajan unitarios)
//   · Estado del soporte (preparación previa)
//   · Marca y proveedor de materiales
// ─────────────────────────────────────────────────────────────────────────────

// Costos por correción del motor (data.js → generarCorrecciones)
// Estructura: { cMin, cTipico, cMax } en CLP/m²

export const COSTOS_CORRECCION = {
  c1_eifs: {
    nombre:  'EIFS / SATE',
    cMin:    28000,
    cTipico: 36000,
    cMax:    48000,
    incluye: ['aislante EPS/MW', 'malla fibra vidrio', 'adhesivo', 'estuco terminación', 'mano obra especializada'],
    nota:    'Costo varía con espesor del aislante (más material).',
    factorPorMm: 280,   // CLP/m² adicional por cada mm extra de aislante
  },
  c2_ventilada: {
    nombre:  'Fachada Ventilada',
    cMin:    55000,
    cTipico: 72000,
    cMax:    95000,
    incluye: ['subestructura metálica', 'aislante', 'barrera humedad Tyvek', 'cámara ventilada', 'placa fibrocemento', 'remates'],
    nota:    'Sistema más caro pero mejor higrotérmica. Mano de obra calificada.',
    factorPorMm: 320,
  },
  c3_trasdosado: {
    nombre:  'Trasdosado Interior',
    cMin:    22000,
    cTipico: 30000,
    cMax:    42000,
    incluye: ['perfilería metálica', 'aislante', 'barrera vapor PE', 'plancha yeso cartón', 'pasta + cinta', 'pintura'],
    nota:    'Reduce ancho útil del recinto. Más barato que intervención exterior.',
    factorPorMm: 250,
  },
  c4_espesor: {
    nombre:  'Aumentar espesor aislante existente',
    cMin:    8000,
    cTipico: 14000,
    cMax:    22000,
    incluye: ['demolición parcial', 'aislante adicional', 'reterminación'],
    nota:    'La más económica si el sistema existente lo permite.',
    factorPorMm: 200,
  },
  c5_vapor: {
    nombre:  'Barrera de vapor',
    cMin:    3500,
    cTipico: 4800,
    cMax:    6500,
    incluye: ['polietileno PE 0.2mm', 'sellado en encuentros', 'cinta + masilla', 'mano obra'],
    nota:    'Crítico el sellado en pasos de instalaciones.',
    factorPorMm: 0,
  },
  c6_sustituir: {
    nombre:  'Sustituir aislante por mejor λ',
    cMin:    15000,
    cTipico: 24000,
    cMax:    38000,
    incluye: ['retiro aislante existente', 'aislante nuevo (mejor λ)', 'remates'],
    nota:    'Mismo espesor, mejor desempeño. Costo aislante premium.',
    factorPorMm: 0,
  },
  c7_reordenar: {
    nombre:  'Reordenar capas',
    cMin:    12000,
    cTipico: 18000,
    cMax:    25000,
    incluye: ['desarme parcial', 'rearmado en nueva secuencia', 'remates'],
    nota:    'Mano de obra principalmente. Conserva materiales originales.',
    factorPorMm: 0,
  },
}

// ─── Helper: obtener costo total para un caso ───────────────────────────────
// correccion: el objeto correccion completo (con id que empieza por c1_, c2_, etc.)
// area_m2: superficie a intervenir
// espesor_aislante_mm: si aplica (para factorPorMm)
export function calcularCostoIntervencion(correccion, area_m2 = 1, espesor_aislante_mm = 0) {
  if (!correccion?.id) return null
  // El id tiene formato 'c1_eifs_xxx' → extraemos el prefijo 'c1_eifs'
  const prefijo = correccion.id.split('_').slice(0, 2).join('_')
  const cfg = COSTOS_CORRECCION[prefijo]
  if (!cfg) return null

  const base = cfg.cTipico
  const extraEspesor = (cfg.factorPorMm || 0) * Math.max(0, espesor_aislante_mm - 50)
  const costoUnit = base + extraEspesor

  return {
    costoUnit:   costoUnit,                              // CLP/m²
    costoTotal:  Math.round(costoUnit * area_m2),        // CLP
    rangoMin:    Math.round(cfg.cMin * area_m2),
    rangoMax:    Math.round((cfg.cMax + extraEspesor) * area_m2),
    incluye:     cfg.incluye,
    nota:        cfg.nota,
  }
}
