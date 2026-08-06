#### index
- [Description](#description)
- [Doc Structure](#doc-structure)
- [Install and Register](#install-and-register)
- [Minimum Column Setup](#minimum-column-setup)
- [Core Options](#core-options)
- [Formula Editor and References](#formula-editor-and-references)
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
- preferred: selection-model highlights through `setSelectedRanges(...)`
- fallback: CSS highlights through `setCellCssStyles(...)`

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
