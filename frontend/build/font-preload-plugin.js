/**
 * Precarga de la fuente crítica.
 *
 * Las fuentes las descubre el navegador recién al parsear el CSS y encontrar
 * texto que las usa, así que empiezan a bajar tarde. Este plugin agrega un
 * <link rel="preload" as="font"> en el <head> apuntando al woff2 ya
 * hasheado por Vite (el nombre cambia en cada build, por eso no se puede
 * escribir a mano en index.html).
 *
 * Solo Inter latin: la usan todas las rutas (home, catálogo y landings). El
 * resto de las fuentes y subsets bajan a demanda por `unicode-range` y tienen
 * fallback con métricas ajustadas (src/styles/fonts.css), así que no vale la
 * pena competir por ancho de banda con el LCP.
 */

const DEFAULT_PATTERNS = [/\binter-latin-wght-normal-[\w-]+\.woff2$/];

export default function fontPreloadPlugin({ patterns = DEFAULT_PATTERNS } = {}) {
  let base = "/";

  return {
    name: "amelor-font-preload",
    apply: "build",

    configResolved(config) {
      base = config.base;
    },

    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        if (!ctx.bundle) return [];
        const files = Object.keys(ctx.bundle).filter((name) => patterns.some((re) => re.test(name)));

        if (files.length !== patterns.length) {
          // Si alguien renombra o saca la fuente, que el build lo diga en vez
          // de dejar de precargar en silencio.
          this.warn?.(`[font-preload] se esperaban ${patterns.length} fuentes y se encontraron ${files.length}`);
        }

        return files.map((fileName) => ({
          tag: "link",
          attrs: {
            rel: "preload",
            as: "font",
            type: "font/woff2",
            href: `${base}${fileName}`,
            // Obligatorio para fuentes aunque sean del mismo origen: sin esto
            // el navegador descarta la precarga y la baja dos veces.
            crossorigin: "",
          },
          injectTo: "head",
        }));
      },
    },
  };
}
