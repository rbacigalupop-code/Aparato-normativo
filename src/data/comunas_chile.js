// ─────────────────────────────────────────────────────────────────────────────
// comunas_chile.js — Listado completo de las ~346 comunas de Chile.
//
// Cada comuna tiene:
//   · region:    código de la región (XV, I, II, ..., XII)
//   · zona_ds15: zona térmica DS N°15 MINVU 2024 (A-H)
//
// Las zonas térmicas oficiales DS N°15 MINVU:
//   A — Norte litoral             (T° suaves, bajo HDD18)
//   B — Norte desértico interior  (alto contraste día/noche)
//   C — Centro litoral            (mediterráneo costero)
//   D — Centro interior           (mediterráneo continental, RM)
//   E — Sur litoral               (Concepción, Temuco, Valdivia)
//   F — Sur interior              (cordillera sur, Pucón cordillera)
//   G — Sur extremo               (Puerto Montt, Chiloé, Aysén)
//   H — Sur austral               (Magallanes, Punta Arenas)
//
// IMPORTANTE: la asignación se basa en DS N°47/2008 modificado por DS N°15/2024
// y en geografía/clima local. Algunas comunas grandes tienen subzonas — usamos
// la zona representativa. El usuario puede sobrescribir manualmente.
// ─────────────────────────────────────────────────────────────────────────────

export const COMUNAS_CHILE = {
  // ═══ XV · Arica y Parinacota (4) ════════════════════════════════════════════
  arica:                       { region: 'XV',  zona_ds15: 'A' },
  camarones:                   { region: 'XV',  zona_ds15: 'A' },
  putre:                       { region: 'XV',  zona_ds15: 'E' },  // altiplano (3500m)
  general_lagos:               { region: 'XV',  zona_ds15: 'E' },  // altiplano

  // ═══ I · Tarapacá (7) ═══════════════════════════════════════════════════════
  iquique:                     { region: 'I',   zona_ds15: 'A' },
  alto_hospicio:               { region: 'I',   zona_ds15: 'A' },
  pozo_almonte:                { region: 'I',   zona_ds15: 'B' },
  camina:                      { region: 'I',   zona_ds15: 'E' },  // precordillera
  colchane:                    { region: 'I',   zona_ds15: 'E' },  // altiplano
  huara:                       { region: 'I',   zona_ds15: 'B' },
  pica:                        { region: 'I',   zona_ds15: 'B' },

  // ═══ II · Antofagasta (9) ═══════════════════════════════════════════════════
  antofagasta:                 { region: 'II',  zona_ds15: 'B' },
  mejillones:                  { region: 'II',  zona_ds15: 'B' },
  sierra_gorda:                { region: 'II',  zona_ds15: 'B' },
  taltal:                      { region: 'II',  zona_ds15: 'B' },
  calama:                      { region: 'II',  zona_ds15: 'E' },  // desierto altura
  ollague:                     { region: 'II',  zona_ds15: 'F' },  // altiplano frío
  san_pedro_atacama:           { region: 'II',  zona_ds15: 'E' },
  maria_elena:                 { region: 'II',  zona_ds15: 'B' },
  tocopilla:                   { region: 'II',  zona_ds15: 'B' },

  // ═══ III · Atacama (9) ══════════════════════════════════════════════════════
  copiapo:                     { region: 'III', zona_ds15: 'B' },
  caldera:                     { region: 'III', zona_ds15: 'B' },
  tierra_amarilla:             { region: 'III', zona_ds15: 'B' },
  chanaral:                    { region: 'III', zona_ds15: 'B' },
  diego_almagro:               { region: 'III', zona_ds15: 'B' },
  vallenar:                    { region: 'III', zona_ds15: 'B' },
  alto_del_carmen:             { region: 'III', zona_ds15: 'B' },
  freirina:                    { region: 'III', zona_ds15: 'B' },
  huasco:                      { region: 'III', zona_ds15: 'B' },

  // ═══ IV · Coquimbo (15) ═════════════════════════════════════════════════════
  la_serena:                   { region: 'IV',  zona_ds15: 'C' },
  coquimbo:                    { region: 'IV',  zona_ds15: 'C' },
  andacollo:                   { region: 'IV',  zona_ds15: 'D' },
  la_higuera:                  { region: 'IV',  zona_ds15: 'C' },
  paiguano:                    { region: 'IV',  zona_ds15: 'D' },
  vicuna:                      { region: 'IV',  zona_ds15: 'D' },
  illapel:                     { region: 'IV',  zona_ds15: 'D' },
  canela:                      { region: 'IV',  zona_ds15: 'C' },
  los_vilos:                   { region: 'IV',  zona_ds15: 'C' },
  salamanca:                   { region: 'IV',  zona_ds15: 'D' },
  ovalle:                      { region: 'IV',  zona_ds15: 'C' },
  combarbala:                  { region: 'IV',  zona_ds15: 'D' },
  monte_patria:                { region: 'IV',  zona_ds15: 'D' },
  punitaqui:                   { region: 'IV',  zona_ds15: 'D' },
  rio_hurtado:                 { region: 'IV',  zona_ds15: 'D' },

  // ═══ V · Valparaíso (38) ════════════════════════════════════════════════════
  valparaiso:                  { region: 'V',   zona_ds15: 'C' },
  casablanca:                  { region: 'V',   zona_ds15: 'D' },
  concon:                      { region: 'V',   zona_ds15: 'C' },
  juan_fernandez:              { region: 'V',   zona_ds15: 'C' },
  puchuncavi:                  { region: 'V',   zona_ds15: 'C' },
  quintero:                    { region: 'V',   zona_ds15: 'C' },
  vina_del_mar:                { region: 'V',   zona_ds15: 'C' },
  isla_de_pascua:              { region: 'V',   zona_ds15: 'A' },
  los_andes:                   { region: 'V',   zona_ds15: 'D' },
  calle_larga:                 { region: 'V',   zona_ds15: 'D' },
  rinconada:                   { region: 'V',   zona_ds15: 'D' },
  san_esteban:                 { region: 'V',   zona_ds15: 'D' },
  la_ligua:                    { region: 'V',   zona_ds15: 'C' },
  cabildo:                     { region: 'V',   zona_ds15: 'D' },
  papudo:                      { region: 'V',   zona_ds15: 'C' },
  petorca:                     { region: 'V',   zona_ds15: 'D' },
  zapallar:                    { region: 'V',   zona_ds15: 'C' },
  quillota:                    { region: 'V',   zona_ds15: 'D' },
  calera:                      { region: 'V',   zona_ds15: 'D' },
  hijuelas:                    { region: 'V',   zona_ds15: 'D' },
  la_cruz:                     { region: 'V',   zona_ds15: 'D' },
  nogales:                     { region: 'V',   zona_ds15: 'D' },
  san_antonio:                 { region: 'V',   zona_ds15: 'C' },
  algarrobo:                   { region: 'V',   zona_ds15: 'C' },
  cartagena:                   { region: 'V',   zona_ds15: 'C' },
  el_quisco:                   { region: 'V',   zona_ds15: 'C' },
  el_tabo:                     { region: 'V',   zona_ds15: 'C' },
  santo_domingo:               { region: 'V',   zona_ds15: 'C' },
  san_felipe:                  { region: 'V',   zona_ds15: 'D' },
  catemu:                      { region: 'V',   zona_ds15: 'D' },
  llaillay:                    { region: 'V',   zona_ds15: 'D' },
  panquehue:                   { region: 'V',   zona_ds15: 'D' },
  putaendo:                    { region: 'V',   zona_ds15: 'D' },
  santa_maria:                 { region: 'V',   zona_ds15: 'D' },
  quilpue:                     { region: 'V',   zona_ds15: 'D' },
  limache:                     { region: 'V',   zona_ds15: 'D' },
  olmue:                       { region: 'V',   zona_ds15: 'D' },
  villa_alemana:               { region: 'V',   zona_ds15: 'D' },

  // ═══ RM · Metropolitana (52) ════════════════════════════════════════════════
  santiago:                    { region: 'RM',  zona_ds15: 'D' },
  cerrillos:                   { region: 'RM',  zona_ds15: 'D' },
  cerro_navia:                 { region: 'RM',  zona_ds15: 'D' },
  conchali:                    { region: 'RM',  zona_ds15: 'D' },
  el_bosque:                   { region: 'RM',  zona_ds15: 'D' },
  estacion_central:            { region: 'RM',  zona_ds15: 'D' },
  huechuraba:                  { region: 'RM',  zona_ds15: 'D' },
  independencia:               { region: 'RM',  zona_ds15: 'D' },
  la_cisterna:                 { region: 'RM',  zona_ds15: 'D' },
  la_florida:                  { region: 'RM',  zona_ds15: 'D' },
  la_granja:                   { region: 'RM',  zona_ds15: 'D' },
  la_pintana:                  { region: 'RM',  zona_ds15: 'D' },
  la_reina:                    { region: 'RM',  zona_ds15: 'D' },
  las_condes:                  { region: 'RM',  zona_ds15: 'D' },
  lo_barnechea:                { region: 'RM',  zona_ds15: 'D' },
  lo_espejo:                   { region: 'RM',  zona_ds15: 'D' },
  lo_prado:                    { region: 'RM',  zona_ds15: 'D' },
  macul:                       { region: 'RM',  zona_ds15: 'D' },
  maipu:                       { region: 'RM',  zona_ds15: 'D' },
  nunoa:                       { region: 'RM',  zona_ds15: 'D' },
  pedro_aguirre_cerda:         { region: 'RM',  zona_ds15: 'D' },
  penalolen:                   { region: 'RM',  zona_ds15: 'D' },
  providencia:                 { region: 'RM',  zona_ds15: 'D' },
  pudahuel:                    { region: 'RM',  zona_ds15: 'D' },
  quilicura:                   { region: 'RM',  zona_ds15: 'D' },
  quinta_normal:               { region: 'RM',  zona_ds15: 'D' },
  recoleta:                    { region: 'RM',  zona_ds15: 'D' },
  renca:                       { region: 'RM',  zona_ds15: 'D' },
  san_joaquin:                 { region: 'RM',  zona_ds15: 'D' },
  san_miguel:                  { region: 'RM',  zona_ds15: 'D' },
  san_ramon:                   { region: 'RM',  zona_ds15: 'D' },
  vitacura:                    { region: 'RM',  zona_ds15: 'D' },
  puente_alto:                 { region: 'RM',  zona_ds15: 'D' },
  pirque:                      { region: 'RM',  zona_ds15: 'D' },
  san_jose_de_maipo:           { region: 'RM',  zona_ds15: 'E' },  // cordillera
  colina:                      { region: 'RM',  zona_ds15: 'D' },
  lampa:                       { region: 'RM',  zona_ds15: 'D' },
  til_til:                     { region: 'RM',  zona_ds15: 'D' },
  san_bernardo:                { region: 'RM',  zona_ds15: 'D' },
  buin:                        { region: 'RM',  zona_ds15: 'D' },
  calera_de_tango:             { region: 'RM',  zona_ds15: 'D' },
  paine:                       { region: 'RM',  zona_ds15: 'D' },
  melipilla:                   { region: 'RM',  zona_ds15: 'D' },
  alhue:                       { region: 'RM',  zona_ds15: 'D' },
  curacavi:                    { region: 'RM',  zona_ds15: 'D' },
  maria_pinto:                 { region: 'RM',  zona_ds15: 'D' },
  san_pedro_rm:                { region: 'RM',  zona_ds15: 'D' },
  talagante:                   { region: 'RM',  zona_ds15: 'D' },
  el_monte:                    { region: 'RM',  zona_ds15: 'D' },
  isla_de_maipo:               { region: 'RM',  zona_ds15: 'D' },
  padre_hurtado:               { region: 'RM',  zona_ds15: 'D' },
  penaflor:                    { region: 'RM',  zona_ds15: 'D' },

  // ═══ VI · O'Higgins (33) ════════════════════════════════════════════════════
  rancagua:                    { region: 'VI',  zona_ds15: 'D' },
  codegua:                     { region: 'VI',  zona_ds15: 'D' },
  coinco:                      { region: 'VI',  zona_ds15: 'D' },
  coltauco:                    { region: 'VI',  zona_ds15: 'D' },
  donihue:                     { region: 'VI',  zona_ds15: 'D' },
  graneros:                    { region: 'VI',  zona_ds15: 'D' },
  las_cabras:                  { region: 'VI',  zona_ds15: 'D' },
  machali:                     { region: 'VI',  zona_ds15: 'E' },  // precordillera
  malloa:                      { region: 'VI',  zona_ds15: 'D' },
  mostazal:                    { region: 'VI',  zona_ds15: 'D' },
  olivar:                      { region: 'VI',  zona_ds15: 'D' },
  peumo:                       { region: 'VI',  zona_ds15: 'D' },
  pichidegua:                  { region: 'VI',  zona_ds15: 'D' },
  quinta_de_tilcoco:           { region: 'VI',  zona_ds15: 'D' },
  rengo:                       { region: 'VI',  zona_ds15: 'D' },
  requinoa:                    { region: 'VI',  zona_ds15: 'D' },
  san_vicente:                 { region: 'VI',  zona_ds15: 'D' },
  pichilemu:                   { region: 'VI',  zona_ds15: 'C' },
  la_estrella:                 { region: 'VI',  zona_ds15: 'C' },
  litueche:                    { region: 'VI',  zona_ds15: 'C' },
  marchihue:                   { region: 'VI',  zona_ds15: 'C' },
  navidad:                     { region: 'VI',  zona_ds15: 'C' },
  paredones:                   { region: 'VI',  zona_ds15: 'C' },
  san_fernando:                { region: 'VI',  zona_ds15: 'D' },
  chepica:                     { region: 'VI',  zona_ds15: 'D' },
  chimbarongo:                 { region: 'VI',  zona_ds15: 'D' },
  lolol:                       { region: 'VI',  zona_ds15: 'D' },
  nancagua:                    { region: 'VI',  zona_ds15: 'D' },
  palmilla:                    { region: 'VI',  zona_ds15: 'D' },
  peralillo:                   { region: 'VI',  zona_ds15: 'D' },
  placilla:                    { region: 'VI',  zona_ds15: 'D' },
  pumanque:                    { region: 'VI',  zona_ds15: 'D' },
  santa_cruz:                  { region: 'VI',  zona_ds15: 'D' },

  // ═══ VII · Maule (30) ═══════════════════════════════════════════════════════
  talca:                       { region: 'VII', zona_ds15: 'D' },
  constitucion:                { region: 'VII', zona_ds15: 'C' },
  curepto:                     { region: 'VII', zona_ds15: 'C' },
  empedrado:                   { region: 'VII', zona_ds15: 'C' },
  maule:                       { region: 'VII', zona_ds15: 'D' },
  pelarco:                     { region: 'VII', zona_ds15: 'D' },
  pencahue:                    { region: 'VII', zona_ds15: 'D' },
  rio_claro:                   { region: 'VII', zona_ds15: 'D' },
  san_clemente:                { region: 'VII', zona_ds15: 'D' },
  san_rafael:                  { region: 'VII', zona_ds15: 'D' },
  cauquenes:                   { region: 'VII', zona_ds15: 'D' },
  chanco:                      { region: 'VII', zona_ds15: 'C' },
  pelluhue:                    { region: 'VII', zona_ds15: 'C' },
  curico:                      { region: 'VII', zona_ds15: 'D' },
  hualane:                     { region: 'VII', zona_ds15: 'D' },
  licanten:                    { region: 'VII', zona_ds15: 'C' },
  molina:                      { region: 'VII', zona_ds15: 'D' },
  rauco:                       { region: 'VII', zona_ds15: 'D' },
  romeral:                     { region: 'VII', zona_ds15: 'D' },
  sagrada_familia:             { region: 'VII', zona_ds15: 'D' },
  teno:                        { region: 'VII', zona_ds15: 'D' },
  vichuquen:                   { region: 'VII', zona_ds15: 'C' },
  linares:                     { region: 'VII', zona_ds15: 'D' },
  colbun:                      { region: 'VII', zona_ds15: 'E' },  // precordillera
  longavi:                     { region: 'VII', zona_ds15: 'D' },
  parral:                      { region: 'VII', zona_ds15: 'D' },
  retiro:                      { region: 'VII', zona_ds15: 'D' },
  san_javier:                  { region: 'VII', zona_ds15: 'D' },
  villa_alegre:                { region: 'VII', zona_ds15: 'D' },
  yerbas_buenas:               { region: 'VII', zona_ds15: 'D' },

  // ═══ XVI · Ñuble (21) ═══════════════════════════════════════════════════════
  chillan:                     { region: 'XVI', zona_ds15: 'D' },
  bulnes:                      { region: 'XVI', zona_ds15: 'D' },
  cobquecura:                  { region: 'XVI', zona_ds15: 'C' },
  coelemu:                     { region: 'XVI', zona_ds15: 'D' },
  coihueco:                    { region: 'XVI', zona_ds15: 'D' },
  chillan_viejo:               { region: 'XVI', zona_ds15: 'D' },
  el_carmen:                   { region: 'XVI', zona_ds15: 'D' },
  ninhue:                      { region: 'XVI', zona_ds15: 'D' },
  niquen:                      { region: 'XVI', zona_ds15: 'D' },
  pemuco:                      { region: 'XVI', zona_ds15: 'D' },
  pinto:                       { region: 'XVI', zona_ds15: 'E' },  // termas chillán
  portezuelo:                  { region: 'XVI', zona_ds15: 'D' },
  quillon:                     { region: 'XVI', zona_ds15: 'D' },
  quirihue:                    { region: 'XVI', zona_ds15: 'D' },
  ranquil:                     { region: 'XVI', zona_ds15: 'D' },
  san_carlos:                  { region: 'XVI', zona_ds15: 'D' },
  san_fabian:                  { region: 'XVI', zona_ds15: 'E' },  // cordillera
  san_ignacio:                 { region: 'XVI', zona_ds15: 'D' },
  san_nicolas:                 { region: 'XVI', zona_ds15: 'D' },
  treguaco:                    { region: 'XVI', zona_ds15: 'D' },
  yungay:                      { region: 'XVI', zona_ds15: 'E' },

  // ═══ VIII · Biobío (33) ═════════════════════════════════════════════════════
  concepcion:                  { region: 'VIII', zona_ds15: 'E' },
  coronel:                     { region: 'VIII', zona_ds15: 'E' },
  chiguayante:                 { region: 'VIII', zona_ds15: 'E' },
  florida:                     { region: 'VIII', zona_ds15: 'E' },
  hualpen:                     { region: 'VIII', zona_ds15: 'E' },
  hualqui:                     { region: 'VIII', zona_ds15: 'E' },
  lota:                        { region: 'VIII', zona_ds15: 'E' },
  penco:                       { region: 'VIII', zona_ds15: 'E' },
  san_pedro_de_la_paz:         { region: 'VIII', zona_ds15: 'E' },
  santa_juana:                 { region: 'VIII', zona_ds15: 'E' },
  talcahuano:                  { region: 'VIII', zona_ds15: 'E' },
  tome:                        { region: 'VIII', zona_ds15: 'E' },
  lebu:                        { region: 'VIII', zona_ds15: 'E' },
  arauco:                      { region: 'VIII', zona_ds15: 'E' },
  canete:                      { region: 'VIII', zona_ds15: 'E' },
  contulmo:                    { region: 'VIII', zona_ds15: 'E' },
  curanilahue:                 { region: 'VIII', zona_ds15: 'E' },
  los_alamos:                  { region: 'VIII', zona_ds15: 'E' },
  tirua:                       { region: 'VIII', zona_ds15: 'E' },
  los_angeles:                 { region: 'VIII', zona_ds15: 'E' },
  antuco:                      { region: 'VIII', zona_ds15: 'F' },  // cordillera
  cabrero:                     { region: 'VIII', zona_ds15: 'E' },
  laja:                        { region: 'VIII', zona_ds15: 'E' },
  mulchen:                     { region: 'VIII', zona_ds15: 'E' },
  nacimiento:                  { region: 'VIII', zona_ds15: 'E' },
  negrete:                     { region: 'VIII', zona_ds15: 'E' },
  quilaco:                     { region: 'VIII', zona_ds15: 'F' },
  quilleco:                    { region: 'VIII', zona_ds15: 'E' },
  san_rosendo:                 { region: 'VIII', zona_ds15: 'E' },
  santa_barbara:               { region: 'VIII', zona_ds15: 'F' },
  tucapel:                     { region: 'VIII', zona_ds15: 'F' },
  yumbel:                      { region: 'VIII', zona_ds15: 'E' },
  alto_biobio:                 { region: 'VIII', zona_ds15: 'F' },

  // ═══ IX · Araucanía (32) ════════════════════════════════════════════════════
  temuco:                      { region: 'IX',  zona_ds15: 'E' },
  carahue:                     { region: 'IX',  zona_ds15: 'E' },
  cunco:                       { region: 'IX',  zona_ds15: 'F' },
  curarrehue:                  { region: 'IX',  zona_ds15: 'F' },
  freire:                      { region: 'IX',  zona_ds15: 'E' },
  galvarino:                   { region: 'IX',  zona_ds15: 'E' },
  gorbea:                      { region: 'IX',  zona_ds15: 'E' },
  lautaro:                     { region: 'IX',  zona_ds15: 'E' },
  loncoche:                    { region: 'IX',  zona_ds15: 'E' },
  melipeuco:                   { region: 'IX',  zona_ds15: 'F' },
  nueva_imperial:              { region: 'IX',  zona_ds15: 'E' },
  padre_las_casas:             { region: 'IX',  zona_ds15: 'E' },
  perquenco:                   { region: 'IX',  zona_ds15: 'E' },
  pitrufquen:                  { region: 'IX',  zona_ds15: 'E' },
  pucon:                       { region: 'IX',  zona_ds15: 'F' },
  saavedra:                    { region: 'IX',  zona_ds15: 'E' },
  teodoro_schmidt:             { region: 'IX',  zona_ds15: 'E' },
  tolten:                      { region: 'IX',  zona_ds15: 'E' },
  vilcun:                      { region: 'IX',  zona_ds15: 'E' },
  villarrica:                  { region: 'IX',  zona_ds15: 'F' },
  cholchol:                    { region: 'IX',  zona_ds15: 'E' },
  angol:                       { region: 'IX',  zona_ds15: 'E' },
  collipulli:                  { region: 'IX',  zona_ds15: 'E' },
  curacautin:                  { region: 'IX',  zona_ds15: 'F' },
  ercilla:                     { region: 'IX',  zona_ds15: 'E' },
  lonquimay:                   { region: 'IX',  zona_ds15: 'F' },
  los_sauces:                  { region: 'IX',  zona_ds15: 'E' },
  lumaco:                      { region: 'IX',  zona_ds15: 'E' },
  puren:                       { region: 'IX',  zona_ds15: 'E' },
  renaico:                     { region: 'IX',  zona_ds15: 'E' },
  traiguen:                    { region: 'IX',  zona_ds15: 'E' },
  victoria:                    { region: 'IX',  zona_ds15: 'E' },

  // ═══ XIV · Los Ríos (12) ════════════════════════════════════════════════════
  valdivia:                    { region: 'XIV', zona_ds15: 'E' },
  corral:                      { region: 'XIV', zona_ds15: 'E' },
  lanco:                       { region: 'XIV', zona_ds15: 'E' },
  los_lagos:                   { region: 'XIV', zona_ds15: 'E' },
  mafil:                       { region: 'XIV', zona_ds15: 'E' },
  mariquina:                   { region: 'XIV', zona_ds15: 'E' },
  paillaco:                    { region: 'XIV', zona_ds15: 'E' },
  panguipulli:                 { region: 'XIV', zona_ds15: 'F' },
  la_union:                    { region: 'XIV', zona_ds15: 'F' },
  futrono:                     { region: 'XIV', zona_ds15: 'F' },
  lago_ranco:                  { region: 'XIV', zona_ds15: 'F' },
  rio_bueno:                   { region: 'XIV', zona_ds15: 'F' },

  // ═══ X · Los Lagos (30) ═════════════════════════════════════════════════════
  puerto_montt:                { region: 'X',   zona_ds15: 'F' },
  calbuco:                     { region: 'X',   zona_ds15: 'F' },
  cochamo:                     { region: 'X',   zona_ds15: 'F' },
  fresia:                      { region: 'X',   zona_ds15: 'F' },
  frutillar:                   { region: 'X',   zona_ds15: 'F' },
  los_muermos:                 { region: 'X',   zona_ds15: 'F' },
  llanquihue:                  { region: 'X',   zona_ds15: 'F' },
  maullin:                     { region: 'X',   zona_ds15: 'F' },
  puerto_varas:                { region: 'X',   zona_ds15: 'F' },
  castro:                      { region: 'X',   zona_ds15: 'F' },
  ancud:                       { region: 'X',   zona_ds15: 'F' },
  chonchi:                     { region: 'X',   zona_ds15: 'F' },
  curaco_de_velez:             { region: 'X',   zona_ds15: 'F' },
  dalcahue:                    { region: 'X',   zona_ds15: 'F' },
  puqueldon:                   { region: 'X',   zona_ds15: 'F' },
  queilen:                     { region: 'X',   zona_ds15: 'F' },
  quellon:                     { region: 'X',   zona_ds15: 'F' },
  quemchi:                     { region: 'X',   zona_ds15: 'F' },
  quinchao:                    { region: 'X',   zona_ds15: 'F' },
  osorno:                      { region: 'X',   zona_ds15: 'F' },
  puerto_octay:                { region: 'X',   zona_ds15: 'F' },
  purranque:                   { region: 'X',   zona_ds15: 'F' },
  puyehue:                     { region: 'X',   zona_ds15: 'F' },
  rio_negro:                   { region: 'X',   zona_ds15: 'F' },
  san_juan_de_la_costa:        { region: 'X',   zona_ds15: 'F' },
  san_pablo:                   { region: 'X',   zona_ds15: 'F' },
  chaiten:                     { region: 'X',   zona_ds15: 'G' },
  futaleufu:                   { region: 'X',   zona_ds15: 'G' },
  hualaihue:                   { region: 'X',   zona_ds15: 'G' },
  palena:                      { region: 'X',   zona_ds15: 'G' },

  // ═══ XI · Aysén (10) ════════════════════════════════════════════════════════
  coyhaique:                   { region: 'XI',  zona_ds15: 'G' },
  lago_verde:                  { region: 'XI',  zona_ds15: 'G' },
  puerto_aysen:                { region: 'XI',  zona_ds15: 'G' },
  cisnes:                      { region: 'XI',  zona_ds15: 'G' },
  guaitecas:                   { region: 'XI',  zona_ds15: 'G' },
  cochrane:                    { region: 'XI',  zona_ds15: 'G' },
  ohiggins:                    { region: 'XI',  zona_ds15: 'G' },
  tortel:                      { region: 'XI',  zona_ds15: 'G' },
  chile_chico:                 { region: 'XI',  zona_ds15: 'G' },
  rio_ibanez:                  { region: 'XI',  zona_ds15: 'G' },

  // ═══ XII · Magallanes (11) ══════════════════════════════════════════════════
  punta_arenas:                { region: 'XII', zona_ds15: 'H' },
  laguna_blanca:               { region: 'XII', zona_ds15: 'H' },
  rio_verde:                   { region: 'XII', zona_ds15: 'H' },
  san_gregorio:                { region: 'XII', zona_ds15: 'H' },
  cabo_de_hornos:              { region: 'XII', zona_ds15: 'H' },
  antartica:                   { region: 'XII', zona_ds15: 'H' },
  porvenir:                    { region: 'XII', zona_ds15: 'H' },
  primavera:                   { region: 'XII', zona_ds15: 'H' },
  timaukel:                    { region: 'XII', zona_ds15: 'H' },
  puerto_natales:              { region: 'XII', zona_ds15: 'H' },
  torres_del_paine:            { region: 'XII', zona_ds15: 'H' },
}

// Etiquetas legibles para regiones
export const REGIONES_LABELS = {
  'XV':  'XV · Arica y Parinacota',
  'I':   'I · Tarapacá',
  'II':  'II · Antofagasta',
  'III': 'III · Atacama',
  'IV':  'IV · Coquimbo',
  'V':   'V · Valparaíso',
  'RM':  'RM · Metropolitana',
  'VI':  'VI · O\'Higgins',
  'VII': 'VII · Maule',
  'XVI': 'XVI · Ñuble',
  'VIII':'VIII · Biobío',
  'IX':  'IX · Araucanía',
  'XIV': 'XIV · Los Ríos',
  'X':   'X · Los Lagos',
  'XI':  'XI · Aysén',
  'XII': 'XII · Magallanes',
}

// Orden geográfico norte → sur para mostrar listas ordenadas
export const REGIONES_ORDEN = ['XV','I','II','III','IV','V','RM','VI','VII','XVI','VIII','IX','XIV','X','XI','XII']

// ─── Helpers ────────────────────────────────────────────────────────────────
function tituloComuna(key) {
  return key.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

/**
 * Lista de comunas formateada para selector, ordenada por región (norte→sur)
 * y dentro de cada región alfabéticamente.
 *
 * @returns {Array<{key, nombre, region, regionLabel, zona_ds15}>}
 */
export function listarComunasOrdenadas() {
  const items = []
  for (const region of REGIONES_ORDEN) {
    const comunasRegion = Object.entries(COMUNAS_CHILE)
      .filter(([_, c]) => c.region === region)
      .map(([key, c]) => ({
        key,
        nombre: tituloComuna(key),
        region: c.region,
        regionLabel: REGIONES_LABELS[c.region],
        zona_ds15: c.zona_ds15,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
    items.push(...comunasRegion)
  }
  return items
}

/**
 * Obtiene la zona DS N°15 oficial de una comuna.
 * @param {string} comunaKey
 * @returns {string|null} 'A'..'H' o null si no se encuentra
 */
export function obtenerZonaDS15Comuna(comunaKey) {
  if (!comunaKey) return null
  const key = comunaKey.toLowerCase().replace(/\s/g, '_').replace(/[áéíóú]/g, c => 'aeiou'['áéíóú'.indexOf(c)])
  return COMUNAS_CHILE[key]?.zona_ds15 || null
}

/**
 * Etiqueta humana de la zona DS N°15.
 */
export const ZONA_DS15_LABELS = {
  'A': 'A · Norte litoral',
  'B': 'B · Norte desértico',
  'C': 'C · Centro litoral',
  'D': 'D · Centro interior',
  'E': 'E · Sur litoral',
  'F': 'F · Sur interior',
  'G': 'G · Sur extremo',
  'H': 'H · Sur austral',
}
