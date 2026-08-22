# Formula Editor Plugin Progress

Last updated: 2026-08-21 (formula drag-fill and complete unit-test coverage)
Branch context: feat/cell-formula-plugin

## Maintenance Rule
- On every formula-plugin related change, update this file in the same commit/PR.
- Keep it short and factual: what changed, why, tests added/updated, and any new constraints.

## Purpose
This file is a handoff for future AI/dev sessions. It describes what is already implemented in the formula editor UX and what is still pending.

## Implemented
- In-grid formula reference click does not close the editor anymore.
- Clicking another grid cell while editing a formula replaces the reference token at caret (Excel-like behavior).
- Dragging across cells updates the active formula reference as a range.
- Caret-aware reference detection is implemented.
- When caret is inside a token like D1:D3, that token becomes the active editable reference range.
- Reference range rewrite updates the token in place (no prefix/suffix corruption).
- Endpoint drag expansion keeps opposite endpoint as anchor (e.g. D1:D3 can expand to D1:D6).
- Grid click is suppressed during reference-pick lifecycle to prevent SlickGrid auto-commit/close.
- Formula editor supports both selection-model highlight and CSS fallback highlight.
- Preferred path uses grid selection model via setSelectedRanges(SlickRange[]) when available.
- Fallback path uses setCellCssStyles when no compatible selection model exists.
- Explicit type annotation was added for _referenceTokenRegex to satisfy isolated declarations.

## Selection Model Integration
- The formula editor now integrates with the active SelectionModel API.
- If a compatible model exists, it drives visual range selection through setSelectedRanges.
- This is intended to use normal Slick selection UX (including hybrid model behavior) instead of a separate custom visual system.

## Required Grid Options For Full UX
For full Excel-like range visuals/drag-resize, the grid must have cell-capable selection enabled.

Recommended:
- enableSelection: true
- selectionOptions.selectionType: "mixed" or "cell"

## Runtime Validation Added
FormulaService now validates selection prerequisites when formula columns are detected.
- If prerequisites are missing, it logs a one-time warning with the required options.
- It does not auto-mutate user grid options.

## FormulaService Behaviors Already Present
- Auto-assign FormulaCellEditor to allowFormula columns (without overriding explicit non-formula custom editor models).
- Formula store set/get/has/remove.
- A1 and REF(COLUMN(), ROW()) support in evaluation/export flow.
- Formula token highlighting support.
- Excel export helpers for defined names and custom functions.

## Latest Update: Excel Custom Functions Export (2026-08-06)
- Fixed workbook creation path in Excel export service to prefer createWorkbook() (excel-builder-vanilla v5.2.0 API), with fallback to new Workbook() for backward compatibility.
- Confirmed workbook-level defined names/custom functions registration continues to run through FormulaProvider hooks.
- Added regression test asserting workbook factory path is used in Excel export service.
- Updated formula demo setup to include excelCustomFunctions for CUSTOMSUM export.

Why this mattered:
- customFunctions handles in-app formula evaluation.
- excelCustomFunctions is required for workbook-level export so Excel can resolve names/functions and avoid #NAME? (on Excel versions supporting LAMBDA).

## Latest Update: Example 46 Dark Mode Editor Background (2026-08-06)
- Fixed dark mode editor background mismatch in demo example47 by switching formula editor background to use --slick-text-editor-background.
- Added local variable overrides in example47:
	- light mode: --slick-text-editor-background: #fff
	- dark mode: --slick-text-editor-background: #111827
- Added dark-mode selected editable cell color override:
  - --slick-cell-selected-editable-color: #333333
- This aligns formula editor and built-in text editors with dark mode in the same grid scope.

## Latest Update: Formula Token Styling (2026-08-06)
- Updated formula token appearance to match Excel/AG Grid behavior: text color only.
- Removed token chip styling (border/background) from shared plugin styles and example47 demo token overrides.
- This avoids visual conflict when selecting formula text (for example Ctrl+A in editor).

## Latest Update: Ctrl+A Event Scope (2026-08-06)
- Fixed formula editor key handling so Ctrl+A / Cmd+A stays inside the editor.
- The editor now stops propagation for select-all shortcuts without preventing default browser behavior.
- This prevents SlickGrid from receiving the event and selecting all grid cells while formula editor is focused.

## Latest Update: Formula Style Portability (2026-08-06)
- Moved base formula editor styling from demo-level example47 stylesheet into shared plugin styles:
	- .formula-editor-input
	- .formula-token
- Added shared CSS variables for formula editor border/focus/text colors with dark-mode defaults.
- Kept only demo-specific visual overrides in example47 (for example row colors and local editor background/selected editable color vars).

## Tests Added/Updated
`src/__tests__/formula.cellEditor.spec.ts` covers:
- Editor remains open and suppresses grid click after reference selection.
- Caret-driven range highlight and drag-rewrite flow.
- Endpoint drag expansion anchor behavior.
- Fallback to cell-css highlighting when no selection model is available.
- No persistent cell colors are applied on initial load.
- Clipboard copy/cut uses plain text from editor DOM textContent (NBSP normalized).
- Autocomplete insertion reads live editor DOM text instead of stale cached plain value.
- Selection highlight style is removed only when it was actually active.

`src/__tests__/formula.service.spec.ts` covers:
- Warning when formula columns exist but selection prerequisites are missing.
- No warning when mixed selection is configured.

test/cypress/e2e/example47.cy.ts covers:
- Formula editor argument append-after-operator regression (`=SUM(C1*` then click cell => `=SUM(C1*D1`).
- Multi-reference color persistence while typing (`=C1*SUM(D1:D3)`) with stable per-reference coloring.
- Formula editor copy/cut plain-text clipboard behavior.
- Incomplete reference color stability scenarios from formula-entry workflows.
- Formula evaluation, custom functions, and baseline formula cell calculations.

## Latest Update: Security & Plugin Convention Review (2026-08-06)
- **Fixed XSS**: `FormulaCellEditor.renderTokens()` built its highlighted markup as an HTML string (only cell-reference tokens were escaped) and assigned it via `innerHTML`. Any other raw formula text (typed or loaded from dataset values) was inserted unescaped, so formulas like `=A1&"<img src=x onerror=...>"` could execute arbitrary markup/script. Rewrote to build the token spans via DOM APIs (`createTextNode`/`createElement`+`textContent`) so no formula text is ever HTML-parsed. Removed the now-unused `escapeHtml()` helper.
- **Removed the `Function()` eval fallback** in `FormulaService.evaluateFormulaExpression()`. The custom recursive-descent parser already implements the full supported grammar and always returns a defined value/error code, so the dynamic-code fallback was unreachable in practice and only added unnecessary injection surface (regex-based guards ahead of `Function(...)` are fragile to maintain as grammar grows). The parser result is now returned directly.
- **Added `getOptions()`/`setOptions()`** to `FormulaService` to match the `ExternalResource` plugin convention used by other plugins (e.g. `CustomTooltip`).
- **Adopted `BindingEventService`** in `FormulaCellEditor` (added `@slickgrid-universal/binding` dependency) instead of manual `addEventListener`/`removeEventListener` bookkeeping, matching the convention used by `baseEditorClass`/`longTextEditor`/`sliderEditor`/`slickCustomTooltip`.
- **Fixed `dispose()` asymmetry**: `autoAssignFormulaEditorToColumns()` now records each column's original `formatter`/`params`/`editorClass`/`editor` before wrapping it, and a new `restoreAutoAssignedFormulaEditorColumns()` (called from `dispose()`) restores them — mirroring the existing `enableExcelHeaderPrefix`/`disableExcelHeaderPrefix` symmetry.
- **Fixed a corrupted `formula.service.spec.ts`**: a stray, incomplete `it(...)` block had split a test's body away from its `it(...)` declaration (leaving one dangling fragment ~90 lines later in the file), causing an OXC parse error that failed the *entire* spec file silently. This means `formula.service.spec.ts` had not actually been executable/passing prior to this fix, despite prior progress notes/verification commands claiming otherwise. Reconstructed the split test (`should shift direct A1 references by excelRowOffset during export`) and removed the orphaned fragment.

### Found but NOT fixed (needs a product decision)
After the spec file was repaired, 2 pre-existing test failures surfaced (unrelated to the changes above — same behavior existed before, just never actually ran due to the parse error):
- `should evaluate unicode multiply with range like Excel formula shorthand` expects `=B1×C1:C3` (scalar × range) to reduce to `24` (i.e. `B1 * SUM(range)`).
- `should return #VALUE! for scalar times range shorthand expressions` expects the structurally identical `=C1*D1:D3` (scalar * range) to return `#VALUE!`.

These two expectations contradict each other for the same formula shape (only the multiply symbol differs, and `×` is normalized to `*` early in evaluation). Do not "fix" one without deciding the intended semantics for scalar-times-range shorthand (implicit SUMPRODUCT-style broadcast vs. hard error) — pick one behavior and update the other test accordingly.

## Latest Update: Grouping Limitation Note (2026-08-06)
- Grouping + FormulaService is **not fully supported yet**.
- Grouping/Grouping Formatter scenarios can still show incorrect or unstable formula behavior.
- `example47` includes grouping, but known grouping-related bugs remain.
- Concrete issue: when grouping inserts extra group rows (for example group headers/totals), formula references are not remapped to account for the inserted rows, so A1 references can point to the wrong cells (row offset drift).
- Excel export for grouped formula scenarios is also not yet fully complete.
- Plan: keep grouping support as a follow-up task and fix it in a dedicated pass later.

## Latest Update: Argument Insert After Operator Fix (2026-08-06)
- Coverage push work is postponed for now to focus on formula UX bug fixes.
- Fixed reference pick behavior when composing function arguments with operators.
- Before: after `=SUM(C1*`, clicking a cell replaced `C1` (for example `=SUM(D1*`).
- Now: after `=SUM(C1*`, clicking a cell inserts at caret as expected (for example `=SUM(C1*D1`).
- Root cause was a single-reference fallback path that replaced the lone token even when caret context indicated a new argument expression.
- Fix: when no token is active at caret and caret follows an argument operator/delimiter (`=`, `(`, `,`, `+`, `-`, `*`, `/`, `^`, `&`, `:`), editor now inserts at caret instead of replacing the existing reference token.

## Latest Update: Stable Column/Row References (2026-08-20)
- This risk is addressed for formulas committed through FormulaService.
- The editor continues to display A1 references, while committed formulas use stable `REF(COLUMN("columnId"),ROW("rowId"))` references.
- Runtime evaluation resolves stable references against the full logical column list, including hidden columns.
- Excel export converts stable references to native A1 formulas using the exported column and row order.
- Legacy A1 formulas are canonicalized when the service has the current grid column and row identities.
- Exporting a formula that depends on a hidden source column requires `includeHidden: true` so the source exists in the workbook.
- Added regressions for reorder/hide runtime behavior, reordered Excel export, and hidden-column-inclusive export.

## PR #2716 Checklist Review (2026-08-20)
Completed checklist items now include:
- Cypress E2E coverage for formula editing, reference insertion, autocomplete, token/grid colors, clipboard behavior, and formula evaluation.
- Stronger selected-reference styling through persistent reference colors plus SelectionModel range highlighting, with CSS fallback.
- Stable column/row references for reorder and hide scenarios while keeping A1 syntax in the editor.
- Excel export conversion from stable references back to native A1 formulas, including export row offsets and included hidden columns.
- Shared reference/color parsing between FormulaCellEditor and FormulaService.
- Formula drag-fill through the existing `.slick-drag-replace-handle` / `onDragReplaceCells` flow.
- Drag-filled formulas shift relative A1 references by the target row/column delta while preserving absolute row/column markers during translation.
- Drag-filled formulas are written back through stable `REF(COLUMN(),ROW())` storage, keeping reorder/hide runtime behavior and Excel export compatibility.

Still open:
- Grouping and grouped formula export.
- Grid State/Preset persistence for formula references.
- Whole-column drag-handle expansion and calculated-column support.
- Browser coverage for formula-source translation, absolute-reference fill behavior, and selection-model fallback.
- Optional strict selection-prerequisite mode.

## Latest Update: Formula Color Sync, Incomplete References, and Clipboard (2026-08-10)
- Restored color-sync separation of concerns to prevent editor/grid mismatch regressions:
	- persistent reference coloring is applied through `buildFormulaReferenceColorCache()` -> `applyFormulaReferenceCellColors()` on user input.
	- `renderGridSelectionHighlight()` only manages selection-model highlight and no longer re-applies persistent colors.
- Fixed a syntax regression in `FormulaCellEditor.clearReferenceSelectionHighlight()` (malformed brace block) that caused transform/parse failure.
- Tightened highlight cleanup logic so selection highlight CSS key is removed only if highlight was previously active.
- Confirmed incomplete references (for example `D1:D`) keep stable token color assignment and do not collapse other reference colors.
- Added plain-text clipboard handling for Ctrl/Cmd+C and Ctrl/Cmd+X from editor DOM text content with NBSP normalization.

Why this mattered:
- Prevented "all references same color" and "colors disappear while typing" regressions.
- Kept formula token colors and grid reference colors aligned for multi-reference formulas.
- Ensured clipboard output from the formula editor is plain formula text without HTML/span artifacts.

## Latest Update: Saved-Formula Reopen Color Order (2026-08-15)
- Fixed inverted grid reference colors after committing and reopening a formula such as `=C1*SUM(D1:D3)`.
- Root cause: `FormulaService.extractExcelReferenceGroups()` collected all ranges before single-cell references, while `FormulaCellEditor` assigned colors in textual order.
- Added `formula-reference.ts` as the shared source for reference token matching, normalization, A1 column conversion, range expansion, deduplication, color assignment, and `FormulaReferenceColorCache` state management.
- FormulaCellEditor and FormulaService now consume the same cache abstraction; their duplicate extraction, conversion, and reference-cache lifecycle implementations were removed. The editor retains only DOM/caret and grid-style application concerns.
- Added shared utility and FormulaService unit regressions plus Cypress coverage that commits with Enter, reopens the editor, and verifies `C1` remains color 1 while `D1:D3` remains color 2.
- Added the reverse-order Cypress regression (`=SUM(D1:D3)*C1`) to ensure color assignment follows formula text order in both directions.
- Moved formula-plugin unit specs into `src/__tests__` and updated their relative imports.
- Added direct unit coverage for the shared `FormulaReferenceColorCache`, malformed references, and shared A1 conversion/range expansion helpers.
- Expanded formula-function, FormulaCellEditor, and FormulaService edge-case coverage for invalid values, color cleanup, caret guards, circular/missing references, and literal conversion.
- Covered empty-stat-function and SUMPRODUCT normalization branches; removed an unreachable nullish fallback after numeric normalization.
- Added direct editor helper coverage for invalid ranges, reference-token resolution, insertion decisions, anchor selection, and cache no-op handling.
- Added FormulaService date arithmetic and reference/literal edge-case coverage.
- Added stable-reference regressions covering A1-to-ID canonicalization, column reorder/hide evaluation, range endpoints, reordered Excel export, and hidden-column-inclusive export.

## Latest Update: Formula Drag-Fill (2026-08-21)

- FormulaService now subscribes to the existing `onDragReplaceCells` event generated by `.slick-drag-replace-handle`.
- Vertical, horizontal, and corner fill ranges reuse the same target-range semantics as the vanilla spreadsheet drag-fill example.
- Relative A1 references are shifted by the target/source row and logical column deltas; quoted literals are left unchanged.
- Absolute row/column markers are retained for editor reopen, subsequent fills, and Excel export.
- Generated formulas are persisted as stable column/row references, and the drag-fill regression verifies runtime evaluation plus native Excel A1 export.
- Refactored drag-fill range handling and A1 translation into the internal `formula.drag-fill.ts` module; FormulaService remains the lifecycle/storage adapter.
- Added AG Grid-style common series inference inside the optional formula-plugin package only: one static value copies, multiple numeric values continue linearly, and string/mixed values repeat in source order for `allowFormula` columns.
- Documented the interaction requirement for combined formula editing and drag-fill: with `autoEdit: false`, a single click selects the formula cell and double-click opens the editor without competing with the drag handle.
- Added Example 47 Cypress coverage for numeric series inference, formula stability after column reorder/hide, and exported formula row offsets.
- Expanded Vitest coverage for FormulaCellEditor keyboard, caret, focus, clipboard, and lifecycle paths; FormulaService parser, lifecycle, conversion, and export paths; and drag-fill edge cases.
- Added FormulaService regressions for changed live-formula precedence and both FormulaValueFormatter row-resolution paths (`DataView.getItem()` and the item-array fallback).
- The full unit suite passes with 218 files and 6,022 tests; Formula plugin coverage is 100% statements/functions/lines and 93.52% branches.

### Cypress Coverage Audit (2026-08-21)

The Example 47 Cypress spec now covers formula editing and persistence, reference insertion with autocomplete, token/grid colors, incomplete references, clipboard text, formula evaluation, custom-function cell behavior, numeric static-value series inference, runtime stability after column reorder/hide, and reordered Excel formulas with the dataset row offset.

The Example 47 Cypress suite is passing with the prescribed `pnpm cypress:ci --spec test/cypress/e2e/example47.cy.ts` command.

The following implemented paths remain covered by unit tests but do not yet have direct Cypress coverage: caret-aware reference detection and range endpoint drag expansion, CSS fallback highlighting without a compatible selection model, prerequisite warning behavior, raw `REF(COLUMN(),ROW())` entry, hidden-column-inclusive Excel export, absolute/relative formula translation through the drag handle, workbook defined-name/custom-function assertions, and grouping-specific formula behavior.

## Known Constraints / Notes
- Security audit follow-up: formula reference expansion is bounded, highlight dictionaries use null-prototype objects, and formula/drag-fill writes safely handle a `__proto__` field.
- Without a cell-capable selection model, range visuals fall back to CSS highlighting only.
- TreeDataService-style hard throw was intentionally not used for formula selection prerequisites; behavior is warning-only to avoid breaking existing grids.
- Grouping and Grouping Formatter integration is currently a known limitation for FormulaService and grouped formula export.
- Series inference currently covers AG Grid's common default path only; modifier-key toggles, custom fill callbacks, range-reduction clearing, and double-click fill remain follow-ups.
- The FormulaService currently supports all function names and operators listed in the AG Grid Formula Reference, plus `SUMPRODUCT` and `NA`. Revisit for closer Excel/AG Grid semantic parity later, including wildcard criteria, type-coercion edge cases, and distinct `#CIRCREF!` / `#PARSE!` error codes (circular references currently return `#REF!`, and parser failures return `#ERROR!`).

## Fast Verification

Run:

- vitest run --config test/vitest.config.mts packages/formula-plugin/src/__tests__/formula.drag-fill.spec.ts
- vitest run --config test/vitest.config.mts packages/formula-plugin/src/__tests__/formula.cellEditor.spec.ts
- vitest run --config test/vitest.config.mts packages/formula-plugin/src/__tests__/formula-reference.spec.ts
- vitest run --config test/vitest.config.mts packages/formula-plugin/src/__tests__/formula.service.spec.ts
- vitest run --config test/vitest.config.mts packages/excel-export/src/excelExport.service.spec.ts
- pnpm test:coverage (218 files, 6,022 tests; Formula plugin: 100% statements/functions/lines, 93.52% branches)
- cypress run --config-file test/cypress.config.ts --spec test/cypress/e2e/example47.cy.ts

## Suggested Next Items
- Add optional strict mode in FormulaService to throw (instead of warn) when full selection prerequisites are required by product requirements.
- Add higher-level coverage for whole-column drag-handle expansion and calculated-column behavior.
