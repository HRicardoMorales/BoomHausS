import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import seoPlugin from "./build/seo-plugin.js";

// ✅ En local: /api y /uploads van a tu backend local
export default defineConfig({
  plugins: [react(), seoPlugin()],
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
