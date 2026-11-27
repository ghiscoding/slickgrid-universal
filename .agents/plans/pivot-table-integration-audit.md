# Pivot Table: integration audit and follow-up plan

> **Status:** In progress / draft PR. This is a handoff for resuming Pivot work, not a claim that every behavior below is complete.
>
> **Upstream:** [SlickGrid PR #1334](https://github.com/6pac/SlickGrid/pull/1334). Recheck upstream before porting further changes.
>
> **Primary example:** `demos/vanilla/src/examples/example48.ts` and `example48.html`. The intended interactive model follows upstream `examples/example-pivot-panel.html`; the Access/crosstab and inline examples are references, not additional integration requirements.

## Goals and constraints

- Pivot remains a **separate optional package / external resource**. Applications that do not import it should not pay for its engine or UI. Generic core hooks may support resources without importing Pivot.
- Create a normal grid with the application's `columns`, `gridOptions`, and `dataset`; explicitly register the pivot resources through `externalResources`. Framework wrappers must not require a `SlickPivot.getGridOptions()` wrapper around grid construction.
- Pivot Mode operates on the **same application-owned grid**. Do not reintroduce `SlickPivotTable`, a second grid for the main data, or a wrapper on top of framework wrappers. Preserve the separate sidebar.
- Respect existing grid services, extensions, translations, events, lifecycle, Grid State, and Presets. Define their behavior with generated columns and aggregate rows.

## Current implementation snapshot

- `SlickPivot` and `SlickPivotFieldList` are separate resources. The latter mounts the sidebar and optional toolbar, status bar, and details dialog around the host grid.
- The generic `ExternalResource.prepareGridOptions` hook prepares pre-header infrastructure before grid creation. Example 48 configures `pivotMode: true` and derives fields from ordinary columns with Pivot-specific overrides. Initial activation is deferred by a microtask so synchronous Vanilla resource initialization can finish. Verify lifecycle and cleanup, including resources registered after grid creation.
- Local DataView sources currently use `getItems()`, so ordinary DataView filtering does not automatically limit pivot inputs. Pivot hides the source filter row while active and restores its prior visibility on exit or disposal.
- Keep the built-in drill-down dialog for now. It creates a separate basic SlickGrid, not a Vanilla bundle or framework wrapper. `details: false` leaves the drill-down event available for application-owned UI.
- GridMenu and ColumnPicker synchronize with generated columns. Example 48 Cypress passed 37 tests, including picker visibility, Clear all Pinning, source pinning restoration, source filters, and RTL.
- The default footer now omits computation time. `PivotResult.duration` remains available to a custom status formatter. Toolbar labels and status text are configurable, while automatic integration with Universal's translation service remains to be investigated.
- Vanilla integration tests verify that deferred activation is cancelled when the bundle is disposed, that disposing Pivot restores the source DataView and columns while leaving GridMenu registered, and that DataView additions recompute the pivot and remain available after switching back. Further lifecycle and source-state scenarios remain open.
- Vanilla integration tests also cover adding, updating, deleting, and replacing DataView items while pivoting, deriving a changed source-column caption on the next mode switch, and aborting an in-flight provider request when Pivot is disposed.
- Pivot Mode aborts an in-flight provider request on exit and requests fresh data on re-entry. A Vanilla integration test verifies that an older response cannot replace the newer result.
- Source DataView notifications invalidate the cached result immediately. A Vanilla integration test covers re-enabling Pivot before the delayed source refresh runs.
- A Vanilla bundle integration test verifies that a successful editor-lock commit updates the source before Pivot calculates its result. The test simulates the editor lock, so actual editor interaction still needs browser verification.
- The Pivot row model exposes selected Pivot row IDs for Grid State. A Vanilla integration test verifies Pivot selection, source selection restoration, and hidden source-column state through a mode round trip. Pivot and source IDs remain separate.
- Vanilla selection coverage includes source rows being reordered or a selected source record being deleted while Pivot Mode is active.
- Vanilla integration coverage also verifies source column order, width and sort indicators after a mode round trip. ContextMenu usability callbacks receive the displayed Pivot row in Pivot Mode and the source record after returning to ordinary mode. Example 48 Cypress verifies source column pinning restoration and hiding or restoring a Pivot column through GridMenu and ColumnPicker.
- The focused Pivot unit suite now reports 100% line and statement coverage across the package. Branch coverage remains informational.
- An isolated esbuild browser bundle of `SlickGrid` using the built common package contained no Pivot inputs. Adding `SlickPivot` and `SlickPivotFieldList` from Pivot source increased minified JavaScript by 189,701 bytes and gzip by 48,535 bytes. This measurement excludes CSS and represents the tested build, not every application's final bundle.
- Excel and text export work is deferred. Existing export services retain the source DataView while the grid displays generated Pivot columns. Future source-data export must use matching source columns. Native Excel PivotTable export depends on future support in `excel-builder-vanilla`.
- Master was merged in `b252f17f4`. The subsequent Pivot initialization and footer changes should be checked with `git status` before resuming or committing.

## Upstream feedback and Universal follow-up

### 1. Pre-header preparation and normal grid construction

- [x] Verify `prepareGridOptions` runs before grid creation for resource instances in Vanilla without importing Pivot into core.
- [ ] Verify the pre-creation hook in the framework wrappers after Vanilla is complete.
- [x] Document pre-header preparation order and verify that Pivot preserves an application-specified height in Vanilla.
- [ ] Verify pre-header ownership across multiple resources with conflicting requirements.
- [x] Correct Pivot JSDoc and the missing-pre-header warning to use ordinary grid options for direct SlickGrid usage.
- [ ] Reconsider the fork separately: `grid.registerPlugin()` normally runs after grid construction, so the Universal hook is not automatically a direct upstream patch.

### 2. Host grid options, columns, and initial layout

- [x] Keep ordinary columns, grid options, and dataset as the primary configuration. Document and test host `pivotOptions` precedence over constructor options.
- [x] Derive field IDs and captions from host columns and allow Pivot-specific field overrides.
- [x] Derive supported numeric, date, boolean, and string types from column definitions and honor explicit Pivot overrides.
- [ ] Review remaining type formats and overrides for hierarchies, calculated fields, formatting, aggregation restrictions, getters/setters, and write-back.
- [ ] Verify updated source columns, hidden columns, translated captions, and datasets do not leave stale or duplicate field schemas.

### 3. Initialization, pre-header ownership, and teardown

- [x] Remove the manual post-initialization `setPivotMode(true)` call from the initial Vanilla example.
- [x] Verify deferred initial activation, cancellation, and teardown in the Vanilla bundle with the source DataView and GridMenu.
- [x] Verify Vanilla source header groups, original visibility, and configured height return after Pivot Mode ends and after independent Pivot disposal.
- [ ] Verify pre-header dimensions and service ownership across additional layout and resource-order combinations.
- [ ] Test resource ordering, registration, unregistering Pivot while the host grid remains alive, mode transitions, and grid destruction. Verify all framework wrappers.

### 4. Source rows versus displayed pivot rows

- [ ] Define dataset replacement and incremental updates, source column changes, row identity and indices, active/edit state, and drill-down.
- [x] Verify source and Pivot selections remain separate and restore the source DataView, columns, order, widths, visibility, sorting, pinning, and selection in Vanilla.
- [ ] Define generated-column sorting, pagination/item counts, and event context for source records, pivot groups, subtotals, and grand totals.

### 5. Source filters and pivot filters

- [ ] Align with the proposed upstream `sourceItems: 'filtered' | 'all'` API after it lands. The proposed default is filtered source rows before Pivot filters, across loaded local pages. The package README documents the current `getItems()` behavior.
- [ ] Specify the order and interaction of source filters, pivot filters, pagination, and remote/provider data; explain what “all” means when only part of a dataset is loaded.
- [x] Hide the source filter row during Pivot Mode and restore its prior visibility on exit or disposal. Test filters before, during, and after Pivot Mode.

### 6. Menus, commands, and exports

- [ ] Validate ColumnPicker/GridMenu with generated and hidden columns, spec changes, reordering, translation, and source state restoration. Hide a generated column via HeaderMenu and restore it through each picker.
- [ ] Define HeaderMenu sorting, pinning and hiding; ContextMenu and record-specific commands; and meaningful usability rules and callback context for aggregate rows.
- [ ] Revisit exports later. For initial Excel support, export source rows with matching source columns. Define source filtering and revisit native Excel PivotTable export after `excel-builder-vanilla` supports it.
- [ ] Verify Clear all Pinning and other commands leave pivot headers, cells, docking options, and source state consistent, including RTL and horizontal scrolling.

### 7. Grid State and Presets

- [ ] Integrate pivot state with host Grid State capture, change events, and initial Presets. Example 48's in-memory `savedSpec` is not Grid State integration.
- [ ] Decide what to persist: mode, field assignments, aggregators, filters, subtotals/grand totals, group expansion, and generated column widths/visibility.
- [ ] Separate source and generated column state and define restoration order relative to datasets, filters, resource registration, and mode activation.
- [ ] Specify how applications reattach non-serializable getters, setters, predicates, and custom aggregators.

### 8. Docked grouped-header alignment

- [ ] Validate `syncDockedHeaderGroups()` across supported themes, viewport sizes, horizontal scrolling, leading/trailing pinning, sticky columns, and RTL.
- [ ] Check hide/show, Clear all Pinning, resizing, sidebar resizing, and mode switches. Compare upstream behavior before suggesting a fork patch.
- [ ] Account for the intentional 2px last-header GridMenu resize-handle compensation in geometry assertions; do not confuse it with incorrectly expanded cells.

### 9. Acceptance example and integration tests

- [x] Start with ordinary grid data, columns and options; explicitly register resources and mount the separate sidebar. Switch modes without replacing the host grid.
- [ ] Exercise source updates, field changes, existing menus and filters, selection, state restoration, and cleanup without destroying host-owned extensions.
- [ ] Once Vanilla is complete, add representative framework integration examples and end-to-end coverage.
- [ ] Rerun Example 48 Cypress after the latest assertion change and complete focused unit, coverage, lint, formatting, and build checks. Meet the repository's changed-file statement/line coverage requirement.

### 10. Drill-down details dialog

- [x] Keep the dialog for now. Excel has a similar Show Details action, although Excel opens a new worksheet.
- [x] Verify `onPivotCellDrillDown` supplies source rows and aggregate context when the default dialog is disabled.
- [x] Document that the dialog grid is separate and basic: it implements sorting, but does not automatically initialize wrapper services, GridMenu, ColumnPicker, or filtering.
- [ ] Consider inheriting appropriate host presentation settings with explicit details options taking precedence. Avoid importing the Vanilla bundle into Pivot merely to construct this grid, which would add dependencies for framework users.
- [ ] Review row limits, formatting, custom columns, accessibility, RTL recreation, close/disposal, provider drill-down, and empty results.

### 11. Feature size is large

The new Pivot feature is also very large, it's understandable that this is a complex feature but perhaps there ways to decrease this feature size? For example do we need all these buttons in the header? Can we reuse some code? For example, the "slick-pivot-menu" look similar to existing Menu plugins or are we making sure that we have the simplest implementation for menu creation. In Slickgrid-Universal the Menu plugins are part of the common package (always loaded), so perhaps we could reuse the menu logic?

## UI review to do with the user

Do not assume the current controls are all necessary, correctly named, or in their final locations. For each, explain its behavior and decide whether it belongs to the resource, example, or host application. Review defaults, discoverability, accessibility, localization, responsiveness, disabled states, persistence, and overlap with existing grid UI. Preserve the preferred separate sidebar.

| Area | Current controls / information | Review questions |
| --- | --- | --- |
| Demo header | Dataset | Explain datasets, data replacement, and mode/state restoration. |
| Demo header | Grand total row: Sticky / Pinned / None | Explain scrolling, pinning, and interaction with Clear all Pinning. |
| Demo header | Grand total columns: Scroll / Pinned / Sticky | Explain docking, wide pivots, and RTL. |
| Demo header | Edit values | Explain write-back allocation, supported cells, source updates, and why the demo adds units. |
| Demo header | Right to left | Review the demo's bundle recreation and state restoration. |
| Demo header | Simulated server | Clarify this is an asynchronous provider demonstration, not a real backend; review cancellation and drill-down. |
| Demo header | Save layout / Restore layout / Reset layout | Current buttons save an in-memory spec only; review alongside Grid State/Presets. |
| Pivot toolbar | Report Layout: Compact / Outline / Tabular | Demonstrate row layouts, grouping, and labels. |
| Pivot toolbar | Subtotals: top / bottom / none | Explain which groups receive totals. |
| Pivot toolbar | Grand Totals: both / row / column / off | Explain total visibility versus docking. |
| Pivot toolbar | Expand All / Collapse All | Explain affected groups and persistence. |
| Pivot toolbar | Undo / Redo | Explain write-back history, visibility, disabled states, and shortcuts. |
| Pivot toolbar | Field List | Review show/hide, focus, grid resizing, and behavior when Pivot Mode is off. |
| Sidebar | Title, close button, Pivot Mode, search, fields | Review mode-off disabled state, grouping, date levels, captions, and keyboard access. |
| Sidebar | Filters / Columns / Rows / Values and pill menus | Explain assignments, drag/drop, aggregation, filters, settings, keyboard use, and invalid assignments. |
| Sidebar | Defer layout update / Update | Explain pending versus applied layout and mode/close behavior. |
| Sidebar | Resize splitter | Review pointer and keyboard controls, limits, RTL, and resize-service integration. |
| Footer/status | Source counts, pivot row/column counts, loading | Computation time is omitted by default and remains available to custom formatters. Verify accuracy for filters/remote data, localization, optional visibility, and overlap with grid footer/pagination. |
| Grid and menus | Generated headers, group toggles, HeaderMenu, GridMenu, ColumnPicker | Review appropriate commands, hiding/restoring, sorting, pinning, clear pinning, and exports. |
| Details dialog | Double-click, title/count, sorting, close | Review row limit, formatting, basic grid limitations, and replacement via the event. |

## Suggested resume order

1. Verify Vanilla initialization and cleanup, source updates, selection, menu state, and restoration of the original grid.
2. Finish the Vanilla UI review. Excel has equivalent layout and totals controls in its PivotTable ribbon. Defer localization until near the end, including automatic translation of the toolbar, field list, details dialog, and status bar.
3. Recheck upstream filtering and state APIs, then integrate source filtering and Grid State/Presets.
4. Maintain the Pivot package's 100% unit-test line and statement coverage as implementation work continues.
5. Revisit export separately. Complete framework integrations only after Vanilla is complete, followed by documentation and draft PR validation.
