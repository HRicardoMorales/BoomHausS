// Monta una sección bajo el pliegue recién cuando el usuario se acerca.
//
// El chunk se pide en dos momentos, lo que llegue primero:
//  1. cuando el navegador queda ocioso después del primer render (`whenIdle`),
//     para que al scrollear ya esté descargado;
//  2. cuando el placeholder entra a `margin` px del viewport (`useNearViewport`).
// Hasta entonces se reserva `minHeight` para que la barra de scroll no salte.
// Con `lazyWithRetry` un chunk viejo tras un deploy recarga la página una vez.
import { Suspense, useEffect, useRef } from "react";
import useNearViewport from "../../hooks/useNearViewport.js";
import { whenIdle } from "../../utils/lazyWithRetry.js";

function Placeholder({ minHeight, innerRef }) {
  return <div ref={innerRef} className="hc-lazy-slot" style={{ minHeight }} aria-hidden="true" />;
}

export default function LazySection({ component: Component, minHeight = 480, margin = 900, ...props }) {
  const ref = useRef(null);
  const near = useNearViewport(ref, { margin });

  useEffect(() => whenIdle(() => {
    Component.preload?.().catch(() => { /* se reintenta al montar */ });
  }), [Component]);

  if (!near) return <Placeholder innerRef={ref} minHeight={minHeight} />;
  return (
    <Suspense fallback={<Placeholder minHeight={minHeight} />}>
      <Component {...props} />
    </Suspense>
  );
}
