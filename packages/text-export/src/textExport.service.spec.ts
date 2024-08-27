import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import {
  type Column,
  DelimiterType,
  FieldType,
  FileType,
  type Formatter,
  Formatters,
  type GridOption,
  GroupTotalFormatters,
  type ItemMetadata,
  type SlickDataView,
  type SlickGrid,
  SortComparers,
  SortDirectionNumber,
  type TextExportOption,
} from '@slickgrid-universal/common';

import { ContainerServiceStub } from '../../../test/containerServiceStub';
import { TranslateServiceStub } from '../../../test/translateServiceStub';
import { TextExportService } from './textExport.service';

function removeMultipleSpaces(inputText: string) {
  return `${inputText}`.replace(/  +/g, '');
}

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

// URL object is not supported in JSDOM, we can simply mock it
(global as any).URL.createObjectURL = jest.fn();

const myBoldHtmlFormatter: Formatter = (_row, _cell, value) => value !== null ? { text: `<b>${value}</b>` } : null as any;
const myUppercaseFormatter: Formatter = (_row, _cell, value) => value ? { text: value.toUpperCase() } : null as any;
const myCustomObjectFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext) => {
  let textValue = value && value.hasOwnProperty('text') ? value.text : value;
  const toolTip = value && value.hasOwnProperty('toolTip') ? value.toolTip : '';
  const cssClasses = value && value.hasOwnProperty('addClasses') ? [value.addClasses] : [''];
  if (dataContext && !isNaN(dataContext.order) && parseFloat(dataContext.order) > 10) {
    cssClasses.push('red');
    textValue = null;
  }
  return { text: textValue, addClasses: cssClasses.join(' '), toolTip };
};

const dataViewStub = {
  getGrouping: jest.fn(),
  getItem: jest.fn(),
  getItemMetadata: jest.fn(),
  getLength: jest.fn(),
  setGrouping: jest.fn(),
} as unknown as SlickDataView;

const mockGridOptions = {
  enablePagination: true,
  enableFiltering: true,
} as GridOption;

const gridStub = {
  getColumnIndex: jest.fn(),
  getData: () => dataViewStub,
  getOptions: () => mockGridOptions,
  getColumns: jest.fn(),
  getGrouping: jest.fn(),
} as unknown as SlickGrid;

describe('ExportService', () => {
  let container: ContainerServiceStub;
  let service: TextExportService;
  let translateService: TranslateServiceStub;
  let mockColumns: Column[];
  let mockExportCsvOptions: TextExportOption;
  let mockExportTxtOptions;
  let mockCsvBlob: Blob;
  let mockTxtBlob: Blob;

  describe('with Translater Service', () => {
    beforeEach(() => {
      translateService = new TranslateServiceStub();
      container = new ContainerServiceStub();
      container.registerInstance('PubSubService', pubSubServiceStub);
      mockGridOptions.translater = translateService;

      (navigator as any).__defineGetter__('appName', () => 'Netscape');
      (navigator as any).msSaveOrOpenBlob = undefined as any;
      mockCsvBlob = new Blob(['', ''], { type: `text/csv` });
      mockTxtBlob = new Blob(['\uFEFF', ''], { type: `text/plain` });

      mockExportCsvOptions = {
        delimiter: DelimiterType.comma,
        filename: 'export',
        format: FileType.csv,
        useUtf8WithBom: false,
      };

      mockExportTxtOptions = {
        delimiter: DelimiterType.semicolon,
        filename: 'export',
        format: FileType.txt
      };

      service = new TextExportService();
    });

    afterEach(() => {
      delete mockGridOptions.backendServiceApi;
      service?.dispose();
      jest.clearAllMocks();
    });

    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should not have any output since there are no column definitions provided', async () => {
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
      const spyDownload = jest.spyOn(service, 'startDownloadFile');

      const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
      const contentExpectation = '';

      service.init(gridStub, container);
      await service.exportToFile(mockExportCsvOptions);

      expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, expect.anything());
      expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
      expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
    });

    describe('exportToFile method', () => {
      beforeEach(() => {
        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'userId', field: 'userId', name: 'User Id', width: 100, exportCsvForceToKeepAsString: true },
          { id: 'firstName', field: 'firstName', width: 100, formatter: myBoldHtmlFormatter },
          { id: 'lastName', field: 'lastName', width: 100, formatter: myBoldHtmlFormatter, exportCustomFormatter: myUppercaseFormatter, sanitizeDataExport: true, exportWithFormatter: true },
          { id: 'position', field: 'position', width: 100 },
          { id: 'order', field: 'order', width: 100, exportWithFormatter: true, formatter: Formatters.multiple, params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] } },
        ] as Column[];

        jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      });

      it('should throw an error when trying call exportToFile" without a grid and/or dataview object initialized', (done) => {
        try {
          service.init(null as any, container);
          service.exportToFile(mockExportTxtOptions);
        } catch (e) {
          expect(e.toString()).toContain('[Slickgrid-Universal] it seems that the SlickGrid & DataView objects and/or PubSubService are not initialized did you forget to enable the grid option flag "enableTextExport"?');
          done();
        }
      });

      it('should trigger an event before exporting the file', () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        service.exportToFile(mockExportTxtOptions);

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeExportToTextFile`, true);
      });

      it('should trigger an event after exporting the file', async () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToFile(mockExportTxtOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, expect.anything());
      });

      it('should call "URL.createObjectURL" with a Blob and CSV file when browser is not IE11 (basically any other browser) when exporting as CSV', async () => {
        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
      });

      it('should call "msSaveOrOpenBlob" with a Blob and CSV file when browser is IE11 when exporting as CSV', async () => {
        (navigator as any).msSaveOrOpenBlob = jest.fn();
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyMsSave = jest.spyOn(navigator as any, 'msSaveOrOpenBlob');

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, expect.anything());
        expect(spyMsSave).toHaveBeenCalledWith(mockCsvBlob, 'export.csv');
      });

      it('should call "URL.createObjectURL" with a Blob and TXT file when browser is not IE11 (basically any other browser) when exporting as TXT', async () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');

        service.init(gridStub, container);
        await service.exportToFile(mockExportTxtOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, expect.anything());
        expect(spyUrlCreate).toHaveBeenCalledWith(mockTxtBlob);
      });

      it('should call "msSaveOrOpenBlob" with a Blob and TXT file when browser is IE11 when exporting as TXT', async () => {
        (navigator as any).msSaveOrOpenBlob = jest.fn();
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyMsSave = jest.spyOn(navigator as any, 'msSaveOrOpenBlob');

        service.init(gridStub, container);
        await service.exportToFile(mockExportTxtOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, expect.anything());
        expect(spyMsSave).toHaveBeenCalledWith(mockTxtBlob, 'export.txt');
      });
    });

    describe('startDownloadFile call after all private methods ran ', () => {
      let mockCollection: any[];

      beforeEach(() => {
        mockGridOptions.textExportOptions = { delimiterOverride: '' };
      });

      it(`should have the Order exported correctly with multiple formatters which have 1 of them returning an object with a text property (instead of simple string)`, async () => {
        mockCollection = [{ id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","FirstName","LastName","Position","Order"
          ="1E06","John","Z","SALES_REP","<b>10</b>"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have the Order exported correctly with multiple formatters and use a different delimiter when "delimiterOverride" is provided`, async () => {
        mockGridOptions.textExportOptions = { delimiterOverride: DelimiterType.doubleSemicolon };
        mockCollection = [{ id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id";;"FirstName";;"LastName";;"Position";;"Order"
              ="1E06";;"John";;"Z";;"SALES_REP";;"<b>10</b>"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have the UserId escape with equal sign showing as prefix, to avoid Excel casting the value 1E06 to 1 exponential 6,
        when "exportCsvForceToKeepAsString" is enable in its column definition`, async () => {
        mockCollection = [{ id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","FirstName","LastName","Position","Order"
          ="1E06","John","Z","SALES_REP","<b>10</b>"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have the LastName in uppercase when "formatter" is defined but also has "exportCustomFormatter" which will be used`, async () => {
        mockCollection = [{ id: 1, userId: '2B02', firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","FirstName","LastName","Position","Order"
          ="2B02","Jane","DOE","FINANCE_MANAGER","<b>1</b>"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have the LastName as empty string when item LastName is NULL and column definition "formatter" is defined but also has "exportCustomFormatter" which will be used`, async () => {
        mockCollection = [{ id: 2, userId: '3C2', firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 3 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","FirstName","LastName","Position","Order"
          ="3C2","Ava Luna","","HUMAN_RESOURCES","<b>3</b>"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have the UserId as empty string even when UserId property is not found in the item object`, async () => {
        mockCollection = [{ id: 2, firstName: 'Ava', lastName: 'Luna', position: 'HUMAN_RESOURCES', order: 3 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","FirstName","LastName","Position","Order"
          ="","Ava","LUNA","HUMAN_RESOURCES","<b>3</b>"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have the Order as empty string when using multiple formatters and last one result in a null output because its value is bigger than 10`, async () => {
        mockCollection = [{ id: 2, userId: '3C2', firstName: 'Ava', lastName: 'Luna', position: 'HUMAN_RESOURCES', order: 13 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","FirstName","LastName","Position","Order"
          ="3C2","Ava","LUNA","HUMAN_RESOURCES",""`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have the UserId as empty string when its input value is null`, async () => {
        mockCollection = [{ id: 3, userId: undefined, firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 },];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","FirstName","LastName","Position","Order"
          ="","","CASH","SALES_REP","<b>3</b>"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have the Order without html tags when the grid option has "sanitizeDataExport" enabled`, async () => {
        mockGridOptions.textExportOptions = { sanitizeDataExport: true };
        mockCollection = [{ id: 1, userId: '2B02', firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","FirstName","LastName","Position","Order"
          ="2B02","Jane","DOE","FINANCE_MANAGER","1"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should export as CSV even when the grid option format was not defined`, async () => {
        mockGridOptions.textExportOptions!.format = undefined;
        mockGridOptions.textExportOptions!.sanitizeDataExport = false;
        mockCollection = [{ id: 1, userId: '2B02', firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","FirstName","LastName","Position","Order"
          ="2B02","Jane","DOE","FINANCE_MANAGER","<b>1</b>"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });
    });

    describe('startDownloadFile with some columns having complex object', () => {
      beforeEach(() => {
        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'firstName', field: 'user.firstName', name: 'First Name', width: 100, formatter: Formatters.complexObject, exportWithFormatter: true },
          { id: 'lastName', field: 'user.lastName', name: 'Last Name', width: 100, formatter: Formatters.complexObject, exportWithFormatter: true },
          { id: 'position', field: 'position', width: 100 },
        ] as Column[];

        jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      });

      let mockCollection: any[];

      it(`should export correctly with complex object formatters`, async () => {
        mockCollection = [{ id: 0, user: { firstName: 'John', lastName: 'Z' }, position: 'SALES_REP', order: 10 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"First Name","Last Name","Position"
              "John","Z","SALES_REP"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should skip lines that have an empty Slick DataView structure like "getItem" that is null and is part of the item object`, async () => {
        mockCollection = [
          { id: 0, user: { firstName: 'John', lastName: 'Z' }, position: 'SALES_REP', order: 10 },
          { id: 1, getItem: null, getItems: null, __parent: { id: 0, user: { firstName: 'John', lastName: 'Z' }, position: 'SALES_REP', order: 10 } }
        ];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]).mockReturnValueOnce(mockCollection[1]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"First Name","Last Name","Position"
              "John","Z","SALES_REP"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });
    });

    describe('with Translation', () => {
      let mockCollection: any[];

      beforeEach(() => {
        mockGridOptions.enableTranslate = true;
        mockGridOptions.translater = translateService;

        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'userId', field: 'userId', name: 'User Id', width: 100, exportCsvForceToKeepAsString: true },
          { id: 'firstName', nameKey: 'FIRST_NAME', width: 100, formatter: myBoldHtmlFormatter },
          { id: 'lastName', field: 'lastName', nameKey: 'LAST_NAME', width: 100, formatter: myBoldHtmlFormatter, exportCustomFormatter: myUppercaseFormatter, sanitizeDataExport: true, exportWithFormatter: true },
          { id: 'position', field: 'position', name: 'Position', width: 100, formatter: Formatters.translate, exportWithFormatter: true },
          { id: 'order', field: 'order', width: 100, exportWithFormatter: true, formatter: Formatters.multiple, params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] } },
        ] as Column[];

        jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it(`should have the LastName header title translated when defined as a "headerKey" and "translater" is set in grid option`, async () => {
        mockGridOptions.textExportOptions!.sanitizeDataExport = false;
        mockCollection = [{ id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","First Name","Last Name","Position","Order"
          ="1E06","John","Z","Sales Rep.","<b>10</b>"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });
    });

    describe('with Grouping', () => {
      let mockCollection: any[];
      let mockOrderGrouping;
      let mockItem1;
      let mockItem2;
      let mockGroup1;

      beforeEach(() => {
        mockGridOptions.enableGrouping = true;
        mockGridOptions.enableTranslate = false;
        mockGridOptions.textExportOptions = { sanitizeDataExport: true };

        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'userId', field: 'userId', name: 'User Id', width: 100, exportCsvForceToKeepAsString: true },
          { id: 'firstName', field: 'firstName', width: 100, formatter: myBoldHtmlFormatter },
          { id: 'lastName', field: 'lastName', width: 100, formatter: myBoldHtmlFormatter, exportCustomFormatter: myUppercaseFormatter, sanitizeDataExport: true, exportWithFormatter: true },
          { id: 'position', field: 'position', width: 100 },
          {
            id: 'order', field: 'order', type: FieldType.number,
            exportWithFormatter: true,
            formatter: Formatters.multiple, params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] },
            groupTotalsFormatter: GroupTotalFormatters.sumTotals,
          },
        ] as Column[];

        mockOrderGrouping = {
          aggregateChildGroups: false,
          aggregateCollapsed: false,
          aggregateEmpty: false,
          aggregators: [{ _count: 2, _field: 'order', _nonNullCount: 2, _sum: 4, }],
          collapsed: false,
          comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
          compiledAccumulators: [jest.fn(), jest.fn()],
          displayTotalsRow: true,
          formatter: (g) => `Order:  ${g.value} <span class="text-green">(${g.count} items)</span>`,
          getter: 'order',
          getterIsAFn: false,
          lazyTotalsCalculation: true,
          predefinedValues: [],
        };

        mockItem1 = { id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 };
        mockItem2 = { id: 1, userId: '2B02', firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 10 };
        mockGroup1 = {
          collapsed: 0, count: 2, groupingKey: '10', groups: null, level: 0, selectChecked: false,
          rows: [mockItem1, mockItem2],
          title: `Order: 20 <span class="text-green">(2 items)</span>`,
          totals: { value: '10', __group: true, __groupTotals: true, group: {}, initialized: true, sum: { order: 20 } },
        };

        jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        mockCollection = [mockGroup1, mockItem1, mockItem2, { __groupTotals: true, initialized: true, sum: { order: 20 }, group: mockGroup1 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem')
          .mockReturnValue(null)
          .mockReturnValueOnce(mockCollection[0])
          .mockReturnValueOnce(mockCollection[1])
          .mockReturnValueOnce(mockCollection[2])
          .mockReturnValueOnce(mockCollection[3]);
        jest.spyOn(dataViewStub, 'getGrouping').mockReturnValue([mockOrderGrouping]);
      });

      it(`should have a CSV export with grouping (same as the grid, WYSIWYG) when "enableGrouping" is set in the grid options and grouping are defined`, async () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"Group By","User Id","FirstName","LastName","Position","Order"
          "Order: 20 (2 items)"
             "",="1E06","John","Z","SALES_REP","10"
             "",="2B02","Jane","DOE","FINANCE_MANAGER","10"
             "","","","","","20"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have a TXT export with grouping (same as the grid, WYSIWYG) when "enableGrouping" is set in the grid options and grouping are defined`, async () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.txt', format: 'txt', mimeType: 'text/plain', useUtf8WithBom: true };
        const contentExpectation =
          `Group By;User Id;FirstName;LastName;Position;Order
          Order: 20 (2 items)
             ;=1E06;John;Z;SALES_REP;10
             ;=2B02;Jane;DOE;FINANCE_MANAGER;10
             ;;;;;20`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportTxtOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockTxtBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });
    });

    describe('with Grouping and Translation', () => {
      let mockCollection: any[];
      let mockOrderGrouping;
      let mockItem1;
      let mockItem2;
      let mockGroup1;

      beforeEach(() => {
        mockGridOptions.enableGrouping = true;
        mockGridOptions.enableTranslate = true;
        mockGridOptions.textExportOptions = { sanitizeDataExport: true };

        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'userId', field: 'userId', name: 'User Id', width: 100, exportCsvForceToKeepAsString: true },
          { id: 'firstName', field: 'firstName', nameKey: 'FIRST_NAME', width: 100, formatter: myBoldHtmlFormatter },
          { id: 'lastName', field: 'lastName', nameKey: 'LAST_NAME', width: 100, formatter: myBoldHtmlFormatter, exportCustomFormatter: myUppercaseFormatter, sanitizeDataExport: true, exportWithFormatter: true },
          { id: 'position', field: 'position', name: 'Position', width: 100, formatter: Formatters.translate, exportWithFormatter: true },
          {
            id: 'order', field: 'order', type: FieldType.number,
            exportWithFormatter: true,
            formatter: Formatters.multiple, params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] },
            groupTotalsFormatter: GroupTotalFormatters.sumTotals,
          },
        ] as Column[];

        mockOrderGrouping = {
          aggregateChildGroups: false,
          aggregateCollapsed: false,
          aggregateEmpty: false,
          aggregators: [{ _count: 2, _field: 'order', _nonNullCount: 2, _sum: 4, }],
          collapsed: false,
          comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
          compiledAccumulators: [jest.fn(), jest.fn()],
          displayTotalsRow: true,
          formatter: (g) => `Order:  ${g.value} <span class="text-green">(${g.count} items)</span>`,
          getter: 'order',
          getterIsAFn: false,
          lazyTotalsCalculation: true,
          predefinedValues: [],
        };

        mockItem1 = { id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 };
        mockItem2 = { id: 1, userId: '2B02', firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 10 };
        mockGroup1 = {
          collapsed: 0, count: 2, groupingKey: '10', groups: null, level: 0, selectChecked: false,
          rows: [mockItem1, mockItem2],
          title: `Order: 20 <span class="text-green">(2 items)</span>`,
          totals: { value: '10', __group: true, __groupTotals: true, group: {}, initialized: true, sum: { order: 20 } },
        };

        jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        mockCollection = [mockGroup1, mockItem1, mockItem2, { __groupTotals: true, initialized: true, sum: { order: 20 }, group: mockGroup1 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem')
          .mockReturnValue(null)
          .mockReturnValueOnce(mockCollection[0])
          .mockReturnValueOnce(mockCollection[1])
          .mockReturnValueOnce(mockCollection[2])
          .mockReturnValueOnce(mockCollection[3]);
        jest.spyOn(dataViewStub, 'getGrouping').mockReturnValue([mockOrderGrouping]);
      });

      it(`should have a CSV export with grouping (same as the grid, WYSIWYG) when "enableGrouping" is set in the grid options and grouping are defined`, async () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"Grouped By","User Id","First Name","Last Name","Position","Order"
          "Order: 20 (2 items)"
             "",="1E06","John","Z","Sales Rep.","10"
             "",="2B02","Jane","DOE","Finance Manager","10"
             "","","","","","20"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have a TXT export with grouping (same as the grid, WYSIWYG) when "enableGrouping" is set in the grid options and grouping are defined`, async () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.txt', format: 'txt', mimeType: 'text/plain', useUtf8WithBom: true };
        const contentExpectation =
          `Grouped By;User Id;First Name;Last Name;Position;Order
          Order: 20 (2 items)
             ;=1E06;John;Z;Sales Rep.;10
             ;=2B02;Jane;DOE;Finance Manager;10
             ;;;;;20`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportTxtOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockTxtBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });
    });

    describe('with Multiple Columns Grouping (by Order then by LastName) and Translation', () => {
      let mockCollection: any[];
      let mockOrderGrouping;
      let mockItem1;
      let mockItem2;
      let mockGroup1;
      let mockGroup2;
      let mockGroup3;

      beforeEach(() => {
        mockGridOptions.enableGrouping = true;
        mockGridOptions.enableTranslate = true;
        mockGridOptions.textExportOptions = { sanitizeDataExport: true };

        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'userId', field: 'userId', name: 'User Id', width: 100, exportCsvForceToKeepAsString: true },
          { id: 'firstName', field: 'firstName', nameKey: 'FIRST_NAME', width: 100, formatter: myBoldHtmlFormatter },
          { id: 'lastName', field: 'lastName', nameKey: 'LAST_NAME', width: 100, formatter: myBoldHtmlFormatter, exportCustomFormatter: myUppercaseFormatter, sanitizeDataExport: true, exportWithFormatter: true },
          { id: 'position', field: 'position', name: 'Position', width: 100, formatter: Formatters.translate, exportWithFormatter: true },
          {
            id: 'order', field: 'order', type: FieldType.number,
            exportWithFormatter: true,
            formatter: Formatters.multiple, params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] },
            groupTotalsFormatter: GroupTotalFormatters.sumTotals,
          },
        ] as Column[];

        mockOrderGrouping = {
          aggregateChildGroups: false,
          aggregateCollapsed: false,
          aggregateEmpty: false,
          aggregators: [{ _count: 2, _field: 'order', _nonNullCount: 2, _sum: 4, }],
          collapsed: false,
          comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
          compiledAccumulators: [jest.fn(), jest.fn()],
          displayTotalsRow: true,
          formatter: (g) => `Order:  ${g.value} <span class="text-green">(${g.count} items)</span>`,
          getter: 'order',
          getterIsAFn: false,
          lazyTotalsCalculation: true,
          predefinedValues: [],
        };

        mockItem1 = { id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 };
        mockItem2 = { id: 1, userId: '2B02', firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 10 };
        mockGroup1 = {
          collapsed: 0, count: 2, groupingKey: '10', groups: null, level: 0, selectChecked: false,
          rows: [mockItem1, mockItem2],
          title: `Order: 20 <span class="text-green">(2 items)</span>`,
          totals: { value: '10', __group: true, __groupTotals: true, group: {}, initialized: true, sum: { order: 20 } },
        };
        mockGroup2 = {
          collapsed: 0, count: 2, groupingKey: '10:|:Z', groups: null, level: 0, selectChecked: false,
          rows: [mockItem1, mockItem2],
          title: `Last Name: Z <span class="text-green">(1 items)</span>`,
          totals: { value: '10', __group: true, __groupTotals: true, group: {}, initialized: true, sum: { order: 10 } },
        };
        mockGroup3 = {
          collapsed: 0, count: 2, groupingKey: '10:|:Doe', groups: null, level: 0, selectChecked: false,
          rows: [mockItem1, mockItem2],
          title: `Last Name: Doe <span class="text-green">(1 items)</span>`,
          totals: { value: '10', __group: true, __groupTotals: true, group: {}, initialized: true, sum: { order: 10 } },
        };

        jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        mockCollection = [
          mockGroup1, mockGroup2, mockItem1, mockGroup3, mockItem2,
          { __groupTotals: true, initialized: true, sum: { order: 20 }, group: mockGroup1 },
          { __groupTotals: true, initialized: true, sum: { order: 10 }, group: mockGroup2 },
        ];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem')
          .mockReturnValue(null)
          .mockReturnValueOnce(mockCollection[0])
          .mockReturnValueOnce(mockCollection[1])
          .mockReturnValueOnce(mockCollection[2])
          .mockReturnValueOnce(mockCollection[3])
          .mockReturnValueOnce(mockCollection[4])
          .mockReturnValueOnce(mockCollection[5])
          .mockReturnValueOnce(mockCollection[6]);
        jest.spyOn(dataViewStub, 'getGrouping').mockReturnValue([mockOrderGrouping]);
      });

      it(`should have a CSV export with grouping (same as the grid, WYSIWYG) when "enableGrouping" is set in the grid options and grouping are defined`, async () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"Grouped By","User Id","First Name","Last Name","Position","Order"
          "Order: 20 (2 items)"
          "     Last Name: Z (1 items)"
             "",="1E06","John","Z","Sales Rep.","10"
          "     Last Name: Doe (1 items)"
             "",="2B02","Jane","DOE","Finance Manager","10"
             "","","","","","20"
             "","","","","","10"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      it(`should have a TXT export with grouping (same as the grid, WYSIWYG) when "enableGrouping" is set in the grid options and grouping are defined`, async () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.txt', format: 'txt', mimeType: 'text/plain', useUtf8WithBom: true };
        const contentExpectation =
          `Grouped By;User Id;First Name;Last Name;Position;Order
          Order: 20 (2 items)
            Last Name: Z (1 items)
            ;=1E06;John;Z;Sales Rep.;10
            Last Name: Doe (1 items)
             ;=2B02;Jane;DOE;Finance Manager;10
             ;;;;;20
             ;;;;;10`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportTxtOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockTxtBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });
    });

    describe('Grouped Column Header Titles', () => {
      let mockCollection: any[];

      beforeEach(() => {
        mockGridOptions.createPreHeaderPanel = true;
        mockGridOptions.showPreHeaderPanel = true;
        mockGridOptions.textExportOptions = { delimiterOverride: '' };
        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'firstName', field: 'firstName', width: 100, formatter: myBoldHtmlFormatter, columnGroup: 'User Profile' },
          { id: 'lastName', field: 'lastName', width: 100, columnGroup: 'User Profile', formatter: myBoldHtmlFormatter, exportCustomFormatter: myUppercaseFormatter, sanitizeDataExport: true, exportWithFormatter: true },
          { id: 'userId', field: 'userId', name: 'User Id', width: 100, exportCsvForceToKeepAsString: true, columnGroup: 'Company Profile' },
          { id: 'position', field: 'position', width: 100, columnGroup: 'Company Profile' },
          { id: 'order', field: 'order', width: 100, exportWithFormatter: true, columnGroup: 'Sales', formatter: Formatters.multiple, params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] } },
        ] as Column[];

        jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        jest.spyOn(dataViewStub, 'getGrouping').mockReturnValue(null as any);
      });

      it('should export with grouped header titles showing up on first row', async () => {
        mockCollection = [{ id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 }];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Profile","User Profile","Company Profile","Company Profile","Sales"
          "FirstName","LastName","User Id","Position","Order"
          "John","Z",="1E06","SALES_REP","<b>10</b>"`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });

      describe('with Translation', () => {
        let mockTranslateCollection: any[];

        beforeEach(() => {
          mockGridOptions.enableTranslate = true;
          mockGridOptions.translater = translateService;

          mockColumns = [
            { id: 'id', field: 'id', excludeFromExport: true },
            { id: 'firstName', nameKey: 'FIRST_NAME', width: 100, columnGroupKey: 'USER_PROFILE', formatter: myBoldHtmlFormatter },
            { id: 'lastName', field: 'lastName', nameKey: 'LAST_NAME', width: 100, columnGroupKey: 'USER_PROFILE', formatter: myBoldHtmlFormatter, exportCustomFormatter: myUppercaseFormatter, sanitizeDataExport: true, exportWithFormatter: true },
            { id: 'userId', field: 'userId', name: 'User Id', width: 100, columnGroupKey: 'COMPANY_PROFILE', exportCsvForceToKeepAsString: true },
            { id: 'position', field: 'position', name: 'Position', width: 100, columnGroupKey: 'COMPANY_PROFILE', formatter: Formatters.translate, exportWithFormatter: true },
            { id: 'order', field: 'order', width: 100, exportWithFormatter: true, columnGroupKey: 'SALES', formatter: Formatters.multiple, params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] } },
          ] as Column[];
          jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        });

        afterEach(() => {
          jest.clearAllMocks();
        });

        it(`should have the LastName header title translated when defined as a "headerKey" and "translater" is set in grid option`, async () => {
          mockGridOptions.textExportOptions!.sanitizeDataExport = false;
          mockTranslateCollection = [{ id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 }];
          jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockTranslateCollection.length);
          jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockTranslateCollection[0]);
          const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
          const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
          const spyDownload = jest.spyOn(service, 'startDownloadFile');

          const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
          const contentExpectation =
            `"User Profile","User Profile","Company Profile","Company Profile","Sales"
            "First Name","Last Name","User Id","Position","Order"
            "John","Z",="1E06","Sales Rep.","<b>10</b>"`;

          service.init(gridStub, container);
          await service.exportToFile(mockExportCsvOptions);

          expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
          expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
          expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
        });
      });
    });

    describe('grid with colspan', () => {
      let mockCollection;
      const oddMetatadata = { columns: { lastName: { colspan: 2 } } } as ItemMetadata;
      const evenMetatadata = { columns: { 0: { colspan: '*' } } } as ItemMetadata;

      beforeEach(() => {
        mockGridOptions.enableTranslate = true;
        mockGridOptions.translater = translateService;
        mockGridOptions.textExportOptions = {};
        mockGridOptions.createPreHeaderPanel = false;
        mockGridOptions.showPreHeaderPanel = false;
        mockGridOptions.colspanCallback = (item: any) => (item.id % 2 === 1) ? evenMetatadata : oddMetatadata;

        mockColumns = [
          { id: 'userId', field: 'userId', name: 'User Id', width: 100, exportCsvForceToKeepAsString: true },
          { id: 'firstName', nameKey: 'FIRST_NAME', width: 100, formatter: myBoldHtmlFormatter },
          { id: 'lastName', field: 'lastName', nameKey: 'LAST_NAME', width: 100, formatter: myBoldHtmlFormatter, exportCustomFormatter: myUppercaseFormatter, sanitizeDataExport: true, exportWithFormatter: true },
          { id: 'position', field: 'position', name: 'Position', width: 100, formatter: Formatters.translate, exportWithFormatter: true },
          { id: 'order', field: 'order', width: 100, },
        ] as Column[];

        jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it(`should export same colspan in the csv export as defined in the grid`, async () => {
        mockCollection = [
          { id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 },
          { id: 1, userId: '1E09', firstName: 'Jane', lastName: 'Doe', position: 'DEVELOPER', order: 15 },
          { id: 2, userId: '2ABC', firstName: 'Sponge', lastName: 'Bob', position: 'IT_ADMIN', order: 33 },
        ];
        jest.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        jest.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]).mockReturnValueOnce(mockCollection[1]).mockReturnValueOnce(mockCollection[2]);
        jest.spyOn(dataViewStub, 'getItemMetadata').mockReturnValue(oddMetatadata).mockReturnValueOnce(evenMetatadata).mockReturnValueOnce(oddMetatadata).mockReturnValueOnce(evenMetatadata);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const spyUrlCreate = jest.spyOn(URL, 'createObjectURL');
        const spyDownload = jest.spyOn(service, 'startDownloadFile');

        const optionExpectation = { filename: 'export.csv', format: 'csv', mimeType: 'text/plain', useUtf8WithBom: false };
        const contentExpectation =
          `"User Id","First Name","Last Name","Position","Order"
              ="1E06",,,,
              ="1E09","Jane","DOE",,"15"
              ="2ABC",,,,`;

        service.init(gridStub, container);
        await service.exportToFile(mockExportCsvOptions);

        expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onAfterExportToTextFile`, optionExpectation);
        expect(spyUrlCreate).toHaveBeenCalledWith(mockCsvBlob);
        expect(spyDownload).toHaveBeenCalledWith({ ...optionExpectation, content: removeMultipleSpaces(contentExpectation) });
      });
    });
  });

  describe('without Translater Service', () => {
    beforeEach(() => {
      translateService = undefined as any;
      service = new TextExportService();
    });

    it('should throw an error if "enableTranslate" is set but the Translater Service is null', () => {
      const gridOptionsMock = { enableTranslate: true, enableGridMenu: true, translater: undefined as any, gridMenu: { hideForceFitButton: false, hideSyncResizeButton: true, columnTitleKey: 'TITLE' } } as GridOption;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      expect(() => service.init(gridStub, container)).toThrow('[Slickgrid-Universal] requires a Translate Service to be passed in the "translater" Grid Options when "enableTranslate" is enabled.');
    });
  });
});
