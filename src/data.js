// ─── DATOS BASE ───────────────────────────────────────────────────────────────
export const ZONAS={A:{n:"Zona A",ej:"Arica, Antofagasta",techo:0.84,muro:2.10,piso:3.60,Ti:20,Te:10,HR:60,pda:false},B:{n:"Zona B",ej:"Copiapo, Vallenar",techo:0.47,muro:0.80,piso:0.87,Ti:20,Te:5,HR:65,pda:false},C:{n:"Zona C",ej:"Coquimbo, Valparaiso",techo:0.47,muro:0.80,piso:0.87,Ti:20,Te:4,HR:70,pda:false},D:{n:"Zona D",ej:"Santiago, Talca",techo:0.38,muro:0.80,piso:0.60,Ti:20,Te:2,HR:75,pda:true},E:{n:"Zona E",ej:"Concepcion, Tolten",techo:0.33,muro:0.60,piso:0.60,Ti:20,Te:1,HR:78,pda:true},F:{n:"Zona F",ej:"Chillan, Temuco",techo:0.28,muro:0.45,piso:0.50,Ti:20,Te:-1,HR:80,pda:true},G:{n:"Zona G",ej:"Valdivia, Puerto Montt",techo:0.28,muro:0.40,piso:0.39,Ti:20,Te:-2,HR:80,pda:false},H:{n:"Zona H",ej:"Lonquimay, Pucon",techo:0.25,muro:0.30,piso:0.32,Ti:20,Te:-4,HR:75,pda:false},I:{n:"Zona I",ej:"Coyhaique, Punta Arenas",techo:0.25,muro:0.35,piso:0.35,Ti:20,Te:-6,HR:75,pda:false}};

export const COMUNAS_ZONA={A:["Arica","Camarones","Putre","General Lagos","Iquique","Alto Hospicio","Camina","Colchane","Huara","Pica","Pozo Almonte","Antofagasta","Mejillones","Sierra Gorda","Taltal","Tocopilla","Maria Elena","Calama","Ollague","San Pedro de Atacama"],B:["Copiapo","Caldera","Tierra Amarilla","Chanaral","Diego de Almagro","Vallenar","Alto del Carmen","Freirina","Huasco"],C:["La Serena","Coquimbo","Andacollo","La Higuera","Paihuano","Vicuna","Illapel","Canela","Los Vilos","Salamanca","Ovalle","Combarbala","Monte Patria","Punitaqui","Rio Hurtado","Valparaiso","Casablanca","Concon","Juan Fernandez","Puchuncavi","Quintero","Vina del Mar","Los Andes","San Esteban","Cabildo","Papudo","Petorca","Zapallar","Quillota","Calera","Hijuelas","La Cruz","Nogales","San Antonio","Cartagena","El Quisco","El Tabo","San Pedro","Quilpue","Villa Alemana"],D:["Santiago","Cerrillos","Cerro Navia","Conchali","El Bosque","Estacion Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipu","Nunoa","Pedro Aguirre Cerda","Penalolen","Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca","San Joaquin","San Miguel","San Ramon","Vitacura","Puente Alto","San Bernardo","Buin","Calera de Tango","Paine","Melipilla","Alhue","Curacavi","Maria Pinto","Penaflor","Talagante","El Monte","Isla de Maipo","Padre Hurtado","Rancagua","Machali","Malloa","Mostazal","Olivar","Rengo","Requinoa","San Vicente","Curico","Molina","Romeral","Talca","Constitucion","Curepto","Maule","Pencahue","Rio Claro","San Clemente","San Rafael"],E:["Cauquenes","Chanco","Pelluhue","Linares","Colbun","Longavi","Parral","Retiro","San Javier","Villa Alegre","Yerbas Buenas","Concepcion","Coronel","Chiguayante","Florida","Hualpen","Hualqui","Lota","Penco","San Pedro de la Paz","Santa Juana","Talcahuano","Tome","Arauco","Canete","Contulmo","Curanilahue","Lebu","Los Alamos","Tirua","Los Angeles","Antuco","Cabrero","Laja","Mulchen","Nacimiento","Negrete","Quilaco","Quilleco","San Rosendo","Santa Barbara","Tucapel","Yumbel"],F:["Chillan","Bulnes","Coelemu","Coihueco","Chillan Viejo","El Carmen","Ninhue","Pemuco","Pinto","Portezuelo","Quillon","Quirihue","Ranquil","San Carlos","San Fabian","San Ignacio","San Nicolas","Trehuaco","Yungay","Temuco","Carahue","Cunco","Curarrehue","Freire","Galvarino","Gorbea","Lautaro","Loncoche","Melipeuco","Nueva Imperial","Padre Las Casas","Perquenco","Pitrufquen","Pucon","Saavedra","Teodoro Schmidt","Tolten","Vilcun","Villarrica","Angol","Collipulli","Curacautin","Ercilla","Lonquimay","Los Sauces","Lumaco","Puren","Renaico","Traiguen","Victoria","Valdivia","Corral","Futrono","La Union","Lago Ranco","Lanco","Los Lagos","Mafil","Mariquina","Paillaco","Panguipulli","Rio Bueno","Osorno","Puerto Octay","Purranque","Puyehue","Rio Negro","San Juan de la Costa","San Pablo"],G:["Puerto Montt","Calbuco","Cochamo","Fresia","Frutillar","Los Muermos","Llanquihue","Maullin","Puerto Varas","Castro","Ancud","Chonchi","Curaco de Velez","Dalcahue","Puqueldon","Queilen","Quellon","Quemchi","Quinchao","Chaiten","Futaleufu","Hualaihue","Palena"],H:["Putre","General Lagos","Lonquimay","Curarrehue","Curacautin","San Pedro de Atacama"],I:["Coyhaique","Aisen","Chile Chico","Cisnes","Cochrane","Guaitecas","Lago Verde","O Higgins","Rio Ibanez","Tortel","Natales","Punta Arenas","Cabo de Hornos","Laguna Blanca","Rio Verde","San Gregorio","Timaukel","Torres del Paine","Porvenir","Primavera","Antartica"]};

export const PERM_V={A:null,B:1,C:1,D:2,E:2,F:2,G:3,H:3,I:3};
export const PUERTA_U={A:null,B:1.7,C:1.7,D:1.7,E:1.7,F:2.0,G:2.0,H:2.0,I:2.0};
export const PUERTA_P={A:null,B:1,C:1,D:2,E:2,F:2,G:3,H:3,I:3};
// RF mínima para puertas de separación (OGUC Art. 4.5.4)
export const PUERTA_RF={A:null,B:'F15',C:'F15',D:'F30',E:'F30',F:'F30',G:'F30',H:'F30',I:'F30'};
export const SOBR_R={A:null,B:45,C:45,D:45,E:45,F:91,G:91,H:91,I:91};
export const INFILT={A:null,B:4.0,C:5.0,D:8.0,E:5.0,F:8.0,G:5.0,H:4.0,I:4.0};
export const VPCT={A:{N:[100,97,94],OP:[94,87,80],S:[85,78,69]},B:{N:[96,92,88],OP:[84,78,71],S:[75,68,59]},C:{N:[91,88,83],OP:[75,69,62],S:[64,58,49]},D:{N:[87,83,77],OP:[65,60,53],S:[54,48,40]},E:{N:[83,78,71],OP:[56,51,45],S:[44,38,31]},F:{N:[78,73,65],OP:[47,42,36],S:[34,28,21]},G:{N:[74,67,59],OP:[38,34,28],S:[24,19,13]},H:{N:[69,62,53],OP:[29,25,20],S:[23,18,12]},I:{N:[64,57,46],OP:[38,34,28],S:[21,16,10]}};
export const U_NIVELES=[0.6,0.8,1.2,1.6,2.0,2.4,2.8,3.2,3.6,4.0,4.4,5.8];
export const getUIdx=u=>{const i=U_NIVELES.findIndex(v=>u<=v);return i<0?11:i;};
export const TIPOS=["Vivienda","Educacion","Salud","Oficina","Comercio","Industrial"];
export const USOS_RT=["Vivienda","Educacion","Salud"];
export const ESTRUCTURAS=["Hormigon armado","Albanileria confinada","Albanileria armada","Estructura de acero","Metalframe (acero liviano)","Estructura de madera","Mixta HA + albanileria"];
// RF_DEF: valores de respaldo para destinos no cubiertos por Tabla 1 OGUC (Educación, Industrial)
// o cuando no se ha ingresado superficie edificada.
export const RF_DEF={Vivienda:{estructura:"F30",muros_sep:"F60",escaleras:"F60",cubierta:"F15"},Educacion:{estructura:"F60",muros_sep:"F60",escaleras:"F90",cubierta:"F30"},Salud:{estructura:"F90",muros_sep:"F90",escaleras:"F120",cubierta:"F30"},Oficina:{estructura:"F60",muros_sep:"F60",escaleras:"F90",cubierta:"F30"},Comercio:{estructura:"F60",muros_sep:"F60",escaleras:"F90",cubierta:"F30"},Industrial:{estructura:"F90",muros_sep:"F90",escaleras:"F120",cubierta:"F60"}};

// ─── OGUC Tít. 4 Cap. 3 — Tabla de elementos de construcción ─────────────────
// Cada letra (a/b/c/d) define los RF mínimos por tipo de elemento constructivo:
// col 1: Soporte cargas subterráneo
// col 2: Soporte cargas sobre terreno (estructura principal, pilares, vigas, muros portantes)
// col 3: Muros separación entre distintos propietarios o destinos
// col 4: Cajas de escalera, ascensores y ductos
// col 5: Muros separación entre unidades del mismo destino
// col 6: Paredes interiores divisorias no estructurales de una unidad
// col 7: Cubierta (cuando separa recintos habitables de recintos no habitables)
// col 8: Entrepisos / Cubierta sin función de separación
// col 9: Escaleras
export const OGUC_RF_LETRAS = {
  a: { 1:'F180', 2:'F120', 3:'F120', 4:'F120', 5:'F120', 6:'F30',  7:'F60',  8:'F120', 9:'F60'  },
  b: { 1:'F150', 2:'F120', 3:'F90',  4:'F90',  5:'F90',  6:'F15',  7:'F30',  8:'F90',  9:'F60'  },
  c: { 1:'F120', 2:'F90',  3:'F60',  4:'F60',  5:'F60',  6:null,   7:'F15',  8:'F60',  9:'F30'  },
  d: { 1:'F120', 2:'F60',  3:'F60',  4:'F60',  5:'F30',  6:null,   7:null,   8:'F30',  9:'F15'  },
}

// Mapeo elemento del proyecto → columna OGUC
export const OGUC_ELEM_COL = {
  estructura:   2,  // soporte de cargas sobre terreno
  muros_sep:    3,  // muros entre distintos propietarios o destinos
  cajas_esc:    4,  // cajas de escalera, ascensores y ductos
  muros_mismo:  5,  // muros entre unidades del mismo destino
  paredes_div:  6,  // paredes divisorias no estructurales
  cubierta:     7,  // cubierta con función de separación
  entrepisos:   8,  // entrepisos / cubierta sin función de separación
  escaleras:    9,  // escaleras
}

// ─── OGUC Tít. 4 Cap. 3 — Tabla 1: Destino + Superficie + N° Pisos → Letra ──
// Cada entrada: { m2Min, m2Max, letras: [piso1, piso2, ..., piso6, piso7+] }
// Fuente: OGUC Tabla 1, Tít. 4 Cap. 3 (Condiciones de Seguridad contra Incendio)
export const OGUC_TABLA1 = {
  Habitacional: [
    { m2Min: 0, m2Max: Infinity, letras: ['d','d','c','c','b','a','a'] },
  ],
  'Hoteles o similares': [
    { m2Min: 5001, m2Max: Infinity, letras: ['c','b','a','a','a','a','a'] },
    { m2Min: 1501, m2Max: 5000,     letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 501,  m2Max: 1500,     letras: ['c','c','b','b','a','a','a'] },
    { m2Min: 0,    m2Max: 500,      letras: ['d','c','b','b','a','a','a'] },
  ],
  Oficinas: [
    { m2Min: 1501, m2Max: Infinity, letras: ['c','c','b','b','a','a','a'] },
    { m2Min: 501,  m2Max: 1500,     letras: ['c','c','c','b','b','a','a'] },
    { m2Min: 0,    m2Max: 500,      letras: ['d','c','c','b','b','a','a'] },
  ],
  Museos: [
    { m2Min: 1501, m2Max: Infinity, letras: ['c','c','b','b','b','a','a'] },
    { m2Min: 501,  m2Max: 1500,     letras: ['c','c','c','b','b','a','a'] },
    { m2Min: 0,    m2Max: 500,      letras: ['d','c','c','b','b','a','a'] },
  ],
  'Salud (clínica, hospital, laboratorio)': [
    { m2Min: 1001, m2Max: Infinity, letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 1000,     letras: ['c','c','b','b','a','a','a'] },
  ],
  'Salud (policlínico)': [
    { m2Min: 401,  m2Max: Infinity, letras: ['c','c','b','b','b','a','a'] },
    { m2Min: 0,    m2Max: 400,      letras: ['d','c','c','b','b','a','a'] },
  ],
  'Restaurantes y fuentes de soda': [
    { m2Min: 501,  m2Max: Infinity, letras: ['b','a','a','a','a','a','a'] },
    { m2Min: 251,  m2Max: 500,      letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 250,      letras: ['d','c','c','b','b','a','a'] },
  ],
  'Locales comerciales': [
    { m2Min: 501,  m2Max: Infinity, letras: ['c','b','b','a','a','a','a'] },
    { m2Min: 201,  m2Max: 500,      letras: ['c','c','b','a','a','a','a'] },
    { m2Min: 0,    m2Max: 200,      letras: ['d','c','b','b','b','a','a'] },
  ],
  Bibliotecas: [
    { m2Min: 1501, m2Max: Infinity, letras: ['b','b','a','a','a','a','a'] },
    { m2Min: 501,  m2Max: 1500,     letras: ['b','b','b','a','a','a','a'] },
    { m2Min: 251,  m2Max: 500,      letras: ['c','b','b','b','a','a','a'] },
    { m2Min: 0,    m2Max: 250,      letras: ['d','c','b','b','a','a','a'] },
  ],
  'Centro reparación automotor': [
    { m2Min: 0, m2Max: Infinity, letras: ['d','c','c','b','b','b','a'] },
  ],
  'Edificios de estacionamiento': [
    { m2Min: 0, m2Max: Infinity, letras: ['d','c','c','c','b','b','a'] },
  ],
}

// Mapeo uso (app) → destino(s) OGUC Tabla 1
// Cuando un uso puede calificar en varios destinos OGUC, el usuario elige
// Educación e Industrial se rigen por Tabla 2 (ocupantes) — se usa RF_DEF como respaldo
export const USO_TO_OGUC = {
  Vivienda:   ['Habitacional'],
  Salud:      ['Salud (clínica, hospital, laboratorio)', 'Salud (policlínico)'],
  Oficina:    ['Oficinas'],
  Comercio:   ['Locales comerciales', 'Restaurantes y fuentes de soda'],
  Educacion:  [],   // Tabla 2 (ocupantes) — no cubierto por Tabla 1
  Industrial: [],   // Tabla 2 (ocupantes) — no cubierto por Tabla 1
}

// Obtiene la letra OGUC (a/b/c/d) para un destino, superficie y N° de pisos
// Retorna null si el destino no está en Tabla 1 o los datos son insuficientes
export function getLetraOGUC(destinoOGUC, m2, pisos) {
  const tabla = OGUC_TABLA1[destinoOGUC]
  if (!tabla || !m2 || !pisos) return null
  const m2n = parseFloat(m2)
  const pisosN = parseInt(pisos) || 1
  const rango = tabla.find(r => m2n >= r.m2Min && m2n <= r.m2Max)
  if (!rango) return null
  const idx = Math.min(pisosN - 1, 6)  // máx índice 6 para 7+ pisos
  return rango.letras[idx] || null
}

// Obtiene el RF (string) para una letra OGUC y una columna de elemento
// Retorna null si no aplica exigencia (guión en la tabla)
export function getRFDeLetra(letra, colElem) {
  return OGUC_RF_LETRAS[letra]?.[colElem] ?? null
}

// Función principal: dado uso de app, destino OGUC elegido, m², pisos y elemento → RF
// Retorna objeto { letra, rf, fuente } donde fuente indica si viene de Tabla 1 o RF_DEF fallback
export function getRFOGUC(uso, destinoOGUC, m2, pisos, elemId) {
  const col = OGUC_ELEM_COL[elemId]
  if (destinoOGUC && m2 && pisos && col) {
    const letra = getLetraOGUC(destinoOGUC, m2, pisos)
    if (letra) {
      const rf = getRFDeLetra(letra, col)
      return { letra, rf, fuente: 'oguc_tabla1' }
    }
  }
  // Fallback a RF_DEF cuando no hay datos suficientes o destino en Tabla 2
  const rfFallback = RF_DEF[uso]?.[elemId] || null
  return { letra: null, rf: rfFallback, fuente: 'rf_def_approx' }
}
export const AC_DEF={Vivienda:{entre_unidades:45,fachada:30,entre_pisos:45},Educacion:{entre_unidades:40,fachada:35,entre_pisos:40},Salud:{entre_unidades:50,fachada:40,entre_pisos:50},Oficina:{entre_unidades:40,fachada:30,entre_pisos:40},Comercio:{entre_unidades:40,fachada:30,entre_pisos:40},Industrial:{entre_unidades:50,fachada:35,entre_pisos:45}};
// Nivel máximo de ruido de impacto normalizado L'n,w (dB) — MENOR valor = MEJOR aislación
// NCh352:2013 / DS N°594 — entre_pisos para uso habitable
export const AC_IMPACT_DEF={
  Vivienda:   { entre_pisos: 65 },
  Educacion:  { entre_pisos: 60 },
  Salud:      { entre_pisos: 55 },
  Oficina:    { entre_pisos: 65 },
  Comercio:   { entre_pisos: 65 },
  Industrial: { entre_pisos: 65 },
};
export const RIESGO_INC={Vivienda:"R2 - Riesgo moderado",Educacion:"R2 - Riesgo moderado",Salud:"R2 - Riesgo moderado (R1 en algunos recintos)",Oficina:"R2 - Riesgo moderado",Comercio:"R3 - Riesgo alto",Industrial:"R3/R4 - Riesgo alto/muy alto"};
// Categoría de riesgo de incendio por destino — OGUC Tít. 4 Cap. 3
// El Tít. 4 Cap. 3 de la OGUC clasifica los edificios según su destino en categorías
// que determinan las exigencias de resistencia al fuego, evacuación y compartimentación.
// cat:   código de categoría de riesgo de incendio (R1–R4)
// grupo: agrupación de destinos equivalentes para efectos del Cap. 3
// desc:  descripción completa para informe y ficha normativa
// color: representación visual del nivel de riesgo
export const CATEG_FUEGO = {
  Vivienda:   { cat:'R2', grupo:'Habitacional',        desc:'Categoría R2 — Riesgo Moderado',                  color:'#f59e0b', bgColor:'#fffbeb', borderColor:'#fcd34d' },
  Educacion:  { cat:'R2', grupo:'Educacional',          desc:'Categoría R2 — Riesgo Moderado',                  color:'#f59e0b', bgColor:'#fffbeb', borderColor:'#fcd34d' },
  Salud:      { cat:'R1', grupo:'Asistencial / Salud',  desc:'Categoría R1 — Riesgo Bajo (R2 en zonas comunes)',color:'#22c55e', bgColor:'#f0fdf4', borderColor:'#86efac' },
  Oficina:    { cat:'R2', grupo:'Servicios / Oficinas', desc:'Categoría R2 — Riesgo Moderado',                  color:'#f59e0b', bgColor:'#fffbeb', borderColor:'#fcd34d' },
  Comercio:   { cat:'R3', grupo:'Comercial',            desc:'Categoría R3 — Riesgo Alto',                      color:'#ef4444', bgColor:'#fff1f2', borderColor:'#fecaca' },
  Industrial: { cat:'R4', grupo:'Industrial / Bodegaje',desc:'Categoría R4 — Riesgo Muy Alto',                  color:'#dc2626', bgColor:'#fef2f2', borderColor:'#fca5a5' },
};
export const RF_PISOS=(tipo,pisos)=>{const n=parseInt(pisos)||1;if(tipo==="Industrial")return n<=1?"F90":"F120";if(["Salud","Educacion"].includes(tipo))return n<=2?"F60":n<=4?"F90":"F120";if(tipo==="Vivienda")return n<=2?"F30":n<=5?"F60":"F90";return n<=2?"F60":"F90";};
// RF requerida por elemento constructivo (OGUC Art. 4.5.4 / LOFC Ed.17)
// id: 'muro' | 'techo' | 'piso' | 'tabique' | 'ventana' | 'puerta'
export const RF_ELEM_REQ=(id,uso,pisos)=>{
  const rfDef=RF_DEF[uso]||{};
  switch(id){
    case 'muro':    return rfDef.muros_sep||'';
    case 'techo':   return rfDef.cubierta||'';
    case 'piso':    return RF_PISOS(uso,pisos)||'';
    case 'tabique': return rfDef.muros_sep||'';
    default: return '';
  }
};
export const OBS_EST={"Hormigon armado":"LOFC Ed.17 A.1.3: H.A. 100mm=F90, 150mm=F150, 200mm=F180. Verificar recubrimiento segun NCh430.","Albanileria confinada":"LOFC Ed.17 A.2.2: Ladrillo Santiago 7 (140mm)=F240, Santiago 9 (140mm)=F180. Verificar pilares y cadenas de HA.","Albanileria armada":"LOFC Ed.17: similar a confinada. Albañileria ceramica 140mm cumple F180 min. Verificar armadura interior.","Estructura de acero":"RF0 intrínseca — requiere protección ignífuga para todo nivel RF. LOFC Ed.17 Annex B: hormigón proy. 25mm=F30 / 35mm=F60 / 50mm=F120; yeso proy. y lana de roca según factor Hp/A. Usa el calculador de acero en la pestaña Fuego.","Metalframe (acero liviano)":"RF0 intrínseca — perfiles de acero galvanizado pierden resistencia a ~500°C igual que acero estructural. DS N°76 MINVU / NCh427/1. Requiere protección ignífuga equivalente a Estructura de acero. Revestir con planchas yeso-cartón tipo F, lana mineral o mortero ignífugo segun LOFC Ed.17 Annex B.","Estructura de madera":"LOFC Ed.17 A.1.5: madera maciza 45mm=F30, 90mm=F60, 140mm=F90. Carbonizacion ~0.7mm/min. Calcular seccion residual segun NCh1198.","Mixta HA + albanileria":"Verificar elemento a elemento. LOFC Ed.17: HA 150mm=F150, albañileria ceramica 140mm=F180+. Determinar elemento critico."};
// RF intrínseca por sistema estructural — configuración estándar (LOFC Ed.17 2025)
// HA 150mm, albañilería cerámica 140mm, madera maciza 90mm
export const RF_EST={"Hormigon armado":"F150","Albanileria confinada":"F180","Albanileria armada":"F180","Estructura de acero":"F0","Metalframe (acero liviano)":"F0","Estructura de madera":"F60","Mixta HA + albanileria":"F150"};

// ─── CARGA DE OCUPACIÓN — OGUC Art. 4.2.4 ────────────────────────────────────
// Factor: m² de superficie útil por persona (densidad de ocupación)
// Fuente: OGUC Art. 4.2.4 Tabla — valores representativos por destino
export const CARGA_OCUP_DENSIDAD = {
  Vivienda:   { factor: 18,   desc: 'Habitacional — 18 m²/pers.',           ref: 'OGUC Art. 4.2.4' },
  Educacion:  { factor: 2,    desc: 'Educación — 2 m²/pers. (aulas)',        ref: 'OGUC Art. 4.2.4' },
  Salud:      { factor: 10,   desc: 'Salud — 10 m²/pers.',                   ref: 'OGUC Art. 4.2.4' },
  Oficina:    { factor: 9.3,  desc: 'Oficinas — 9.3 m²/pers.',               ref: 'OGUC Art. 4.2.4' },
  Comercio:   { factor: 2.8,  desc: 'Comercio — 2.8 m²/pers. (locales)',     ref: 'OGUC Art. 4.2.4' },
  Industrial: { factor: 9.3,  desc: 'Industrial — 9.3 m²/pers.',             ref: 'OGUC Art. 4.2.4' },
}

// OGUC Tít. 4 Cap. 3 — Tabla 2: Establecimientos educacionales
// Letra (a–d) según N° de ocupantes × N° de pisos
// Fuente: OGUC Tít. 4 Cap. 3 Tabla 2
export const OGUC_TABLA2_EDUC = [
  { ocMin: 1001, ocMax: Infinity, letras: ['b','a','a','a','a','a','a'] },
  { ocMin:  251, ocMax: 1000,     letras: ['c','b','a','a','a','a','a'] },
  { ocMin:   51, ocMax:  250,     letras: ['d','c','b','b','a','a','a'] },
  { ocMin:    0, ocMax:   50,     letras: ['d','d','c','c','b','a','a'] },
]

export function getLetraOGUC_T2_Educ(ocupantes, pisos) {
  const oc = parseInt(ocupantes) || 0
  if (!oc) return null
  const pisosN = parseInt(pisos) || 1
  const rango = OGUC_TABLA2_EDUC.find(r => oc >= r.ocMin && oc <= r.ocMax)
  if (!rango) return null
  const idx = Math.min(pisosN - 1, 6)
  return rango.letras[idx] || null
}

// ─── ACERO ESTRUCTURAL — Factor de sección y protección ignífuga ──────────────
// Hp/A (m⁻¹): perímetro expuesto / área sección transversal
// Hp4 = 4 caras expuestas (columna), Hp3 = 3 caras (viga, cara inferior protegida por losa)
// Datos representativos según EN 10034 / tablas del fabricante; verificar con tablas oficiales
export const PERFILES_ACERO = {
  HEB: {
    '100':{ A:26.0,  Hp4:422, Hp3:320 }, '120':{ A:34.0,  Hp4:508, Hp3:382 },
    '140':{ A:43.0,  Hp4:580, Hp3:440 }, '160':{ A:54.3,  Hp4:648, Hp3:494 },
    '180':{ A:65.3,  Hp4:714, Hp3:547 }, '200':{ A:78.1,  Hp4:768, Hp3:590 },
    '240':{ A:106,   Hp4:964, Hp3:740 }, '260':{ A:118,   Hp4:1020,Hp3:786 },
    '300':{ A:149,   Hp4:1142,Hp3:880 }, '320':{ A:161,   Hp4:1214,Hp3:935 },
    '360':{ A:181,   Hp4:1358,Hp3:1047},'400':{ A:198,   Hp4:1502,Hp3:1159},
  },
  IPE: {
    '100':{ A:10.3,  Hp4:382, Hp3:294 }, '120':{ A:13.2,  Hp4:440, Hp3:338 },
    '140':{ A:16.4,  Hp4:498, Hp3:382 }, '160':{ A:20.1,  Hp4:554, Hp3:426 },
    '180':{ A:23.9,  Hp4:610, Hp3:470 }, '200':{ A:28.5,  Hp4:678, Hp3:522 },
    '240':{ A:39.1,  Hp4:808, Hp3:622 }, '270':{ A:45.9,  Hp4:900, Hp3:694 },
    '300':{ A:53.8,  Hp4:994, Hp3:766 }, '360':{ A:72.7,  Hp4:1176,Hp3:908 },
    '400':{ A:84.5,  Hp4:1298,Hp3:1002},'450':{ A:98.8,  Hp4:1462,Hp3:1130},
    '500':{ A:116,   Hp4:1618,Hp3:1250},'600':{ A:156,   Hp4:1934,Hp3:1496},
  },
}

// Sistemas de protección ignífuga — tablas LOFC Ed.17 Annex B / EN 13381
// tipo 'espesor': tabla = [{hpMax, e_mm, rf}]  (hpMax=999 → independiente de Hp/A)
// tipo 'capas':   tabla = [{hpMax, capas, e_mm, rf}]
// tipo 'dft':     requiereCertificado=true → solo orientación genérica
export const ACERO_PROT = [
  {
    id:'hormigon', nombre:'Hormigón proyectado / encamisado (f\'c ≥ 20 MPa)',
    norma:'LOFC Ed.17 B.1.2', tipo:'espesor', unidad:'mm',
    desc:'Independiente del factor de sección para perfiles con Hp/A < 300 m⁻¹. Verificar adherencia y curado húmedo 7 días.',
    tabla:[
      { hpMax:999, e:25, rf:'F30' },
      { hpMax:999, e:35, rf:'F60' },
      { hpMax:999, e:50, rf:'F120' },
    ]
  },
  {
    id:'yeso_proy', nombre:'Yeso proyectado / vermiculita (ρ ≥ 650 kg/m³)',
    norma:'LOFC Ed.17 B.1.3 / EN 13381-4', tipo:'espesor', unidad:'mm',
    desc:'Espesor nominal mínimo. Verificar DFT con medición en malla NCh1156. Aplicación en capas de máx. 10 mm cada una.',
    tabla:[
      { hpMax:100, e:15, rf:'F30'  }, { hpMax:200, e:20, rf:'F30'  }, { hpMax:300, e:25, rf:'F30'  },
      { hpMax:100, e:20, rf:'F60'  }, { hpMax:200, e:25, rf:'F60'  }, { hpMax:300, e:35, rf:'F60'  },
      { hpMax:100, e:30, rf:'F90'  }, { hpMax:200, e:35, rf:'F90'  }, { hpMax:300, e:45, rf:'F90'  },
      { hpMax:100, e:40, rf:'F120' }, { hpMax:200, e:50, rf:'F120' }, { hpMax:300, e:60, rf:'F120' },
    ]
  },
  {
    id:'lana_roca', nombre:'Planchas lana de roca / silicato cálcico (ρ ≥ 100 kg/m³)',
    norma:'EN 13381-4 / ETA fabricante', tipo:'espesor', unidad:'mm',
    desc:'Planchas rígidas fijadas mecánicamente. Verificar ETA específico del fabricante. Juntas escalonadas en multicapa.',
    tabla:[
      { hpMax:100, e:20, rf:'F30'  }, { hpMax:200, e:25, rf:'F30'  }, { hpMax:300, e:30, rf:'F30'  },
      { hpMax:100, e:30, rf:'F60'  }, { hpMax:200, e:35, rf:'F60'  }, { hpMax:300, e:45, rf:'F60'  },
      { hpMax:100, e:40, rf:'F90'  }, { hpMax:200, e:50, rf:'F90'  }, { hpMax:300, e:60, rf:'F90'  },
      { hpMax:100, e:50, rf:'F120' }, { hpMax:200, e:65, rf:'F120' }, { hpMax:300, e:80, rf:'F120' },
    ]
  },
  {
    id:'yeso_carton', nombre:'Planchas yeso-cartón tipo F (multicapa)',
    norma:'EN 520 / EN 13501-2', tipo:'capas', unidad:'capas × mm/capa',
    desc:'Planchas tipo F (especial fuego). Juntas escalonadas entre capas. Fijación cada 200 mm. Verificar marca CE.',
    tabla:[
      { hpMax:200, capas:2, e:12.5, rf:'F30'  }, { hpMax:200, capas:1, e:15,   rf:'F30'  },
      { hpMax:250, capas:3, e:12.5, rf:'F60'  }, { hpMax:250, capas:2, e:15,   rf:'F60'  },
      { hpMax:300, capas:4, e:12.5, rf:'F90'  }, { hpMax:300, capas:3, e:15,   rf:'F90'  },
      { hpMax:200, capas:4, e:15,   rf:'F120' },
    ]
  },
  {
    id:'intumescente', nombre:'Pintura intumescente (WB / SB)',
    norma:'EN 13381-8 / ETA fabricante', tipo:'dft', unidad:'µm DFT',
    requiereCertificado: true,
    desc:'DFT orientativo según rangos de mercado EN 13381-8. El espesor exacto (DFT nominal) debe obtenerse del software del fabricante con ETA vigente para el Hp/A y RF específicos. Exige certificado de aplicación NCh1198 con medición DFT en terreno.',
    // Rangos orientativos DFT mínimo (µm) según Hp/A y RF — fuente: EN 13381-8, rangos típicos WB
    // Los valores exactos requieren ETA del fabricante — estos son límites inferiores de referencia
    tabla:[
      { hpMax: 80,  rf:'F30', dftMin: 200 }, { hpMax: 80,  rf:'F60', dftMin: 450  }, { hpMax: 80,  rf:'F90', dftMin: 800  }, { hpMax: 80,  rf:'F120', dftMin: 1400 },
      { hpMax:150,  rf:'F30', dftMin: 380 }, { hpMax:150,  rf:'F60', dftMin: 780  }, { hpMax:150,  rf:'F90', dftMin: 1400 }, { hpMax:150,  rf:'F120', dftMin: 2400 },
      { hpMax:200,  rf:'F30', dftMin: 500 }, { hpMax:200,  rf:'F60', dftMin:1000  }, { hpMax:200,  rf:'F90', dftMin: 1800 }, { hpMax:200,  rf:'F120', dftMin: 3200 },
      { hpMax:300,  rf:'F30', dftMin: 700 }, { hpMax:300,  rf:'F60', dftMin:1400  }, { hpMax:300,  rf:'F90', dftMin: 2500 },
      { hpMax:400,  rf:'F30', dftMin:1000 }, { hpMax:400,  rf:'F60', dftMin:2000  },
    ]
  },
]

// ─── MATERIALES ───────────────────────────────────────────────────────────────
export const MATS=[
  {g:"Hormigon y mortero",items:[{n:"Hormigon armado",lam:2.50,mu:130},{n:"Hormigon simple",lam:1.63,mu:130},{n:"Mortero cemento",lam:1.40,mu:25},{n:"Mortero yeso",lam:0.40,mu:10}]},
  {g:"Albanileria",items:[{n:"Ladrillo ceramico macizo",lam:0.70,mu:10},{n:"Ladrillo ceramico perforado",lam:0.48,mu:8},{n:"Bloque hormigon",lam:1.00,mu:15},{n:"Bloque ceramico poroso",lam:0.27,mu:5}]},
  {g:"Madera y derivados",items:[{n:"Madera pino/coigue",lam:0.14,mu:50},{n:"OSB/MDF",lam:0.23,mu:200},{n:"Yeso carton",lam:0.26,mu:8},{n:"Fibrocemento",lam:0.23,mu:50},{n:"Contrachapado",lam:0.17,mu:300}]},
  {g:"Aislantes termicos",items:[{n:"EPS 10kg/m3",lam:0.047,mu:40},{n:"EPS 15kg/m3",lam:0.043,mu:40},{n:"EPS 20kg/m3",lam:0.040,mu:60},{n:"XPS extruido",lam:0.036,mu:100},{n:"Lana vidrio 10kg",lam:0.040,mu:1},{n:"Lana vidrio 13kg",lam:0.036,mu:1},{n:"Lana mineral 30kg",lam:0.035,mu:1},{n:"PU proyectado",lam:0.026,mu:50},{n:"Fibra poliester",lam:0.038,mu:2},{n:"Corcho aglomerado",lam:0.045,mu:20},{n:"Lana oveja",lam:0.039,mu:1},{n:"Fibra madera",lam:0.040,mu:5}]},
  {g:"Revestimientos",items:[{n:"Vidrio monolitico",lam:1.00,mu:9999},{n:"Ceramica/porcelanato",lam:1.30,mu:200},{n:"Pintura/estuco",lam:0.70,mu:25},{n:"Lamina impermeable",lam:0.23,mu:9999}]}
];
export const ALL_MATS=MATS.flatMap(g=>g.items);

// ─── RESISTENCIAS SUPERFICIALES (NCh853 / ISO 6946) ──────────────────────────
// BUG-03 FIX: RSE varía según elemento (no es 0.04 para todos)
export const RSI_MAP={muro:0.13,techo:0.10,piso:0.17};
// RSE por tipo de elemento — piso ventilado usa 0.13, muro/techo 0.04
export const RSE_MAP={muro:0.04,techo:0.04,piso:0.13};
export const RSE=0.04; // valor por defecto (muro/techo)
export const RCAMARA=0.18;

// ─── Materiales de estructura integrada (ISO 6946 / NCh853 — Puentes térmicos) ──
// λ_Pino Radiata ≈ 0.13 W/mK  (NCh433:1993 / EN ISO 10456 Tabla B.4)
// λ_Acero gal.   ≈ 50.0 W/mK  (EN ISO 10456:2007 Tabla 3 — aceros al carbono)
// μ_Acero ≈ 1e6  → barrera de vapor total (irrelevante para Glaser — solo térmica)
export const STRUCT_MATS = {
  madera: { label: 'Madera (Pino Radiata)',        lam: 0.13, mu: 3,       color: '#92400e' },
  acero:  { label: 'Acero (Metalcon / Perfil C)',  lam: 50.0, mu: 1000000, color: '#334155' },
};

// ─── CAPAS DETALLADAS POR SOLUCION (NCh853 / LOSCAT Ed.13) ───────────────────
export const SC_CAPAS={
  "1.2.M.A25.1":[{mat:"Hormigon armado",lam:2.50,esp:150,mu:130},{mat:"PU proyectado",lam:0.027,esp:60,mu:50},{mat:"Pasta elastomerica",lam:0.70,esp:2,mu:25}],
  "1.2.M.B16.1":[{mat:"Ladrillo ceramico perforado",lam:0.48,esp:140,mu:8},{mat:"PU proyectado",lam:0.027,esp:60,mu:50},{mat:"Pasta elastomerica",lam:0.70,esp:2,mu:25}],
  "1.2.M.A23.1":[{mat:"Hormigon armado",lam:2.50,esp:100,mu:130},{mat:"EPS 20kg/m3",lam:0.038,esp:60,mu:60},{mat:"Mortero cemento",lam:0.70,esp:6,mu:25}],
  "1.2.M.A22.2":[{mat:"Hormigon armado",lam:2.50,esp:150,mu:130},{mat:"EPS 15kg/m3",lam:0.041,esp:80,mu:40},{mat:"Corcho aglomerado",lam:0.045,esp:5,mu:20}],
  "1.2.M.A21.1":[{mat:"Ladrillo ceramico macizo",lam:0.70,esp:140,mu:10},{mat:"EPS 20kg/m3",lam:0.040,esp:60,mu:60},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  "1.2.G.C1.3":[{mat:"Yeso carton",lam:0.26,esp:10,mu:8},{mat:"Lana vidrio 10kg",lam:0.046,esp:60,mu:1},{mat:"OSB/MDF",lam:0.23,esp:9,mu:200},{mat:"Lana vidrio 10kg",lam:0.046,esp:40,mu:1},{mat:"Fibrocemento",lam:0.23,esp:6,mu:50}],
  "1.2.G.C1.4":[{mat:"Yeso carton",lam:0.26,esp:10,mu:8},{mat:"Lana vidrio 10kg",lam:0.042,esp:50,mu:1},{mat:"OSB/MDF",lam:0.23,esp:9,mu:200},{mat:"EPS 20kg/m3",lam:0.038,esp:10,mu:60},{mat:"Mortero cemento",lam:1.40,esp:15,mu:25}],
  // Metalframe — SC_CAPAS
  "2.2.M.MF1.1":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:75,mu:1},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8}],
  "2.2.M.MF1.2":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:90,mu:1},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8}],
  "2.2.M.MF2.1":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:90,mu:1},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8}],
  "2.2.M.MF2.2":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:100,mu:1},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8}],
  "2.2.M.MF3.1":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:90,mu:1},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8}],
  "2.2.M.MF4.1":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:90,mu:1},{mat:"OSB/MDF",lam:0.23,esp:9,mu:200},{mat:"XPS 35kg/m3",lam:0.034,esp:50,mu:150},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  "2.2.T.MF1.1":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:100,mu:1},{mat:"OSB/MDF",lam:0.23,esp:15,mu:200}],
  "2.2.T.MF1.2":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:150,mu:1},{mat:"OSB/MDF",lam:0.23,esp:15,mu:200}],
  "2.2.T.MF2.1":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:200,mu:1},{mat:"OSB/MDF",lam:0.23,esp:15,mu:200}],
  "2.2.P.MF1.1":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:50,mu:1},{mat:"OSB/MDF",lam:0.23,esp:18,mu:200}],
  "2.2.P.MF1.2":[{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Yeso carton F",lam:0.26,esp:12.5,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:100,mu:1},{mat:"OSB/MDF",lam:0.23,esp:18,mu:200}],
  "1.2.M.F2.3":[{mat:"Mortero cemento",lam:1.40,esp:30,mu:25},{mat:"EPS 10kg/m3",lam:0.043,esp:90,mu:40},{mat:"Mortero cemento",lam:1.40,esp:30,mu:25}],
  "1.2.M.F2.5":[{mat:"Mortero cemento",lam:1.40,esp:30,mu:25},{mat:"EPS 10kg/m3",lam:0.043,esp:140,mu:40},{mat:"Mortero cemento",lam:1.40,esp:30,mu:25}],
  "1.2.T.A1.1":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:75,mu:1},{mat:"Yeso carton",lam:0.26,esp:13,mu:8}],
  "1.2.T.A1.2":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:100,mu:1},{mat:"Yeso carton",lam:0.26,esp:13,mu:8}],
  "1.2.T.B1.1":[{mat:"Mortero yeso",lam:0.40,esp:10,mu:10},{mat:"Ladrillo ceramico macizo",lam:0.70,esp:140,mu:10},{mat:"Mortero yeso",lam:0.40,esp:10,mu:10}],
  "1.2.T.C1.1":[{mat:"Hormigon armado",lam:2.50,esp:150,mu:130}],
  "1.1.P.A1.2":[{mat:"Fibrocemento",lam:0.23,esp:1,mu:50},{mat:"Lana mineral 30kg",lam:0.035,esp:100,mu:1},{mat:"Fibrocemento",lam:0.23,esp:1,mu:50}],
  "1.1.P.A1.3":[{mat:"Fibrocemento",lam:0.23,esp:1,mu:50},{mat:"Lana mineral 30kg",lam:0.035,esp:150,mu:1},{mat:"Fibrocemento",lam:0.23,esp:1,mu:50}],
  "1.1.M.B4.1.1":[{mat:"EPS 10kg/m3",lam:0.041,esp:100,mu:40},{mat:"Hormigon simple",lam:1.63,esp:110,mu:130},{mat:"Yeso carton",lam:0.26,esp:10,mu:8}],
  "1.1.M.B4.1.2":[{mat:"EPS 10kg/m3",lam:0.041,esp:130,mu:40},{mat:"Hormigon simple",lam:1.63,esp:140,mu:130},{mat:"Yeso carton",lam:0.26,esp:10,mu:8}],
  "1.3.M.A6.1":[{mat:"Hormigon armado",lam:2.50,esp:120,mu:130},{mat:"EPS 20kg/m3",lam:0.040,esp:60,mu:60}],
  "1.4.M.A1.1":[{mat:"Hormigon armado",lam:2.50,esp:120,mu:130},{mat:"EPS 20kg/m3",lam:0.040,esp:60,mu:60}],
  "1.4.M.A1.2":[{mat:"Hormigon armado",lam:2.50,esp:120,mu:130},{mat:"EPS 20kg/m3",lam:0.040,esp:80,mu:60}],
  // ── Muros H.A. variantes ─────────────────────────────────────────────────
  "1.2.M.A24.1":[{mat:"Hormigon armado",lam:2.50,esp:200,mu:130},{mat:"Lana mineral 30kg",lam:0.035,esp:80,mu:1},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  // ── Muros Albañilería variantes ───────────────────────────────────────────
  "1.2.M.B15.1":[{mat:"Ladrillo ceramico perforado",lam:0.48,esp:140,mu:8},{mat:"XPS extruido",lam:0.036,esp:60,mu:100},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  "1.2.M.B17.1":[{mat:"Ladrillo ceramico perforado",lam:0.48,esp:190,mu:8},{mat:"EPS 20kg/m3",lam:0.040,esp:80,mu:60},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  // ── Muros Entramado madera ────────────────────────────────────────────────
  "1.2.G.M1.1":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:90,mu:1},{mat:"OSB/MDF",lam:0.23,esp:11,mu:200},{camara:true},{mat:"Fibrocemento",lam:0.23,esp:8,mu:50}],
  "1.2.G.M1.2":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:90,mu:1},{mat:"OSB/MDF",lam:0.23,esp:11,mu:200},{mat:"XPS extruido",lam:0.036,esp:40,mu:100},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  "1.2.G.M1.3":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:140,mu:1},{mat:"OSB/MDF",lam:0.23,esp:11,mu:200},{mat:"Fibrocemento",lam:0.23,esp:8,mu:50}],
  "1.2.G.M1.4":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:140,mu:1},{mat:"OSB/MDF",lam:0.23,esp:11,mu:200},{mat:"EPS 20kg/m3",lam:0.040,esp:60,mu:60},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  "1.2.G.M2.1":[{mat:"OSB/MDF",lam:0.23,esp:12,mu:200},{mat:"EPS 20kg/m3",lam:0.040,esp:100,mu:60},{mat:"OSB/MDF",lam:0.23,esp:12,mu:200}],
  "1.2.G.M2.2":[{mat:"OSB/MDF",lam:0.23,esp:12,mu:200},{mat:"EPS 20kg/m3",lam:0.040,esp:150,mu:60},{mat:"OSB/MDF",lam:0.23,esp:12,mu:200}],
  "1.2.G.M3.1":[{mat:"Madera pino/coigue",lam:0.14,esp:90,mu:50},{mat:"XPS extruido",lam:0.036,esp:60,mu:100},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  "1.2.G.M3.2":[{mat:"Madera pino/coigue",lam:0.14,esp:120,mu:50},{mat:"Lana mineral 30kg",lam:0.035,esp:80,mu:1},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  "1.2.G.A1.1":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:90,mu:1},{mat:"Lana mineral 30kg",lam:0.035,esp:40,mu:1},{mat:"Fibrocemento",lam:0.23,esp:8,mu:50}],
  "1.2.G.A1.2":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:65,mu:1},{mat:"OSB/MDF",lam:0.23,esp:9,mu:200},{mat:"XPS extruido",lam:0.036,esp:60,mu:100},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  // ── Losa H.A. cubierta variante ───────────────────────────────────────────
  "1.3.M.A6.2":[{mat:"Hormigon armado",lam:2.50,esp:120,mu:130},{mat:"Lana mineral 30kg",lam:0.035,esp:100,mu:1},{mat:"Lamina impermeable",lam:0.23,esp:5,mu:9999}],
  // ── Techumbres Entramado madera ───────────────────────────────────────────
  "1.1.G.M1.1":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:100,mu:1},{mat:"OSB/MDF",lam:0.23,esp:20,mu:200},{mat:"Lamina impermeable",lam:0.23,esp:3,mu:9999}],
  "1.1.G.M1.2":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:150,mu:1},{mat:"OSB/MDF",lam:0.23,esp:20,mu:200}],
  "1.1.G.M1.3":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:200,mu:1},{mat:"XPS extruido",lam:0.036,esp:30,mu:100},{mat:"OSB/MDF",lam:0.23,esp:20,mu:200}],
  "1.1.G.M2.1":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:80,mu:1},{mat:"OSB/MDF",lam:0.23,esp:15,mu:200},{mat:"Lamina impermeable",lam:0.23,esp:3,mu:9999}],
  "1.1.G.A1.1":[{mat:"Lamina impermeable",lam:0.23,esp:1,mu:9999},{mat:"PU proyectado",lam:0.026,esp:100,mu:50},{mat:"Lamina impermeable",lam:0.23,esp:1,mu:9999}],
  "1.1.G.A1.2":[{mat:"Lamina impermeable",lam:0.23,esp:1,mu:9999},{mat:"Lana mineral 30kg",lam:0.035,esp:150,mu:1},{mat:"Lamina impermeable",lam:0.23,esp:1,mu:9999}],
  // ── Pisos Entramado madera ────────────────────────────────────────────────
  "1.4.G.M1.1":[{mat:"Yeso carton",lam:0.26,esp:13,mu:8},{mat:"Lana mineral 30kg",lam:0.035,esp:100,mu:1},{mat:"OSB/MDF",lam:0.23,esp:18,mu:200},{mat:"OSB/MDF",lam:0.23,esp:18,mu:200}],
  "1.4.G.M1.2":[{mat:"OSB/MDF",lam:0.23,esp:18,mu:200},{mat:"Lana mineral 30kg",lam:0.035,esp:100,mu:1},{mat:"Lamina impermeable",lam:0.23,esp:2,mu:9999},{mat:"Yeso carton",lam:0.26,esp:13,mu:8}],
  "1.4.G.M2.1":[{mat:"XPS extruido",lam:0.036,esp:40,mu:100},{mat:"OSB/MDF",lam:0.23,esp:18,mu:200},{mat:"Lana mineral 30kg",lam:0.035,esp:150,mu:1},{mat:"Lamina impermeable",lam:0.23,esp:2,mu:9999},{mat:"Yeso carton",lam:0.26,esp:13,mu:8}],
};

// BUG-03 FIX: calcU_SC usa RSE correcto según elemento
export const calcU_SC=(cod,elem)=>{
  const src=SC_CAPAS[cod]; if(!src) return null;
  const rsiKey=elem==="techumbre"?"techo":elem==="piso"?"piso":"muro";
  const rsi=RSI_MAP[rsiKey]||0.13;
  const rse=RSE_MAP[rsiKey]||0.04;
  let R=rsi+rse;
  for(const c of src){
    if(c.camara){R+=RCAMARA;continue;}
    R+=(c.esp/1000)/c.lam;
  }
  return parseFloat((1/R).toFixed(4));
};

// ─── ISO 6946:2017 / NCh853:2021 — Método Combinado ─────────────────────────────
// Calcula R_T con la técnica de límites superior e inferior para elementos
// con puentes térmicos de montantes (madera o acero). Es el método que
// exige un certificador energético o la DOM para entramados.
//
// cv: array de capas con `esp` en METROS (igual que en calcGlaser).
// Cada capa puede llevar `estructura_integrada: { tipo, lam, ancho_mm, distancia_mm }`.
//
// Algoritmo (ISO 6946:2017 §6.4-6.6):
//   R_T,upper → planos isotérmicos: capa mixta tratada en paralelo
//   R_T,lower → caminos paralelos completos int → ext
//   R_T = (R_T,upper + R_T,lower) / 2   →  U_T = 1 / R_T
function calcR_ISO6946_helper(cv, elemTipo) {
  const rsiKey = elemTipo === 'techumbre' ? 'techo' : elemTipo === 'piso' ? 'piso' : 'muro';
  const rsi = RSI_MAP[rsiKey] || 0.13;
  const rse = RSE_MAP[rsiKey] || 0.04;

  // R efectivo por capa (planos isotérmicos — mezcla paralela para capa mixta)
  function Reff(c) {
    if (c.esCamara || c.camara) return RCAMARA;
    if (c.estructura_integrada) {
      const eb = c.estructura_integrada;
      const fa = Math.min(Math.max(eb.ancho_mm / eb.distancia_mm, 0.01), 0.99);
      const Rs = c.esp / eb.lam;    // R montante  [m²K/W]
      const Ri = c.esp / c.lam;     // R aislante  [m²K/W]
      return 1 / (fa / Rs + (1 - fa) / Ri);   // ISO 6946 Ec. 6.4 — paralelo
    }
    return c.esp / c.lam;
  }

  // Buscar primera capa con estructura integrada
  const mixed = cv.find(c => !c.esCamara && !c.camara && c.estructura_integrada);
  if (!mixed) {
    // Sin estructura → serie simple
    const R = rsi + rse + cv.reduce((s, c) => s + Reff(c), 0);
    return { R_T: R, R_upper: R, R_lower: R, fa: 0, fb: 1, method: 'serie', hasEB: false };
  }

  // ── R_T,upper — planos isotérmicos (Ec. 6.4) ─────────────────────────────────
  const R_upper = rsi + rse + cv.reduce((s, c) => s + Reff(c), 0);

  // ── R_T,lower — caminos paralelos int→ext (Ec. 6.5) ─────────────────────────
  const eb  = mixed.estructura_integrada;
  const fa  = Math.min(Math.max(eb.ancho_mm / eb.distancia_mm, 0.01), 0.99);
  const fb  = 1 - fa;
  const R_struct_lay = mixed.esp / eb.lam;    // R del montante a su espesor
  const R_ins_lay    = mixed.esp / mixed.lam; // R del aislante a su espesor

  // R común a ambos caminos (capas no mixtas)
  let R_comun = rsi + rse;
  for (const c of cv) {
    if (c === mixed) continue;
    if (c.esCamara || c.camara) { R_comun += RCAMARA; continue; }
    R_comun += c.esp / c.lam;
  }
  const R_A     = R_comun + R_struct_lay;   // camino A: int → montante → ext
  const R_B     = R_comun + R_ins_lay;      // camino B: int → aislante  → ext
  const R_lower = 1 / (fa / R_A + fb / R_B);

  // ── R_T final — media aritmética (Ec. 6.6) ───────────────────────────────────
  const R_T = (R_upper + R_lower) / 2;
  return { R_T, R_upper, R_lower, fa, fb, method: 'iso6946', hasEB: true };
}

// Exportado para uso directo desde App.jsx (diagnóstico detallado de puente térmico)
export function calcU_ISO6946(cv, elemTipo) {
  if (!cv || !cv.length) return null;
  const iso = calcR_ISO6946_helper(cv, elemTipo);
  const U   = parseFloat((1 / iso.R_T).toFixed(4));

  // Alerta cuando la estructura es acero: cuantificar incremento de U
  const aceroLayer = cv.find(c => c.estructura_integrada?.tipo === 'acero');
  let aviso_puente = null;
  if (aceroLayer) {
    const cvSin  = cv.map(c => c.estructura_integrada ? { ...c, estructura_integrada: null } : c);
    const R_sin  = calcR_ISO6946_helper(cvSin, elemTipo).R_T;
    const U_sin  = parseFloat((1 / R_sin).toFixed(4));
    const pct    = Math.round((U - U_sin) / U_sin * 100);
    aviso_puente = { tipo: 'acero', U_sin_tb: U_sin, U_con_tb: U, pct };
  }

  return {
    U:       U.toFixed(4),
    R_T:     iso.R_T.toFixed(4),
    R_upper: iso.R_upper.toFixed(4),
    R_lower: iso.R_lower.toFixed(4),
    fa: iso.fa, fb: iso.fb, method: iso.method,
    aviso_puente,
  };
}

export const buildCapas=(cod)=>{
  const src=SC_CAPAS[cod]; if(!src) return null;
  return src.map((c,i)=>c.camara
    ?{id:Date.now()+i+Math.random(),mat:"",lam:"",esp:"",mu:"",esCamara:true}
    :{id:Date.now()+i+Math.random(),mat:c.mat,lam:String(c.lam),esp:String(c.esp),mu:String(c.mu),esCamara:false}
  );
};

// ─── SOLUCIONES CONSTRUCTIVAS ─────────────────────────────────────────────────
export const SC=[
  // ── MUROS — Hormigón armado ───────────────────────────────────────────────
  {cod:"1.2.M.A25.1",elem:"muro",sistemas:["Hormigon armado"],desc:"H.A. 15cm + PU proyectado TIFF 60mm (LOSCAT Ed.13)",capas:"H.A. 150 | PU proy. 60 | Pasta elastomerica 2",u:0.41,rf:"F150",ac_rw:52,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio","Industrial"],obs:"LOSCAT 1.2.M.A25.1 + LOFC Ed.17 A.1.3. HA 150mm=F150. U=0.41@60mm, 0.35@70mm, 0.29@80mm."},
  {cod:"1.2.M.A23.1",elem:"muro",sistemas:["Hormigon armado"],desc:"H.A. 10cm + PROSOL SATE EPS 20kg 60mm (LOSCAT Ed.13)",capas:"H.A. 100 | EPS 20kg 60 | Malla fibra vidrio | Mortero mineral",u:0.56,rf:"F90",ac_rw:51,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"LOSCAT 1.2.M.A23.1 + LOFC Ed.17 A.1.3. HA 100mm=F90. U=0.56@60mm, 0.43@80mm, 0.35@100mm. Verificar clase RF EPS."},
  {cod:"1.2.M.A22.2",elem:"muro",sistemas:["Hormigon armado"],desc:"H.A. 15cm + EPS 15kg 80mm + corcho Isolcork (LOSCAT Ed.13)",capas:"H.A. 150 | EPS 15kg 80 | Malla | Corcho proyectado",u:0.45,rf:"F150",ac_rw:50,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOSCAT 1.2.M.A22.2 + LOFC Ed.17 A.1.3. HA 150mm=F150. EPS 15kg lambda=0.0413. U=0.45@80mm, 0.39@95mm. Corcho proyectado ISOLCORK como terminacion."},
  {cod:"1.2.M.A24.1",elem:"muro",sistemas:["Hormigon armado"],desc:"H.A. 20cm + lana mineral SATE exterior 80mm",capas:"H.A. 200 | Lana mineral 80 | Malla | Revoque mineral",u:0.44,rf:"F180",ac_rw:54,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"HA 200mm=F180. Lana mineral lambda=0.04. U=0.44@80mm. Alta masa acustica."},
  // ── MUROS — Albañilería ───────────────────────────────────────────────────
  {cod:"1.2.M.B16.1",elem:"muro",sistemas:["Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Albanileria confinada Santiago 9 + PU proyectado TIFF 60mm (LOSCAT Ed.13)",capas:"Albanileria ceramica 140 | PU proy. TIFF 60 | Pasta elastomerica 2",u:0.37,rf:"F180",ac_rw:50,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"LOSCAT 1.2.M.B16.1 + LOFC Ed.17 A.2.2.180.05. Albañileria Santiago 9 (140mm)=F180. U=0.63@30mm, 0.51@40mm, 0.37@60mm, 0.29@80mm."},
  {cod:"1.2.M.B15.1",elem:"muro",sistemas:["Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Albanileria ceramica 14cm + XPS exterior 60mm + revoque",capas:"Albanileria ceramica 140 | XPS 60 | Malla | Revoque",u:0.45,rf:"F120",ac_rw:49,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"XPS lambda=0.034. RF ladrillo ceramico Santiago 9 sin revestimiento=F120-F180 segun espesor. U=0.45@60mm, 0.36@80mm."},
  {cod:"1.2.M.B17.1",elem:"muro",sistemas:["Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Albanileria ceramica 19cm + EPS SATE 80mm",capas:"Albanileria ceramica 190 | EPS 20kg 80 | Malla | Revoque mineral",u:0.39,rf:"F180",ac_rw:52,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Ladrillo ceramico 190mm (tipo Princesa o bloque). U=0.39@80mm. Alta masa."},
  // ── MUROS — aplicables a varios sistemas macizos ──────────────────────────
  {cod:"1.2.M.A21.1",elem:"muro",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"StoTherm sobre muros macizos — EPS o lana mineral 60mm",capas:"Muro macizo | EPS/lana 60 | Revoque Sto",u:0.33,rf:"F60",ac_rw:48,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"SATE sobre cualquier muro macizo. RF depende del muro base. EPS lambda=0.040 o lana mineral lambda=0.040."},
  {cod:"1.2.M.F2.3",elem:"muro",sistemas:null,desc:"Panel muro Monoplac PMO-110 (LOSCAT Ed.13)",capas:"Mortero 30 | EPS 10kg 90 | Mortero 30",u:0.43,rf:"F30",ac_rw:38,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"LOSCAT 1.2.M.F2.3. EPS nucleo 10kg/m3 90mm, mortero 30mm c/cara. U=0.43@90mm. RF y acustica requieren mejora para Salud/Educacion."},
  {cod:"1.2.M.F2.5",elem:"muro",sistemas:null,desc:"Panel muro Monoplac PMO-160 (LOSCAT Ed.13)",capas:"Mortero 30 | EPS 10kg 140 | Mortero 30",u:0.29,rf:"F30",ac_rw:38,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"LOSCAT 1.2.M.F2.5. EPS nucleo 10kg/m3 140mm, mortero 30mm c/cara. U=0.29@140mm. Requiere revestimiento ignifugo adicional."},
  // ── MUROS — Estructura de madera ─────────────────────────────────────────
  {cod:"1.2.G.C1.3",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x3 (65x38mm) + lana vidrio 80mm + yeso carton",capas:"Yeso carton 10 | Lana vidrio 80 | OSB 11 | Camara 20 | Yeso carton 10",u:0.34,rf:"F60",ac_rw:48,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina"],obs:"LOSCAT 1.2.G.C1.3. Requiere barrera vapor en zona F-I. U con factor puente termico madera."},
  {cod:"1.2.G.M1.1",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x4 (89x38mm) + lana mineral 90mm + yeso carton",capas:"Yeso carton 13 | Lana mineral 90 | OSB 11 | Camara 20 | Fibrocemento 8",u:0.41,rf:"F30",ac_rw:42,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina"],obs:"Solución estándar Chile. Factor puente térmico madera (~15%). Requiere barrera vapor zona F-I. U=0.41 con TB."},
  {cod:"1.2.G.M1.2",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x4 + lana mineral 90mm + XPS exterior 40mm",capas:"Yeso carton 13 | Lana mineral 90 | OSB 11 | XPS 40 | Revoque 10",u:0.30,rf:"F30",ac_rw:43,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"XPS exterior corta puente termico. U=0.30. Zonas G-I requieren mayor espesor XPS."},
  {cod:"1.2.G.M1.3",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x6 (140x38mm) + lana mineral 140mm + barrera vapor",capas:"Yeso carton 13 | Barrera vapor | Lana mineral 140 | OSB 11 | Fibrocemento 8",u:0.30,rf:"F30",ac_rw:46,zonas:"CDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"Para zonas frías C-I. Barrera vapor obligatoria. U=0.30 con factor puente térmico."},
  {cod:"1.2.G.M1.4",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x6 + lana mineral 140mm + EPS exterior 60mm",capas:"Yeso carton 13 | Barrera vapor | Lana mineral 140 | OSB 11 | EPS 20kg 60 | Revoque 10",u:0.20,rf:"F30",ac_rw:47,zonas:"EFGHI",usos:["Vivienda","Oficina"],obs:"Sistema de alta eficiencia para zonas muy frías E-I. EPS exterior elimina puente térmico. U=0.20."},
  {cod:"1.2.G.M2.1",elem:"muro",sistemas:["Estructura de madera"],desc:"Panel SIP OSB/EPS 20kg/OSB 100mm",capas:"OSB 12 | EPS 20kg 100 | OSB 12",u:0.44,rf:"F15",ac_rw:35,zonas:"ABCDEFG",usos:["Vivienda","Oficina"],obs:"Panel SIP autoportante. RF F15 por EPS: requiere revestimiento ignifugo (yeso carton o fibrocemento). U=0.44."},
  {cod:"1.2.G.M2.2",elem:"muro",sistemas:["Estructura de madera"],desc:"Panel SIP OSB/EPS 20kg/OSB 150mm",capas:"OSB 12 | EPS 20kg 150 | OSB 12",u:0.28,rf:"F15",ac_rw:37,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"SIP espesor aumentado. U=0.28. RF mejorar con revestimiento RF interior. Zonas E-I."},
  {cod:"1.2.G.M3.1",elem:"muro",sistemas:["Estructura de madera"],desc:"CLT madera contralaminada 90mm + XPS exterior 60mm",capas:"CLT 90 | XPS 60 | Malla | Revoque mineral",u:0.38,rf:"F60",ac_rw:47,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Oficina"],obs:"CLT lambda=0.13. RF intrínseca F60 (carbonización). XPS corta puente térmico. U=0.38."},
  {cod:"1.2.G.M3.2",elem:"muro",sistemas:["Estructura de madera"],desc:"CLT madera contralaminada 120mm + lana mineral SATE exterior 80mm",capas:"CLT 120 | Lana mineral 80 | Malla | Revoque mineral",u:0.32,rf:"F60",ac_rw:49,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina"],obs:"CLT 120mm=F60 intrínseco. Alta masa para acústica. U=0.32. Zonas A-H."},
  // ── MUROS — Estructura de acero / Metalframe ─────────────────────────────
  {cod:"1.2.G.C1.4",elem:"muro",sistemas:["Estructura de acero","Metalframe (acero liviano)"],desc:"Steel framing 89mm + lana vidrio 90mm + EPS exterior 30mm + revoque",capas:"Yeso carton 10 | Lana vidrio 90 | OSB 11 | EPS 20kg 30 | Revoque 15",u:0.29,rf:"F60",ac_rw:45,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOSCAT 1.2.G.C1.4. EPS exterior obligatorio para compensar puente térmico metálico (~30%). U=0.29."},
  {cod:"1.2.G.A1.1",elem:"muro",sistemas:["Estructura de acero","Metalframe (acero liviano)"],desc:"Steel framing 89mm + lana mineral 90mm + lana mineral exterior 40mm + yeso carton",capas:"Yeso carton 13 | Lana mineral 90 | Correa acero | Lana mineral 40 | Fibrocemento 8",u:0.25,rf:"F60",ac_rw:45,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Doble capa aislante para minimizar puente térmico de perfiles. Lana ext. en cámara secundaria. U=0.25."},
  {cod:"1.2.G.A1.2",elem:"muro",sistemas:["Estructura de acero","Metalframe (acero liviano)"],desc:"Steel framing 65mm + lana mineral 65mm + XPS exterior 60mm + revoque",capas:"Yeso carton 13 | Lana mineral 65 | OSB 9 | XPS 60 | Revoque 10",u:0.22,rf:"F60",ac_rw:44,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"XPS continuo exterior corta puente térmico de perfiles metálicos. U=0.22. Verificar fijación XPS (tornillería en frío)."},
  // ── MUROS — Metalframe (acero liviano) — LOFC Ed.17 Anexo B / DS N°76 MINVU ─
  {cod:"2.2.M.MF1.1",elem:"muro",sistemas:["Metalframe (acero liviano)"],desc:"Metalframe 90mm + LM 75mm + 1 placa YF 12.5mm c/cara",capas:"Yeso carton F 12.5 | Lana mineral 75 | Yeso carton F 12.5",u:0.52,rf:"F30",ac_rw:40,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"LOFC Ed.17 Anexo B / DS N°76 MINVU. Perfil MF 90mm, LM 75mm entre perfiles, 1 placa yeso-F 12.5mm c/cara. RF F30 certificada. TB +12-15%."},
  {cod:"2.2.M.MF1.2",elem:"muro",sistemas:["Metalframe (acero liviano)"],desc:"Metalframe 90mm + LM 90mm + 1 placa YF 12.5mm c/cara",capas:"Yeso carton F 12.5 | Lana mineral 90 | Yeso carton F 12.5",u:0.46,rf:"F30",ac_rw:42,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"LOFC Ed.17 Anexo B. Perfil MF 90mm, LM 90mm. Mejora térmica respecto MF1.1. RF F30. Incluye TB ~13%."},
  {cod:"2.2.M.MF2.1",elem:"muro",sistemas:["Metalframe (acero liviano)"],desc:"Metalframe 90mm + LM 90mm + 2 placas YF 12.5mm c/cara",capas:"Yeso carton F 12.5 | Yeso carton F 12.5 | Lana mineral 90 | Yeso carton F 12.5 | Yeso carton F 12.5",u:0.43,rf:"F60",ac_rw:44,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"LOFC Ed.17 Anexo B. 2 placas YF 12.5mm c/cara → RF F60. Mayor masa acústica. Apto todos los destinos. TB incluido."},
  {cod:"2.2.M.MF2.2",elem:"muro",sistemas:["Metalframe (acero liviano)"],desc:"Metalframe 100mm + LM 100mm + 2 placas YF 12.5mm c/cara",capas:"Yeso carton F 12.5 | Yeso carton F 12.5 | Lana mineral 100 | Yeso carton F 12.5 | Yeso carton F 12.5",u:0.39,rf:"F60",ac_rw:46,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"LOFC Ed.17 Anexo B. Perfil 100mm + LM 100mm + 2 YF c/cara. Mejor desempeño térmico y acústico. RF F60. TB incluido."},
  {cod:"2.2.M.MF3.1",elem:"muro",sistemas:["Metalframe (acero liviano)"],desc:"Metalframe 90mm + LM 90mm + 3 placas YF 12.5mm c/cara",capas:"Yeso carton F 12.5 | Yeso carton F 12.5 | Yeso carton F 12.5 | Lana mineral 90 | Yeso carton F 12.5 | Yeso carton F 12.5 | Yeso carton F 12.5",u:0.41,rf:"F90",ac_rw:47,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOFC Ed.17 Anexo B. 3 placas YF 12.5mm c/cara → RF F90. Apto separaciones de alta exigencia RF. DS N°76."},
  {cod:"2.2.M.MF4.1",elem:"muro",sistemas:["Metalframe (acero liviano)"],desc:"Metalframe 90mm + LM 90mm + 2 YF 12.5 + XPS exterior 50mm",capas:"Yeso carton F 12.5 | Yeso carton F 12.5 | Lana mineral 90 | OSB 9 | XPS 50 | Revoque 10",u:0.22,rf:"F60",ac_rw:44,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOFC Ed.17 Anexo B. XPS exterior continuo corta puente térmico de perfiles. U=0.22 incluye TB. RF F60. Zonas frías."},
  // ── TABIQUES (todos los sistemas) ─────────────────────────────────────────
  {cod:"1.2.T.A1.1",elem:"tabique",sistemas:null,desc:"Tabique yeso carton doble + lana mineral 75mm",capas:"Yeso carton 13 | Lana mineral 75 | Yeso carton 13",u:0.42,rf:"F60",ac_rw:45,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Tabique interior. Minimo para separacion entre aulas."},
  {cod:"1.2.T.A1.2",elem:"tabique",sistemas:null,desc:"Tabique yeso carton doble + lana mineral 100mm",capas:"Yeso carton 13 | Lana mineral 100 | Yeso carton 13",u:0.36,rf:"F60",ac_rw:48,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Mayor aislamiento acustico. Recomendado Salud."},
  {cod:"1.2.T.B1.1",elem:"tabique",sistemas:null,desc:"Tabique albanileria ceramica Santiago 9 14cm (LOFC Ed.17)",capas:"Revoque 10 | Albanileria ceramica Santiago 9 140 | Revoque 10",u:1.20,rf:"F180",ac_rw:47,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"LOFC Ed.17 A.2.2.180.05. Ladrillo Santiago 9 (290x140x94mm) sin revestimiento=F180. Alta masa, excelente RF y acustica."},
  {cod:"1.2.T.C1.1",elem:"tabique",sistemas:null,desc:"Tabique hormigon armado 150mm (LOFC Ed.17)",capas:"H.A. 150mm",u:3.33,rf:"F150",ac_rw:52,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio","Industrial"],obs:"LOFC Ed.17 A.1.3. HA 150mm=F150. Maximo RF y acustica. Escaleras y recintos especiales."},
  // ── TECHUMBRES — HA / albañilería ─────────────────────────────────────────
  {cod:"1.1.M.B4.1.1",elem:"techumbre",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Panel Losa Nervada Cubierta Monoplac PLN-120 (LOSCAT Ed.13)",capas:"EPS 10kg 100+40mm nervadura | Malla AT56 | H.A. 110+50mm | Yeso carton 10",u:0.51,rf:"F60",ac_rw:null,zonas:"ABCDE",usos:["Vivienda","Educacion","Oficina"],obs:"LOSCAT 1.1.M.B4.1.1. U=0.51 Rt=1.95. Nucleo EPS 100/40mm nervadura. Para zonas A-E (U-max techo 0.38-0.84)."},
  {cod:"1.1.M.B4.1.2",elem:"techumbre",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Panel Losa Nervada Cubierta Monoplac PLN-150 (LOSCAT Ed.13)",capas:"EPS 10kg 130+40mm nervadura | Malla AT56 | H.A. 140+50mm | Yeso carton 10",u:0.44,rf:"F60",ac_rw:null,zonas:"ABCDEF",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOSCAT 1.1.M.B4.1.2. U=0.44 Rt=2.28. Nucleo EPS 130/40mm nervadura. Para zonas A-F (U-max techo hasta 0.28)."},
  {cod:"1.3.M.A6.1",elem:"techumbre",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Losa H.A. 12cm con SATE EPS 20kg 60mm (cubierta plana)",capas:"H.A. 120 | SATE EPS 20kg 60 | Membrana impermeable",u:0.33,rf:"F60",ac_rw:null,zonas:"ABCDEF",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Cubierta plana. U estimado NCh853 para HA 120mm + EPS 60mm. Zonas A-F."},
  {cod:"1.3.M.A6.2",elem:"techumbre",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Losa H.A. 12cm + lana mineral SATE 100mm (cubierta plana invertida)",capas:"H.A. 120 | Lana mineral 100 | Membrana impermeable | Grava 40",u:0.26,rf:"F60",ac_rw:null,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Cubierta invertida: impermeabilización protegida. Lana mineral lambda=0.04. U=0.26. Zonas A-G."},
  // ── TECHUMBRES — Estructura de madera ────────────────────────────────────
  {cod:"1.1.G.M1.1",elem:"techumbre",sistemas:["Estructura de madera"],desc:"Cercha madera + lana mineral 100mm sobre cielo + yeso carton",capas:"Yeso carton 13 | Lana mineral 100 | Tablon OSB | Impermeabilizante",u:0.30,rf:"F30",ac_rw:null,zonas:"ABCDE",usos:["Vivienda","Educacion","Oficina"],obs:"Cubierta inclinada con cercha. Lana colocada sobre cielo horizontal. U=0.30 incluye TB. Barrera vapor zona D-I."},
  {cod:"1.1.G.M1.2",elem:"techumbre",sistemas:["Estructura de madera"],desc:"Cercha madera + lana mineral 150mm + barrera vapor sobre cielo",capas:"Yeso carton 13 | Barrera vapor | Lana mineral 150 | Tablon OSB",u:0.22,rf:"F30",ac_rw:null,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Oficina"],obs:"Lana mineral 150mm sobre cielo. Barrera vapor obligatoria zonas E-I. U=0.22. Ventilación cámara bajo cubierta."},
  {cod:"1.1.G.M1.3",elem:"techumbre",sistemas:["Estructura de madera"],desc:"Cercha madera + lana mineral 200mm + XPS 30mm sobre tablón",capas:"Yeso carton 13 | Barrera vapor | Lana mineral 200 | XPS 30 | Tablon OSB",u:0.14,rf:"F30",ac_rw:null,zonas:"FGHI",usos:["Vivienda","Oficina"],obs:"Alta eficiencia zonas F-I. Doble capa: lana entre cerchas + XPS continuo sobre tablón elimina TB. U=0.14."},
  {cod:"1.1.G.M2.1",elem:"techumbre",sistemas:["Estructura de madera"],desc:"Viga madera + OSB + lana mineral 80mm entre vigas + cielo yeso carton",capas:"Yeso carton 13 | Lana mineral 80 | Viga madera | OSB 15 | Impermeabilizante",u:0.38,rf:"F30",ac_rw:null,zonas:"ABCDEF",usos:["Vivienda","Oficina"],obs:"Cubierta sobre viga expuesta o no. Lana entre vigas con factor TB. U=0.38. Zonas A-F."},
  // ── TECHUMBRES — Estructura de acero ─────────────────────────────────────
  {cod:"1.1.P.A1.2",elem:"techumbre",sistemas:["Estructura de acero"],desc:"Panel sandwich zinc/lana mineral/zinc 100mm",capas:"Zinc 0.5mm | Lana mineral 100mm | Zinc 0.5mm",u:0.34,rf:"F30",ac_rw:null,zonas:"ABCDEF",usos:["Industrial","Comercio","Oficina"],obs:"Mejor RF que EPS. Para bodegas y galpones."},
  {cod:"1.1.P.A1.3",elem:"techumbre",sistemas:["Estructura de acero"],desc:"Panel sandwich zinc/lana mineral/zinc 150mm",capas:"Zinc 0.5mm | Lana mineral 150mm | Zinc 0.5mm",u:0.24,rf:"F30",ac_rw:null,zonas:"ABCDEFGH",usos:["Industrial","Comercio","Oficina"],obs:"Cumple zonas frias para uso industrial."},
  {cod:"1.1.G.A1.1",elem:"techumbre",sistemas:["Estructura de acero"],desc:"Cubierta panel sandwich acero/PU inyectado 100mm",capas:"Acero galv. 0.5mm | PU inyectado 100mm | Acero galv. 0.5mm",u:0.23,rf:"F30",ac_rw:null,zonas:"ABCDEFGH",usos:["Industrial","Comercio","Oficina"],obs:"Panel tipo Isopanel o similar. PU inyectado lambda=0.024. U=0.23. Verificar RF EPS/PU."},
  {cod:"1.1.G.A1.2",elem:"techumbre",sistemas:["Estructura de acero"],desc:"Cubierta panel sandwich acero/lana mineral 150mm",capas:"Acero galv. 0.5mm | Lana mineral 150mm | Acero galv. 0.5mm",u:0.24,rf:"F30",ac_rw:null,zonas:"ABCDEFGHI",usos:["Industrial","Comercio","Oficina","Educacion"],obs:"Lana mineral lambda=0.040. U=0.24. Mejor RF que EPS/PU. Zonas A-I."},
  // ── TECHUMBRES — Metalframe (acero liviano) — LOFC Ed.17 Anexo B / DS N°76 ─
  {cod:"2.2.T.MF1.1",elem:"techumbre",sistemas:["Metalframe (acero liviano)"],desc:"Cubierta Metalframe + LM 100mm + 1 placa YF 12.5mm cielo",capas:"Yeso carton F 12.5 | Lana mineral 100 | OSB 15 | Impermeabilizante",u:0.35,rf:"F15",ac_rw:null,zonas:"ABCDE",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"LOFC Ed.17 Anexo B. Cercha MF, LM 100mm entre cerchas, 1 placa YF en cielo. RF F15. TB incluido. Zonas A-E."},
  {cod:"2.2.T.MF1.2",elem:"techumbre",sistemas:["Metalframe (acero liviano)"],desc:"Cubierta Metalframe + LM 150mm + 1 placa YF 12.5mm cielo",capas:"Yeso carton F 12.5 | Lana mineral 150 | OSB 15 | Barrera vapor | Impermeabilizante",u:0.25,rf:"F30",ac_rw:null,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOFC Ed.17 Anexo B. LM 150mm + barrera vapor obligatoria zonas E-G. RF F30 con placa YF cielo. U=0.25."},
  {cod:"2.2.T.MF2.1",elem:"techumbre",sistemas:["Metalframe (acero liviano)"],desc:"Cubierta Metalframe + LM 200mm + 2 placas YF 12.5mm cielo",capas:"Yeso carton F 12.5 | Yeso carton F 12.5 | Lana mineral 200 | OSB 15 | Barrera vapor | Impermeabilizante",u:0.19,rf:"F30",ac_rw:null,zonas:"FGHI",usos:["Vivienda","Educacion","Oficina"],obs:"LOFC Ed.17 Anexo B. Alta eficiencia zonas frías. 2 YF en cielo → RF F30. Barrera vapor obligatoria. U=0.19."},
  // ── PISOS/ENTREPISOS — Metalframe ─────────────────────────────────────────
  {cod:"2.2.P.MF1.1",elem:"piso",sistemas:["Metalframe (acero liviano)"],desc:"Entrepiso Metalframe + LM 50mm + OSB 18mm + YF 12.5mm cielo",capas:"Yeso carton F 12.5 | Lana mineral 50 | OSB 18",u:0.45,rf:"F30",ac_rw:38,zonas:"ABCDEF",usos:["Vivienda","Educacion","Oficina"],obs:"LOFC Ed.17 Anexo B. Entrepiso MF, LM 50mm acústica, OSB estructural 18mm, placa YF cielo. RF F30. Para impacto: solado flotante."},
  {cod:"2.2.P.MF1.2",elem:"piso",sistemas:["Metalframe (acero liviano)"],desc:"Entrepiso Metalframe + LM 100mm + OSB 18mm + 2 YF 12.5mm cielo",capas:"Yeso carton F 12.5 | Yeso carton F 12.5 | Lana mineral 100 | OSB 18",u:0.32,rf:"F60",ac_rw:42,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOFC Ed.17 Anexo B. LM 100mm + 2 placas YF cielo → RF F60. Mayor aislación térmica y acústica. DS N°76."},
  // ── PISOS — HA / albañilería ──────────────────────────────────────────────
  {cod:"1.4.M.A1.1",elem:"piso",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Losa H.A. 120mm + EPS inferior 60mm",capas:"H.A. 120 | EPS 60 inferior",u:0.33,rf:"F60",ac_rw:null,zonas:"ABCDEF",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Para acustica de impacto agregar solado flotante."},
  {cod:"1.4.M.A1.2",elem:"piso",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Losa H.A. 120mm + EPS inferior 80mm",capas:"H.A. 120 | EPS 80 inferior",u:0.26,rf:"F60",ac_rw:null,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Recomendado zonas E-H."},
  // ── PISOS — Estructura de madera ─────────────────────────────────────────
  {cod:"1.4.G.M1.1",elem:"piso",sistemas:["Estructura de madera"],desc:"Viguería madera + OSB + lana mineral 100mm + cielo yeso carton",capas:"Cielo YC 13 | Lana mineral 100 | OSB 18 | Solado OSB 18",u:0.32,rf:"F30",ac_rw:null,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Oficina"],obs:"Piso sobre cámara ventilada. Lana mineral entre vigas (TB ~20%). U=0.32. Barrera vapor exterior zona F-I."},
  {cod:"1.4.G.M1.2",elem:"piso",sistemas:["Estructura de madera"],desc:"Viguería madera + lana mineral 100mm + membrana (piso ventilado sobre terreno)",capas:"Solado OSB 18 | Lana mineral 100 | Membrana polietileno | Cielo YC 13",u:0.30,rf:"F30",ac_rw:null,zonas:"ABCDEFGH",usos:["Vivienda","Oficina"],obs:"Piso ventilado tipo sobresolera. Membrana PE obligatoria sobre suelo. U=0.30 incluye TB. Zonas A-H."},
  {cod:"1.4.G.M2.1",elem:"piso",sistemas:["Estructura de madera"],desc:"Viguería madera + lana mineral 150mm + XPS 40mm bajo solado",capas:"XPS 40 | Solado OSB 18 | Lana mineral 150 | Membrana | Cielo YC 13",u:0.19,rf:"F30",ac_rw:null,zonas:"EFGHI",usos:["Vivienda","Oficina"],obs:"Doble capa para zonas muy frías E-I. XPS continuo elimina TB. U=0.19."},
  // ── VENTANAS — Aluminio sin RPT (solo zonas A-C, baja exigencia) ──────────
  {cod:"3.2.V.A.C.0.03",elem:"ventana",sistemas:null,desc:"Ventana Al sin RPT + DVH 4/12/4 aire",capas:"DVH 4/12/4 aire | Marco Al sin RPT",u:2.80,rf:null,ac_rw:null,perm:1,zonas:"AB",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"Uw=2.80 (ISO 10077). Solo zonas A-B (Zona A sin exigencia U, Zona B PERM_V clase 1). DS N°15 no fija Umax ventana, pero VPCT y permeabilidad aplican."},
  {cod:"3.2.V.A.C.0.04",elem:"ventana",sistemas:null,desc:"Ventana Al sin RPT + DVH 4/12/4 argon",capas:"DVH 4/12/4 argon | Marco Al sin RPT",u:2.60,rf:null,ac_rw:null,perm:1,zonas:"ABC",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"Uw≈2.60 (ISO 10077). Ug argon=2.4. Perm. clase 1. Zonas A-C."},
  // ── VENTANAS — Aluminio con RPT ────────────────────────────────────────────
  {cod:"3.2.V.A.P.1.03",elem:"ventana",sistemas:null,desc:"Ventana Al RPT 24mm + DVH 4/12/4 Low-E argon",capas:"DVH 4/12/4 Low-E argon | Marco Al RPT 24mm",u:1.80,rf:null,ac_rw:null,perm:2,zonas:"ABCDEF",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=1.80 (ISO 10077): Uf=2.8, Ug=1.5. Perm. clase 2 (DS N°15 zonas D-F). Zonas A-F."},
  {cod:"3.2.V.A.P.2.03",elem:"ventana",sistemas:null,desc:"Ventana Al RPT 32mm + DVH 4/16/4 Low-E argon",capas:"DVH 4/16/4 Low-E argon | Marco Al RPT 32mm",u:1.50,rf:null,ac_rw:null,perm:2,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=1.50 (ISO 10077): Uf=2.5, Ug=1.4. Perm. clase 2. Cumple zonas A-G."},
  {cod:"3.2.V.A.P.3.03",elem:"ventana",sistemas:null,desc:"Ventana Al RPT 40mm + DVH 4/16/4 Low-E kripton",capas:"DVH 4/16/4 Low-E kripton | Marco Al RPT 40mm",u:1.10,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=1.10 (ISO 10077): Uf=2.2, Ug=0.9. Perm. clase 3 (DS N°15 zonas G-I). Cumple A-H."},
  {cod:"3.2.V.A.T.1.03",elem:"ventana",sistemas:null,desc:"Ventana Al RPT 60mm + TVH 4/12/4/12/4 Low-E argon",capas:"TVH 4/12/4/12/4 Low-E argon | Marco Al RPT 60mm",u:0.80,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=0.80 (ISO 10077): Uf=1.6, Ug=0.6 triple Low-E. Perm. clase 3. Cumple todas las zonas A-I."},
  // ── VENTANAS — PVC ─────────────────────────────────────────────────────────
  {cod:"3.2.V.P.C.1.03",elem:"ventana",sistemas:null,desc:"Ventana PVC 3 cámaras + DVH 4/12/4 argon",capas:"DVH 4/12/4 argon | Marco PVC 3 cam.",u:2.10,rf:null,ac_rw:null,perm:1,zonas:"ABCDEF",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=2.10 (ISO 10077): Uf=2.0, Ug=2.4. Perm. clase 1-2. Zonas A-F."},
  {cod:"3.2.V.P.C.2.03",elem:"ventana",sistemas:null,desc:"Ventana PVC 3 cámaras + DVH 4/12/4 Low-E argon",capas:"DVH 4/12/4 Low-E argon | Marco PVC 3 cam.",u:1.70,rf:null,ac_rw:null,perm:2,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=1.70 (ISO 10077): Uf=2.0, Ug=1.5. Perm. clase 2. Buena relacion precio/desempeno. Zonas A-G."},
  {cod:"3.2.V.P.C.3.03",elem:"ventana",sistemas:null,desc:"Ventana PVC 5 cámaras + DVH 4/16/4 Low-E argon",capas:"DVH 4/16/4 Low-E argon | Marco PVC 5 cam.",u:1.30,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=1.30 (ISO 10077): Uf=1.7, Ug=1.4. Perm. clase 3. Zonas G-H. DS N°15."},
  {cod:"3.2.V.P.T.1.03",elem:"ventana",sistemas:null,desc:"Ventana PVC 6 cámaras + TVH Low-E argon",capas:"TVH 4/12/4/12/4 Low-E argon | Marco PVC 6 cam.",u:0.80,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=0.80 (ISO 10077): Uf=1.4, Ug=0.6. Perm. clase 3. Maximo estandar. Zonas H-I."},
  // ── VENTANAS — Marco madera y composite ────────────────────────────────────
  {cod:"3.2.V.M.P.1.03",elem:"ventana",sistemas:null,desc:"Ventana marco madera pino 68mm + DVH 4/16/4 Low-E argon",capas:"DVH 4/16/4 Low-E argon | Marco madera pino 68mm",u:1.40,rf:null,ac_rw:null,perm:2,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina"],obs:"Uw=1.40 (ISO 10077): Uf=2.0, Ug=1.4. Marco madera sin puente termico metalico. Perm. clase 2-3. Zonas A-H."},
  {cod:"3.2.V.M.T.1.03",elem:"ventana",sistemas:null,desc:"Ventana marco madera pino 78mm + TVH Low-E argon",capas:"TVH 4/12/4/12/4 Low-E argon | Marco madera pino 78mm",u:0.90,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"Uw=0.90 (ISO 10077): Uf=1.8, Ug=0.6. Sin puente termico metalico. Perm. clase 3. Optimo para zonas H-I."},
  {cod:"3.2.V.C.T.1.03",elem:"ventana",sistemas:null,desc:"Ventana composite Al-madera + TVH Low-E argon/kripton",capas:"TVH 4/16/4/16/4 Low-E Ar/Kr | Marco composite Al-madera",u:0.75,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=0.75 (ISO 10077): Uf=1.6, Ug=0.5. Marco composite sin puente termico. Perm. clase 3. Estandar pasivo. Zonas G-I recomendado."},
  // ── PUERTAS — Madera ──────────────────────────────────────────────────────
  {cod:"3.1.P.M.0.01",elem:"puerta",sistemas:null,desc:"Puerta madera maciza 45mm",capas:"Madera maciza 45mm",u:2.20,rf:"F30",ac_rw:28,zonas:"AB",usos:["Vivienda","Educacion","Oficina"],obs:"U=2.20 (NCh853). RF F30 por carbonizacion (LOFC Ed.17). Solo zonas A-B: zona A sin exigencia, zona B PUERTA_U no aplica segun DS N°15 Tabla."},
  {cod:"3.1.P.M.0.02",elem:"puerta",sistemas:null,desc:"Puerta madera maciza doble hoja con camara 70mm",capas:"Madera maciza 35mm | Camara aire 20mm | Madera maciza 15mm",u:1.60,rf:"F30",ac_rw:32,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"U=1.60 (NCh853). Camara Rcam=0.18 m²K/W. Cumple PUERTA_U ≤1.7 zonas B-E y ≤2.0 zonas F-G. RF F30."},
  {cod:"3.1.P.M.0.03",elem:"puerta",sistemas:null,desc:"Puerta madera con nucleo EPS 40mm",capas:"Madera 10mm | EPS 20kg 40mm | Madera 10mm",u:1.30,rf:"F15",ac_rw:30,zonas:"ABCDEFGH",usos:["Vivienda","Oficina"],obs:"U=1.30 (NCh853). EPS lambda=0.040. RF F15 (EPS limita RF). Cumple PUERTA_U todas las zonas B-H."},
  {cod:"3.1.P.M.0.04",elem:"puerta",sistemas:null,desc:"Puerta madera con nucleo lana mineral 60mm",capas:"Madera 10mm | Lana mineral 60mm | Madera 10mm",u:0.55,rf:"F60",ac_rw:38,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"U=0.55 (NCh853). Lana mineral lambda=0.040. RF F60 certificable (LOFC Ed.17). Cumple todas las zonas A-I."},
  {cod:"3.1.P.M.0.05",elem:"puerta",sistemas:null,desc:"Puerta madera contraplacada hueca 40mm",capas:"Contrachapado 4mm | Marco pino 35mm | Contrachapado 4mm",u:2.60,rf:"F15",ac_rw:22,zonas:"AB",usos:["Vivienda","Educacion"],obs:"U=2.60. Solo zonas A-B. Puerta interior tipica liviana."},
  {cod:"3.1.P.M.0.06",elem:"puerta",sistemas:null,desc:"Puerta madera contraplacada OSB 50mm",capas:"Contrachapado 6mm | OSB 38mm | Contrachapado 6mm",u:1.60,rf:"F15",ac_rw:27,zonas:"ABCDEFG",usos:["Vivienda","Educacion"],obs:"U=1.60. OSB lambda=0.13. Cumple PUERTA_U ≤1.7 zonas B-E y ≤2.0 zonas F-G."},
  {cod:"3.1.P.M.0.07",elem:"puerta",sistemas:null,desc:"Puerta madera con nucleo XPS 50mm",capas:"Fibrocemento 6mm | XPS 50mm | Fibrocemento 6mm",u:0.90,rf:"F15",ac_rw:30,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"U=0.90 (NCh853). XPS lambda=0.034. Cumple todas las zonas A-I."},
  {cod:"3.1.P.M.0.08",elem:"puerta",sistemas:null,desc:"Puerta madera LVL 25mm + lana mineral 60mm + LVL 25mm (zonas H-I)",capas:"LVL 25mm | Lana mineral 60mm | LVL 25mm",u:0.52,rf:"F60",ac_rw:40,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"U=0.52 (NCh853). LVL lambda=0.13, lana mineral lambda=0.040. RF F60. Alta masa. Optimo zonas H-I."},
  // ── PUERTAS — Acero / metalicas ───────────────────────────────────────────
  {cod:"3.1.P.A.0.01",elem:"puerta",sistemas:null,desc:"Puerta metalica acero + lana mineral 50mm",capas:"Acero 1.5mm | Lana mineral 50mm | Acero 1.5mm",u:1.50,rf:"F60",ac_rw:35,zonas:"ABCDEFG",usos:["Industrial","Comercio","Oficina"],obs:"U=1.50 (NCh853). Cumple PUERTA_U todas las zonas. RF F60."},
  {cod:"3.1.P.A.0.02",elem:"puerta",sistemas:null,desc:"Puerta metalica acero + lana mineral 80mm + jamba RPT",capas:"Acero 1.5mm | Lana mineral 80mm | Acero 1.5mm | Jamba RPT",u:1.00,rf:"F60",ac_rw:37,zonas:"ABCDEFGHI",usos:["Industrial","Comercio","Oficina","Educacion"],obs:"U=1.00 con RPT en jamba (reduce puente termico ~30%). Cumple todas las zonas A-I."},
  {cod:"3.1.P.A.0.03",elem:"puerta",sistemas:null,desc:"Puerta metalica cortafuego RF-60 homologada",capas:"Acero 2mm | Lana mineral 80mm | Acero 2mm",u:1.30,rf:"F60",ac_rw:36,zonas:"ABCDEFGH",usos:["Industrial","Comercio","Oficina","Educacion","Salud"],obs:"U=1.30. RF F60 homologada OGUC Tit.4. Cumple zonas A-H."},
  {cod:"3.1.P.A.0.04",elem:"puerta",sistemas:null,desc:"Puerta metalica cortafuego RF-90 + jamba RPT",capas:"Acero 2mm | Lana mineral 100mm | Acero 2mm | Jamba RPT",u:0.90,rf:"F90",ac_rw:38,zonas:"ABCDEFGHI",usos:["Industrial","Salud","Educacion"],obs:"U=0.90 con RPT jamba. RF F90 certificada. Cumple todas las zonas A-I."},
  {cod:"3.1.P.A.0.05",elem:"puerta",sistemas:null,desc:"Puerta acero + PU inyectado 80mm + RPT 40mm",capas:"Acero 0.8mm | PU inyectado 80mm | Acero 0.8mm | Marco RPT 40mm",u:0.65,rf:null,ac_rw:30,zonas:"ABCDEFGHI",usos:["Industrial","Comercio","Vivienda"],obs:"U=0.65. PU lambda=0.027, RPT 40mm elimina puente termico de marco. Cumple todas las zonas A-I."},
  // ── PUERTAS — Aluminio con RPT ────────────────────────────────────────────
  {cod:"3.1.P.AL.0.01",elem:"puerta",sistemas:null,desc:"Puerta Al sin RPT + panel lana mineral 50mm",capas:"Marco Al sin RPT | Panel lana mineral 50mm",u:2.80,rf:null,ac_rw:28,zonas:"AB",usos:["Oficina","Comercio"],obs:"Sin RPT: alto puente termico. U=2.80. Solo zonas A-B."},
  {cod:"3.1.P.AL.0.02",elem:"puerta",sistemas:null,desc:"Puerta Al RPT 24mm + panel lana mineral 60mm",capas:"Marco Al RPT 24mm | Panel lana mineral 60mm",u:1.60,rf:null,ac_rw:32,zonas:"ABCDEFG",usos:["Oficina","Comercio","Educacion"],obs:"U=1.60 (RPT 24mm: Uf=2.8). Cumple PUERTA_U ≤1.7 zonas B-E y ≤2.0 zonas F-G."},
  {cod:"3.1.P.AL.0.03",elem:"puerta",sistemas:null,desc:"Puerta Al RPT 40mm + panel lana mineral 80mm",capas:"Marco Al RPT 40mm | Panel lana mineral 80mm",u:1.20,rf:null,ac_rw:35,zonas:"ABCDEFGH",usos:["Oficina","Comercio","Educacion","Salud"],obs:"U=1.20 (RPT 40mm: Uf=2.2). Cumple todas las zonas B-H."},
  {cod:"3.1.P.AL.0.04",elem:"puerta",sistemas:null,desc:"Puerta Al RPT 60mm + panel XPS 80mm (zonas H-I)",capas:"Marco Al RPT 60mm | Panel XPS 80mm",u:0.80,rf:null,ac_rw:32,zonas:"ABCDEFGHI",usos:["Oficina","Comercio","Educacion","Salud","Vivienda"],obs:"U=0.80 (RPT 60mm: Uf=1.6, XPS 80mm lambda=0.034). Cumple todas las zonas A-I."},
  // ── PUERTAS — PVC ─────────────────────────────────────────────────────────
  {cod:"3.1.P.P.0.01",elem:"puerta",sistemas:null,desc:"Puerta PVC 3 cam. + DVH 4/12/4 argon (acristalada)",capas:"Marco PVC 3 cam. | DVH 4/12/4 argon",u:1.80,rf:null,ac_rw:null,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Oficina"],obs:"Uw=1.80 (ISO 10077). Cumple PUERTA_U ≤2.0 zonas F-G. Para zonas B-E (≤1.7) usar DVH Low-E."},
  {cod:"3.1.P.P.0.02",elem:"puerta",sistemas:null,desc:"Puerta PVC 3 cam. + DVH Low-E argon (acristalada)",capas:"Marco PVC 3 cam. | DVH 4/12/4 Low-E argon",u:1.50,rf:null,ac_rw:null,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina"],obs:"Uw=1.50 (ISO 10077): Uf=2.0, Ug=1.5. Cumple PUERTA_U ≤1.7 zonas B-E y ≤2.0 zonas F-H."},
  {cod:"3.1.P.P.0.03",elem:"puerta",sistemas:null,desc:"Puerta PVC 5 cam. opaca + nucleo PU 80mm",capas:"Marco PVC 5 cam. | Panel PU inyectado 80mm",u:0.55,rf:null,ac_rw:35,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"U=0.55. PU lambda=0.027, PVC 5 cam. Uf=1.7. Cumple todas las zonas A-I. Optimo H-I."},
  {cod:"3.1.P.P.0.04",elem:"puerta",sistemas:null,desc:"Puerta PVC 6 cam. + TVH Low-E argon (zonas H-I)",capas:"Marco PVC 6 cam. | TVH 4/12/4/12/4 Low-E argon",u:0.80,rf:null,ac_rw:34,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"Uw=0.80 (ISO 10077): Uf=1.4, Ug=0.6 triple Low-E. Perm. clase 3. Maximo estandar para zonas H-I."},
  // ── PUERTAS — Vidriadas ───────────────────────────────────────────────────
  {cod:"3.1.P.VI.0.01",elem:"puerta",sistemas:null,desc:"Puerta vidriada monolitica 6mm Al sin RPT",capas:"Marco Al sin RPT | Vidrio monolitico 6mm",u:3.20,rf:null,ac_rw:26,zonas:"AB",usos:["Oficina","Comercio"],obs:"U=3.20. Solo zonas A-B."},
  {cod:"3.1.P.VI.0.02",elem:"puerta",sistemas:null,desc:"Puerta vidriada DVH 4/12/4 Al sin RPT",capas:"Marco Al sin RPT | DVH 4/12/4 aire",u:2.40,rf:null,ac_rw:30,zonas:"ABC",usos:["Oficina","Comercio","Educacion"],obs:"U=2.40. Solo zonas A-C (no cumple PUERTA_U ≤1.7 desde zona B → solo informativo)."},
  {cod:"3.1.P.VI.0.03",elem:"puerta",sistemas:null,desc:"Puerta vidriada DVH Low-E Al RPT 24mm",capas:"Marco Al RPT 24mm | DVH 4/12/4 Low-E argon",u:1.50,rf:null,ac_rw:32,zonas:"ABCDEFG",usos:["Oficina","Comercio","Educacion"],obs:"U=1.50 (ISO 10077): Uf=2.8, Ug=1.5. Cumple PUERTA_U ≤1.7 zonas B-E y ≤2.0 zonas F-G."},
  {cod:"3.1.P.VI.0.04",elem:"puerta",sistemas:null,desc:"Puerta vidriada DVH 4/16/4 Low-E Al RPT 40mm",capas:"Marco Al RPT 40mm | DVH 4/16/4 Low-E argon",u:1.10,rf:null,ac_rw:35,zonas:"ABCDEFGH",usos:["Oficina","Comercio","Educacion","Salud"],obs:"U=1.10. Cumple todas las zonas B-H."},
  {cod:"3.1.P.VI.0.05",elem:"puerta",sistemas:null,desc:"Puerta vidriada TVH Low-E Al RPT 60mm",capas:"Marco Al RPT 60mm | TVH 4/12/4/12/4 Low-E argon",u:0.70,rf:null,ac_rw:38,zonas:"ABCDEFGHI",usos:["Oficina","Educacion","Salud"],obs:"U=0.70. Perm. clase 3. Cumple todas las zonas A-I."},
  {cod:"3.1.P.VI.0.06",elem:"puerta",sistemas:null,desc:"Puerta vidriada TVH Low-E marco madera 78mm (zonas H-I)",capas:"Marco madera 78mm | TVH 4/12/4/12/4 Low-E argon",u:0.80,rf:null,ac_rw:40,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"U=0.80 (ISO 10077). Marco madera sin puente termico metalico. Perm. clase 3. Optimo H-I residencial."},
  // ── PUERTAS — Garage, cortafuego, enrollables ─────────────────────────────
  {cod:"3.1.P.G.0.01",elem:"puerta",sistemas:null,desc:"Puerta garage seccional acero + PU inyectado 45mm",capas:"Acero 0.5mm | PU inyectado 45mm | Acero 0.5mm",u:1.00,rf:null,ac_rw:22,zonas:"ABCDEFGH",usos:["Vivienda","Comercio"],obs:"U=1.00. Cumple PUERTA_U B-H. Verificar sellado perimetral."},
  {cod:"3.1.P.G.0.02",elem:"puerta",sistemas:null,desc:"Puerta garage seccional acero + lana mineral 80mm",capas:"Acero 0.5mm | Lana mineral 80mm | Acero 0.5mm",u:0.55,rf:null,ac_rw:28,zonas:"ABCDEFGHI",usos:["Vivienda","Comercio"],obs:"U=0.55. Lana mineral lambda=0.040. Cumple todas las zonas A-I."},
  {cod:"3.1.P.E.0.01",elem:"puerta",sistemas:null,desc:"Puerta cortafuego vaiven RF-30 + burlete intumescente",capas:"Acero 1.2mm | Lana mineral 50mm | Acero 1.2mm | Burlete intumescente",u:1.50,rf:"F30",ac_rw:33,zonas:"ABCDEFGHI",usos:["Salud","Educacion"],obs:"U=1.50. RF F30. Obligatoria pasillos evacuacion OGUC Art.4.2. Cumple PUERTA_U todas las zonas."},
  {cod:"3.1.P.E.0.02",elem:"puerta",sistemas:null,desc:"Puerta cortafuego RF-90 con cierre automatico",capas:"Acero 2mm | Lana mineral 100mm | Acero 2mm | Cierre automatico",u:1.10,rf:"F90",ac_rw:40,zonas:"ABCDEFGHI",usos:["Salud","Educacion","Industrial"],obs:"U=1.10. RF F90 certificada. Cumple todas las zonas A-I."},
  {cod:"3.1.P.EN.0.01",elem:"puerta",sistemas:null,desc:"Puerta enrollable metalica sin aislacion",capas:"Acero galvanizado 0.8mm",u:5.80,rf:null,ac_rw:18,zonas:"AB",usos:["Industrial","Comercio"],obs:"U=5.80. Solo zonas A-B."},
  {cod:"3.1.P.EN.0.02",elem:"puerta",sistemas:null,desc:"Puerta enrollable metalica + PU inyectado 40mm",capas:"Acero 0.5mm | PU inyectado 40mm | Acero 0.5mm",u:0.90,rf:null,ac_rw:24,zonas:"ABCDEFGHI",usos:["Industrial","Comercio","Vivienda"],obs:"U=0.90. PU lambda=0.027. Cumple todas las zonas A-I."},
  {cod:"3.1.P.EN.0.03",elem:"puerta",sistemas:null,desc:"Puerta enrollable metalica + lana mineral 60mm",capas:"Acero 0.5mm | Lana mineral 60mm | Acero 0.5mm",u:0.60,rf:"F30",ac_rw:28,zonas:"ABCDEFGHI",usos:["Industrial","Comercio"],obs:"U=0.60. RF F30. Lana mineral lambda=0.040. Cumple todas las zonas A-I."},
];

// ─── BASES HOMOLOGACION ───────────────────────────────────────────────────────
export const BH=[
  {cod:"1.2.G.C1.3",desc:"Entramado madera 2x3 + lana vidrio + yeso carton",elem:"muro",zonas:"ABCDEFGH",rf:"F60",rw_base:48,masa_kg_m2:28,capas:[{n:"Yeso carton",lam:0.26,esp:10,esAislante:false,mu:8,den:700},{n:"Lana de vidrio",lam:0.036,esp:80,esAislante:true,mu:1,den:13},{n:"OSB",lam:0.23,esp:11,esAislante:false,mu:200,den:650},{n:"Camara aire",lam:null,esp:0,esAislante:false,mu:null,esCamara:true},{n:"Yeso carton interior",lam:0.26,esp:10,esAislante:false,mu:8,den:700}],nota:"Aumentar lana mejora U.",advertencia:null},
  {cod:"1.2.G.C1.4",desc:"Perfiles acero + lana vidrio + EPS 20kg exterior",elem:"muro",zonas:"ABCDEFGHI",rf:"F60",rw_base:45,masa_kg_m2:35,capas:[{n:"Yeso carton",lam:0.26,esp:10,esAislante:false,mu:8,den:700},{n:"Lana de vidrio",lam:0.036,esp:80,esAislante:true,mu:1,den:13},{n:"EPS 20kg exterior",lam:0.040,esp:30,esAislante:true,mu:60,den:20},{n:"Revoque exterior",lam:0.70,esp:15,esAislante:false,mu:25,den:1800}],nota:"Dos capas aislantes modificables.",advertencia:"Puente termico en perfiles metalicos reduce U real 15-20%."},
  {cod:"1.2.M.A25.1",desc:"H.A. 15cm + PU proyectado TIFF 60mm (LOSCAT 1.2.M.A25.1)",elem:"muro",zonas:"ABCDEFGHI",rf:"F90",rw_base:52,masa_kg_m2:375,capas:[{n:"Hormigon armado",lam:2.50,esp:150,esAislante:false,mu:130,den:2400},{n:"PU proyectado TIFF 29kg",lam:0.027,esp:60,esAislante:true,mu:50,den:29},{n:"Pasta elastomerica",lam:0.70,esp:2,esAislante:false,mu:25,den:1400}],nota:"U=0.41@60mm, 0.35@70mm, 0.29@80mm. Espesor segun zona.",advertencia:"RF PU proyectado: verificar ensayo NCh850 especifico del producto."},
  {cod:"1.2.M.B16.1",desc:"Albanileria confinada + PU proyectado TIFF 60mm (LOSCAT 1.2.M.B16.1)",elem:"muro",zonas:"ABCDEFGHI",rf:"F90",rw_base:50,masa_kg_m2:280,capas:[{n:"Albanileria ceramica 140mm",lam:0.48,esp:140,esAislante:false,mu:8,den:1700},{n:"PU proyectado TIFF 29kg",lam:0.027,esp:60,esAislante:true,mu:50,den:29},{n:"Pasta elastomerica",lam:0.70,esp:2,esAislante:false,mu:25,den:1400}],nota:"U=0.63@30mm, 0.51@40mm, 0.37@60mm, 0.29@80mm. Espesor segun zona.",advertencia:null},
  {cod:"1.2.M.A23.1",desc:"H.A. 10cm + PROSOL SATE EPS 20kg 60mm (LOSCAT 1.2.M.A23.1)",elem:"muro",zonas:"ABCDEFGHI",rf:"F90",rw_base:51,masa_kg_m2:265,capas:[{n:"Hormigon armado 100mm",lam:2.50,esp:100,esAislante:false,mu:130,den:2400},{n:"EPS 20kg/m3 PROSOL",lam:0.0384,esp:60,esAislante:true,mu:60,den:20},{n:"Malla fibra + mortero mineral",lam:0.70,esp:6,esAislante:false,mu:25,den:1400}],nota:"U=0.56@60mm, 0.43@80mm, 0.35@100mm. Espesor segun zona.",advertencia:"Verificar clase reaccion fuego EPS (exterior)."},
  {cod:"1.1.M.B4.1.2",desc:"Panel Losa Nervada Cubierta Monoplac PLN-150 (LOSCAT 1.1.M.B4.1.2)",elem:"techumbre",zonas:"ABCDEF",rf:"F60",rw_base:null,masa_kg_m2:350,capas:[{n:"EPS nervado 10kg 130+40mm",lam:0.041,esp:130,esAislante:true,mu:40,den:10},{n:"Malla AT56 + HA gravilla 140+50mm",lam:1.63,esp:140,esAislante:false,mu:130,den:2400},{n:"Yeso carton 10mm",lam:0.26,esp:10,esAislante:false,mu:8,den:700}],nota:"U=0.44 Rt=2.28. Cubierta plana tipo tralix. Uso para zonas A-F (Umax techo hasta 0.28).",advertencia:null},
  {cod:"1.4.M.A1.1",desc:"Losa H.A. 120mm + EPS inferior 60mm",elem:"piso",zonas:"ABCDEF",rf:"F60",rw_base:null,masa_kg_m2:264,capas:[{n:"Hormigon armado",lam:1.63,esp:120,esAislante:false,mu:130,den:2200},{n:"EPS inferior",lam:0.040,esp:60,esAislante:true,mu:60,den:20}],nota:"Piso ventilado.",advertencia:"Para acustica de impacto agregar solado flotante."},
];

// ─── VIDRIOS / MARCOS ─────────────────────────────────────────────────────────
export const VIDRIOS=[{grupo:"Vidrio simple",items:[{n:"Vidrio simple 4mm",ug:5.8,desc:"Solo Zona A."},{n:"Vidrio simple 6mm",ug:5.7,desc:"Solo Zona A."}]},{grupo:"DVH aire",items:[{n:"DVH 4/6/4 aire",ug:3.3,desc:"Zonas A-C."},{n:"DVH 4/9/4 aire",ug:2.9,desc:"Zonas B-D."},{n:"DVH 4/12/4 aire",ug:2.7,desc:"Zonas B-D."},{n:"DVH 4/16/4 aire",ug:2.6,desc:"Zonas C-E."}]},{grupo:"DVH argon",items:[{n:"DVH 4/6/4 argon",ug:3.0,desc:"Mejora 10% vs aire."},{n:"DVH 4/9/4 argon",ug:2.6,desc:"Zonas D-E."},{n:"DVH 4/12/4 argon",ug:2.4,desc:"Zonas D-F."},{n:"DVH 4/16/4 argon",ug:2.2,desc:"Zonas E-F."}]},{grupo:"DVH Low-E",items:[{n:"DVH 4/12/4 Low-E aire",ug:1.8,desc:"Zonas E-G."},{n:"DVH 4/12/4 Low-E argon",ug:1.5,desc:"Zonas F-H."},{n:"DVH 4/16/4 Low-E argon",ug:1.4,desc:"Zonas G-I."}]},{grupo:"TVH triple",items:[{n:"TVH 4/9/4/9/4 aire",ug:1.8,desc:"Tres vidrios."},{n:"TVH 4/12/4/12/4 argon",ug:1.2,desc:"Zonas G-I."},{n:"TVH Low-E argon",ug:0.8,desc:"Maximo estandar."}]}];
export const MARCOS=[{grupo:"Aluminio sin RPT",items:[{n:"Al sin RPT estandar",uf:5.9,psi:0.10,desc:"Solo Zonas A-C."},{n:"Al sin RPT reforzado",uf:5.5,psi:0.10,desc:"Solo Zonas A-C."}]},{grupo:"Aluminio con RPT",items:[{n:"Al con RPT 12mm",uf:3.5,psi:0.08,desc:"Zonas C-E."},{n:"Al con RPT 24mm",uf:2.8,psi:0.07,desc:"Zonas D-F."},{n:"Al con RPT 32mm",uf:2.5,psi:0.06,desc:"Zonas E-G."},{n:"Al con RPT 40mm",uf:2.2,psi:0.06,desc:"Zonas F-H."}]},{grupo:"PVC",items:[{n:"PVC 2 camaras",uf:2.2,psi:0.07,desc:"Zonas D-F."},{n:"PVC 3 camaras",uf:2.0,psi:0.06,desc:"Zonas E-G."},{n:"PVC 5 camaras",uf:1.7,psi:0.05,desc:"Zonas F-H."},{n:"PVC 6 camaras reforzado",uf:1.4,psi:0.05,desc:"Zonas G-I."}]},{grupo:"Madera",items:[{n:"Madera pino 68mm",uf:2.0,psi:0.07,desc:"Zonas D-G."},{n:"Madera pino 78mm",uf:1.8,psi:0.06,desc:"Zonas E-H."},{n:"Madera/aluminio composite",uf:2.0,psi:0.06,desc:"Zonas D-H."}]},{grupo:"Acero",items:[{n:"Acero sin RPT",uf:7.0,psi:0.12,desc:"Solo Zona A."},{n:"Acero con RPT",uf:3.8,psi:0.09,desc:"Zonas B-D."}]}];

// ─── RECOMENDACIONES POR USO ──────────────────────────────────────────────────
export const REC_USO={
  Vivienda:{desc:"Prioridad: confort termico, costo accesible, acustica entre unidades.",muros:[{cod:"1.2.G.C1.3",razon:"Liviano, economico, cumple termica y acustica en zonas A-H."},{cod:"1.2.M.B16.1",razon:"Albanileria + PU TIFF. Optimo en zonas frias. Alta masa para acustica."},{cod:"1.2.M.F2.3",razon:"Panel Monoplac PMO-110. Rapido montaje."}],techumbres:[{cod:"1.1.M.B4.1.1",razon:"Losa PLN-120 (U=0.51). Estandar residencial zonas A-E."},{cod:"1.1.M.B4.1.2",razon:"Losa PLN-150 (U=0.44). Para zonas A-F."}],pisos:[{cod:"1.4.M.A1.1",razon:"Losa H.A. + EPS 60mm inferior."}],tabiques:[]},
  Educacion:{desc:"Prioridad: RF F60+ en estructura, acustica entre aulas min 40 dB.",muros:[{cod:"1.2.M.A25.1",razon:"H.A. 15cm + PU TIFF (LOSCAT 1.2.M.A25.1). RF F90, Rw 52 dB. Optimo para muros perimetrales."},{cod:"1.2.M.A23.1",razon:"H.A. 10cm + PROSOL SATE (LOSCAT 1.2.M.A23.1). RF F90."}],techumbres:[{cod:"1.1.M.B4.1.2",razon:"Losa PLN-150 (LOSCAT 1.1.M.B4.1.2). RF F60."},{cod:"1.3.M.A6.1",razon:"Losa H.A. 12cm + SATE inferior."}],pisos:[{cod:"1.4.M.A1.1",razon:"Losa H.A. + EPS 60mm."},{cod:"1.4.M.A1.2",razon:"Losa H.A. + EPS 80mm. Para zonas E-H."}],tabiques:[{cod:"1.2.T.A1.2",razon:"Doble yeso carton + lana mineral 100mm. Rw 48 dB."},{cod:"1.2.T.B1.1",razon:"Albanileria ceramica 14cm. Rw 47 dB, RF F90."}]},
  Salud:{desc:"Maxima exigencia: RF F90+ estructura, acustica min 50 dB.",muros:[{cod:"1.2.M.A25.1",razon:"H.A. 15cm + PU TIFF (LOSCAT 1.2.M.A25.1). RF F90, Rw 52 dB."},{cod:"1.2.M.B16.1",razon:"Albanileria + PU TIFF (LOSCAT 1.2.M.B16.1). RF F90, Rw 50 dB."}],techumbres:[{cod:"1.1.M.B4.1.2",razon:"Losa PLN-150 (LOSCAT 1.1.M.B4.1.2). RF F60."}],pisos:[{cod:"1.4.M.A1.2",razon:"Losa H.A. + EPS 80mm."}],tabiques:[{cod:"1.2.T.C1.1",razon:"H.A. 150mm. RF F120, Rw 52 dB. Quirofanos, UCI."},{cod:"1.2.T.A1.2",razon:"Doble yeso carton + lana mineral 100mm. Consultorios."}]},
};

// ─── ALERTAS MODELO ───────────────────────────────────────────────────────────
export const ALERTAS_MODELO=[
  {elem:"MU-01 H.A. 300mm",estado:"fail",msg:"Sin aislante. U estimado 0.82 W/m2K. Zona E exige max 0.60."},
  {elem:"MU-02 H.A. 200mm",estado:"fail",msg:"Sin aislante. U estimado 1.25 W/m2K. NO CUMPLE Zona E."},
  {elem:"MU-03 H.A. 150mm",estado:"fail",msg:"Sin aislante. U estimado 1.67 W/m2K. NO CUMPLE Zona E."},
  {elem:"Me01 EIFS 60mm EPS",estado:"warn",msg:"Combinado con H.A. 150mm da U 0.29 W/m2K CUMPLE. Verificar integracion en Revit."},
  {elem:"TABI-01/02/03 perfileria 90mm",estado:"fail",msg:"Sin lana mineral en nucleo. Rw estimado 35-38 dB. Educacion exige min 40 dB entre aulas."},
  {elem:"Losas H.A. 150-200mm pisos",estado:"fail",msg:"Sin aislacion inferior. Zona E exige max 0.60 W/m2K para piso ventilado."},
  {elem:"Cubierta PV4 + OSB",estado:"fail",msg:"Sin aislante termico. Zona E exige max 0.33 W/m2K."},
  {elem:"Losa 18cm Cubierta Hormigon",estado:"warn",msg:"Solo H.A. U estimado 0.90 W/m2K. Zona E exige max 0.33. Agregar panel aislante superior."},
];

// ─── INSTRUCCIONES ────────────────────────────────────────────────────────────
export const INST={
  recomendadas:{titulo:"Soluciones recomendadas por uso",pasos:["Selecciona el uso del edificio en Diagnostico primero.","Las soluciones verdes cumplen termica, fuego y acustica simultaneamente.","Presiona Aplicar al proyecto para transferir U, RF y Rw y precargar capas.","Las capas se precargan con lambda y mu segun NCh853."],concepto:"Al hacer Aplicar al proyecto, el sistema precarga los valores U/RF/Rw y carga todas las capas en Calculo U y Condensacion.",normativa:"LOSCAT Ed.13 2025 | LOCF Ed.17 2025 | NCh 352 | OGUC Titulo 4."},
  diagnostico:{titulo:"Diagnostico normativo del proyecto",pasos:["Busca tu comuna o selecciona la zona termica manualmente.","Selecciona el uso del edificio.","Ingresa el numero de pisos.","Selecciona el tipo de estructura.","Presiona Generar ficha normativa."],concepto:"Este diagnostico define que exige la norma para tu caso especifico.",normativa:"DS N.15 MINVU, OGUC Titulo 4, NCh 352, NCh1079:2019."},
  proyecto:{titulo:"Datos del proyecto",pasos:["Escribe el nombre del proyecto.","Busca tu comuna para asignar zona termica automaticamente.","El Uso define que normativas aplican.","El Arquitecto responsable aparecera en el informe."],concepto:"La Zona Termica (A a I) determina todos los valores maximos de transmitancia termica.",normativa:"NCh1079:2019 y tabla de comunas del DS N.15 MINVU."},
  selector:{titulo:"Selector de soluciones constructivas",pasos:["Selecciona el tipo de elemento.","El semaforo indica cumplimiento de termica, fuego y acustica.","Haz clic en una solucion para expandirla.","Presiona Aplicar al proyecto para transferir todos los datos."],concepto:"U es transmitancia termica W/m2K. RF es resistencia al fuego. Rw es aislamiento acustico dB.",normativa:"LOSCAT Ed.13 2025 + LOCF Ed.17 2025 + LOSCAA DITEC-MINVU."},
  termica:{titulo:"Datos termicos RT-2025",pasos:["Si aplicaste una solucion, los campos ya estan prellenados.","Para ventanas usa la pestana U Ventana primero.","Sistema de ventilacion: obligatorio en viviendas.","Condensacion: verifica con la pestana Condensacion."],concepto:"La envolvente termica es todo lo que separa interior del exterior.",normativa:"Art. 4.1.10 OGUC, DS N.15 MINVU, vigente desde el 28/11/2025."},
  fuego:{titulo:"Resistencia al fuego",pasos:["Ingresa la RF propuesta para cada elemento.","F30, F60, F90, F120: minutos de resistencia."],concepto:"La RF no es aislacion termica. Es tiempo de evacuacion segura ante incendio.",normativa:"OGUC Titulo 4, Art. 4.5.4. LOCF Ed.17 2025 DITEC-MINVU."},
  acustica:{titulo:"Aislamiento acustico",pasos:["Ingresa el Rw en dB de cada elemento separador.","Rw es el indice de reduccion sonora ponderada."],concepto:"45 dB significa que si en un lado hay 70 dB, al otro llegan solo 25 dB.",normativa:"NCh 352, NCh 353, OGUC Art. 4.1.6."},
  calcU:{titulo:"Calculadora de transmitancia U (NCh853)",pasos:["Si aplicaste una solucion, las capas ya estan precargadas.","Puedes agregar capas adicionales o modificar espesores.","Presiona Calcular U y luego Guardar para incluir en el informe DOM."],concepto:"U = 1 / R_total. R = espesor / conductividad. Valido ante DOM segun NCh853.",normativa:"NCh853:2021."},
  condensacion:{titulo:"Analizador de condensacion (NCh1973 Glaser)",pasos:["Si aplicaste una solucion, las capas estan precargadas con lambda Y mu.","Las condiciones de T y HR se precargan segun la zona termica.","Presiona Analizar para ver el perfil de temperatura.","Si alguna interfaz aparece en rojo, hay condensacion intersticial."],concepto:"La condensacion ocurre cuando el vapor interior se convierte en agua liquida dentro del elemento.",normativa:"NCh1973, metodo Glaser. Exigido en Art. 4.1.10 OGUC desde 28/11/2025."},
  ventana:{titulo:"Calculo U de ventana",pasos:["Selecciona el vidrio y el marco. Los valores Ug, Uf y psi se aplican automaticamente.","Ingresa las areas de vidrio (Ag) y marco (Af) en m2, y la longitud de junta (lg) en metros.","El resultado U es el que debes ingresar en el tab Termica."],concepto:"Una ventana tiene tres caminos de perdida de calor: vidrio, marco y junta.",normativa:"NCh853:2021 y EN 10077."},
  resultados:{titulo:"Resultados y exportacion",pasos:["CUMPLE (verde): satisface la exigencia de la norma vigente.","NO CUMPLE (rojo): debes cambiar solucion constructiva o aumentar aislante.","Exporta el informe en HTML (imprimible) o TXT (expediente DOM)."],concepto:"Este informe es verificacion preliminar. El arquitecto responsable debe firmarlo.",normativa:"La responsabilidad tecnica y legal es del profesional competente que firma el expediente."},
};

// ─── ELEMENTOS NORMATIVOS ─────────────────────────────────────────────────────
export const ELEM_NORM=[
  {id:"muro",     label:"Muro perimetral",   icon:"▦", color:"#1e40af", tipoU:"muro",   condObl:true,  normativa:"NCh853 + NCh1973"},
  {id:"techo",    label:"Techumbre",          icon:"△", color:"#0369a1", tipoU:"techo",  condObl:true,  normativa:"NCh853 + NCh1973"},
  {id:"piso",     label:"Piso ventilado",     icon:"▬", color:"#0891b2", tipoU:"piso",   condObl:true,  normativa:"NCh853 + NCh1973"},
  {id:"sobr",     label:"Sobrecimiento",      icon:"⊟", color:"#b45309", tipoU:"sobr",   condObl:true,  normativa:"DS N.15 — R100 min"},
  {id:"radier",   label:"Radier/Piso s/suelo",icon:"▒", color:"#92400e", tipoU:"radier", condObl:false, normativa:"DS N.15 — R100 min"},
  {id:"ventana",  label:"Ventana",            icon:"⊡", color:"#0369a1", tipoU:null,     condObl:false, normativa:"Tabla VPCT"},
  {id:"puerta",   label:"Puerta exterior",    icon:"◫", color:"#374151", tipoU:null,     condObl:false, normativa:"DS N.15 U max"},
];

// ─── SUBGRUPOS PUERTA ─────────────────────────────────────────────────────────
export const SUBGRUPOS_PUERTA=[
  {pref:"3.1.P.M.",  label:"Madera",                   icon:"🪵",color:"#92400e",bg:"#fef3c7"},
  {pref:"3.1.P.AL.", label:"Aluminio",                  icon:"⬡", color:"#1e40af",bg:"#dbeafe"},
  {pref:"3.1.P.A.",  label:"Metalica acero",            icon:"🔩",color:"#374151",bg:"#f1f5f9"},
  {pref:"3.1.P.P.",  label:"PVC",                       icon:"⬜",color:"#0369a1",bg:"#eff6ff"},
  {pref:"3.1.P.VI.", label:"Vidrio / Cristal",          icon:"🔲",color:"#0891b2",bg:"#ecfeff"},
  {pref:"3.1.P.EN.", label:"Enrollable / Seccional",    icon:"⬛",color:"#166534",bg:"#dcfce7"},
  {pref:"3.1.P.G.",  label:"Garage / Acceso vehicular", icon:"🚗",color:"#166534",bg:"#f0fdf4"},
  {pref:"3.1.P.E.",  label:"Cortafuego / Emergencia",   icon:"🔥",color:"#dc2626",bg:"#fef2f2"},
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const rfN=s=>parseInt(s?.replace("F","")||0);
export const satP=T=>610.8*Math.exp(17.27*T/(T+237.3));
export const dewPoint=(T,HR)=>{const a=17.27,b=237.3,al=(a*T/(b+T))+Math.log(HR/100);return b*al/(a-al);};
export const ist={border:"1.5px solid #cbd5e1",borderRadius:6,padding:"5px 8px",fontSize:12,background:"#fff"};
export const colSem=v=>v<=1.5?"#16a34a":v<=2.8?"#d97706":"#dc2626";

// ─── Glaser (NCh853:2021) + ISO 6946:2017 método combinado ───────────────────────
// Para capas con `estructura_integrada` (montantes de madera/acero):
//   · U final = 1/R_T con R_T = (R_upper + R_lower)/2 — valores reales para DOM
//   · Perfil de temperatura usa R_upper (planos isotérmicos) — análisis Glaser conservador
//   · Se añade `aviso_puente` y `iso6946` al resultado cuando hay puente térmico
export const calcGlaser=(cv,ti,te,hr,elemTipo="muro")=>{
  if(!cv||!cv.length||isNaN(ti)||isNaN(te)||isNaN(hr))return null;
  const rsiKey=elemTipo==="techumbre"?"techo":elemTipo==="piso"?"piso":"muro";
  const rsi=RSI_MAP[rsiKey]||0.13;
  const rse=RSE_MAP[rsiKey]||0.04;

  // R efectivo por capa (planos isotérmicos: mezcla paralela para capa mixta)
  function Reff(c){
    if(c.esCamara||c.camara) return RCAMARA;
    if(c.estructura_integrada){
      const eb=c.estructura_integrada;
      const fa=Math.min(Math.max(eb.ancho_mm/eb.distancia_mm,0.01),0.99);
      const Rs=c.esp/eb.lam, Ri=c.esp/c.lam;
      return 1/(fa/Rs+(1-fa)/Ri);
    }
    return c.esp/c.lam;
  }

  // ── R_T con método ISO 6946 combinado (superior+inferior)/2 ──────────────────
  const isoR=calcR_ISO6946_helper(cv,elemTipo);
  const Rtot=isoR.R_T;  // U certificable = 1/Rtot (NCh853/ISO 6946)

  // ── Perfil de temperaturas (usa R_upper — planos isotérmicos — más conservador) ─
  const Rtot_temp=isoR.R_upper;
  const temps=[ti];
  let Ra=rsi;
  for(const c of cv){
    Ra+=Reff(c);
    temps.push(ti-(ti-te)*Ra/Rtot_temp);
  }

  // ── Presiones de vapor saturado y real (Método Glaser, NCh853:2021 Anexo C) ───
  const Pvsi=satP(ti)*hr/100;
  const Pvse=satP(te)*0.80;
  const sdTot=cv.reduce((s,c)=>{
    if(c.esCamara||c.camara) return s+(1*(c.esp||0));
    return s+((c.mu||1)*(c.esp*1000));
  },0)||1;
  let sdA=0;
  const pv=[Pvsi];
  for(const c of cv){
    if(c.esCamara||c.camara){sdA+=1*(c.esp||0);}
    else{sdA+=(c.mu||1)*(c.esp*1000);}
    pv.push(Pvsi-(Pvsi-Pvse)*sdA/sdTot);
  }

  const Tdew=dewPoint(ti,hr);
  // Rs por capa para posicionamiento gráfico (usa Reff = R efectivo isotérmico)
  const Rs=[rsi];
  for(const c of cv){Rs.push(Reff(c));}
  Rs.push(rse);

  const ifaces=cv.map((_,i)=>{
    const T=temps[i+1],pvSat=satP(T),pvReal=pv[i+1],riesgo=pvReal>pvSat;
    const margen=Math.round(pvSat-pvReal);
    return{i:i+1,T:T.toFixed(2),pvSat:pvSat.toFixed(0),pvReal:pvReal.toFixed(0),margen,riesgo};
  });
  const condInter=ifaces.some(x=>x.riesgo);
  const condSup=temps[temps.length-1]<Tdew;
  let caso="ok";
  if(condInter)caso="intersticial";
  else if(condSup)caso="superficial_piso";
  const U=parseFloat((1/Rtot).toFixed(4));

  // ── Alerta puente térmico metálico ────────────────────────────────────────────
  const aceroLayer=cv.find(c=>c.estructura_integrada?.tipo==='acero');
  let aviso_puente=null;
  if(aceroLayer){
    const cvSin=cv.map(c=>c.estructura_integrada?{...c,estructura_integrada:null}:c);
    const R_sin=calcR_ISO6946_helper(cvSin,elemTipo).R_T;
    const U_sin=parseFloat((1/R_sin).toFixed(4));
    const pct=Math.round((U-U_sin)/U_sin*100);
    aviso_puente={tipo:'acero',U_sin_tb:U_sin,U_con_tb:U,pct,
      R_upper:isoR.R_upper.toFixed(4),R_lower:isoR.R_lower.toFixed(4),fa:isoR.fa};
  }

  return{
    temps,pv,ifaces,condInter,condSup,caso,
    Tdew:Tdew.toFixed(2),U:U.toFixed(4),Rtot,Rs,
    Pvsi:Pvsi.toFixed(0),Pvse:Pvse.toFixed(0),
    // Datos ISO 6946 (null si no hay estructura integrada)
    iso6946: isoR.hasEB ? {
      R_upper:isoR.R_upper.toFixed(4),R_lower:isoR.R_lower.toFixed(4),
      R_T:Rtot.toFixed(4),fa:isoR.fa,fb:isoR.fb,
    } : null,
    aviso_puente,
  };
};

// Materiales aislantes candidatos para sustitución/adición (λ ≤ 0.05)
const AISLS=[
  {n:"XPS extruido",       lam:0.036,mu:100,esp:0.060},
  {n:"PU proyectado",      lam:0.026,mu:50, esp:0.050},
  {n:"Lana mineral 30kg",  lam:0.035,mu:1,  esp:0.080},
  {n:"EPS 20kg/m3",        lam:0.040,mu:60, esp:0.060},
  {n:"Lana vidrio 13kg",   lam:0.036,mu:1,  esp:0.080},
  {n:"Fibra madera",       lam:0.040,mu:5,  esp:0.080},
];

// ── Capas de cierre normativas (terminaciones protectoras) ────────────────────
// Exportadas para uso eventual en UI
export const CAPAS_CIERRE_EXT=[
  {n:"Fibrocemento",              lam:0.23, esp:0.006, mu:50,    desc:"6mm · NC 1270"},
  {n:"Estuco cemento",            lam:0.87, esp:0.020, mu:15,    desc:"20mm"},
  {n:"Siding PVC",                lam:0.16, esp:0.012, mu:10000, desc:"1.2mm (equiv.)"},
  {n:"Ladrillo visto",            lam:0.69, esp:0.070, mu:10,    desc:"70mm · NCh167"},
];
export const CAPAS_CIERRE_INT=[
  {n:"Yeso carton",               lam:0.26, esp:0.013, mu:8,     desc:"13mm · NC 1070"},
  {n:"Enlucido de yeso",          lam:0.58, esp:0.010, mu:6,     desc:"10mm"},
  {n:"Terciado ranurado",         lam:0.13, esp:0.009, mu:50,    desc:"9mm"},
];
const _BHum ={n:"Barrera de humedad (Tyvek/fieltro)", lam:0.23, esp:0.0003, mu:150};
const _BVap ={n:"Barrera de vapor (polietileno)",     lam:0.23, esp:0.0002, mu:9999};

// ── Clasificación constructiva de cada capa ───────────────────────────────────
// Retorna: 'vapor'|'humedad'|'aislante'|'rev_ext'|'rev_int'|'camara'|'estructura'
function clasificarCapa(c){
  if(c.esCamara||c.camara) return 'camara';
  const n=(c.n||c.mat||'').toLowerCase();
  const lam=parseFloat(c.lam)||1;
  const mu =parseFloat(c.mu) ||1;
  // Barreras de vapor: μ extremadamente alto o nombre explícito
  if(mu>=5000||n.includes('barrera de v')||n.includes('polietileno')||n.includes('polyethylene')) return 'vapor';
  // Barreras de humedad: transpirables pero impermeables al agua
  if(n.includes('tyvek')||n.includes('fieltro')||n.includes('barrera de hum')||
    (n.includes('membrana')&&!n.includes('vapor'))||(n.includes('lamina')&&mu<5000)) return 'humedad';
  // Aislantes: λ ≤ 0.05 W/mK (excluye fibrocemento que tiene λ=0.23)
  if(lam<=0.050&&!n.includes('fibrocemento')&&!n.includes('siding')&&!n.includes('acero')) return 'aislante';
  // Revestimientos exteriores reconocibles
  if(n.includes('fibrocemento')||n.includes('siding')||n.includes('ladrillo visto')||
    n.includes('estuco')||n.includes('revoque')||n.includes('ceramica')||
    n.includes('zinc')||n.includes('acero gal')||n.includes('cladding')) return 'rev_ext';
  // Revestimientos interiores reconocibles
  if(n.includes('yeso cart')||n.includes('yeso car')||n.includes('enlucido')||
    n.includes('terciado')||n.includes('ranurado')||n.includes('tablex')) return 'rev_int';
  return 'estructura';
}

// Devuelve true si la capa es técnicamente imposible de dejar expuesta
function debeProtegerse(c){ const t=clasificarCapa(c); return t==='aislante'||t==='humedad'||t==='vapor'; }

// Asegura que ningún extremo del complejo quede con capa sin protección
function validarCierre(cv,tipoElem){
  if(!cv||!cv.length) return cv;
  let r=[...cv];
  // Encontrar primera y última capas funcionales (no cámara)
  const func=r.filter(c=>!c.esCamara&&!c.camara);
  if(!func.length) return r;
  // Interior: si la primera capa no puede quedar expuesta → agregar rev_int
  if(debeProtegerse(func[0])){
    r=[{...CAPAS_CIERRE_INT[0],_rol:'cierre_int'},...r];
  }
  // Recompute después de posible adición interior
  const funcR=r.filter(c=>!c.esCamara&&!c.camara);
  const ultima=funcR[funcR.length-1];
  // Exterior: si la última capa no puede quedar expuesta → agregar rev_ext
  if(debeProtegerse(ultima)){
    const ext=tipoElem==='techumbre'
      ? {n:'Fibrocemento',lam:0.23,esp:0.006,mu:50,_rol:'cierre_ext'}
      : {...CAPAS_CIERRE_EXT[0],_rol:'cierre_ext'};
    r=[...r,ext];
  }
  return r;
}

// Inserta una capa justo antes del primer revestimiento exterior (o al final si no hay)
function insertarAntesRevExt(cv,capa){
  let idx=-1;
  for(let i=cv.length-1;i>=0;i--){if(clasificarCapa(cv[i])==='rev_ext'){idx=i;break;}}
  if(idx>=0) return [...cv.slice(0,idx),capa,...cv.slice(idx)];
  return [...cv,capa];
}

// Inserta una capa justo después del primer revestimiento interior (o al inicio si no hay)
function insertarTrasRevInt(cv,capa){
  const idx=cv.findIndex(c=>clasificarCapa(c)==='rev_int');
  if(idx>=0) return [...cv.slice(0,idx+1),capa,...cv.slice(idx+1)];
  return [capa,...cv];
}

// ─── Glaser ligero (sin ISO 6946) — SOLO para generarCorrecciones ────────────
// Las capas construidas con AISLS nunca tienen `estructura_integrada`, así que
// podemos usar la suma de serie pura y ahorrarnos la doble pasada de ISO 6946.
function _calcGlaserSimple(cv,ti,te,hr,elemTipo="muro"){
  if(!cv||!cv.length||isNaN(ti)||isNaN(te)||isNaN(hr))return null;
  const rsiKey=elemTipo==="techumbre"?"techo":elemTipo==="piso"?"piso":"muro";
  const rsi=RSI_MAP[rsiKey]||0.13;
  const rse=RSE_MAP[rsiKey]||0.04;
  function Rlay(c){
    if(c.esCamara||c.camara)return RCAMARA;
    if(!c.lam||c.lam<=0)return 0;
    return c.esp/c.lam;
  }
  const Rtot=rsi+rse+cv.reduce((s,c)=>s+Rlay(c),0);
  if(Rtot<=0)return null;
  const temps=[ti];
  let Ra=rsi;
  for(const c of cv){Ra+=Rlay(c);temps.push(ti-(ti-te)*Ra/Rtot);}
  const Pvsi=satP(ti)*hr/100;
  const Pvse=satP(te)*0.80;
  const sdTot=cv.reduce((s,c)=>{
    if(c.esCamara||c.camara)return s+(1*(c.esp||0));
    return s+((c.mu||1)*(c.esp*1000));
  },0)||1;
  let sdA=0;
  const pv=[Pvsi];
  for(const c of cv){
    if(c.esCamara||c.camara){sdA+=1*(c.esp||0);}
    else{sdA+=(c.mu||1)*(c.esp*1000);}
    pv.push(Pvsi-(Pvsi-Pvse)*sdA/sdTot);
  }
  const Tdew=dewPoint(ti,hr);
  const ifaces=cv.map((_,i)=>{
    const T=temps[i+1],pvSat=satP(T),pvReal=pv[i+1],riesgo=pvReal>pvSat;
    return{i:i+1,T:T.toFixed(2),pvSat:pvSat.toFixed(0),pvReal:pvReal.toFixed(0),margen:Math.round(pvSat-pvReal),riesgo};
  });
  const condInter=ifaces.some(x=>x.riesgo);
  const condSup=temps[temps.length-1]<Tdew;
  const U=parseFloat((1/Rtot).toFixed(4));
  return{temps,pv,ifaces,condInter,condSup,caso:condInter?"intersticial":condSup?"superficial_piso":"ok",
    Tdew:Tdew.toFixed(2),U:U.toFixed(4),Rtot,Pvsi:Pvsi.toFixed(0),Pvse:Pvse.toFixed(0),
    iso6946:null,aviso_puente:null};
}

// ─── Caché de correcciones (evita recalcular para la misma configuración) ──────
const _corrCache=new Map();
const _MAX_CACHE=40;
function _cacheKey(cv,ti,te,hr,elemTipo,umaxTarget){
  const sig=cv.map(c=>c.esCamara?'CAM':`${c.lam}|${Math.round((c.esp||0)*1000)}|${c.mu||1}`);
  return sig.join('~')+'|'+ti+'|'+te+'|'+hr+'|'+elemTipo+'|'+umaxTarget;
}

// ─── Búsqueda de espesor mínimo: while + salto grueso 40mm + refinación 10mm ─
// tryFn(e) → bool. e en mm. Retorna mm óptimo o null.
// ASYNC: cede el hilo cada 5 iteraciones con setTimeout(0) (macrotarea real,
// permite al navegador pintar el spinner y atender el mouse).
// Hard-cap: 50 iter por estrategia.
const _YIELD = () => new Promise(resolve => setTimeout(resolve, 0));
const PASO_GRUESO = 40;
const MAX_ITER = 50;

async function _findMinEsp(minEsp, maxEsp, tryFn) {
  let iter = 0;
  let espesorTest = minEsp;
  let prevFail = null, firstPass = null;

  // ── Fase 1: salto grueso (40 mm) ─────────────────────────────────────────
  while (espesorTest <= maxEsp && iter < MAX_ITER) {
    iter++;
    // 🔥 Yield: cede el hilo principal para que el navegador pinte
    if (iter % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (tryFn(espesorTest)) { firstPass = espesorTest; break; }
    prevFail = espesorTest;
    espesorTest += PASO_GRUESO;
  }

  if (firstPass === null) return null;

  // ── Fase 2: refinación fina (10 mm) entre (prevFail, firstPass) ──────────
  const fineStart = prevFail === null ? minEsp : prevFail + 10;
  for (let e = fineStart; e < firstPass && iter < MAX_ITER; e += 10) {
    iter++;
    if (iter % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (tryFn(e)) return e;
  }
  return firstPass;
}

// ─── generarCorrecciones — ASYNC, chunked, con caché + penalty ISO 6946 ──────
// Cada estrategia (C1–C6) cede el hilo al navegador con setTimeout(0) (macro-
// tarea real) antes de ejecutar y cada 5 iteraciones dentro de _findMinEsp,
// manteniendo la UI fluida y permitiendo mostrar el spinner sin Web Worker.
// Hard-cap: 50 iter por estrategia (si no converge, break y siguiente).
//
// FACTOR DE CASTIGO (penalty factor) — evita falsos positivos por puente térmico:
//   El motor interno usa _calcGlaserSimple (1D, ignora montantes). Si la
//   composición original incluye `estructura_integrada`, la solución sugerida
//   podría fallar al re-evaluarse con ISO 6946 (U_eff > U_simple). Por eso
//   acá se estrecha el target local (umaxPenalizado) y se avisa al usuario.
//     · estructura_integrada.tipo === 'acero'  → castigo 30 % (×0.70)
//     · estructura_integrada.tipo === 'madera' → castigo 15 % (×0.85)
//   El umaxTarget mostrado en textos/etiquetas conserva el valor legal
//   original; solo la búsqueda interna usa el penalizado.
export async function generarCorrecciones(cv,ti,te,hr,elemTipo="muro",umaxTarget=null){
  if(!cv||!cv.length)return[];

  // ── Detectar puente térmico integrado ────────────────────────────────────────
  const estrLayer = cv.find(c => c?.estructura_integrada?.tipo);
  const estrTipo  = estrLayer?.estructura_integrada?.tipo || null;   // 'acero' | 'madera' | null
  const penalty   = estrTipo === 'acero'  ? 0.30
                  : estrTipo === 'madera' ? 0.15
                  : 0;
  const umaxPenalizado = (umaxTarget && penalty>0)
                          ? +(umaxTarget * (1 - penalty)).toFixed(3)
                          : umaxTarget;
  const avisoPenalty = penalty>0
    ? `Se ha sugerido un espesor mayor para compensar el puente térmico de la estructura de ${estrTipo} (ISO 6946). Target interno ${umaxPenalizado} W/m²K vs. legal ${umaxTarget} W/m²K (castigo ${Math.round(penalty*100)} %).`
    : null;

  const r0=_calcGlaserSimple(cv,ti,te,hr,elemTipo);
  const U0=r0?parseFloat(r0.U):null;
  // Trigger de necesidad: se compara con umaxTarget LEGAL (no el penalizado),
  // para no crear correcciones donde la norma no las exige.
  const necesitaU=!!(umaxTarget&&U0&&U0>umaxTarget);
  const necesitaCond=!!r0?.condInter;
  if(!necesitaU&&!necesitaCond)return[];

  // ── Verificar caché (la key incluye penalty para no colisionar) ─────────────
  const ck=_cacheKey(cv,ti,te,hr,elemTipo,umaxTarget)+'|p='+penalty;
  if(_corrCache.has(ck))return _corrCache.get(ck);

  const correcciones=[];
  const idxA=cv.findIndex(c=>clasificarCapa(c)==='aislante');
  const motivoStr=necesitaCond&&necesitaU?'condensación intersticial y U > Umax DS N°15'
    :necesitaCond?'condensación intersticial (Glaser NCh853:2021)'
    :'U = '+U0+' W/m²K > Umax DS N°15 ('+umaxTarget+' W/m²K)';

  // pasa() usa umaxPenalizado para la búsqueda interna (target estricto).
  function pasa(rN){return rN&&!rN.condInter&&(!umaxPenalizado||parseFloat(rN.U)<=umaxPenalizado);}

  // Helper: concatena el aviso de penalty al final de advertencias si aplica.
  const withPenaltyAviso = arr => avisoPenalty ? [...arr, '⚠ '+avisoPenalty] : arr;

  // ── C1 — Sistema EIFS/SATE ────────────────────────────────────────────────────
  await _YIELD();          // cede el hilo → UI puede pintar el spinner
  if(elemTipo==='muro'||elemTipo==='tabique'){
    for(const alt of AISLS){
      await _YIELD();      // yield entre alternativas de aislante
      const cvBase=cv.filter(c=>clasificarCapa(c)!=='rev_ext');
      const esp=await _findMinEsp(30,180,e=>{
        const cvN=validarCierre([...cvBase,{n:alt.n,lam:alt.lam,esp:e/1000,mu:alt.mu},{n:'Estuco cemento',lam:0.87,esp:0.015,mu:15}],elemTipo);
        return pasa(_calcGlaserSimple(cvN,ti,te,hr,elemTipo));
      });
      if(esp!==null){
        const ais={n:alt.n,lam:alt.lam,esp:esp/1000,mu:alt.mu};
        const cvNuevo=validarCierre([...cvBase,ais,{n:'Estuco cemento',lam:0.87,esp:0.015,mu:15}],elemTipo);
        const rN=_calcGlaserSimple(cvNuevo,ti,te,hr,elemTipo);
        const cierresAgg=cvNuevo.filter(c=>c._rol).map(c=>c.n);
        correcciones.push({
          id:'c1_eifs_'+alt.n.replace(/\s/g,'_'),
          titulo:'C1 — Sistema EIFS/SATE: '+esp+'mm '+alt.n+' + Estuco',
          etiqueta:'EIFS/SATE',sistema:'EIFS/SATE',color:'#166534',compatible_loscat:false,
          descripcion:'Para cumplir '+motivoStr+', se propone un complejo tipo EIFS/SATE: '+esp+'mm de '+alt.n+' (λ='+alt.lam+' W/mK) adherido a la estructura + Estuco cemento 15mm como terminación exterior. El aislante queda completamente embebido y protegido; nunca expuesto al exterior.',
          cambio:'+ '+esp+'mm '+alt.n+' (exterior) + Estuco cemento 15mm',
          capasCorregidas:cvNuevo,resultado:rN,
          impactoU:'U '+rN.U+' W/m²K ✓'+(umaxTarget?' ≤'+umaxTarget:''),
          advertencias:withPenaltyAviso(['El adhesivo y la malla de fibra de vidrio (ETICS) no afectan el cálculo U pero son obligatorios constructivamente (NCh 1938)',
            ...(cierresAgg.length?['Capas de cierre agregadas automáticamente: '+cierresAgg.join(', ')]:[])])});
        break;
      }
    }
  }

  // ── C2 — Fachada Ventilada ────────────────────────────────────────────────────
  await _YIELD();
  {
    for(const alt of AISLS){
      await _YIELD();
      const cvBase=cv.filter(c=>clasificarCapa(c)!=='rev_ext'&&clasificarCapa(c)!=='humedad');
      const tyvek={..._BHum},camara={esCamara:true},fib={n:'Fibrocemento',lam:0.23,esp:0.006,mu:50};
      const esp=await _findMinEsp(40,180,e=>{
        const cvN=validarCierre([...cvBase,{n:alt.n,lam:alt.lam,esp:e/1000,mu:alt.mu},tyvek,camara,fib],elemTipo);
        return pasa(_calcGlaserSimple(cvN,ti,te,hr,elemTipo));
      });
      if(esp!==null){
        const cvNuevo=validarCierre([...cvBase,{n:alt.n,lam:alt.lam,esp:esp/1000,mu:alt.mu},tyvek,camara,fib],elemTipo);
        const rN=_calcGlaserSimple(cvNuevo,ti,te,hr,elemTipo);
        correcciones.push({
          id:'c2_ventilada_'+alt.n.replace(/\s/g,'_'),
          titulo:'C2 — Fachada Ventilada: '+esp+'mm '+alt.n+' + Tyvek + cámara + Fibrocemento',
          etiqueta:'F. Ventilada',sistema:'Fachada Ventilada',color:'#0369a1',compatible_loscat:false,
          descripcion:'Para cumplir '+motivoStr+', se propone un complejo tipo Fachada Ventilada: '+esp+'mm de '+alt.n+' (λ='+alt.lam+' W/mK) + Barrera de humedad transpirable (Tyvek/fieltro, μ=150) posicionada entre el aislante y la cámara ventilada + Fibrocemento 6mm. La barrera de humedad queda correctamente entre el aislante y la cámara; jamás como capa final expuesta.',
          cambio:'+ '+esp+'mm '+alt.n+' + Tyvek (barrera humedad) + Cámara ventilada + Fibrocemento 6mm',
          capasCorregidas:cvNuevo,resultado:rN,
          impactoU:'U '+rN.U+' W/m²K ✓'+(umaxTarget?' ≤'+umaxTarget:''),
          advertencias:withPenaltyAviso(['La cámara ventilada requiere entrada de aire en la base y salida en coronamiento (ASHRAE 160 / NCh853:2021 §6.9)',
            'El fibrocemento debe fijarse a subestructura metálica o de madera — no se adhiere directamente al aislante'])});
        break;
      }
    }
  }

  // ── C3 — Trasdosado Interior ──────────────────────────────────────────────────
  await _YIELD();
  if(necesitaCond||necesitaU){
    for(const alt of AISLS){
      await _YIELD();
      const cvBase=cv.filter(c=>clasificarCapa(c)!=='rev_int'&&clasificarCapa(c)!=='vapor');
      const yc={...CAPAS_CIERRE_INT[0]},bv={..._BVap};
      const esp=await _findMinEsp(30,100,e=>{
        const cvN=validarCierre([yc,bv,{n:alt.n,lam:alt.lam,esp:e/1000,mu:alt.mu},...cvBase],elemTipo);
        return pasa(_calcGlaserSimple(cvN,ti,te,hr,elemTipo));
      });
      if(esp!==null){
        const cvNuevo=validarCierre([yc,bv,{n:alt.n,lam:alt.lam,esp:esp/1000,mu:alt.mu},...cvBase],elemTipo);
        const rN=_calcGlaserSimple(cvNuevo,ti,te,hr,elemTipo);
        correcciones.push({
          id:'c3_trasdosado_'+alt.n.replace(/\s/g,'_'),
          titulo:'C3 — Trasdosado Interior: Yeso cartón + Barrera vapor + '+esp+'mm '+alt.n,
          etiqueta:'Trasdosado',sistema:'Trasdosado Interior',color:'#7c3aed',compatible_loscat:false,
          descripcion:'Para cumplir '+motivoStr+' sin intervención exterior, se propone un complejo tipo Trasdosado Interior: Yeso cartón 13mm + Barrera de vapor (polietileno μ=9999) posicionada en cara caliente (interior, justo detrás del revestimiento) + '+esp+'mm de '+alt.n+' (λ='+alt.lam+' W/mK). La barrera de vapor bloquea la difusión antes de que el vapor alcance el punto de rocío en el aislante.',
          cambio:'+ Yeso cartón 13mm + Barrera vapor PE (0.2mm μ=9999) + '+esp+'mm '+alt.n+' (interior)',
          capasCorregidas:cvNuevo,resultado:rN,
          impactoU:'U '+rN.U+' W/m²K ✓'+(umaxTarget?' ≤'+umaxTarget:''),
          advertencias:withPenaltyAviso(['Reduce el ancho libre del recinto en '+(13+esp)+'mm aprox.',
            'Requiere resolución en aristas, zócalos y marcos para evitar puentes térmicos perimetrales',
            'El sellado de la barrera de vapor en penetraciones (instalaciones) es crítico (OGUC Art. 4.1.10)'])});
        break;
      }
    }
  }

  // ── C4 — Aumentar espesor del aislante existente ──────────────────────────────
  await _YIELD();
  if(idxA>=0){
    const extra=await _findMinEsp(10,500,e=>{
      const cvN=cv.map((c,i)=>i===idxA?{...c,esp:c.esp+e/1000}:c);
      const rN=_calcGlaserSimple(validarCierre(cvN,elemTipo),ti,te,hr,elemTipo);
      return rN&&!rN.condInter&&(!umaxPenalizado||parseFloat(rN.U||99)<=umaxPenalizado);
    });
    if(extra!==null){
      const cvN=cv.map((c,i)=>i===idxA?{...c,esp:c.esp+extra/1000}:c);
      const cvCerrado=validarCierre(cvN,elemTipo);
      const rN=_calcGlaserSimple(cvCerrado,ti,te,hr,elemTipo);
      const espOrig=Math.round(cv[idxA].esp*1000);
      const nomAis=cv[idxA].n||cv[idxA].mat||'aislante';
      const cierresAgg=cvCerrado.filter(c=>c._rol);
      const notaCierre=cierresAgg.length
        ?' Se agregan automáticamente capas de cierre faltantes: '+cierresAgg.map(c=>'['+c.n+' — '+({cierre_ext:'exterior',cierre_int:'interior'}[c._rol]||'')+']').join(', ')+'.'
        :'';
      correcciones.push({
        id:'c4_espesor',
        titulo:'C4 — Aumentar espesor '+nomAis+': '+espOrig+'mm → '+(espOrig+extra)+'mm',
        etiqueta:'+Espesor',sistema:'Mod. LOSCAT',color:'#b45309',compatible_loscat:true,
        descripcion:'Aumentar \''+nomAis+'\' de '+espOrig+'mm a '+(espOrig+extra)+'mm resuelve '+motivoStr+'. Homologable con LOSCAT (mismo material, mayor espesor).'+notaCierre,
        cambio:'\''+nomAis+'\': '+espOrig+'mm → '+(espOrig+extra)+'mm (+'+extra+'mm)',
        capasCorregidas:cvCerrado,resultado:rN,
        impactoU:'U '+rN.U+' W/m²K ✓'+(umaxTarget?' ≤'+umaxTarget:''),
        advertencias:withPenaltyAviso(cierresAgg.map(c=>'⚠ Se añadió automáticamente '+c.n+' ('+({cierre_ext:'terminación exterior',cierre_int:'terminación interior'}[c._rol]||'')+') — esta capa no puede quedar expuesta'))});
    }
  }

  // ── C5 — Barrera de vapor en cara caliente ────────────────────────────────────
  await _YIELD();
  if(necesitaCond&&!cv.some(c=>clasificarCapa(c)==='vapor')){
    const cvCerrado=validarCierre(insertarTrasRevInt(cv,{..._BVap}),elemTipo);
    const rN=_calcGlaserSimple(cvCerrado,ti,te,hr,elemTipo);
    if(rN&&!rN.condInter&&(!umaxPenalizado||parseFloat(rN.U||99)<=umaxPenalizado)){
      correcciones.push({
        id:'c5_barrera_vapor',
        titulo:'C5 — Barrera de vapor en cara caliente (posicionada correctamente)',
        etiqueta:'Barrera vapor',sistema:'Barrera',color:'#6d28d9',compatible_loscat:false,
        descripcion:'Se añade lámina de polietileno (μ=9999, 0.2mm) inmediatamente detrás del revestimiento interior (cara caliente), bloqueando la difusión de vapor antes de que alcance la zona de condensación. Posición correcta según NCh853:2021: siempre en la cara caliente (interior), nunca como capa final exterior ni como primera capa desnuda.',
        cambio:'Agrega Barrera de vapor PE (0.2mm, μ=9999) tras revestimiento interior',
        capasCorregidas:cvCerrado,resultado:rN,
        impactoU:'U '+rN.U+' W/m²K'+(umaxTarget&&parseFloat(rN.U)<=umaxTarget?' ✓':''),
        advertencias:withPenaltyAviso(['El sellado perimetral y en penetraciones de instalaciones es obligatorio para garantizar la continuidad de la barrera (OGUC Art. 4.1.10)',
          'Verificar que no quede ninguna capa de aislante al exterior de la barrera de vapor sin protección'])});
    }
  }

  // ── C6 — Sustituir aislante por material de mejor λ ──────────────────────────
  await _YIELD();
  if(idxA>=0&&(necesitaCond||necesitaU)){
    const orig=cv[idxA];
    const mejores=AISLS.filter(a=>a.lam<(parseFloat(orig.lam)||0.05)&&a.n!==(orig.n||orig.mat));
    for(const alt of mejores){
      await _YIELD();
      const cvA=cv.map((c,i)=>i===idxA?{...c,n:alt.n,lam:alt.lam,mu:alt.mu}:c);
      const cvCerrado=validarCierre(cvA,elemTipo);
      const rA=_calcGlaserSimple(cvCerrado,ti,te,hr,elemTipo);
      if(rA&&!rA.condInter&&(!umaxPenalizado||parseFloat(rA.U)<=umaxPenalizado)){
        correcciones.push({
          id:'c6_sustituir_'+alt.n.replace(/\s/g,'_'),
          titulo:'C6 — Sustituir aislante por '+alt.n+' (λ='+alt.lam+')',
          etiqueta:'Sustituir',sistema:'Sustitución',color:'#0f766e',compatible_loscat:false,
          descripcion:'Reemplazar \''+(orig.n||orig.mat)+'\' (λ='+orig.lam+' W/mK) por \''+alt.n+'\' (λ='+alt.lam+' W/mK) con igual espesor '+Math.round(orig.esp*1000)+'mm. Mayor resistencia térmica por unidad de espesor.',
          cambio:'\''+(orig.n||orig.mat)+'\' → \''+alt.n+'\' (λ: '+orig.lam+' → '+alt.lam+' W/mK)',
          capasCorregidas:cvCerrado,resultado:rA,
          impactoU:'U '+rA.U+' W/m²K ✓',
          advertencias:withPenaltyAviso(['Verificar compatibilidad de adhesión entre \''+alt.n+'\' y la estructura existente'])});
        break;
      }
    }
  }

  // ── Escribir caché (LRU simple: descartar el más antiguo si lleno) ───────────
  if(_corrCache.size>=_MAX_CACHE)_corrCache.delete(_corrCache.keys().next().value);
  _corrCache.set(ck,correcciones);

  return correcciones;
}
