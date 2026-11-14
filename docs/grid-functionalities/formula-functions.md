#### index
- [Description](#description)
- [Built-in Functions](#built-in-functions)
- [Custom Function Registration](#custom-function-registration)
- [Function Name Rules](#function-name-rules)
- [Range Arguments and Flattening](#range-arguments-and-flattening)
- [Runtime API](#runtime-api)
- [Excel Export Interop](#excel-export-interop)
- [Compatibility Warning](#compatibility-warning)
- [Portable Export Pattern](#portable-export-pattern)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

### Description
Formula Service supports both built-in formula functions and user-defined custom functions.

Custom functions can be used for:
- runtime grid formula evaluation
- Excel workbook export metadata (defined names/custom functions)

### Built-in Functions
Current built-ins include:
- `IF`
- `SUM`
- `SUMPRODUCT`
- `SUMIF`
- `PRODUCT`
- `MIN`
- `MAX`
- `AVERAGE`
- `MEDIAN`
- `POWER`
- `RAND`
- `NOW`
- `TODAY`
- `CONCAT`
- `COUNT`
- `COUNTA`
- `COUNTBLANK`
- `COUNTIF`
- `NA`

### Custom Function Registration
You can register functions in constructor options.

Direct callback style:

```ts
const formulaService = new FormulaService({
  customFunctions: {
    NET: (amount: number, taxes: number) => amount - taxes,
  },
});
```

AG-like params style:

```ts
const formulaService = new FormulaService({
  customFunctions: {
    CUSTOMSUM: {
      func: ({ values }: { values: unknown[] }) => {
        return values.reduce<number>((total, value) => total + Number(value ?? 0), 0);
      },
    },
  },
});
```

### Function Name Rules
Guidelines:
- use uppercase names for readability
- use identifier-safe names: letters, digits, underscore
- avoid spaces/special punctuation

Runtime notes:
- names are normalized to uppercase internally
- custom names can override built-ins when same name is used

### Range Arguments and Flattening
For params-object style (`func: ({ values }) => ...`), range inputs are flattened to a single value list.

Example:
- formula `=CUSTOMSUM(A1:C1)`
- handler receives `values` containing each referenced cell value

### Runtime API
Useful runtime methods:
- `registerCustomFunction(name, functionInput)`
- `registerCustomFunctions(map)`
- `unregisterCustomFunction(name)`
- `getCustomFunction(name)`

This allows dynamic enable/disable of custom function packs.

### Excel Export Interop
Formula Service exposes export helpers:
- `getExcelDefinedNames()`
- `getExcelCustomFunctions()`

These are consumed by Excel export integration when both services are registered.

Related doc:
- [Export to Excel](./export-to-excel.md)

### Compatibility Warning
Workbook custom functions are exported using modern Excel conventions such as:
- `_xlfn.LAMBDA`
- `_xlpm.` argument tokens

LibreOffice/OpenOffice may open file structure but do not reliably evaluate workbook-defined custom functions.

Practical impact:
- built-in formulas usually work
- workbook custom function formulas may fail (for example `Err:509`)

### Portable Export Pattern
For cross-suite reliability:
1. Precompute custom-function formulas to scalar values.
2. Export plain values.
3. Restore original formula strings in-memory after export.

Reference implementation:
- [Example 46](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example46.ts)

### Examples
Runtime registration after init:

```ts
formulaService.registerCustomFunctions({
  CUSTOMNET: {
    func: ({ values }: { values: unknown[] }) => {
      const gross = Number(values[0] ?? 0);
      const taxes = Number(values[1] ?? 0);
      return gross - taxes;
    },
  },
});
```

Formula usage in dataset:

```ts
item.net = '=CUSTOMNET(A2,B2)';
```

### Troubleshooting
1. Formula returns `#NAME?`
- function was not registered
- function name mismatch between formula and registry key

2. Custom function works in grid but fails after Excel export
- workbook custom function compatibility varies by spreadsheet app
- use portable export pattern for non-Excel targets

3. Unexpected numeric precision in custom sum results
- floating-point math can produce tiny precision noise
- for tests, prefer precision-based assertions (`toBeCloseTo`)