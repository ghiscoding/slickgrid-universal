import { SlickRange } from '@slickgrid-universal/common';
import type { Column } from '@slickgrid-universal/common';
import { describe, expect, it, vi } from 'vitest';
import { getFillSeriesValue, handleFormulaDragFill, type FormulaDragFillContext } from '../formula.drag-fill.js';

describe('formula drag-fill', () => {
  it('should copy one value, continue numeric ranges, and repeat mixed ranges', () => {
    expect(getFillSeriesValue([4], 3)).toBe(4);
    expect(getFillSeriesValue([1, 3], 4)).toBe(9);
    expect(getFillSeriesValue([5, 7], -2)).toBe(1);
    expect(getFillSeriesValue(['10', '20'], 2)).toBe(30);
    expect(getFillSeriesValue(['A', 'B'], 4)).toBe('A');
    expect(getFillSeriesValue([1, 'x'], 3)).toBe('x');
    expect(getFillSeriesValue([], 0)).toBeUndefined();
  });

  it('should infer a vertical numeric series only in formula-enabled columns', () => {
    const columns: Column[] = [
      { id: 'series', field: 'series', allowFormula: true },
      { id: 'ordinary', field: 'ordinary' },
    ];
    const items = [
      { id: 'r1', series: 1, ordinary: 10 },
      { id: 'r2', series: 3, ordinary: 20 },
      { id: 'r3', series: 0, ordinary: 30 },
      { id: 'r4', series: 0, ordinary: 40 },
    ];
    const updateItems = vi.fn();
    const setFormula = vi.fn();
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      getDataItem: (row: number) => items[row],
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;
    const context: FormulaDragFillContext = {
      grid,
      dataView: { updateItems } as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: () => undefined,
      setFormula,
      toStoredFormula: (formula) => formula,
      toDisplayFormulaForCell: (formula) => formula,
    };

    handleFormulaDragFill(
      {
        grid,
        prevSelectedRange: new SlickRange(0, 0, 1, 1),
        selectedRange: new SlickRange(0, 0, 3, 1),
      } as any,
      context
    );

    expect(items.map((item) => item.series)).toEqual([1, 3, 5, 7]);
    expect(items.map((item) => item.ordinary)).toEqual([10, 20, 30, 40]);
    expect(setFormula).toHaveBeenCalledWith('r3', 'series', null);
    expect(setFormula).toHaveBeenCalledWith('r4', 'series', null);
    expect(updateItems).toHaveBeenCalledOnce();
  });

  it('should infer horizontal numeric series and repeat string values', () => {
    const columns: Column[] = [
      { id: 'a', field: 'a', allowFormula: true },
      { id: 'b', field: 'b', allowFormula: true },
      { id: 'c', field: 'c', allowFormula: true },
      { id: 'd', field: 'd', allowFormula: true },
    ];
    const numericItems = [{ id: 1, a: 10, b: 7, c: 0, d: 0 }];
    const stringItems = [{ id: 1, a: 'A', b: 'B', c: '', d: '' }];

    const fill = (items: any[]) => {
      const grid = {
        getColumns: () => columns,
        getVisibleColumns: () => columns,
        getDataItem: (row: number) => items[row],
        getOptions: () => ({}),
      } as any;
      handleFormulaDragFill(
        {
          grid,
          prevSelectedRange: new SlickRange(0, 0, 0, 1),
          selectedRange: new SlickRange(0, 0, 0, 3),
        } as any,
        {
          grid,
          dataView: {} as any,
          getDatasetIdPropertyName: () => 'id',
          getFormula: () => undefined,
          setFormula: vi.fn(),
          toStoredFormula: (formula: string) => formula,
          toDisplayFormulaForCell: (formula: string) => formula,
        }
      );
    };

    fill(numericItems);
    fill(stringItems);

    expect(numericItems[0]).toEqual({ id: 1, a: 10, b: 7, c: 4, d: 1 });
    expect(stringItems[0]).toEqual({ id: 1, a: 'A', b: 'B', c: 'A', d: 'B' });
  });

  it('should not drag a formula into a column that does not allow formulas', () => {
    const columns: Column[] = [
      { id: 'formula', field: 'formula', allowFormula: true },
      { id: 'ordinary', field: 'ordinary' },
    ];
    const items = [{ id: 1, formula: '=A1', ordinary: 'unchanged' }];
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      getDataItem: (row: number) => items[row],
      getOptions: () => ({ dataItemColumnValueExtractor: (item: any, column: Column) => item[column.field as string] }),
    } as any;

    handleFormulaDragFill(
      {
        grid,
        prevSelectedRange: new SlickRange(0, 0),
        selectedRange: new SlickRange(0, 0, 0, 1),
      } as any,
      {
        grid,
        dataView: {} as any,
        getDatasetIdPropertyName: () => 'id',
        getFormula: (_rowId, columnId) => (columnId === 'formula' ? '=A1' : undefined),
        setFormula: vi.fn(),
        toStoredFormula: (formula: string) => formula,
        toDisplayFormulaForCell: (formula: string) => formula,
      }
    );

    expect(items[0].ordinary).toBe('unchanged');
  });

  it('should ignore incomplete drag ranges and rows without dataset ids', () => {
    const noVisibleColumnsContext = {
      grid: {} as any,
      dataView: {} as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: () => undefined,
      setFormula: vi.fn(),
      toStoredFormula: (formula: string) => formula,
      toDisplayFormulaForCell: (formula: string) => formula,
    } as FormulaDragFillContext;

    expect(() => handleFormulaDragFill({} as any, noVisibleColumnsContext)).not.toThrow();

    const columns: Column[] = [{ id: 'value', field: 'value', allowFormula: true }];
    const setFormula = vi.fn();
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      getDataItem: () => ({ value: 1 }),
      getOptions: () => ({}),
    } as any;
    const context = { ...noVisibleColumnsContext, grid, setFormula };

    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(0, 0), selectedRange: new SlickRange(0, 0) } as any, context);

    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(0, 0), selectedRange: new SlickRange(0, 0, 1, 0) } as any, context);

    expect(setFormula).not.toHaveBeenCalled();
  });

  it('should use the updateItem fallback and data extractors while skipping hidden source values', () => {
    const columns: Column[] = [
      { id: 'source', field: 'source', hidden: true, allowFormula: true },
      { id: 'target', field: 'target', allowFormula: true },
    ];
    const items = [
      { id: 'r1', source: 2, target: 0 },
      { id: 'r2', source: 4, target: 0 },
    ];
    const updateItem = vi.fn();
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      getDataItem: (row: number) => items[row],
      getOptions: () => ({ dataItemColumnValueExtractor: (item: any, column: Column) => item[column.field as string] }),
    } as any;

    handleFormulaDragFill(
      {
        grid,
        prevSelectedRange: new SlickRange(0, 0),
        selectedRange: new SlickRange(0, 0, 1, 0),
      } as any,
      {
        grid,
        dataView: { updateItem } as any,
        getDatasetIdPropertyName: () => 'id',
        getFormula: () => undefined,
        setFormula: vi.fn(),
        toStoredFormula: (formula: string) => formula,
        toDisplayFormulaForCell: (formula: string) => formula,
      }
    );

    expect(updateItem).toHaveBeenCalledWith('r2', items[1]);
    expect(items[1].source).toBeUndefined();
  });

  it('should skip formula fills when visible columns are not present in the full column list', () => {
    const columns: Column[] = [{ id: 'formula', field: 'formula', allowFormula: true }];
    const items = [
      { id: 'r1', formula: '=A1' },
      { id: 'r2', formula: '' },
    ];
    const setFormula = vi.fn();
    const grid = {
      getColumns: () => [],
      getVisibleColumns: () => columns,
      getDataItem: (row: number) => items[row],
      getOptions: () => ({ dataItemColumnValueExtractor: (item: any, column: Column) => item[column.field as string] }),
    } as any;

    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(0, 0), selectedRange: new SlickRange(0, 0, 1, 0) } as any, {
      grid,
      dataView: {} as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: () => '=A1',
      setFormula,
      toStoredFormula: (formula: string) => formula,
      toDisplayFormulaForCell: (formula: string) => formula,
    });

    expect(setFormula).not.toHaveBeenCalled();
  });

  it('should handle corner fills and non-numeric seed values', () => {
    const columns: Column[] = [
      { id: 'a', field: 'a', allowFormula: true },
      { id: 'b', field: 'b', allowFormula: true },
    ];
    const items = Array.from({ length: 3 }, (_unused, id) => ({ id, a: id + 1, b: id + 10 }));
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      getDataItem: (row: number) => items[row],
      getOptions: () => ({}),
    } as any;

    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(1, 1), selectedRange: new SlickRange(0, 0, 2, 1) } as any, {
      grid,
      dataView: {} as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: () => undefined,
      setFormula: vi.fn(),
      toStoredFormula: (formula: string) => formula,
      toDisplayFormulaForCell: (formula: string) => formula,
    });

    expect(getFillSeriesValue([Number.NaN, 2], 1)).toBe(2);
    expect(getFillSeriesValue(['', 2], 1)).toBe(2);
  });
});
