import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false, // we only use Vite for the "bundle" folder, we need to keep CJS/ESM untouched
    minify: true,
    sourcemap: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Slicker',
      formats: ['umd'],
      fileName: () => 'bundle/slickgrid-vanilla-bundle.js'
    },
    rollupOptions: {
      output: {
        minifyInternalExports: false,
        // chunkFileNames: 'dist/bundle/[name].js',
      },
    },
  },
});