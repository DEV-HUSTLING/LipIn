import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isContentBuild = process.env.BUILD_TARGET === 'content';
  const isSwBuild = process.env.BUILD_TARGET === 'sw';

  if (isSwBuild) {
    return {
      build: {
        outDir: "public",
        emptyOutDir: false,
        rollupOptions: {
          input: { service_worker: resolve(__dirname, 'src/service_worker.js') },
          output: {
            entryFileNames: 'service_worker.js',
            format: 'es',
            inlineDynamicImports: true
          }
        }
      }
    };
  }

  if (isContentBuild) {
    return {
      plugins: [react()], // Add react plugin for JSX transformation
      build: {
        outDir: "public",
        emptyOutDir: false,
        rollupOptions: {
          input: {
            content: resolve(__dirname, 'src/content/index.js')
          },
          output: {
            entryFileNames: 'content.js',
            format: 'iife',
            inlineDynamicImports: true
          }
        }
      }
    };
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: "public",
      emptyOutDir: false,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'index.html'),
          landingPage: resolve(__dirname, 'landingPage.html')
        }
      }
    }
  };
});