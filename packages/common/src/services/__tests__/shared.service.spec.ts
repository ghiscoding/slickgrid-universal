import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SlickGrid } from '../../core/slickGrid.js';
import type { Column, GridOption } from '../../interfaces/index.js';
import { ExcelExportService } from '../excelExport.service.js';
import { SharedService } from '../shared.service.js';

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
    mockColumns = [
      { id: 'field1', field: 'field1', width: 100 },
      { id: 'field2', field: 'field2', width: 100 },
    ];
    mockHierarchicalDataset = [
      {
        id: 11,
        file: 'Music',
        files: [
          {
            id: 12,
            file: 'mp3',
            files: [
              { id: 16, file: 'rock', files: [{ id: 17, file: 'soft.mp3', dateModified: '2015-05-13T13:50:00Z', size: 98 }] },
              { id: 14, file: 'pop', files: [{ id: 15, file: 'theme.mp3', dateModified: '2015-03-01T17:05:00Z', size: 85 }] },
            ],
          },
        ],
      },
    ];
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

  it('should call "columns" GETTER and expect column definitions array to be empty when Grid object does not exist', () => {
    const columns = service.columns;
    expect(columns).toEqual([]);
  });

  it('should call "columns" GETTER and expect columns array returned', () => {
    const columnSpy = vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);

    service.slickGrid = gridStub;
    const columns = service.columns;

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

  describe('getHierarchicalItemById method', () => {
    it('should return undefined when there is no hierarchical dataset', () => {
      expect(service.getHierarchicalItemById(11)).toBeUndefined();
    });

    it('should find nested items by id using custom id & children prop names', () => {
      service.gridOptions = { datasetIdPropertyName: 'id', treeDataOptions: { columnId: 'file', childrenPropName: 'files' } };
      service.hierarchicalDataset = mockHierarchicalDataset;

      expect(service.getHierarchicalItemById(11)).toBe(mockHierarchicalDataset[0]);
      expect(service.getHierarchicalItemById(17)).toBe(mockHierarchicalDataset[0].files[0].files[0].files[0]);
    });

    it('should reuse the index and only rebuild it when an id is missing (e.g. lazily loaded children)', () => {
      service.gridOptions = { treeDataOptions: { columnId: 'file', childrenPropName: 'files' } };
      service.hierarchicalDataset = mockHierarchicalDataset;
      const indexSpy = vi.spyOn(service as any, 'indexHierarchicalItems');

      service.getHierarchicalItemById(11);
      service.getHierarchicalItemById(17);
      expect(indexSpy).toHaveBeenCalledTimes(1);

      const lazyChild = { id: 99, file: 'lazy.txt' };
      mockHierarchicalDataset[0].files.push(lazyChild);
      expect(service.getHierarchicalItemById(99)).toBe(lazyChild);
      expect(indexSpy).toHaveBeenCalledTimes(2);
    });

    it('should rebuild the index when the hierarchical dataset is replaced', () => {
      service.hierarchicalDataset = [{ id: 1, file: 'old' }];
      expect(service.getHierarchicalItemById(1).file).toBe('old');

      const newItem = { id: 1, file: 'new' };
      service.hierarchicalDataset = [newItem];
      expect(service.getHierarchicalItemById(1)).toBe(newItem);
    });

    it('should keep the first item found when ids are duplicated and skip empty items', () => {
      const firstItem = { id: 1, children: [{ id: 1, file: 'duplicate' }] };
      service.hierarchicalDataset = [null, firstItem];

      expect(service.getHierarchicalItemById(1)).toBe(firstItem);
    });
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
