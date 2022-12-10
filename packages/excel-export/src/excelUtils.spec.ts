import { Column, ExcelStylesheet, FieldType, Formatters, GridOption, SlickGrid } from '@slickgrid-universal/common';
import moment from 'moment-mini';

import { useCellFormatByFieldType } from './excelUtils';

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
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'YYYY-MM-DD HH:mm:ss' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2012-02-28 15:07:59' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeIso is provided', () => {
      const column = { type: FieldType.dateTimeIso } as Column;
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'YYYY-MM-DD HH:mm:ss' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2012-02-28 15:07:59' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeShortIso is provided', () => {
      const column = { type: FieldType.dateTimeShortIso } as Column;
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'YYYY-MM-DD HH:mm' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2012-02-28 15:07' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeIsoAmPm is provided', () => {
      const column = { type: FieldType.dateTimeIsoAmPm } as Column;
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'YYYY-MM-DD hh:mm:ss a' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2012-02-28 03:07:59 pm' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeIsoAM_PM is provided', () => {
      const column = { type: FieldType.dateTimeIsoAM_PM } as Column;
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'YYYY-MM-DD hh:mm:ss A' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2012-02-28 03:07:59 PM' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateEuro is provided', () => {
      const column = { type: FieldType.dateEuro } as Column;
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'DD/MM/YYYY' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '28/02/2012' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateEuroShort is provided', () => {
      const column = { type: FieldType.dateEuroShort } as Column;
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'D/M/YY' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '28/2/12' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeEuro is provided', () => {
      const column = { type: FieldType.dateTimeEuro } as Column;
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'DD/MM/YYYY HH:mm:ss' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '28/02/2012 15:07:59' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeShortEuro is provided', () => {
      const column = { type: FieldType.dateTimeShortEuro } as Column;
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'DD/MM/YYYY HH:mm' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '28/02/2012 15:07' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeEuroAmPm is provided', () => {
      const column = { type: FieldType.dateTimeEuroAmPm } as Column;
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'DD/MM/YYYY hh:mm:ss a' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '28/02/2012 03:07:59 pm' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeEuroAM_PM is provided', () => {
      const column = { type: FieldType.dateTimeEuroAM_PM } as Column;
      const input = '2012-02-28 15:07:59';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'DD/MM/YYYY hh:mm:ss A' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '28/02/2012 03:07:59 PM' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeEuroShort is provided', () => {
      const column = { type: FieldType.dateTimeEuroShort } as Column;
      const input = '2012-02-28 15:07:46';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'D/M/YY H:m:s' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '28/2/12 15:7:46' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeEuroShortAmPm is provided', () => {
      const column = { type: FieldType.dateTimeEuroShortAmPm } as Column;
      const input = '2012-02-28 15:07:46';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'D/M/YY h:m:s a' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '28/2/12 3:7:46 pm' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateUs is provided', () => {
      const column = { type: FieldType.dateUs } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'MM/DD/YYYY' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '02/28/2012' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateUsShort is provided', () => {
      const column = { type: FieldType.dateUsShort } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'M/D/YY' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2/28/12' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeUs is provided', () => {
      const column = { type: FieldType.dateTimeUs } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'MM/DD/YYYY HH:mm:ss' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '02/28/2012 15:07:59' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeShortUs is provided', () => {
      const column = { type: FieldType.dateTimeShortUs } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'MM/DD/YYYY HH:mm' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '02/28/2012 15:07' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeUsAmPm is provided', () => {
      const column = { type: FieldType.dateTimeUsAmPm } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'MM/DD/YYYY hh:mm:ss a' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '02/28/2012 03:07:59 pm' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeUsAM_PM is provided', () => {
      const column = { type: FieldType.dateTimeUsAM_PM } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'MM/DD/YYYY hh:mm:ss A' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '02/28/2012 03:07:59 PM' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeUsShort is provided', () => {
      const column = { type: FieldType.dateTimeUsShort } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'M/D/YY H:m:s' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2/28/12 15:7:59' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateTimeUsShortAmPm is provided', () => {
      const column = { type: FieldType.dateTimeUsShortAmPm } as Column;
      const input = new Date('2012-02-28 15:07:59');
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'M/D/YY h:m:s a' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2/28/12 3:7:59 pm' });
    });

    xit('should call createFormat with a format of an ISO date when FieldType.dateUtc is provided', () => {
      const column = { type: FieldType.dateUtc } as Column;
      const input = moment('2013-05-23T17:55:00.325').utcOffset(420); // timezone that is +7 UTC hours
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2013-05-24T04:55:00.325+07:00' });
    });

    it('should call createFormat with a format of an ISO date when FieldType.dateIso is provided', () => {
      const column = { type: FieldType.dateIso } as Column;
      const input = '2012-02-28 15:07:46';
      const output = useCellFormatByFieldType(stylesheetStub, {}, input, column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: 'YYYY-MM-DD' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: '2012-02-28' });
    });
  });

  describe('decimal formatter', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call createFormat with a format of "###0.00" when a number is provided without any specific formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, '12', column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '###0.00' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: 12 });
    });

    it('should call createFormat with a format of "###0.0##" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { minDecimal: 1, maxDecimal: 3 } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, '12', column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '###0.0##' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: 12 });
    });

    it('should call createFormat with a format of "€ ###0.00" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { numberPrefix: '€ ' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, '12', column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '€ ###0.00' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: 12 });
    });

    it('should call createFormat with a format of "#,##0.00" when a number is provided minDecimal & maxDecimal formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { thousandSeparator: ',' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, '12', column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '#,##0.00' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: 12 });
    });

    it('should call createFormat with a format of "# ##0.00 USD" when a number is provided thousandSeparator & numberSuffix formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { thousandSeparator: ' ', numberSuffix: ' USD' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, '12', column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '# ##0.00 USD' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: 12 });
    });

    it('should call createFormat with a format of "#,##0.00 USD;(#,##0.00 USD)" when a number is provided displayNegativeNumberWithParentheses, thousandSeparator & numberSuffix formatter options', () => {
      const column = { type: FieldType.number, formatter: Formatters.decimal, params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',', numberSuffix: ' USD' } } as Column;
      const output = useCellFormatByFieldType(stylesheetStub, {}, '12', column, gridStub);

      expect(createFormatSpy).toHaveBeenCalledWith({ format: '#,##0.00 USD;(#,##0.00 USD)' });
      expect(output).toEqual({ metadata: { style: mockedFormatId }, value: 12 });
    });
  });

});