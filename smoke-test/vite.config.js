import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from GitHub Pages at https://matyasmayer.github.io/Chronos/
export default defineConfig({
  base: "/Chronos/",
  plugins: [react()],
});
