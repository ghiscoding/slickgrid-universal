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
- The generic `ExternalResource.prepareGridOptions` hook prepares pre-header infrastructure before grid creation. The current README and demo start with `pivotMode: false`, then enable it after wrapper initialization; this is a workaround, not the intended final consumer experience.
- Local DataView sources currently use `getItems()`, so ordinary DataView filtering does not automatically limit pivot inputs. Example 48 hides the source filter row in Pivot Mode and restores it afterward; this is currently demo behavior.
- Keep the built-in drill-down dialog for now. It creates a separate basic SlickGrid, not a Vanilla bundle or framework wrapper. `details: false` leaves the drill-down event available for application-owned UI.
- Recent changes synchronize GridMenu and ColumnPicker with generated columns and correct cell widths after clearing pinning. Revalidate the actual UI, including hiding a pivot column and restoring it from both menus.
- The last focused grid/pivot run reported 717 passing tests. Coverage was 100% statements/lines for `slickGrid.ts` and 93.84% statements / 94.16% lines for `slick.pivot.ts`; the latter was below the repository target. A new Cypress assertion was adjusted for the 2px GridMenu header compensation and still needs a rerun against the demo. These are historical results, not current validation.

## Ten upstream feedback points

### 1. Pre-header preparation and normal grid construction

- [ ] Verify `prepareGridOptions` runs early enough for registered resource instances in Vanilla and all four wrappers without importing Pivot into core.
- [ ] Define precedence when the application or multiple resources configure the pre-header; preserve its original configuration.
- [ ] Correct stale Universal examples/JSDoc that suggest wrapping grid options in `SlickPivot.getGridOptions()`.
- [ ] Reconsider the fork separately: `grid.registerPlugin()` normally runs after grid construction, so the Universal hook is not automatically a direct upstream patch.

### 2. Host grid options, columns, and initial layout

- [ ] Keep ordinary column definitions, grid options, and dataset as the primary configuration. Define precedence between resource-constructor options and host `pivotOptions`.
- [ ] Derive field IDs, captions, and suitable types from host columns where possible; allow overrides for hierarchies, calculated fields, formatting, aggregation restrictions, getters/setters, and write-back.
- [ ] Verify updated source columns, hidden columns, translated captions, and datasets do not leave stale or duplicate field schemas.

### 3. Initialization, pre-header ownership, and teardown

- [ ] Investigate removing the manual post-initialization `setPivotMode(true)` workaround while keeping the source DataView and wrapper services correctly initialized.
- [ ] Review interaction with `HeaderGroupingService`; preserve and restore pre-header content, visibility, dimensions, and service ownership.
- [ ] Test resource ordering, registration, unregistering Pivot while the host grid remains alive, mode transitions, and grid destruction. Verify all framework wrappers.

### 4. Source rows versus displayed pivot rows

- [ ] Define dataset replacement and incremental updates, source column changes, row identity and indices, active/edit state, and drill-down.
- [ ] Verify source and pivot selections remain separate; restore the source DataView, columns, order, widths, visibility, sorting, pinning, and selection appropriately.
- [ ] Define generated-column sorting, pagination/item counts, and event context for source records, pivot groups, subtotals, and grand totals.

### 5. Source filters and pivot filters

- [ ] Decide whether pivot aggregation uses all source items, source-filtered items, or a configurable choice. Document the present `getItems()` behavior until that decision changes it.
- [ ] Specify the order and interaction of source filters, pivot filters, pagination, and remote/provider data; explain what “all” means when only part of a dataset is loaded.
- [ ] Decide whether hiding/restoring the source filter row should become supported resource behavior instead of example code. Test filters before, during, and after Pivot Mode.

### 6. Menus, commands, and exports

- [ ] Validate ColumnPicker/GridMenu with generated and hidden columns, spec changes, reordering, translation, and source state restoration. Hide a generated column via HeaderMenu and restore it through each picker.
- [ ] Define HeaderMenu sorting, pinning and hiding; ContextMenu and record-specific commands; and meaningful usability rules and callback context for aggregate rows.
- [ ] Define exports of displayed pivot results versus original or filtered source records and the behavior of existing export resources.
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

- [ ] Start with ordinary grid data, columns and options; explicitly register resources and mount the separate sidebar. Switch modes without replacing the host grid.
- [ ] Exercise source updates, field changes, existing menus and filters, selection, state restoration, and cleanup without destroying host-owned extensions.
- [ ] Add representative Angular, React, Vue, and Aurelia integration examples and end-to-end coverage.
- [ ] Rerun Example 48 Cypress after the latest assertion change and complete focused unit, coverage, lint, formatting, and build checks. Meet the repository's changed-file statement/line coverage requirement.

### 10. Drill-down details dialog

- [ ] Keep the dialog for now: Excel has a similar Show Details action, although Excel opens a new worksheet. Equivalent built-in dialogs were not found in the AG Grid and MUI pivot documentation checked for the feedback.
- [ ] Preserve `onPivotCellDrillDown` with rows and aggregate context when the default dialog is disabled, so applications can use a framework-managed grid or another presentation.
- [ ] Document that the dialog grid is separate and basic: it implements sorting, but does not automatically initialize wrapper services, GridMenu, ColumnPicker, or filtering.
- [ ] Consider inheriting appropriate host presentation settings with explicit details options taking precedence. Avoid importing the Vanilla bundle into Pivot merely to construct this grid, which would add dependencies for framework users.
- [ ] Review row limits, formatting, custom columns, accessibility, RTL recreation, close/disposal, provider drill-down, and empty results.

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
| Footer/status | Source counts, pivot row/column counts, compute time, loading | Verify accuracy and meaning for filters/remote data, formatting, localization, optional visibility, and overlap with grid footer/pagination. |
| Grid and menus | Generated headers, group toggles, HeaderMenu, GridMenu, ColumnPicker | Review appropriate commands, hiding/restoring, sorting, pinning, clear pinning, and exports. |
| Details dialog | Double-click, title/count, sorting, close | Review row limit, formatting, basic grid limitations, and replacement via the event. |

## Suggested resume order

1. Validate the latest menu and pinning changes in Example 48 and its serial Cypress suite.
2. Review the UI inventory with the user and agree on each control's role and default before redesigning it.
3. Address initialization/options and Grid State/Presets; define filtering, menus, exports, and selection.
4. Complete framework integrations, coverage, documentation, and draft PR validation.
