import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion.js";

/**
 * <video> mudo en loop que solo se reproduce mientras está visible.
 * `preload="none"` + IntersectionObserver: no baja nada hasta entrar en
 * pantalla y se pausa al salir (también si lo recorta un carrusel con
 * overflow, porque IO tiene en cuenta el clipping de los ancestros).
 * Con reduced motion queda quieto mostrando el poster.
 */
export default function InViewVideo({ src, poster, className, label, threshold = 0.5 }) {
  const ref = useRef(null);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video || reduceMotion || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        // play() rechaza si el navegador bloquea el autoplay: no es un error.
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold }
    );
    io.observe(video);
    return () => {
      io.disconnect();
      video.pause();
    };
  }, [reduceMotion, threshold]);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster || undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
    />
  );
}
