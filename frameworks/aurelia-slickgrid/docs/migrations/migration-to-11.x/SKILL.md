---
name: aurelia-slickgrid-v11-migration
description: Migrate Aurelia-Slickgrid applications from v10 to v11 using the framework migration guide. Use for upgrading dependencies, frozen panes, persisted state, menus, removed APIs, and styles.
---

# Aurelia-Slickgrid v11 migration

## Framework requirements

Upgrade i18next to v26+ where used. Remove `on-before-append-cell.trigger` bindings and move their logic to formatters. Update removed menu option event bindings to command handling. Keep the Aurelia Row Detail adapter package name unchanged.

Replace removed `columnSort` callbacks in Column Picker and Grid Menu with `columnListBuilder`. Return the sorted or filtered eligible-column array; this does not change the grid column order.

## Migration workflow

Read the [v11 migration guide](../migration-to-11.x.md) before editing. It is the source of truth for option mappings and examples. If the application is older than v10, apply the earlier migration guides in order first.

Inspect dependencies, grid and column options, saved grid state and presets, menu callbacks, translations, styles, and tests. Apply only changes relevant to features the application uses. Preserve existing behavior when translating options; do not enable Sticky docking merely because frozen panes were used.

## Pinning and persisted state

- Replace `frozenColumn`, `frozenRow`, and `frozenBottom` with `pinning.columns` and `pinning.rows`. A numeric column boundary is inclusive: `frozenColumn: 2` becomes `pinning.columns.left: 2`, pinning the first three columns. Convert row counts into explicit indexes or dataset IDs on the appropriate top or bottom side.
- Migrate stored Grid State and Grid Presets as well as initial options. Resolve column boundaries against the saved column order and bottom rows against the relevant dataset; do not invent IDs when the data is unavailable.
- Use `Column.pinned` for individual pins and `Column.pinnable: false` to hide that column's pinning commands.
- Merge `invalidColumnFreezePickerCallback` and `invalidColumnFreezeWidthCallback` into `errorCallback`, preserving relevant handling. Rename `skipFreezeColumnValidation` and `invalidColumnFreezeWidthMessage` to their pinning equivalents from the guide.
- Update frozen menu icons, command labels, translation keys, and `locales` keys (including their `TEXT_` prefix). Pinning commands are shown by default; hide the Header Menu root with `hideCommands: ['pinning-commands']` if needed.

For accepted references and configuration, read [Pinning](../../grid-functionalities/pinning.md) and [Grid State and Presets](../../grid-functionalities/grid-state-preset.md). Consult [Sticky Docking](../../grid-functionalities/sticky.md) only when scroll-activated docking is wanted.

## Menus

Use the [menu visibility mapping](../migration-to-11.x.md#menu-command-visibility) rather than mechanically converting every `hide...` property:

- For removed ordinary command flags, `true` adds the mapped command ID to `hideCommands`; `false` removes it. Preserve unrelated hidden commands.
- Invert `hideToggleDarkModeCommand` into `gridMenu.showToggleDarkModeCommand`. Dark mode remains opt-in.
- Replace `hideExportTextDelimitedCommand` with `textExportOptions.menuFormats`. Include `'txt'` to enable text export and retain `'csv'` if CSV is wanted. This affects both Grid Menu and Context Menu; use each menu's `hideCommands` for differences between them.
- `hideCommands` takes precedence over opt-in flags. Supplied `hideCommands` and `menuFormats` arrays replace prior arrays, including through `setOptions()`; omission preserves a value and `[]` clears it.
- Replace `optionItems` with `commandItems`, using string command identifiers. Move `onOptionSelected` handling to `onCommand` or item `action` callbacks, including nested menus and framework bindings. Replace the option item/callback types and option section settings with the corresponding command equivalents.
- Remove `positionOrder` and `filterShortcutsPositionOrder`. Use `commandListBuilder` for final built-in command ordering; order Cell Menu and nested arrays directly. Guard against the `'divider'` string when accessing item properties. Divider objects such as `{ divider: true }` do not require a command.

## Removed APIs and rendering changes

- Remove unused SortableJS and `@types/sortablejs` dependencies only if no other application feature uses them.
- Remove DataView `inlineFilters` and `useCSPSafeFilter`; filtering is always CSP safe. Replace removed CSP filter types with `FilterFn<T>` and update subclass method references using the guide's mapping.
- Replace `ExtensionName.member` values with string literals. Keep `ExtensionName` as a type-only import where needed, and replace `ExtensionNameTypeString` with `ExtensionName`.
- Remove resize by content options `resizeByContentOptions.cellCharWidthInPx`, `defaultRatioForStringType`, `widthToRemoveFromExceededWidthReadjustment` and column options `resizeCalcWidthRatio`, `resizeCharWidthInPx`; widths are now measured with a canvas and the cell CSS padding. Use `resizeExtraWidthPadding` or `resizeByContentOptions.cellPaddingWidthInPx` for tweaks, and optionally enable `resizeByContentOptions.includeHeaderWidth`. Expect slightly different (often narrower) computed widths in E2E tests. Rename `resizeByContentOptions.maxItemToInspectCellContentWidth` to `sampleSize` and `maxItemToInspectSingleColumnWidthByContent` to `singleColumnSampleSize`. Remind users that only up to 1000 rows are inspected (`sampleSize`, 5000 for a single column via `singleColumnSampleSize`), now sampled evenly across the dataset instead of the first 1000 rows.
- Remove `rowTopOffsetRenderType` and `rowDetailView.renderMode`; transform positioning and overlay Row Detail rendering are now automatic.
- Replace `clipboardWriteOverride` and `queueMicrotaskPolyfill` usage with native APIs. Remove `CompositeEditorOption.domElementType`; Composite Editor uses native `<dialog>`.
- Replace `onBeforeAppendCell` subscriptions or bindings with formatters returning `addClasses`, preserving any existing formatter text and behavior.
- Rename `gridStateService.changeColumnsArrangement()` to `applyColumnLayout()` while retaining arguments.

## Styles, DOM selectors, and optional packages

Use the guide's [DOM and CSS mapping](../migration-to-11.x.md#single-viewport-dom-and-css) for custom styles and browser tests. The renderer now has one viewport; remove manual pane scroll synchronization and the legacy header offset workaround. Update frozen/pane Sass and CSS variables using the documented replacements.

- Replace old Row Detail wrappers with `.slick-row-detail-container` and `.row-detail-{id}` selectors.
- Use `.slick-tree-toggle` for tree styling instead of `.slick-group-toggle`.
- Excluded Column Picker and Grid Menu columns are absent from the DOM. Update counts and assertions to check absence, and account for builders receiving only eligible columns.
- Prefer Header Menu text or command selectors over positional selectors because built-in ordering changed.
- Rename the base package `@slickgrid-universal/row-detail-view-plugin` to `@slickgrid-universal/row-detail-plugin`, including imports and stylesheet paths (`slick-row-detail-view` becomes `slick-row-detail`). Framework Row Detail adapter package names stay unchanged.
- Add used Composite Editor, Custom Tooltip, and Row Detail style packages as direct dependencies and import their styles after the common theme. Match CSS to the application's theme; for Sass, load the common theme first in the same compilation so configured variables apply. Read [Required Styles for Extra Packages](../../styling/styling.md#required-styles-for-extra-packages) for exact paths.
- For Fluent styling, `iconSet: 'fluent'` can replace default icon mappings. Retain intentional explicit overrides, which take precedence.

## Validation and handoff

Search again for removed options, imports, callbacks, selectors, and dependencies in application code, persisted state handling, and tests. Run the application's relevant type checks and focused tests when available. Exercise pinning and restored state, menu visibility and actions, Row Detail, and optional package styling for features in use.

Report the changes made, checks performed, and any unresolved state/data mappings or dependency requirements. Distinguish migration requirements from optional adoption of new features.

Resize by content measures every distinct sampled text with its column cell font and padding; it does not shortlist candidates by character count.
