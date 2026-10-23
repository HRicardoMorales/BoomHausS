import { Link } from "react-router-dom";
import { SITE_NAME } from "../../seo/routeSeo.js";
import Skeleton from "../ui/Skeleton";
import "./PaymentResult.css";

/*
 * Vista del regreso desde Mercado Pago. Componente 100 % presentacional:
 * no hace fetch, no limpia el carrito ni toca el pixel. `SuccessPayment`
 * resuelve el estado (verificado contra el backend) y solo le pasa `kind`.
 */

const COPY = {
  verifying: {
    eyebrow: "Verificando",
    title: "Confirmando tu pago…",
    text: "Estamos consultando a Mercado Pago. Tarda unos segundos; no cierres esta página.",
  },
  approved: {
    eyebrow: "Pago aprobado",
    title: "¡Tu compra fue exitosa!",
    text: "Recibimos tu pago y ya estamos preparando tu pedido. Te enviamos la confirmación por email.",
  },
  pending: {
    eyebrow: "Pago pendiente",
    title: "Tu pago está en revisión",
    text: "Cuando Mercado Pago lo confirme, tu pedido se activa solo. Te avisamos por email.",
  },
  rejected: {
    eyebrow: "Pago rechazado",
    title: "El pago no se pudo procesar",
    text: "No se realizó ningún cobro. Podés intentarlo de nuevo con otro medio de pago.",
  },
};

/* Hitos Pedido → Pago → Envío, mismo vocabulario que "Mis pedidos". */
const STEPS = {
  verifying: [["done", "Pedido creado"], ["current", "Verificando pago"], ["waiting", "Envío"]],
  approved: [["done", "Pedido creado"], ["done", "Pago aprobado"], ["current", "Preparando envío"]],
  pending: [["done", "Pedido creado"], ["current", "Pago en revisión"], ["waiting", "Envío"]],
  rejected: [["done", "Pedido creado"], ["stopped", "Pago rechazado"], ["waiting", "Envío"]],
};

const ACTIONS = {
  verifying: null,
  approved: { to: "/my-orders", label: "Ver mis pedidos" },
  pending: { to: "/my-orders", label: "Ver estado de mi pedido" },
  rejected: { to: "/checkout", label: "Reintentar pago" },
};

function Seal({ kind }) {
  return (
    <span className={`pr-seal pr-seal--${kind}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {kind === "approved" && <path className="pr-seal__draw" d="M14 25l7 7 13-15" />}
        {kind === "rejected" && <path className="pr-seal__draw" d="M17 17l14 14M31 17L17 31" />}
        {kind === "pending" && (
          <>
            <circle cx="24" cy="24" r="11" />
            <path className="pr-seal__hand" d="M24 17v7l4.5 3" />
          </>
        )}
        {kind === "verifying" && <circle className="pr-seal__spin" cx="24" cy="24" r="11" pathLength="100" />}
      </svg>
    </span>
  );
}

/**
 * @param {"verifying"|"approved"|"pending"|"rejected"} kind
 * @param {string|null} orderRef     external_reference de MP
 * @param {string|null} paymentId    id de operación de MP
 * @param {string|null} paymentLabel medio de pago legible
 */
export default function PaymentResult({ kind, orderRef, paymentId, paymentLabel }) {
  const copy = COPY[kind];
  const action = ACTIONS[kind];
  const rows = [
    orderRef && ["Pedido", `#${orderRef.slice(-6).toUpperCase()}`],
    paymentId && ["Operación MP", `#${paymentId}`],
    paymentLabel && ["Medio de pago", paymentLabel],
  ].filter(Boolean);

  return (
    <main className={`pr pr--${kind}`} aria-labelledby="pr-title">
      <title>{`${copy.eyebrow} · ${SITE_NAME}`}</title>
      <meta name="robots" content="noindex, nofollow" />

      <article className="pr-ticket">
        <div className="pr-head" role="status" aria-live="polite">
          <Seal kind={kind} />
          <p className="pr-eyebrow">{copy.eyebrow}</p>
          <h1 id="pr-title" className="pr-title">{copy.title}</h1>
          <p className="pr-text">{copy.text}</p>
        </div>

        <ol className="pr-steps" aria-label="Estado del pedido">
          {STEPS[kind].map(([state, label]) => (
            <li key={label} className={`pr-step pr-step--${state}`}>
              <span className="pr-step__dot" aria-hidden="true" />
              <span className="pr-step__label">{label}</span>
              <span className="sr-only">
                {state === "done" ? " (listo)" : state === "current" ? " (en curso)" : state === "stopped" ? " (detenido)" : " (pendiente)"}
              </span>
            </li>
          ))}
        </ol>

        {rows.length > 0 && (
          <div className="pr-receipt">
            <span className="pr-perf" aria-hidden="true" />
            <dl className="pr-rows">
              {rows.map(([label, value]) => (
                <div key={label} className="pr-row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {kind === "approved" && (
          <ul className="pr-next">
            <li><span><strong>Email de confirmación</strong> con el detalle de tu compra.</span></li>
            <li><span><strong>Número de seguimiento</strong> apenas despachemos.</span></li>
            <li><span>Entrega estimada: <strong>3 a 7 días hábiles</strong> a todo el país.</span></li>
          </ul>
        )}

        <div className="pr-actions">
          {action ? (
            <Link to={action.to} className="btn btn-primary">{action.label}</Link>
          ) : (
            <Skeleton className="pr-actions__skel" height="3rem" radius="var(--radius-control)" />
          )}
          <Link to="/" className="btn btn-ghost">Volver al inicio</Link>
        </div>
      </article>
    </main>
  );
}
