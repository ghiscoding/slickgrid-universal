import { defineConfig } from 'cypress';

export default defineConfig({
  allowCypressEnv: false,
  projectId: 'wmnjof',
  video: false,
  viewportWidth: 1200,
  viewportHeight: 1020,
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',
  defaultCommandTimeout: 5000,
  pageLoadTimeout: 90000,
  // In headless/CI runs, keeping snapshots in memory can accumulate across many specs.
  // Use 0 to keep memory usage lower and reduce flaky runner stalls.
  numTestsKeptInMemory: 0,
  experimentalMemoryManagement: true,
  scrollBehavior: 'nearest',
  retries: {
    experimentalStrategy: 'detect-flake-and-pass-on-threshold',
    experimentalOptions: {
      maxRetries: 2,
      passesRequired: 1,
    },

    // you must also explicitly set openMode and runMode to
    // either true or false when using experimental retries
    openMode: false, // Cypress UI
    runMode: true, // run in CI
  },
  e2e: {
    baseUrl: 'http://localhost:8000/#',
    experimentalRunAllSpecs: true,
    supportFile: 'test/cypress/support/index.ts',
    specPattern: 'test/cypress/e2e/**/*.cy.ts',
    testIsolation: false,
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (['chrome', 'edge'].includes(browser.name)) {
          if (browser.isHeadless) {
            launchOptions.args.push('--no-sandbox');
            launchOptions.args.push('--disable-gl-drawing-for-tests');
            launchOptions.args.push('--disable-gpu');
            launchOptions.args.push('--disable-dev-shm-usage');
          }
        }
        return launchOptions;
      });
    },
  },
});
