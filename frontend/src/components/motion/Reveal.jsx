import { m, useReducedMotion } from "framer-motion";
import { REVEAL_VIEWPORT, revealVariants } from "./motionPresets.js";

const TAGS = {
  div: m.div,
  header: m.header,
  section: m.section,
  li: m.li,
  p: m.p,
  a: m.a,
  h2: m.h2,
  article: m.article,
};

/**
 * Reveal on scroll declarativo: reemplaza al `useHomeReveal` que buscaba
 * nodos con `querySelectorAll` y les cambiaba clases a mano.
 * Con "reducir movimiento" se monta directamente visible (`initial={false}`).
 */
export default function Reveal({ as = "div", index = 0, children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = TAGS[as] ?? m.div;
  return (
    <Tag
      initial={reduce ? false : "hidden"}
      whileInView="shown"
      viewport={REVEAL_VIEWPORT}
      variants={revealVariants}
      custom={index}
      data-reveal=""
      {...rest}
    >
      {children}
    </Tag>
  );
}
