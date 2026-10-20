# Frontend

React 19 + Vite. La documentación del proyecto (arquitectura, decisiones técnicas, capturas y cómo correrlo) está en el [README principal](../README.md).

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` (incluye `robots.txt`, `sitemap.xml` y preload de fuentes) |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | ESLint (react, hooks, jsx-a11y) — se mantiene en 0 avisos |
| `npm test` / `npm run test:watch` | Vitest + Testing Library (carrito, precios, pedidos, envío) |
| `npm run a11y` | axe sobre el build con la API mockeada; falla ante problemas serious/critical. Acepta rutas: `npm run a11y -- / /cart` |
| `npm run screenshots` | Capturas mobile/desktop para el README (`docs/screenshots/`) |

`a11y` y `screenshots` usan Chromium vía Playwright; si no encuentra el navegador, definí `CHROMIUM_PATH`.
