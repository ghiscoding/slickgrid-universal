import { Column, ExcelStylesheet, FieldType, Formatters, GridOption, GroupTotalFormatters, SlickGrid } from '@slickgrid-universal/common';

import { getExcelFormatFromGridFormatter, getNumericFormatterOptions, isColumnDateType, useCellFormatByFieldType } from './excelUtils';

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
} as unknown as ExcelStylesheet;

describe('excelUtils', () => {
  let mockedFormatId = 135;
  let createFormatSpy: any;

  beforeEach(() => {
    createFormatSpy = jest.spyOn(stylesheetStub, 'createFormat').mockReturnValue({ id: mockedFormatId });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('decimal formatter', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call createFormat with a format of "###0.00" when a number is provided without any specific formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '0.00;"-"0.00' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), stylesheetFormatterId: 135 });
    });

    it('should call createFormat with a format of "0.0##" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { minDecimal: 1, maxDecimal: 3 } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '0.0##;"-"0.0##' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), stylesheetFormatterId: 135 });
    });

    it('should call createFormat with a format of "€0.00" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { numberPrefix: '€' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '"€"0.00;"-€"0.00' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), stylesheetFormatterId: 135 });
    });

    it('should call createFormat with a format of "#,##0.00" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { thousandSeparator: ',' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '#,##0.00;"-"#,##0.00' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), stylesheetFormatterId: 135 });
    });

    it('should call createFormat with a format of "# ##0.00 USD" when a number is provided with thousandSeparator & numberSuffix formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { thousandSeparator: ' ', numberSuffix: ' USD' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '# ##0.00" USD";"-"# ##0.00" USD"' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), stylesheetFormatterId: 135 });
    });

    it('should call createFormat with a format of "#,##0.00 USD;(#,##0.00 USD)" when a number is provided displayNegativeNumberWithParentheses, thousandSeparator & numberSuffix formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',', numberSuffix: ' USD' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '#,##0.00" USD";(#,##0.00" USD")' });
      expect(output).toEqual({ getDataValueParser: expect.toBeFunction(), stylesheetFormatterId: 135 });
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

        expect(output).toEqual({ groupType: 'avg', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotalsCurrency', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotalsCurrency,
          params: { thousandSeparator: ' ', decimalSeparator: ',', numberSuffix: ' USD' }
        } as Column;

        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotalsDollar', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotalsDollar,
          params: { thousandSeparator: ' ', decimalSeparator: ',', numberSuffix: ' USD' }
        } as Column;

        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.avgTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.avgTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'avg', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.minTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.minTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'min', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.maxTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.maxTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'max', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsColored', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsColored,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsCurrencyColored', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsCurrencyColored,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsCurrencyColored', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsCurrencyColored,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollarColoredBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarColoredBold,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollarColored', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarColored,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollarBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsDollar', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotals', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for GroupTotalFormatters.sumTotalsBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.decimal, groupTotalsFormatter: GroupTotalFormatters.sumTotalsBold,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'group');

        expect(output).toEqual({ groupType: 'sum', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style with regular number format when a custom GroupTotalFormatters is provided', () => {
        const columnDef = {
          type: FieldType.number, formatter: Formatters.decimal,
          groupTotalsFormatter: (totals: any, columnDef: Column, grid: SlickGrid) => `Some Total: ${totals.sum}`,
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, { numberFormatter: { id: 3 } }, columnDef, gridStub, 'group');

        expect(output).toEqual({ groupType: '', stylesheetFormatter: { id: 3 } });
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

        expect(output).toEqual({ groupType: '', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollar', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.dollar,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollarColored', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.dollarColored,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.dollarColoredBold', () => {
        const column = {
          type: FieldType.number, formatter: Formatters.dollarColoredBold,
          params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.percent', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.percent,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.percentComplete', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.percentComplete,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.percentSymbol', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.percentSymbol,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style format for Formatters.decimal', () => {
        const column = {
          type: FieldType.number,
          formatter: Formatters.decimal,
          params: { displayNegativeNumberWithParentheses: false, thousandSeparator: ' ', numberPrefix: 'Dollar ', numberSuffix: ' USD' }
        } as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, {}, column, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', stylesheetFormatter: { id: 135 } });
      });

      it('should get excel excel metadata style with regular number format when a custom Formatter is provided', () => {
        const columnDef = {
          type: FieldType.number,
          formatter: () => `Something rendered`,
        } as unknown as Column;
        const output = getExcelFormatFromGridFormatter(stylesheetStub, { numberFormatter: { id: 3 } }, columnDef, gridStub, 'cell');

        expect(output).toEqual({ groupType: '', stylesheetFormatter: { id: 3 } });
      });
    });
  });
});