# Actualizar la zonificación térmica (comuna → zona DS N°15)

La asignación comuna→zona sale de la **tabla oficial DITEC/MINVU**
`TABLA-ZT_REGIONES_PROVINCIAS-Y-COMUNAS.pdf` (depende de ALTITUD y, en 8 comunas,
de MERIDIANO). No hay feed automático desde MINVU, así que la actualización es
**manual** cuando el decreto se modifica.

## Cadena de datos

```
TABLA-ZT...pdf  ──(scripts/extraer-zt-ditec.mjs)──▶  src/data/zonas_ditec.js  (COMUNAS_ZT, autogenerado)
                                                            │
                          src/data/zonas_oficial.js  ◀──────┘  (deriva COMUNAS_ZONA + resolverZona/resolverZonaPorCota)
                                                            │
                                src/data.js (COMUNAS_ZONA) ◀─┘  ← lo consume toda la verificación OGUC
```

- `src/data/zonas_ditec.js` es **autogenerado — NO editar a mano**.
- Excepciones/alias (Coyhaique↔Coihaique, Antártica→I, etc.) viven en
  `src/data/zonas_oficial.js`.

## Pasos para actualizar

1. Reemplaza el PDF en `Downloads/` (o pásalo por argumento). Default esperado:
   `C:/Users/UCSC/Downloads/TABLA-ZT_REGIONES_PROVINCIAS-Y-COMUNAS.pdf`.
2. Regenera el dataset:
   ```
   npm run zonas:extraer            # o: node scripts/extraer-zt-ditec.mjs "ruta.pdf" --write
   ```
3. Audita fidelidad y cobertura (debe dar 0 huecos/colisiones, formatos todos parseados):
   ```
   npm run zonas:auditar
   ```
   Revisa: filas descartadas = solo encabezados; "Re-extracción vs commiteado" coherente;
   "Catálogo SIN zona oficial" = 0. Si aparece un **formato de altitud no reconocido** o una
   **colisión de nombre**, ajusta `parseAlt`/`COL` en el extractor o `STOP`/alias en `zonas_oficial.js`.
4. Corre los tests (bloquean divergencias no intencionadas y el round-trip de nombres):
   ```
   npm test
   ```
5. Si cambian asignaciones, revisa el impacto y avisa a usuarios. Para regenerar el
   reporte de cambios compara contra el `COMUNAS_ZONA` previo (ver historial git).

## Notas

- Si la tabla agrega comunas o cambia umbrales de cota, el extractor los toma solos
  (las bandas son por comuna). Solo revisa el `--debug` del extractor para multi-zona nuevas.
- Si una comuna nueva no resuelve (nombre distinto al catálogo `comunas_chile.js`),
  agrega su alias en `LOOKUP_ALIAS` de `zonas_oficial.js`.
- `resolverZona(comuna, { cota, lng })` resuelve la duplicidad por altitud y/o longitud;
  sin datos, la UI muestra las bandas y deja elegir (no bloquea).
