import aurelia from '@aurelia/vite-plugin';
import { defineConfig, type PluginOption } from 'vite';

// import { resolve } from 'path';

export default defineConfig({
  base: './',
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
  esbuild: {
    target: 'es2020',
  },
  plugins: [
    aurelia({
      // useDev: true,
    }) as PluginOption,
  ],
  preview: {
    port: 7900,
  },
  server: {
    port: 7900,
    cors: true,
    host: 'localhost',
    hmr: {
      clientPort: 7900,
    },
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }

          return 'index';
        },
      },
    },
  },
  optimizeDeps: {
    include: ['jspdf'],
  },
  resolve: {
    alias: {
      jspdf: 'jspdf/dist/jspdf.es.min.js',
    },
  },
});
