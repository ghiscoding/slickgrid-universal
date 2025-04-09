/// <reference types="vitest" />

import angular from '@analogjs/vite-plugin-angular';
import { configDefaults, defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [angular() as any],
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
      // globalSetup: 'test/vitest-global-setup.ts',
      setupFiles: ['./test/test-setup.ts', './test/vitest-pretest.ts', './test/vitest-global-mocks.ts'],
      coverage: {
        include: ['**/library/**/*.ts'],
        exclude: [
          ...configDefaults.exclude,
          '**/src/app/examples/**',
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
