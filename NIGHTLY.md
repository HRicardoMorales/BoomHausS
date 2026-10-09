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
- [ ] **Auditoría completa** (primera sesión): visual, mobile, performance (bundle, imágenes), accesibilidad, código (componentes gigantes, duplicación, código muerto). Reescribir este backlog priorizado con lo encontrado.
- [ ] Design system: tokens (colores, tipografía, espaciado, radios, sombras) en CSS variables; tipografía con carácter
- [ ] Home nueva estilo Luxcove: hero con promesa concreta → franja "visto en" → bestsellers (carrusel) → testimonios → grilla con video → beneficios → antes/después + estadísticas → garantía → newsletter → footer
- [ ] Micro-interacciones con Framer Motion (ya instalado): reveal on scroll, hover en cards, drawer del carrito, respetando `prefers-reduced-motion`
- [ ] Refactor de `ProductDetail.jsx` (5.280 líneas) en componentes
- [ ] Refactor de `MundialLanding.jsx` (3.719 líneas) y landings con CSS duplicado
- [ ] Performance: code splitting por ruta (`React.lazy`), imágenes responsive/lazy, Lighthouse ≥ 90 en mobile
- [ ] Accesibilidad WCAG AA: contraste, foco visible, labels, navegación con teclado
- [ ] Estados de UI: skeletons, vacíos, errores
- [ ] Tests: Vitest + Testing Library (carrito, cálculo de totales); tests de API en backend
- [ ] README de portafolio: capturas, arquitectura, stack, decisiones técnicas, cómo correrlo

## Pendientes para Rick (requieren decisión o acceso)

- Rotar las credenciales que estuvieron expuestas en `.claude/settings.json` (siguen en el historial de Git; el repo es público).
- Antes de mergear esta rama: confirmar que todas las `VITE_*` estén cargadas en Vercel, porque `frontend/.env` ya no se sube al repo.
- Decidir si se limpia el historial de Git (reescribe `main`).

## Registro de sesiones

| Fecha | Hora | Hecho | Commit |
|---|---|---|---|
| 2026-10-08 | setup | Rama creada, limpieza de seguridad, este archivo | — |
