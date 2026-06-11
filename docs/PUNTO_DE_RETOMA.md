# PUNTO DE RETOMA — Sesión cerrada 2026-06-11

> **Cómo usar este archivo:** Abre Claude Code en este directorio y pégale el mensaje del final ("Mensaje para retomar"). Con eso el modelo agarra contexto en una sola lectura.

---

## Estado actual del proyecto

- **Branch:** `main` (sincronizado con `origin/main`)
- **Último commit:** `9d87b54` — Agregar 12 soluciones constructivas (HCA, radier, Monoplac)
- **Deploy:** Vercel auto-deploy activo desde `main` (normacheck-eta.vercel.app)
- **Tests:** 90 verdes (`npm test`) — calcU, fire, glaser_mensual, demanda (incluye PT)
- **Fase:** BETA con testers activos — **todos en plan trial** (expiran ~10 jul)

## Modelo de negocio (armado y probado en produccion)

El informe PDF esta gateado por plan (`onExportar` + `isPro(perfil)` de `lib/plan.js`):

| Plan | Comportamiento al exportar informe |
|---|---|
| `trial` | Aviso informativo 1x/pestana (precio referencial + dias restantes) -> genera igual |
| `pro` | Genera directo, sin avisos |
| `free` | Bloqueo con precio referencial + mailto de upgrade |

- **Precios referenciales** (pendientes de sondeo con testers): Pro $24.990/mes+IVA, Pack 3 informes $39.990, Oficina 5 usuarios $89.990/mes.
- Al expirar los trials, el cobro se activa solo (pasan a Free). Activacion Pro manual via panel admin tras pago por transferencia.
- El sistema de tokens (`tokens`/`consumirToken` en useAuth) se conserva en el codigo para reconvertirlo en "packs de informes".

## Hecho en sesion 2026-06-10

1. **Blindaje de coherencia constructiva** del motor de correcciones (`generarCorrecciones` en data.js) — ver `docs/AUDITORIA_CALCULADORA_U.md` items (8) y (9).
2. **Boton "Volver a la solucion original"** en la calculadora U.
3. **Modo asistido ventana EN 10077** (ancho x alto x panos -> estima Ag/Af/Lg) + tooltips puerta.
4. **Onboarding:** proyecto de ejemplo (demo) + pestanas numeradas 1-10.
5. **Ganancias internas configurables** en Demanda Anual (3.0/4.5/6.0 W/m2).
6. **Espanol latino neutro** en toda la UI (voseo eliminado — regla permanente).
7. Gating de informe por Plan Pro + avisos con precio referencial.

## Hecho en sesion 2026-06-11

1. **Factor de utilizacion ISO 13790 exacto** en `lib/engines/demanda.js` — reemplazada la aproximacion `1-e^(-1/gamma)` por la formula estandar `eta=(1-gamma^a)/(1-gamma^(a+1))` con `a=0.8+tau/30` y tau de masa termica (commit `da63eb4`). 6 tests nuevos.
2. **Puentes termicos (Psi*L) integrados en demanda anual** — `calcularSumaPsiL()` en `puentes_termicos.js`, `perdidasPuentesTermicos()` en `demanda.js`. State `inventarioPT` lifted de PuentesTermicos.jsx a App.jsx para compartir con DemandaAnual. H_tr ahora incluye SigmaPsiL. KPI card y desglose en hero (commit `0a40af7`). 6 tests nuevos.
3. **Auto-sync comuna Normativo -> Energetico** — `buscarComunaKey()` en `comunas_chile.js` puente entre COMUNAS_ZONA (display names) y COMUNAS_CHILE (keys). onChange en TabDiag.jsx sincroniza zonaDS15, macrozona, distribuidora y tarifa. Boton "Sincronizar con Normativo" en EnergeticoConfig.jsx (commit `7012ede`).
4. **12 soluciones constructivas nuevas** (commit `9d87b54`):
   - 5 muros HCA (hormigon celular autoclavado) con y sin SATE — U desde 0.74 (solo) hasta 0.27 (HCA 200 + LM 80)
   - 4 pisos radier sobre terreno (EPS 40/60mm, XPS 80mm bajo losa continuo, EPS perimetral)
   - 1 techumbre PLN-100 Monoplac
   - 2 entrepisos PME-120 y PME-150 Monoplac
   - 1 base homologacion HCA para calculadora U
   - Nuevo sistema estructural "Hormigon celular autoclavado" en ESTRUCTURAS, RF_EST (F120), OBS_EST
   - REC_USO actualizado para Educacion y Salud con HCA y radier
   - **Catalogo total: 139 soluciones constructivas**

## Pendientes (priorizados)

### Del usuario (no requieren codigo)
- Recoger dudas concretas de la colega tester (que la confundio exactamente).
- Sondeo de precio a testers (Van Westendorp).
- Verificar si se corrio `sql/014_sesiones_login.sql` en Supabase.
- Registrar dominio normacheck.cl y crear correo contacto@normacheck.cl.

### Proximas sesiones (codigo)
1. **Buzon de feedback** — form -> Supabase table -> panel admin. Concepto acordado, no implementado.
2. **Asistente de seleccion SC** — filtro preventivo (marcar cuales cumplen al elegir) + gap analysis cuantificado (cuanto falta y que alternativas cumplen). Reemplaza sugerencia tipo "aplicar automaticamente" por seleccion informada.
3. **Catalogo SC Prioridad 2** — SATE Weber/Dryvit, EPS grafitado (lambda ~0.032), mas variantes SIP.
4. **Catalogo SC Prioridad 3** — fibra celulosa insuflada, vidrios control solar (factor g), puertas acusticas.
5. Banner amarillo defensivo en TabResultados — verificar con casos reales antes de borrar.
6. Precargar Calculo U resuelto en proyecto demo (quedo vacio a proposito).
7. Metodo mensual: envolvente convexo ISO 13788 (magnitudes absolutas confiables).
8. Importar ~200 materiales restantes del Excel oficial (archivo no esta en el repo).
9. UpgradePrompt / gating free users — postponed hasta que trials se acerquen a expiracion (~10 julio).
10. Modulo no-residencial (educacion/salud) — en roadmap, arquitectura abierta.

## Mensaje para retomar en proxima sesion

```
Retomo el proyecto NormaCheck. Estoy en C:\Users\UCSC\Documents\verificador-oguc

Lee docs/PUNTO_DE_RETOMA.md (estado al 2026-06-11, commit 9d87b54).
Recuerda: espanol latino neutro SIEMPRE (sin voseo).

Quiero: [feedback de testers / pendiente tecnico N / otro: ___]
```

---

**Notas historicas:** el bug critico de informes (docs/BUG_PENDIENTE_INFORMES.md) esta RESUELTO desde `d758488`; el doc se conserva como registro. Las migraciones SQL van hasta `013_user_plans.sql` aplicada (014 por verificar).
