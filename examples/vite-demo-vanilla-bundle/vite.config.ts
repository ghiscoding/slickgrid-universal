import dns from 'dns';
import { defineConfig } from 'vite';

dns.setDefaultResultOrder('verbatim');

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 6000,
  },
  optimizeDeps: {
    include: ['jquery'],
  },
  preview: {
    port: 8888
  },
  server: {
    port: 8888,
    cors: true,
    host: 'localhost',
  },
});