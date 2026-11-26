# Testing Patterns

The Svelte demo has one Cypress end-to-end spec per example. Specs use Chrome and share page state (`testIsolation` is disabled), so keep each spec's commands in order and avoid assumptions that the page was reset between tests.

## Run the demo

For interactive development, start the workspace demo and package watchers:

```sh
pnpm dev:svelte
```

For a production-like local run, build the wrapper, plugin, and demo, then preview the built site:

```sh
pnpm svelte:build
pnpm svelte:serve
```

## Run Cypress in Chrome

From the demo directory, run the suite or a single spec with Chrome:

```sh
cd demos/svelte
pnpm exec cypress run --config-file test/cypress.config.ts --browser chrome

# Run one example while iterating
pnpm exec cypress run --config-file test/cypress.config.ts --spec test/cypress/e2e/example26.cy.ts --browser chrome
```

Start the demo server on port `5100` before running Cypress. The Svelte Cypress config uses `http://localhost:5100/#` as its base URL. CI builds the demo, starts its preview server, and runs the specs in Chrome.
