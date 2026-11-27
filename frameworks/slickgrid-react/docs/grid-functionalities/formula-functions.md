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
Formula Editor supports both built-in formula functions and user-defined custom functions.

Custom functions can be used for:
- runtime grid formula evaluation
- Excel workbook export metadata (defined names/custom functions)

### Built-in Functions
Current built-ins include:
- `IF`
- `SUM`
- `SUMIF`
- `PRODUCT`
- `MIN`
- `MAX`
- `AVERAGE`
- `MEDIAN`
- `POWER`
- `ABS`
- `ROUND`
- `MOD`
- `SQRT`
- `RAND` (aliases: `RANDOM`, `RAN`)
- `NOW`
- `TODAY`
- `CONCAT` (alias: `CONCATENATE`)
- `COUNT`
- `COUNTA`
- `COUNTBLANK`
- `COUNTIF`
- `NA`

`ROUND(number, digits)` requires both arguments, matching Excel. A negative digit count rounds to the left of the decimal point; halfway values round away from zero. `MOD` uses the divisor's sign and returns `#DIV/0!` for zero. `SQRT` returns `#NUM!` for negative inputs. These scalar math functions return `#VALUE!` for invalid arguments.

`SUM`, `PRODUCT`, `MIN`, `MAX`, `AVERAGE`, `MEDIAN`, `CONCAT` and `CONCATENATE` require at least one argument. Aggregate functions accept at most 255 arguments, while `CONCAT` and `CONCATENATE` accept at most 253; each range counts as one argument. Referenced error cells are ignored by `COUNT` and counted by `COUNTA`. Numeric operations use the Excel 1900 date system for JavaScript `Date` values from 1900 through 9999. For Excel formulas that reference date columns, set `exportWithFormatter: false` so the workbook receives date values instead of formatted text. `POWER` requires two numeric arguments. A zero base with a negative exponent returns `#DIV/0!`; zero to the zero power, invalid roots and overflow return `#NUM!`. `RAND`, `RANDOM`, `RAN`, `NOW`, `TODAY` and `NA` accept no arguments. `IF` accepts two or three arguments. Invalid argument counts return `#VALUE!` in the grid.

For Excel export, the built-in `RANDOM` and `RAN` aliases are written as `RAND`, and `CONCATENATE` is written as `CONCAT` so range arguments retain the same behavior. Custom functions overriding an alias retain their name; export them using the custom-function configuration if needed. `CONCAT` requires a compatible Excel version.

`COUNTIF` and `SUMIF` match text without regard to case and support `*` (any sequence), `?` (one character), and `~` to escape a wildcard or tilde. Text comparisons preserve spaces. A blank cell used as the criterion is treated as zero; an empty-text criterion matches blank and empty-text cells. `SUMIF` adds numeric values in the sum range and ignores text and booleans.

`CONCAT` and `CONCATENATE` render logical values as `TRUE` and `FALSE`, including values supplied by cell references.

When `SUMIF` receives a sum range, it must contain the same number of cells as the criteria range; otherwise the grid returns `#VALUE!`. Exported workbooks keep the original formula.

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

This allows dynamic enable/disable of custom function packs. Registering, replacing, or removing a function refreshes formula results in the grid. The default Formula Editor suggestions use the current registry as you type, including when the editor is already open. A non-empty `formulaFunctionList` in editor parameters remains under application control. Alternatively, provide `getFormulaFunctionList: () => string[]` for a custom dynamic suggestion source; a non-empty explicit list takes precedence.

For cell references passed to a custom function, blank dataset values (`null`, `undefined`, or an empty string) are represented as `null`; a formula that evaluates to an empty string remains `''`. Numeric strings and booleans retain their original types. Grouped Excel exports use empty strings for blank helper cells, so custom functions exported to Excel should handle both blank representations.

For `SUM`, `PRODUCT`, `MIN`, `MAX`, `AVERAGE`, `MEDIAN` and `COUNT`, text and booleans in referenced cells are ignored; numeric text and booleans supplied directly as arguments are converted to numbers. `COUNTA` counts a formula that returns empty text, while `COUNTBLANK` also counts it as blank. Disjoint grouped exports preserve this `COUNTA` distinction using helper cells that track whether each source is empty.

### Excel Export Interop
Formula Editor exposes export helpers:
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
- [Example 48](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example48.ts)

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
