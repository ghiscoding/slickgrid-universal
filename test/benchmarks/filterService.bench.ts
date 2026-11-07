import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterAll, describe, expect, test } from 'vitest';
import { SlickDataView } from '../../packages/common/src/core/slickDataView.js';
import type { SlickGrid } from '../../packages/common/src/core/slickGrid.js';
import { getParsedSearchTermsByFieldType } from '../../packages/common/src/filter-conditions/filterConditionProcesses.js';
import type { FilterFactory } from '../../packages/common/src/filters/filterFactory.js';
import type { ColumnFilters } from '../../packages/common/src/interfaces/index.js';
import { FilterService } from '../../packages/common/src/services/filter.service.js';
import { SharedService } from '../../packages/common/src/services/shared.service.js';

interface Item {
  id: number;
  name: string;
  value: number;
  date: string;
  nested: { value: number };
}

interface Scenario {
  name: string;
  filters: ColumnFilters;
  matches: (item: Item) => boolean;
}

function filter(field: string, type: 'string' | 'number' | 'dateIso', operator: string, searchTerms: string[]): ColumnFilters {
  return {
    [field]: {
      columnId: field,
      columnDef: { id: field, field, type },
      operator,
      searchTerms,
      parsedSearchTerms: getParsedSearchTermsByFieldType(searchTerms, type),
    },
  } as ColumnFilters;
}

// Override sizes for a quick run or to include 500k rows. Data and expected results
// are prepared outside timing; comparisons check exact IDs, not just row counts.
const sizes = (process.env.FILTER_BENCH_SIZES ?? '10000,100000').split(',').map(Number);
const results: Array<{ name: string; medianMs: number; p95Ms: number }> = [];
afterAll(() => {
  writeFileSync(
    process.env.FILTER_BENCH_REPORT ?? join(tmpdir(), 'filter-service-benchmark.json'),
    JSON.stringify({ node: process.version, sizes, samples: 15, results }, null, 2)
  );
});
function measure(name: string, run: () => unknown): void {
  test(
    name,
    () => {
      for (let i = 0; i < 3; i++) run();
      const samples: number[] = [];
      for (let i = 0; i < 15; i++) {
        const start = performance.now();
        run();
        samples.push(performance.now() - start);
      }
      samples.sort((a, b) => a - b);
      results.push({ name, medianMs: samples[7], p95Ms: samples[14] });
      console.log(`${name}: median=${samples[7].toFixed(2)}ms p95=${samples[14].toFixed(2)}ms`);
    },
    120_000
  );
}
for (const size of sizes) {
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('FILTER_BENCH_SIZES must contain positive integer row counts');
  }
  const items: Item[] = Array.from({ length: size }, (_, id) => ({
    id,
    name: `row-${id}`,
    value: id % 100,
    date: `2026-01-${String((id % 28) + 1).padStart(2, '0')}`,
    nested: { value: id % 100 },
  }));
  const scenarios: Scenario[] = [
    { name: 'numeric / broad', filters: filter('value', 'number', '>=', ['10']), matches: (item) => item.value >= 10 },
    { name: 'text / selective', filters: filter('name', 'string', 'Contains', ['999']), matches: (item) => item.name.includes('999') },
    { name: 'text / no matches', filters: filter('name', 'string', 'Contains', ['missing']), matches: () => false },
    { name: 'nested field', filters: filter('nested.value', 'number', '>=', ['90']), matches: (item) => item.nested.value >= 90 },
    {
      name: 'date range',
      filters: filter('date', 'dateIso', 'RangeInclusive', ['2026-01-10', '2026-01-20']),
      matches: (item) => item.date >= '2026-01-10' && item.date <= '2026-01-20',
    },
    {
      name: 'two filters / early rejection',
      filters: { ...filter('value', 'number', '>=', ['90']), ...filter('name', 'string', 'Contains', ['99']) },
      matches: (item) => item.value >= 90 && item.name.includes('99'),
    },
    { name: 'cleared', filters: {}, matches: () => true },
  ];

  describe(`FilterService / ${size} rows`, () => {
    for (const scenario of scenarios) {
      const dataView = new SlickDataView<Item>();
      const shared = new SharedService();
      shared.gridOptions = {};
      // These collaborators are unused by the local predicate; no UI is mounted.
      const service = new FilterService({} as FilterFactory, {} as BasePubSubService, shared);
      const columns = Object.values(scenario.filters).map((entry) => entry.columnDef);
      const grid = {
        getData: () => dataView,
        getColumns: () => columns,
        getColumnIndex: (id: string) => columns.findIndex((column) => column.id === id),
      } as unknown as SlickGrid;
      service.init(grid);
      const args = { columnFilters: scenario.filters, grid, dataView };
      const predicate = (item: Item) => service.customLocalFilter(item, args);
      const expectedIds = items.filter(scenario.matches).map((item) => item.id);
      expect(items.filter(predicate).map((item) => item.id)).toEqual(expectedIds);
      dataView.setItems(items);
      dataView.setFilter(predicate);
      expect(Array.from({ length: dataView.getLength() }, (_, index) => dataView.getItem(index).id)).toEqual(expectedIds);

      measure(`${size} / ${scenario.name} / predicate scan`, () => items.filter(predicate).length);
      measure(`${size} / ${scenario.name} / DataView refresh`, () => dataView.refresh());
    }
  });
}
