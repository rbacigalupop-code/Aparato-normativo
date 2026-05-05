# 🔍 Auditoría Exhaustiva - NormaCheck Architecture

**Fecha:** 2026-05-04  
**Conclusión:** La app tiene **5 problemas arquitectónicos críticos** que generan redundancia, inconsistencia y dificultad de mantenimiento.

---

## 📊 PROBLEMA 1: DOS SISTEMAS DE AUTENTICACIÓN PARALELOS (CRÍTICO)

### Situación Actual
- **TokenGate.jsx** - Sistema viejo con tokens `OGUC-XXXX-XXXX-XXXX`
  - Valida tokens en tabla `tokens` de Supabase
  - Guarda estado en `TokenCtx` context
  - Proyectos se guardan con `token` como clave
  
- **AuthGate.jsx** - Sistema nuevo con Supabase Auth
  - Email/password autenticación
  - Guarda perfil en `perfiles_usuario` tabla
  - Proyectos se guardan con `user_id + org_id`

### Impacto
- **Código duplicado:** Ambos sistemas tienen su propia lógica de validación, error handling, UI
- **Datos fragmentados:** Proyectos viejos usan `token`, nuevos usan `user_id+org_id`
- **Incompatibilidad:** No hay migración automática de tokens → usuarios
- **Confusión de flujo:** App.jsx soporta ambos pero no está claro cuál usa cada función
- **Mantenimiento:** Cambios en auth requieren actualizar 2 sistemas

### Evidencia
```jsx
// TokenGate.jsx línea 46 - Sistema token
export default function TokenGate({ children }) {
  const [tokenData, setTData] = useState(null)
  // ...validarToken(tokenInput)
}

// AuthGate.jsx - Sistema auth alternativo  
export default function AuthGate({ children }) {
  // ...signUp, signIn con Supabase Auth
}

// App.jsx línea 4
import MigrationGate from './MigrationGate.jsx'  // Intento parcial de migración
```

### Propuesta de Solución
**Eliminar TokenGate completamente** y hacer una **migración de tokens → usuarios**:

1. Crear endpoint/función `convertirTokenAUsuario()`:
   - Lee tabla `tokens` 
   - Crea usuario en Auth
   - Migra proyectos (`token` → `user_id + org_id`)
   - Guarda registro en tabla `tokens_migrados`

2. En AuthGate, agregar opción "¿Tienes token legacy?"
   - Mostrar formulario para convertir token a cuenta
   - User ingresa: token + email + password
   - Sistema convierte automáticamente

3. **Eliminar** TokenGate.jsx (una sola vez)

**Timeline:** 2-3 horas

---

## 📚 PROBLEMA 2: DUPLICACIÓN SEVERA EN useProjects.js

### Situación Actual
La función `useProjects()` tiene **lógica duplicada** en cada método:

```javascript
// PATRÓN QUE SE REPITE EN CADA FUNCIÓN:
async function listarProyectos() {
  if (hasAuth) {
    const rows = await listarProyectosUsuario(userId, orgId)
    // transformar respuesta
  } else {
    // fallback localStorage
    const raw = JSON.parse(localStorage.getItem(LS_PROJECTS))
    return raw
  }
}

async function guardarNuevo(nombre, data) {
  if (hasAuth) {
    await guardarProyectoUsuario(userId, orgId, id, nombre, data, [])
  } else {
    // fallback localStorage
    const item = { id, nombre, ...data }
    localStorage.setItem(LS_PROJECTS, JSON.stringify([item, ...lista]))
  }
}

async function sobrescribir(id, nombre, data) {
  if (hasAuth) {
    // generar snapshot
    // guardar a BD
  } else {
    // generar snapshot
    // guardar a localStorage
  }
}

// duplicarProyecto(), eliminarProyecto() - mismo patrón
```

### Problemas Específicos

**Problema 2a: Snapshot hardcodeado**
```javascript
// useProjects.js línea 55-63
const snap = {
  savedAt: original?.savedAt,
  proy: original?.proy,           // ← hardcodeado
  termica: original?.termica,     // ← hardcodeado
  calcUInit: original?.calcUInit, // ← hardcodeado
  fachadas: original?.fachadas,   // ← hardcodeado
  // ...más campos hardcodeados
}
```

Esto significa:
- Si alguien agrega nuevo campo a `data`, snapshot NO lo captura automáticamente
- Riesgo: Cambios en data.js no se reflejan en snapshots
- Fragil: Requiere actualizar manualmente aquí

**Mejor:**
```javascript
const snap = { savedAt: original?.savedAt, ...original.data }
```

**Problema 2b: Migración incompleta de localStorage → Supabase**
```javascript
// Existe función migrarDesdeLocalStorage() (línea 154-165)
// Pero NO se llama automáticamente en ningún lugar
// Usuario debe tener cuenta en Supabase Y localStorage para migrar
// Es un paso manual que puede olvidarse
```

**Problema 2c: Lógica de fallback mezclada**
- `hasAuth` asume que si no hay auth, puede usar localStorage
- Pero qué pasa si usuario:
  - Abre sin internet (localStorage works, auth offline)
  - Switch de dispositivo (localStorage vacío, auth works)
  - Logout intencional (datos perdidos?)

### Impacto
- **300+ líneas de código duplicado** (if/else en cada función)
- **Inconsistencia:** Si hay bug en guardar BD, hay otro igual en localStorage
- **Mantenimiento:** Cualquier cambio requiere actualizar 2 rutas
- **Testing:** Hay que probar cada función con `hasAuth=true` Y `hasAuth=false`

### Propuesta de Solución

**Crear una capa de abstracción de storage:**

```javascript
// src/hooks/useProjectsStorage.js
function useProjectsStorage(userId, orgId) {
  // Usa adapter pattern para localStorage vs Supabase
  const store = userId && orgId ? new SupabaseProjectStore(userId, orgId) 
                                : new LocalStorageProjectStore()
  
  return store  // Con métodos: list(), create(), update(), delete()
}

// Luego useProjects.js solo usa:
async function listarProyectos() {
  return await store.list()  // ← SIN if/else
}

async function guardarNuevo(nombre, data) {
  return await store.create(nombre, data)  // ← SIN duplicación
}
```

**Timeline:** 3-4 horas

---

## 📝 PROBLEMA 3: ESQUEMAS DE DATOS INCONSISTENTES

### Situación Actual

**3a. Datos hardcodeados en data.js (1000+ líneas)**

```javascript
// data.js línea 1-3
export const ZONAS = {
  A: { n: "Zona A", ej: "Arica, Antofagasta", techo: 0.84, muro: 2.10, ... },
  B: { n: "Zona B", ej: "Copiapo, Vallenar", techo: 0.47, muro: 0.80, ... },
  // ... 7 más zonas
}

export const PERM_V = { A: null, B: 1, C: 1, D: 2, ... }  // Permeabilidad
export const PUERTA_U = { A: null, B: 1.7, C: 1.7, ... }  // Transmitancia puerta
export const PUERTA_RF = { A: null, B: 'F15', C: 'F15', ... }  // Resistencia fuego
export const OGUC_RF_LETRAS = { a: { 1:'F180', 2:'F120', ... }, ... }  // Tabla OGUC
export const RF_DEF = { Vivienda: { estructura: 'F30', ... }, ... }
// ... CIENTOS de constantes
```

**3b. Datos en proyecto.data (estructura en App.jsx)**

```javascript
// App.jsx línea ~500+ - estructura de datos de proyecto
const [proy, setProy] = useState({
  nombre: '',
  tipo: '',      // tipo de edificio
  zona: '',      // zona climática
  destino: '',   // destino de edificio
  superficie: 0,
  pisos: 0,
  // ... más campos
})

const [termica, setTermica] = useState({
  zona: '',
  localidad: '',
  Ti: 20,
  Te: 5,
  HR: 65,
})

// PROBLEMA: Misma información (zona) aparece en PROY y TERMICA
```

**3c. Datos en Supabase (tabla proyectos)**

```sql
-- tabla proyectos
id          UUID
user_id     UUID
organizacion_id UUID
nombre      VARCHAR
saved_at    TIMESTAMP
updated_at  TIMESTAMP
snapshots   JSONB  ← data guardado aquí
data        JSONB  ← data actual aquí
token       VARCHAR (legacy)
```

### Problemas Específicos

**3c-1: Redundancia de zona**
- ZONAS en data.js tiene tabla de zona → propiedades
- En proyecto, zona aparece en PROY y TERMICA
- Cambios a ZONAS en data.js requieren deployment
- No hay versioning de cambios OGUC

**3c-2: Tabla OGUC hardcodeada**
- OGUC_TABLA1, OGUC_RF_LETRAS en data.js línea 34-175
- Cambios a normativa requieren deployar código
- Admin no puede actualizar normativa sin developer
- No hay audit trail de cambios

**3c-3: Snapshots y data duplicados**
- Snapshot: versión anterior de datos
- Data: versión actual
- Ambos guardan los MISMOS campos (proy, termica, calcUInit, etc.)
- Si se restaura snapshot, se restaura TODO (no hay cherry-pick)

### Impacto
- **Datos desincronizados:** Cambios a data.js no se propagan
- **No versionning:** No hay forma de saber qué versión OGUC usó un proyecto
- **Mantenimiento manual:** Cambios normativa = código + deploy
- **Escalabilidad:** Imposible para admin actualizar datos sin developer

### Propuesta de Solución

**Mover datos OGUC a Supabase como tablas configurables:**

```sql
-- Nueva tabla: oguc_zonas (reemplaza ZONAS en data.js)
CREATE TABLE oguc_zonas (
  id UUID PRIMARY KEY,
  codigo VARCHAR,           -- A, B, C, ...
  nombre VARCHAR,
  techo DECIMAL,
  muro DECIMAL,
  piso DECIMAL,
  Ti INTEGER,
  Te INTEGER,
  HR INTEGER,
  version VARCHAR,         -- v2024, v2026 para audit
  creado_en TIMESTAMP,
  -- ... más campos
)

-- Nueva tabla: oguc_rf_tabla (reemplaza OGUC_TABLA1)
CREATE TABLE oguc_rf_tabla (
  id UUID,
  destino VARCHAR,         -- Habitacional, Hoteles, Oficinas
  m2_min INTEGER,
  m2_max INTEGER,
  pisos JSONB,            -- {piso1: 'd', piso2: 'c', ...}
  version VARCHAR,
  creado_en TIMESTAMP,
)

-- Actualizar proyectos con referencia a versión
ALTER TABLE proyectos ADD COLUMN oguc_version VARCHAR;
```

**Aplicación:**
- Data.js solo imports de Supabase (NO hardcodeado)
- Admin puede cambiar valores en DB sin deploy
- Snapshots guardan referencia a `oguc_version` (audit)
- Función de migración para datos históricos

**Timeline:** 4-5 horas

---

## 🔌 PROBLEMA 4: FALTA DE CAPA DE VALIDACIÓN CENTRALIZADA

### Situación Actual

Validaciones distribuidas en múltiples lugares:

```javascript
// AuthGate.jsx línea 45-78
function handleChangeField(e) {
  // Validación de email, password, nombre
  // Pero validación DUPLICADA en useAuth.jsx también
}

// useAuth.jsx línea 105-133
const handleSignUp = async (...) => {
  const emailErr = validarEmail(email)  // Valida aquí
  const passwordErr = validarPassword(password)
  // ... pero también lo valida AuthGate
}

// UserManager.jsx línea 42-47
const usuarioExistente = usuarios.some(u => u.email === emailInvitar)
// Valida email duplicado localmente
// Pero supabase.js invitarUsuario NO lo valida servidor

// supabase.js línea 259-290
export async function invitarUsuario(orgId, email, rol) {
  // NO valida input
  // Confía en que cliente lo validó
}
```

### Problemas

**4a: Validaciones duplicadas**
- AuthGate + useAuth ambos validan email/password
- Si lógica cambia, hay que actualizar 2 lugares
- Riesgo de inconsistencia

**4b: Sin validación servidor**
- invitarUsuario() no valida email válido
- listarUsuarios() no valida orgId
- guardarNuevo() no valida superficie (debe ser > 0)

**4c: Errores no normalizados**
- Algunos errores son strings: `"Error al crear la cuenta"`
- Otros son objetos: `{ code: 'VALIDATION', message: '' }`
- Sin estructura consistente

**4d: Sin validaciones en datos críticos**
```javascript
// Nadie valida:
// - ¿Zona existe en ZONAS?
// - ¿Tipo de edificio es válido?
// - ¿Superficie > 0?
// - ¿Email está siendo usado en otra org?
```

### Propuesta de Solución

**Crear módulo centralizado de validaciones:**

```javascript
// src/lib/validation.js
export const validators = {
  email: (v) => { ... },
  password: (v) => { ... },
  projectName: (v) => { ... },
  zone: (v, zonesAvailable) => { ... },
  organizationId: (v) => { ... },
}

export function validate(field, value, context) {
  const validator = validators[field]
  return validator(value, context)
}

// src/lib/errors.js
export class ValidationError extends Error {
  constructor(field, message) {
    this.code = 'VALIDATION'
    this.field = field
    this.message = message
  }
}

export class AuthError extends Error {
  constructor(message) {
    this.code = 'AUTH'
    this.message = message
  }
}
```

**Usar en ambos lugares:**

```javascript
// AuthGate.jsx + useAuth.jsx - mismo código
const handleSignUp = async (email, password, nombre) => {
  try {
    validate('email', email)
    validate('password', password)
    validate('projectName', nombre)
    // ... procesar
  } catch (err) {
    if (err instanceof ValidationError) {
      setFieldErrors({ [err.field]: err.message })
    }
  }
}

// supabase.js - validar en servidor también
export async function invitarUsuario(orgId, email, rol) {
  try {
    validate('email', email)
    validate('organizationId', orgId)
    // ... procesar
  } catch (err) {
    return { ok: false, error: err }
  }
}
```

**Timeline:** 2-3 horas

---

## 🗂️ PROBLEMA 5: ESTRUCTURA DE APP.JSX ES MONOLÍTICA (CRÍTICO)

### Situación Actual

App.jsx tiene **366.5 KB** y contiene:
- Toda la lógica de UI principal
- Componentes de simulación térmica
- Componentes de sección constructiva  
- Componentes de informe
- State management
- Cálculos y fórmulas

```javascript
// App.jsx
import { useState, useMemo, useEffect, useRef, forwardRef } from 'react'

function App() {
  // 50+ useState hooks
  const [proy, setProy] = useState(...)
  const [termica, setTermica] = useState(...)
  const [fachadas, setFachadas] = useState(...)
  const [calcUInit, setCalcUInit] = useState(...)
  // ... más state
  
  // 100+ funciones de manejo
  function handleCambioZona() { ... }
  function handleCambioDestino() { ... }
  // ... más handlers
  
  // Componentes anidados (no extraídos)
  return (
    <div>
      {/* TabDiag aquí */}
      {/* Simulación térmica aquí */}
      {/* Sección constructiva aquí */}
      {/* Informe aquí */}
    </div>
  )
}
```

### Problemas

**5a: Imposible de mantener**
- Una línea de cambio puede quebrar múltiples features
- Testing requiere simular toda la app
- Debugging es nightmare (50+ vars)

**5b: Reutilización imposible**
- Lógica de proyectos está mezclada con UI
- No se puede reutilizar en otra app (CLI, API, etc.)

**5c: Performance**
- Todos los useState se re-renderean juntos
- Cambio en `proy` re-renderea simulación térmica
- No hay optimización con useMemo/useCallback

### Propuesta de Solución

**Refactorizar en capas:**

```
src/
├── hooks/
│   ├── useAuth.jsx         (auth)
│   ├── useProjects.js      (proyectos)
│   ├── useProyectoData.js  (NEW - datos de proyecto)
│   ├── useTermica.js       (NEW - simulación térmica)
│   └── useConstitucion.js  (NEW - sección constructiva)
├── lib/
│   ├── thermal.js          (NEW - cálculos térmicos)
│   └── report.js           (NEW - generación de informes)
├── components/
│   ├── Proyecto/
│   │   ├── ProyectoForm.jsx
│   │   ├── TermicaPanel.jsx
│   │   └── ConstitucionPanel.jsx
│   └── ...
└── App.jsx                 (orquestación simple)
```

**Resultado:**
```javascript
// App.jsx - mucho más limpio
function App() {
  const { session, perfil } = useAuth()
  const { proyectos, cargarProyectos } = useProjects(perfil?.user_id)
  
  return session ? (
    <Dashboard proyectos={proyectos} />
  ) : (
    <AuthGate />
  )
}

// Dashboard.jsx
function Dashboard({ proyectos }) {
  const [proyectoActual, setProyectoActual] = useState(null)
  
  return (
    <div>
      <ProjectList proyectos={proyectos} />
      <ProyectoEditor proyecto={proyectoActual} />
    </div>
  )
}

// ProyectoEditor.jsx
function ProyectoEditor({ proyecto }) {
  const termica = useTermica(proyecto)
  const constitucion = useConstitucion(proyecto)
  
  return (
    <div>
      <TermicaPanel {...termica} />
      <ConstitucionPanel {...constitucion} />
    </div>
  )
}
```

**Timeline:** 6-8 horas (refactorización grande)

---

## 📋 RESUMEN EJECUTIVO

| Problema | Impacto | Severidad | Effort | ROI |
|----------|---------|-----------|--------|-----|
| Doble auth (Token + Auth) | Código duplicado, confusión | 🔴 CRÍTICO | 2-3h | Alto |
| useProjects duplicado | Inconsistencia, bugs | 🟠 Alto | 3-4h | Alto |
| Datos hardcodeados | No escalable, no versionning | 🟠 Alto | 4-5h | Medio |
| Sin validación centralizada | Bugs, inseguridad | 🟠 Alto | 2-3h | Alto |
| App.jsx monolítico | Imposible mantener | 🔴 CRÍTICO | 6-8h | Muy Alto |

---

## 🎯 PLAN DE ACCIÓN (PRIORIZADO)

### Fase 1: Eliminar Redundancia (2-3 días)
1. **Eliminar TokenGate completamente** (2-3h)
   - Crear migración token → usuario
   - Integrar en AuthGate
   - Eliminar TokenGate.jsx

2. **Refactorizar useProjects** (3-4h)
   - Crear SupabaseStore y LocalStorageStore
   - Eliminar if/else duplicado
   - Centralizar snapshot logic

3. **Centralizar validaciones** (2-3h)
   - Crear validation.js
   - Crear errors.js
   - Actualizar AuthGate, UserManager, supabase.js

### Fase 2: Escalabilidad (2-3 días)
4. **Mover datos OGUC a Supabase** (4-5h)
   - Crear tablas oguc_* en BD
   - Actualizar data.js para leer de API
   - Crear admin panel para actualizar normativa

5. **Refactorizar App.jsx** (6-8h)
   - Extraer lógica en hooks específicos
   - Crear componentes por feature
   - Optimizar renders

### Fase 3: Testing & Verification (1 día)
6. **Testing completo** (2-3h)
   - Probar flujo token → usuario
   - Probar migrations
   - Probar validaciones

---

## 💡 CONCLUSIÓN

La app actual es **funcional pero no escalable**. Los problemas no son bugs, sino **decisiones arquitectónicas que generan deuda técnica**:

- Mantener 2 sistemas de auth = el doble de bugs
- useProjects duplicado = cambios tardan el doble
- Datos hardcodeados = impossible para admin actualizar

**Recomendación:** Hacer Fase 1 (2-3 días de work) ANTES de agregar más features. Luego Fase 2 (2-3 días) para escalabilidad. Resultado: App 10x más mantenible.
