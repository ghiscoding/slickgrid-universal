import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      rollupTypes: process.env.NODE_ENV !== 'development',
      tsconfigPath: './tsconfig.app.json'
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: format => format === 'cjs' ? 'index.cjs' : 'index.mjs',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        '@formkit/tempo',
        '@slickgrid-universal/common',
        '@slickgrid-universal/custom-footer-component',
        '@slickgrid-universal/empty-warning-component',
        '@slickgrid-universal/event-pub-sub',
        '@slickgrid-universal/pagination-component',
        '@slickgrid-universal/row-detail-view-plugin',
        '@slickgrid-universal/utils',
        'dequal',
        'i18next',
        'i18next-vue',
        'sortablejs',
        'vue',
      ],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  server: {
    open: true,
    cors: true,
  }
});
