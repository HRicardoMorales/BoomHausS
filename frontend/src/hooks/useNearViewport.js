// frontend/src/hooks/useNearViewport.js
//
// true (una sola vez) cuando el elemento está a `margin` px de entrar en
// pantalla. Sirve para precargar recursos de una sección justo antes de que
// el usuario llegue, en vez de al montar la página.
//
// Ojo: con `html, body { overflow-x: hidden }` el <body> pasa a ser el
// contenedor de scroll. Con el root implícito (viewport) el `rootMargin` no
// se aplica a ese recorte y el aviso llegaría tarde, así que usamos como root
// el ancestro con scroll más cercano.

import { useEffect, useState } from 'react';

function scrollParent(el) {
  for (let node = el?.parentElement; node && node !== document.documentElement; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return null; // viewport
}

export default function useNearViewport(ref, { margin = 600 } = {}) {
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
      { root: scrollParent(el), rootMargin: `${margin}px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, margin, near]);

  return near;
}
