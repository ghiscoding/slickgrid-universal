# Formula Editor Plugin Progress

Handoff for future AI/dev sessions. Detailed history is in the git log of this file and the `feat/cell-formula-plugin` commits (PR #2716).

## Maintenance Rule
- Update this file in the same commit as any formula-plugin change.
- Keep it short and factual: what changed, why, how it was validated, and any new constraints.

## Current Status (2026-11-21)
- Target scope: AG Grid / Syncfusion formula parity, not an Excel equivalent. Grouping support is kept intentionally (AG Grid lists it as unsupported).
- Every documented AG Grid Formula Editor behavior is covered: default editor for `allowFormula` columns, custom-editor opt-out, selection-model fallback, opt-in `validateFormulas`, error tooltips and `formulaDataSource`. Range handles are covered by range-endpoint dragging rather than visible handles.
- Functions: all AG Grid functions plus the Syncfusion set (`ABS`, `ROUND`, `MOD`, `SQRT`, `RANDOM`/`RAN`, `CONCATENATE`) and `NA`. `SUMPRODUCT` and Excel-style `SUMIF` resizing were removed; mismatched `SUMIF` ranges return `#VALUE!`.
- Size: about 5,020 production source lines; bundle about 74 KB minified / 22 KB gzipped, excluding `@slickgrid-universal/*`.
- Performance (5,000 rows): init about 70 ms and a full evaluation pass about 50 ms. A cold dependency chain can overflow the stack; see Open Work.
- Security: formula text is rendered only through DOM text APIs, there is no dynamic code evaluation, reference expansion is bounded, highlight dictionaries use null-prototype objects, and formulas the grid cannot parse (for example DDE payloads with `|`) are exported to Excel as text.
- Validation: unit tests at 100% statement/line coverage (Codecov patch and project 100%). Framework Cypress suites (Vanilla Example 48, framework Example 59) run in CI.

## Scope Decisions
- Kept: grouping (grouped references, `createGroupingAggregator`, grouped Excel export with the Formula References helper sheet), wildcard criteria, `NA()`, `#NUM!`/`#NULL!`/`#N/A`, Excel 1900 date serials.
- Removed: `SUMPRODUCT`, `SUMIF` sum-range resizing, unused `renderFormulaReferenceHighlights`/`extractExcelReferences`, the `debug` editor param, and `hasFormula`/`getFormula` from `FormulaProvider`.
- Rejected: whole-row reference picking (needs a row-number column first), whole-column drag-handle expansion, double-click fill, colored resize handles, a strict selection-prerequisite mode, and replacing the contenteditable autocomplete.

## Key Constraints
- Full range visuals need `enableSelection: true` with `selectionOptions.selectionType` set to `'cell'` or `'mixed'`; otherwise highlights fall back to CSS classes and a one-time warning is logged.
- Formulas are stored as stable `REF(COLUMN("id"),ROW("id"))` references; the editor shows A1 references based on displayed rows (grouping, filtering and paging).
- Row caches last one synchronous pass and clear on DataView events, so in-place dataset mutations need the usual `dataView.refresh()`.
- Use `autoEdit: false` when combining formula editing and drag-fill.
- `formulaDataSource` does not persist absolute-reference (`$`) markers; use formula snapshots when they matter.

## Open Work
- [ ] Fix cold dependency chains overflowing the call stack, preserving cycle detection and lazy evaluation. Direct and stored-range references without IF use iterative traversal when no custom functions are registered; direct A1 ranges, IF and custom-function chains still need work.
- [x] Avoid exponential work when rewriting nested COUNTA calls for Excel export; regression added.
- [x] Reuse row and column lookups across formula cells during Excel export; preserve standalone and grouped export behavior.
- [x] Reuse row coordinates during formula drag-fill and undo, clearing cached data when DataView changes.
- [x] Avoid repeatedly scanning the expression when generating range reference placeholders.
- [x] Consolidate the five Formula Editor Cypress suites while preserving serial order. Vanilla Cypress passed; framework runs remain for CI.
- [x] Share formula string-literal decoding between evaluation and Excel export.
- [ ] **Final task:** Evaluate a separate calculated-columns package and identify utilities that could be shared with the formula plugin. The user wants two more optional packages: one for a Column Editor and one for code shared by the Formula Editor and Column Editor. Merge PR #2716 first and inform the user when this task is reached.
- [ ] Repo-wide (not formula-specific): every package publishes `/src`, including `src/__tests__` (about 260 KB unpacked for this package). Consider excluding tests from `files` across packages.

## Fast Verification
- `vitest run --config test/vitest.config.mts packages/formula-plugin packages/excel-export --coverage.enabled --coverage.include=packages/formula-plugin/src/**`
- `pnpm exec tsc --noEmit -p packages/formula-plugin/tsconfig.json`
- `pnpm cypress:ci --spec test/cypress/e2e/example48.cy.ts` (Vanilla demo served on port 8888)
- `pnpm run fallow:dead-code`
