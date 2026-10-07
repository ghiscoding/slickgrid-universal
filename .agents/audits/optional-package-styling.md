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
- v11 migration guide entry: intentionally not in this PR, the v11 migration guide is being added by another PR. Once that PR is merged, rebase this branch and add a breaking change entry (extra package styles must be imported after the theme, CSS `{name}-{theme}.css` or Sass, theme must be loaded first).
- Watch mode: changing common Sass does not recompile optional packages CSS (demos use Sass so they are unaffected).
- Zip ships optional packages CSS only (not their Sass sources).

## Salesforce zip size analysis (2026-10-07)

Zip on branch was ~2.1-2.3KB bigger than master. Breakdown (compressed bytes):
- Bug (fixed): `scripts/build-package-styles.mjs` called PostCSS with `from: undefined`, so cssnano ignored the package `browserslist` and did not merge selectors with `:is()` -> composite CSS was 540B bigger (+478B raw per theme). Fixed by passing `from: outFile` (same plugin order as common: cssnano, autoprefixer). Raw theme CSS is now 62B smaller than master.
- Compression locality: appending the package CSS at the end of each theme puts it >32KB away from similar editor rules, deflate (32KB window) can't reuse them -> ~+550-650B per full theme, ~+70-100B per lite theme. Brotli (larger window) is unaffected. Measured on default theme deflate: master 44912, append 45765, prepend 45197, insert at old position (before `li.hidden{`) 44866.
- Zip only: new Sass partials (`_theme-base*.scss`, +~860B) and their zip entry headers (~+700B), offset by Sass sources moved out of common (`slick-editors.scss`, `_variables.scss`, `slick-plugins.scss`: -3.2KB). `_functions.scss` (+190B) was simply missing from master's committed zip (stale).
- Applied: `compress.mjs` now inserts the package CSS before `li.hidden{` (first `slick-plugins` rule, same cascade position as before), fallback append. Result: zip 1,628B smaller than master (css full -297B, css lite -164B, sass -2,069B, +190B stale `_functions.scss`).

### `li.hidden{` insertion marker (revisit notes)

- Where: `packages/vanilla-force-bundle/compress.mjs` `getThemeCssWithOptionalStyles()`, `themeCss.indexOf('li.hidden{')`.
- Why this rule: it is the first rule emitted by `slick-plugins.scss` (`li.hidden { display: none !important; }`), so inserting before it puts the package CSS right after `slick-editors` output, i.e. the exact cascade position and neighborhood the rules had on master. Verified present exactly once in all 9 minified theme CSS files (default/bootstrap/fluent/material/salesforce + lite).
- Risk: plain string match on minified CSS. It breaks silently (falls back to appending at the end, still correct CSS) if that rule is removed, moved, renamed, or cssnano output changes (e.g. merged with another selector). Symptom: zip grows ~0.5-0.65KB per full theme with no other change.
- How to check: count `li.hidden{` in `packages/common/dist/styles/css/*.css` (expect 1 each) or compare zip size against master.
- Alternatives considered: prepend (robust but ~+0.3KB per full theme vs master), a dedicated `/*! marker */` comment emitted by Sass (robust but adds bytes to every published theme CSS for all users), optional `console.warn` when the marker is not found (cheap, not implemented yet).
