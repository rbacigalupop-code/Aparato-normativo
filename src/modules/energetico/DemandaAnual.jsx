// ─────────────────────────────────────────────────────────────────────────────
// DemandaAnual — Pestaña de balance térmico anual + sobrecalentamiento verano.
//
// 2 secciones:
//   1. INVIERNO — balance, demanda kWh/m²·año, calificación tipo CEV
//   2. VERANO — WWR, ganancias solares, alertas, recomendaciones
//
// Lee del proyecto:
//   · calcUInit (U de cada elemento)
//   · fachadas (áreas ventanas/muros por orientación)
//   · configEnergetica.comunaKey + zona oficial → clima (zonaClimaDeOGUC)
//
// Permite override de:
//   · Áreas (si calcUInit no las trae)
//   · ACH (hermeticidad)
//   · Factor solar vidrio + protecciones
//   · Masa térmica + ventilación nocturna
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react'
import {
  balanceTermicoMensual,
  analizarSobrecalentamiento,
  envolventeFromCalcUInit,
  ventanasFromFachadas,
  FACTOR_SOLAR_VIDRIOS,
  U_VENTANA_VIDRIOS,
} from '../../lib/engines/demanda.js'
import { estimarAreasEnvolvente } from '../../lib/engines/geometria.js'
import { balanceMultiZona, zonificarPorPiso, uValuesFromCalcUInit } from '../../lib/engines/zonas.js'
import { calcularSumaPsiL } from '../../lib/engines/puentes_termicos.js'
import { BENCHMARKS_DEMANDA } from '../../data/clima_anual.js'
import { ZONA_CLIMA_LABELS } from '../../data/comunas_chile.js'
import { zonaClimaDeOGUC } from '../../data/zona_clima.js'
import AyudaEnergetico, { BadgeOrigen } from './AyudaEnergetico.jsx'

export default function DemandaAnual({ proy, onChangeProy, calcUInit, fachadas, inventarioPT }) {
  const cfg = proy?.configEnergetica || {}
  const comunaKey = cfg.comunaKey || null
  // Macrozona climática derivada de la zona oficial elegida (sigue multi-zona)
  const zonaEf = zonaClimaDeOGUC(proy?.zona, comunaKey || proy?.comuna)

  // Defaults según tipo de proyecto: deptos suelen tener menos infiltración
  const achDefault = cfg.tipoProyecto === 'depto' ? 0.6 : 0.8

  // Inputs editables por el usuario
  const [areaUtil,   setAreaUtil]   = useState(proy?.superficie || 100)
  const [alturaCielo, setAlturaCielo] = useState(2.5)
  const [ach,        setAch]        = useState(achDefault)
  const [vidrioTipo, setVidrioTipo] = useState('dvh_4_12_4')
  const [proteccion, setProteccion] = useState(1.0)
  const [masaTermica, setMasaTermica] = useState('media')
  const [ventNocturna, setVentNocturna] = useState(false)
  const [gananciasInt, setGananciasInt] = useState(4.5)  // W/m² internas (según ocupación)
  // Área de envolvente por elemento en contacto real con el exterior. Vacío = usa
  // el área default. 0 = elemento interior (p.ej. entrepiso entre recintos calef.).
  const [areasOverride, setAreasOverride] = useState({})

  // Áreas de envolvente derivadas de la geometría del proyecto (superficie, pisos,
  // altura). Son la BASE editable: el override manual del usuario manda sobre ellas.
  const areasBase = useMemo(
    () => estimarAreasEnvolvente({ superficie: areaUtil, pisos: proy?.pisos, alturaCielo }),
    [areaUtil, proy?.pisos, alturaCielo]
  )

  // Auto-derivar del proyecto
  const elementos = useMemo(() => envolventeFromCalcUInit(calcUInit, areasOverride, areasBase), [calcUInit, areasOverride, areasBase])
  const ventanas  = useMemo(() => ventanasFromFachadas(fachadas), [fachadas])
  const factorSolar = FACTOR_SOLAR_VIDRIOS[vidrioTipo] ?? 0.70
  const uVentana = U_VENTANA_VIDRIOS[vidrioTipo] ?? U_VENTANA_VIDRIOS.default
  const psiLTotal = useMemo(() => calcularSumaPsiL(inventarioPT), [inventarioPT])

  const volumen = areaUtil * alturaCielo

  // Cálculos
  const balance = useMemo(() => balanceTermicoMensual({
    elementos, areaUtil, volumen, ach,
    areasVidrio: ventanas.areasVidrio,
    factorSolar, factorProteccion: proteccion, uVentana,
    gananciasInternasWm2: gananciasInt,
    masaTermica, psiLTotal,
    comunaKey, zonaClima: zonaEf,
  }), [elementos, areaUtil, volumen, ach, ventanas, factorSolar, proteccion, uVentana, gananciasInt, masaTermica, psiLTotal, comunaKey, zonaEf])

  const verano = useMemo(() => analizarSobrecalentamiento({
    areasVidrio: ventanas.areasVidrio,
    areasMuroOrient: ventanas.areasMuroOrient,
    factorSolar, factorProteccion: proteccion,
    zonaClima: zonaEf, comunaKey,
    masaTermica, ventilacionNocturna: ventNocturna,
    areaUtil,
  }), [ventanas, factorSolar, proteccion, zonaEf, comunaKey, masaTermica, ventNocturna, areaUtil])

  // ── Análisis multi-zona (Fase 2) ──────────────────────────────────────────
  // Dos modos: (a) zonas PERSONALIZADAS definidas por el usuario y persistidas en
  // proy.zonasTermicas (uso mixto, zonas no calefaccionadas); (b) desglose
  // automático por piso (efímero) desde la geometría. La exposición (terreno/
  // cubierta) define qué pierde cada zona — un piso intermedio solo por muros.
  const nPisos = Math.max(1, Math.floor(Number(proy?.pisos) || 1))
  const zonasUsuario = proy?.zonasTermicas || null
  const [verPorPisos, setVerPorPisos] = useState(false)

  const paramsMZ = useMemo(() => ({
    uValues: uValuesFromCalcUInit(calcUInit),
    comunaKey, zonaClima: zonaEf,
    factorSolar, factorProteccion: proteccion, uVentana,
    gananciasInternasWm2: gananciasInt, masaTermica,
  }), [calcUInit, comunaKey, zonaEf, factorSolar, proteccion, uVentana, gananciasInt, masaTermica])

  const multiZona = useMemo(() => {
    if (zonasUsuario?.length) {
      const calef = zonasUsuario.filter(z => z.calefaccionada !== false && Number(z.superficie) > 0)
      return calef.length ? balanceMultiZona(calef, paramsMZ) : null
    }
    if (verPorPisos && nPisos >= 2) {
      const zonas = zonificarPorPiso({ superficie: areaUtil, pisos: nPisos, alturaCielo, areasVidrio: ventanas.areasVidrio })
      return balanceMultiZona(zonas, paramsMZ)
    }
    return null
  }, [zonasUsuario, verPorPisos, nPisos, areaUtil, alturaCielo, ventanas, paramsMZ])

  // ── CRUD de zonas personalizadas (persistidas en el proyecto) ─────────────
  const setZonas = (nuevas) => onChangeProy?.({ ...proy, zonasTermicas: nuevas })
  const definirZonas = () => {
    const base = zonificarPorPiso({ superficie: areaUtil, pisos: nPisos, alturaCielo, areasVidrio: ventanas.areasVidrio })
      .map(z => ({ ...z, calefaccionada: true }))
    setZonas(base.length ? base : [{
      id: `z${Date.now()}`, nombre: 'Zona 1', superficie: areaUtil || 100, pisos: 1, alturaCielo,
      tocaTerreno: true, tocaCubierta: true, calefaccionada: true, areasVidrio: { N: 0, E: 0, S: 0, O: 0 },
    }])
  }
  const agregarZona = () => setZonas([...(zonasUsuario || []), {
    id: `z${Date.now()}`, nombre: `Zona ${(zonasUsuario?.length || 0) + 1}`, superficie: 100, pisos: 1, alturaCielo,
    tocaTerreno: false, tocaCubierta: false, calefaccionada: true, areasVidrio: { N: 0, E: 0, S: 0, O: 0 },
  }])
  const editarZona = (id, patch) => setZonas((zonasUsuario || []).map(z => z.id === id ? { ...z, ...patch } : z))
  const eliminarZona = (id) => setZonas((zonasUsuario || []).filter(z => z.id !== id))
  const limpiarZonas = () => onChangeProy?.({ ...proy, zonasTermicas: undefined })

  const sinDatosEnvolvente = elementos.length === 0

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px', fontFamily: 'var(--font-body)' }}>
      <Hero balance={balance} />

      <AyudaEnergetico
        icon="📊"
        titulo="Demanda energética anual"
        intro="Calcula la demanda térmica neta de la vivienda (kWh/m²·año) y la asigna una calificación A+→G en la escala chilena. El balance considera pérdidas por envolvente e infiltración, ganancias solares por orientación e internas, y aplica el factor de utilización ISO 13790."
        pasos={[
          'Asegúrate de tener <b>cálculos U completos</b> en el módulo Normativo (pestaña Cálculo U) — son la base de las pérdidas por envolvente.',
          'Si tienes <b>fachadas registradas</b> (pestaña Ventana), las áreas de ventana por orientación se cargan automáticamente.',
          'Ajusta el <b>ACH</b> (hermeticidad) según el tipo de vivienda: 0.6 nueva hermética, 0.8 estándar, 1.2 usada, 2.0 antigua.',
          'Cambia el <b>tipo de vidrio</b> y <b>protección solar</b> para ver cómo afectan tanto la demanda de invierno como el sobrecalentamiento de verano.',
          'En la sección de <b>Verano</b>, define la <b>masa térmica</b> de la vivienda y si tiene <b>ventilación nocturna</b> para refinar el índice de sobrecalentamiento.',
        ]}
        origenDatos={[
          { campo: 'Transmitancia U de cada elemento (muro, piso, techo) — calcUInit', origen: 'normativo:calculo-u' },
          { campo: 'Áreas de ventanas por orientación N/E/S/O — fachadas', origen: 'normativo:ventana' },
          { campo: 'Superficie útil — desde Diagnóstico del proyecto', origen: 'normativo:diagnostico' },
          { campo: 'Zona DS N°15 y HDD18 — derivados de la comuna configurada', origen: 'energetico:configuracion' },
          { campo: 'Radiación solar vertical por orientación — calculado según zona', origen: 'auto' },
          { campo: 'ACH, tipo vidrio, protección, ganancias internas, masa térmica, ventilación nocturna — los defines tú', origen: 'usuario' },
        ]}
        normativa="ISO 13790:2008 (Energy performance of buildings) · CTE-HE simplificado · NCh853:2021"
      />

      {/* ── Sin datos previos? ──────────────────────────────────────────── */}
      {sinDatosEnvolvente && (
        <div style={{
          marginBottom: 16,
          background: 'var(--warn-bg)', border: '1px solid var(--warn)',
          padding: '12px 16px', borderRadius: 8, fontSize: 12, color: 'var(--warn)',
        }}>
          ⚠ <b>No hay cálculos U previos en el proyecto.</b> Para que la demanda sea precisa,
          completa al menos un cálculo U en la pestaña <b>Cálculo U</b> del módulo Normativo.
          Mientras tanto se mostrarán resultados con valores por defecto.
        </div>
      )}

      {/* ── Sección Invierno ────────────────────────────────────────────── */}
      <SeccionInvierno
        balance={balance}
        elementos={elementos}
        areasOverride={areasOverride} setAreasOverride={setAreasOverride}
        ventanas={ventanas}
        psiLTotal={psiLTotal}
        inventarioPT={inventarioPT}
        // inputs
        areaUtil={areaUtil} setAreaUtil={setAreaUtil}
        alturaCielo={alturaCielo} setAlturaCielo={setAlturaCielo}
        ach={ach} setAch={setAch}
        vidrioTipo={vidrioTipo} setVidrioTipo={setVidrioTipo}
        proteccion={proteccion} setProteccion={setProteccion}
        gananciasInt={gananciasInt} setGananciasInt={setGananciasInt}
        uVentana={uVentana}
        zonaEf={zonaEf}
      />

      {/* ── Sección Verano ──────────────────────────────────────────────── */}
      <SeccionVerano
        verano={verano}
        ventanas={ventanas}
        masaTermica={masaTermica} setMasaTermica={setMasaTermica}
        ventNocturna={ventNocturna} setVentNocturna={setVentNocturna}
      />

      {/* ── Análisis multi-zona (por pisos / zonas personalizadas) ──────── */}
      {!sinDatosEnvolvente && (
        <SeccionZonas
          nPisos={nPisos}
          multiZona={multiZona}
          verPorPisos={verPorPisos} setVerPorPisos={setVerPorPisos}
          zonasUsuario={zonasUsuario}
          uValuesProyecto={paramsMZ.uValues}
          puedePersistir={!!onChangeProy}
          onDefinir={definirZonas} onAgregar={agregarZona}
          onEditar={editarZona} onEliminar={eliminarZona} onLimpiar={limpiarZonas}
        />
      )}

      <p style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center', marginTop: 16, fontStyle: 'italic', lineHeight: 1.5 }}>
        Cálculo según método mensual cuasi-estacionario ISO 13790 §12 (balance mes a mes). Es referencial:
        para certificación CEV oficial se requiere CCTE_CL del MINVU. Sin embargo, los
        órdenes de magnitud y comparaciones relativas son válidos para diseño y decisiones.
      </p>
    </div>
  )
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero({ balance }) {
  const cal = balance.calificacion
  const c = cal?.color || '#64748b'
  return (
    <div style={{
      background: `linear-gradient(135deg, ${c}, #1e293b)`,
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '24px 32px', color: '#fff', marginBottom: 20,
      display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center',
    }}>
      {/* Letra grande */}
      <div style={{
        width: 96, height: 96,
        background: 'rgba(255,255,255,0.16)',
        border: '2px solid rgba(255,255,255,0.5)',
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: -2,
          fontFamily: 'var(--font-display)',
        }}>
          {cal?.letra || '—'}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.85, marginBottom: 4 }}>
          Demanda térmica anual · Calificación aproximada
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
          {balance.kwhM2Anio.toLocaleString('es-CL')} kWh/m²·año
        </h2>
        <p style={{ fontSize: 13, margin: '6px 0 0', opacity: 0.92 }}>
          {cal?.nombre || 'Sin clasificar'} · Pérdidas {(balance.perdidas.total/1000).toFixed(1)}k kWh
          {balance.perdidas.puentesTermicos > 0 ? ` (inc. ${(balance.perdidas.puentesTermicos/1000).toFixed(1)}k PT)` : ''}
          {' · '}Ganancias útiles {(balance.ganancias.utilizadas/1000).toFixed(1)}k kWh · Neta {(balance.demandaNeta/1000).toFixed(1)}k kWh
        </p>
      </div>
    </div>
  )
}

// ─── SECCIÓN INVIERNO ────────────────────────────────────────────────────────
function SeccionInvierno({ balance, elementos, areasOverride, setAreasOverride, ventanas, psiLTotal, inventarioPT, areaUtil, setAreaUtil, alturaCielo, setAlturaCielo, ach, setAch, vidrioTipo, setVidrioTipo, proteccion, setProteccion, gananciasInt, setGananciasInt, uVentana, zonaEf }) {
  const tienePT = psiLTotal > 0
  return (
    <Card titulo="❄️ Invierno — Demanda de calefacción" subtitulo={`Clima ${zonaEf} · ${ZONA_CLIMA_LABELS[zonaEf] || ''}`}>
      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
        <Field label="Superficie útil (m²)">
          <input type="number" min={20} max={2000} value={areaUtil} onChange={e => setAreaUtil(Number(e.target.value) || 0)} style={inputStyle} />
        </Field>
        <Field label="Altura cielo (m)">
          <input type="number" min={2} max={5} step={0.1} value={alturaCielo} onChange={e => setAlturaCielo(Number(e.target.value) || 2.5)} style={inputStyle} />
        </Field>
        <Field label="ACH (renovaciones/hora)">
          <select value={ach} onChange={e => setAch(Number(e.target.value))} style={inputStyle}>
            <option value={0.4}>0.4 — Pasiva certificada</option>
            <option value={0.6}>0.6 — Vivienda nueva hermética</option>
            <option value={0.8}>0.8 — Vivienda nueva estándar</option>
            <option value={1.2}>1.2 — Vivienda usada</option>
            <option value={2.0}>2.0 — Antigua / con grietas</option>
          </select>
        </Field>
        <Field label="Tipo de vidrio">
          <select value={vidrioTipo} onChange={e => setVidrioTipo(e.target.value)} style={inputStyle}>
            <option value="monolitico_4mm">Monolítico 4mm (g=0.85)</option>
            <option value="monolitico_6mm">Monolítico 6mm (g=0.82)</option>
            <option value="dvh_4_12_4">DVH 4-12-4 (g=0.75)</option>
            <option value="dvh_low_e">DVH low-e (g=0.55)</option>
            <option value="dvh_low_e_argon">DVH low-e argón (g=0.50)</option>
            <option value="triple_low_e">Triple low-e (g=0.45)</option>
          </select>
        </Field>
        <Field label="Protección solar">
          <select value={proteccion} onChange={e => setProteccion(Number(e.target.value))} style={inputStyle}>
            <option value={1.0}>Sin protección (factor 1.0)</option>
            <option value={0.85}>Aleros básicos (0.85)</option>
            <option value={0.70}>Aleros + persianas (0.70)</option>
            <option value={0.50}>Doble protección verano (0.50)</option>
          </select>
        </Field>
        <Field label="Ganancias internas (ocupación)">
          <select value={gananciasInt} onChange={e => setGananciasInt(Number(e.target.value))} style={inputStyle}>
            <option value={3.0}>Uso reducido / 2ª vivienda (3.0 W/m²)</option>
            <option value={4.5}>Vivienda estándar (4.5 W/m²)</option>
            <option value={6.0}>Uso intensivo / alta ocupación (6.0 W/m²)</option>
          </select>
        </Field>
      </div>

      {/* Áreas de envolvente — editable (solo el área en contacto real con el exterior) */}
      {elementos.length > 0 && (
        <div style={{ marginBottom: 18, padding: 12, background: 'var(--surface-2, #f8fafc)', border: '1px solid var(--line, #e2e8f0)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Áreas de envolvente en contacto con el exterior (m²)</div>
          {areasBase?._geom && (
            <div style={{ fontSize: 11, color: 'var(--ink-3, #64748b)', marginBottom: 6 }}>
              📐 Estimadas de la geometría: {areasBase._geom.pisos} piso(s) · huella {areasBase._geom.footprint} m² · perímetro {areasBase._geom.perimetro} m. Ajusta cualquier valor si conoces la geometría real.
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--ink-3, #64748b)', marginBottom: 10 }}>
            Solo cuenta el área que da al <b>exterior</b> o a un <b>recinto no calefaccionado</b>. Un <b>entrepiso entre recintos calefaccionados</b> no es envolvente → ponlo en <b>0</b>. Un piso parcialmente <b>en voladizo</b> → solo el área del voladizo.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {elementos.map(el => {
              const LBL = { muro: 'Muro', piso: 'Piso / Entrepiso', techo: 'Techumbre', tabique: 'Tabique' }
              const interior = Number(el.area) === 0
              return (
                <div key={el.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, flex: 1, minWidth: 0 }}>
                    {LBL[el.elemKey] || el.elemKey} <span style={{ color: 'var(--ink-3, #94a3b8)' }}>· U={el.U}</span>
                  </span>
                  <input
                    type="number" min={0} step={1}
                    value={el.area}
                    onChange={e => setAreasOverride(prev => ({ ...prev, [el.key]: e.target.value }))}
                    style={{ ...inputStyle, width: 84, ...(interior ? { borderColor: 'var(--ok, #0d9488)', color: 'var(--ink-3, #64748b)' } : {}) }}
                  />
                  {interior && <span style={{ fontSize: 10, color: 'var(--ok, #0d9488)', whiteSpace: 'nowrap' }}>interior</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Resultados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 14 }}>
        <BigKPI
          label="Pérdidas envolvente"
          value={`${(balance.perdidas.envolvente/1000).toFixed(1)}k kWh`}
          sub={`${elementos.length} elementos`}
          color="var(--bad)"
          badge={elementos.length > 0 ? <BadgeOrigen origen="normativo:calculo-u" small /> : null}
        />
        <BigKPI
          label="Pérdidas puentes térmicos"
          value={tienePT
            ? `${(balance.perdidas.puentesTermicos/1000).toFixed(1)}k kWh`
            : '— sin datos'}
          sub={tienePT
            ? `ΣΨ·L = ${psiLTotal} W/K · ${inventarioPT?.length || 0} PT`
            : 'Completar pestaña PT'}
          color={tienePT ? 'var(--bad)' : 'var(--ink-3)'}
          badge={tienePT
            ? <BadgeOrigen origen="energetico:puentes-termicos" small />
            : <BadgeOrigen origen="auto" small label="No integrado" />}
        />
        <BigKPI
          label="Pérdidas infiltración"
          value={`${(balance.perdidas.infiltracion/1000).toFixed(1)}k kWh`}
          sub={`${ach} ACH`}
          color="var(--bad)"
          badge={<BadgeOrigen origen="usuario" small />}
        />
        {balance.perdidas.ventanas > 0 && (
          <BigKPI
            label="Pérdidas ventanas"
            value={`${(balance.perdidas.ventanas/1000).toFixed(1)}k kWh`}
            sub="conducción por vidrio"
            color="var(--bad)"
            badge={<BadgeOrigen origen="usuario" small label={`Uw ${uVentana}`} />}
          />
        )}
        <BigKPI
          label="Ganancias solares"
          value={`${(balance.ganancias.solares/1000).toFixed(1)}k kWh`}
          sub="por ventanas"
          color="var(--ok)"
          badge={(ventanas.areasVidrio.N + ventanas.areasVidrio.E + ventanas.areasVidrio.S + ventanas.areasVidrio.O) > 0
            ? <BadgeOrigen origen="normativo:ventana" small />
            : <BadgeOrigen origen="auto" small label="Sin ventanas" />}
        />
        <BigKPI
          label="Ganancias internas"
          value={`${(balance.ganancias.internas/1000).toFixed(1)}k kWh`}
          sub="ocupantes + equipos"
          color="var(--ok)"
          badge={<BadgeOrigen origen="usuario" small label={`${gananciasInt} W/m²`} />}
        />
      </div>

      {/* Factor de utilización */}
      <div style={{
        background: 'var(--bg-alt)', padding: '12px 16px', borderRadius: 8,
        fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 14,
      }}>
        <b>📊 Factor de utilización ISO 13790 (fórmula exacta §12.2.1.1):</b> {(balance.ganancias.factorUtilizacion * 100).toFixed(0)}%
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          {' · '} γ={balance.iso13790?.gamma} · τ={balance.iso13790?.tauHoras} h · H={balance.iso13790?.H_WK} W/K
          {balance.iso13790?.psiLTotal > 0 ? ` (inc. ΣΨ·L = ${balance.iso13790.psiLTotal} W/K)` : ''}
          {' · '}las ganancias no se aprovechan al 100% porque el balance ya está equilibrado en
          momentos del año. Sólo {balance.ganancias.utilizadas.toLocaleString('es-CL')} kWh
          contribuyen efectivamente a reducir la demanda de calefacción.
        </span>
      </div>

      {/* Benchmarks */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          📐 Tu posición en la escala chilena
        </div>
        <div style={{ display: 'flex', gap: 2, height: 28, borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
          {BENCHMARKS_DEMANDA.map(b => {
            const esActivo = balance.calificacion?.letra === b.letra
            return (
              <div key={b.letra} style={{
                flex: 1, background: b.color, color: '#fff',
                fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                opacity: esActivo ? 1 : 0.55,
                border: esActivo ? '2px solid var(--ink)' : 'none',
              }}>
                {b.letra}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--ink-3)' }}>
          <span>0</span><span>40</span><span>65</span><span>95</span><span>130 (promedio CL)</span><span>180</span><span>250</span><span>+</span>
        </div>
      </div>
    </Card>
  )
}

// ─── SECCIÓN VERANO ──────────────────────────────────────────────────────────
function SeccionVerano({ verano, ventanas, masaTermica, setMasaTermica, ventNocturna, setVentNocturna }) {
  const indiceColores = { minimo: 'var(--ok)', bajo: 'var(--ok)', medio: 'var(--warn)', alto: 'var(--bad)' }
  const indiceLabels  = { minimo: '✅ Mínimo', bajo: '🟢 Bajo', medio: '🟡 Medio', alto: '🔴 Alto' }

  return (
    <Card titulo="☀️ Verano — Análisis de sobrecalentamiento" subtitulo={`CDD26: ${verano.cdd26} °C·día · T verano: ${verano.tVerano}°C`}>
      {/* Inputs verano */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
        <Field label="Masa térmica de la vivienda">
          <select value={masaTermica} onChange={e => setMasaTermica(e.target.value)} style={inputStyle}>
            <option value="baja">Baja (steel-frame, drywall)</option>
            <option value="media">Media (mixta, ladrillo)</option>
            <option value="alta">Alta (hormigón, adobe, piedra)</option>
          </select>
        </Field>
        <Field label="Ventilación cruzada nocturna">
          <select value={ventNocturna ? 'si' : 'no'} onChange={e => setVentNocturna(e.target.value === 'si')} style={inputStyle}>
            <option value="no">No implementada</option>
            <option value="si">Sí — ventanas opuestas + control</option>
          </select>
        </Field>
      </div>

      {/* Índice global */}
      <div style={{
        padding: '14px 18px',
        background: `${indiceColores[verano.indice]}22`,
        border: `2px solid ${indiceColores[verano.indice]}`,
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 4 }}>
          Índice de riesgo de sobrecalentamiento
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: indiceColores[verano.indice] }}>
          {indiceLabels[verano.indice] || verano.indice}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 6 }}>
          Score interno: {verano.score} · Ganancias solares verano: <b>{verano.gananciasVerano.total.toLocaleString('es-CL')} kWh</b>
        </div>
      </div>

      {/* WWR + Ganancias por orientación */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          Ganancias solares verano por orientación
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {['N', 'E', 'S', 'O'].map(o => {
            const g = verano.gananciasVerano.porOrient[o] || 0
            const wwr = verano.wwr[o]
            return (
              <div key={o} style={{
                padding: 12, borderRadius: 8,
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>{o}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-num)', marginTop: 4 }}>
                  {(g/1000).toFixed(1)}k kWh
                </div>
                {wwr != null && (
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                    WWR: <b>{(wwr*100).toFixed(0)}%</b>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Alertas */}
      {verano.alertas.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bad)', marginBottom: 6 }}>
            ⚠ Alertas detectadas
          </div>
          {verano.alertas.map((a, i) => (
            <div key={i} style={{
              padding: '8px 12px', marginBottom: 4,
              background: a.severidad === 'alta' ? 'var(--bad-bg)' : 'var(--warn-bg)',
              border: `1px solid ${a.severidad === 'alta' ? 'var(--bad)' : 'var(--warn)'}`,
              borderRadius: 6, fontSize: 11,
              color: a.severidad === 'alta' ? 'var(--bad)' : 'var(--warn)',
            }}>
              {a.mensaje}
            </div>
          ))}
        </div>
      )}

      {/* Recomendaciones */}
      {verano.recomendaciones.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
            💡 Recomendaciones
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            {verano.recomendaciones.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
          </ul>
        </div>
      )}
    </Card>
  )
}

// ─── SECCIÓN MULTI-ZONA (por pisos o zonas personalizadas) ─────────────────────
function BarraDesglose({ porZona }) {
  const maxKwh = porZona.length ? Math.max(...porZona.map(z => z.kwhM2)) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {porZona.map(z => {
        const pct = maxKwh > 0 ? Math.round((z.kwhM2 / maxKwh) * 100) : 0
        const critico = z.kwhM2 === maxKwh && porZona.length > 1
        return (
          <div key={z.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 110px', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.nombre}</span>
            <div style={{ background: 'var(--bg-alt)', borderRadius: 4, height: 18, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: critico ? 'var(--bad)' : 'var(--accent)' }} />
            </div>
            <span style={{ fontSize: 12, textAlign: 'right', color: critico ? 'var(--bad)' : 'var(--ink-2)', fontWeight: critico ? 700 : 400 }}>
              {z.kwhM2} kWh/m² {critico ? '⚠' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function TotalEdificio({ multiZona }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 12 }}>
      Total: <b>{multiZona.demandaNetaTotal.toLocaleString('es-CL')} kWh</b> ·
      <b> {multiZona.kwhM2AnioPromedio} kWh/m²·año</b>
      {multiZona.calificacion ? <> · <b style={{ color: multiZona.calificacion.color }}>{multiZona.calificacion.letra}</b></> : null}
      {' '}<span style={{ color: 'var(--ink-3)' }}>· {multiZona.superficieTotal.toLocaleString('es-CL')} m² calefaccionados</span>
    </div>
  )
}

function SeccionZonas({ nPisos, multiZona, verPorPisos, setVerPorPisos, zonasUsuario, uValuesProyecto = {}, puedePersistir, onDefinir, onAgregar, onEditar, onEliminar, onLimpiar }) {
  const modoUsuario = !!zonasUsuario?.length
  const [expandida, setExpandida] = useState(null)

  // U por zona: vacío = hereda el U del proyecto. Borra la clave para no romper
  // elementosDeZona (que hace spread de uValues).
  const setU = (z, elem, v) => {
    const u = { ...(z.uValues || {}) }
    if (v === '' || v == null) delete u[elem]
    else u[elem] = Number(v)
    onEditar(z.id, { uValues: Object.keys(u).length ? u : undefined })
  }
  const setVidrio = (z, o, v) =>
    onEditar(z.id, { areasVidrio: { ...(z.areasVidrio || { N: 0, E: 0, S: 0, O: 0 }), [o]: Number(v) || 0 } })

  return (
    <Card
      titulo="🏢 Zonas térmicas (multi-zona)"
      subtitulo={modoUsuario
        ? 'Zonas definidas por ti · uso mixto, zonas no calefaccionadas, exposición por zona'
        : `El balance de arriba trata el proyecto como una sola zona${nPisos >= 2 ? ` · edificio de ${nPisos} pisos` : ''}`}
    >
      {!modoUsuario ? (
        <>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 12, lineHeight: 1.5 }}>
            Desglosa el edificio en zonas para ver cuáles son críticas. La <b>exposición</b> de cada zona
            (si toca terreno o cubierta) define qué pierde: un piso intermedio solo pierde por sus muros.
          </div>
          {verPorPisos && multiZona && (
            <div style={{ marginBottom: 14 }}>
              <TotalEdificio multiZona={multiZona} />
              <BarraDesglose porZona={multiZona.porZona} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {nPisos >= 2 && (
              <button onClick={() => setVerPorPisos(v => !v)}
                style={{ background: verPorPisos ? 'var(--bg-alt)' : 'var(--accent)', color: verPorPisos ? 'var(--ink-2)' : '#fff', border: verPorPisos ? '1px solid var(--line)' : 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {verPorPisos ? 'Ocultar desglose por piso' : 'Desglosar por piso (automático) →'}
              </button>
            )}
            {puedePersistir && (
              <button onClick={onDefinir}
                style={{ background: 'var(--surface)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ✎ Definir zonas personalizadas (uso mixto) →
              </button>
            )}
          </div>
          {!puedePersistir && (
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 8, fontStyle: 'italic' }}>
              El desglose por piso es solo de vista (no se guarda). Las zonas personalizadas requieren guardar el proyecto.
            </div>
          )}
        </>
      ) : (
        <>
          {multiZona ? <TotalEdificio multiZona={multiZona} /> : (
            <div style={{ fontSize: 12, color: 'var(--warn)', marginBottom: 12 }}>⚠ Ninguna zona calefaccionada con superficie — agrega al menos una.</div>
          )}
          {multiZona && <div style={{ marginBottom: 14 }}><BarraDesglose porZona={multiZona.porZona} /></div>}

          {/* Editor de zonas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Cabecera */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 70px 54px 54px 60px 52px', gap: 8, fontSize: 9, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 2px' }}>
              <span>Nombre</span><span>Sup. m²</span><span>Terreno</span><span>Cubierta</span><span>Calefac.</span><span></span>
            </div>
            {(zonasUsuario || []).map(z => (
              <div key={z.id}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 70px 54px 54px 60px 52px', gap: 8, alignItems: 'center' }}>
                  <input value={z.nombre} onChange={e => onEditar(z.id, { nombre: e.target.value })} style={{ ...inputStyle }} />
                  <input type="number" min={0} value={z.superficie} onChange={e => onEditar(z.id, { superficie: Number(e.target.value) || 0 })} style={{ ...inputStyle }} />
                  <input type="checkbox" checked={z.tocaTerreno !== false} onChange={e => onEditar(z.id, { tocaTerreno: e.target.checked })} style={{ justifySelf: 'center', width: 16, height: 16 }} />
                  <input type="checkbox" checked={z.tocaCubierta !== false} onChange={e => onEditar(z.id, { tocaCubierta: e.target.checked })} style={{ justifySelf: 'center', width: 16, height: 16 }} />
                  <input type="checkbox" checked={z.calefaccionada !== false} onChange={e => onEditar(z.id, { calefaccionada: e.target.checked })} style={{ justifySelf: 'center', width: 16, height: 16 }} />
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button onClick={() => setExpandida(expandida === z.id ? null : z.id)} title="U y ventanas de la zona"
                      style={{ background: 'none', border: 'none', color: expandida === z.id ? 'var(--accent)' : 'var(--ink-3)', cursor: 'pointer', fontSize: 14 }}>⚙</button>
                    <button onClick={() => onEliminar(z.id)} title="Eliminar zona" style={{ background: 'none', border: 'none', color: 'var(--bad)', cursor: 'pointer', fontSize: 15 }}>✕</button>
                  </div>
                </div>
                {expandida === z.id && (
                  <div style={{ margin: '6px 0 10px', padding: 10, background: 'var(--bg-alt)', borderRadius: 6, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 4 }}>U por zona (W/m²K · vacío = usa el del proyecto)</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['muro', 'techo', 'piso'].map(el => (
                          <label key={el} style={{ fontSize: 10, color: 'var(--ink-2)' }}>
                            {el}<br />
                            <input type="number" min={0} step={0.01} placeholder={uValuesProyecto[el] != null ? String(uValuesProyecto[el]) : '—'}
                              value={z.uValues?.[el] ?? ''} onChange={e => setU(z, el, e.target.value)}
                              style={{ ...inputStyle, width: 64 }} />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 4 }}>Ventanas por orientación (m²)</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['N', 'E', 'S', 'O'].map(o => (
                          <label key={o} style={{ fontSize: 10, color: 'var(--ink-2)' }}>
                            {o}<br />
                            <input type="number" min={0} value={z.areasVidrio?.[o] ?? 0} onChange={e => setVidrio(z, o, e.target.value)}
                              style={{ ...inputStyle, width: 52 }} />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={onAgregar} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Agregar zona</button>
            <button onClick={onLimpiar} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 6, padding: '7px 14px', fontSize: 11, color: 'var(--ink-3)', cursor: 'pointer' }}>Volver a modo automático</button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 10, fontStyle: 'italic', lineHeight: 1.5 }}>
            Marca <b>Terreno</b>/<b>Cubierta</b> según la exposición real de cada zona. Las zonas <b>no calefaccionadas</b>
            (estacionamiento, bodega) no suman a la demanda. Las zonas usan los U del proyecto; superficie y exposición las defines tú.
          </div>
        </>
      )}
    </Card>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────
function Card({ titulo, subtitulo, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg, 12px)', padding: 20, marginBottom: 16,
    }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
          {titulo}
        </h3>
        {subtitulo && (
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>
            {subtitulo}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function BigKPI({ label, value, sub, color, badge }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</span>
        {badge}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1.1, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ink-3)', marginBottom: 4, fontWeight: 600 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '6px 10px', fontSize: 12,
  border: '1px solid var(--line)', borderRadius: 6,
  background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit',
}
