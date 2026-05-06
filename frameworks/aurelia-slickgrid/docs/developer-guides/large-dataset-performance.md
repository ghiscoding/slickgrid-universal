# Large Dataset Performance Guide

This guide summarizes the main options to keep large dataset grids responsive when sorting and exporting.

## When To Use What

- Use `enableFormattedDataCache` when exports rely on multiple formatters (`exportWithFormatter: true`) and the dataset is rather large (over 25K rows).
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
- Completion events include durationMs and can be used for telemetry/spinners.

Example: use Aurelia template events for formatted cache progress/completion

```ts
export class MyComponent {
  cacheProgressPct = 0;
  cacheDurationMs = 0;

  handleFormattedDataCacheProgress(_e: unknown, args: { percentComplete: number; rowsProcessed: number; totalRows: number }) {
    this.cacheProgressPct = args.percentComplete;
    // example: update a progress label or telemetry
    // console.log(`Cache: ${args.rowsProcessed}/${args.totalRows} (${args.percentComplete}%)`);
  }

  handleFormattedDataCacheCompleted(_e: unknown, args: { durationMs: number; totalRows: number; totalFormattedCells: number }) {
    this.cacheDurationMs = args.durationMs;
    console.log('Formatted cache completed:', args);
  }
}
```

```html
<aurelia-slickgrid
  grid-id="grid30"
  columns.bind="columns"
  options.bind="gridOptions"
  dataset.bind="dataset"
  on-formatted-data-cache-progress.trigger="handleFormattedDataCacheProgress($event.detail.eventData, $event.detail.args)"
  on-formatted-data-cache-completed.trigger="handleFormattedDataCacheCompleted($event.detail.eventData, $event.detail.args)"
  on-after-export-to-excel.trigger="handleAfterExportToExcel($event.detail.eventData, $event.detail.args)"
  on-after-export-to-pdf.trigger="handleAfterExportToPdf($event.detail.eventData, $event.detail.args)"
>
</aurelia-slickgrid>
```
```ts
export class MyComponent {
  handleAfterExportToExcel(e, args) {
    console.log('Export done in ms:', args?.durationMs);
  }
  handleAfterExportToPdf(e, args) {
    console.log('Export done in ms:', args?.durationMs);
  }
}
```

## Sorting Performance (preParseDateColumns)

Date sorting on large datasets can be expensive when values are date strings that need parsing for every comparison.
Use preParseDateColumns to parse once and sort on Date values afterward.

```ts
gridOptions = {
  // Option 1: prefix mode (keeps original string fields)
  preParseDateColumns: '__',

  // Option 2: overwrite mode (mutates original date fields)
  // preParseDateColumns: true,
};
```

Quick guidance:

- Prefix mode ('__') is safer for compatibility, but uses more memory.
- Overwrite mode (	rue) uses less memory, but changes original field values to Date.

You can also trigger parsing manually when needed:

```ts
this.sgb.sortService.preParseAllDateItems();
this.sgb.sortService.preParseSingleDateItem(item);
```

## Related Docs

- [Sorting](../column-functionalities/sorting.md)
- [Export to Excel](../grid-functionalities/export-to-excel.md)
- [Export to PDF](../grid-functionalities/export-to-pdf.md)
