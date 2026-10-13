import { useEffect } from "react";

/**
 * Reveal on scroll de la home (mismo patrón que MundialLanding): lo que ya
 * está en pantalla se muestra enseguida (el stagger lo da el
 * `transitionDelay` inline) y lo que está bajo el pliegue lo revela un
 * IntersectionObserver. Se re-ejecuta al cambiar de categoría.
 */
export function useHomeReveal(enabled, key) {
  useEffect(() => {
    if (!enabled) return;
    let io = null;
    const timer = setTimeout(() => {
      const vh = window.innerHeight;
      const belowFold = [];

      document.querySelectorAll(".hc-card.reveal:not(.is-visible)").forEach((el) => {
        if (el.getBoundingClientRect().top < vh + 60) el.classList.add("is-visible");
        else belowFold.push(el);
      });

      document.querySelectorAll(".hc-anim:not(.in-view)").forEach((el) => {
        if (el.getBoundingClientRect().top < vh) {
          el.classList.add("in-view");
        } else {
          el.classList.add("hc-hidden");
          belowFold.push(el);
        }
      });

      if (!belowFold.length) return;
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          if (!e.isIntersecting) return;
          if (e.target.classList.contains("hc-card")) {
            e.target.classList.add("is-visible");
          } else {
            e.target.classList.remove("hc-hidden");
            e.target.classList.add("in-view");
          }
          io.unobserve(e.target);
        }),
        { threshold: 0.05 }
      );
      belowFold.forEach((el) => io.observe(el));
    }, 60);

    return () => {
      clearTimeout(timer);
      if (io) io.disconnect();
    };
  }, [enabled, key]);
}
