# Auditoría de coherencia — Fase 0 (2026-06-13)

Barrido sistemático de los 14 engines y la coherencia entre módulos.
Sonda repetible: `node scripts/audit-coherencia.mjs`. Solo lectura, no modifica nada.

Leyenda: **ALTA** = afecta veredictos o deja sin verificación · **MEDIA** = inconsistencia/verificar · **BAJA** = borde/limpieza.
Estado: ⬜ pendiente · 🔶 esperando confirmación de norma · ✅ resuelto.

---

## Fuentes oficiales y Tabla 1 verificada (DS modificatorio OGUC 4.1.10)
Diario Oficial 27-05-2024 (CVE 2494861), vigente 28-11-2025. Tabla 1 extraída por
coordenadas desde la guía DITEC y cruzada con la app. **U-máx (W/m²K):**

| Zona | Techo | Muro | Piso vent. |
|---|---|---|---|
| A | 0.84 | 2.10 | 3.60 |
| B | 0.47 | 0.80 | **0.70** |
| C | 0.47 | 0.80 | 0.87 |
| D | 0.38 | 0.80 | 0.60 |
| E | 0.33 | 0.60 | 0.60 |
| F | 0.28 | 0.45 | 0.50 |
| G | 0.28 | 0.40 | 0.39 |
| H | 0.25 | 0.30 | 0.32 |
| I | 0.25 | 0.35 | 0.35 |

La norma **NO es monótona**: zona H (cordillera extrema, Putre/Lonquimay) es más exigente
que I (austral marítima). Las demás 26 celdas de la app coinciden con el oficial.

## ALTA

### A1 — Monotonicidad de ZONAS ✅ CERRADO (falso positivo)
Mi sonda asumió "más al sur = más estricto" y marcó I (0.35) > H (0.30). **Verificado contra
la Tabla 1 oficial: los valores de la app son correctos** — la norma es no-monótona por clima.
Chequeo de monotonicidad retirado de la sonda.

### Z1 — Zona B, piso ventilado: 0.87 → 0.70 ✅ CORREGIDO
`src/data.js` · ZONAS.B.piso
- La app tenía **0.87**; el oficial es **0.70** (verificado Tabla 1). Era *menos* exigente que la
  norma → habría dado CUMPLE a pisos que fallan en zona B.
- Corregido. Resto de ZONAS = idéntico al oficial.

### A2 — Modelo de cumplimiento de VENTANAS ✅ RESUELTO
El DS N°15 no usa U-máx único por zona: usa la **Tabla 3 = % máx de superficie vidriada según
U de la ventana y orientación** (N/O-P/S/OGT, 12 brackets de U). La app tenía 2 modelos errados
(`UMAX_VENTANA_DS15` U-máx fijo, y `VPCT` recortado a 3 niveles).
- **Paso 1** (`9cdbca5`): `src/data/ds15_ventanas.js` con la Tabla 3 oficial completa (432 valores,
  extraída por coordenadas + verificada contra imagen oficial) + `maxVidriadoVentana()`/`cumpleVentana()`
  + test `ds15_ventanas.test.js`.
- **Paso 2** (`7dee15d`): UI del Analizador VPCT por fachada, resumen, tabla de referencia (3→12
  columnas + fila OGT) e informe PDF (2 bloques) — todo usa la Tabla 3. "Nivel 1/2/3" → bracket de U.
  Quitado import muerto de VPCT.
- **Paso 3** (`71cbfda`): VentanasDetalladas (Energético) reformulado a informativo (% máx por
  orientación a esa U), sin el pass/fail erróneo por U sola.

### A3 — Campo `zonas` de las SC sobre-declara cumplimiento ✅ RESUELTO
`src/data.js` · SC[*].zonas + obs · `src/App.jsx` · `src/lib/engines/thermal.js`
- **Raíz de diseño:** `zonas` se curaba a mano y hacía doble función, mientras el cumplimiento real se calcula aparte (`tOk = U ≤ U-máx`). Sobre-listar → semáforo T rojo visible; **sub-listar** → ocultaba opción válida en silencio; `obs` "Cumple todas las zonas A-I" = afirmación falsa.
- **A3a (lógica):** la aplicabilidad ahora deriva del **uso** (`s.usos`), y la aptitud térmica del **cálculo** (`U ≤ U-máx de la zona`), no del campo `zonas`.
  - `App.jsx` `evaluar()`/`ev()`: `aplica = (s.usos||[]).includes(uso)`. Display "Cumple térmico (U≤U-máx) en zonas: …" calculado iterando ZONAS. Alternativas (térmica + RF/Rw) filtran por `ev.aplica && ev.total===3`, no por `zonas`.
  - `thermal.js` `buscarSolucionesTermicas`: quitado el filtro por `zonas`; la aptitud por zona la da el filtro de U-máx.
- **A3b (obs):** de 22 `obs` con afirmación universal, solo 2 eran falsas → corregidas:
  - `1.2.M.D2.2` (muro U=0.31): "Cumple A-I" → "Cumple A-G e I; no alcanza U-máx 0.30 de zona H".
  - `3.2.V.A.T.1.03` (ventana U=0.80): "Cumple A-I" → bracket Uw≤0.8 de Tabla 3 (cumplimiento por % vidriado).
  - Resto verificado correcto (muro 0.29≤0.30, techo 0.24≤0.25, puertas todas ≤1.70).
- Bloqueado por `src/__tests__/obs_sin_cumplimiento_falso.test.js` (escanea todo `obs` universal vs U-máx más estricto).

### A4 — Comunas multi-zona: se aplicaba solo una zona ✅ RESUELTO
`src/utils/zonaStorage.js` · `src/modules/TabDiag.jsx`
- Algunas comunas abarcan **2 zonas** térmicas según altitud/sector (Putre, General Lagos,
  San Pedro de Atacama → A y H; Lonquimay, Curarrehue, Curacautín → F y H). El buscador
  mostraba ambas filas, pero:
  - `seleccionar()` usaba `resolveZona()` (primera coincidencia) e **ignoraba la fila
    clicada** → siempre aplicaba la primera zona (A/F).
  - El chequeo de divergencia colapsaba a una sola zona → al elegir la otra, la marcaba
    falsamente como "Zona modificada manualmente".
- **Resuelto:** `resolveZonas()` (plural) devuelve todas las zonas oficiales; `getOverrideZona()`
  separa el override del admin. `seleccionar()` ahora aplica la zona de la fila elegida
  (override > fila). Divergencia solo si la zona NO es ninguna de las oficiales. Aviso
  informativo cuando la comuna es multi-zona. `key` del dropdown = `comuna-zona` (evita
  colisión React). Bloqueado por `src/__tests__/comuna_multizona.test.js`.
- **Pendiente relacionado (fuera de A4):** `configEnergetica.zonaDS15` se escribe desde
  `comunas_chile.js`, que usa un esquema A-H que **no coincide** con el oficial A-I de
  `COMUNAS_ZONA` (ej. Antofagasta A vs B, Calama A vs E). Afecta solo al módulo energético/clima.

### A5 — "Aplicar" descartaba la modificación del simulador de capas ✅ RESUELTO
`src/App.jsx` (`SimuladorCapas`, `TabSoluciones`, `onAplicar`/`onAplicarTodos`) · `src/lib/aplicarSolucion.js`
- Síntoma (reportado): solución que no cumple en zona H; al engrosar el aislante en el
  simulador, `uMod` cumple, pero al apretar **Aplicar** se traspasaba la **U certificada
  original** (que no cumple). Térmica seguía "no cumple" pese a la modificación.
- **Raíz:** `SimuladorCapas` (estado local de capas/`uMod`) no estaba conectado a `onAplicar`;
  el botón pasaba la fila original `s` con `s.u`.
- **Resuelto:** `SimuladorCapas` reporta su snapshot modificado (`{cod,u,rw,capas}` o `null`)
  vía `onModificar` → `TabSoluciones` lo guarda en `modSim`. Los botones Aplicar / Aplicar
  a todos pasan `modSim` y `onAplicar`/`onAplicarTodos` aplican la **U recalculada + capas
  modificadas** (marcadas `modificada:true`, conservando `uOriginal`). El label del botón
  muestra "(U=… modificada)". Regla centralizada en `resolverAplicacionSC()` (puro).
- Bloqueado por `src/__tests__/aplicar_solucion_modificada.test.js`.

---

## MEDIA

### M1 — Puertas: 3 tablas inconsistentes, todas erradas vs oficial ✅ CORREGIDO
Verificado contra Tabla 1 oficial: puertas opacas = **1.70 W/m²K uniforme B-I**, A sin exigencia.
Había TRES definiciones distintas:
- `PUERTA_U` (data.js, Térmica/Resultados): F-I=2.0 → corregido a 1.7.
- `UMAX_PUERTA_DS15` (data/puertas_detalladas.js, módulo Puertas): usaba el **umbral de ventanas**
  (5.8→1.8) → puertas casi sin verificar (aceptaba U=3.0). Corregido a 1.70 B-I.
- Ahora ambas convergen al oficial. Bloqueado por `src/__tests__/ds15_oficial.test.js`.

### M2 — Engine de acústica desconectado + fórmula incorrecta ✅ RESUELTO
`src/lib/engines/acoustic.js` · App.jsx:7
- **Imports muertos:** App.jsx importaba `validarRwCumplimiento, obtenerRwRequerido, buscarSolucionesAcusticas` sin llamarlos (la pestaña calcula Rw inline por ley de masa `20·log10(masa)+14`). Import eliminado.
- **Fórmulas corregidas** (usaban paralelo con factor -20 = presión, donde corresponde -10 = potencia):
  - `estimarRwComposicion` → composición en **paralelo** real (elementos lado a lado, p. ej. muro+ventana): `R=-10·log10(Σ Si·τi/ΣSi)` (ISO 12354-3, ponderado por área). El camino débil domina.
  - `calcularMejoraAcustica` → capas **en serie** (añadir aislación SUBE el Rw): modelo aditivo `Rw+ΣΔRw`, mejora ≥ 0 siempre. Antes daba mejora negativa.
- Engine **conservado** (funciones puras reutilizables) y bloqueado por `src/__tests__/acoustic_engine.test.js`.
- Pendiente menor (no M2): `buscarSolucionesAcusticas` aún filtra por `s.zonas`; la acústica no depende de zona climática (NCh352 por uso). Sin uso hoy.

---

## BAJA

### B1 — `calcularU([])` con capas vacías → 5.88 ⬜
`src/lib/engines/thermal.js` · devuelve 1/(Rsi+Rse) en vez de null. Edge; agregar guard si la UI puede invocarlo sin capas.

### B2 — `perdidaPTUnico(id_inválido)` → 0 silencioso ⬜
`src/lib/engines/puentes_termicos.js` · un id de puente inexistente devuelve 0 sin avisar.

### B3 — Posible código muerto en engines ⬜
Varias funciones exportadas no se llaman fuera de su archivo (economic, renovables, fire helpers, thermal helpers, acoustic). Requiere análisis de llamadas internas para confirmar (hay falsos positivos). Candidato a limpieza, no urgente.

---

## Verificado OK (sin hallazgos)
- `calcularU` / `calcularUSC`: correctos (validados contra cálculo manual).
- `etaUtilizacion13790` (ISO 13790): maneja bien γ=1 (sin NaN 0/0).
- `perdidasEnvolvente`, `HRcritico` (moho), `perdidaPTUnico`, `cumpleDS15Puerta`: salidas sanas.
- Homologación: 0 excepciones en las 123 SC.
- Catálogo SC: 0 duplicados, 0 referencias huérfanas (BH/SC_CAPAS/REC_USO), RF coherente (corregido antes).
