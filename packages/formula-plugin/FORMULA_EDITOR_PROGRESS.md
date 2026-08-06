# Formula Editor Plugin Progress

Last updated: 2026-08-06 (XSS fix in token rendering + removed Function() eval fallback + plugin API conventions + spec file corruption fix + grouping limitation note)
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
- Fixed dark mode editor background mismatch in demo example46 by switching formula editor background to use --slick-text-editor-background.
- Added local variable overrides in example46:
	- light mode: --slick-text-editor-background: #fff
	- dark mode: --slick-text-editor-background: #111827
- Added dark-mode selected editable cell color override:
  - --slick-cell-selected-editable-color: #333333
- This aligns formula editor and built-in text editors with dark mode in the same grid scope.

## Latest Update: Formula Token Styling (2026-08-06)
- Updated formula token appearance to match Excel/AG Grid behavior: text color only.
- Removed token chip styling (border/background) from shared plugin styles and example46 demo token overrides.
- This avoids visual conflict when selecting formula text (for example Ctrl+A in editor).

## Latest Update: Ctrl+A Event Scope (2026-08-06)
- Fixed formula editor key handling so Ctrl+A / Cmd+A stays inside the editor.
- The editor now stops propagation for select-all shortcuts without preventing default browser behavior.
- This prevents SlickGrid from receiving the event and selecting all grid cells while formula editor is focused.

## Latest Update: Formula Style Portability (2026-08-06)
- Moved base formula editor styling from demo-level example46 stylesheet into shared plugin styles:
	- .formula-editor-input
	- .formula-token
- Added shared CSS variables for formula editor border/focus/text colors with dark-mode defaults.
- Kept only demo-specific visual overrides in example46 (for example row colors and local editor background/selected editable color vars).

## Tests Added/Updated
formula.cellEditor.spec.ts covers:
- Editor remains open and suppresses grid click after reference selection.
- Caret-driven range highlight and drag-rewrite flow.
- Endpoint drag expansion anchor behavior.

formula.service.spec.ts covers:
- Warning when formula columns exist but selection prerequisites are missing.
- No warning when mixed selection is configured.

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
- `example46` includes grouping, but known grouping-related bugs remain.
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

## Latest Update: Column Reorder/Hide Offset Risk Note (2026-08-06)
- Added a forward-looking risk note for formula stability with column visibility/order changes.
- Most probable issue: if a column is hidden or moved (for example via Column Picker or Grid Menu), formulas that rely on A1-style column letters can become offset/misaligned from intended source columns.
- Current status: not fully validated/fixed yet.
- Plan: revisit in a dedicated pass with explicit handling/tests for column hide/show and column reorder scenarios.
- Modified grid option to include: `{ enableColumnReorder: false, enableColumnPicker: false, enableGridMenu: false, enableHeaderMenu: false }` in example46

## Known Constraints / Notes
- Without a cell-capable selection model, range visuals fall back to CSS highlighting only.
- TreeDataService-style hard throw was intentionally not used for formula selection prerequisites; behavior is warning-only to avoid breaking existing grids.
- Grouping and Grouping Formatter integration is currently a known limitation for FormulaService and grouped formula export.

## Fast Verification
Run:
- vitest run --config test/vitest.config.mts packages/formula-plugin/src/formula.cellEditor.spec.ts
- vitest run --config test/vitest.config.mts packages/formula-plugin/src/formula.service.spec.ts
- vitest run --config test/vitest.config.mts packages/excel-export/src/excelExport.service.spec.ts

## Suggested Next Items
- Add optional strict mode in FormulaService to throw (instead of warn) when full selection prerequisites are required by product requirements.
- Validate behavior with drag handle interactions from SlickHybridSelectionModel in a higher-level integration test.
- Add docs snippet in user-facing formula plugin docs showing required selection options for range UX.
