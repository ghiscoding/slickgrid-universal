import type { Column, FormulaExcelExportContext } from '@slickgrid-universal/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FORMULA_ERROR } from '../formula-errors.js';
import { FormulaCellEditor } from '../formula.cellEditor.js';
import { FormulaService } from '../formula.service.js';

describe('FormulaService', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should set/get/has formula by row and column ids', () => {
    const service = new FormulaService();

    service.setFormula('id_1', 'total', '=REF(COLUMN("price"),ROW("id_1"))*2');

    expect(service.hasFormula('id_1', 'total')).toBeTruthy();
    expect(service.getFormula('id_1', 'total')).toBe('=REF(COLUMN("price"),ROW("id_1"))*2');
  });

  it('should remove formula when setFormula receives empty value', () => {
    const service = new FormulaService();

    service.setFormula('id_1', 'total', 'A1+B1');
    service.setFormula('id_1', 'total', '');

    expect(service.hasFormula('id_1', 'total')).toBeFalsy();
    expect(service.getFormula('id_1', 'total')).toBeUndefined();
  });

  it('should translate REF() formula syntax into Excel references', () => {
    const service = new FormulaService();
    service.setFormula('id_2', 'total', '=REF(COLUMN("price"),ROW("id_2"))*REF(COLUMN("qty"),ROW("id_2"))');

    const context: FormulaExcelExportContext = {
      columnId: 'total',
      columnIds: ['product', 'price', 'qty', 'total'],
      dataRowIdx: 1,
      datasetIdPropertyName: 'id',
      excelRowOffset: 2,
      gridOptions: {},
      rowId: 'id_2',
      rowIds: ['id_1', 'id_2', 'id_3'],
    };

    expect(service.getExcelFormula(context)).toBe('B3*C3');
  });

  it('should support numeric ROW() references', () => {
    const service = new FormulaService();
    service.setFormula('id_1', 'tax', 'REF(COLUMN("total"),ROW(2))*0.1');

    const context: FormulaExcelExportContext = {
      columnId: 'tax',
      columnIds: ['product', 'price', 'qty', 'total', 'tax'],
      dataRowIdx: 0,
      datasetIdPropertyName: 'id',
      excelRowOffset: 2,
      gridOptions: {},
      rowId: 'id_1',
      rowIds: ['id_1', 'id_2', 'id_3'],
    };

    expect(service.getExcelFormula(context)).toBe('D3*0.1');
  });

  it('should expose workbook export metadata for defined names and custom functions', () => {
    const service = new FormulaService({
      excelDefinedNames: [{ name: 'MY_RANGE', refersTo: 'Sheet1!$B$2:$C$100' }],
      excelCustomFunctions: [{ name: 'CUSTOMSUM', args: ['values'], body: 'SUM(values)' }],
    });

    const definedNames = service.getExcelDefinedNames();
    const customFunctions = service.getExcelCustomFunctions();

    expect(definedNames).toEqual([{ name: 'MY_RANGE', refersTo: 'Sheet1!$B$2:$C$100' }]);
    expect(customFunctions).toEqual([{ name: 'CUSTOMSUM', args: ['values'], body: 'SUM(values)' }]);
    expect(definedNames).not.toBe((service as any)._options.excelDefinedNames);
    expect(customFunctions).not.toBe((service as any)._options.excelCustomFunctions);
  });

  it('should auto-assign FormulaCellEditor on allowFormula columns without explicit model', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'name', field: 'name' },
      { id: 'total', field: 'total', allowFormula: true },
      { id: 'taxes', field: 'taxes', allowFormula: true, editor: { params: { debug: true } } },
    ];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({}),
    } as any;

    service.init(gridStub);

    const totalCol = columns.find((col) => col.id === 'total');
    const taxesCol = columns.find((col) => col.id === 'taxes');

    expect(totalCol?.editor?.model).toBe(FormulaCellEditor);
    expect(taxesCol?.editor?.model).toBe(FormulaCellEditor);
    expect(taxesCol?.editor?.params?.debug).toBe(true);
  });

  it('should not override non-formula custom editors', () => {
    const service = new FormulaService();
    const customEditor = (() => undefined) as any;
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true, editor: { model: customEditor } }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({}),
    } as any;

    service.init(gridStub);

    expect(columns[0].editor?.model).toBe(customEditor);
  });

  it('should stay inert when enableFormulas is explicitly disabled in grid options', () => {
    const service = new FormulaService();
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const setColumnsSpy = vi.fn();

    const gridStub = {
      getColumns: () => columns,
      setColumns: setColumnsSpy,
      getData: () => ({
        getItems: () => [{ id: 1, total: '=A1' }],
        getLength: () => 1,
      }),
      getOptions: () => ({ enableFormulas: false, datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);

    expect(setColumnsSpy).not.toHaveBeenCalled();
    expect(service.hasFormula(1, 'total')).toBe(false);
  });

  it('should warn when formula columns exist without cell-capable selection model options', () => {
    const service = new FormulaService();
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({}),
      getOptions: () => ({ enableSelection: false }),
    } as any;

    service.init(gridStub);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('enableSelection: true');
  });

  it('should not warn when mixed selection model is enabled for formula columns', () => {
    const service = new FormulaService();
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({}),
      getOptions: () => ({
        enableSelection: true,
        selectionOptions: { selectionType: 'mixed' },
      }),
    } as any;

    service.init(gridStub);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should evaluate SUM() with A1 references', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'qty', field: 'qty' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [{ id: 1, price: 10, qty: 3, total: '=SUM(A1,B1)' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'total', '=SUM(A1,B1)');

    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(13);
  });

  it('should evaluate both direct A1 and REF(COLUMN(),ROW()) formula styles', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'qty', field: 'qty' },
      { id: 'totalA1', field: 'totalA1', allowFormula: true },
      { id: 'totalRef', field: 'totalRef', allowFormula: true },
    ];
    const items = [
      {
        id: 1,
        price: 10,
        qty: 4,
        totalA1: '=A1*B1',
        totalRef: '=REF(COLUMN("price"),ROW(1))*REF(COLUMN("qty"),ROW(1))',
      },
    ];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'totalA1', '=A1*B1');
    service.setFormula(1, 'totalRef', '=REF(COLUMN("price"),ROW(1))*REF(COLUMN("qty"),ROW(1))');

    expect(service.getEvaluatedCellValue(1, 'totalA1', items[0].totalA1, 0)).toBe(40);
    expect(service.getEvaluatedCellValue(1, 'totalRef', items[0].totalRef, 0)).toBe(40);
  });

  it('should shift direct A1 references by excelRowOffset during export', () => {
    const gridStub = {
      getData: vi.fn().mockReturnValue({}),
      getColumns: vi.fn().mockReturnValue([{ id: 'price' }, { id: 'qty' }, { id: 'total' }]),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);
    service.setFormula('id_1', 'total', '=SUM(C1,D1)');

    const context: FormulaExcelExportContext = {
      columnId: 'total',
      columnIds: ['price', 'qty', 'total'],
      dataRowIdx: 0,
      datasetIdPropertyName: 'id',
      excelRowOffset: 3,
      gridOptions: {},
      rowId: 'id_1',
      rowIds: ['id_1'],
    };

    expect(service.getExcelFormula(context)).toBe('SUM(C3,D3)');
  });

  it('should return #VALUE! for scalar times range shorthand expressions', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'a', field: 'a' },
      { id: 'b', field: 'b' },
      { id: 'c', field: 'c' },
      { id: 'd', field: 'd' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [
      { id: 1, a: 0, b: 0, c: 2, d: 3, total: '=C1*D1:D3' },
      { id: 2, a: 0, b: 0, c: 9, d: 4, total: 0 },
      { id: 3, a: 0, b: 0, c: 9, d: 5, total: 0 },
    ];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'total', '=C1*D1:D3');

    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(FORMULA_ERROR.VALUE);
  });

  it('should return #VALUE! for scalar times range shorthand with Unicode multiply symbol', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'a', field: 'a' },
      { id: 'b', field: 'b' },
      { id: 'c', field: 'c' },
      { id: 'd', field: 'd' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [
      { id: 1, a: 0, b: 0, c: 2, d: 3, total: '=C1×D1:D3' },
      { id: 2, a: 0, b: 0, c: 9, d: 4, total: 0 },
      { id: 3, a: 0, b: 0, c: 9, d: 5, total: 0 },
    ];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'total', '=C1×D1:D3');

    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(FORMULA_ERROR.VALUE);
  });

  it('should highlight a full range token with a single color class', () => {
    const setCellCssStyles = vi.fn();
    const columns: Column[] = [
      { id: 'a', field: 'a' },
      { id: 'b', field: 'b' },
      { id: 'c', field: 'c' },
      { id: 'd', field: 'd' },
    ];
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      setCellCssStyles,
      removeCellCssStyles: vi.fn(),
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);
    service.renderFormulaReferenceHighlights('=C1:C3');

    expect(setCellCssStyles).toHaveBeenCalledTimes(1);
    const cssHash = setCellCssStyles.mock.calls[0][1] as Record<number, Record<string, string>>;
    expect(cssHash[0].c).toBe('formula-cell-color-1');
    expect(cssHash[1].c).toBe('formula-cell-color-1');
    expect(cssHash[2].c).toBe('formula-cell-color-1');
  });

  it('should preserve formula reference order when assigning highlight colors', () => {
    const setCellCssStyles = vi.fn();
    const columns: Column[] = [
      { id: 'a', field: 'a' },
      { id: 'b', field: 'b' },
      { id: 'c', field: 'c' },
      { id: 'd', field: 'd' },
    ];
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      setCellCssStyles,
      removeCellCssStyles: vi.fn(),
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);
    service.renderFormulaReferenceHighlights('=C1*SUM(D1:D3)');

    expect(setCellCssStyles).toHaveBeenCalledTimes(2);
    expect(setCellCssStyles.mock.calls[0][0]).toBe('formula-ref-highlight-0');
    expect(setCellCssStyles.mock.calls[0][1]).toEqual({ 0: { c: 'formula-cell-color-1' } });
    expect(setCellCssStyles.mock.calls[1][0]).toBe('formula-ref-highlight-1');
    expect(setCellCssStyles.mock.calls[1][1]).toEqual({
      0: { d: 'formula-cell-color-2' },
      1: { d: 'formula-cell-color-2' },
      2: { d: 'formula-cell-color-2' },
    });

    // The same mapping must work when the range is the first reference in the formula.
    setCellCssStyles.mockClear();
    service.renderFormulaReferenceHighlights('=SUM(D1:D3)*C1');

    expect(setCellCssStyles).toHaveBeenCalledTimes(2);
    expect(setCellCssStyles.mock.calls[0][1]).toEqual({
      0: { d: 'formula-cell-color-1' },
      1: { d: 'formula-cell-color-1' },
      2: { d: 'formula-cell-color-1' },
    });
    expect(setCellCssStyles.mock.calls[1][1]).toEqual({ 0: { c: 'formula-cell-color-2' } });
  });

  it('should remap direct A1 references when hidden columns are excluded from export', () => {
    const gridStub = {
      getData: vi.fn().mockReturnValue({}),
      getColumns: vi.fn().mockReturnValue([{ id: 'hiddenId' }, { id: 'price' }, { id: 'qty' }, { id: 'total' }]),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);
    service.setFormula('id_1', 'total', '=SUM(C1,D1)');

    const context: FormulaExcelExportContext = {
      columnId: 'total',
      columnIds: ['price', 'qty', 'total'],
      dataRowIdx: 0,
      datasetIdPropertyName: 'id',
      excelRowOffset: 3,
      gridOptions: {},
      rowId: 'id_1',
      rowIds: ['id_1'],
    };

    expect(service.getExcelFormula(context)).toBe('SUM(B3,C3)');
  });

  it('should evaluate SUM() with ranges', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'qty', field: 'qty' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [
      { id: 1, price: 10, qty: 3, total: '=SUM(A1:B1)' },
      { id: 2, price: 7, qty: 5, total: 0 },
    ];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'total', '=SUM(A1:B1)');

    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(13);
  });

  it('should memoize nested referenced formulas across sibling evaluations in the same tick', () => {
    const trackSpy = vi.fn((value: number) => value);
    const service = new FormulaService({
      customFunctions: {
        TRACK: trackSpy,
      },
    });
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'qty', field: 'qty' },
      { id: 'subTotal', field: 'subTotal', allowFormula: true },
      { id: 'taxes', field: 'taxes', allowFormula: true },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [{ id: 1, price: 10, qty: 3, subTotal: '=TRACK(A1*B1)', taxes: '=C1*0.1', total: '=C1+1' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'subTotal', '=TRACK(A1*B1)');
    service.setFormula(1, 'taxes', '=C1*0.1');
    service.setFormula(1, 'total', '=C1+1');

    expect(service.getEvaluatedCellValue(1, 'taxes', items[0].taxes, 0)).toBe(3);
    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(31);
    expect(trackSpy).toHaveBeenCalledTimes(1);
  });

  it('should return #VALUE! for unicode multiply with scalar-times-range shorthand', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'a', field: 'a' },
      { id: 'b', field: 'b' },
      { id: 'c', field: 'c' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [
      { id: 1, a: 0, b: 2, c: 3, total: '=B1×C1:C3' },
      { id: 2, a: 0, b: 0, c: 4, total: 0 },
      { id: 3, a: 0, b: 0, c: 5, total: 0 },
    ];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'total', '=B1×C1:C3');

    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(FORMULA_ERROR.VALUE);
  });

  it('should evaluate SUMPRODUCT with scalar and range values', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'a', field: 'a' },
      { id: 'b', field: 'b' },
      { id: 'c', field: 'c' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [
      { id: 1, a: 0, b: 2, c: 3, total: '=SUMPRODUCT(B1,C1:C3)' },
      { id: 2, a: 0, b: 0, c: 4, total: 0 },
      { id: 3, a: 0, b: 0, c: 5, total: 0 },
    ];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'total', '=SUMPRODUCT(B1,C1:C3)');

    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(24);
  });

  it('should evaluate custom functions registered through options', () => {
    const service = new FormulaService({
      customFunctions: {
        NET: (amount: number, taxes: number) => amount - taxes,
      },
    });
    const columns: Column[] = [
      { id: 'gross', field: 'gross' },
      { id: 'taxes', field: 'taxes' },
      { id: 'net', field: 'net', allowFormula: true },
    ];
    const items = [{ id: 1, gross: 125, taxes: 20, net: '=NET(A1,B1)' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'net', '=NET(A1,B1)');

    expect(service.getEvaluatedCellValue(1, 'net', items[0].net, 0)).toBe(105);
  });

  it('should evaluate AG-Grid style custom function definitions through options', () => {
    const service = new FormulaService({
      customFunctions: {
        CUSTOMSUM: {
          func: ({ values }: { values: unknown[] }) => values.reduce<number>((total, value) => total + Number(value ?? 0), 0),
        },
      },
    });
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'qty', field: 'qty' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [{ id: 1, price: 10, qty: 3, total: '=CUSTOMSUM(A1,B1)' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'total', '=CUSTOMSUM(A1,B1)');

    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(13);
  });

  it('should flatten range arguments for AG-Grid style custom functions', () => {
    const service = new FormulaService({
      customFunctions: {
        CUSTOMSUM: {
          func: ({ values }: { values: unknown[] }) => values.reduce<number>((total, value) => total + Number(value ?? 0), 0),
        },
      },
    });
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'qty', field: 'qty' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [{ id: 1, price: 2.22, qty: 4, total: '=CUSTOMSUM(A1:B1)' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'total', '=CUSTOMSUM(A1:B1)');

    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBeCloseTo(6.22, 12);
  });

  it('should register custom functions at runtime with bulk API', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'qty', field: 'qty' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [{ id: 1, price: 10, qty: 3, total: '=CUSTOMSUM(A1,B1)' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.registerCustomFunctions({
      CUSTOMSUM: {
        func: ({ values }: { values: unknown[] }) => values.reduce<number>((total, value) => total + Number(value ?? 0), 0),
      },
    });
    service.setFormula(1, 'total', '=CUSTOMSUM(A1,B1)');

    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(13);
  });

  it('should skip auto-assignment when autoAssignEditor is disabled', () => {
    const invalidateSpy = vi.fn();
    const renderSpy = vi.fn();
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: vi.fn(),
      getData: () => ({}),
      getOptions: () => ({ editable: true }),
      invalidate: invalidateSpy,
      render: renderSpy,
    } as any;

    const service = new FormulaService({ autoAssignEditor: false });
    service.init(gridStub);

    expect(gridStub.setColumns).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(renderSpy).not.toHaveBeenCalled();
    expect(columns[0].editor?.model).toBeUndefined();
  });

  it('should restore original formatter/editor config on dispose after auto-assign', () => {
    const invalidateSpy = vi.fn();
    const renderSpy = vi.fn();
    const originalFormatter = vi.fn((_r, _c, value) => `orig:${value}`);
    const columns: Column[] = [
      {
        id: 'total',
        field: 'total',
        allowFormula: true,
        formatter: originalFormatter,
        params: { maxDecimal: 2 },
      },
    ];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({ getItems: () => [], getLength: () => 0 }),
      getOptions: () => ({ editable: true, datasetIdPropertyName: 'id' }),
      invalidate: invalidateSpy,
      render: renderSpy,
      removeCellCssStyles: vi.fn(),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);
    expect(columns[0].editor?.model).toBe(FormulaCellEditor);

    service.dispose();

    expect(columns[0].formatter).toBe(originalFormatter);
    expect(columns[0].editor).toBeUndefined();
    expect(columns[0].params).toEqual({ maxDecimal: 2 });
  });

  it('should fallback to local editable marker formatter when autoAddCustomEditorFormatter is unavailable', () => {
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const items = [{ id: 1, total: '=SUM(1,2)' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ editable: true, datasetIdPropertyName: 'id' }),
      invalidate: vi.fn(),
      render: vi.fn(),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);

    const formatted = columns[0].formatter?.(0, 0, items[0].total, columns[0], items[0], gridStub);
    expect(formatted).toBeInstanceOf(HTMLElement);
    expect((formatted as HTMLElement).className).toContain('editing-field');
    expect((formatted as HTMLElement).textContent).toBe('3');
  });

  it('should keep formatter output untouched when grid is not editable', () => {
    const baseElm = document.createElement('span');
    baseElm.textContent = 'already-formatted';
    const baseFormatter = vi.fn(() => baseElm);

    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true, formatter: baseFormatter }];
    const items = [{ id: 1, total: '=SUM(1,2)' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ editable: false, datasetIdPropertyName: 'id' }),
      invalidate: vi.fn(),
      render: vi.fn(),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);

    const formatted = columns[0].formatter?.(0, 0, items[0].total, columns[0], items[0], gridStub);
    expect(formatted).toBe(baseElm);
  });

  it('should delegate final display to autoAddCustomEditorFormatter when available', () => {
    const autoEditableSpy = vi.fn((_row, _cell, value) => `wrapped:${String(value)}`);
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const items = [{ id: 1, total: '=SUM(1,2)' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ editable: true, datasetIdPropertyName: 'id', autoAddCustomEditorFormatter: autoEditableSpy }),
      invalidate: vi.fn(),
      render: vi.fn(),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);

    const formatted = columns[0].formatter?.(0, 0, items[0].total, columns[0], items[0], gridStub);
    expect(formatted).toBe('wrapped:3');
    expect(autoEditableSpy).toHaveBeenCalledTimes(1);
  });

  it('should wrap HTMLElement formatter output inside editable marker container', () => {
    const baseElm = document.createElement('span');
    baseElm.textContent = 'already-formatted';
    const baseFormatter = vi.fn(() => baseElm);
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true, formatter: baseFormatter }];
    const items = [{ id: 1, total: '=SUM(1,2)' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ editable: true, datasetIdPropertyName: 'id' }),
      invalidate: vi.fn(),
      render: vi.fn(),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);

    const formatted = columns[0].formatter?.(0, 0, items[0].total, columns[0], items[0], gridStub) as HTMLElement;
    expect(formatted).toBeInstanceOf(HTMLElement);
    expect(formatted.className).toContain('editing-field');
    expect(formatted.firstElementChild).toBe(baseElm);
  });

  it('should reuse memoized value when evaluating same formula cell repeatedly in one tick', () => {
    const trackSpy = vi.fn((value: number) => value);
    const service = new FormulaService({
      customFunctions: {
        TRACK: trackSpy,
      },
    });
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'qty', field: 'qty' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [{ id: 1, price: 2, qty: 3, total: '=TRACK(A1*B1)' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
      }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'total', '=TRACK(A1*B1)');

    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(6);
    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(6);
    expect(trackSpy).toHaveBeenCalledTimes(1);
  });

  it('should return false when removing a non-existing formula', () => {
    const service = new FormulaService();

    expect(service.removeFormula('missing-row', 'missing-col')).toBe(false);
  });

  it('should restore only tracked formula columns and keep other columns as-is on dispose', () => {
    const formulaFormatter = vi.fn((_r, _c, value) => `f:${value}`);
    const staticFormatter = vi.fn((_r, _c, value) => `s:${value}`);
    const columns: Column[] = [
      { id: 'name', field: 'name', formatter: staticFormatter },
      { id: 'total', field: 'total', allowFormula: true, formatter: formulaFormatter, params: { precision: 2 } },
    ];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({ getItems: () => [], getLength: () => 0 }),
      getOptions: () => ({ editable: true, datasetIdPropertyName: 'id' }),
      invalidate: vi.fn(),
      render: vi.fn(),
      removeCellCssStyles: vi.fn(),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);
    const beforeDisposeNameFormatter = columns[0].formatter;

    service.dispose();

    expect(columns[0].formatter).toBe(beforeDisposeNameFormatter);
    expect(columns[1].formatter).toBe(formulaFormatter);
    expect(columns[1].params).toEqual({ precision: 2 });
  });

  it('should no-op dispose restore when no formula columns were auto-assigned', () => {
    const columns: Column[] = [{ id: 'name', field: 'name' }];
    const setColumnsSpy = vi.fn((newCols: Column[]) => {
      columns.splice(0, columns.length, ...newCols);
    });

    const gridStub = {
      getColumns: () => columns,
      setColumns: setColumnsSpy,
      getData: () => ({ getItems: () => [], getLength: () => 0 }),
      getOptions: () => ({ editable: true, datasetIdPropertyName: 'id' }),
      invalidate: vi.fn(),
      render: vi.fn(),
      removeCellCssStyles: vi.fn(),
    } as any;

    const service = new FormulaService();
    service.init(gridStub);
    setColumnsSpy.mockClear();

    service.dispose();

    expect(setColumnsSpy).not.toHaveBeenCalled();
  });

  it('should evaluate object cell references as string literals via expression conversion fallback', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'payload', field: 'payload' },
      { id: 'out', field: 'out', allowFormula: true },
    ];
    const items = [{ id: 1, payload: { foo: 'bar' }, out: '=A1' }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'out', '=A1');

    expect(service.getEvaluatedCellValue(1, 'out', items[0].out, '')).toBe('[object Object]');
  });

  it('should handle invalid references, circular references, missing cells, and literal conversion', () => {
    const service = new FormulaService();
    const items = [{ id: 1, value: '=A1' }];
    const columns: Column[] = [{ id: 'value', field: 'value' }];
    const gridStub = {
      getColumns: () => columns,
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;
    service.init(gridStub);

    const context = { visited: new Set<string>(), memo: new Map<string, unknown>() };
    expect((service as any).resolveExcelReferenceValue('?', 1, context)).toBe(FORMULA_ERROR.REF);
    expect((service as any).resolveExcelReferenceValue('A', 0, context)).toBe(FORMULA_ERROR.REF);
    expect((service as any).resolveExcelReferenceValue('B', 1, context)).toBe(FORMULA_ERROR.REF);
    expect((service as any).resolveExcelReferenceValue('A', 2, context)).toBe(FORMULA_ERROR.REF);

    context.visited.add('1::value');
    expect((service as any).resolveExcelReferenceValue('A', 1, context)).toBe(FORMULA_ERROR.REF);
    expect((service as any).getCellRawValue('missing', 'value')).toBeUndefined();
    expect((service as any).getCellRawValue(1, 'missing')).toBeUndefined();

    expect((service as any).toExpressionLiteral(null)).toBe('0');
    expect((service as any).toExpressionLiteral(true)).toBe('true');
    expect((service as any).toExpressionLiteral(false)).toBe('false');
    expect((service as any).toExpressionLiteral(' 12.5 ')).toBe('12.5');
    expect((service as any).toExpressionLiteral('hello')).toBe('"hello"');

    const baseDate = new Date('2024-01-10T00:00:00.000Z');
    expect((FormulaService as any).addFormulaValues(baseDate, 2)).toEqual(new Date('2024-01-12T00:00:00.000Z'));
    expect((FormulaService as any).addFormulaValues(2, baseDate)).toEqual(new Date('2024-01-12T00:00:00.000Z'));
    expect((FormulaService as any).addFormulaValues(2, 3)).toBe(5);
    expect((FormulaService as any).subtractFormulaValues(baseDate, 2)).toEqual(new Date('2024-01-08T00:00:00.000Z'));
    expect((FormulaService as any).subtractFormulaValues(baseDate, new Date('2024-01-08T00:00:00.000Z'))).toBe(2);
    expect((FormulaService as any).subtractFormulaValues(5, 2)).toBe(3);
    expect((FormulaService as any).addDays(baseDate, 1)).toEqual(new Date('2024-01-11T00:00:00.000Z'));
  });

  it('should wrap onFormulaInputChange and invoke user callback without forcing highlight refresh', () => {
    const userCallback = vi.fn();
    const service = new FormulaService();
    const highlightSpy = vi.spyOn(service as any, 'renderFormulaReferenceHighlights');
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true, editor: { params: { onFormulaInputChange: userCallback } } }];

    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => {
        columns.splice(0, columns.length, ...newCols);
      },
      getData: () => ({ getItems: () => [], getLength: () => 0 }),
      getOptions: () => ({ editable: true, datasetIdPropertyName: 'id' }),
      invalidate: vi.fn(),
      render: vi.fn(),
    } as any;

    service.init(gridStub);
    const wrapped = columns[0].editor?.params?.onFormulaInputChange as ((formula: string) => void) | undefined;
    wrapped?.('=A1');

    expect(highlightSpy).not.toHaveBeenCalled();
    expect(userCallback).toHaveBeenCalledWith('=A1');
  });
});
