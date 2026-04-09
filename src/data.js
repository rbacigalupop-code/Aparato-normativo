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
export const ESTRUCTURAS=["Hormigon armado","Albanileria confinada","Albanileria armada","Estructura de acero","Estructura de madera","Mixta HA + albanileria"];
export const RF_DEF={Vivienda:{estructura:"F30",muros_sep:"F60",escaleras:"F60",cubierta:"F15"},Educacion:{estructura:"F60",muros_sep:"F60",escaleras:"F90",cubierta:"F30"},Salud:{estructura:"F90",muros_sep:"F90",escaleras:"F120",cubierta:"F30"},Oficina:{estructura:"F60",muros_sep:"F60",escaleras:"F90",cubierta:"F30"},Comercio:{estructura:"F60",muros_sep:"F60",escaleras:"F90",cubierta:"F30"},Industrial:{estructura:"F90",muros_sep:"F90",escaleras:"F120",cubierta:"F60"}};
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
export const OBS_EST={"Hormigon armado":"LOFC Ed.17 A.1.3: H.A. 100mm=F90, 150mm=F150, 200mm=F180. Verificar recubrimiento segun NCh430.","Albanileria confinada":"LOFC Ed.17 A.2.2: Ladrillo Santiago 7 (140mm)=F240, Santiago 9 (140mm)=F180. Verificar pilares y cadenas de HA.","Albanileria armada":"LOFC Ed.17: similar a confinada. Albañileria ceramica 140mm cumple F180 min. Verificar armadura interior.","Estructura de acero":"El acero pierde resistencia a ~500°C. LOFC Ed.17 B.1.3: requiere proteccion ignifuga (hormigon fino 25mm=F30, 35mm=F60, 50mm=F120).","Estructura de madera":"LOFC Ed.17 A.1.5: madera maciza 45mm=F30, 90mm=F60, 140mm=F90. Carbonizacion ~0.7mm/min. Calcular seccion residual segun NCh1198.","Mixta HA + albanileria":"Verificar elemento a elemento. LOFC Ed.17: HA 150mm=F150, albañileria ceramica 140mm=F180+. Determinar elemento critico."};
// RF intrínseca por sistema estructural — configuración estándar (LOFC Ed.17 2025)
// HA 150mm, albañilería cerámica 140mm, madera maciza 90mm
export const RF_EST={"Hormigon armado":"F150","Albanileria confinada":"F180","Albanileria armada":"F180","Estructura de acero":"F0","Estructura de madera":"F60","Mixta HA + albanileria":"F150"};

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

// ─── CAPAS DETALLADAS POR SOLUCION (NCh853 / LOSCAT Ed.13) ───────────────────
export const SC_CAPAS={
  "1.2.M.A25.1":[{mat:"Hormigon armado",lam:2.50,esp:150,mu:130},{mat:"PU proyectado",lam:0.027,esp:60,mu:50},{mat:"Pasta elastomerica",lam:0.70,esp:2,mu:25}],
  "1.2.M.B16.1":[{mat:"Ladrillo ceramico perforado",lam:0.48,esp:140,mu:8},{mat:"PU proyectado",lam:0.027,esp:60,mu:50},{mat:"Pasta elastomerica",lam:0.70,esp:2,mu:25}],
  "1.2.M.A23.1":[{mat:"Hormigon armado",lam:2.50,esp:100,mu:130},{mat:"EPS 20kg/m3",lam:0.038,esp:60,mu:60},{mat:"Mortero cemento",lam:0.70,esp:6,mu:25}],
  "1.2.M.A22.2":[{mat:"Hormigon armado",lam:2.50,esp:150,mu:130},{mat:"EPS 15kg/m3",lam:0.041,esp:80,mu:40},{mat:"Corcho aglomerado",lam:0.045,esp:5,mu:20}],
  "1.2.M.A21.1":[{mat:"Ladrillo ceramico macizo",lam:0.70,esp:140,mu:10},{mat:"EPS 20kg/m3",lam:0.040,esp:60,mu:60},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  "1.2.G.C1.3":[{mat:"Yeso carton",lam:0.26,esp:10,mu:8},{mat:"Lana vidrio 10kg",lam:0.046,esp:60,mu:1},{mat:"OSB/MDF",lam:0.23,esp:9,mu:200},{mat:"Lana vidrio 10kg",lam:0.046,esp:40,mu:1},{mat:"Fibrocemento",lam:0.23,esp:6,mu:50}],
  "1.2.G.C1.4":[{mat:"Yeso carton",lam:0.26,esp:10,mu:8},{mat:"Lana vidrio 10kg",lam:0.042,esp:50,mu:1},{mat:"OSB/MDF",lam:0.23,esp:9,mu:200},{mat:"EPS 20kg/m3",lam:0.038,esp:10,mu:60},{mat:"Mortero cemento",lam:1.40,esp:15,mu:25}],
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
  // ── MUROS — Estructura de acero ──────────────────────────────────────────
  {cod:"1.2.G.C1.4",elem:"muro",sistemas:["Estructura de acero"],desc:"Steel framing 89mm + lana vidrio 90mm + EPS exterior 30mm + revoque",capas:"Yeso carton 10 | Lana vidrio 90 | OSB 11 | EPS 20kg 30 | Revoque 15",u:0.29,rf:"F60",ac_rw:45,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOSCAT 1.2.G.C1.4. EPS exterior obligatorio para compensar puente térmico metálico (~30%). U=0.29."},
  {cod:"1.2.G.A1.1",elem:"muro",sistemas:["Estructura de acero"],desc:"Steel framing 89mm + lana mineral 90mm + lana mineral exterior 40mm + yeso carton",capas:"Yeso carton 13 | Lana mineral 90 | Correa acero | Lana mineral 40 | Fibrocemento 8",u:0.25,rf:"F60",ac_rw:45,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Doble capa aislante para minimizar puente térmico de perfiles. Lana ext. en cámara secundaria. U=0.25."},
  {cod:"1.2.G.A1.2",elem:"muro",sistemas:["Estructura de acero"],desc:"Steel framing 65mm + lana mineral 65mm + XPS exterior 60mm + revoque",capas:"Yeso carton 13 | Lana mineral 65 | OSB 9 | XPS 60 | Revoque 10",u:0.22,rf:"F60",ac_rw:44,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"XPS continuo exterior corta puente térmico de perfiles metálicos. U=0.22. Verificar fijación XPS (tornillería en frío)."},
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

// BUG-03 FIX: calcGlaser recibe el tipo de elemento y usa RSE correcto
export const calcGlaser=(cv,ti,te,hr,elemTipo="muro")=>{
  if(!cv||!cv.length||isNaN(ti)||isNaN(te)||isNaN(hr))return null;
  const rsiKey=elemTipo==="techumbre"?"techo":elemTipo==="piso"?"piso":"muro";
  const rsi=RSI_MAP[rsiKey]||0.13;
  const rse=RSE_MAP[rsiKey]||0.04;

  // BUG-02 FIX: incluir cámaras de aire en el cálculo Glaser
  const Rtot=rsi+rse+cv.reduce((s,c)=>{
    if(c.esCamara||c.camara) return s+RCAMARA;
    return s+(c.esp/c.lam);
  },0);

  const temps=[ti];
  let Ra=rsi;
  for(const c of cv){
    if(c.esCamara||c.camara){Ra+=RCAMARA;}
    else{Ra+=c.esp/c.lam;}
    temps.push(ti-(ti-te)*Ra/Rtot);
  }

  const Pvsi=satP(ti)*hr/100;
  const Pvse=satP(te)*0.80;

  // BUG-02 FIX: cámaras de aire tienen μ≈1 (resistencia al vapor despreciable)
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
  // Acumular Rs por capa para posicionamiento gráfico
  const Rs=[rsi];
  for(const c of cv){Rs.push(c.esCamara||c.camara?RCAMARA:c.esp/c.lam);}
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
  return{temps,pv,ifaces,condInter,condSup,caso,Tdew:Tdew.toFixed(2),U:U.toFixed(4),Rtot,Rs,Pvsi:Pvsi.toFixed(0),Pvse:Pvse.toFixed(0)};
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

export const generarCorrecciones=(cv,ti,te,hr,elemTipo="muro",umaxTarget=null)=>{
  if(!cv||!cv.length)return[];
  const correcciones=[];
  const r0=calcGlaser(cv,ti,te,hr,elemTipo);
  const U0=r0?parseFloat(r0.U):null;
  const idxA=cv.findIndex(c=>!c.esCamara&&!c.camara&&(c.lam||1)<=0.050);
  const necesitaU=umaxTarget&&U0&&U0>umaxTarget;
  const necesitaCond=r0?.condInter;

  // ── E1: Mover aislante a cara exterior (condensación) ────────────────────
  if(necesitaCond&&idxA>=0&&idxA<cv.length-1){
    const cv1=[...cv.filter((_,i)=>i!==idxA),cv[idxA]];
    const r1=calcGlaser(cv1,ti,te,hr,elemTipo);
    if(r1&&!r1.condInter){
      correcciones.push({id:"mover",titulo:"E1 — Reubicar aislante en cara exterior",etiqueta:"Reubicar",color:"#0369a1",compatible_loscat:true,
        descripcion:"Mover '"+cv[idxA].n+"' a la última posición (cara exterior) elimina la condensación intersticial manteniendo el mismo U.",
        cambio:"'"+cv[idxA].n+"' → posición exterior",capasCorregidas:cv1,resultado:r1,
        impactoU:"U "+r1.U+" W/m²K"+(umaxTarget&&parseFloat(r1.U)<=umaxTarget?" ✓ cumple Umax":"")});
    }
  }

  // ── E2: Barrera de vapor interior (condensación) ─────────────────────────
  if(necesitaCond){
    const bv={n:"Lamina impermeable (barrera vapor)",lam:0.23,esp:0.0002,mu:9999};
    const cv2=[bv,...cv];
    const r2=calcGlaser(cv2,ti,te,hr,elemTipo);
    if(r2&&!r2.condInter){
      correcciones.push({id:"barrera",titulo:"E2 — Barrera de vapor en cara interior",etiqueta:"Barrera vapor",color:"#7c3aed",compatible_loscat:false,
        descripcion:"Lámina impermeabilizante (μ=9999) en cara interior impide el flujo de vapor hacia la zona de condensación.",
        cambio:"Agrega lámina impermeable 0.2mm (μ=9999) como primera capa",capasCorregidas:cv2,resultado:r2,
        impactoU:"U "+r2.U+" W/m²K"});
    }
  }

  // ── E3: Aumentar espesor aislante (condensación + U) ────────────────────
  if((necesitaCond||necesitaU)&&idxA>=0){
    const espMinCond=necesitaCond?300:0;
    for(let extra=5;extra<=300;extra+=5){
      const cvN=cv.map((c,i)=>i===idxA?{...c,esp:c.esp+extra/1000}:c);
      const rN=calcGlaser(cvN,ti,te,hr,elemTipo);
      const condOk=!rN?.condInter;
      const uOk=!umaxTarget||parseFloat(rN?.U||99)<=umaxTarget;
      if(rN&&condOk&&uOk){
        const espOrig=Math.round(cv[idxA].esp*1000);
        correcciones.push({id:"espesor",titulo:"E3 — Aumentar espesor del aislante",etiqueta:"+Espesor",color:"#166534",compatible_loscat:true,
          descripcion:"Aumentar '"+cv[idxA].n+"' "+espOrig+"mm → "+(espOrig+extra)+"mm resuelve "+( necesitaCond&&necesitaU?"condensación y U":"necesitaCond"?"condensación":"U > Umax")+". Compatible con LOSCAT (mismo material, mayor espesor).",
          cambio:"'"+cv[idxA].n+"': "+espOrig+"mm → "+(espOrig+extra)+"mm (+"+extra+"mm)",
          capasCorregidas:cvN,resultado:rN,impactoU:"U "+rN.U+" W/m²K"+(uOk&&umaxTarget?" ✓ ≤"+umaxTarget:"")});
        break;
      }
    }
  }

  // ── E4: Sustituir aislante por material de mejor λ (U + condensación) ───
  if((necesitaCond||necesitaU)&&idxA>=0){
    const orig=cv[idxA];
    const mejores=AISLS.filter(a=>a.lam<(orig.lam||0.05)&&a.n!==orig.n);
    for(const alt of mejores){
      const cvA=cv.map((c,i)=>i===idxA?{...c,n:alt.n,lam:alt.lam,mu:alt.mu}:c);
      const rA=calcGlaser(cvA,ti,te,hr,elemTipo);
      if(rA&&!rA.condInter&&(!umaxTarget||parseFloat(rA.U)<=umaxTarget)){
        correcciones.push({id:"sustituir_"+alt.n,titulo:"E4 — Sustituir aislante por "+alt.n,etiqueta:"Sustituir",color:"#b45309",compatible_loscat:false,
          descripcion:"Reemplazar '"+orig.n+"' (λ="+orig.lam+") por '"+alt.n+"' (λ="+alt.lam+") con mismo espesor "+Math.round(orig.esp*1000)+"mm mejora U y elimina condensación.",
          cambio:"'"+orig.n+"' → '"+alt.n+"' (λ: "+orig.lam+" → "+alt.lam+" W/mK)",
          capasCorregidas:cvA,resultado:rA,impactoU:"U "+rA.U+" W/m²K ✓"});
        break;
      }
    }
  }

  // ── E5: Agregar capa de aislante exterior (cuando no hay ninguno) ────────
  if((necesitaCond||necesitaU)&&idxA<0){
    for(const alt of AISLS){
      for(let esp=30;esp<=150;esp+=10){
        const nuevoAis={n:alt.n,lam:alt.lam,esp:esp/1000,mu:alt.mu};
        const cvE=[...cv,nuevoAis];
        const rE=calcGlaser(cvE,ti,te,hr,elemTipo);
        if(rE&&!rE.condInter&&(!umaxTarget||parseFloat(rE.U)<=umaxTarget)){
          correcciones.push({id:"agregar_"+alt.n,titulo:"E5 — Agregar "+alt.n+" "+esp+"mm en cara exterior",etiqueta:"Agregar aislante",color:"#be185d",compatible_loscat:false,
            descripcion:"El elemento no tiene aislante. Agregar "+esp+"mm de '"+alt.n+"' (λ="+alt.lam+") en cara exterior logra U="+rE.U+" W/m²K"+(umaxTarget?" cumpliendo Umax="+umaxTarget:"")+".",
            cambio:"Agrega '"+alt.n+"' "+esp+"mm (exterior)",
            capasCorregidas:cvE,resultado:rE,impactoU:"U "+rE.U+" W/m²K ✓"});
          break;
        }
      }
      if(correcciones.some(c=>c.id.startsWith("agregar_")))break;
    }
  }

  // ── E6: Espesor mínimo para cumplir solo Umax (sin condensación activa) ──
  if(necesitaU&&!necesitaCond&&idxA>=0&&!correcciones.some(c=>c.id==="espesor")){
    const orig=cv[idxA];
    const dR=1/umaxTarget-1/U0;
    const dEsp=Math.ceil(dR*(orig.lam||0.04)*1000/5)*5;
    if(dEsp>0&&dEsp<=300){
      const cvU=cv.map((c,i)=>i===idxA?{...c,esp:c.esp+dEsp/1000}:c);
      const rU=calcGlaser(cvU,ti,te,hr,elemTipo);
      if(rU&&!rU.condInter){
        const espOrig=Math.round(orig.esp*1000);
        correcciones.push({id:"espesor_u",titulo:"E6 — Espesor mínimo para cumplir DS N°15 (U ≤ "+umaxTarget+")",etiqueta:"Mínimo U",color:"#0f766e",compatible_loscat:true,
          descripcion:"Para U ≤ "+umaxTarget+" W/m²K se necesita ΔR="+dR.toFixed(3)+" m²K/W. Con '"+orig.n+"' (λ="+orig.lam+"): +"+dEsp+"mm exactos.",
          cambio:"'"+orig.n+"': "+espOrig+"mm → "+(espOrig+dEsp)+"mm (+"+dEsp+"mm mínimo)",
          capasCorregidas:cvU,resultado:rU,impactoU:"U "+rU.U+" W/m²K ✓ ≤"+umaxTarget});
      }
    }
  }

  return correcciones;
};
