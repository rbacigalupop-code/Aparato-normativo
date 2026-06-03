# 🔬 Auditoría de la Calculadora U — NormaCheck

> Revisión técnica del motor de cálculo térmico/higrotérmico contra la fuente
> oficial: **NCh853:2021** (transmitancia), **NCh1973:2014** (condensación) y la
> **planilla oficial MINVU de análisis higrotérmico** (v2025-11).
>
> Fecha auditoría: 2026-05-27 · Modelo: Claude Opus 4.8

---

## Condiciones de diseño oficiales (planilla MINVU · NCh1973:2014)

| Parámetro | Valor oficial | Estado en el código |
|---|---|---|
| Temp. interior θi | **19 °C** | 20 °C (conservador, se mantiene) |
| HR interior φi | **73 %** | HR de zona 60-80 % ✅ alineado |
| HR crítica superficial φsicr | 75 % (criterio moho) | punto de rocío 100 % (más estricto) |
| Mes de análisis | Julio (mes crítico) | punto único de diseño |
| Método condensación | Mensual + acumulación [kg/m²] | Glaser punto único (simplificado) |
| Rsi muro / Rse | 0,130 / 0,040 | 0,13 / 0,04 ✅ |
| Cámara no ventilada | **Variable según espesor** | fijo 0,18 ⚠️ (ver pendiente B) |

**Hallazgo clave:** la HR interior alta (~73-78 %) que usa el código **es
correcta** según la norma oficial. La detección "agresiva" de condensación NO
es un bug, es el comportamiento normativamente correcto.

---

## ✅ Corregido (commits 9df7e9d + este)

1. **`satP` sobre hielo bajo 0°C (ISO 13788)** — `data.js` y `clima_mensual.js`.
   Antes usaba coeficientes sobre agua a toda temperatura; ahora cambia a
   hielo cuando T<0°C. Crítico para zonas frías F/G/H/I. Verificado: T≥0
   idéntico (sin regresión), T=−6°C → 368 Pa (hielo) vs 390 (agua).

2. **Deduplicación RSI** — `App.jsx` usa `RSI_MAP` en vez de constantes inline.

3. **Citas normativas de condensación** — corregidas de NCh853:2021 a
   **NCh1973:2014** en informe, UI y tablas de normativa. (NCh853 se mantiene
   para transmitancia U, que es lo correcto.)

4. **Suite de tests de regresión** — `src/__tests__/calcU.test.js` (14 tests).
   Blinda satP, dewPoint, calcGlaser (U + condensación), calcU_ISO6946
   (puente térmico) y calcU_SC. Ejecutar: `npm test`.

---

## ✅ (B) Cámara de aire: resistencia variable según espesor — **HECHO**

Implementado (commit posterior a 3207dfd):
  · `resistenciaCamara(esp_m)` en data.js — interpolación lineal ISO 6946:
    5mm→0.11 · 7mm→0.13 · 10mm→0.15 · 15mm→0.17 · ≥25mm→0.18.
  · Usado en los 5 puntos de cálculo (calcGlaser, calcR_ISO6946_helper ×2,
    _calcGlaserSimple, calcU_SC) + 4 display/desglose.
  · UI: el espesor de cámara ahora es editable (input en mm) y muestra la
    R resultante en vivo.
  · Plumbing del espesor a través de calcularConCapas + efecto initData.
  · **RETROCOMPATIBLE:** sin espesor → 0.18 (proyectos guardados y cámaras
    del catálogo SC sin esp quedan idénticos). Cero regresión.
  · 5 tests nuevos en calcU.test.js (19 total).

PENDIENTE menor de B (futuro): grado de ventilación (la cámara muy ventilada
debería anularse / usar Rse; hoy solo modela "no ventilada").

---

## ⏳ PENDIENTE — recordar en sesiones futuras

### Otras mejoras de mayor alcance (futuras)

- **Método mensual completo (NCh1973:2014):** balance de 12 meses con
  acumulación/evaporación de condensado [kg/m²], en vez del Glaser de punto
  único. La planilla oficial MINVU es Excel descargable y sirve de oráculo:
  `Planilla-analisis-higrotermico_Excel365_v2025-11.zip`. El módulo
  Higrotérmico (WUFI) podría absorber esto.

### ✅ (3) Criterio de moho 75 % HR superficial — HECHO (commit 7f5c0c7)

`fRsiMinMoho` + `tempDeSatP` en data.js; `calcGlaser` devuelve fRsi/TsiInt/
fRsiMin75/riesgoMoho. **Mostrado como INFORMATIVO (no gate):** con HR interior
alta (73-78%) el umbral 75% se dispara en casi todo en zonas frías (el aire
interior ya está cerca del 75%) — físicamente real pero no accionable como
pass/fail. El criterio DOM sigue siendo condensación (rocío) + U; el moho se
gestiona con ventilación (NCh3309). 3 tests.

### ✅ (2) Método mensual (NCh1973:2014 / ISO 13788) — YA EXISTÍA + tests

**Hallazgo:** el método mensual completo NO faltaba — ya está implementado en
`src/lib/engines/glaser_mensual.js` (`analizarGlaserAnual`) y expuesto en el
módulo **Higrotérmico (WUFI)** (Energético → Detalles). Hace: Glaser de 12
meses, acumulación/secado, criterio ISO 13788 (peak ≤200 g/m², balance final
≤0) y veredicto (sin_riesgo / autoseca / peak_alto / acumula). Usa el `pvSat`
que ya corregimos (agua/hielo).

Agregados 9 tests de regresión (`glaser_mensual.test.js`).

⚠️ **Hallazgo nuevo (pendiente):** el motor **sobreestima la TASA absoluta** de
condensación (modelo simplificado `δ·exceso/Sd` en vez del flujo neto ISO
13788). Los valores en g/m² no son confiables (un muro vapor-abierto da ~1000
g/m²). El **veredicto cualitativo** (cuántos meses condensan, se acumula vs se
seca) SÍ es usable. El módulo ya lo advierte en su UI. Mejorar la tasa a flujo
neto (g_c = δ·(Δpv_entra − Δpv_sale)/Sd) es trabajo futuro.

- **(4) RSE_MAP.piso = 0.13:** verificar contra la tabla de piso de NCh853 §7.
  Los manuales aportados no traen la tabla de resistencias superficiales por
  dirección de flujo (el ejemplo de condensación era un muro: Rsi 0.13/Rse 0.04).
  El valor 0.13 es una convención para "piso ventilado/sobramiento" (ver comentario
  en data.js + UI). El estándar ISO 6946 para piso sobre aire exterior sería
  Rse=0.04. **NO se cambió** — podría ser convención chilena intencional;
  requiere confirmar la fuente antes de tocar (riesgo de cumplimiento).

- **(6) Nomenclatura R_upper/R_lower** en `calcR_ISO6946_helper`: están invertidos
  respecto al convenio ISO 6946 (isothermal=lower limit, adiabatic=upper limit).
  **NO afecta el U final** (es el promedio, conmutativo), solo las etiquetas
  mostradas en el `aviso_puente` de acero. Cosmético; NO se cambió para no
  arriesgar la lógica del perfil de temperatura (que usa el valor isotérmico).

- **(7) Validar contra la planilla Excel oficial:** correr ~10 casos en la
  planilla MINVU y comparar U/condensación con el motor, agregándolos como
  tests. La suite ya tiene 29 tests (calcU + fire) como base.

---

## ✅ (5) Refactor `obtenerRFOGUC` — HECHO (commit 249e044)

La firma tenía el primer parámetro mal nombrado (`uso`→`destino`) y el wrapper
`getRFOGUC_loaded` pasaba los args descolocados sin `elemento` → siempre null →
contradicciones CUMPLE/NO CUMPLE (caso Martin Contreras). Corregido en fire.js
+ App.jsx, con test de regresión en `src/__tests__/fire.test.js`.

---

## Fuentes
- Manuales-tecnicos-MINVU.pdf (biblioteca de materiales NCh853:2021 + ISO 10456)
- Actualizacion-RT_DITEC.pdf (actualización Reglamentación Térmica)
- Planilla oficial: https://www.minvu.gob.cl/wp-content/uploads/2025/12/Planilla-analisis-higrotermico_Excel365_v2025-11.zip
