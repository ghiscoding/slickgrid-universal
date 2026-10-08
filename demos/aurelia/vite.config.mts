import aurelia from '@aurelia/vite-plugin';
import { defineConfig, type PluginOption } from 'vite';

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
      useDev: true,
    }) as PluginOption,
    {
      name: 'aurelia-demo-full-reload',
      handleHotUpdate({ server, modules, timestamp }) {
        const invalidatedModules = new Set();
        for (const module of modules) {
          server.moduleGraph.invalidateModule(module, invalidatedModules, timestamp, true);
        }
        server.ws.send({ type: 'full-reload' });
        return [];
      },
    },
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
      // Keep Vite's update channel enabled, but promote module updates to full reloads above.
    },
  },
  build: {
    emptyOutDir: true,
    chunkSizeWarningLimit: 5000,
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
