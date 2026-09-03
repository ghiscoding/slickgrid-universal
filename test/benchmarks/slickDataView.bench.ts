import { afterAll, bench, describe, expect } from 'vitest';
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
    return this.compileFilterCSPSafe(items, args);
  }

  createAccumulatorRunner(aggregator: Aggregator): BenchmarkAccumulatorRunner {
    return this.compileAccumulatorLoopCSPSafe(aggregator);
  }
}

const benchmarkOptions = {
  time: 1_500,
  warmupTime: 500,
};
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
  bench(
    'production loop - numeric with early return',
    () => {
      observedResult += numericDataView.runFilter(items, filterArgs).length;
    },
    benchmarkOptions
  );

  bench(
    'production loop - string predicate',
    () => {
      observedResult += stringDataView.runFilter(items, filterArgs).length;
    },
    benchmarkOptions
  );
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
  bench(
    'production loop',
    () => {
      accumulator.init();
      accumulatorRunner.call(accumulator, items);
      observedResult += accumulator.total;
    },
    benchmarkOptions
  );
});

afterAll(() => {
  expect(numericDataView.runFilter(items, filterArgs)).toHaveLength(25_000);
  expect(stringDataView.runFilter(items, filterArgs)).toHaveLength(3_691);
  expect(observedResult).toBeGreaterThan(0);

  numericDataView.destroy();
  stringDataView.destroy();
});
