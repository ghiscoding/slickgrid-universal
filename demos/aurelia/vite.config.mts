import { defineConfig, PluginOption } from 'vite';
import aurelia from '@aurelia/vite-plugin';
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
    port: 9000,
  },
  server: {
    port: 9000,
    cors: true,
    host: 'localhost',
    hmr: {
      clientPort: 9000,
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
});
