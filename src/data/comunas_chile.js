// ─────────────────────────────────────────────────────────────────────────────
// comunas_chile.js — Listado completo de las ~346 comunas de Chile.
//
// Cada comuna tiene:
//   · region:     código de la región (XV, I, II, ..., XII)
//   · zona_clima: MACROZONA CLIMÁTICA habitacional (A-H) — proxy de clima para el
//                 módulo energético (HDD/CDD/radiación/HR). Inspirada en NCh1079.
//
// ⚠ ESTO NO ES LA ZONA TÉRMICA OFICIAL DS N°15.
//   La zona oficial DS N°15 (A-I, 9 zonas, regulatoria de la envolvente y del
//   cumplimiento OGUC) vive en `COMUNAS_ZONA` de src/data.js, verificada contra
//   la Tabla 1 del decreto. Aquí `zona_clima` es una taxonomía DISTINTA, más
//   granular climáticamente (p.ej. Calama=E, Ollague=F, Putre=E), pensada solo
//   para estimar demanda energética. Para pasar de la zona oficial a la climática
//   usa MAPA_OGUC_CLIMA / zonaClimaDeOGUC() de src/data/zona_clima.js.
//
// Macrozonas climáticas (A-H):
//   A — Norte litoral             (T° suaves, bajo HDD18)
//   B — Norte desértico interior  (alto contraste día/noche)
//   C — Centro litoral            (mediterráneo costero)
//   D — Centro interior           (mediterráneo continental, RM)
//   E — Sur litoral               (Concepción, Temuco, Valdivia)
//   F — Sur interior              (cordillera sur, Pucón cordillera)
//   G — Sur extremo               (Puerto Montt, Chiloé, Aysén)
//   H — Sur austral               (Magallanes, Punta Arenas)
//
// IMPORTANTE: la asignación se basa en geografía/clima local. Algunas comunas
// grandes abarcan varias subzonas — aquí usamos la climáticamente representativa;
// para comunas multi-zona oficial el clima sigue la zona elegida (ver zona_clima.js).
// ─────────────────────────────────────────────────────────────────────────────

export const COMUNAS_CHILE = {
  // ═══ XV · Arica y Parinacota (4) ════════════════════════════════════════════
  arica:                       { region: 'XV',  zona_clima: 'A' },
  camarones:                   { region: 'XV',  zona_clima: 'A' },
  putre:                       { region: 'XV',  zona_clima: 'E' },  // altiplano (3500m)
  general_lagos:               { region: 'XV',  zona_clima: 'E' },  // altiplano

  // ═══ I · Tarapacá (7) ═══════════════════════════════════════════════════════
  iquique:                     { region: 'I',   zona_clima: 'A' },
  alto_hospicio:               { region: 'I',   zona_clima: 'A' },
  pozo_almonte:                { region: 'I',   zona_clima: 'B' },
  camina:                      { region: 'I',   zona_clima: 'E' },  // precordillera
  colchane:                    { region: 'I',   zona_clima: 'E' },  // altiplano
  huara:                       { region: 'I',   zona_clima: 'B' },
  pica:                        { region: 'I',   zona_clima: 'B' },

  // ═══ II · Antofagasta (9) ═══════════════════════════════════════════════════
  antofagasta:                 { region: 'II',  zona_clima: 'B' },
  mejillones:                  { region: 'II',  zona_clima: 'B' },
  sierra_gorda:                { region: 'II',  zona_clima: 'B' },
  taltal:                      { region: 'II',  zona_clima: 'B' },
  calama:                      { region: 'II',  zona_clima: 'E' },  // desierto altura
  ollague:                     { region: 'II',  zona_clima: 'F' },  // altiplano frío
  san_pedro_atacama:           { region: 'II',  zona_clima: 'E' },
  maria_elena:                 { region: 'II',  zona_clima: 'B' },
  tocopilla:                   { region: 'II',  zona_clima: 'B' },

  // ═══ III · Atacama (9) ══════════════════════════════════════════════════════
  copiapo:                     { region: 'III', zona_clima: 'B' },
  caldera:                     { region: 'III', zona_clima: 'B' },
  tierra_amarilla:             { region: 'III', zona_clima: 'B' },
  chanaral:                    { region: 'III', zona_clima: 'B' },
  diego_almagro:               { region: 'III', zona_clima: 'B' },
  vallenar:                    { region: 'III', zona_clima: 'B' },
  alto_del_carmen:             { region: 'III', zona_clima: 'B' },
  freirina:                    { region: 'III', zona_clima: 'B' },
  huasco:                      { region: 'III', zona_clima: 'B' },

  // ═══ IV · Coquimbo (15) ═════════════════════════════════════════════════════
  la_serena:                   { region: 'IV',  zona_clima: 'C' },
  coquimbo:                    { region: 'IV',  zona_clima: 'C' },
  andacollo:                   { region: 'IV',  zona_clima: 'D' },
  la_higuera:                  { region: 'IV',  zona_clima: 'C' },
  paiguano:                    { region: 'IV',  zona_clima: 'D' },
  vicuna:                      { region: 'IV',  zona_clima: 'D' },
  illapel:                     { region: 'IV',  zona_clima: 'D' },
  canela:                      { region: 'IV',  zona_clima: 'C' },
  los_vilos:                   { region: 'IV',  zona_clima: 'C' },
  salamanca:                   { region: 'IV',  zona_clima: 'D' },
  ovalle:                      { region: 'IV',  zona_clima: 'C' },
  combarbala:                  { region: 'IV',  zona_clima: 'D' },
  monte_patria:                { region: 'IV',  zona_clima: 'D' },
  punitaqui:                   { region: 'IV',  zona_clima: 'D' },
  rio_hurtado:                 { region: 'IV',  zona_clima: 'D' },

  // ═══ V · Valparaíso (38) ════════════════════════════════════════════════════
  valparaiso:                  { region: 'V',   zona_clima: 'C' },
  casablanca:                  { region: 'V',   zona_clima: 'D' },
  concon:                      { region: 'V',   zona_clima: 'C' },
  juan_fernandez:              { region: 'V',   zona_clima: 'C' },
  puchuncavi:                  { region: 'V',   zona_clima: 'C' },
  quintero:                    { region: 'V',   zona_clima: 'C' },
  vina_del_mar:                { region: 'V',   zona_clima: 'C' },
  isla_de_pascua:              { region: 'V',   zona_clima: 'A' },
  los_andes:                   { region: 'V',   zona_clima: 'D' },
  calle_larga:                 { region: 'V',   zona_clima: 'D' },
  rinconada:                   { region: 'V',   zona_clima: 'D' },
  san_esteban:                 { region: 'V',   zona_clima: 'D' },
  la_ligua:                    { region: 'V',   zona_clima: 'C' },
  cabildo:                     { region: 'V',   zona_clima: 'D' },
  papudo:                      { region: 'V',   zona_clima: 'C' },
  petorca:                     { region: 'V',   zona_clima: 'D' },
  zapallar:                    { region: 'V',   zona_clima: 'C' },
  quillota:                    { region: 'V',   zona_clima: 'D' },
  calera:                      { region: 'V',   zona_clima: 'D' },
  hijuelas:                    { region: 'V',   zona_clima: 'D' },
  la_cruz:                     { region: 'V',   zona_clima: 'D' },
  nogales:                     { region: 'V',   zona_clima: 'D' },
  san_antonio:                 { region: 'V',   zona_clima: 'C' },
  algarrobo:                   { region: 'V',   zona_clima: 'C' },
  cartagena:                   { region: 'V',   zona_clima: 'C' },
  el_quisco:                   { region: 'V',   zona_clima: 'C' },
  el_tabo:                     { region: 'V',   zona_clima: 'C' },
  santo_domingo:               { region: 'V',   zona_clima: 'C' },
  san_felipe:                  { region: 'V',   zona_clima: 'D' },
  catemu:                      { region: 'V',   zona_clima: 'D' },
  llaillay:                    { region: 'V',   zona_clima: 'D' },
  panquehue:                   { region: 'V',   zona_clima: 'D' },
  putaendo:                    { region: 'V',   zona_clima: 'D' },
  santa_maria:                 { region: 'V',   zona_clima: 'D' },
  quilpue:                     { region: 'V',   zona_clima: 'D' },
  limache:                     { region: 'V',   zona_clima: 'D' },
  olmue:                       { region: 'V',   zona_clima: 'D' },
  villa_alemana:               { region: 'V',   zona_clima: 'D' },

  // ═══ RM · Metropolitana (52) ════════════════════════════════════════════════
  santiago:                    { region: 'RM',  zona_clima: 'D' },
  cerrillos:                   { region: 'RM',  zona_clima: 'D' },
  cerro_navia:                 { region: 'RM',  zona_clima: 'D' },
  conchali:                    { region: 'RM',  zona_clima: 'D' },
  el_bosque:                   { region: 'RM',  zona_clima: 'D' },
  estacion_central:            { region: 'RM',  zona_clima: 'D' },
  huechuraba:                  { region: 'RM',  zona_clima: 'D' },
  independencia:               { region: 'RM',  zona_clima: 'D' },
  la_cisterna:                 { region: 'RM',  zona_clima: 'D' },
  la_florida:                  { region: 'RM',  zona_clima: 'D' },
  la_granja:                   { region: 'RM',  zona_clima: 'D' },
  la_pintana:                  { region: 'RM',  zona_clima: 'D' },
  la_reina:                    { region: 'RM',  zona_clima: 'D' },
  las_condes:                  { region: 'RM',  zona_clima: 'D' },
  lo_barnechea:                { region: 'RM',  zona_clima: 'D' },
  lo_espejo:                   { region: 'RM',  zona_clima: 'D' },
  lo_prado:                    { region: 'RM',  zona_clima: 'D' },
  macul:                       { region: 'RM',  zona_clima: 'D' },
  maipu:                       { region: 'RM',  zona_clima: 'D' },
  nunoa:                       { region: 'RM',  zona_clima: 'D' },
  pedro_aguirre_cerda:         { region: 'RM',  zona_clima: 'D' },
  penalolen:                   { region: 'RM',  zona_clima: 'D' },
  providencia:                 { region: 'RM',  zona_clima: 'D' },
  pudahuel:                    { region: 'RM',  zona_clima: 'D' },
  quilicura:                   { region: 'RM',  zona_clima: 'D' },
  quinta_normal:               { region: 'RM',  zona_clima: 'D' },
  recoleta:                    { region: 'RM',  zona_clima: 'D' },
  renca:                       { region: 'RM',  zona_clima: 'D' },
  san_joaquin:                 { region: 'RM',  zona_clima: 'D' },
  san_miguel:                  { region: 'RM',  zona_clima: 'D' },
  san_ramon:                   { region: 'RM',  zona_clima: 'D' },
  vitacura:                    { region: 'RM',  zona_clima: 'D' },
  puente_alto:                 { region: 'RM',  zona_clima: 'D' },
  pirque:                      { region: 'RM',  zona_clima: 'D' },
  san_jose_de_maipo:           { region: 'RM',  zona_clima: 'E' },  // cordillera
  colina:                      { region: 'RM',  zona_clima: 'D' },
  lampa:                       { region: 'RM',  zona_clima: 'D' },
  til_til:                     { region: 'RM',  zona_clima: 'D' },
  san_bernardo:                { region: 'RM',  zona_clima: 'D' },
  buin:                        { region: 'RM',  zona_clima: 'D' },
  calera_de_tango:             { region: 'RM',  zona_clima: 'D' },
  paine:                       { region: 'RM',  zona_clima: 'D' },
  melipilla:                   { region: 'RM',  zona_clima: 'D' },
  alhue:                       { region: 'RM',  zona_clima: 'D' },
  curacavi:                    { region: 'RM',  zona_clima: 'D' },
  maria_pinto:                 { region: 'RM',  zona_clima: 'D' },
  san_pedro_rm:                { region: 'RM',  zona_clima: 'D' },
  talagante:                   { region: 'RM',  zona_clima: 'D' },
  el_monte:                    { region: 'RM',  zona_clima: 'D' },
  isla_de_maipo:               { region: 'RM',  zona_clima: 'D' },
  padre_hurtado:               { region: 'RM',  zona_clima: 'D' },
  penaflor:                    { region: 'RM',  zona_clima: 'D' },

  // ═══ VI · O'Higgins (33) ════════════════════════════════════════════════════
  rancagua:                    { region: 'VI',  zona_clima: 'D' },
  codegua:                     { region: 'VI',  zona_clima: 'D' },
  coinco:                      { region: 'VI',  zona_clima: 'D' },
  coltauco:                    { region: 'VI',  zona_clima: 'D' },
  donihue:                     { region: 'VI',  zona_clima: 'D' },
  graneros:                    { region: 'VI',  zona_clima: 'D' },
  las_cabras:                  { region: 'VI',  zona_clima: 'D' },
  machali:                     { region: 'VI',  zona_clima: 'E' },  // precordillera
  malloa:                      { region: 'VI',  zona_clima: 'D' },
  mostazal:                    { region: 'VI',  zona_clima: 'D' },
  olivar:                      { region: 'VI',  zona_clima: 'D' },
  peumo:                       { region: 'VI',  zona_clima: 'D' },
  pichidegua:                  { region: 'VI',  zona_clima: 'D' },
  quinta_de_tilcoco:           { region: 'VI',  zona_clima: 'D' },
  rengo:                       { region: 'VI',  zona_clima: 'D' },
  requinoa:                    { region: 'VI',  zona_clima: 'D' },
  san_vicente:                 { region: 'VI',  zona_clima: 'D' },
  pichilemu:                   { region: 'VI',  zona_clima: 'C' },
  la_estrella:                 { region: 'VI',  zona_clima: 'C' },
  litueche:                    { region: 'VI',  zona_clima: 'C' },
  marchihue:                   { region: 'VI',  zona_clima: 'C' },
  navidad:                     { region: 'VI',  zona_clima: 'C' },
  paredones:                   { region: 'VI',  zona_clima: 'C' },
  san_fernando:                { region: 'VI',  zona_clima: 'D' },
  chepica:                     { region: 'VI',  zona_clima: 'D' },
  chimbarongo:                 { region: 'VI',  zona_clima: 'D' },
  lolol:                       { region: 'VI',  zona_clima: 'D' },
  nancagua:                    { region: 'VI',  zona_clima: 'D' },
  palmilla:                    { region: 'VI',  zona_clima: 'D' },
  peralillo:                   { region: 'VI',  zona_clima: 'D' },
  placilla:                    { region: 'VI',  zona_clima: 'D' },
  pumanque:                    { region: 'VI',  zona_clima: 'D' },
  santa_cruz:                  { region: 'VI',  zona_clima: 'D' },

  // ═══ VII · Maule (30) ═══════════════════════════════════════════════════════
  talca:                       { region: 'VII', zona_clima: 'D' },
  constitucion:                { region: 'VII', zona_clima: 'C' },
  curepto:                     { region: 'VII', zona_clima: 'C' },
  empedrado:                   { region: 'VII', zona_clima: 'C' },
  maule:                       { region: 'VII', zona_clima: 'D' },
  pelarco:                     { region: 'VII', zona_clima: 'D' },
  pencahue:                    { region: 'VII', zona_clima: 'D' },
  rio_claro:                   { region: 'VII', zona_clima: 'D' },
  san_clemente:                { region: 'VII', zona_clima: 'D' },
  san_rafael:                  { region: 'VII', zona_clima: 'D' },
  cauquenes:                   { region: 'VII', zona_clima: 'D' },
  chanco:                      { region: 'VII', zona_clima: 'C' },
  pelluhue:                    { region: 'VII', zona_clima: 'C' },
  curico:                      { region: 'VII', zona_clima: 'D' },
  hualane:                     { region: 'VII', zona_clima: 'D' },
  licanten:                    { region: 'VII', zona_clima: 'C' },
  molina:                      { region: 'VII', zona_clima: 'D' },
  rauco:                       { region: 'VII', zona_clima: 'D' },
  romeral:                     { region: 'VII', zona_clima: 'D' },
  sagrada_familia:             { region: 'VII', zona_clima: 'D' },
  teno:                        { region: 'VII', zona_clima: 'D' },
  vichuquen:                   { region: 'VII', zona_clima: 'C' },
  linares:                     { region: 'VII', zona_clima: 'D' },
  colbun:                      { region: 'VII', zona_clima: 'E' },  // precordillera
  longavi:                     { region: 'VII', zona_clima: 'D' },
  parral:                      { region: 'VII', zona_clima: 'D' },
  retiro:                      { region: 'VII', zona_clima: 'D' },
  san_javier:                  { region: 'VII', zona_clima: 'D' },
  villa_alegre:                { region: 'VII', zona_clima: 'D' },
  yerbas_buenas:               { region: 'VII', zona_clima: 'D' },

  // ═══ XVI · Ñuble (21) ═══════════════════════════════════════════════════════
  chillan:                     { region: 'XVI', zona_clima: 'D' },
  bulnes:                      { region: 'XVI', zona_clima: 'D' },
  cobquecura:                  { region: 'XVI', zona_clima: 'C' },
  coelemu:                     { region: 'XVI', zona_clima: 'D' },
  coihueco:                    { region: 'XVI', zona_clima: 'D' },
  chillan_viejo:               { region: 'XVI', zona_clima: 'D' },
  el_carmen:                   { region: 'XVI', zona_clima: 'D' },
  ninhue:                      { region: 'XVI', zona_clima: 'D' },
  niquen:                      { region: 'XVI', zona_clima: 'D' },
  pemuco:                      { region: 'XVI', zona_clima: 'D' },
  pinto:                       { region: 'XVI', zona_clima: 'E' },  // termas chillán
  portezuelo:                  { region: 'XVI', zona_clima: 'D' },
  quillon:                     { region: 'XVI', zona_clima: 'D' },
  quirihue:                    { region: 'XVI', zona_clima: 'D' },
  ranquil:                     { region: 'XVI', zona_clima: 'D' },
  san_carlos:                  { region: 'XVI', zona_clima: 'D' },
  san_fabian:                  { region: 'XVI', zona_clima: 'E' },  // cordillera
  san_ignacio:                 { region: 'XVI', zona_clima: 'D' },
  san_nicolas:                 { region: 'XVI', zona_clima: 'D' },
  treguaco:                    { region: 'XVI', zona_clima: 'D' },
  yungay:                      { region: 'XVI', zona_clima: 'E' },

  // ═══ VIII · Biobío (33) ═════════════════════════════════════════════════════
  concepcion:                  { region: 'VIII', zona_clima: 'E' },
  coronel:                     { region: 'VIII', zona_clima: 'E' },
  chiguayante:                 { region: 'VIII', zona_clima: 'E' },
  florida:                     { region: 'VIII', zona_clima: 'E' },
  hualpen:                     { region: 'VIII', zona_clima: 'E' },
  hualqui:                     { region: 'VIII', zona_clima: 'E' },
  lota:                        { region: 'VIII', zona_clima: 'E' },
  penco:                       { region: 'VIII', zona_clima: 'E' },
  san_pedro_de_la_paz:         { region: 'VIII', zona_clima: 'E' },
  santa_juana:                 { region: 'VIII', zona_clima: 'E' },
  talcahuano:                  { region: 'VIII', zona_clima: 'E' },
  tome:                        { region: 'VIII', zona_clima: 'E' },
  lebu:                        { region: 'VIII', zona_clima: 'E' },
  arauco:                      { region: 'VIII', zona_clima: 'E' },
  canete:                      { region: 'VIII', zona_clima: 'E' },
  contulmo:                    { region: 'VIII', zona_clima: 'E' },
  curanilahue:                 { region: 'VIII', zona_clima: 'E' },
  los_alamos:                  { region: 'VIII', zona_clima: 'E' },
  tirua:                       { region: 'VIII', zona_clima: 'E' },
  los_angeles:                 { region: 'VIII', zona_clima: 'E' },
  antuco:                      { region: 'VIII', zona_clima: 'F' },  // cordillera
  cabrero:                     { region: 'VIII', zona_clima: 'E' },
  laja:                        { region: 'VIII', zona_clima: 'E' },
  mulchen:                     { region: 'VIII', zona_clima: 'E' },
  nacimiento:                  { region: 'VIII', zona_clima: 'E' },
  negrete:                     { region: 'VIII', zona_clima: 'E' },
  quilaco:                     { region: 'VIII', zona_clima: 'F' },
  quilleco:                    { region: 'VIII', zona_clima: 'E' },
  san_rosendo:                 { region: 'VIII', zona_clima: 'E' },
  santa_barbara:               { region: 'VIII', zona_clima: 'F' },
  tucapel:                     { region: 'VIII', zona_clima: 'F' },
  yumbel:                      { region: 'VIII', zona_clima: 'E' },
  alto_biobio:                 { region: 'VIII', zona_clima: 'F' },

  // ═══ IX · Araucanía (32) ════════════════════════════════════════════════════
  temuco:                      { region: 'IX',  zona_clima: 'E' },
  carahue:                     { region: 'IX',  zona_clima: 'E' },
  cunco:                       { region: 'IX',  zona_clima: 'F' },
  curarrehue:                  { region: 'IX',  zona_clima: 'F' },
  freire:                      { region: 'IX',  zona_clima: 'E' },
  galvarino:                   { region: 'IX',  zona_clima: 'E' },
  gorbea:                      { region: 'IX',  zona_clima: 'E' },
  lautaro:                     { region: 'IX',  zona_clima: 'E' },
  loncoche:                    { region: 'IX',  zona_clima: 'E' },
  melipeuco:                   { region: 'IX',  zona_clima: 'F' },
  nueva_imperial:              { region: 'IX',  zona_clima: 'E' },
  padre_las_casas:             { region: 'IX',  zona_clima: 'E' },
  perquenco:                   { region: 'IX',  zona_clima: 'E' },
  pitrufquen:                  { region: 'IX',  zona_clima: 'E' },
  pucon:                       { region: 'IX',  zona_clima: 'F' },
  saavedra:                    { region: 'IX',  zona_clima: 'E' },
  teodoro_schmidt:             { region: 'IX',  zona_clima: 'E' },
  tolten:                      { region: 'IX',  zona_clima: 'E' },
  vilcun:                      { region: 'IX',  zona_clima: 'E' },
  villarrica:                  { region: 'IX',  zona_clima: 'F' },
  cholchol:                    { region: 'IX',  zona_clima: 'E' },
  angol:                       { region: 'IX',  zona_clima: 'E' },
  collipulli:                  { region: 'IX',  zona_clima: 'E' },
  curacautin:                  { region: 'IX',  zona_clima: 'F' },
  ercilla:                     { region: 'IX',  zona_clima: 'E' },
  lonquimay:                   { region: 'IX',  zona_clima: 'F' },
  los_sauces:                  { region: 'IX',  zona_clima: 'E' },
  lumaco:                      { region: 'IX',  zona_clima: 'E' },
  puren:                       { region: 'IX',  zona_clima: 'E' },
  renaico:                     { region: 'IX',  zona_clima: 'E' },
  traiguen:                    { region: 'IX',  zona_clima: 'E' },
  victoria:                    { region: 'IX',  zona_clima: 'E' },

  // ═══ XIV · Los Ríos (12) ════════════════════════════════════════════════════
  valdivia:                    { region: 'XIV', zona_clima: 'E' },
  corral:                      { region: 'XIV', zona_clima: 'E' },
  lanco:                       { region: 'XIV', zona_clima: 'E' },
  los_lagos:                   { region: 'XIV', zona_clima: 'E' },
  mafil:                       { region: 'XIV', zona_clima: 'E' },
  mariquina:                   { region: 'XIV', zona_clima: 'E' },
  paillaco:                    { region: 'XIV', zona_clima: 'E' },
  panguipulli:                 { region: 'XIV', zona_clima: 'F' },
  la_union:                    { region: 'XIV', zona_clima: 'F' },
  futrono:                     { region: 'XIV', zona_clima: 'F' },
  lago_ranco:                  { region: 'XIV', zona_clima: 'F' },
  rio_bueno:                   { region: 'XIV', zona_clima: 'F' },

  // ═══ X · Los Lagos (30) ═════════════════════════════════════════════════════
  puerto_montt:                { region: 'X',   zona_clima: 'F' },
  calbuco:                     { region: 'X',   zona_clima: 'F' },
  cochamo:                     { region: 'X',   zona_clima: 'F' },
  fresia:                      { region: 'X',   zona_clima: 'F' },
  frutillar:                   { region: 'X',   zona_clima: 'F' },
  los_muermos:                 { region: 'X',   zona_clima: 'F' },
  llanquihue:                  { region: 'X',   zona_clima: 'F' },
  maullin:                     { region: 'X',   zona_clima: 'F' },
  puerto_varas:                { region: 'X',   zona_clima: 'F' },
  castro:                      { region: 'X',   zona_clima: 'F' },
  ancud:                       { region: 'X',   zona_clima: 'F' },
  chonchi:                     { region: 'X',   zona_clima: 'F' },
  curaco_de_velez:             { region: 'X',   zona_clima: 'F' },
  dalcahue:                    { region: 'X',   zona_clima: 'F' },
  puqueldon:                   { region: 'X',   zona_clima: 'F' },
  queilen:                     { region: 'X',   zona_clima: 'F' },
  quellon:                     { region: 'X',   zona_clima: 'F' },
  quemchi:                     { region: 'X',   zona_clima: 'F' },
  quinchao:                    { region: 'X',   zona_clima: 'F' },
  osorno:                      { region: 'X',   zona_clima: 'F' },
  puerto_octay:                { region: 'X',   zona_clima: 'F' },
  purranque:                   { region: 'X',   zona_clima: 'F' },
  puyehue:                     { region: 'X',   zona_clima: 'F' },
  rio_negro:                   { region: 'X',   zona_clima: 'F' },
  san_juan_de_la_costa:        { region: 'X',   zona_clima: 'F' },
  san_pablo:                   { region: 'X',   zona_clima: 'F' },
  chaiten:                     { region: 'X',   zona_clima: 'G' },
  futaleufu:                   { region: 'X',   zona_clima: 'G' },
  hualaihue:                   { region: 'X',   zona_clima: 'G' },
  palena:                      { region: 'X',   zona_clima: 'G' },

  // ═══ XI · Aysén (10) ════════════════════════════════════════════════════════
  coyhaique:                   { region: 'XI',  zona_clima: 'G' },
  lago_verde:                  { region: 'XI',  zona_clima: 'G' },
  puerto_aysen:                { region: 'XI',  zona_clima: 'G' },
  cisnes:                      { region: 'XI',  zona_clima: 'G' },
  guaitecas:                   { region: 'XI',  zona_clima: 'G' },
  cochrane:                    { region: 'XI',  zona_clima: 'G' },
  ohiggins:                    { region: 'XI',  zona_clima: 'G' },
  tortel:                      { region: 'XI',  zona_clima: 'G' },
  chile_chico:                 { region: 'XI',  zona_clima: 'G' },
  rio_ibanez:                  { region: 'XI',  zona_clima: 'G' },

  // ═══ XII · Magallanes (11) ══════════════════════════════════════════════════
  punta_arenas:                { region: 'XII', zona_clima: 'H' },
  laguna_blanca:               { region: 'XII', zona_clima: 'H' },
  rio_verde:                   { region: 'XII', zona_clima: 'H' },
  san_gregorio:                { region: 'XII', zona_clima: 'H' },
  cabo_de_hornos:              { region: 'XII', zona_clima: 'H' },
  antartica:                   { region: 'XII', zona_clima: 'H' },
  porvenir:                    { region: 'XII', zona_clima: 'H' },
  primavera:                   { region: 'XII', zona_clima: 'H' },
  timaukel:                    { region: 'XII', zona_clima: 'H' },
  puerto_natales:              { region: 'XII', zona_clima: 'H' },
  torres_del_paine:            { region: 'XII', zona_clima: 'H' },
}

// ═════════════════════════════════════════════════════════════════════════════
// DISTRIBUIDORAS ELÉCTRICAS POR COMUNA
// ═════════════════════════════════════════════════════════════════════════════
// Mapeo basado en zonas de concesión legalmente definidas por la SEC.
// IDs deben coincidir con los de DISTRIBUIDORAS_ELEC en combustibles.js.
//
// Distribuidoras principales chilenas:
//   · cge:       Compañía General de Electricidad (XV, I, II, III, IV, VI, VII,
//                XVI, V interior, RM periferia, Concepción Metropolitano)
//   · enel:      Enel Distribución (RM urbana — ex Chilectra)
//   · chilquinta:Chilquinta Energía (V costera: Valparaíso, Viña, Quilpué, etc.)
//   · frontel:   Saesa Frontel (VIII rural, IX Araucanía)
//   · saesa:     Saesa (XIV, X mayoría)
//   · luzosorno: Sociedad Austral Generación (X — Osorno y alrededores)
//   · edelaysen: Edelaysén (XI Aysén)
//   · edelmag:   Edelmag (XII Magallanes)
//   · otro:      Sistemas aislados (Isla de Pascua SASIPA, Juan Fernández, etc.)

// Distribuidora dominante por región (la mayoría de las comunas de la región)
const DISTRIBUIDORA_POR_REGION = {
  'XV':  'cge',
  'I':   'cge',
  'II':  'cge',
  'III': 'cge',
  'IV':  'cge',
  'V':   'chilquinta',   // mayoría costera; interior usa CGE (ver overrides)
  'RM':  'enel',
  'VI':  'cge',
  'VII': 'cge',
  'XVI': 'cge',
  'VIII':'frontel',      // mayoría sur de la región; Concepción Metro es CGE
  'IX':  'frontel',
  'XIV': 'saesa',
  'X':   'saesa',        // mayoría; Osorno y alrededores es Luz Osorno
  'XI':  'edelaysen',
  'XII': 'edelmag',
}

// Overrides específicos: comunas que NO siguen el patrón de su región
const DISTRIBUIDORA_OVERRIDE = {
  // ─── V Valparaíso — interior continental usa CGE ─────────────────────────
  'los_andes': 'cge', 'calle_larga': 'cge', 'rinconada': 'cge', 'san_esteban': 'cge',
  'san_felipe': 'cge', 'catemu': 'cge', 'llaillay': 'cge', 'panquehue': 'cge',
  'putaendo':   'cge', 'santa_maria': 'cge',
  'la_ligua':   'cge', 'cabildo':     'cge', 'petorca':     'cge',
  // V Aislados (servicios pequeños)
  'isla_de_pascua': 'otro',
  'juan_fernandez': 'otro',

  // ─── RM Metropolitana — periferia rural puede ser CGE ────────────────────
  'san_jose_de_maipo': 'cge',
  'alhue':             'cge',

  // ─── XVI Ñuble — COPELEC en sectores rurales / pequeñas comunas ─────────
  // Cabeceras urbanas (Chillán, San Carlos, etc.) son CGE; COPELEC predomina
  // en cooperativas rurales y comunas con baja densidad.
  'coihueco':    'copelec', 'el_carmen':  'copelec', 'pinto':       'copelec',
  'pemuco':      'copelec', 'san_ignacio':'copelec', 'niquen':      'copelec',
  'san_nicolas': 'copelec', 'yungay':     'copelec', 'portezuelo':  'copelec',
  'ranquil':     'copelec', 'treguaco':   'copelec', 'ninhue':      'copelec',
  'cobquecura':  'copelec', 'san_fabian': 'copelec', 'quirihue':    'copelec',

  // ─── VIII Biobío — Concepción Metropolitano es CGE (no Frontel) ─────────
  'concepcion':         'cge', 'talcahuano': 'cge', 'hualpen': 'cge',
  'san_pedro_de_la_paz':'cge', 'chiguayante':'cge', 'penco':   'cge',
  'tome':               'cge', 'hualqui':    'cge', 'florida': 'cge',
  'santa_juana':        'cge', 'coronel':    'cge', 'lota':    'cge',

  // ─── XIV Los Ríos — Frontel en zona norte (Mariquina, Máfil, Lanco) ─────
  'mariquina': 'frontel', 'mafil': 'frontel', 'lanco': 'frontel',

  // ─── X Los Lagos — área Osorno usa Luz Osorno ────────────────────────────
  'osorno':              'luzosorno', 'puerto_octay': 'luzosorno',
  'puyehue':             'luzosorno', 'purranque':    'luzosorno',
  'rio_negro':           'luzosorno',
  'san_juan_de_la_costa':'luzosorno', 'san_pablo':    'luzosorno',
  // X — Comunas aisladas continental
  'chaiten':    'saesa', 'futaleufu':  'saesa',
  'hualaihue':  'saesa', 'palena':     'saesa',
}

// ─────────────────────────────────────────────────────────────────────────────
// DUALIDAD DE DISTRIBUIDORAS — comunas con presencia mixta urbano/rural.
// En Chile es común que el sector urbano lo sirva una distribuidora "grande"
// (CGE/Enel/Chilquinta) mientras una cooperativa o Frontel atienda lo rural.
// Aquí guardamos la "distribuidora alternativa" típica para esos casos.
// ─────────────────────────────────────────────────────────────────────────────
const DISTRIBUIDORA_ALT = {
  // ─── XVI Ñuble — Chillán urbano CGE + COPELEC rural/periferia ────────────
  'chillan':       'copelec', 'chillan_viejo': 'copelec',
  'san_carlos':    'copelec', 'bulnes':        'copelec',
  'quillon':       'copelec',

  // ─── VIII Biobío — Conce Metro CGE + Frontel periferia rural ─────────────
  'florida':       'frontel',
  'santa_juana':   'frontel',
  'arauco':        'frontel',  // Conce sur fronteriza

  // ─── VIII Biobío rural — Frontel + cooperativas locales ──────────────────
  'cabrero':       'cge',      // Frontel + algunos sectores CGE
  'yumbel':        'cge',
  'laja':          'cge',
  'mulchen':       'cge',      // sectores con CGE rural

  // ─── IX Araucanía — Frontel + cooperativas locales (COOPELAN, etc.) ─────
  'loncoche':      'cge',      // límite Araucanía/Los Ríos
  'curacautin':    'cge',      // zona cordillera con presencia mixta

  // ─── XIV Los Ríos — Saesa + Frontel norte ────────────────────────────────
  'valdivia':      'frontel',  // Saesa urbano + Frontel periferia
  'panguipulli':   'frontel',
  'los_lagos':     'frontel',

  // ─── X Los Lagos — Saesa + Luz Osorno limítrofes ─────────────────────────
  'frutillar':     'luzosorno',
  'llanquihue':    'luzosorno',

  // ─── V Valparaíso costera — Chilquinta + CGE rural ───────────────────────
  'quillota':      'cge',
  'calera':        'cge',
  'hijuelas':      'cge',
  'limache':       'cge',
  'olmue':         'cge',
}

/**
 * Devuelve el id de la distribuidora eléctrica que opera en una comuna.
 * Si la comuna no se encuentra → 'otro' (tarifa promedio).
 */
export function obtenerDistribuidoraComuna(comunaKey) {
  if (!comunaKey) return 'otro'
  const key = comunaKey.toLowerCase().replace(/\s/g, '_')
  if (DISTRIBUIDORA_OVERRIDE[key]) return DISTRIBUIDORA_OVERRIDE[key]
  const comuna = COMUNAS_CHILE[key]
  if (!comuna) return 'otro'
  return DISTRIBUIDORA_POR_REGION[comuna.region] || 'otro'
}

/**
 * Devuelve la distribuidora alternativa si la comuna tiene dualidad
 * (típicamente urbano vs rural). Retorna null si no hay dualidad conocida.
 */
export function obtenerDistribuidoraAlt(comunaKey) {
  if (!comunaKey) return null
  const key = comunaKey.toLowerCase().replace(/\s/g, '_')
  return DISTRIBUIDORA_ALT[key] || null
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
 * @returns {Array<{key, nombre, region, regionLabel, zona_clima}>}
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
        zona_clima: c.zona_clima,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
    items.push(...comunasRegion)
  }
  return items
}

/**
 * Dado un nombre de comuna (ej. "Temuco", "San Pedro de Atacama"),
 * devuelve el key del catálogo COMUNAS_CHILE (ej. "temuco", "san_pedro_de_atacama").
 * Retorna null si no se encuentra.
 */
export function buscarComunaKey(nombre) {
  if (!nombre) return null
  const norm = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_').trim()
  if (COMUNAS_CHILE[norm]) return norm
  for (const [key] of Object.entries(COMUNAS_CHILE)) {
    if (key === norm) return key
  }
  return null
}

/**
 * Obtiene la MACROZONA CLIMÁTICA (A-H) de una comuna — NO es la zona DS N°15
 * oficial. Para derivar el clima desde la zona oficial usa zonaClimaDeOGUC()
 * de src/data/zona_clima.js.
 * @param {string} comunaKey
 * @returns {string|null} 'A'..'H' o null si no se encuentra
 */
export function obtenerZonaClimaComuna(comunaKey) {
  if (!comunaKey) return null
  const key = comunaKey.toLowerCase().replace(/\s/g, '_').replace(/[áéíóú]/g, c => 'aeiou'['áéíóú'.indexOf(c)])
  return COMUNAS_CHILE[key]?.zona_clima || null
}

/**
 * Etiqueta humana de la macrozona climática (A-H). NO confundir con la zona
 * térmica oficial DS N°15 (ZONAS en src/data.js).
 */
export const ZONA_CLIMA_LABELS = {
  'A': 'A · Norte litoral',
  'B': 'B · Norte desértico',
  'C': 'C · Centro litoral',
  'D': 'D · Centro interior',
  'E': 'E · Sur litoral',
  'F': 'F · Sur interior',
  'G': 'G · Sur extremo',
  'H': 'H · Sur austral',
}
