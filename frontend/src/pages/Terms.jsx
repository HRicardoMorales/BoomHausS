// frontend/src/pages/Terms.jsx
import { Link } from "react-router-dom";
import { STORE_NAME } from "../config/brand.js";
import LegalLayout from "../components/legal/LegalLayout.jsx";

const SECTIONS = [
  {
    id: "compra-y-registro",
    title: "Compra y registro",
    content: (
      <p>
        Podés comprar como invitado o crear cuenta. En ambos casos, sos responsable de brindar datos correctos
        (nombre, email, teléfono y dirección de envío).
      </p>
    ),
  },
  {
    id: "precios",
    title: "Precios y disponibilidad",
    content: (
      <p>
        Los precios se muestran en el sitio y pueden actualizarse. La compra queda sujeta a disponibilidad
        y a la validación del pago por transferencia.
      </p>
    ),
  },
  {
    id: "pagos",
    title: "Pagos (transferencia)",
    content: (
      <>
        <p>
          El pago se realiza por transferencia bancaria o transferencia por Mercado Pago. Una vez creado el pedido,
          deberás enviar/subir el comprobante para su verificación. La confirmación del pedido depende de la validación
          del pago.
        </p>
        <p>
          Importante: <strong>no solicitamos datos de tarjeta</strong>.
        </p>
      </>
    ),
  },
  {
    id: "envios",
    title: "Envíos",
    content: (
      <>
        <p>
          El envío se coordina según el método seleccionado (Correo Argentino / Andreani / OCA / Moto, según zona).
          Los plazos pueden variar según la empresa y la disponibilidad logística.
        </p>
        <p>
          Asegurate de ingresar una dirección completa y correcta. No nos responsabilizamos por demoras derivadas
          de datos incorrectos o ausencia en el domicilio.
        </p>
      </>
    ),
  },
  {
    id: "cambios",
    title: "Cambios y devoluciones",
    content: (
      <>
        <p>
          Si el producto llega dañado, con fallas o incorrecto, podés iniciar un reclamo. Revisá la política completa en:
        </p>
        <p>
          <Link className="btn btn-ghost" to="/returns">Cambios y devoluciones →</Link>
        </p>
      </>
    ),
  },
  {
    id: "uso-del-sitio",
    title: "Uso del sitio",
    content: (
      <p>
        Te comprometés a usar el sitio de forma lícita, sin intentar vulnerar la seguridad, automatizar abusivamente,
        ni interferir con el funcionamiento del servicio.
      </p>
    ),
  },
  {
    id: "responsabilidad",
    title: "Limitación de responsabilidad",
    content: (
      <p>
        Hacemos nuestro mejor esfuerzo para ofrecer información correcta y una experiencia segura. Aun así,
        pueden existir fallas técnicas o demoras ajenas al control del sitio (proveedores externos, envíos, etc.).
      </p>
    ),
  },
];

export default function Terms() {
  return (
    <LegalLayout
      path="/terms"
      title="Términos y condiciones"
      updated="2026-10-22"
      intro={
        <>
          Estos términos regulan el uso del sitio y las compras realizadas en <strong>{STORE_NAME}</strong>.
          Al comprar, aceptás estas condiciones.
        </>
      }
      sections={SECTIONS}
      contact={{
        text: "Si tenés dudas sobre estos términos, escribinos:",
        message: `Hola! 👋 Tengo una consulta sobre términos/compra en ${STORE_NAME}.`,
      }}
      note={{
        label: "Actualizaciones",
        text: "Estos términos pueden actualizarse. Si se realizan cambios relevantes, se reflejarán en el sitio.",
      }}
    />
  );
}
