/// <reference types="vitest" />

import { configDefaults, defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    test: {
      root: './',
      environment: 'jsdom',
      include: ['**/*.spec.ts'],
      reporters: ['default'],
      globals: true,
      pool: 'threads',
      fakeTimers: {
        toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask'],
      },
      setupFiles: ['./test/test-setup.ts'],
      coverage: {
        include: ['**/library/**/*.ts'],
        exclude: [
          ...configDefaults.exclude,
          '**/src/demos/examples/**',
          '**/src/environments/**',
          '**/test/**',
          '**/__tests__/**',
          '**/enums/**',
          '**/interfaces/**',
          '**/models/**',
          '**/*.d.ts',
          '**/slickgrid-config.ts',
          '**/global-grid-options.ts',
          '**/*.interface.ts',
          '**/interfaces.ts',
          '**/enums.index.ts',
          '**/index.ts',
          '**/*.spec.ts',
        ],
        provider: 'v8',
        reportsDirectory: 'coverage',
        reportOnFailure: true,
      },
    },
    define: {
      'import.meta.vitest': mode !== 'production',
    },
  };
});
