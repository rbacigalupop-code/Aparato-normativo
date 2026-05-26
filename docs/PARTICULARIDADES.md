# PARTICULARIDADES DEL PROGRAMA + OPORTUNIDADES DE MEJORA

**Producto:** NormaCheck — verificador OGUC + análisis energético avanzado
**Fecha:** 2026-05-26

Este documento describe las particularidades del software, las decisiones de
diseño, lo que está implementado y dónde están las principales oportunidades
de mejora.

---

## 1. POSICIONAMIENTO DEL PRODUCTO

NormaCheck es una **herramienta web (SPA) para arquitectos chilenos** que cubre
dos necesidades de mercado distintas pero relacionadas:

| Necesidad | Producto | Cliente típico |
|---|---|---|
| Verificar cumplimiento DOM (OGUC + DS N°15 + NCh) | **Módulo Normativo** (free) | Arquitecto residencial individual o pequeña oficina |
| Analizar demanda energética, renovables, payback | **Módulo Energético Pro** (premium) | Consultor energético, inmobiliaria, certificador CEV |

**Diferenciación vs. competidores:**
- vs. **planillas Excel**: app integrada, multi-usuario, en la nube, con catálogos vivos
- vs. **CCTE_CL (MINVU oficial)**: más accesible, no requiere acreditación, da resultados orientativos
- vs. **eQUEST / DesignBuilder**: enfocado en Chile (normativa local), sin curva de aprendizaje
- vs. **CES MOP**: no es para edificios públicos no-residenciales

---

## 2. PARTICULARIDADES DEL PROGRAMA

### 2.1 Sistema de dos modos en una app
Uso un **ModeSwitcher** en el header que cambia entre:
- 📐 **Normativo** (gratis, completo)
- ⚡ **Energético Pro** (gated por plan)

Esto permite vender Pro sin obligar al usuario a salir del entorno familiar.

### 2.2 Multi-tenancy con organizaciones
Cada usuario pertenece a una "organización" (puede ser personal o de equipo).
Permite a una oficina de arquitectura compartir proyectos entre múltiples
arquitectos manteniendo aislamiento de datos vía RLS de PostgreSQL.

### 2.3 Sistema de tokens + Pro
Existen dos sistemas paralelos:
- **Tokens** — limitan exportación de informes en el Módulo Normativo
  (monetización pay-per-use, heredada de v1)
- **Plan Pro** — desbloquea el Módulo Energético completo
  (monetización por suscripción)

Pueden combinarse: un usuario puede ser "free + sin tokens" (verificación
solamente, sin export PDF) o "pro + 0 tokens" (Pro pero sin export Normativo).

### 2.4 Sistema de 6 temas visuales
Diseño visual ofrecido por Claude Design:
- Base (legado, look del v1)
- Claro (papel cálido + índigo)
- Papel (crema + serif Source Serif)
- Nórdico (gris frío + IBM Plex)
- Tinta (B/W puros + EB Garamond italic)
- Tech (oscuro + cyan Geist)

Implementados con CSS Variables y overrides universales en `themes.css`.

### 2.5 Catálogos chilenos reales
- **346 comunas** con zona DS N°15 oficial + región + distribuidora eléctrica
- **9 distribuidoras eléctricas** con tarifa BT1-A referencial
- **17 combustibles** reales (leña certificada/no-certificada, pellets, kerosene,
  GLP cilindro/granel, BdC, etc.) — no solo los "ideales"
- **28 capitales provinciales** con HDD18, CDD26, T° invierno/verano, irradiación
  detallada
- **8 zonas térmicas DS N°15** con fallbacks para comunas no catalogadas en detalle
- **LOSCAT Edición 13 2025** — soluciones constructivas certificadas DITEC-MINVU
- **18 puentes térmicos** catalogados ISO 14683 con 3 niveles de calidad
- **10 marcos × 9 vidrios × 4 intercalarios** para análisis combinado de ventanas

### 2.6 Análisis higrotérmico inspirado en WUFI
No es WUFI real (cerrado por Fraunhofer IBP, ~€2000) pero implementa:
- Método Glaser **mensual** ISO 13788 (no solo estacionario)
- Acumulación / evaporación de condensación mes a mes
- Modelo VTT de crecimiento de moho (Hukka-Viitanen 1999)
- Veredicto cualitativo: "auto-seca" vs "acumula progresivamente"

**Limitación honesta:** documentado en pie de pestaña. No reemplaza WUFI/Delphin
para certificación oficial, pero da los órdenes de magnitud correctos para
decisiones de diseño.

### 2.7 Informe ejecutivo PDF distinto al informe DOM
- **Informe DOM (Módulo Normativo)** — para revisores municipales,
  técnico, denso, en formato OGUC tradicional
- **Informe Ejecutivo (Módulo Energético Pro)** — para cliente final,
  inversionista, mandante u oferente. Visualmente atractivo,
  KPIs grandes, plan priorizado, impacto ambiental.

Ambos usan **html2pdf.js** (client-side, no requiere servidor).

### 2.8 Sistema de "dualidad de distribuidoras"
En Chile muchas comunas tienen presencia mixta urbano/rural de distintas
distribuidoras eléctricas (ej: Chillán urbano = CGE, Chillán rural = COPELEC).
La app detecta y muestra ambas opciones con botón rápido "Cambiar a X".

### 2.9 Componente AyudaEnergetico reutilizable
Cada pestaña del módulo Pro tiene un panel colapsable con:
- Intro de qué hace
- Pasos recomendados
- **De dónde viene cada dato** (con chips coloreados):
  `↩ Cálculo U`, `↩ Ventana`, `↩ Configuración`, `↩ Auto`, `↩ Tú`
- Marco normativo y referencias técnicas

Esto educa al usuario sobre la cadena de dependencias entre módulos.

### 2.10 Generación de correcciones con motor asíncrono
El motor `generarCorrecciones` en `data.js` produce hasta 8 estrategias
constructivas con cache + yields al hilo del navegador (`setTimeout(0)`)
para mantener la UI fluida sin Web Worker.

### 2.11 Backups automáticos por sprint
Cada sprint se commitea con un tag `pre-sprint-X-nombre` previo, permitiendo
rollback fácil:
```bash
git reset --hard pre-sprint-5-higro && git push -f origin main
```

### 2.12 Selector "Tipo de proyecto" (v1)
Reconoce explícitamente que el módulo está optimizado para **viviendas**
(unifamiliar o departamento). Banner "🏠 v1 · Foco en viviendas" en el hero
del Home. Esto educa al usuario sin cerrar la puerta a no-residencial futuro.

---

## 3. LO QUE ESTÁ IMPLEMENTADO

### Módulo Normativo (heredado v1, estable)
| Pestaña | Estado | Norma |
|---|---|---|
| Diagnóstico (datos proyecto) | ✅ | OGUC art. 4.1.10 |
| Soluciones constructivas LOSCAT | ✅ | LOSCAT Ed.13 2025 |
| Térmica (U vs Umax) | ✅ | DS N°15 Tabla 1 |
| Fuego (RF) | ✅ | OGUC Tabla 1/2 art. 4.3.3 |
| Acústica (Rw) | ✅ | NCh3358 |
| Cálculo U + Glaser | ✅ | NCh853 + ISO 6946 + EN 13788 |
| Ventana (Uw + %VPCT) | ✅ | DS N°15 Tabla 3 |
| Detalles ilustrados | ✅ | OGUC |
| Resultados + informe DOM PDF | ✅ | con html2pdf |
| Admin panel + tokens + invitaciones | ✅ | sistema multi-org |

### Módulo Energético Pro (6 sprints completos)
| Sprint | Pestaña/feature | Norma referencia |
|---|---|---|
| 1 | Configuración energética del proyecto | — |
| 1 | Payback en correcciones del Cálculo U | — |
| 1 | Sistema de planes free/trial/pro + Paywall | — |
| 2 | Solar FV | Ley 21.118 Net-billing |
| 2 | Solar Térmico ACS | Ley 20.365 SST |
| 2 | Bomba de Calor (4 tipos, COP corregido) | NCh2989/1 + NCh3304 |
| 3 | Demanda anual + Sobrecalentamiento | ISO 13790 |
| 4 | Puentes Térmicos catalogados (Ψ) | ISO 14683 + CITEC UBB |
| 4 | Ventanas Detalladas (U combinado) | NCh3079 + ISO 10077 |
| 5 | Higrotérmico dinámico mensual | ISO 13788 |
| 5 | Moho VTT | Hukka-Viitanen 1999 |
| 6 | Informe Ejecutivo PDF | — |
| 6 | CEV estimada | DS N°50/2018 |
| 6 | Comparativas vs benchmarks Chile | CASEN energía + CITEC |

### Funcionalidades transversales
- ✅ Autenticación email/password + magic links
- ✅ Sistema de organizaciones multitenant con RLS
- ✅ Invitaciones por email
- ✅ "Org receptora" para signups directos (sin invitación previa)
- ✅ Absorción de usuarios ya registrados
- ✅ Panel admin: gestión de usuarios, planes, tokens, overrides OGUC
- ✅ Stats de uso de plataforma (DB size, conteos, links Supabase/Vercel)
- ✅ Snapshots de proyecto (versionado)
- ✅ Sistema de 6 temas visuales
- ✅ Export PDF (informe DOM + informe ejecutivo)
- ✅ Export XLSX (tablas)

---

## 4. LIMITACIONES CONOCIDAS

### Técnicas
- ⚠️ Bundle JavaScript del módulo principal supera 500KB (1.29 MB sin gzip).
  Aceptable pero podría optimizarse con code-splitting más agresivo.
- ⚠️ html2pdf.js es pesado (982KB). Es lazy-loaded pero impacta primera generación de PDF.
- ⚠️ No hay paginación en `proyectos`. Con +100 proyectos por org puede ser lento.
- ⚠️ Cálculos térmicos en `data.js` son monolíticos (5000+ líneas) — difícil mantener.
- ⚠️ Sin tests automatizados (cero coverage). Riesgo de regresiones.
- ⚠️ Sin sistema de feature flags. Cambios van directos a main.
- ⚠️ Inline styles en todo el código vs CSS modular — limita el theming completo.

### De producto
- ❌ Solo viviendas (Vivienda unifamiliar y departamento). No oficinas, salud, etc.
- ❌ Análisis cuasi-estacionario, no simulación dinámica horaria
- ❌ No conecta con BIM (Revit, ArchiCAD IFC)
- ❌ No tiene API pública (no se puede integrar desde otra app)
- ❌ No tiene white-label / multi-marca
- ❌ Sin app móvil nativa (solo responsive)
- ❌ Sin modo offline
- ❌ Sin colaboración en tiempo real (proyectos no son CRDT)

### De negocio / monetización
- ⚠️ Pasarela de pagos NO integrada. Activación Pro es manual por admin.
- ⚠️ No hay analytics de uso (Mixpanel/Posthog/GA4)
- ⚠️ No hay onboarding guiado para usuarios nuevos
- ⚠️ Plan Supabase Free tiene tope 500 MB DB — limita ~100-200 proyectos
  con imágenes. Crítico al crecer.

---

## 5. OPORTUNIDADES DE MEJORA

### Tier 1 — Quick Wins (1-3 sesiones cada uno)

1. **Pasarela de pagos** (Webpay / Mercado Pago / Stripe)
   - Auto-activar Pro al pagar — quitar carga del admin
   - Mejor experiencia + monetización automática
   - Complejidad: media. Stripe es el más sencillo.

2. **Onboarding interactivo** para nuevos usuarios
   - Tour guiado por las pestañas del módulo Normativo
   - Tutorial "primer proyecto" con datos pre-cargados
   - Reduce tasa de abandono inicial

3. **Code-splitting más agresivo**
   - Cargar Módulo Energético Pro solo cuando se entra a él
   - Lazy-load el módulo Admin
   - Bundle inicial podría bajar de 1.29 MB a ~700KB

4. **Analytics integrado**
   - Posthog (gratis hasta 1M eventos/mes) o Mixpanel
   - Tracking de qué pestañas se usan más, dónde abandona el usuario
   - Crítico para tomar decisiones de roadmap

5. **Sistema de notificaciones**
   - Trial por expirar (3 días antes)
   - Bienvenida tras signup
   - Cambios importantes (nueva norma, actualización LOSCAT)
   - Resend o SendGrid

6. **Validaciones cruzadas en el formulario**
   - WWR por orientación > 35% → alerta
   - Espesor de capas > 600mm → revisar
   - λ fuera de rango típico → revisar

### Tier 2 — Mejoras de Producto (1-2 sprints)

7. **Migrar imágenes base64 a Supabase Storage**
   - Actualmente las imágenes de detalles ilustrados están embebidas como base64 en JSONB
   - Esto consume 10× más espacio que un archivo binario
   - Liberar 80% del espacio de DB → soportar 10× más proyectos

8. **Refactor del motor de cálculos en `data.js`**
   - Dividir en módulos más pequeños y testeables
   - Agregar tests unitarios (Vitest)
   - Convertir a TypeScript paulatinamente (mejora mantenibilidad)

9. **Sistema de plantillas de proyecto**
   - Plantillas por tipología (DS19, vivienda media, edificio en altura)
   - Plantillas por arquitecto/oficina (sus propios estándares)
   - Reduce tiempo de captura

10. **Comparador de versiones (snapshots)**
    - Diff lado a lado entre 2 snapshots del mismo proyecto
    - "Versión 1 vs Versión 2 — U mejoró 12%, costo +CLP 380k"
    - Justifica decisiones de diseño al cliente

11. **Modo cliente vs modo profesional del informe**
    - Cliente: ejecutivo, sin tecnicismos, conclusiones + costos
    - Profesional: detalle completo, normativa, fórmulas
    - Toggle al exportar

12. **Mejora del exportable Excel**
    - Exportar tablas con formato condicional
    - Exportar todo el proyecto a XLSX para colaboración offline

### Tier 3 — Diferenciadores Fuertes (Sprint completo cada uno)

13. **Sprint 7 — Edificios no residenciales**
    - Selector ampliado: Oficina / Educacional / Salud / Comercial
    - Defaults distintos (cargas internas, ACS, horario)
    - Reemplazar CEV por CES MOP / LEED estimado
    - Mercado: arquitectos de comerciales, certificadores CES

14. **Importador IFC (BIM)**
    - Cargar geometría desde Revit/ArchiCAD via IFC 2x3 o IFC4
    - Auto-extraer áreas, U-values, orientaciones
    - Reduce captura manual de >50%
    - Complejidad: alta. Hay librerías open-source (web-ifc).

15. **API pública**
    - REST endpoints para integraciones con otras apps
    - Auth via API keys (no JWT de usuario)
    - Casos: integración con software de gestión inmobiliaria, ERPs de
      constructoras

16. **Catálogo MINENERGÍA en vivo (Explorador Solar)**
    - Hoy usamos datos estáticos pre-cargados
    - Conectar a la API de MINENERGÍA para datos actualizados
    - Irradiación TMY actualizada anualmente

17. **Modelo de demanda horario (no mensual)**
    - Cálculo hora a hora con TMY (8.760 horas/año)
    - Permite analizar picos de demanda, perfiles de uso
    - Necesario para certificación CEV oficial precisa
    - Complejidad: alta. Acerca al producto a CCTE_CL.

18. **Marketplace de soluciones constructivas**
    - Proveedores chilenos pueden subir sus productos certificados
    - Cliente arquitecto los elige y compara
    - Modelo de negocio: comisión por lead generado

### Tier 4 — Crecimiento de Negocio

19. **Programa de partners**
    - Acreditar evaluadores CEV / certificadores CES como partners
    - Comisión recurrente por proyectos generados
    - Validación + capacitación

20. **Marca blanca (white-label)**
    - Inmobiliarias o municipios pueden tener su propia versión
    - Sus colores, logo, dominio personalizado
    - Pricing: enterprise tier

21. **Webinars + cursos**
    - Educación sobre la normativa OGUC actualizada
    - Curso "Cómo certificar CEV paso a paso"
    - Genera leads + posiciona la marca

22. **Sistema de roles más fino**
    - Hoy: admin / viewer
    - Sería útil: editor (sin admin), consultor (de varias orgs),
      auditor (read-only con export)

---

## 6. DECISIONES DE DISEÑO IMPORTANTES (Y POR QUÉ)

### "Por qué Free / Pro y no múltiples tiers"
**Decisión:** Dos tiers simples (Free, Pro) en vez de Free/Starter/Pro/Enterprise.
**Razón:** El mercado chileno residencial es pequeño y las decisiones de compra
son binarias ("¿pago o no?"). Más tiers complican sin agregar conversiones.

### "Por qué hardcodear Supabase URL/key en cliente"
**Decisión:** Las credenciales públicas de Supabase (URL + anon key) están
embebidas en `supabase.js` en lugar de venir de variables de entorno.
**Razón:** Son **públicas por diseño** — la seguridad real está en RLS.
Simplifica deployment a Vercel sin tener que configurar env vars.

### "Por qué CSS Variables y no Tailwind / styled-components"
**Decisión:** Estilo principal con inline styles + CSS variables para temas.
**Razón:** El proyecto heredó esa estructura del v1. Migrar a Tailwind sería
un refactor masivo sin valor inmediato. Las CSS vars permiten el sistema de
temas con cero JS adicional.

### "Por qué un solo archivo App.jsx gigante (8000+ líneas)"
**Decisión:** Mantener `App.jsx` monolítico con muchos sub-componentes inline
en lugar de fragmentarlo.
**Razón:** Heredado del v1. Refactor a archivos separados sería ~1 sprint
adicional sin valor para el usuario. Es deuda técnica reconocida.

### "Por qué cálculos client-side y no server-side"
**Decisión:** Todos los motores (Glaser, balance térmico, payback, etc.)
corren en el navegador.
**Razón:** Cero costos de cómputo en servidor. El usuario tiene CPU. Resultados
inmediatos sin latencia. Servidor solo se usa para persistencia.

### "Por qué WUFI inspirado y no software real"
**Decisión:** Implementamos Glaser mensual ISO 13788 + VTT moho con datos
climáticos sinusoidales.
**Razón:** WUFI real es cerrado y caro. Para decisiones de diseño basta con
órdenes de magnitud correctos. Documentamos honestamente la limitación.

---

## 7. ROADMAP FUTURO SUGERIDO

### Próximos 30 días
- Validar con 5-10 usuarios reales el módulo Pro
- Implementar pasarela de pagos (Webpay)
- Tracking analytics básico (Posthog)
- Onboarding inicial

### Próximos 90 días
- Sprint 7: Edificios no residenciales (si feedback lo pide)
- Migrar imágenes a Supabase Storage
- Refactor `data.js` con tests
- Code-splitting módulo Pro

### Próximos 180 días
- Importador IFC
- API pública
- Demanda horario (TMY completo)
- Programa de partners

---

## 8. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Cambio de normativa OGUC | Alta | Alto | Sistema de overrides admin permite ajustar sin redeploy |
| Crecimiento >500MB DB Free | Media | Alto | Migrar imágenes a Storage (Tier 2) |
| Usuario activa Pro pero no paga | Alta | Bajo (no hay pago automático) | Pasarela de pagos (Tier 1) |
| Competidor copia features | Media | Medio | Foco en UX + catálogos chilenos vivos |
| Bug en cálculo crítico | Baja | Alto | Tests automatizados (Tier 2) |
| Vercel rate limits exceeded | Baja | Medio | Upgrade Vercel Pro si pasa |
| Pérdida sesión user con plan Pro | Baja | Bajo | Sistema refrescarPerfil() ya está |

---

## 9. CONSIDERACIONES DE MONETIZACIÓN

### Estado actual
- ❌ Sin pago automático
- ✅ Sistema de planes funcional (free/trial/pro)
- ✅ Admin puede activar Pro manualmente o dar prueba
- ⚠️ Trials se activan por admin, no por el usuario

### Modelo sugerido para Pro
- **Suscripción mensual:** CLP 19.990 / mes — accesible para freelance
- **Suscripción anual:** CLP 199.000 / año (descuento ~17%) — para oficinas
- **Plan equipo (5+ usuarios):** CLP 79.990 / mes — para oficinas medianas
- **Trial:** 14 días gratis self-service (botón en UI)

### Cómo monetizar Normativo (que es gratis hoy)
Mantener gratis pero monetizar via **tokens** para export PDF:
- 2 tokens gratis al registrarse (suficiente para probar)
- 1 token = 1 informe DOM PDF
- Compra de tokens: 10 tokens × CLP 9.990
- Suscripción Pro: tokens ilimitados

Así Normativo sigue accesible (cumplimiento OGUC es derecho universal) pero
hay monetización para uso intensivo.

---

## 10. ESTADO FINAL DEL CÓDIGO

- **73 archivos** JavaScript/JSX
- **13 migraciones** SQL
- **~30 commits** del módulo Pro (Sprints 1-6 + fixes + mejoras)
- **7 tags** de seguridad para rollback rápido
- **0 tests** automatizados (oportunidad de mejora)
- **0 bugs críticos** conocidos al cierre de Sprint 6
- **2 limitaciones documentadas honestamente** al usuario:
  - WUFI inspirado (no oficial)
  - CEV estimada (no certificada)

---

## 11. CONTACTO Y MANTENIMIENTO

- **Repo:** https://github.com/rbacigalupop-code/Aparato-normativo
- **Deploy:** https://[tu-dominio].vercel.app
- **DB:** Supabase (URL pública en `src/supabase.js`)
- **Última migración SQL pendiente de correr:** ninguna (todas aplicadas)

---

**Fin del documento de particularidades.**
