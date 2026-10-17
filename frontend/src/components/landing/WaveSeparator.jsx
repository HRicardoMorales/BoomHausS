import { useId } from "react";
import "./WaveSeparator.css";

/**
 * Separador de olas animadas entre bandas de color de las landings.
 *
 * `from` indica la banda de arriba: "dark" (color de marca) baja a `light`,
 * "light" baja a `dark`. Antes cada landing tenía su copia con el mismo
 * `id` de <path> en las 4 instancias de la página (ids duplicados en el DOM);
 * ahora el id sale de `useId` y el SVG es decorativo para lectores de pantalla.
 */
export default function WaveSeparator({ from = "light", dark = "#1B4D3E", light = "#ffffff" }) {
  const id = `lwave-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const top = from === "dark" ? dark : light;
  const fill = from === "dark" ? light : dark;

  return (
    <div className="lwave" style={{ "--lwave-top": top }} aria-hidden="true">
      <svg
        className="lwave-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <path id={id} d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
        </defs>
        {[0, 3, 5, 7].map((y, i) => (
          <g key={y} className={`lwave-layer lwave-layer--${i + 1}`}>
            <use href={`#${id}`} x="48" y={y} fill={fill} />
          </g>
        ))}
      </svg>
    </div>
  );
}
