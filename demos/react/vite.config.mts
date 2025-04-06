import react from '@vitejs/plugin-react';
import dns from 'node:dns';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

dns.setDefaultResultOrder('verbatim');

export default defineConfig(() => {
  return {
    base: './',
    build: {
      chunkSizeWarningLimit: 3000,
      emptyOutDir: true,
      outDir: './website',
    },
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
        },
      },
    },
    plugins: [react({ jsxRuntime: 'automatic' }), tsconfigPaths()],
    preview: {
      port: 8000,
    },
    server: {
      port: 8000,
      cors: true,
      host: 'localhost',
      hmr: {
        clientPort: 8000,
      },
      watch: {
        followSymlinks: false,
      },
    },
  };
});
