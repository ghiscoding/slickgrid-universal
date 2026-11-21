# Formula Editor Plugin Progress

## Handoff update (2026-11-20)
- Escape now closes an open autocomplete list without cancelling the formula edit; a second Escape still cancels through the existing editor lifecycle. Added lifecycle regression coverage; all 182 Formula Plugin tests pass with 100% statement and line coverage. Next: reset the editor exiting state after rejected validation.
- Ctrl/Cmd+C and Ctrl/Cmd+X now respect the editor text selection, including selections spanning styled reference tokens. With no selection they retain whole-formula behavior; cut restores the caret and refreshes tokens/highlights. Added clipboard regressions; all 182 Formula Plugin tests pass with 100% statement and line coverage. Next: Escape while autocomplete is open.
- Reference coloring now skips complete and unfinished quoted strings. One quote-aware token finder now drives editor spans, grid highlights, caret detection and single-reference replacement, while identifier boundaries also prevent partial matches such as `SUMA1`. Added editor/reference regressions; all 182 Formula Plugin tests pass with 100% statement and line coverage. Next: selected-text copy and cut behavior.
- A1-shaped custom functions such as `LOG10` and `A1` are no longer parsed, highlighted or drag-filled as cell references when followed by `(`. Bare `LOG10` remains a valid cell reference. Added editor, service, lazy-IF, export and drag-fill regressions; all 180 Formula Plugin tests pass with 100% statement and line coverage. Next: reference coloring inside strings and partial identifiers.
- Excel export now converts grid string literals to Excel syntax: single-quoted text becomes double-quoted text, quotes are doubled, Unicode and backslash escapes are decoded, and control characters use `CHAR(...)`. Quoted helper-sheet names remain unchanged. Added service and range regressions; all 177 Formula Plugin tests pass with 100% statement and line coverage. Next: custom function names that resemble A1 references.
- Filtered and paged grids now use displayed row numbers for editor A1 references, highlights and drag-fill, as grouped grids already did. References to hidden records keep their stable form and evaluation still uses dataset identities. Added a service regression and updated all five formula guides. Next: Excel export string-literal syntax.
- Second audit: added its findings to the checklist. Removed the unreachable top-level memo check and unused memo flag; all 174 Formula Plugin tests pass with 100% statement and line coverage, verifying the three earlier audit fixes below. `_evaluationMemo` and `resetEvaluationMemo()` remain as invalidation hooks for the planned render-pass cache.
- Formula store and evaluation memo keys now encode row and column IDs without delimiter collisions while retaining numeric/string ID equivalence. Added snapshot, evaluation and reference-flag regressions; unit tests and line coverage still need verification.
- Formula evaluations now memoize dependencies within each evaluation rather than across separate calls, so synchronous external changes and grouped recalculation see current data. Regression tests cover DataView updates and grouped totals; unit tests and line coverage remain to be verified.
- Implemented the first independent-audit fix: date arithmetic now coerces numeric text, booleans and blank references as spreadsheet-day offsets; numeric values minus dates use date serials. Added focused regressions, but unit tests and line coverage still need verification.
- Reviewed nested error expressions and date exports, corrected parenthesis handling in error-counting formulas and local-date addition across daylight-saving changes, and added regressions. Unit tests and production-source line coverage remain to be verified.
- Implemented corrections for referenced error cells in `COUNT`/`COUNTA`, arithmetic and `IF` coercion, numeric date serial conversion, and argument limits. Added regressions, including error expressions in `COUNT`/`COUNTA`; tests and coverage still need to be run, and date/export edge cases need review.
- Audited remaining coercion, date and function-argument behavior. Aggregates and concatenation now reject missing arguments; focused unit tests were added but still need to be run. The remaining gaps are tracked in the checklist.
- The user reports that all four framework wrappers and their Formula Editor Cypress suites passed in CI. The Aurelia Vite reload plugin ignores changes to non-module files such as Cypress downloads.
- Replicated the Formula Editor and function guides in all four framework documentation sets, linked them from the Excel export guides, and corrected the outdated `SUMIF` range description. Framework Example 59 covers Formula Editor; framework Example 48 covers the Hybrid Selection Model.
- Example 48 includes a separate formula grid without selection. Cypress verifies the prerequisite warning and CSS reference highlights and cleanup; all 48 Example 48 tests passed.
- Double-click fill was rejected as a product direction; retain drag-fill and do not treat double-click fill as remaining work.
- Formula autocomplete now ignores quoted text and replaces the complete function name when selecting a suggestion from its middle. All 47 Example 48 Cypress tests and 163 Formula Plugin unit tests passed.
- Installed the packed Formula Plugin in a fresh consumer with production dependencies from npm and no workspace overrides. The JavaScript, five CSS themes and Sass exports resolved successfully.
- Example 48 now tests reference highlighting across 80 restored rows: colors appear on virtualized rows and clear after cancel, including when those rows are rendered again. All 46 Cypress tests passed.
- Vanilla Example 48 passed all 45 Cypress tests against the watch server, including CSV, text comparisons, reference highlights and grouped workbook exports. LibreOffice recalculated the grouped `SUMPRODUCT` workbook to 57.0334 and returned `#VALUE!` for mismatched ranges.
- Formula Editor now calls the configured editor or column validator with the displayed formula text. Automatic syntax rejection remains disabled; calculation errors remain visible in cells.
- `COUNT` now counts valid JavaScript dates from direct values, cells, ranges, `NOW()` and `TODAY()`; invalid dates and referenced date strings remain excluded.
- Validated count-function argument counts: `COUNT` and `COUNTA` require an argument, and `COUNTBLANK` requires exactly one. All 160 Formula Plugin tests pass with full statement and line coverage for the changed function file.
- Packed the Formula Plugin and installed its tarball in an isolated offline consumer using local workspace overrides for its 11.0.0 dependencies; `FormulaService` and the default CSS export resolve. A registry-only clean install remains unverified.
- Consolidated lazy `IF` and `SUMIF` function-argument scanning in one parser, preserving quoted text and nested expressions.
- Added Example 48 browser assertions for clipped and overlapping reference highlights, cancel cleanup, range-endpoint dragging, and exported custom-function metadata. These additions and the existing grouped SUMPRODUCT regression still need a browser run against the Vanilla demo server; Example 48's 11 rows do not exercise row virtualization.
- Replaced the earlier unreliable selection-warning scenario with a separate, user-selectable fallback grid and passing browser coverage.
- Fixed mismatched `SUMIF` ranges to size `sum_range` from its first cell to the criteria range dimensions, storing the effective cells as stable references. Evaluation, snapshot restore after reorder, and Excel export are covered; all 160 Formula Plugin tests passed with 100% statement and line coverage for the changed production files.
- The earlier uncommitted work is now committed; the branch was clean at the start of this session.
- Aligned the formula package version with the monorepo's 11.0.0 version and corrected the package README's outdated evaluator description. A forced TypeScript build, all five Sass theme builds, custom Sass color compilation, public JS/CSS resolution, npm pack dry run, and all 150 formula plugin unit tests passed. The pnpm package build also passed; a clean install is still unverified. The grouped SUMPRODUCT browser regression still needs a running Vanilla demo server.
- `SUMIF` now follows Excel's mismatched-range sizing rule and preserves the effective sum cells through layout changes.
- Highlight review: overlapping cells use the later reference's color and edges, now documented and covered by a unit test. The hash clips to the data and visible columns; SlickGrid stores the hash independently of rendered rows and applies it during cell rendering. Editor destruction and service disposal remove the overlay. Browser validation of scrolling/virtualization and cleanup remains open.

Last updated: 2026-11-20
Branch context: feat/cell-formula-plugin

## Handoff and Validation (2026-11-17)
- Work remains uncommitted: the autocomplete/selection decisions and raw-reference Cypress test are combined with the `SUMPRODUCT` and grouped helper-range changes. Keep them together unless the user requests otherwise.
- The previous 40 Example 48 Cypress tests passed before the `SUMPRODUCT` changes. The newly added grouped `SUMPRODUCT` workbook test has not been run: the Vanilla server was not listening on port 8888. Ask the user to start their watch server if it remains unavailable; do not start a duplicate.
- After the `SUMPRODUCT` changes, 253 focused unit tests passed; changed production files had 100% statement and line coverage. Formula and Excel export TypeScript checks, focused lint, formatting, and the formula plugin source circular-dependency check passed.
- Preserve the user's preferences: group substantive work into each step, provide a concise commit title/description, avoid dev-only window globals in Cypress, and evaluate calculated columns last with advance notice. Only replace autocomplete if there is a demonstrated LOC or bundle-size benefit.
- Historical suggested work included browser validation, `SUMIF` dimensions and the semantics audit. The unchecked checklist below is authoritative, not the historical audit snapshots.

## Latest Update: SUMPRODUCT Range Dimensions (2026-11-16)
- `SUMPRODUCT` now requires matching range dimensions, returns `#VALUE!` for scalar/range or differently shaped arguments, and treats text and logical values in referenced ranges as zero.
- Disjoint Excel helper ranges preserve their original row and column shape, including when grouping or reordering changes their positions. Custom exporters using the optional helper callbacks should honor their new width argument.
- Mismatched `SUMIF` dimensions remain open: Excel extends or truncates the sum range from its starting cell, and a stable-reference implementation needs to preserve that behavior across layout changes.

## Latest Update: Editor Integration Audit (2026-11-16)
- Kept the existing formula autocomplete: the shared `autocompleter` requires an input or textarea with `value` and `selectionStart`, whereas Formula Editor uses a tokenized `contenteditable`. Adapting it would retain caret and token logic and add integration code; no LOC or bundle-size reduction has been established. Its installed minified module is approximately 6 KB (2.3 KB gzipped), though actual incremental bundle size depends on tree-shaking and other usage.
- Added Example 48 browser coverage for entering stable references and reopening/exporting them as A1 references. Autocomplete suggestions inside quoted strings and replacement from the middle of a function name remain possible improvements, but are deferred to avoid adding implementation complexity without a clear benefit.
- Keep selection prerequisites warning-only: formula evaluation and CSS reference highlights work without a selection model, and a new strict option has no demonstrated requirement. The historical browser audit below predates the current Example 48 tests; CSS fallback, warning behavior, range-endpoint dragging and workbook custom-function metadata still need direct browser coverage.

## Latest Update: Formula Errors and Function Arguments (2026-11-16)
- Circular references now return `#CIRCREF!`, malformed syntax returns `#PARSE!`, and missing references continue to return `#REF!`. Custom-function exceptions return `#ERROR!`; dependent formulas propagate these errors and unused IF branches stay unevaluated.
- Validated `IF`, `POWER`, `RAND` and its aliases, `NOW`, `TODAY` and `NA` argument counts. `POWER` and `^` now report zero-to-negative, zero-to-zero, invalid roots and overflow consistently.
- Added service, function and Example 48 regressions, including circular formula export. Excel receives the original formula and applies its own circular-reference behavior; the new diagnostic codes are grid-specific.

## Latest Update: Conditional Criteria (2026-11-16)
- `COUNTIF` and `SUMIF` now support case-insensitive text criteria, `*` and `?` wildcards, and `~` escapes without interpreting wildcard patterns as regular expressions. Text criteria preserve significant whitespace.
- Blank cell criteria are treated as zero, while empty-text criteria match blank and empty-text values. `SUMIF` ignores text and booleans in its sum range, and both functions validate their argument counts.
- Added unit, editor and Excel export coverage for criteria, including disjoint grouped helper ranges. LibreOffice recalculated the exported wildcard `SUMIF` and `COUNTIF` to 1.55 and 1. Mismatched `SUMIF` ranges and further mixed-type coercion remain open and are documented.

## Latest Update: Math Functions and Aliases (2026-11-16)
- Added `ABS`, `ROUND`, `MOD` and `SQRT`, including scalar argument validation, negative rounding and divisors, and spreadsheet error results. `ROUND` requires two arguments, matching Excel rather than Syncfusion's optional digits argument.
- Added `RANDOM` and `RAN` aliases for `RAND` and `CONCATENATE` for `CONCAT`. Excel export translates built-in aliases to native names, preserving quoted text and custom overrides.
- Added function, evaluator, autocomplete and workbook regressions. Broader function argument and coercion audits remain open.

## Latest Update: Grouped Excel COUNTA (2026-11-16)
- Disjoint range exports now allocate a deduplicated source-presence range for `COUNTA`, distinguishing a genuinely blank cell from a formula returning empty text without expanding large ranges into long worksheet formulas.
- The optional export callback preserves compatibility with custom exporters; when it is absent, source references are counted directly in chunks. Formulas exceeding Excel's length limit return `#REF!` rather than an invalid workbook formula.
- Added unit and Example 48 workbook regressions. LibreOffice recalculated an exported grouped workbook containing an empty-string formula, a blank cell and a numeric formula: `COUNTA` and `COUNTBLANK` both returned 2, and `AVERAGE` returned 5.

## Latest Update: Reference Types and Aggregates (2026-11-16)
- Preserve reference provenance and values during evaluation. Aggregate functions distinguish referenced text, booleans and blanks from direct arguments; numeric text is no longer silently converted when read from a cell.
- Distinguish a blank cell from a formula that returns empty text for single references and ranges. `COUNTA` and `COUNTBLANK` both count a formula-produced empty string; blank cells compare equal to zero or empty text.
- Custom functions receive unwrapped reference values, preserving numeric strings, booleans and formula-produced empty strings. Added tests for mixed values, direct versus range arguments, references inside expressions, nested formulas and Excel export.
- Follow-up: the grouped disjoint helper-range `COUNTA` discrepancy described in this audit was fixed in the update above.

## Latest Update: Blank Range Members (2026-11-16)
- Preserve blank range members as `null` instead of zero, including stable and disjoint ranges. Count functions can distinguish blanks from zero; average, median, min, max and product ignore blank values. An average with no values returns `#DIV/0!`.
- Custom functions now receive `null` for blank range members; Excel helper ranges supply empty strings instead. This representation is documented. More extensive reference-type, empty-formula and aggregate coercion semantics remain open.

## Latest Update: Numeric Addition (2026-11-16)
- Arithmetic addition converts numeric text and booleans to numbers and returns `#VALUE!` for nonnumeric or empty text; `&` remains the text concatenation operator. Added evaluation and Excel export regressions.
- Blank cell references are currently substituted with zero before function evaluation; preserve and audit blank/reference types separately for aggregate and custom functions.

## Latest Update: Operator Precedence (2026-11-16)
- Aligned unary negation and chained exponentiation with Excel's operator precedence and left-to-right evaluation; parentheses still override the default order.
- Added evaluation and export regressions for powers, negative exponents, percentages, references and mixed operators. Other formula semantics remain open for audit.

## Latest Update: Runtime Custom Functions (2026-11-16)
- Registering, replacing and removing a custom function invalidates cached evaluations and schedules a coalesced grid refresh. Default Formula Editor autocomplete reads the live registry; an explicit suggestion list remains unchanged.
- Added unit coverage for changing functions while an editor is open and for cached results. Example 48 exposes controls to remove and register CUSTOMSUM, with a UI-driven browser regression.

## Latest Update: IF Branches and Error Propagation (2026-11-16)
- Built-in IF defers evaluation of its selected branch, so references, circular dependencies and custom functions in an unused branch do not execute. Custom overrides of IF retain their existing behavior.
- Errors produced while evaluating function arguments now propagate instead of being passed to aggregate or custom functions. Stored formula references are evaluated even when the dataset field contains a plain value. Added tests for nested conditions, errors, missing references, side effects, custom overrides and circular references.
- The parser checks syntax in both branches without executing them, including invalid arithmetic expressions and numeric literals. Broader parser semantics remain open.

## Latest Update: Quoted Formula Text (2026-11-16)
- Reference resolution, comparison normalization, Unicode operator normalization and unsafe-syntax checks now leave quoted text intact, including text produced by referenced cells and ranges.
- Formula strings support doubled quote characters, escaped control characters and Unicode escapes; unterminated quoted strings return `#ERROR!`. Quoted long-form numeric references are no longer converted as formulas.
- Added unit regressions for quoted references and operators, escaped row/column IDs, exported text and dependent errors; the broader parser semantics audit remains open. Example 48 includes a browser regression for quoted references and Unicode operators.

## Latest Update: Example 48 CI Test Portability (2026-11-16)
- Replaced Cypress access to a development-only view-model name with demo controls for hidden-column export, grid/formula save and restore, and formula editor mode. The same UI-driven tests work without relying on a framework-specific global.
- The demo no longer duplicates FormulaService cell-change synchronization, so its custom-editor test exercises the service itself. The clipboard test accesses the browser clipboard through the document.

## Latest Update: Formula Evaluation with Custom and Read-only Editors (2026-11-14)
- Formula-enabled columns now evaluate through the existing formatter pipeline even with a custom editor or `autoAssignEditor: false`. Explicit FormulaCellEditor configuration remains supported.
- Custom editor commits synchronize formula strings or plain values with the formula store. Cell changes clear evaluation memoization and coalesce a post-commit refresh so dependent cells and grouped totals update; pending refreshes are canceled on disposal.
- Column layout updates preserve the selected editor and avoid duplicate formatter wrapping. Disposal restores original formatters without discarding a later custom-editor change.
- Added unit and Example 48 browser coverage for custom editor commits, formatter pipelines, read-only edit cancellation, row-specific editor metadata and lifecycle cleanup.

## Latest Update: Grid State and Formula Store Persistence (2026-11-14)
- Added versioned bulk formula-store snapshots that retain row/column identities, stable ranges and absolute flags. Restore validates the entire snapshot before replacing the store and leaves dataset fields unchanged; missing identities remain recoverable and restored formulas take precedence over stale dataset formula strings.
- Grid State remains layout/view state. Save it, formula snapshots and the dataset separately; apply presets and initialize data before restoring formulas. Regular grouping requires separate restoration.
- FormulaService now reattaches its formatter/editor to replacement column definitions before `setColumns`, fixing `applyColumnLayout` displaying raw formulas; already prepared columns are not wrapped twice and the event is unsubscribed on dispose.
- Example 48 uses its save/restore controls to apply presets during grid construction, restores hidden columns and formulas, checks absolute-reference drag-fill after grouping, and inspects exported source values in both grouped and ungrouped workbooks. Chrome: 29 tests passed. Unit tests cover snapshot validation and 100% statement/line coverage for the changed service.

## Latest Update: Hidden Columns and Formula References (2026-11-14)
- Formula letters use the full logical column order, including hidden columns. Reordering, hiding and showing preserve stable references; selecting a visible cell uses its logical letter, and ranges include hidden members.
- Fixed drag-fill to use logical column indexes and skip hidden destinations. Horizontal numeric series continue across visible cells. Reference range borders use visible endpoints when boundary columns are hidden.
- Browser checks cover reordered headers, reference selection/highlighting, fill, hiding/showing and Excel export with and without `includeHidden`, both grouped and ungrouped. Omitted dependencies export `#REF!`.

## Latest Update: Grouped Range Editing and Export (2026-11-14)
- Stable `REFRANGE` members preserve record and column identity and argument boundaries through grouping and reordering; structural rows are skipped. Grouped ranges support editing, highlights, collapse/expand and drag-fill. Hidden references retain stable identities; expand groups to shift them by displayed position.
- `createGroupingAggregator` lets normal grouping formatters display evaluated formula totals. Example 48 uses it for formula columns.
- Grouped Excel export maps actual worksheet positions and uses a Formula References helper sheet for disjoint ranges. Missing export dependencies produce `#REF!`. Direct `COUNTA` helper arguments are translated to `SUMPRODUCT` to exclude blanks; a LibreOffice recalculation returned 3 for zero, false, text, blank and empty-string cells (plain helper `COUNTA` returned 5).
- Chrome Example 48: 26 tests passed after the helper blank-handling change. Scoped formula and Excel unit tests passed with 100% statement and line coverage for the changed production sources; targeted lint, formatting, TypeScript and formula-plugin circular-dependency checks passed.
- `getFormulaSnapshot` and `setFormulaSnapshot` preserve stable formulas and absolute-reference flags across JSON round trips. General Grid State/Preset integration remains a separate checklist item.

The earlier updates below are historical snapshots; this update supersedes their statements that grouped ranges and export are unsupported.

## Latest Update: Contiguous Grouped Range Export (2026-11-14)
- Grouped Excel export now maps stable ranges when every underlying data row and column remains adjacent and in the same order in the worksheet. Split, reordered or omitted range members produce `#REF!` rather than a formula that includes unrelated rows or totals.
- Added unit coverage for reversed and rectangular ranges, missing and reordered members, and quoted text; Example 48 verifies both contiguous and split grouped ranges in the exported workbook. Grouped range editing and drag-fill remain unsupported.

## Latest Update: Grouped Single-Cell Drag-Fill (2026-11-14)
- Drag-fill now shifts single-cell formulas using displayed grouped rows, stores stable row IDs and retains absolute markers. Group headers and totals are skipped as targets.
- Grouped formulas with ranges or references hidden by collapsed groups are skipped during fill until their translation is supported; this avoids silently writing a formula with different targets.
- Added unit regressions for crossing structural rows, absolute references and unsupported sources, plus an Example 48 browser regression.

## Latest Update: Grouped Excel Single-Cell References (2026-11-14)
- Grouped Excel export maps data-row IDs to actual worksheet rows and accounts for the leading grouping column when the formula provider supports grouped mapping.
- FormulaService exports supported single-cell references with relative/absolute markers and returns `#REF!` for omitted dependencies. Grouped range formulas remain on the existing export path until their membership semantics are implemented.
- Added service and export unit regressions plus Example 48 workbook assertions for rows in both groups. Grouped ranges and drag-fill remain open.

## Latest Update: Grouped Single-Cell References (2026-11-14)
- The editor maps stored single-cell references to visible grouped row positions and converts entered references back to stable row IDs. Group headers and totals cannot resolve to data IDs.
- A reference hidden by a collapsed group remains in stable `REF` form in the editor instead of being treated as deleted. The existing ungrouped evaluation mapping is retained.
- Added service regressions for grouping, structural rows, collapse/expand, and returning to the ungrouped view. Grouped ranges, drag-fill and grouped Excel export remain unsupported and require separate work.

## Current Completion Plan
See [FORMULA_COMPLETION_PLAN.md](./FORMULA_COMPLETION_PLAN.md) for the prioritized audit, proposed reference semantics, implementation approach and acceptance criteria. Historical notes below are not evidence that outstanding integration paths have been verified.

## Latest Update: Missing Stable References (2026-11-14)
- Missing row or column IDs now translate to `#REF!` instead of disappearing from formulas. Evaluation propagates the error and Excel conversion retains it; quoted text containing `#REF!` is unaffected.
- Added regressions for row reorder, deleted references, missing range endpoints and Excel conversion. Grouped row mapping and range membership remain open.

The former scalar-times-range test conflict is resolved in current tests: both `*` and `×` expect `#VALUE!`; broader semantic parity remains open.

## Grouping Audit (2026-11-14)
- Reproduced in Example 48: after grouping, Oranges is displayed on grid row 9, but reopening its Sub-Total shows `=C1*D1`; row 1 is a group header. The calculated value remains correct because evaluation uses dataset row IDs, while editor reference selection and highlights use visible grid row indexes.
- Grouping can reorder records and insert headers and totals. Mapping only the two endpoints of a range can silently change which records it evaluates when grouping or sorting changes; range membership semantics need a decision before implementing the mapping.
- Grouped Excel export currently skips the formula provider, and adds a leading grouping column plus group/totals rows. Correct export needs an explicit mapping of stored identities to actual worksheet coordinates, including collapsed or otherwise omitted rows.
- Comparison: [Syncfusion's formula editor documentation](https://help.syncfusion.com/grid-sdk/javascript/data-grid/formula/formula-editor) describes A1 display and reference highlighting, but does not specify range membership after grouping or sorting; do not infer that behavior from the screenshot.
- Syncfusion's custom-function example uses `customFunctions.NAME.func({ values })` and runtime registration/removal. FormulaService already supports that callback shape, flattened range values, and runtime registration/removal with its own method names; this does not resolve grouped-range semantics.
- AG Grid's supplied v36.3.0 documentation explicitly lists tree data, row grouping, pivoting, and aggregation as unsupported for formulas, so it does not provide a grouped-reference model to copy.
- The formula-service documentation now explicitly describes the grouped editing and Excel-export limitations until they are resolved.
- Added a browser regression for calculated values through grouping and ungrouping. Full grouped editing, range semantics, collapse/expand, drag-fill and grouped formula export remain open.

## Latest Update: Formula Range Highlighting (2026-11-14)
- Reference ranges now draw only their outside edges, including reversed and grid-clipped ranges, using the same shared highlight hash for the editor and service.
- Highlighted Salesforce editable-field wrappers are transparent so their borders and backgrounds do not obscure the range tint; formula editor text no longer inherits italic styling.
- Added unit coverage for range edges and Cypress assertions for contiguous highlights. Existing selection handles retain their current behavior.

## Latest Update: Dark Formula Styling (2026-11-14)
- Dark grids now use the dark token colors for formula references and their matching cell outlines, the 20% dark token backgrounds for referenced cells, and the dark Excel column-prefix colors.
- Preserved the existing six-color cycle, Sass variables, and light theme behavior. The separate 80% reference-cell backgrounds and colors 7–10 remain unused pending a palette change.
- Example 48 Cypress checks the token, cell, and header colors across light → dark → light; all 18 tests passed in Chrome.

## Dark Theme Investigation (2026-11-14)
- Chrome inspection of Example 48 confirmed that formula tokens, reference outlines/backgrounds, and Excel column badges use the same light-theme colors in both modes. The editor background switches to `#111827`; token colors 1 and 2 have contrast ratios of about 3.36:1 and 3.21:1 against it.
- The dark token and badge Sass variables are declared but not consumed. Using dark token colors 1 and 2 against that background would give approximately 8.49:1 and 8.79:1 respectively; validate the complete palette and matching reference outlines in the browser before choosing final values.
- Reference cell backgrounds currently use token background variables (5% opacity in light mode). The separate ref-cell background variables are unused and their dark defaults have 80% opacity, so do not apply them blindly to cells with light text.
- Colors 7–10 currently repeat colors 1–4 in the stylesheet; the separately declared values for 7–10 are unused. Decide whether to preserve that cycling or adopt ten distinct colors consistently for tokens and referenced cells.
- Follow-up: evaluate a larger distinct palette and the separate reference-cell background variables if design requirements change.

## Latest Update: Pointer Guard Coverage (2026-11-14)
- Added editor regressions for right-clicks, mouse movement outside a reference drag, and clicks that must pass through, including clicks outside the grid during suppression.
- The focused FormulaCellEditor coverage run reports 100% statements and lines.

## Open Work and Decisions

This checklist is the authoritative list of remaining work and decisions, including deferred enhancements. Checked items record completed work; historical notes elsewhere are not additional tasks. Keep an item unchecked until its implementation and required validation are complete.

- [x] Audit unused dark-theme SASS variables and apply the useful dark palette; retain the other variables for compatibility.
- [x] Support grouping and grouping formatters, including reference mapping when group rows change offsets and grouped Excel export. Custom Excel functions receive empty strings for blank helper cells; collapsed or excluded export dependencies produce `#REF!`.
- [x] Audit Grid State/Preset behavior and support saving/restoring formula references and data alongside Grid State.
- [x] Verify and document hidden-column behavior, including editor A1 numbering, reference selection, drag-fill and Excel export when a referenced column is excluded.
- [x] Keep formula results and default autocomplete suggestions current when custom functions are registered, replaced or removed; preserve explicitly configured suggestion lists.
- [x] Preserve quoted references and operators, escaped IDs and quoted text from referenced cells during evaluation and export.
- [x] Evaluate only the selected built-in `IF` branch and propagate errors from evaluated function arguments; validate both branches without executing the unused one.
- [x] Resolve the conflicting scalar-times-range expectations: both `*` and `×` now return `#VALUE!`.
- [x] Support dragging the fill handle to copy formulas into a selected target range, adjusting relative references and preserving absolute references.
- [x] Evaluate double-click fill: do not implement it; retain drag-fill as the supported fill interaction.
- [x] Evaluate the existing autocompleter: retain the current contenteditable implementation because an adapter has no demonstrated LOC or bundle-size benefit.
- [x] Add and validate browser coverage for selection-model CSS fallback and prerequisite warnings using a separate Example 48 grid without selection.
- [x] Run Example 48 assertions for case-insensitive text comparisons, range-endpoint dragging, clipped and overlapping highlights, cancel cleanup and exported custom-function metadata.
- [x] Run the grouped `SUMPRODUCT` Example 48 browser/workbook regression and verify its exported workbook calculation in LibreOffice.
- [x] Verify CSV/text export of evaluated formula values with grouped and ungrouped integration tests. With formatters disabled, export retains the raw dataset value.
- [x] Add a CSV export control to Example 48 and document the formatter requirement.
- [x] Run the Example 48 grouped and ungrouped CSV browser assertions against the Vanilla demo server.
- [x] Validate reference highlights during scrolling and row virtualization, including cleanup, using an enlarged Example 48 dataset.
- [x] Audit and align operator precedence and negative powers with Excel.
- [x] Fix arithmetic addition of numeric and nonnumeric text; retain `&` for concatenation.
- [x] Preserve blank members in ranges for counting and aggregate functions, including stable references.
- [x] Preserve single-cell and range reference types and formula-produced empty strings for `SUM`, `PRODUCT`, `MIN`, `MAX`, `AVERAGE`, `MEDIAN`, `COUNT`, `COUNTA`, and `COUNTBLANK`.
- [x] Fix grouped disjoint Excel `COUNTA` export for formulas returning empty text while still excluding truly blank source cells.
- [x] Add wildcard, escape, case-insensitive and blank criteria handling to `COUNTIF` and `SUMIF`; ignore nonnumeric sum-range values and validate their argument counts.
- [x] Validate `SUMPRODUCT` range dimensions and preserve two-dimensional grouped Excel helper ranges.
- [x] Correct number-versus-text comparison and uppercase logical values in `&` concatenation; cover both with unit tests.
- [x] Report arithmetic and function overflow as `#NUM!` without masking division-by-zero errors, and render logical values consistently in `CONCAT`/`CONCATENATE`.
- [x] Match Excel `SUMIF` behavior for mismatched ranges by sizing `sum_range` from its first cell to the criteria range dimensions; preserve expanded cells through layout changes, snapshots and Excel export.
- [x] Audit and correct comparisons between logical, numeric and text values, including chained comparisons and blank references. Logical values remain numeric in arithmetic.
- [x] Validate required argument counts for `COUNT`, `COUNTA` and `COUNTBLANK`.
- [x] Count valid date values in `COUNT`, including references and date-function results.
- [x] Audit remaining operator and conditional-function coercion, dates and function argument counts; identify the remaining gaps below.
- [x] Implement the initial audited fixes for error values in `COUNT`/`COUNTA`, `IF` and arithmetic text coercion, numeric Excel 1900 date serials, and function argument limits; add regression tests.
- [x] Review nested error expressions and date/export edge cases; correct the issues found and add regressions.
- [x] Consolidate argument, quote and nesting scans shared by lazy `IF` evaluation and `SUMIF` range normalization; preserve existing parsing behavior and coverage.
- [x] Smoke-test formula integration and the optional stylesheet in all framework demos; all four framework Cypress suites passed in CI.
- [x] Complete the pnpm formula-plugin package build; package exports, custom Sass, five theme builds and version alignment are verified.
- [x] Install the packed Formula Plugin in an isolated offline consumer with local workspace overrides; verify JavaScript and CSS exports resolve.
- [x] Verify a clean install of the packed Formula Plugin with production dependencies from npm and no workspace overrides; resolve JavaScript, CSS and Sass exports.
- [x] Review current-facing documentation for stale MVP claims and demo references; update the formula guides and all four framework export guides to point to Vanilla Example 48.
- [x] Complete final validation for changed files, including the formula coercion, error, and date/export regressions: the user reports successful CI and 100% unit-test line coverage.
- [x] Complete an independent audit of the Formula Editor feature and review its findings.
- [ ] Fix the independent audit findings and validate each fix and its coverage:
  - [x] Implement date arithmetic coercion for numeric text, booleans and blank references; add regressions.
  - [x] Prevent stale memoized results after synchronous external data updates; add DataView and grouped-total regressions.
  - [x] Prevent formula-store key collisions for row and column IDs containing `::`; add snapshot and evaluation regressions.
  - [ ] Dataset synchronization can retain formulas after their source cells become plain values.
  - [ ] Literal text resembling a formula error is treated as an error.
  - [ ] `COUNT` and `COUNTA` can swallow structurally missing A1 references.
  - [ ] `MIN` and `MAX` can overflow the call stack for multiple large ranges.
  - [ ] Numeric literals in scientific notation are rejected.
  - [ ] Drag-fill clamps references that cross the first row or column instead of returning `#REF!`.
- [ ] Fix the second audit findings (2026-11-20), committing and validating each separately:
  - [x] Remove the unreachable top-level memo check and unused memo flag left by per-evaluation memoization; restore 100% line coverage.
  - [x] Filtered or paged ungrouped grids map editor A1 rows, highlights and evaluation through unfiltered dataset order instead of displayed rows.
  - [x] Excel export emits single-quoted strings and backslash escapes verbatim; convert string literals to Excel's doubled-quote syntax.
  - [x] Custom function names resembling A1 references (for example `LOG10`) are evaluated as cell references.
  - [x] Editor reference coloring and highlights match text inside quoted strings and partial identifiers (for example `SUMA1`).
  - [x] Ctrl/Cmd+C and Ctrl/Cmd+X ignore the text selection and copy or clear the whole formula.
  - [x] Escape with the autocomplete open also cancels the edit.
  - [ ] A failed commit validation leaves the editor in its exiting state, disabling reference picking.
  - [ ] Evaluation re-resolves dependencies per cell (O(n²) for chained formulas), scans the dataset for each row lookup and rebuilds the function registry per evaluation.
  - [ ] Volatile `RAND`, `NOW` and `TODAY` recalculate on every cell render.
  - [ ] `PRODUCT` with no numeric values returns 1 instead of 0; `COUNTA("")` returns 0 instead of 1.
  - [ ] Editor DOM re-rendering breaks IME composition and browser undo; paste processes input twice.
  - [ ] Dates in `&`/`CONCAT` render as JavaScript date strings; invalid custom function names are silently ignored; autocomplete lacks ARIA attributes; drag-fill ignores read-only cells and undo.
- [ ] Evaluate AG Grid parity: an opt-in `validateFormulas` editor param and formula error tooltips.
- [x] Evaluate editor validation: support editor and column validators and their messages; retain calculation errors in cells instead of automatically blocking formula input.
- [ ] Deferred: evaluate these possible enhancements separately:
  - [ ] Whole-row reference picking, such as selecting a row number to insert a reference to the entire row.
  - [ ] Whole-column drag-handle expansion; first define the interaction and which rows it would include. Double-click fill remains rejected.
  - [ ] Colored handles for directly resizing individual formula-reference outlines.
  - [ ] An external formula data-source adapter, including how it handles missing data, updates and Excel export.
- [x] Prevent autocomplete inside quoted strings and replace the complete function name when selecting from its middle.
- [x] Compare Syncfusion's formula reference and add `ABS`, `ROUND`, `MOD`, `SQRT`, and the `RANDOM`, `RAN`, and `CONCATENATE` aliases, with Excel export translation.
- [x] Distinguish `#CIRCREF!`, `#PARSE!`, missing references and custom-function failures; document Excel export behavior.
- [x] Validate fixed argument counts for `IF`, `POWER`, random/date functions and `NA`; align `POWER` and `^` error results.
- [x] Support custom and read-only formula columns independently of Formula Editor; document and test `onBeforeEditCell` cancellation.
- [x] Decide whether an optional strict selection-prerequisite mode is needed: retain warning-only behavior and CSS fallback.
- [x] Replicate the Formula Editor and function guides in all four framework documentation sets.
- [x] Replicate Vanilla Example 48 to all framework wrappers as Example 59, with corresponding Cypress coverage; all four suites passed in CI.
- [ ] **Second-to-last task:** Audit the whole Formula Plugin for performance, DRY and lines of code, and reduce LOC where possible without losing behavior or coverage. This includes the large `slick-formula.scss` stylesheet, plus duplicated quote/reference scanners and A1/reference regex patterns across the service, range, drag-fill and editor modules. We should also audit the feature, are we covering more than Ag-Grid/SyncFusion? If so then maybe decrease the scope a bit.
- [ ] **Final task:** Evaluate a separate calculated-columns package and identify utilities that could be shared with the formula plugin. Inform the user when this task is reached. The user wants to create 2 more optional packages, 1 package for Column Editor and 1 package for the common code between Formula Editor and Column Editor. We should probably merge the current Formula Editor feature PR before running this task.

## Latest Update: Optional Package Styling (2026-11-14)
- Moved Formula Editor, reference color, and Excel column-prefix CSS from the common theme into the formula plugin, preserving shared theme variables.
- Added standalone Sass and theme-specific CSS builds, a Vanilla demo import, and installation instructions.

## Latest Update: Multi-Selection Preservation and Highlight Cleanup (2026-08-26)
- FormulaCellEditor now snapshots existing cell/row selection ranges before applying its temporary active-reference range and restores them when the temporary highlight is cleared or the editor closes.
- FormulaCellEditor and FormulaService now share one reference-to-cell CSS hash builder and one aggregate highlight overlay key; the editor owns open-time highlighting without a demo-level pre-render hook.
- Removed obsolete editor highlight keys, the unused selection-color lookup, and numbered `formula-ref-highlight-*` cleanup.
- Formula colors are now cleared on every editor destroy path, including non-keyboard teardown.
- Added regressions for restoring multiple ranges, aggregating more than ten colored references, numeric column IDs, and non-keyboard cleanup.

## Latest Update: Formula Editor Cell Sizing (2026-08-22)
- Consolidated `.formula-editor-input` cell sizing and AG Grid-style single-line editor behavior into `slick-editors.scss` alongside the native text editors.
- Set the contenteditable formula editor to `border-box` and removed its fixed minimum height so it stays within the cell like native text editors.
- Vertically centered formula text and colored reference tokens within the cell editor.
- Kept the formula editor as a direct contenteditable element with standard hidden-scrollbar behavior and no ellipsis, keeping formula tokens as direct editor children.
- Centered the direct formula text and token items within the full-height contenteditable editor.
- Simplified the formula editor overflow declaration to the two-value shorthand.
- Handled HOME and END explicitly so caret movement crosses colored formula-token spans.
- Made Ctrl/Cmd+Arrow navigation move across complete colored reference-token sections.
- Kept token navigation compatible with ES2021 by avoiding `Array.prototype.at()`.
- Centralized repeated keyboard event suppression in a small editor helper while preserving Ctrl/Cmd+A browser selection behavior.

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
- Initial editor load applies persistent reference colors through the shared aggregate overlay.
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

Historical open items at the time of this review (see the authoritative checklist above for current status):
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

### Historical Cypress Coverage Audit (2026-08-21)

The Example 47 Cypress spec now covers formula editing and persistence, reference insertion with autocomplete, token/grid colors, incomplete references, clipboard text, formula evaluation, custom-function cell behavior, numeric static-value series inference, runtime stability after column reorder/hide, and reordered Excel formulas with the dataset row offset.

The Example 47 Cypress suite is passing with the prescribed `pnpm cypress:ci --spec test/cypress/e2e/example47.cy.ts` command.

The following implemented paths remain covered by unit tests but do not yet have direct Cypress coverage: caret-aware reference detection and range endpoint drag expansion, CSS fallback highlighting without a compatible selection model, prerequisite warning behavior, raw `REF(COLUMN(),ROW())` entry, hidden-column-inclusive Excel export, absolute/relative formula translation through the drag handle, workbook defined-name/custom-function assertions, and grouping-specific formula behavior.

## Known Constraints / Notes
- Security audit follow-up: formula reference expansion is bounded, highlight dictionaries use null-prototype objects, and formula/drag-fill writes safely handle a `__proto__` field.
- Without a cell-capable selection model, range visuals fall back to CSS highlighting only.
- TreeDataService-style hard throw was intentionally not used for formula selection prerequisites; behavior is warning-only to avoid breaking existing grids.
- Grouping and Grouping Formatter integration is currently a known limitation for FormulaService and grouped formula export.
- Series inference currently covers AG Grid's common default path only; modifier-key toggles, custom fill callbacks and range-reduction clearing were identified as possible follow-ups. Double-click fill was later rejected.
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

## Historical Suggested Next Items
- Add optional strict mode in FormulaService to throw (instead of warn) when full selection prerequisites are required by product requirements.
- Add higher-level coverage for whole-column drag-handle expansion and calculated-column behavior.
