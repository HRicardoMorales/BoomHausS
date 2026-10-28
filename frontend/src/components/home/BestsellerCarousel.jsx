import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { m } from "framer-motion";
import ProductCard from "./ProductCard.jsx";
import { TAP_PRESS } from "../motion/motionPresets.js";
import { whenIdle } from "../../utils/lazyWithRetry.js";

/*
 * Carrusel de destacados con Embla (≈7 KB gzip, sin dependencias): swipe
 * nativo, flechas que se deshabilitan en los extremos y barra de progreso
 * ligada al scroll real. Cada card lleva su número de ranking.
 * El progreso no pasa por React: el listener de `scroll` de Embla escribe el
 * `transform` directo en el nodo y la transición CSS lo suaviza (0 renders al
 * arrastrar; antes cada evento re-renderizaba la sección entera). Se probó
 * `useSpring` de Framer: +4,3 KB gz en el entry por un efecto que CSS ya da.
 * El orden lo decide la home: por ventas reales (GET /products/bestsellers)
 * cuando hay datos suficientes, si no por descuento con otro título.
 * Embla se monta recién cuando el hilo queda ocioso (o al primer toque/foco):
 * hasta entonces el viewport no recibe su ref, porque Embla mide los slides
 * aunque se le pase `active: false`. Al iniciar mide con `offsetTop/offsetWidth`, lo que
 * fuerza un layout de toda la página. Hecho dentro del commit del catálogo
 * sumaba ~100 ms (CPU ×4) a una tarea ya larga; en idle el layout ya está
 * hecho y la medición es una lectura barata. Hasta entonces las slides se ven
 * igual (Embla solo agrega `transform`) y las flechas quedan deshabilitadas.
 */
const MotionButton = m.button;

const clamp01 = (n) => Math.max(0, Math.min(1, n || 0));

export default function BestsellerCarousel({ title, eyebrow, products }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let raf = 0;
    let timer = 0;
    // Ocioso → próximo frame → tarea siguiente: así la activación cae justo
    // después de un layout limpio y no se mezcla con otro commit grande.
    const cancelIdle = whenIdle(() => {
      raf = requestAnimationFrame(() => {
        timer = setTimeout(() => setActive(true), 0);
      });
    });
    return () => {
      cancelIdle();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);
  const activate = () => setActive(true);
  const [viewportRef, embla] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
  });
  // Flechas vía useSyncExternalStore: sin setState en effects y con un
  // snapshot primitivo; solo `select`/`reInit` (cambian los extremos), no
  // `scroll`, así arrastrar no re-renderiza.
  const subscribe = useCallback(
    (notify) => {
      if (!embla) return () => {};
      embla.on("select", notify).on("reInit", notify);
      return () => embla.off("select", notify).off("reInit", notify);
    },
    [embla]
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (embla ? `${+embla.canScrollPrev()}|${+embla.canScrollNext()}` : "0|0"),
    () => "0|0"
  );
  const [prevFlag, nextFlag] = snapshot.split("|");
  const canPrev = prevFlag === "1";
  const canNext = nextFlag === "1";

  const barRef = useRef(null);

  useEffect(() => {
    if (!embla) return undefined;
    const sync = () => {
      const bar = barRef.current;
      if (bar) bar.style.transform = `scaleX(${0.12 + clamp01(embla.scrollProgress()) * 0.88})`;
    };
    sync();
    embla.on("scroll", sync).on("reInit", sync);
    return () => embla.off("scroll", sync).off("reInit", sync);
  }, [embla]);

  return (
    <section className="hc-best" aria-labelledby="hc-best-title">
      <header className="hc-best-head">
        <div>
          {eyebrow && <p className="hc-best-eyebrow">{eyebrow}</p>}
          <h2 className="hc-best-title" id="hc-best-title">{title}</h2>
        </div>
        <div className="hc-best-nav">
          <MotionButton
            type="button"
            className="hc-best-arrow"
            whileTap={TAP_PRESS}
            onClick={() => embla?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Productos anteriores"
          >
            <span aria-hidden="true">←</span>
          </MotionButton>
          <MotionButton
            type="button"
            className="hc-best-arrow"
            whileTap={TAP_PRESS}
            onClick={() => embla?.scrollNext()}
            disabled={!canNext}
            aria-label="Más productos"
          >
            <span aria-hidden="true">→</span>
          </MotionButton>
        </div>
      </header>

      <div
        className="hc-best-viewport"
        ref={active ? viewportRef : undefined}
        onPointerDownCapture={active ? undefined : activate}
        onFocusCapture={active ? undefined : activate}
      >
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
        <span ref={barRef} style={{ transform: "scaleX(0.12)" }} />
      </div>
    </section>
  );
}
