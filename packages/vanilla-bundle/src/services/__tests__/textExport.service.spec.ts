import { GridOption, SharedService, SlickGrid, SlickDataView, PubSubService } from '@slickgrid-universal/common';
import { ContainerServiceStub } from '../../../../../test/containerServiceStub';
import { TextExportService } from '../textExport.service';

const mockGridOptions = { enableTranslate: false } as GridOption;

// URL object is not supported in JSDOM, we can simply mock it
(global as any).URL.createObjectURL = jest.fn();

const dataViewStub = {
  getGrouping: jest.fn(),
  getItem: jest.fn(),
  getLength: jest.fn(),
  setGrouping: jest.fn(),
} as unknown as SlickDataView;

const gridStub = {
  getColumnIndex: jest.fn(),
  getData: () => dataViewStub,
  getOptions: () => mockGridOptions,
  getColumns: jest.fn(),
  getGrouping: jest.fn(),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as PubSubService;

describe('TextExport Service', () => {
  let service: TextExportService;
  let container: ContainerServiceStub;

  beforeEach(() => {
    container = new ContainerServiceStub();
    container.registerInstance('PubSubService', pubSubServiceStub);
    service = new TextExportService();
  });

  it('should initialize the service', () => {
    const spy = jest.spyOn(service, 'exportToFile');

    service.init(gridStub, container);
    service.exportToFile({ exportWithFormatter: true, sanitizeDataExport: true });

    expect(service).toBeTruthy();
    expect(spy).toHaveBeenCalledWith({ exportWithFormatter: true, sanitizeDataExport: true });
  });
});
