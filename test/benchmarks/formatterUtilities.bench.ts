// @vitest-environment jsdom
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import type { SlickGrid } from '../../packages/common/src/core/slickGrid.js';
import { Formatters } from '../../packages/common/src/formatters/formatters.index.js';
import * as formatterUtilities from '../../packages/common/src/formatters/formatterUtilities.js';
import type { Column, Formatter, GridOption, MenuCallbackArgs } from '../../packages/common/src/interfaces/index.js';

type CellReader = (row: number, col: number, item: any) => string;
type CreateExportCellReader = (columnDef: Column, grid: SlickGrid, exportOptions?: any, skipSanitization?: boolean) => CellReader;

interface Item {
  id: number;
  title: string;
  cost: number;
  start: string;
  address: { city: string };
}
interface Result {
  name: string;
  medianMs: number;
  p95Ms: number;
}

const { exportWithFormatterWhenDefined, getCopyCellValue, retrieveFormatterOptions } = formatterUtilities;
// `createExportCellReader` doesn't exist on older revisions, its benchmarks are skipped when missing
const createExportCellReader = (formatterUtilities as any).createExportCellReader as CreateExportCellReader | undefined;

const ROW_COUNT = Number(process.env.FORMATTER_BENCH_ROWS ?? 20_000);
const WARMUP_RUNS = 5;
const SAMPLE_RUNS = 25;
const reportPath = process.env.FORMATTER_BENCH_REPORT ?? join(tmpdir(), 'formatter-utils-benchmark.json');
const baselinePath = process.env.FORMATTER_BENCH_BASELINE;
const results: Result[] = [];

const gridOptions: GridOption = { formatterOptions: { dateSeparator: '.' } };
const grid = { getOptions: () => gridOptions } as unknown as SlickGrid;
const exportOptions = { exportWithFormatter: true };
const items: Item[] = Array.from({ length: ROW_COUNT }, (_, id) => ({
  id,
  title: `Task ${id}`,
  cost: ((id * 7919) % 100_003) + 0.37,
  start: `2024-${String((id % 12) + 1).padStart(2, '0')}-${String((id % 28) + 1).padStart(2, '0')}`,
  address: { city: `City ${id % 100}` },
}));

const stringFormatter: Formatter<Item> = (_row, _cell, value) => `<b>${value}</b>`;
const textResultFormatter: Formatter<Item> = (_row, _cell, value) => ({ text: String(value) });
const cityFormatter: Formatter<Item> = (_row, _cell, value) => value?.city ?? '';

const scenarios: Array<{ name: string; column: Column<Item> }> = [
  { name: 'raw value (no formatter)', column: { id: 'title', field: 'title' } },
  { name: 'string formatter', column: { id: 'title', field: 'title', formatter: stringFormatter } },
  { name: '{ text } formatter result', column: { id: 'title', field: 'title', formatter: textResultFormatter } },
  { name: 'dotted field formatter', column: { id: 'city', field: 'address.city', formatter: cityFormatter } },
  { name: 'Formatters.decimal', column: { id: 'cost', field: 'cost', formatter: Formatters.decimal } },
  { name: 'Formatters.dollar', column: { id: 'cost', field: 'cost', formatter: Formatters.dollar } },
  { name: 'Formatters.dateUs', column: { id: 'start', field: 'start', type: 'dateIso', formatter: Formatters.dateUs } },
];

let observed = 0;

/** run a few warmup iterations, then keep the median & p95 of the measured samples */
function measure(name: string, run: () => number): void {
  for (let i = 0; i < WARMUP_RUNS; i++) {
    observed += run();
  }
  const samples: number[] = [];
  for (let i = 0; i < SAMPLE_RUNS; i++) {
    const start = performance.now();
    observed += run();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  results.push({
    name,
    medianMs: +samples[Math.floor(SAMPLE_RUNS / 2)].toFixed(3),
    p95Ms: +samples[Math.ceil(SAMPLE_RUNS * 0.95) - 1].toFixed(3),
  });
}

describe(`formatterUtilities (${ROW_COUNT} rows)`, () => {
  for (const { name, column } of scenarios) {
    test(`exportWithFormatterWhenDefined / ${name}`, () => {
      measure(`exportWithFormatterWhenDefined / ${name}`, () => {
        let length = 0;
        for (let row = 0; row < ROW_COUNT; row++) {
          length += exportWithFormatterWhenDefined(row, 0, column, items[row], grid, exportOptions, true).length;
        }
        return length;
      });
    });

    test.runIf(!!createExportCellReader)(`createExportCellReader / ${name}`, () => {
      measure(`createExportCellReader / ${name}`, () => {
        const readCell = createExportCellReader!(column, grid, exportOptions, true);
        let length = 0;
        for (let row = 0; row < ROW_COUNT; row++) {
          length += readCell(row, 0, items[row]).length;
        }
        return length;
      });
      // the per-column reader must produce the exact same output as the per-cell function
      const readCell = createExportCellReader!(column, grid, exportOptions, true);
      for (let row = 0; row < 100; row++) {
        expect(readCell(row, 0, items[row])).toBe(exportWithFormatterWhenDefined(row, 0, column, items[row], grid, exportOptions, true));
      }
    });
  }

  test('retrieveFormatterOptions / currency cell', () => {
    const column: Column = { id: 'cost', field: 'cost', params: { maxDecimal: 3 } };
    measure('retrieveFormatterOptions / currency cell', () => {
      let total = 0;
      for (let i = 0; i < ROW_COUNT; i++) {
        total += retrieveFormatterOptions(column, grid, 'currency', 'cell').maxDecimal;
      }
      return total;
    });
  });

  test('getCopyCellValue / string formatter', () => {
    const column: Column = { id: 'title', field: 'title', formatter: stringFormatter, exportWithFormatter: true };
    const args = { grid, column, cell: 0, row: 0 } as MenuCallbackArgs;
    measure('getCopyCellValue / string formatter', () => {
      let length = 0;
      for (let row = 0; row < ROW_COUNT; row++) {
        args.row = row;
        args.dataContext = items[row];
        length += getCopyCellValue(args).length;
      }
      return length;
    });
  });
});

afterAll(() => {
  const dollarColumn = scenarios.find((s) => s.name === 'Formatters.dollar')!.column;
  expect(exportWithFormatterWhenDefined(0, 0, dollarColumn, { ...items[0], cost: 1234.5 }, grid, exportOptions, true)).toBe('$1234.50');
  expect(observed).toBeGreaterThan(0);

  writeFileSync(reportPath, JSON.stringify({ node: process.version, rows: ROW_COUNT, results }, null, 2));
  const baseline: Result[] = baselinePath && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')).results : [];
  const lines = results.map(({ name, medianMs, p95Ms }) => {
    const before = baseline.find((b) => b.name === name)?.medianMs;
    const delta = before ? `${medianMs <= before ? '' : '+'}${(((medianMs - before) / before) * 100).toFixed(1)}%` : '';
    return `${name.padEnd(62)} median ${String(medianMs).padStart(8)}ms  p95 ${String(p95Ms).padStart(8)}ms  ${before ? `baseline ${String(before).padStart(8)}ms  ${delta}` : ''}`;
  });
  // Vitest swallows console output in afterAll hooks of bench runs, so write the summary directly
  process.stdout.write(`\n${lines.join('\n')}\n\nFormatter utilities benchmark report written to ${reportPath}\n`);
});
