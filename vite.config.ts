import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Rutas relativas: necesario para que los assets carguen dentro de Tauri
  // (protocolo tauri://) y también al servir el /dist como archivos.
  base: "./",
  // Evita que Vite oculte errores útiles de Rust/Tauri en consola.
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    // En web se abre el navegador; bajo Tauri, Tauri abre su propia ventana.
    open: !process.env.TAURI_ENV_PLATFORM,
  },
  // Tauri usa una build más conservadora para compatibilidad del webview.
  build: {
    target: ["es2021", "chrome100", "safari15"],
    sourcemap: false,
  },
});
