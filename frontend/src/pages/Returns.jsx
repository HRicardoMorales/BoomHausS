// frontend/src/pages/Returns.jsx
import { Link } from "react-router-dom";
import { STORE_NAME } from "../config/brand.js";
import LegalLayout from "../components/legal/LegalLayout.jsx";

const SECTIONS = [
  {
    id: "cuando-aplica",
    title: "¿Cuándo aplica?",
    content: (
      <ul>
        <li>Producto con <strong>fallas</strong> o que llegó <strong>dañado</strong>.</li>
        <li>Producto <strong>incorrecto</strong> (no coincide con lo pedido).</li>
        <li>Problemas de entrega (evaluamos caso a caso según el método de envío).</li>
      </ul>
    ),
  },
  {
    id: "plazos",
    title: "Plazos",
    content: (
      <p>
        Recomendación: contactanos dentro de las <strong>48 horas</strong> desde que recibís el producto.
        Si el problema es visible (daño/falla), cuanto antes nos escribas, mejor.
      </p>
    ),
  },
  {
    id: "que-necesitamos",
    title: "¿Qué necesitamos?",
    content: (
      <ul>
        <li>Número de pedido (lo ves en <strong>Mis pedidos</strong>).</li>
        <li>Fotos o video del problema (daño, falla o producto incorrecto).</li>
        <li>Dirección de entrega y datos de contacto.</li>
      </ul>
    ),
  },
  {
    id: "resolucion",
    title: "Resolución",
    content: (
      <>
        <p>Según el caso, podemos ofrecer:</p>
        <ul>
          <li><strong>Cambio</strong> por otro producto equivalente.</li>
          <li><strong>Reintegro</strong> (por transferencia), si corresponde.</li>
          <li><strong>Solución alternativa</strong> acordada con vos (caso a caso).</li>
        </ul>
        <p>Importante: como el pago es por transferencia, los reintegros se realizan también por transferencia.</p>
      </>
    ),
  },
];

export default function Returns() {
  return (
    <LegalLayout
      path="/returns"
      title="Cambios y devoluciones"
      updated="2026-10-22"
      intro={
        <>
          Queremos que compres con tranquilidad. Si algo no llega como esperabas, lo resolvemos.
          Esta política aplica a compras en <strong>{STORE_NAME}</strong>.
        </>
      }
      sections={SECTIONS}
      contact={{
        text: "Si necesitás iniciar un cambio o devolución, escribinos y te guiamos.",
        message: `Hola! 👋 Necesito ayuda con un cambio/devolución en ${STORE_NAME}.`,
        extra: <Link className="btn btn-ghost" to="/my-orders">Ver mis pedidos →</Link>,
      }}
      note={{
        label: "Nota",
        text: "Esta política es un marco general. Si hay un caso especial, lo charlamos y lo resolvemos de la mejor manera.",
      }}
    />
  );
}
