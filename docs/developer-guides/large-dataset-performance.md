# Large Dataset Performance Guide

This guide summarizes the main options to keep large dataset grids responsive when sorting and exporting.

## When To Use What

- Consider `enableFormattedDataCache` for expensive formatters reused during rendering or export.
- Use `preParseDateColumns` when date sorting is slow because date strings are repeatedly parsed.
- Use both only when profiling identifies expensive repeated formatting and date-string parsing during sorting.

## Export & Rendering Performance (Formatted Cache)

The formatted cache is **disabled by default**. It pre-computes formatter output for reuse during rendering and export.

- **Consider it** for expensive formatters, such as locale-aware dates or complex calculations, reused on mostly static data.
- **Leave it disabled** for cheap formatters, frequent data changes, or when memory is limited. Large row counts alone do not justify caching.
- **Measure the tradeoff:** warmup takes time and memory. Compare scrolling and export performance with caching disabled and fully warmed.

Common numeric date formats such as `YYYY-MM-DD` already use a fast path in v11, so they may benefit less from caching.

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

- Cache population yields between batches but still consumes main-thread time and memory.
- Cache hits avoid formatter calls; misses and non-cacheable display results use the live formatter.
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

### 500K-row demo measurements

An earlier [Example 03](https://ghiscoding.github.io/slickgrid-universal/#/example03) run with 500K rows and eight columns recorded approximately 13 minutes (779,927 ms) to populate four million cells, followed by exports taking 30–35 seconds.

v11 reduced export decoding overhead. A manual Excel export of Example 03 with 500K rows of random data in Microsoft Edge 155 (32 GB RAM laptop) measured:

| Example 03, 500K rows | Before optimization | v11 |
| --- | ---: | ---: |
| Formatted cache enabled | ~21 s | ~11 s |
| Formatted cache disabled | ~23 s | ~10.6 s |

With cheap formatters, such as in this demo, the cache no longer speeds up export. Times are single manual runs and vary by hardware and browser. Include cache warmup time when evaluating its benefit.

The [Example 03](https://ghiscoding.github.io/slickgrid-universal/#/example03) demo enables caching above 10K rows to demonstrate the feature. That demo threshold is not an application recommendation.

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
