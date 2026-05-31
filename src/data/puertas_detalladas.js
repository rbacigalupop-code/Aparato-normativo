// ─────────────────────────────────────────────────────────────────────────────
// puertas_detalladas.js — Catálogo de hojas, marcos y sellos perimetrales para
// cálculo combinado de U_puerta + validación normativa (térmica, RF, acústica,
// dimensiones OGUC).
//
// Referencias normativas:
//   · DS N°15 MINVU 2007 — transmitancia térmica máxima envolvente (zonas A-H)
//   · NCh853:2021 — método de cálculo de U y condensación
//   · LOFC Ed.17 2025 — resistencia al fuego (RF) requerida por uso
//   · NCh352:2013 — aislamiento acústico aéreo (R'w) requerido entre recintos
//   · OGUC Tít. IV — dimensiones mínimas, accesibilidad, evacuación
//   · ISO 10077-1 — cálculo combinado U (mismo método que ventanas)
//
//   U_puerta = (U_hoja·A_hoja + U_marco·A_marco + Ψ_sello·L_sello)
//              ──────────────────────────────────────────────────
//                                  A_total
//
// Notas constructivas:
//   · Para puertas con vidriado parcial (acceso vidriado), el U del vidrio
//     se modela como una hoja vidriada con su propio U.
//   · La RF de la puerta como conjunto es el mínimo entre hoja y marco
//     (cadena rota en el eslabón más débil).
//   · El R'w del conjunto es R'w_hoja + bonus por sello perimetral
//     (puerta sin sello pierde 5-10 dB respecto a la hoja sola).
// ─────────────────────────────────────────────────────────────────────────────

// ═══ HOJAS ═══════════════════════════════════════════════════════════════════
// U_hoja [W/m²K], RF intrínseca, R'w base [dB], espesor típico [mm].
// Datos según EN 14351-1, ITT de fabricantes (Lemmen, Hörmann, Tecnopuertas
// Chile), NCh352:2013 Anexo B.
export const HOJAS = [
  {
    id: 'madera_hueca',
    nombre: 'Madera hueca (35mm — interior básica)',
    u: 3.5, rf: 'F0', rw: 22, espesor_mm: 35,
    color: '#a16207',
    nota: 'Puerta interior estándar. Sin propiedades térmicas/acústicas. NO apta para acceso a vivienda.',
  },
  {
    id: 'madera_solida',
    nombre: 'Madera sólida (45mm)',
    u: 2.8, rf: 'F0', rw: 28, espesor_mm: 45,
    color: '#a16207',
    nota: 'Tablero macizo o tablón. Aceptable térmicamente solo en zonas A-B.',
  },
  {
    id: 'madera_aislada',
    nombre: 'Madera con núcleo aislado (50mm)',
    u: 1.5, rf: 'F0', rw: 32, espesor_mm: 50,
    color: '#a16207',
    nota: 'Núcleo de lana mineral o PU entre dos placas. Buen desempeño zonas C-E.',
  },
  {
    id: 'acero_sin_aislar',
    nombre: 'Acero sin aislar (chapa)',
    u: 5.5, rf: 'F30', rw: 25, espesor_mm: 40,
    color: '#6b7280',
    nota: 'Conductor térmico. Solo viable como puerta de servicio. Genera condensación.',
  },
  {
    id: 'acero_aislado',
    nombre: 'Acero con núcleo poliuretano (PU)',
    u: 1.5, rf: 'F30', rw: 30, espesor_mm: 50,
    color: '#6b7280',
    nota: 'Estándar acceso vivienda zonas frías. PU λ=0.025 corta puente térmico de la chapa.',
  },
  {
    id: 'acero_cortafuego_f60',
    nombre: 'Acero cortafuego F60 (lana mineral)',
    u: 2.0, rf: 'F60', rw: 38, espesor_mm: 60,
    color: '#6b7280',
    nota: 'Núcleo de lana mineral densidad alta. Apta evacuación / cuarto técnico. Certificación EN 1634.',
  },
  {
    id: 'acero_cortafuego_f90',
    nombre: 'Acero cortafuego F90',
    u: 2.0, rf: 'F90', rw: 40, espesor_mm: 70,
    color: '#6b7280',
    nota: 'Doble panel + intumescente. Cuartos técnicos críticos / interconexión sectores de incendio.',
  },
  {
    id: 'pvc_reforzado',
    nombre: 'PVC con refuerzo metálico',
    u: 1.8, rf: 'F0', rw: 28, espesor_mm: 55,
    color: '#e5e7eb',
    nota: 'Marco de PVC con perfil interior reforzado. Buen costo/desempeño térmico.',
  },
  {
    id: 'vidrio_dvh',
    nombre: 'Vidrio DVH 4-12-4 (acceso vidriado)',
    u: 2.8, rf: 'F0', rw: 27, espesor_mm: 20,
    color: '#bae6fd',
    nota: 'Para acceso principal vidriado. Marco aporta a la solución conjunta; revisar.',
  },
  {
    id: 'pasiva',
    nombre: 'Casa Pasiva certificada (PHI)',
    u: 0.8, rf: 'F30', rw: 42, espesor_mm: 90,
    color: '#a3e635',
    nota: 'Triple panel + RPT + sellado perimetral certificado. Para edificios PassivHaus.',
  },
]

// ═══ MARCOS ══════════════════════════════════════════════════════════════════
// U_marco [W/m²K], ancho perimetral típico [mm], RF y nota.
// Idéntico a marcos de ventana pero con consideración a la robustez (puertas
// reciben más carga mecánica).
export const MARCOS_PUERTA = [
  {
    id: 'madera_macizo',
    nombre: 'Madera maciza (jamba pino)',
    u: 2.5, ancho_mm: 80, rf: 'F0',
    color: '#a16207',
    nota: 'Jamba tradicional. Mantención: barniz/pintura cada 3-5 años en exterior.',
  },
  {
    id: 'acero_sin_rpt',
    nombre: 'Acero (sin RPT)',
    u: 6.0, ancho_mm: 60, rf: 'F30',
    color: '#6b7280',
    nota: 'Marco chapa plegada. Puente térmico severo: condensación garantizada en zonas frías.',
  },
  {
    id: 'acero_con_rpt',
    nombre: 'Acero con RPT (rotura puente térmico)',
    u: 3.5, ancho_mm: 70, rf: 'F30',
    color: '#6b7280',
    nota: 'Marco con perfil aislado intermedio. Apto zonas D-F.',
  },
  {
    id: 'aluminio_rpt',
    nombre: 'Aluminio con RPT 24mm',
    u: 4.0, ancho_mm: 65, rf: 'F0',
    color: '#9ca3af',
    nota: 'Marco común en acceso vidriado. Térmicamente mediocre, considerar PVC.',
  },
  {
    id: 'pvc',
    nombre: 'PVC reforzado 5 cámaras',
    u: 2.0, ancho_mm: 75, rf: 'F0',
    color: '#e5e7eb',
    nota: 'Mejor compromiso térmica / costo. Estándar acceso vivienda zonas E-F.',
  },
  {
    id: 'pvc_premium',
    nombre: 'PVC premium 7 cámaras + refuerzo',
    u: 1.2, ancho_mm: 88, rf: 'F0',
    color: '#e5e7eb',
    nota: 'Casa Pasiva. Sello triple labio.',
  },
]

// ═══ SELLOS PERIMETRALES ═════════════════════════════════════════════════════
// Ψ_sello [W/m·K] — pérdida por la junta hoja-marco.
// Bonus R'w (dB) — mejora acústica aportada por el sello.
// Clase infiltración EN 12207 (A=mejor, D=peor).
//
// Una puerta sin sellos puede perder 30-40% de su rendimiento térmico-acústico
// teórico. El sello es CRÍTICO en puertas (más que en ventanas) por la mayor
// frecuencia de uso y deformación.
export const SELLOS = [
  {
    id: 'sin_sello',
    nombre: 'Sin sello perimetral',
    psi: 0.25, bonus_rw_db: 0, infiltracion_clase: 'D',
    nota: 'Puerta sin junta. Pierde 30-40% de U y 5-10 dB de R\'w. NO RECOMENDADO para envolvente.',
  },
  {
    id: 'goma_basica',
    nombre: 'Junta de goma básica (perimetral)',
    psi: 0.15, bonus_rw_db: 2, infiltracion_clase: 'C',
    nota: 'Junta económica. Aceptable en puertas interiores. Reemplazar cada 5-7 años.',
  },
  {
    id: 'epdm_perimetral',
    nombre: 'EPDM perimetral + umbral',
    psi: 0.08, bonus_rw_db: 5, infiltracion_clase: 'B',
    nota: 'Estándar acceso vivienda. EPDM resiste UV e intemperie. Vida útil 15+ años.',
  },
  {
    id: 'doble_junta_acustica',
    nombre: 'Doble junta + umbral acústico (guillotina)',
    psi: 0.04, bonus_rw_db: 8, infiltracion_clase: 'A',
    nota: 'Doble línea de sello + umbral con guillotina al cerrar. Para puertas acústicas y Casa Pasiva.',
  },
]

// ═══ DIMENSIONES MÍNIMAS OGUC ════════════════════════════════════════════════
// Dimensiones libres de paso requeridas por uso (OGUC Tít. IV + DS 50 MINVU).
// "Ancho libre" = ancho de paso útil sin contar el marco.
export const DIMENSIONES_OGUC = {
  acceso_principal: {
    label: 'Acceso principal vivienda',
    ancho_libre_min_m: 0.90,
    alto_libre_min_m: 2.00,
    abre_hacia: 'interior',
    nota: 'OGUC Art. 4.1.7. El ancho mide entre marcos.',
  },
  acceso_evacuacion: {
    label: 'Salida de evacuación',
    ancho_libre_min_m: 0.90,
    alto_libre_min_m: 2.00,
    abre_hacia: 'exterior',
    nota: 'OGUC Art. 4.2.13. Debe abrir en sentido evacuación.',
  },
  interior_recinto: {
    label: 'Puerta interior de recinto habitable',
    ancho_libre_min_m: 0.80,
    alto_libre_min_m: 2.00,
    abre_hacia: 'cualquiera',
    nota: 'OGUC. Dormitorios, estar, comedor.',
  },
  banno: {
    label: 'Baño',
    ancho_libre_min_m: 0.75,
    alto_libre_min_m: 2.00,
    abre_hacia: 'exterior',
    nota: 'OGUC. Mínimo absoluto. Recomendado 0.80 m por accesibilidad.',
  },
  accesible: {
    label: 'Acceso accesibilidad universal',
    ancho_libre_min_m: 0.90,
    alto_libre_min_m: 2.00,
    abre_hacia: 'cualquiera',
    nota: 'NCh3271 + DS 50 MINVU. Sin sobreancho de marco que reduzca el paso útil.',
  },
}

// ═══ REQUISITOS RF MÍNIMOS POR USO ═══════════════════════════════════════════
// LOFC Ed.17 2025 — RF mínima requerida para la puerta según ubicación/uso.
export const RF_MINIMO_POR_USO = {
  acceso_vivienda:        { rf: 'F0',  nota: 'No requiere RF certificada para envolvente exterior.' },
  acceso_unidades:        { rf: 'F30', nota: 'Puerta entre unidades de vivienda o vivienda-pasillo común.' },
  evacuacion_escalera:    { rf: 'F60', nota: 'Puerta a escalera de evacuación / sector de incendio.' },
  cuarto_tecnico:         { rf: 'F60', nota: 'Salas eléctricas, GAS, telecomunicaciones. LOFC §7.3.' },
  cuarto_basura:          { rf: 'F60', nota: 'Salas de basura — sector de incendio dedicado.' },
  ascensor_maquinas:      { rf: 'F90', nota: 'Sala de máquinas de ascensor. LOFC §7.4.' },
}

// ═══ REQUISITOS R'w MÍNIMOS POR USO ══════════════════════════════════════════
// NCh352:2013 + DS 47 MINVU. R'w mínimo del conjunto puerta (in situ).
export const RW_MINIMO_POR_USO = {
  acceso_vivienda:    { rw: 35, nota: 'Acceso desde pasillo común. NCh352 entre unidad y zona común.' },
  entre_unidades:     { rw: 45, nota: 'Puerta de comunicación entre dos unidades de vivienda.' },
  interior_dormitorio:{ rw: 25, nota: 'Puerta interior dormitorio. Privacidad básica.' },
  estudio_oficina:    { rw: 35, nota: 'Confidencialidad de reuniones.' },
  cuarto_maquinas:    { rw: 45, nota: 'Aislamiento de ruido de equipos hacia recintos habitables.' },
}

// ═══ Umax DS N°15 PARA PUERTAS (mismo umbral que ventanas) ═══════════════════
// DS N°15 no define un umbral exclusivo de puertas para todo tipo. Se aplica
// el de "elementos vidriados" cuando la puerta tiene vidrio, y el de muros
// cuando es opaca. Conservadoramente la app usa el umbral de ventanas que es
// más exigente para validar puertas exteriores.
export const UMAX_PUERTA_DS15 = {
  'A': 5.8, 'B': 4.6, 'C': 4.0, 'D': 3.6, 'E': 3.0, 'F': 2.4, 'G': 2.0, 'H': 1.8,
}

// ═══ SUGERENCIAS POR ZONA ════════════════════════════════════════════════════
// Configuración recomendada para acceso principal de vivienda según zona DS N°15.
export const SUGERENCIAS_POR_ZONA = {
  'A': { hoja: 'madera_solida',     marco: 'madera_macizo', sello: 'goma_basica' },
  'B': { hoja: 'madera_solida',     marco: 'madera_macizo', sello: 'goma_basica' },
  'C': { hoja: 'madera_aislada',    marco: 'madera_macizo', sello: 'epdm_perimetral' },
  'D': { hoja: 'madera_aislada',    marco: 'pvc',           sello: 'epdm_perimetral' },
  'E': { hoja: 'acero_aislado',     marco: 'pvc',           sello: 'epdm_perimetral' },
  'F': { hoja: 'acero_aislado',     marco: 'pvc',           sello: 'doble_junta_acustica' },
  'G': { hoja: 'pasiva',            marco: 'pvc_premium',   sello: 'doble_junta_acustica' },
  'H': { hoja: 'pasiva',            marco: 'pvc_premium',   sello: 'doble_junta_acustica' },
}

// ═══ Helpers ═════════════════════════════════════════════════════════════════
export function obtenerHoja(id)            { return HOJAS.find(h => h.id === id)            || null }
export function obtenerMarcoPuerta(id)     { return MARCOS_PUERTA.find(m => m.id === id)    || null }
export function obtenerSello(id)           { return SELLOS.find(s => s.id === id)           || null }
export function obtenerDimensionOGUC(uso)  { return DIMENSIONES_OGUC[uso]                   || null }

// Compara dos RF en escala F0/F15/F30/F60/F90/F120/F150/F180.
// Devuelve -1 si a<b, 0 si igual, 1 si a>b.
export function compararRF(rfA, rfB) {
  const orden = { F0: 0, F15: 15, F30: 30, F60: 60, F90: 90, F120: 120, F150: 150, F180: 180 }
  const a = orden[rfA] ?? 0
  const b = orden[rfB] ?? 0
  return a < b ? -1 : a > b ? 1 : 0
}

// RF del conjunto = mínimo entre hoja y marco
export function rfConjunto(rfHoja, rfMarco) {
  return compararRF(rfHoja, rfMarco) <= 0 ? rfHoja : rfMarco
}
