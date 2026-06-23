# Registro de Actividades de Tratamiento — NormaCheck

Documento interno exigido por la **Ley N° 21.719** (protección de datos personales,
Chile). Describe cada actividad de tratamiento: qué datos, con qué finalidad, bajo
qué base de licitud, por cuánto tiempo, con qué destinatarios y con qué medidas de
seguridad. Mantener actualizado cuando cambien los tratamientos.

- **Responsable del tratamiento:** Roberto Bacigalupo Parra (persona natural). _Actualizar a razón social + RUT al constituir empresa._
- **Contacto de privacidad:** r.bacigalupo.p@gmail.com
- **Última actualización:** 2026-06-15

---

## Encargados (procesan datos por cuenta del responsable)
| Encargado | Servicio | Ubicación | Resguardo |
|---|---|---|---|
| **Supabase** | Base de datos + autenticación | Servidores fuera de Chile (posible) | Cláusulas contractuales de protección equivalente (transferencia internacional). **Pendiente: DPA firmado.** |
| **Vercel** | Alojamiento de la aplicación web | Servidores fuera de Chile (posible) | Ídem. **Pendiente: DPA.** |

---

## Actividades de tratamiento

### 1. Gestión de cuentas de usuario
- **Datos:** nombre, correo electrónico; opcionalmente RUT, título y teléfono profesional. Registro del consentimiento (versión + fecha) en metadatos de autenticación.
- **Titulares:** usuarios registrados (arquitectos/profesionales).
- **Finalidad:** autenticación, prestación del servicio, soporte.
- **Base de licitud:** consentimiento (al registrarse) + ejecución del contrato de servicio.
- **Conservación:** mientras la cuenta esté activa; eliminación a solicitud del titular (ARCO+).
- **Destinatarios:** Supabase (auth + BD).
- **Seguridad:** contraseñas con hash (Supabase Auth), RLS por usuario, cifrado en tránsito (HTTPS).

### 2. Gestión de proyectos
- **Datos:** datos técnicos del proyecto; opcionalmente datos de terceros (propietario, RUT, dirección, profesional responsable, correo, teléfono).
- **Titulares:** el usuario y terceros identificados en el proyecto (propietario/profesional).
- **Finalidad:** ejecutar la verificación normativa y generar informes.
- **Base de licitud:** consentimiento / ejecución del contrato. El usuario declara contar con base legal para ingresar datos de terceros (minimización: campos opcionales, solo para el informe).
- **Conservación:** mientras la cuenta esté activa o hasta que el usuario elimine el proyecto/cuenta (ARCO+).
- **Destinatarios:** Supabase.
- **Seguridad:** RLS por usuario/organización, cifrado en tránsito.

### 3. Registros de inicio de sesión (auditoría)
- **Datos:** identificador de usuario y marca de tiempo de acceso (tabla `sesiones_login`).
- **Finalidad:** seguridad y trazabilidad de accesos.
- **Base de licitud:** interés legítimo en la seguridad del servicio.
- **Conservación:** **12 meses**, luego purga automática (ver `sql/020_retencion.sql`).
- **Destinatarios:** Supabase.

### 4. Buzón de feedback
- **Datos:** identificador de usuario y contenido del mensaje (tabla `feedback`).
- **Finalidad:** soporte y mejora del producto.
- **Base de licitud:** consentimiento.
- **Conservación:** mientras sea útil para soporte; se elimina con la cuenta (cascada).
- **Destinatarios:** Supabase.

### 5. Gestión de plan y tokens de informes
- **Datos:** plan del usuario, contador de informes generados/disponibles.
- **Finalidad:** control de uso y facturación del servicio.
- **Base de licitud:** ejecución del contrato.
- **Conservación:** mientras la cuenta esté activa.
- **Destinatarios:** Supabase.

---

## Derechos de los titulares (ARCO+)
Acceso, rectificación, cancelación, oposición, portabilidad y bloqueo. Canales:
- **Autoservicio en la app** (menú → "Mis datos y privacidad"): descargar datos (acceso/portabilidad) y eliminar cuenta (cancelación).
- **Correo** r.bacigalupo.p@gmail.com para el resto; respuesta en 30 días hábiles.

## Notificación de incidentes
Ante una vulneración de seguridad que afecte datos personales, notificar a la
**Agencia de Protección de Datos** dentro de **72 horas** desde su conocimiento, y a
los titulares afectados si el riesgo es alto.

## Pendientes de cumplimiento (no técnicos)
- DPA (contrato de encargado) con Supabase y Vercel.
- Revisión legal de la Política de Privacidad antes de considerarla definitiva.
- Al constituir empresa: actualizar responsable (razón social + RUT + domicilio) y subir `POLITICA_VERSION`.
