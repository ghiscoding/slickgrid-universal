# SlickGrid Universal repository guidance

## Project context

This is a pnpm monorepo for SlickGrid Universal:

- `packages/` contains shared/core packages.
- `frameworks/` contains Angular, React, Vue, and Aurelia wrappers.
- `frameworks-plugins/` contains framework-specific plugins.
- `demos/` contains demo applications; Angular demos are under `frameworks/angular-slickgrid/src/demos`.
- `test/` contains shared test configuration and Cypress support.

Changes in `packages/` can affect every framework. Preserve backward compatibility: prefer additive changes, overloads, and deprecations over breaking API changes.

## Working rules

- Use pnpm 11 and the Node version declared in `package.json`.
- Keep changes focused and follow nearby code patterns.
- Use strict TypeScript and preserve existing public API naming and behavior.
- Prefer `interface` for object shapes when consistent with surrounding code.
- Avoid circular dependencies. Use `madge --circular` when dependency impact needs verification.
- For plugin changes, preserve existing `init()`, `dispose()`, `getOptions()`, and `setOptions()` lifecycle methods where applicable. Use `BindingEventService` for DOM event binding and cleanup.
- When changing shared behavior, check all four framework wrappers and relevant demos.
- Never edit generated `dist/` output unless explicitly requested.

## Testing and quality

- Unit tests use Vitest with `test/vitest.config.mts`.
- E2E tests use Cypress with `test/cypress.config.ts`.
- Cypress tests use `testIsolation: false`; preserve their execution order and inherited state.
- The Vanilla demo is the default Cypress target. Start its Vite watch server first with `pnpm serve:vite` (or use an already-running Vanilla server), then run `pnpm cypress:ci --spec test/cypress/e2e/<example>.cy.ts` for a focused spec.
- Framework demos provide headless Cypress CI scripts. Start the matching demo server first (`pnpm angular:serve`, `pnpm aurelia:serve`, `pnpm react:serve`, or `pnpm vue:serve`).
- Run the corresponding root CI command: `pnpm angular:cypress:ci`, `pnpm aurelia:cypress:ci`, `pnpm react:cypress:ci`, or `pnpm vue:cypress:ci` (for example, `pnpm aurelia:cypress:ci`). These commands use each framework's Cypress config and are preferred for validating framework-specific E2E suites.
- Add or update tests for behavior changes, especially in core packages.
- Run the smallest relevant checks first, then broader checks when practical:

```text
pnpm test
pnpm lint
pnpm prettier:check
pnpm build
```

- Use `pnpm lint:fix` and `pnpm prettier:write` only when autofix or formatting changes are intended.
- Check the applicable `.oxlintrc.json` when working in Angular or framework-plugin code.

## Documentation

- Update `docs/` and applicable framework documentation when public behavior or APIs change.
- Keep examples valid and consistent across Angular, React, Vue, and Aurelia.
- Use repository-relative Markdown links for source references.

## Completion checklist

- Review the diff for unrelated changes and accidental generated files.
- Verify affected tests, lint, and formatting.
- Mention any checks that could not be run and why.
