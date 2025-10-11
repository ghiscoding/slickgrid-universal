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
    exclude: [...configDefaults.exclude, 'frameworks/*'],
    environment: 'jsdom',
    onUnhandledError: (error) => {
      // Ignore specific error patterns
      // not really sure why JSDOM throws these errors but it doesn't impact the tests
      // see https://github.com/jsdom/jsdom/issues/2156
      const ignoredErrors = [/removeEventListener/, /invalid EventTarget/];

      return !ignoredErrors.some((pattern) => pattern.test(error.message));
    },
    fakeTimers: {
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask'],
    },
    globalSetup: './test/vitest-global-setup.ts',
    setupFiles: ['./test/vitest-pretest.ts', './test/vitest-global-mocks.ts'],
    testTimeout: 60000,
  },
});
