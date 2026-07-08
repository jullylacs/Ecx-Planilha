import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Necessário para aceitar o hostname de túneis temporários (ex: loca.lt, trycloudflare.com)
    allowedHosts: true,
    // Encaminha /api para o backend — assim o frontend funciona igual
    // seja acessado por localhost ou pelo IP da máquina na rede.
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
