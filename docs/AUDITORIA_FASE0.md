# Auditoría de coherencia — Fase 0 (2026-06-13)

Barrido sistemático de los 14 engines y la coherencia entre módulos.
Sonda repetible: `node scripts/audit-coherencia.mjs`. Solo lectura, no modifica nada.

Leyenda: **ALTA** = afecta veredictos o deja sin verificación · **MEDIA** = inconsistencia/verificar · **BAJA** = borde/limpieza.
Estado: ⬜ pendiente · 🔶 esperando confirmación de norma · ✅ resuelto.

---

## ALTA

### A1 — Tabla `ZONAS` no monótona (zona I menos exigente que H) 🔶
`src/data.js` · ZONAS
- `muro`: H=0.30, **I=0.35** · `piso`: H=0.32, **I=0.35**. La zona más fría (I = Punta Arenas/Coyhaique) permite MÁS U que H.
- **Impacto:** el semáforo térmico compara contra esta tabla (`U ≤ ZONAS[zona].muro`) → veredictos CUMPLE/NO CUMPLE potencialmente errados en zona I.
- **Resolver:** confirmar muro/piso de H e I contra DS N°15 oficial. (Zona F muro 0.45 ya validada contra ficha PDA Chillán.)

### A2 — `UMAX_VENTANA_DS15` sin zona I 🔶
`src/lib/engines/ventanas_detalladas.js`
- La tabla cubre A–H; falta I. `cumpleDS15(U,'I')` → `null` = **sin veredicto**. Función usada en App.jsx, VentanasDetalladas.jsx.
- **Impacto:** ventanas en la zona más fría no se verifican (silencioso).
- **Resolver:** confirmar U-máx ventana zona I (tendencia H=1.8) y agregarlo.

### A3 — Campo `zonas` de las SC sobre-declara cumplimiento (66 soluciones) ⬜
`src/data.js` · SC[*].zonas + obs
- 66 soluciones listan zonas donde su U **no** cumple el U-máx (ej. `1.2.M.D2.2` obs dice "U=0.31 · Cumple A-I" pero 0.31 > 0.30 de H; `2.2.M.MF1.1` listada en F con U=0.52 > 0.45).
- **Raíz de diseño:** `zonas` se cura a mano y hace doble función, mientras el cumplimiento real se calcula aparte (`tOk = U ≤ U-máx`). Efectos:
  - Sobre-listar (zona donde U falla) → semáforo T rojo (visible, menor).
  - **Sub-listar** (omitir zona donde U sí cumpliría) → oculta opción válida en silencio (mayor).
  - `obs` con frases "Cumple todas las zonas A-I" = afirmación falsa de cumplimiento.
- **Resolver:** derivar la aplicabilidad térmica del cálculo (`U ≤ U-máx zona`) en vez de mantener `zonas` a mano; limpiar los `obs` que afirman cumplimiento.

---

## MEDIA

### M1 — `PUERTA_U` invertida (zonas frías menos exigentes) 🔶
`src/data.js` · PUERTA_U
- B–E exigen ≤1.7; F–I (más frías) exigen ≤2.0. Contraintuitivo.
- **Resolver:** verificar contra DS N°15. Si es error, corregir; si es real, documentar el porqué.

### M2 — Engine de acústica desconectado + fórmula incorrecta ⬜
`src/lib/engines/acoustic.js` · App.jsx:7
- App.jsx importa `validarRwCumplimiento, obtenerRwRequerido, buscarSolucionesAcusticas` pero **no las llama**: la pestaña calcula Rw inline (`20·log10(masa)+14`). Imports muertos.
- `estimarRwComposicion` y `calcularMejoraAcustica` usan fórmula de **paralelo** (`-20·log10(Σ10^(-Rwi/10))`) donde corresponde **serie** → "mejora" daría negativa (agregar aislación "empeora" el Rw). No se usan hoy, pero quedan como trampa.
- **Resolver:** borrar imports muertos; eliminar o corregir las 2 funciones; decidir si el engine se conserva.

---

## BAJA

### B1 — `calcularU([])` con capas vacías → 5.88 ⬜
`src/lib/engines/thermal.js` · devuelve 1/(Rsi+Rse) en vez de null. Edge; agregar guard si la UI puede invocarlo sin capas.

### B2 — `perdidaPTUnico(id_inválido)` → 0 silencioso ⬜
`src/lib/engines/puentes_termicos.js` · un id de puente inexistente devuelve 0 sin avisar.

### B3 — Posible código muerto en engines ⬜
Varias funciones exportadas no se llaman fuera de su archivo (economic, renovables, fire helpers, thermal helpers, acoustic). Requiere análisis de llamadas internas para confirmar (hay falsos positivos). Candidato a limpieza, no urgente.

---

## Verificado OK (sin hallazgos)
- `calcularU` / `calcularUSC`: correctos (validados contra cálculo manual).
- `etaUtilizacion13790` (ISO 13790): maneja bien γ=1 (sin NaN 0/0).
- `perdidasEnvolvente`, `HRcritico` (moho), `perdidaPTUnico`, `cumpleDS15Puerta`: salidas sanas.
- Homologación: 0 excepciones en las 123 SC.
- Catálogo SC: 0 duplicados, 0 referencias huérfanas (BH/SC_CAPAS/REC_USO), RF coherente (corregido antes).
