import { type StyleSheet } from 'excel-builder-vanilla';
import {
  type Column,
  FieldType,
  type Formatter,
  Formatters,
  type GridOption,
  GroupTotalFormatters,
  type SlickGrid
} from '@slickgrid-universal/common';

import { getExcelFormatFromGridFormatter, getExcelNumberCallback, getNumericFormatterOptions, useCellFormatByFieldType } from './excelUtils';

const mockGridOptions = {
  enableExcelExport: true,
  enablePagination: true,
  enableFiltering: true,
} as GridOption;

const gridStub = {
  getColumnIndex: jest.fn(),
  getOptions: () => mockGridOptions,
  getColumns: jest.fn(),
  getGrouping: jest.fn(),
} as unknown as SlickGrid;

const stylesheetStub = {
  createFormat: jest.fn(),
} as unknown as StyleSheet;

describe('excelUtils', () => {
  const mockedFormatId = 135;
  let createFormatSpy: any;
  const myBoldFormatter: Formatter = (_row, _cell, value) => value ? `<b>${value}</b>` : '';

  beforeEach(() => {
    createFormatSpy = jest.spyOn(stylesheetStub, 'createFormat').mockReturnValue({ id: mockedFormatId });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getExcelNumberCallback() method', () => {
    it('should return same data when input not a number', () => {
      const output = getExcelNumberCallback('something else', { columnDef: {} as Column, excelFormatId: 3, gridOptions: mockGridOptions, dataRowIdx: 0, stylesheet: stylesheetStub, dataContext: {} });
      expect(output).toEqual({ metadata: { style: 3 }, value: 'something else' });
    });

    it('should return same data when input value is already a number', () => {
      const output = getExcelNumberCallback(9.33, { columnDef: {} as Column, excelFormatId: 3, gridOptions: mockGridOptions, dataRowIdx: 0, stylesheet: stylesheetStub, dataContext: {} });
      expect(output).toEqual({ metadata: { style: 3 }, value: 9.33 });
    });

    it('should return parsed number when input value can be parsed to a number', () => {
      const output = getExcelNumberCallback('$1,209.33', { columnDef: {} as Column, excelFormatId: 3, gridOptions: mockGridOptions, dataRowIdx: 0, stylesheet: stylesheetStub, dataContext: {} });
      expect(output).toEqual({ metadata: { style: 3 }, value: 1209.33 });
    });

    it('should return negative parsed number when input value can be parsed to a number', () => {
      const output = getExcelNumberCallback('-$1,209.33', { columnDef: {} as Column, excelFormatId: 3, gridOptions: mockGridOptions, dataRowIdx: 0, stylesheet: stylesheetStub, dataContext: {} });
      expect(output).toEqual({ metadata: { style: 3 }, value: -1209.33 });
    });

    it('should be able to provide a number with different decimal separator as formatter options and return parsed number when input value can be parsed to a number', () => {
      const output = getExcelNumberCallback(
        '1 244 209,33€',
        {
          columnDef: {} as Column, excelFormatId: 3, gridOptions: {
            ...mockGridOptions, formatterOptions: { decimalSeparator: ',', thousandSeparator: ' ' }
          }, dataRowIdx: 0, stylesheet: stylesheetStub, dataContext: {}
        }
      );
      expect(output).toEqual({ metadata: { style: 3 }, value: 1244209.33 });
    });
  });

  describe('decimal formatter', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call createFormat with a format of "###0.00" when a number is provided without any specific formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '0.00;"-"0.00' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), excelFormatId: 135 });
    });

    it('should call createFormat with a format of "0.0##" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { minDecimal: 1, maxDecimal: 3 } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '0.0##;"-"0.0##' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), excelFormatId: 135 });
    });

    it('should call createFormat with a format of "€0.00" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { numberPrefix: '€' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '"€"0.00;"-€"0.00' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), excelFormatId: 135 });
    });

    it('should call createFormat with a format of "#,##0.00" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { thousandSeparator: ',' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '#,##0.00;"-"#,##0.00' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), excelFormatId: 135 });
    });

    it('should call createFormat with a format of "# ##0.00 USD" when a number is provided with thousandSeparator & numberSuffix formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { thousandSeparator: ' ', numberSuffix: ' USD' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '# ##0.00" USD";"-"# ##0.00" USD"' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), excelFormatId: 135 });
    });

    it('should call createFormat with a format of "#,##0.00 USD;(#,##0.00 USD)" when a number is provided displayNegativeNumberWithParentheses, thousandSeparator & numberSuffix formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',', numberSuffix: ' USD' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '#,##0.00" USD";(#,##0.00" USD")' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), excelFormatId: 135 });
    });
  });

  describe('getNumericFormatterOptions() method', () => {
    describe('with GroupTotalFormatters', () => {
      it('should get formatter options for GroupTotalFormatters.avgTotalsDollar', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotalsDollar,
          params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',', numberSuffix: ' USD' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 4,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: ',',
          wrapNegativeNumber: true,
        });
      });

      it('should get formatter options for GroupTotalFormatters.sumTotalsDollarColoredBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarColoredBold,
          params: { thousandSeparator: ' ', decimalSeparator: ',', numberSuffix: ' USD' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: ',',
          maxDecimal: 4,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: ' ',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for GroupTotalFormatters.sumTotalsDollarColored', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarColored,
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 4,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: '',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for GroupTotalFormatters.sumTotalsDollarBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 4,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: '',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for GroupTotalFormatters.sumTotalsDollar', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 4,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: '',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for GroupTotalFormatters.avgTotalsPercentage', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: undefined,
          minDecimal: undefined,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: '',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for GroupTotalFormatters.avgTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotals,
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 2,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: '',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for GroupTotalFormatters.minTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.minTotals,
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 2,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: '',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for GroupTotalFormatters.maxTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.maxTotals,
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 2,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: '',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for GroupTotalFormatters.sumTotalsColored', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsColored,
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 2,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: '',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for GroupTotalFormatters.sumTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 2,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: '',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for GroupTotalFormatters.sumTotalsBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal,
          groupTotalsFormatter: GroupTotalFormatters.sumTotalsBold,
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'group');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 2,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: '',
          wrapNegativeNumber: false,
        });
      });
    });

    describe('with regular Formatters', () => {
      it('should get formatter options for Formatters.dollarColoredBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.dollarColoredBold,
          params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'cell');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 4,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: ',',
          wrapNegativeNumber: true,
        });
      });

      it('should get formatter options for Formatters.dollarColoredBold when using Formatters.multiple and 1 of its formatter is dollarColoredBold formatter', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.multiple,
          params: { formatters: [Formatters.dollarColoredBold, myBoldFormatter], displayNegativeNumberWithParentheses: true, thousandSeparator: ',' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'cell');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 4,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: ',',
          wrapNegativeNumber: true,
        });
      });

      it('should get formatter options for Formatters.dollarColored', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.dollarColored,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'cell');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 4,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: ' ',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for Formatters.dollar', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.dollar,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'cell');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 4,
          minDecimal: 2,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: ' ',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for Formatters.percent', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.percent,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'cell');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: undefined,
          minDecimal: undefined,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: ' ',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for Formatters.percent when using Formatters.multiple and 1 of its formatter is percent formatter', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.multiple,
          params: { formatters: [Formatters.percent, myBoldFormatter], displayNegativeNumberWithParentheses: true, thousandSeparator: ',' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'cell');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: undefined,
          minDecimal: undefined,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: ',',
          wrapNegativeNumber: true,
        });
      });

      it('should get formatter options for Formatters.percentComplete', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.percentComplete,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'cell');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: undefined,
          minDecimal: undefined,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: ' ',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for Formatters.percentSymbol', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.percentSymbol,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'cell');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: undefined,
          minDecimal: undefined,
          numberPrefix: '',
          numberSuffix: '',
          thousandSeparator: ' ',
          wrapNegativeNumber: false,
        });
      });

      it('should get formatter options for Formatters.decimal', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ', numberPrefix: 'Dollar ', numberSuffix: ' USD' }
        } as Column;
        const output = getNumericFormatterOptions(column, gridStub, 'cell');

        expect(output).toEqual({
          currencyPrefix: '',
          currencySuffix: '',
          decimalSeparator: '.',
          maxDecimal: 2,
          minDecimal: 2,
          numberPrefix: 'Dollar ',
          numberSuffix: ' USD',
          thousandSeparator: ' ',
          wrapNegativeNumber: false,
        });
      });
    });
  });

  describe('getExcelFormatFromGridFormatter() method', () => {
    describe('with GroupTotalFormatters', () => {
      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotalsPercentage', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
          params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',', numberSuffix: ' USD' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotalsCurrency', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotalsCurrency,
          params: { thousandSeparator: ' ', decimalSeparator: ',', numberSuffix: ' USD' }
        } as Column;

        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotalsDollar', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotalsDollar,
          params: { thousandSeparator: ' ', decimalSeparator: ',', numberSuffix: ' USD' }
        } as Column;

        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.minTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.minTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'min', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.maxTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.maxTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'max', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsColored', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsColored,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsCurrencyColored', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsCurrencyColored,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollarColoredBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarColoredBold,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollarColored', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarColored,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollarBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollar', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsBold,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style with regular number format when a custom GroupTotalFormatters is provided', () => {
        const columnDef = {
          type: FieldType.number, formatter: Formatters.decimal,
          groupTotalsFormatter: (totals: any, _columnDef: Column, _grid: SlickGrid) => `Some Total: ${totals.sum}`,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, { numberFormatter: { id: 3 } }, columnDef, gridStub, 'group');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 3 } });
      });
    });

    describe('with regular Formatters', () => {
      it('should get excel excel metadata style format for Formatters.currency', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.currency,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollar', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.dollar,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollarColored', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.dollarColored,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollarColoredBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.dollarColoredBold,
          params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.percent', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.percent,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.percentComplete', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.percentComplete,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.percentSymbol', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.percentSymbol,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.decimal', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.decimal,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ', numberPrefix: 'Dollar ', numberSuffix: ' USD' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style with regular number format when a custom Formatter is provided', () => {
        const columnDef = {
          type: FieldType.number,
          formatter: () => `Something rendered`,
        } as unknown as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, { numberFormatter: { id: 3 } }, columnDef, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 3 } });
      });

      it('should get excel excel metadata style with regular number format when using Formatters.multiple and a custom Formatter is provided', () => {
        const columnDef = {
          type: FieldType.number,
          formatter: Formatters.multiple,
          params: { formatters: [() => `Something rendered`, myBoldFormatter], },
        } as unknown as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, { numberFormatter: { id: 3 } }, columnDef, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 3 } });
      });

      it('should get excel excel metadata style format for Formatters.currency when using Formatters.multiple and the first multiple formatters is currency formatter', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.multiple,
          params: { formatters: [Formatters.currency, myBoldFormatter], displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollar when using Formatters.multiple and the last formatter is dollar formatter', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.multiple,
          params: { formatters: [myBoldFormatter, Formatters.dollar], displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', excelFormat: { id: 135 } });
      });
    });
  });
});