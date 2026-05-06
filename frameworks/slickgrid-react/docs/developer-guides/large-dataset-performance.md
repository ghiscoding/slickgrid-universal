# Large Dataset Performance Guide

This guide summarizes the main options to keep large dataset grids responsive when sorting and exporting.

## When To Use What

- Use enableFormattedDataCache when exports rely on formatters (exportWithFormatter: true) and the dataset is large.
- Use preParseDateColumns when date sorting is slow because date strings are repeatedly parsed.
- Use both when you have large data with formatter-heavy exports and frequent date sorting.

## Export Performance (Formatted Cache)

Enable the DataView formatted cache to pre-compute formatter output in background batches.

```tsx
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

Example: use React event callbacks for formatted cache progress/completion

```tsx
import { useState } from 'react';

export function MyComponent() {
  const [cacheProgressPct, setCacheProgressPct] = useState(0);
  const [cacheDurationMs, setCacheDurationMs] = useState(0);

  function handleFormattedDataCacheProgress(_e: unknown, args: { percentComplete: number; rowsProcessed: number; totalRows: number }) {
    setCacheProgressPct(args.percentComplete);
    // example: update a progress label or telemetry
    // console.log(`Cache: ${args.rowsProcessed}/${args.totalRows} (${args.percentComplete}%)`);
  }

  function handleFormattedDataCacheCompleted(_e: unknown, args: { durationMs: number; totalRows: number; totalFormattedCells: number }) {
    setCacheDurationMs(args.durationMs);
    console.log('Formatted cache completed:', args);
  }

  function handleAfterExportToExcel(e, args) {
    console.log('Export done in ms:', args?.durationMs);
  }

  function handleAfterExportToPdf(e, args) {
    console.log('Export done in ms:', args?.durationMs);
  }

  return (
    <SlickgridReact
      gridId="grid30"
      columns={columns}
      options={gridOptions}
      dataset={dataset}
      onFormattedDataCacheProgress={($event) => handleFormattedDataCacheProgress($event.detail.eventData, $event.detail.args)}
      onFormattedDataCacheCompleted={($event) => handleFormattedDataCacheCompleted($event.detail.eventData, $event.detail.args)}
      onAfterExportToExcel={($event) => handleAfterExportToExcel($event.detail.eventData, $event.detail.args)}
      onAfterExportToPdf={($event) => handleAfterExportToPdf($event.detail.eventData, $event.detail.args)}
    />
  );
}
```

## Sorting Performance (preParseDateColumns)

Date sorting on large datasets can be expensive when values are date strings that need parsing for every comparison.
Use preParseDateColumns to parse once and sort on Date values afterward.

```tsx
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

```tsx
reactGrid.current.sortService.preParseAllDateItems();
reactGrid.current.sortService.preParseSingleDateItem(item);
```

## Related Docs

- [Sorting](../column-functionalities/sorting.md)
- [Export to Excel](../grid-functionalities/export-to-excel.md)
- [Export to PDF](../grid-functionalities/export-to-pdf.md)
