import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import type { SlickGrid } from '../../packages/common/src/core/slickGrid.js';
import type { ColumnSort } from '../../packages/common/src/interfaces/index.js';
import { CollectionService } from '../../packages/common/src/services/collection.service.js';
import { SortService } from '../../packages/common/src/services/sort.service.js';

interface Item {
  id: number;
  value: number;
  label: string;
  date: string;
}
const sizes = (process.env.SORT_BENCH_SIZES ?? '1000,10000').split(',').map(Number);
const results: Array<{ name: string; medianMs: number; p95Ms: number; idsHash: string }> = [];
const service = new SortService({} as any, {} as any, {} as any);
Object.assign(service, { _grid: { getOptions: () => ({}) } as SlickGrid });
const scenarios = [
  { name: 'numeric', field: 'value', type: 'number' },
  { name: 'string', field: 'label', type: 'string' },
  { name: 'date', field: 'date', type: 'dateIso' },
] as const;
afterAll(() =>
  writeFileSync(
    process.env.SORT_BENCH_REPORT ?? join(tmpdir(), 'sort-service-benchmark.json'),
    JSON.stringify({ node: process.version, sizes, results }, null, 2)
  )
);
for (const size of sizes) {
  if (!Number.isSafeInteger(size) || size <= 0) throw new Error('SORT_BENCH_SIZES must contain positive integer row counts');
  // A deterministic permutation ensures each timed run starts with the same unsorted data.
  const items: Item[] = Array.from({ length: size }, (_, id) => ({
    id,
    value: (id * 7919) % 100003,
    label: `row-${String((id * 7919) % 100003).padStart(6, '0')}`,
    date: `2024-01-${String(((id * 7919) % 28) + 1).padStart(2, '0')}`,
  }));
  describe(`SortService / ${size} rows`, () => {
    for (const scenario of scenarios) {
      test(
        scenario.name,
        () => {
          const columns: ColumnSort[] = [
            { columnId: scenario.field, sortAsc: true, sortCol: { id: scenario.field, field: scenario.field, type: scenario.type } },
          ];
          const expected = [...items]
            .sort((a, b) => (a[scenario.field] < b[scenario.field] ? -1 : a[scenario.field] > b[scenario.field] ? 1 : 0))
            .map((item) => item.id);
          const samples: number[] = [];
          let sorted: Item[] = [];
          for (let i = 0; i < 8; i++) {
            sorted = [...items];
            const start = performance.now();
            sorted.sort((a, b) => service.sortComparers(columns, a, b));
            const elapsed = performance.now() - start;
            expect(sorted.map((item) => item.id)).toEqual(expected);
            if (i >= 3) samples.push(elapsed);
          }
          samples.sort((a, b) => a - b);
          const idsHash = createHash('sha256').update(JSON.stringify(expected)).digest('hex');
          results.push({ name: `${size} / ${scenario.name}`, medianMs: samples[2], p95Ms: samples[4], idsHash });
        },
        120_000
      );
    }
  });
}

// Separate scenarios exercise multi-column comparison, prepared dates and tree
// traversal. Each sample constructs its mutable input before starting the timer.
for (const size of sizes) {
  describe(`SortService additional cases / ${size} rows`, () => {
    test('multi-column', () => {
      const items = Array.from({ length: size }, (_, id) => ({ id, group: (id * 13) % 10, value: (id * 7919) % 100003 }));
      const columns: ColumnSort[] = [
        { columnId: 'group', sortAsc: true, sortCol: { id: 'group', field: 'group', type: 'number' } },
        { columnId: 'value', sortAsc: false, sortCol: { id: 'value', field: 'value', type: 'number' } },
      ];
      const expected = [...items].sort((a, b) => a.group - b.group || b.value - a.value).map((row) => row.id);
      const samples: number[] = [];
      for (let i = 0; i < 8; i++) {
        const rows = [...items];
        const start = performance.now();
        rows.sort((a, b) => service.sortComparers(columns, a, b));
        const elapsed = performance.now() - start;
        expect(rows.map((row) => row.id)).toEqual(expected);
        if (i >= 3) samples.push(elapsed);
      }
      samples.sort((a, b) => a - b);
      results.push({
        name: `${size} / multi-column`,
        medianMs: samples[2],
        p95Ms: samples[4],
        idsHash: createHash('sha256').update(JSON.stringify(expected)).digest('hex'),
      });
    }, 120_000);

    test('prepared dates', () => {
      const items = Array.from({ length: size }, (_, id) => ({ id, __date: new Date(Date.UTC(2024, 0, ((id * 7919) % 28) + 1)) }));
      const preparedService = new SortService({} as any, {} as any, {} as any);
      Object.assign(preparedService, { _grid: { getOptions: () => ({ preParseDateColumns: '__' }) } as SlickGrid });
      const columns: ColumnSort[] = [{ columnId: 'date', sortAsc: true, sortCol: { id: 'date', field: 'date', type: 'dateIso' } }];
      const expected = [...items].sort((a, b) => a.__date.valueOf() - b.__date.valueOf()).map((row) => row.id);
      const samples: number[] = [];
      for (let i = 0; i < 8; i++) {
        const rows = [...items];
        const start = performance.now();
        rows.sort((a, b) => preparedService.sortComparers(columns, a, b));
        const elapsed = performance.now() - start;
        expect(rows.map((row) => row.id)).toEqual(expected);
        if (i >= 3) samples.push(elapsed);
      }
      samples.sort((a, b) => a - b);
      results.push({
        name: `${size} / prepared dates`,
        medianMs: samples[2],
        p95Ms: samples[4],
        idsHash: createHash('sha256').update(JSON.stringify(expected)).digest('hex'),
      });
    }, 120_000);

    test('tree with two equivalent sort fields', () => {
      const groupSize = 100;
      const original = Array.from({ length: Math.ceil(size / groupSize) }, (_, group) => ({
        id: group,
        value: (group * 7919) % 100003,
        children: Array.from({ length: Math.min(groupSize, size - group * groupSize) }, (_, child) => ({
          id: group * groupSize + child,
          value: (child * 7919) % 100003,
        })),
      }));
      const columns: ColumnSort[] = [
        { columnId: 'value', sortAsc: true, sortCol: { id: 'value', field: 'value', type: 'number' } },
        { columnId: 'value-again', sortAsc: true, sortCol: { id: 'value-again', field: 'value', type: 'number' } },
      ];
      const expected = original
        .map((row) => ({ ...row, children: [...row.children].sort((a, b) => a.value - b.value) }))
        .sort((a, b) => a.value - b.value);
      const samples: number[] = [];
      for (let i = 0; i < 8; i++) {
        const rows = original.map((row) => ({ ...row, children: [...row.children] }));
        const start = performance.now();
        service.sortTreeData(rows, columns);
        const elapsed = performance.now() - start;
        expect(rows).toEqual(expected);
        if (i >= 3) samples.push(elapsed);
      }
      samples.sort((a, b) => a - b);
      results.push({
        name: `${size} / tree equivalent fields`,
        medianMs: samples[2],
        p95Ms: samples[4],
        idsHash: createHash('sha256').update(JSON.stringify(expected)).digest('hex'),
      });
    }, 120_000);
  });
}

for (const size of sizes) {
  describe(`CollectionService / ${size} rows`, () => {
    const labels = Object.fromEntries(Array.from({ length: 17 }, (_, id) => [`key-${id}`, `label-${String(16 - id).padStart(2, '0')}`]));
    const collectionService = new CollectionService({ translate: (key: string) => labels[key] } as any);
    const items = Array.from({ length: size }, (_, id) => ({ id, group: id % 10, value: (id * 7919) % 100003, label: `key-${id % 17}` }));
    for (const mode of ['single numeric', 'multiple numeric', 'translated string', 'primitive numeric'] as const) {
      test(
        mode,
        () => {
          const column = { id: 'value', field: 'value', type: 'number' as const };
          const input = mode === 'primitive numeric' ? items.map((row) => row.value) : items;
          const sorters =
            mode === 'multiple numeric'
              ? [
                  { property: 'group', fieldType: 'number' as const },
                  { property: 'value', fieldType: 'number' as const, sortDesc: true },
                ]
              : mode === 'translated string'
                ? { property: 'label', fieldType: 'string' as const }
                : mode === 'primitive numeric'
                  ? {}
                  : { property: 'value' };
          const expected =
            mode === 'primitive numeric'
              ? [...(input as number[])].sort((a, b) => a - b)
              : [...items].sort((a, b) =>
                  mode === 'multiple numeric'
                    ? a.group - b.group || b.value - a.value
                    : mode === 'translated string'
                      ? labels[a.label] === labels[b.label]
                        ? 0
                        : labels[a.label] < labels[b.label]
                          ? -1
                          : 1
                      : a.value - b.value
                );
          const samples: number[] = [];
          for (let i = 0; i < 8; i++) {
            const rows = [...input];
            const start = performance.now();
            const output = collectionService.sortCollection(column, rows, sorters, mode === 'translated string');
            const elapsed = performance.now() - start;
            expect(output).toBe(rows);
            expect(output).toEqual(expected);
            if (i >= 3) samples.push(elapsed);
          }
          samples.sort((a, b) => a - b);
          results.push({
            name: `${size} / collection ${mode}`,
            medianMs: samples[2],
            p95Ms: samples[4],
            idsHash: createHash('sha256').update(JSON.stringify(expected)).digest('hex'),
          });
        },
        120_000
      );
    }
  });
}
