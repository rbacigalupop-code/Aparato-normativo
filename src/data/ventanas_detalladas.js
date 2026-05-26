// ─────────────────────────────────────────────────────────────────────────────
// ventanas_detalladas.js — Catálogo de marcos, vidrios e intercalarios para
// cálculo combinado de U_ventana (NCh3079 / NCh853 / ISO 10077).
//
// Una ventana real tiene 3 componentes que aportan a la transmitancia total:
//
//   U_ventana = (U_marco · A_marco + U_vidrio · A_vidrio + Ψ_intercalario · L_intercalario)
//               ──────────────────────────────────────────────────────────────
//                                    A_ventana
//
// Factor solar combinado g_w ≈ g_v · (A_vidrio / A_total)
// ─────────────────────────────────────────────────────────────────────────────

// ═══ MARCOS ═════════════════════════════════════════════════════════════════
// U_marco (W/m²K) y ancho típico (mm) para cálculo de área marco.
export const MARCOS = [
  {
    id: 'al_sin_rpt',
    nombre: 'Aluminio sin RPT',
    u: 6.4,
    ancho_mm: 60,
    color: '#9ca3af',
    nota: 'Muy mal aislante. Genera condensación superficial en clima frío.',
  },
  {
    id: 'al_rpt_12mm',
    nombre: 'Aluminio con RPT 12 mm',
    u: 4.5,
    ancho_mm: 70,
    color: '#9ca3af',
    nota: 'RPT corto. Adecuado para zona D, mediocre en zona E-F.',
  },
  {
    id: 'al_rpt_24mm',
    nombre: 'Aluminio con RPT 24 mm',
    u: 3.2,
    ancho_mm: 75,
    color: '#9ca3af',
    nota: 'RPT largo. Buen desempeño hasta zona F.',
  },
  {
    id: 'al_rpt_premium',
    nombre: 'Aluminio RPT premium (>32 mm)',
    u: 2.4,
    ancho_mm: 80,
    color: '#9ca3af',
    nota: 'Series premium (Schüco, Cortizo). Para climas extremos.',
  },
  {
    id: 'pvc_3camaras',
    nombre: 'PVC 3 cámaras',
    u: 2.2,
    ancho_mm: 70,
    color: '#fafafa',
    nota: 'Estándar europeo de entrada. Buen costo/desempeño.',
  },
  {
    id: 'pvc_5camaras',
    nombre: 'PVC 5 cámaras',
    u: 1.6,
    ancho_mm: 78,
    color: '#fafafa',
    nota: 'Estándar PassivHaus residencial.',
  },
  {
    id: 'pvc_7camaras',
    nombre: 'PVC 7 cámaras + refuerzo',
    u: 1.2,
    ancho_mm: 88,
    color: '#fafafa',
    nota: 'Casa Pasiva certificada. Premium.',
  },
  {
    id: 'madera_estandar',
    nombre: 'Madera (60 mm)',
    u: 2.0,
    ancho_mm: 70,
    color: '#92400e',
    nota: 'Buen aislante natural. Requiere mantención periódica.',
  },
  {
    id: 'madera_premium',
    nombre: 'Madera (80 mm laminada)',
    u: 1.3,
    ancho_mm: 90,
    color: '#92400e',
    nota: 'Aproxima a PassivHaus en madera.',
  },
  {
    id: 'madera_aluminio',
    nombre: 'Madera + revestimiento aluminio',
    u: 1.5,
    ancho_mm: 85,
    color: '#92400e',
    nota: 'Interior madera, exterior aluminio. Estética + duración.',
  },
]

// ═══ VIDRIOS ════════════════════════════════════════════════════════════════
// U_vidrio (W/m²K), factor solar g (sin unidad), transmisión luminosa TL.
export const VIDRIOS = [
  {
    id: 'mono_4mm',
    nombre: 'Monolítico 4 mm',
    u: 5.7,
    g: 0.85,
    tl: 0.90,
    espesor_mm: 4,
    nota: 'Vidrio simple. Solo viable en zonas A-B o tabiques interiores.',
  },
  {
    id: 'mono_6mm',
    nombre: 'Monolítico 6 mm',
    u: 5.5,
    g: 0.82,
    tl: 0.87,
    espesor_mm: 6,
    nota: 'Igual que 4mm pero más resistente. Sigue siendo poco aislante.',
  },
  {
    id: 'dvh_4_6_4',
    nombre: 'DVH 4-6-4 (Aire)',
    u: 3.3,
    g: 0.75,
    tl: 0.82,
    espesor_mm: 14,
    nota: 'DVH económico. Mejora 40% vs monolítico.',
  },
  {
    id: 'dvh_4_12_4',
    nombre: 'DVH 4-12-4 (Aire)',
    u: 2.8,
    g: 0.75,
    tl: 0.82,
    espesor_mm: 20,
    nota: 'DVH estándar. Cámara de 12mm es óptima en aire seco.',
  },
  {
    id: 'dvh_4_12_4_argon',
    nombre: 'DVH 4-12-4 (Argón)',
    u: 2.5,
    g: 0.75,
    tl: 0.82,
    espesor_mm: 20,
    nota: 'Reemplazar aire por argón mejora ~10%. Costo similar.',
  },
  {
    id: 'dvh_low_e_argon',
    nombre: 'DVH 4-12-4 low-e + Argón',
    u: 1.6,
    g: 0.55,
    tl: 0.75,
    espesor_mm: 20,
    nota: 'Low-e (capa baja emisividad) bloquea radiación infrarroja saliente. Estándar moderno.',
  },
  {
    id: 'dvh_low_e_selectivo',
    nombre: 'DVH low-e selectivo (Argón)',
    u: 1.4,
    g: 0.40,
    tl: 0.70,
    espesor_mm: 20,
    nota: 'Low-e selectivo bloquea más radiación solar — ideal para verano. Compromiso: menos ganancia invernal.',
  },
  {
    id: 'triple_4_12_4_12_4_argon',
    nombre: 'Triple 4-12-4-12-4 (Argón)',
    u: 1.1,
    g: 0.65,
    tl: 0.72,
    espesor_mm: 36,
    nota: 'Tres láminas. Casa Pasiva. Pesado, marco debe soportar.',
  },
  {
    id: 'triple_low_e_argon',
    nombre: 'Triple low-e + Argón',
    u: 0.7,
    g: 0.50,
    tl: 0.68,
    espesor_mm: 36,
    nota: 'Estándar Casa Pasiva certificada. Costo alto pero imbatible energéticamente.',
  },
]

// ═══ INTERCALARIOS (separadores del vidriado) ───────────────────────────────
// Ψ_intercalario (W/m·K) — la pérdida por la unión vidrio-marco.
export const INTERCALARIOS = [
  {
    id: 'aluminio',
    nombre: 'Aluminio (estándar)',
    psi: 0.080,
    nota: 'El más usado pero más conductor. Causa condensación en bordes.',
  },
  {
    id: 'acero',
    nombre: 'Acero galvanizado',
    psi: 0.060,
    nota: 'Mejor que Al pero peor que warm-edge.',
  },
  {
    id: 'warm_edge_basico',
    nombre: 'Warm-edge básico (TGI, Ködimat)',
    psi: 0.045,
    nota: 'Borde caliente. Recomendado en zonas C-E.',
  },
  {
    id: 'warm_edge_premium',
    nombre: 'Warm-edge premium (Swisspacer Ultimate)',
    psi: 0.030,
    nota: 'Mejor opción del mercado. Requerido en Casa Pasiva.',
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────
export function obtenerMarco(id)        { return MARCOS.find(m => m.id === id)        || null }
export function obtenerVidrio(id)       { return VIDRIOS.find(v => v.id === id)       || null }
export function obtenerIntercalario(id) { return INTERCALARIOS.find(i => i.id === id) || null }

// Calidad sugerida según zona DS N°15
export const SUGERENCIAS_POR_ZONA = {
  'A': { marco: 'al_rpt_12mm', vidrio: 'dvh_4_6_4',        intercalario: 'aluminio' },
  'B': { marco: 'al_rpt_12mm', vidrio: 'dvh_4_12_4',       intercalario: 'aluminio' },
  'C': { marco: 'al_rpt_24mm', vidrio: 'dvh_4_12_4_argon', intercalario: 'warm_edge_basico' },
  'D': { marco: 'al_rpt_24mm', vidrio: 'dvh_low_e_argon',  intercalario: 'warm_edge_basico' },
  'E': { marco: 'pvc_3camaras',vidrio: 'dvh_low_e_argon',  intercalario: 'warm_edge_basico' },
  'F': { marco: 'pvc_5camaras',vidrio: 'dvh_low_e_argon',  intercalario: 'warm_edge_premium' },
  'G': { marco: 'pvc_5camaras',vidrio: 'triple_low_e_argon', intercalario: 'warm_edge_premium' },
  'H': { marco: 'pvc_7camaras',vidrio: 'triple_low_e_argon', intercalario: 'warm_edge_premium' },
}
