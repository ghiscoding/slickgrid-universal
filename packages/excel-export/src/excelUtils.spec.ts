import { Formatters, GroupTotalFormatters, type Column, type Formatter, type GridOption, type SlickGrid } from '@slickgrid-universal/common';
import { type StyleSheet } from 'excel-builder-vanilla';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getExcelFormatFromGridFormatter, getGroupTotalValue, useCellFormatByFieldType } from './excelUtils.js';

const mockGridOptions = {
  enableExcelExport: true,
  enablePagination: true,
  enableFiltering: true,
} as GridOption;

const gridStub = {
  getColumnIndex: vi.fn(),
  getOptions: () => mockGridOptions,
  getColumns: vi.fn(),
  getGrouping: vi.fn(),
} as unknown as SlickGrid;

const stylesheetStub = {
  createFormat: vi.fn(),
} as unknown as StyleSheet;

function invokeExcelNumberParser(data: any, gridOptions = mockGridOptions) {
  const columnDef = { type: 'number', formatter: Formatters.decimal } as Column;
  const parser = useCellFormatByFieldType(stylesheetStub, {}, columnDef, gridStub).getDataValueParser;
  return parser(data, {
    columnDef,
    excelFormatId: 3,
    gridOptions,
    dataRowIdx: 0,
    stylesheet: stylesheetStub,
    dataContext: {},
  });
}

describe('excelUtils', () => {
  const mockedFormatId = 135;
  let createFormatSpy: any;
  const myBoldFormatter: Formatter = (_row, _cell, value) => (value ? `<b>${value}</b>` : '');

  beforeEach(() => {
    createFormatSpy = vi.spyOn(stylesheetStub, 'createFormat').mockReturnValue({ id: mockedFormatId });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getGroupTotalValue() method', () => {
    it('should return the requested group total value', () => {
      expect(getGroupTotalValue({ sum: { amount: 42 } }, { columnDef: { field: 'amount' } as Column, groupType: 'sum' })).toBe(42);
    });

    it('should return zero when the requested group total value is missing', () => {
      expect(getGroupTotalValue({}, { columnDef: { field: 'amount' } as Column, groupType: 'sum' })).toBe(0);
    });
  });

  describe('data value parsers', () => {
    it('should preserve data for a non-number field', () => {
      const columnDef = {} as Column;
      const parser = useCellFormatByFieldType(stylesheetStub, {}, columnDef, gridStub, false).getDataValueParser;
      const output = parser('text', {
        columnDef,
        excelFormatId: 3,
        gridOptions: mockGridOptions,
        dataRowIdx: 0,
        stylesheet: stylesheetStub,
        dataContext: {},
      });

      expect(output).toEqual({ metadata: { style: 3 }, value: 'text' });
    });

    it('should return same data when input not a number', () => {
      const output = invokeExcelNumberParser('something else');
      expect(output).toEqual({ metadata: { style: 3 }, value: 'something else' });
    });

    it('should return same data when input value is already a number', () => {
      const output = invokeExcelNumberParser(9.33);
      expect(output).toEqual({ metadata: { style: 3 }, value: 9.33 });
    });

    it('should return parsed number when input value can be parsed to a number', () => {
      const output = invokeExcelNumberParser('$1,209.33');
      expect(output).toEqual({ metadata: { style: 3 }, value: 1209.33 });
    });

    it('should return negative parsed number when input value can be parsed to a number', () => {
      const output = invokeExcelNumberParser('-$1,209.33');
      expect(output).toEqual({ metadata: { style: 3 }, value: -1209.33 });
    });

    it('should be able to provide a number with different decimal separator as formatter options and return parsed number when input value can be parsed to a number', () => {
      const output = invokeExcelNumberParser('1 244 209,33€', {
        ...mockGridOptions,
        formatterOptions: { decimalSeparator: ',', thousandSeparator: ' ' },
      });
      expect(output).toEqual({ metadata: { style: 3 }, value: 1244209.33 });
    });

    it('should return zero when group totals or fields are missing', () => {
      expect(getGroupTotalValue(undefined, { columnDef: { field: 'amount' } as Column, groupType: 'sum' })).toBe(0);
      expect(getGroupTotalValue({ sum: {} }, { columnDef: { field: 'amount' } as Column, groupType: 'sum' })).toBe(0);
    });
  });

  describe('decimal formatter', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call createFormat with a format of "###0.00" when a number is provided without any specific formatter options', () => {
      const column = { type: 'number', formatter: Formatters.decimal } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '0.00;"-"0.00' });
      expect(output).toEqual({ getDataValueParser: expect.any(Function), excelFormatId: 135 });
    });

    it('should call createFormat with a format of "0.0##" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: 'number', formatter: Formatters.decimal, params: { minDecimal: 1, maxDecimal: 3 } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '0.0##;"-"0.0##' });
      expect(output).toEqual({ getDataValueParser: expect.any(Function), excelFormatId: 135 });
    });

    it('should call createFormat with a format of "€0.00" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: 'number', formatter: Formatters.decimal, params: { numberPrefix: '€' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '"€"0.00;"-€"0.00' });
      expect(output).toEqual({ getDataValueParser: expect.any(Function), excelFormatId: 135 });
    });

    it('should call createFormat with a format of "#,##0.00" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: 'number', formatter: Formatters.decimal, params: { thousandSeparator: ',' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '#,##0.00;"-"#,##0.00' });
      expect(output).toEqual({ getDataValueParser: expect.any(Function), excelFormatId: 135 });
    });

    it('should call createFormat with a format of "# ##0.00 USD" when a number is provided with thousandSeparator & numberSuffix formatter options', () => {
      const column = { type: 'number', formatter: Formatters.decimal, params: { thousandSeparator: ' ', numberSuffix: ' USD' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '# ##0.00" USD";"-"# ##0.00" USD"' });
      expect(output).toEqual({ getDataValueParser: expect.any(Function), excelFormatId: 135 });
    });

    it('should call createFormat with a format of "#,##0.00 USD;(#,##0.00 USD)" when a number is provided displayNegativeNumberWithParentheses, thousandSeparator & numberSuffix formatter options', () => {
      const column = {
        type: 'number',
        formatter: Formatters.decimal,
        params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',', numberSuffix: ' USD' },
      } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '#,##0.00" USD";(#,##0.00" USD")' });
      expect(output).toEqual({ getDataValueParser: expect.any(Function), excelFormatId: 135 });
    });
  });

  describe('numeric formatter options through public format generation', () => {
    const testCases: Array<[string, Column, 'cell' | 'group', string, string]> = [
      [
        'GroupTotalFormatters.avgTotalsDollar',
        {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.avgTotalsDollar,
          params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',', numberSuffix: ' USD' },
        } as Column,
        'group',
        'avg',
        '"$"#,##0.00##;("$"#,##0.00##)',
      ],
      [
        'GroupTotalFormatters.sumTotalsDollarColoredBold',
        {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarColoredBold,
          params: { thousandSeparator: ' ', decimalSeparator: ',', numberSuffix: ' USD' },
        } as Column,
        'group',
        'sum',
        '"$"# ##0,00##;"-$"# ##0,00##',
      ],
      [
        'GroupTotalFormatters.sumTotalsDollarColored',
        { type: 'number', formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarColored } as Column,
        'group',
        'sum',
        '"$"0.00##;"-$"0.00##',
      ],
      [
        'GroupTotalFormatters.sumTotalsDollarBold',
        { type: 'number', formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold } as Column,
        'group',
        'sum',
        '"$"0.00##;"-$"0.00##',
      ],
      [
        'GroupTotalFormatters.sumTotalsDollar',
        { type: 'number', formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar } as Column,
        'group',
        'sum',
        '"$"0.00##;"-$"0.00##',
      ],
      [
        'GroupTotalFormatters.avgTotalsPercentage',
        { type: 'number', formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage } as Column,
        'group',
        'avg',
        '0"%";0"%"',
      ],
      [
        'GroupTotalFormatters.avgTotals',
        { type: 'number', formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotals } as Column,
        'group',
        'avg',
        '0;"-"0',
      ],
      [
        'GroupTotalFormatters.minTotals',
        { type: 'number', formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.minTotals } as Column,
        'group',
        'min',
        '0.00;"-"0.00',
      ],
      [
        'GroupTotalFormatters.maxTotals',
        { type: 'number', formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.maxTotals } as Column,
        'group',
        'max',
        '0.00;"-"0.00',
      ],
      [
        'GroupTotalFormatters.sumTotalsColored',
        { type: 'number', formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsColored } as Column,
        'group',
        'sum',
        '0.00;"-"0.00',
      ],
      [
        'GroupTotalFormatters.sumTotals',
        { type: 'number', formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotals } as Column,
        'group',
        'sum',
        '0.00;"-"0.00',
      ],
      [
        'GroupTotalFormatters.sumTotalsBold',
        { type: 'number', formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsBold } as Column,
        'group',
        'sum',
        '0.00;"-"0.00',
      ],
      [
        'Formatters.dollarColoredBold',
        { type: 'number', formatter: Formatters.dollarColoredBold, params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',' } } as Column,
        'cell',
        '',
        '"$"#,##0.00##;("$"#,##0.00##)',
      ],
      [
        'Formatters.multiple with dollarColoredBold',
        {
          type: 'number',
          formatter: Formatters.multiple,
          params: { formatters: [Formatters.dollarColoredBold, myBoldFormatter], displayNegativeNumberWithParentheses: true, thousandSeparator: ',' },
        } as Column,
        'cell',
        '',
        '"$"#,##0.00##;("$"#,##0.00##)',
      ],
      [
        'Formatters.dollarColored',
        { type: 'number', formatter: Formatters.dollarColored, params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' } } as Column,
        'cell',
        '',
        '"$"# ##0.00##;"-$"# ##0.00##',
      ],
      [
        'Formatters.dollar',
        { type: 'number', formatter: Formatters.dollar, params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' } } as Column,
        'cell',
        '',
        '"$"# ##0.00##;"-$"# ##0.00##',
      ],
      [
        'Formatters.percent',
        { type: 'number', formatter: Formatters.percent, params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' } } as Column,
        'cell',
        '',
        '### 000"%";"-"### 000"%"',
      ],
      [
        'Formatters.multiple with percent',
        {
          type: 'number',
          formatter: Formatters.multiple,
          params: { formatters: [Formatters.percent, myBoldFormatter], displayNegativeNumberWithParentheses: true, thousandSeparator: ',' },
        } as Column,
        'cell',
        '',
        '###,000"%";(###,000"%")',
      ],
      [
        'Formatters.percentComplete',
        { type: 'number', formatter: Formatters.percentComplete, params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' } } as Column,
        'cell',
        '',
        '000"%";"-"# ##0"%"',
      ],
      [
        'Formatters.percentSymbol',
        { type: 'number', formatter: Formatters.percentSymbol, params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' } } as Column,
        'cell',
        '',
        '# ##0"%";"-"# ##0"%"',
      ],
      [
        'Formatters.decimal',
        {
          type: 'number',
          formatter: Formatters.decimal,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ', numberPrefix: 'Dollar ', numberSuffix: ' USD' },
        } as Column,
        'cell',
        '',
        '"Dollar "# ##0.00" USD";"-Dollar "# ##0.00" USD"',
      ],
    ];

    for (const [label, column, formatterType, groupType, expectedFormat] of testCases) {
      it(`should generate the expected format for ${label}`, () => {
        if (formatterType === 'group') {
          column.field = 'field';
        }
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, formatterType);

        expect(output).toEqual({ groupType, excelFormat: { id: 135 } });
        expect(createFormatSpy).toHaveBeenCalledWith({ format: expectedFormat });
      });
    }
  });

  describe('getExcelFormatFromGridFormatter() method', () => {
    describe('with GroupTotalFormatters', () => {
      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotalsPercentage', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
          params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',', numberSuffix: ' USD' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotalsCurrency', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.avgTotalsCurrency,
          params: { thousandSeparator: ' ', decimalSeparator: ',', numberSuffix: ' USD' },
        } as Column;

        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotalsDollar', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.avgTotalsDollar,
          params: { thousandSeparator: ' ', decimalSeparator: ',', numberSuffix: ' USD' },
        } as Column;

        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotals', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.avgTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.minTotals', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.minTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'min', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.maxTotals', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.maxTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'max', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsColored', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotalsColored,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsCurrencyColored', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotalsCurrencyColored,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollarColoredBold', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarColoredBold,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollarColored', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarColored,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollarBold', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollar', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotals', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsBold', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotalsBold,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style with regular number format when a custom GroupTotalFormatters is provided', () => {
        const columnDef = {
          type: 'number',
          formatter: Formatters.decimal,
          groupTotalsFormatter: (totals: any, _columnDef: Column, _grid: SlickGrid) => `Some Total: ${totals.sum}`,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, { numberFormat: { id: 3 } }, columnDef, gridStub, 'group');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 3 } });
      });
    });

    describe('with regular Formatters', () => {
      it('should get excel excel metadata style format for Formatters.currency', () => {
        const column = {
          type: 'number',
          formatter: Formatters.currency,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollar', () => {
        const column = {
          type: 'number',
          formatter: Formatters.dollar,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollarColored', () => {
        const column = {
          type: 'number',
          formatter: Formatters.dollarColored,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollarColoredBold', () => {
        const column = {
          type: 'number',
          formatter: Formatters.dollarColoredBold,
          params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.percent', () => {
        const column = {
          type: 'number',
          formatter: Formatters.percent,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.percentComplete', () => {
        const column = {
          type: 'number',
          formatter: Formatters.percentComplete,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.percentSymbol', () => {
        const column = {
          type: 'number',
          formatter: Formatters.percentSymbol,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.decimal', () => {
        const column = {
          type: 'number',
          formatter: Formatters.decimal,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ', numberPrefix: 'Dollar ', numberSuffix: ' USD' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style with regular number format when a custom Formatter is provided', () => {
        const columnDef = {
          type: 'number',
          formatter: () => `Something rendered`,
        } as unknown as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, { numberFormat: { id: 3 } }, columnDef, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 3 } });
      });

      it('should get excel excel metadata style with regular number format when using Formatters.multiple and a custom Formatter is provided', () => {
        const columnDef = {
          type: 'number',
          formatter: Formatters.multiple,
          params: { formatters: [() => `Something rendered`, myBoldFormatter] },
        } as unknown as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, { numberFormat: { id: 3 } }, columnDef, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 3 } });
      });

      it('should get excel excel metadata style format for Formatters.currency when using Formatters.multiple and the first multiple formatters is currency formatter', () => {
        const column = {
          type: 'number',
          formatter: Formatters.multiple,
          params: { formatters: [Formatters.currency, myBoldFormatter], displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollar when using Formatters.multiple and the last formatter is dollar formatter', () => {
        const column = {
          type: 'number',
          formatter: Formatters.multiple,
          params: { formatters: [myBoldFormatter, Formatters.dollar], displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' },
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });
    });
  });
});
