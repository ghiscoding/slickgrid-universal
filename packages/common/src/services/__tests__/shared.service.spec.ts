import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SharedService } from '../shared.service.js';
import type { Column, GridOption } from '../../interfaces/index.js';
import { ExcelExportService } from '../excelExport.service.js';
import type { SlickGrid } from '../../core/slickGrid.js';

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
