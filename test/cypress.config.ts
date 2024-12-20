import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  projectId: 'p5zxx6',
  viewportWidth: 1200,
  viewportHeight: 950,
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',
  defaultCommandTimeout: 5000,
  pageLoadTimeout: 90000,
  numTestsKeptInMemory: 5,
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
    baseUrl: 'http://localhost:8888/#',
    experimentalRunAllSpecs: true,
    supportFile: 'test/cypress/support/index.ts',
    specPattern: 'test/cypress/e2e/**/*.cy.{js,ts}',
    testIsolation: false,
  },
});
