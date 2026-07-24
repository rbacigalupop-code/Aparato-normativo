// ═══════════════════════════════════════════════════════════════════════════════
// Verificador independiente de src/data/loscaa_entrepisos.js
// ═══════════════════════════════════════════════════════════════════════════════
// Contrasta cada ítem contra el PDF oficial usando `pdftotext -layout`, que
// preserva la alineación etiqueta↔valor ("Rw = 47 [dB]") en vez del volcado
// desordenado que obliga a heurísticas. Es una extracción DISTINTA a la del
// generador, así que sirve como verificación cruzada real.
//
//   node scripts/verificar-loscaa-entrepisos.cjs
//
// Sale con código 1 si algún valor discrepa → usable en CI.
// ═══════════════════════════════════════════════════════════════════════════════

const { execSync } = require('child_process')
const PDF = process.env.LOSCAA_PDF || 'C:/Users/UCSC/Downloads/LISTADO-OFICIAL-VIGENTE-LOSCAA-2024.pdf'

function paginaTexto(p) {
  return execSync(`pdftotext -f ${p} -l ${p} -layout "${PDF}" -`, { encoding: 'binary', maxBuffer: 1e8 })
}

import('../src/data/loscaa_entrepisos.js').then(({ LOSCAA_ENTREPISOS }) => {
  let ok = 0, mal = 0, nf = 0
  for (const [cod, f] of Object.entries(LOSCAA_ENTREPISOS)) {
    let hit = null
    // buscar en la página declarada y ±2 por si el índice se corre
    for (let p = Math.max(1, f.pagina_pdf - 2); p <= f.pagina_pdf + 2 && !hit; p++) {
      const t = paginaTexto(p)
      if (!t.includes(cod)) continue
      const g = (re) => { const m = t.match(re); return m ? parseFloat(m[1].replace(',', '.')) : null }
      hit = {
        pagina: p,
        rw:    g(/R'?w\s*=\s*(\d+)\s*\[dB\]/),
        rw_C:  g(/R'?w \+ C\s*=\s*(\d+)/),
        rw_Ctr:g(/R'?w \+ Ctr\s*=\s*(\d+)/),
        lnw:   g(/Ln'?,w\s*=\s*(\d+)/),
        lnw_Ci:g(/Ln'?,w\+Ci\s*=\s*(\d+)/),
      }
    }
    if (!hit) { nf++; console.log(`${cod.padEnd(16)} NO ENCONTRADO en el PDF`); continue }
    const campos = ['rw', 'rw_C', 'rw_Ctr', 'lnw', 'lnw_Ci']
    const dif = campos.filter(c => hit[c] !== f[c])
    if (dif.length) {
      mal++
      console.log(`${cod.padEnd(16)} ✗ DISCREPA en ${dif.join(', ')} — dato: ${dif.map(c => f[c]).join('/')} · PDF: ${dif.map(c => hit[c]).join('/')}`)
    } else {
      ok++
      console.log(`${cod.padEnd(16)} ✓ pág ${hit.pagina} · ${f.rw_tipo}=${f.rw} · ${f.lnw_tipo}=${f.lnw}`)
    }
  }
  console.log(`\nCoinciden ${ok} · Discrepan ${mal} · No hallados ${nf}`)
  process.exit(mal || nf ? 1 : 0)
})
