import { useEffect, useState } from "react";

/**
 * Devuelve `true` cuando el CTA principal (`selector`) quedó por encima del
 * viewport, es decir, cuando el usuario ya scrolleó más allá de él.
 * Se usa para mostrar la barra de compra fija y subir el botón de WhatsApp.
 *
 * Reemplaza los IntersectionObserver copiados en cada landing que tocaban el
 * DOM a mano (`classList.toggle`) por estado de React.
 */
export function useStickyCta(selector, enabled = true) {
  const [pastCta, setPastCta] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    const cta = document.querySelector(selector);
    if (!cta) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPastCta(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    observer.observe(cta);
    return () => observer.disconnect();
  }, [selector, enabled]);

  return enabled && pastCta;
}
