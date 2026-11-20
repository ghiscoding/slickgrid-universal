# @slickgrid-universal/formula-plugin

Optional Formula Service for Slickgrid-Universal.

## Purpose

This package provides an external resource to evaluate and edit formulas per cell, with an Excel export bridge.

Current scope:
- Formula storage using stable row and column identities
- A1 formula editing, reference highlighting, and drag-fill
- Built-in and custom functions, with runtime evaluation
- Formula snapshots and native Excel formula export

## Usage

Load the plugin styles after the SlickGrid theme:

```scss
@use '@slickgrid-universal/formula-plugin/dist/styles/sass/slick-formula.scss';
```

Alternatively, import the matching precompiled CSS, for example `@slickgrid-universal/formula-plugin/dist/styles/css/slick-formula-default.css`.

```ts
import { FormulaService } from '@slickgrid-universal/formula-plugin';

const formulaService = new FormulaService();

gridOptions = {
  enableFormulas: true,
  externalResources: [formulaService],
};

formulaService.setFormula('id_1', 'total', '=REF(COLUMN("price"),ROW("id_1"))*REF(COLUMN("qty"),ROW("id_1"))');
```

When `ExcelExportService` is enabled, formulas are exported as native Excel formulas when this resource is registered.

Formula values are formatted even when a column uses a custom editor or `autoAssignEditor: false`. Custom editors can save a formula string or a plain value; Formula Editor provides reference picking, highlighting and autocomplete. To prevent editing while continuing to calculate, return `false` for the column from `grid.onBeforeEditCell`.
