// Verifica el Rw de códigos LOSCAA puntuales contra la FICHA del PDF
// (la página que trae el rótulo "CÓDIGO:", no la del índice).
//   node scripts/verificar-loscaa-rw.cjs D.M.L.02.01 D.M.A.01.04
//   node scripts/verificar-loscaa-rw.cjs --todos     → compara todo lo cargado
const { execSync } = require('child_process')
const PDF = process.env.LOSCAA_PDF || 'C:/Users/UCSC/Downloads/LISTADO-OFICIAL-VIGENTE-LOSCAA-2024.pdf'

const txt = execSync(`pdftotext -layout "${PDF}" -`, { encoding: 'binary', maxBuffer: 5e8 })
const pags = txt.split('\f')

function fichaDe(cod) {
  const re = new RegExp('^\\s*' + cod.replace(/\./g, '\\.') + '(?![\\w.])', 'm')
  for (let i = 0; i < pags.length; i++) {
    const p = pags[i]
    if (!/C[ÓO]DIGO:/i.test(p)) continue      // descarta índices
    if (!re.test(p)) continue
    const g = (r) => { const m = p.match(r); return m ? parseFloat(m[1]) : null }
    return {
      pagina: i + 1,
      rw:     g(/R'?w\s*=\s*(-?\d+)\s*\[dB\]/),
      rw_C:   g(/R'?w \+ C\s*=\s*(-?\d+)/),
      rw_Ctr: g(/R'?w \+ Ctr\s*=\s*(-?\d+)/),
      lnw:    g(/Ln'?,w\s*=\s*(-?\d+)\s*\[dB\]/),
      mejora: /Mejora Aislamiento/i.test(p),
    }
  }
  return null
}

;(async () => {
  let cods = process.argv.slice(2).filter(a => !a.startsWith('--'))
  let cargados = null
  if (process.argv.includes('--todos')) {
    const a = await import('../src/data/loscaa.js')
    const b = await import('../src/data/loscaa_entrepisos.js')
    cargados = { ...a.LOSCAA, ...b.LOSCAA_ENTREPISOS }
    cods = Object.keys(cargados)
  }
  let ok = 0, mal = 0, nf = 0
  for (const cod of cods) {
    const f = fichaDe(cod)
    if (!f) { nf++; console.log(`${cod.padEnd(15)} ficha no hallada`); continue }
    if (cargados) {
      const actual = cargados[cod].rw
      const real = f.mejora ? f.rw : f.rw          // en mejoras el rótulo es igual
      if (actual === real) { ok++ }
      else { mal++; console.log(`${cod.padEnd(15)} pág ${String(f.pagina).padStart(3)} · cargado Rw=${actual}  PDF Rw=${real}  (Rw+C=${f.rw_C}, Rw+Ctr=${f.rw_Ctr})${f.mejora ? ' [MEJORA]' : ''}`) }
    } else {
      console.log(`${cod.padEnd(15)} pág ${String(f.pagina).padStart(3)} → Rw=${f.rw} | Rw+C=${f.rw_C} | Rw+Ctr=${f.rw_Ctr}${f.lnw != null ? ' | Ln,w=' + f.lnw : ''}${f.mejora ? ' [MEJORA]' : ''}`)
    }
  }
  if (cargados) console.log(`\ncoinciden ${ok} · difieren ${mal} · no halladas ${nf}`)
})()
