# 🔄 PUNTO DE RETOMA — Sesión cerrada 2026-06-10

> **Cómo usar este archivo:** Abre Claude Code en este directorio y pégale el mensaje del final ("Mensaje para retomar"). Con eso el modelo agarra contexto en una sola lectura.

---

## ✅ Estado actual del proyecto

- **Branch:** `main` (sincronizado con `origin/main`)
- **Último commit:** `bd697c4` — Aviso informativo de precio para usuarios en trial
- **Deploy:** Vercel auto-deploy activo desde `main` (normacheck-eta.vercel.app)
- **Tests:** 74 verdes (`npm test`) — calcU (motor U/Glaser/correcciones), fire, glaser_mensual
- **Fase:** BETA con testers activos — **todos en plan trial** (expiran ~10 jul)

## 💰 Modelo de negocio (armado y probado en producción)

El informe PDF está gateado por plan (`onExportar` + `isPro(perfil)` de `lib/plan.js`):

| Plan | Comportamiento al exportar informe |
|---|---|
| `trial` | Aviso informativo 1×/pestaña (precio referencial + días restantes) → genera igual |
| `pro` | Genera directo, sin avisos |
| `free` | Bloqueo con precio referencial + mailto de upgrade |

- **Precios referenciales** (pendientes de sondeo con testers): Pro $24.990/mes+IVA · Pack 3 informes $39.990 · Oficina 5 usuarios $89.990/mes.
- Al expirar los trials, el cobro se activa solo (pasan a Free). Activación Pro manual vía panel admin tras pago por transferencia. Pasarela de pagos = futuro.
- El sistema de tokens (`tokens`/`consumirToken` en useAuth) se CONSERVÓ en el código para reconvertirlo en "packs de informes".
- **Tag de respaldo:** `pre-plan-gating` (= `789a24d`, estado pre-gating, pusheado a GitHub).

## 🆕 Hecho en la sesión 2026-06 (resumen)

1. **Blindaje de coherencia constructiva** del motor de correcciones (`generarCorrecciones` en data.js) — ver `docs/AUDITORIA_CALCULADORA_U.md` ítems (8) y (9): cierre exterior reforzado, `pasaCond`, estrategias nuevas **Cc** (BV + reubicar tablero) y **Ca** (aislación techo/piso, reduce casos manuales C8), `riesgoTrampaVapor` con criterio de secado + **árbitro mensual ISO 13788** (clima real por comuna), espesores comerciales, orden por pertinencia.
2. **Botón "↩ Volver a la solución original"** en la calculadora U (restaura origCapas y limpia correccionAplicada).
3. **Modo asistido ventana EN 10077** (ancho×alto×paños → estima Ag/Af/Lg) + tooltips puerta.
4. **Onboarding:** proyecto de ejemplo (demo, botón en modal de bienvenida; modal ahora aparece también en primera visita) + pestañas numeradas 1–10.
5. **Ganancias internas configurables** en Demanda Anual (3.0/4.5/6.0 W/m²).
6. **Español latino neutro** en toda la UI (voseo eliminado — regla permanente del proyecto).
7. Gating de informe por Plan Pro + avisos con precio referencial.

## 📋 PENDIENTES (priorizados)

### Del usuario (no requieren código)
- Recoger dudas concretas de la colega tester (qué la confundió exactamente).
- Sondeo de precio a testers (¿a cuánto caro? ¿a cuánto sospechosamente barato?).
- Verificar si se corrió `sql/014_sesiones_login.sql` en Supabase.

### Técnicos (próximas sesiones)
1. **Factor de utilización ISO 13790 exacto** en `lib/engines/demanda.js` — hoy usa la aproximación `1−e^(−1/γ)`; la fórmula estándar es `η=(1−γ^a)/(1−γ^(a+1))` con `a=a0+τ/τ0` y τ de la masa térmica.
2. **Integrar puentes térmicos a la demanda anual** — PuentesTermicos.jsx calcula Ψ·L pero no se suma a las pérdidas de DemandaAnual (subestima 10–30% en envolventes con muchos puentes).
3. **Banner amarillo defensivo en TabResultados** (~línea 8800): el bug que lo motivó ya se corrigió (`d758488`); falta que el usuario confirme con casos reales que no hay discrepancias calculadora↔informe para borrarlo.
4. Precargar un Cálculo U "resuelto" en el proyecto demo (quedó vacío a propósito).
5. Método mensual: envolvente convexo ISO 13788 (magnitudes absolutas confiables).
6. Importar los ~200 materiales restantes del Excel oficial (hay que recargar el .xlsm, no está en el repo).

## 📨 Mensaje para retomar en próxima sesión

```
Retomo el proyecto NormaCheck. Estoy en C:\Users\UCSC\Documents\verificador-oguc

Lee docs/PUNTO_DE_RETOMA.md (estado al 2026-06-10, commit bd697c4).
Recuerda: español latino neutro SIEMPRE (sin voseo).

Quiero: [feedback de testers / pendiente técnico N / otro: ___]
```

---

**Notas históricas:** el bug crítico de informes (docs/BUG_PENDIENTE_INFORMES.md) está RESUELTO desde `d758488`; el doc se conserva como registro. Las migraciones SQL van hasta `013_user_plans.sql` aplicada (014 por verificar).
