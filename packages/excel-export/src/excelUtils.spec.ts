import { Column, ExcelStylesheet, FieldType, Formatters, GridOption, GroupTotalFormatters, SlickGrid } from '@slickgrid-universal/common';

import { getExcelFormatFromGridFormatter, getNumericFormatterOptions, useCellFormatByFieldType } from './excelUtils';

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

  describe('date formatter', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTime is provided', () => {
      const column = { type: FieldType.dateTime } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTime);

      expect(output).toEqual('2012-02-28 15:07:59');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeIso is provided', () => {
      const column = { type: FieldType.dateTimeIso } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeIso);

      expect(output).toEqual('2012-02-28 15:07:59');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeShortIso is provided', () => {
      const column = { type: FieldType.dateTimeShortIso } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeShortIso);

      expect(output).toEqual('2012-02-28 15:07');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeIsoAmPm is provided', () => {
      const column = { type: FieldType.dateTimeIsoAmPm } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeIsoAmPm);

      expect(output).toEqual('2012-02-28 03:07:59 pm');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeIsoAM_PM is provided', () => {
      const column = { type: FieldType.dateTimeIsoAM_PM } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeIsoAM_PM);

      expect(output).toEqual('2012-02-28 03:07:59 PM');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateEuro is provided', () => {
      const column = { type: FieldType.dateEuro } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateEuro);

      expect(output).toEqual('28/02/2012');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateEuroShort is provided', () => {
      const column = { type: FieldType.dateEuroShort } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateEuroShort);

      expect(output).toEqual('28/2/12');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeEuro is provided', () => {
      const column = { type: FieldType.dateTimeEuro } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeEuro);

      expect(output).toEqual('28/02/2012 15:07:59');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeShortEuro is provided', () => {
      const column = { type: FieldType.dateTimeShortEuro } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeShortEuro);

      expect(output).toEqual('28/02/2012 15:07');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeEuroAmPm is provided', () => {
      const column = { type: FieldType.dateTimeEuroAmPm } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeEuroAmPm);

      expect(output).toEqual('28/02/2012 03:07:59 pm');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeEuroAM_PM is provided', () => {
      const column = { type: FieldType.dateTimeEuroAM_PM } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeEuroAM_PM);

      expect(output).toEqual('28/02/2012 03:07:59 PM');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeEuroShort is provided', () => {
      const column = { type: FieldType.dateTimeEuroShort } as Column;
      const input = new Date('2012-02-28 15:07:46');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeEuroShort);

      expect(output).toEqual('28/2/12 15:7:46');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeEuroShortAmPm is provided', () => {
      const column = { type: FieldType.dateTimeEuroShortAmPm } as Column;
      const input = new Date('2012-02-28 15:07:46');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeEuroShortAmPm);

      expect(output).toEqual('28/2/12 3:7:46 pm');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateUs is provided', () => {
      const column = { type: FieldType.dateUs } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateUs);

      expect(output).toEqual('02/28/2012');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateUsShort is provided', () => {
      const column = { type: FieldType.dateUsShort } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateUsShort);

      expect(output).toEqual('2/28/12');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeUs is provided', () => {
      const column = { type: FieldType.dateTimeUs } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeUs);

      expect(output).toEqual('02/28/2012 15:07:59');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeShortUs is provided', () => {
      const column = { type: FieldType.dateTimeShortUs } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeShortUs);

      expect(output).toEqual('02/28/2012 15:07');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeUsAmPm is provided', () => {
      const column = { type: FieldType.dateTimeUsAmPm } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeUsAmPm);

      expect(output).toEqual('02/28/2012 03:07:59 pm');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeUsAM_PM is provided', () => {
      const column = { type: FieldType.dateTimeUsAM_PM } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeUsAM_PM);

      expect(output).toEqual('02/28/2012 03:07:59 PM');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeUsShort is provided', () => {
      const column = { type: FieldType.dateTimeUsShort } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeUsShort);

      expect(output).toEqual('2/28/12 15:7:59');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeUsShortAmPm is provided', () => {
      const column = { type: FieldType.dateTimeUsShortAmPm } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateTimeUsShortAmPm);

      expect(output).toEqual('2/28/12 3:7:59 pm');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
    });

    // xit('should call createFormat with a format of an ISO date when FieldType.dateUtc is provided', () => {
    //   const column = { type: FieldType.dateUtc } as Column;
    //   const input = moment('2013-05-23T17:55:00.325').utcOffset(420); // timezone that is +7 UTC hours
    //   const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

    //   expect(createFormatSpy).toHaveBeenCalledWith({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' });
    //   expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2013-05-24T04:55:00.325+07:00' });
    // });

    it('should call createFormat with a format of an ISO date when FieldType.dateIso is provided', () => {
      const column = { type: FieldType.dateIso } as Column;
      const input = '2012-02-28 15:07:46';
      const result = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);
      const output = result.getDataValueCallback(input, undefined, FieldType.dateIso);

      expect(output).toEqual('2012-02-28');
      expect(result).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: undefined });
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
      expect(output).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: 135 });
    });

    it('should call createFormat with a format of "0.0##" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { minDecimal: 1, maxDecimal: 3 } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '0.0##;"-"0.0##' });
      expect(output).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: 135 });
    });

    it('should call createFormat with a format of "€0.00" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { numberPrefix: '€' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '"€"0.00;"-€"0.00' });
      expect(output).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: 135 });
    });

    it('should call createFormat with a format of "#,##0.00" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { thousandSeparator: ',' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '#,##0.00;"-"#,##0.00' });
      expect(output).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: 135 });
    });

    it('should call createFormat with a format of "# ##0.00 USD" when a number is provided with thousandSeparator & numberSuffix formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { thousandSeparator: ' ', numberSuffix: ' USD' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '# ##0.00" USD";"-"# ##0.00" USD"' });
      expect(output).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: 135 });
    });

    it('should call createFormat with a format of "#,##0.00 USD;(#,##0.00 USD)" when a number is provided displayNegativeNumberWithParentheses, thousandSeparator & numberSuffix formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',', numberSuffix: ' USD' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '#,##0.00" USD";(#,##0.00" USD")' });
      expect(output).toEqual({ getDataValueCallback: expect.toBeFunction(), stylesheetFormatterId: 135 });
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