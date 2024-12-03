import dns from 'node:dns';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

dns.setDefaultResultOrder('verbatim');

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 3000,
    emptyOutDir: true,
    outDir: './dist',
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
  plugins: [vue()],
  preview: {
    port: 7000,
  },
  server: {
    port: 7000,
    cors: true,
    host: 'localhost',
    hmr: {
      clientPort: 7000,
    },
  },
});
