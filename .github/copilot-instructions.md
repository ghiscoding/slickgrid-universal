# GitHub Copilot Instructions for slickgrid-universal

- in all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of concision.

## Tools

- Dependency graph/impact (JS/TS): use `madge` when available
- Prefer non-SVG output for machine use when possible; use SVG only for visualization
- Circular deps: `madge --circular`

## Repository Overview
This is a monorepo for SlickGrid Universal, which serves as a framework for grid functionality across multiple platforms. As a framework, stability and backward compatibility are critical:
- Avoid breaking changes whenever possible. Instead, use deprecations and overloads to phase out old APIs or behaviors, only removing them after a full deprecation cycle.
- The framework offers a vast selection of options—ensure that any newly added options do not contradict or interfere with existing ones.

The monorepo contains:
- Core packages in `packages/` (common, plugins, exports, etc.)
- Framework wrappers in `frameworks/` (Angular, React, Vue, Aurelia)
- Demo applications in `demos/` for each framework
  - except Angular demos which are located in `frameworks/angular-slickgrid/src/demos`
- Shared test utilities in `test/`

## Code Standards

### Testing
- Use **Vitest** for unit tests (`.spec.ts` files)
- Use **Cypress** for E2E tests (`.cy.ts` files in `test/cypress/e2e/`)
- Aim for 100% statement coverage on core functionality
- Test files are usually in `__tests__/` subdirectory (or same folder if only 1-2 test files)
- Unit tests exist in 2 implementations:
  - Native/vanilla implementation: all under `packages/`
  - Angular-specific tests: under `frameworks/angular-slickgrid/`

### TypeScript Patterns
- Use strict TypeScript with proper typing
- Prefer `interface` over `type` for object shapes
- Use `protected` for class methods that may be extended
- Follow existing naming conventions: `_privateField`, `publicMethod`

### Code Formatting & Linting
- **OXLint** is used for linting TypeScript/JavaScript code
  - There are three `.oxlintrc.json` files for OXLint:
    - Root base config: `.oxlintrc.json` at the repo root
    - Angular Slickgrid override: `frameworks/angular-slickgrid/.oxlintrc.json`
    - Angular Row Detail Plugin override: `frameworks-plugins/angular-row-detail-plugin/.oxlintrc.json`
  - Check these files for custom rules or exceptions, especially when working in Angular projects.
- **Prettier** handles code formatting automatically
- Code should be formatted before committing
- Run `pnpm lint:fix` to auto-fix linting issues
- Run `pnpm prettier:write` to format code
- Ensure no linting errors before creating pull requests

### Plugin Development
- All plugins extend SlickGrid and use `SlickEventHandler`
- Use `BindingEventService` for DOM event binding/cleanup
- Always implement `init()`, `dispose()`, and `getOptions()`/`setOptions()`
- Plugins should support both grid options and column definition options

### Framework Support
When making changes to demos or documentation:
- Update **all 4 frameworks**: Angular, React, Vue, Aurelia
- Maintain consistency across framework implementations
- Check for framework-specific syntax (e.g., Vue's template vs React's JSX)

### Documentation
- Update corresponding docs in `docs/` AND framework-specific `frameworks/*/docs/`
- Use markdown with proper linking: `[file.ts](path/to/file.ts)`
- Include code examples that work across frameworks

## Common Commands
- `pnpm build` - Build all packages
  - aka "Build Everything" task, which builds all packages and frameworks in the monorepo
- `pnpm lint` - Run linter (OXLint) on all files
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm prettier:check` - Check code formatting
- `pnpm prettier:write` - Format code with Prettier
- `pnpm test` - Run Vitest unit tests  
- `pnpm test:coverage` - Run tests with coverage
- `pnpm dev` - Start vanilla demo
- `pnpm dev:[framework]` - Start framework-specific demos 
  - e.g.: `dev:angular`, `dev:react`, `dev:vue`, `dev:aurelia`

## Monorepo Structure
- Changes to `packages/*` affect all frameworks
- Framework wrappers depend on core packages
- Use relative imports within packages
- Avoid circular dependencies

## Code Review Focus
- Maintain backward compatibility and framework stability
- Avoid breaking changes; prefer deprecations and overloads until features are fully phased out
- Consider impact across all 4 framework implementations
- Ensure new options/settings do not contradict or overlap with existing ones
- Verify tests pass and coverage remains high
- Check that examples work in all framework demos

<!-- rtk-instructions v2 -->
# RTK — Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

When `rtk` is available, prefer `rtk <command>` for terminal commands.

Use this as a default-first policy for tests, lint/typecheck/build, git, and diagnostics commands.
Apply the same pattern to analogous commands even if they are not explicitly listed below.

Examples:

```bash
vitest                     -> rtk vitest
jest                       -> rtk jest
git status                 -> rtk git status
tsc                        -> rtk tsc
ls                         -> rtk ls .
```

Git (explicit mappings):

```bash
git status                 -> rtk git status
git log -n 10              -> rtk git log -n 10
git diff                   -> rtk git diff
```

If `rtk` is not available in the current environment, run the raw command without `rtk` instead of failing.

For Vitest in this repo, default to `rtk vitest run` for test execution unless full raw output is explicitly needed.
Use direct file filters when running a single spec, and point at the repo config in `test/vitest.config.mts`, for example `rtk vitest run --config test/vitest.config.mts packages/common/src/services/foo.spec.ts`.
Spec paths can live anywhere in the monorepo, so use the repo-root path to the exact file being targeted.
Prefer `vitest run` over `pnpm exec vitest` when the Vitest binary is available, since `run` is the actual test subcommand and supports the same single-file filters with less command overhead.

## Low-Token Availability Check

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

For bash/zsh terminals (Linux/macOS), use the equivalent one-time check:

```bash
if [ -z "${RTK_AVAILABLE+x}" ]; then
  if command -v rtk >/dev/null 2>&1; then
    export RTK_AVAILABLE=1
  else
    export RTK_AVAILABLE=0
  fi
fi
```

Use `rtk` only when `$env:RTK_AVAILABLE -eq '1'`; otherwise run the raw command.
In bash/zsh, use `rtk` only when `$RTK_AVAILABLE = 1`; otherwise run the raw command.
Do not re-run the availability check before every command.

If a command fails because `rtk` is unexpectedly unavailable, set `$env:RTK_AVAILABLE = '0'` and retry once without `rtk`.
In bash/zsh, set `RTK_AVAILABLE=0` and retry once without `rtk`.

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```
<!-- /rtk-instructions -->

## vexp context tools <!-- vexp v2.0.31 -->

**MANDATORY: use `run_pipeline` - do NOT grep, glob, or read files manually.**
vexp returns pre-indexed, graph-ranked context in a single call.

### Workflow
1. `run_pipeline` with your task description - ALWAYS FIRST (replaces all other tools)
2. Make targeted changes based on the context returned
3. `run_pipeline` again only if you need more context

### Available MCP tools
- `run_pipeline` - **PRIMARY TOOL**. Runs capsule + impact + memory in 1 call.
  Auto-detects intent. Includes file content. Example: `run_pipeline({ "task": "fix auth bug" })`
- `get_skeleton` - compact file structure
- `index_status` - indexing status
- `expand_vexp_ref` - expand V-REF placeholders in v2 output

### Agentic search
- Do NOT use built-in file search, grep, or codebase indexing - always call `run_pipeline` first
- If you spawn sub-agents or background tasks, pass them the context from `run_pipeline`
  rather than letting them search the codebase independently

### Smart Features
Intent auto-detection, hybrid ranking, session memory, auto-expanding budget.

### Multi-Repo
`run_pipeline` auto-queries all indexed repos. Use `repos: ["alias"]` to scope. Run `index_status` to see aliases.
<!-- /vexp -->