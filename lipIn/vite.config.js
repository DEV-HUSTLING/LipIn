import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(),tailwindcss()],
  build: {
    outDir: "public",
    rollupOptions: {
      input: {
        content:'src/content/index.js',
      },
      output:{
        entryFileNames: 'content.js'
      }
    },
    emptyOutDir:false
  }
});
