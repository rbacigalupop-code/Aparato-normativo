# 🔴 BUG CRÍTICO PENDIENTE — Discrepancia calculadora vs informe

**Reportado:** 2026-05-27
**Severidad:** Alta
**Estado:** Banner defensivo desplegado · Fix pendiente
**Punto de retoma:** commit `<este_commit>` en adelante

---

## Síntoma reportado por el usuario

> "En la calculadora aparecen todos los problemas de resistencia al fuego y de
> condensación resueltos, pero en el informe (PDF y preview) salen con
> observaciones / no cumple."

Producto entregado al cliente final = información **inconsistente**.

---

## Diagnóstico preliminar (sin confirmar 100%)

### Origen probable del bug

**Archivo:** `src/App.jsx`
**Función:** `getCalcUData(elemKey)` dentro de `TabResultados → exportarInforme()`
**Líneas aproximadas:** 6266–6279

```javascript
function getCalcUData(elemKey) {
  const entries = Object.entries(calcUInit || {})
    .filter(([k, v]) => (k === elemKey || k.endsWith('::' + elemKey)) && v)
  if (!entries.length) return null

  // Buscar match con la solución ACTUAL aplicada
  const solActual = termica?.[elemKey]?.solucion?.cod
  if (solActual) {
    const matching = entries.find(([, v]) => v?.solucion?.cod === solActual)
    if (matching) return matching[1]
  }

  // ⚠ Fallback PROBLEMÁTICO: ordenar por U descendente → tomar el peor caso
  entries.sort((a, b) => parseFloat(b[1]?.res?.U || 0) - parseFloat(a[1]?.res?.U || 0))
  return entries[0][1]
}
```

### Cadena del bug

1. Usuario aplica una **corrección automática** en Cálculo U (ej: "C2 Fachada Ventilada")
2. `calcUInit[elemKey]` se actualiza con las capas modificadas y el nuevo `res.U` (cumple)
3. **Pero `termica[elemKey].solucion.cod` NO se actualiza** — sigue apuntando a la solución original
4. El informe llama `getCalcUData(elemKey)`:
   - Busca match por `solucion.cod` → no encuentra (porque la corrección no tiene `solucion.cod` propio)
   - Cae al fallback ordenando por **U descendente** → toma el peor U (el original)
5. Resultado: el informe usa el cálculo original (que **NO cumple**) en vez del corregido (que **SÍ cumple**)

### Para resistencia al fuego (RF)

Hipótesis paralela: las correcciones de fuego pueden no propagarse a `termica[elemKey].rfProp`, y el informe revalida con `rfN(rfProp) >= rfN(rfReq)` usando datos viejos.

---

## Acción defensiva ya aplicada (este commit)

**Banner amarillo visible en la pestaña Resultados** antes del selector de formato y los botones de exportar/preview. Texto:

> ⚠ Aviso importante antes de exportar
>
> Si aplicaste correcciones automáticas en la pestaña Cálculo U
> (Fachada Ventilada, EIFS, Trasdosado, aumentar espesor, etc.) o resolviste
> condensación / RF mediante corrección sugerida, te recomendamos:
>
> 1. Volver a la pestaña Soluciones y reaplicar la solución (o la corregida)
>    para asegurar que el estado del proyecto está actualizado.
> 2. Revisar la Vista previa antes de exportar — si ves "no cumple" en algún
>    elemento que en la calculadora cumple, repite el paso 1.
>
> Sabemos que el motor del informe puede usar el cálculo original cuando se
> aplica una corrección automática. Estamos trabajando en el fix.

Esto **protege a los usuarios mientras se hace el fix definitivo**.

---

## Plan de fix (próxima sesión)

### Investigación (~30 min)

1. Leer `aplicarCorreccion()` en `PanelCalcU` (línea ~4007) para confirmar qué actualiza:
   - ¿Actualiza `calcUInit[elemKey].res`? Probable que sí.
   - ¿Actualiza `termica[elemKey].solucion.cod`? Probable que **NO**.
   - ¿Marca la entrada con algún flag tipo `correccionAplicada`?

2. Revisar todos los callers de `getCalcUData`:
   - ¿Solo se usa en exportarInforme o también en otros lados?

3. Confirmar el comportamiento reproduciendo el caso:
   - Crear proyecto con solución que no cumple
   - Aplicar corrección automática
   - Generar preview del informe
   - Validar que la pre-view dice "no cumple" mientras la calculadora dice "cumple"

### Fix propuesto

**Opción A (más segura):** Cambiar el fallback de `getCalcUData` para que en vez de "tomar el peor U" tome **"el más reciente"** (último editado / con corrección aplicada).

```javascript
// Fallback: priorizar entries con correccionAplicada o con res calculado
entries.sort((a, b) => {
  // 1) Priorizar las que tienen correccionAplicada
  const ca = a[1]?.correccionAplicada ? 1 : 0
  const cb = b[1]?.correccionAplicada ? 1 : 0
  if (ca !== cb) return cb - ca
  // 2) Si ninguna o ambas, ordenar por timestamp más reciente
  const ta = new Date(a[1]?.timestamp || 0).getTime()
  const tb = new Date(b[1]?.timestamp || 0).getTime()
  if (ta !== tb) return tb - ta
  // 3) Último recurso: orden estable (no más "peor U")
  return 0
})
return entries[0][1]
```

**Opción B (más invasiva):** Cuando se aplica una corrección, actualizar `termica[elemKey]` con un código sintético o flag que la marque como corregida, y que `getCalcUData` lo respete.

**Opción C (limpia pero requiere refactor):** Unificar `calcUInit` y `termica` en una sola fuente de verdad.

**Recomendación:** Opción A es la menos invasiva y resuelve el síntoma reportado.

### Fix para RF (resistencia al fuego)

Buscar dónde el informe evalúa `cumpleRF` para cada elemento. Probablemente está en la sección térmica del HTML del informe o en `TabFuego`. Verificar que use el mismo origen de datos que la pestaña Fuego.

### Validación post-fix

1. Reproducir el caso reportado (preview mostraba "no cumple" cuando calculadora decía "cumple")
2. Aplicar fix
3. Verificar que ahora ambos digan "cumple"
4. **Quitar el banner amarillo** que pusimos defensivamente

---

## Archivos a revisar/modificar

| Archivo | Qué revisar / cambiar |
|---|---|
| `src/App.jsx` líneas 6266–6279 | Función `getCalcUData` — cambiar lógica de fallback |
| `src/App.jsx` línea ~4007 | `aplicarCorreccion` — agregar timestamp/flag al guardar |
| `src/App.jsx` líneas 7800+ | Quitar banner amarillo defensivo después del fix |
| `src/App.jsx` lógica de fuego | Verificar evaluación `cumpleRF` en el informe |

---

## Cómo retomar mañana

```
Abrir Claude Code → mismo directorio
Mensaje al modelo:

"Retomo el bug crítico del informe documentado en
docs/BUG_PENDIENTE_INFORMES.md. Necesito:
1. Reproducir el caso (aplicar corrección, ver preview, confirmar discrepancia)
2. Aplicar la Opción A (cambiar fallback de getCalcUData)
3. Validar que cumple = cumple en calculadora e informe
4. Quitar el banner amarillo defensivo
Hacé un commit por paso para revertir si algo sale mal."
```

---

**Última actualización:** 2026-05-27
**Próxima sesión:** retomar con el plan de fix de arriba.
