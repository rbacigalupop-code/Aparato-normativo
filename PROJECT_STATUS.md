# 📊 Talora — Estado del Proyecto

**Última actualización:** 2026-09-30
**Versión actual:** v9.35.2 (verificador normativo OGUC + térmica)
**Estado:** ✅ En producción, estable
**Build:** ✅ Exitoso · **Tests:** ✅ 456/456 pasando (31 archivos)

> _Talora_ es el nombre de marca actual del producto antes conocido como
> _NormaCheck_. El código y la UI ya usan "Talora"; las secciones históricas
> más abajo conservan el nombre antiguo por trazabilidad.

---

## 🧭 ESTADO ACTUAL (2026-09-30)

- **Rebrand a Talora:** completado en toda la app y documentos legales.
- **Salud técnica:** 456 tests unitarios verdes; `vite build` sin errores.
- **Carga:** `html2pdf` (~982 KB) y `xlsx` (~429 KB) se cargan de forma
  perezosa (dynamic `import()`), fuera del bundle inicial.
- **Trabajo reciente (v9.30–v9.36):** motor de cumplimiento de 5 estados
  (fin del fail-open), térmica comparando el U real, clasificación de piso en
  envolvente, vigencia normativa LOSCAT E14 (MINVU), y flujo de registro con
  consentimiento de Política de Privacidad.
- **Higiene de repo:** `docs/PDA/` (~680 MB de referencia normativa), `tmp/`,
  material de skills y backups locales quedan fuera del repo vía `.gitignore`.

### Deuda técnica conocida (no bloqueante)
- `src/App.jsx` es un monolito (~695 KB); el chunk `index` ronda 1.6 MB
  (gzip ~423 KB). Un code-split por módulos bajaría la carga inicial, pero es
  de alto riesgo y está fuera del alcance de "pulido".

---

## 🔧 SESIÓN DE PULIDO (2026-09-30) — desplegada en producción

Cuatro commits, todos con 456/456 tests y build limpio, verificados en vivo
y confirmados en producción (`taloraapp.vercel.app`):

- **`30ac47f` — Higiene + import supabase:** `ogucData.js` pasó de 3 `import()`
  dinámicos de `supabase.js` a un import estático (elimina el warning de build).
  `.gitignore` ampliado (excluye `docs/PDA/` ~680 MB, `tmp/`, material de skills,
  `*.backup-*`). Eliminado `App.jsx.backup-pre-design-c` (último resto de
  "NormaCheck"). PROJECT_STATUS actualizado a v9.35.
- **`59b7c56` — 2 bugs de consola:** (1) las `<option>` de materiales usaban
  `key={m.n}`; con dos materiales de igual nombre React emitía "two children
  with the same key" (riesgo de duplicar/omitir opciones) → `key` única por
  grupo. (2) `ModeSwitcher` mezclaba `border` (shorthand) y `borderColor`
  → shorthand completo. Verificado runtime: 0 warnings.
- **`bbbe502` — Materiales duplicados + feedback al calcular:**
  · `materiales_oficial.js`: "Acero inoxidable (ρ=7900)" y "Yeso (ρ=900)"
    venían duplicados con λ distinto (misma etiqueta y value → 2ª variante
    inseleccionable). Se renombró la 2ª de cada par añadiendo λ, dejando la 1ª
    intacta (no rompe proyectos guardados). Nota de reimportación en el header.
  · Cálculo U: pulsar "Calcular U" con capas sin espesor ya no es un no-op
    silencioso; `calcular()` valida y muestra un aviso. Placeholder del espesor
    cambiado de "100" (parecía valor) a "mm".
- **`f31a206` — Transmitancia U a 2 decimales:** el U se mostraba con 3–4
  decimales, inconsistente con los U-máx normativos (0.45, 0.28…). Ahora toda
  la vista de Cálculo U va a 2 decimales (tarjeta, badge, banner, resumen ΔU en
  `App.jsx`; y los 10 `impactoU` de correcciones en `data.js`). Motor y export
  PDF conservan su precisión interna (4 dec.).

**Investigado y descartado (sin cambios):** `ERR_CONNECTION_REFUSED` en consola
solo aparece en localhost (dev); producción queda 100% limpia. No es `fetch`,
recursos del DOM ni Vite HMR. La app solo llama a Google Fonts y Supabase
(ambas OK). Artefacto del navegador embebido/dev.

---

## ✅ INCIDENCIAS RESUELTAS

### 1. **Crash del módulo de fuego (TabFuego)**
- **Problema:** Crash en TabSoluciones cuando se evaluaban requisitos de fuego
- **Causa:** El campo `uso` (tipo de edificio) se inicializaba como string vacío
- **Solución:** 
  - Cambiar inicial state a `uso: 'Vivienda'` (default)
  - Agregar validaciones defensivas en evaluar() y ev() functions
  - Actualizar TabTermica, TabFuego, TabAcustica para usar `'Vivienda'` como default
- **Commit:** d8d425f + 335c5e6
- **Estado:** ✅ RESUELTO

### 2. **Error 406 "Not Acceptable" en perfiles_usuario**
- **Problema:** Supabase error 406 al cargar perfil de nuevo usuario
- **Causa:** Método `.single()` lanza error cuando no encuentra resultado (perfil no existe aún)
- **Solución:** 
  - Cambiar `.single()` a `.maybeSingle()` en obtenerPerfil()
  - Agregar null check para perfiles faltantes
  - Implementar SQL trigger para auto-crear perfiles
- **SQL Trigger:** `/sql/001_create_user_profile_trigger.sql`
- **Commit:** 335c5e6
- **Estado:** ✅ RESUELTO (trigger pendiente de ejecutar en Supabase)

### 3. **ReferenceError: getLetraOGUC_loaded is not defined**
- **Problema:** TabFuego no tiene acceso a getLetraOGUC_loaded
- **Causa:** Variable definida en AppInner pero no pasada como prop
- **Solución:**
  - Agregar `getLetraOGUC` al signature de TabFuego
  - Pasar prop desde App.jsx: `<TabFuego ... getLetraOGUC={getLetraOGUC_loaded} />`
  - Usar prop en TabFuego para cálculos de letra OGUC
- **Commit:** 335c5e6
- **Estado:** ✅ RESUELTO

---

## ✨ CARACTERÍSTICAS IMPLEMENTADAS (PLAN)

### 1. **Migración de Tokens Legacy** ✅
Permite usuarios con tokens antiguos (OGUC-XXXX-XXXX-XXXX) migrar automáticamente a cuentas de usuario.

**Archivos:**
- `src/MigrationGate.jsx` - Detecta tokens y ofrece migración
- `src/components/MigrationModal.jsx` - Formulario de conversión
- `src/supabase.js` - Funciones: `obtenerTokenLegacy()`, `contarProyectosToken()`, `convertirTokenAUsuario()`

**Flujo:**
1. Usuario ingresa con token antiguo
2. Sistema valida si existe en tabla `tokens`
3. Muestra banner "Convertir a cuenta"
4. Usuario ingresa email + password
5. Sistema crea usuario en Auth + perfil + org
6. Migra proyectos automáticamente
7. Nueva sesión Auth funciona

**Estado:** ✅ Implementado y deployado

---

### 2. **Dashboard de Estadísticas para Admins** ✅
Panel exclusivo para administradores con métricas de organización.

**Archivo:**
- `src/modules/AdminStats.jsx`

**Métricas:**
- Total de usuarios activos
- Total de proyectos
- Proyectos creados este mes
- Último acceso en la organización
- Tabla de actividad reciente (últimas 20 acciones)
- Top 5 usuarios más activos

**Funciones en supabase.js:**
- `obtenerStatsOrganizacion(orgId)` - Totales y resúmenes
- `obtenerActividadOrganizacion(orgId, limit)` - Registro de auditoría
- `obtenerUsuariosActivos(orgId, limit)` - Usuarios con más proyectos

**Acceso:**
- Tab "⚙ Admin" → subtab "📊 Estadísticas"
- Solo visible para usuarios con `isAdmin === true`

**Estado:** ✅ Implementado y deployado

---

### 3. **Validaciones y Manejo de Errores Mejorados** ✅
Sistema unificado de validaciones y mensajes de error amigables.

**Archivos:**
- `src/utils/validation.js` - Validadores reutilizables
- `src/utils/errors.js` - Mapeo y manejo de errores

**Validadores:**
- `validarEmail(email)` - Formato de email
- `validarPassword(password)` - Requisitos de seguridad (8+ chars, mayúscula, número, especial)
- `validarNombre(nombre)` - 3-100 chars, sin números
- `validarCoincidencia(val1, val2, fieldName)` - Campos iguales
- `validarNombreProyecto(nombre)` - 1-200 chars
- `validarRol(rol)` - admin | viewer
- `validarEmailUnico(email, list)` - Email no duplicado
- `validarInvitacionUsuario(data, extras)` - Validación completa de invitación
- `validarFormularioSignup(data)` - Validación de form signup
- `validarFormularioLogin(data)` - Validación de form login

**Manejo de Errores:**
- `mapSupabaseError(error)` - Traduce errores Supabase a mensajes amigables
- `createError(message, code, details)` - Objeto error estándar
- `createSuccess(data)` - Objeto éxito estándar
- `categorizarError(error)` - Categoriza por tipo (VALIDATION, AUTH, DB, NETWORK, etc)
- `formatearErrores(errores, sep)` - Concatena errores para display

**Mensajes amigables:**
- "Email o contraseña incorrectos" en lugar de errores técnicos de Supabase
- "Este email ya está registrado" para duplicados
- "Por favor confirma tu email antes de ingresar" para unconfirmed users
- "Demasiados intentos. Intenta más tarde." para rate limiting

**Estado:** ✅ Completamente implementado y en uso

---

## 📋 ARCHIVOS CREADOS/MODIFICADOS

### Nuevos archivos:
- ✅ `SETUP_SUPABASE.md` - Instrucciones para ejecutar SQL trigger
- ✅ `sql/001_create_user_profile_trigger.sql` - PostgreSQL trigger
- ✅ `sql/README.md` - Documentación de migraciones SQL

### Archivos modificados:
- ✅ `src/App.jsx` - Wrapping con MigrationGate, AdminStats integrado
- ✅ `src/supabase.js` - +13 funciones nuevas (token migration, admin stats)
- ✅ `src/MigrationGate.jsx` - Componente detecta tokens (ya existía)
- ✅ `src/components/MigrationModal.jsx` - Formulario migración (ya existía)
- ✅ `src/modules/AdminStats.jsx` - Dashboard admin (ya existía)
- ✅ `src/utils/validation.js` - Validadores unificados (ya existía)
- ✅ `src/utils/errors.js` - Error mapping (ya existía)

---

## 🔧 PRÓXIMOS PASOS REQUERIDOS DEL USUARIO

### ⚠️ CRÍTICO: Ejecutar SQL Trigger en Supabase

Para que los nuevos usuarios se registren sin error 406, **DEBES ejecutar UNA SOLA VEZ** el SQL trigger en Supabase:

1. **Abre Supabase Console:**
   ```
   https://app.supabase.com/project/srukzfoerdgcaymnriax/sql/
   ```

2. **Copia el contenido de:**
   ```
   /sql/001_create_user_profile_trigger.sql
   ```

3. **Pega en el editor SQL de Supabase y haz clic en Run (▶)**

4. **Verifica:**
   - Registra un usuario nuevo
   - Inicia sesión
   - Si NO ves error 406 → ✅ Funcionó

Ver: `SETUP_SUPABASE.md` y `sql/README.md` para detalles completos.

---

## 🧪 TESTING CHECKLIST

- [ ] Ejecutar SQL trigger en Supabase (arriba)
- [ ] Registrar usuario nuevo y verificar no hay error 406
- [ ] Iniciar sesión exitosamente
- [ ] Tab "Soluciones" carga sin crashes
- [ ] Evaluar requisitos de fuego → no hay errors de undefined
- [ ] Tab "⚙ Admin" → subtab "📊 Estadísticas" muestra datos
- [ ] Solo admins ven tab de estadísticas
- [ ] Formulario de login rechaza emails/passwords inválidos
- [ ] Formulario de signup valida passwords débiles
- [ ] Mensajes de error son claros y amigables

---

## 📦 BUILD & DEPLOYMENT

**Status:** ✅ Exitoso  
**Bundle size:** 815.66 kB (gzipped: 223.47 kB)  
**Warnings:** None (solo warnings de bundle size, que son advisories)  
**Vercel:** Automáticamente deployado en cada push a `main`

**Commits recientes:**
```
f6351af - Docs: Add SQL trigger for automatic user profile creation
335c5e6 - Fix Supabase 406 error and getLetraOGUC_loaded undefined reference
d8d425f - Fix fire module crash caused by empty uso (building use) value
```

---

## 📞 RESUMEN TÉCNICO

### Antes (Estado anterior):
- ❌ TabFuego crasheaba con undefined errors
- ❌ Nuevos usuarios recibían error 406 al login
- ❌ Validaciones inconsistentes entre componentes
- ❌ Sin migración para tokens legacy

### Ahora (Estado actual):
- ✅ TabFuego funciona con defaults defensivos
- ✅ Error 406 solucionado con .maybeSingle() + SQL trigger
- ✅ Validaciones centralizadas y reutilizables
- ✅ Sistema completo de migración de tokens legacy
- ✅ Dashboard de estadísticas para admins
- ✅ Manejo unificado de errores con mensajes amigables

---

## 🎯 PRÓXIMAS MEJORAS (Futuro)

- Code-split de grandes módulos (xlsx, etc)
- Caché de estadísticas en Redis
- Gráficos históricos en AdminStats
- Exportación de reportes
- Rate limiting granular por usuario

---

**¿Preguntas o issues?** Revisar `SETUP_SUPABASE.md` primero.
