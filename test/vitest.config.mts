import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // clearMocks: true,
    coverage: {
      include: ['packages/**/*.ts'],
      exclude: [
        ...configDefaults.exclude,
        '**/frameworks/**',
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
    environment: 'happy-dom',
    fakeTimers: {
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask'],
    },
    pool: 'threads',
    globalSetup: './test/vitest-global-setup.ts',
    setupFiles: ['./test/vitest-pretest.ts', './test/vitest-global-mocks.ts'],
    testTimeout: 60000,
  },
});
