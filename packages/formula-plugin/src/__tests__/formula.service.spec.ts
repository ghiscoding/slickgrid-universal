import { Formatters, SlickEvent, SlickRange } from '@slickgrid-universal/common';
import type { Column, FormulaExcelExportContext } from '@slickgrid-universal/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FORMULA_ERROR } from '../formula-errors.js';
import { FormulaCellEditor } from '../formula.cellEditor.js';
import { translateFormulaReferences } from '../formula.drag-fill.js';
import { FormulaService } from '../formula.service.js';

describe('FormulaService', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should expose and merge service options', () => {
    const service = new FormulaService({ autoAssignEditor: false });

    expect(service.getOptions()).toEqual({ autoAssignEditor: false });
    service.setOptions({ enableExcelHeaderPrefix: false });

    expect(service.getOptions()).toEqual({ autoAssignEditor: false, enableExcelHeaderPrefix: false });
  });

  it('should cover service lifecycle and conversion guard paths', () => {
    const columns: Column[] = [{ id: 'value', field: 'value', allowFormula: true }];
    const items = [{ id: 'r1', value: '=A1' }];
    const onDragReplaceCells = new SlickEvent();
    const gridStub = {
      onDragReplaceCells,
      getColumns: () => columns,
      setColumns: (nextColumns: Column[]) => columns.splice(0, columns.length, ...nextColumns),
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ datasetIdPropertyName: 'id', enableSelection: true, selectionOptions: { selectionType: 'mixed' } }),
      setCellCssStyles: vi.fn(),
      invalidate: vi.fn(),
      render: vi.fn(),
    } as any;
    const service = new FormulaService();
    service.init(gridStub);

    service.clearFormulaReferenceHighlights();
    service.renderFormulaReferenceHighlights();
    service.renderFormulaReferenceHighlights('=Z1');
    expect(service.extractExcelReferences('=A1')).toEqual([{ col: 'A', row: 1 }]);
    service.clearFormulas();
    expect(service.hasFormula('r1', 'value')).toBe(false);
    service.setFormula('r1', 'value', '=A1');
    expect(service.removeFormula('r1', 'value')).toBe(true);
    expect(service.unregisterCustomFunction('missing')).toBe(false);
    expect(service.getExcelFormula({ rowId: 'r1', columnId: 'value', columnIds: ['value'], rowIds: ['r1'], excelRowOffset: 1 } as any)).toBeUndefined();
    expect(service.getExcelDefinedNames()).toEqual([]);
    expect(service.getExcelCustomFunctions()).toEqual([]);
    expect((service as any).shiftDirectExcelReferences('', [], [], 0)).toBe('');

    (service as any)._dataView = { getItems: () => items };
    expect((service as any).getDatasetLength()).toBe(1);
    (service as any)._dataView = {};
    expect((service as any).getDatasetLength()).toBe(0);

    const fallbackService = new FormulaService();
    expect(fallbackService.getEvaluatedCellValue('missing', 'value', 42)).toBe(42);
    const noColumnsService = new FormulaService();
    noColumnsService.init({ getColumns: () => [], getData: () => ({ getItems: () => [], getLength: () => 0 }), getOptions: () => ({}) } as any);
    noColumnsService.syncFormulasFromDataset();

    const missingIdService = new FormulaService();
    missingIdService.init({
      getColumns: () => [{ id: 'value', field: 'value', allowFormula: true }],
      getData: () => ({ getItems: () => [{ value: '=A1' }], getLength: () => 1 }),
      getOptions: () => ({}),
    } as any);

    const flagService = new FormulaService();
    (flagService as any)._formulaReferenceAbsoluteFlagsByKey.set('r::value', [{ column: true, row: false }]);
    expect((flagService as any).applyFormulaReferenceAbsoluteFlags('r::value', '=A1+B1')).toBe('=$A1+B1');
    (flagService as any)._grid = { getColumns: () => [{ id: 'value', field: 'value' }], getOptions: () => ({}) };
    (flagService as any)._dataView = { getItems: () => [{ id: 'r', value: '=A1' }] };
    (flagService as any)._formulaStore.set('orphan::value', '=A1');
    (flagService as any)._formulaCoordinatesByKey.set('r::value', { rowId: 'r', columnId: 'value' });
    (flagService as any)._formulaStore.set('r::value', '=A1');
    (flagService as any).canonicalizeStoredFormulas();
    expect((flagService as any).getFormula('r', 'value')).toContain('REF(COLUMN("value")');

    const pipelineService = new FormulaService();
    const formulaFormatter = () => 'formula';
    (formulaFormatter as any).__formulaEvalFormatter = true;
    const multiple = (Formatters as any).multiple;
    const withExisting = (pipelineService as any).withFormulaFormatterPipeline(
      { params: { formatters: [formulaFormatter] }, formatter: multiple },
      formulaFormatter
    );
    expect(withExisting.params.formatters).toEqual([formulaFormatter]);
    const withMissingFormula = (pipelineService as any).withFormulaFormatterPipeline({ params: { formatters: [] }, formatter: multiple }, () => 'formula');
    expect(withMissingFormula.params.formatters).toHaveLength(1);
    const wrappedFormatter = () => 'base';
    (wrappedFormatter as any).__formulaAutoEditableWrapped = true;
    (wrappedFormatter as any).__formulaAutoEditableBaseFormatter = () => 'original';
    expect((pipelineService as any).unwrapAutoEditableFormatter(wrappedFormatter)()).toBe('original');
    expect((pipelineService as any).normalizeFormulaSyntax('')).toBe('');

    expect((flagService as any).convertA1ReferencesToStableRefs('=A0:B1', ['value'], ['r'])).toBe('=A0:B1');
    expect((flagService as any).convertA1ReferencesToStableRefs('=A1:B1', ['value'], ['r'])).toBe('=A1:B1');
    expect((flagService as any).replaceRefFunctionsWithA1Refs('', ['value'], ['r'])).toBe('');
    expect((flagService as any).replaceRefFunctionsWithA1Refs('=REF(COLUMN("value"),ROW("missing"))', ['value'], ['r'])).toBe('=');

    (flagService as any)._dataView = { getItems: () => [{ id: 'r', value: '' }] };
    flagService.setFormula('r', 'value', '=1');
    vi.spyOn(flagService as any, 'evaluateFormulaExpression')
      .mockReturnValueOnce(Number.POSITIVE_INFINITY)
      .mockReturnValueOnce(Number.NaN);
    expect(flagService.getEvaluatedCellValue('r', 'value', '=1', 0)).toBe(FORMULA_ERROR.DIV0);
    flagService.registerCustomFunction('NAN', () => Number.NaN);
    flagService.setFormula('r', 'value', '=2');
    expect(flagService.getEvaluatedCellValue('r', 'value', '=2', 0)).toBe(FORMULA_ERROR.VALUE);
    flagService.setFormula('r', 'value', '=Z1');
    expect(flagService.getEvaluatedCellValue('r', 'value', '=Z1', 0)).toBe(FORMULA_ERROR.REF);
    expect((flagService as any).evaluateExpressionWithParser('"x"^2', new Map())).toBe(FORMULA_ERROR.NUM);
  });

  it('should keep special column IDs as own highlight hash keys', () => {
    const columns: Column[] = [{ id: '__proto__', field: '__proto__', allowFormula: true }];
    const setCellCssStyles = vi.fn();
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({
      getColumns: () => columns,
      getData: () => ({ getItems: () => [{ id: 'r1', value: 1 }], getLength: () => 1 }),
      getOptions: () => ({ datasetIdPropertyName: 'id', enableFormulas: true }),
      setCellCssStyles,
    } as any);

    service.renderFormulaReferenceHighlights('=A1');

    const hash = setCellCssStyles.mock.calls[0]?.[1] as Record<number, Record<string, string>>;
    expect(Object.prototype.hasOwnProperty.call(hash[0], '__proto__')).toBe(true);
    expect(hash[0].__proto__).toBe('formula-cell-color-1');
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

  it('should translate relative and absolute A1 references for drag-fill without changing quoted literals', () => {
    expect(translateFormulaReferences('=A1+$B1+C$1+$D$1+"A1"', 2, 1)).toBe('=B3+$B3+D$1+$D$1+"A1"');
  });

  it('should drag-fill a formula into target rows and keep the stored formula stable', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'quantity', field: 'quantity' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [
      { id: 'r1', price: 2, quantity: 3, total: '=A1*2' },
      { id: 'r2', price: 4, quantity: 5, total: '' },
      { id: 'r3', price: 6, quantity: 7, total: '' },
    ];
    const gridStub = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      setColumns: (newColumns: Column[]) => columns.splice(0, columns.length, ...newColumns),
      getData: () => ({
        getItems: () => items,
        getLength: () => items.length,
        updateItems: vi.fn(),
      }),
      getDataItem: (row: number) => items[row],
      getOptions: () => ({ datasetIdPropertyName: 'id', enableFormulas: true }),
    } as any;

    service.init(gridStub);
    (service as any).handleDragReplaceCells(
      {},
      {
        prevSelectedRange: new SlickRange(0, 2),
        selectedRange: new SlickRange(0, 2, 2, 2),
        grid: gridStub,
      }
    );

    expect(service.getFormula('r2', 'total')).toBe('=REF(COLUMN("price"),ROW("r2"))*2');
    expect(service.getFormula('r3', 'total')).toBe('=REF(COLUMN("price"),ROW("r3"))*2');
    expect(service.getEvaluatedCellValue('r2', 'total')).toBe(8);
    expect(service.getEvaluatedCellValue('r3', 'total')).toBe(12);
    expect(
      service.getExcelFormula({
        columnId: 'total',
        columnIds: ['price', 'quantity', 'total'],
        dataRowIdx: 1,
        datasetIdPropertyName: 'id',
        excelRowOffset: 1,
        gridOptions: {},
        rowId: 'r2',
        rowIds: ['r1', 'r2', 'r3'],
      })
    ).toBe('A2*2');

    service.setFormula('r1', 'total', '=$A$1+$B1');
    (service as any).handleDragReplaceCells(
      {},
      {
        prevSelectedRange: new SlickRange(0, 2),
        selectedRange: new SlickRange(0, 2, 1, 2),
        grid: gridStub,
      }
    );

    expect((service as any).toDisplayFormulaForCell(service.getFormula('r2', 'total'), 'r2', 'total')).toBe('=$A$1+$B2');
    expect(service.getEvaluatedCellValue('r2', 'total')).toBe(7);
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

  it('should add and remove Excel column prefixes idempotently', () => {
    const columns: Column[] = [
      { id: 'name', field: 'name', name: 'Name' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const setColumns = vi.fn((nextColumns: Column[]) => columns.splice(0, columns.length, ...nextColumns));
    const service = new FormulaService();
    const gridStub = {
      getColumns: () => columns,
      setColumns,
      getData: () => ({ getItems: () => [], getLength: () => 0 }),
      getOptions: () => ({ enableSelection: true, selectionOptions: { selectionType: 'mixed' } }),
    } as any;

    service.init(gridStub);
    service.enableExcelHeaderPrefix();
    expect(columns[0].name).toContain('A</span> Name');
    expect(columns[1].name).toContain('B</span> total');

    const callsAfterEnable = setColumns.mock.calls.length;
    service.enableExcelHeaderPrefix();
    expect(setColumns).toHaveBeenCalledTimes(callsAfterEnable);

    service.disableExcelHeaderPrefix();
    expect(columns[0].name).toBe('Name');
    expect(columns[1].name).toContain('B</span> total');
    service.disableExcelHeaderPrefix();
    expect(setColumns).toHaveBeenCalledTimes(callsAfterEnable + 1);
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

  it('should prefer a changed live formula when the stored formula is not stable', () => {
    const service = new FormulaService();
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const items = [{ id: 1, total: '=1' }];
    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula(1, 'total', '=1');

    expect(service.getEvaluatedCellValue(1, 'total', '=2', 0)).toBe(2);
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

  it('should canonicalize editor A1 references and remain stable after column reorder or hide', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'product', field: 'product' },
      { id: 'price', field: 'price' },
      { id: 'quantity', field: 'quantity' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [{ id: 'a_01', product: 'Apples', price: 1.2, quantity: 5, total: '=B1*C1' }];
    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => columns.splice(0, columns.length, ...newCols),
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula('a_01', 'total', '=B1*C1');

    expect(service.getFormula('a_01', 'total')).toBe('=REF(COLUMN("price"),ROW("a_01"))*REF(COLUMN("quantity"),ROW("a_01"))');
    expect(service.getEvaluatedCellValue('a_01', 'total', items[0].total, 0)).toBe(6);

    columns.splice(0, columns.length, columns[2], columns[0], columns[3], columns[1]);
    expect(service.getEvaluatedCellValue('a_01', 'total', items[0].total, 0)).toBe(6);

    columns.find((column) => column.id === 'product')!.hidden = true;
    expect(service.getEvaluatedCellValue('a_01', 'total', items[0].total, 0)).toBe(6);
  });

  it('should canonicalize and evaluate A1 ranges with stable endpoint references', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'product', field: 'product' },
      { id: 'price', field: 'price' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [
      { id: 'a_01', product: 'Apples', price: 1.2, total: '=SUM(B1:B3)' },
      { id: 'o_02', product: 'Oranges', price: 0.8, total: 0 },
      { id: 'b_03', product: 'Bananas', price: 1.6, total: 0 },
    ];
    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => columns.splice(0, columns.length, ...newCols),
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula('a_01', 'total', '=SUM(B1:B3)');

    expect(service.getFormula('a_01', 'total')).toBe('=SUM(REF(COLUMN("price"),ROW("a_01")):REF(COLUMN("price"),ROW("b_03")))');
    expect(service.getEvaluatedCellValue('a_01', 'total', items[0].total, 0)).toBeCloseTo(3.6, 10);
  });

  it('should export stable references as native Excel A1 formulas using the export order', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'quantity', field: 'quantity' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [{ id: 'a_01', price: 1.2, quantity: 5, total: '=A1*B1' }];
    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula('a_01', 'total', '=A1*B1');
    columns.splice(0, columns.length, columns[1], columns[0], columns[2]);

    const context: FormulaExcelExportContext = {
      columnId: 'total',
      columnIds: ['quantity', 'price', 'total'],
      dataRowIdx: 0,
      datasetIdPropertyName: 'id',
      excelRowOffset: 2,
      gridOptions: {},
      rowId: 'a_01',
      rowIds: ['a_01'],
    };

    expect(service.getExcelFormula(context)).toBe('B2*A2');
  });

  it('should export stable references to hidden columns when hidden columns are included', () => {
    const service = new FormulaService();
    const columns: Column[] = [
      { id: 'product', field: 'product', hidden: true },
      { id: 'price', field: 'price' },
      { id: 'quantity', field: 'quantity' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [{ id: 'a_01', product: 'Apples', price: 1.2, quantity: 5, total: '=B1*C1' }];
    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;

    service.init(gridStub);
    service.setFormula('a_01', 'total', '=B1*C1');

    const context: FormulaExcelExportContext = {
      columnId: 'total',
      columnIds: ['product', 'price', 'quantity', 'total'],
      dataRowIdx: 0,
      datasetIdPropertyName: 'id',
      excelRowOffset: 2,
      gridOptions: {},
      rowId: 'a_01',
      rowIds: ['a_01'],
    };

    expect(service.getExcelFormula(context)).toBe('B2*C2');
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

  it('should resolve formatter rows through DataView getItem or the item-array fallback', () => {
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const items = [{ id: 1, total: '=SUM(1,2)' }];
    const getItem = vi.fn((row: number) => items[row]);
    const dataView = { getItems: () => items, getLength: () => items.length, getItem };
    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => dataView,
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;
    const service = new FormulaService();
    service.init(gridStub);

    const formatter = (service as any).buildFormulaValueFormatter(columns[0]);
    expect(formatter(0, 0, items[0].total, columns[0])).toBe(3);
    expect(getItem).toHaveBeenCalledWith(0);

    const fallbackService = new FormulaService();
    const fallbackDataView = { getItems: () => items, getLength: () => items.length };
    const fallbackGridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      getData: () => fallbackDataView,
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;
    fallbackService.init(fallbackGridStub);

    const fallbackFormatter = (fallbackService as any).buildFormulaValueFormatter(columns[0]);
    expect(fallbackFormatter(0, 0, items[0].total, columns[0])).toBe(3);
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
    expect((service as any).resolveExcelRangeValues('?', 1, 'A', 1, context)).toEqual([]);

    context.visited.add('1::value');
    expect((service as any).resolveExcelReferenceValue('A', 1, context)).toBe(FORMULA_ERROR.REF);
    expect((service as any).getCellRawValue('missing', 'value')).toBeUndefined();
    expect((service as any).getCellRawValue(1, 'missing')).toBeUndefined();

    expect((service as any).toExpressionLiteral(null)).toBe('0');
    expect((service as any).toExpressionLiteral(true)).toBe('true');
    expect((service as any).toExpressionLiteral(false)).toBe('false');
    expect((service as any).toExpressionLiteral(' 12.5 ')).toBe('12.5');
    expect((service as any).toExpressionLiteral('hello')).toBe('"hello"');
    expect((service as any).replaceRefFunctionsWithA1Refs('=REF(COLUMN("missing"),ROW(1))', ['value'], ['1'], 1)).toBe('=');
    service.registerCustomFunction('INVALID', {} as any);
    expect(service.getCustomFunction('INVALID')).toBeUndefined();

    const baseDate = new Date('2024-01-10T00:00:00.000Z');
    expect((FormulaService as any).addFormulaValues(baseDate, 2)).toEqual(new Date('2024-01-12T00:00:00.000Z'));
    expect((FormulaService as any).addFormulaValues(2, baseDate)).toEqual(new Date('2024-01-12T00:00:00.000Z'));
    expect((FormulaService as any).addFormulaValues(2, 3)).toBe(5);
    expect((FormulaService as any).subtractFormulaValues(baseDate, 2)).toEqual(new Date('2024-01-08T00:00:00.000Z'));
    expect((FormulaService as any).subtractFormulaValues(baseDate, new Date('2024-01-08T00:00:00.000Z'))).toBe(2);
    expect((FormulaService as any).subtractFormulaValues(5, 2)).toBe(3);
    expect((FormulaService as any).addDays(baseDate, 1)).toEqual(new Date('2024-01-11T00:00:00.000Z'));
  });

  it('should cover the recursive-descent parser operators, literals, collections, and syntax errors', () => {
    const service = new FormulaService();
    const functions = new Map<string, (...args: unknown[]) => unknown>([['FN', (...args) => args.length]]);
    const evaluate = (expression: string) => (service as any).evaluateExpressionWithParser(expression, functions);

    expect(evaluate(' 1 + 2 ')).toBe(3);
    expect(evaluate('"a\\"b"')).toBe('a"b');
    expect(evaluate('1 == 1')).toBe(true);
    expect(evaluate('1 != 2')).toBe(true);
    expect(evaluate('1 < 2')).toBe(true);
    expect(evaluate('2 > 1')).toBe(true);
    expect(evaluate('1 <= 1')).toBe(true);
    expect(evaluate('1 >= 1')).toBe(true);
    expect(evaluate('"a" & "b"')).toBe('ab');
    expect(evaluate('4 - 2')).toBe(2);
    expect(evaluate('2 * 3')).toBe(6);
    expect(evaluate('6 / 2')).toBe(3);
    expect(evaluate('2 ^ 3')).toBe(8);
    expect(evaluate('50%')).toBe(0.5);
    expect(evaluate('+2')).toBe(2);
    expect(evaluate('-2')).toBe(-2);
    expect(evaluate('FN(1, 2)')).toBe(2);
    expect(evaluate('TRUE')).toBe(true);
    expect(evaluate('FALSE')).toBe(false);
    expect(evaluate('NULL')).toBe(null);
    expect(evaluate('(1)')).toBe(1);
    expect(evaluate('[]')).toEqual([]);
    expect(evaluate('[1, 2]')).toEqual([1, 2]);

    expect(evaluate('1..2')).toBe(FORMULA_ERROR.NUM);
    expect(evaluate('@')).toBe(FORMULA_ERROR.ERROR);
    expect(evaluate('UNKNOWN')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('UNKNOWN()')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('FN(')).toBe(FORMULA_ERROR.ERROR);
    expect(evaluate('(1')).toBe(FORMULA_ERROR.ERROR);
    expect(evaluate('[1')).toBe(FORMULA_ERROR.ERROR);
    expect(evaluate('1 2')).toBe(FORMULA_ERROR.ERROR);
    expect(evaluate('1 / 0')).toBe(FORMULA_ERROR.DIV0);
    expect(evaluate('1 + UNKNOWN')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('1 + "x"')).toBe('1x');
    expect(evaluate('1 * "x"')).toBe(FORMULA_ERROR.VALUE);
    expect(evaluate('1 < UNKNOWN')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('"a" & UNKNOWN')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('1 - "x"')).toBe(FORMULA_ERROR.VALUE);
    expect(evaluate('1 * UNKNOWN')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('1 ^ UNKNOWN')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('"x"%')).toBe(FORMULA_ERROR.VALUE);
    expect(evaluate('+UNKNOWN')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('-UNKNOWN')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('(UNKNOWN)')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('[UNKNOWN]')).toBe(FORMULA_ERROR.NAME);

    const context = { visited: new Set<string>(), memo: new Map<string, unknown>() };
    expect((service as any).evaluateFormulaExpression('', context)).toBe(FORMULA_ERROR.NULL);
    expect((service as any).evaluateFormulaExpression('=1;2', context)).toBe(FORMULA_ERROR.ERROR);
    expect((service as any).evaluateFormulaExpression('=FOO', context)).toBe(FORMULA_ERROR.NAME);
    expect((service as any).evaluateFormulaExpression('=A1:B1', context)).toBe(FORMULA_ERROR.REF);
    expect((service as any).evaluateFormulaExpression('=SUM(A1:ZZZ1000000)', context)).toBe(FORMULA_ERROR.REF);

    for (const error of [ReferenceError, TypeError, SyntaxError, Error]) {
      const throwingService = new FormulaService({});
      throwingService.registerCustomFunction('THROW', () => {
        throw new error();
      });
      expect((throwingService as any).evaluateFormulaExpression('=THROW()', { visited: new Set(), memo: new Map() })).toBe(
        error === ReferenceError ? FORMULA_ERROR.NAME : error === TypeError ? FORMULA_ERROR.VALUE : FORMULA_ERROR.ERROR
      );
    }
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

  it('should wrap formula editor conversion and commit callbacks with and without row items', () => {
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const items = [{ id: 'r1', total: '=A1' }];
    const service = new FormulaService();
    const gridStub = {
      getColumns: () => columns,
      setColumns: (newColumns: Column[]) => columns.splice(0, columns.length, ...newColumns),
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ editable: true, datasetIdPropertyName: 'id' }),
      invalidate: vi.fn(),
      render: vi.fn(),
    } as any;

    service.init(gridStub);
    const params = columns[0].editor?.params as any;

    expect(params.toDisplayFormula('=A1')).toBe('=A1');
    expect(params.toDisplayFormula('=A1', { id: 'r1' })).toBe('=A1');
    expect(params.toStoredFormula('=A1')).toContain('REF(COLUMN("total"),ROW("r1"))');
    expect(params.toStoredFormula('=A1', { id: 'r1' })).toContain('REF(COLUMN("total"),ROW("r1"))');

    params.onFormulaCommit('=A1');
    expect(service.getFormula('r1', 'total')).toBe('=REF(COLUMN("total"),ROW("r1"))');
    params.onFormulaCommit('=A1', { id: 'r1' });
    expect(service.getFormula('r1', 'total')).toBe('=REF(COLUMN("total"),ROW("r1"))');
  });
});
