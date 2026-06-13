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

### A2 — Modelo de cumplimiento de VENTANAS no coincide con el DS N°15 🔶
`src/lib/engines/ventanas_detalladas.js` · UMAX_VENTANA_DS15
- Se agregó zona I (= 1.4) para no dejarla sin veredicto. **PERO** la verificación de la fuente
  reveló algo de fondo: el DS N°15 **no fija un U-máx único por zona** para ventanas. Usa una
  **Tabla 3 = % máximo de superficie vidriada según U de la ventana y orientación** (N/O-P/S):
  a mayor U, menor % de ventana permitido. Una ventana U=5.8 puede ser válida si el % es bajo.
- **Impacto:** el modelo actual (un U-máx fijo por zona) es una simplificación que no refleja la
  norma. Puede rechazar ventanas válidas (U alto pero poca superficie) o aceptar inválidas.
- **Resolver:** rediseñar la verificación de ventanas según Tabla 3 (U × %vidriado × orientación).
  Es un cambio de modelo, no un número. Relacionado con A3.

### A3 — Campo `zonas` de las SC sobre-declara cumplimiento (66 soluciones) ⬜
`src/data.js` · SC[*].zonas + obs
- 66 soluciones listan zonas donde su U **no** cumple el U-máx (ej. `1.2.M.D2.2` obs dice "U=0.31 · Cumple A-I" pero 0.31 > 0.30 de H; `2.2.M.MF1.1` listada en F con U=0.52 > 0.45).
- **Raíz de diseño:** `zonas` se cura a mano y hace doble función, mientras el cumplimiento real se calcula aparte (`tOk = U ≤ U-máx`). Efectos:
  - Sobre-listar (zona donde U falla) → semáforo T rojo (visible, menor).
  - **Sub-listar** (omitir zona donde U sí cumpliría) → oculta opción válida en silencio (mayor).
  - `obs` con frases "Cumple todas las zonas A-I" = afirmación falsa de cumplimiento.
- **Resolver:** derivar la aplicabilidad térmica del cálculo (`U ≤ U-máx zona`) en vez de mantener `zonas` a mano; limpiar los `obs` que afirman cumplimiento.

---

## MEDIA

### M1 — Puertas: 3 tablas inconsistentes, todas erradas vs oficial ✅ CORREGIDO
Verificado contra Tabla 1 oficial: puertas opacas = **1.70 W/m²K uniforme B-I**, A sin exigencia.
Había TRES definiciones distintas:
- `PUERTA_U` (data.js, Térmica/Resultados): F-I=2.0 → corregido a 1.7.
- `UMAX_PUERTA_DS15` (data/puertas_detalladas.js, módulo Puertas): usaba el **umbral de ventanas**
  (5.8→1.8) → puertas casi sin verificar (aceptaba U=3.0). Corregido a 1.70 B-I.
- Ahora ambas convergen al oficial. Bloqueado por `src/__tests__/ds15_oficial.test.js`.

### M2 — Engine de acústica desconectado + fórmula incorrecta ⬜
`src/lib/engines/acoustic.js` · App.jsx:7
- App.jsx importa `validarRwCumplimiento, obtenerRwRequerido, buscarSolucionesAcusticas` pero **no las llama**: la pestaña calcula Rw inline (`20·log10(masa)+14`). Imports muertos.
- `estimarRwComposicion` y `calcularMejoraAcustica` usan fórmula de **paralelo** (`-20·log10(Σ10^(-Rwi/10))`) donde corresponde **serie** → "mejora" daría negativa (agregar aislación "empeora" el Rw). No se usan hoy, pero quedan como trampa.
- **Resolver:** borrar imports muertos; eliminar o corregir las 2 funciones; decidir si el engine se conserva.

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
