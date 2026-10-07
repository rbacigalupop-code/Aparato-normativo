# Puente bidireccional Talora ⇄ Revit (RevitMind) — DS N°15 de vanos

Contrato JSON para la integración de **2 vías** entre Talora y Revit (vía RevitMind).
El lado Revit (otra sesión, RevitMind) debe implementar **exactamente** estos contratos.

- **Vía 1 (ya existente):** Talora → `talora_to_revit.json` → RevitMind crea tipos
  multicapa (muro/losa/cubierta). Ver `src/lib/engines/revit-export.js`. **No cambia.**
- **Vía 2 (esta):** Revit → `revit_to_talora.json` → Talora emite veredictos DS N°15
  por elemento → `talora_to_revit.json` (de vanos). Ver `src/lib/engines/revit-import.js`.

> **Llave de diseño — identidad estable:** cada cara y cada vano se identifica por
> `revit_uid` (UniqueId de Revit). Talora **nunca** crea ni empareja por nombre;
> siempre por `revit_uid`. Los `revit_uid` de la salida son los mismos de la entrada.

El transporte (archivo, agente, servidor local o Supabase Realtime) es independiente
del contrato: el mismo JSON viaja por cualquiera de ellos.

---

## Entrada — `revit_to_talora.json` (Revit → Talora)

Estado real del modelo: caras envolventes + vanos.

```json
{
  "proyecto": { "comuna": "Quillón", "zona_termica": "E" },
  "caras": [
    { "revit_uid": "cara-N", "azimuth_deg": 10.0, "area_m2": 20.0, "muro_uid": "m-N" }
  ],
  "vanos": [
    { "revit_uid": "v1", "tipo": "ventana", "area_m2": 3.0, "cara_uid": "cara-N",
      "ancho_m": 1.5, "alto_m": 2.0, "U_actual": 2.0 }
  ]
}
```

### Campos

**`proyecto`**
| campo | tipo | notas |
|---|---|---|
| `comuna` | string | informativo (eco en la salida) |
| `zona_termica` | string \| number | **zona DS N°15**. Preferido: letra `A`–`I`. También se acepta número `1`–`9` (1→A … 9→I). |

**`caras[]`** (una por paño opaco expuesto)
| campo | tipo | notas |
|---|---|---|
| `revit_uid` | string | UniqueId de la cara. **Obligatorio.** |
| `azimuth_deg` | number | **Preferido.** Dirección normal del muro en grados sexagesimales, `0°` = **norte geográfico**. Talora lo clasifica con la Tabla 4. |
| `orientacion` | string | Fallback si no hay `azimuth_deg`: `N` \| `S` \| `E` \| `O`. Ver mapeo abajo. |
| `area_m2` | number | área **total** de la cara (muro + vanos). |
| `muro_uid` | string | UniqueId del muro host (informativo). |

> **Recomendado: enviar `azimuth_deg`, no la letra.** Así la regla de clasificación
> (Tabla 4, incluidos los bordes) vive en un solo lugar dentro de Talora, es testeable,
> y Revit solo entrega un dato objetivo (el ángulo de la normal respecto al **norte
> verdadero**). Si se envían ambos, gana `azimuth_deg`.

**`vanos[]`** (ventanas y puertas)
| campo | tipo | notas |
|---|---|---|
| `revit_uid` | string | UniqueId del vano. **Obligatorio.** |
| `tipo` | string | `ventana` \| `puerta`. |
| `area_m2` | number | área del vano. |
| `cara_uid` | string | `revit_uid` de la cara que lo contiene. |
| `ancho_m`, `alto_m` | number | dimensiones (informativo en esta vía). |
| `U_actual` | number | U del vano `[W/m²K]`. **Opcional** pero necesario para veredicto. |

---

## Salida — `talora_to_revit.json` (Talora → Revit)

Veredictos DS N°15, indexados por `revit_uid`.

```json
{
  "proyecto": {
    "comuna": "Quillón",
    "zona_termica": "E",
    "ogt": { "pct_vidriado": 35.0, "limite_pct": 28, "cumple": false }
  },
  "caras": [
    { "revit_uid": "cara-N", "orientacion": "N",
      "pct_vidriado": 30.0, "limite_pct": 83, "cumple": true }
  ],
  "vanos": [
    { "revit_uid": "v1", "tipo": "ventana", "U_exigido": 5.8,
      "zona_termica": "E", "cumple": true, "mensaje": "Ventana cumple: …" }
  ],
  "generado": "2026-10-07T12:00:00.000Z"
}
```

### Campos

**`proyecto.ogt`** — veredicto **global total** sobre toda la envolvente:
- `pct_vidriado`: Σ área ventanas / Σ área caras.
- `limite_pct`: tope OGT de la Tabla 3 a la U peor caso global.
- `cumple`: `true` \| `false` \| `null` (sin datos suficientes).

**`caras[]`**
- `orientacion`: ya normalizada a `N` / `OP` / `S`.
- `pct_vidriado`: Σ área **ventanas** de la cara / área cara (las puertas, opacas, **no** suman).
- `limite_pct`: máximo permitido a la U **peor caso** de la cara.
- `cumple`: `true` \| `false` \| `null`.

**`vanos[]`**
- `U_exigido`:
  - ventana → U máxima admisible al % vidriado real de su cara (inverso de la Tabla 3).
    `0` = ni el mejor vidrio admite ese % de vidriado.
  - puerta → U-máx opaco de la zona (`1.70`, o `null` en zona A sin exigencia).
- `cumple`: `true` \| `false` \| `null`.
- `mensaje`: texto explicativo en español.

---

## Lógica DS N°15 (reutilizada tal cual de Talora)

1. **Agrupar** vanos por `cara_uid`. Por cara, % vidriado = Σ área **ventanas** / área cara.
2. **Por cara:** comparar % vidriado contra el límite de la Tabla 3 (zona × U × orientación) → cumple/no.
3. **Por ventana:** trade-off % vidriado ↔ U ↔ orientación de la Tabla 3, usando la U propia de la ventana.
4. **Por puerta:** U ≤ `1.70 W/m²K` opaco (zonas B–I); zona A sin exigencia. **No** usa la Tabla 3.
5. **OGT:** veredicto global sobre la envolvente completa.
6. Todo indexado por `revit_uid`.

Fuentes: `src/data/ds15_ventanas.js` (Tabla 3 oficial) y `PUERTA_U` en `src/data.js` (Tabla 1).

### Decisiones normativas adoptadas

| decisión | criterio |
|---|---|
| **OGT** | se devuelve el veredicto global **además** del veredicto por cara. |
| **U por cara** | **peor caso** (U más alto de las ventanas de la cara) para el límite de % vidriado. |
| **Puertas** | regla propia (U opaco ≤ 1.70); no cuentan para el % vidriado de la cara. |

### Orientación — Tabla 4 (azimut) y mapeo a Tabla 3

La **Tabla 4** del art. 4.1.10 OGUC (DS N°15) define la orientación predominante de
cada muro por su **dirección normal en grados sexagesimales**, con `0°` = norte geográfico:

| Orientación | Rango azimut |
|---|---|
| Norte | 315° → 45° |
| Oriente | 45° → 135° |
| Sur | 135° → 225° |
| Poniente | 225° → 315° |

La **Tabla 3** (% vidriado) usa tres columnas: `N`, `OP` (**Oriente + Poniente
combinados**) y `S`, más `OGT` global. El motor devuelve la cara ya en columna de Tabla 3:

| Tabla 4 | columna Tabla 3 |
|---|---|
| Norte | `N` |
| Oriente / Poniente | `OP` |
| Sur | `S` |

**Bordes (45°/135°/225°/315° = NE/SE/SO/NO):** no hay categorías diagonales. En el
límite exacto se asigna al sector **más restrictivo** (en hemisferio sur la permisividad
decrece N → OP → S), criterio conservador: `45°→OP`, `135°→S`, `225°→S`, `315°→OP`.

Fallback por letra (cuando no viene `azimuth_deg`): `N`→`N`, `S`→`S`, `E`/`O`/`W`→`OP`.

---

## Dónde vive

- **Motor (puro, testeable):** `src/lib/engines/revit-import.js` → `procesarEntradaRevit(entrada)`.
- **Tests (round-trip):** `src/__tests__/revit_import.test.js`.
- **UI de prueba (solo admin):** panel **Admin → 🔗 Revit** (`src/modules/RevitBridge.jsx`),
  oculta para usuarios normales (guard `isAdmin`).
