import 'jest-extended';
import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import { FilterService, GridService, GridStateService, PaginationService, SharedService, SortService, TreeDataService } from '../index';
import { GridOption, CellArgs, Column, OnEventArgs } from '../../interfaces/index';
import { SlickRowSelectionModel } from '../../extensions/slickRowSelectionModel';
import { type SlickDataView, SlickEvent, type SlickGrid } from '../../core/index';

const mockRowSelectionModel = {
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
  dispose: jest.fn(),
  getSelectedRows: jest.fn(),
  setSelectedRows: jest.fn(),
  getSelectedRanges: jest.fn(),
  setSelectedRanges: jest.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickRowSelectionModel;

jest.mock('../../extensions/slickRowSelectionModel', () => ({
  SlickRowSelectionModel: jest.fn().mockImplementation(() => mockRowSelectionModel),
}));

const filterServiceStub = {
  clearFilters: jest.fn(),
  refreshTreeDataFilters: jest.fn(),
} as unknown as FilterService;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

const sortServiceStub = {
  clearSorting: jest.fn(),
  getCurrentColumnSorts: jest.fn(),
} as unknown as SortService;

const dataviewStub = {
  addItem: jest.fn(),
  addItems: jest.fn(),
  beginUpdate: jest.fn(),
  endUpdate: jest.fn(),
  deleteItem: jest.fn(),
  deleteItems: jest.fn(),
  getIdxById: jest.fn(),
  getItemMetadata: jest.fn(),
  getItem: jest.fn(),
  getItems: jest.fn(),
  getRowById: jest.fn(),
  insertItem: jest.fn(),
  insertItems: jest.fn(),
  reSort: jest.fn(),
  setItems: jest.fn(),
  updateItem: jest.fn(),
  updateItems: jest.fn(),
} as unknown as SlickDataView;

const gridStateServiceStub = {
  needToPreserveRowSelection: jest.fn(),
  resetColumns: jest.fn(),
} as unknown as GridStateService;

const gridStub = {
  autosizeColumns: jest.fn(),
  insertItem: jest.fn(),
  invalidate: jest.fn(),
  getColumnIndex: jest.fn(),
  getData: () => dataviewStub,
  getDataItem: jest.fn(),
  getOptions: jest.fn(),
  getColumns: jest.fn(),
  getSelectionModel: jest.fn(),
  setSelectionModel: jest.fn(),
  getSelectedRows: jest.fn(),
  highlightRow: jest.fn(),
  navigateBottom: jest.fn(),
  navigateTop: jest.fn(),
  render: jest.fn(),
  setColumns: jest.fn(),
  setOptions: jest.fn(),
  setSelectedRows: jest.fn(),
  scrollRowIntoView: jest.fn(),
  updateRow: jest.fn(),
} as unknown as SlickGrid;

const paginationServiceStub = {
  goToFirstPage: jest.fn(),
  goToLastPage: jest.fn(),
} as unknown as PaginationService;

const treeDataServiceStub = {
  convertFlatParentChildToTreeDataset: jest.fn(),
  init: jest.fn(),
  convertFlatParentChildToTreeDatasetAndSort: jest.fn(),
  dispose: jest.fn(),
  handleOnCellClick: jest.fn(),
  toggleTreeDataCollapse: jest.fn(),
} as unknown as TreeDataService;

describe('Grid Service', () => {
  let service: GridService;
  const sharedService = new SharedService();
  const mockGridOptions = { enableAutoResize: true } as GridOption;

  jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);

  beforeEach(() => {
    service = new GridService(gridStateServiceStub, filterServiceStub, pubSubServiceStub, paginationServiceStub, sharedService, sortServiceStub, treeDataServiceStub);
    service.init(gridStub);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should dispose of the service', () => {
    const disposeSpy = jest.spyOn(mockRowSelectionModel, 'dispose');

    service.highlightRow(0, 10);
    service.dispose();

    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should be able to highlight first row at zero index', () => {
    service.highlightRow(0, 10);
    expect(gridStub.highlightRow).toHaveBeenCalled();
  });

  describe('getAllColumnDefinitions method', () => {
    it('should call "allColumns" GETTER ', () => {
      const mockColumns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      const getSpy = jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);

      const output = service.getAllColumnDefinitions();

      expect(getSpy).toHaveBeenCalled();
      expect(output).toEqual(mockColumns);
    });
  });

  describe('getVisibleColumnDefinitions method', () => {
    it('should call "visibleColumns" GETTER ', () => {
      const mockColumns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      const getSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(mockColumns);

      const output = service.getVisibleColumnDefinitions();

      expect(getSpy).toHaveBeenCalled();
      expect(output).toEqual(mockColumns);
    });
  });

  describe('upsertItem methods', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw an error when 1st argument for the item object is missing', () => {
      expect(() => service.upsertItem(null as any)).toThrowError('[Slickgrid-Universal] Calling Upsert of an item requires the item to include an "id" property');
    });

    it('should NOT throw an error when "skipError" is enabled even when 1st argument for the item object is missing', () => {
      expect(() => service.upsertItem(null as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Calling Upsert of an item requires the item to include an "id" property');
    });

    it('should expect the service to call the "addItem" when calling "upsertItem" with the item not being found in the grid', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const dataviewSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(undefined as any);
      const addSpy = jest.spyOn(service, 'addItem');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const upsertRow = service.upsertItem(mockItem, { position: 'top', scrollRowIntoView: false });

      expect(upsertRow).toEqual({ added: 0, updated: undefined });
      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(dataviewSpy).toHaveBeenCalledWith(0);
      expect(addSpy).toHaveBeenCalledWith(mockItem, { highlightRow: true, position: 'top', resortGrid: false, selectRow: false, scrollRowIntoView: false, skipError: false, triggerEvent: true });
      expect(pubSubSpy).toHaveBeenCalledWith(`onItemUpserted`, mockItem);
    });

    it('should expect the service to call the DataView "addItem" when calling "upsertItem" with an item and the option "position" set to "bottom"', () => {
      const expectationNewRowPosition = 1000;
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(undefined as any).mockReturnValueOnce(expectationNewRowPosition);
      const addSpy = jest.spyOn(dataviewStub, 'addItem');
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const upsertRow = service.upsertItem(mockItem, { position: 'bottom' });

      expect(upsertRow).toEqual({ added: 1000, updated: undefined });
      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(mockItem);
      expect(scrollSpy).toHaveBeenCalledWith(expectationNewRowPosition);
      expect(pubSubSpy).toHaveBeenCalledWith(`onItemUpserted`, mockItem);
    });

    it('should expect the service to call the "updateItem" multiple times when calling "upsertItems" with the items found in the grid', () => {
      const mockItems = [{ id: 0, user: { firstName: 'John', lastName: 'Doe' } }, { id: 5, user: { firstName: 'Jane', lastName: 'Doe' } }];
      const dataviewSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0).mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(1).mockReturnValueOnce(1);
      const serviceUpsertSpy = jest.spyOn(service, 'upsertItem');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const upsertRows = service.upsertItems(mockItems, { highlightRow: true });

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(upsertRows).toEqual([{ added: undefined as any, updated: 0 }, { added: undefined as any, updated: 1 }]);
      expect(dataviewSpy).toHaveBeenCalledTimes(4); // called 4x times, 2x by the upsert itself and 2x by the updateItem
      expect(serviceUpsertSpy).toHaveBeenCalledTimes(2);
      expect(serviceUpsertSpy).toHaveBeenNthCalledWith(1, mockItems[0], { highlightRow: false, resortGrid: false, selectRow: false, scrollRowIntoView: true, skipError: false, triggerEvent: false });
      expect(serviceUpsertSpy).toHaveBeenNthCalledWith(2, mockItems[1], { highlightRow: false, resortGrid: false, selectRow: false, scrollRowIntoView: true, skipError: false, triggerEvent: false });
      expect(serviceHighlightSpy).toHaveBeenCalledWith([0, 1]);
      expect(pubSubSpy).toHaveBeenNthCalledWith(1, `onItemUpserted`, mockItems);
      expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onItemUpdated`, [{ added: undefined as any, updated: 0 }, { added: undefined as any, updated: 1 }]);
    });

    it('should expect the service to call both "addItem" and "updateItem" when calling "upsertItems" with first item found but second not found', () => {
      const mockItems = [{ id: 0, user: { firstName: 'John', lastName: 'Doe' } }, { id: 5, user: { firstName: 'Jane', lastName: 'Doe' } }];
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true } as GridOption);
      const dataviewSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(undefined as any).mockReturnValueOnce(undefined as any).mockReturnValueOnce(15).mockReturnValueOnce(15);
      const serviceUpsertSpy = jest.spyOn(service, 'upsertItem');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const selectSpy = jest.spyOn(service, 'setSelectedRows');

      const upsertRows = service.upsertItems(mockItems, { selectRow: true });

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(upsertRows).toEqual([{ added: 0, updated: undefined }, { added: undefined as any, updated: 15 }]);
      expect(dataviewSpy).toHaveBeenCalledTimes(3); // called 4x times, 2x by the upsert itself and 2x by the updateItem
      expect(serviceUpsertSpy).toHaveBeenCalledTimes(2);
      expect(serviceUpsertSpy).toHaveBeenNthCalledWith(1, mockItems[0], { highlightRow: false, resortGrid: false, selectRow: false, scrollRowIntoView: true, skipError: false, triggerEvent: false });
      expect(serviceUpsertSpy).toHaveBeenNthCalledWith(2, mockItems[1], { highlightRow: false, resortGrid: false, selectRow: false, scrollRowIntoView: true, skipError: false, triggerEvent: false });
      expect(serviceHighlightSpy).toHaveBeenCalledWith([0, 15]);
      expect(pubSubSpy).toHaveBeenNthCalledWith(1, `onItemUpserted`, mockItems);
      expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onItemAdded`, [{ added: 0, updated: undefined }]);
      expect(pubSubSpy).toHaveBeenNthCalledWith(3, `onItemUpdated`, [{ added: undefined as any, updated: 15 }]);
      expect(selectSpy).toHaveBeenCalledWith([0, 15]);
    });

    it('should expect the service to call the "upsertItem" when calling "upsertItems" with a single item object and without triggering an event', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const dataviewSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0).mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(1).mockReturnValueOnce(1);
      const serviceUpsertSpy = jest.spyOn(service, 'upsertItem');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const selectSpy = jest.spyOn(service, 'setSelectedRow');

      const upsertRows = service.upsertItems(mockItem, { highlightRow: true, resortGrid: true, selectRow: false, triggerEvent: false });

      expect(beginUpdateSpy).not.toHaveBeenCalled();
      expect(endUpdateSpy).not.toHaveBeenCalled();
      expect(upsertRows).toEqual([{ added: undefined as any, updated: 0 }]);
      expect(dataviewSpy).toHaveBeenCalledTimes(2);
      expect(serviceUpsertSpy).toHaveBeenCalledTimes(1);
      expect(serviceUpsertSpy).toHaveBeenCalledWith(mockItem, { highlightRow: true, resortGrid: true, selectRow: false, scrollRowIntoView: true, skipError: false, triggerEvent: false });
      expect(serviceHighlightSpy).not.toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalledTimes(0);
      expect(pubSubSpy).not.toHaveBeenLastCalledWith(`onItemUpserted`, mockItem);
      expect(selectSpy).not.toHaveBeenCalled();
    });

    it('should expect the row to be selected when calling "upsertItems" with an item when setting the "selecRow" flag and the grid option "enableRowSelection" is set', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true } as GridOption);
      const dataviewSpy = jest.spyOn(dataviewStub, 'getRowById');
      const serviceUpsertSpy = jest.spyOn(service, 'upsertItem');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const selectSpy = jest.spyOn(service, 'setSelectedRows');

      service.upsertItems([mockItem], { selectRow: true });

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(dataviewSpy).toHaveBeenCalledTimes(2);
      expect(serviceUpsertSpy).toHaveBeenCalledTimes(1);
      expect(serviceUpsertSpy).toHaveBeenCalledWith(mockItem, { highlightRow: false, resortGrid: false, selectRow: false, scrollRowIntoView: true, skipError: false, triggerEvent: false });
      expect(serviceHighlightSpy).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalledWith([1]);
    });

    it('should throw an error when calling "upsertItemById" without a valid "id"', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      expect(() => service.upsertItemById(undefined as any, mockItem)).toThrowError('[Slickgrid-Universal] Calling Upsert of an item requires the item to include a valid and unique "id" property');
    });

    it('should NOT throw an error when "skipError" is enabled even when calling "upsertItemById" without a valid "id"', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      expect(() => service.upsertItemById(undefined as any, mockItem, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Calling Upsert of an item requires the item to include a valid and unique "id" property');
    });

    it('should call the "upsertItemById" method and expect it to call the "addItem" with default boolean flags', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const dataviewSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(undefined as any);
      const serviceAddItemSpy = jest.spyOn(service, 'addItem');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.upsertItemById(0, mockItem);

      expect(dataviewSpy).toHaveBeenCalledWith(0);
      expect(serviceAddItemSpy).toHaveBeenCalled();
      expect(serviceAddItemSpy).toHaveBeenCalledWith(mockItem, { highlightRow: true, resortGrid: false, selectRow: false, scrollRowIntoView: true, skipError: false, triggerEvent: true });
      expect(serviceHighlightSpy).toHaveBeenCalledWith(0);
      expect(pubSubSpy).toHaveBeenCalledWith(`onItemUpserted`, mockItem);
    });

    it('should call the "upsertItemById" method and expect it to call the "addItem" with different boolean flags provided as arguments', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const dataviewSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(undefined as any);
      const serviceAddItemSpy = jest.spyOn(service, 'addItem');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.upsertItemById(0, mockItem, { highlightRow: false, resortGrid: true, selectRow: true, triggerEvent: false });

      expect(dataviewSpy).toHaveBeenCalledWith(0);
      expect(serviceAddItemSpy).toHaveBeenCalled();
      expect(serviceAddItemSpy).toHaveBeenCalledWith(mockItem, { highlightRow: false, resortGrid: true, selectRow: true, scrollRowIntoView: true, skipError: false, triggerEvent: false });
      expect(serviceHighlightSpy).not.toHaveBeenCalled();
      expect(pubSubSpy).not.toHaveBeenLastCalledWith(`onItemUpserted`, mockItem);
    });

    it('should call the "upsertItemById" method and expect it to call the "updateItem" when the item already exist in the grid', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const dataviewSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      const serviceAddItemSpy = jest.spyOn(service, 'addItem');
      const serviceUpdateSpy = jest.spyOn(service, 'updateItem');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.upsertItemById(0, mockItem, { highlightRow: true });

      expect(dataviewSpy).toHaveBeenCalledWith(0);
      expect(serviceAddItemSpy).not.toHaveBeenCalled();
      expect(serviceUpdateSpy).toHaveBeenCalled();
      expect(serviceUpdateSpy).toHaveBeenCalledWith(mockItem, { highlightRow: true, selectRow: false, triggerEvent: true });
      expect(serviceHighlightSpy).not.toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalled();
    });
  });

  describe('updateItem methods', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw an error when 1st argument for the item object is missing', () => {
      expect(() => service.updateItem(null as any)).toThrowError('[Slickgrid-Universal] Calling Update of an item requires the item to include an "id" property');
    });

    it('should NOT throw an error when "skipError" is enabled even when 1st argument for the item object is missing', () => {
      expect(() => service.updateItem(null as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Calling Update of an item requires the item to include an "id" property');
    });

    it('should expect the service to call the "updateItemById" when calling "updateItem"', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const getRowIdSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(mockItem.id);
      const getRowIndexSpy = jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(mockItem.id);
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const updateSpy = jest.spyOn(service, 'updateItemById');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.updateItem(mockItem, { highlightRow: true });

      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(getRowIdSpy).toHaveBeenCalledWith(0);
      expect(getRowIndexSpy).toHaveBeenCalledWith(0);
      expect(serviceHighlightSpy).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith(mockItem.id, mockItem, { highlightRow: true, selectRow: false, scrollRowIntoView: false, skipError: false, triggerEvent: true });
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemUpdated`, mockItem);
    });

    it('should be able to update an item that exist in the dataview even when it is not showing in the grid (filtered from the grid) but will not highlight/selectRow since it is not in showing in the grid', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const getRowIdSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(undefined);
      const getRowIndexSpy = jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(mockItem.id);
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const updateRowSpy = jest.spyOn(gridStub, 'updateRow');
      const selectSpy = jest.spyOn(service, 'setSelectedRows');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.updateItemById(0, mockItem, { highlightRow: true, selectRow: true });

      expect(getRowIdSpy).toHaveBeenCalledWith(0);
      expect(getRowIndexSpy).toHaveBeenCalledWith(0);
      expect(serviceHighlightSpy).not.toHaveBeenCalled();
      expect(updateRowSpy).not.toHaveBeenCalled();
      expect(selectSpy).not.toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemUpdated`, mockItem);
    });

    it('should expect the service to call the "updateItemById" when calling "updateItem" and setting the "selecRow" flag and the grid option "enableRowSelection" is set', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const getRowIdSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(mockItem.id);
      const getRowIndexSpy = jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(mockItem.id);
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.updateItemById(0, mockItem, { selectRow: true });

      expect(getRowIdSpy).toHaveBeenCalledWith(0);
      expect(getRowIndexSpy).toHaveBeenCalledWith(0);
      expect(serviceHighlightSpy).not.toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemUpdated`, mockItem);
    });

    it('should expect the service to call the "updateItem" when calling "updateItems" with a single item which is not an array', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const getRowIdSpy = jest.spyOn(dataviewStub, 'getRowById');
      const getRowIndexSpy = jest.spyOn(dataviewStub, 'getIdxById');
      const serviceUpdateSpy = jest.spyOn(service, 'updateItem');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.updateItems(mockItem, { highlightRow: true, selectRow: false, triggerEvent: true });

      expect(beginUpdateSpy).not.toHaveBeenCalled();
      expect(endUpdateSpy).not.toHaveBeenCalled();
      expect(getRowIdSpy).toHaveBeenCalledTimes(1);
      expect(getRowIndexSpy).toHaveBeenCalledTimes(1);
      expect(serviceUpdateSpy).toHaveBeenCalledTimes(1);
      expect(serviceUpdateSpy).toHaveBeenCalledWith(mockItem, { highlightRow: true, selectRow: false, scrollRowIntoView: false, skipError: false, triggerEvent: true });
      expect(serviceHighlightSpy).toHaveBeenCalledWith(0);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemUpdated`, mockItem);
    });

    it('should expect the row to be selected when calling "updateItems" with an item when setting the "selecRow" flag and the grid option "enableRowSelection" is set', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true } as GridOption);
      const updateSpy = jest.spyOn(dataviewStub, 'updateItems');
      const selectSpy = jest.spyOn(service, 'setSelectedRows');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.updateItems([mockItem], { highlightRow: true, selectRow: true });

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledWith([0], [mockItem]);
      expect(selectSpy).toHaveBeenCalledWith([0]);
      expect(serviceHighlightSpy).toHaveBeenCalledWith([0]);
      expect(pubSubSpy).toHaveBeenCalledWith(`onItemUpdated`, [mockItem]);
    });

    it('should call the "updateItem" method and expect it to call the "updateItemById" with different boolean flags provided as arguments', () => {
      const mockItemId = 72;
      const mockRowNumber = 8;
      const mockItem = { id: mockItemId, user: { firstName: 'John', lastName: 'Doe' } };
      const getRowIdSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(mockRowNumber);
      const getRowIndexSpy = jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(mockRowNumber);
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');
      const updateByIdSpy = jest.spyOn(service, 'updateItemById');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.updateItem(mockItem, { highlightRow: false, selectRow: true, scrollRowIntoView: true, triggerEvent: true });

      expect(beginUpdateSpy).not.toHaveBeenCalled();
      expect(endUpdateSpy).not.toHaveBeenCalled();
      expect(getRowIdSpy).toHaveBeenCalledWith(mockItemId);
      expect(getRowIndexSpy).toHaveBeenCalledWith(mockItemId);
      expect(scrollSpy).toHaveBeenCalledWith(mockRowNumber);
      expect(updateByIdSpy).toHaveBeenCalled();
      expect(updateByIdSpy).toHaveBeenCalledWith(mockItem.id, mockItem, { highlightRow: false, selectRow: true, scrollRowIntoView: true, skipError: false, triggerEvent: true });
      expect(serviceHighlightSpy).not.toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemUpdated`, mockItem);
    });

    it('should expect the service to call the DataView "updateItem" when calling "addItem" with an item that has an Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...mockGridOptions, datasetIdPropertyName: 'customId' });
      const mockItem = { customId: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const getRowIdSpy = jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(mockItem.customId);
      const getRowIndexSpy = jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(mockItem.customId);
      const updateSpy = jest.spyOn(service, 'updateItemById');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.updateItem(mockItem);

      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(getRowIdSpy).toHaveBeenCalledWith(0);
      expect(getRowIndexSpy).toHaveBeenCalledWith(0);
      expect(updateSpy).toHaveBeenCalledWith(mockItem.customId, mockItem, { highlightRow: false, selectRow: false, scrollRowIntoView: false, skipError: false, triggerEvent: true });
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemUpdated`, mockItem);

      delete mockGridOptions.datasetIdPropertyName;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
    });

    it('should throw an error when calling "updateItemById" without a valid "id"', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      expect(() => service.updateItemById(undefined as any, mockItem)).toThrowError('[Slickgrid-Universal] Cannot update a row without a valid "id"');
    });

    it('should throw an error when calling "updateItemById" with an invalid/undefined item', () => {
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(undefined as any);
      expect(() => service.updateItemById(5, undefined)).toThrowError('[Slickgrid-Universal] The item to update in the grid was not found with id: 5');
    });

    it('should NOT throw an error when "skipError" is enabled even when calling "updateItemById" without a valid "id"', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      expect(() => service.updateItemById(undefined as any, mockItem, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Cannot update a row without a valid "id"');
    });

    it('should NOT throw an error when "skipError" is enabled even when calling "updateItemById" and not finding the item in the grid', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(undefined as any);
      expect(() => service.updateItemById(5, mockItem, { skipError: true })).not.toThrowError('[Slickgrid-Universal] The item to update in the grid was not found with id: 5');
    });

    it('should throw an error when 1st argument for the item object is missing the Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, datasetIdPropertyName: 'customId' } as GridOption);
      expect(() => service.updateItem(null as any)).toThrowError('[Slickgrid-Universal] Calling Update of an item requires the item to include an "customId" property');

      // reset mock
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({});
    });

    it('should NOT throw an error when "skipError" is enabled even when 1st argument for the item object is missing the Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, datasetIdPropertyName: 'customId' } as GridOption);
      expect(() => service.updateItem(null as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Calling Update of an item requires the item to include an "customId" property');

      // reset mock
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({});
    });

    it('should invalidate and rerender the tree dataset when grid option "enableTreeData" is set when calling "updateItem"', () => {
      const mockUpdatedItem = { id: 1, file: 'vacation.txt', size: 2.2, parentId: 0 };
      const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }, mockUpdatedItem];
      const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }, mockUpdatedItem] }];
      const mockColumns = [{ id: 'file', field: 'file', }, { id: 'size', field: 'size', }] as Column[];

      jest.spyOn(dataviewStub, 'getItems').mockReturnValue(mockFlatDataset);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      jest.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ flat: mockFlatDataset as any[], hierarchical: mockHierarchical as any[] });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true, enableTreeData: true } as GridOption);
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);
      const setItemSpy = jest.spyOn(dataviewStub, 'setItems');
      const updateSpy = jest.spyOn(dataviewStub, 'updateItem');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const invalidateSpy = jest.spyOn(service, 'invalidateHierarchicalDataset');

      service.updateItem(mockUpdatedItem);

      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledWith(mockUpdatedItem.id, mockUpdatedItem);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemUpdated`, mockUpdatedItem);
      expect(invalidateSpy).toHaveBeenCalled();
      expect(setItemSpy).toHaveBeenCalledWith(mockFlatDataset);
    });

    it('should invalidate and rerender the tree dataset when grid option "enableTreeData" is set when calling "updateItems"', () => {
      const mockUpdatedItem = { id: 1, file: 'vacation.txt', size: 2.2, parentId: 0 };
      const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }, mockUpdatedItem];
      const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }, mockUpdatedItem] }];
      const mockColumns = [{ id: 'file', field: 'file', }, { id: 'size', field: 'size', }] as Column[];

      jest.spyOn(dataviewStub, 'getItems').mockReturnValue(mockFlatDataset);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      jest.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ flat: mockFlatDataset as any[], hierarchical: mockHierarchical as any[] });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true, enableTreeData: true } as GridOption);
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);
      const setItemSpy = jest.spyOn(dataviewStub, 'setItems');
      const updateSpy = jest.spyOn(dataviewStub, 'updateItems');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const invalidateSpy = jest.spyOn(service, 'invalidateHierarchicalDataset');

      service.updateItems([mockUpdatedItem]);

      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledWith([mockUpdatedItem.id], [mockUpdatedItem]);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemUpdated`, [mockUpdatedItem]);
      expect(invalidateSpy).toHaveBeenCalled();
      expect(setItemSpy).toHaveBeenCalledWith(mockFlatDataset);
    });
  });

  describe('addItem methods', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw an error when 1st argument for the item object is missing', () => {
      jest.spyOn(gridStub, 'getData').mockReturnValueOnce(undefined as any);
      expect(() => service.addItem(null as any)).toThrowError('[Slickgrid-Universal] We could not find SlickGrid Grid, DataView objects');
    });

    it('should NOT throw an error when "skipError" is enabled even when 1st argument for the item object is missing', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(undefined as any);
      expect(() => service.addItem(null as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] We could not find SlickGrid Grid, DataView objects');
    });

    it('should throw an error when 1st argument for the item object is missing or "id" is missing', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true } as GridOption);
      expect(() => service.addItem(null as any)).toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "id" property');
      expect(() => service.addItem({ user: 'John' })).toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "id" property');
    });

    it('should NOT throw an error when "skipError" is enabled even when 1st argument for the item object is missing or "id" is missing', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true } as GridOption);
      expect(() => service.addItem(null as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "id" property');
      expect(() => service.addItem({ user: 'John' }, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "id" property');
    });

    it('should throw an error when 1st argument for the item object is missing the Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, datasetIdPropertyName: 'customId' } as GridOption);
      expect(() => service.addItem(null as any)).toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "customId" property');
      expect(() => service.addItem({ user: 'John' })).toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "customId" property');

      // reset mock
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({});
    });

    it('should NOT throw an error when "skipError" is enabled even when 1st argument for the item object is missing the Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, datasetIdPropertyName: 'customId' } as GridOption);
      expect(() => service.addItem(null as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "customId" property');
      expect(() => service.addItem({ user: 'John' }, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "customId" property');

      // reset mock
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({});
    });

    it('should throw an error when addItem and a position is provided when used with Tree Data', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableTreeData: true } as GridOption);
      expect(() => service.addItem({ id: 0, user: 'John' }, { position: 'top' })).toThrowError('[Slickgrid-Universal] Please note that `addItem({ position: "top" })` is not supported when used with Tree Data because of the extra complexity.');
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({}); // reset mock
    });

    it('should expect the service to call the DataView "insertItem" when calling "addItem" with an item that has an Id defined by the "datasetIdPropertyName" property', () => {
      mockGridOptions.datasetIdPropertyName = 'customId';
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
      const mockItem = { customId: 0, user: { firstName: 'John', lastName: 'Doe' } };

      // datasetIdPropertyName: 'customId'
      const addSpy = jest.spyOn(dataviewStub, 'insertItem');
      const selectSpy = jest.spyOn(gridStub, 'setSelectedRows');
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItem(mockItem);

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(0, mockItem);
      expect(selectSpy).not.toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalledWith(0);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
      delete mockGridOptions.datasetIdPropertyName;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({});
    });

    it('should expect the service to call the DataView "insertItem" when calling "addItem" with an item', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const addSpy = jest.spyOn(dataviewStub, 'insertItem');
      const selectSpy = jest.spyOn(gridStub, 'setSelectedRows');
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItem(mockItem);

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(0, mockItem);
      expect(selectSpy).not.toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalledWith(0);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
    });

    it('should expect the row to be selected when calling "addItem" with an item when setting the "selecRow" flag and the grid option "enableRowSelection" is set', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true } as GridOption);
      const addSpy = jest.spyOn(dataviewStub, 'insertItem');
      const selectSpy = jest.spyOn(gridStub, 'setSelectedRows');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItem(mockItem, { selectRow: true });

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(0, mockItem);
      expect(selectSpy).toHaveBeenCalledWith([0]);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
    });

    it('should expect the service to call the DataView "addItem" when calling "addItem" with an item and the option "position" set to "bottom"', () => {
      const expectationNewRowPosition = 1000;
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(expectationNewRowPosition);
      const addSpy = jest.spyOn(dataviewStub, 'addItem');
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItem(mockItem, { position: 'bottom' });

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(mockItem);
      expect(scrollSpy).toHaveBeenCalledWith(expectationNewRowPosition);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
    });

    it('should expect the service to call the DataView "insertItem" and go to first page when using local Pagination and calling "addItem" when the insert position is set to "top"', () => {
      const expectationNewRowPosition = 1000;
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(expectationNewRowPosition);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enablePagination: true } as GridOption);
      const addSpy = jest.spyOn(dataviewStub, 'insertItem');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const firstPageSpy = jest.spyOn(paginationServiceStub, 'goToFirstPage');
      const lastPageSpy = jest.spyOn(paginationServiceStub, 'goToLastPage');

      service.addItem(mockItem, { position: 'top' });

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(0, mockItem);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
      expect(firstPageSpy).toHaveBeenCalledTimes(1);
      expect(lastPageSpy).toHaveBeenCalledTimes(0);

      delete mockGridOptions.datasetIdPropertyName;
      delete mockGridOptions.enablePagination;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
    });

    it('should expect the service to call the DataView "insertItem" and go to last page when using local Pagination and calling "addItem" when the insert position is set to "bottom"', () => {
      const expectationNewRowPosition = 1000;
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(expectationNewRowPosition);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enablePagination: true } as GridOption);
      const addSpy = jest.spyOn(dataviewStub, 'addItem');
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const firstPageSpy = jest.spyOn(paginationServiceStub, 'goToFirstPage');
      const lastPageSpy = jest.spyOn(paginationServiceStub, 'goToLastPage');

      service.addItem(mockItem, { position: 'bottom' });

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(mockItem);
      expect(scrollSpy).toHaveBeenCalledWith(expectationNewRowPosition);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
      expect(firstPageSpy).toHaveBeenCalledTimes(0);
      expect(lastPageSpy).toHaveBeenCalledTimes(1);

      delete mockGridOptions.datasetIdPropertyName;
      delete mockGridOptions.enablePagination;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
    });

    it('should expect to call the DataView "insertItems" once when calling the service "addItems" with an array of items and no position is provided (defaults to insert "top")', () => {
      const mockItems = [{ id: 0, user: { firstName: 'John', lastName: 'Doe' } }, { id: 5, user: { firstName: 'Jane', lastName: 'Doe' } }];
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(0).mockReturnValueOnce(1);
      const insertItemsSpy = jest.spyOn(dataviewStub, 'insertItems');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItems(mockItems);

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(insertItemsSpy).toHaveBeenCalledTimes(1);
      expect(insertItemsSpy).toHaveBeenCalledWith(0, [mockItems[0], mockItems[1]]);
      expect(serviceHighlightSpy).toHaveBeenCalledTimes(1);
      expect(serviceHighlightSpy).toHaveBeenCalledWith([0, 1]);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItems);
    });

    it('should expect to call the DataView "addItems" once when calling the service "addItems" with an array of items and the option "position" set to "bottom"', () => {
      const expectationNewRowPosition1 = 1000;
      const expectationNewRowPosition2 = 1001;
      const mockItems = [{ id: 0, user: { firstName: 'John', lastName: 'Doe' } }, { id: 5, user: { firstName: 'Jane', lastName: 'Doe' } }];
      jest.spyOn(dataviewStub, 'getRowById')
        .mockReturnValueOnce(expectationNewRowPosition1)
        .mockReturnValueOnce(expectationNewRowPosition2);
      const addItemsSpy = jest.spyOn(dataviewStub, 'addItems');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItems(mockItems, { position: 'bottom' });

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(addItemsSpy).toHaveBeenCalledTimes(1);
      expect(addItemsSpy).toHaveBeenCalledWith([mockItems[0], mockItems[1]]);
      expect(serviceHighlightSpy).toHaveBeenCalledTimes(1);
      expect(serviceHighlightSpy).toHaveBeenCalledWith([expectationNewRowPosition1, expectationNewRowPosition2]);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItems);
    });

    it('should expect the service to call the "addItem" when calling "addItems" with a single item which is not an array', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const serviceAddSpy = jest.spyOn(service, 'addItem');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItems(mockItem);

      expect(beginUpdateSpy).not.toHaveBeenCalled();
      expect(endUpdateSpy).not.toHaveBeenCalled();
      expect(serviceAddSpy).toHaveBeenCalledTimes(1);
      expect(serviceAddSpy).toHaveBeenCalledWith(mockItem, { highlightRow: true, selectRow: false, resortGrid: false, scrollRowIntoView: true, skipError: false, triggerEvent: true });
      expect(serviceHighlightSpy).toHaveBeenCalledTimes(1);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
    });

    it('should add a single item by calling "addItems" method and expect to call a grid resort but without highlighting neither triggering an event', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const serviceAddSpy = jest.spyOn(service, 'addItem');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const resortSpy = jest.spyOn(dataviewStub, 'reSort');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItems(mockItem, { highlightRow: false, selectRow: false, resortGrid: true, triggerEvent: false });

      expect(beginUpdateSpy).not.toHaveBeenCalled();
      expect(endUpdateSpy).not.toHaveBeenCalled();
      expect(serviceAddSpy).toHaveBeenCalled();
      expect(resortSpy).toHaveBeenCalled();
      expect(serviceAddSpy).toHaveBeenCalledWith(mockItem, { highlightRow: false, resortGrid: true, selectRow: false, scrollRowIntoView: true, skipError: false, triggerEvent: false });
      expect(serviceHighlightSpy).not.toHaveBeenCalled();
      expect(pubSubSpy).not.toHaveBeenLastCalledWith(`onItemAdded`);
    });

    it('should add a single item by calling "addItems" method and expect to call a grid resort & highlight but without triggering an event', () => {
      const mockItems = [{ id: 0, user: { firstName: 'John', lastName: 'Doe' } }, { id: 5, user: { firstName: 'Jane', lastName: 'Doe' } }];
      const insertItemsSpy = jest.spyOn(dataviewStub, 'insertItems');
      const serviceHighlightSpy = jest.spyOn(service, 'highlightRow');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const resortSpy = jest.spyOn(dataviewStub, 'reSort');
      const getRowByIdSpy = jest.spyOn(dataviewStub, 'getRowById');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItems(mockItems, { highlightRow: true, selectRow: false, resortGrid: true, triggerEvent: false });

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(insertItemsSpy).toHaveBeenCalledTimes(1);
      expect(resortSpy).toHaveBeenCalled();
      expect(insertItemsSpy).toHaveBeenCalledWith(0, [mockItems[0], mockItems[1]]);
      expect(serviceHighlightSpy).toHaveBeenCalledTimes(1);
      expect(getRowByIdSpy).toHaveBeenCalledTimes(2);
      expect(pubSubSpy).not.toHaveBeenLastCalledWith(`onItemAdded`);
    });

    it('should expect the row to be selected when calling "addItems" with an item when setting the "selecRow" flag and the grid option "enableRowSelection" is set', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true } as GridOption);
      const insertSpy = jest.spyOn(dataviewStub, 'insertItems');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const selectSpy = jest.spyOn(service, 'setSelectedRows');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItems([mockItem], { selectRow: true });

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(insertSpy).toHaveBeenCalledTimes(1);
      expect(insertSpy).toHaveBeenCalledWith(0, [mockItem]);
      expect(selectSpy).toHaveBeenCalledWith([0]);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, [mockItem]);
    });

    it('should expect the row to be selected when calling "addItems" with an item wich is not an array when setting the "selecRow" flag and the grid option "enableRowSelection" is set', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({
        enableRowSelection: true,
        selectRow: true
      } as GridOption);
      const addSpy = jest.spyOn(dataviewStub, 'insertItem');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const selectSpy = jest.spyOn(service, 'setSelectedRow');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItems(mockItem, { selectRow: true });

      expect(beginUpdateSpy).not.toHaveBeenCalled();
      expect(endUpdateSpy).not.toHaveBeenCalled();
      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(0, mockItem);
      expect(selectSpy).toHaveBeenCalledWith(0);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
    });

    it('should expect the service to call the DataView "insertItem" when calling "addItem" with an item that has an Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...mockGridOptions, datasetIdPropertyName: 'customId' });
      const mockItem = { customId: 0, user: { firstName: 'John', lastName: 'Doe' } };

      // datasetIdPropertyName: 'customId'
      const addSpy = jest.spyOn(dataviewStub, 'insertItem');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const selectSpy = jest.spyOn(gridStub, 'setSelectedRows');
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.addItem(mockItem);

      expect(beginUpdateSpy).not.toHaveBeenCalled();
      expect(endUpdateSpy).not.toHaveBeenCalled();
      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(0, mockItem);
      expect(selectSpy).not.toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalledWith(0);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
      delete mockGridOptions.datasetIdPropertyName;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
    });

    it('should invalidate and rerender the tree dataset when grid option "enableTreeData" is set when calling "addItem"', () => {
      const mockItem = { id: 3, file: 'blah.txt', size: 2, parentId: 0 };
      const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }, mockItem];
      const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }, mockItem] }];
      const mockColumns = [{ id: 'file', field: 'file', }, { id: 'size', field: 'size', }] as Column[];

      jest.spyOn(dataviewStub, 'getItems').mockReturnValue(mockFlatDataset);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValueOnce([{ columnId: 'title', sortCol: mockColumns[0], sortAsc: false }]);
      jest.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ flat: mockFlatDataset as any[], hierarchical: mockHierarchical as any[] });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true, enableTreeData: true } as GridOption);
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);
      const setItemSpy = jest.spyOn(dataviewStub, 'setItems');
      const addSpy = jest.spyOn(dataviewStub, 'addItem');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const invalidateSpy = jest.spyOn(service, 'invalidateHierarchicalDataset');
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');

      service.addItem(mockItem);

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(mockItem);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
      expect(invalidateSpy).toHaveBeenCalled();
      expect(setItemSpy).toHaveBeenCalledWith(mockFlatDataset);
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('should not scroll after insert when grid option "enableTreeData" is enabled when calling "addItem" with "scrollRowIntoView" disabled', () => {
      const mockItem = { id: 3, file: 'blah.txt', size: 2, parentId: 0 };
      const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }, mockItem];
      const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }, mockItem] }];
      const mockColumns = [{ id: 'file', field: 'file', }, { id: 'size', field: 'size', }] as Column[];

      jest.spyOn(dataviewStub, 'getItems').mockReturnValue(mockFlatDataset);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValueOnce([{ columnId: 'title', sortCol: mockColumns[0], sortAsc: false }]);
      jest.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ flat: mockFlatDataset as any[], hierarchical: mockHierarchical as any[] });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true, enableTreeData: true } as GridOption);
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);
      const setItemSpy = jest.spyOn(dataviewStub, 'setItems');
      const addSpy = jest.spyOn(dataviewStub, 'addItem');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const invalidateSpy = jest.spyOn(service, 'invalidateHierarchicalDataset');
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');

      service.addItem(mockItem, { scrollRowIntoView: false });

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(mockItem);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, mockItem);
      expect(invalidateSpy).toHaveBeenCalled();
      expect(setItemSpy).toHaveBeenCalledWith(mockFlatDataset);
      expect(scrollSpy).not.toHaveBeenCalled();
    });

    it('should invalidate and rerender the tree dataset when grid option "enableTreeData" is set when calling "addItems"', () => {
      const mockItem = { id: 3, file: 'blah.txt', size: 2, parentId: 0 };
      const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }, mockItem];
      const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }, mockItem] }];
      const mockColumns = [{ id: 'file', field: 'file', }, { id: 'size', field: 'size', }] as Column[];

      jest.spyOn(dataviewStub, 'getItems').mockReturnValue(mockFlatDataset);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValueOnce([{ columnId: 'title', sortCol: mockColumns[0], sortAsc: true }]);
      jest.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ flat: mockFlatDataset as any[], hierarchical: mockHierarchical as any[] });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true, enableTreeData: true } as GridOption);
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);
      const setItemSpy = jest.spyOn(dataviewStub, 'setItems');
      const addSpy = jest.spyOn(dataviewStub, 'addItems');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const invalidateSpy = jest.spyOn(service, 'invalidateHierarchicalDataset');
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');

      service.addItems([mockItem]);

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith([mockItem]);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, [mockItem]);
      expect(invalidateSpy).toHaveBeenCalled();
      expect(setItemSpy).toHaveBeenCalledWith(mockFlatDataset);
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('should not scroll after insert when grid option "enableTreeData" is enabled when calling "addItems" with "scrollRowIntoView" disabled', () => {
      const mockItem = { id: 3, file: 'blah.txt', size: 2, parentId: 0 };
      const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }, mockItem];
      const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }, mockItem] }];
      const mockColumns = [{ id: 'file', field: 'file', }, { id: 'size', field: 'size', }] as Column[];

      jest.spyOn(dataviewStub, 'getItems').mockReturnValue(mockFlatDataset);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValueOnce([{ columnId: 'title', sortCol: mockColumns[0], sortAsc: true }]);
      jest.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ flat: mockFlatDataset as any[], hierarchical: mockHierarchical as any[] });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableRowSelection: true, enableTreeData: true } as GridOption);
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);
      const setItemSpy = jest.spyOn(dataviewStub, 'setItems');
      const addSpy = jest.spyOn(dataviewStub, 'addItems');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const invalidateSpy = jest.spyOn(service, 'invalidateHierarchicalDataset');
      const scrollSpy = jest.spyOn(gridStub, 'scrollRowIntoView');

      service.addItems([mockItem], { scrollRowIntoView: false });

      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith([mockItem]);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemAdded`, [mockItem]);
      expect(invalidateSpy).toHaveBeenCalled();
      expect(setItemSpy).toHaveBeenCalledWith(mockFlatDataset);
      expect(scrollSpy).not.toHaveBeenCalled();
    });

    it('should throw an error when 1st argument for the item object is missing the Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, datasetIdPropertyName: 'customId' } as GridOption);
      expect(() => service.addItem(null as any)).toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "customId" property');
      expect(() => service.addItem({ user: 'John' })).toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "customId" property');

      // reset mock
      delete mockGridOptions.datasetIdPropertyName;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
    });

    it('should NOT throw an error when "skipError" is enabled even when 1st argument for the item object is missing the Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, datasetIdPropertyName: 'customId' } as GridOption);
      expect(() => service.addItem(null as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "customId" property');
      expect(() => service.addItem({ user: 'John' }, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Adding an item requires the item to include an "customId" property');

      // reset mock
      delete mockGridOptions.datasetIdPropertyName;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
    });
  });

  describe('deleteItem methods', () => {
    it('should throw an error when calling "deleteItem" method and 1st argument for the item object is missing or "id" is missing', () => {
      expect(() => service.deleteItem(null as any)).toThrowError('[Slickgrid-Universal] Deleting an item requires the item to include an "id" property');
      expect(() => service.deleteItem({ user: 'John' })).toThrowError('[Slickgrid-Universal] Deleting an item requires the item to include an "id" property');
    });

    it('should NOT throw an error when "skipError" is enabled even when calling "deleteItem" method and 1st argument for the item object is missing or "id" is missing', () => {
      expect(() => service.deleteItem(null as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Deleting an item requires the item to include an "id" property');
      expect(() => service.deleteItem({ user: 'John' }, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Deleting an item requires the item to include an "id" property');
    });

    it('should throw an error when calling "deleteItemById" without a valid "id" as argument', () => {
      expect(() => service.deleteItemById(null as any)).toThrowError('[Slickgrid-Universal] Cannot delete a row without a valid "id"');
      expect(() => service.deleteItemById(undefined as any)).toThrowError('[Slickgrid-Universal] Cannot delete a row without a valid "id"');
    });

    it('should NOT throw an error when "skipError" is enabled even when calling "deleteItemById" without a valid "id" as argument', () => {
      expect(() => service.deleteItemById(null as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Cannot delete a row without a valid "id"');
      expect(() => service.deleteItemById(undefined as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Cannot delete a row without a valid "id"');
    });

    it('should expect the service to call "deleteItemById" method when calling "deleteItem" with an item', () => {
      const mockItem = { id: 4, user: { firstName: 'John', lastName: 'Doe' } };
      const deleteByIdSpy = jest.spyOn(service, 'deleteItemById');

      const output = service.deleteItem(mockItem);

      expect(output).toEqual(4);
      expect(deleteByIdSpy).toHaveBeenCalled();
    });

    it('should expect the service to call the DataView "deleteItem" when calling "deleteItem" with an item', () => {
      const mockItem = { id: 4, user: { firstName: 'John', lastName: 'Doe' } };
      const deleteSpy = jest.spyOn(dataviewStub, 'deleteItem');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const output = service.deleteItemById(mockItem.id);

      expect(output).toEqual(4);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith(mockItem.id);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemDeleted`, mockItem.id);
    });

    it('should remove any row selection when the grid option "enableCheckboxSelector" is enabled', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableCheckboxSelector: true } as GridOption);
      const mockItem = { id: 4, user: { firstName: 'John', lastName: 'Doe' } };
      const selectionSpy = jest.spyOn(service, 'setSelectedRows');

      service.deleteItemById(mockItem.id);

      expect(selectionSpy).toHaveBeenCalledWith([]);
    });

    it('should remove any row selection when the grid option "enableRowSelection" is enabled', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableRowSelection: true } as GridOption);
      const mockItem = { id: 4, user: { firstName: 'John', lastName: 'Doe' } };
      const selectionSpy = jest.spyOn(service, 'setSelectedRows');

      service.deleteItemById(mockItem.id);

      expect(selectionSpy).toHaveBeenCalledWith([]);
    });

    it('should expect the service to call the DataView "deleteItems" once with array of item Ids when calling "deleteItems" with an array of items', () => {
      const mockItems = [{ id: 0, user: { firstName: 'John', lastName: 'Doe' } }, { id: 5, user: { firstName: 'Jane', lastName: 'Doe' } }];
      const deleteItemsSpy = jest.spyOn(dataviewStub, 'deleteItems');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const output = service.deleteItems(mockItems);

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(output).toEqual([0, 5]);
      expect(deleteItemsSpy).toHaveBeenCalledTimes(1);
      expect(deleteItemsSpy).toHaveBeenCalledWith([0, 5]);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemDeleted`, mockItems);
    });

    it('should expect the service to call the "deleteItem" when calling "deleteItems" with a single item which is not an array', () => {
      const mockItem = { id: 4, user: { firstName: 'John', lastName: 'Doe' } };
      const serviceDeleteSpy = jest.spyOn(service, 'deleteItem');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const output = service.deleteItems(mockItem);

      expect(beginUpdateSpy).not.toHaveBeenCalled();
      expect(endUpdateSpy).not.toHaveBeenCalled();
      expect(output).toEqual([4]);
      expect(serviceDeleteSpy).toHaveBeenCalledTimes(1);
      expect(serviceDeleteSpy).toHaveBeenCalledWith(mockItem, { skipError: false, triggerEvent: true });
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemDeleted`, mockItem.id);
    });

    it('should delete a single item by calling "deleteItems" method without triggering an event', () => {
      const mockItem = { id: 0, user: { firstName: 'John', lastName: 'Doe' } };
      const serviceDeleteSpy = jest.spyOn(service, 'deleteItem');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const output = service.deleteItems(mockItem, { triggerEvent: false });

      expect(beginUpdateSpy).not.toHaveBeenCalled();
      expect(endUpdateSpy).not.toHaveBeenCalled();
      expect(output).toEqual([0]);
      expect(serviceDeleteSpy).toHaveBeenCalled();
      expect(serviceDeleteSpy).toHaveBeenCalledWith(mockItem, { skipError: false, triggerEvent: false });
      expect(pubSubSpy).not.toHaveBeenLastCalledWith(`onItemDeleted`);
    });

    it('should delete multiple items by calling "deleteItems" method and expect to trigger a single an event', () => {
      const mockItems = [{ id: 0, user: { firstName: 'John', lastName: 'Doe' } }, { id: 5, user: { firstName: 'Jane', lastName: 'Doe' } }];
      const deleteItemsSpy = jest.spyOn(dataviewStub, 'deleteItems');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const output = service.deleteItems(mockItems, { triggerEvent: true });

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(output).toEqual([0, 5]);
      expect(deleteItemsSpy).toHaveBeenCalledTimes(1);
      expect(deleteItemsSpy).toHaveBeenCalledWith([0, 5]);
      expect(pubSubSpy).toHaveBeenCalledTimes(1);
    });

    it('should delete a single item by calling "deleteItemByIds" method without triggering an event', () => {
      const serviceDeleteSpy = jest.spyOn(service, 'deleteItemById');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const output = service.deleteItemByIds([3], { triggerEvent: false });

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(output).toEqual([3]);
      expect(serviceDeleteSpy).toHaveBeenCalled();
      expect(serviceDeleteSpy).toHaveBeenCalledWith(3, { triggerEvent: false });
      expect(pubSubSpy).not.toHaveBeenLastCalledWith(`onItemDeleted`);
    });

    it('should delete a single item by calling "deleteItemByIds" method and expect to trigger a single an event', () => {
      const serviceDeleteSpy = jest.spyOn(service, 'deleteItemById');
      const dataviewDeleteSpy = jest.spyOn(dataviewStub, 'deleteItem');
      const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
      const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const output = service.deleteItemByIds([0, 5], { triggerEvent: true });

      expect(beginUpdateSpy).toHaveBeenCalled();
      expect(endUpdateSpy).toHaveBeenCalled();
      expect(output).toEqual([0, 5]);
      expect(serviceDeleteSpy).toHaveBeenCalled();
      expect(serviceDeleteSpy).toHaveBeenNthCalledWith(1, 0, { triggerEvent: false });
      expect(serviceDeleteSpy).toHaveBeenNthCalledWith(2, 5, { triggerEvent: false });
      expect(dataviewDeleteSpy).toHaveBeenCalledTimes(2);
      expect(pubSubSpy).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when argument is not an array of IDs to delete', () => {
      // @ts-ignore:2345
      const output = service.deleteItemByIds(5, { triggerEvent: true });
      expect(output).toEqual([]);
    });

    it('should expect the service to call the DataView "insertItem" when calling "addItem" with an item that has an Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...mockGridOptions, datasetIdPropertyName: 'customId' });
      const mockItem = { customId: 4, user: { firstName: 'John', lastName: 'Doe' } };
      const deleteSpy = jest.spyOn(dataviewStub, 'deleteItem');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const output = service.deleteItemById(mockItem.customId);

      expect(output).toEqual(4);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith(mockItem.customId);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onItemDeleted`, mockItem.customId);
      delete mockGridOptions.datasetIdPropertyName;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
    });

    it('should throw an error when 1st argument for the item object is missing the Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, datasetIdPropertyName: 'customId' } as GridOption);
      expect(() => service.deleteItem(null as any)).toThrowError('[Slickgrid-Universal] Deleting an item requires the item to include an "customId" property');
      expect(() => service.deleteItem({ user: 'John' })).toThrowError('[Slickgrid-Universal] Deleting an item requires the item to include an "customId" property');

      // reset mock
      delete mockGridOptions.datasetIdPropertyName;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
    });

    it('should NOT throw an error when "skipError" is enabled even when 1st argument for the item object is missing the Id defined by the "datasetIdPropertyName" property', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, datasetIdPropertyName: 'customId' } as GridOption);
      expect(() => service.deleteItem(null as any, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Deleting an item requires the item to include an "customId" property');
      expect(() => service.deleteItem({ user: 'John' }, { skipError: true })).not.toThrowError('[Slickgrid-Universal] Deleting an item requires the item to include an "customId" property');

      // reset mock
      delete mockGridOptions.datasetIdPropertyName;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
    });
  });

  describe('clearAllFiltersAndSorts method', () => {
    it('should clear sorting & filters via the Sort & Filter Services, while the clear sort is specifically not triggering any sort event', () => {
      const sortSpy = jest.spyOn(sortServiceStub, 'clearSorting');
      const filterSpy = jest.spyOn(filterServiceStub, 'clearFilters');

      service.clearAllFiltersAndSorts();

      expect(sortSpy).toBeCalledWith(false);
      expect(filterSpy).toBeCalledWith();
    });
  });

  describe('Pinning methods', () => {
    const columnsMock: Column[] = [{ id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' }, { id: 'field2', field: 'field2', width: 75 }];

    it('should call "clearPinning" and expect SlickGrid "setOptions" and "setColumns" to be called with frozen options being reset', () => {
      const setOptionsSpy = jest.spyOn(gridStub, 'setOptions');
      const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
      jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 1));

      service.clearPinning();

      expect(setColumnsSpy).toHaveBeenCalled();
      expect(setOptionsSpy).toHaveBeenCalledWith({ frozenBottom: false, frozenColumn: -1, frozenRow: -1, enableMouseWheelScrollHandler: false });
    });

    it('should call "setPinning" which itself calls "clearPinning" when the pinning option input is an empty object', () => {
      const mockPinning = {};
      const clearPinningSpy = jest.spyOn(service, 'clearPinning');
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);

      service.setPinning(mockPinning);

      expect(clearPinningSpy).toHaveBeenCalled();
    });

    it('should call "setPinning" which itself calls "clearPinning" when the pinning option input is null', () => {
      const mockPinning = null;
      const clearPinningSpy = jest.spyOn(service, 'clearPinning');
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);

      service.setPinning(mockPinning as any);

      expect(clearPinningSpy).toHaveBeenCalled();
    });

    it('should call "setPinning" and expect SlickGrid "setOptions" be called with new frozen options and "autosizeColumns" also be called', () => {
      const mockPinning = { frozenBottom: true, frozenColumn: 1, frozenRow: 2 };
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      const setOptionsSpy = jest.spyOn(gridStub, 'setOptions');
      const autosizeColumnsSpy = jest.spyOn(gridStub, 'autosizeColumns');
      const gridOptionSetterSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'set');

      service.setPinning(mockPinning);

      expect(setOptionsSpy).toHaveBeenCalledWith(mockPinning, false, true);
      expect(gridOptionSetterSpy).toHaveBeenCalledWith(mockPinning);
      expect(autosizeColumnsSpy).toHaveBeenCalled();
    });

    it('should call "setPinning" and expect SlickGrid "setOptions" be called with new frozen options and "autosizeColumns" not being called when passing False as 2nd argument', () => {
      const mockPinning = { frozenBottom: true, frozenColumn: 1, frozenRow: 2 };
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      const setOptionsSpy = jest.spyOn(gridStub, 'setOptions');
      const autosizeColumnsSpy = jest.spyOn(gridStub, 'autosizeColumns');
      const gridOptionSetterSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'set');

      service.setPinning(mockPinning, false);

      expect(setOptionsSpy).toHaveBeenCalledWith(mockPinning, false, true);
      expect(gridOptionSetterSpy).toHaveBeenCalledWith(mockPinning);
      expect(autosizeColumnsSpy).not.toHaveBeenCalled();
    });
  });

  describe('getColumnFromEventArguments method', () => {
    it('should throw an error when slickgrid getColumns method is not available', () => {
      gridStub.getColumns = undefined as any;
      expect(() => service.getColumnFromEventArguments({} as CellArgs))
        .toThrowError('[Slickgrid-Universal] To get the column definition and data, we need to have these arguments passed as objects (row, cell, grid)');

      gridStub.getColumns = jest.fn(); // put it back as a valid mock for later tests
    });

    it('should throw an error when slickgrid getDataItem method is not available', () => {
      gridStub.getDataItem = undefined as any;
      expect(() => service.getColumnFromEventArguments({} as CellArgs))
        .toThrowError('[Slickgrid-Universal] To get the column definition and data, we need to have these arguments passed as objects (row, cell, grid)');

      gridStub.getDataItem = jest.fn(); // put it back as a valid mock for later tests
    });

    it('should return an object including all extra properties', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      const mockItem = { id: 3, user: { firstName: 'John', lastName: 'Doe' } };
      const args = { row: 3, cell: 1, grid: gridStub } as CellArgs;
      const mockOutput = { row: 3, cell: 1, columnDef: mockColumns[1], dataContext: mockItem, dataView: dataviewStub, grid: gridStub } as OnEventArgs;
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);

      const output = service.getColumnFromEventArguments(args);

      expect(output).toEqual(mockOutput);
    });
  });

  describe('getDataItemByRowNumber method', () => {
    it('should throw an error when slickgrid "getDataItem" method is not available', () => {
      gridStub.getDataItem = undefined as any;
      expect(() => service.getDataItemByRowNumber(0)).toThrowError(`We could not find SlickGrid Grid object or it's "getDataItem" method`);
      gridStub.getDataItem = jest.fn(); // put it back as a valid mock for later tests
    });

    it('should call the grid "getDataItem" method and return that output', () => {
      const rowNumber = 2;
      const mockItem = { id: 3, user: { firstName: 'John', lastName: 'Doe' } };
      const spy = jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);

      const output = service.getDataItemByRowNumber(rowNumber);

      expect(spy).toHaveBeenCalledWith(rowNumber);
      expect(output).toEqual(mockItem);
    });
  });

  describe('getDataItemByRowIndex method', () => {
    afterEach(() => {
      gridStub.getDataItem = jest.fn(); // put it back as a valid mock for later tests
    });

    it('should throw an error when the grid "getDataItem" method is not available', () => {
      gridStub.getDataItem = undefined as any;
      expect(() => service.getDataItemByRowIndex(0))
        .toThrowError('[Slickgrid-Universal] We could not find SlickGrid Grid object and/or "getDataItem" method');
    });

    it('should return data item object when method is called', () => {
      const mockColumn = { id: 'field2', field: 'field2', width: 150, rowClass: 'red' } as Column;
      const spy = jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockColumn);

      const output = service.getDataItemByRowIndex(0);

      expect(spy).toHaveBeenCalled();
      expect(output).toEqual(mockColumn);
    });
  });

  describe('getDataItemByRowIndexes method', () => {
    afterEach(() => {
      gridStub.getDataItem = jest.fn(); // put it back as a valid mock for later tests
    });

    it('should throw an error when the grid "getDataItem" method is not available', () => {
      gridStub.getDataItem = undefined as any;
      expect(() => service.getDataItemByRowIndexes([0]))
        .toThrowError('[Slickgrid-Universal] We could not find SlickGrid Grid object and/or "getDataItem" method');
    });

    it('should return data item object when method is called', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      const spy = jest.spyOn(gridStub, 'getDataItem').mockReturnValueOnce(mockColumns[0]).mockReturnValueOnce(mockColumns[2]);

      const output = service.getDataItemByRowIndexes([0, 2]);

      expect(spy).toHaveBeenCalled();
      expect(output).toEqual([{ id: 'field1', width: 100 }, { id: 'field3', field: 'field3' }]);
    });
  });

  describe('getSelectedRows method', () => {
    afterEach(() => {
      gridStub.getSelectedRows = jest.fn(); // put it back as a valid mock for later tests
    });

    it('should throw an error when the grid "getSelectedRows" method is not available', () => {
      gridStub.getSelectedRows = undefined as any;
      expect(() => service.getSelectedRows())
        .toThrowError('[Slickgrid-Universal] We could not find SlickGrid Grid object and/or "getSelectedRows" method');
    });

    it('should return selected row indexes', () => {
      const spy = jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([0, 1]);
      const output = service.getSelectedRows();

      expect(spy).toHaveBeenCalled();
      expect(output).toEqual([0, 1]);
    });
  });

  describe('getSelectedRowsDataItem method', () => {
    afterEach(() => {
      gridStub.getSelectedRows = jest.fn(); // put it back as a valid mock for later tests
    });

    it('should throw an error when the grid "getSelectedRows" method is not available', () => {
      gridStub.getSelectedRows = undefined as any;
      expect(() => service.getSelectedRowsDataItem())
        .toThrowError('[Slickgrid-Universal] We could not find SlickGrid Grid object and/or "getSelectedRows" method');
    });

    it('should return selected row indexes', () => {
      const mockSelectedColumns = [{ id: 'field1', width: 100 }, { id: 'field3', field: 'field3' }] as Column[];
      const gridSpy = jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([0, 2]);
      const serviceSpy = jest.spyOn(service, 'getDataItemByRowIndexes').mockReturnValue(mockSelectedColumns);

      const output = service.getSelectedRowsDataItem();

      expect(gridSpy).toHaveBeenCalled();
      expect(serviceSpy).toHaveBeenCalled();
      expect(output).toEqual(mockSelectedColumns);
    });
  });

  describe('hideColumnById method', () => {
    it('should return -1 when the column id is not found in the list of loaded column definitions', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);

      const output = service.hideColumnById('xyz');

      expect(output).toBe(-1);
    });

    it('should set new columns minus the column to hide and it should keep new set as the new "visibleColumns"', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      const mockWithoutColumns = [{ id: 'field1', width: 100 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const setVisibleSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
      const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
      const setColsSpy = jest.spyOn(gridStub, 'setColumns');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const output = service.hideColumnById('field2');

      expect(output).toBe(1);
      expect(autoSizeSpy).toHaveBeenCalled();
      expect(setVisibleSpy).toHaveBeenCalledWith(mockWithoutColumns);
      expect(setColsSpy).toHaveBeenCalledWith(mockWithoutColumns);
      expect(pubSubSpy).toHaveBeenCalledWith('onHeaderMenuHideColumns', { columns: mockWithoutColumns });
    });

    it('should set new columns minus the column to hide but without triggering an event when set to False', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      const mockWithoutColumns = [{ id: 'field1', width: 100 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const setVisibleSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
      const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
      const setColsSpy = jest.spyOn(gridStub, 'setColumns');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.hideColumnById('field2', { triggerEvent: false });

      expect(autoSizeSpy).toHaveBeenCalled();
      expect(setVisibleSpy).toHaveBeenCalledWith(mockWithoutColumns);
      expect(setColsSpy).toHaveBeenCalledWith(mockWithoutColumns);
      expect(pubSubSpy).not.toHaveBeenCalled();
    });

    it('should set new columns minus the column to hide but without resize the columns when "autoResizeColumns" is set to False', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      const mockWithoutColumns = [{ id: 'field1', width: 100 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const setVisibleSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
      const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
      const setColsSpy = jest.spyOn(gridStub, 'setColumns');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.hideColumnById('field2', { autoResizeColumns: false });

      expect(autoSizeSpy).not.toHaveBeenCalled();
      expect(setVisibleSpy).toHaveBeenCalledWith(mockWithoutColumns);
      expect(setColsSpy).toHaveBeenCalledWith(mockWithoutColumns);
      expect(pubSubSpy).toHaveBeenCalled();
    });

    it('should set new columns minus the column to hide AND also hide the column from the column picker when "hideFromColumnPicker" is set to False', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      const mockWithoutColumns = [{ id: 'field1', width: 100 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const setVisibleSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);
      const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
      const setColsSpy = jest.spyOn(gridStub, 'setColumns');

      service.hideColumnById('field2', { hideFromColumnPicker: true });

      expect(autoSizeSpy).toHaveBeenCalled();
      expect(setVisibleSpy).toHaveBeenCalledWith(mockWithoutColumns);
      expect(mockColumns).toEqual([{ id: 'field1', width: 100 }, { id: 'field2', width: 150, excludeFromColumnPicker: true }, { id: 'field3', field: 'field3' }]);
      expect(setColsSpy).toHaveBeenCalledWith(mockWithoutColumns);
    });

    it('should set new columns minus the column to hide AND also hide the column from the column picker when "hideFromColumnPicker" is set to False', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      const mockWithoutColumns = [{ id: 'field1', width: 100 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const setVisibleSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);
      const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
      const setColsSpy = jest.spyOn(gridStub, 'setColumns');

      service.hideColumnById('field2', { autoResizeColumns: false, hideFromGridMenu: true });

      expect(autoSizeSpy).not.toHaveBeenCalled();
      expect(setVisibleSpy).toHaveBeenCalledWith(mockWithoutColumns);
      expect(mockColumns).toEqual([{ id: 'field1', width: 100 }, { id: 'field2', width: 150, excludeFromGridMenu: true }, { id: 'field3', field: 'field3' }]);
      expect(setColsSpy).toHaveBeenCalledWith(mockWithoutColumns);
    });
  });

  describe('hideColumnByIds method', () => {
    it('should loop through the Ids provided and call hideColumnById on each of them with same options', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const hideByIdSpy = jest.spyOn(service, 'hideColumnById');

      service.hideColumnByIds(['field2', 'field3']);

      expect(hideByIdSpy).toHaveBeenCalledTimes(2);
      expect(hideByIdSpy).toHaveBeenNthCalledWith(1, 'field2', { autoResizeColumns: false, hideFromColumnPicker: false, hideFromGridMenu: false, triggerEvent: false });
      expect(hideByIdSpy).toHaveBeenNthCalledWith(2, 'field3', { autoResizeColumns: false, hideFromColumnPicker: false, hideFromGridMenu: false, triggerEvent: false });
      expect(autoSizeSpy).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalledWith('onHeaderMenuHideColumns', { columns: expect.toBeArray() });
    });

    it('should loop through the Ids provided and call hideColumnById on each of them with same options BUT not auto size columns neither trigger when both are disabled', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const hideByIdSpy = jest.spyOn(service, 'hideColumnById');

      service.hideColumnByIds(['field2', 'field3'], { autoResizeColumns: false, triggerEvent: false });

      expect(hideByIdSpy).toHaveBeenCalledTimes(2);
      expect(hideByIdSpy).toHaveBeenNthCalledWith(1, 'field2', { autoResizeColumns: false, hideFromColumnPicker: false, hideFromGridMenu: false, triggerEvent: false });
      expect(hideByIdSpy).toHaveBeenNthCalledWith(2, 'field3', { autoResizeColumns: false, hideFromColumnPicker: false, hideFromGridMenu: false, triggerEvent: false });
      expect(autoSizeSpy).not.toHaveBeenCalled();
      expect(pubSubSpy).not.toHaveBeenCalled();
    });

    it('should loop through the Ids provided and call hideColumnById on each of them with same options and hide from column picker when "hideFromColumnPicker" is enabled', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const hideByIdSpy = jest.spyOn(service, 'hideColumnById');

      service.hideColumnByIds(['field2', 'field3'], { hideFromColumnPicker: true });

      expect(hideByIdSpy).toHaveBeenCalledTimes(2);
      expect(hideByIdSpy).toHaveBeenNthCalledWith(1, 'field2', { autoResizeColumns: false, hideFromColumnPicker: true, hideFromGridMenu: false, triggerEvent: false });
      expect(hideByIdSpy).toHaveBeenNthCalledWith(2, 'field3', { autoResizeColumns: false, hideFromColumnPicker: true, hideFromGridMenu: false, triggerEvent: false });
    });

    it('should loop through the Ids provided and call hideColumnById on each of them with same options and hide from column picker when "hideFromColumnPicker" is enabled', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const hideByIdSpy = jest.spyOn(service, 'hideColumnById');

      service.hideColumnByIds(['field2', 'field3'], { hideFromGridMenu: true });

      expect(hideByIdSpy).toHaveBeenCalledTimes(2);
      expect(hideByIdSpy).toHaveBeenNthCalledWith(1, 'field2', { autoResizeColumns: false, hideFromColumnPicker: false, hideFromGridMenu: true, triggerEvent: false });
      expect(hideByIdSpy).toHaveBeenNthCalledWith(2, 'field3', { autoResizeColumns: false, hideFromColumnPicker: false, hideFromGridMenu: true, triggerEvent: false });
    });
  });

  describe('setSelectedRow method', () => {
    it('should select the row with index provided', () => {
      const spy = jest.spyOn(gridStub, 'setSelectedRows');
      service.setSelectedRow(2);
      expect(spy).toHaveBeenCalledWith([2]);
    });
  });

  describe('setSelectedRows method', () => {
    it('should select the row with index provided', () => {
      const spy = jest.spyOn(gridStub, 'setSelectedRows');
      service.setSelectedRows([0, 2, 5]);
      expect(spy).toHaveBeenCalledWith([0, 2, 5]);
    });
  });

  describe('renderGrid method', () => {
    it('should invalidate the grid and call render after', () => {
      const invalidateSpy = jest.spyOn(gridStub, 'invalidate');

      service.renderGrid();

      expect(invalidateSpy).toHaveBeenCalled();
      expect(gridStub.invalidate).toHaveBeenCalled();
    });
  });

  describe('resetGrid method', () => {
    it('should call a reset and expect a few grid methods to be called', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableAutoSizeColumns: true } as GridOption);
      const allColumnSpy = jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);
      const setColSpy = jest.spyOn(gridStub, 'setColumns');
      const autosizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
      const gridStateSpy = jest.spyOn(gridStateServiceStub, 'resetColumns');
      const filterSpy = jest.spyOn(filterServiceStub, 'clearFilters');
      const sortSpy = jest.spyOn(sortServiceStub, 'clearSorting');
      const clearPinningSpy = jest.spyOn(service, 'clearPinning');

      service.resetGrid();

      expect(allColumnSpy).toHaveBeenCalled();
      expect(setColSpy).toHaveBeenCalledTimes(1);
      expect(autosizeSpy).toHaveBeenCalled();
      expect(gridStateSpy).toHaveBeenCalled();
      expect(filterSpy).toHaveBeenCalled();
      expect(sortSpy).toHaveBeenCalled();
      expect(clearPinningSpy).toHaveBeenCalledWith(false);
    });

    it('should call a reset and expect the grid "resetColumns" method to be called with the column definitions provided to the method', () => {
      const mockColumns = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableAutoResize: true, enableAutoSizeColumns: true } as GridOption);
      const allColumnSpy = jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);
      const setColSpy = jest.spyOn(gridStub, 'setColumns');
      const gridStateSpy = jest.spyOn(gridStateServiceStub, 'resetColumns');
      const clearPinningSpy = jest.spyOn(service, 'clearPinning');
      const filterSpy = jest.spyOn(filterServiceStub, 'clearFilters');
      const sortSpy = jest.spyOn(sortServiceStub, 'clearSorting');

      service.resetGrid(mockColumns);

      expect(setColSpy).toHaveBeenCalledTimes(1);
      expect(allColumnSpy).toHaveBeenCalled();
      expect(gridStateSpy).toHaveBeenCalledWith(mockColumns);
      expect(clearPinningSpy).toHaveBeenCalledWith(false);
      expect(filterSpy).toHaveBeenCalled();
      expect(sortSpy).toHaveBeenCalled();
    });
  });
});
