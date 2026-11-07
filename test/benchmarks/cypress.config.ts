import { defineConfig } from 'cypress';

export default defineConfig({
  defaultBrowser: 'chrome',
  video: false,
  numTestsKeptInMemory: 0,
  e2e: {
    // Cypress serves this static benchmark page itself; no demo/watch server required.
    specPattern: 'test/benchmarks/excel-export.cy.ts',
    supportFile: false,
    testIsolation: false,
  },
});
