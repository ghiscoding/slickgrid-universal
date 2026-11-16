# Formula plugin completion audit

Audited 2026-11-14 against the current working tree. This is an implementation plan, not a claim of completed support. The prior Chrome grouping reproduction and passing tests are recorded in `FORMULA_EDITOR_PROGRESS.md`; this audit did not rerun them. Competitor comparisons below refer to the documentation supplied in the conversation.

## Grouping implementation update

Grouped editing, stable range membership, drag-fill, formula-aware aggregation and mapped Excel export are implemented. Disjoint ranges use a helper worksheet, with direct `COUNTA` arguments translated to exclude blank source cells; LibreOffice recalculation verified this case. Formula snapshots preserve absolute flags through JSON. Custom Excel functions receive empty strings for blank helper cells, and omitted dependencies export as `#REF!`. Grid State/Preset integration remains a separate task. The original audit below is retained for context; its earlier descriptions of endpoint-only ranges and missing grouped export are historical.

## Hidden column audit update

Column letters and reference picking use the complete logical column order, including hidden columns. Drag-fill and reference outlines account for hidden columns; browser tests cover reordered, hidden and restored columns plus grouped and ungrouped Excel exports with `includeHidden` on and off. The older browser-gap notes below are retained as historical audit context.

## Grid State persistence update

The formula service provides versioned, atomic `getFormulaStoreSnapshot` / `setFormulaStoreSnapshot` APIs. Save formulas and dataset data separately alongside Grid State; preset restoration remains a grid responsibility. Restored formulas retain absolute flags and stable identities, and the service rewires formula columns when a layout replaces their definitions. Chrome and unit regressions cover grid recreation, hidden columns, grouping, ranges and absolute-reference fill. Earlier persistence audit statements below are historical.

## Custom editor and read-only update

Formula calculation and the existing formatter pipeline now remain active when a column uses a custom editor or automatic Formula Editor assignment is disabled. Custom editor commits synchronize the formula store; cell changes trigger a coalesced post-commit refresh. Column replacement and disposal preserve custom editors and formatting. Read-only cells are supported through `onBeforeEditCell`; formatter styling must reflect the application's own permission rule. Runtime custom-function autocomplete and registration behavior remain separate follow-up work. Earlier editor-lifecycle findings below are retained as historical context.

## Recommended release scope

Complete per-cell formulas, stable references, editing, drag-fill, persistence, and native Excel export, including grouping as requested. Treat calculated columns as a separate package. Do not make every competitor feature a release requirement.

Recommended semantics: references retain record identity when the view changes. Group headers and totals are structural rows, not formula data cells. Filtering/collapsing hides referenced records without deleting their values. Deleted records produce a reference error. These are recommended implementation defaults, not behavior already implemented.

## 1. Reference model and grouping — highest priority

**Evidence:** `formula.service.ts:getFormulaRowIds()` reads `getItems()`, whereas the grid editor picks displayed row indexes. The browser audit showed Oranges on displayed row 9 with `=C1*D1` in its editor. Evaluation still returned the right value. Stable ranges store only endpoint IDs. Absolute-reference flags are stored separately in an in-memory map.

**Implementation:**

- Introduce an internal reference representation separating record/column identities from display coordinates. Use one shared mapping for editor rendering, mouse selection, highlighting and drag-fill; use DataView displayed rows for UI coordinates and the complete dataset for evaluation. Do not globally replace `getItems()` with `getItem()` in evaluation.
- Keep structural row slots in the display map so A1 numbering matches screen coordinates. Reject picking group headers/totals; skip them when resolving data ranges. Show references to collapsed/filtered records explicitly rather than silently converting them into another visible reference.
- Preserve range membership and order at capture time. Endpoint IDs alone cannot preserve the original members after reorder. Evaluate a versioned range representation containing stable members or an equivalent compact representation. Avoid expanding large ranges without the existing size bound.
- Render contiguous members as A1 ranges; represent disjoint members without widening the range to include unrelated records. Preserve argument boundaries for `SUMIF`, `COUNTIF`, custom functions and multi-range operations: simply replacing a range by comma-separated arguments is not generally equivalent.
- Preserve absolute/relative metadata through conversion, reopening, persistence and fill. Define newly entered A1 formulas against the current view, while imported formulas should preferably use stable IDs. Existing endpoint-only ranges need an explicit migration/canonicalization policy.
- Keep calculations stable across collapse/expand and grouping changes, and invalidate cached display mappings when the view changes. Make memo invalidation explicit after data or formula changes.

**Done when:** tests cover grouping before and after service initialization, nested groups, totals rows, collapse/expand, sort/filter, cross-group and reversed ranges, disjoint members, deletion, numeric/string/custom row IDs, absolute markers and commit/reopen without changing the result. Browser tests must assert the referenced record and computed value, not just the presence of group rows.

## 2. Excel mapping and missing references — highest priority

**Evidence:** grouped export inserts a grouping column and group/totals rows; `getAllDataRowIds()` drops structural rows. An opt-in grouped position map supports FormulaService single-cell formulas and contiguous stable ranges, with `#REF!` for omitted, reordered or disjoint range dependencies. Providers that have not opted in remain on the previous export path.

**Implementation:**

- Verify missing-reference handling with grouped export and distinguish hidden records from deleted ones. Basic evaluation and formula conversion now preserve `#REF!` for missing stable IDs.
- Build actual worksheet row/column maps before emitting formulas, accounting for custom headers, preheaders, excluded/hidden columns, structural rows and skipped rows. Add optional mapping fields to `FormulaExcelExportContext`, preserving existing providers' contracts.
- Convert identities using those maps rather than a single global row offset. Do not enable grouped formula output by merely removing its guard.
- For referenced records omitted from export, use a documented policy: explicit `#REF!` or an opt-in export that includes dependencies. Never silently bind to a neighboring row.
- Disjoint stable ranges need an Excel-compatible representation preserving argument shape and order. Decide whether to use named/helper ranges or another documented strategy before claiming grouped range export support. Verify Excel compatibility of the chosen representation.
- Keep group-total parser callbacks and existing export metadata behavior intact. Verify CSV evaluated-value export separately.

**Done when:** workbook assertions cover grouped and nested-group formulas, collapsed dependencies, excluded columns, hidden-column inclusion, reordered columns, headers, custom functions, group totals and missing references. Compare exported formulas' targets with the actual worksheet cells, plus a real workbook calculation check where available.

## 3. Editor independence and lifecycle

**Confirmed code findings:** `autoAssignFormulaEditorToColumns()` exits for custom editor models and service-wide `autoAssignEditor: false`, skipping the formula formatter too. Runtime function registration updates the registry, while autocomplete names are captured during automatic editor assignment. Registration/removal does not explicitly reset the evaluation memo. `setOptions()` only merges options.

**Implementation:** separate formula evaluation wiring from editor assignment. Preserve custom editors and formatting while still displaying calculated values. Document read-only formula columns via existing edit cancellation and ensure editable markers follow the same policy. Refresh default autocomplete entries and invalidate calculations after function changes; retain explicitly supplied function lists. Define which options are dynamic and which require reinitialization.

**Done when:** custom editor and read-only columns still calculate; register/replace/remove custom functions update evaluation and suggestions; dispose restores original column definitions and removes handlers/styles; reinitialization creates no duplicates. Also test external data updates within the same task to detect stale memo results.

## 4. Persistence and Grid State/Preset integration

**Evidence:** formulas and absolute-reference flags live in separate service maps; no formula persistence hook was found in the inspected Grid State interface/service. Current formula get/set methods do not serialize the complete reference metadata.

**Implementation:** define a versioned, serializable formula snapshot covering cell identity, expression, stable range membership and absolute flags. Keep formula data persistence distinct from layout presets unless a documented optional integration is added. Restore after dataset and column identities exist; reject malformed snapshots and define missing-ID behavior. Preserve existing get/set APIs.

**Done when:** destroy/recreate and save/restore preserve results, `$` markers, ranges and subsequent drag-fill under different column order, grouping and filtering. Document the round trip with a runnable example.

## 5. Parser and function semantics

The registry contains the built-in names in the supplied AG Grid reference, plus `SUMPRODUCT` and `NA`; that is name coverage, not semantic equivalence. Existing tests now consistently expect `#VALUE!` for both ASCII and Unicode scalar-times-range shorthand. The old progress note about conflicting tests is historical.

**Required correctness audit:** quoted literals containing A1-like text, escaped IDs, error propagation, operator precedence, negative powers, lazy `IF` evaluation, coercion and blank handling, date arithmetic, wildcard criteria, argument counts and mismatched range dimensions. The evaluator still performs regex substitutions; test that strings cannot be interpreted as references or operators. Prefer shared token parsing if reproductions show inconsistencies.

**Compatibility additions:** consider `ABS`, `ROUND`, `MOD`, `SQRT`, aliases `RANDOM`/`RAN`/`CONCATENATE`, and distinct circular/parse errors. These are additive polish, not prerequisites for grouping. AG Grid additionally documents error tooltips and optional validation; our editor's `validate()` currently always succeeds. Treat validation and detailed error messages as separate work with explicit acceptance criteria.

## 6. Browser, framework and packaging completion

- Extend the current Example 48 suite with formula drag-fill (relative/absolute, filtered/grouped rows), range shrink/upward drag, fallback selection highlights, raw stable-reference entry, grouped export and persistence. Preserve serial suite state.
- Confirm hidden columns use consistent logical letters in headers, mouse selection and highlights. The current code uses full column lists in several paths, while selection APIs use visible indexes; verify this interaction instead of relying on successful numeric evaluation alone.
- Test overlapping references, clipped ranges, virtualization and cleanup. The current range CSS hash lets a later reference overwrite an earlier color on the same cell; document or improve that policy.
- Smoke-test Angular, React, Vue and Aurelia integration with the optional stylesheet. Current formula demo coverage is Vanilla; do not imply framework validation from that alone.
- Verify package exports, Sass customization, all five CSS builds, clean install/build and release-version alignment (`formula-plugin/package.json` currently says 10.9.0). Remove stale MVP claims and old example numbers from current-facing docs; retain historical audit entries as history.
- For every changed production TypeScript file, run all relevant focused specs with per-file 100% statement and line coverage. Run formatting, lint, TypeScript and dependency/circular checks when imports change. Browser and workbook assertions are necessary in addition to coverage.

## Deferred enhancements

Separate calculated-columns package; double-click fill to adjacent data boundary; row-number whole-row reference picking; colored per-reference handles; swapping autocomplete libraries; external formula data-source adapter; optional strict selection prerequisites. Evaluate these independently after correctness and persistence are stable.

## Delivery order

1. Lock down reference semantics with tests and implement the shared identity/display model.
2. Fix grouped editor selection/highlights, range membership and drag-fill.
3. Implement worksheet mappings and grouped formula export, including omitted dependencies.
4. Separate editor/evaluation lifecycle and finish persistence.
5. Close parser regressions, browser gaps, framework checks and release documentation.

AG Grid explicitly excludes grouping/tree data/aggregation in the supplied compatibility table; supporting grouping here goes beyond that comparison. Syncfusion's supplied docs do not define grouped range semantics. Neither is evidence that grouping can be solved by a simple offset adjustment.
