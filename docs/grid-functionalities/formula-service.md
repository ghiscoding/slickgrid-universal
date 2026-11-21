#### index
- [Description](#description)
- [Doc Structure](#doc-structure)
- [Install and Register](#install-and-register)
- [Minimum Column Setup](#minimum-column-setup)
- [Core Options](#core-options)
- [Formula Editor and References](#formula-editor-and-references)
- [Formula Drag-Fill](#formula-drag-fill)
- [Runtime API at a Glance](#runtime-api-at-a-glance)
- [Evaluation and Export Summary](#evaluation-and-export-summary)
- [Troubleshooting](#troubleshooting)
- [Demo](#demo)

### Description
Formula Editor is an optional external resource plugin that adds spreadsheet-like formula support to Slickgrid-Universal.

At a high level it provides:
- formula storage by row id and column id
- runtime formula evaluation in grid cells
- formula authoring via Formula Editor
- formula export bridge for Excel export workflows

### Doc Structure
To keep docs practical, formula docs are organized into 2 pages:

1. Overview (this page)
- plugin scope
- setup and options
- runtime API summary

2. Custom Functions and Export Notes
- [Formula Custom Functions](./formula-functions.md)

Related:
- [Export to Excel](./export-to-excel.md)

### Install and Register
Install package and register Formula Editor in `externalResources`.

Load the formula plugin styles after the SlickGrid theme. For Sass:

```scss
@use '@slickgrid-universal/formula-plugin/dist/styles/sass/slick-formula.scss';
```

Or load the precompiled CSS for your theme (for example, `default`, `bootstrap`, `fluent`, `material`, or `salesforce`):

```css
@import '@slickgrid-universal/formula-plugin/dist/styles/css/slick-formula-default.css';
```


```ts
import { FormulaService } from '@slickgrid-universal/formula-plugin';

const formulaService = new FormulaService();

this.gridOptions = {
  enableFormulas: true,
  externalResources: [formulaService],
};
```

### Minimum Column Setup
Enable formulas only on columns that should accept formula strings.

```ts
this.columns = [
  { id: 'price', field: 'price', type: 'number' },
  { id: 'qty', field: 'qty', type: 'number' },
  { id: 'total', field: 'total', type: 'number', allowFormula: true },
];
```

### Core Options
Common `FormulaServiceOption` settings:

| Option | Default | Purpose |
|---|---|---|
| `autoAssignEditor` | `true` | Auto-attach Formula Editor when the column has no editor. Formula values are formatted regardless of this setting. |
| `editorParams` | `undefined` | Default editor params merged with column-level params. |
| `autoSyncFormulasFromDataset` | `true` | Sync initial formula strings from dataset on init. |
| `customFunctions` | `{}` | Register runtime custom functions. |
| `excelDefinedNames` | `[]` | Export helper for workbook defined names. |
| `excelCustomFunctions` | `[]` | Export helper for workbook custom functions. |

### Formula Editor and References
Formula editor is auto-assigned when:
- Formula Editor is registered
- column has `allowFormula: true`
- `autoAssignEditor` is not disabled and no other editor is configured, or Formula Editor is explicitly configured

A column can use a custom editor while still calculating formulas. The existing column formatter receives the calculated value. A custom editor can enter a formula string beginning with `=` or replace it with a plain value; FormulaService updates its store after a grid edit. Formula-specific reference picking, coloring and autocomplete require Formula Editor.

Formula Editor calls the column's `editor.validator` or `validator`, with `editor.validator` taking precedence. The validator receives the displayed formula text and editor arguments and can return a validation message to prevent the edit from committing. Set `editor.params.validateFormulas: true` to reject calculated formula errors before commit. Without that opt-in, calculation errors remain visible in the cell with a tooltip.

```ts
import { Editors, Formatters } from '@slickgrid-universal/common';

const columns = [
  { id: 'price', field: 'price' },
  { id: 'total', field: 'total', allowFormula: true, editor: { model: Editors.text }, formatter: Formatters.dollar },
];
```

For a read-only formula column, prevent editing through the grid event. The formula and its dependencies continue to calculate:

```ts
grid.onBeforeEditCell.subscribe((_event, args) => {
  if (args.column.id === 'total') return false;
});
```

An editable-cell marker is presentation supplied by the configured formatter. A row-specific `onBeforeEditCell` rule is not automatically reflected in that marker; use a formatter that applies the same rule if its appearance should indicate editability.

Editor behaviors:
- reference token highlighting in formula text
- click another grid cell to insert/replace active reference token
- drag over grid cells to write ranges (for example `A1:C4`)
- caret-aware rewrite when editing inside an existing token/range
- grid click suppression during reference picking to avoid accidental commit/close
- `Ctrl+A` / `Cmd+A` scoped to editor text (not grid-wide selection)

For full reference pick UX:
- `enableSelection: true`
- `selectionOptions.selectionType: 'mixed'` or `'cell'`

Highlight behavior:
- the active reference under the caret uses the selection model through `setSelectedRanges(...)`
- existing cell/row selection ranges are restored when the temporary active-reference highlight is cleared
- all formula references use one CSS overlay through `setCellCssStyles(...)`, with a distinct color matching each formula token

When references overlap, the later reference in the formula supplies the overlapping cell's color and outline. The individual reference tokens retain their own colors.

Formula reference storage:
- the editor displays familiar Excel A1 references such as `C1` and `D1:D3`
- committed formulas are stored with stable column and row identities, for example `REF(COLUMN("price"),ROW("a_01"))`
- this keeps references aligned when columns are reordered or hidden and when rows are sorted
- `ExcelExportService` converts the stable references back to native Excel A1 formulas using the exported column and row order

Formula column letters follow the complete column order, including hidden columns. Hiding a column leaves a gap in the visible header letters, and references continue to point to the hidden data. A range spanning hidden columns includes their values. Mouse selection, reference highlighting and drag-fill use those same column positions; drag-fill skips hidden destination columns.

When a formula references a hidden source column, export it with `includeHidden: true` so the referenced column exists in the workbook. If the source column is omitted, the exported reference becomes `#REF!`. This applies to grouped and ungrouped exports.

### Grouping and Group Totals

Formula references use the displayed row numbers while editing a grouped, filtered or paged grid. References to records hidden by a filter or another page keep their stable `REF(COLUMN(...),ROW(...))` form in the editor and still evaluate. Group headers and totals occupy row numbers, but are not data cells: selecting a range skips those structural rows, and a single reference to one produces `#REF!`.

Ranges capture their member cells in row-major order as `REFRANGE(REF(...),REF(...),...)`. This preserves both membership and argument boundaries through grouping, sorting, filtering and column reordering. Contiguous members display as `A1:A3`; disjoint members display explicitly, for example `REFRANGE(A2,A9,A3)`. References hidden by collapsed groups retain their stable `REF(COLUMN(...),ROW(...))` form. Reopening and committing a formula does not change the referenced records. Legacy endpoint-only stable ranges are expanded using the dataset order when supplied to the service; import them before reordering the original dataset.

To persist a formula with its absolute-reference flags, save the snapshot instead of only the string returned by `getFormula()`. Restore it after the grid data and column IDs are available:

```ts
const snapshot = formulaService.getFormulaSnapshot(rowId, 'total');
const json = JSON.stringify(snapshot);
// After initializing a grid with the same row and column identities:
formulaService.setFormulaSnapshot(rowId, 'total', JSON.parse(json));
```

Programmatic `setFormula()` A1 input uses dataset coordinates. The editor converts displayed grouped coordinates before committing. Prefer stable syntax when importing formulas independently of the displayed layout.

To aggregate calculated values, wrap a standard aggregator using `createGroupingAggregator()`. The adapter leaves dataset records unchanged and works with the existing group total formatters. Its optional second argument is the column ID when that differs from the aggregator's field.

```ts
import { Aggregators, GroupTotalFormatters } from '@slickgrid-universal/common';

const totalColumn = {
  id: 'total', field: 'total', allowFormula: true,
  groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
};

dataView.setGrouping({
  getter: 'category',
  aggregators: [formulaService.createGroupingAggregator(new Aggregators.Sum('total'))],
});
```

The adapter preserves the underlying aggregator's treatment of blank and nonnumeric values, including formula errors. Grouping labels and totals remain structural rows; formulas cannot reference them as data records.

Grouped Excel export uses the actual worksheet positions, including custom headers, group rows, totals and the leading grouping column. Contiguous ranges export directly. Disjoint or reordered ranges use a deduplicated **Formula References** worksheet containing links to the source cells, so functions such as `SUMIF` retain a single range argument and the original member order. Keep this helper sheet in the workbook. Helper cells return an empty string for blank sources. Direct `COUNTA` arguments use an additional presence range so blank cells are excluded while formulas returning empty text are counted. Custom Excel functions receive empty strings for blank helper cells. A dependency omitted by collapsing, filtering or excluding a source column exports as `#REF!`; expand groups and include the required columns to export those dependencies.


### Saving Formulas with Grid State

Grid State and Presets describe the layout; they do not contain formula cell data. Save a versioned formula store snapshot alongside the Grid State and the dataset. Call `getCurrentGridState(true)` to include hidden columns. Restore the dataset and grid first, apply the saved preset, then restore the formula store and refresh the grid:

```ts
// Save before the grid is destroyed.
const saved = {
  gridState: gridStateService.getCurrentGridState(true),
  formulas: formulaService.getFormulaStoreSnapshot(),
};
const json = JSON.stringify(saved);

// On the next load, parse json and set gridOptions.presets = saved.gridState
// before creating the grid. Once the data and FormulaService are initialized:
formulaService.setFormulaStoreSnapshot(saved.formulas);
// If grouping or other DataView calculations depend on formulas:
dataView.refresh();
grid.invalidate();
grid.render();
```

The snapshot replaces the service's entire formula store, including absolute-reference flags; it is validated before any changes are made. Restore it after the dataset, columns and external resources are initialized. Restored formulas take precedence over older formula strings in dataset cells. The method does not change the dataset: cells without a stored formula may still evaluate a formula string in their dataset field. Save and restore dataset edits separately, and call `syncFormulasFromDataset()` only when you intend dataset formulas to replace stored formulas.

Formulas for row or column IDs that are not currently present remain in the store. Missing referenced IDs evaluate to `#REF!` until the corresponding data or columns return. Ordinary grouping configuration is not included in Grid State; restore it separately. For dynamic layout restoration use `gridStateService.applyColumnLayout(saved.gridState.columns)` before restoring formulas, and restore other state through the appropriate services.

### Formula Drag-Fill

With cell-capable selection enabled, Formula Editor handles the `.slick-drag-replace-handle` automatically for formula-enabled columns.

- formulas shift relative A1 references while keeping absolute reference parts fixed
- grouped fill skips group headers/totals as destinations and captures only data members in translated ranges
- references hidden by collapsed groups retain their stable identities during fill; expand the group to shift those references by displayed row positions
- one static source value is copied
- multiple numeric source values continue as a linear progression
- string or mixed source values repeat in source order
- read-only targets are skipped and a complete fill is submitted through editCommandHandler so the configured undo/redo queue can restore it

This matches the common defaults documented by [AG Grid's fill handle](https://www.ag-grid.com/javascript-data-grid/cell-selection-fill-handle/). Series inference is implemented inside the optional formula-plugin package, so grids that do not register Formula Editor do not include this behavior.

Use `autoEdit: false` when combining formula editing and drag-fill. A single click selects the formula cell and exposes the drag handle; double-click the cell when you want to open the formula editor.

Modifier-key copy/increment toggles, custom fill callbacks, range-reduction clearing, and double-click fill are not currently implemented.

### Runtime API at a Glance
Frequently used methods:
- `setFormula(rowId, columnId, formula)`
- `getFormula(rowId, columnId)`
- `removeFormula(rowId, columnId)`
- `syncFormulasFromDataset()`
- `getEvaluatedCellValue(rowId, columnId, ...)`
- `registerCustomFunction(name, input)`
- `registerCustomFunctions(functionMap)`
- `unregisterCustomFunction(name)`
- `getExcelFormula(context)`
- `createGroupingAggregator(aggregator, columnId?)`
- `getFormulaSnapshot(rowId, columnId)` and `setFormulaSnapshot(rowId, columnId, snapshot)` preserve a single cell
- `getFormulaStoreSnapshot()` and `setFormulaStoreSnapshot(snapshot)` save and restore the complete formula store

For built-ins/custom functions/export compatibility, see [Formula Custom Functions](./formula-functions.md).

### Formula Errors

The grid displays `#CIRCREF!` for direct or indirect circular references, `#PARSE!` for malformed formulas, and `#REF!` for missing or invalid references. Other errors include `#NAME?`, `#VALUE!`, `#DIV/0!`, `#NUM!`, `#N/A` and `#ERROR!`. A custom function that throws produces `#ERROR!`, which propagates to dependent formulas.

`#CIRCREF!` and `#PARSE!` are grid error codes, not native Excel error values. Excel export preserves the underlying formulas; Excel handles circular references and invalid formulas according to its own rules and settings.

### Evaluation and Export Summary
Evaluation supports:
- A1 references and ranges
- AG-style `REF(COLUMN(),ROW())` references
- arithmetic/comparison operators
- built-in and custom functions

Comparisons between text values ignore letter case, including comparisons used in `IF` conditions. Numbers, text and logical values are distinct in comparisons and ordered in that sequence. In arithmetic, logical values are converted to numbers. The `&` operator renders them as `TRUE` or `FALSE`.

Arithmetic or function results that overflow return `#NUM!`; division by zero returns `#DIV/0!`.

Export supports:
- conversion of formula-enabled cells to native Excel formulas
- workbook metadata hooks for defined names and custom functions

For CSV or text export, enable `exportWithFormatter: true` in `TextExportService` options to export the displayed formula results. Column-level `exportWithFormatter` and `exportCustomFormatter` settings take precedence; with formatters disabled, export reads the raw dataset value instead.

### Troubleshooting
1. Formula cell shows raw formula string
- Verify the column has `allowFormula: true`.
- Verify Formula Editor is registered in `externalResources`.
- Verify formula text starts with `=`.

2. Click/drag reference picking is missing
- Verify selection prerequisites are enabled.
- Verify the active editor is Formula Editor.

3. Ctrl/Cmd+A selects the whole grid
- Ensure focus is inside formula editor input.
- Verify no upstream custom key handler is intercepting first.

### Demo
- Demo Page: https://ghiscoding.github.io/slickgrid-universal/#/example48
- Demo Component: https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example48.ts
