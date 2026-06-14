# Handoff — NormaCheck (continuación de sesión)

_Última actualización: 2026-06-13_

## Contexto del proyecto
- **App:** NormaCheck — SaaS de verificación de norma chilena (OGUC / DS N°15 MINVU, Art. 4.1.10 térmico).
- **Ruta local:** `C:\Users\UCSC\Documents\verificador-oguc`
- **Stack:** React 18 + Vite · backend Supabase · deploy Vercel auto desde `main`.
- **Repo:** `rbacigalupop-code/Aparato-normativo` · **Live:** normacheck-eta.vercel.app
- **Estado producto:** beta. Gating Pro/trial/free activo. Idioma SIEMPRE español neutro latinoamericano (tú/puedes), nunca voseo.

## Reglas de seguridad (persistentes)
- Claves `service_role` / `sb_secret_` NUNCA en frontend, repo ni bundle. Solo `sb_publishable_` va al front; RLS es la protección real.
- Operaciones destructivas de BD (DELETE, cambios RLS) las corre el usuario en el SQL Editor de Supabase.
- No ingresar credenciales/secretos.

---

## A3 ✅ CERRADO (commit incluye A3a + A3b)
El campo `zonas` curado a mano sobre-declaraba cumplimiento. Resuelto:
- **A3a (lógica):** aplicabilidad por **uso** (`s.usos`), aptitud térmica por **cálculo** (`U ≤ U-máx zona`), no por `zonas`. En `src/App.jsx` (`evaluar`/`ev`, alternativas) y `src/lib/engines/thermal.js` (`buscarSolucionesTermicas`).
- **A3b (obs):** de 22 obs con afirmación universal, 2 falsas corregidas (`1.2.M.D2.2` muro U=0.31 falla H; `3.2.V.A.T.1.03` ventana → Tabla 3). Resto verificado correcto.
- Test guard: `src/__tests__/obs_sin_cumplimiento_falso.test.js`. 163 tests OK, build OK.

---

## DÓNDE QUEDAMOS (próxima tarea: M2)

1. **M2 — engine de acústica** (`src/lib/engines/acoustic.js`, App.jsx:7): imports muertos (`validarRwCumplimiento`, `obtenerRwRequerido`, `buscarSolucionesAcusticas` no se llaman; la pestaña calcula Rw inline). `estimarRwComposicion`/`calcularMejoraAcustica` usan fórmula de **paralelo** donde corresponde **serie** → "mejora" sale negativa. Resolver: borrar imports muertos, corregir/eliminar las 2 funciones, decidir si se conserva el engine. (Detalle en AUDITORIA_FASE0.md §M2.)

2. **Bug "estructura→madera"** PAUSADO: al aplicar una solución albañilería+EPS, en Resultados/Informe/Energético cambiaba a "estructura de madera". No reproducible hasta ahora. El usuario sacará captura + DevTools si reaparece.

3. **Integración PDA** (Planes Descontaminación Atmosférica): el usuario está descargando las 10 zonas a `Descargas\PDA\<zona>\`. Plan: extractor → `src/data/pda.js` (exigencias + fichas), mapeo comuna→PDA, categoría de hermeticidad.

4. **Catálogo Prioridad 3:** fibra de celulosa insuflada, vidrios control solar (factor g), puertas acústicas.

5. **Opcional:** agregar capa explícita de pavimento en los strings `capas` de las soluciones de piso del catálogo (ej. `1.4.G.M1.1`).

6. **Bordes (BAJA):** `calcularU([])` → 5.88 (falta guard); `perdidaPTUnico(id_inválido)` → 0 silencioso; posible código muerto en engines.

---

## ARCHIVOS CLAVE PARA CONTINUAR

| Archivo | Qué tiene |
|---|---|
| `src/App.jsx` | Monolito UI (~10.200 líneas). TabSoluciones (`evaluar`/`ev`), TabVentana, TabTermica, TabResultados, informe. **Tiene cambios A3a sin commit.** |
| `src/data.js` | ZONAS (Tabla 1 verificada), SC (catálogo), RF_ELEM_REQ, `validarCierre()`, soluciones SATE/SIP. **Aquí va A3b (obs).** |
| `src/lib/engines/thermal.js` | Cálculo U (ISO 6946), Glaser, `buscarSolucionesTermicas`. **Cambio A3a sin commit.** |
| `src/lib/engines/acoustic.js` | Engine acústico — **objetivo de M2**. |
| `src/data/ds15_ventanas.js` | Tabla 3 oficial ventanas (432 valores), `maxVidriadoVentana`, `cumpleVentana`. |
| `src/data/puertas_detalladas.js` | `UMAX_PUERTA_DS15` = {B-I: 1.70}. |
| `docs/AUDITORIA_FASE0.md` | Checklist de hallazgos (A1✅ Z1✅ A2✅ M1✅ · A3⬜ M2⬜ · bordes B1-B3). **Fuente de verdad del avance.** |
| `src/__tests__/` | 9 archivos, 141 tests (ds15_oficial, ds15_ventanas, rf_consistencia, cruce_normativo, cierre_piso, calcU, fire, glaser, demanda). Correr `npx vitest run`. |
| `scripts/audit-coherencia.mjs` | Sonda repetible de coherencia (solo lectura). |

## Tabla 1 oficial verificada (U-máx W/m²K) — DS N°15, vigente 28-11-2025
| Zona | Techo | Muro | Piso vent. |
|---|---|---|---|
| A | 0.84 | 2.10 | 3.60 |
| B | 0.47 | 0.80 | 0.70 |
| C | 0.47 | 0.80 | 0.87 |
| D | 0.38 | 0.80 | 0.60 |
| E | 0.33 | 0.60 | 0.60 |
| F | 0.28 | 0.45 | 0.50 |
| G | 0.28 | 0.40 | 0.39 |
| H | 0.25 | 0.30 | 0.32 |
| I | 0.25 | 0.35 | 0.35 |

> La norma **NO es monótona**: H (cordillera) es más exigente que I (austral). Puertas opacas: 1.70 uniforme B-I, A sin exigencia.

## Comandos útiles
```bash
cd /c/Users/UCSC/Documents/verificador-oguc
npx vitest run            # 141 tests
npm run build             # verificar build
node scripts/audit-coherencia.mjs   # sonda de coherencia (solo lectura)
git status --short
```
