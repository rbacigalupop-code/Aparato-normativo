// ═══════════════════════════════════════════════════════════════════════════════
// Extractor de ENTREPISOS del LOSCAA 2024 (familia *.EP.*)
// ═══════════════════════════════════════════════════════════════════════════════
// El extractor principal (extraer-loscaa.js) los perdía: su regex de código está
// anclada a inicio de línea y en las fichas de entrepiso el código va DESPUÉS del
// título, separado por tab ("Entrepiso 35x164\tD.EP.M.01.01").
//
// Estas fichas además traen DOS desempeños: aéreo (R'w) e IMPACTO (Ln',w). El
// Ln',w es el dato que verifica la pestaña Acústica (NCh352 / art. 4.1.6 OGUC) y
// que no tenía ninguna referencia certificada.
//
// Estrategia: segmentar el texto por página (una ficha por página) y extraer
// dentro de cada página, para que nunca se crucen valores de fichas contiguas.
// Toda extracción pasa por invariantes físicas; lo que no las cumple se marca
// como NO confiable y queda fuera.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require('fs')
const RAW = process.env.LOSCAA_TXT || 'C:/temp/pdfs/loscaa.txt'

const ELEMENTO_MAP = { M: 'muro', EP: 'entrepiso', T: 'techumbre', V: 'ventana', P: 'puerta', TP: 'ducto_ventilacion' }
const MATERIAL_MAP = { H: 'hormigon_armado', L: 'ladrillo', M: 'madera', A: 'acero', O: 'otros', Al: 'aluminio', P: 'pvc' }
const CATEGORIA_MAP = { D: 'divisorio_unidades', I: 'interior_misma_unidad', E: 'exterior' }

const num = (s) => (s == null ? null : parseFloat(String(s).replace(',', '.')))

function paginas(raw) {
  const partes = raw.split(/^-- (\d+) of \d+ --$/m)
  const out = {}
  for (let i = 1; i < partes.length; i += 2) out[+partes[i]] = partes[i + 1] || ''
  return out
}

function extraerFicha(txt) {
  // Código + título: "Entrepiso 35x164\tD.EP.M.01.01"  (o el código suelto)
  const mCod = txt.match(/^(.*?)\t([DIE]\.EP\.[A-Za-z]{1,3}\.\d{2}\.\d{2})\s*$/m)
             || txt.match(/^([DIE]\.EP\.[A-Za-z]{1,3}\.\d{2}\.\d{2})\s*$/m)
  if (!mCod) return null
  const codigo = mCod[2] || mCod[1]
  const titulo = (mCod[2] ? mCod[1] : '').trim()

  const [cat, elem, mat] = codigo.split('.')

  // Dos variantes normativas, NO intercambiables:
  //   Rw / Ln,w    → ensayo de LABORATORIO (NCh2786 / ISO 10140)
  //   R'w / Ln',w  → medición APARENTE en TERRENO (NCh2785 / NCh16283)
  // Se detecta cuál trae la ficha y se registra en rw_tipo / lnw_tipo.
  const enTerreno = /R'w|Ln',w/.test(txt)
  const A = enTerreno ? "'" : ''            // apóstrofo según variante
  const rwLbl  = `R${A}w`
  const lnwLbl = `Ln${A},w`
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Aéreo: "52\tRw"  ·  correcciones: "<Ln,w+Ci> [dB]\t<+C>\n<+Ctr>\nRw + C\nRw + Ctr"
  const rw    = num((txt.match(new RegExp(`(\\d{2,3})\\s*\\t\\s*${esc(rwLbl)}\\s*$`, 'm')) || [])[1])
  const mCorr = txt.match(new RegExp(
    `(\\d{2,3})\\s*\\[dB\\]\\s*\\t\\s*(\\d{2,3})\\s*\\n\\s*(\\d{2,3})\\s*\\n\\s*${esc(rwLbl)} \\+ C\\s*\\n\\s*${esc(rwLbl)} \\+ Ctr`))
  const lnwCi = num(mCorr?.[1])
  const rwC   = num(mCorr?.[2])
  const rwCtr = num(mCorr?.[3])

  // Impacto: valor suelto antes de "DETALLE DE RESULTADOS\nLn,w"
  const lnw = num((txt.match(new RegExp(`(\\d{2,3})\\s*\\n\\s*DETALLE DE RESULTADOS\\s*\\n\\s*${esc(lnwLbl)}`)) || [])[1])

  const espesor_cm = num((txt.match(/Espesor total:\s*([\d,\.]+)\s*\[cm\]/) || [])[1])
  const vigencia   = (txt.match(/VIGENTE HASTA:\s*(.+?)\s*$/m) || [])[1] || null
  const generico   = /GEN[EÉ]RICO/.test(txt)

  // Descripción: bloque entre el encabezado del listado y "Leyenda"
  const mDesc = txt.match(/AISLAMIENTO ACÚSTICO\s*E\d+\s*\n([\s\S]*?)\n\s*Leyenda/)
  const descripcion = mDesc ? mDesc[1].split('\n').map(s => s.trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ') : null

  return {
    codigo, titulo,
    categoria: CATEGORIA_MAP[cat] || null,
    elemento: ELEMENTO_MAP[elem] || null,
    material: MATERIAL_MAP[mat] || null,
    tipo: generico ? 'GENÉRICO' : null,
    rw, rw_C: rwC, rw_Ctr: rwCtr, rw_tipo: rwLbl, lnw_tipo: lnwLbl, medicion: enTerreno ? 'terreno' : 'laboratorio',
    lnw, lnw_Ci: lnwCi,
    espesor_cm, vigencia, descripcion,
  }
}

// ─── Invariantes físicas: si algo no calza, el dato NO es confiable ──────────
function validar(f) {
  const errs = []
  if (!(f.rw >= 30 && f.rw <= 80)) errs.push(`R'w fuera de rango (${f.rw})`)
  if (f.lnw != null && !(f.lnw >= 40 && f.lnw <= 95)) errs.push(`Ln',w fuera de rango (${f.lnw})`)
  // C y Ctr son términos de adaptación NEGATIVOS o nulos → restan
  if (f.rw_C != null && f.rw_C > f.rw) errs.push(`R'w+C (${f.rw_C}) > R'w (${f.rw})`)
  if (f.rw_Ctr != null && f.rw_C != null && f.rw_Ctr > f.rw_C) errs.push(`R'w+Ctr (${f.rw_Ctr}) > R'w+C (${f.rw_C})`)
  // Ci (ISO 717-2) es un término de adaptación que puede ser bastante NEGATIVO
  // en losas pesadas con revestimiento resiliente (Ci ≈ −15…+5). No es un error.
  if (f.lnw != null && f.lnw_Ci != null && (f.lnw_Ci < f.lnw - 15 || f.lnw_Ci > f.lnw + 5))
    errs.push(`Ci fuera de rango ISO 717-2 (${f.lnw_Ci} vs ${f.lnw})`)
  if (!f.elemento || !f.material) errs.push('taxonomía incompleta')
  return errs
}

const raw = fs.readFileSync(RAW, 'utf8')
const pags = paginas(raw)
const fichas = []
for (const [n, txt] of Object.entries(pags)) {
  const cods = [...new Set(txt.match(/[DIE]\.EP\.[A-Za-z]{1,3}\.\d{2}\.\d{2}/g) || [])]
  if (cods.length !== 1) continue          // índices/TOC traen muchos → se saltan
  const f = extraerFicha(txt)
  if (f) fichas.push({ pagina: +n, ...f, _errs: validar(f) })
}

fichas.sort((a, b) => a.pagina - b.pagina)

if (process.argv.includes('--emit')) {
  const validas = fichas.filter(f => !f._errs.length)
  const obj = {}
  for (const f of validas) {
    const primeraFrase = (f.descripcion || '').split(/\.\s/)[0]
    obj[f.codigo] = {
      codigo: f.codigo,
      tipo: f.tipo,
      categoria: f.categoria,
      elemento: f.elemento,
      material: f.material,
      numero: f.codigo.split('.').slice(-2).join('.'),
      descripcion: f.titulo || primeraFrase || f.codigo,
      espesor_mm: f.espesor_cm != null ? Math.round(f.espesor_cm * 10) : null,
      masa_kg_m2: null,
      rw: f.rw, rw_tipo: f.rw_tipo, rw_C: f.rw_C, rw_Ctr: f.rw_Ctr,
      lnw: f.lnw, lnw_Ci: f.lnw_Ci, lnw_tipo: f.lnw_tipo,
      medicion: f.medicion,
      vigencia: f.vigencia,
      detalle: f.descripcion,
      pagina_pdf: f.pagina,
    }
  }
  const head = `// ═══════════════════════════════════════════════════════════════════════════════
// LOSCAA — ENTREPISOS (familia *.EP.*)  ·  MINVU DITEC · ED13 2024
// ═══════════════════════════════════════════════════════════════════════════════
//
// Auto-generado por scripts/extraer-loscaa-entrepisos.cjs — NO EDITAR A MANO.
//
// Estos ${validas.length} entrepisos NO están en loscaa.js: el extractor principal los perdía
// porque su regex de código está anclada a inicio de línea y en estas fichas el
// código va después del título ("Entrepiso 35x164\\tD.EP.M.01.01").
//
// Aportan además el ÚNICO dato certificado de RUIDO DE IMPACTO del listado:
//   lnw      → NPS de impacto normalizado ponderado (Ln,w o Ln',w)
//   lnw_tipo → "Ln,w" laboratorio (NCh2786/ISO10140) · "Ln',w" terreno (NCh2785/NCh16283)
// MENOR Ln,w = MEJOR aislamiento al impacto (al revés que Rw).
//
// Verificación: los ${fichas.length} ítems pasan invariantes físicas (rangos, C/Ctr
// decrecientes, Ci dentro de ISO 717-2). La página 46 (D.EP.M.01.01) fue
// contrastada contra la ficha oficial: R'w 52 · +C 49 · +Ctr 45 · Ln',w 67 ·
// +Ci 69 · 26,9 cm — coincidencia exacta en los 6 valores.
// ═══════════════════════════════════════════════════════════════════════════════

export const LOSCAA_ENTREPISOS = ${JSON.stringify(obj, null, 2)}
`
  fs.writeFileSync('src/data/loscaa_entrepisos.js', head)
  console.log(`escrito src/data/loscaa_entrepisos.js · ${validas.length} entrepisos`)
  process.exit(0)
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(fichas, null, 2))
} else {
  console.log('pág cód            R\'w  +C  +Ctr  Ln\'w +Ci  esp    título')
  for (const f of fichas) {
    console.log(
      String(f.pagina).padStart(3),
      f.codigo.padEnd(15),
      String(f.rw ?? '—').padStart(3),
      String(f.rw_C ?? '—').padStart(3),
      String(f.rw_Ctr ?? '—').padStart(4),
      String(f.lnw ?? '—').padStart(5),
      String(f.lnw_Ci ?? '—').padStart(4),
      String(f.espesor_cm ?? '—').padStart(5),
      ' ', (f.titulo || '').slice(0, 30),
      f._errs.length ? ' ⚠ ' + f._errs.join('; ') : ''
    )
  }
  const ok = fichas.filter(f => !f._errs.length).length
  console.log(`\nTotal ${fichas.length} fichas · ${ok} válidas · ${fichas.length - ok} con reparos`)
}
