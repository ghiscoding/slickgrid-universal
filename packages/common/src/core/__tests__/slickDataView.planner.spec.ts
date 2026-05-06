import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlickDataView } from '../slickDataview.js';
import { SlickGrid } from '../slickGrid.js';

vi.useFakeTimers();

describe('Formatted Data Cache - Planner Architecture', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'myGrid';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.textContent = '';
  });

  describe('Planner API', () => {
    // Use real timers for async cache population
    beforeAll(() => vi.useRealTimers());
    afterAll(() => vi.useFakeTimers());

    const plannerColumns = [
      { id: 'name', field: 'name', name: 'Name', formatter: (_r: number, _c: number, val: any) => `<b>${val}</b>` },
      { id: 'code', field: 'code', name: 'Code', formatter: (_r: number, _c: number, val: any) => `CODE:${val}`, exportWithFormatter: true },
      { id: 'status', field: 'status', name: 'Status', exportCustomFormatter: (_r: number, _c: number, val: any) => `ST:${val}` },
      { id: 'price', field: 'price', name: 'Price' },
    ] as any[];
    const plannerItems = [
      { id: 1, name: 'Alice', code: 'A1', status: 'active', price: 100 },
      { id: 2, name: 'Bob', code: 'B2', status: 'inactive', price: 200 },
    ];

    const waitForCache = (target?: SlickDataView): Promise<void> =>
      new Promise<void>((resolve) => {
        const dataView = target || new SlickDataView({});
        if (!dataView.getCacheStatus().isPopulating) {
          resolve();
          return;
        }
        const handler = () => {
          dataView.onFormattedDataCacheCompleted.unsubscribe(handler);
          resolve();
        };
        dataView.onFormattedDataCacheCompleted.subscribe(handler);
      });

    describe('setFormattedDataCachePlanner() method', () => {
      it('should accept and store a planner callback', () => {
        const dvPlanner = new SlickDataView({});
        const plannerCallback = vi.fn();

        expect((dvPlanner as any).formattedDataCachePlanner).toBeUndefined();
        dvPlanner.setFormattedDataCachePlanner(plannerCallback);
        expect((dvPlanner as any).formattedDataCachePlanner).toBe(plannerCallback);

        dvPlanner.destroy();
      });

      it('should trigger cache clear and repopulation when planner is set', async () => {
        const dvPlanner = new SlickDataView({});
        const gridPlanner = new SlickGrid('#myGrid', dvPlanner, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvPlanner.setGrid(gridPlanner);
        dvPlanner.setItems(plannerItems);
        await waitForCache(dvPlanner);

        const clearSpy = vi.spyOn(dvPlanner, 'clearFormattedDataCache');
        const populateSpy = vi.spyOn(dvPlanner, 'populateFormattedDataCacheAsync');
        const newPlanner = vi.fn().mockReturnValue({ shouldCacheExport: true });

        dvPlanner.setFormattedDataCachePlanner(newPlanner, true);

        expect(clearSpy).toHaveBeenCalled();
        expect(populateSpy).toHaveBeenCalled();

        clearSpy.mockRestore();
        populateSpy.mockRestore();
        gridPlanner.destroy();
        dvPlanner.destroy();
      });

      it('should not trigger refresh when forceRefresh is false', () => {
        const dvPlanner = new SlickDataView({});
        const plannerCallback = vi.fn();
        const populateSpy = vi.spyOn(dvPlanner, 'populateFormattedDataCacheAsync');

        dvPlanner.setFormattedDataCachePlanner(plannerCallback, false);

        expect(populateSpy).not.toHaveBeenCalled();

        populateSpy.mockRestore();
        dvPlanner.destroy();
      });

      it('should return early when setting the same planner without forceRefresh', async () => {
        const dvPlanner = new SlickDataView({});
        const gridPlanner = new SlickGrid('#myGrid', dvPlanner, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvPlanner.setGrid(gridPlanner);
        dvPlanner.setItems(plannerItems);
        await waitForCache(dvPlanner);

        const plannerCallback = vi.fn().mockReturnValue({ shouldCacheExport: true });
        dvPlanner.setFormattedDataCachePlanner(plannerCallback, true);
        await waitForCache(dvPlanner);

        const clearSpy = vi.spyOn(dvPlanner, 'clearFormattedDataCache');
        const populateSpy = vi.spyOn(dvPlanner, 'populateFormattedDataCacheAsync');

        dvPlanner.setFormattedDataCachePlanner(plannerCallback, false);

        expect(clearSpy).not.toHaveBeenCalled();
        expect(populateSpy).not.toHaveBeenCalled();

        clearSpy.mockRestore();
        populateSpy.mockRestore();
        gridPlanner.destroy();
        dvPlanner.destroy();
      });

      it('should override previous planner callback', async () => {
        const dvPlanner = new SlickDataView({});
        const gridPlanner = new SlickGrid('#myGrid', dvPlanner, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvPlanner.setGrid(gridPlanner);
        dvPlanner.setItems(plannerItems);

        const planner1 = vi.fn().mockReturnValue({ shouldCacheExport: true });
        const planner2 = vi.fn().mockReturnValue({ shouldCacheExport: false });

        dvPlanner.setFormattedDataCachePlanner(planner1, true);
        await waitForCache(dvPlanner);

        dvPlanner.setFormattedDataCachePlanner(planner2, true);
        await waitForCache(dvPlanner);

        expect((dvPlanner as any).formattedDataCachePlanner).toBe(planner2);

        gridPlanner.destroy();
        dvPlanner.destroy();
      });

      it('should support clearing planner by passing undefined', () => {
        const dvClear = new SlickDataView({});
        const plannerCallback = vi.fn();

        dvClear.setFormattedDataCachePlanner(plannerCallback);
        expect((dvClear as any).formattedDataCachePlanner).toBe(plannerCallback);

        dvClear.setFormattedDataCachePlanner(undefined);
        expect((dvClear as any).formattedDataCachePlanner).toBeUndefined();

        dvClear.destroy();
      });
    });

    describe('Planner classification in buildCacheContext()', () => {
      it('should invoke planner for each column to determine cache classification', async () => {
        const dvPlanner = new SlickDataView({});
        const gridPlanner = new SlickGrid('#myGrid', dvPlanner, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvPlanner.setGrid(gridPlanner);

        const plannerCallback = vi.fn().mockReturnValue({ shouldCacheExport: true });
        dvPlanner.setFormattedDataCachePlanner(plannerCallback, true);
        dvPlanner.setItems(plannerItems);
        await waitForCache(dvPlanner);

        // Planner should be called for each column
        expect(plannerCallback.mock.calls.length).toBeGreaterThan(0);
        plannerCallback.mock.calls.forEach((call) => {
          expect(call[0]).toHaveProperty('id'); // column
          expect(call[1]).toBeDefined(); // gridOptions
        });

        gridPlanner.destroy();
        dvPlanner.destroy();
      });

      it('should classify columns based on planner output and column-level flags', async () => {
        const exportOnlyPlanner = vi.fn((column: any) => {
          if (column.id === 'status') {
            return { shouldCacheExport: true, useCellFormatterForExport: false };
          }
          return undefined;
        });

        const dvExportOnly = new SlickDataView({});
        const gridExportOnly = new SlickGrid('#myGrid', dvExportOnly, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvExportOnly.setGrid(gridExportOnly);
        dvExportOnly.setFormattedDataCachePlanner(exportOnlyPlanner);
        dvExportOnly.setItems(plannerItems);
        await waitForCache(dvExportOnly);

        // status column with exportCustomFormatter should be in export-only cache
        const exportVal = dvExportOnly.getFormattedCellValue(0, 'status', 'MISS');
        expect(exportVal).not.toBe('MISS');
        expect(exportVal).toContain('ST:');

        gridExportOnly.destroy();
        dvExportOnly.destroy();
      });

      it('should handle planner returning undefined for columns to skip', async () => {
        const selectivePlanner = vi.fn((column: any) => {
          // Only cache export for 'status' column
          if (column.id === 'status') {
            return { shouldCacheExport: true, useCellFormatterForExport: false };
          }
          return undefined;
        });

        const dvSelective = new SlickDataView({});
        const gridSelective = new SlickGrid('#myGrid', dvSelective, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvSelective.setGrid(gridSelective);
        dvSelective.setFormattedDataCachePlanner(selectivePlanner);
        dvSelective.setItems(plannerItems);
        await waitForCache(dvSelective);

        // name column should not be in export cache (planner returns undefined)
        expect(dvSelective.getFormattedCellValue(0, 'name', 'MISS')).toBe('MISS');
        // status column should be in export cache
        expect(dvSelective.getFormattedCellValue(0, 'status', 'MISS')).not.toBe('MISS');

        gridSelective.destroy();
        dvSelective.destroy();
      });

      it('should propagate export options from planner to cache context', async () => {
        const exportOptions = { sanitizeDataExport: true };
        const optionsPlanner = vi.fn().mockReturnValue({
          shouldCacheExport: true,
          exportOptions,
          useCellFormatterForExport: true,
        });

        const dvOptions = new SlickDataView({});
        const gridOptions = new SlickGrid('#myGrid', dvOptions, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvOptions.setGrid(gridOptions);
        dvOptions.setFormattedDataCachePlanner(optionsPlanner);
        dvOptions.setItems(plannerItems);
        await waitForCache(dvOptions);

        // Planner was called with grid options
        expect(optionsPlanner).toHaveBeenCalled();

        gridOptions.destroy();
        dvOptions.destroy();
      });
    });

    describe('Column-level export flags with planner', () => {
      it('should honor column-level exportWithFormatter flag with planner', async () => {
        const dvLevel = new SlickDataView({});
        const gridLevel = new SlickGrid('#myGrid', dvLevel, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvLevel.setGrid(gridLevel);

        // Planner that respects column exportWithFormatter
        const levelPlanner = vi.fn((column: any) => {
          if (column.exportWithFormatter && column.formatter) {
            return { shouldCacheExport: true, useCellFormatterForExport: true };
          }
          return undefined;
        });

        dvLevel.setFormattedDataCachePlanner(levelPlanner);
        dvLevel.setItems(plannerItems);
        await waitForCache(dvLevel);

        // code column has exportWithFormatter → should be cached
        const codeVal = dvLevel.getFormattedCellValue(0, 'code', 'MISS');
        expect(codeVal).not.toBe('MISS');

        gridLevel.destroy();
        dvLevel.destroy();
      });

      it('should honor column-level exportCustomFormatter flag with planner', async () => {
        const dvCustom = new SlickDataView({});
        const gridCustom = new SlickGrid('#myGrid', dvCustom, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvCustom.setGrid(gridCustom);

        // Planner that respects column exportCustomFormatter
        const customPlanner = vi.fn((column: any) => {
          if (column.exportCustomFormatter) {
            return { shouldCacheExport: true, useCellFormatterForExport: false };
          }
          return undefined;
        });

        dvCustom.setFormattedDataCachePlanner(customPlanner);
        dvCustom.setItems(plannerItems);
        await waitForCache(dvCustom);

        // status column has exportCustomFormatter → should be in export cache
        const statusVal = dvCustom.getFormattedCellValue(0, 'status', 'MISS');
        expect(statusVal).not.toBe('MISS');
        expect(statusVal).toContain('ST:');

        gridCustom.destroy();
        dvCustom.destroy();
      });

      it('should use planner output to override column-level flags if needed', async () => {
        const overridePlanner = vi.fn((column: any) => {
          // Override to prevent caching for 'code' column despite exportWithFormatter
          if (column.id === 'code') {
            return undefined;
          }
          if (column.id === 'status') {
            return { shouldCacheExport: true, useCellFormatterForExport: false };
          }
          return undefined;
        });

        const dvOverride = new SlickDataView({});
        const gridOverride = new SlickGrid('#myGrid', dvOverride, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvOverride.setGrid(gridOverride);
        dvOverride.setFormattedDataCachePlanner(overridePlanner);
        dvOverride.setItems(plannerItems);
        await waitForCache(dvOverride);

        // code: planner returns undefined despite exportWithFormatter → not cached
        expect(dvOverride.getFormattedCellValue(0, 'code', 'MISS')).toBe('MISS');
        // status: planner returns config → cached
        expect(dvOverride.getFormattedCellValue(0, 'status', 'MISS')).not.toBe('MISS');

        gridOverride.destroy();
        dvOverride.destroy();
      });
    });

    describe('Planner lifecycle and updates', () => {
      it('should support updating planner without resetting data', async () => {
        const dvUpdate = new SlickDataView({});
        const gridUpdate = new SlickGrid('#myGrid', dvUpdate, plannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvUpdate.setGrid(gridUpdate);
        dvUpdate.setItems(plannerItems);

        const planner1 = vi.fn().mockReturnValue({ shouldCacheExport: true });
        dvUpdate.setFormattedDataCachePlanner(planner1, true);
        await waitForCache(dvUpdate);

        const itemsBeforeUpdate = dvUpdate.getItems();

        const planner2 = vi.fn().mockReturnValue({ shouldCacheExport: false });
        dvUpdate.setFormattedDataCachePlanner(planner2, true);
        await waitForCache(dvUpdate);

        // Items should remain the same
        expect(dvUpdate.getItems()).toEqual(itemsBeforeUpdate);

        gridUpdate.destroy();
        dvUpdate.destroy();
      });
    });
  });

  describe('SlickGrid Planner Sync Integration', () => {
    beforeAll(() => vi.useRealTimers());
    afterAll(() => vi.useFakeTimers());

    const gridPlannerColumns = [
      { id: 'name', field: 'name', name: 'Name', formatter: (_r: number, _c: number, val: any) => `<b>${val}</b>` },
      { id: 'value', field: 'value', name: 'Value', exportWithFormatter: true },
    ] as any[];

    const gridPlannerItems = [{ id: 1, name: 'Test', value: 42 }];

    const waitForCache = (dv: SlickDataView): Promise<void> =>
      new Promise<void>((resolve) => {
        if (!dv.getCacheStatus().isPopulating) {
          resolve();
          return;
        }
        const handler = () => {
          dv.onFormattedDataCacheCompleted.unsubscribe(handler);
          resolve();
        };
        dv.onFormattedDataCacheCompleted.subscribe(handler);
      });

    describe('syncDataViewFormattedCachePlanner() method', () => {
      it('should set planner on DataView during grid initialization', async () => {
        const dv = new SlickDataView({});
        const grid = new SlickGrid('#myGrid', dv, gridPlannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dv.setGrid(grid);
        dv.setItems(gridPlannerItems);

        // Grid constructor should have synced planner to DataView
        expect((dv as any).formattedDataCachePlanner).toBeDefined();

        grid.destroy();
        dv.destroy();
      });

      it('should sync planner when setOptions is called', async () => {
        const dv = new SlickDataView({});
        const grid = new SlickGrid('#myGrid', dv, gridPlannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dv.setGrid(grid);
        dv.setItems(gridPlannerItems);
        await waitForCache(dv);

        // Adding export options should trigger planner sync
        grid.setOptions({ excelExportOptions: { sanitizeDataExport: true } });

        // Planner reference should still be set
        expect((dv as any).formattedDataCachePlanner).toBeDefined();

        grid.destroy();
        dv.destroy();
      });

      it('should sync planner when setData is called', async () => {
        const dv = new SlickDataView({});
        const grid = new SlickGrid('#myGrid', dv, gridPlannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dv.setGrid(grid);
        dv.setItems(gridPlannerItems);
        await waitForCache(dv);

        const newData = [{ id: 2, name: 'New', value: 99 }];

        // setData should sync planner and repopulate cache
        dv.setItems(newData);
        await waitForCache(dv);

        expect(dv.getItems()).toEqual(newData);

        grid.destroy();
        dv.destroy();
      });
    });

    describe('Planner sync with non-DataView scenarios', () => {
      it('should handle grid without custom DataView gracefully', () => {
        const grid = new SlickGrid('#myGrid', [], gridPlannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: false,
        } as any);
        grid.init();

        // Should not crash even with no DataView or cache disabled
        expect(() => grid.setOptions({})).not.toThrow();
        expect(() => grid.setData([])).not.toThrow();

        grid.destroy();
      });

      it('should skip planner sync when cache is disabled', () => {
        const dv = new SlickDataView({});
        const grid = new SlickGrid('#myGrid', dv, gridPlannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: false,
        } as any);
        dv.setGrid(grid);

        // Planner sync should be skipped when cache is disabled
        grid.setOptions({});

        // Verify planner is not set when cache is disabled
        expect((dv as any).formattedDataCachePlanner).toBeUndefined();

        grid.destroy();
        dv.destroy();
      });
    });

    describe('Column-level export flags handling in grid planner', () => {
      it('should classify columns based on exportWithFormatter flag', async () => {
        const dv = new SlickDataView({});
        const grid = new SlickGrid('#myGrid', dv, gridPlannerColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dv.setGrid(grid);
        dv.setItems(gridPlannerItems);
        await waitForCache(dv);

        // value column has exportWithFormatter and should be cached
        const cachedVal = dv.getFormattedCellValue(0, 'value', 'MISS');
        expect(cachedVal).not.toBe('MISS');

        grid.destroy();
        dv.destroy();
      });

      it('should classify columns based on exportCustomFormatter flag', async () => {
        const customColumns = [
          { id: 'name', field: 'name', name: 'Name' },
          {
            id: 'status',
            field: 'status',
            name: 'Status',
            exportCustomFormatter: (_r: number, _c: number, val: any) => `Status: ${val}`,
          },
        ] as any[];

        const dv = new SlickDataView({});
        const grid = new SlickGrid('#myGrid', dv, customColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dv.setGrid(grid);
        dv.setItems([{ id: 1, name: 'Test', status: 'active' }]);
        await waitForCache(dv);

        // status column should be cached with custom formatter
        const cachedStatus = dv.getFormattedCellValue(0, 'status', 'MISS');
        expect(cachedStatus).not.toBe('MISS');
        expect(cachedStatus).toContain('Status:');

        grid.destroy();
        dv.destroy();
      });

      it('should handle mixed columns with and without export formatters', async () => {
        const mixedColumns = [
          { id: 'displayOnly', field: 'displayOnly', name: 'Display Only', formatter: (_r: any, _c: any, val: any) => `<b>${val}</b>` },
          { id: 'exportCustom', field: 'exportCustom', name: 'Export Custom', exportCustomFormatter: (_r: any, _c: any, val: any) => `EXPORT: ${val}` },
          { id: 'dual', field: 'dual', name: 'Dual', formatter: (_r: any, _c: any, val: any) => `[${val}]`, exportWithFormatter: true },
        ] as any[];

        const dv = new SlickDataView({});
        const grid = new SlickGrid('#myGrid', dv, mixedColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dv.setGrid(grid);
        dv.setItems([{ id: 1, displayOnly: 'a', exportCustom: 'b', dual: 'c' }]);
        await waitForCache(dv);

        // displayOnly: in cell cache only
        expect(dv.getCellDisplayValue(0, 'displayOnly', { id: 1 } as any)).toBeDefined();
        expect(dv.getFormattedCellValue(0, 'displayOnly', 'MISS')).toBe('MISS');

        // exportCustom: in export cache only
        expect(dv.getFormattedCellValue(0, 'exportCustom', 'MISS')).not.toBe('MISS');

        // dual: in both caches
        expect(dv.getCellDisplayValue(0, 'dual', { id: 1 } as any)).toBeDefined();
        expect(dv.getFormattedCellValue(0, 'dual', 'MISS')).not.toBe('MISS');

        grid.destroy();
        dv.destroy();
      });
    });
  });
});
