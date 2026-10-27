// frontend/src/pages/Privacy.jsx
import { STORE_NAME } from "../config/brand.js";
import LegalLayout from "../components/legal/LegalLayout.jsx";

const SECTIONS = [
  {
    id: "datos",
    title: "Qué datos recopilamos",
    content: (
      <ul>
        <li>Datos de contacto: <strong>nombre, email, teléfono</strong>.</li>
        <li>Datos de envío: <strong>dirección</strong> y notas para la entrega.</li>
        <li>Datos del pedido: productos, cantidades, estado de pago y envío.</li>
        <li>Comprobante de pago (si lo subís): imagen/PDF asociado a tu pedido.</li>
      </ul>
    ),
  },
  {
    id: "uso",
    title: "Para qué los usamos",
    content: (
      <>
        <ul>
          <li>Procesar y confirmar pedidos.</li>
          <li>Coordinar envíos y comunicar estados (pago/envío).</li>
          <li>Soporte y atención al cliente.</li>
          <li>Mejorar la experiencia de compra (métricas básicas y errores).</li>
        </ul>
        <p>
          Importante: <strong>no almacenamos datos de tarjeta</strong>.
          El pago se realiza por transferencia (banco/MP).
        </p>
      </>
    ),
  },
  {
    id: "terceros",
    title: "Con quién compartimos datos",
    content: (
      <>
        <p>Solo compartimos lo necesario para cumplir el servicio:</p>
        <ul>
          <li>Servicios de envío (Correo Argentino / Andreani / OCA / Moto) para entregar tu compra.</li>
          <li>Proveedores de email (si se envían notificaciones).</li>
        </ul>
        <p>No vendemos ni alquilamos tu información.</p>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "Seguridad",
    content: (
      <p>
        Aplicamos medidas razonables de seguridad para proteger tus datos. Aun así,
        ninguna transmisión por internet es 100% infalible. Si detectás algo raro, avisános.
      </p>
    ),
  },
  {
    id: "derechos",
    title: "Tus derechos",
    content: (
      <p>
        Podés solicitar acceso, actualización o eliminación de tus datos, salvo lo necesario
        para cumplir obligaciones legales/operativas (por ejemplo, registros de pedidos).
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <LegalLayout
      path="/privacy"
      title="Política de privacidad"
      updated="2026-10-22"
      intro={
        <>
          En <strong>{STORE_NAME}</strong> cuidamos tus datos.
          Usamos la información solo para gestionar pedidos, soporte y mejoras del servicio.
        </>
      }
      sections={SECTIONS}
      contact={{
        text: "Para consultas sobre privacidad, escribinos:",
        message: `Hola! 👋 Tengo una consulta sobre privacidad/datos en ${STORE_NAME}.`,
      }}
      note={{
        label: "Nota",
        text: "Esta política puede actualizarse para mejorar la claridad o adaptarse a cambios operativos.",
      }}
    />
  );
}
