import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SharedService } from '../shared.service';
import type { Column, CurrentPagination, GridOption } from '../../interfaces/index';
import { ExcelExportService } from '../excelExport.service';
import type { SlickDataView, SlickGrid } from '../../core';
import type { SlickGroupItemMetadataProvider } from '../../extensions';

const dataviewStub = {
  onRowCountChanged: vi.fn(),
  onRowsChanged: vi.fn(),
} as unknown as SlickDataView;

const gridStub = {
  autosizeColumns: vi.fn(),
  getColumnIndex: vi.fn(),
  getOptions: vi.fn(),
  getColumns: vi.fn(),
  setColumns: vi.fn(),
  onColumnsReordered: vi.fn(),
  onColumnsResized: vi.fn(),
  registerPlugin: vi.fn(),
} as unknown as SlickGrid;

describe('Shared Service', () => {
  let mockColumns: Column[];
  let mockHierarchicalDataset: any[];
  let mockGridOptions: GridOption;
  let service: SharedService;

  beforeEach(() => {
    mockColumns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
    mockHierarchicalDataset = [{
      id: 11, file: 'Music', files: [{
        id: 12, file: 'mp3', files: [
          { id: 16, file: 'rock', files: [{ id: 17, file: 'soft.mp3', dateModified: '2015-05-13T13:50:00Z', size: 98, }] },
          { id: 14, file: 'pop', files: [{ id: 15, file: 'theme.mp3', dateModified: '2015-03-01T17:05:00Z', size: 85, }] },
        ]
      }]
    }];
    mockGridOptions = { enableAutoResize: true };
    service = new SharedService();
  });

  it('should call "allColumns" GETTER and return all columns', () => {
    const spy = vi.spyOn(service, 'allColumns', 'get').mockReturnValue(mockColumns);

    const columns = service.allColumns;

    expect(spy).toHaveBeenCalled();
    expect(columns).toEqual(mockColumns);
  });

  it('should call "allColumns" SETTER and expect GETTER to return the same', () => {
    const getSpy = vi.spyOn(service, 'allColumns', 'get');
    const setSpy = vi.spyOn(service, 'allColumns', 'set');

    service.allColumns = mockColumns;
    const columns = service.allColumns;

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
    expect(columns).toEqual(mockColumns);
  });

  it('should call "columnDefinitions" GETTER and expect column definitions array to be empty when Grid object does not exist', () => {
    const columns = service.columnDefinitions;
    expect(columns).toEqual([]);
  });

  it('should call "columnDefinitions" GETTER and expect columns array returned', () => {
    const columnSpy = vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);

    service.slickGrid = gridStub;
    const columns = service.columnDefinitions;

    expect(columnSpy).toHaveBeenCalled();
    expect(columns).toEqual(mockColumns);
  });

  it('should call "currentPagination" GETTER and return the currentPagination object', () => {
    const expectedResult = { pageNumber: 2, pageSize: 10 } as CurrentPagination;
    const spy = vi.spyOn(service, 'currentPagination', 'get').mockReturnValue(expectedResult);

    const output = service.currentPagination;

    expect(spy).toHaveBeenCalled();
    expect(output).toEqual(expectedResult);
  });

  it('should call "currentPagination" SETTER and expect GETTER to return the same', () => {
    const expectedResult = { pageNumber: 2, pageSize: 10 } as CurrentPagination;
    const getSpy = vi.spyOn(service, 'currentPagination', 'get');
    const setSpy = vi.spyOn(service, 'currentPagination', 'set');

    service.currentPagination = expectedResult;
    const output = service.currentPagination;

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
    expect(output).toEqual(expectedResult);
  });

  it('should call "dataView" GETTER and return a dataView', () => {
    const spy = vi.spyOn(service, 'dataView', 'get').mockReturnValue(dataviewStub);

    const ouput = service.dataView;

    expect(spy).toHaveBeenCalled();
    expect(ouput).toEqual(dataviewStub);
  });

  it('should call "dataView" SETTER and expect GETTER to return the same', () => {
    const getSpy = vi.spyOn(service, 'dataView', 'get');
    const setSpy = vi.spyOn(service, 'dataView', 'set');

    service.dataView = dataviewStub;
    const output = service.dataView;

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
    expect(output).toEqual(dataviewStub);
  });

  it('should call "grid" GETTER and return the grid object', () => {
    const spy = vi.spyOn(service, 'slickGrid', 'get').mockReturnValue(gridStub);

    const output = service.slickGrid;

    expect(spy).toHaveBeenCalled();
    expect(output).toEqual(gridStub);
  });

  it('should call "grid" SETTER and expect GETTER to return the same', () => {
    const getSpy = vi.spyOn(service, 'slickGrid', 'get');
    const setSpy = vi.spyOn(service, 'slickGrid', 'set');

    service.slickGrid = gridStub;
    const output = service.slickGrid;

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
    expect(output).toEqual(gridStub);
  });

  it('should call "gridOptions" GETTER and expect options to return empty object when Grid object does not exist', () => {
    const options = service.gridOptions;
    expect(options).toEqual({});
  });

  it('should call "gridOptions" GETTER and return all options', () => {
    const spy = vi.spyOn(service, 'gridOptions', 'get').mockReturnValue(mockGridOptions);

    const options = service.gridOptions;

    expect(spy).toHaveBeenCalled();
    expect(options).toEqual(mockGridOptions);
  });

  it('should call "gridOptions" GETTER and expect options array returned', () => {
    const spy = vi.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);

    service.slickGrid = gridStub;
    const options = service.gridOptions;

    expect(spy).toHaveBeenCalled();
    expect(options).toEqual(mockGridOptions);
  });

  it('should call "gridOptions" SETTER and expect options array returned', () => {
    const getSpy = vi.spyOn(service, 'gridOptions', 'get');
    const setSpy = vi.spyOn(service, 'gridOptions', 'set');

    service.gridOptions = mockGridOptions;
    const output = service.gridOptions;

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
    expect(output).toEqual(mockGridOptions);
  });

  it('should call "groupItemMetadataProvider" GETTER and return metadata', () => {
    const spy = vi.spyOn(service, 'groupItemMetadataProvider', 'get').mockReturnValue(mockColumns as unknown as SlickGroupItemMetadataProvider);

    const output = service.groupItemMetadataProvider;

    expect(spy).toHaveBeenCalled();
    expect(output).toEqual(mockColumns);
  });

  it('should call "groupItemMetadataProvider" SETTER and expect GETTER to return the same', () => {
    const getSpy = vi.spyOn(service, 'groupItemMetadataProvider', 'get');
    const setSpy = vi.spyOn(service, 'groupItemMetadataProvider', 'set');

    service.groupItemMetadataProvider = mockColumns as unknown as SlickGroupItemMetadataProvider;
    const output = service.groupItemMetadataProvider;

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
    expect(output).toEqual(mockColumns);
  });

  it('should call "frozenVisibleColumnId" GETTER and expect a boolean value to be returned', () => {
    const columnId = service.frozenVisibleColumnId;
    expect(columnId).toEqual(undefined);
  });

  it('should call "frozenVisibleColumnId" GETTER and SETTER expect same value to be returned', () => {
    service.frozenVisibleColumnId = 'field1';
    expect(service.frozenVisibleColumnId).toEqual('field1');
  });

  it('should call "gridContainerElement" GETTER and SETTER expect same value to be returned', () => {
    const divMock = document.createElement('div');
    divMock.className = 'some-class';
    service.gridContainerElement = divMock;
    expect(service.gridContainerElement).toEqual(divMock);
  });

  it('should call "hasColumnsReordered" GETTER and expect a boolean value to be returned', () => {
    const flag = service.hasColumnsReordered;
    expect(flag).toEqual(false);
  });

  it('should call "hasColumnsReordered" GETTER and SETTER expect same value to be returned', () => {
    service.hasColumnsReordered = true;
    expect(service.hasColumnsReordered).toEqual(true);
  });

  it('should call "visibleColumns" GETTER and return all columns', () => {
    const spy = vi.spyOn(service, 'visibleColumns', 'get').mockReturnValue(mockColumns);

    const columns = service.visibleColumns;

    expect(spy).toHaveBeenCalled();
    expect(columns).toEqual(mockColumns);
  });

  it('should call "visibleColumns" SETTER and expect GETTER to return the same', () => {
    const getSpy = vi.spyOn(service, 'visibleColumns', 'get');
    const setSpy = vi.spyOn(service, 'visibleColumns', 'set');

    service.visibleColumns = mockColumns;
    const columns = service.visibleColumns;

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
    expect(columns).toEqual(mockColumns);
  });

  it('should call "hierarchicalDataset" GETTER and return a hierarchical dataset', () => {
    const spy = vi.spyOn(service, 'hierarchicalDataset', 'get').mockReturnValue(mockHierarchicalDataset);

    const columns = service.hierarchicalDataset;

    expect(spy).toHaveBeenCalled();
    expect(columns).toEqual(mockHierarchicalDataset);
  });

  it('should call "hierarchicalDataset" SETTER and expect GETTER to return the same', () => {
    const getSpy = vi.spyOn(service, 'hierarchicalDataset', 'get');
    const setSpy = vi.spyOn(service, 'hierarchicalDataset', 'set');

    service.hierarchicalDataset = mockHierarchicalDataset;
    const columns = service.hierarchicalDataset;

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
    expect(columns).toEqual(mockHierarchicalDataset);
  });

  it('should call "hideHeaderRowAfterPageLoad" GETTER and expect a boolean value to be returned', () => {
    const flag = service.hideHeaderRowAfterPageLoad;
    expect(flag).toEqual(false);
  });

  it('should call "hideHeaderRowAfterPageLoad" GETTER and SETTER expect same value to be returned', () => {
    service.hideHeaderRowAfterPageLoad = true;
    expect(service.hideHeaderRowAfterPageLoad).toEqual(true);
  });

  it('should call "externalRegisteredResources" GETTER and return all columns', () => {
    // @ts-ignore:2511
    const mockRegisteredResources = [new ExcelExportService()];
    const spy = vi.spyOn(service, 'externalRegisteredResources', 'get').mockReturnValue(mockRegisteredResources);

    const columns = service.externalRegisteredResources;

    expect(spy).toHaveBeenCalled();
    expect(columns).toEqual(mockRegisteredResources);
  });

  it('should call "externalRegisteredResources" SETTER and expect GETTER to return the same', () => {
    // @ts-ignore:2511
    const mockRegisteredResources = [new ExcelExportService()];
    const getSpy = vi.spyOn(service, 'externalRegisteredResources', 'get');
    const setSpy = vi.spyOn(service, 'externalRegisteredResources', 'set');

    service.externalRegisteredResources = mockRegisteredResources;
    const columns = service.externalRegisteredResources;

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
    expect(columns).toEqual(mockRegisteredResources);
  });
});
