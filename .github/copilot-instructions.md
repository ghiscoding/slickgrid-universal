# GitHub Copilot Instructions for slickgrid-universal

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
