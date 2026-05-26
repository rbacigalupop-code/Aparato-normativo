// ─────────────────────────────────────────────────────────────────────────────
// puentes_termicos.js — Catálogo de puentes térmicos lineales (Ψ).
//
// Un puente térmico es una línea/zona de la envolvente donde el flujo de calor
// es mayor que el del resto. Ψ (psi) es la transmitancia lineal en W/m·K.
//
// Pérdidas adicionales por PT = Σ (Ψ · L · HDD18 · 24 / 1000) [kWh/año]
//
// En Chile suelen representar 15–30% de las pérdidas totales de envolvente,
// pero rara vez se calculan en proyectos residenciales típicos.
//
// Valores Ψ basados en:
//   · ISO 14683:2017 (Default values)
//   · Catálogo CITEC UBB (Centro Investigación Tecnología Construcción)
//   · DA-DB-HE/3 (Catálogo elementos constructivos, España, referencial)
//   · ASHRAE Handbook
//
// Cada PT tiene rangos {malo, tipico, mejor} para reflejar la calidad de
// resolución constructiva.
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORIAS_PT = [
  { id: 'piso',       label: 'Encuentros con piso',           icon: '⬇' },
  { id: 'cubierta',   label: 'Encuentros con cubierta',       icon: '⬆' },
  { id: 'esquinas',   label: 'Esquinas verticales',           icon: '↳' },
  { id: 'aberturas',  label: 'Aberturas (vanos)',             icon: '⊟' },
  { id: 'intermedios',label: 'Intermedios (tabiques, losas)', icon: '═' },
  { id: 'voladizos',  label: 'Voladizos y balcones',          icon: '◰' },
]

// ─── PUENTES TÉRMICOS CATALOGADOS ───────────────────────────────────────────
// id, categoria, nombre, descripcion, psi: { malo, tipico, mejor } [W/m·K]
export const PUENTES_TERMICOS = [

  // ═══ PISO ═══════════════════════════════════════════════════════════════════
  {
    id: 'piso_radier_terreno',
    categoria: 'piso',
    nombre: 'Muro–Radier sobre terreno',
    descripcion: 'Encuentro entre muro exterior y losa de hormigón sobre terreno.',
    psi: { malo: 0.65, tipico: 0.40, mejor: 0.15 },
    nota: 'El mejor caso requiere aislar perimetralmente el radier (50mm EPS) o usar zapata con corte térmico.',
  },
  {
    id: 'piso_flotante',
    categoria: 'piso',
    nombre: 'Muro–Piso flotante (sobre cámara)',
    descripcion: 'Encuentro muro con piso ventilado o sobre cámara.',
    psi: { malo: 0.50, tipico: 0.30, mejor: 0.10 },
    nota: 'Cámara ventilada con aislante en cara inferior del piso.',
  },
  {
    id: 'piso_no_calef',
    categoria: 'piso',
    nombre: 'Muro–Piso sobre espacio no calefaccionado',
    descripcion: 'Encuentro con piso sobre subterráneo, estacionamiento o bodega.',
    psi: { malo: 0.40, tipico: 0.22, mejor: 0.08 },
    nota: 'Requiere aislamiento bajo losa.',
  },

  // ═══ CUBIERTA ═══════════════════════════════════════════════════════════════
  {
    id: 'cub_muro_techo',
    categoria: 'cubierta',
    nombre: 'Muro–Techo (encuentro horizontal)',
    descripcion: 'Encuentro entre muro exterior y cielo/techo.',
    psi: { malo: 0.40, tipico: 0.22, mejor: 0.08 },
    nota: 'Aislar continuo entre muro y techo, evitar interrupciones por viga perimetral.',
  },
  {
    id: 'cub_alero',
    categoria: 'cubierta',
    nombre: 'Muro–Alero',
    descripcion: 'Encuentro de muro con alero saliente.',
    psi: { malo: 0.55, tipico: 0.30, mejor: 0.12 },
    nota: 'Aleros largos crean más PT. Mejor: aislar el alero o usar soportes sin contacto pasante.',
  },
  {
    id: 'cub_cumbrera',
    categoria: 'cubierta',
    nombre: 'Cumbrera (encuentro de aguas)',
    descripcion: 'Línea superior de techos a dos aguas.',
    psi: { malo: 0.30, tipico: 0.15, mejor: 0.05 },
    nota: 'Requiere continuidad del aislante en la cumbrera.',
  },
  {
    id: 'cub_lima_hoya',
    categoria: 'cubierta',
    nombre: 'Lima hoya / lima tesa',
    descripcion: 'Encuentro de planos de cubierta en valle o cresta.',
    psi: { malo: 0.25, tipico: 0.12, mejor: 0.05 },
    nota: 'Crítico en zonas con nieve por acumulación de humedad.',
  },

  // ═══ ESQUINAS VERTICALES ═══════════════════════════════════════════════════
  {
    id: 'esq_vert_ext',
    categoria: 'esquinas',
    nombre: 'Esquina vertical exterior',
    descripcion: 'Encuentro saliente entre dos muros exteriores.',
    psi: { malo: 0.20, tipico: 0.10, mejor: 0.04 },
    nota: 'Aislante continuo por exterior reduce significativamente.',
  },
  {
    id: 'esq_vert_int',
    categoria: 'esquinas',
    nombre: 'Esquina vertical interior',
    descripcion: 'Encuentro entrante (rincón) entre dos muros exteriores.',
    psi: { malo: 0.15, tipico: 0.08, mejor: 0.03 },
    nota: 'Menor PT que esquina saliente — pero atención a condensación interior.',
  },

  // ═══ ABERTURAS ═════════════════════════════════════════════════════════════
  {
    id: 'ab_jamba_sin_rpt',
    categoria: 'aberturas',
    nombre: 'Jamba (lateral) — marco sin RPT',
    descripcion: 'Encuentro lateral del marco con el muro, marco metálico sin rotura de puente térmico.',
    psi: { malo: 0.50, tipico: 0.30, mejor: 0.15 },
    nota: 'Aluminio sin RPT pierde mucho. Cambiar a Al-RPT o PVC reduce a la mitad.',
  },
  {
    id: 'ab_jamba_con_rpt',
    categoria: 'aberturas',
    nombre: 'Jamba (lateral) — marco con RPT / PVC',
    descripcion: 'Encuentro lateral del marco con el muro, marco con rotura de puente térmico o PVC/madera.',
    psi: { malo: 0.25, tipico: 0.10, mejor: 0.04 },
    nota: 'Sellar perimetralmente con cinta TESCON o equivalente.',
  },
  {
    id: 'ab_alfeizar',
    categoria: 'aberturas',
    nombre: 'Alféizar (parte inferior de ventana)',
    descripcion: 'Encuentro inferior de la ventana con el muro.',
    psi: { malo: 0.40, tipico: 0.20, mejor: 0.08 },
    nota: 'Requiere alféizar con corte térmico. Crítico para condensación.',
  },
  {
    id: 'ab_dintel',
    categoria: 'aberturas',
    nombre: 'Dintel (parte superior de ventana)',
    descripcion: 'Encuentro superior del marco con el muro/dintel.',
    psi: { malo: 0.45, tipico: 0.22, mejor: 0.10 },
    nota: 'Dinteles de hormigón sin aislar son fuente principal de PT.',
  },

  // ═══ INTERMEDIOS ═══════════════════════════════════════════════════════════
  {
    id: 'int_tabique',
    categoria: 'intermedios',
    nombre: 'Tabique interior atravesando envolvente',
    descripcion: 'Tabique interior que se conecta al muro exterior.',
    psi: { malo: 0.20, tipico: 0.10, mejor: 0.03 },
    nota: 'Si el tabique se "rompe" antes del exterior, el PT se elimina.',
  },
  {
    id: 'int_losa_entrepiso',
    categoria: 'intermedios',
    nombre: 'Losa de entrepiso encontrando muro exterior',
    descripcion: 'Cabeza de losa visible o aislada en muro perimetral.',
    psi: { malo: 0.55, tipico: 0.30, mejor: 0.12 },
    nota: 'Aislante por exterior debe cubrir continuamente la cabeza de losa.',
  },

  // ═══ VOLADIZOS ═════════════════════════════════════════════════════════════
  {
    id: 'vol_balcon_pasante',
    categoria: 'voladizos',
    nombre: 'Balcón en losa pasante (crítico)',
    descripcion: 'Balcón en voladizo donde la losa de hormigón sale al exterior sin corte.',
    psi: { malo: 0.95, tipico: 0.65, mejor: 0.20 },
    nota: '⚠ Es uno de los PT más graves. Solución: balcones independientes con anclaje térmico (Schöck Isokorb) o reemplazo por estructura metálica liviana ligada exterior.',
  },
  {
    id: 'vol_alero_losa',
    categoria: 'voladizos',
    nombre: 'Alero de losa (sobre ventana)',
    descripcion: 'Losa en voladizo formando alero exterior.',
    psi: { malo: 0.70, tipico: 0.45, mejor: 0.18 },
    nota: 'Similar al balcón. Requerir continuidad del aislante por encima y debajo del voladizo.',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function obtenerPT(id) {
  return PUENTES_TERMICOS.find(p => p.id === id) || null
}

export function ptPorCategoria(catId) {
  return PUENTES_TERMICOS.filter(p => p.categoria === catId)
}

// Longitudes típicas por elemento de envolvente (m) para estimación inicial
// Útil cuando el usuario no tiene geometría detallada.
export const LONGITUDES_TIPICAS = {
  vivienda_pequena_70m2: {
    piso_radier_terreno:  30, // perímetro casa
    cub_muro_techo:        30,
    esq_vert_ext:           4 * 2.5,  // 4 esquinas × 2.5m altura
    esq_vert_int:           0,
    ab_jamba_con_rpt:       6 * 2 * 1.2,  // 6 ventanas × 2 jambas × 1.2m
    ab_alfeizar:            6 * 1.5,
    ab_dintel:              6 * 1.5,
    int_losa_entrepiso:     0,
    vol_balcon_pasante:     0,
  },
  vivienda_media_120m2: {
    piso_radier_terreno:  44,
    cub_muro_techo:        44,
    esq_vert_ext:           4 * 2.5,
    esq_vert_int:           4 * 2.5,
    ab_jamba_con_rpt:      10 * 2 * 1.2,
    ab_alfeizar:           10 * 1.5,
    ab_dintel:             10 * 1.5,
    int_losa_entrepiso:     0,
    vol_balcon_pasante:     0,
  },
  vivienda_grande_180m2: {
    piso_radier_terreno:  56,
    cub_muro_techo:        56,
    esq_vert_ext:           6 * 2.5,
    esq_vert_int:           4 * 2.5,
    ab_jamba_con_rpt:      14 * 2 * 1.4,
    ab_alfeizar:           14 * 1.8,
    ab_dintel:             14 * 1.8,
    int_losa_entrepiso:     0,
    vol_balcon_pasante:     0,
  },
  edificio_depto: {
    piso_radier_terreno:    0, // no aplica (sobre losa)
    cub_muro_techo:        24,
    esq_vert_ext:           4 * 2.5,
    esq_vert_int:           2 * 2.5,
    ab_jamba_con_rpt:       6 * 2 * 1.2,
    ab_alfeizar:            6 * 1.5,
    ab_dintel:              6 * 1.5,
    int_losa_entrepiso:    24, // perímetro hacia muro exterior
    vol_balcon_pasante:     3, // balcón típico
  },
}

export const TIPOLOGIAS_LABELS = {
  vivienda_pequena_70m2: 'Vivienda pequeña (~70 m²)',
  vivienda_media_120m2:  'Vivienda media (~120 m²)',
  vivienda_grande_180m2: 'Vivienda grande (~180 m²)',
  edificio_depto:        'Departamento (~80 m²)',
}
