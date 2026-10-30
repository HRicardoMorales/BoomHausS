// frontend/src/hooks/useNearViewport.js
//
// true (una sola vez) cuando el elemento está a `margin` px de entrar en
// pantalla. Sirve para precargar recursos de una sección justo antes de que
// el usuario llegue, en vez de al montar la página.
//
// Root: el viewport. Desde que el recorte horizontal vive en `#root` con
// `overflow-x: clip` (que no crea contenedor de scroll), el documento es
// siempre el que scrollea, así que no hace falta buscar el ancestro con
// scroll. Antes se recorría el árbol con `getComputedStyle` (+ `scrollHeight`)
// al montar cada sección: recálculo de estilos forzado en pleno arranque de la
// home para terminar devolviendo `null` en todos los casos (medido con
// Playwright en `/` y `/lp/escultor-led`).
//
// Si algún día se usa dentro de un panel con scroll propio (un sheet), pasar
// ese nodo en `root`: el `rootMargin` solo se aplica sobre el root.

import { useEffect, useState } from 'react';

export default function useNearViewport(ref, { margin = 600, root = null } = {}) {
  // Sin IntersectionObserver (navegadores muy viejos) se precarga de una.
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (near || !el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { root, rootMargin: `${margin}px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, margin, root, near]);

  return near;
}
