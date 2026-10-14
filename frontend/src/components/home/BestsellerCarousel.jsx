import { useCallback, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ProductCard from "./ProductCard.jsx";

/*
 * Carrusel de destacados con Embla (≈7 KB gzip, sin dependencias): swipe
 * nativo, flechas que se deshabilitan en los extremos y barra de progreso
 * ligada al scroll real. Cada card lleva su número de ranking.
 * Se ordena por descuento (no hay datos de ventas en el modelo): el título no
 * promete "más vendidos".
 */
const clamp01 = (n) => Math.max(0, Math.min(1, n || 0));

export default function BestsellerCarousel({ title, eyebrow, products }) {
  const [viewportRef, embla] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
  });
  // Estado de Embla vía useSyncExternalStore: sin setState en effects y con
  // un snapshot primitivo (string) para que React compare por valor.
  const subscribe = useCallback(
    (notify) => {
      if (!embla) return () => {};
      embla.on("select", notify).on("reInit", notify).on("scroll", notify);
      return () => embla.off("select", notify).off("reInit", notify).off("scroll", notify);
    },
    [embla]
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (embla
      ? `${+embla.canScrollPrev()}|${+embla.canScrollNext()}|${clamp01(embla.scrollProgress()).toFixed(3)}`
      : "0|0|0"),
    () => "0|0|0"
  );
  const [prevFlag, nextFlag, progressStr] = snapshot.split("|");
  const canPrev = prevFlag === "1";
  const canNext = nextFlag === "1";
  const progress = Number(progressStr);

  return (
    <section className="hc-best" aria-labelledby="hc-best-title">
      <header className="hc-best-head">
        <div>
          {eyebrow && <p className="hc-best-eyebrow">{eyebrow}</p>}
          <h2 className="hc-best-title" id="hc-best-title">{title}</h2>
        </div>
        <div className="hc-best-nav">
          <button
            type="button"
            className="hc-best-arrow"
            onClick={() => embla?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Productos anteriores"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className="hc-best-arrow"
            onClick={() => embla?.scrollNext()}
            disabled={!canNext}
            aria-label="Más productos"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      <div className="hc-best-viewport" ref={viewportRef}>
        <ol className="hc-best-track">
          {products.map((p, i) => (
            <li className="hc-best-slide" key={p._id}>
              <span className="hc-best-rank" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <ProductCard product={p} reveal={false} />
            </li>
          ))}
        </ol>
      </div>

      <div className="hc-best-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${0.12 + progress * 0.88})` }} />
      </div>
    </section>
  );
}
