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
  optimizeDeps: {
    // The demo routes are lazy-loaded. Scan every component up front so that
    // route-specific dependencies do not invalidate optimized-dep URLs during
    // navigation and produce a 504 (Outdated Optimize Dep) response.
    include: ['@faker-js/faker', '@fnando/sparkline'],
    entries: ['src/components/**/*.vue'],
  },
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
