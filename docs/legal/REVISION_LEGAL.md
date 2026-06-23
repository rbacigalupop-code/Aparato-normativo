# Brief de revisión legal — NormaCheck (Ley 21.719)

Documento para llevar al abogado de protección de datos: contexto del producto, qué
ya está implementado, qué falta y preguntas concretas. Objetivo: que el abogado
**revise y ajuste**, no que redacte de cero.

> No es asesoría legal. Preparado para acelerar la revisión profesional.

---

## 1. Qué es NormaCheck (contexto en 30 segundos)
SaaS web que ayuda a profesionales (arquitectos, etc.) a verificar el cumplimiento de
la normativa de construcción chilena (OGUC / DS N°15 térmico) y a generar informes para
la DOM. Beta con testers. Operado por **Roberto Bacigalupo Parra** (persona natural, por
ahora; se constituirá empresa más adelante). Infraestructura: **Supabase** (BD + auth) y
**Vercel** (hosting).

## 2. Datos personales que se tratan
| Categoría | Datos | Origen |
|---|---|---|
| Cuenta del usuario | nombre, email, (opc.) RUT/título/teléfono | el propio usuario |
| Proyectos | datos técnicos + (opc.) datos de terceros: propietario, RUT, dirección, profesional, email, teléfono | ingresados por el usuario |
| Uso | registros de inicio de sesión, feedback | automático / usuario |

No se tratan datos sensibles ni de menores. No hay perfilamiento ni decisiones automatizadas sobre personas.

## 3. Qué ya está implementado (técnico) — para que el abogado lo dé por cubierto
- **Consentimiento activo** al registrarse (casilla no pre-marcada, obligatoria) con registro de versión + fecha.
- **Política de Privacidad** publicada en la app (borrador completo en `docs/legal/POLITICA_PRIVACIDAD.md`).
- **Derechos ARCO+ autoservicio**: descargar datos (acceso/portabilidad) y eliminar cuenta (cancelación) desde el perfil; resto por correo.
- **Minimización**: datos de terceros opcionales + aviso de responsabilidad al usuario.
- **Retención**: purga automática de registros de inicio de sesión > 12 meses.
- **Seguridad**: RLS por usuario, contraseñas con hash, cifrado en tránsito, rate limits, cierre de fugas de PII (auditado).
- **Registro de actividades de tratamiento**: `docs/REGISTRO_TRATAMIENTO_DATOS.md`.

## 4. Qué falta (lo que necesitamos del abogado / decisiones)
1. **Revisar y validar la Política de Privacidad** (`docs/legal/POLITICA_PRIVACIDAD.md`). Confirmar bases de licitud, redacción de derechos y cláusula de transferencia internacional.
2. **Términos y Condiciones** del servicio — borrador completo en `docs/legal/TERMINOS_CONDICIONES.md` (validar). Outline original en §6.
3. **DPA (contrato de encargado) con Supabase y Vercel** — ver §5.
4. **Datos del responsable**: hoy persona natural (nombre + email). Definir si conviene constituir empresa antes de salir de beta y, al hacerlo, actualizar responsable (razón social, RUT, domicilio).
5. **Modelo de Prevención de Infracciones (MPI)**: evaluar si conviene adoptarlo (es atenuante de multas y, si se adopta, exige designar un Delegado de Protección de Datos).

## 5. DPA con encargados (cómo resolverlo — suele ser simple)
Tanto Supabase como Vercel publican **DPAs estándar (Data Processing Agreement)** que se
aceptan en línea; normalmente **no hay que negociar un contrato a medida**:
- **Supabase:** DPA disponible en su portal legal / panel de la organización (aceptar/descargar).
- **Vercel:** DPA disponible en su configuración de cuenta / portal legal.
Acción: aceptar/firmar ambos y guardar copia. Preguntar al abogado si requieren además
cláusulas de transferencia internacional adicionales para Chile.

## 6. Outline de Términos y Condiciones (a redactar/validar)
- Objeto del servicio y descripción.
- Cuenta: registro, requisitos, responsabilidad sobre credenciales.
- **Uso aceptable** y responsabilidad del usuario sobre los datos de terceros que ingresa.
- **Naturaleza del servicio / límite de responsabilidad**: NormaCheck es una **herramienta de apoyo**; la responsabilidad técnica del proyecto y la validación final ante la DOM recaen en el profesional. Los resultados son referenciales y no reemplazan el criterio profesional ni la revisión de la autoridad.
- Propiedad intelectual (de la plataforma y de los contenidos del usuario).
- Planes, pagos y tokens de informes (cuando aplique).
- Modificaciones del servicio y de los términos; terminación.
- Ley aplicable y jurisdicción (Chile).

## 7. Preguntas concretas para el abogado
1. ¿La base de licitud "consentimiento + ejecución de contrato" está bien planteada para cada finalidad (§4 de la política)?
2. Datos de **terceros** en los proyectos: ¿basta con la declaración del usuario de que tiene base legal, o necesitamos algo más (aviso al titular, cláusula específica)?
3. ¿La cláusula de **transferencia internacional** (Supabase/Vercel fuera de Chile) es suficiente o requiere mecanismo adicional bajo la Ley 21.719?
4. Operando como **persona natural** en beta, ¿hay algún riesgo relevante vs. constituir empresa antes? ¿Cuándo conviene formalizar?
5. ¿Nos conviene un **MPI** (atenuante) dado el tamaño? ¿Implica designar Delegado?
6. ¿Período de **conservación** razonable para cuentas/proyectos inactivos (hoy: mientras la cuenta esté activa)?
7. ¿Necesitamos **registro ante la Agencia** o algún trámite formal antes de dic-2026?

## 8. Plazos
- Vigencia plena de la ley: **1-dic-2026**.
- **Año de gracia PYME** (solo amonestaciones, no multas): hasta **1-dic-2027** (si calificamos como PYME, Ley 20.416).
- Objetivo: tener política + T&C + DPA cerrados **antes de dic-2026**; lo técnico ya está.
