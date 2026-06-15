// Biblioteca oficial de materiales DITEC/MINVU (ISO 10456 / NCh853:2021),
// importada del Excel oficial. Se anexa al catálogo sin alterar la lógica.
import { MATERIALES_OFICIAL } from './data/materiales_oficial.js';

// ─── DATOS BASE ───────────────────────────────────────────────────────────────
export const ZONAS={A:{n:"Zona A",ej:"Arica, Antofagasta",techo:0.84,muro:2.10,piso:3.60,Ti:20,Te:10,HR:60,pda:false},B:{n:"Zona B",ej:"Copiapo, Vallenar",techo:0.47,muro:0.80,piso:0.70,Ti:20,Te:5,HR:65,pda:false},C:{n:"Zona C",ej:"Coquimbo, Valparaiso",techo:0.47,muro:0.80,piso:0.87,Ti:20,Te:4,HR:70,pda:false},D:{n:"Zona D",ej:"Santiago, Talca",techo:0.38,muro:0.80,piso:0.60,Ti:20,Te:2,HR:75,pda:true},E:{n:"Zona E",ej:"Concepcion, Tolten",techo:0.33,muro:0.60,piso:0.60,Ti:20,Te:1,HR:78,pda:true},F:{n:"Zona F",ej:"Chillan, Temuco",techo:0.28,muro:0.45,piso:0.50,Ti:20,Te:-1,HR:80,pda:true},G:{n:"Zona G",ej:"Valdivia, Puerto Montt",techo:0.28,muro:0.40,piso:0.39,Ti:20,Te:-2,HR:80,pda:false},H:{n:"Zona H",ej:"Lonquimay, Pucon",techo:0.25,muro:0.30,piso:0.32,Ti:20,Te:-4,HR:75,pda:false},I:{n:"Zona I",ej:"Coyhaique, Punta Arenas",techo:0.25,muro:0.35,piso:0.35,Ti:20,Te:-6,HR:75,pda:false}};

// COMUNAS_ZONA se deriva de la tabla oficial DITEC (DS N°15) — ver src/data/zonas_oficial.js
export { COMUNAS_ZONA } from './data/zonas_oficial.js';

export const PERM_V={A:null,B:1,C:1,D:2,E:2,F:2,G:3,H:3,I:3};
// Puertas opacas — DS N°15 Tabla 1: U-max 1.70 W/m²K uniforme para zonas B-I.
// Zona A sin exigencia (---). Verificado contra Diario Oficial 27-05-2024.
export const PUERTA_U={A:null,B:1.7,C:1.7,D:1.7,E:1.7,F:1.7,G:1.7,H:1.7,I:1.7};
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
export const ESTRUCTURAS=["Hormigon armado","Albanileria confinada","Albanileria armada","Hormigon celular autoclavado","Estructura de acero","Metalframe (acero liviano)","Estructura de madera","Mixta HA + albanileria"];
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
// ─── OGUC DATA MOVED TO SUPABASE ──────────────────────────────────────────────
// OGUC_RF_LETRAS, OGUC_TABLA1, OGUC_ELEM_COL are now loaded from Supabase via ogucData.js
// This reduces bundle size by ~50kb while keeping data dynamic and updatable

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

// ─── OGUC FUNCTIONS MOVED TO fire.js ─────────────────────────────────────────
// getLetraOGUC, getRFDeLetra, getRFOGUC are now in src/lib/engines/fire.js
// App.jsx uses memoized wrappers that pass Supabase-loaded data: getLetraOGUC_loaded, etc.
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
// RF requerida por elemento constructivo (OGUC Tít. 4 Cap. 3 — aproximación sin letra)
// id: 'muro' | 'techo'/'techumbre' | 'piso' | 'tabique' | 'puerta' | 'ventana'
// FUENTE ÚNICA para Soluciones, Térmica, Resultados e Informe. La pestaña Fuego
// usa la Tabla 1 OGUC por letra cuando hay superficie+destino (más precisa) y
// evalúa muros_sep (col 3) como fila propia — no confundir con el muro perimetral.
//   muro:    perimetral portante → col (2) soporte de cargas ≈ RF_PISOS
//   piso:    entrepiso soportante → col (8) ≈ RF_PISOS
//   techo:   cubierta → col (7) = RF_DEF.cubierta
//   tabique: separación entre unidades → col (3)/(5) = RF_DEF.muros_sep
//   puerta:  puerta exterior → PUERTA_RF por zona (módulo puertas)
export const RF_ELEM_REQ=(id,uso,pisos,zona)=>{
  const rfDef=RF_DEF[uso]||{};
  switch(id){
    case 'muro':      return RF_PISOS(uso,pisos)||'';
    case 'techo':
    case 'techumbre': return rfDef.cubierta||'';
    case 'piso':      return RF_PISOS(uso,pisos)||'';
    case 'tabique':   return rfDef.muros_sep||'';
    case 'puerta':    return (zona&&PUERTA_RF[zona])||'';
    default: return '';
  }
};
export const OBS_EST={"Hormigon armado":"LOFC Ed.17 A.1.3: H.A. 100mm=F90, 150mm=F150, 200mm=F180. Verificar recubrimiento segun NCh430.","Albanileria confinada":"LOFC Ed.17 A.2.2: Ladrillo Santiago 7 (140mm)=F240, Santiago 9 (140mm)=F180. Verificar pilares y cadenas de HA.","Albanileria armada":"LOFC Ed.17: similar a confinada. Albañileria ceramica 140mm cumple F180 min. Verificar armadura interior.","Hormigon celular autoclavado":"Material incombustible clase A1 (EN 13501-1). RF segun espesor: 100mm=F60, 150mm=F120, 200mm=F180, 250mm=F240. Lambda 0.11-0.16 W/mK segun densidad (400-600 kg/m3). NCh853. Bloques tipo Hebel/Ytong.","Estructura de acero":"RF0 intrínseca — requiere protección ignífuga para todo nivel RF. LOFC Ed.17 Annex B: hormigón proy. 25mm=F30 / 35mm=F60 / 50mm=F120; yeso proy. y lana de roca según factor Hp/A. Usa el calculador de acero en la pestaña Fuego.","Metalframe (acero liviano)":"RF0 intrínseca — perfiles de acero galvanizado pierden resistencia a ~500°C igual que acero estructural. DS N°76 MINVU / NCh427/1. Requiere protección ignífuga equivalente a Estructura de acero. Revestir con planchas yeso-cartón tipo F, lana mineral o mortero ignífugo segun LOFC Ed.17 Annex B.","Estructura de madera":"LOFC Ed.17 A.1.5: madera maciza 45mm=F30, 90mm=F60, 140mm=F90. Carbonizacion ~0.7mm/min. Calcular seccion residual segun NCh1198.","Mixta HA + albanileria":"Verificar elemento a elemento. LOFC Ed.17: HA 150mm=F150, albañileria ceramica 140mm=F180+. Determinar elemento critico."};
// RF intrínseca por sistema estructural — configuración estándar (LOFC Ed.17 2025)
// HA 150mm, albañilería cerámica 140mm, madera maciza 90mm
export const RF_EST={"Hormigon armado":"F150","Albanileria confinada":"F180","Albanileria armada":"F180","Hormigon celular autoclavado":"F120","Estructura de acero":"F0","Metalframe (acero liviano)":"F0","Estructura de madera":"F60","Mixta HA + albanileria":"F150"};

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
// Convenciones:
//   · `usos` (opcional): array con los tipos de elemento donde aplica el material.
//                        Valores válidos: 'muro' | 'techo' | 'piso'.
//                        Si la propiedad NO existe → material universal (todos los usos).
//                        Ej.: cubiertas de techumbre llevan usos:['techo']; revestimientos
//                        exteriores de muro llevan usos:['muro'].
export const MATS=[
  // ── Hormigón y mortero ──────────────────────────────────────────────────────
  {g:"Hormigon y mortero",items:[
    {n:"Hormigon armado",         lam:2.50, mu:130},
    {n:"Hormigon simple",         lam:1.63, mu:130},
    {n:"Mortero cemento",         lam:1.40, mu:25},
    {n:"Mortero yeso",            lam:0.40, mu:10},
    {n:"Mortero cola ceramico",   lam:1.30, mu:25, usos:['muro','piso']},
    {n:"Radier HA alisado",       lam:2.00, mu:130, usos:['piso']},
  ]},
  // ── Albanilería ─────────────────────────────────────────────────────────────
  {g:"Albanileria",items:[
    {n:"Ladrillo ceramico macizo",    lam:0.70, mu:10},
    {n:"Ladrillo ceramico perforado", lam:0.48, mu:8},
    {n:"Bloque hormigon",             lam:1.00, mu:15},
    {n:"Bloque ceramico poroso",      lam:0.27, mu:5},
  ]},
  // ── Madera y derivados ───────────────────────────────────────────────────────
  {g:"Madera y derivados",items:[
    {n:"Madera pino/coigue",      lam:0.14, mu:50},
    {n:"OSB/MDF",                 lam:0.23, mu:200},
    {n:"Yeso carton",             lam:0.26, mu:8},
    {n:"Fibrocemento",            lam:0.23, mu:50},
    {n:"Contrachapado",           lam:0.17, mu:300},
    {n:"CLT laminada",            lam:0.13, mu:50},
    {n:"Tablon machihembrado",    lam:0.14, mu:50},
  ]},
  // ── Aislantes térmicos ───────────────────────────────────────────────────────
  {g:"Aislantes termicos",items:[
    {n:"EPS 10kg/m3",      lam:0.047, mu:40},
    {n:"EPS 15kg/m3",      lam:0.043, mu:40},
    {n:"EPS 20kg/m3",      lam:0.040, mu:60},
    {n:"XPS extruido",     lam:0.036, mu:100},
    {n:"Lana vidrio 10kg", lam:0.040, mu:1},
    {n:"Lana vidrio 13kg", lam:0.036, mu:1},
    {n:"Lana mineral 30kg",lam:0.035, mu:1},
    {n:"PU proyectado",    lam:0.026, mu:50},
    {n:"Fibra poliester",  lam:0.038, mu:2},
    {n:"Corcho aglomerado",lam:0.045, mu:20},
    {n:"Lana oveja",       lam:0.039, mu:1},
    {n:"Fibra madera",     lam:0.040, mu:5},
    {n:"PIR / PUR plancha",lam:0.024, mu:100},
    {n:"Celulosa soplada", lam:0.040, mu:2},
  ]},
  // ── Revestimientos exteriores muro ───────────────────────────────────────────
  // λ/μ según EN ISO 10456:2007, NCh853:2021 y fichas técnicas de fabricantes
  {g:"Revestimientos exteriores muro",items:[
    {n:"Estuco cemento",                  lam:0.87,  mu:15,     usos:['muro']},
    {n:"Ceramica/porcelanato",            lam:1.30,  mu:200,    usos:['muro','piso']},
    {n:"Pintura / estuco fino",           lam:0.70,  mu:25,     usos:['muro']},
    {n:"Ladrillo vista",                  lam:0.70,  mu:10,     usos:['muro']},
    {n:"Plancha cementicia (Hardiboard)", lam:0.23,  mu:50,     usos:['muro']},
    {n:"Machihembrado madera ext.",       lam:0.14,  mu:50,     usos:['muro']},
    {n:"Tablilla cedro / alerce",         lam:0.12,  mu:50,     usos:['muro']},
    {n:"Zinc titanio clic",               lam:110,   mu:100000, usos:['muro']},
    {n:"Chapa aluminio lacado",           lam:160,   mu:100000, usos:['muro']},
    {n:"Piedra natural (granito)",        lam:2.80,  mu:10000,  usos:['muro']},
    {n:"EIFS (Sistema ETICS)",            lam:0.87,  mu:25,     usos:['muro']},
    {n:"Mortero monocapa",                lam:0.87,  mu:20,     usos:['muro']},
    {n:"Revestimiento PVC vinilico",      lam:0.16,  mu:50000,  usos:['muro']},
    {n:"Vidrio monolitico",               lam:1.00,  mu:9999},
    {n:"Lamina impermeable",              lam:0.23,  mu:9999},
  ]},
  // ── Terminaciones de piso ────────────────────────────────────────────────────
  // EN ISO 10456:2007 §B.4 + fabricantes. usos:['piso'] para que solo aparezcan en pisos.
  {g:"Terminaciones de piso",items:[
    {n:"Parquet flotante (laminado)",  lam:0.16, mu:150,   usos:['piso']},
    {n:"Parquet madera maciza",        lam:0.14, mu:50,    usos:['piso']},
    {n:"Piso vinilico (LVT)",          lam:0.17, mu:10000, usos:['piso']},
    {n:"Alfombra",                     lam:0.06, mu:3,     usos:['piso']},
    {n:"Linóleo (4mm)",                lam:0.17, mu:1000,  usos:['piso']},
    {n:"Mármol / Granito piso",        lam:2.80, mu:10000, usos:['piso','muro']},
    {n:"Porcelanato piso (9mm)",       lam:1.30, mu:200,   usos:['piso']},
    {n:"Gravilla balasto (cubierta)",  lam:2.00, mu:1,     usos:['piso','techo']},
  ]},
  // ── Terminaciones interiores muro y techo ────────────────────────────────────
  {g:"Terminaciones interiores",items:[
    {n:"Yeso proyectado / enlucido",   lam:0.40, mu:10,  usos:['muro','techo']},
    {n:"Revoco cal interior",          lam:0.80, mu:6,   usos:['muro','techo']},
    {n:"Pintura latex interior",       lam:0.70, mu:25,  usos:['muro','techo']},
    {n:"Machihembrado interior",       lam:0.14, mu:50,  usos:['muro','techo']},
    {n:"Baldosa ceramica interior",    lam:1.30, mu:200, usos:['muro','piso']},
    {n:"Tablero DM pintado",           lam:0.21, mu:150, usos:['muro']},
  ]},
];
// ALL_MATS se exporta después de CUBIERTAS_TECHUMBRE (línea ~352) para que
// las cubiertas también se encuentren al buscar materiales por nombre.

// ─── CUBIERTAS DE TECHUMBRE ───────────────────────────────────────────────────
// Lista cerrada y exclusiva para el slot «Cubierta / Terminación» de techumbres.
// Valores técnicos de referencia:
//   · PV-4 / PV-5 Zincalum: plancha ondulada de acero recubierto Zn+Al. Espesor
//     efectivo 0.5 mm, λ del acero ≈ 50 W/mK (contribución térmica despreciable),
//     μ=100 000 (totalmente impermeable al vapor).  NCh218 / NCh184.
//   · Teja asfáltica (incluye fieltro base): producto bituminoso, λ≈0.17 W/mK,
//     espesor conjunto 3 mm, μ=3 000.
//   · Fibrocemento Gran Onda (Perfil 7): λ=0.24 W/mK, espesor 5 mm, μ=50.
//   · Panel Sándwich (núcleo poliuretano 40 mm): λ=0.022 W/mK, μ=100 000
//     (cara metálica exterior impermeable).  NCh853 / NCh184.
export const CUBIERTAS_TECHUMBRE=[
  // ── Metálicas / láminas ──────────────────────────────────────────────────────
  // λ acero/zinc/aluminio >> 50 W/mK → contribución térmica despreciable en e<1mm
  // μ=100000 → totalmente impermeable al vapor (EN ISO 10456:2007 §B.3)
  { n:'PV-4 / PV-5 Zincalum',              lam:50,   mu:100000, esp:0.0005, cat:'cubierta' },
  { n:'Zinc titanio clic (VMZINC)',         lam:110,  mu:100000, esp:0.0008, cat:'cubierta' },
  { n:'Cobre laminado',                     lam:380,  mu:100000, esp:0.0006, cat:'cubierta' },
  { n:'Plancha aluminio cubierta',          lam:160,  mu:100000, esp:0.0008, cat:'cubierta' },
  // ── Tejas ────────────────────────────────────────────────────────────────────
  // λ teja ceramica = 1.0 W/mK (EN ISO 10456 §B.4 — cerámica cocida)
  // λ teja hormigon = 0.76 W/mK (hormigon poroso liviano)
  { n:'Teja cerámica esmaltada (12mm)',     lam:1.00, mu:25,     esp:0.012,  cat:'cubierta' },
  { n:'Teja hormigón (12mm)',               lam:0.76, mu:40,     esp:0.012,  cat:'cubierta' },
  { n:'Teja madera / shingles (12mm)',      lam:0.12, mu:50,     esp:0.012,  cat:'cubierta' },
  { n:'Teja Asfáltica (incl. fieltro)',     lam:0.17, mu:3000,   esp:0.003,  cat:'cubierta' },
  // ── Fibrocemento / panel ──────────────────────────────────────────────────────
  { n:'Fibrocemento Gran Onda (P7)',        lam:0.24, mu:50,     esp:0.005,  cat:'cubierta' },
  { n:'Panel Sandwich (Poliuretano 40mm)',  lam:0.022,mu:100000, esp:0.04,   cat:'cubierta' },
  { n:'Panel Sandwich lana mineral (60mm)', lam:0.040,mu:100000, esp:0.06,   cat:'cubierta' },
  // ── Membranas (cubierta plana) ────────────────────────────────────────────────
  // λ betún SBS = 0.17 W/mK; μ=50000 según EN 13969 / DIN 52123
  // EPDM: μ≈100000 (prácticamente impermeable al vapor)
  { n:'Membrana SBS bicapa (8mm)',          lam:0.17, mu:50000,  esp:0.008,  cat:'cubierta' },
  { n:'Membrana EPDM (1.5mm)',              lam:0.25, mu:100000, esp:0.0015, cat:'cubierta' },
  { n:'Membrana TPO (1.2mm)',               lam:0.25, mu:100000, esp:0.0012, cat:'cubierta' },
  // ── Policarbonato / translúcido ───────────────────────────────────────────────
  // λ PC alveolar = 0.21 W/mK; μ≈9999 (absorbe vapor pero no lo transmite fácil)
  { n:'Policarbonato alveolar (6mm)',       lam:0.21, mu:9999,   esp:0.006,  cat:'cubierta' },
];

// ALL_MATS — todos los materiales disponibles para LOOKUP por nombre (no para
// renderizado de UI; el dropdown sigue usando MATS + filterMatsByElem). Incluye
// CUBIERTAS_TECHUMBRE para que `ALL_MATS.find(...)` encuentre PV-4 Zincalum,
// tejas, paneles sándwich, etc. y autocomplete sus λ, μ y espesor sugerido.
export const ALL_MATS = [...MATS.flatMap(g=>g.items), ...CUBIERTAS_TECHUMBRE, ...MATERIALES_OFICIAL.flatMap(g=>g.items)];

// Alias semántico para el slot «Revestimiento Exterior» de muros.
// Corresponde exactamente a CAPAS_CIERRE_EXT (definido más abajo). Se re-exporta
// bajo este nombre para que el componente de UI pueda importar una constante
// intuitiva y distinguir claramente el caso muro vs. techo.
// (La asignación del valor real ocurre tras la definición de CAPAS_CIERRE_EXT
//  via un `export { CAPAS_CIERRE_EXT as REVESTIMIENTOS_EXTERIORES }`.)

// ─── Filtro de materiales por tipo de elemento ────────────────────────────────
// Recibe el listado MATS completo + elemTipo ('muro' | 'techo' | 'techumbre' |
// 'tabique' | 'piso'). Devuelve un MATS filtrado que conserva la estructura
// {g, items} pero elimina los items cuyo `usos` excluye explícitamente al
// elemento. Items sin `usos` se consideran universales y siempre pasan.
// Si todo el grupo queda vacío se omite.
export function filterMatsByElem(elemTipo){
  const elem = (elemTipo==='techumbre') ? 'techo'
             : (elemTipo==='tabique')   ? 'muro'
             : elemTipo || null;
  // Lista = catálogo propio + biblioteca oficial anexada (misma estructura/criterio)
  const fuente = [...MATS, ...MATERIALES_OFICIAL];
  if(!elem) return fuente;
  const base = fuente
    .map(g => ({ ...g, items: g.items.filter(m => !m.usos || m.usos.includes(elem)) }))
    .filter(g => g.items.length > 0);
  // Para techumbres, inyectar el catálogo cerrado de cubiertas como grupo extra
  // (de esta forma el selector general también muestra PV-4/PV-5/Tejas/etc. sin
  // duplicarlos en MATS).
  if (elem === 'techo') {
    base.push({ g:'Cubiertas para techumbre', items: CUBIERTAS_TECHUMBRE });
  }
  return base;
}

// ─── RESISTENCIAS SUPERFICIALES (NCh853 / ISO 6946) ──────────────────────────
// BUG-03 FIX: RSE varía según elemento (no es 0.04 para todos)
// Resistencias superficiales según tabla oficial MINVU (planilla higrotérmica
// v2026 · NCh853:2021 / ISO 6946). Por dirección de flujo:
//   Rsi: ascendente(techo) 0.10 · horizontal(muro) 0.13 · descendente(piso) 0.17
//   Rse: 0.04 para TODAS las direcciones (incluido piso).
export const RSI_MAP={muro:0.13,techo:0.10,piso:0.17};
// FIX 2026-05-27: piso era 0.13 (incorrecto). La tabla oficial da Rse=0.04 para
// descendente (piso). El espacio ventilado bajo el piso se modela con un Ru
// aparte (ISO 13370/ISO 6946), no inflando Rse.
export const RSE_MAP={muro:0.04,techo:0.04,piso:0.04};
export const RSE=0.04; // valor por defecto (muro/techo)
export const RCAMARA=0.18;

// ─── Resistencia térmica de cámara de aire NO ventilada (ISO 6946:2017) ──────
// La norma tabula R según el ESPESOR de la cámara (superficies de alta
// emisividad, flujo horizontal). Antes el código usaba RCAMARA=0.18 fijo, que
// sobrevalora cámaras finas (<25mm). Tabla ISO 6946 (interpolación lineal):
//   0mm→0.00 · 5mm→0.11 · 7mm→0.13 · 10mm→0.15 · 15mm→0.17 · ≥25mm→0.18
//
// RETROCOMPATIBLE: si la capa no trae espesor (proyectos guardados antiguos,
// cámaras del catálogo SC sin espesor), devuelve el valor legado 0.18.
const _CAMARA_R_TABLA = [[0,0.0],[5,0.11],[7,0.13],[10,0.15],[15,0.17],[25,0.18]];
export function resistenciaCamara(esp_m){
  const e = parseFloat(esp_m);
  if(!e || isNaN(e) || e<=0) return RCAMARA;     // sin espesor → 0.18 (legado)
  const mm = e*1000;
  if(mm >= 25) return 0.18;                        // ≥25mm satura en 0.18
  for(let i=1;i<_CAMARA_R_TABLA.length;i++){
    const [m0,r0]=_CAMARA_R_TABLA[i-1], [m1,r1]=_CAMARA_R_TABLA[i];
    if(mm<=m1) return r0 + (r1-r0)*(mm-m0)/(m1-m0);
  }
  return 0.18;
}

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
  "1.4.M.A1.1":[{mat:"Hormigon armado",lam:2.50,esp:120,mu:130},{mat:"EPS 20kg/m3",lam:0.040,esp:60,mu:60}],
  "1.4.M.A1.2":[{mat:"Hormigon armado",lam:2.50,esp:120,mu:130},{mat:"EPS 20kg/m3",lam:0.040,esp:80,mu:60}],
  // ── Muros H.A. variantes ─────────────────────────────────────────────────
  "NC-1.2.M.A24.1":[{mat:"Hormigon armado",lam:2.50,esp:200,mu:130},{mat:"Lana mineral 30kg",lam:0.035,esp:80,mu:1},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  // ── Muros Albañilería variantes ───────────────────────────────────────────
  "NC-1.2.M.B15.1":[{mat:"Ladrillo ceramico perforado",lam:0.48,esp:140,mu:8},{mat:"XPS extruido",lam:0.036,esp:60,mu:100},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
  "NC-1.2.M.B17.1":[{mat:"Ladrillo ceramico perforado",lam:0.48,esp:190,mu:8},{mat:"EPS 20kg/m3",lam:0.040,esp:80,mu:60},{mat:"Mortero cemento",lam:1.40,esp:10,mu:25}],
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
    if(c.camara){R+=resistenciaCamara((c.esp||0)/1000);continue;}  // SC en mm → m
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
// Convención ISO 6946:2017 §6.7.2 (corregida 2026-05-27):
//   R'_T  (LÍMITE SUPERIOR, R_upper) = caminos paralelos / adiabático  → MAYOR
//   R''_T (LÍMITE INFERIOR, R_lower) = planos isotérmicos / combinado  → MENOR
//   Siempre R_upper ≥ R_lower. R_T = (R_upper + R_lower)/2  →  U_T = 1/R_T.
//   `R_isotermico` se expone explícito para el perfil de temperatura Glaser
//   (que usa el modelo de planos isotérmicos), independiente del nombre upper/lower.
function calcR_ISO6946_helper(cv, elemTipo, rseOverride) {
  const rsiKey = elemTipo === 'techumbre' ? 'techo' : elemTipo === 'piso' ? 'piso' : 'muro';
  const rsi = RSI_MAP[rsiKey] || 0.13;
  // rseOverride: para cubierta ventilada (ISO 6946 §6.9.4) la cara que da a la
  // cámara venteada usa Rse = Rsi del mismo flujo (aire quieto), no 0.04.
  const rse = (typeof rseOverride === 'number') ? rseOverride : (RSE_MAP[rsiKey] || 0.04);

  // R efectivo por capa (planos isotérmicos — mezcla paralela para capa mixta)
  function Reff(c) {
    if (c.esCamara || c.camara) return resistenciaCamara(c.esp);  // esp en metros
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
    // Sin estructura → serie simple (upper = lower = isotérmico)
    const R = rsi + rse + cv.reduce((s, c) => s + Reff(c), 0);
    return { R_T: R, R_upper: R, R_lower: R, R_isotermico: R, fa: 0, fb: 1, method: 'serie', hasEB: false };
  }

  // ── R''_T — planos isotérmicos / combinado (Ec. 6.4) → LÍMITE INFERIOR ───────
  const R_isoterm = rsi + rse + cv.reduce((s, c) => s + Reff(c), 0);

  // ── R'_T — caminos paralelos int→ext (Ec. 6.5) → LÍMITE SUPERIOR ────────────
  const eb  = mixed.estructura_integrada;
  const fa  = Math.min(Math.max(eb.ancho_mm / eb.distancia_mm, 0.01), 0.99);
  const fb  = 1 - fa;
  const R_struct_lay = mixed.esp / eb.lam;    // R del montante a su espesor
  const R_ins_lay    = mixed.esp / mixed.lam; // R del aislante a su espesor

  // R común a ambos caminos (capas no mixtas)
  let R_comun = rsi + rse;
  for (const c of cv) {
    if (c === mixed) continue;
    if (c.esCamara || c.camara) { R_comun += resistenciaCamara(c.esp); continue; }
    R_comun += c.esp / c.lam;
  }
  const R_A       = R_comun + R_struct_lay;   // camino A: int → montante → ext
  const R_B       = R_comun + R_ins_lay;      // camino B: int → aislante  → ext
  const R_paralelo = 1 / (fa / R_A + fb / R_B);

  // ── Asignación por convención ISO 6946: upper=mayor, lower=menor ────────────
  const R_upper = Math.max(R_paralelo, R_isoterm);   // R'_T  (límite superior)
  const R_lower = Math.min(R_paralelo, R_isoterm);   // R''_T (límite inferior)

  // ── R_T final — media aritmética (Ec. 6.6) ───────────────────────────────────
  const R_T = (R_upper + R_lower) / 2;
  return { R_T, R_upper, R_lower, R_isotermico: R_isoterm, fa, fb, method: 'iso6946', hasEB: true };
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
// ─── Renombres 2026-06-12: códigos que colisionaban con soluciones OFICIALES
// distintas del LOSCAT Ed.14 (auditoría de cruce). El prefijo "NC-" marca
// código interno del catálogo NormaCheck, NO citable como LOSCAT.
// Mapa viejo→nuevo para proyectos guardados con el código anterior.
export const LOSCAT_RENOMBRADOS = {
  '1.2.M.A24.1':'NC-1.2.M.A24.1','1.2.M.A26.1':'NC-1.2.M.A26.1','1.2.M.A26.2':'NC-1.2.M.A26.2',
  '1.2.M.B15.1':'NC-1.2.M.B15.1','1.2.M.B17.1':'NC-1.2.M.B17.1','1.2.M.A27.1':'NC-1.2.M.A27.1',
  '3.2.V.A.C.0.03':'NC-3.2.V.A.C.0.03','3.2.V.A.C.0.04':'NC-3.2.V.A.C.0.04','3.2.V.A.P.1.03':'NC-3.2.V.A.P.1.03',
  '3.2.V.A.P.2.03':'NC-3.2.V.A.P.2.03','3.2.V.P.C.1.03':'NC-3.2.V.P.C.1.03','3.2.V.P.C.2.03':'NC-3.2.V.P.C.2.03',
  '3.2.V.P.C.3.03':'NC-3.2.V.P.C.3.03','3.1.P.M.0.01':'NC-3.1.P.M.0.01','3.1.P.M.0.02':'NC-3.1.P.M.0.02',
  '3.1.P.M.0.03':'NC-3.1.P.M.0.03','3.1.P.M.0.04':'NC-3.1.P.M.0.04','3.1.P.M.0.05':'NC-3.1.P.M.0.05',
  '3.1.P.M.0.06':'NC-3.1.P.M.0.06','3.1.P.M.0.07':'NC-3.1.P.M.0.07','3.1.P.M.0.08':'NC-3.1.P.M.0.08',
  '3.1.P.A.0.01':'NC-3.1.P.A.0.01','3.1.P.A.0.02':'NC-3.1.P.A.0.02','3.1.P.A.0.03':'NC-3.1.P.A.0.03',
  '3.1.P.A.0.04':'NC-3.1.P.A.0.04','3.1.P.A.0.05':'NC-3.1.P.A.0.05','3.1.P.P.0.01':'NC-3.1.P.P.0.01',
  '3.1.P.P.0.02':'NC-3.1.P.P.0.02','3.1.P.P.0.03':'NC-3.1.P.P.0.03',
};
export const SC=[
  // ── MUROS — Hormigón armado ───────────────────────────────────────────────
  {cod:"1.2.M.A25.1",elem:"muro",sistemas:["Hormigon armado"],desc:"H.A. 15cm + PU proyectado TIFF 60mm (LOSCAT Ed.13)",capas:"H.A. 150 | PU proy. 60 | Pasta elastomerica 2",u:0.41,rf:"F150",ac_rw:52,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio","Industrial"],obs:"LOSCAT 1.2.M.A25.1 + LOFC Ed.17 A.1.3. HA 150mm=F150. U=0.41@60mm, 0.35@70mm, 0.29@80mm."},
  {cod:"1.2.M.A23.1",elem:"muro",sistemas:["Hormigon armado"],desc:"H.A. 10cm + PROSOL SATE EPS 20kg 60mm (LOSCAT Ed.13)",capas:"H.A. 100 | EPS 20kg 60 | Malla fibra vidrio | Mortero mineral",u:0.56,rf:"F90",ac_rw:51,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"LOSCAT 1.2.M.A23.1 + LOFC Ed.17 A.1.3. HA 100mm=F90. U=0.56@60mm, 0.43@80mm, 0.35@100mm. Verificar clase RF EPS."},
  {cod:"1.2.M.A22.2",elem:"muro",sistemas:["Hormigon armado"],desc:"H.A. 15cm + EPS 15kg 80mm + corcho Isolcork (LOSCAT Ed.13)",capas:"H.A. 150 | EPS 15kg 80 | Malla | Corcho proyectado",u:0.45,rf:"F150",ac_rw:50,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOSCAT 1.2.M.A22.2 + LOFC Ed.17 A.1.3. HA 150mm=F150. EPS 15kg lambda=0.0413. U=0.45@80mm, 0.39@95mm. Corcho proyectado ISOLCORK como terminacion."},
  {cod:"NC-1.2.M.A24.1",elem:"muro",sistemas:["Hormigon armado"],desc:"H.A. 20cm + lana mineral SATE exterior 80mm",capas:"H.A. 200 | Lana mineral 80 | Malla | Revoque mineral",u:0.44,rf:"F180",ac_rw:54,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"HA 200mm=F180. Lana mineral lambda=0.04. U=0.44@80mm. Alta masa acustica."},
  // ── MUROS — SATE de alto desempeño (EPS grafitado / Neopor, lambda=0.031) ──
  {cod:"NC-1.2.M.A26.1",elem:"muro",sistemas:["Hormigon armado"],desc:"H.A. 15cm + SATE EPS grafitado 80mm (Neopor)",capas:"Estuco 15 | H.A. 150 | EPS grafitado 80 | Malla fibra vidrio | Mortero mineral 5",u:0.35,rf:"F150",ac_rw:52,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"EPS grafitado (Neopor) lambda=0.031, ~18% mejor que EPS blanco. HA 150mm=F150. U=0.35@80mm calculado ISO 6946. Validar lambda con ficha del fabricante."},
  {cod:"NC-1.2.M.A26.2",elem:"muro",sistemas:["Hormigon armado"],desc:"H.A. 15cm + SATE EPS grafitado 100mm (Neopor)",capas:"Estuco 15 | H.A. 150 | EPS grafitado 100 | Malla fibra vidrio | Mortero mineral 5",u:0.29,rf:"F150",ac_rw:53,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"EPS grafitado lambda=0.031. HA 150mm=F150. U=0.29@100mm. Cumple todas las zonas A-I. Validar lambda con fabricante."},
  // ── MUROS — Albañilería ───────────────────────────────────────────────────
  {cod:"1.2.M.B16.1",elem:"muro",sistemas:["Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Albanileria confinada Santiago 9 + PU proyectado TIFF 60mm (LOSCAT Ed.13)",capas:"Albanileria ceramica 140 | PU proy. TIFF 60 | Pasta elastomerica 2",u:0.37,rf:"F180",ac_rw:50,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"LOSCAT 1.2.M.B16.1 + LOFC Ed.17 A.2.2.180.05. Albañileria Santiago 9 (140mm)=F180. U=0.63@30mm, 0.51@40mm, 0.37@60mm, 0.29@80mm."},
  {cod:"NC-1.2.M.B15.1",elem:"muro",sistemas:["Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Albanileria ceramica 14cm + XPS exterior 60mm + revoque",capas:"Albanileria ceramica 140 | XPS 60 | Malla | Revoque",u:0.45,rf:"F120",ac_rw:49,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"XPS lambda=0.034. RF ladrillo ceramico Santiago 9 sin revestimiento=F120-F180 segun espesor. U=0.45@60mm, 0.36@80mm."},
  {cod:"NC-1.2.M.B17.1",elem:"muro",sistemas:["Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Albanileria ceramica 19cm + EPS SATE 80mm",capas:"Albanileria ceramica 190 | EPS 20kg 80 | Malla | Revoque mineral",u:0.39,rf:"F180",ac_rw:52,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Ladrillo ceramico 190mm (tipo Princesa o bloque). U=0.39@80mm. Alta masa."},
  {cod:"1.2.M.B18.1",elem:"muro",sistemas:["Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Albanileria ceramica 14cm + SATE EPS grafitado 80mm (Neopor)",capas:"Estuco 15 | Albanileria ceramica 140 | EPS grafitado 80 | Malla | Revoque mineral",u:0.33,rf:"F180",ac_rw:51,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"Albanileria Santiago 9 (140mm)=F180. EPS grafitado lambda=0.031. U=0.33@80mm calculado ISO 6946. Alta masa termica y acustica."},
  // ── MUROS — Hormigón celular autoclavado (HCA) ────────────────────────────
  {cod:"1.2.M.D1.1",elem:"muro",sistemas:["Hormigon celular autoclavado"],desc:"Bloque HCA 150mm (500 kg/m3) estucado ambas caras",capas:"Estuco 10 | HCA 500 150 | Estuco 10",u:0.74,rf:"F120",ac_rw:40,zonas:"ABC",usos:["Vivienda","Oficina"],obs:"HCA 500 kg/m3 lambda=0.13 (NCh853). U=0.74. RF F120 (material incombustible). Solo zonas A-C."},
  {cod:"1.2.M.D1.2",elem:"muro",sistemas:["Hormigon celular autoclavado"],desc:"Bloque HCA 200mm (500 kg/m3) estucado ambas caras",capas:"Estuco 10 | HCA 500 200 | Estuco 10",u:0.58,rf:"F180",ac_rw:42,zonas:"ABCDE",usos:["Vivienda","Educacion","Oficina"],obs:"HCA 500 kg/m3 lambda=0.13 (NCh853). U=0.58 calculado ISO 6946. RF F180. Zonas A-E. Portante hasta 2 pisos."},
  {cod:"1.2.M.D2.1",elem:"muro",sistemas:["Hormigon celular autoclavado"],desc:"Bloque HCA 150mm + EPS SATE exterior 40mm",capas:"Estuco 10 | HCA 500 150 | EPS 20kg 40 | Malla | Revoque mineral",u:0.43,rf:"F120",ac_rw:41,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Oficina"],obs:"HCA 500 lambda=0.13 + EPS lambda=0.040 (NCh853). U=0.43 calculado ISO 6946. RF F120. Zonas A-G."},
  {cod:"1.2.M.D2.2",elem:"muro",sistemas:["Hormigon celular autoclavado"],desc:"Bloque HCA 200mm + EPS SATE exterior 60mm",capas:"Estuco 10 | HCA 500 200 | EPS 20kg 60 | Malla | Revoque mineral",u:0.31,rf:"F180",ac_rw:43,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"HCA 500 lambda=0.13 + EPS lambda=0.040 (NCh853). U=0.31 calculado ISO 6946. RF F180. Cumple muro en zonas A-G e I; no alcanza el U-max 0.30 de zona H."},
  {cod:"1.2.M.D2.3",elem:"muro",sistemas:["Hormigon celular autoclavado"],desc:"Bloque HCA 200mm + lana mineral SATE exterior 80mm",capas:"Estuco 10 | HCA 500 200 | Lana mineral 80 | Malla | Revoque mineral",u:0.27,rf:"F180",ac_rw:44,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"HCA 500 lambda=0.13 + LM lambda=0.040 (NCh853). U=0.27 calculado ISO 6946. RF F180. Alta eficiencia todas las zonas."},
  // ── MUROS — aplicables a varios sistemas macizos ──────────────────────────
  {cod:"1.2.M.A21.1",elem:"muro",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Sto Therm sobre muros macizos — EPS 60mm (LOSCAT Ed.14)",capas:"Muro macizo | EPS 15kg 60 | Malla StoStandard | Revoque Sto",u:0.58,rf:"F60",ac_rw:48,zonas:"ABCDE",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"LOSCAT 1.2.M.A21.1 Ed.14 — vigencia 12/2026. Serie oficial U: 0.68@50, 0.58@60, 0.45@80, 0.39@95, 0.34@110mm (EPS 15kg lambda=0.0413). Calculo NCh853 + Estudio de Asimilacion N°1.243.147 (valido hasta EPS 100mm). RF depende del muro base."},
  {cod:"NC-1.2.M.A27.1",elem:"muro",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Macizo + Weber.therm lana de roca 80mm (SATE)",capas:"Muro macizo | Lana de roca 80 | Malla | Revoque Weber.therm",u:0.42,rf:"F60",ac_rw:54,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Salud","Oficina","Comercio"],obs:"Weber.therm (Saint-Gobain). Lana de roca lambda=0.040, incombustible A1. U=0.42@80mm calculado ISO 6946 sobre macizo tipico. RF depende del muro base (>=F60). Alta acustica."},
  {cod:"1.2.M.A27.2",elem:"muro",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Macizo + Weber.therm EPS grafitado 100mm (SATE)",capas:"Muro macizo | EPS grafitado 100 | Malla | Revoque Weber.therm",u:0.28,rf:"F60",ac_rw:49,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"Weber.therm con EPS grafitado lambda=0.031. U=0.28@100mm sobre macizo tipico. RF depende del muro base (>=F60). Validar lambda con fabricante."},
  {cod:"1.2.M.A28.1",elem:"muro",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Macizo + Dryvit Outsulation EPS 100mm (SATE)",capas:"Muro macizo | EPS 20kg 100 | Malla | Acabado Dryvit Outsulation",u:0.33,rf:"F60",ac_rw:48,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"Dryvit Outsulation. EPS blanco 20kg lambda=0.038. U=0.33@100mm calculado ISO 6946 sobre macizo tipico. RF depende del muro base (>=F60)."},
  {cod:"1.2.M.F2.3",elem:"muro",sistemas:null,desc:"Panel muro Monoplac PMO-110 (LOSCAT Ed.13)",capas:"Mortero 30 | EPS 10kg 90 | Mortero 30",u:0.43,rf:"F30",ac_rw:38,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"LOSCAT 1.2.M.F2.3. EPS nucleo 10kg/m3 90mm, mortero 30mm c/cara. U=0.43@90mm. RF y acustica requieren mejora para Salud/Educacion."},
  {cod:"1.2.M.F2.5",elem:"muro",sistemas:null,desc:"Panel muro Monoplac PMO-160 (LOSCAT Ed.13)",capas:"Mortero 30 | EPS 10kg 140 | Mortero 30",u:0.29,rf:"F30",ac_rw:38,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"LOSCAT 1.2.M.F2.5. EPS nucleo 10kg/m3 140mm, mortero 30mm c/cara. U=0.29@140mm. Requiere revestimiento ignifugo adicional."},
  // ── MUROS — Estructura de madera ─────────────────────────────────────────
  {cod:"1.2.G.C1.3",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x3 (65x38mm) + lana vidrio 80mm + yeso carton",capas:"Yeso carton 10 | Lana vidrio 80 | OSB 11 | Camara 20 | Yeso carton 10",u:0.34,rf:"F60",ac_rw:48,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina"],obs:"LOSCAT 1.2.G.C1.3. Requiere barrera vapor en zona F-I. U con factor puente termico madera."},
  {cod:"1.2.G.M1.1",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x4 (89x38mm) + lana mineral 90mm + yeso carton",capas:"Yeso carton 13 | Lana mineral 90 | OSB 11 | Camara 20 | Fibrocemento 8",u:0.41,rf:"F30",ac_rw:42,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina"],obs:"Solución estándar Chile. Factor puente térmico madera (~15%). Requiere barrera vapor zona F-I. U=0.41 con TB."},
  {cod:"1.2.G.M1.2",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x4 + lana mineral 90mm + XPS exterior 40mm",capas:"Yeso carton 13 | Lana mineral 90 | OSB 11 | XPS 40 | Revoque 10",u:0.30,rf:"F30",ac_rw:43,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"XPS exterior corta puente termico. U=0.30. Zonas G-I requieren mayor espesor XPS."},
  {cod:"1.2.G.M1.3",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x6 (140x38mm) + lana mineral 140mm + barrera vapor",capas:"Yeso carton 13 | Barrera vapor | Lana mineral 140 | OSB 11 | Fibrocemento 8",u:0.30,rf:"F30",ac_rw:46,zonas:"CDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"Para zonas frías C-I. Barrera vapor obligatoria. U=0.30 con factor puente térmico."},
  {cod:"1.2.G.M1.4",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x6 + lana mineral 140mm + EPS exterior 60mm",capas:"Yeso carton 13 | Barrera vapor | Lana mineral 140 | OSB 11 | EPS 20kg 60 | Revoque 10",u:0.20,rf:"F30",ac_rw:47,zonas:"EFGHI",usos:["Vivienda","Oficina"],obs:"Sistema de alta eficiencia para zonas muy frías E-I. EPS exterior elimina puente térmico. U=0.20."},
  {cod:"1.2.G.M1.5",elem:"muro",sistemas:["Estructura de madera"],desc:"Entramado madera 2x4 + lana mineral 90mm + EPS grafitado exterior 50mm",capas:"Yeso carton 13 | Barrera vapor | Lana mineral 90 | OSB 11 | EPS grafitado 50 | Revoque 5",u:0.24,rf:"F30",ac_rw:46,zonas:"EFGHI",usos:["Vivienda","Oficina"],obs:"EPS grafitado exterior (lambda=0.031) continuo corta el puente termico de la madera. U=0.24 calculado ISO 6946, menor espesor que con EPS blanco. Para zonas frias E-I. Barrera vapor obligatoria."},
  {cod:"1.2.G.M2.1",elem:"muro",sistemas:["Estructura de madera"],desc:"Panel SIP OSB/EPS 20kg/OSB 100mm",capas:"OSB 12 | EPS 20kg 100 | OSB 12",u:0.44,rf:"F15",ac_rw:35,zonas:"ABCDEFG",usos:["Vivienda","Oficina"],obs:"Panel SIP autoportante. RF F15 por EPS: requiere revestimiento ignifugo (yeso carton o fibrocemento). U=0.44."},
  {cod:"1.2.G.M2.2",elem:"muro",sistemas:["Estructura de madera"],desc:"Panel SIP OSB/EPS 20kg/OSB 150mm",capas:"OSB 12 | EPS 20kg 150 | OSB 12",u:0.28,rf:"F15",ac_rw:37,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"SIP espesor aumentado. U=0.28. RF mejorar con revestimiento RF interior. Zonas E-I."},
  {cod:"1.2.G.M2.3",elem:"muro",sistemas:["Estructura de madera"],desc:"Panel SIP OSB/EPS grafitado/OSB 120mm",capas:"OSB 11 | EPS grafitado 98 | OSB 11",u:0.29,rf:"F15",ac_rw:36,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"SIP con nucleo EPS grafitado lambda=0.031: mejor U que el SIP estandar al mismo espesor. U=0.29@120mm calculado ISO 6946. RF F15 por EPS: requiere revestimiento ignifugo interior (yeso carton o fibrocemento)."},
  {cod:"1.2.G.M2.4",elem:"muro",sistemas:["Estructura de madera"],desc:"Panel SIP OSB/EPS 20kg/OSB 200mm (zonas extremas)",capas:"OSB 12 | EPS 20kg 176 | OSB 12",u:0.21,rf:"F15",ac_rw:38,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"SIP de gran espesor para zonas muy frias H-I. EPS 20kg lambda=0.038. U=0.21@200mm calculado ISO 6946. RF mejorar con revestimiento ignifugo interior."},
  {cod:"1.2.G.M2.5",elem:"muro",sistemas:["Estructura de madera"],desc:"Panel SIP placa MgO + EPS 20kg 120mm (mejor RF)",capas:"Placa MgO 12 | EPS 20kg 120 | Placa MgO 12",u:0.29,rf:"F30",ac_rw:38,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"SIP con caras de placa de oxido de magnesio (MgO, incombustible A1): RF F30 sin revestimiento adicional. EPS 20kg lambda=0.038. U=0.29@nucleo 120mm calculado ISO 6946."},
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
  {cod:"1.1.M.B4.0.1",elem:"techumbre",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Panel Losa Nervada Cubierta Monoplac PLN-100",capas:"EPS 10kg 80+20mm nervadura | Malla AT56 | H.A. 80+50mm | Yeso carton 10",u:0.58,rf:"F60",ac_rw:null,zonas:"ABCD",usos:["Vivienda","Oficina"],obs:"PLN-100. U=0.58 Rt=1.72. Nucleo EPS 80/20mm nervadura. Para zonas A-D (U-max techo hasta 0.84)."},
  {cod:"1.1.M.B4.1.1",elem:"techumbre",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Panel Losa Nervada Cubierta Monoplac PLN-120 (LOSCAT Ed.13)",capas:"EPS 10kg 100+40mm nervadura | Malla AT56 | H.A. 110+50mm | Yeso carton 10",u:0.51,rf:"F60",ac_rw:null,zonas:"ABCDE",usos:["Vivienda","Educacion","Oficina"],obs:"LOSCAT 1.1.M.B4.1.1. U=0.51 Rt=1.95. Nucleo EPS 100/40mm nervadura. Para zonas A-E (U-max techo 0.38-0.84)."},
  {cod:"1.1.M.B4.1.2",elem:"techumbre",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Panel Losa Nervada Cubierta Monoplac PLN-150 (LOSCAT Ed.13)",capas:"EPS 10kg 130+40mm nervadura | Malla AT56 | H.A. 140+50mm | Yeso carton 10",u:0.44,rf:"F60",ac_rw:null,zonas:"ABCDEF",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOSCAT 1.1.M.B4.1.2. U=0.44 Rt=2.28. Nucleo EPS 130/40mm nervadura. Para zonas A-F (U-max techo hasta 0.28)."},
  {cod:"1.3.M.A6.1",elem:"techumbre",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Losa H.A. 12cm con sistema Prosol SATE EPS 100mm (LOSCAT Ed.14)",capas:"H.A. 120 | EPS 20kg Prosol 100 | Malla Progard 165 | Mortero Prosol Finish",u:0.31,rf:"F60",ac_rw:null,zonas:"ABCDE",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"LOSCAT 1.3.M.A6.1 Ed.14 — Losa HA 12cm con sistema Prosol SATE. Serie oficial U: 0.66@35, 0.56@45, 0.49@55, 0.39@75, 0.31@100, 0.29@110mm (EPS 20kg lambda=0.0384). Calculo NCh853, Prosol System Ltda."},
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
  // ── PISOS — Radier sobre terreno ──────────────────────────────────────────
  {cod:"1.4.M.B1.1",elem:"piso",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Hormigon celular autoclavado","Mixta HA + albanileria"],desc:"Radier HA 100mm + EPS 20kg bajo radier 40mm continuo",capas:"Radier H.A. 100 | EPS 20kg 40 continuo | PE 0.2mm | Ripio compactado",u:0.50,rf:null,ac_rw:null,zonas:"ABCDE",usos:["Vivienda","Educacion","Oficina"],obs:"U referencial 0.50 para B'=4.4 (vivienda ~80 m2, ISO 13370). EPS lambda=0.040 bajo losa continuo. Membrana PE sobre ripio obligatoria. U real depende de geometria P/A."},
  {cod:"1.4.M.B1.2",elem:"piso",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Hormigon celular autoclavado","Mixta HA + albanileria"],desc:"Radier HA 100mm + EPS 20kg bajo radier 60mm continuo",capas:"Radier H.A. 100 | EPS 20kg 60 continuo | PE 0.2mm | Ripio compactado",u:0.38,rf:null,ac_rw:null,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"U referencial 0.38 para B'=4.4 (ISO 13370). EPS lambda=0.040. Zonas A-G. U real depende de geometria P/A."},
  {cod:"1.4.M.B1.3",elem:"piso",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Hormigon celular autoclavado","Mixta HA + albanileria"],desc:"Radier HA 100mm + XPS bajo radier 80mm continuo",capas:"Radier H.A. 100 | XPS 80 continuo | PE 0.2mm | Ripio compactado",u:0.28,rf:null,ac_rw:null,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"U referencial 0.28 para B'=4.4 (ISO 13370). XPS lambda=0.034. Cumple todas las zonas A-I. XPS resiste humedad mejor que EPS bajo radier."},
  {cod:"1.4.M.B2.1",elem:"piso",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Hormigon celular autoclavado","Mixta HA + albanileria"],desc:"Radier HA 100mm + EPS perimetral vertical 50mm x 600mm",capas:"Radier H.A. 100 | EPS perimetral 50 x 600mm prof. | PE 0.2mm",u:0.58,rf:null,ac_rw:null,zonas:"ABCD",usos:["Vivienda","Oficina"],obs:"U referencial 0.58 para B'=4.4 (ISO 13370). Aislacion solo perimetral vertical, economia de material. Zonas A-D."},
  // ── PISOS/ENTREPISOS — Monoplac ───────────────────────────────────────────
  {cod:"1.4.M.B4.1.1",elem:"piso",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Panel Losa Nervada Entrepiso Monoplac PME-120",capas:"EPS 10kg 100+40mm nervadura | Malla AT56 | H.A. 110+50mm | Yeso carton 10",u:0.51,rf:"F60",ac_rw:38,zonas:"ABCDE",usos:["Vivienda","Educacion","Oficina"],obs:"PME-120. U=0.51. Entrepiso prefabricado con nucleo EPS. Para acustica de impacto agregar solado flotante."},
  {cod:"1.4.M.B4.1.2",elem:"piso",sistemas:["Hormigon armado","Albanileria confinada","Albanileria armada","Mixta HA + albanileria"],desc:"Panel Losa Nervada Entrepiso Monoplac PME-150",capas:"EPS 10kg 130+40mm nervadura | Malla AT56 | H.A. 140+50mm | Yeso carton 10",u:0.44,rf:"F60",ac_rw:40,zonas:"ABCDEF",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"PME-150. U=0.44. Mayor aislacion termica y acustica. Para impacto agregar solado flotante."},
  // ── PISOS — Estructura de madera ─────────────────────────────────────────
  {cod:"1.4.G.M1.1",elem:"piso",sistemas:["Estructura de madera"],desc:"Viguería madera + OSB + lana mineral 100mm + cielo yeso carton",capas:"Cielo YC 13 | Lana mineral 100 | OSB 18 | Solado OSB 18",u:0.32,rf:"F30",ac_rw:null,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Oficina"],obs:"Piso sobre cámara ventilada. Lana mineral entre vigas (TB ~20%). U=0.32. Barrera vapor exterior zona F-I."},
  {cod:"1.4.G.M1.2",elem:"piso",sistemas:["Estructura de madera"],desc:"Viguería madera + lana mineral 100mm + membrana (piso ventilado sobre terreno)",capas:"Solado OSB 18 | Lana mineral 100 | Membrana polietileno | Cielo YC 13",u:0.30,rf:"F30",ac_rw:null,zonas:"ABCDEFGH",usos:["Vivienda","Oficina"],obs:"Piso ventilado tipo sobresolera. Membrana PE obligatoria sobre suelo. U=0.30 incluye TB. Zonas A-H."},
  {cod:"1.4.G.M2.1",elem:"piso",sistemas:["Estructura de madera"],desc:"Viguería madera + lana mineral 150mm + XPS 40mm bajo solado",capas:"XPS 40 | Solado OSB 18 | Lana mineral 150 | Membrana | Cielo YC 13",u:0.19,rf:"F30",ac_rw:null,zonas:"EFGHI",usos:["Vivienda","Oficina"],obs:"Doble capa para zonas muy frías E-I. XPS continuo elimina TB. U=0.19."},
  // ── VENTANAS — Aluminio sin RPT (solo zonas A-C, baja exigencia) ──────────
  {cod:"NC-3.2.V.A.C.0.03",elem:"ventana",sistemas:null,desc:"Ventana Al sin RPT + DVH 4/12/4 aire",capas:"DVH 4/12/4 aire | Marco Al sin RPT",u:2.80,rf:null,ac_rw:null,perm:1,zonas:"AB",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"Uw=2.80 (ISO 10077). Solo zonas A-B (Zona A sin exigencia U, Zona B PERM_V clase 1). DS N°15 no fija Umax ventana, pero VPCT y permeabilidad aplican."},
  {cod:"NC-3.2.V.A.C.0.04",elem:"ventana",sistemas:null,desc:"Ventana Al sin RPT + DVH 4/12/4 argon",capas:"DVH 4/12/4 argon | Marco Al sin RPT",u:2.60,rf:null,ac_rw:null,perm:1,zonas:"ABC",usos:["Vivienda","Educacion","Oficina","Comercio"],obs:"Uw≈2.60 (ISO 10077). Ug argon=2.4. Perm. clase 1. Zonas A-C."},
  // ── VENTANAS — Aluminio con RPT ────────────────────────────────────────────
  {cod:"NC-3.2.V.A.P.1.03",elem:"ventana",sistemas:null,desc:"Ventana Al RPT 24mm + DVH 4/12/4 Low-E argon",capas:"DVH 4/12/4 Low-E argon | Marco Al RPT 24mm",u:1.80,rf:null,ac_rw:null,perm:2,zonas:"ABCDEF",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=1.80 (ISO 10077): Uf=2.8, Ug=1.5. Perm. clase 2 (DS N°15 zonas D-F). Zonas A-F."},
  {cod:"NC-3.2.V.A.P.2.03",elem:"ventana",sistemas:null,desc:"Ventana Al RPT 32mm + DVH 4/16/4 Low-E argon",capas:"DVH 4/16/4 Low-E argon | Marco Al RPT 32mm",u:1.50,rf:null,ac_rw:null,perm:2,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=1.50 (ISO 10077): Uf=2.5, Ug=1.4. Perm. clase 2. Cumple zonas A-G."},
  {cod:"3.2.V.A.P.3.03",elem:"ventana",sistemas:null,desc:"Ventana Al RPT 40mm + DVH 4/16/4 Low-E kripton",capas:"DVH 4/16/4 Low-E kripton | Marco Al RPT 40mm",u:1.10,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=1.10 (ISO 10077): Uf=2.2, Ug=0.9. Perm. clase 3 (DS N°15 zonas G-I). Cumple A-H."},
  {cod:"3.2.V.A.T.1.03",elem:"ventana",sistemas:null,desc:"Ventana Al RPT 60mm + TVH 4/12/4/12/4 Low-E argon",capas:"TVH 4/12/4/12/4 Low-E argon | Marco Al RPT 60mm",u:0.80,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=0.80 (ISO 10077): Uf=1.6, Ug=0.6 triple Low-E. Perm. clase 3. Bracket Uw<=0.8 de Tabla 3: admite alto % vidriado en todas las zonas/orientaciones (el cumplimiento depende del % de vano)."},
  // ── VENTANAS — PVC ─────────────────────────────────────────────────────────
  {cod:"NC-3.2.V.P.C.1.03",elem:"ventana",sistemas:null,desc:"Ventana PVC 3 cámaras + DVH 4/12/4 argon",capas:"DVH 4/12/4 argon | Marco PVC 3 cam.",u:2.10,rf:null,ac_rw:null,perm:1,zonas:"ABCDEF",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=2.10 (ISO 10077): Uf=2.0, Ug=2.4. Perm. clase 1-2. Zonas A-F."},
  {cod:"NC-3.2.V.P.C.2.03",elem:"ventana",sistemas:null,desc:"Ventana PVC 3 cámaras + DVH 4/12/4 Low-E argon",capas:"DVH 4/12/4 Low-E argon | Marco PVC 3 cam.",u:1.70,rf:null,ac_rw:null,perm:2,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=1.70 (ISO 10077): Uf=2.0, Ug=1.5. Perm. clase 2. Buena relacion precio/desempeno. Zonas A-G."},
  {cod:"NC-3.2.V.P.C.3.03",elem:"ventana",sistemas:null,desc:"Ventana PVC 5 cámaras + DVH 4/16/4 Low-E argon",capas:"DVH 4/16/4 Low-E argon | Marco PVC 5 cam.",u:1.30,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=1.30 (ISO 10077): Uf=1.7, Ug=1.4. Perm. clase 3. Zonas G-H. DS N°15."},
  {cod:"3.2.V.P.T.1.03",elem:"ventana",sistemas:null,desc:"Ventana PVC 6 cámaras + TVH Low-E argon",capas:"TVH 4/12/4/12/4 Low-E argon | Marco PVC 6 cam.",u:0.80,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=0.80 (ISO 10077): Uf=1.4, Ug=0.6. Perm. clase 3. Maximo estandar. Zonas H-I."},
  // ── VENTANAS — Marco madera y composite ────────────────────────────────────
  {cod:"3.2.V.M.P.1.03",elem:"ventana",sistemas:null,desc:"Ventana marco madera pino 68mm + DVH 4/16/4 Low-E argon",capas:"DVH 4/16/4 Low-E argon | Marco madera pino 68mm",u:1.40,rf:null,ac_rw:null,perm:2,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina"],obs:"Uw=1.40 (ISO 10077): Uf=2.0, Ug=1.4. Marco madera sin puente termico metalico. Perm. clase 2-3. Zonas A-H."},
  {cod:"3.2.V.M.T.1.03",elem:"ventana",sistemas:null,desc:"Ventana marco madera pino 78mm + TVH Low-E argon",capas:"TVH 4/12/4/12/4 Low-E argon | Marco madera pino 78mm",u:0.90,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"Uw=0.90 (ISO 10077): Uf=1.8, Ug=0.6. Sin puente termico metalico. Perm. clase 3. Optimo para zonas H-I."},
  {cod:"3.2.V.C.T.1.03",elem:"ventana",sistemas:null,desc:"Ventana composite Al-madera + TVH Low-E argon/kripton",capas:"TVH 4/16/4/16/4 Low-E Ar/Kr | Marco composite Al-madera",u:0.75,rf:null,ac_rw:null,perm:3,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"Uw=0.75 (ISO 10077): Uf=1.6, Ug=0.5. Marco composite sin puente termico. Perm. clase 3. Estandar pasivo. Zonas G-I recomendado."},
  // ── PUERTAS — Madera ──────────────────────────────────────────────────────
  {cod:"NC-3.1.P.M.0.01",elem:"puerta",sistemas:null,desc:"Puerta madera maciza 45mm",capas:"Madera maciza 45mm",u:2.20,rf:"F30",ac_rw:28,zonas:"AB",usos:["Vivienda","Educacion","Oficina"],obs:"U=2.20 (NCh853). RF F30 por carbonizacion (LOFC Ed.17). Solo zonas A-B: zona A sin exigencia, zona B PUERTA_U no aplica segun DS N°15 Tabla."},
  {cod:"NC-3.1.P.M.0.02",elem:"puerta",sistemas:null,desc:"Puerta madera maciza doble hoja con camara 70mm",capas:"Madera maciza 35mm | Camara aire 20mm | Madera maciza 15mm",u:1.60,rf:"F30",ac_rw:32,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"U=1.60 (NCh853). Camara Rcam=0.18 m²K/W. Cumple PUERTA_U ≤1.7 zonas B-E y ≤2.0 zonas F-G. RF F30."},
  {cod:"NC-3.1.P.M.0.03",elem:"puerta",sistemas:null,desc:"Puerta madera con nucleo EPS 40mm",capas:"Madera 10mm | EPS 20kg 40mm | Madera 10mm",u:1.30,rf:"F15",ac_rw:30,zonas:"ABCDEFGH",usos:["Vivienda","Oficina"],obs:"U=1.30 (NCh853). EPS lambda=0.040. RF F15 (EPS limita RF). Cumple PUERTA_U todas las zonas B-H."},
  {cod:"NC-3.1.P.M.0.04",elem:"puerta",sistemas:null,desc:"Puerta madera con nucleo lana mineral 60mm",capas:"Madera 10mm | Lana mineral 60mm | Madera 10mm",u:0.55,rf:"F60",ac_rw:38,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Salud","Oficina"],obs:"U=0.55 (NCh853). Lana mineral lambda=0.040. RF F60 certificable (LOFC Ed.17). Cumple todas las zonas A-I."},
  {cod:"NC-3.1.P.M.0.05",elem:"puerta",sistemas:null,desc:"Puerta madera contraplacada hueca 40mm",capas:"Contrachapado 4mm | Marco pino 35mm | Contrachapado 4mm",u:2.60,rf:"F15",ac_rw:22,zonas:"AB",usos:["Vivienda","Educacion"],obs:"U=2.60. Solo zonas A-B. Puerta interior tipica liviana."},
  {cod:"NC-3.1.P.M.0.06",elem:"puerta",sistemas:null,desc:"Puerta madera contraplacada OSB 50mm",capas:"Contrachapado 6mm | OSB 38mm | Contrachapado 6mm",u:1.60,rf:"F15",ac_rw:27,zonas:"ABCDEFG",usos:["Vivienda","Educacion"],obs:"U=1.60. OSB lambda=0.13. Cumple PUERTA_U ≤1.7 zonas B-E y ≤2.0 zonas F-G."},
  {cod:"NC-3.1.P.M.0.07",elem:"puerta",sistemas:null,desc:"Puerta madera con nucleo XPS 50mm",capas:"Fibrocemento 6mm | XPS 50mm | Fibrocemento 6mm",u:0.90,rf:"F15",ac_rw:30,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"U=0.90 (NCh853). XPS lambda=0.034. Cumple todas las zonas A-I."},
  {cod:"NC-3.1.P.M.0.08",elem:"puerta",sistemas:null,desc:"Puerta madera LVL 25mm + lana mineral 60mm + LVL 25mm (zonas H-I)",capas:"LVL 25mm | Lana mineral 60mm | LVL 25mm",u:0.52,rf:"F60",ac_rw:40,zonas:"ABCDEFGHI",usos:["Vivienda","Educacion","Oficina"],obs:"U=0.52 (NCh853). LVL lambda=0.13, lana mineral lambda=0.040. RF F60. Alta masa. Optimo zonas H-I."},
  // ── PUERTAS — Acero / metalicas ───────────────────────────────────────────
  {cod:"NC-3.1.P.A.0.01",elem:"puerta",sistemas:null,desc:"Puerta metalica acero + lana mineral 50mm",capas:"Acero 1.5mm | Lana mineral 50mm | Acero 1.5mm",u:1.50,rf:"F60",ac_rw:35,zonas:"ABCDEFG",usos:["Industrial","Comercio","Oficina"],obs:"U=1.50 (NCh853). Cumple PUERTA_U todas las zonas. RF F60."},
  {cod:"NC-3.1.P.A.0.02",elem:"puerta",sistemas:null,desc:"Puerta metalica acero + lana mineral 80mm + jamba RPT",capas:"Acero 1.5mm | Lana mineral 80mm | Acero 1.5mm | Jamba RPT",u:1.00,rf:"F60",ac_rw:37,zonas:"ABCDEFGHI",usos:["Industrial","Comercio","Oficina","Educacion"],obs:"U=1.00 con RPT en jamba (reduce puente termico ~30%). Cumple todas las zonas A-I."},
  {cod:"NC-3.1.P.A.0.03",elem:"puerta",sistemas:null,desc:"Puerta metalica cortafuego RF-60 homologada",capas:"Acero 2mm | Lana mineral 80mm | Acero 2mm",u:1.30,rf:"F60",ac_rw:36,zonas:"ABCDEFGH",usos:["Industrial","Comercio","Oficina","Educacion","Salud"],obs:"U=1.30. RF F60 homologada OGUC Tit.4. Cumple zonas A-H."},
  {cod:"NC-3.1.P.A.0.04",elem:"puerta",sistemas:null,desc:"Puerta metalica cortafuego RF-90 + jamba RPT",capas:"Acero 2mm | Lana mineral 100mm | Acero 2mm | Jamba RPT",u:0.90,rf:"F90",ac_rw:38,zonas:"ABCDEFGHI",usos:["Industrial","Salud","Educacion"],obs:"U=0.90 con RPT jamba. RF F90 certificada. Cumple todas las zonas A-I."},
  {cod:"NC-3.1.P.A.0.05",elem:"puerta",sistemas:null,desc:"Puerta acero + PU inyectado 80mm + RPT 40mm",capas:"Acero 0.8mm | PU inyectado 80mm | Acero 0.8mm | Marco RPT 40mm",u:0.65,rf:null,ac_rw:30,zonas:"ABCDEFGHI",usos:["Industrial","Comercio","Vivienda"],obs:"U=0.65. PU lambda=0.027, RPT 40mm elimina puente termico de marco. Cumple todas las zonas A-I."},
  // ── PUERTAS — Aluminio con RPT ────────────────────────────────────────────
  {cod:"3.1.P.AL.0.01",elem:"puerta",sistemas:null,desc:"Puerta Al sin RPT + panel lana mineral 50mm",capas:"Marco Al sin RPT | Panel lana mineral 50mm",u:2.80,rf:null,ac_rw:28,zonas:"AB",usos:["Oficina","Comercio"],obs:"Sin RPT: alto puente termico. U=2.80. Solo zonas A-B."},
  {cod:"3.1.P.AL.0.02",elem:"puerta",sistemas:null,desc:"Puerta Al RPT 24mm + panel lana mineral 60mm",capas:"Marco Al RPT 24mm | Panel lana mineral 60mm",u:1.60,rf:null,ac_rw:32,zonas:"ABCDEFG",usos:["Oficina","Comercio","Educacion"],obs:"U=1.60 (RPT 24mm: Uf=2.8). Cumple PUERTA_U ≤1.7 zonas B-E y ≤2.0 zonas F-G."},
  {cod:"3.1.P.AL.0.03",elem:"puerta",sistemas:null,desc:"Puerta Al RPT 40mm + panel lana mineral 80mm",capas:"Marco Al RPT 40mm | Panel lana mineral 80mm",u:1.20,rf:null,ac_rw:35,zonas:"ABCDEFGH",usos:["Oficina","Comercio","Educacion","Salud"],obs:"U=1.20 (RPT 40mm: Uf=2.2). Cumple todas las zonas B-H."},
  {cod:"3.1.P.AL.0.04",elem:"puerta",sistemas:null,desc:"Puerta Al RPT 60mm + panel XPS 80mm (zonas H-I)",capas:"Marco Al RPT 60mm | Panel XPS 80mm",u:0.80,rf:null,ac_rw:32,zonas:"ABCDEFGHI",usos:["Oficina","Comercio","Educacion","Salud","Vivienda"],obs:"U=0.80 (RPT 60mm: Uf=1.6, XPS 80mm lambda=0.034). Cumple todas las zonas A-I."},
  // ── PUERTAS — PVC ─────────────────────────────────────────────────────────
  {cod:"NC-3.1.P.P.0.01",elem:"puerta",sistemas:null,desc:"Puerta PVC 3 cam. + DVH 4/12/4 argon (acristalada)",capas:"Marco PVC 3 cam. | DVH 4/12/4 argon",u:1.80,rf:null,ac_rw:null,zonas:"ABCDEFG",usos:["Vivienda","Educacion","Oficina"],obs:"Uw=1.80 (ISO 10077). Cumple PUERTA_U ≤2.0 zonas F-G. Para zonas B-E (≤1.7) usar DVH Low-E."},
  {cod:"NC-3.1.P.P.0.02",elem:"puerta",sistemas:null,desc:"Puerta PVC 3 cam. + DVH Low-E argon (acristalada)",capas:"Marco PVC 3 cam. | DVH 4/12/4 Low-E argon",u:1.50,rf:null,ac_rw:null,zonas:"ABCDEFGH",usos:["Vivienda","Educacion","Oficina"],obs:"Uw=1.50 (ISO 10077): Uf=2.0, Ug=1.5. Cumple PUERTA_U ≤1.7 zonas B-E y ≤2.0 zonas F-H."},
  {cod:"NC-3.1.P.P.0.03",elem:"puerta",sistemas:null,desc:"Puerta PVC 5 cam. opaca + nucleo PU 80mm",capas:"Marco PVC 5 cam. | Panel PU inyectado 80mm",u:0.55,rf:null,ac_rw:35,zonas:"ABCDEFGHI",usos:["Vivienda","Oficina"],obs:"U=0.55. PU lambda=0.027, PVC 5 cam. Uf=1.7. Cumple todas las zonas A-I. Optimo H-I."},
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
  {cod:"1.2.M.D2.2",desc:"Bloque HCA 200mm + EPS SATE exterior 60mm",elem:"muro",zonas:"ABCDEFGHI",rf:"F180",rw_base:43,masa_kg_m2:112,capas:[{n:"Estuco interior",lam:0.70,esp:10,esAislante:false,mu:25,den:1800},{n:"HCA 500 kg/m3",lam:0.13,esp:200,esAislante:false,mu:5,den:500},{n:"EPS 20kg SATE",lam:0.040,esp:60,esAislante:true,mu:60,den:20},{n:"Malla + revoque mineral",lam:0.70,esp:8,esAislante:false,mu:25,den:1800}],nota:"U=0.31. HCA baja densidad + SATE. Modificar espesor EPS segun zona.",advertencia:null},
];

// ─── VIDRIOS / MARCOS ─────────────────────────────────────────────────────────
export const VIDRIOS=[{grupo:"Vidrio simple",items:[{n:"Vidrio simple 4mm",ug:5.8,desc:"Solo Zona A."},{n:"Vidrio simple 6mm",ug:5.7,desc:"Solo Zona A."}]},{grupo:"DVH aire",items:[{n:"DVH 4/6/4 aire",ug:3.3,desc:"Zonas A-C."},{n:"DVH 4/9/4 aire",ug:2.9,desc:"Zonas B-D."},{n:"DVH 4/12/4 aire",ug:2.7,desc:"Zonas B-D."},{n:"DVH 4/16/4 aire",ug:2.6,desc:"Zonas C-E."}]},{grupo:"DVH argon",items:[{n:"DVH 4/6/4 argon",ug:3.0,desc:"Mejora 10% vs aire."},{n:"DVH 4/9/4 argon",ug:2.6,desc:"Zonas D-E."},{n:"DVH 4/12/4 argon",ug:2.4,desc:"Zonas D-F."},{n:"DVH 4/16/4 argon",ug:2.2,desc:"Zonas E-F."}]},{grupo:"DVH Low-E",items:[{n:"DVH 4/12/4 Low-E aire",ug:1.8,desc:"Zonas E-G."},{n:"DVH 4/12/4 Low-E argon",ug:1.5,desc:"Zonas F-H."},{n:"DVH 4/16/4 Low-E argon",ug:1.4,desc:"Zonas G-I."}]},{grupo:"TVH triple",items:[{n:"TVH 4/9/4/9/4 aire",ug:1.8,desc:"Tres vidrios."},{n:"TVH 4/12/4/12/4 argon",ug:1.2,desc:"Zonas G-I."},{n:"TVH Low-E argon",ug:0.8,desc:"Maximo estandar."}]}];
export const MARCOS=[{grupo:"Aluminio sin RPT",items:[{n:"Al sin RPT estandar",uf:5.9,psi:0.10,desc:"Solo Zonas A-C."},{n:"Al sin RPT reforzado",uf:5.5,psi:0.10,desc:"Solo Zonas A-C."}]},{grupo:"Aluminio con RPT",items:[{n:"Al con RPT 12mm",uf:3.5,psi:0.08,desc:"Zonas C-E."},{n:"Al con RPT 24mm",uf:2.8,psi:0.07,desc:"Zonas D-F."},{n:"Al con RPT 32mm",uf:2.5,psi:0.06,desc:"Zonas E-G."},{n:"Al con RPT 40mm",uf:2.2,psi:0.06,desc:"Zonas F-H."}]},{grupo:"PVC",items:[{n:"PVC 2 camaras",uf:2.2,psi:0.07,desc:"Zonas D-F."},{n:"PVC 3 camaras",uf:2.0,psi:0.06,desc:"Zonas E-G."},{n:"PVC 5 camaras",uf:1.7,psi:0.05,desc:"Zonas F-H."},{n:"PVC 6 camaras reforzado",uf:1.4,psi:0.05,desc:"Zonas G-I."}]},{grupo:"Madera",items:[{n:"Madera pino 68mm",uf:2.0,psi:0.07,desc:"Zonas D-G."},{n:"Madera pino 78mm",uf:1.8,psi:0.06,desc:"Zonas E-H."},{n:"Madera/aluminio composite",uf:2.0,psi:0.06,desc:"Zonas D-H."}]},{grupo:"Acero",items:[{n:"Acero sin RPT",uf:7.0,psi:0.12,desc:"Solo Zona A."},{n:"Acero con RPT",uf:3.8,psi:0.09,desc:"Zonas B-D."}]}];

// ─── RECOMENDACIONES POR USO ──────────────────────────────────────────────────
export const REC_USO={
  Vivienda:{desc:"Prioridad: confort termico, costo accesible, acustica entre unidades.",muros:[{cod:"1.2.G.C1.3",razon:"Liviano, economico, cumple termica y acustica en zonas A-H."},{cod:"1.2.M.B16.1",razon:"Albanileria + PU TIFF. Optimo en zonas frias. Alta masa para acustica."},{cod:"1.2.M.F2.3",razon:"Panel Monoplac PMO-110. Rapido montaje."}],techumbres:[{cod:"1.1.M.B4.1.1",razon:"Losa PLN-120 (U=0.51). Estandar residencial zonas A-E."},{cod:"1.1.M.B4.1.2",razon:"Losa PLN-150 (U=0.44). Para zonas A-F."}],pisos:[{cod:"1.4.M.A1.1",razon:"Losa H.A. + EPS 60mm inferior."}],tabiques:[]},
  Educacion:{desc:"Prioridad: RF F60+ en estructura, acustica entre aulas min 40 dB.",muros:[{cod:"1.2.M.A25.1",razon:"H.A. 15cm + PU TIFF (LOSCAT 1.2.M.A25.1). RF F90, Rw 52 dB. Optimo para muros perimetrales."},{cod:"1.2.M.A23.1",razon:"H.A. 10cm + PROSOL SATE (LOSCAT 1.2.M.A23.1). RF F90."},{cod:"1.2.M.D2.2",razon:"HCA 200mm + EPS SATE 60mm. RF F180, U=0.31. Liviano, buena termica, incombustible."}],techumbres:[{cod:"1.1.M.B4.1.2",razon:"Losa PLN-150 (LOSCAT 1.1.M.B4.1.2). RF F60."},{cod:"1.3.M.A6.1",razon:"Losa H.A. 12cm + SATE inferior."}],pisos:[{cod:"1.4.M.A1.1",razon:"Losa H.A. + EPS 60mm."},{cod:"1.4.M.A1.2",razon:"Losa H.A. + EPS 80mm. Para zonas E-H."},{cod:"1.4.M.B1.2",razon:"Radier + EPS 60mm bajo losa. Para primer piso sobre terreno."}],tabiques:[{cod:"1.2.T.A1.2",razon:"Doble yeso carton + lana mineral 100mm. Rw 48 dB."},{cod:"1.2.T.B1.1",razon:"Albanileria ceramica 14cm. Rw 47 dB, RF F90."}]},
  Salud:{desc:"Maxima exigencia: RF F90+ estructura, acustica min 50 dB.",muros:[{cod:"1.2.M.A25.1",razon:"H.A. 15cm + PU TIFF (LOSCAT 1.2.M.A25.1). RF F90, Rw 52 dB."},{cod:"1.2.M.B16.1",razon:"Albanileria + PU TIFF (LOSCAT 1.2.M.B16.1). RF F90, Rw 50 dB."},{cod:"1.2.M.D2.3",razon:"HCA 200mm + LM SATE 80mm. RF F180, U=0.27. Incombustible, alta eficiencia."}],techumbres:[{cod:"1.1.M.B4.1.2",razon:"Losa PLN-150 (LOSCAT 1.1.M.B4.1.2). RF F60."}],pisos:[{cod:"1.4.M.A1.2",razon:"Losa H.A. + EPS 80mm."},{cod:"1.4.M.B1.3",razon:"Radier + XPS 80mm bajo losa. U=0.28, todas las zonas."}],tabiques:[{cod:"1.2.T.C1.1",razon:"H.A. 150mm. RF F120, Rw 52 dB. Quirofanos, UCI."},{cod:"1.2.T.A1.2",razon:"Doble yeso carton + lana mineral 100mm. Consultorios."}]},
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
// Presión de saturación del vapor de agua [Pa] según ISO 13788 / NCh853.
// La norma exige cambiar de coeficientes sobre AGUA a sobre HIELO bajo 0°C.
// Importante para zonas frías chilenas (F, G, H, I con Te de −1 a −6°C):
// sobre hielo la psat es ~5-6% menor a −6°C → detección de condensación más
// conservadora (correcta) en la cara fría. Para T≥0 el resultado es idéntico
// al de antes (no hay regresión en el caso común).
export const satP=T=> T>=0
  ? 610.8*Math.exp(17.27 *T/(T+237.3))   // sobre agua (Magnus) — ISO 13788
  : 610.8*Math.exp(21.875*T/(T+265.5));  // sobre hielo        — ISO 13788 (T<0)
export const dewPoint=(T,HR)=>{const a=17.27,b=237.3,al=(a*T/(b+T))+Math.log(HR/100);return b*al/(a-al);};

// Inversa de satP: dada una presión de saturación [Pa], devuelve la temperatura
// [°C] a la que el agua tiene esa psat. Usado para el criterio de moho (NCh1973
// / ISO 13788): la temperatura superficial mínima a la que el aire interior
// alcanza HR=75% es aquella donde psat(T) = Pv_interior / 0.75.
// Usa la rama sobre agua (el criterio de moho aplica a temperaturas de
// superficie interior, típicamente > 0°C).
export const tempDeSatP=P=>{
  if(!P||P<=0) return -273;
  const ln=Math.log(P/610.8);
  return 237.3*ln/(17.27-ln);
};

// Factor de temperatura superficial fRsi mínimo requerido para evitar MOHO
// (NCh1973:2014 / ISO 13788). φsicr = humedad relativa superficial crítica
// (0.75 = 75% según planilla oficial MINVU; ISO 13788 usa 0.80).
//   Pv_int       = satP(ti)·HRi/100
//   Psat_min     = Pv_int / φsicr   (psat mínima en la superficie interior)
//   Tsi_min      = tempDeSatP(Psat_min)
//   fRsi,min     = (Tsi_min − Te) / (Ti − Te)
// El elemento cumple si fRsi_real (= 1 − RSi/Rtot) ≥ fRsi,min.
export function fRsiMinMoho(ti, te, hri, phiCrit=0.75){
  if((ti-te)<=0) return 0;
  const PvInt   = satP(ti)*hri/100;
  const PsatMin = PvInt/phiCrit;
  const TsiMin  = tempDeSatP(PsatMin);
  return (TsiMin-te)/(ti-te);
}
export const ist={border:"1.5px solid #cbd5e1",borderRadius:6,padding:"5px 8px",fontSize:12,background:"#fff"};
export const colSem=v=>v<=1.5?"#16a34a":v<=2.8?"#d97706":"#dc2626";

// ─── Glaser (NCh853:2021) + ISO 6946:2017 método combinado ───────────────────────
// Para capas con `estructura_integrada` (montantes de madera/acero):
//   · U final = 1/R_T con R_T = (R_upper + R_lower)/2 — valores reales para DOM
//   · Perfil de temperatura usa R_isotermico (planos isotérmicos) — Glaser
//   · Se añade `aviso_puente` y `iso6946` al resultado cuando hay puente térmico
// rseOverride (opcional): para cubierta ventilada (ISO 6946 §6.9.2/6.9.4) — la
// cara que da a la cámara venteada usa Rse = Rsi del flujo (aire quieto). El
// caller debe truncar cv hasta la cámara (excluida) antes de llamar.
export const calcGlaser=(cv,ti,te,hr,elemTipo="muro",rseOverride)=>{
  if(!cv||!cv.length||isNaN(ti)||isNaN(te)||isNaN(hr))return null;
  const rsiKey=elemTipo==="techumbre"?"techo":elemTipo==="piso"?"piso":"muro";
  const rsi=RSI_MAP[rsiKey]||0.13;
  const rse=(typeof rseOverride==="number")?rseOverride:(RSE_MAP[rsiKey]||0.04);

  // R efectivo por capa (planos isotérmicos: mezcla paralela para capa mixta)
  function Reff(c){
    if(c.esCamara||c.camara) return resistenciaCamara(c.esp);  // esp en metros
    if(c.estructura_integrada){
      const eb=c.estructura_integrada;
      const fa=Math.min(Math.max(eb.ancho_mm/eb.distancia_mm,0.01),0.99);
      const Rs=c.esp/eb.lam, Ri=c.esp/c.lam;
      return 1/(fa/Rs+(1-fa)/Ri);
    }
    return c.esp/c.lam;
  }

  // ── R_T con método ISO 6946 combinado (superior+inferior)/2 ──────────────────
  const isoR=calcR_ISO6946_helper(cv,elemTipo,rseOverride);
  const Rtot=isoR.R_T;  // U certificable = 1/Rtot (NCh853/ISO 6946)

  // ── Perfil de temperaturas (usa el modelo de planos isotérmicos) ────────────
  const Rtot_temp=isoR.R_isotermico;
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

  // ── Condensación superficial interior + criterio de MOHO (NCh1973:2014) ──────
  // fRsi real = 1 − RSi/Rtot · Tsi = temperatura de la superficie interior.
  // Dos criterios:
  //   · Condensación: Tsi < Tdew (rocío 100%)  → agua líquida
  //   · Moho:         Tsi < Tsi,min(75%)        → riesgo de hongos/moho
  // El de moho es MÁS estricto (φsicr=75% según planilla MINVU).
  const fRsi      = Rtot>0 ? 1 - rsi/Rtot : 1;
  const TsiInt    = Rtot>0 ? ti - (rsi/Rtot)*(ti-te) : ti;
  const fRsiMin75 = fRsiMinMoho(ti, te, hr, 0.75);
  const TsiMin75  = te + fRsiMin75*(ti-te);
  const condSupInt = TsiInt < Tdew;                 // condensación superficial interior
  const riesgoMoho = TsiInt < TsiMin75 && !condSupInt; // moho (75%) sin llegar a condensar

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
    // Condensación superficial interior + moho (NCh1973:2014)
    fRsi:fRsi.toFixed(3), TsiInt:TsiInt.toFixed(2),
    fRsiMin75:fRsiMin75.toFixed(3), TsiMin75:TsiMin75.toFixed(2),
    condSupInt, riesgoMoho,
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
// Alias semántico para el slot «Revestimiento Exterior» de muros
// (ver comentario junto a CUBIERTAS_TECHUMBRE).
export const REVESTIMIENTOS_EXTERIORES = CAPAS_CIERRE_EXT;
export const CAPAS_CIERRE_INT=[
  {n:"Yeso carton",               lam:0.26, esp:0.013, mu:8,     desc:"13mm · NC 1070"},
  {n:"Enlucido de yeso",          lam:0.58, esp:0.010, mu:6,     desc:"10mm"},
  {n:"Terciado ranurado",         lam:0.13, esp:0.009, mu:50,    desc:"9mm"},
];
const _BHum ={n:"Barrera de humedad (Tyvek/fieltro)", lam:0.23, esp:0.0003, mu:150};
const _BVap ={n:"Barrera de vapor (polietileno)",     lam:0.23, esp:0.0002, mu:9999};

// ── Clasificación constructiva de cada capa ───────────────────────────────────
// Retorna: 'vapor'|'humedad'|'aislante'|'rev_ext'|'rev_int'|'camara'|'estructura'
export function clasificarCapa(c){
  if(c.esCamara||c.camara) return 'camara';
  const n=(c.n||c.mat||'').toLowerCase();
  const lam=parseFloat(c.lam)||1;
  const mu =parseFloat(c.mu) ||1;
  // Cubiertas / revestimientos metálicos exteriores: tienen μ altísimo
  // (≈100000) pero son CUBIERTA / rev_ext, NO barrera de vapor. Constructivamente
  // van al exterior y no protegen al aislante del vapor interior (al contrario,
  // lo trampolinan). Se detectan ANTES del bloque 'vapor' para que no se
  // confundan con una BV. Una BV real es una lámina/film interior.
  // Nota: usamos términos específicos (no 'acero' a secas) para no atrapar
  // perfiles estructurales como "Correa acero" que van en el núcleo, no al
  // exterior. 'acero gal'(vanizado) sí es cladding y se captura abajo.
  const esCubiertaMetalica = n.includes('zinc')||n.includes('aluminio')||
    n.includes('cobre')||n.includes('pv-4')||n.includes('pv-5')||
    n.includes('pv4')||n.includes('pv5');
  if(esCubiertaMetalica) return 'rev_ext';
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

// Tableros / placas sensibles a la intemperie (agua, humedad, UV) que NUNCA
// pueden quedar como capa exterior expuesta, aunque clasificarCapa los rotule
// como 'estructura' (no matchean ninguna regla de revestimiento). NO incluye
// hormigón ni ladrillo: esos sí admiten quedar "a la vista" al exterior y son
// una terminación válida de por sí.
function esSensibleIntemperie(c){
  const n=(c.n||c.mat||'').toLowerCase();
  return /\bosb\b|\bmdf\b|terciad|contrachapad|plywood|aglomerad|fen[oó]lic|tablex/.test(n);
}

// Criterio EXTERIOR (cara fría / intemperie), más estricto que el interior:
// además de aislante/humedad/vapor, tampoco admite revestimientos interiores
// (yeso cartón, enlucido, terciado ranurado) ni tableros sensibles a la
// intemperie (OSB/MDF/terciado). Evita que una corrección automática
// (C4/C5/C5b/C6/C7, que conservan el stack original) deje OSB o yeso cartón
// como terminación exterior expuesta — bug constructivo reportado.
// IMPORTANTE: NO cambia ningún criterio de cálculo (U/Glaser) ni qué material
// de cierre se usa; sólo amplía CUÁNDO validarCierre detecta el cierre faltante.
function debeProtegerseExterior(c){
  if(debeProtegerse(c)) return true;               // aislante/humedad/vapor (criterio previo)
  if(clasificarCapa(c)==='rev_int') return true;   // yeso cartón, enlucido, terciado ranurado
  if(esSensibleIntemperie(c)) return true;         // OSB/MDF/terciado (rotulados 'estructura')
  return false;
}

// Asegura que ningún extremo del complejo quede con capa sin protección
export function validarCierre(cv,tipoElem){
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
  // Exterior: criterio más estricto (intemperie). Además de aislante/humedad/
  // vapor, tampoco admite rev_int (yeso cartón) ni tableros sensibles a la
  // intemperie (OSB/MDF/terciado), que antes quedaban expuestos.
  if(debeProtegerseExterior(ultima)){
    // Techumbre: material de CUBIERTA real (Fibrocemento Gran Onda P7, producto
    // de techumbre chileno), μ=50 bajo → no recrea trampa de vapor.
    // Piso: la terminación es un PAVIMENTO (superficie pisable), NO fibrocemento.
    // El fibrocemento/OSB es base estructural; sobre él va el pavimento. Se usa un
    // pavimento cerámico (aporte térmico despreciable → no infla el U corregido).
    // Muro/tabique: CAPAS_CIERRE_EXT habitual (estuco/revestimiento).
    const ext=tipoElem==='techumbre'
      ? {n:'Fibrocemento Gran Onda (P7)',lam:0.24,esp:0.005,mu:50,_rol:'cierre_ext'}
      : tipoElem==='piso'
      ? {n:'Pavimento (cerámico/porcelanato)',lam:1.30,esp:0.009,mu:200,_rol:'cierre_ext'}
      : {...CAPAS_CIERRE_EXT[0],_rol:'cierre_ext'};
    r=[...r,ext];
  }
  return r;
}

// ─── Coherencia constructiva (no afecta el cálculo U/Glaser) ───────────────────
// Reglas que un constructor o un revisor de eficiencia energética aplicaría.
// Sirven para ordenar las correcciones por pertinencia y anexar advertencias
// explícitas, de modo que ninguna solución propuesta sea indefendible.

// Espesor total de material (excluye cámaras), en metros.
function espesorMaterial(cv){
  if(!cv) return Infinity;
  return cv.filter(c=>!c.esCamara&&!c.camara).reduce((s,c)=>s+(parseFloat(c.esp)||0),0);
}

// sd = espesor de aire equivalente de una capa = μ · espesor[m] (resistencia a
// la difusión de vapor, en metros). Las cámaras se tratan como sd≈0.
function _sdCapa(c){
  if(c.esCamara||c.camara) return 0;
  return (parseFloat(c.mu)||1)*(parseFloat(c.esp)||0);
}

// Tablero estructural de resistencia al vapor media-alta (OSB, MDF,
// contrachapado): NO aislante, NO barrera de vapor explícita (μ<5000), rotulado
// 'estructura'. Cuando queda en zona fría intermedia actúa como trampa de vapor.
function esTableroAltoMu(c){
  const mu=parseFloat(c.mu)||1, lam=parseFloat(c.lam)||1;
  return mu>=50 && mu<5000 && lam>0.05 && clasificarCapa(c)==='estructura';
}

// Riesgo de "trampa de vapor": la regla constructiva es que la resistencia al
// vapor (sd) decrezca del interior cálido al exterior frío. Si la capa de mayor
// sd queda en la mitad EXTERIOR del complejo y hay otra capa de sd notable hacia
// el interior, el vapor que entra queda atrapado entre ambas → un revisor lo
// observaría aunque el Glaser de punto único no marque condensación (caso típico:
// aislante de μ medio puesto al exterior de un OSB).
export function riesgoTrampaVapor(cv){
  const func=(cv||[]).filter(c=>!c.esCamara&&!c.camara);
  if(func.length<3) return false;
  const sd=func.map(_sdCapa);
  let idxMax=0; for(let i=1;i<sd.length;i++) if(sd[i]>sd[idxMax]) idxMax=i;
  const mitad=(func.length-1)/2;
  if(!(idxMax>mitad && sd[idxMax]>=1.5)) return false;   // sd máximo notable en cara fría
  // Capacidad de secado (difusión de Glaser): resistencia al vapor del camino
  // hacia el EXTERIOR (desde el plano de mayor sd) vs hacia el INTERIOR. Si salir
  // al exterior es igual o más difícil que entrar, el vapor se acumula → trampa
  // real. Si el exterior es más abierto, la pared seca → no es trampa.
  const sdInterior=sd.slice(0,idxMax).reduce((a,b)=>a+b,0);
  const sdExterior=sd.slice(idxMax).reduce((a,b)=>a+b,0);
  return sdExterior>=sdInterior;
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

// Detecta si ya existe una barrera de vapor CONSTRUCTIVA (lado caliente del
// aislante). No considera "vapor" a las capas exteriores aunque tengan μ alto
// (PV-4 Zincalum, zinc titanio, aluminio lacado, etc. tienen μ=100000 pero son
// CUBIERTAS, no BV — constructivamente trampolinan el vapor en vez de pararlo).
//
// Sin este chequeo, C5/C5b se saltaban en cubiertas con plancha metálica
// exterior porque `cv.some(vapor)` daba true por la plancha, no por una BV real.
function yaTieneBVInterior(cv){
  const idxAis=cv.findIndex(c=>clasificarCapa(c)==='aislante');
  // Sin aislante: comportamiento conservador (cualquier vapor en cv cuenta)
  if(idxAis<0) return cv.some(c=>clasificarCapa(c)==='vapor');
  // Con aislante: solo vapor en las capas INTERIORES al aislante (idx < idxAis)
  return cv.slice(0,idxAis).some(c=>clasificarCapa(c)==='vapor');
}

// Inserta una capa (típicamente barrera de vapor) JUSTO ANTES del primer
// aislante, garantizando que quede del lado CALIENTE del aislante (cara
// interior). Esto es la regla constructiva correcta para una BV según
// NCh853:2021 — siempre en cara caliente, nunca fría.
//
// Por qué no usamos `insertarTrasRevInt`:
//   · Esa función inserta tras el PRIMER rev_int encontrado en la lista
//   · Si el usuario armó una composición con un yeso cartón al EXTERIOR del
//     aislante (composición válida pero inusual, ej: techumbres con yeso
//     bajo la cubierta metálica), la BV terminaba del lado frío → inútil
//     constructivamente y Glaser seguía detectando condensación → C5 no
//     pasaba la validación → fallback manual innecesario.
//
// Fallbacks (por orden):
//   1. Si hay aislante → insertar inmediatamente ANTES
//   2. Si no hay aislante pero hay rev_int → comportamiento legado (tras rev_int)
//   3. Si no hay ni aislante ni rev_int → al inicio del stack (interior)
function insertarBVAntesAislante(cv,capa){
  const idxAis=cv.findIndex(c=>clasificarCapa(c)==='aislante');
  if(idxAis>=0) return [...cv.slice(0,idxAis),capa,...cv.slice(idxAis)];
  return insertarTrasRevInt(cv,capa);
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
    if(c.esCamara||c.camara)return resistenciaCamara(c.esp);  // esp en metros
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

// ─── Espesores comerciales (mm) de planchas/paneles de aislante ───────────────
// El motor busca el espesor MÍNIMO que cumple; este helper lo lleva al siguiente
// espesor de mercado (hacia arriba, nunca por debajo del que cumple) para que la
// propuesta sea construible con productos reales y no muestre valores raros
// (p.ej. 70/90/110/130 mm). Sobre el máximo de la tabla cae a múltiplos de 10.
export const _ESP_COMERCIAL = [20,30,40,50,60,80,100,120,140,150,160,180,200,240,250];
export function espesorComercial(mm){
  if(!(mm>0)) return mm;
  for(const e of _ESP_COMERCIAL) if(e>=mm) return e;
  return Math.ceil(mm/10)*10;
}

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
//   acá se estrecha el target local (targetAjustado) y se avisa al usuario.
//     · estructura_integrada.tipo === 'acero'  → castigo 30 % (×0.70)
//     · estructura_integrada.tipo === 'madera' → castigo 15 % (×0.85)
//   El umaxTarget mostrado en textos/etiquetas conserva el valor legal
//   original; solo la búsqueda interna usa el penalizado.
export async function generarCorrecciones(cv,ti,te,hr,elemTipo="muro",umaxTarget=null,opts={}){
  if(!cv||!cv.length)return[];

  // ── Detectar puente térmico integrado ────────────────────────────────────────
  // acero  → ×0.80 (castigo 20 %)   ·   madera → ×0.90 (castigo 10 %)
  const estrLayer = cv.find(c => c?.estructura_integrada?.tipo);
  const estrTipo  = estrLayer?.estructura_integrada?.tipo || null;   // 'acero' | 'madera' | null
  const factor    = estrTipo === 'acero'  ? 0.80
                  : estrTipo === 'madera' ? 0.90
                  : 1;
  const targetAjustado = (umaxTarget && factor<1)
                          ? +(umaxTarget * factor).toFixed(3)
                          : umaxTarget;
  const avisoPenalty = factor<1
    ? 'Nota: Se incrementó la exigencia de cálculo para compensar el puente térmico del entramado (ISO 6946).'
    : null;

  const r0=_calcGlaserSimple(cv,ti,te,hr,elemTipo);
  const U0=r0?parseFloat(r0.U):null;
  // Trigger de necesidad: se compara con umaxTarget LEGAL (no el penalizado),
  // para no crear correcciones donde la norma no las exige.
  const necesitaU=!!(umaxTarget&&U0&&U0>umaxTarget);
  const necesitaCond=!!r0?.condInter;
  if(!necesitaU&&!necesitaCond)return[];

  // ── Verificar caché (la key incluye penalty para no colisionar) ─────────────
  const ck=_cacheKey(cv,ti,te,hr,elemTipo,umaxTarget)+'|f='+factor;
  if(_corrCache.has(ck))return _corrCache.get(ck);

  const correcciones=[];
  const idxA=cv.findIndex(c=>clasificarCapa(c)==='aislante');
  const motivoStr=necesitaCond&&necesitaU?'condensación intersticial y U > Umax DS N°15'
    :necesitaCond?'condensación intersticial (Glaser NCh853:2021)'
    :'U = '+U0+' W/m²K > Umax DS N°15 ('+umaxTarget+' W/m²K)';

  // pasa() usa targetAjustado para la búsqueda interna (target estricto).
  function pasa(rN){return rN&&!rN.condInter&&(!targetAjustado||parseFloat(rN.U)<=targetAjustado);}

  // pasaCond() — umbral de U para las estrategias de SOLO condensación
  // (C5/C5b/C7/Cc). Si el proyecto además necesita mejorar U (necesitaU), usa el
  // target penalizado (estricto, igual que pasa). Pero si U ya cumple y el único
  // problema es la condensación, basta con NO superar el U máximo LEGAL: así no
  // se descartan las soluciones eficientes (barrera de vapor, reordenar) solo
  // porque el castigo por puente térmico de madera baja artificialmente el
  // target. Causa raíz del sobredimensionamiento detectado en 1.2.G.C1.3.
  const uGateCond = necesitaU ? targetAjustado : umaxTarget;
  function pasaCond(rN){return rN&&!rN.condInter&&(!uGateCond||parseFloat(rN.U||99)<=uGateCond);}

  // Helper: concatena el aviso de penalty al final de advertencias si aplica.
  const withPenaltyAviso = arr => avisoPenalty ? [...arr, avisoPenalty] : arr;

  // ── C1 — Sistema EIFS/SATE ────────────────────────────────────────────────────
  await _YIELD();          // cede el hilo → UI puede pintar el spinner
  if(elemTipo==='muro'||elemTipo==='tabique'){
    for(const alt of AISLS){
      await _YIELD();      // yield entre alternativas de aislante
      const cvBase=cv.filter(c=>clasificarCapa(c)!=='rev_ext');
      let esp=await _findMinEsp(30,180,e=>{
        const cvN=validarCierre([...cvBase,{n:alt.n,lam:alt.lam,esp:e/1000,mu:alt.mu},{n:'Estuco cemento',lam:0.87,esp:0.015,mu:15}],elemTipo);
        return pasa(_calcGlaserSimple(cvN,ti,te,hr,elemTipo));
      });
      if(esp!==null){
        esp=espesorComercial(esp);
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

  // ── C2 — Fachada Ventilada (solo elementos verticales: muro / tabique) ──────
  // No tiene sentido constructivo en piso ni techo: la fachada ventilada es una
  // técnica de envolvente vertical con cámara entre aislante y revestimiento.
  await _YIELD();
  if(elemTipo==='muro'||elemTipo==='tabique'){
    for(const alt of AISLS){
      await _YIELD();
      const cvBase=cv.filter(c=>clasificarCapa(c)!=='rev_ext'&&clasificarCapa(c)!=='humedad');
      const tyvek={..._BHum},camara={esCamara:true},fib={n:'Fibrocemento',lam:0.23,esp:0.006,mu:50};
      let esp=await _findMinEsp(40,180,e=>{
        const cvN=validarCierre([...cvBase,{n:alt.n,lam:alt.lam,esp:e/1000,mu:alt.mu},tyvek,camara,fib],elemTipo);
        return pasa(_calcGlaserSimple(cvN,ti,te,hr,elemTipo));
      });
      if(esp!==null){
        esp=espesorComercial(esp);
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

  // ── C3 — Trasdosado Interior (solo elementos verticales: muro / tabique) ────
  // El trasdosado interior con yeso cartón + barrera de vapor + aislante es una
  // intervención típica de envolvente vertical, no aplica a piso ni techo
  // (donde la solución equivalente sería un falso cielo o piso flotante,
  // con materiales y montaje distintos).
  await _YIELD();
  if((necesitaCond||necesitaU) && (elemTipo==='muro'||elemTipo==='tabique')){
    for(const alt of AISLS){
      await _YIELD();
      const cvBase=cv.filter(c=>clasificarCapa(c)!=='rev_int'&&clasificarCapa(c)!=='vapor');
      const yc={...CAPAS_CIERRE_INT[0]},bv={..._BVap};
      let esp=await _findMinEsp(30,100,e=>{
        const cvN=validarCierre([yc,bv,{n:alt.n,lam:alt.lam,esp:e/1000,mu:alt.mu},...cvBase],elemTipo);
        return pasa(_calcGlaserSimple(cvN,ti,te,hr,elemTipo));
      });
      if(esp!==null){
        esp=espesorComercial(esp);
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
    let extra=await _findMinEsp(10,500,e=>{
      const cvN=cv.map((c,i)=>i===idxA?{...c,esp:c.esp+e/1000}:c);
      const rN=_calcGlaserSimple(validarCierre(cvN,elemTipo),ti,te,hr,elemTipo);
      return rN&&!rN.condInter&&(!targetAjustado||parseFloat(rN.U||99)<=targetAjustado);
    });
    if(extra!==null){
      const _espOrigMm=Math.round(cv[idxA].esp*1000);
      extra=espesorComercial(_espOrigMm+extra)-_espOrigMm;   // espesor final → comercial
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
  // Usa insertarBVAntesAislante (no insertarTrasRevInt) para garantizar que la
  // BV quede del lado CALIENTE del aislante, sin importar dónde el usuario haya
  // puesto el revestimiento interior. Caso reportado 2026-05-27: composición
  // cubierta con yeso cartón al exterior del aislante → BV caía mal posicionada
  // → C5 fallaba la validación y caía a fallback manual C8.
  await _YIELD();
  if(necesitaCond&&!yaTieneBVInterior(cv)){
    const cvCerrado=validarCierre(insertarBVAntesAislante(cv,{..._BVap}),elemTipo);
    const rN=_calcGlaserSimple(cvCerrado,ti,te,hr,elemTipo);
    if(pasaCond(rN)){
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

  // ── C5b — Barrera de vapor + Cubierta ventilada (BV + cámara ventilada) ─────
  // Aplica SOLO si C5 sola no logró eliminar la condensación. Caso típico:
  // cubierta con revestimiento exterior de alto μ (OSB 20mm, fibrocemento
  // grueso, etc.) que bloquea la salida del vapor restante incluso con BV en
  // cara caliente → vapor se acumula en la interfaz aislante-revestimiento.
  //
  // Solución constructiva (ISO 6946 §6.9.2 + NCh853:2021):
  //   1) BV en cara caliente del aislante
  //   2) Cámara ventilada (>=30mm) entre aislante y revestimiento exterior
  //      con aberturas en alero y coronamiento.
  //
  // Por qué solo para techumbre: la cámara ventilada exterior es práctica común
  // en cubiertas (rain screen, espacios bajo teja, etc.). En muros existe pero
  // ya está cubierta por C2 (Fachada Ventilada).
  //
  // Modelo Glaser (ISO 6946 §6.9.2): en cubierta con cámara ventilada las
  // capas SOBRE la cámara están a condiciones exteriores y NO contribuyen al
  // cálculo higrotérmico. Por eso truncamos cv hasta el aislante inclusive
  // para la simulación, mientras que capasCorregidas (lo que se aplica al UI)
  // incluye BV + cámara + capas exteriores originales.
  await _YIELD();
  const c5_aplicado = correcciones.some(c => c.id === 'c5_barrera_vapor');
  if (necesitaCond && !c5_aplicado &&
      !yaTieneBVInterior(cv) &&
      (elemTipo === 'techumbre' || elemTipo === 'techo')) {
    const idxAis = cv.findIndex(c => clasificarCapa(c) === 'aislante');
    // Solo intentar si hay aislante Y al menos una capa al exterior del aislante
    // (sino la cámara no tendría sentido — no hay nada que cubra).
    if (idxAis >= 0 && idxAis < cv.length - 1) {
      // Stack visual (capasCorregidas): cv original + BV antes aislante + cámara después
      const cvConBV = insertarBVAntesAislante(cv, {..._BVap});
      const idxAisBV = cvConBV.findIndex(c => clasificarCapa(c) === 'aislante');
      const camaraVent = { esCamara: true, n: 'Cámara ventilada (≥30mm)', esp: 0.030, camaraVentilada: true };
      // Si YA existe una cámara tras el aislante, no agregar otra (evita cámara
      // doble): solo se inserta la BV. Reportado por usuario 2026-05-27.
      const yaHayCamara = cvConBV.slice(idxAisBV + 1).some(c => c.esCamara || c.camara);
      const cvVisual = yaHayCamara
        ? validarCierre(cvConBV, elemTipo)
        : validarCierre(
            [...cvConBV.slice(0, idxAisBV + 1), camaraVent, ...cvConBV.slice(idxAisBV + 1)],
            elemTipo
          );
      // Stack para Glaser (truncado): solo capas hasta el aislante inclusive,
      // simulando que la cámara venteada deja las capas posteriores a condiciones
      // exteriores (ISO 6946 §6.9.2). No usamos validarCierre acá porque en una
      // cubierta ventilada el aislante es la última capa térmicamente significativa
      // — la cámara venteada actúa de "exterior" y no necesita un cierre adicional
      // que falsearía Pvsat en la interfaz con la cámara.
      const cvTruncado = [...cvConBV.slice(0, idxAisBV + 1)];
      const rN = _calcGlaserSimple(cvTruncado, ti, te, hr, elemTipo);
      if (pasaCond(rN)) {
        correcciones.push({
          id: 'c5b_bv_camara_ventilada',
          titulo: 'C5b — Barrera de vapor + Cubierta ventilada (cámara tras aislante)',
          etiqueta: 'BV + Cámara',
          sistema: 'BV + Cámara ventilada',
          color: '#0369a1',
          compatible_loscat: false,
          descripcion: 'Solución combinada para cubiertas con condensación intersticial donde la barrera de vapor sola no basta (típicamente por revestimiento exterior de alto μ como OSB o fibrocemento grueso que bloquea la salida del vapor restante). Combina: 1) Barrera de vapor de polietileno (μ=9999, 0.2mm) en cara caliente, antes del aislante. 2) Cámara ventilada (≥30mm) tras el aislante con aberturas continuas en alero y coronamiento. Según ISO 6946 §6.9.2, en cubierta ventilada las capas sobre la cámara no contribuyen al cálculo higrotérmico.',
          cambio: '+ Barrera vapor PE (cara caliente) + Cámara ventilada 30mm tras aislante',
          capasCorregidas: cvVisual,
          resultado: rN,
          impactoU: 'U ' + rN.U + ' W/m²K' + (umaxTarget && parseFloat(rN.U) <= umaxTarget ? ' ✓' : ''),
          advertencias: withPenaltyAviso([
            '⚠ IMPORTANTE: tras aplicar, marca el checkbox "Cubierta ventilada" en la calculadora para que el modelo Glaser ignore correctamente las capas sobre la cámara (ISO 6946 §6.9.2).',
            'La cámara debe tener aberturas continuas en alero y coronamiento (entrada y salida de aire por convección).',
            'El sellado perimetral de la barrera de vapor en penetraciones es obligatorio (OGUC Art. 4.1.10).',
            'NCh853:2021 §6.9.2 / ASHRAE 160',
          ])
        });
      }
    }
  }

  // ── Cc — Barrera de vapor + tablero estructural de alto μ a cara caliente ───
  // Para entramados ligeros con un tablero de resistencia al vapor media-alta
  // (OSB/MDF/contrachapado) en posición fría intermedia, donde actúa como
  // trampa de vapor. La solución constructiva correcta lo lleva a la cara
  // caliente con la barrera de vapor por dentro y el aislante hacia el exterior:
  // es la corrección de MÍNIMA INTERVENCIÓN (conserva materiales y espesor, solo
  // agrega la lámina de BV). No aplica con estructura pesada (hormigón/ladrillo)
  // ni en techumbre, donde el orden constructivo es rígido (cubierta arriba).
  await _YIELD();
  if(necesitaCond && (elemTipo==='muro'||elemTipo==='tabique') && !yaTieneBVInterior(cv)){
    const tableros  = cv.filter(esTableroAltoMu);
    const aislantes = cv.filter(c=>clasificarCapa(c)==='aislante');
    const hayEstrPesada = cv.some(c=>clasificarCapa(c)==='estructura' && (parseFloat(c.lam)||1)>0.05 && !esTableroAltoMu(c));
    if(tableros.length && aislantes.length && !hayEstrPesada){
      const revInt = cv.filter(c=>clasificarCapa(c)==='rev_int');
      const revExt = cv.filter(c=>clasificarCapa(c)==='rev_ext');
      const baseInt = revInt.length ? revInt : [{...CAPAS_CIERRE_INT[0]}];
      const cvCc = validarCierre([...baseInt,{..._BVap},...tableros,...aislantes,...revExt],elemTipo);
      const rCc = _calcGlaserSimple(cvCc,ti,te,hr,elemTipo);
      // Solo proponer si elimina la condensación y el orden quedó distinto al original.
      const ordenOrig = cv.filter(c=>!c.esCamara).map(c=>c.n||c.mat).join('|');
      const ordenNuevo = cvCc.filter(c=>!c.esCamara).map(c=>c.n||c.mat).join('|');
      if(pasaCond(rCc) && ordenNuevo!==ordenOrig){
        const ordenTxt = cvCc.filter(c=>!c.esCamara&&!c.camara).map(c=>c.n||c.mat).join(' → ')
        correcciones.push({
          id:'cc_bv_reubicar_tablero',
          titulo:'Cc — Barrera de vapor + tablero estructural a cara caliente',
          etiqueta:'BV + Reubicar',sistema:'BV + Reordenamiento',color:'#6d28d9',compatible_loscat:true,
          descripcion:'Solución de mínima intervención para entramados con tablero de alta resistencia al vapor (OSB/MDF/contrachapado) en posición fría intermedia, donde actúa como trampa de vapor. Combina: 1) llevar el tablero a la cara caliente (interior); 2) barrera de vapor de polietileno (μ=9999) por dentro del tablero; 3) el aislante hacia el exterior. Conserva los mismos materiales y espesor del proyecto — solo cambia la secuencia y agrega la lámina de barrera de vapor. Posición correcta según NCh853:2021: máxima resistencia al vapor en la cara caliente.',
          cambio:'Nueva secuencia int → ext: '+ordenTxt+' (+ barrera de vapor interior)',
          capasCorregidas:cvCc,resultado:rCc,
          impactoU:'U '+rCc.U+' W/m²K'+(umaxTarget&&parseFloat(rCc.U)<=umaxTarget?' ✓':''),
          advertencias:withPenaltyAviso([
            '⚠ Verificar factibilidad estructural: el tablero (OSB/contrachapado) suele cumplir rol de arriostramiento; esta propuesta asume que puede ubicarse en la cara interior del entramado.',
            'La barrera de vapor debe sellarse en perímetro y penetraciones para garantizar continuidad (OGUC Art. 4.1.10).',
            'Mínima intervención: conserva los materiales y el espesor del proyecto original.'])});
      }
    }
  }

  // ── Ca — Solución de aislación dimensionada (techumbre y piso) ──────────────
  // C1/C2/C3 agregan/dimensionan aislante pero son EXCLUSIVAS de muro. Para
  // techumbre y piso SIN aislante (o con aislante insuficiente que además
  // condensa por una capa exterior de alto μ) no existía ninguna estrategia que
  // los resolviera → el motor caía a sugerencias manuales (C8). Esta construye el
  // complejo correcto desde la cara caliente: revestimiento interior + barrera de
  // vapor (si condensa) + aislante dimensionado + capas exteriores. Y si la
  // cubierta tiene una capa exterior de alto μ, activa cámara ventilada (ISO 6946
  // §6.9.2) y dimensiona evaluando el stack truncado en el aislante.
  await _YIELD();
  const _esTechoPiso = elemTipo==='techumbre'||elemTipo==='techo'||elemTipo==='piso';
  if((necesitaU||necesitaCond) && _esTechoPiso && (idxA<0||necesitaCond)){
    const revInt = cv.filter(c=>clasificarCapa(c)==='rev_int');
    const exteriores = cv.filter(c=>{const t=clasificarCapa(c);return t!=='rev_int'&&t!=='aislante'&&t!=='vapor'&&t!=='camara';});
    const baseInt = revInt.length?revInt:[{...CAPAS_CIERRE_INT[0]}];
    const esTecho = elemTipo==='techumbre'||elemTipo==='techo';
    const extAltoMu = esTecho && exteriores.some(c=>(parseFloat(c.mu)||1)>=50);
    const capasBV = necesitaCond ? [{..._BVap}] : [];
    const camaraVent = {esCamara:true,n:'Cámara ventilada (≥30mm)',esp:0.030,camaraVentilada:true};
    // existente primero (no cambiar material si no hace falta), luego alternativas
    const existente = idxA>=0 ? [{n:cv[idxA].n||cv[idxA].mat,lam:parseFloat(cv[idxA].lam),mu:parseFloat(cv[idxA].mu)||1}] : [];
    const candidatos = [...existente,...AISLS];
    const construir = (cand,e)=>{
      const ais={n:cand.n,lam:cand.lam,esp:e/1000,mu:cand.mu};
      if(elemTipo==='piso'){
        // Piso: el aislante va hacia la cara fría (bajo las capas existentes) y la
        // barrera de vapor sobre el aislante (su cara caliente) si hay condensación.
        // NO se reordenan las capas del piso (la cara interior es la pisable).
        const v=validarCierre([...cv,...capasBV,ais],elemTipo);
        return {visual:v,evalT:v};
      }
      if(extAltoMu){
        const visual=validarCierre([...baseInt,...capasBV,ais,camaraVent,...exteriores],elemTipo);
        return {visual,evalT:[...baseInt,...capasBV,ais]};   // truncado en el aislante (ISO 6946 §6.9.2)
      }
      const v=validarCierre([...baseInt,...capasBV,ais,...exteriores],elemTipo);
      return {visual:v,evalT:v};
    };
    let elegido=null;
    for(const cand of candidatos){
      await _YIELD();
      const espM=await _findMinEsp(40,300,e=>pasa(_calcGlaserSimple(construir(cand,e).evalT,ti,te,hr,elemTipo)));
      if(espM!==null){ elegido={cand,esp:espesorComercial(espM)}; break; }
    }
    if(elegido){
      const {visual,evalT}=construir(elegido.cand,elegido.esp);
      const rN=_calcGlaserSimple(evalT,ti,te,hr,elemTipo);
      const espMm=elegido.esp;
      const dondeTxt = elemTipo==='piso'
        ? 'en la cara inferior, bajo el radier/contrapiso'
        : 'sobre el cielo interior'+(extAltoMu?', con cámara ventilada bajo la cubierta':'');
      correcciones.push({
        id:'ca_aislacion_'+elegido.cand.n.replace(/\s/g,'_'),
        titulo:'Ca — Aislación '+espMm+'mm '+elegido.cand.n+(extAltoMu?' + cámara ventilada':'')+(idxA<0?'':' (redimensionada)'),
        etiqueta:'+Aislación',sistema:'Aislación',color:'#166534',compatible_loscat:false,
        descripcion:'Para cumplir '+motivoStr+', se incorpora '+espMm+'mm de '+elegido.cand.n+' (λ='+elegido.cand.lam+' W/mK) '+dondeTxt+(capasBV.length?', con barrera de vapor en la cara caliente para el control higrotérmico':'')+'.'+(extAltoMu?' La cámara ventilada deja las capas exteriores a condiciones exteriores (ISO 6946 §6.9.2), evitando la trampa de vapor de la capa de alto μ.':''),
        cambio:'+ '+espMm+'mm '+elegido.cand.n+(capasBV.length?' + barrera de vapor':'')+(extAltoMu?' + cámara ventilada':''),
        capasCorregidas:visual,resultado:rN,
        impactoU:'U '+rN.U+' W/m²K ✓'+(umaxTarget?' ≤'+umaxTarget:''),
        advertencias:withPenaltyAviso([
          extAltoMu?'⚠ Marca el checkbox "Cubierta ventilada" en la calculadora para que el modelo Glaser ignore correctamente las capas sobre la cámara (ISO 6946 §6.9.2).':(elemTipo==='piso'?'Verificar la altura libre y el encuentro con puertas tras incorporar el aislante.':'Verificar la ventilación del entretecho y el encuentro con elementos contiguos.'),
          ...(capasBV.length?['El sellado perimetral de la barrera de vapor es obligatorio (OGUC Art. 4.1.10).']:[])])});
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
      if(rA&&!rA.condInter&&(!targetAjustado||parseFloat(rA.U)<=targetAjustado)){
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

  // ── C7 — Reordenar capas (μ alto interior, μ bajo exterior) ────────────────
  //   Vapor migra de interior (cálido/húmedo) a exterior (frío/seco). Capas con
  //   alta resistencia al vapor (μ alto) deben estar en la cara caliente (interior)
  //   para bloquear el vapor antes de la zona fría donde podría condensar.
  //   Estrategia: separar aislantes, ordenar el RESTO por μ descendente int→ext,
  //   y mantener el aislante en el centro.
  //
  //   ⚠ RESTRICCIÓN CONSTRUCTIVA: en techumbre/cubierta el orden es rígido
  //   (cubierta exterior obligatoria + cielo interior obligatorio). Reordenar
  //   puede dar resultado matemáticamente correcto pero CONSTRUCTIVAMENTE
  //   IMPOSIBLE (yeso cartón al exterior, OSB al interior expuesto, etc.).
  //   Para techos preferir C5 (barrera vapor) o C3 (trasdosado interior).
  await _YIELD();
  if(necesitaCond && elemTipo !== 'techumbre' && elemTipo !== 'techo'){
    // Solo intentar si la composición tiene materiales con diferencias significativas de μ
    const noCamaras = cv.filter(c => !c.esCamara && !c.camara);
    const mus = noCamaras.map(c => parseFloat(c.mu) || 1);
    const muMax = Math.max(...mus), muMin = Math.min(...mus);
    if (muMax >= muMin * 5) {  // diferencia significativa (factor 5x)
      // Separar aislantes (λ ≤ 0.05) del resto
      const aislantes = noCamaras.filter(c => (parseFloat(c.lam) || 0) <= 0.05);
      const otros = noCamaras.filter(c => (parseFloat(c.lam) || 0) > 0.05);
      // Ordenar "otros" por μ descendente (int → ext)
      const otrosOrdenados = [...otros].sort((a, b) => (parseFloat(b.mu) || 1) - (parseFloat(a.mu) || 1));
      // Estrategia: μ-alto interior + aislantes + μ-bajo exterior
      // Tomar el primero (μ más alto) al interior, el resto al exterior tras aislantes
      let cvReord;
      if (otrosOrdenados.length >= 2) {
        const interior = [otrosOrdenados[0]];
        const exterior = otrosOrdenados.slice(1).reverse();  // bajo μ al exterior
        cvReord = [...interior, ...aislantes, ...exterior];
      } else {
        // Solo un material no-aislante: ponerlo al interior con aislante atrás
        cvReord = [...otrosOrdenados, ...aislantes];
      }
      const cvCerrado = validarCierre(cvReord, elemTipo);
      const rR = _calcGlaserSimple(cvCerrado, ti, te, hr, elemTipo);
      if (pasaCond(rR)) {
        const orden = cvCerrado.filter(c => !c.esCamara && !c.camara)
          .map(c => (c.n || c.mat || '')).join(' → ');
        correcciones.push({
          id: 'c7_reordenar',
          titulo: 'C7 — Reordenar capas (μ-alto interior → μ-bajo exterior)',
          etiqueta: 'Reordenar',
          sistema: 'Reordenamiento',
          color: '#7c2d12',
          compatible_loscat: true,
          descripcion: 'Reordenar las capas existentes para colocar los materiales de alta resistencia al vapor (μ alto) en la cara interior caliente, donde bloquean el vapor antes de alcanzar la zona fría. Los aislantes se mantienen en el centro. NO se agregan ni quitan materiales — solo se reordena la secuencia constructiva.',
          cambio: 'Nueva secuencia int → ext: ' + orden,
          capasCorregidas: cvCerrado,
          resultado: rR,
          impactoU: 'U ' + rR.U + ' W/m²K ✓' + (umaxTarget ? ' ≤' + umaxTarget : ''),
          advertencias: withPenaltyAviso([
            'Verificar que el reordenamiento sea constructivamente factible (capas estructurales vs revestimientos)',
            'La solución es homologable a la LOSCAT original ya que conserva los mismos materiales',
          ])
        });
      }
    }
  }

  // ── C8 — FALLBACK: Sugerencias manuales informativas ──────────────────────
  //   Cuando ninguna estrategia automática logra eliminar la condensación o
  //   cumplir U (caso de climas extremos como Te ≤ 0°C con HR alta), generamos
  //   sugerencias informativas para que el arquitecto evalúe.
  await _YIELD();
  if (correcciones.length === 0 && (necesitaCond || necesitaU)) {
    // Análisis del problema actual
    const noCamaras = cv.filter(c => !c.esCamara && !c.camara);
    const mus = noCamaras.map(c => parseFloat(c.mu) || 1);
    const muMax = Math.max(...mus);
    const muMin = Math.min(...mus);
    const aislantes = noCamaras.filter(c => (parseFloat(c.lam) || 0) <= 0.05);
    const espesorAislante = aislantes.reduce((s, c) => s + (parseFloat(c.esp) * 1000 || 0), 0);

    // Sugerencia 1: si hay capa con μ muy alto al exterior, sugerir invertir
    //
    // ⚠ RESTRICCIÓN CONSTRUCTIVA (misma que C7): en techumbre/cubierta el
    // orden es rígido — la cubierta exterior (PV-4 Zincalum, teja, panel
    // sándwich, etc.) NO puede moverse al interior porque deja la estructura
    // expuesta a la lluvia. Para techumbres preferir las otras sugerencias
    // C8 (aumentar aislante, cámara ventilada, control HR) o C5 (barrera
    // vapor) que SÍ son constructivamente válidas.
    if (muMax >= muMin * 10 && elemTipo !== 'techumbre' && elemTipo !== 'techo') {
      const capaAlta = noCamaras.find(c => (parseFloat(c.mu) || 1) === muMax);
      const idxAlta = cv.findIndex(c => c === capaAlta);
      // Capa está en mitad exterior si idx >= n/2 (centrado al medio)
      const esExterior = idxAlta >= Math.floor(cv.length / 2);
      if (esExterior) {
        correcciones.push({
          id: 'c8_manual_invertir_mu',
          titulo: `C8 — Mover ${capaAlta?.n || capaAlta?.mat || 'capa de alto μ'} al interior`,
          etiqueta: 'Manual',
          sistema: 'Reordenamiento',
          color: '#7c2d12',
          compatible_loscat: true,
          descripcion: `La capa "${capaAlta?.n || capaAlta?.mat}" tiene resistencia al vapor alta (μ=${muMax}) y está al exterior. Esto BLOQUEA la salida del vapor desde el interior, acumulándolo en la zona fría y produciendo condensación. Recomendación: usar las flechas ↑↓ para mover esta capa hacia el interior (cara caliente), donde su alta resistencia al vapor protege contra la entrada al núcleo aislante.`,
          cambio: `Mover ${capaAlta?.n || capaAlta?.mat} desde exterior → interior`,
          capasCorregidas: null,  // Manual — no aplica automáticamente
          resultado: null,
          impactoU: 'Sin cambio en U — solo reordenamiento',
          advertencias: withPenaltyAviso([
            'Esta es una recomendación MANUAL: usa las flechas ↑↓ en la tabla de capas para reordenar',
            'Asegurarse que el nuevo orden sea constructivamente factible',
            'Tras reordenar, presiona "Calcular U" para verificar',
          ]),
          esManual: true,
        });
      }
    }

    // Sugerencia 2: si hay aislante pero poco espesor (<150mm)
    if (aislantes.length > 0 && espesorAislante < 150 && (necesitaU || necesitaCond)) {
      correcciones.push({
        id: 'c8_manual_aumentar_aislante',
        titulo: `C8 — Aumentar espesor de aislante (actual: ${espesorAislante.toFixed(0)}mm)`,
        etiqueta: 'Manual',
        sistema: 'Aumento aislante',
        color: '#b45309',
        compatible_loscat: true,
        descripcion: `El espesor total de aislante térmico (${espesorAislante.toFixed(0)}mm) es insuficiente para las condiciones (Ti=${ti}°C, Te=${te}°C, HR=${hr}%). Recomendación: aumentar el aislante a 180-200mm o más, lo que reduce U y desplaza el punto de rocío fuera de la envolvente.`,
        cambio: `Aumentar aislante a 180-200mm`,
        capasCorregidas: null,
        resultado: null,
        impactoU: 'Reduce U y mejora condensación',
        advertencias: withPenaltyAviso([
          'Recomendación MANUAL: edita el campo "Espesor (mm)" del aislante en la tabla',
          'Tras editar, presiona "Calcular U" para verificar',
        ]),
        esManual: true,
      });
    }

    // Sugerencia 3: cámara ventilada (rain screen) — clima frío/húmedo extremo
    if (necesitaCond && parseFloat(te) <= 5) {
      correcciones.push({
        id: 'c8_manual_camara_ventilada',
        titulo: 'C8 — Agregar cámara ventilada exterior (rain screen)',
        etiqueta: 'Manual',
        sistema: 'Cámara ventilada',
        color: '#0369a1',
        compatible_loscat: false,
        descripcion: `Las condiciones climáticas son extremas (Te=${te}°C, HR=${hr}%). Para evitar condensación, se recomienda una cámara ventilada (rain screen) entre el aislante y el revestimiento exterior. Esta cámara permite que la humedad que migra desde el interior se evapore al exterior sin acumularse. NCh853:2021 §6.9.2.`,
        cambio: 'Agregar cámara de aire ventilada (>=20mm) tras el aislante',
        capasCorregidas: null,
        resultado: null,
        impactoU: 'Mejora higrotérmica significativa',
        advertencias: withPenaltyAviso([
          'Recomendación MANUAL: presiona "+ Cámara" y posiciona después del aislante',
          'La cámara debe tener aberturas de ventilación en base y coronamiento',
          'NCh853:2021 §6.9.2 / ASHRAE 160',
        ]),
        esManual: true,
      });
    }

    // Sugerencia 4: reducir HR interior (caso límite)
    if (necesitaCond && parseFloat(hr) >= 70) {
      correcciones.push({
        id: 'c8_manual_reducir_hr',
        titulo: 'C8 — Verificar control de humedad interior',
        etiqueta: 'Manual',
        sistema: 'Control HR',
        color: '#6d28d9',
        compatible_loscat: false,
        descripcion: `La humedad relativa interior asumida (HR=${hr}%) es alta y dificulta el cumplimiento higrotérmico. En la práctica, los recintos habitacionales operan con HR=50-60%. Si el proyecto incluye ventilación mecánica adecuada (NCh3309 / DS47), considera recalcular con HR=60% para verificar cumplimiento bajo condiciones reales de uso.`,
        cambio: 'Considerar HR=60% si hay ventilación mecánica',
        capasCorregidas: null,
        resultado: null,
        impactoU: 'No modifica U',
        advertencias: withPenaltyAviso([
          'Recomendación MANUAL: revisa proyecto de ventilación',
          'La HR=80% asumida es conservadora para uso habitacional con ventilación',
          'DS47 / NCh3309',
        ]),
        esManual: true,
      });
    }
  }

  // ── Coherencia constructiva: marcar compromisos y ordenar por pertinencia ────
  // Todas las propuestas ya cumplen el CÁLCULO (U/Glaser). Acá se evalúan contra
  // reglas que un constructor o un revisor de eficiencia energética aplicaría,
  // para que ninguna solución mostrada sea indefendible:
  //   · Riesgo de trampa de vapor (sd máximo en cara fría) → advertencia + se
  //     posterga en el orden frente a alternativas más limpias.
  //   · Pertinencia = mínima intervención: a igualdad de coherencia, la solución
  //     con menor espesor de material va primero (criterio de eficiencia).
  // No se descarta ninguna (todas son normativamente válidas); solo se anexan
  // advertencias y se reordena para que la más defendible aparezca arriba.
  for(const corr of correcciones){
    if(!corr.capasCorregidas){ corr._espesor=Infinity; continue; }  // manuales C8
    corr._espesor=espesorMaterial(corr.capasCorregidas);
    if(riesgoTrampaVapor(corr.capasCorregidas)){
      // Árbitro mensual (ISO 13788): si la UI inyectó opts.arbitroMensual (con el
      // clima real de la comuna), confirma o EXONERA el riesgo geométrico con el
      // balance anual de acumulación/secado. Sin árbitro → criterio conservador.
      let veredictoMensual=null;
      if(typeof opts.arbitroMensual==='function'){
        try{ veredictoMensual=opts.arbitroMensual(corr.capasCorregidas,elemTipo); }catch{ veredictoMensual=null; }
      }
      if(veredictoMensual==='seca'){
        corr._trampaVapor=false; corr._secaMensual=true;
        corr.advertencias=[
          'ℹ La capa de mayor resistencia al vapor queda hacia la cara fría, pero el análisis mensual (ISO 13788) con el clima de la comuna confirma que el balance anual seca (no acumula). Constructivamente aceptable.',
          ...(corr.advertencias||[])];
      }else{
        corr._trampaVapor=true;
        const citaMensual = veredictoMensual==='acumula'
          ? ' El análisis mensual (ISO 13788) con el clima de la comuna confirma acumulación anual de humedad.'
          : '';
        corr.advertencias=[
          '⚠ Coherencia higrotérmica: la capa de mayor resistencia al vapor queda hacia la cara fría y el secado al exterior es más cerrado que al interior, por lo que el vapor tiende a acumularse.'+citaMensual+' Si hay una alternativa con barrera de vapor en la cara caliente, es preferible.',
          ...(corr.advertencias||[])];
      }
    }
  }
  correcciones.sort((a,b)=>{
    if(!!a.esManual!==!!b.esManual) return a.esManual?1:-1;          // manuales al final
    const ta=a._trampaVapor?1:0, tb=b._trampaVapor?1:0;
    if(ta!==tb) return ta-tb;                                         // sin trampa de vapor primero
    return (a._espesor??Infinity)-(b._espesor??Infinity);            // menor espesor (más eficiente) primero
  });

  // ── Escribir caché (LRU simple: descartar el más antiguo si lleno) ───────────
  if(_corrCache.size>=_MAX_CACHE)_corrCache.delete(_corrCache.keys().next().value);
  _corrCache.set(ck,correcciones);

  return correcciones;
}
