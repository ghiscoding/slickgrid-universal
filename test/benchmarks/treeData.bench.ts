import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterAll, describe, expect, test } from 'vitest';
import { SlickEvent } from '../../packages/common/src/core/slickCore.js';
import { SlickDataView } from '../../packages/common/src/core/slickDataView.js';
import type { SlickGrid } from '../../packages/common/src/core/slickGrid.js';
import type { FilterFactory } from '../../packages/common/src/filters/filterFactory.js';
import type { GridOption, TreeToggledItem } from '../../packages/common/src/interfaces/index.js';
import { FilterService } from '../../packages/common/src/services/filter.service.js';
import { SharedService } from '../../packages/common/src/services/shared.service.js';
import type { SortService } from '../../packages/common/src/services/sort.service.js';
import { TreeDataService } from '../../packages/common/src/services/treeData.service.js';
import { flattenToParentChildArray, unflattenParentChildArrayToTree } from '../../packages/common/src/services/utilities.js';

interface Item {
  id: number;
  file: string;
  size: number;
  __parentId: number | null;
  [prop: string]: any;
}

// Override sizes for a quick run or to include larger trees. The auto-recalc scan was quadratic before
// the tree item index was introduced, keep sizes moderate when benchmarking older revisions.
const sizes = (process.env.TREE_BENCH_SIZES ?? '5000,20000').split(',').map(Number);
const warmups = 2;
const sampleCount = 7;
const results: Array<{ name: string; medianMs: number; p95Ms: number }> = [];
afterAll(() => {
  writeFileSync(
    process.env.TREE_BENCH_REPORT ?? join(tmpdir(), 'tree-data-benchmark.json'),
    JSON.stringify({ node: process.version, sizes, warmups, samples: sampleCount, results }, null, 2)
  );
});

function measure(name: string, run: () => unknown, beforeEach?: () => void): void {
  test(
    name,
    () => {
      const samples: number[] = [];
      for (let i = 0; i < warmups + sampleCount; i++) {
        beforeEach?.();
        const start = performance.now();
        run();
        if (i >= warmups) {
          samples.push(performance.now() - start);
        }
      }
      samples.sort((a, b) => a - b);
      const median = samples[Math.floor(sampleCount / 2)];
      results.push({ name, medianMs: median, p95Ms: samples[sampleCount - 1] });
      console.log(`${name}: median=${median.toFixed(2)}ms p95=${samples[sampleCount - 1].toFixed(2)}ms`);
    },
    600_000
  );
}

/** deterministic tree with a fan-out of 10 children per parent */
function createFlatDataset(size: number): Item[] {
  return Array.from({ length: size }, (_, id) => ({
    id,
    file: `file-${id}`,
    size: id % 100,
    __parentId: id === 0 ? null : Math.floor((id - 1) / 10),
  }));
}

function createGrid(dataView: SlickDataView<any>, gridOptions: GridOption): SlickGrid {
  return {
    getData: () => dataView,
    getOptions: () => gridOptions,
    getColumns: () => [],
    getColumnIndex: () => -1,
    invalidate: () => {},
    setSortColumns: () => {},
    onClick: new SlickEvent(),
    onKeyDown: new SlickEvent(),
  } as unknown as SlickGrid;
}

const pubSubStub = {
  publish: () => {},
  subscribe: () => ({ unsubscribe: () => {} }),
  unsubscribeAll: () => {},
} as unknown as BasePubSubService;

for (const size of sizes) {
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('TREE_BENCH_SIZES must contain positive integer row counts');
  }
  const parentIds = createFlatDataset(size)
    .filter((item) => item.id * 10 + 1 < size)
    .map((item) => item.id);

  describe(`Tree Data / ${size} rows`, () => {
    const gridOptions: GridOption = {
      enableFiltering: true,
      enableTreeData: true,
      treeDataOptions: { columnId: 'file', autoRecalcTotalsOnFilterChange: true },
    };
    const hierarchical = unflattenParentChildArrayToTree(createFlatDataset(size), gridOptions.treeDataOptions);
    const flat = flattenToParentChildArray(hierarchical, { shouldAddTreeLevelNumber: true }) as Item[];
    const dataView = new SlickDataView<Item>();
    dataView.setItems(flat);
    const grid = createGrid(dataView, gridOptions);
    const shared = new SharedService();
    shared.gridOptions = gridOptions;
    shared.hierarchicalDataset = hierarchical;

    // 1. auto-recalc totals requires to find every filtered row in the hierarchical dataset
    const filterService = new FilterService({} as FilterFactory, pubSubStub, shared);
    filterService.init(grid);
    filterService.refreshTreeDataFilters(flat);
    const filterArgs = { columnFilters: {}, grid, dataView };
    const predicate = (item: Item) => filterService.customLocalFilter(item, filterArgs);
    expect(flat.filter(predicate).length).toBe(size);
    expect(hierarchical[0].__filteredOut).toBe(false);
    measure(`${size} / customLocalFilter scan / auto-recalc totals`, () => flat.filter(predicate).length);

    // 2. pre-filtering applies preset toggled (collapsed) parents
    const presetOptions: GridOption = {
      ...gridOptions,
      treeDataOptions: { columnId: 'file' },
      presets: { treeData: { toggledItems: parentIds.map((itemId) => ({ itemId, isCollapsed: true })) } },
    };
    const presetFlat = flattenToParentChildArray(unflattenParentChildArrayToTree(createFlatDataset(size), presetOptions.treeDataOptions), {
      shouldAddTreeLevelNumber: true,
    }) as Item[];
    const presetShared = new SharedService();
    presetShared.gridOptions = presetOptions;
    const presetService = new FilterService({} as FilterFactory, pubSubStub, presetShared);
    presetService.init(createGrid(new SlickDataView(), presetOptions));
    const resetPresets = () => {
      (presetService as any)._isTreePresetExecuted = false;
      presetFlat.forEach((item) => (item.__collapsed = false));
    };
    resetPresets();
    expect(presetService.preFilterTreeData(presetFlat, {}).size).toBe(size);
    expect(presetFlat.filter((item) => item.__collapsed).length).toBe(parentIds.length);
    measure(
      `${size} / preFilterTreeData / ${parentIds.length} preset toggled parents`,
      () => presetService.preFilterTreeData(presetFlat, {}),
      resetPresets
    );

    // 3. toggling many parents also updates their hierarchical (tree) items
    const toggleOptions: GridOption = { ...gridOptions, treeDataOptions: { columnId: 'file' } };
    const toggleHierarchical = unflattenParentChildArrayToTree(createFlatDataset(size), toggleOptions.treeDataOptions);
    const toggleDataView = new SlickDataView<Item>();
    toggleDataView.setItems(flattenToParentChildArray(toggleHierarchical, { shouldAddTreeLevelNumber: true }) as Item[]);
    const toggleShared = new SharedService();
    toggleShared.gridOptions = toggleOptions;
    toggleShared.hierarchicalDataset = toggleHierarchical;
    const treeDataService = new TreeDataService(pubSubStub, {} as FilterService, toggleShared, {} as SortService);
    treeDataService.init(createGrid(toggleDataView, toggleOptions));
    let isCollapsed = false;
    const toggleAllParents = () => {
      isCollapsed = !isCollapsed;
      const toggledItems: TreeToggledItem[] = parentIds.map((itemId) => ({ itemId, isCollapsed }));
      treeDataService.dynamicallyToggleItemState(toggledItems, false);
    };
    toggleAllParents();
    expect(toggleHierarchical[0].__collapsed).toBe(true);
    expect(toggleDataView.getItemById(parentIds[parentIds.length - 1])!.__collapsed).toBe(true);
    measure(`${size} / dynamicallyToggleItemState / ${parentIds.length} parents`, toggleAllParents);
    treeDataService.dispose();

    // 4. conversions between flat and hierarchical datasets (baseline, mostly unchanged)
    const conversionFlat = createFlatDataset(size);
    measure(`${size} / unflattenParentChildArrayToTree`, () => unflattenParentChildArrayToTree(conversionFlat));
    measure(`${size} / flattenToParentChildArray`, () => flattenToParentChildArray(hierarchical, { shouldAddTreeLevelNumber: true }));
  });
}
