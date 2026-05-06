# Large Dataset Performance Guide

This guide summarizes the main options to keep large dataset grids responsive when sorting and exporting.

## When To Use What

- Use `enableFormattedDataCache` when the dataset is large (over 25K rows) and you have formatter-heavy columns (`exportWithFormatter: true`). This improves both **export performance** (cache-first reads in export services) and **UI rendering performance** (once the cache is warm, grid re-renders skip formatter execution).
- Use `preParseDateColumns` when date sorting is slow because date strings are repeatedly parsed.
- Use both when you have large data with formatter-heavy exports and frequent date sorting.

## Export & Rendering Performance (Formatted Cache)

Enable the DataView formatted cache to pre-compute formatter output in background batches. Once warm, it benefits both export services (cache-first reads avoid re-running formatters) and UI rendering (grid cell re-renders read from cache instead of calling formatters again).

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
- Once warm, both export services and UI rendering use cached values instead of re-running formatters.
- Export services sanitize/decode in their own pipeline, once, at export time.
- Completion events include durationMs and can be used for telemetry/spinners.

Example: use Angular template events for formatted cache progress/completion

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
<angular-slickgrid
  gridId="grid12"
  [dataset]="dataset"
  [options]="gridOptions"
  [columns]="columns"
  (onFormattedDataCacheProgress)="handleFormattedDataCacheProgress($event.detail.eventData, $event.detail.args)"
  (onFormattedDataCacheCompleted)="handleFormattedDataCacheCompleted($event.detail.eventData, $event.detail.args)"
  (onAfterExportToExcel)="handleAfterExportToExcel($event.detail.eventData, $event.detail.args)"
  (onAfterExportToPdf)="handleAfterExportToPdf($event.detail.eventData, $event.detail.args)"
>
</angular-slickgrid>
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

#### Live Demo Test ([Example 03](https://ghiscoding.github.io/slickgrid-universal/#/example03) with 500K rows)

**Performance Summary (500K rows, 8 columns):**
- **Cache Population**: ~13 minutes (779,927 ms) for 4M cells
  - Runs in background with MessageChannel + requestAnimationFrame batching
  - UI stays responsive during population
- **Export Time**: 30-35 seconds (consistent regardless of grouping/sorting)
  - Fast because cache hits eliminate formatter overhead
  - DataView's built-in filtering handles visible rows automatically
- **Previous Behavior**: Browser hang (unusable)

_You can try Slickgrid-Universal live demos: [Example 02](https://ghiscoding.github.io/slickgrid-universal/#/example03) and [Example 03](https://ghiscoding.github.io/slickgrid-universal/#/example03) are both enabling the cache when loading more than 10K rows._

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
this.angularGrid.sortService.preParseAllDateItems();
this.angularGrid.sortService.preParseSingleDateItem(item);
```

## Related Docs

- [Sorting](../column-functionalities/sorting.md)
- [Export to Excel](../grid-functionalities/export-to-excel.md)
- [Export to PDF](../grid-functionalities/export-to-pdf.md)
