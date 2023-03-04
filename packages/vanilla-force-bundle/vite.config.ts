import path from 'node:path';
// import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// const filename = fileURLToPath(import.meta.url);
// const dirname = path.dirname(filename);

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
      // external: ['jquery'],
      output: {
        minifyInternalExports: false,
        // chunkFileNames: 'dist/bundle/[name].js',
        globals: {
          $: 'jquery',
          jQuery: 'jquery',
        },
      },
    },
  },
});