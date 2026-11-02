// @vitest-environment jsdom
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, test, vi } from 'vitest';
import type { Column, Formatter, GridOption, SlickDataView, SlickGrid } from '../../packages/common/src/index.js';
import { PdfExportService } from '../../packages/pdf-export/src/pdfExport.service.js';

interface Result {
  name: string;
  medianMs: number;
  p95Ms: number;
  checksum: number;
}

// jsPDF stub with no-op drawing methods, so the benchmark only measures the export service itself.
// It also computes a checksum of every drawn text to verify that the output is identical across revisions.
const pdfStub = vi.hoisted(() => ({ useAutoTable: false, checksum: 0 }));
// jsPDF is only installed in the pdf-export package, so it must be mocked through that path to match the service import
vi.mock('../../packages/pdf-export/node_modules/jspdf', () => {
  function hashText(text: string, x: number, y: number, align = ''): void {
    const input = `${text}|${x.toFixed(2)}|${y.toFixed(2)}|${align}`;
    let hash = pdfStub.checksum;
    for (let i = 0; i < input.length; i++) {
      hash = (Math.imul(hash, 31) + input.charCodeAt(i)) | 0;
    }
    pdfStub.checksum = hash;
  }
  function autoTableStub(opts: any): void {
    hashText(`${JSON.stringify(opts.body).length}${JSON.stringify(opts.columnStyles)}`, 0, 0);
    // header cells alignment is applied by the didParseCell hook
    for (let index = 0; index < opts.body[0].length; index++) {
      const cell = { styles: {} as any };
      opts.didParseCell({ section: 'head', row: { index: 0 }, column: { index }, cell });
      hashText(cell.styles.halign ?? '', index, 0);
    }
  }
  function jsPDFStub(this: any) {
    this.internal = { pageSize: { getWidth: () => 841.89, getHeight: () => 595.28 } };
    this.autoTable = pdfStub.useAutoTable ? autoTableStub : undefined;
  }
  jsPDFStub.prototype = {
    addPage() {},
    getTextWidth: (text: string) => text.length * 5,
    rect() {},
    save() {},
    setDocumentProperties() {},
    setFillColor() {},
    setFontSize() {},
    setTextColor() {},
    text: (text: string, x: number, y: number, opts?: { align?: string }) => hashText(text, x, y, opts?.align),
  };
  return { default: jsPDFStub };
});

const ROW_COUNT = Number(process.env.PDF_BENCH_ROWS ?? 20_000);
const COLUMN_COUNT = 20;
const WARMUP_RUNS = 2;
const SAMPLE_RUNS = 9;
const reportPath = process.env.PDF_BENCH_REPORT ?? join(tmpdir(), 'pdf-export-benchmark.json');
const baselinePath = process.env.PDF_BENCH_BASELINE;
const results: Result[] = [];

const boldFormatter: Formatter = (_row, _cell, value) => `<b>${value}</b>`;
const columns: Column[] = Array.from({ length: COLUMN_COUNT }, (_, idx) => ({
  id: `col${idx}`,
  field: `col${idx}`,
  name: `Column ${idx}`,
  width: 80,
  excludeFromExport: idx === 1,
  formatter: idx % 4 === 0 ? boldFormatter : undefined,
  exportWithFormatter: idx % 4 === 0,
  pdfExportOptions: idx % 3 === 0 ? { textAlign: 'right' } : idx % 5 === 0 ? { textAlign: 'center' } : undefined,
}));
const items = Array.from({ length: ROW_COUNT }, (_, id) => {
  const item: Record<string, any> = { id };
  for (let c = 0; c < COLUMN_COUNT; c++) {
    item[`col${c}`] = c % 2 ? id * c : `R${id}C${c}`;
  }
  return item;
});
// a group title row every 50 data rows
const groupedItems = items.flatMap((item, idx) =>
  idx % 50 === 0 ? [{ __group: true, title: `Group <b>${idx / 50}</b>`, level: 0, collapsed: false }, item] : [item]
);

function createService(rows: any[], isGrouped: boolean): PdfExportService {
  const gridOptions: GridOption = { pdfExportOptions: { sanitizeDataExport: true } };
  const dataView = {
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
    getRowHeight: () => 25,
  } as unknown as SlickGrid;
  const service = new PdfExportService();
  service.init(grid, { get: () => ({ publish() {}, unsubscribeAll() {} }) } as any);
  return service;
}

/** run a few warmup iterations, then keep the median & p95 of the measured samples */
async function measure(name: string, rows: any[], isGrouped: boolean, useAutoTable: boolean): Promise<void> {
  const service = createService(rows, isGrouped);
  pdfStub.useAutoTable = useAutoTable;
  const samples: number[] = [];
  let checksum = 0;
  for (let i = 0; i < WARMUP_RUNS + SAMPLE_RUNS; i++) {
    pdfStub.checksum = 0;
    const start = performance.now();
    expect(await service.exportToPdf({ filename: 'bench' })).toBe(true);
    if (i >= WARMUP_RUNS) {
      samples.push(performance.now() - start);
    }
    checksum = pdfStub.checksum;
  }
  samples.sort((a, b) => a - b);
  results.push({
    name,
    medianMs: +samples[Math.floor(SAMPLE_RUNS / 2)].toFixed(3),
    p95Ms: +samples[Math.ceil(SAMPLE_RUNS * 0.95) - 1].toFixed(3),
    checksum,
  });
}

describe(`PdfExportService (${ROW_COUNT} rows x ${COLUMN_COUNT} columns)`, () => {
  test('AutoTable', () => measure('AutoTable', items, false, true));
  test('fallback renderer', () => measure('fallback renderer', items, false, false));
  test('fallback renderer with grouping', () => measure('fallback renderer with grouping', groupedItems, true, false));
});

afterAll(() => {
  // make sure the jsPDF stub was used (a real jsPDF would not compute any checksum)
  expect(results.every((result) => result.checksum !== 0)).toBe(true);
  writeFileSync(reportPath, JSON.stringify({ node: process.version, rows: ROW_COUNT, results }, null, 2));
  const baseline: Result[] = baselinePath && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')).results : [];
  const lines = results.map(({ name, medianMs, p95Ms, checksum }) => {
    const before = baseline.find((b) => b.name === name);
    const delta = before
      ? `${medianMs <= before.medianMs ? '' : '+'}${(((medianMs - before.medianMs) / before.medianMs) * 100).toFixed(1)}%`
      : '';
    const output = before ? (before.checksum === checksum ? 'same output' : 'OUTPUT DIFFERS') : '';
    return `${name.padEnd(34)} median ${String(medianMs).padStart(8)}ms  p95 ${String(p95Ms).padStart(8)}ms  ${before ? `baseline ${String(before.medianMs).padStart(8)}ms  ${delta}  ${output}` : ''}`;
  });
  // Vitest swallows console output in afterAll hooks of bench runs, so write the summary directly
  process.stdout.write(`\n${lines.join('\n')}\n\nPDF export benchmark report written to ${reportPath}\n`);
});
