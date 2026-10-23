import { useId } from "react";
import SafeImg from "../SafeImg.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import {
  formatOrderDate,
  headlineStep,
  isPaymentSettled,
  itemTotal,
  money,
  orderSteps,
  shippingMethodLabel,
  shortRef,
} from "./orderStatus.js";

/** Pedido → Pago → Envío como una línea de tiempo horizontal. */
function OrderProgress({ steps }) {
  return (
    <ol className="oc-progress" aria-label="Estado del pedido">
      {steps.map((s) => (
        <li key={s.key} className={`oc-step oc-step--${s.state}`}>
          <span className="oc-step__dot" aria-hidden="true" />
          <span className="oc-step__label">{s.label}</span>
          <span className="oc-step__hint">
            <span className="sr-only">{STATE_SR[s.state]}: </span>
            {s.hint}
          </span>
        </li>
      ))}
    </ol>
  );
}

const STATE_SR = { done: "Completo", current: "En curso", waiting: "Pendiente", stopped: "Detenido" };

/**
 * Tarjeta de un pedido del cliente. No hace requests: recibe los callbacks
 * de la página (la lógica de subida de comprobante vive allá, sin cambios).
 */
export default function OrderCard({ order: o, expanded, onToggle, onUpload, uploading, preview, index = 0 }) {
  const detailId = useId();
  const steps = orderSteps(o);
  const head = headlineStep(steps);
  const verified = isPaymentSettled(o);
  const hasProof = Boolean(o.paymentProofUrl);
  const { date, time } = formatOrderDate(o.createdAt);
  const items = o.items || [];
  const thumbs = items.filter((it) => it.imageUrl).slice(0, 3);
  const units = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

  const uploadLabel = uploading ? "Subiendo…" : verified ? "Pago verificado" : hasProof ? "Volver a subir" : "Subir comprobante";

  return (
    <article className={`oc oc--${head.state}`} style={{ "--oc-i": index }} aria-label={`Pedido ${shortRef(o._id)}`}>
      <header className="oc-head">
        <div className="oc-thumbs" aria-hidden="true">
          {thumbs.length ? (
            thumbs.map((it, i) => (
              <span key={i} className="oc-thumb">
                <SafeImg src={it.imageUrl} alt="" name={it.name} width={56} height={56} sizes="56px" widths={[56, 112]} />
              </span>
            ))
          ) : (
            <span className="oc-thumb oc-thumb--empty" />
          )}
        </div>

        <div className="oc-id">
          <p className="oc-ref">
            {shortRef(o._id)}
            <span className="oc-date">
              <time dateTime={o.createdAt}>{date}</time>
              {time && <span> · {time}</span>}
            </span>
          </p>
          <p className="oc-headline">{head.hint}</p>
          <p className="oc-meta">
            {units} {units === 1 ? "producto" : "productos"} · {shippingMethodLabel(o.shippingMethod)}
          </p>
        </div>

        <p className="oc-total">
          <span className="sr-only">Total: </span>
          {money(o.totalAmount)}
        </p>
      </header>

      <OrderProgress steps={steps} />

      <div className="oc-actions">
        <button
          type="button"
          className="oc-btn oc-btn--ghost"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={detailId}
        >
          {expanded ? "Ocultar detalle" : "Ver detalle"}
          <svg className="oc-chev" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          className="oc-btn oc-btn--primary"
          onClick={onUpload}
          disabled={verified || uploading}
          aria-busy={uploading || undefined}
        >
          {uploadLabel}
        </button>
      </div>

      <div id={detailId} className="oc-detail" hidden={!expanded}>
        {expanded && (
          <>
            <dl className="oc-facts">
              <div>
                <dt>Envío a</dt>
                <dd>{o.shippingAddress || "—"}</dd>
              </div>
              <div>
                <dt>N.º de pedido</dt>
                <dd className="oc-mono">{o._id}</dd>
              </div>
              {hasProof && (
                <div>
                  <dt>Comprobante</dt>
                  <dd>
                    <a href={o.paymentProofUrl} target="_blank" rel="noreferrer">
                      Ver archivo<span className="sr-only"> (se abre en otra pestaña)</span>
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            {preview && (
              <figure className="oc-preview">
                <img src={preview} alt="Vista previa del comprobante elegido" />
                <figcaption>Comprobante elegido</figcaption>
              </figure>
            )}

            <ul className="oc-items" aria-label="Productos del pedido">
              {items.map((it, idx) => {
                const total = itemTotal(it);
                const hasDiscount = it.compareAtPrice && Number(it.compareAtPrice) > total;
                const name = it.productName || it.name || "Producto";
                return (
                  <li key={idx} className="oc-item">
                    {it.imageUrl ? (
                      <span className="oc-item__img">
                        <SafeImg src={it.imageUrl} alt="" name={name} width={52} height={52} sizes="52px" widths={[52, 104]} />
                      </span>
                    ) : (
                      <span className="oc-item__img oc-thumb--empty" aria-hidden="true" />
                    )}
                    <span className="oc-item__info">
                      <span className="oc-item__name">{name}</span>
                      <span className="oc-item__qty">
                        {it.quantity} × {money(it.price)}
                      </span>
                    </span>
                    <span className="oc-item__total">
                      {hasDiscount && (
                        <s>
                          <span className="sr-only">Antes </span>
                          {money(it.compareAtPrice)}
                        </s>
                      )}
                      {money(total)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </article>
  );
}

/** Esqueleto con la misma silueta que la tarjeta. */
export function OrderCardSkeleton() {
  return (
    <div className="oc oc--skeleton" aria-hidden="true">
      <div className="oc-head">
        <Skeleton width="56px" height="56px" radius="14px" />
        <div className="oc-id">
          <Skeleton width="38%" height=".8rem" />
          <Skeleton width="62%" height="1.35rem" style={{ marginTop: ".45rem" }} />
          <Skeleton width="48%" height=".8rem" style={{ marginTop: ".45rem" }} />
        </div>
        <Skeleton width="5rem" height="1.3rem" />
      </div>
      <Skeleton height="2.6rem" radius="12px" style={{ display: "block", marginTop: "1.1rem" }} />
    </div>
  );
}
