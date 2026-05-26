# INFORME DE AUDITORÍA DE CÓDIGO — NormaCheck

**Repositorio:** Aparato-normativo
**Última revisión:** 2026-05-26
**Versión funcional:** Módulo Normativo v1.x + Módulo Energético Pro v1.0 (6 sprints completos)
**Stack:** React 18 + Vite 5 + Supabase (PostgreSQL + Auth) + Vercel (Hobby tier)

---

## 1. RESUMEN EJECUTIVO

NormaCheck es una aplicación web (SPA) que ofrece dos productos en un mismo dominio:

1. **Módulo Normativo (Free)** — verificador de cumplimiento OGUC chileno: térmico (DS N°15 / NCh853), fuego (Tabla 1 / 2 / RF), acústico (NCh3358 / Rw), cálculo U+Glaser, ventanas (% VPCT), detalles ilustrados, generación de informe DOM.

2. **Módulo Energético Pro (Premium)** — análisis energético avanzado: payback en correcciones, renovables (FV / Solar térmico / Bomba de Calor), demanda anual + sobrecalentamiento, puentes térmicos catalogados, ventanas detalladas, higrotérmico dinámico ISO 13788 + moho VTT, informe ejecutivo PDF + CEV estimada.

Total: **73 archivos `.jsx`/`.js`** en `src/` + **13 archivos `.sql`** de migraciones.

---

## 2. ARQUITECTURA GENERAL

```
┌──────────────────────────────────────────────────────────────────┐
│                       NAVEGADOR / CLIENTE                         │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  React 18 SPA (bundled by Vite)                           │   │
│   │  ├── Auth (Supabase Auth client)                         │   │
│   │  ├── State (React hooks + Context)                       │   │
│   │  ├── Tema (CSS variables, 6 temas)                        │   │
│   │  └── Render: ModeSwitcher → Tabs → Módulo                │   │
│   └──────────────────────────────────────────────────────────┘   │
└─────────────────────────┬────────────────────────────────────────┘
                          │  HTTPS
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                    │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  PostgreSQL                                                │   │
│   │  ├── auth.users (gestionado por Supabase)                │   │
│   │  ├── organizaciones                                       │   │
│   │  ├── perfiles_usuario (con plan + trial_expira)          │   │
│   │  ├── proyectos (con JSONB data + snapshots)              │   │
│   │  ├── tokens, tokens_legado                                │   │
│   │  ├── registro_auditoria                                   │   │
│   │  └── RPCs (SECURITY DEFINER):                            │   │
│   │      · handle_new_user (trigger signup)                   │   │
│   │      · activar_prueba_pro, cambiar_plan_usuario          │   │
│   │      · get_org_recibe_signups, set_org_recibe_signups    │   │
│   │      · get_platform_usage                                 │   │
│   ├── Auth (email/password + magic links + JWT)              │   │
│   └── RLS (Row Level Security) en todas las tablas           │   │
└──────────────────────────────────────────────────────────────────┘
```

**Despliegue:** Vercel Hobby (plan gratuito) con build automático desde `main`. Sin servidor propio: todo el stateful vive en Supabase.

---

## 3. STACK TÉCNICO

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend framework | React | 18 |
| Build tool | Vite | 5 |
| Backend DB / Auth | Supabase (PostgreSQL + GoTrue) | hosted |
| Hosting | Vercel | Hobby |
| Generación PDF | html2pdf.js (jsPDF + html2canvas) | 0.14 |
| Exportación XLSX | xlsx (SheetJS) | latest |
| Fuentes | Inter Tight, Source Serif 4, IBM Plex, Geist, EB Garamond | Google Fonts |
| Estilo | CSS Variables + inline styles | nativo |

**Sin dependencias pesadas:** no usa Redux, Tailwind, Material UI, lodash. Todo en vanilla React + hooks. Bundle final: ~1.28 MB (gzip 332 KB), html2pdf separado en chunk dinámico de 982 KB.

---

## 4. ESTRUCTURA DEL PROYECTO

```
verificador-oguc/
├── public/
├── sql/                              # 13 migraciones Supabase
│   ├── 001_create_user_profile_trigger.sql
│   ├── 002_make_admin.sql
│   ├── ... (varios fixes y features)
│   ├── 011_org_receptora_signups.sql
│   ├── 012_get_platform_usage.sql
│   └── 013_user_plans.sql           # Sistema free/trial/pro
├── src/
│   ├── App.jsx                       # Componente principal (~8500 líneas)
│   ├── main.jsx                      # Punto de entrada
│   ├── supabase.js                   # Cliente Supabase + helpers DB (~1300 líneas)
│   ├── data.js                       # Catálogos OGUC + motor generarCorrecciones
│   ├── hooks/
│   │   └── useAuth.jsx               # AuthProvider con contexto global
│   ├── components/
│   │   ├── ModeSwitcher.jsx          # Toggle Normativo / Energético
│   │   ├── ThemePicker.jsx           # Selector de 6 temas
│   │   ├── MigrationGate.jsx         # Pantalla pre-migración
│   │   ├── calculou/                 # Componentes Design integrados
│   │   │   ├── ResultadoU.jsx
│   │   │   ├── DesgloseR.jsx
│   │   │   ├── CurvaGlaser.jsx       # (guardado pero no usado)
│   │   │   ├── TablaCapas.jsx
│   │   │   ├── PanelCalculoU.jsx
│   │   │   └── icons.jsx
│   ├── modules/
│   │   ├── AdminPanel.jsx            # Panel admin global (overrides OGUC)
│   │   ├── AdminStats.jsx            # Stats org + usage plataforma
│   │   ├── UserManager.jsx           # CRUD usuarios + selector plan
│   │   └── energetico/               # Módulo Pro completo
│   │       ├── EnergeticoHome.jsx
│   │       ├── EnergeticoConfig.jsx
│   │       ├── DemandaAnual.jsx
│   │       ├── Detalles.jsx          # Contenedor de 3 sub-tabs
│   │       ├── PuentesTermicos.jsx   # 750 líneas con diagrama SVG
│   │       ├── VentanasDetalladas.jsx
│   │       ├── Higrotermico.jsx
│   │       ├── Renovables.jsx        # Contenedor 3 sub-tabs
│   │       ├── SolarFV.jsx
│   │       ├── SolarTermico.jsx
│   │       ├── BombaCalor.jsx
│   │       ├── InformeEjecutivo.jsx
│   │       ├── exportarPDFEjecutivo.js
│   │       ├── AyudaEnergetico.jsx   # Componente reutilizable de guía
│   │       └── PaywallGate.jsx       # Wrapper para gating Pro
│   ├── lib/
│   │   ├── plan.js                   # isPro(), estaEnTrial(), labelPlan()
│   │   ├── projectStorage.js
│   │   ├── ogucData.js
│   │   └── engines/
│   │       ├── thermal.js            # Cálculo U / Glaser (heredado v1)
│   │       ├── fire.js
│   │       ├── acoustic.js
│   │       ├── validation.js
│   │       ├── economic.js           # NUEVO: payback, VAN, CO2
│   │       ├── renovables.js         # NUEVO: FV + ST + BdC
│   │       ├── demanda.js            # NUEVO: balance térmico ISO 13790
│   │       ├── puentes_termicos.js   # NUEVO: análisis Ψ
│   │       ├── ventanas_detalladas.js # NUEVO: U combinado
│   │       ├── glaser_mensual.js     # NUEVO: ISO 13788 mensual
│   │       ├── moho_vtt.js           # NUEVO: modelo VTT
│   │       ├── cev.js                # NUEVO: calificación estimada
│   │       └── informe_agregador.js  # NUEVO: agrega para informe
│   ├── data/
│   │   ├── combustibles.js           # 17 combustibles + 9 distribuidoras
│   │   ├── comunas_chile.js          # 346 comunas + dualidad
│   │   ├── grados_dia.js             # HDD18 por comuna y zona
│   │   ├── irradiacion_solar.js      # Radiación + T° invierno
│   │   ├── clima_anual.js            # CDD26 + radiación vertical
│   │   ├── clima_mensual.js          # Modelo sinusoidal mensual
│   │   ├── precios_renovables.js     # PRECIOS_FV, _ST, _BDC
│   │   ├── puentes_termicos.js       # 18 PTs catalogados
│   │   ├── ventanas_detalladas.js    # 10 marcos × 9 vidrios × 4 intercalarios
│   │   ├── costos_intervencion.js    # CLP/m² por corrección
│   │   └── cev_chile.js              # Escala A+→G + benchmarks
│   ├── styles/
│   │   └── themes.css                # 6 temas + overrides
│   └── utils/
│       ├── validation.js
│       └── errors.js
├── package.json
├── vite.config.js
└── netlify.toml / vercel.json
```

---

## 5. SISTEMA DE AUTENTICACIÓN

### Tablas de Supabase
- `auth.users` — gestionado por GoTrue (incluye email confirmado, sesiones)
- `perfiles_usuario` — perfil aplicativo con `rol`, `organizacion_id`, `plan`, `trial_expira`, `tokens_disponibles`, etc.
- `organizaciones` — multitenant (cada usuario pertenece a una org)

### Flujo de signup
1. Usuario llena formulario en `AuthGate.jsx`
2. Supabase auth crea entrada en `auth.users`
3. Trigger PostgreSQL `handle_new_user` se ejecuta automáticamente:
   - Caso A: si existe invitación pendiente con su email → vincula
   - Caso B: si hay org marcada `recibe_signups=TRUE` → entra como viewer
   - Caso C: fallback → crea workspace personal como admin

### Sistema de planes (Sprint 1)
Campos en `perfiles_usuario`:
- `plan TEXT CHECK ('free','trial','pro')` default 'free'
- `trial_expira TIMESTAMPTZ`

**Helper `lib/plan.js`** :
```javascript
export function isPro(perfil) {
  if (!perfil) return false
  if (perfil.plan === 'pro') return true
  if (perfil.plan === 'trial' && perfil.trial_expira) {
    const expira = new Date(perfil.trial_expira)
    if (!isNaN(expira.getTime()) && expira > new Date()) return true
  }
  return false
}
```

**Gating UI:** componente `PaywallGate` envuelve secciones Pro y muestra CTA si `!isPro(perfil)`.

**RPCs admin-only** para cambiar planes (`activar_prueba_pro`, `cambiar_plan_usuario`) — protegidas con SECURITY DEFINER + verificación de rol admin.

---

## 6. MÓDULO NORMATIVO (Free)

### Pestañas (10)
0. **Diagnóstico** — datos del proyecto (comuna, zona DS15, uso, etc.)
1. **Soluciones** — selector de soluciones constructivas LOSCAT Ed.13 2025
2. **Térmica** — verificación U vs Umax DS N°15
3. **Fuego** — verificación RF Tabla 1/2 OGUC art. 4.3.3
4. **Acústica** — verificación Rw NCh3358
5. **Cálculo U** — calculadora U + Glaser por elemento
6. **Ventana** — calculadora Uw + verificación %VPCT
7. **📐 Detalles** — detalles ilustrados (DOM)
8. **Resultados** — informe consolidado + export PDF DOM
9. **⚙ Admin** — overrides + invitaciones + tokens

### Motor de cálculo U + Glaser
Vive en `src/data.js` (función `calcGlaser`) — heredada de v1, conserva validaciones intrincadas de:
- Cámaras de aire (NCh853 §6.5)
- Estructuras integradas madera/acero (ISO 6946 método combinado)
- ΔU puentes térmicos (ISO 6946 §6.9.3)
- Piso sobre terreno (ISO 13370)
- Cubierta ventilada (ISO 6946 §6.9.2)

### Generador de correcciones (`generarCorrecciones`)
Algoritmo `async` con yield al hilo (`_YIELD()`) para mantener UI fluida. Genera hasta 8 estrategias:
- C1 EIFS/SATE (muro/tabique)
- C2 Fachada Ventilada (muro/tabique) — fix Sprint 4
- C3 Trasdosado Interior (muro/tabique) — fix Sprint 4
- C4–C8 Universal (espesor, barrera vapor, sustituir aislante, reordenar, fallback)

Con cache (`_corrCache`) y penalty automático por estructuras integradas (madera ×0.90, acero ×0.80).

---

## 7. MÓDULO ENERGÉTICO PRO (6 SPRINTS)

### Sub-pestañas
1. **🏠 Inicio** — dashboard + roadmap visual
2. **⚙ Configuración** — comuna (~346), tarifa eléctrica, combustibles, tipo proyecto
3. **📊 Demanda** — balance ISO 13790 + sobrecalentamiento verano
4. **🔬 Detalles** — sub-tabs Puentes Térmicos, Ventanas Detalladas, Higrotérmico
5. **🌱 Renovables** — sub-tabs Solar FV, Solar Térmico, Bomba de Calor
6. **📑 Informe** — dashboard agregado + export PDF ejecutivo + CEV estimada

### Motor económico (`lib/engines/economic.js`)
```javascript
export function analizarCorreccion({ correccion, uAntes, areaM2, proy, configEnergetica }) {
  const hdd18 = obtenerHDD18(comunaKey, zonaEfectiva)
  const ahorroKwh = ahorroTermicoAnual(uAntes, uDespues, areaM2, hdd18)
  const econ = ahorroEconomicoAnual(ahorroKwh, configEnergetica)
  const costo = calcularCostoIntervencion(correccion, areaM2, espesorMm)
  const psimple = paybackSimple(costo.costoTotal, econ.ahorroClp)
  const pdesc   = paybackDescontado(costo.costoTotal, econ.ahorroClp, 0.05)
  const van30   = vanProyecto(costo.costoTotal, econ.ahorroClp, 30, 0.05)
  // ...
}
```

### Motor renovables (`lib/engines/renovables.js`)
- `analizarFV`: dimensiona kWp, produce con factor de capacidad por comuna, calcula Net-billing con autoconsumo 35% + inyección al 62% del precio
- `analizarSolarTermico`: dimensiona sistema según personas, aplica franquicia Ley 20.365 escalonada por UF de vivienda
- `analizarBdC`: COP corregido por T° invierno con `factorCopPorTexterior(tExt)` lineal por tramos

### Motor demanda (`lib/engines/demanda.js`)
Balance estacionario simplificado ISO 13790:
```
QH = perdidas_envolvente + perdidas_infiltracion − ganancias_utilizadas
```
Con factor de utilización η_util = 1 − exp(−1/ratio_ganancias_perdidas).

### Motor higrotérmico (`lib/engines/glaser_mensual.js`)
Para cada mes del año:
1. T_ext sinusoidal según T_invierno y T_verano
2. T en cada interfaz por estado-estacionario
3. pv_real interpolando entre interfaces según Sd acumulado
4. Si pv_real > pv_sat → condensación (acumula con DELTA_AIRE = 2e-10 kg/m·s·Pa)
5. Si pv_real < pv_sat → evapora (30% del acumulado/mes)

### Motor moho VTT (`lib/engines/moho_vtt.js`)
Implementación simplificada del modelo Hukka-Viitanen 1999:
```javascript
export function actualizarM_mensual(T, HR_pct, sensibilidad, M_actual) {
  if (HR_pct < HRcritico(T, sensibilidad)) return Math.max(0, M_actual - tasaSecado)
  const factorT = max(0, 1 - ((T - 20) / 25)²)
  const incremento = 0.50 × factorT × factorHR × factorMaterial × (1 - M/7)
  return Math.min(6, M_actual + incremento)
}
```
Doble ciclo anual (24 meses simulados) para estabilizar resultado.

---

## 8. BASE DE DATOS (POSTGRESQL en SUPABASE)

### Tablas principales

```sql
-- Organizaciones (multitenant)
CREATE TABLE organizaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  propietario_id  UUID,
  plan            TEXT DEFAULT 'free',
  activa          BOOLEAN DEFAULT true,
  recibe_signups  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Perfiles de usuario (extiende auth.users)
CREATE TABLE perfiles_usuario (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES auth.users(id),
  nombre_completo    TEXT,
  rol                TEXT CHECK (rol IN ('admin','viewer')),
  organizacion_id    UUID REFERENCES organizaciones(id),
  activo             BOOLEAN DEFAULT true,
  tokens_disponibles INT DEFAULT 2,
  tokens_usados      INT DEFAULT 0,
  plan               TEXT DEFAULT 'free' CHECK (plan IN ('free','trial','pro')),
  trial_expira       TIMESTAMPTZ,
  ultimo_acceso      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Proyectos (con JSONB para data + snapshots)
CREATE TABLE proyectos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID REFERENCES organizaciones(id),
  user_id         UUID REFERENCES auth.users(id),
  nombre          TEXT,
  data            JSONB,        -- todo el estado del proyecto
  snapshots       JSONB,        -- hasta 10 snapshots de versiones
  is_template     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Registro de auditoría
CREATE TABLE registro_auditoria (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID,
  organizacion_id UUID,
  accion          TEXT,         -- INSERT, UPDATE, DELETE
  tabla_nombre    TEXT,
  registro_id     UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS (Row Level Security)
**Todas las tablas tienen RLS habilitado.** Patrón típico:
```sql
CREATE POLICY "Users can read their own org data" ON proyectos
  FOR SELECT USING (
    organizacion_id IN (
      SELECT organizacion_id FROM perfiles_usuario
      WHERE user_id = auth.uid()
    )
  );
```

### RPCs críticas (SECURITY DEFINER)
- `handle_new_user()` — trigger que ejecuta el flujo signup
- `activar_prueba_pro(p_perfil_id UUID, p_dias INT)` — solo admin
- `cambiar_plan_usuario(p_perfil_id UUID, p_plan TEXT)` — solo admin
- `set_org_recibe_signups(p_org_id UUID, p_recibe BOOLEAN)` — solo admin
- `get_platform_usage()` — métricas de uso para panel admin
- `absorber_usuario(p_email TEXT)` — admin agrega usuario ya registrado

---

## 9. SEGURIDAD

### Capa cliente
- Token JWT en `localStorage` (Supabase Auth)
- Helper `isPro(perfil)` antes de mostrar features Pro
- `PaywallGate` ocultará contenido si gate falla — pero NO es la seguridad real

### Capa servidor (PostgreSQL)
- RLS en todas las tablas — un usuario solo puede ver/modificar datos de su organización
- RPCs `SECURITY DEFINER` validan rol admin antes de cambios sensibles
- Trigger `handle_new_user` evita usuarios huérfanos (sin perfil/org)

### Consideraciones de seguridad pendientes
- ✅ Anon key de Supabase es pública (es normal, RLS protege)
- ⚠️ No hay rate limiting personalizado (solo el de Supabase)
- ⚠️ Sin 2FA opt-in
- ⚠️ Sin auditoría de sesiones largas

---

## 10. CONFIGURACIÓN BUILD

### Vite config
```javascript
// vite.config.js (probablemente default + plugin React)
export default {
  plugins: [react()],
  // chunks: html2pdf lazy-loaded
}
```

### Vercel deploy
- Build command: `npm run build`
- Output dir: `dist/`
- Node version: 20
- Variables de entorno: ninguna pública (Supabase URL y anon key están hardcoded en `supabase.js` — es seguro porque son públicas)

### Tamaño de bundle final
```
dist/assets/index-xxxxxxxx.js     1.29 MB │ gzip:  336 KB
dist/assets/html2pdf-xxxxxxxx.js  982 KB  │ gzip:  286 KB  (lazy chunk)
dist/assets/xlsx-xxxxxxxx.js      429 KB  │ gzip:  143 KB  (lazy chunk)
dist/assets/index-xxxxxxxx.css     11 KB  │ gzip:    2 KB
```

---

## 11. EXTERNAL APIs / SDK

| Servicio | Uso | Tipo |
|---|---|---|
| Supabase Auth (GoTrue) | Email/password + magic links + JWT | hosted SaaS |
| Supabase PostgreSQL | DB principal, RLS, RPCs | hosted SaaS |
| Vercel | Static site hosting | hosted SaaS |
| Google Fonts | Inter Tight, Source Serif, IBM Plex, Geist, EB Garamond | CDN |
| html2pdf.js / jsPDF / html2canvas | Generación PDF | client-side npm |
| xlsx (SheetJS) | Export tablas a Excel | client-side npm |

---

## 12. ÁREAS DE CÓDIGO CRÍTICAS PARA REVISIÓN

### Auth y planes
- `src/hooks/useAuth.jsx` — provider central, dispatcher de operaciones
- `src/supabase.js` — todas las funciones de DB, ~1300 líneas
- `src/lib/plan.js` — lógica de gating
- `sql/013_user_plans.sql` — migración del sistema de planes

### Motores de cálculo (donde la matemática importa)
- `src/data.js` — funciones `calcGlaser`, `calcU_ISO6946`, `generarCorrecciones`
- `src/lib/engines/economic.js` — payback / VAN / CO₂
- `src/lib/engines/demanda.js` — balance térmico ISO 13790
- `src/lib/engines/glaser_mensual.js` — Glaser mensual ISO 13788
- `src/lib/engines/moho_vtt.js` — modelo Hukka-Viitanen

### UI sensible a seguridad / pagos
- `src/modules/UserManager.jsx` — admin de usuarios y planes
- `src/modules/energetico/PaywallGate.jsx` — gating Pro
- `src/modules/energetico/InformeEjecutivo.jsx` + `exportarPDFEjecutivo.js` — generación cliente final

---

## 13. CÓMO REPRODUCIR LOCALMENTE (DEV)

```bash
git clone https://github.com/rbacigalupop-code/Aparato-normativo
cd verificador-oguc
npm install
npm run dev   # http://localhost:5173
```

Variables de entorno: ninguna requerida en cliente (Supabase URL/key hardcoded públicamente).

Para que funcione el módulo Pro: ejecutar `sql/013_user_plans.sql` en Supabase SQL Editor.

---

## 14. CADENA DE COMMITS RECIENTES

```
319325d Feat: selector tipo de proyecto + etiqueta de alcance v1 (Opción C)
8f05310 Feat: PT con diagrama visual + ejemplo + validación + recomendaciones + sidebar
e99fab1 Sprint 6 — Informe Ejecutivo + CEV estimada + Export PDF
1666ff4 Sprint 5 — Análisis higrotérmico dinámico + Modelo VTT de moho
35aa2d5 Sprint 4 — Detalles: Puentes Térmicos + Ventanas Detalladas + fix crítico
e60d725 Feat: COPELEC + Frontel ampliada + dualidad de distribuidoras
f5bfda3 Feat: distribuidora eléctrica auto-sugerida por comuna
a7bcdab Feat: guías contextuales + badges de origen de datos en módulo Energético
b3c84e2 Feat: Sprint 3 — Demanda energética anual + Sobrecalentamiento verano
55ca7c3 Fix: obtenerPerfil ahora incluye plan y trial_expira + refresco en vivo
1efe796 Fix + Feat: catálogo completo de comunas chilenas con zona DS N°15 oficial
731154d Feat: Sprint 2 del Módulo Energético — Energías Renovables
c7d21e8 Feat: Sprint 1 del Módulo Energético Pro
```

Tags de seguridad ("rollback points"):
- `pre-design-integration-c`
- `pre-sprint-1-energ`
- `pre-sprint-2-renov`
- `pre-sprint-3-demanda`
- `pre-sprint-4-detalles`
- `pre-sprint-5-higro`
- `pre-sprint-6-informe`

Rollback: `git reset --hard <tag> && git push -f origin main`.

---

**Fin del informe de auditoría.**
