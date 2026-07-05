// ─────────────────────────────────────────────────────────────────────────────
// pda.js — Soluciones constructivas y requisitos de los Planes de Descontaminación
// Atmosférica (PDA) con reacondicionamiento térmico. Datos oficiales MINVU/MMA.
//
// GENERADO por tmp/gen_pda_js.mjs desde las fichas PDF oficiales (docs/PDA/).
// · U, RT y veredicto de condensación son OFICIALES (NCh853 / NCh1973). El U
//   OFICIAL manda para cumplimiento; NO se recalcula.
// · 'capasStruct' [{mat, lam, esp(mm), mu, esCamara}] permite cargar la solución
//   en la calculadora (desglose + Glaser). λ/μ son valores estándar NCh853 (para
//   análisis); la U que calcule la app es REFERENCIAL, no reemplaza a la oficial.
// · Aplicabilidad gatillada por COMUNA: aplica solo si la comuna pertenece al PDA.
// ─────────────────────────────────────────────────────────────────────────────

export const PDA = {
  // requisitos = U-máx (W/m²K) de acondicionamiento térmico de VIVIENDA EXISTENTE
  // (reacondicionamiento) del PDA — que es a lo que apuntan estas fichas. La columna
  // de Vivienda Nueva es más estricta (p.ej. Osorno techo 0.28 / piso 0.39). Fuente:
  // tabla "REQUERIMIENTOS" de las fichas oficiales MINVU. infiltracion_ach = 50 Pa.
  chillan: {
    nombre: 'Chillán – Chillán Viejo', decreto: 'DS N°48/2015 MMA (por confirmar)',
    comunas: ['Chillán', 'Chillán Viejo'],
    requisitos: { muro: 0.45, techo: 0.38, piso: 0.60, puerta: 1.7, ventana: '36%', infiltracion_ach: 8, estanqueidad: 10 },
  },
  coyhaique: {
    nombre: 'Coyhaique', decreto: 'DS N°46/2014 MMA (por confirmar)',
    comunas: ['Coyhaique'],
    requisitos: { muro: 0.35, techo: 0.25, piso: 0.32, puerta: 1.7, ventana: '36%', infiltracion_ach: 4 },
  },
  ohiggins: {
    nombre: "O'Higgins – Valle Central", decreto: 'DS N°1/2021 MMA (vigente 29-03-2023)',
    comunas: ['Mostazal','Graneros','Codegua','Doñihue','Coltauco','Coinco','Olivar','Quinta de Tilcoco','Rengo','Requínoa','Malloa','San Vicente de Tagua Tagua','Rancagua','Machalí','San Fernando','Placilla','Chimbarongo'],
    requisitos: { muro: 0.80, techo: 0.38, piso: 0.60, puerta: 1.7, ventana: '36%', infiltracion_ach: 5 },
  },
  talca_maule: {
    nombre: 'Talca – Maule', decreto: 'DS N°49/2016 MMA',
    comunas: ['Talca', 'Maule'],
    requisitos: { muro: 0.80, techo: 0.38, piso: 0.60, puerta: 1.7, ventana: '36%', infiltracion_ach: 5, estanqueidad: 10 },
  },
  osorno: {
    nombre: 'Osorno', decreto: 'DS N°47/2015 MMA',
    comunas: ['Osorno'],
    requisitos: { muro: 0.40, techo: 0.33, piso: 0.50, puerta: 1.7, ventana: '36%', infiltracion_ach: 5 },
  },
}

export const PDA_SOLUCIONES = [
  {
    "cod": "PDA-CHL-M1",
    "pda": "chillan",
    "elem": "muro",
    "desc": "Muro albañilería EIFS (1)",
    "u": 0.43,
    "rt": 2.31,
    "cond": "sin",
    "capas": "Muro albañilería existente 140mm | Adhesivo EIFS 2mm | Poliestireno expandido d=15 80mm | Estuco elastomérico + malla FV 3mm | Pasta texturizada 2mm",
    "capasStruct": [
      {
        "mat": "Muro albañilería existente",
        "esp": 140,
        "lam": 0.46,
        "mu": 10,
        "esCamara": false
      },
      {
        "mat": "Adhesivo EIFS",
        "esp": 2,
        "lam": 1,
        "mu": 25,
        "esCamara": false
      },
      {
        "mat": "Poliestireno expandido d=15",
        "esp": 80,
        "lam": 0.043,
        "mu": 40,
        "esCamara": false
      },
      {
        "mat": "Estuco elastomérico + malla FV",
        "esp": 3,
        "lam": 1,
        "mu": 25,
        "esCamara": false
      },
      {
        "mat": "Pasta texturizada",
        "esp": 2,
        "lam": 1,
        "mu": 25,
        "esCamara": false
      }
    ],
    "fuente": "Ficha M1 · PDA Chillán–Chillán Viejo · MINVU"
  },
  {
    "cod": "PDA-CHL-M2",
    "pda": "chillan",
    "elem": "muro",
    "desc": "Muro albañilería tabique con poliestireno expandido",
    "u": 0.44,
    "rt": 2.28,
    "cond": "sin",
    "capas": "Muro albañilería existente 140mm | Polietileno (barrera vapor) 0.1mm | Poliestireno expandido d=20 70mm | Cámara de aire 5mm | Placa OSB estructural 11.1mm | Fieltro asfáltico 15 lbs 0.5mm | Tinglado fibrocemento 6mm",
    "capasStruct": [
      {
        "mat": "Muro albañilería existente",
        "esp": 140,
        "lam": 0.46,
        "mu": 10,
        "esCamara": false
      },
      {
        "mat": "Polietileno (barrera vapor)",
        "esp": 0.1,
        "lam": 0.5,
        "mu": 50000,
        "esCamara": false
      },
      {
        "mat": "Poliestireno expandido d=20",
        "esp": 70,
        "lam": 0.04,
        "mu": 60,
        "esCamara": false
      },
      {
        "mat": "Cámara de aire",
        "esp": 5,
        "lam": null,
        "mu": null,
        "esCamara": true
      },
      {
        "mat": "Placa OSB estructural",
        "esp": 11.1,
        "lam": 0.23,
        "mu": 200,
        "esCamara": false
      },
      {
        "mat": "Fieltro asfáltico 15 lbs",
        "esp": 0.5,
        "lam": 0.5,
        "mu": 50000,
        "esCamara": false
      },
      {
        "mat": "Tinglado fibrocemento",
        "esp": 6,
        "lam": 0.23,
        "mu": 50,
        "esCamara": false
      }
    ],
    "fuente": "Ficha M2 · PDA Chillán–Chillán Viejo · MINVU"
  },
  {
    "cod": "PDA-CHL-M3",
    "pda": "chillan",
    "elem": "muro",
    "desc": "Muro albañilería estructura metalica lana fibra vidrio",
    "u": 0.44,
    "rt": 2.27,
    "cond": "sin",
    "capas": "Muro albañilería existente 140mm | Polietileno (barrera vapor) 0.1mm | Lana fibra vidrio d=11 (λ efectivo por perfil acero) 80mm | Cámara de aire 12mm | Placa OSB estructural 11.1mm | Fieltro asfáltico 15 lbs 0.5mm | Tinglado fibrocemento 6mm",
    "capasStruct": [
      {
        "mat": "Muro albañilería existente",
        "esp": 140,
        "lam": 0.46,
        "mu": 10,
        "esCamara": false
      },
      {
        "mat": "Polietileno (barrera vapor)",
        "esp": 0.1,
        "lam": 0.5,
        "mu": 50000,
        "esCamara": false
      },
      {
        "mat": "Lana fibra vidrio d=11 (λ efectivo por perfil acero)",
        "esp": 80,
        "lam": 0.051,
        "mu": 1,
        "esCamara": false
      },
      {
        "mat": "Cámara de aire",
        "esp": 12,
        "lam": null,
        "mu": null,
        "esCamara": true
      },
      {
        "mat": "Placa OSB estructural",
        "esp": 11.1,
        "lam": 0.23,
        "mu": 200,
        "esCamara": false
      },
      {
        "mat": "Fieltro asfáltico 15 lbs",
        "esp": 0.5,
        "lam": 0.5,
        "mu": 50000,
        "esCamara": false
      },
      {
        "mat": "Tinglado fibrocemento",
        "esp": 6,
        "lam": 0.23,
        "mu": 50,
        "esCamara": false
      }
    ],
    "fuente": "Ficha M3 · PDA Chillán–Chillán Viejo · MINVU"
  },
  {
    "cod": "PDA-CHL-M4",
    "pda": "chillan",
    "elem": "muro",
    "desc": "Muro madera EIFS",
    "u": 0.43,
    "rt": 2.3,
    "cond": "sin",
    "capas": "Revestimiento interior existente 10mm | Polietileno (barrera vapor) 0.1mm | Poliestireno expandido d=15 50mm | Cámara de aire 25mm | Placa fibrocemento 8mm | Poliestireno expandido d=15 (EIFS) 30mm | Estuco elastomérico + malla FV 3mm | Pasta texturizada 2mm",
    "capasStruct": [
      {
        "mat": "Revestimiento interior existente",
        "esp": 10,
        "lam": 0.3,
        "mu": 10,
        "esCamara": false
      },
      {
        "mat": "Polietileno (barrera vapor)",
        "esp": 0.1,
        "lam": 0.5,
        "mu": 50000,
        "esCamara": false
      },
      {
        "mat": "Poliestireno expandido d=15",
        "esp": 50,
        "lam": 0.043,
        "mu": 40,
        "esCamara": false
      },
      {
        "mat": "Cámara de aire",
        "esp": 25,
        "lam": null,
        "mu": null,
        "esCamara": true
      },
      {
        "mat": "Placa fibrocemento",
        "esp": 8,
        "lam": 0.23,
        "mu": 50,
        "esCamara": false
      },
      {
        "mat": "Poliestireno expandido d=15 (EIFS)",
        "esp": 30,
        "lam": 0.043,
        "mu": 40,
        "esCamara": false
      },
      {
        "mat": "Estuco elastomérico + malla FV",
        "esp": 3,
        "lam": 1,
        "mu": 25,
        "esCamara": false
      },
      {
        "mat": "Pasta texturizada",
        "esp": 2,
        "lam": 1,
        "mu": 25,
        "esCamara": false
      }
    ],
    "fuente": "Ficha M4 · PDA Chillán–Chillán Viejo · MINVU"
  },
  {
    "cod": "PDA-CHL-M5",
    "pda": "chillan",
    "elem": "muro",
    "desc": "Muro madera poliestireno expandido",
    "u": 0.43,
    "rt": 2.33,
    "cond": "sin",
    "capas": "Revestimiento interior existente 10mm | Polietileno (barrera vapor) 0.1mm | Poliestireno expandido d=15 50mm | Cámara de aire 25mm | Placa fibrocemento 3.5mm | Poliestireno expandido d=15 30mm | Cámara de aire 20mm | Placa OSB 11.1mm | Fieltro asfáltico 15 lbs 0.5mm | Tinglado fibrocemento 6mm",
    "capasStruct": [
      {
        "mat": "Revestimiento interior existente",
        "esp": 10,
        "lam": 0.3,
        "mu": 10,
        "esCamara": false
      },
      {
        "mat": "Polietileno (barrera vapor)",
        "esp": 0.1,
        "lam": 0.5,
        "mu": 50000,
        "esCamara": false
      },
      {
        "mat": "Poliestireno expandido d=15",
        "esp": 50,
        "lam": 0.043,
        "mu": 40,
        "esCamara": false
      },
      {
        "mat": "Cámara de aire",
        "esp": 25,
        "lam": null,
        "mu": null,
        "esCamara": true
      },
      {
        "mat": "Placa fibrocemento",
        "esp": 3.5,
        "lam": 0.23,
        "mu": 50,
        "esCamara": false
      },
      {
        "mat": "Poliestireno expandido d=15",
        "esp": 30,
        "lam": 0.043,
        "mu": 40,
        "esCamara": false
      },
      {
        "mat": "Cámara de aire",
        "esp": 20,
        "lam": null,
        "mu": null,
        "esCamara": true
      },
      {
        "mat": "Placa OSB",
        "esp": 11.1,
        "lam": 0.23,
        "mu": 200,
        "esCamara": false
      },
      {
        "mat": "Fieltro asfáltico 15 lbs",
        "esp": 0.5,
        "lam": 0.5,
        "mu": 50000,
        "esCamara": false
      },
      {
        "mat": "Tinglado fibrocemento",
        "esp": 6,
        "lam": 0.23,
        "mu": 50,
        "esCamara": false
      }
    ],
    "fuente": "Ficha M5 · PDA Chillán–Chillán Viejo · MINVU"
  },
  {
    "cod": "PDA-CHL-M6",
    "pda": "chillan",
    "elem": "muro",
    "desc": "Muro madera lana fibra vidrio",
    "u": 0.43,
    "rt": 2.3,
    "cond": "sin",
    "capas": "Revestimiento interior existente 10mm | Lana fibra vidrio d=11 (papel una cara) 40mm | Cámara de aire 35mm | Placa fibrocemento 3.5mm | Lana fibra vidrio d=11 40mm | Cámara de aire 6.5mm | Placa OSB 11.1mm | Fieltro asfáltico 15 lbs 0.5mm | Tinglado fibrocemento 6mm",
    "capasStruct": [
      {
        "mat": "Revestimiento interior existente",
        "esp": 10,
        "lam": 0.3,
        "mu": 10,
        "esCamara": false
      },
      {
        "mat": "Lana fibra vidrio d=11 (papel una cara)",
        "esp": 40,
        "lam": 0.045,
        "mu": 2,
        "esCamara": false
      },
      {
        "mat": "Cámara de aire",
        "esp": 35,
        "lam": null,
        "mu": null,
        "esCamara": true
      },
      {
        "mat": "Placa fibrocemento",
        "esp": 3.5,
        "lam": 0.23,
        "mu": 50,
        "esCamara": false
      },
      {
        "mat": "Lana fibra vidrio d=11",
        "esp": 40,
        "lam": 0.045,
        "mu": 1,
        "esCamara": false
      },
      {
        "mat": "Cámara de aire",
        "esp": 6.5,
        "lam": null,
        "mu": null,
        "esCamara": true
      },
      {
        "mat": "Placa OSB",
        "esp": 11.1,
        "lam": 0.23,
        "mu": 200,
        "esCamara": false
      },
      {
        "mat": "Fieltro asfáltico 15 lbs",
        "esp": 0.5,
        "lam": 0.5,
        "mu": 50000,
        "esCamara": false
      },
      {
        "mat": "Tinglado fibrocemento",
        "esp": 6,
        "lam": 0.23,
        "mu": 50,
        "esCamara": false
      }
    ],
    "fuente": "Ficha M6 · PDA Chillán–Chillán Viejo · MINVU"
  },
  {
    "cod": "PDA-COY-F10",
    "pda": "coyhaique",
    "elem": "techumbre",
    "desc": "Techumbre con cercha cielo raso y lana de fibra de vidrio",
    "u": 0.23,
    "rt": 4.26,
    "cond": null,
    "capas": "Revestimiento de cielo placa yeso cartón 10mm d=750",
    "capasStruct": null,
    "fuente": "Ficha F10 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-F11",
    "pda": "coyhaique",
    "elem": "techumbre",
    "desc": "Techumbre con cercha cielo raso y fibra de celulosa",
    "u": 0.24,
    "rt": 4.13,
    "cond": null,
    "capas": "Revestimiento de cielo placa yeso cartón 10mm d=750 | Aislación de fibra de celulosa soplada en húmedo 170mm d=22",
    "capasStruct": null,
    "fuente": "Ficha F11 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-F12",
    "pda": "coyhaique",
    "elem": "techumbre",
    "desc": "Tijerales a la vista y cielo inclinado con aislacion mixta",
    "u": 0.23,
    "rt": 4.27,
    "cond": null,
    "capas": "Aislación de poliestireno expandido (contínuo) 70mm d=15 | Revestimiento de cielo placa yeso cartón 10mm d=750",
    "capasStruct": null,
    "fuente": "Ficha F12 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-F13",
    "pda": "coyhaique",
    "elem": "techumbre",
    "desc": "Tijerales a la vista y cielo inclinado doble aislante de poliestireno expandido",
    "u": 0.25,
    "rt": 4.01,
    "cond": null,
    "capas": "Aislación de poliestireno expandido 100mm d=10 | Aislación de poliestireno expandido (contínuo) 70mm d=15 | Revestimiento de cielo placa yeso cartón 10mm d=750",
    "capasStruct": null,
    "fuente": "Ficha F13 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-OH-M1",
    "pda": "ohiggins",
    "elem": "muro",
    "desc": "Muro albañileríae.i.f.s",
    "u": 0.71,
    "rt": 1.41,
    "cond": null,
    "capas": "Poliestireno expandido 40mm d=20 | ESTUCO ELASTOMÉRICO 3mm | ADHESIVO EIFS 2mm",
    "capasStruct": null,
    "fuente": "Ficha M1 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-M2",
    "pda": "ohiggins",
    "elem": "muro",
    "desc": "Muro albañileríatabique con poliestireno expandido",
    "u": 0.74,
    "rt": 1.36,
    "cond": null,
    "capas": "Polietileno 0.1mm | Poliestireno expandido 30mm d=20 | Cámara de aire 20mm | Placa OSB estructural 11.1mm | Tinglado fibrocemento 6mm | PLACA OSB 11.1mm",
    "capasStruct": null,
    "fuente": "Ficha M2 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-M3",
    "pda": "ohiggins",
    "elem": "muro",
    "desc": "Muro albañileríaest. metalica lana fibra de vidrio",
    "u": 0.68,
    "rt": 1.46,
    "cond": null,
    "capas": "Polietileno 0.1mm | Cámara de aire 22mm | Placa OSB estructural 11.1mm | Tinglado fibrocemento 6mm | PLACA OSB 11.1mm | LANA FIBRA DE VIDRIO 40mm d=11 | Tinglado DE FRIBROCEMENTO 6mm",
    "capasStruct": null,
    "fuente": "Ficha M3 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-M4",
    "pda": "ohiggins",
    "elem": "muro",
    "desc": "Muro madera EIFS",
    "u": 0.71,
    "rt": 1.41,
    "cond": "sin",
    "capas": "Polietileno 0.1mm | Poliestireno expandido 20mm d=20 | Placa fibrocemento 8mm | Adhesivo E.I.F.S. 2mm | Cámara de aire 55mm | ESTUCO ELASTOMÉRICO 3mm | RETORNO ADHESIVO EIFS 2mm",
    "capasStruct": null,
    "fuente": "Ficha M4 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-M5",
    "pda": "ohiggins",
    "elem": "muro",
    "desc": "Muro madera poliestireno expandido",
    "u": 0.76,
    "rt": 1.32,
    "cond": "sin",
    "capas": "Polietileno 0.1mm | Poliestireno expandido 40mm d=20 | Tinglado de fibrocemento 6mm | Cámara de aire 75mm | Placa OSB 11.1mm | Cámara de aire 10mm | Tinglado FIBROCEMENTO 6mm | PLACA FIBROCEMENTO 8mm",
    "capasStruct": null,
    "fuente": "Ficha M5 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-M6",
    "pda": "ohiggins",
    "elem": "muro",
    "desc": "Muro madera lana fibra de vidrio",
    "u": 0.7,
    "rt": 1.44,
    "cond": "sin",
    "capas": "Polietileno 0.1mm | Tinglado de fibrocemento 6mm | Cámara de aire 75mm | Placa OSB 11.1mm | Tinglado FIBROCEMENTO 6mm | PLACA FIBROCEMENTO 8mm",
    "capasStruct": null,
    "fuente": "Ficha M6 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-PV1",
    "pda": "ohiggins",
    "elem": "piso",
    "desc": "Piso ventilado lana fibra de vidrio",
    "u": 0.6,
    "rt": null,
    "cond": null,
    "capas": "Placa OSB estructural 11.1mm | Placa fibrocemento 8mm",
    "capasStruct": null,
    "fuente": "Ficha PV1 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-PV2",
    "pda": "ohiggins",
    "elem": "piso",
    "desc": "Piso ventilado poliestireno expandido",
    "u": 0.58,
    "rt": null,
    "cond": null,
    "capas": "Placa OSB estructural 11.1mm | Placa fibrocemento 8mm",
    "capasStruct": null,
    "fuente": "Ficha PV2 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-T1",
    "pda": "ohiggins",
    "elem": "techumbre",
    "desc": "Techumbre cercha lana fibra de vidrio",
    "u": 0.38,
    "rt": null,
    "cond": null,
    "capas": "",
    "capasStruct": null,
    "fuente": "Ficha T1 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-T2",
    "pda": "ohiggins",
    "elem": "techumbre",
    "desc": "Techumbre envigado poliestireno expandido",
    "u": 0.38,
    "rt": null,
    "cond": null,
    "capas": "Polietileno 0.2mm",
    "capasStruct": null,
    "fuente": "Ficha T2 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OS-F1",
    "pda": "osorno",
    "elem": "muro",
    "desc": "Muro de albañilería existente con revestimiento tipo EIFS",
    "u": 0.35,
    "rt": 2.82,
    "cond": null,
    "capas": "Aislación de poliestireno expandido 100mm d=15",
    "capasStruct": null,
    "fuente": "Ficha F1 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F13",
    "pda": "osorno",
    "elem": "techumbre",
    "desc": "Tijerales a la vista y cielo inclinado doble aislante de poliestireno expandido",
    "u": 0.25,
    "rt": 4.01,
    "cond": null,
    "capas": "Aislación de poliestireno expandido 100mm d=10 | Aislación de poliestireno expandido (contínuo) 70mm d=15 | Revestimiento de cielo placa yeso cartón 10mm d=750",
    "capasStruct": null,
    "fuente": "Ficha F13 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F14",
    "pda": "osorno",
    "elem": "piso",
    "desc": "Retiro de piso existente e incorporacion de aislacion doble de EPS",
    "u": 0.41,
    "rt": 2.42,
    "cond": null,
    "capas": "Aislación de poliestireno expandido 50mm d=15",
    "capasStruct": null,
    "fuente": "Ficha F14 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F15",
    "pda": "osorno",
    "elem": "piso",
    "desc": "Incorporacion de aislacion de poliuretano rigido y piso flotante hdf",
    "u": 0.49,
    "rt": 2.02,
    "cond": null,
    "capas": "Aislación poliuretano rígido 20mm d=40",
    "capasStruct": null,
    "fuente": "Ficha F15 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F2",
    "pda": "osorno",
    "elem": "muro",
    "desc": "Muro de albañilería existente con poliestireno expandido",
    "u": 0.35,
    "rt": 2.82,
    "cond": null,
    "capas": "Aislación de poliestireno expandido 100mm d=15",
    "capasStruct": null,
    "fuente": "Ficha F2 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F3",
    "pda": "osorno",
    "elem": "muro",
    "desc": "Muro de albañilería existente con lana de vidrio",
    "u": 0.35,
    "rt": 2.84,
    "cond": null,
    "capas": "",
    "capasStruct": null,
    "fuente": "Ficha F3 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F4",
    "pda": "osorno",
    "elem": "muro",
    "desc": "Muro de hormigon armado existente con sistema EIFS",
    "u": 0.37,
    "rt": 2.74,
    "cond": null,
    "capas": "Muro de hormigón armado 150mm d=2400 | Aislación de poliestireno expandido 100mm d=15",
    "capasStruct": null,
    "fuente": "Ficha F4 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F5",
    "pda": "osorno",
    "elem": "muro",
    "desc": "Muro de hormigon existente con poliestireno expandido y revestimiento tinglado de fibrocemento",
    "u": 0.38,
    "rt": 2.62,
    "cond": null,
    "capas": "Muro de hormigón armado 150mm d=2400 | Aislación de poliestireno expandido 100mm d=10",
    "capasStruct": null,
    "fuente": "Ficha F5 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F6",
    "pda": "osorno",
    "elem": "muro",
    "desc": "Muro de hormigon existente con lana de vidrio y revestimiento tinglado de fibrocemento",
    "u": 0.36,
    "rt": 2.76,
    "cond": null,
    "capas": "Muro de hormigón armado 150mm d=2400",
    "capasStruct": null,
    "fuente": "Ficha F6 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F7",
    "pda": "osorno",
    "elem": "muro",
    "desc": "Tabiqueria de madera con lana de vidrio poliestireno expandido",
    "u": 0.38,
    "rt": 2.63,
    "cond": null,
    "capas": "Revestimiento interior placa yeso cartón 10mm d=750",
    "capasStruct": null,
    "fuente": "Ficha F7 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F8",
    "pda": "osorno",
    "elem": "muro",
    "desc": "Tabiqueria de madera existente con poliestireno expandido poliestireno expandido",
    "u": 0.39,
    "rt": 2.55,
    "cond": null,
    "capas": "Revestimiento interior placa yeso cartón 10mm d=750 | Aislación de poliestireno expandido (int. tabique) 70mm d=10",
    "capasStruct": null,
    "fuente": "Ficha F8 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-F9",
    "pda": "osorno",
    "elem": "muro",
    "desc": "Tabiqueria de madera existente EIFS",
    "u": 0.39,
    "rt": 2.57,
    "cond": null,
    "capas": "Revestimiento interior placa yeso cartón 10mm d=750 | Aislación de poliestireno expandido (int. tabique) 70mm d=10 | Sustrato fibrocemento 6mm d=1135 | Aislación de poliestireno expandido 35mm d=15",
    "capasStruct": null,
    "fuente": "Ficha F9 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-TM-M1",
    "pda": "talca_maule",
    "elem": "muro",
    "desc": "Muro albañilería EIFS",
    "u": 0.71,
    "rt": 1.41,
    "cond": "sin",
    "capas": "Poliestireno expandido 40mm d=20 | ESTUCO ELASTOMÉRICO 3mm | ADHESIVO EIFS 2mm",
    "capasStruct": null,
    "fuente": "Ficha M1 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-M2",
    "pda": "talca_maule",
    "elem": "muro",
    "desc": "Muroalbañilería tabique con poliestireno expandido",
    "u": 0.74,
    "rt": 1.36,
    "cond": "sin",
    "capas": "Polietileno 0.1mm | Poliestireno expandido 30mm d=20 | Cámara de aire 20mm | Placa OSB estructural 11.1mm | Tinglado fibrocemento 6mm | PLACA OSB 11.1mm",
    "capasStruct": null,
    "fuente": "Ficha M2 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-M3",
    "pda": "talca_maule",
    "elem": "muro",
    "desc": "Muro albañilería est metalica lana fibra de vidrio",
    "u": 0.68,
    "rt": 1.46,
    "cond": "sin",
    "capas": "Polietileno 0.1mm | Cámara de aire 22mm | Placa OSB estructural 11.1mm | Tinglado fibrocemento 6mm | PLACA OSB 11.1mm | LANA FIBRA DE VIDRIO 40mm d=11 | Tinglado DE FRIBROCEMENTO 6mm",
    "capasStruct": null,
    "fuente": "Ficha M3 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-M4",
    "pda": "talca_maule",
    "elem": "muro",
    "desc": "Muro madera EIFS",
    "u": 0.71,
    "rt": 1.41,
    "cond": "sin",
    "capas": "Polietileno 0.1mm | Poliestireno expandido 20mm d=20 | Placa fibrocemento 8mm | Adhesivo E.I.F.S. 2mm | Cámara de aire 55mm | ESTUCO ELASTOMÉRICO 3mm | RETORNO ADHESIVO EIFS 2mm",
    "capasStruct": null,
    "fuente": "Ficha M4 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-M5",
    "pda": "talca_maule",
    "elem": "muro",
    "desc": "Muro madera poliestireno expandido",
    "u": 0.76,
    "rt": 1.32,
    "cond": "sin",
    "capas": "Polietileno 0.1mm | Poliestireno expandido 40mm d=20 | Tinglado de fibrocemento 6mm | Cámara de aire 75mm | Placa OSB 11.1mm | Cámara de aire 10mm | Tinglado FIBROCEMENTO 6mm | PLACA FIBROCEMENTO 8mm",
    "capasStruct": null,
    "fuente": "Ficha M5 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-M6",
    "pda": "talca_maule",
    "elem": "muro",
    "desc": "Muro madera lana fibra de vidrio",
    "u": 0.7,
    "rt": 1.44,
    "cond": "sin",
    "capas": "Polietileno 0.1mm | Tinglado de fibrocemento 6mm | Cámara de aire 75mm | Placa OSB 11.1mm | Tinglado FIBROCEMENTO 6mm | PLACA FIBROCEMENTO 8mm",
    "capasStruct": null,
    "fuente": "Ficha M6 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-PV1",
    "pda": "talca_maule",
    "elem": "piso",
    "desc": "Piso ventilado lana fibra de vidrio",
    "u": 0.6,
    "rt": null,
    "cond": null,
    "capas": "Placa OSB estructural 11.1mm | Placa fibrocemento 8mm",
    "capasStruct": null,
    "fuente": "Ficha PV1 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-PV2",
    "pda": "talca_maule",
    "elem": "piso",
    "desc": "Piso ventilado poliestireno expandido",
    "u": 0.58,
    "rt": null,
    "cond": null,
    "capas": "Placa OSB estructural 11.1mm | Placa fibrocemento 8mm",
    "capasStruct": null,
    "fuente": "Ficha PV2 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-T1",
    "pda": "talca_maule",
    "elem": "techumbre",
    "desc": "Techumbre cercha lana fibra de vidrio",
    "u": 0.38,
    "rt": null,
    "cond": "sin",
    "capas": "",
    "capasStruct": null,
    "fuente": "Ficha T1 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-T2",
    "pda": "talca_maule",
    "elem": "techumbre",
    "desc": "Techumbre envigado poliestireno expandido",
    "u": 0.38,
    "rt": null,
    "cond": "sin",
    "capas": "Polietileno 0.2mm",
    "capasStruct": null,
    "fuente": "Ficha T2 · PDA Talca–Maule · MINVU"
  }
]

export const PDA_DETALLES = [
  {
    "cod": "PDA-CHL-CH-HP-",
    "pda": "chillan",
    "tipo": "puerta",
    "desc": "Ch hp hermeticidad en puertas",
    "fuente": "Ficha CH-HP- · PDA Chillán–Chillán Viejo · MINVU"
  },
  {
    "cod": "PDA-CHL-CH-HV-",
    "pda": "chillan",
    "tipo": "ventana",
    "desc": "Ch hv hermeticidad en ventanas",
    "fuente": "Ficha CH-HV- · PDA Chillán–Chillán Viejo · MINVU"
  },
  {
    "cod": "PDA-CHL-HI4",
    "pda": "chillan",
    "tipo": "ducto",
    "desc": "Hermeticidad en ducto de estufa generico",
    "fuente": "Ficha HI4 · PDA Chillán–Chillán Viejo · MINVU"
  },
  {
    "cod": "PDA-COY-H1",
    "pda": "coyhaique",
    "tipo": "puerta",
    "desc": "Puertas de vivienda de albañilería y hormigon armado",
    "fuente": "Ficha H1 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H10",
    "pda": "coyhaique",
    "tipo": "encuentro",
    "desc": "Encuentro de placas de revestimiento de la misma materialidad",
    "fuente": "Ficha H10 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H11",
    "pda": "coyhaique",
    "tipo": "encuentro",
    "desc": "Encuentro de placas de revestimiento de distinta materialidad",
    "fuente": "Ficha H11 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H12",
    "pda": "coyhaique",
    "tipo": "artefacto",
    "desc": "Encuentro de artefactos electricos con muros",
    "fuente": "Ficha H12 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H13",
    "pda": "coyhaique",
    "tipo": "artefacto",
    "desc": "Encuentro de artefactos electricos con cielos",
    "fuente": "Ficha H13 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H2",
    "pda": "coyhaique",
    "tipo": "ventana",
    "desc": "Ventanas en viviendas de albañilería y hormigon armado",
    "fuente": "Ficha H2 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H3",
    "pda": "coyhaique",
    "tipo": "puerta",
    "desc": "Puertas en viviendas de tabiqueria de madera",
    "fuente": "Ficha H3 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H4",
    "pda": "coyhaique",
    "tipo": "ventana",
    "desc": "Ventanas en viviendas de tabiqueria de madera",
    "fuente": "Ficha H4 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H5",
    "pda": "coyhaique",
    "tipo": "ducto",
    "desc": "Ductos de ventilacion en viviendas de albañilería y hormigon armado",
    "fuente": "Ficha H5 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H6",
    "pda": "coyhaique",
    "tipo": "ducto",
    "desc": "Ductos de ventilacion en vivienda de tabiqueria de madera",
    "fuente": "Ficha H6 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H7",
    "pda": "coyhaique",
    "tipo": "ducto",
    "desc": "Ducto de estufa a traves de techumbre existente",
    "fuente": "Ficha H7 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H8",
    "pda": "coyhaique",
    "tipo": "encuentro",
    "desc": "Encuentro de solera inferior con sobrecimiento en vivienda de madera",
    "fuente": "Ficha H8 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-COY-H9",
    "pda": "coyhaique",
    "tipo": "encuentro",
    "desc": "Encuentro de solera superior con alero en vivienda de tabiqueria de madera",
    "fuente": "Ficha H9 · PDA Coyhaique · MINVU"
  },
  {
    "cod": "PDA-OH-HI1",
    "pda": "ohiggins",
    "tipo": "ducto",
    "desc": "Hermeticidad en ductos de ventilacion muros albañilería hormigon armado",
    "fuente": "Ficha HI1 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-HI2",
    "pda": "ohiggins",
    "tipo": "ducto",
    "desc": "Hermeticidad en ductos de ventilacion muro tabiquerìa de madera",
    "fuente": "Ficha HI2 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-HI4",
    "pda": "ohiggins",
    "tipo": "ducto",
    "desc": "Hermeticidad en ducto de estufa generico",
    "fuente": "Ficha HI4 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-HI5",
    "pda": "ohiggins",
    "tipo": "encuentro",
    "desc": "Hermeticidad encuentro solera inferior y sobrecimiento",
    "fuente": "Ficha HI5 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-HI6",
    "pda": "ohiggins",
    "tipo": "encuentro",
    "desc": "Hermeticidad encuentro solera superior y estructura techumbre",
    "fuente": "Ficha HI6 · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-OH-HP-",
    "pda": "ohiggins",
    "tipo": "puerta",
    "desc": "Oh hp hermeticidad en puertas",
    "fuente": "Ficha OH-HP- · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OH-OH-HV-",
    "pda": "ohiggins",
    "tipo": "ventana",
    "desc": "Oh hv hermeticidad en ventanas",
    "fuente": "Ficha OH-HV- · PDA O'higgins · MINVU"
  },
  {
    "cod": "PDA-OS-H1",
    "pda": "osorno",
    "tipo": "puerta",
    "desc": "Puertas de vivienda de albañilería y H.A. (1)",
    "fuente": "Ficha H1 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H1",
    "pda": "osorno",
    "tipo": "puerta",
    "desc": "Puertas de vivienda de albañilería y H.A.",
    "fuente": "Ficha H1 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H10",
    "pda": "osorno",
    "tipo": "encuentro",
    "desc": "Encuentro de placas de revestimiento de la misma materialidad",
    "fuente": "Ficha H10 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H11",
    "pda": "osorno",
    "tipo": "encuentro",
    "desc": "Encuentro de placas de revestimiento de distinta materialidad",
    "fuente": "Ficha H11 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H12",
    "pda": "osorno",
    "tipo": "artefacto",
    "desc": "Encuentro de artefactos electricos con muros",
    "fuente": "Ficha H12 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H13",
    "pda": "osorno",
    "tipo": "artefacto",
    "desc": "Encuentro de artefactos electricos con cielos",
    "fuente": "Ficha H13 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H2",
    "pda": "osorno",
    "tipo": "ventana",
    "desc": "Ventanas en viviendas de albañilería y H.A. (1)",
    "fuente": "Ficha H2 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H2",
    "pda": "osorno",
    "tipo": "ventana",
    "desc": "Ventanas en viviendas de albañilería y H.A.",
    "fuente": "Ficha H2 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H3",
    "pda": "osorno",
    "tipo": "puerta",
    "desc": "Puertas en viviendas de tabiqueria de madera (1)",
    "fuente": "Ficha H3 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H3",
    "pda": "osorno",
    "tipo": "puerta",
    "desc": "Puertas en viviendas de tabiqueria de madera",
    "fuente": "Ficha H3 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H4",
    "pda": "osorno",
    "tipo": "ventana",
    "desc": "Ventanas en viviendas de tabiqueria de madera",
    "fuente": "Ficha H4 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H5",
    "pda": "osorno",
    "tipo": "ducto",
    "desc": "Ductos de ventilacion en viviendas de albañilería y H.A.",
    "fuente": "Ficha H5 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H6",
    "pda": "osorno",
    "tipo": "ducto",
    "desc": "Ductos de ventilacion en vivienda de tabiqueria de madera",
    "fuente": "Ficha H6 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H7",
    "pda": "osorno",
    "tipo": "ducto",
    "desc": "Ducto de estufa a traves de techumbre existente",
    "fuente": "Ficha H7 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H9",
    "pda": "osorno",
    "tipo": "encuentro",
    "desc": "Encuentro de solera superior con alero en vivienda de tabiqueria de madera (1)",
    "fuente": "Ficha H9 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-OS-H9",
    "pda": "osorno",
    "tipo": "encuentro",
    "desc": "Encuentro de solera superior con alero en vivienda de tabiqueria de madera",
    "fuente": "Ficha H9 · PDA Osorno · MINVU"
  },
  {
    "cod": "PDA-TM-HI1",
    "pda": "talca_maule",
    "tipo": "ducto",
    "desc": "Solucion const hermeticidad en ductos de ventilación muros albañilerìa H.A.",
    "fuente": "Ficha HI1 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-HI4",
    "pda": "talca_maule",
    "tipo": "ducto",
    "desc": "Hermeticidad en ducto de estufa generico",
    "fuente": "Ficha HI4 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-HI5",
    "pda": "talca_maule",
    "tipo": "encuentro",
    "desc": "Hermeticidad encuentro solera inferior y sobrecimiento",
    "fuente": "Ficha HI5 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-HI6",
    "pda": "talca_maule",
    "tipo": "encuentro",
    "desc": "Hermeticidad encuentro solera superior y estru techumbre",
    "fuente": "Ficha HI6 · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-TM-HP-",
    "pda": "talca_maule",
    "tipo": "puerta",
    "desc": "Tm hp hermeticidad en puertas talca maule",
    "fuente": "Ficha TM-HP- · PDA Talca–Maule · MINVU"
  },
  {
    "cod": "PDA-TM-TM-HV-",
    "pda": "talca_maule",
    "tipo": "ventana",
    "desc": "Tm hv hermeticidad en ventanas talca maule",
    "fuente": "Ficha TM-HV- · PDA Talca–Maule · MINVU"
  }
]

// Normalización de comuna (misma lógica que src/data/zonas_oficial.js#canon).
const STOP = new Set(['de', 'del'])
function canon(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’']/g, '').replace(/[_\s]+/g, ' ').trim()
    .split(' ').filter(w => w && !STOP.has(w)).join('')
}
// Índice comuna(canon) → clave PDA
const _COMUNA_PDA = {}
for (const [key, v] of Object.entries(PDA)) for (const c of v.comunas) _COMUNA_PDA[canon(c)] = key

/** Devuelve la clave PDA de una comuna, o null si no está bajo ningún PDA. */
export function resolvePDA(comuna) {
  return _COMUNA_PDA[canon(comuna)] || null
}
/** Objeto PDA (nombre, decreto, requisitos...) de una comuna, o null. */
export function pdaDeComuna(comuna) {
  const k = resolvePDA(comuna)
  return k ? { key: k, ...PDA[k] } : null
}
/** Soluciones PDA aplicables a una comuna (o todas si no se pasa comuna). */
export function solucionesPDA(comuna) {
  const k = comuna ? resolvePDA(comuna) : null
  return k ? PDA_SOLUCIONES.filter(s => s.pda === k) : []
}
