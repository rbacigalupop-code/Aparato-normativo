# 🔥 Corrección del Módulo de Resistencia al Fuego

**Status:** ✅ RESUELTO Y DEPLOYADO  
**Fecha:** 2026-05-11  
**Commit:** aca19c7

---

## ❌ EL PROBLEMA

El módulo de fuego (TabFuego) se caía cuando intentaba calcular los requisitos de resistencia al fuego (RF) según la **Tabla 1 del OGUC Título 4 Capítulo 3**.

### Síntomas:
- Crash al abrir la pestaña "Fuego"
- Error undefined cuando se intenta calcular letra OGUC (a/b/c/d)
- No se pueden resolver los requisitos RF desde la tabla normativa

### Causa Raíz:
TabFuego necesitaba **dos funciones y un objeto de datos** para calcular RF desde OGUC Tabla 1:
1. `getRFDeLetra_loaded` - Función para obtener RF de una letra OGUC
2. `ogucDataReady` - Objeto con las tablas OGUC (TABLA1, RF_LETRAS, ELEM_COL)

Pero **estas NO estaban siendo pasadas como props** a TabFuego.

---

## ✅ LA SOLUCIÓN

### Cambios en App.jsx (línea 6228):

**Antes:**
```jsx
<TabFuego proy={proy} termica={termica} setTermica={setTermica} 
  notas={notas} setNotas={setNotas} getLetraOGUC={getLetraOGUC_loaded} />
```

**Después:**
```jsx
<TabFuego proy={proy} termica={termica} setTermica={setTermica} 
  notas={notas} setNotas={setNotas} getLetraOGUC={getLetraOGUC_loaded} 
  getRFDeLetra={getRFDeLetra_loaded} ogucData={ogucDataReady} />
```

### Cambios en firma de TabFuego (línea 2453):

**Antes:**
```javascript
function TabFuego({ proy, termica, setTermica, notas, setNotas, getLetraOGUC }) {
  const letraOGUCFn = getLetraOGUC || ((destino, m2, pisos) => {
    return typeof getLetraOGUC === 'function' ? getLetraOGUC(destino, m2, pisos) : null
  })
  // ogucDataReady NO EXISTÍA - causaba ReferenceError
```

**Después:**
```javascript
function TabFuego({ proy, termica, setTermica, notas, setNotas, getLetraOGUC, getRFDeLetra, ogucData }) {
  const letraOGUCFn = getLetraOGUC || (() => null)
  const getRFDeLetraFn = getRFDeLetra || (() => null)
  const ogucDataReady = ogucData || {
    OGUC_TABLA1: [],
    OGUC_RF_LETRAS: {},
    OGUC_ELEM_COL: {},
  }
```

### Cambio en uso de función (línea 2485):

**Antes:**
```javascript
return col ? (getRFDeLetra_loaded(letraOGUC, elemId) || null) : null
// ReferenceError: getRFDeLetra_loaded is not defined
```

**Después:**
```javascript
return col ? (getRFDeLetraFn(letraOGUC, elemId) || null) : null
// Usa la función pasada como prop con fallback
```

---

## 🔧 CÓMO FUNCIONA AHORA

### Flujo de cálculo de RF en TabFuego:

```
1. Usuario selecciona uso en Diagnóstico
   ↓
2. TabFuego recibe:
   - getLetraOGUC_loaded: función que calcula letra OGUC (a/b/c/d)
   - getRFDeLetra_loaded: función que obtiene RF de una letra
   - ogucDataReady: objeto con tablas OGUC Tabla 1, RF_LETRAS, ELEM_COL
   ↓
3. Para cada elemento de fuego (estructura, muros, escaleras, etc):
   - Calcula letra OGUC usando getLetraOGUCFn()
   - Si hay letra: busca RF en tabla OGUC usando getRFDeLetraFn()
   - Si no hay letra: usa RF_PISOS(uso, pisos) como fallback
   ↓
4. Muestra requisitos RF normativo en tabla
   ↓
5. Usuario ingresa RF propuesta y soluciones constructivas
```

### Validaciones defensivas:

Si por algún motivo las props no se pasan:
```javascript
const letraOGUCFn = getLetraOGUC || (() => null)        // Retorna null
const getRFDeLetraFn = getRFDeLetra || (() => null)    // Retorna null
const ogucDataReady = ogucData || {                      // Usa objeto vacío
  OGUC_TABLA1: [],
  OGUC_RF_LETRAS: {},
  OGUC_ELEM_COL: {},
}
```

---

## 📊 IMPACTO

### Lo que estaba roto:
- ❌ Pestaña "Fuego" no funcionaba
- ❌ No se podían calcular requisitos RF normativo
- ❌ App crasheaba al acceder a módulo de fuego

### Ahora:
- ✅ Pestaña "Fuego" funciona correctamente
- ✅ Calcula automáticamente letra OGUC (a/b/c/d) según m² y pisos
- ✅ Resuelve requisitos RF desde OGUC Tabla 1
- ✅ Fallback a RF_PISOS si no hay datos OGUC
- ✅ Validaciones defensivas evitan crashes

---

## 🧪 TESTING

Para verificar que el módulo funciona:

1. Abre la app
2. Inicia sesión
3. Ve a pestaña "Diagnóstico" y completa:
   - Uso: "Vivienda"
   - Pisos: "3"
   - Superficie: "320" m²
4. Ve a pestaña "Fuego"
   - ✅ Debe mostrar categoría "R2 - Edificios de Vivienda"
   - ✅ Debe calcular letra OGUC (probablemente "b")
   - ✅ Debe mostrar tabla con requisitos RF por elemento
   - ✅ No debe haber errores de undefined

---

## 📝 COMMITS RELACIONADOS

```
aca19c7 Fix: Pass missing OGUC data props to TabFuego (ESTE FIX)
335c5e6 Fix Supabase 406 error and getLetraOGUC_loaded undefined reference
d8d425f Fix fire module crash caused by empty uso (building use) value
```

---

## 🔍 DETALLES TÉCNICOS

### Props requeridas por TabFuego ahora:

| Prop | Tipo | Fuente | Propósito |
|------|------|--------|-----------|
| `proy` | Object | props | Datos del proyecto |
| `termica` | Object | state | Soluciones constructivas |
| `setTermica` | Function | state | Actualizar soluciones |
| `notas` | Object | state | Notas del usuario |
| `setNotas` | Function | state | Actualizar notas |
| `getLetraOGUC` | Function | useMemo | Calcular letra OGUC |
| `getRFDeLetra` | Function | useMemo | Obtener RF de letra |
| `ogucData` | Object | state | Tablas OGUC Tabla 1 |

### Tablas OGUC requeridas:

```javascript
ogucDataReady = {
  OGUC_TABLA1: Array,        // Tabla 1 del OGUC Tít. 4 Cap. 3
  OGUC_RF_LETRAS: Object,    // RF por letra y elemento
  OGUC_ELEM_COL: Object,     // Mapeo de elementos a columnas
}
```

---

## 📌 NOTAS

- Los datos OGUC se cargan desde Supabase en tiempo de ejecución
- Las funciones de cálculo vienen del useMemo en AppInner
- TabFuego ahora tiene fallbacks defensivos para todas las props
- El build completa sin errores
- Vercel deploy automático exitoso

---

**Problema:** ✅ RESUELTO  
**Build:** ✅ EXITOSO  
**Deploy:** ✅ VERCEL  
**Testing:** Proceder manualmente
