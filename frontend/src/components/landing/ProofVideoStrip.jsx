import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { resolveMedia } from "../../utils/resolveMedia";
import "./ProofVideoStrip.css";

/**
 * <video> que solo se reproduce mientras está en pantalla.
 *
 * Los videos de prueba social pesan 5-7 Mbps cada uno: con `autoPlay` los tres
 * bajaban apenas cargaba la landing, aunque estuvieran varias pantallas abajo.
 * Ahora `preload="none"` + IntersectionObserver: arrancan al entrar en el
 * viewport y se pausan al salir. Con `prefers-reduced-motion` no hay autoplay
 * y se muestran los controles nativos.
 */
function InViewVideo({ src, label }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video || reduceMotion || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // play() rechaza si el navegador bloquea el autoplay: no es un error.
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <video
      ref={ref}
      className="lp-vs__media-el"
      src={src}
      muted
      loop
      playsInline
      preload={reduceMotion ? "metadata" : "none"}
      controls={reduceMotion}
      aria-label={label}
    />
  );
}

function StripMedia({ item }) {
  // `videoUrl` sin extensión reconocible (CDN) se trata igual como video.
  const fromVideo = item.videoUrl ? resolveMedia(item.videoUrl) : null;
  const media =
    fromVideo && fromVideo.type === "image" ? { type: "video", src: fromVideo.src } : fromVideo ?? resolveMedia(item.imgUrl);

  switch (media?.type) {
    case "iframe":
      return (
        <iframe
          className="lp-vs__media-el lp-vs__media-el--iframe"
          src={media.src}
          title={item.label}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          tabIndex={-1}
        />
      );
    case "video":
      return <InViewVideo src={media.src} label={item.label} />;
    case "gif":
    case "image":
      return (
        <img className="lp-vs__media-el" src={media.src} alt={item.label} loading="lazy" decoding="async" />
      );
    default:
      return (
        <div className="lp-vs__placeholder" aria-hidden="true">
          <span>▶</span>
        </div>
      );
  }
}

/**
 * Tira de 2-4 videos verticales (9:16) con etiqueta y beneficio opcional.
 * Antes eran 4 copias en las landings y solo 2 aceptaban YouTube/Vimeo;
 * ahora todas pasan por `resolveMedia`.
 *
 * @param {{
 *   videos?: { videoUrl?: string, imgUrl?: string, label: string, benefit?: string }[],
 *   kicker?: string, title?: string, subtitle?: string,
 *   tone?: 'green' | 'wine', className?: string,
 * }} props
 */
export default function ProofVideoStrip({
  videos,
  kicker = "✦ CLIENTES SATISFECHOS",
  title,
  subtitle,
  tone = "green",
  className = "",
}) {
  if (!videos?.length) return null;

  return (
    <section
      className={`lp-vs lp-vs--${tone} anim-el ${className}`.trim()}
      style={{ "--vs-cols": Math.min(videos.length, 3) }}
      aria-label={title ? undefined : kicker}
    >
      <header className="lp-vs__header">
        <p className="lp-vs__kicker">{kicker}</p>
        {title && <h2 className="lp-vs__title">{title}</h2>}
        {subtitle && <p className="lp-vs__sub">{subtitle}</p>}
      </header>
      <ul className="lp-vs__row">
        {videos.map((item, i) => (
          <li key={`${item.label}-${i}`} className="lp-vs__item">
            <div className="lp-vs__media">
              <StripMedia item={item} />
            </div>
            <p className="lp-vs__label">{item.label}</p>
            {item.benefit && <p className="lp-vs__benefit">{item.benefit}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
