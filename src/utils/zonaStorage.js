// ─── ZONA STORAGE ─────────────────────────────────────────────────────────────
// Gestiona las correcciones de zona térmica por comuna.
// Los overrides tienen prioridad sobre COMUNAS_ZONA en data.js.
// Fuente autorizada: DS N°15 MINVU / Tabla DITEC ZT_REGIONES_PROVINCIAS_COMUNAS
// ──────────────────────────────────────────────────────────────────────────────

const KEY        = 'oguc_zona_overrides'
const KEY_META   = 'oguc_zona_meta'
const VALID_ZONAS = ['A','B','C','D','E','F','G','H','I']

// ── Leer overrides guardados ──────────────────────────────────────────────────
export function getOverrides() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

// ── Leer metadata de la última carga ─────────────────────────────────────────
export function getMeta() {
  try {
    const raw = localStorage.getItem(KEY_META)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// ── Guardar overrides + metadata ──────────────────────────────────────────────
export function saveOverrides(map, meta = {}) {
  localStorage.setItem(KEY, JSON.stringify(map))
  localStorage.setItem(KEY_META, JSON.stringify({
    ...meta,
    savedAt: new Date().toISOString(),
    count: Object.keys(map).length,
  }))
}

// ── Limpiar overrides (volver a data.js) ──────────────────────────────────────
export function clearOverrides() {
  localStorage.removeItem(KEY)
  localStorage.removeItem(KEY_META)
}

// ── Resolver zona: override tiene prioridad ───────────────────────────────────
export function resolveZona(comunaNombre, overrides, comunasZonaBase) {
  if (!comunaNombre) return null
  const norm = n => n?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const key  = norm(comunaNombre)
  // 1° buscar en overrides
  for (const [k, v] of Object.entries(overrides)) {
    if (norm(k) === key) return v
  }
  // 2° buscar en datos base
  for (const [zona, comunas] of Object.entries(comunasZonaBase)) {
    if (comunas.some(c => norm(c) === key)) return zona
  }
  return null
}

// ── Exportar overrides como JSON descargable ──────────────────────────────────
export function exportOverridesJSON(overrides) {
  const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `zonas-termicas-${new Date().toISOString().slice(0,10)}.json`
  a.click()
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARSERS DE ARCHIVO
// ═══════════════════════════════════════════════════════════════════════════════

// ── Normaliza nombre de columna para buscar COMUNA y ZONA ────────────────────
function normCol(s) {
  return String(s ?? '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim()
}

function findCol(headers, patterns) {
  for (const p of patterns) {
    const idx = headers.findIndex(h => normCol(h).includes(p))
    if (idx >= 0) return idx
  }
  return -1
}

// ── Parsear filas (array de arrays) → resultado ───────────────────────────────
// La tabla DITEC tiene la estructura:
//   REGION | PROVINCIA | COMUNA | MERIDIANO | ALTITUD [MSNM] | ZONA TERMICA
// Algunas comunas aparecen más de una vez con distintas zonas según altitud.
export function parseRows(headers, rows) {
  const iComuna  = findCol(headers, ['comuna', 'nombre_comuna', 'nombre comuna'])
  const iZona    = findCol(headers, ['zona termica', 'zona_termica', 'zona t', 'zona'])
  const iAltitud = findCol(headers, ['altitud', 'msnm', 'altura'])
  const iRegion  = findCol(headers, ['region', 'nombre_region'])
  const iProv    = findCol(headers, ['provincia', 'nombre_provincia'])

  if (iComuna < 0 || iZona < 0) {
    return { error: `No se encontraron columnas COMUNA y ZONA en el archivo. Columnas detectadas: ${headers.join(', ')}` }
  }

  const result   = {}      // {comuna: zona}
  const altMulti = {}      // {comuna: [{altCondicion, zona}]} — comunas con múltiples zonas
  const invalidos = []

  for (const row of rows) {
    const comuna = String(row[iComuna] ?? '').trim()
    const zona   = String(row[iZona]   ?? '').trim().toUpperCase().replace('ZONA ', '')
    if (!comuna || !zona) continue

    // Validar que la zona sea A–I
    if (!VALID_ZONAS.includes(zona)) {
      invalidos.push({ comuna, zona })
      continue
    }

    const altRaw  = iAltitud >= 0 ? String(row[iAltitud] ?? '').trim() : ''
    const region  = iRegion  >= 0 ? String(row[iRegion]  ?? '').trim() : ''
    const prov    = iProv    >= 0 ? String(row[iProv]    ?? '').trim() : ''

    if (result[comuna] && result[comuna] !== zona) {
      // Misma comuna, zona distinta → altitud bifurca
      if (!altMulti[comuna]) {
        altMulti[comuna] = [{ altCondicion: 'primera entrada', zona: result[comuna], region, prov }]
      }
      altMulti[comuna].push({ altCondicion: altRaw || 'segunda entrada', zona, region, prov })
      // Quedarse con la zona de menor exigencia (menor altitud = menor zona térmica)
      // La zona más "baja" alfabéticamente implica menor exigencia
      if (zona < result[comuna]) result[comuna] = zona
    } else {
      result[comuna] = zona
    }
  }

  return { map: result, altMulti, invalidos, totalComunas: Object.keys(result).length }
}

// ── Parser CSV ────────────────────────────────────────────────────────────────
export function parseCSV(text) {
  const sep   = text.indexOf(';') > text.indexOf(',') ? ';' : ','
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { error: 'El CSV está vacío o tiene solo encabezado.' }
  const headers = lines[0].split(sep).map(h => h.replace(/^"|"$/g, '').trim())
  const rows    = lines.slice(1).map(l => l.split(sep).map(c => c.replace(/^"|"$/g, '').trim()))
  return parseRows(headers, rows)
}

// ── Parser JSON ───────────────────────────────────────────────────────────────
export function parseJSON(text) {
  try {
    const obj = JSON.parse(text)
    if (typeof obj !== 'object' || Array.isArray(obj)) {
      return { error: 'El JSON debe ser un objeto { "NombreComuna": "ZonaLetra", ... }' }
    }
    const map      = {}
    const invalidos = []
    for (const [k, v] of Object.entries(obj)) {
      const z = String(v).trim().toUpperCase()
      if (VALID_ZONAS.includes(z)) map[k.trim()] = z
      else invalidos.push({ comuna: k, zona: v })
    }
    return { map, altMulti: {}, invalidos, totalComunas: Object.keys(map).length }
  } catch (e) {
    return { error: `JSON inválido: ${e.message}` }
  }
}

// ── Parser XLSX (usa SheetJS) ─────────────────────────────────────────────────
export async function parseXLSX(arrayBuffer) {
  const XLSX = await import('xlsx')
  const wb   = XLSX.read(arrayBuffer, { type: 'array' })

  // Buscar la hoja que más parezca la tabla de comunas
  let sheet = null
  let sheetName = ''
  for (const name of wb.SheetNames) {
    const s = wb.Sheets[name]
    const json = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' })
    if (json.length > 5) {
      // Buscar fila de encabezado (puede no ser la primera)
      for (let i = 0; i < Math.min(5, json.length); i++) {
        const row = json[i].map(String)
        if (row.some(c => normCol(c).includes('comuna')) &&
            row.some(c => normCol(c).includes('zona'))) {
          sheet = json.slice(i)
          sheetName = name
          break
        }
      }
      if (sheet) break
    }
  }

  if (!sheet) {
    return { error: `No se encontró una hoja con columnas COMUNA y ZONA. Hojas disponibles: ${wb.SheetNames.join(', ')}` }
  }

  const headers = sheet[0].map(String)
  const rows    = sheet.slice(1)
  return { ...parseRows(headers, rows), sheetName }
}
