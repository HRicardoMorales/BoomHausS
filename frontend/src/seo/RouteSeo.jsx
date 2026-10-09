import { useLocation } from "react-router-dom";
import { getRouteSeo } from "./routeSeo.js";

/**
 * Title, canonical y robots por ruta usando el soporte nativo de React 19
 * para metadata: <title>, <link> y <meta> se elevan solos al <head>,
 * sin react-helmet ni efectos manuales.
 */
export default function RouteSeo() {
  const { pathname } = useLocation();
  const { title, canonical, noindex } = getRouteSeo(pathname, window.location.origin);

  return (
    <>
      {title && <title>{title}</title>}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </>
  );
}
