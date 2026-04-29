import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Sudoku Platform",
        short_name: "Sudoku",
        theme_color: "#fbfaf4",
        background_color: "#fbfaf4",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin.html")
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": `http://localhost:${process.env.PROXY_PORT ?? 3002}`,
      "/healthz": `http://localhost:${process.env.PROXY_PORT ?? 3002}`
    }
  }
});
