import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import seoPlugin from "./build/seo-plugin.js";

// ✅ En local: /api y /uploads van a tu backend local
export default defineConfig({
  plugins: [react(), seoPlugin()],
  build: {
    rollupOptions: {
      output: {
        // Vendor estable en su propio chunk: cambia poco entre deploys, así
        // que queda cacheado aunque cambie el código de la app.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) {
            return "vendor-react";
          }
          if (id.includes("@mercadopago")) return "vendor-mercadopago";
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
