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
- Test guard: `src/__tests__/obs_sin_cumplimiento_falso.test.js`.

## M2 ✅ CERRADO (commit `cfbc0ee`, pusheado)
Engine de acústica (`src/lib/engines/acoustic.js`):
- Eliminado import muerto en `App.jsx` (la pestaña calcula Rw inline por ley de masa).
- `estimarRwComposicion`: composición en **paralelo** (ISO 12354-3), factor −10 ponderado por área (era −20 sin normalizar).
- `calcularMejoraAcustica`: capas en **serie**, modelo aditivo `Rw+ΣΔRw`, mejora ≥ 0 (antes daba negativa).
- Test guard: `src/__tests__/acoustic_engine.test.js`.

## A4 ✅ CERRADO (commit `78fe49c`, pusheado)
Comunas multi-zona (Putre A/H, etc.) ahora aplican la **zona de la fila elegida** (no siempre la primera) y no la marcan como "modificada manualmente". `resolveZonas()`/`getOverrideZona()` en `src/utils/zonaStorage.js`; `src/modules/TabDiag.jsx`. Test: `src/__tests__/comuna_multizona.test.js`. Pendiente relacionado: `comunas_chile.js` usa esquema A-H que no coincide con el oficial A-I (afecta solo módulo energético) — hay un chip de tarea para eso.

## A5 ✅ CERRADO (commit `5309f27`, pusheado)
El botón **"Aplicar"** ahora usa la **U recalculada del simulador de capas** (engrosar aislante) en vez del valor certificado original. `SimuladorCapas.onModificar` → `modSim` → `onAplicar`/`onAplicarTodos`; regla pura en `src/lib/aplicarSolucion.js`. Test: `src/__tests__/aplicar_solucion_modificada.test.js`. **189 tests OK, build OK.**

---

## DÓNDE QUEDAMOS (siguientes tareas)

1. **Unificar zonas DS15** (chip de tarea abierto): `comunas_chile.js` (A-H) vs `COMUNAS_ZONA` (A-I oficial) no coinciden; el módulo energético/clima usa la fuente equivocada.

2. **Bug "estructura→madera"** PAUSADO: al aplicar una solución albañilería+EPS, en Resultados/Informe/Energético cambiaba a "estructura de madera". No reproducible hasta ahora. El usuario sacará captura + DevTools si reaparece.

3. **Integración PDA** (Planes Descontaminación Atmosférica): el usuario está descargando las 10 zonas a `Descargas\PDA\<zona>\`. Plan: extractor → `src/data/pda.js` (exigencias + fichas), mapeo comuna→PDA, categoría de hermeticidad.

4. **Catálogo Prioridad 3:** fibra de celulosa insuflada, vidrios control solar (factor g), puertas acústicas.

5. **Opcional:** agregar capa explícita de pavimento en los strings `capas` de las soluciones de piso del catálogo (ej. `1.4.G.M1.1`).

6. **Bordes (BAJA):** `calcularU([])` → 5.88 (falta guard); `perdidaPTUnico(id_inválido)` → 0 silencioso; posible código muerto en engines.

---

## ARCHIVOS CLAVE PARA CONTINUAR

| Archivo | Qué tiene |
|---|---|
| `src/App.jsx` | Monolito UI (~10.200 líneas). TabSoluciones (`evaluar`/`ev`), TabVentana, TabTermica, TabResultados, informe. |
| `src/data.js` | ZONAS (Tabla 1 verificada), SC (catálogo), RF_ELEM_REQ, `validarCierre()`, soluciones SATE/SIP. |
| `src/lib/engines/thermal.js` | Cálculo U (ISO 6946), Glaser, `buscarSolucionesTermicas`. |
| `src/lib/engines/acoustic.js` | Engine acústico (M2 corregido; pestaña usa Rw inline por ley de masa). |
| `src/lib/aplicarSolucion.js` | `resolverAplicacionSC()` — regla pura: U/capas a aplicar (modificada vs certificada). A5. |
| `src/utils/zonaStorage.js` | `resolveZonas()`/`getOverrideZona()` — zonas oficiales por comuna (multi-zona). A4. |
| `src/data/ds15_ventanas.js` | Tabla 3 oficial ventanas (432 valores), `maxVidriadoVentana`, `cumpleVentana`. |
| `src/data/puertas_detalladas.js` | `UMAX_PUERTA_DS15` = {B-I: 1.70}. |
| `docs/AUDITORIA_FASE0.md` | Checklist de hallazgos (A1✅ Z1✅ A2✅ A3✅ A4✅ A5✅ M1✅ M2✅ · bordes B1-B3 ⬜). **Fuente de verdad del avance.** |
| `src/__tests__/` | 13 archivos, 189 tests. Correr `npx vitest run`. |
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
