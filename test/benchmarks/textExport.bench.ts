// @vitest-environment jsdom
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import type { Column, Formatter, GridOption, SlickDataView, SlickGrid, TextExportOption } from '../../packages/common/src/index.js';
import { TextExportService } from '../../packages/text-export/src/textExport.service.js';

interface Result {
  name: string;
  medianMs: number;
  p95Ms: number;
  checksum: number;
}

const ROW_COUNT = Number(process.env.TEXT_BENCH_ROWS ?? 20_000);
const COLUMN_COUNT = 20;
const WARMUP_RUNS = 2;
const SAMPLE_RUNS = 9;
const reportPath = process.env.TEXT_BENCH_REPORT ?? join(tmpdir(), 'text-export-benchmark.json');
const baselinePath = process.env.TEXT_BENCH_BASELINE;
const results: Result[] = [];

const boldFormatter: Formatter = (_row, _cell, value) => `<b>${value}</b>`;
const sumTotalsFormatter = (totals: any, columnDef: Column) => `<b>${totals.sum?.[columnDef.field] ?? ''}</b>`;
const columns: Column[] = Array.from({ length: COLUMN_COUNT }, (_, idx) => ({
  id: `col${idx}`,
  field: `col${idx}`,
  name: `Column ${idx}`,
  width: 80,
  excludeFromExport: idx === 1,
  formatter: idx % 4 === 0 ? boldFormatter : undefined,
  exportWithFormatter: idx % 4 === 0,
  groupTotalsFormatter: idx % 2 ? sumTotalsFormatter : undefined,
}));
const items = Array.from({ length: ROW_COUNT }, (_, id) => {
  const item: Record<string, any> = { id };
  for (let c = 0; c < COLUMN_COUNT; c++) {
    item[`col${c}`] = c % 2 ? id * c : `R${id} "C${c}"`;
  }
  return item;
});
// a group title row before every 50 data rows and a group totals row after them
const groupedItems = items.flatMap((item, idx) => {
  const rows: any[] = [];
  if (idx % 50 === 0) {
    rows.push({ __group: true, title: `Group <b>${idx / 50}</b>`, level: 0, collapsed: false });
  }
  rows.push(item);
  if (idx % 50 === 49) {
    rows.push({ __groupTotals: true, sum: { col3: idx, col5: idx * 2 } });
  }
  return rows;
});

// formatted data cache of the formatter columns, same as the one populated by the DataView when `enableFormattedDataCache` is enabled
const formattedDataCache: Record<number, Record<string, any>> = Object.fromEntries(
  items.map((item) => [
    item.id,
    Object.fromEntries(columns.filter((c) => c.exportWithFormatter).map((c) => [c.id, `<b>${item[c.field]}</b>`])),
  ])
);

/** create a service whose download is replaced by a stub that keeps the output and the time it was produced */
function createService(rows: any[], isGrouped: boolean, gridOptions: GridOption) {
  const dataView = {
    getFormattedCellValue: (_row: number, columnId: string, fallbackValue: any, item: any) =>
      formattedDataCache[item?.id]?.[columnId] ?? fallbackValue,
    getFormattedRowValues: (item: any) => formattedDataCache[item?.id],
    getGrouping: () => (isGrouped ? [{ getter: 'col0' }] : []),
    getItem: (idx: number) => rows[idx],
    getItemMetadata: () => null,
    getLength: () => rows.length,
  } as unknown as SlickDataView;
  const grid = {
    getColumnsInRenderedOrder: () => columns,
    getData: () => dataView,
    getOptions: () => gridOptions,
    getParentRowSpanByCell: () => null,
  } as unknown as SlickGrid;
  const service = new TextExportService();
  service.init(grid, { get: () => ({ publish() {}, unsubscribeAll() {} }) } as any);
  const output = { content: '', endTime: 0 };
  service.startDownloadFile = (options) => {
    output.endTime = performance.now();
    output.content = options.content;
  };
  return { service, output };
}

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  }
  return hash;
}

/** run a few warmup iterations, then keep the median & p95 of the measured samples (the output checksum isn't timed) */
async function measure(name: string, rows: any[], isGrouped: boolean, gridOptions: GridOption, exportOptions: TextExportOption) {
  const { service, output } = createService(rows, isGrouped, gridOptions);
  const samples: number[] = [];
  for (let i = 0; i < WARMUP_RUNS + SAMPLE_RUNS; i++) {
    const start = performance.now();
    expect(await service.exportToFile(exportOptions)).toBe(true);
    if (i >= WARMUP_RUNS) {
      samples.push(output.endTime - start);
    }
  }
  samples.sort((a, b) => a - b);
  results.push({
    name,
    medianMs: +samples[Math.floor(SAMPLE_RUNS / 2)].toFixed(3),
    p95Ms: +samples[Math.ceil(SAMPLE_RUNS * 0.95) - 1].toFixed(3),
    checksum: hashText(output.content),
  });
}

describe(`TextExportService (${ROW_COUNT} rows x ${COLUMN_COUNT} columns)`, () => {
  test('CSV', () => measure('CSV', items, false, {}, { format: 'csv', delimiter: ',' }));
  test('CSV with grouping', () => measure('CSV with grouping', groupedItems, true, {}, { format: 'csv', delimiter: ',' }));
  test('CSV with formatted data cache', () =>
    measure('CSV with formatted data cache', items, false, { enableFormattedDataCache: true }, { format: 'csv', delimiter: ',' }));
  test('TXT with sanitized data', () =>
    measure(
      'TXT with sanitized data',
      items,
      false,
      { textExportOptions: { sanitizeDataExport: true } },
      { format: 'txt', delimiter: '\t' }
    ));
});

afterAll(() => {
  writeFileSync(reportPath, JSON.stringify({ node: process.version, rows: ROW_COUNT, results }, null, 2));
  const baseline: Result[] = baselinePath && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')).results : [];
  const lines = results.map(({ name, medianMs, p95Ms, checksum }) => {
    const before = baseline.find((b) => b.name === name);
    const delta = before
      ? `${medianMs <= before.medianMs ? '' : '+'}${(((medianMs - before.medianMs) / before.medianMs) * 100).toFixed(1)}%`
      : '';
    const sameOutput = before ? (before.checksum === checksum ? 'same output' : 'OUTPUT DIFFERS') : '';
    return `${name.padEnd(32)} median ${String(medianMs).padStart(8)}ms  p95 ${String(p95Ms).padStart(8)}ms  ${before ? `baseline ${String(before.medianMs).padStart(8)}ms  ${delta}  ${sameOutput}` : ''}`;
  });
  // Vitest swallows console output in afterAll hooks of bench runs, so write the summary directly
  process.stdout.write(`\n${lines.join('\n')}\n\nText export benchmark report written to ${reportPath}\n`);
});
