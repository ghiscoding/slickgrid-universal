import dns from 'node:dns';
import { defineConfig } from 'vite';

dns.setDefaultResultOrder('verbatim');

export default defineConfig(() => {
  return {
    base: './',
    build: {
      chunkSizeWarningLimit: 6000,
      emptyOutDir: true,
      outDir: '../../website',
    },
    preview: {
      port: 8888
    },
    server: {
      port: 8888,
      cors: true,
      host: 'localhost',
      hmr: {
        clientPort: 8888,
      },
      watch: {
        followSymlinks: false,
      }
    },
  };
});