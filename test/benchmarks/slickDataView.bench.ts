import { existsSync } from 'node:fs';
import { afterAll, describe, expect, test, type TestContext } from 'vitest';
import { SlickDataView } from '../../packages/common/src/core/slickDataView.js';
import type { Aggregator } from '../../packages/common/src/interfaces/aggregator.interface.js';

interface BenchmarkItem {
  active: boolean;
  id: number;
  name: string;
  value: number;
}

interface BenchmarkFilterArgs {
  minimumId: number;
  searchTerm: string;
}

type BenchmarkAccumulatorRunner = (items: BenchmarkItem[]) => void;

class BenchmarkDataView extends SlickDataView<BenchmarkItem> {
  runFilter(items: BenchmarkItem[], args: BenchmarkFilterArgs): BenchmarkItem[] {
    return this.filterItems(items, args);
  }

  createAccumulatorRunner(aggregator: Aggregator): BenchmarkAccumulatorRunner {
    return this.compileAccumulatorLoop(aggregator);
  }
}

const benchmarkOptions = {
  time: 1_500,
  warmupTime: 500,
};
// `BENCH_WRITE=1` saves every result as a baseline (in the git-ignored dist folder), any later run compares against it
const isWritingBaseline = process.env.BENCH_WRITE === '1';

/** run a benchmark, then either save its result as a baseline or compare it against the previously saved baseline */
async function runBenchmark(bench: TestContext['bench'], name: string, fn: () => void): Promise<void> {
  const baselinePath = `test/benchmarks/dist/slick-dataview-${name.replace(/\W+/g, '-').toLowerCase()}.json`;
  if (isWritingBaseline) {
    await bench(name, { writeResult: baselinePath }, fn).run(benchmarkOptions);
  } else if (existsSync(baselinePath)) {
    await bench.compare(bench(name, fn), bench.from(`${name} (baseline)`, baselinePath), benchmarkOptions);
  } else {
    await bench(name, fn).run(benchmarkOptions);
  }
}
const items = Array.from<unknown, BenchmarkItem>({ length: 100_000 }, (_, id) => ({
  active: id % 2 === 0,
  id,
  name: `row-${id}`,
  value: id % 101,
}));
const filterArgs: BenchmarkFilterArgs = {
  minimumId: 50_000,
  searchTerm: '99',
};
const numericFilter = (item: BenchmarkItem, args: BenchmarkFilterArgs): boolean => {
  if (!item.active) {
    return false;
  }
  return item.id >= args.minimumId;
};
const stringFilter = (item: BenchmarkItem, args: BenchmarkFilterArgs): boolean => item.name.toLowerCase().includes(args.searchTerm);

const numericDataView = new BenchmarkDataView();
numericDataView.setFilter(numericFilter);
const stringDataView = new BenchmarkDataView();
stringDataView.setFilter(stringFilter);
let observedResult = 0;

describe('SlickDataView filter loop (100,000 items)', () => {
  test('production loop - numeric with early return', ({ bench }) =>
    runBenchmark(bench, 'production loop - numeric with early return', () => {
      observedResult += numericDataView.runFilter(items, filterArgs).length;
    }));

  test('production loop - string predicate', ({ bench }) =>
    runBenchmark(bench, 'production loop - string predicate', () => {
      observedResult += stringDataView.runFilter(items, filterArgs).length;
    }));
});

const accumulator: Aggregator & { total: number } = {
  accumulate(item: BenchmarkItem): void {
    this.total += item.value;
  },
  field: 'value',
  init(): void {
    this.total = 0;
  },
  storeResult(): void {},
  total: 0,
  type: 'sum',
};
const accumulatorRunner = numericDataView.createAccumulatorRunner(accumulator);

describe('SlickDataView accumulator loop (100,000 items)', () => {
  test('production loop', ({ bench }) =>
    runBenchmark(bench, 'accumulator production loop', () => {
      accumulator.init();
      accumulatorRunner.call(accumulator, items);
      observedResult += accumulator.total;
    }));
});

afterAll(() => {
  expect(numericDataView.runFilter(items, filterArgs)).toHaveLength(25_000);
  expect(stringDataView.runFilter(items, filterArgs)).toHaveLength(3_691);
  expect(observedResult).toBeGreaterThan(0);

  numericDataView.destroy();
  stringDataView.destroy();
});
