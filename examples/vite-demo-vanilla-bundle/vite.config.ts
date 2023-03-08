import dns from 'dns';
import { defineConfig } from 'vite';

dns.setDefaultResultOrder('verbatim');

export default defineConfig(({ mode }) => {
  console.log('Vite mode: ', mode);

  return {
    base: mode === 'production' ? '/slickgrid-universal/' : './',
    build: {
      chunkSizeWarningLimit: 6000,
      emptyOutDir: true,
      // outDir: mode === 'production' ? '../../docs' : 'dist',
      outDir: '../../docs',
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
  };
});