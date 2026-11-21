import { Aggregators, Formatters, SlickDataView, SlickEvent, SlickRange } from '@slickgrid-universal/common';
import type { Column, FormulaExcelExportContext } from '@slickgrid-universal/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FORMULA_ERROR } from '../formula-errors.js';
import { formulaDateToSerial } from '../formula-functions.js';
import { FORMULA_REFERENCE_HIGHLIGHT_STYLE_KEY } from '../formula-reference.js';
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

  it('requires an argument for aggregate and concatenation functions', () => {
    const service = new FormulaService({ autoAssignEditor: false });
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    for (const name of ['SUM', 'PRODUCT', 'MIN', 'MAX', 'AVERAGE', 'MEDIAN', 'CONCAT', 'CONCATENATE']) {
      expect(evaluate(`=${name}()`)).toBe(FORMULA_ERROR.VALUE);
    }
    expect(evaluate('=SUM(1)')).toBe(1);
    expect(evaluate('=CONCAT("")')).toBe('');
  });

  it('uses export lookups with row offsets and grouped worksheet positions', () => {
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [
      { id: 'a', value: 3, total: '' },
      { id: 'b', value: 4, total: '' },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    service.setFormula('a', 'total', '=A2');
    const context = {
      rowId: 'a',
      columnId: 'total',
      columnIds: ['value', 'total'],
      rowIds: ['a', 'b'],
      excelRowOffset: 3,
      referenceLookups: {
        columnIds: ['value', 'total'],
        columnIndexes: new Map([
          ['value', 0],
          ['total', 1],
        ]),
        rowIds: ['a', 'b'],
        rowIndexes: new Map([
          ['a', 0],
          ['b', 1],
        ]),
      },
    } as FormulaExcelExportContext;
    expect(service.getExcelFormula(context)).toBe('A4');
    expect(service.getExcelFormula({ ...context, excelRowOffset: 5 })).toBe('A6');
    expect(service.getExcelFormula({ ...context, groupedRowPositions: new Map([['b', 9]]), groupedColumnOffset: 1 })).toBe('B9');
    service.dispose();
  });

  it('keeps formulas distinct when row and column IDs contain key separators', () => {
    const columns: Column[] = [
      { id: 'c', field: 'c', allowFormula: true },
      { id: 'b::c', field: 'bc', allowFormula: true },
    ];
    const items = [
      { id: 'a::b', c: '', bc: 10 },
      { id: 'a', c: '', bc: '' },
    ];
    const grid = { getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any;
    const service = new FormulaService({ autoAssignEditor: false });
    service.init(grid);
    service.setFormula('a::b', 'c', '=$B$1+1');
    service.setFormula('a', 'b::c', '=2');
    service.setFormula('a', 'c', '=A1+B2');

    expect(service.getEvaluatedCellValue('a::b', 'c')).toBe(11);
    expect(service.getEvaluatedCellValue('a', 'b::c')).toBe(2);
    expect(service.getEvaluatedCellValue('a', 'c')).toBe(13);
    const snapshot = JSON.parse(JSON.stringify(service.getFormulaStoreSnapshot()));
    expect(snapshot.cells).toHaveLength(3);

    const restored = new FormulaService({ autoAssignEditor: false });
    restored.init(grid);
    restored.setFormulaStoreSnapshot(snapshot);
    expect(restored.getEvaluatedCellValue('a', 'c')).toBe(13);
    expect((restored as any).toDisplayFormulaForCell(restored.getFormula('a::b', 'c'), 'a::b', 'c')).toBe('=$B$1+1');
    expect(restored.removeFormula('a', 'b::c')).toBe(true);
    expect(restored.getEvaluatedCellValue('a::b', 'c')).toBe(11);
    expect(restored.hasFormula('a', 'b::c')).toBe(false);
    service.dispose();
    restored.dispose();
  });

  it('ignores error cells in COUNT and counts them in COUNTA without hiding other errors', () => {
    const items = [
      { id: 'a', value: 4 },
      { id: 'b', value: '=1/0' },
      { id: 'c', value: null },
    ];
    const columns: Column[] = [{ id: 'value', field: 'value', allowFormula: true }];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=COUNT(A1:A3)')).toBe(1);
    expect(evaluate('=COUNTA(A1:A3)')).toBe(2);
    expect(evaluate('=COUNT(A2)')).toBe(0);
    expect(evaluate('=COUNTA(A2)')).toBe(1);
    expect(evaluate('=COUNT(A99)')).toBe(FORMULA_ERROR.REF);
    expect(evaluate('=COUNTA(A99)')).toBe(FORMULA_ERROR.REF);
    expect(evaluate('=COUNT(A1:A99)')).toBe(FORMULA_ERROR.REF);
    expect(evaluate('=COUNTA(A1:A99)')).toBe(FORMULA_ERROR.REF);
    expect(evaluate('=SUM(A1:A3)')).toBe(FORMULA_ERROR.DIV0);
    expect(evaluate('=A2+1')).toBe(FORMULA_ERROR.DIV0);
    expect(evaluate('=COUNT(SUM(A2))')).toBe(0);
    expect(evaluate('=COUNT(A2+1,1/0,2)')).toBe(1);
    expect(evaluate('=COUNTA(A2+1,1/0,2)')).toBe(3);
    expect(evaluate('=COUNT(1/0+1,2)')).toBe(1);
    expect(evaluate('=COUNT(NA())')).toBe(0);
    expect(evaluate('=COUNT((1/0)+1,2)')).toBe(1);
    expect(evaluate('=COUNTA((SUM(A2)),2)')).toBe(2);
    expect(evaluate('=COUNT(IF(TRUE,1/0,4),2)')).toBe(1);
    expect(evaluate('=COUNT(SUM(A2+SUM(1)),2)')).toBe(1);
    expect(evaluate('=COUNT(1/0+SUM(1),2)')).toBe(1);
    for (const expression of ['A2=1', 'A2&"x"', 'A2*2', 'A2^2']) {
      expect(evaluate(`=COUNT(${expression})`)).toBe(0);
      expect(evaluate(`=COUNTA(${expression})`)).toBe(1);
    }
    expect(evaluate('=COUNT(A1:A3)+A2')).toBe(FORMULA_ERROR.DIV0);
    service.registerCustomFunction('COUNT', () => 10);
    expect(evaluate('=COUNT(A2)')).toBe(FORMULA_ERROR.DIV0);
  });

  it('rejects empty or nonnumeric text consistently in arithmetic operators', () => {
    const service = new FormulaService({ autoAssignEditor: false });
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    for (const expression of ['1-""', '1*""', '1/""', '""^2', '""%', '+""', '-""', '"x"^2']) {
      expect(evaluate(`=${expression}`)).toBe(FORMULA_ERROR.VALUE);
    }
    expect(evaluate('=2*"3"')).toBe(6);
    expect(evaluate('=2^"3"')).toBe(8);
    expect(evaluate('=1/0')).toBe(FORMULA_ERROR.DIV0);
  });

  it('uses spreadsheet logical conditions and numeric dates in formulas', () => {
    const items = [
      { id: 'a', value: new Date(2024, 0, 1, 12), total: '' },
      { id: 'b', value: new Date(NaN), total: '' },
    ];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=IF("FALSE",1,2)')).toBe(2);
    expect(evaluate('=IF("text",1,2)')).toBe(FORMULA_ERROR.VALUE);
    expect(evaluate('=IF(0,1,2)')).toBe(2);
    expect(evaluate('=SUM(A1)')).toBe(45292.5);
    expect(evaluate('=A1=45292.5')).toBe(true);
    expect(evaluate('=45292.5=A1')).toBe(true);
    expect(evaluate('=A2=1')).toBe(FORMULA_ERROR.VALUE);
    expect(evaluate('=A1*2')).toBe(90585);
    expect(evaluate('=A1+A1')).toBe(90585);
    service.setFormula('a', 'total', '=A1+1');
    expect(service.getExcelFormula({ rowId: 'a', columnId: 'total', columnIds: ['value', 'total'], rowIds: ['a'], excelRowOffset: 2 } as any)).toBe('A2+1');
  });

  it('uses spreadsheet days for date arithmetic with numeric text, booleans and blank references', () => {
    const date = new Date(2024, 0, 1, 12);
    const items = [
      { id: 'a', value: date, blank: null },
      { id: 'b', value: new Date(NaN), blank: null },
    ];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'blank', field: 'blank' },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    const nextDay = new Date(2024, 0, 2, 12);
    const previousDay = new Date(2023, 11, 31, 12);
    for (const formula of ['=A1+"1"', '=A1+TRUE', '="1"+A1', '=TRUE+A1']) {
      expect(evaluate(formula)).toEqual(nextDay);
    }
    for (const formula of ['=A1-"1"', '=A1-TRUE']) {
      expect(evaluate(formula)).toEqual(previousDay);
    }
    expect(evaluate('=A1+B1')).toEqual(date);
    expect(evaluate('=A1-B1')).toEqual(date);
    expect(evaluate('=1-A1')).toBe(-45291.5);
    expect(evaluate('="1"-A1')).toBe(-45291.5);
    for (const formula of ['=A1+""', '=A1-""', '=A1+"text"', '=A1-"text"', '=A2+1', '=A2-1', '=A1+A1:A2']) {
      expect(evaluate(formula)).toBe(FORMULA_ERROR.VALUE);
    }
  });

  it('preserves quoted text through reference resolution, operator normalization and export', () => {
    const items = [
      { id: 'a', value: 'A1', total: '' },
      { id: 'b', value: 'C2:D3', total: '' },
    ];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('="A1:C3 TRUE FALSE <> = × ÷ − ; {} `"')).toBe('A1:C3 TRUE FALSE <> = × ÷ − ; {} `');
    expect(evaluate('=CONCAT(A1, ":", A2)')).toBe('A1:C2:D3');
    expect(evaluate('="#N/A"')).toBe('#N/A');
    expect(evaluate('="#N/A"&""')).toBe('#N/A');
    expect(evaluate('=CONCAT("#N/A","")')).toBe('#N/A');
    expect(evaluate('=IF(TRUE,"#N/A","ok")')).toBe('#N/A');
    expect(evaluate('="#REF!"+1')).toBe(FORMULA_ERROR.VALUE);
    items[0].value = 'A1\n"quoted"\\path\t';
    expect(evaluate('=A1')).toBe(items[0].value);
    expect(evaluate('="\\u0041\\nB"')).toBe('A\nB');
    items[0].value = 'A1';
    expect(evaluate('="He said ""A1 ×"""')).toBe('He said "A1 ×"');
    expect(evaluate('=IF("A1 × TRUE"="A1 × TRUE",3,0)')).toBe(3);
    expect(evaluate('="unterminated')).toBe('#PARSE!');
    expect(evaluate('=CONCAT("hello A1", SUM(A1:A2))')).toBe('hello A10');
    expect(evaluate('=CONCAT("__FORMULA_CELL_0", A1)')).toBe('__FORMULA_CELL_0A1');
    expect(evaluate('="REF(COLUMN(\'value\'),ROW(1))"')).toBe("REF(COLUMN('value'),ROW(1))");
    expect(evaluate(`='REF(COLUMN("value"),ROW(1))'`)).toBe('REF(COLUMN("value"),ROW(1))');
    expect(evaluate('=1;2')).toBe('#PARSE!');
    service.setFormula('a', 'total', '="A1 × B2"');
    expect(service.getExcelFormula({ rowId: 'a', columnId: 'total', columnIds: ['value', 'total'], rowIds: ['a', 'b'], excelRowOffset: 2 } as any)).toBe(
      '"A1 × B2"'
    );
    items[0].value = '#N/A';
    service.setFormula('b', 'total', '=A1');
    expect(service.getEvaluatedCellValue('b', 'total')).toBe('#N/A');
    service.setFormula('b', 'total', '="#N/A"');
    service.setFormula('a', 'total', '=B2');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe('#N/A');
  });

  it('never exports unparseable formula text such as DDE payloads as live Excel formulas', () => {
    const items = [{ id: 'a', value: 1, total: '' }];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const context = { rowId: 'a', columnId: 'total', columnIds: ['value', 'total'], rowIds: ['a'], excelRowOffset: 1 } as any;

    service.setFormula('a', 'total', "=cmd|' /C calc'!A0");
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(FORMULA_ERROR.PARSE);
    expect(service.getExcelFormula(context)).toBeUndefined();
    service.setFormula('a', 'total', '="a|b"&A1');
    expect(service.getExcelFormula(context)).toBe('"a|b"&A1');
  });

  it('converts grid string syntax to valid Excel literals', () => {
    const items = [{ id: 'a', value: 1, total: '' }];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    service.setFormula('a', 'total', `=CONCAT('single "quote"', "escaped \\"quote\\"", "line\\nnext", "\\u0041", "A1")`);

    expect(
      service.getExcelFormula({
        rowId: 'a',
        columnId: 'total',
        columnIds: ['value', 'total'],
        rowIds: ['a'],
        excelRowOffset: 1,
      } as any)
    ).toBe('CONCAT("single ""quote""", "escaped ""quote""", ("line"&CHAR(10)&"next"), "A", "A1")');
  });

  it('evaluates, stores and exports custom functions whose names resemble A1 references', () => {
    const items = [{ id: 'a', value: 100, total: '' }];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({
      autoAssignEditor: false,
      customFunctions: { LOG10: (value: number) => Math.log10(value), A1: (value: number) => value * 2 },
    });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    service.setFormula('a', 'total', '=LOG10(100)+A1(3)+value');

    expect(service.getFormula('a', 'total')).toBe('=LOG10(100)+A1(3)+value');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe('#NAME?');

    service.setFormula('a', 'total', '=LOG10(100)+A1(3)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(8);
    expect(
      service.getExcelFormula({
        rowId: 'a',
        columnId: 'total',
        columnIds: ['value', 'total'],
        rowIds: ['a'],
        excelRowOffset: 1,
      } as any)
    ).toBe('LOG10(100)+A1(3)');

    service.setFormula('a', 'total', '=IF(TRUE,LOG10(100),0)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(2);

    service.setFormula('a', 'total', '=LOG10');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe('#REF!');
  });

  it('compares text without case sensitivity, including references and IF conditions', () => {
    const items = [{ id: 'a', value: 'Apple', total: '' }];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('="Apple"="APPLE"')).toBe(true);
    expect(evaluate('="Apple"<>"APPLE"')).toBe(false);
    expect(evaluate('="apple"<"BANANA"')).toBe(true);
    expect(evaluate('="BANANA">="banana"')).toBe(true);
    service.setFormula('a', 'total', '=IF(A1="APPLE",1,2)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(1);
    expect(service.getExcelFormula({ rowId: 'a', columnId: 'total', columnIds: ['value', 'total'], rowIds: ['a'], excelRowOffset: 2 } as any)).toBe(
      'IF(A2="APPLE",1,2)'
    );
  });

  it('compares numbers and text by type rather than coercing numeric text', () => {
    const items = [{ id: 'a', value: '3', total: '' }];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=3="3"')).toBe(false);
    expect(evaluate('=3<>"3"')).toBe(true);
    expect(evaluate('=3<"0"')).toBe(true);
    expect(evaluate('="0">3')).toBe(true);
    expect(evaluate('=3>="0"')).toBe(false);
    expect(evaluate('="0"<=3')).toBe(false);
    service.setFormula('a', 'total', '=IF(A1>100,1,0)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(1);
    expect(service.getExcelFormula({ rowId: 'a', columnId: 'total', columnIds: ['value', 'total'], rowIds: ['a'], excelRowOffset: 2 } as any)).toBe(
      'IF(A2>100,1,0)'
    );
  });

  it('keeps logical values distinct from numbers and text in comparisons', () => {
    const items = [{ id: 'a', blank: null, logical: false, total: '' }];
    const columns: Column[] = [
      { id: 'blank', field: 'blank' },
      { id: 'logical', field: 'logical' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=1=TRUE')).toBe(false);
    expect(evaluate('=0<>FALSE')).toBe(true);
    expect(evaluate('=1=1=1')).toBe(false);
    expect(evaluate('=TRUE>99')).toBe(true);
    expect(evaluate('="text"<FALSE')).toBe(true);
    expect(evaluate('=FALSE>"text"')).toBe(true);
    expect(evaluate('=A1=FALSE')).toBe(true);
    expect(evaluate('=FALSE=A1')).toBe(true);
    expect(evaluate('=B1=0')).toBe(false);
    expect(evaluate('=TRUE+1')).toBe(2);
    service.setFormula('a', 'total', '=IF(B1=0,1,2)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(2);
    expect(service.getExcelFormula({ rowId: 'a', columnId: 'total', columnIds: ['blank', 'logical', 'total'], rowIds: ['a'], excelRowOffset: 2 } as any)).toBe(
      'IF(B2=0,1,2)'
    );
  });

  it('reports arithmetic and function overflow without masking division errors or lazy branches', () => {
    const items = [{ id: 'a', large: 1e308, tiny: 1e-308, total: '' }];
    const columns: Column[] = [
      { id: 'large', field: 'large' },
      { id: 'tiny', field: 'tiny' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false, customFunctions: { OVERFLOW: () => Infinity, INVALID: () => NaN } });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=A1+A1')).toBe('#NUM!');
    expect(evaluate('=-A1-A1')).toBe('#NUM!');
    expect(evaluate('=A1*2')).toBe('#NUM!');
    expect(evaluate('=A1/B1')).toBe('#NUM!');
    expect(evaluate('=SUM(A1,A1)')).toBe('#NUM!');
    expect(evaluate('=1/(A1*2)')).toBe('#NUM!');
    expect(evaluate('=OVERFLOW()')).toBe('#NUM!');
    expect(evaluate('=INVALID()')).toBe('#VALUE!');
    expect(evaluate('=1/0')).toBe('#DIV/0!');
    expect(evaluate('=IF(FALSE,A1*2,7)')).toBe(7);
    expect(evaluate('=CONCAT(TRUE,FALSE)')).toBe('TRUEFALSE');
    service.setFormula('a', 'total', '=SUM(A1,A1)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe('#NUM!');
  });

  it('resolves escaped row and column IDs and propagates errors from references', () => {
    const id = 'r"\\1';
    const columnId = 'value"\\x';
    const items = [
      { id, value: 4, total: '' },
      { id: 'b', value: '=1/0', total: '' },
    ];
    const columns: Column[] = [
      { id: columnId, field: 'value', allowFormula: true },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    service.setFormula(id, 'total', '=A1*2');
    expect(service.getEvaluatedCellValue(id, 'total')).toBe(8);
    expect(service.getExcelFormula({ rowId: id, columnId: 'total', columnIds: [columnId, 'total'], rowIds: [id, 'b'], excelRowOffset: 2 } as any)).toBe('A2*2');
    service.setFormula(id, 'total', '=A2+1');
    expect(service.getEvaluatedCellValue(id, 'total')).toBe('#DIV/0!');
  });

  it('evaluates only the selected IF branch and propagates errors from evaluated arguments', () => {
    const items = [{ id: 'a', value: '=1/0', total: '' }];
    const columns: Column[] = [
      { id: 'value', field: 'value', allowFormula: true },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const called = vi.fn(() => 11);
    const service = new FormulaService({ autoAssignEditor: false, customFunctions: { CALLED: called } });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=IF(FALSE,1/0,42)')).toBe(42);
    expect(evaluate('=IF(TRUE,42,A1)')).toBe(42);
    expect(evaluate('=IF(FALSE,REF(COLUMN("deleted"),ROW("a")),42)')).toBe(42);
    expect(evaluate('=IF(TRUE,IF(FALSE,CALLED(),5),CALLED())')).toBe(5);
    expect(called).not.toHaveBeenCalled();
    expect(evaluate('=SUM(IF(TRUE,2,1/0),3)')).toBe(5);
    expect(evaluate('=IF(TRUE,A1,42)')).toBe('#DIV/0!');
    expect(evaluate('=IF(A1,42,0)')).toBe('#DIV/0!');
    expect(evaluate('=SUM(1/0)')).toBe('#DIV/0!');
    expect(evaluate('=CALLED(1/0)')).toBe('#DIV/0!');
    expect(called).not.toHaveBeenCalled();
    expect(evaluate('=IF(FALSE,SUM(A1:A1),7)')).toBe(7);
    expect(evaluate('=IF(FALSE,1)')).toBe(false);
    expect(evaluate('=IF(TRUE,"a\\\"b","no")')).toBe('a"b');
    expect(evaluate('=IF(TRUE,"a""b","no")')).toBe('a"b');
    expect(evaluate('=IF(TRUE,1')).toBe('#PARSE!');
    expect(evaluate('=IF(TRUE,1,2+)')).toBe('#PARSE!');
    expect(evaluate('=IF(FALSE,1+,2)')).toBe('#PARSE!');
    expect(evaluate('=IF(TRUE,1,1.2.3)')).toBe('#PARSE!');
    expect(evaluate('=IF(TRUE,1,-([1,2]-1)^([1,2])%)')).toBe(1);
    expect(evaluate('=IF(TRUE,1,CALLED(1/0))')).toBe(1);
    expect(evaluate('=SUM(1')).toBe('#PARSE!');
    expect(evaluate('=IF(FALSE,1;2,3)')).toBe('#PARSE!');
    service.registerCustomFunction('__FORMULA_LAZY_IF_0', () => 10);
    expect(evaluate('=IF(TRUE,1,2)+__FORMULA_LAZY_IF_0()')).toBe(11);
    service.registerCustomFunction('IF', () => 17);
    expect(evaluate('=IF(TRUE,1,2)')).toBe(17);
    service.unregisterCustomFunction('IF');
    service.setFormula('a', 'total', '=IF(FALSE,B1,7)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(7);
    service.setFormula('a', 'total', '=IF(TRUE,B1,7)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe('#CIRCREF!');
  });

  it('distinguishes circular references, syntax errors, invalid references and custom failures', () => {
    const items = [
      { id: 'a', value: 1, total: '' },
      { id: 'b', value: 2, total: '' },
      { id: 'c', value: 3, total: '' },
      { id: 'd', value: 4, total: '' },
    ];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({
      autoAssignEditor: false,
      customFunctions: {
        BROKEN: () => {
          throw new TypeError('custom failure');
        },
      },
    });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    service.setFormula('a', 'total', '=B1');
    service.setFormula('b', 'total', '=B3');
    service.setFormula('c', 'total', '=B2');
    service.setFormula('d', 'total', '=SUM(B2:B3)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe('#CIRCREF!');
    expect(service.getEvaluatedCellValue('b', 'total')).toBe('#CIRCREF!');
    expect(service.getEvaluatedCellValue('d', 'total')).toBe('#CIRCREF!');
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=SUM(1,,2)')).toBe('#PARSE!');
    expect(evaluate('=1..2')).toBe('#PARSE!');
    expect(evaluate('=IF(TRUE,5,B1)')).toBe(5);
    expect(evaluate('=IF(FALSE,5,B1)')).toBe('#CIRCREF!');
    expect(evaluate('=IF(TRUE,5,1+)')).toBe('#PARSE!');
    expect(evaluate('=Z1')).toBe('#REF!');
    expect(evaluate('=MISSING()')).toBe('#NAME?');
    expect(evaluate('=BROKEN()')).toBe('#ERROR!');
    expect(evaluate('=IF(TRUE)')).toBe('#VALUE!');
    expect(evaluate('=RAND(1)')).toBe('#VALUE!');
    expect(evaluate('=POWER(0,-1)')).toBe('#DIV/0!');
    expect(evaluate('=0^0')).toBe('#NUM!');
    expect(evaluate('=0^-1')).toBe('#DIV/0!');
    expect(
      service.getExcelFormula({ rowId: 'a', columnId: 'total', columnIds: ['value', 'total'], rowIds: items.map((item) => item.id), excelRowOffset: 2 } as any)
    ).toBe('B2');
  });

  it('evaluates operator precedence and chained powers in Excel order', () => {
    const items = [{ id: 'a', value: 2, total: '' }];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });

    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });

    expect(evaluate('=2^3^2')).toBe(64);
    expect(evaluate('=2^(3^2)')).toBe(512);
    expect(evaluate('=-2^2')).toBe(4);
    expect(evaluate('=-(2^2)')).toBe(-4);
    expect(evaluate('=2^-2')).toBe(0.25);
    expect(evaluate('=-A1^2')).toBe(4);
    expect(evaluate('=2^50%')).toBe(Math.SQRT2);
    expect(evaluate('=5+2*3')).toBe(11);
    expect(evaluate('=(5+2)*3')).toBe(21);
    expect(evaluate('=8/4*2')).toBe(4);
    expect(evaluate('=1+2&3')).toBe('33');
    expect(evaluate('=1+2=3')).toBe(true);
    expect(evaluate('=IF(TRUE,7,-2^2^3%)')).toBe(7);

    service.setFormula('a', 'total', '=-A1^2');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(4);
    expect(service.getExcelFormula({ rowId: 'a', columnId: 'total', columnIds: ['value', 'total'], rowIds: ['a'], excelRowOffset: 2 } as any)).toBe('-A2^2');
  });

  it('accepts decimal and scientific numeric literals', () => {
    const service = new FormulaService({ autoAssignEditor: false });
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });

    expect(evaluate('=1E3')).toBe(1000);
    expect(evaluate('=1.5e-2*2')).toBe(0.03);
    expect(evaluate('=.5E+2')).toBe(50);
    expect(evaluate('=1E')).toBe(FORMULA_ERROR.PARSE);
    expect(evaluate('=1E+')).toBe(FORMULA_ERROR.PARSE);
    expect(evaluate('=1.2.3')).toBe(FORMULA_ERROR.PARSE);
    expect(evaluate('=.')).toBe(FORMULA_ERROR.PARSE);
  });

  it('formats dates as spreadsheet serials during concatenation and rejects invalid custom names', () => {
    const date = new Date(2024, 0, 2, 12);
    const service = new FormulaService({ autoAssignEditor: false, customFunctions: { VALID_NAME: () => 1 } });
    service.init({
      getColumns: () => [{ id: 'value', field: 'value' }],
      getData: () => ({ getItems: () => [{ id: 'a', value: date }] }),
      getOptions: () => ({}),
    } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });

    expect(evaluate('=A1&"x"')).toBe(`${formulaDateToSerial(date)}x`);
    expect(evaluate('=CONCAT(A1,"x")')).toBe(`${formulaDateToSerial(date)}x`);
    expect(() => service.registerCustomFunction('BAD-NAME', () => 2)).toThrow(TypeError);
    expect(() => service.registerCustomFunction('', () => 2)).toThrow(TypeError);
  });

  it('evaluates new math functions and exports built-in aliases as Excel functions', () => {
    const items = [{ id: 'a', value: -1.475, total: '' }];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=ROUND(A1,2)+MOD(-3,2)+SQRT(ABS(-16))')).toBe(3.52);
    expect(evaluate('=SQRT(-1)')).toBe('#NUM!');
    expect(evaluate('=MOD(1,0)')).toBe('#DIV/0!');
    expect(evaluate('=ROUND(3)')).toBe('#VALUE!');
    expect(evaluate('=CONCATENATE("a",A1)')).toBe('a-1.475');
    const context = { rowId: 'a', columnId: 'total', columnIds: ['value', 'total'], rowIds: ['a'], excelRowOffset: 2 } as any;
    service.setFormula('a', 'total', '=RANDOM()+RAN()+CONCATENATE("RAN()",A1)');
    expect(service.getExcelFormula(context)).toBe('RAND()+RAND()+CONCAT("RAN()",A2)');
    service.registerCustomFunction('RAN', () => 7);
    expect(evaluate('=RAN()')).toBe(7);
    expect(service.getExcelFormula(context)).toBe('RAND()+RAN()+CONCAT("RAN()",A2)');
  });

  it('uses numeric addition instead of concatenation for formula operands', () => {
    const items = [
      { id: 'a', value: '12.5', total: '' },
      { id: 'b', value: null, total: '' },
      { id: 'c', value: 'text', total: '' },
    ];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });

    expect(evaluate('=1+"2"')).toBe(3);
    expect(evaluate('="2"+"3"')).toBe(5);
    expect(evaluate('=A1+1')).toBe(13.5);
    expect(evaluate('=A2+1')).toBe(1);
    expect(evaluate('=TRUE+2')).toBe(3);
    expect(evaluate('=1+"text"')).toBe('#VALUE!');
    expect(evaluate('=A3+1')).toBe('#VALUE!');
    expect(evaluate('=""+1')).toBe('#VALUE!');
    expect(evaluate('=1+" "')).toBe('#VALUE!');
    expect(evaluate('="1"&"2"')).toBe('12');
    expect(evaluate('="A"&TRUE&FALSE')).toBe('ATRUEFALSE');
    expect(evaluate('=TRUE&"-"&FALSE')).toBe('TRUE-FALSE');
    service.setFormula('a', 'total', '=A1+"2"');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(14.5);
    expect(service.getExcelFormula({ rowId: 'a', columnId: 'total', columnIds: ['value', 'total'], rowIds: ['a', 'b', 'c'], excelRowOffset: 2 } as any)).toBe(
      'A2+"2"'
    );
  });

  it('counts date values in references, ranges and date function results', () => {
    const items = [
      { id: 'a', value: new Date(2024, 0, 1), total: '' },
      { id: 'b', value: '2024-01-01', total: '' },
      { id: 'c', value: new Date(NaN), total: '' },
    ];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });

    expect(evaluate('=COUNT(A1:A3)')).toBe(1);
    expect(evaluate('=COUNT(A1,A2,A3)')).toBe(1);
    expect(evaluate('=COUNT(TODAY(),NOW())')).toBe(2);
  });

  it('preserves blank range members for aggregates and custom functions', async () => {
    const items = [
      { id: 'a', value: 2, total: '' },
      { id: 'b', value: null, total: '' },
      { id: 'c', value: 0, total: '' },
      { id: 'd', value: '', total: '' },
      { id: 'e', value: 4, total: '' },
      { id: 'f', value: undefined, total: '' },
    ];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const inspect = vi.fn((values: unknown[]) => values.length);
    const service = new FormulaService({ autoAssignEditor: false, customFunctions: { INSPECT: inspect } });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });

    expect(evaluate('=AVERAGE(A1:A6)')).toBe(2);
    expect(evaluate('=COUNT(A1:A6)')).toBe(3);
    expect(evaluate('=COUNTA(A1:A6)')).toBe(3);
    expect(evaluate('=COUNTBLANK(A1:A6)')).toBe(3);
    expect(evaluate('=COUNT()')).toBe('#VALUE!');
    expect(evaluate('=COUNTA()')).toBe('#VALUE!');
    expect(evaluate('=COUNTBLANK()')).toBe('#VALUE!');
    expect(evaluate('=COUNTBLANK(A1,A2)')).toBe('#VALUE!');
    expect(evaluate('=AVERAGE(A2:A2)')).toBe('#DIV/0!');
    expect(evaluate('=INSPECT(A1:A6)')).toBe(6);
    expect(inspect).toHaveBeenLastCalledWith([2, null, 0, null, 4, null]);

    service.setFormula('a', 'total', '=AVERAGE(A1:A3)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(1);
    items.splice(1, 0, items.pop()!);
    await Promise.resolve(); // row caches last one synchronous pass, like a grid render after a DataView refresh
    expect(evaluate(service.getFormula('a', 'total')!)).toBe(1);
    expect(evaluate('=AVERAGE(REFRANGE(A1,A3,A4))')).toBe(1);
    expect(evaluate('=AVERAGE(REFRANGE(A1,A99))')).toBe('#REF!');
    expect(evaluate('=AVERAGE(REFRANGE(A1,A0))')).toBe('#REF!');
  });

  it('distinguishes reference values from literal arguments in aggregates', () => {
    const items = [
      { id: 'a', value: 4, total: '' },
      { id: 'b', value: '6', total: '' },
      { id: 'c', value: true, total: '' },
      { id: 'd', value: null, total: '' },
      { id: 'e', value: '=CONCAT("")', total: '' },
      { id: 'f', value: 0, total: '' },
      { id: 'g', value: 'text', total: '' },
    ];
    const columns: Column[] = [
      { id: 'value', field: 'value', allowFormula: true },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const custom = vi.fn((...values: unknown[]) => values.length);
    const service = new FormulaService({ autoAssignEditor: false, customFunctions: { CUSTOM: custom } });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=SUM(A1:A7)')).toBe(4);
    expect(evaluate('=SUM(A1,A2,A3,A4,A5)')).toBe(4);
    expect(evaluate('=SUM("6",TRUE,4)')).toBe(11);
    expect(evaluate('=SUM(A2+0,A3*1)')).toBe(7);
    expect(evaluate('=AVERAGE(A1:A7)')).toBe(2);
    expect(evaluate('=MEDIAN(A1:A7)')).toBe(2);
    expect(evaluate('=COUNT(A1:A7)')).toBe(2);
    expect(evaluate('=COUNT("6",TRUE,4)')).toBe(3);
    expect(evaluate('=COUNTA(A1:A7)')).toBe(6);
    expect(evaluate('=COUNTBLANK(A1:A7)')).toBe(2);
    expect(evaluate('=COUNTA(A4,A5)')).toBe(1);
    expect(evaluate('=COUNTA(A5,A5)')).toBe(2);
    expect(evaluate('=AVERAGE(A2:A5)')).toBe('#DIV/0!');
    expect(evaluate('=MEDIAN(A2:A5)')).toBe('#NUM!');
    expect(evaluate('=SUM("not numeric")')).toBe('#VALUE!');
    expect(evaluate('=A2+1')).toBe(7);
    expect(evaluate('=A5')).toBe('');
    expect(evaluate('=A4')).toBe(0);
    expect(evaluate('=A4=0')).toBe(true);
    expect(evaluate('=A4=""')).toBe(true);
    expect(evaluate('=0=A4')).toBe(true);
    expect(evaluate('=""=A4')).toBe(true);
    expect(evaluate('=A5+1')).toBe('#VALUE!');
    expect(evaluate('=IF(TRUE,A5,4)')).toBe('');
    expect(evaluate('=CUSTOM(A2,A3,A4,A5,A1:A3)')).toBe(5);
    expect(custom).toHaveBeenLastCalledWith('6', true, null, '', [4, '6', true]);
    service.setFormula('a', 'total', '=COUNTA(A1:A7)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(6);
    expect(
      service.getExcelFormula({ rowId: 'a', columnId: 'total', columnIds: ['value', 'total'], rowIds: items.map((item) => item.id), excelRowOffset: 2 } as any)
    ).toBe('COUNTA(A2:A8)');
  });

  it('evaluates and exports conditional criteria with case, wildcards and blank cells', () => {
    const items = [
      { id: 'a', name: 'Apple', amount: 3, total: '' },
      { id: 'b', name: 'APPLE', amount: '4', total: '' },
      { id: 'c', name: 'a*ple', amount: 5, total: '' },
      { id: 'd', name: 'apple ', amount: true, total: '' },
      { id: 'e', name: null, amount: 0, total: '' },
      { id: 'f', name: '=""', amount: 2, total: '' },
    ];
    const columns: Column[] = [
      { id: 'name', field: 'name', allowFormula: true },
      { id: 'amount', field: 'amount' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=COUNTIF(A1:A6,"apple")')).toBe(2);
    expect(evaluate('=COUNTIF(A1:A6,"a~*ple")')).toBe(1);
    expect(evaluate('=COUNTIF(A1:A6,"apple*")')).toBe(3);
    expect(evaluate('=COUNTIF(A1:A6,"")')).toBe(2);
    expect(evaluate('=COUNTIF(B1:B6,A5)')).toBe(1);
    expect(evaluate('=SUMIF(A1:A6,"a?ple",B1:B6)')).toBe(8);
    expect(evaluate('=SUMIF(A1:A6,"apple*",B1:B6)')).toBe(3);
    service.setFormula('a', 'total', '=SUMIF(A1:A6,"a?ple",B1:B6)');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(8);
    expect(
      service.getExcelFormula({
        rowId: 'a',
        columnId: 'total',
        columnIds: ['name', 'amount', 'total'],
        rowIds: items.map((item) => item.id),
        excelRowOffset: 2,
      } as any)
    ).toBe('SUMIF(A2:A7,"a?ple",B2:B7)');
  });

  it('returns #VALUE! for mismatched SUMIF ranges while exporting the original formula', () => {
    const items = [
      { id: 'a', name: 'match', amount: 10, total: '' },
      { id: 'b', name: 'skip', amount: 20, total: '' },
      { id: 'c', name: 'match', amount: 30, total: '' },
      { id: 'd', name: 'total', amount: 40, total: '' },
    ];
    const columns: Column[] = [
      { id: 'name', field: 'name' },
      { id: 'amount', field: 'amount' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);

    service.setFormula('d', 'total', '=SUMIF(A1:A3,"match",B1:B3)');
    expect(service.getEvaluatedCellValue('d', 'total')).toBe(40);
    service.setFormula('d', 'total', '=SUMIF(A1:A3,"match",B1)');
    expect(service.getEvaluatedCellValue('d', 'total')).toBe(FORMULA_ERROR.VALUE);
    service.setFormula('d', 'total', '=SUMIF(A1:A2,"match",B1:B3)');
    expect(service.getEvaluatedCellValue('d', 'total')).toBe(FORMULA_ERROR.VALUE);
    expect(
      service.getExcelFormula({ rowId: 'd', columnId: 'total', columnIds: ['name', 'amount', 'total'], rowIds: ['a', 'b', 'c', 'd'], excelRowOffset: 2 } as any)
    ).toBe('SUMIF(A2:A3,"match",B2:B4)');
  });

  it('should expose and merge service options', () => {
    const service = new FormulaService({ autoAssignEditor: false });

    expect(service.getOptions()).toEqual({ autoAssignEditor: false });
    service.setOptions({ enableExcelHeaderPrefix: false });

    expect(service.getOptions()).toEqual({ autoAssignEditor: false, enableExcelHeaderPrefix: false });
  });

  it('updates function suggestions and cached formula results when custom functions change', async () => {
    const items = [{ id: 'a', total: '=DYNAMIC()' }];
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const grid = {
      getColumns: () => columns,
      setColumns: (next: Column[]) => columns.splice(0, columns.length, ...next),
      getData: () => ({ getItems: () => items }),
      getOptions: () => ({}),
      invalidate: vi.fn(),
      render: vi.fn(),
    } as any;
    const service = new FormulaService();
    service.init(grid);
    grid.invalidate.mockClear();
    grid.render.mockClear();
    const params = columns[0].editor!.params as any;
    expect(params.getFormulaFunctionList()).not.toContain('DYNAMIC');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe('#NAME?');
    service.registerCustomFunction('dynamic', () => 4);
    expect(params.getFormulaFunctionList()).toContain('DYNAMIC');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(4);
    service.registerCustomFunction('DYNAMIC', () => 9);
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(9);
    expect(service.unregisterCustomFunction('dynamic')).toBe(true);
    expect(params.getFormulaFunctionList()).not.toContain('DYNAMIC');
    expect(service.getEvaluatedCellValue('a', 'total')).toBe('#NAME?');
    expect(service.unregisterCustomFunction('missing')).toBe(false);
    await Promise.resolve();
    expect(grid.invalidate).toHaveBeenCalledOnce();
    expect(grid.render).toHaveBeenCalledOnce();
    service.dispose();
  });

  it('retains explicitly configured function suggestions', () => {
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true, editor: { params: { formulaFunctionList: ['CUSTOM'] } } }];
    const grid = {
      getColumns: () => columns,
      setColumns: (next: Column[]) => columns.splice(0, columns.length, ...next),
      getData: () => ({ getItems: () => [] }),
      getOptions: () => ({}),
    } as any;
    const service = new FormulaService();
    service.init(grid);
    service.registerCustomFunction('OTHER', () => 1);
    expect(columns[0].editor?.params?.formulaFunctionList).toEqual(['CUSTOM']);
    service.dispose();
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
    service.clearFormulas();
    expect(service.hasFormula('r1', 'value')).toBe(false);
    service.setFormula('r1', 'value', '=A1');
    expect(service.removeFormula('r1', 'value')).toBe(true);
    expect(service.unregisterCustomFunction('missing')).toBe(false);
    expect(service.getExcelFormula({ rowId: 'r1', columnId: 'value', columnIds: ['value'], rowIds: ['r1'], excelRowOffset: 1 } as any)).toBeUndefined();
    expect(service.getExcelDefinedNames()).toEqual([]);
    expect(service.getExcelCustomFunctions()).toEqual([]);
    expect((service as any).shiftDirectExcelReferences('', [], [], 0)).toBe('');

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
    const flagKey = (flagService as any).buildStoreKey('r', 'value');
    (flagService as any)._formulaReferenceAbsoluteFlagsByKey.set(flagKey, [{ column: true, row: false }]);
    expect((flagService as any).applyFormulaReferenceAbsoluteFlags(flagKey, '=A1+B1')).toBe('=$A1+B1');
    (flagService as any)._grid = { getColumns: () => [{ id: 'value', field: 'value' }], getOptions: () => ({}) };
    (flagService as any)._dataView = { getItems: () => [{ id: 'r', value: '=A1' }] };
    (flagService as any)._formulaStore.set('orphan::value', '=A1');
    (flagService as any)._formulaCoordinatesByKey.set(flagKey, { rowId: 'r', columnId: 'value' });
    (flagService as any)._formulaStore.set(flagKey, '=A1');
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
    expect((flagService as any).convertA1ReferencesToStableRefs('=A1:B1', ['value'], ['r'])).toBe('=REFRANGE(REF(COLUMN("value"),ROW("r")),B1)');
    expect((flagService as any).replaceRefFunctionsWithA1Refs('', ['value'], ['r'])).toBe('');
    expect((flagService as any).replaceRefFunctionsWithA1Refs('=REF(COLUMN("value"),ROW("missing"))', ['value'], ['r'])).toBe('=#REF!');

    (flagService as any)._dataView = { getItems: () => [{ id: 'r', value: '' }] };
    flagService.setFormula('r', 'value', '=1');
    vi.spyOn(flagService as any, 'evaluateFormulaExpression')
      .mockReturnValueOnce(Number.POSITIVE_INFINITY)
      .mockReturnValueOnce(Number.NaN);
    expect(flagService.getEvaluatedCellValue('r', 'value', '=1', 0)).toBe(FORMULA_ERROR.NUM);
    flagService.registerCustomFunction('NAN', () => Number.NaN);
    flagService.setFormula('r', 'value', '=2');
    expect(flagService.getEvaluatedCellValue('r', 'value', '=2', 0)).toBe(FORMULA_ERROR.VALUE);
    flagService.setFormula('r', 'value', '=Z1');
    expect(flagService.getEvaluatedCellValue('r', 'value', '=Z1', 0)).toBe(FORMULA_ERROR.REF);
    expect((flagService as any).evaluateExpressionWithParser('"x"^2', new Map())).toBe(FORMULA_ERROR.VALUE);
  });

  it('should set/get/has formula by row and column ids', () => {
    const service = new FormulaService();

    service.setFormula('id_1', 'total', '=REF(COLUMN("price"),ROW("id_1"))*2');

    expect(service.hasFormula('id_1', 'total')).toBeTruthy();
    expect(service.getFormula('id_1', 'total')).toBe('=REF(COLUMN("price"),ROW("id_1"))*2');
  });

  it('loads formulas from a formula data source and mirrors store changes to it', () => {
    const items: any[] = [
      { id: 'a', price: 2, total: 2 },
      { id: 'b', price: 5, total: 5 },
      { price: 9, total: 9 },
    ];
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const store = new Map<string, string>([['a|total', '=REF(COLUMN("price"),ROW("a"))*3']]);
    const setFormula = vi.fn((rowId: number | string, columnId: number | string, formula: string | undefined) => {
      if (formula === undefined) {
        store.delete(`${rowId}|${columnId}`);
      } else {
        store.set(`${rowId}|${columnId}`, formula);
      }
    });
    const service = new FormulaService({
      autoAssignEditor: false,
      formulaDataSource: { getFormula: (rowId, columnId) => store.get(`${rowId}|${columnId}`), setFormula },
    });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);

    expect(setFormula).not.toHaveBeenCalled();
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(6);
    expect(service.hasFormula('b', 'total')).toBe(false);

    service.setFormula('b', 'total', '=A2+1');
    expect(store.get('b|total')).toBe('=REF(COLUMN("price"),ROW("b"))+1');
    expect(service.removeFormula('a', 'total')).toBe(true);
    expect(store.has('a|total')).toBe(false);
    service.setFormula('b', 'total', null);
    expect(store.has('b|total')).toBe(false);
    service.setFormula('b', 'total', null);
    expect(setFormula).toHaveBeenCalledTimes(3);
  });

  it('reconciles stored formulas when dataset synchronization receives plain values', () => {
    const items = [{ id: 'a', value: '=A1*2' }];
    const columns: Column[] = [{ id: 'value', field: 'value', allowFormula: true }];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    expect(service.hasFormula('a', 'value')).toBe(true);

    items[0].value = 7;
    service.syncFormulasFromDataset();
    expect(service.hasFormula('a', 'value')).toBe(false);
    expect(service.getEvaluatedCellValue('a', 'value', 7, 7)).toBe(7);

    service.setFormula('missing', 'value', '=1+1');
    service.syncFormulasFromDataset();
    expect(service.hasFormula('missing', 'value')).toBe(true);
  });

  it('should map grouped single-cell references to displayed rows without losing collapsed identities', () => {
    const items = [
      { id: 'a', price: 2, total: '=A1*2' },
      { id: 'b', price: 7, total: '=A2*2' },
    ];
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    let grouped = false;
    let rows: any[] = items;
    const dataView = { getItems: () => items, getLength: () => rows.length, getItem: (row: number) => rows[row], getGrouping: () => (grouped ? [{}] : []) };
    const service = new FormulaService();
    service.init({
      getColumns: () => columns,
      setColumns: (next: Column[]) => columns.splice(0, columns.length, ...next),
      getData: () => dataView,
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any);
    const params = columns[1].editor!.params as any;
    grouped = true;
    rows = [{ __group: true }, items[1], { __groupTotals: true }, items[0]];
    expect(params.toDisplayFormula(items[0].total, items[0])).toBe('=A4*2');
    expect(params.toStoredFormula('=A2*2', items[0])).toBe('=REF(COLUMN("price"),ROW("b"))*2');
    expect(params.toStoredFormula('=A1*2', items[0])).toBe('=#REF!*2');
    expect(params.toStoredFormula('=SUM(A2:A99)', items[0])).toBe('=SUM(#REF!)');
    expect(params.toStoredFormula('=SUM(A2:Z2)', items[0])).toBe('=SUM(#REF!)');
    expect(params.toStoredFormula('="A2:A99"', items[0])).toBe('="A2:A99"');
    rows = [{ __group: true }, items[1]];
    expect(params.toDisplayFormula(items[0].total, items[0])).toBe('=REF(COLUMN("price"),ROW("a"))*2');
    expect((service as any).replaceRefFunctionsWithA1Refs('=REF(COLUMN("price"),ROW("deleted"))', ['price'], [undefined], 1, true)).toBe('=#REF!');
    rows = [{ __group: true }, items[0], items[1]];
    expect(params.toDisplayFormula(items[0].total, items[0])).toBe('=A2*2');
    grouped = false;
    rows = items;
    expect(params.toDisplayFormula(items[0].total, items[0])).toBe('=A1*2');
    service.setFormula('a', 'total', '=SUM($A$1:A2)');
    grouped = true;
    rows = [{ __group: true }, items[1]];
    const collapsed = params.toDisplayFormula(service.getFormula('a', 'total'), items[0]);
    expect(collapsed).toBe('=SUM(REFRANGE(REF(COLUMN("price"),ROW("a")),A2))');
    const edited = params.toStoredFormula(`${collapsed}+1`, items[0]);
    service.setFormula('a', 'total', edited);
    grouped = false;
    rows = items;
    expect(params.toDisplayFormula(edited, items[0])).toBe('=SUM($A$1:A2)+1');
    grouped = true;
    service.setFormula('a', 'total', '=SUM($A$1:A2)');
    service.setFormula('a', 'total', params.toStoredFormula(collapsed, items[0]));
    grouped = false;
    rows = items;
    expect(params.toDisplayFormula(service.getFormula('a', 'total'), items[0])).toBe('=SUM($A$1:A2)');
  });

  it('maps editor and highlight references to displayed rows when filtering or paging hides records', () => {
    const items = [
      { id: 'a', price: 2, total: null },
      { id: 'b', price: 7, total: null },
      { id: 'c', price: 9, total: '=REF(COLUMN("price"),ROW("b"))*2' },
    ];
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    let rows: any[] = [items[1], items[2]];
    const dataView = { getItems: () => items, getLength: () => rows.length, getItem: (row: number) => rows[row], getGrouping: () => [] };
    const setCellCssStyles = vi.fn();
    const service = new FormulaService();
    service.init({
      getColumns: () => columns,
      setColumns: (next: Column[]) => columns.splice(0, columns.length, ...next),
      getData: () => dataView,
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
      setCellCssStyles,
      removeCellCssStyles: vi.fn(),
    } as any);
    const params = columns[1].editor!.params as any;

    expect(params.toDisplayFormula(items[2].total, items[2])).toBe('=A1*2');
    expect(params.toStoredFormula('=A2+A1', items[2])).toBe('=REF(COLUMN("price"),ROW("c"))+REF(COLUMN("price"),ROW("b"))');
    expect(params.toStoredFormula('=A3', items[2])).toBe('=#REF!');
    expect(params.validateFormula('=A1/0', items[2])).toBe(FORMULA_ERROR.DIV0);
    expect(params.validateFormula('=A1*2', items[2])).toBeUndefined();
    expect(service.getEvaluatedCellValue('c', 'total', items[2].total, undefined)).toBe(14);

    rows = [items[2]];
    expect(params.toDisplayFormula(items[2].total, items[2])).toBe('=REF(COLUMN("price"),ROW("b"))*2');
    expect(service.getEvaluatedCellValue('c', 'total', items[2].total, undefined)).toBe(14);

    rows = items;
    expect(params.toDisplayFormula(items[2].total, items[2])).toBe('=A2*2');
  });

  it('preserves range membership through nested grouping, reorder, collapse and editor commits', () => {
    const items = [
      { key: 'a', price: 2, qty: 3, total: '' },
      { key: 'b', price: 7, qty: 5, total: '' },
      { key: 'c', price: 11, qty: 9, total: '' },
      { key: 'd', price: 13, qty: 10, total: '' },
    ];
    const originalItems = [...items];
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'qty', field: 'qty' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    let rows: any[] = items;
    let grouping: any[] = [];
    const service = new FormulaService();
    service.init({
      getColumns: () => columns,
      setColumns: (next: Column[]) => columns.splice(0, columns.length, ...next),
      getData: () => ({ getItems: () => items, getLength: () => rows.length, getItem: (row: number) => rows[row], getGrouping: () => grouping }),
      getOptions: () => ({ datasetIdPropertyName: 'key' }),
    } as any);
    const params = columns[2].editor!.params as any;
    service.setFormula('d', 'total', '=SUMIF(A1:A3,">5",B1:B3)');
    const stored = service.getFormula('d', 'total')!;
    expect(service.getEvaluatedCellValue('d', 'total')).toBe(14);
    grouping = [{ getter: 'outer' }, { getter: 'inner' }];
    rows = [{ __group: true }, originalItems[2], { __group: true }, originalItems[0], { __groupTotals: true }, originalItems[3], originalItems[1]];
    items.reverse();
    service.setFormula('d', 'total', stored);
    expect(service.getEvaluatedCellValue('d', 'total')).toBe(14);
    expect(params.toDisplayFormula(stored, originalItems[3])).toBe('=SUMIF(REFRANGE(A4,A7,A2),">5",REFRANGE(B4,B7,B2))');
    const entered = params.toStoredFormula('=SUM(A7:A2)', originalItems[3]);
    service.setFormula('d', 'total', entered);
    expect(service.getEvaluatedCellValue('d', 'total')).toBe(33);
    expect(entered).not.toContain('__group');
    rows = [{ __group: true }, originalItems[3]];
    const collapsed = params.toDisplayFormula(entered, originalItems[3]);
    expect(collapsed).toContain('ROW("c")');
    expect(collapsed).toContain('A2');
    service.setFormula('d', 'total', params.toStoredFormula(collapsed, originalItems[3]));
    expect(service.getEvaluatedCellValue('d', 'total')).toBe(33);
    grouping = [];
    rows = items;
    expect(service.getEvaluatedCellValue('d', 'total')).toBe(33);
    items.splice(
      items.findIndex((item) => item.key === 'b'),
      1
    );
    service.setFormula('d', 'total', entered);
    expect(service.getEvaluatedCellValue('d', 'total')).toBe('#REF!');
  });

  it('feeds evaluated values to grouping aggregators and preserves records and lifecycle', () => {
    const items = [
      { key: 'a', price: 2, amount: '=A1*3' },
      { key: 'b', price: 7, amount: 4 },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({
      getColumns: () => [
        { id: 'price', field: 'price' },
        { id: 'total', field: 'amount', allowFormula: true },
      ],
      getData: () => ({ getItems: () => items }),
      getOptions: () => ({ datasetIdPropertyName: 'key' }),
    } as any);
    const aggregator = service.createGroupingAggregator(new Aggregators.Sum('amount'), 'total');
    expect(aggregator.field).toBe('amount');
    expect(aggregator.type).toBe('sum');
    expect(aggregator.isInitialized).toBe(false);
    aggregator.init();
    expect(aggregator.isInitialized).toBe(true);
    items.forEach((item) => aggregator.accumulate!(item));
    aggregator.accumulate!({ __group: true });
    const totals = {};
    aggregator.storeResult(totals);
    expect(totals).toEqual({ sum: { amount: 10 } });
    expect(items[0].amount).toBe('=A1*3');
    items[0].price = 5;
    aggregator.init();
    items.forEach((item) => aggregator.accumulate!(item));
    aggregator.storeResult(totals);
    expect(totals).toEqual({ sum: { amount: 19 } });
    const defaultColumn = service.createGroupingAggregator({ field: 'price', type: 'sum', init: vi.fn(), storeResult: vi.fn() });
    defaultColumn.accumulate!(items[0]);
  });

  it('round trips formula snapshots and absolute flags between service instances', () => {
    const items = [
      { id: 'a', price: 2 },
      { id: 'b', price: 3 },
    ];
    const grid = {
      getColumns: () => [
        { id: 'price', field: 'price' },
        { id: 'total', field: 'total' },
      ],
      getData: () => ({ getItems: () => items }),
      getOptions: () => ({}),
    } as any;
    const source = new FormulaService({ autoAssignEditor: false });
    source.init(grid);
    source.setFormula('a', 'total', '=SUM($A$1:A2)');
    const snapshot = source.getFormulaSnapshot('a', 'total')!;
    expect(snapshot.version).toBe(1);
    const target = new FormulaService({ autoAssignEditor: false });
    target.init(grid);
    target.setFormulaSnapshot('a', 'total', JSON.parse(JSON.stringify(snapshot)));
    expect((target as any).toDisplayFormulaForCell(target.getFormula('a', 'total'), 'a', 'total')).toBe('=SUM($A$1:A2)');
    expect(target.getEvaluatedCellValue('a', 'total')).toBe(5);
    snapshot.referenceFlags[0].column = false;
    expect((target as any).toDisplayFormulaForCell(target.getFormula('a', 'total'), 'a', 'total')).toBe('=SUM($A$1:A2)');
    expect(target.getFormulaSnapshot('missing', 'total')).toBeUndefined();
    for (const invalid of [
      null,
      {},
      { version: 2, formula: '=1', referenceFlags: [] },
      { version: 1, formula: 12, referenceFlags: [] },
      { version: 1, formula: '1', referenceFlags: [] },
      { version: 1, formula: '=1', referenceFlags: null },
      { version: 1, formula: '=1', referenceFlags: [{}] },
    ]) {
      expect(() => target.setFormulaSnapshot('a', 'total', invalid as any)).toThrow(TypeError);
    }
    expect(target.removeFormula('a', 'total')).toBe(true);
    target.setFormula('a', 'total', '=REF(COLUMN("price"),ROW("a"))');
    expect((target as any).toDisplayFormulaForCell(target.getFormula('a', 'total'), 'a', 'total')).toBe('=A1');
  });

  it('atomically restores the whole formula store after changing layout and data order', () => {
    const items = [
      { key: 1, price: 2, total: '=99' },
      { key: 2, price: 7, total: '=88' },
    ];
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    let rows: any[] = items;
    let grouping = false;
    const grid = {
      getColumns: () => columns,
      setColumns: (next: Column[]) => columns.splice(0, columns.length, ...next),
      getData: () => ({
        getItems: () => items,
        getLength: () => rows.length,
        getItem: (index: number) => rows[index],
        getGrouping: () => (grouping ? [{}] : []),
      }),
      getOptions: () => ({ datasetIdPropertyName: 'key' }),
    } as any;
    const source = new FormulaService();
    source.init(grid);
    source.setFormula(1, 'total', '=SUM($A$1:A2)');
    source.setFormula(2, 'total', '=4');
    const saved = JSON.parse(JSON.stringify(source.getFormulaStoreSnapshot()));
    source.dispose();
    columns.reverse();
    columns.find((column) => column.id === 'price')!.hidden = true;
    rows = [{ __group: true }, items[1], { __groupTotals: true }, items[0]];
    grouping = true;
    const restored = new FormulaService();
    restored.init(grid);
    restored.setFormulaStoreSnapshot(saved);
    expect(restored.getEvaluatedCellValue(1, 'total')).toBe(9);
    expect(restored.getEvaluatedCellValue(2, 'total')).toBe(4);
    expect((restored as any).toDisplayFormulaForCell(restored.getFormula(1, 'total'), 1, 'total', true)).toBe('=SUM(REFRANGE($B$4,B2))');
    rows = [{ __group: true }, items[1]];
    expect(restored.getEvaluatedCellValue(1, 'total')).toBe(9);
    expect((restored as any).toDisplayFormulaForCell(restored.getFormula(1, 'total'), 1, 'total', true)).toContain('ROW("1")');
    const again = restored.getFormulaStoreSnapshot();
    expect(again.cells).toHaveLength(2);
    saved.cells[0].referenceFlags[0].column = false;
    expect(restored.getFormulaStoreSnapshot()).toEqual(again);
    restored.setFormula(2, 'total', '=7');
    expect(restored.getEvaluatedCellValue(2, 'total', '=8', undefined)).toBe(8);
    restored.removeFormula(1, 'total');
    restored.clearFormulas();
    expect(restored.getFormulaStoreSnapshot()).toEqual({ version: 1, cells: [] });
  });

  it('rewires formula columns when a layout replaces definitions and unsubscribes on dispose', () => {
    const onBeforeSetColumns = new SlickEvent<any>();
    let columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const item = { id: 'a', price: 3, total: '=A1*2' };
    const grid = {
      onBeforeSetColumns,
      getColumns: () => columns,
      setColumns: (next: Column[]) => {
        onBeforeSetColumns.notify({ newColumns: next });
        columns = next;
      },
      getData: () => ({ getItems: () => [item], getItem: () => item }),
      getOptions: () => ({ editable: true }),
    } as any;
    const service = new FormulaService();
    service.init(grid);
    const original = columns[1];
    grid.setColumns([...columns]);
    expect(columns[1]).toBe(original);
    grid.setColumns([
      { id: 'price', field: 'price' },
      { id: 'total', field: 'total', allowFormula: true },
    ]);
    expect(columns[1].editor?.model).toBe(FormulaCellEditor);
    const formatted = columns[1].formatter?.(0, 1, item.total, columns[1], item, grid);
    expect(formatted).toBeInstanceOf(HTMLElement);
    expect((formatted as HTMLElement).textContent).toBe('6');
    service.dispose();
    const replacement = [{ id: 'total', field: 'total', allowFormula: true }];
    grid.setColumns(replacement);
    expect(replacement[0].editor).toBeUndefined();
  });

  it('rejects malformed and duplicate store snapshots without changing existing formulas', () => {
    const service = new FormulaService({ autoAssignEditor: false });
    expect(() => service.setFormulaStoreSnapshot({ version: 1, cells: [] })).toThrow('Initialize FormulaService');
    service.init({ getColumns: () => [{ id: 'total' }], getData: () => ({ getItems: () => [{ id: 1 }] }), getOptions: () => ({}) } as any);
    service.setFormula(1, 'total', '=42');
    const before = service.getFormulaStoreSnapshot();
    const valid = before.cells[0];
    for (const invalid of [
      null,
      {},
      { version: 2, cells: [] },
      { version: 1, cells: null },
      { version: 1, cells: [null] },
      { version: 1, cells: [{ ...valid, rowId: '' }] },
      { version: 1, cells: [{ ...valid, columnId: NaN }] },
      { version: 1, cells: [{ ...valid, formula: 'oops' }] },
      { version: 1, cells: [valid, { ...valid }] },
    ]) {
      expect(() => service.setFormulaStoreSnapshot(invalid as any)).toThrow(TypeError);
      expect(service.getFormulaStoreSnapshot()).toEqual(before);
    }
    service.setFormulaStoreSnapshot({ version: 1, cells: [] });
    expect(service.getFormulaStoreSnapshot()).toEqual({ version: 1, cells: [] });
  });

  it('retains snapshots for missing identities and does not modify or suppress dataset formulas', () => {
    const items = [
      { id: 'a', price: 2, total: '=2' },
      { id: 'b', price: 7, total: '=3' },
    ];
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const grid = { getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any;
    const service = new FormulaService({ autoAssignEditor: false });
    service.init(grid);
    service.setFormula('a', 'total', '=A2');
    const saved = service.getFormulaStoreSnapshot();
    const missing = items.pop()!;
    service.setFormulaStoreSnapshot(saved);
    expect(service.hasFormula('b', 'total')).toBe(true);
    expect(service.getEvaluatedCellValue('a', 'total')).toBe('#REF!');
    items.push(missing);
    service.setFormulaStoreSnapshot(saved);
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(7);
    service.setFormulaStoreSnapshot({ version: 1, cells: [] });
    expect(items[0].total).toBe('=2');
    expect(service.hasFormula('a', 'total')).toBe(false);
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(2);
  });

  it('exports disjoint ranges as single helper arguments with original member order', () => {
    const service = new FormulaService({ autoAssignEditor: false });
    const items = [
      { id: 'a', price: 2, qty: 3 },
      { id: 'b', price: 7, qty: 5 },
    ];
    service.init({ getColumns: () => [{ id: 'price' }, { id: 'qty' }], getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    service.setFormula('a', 'total', '=SUMIF(A1:A2,">5",B1:B2)');
    const registerFormulaRange = vi.fn().mockReturnValueOnce("'Formula References'!$A$1:$A$2").mockReturnValueOnce("'Formula References'!$A$3:$A$4");
    expect(
      service.getExcelFormula({
        rowId: 'a',
        columnId: 'total',
        columnIds: ['price', 'qty'],
        rowIds: ['b', 'a'],
        excelRowOffset: 2,
        groupedRowPositions: new Map([
          ['a', 8],
          ['b', 4],
        ]),
        groupedColumnOffset: 1,
        registerFormulaRange,
      } as any)
    ).toBe("SUMIF('Formula References'!$A$1:$A$2,\">5\",'Formula References'!$A$3:$A$4)");
    expect(registerFormulaRange.mock.calls).toEqual([[['B8', 'B4']], [['C8', 'C4']]]);
    service.setFormula('a', 'total', '=COUNTA(A1:A2)');
    registerFormulaRange.mockReturnValue("'Formula References'!$A$1:$A$2");
    expect(
      service.getExcelFormula({
        rowId: 'a',
        columnId: 'total',
        columnIds: ['price', 'qty'],
        rowIds: ['b', 'a'],
        excelRowOffset: 2,
        groupedRowPositions: new Map([
          ['a', 8],
          ['b', 4],
        ]),
        groupedColumnOffset: 1,
        registerFormulaRange,
      } as any)
    ).toBe('(COUNTA(B8,B4))');
    const registerFormulaPresenceRange = vi.fn().mockReturnValue("'Formula References'!$A$3:$A$4");
    expect(
      service.getExcelFormula({
        rowId: 'a',
        columnId: 'total',
        columnIds: ['price', 'qty'],
        rowIds: ['b', 'a'],
        excelRowOffset: 2,
        groupedRowPositions: new Map([
          ['a', 8],
          ['b', 4],
        ]),
        groupedColumnOffset: 1,
        registerFormulaRange,
        registerFormulaPresenceRange,
      } as any)
    ).toBe("(SUM('Formula References'!$A$3:$A$4))");
    expect(registerFormulaPresenceRange).toHaveBeenCalledWith(['B8', 'B4']);
    registerFormulaPresenceRange.mockReturnValue('#REF!');
    expect(
      service.getExcelFormula({
        rowId: 'a',
        columnId: 'total',
        columnIds: ['price', 'qty'],
        rowIds: ['b', 'a'],
        excelRowOffset: 2,
        groupedRowPositions: new Map([
          ['a', 8],
          ['b', 4],
        ]),
        groupedColumnOffset: 1,
        registerFormulaRange,
        registerFormulaPresenceRange,
      } as any)
    ).toBe('(#REF!)');
    registerFormulaPresenceRange.mockReturnValue(undefined);
    expect(
      service.getExcelFormula({
        rowId: 'a',
        columnId: 'total',
        columnIds: ['price', 'qty'],
        rowIds: ['b', 'a'],
        excelRowOffset: 2,
        groupedRowPositions: new Map([
          ['a', 8],
          ['b', 4],
        ]),
        groupedColumnOffset: 1,
        registerFormulaRange,
        registerFormulaPresenceRange,
      } as any)
    ).toBe('(COUNTA(B8,B4))');
    registerFormulaRange.mockReturnValue('H'.repeat(8200));
    service.setFormula('a', 'total', '=SUM(A1:A2)');
    expect(
      service.getExcelFormula({
        rowId: 'a',
        columnId: 'total',
        columnIds: ['price', 'qty'],
        rowIds: ['b', 'a'],
        excelRowOffset: 2,
        groupedRowPositions: new Map([
          ['a', 8],
          ['b', 4],
        ]),
        groupedColumnOffset: 1,
        registerFormulaRange,
      } as any)
    ).toBe('#REF!');
    service.setFormula('a', 'total', '=SUMIF(A1:A2,">5",B1:B2)');
    items.pop();
    expect(service.getExcelFormula({ rowId: 'a', columnId: 'total', columnIds: ['price', 'qty'], rowIds: ['a'], excelRowOffset: 2 } as any)).toBe(
      'SUMIF(#REF!,">5",#REF!)'
    );
  });

  it('chunks source references when a custom exporter does not provide presence ranges', () => {
    const items = Array.from({ length: 260 }, (_, index) => ({ id: String(index), value: index }));
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => [{ id: 'value' }], getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    service.setFormula('0', 'total', '=COUNTA(A1:A260)');
    const formula = service.getExcelFormula({
      rowId: '0',
      columnId: 'total',
      columnIds: ['value'],
      rowIds: items.map((item) => item.id),
      excelRowOffset: 2,
      groupedRowPositions: new Map(items.map((item, index) => [item.id, index * 2 + 2])),
      registerFormulaRange: () => "'Formula References'!$A$1:$A$260",
    } as any)!;
    const chunks = [...formula.matchAll(/COUNTA\(([^)]*)\)/g)].map((match) => match[1].split(','));
    expect(chunks.map((chunk) => chunk.length)).toEqual([255, 5]);
    expect(chunks[0][0]).toBe('A2');
    expect(chunks[1][4]).toBe('A520');
  });

  it('should preserve stable references when rows move and report missing references in evaluation and export', () => {
    const items = [
      { id: 'first', value: 2, total: '' },
      { id: 'second', value: 7, total: '' },
    ];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({
      getColumns: () => columns,
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any);
    service.setFormula('second', 'total', '=A1+1');
    items.reverse();
    expect(service.getEvaluatedCellValue('second', 'total', undefined, undefined)).toBe(3);
    items.pop();
    service.setFormula('second', 'total', '=REF(COLUMN("value"),ROW("first"))+1');
    expect(service.getEvaluatedCellValue('second', 'total', undefined, undefined)).toBe('#REF!');
    expect(service.getExcelFormula({ rowId: 'second', columnId: 'total', columnIds: ['value', 'total'], rowIds: ['second'], excelRowOffset: 2 } as any)).toBe(
      '#REF!+1'
    );
    service.setFormula('second', 'total', '=SUM(REF(COLUMN("value"),ROW("first")):REF(COLUMN("value"),ROW("second")))');
    expect(service.getEvaluatedCellValue('second', 'total', undefined, undefined)).toBe('#REF!');
    expect((service as any).evaluateFormulaExpression('="text #REF!"', { visited: new Set(), memo: new Map() })).toBe('text #REF!');
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

  it('should fill grouped single-cell references using displayed rows and preserve absolute references', () => {
    const columns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [
      { id: 'a', price: 2, total: '=$A$1+A1' },
      { id: 'b', price: 4, total: '' },
      { id: 'c', price: 6, total: '' },
    ];
    let grouped = false;
    let rows: any[] = items;
    const dataView = {
      getItems: () => items,
      getLength: () => rows.length,
      getItem: (row: number) => rows[row],
      getGrouping: () => (grouped ? [{}] : []),
      updateItems: vi.fn(),
    };
    const grid = {
      getColumns: () => columns,
      getVisibleColumns: () => columns,
      setColumns: (next: Column[]) => columns.splice(0, columns.length, ...next),
      getData: () => dataView,
      getDataItem: (row: number) => rows[row],
      getOptions: () => ({ datasetIdPropertyName: 'id' }),
    } as any;
    const service = new FormulaService();
    service.init(grid);
    grouped = true;
    rows = [{ __group: true }, items[0], items[1], { __groupTotals: true }, { __group: true }, items[2]];
    const fill = () =>
      (service as any).handleDragReplaceCells({}, { prevSelectedRange: new SlickRange(1, 1), selectedRange: new SlickRange(1, 1, 5, 1), grid });
    fill();
    expect(service.getFormula('c', 'total')).toBe('=REF(COLUMN("price"),ROW("a"))+REF(COLUMN("price"),ROW("c"))');
    expect(service.getEvaluatedCellValue('c', 'total')).toBe(8);
    grouped = false;
    expect((service as any).toDisplayFormulaForCell(service.getFormula('c', 'total'), 'c', 'total')).toBe('=$A$1+A3');

    service.setFormula('a', 'total', '=SUM(A1:A2)');
    items[2].total = '';
    service.removeFormula('c', 'total');
    grouped = true;
    fill();
    expect(service.getFormula('c', 'total')).toBe('=SUM(#REF!)');
    expect(service.getEvaluatedCellValue('c', 'total')).toBe('#REF!');

    grouped = false;
    service.setFormula('a', 'total', '=A3');
    service.removeFormula('b', 'total');
    items[1].total = '';
    grouped = true;
    rows = [{ __group: true }, items[0], items[1]];
    fill();
    expect(service.getFormula('b', 'total')).toBe('=REF(COLUMN("price"),ROW("c"))');
    expect(service.getEvaluatedCellValue('b', 'total')).toBe(6);
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

  it('should map grouped Excel single-cell references to worksheet coordinates', () => {
    const items = [
      { id: 'a', price: 2, total: '=A1' },
      { id: 'b', price: 4, total: '' },
    ];
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => [{ id: 'price' }, { id: 'total' }], getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const context = {
      rowId: 'a',
      columnId: 'total',
      columnIds: ['price', 'total'],
      rowIds: ['a', 'b'],
      excelRowOffset: 2,
      groupedColumnOffset: 1,
      groupedRowPositions: new Map([
        ['a', 4],
        ['b', 8],
      ]),
    } as any;
    service.setFormula('a', 'total', '=$A$1+A2');
    expect(service.getExcelFormula(context)).toBe('$B$4+B8');
    context.groupedRowPositions.delete('b');
    expect(service.getExcelFormula(context)).toBe('#REF!');
    service.setFormula('a', 'total', '=SUM(A1:A2)');
    expect(service.getExcelFormula(context)).toBe('#REF!');
    context.groupedRowPositions.set('b', 5);
    expect(service.getExcelFormula(context)).toBe('SUM(B4:B5)');
    context.groupedRowPositions.set('b', 8);
    expect(service.getExcelFormula(context)).toBe('SUM(#REF!)');
    service.setFormula('a', 'total', '=SUM(A2:A1)');
    context.groupedRowPositions.set('b', 5);
    expect(service.getExcelFormula(context)).toBe('SUM(B4:B5)');
    service.setFormula('a', 'total', '=SUM(A1:B2)');
    expect(service.getExcelFormula(context)).toBe('SUM(B4:C5)');
    context.columnIds = ['total', 'price'];
    expect(service.getExcelFormula(context)).toBe('SUM(#REF!)');
    context.columnIds = ['price', 'total'];
    service.setFormula('a', 'total', '=SUM(REF(COLUMN("price"),ROW("a")):REF(COLUMN("price"),ROW("deleted")))');
    expect(service.getExcelFormula(context)).toBe('#REF!');
    service.setFormula('a', 'total', '=Z99');
    expect(service.getExcelFormula(context)).toBeUndefined();
    service.setFormula('a', 'total', '=REF(COLUMN("price"),ROW(1))');
    expect(service.getExcelFormula(context)).toBeUndefined();
    service.setFormula('a', 'total', '="text #REF!"');
    expect(service.getExcelFormula(context)).toBe('"text #REF!"');
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

  it('preserves custom editor models and formatter pipelines across layout changes and disposal', () => {
    const customEditor = (() => undefined) as any;
    const classEditor = (() => undefined) as any;
    const formatter = vi.fn((_row, _cell, value) => `result:${value}`);
    const originalColumns: Column[] = [
      { id: 'price', field: 'price' },
      { id: 'model', field: 'model', allowFormula: true, editor: { model: customEditor }, formatter },
      { id: 'class', field: 'class', allowFormula: true, editorClass: classEditor, formatter },
    ];
    let columns = originalColumns.map((column) => ({ ...column }));
    const item = { id: 1, price: 2, model: '=A1*3', class: '=A1*4' };
    const onBeforeSetColumns = new SlickEvent<any>();
    const grid = {
      onBeforeSetColumns,
      getColumns: () => columns,
      setColumns: (next: Column[]) => {
        onBeforeSetColumns.notify({ newColumns: next });
        columns = next;
      },
      getData: () => ({ getItems: () => [item] }),
      getOptions: () => ({ editable: true }),
    } as any;
    const service = new FormulaService();
    service.init(grid);
    expect(columns[1].editor?.model).toBe(customEditor);
    expect(columns[2].editorClass).toBe(classEditor);
    expect(columns[1].formatter?.(0, 1, item.model, columns[1], item, grid)).toBe('result:6');
    expect(columns[2].formatter?.(0, 2, item.class, columns[2], item, grid)).toBe('result:8');
    const prepared = columns[1].formatter;
    grid.setColumns([...columns]);
    expect(columns[1].formatter).toBe(prepared);
    grid.setColumns(originalColumns.map((column) => ({ ...column })));
    expect(columns[1].formatter?.(0, 1, item.model, columns[1], item, grid)).toBe('result:6');
    service.dispose();
    expect(columns[1].editor?.model).toBe(customEditor);
    expect(columns[2].editorClass).toBe(classEditor);
    expect(columns[1].formatter).toBe(formatter);
    expect(columns[2].formatter).toBe(formatter);
  });

  it('preserves a newly assigned custom editor on disposal', () => {
    const customEditor = (() => undefined) as any;
    let columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const onBeforeSetColumns = new SlickEvent<any>();
    const grid = {
      onBeforeSetColumns,
      getColumns: () => columns,
      setColumns: (next: Column[]) => {
        onBeforeSetColumns.notify({ newColumns: next });
        columns = next;
      },
      getData: () => ({ getItems: () => [] }),
      getOptions: () => ({}),
    } as any;
    const service = new FormulaService();
    service.init(grid);
    grid.setColumns([{ ...columns[0], editorClass: customEditor, editor: { model: customEditor } }]);
    service.dispose();
    expect(columns[0].editorClass).toBe(customEditor);
    expect(columns[0].editor?.model).toBe(customEditor);
    expect(columns[0].formatter).toBeUndefined();
  });

  it('supports explicitly configured FormulaCellEditor even when automatic assignment is disabled', () => {
    let columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true, editor: { model: FormulaCellEditor } }];
    const grid = {
      getColumns: () => columns,
      setColumns: (next: Column[]) => {
        columns = next;
      },
      getData: () => ({ getItems: () => [{ id: 1, total: '=1' }] }),
      getOptions: () => ({ editable: true }),
    } as any;
    const service = new FormulaService({ autoAssignEditor: false });
    service.init(grid);
    expect(columns[0].editor?.params?.toStoredFormula).toBeTypeOf('function');
    service.dispose();
    expect(columns[0].editor?.model).toBe(FormulaCellEditor);
  });

  it('synchronizes custom editor changes and refreshes dependent cells after the commit', async () => {
    const onCellChange = new SlickEvent<any>();
    const customEditor = (() => undefined) as any;
    let grouped = false;
    const items = [
      { id: 'a', value: 2, total: '=A1' },
      { id: 'b', value: 4, total: '' },
    ];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true, editor: { model: customEditor } },
    ];
    const refresh = vi.fn();
    const dataView = {
      getItems: () => items,
      getGrouping: () => (grouped ? [{}] : []),
      getLength: () => 3,
      getItem: (row: number) => [{ __group: true }, ...items][row],
      refresh,
    };
    const grid = {
      onCellChange,
      getColumns: () => columns,
      setColumns: (next: Column[]) => columns.splice(0, columns.length, ...next),
      getData: () => dataView,
      getOptions: () => ({}),
      invalidate: vi.fn(),
      render: vi.fn(),
    } as any;
    const service = new FormulaService();
    service.init(grid);
    grid.invalidate.mockClear();
    grid.render.mockClear();
    items[0].total = '=A1*3';
    onCellChange.notify({ column: columns[1], item: items[0], row: 0, cell: 1 });
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(6);
    onCellChange.notify({ column: columns[1], item: { total: '=A1' }, row: 0, cell: 1 });
    items[0].total = '=A2*2';
    grouped = true;
    onCellChange.notify({ column: columns[1], item: items[0], row: 1, cell: 1 });
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(4);
    onCellChange.notify({ column: columns[0], item: items[0], row: 1, cell: 0 });
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(grid.invalidate).toHaveBeenCalledTimes(1);
    expect(grid.render).toHaveBeenCalledTimes(1);
    items[0].total = '19';
    onCellChange.notify({ column: columns[1], item: items[0], row: 1, cell: 1 });
    expect(service.hasFormula('a', 'total')).toBe(false);
    service.dispose();
    grid.invalidate.mockClear();
    grid.render.mockClear();
    await Promise.resolve();
    expect(grid.invalidate).not.toHaveBeenCalled();
    expect(grid.render).not.toHaveBeenCalled();
  });

  it('honors row-specific custom editors when synchronizing formula changes', async () => {
    const customEditor = (() => undefined) as any;
    const onCellChange = new SlickEvent<any>();
    let metadata: any = { columns: { total: { editorClass: customEditor } } };
    let activeEditor: any;
    const items = [{ id: 'a', value: 2, total: '=A1' }];
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const grid = {
      onCellChange,
      getColumns: () => columns,
      setColumns: (next: Column[]) => columns.splice(0, columns.length, ...next),
      getData: () => ({ getItems: () => items, getItemMetadata: () => metadata }),
      getCellEditor: () => activeEditor,
      getOptions: () => ({}),
    } as any;
    const service = new FormulaService();
    service.init(grid);
    items[0].total = '=A1*4';
    onCellChange.notify({ column: columns[1], item: items[0], row: 0, cell: 1 });
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(8);
    metadata = { columns: { 1: { editorClass: customEditor } } };
    items[0].total = '=A1*5';
    onCellChange.notify({ column: columns[1], item: items[0], row: 0, cell: 1 });
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(10);
    activeEditor = Object.create(FormulaCellEditor.prototype);
    items[0].total = '=A1*9';
    onCellChange.notify({ column: columns[1], item: items[0], row: 0, cell: 1 });
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(10);
    await Promise.resolve();
    service.dispose();
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

    expect(service.getFormula('a_01', 'total')).toBe(
      '=SUM(REFRANGE(REF(COLUMN("price"),ROW("a_01")),REF(COLUMN("price"),ROW("o_02")),REF(COLUMN("price"),ROW("b_03"))))'
    );
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

  it('should clear the aggregate highlight key', () => {
    const setCellCssStyles = vi.fn();
    const removeCellCssStyles = vi.fn();
    const columns = Array.from({ length: 11 }, (_value, index) => ({
      id: String.fromCharCode(97 + index),
      field: String.fromCharCode(97 + index),
    })) as Column[];
    const gridStub = {
      getColumns: () => columns,
      setColumns: (_newCols: Column[]) => undefined,
      setCellCssStyles,
      removeCellCssStyles,
      getData: () => ({ getItems: () => [{ id: 1 }], getLength: () => 1 }),
    } as any;
    const service = new FormulaService();
    service.init(gridStub);

    service.clearFormulaReferenceHighlights();
    expect(removeCellCssStyles).toHaveBeenCalledOnce();
    expect(removeCellCssStyles).toHaveBeenCalledWith(FORMULA_REFERENCE_HIGHLIGHT_STYLE_KEY);
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

  it('shares dependency formulas across siblings during the same render pass', () => {
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
    const items = [{ id: 1, price: 10, qty: 3, subTotal: '=TRACK(A1*B1)', taxes: '=C1*0.1', total: '=C1+C1' }];

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
    service.setFormula(1, 'total', '=C1+C1');

    expect(service.getEvaluatedCellValue(1, 'taxes', items[0].taxes, 0)).toBe(3);
    expect(service.getEvaluatedCellValue(1, 'total', items[0].total, 0)).toBe(60);
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

  it('keeps two-dimensional range shape across row reorder and grouped export', () => {
    const items = [
      { id: 'a', a: 1, b: 10, c: 3, d: 30, total: '' },
      { id: 'b', a: 2, b: 20, c: 4, d: 40, total: '' },
      { id: 'c', a: 3, b: 30, c: 5, d: 50, total: '' },
      { id: 'd', a: 4, b: 40, c: 6, d: 60, total: '' },
    ];
    const columns: Column[] = ['a', 'b', 'c', 'd', 'total'].map((id) => ({ id, field: id, allowFormula: id === 'total' }));
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);
    const evaluate = (formula: string) => (service as any).evaluateFormulaExpression(formula, { visited: new Set(), memo: new Map() });
    expect(evaluate('=SUM(A1:B2,C1:D2)')).toBe(110);
    service.setFormula('a', 'total', '=SUM(A1:B2,C1:D2)');
    items.reverse();
    expect(service.getEvaluatedCellValue('a', 'total')).toBe(110);
    const registerFormulaRange = vi.fn().mockReturnValueOnce("'Formula References'!$A$1:$B$2").mockReturnValueOnce("'Formula References'!$A$3:$B$4");
    expect(
      service.getExcelFormula({
        rowId: 'a',
        columnId: 'total',
        columnIds: ['a', 'b', 'c', 'd', 'total'],
        rowIds: ['d', 'c', 'b', 'a'],
        excelRowOffset: 2,
        groupedRowPositions: new Map([
          ['a', 8],
          ['b', 4],
          ['c', 10],
          ['d', 12],
        ]),
        groupedColumnOffset: 1,
        registerFormulaRange,
      } as any)
    ).toBe("SUM('Formula References'!$A$1:$B$2,'Formula References'!$A$3:$B$4)");
    expect(registerFormulaRange.mock.calls).toEqual([
      [['B8', 'C8', 'B4', 'C4'], 2],
      [['D8', 'E8', 'D4', 'E4'], 2],
    ]);
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

  it('should calculate values without assigning an editor when autoAssignEditor is disabled', () => {
    const items = [{ id: 1, total: '=SUM(1,2)' }];
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const grid = {
      getColumns: () => columns,
      setColumns: (next: Column[]) => columns.splice(0, columns.length, ...next),
      getData: () => ({ getItems: () => items }),
      getOptions: () => ({ editable: true }),
    } as any;
    const service = new FormulaService({ autoAssignEditor: false });
    service.init(grid);
    expect(columns[0].editor?.model).toBeUndefined();
    expect(columns[0].editorClass).toBeUndefined();
    expect(columns[0].formatter?.(0, 0, items[0].total, columns[0], items[0], grid)).toBe(3);
    service.dispose();
    expect(columns[0].formatter).toBeUndefined();
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

  it('shows tooltips for calculation errors without treating error-like text as an error', () => {
    const columns: Column[] = [{ id: 'total', field: 'total', allowFormula: true }];
    const items = [{ id: 1, total: '=1/0' }];
    const gridStub = {
      getColumns: () => columns,
      setColumns: (newCols: Column[]) => columns.splice(0, columns.length, ...newCols),
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ editable: true, datasetIdPropertyName: 'id' }),
      invalidate: vi.fn(),
      render: vi.fn(),
    } as any;
    const service = new FormulaService();
    service.init(gridStub);

    const error = columns[0].formatter?.(0, 0, items[0].total, columns[0], items[0], gridStub) as HTMLElement;
    expect(error.className).toContain('formula-error');
    expect(error.title).toBe('Formula error: #DIV/0!');

    items[0].total = '="#N/A"';
    service.setFormula(1, 'total', '="#N/A"');
    const text = columns[0].formatter?.(0, 0, items[0].total, columns[0], items[0], gridStub) as HTMLElement;
    expect(text.className).not.toContain('formula-error');
    expect(text.textContent).toBe('#N/A');

    class CustomEditor {}
    const customColumns: Column[] = [{ id: 'total', field: 'total', allowFormula: true, editorClass: CustomEditor as any }];
    const customGrid = {
      getColumns: () => customColumns,
      setColumns: (newCols: Column[]) => customColumns.splice(0, customColumns.length, ...newCols),
      getData: () => ({ getItems: () => items, getLength: () => items.length }),
      getOptions: () => ({ editable: true, datasetIdPropertyName: 'id' }),
    } as any;
    const customService = new FormulaService();
    customService.init(customGrid);
    items[0].total = '=1/0';
    customService.setFormula(1, 'total', '=1/0');
    const customError = customColumns[0].formatter?.(0, 0, items[0].total, customColumns[0], items[0], customGrid) as HTMLElement;
    expect(customError.className).toContain('formula-error');
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

  it('reevaluates a formula cell when it is requested again in the same tick', () => {
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
    expect(trackSpy).toHaveBeenCalledTimes(2);
  });

  it('shares dependency evaluations for one render pass without caching the requested custom formula', () => {
    const trackSpy = vi.fn((value: number) => value);
    const service = new FormulaService({ autoAssignEditor: false, customFunctions: { TRACK: trackSpy } });
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'subtotal', field: 'subtotal', allowFormula: true },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    const items = [{ id: 1, value: 3, subtotal: '=TRACK(A1*2)', total: '=B1+B1' }];
    const getItems = vi.fn(() => items);
    service.init({ getColumns: () => columns, getData: () => ({ getItems }), getOptions: () => ({}) } as any);

    expect(service.getEvaluatedCellValue(1, 'subtotal')).toBe(6);
    expect(service.getEvaluatedCellValue(1, 'total')).toBe(12);
    expect(service.getEvaluatedCellValue(1, 'total')).toBe(12);
    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect((service as any).getFormulaFunctionRegistry()).toBe((service as any).getFormulaFunctionRegistry());
    expect(getItems.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it('keeps built-in volatile formulas stable for one render pass and refreshes on the next pass', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 20, 10, 30, 15));
    const random = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.9);
    const service = new FormulaService({ autoAssignEditor: false });
    const columns: Column[] = [
      { id: 'random', field: 'random', allowFormula: true },
      { id: 'aliases', field: 'aliases', allowFormula: true },
      { id: 'now', field: 'now', allowFormula: true },
      { id: 'today', field: 'today', allowFormula: true },
    ];
    const items = [{ id: 1, random: '=RAND()', aliases: '=RANDOM()+RAN()', now: '=NOW()', today: '=TODAY()' }];
    service.init({ getColumns: () => columns, getData: () => ({ getItems: () => items }), getOptions: () => ({}) } as any);

    const firstRandom = service.getEvaluatedCellValue(1, 'random');
    const firstAliases = service.getEvaluatedCellValue(1, 'aliases');
    const firstNow = service.getEvaluatedCellValue(1, 'now');
    const firstToday = service.getEvaluatedCellValue(1, 'today');
    expect(service.getEvaluatedCellValue(1, 'random')).toBe(firstRandom);
    expect(service.getEvaluatedCellValue(1, 'aliases')).toBe(firstAliases);
    expect(service.getEvaluatedCellValue(1, 'now')).toBe(firstNow);
    expect(service.getEvaluatedCellValue(1, 'today')).toBe(firstToday);
    expect(random).toHaveBeenCalledTimes(3);

    await Promise.resolve();
    vi.setSystemTime(new Date(2026, 10, 20, 10, 31, 15));
    expect(service.getEvaluatedCellValue(1, 'random')).toBe(0.7);
    expect(service.getEvaluatedCellValue(1, 'aliases')).toBeCloseTo(1.7);
    expect(service.getEvaluatedCellValue(1, 'now')).toEqual(new Date(2026, 10, 20, 10, 31, 15));
    expect(service.getEvaluatedCellValue(1, 'today')).toEqual(new Date(2026, 10, 20));
    expect(random).toHaveBeenCalledTimes(6);

    random.mockRestore();
    vi.useRealTimers();
  });

  it('does not cache custom overrides of volatile function names', async () => {
    const customRandom = vi.fn().mockReturnValueOnce(0.2).mockReturnValueOnce(0.8);
    const service = new FormulaService({ autoAssignEditor: false, customFunctions: { RAND: customRandom } });
    const items = [{ id: 1, value: '=RAND()' }];
    service.init({
      getColumns: () => [{ id: 'value', field: 'value', allowFormula: true }],
      getData: () => ({ getItems: () => items }),
      getOptions: () => ({}),
    } as any);

    expect(service.getEvaluatedCellValue(1, 'value')).toBe(0.2);
    expect(service.getEvaluatedCellValue(1, 'value')).toBe(0.8);
    expect(customRandom).toHaveBeenCalledTimes(2);
    await Promise.resolve();
  });

  it('uses current data during synchronous DataView updates and row-change callbacks', () => {
    const dataView = new SlickDataView();
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'subtotal', field: 'subtotal', allowFormula: true },
      { id: 'total', field: 'total', allowFormula: true },
    ];
    dataView.setItems([{ id: 1, value: 2, subtotal: '=A1*2', total: '=B1+1' }]);
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => dataView, getOptions: () => ({}) } as any);
    const renderedValues: unknown[] = [];
    dataView.onRowsChanged.subscribe(() => renderedValues.push(service.getEvaluatedCellValue(1, 'total')));
    expect(service.getEvaluatedCellValue(1, 'total')).toBe(5);
    dataView.updateItem(1, { id: 1, value: 5, subtotal: '=A1*2', total: '=B1+1' });
    expect(service.getEvaluatedCellValue(1, 'total')).toBe(11);
    dataView.updateItems([1], [{ id: 1, value: 7, subtotal: '=A1*2', total: '=B1+1' }]);
    expect(service.getEvaluatedCellValue(1, 'total')).toBe(15);
    expect(renderedValues).toEqual([11, 15]);
    service.dispose();
  });

  it('recalculates grouped formula totals during a synchronous DataView update', () => {
    const dataView = new SlickDataView();
    const columns: Column[] = [
      { id: 'value', field: 'value' },
      { id: 'subtotal', field: 'subtotal', allowFormula: true },
    ];
    dataView.setItems([{ id: 1, group: 'g', value: 2, subtotal: '=A1*2' }]);
    const service = new FormulaService({ autoAssignEditor: false });
    service.init({ getColumns: () => columns, getData: () => dataView, getOptions: () => ({}) } as any);
    dataView.setGrouping({ getter: 'group', aggregators: [service.createGroupingAggregator(new Aggregators.Sum('subtotal'))] });
    expect((dataView.getGroups()[0].totals as any)?.sum?.subtotal).toBe(4);
    expect(service.getEvaluatedCellValue(1, 'subtotal')).toBe(4);
    dataView.updateItem(1, { id: 1, group: 'g', value: 5, subtotal: '=A1*2' });
    expect((dataView.getGroups()[0].totals as any)?.sum?.subtotal).toBe(10);
    service.dispose();
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

    context.visited.add((service as any).buildStoreKey(1, 'value'));
    expect((service as any).resolveExcelReferenceValue('A', 1, context)).toBe(FORMULA_ERROR.CIRCREF);
    expect((service as any).getCellRawValue('missing', 'value')).toBeUndefined();
    expect((service as any).getCellRawValue(1, 'missing')).toBeUndefined();

    expect((service as any).replaceRefFunctionsWithA1Refs('=REF(COLUMN("missing"),ROW(1))', ['value'], ['1'], 1)).toBe('=#REF!');
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
    const beforeDaylightSaving = new Date(2024, 2, 9, 12);
    const nextLocalDay = new Date(beforeDaylightSaving);
    nextLocalDay.setDate(nextLocalDay.getDate() + 1);
    expect((FormulaService as any).addDays(beforeDaylightSaving, 1)).toEqual(nextLocalDay);
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

    expect(evaluate('1..2')).toBe(FORMULA_ERROR.PARSE);
    expect(evaluate('@')).toBe(FORMULA_ERROR.PARSE);
    expect(evaluate('UNKNOWN')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('UNKNOWN()')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('FN(')).toBe(FORMULA_ERROR.PARSE);
    expect(evaluate('(1')).toBe(FORMULA_ERROR.PARSE);
    expect(evaluate('[1')).toBe(FORMULA_ERROR.PARSE);
    expect(evaluate('1 2')).toBe(FORMULA_ERROR.PARSE);
    expect(evaluate('1 / 0')).toBe(FORMULA_ERROR.DIV0);
    expect(evaluate('1 + UNKNOWN')).toBe(FORMULA_ERROR.NAME);
    expect(evaluate('1 + "x"')).toBe(FORMULA_ERROR.VALUE);
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
    expect((service as any).evaluateFormulaExpression('=1;2', context)).toBe(FORMULA_ERROR.PARSE);
    expect((service as any).evaluateFormulaExpression('=FOO', context)).toBe(FORMULA_ERROR.NAME);
    expect((service as any).evaluateFormulaExpression('=A1:B1', context)).toBe(FORMULA_ERROR.REF);
    expect((service as any).evaluateFormulaExpression('=SUM(A1:ZZZ1000000)', context)).toBe(FORMULA_ERROR.REF);

    for (const error of [ReferenceError, TypeError, SyntaxError, Error]) {
      const throwingService = new FormulaService({});
      throwingService.registerCustomFunction('THROW', () => {
        throw new error();
      });
      expect((throwingService as any).evaluateFormulaExpression('=THROW()', { visited: new Set(), memo: new Map() })).toBe(FORMULA_ERROR.ERROR);
    }
    vi.spyOn(service as any, 'evaluateExpressionWithParser').mockImplementation(() => {
      throw new Error('unexpected parser failure');
    });
    expect((service as any).evaluateFormulaExpression('=1', context)).toBe(FORMULA_ERROR.ERROR);
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
    expect(params.validateFormula('=1/0', { id: 'r1' })).toBe(FORMULA_ERROR.DIV0);
    expect(params.validateFormula('="#N/A"', { id: 'r1' })).toBeUndefined();
    expect(params.validateFormula('plain', { id: 'r1' })).toBeUndefined();

    params.onFormulaCommit('=A1');
    expect(service.getFormula('r1', 'total')).toBe('=REF(COLUMN("total"),ROW("r1"))');
    params.onFormulaCommit('=A1', { id: 'r1' });
    expect(service.getFormula('r1', 'total')).toBe('=REF(COLUMN("total"),ROW("r1"))');
  });
});
