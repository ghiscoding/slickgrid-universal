import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // clearMocks: true,
    deps: {
      interopDefault: false,
    },
    environment: 'happy-dom',
    testTimeout: 60000,
    fakeTimers: {
      toFake: [...configDefaults.fakeTimers.toFake, 'queueMicrotask']
    },
    pool: 'threads',
    globalSetup: './test/vitest-global-setup.ts',
    setupFiles: ['./test/vitest-pretest.ts', './test/vitest-global-mocks.ts'],
    watch: false,
    coverage: {
      include: ['packages/**/*.ts'],
      exclude: [
        ...configDefaults.exclude,
        '**/__tests__/**',
        '**/enums/**',
        '**/interfaces/**',
        '**/models/**',
        '**/*.d.ts',
        '**/global-grid-options.ts',
        '**/salesforce-global-grid-options.ts',
        '**/*.interface.ts',
        '**/interfaces.ts',
        '**/enums.index.ts',
        '**/index.ts',
        '**/*.spec.ts',
      ],
      provider: 'v8',
      reportsDirectory: 'test/vitest-coverage',
      reportOnFailure: true,
    },
  },
});