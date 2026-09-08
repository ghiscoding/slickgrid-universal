# SlickGrid Universal repository guidance

## Project context

This is a pnpm monorepo for SlickGrid Universal:

- `packages/` contains shared/core packages.
- `frameworks/` contains Angular, React, Vue, and Aurelia wrappers.
- `frameworks-plugins/` contains framework-specific plugins.
- `demos/` contains demo applications; Angular demos are under `frameworks/angular-slickgrid/src/demos`.
- `test/` contains shared test configuration and Cypress support.

Changes in `packages/` can affect every framework. Preserve backward compatibility: prefer additive changes, overloads, and deprecations over breaking API changes.
The framework has many options; ensure new options do not contradict or interfere with existing ones.

## Working rules

- Use pnpm 11 and the Node version declared in `package.json`.
- Keep changes focused and follow nearby code patterns.
- Use `madge` for JavaScript/TypeScript dependency impact and `madge --circular` for circular dependency checks when available.
- Prefer non-SVG output for machine use; use SVG only for visualization.
- Use strict TypeScript and preserve existing public API naming and behavior.
- Prefer `interface` for object shapes when consistent with surrounding code.
- Use `protected` for class methods that may be extended.
- Follow existing naming conventions, such as `_privateField` and `publicMethod`.
- Avoid circular dependencies. Use `madge --circular` when dependency impact needs verification.
- For plugin changes, preserve existing `init()`, `dispose()`, `getOptions()`, and `setOptions()` lifecycle methods where applicable. Use `BindingEventService` for DOM event binding and cleanup.
- Plugins extend SlickGrid and use `SlickEventHandler` where applicable. Support both grid options and column definition options.
- When changing shared behavior, check all four framework wrappers and relevant demos.
- Never edit generated `dist/` output unless explicitly requested.
- When drafting a pull request, follow `.github/pull_request_template.md`, including its conventional-commit title requirement and applicable sections and checklist items.
- Keep interactions and commit messages concise while preserving clarity.

## Testing and quality

- Unit tests use Vitest with `test/vitest.config.mts`.
- Vitest unit tests use `.spec.ts` files; Cypress E2E tests use `.cy.ts` files under `test/cypress/e2e/`.
- E2E tests use Cypress with `test/cypress.config.ts`.
- Cypress tests use `testIsolation: false`; preserve their execution order and inherited state.
- Cypress tests are serial: new tests inherit the grid/page state left by previous tests, so do not assume a fresh page or selection and do not reorder tests without checking dependencies.
- Tests commonly live in `__tests__/` subdirectories. Native/vanilla tests are under `packages/`; Angular-specific tests are under `frameworks/angular-slickgrid/`.
- For the Vanilla demo suite, start the watch server with `pnpm serve:vite`, then run the root Cypress CI suite with `pnpm cypress:ci`. To run one spec while iterating, pass its path directly (for example, `pnpm cypress:ci --spec test/cypress/e2e/example33.cy.ts`).
- Framework demos provide headless Cypress CI scripts. Start the matching demo server first (`pnpm angular:serve`, `pnpm aurelia:serve`, `pnpm react:serve`, or `pnpm vue:serve`).
- Run the corresponding root CI command: `pnpm angular:cypress:ci`, `pnpm aurelia:cypress:ci`, `pnpm react:cypress:ci`, or `pnpm vue:cypress:ci` (for example, `pnpm aurelia:cypress:ci`). These commands use each framework's Cypress config and are preferred for validating framework-specific E2E suites.
- Add or update tests for behavior changes, especially in core packages.
- Maintain 100% statement, branch, function, and line coverage for changed production code. Scope coverage collection to the changed source files while including all tests needed to exercise them; passing tests alone is not sufficient.
- Run the smallest relevant checks first, then broader checks when practical:

```text
pnpm test
pnpm lint
pnpm prettier:check
pnpm build
```

- Use `pnpm lint:fix` and `pnpm prettier:write` only when autofix or formatting changes are intended.
- Check the applicable `.oxlintrc.json` when working in Angular or framework-plugin code. The repository has three configurations: root `.oxlintrc.json`, `frameworks/angular-slickgrid/.oxlintrc.json`, and `frameworks-plugins/angular-row-detail-plugin/.oxlintrc.json`.

## VEXP context tools <!-- vexp v2.0.31 -->

When VEXP context tools are available, `run_pipeline` is the primary tool and must be called first for repository tasks. VEXP returns pre-indexed, graph-ranked context in a single call.

### Workflow

1. Call `run_pipeline` with the task description before other repository searches.
2. Make targeted changes from the returned context.
3. Call `run_pipeline` again only when more context is needed.

### Available MCP tools

- `run_pipeline` - primary tool; runs capsule, impact, and memory in one call.
- `get_skeleton` - compact file structure.
- `index_status` - indexing status.
- `expand_vexp_ref` - expand V-REF placeholders in VEXP output.

### Agentic search

When VEXP is available, use `run_pipeline` before built-in file search, grep, or codebase indexing. If spawning sub-agents or background tasks, pass them the context from `run_pipeline` rather than letting them search independently.

### Multi-repo

`run_pipeline` can query all indexed repositories. Use `repos: ["alias"]` to scope it, and use `index_status` to see aliases. If VEXP is unavailable, use the normal repository tools.

### Smart features

VEXP can auto-detect intent, combine hybrid ranking, use session memory, and expand its context budget as needed.

<!-- rtk-instructions v2 -->
# RTK - Token-Optimized CLI

`rtk` is a CLI proxy that filters and compresses command output, saving 60-90% tokens.

## Rule

When `rtk` is available, prefer `rtk <command>` for terminal commands.

Use this as the default-first policy for tests, lint/typecheck/build, git, and diagnostics commands. Apply the same pattern to analogous commands.

Examples:

```text
vitest                     -> rtk vitest
jest                       -> rtk jest
git status                 -> rtk git status
tsc                        -> rtk tsc
ls                         -> rtk ls .
```

Git mappings:

```text
git status                 -> rtk git status
git log -n 10              -> rtk git log -n 10
git diff                   -> rtk git diff
```

If `rtk` is unavailable, run the raw command instead of failing.

For Vitest, default to `rtk vitest run`. Use direct repo-root paths for focused specs and `test/vitest.config.mts`, for example:

```text
rtk vitest run --config test/vitest.config.mts packages/common/src/services/foo.spec.ts
```

Prefer `vitest run` over `pnpm exec vitest` when the Vitest binary is available.

For Cypress, default to `rtk cypress run --config-file test/cypress.config.ts --spec <spec-path>`. If Cypress is not on `PATH`, use `pnpm exec cypress run --config-file test/cypress.config.ts --spec <spec-path>`.

## Low-token availability check

For PowerShell terminals, check once per terminal session and cache the result:

```powershell
if (-not $env:RTK_AVAILABLE) {
	if (Get-Command rtk -ErrorAction SilentlyContinue) {
		$env:RTK_AVAILABLE = '1'
	}
	else {
		$env:RTK_AVAILABLE = '0'
	}
}
```

For bash/zsh terminals:

```bash
if [ -z "${RTK_AVAILABLE+x}" ]; then
  if command -v rtk >/dev/null 2>&1; then
    export RTK_AVAILABLE=1
  else
    export RTK_AVAILABLE=0
  fi
fi
```

Use `rtk` only when the cached availability flag is enabled. Do not re-run the availability check before every command. If an `rtk` command unexpectedly fails because it is unavailable, set the flag to `0` and retry once without `rtk`.

## Meta commands

Use these directly:

```text
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```
<!-- /rtk-instructions -->

## VEXP context tools <!-- vexp v2.0.31 -->

When VEXP context tools are available, `run_pipeline` is the primary tool and must be called first for repository tasks. VEXP returns pre-indexed, graph-ranked context in a single call.

### Workflow

1. Call `run_pipeline` with the task description before other repository searches.
2. Make targeted changes from the returned context.
3. Call `run_pipeline` again only when more context is needed.

### Available MCP tools

- `run_pipeline` - primary tool; runs capsule, impact, and memory in one call.
- `get_skeleton` - compact file structure.
- `index_status` - indexing status.
- `expand_vexp_ref` - expand V-REF placeholders in VEXP output.

### Agentic search

When VEXP is available, use `run_pipeline` before built-in file search, grep, or codebase indexing. If spawning sub-agents or background tasks, pass them the context from `run_pipeline` rather than letting them search independently.

### Multi-repo

`run_pipeline` can query all indexed repositories. Use `repos: ["alias"]` to scope it, and use `index_status` to see aliases. If VEXP is unavailable, use the normal repository tools.

## Documentation

 Update corresponding framework documentation under `frameworks/*/docs/` when applicable.
 Include code examples that work across all supported frameworks.

## Common commands

- `pnpm build` builds all packages and frameworks; it is also the `Build Everything` task.
- `pnpm lint` runs OXLint across the repository.
- `pnpm lint:fix` applies available OXLint fixes.
- `pnpm prettier:check` checks formatting; `pnpm prettier:write` formats files.
- `pnpm test` runs Vitest; `pnpm test:coverage` runs Vitest with coverage.
- `pnpm dev` starts the Vanilla demo; use `pnpm dev:angular`, `pnpm dev:react`, `pnpm dev:vue`, or `pnpm dev:aurelia` for framework demos.

## Monorepo structure

- Changes to `packages/` affect all framework wrappers.
- Framework wrappers depend on core packages; prefer relative imports within packages.
- Avoid circular dependencies.

## Code review focus

- Verify tests pass and coverage remains high.
- Check impact across all four framework implementations.
- Ensure new options do not contradict or overlap with existing ones.
- Check that examples work in all framework demos.

## Completion checklist

- Review the diff for unrelated changes and accidental generated files.
- Verify affected tests, lint, and formatting.
- Mention any checks that could not be run and why.

@RTK.md
