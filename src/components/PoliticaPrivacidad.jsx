// ─────────────────────────────────────────────────────────────────────────────
// PoliticaPrivacidad.jsx — Política de Privacidad (Ley 21.719 Chile)
//
// BORRADOR FUNCIONAL: cubre lo exigido por la Ley 21.719 (información al titular,
// finalidades, base de licitud, encargados/transferencia, conservación, derechos
// ARCO+, seguridad y contacto). Antes de publicar como definitiva, COMPLETAR los
// campos [COMPLETAR: ...] y hacerla revisar por un abogado de protección de datos.
//
// `POLITICA_VERSION` versiona el texto: al registrarse se guarda esta versión +
// timestamp como prueba del consentimiento. Si cambias el texto de forma
// sustantiva, sube la versión para re-pedir consentimiento.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react'

export const POLITICA_VERSION = '2026-06-15'

// Responsable del tratamiento. Por ahora persona natural; al constituir empresa,
// reemplazar por razón social + RUT + domicilio y subir POLITICA_VERSION.
const RESPONSABLE = 'Roberto Bacigalupo Parra'
const EMAIL_PRIVACIDAD = 'r.bacigalupo.p@gmail.com'

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { background: '#fff', borderRadius: 12, maxWidth: 760, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid #e2e8f0' },
  body: { padding: '18px 22px', overflowY: 'auto', fontSize: 13.5, lineHeight: 1.6, color: '#334155' },
  h1: { fontSize: 17, fontWeight: 800, color: '#04302e', margin: 0 },
  h2: { fontSize: 14, fontWeight: 700, color: '#0e6560', margin: '18px 0 6px' },
  p: { margin: '0 0 8px' },
  li: { margin: '2px 0' },
  close: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b', lineHeight: 1 },
  meta: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
}

export function PoliticaPrivacidadModal({ onClose }) {
  return (
    <div style={S.overlay} onMouseDown={onClose}>
      <div style={S.card} onMouseDown={e => e.stopPropagation()}>
        <div style={S.head}>
          <div>
            <h1 style={S.h1}>Política de Privacidad</h1>
            <div style={S.meta}>Talora · Versión {POLITICA_VERSION} · Ley N° 21.719</div>
          </div>
          <button style={S.close} onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div style={S.body}>
          <p style={S.p}>
            Esta Política describe cómo Talora trata tus datos personales conforme a la
            Ley N° 21.719 sobre protección de los datos personales. Al crear una cuenta y usar
            la plataforma, declaras haber leído y aceptado esta Política.
          </p>

          <h2 style={S.h2}>1. Responsable del tratamiento</h2>
          <p style={S.p}>
            Talora es operado por <b>{RESPONSABLE}</b> (persona natural).
            Contacto de privacidad: <b>{EMAIL_PRIVACIDAD}</b>.
          </p>

          <h2 style={S.h2}>2. Qué datos tratamos</h2>
          <ul>
            <li style={S.li}><b>De tu cuenta:</b> nombre, correo electrónico y, si los ingresas, datos profesionales (RUT, título, teléfono).</li>
            <li style={S.li}><b>De tus proyectos:</b> datos que tú ingresas, que pueden incluir información de terceros (propietario, RUT, dirección, profesional responsable, correo y teléfono).</li>
            <li style={S.li}><b>De uso:</b> registros de inicio de sesión y mensajes que nos envías por el buzón de feedback.</li>
          </ul>

          <h2 style={S.h2}>3. Finalidades</h2>
          <ul>
            <li style={S.li}>Prestarte el servicio de verificación normativa y generar tus informes.</li>
            <li style={S.li}>Gestionar tu cuenta, autenticación y soporte.</li>
            <li style={S.li}>Mejorar la plataforma a partir de tu feedback.</li>
          </ul>

          <h2 style={S.h2}>4. Base de licitud</h2>
          <p style={S.p}>
            Tratamos tus datos sobre la base de <b>tu consentimiento</b> y de la
            <b> ejecución del contrato</b> de prestación del servicio. Cuando ingresas datos de
            terceros en un proyecto, declaras contar con base legal para hacerlo y eres responsable
            de informar a esas personas.
          </p>

          <h2 style={S.h2}>5. Encargados y transferencia internacional</h2>
          <p style={S.p}>
            Usamos proveedores que tratan datos por cuenta nuestra: <b>Supabase</b> (base de datos
            y autenticación) y <b>Vercel</b> (alojamiento). Estos proveedores pueden almacenar datos
            en servidores ubicados fuera de Chile, aplicando resguardos contractuales de protección
            equivalentes a los de la Ley N° 21.719.
          </p>

          <h2 style={S.h2}>6. Conservación</h2>
          <p style={S.p}>
            Conservamos tus datos mientras tu cuenta esté activa y por el plazo necesario para
            cumplir obligaciones legales. Puedes solicitar la eliminación de tu cuenta y datos en
            cualquier momento (ver punto 7).
          </p>

          <h2 style={S.h2}>7. Tus derechos (ARCO+)</h2>
          <p style={S.p}>Como titular de los datos puedes ejercer los derechos de:</p>
          <ul>
            <li style={S.li}><b>Acceso:</b> saber qué datos tuyos tratamos.</li>
            <li style={S.li}><b>Rectificación:</b> corregir datos inexactos.</li>
            <li style={S.li}><b>Cancelación / supresión:</b> eliminar tus datos.</li>
            <li style={S.li}><b>Oposición:</b> oponerte a un tratamiento.</li>
            <li style={S.li}><b>Portabilidad:</b> recibir tus datos en un formato estructurado.</li>
            <li style={S.li}><b>Bloqueo:</b> suspender temporalmente el tratamiento.</li>
          </ul>
          <p style={S.p}>
            Para ejercerlos, escríbenos a <b>{EMAIL_PRIVACIDAD}</b>. Responderemos dentro del plazo
            legal de 30 días hábiles. Algunas opciones (descargar tus datos y eliminar tu cuenta)
            están disponibles directamente en tu perfil.
          </p>

          <h2 style={S.h2}>8. Seguridad</h2>
          <p style={S.p}>
            Aplicamos medidas técnicas y organizativas para proteger tus datos (control de acceso
            por usuario mediante seguridad a nivel de fila, cifrado en tránsito y límites de uso).
            Ante un incidente de seguridad que te afecte, te notificaremos conforme a la ley.
          </p>

          <h2 style={S.h2}>9. Cambios</h2>
          <p style={S.p}>
            Podemos actualizar esta Política. Si el cambio es sustantivo, te pediremos aceptar la
            nueva versión. La versión vigente se identifica arriba.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PoliticaPrivacidadModal
