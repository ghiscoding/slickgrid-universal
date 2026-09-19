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
Formula Service is an optional external resource plugin that adds spreadsheet-like formula support to Slickgrid-Universal.

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
Install package and register Formula Service in `externalResources`.

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
| `autoAssignEditor` | `true` | Auto-attach Formula Editor and formatter pipeline to formula columns. |
| `editorParams` | `undefined` | Default editor params merged with column-level params. |
| `autoSyncFormulasFromDataset` | `true` | Sync initial formula strings from dataset on init. |
| `customFunctions` | `{}` | Register runtime custom functions. |
| `excelDefinedNames` | `[]` | Export helper for workbook defined names. |
| `excelCustomFunctions` | `[]` | Export helper for workbook custom functions. |

### Formula Editor and References
Formula editor is auto-assigned when:
- Formula Service is registered
- column has `allowFormula: true`
- `autoAssignEditor` is not disabled

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

Formula reference storage:
- the editor displays familiar Excel A1 references such as `C1` and `D1:D3`
- committed formulas are stored with stable column and row identities, for example `REF(COLUMN("price"),ROW("a_01"))`
- this keeps references aligned when columns are reordered or hidden and when rows are sorted
- `ExcelExportService` converts the stable references back to native Excel A1 formulas using the exported column and row order

When a formula references a hidden source column, export it with `includeHidden: true` so the referenced column exists in the workbook. If the source column is omitted from the export, Excel cannot evaluate a formula that points to it.

### Formula Drag-Fill

With cell-capable selection enabled, Formula Service handles the `.slick-drag-replace-handle` automatically for formula-enabled columns.

- formulas shift relative A1 references while keeping absolute reference parts fixed
- one static source value is copied
- multiple numeric source values continue as a linear progression
- string or mixed source values repeat in source order

This matches the common defaults documented by [AG Grid's fill handle](https://www.ag-grid.com/javascript-data-grid/cell-selection-fill-handle/). Series inference is implemented inside the optional formula-plugin package, so grids that do not register Formula Service do not include this behavior.

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
- `getExcelFormula(context)`

For built-ins/custom functions/export compatibility, see [Formula Custom Functions](./formula-functions.md).

### Evaluation and Export Summary
Evaluation supports:
- A1 references and ranges
- AG-style `REF(COLUMN(),ROW())` references
- arithmetic/comparison operators
- built-in and custom functions

Export supports:
- conversion of formula-enabled cells to native Excel formulas
- workbook metadata hooks for defined names and custom functions

### Troubleshooting
1. Formula cell shows raw formula string
- Verify the column has `allowFormula: true`.
- Verify Formula Service is registered in `externalResources`.
- Verify formula text starts with `=`.

2. Click/drag reference picking is missing
- Verify selection prerequisites are enabled.
- Verify the active editor is Formula Editor.

3. Ctrl/Cmd+A selects the whole grid
- Ensure focus is inside formula editor input.
- Verify no upstream custom key handler is intercepting first.

### Demo
- Demo Page: https://ghiscoding.github.io/slickgrid-universal/#/example46
- Demo Component: https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example46.ts
