// ─────────────────────────────────────────────────────────────────────────────
// exportarPDFEjecutivo.js — Genera el PDF ejecutivo para clientes, mandantes,
// oferentes. Usa html2pdf.js (ya cargado en el proyecto).
//
// Distinto al informe DOM (técnico para revisores municipales): este es un
// documento de venta / inversión.
// ─────────────────────────────────────────────────────────────────────────────

import { ESCALA_CEV } from '../../data/cev_chile.js'

// Helper: formatear CLP
const fmtClp = n => (n != null ? n.toLocaleString('es-CL') : '—')
const fmtMillones = n => (n != null ? `CLP ${(n / 1e6).toFixed(1)}M` : '—')
const fmtK = n => (n != null ? `${(n / 1000).toFixed(0)}k` : '—')

/**
 * Genera el HTML del informe ejecutivo y lo descarga como PDF.
 */
export async function exportarPDFEjecutivo(informe, nombreArchivo = 'informe-ejecutivo.pdf') {
  if (!informe) throw new Error('No hay datos para generar el informe')

  const html = buildHtmlInforme(informe)

  // Cargar html2pdf dinámicamente
  const mod = await import('html2pdf.js')
  const html2pdf = mod.default ?? mod

  // Renderizar fuera del viewport
  const container = document.createElement('div')
  container.innerHTML = html
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:820px;background:#fff;'
  document.body.appendChild(container)

  try {
    await html2pdf().set({
      margin: [12, 12, 12, 12],
      filename: nombreArchivo,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 820, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.hero', '.kpi-grid', '.section'] },
    }).from(container).save()
  } finally {
    document.body.removeChild(container)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generación del HTML del informe
// ─────────────────────────────────────────────────────────────────────────────
function buildHtmlInforme(d) {
  const fechaTxt = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const cev = d.cev || {}
  const cevProy = d.cevProyectada || {}

  // Top 5 recomendaciones
  const recs = (d.recomendaciones || []).slice(0, 5)
  const totalAhorro = recs.reduce((s, r) => s + (r.ahorroClpAnio || 0), 0)
  const totalInversion = recs.reduce((s, r) => s + (r.costoClp || 0), 0)

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', 'Helvetica', Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px 24px; font-size: 11pt; }
  h1, h2, h3 { margin: 0; color: #1e293b; }
  h1 { font-size: 22pt; font-weight: 800; letter-spacing: -0.5px; }
  h2 { font-size: 13pt; font-weight: 700; color: #1e40af; margin-top: 18pt; margin-bottom: 8pt;
       border-bottom: 2px solid #1e40af; padding-bottom: 4pt; }
  h3 { font-size: 11pt; font-weight: 700; margin: 8pt 0 4pt; }
  p { line-height: 1.5; margin: 4pt 0; }
  table { width: 100%; border-collapse: collapse; }
  table th, table td { padding: 5pt 7pt; text-align: left; font-size: 9.5pt; }
  table th { background: #f1f5f9; font-weight: 700; color: #475569; font-size: 8pt;
             text-transform: uppercase; letter-spacing: 0.5pt; border-bottom: 2px solid #cbd5e1; }
  table td { border-bottom: 1px solid #e2e8f0; }

  /* Encabezado */
  .header { display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 12pt; padding-bottom: 8pt; border-bottom: 3px solid #1e40af; }
  .header-left { font-size: 9pt; color: #64748b; letter-spacing: 1pt; text-transform: uppercase; }
  .header-right { font-size: 9pt; color: #64748b; text-align: right; }

  /* Hero CEV */
  .hero { background: linear-gradient(135deg, ${cev.color || '#1e40af'}, #1e293b);
          color: #fff; padding: 22pt 26pt; border-radius: 8pt; margin: 12pt 0; }
  .hero-grid { display: grid; grid-template-columns: 110pt 1fr; gap: 20pt; align-items: center; }
  .hero-letra { background: rgba(255,255,255,0.15); border: 2pt solid rgba(255,255,255,0.4);
                border-radius: 8pt; padding: 14pt; text-align: center; }
  .hero-letra .L { font-size: 56pt; font-weight: 800; line-height: 0.9; letter-spacing: -2pt; }
  .hero-letra .S { font-size: 8pt; opacity: 0.9; text-transform: uppercase; letter-spacing: 1pt;
                   margin-top: 4pt; }
  .hero h1 { color: #fff; }
  .hero-sub { font-size: 10pt; opacity: 0.92; margin-top: 5pt; }
  .hero-data { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8pt; margin-top: 12pt;
               background: rgba(255,255,255,0.1); border-radius: 5pt; padding: 8pt 10pt; }
  .hero-data div { font-size: 9pt; }
  .hero-data b { font-size: 12pt; display: block; margin-top: 2pt; }

  /* KPIs */
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8pt; margin: 8pt 0; }
  .kpi { background: #f8fafc; padding: 8pt 10pt; border-radius: 5pt; border-left: 3pt solid #1e40af; }
  .kpi .l { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5pt; }
  .kpi .v { font-size: 14pt; font-weight: 800; color: #1e293b; margin-top: 2pt; }
  .kpi .s { font-size: 8pt; color: #64748b; margin-top: 1pt; }

  /* Comparativas */
  .barra { background: #f1f5f9; height: 14pt; border-radius: 3pt; position: relative; margin: 3pt 0; }
  .barra-fill { height: 100%; border-radius: 3pt; }
  .barra-row { display: grid; grid-template-columns: 130pt 1fr 60pt; gap: 8pt; align-items: center;
               font-size: 9pt; margin: 3pt 0; }
  .barra-row .lbl { font-weight: 600; color: #475569; }
  .barra-row .val { text-align: right; font-family: 'Courier New', monospace;
                    font-weight: 700; color: #1e293b; }

  /* Recomendaciones */
  .rec { display: grid; grid-template-columns: 30pt 1fr 110pt 80pt; gap: 8pt;
         padding: 8pt 10pt; border-bottom: 1px solid #e2e8f0; align-items: center; }
  .rec-num { background: #1e40af; color: #fff; border-radius: 50%; width: 22pt; height: 22pt;
             font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .rec-titulo { font-size: 10pt; font-weight: 700; color: #1e293b; }
  .rec-imp { font-size: 8.5pt; color: #64748b; margin-top: 1pt; }
  .rec-money { font-family: 'Courier New', monospace; }
  .rec-money .c { font-size: 8pt; color: #dc2626; }
  .rec-money .a { font-size: 10pt; font-weight: 800; color: #16a34a; }
  .rec-pb { background: #f1f5f9; padding: 4pt; border-radius: 4pt; text-align: center; }
  .rec-pb .v { font-size: 13pt; font-weight: 800; color: #0369a1; }
  .rec-pb .l { font-size: 7pt; color: #64748b; text-transform: uppercase; }

  /* Totales */
  .totales { background: linear-gradient(135deg, #f0fdf4, #fff);
             border: 2pt solid #16a34a; border-radius: 8pt; padding: 10pt 14pt;
             display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8pt; margin-top: 8pt; }
  .totales div { text-align: center; }
  .totales .l { font-size: 8pt; color: #64748b; text-transform: uppercase; }
  .totales .v { font-size: 16pt; font-weight: 800; color: #166534; margin-top: 2pt; }

  /* Impacto ambiental */
  .ambiente { background: linear-gradient(135deg, #ecfdf5, #fff);
              border: 1pt solid #86efac; padding: 12pt 16pt; border-radius: 6pt; }
  .ambiente-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10pt; }
  .ambiente-grid .l { font-size: 8.5pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5pt; }
  .ambiente-grid .v { font-size: 16pt; font-weight: 800; color: #166534; margin-top: 2pt; }

  /* Footer */
  .footer { margin-top: 16pt; padding-top: 8pt; border-top: 1px solid #e2e8f0;
            font-size: 7.5pt; color: #94a3b8; text-align: center; line-height: 1.4; }

  /* Sección */
  .section { margin-bottom: 12pt; }
  .lead { font-size: 10pt; color: #475569; line-height: 1.5; margin: 6pt 0 8pt; }

  /* Print fixes */
  @page { size: A4; margin: 12mm; }
</style>
</head>
<body>

<!-- ENCABEZADO -->
<div class="header">
  <div class="header-left">Informe Ejecutivo · Análisis Energético</div>
  <div class="header-right">${fechaTxt}<br/><b>NormaCheck</b> · Módulo Energético Pro</div>
</div>

<h1>${d.proyecto.nombre}</h1>
<p class="lead">
  Localización: ${tituloComuna(d.proyecto.comuna)} ·
  Zona DS N°15: ${d.proyecto.zona} ·
  Superficie: ${d.proyecto.areaUtil} m²
</p>

<!-- HERO CEV -->
<div class="hero">
  <div class="hero-grid">
    <div class="hero-letra">
      <div class="L">${cev.letra || '—'}</div>
      <div class="S">Calificación CEV estimada</div>
    </div>
    <div>
      <h1 style="font-size: 22pt;">${fmtClp(cev.demandaOriginal)} kWh/m²·año</h1>
      <div class="hero-sub">${cev.descripcion}</div>
      <div class="hero-data">
        <div>Mejor que <b>${cev.percentilChile}%</b><span style="font-size:8pt; opacity:0.8"> de viviendas en Chile</span></div>
        <div>Costo energético<b>CLP ${fmtClp(d.costos.total)}</b><span style="font-size:8pt; opacity:0.8">/año</span></div>
        <div>Emisiones<b>${fmtClp(d.emisiones.total)} kg CO₂</b><span style="font-size:8pt; opacity:0.8">/año</span></div>
      </div>
    </div>
  </div>
</div>

<!-- COMPARATIVAS -->
<h2>📊 Posición vs benchmarks chilenos</h2>
<div>
  ${(d.comparativas || []).map(b => {
    const max = 250
    const pctTuyo = Math.min(100, (b.tuValor / max) * 100)
    const pctBench = Math.min(100, (b.valor / max) * 100)
    return `
      <div class="barra-row">
        <span class="lbl">${b.label}</span>
        <div class="barra">
          <div class="barra-fill" style="width: ${pctBench}%; background: ${b.color}88;"></div>
          <div style="position: absolute; left: calc(${pctTuyo}% - 2pt); top: -3pt; bottom: -3pt; width: 4pt;
                      background: #1e293b; border-radius: 1pt;" title="Tu proyecto"></div>
        </div>
        <span class="val" style="color: ${b.color}">${b.valor} kWh</span>
      </div>
    `
  }).join('')}
</div>
<p style="font-size: 8pt; color: #64748b; margin-top: 6pt;">
  La barra muestra cada benchmark. El marcador vertical oscuro indica tu proyecto: ${d.balance.kwhM2Anio} kWh/m²·año.
</p>

<!-- COSTOS Y EMISIONES ACTUALES -->
<h2>💰 Situación actual</h2>
<div class="kpi-grid">
  <div class="kpi">
    <div class="l">Pérdidas envolvente</div>
    <div class="v">${fmtK(d.balance.perdidas.envolvente)} kWh</div>
    <div class="s">${(d.balance.perdidas.envolvente / d.balance.perdidas.total * 100).toFixed(0)}% del total</div>
  </div>
  <div class="kpi">
    <div class="l">Pérdidas infiltración</div>
    <div class="v">${fmtK(d.balance.perdidas.infiltracion)} kWh</div>
    <div class="s">aire que entra/sale</div>
  </div>
  <div class="kpi">
    <div class="l">Ganancias útiles</div>
    <div class="v">${fmtK(d.balance.ganancias.utilizadas)} kWh</div>
    <div class="s">solares + internas</div>
  </div>
</div>
<div class="kpi-grid">
  <div class="kpi" style="border-color: #dc2626;">
    <div class="l">Calefacción anual</div>
    <div class="v">CLP ${fmtClp(d.costos.calefaccion)}</div>
    <div class="s">${d.costos.combNombre}</div>
  </div>
  <div class="kpi" style="border-color: #dc2626;">
    <div class="l">Electricidad anual</div>
    <div class="v">CLP ${fmtClp(d.costos.electricidad)}</div>
    <div class="s">${d.costos.tarifaElec} CLP/kWh</div>
  </div>
  <div class="kpi" style="border-color: #dc2626;">
    <div class="l">Total energético</div>
    <div class="v">CLP ${fmtClp(d.costos.total)}</div>
    <div class="s">por año</div>
  </div>
</div>

<!-- RECOMENDACIONES PRIORIZADAS -->
<h2>🎯 Plan de acción priorizado</h2>
<p class="lead">
  Las ${recs.length} mejoras recomendadas (ordenadas por payback) que llevarían
  tu proyecto de letra <b>${cev.letra}</b> a <b style="color: ${cevProy.color}">${cevProy.letra}</b>
  (reducción estimada de demanda <b>${d.mejoraDemanda}%</b>).
</p>
<div>
  ${recs.map((r, i) => `
    <div class="rec">
      <div class="rec-num">${i + 1}</div>
      <div>
        <div class="rec-titulo">${r.titulo}</div>
        <div class="rec-imp">${r.impacto}</div>
      </div>
      <div class="rec-money">
        <div class="c">Inversión: CLP ${fmtClp(r.costoClp)}</div>
        <div class="a">Ahorro: CLP ${fmtClp(r.ahorroClpAnio)}/año</div>
      </div>
      <div class="rec-pb">
        <div class="v">${r.payback || '—'}</div>
        <div class="l">años payback</div>
      </div>
    </div>
  `).join('')}
</div>

<div class="totales">
  <div>
    <div class="l">Inversión total plan</div>
    <div class="v">CLP ${fmtClp(totalInversion)}</div>
  </div>
  <div>
    <div class="l">Ahorro anual proyectado</div>
    <div class="v">CLP ${fmtClp(totalAhorro)}</div>
  </div>
  <div>
    <div class="l">Payback promedio</div>
    <div class="v">${totalAhorro > 0 ? (totalInversion / totalAhorro).toFixed(1) : '—'} años</div>
  </div>
</div>

<!-- IMPACTO AMBIENTAL -->
<h2>🌱 Impacto ambiental</h2>
<div class="ambiente">
  <div class="ambiente-grid">
    <div>
      <div class="l">Emisiones evitadas/año</div>
      <div class="v">${fmtClp(Math.round(d.emisiones.total * d.mejoraDemanda / 100))} kg CO₂</div>
    </div>
    <div>
      <div class="l">A 30 años</div>
      <div class="v">${(Math.round(d.emisiones.total * d.mejoraDemanda / 100 * 30) / 1000).toFixed(1)} t CO₂</div>
    </div>
    <div>
      <div class="l">Equivalente a</div>
      <div class="v">${Math.round(d.emisiones.total * d.mejoraDemanda / 100 * 30 / 22)} árboles plantados</div>
    </div>
  </div>
  <p style="font-size: 9pt; color: #166534; margin-top: 8pt; text-align: center;">
    Cada árbol absorbe ~22 kg CO₂/año en madurez. La reducción de emisiones es equivalente a esa magnitud de reforestación.
  </p>
</div>

<!-- FOOTER -->
<div class="footer">
  <b>NormaCheck — Módulo Energético Pro</b><br/>
  Este informe es una estimación referencial basada en ISO 13790 (balance térmico), Ley 21.118 (Net-billing FV),
  Ley 20.365 (Solar Térmico SST) y datos climáticos del Explorador Solar MINENERGÍA.<br/>
  Para certificación CEV oficial requiere CCTE_CL de evaluador acreditado MINVU.<br/>
  Generado el ${fechaTxt}.
</div>

</body>
</html>
`
}

function tituloComuna(key) {
  if (!key) return '—'
  return key.split('_').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')
}
