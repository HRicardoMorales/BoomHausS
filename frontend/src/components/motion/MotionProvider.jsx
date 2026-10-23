import { LazyMotion, MotionConfig } from "framer-motion";

/* El motor de animación no entra en el bundle inicial: `LazyMotion` lo pide
   en un chunk aparte y mientras tanto los `m.*` se pintan en su estado
   `initial`. `strict` hace fallar en dev si alguien importa `motion.*`
   (que traería todo el motor de nuevo al bundle principal).
   `reducedMotion="user"`: con "reducir movimiento" del sistema, Framer
   saltea transforms y deja solo los fundidos. */
const importFeatures = () => import("./motionFeatures.js").then((mod) => mod.default);

/* Si el chunk no llega (red móvil, deploy nuevo) se reintenta una vez; si
   vuelve a fallar, `data-motion="off"` en <html> fuerza visibles los
   elementos `[data-reveal]` (CSS en index.css) para que nada quede en
   opacity 0 esperando una animación que nunca va a correr. */
const loadFeatures = () =>
  importFeatures()
    .catch(importFeatures)
    .catch(() => {
      document.documentElement.dataset.motion = "off";
      return {};
    });

export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
