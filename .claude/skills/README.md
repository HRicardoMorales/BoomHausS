# Skills del proyecto

Skills de diseño que pidió Rick (2026-10-22) para las sesiones nocturnas. Se
copiaron tal cual de su origen; revisadas antes de commitear (sin llamadas
raras: los scripts de taste-skill solo abren Chrome por CDP y bajan fotos de
stock cuando se les pide).

| Carpeta | Origen | Para qué |
| --- | --- | --- |
| `design-taste-frontend/` | `npx skills add Leonxlnx/taste-skill` | Dirección de arte anti-"look de IA" para landings, home y pantallas del admin. Trae inspector con navegador real. |
| `web-design-guidelines/` | `npx skills add vercel-labs/agent-skills@web-design-guidelines` | Auditoría de UI contra las Web Interface Guidelines de Vercel (baja las reglas de GitHub al usarse). |
| `design-md/` | `google-labs-code/stitch-skills` → `plugins/stitch-utilities/skills/design-md` | Sintetizar el design system en un `DESIGN.md` (pensado para proyectos de Stitch; sirve como guía). |
| `image-to-code-skill/` | `nexu-io/open-design` → `skills/image-to-code-skill` | Implementar una sección a partir de una imagen de referencia. |
| `playwright-cli/` | `npm install -g @playwright/cli@latest` (skill que trae el paquete) | Manejar el navegador desde la terminal para revisar la preview y sacar capturas. |

`playwright-cli` necesita el binario: en cada sesión correr
`npm install -g @playwright/cli@latest` (Chromium ya está en el sandbox).
Para actualizar una skill, repetir el comando de origen y copiar la carpeta.
