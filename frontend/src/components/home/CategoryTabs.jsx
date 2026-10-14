import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { ALL_CATEGORIES, categoryLabel } from "./catalogCategories.js";
import { PILL_SPRING } from "../motion/motionPresets.js";

const MotionSpan = m.span;
const MotionButton = m.button;

/*
 * Pestañas de categoría con una "píldora" que se desliza hasta la activa.
 * `layoutId` lo resolvería solo, pero exige `domMax` (+~25 KB gz de layout
 * animations). Acá la píldora es un único `m.span` absoluto y se le animan
 * x/y/width/height medidos con refs → alcanza con `domAnimation`, que ya está
 * cargado. `y`/`height` porque en mobile las pestañas hacen wrap a 2 filas.
 * Teclado: patrón ARIA de tabs (flechas/Home/End con roving tabindex).
 */
export default function CategoryTabs({ categories, active, onChange }) {
  const tabs = [ALL_CATEGORIES, ...categories];
  const listRef = useRef(null);
  const tabRefs = useRef(new Map());
  const [rect, setRect] = useState(null);
  const reduce = useReducedMotion();

  const measure = useCallback(() => {
    const el = tabRefs.current.get(active);
    if (!el) return;
    const next = { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
    setRect((prev) =>
      prev && prev.x === next.x && prev.y === next.y && prev.width === next.width && prev.height === next.height
        ? prev
        : next
    );
  }, [active]);

  // Se mide antes del paint (sin parpadeo) y de nuevo si cambia el ancho del
  // contenedor (rotación, wrap distinto) o terminan de cargar las fuentes.
  useLayoutEffect(() => {
    measure();
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);

  const onKeyDown = (e) => {
    const i = tabs.indexOf(active);
    const last = tabs.length - 1;
    const target =
      e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : -1;
    if (target < 0) return;
    e.preventDefault();
    onChange(tabs[target]);
    tabRefs.current.get(tabs[target])?.focus();
  };

  return (
    <div
      className={`hc-tabs ${rect ? "has-pill" : ""}`}
      role="tablist"
      aria-label="Categorías"
      ref={listRef}
      onKeyDown={onKeyDown}
    >
      {rect && (
        <MotionSpan
          className="hc-tab-pill"
          aria-hidden="true"
          initial={false}
          animate={rect}
          transition={reduce ? { duration: 0 } : PILL_SPRING}
        />
      )}
      {tabs.map((c) => {
        const on = active === c;
        return (
          <MotionButton
            key={c}
            ref={(el) => {
              if (el) tabRefs.current.set(c, el);
              else tabRefs.current.delete(c);
            }}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            className={`hc-tab ${on ? "is-on" : ""}`}
            onClick={() => onChange(c)}
            whileTap={{ scale: 0.94 }}
          >
            {c === ALL_CATEGORIES ? "Todos" : categoryLabel(c)}
          </MotionButton>
        );
      })}
    </div>
  );
}
