---
name: angular-slickgrid-v10-migration
description: Migrate Angular-Slickgrid applications from v9 to v10 using the migration guide. Use for Angular setup, Row Detail, column visibility, selection, and removed APIs.
---

# Angular-Slickgrid v10 migration

## Migration workflow

Read the [v10 migration guide](https://ghiscoding.gitbook.io/angular-slickgrid/migrations/migration-to-10.x) before editing; it is the source of truth for mappings and examples. If the application is older than v9, apply the earlier migration guides in order first. Inspect dependencies, grid and column options, visibility logic, saved state, styles, and tests. Apply only relevant changes and preserve existing behavior.

## Angular requirements

- Upgrade to Angular v21+ and, if used, ngx-translate v17 as described in the guide.
- `AngularSlickgridModule` was removed. Import `AngularSlickgridComponent` in consuming components and replace `forRoot()` configuration with the documented `defaultGridOption` provider.
- Angular-Slickgrid supports zoneless and Zone.js applications. Do not remove `zone.js` unless the application is ready; review UI updates and use signals where needed.
- If using Row Detail, add `@slickgrid-universal/angular-row-detail-plugin`, import `AngularRowDetailView`, and register it in `externalResources` as shown in the guide.

## Column visibility

- Replace `setColumns()` calls used only to hide or show columns with `grid.updateColumnById('id', { hidden: true })` or `{ hidden: false }`, then call `grid.updateColumns()`. Keep `setColumns()` when actually changing the column list.
- `grid.getColumns()` now includes hidden columns. Use `grid.getVisibleColumns()` when only visible columns are wanted; replace references to `sharedService.allColumns` and `sharedService.visibleColumns` with the appropriate grid methods.
- Review saved column order and visibility, plus `colspan` and `rowspan` behavior: hiding a spanning column also hides its span.

## Selection, removed APIs, and styles

- Replace removed `SlickCellSelectionModel` and `SlickRowSelectionModel` usage with `SlickHybridSelectionModel`. Replace `enableHybridSelection` and `enableRowSelection` with `enableSelection`, and `rowSelectionOptions` with `selectionOptions`. Choose `selectionType: 'cell'`, `'row'`, or `'mixed'` to preserve the application's selection behavior; the default is `'mixed'`.
- Replace `applyHtmlCode()` with `applyHtmlToElement()` and `throwWhenFrozenNotAllViewable` with `invalidColumnFreezeWidthCallback`, adapting arguments and error handling to the documented APIs.
- Update selection and picker selectors from `mdi-icon-check`, `mdi-icon-partial-check`, `mdi-icon-uncheck`, `mdi-icon-picker-check`, and `mdi-icon-picker-uncheck` to their corresponding `sgi-icon-` names.
- If not already migrated in v9, replace removed enum values with their actual string literals from the guide, including operator and delimiter values; do not assume every literal equals the member name. Rename editor `editorOptions` and filter `filterOptions` to `options`, `text-color-*` to `color-*`, and `mdi-*px` font-size utilities to `font-*px`.

## Behavior and optional features

- Composite Editor uses a native `<dialog>` by default, with a `<div>` fallback; Grid Menu positioning uses flexbox. Review custom CSS and tests as needed.
- Registered Excel, PDF, and text export services, Composite Editor, and Row Detail automatically enable their associated grid flags unless explicitly set. Preserve intentional explicit settings.
- `hideCommands` and `commandListBuilder` are available in v10 as alternatives to deprecated menu `hide...` flags and `positionOrder`; `optionItems` is also deprecated. These are optional v10 migrations, not removals until v11. Guard the `'divider'` string when inspecting builder items. Global tooltip observation is opt-in.

## Validation and handoff

Search again for affected APIs and selectors. Run relevant type checks and focused tests, including Angular setup, Row Detail, column visibility and spans, selection, resource registration, keyboard navigation, and accessibility where used. Report changes, checks, and unresolved migration decisions.
