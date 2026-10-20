import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Config de tests separada de vite.config.js: los plugins de build (SEO,
// preload de fuentes) no tienen nada que hacer en un test unitario.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    setupFiles: ["src/test/setup.js"],
    restoreMocks: true,
    clearMocks: true,
  },
});
