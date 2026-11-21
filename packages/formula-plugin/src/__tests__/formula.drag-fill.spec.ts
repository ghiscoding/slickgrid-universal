import { SlickRange } from '@slickgrid-universal/common';
import type { Column } from '@slickgrid-universal/common';
import { describe, expect, it, vi } from 'vitest';
import { getFillSeriesValue, handleFormulaDragFill, translateFormulaReferences, type FormulaDragFillContext } from '../formula.drag-fill.js';

describe('formula drag-fill', () => {
  it('shifts references without changing A1-shaped function names', () => {
    expect(translateFormulaReferences('=LOG10(A1)+A1(2)', 1, 1)).toBe('=LOG10(B2)+A1(2)');
    expect(translateFormulaReferences('=A1+$B$1', -1, 0)).toBe('=#REF!+$B$1');
    expect(translateFormulaReferences('=A1:B2', 0, -1)).toBe('=#REF!');
    expect(translateFormulaReferences('=$A1+B$2', -1, -1)).toBe('=#REF!+A$2');
  });

  it('should copy one value, continue numeric ranges, and repeat mixed ranges', () => {
    expect(getFillSeriesValue([4], 3)).toBe(4);
    expect(getFillSeriesValue([1, 3], 4)).toBe(9);
    expect(getFillSeriesValue([5, 7], -2)).toBe(1);
    expect(getFillSeriesValue(['10', '20'], 2)).toBe(30);
    expect(getFillSeriesValue(['A', 'B'], 4)).toBe('A');
    expect(getFillSeriesValue([1, 'x'], 3)).toBe('x');
    expect(getFillSeriesValue([], 0)).toBeUndefined();
  });

  it('should assign drag-filled values to a __proto__ field without changing the row prototype', () => {
    const columns: Column[] = [{ id: '__proto__', field: '__proto__', allowFormula: true }];
    const sourceValue = { copied: true };
    const sourceItem: Record<string, unknown> = { id: 'r1' };
    Object.defineProperty(sourceItem, '__proto__', { configurable: true, enumerable: true, value: sourceValue, writable: true });
    const targetItem: Record<string, unknown> = { id: 'r2' };
    const items = [sourceItem, targetItem];
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      getDataItem: (row: number) => items[row],
      getOptions: () => ({}),
    } as any;

    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(0, 0), selectedRange: new SlickRange(0, 0, 1, 0) } as any, {
      grid,
      dataView: { updateItems: vi.fn() } as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: () => undefined,
      setFormula: vi.fn(),
      toStoredFormula: (formula: string) => formula,
      toDisplayFormulaForCell: (formula: string) => formula,
    });

    expect(Object.prototype.hasOwnProperty.call(targetItem, '__proto__')).toBe(true);
    expect(targetItem.__proto__).toBe(sourceValue);
    expect(Object.getPrototypeOf(targetItem)).toBe(Object.prototype);
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

  it('should skip hidden source columns without changing data', () => {
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

    expect(updateItem).not.toHaveBeenCalled();
    expect(items[1].source).toBe(4);
  });

  it('skips read-only target cells', () => {
    const columns: Column[] = [{ id: 'value', field: 'value', allowFormula: true }];
    const items = [
      { id: 'r1', value: 2 },
      { id: 'r2', value: 7 },
    ];
    const setFormula = vi.fn();
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      getDataItem: (row: number) => items[row],
      isCellEditable: (row: number) => row === 0,
      getOptions: () => ({ editable: true }),
    } as any;

    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(0, 0), selectedRange: new SlickRange(0, 0, 1, 0) } as any, {
      grid,
      dataView: { updateItem: vi.fn() } as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: () => undefined,
      setFormula,
      toStoredFormula: (formula: string) => formula,
      toDisplayFormulaForCell: (formula: string) => formula,
    });

    expect(items[1].value).toBe(7);
    expect(setFormula).not.toHaveBeenCalled();

    const fallbackGrid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      getDataItem: (row: number) => items[row],
      getOptions: () => ({ editable: false }),
    } as any;
    const context: any = {
      grid: fallbackGrid,
      dataView: { getItemMetadata: () => undefined, updateItem: vi.fn() } as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: () => undefined,
      setFormula,
      toStoredFormula: (formula: string) => formula,
      toDisplayFormulaForCell: (formula: string) => formula,
    };
    handleFormulaDragFill({ grid: fallbackGrid, prevSelectedRange: new SlickRange(0, 0), selectedRange: new SlickRange(0, 0, 1, 0) } as any, context);

    fallbackGrid.getOptions = () => ({ editable: true });
    context.dataView = {
      getItemMetadata: () => ({ columns: { value: { editorClass: null } } }),
      updateItem: vi.fn(),
    } as any;
    handleFormulaDragFill({ grid: fallbackGrid, prevSelectedRange: new SlickRange(0, 0), selectedRange: new SlickRange(0, 0, 1, 0) } as any, context);
    expect(setFormula).not.toHaveBeenCalled();
  });

  it('uses the grid edit command handler for drag-fill undo', () => {
    const columns: Column[] = [{ id: 'value', field: 'value', allowFormula: true }];
    const items = [
      { id: 'r1', value: '=A1+1' },
      { id: 'r2', value: 7 },
    ];
    let editCommand: any;
    const formulas = new Map([['r1', '=A1+1']]);
    const setFormula = vi.fn((rowId: number | string, _columnId: number | string, formula?: string | null) => {
      if (formula) {
        formulas.set(String(rowId), formula);
      } else {
        formulas.delete(String(rowId));
      }
    });
    const updateItems = vi.fn();
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      getDataItem: (row: number) => items[row],
      getOptions: () => ({
        editCommandHandler: (_item: unknown, _column: Column, command: any) => {
          editCommand = command;
          command.execute();
        },
      }),
    } as any;

    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(0, 0), selectedRange: new SlickRange(0, 0, 1, 0) } as any, {
      grid,
      dataView: { updateItems } as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: (rowId: number | string) => formulas.get(String(rowId)),
      setFormula,
      toStoredFormula: (formula: string) => formula,
      toDisplayFormulaForCell: (formula: string) => formula,
    });

    expect(items[1].value).toBe('=A2+1');
    expect(formulas.get('r2')).toBe('=A2+1');
    editCommand.undo();
    expect(items[1].value).toBe(7);
    expect(formulas.has('r2')).toBe(false);
    expect(updateItems).toHaveBeenCalledTimes(2);
  });

  it('fills visible formulas using logical column indexes when earlier columns are hidden', () => {
    const columns: Column[] = [
      { id: 'hidden', field: 'hidden', hidden: true, allowFormula: true },
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
      { id: 'other', field: 'other', allowFormula: true },
    ];
    const items = [
      { id: 'a', hidden: 'keep', value: 2, total: '=B1', other: 99 },
      { id: 'b', hidden: 'keep', value: 7, total: '', other: 99 },
    ];
    const updateItem = vi.fn();
    const setFormula = vi.fn();
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns.filter((col) => !col.hidden),
      getDataItem: (row: number) => items[row],
      getOptions: () => ({}),
    } as any;
    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(0, 2), selectedRange: new SlickRange(0, 2, 1, 2) } as any, {
      grid,
      dataView: { updateItem } as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: (rowId, colId) => (rowId === 'a' && colId === 'total' ? '=B1' : undefined),
      setFormula,
      toStoredFormula: (formula) => formula,
      toDisplayFormulaForCell: (formula) => formula,
    });
    expect(items[1]).toEqual({ id: 'b', hidden: 'keep', value: 7, total: '=B2', other: 99 });
    expect(setFormula).toHaveBeenCalledWith('b', 'total', '=B2');
    expect(updateItem).toHaveBeenCalledWith('b', items[1]);
  });

  it('fills a horizontal number series across hidden columns without modifying them', () => {
    const columns: Column[] = [
      { id: 'a', field: 'a', allowFormula: true },
      { id: 'hidden', field: 'hidden', hidden: true, allowFormula: true },
      { id: 'b', field: 'b', allowFormula: true },
      { id: 'c', field: 'c', allowFormula: true },
    ];
    const item = { id: 'a', a: 2, hidden: 100, b: 4, c: 0 };
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns.filter((col) => !col.hidden),
      getDataItem: () => item,
      getOptions: () => ({}),
    } as any;
    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(0, 0, 0, 2), selectedRange: new SlickRange(0, 0, 0, 3) } as any, {
      grid,
      dataView: {} as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: () => undefined,
      setFormula: vi.fn(),
      toStoredFormula: (formula) => formula,
      toDisplayFormulaForCell: (formula) => formula,
    });
    expect(item).toEqual({ id: 'a', a: 2, hidden: 100, b: 4, c: 6 });
  });

  it('shifts horizontal formula references by logical columns across a hidden destination', () => {
    const columns: Column[] = [
      { id: 'a', field: 'a', allowFormula: true },
      { id: 'hidden', field: 'hidden', hidden: true, allowFormula: true },
      { id: 'c', field: 'c', allowFormula: true },
    ];
    const item = { id: 'r', a: '=A1', hidden: 'keep', c: '' };
    const setFormula = vi.fn();
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns.filter((column) => !column.hidden),
      getDataItem: () => item,
      getOptions: () => ({}),
    } as any;
    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(0, 0), selectedRange: new SlickRange(0, 0, 0, 2) } as any, {
      grid,
      dataView: {} as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: (_row, column) => (column === 'a' ? '=A1' : undefined),
      setFormula,
      toStoredFormula: (formula) => formula,
      toDisplayFormulaForCell: (formula) => formula,
    });
    expect(item).toEqual({ id: 'r', a: '=A1', hidden: 'keep', c: '=C1' });
    expect(setFormula).toHaveBeenCalledOnce();
    expect(setFormula).toHaveBeenCalledWith('r', 'c', '=C1');
  });

  it('handles missing rows within a numeric seed selection', () => {
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const items = [{ id: 'a', total: 2 }, undefined, { id: 'b', total: 0 }, { id: 'c', total: 0 }];
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      getDataItem: (row: number) => items[row],
      getOptions: () => ({}),
    } as any;
    handleFormulaDragFill({ grid, prevSelectedRange: new SlickRange(0, 0, 1, 0), selectedRange: new SlickRange(0, 0, 3, 0) } as any, {
      grid,
      dataView: {} as any,
      getDatasetIdPropertyName: () => 'id',
      getFormula: () => undefined,
      setFormula: vi.fn(),
      toStoredFormula: (formula) => formula,
      toDisplayFormulaForCell: (formula) => formula,
    });
    expect(items[2]?.total).toBe(2);
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
