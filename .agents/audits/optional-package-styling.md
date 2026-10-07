# Audit: Optional Package Styling (v11 breaking change)

Date: 2026-10-06
Scope: move styling of optional packages (`composite-editor-component`, `custom-tooltip-plugin`) out of `@slickgrid-universal/common` themes while keeping Sass variables, CSS variables, and Dark Mode working.

## Requirements (from user)

- Optional packages own their styling, common no longer ships it.
- Sass variable overrides (`@use ... with (...)`) must keep working, CSS variables with Sass fallback pattern preserved.
- Dark Mode must keep working.
- Breaking change is acceptable (next major), extra Sass/CSS import per optional package is acceptable.
- `vanilla-force-bundle` Salesforce zip (standalone IIFE + theme CSS) must stay transparent: it already contains SlickCompositeEditor and SlickCustomTooltip.
- Avoid size increase from duplicated CSS.

## Findings

### Current state

- Composite Editor rules: `packages/common/src/styles/slick-editors.scss` ("Slick Composite Editor Modal" section, `.slick-modal-open` + `.slick-editor-modal`).
- Custom Tooltip rules: `packages/common/src/styles/slick-plugins.scss` (`.slick-custom-tooltip`).
- Component Dark Mode tokens (`--slick-editor-modal-*`) live in the `.slick-dark-mode` block of `_variables.scss`.
- Salesforce theme configures composite editor variables (`_variables-theme-salesforce.scss` `@forward ... with`) and uses `$slick-editor-modal-detail-container-border-modified` for core grid cells (`slickgrid-theme-salesforce.scss`) -> those variables must stay declared in common.
- `.slick-editor-modal .btn` in `slick-without-bootstrap-min-styling.scss` is shared with the core LongText editor -> stays in common.

### `_variables.scss` is NOT a pure variables module

It emits CSS, so any separate Sass entry that `@use`s it would duplicate output:
- `@use 'vanilla-calendar-pro/styles/{core,time,months}'` (vendor CSS)
- `@use 'multiple-select-vanilla/.../multiple-select' with (...)` (vendor CSS)
- `.slick-dark-mode { ... }` and `.dark-mode { ... }` blocks

Theme variable files also emit CSS after their `@forward ... with`:
- `_variables-theme-material.scss`: dark mode block
- `_variables-theme-salesforce.scss`: dark mode block
- `_variables-theme-fluent.scss`: `.slickgrid-container` rules + dark mode block

### Bundler constraints

- Angular `@angular/build:application` does NOT support side-effect CSS imports from library JS (only `text|binary|file|dataurl|base64|empty` loaders). Angular-Slickgrid depends on both optional packages -> CSS imports inside package JS are not viable.
- Sass module configuration is per compilation: a separately compiled stylesheet never sees the app's `with (...)` config. Sass must be compiled in the same compilation as the theme (Bootstrap "Option B" model: variables first, then optional partials).
- `vanilla-force-bundle/compress.mjs` zips `common/dist/styles/**` (CSS + Sass) next to the UMD bundle.

## Decision

Bootstrap-like model:
1. Make `_variables.scss` and `_variables-theme-*.scss` non-emitting (variables only). Move emitted vendor/dark-mode CSS to separate partials used by every theme entry.
2. Keep all `$slick-editor-modal-*` / `$slick-tooltip-*` declarations in common (keeps theme `with (...)` and Salesforce config working, zero CSS bytes).
3. Each optional package ships `dist/styles/sass/*.scss` (uses common variables) and precompiled `dist/styles/css/*-theme-{name}.css` per theme.
4. Users add one extra import after the theme, e.g.
   ```scss
   @use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss' with ($slick-primary-color: blue);
   @use '@slickgrid-universal/composite-editor-component/dist/styles/sass/slick-composite-editor.scss';
   ```
   Order matters: theme first (Sass configuration must happen on first load).
5. Salesforce zip: append matching optional-package theme CSS to each common theme CSS inside the zip (same filenames) -> transparent.

## Baseline

Expanded theme CSS compiled before changes into `%TEMP%/sg-before` (for diffing new output). Expected diff: only composite editor / tooltip rules and their dark tokens removed.
If `%TEMP%` was cleared, regenerate it from a clean checkout (`git stash -u`, compile, `git stash pop`).

## Progress (implemented 2026-10-07, uncommitted)

Implemented:
- Common: `_variables.scss` / `_variables-theme-{fluent,material,salesforce}.scss` are now non-emitting; emitted CSS lives in `_theme-base.scss` + `_theme-base-{fluent,material,salesforce}.scss`, loaded by every theme entry right after `@forward`.
- Composite Editor rules (+ dark tokens) moved to `packages/composite-editor-component/src/styles/slick-composite-editor.scss`, Custom Tooltip rules to `packages/custom-tooltip-plugin/src/styles/slick-custom-tooltip.scss`; removed from `slick-editors.scss` / `slick-plugins.scss`.
- `scripts/build-package-styles.mjs`: copies optional package Sass to `dist/styles/sass` and compiles per theme `dist/styles/css/{name}-{default|bootstrap|fluent|material|salesforce}.css` (Sass + autoprefixer + cssnano).
- Optional packages: `sass:bundle` script, `dev` runs it too, `exports` `./dist/styles/*`, `browserslist`, devDeps (sass, postcss, autoprefixer, cssnano). Root `sass:bundle` now runs for all packages (topological, common first).
- `vanilla-force-bundle/compress.mjs`: each zipped `slickgrid-theme-{theme}(.lite).css` gets the matching optional packages CSS appended (same filenames).
- Demos (vanilla, angular, react, react-fluent, vue, aurelia) import both optional Sass files after the theme.
- Docs: "Optional Packages Styling" section in `docs/styling/styling.md` + 4 framework styling docs.

Validation done:
- Theme CSS diff vs baseline (all 9 themes): only Composite Editor / Tooltip rules and their dark tokens removed (51 "added" lines are relocated `/* */` comments from `_variables.scss`).
- Optional CSS: per-theme values applied (e.g. Salesforce `--lwc-fontSize7`), no vendor/shared CSS leak; composite ~19KB, tooltip ~0.6KB minified.
- Same compilation: theme `with (...)` values reach optional styles; wrong order fails with Sass "already loaded, can't be configured" error; no duplicated rules.
- `pnpm build:universal` (tsc + all sass bundles), vanilla demo Vite build, Angular demo `ng build` (Angular Sass resolver OK), Salesforce zip (all theme CSS entries contain optional styles), oxlint, Prettier, Vitest (composite editor, custom tooltip, force bundle: 176 tests).

Not done:
- Cypress E2E (needs demo servers), React/Vue/Aurelia demo builds (same Vite Sass path as vanilla).
- Migration guide entry (no v11 migration doc exists yet).
- Watch mode: changing common Sass does not recompile optional packages CSS (demos use Sass so they are unaffected).
- Zip ships optional packages CSS only (not their Sass sources).