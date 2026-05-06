# Large Dataset Performance Guide

This guide summarizes the main options to keep large dataset grids responsive when sorting and exporting.

## When To Use What

- Use `enableFormattedDataCache` when exports rely on formatters (`exportWithFormatter: true`) and the dataset is large.
- Use `preParseDateColumns` when date sorting is slow because date strings are repeatedly parsed.
- Use both when you have large data with formatter-heavy exports and frequent date sorting.

## Export Performance (Formatted Cache)

Enable the DataView formatted cache to pre-compute formatter output in background batches.

```ts
gridOptions = {
  enableFormattedDataCache: true,
  // max rows processed per batch tick (default: 300)
  formattedDataCacheBatchSize: 300,
  // frame-time budget per batch in ms (default: 8)
  formattedDataCacheFrameBudgetMs: 8,
  excelExportOptions: {
    exportWithFormatter: true,
  },
  // or pdfExportOptions: { exportWithFormatter: true }
};
```

Notes:

- Cache population runs in the background and keeps the UI responsive.
- Export services sanitize/decode in their own pipeline, once, at export time.
- Completion events include `durationMs` and can be used for telemetry/spinners.

Example: use vanilla event listeners for formatted cache progress/completion

```ts
let cacheProgressPct = 0;
let cacheDurationMs = 0;

gridContainerElm.addEventListener('onformatteddatacacheprogress', (e: CustomEvent<any>) => {
  const args = e.detail;
  cacheProgressPct = args.percentComplete;
  // example: update a progress label or telemetry
  // console.log(`Cache: ${args.rowsProcessed}/${args.totalRows} (${args.percentComplete}%)`);
});

gridContainerElm.addEventListener('onformatteddatacachecompleted', (e: CustomEvent<any>) => {
  const args = e.detail;
  cacheDurationMs = args.durationMs;
  console.log('Formatted cache completed:', args);
});

gridContainerElm.addEventListener('onafterexporttoexcel', (e: CustomEvent<any>) => {
  console.log('Excel export duration (ms):', e.detail?.durationMs);
});

gridContainerElm.addEventListener('onafterexporttopdf', (e: CustomEvent<any>) => {
  console.log('PDF export duration (ms):', e.detail?.durationMs);
});
```

## Sorting Performance (`preParseDateColumns`)

Date sorting on large datasets can be expensive when values are date strings that need parsing for every comparison.
Use `preParseDateColumns` to parse once and sort on `Date` values afterward.

```ts
gridOptions = {
  // Option 1: prefix mode (keeps original string fields)
  preParseDateColumns: '__',

  // Option 2: overwrite mode (mutates original date fields)
  // preParseDateColumns: true,
};
```

Quick guidance:

- Prefix mode (`'__'`) is safer for compatibility, but uses more memory.
- Overwrite mode (`true`) uses less memory, but changes original field values to `Date`.

You can also trigger parsing manually when needed:

```ts
this.sgb.sortService.preParseAllDateItems();
this.sgb.sortService.preParseSingleDateItem(item);
```

## Related Docs

- [Sorting](../column-functionalities/sorting.md)
- [Export to Excel](../grid-functionalities/export-to-excel.md)
- [Export to PDF](../grid-functionalities/export-to-pdf.md)
