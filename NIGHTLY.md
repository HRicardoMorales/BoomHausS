# Nightly — plan de trabajo autónomo

Proyecto de portafolio: ecommerce full stack (React/Vite + Node/Express + MongoDB).
Objetivo: que un desarrollador full stack senior entre al sitio y al repo y quede sorprendido.
Referencia visual de la home: https://www.luxcove.co/ (tomar la **estructura**, no copiar diseño ni textos).

## Reglas fijas (no negociables)

1. Trabajar **solo** en la rama `nightly/portfolio`. Nunca commitear, mergear ni pushear a `main` ni a otras ramas.
2. **No tocar**: variables de entorno, claves, `backend/src/services/metaCapi.js`, `mercadopagoWebhook.controller.js`, la verificación HMAC, la validación de precios del servidor, ni el flujo de pago de MercadoPago (solo estilos visuales del checkout, sin cambiar lógica).
3. Antes de cada commit: `cd frontend && npm ci && npm run build` (y `npm run lint` si existe). Si el build falla, arreglar o revertir. Nunca dejar la rama rota.
4. Backend: verificar con `node --check` los archivos tocados. No hay acceso a MongoDB: usar datos de ejemplo/mocks.
5. No probar compras ni checkouts en previews de Vercel (apuntan al backend de producción).
6. Commits chicos y descriptivos, en español, con formato `tipo(área): descripción`.
7. Cada sesión dura ~1 hora: tomar **una** tarea del backlog que entre en ese tiempo (partirla si es grande), terminarla, commitear, pushear y actualizar este archivo.
8. Nunca escribir secretos en el código ni en este archivo.

## Backlog (en orden de prioridad)

- [x] Seguridad/limpieza: sacar `.claude/` y `frontend/.env` del repo, borrar instaladores (.exe/.jar) de `src/images`, ignorar `.claude/`
- [x] **Auditoría completa** (2026-10-09): ver hallazgos abajo.

### Fase 1 — Higiene y bugs reales (rápido, alto impacto en la revisión de código)
- [x] Limpieza de assets (2026-10-09): borrado `src/images/` (13 MB), `logo navbar.png` duplicado y `favicon.svg` (1,2 MB). Logos a WebP 3x (navbar 795 KB → 4,5 KB, footer 2,1 MB → 4,2 KB) con PNG optimizado de fallback y `width/height`. Pendiente visual: el logo del footer tiene mucho padding transparente (contenido ~10 px de alto a 36 px); recortarlo en la tarea de design system.
- [x] Bugs de hooks (2026-10-09): los 22 errores `rules-of-hooks` estaban en `StatsCircles` (ProductDetail + 4 landings, copia/pega) y `SocialCommentsSection` de ProductDetail; hooks movidos antes del return. `CheckoutSheet`, `MundialLanding` y `Admin*` no tenían errores de este tipo (la auditoría los incluyó por error). Lint 94 → 72. Nota: `StatsCircles` está duplicado 5 veces → extraer a `components/` en la tarea de landings.
- [x] Lint parte 1 (2026-10-09): catch vacíos → `catch { /* … */ }`, variables/estado/handlers sin uso y código muerto eliminados (ProductDetail `handleAddToCart`/`scrollToReviews`, carrusel de testimonios muerto en DepiladoraIPL, etc.), directivas eslint huérfanas. Lint 72 → 22. Nota: en `ProductDetail` `qty`/`bundle` quedaron fijos (no hay setter usado) → revisar en el refactor.
- [x] Lint parte 2 (2026-10-09): **lint en 0**. `set-state-in-effect` resueltos con estado derivado (SafeImg guarda el src fallido; bundle seleccionado por id en las 4 landings; `loading` derivado en AdminHome) y ajuste de estado durante el render al cambiar ruta/campaña (navbar, AdminRoute, LuxCoveLED). Bug real corregido: en LuxCoveLED `BUNDLES` no dependía del regalo de `?regalo=` (nombre/imagen viejos en el carrito). `useCart` → `hooks/useCart.js` + `context/cart.context.js`. `exhaustive-deps` intencionales documentados con motivo (CheckoutSheet: solo comentario). Smoke test con Chromium en 7 rutas sin errores de runtime.
- [x] SEO/meta (2026-10-09): `index.html` sin URLs de previews; `public/og-image.jpg` 1200x630 (35 KB) generada con Chromium; `build/seo-plugin.js` resuelve la URL absoluta en build desde `VERCEL_PROJECT_PRODUCTION_URL` (o `SITE_URL` opcional) y genera `robots.txt` + `sitemap.xml`; `src/seo/RouteSeo.jsx` pone title/canonical/noindex por ruta con la metadata nativa de React 19. Manifest con marca. Pendiente: títulos por producto en `ProductDetail` (cuando se refactorice) y `og:image` por landing (los crawlers de FB no corren JS → requeriría prerender).
- [x] Logs (2026-10-10): `backend/src/utils/logger.js` sin dependencias (niveles, JSON por línea en prod, `child(scope)`, `maskEmail`, `LOG_LEVEL` opcional) + `middlewares/requestLogger.js` (X-Request-Id, ruta sin query, status, ms). Todos los `console.*` del backend migrados salvo `metaCapi.js`, webhook de MP y scripts de seed (CLI). Ya no se loguean links de pago ni emails completos; ruido de `createOrder` a debug. Frontend: `utils/logger.js`, logs de `api.js`/`metaPixelInit` solo en dev. Smoke test sin Mongo en dev y prod OK.

### Fase 2 — Performance (el bundle es lo primero que mira un senior)
- [x] Code splitting (2026-10-10): `React.lazy` + `Suspense` en todas las rutas salvo home, `utils/lazyWithRetry.js` (recarga una vez ante chunk viejo post-deploy, `preload()`; ProductDetail se precarga en idle), `RouteFallback` con skeleton, `vendor-react` separado. **JS inicial 1.462 KB/391 KB gzip → 483 KB/155 KB gzip; CSS inicial 130 → 39 KB.** Bug evitado: los CSS de landings hacen `@import` de Google Fonts y si falla (adblock/red) Vite rechazaba el chunk → landing en blanco; se maneja `vite:preloadError`. Reveal on scroll ahora usa MutationObserver (las rutas lazy montan después del effect). Nota: `.lp-footer` de LuxCoveLED.css ya no "filtra" a las otras landings (cada una tiene su copia inline; sin cambio visual). MercadoPago SDK no aparece en el bundle (`CardPaymentBrick` no se importa en ningún lado → código muerto a revisar).
- [x] CSS parte 1 (2026-10-10): `ErrorBoundary` de rutas (reset al navegar, mensaje distinto para chunk viejo vs. error de render). **Bug real corregido:** el handler de `vite:preloadError` cancelaba también los fallos del JS → el `import()` resolvía `undefined`, React rompía con "reading 'default'" y nunca se reintentaba; ahora solo se cancela para CSS y `lazyWithRetry` trata módulo sin default como error de chunk (verificado bloqueando un chunk con Playwright: recarga 1 vez → boundary). `components/landing/LandingFooter` (variantes `night`/`wine`) reemplaza 5 copias del footer (4 `<style>` inline + LuxCoveLED.css, que filtraba entre landings); footer viejo sin uso borrado de LuxCoveLED.css. −337 líneas.
- [x] CSS parte 2a (2026-10-10): `components/landing/StatsCircles` (+ `.css`) reemplaza 5 copias (ProductDetail + 4 landings) de la función y de ~30 reglas CSS inline cada una (−420 líneas netas). Paleta por custom properties (`tone="green"|"wine"`, banda oscura, `sc-section--navy-hole` para ProductDetail). Contador con easing y duración fija, `cancelAnimationFrame` al desmontar (antes quedaba un setState colgado), `prefers-reduced-motion` vía `useReducedMotion` de Framer, resumen como `<dl>` y % final para lectores de pantalla. Verificado con Playwright mobile en las 4 landings (con y sin reduced motion); ProductDetail no se pudo ver sin backend.
- [ ] CSS parte 2b: siguientes bloques compartidos entre las 4 landings de `pages/`: `.wa-tab` (comentarios estilo WhatsApp), sticky bar de compra y las `@keyframes _spfBar/_emsBar/_lamBar` (iguales con otro nombre) → `components/landing/*`. Quedan ~23 `<style>` inline en JSX. Los `@import` de Google Fonts dentro de los CSS de landings → tarea de fuentes.
- [ ] Imágenes: 146 `<img>`, solo 49 con `loading="lazy"`; sin `width/height` (CLS). Componente `<Img>` (extender `SafeImg.jsx`) con lazy, `decoding="async"`, dimensiones y `srcset` de Cloudinary (`f_auto,q_auto,w_*`).
- [ ] Fuentes: Google Fonts por `<link>` bloqueante (Cormorant + Inter, 8 pesos). Reducir pesos, `preload` del woff2 crítico o self-host con `@fontsource`.

### Fase 3 — Design system + Home premium
- [ ] Design system: `index.css` tiene solo ~20 variables. Crear `src/styles/tokens.css` (color, tipografía fluida con `clamp`, espaciado, radios, sombras, z-index, easing) y reemplazar valores hardcodeados en navbar/footer/home. Paleta actual: rosa `#C8928B` (marca "Amelor").
- [ ] Home parte 1 (`pages/home.jsx`, 1.011 líneas): partir en `components/home/*` (Hero, ProductCard, ProductCarousel, Countdown) sin cambiar visual.
- [ ] Home parte 2: hero con promesa concreta + franja "visto en" + bestsellers (Embla ya instalado).
- [ ] Home parte 3: testimonios (`components/Testimonials.jsx` existe, reutilizar) + grilla con video + beneficios.
- [ ] Home parte 4: antes/después con estadísticas animadas + garantía + newsletter (solo UI, sin backend nuevo o con endpoint mock).
- [ ] Micro-interacciones con Framer Motion: reveal on scroll, hover en cards, drawer del carrito (`CheckoutDrawer.jsx`), con `useReducedMotion`.

### Fase 4 — Arquitectura del frontend
- [ ] Refactor `ProductDetail.jsx` (5.280 líneas) parte 1: extraer galería, bloque de precio/variantes, reviews, FAQ a `components/product/*`.
- [ ] Refactor `ProductDetail.jsx` parte 2: hooks `useProduct`, `useVariants`; eliminar código muerto.
- [ ] Landings duplicadas: `SillonPuffLanding.jsx` y `KitBelleza6en1Landing.jsx` tienen **exactamente 1.223 líneas** cada una (copia/pega); `MasajeadorEms*` y `MasajeadorFacial*` ~1.400. Ya existe `src/landings/*.js` con config por producto + `TEMPLATE.js`: unificar en un `<LandingTemplate config={...}/>`.
- [ ] `MundialLanding.jsx` (3.719 líneas): partir en secciones.
- [ ] `CheckoutSheet.jsx` (2.411) y `checkout.jsx` (1.296): solo extraer componentes de presentación; **no tocar lógica de pago**.
- [ ] `App.jsx`: las listas de rutas que ocultan navbar/footer/WhatsApp son `||` encadenados → config declarativa por ruta (`routes.config.js`) o layouts anidados de React Router.

### Fase 5 — Accesibilidad y estados
- [ ] Accesibilidad: 18 `onClick` en `<div>/<span>/<img>` (sin teclado/rol), 12 `outline: none` sin reemplazo de foco, ~50 `<img>` sin `alt`. Agregar `:focus-visible` global, botones reales, `alt`, skip-link. Contraste del rosa sobre blanco a verificar (AA).
- [ ] Estados de UI: skeletons consistentes (home ya tiene `SkeletonCard`), vacíos y errores en products/cart/myOrders; error boundary global.

### Fase 6 — Backend y calidad
- [ ] Backend: `app.js` define 5 rutas de abandoned-cart inline → mover a `routes/abandonedCarts.routes.js` + controller. Validación de inputs con zod en auth/orders (sin tocar validación de precios).
- [ ] Tests: Vitest + Testing Library (CartContext, cálculo de totales, `discountPct`); backend con `node:test` + supertest para health/products (mock de Mongo).
- [ ] CI: GitHub Action en la rama con lint + build + tests.
- [ ] README de portafolio (raíz; hoy no existe y `frontend/README.md` es el default de Vite): capturas, diagrama de arquitectura, stack, decisiones técnicas, cómo correrlo.

## Pendientes para Rick (requieren decisión o acceso)

- Rotar las credenciales que estuvieron expuestas en `.claude/settings.json` (siguen en el historial de Git; el repo es público).
- Antes de mergear esta rama: confirmar que todas las `VITE_*` estén cargadas en Vercel, porque `frontend/.env` ya no se sube al repo.
- Decidir si se limpia el historial de Git (reescribe `main`).
- **Privacidad:** `backend/uploads/` (3 MB) está commiteado con comprobantes de pago (`proof_*.png`) que pueden tener datos de clientes, y el repo es público. Recomendado: sacarlos del repo, agregar `backend/uploads/` al `.gitignore` y servirlos desde Cloudinary (ya está como dependencia). No lo hice porque `app.js` los sirve en `/uploads` y puede afectar producción.
- **Imágenes de terceros:** `DepiladoraIPL` y `LuxCoveLED` (y 1 archivo más) usan imágenes hotlinkeadas de `luxcove.co` y `lummia.com.co` (avatares, producto). Para un portafolio público conviene reemplazarlas por assets propios (riesgo de marca y de que se caigan).
- Dominio: el build toma `VERCEL_PROJECT_PRODUCTION_URL` (la pone Vercel sola). Si el dominio real es otro, definir `SITE_URL` en Vercel (opcional, no es secreto). Verificar en la preview que `og:image` sea absoluta con el debugger de Facebook.

## Skills recomendadas

- Remote nuevo: GitHub avisa que el repo se movió a `https://github.com/HRicardoMorales/BoomHausS.git` (el push funciona igual por redirect); conviene actualizar el `origin` en el setup.

- `design:accessibility-review` — para la tarea de Fase 5 (auditoría WCAG AA con checklist de contraste/teclado).
- `marketing:seo-audit` — para la tarea de meta/SEO de Fase 1.
- `rollup-plugin-visualizer` (devDependency) para un `stats.html` del bundle: ayudaría a ver qué pesa en el chunk `index` (257 KB) en la próxima sesión de performance.
- Playwright: en la sesión se instala en el scratchpad (`npm i playwright@1.56`) con `executablePath: '/opt/pw-browsers/chromium'`; `page.route(...).abort()` sirve para simular chunks caídos. Ojo: no usar `pkill -f "vite preview"` en el mismo comando (mata el propio shell); lanzar el preview con `setsid` y matarlo por PID.
- `frontend-design` no hizo falta para refactors sin cambio visual; sí cargarla en Fase 3.
- Lighthouse CLI (`npx lighthouse` con el Chromium preinstalado vía Playwright) para medir antes/después de la Fase 2.

## Registro de sesiones

| Fecha | Hora | Hecho | Commit |
|---|---|---|---|
| 2026-10-08 | setup | Rama creada, limpieza de seguridad, este archivo | — |
| 2026-10-09 | 03:53 | Auditoría completa (build, bundle 1,46 MB sin splitting, 94 problemas de lint con 22 bugs de hooks, 13 MB de imágenes sin usar, SEO roto, uploads con comprobantes). Backlog reescrito en 6 fases. | 107dd3f |
| 2026-10-09 | 04:52 | Limpieza de assets: −15 MB en el repo, logos WebP optimizados, favicon.svg pesado eliminado. Build OK, lint sin cambios (94 previos). | 6e13afb |
| 2026-10-09 | 05:52 | Fix de 22 errores rules-of-hooks (StatsCircles x5, SocialCommentsSection). Build OK, lint 94 → 72. | 57bdf36 |
| 2026-10-09 | 06:53 | Lint parte 1: catch vacíos, vars sin uso y código muerto (−59 líneas netas). Build OK, lint 72 → 22. | 139a0a0 |
| 2026-10-09 | 07:52 | Lint parte 2: 22 → 0 problemas, estado derivado en vez de setState en effects, fix de deps de BUNDLES en LuxCoveLED, `useCart` a `hooks/`. Build OK. | 6313f64 |
| 2026-10-09 | 08:53 | SEO: OG image real, URL absoluta resuelta en build (plugin de Vite), robots/sitemap generados, title/canonical/noindex por ruta con React 19. Build y lint OK, verificado con Chromium en 7 rutas. | 1868fbf |
| 2026-10-09 | 09:53 | Revisión final: build OK, lint 0, smoke test Chromium mobile en 5 rutas sin errores. PR borrador #1 `nightly/portfolio` → `main` abierto (no mergear). | PR #1 |
| 2026-10-10 | 03:52 | Logger con niveles (JSON en prod) + access log con request id; console.* del backend migrados sin PII ni links de pago; logs del front solo en dev. Build y lint OK, `node --check` y smoke test HTTP. | e338d1a |
| 2026-10-10 | 04:52 | Code splitting por ruta + vendor-react + lazyWithRetry + fallback skeleton; manejo de `vite:preloadError`. JS inicial 391 → 155 KB gzip. Build y lint OK, smoke test Chromium mobile en 10 rutas + navegación SPA. | 9035dc7 |
| 2026-10-10 | 05:52 | CSS parte 1: ErrorBoundary de rutas, fix de `vite:preloadError` que convertía chunks fallidos en pantalla rota, `LandingFooter` compartido (5 copias → 1). Build y lint OK, Playwright mobile en 5 landings + chunk bloqueado. | ae58808 |
| 2026-10-10 | 06:52 | CSS parte 2a: `StatsCircles` compartido (5 copias → 1) con tonos por custom properties, reduced motion, cleanup de rAF y `<dl>` accesible. Build y lint OK, Playwright mobile en 4 landings. | c1e3e7d |
