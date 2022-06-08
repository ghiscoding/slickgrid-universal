import { defineConfig } from 'cypress';

export default defineConfig({
  baseExampleUrl: 'http://localhost:8888/#',
  video: false,
  projectId: 'p5zxx6',
  viewportWidth: 1000,
  viewportHeight: 950,
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',
  defaultCommandTimeout: 5000,
  pageLoadTimeout: 90000,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config);
    },
    baseUrl: 'http://localhost:8888',
    specPattern: 'test/cypress/integration/**/*.{js,jsx,ts,tsx}',
    supportFile: 'test/cypress/support/index.js',
  },
});
