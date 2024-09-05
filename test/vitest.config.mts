import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    cache: false,
    // clearMocks: true,
    deps: {
      interopDefault: false,
    },
    environment: 'happy-dom',
    testTimeout: 60000,
    fakeTimers: {
      toFake: [...configDefaults.fakeTimers.toFake, 'queueMicrotask']
    },
    // pool: 'threads',
    globalSetup: './test/vitest-global-setup.ts',
    setupFiles: ['./test/vitest-pretest.ts', './test/vitest-global-mocks.ts'],
    watch: false,
    coverage: {
      include: ['packages/**/*.ts'],
      exclude: [
        ...configDefaults.exclude,
        '**/models/**',
        '**/__fixtures__/**',
        '**/__mocks__/**',
        '**/__tests__/**',
        '**/index.ts',
      ],
      provider: 'v8',
      reportsDirectory: 'test/vitest-coverage'
    },

  },
});