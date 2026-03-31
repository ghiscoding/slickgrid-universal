import {
  type BackendService,
  type Column,
  type ColumnFilter,
  type ColumnFilters,
  type ColumnSort,
  type CurrentFilter,
  type CurrentSorter,
  type FilterChangedArgs,
  type GridOption,
  type MultiColumnSort,
  type Pagination,
  type SlickGrid,
} from '@slickgrid-universal/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlServiceOption } from '../../interfaces/sqlServiceOption.interface.js';
import { SqlService } from './../sql.service.js';

function removeSpaces(text: string) {
  // Replace multiple spaces with a single space, trim leading/trailing
  return `${text}`.replace(/\s+/g, ' ').trim();
}

let gridOptionMock: GridOption;

const gridStub = {
  autosizeColumns: vi.fn(),
  getColumnIndex: vi.fn(),
  getScrollbarDimensions: vi.fn(),
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  setColumns: vi.fn(),
  registerPlugin: vi.fn(),
  setSelectedRows: vi.fn(),
  setSortColumns: vi.fn(),
  scrollTo: vi.fn(),
} as unknown as SlickGrid;

describe('SqlService', () => {
  let mockColumns: Column[];
  let service: SqlService;
  let paginationOptions: Pagination;
  let serviceOptions: SqlServiceOption;

  beforeEach(() => {
    mockColumns = [
      { id: 'field1', field: 'field1', width: 100 },
      { id: 'field2', field: 'field2', width: 100 },
    ];
    service = new SqlService();
    serviceOptions = {
      tableName: 'users',
    };
    paginationOptions = {
      pageNumber: 1,
      pageSizes: [5, 10, 25, 50, 100],
      pageSize: 10,
      totalItems: 100,
    };
    gridOptionMock = {
      enablePagination: true,
      defaultFilterRangeOperator: 'RangeInclusive',
      backendServiceApi: {
        service: service as unknown as BackendService,
        options: { datasetName: '' },
        preProcess: vi.fn(),
        process: vi.fn(),
        postProcess: vi.fn(),
      },
    } as unknown as GridOption;
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  describe('init method', () => {
    it('should initialize the service and expect the service options and pagination to be set', () => {
      service.init(serviceOptions, paginationOptions, gridStub);
      expect(service.options).toEqual(serviceOptions);
      expect(service.getCurrentPagination()).toEqual({
        pageNumber: 1,
        pageSize: 10,
      });
    });

    it('should get the column definitions from "getColumns"', () => {
      const columns = [
        { id: 'field4', field: 'field4', width: 50 },
        { id: 'field2', field: 'field2', width: 50 },
      ];
      const spy = vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ tableName: 'users' }, paginationOptions, gridStub);

      expect(spy).toHaveBeenCalled();
      expect(service['_columns']).toEqual(columns);
    });
  });

  describe('buildQuery method', () => {
    beforeEach(() => {
      vi.resetAllMocks();
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    });

    it('should throw an error when no service options exists after service init', () => {
      service.init(undefined as any);
      expect(() => service.buildQuery()).toThrow();
    });

    it('should throw an error when no tableName is provided in the service options after service init', () => {
      service.init({ tableName: undefined as any });
      expect(() => service.buildQuery()).toThrow('SQL Service requires the "tableName" property and columns to properly build the SQL query');
    });

    it('should throw an error when no column definitions is provided in the service options after service init', () => {
      service.init({ tableName: 'users' });
      expect(() => service.buildQuery()).toThrow();
    });

    it('should return a simple SQL query with pagination set and includes all fields', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 10 OFFSET 0`;
      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a SQL query with SELECT * when all columns are included', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(query.startsWith('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users"')).toBe(true);
    });

    it('should exclude a column and expect a query string without it', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100, excludeFromQuery: true },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(query).toContain('field1');
      expect(query).not.toContain('field2');
    });

    it('should use "columnDefinitions" from the "serviceOptions" when private member is undefined and then return a simple query as usual', () => {
      const columns = [{ id: 'field1', field: 'field1', width: 100 }];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 10 OFFSET 0'));
    });

    it('should return a simple query with pagination set and includes at least one field when the column definitions is an empty array', () => {
      const columns: Column[] = [];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 10 OFFSET 0'));
    });

    it('should exclude a column and expect a query string without it', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100, excludeFromQuery: true },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(query).toContain('field1');
      expect(query).not.toContain('field2');
    });

    it('should use default pagination when "paginationOptions" is not provided', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100, excludeFromQuery: true },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, undefined, gridStub);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT "field1", COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 20 OFFSET 0'));
    });

    it('should add extra fields from the "fields" property and expect them to be part of the query string', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100, fields: ['field3', 'field4'] },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();
      // Should include field1, field2, field3, field4
      expect(query).toContain('field1');
      expect(query).toContain('field2');
      expect(query).toContain('field3');
      expect(query).toContain('field4');
    });

    it('should exclude a column field, and expect a query string without it, but still include any fields specified', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', fields: ['field3', 'field4', 'field5'], width: 100, excludeFieldFromQuery: true },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(query).toContain('field1');
      expect(query).not.toContain('field2,'); // field2 should be excluded
      expect(query).toContain('field3');
      expect(query).toContain('field4');
      expect(query).toContain('field5');
    });

    it('should exclude pagination from the query string when the option is disabled', () => {
      gridOptionMock.enablePagination = false;
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      // For SQL, if pagination is disabled, LIMIT/OFFSET should be omitted
      const query = service.buildQuery();
      expect(query).toBe('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users"');
      gridOptionMock.enablePagination = true; // reset for other tests
    });

    it('should have a different pagination offset when it is updated before calling the buildQuery query (presets does that)', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      service.updatePagination(3, 20);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 20 OFFSET 40'));
    });

    it('should make sure the offset pagination is never below zero, even when new page is 0', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      service.updatePagination(0, 20);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 20 OFFSET 0'));
    });

    it('should make sure the offset pagination is never below zero, even when new is 1 the offset should remain 0', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      service.updatePagination(1, 20);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 20 OFFSET 0'));
    });
  });

  describe('buildQuery method (parity with GraphQL)', () => {
    beforeEach(() => {
      vi.resetAllMocks();
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    });

    it('should use "columnDefinitions" from the "serviceOptions" when private member is undefined and then return a simple query as usual', () => {
      const columns = [{ id: 'field1', field: 'field1', width: 100 }];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 10 OFFSET 0'));
    });

    it('should return a simple query with pagination set and includes at least one field when the column definitions is an empty array', () => {
      const columns: Column[] = [];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 10 OFFSET 0'));
    });

    it('should exclude a column and expect a query string without it', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100, excludeFromQuery: true },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(query).toContain('field1');
      expect(query).not.toContain('field2');
    });

    it('should use default pagination when "paginationOptions" is not provided', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100, excludeFromQuery: true },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, undefined, gridStub);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT "field1", COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 20 OFFSET 0'));
    });

    it('should add extra fields from the "fields" property and expect them to be part of the query string', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100, fields: ['field3', 'field4'] },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();
      // Should include field1, field2, field3, field4
      expect(query).toContain('field1');
      expect(query).toContain('field2');
      expect(query).toContain('field3');
      expect(query).toContain('field4');
    });

    it('should exclude a column field, and expect a query string without it, but still include any fields specified', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', fields: ['field3', 'field4', 'field5'], width: 100, excludeFieldFromQuery: true },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();
      expect(query).toContain('field1');
      expect(query).not.toContain('field2,'); // field2 should be excluded
      expect(query).toContain('field3');
      expect(query).toContain('field4');
      expect(query).toContain('field5');
    });

    it('should exclude pagination from the query string when the option is disabled', () => {
      gridOptionMock.enablePagination = false;
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      // For SQL, if pagination is disabled, LIMIT/OFFSET should be omitted
      const query = service.buildQuery();
      expect(query).toBe('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users"');
      gridOptionMock.enablePagination = true; // reset for other tests
    });

    it('should have a different pagination offset when it is updated before calling the buildQuery query (presets does that)', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      service.updatePagination(3, 20);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 20 OFFSET 40'));
    });

    it('should make sure the offset pagination is never below zero, even when new page is 0', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      service.updatePagination(0, 20);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 20 OFFSET 0'));
    });

    it('should make sure the offset pagination is never below zero, even when new is 1 the offset should remain 0', () => {
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      service.updatePagination(1, 20);
      const query = service.buildQuery();
      expect(removeSpaces(query)).toBe(removeSpaces('SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 20 OFFSET 0'));
    });
  });

  describe('clearFilters method', () => {
    it('should call "updateOptions" to clear all filters', () => {
      const spy = vi.spyOn(service, 'updateOptions');
      service.clearFilters();
      expect(spy).toHaveBeenCalledWith({ filteringOptions: [] });
    });
  });

  describe('clearSorters method', () => {
    it('should call "updateOptions" to clear all sorting', () => {
      const spy = vi.spyOn(service, 'updateOptions');
      service.clearSorters();
      expect(spy).toHaveBeenCalledWith({ sortingOptions: [] });
    });
  });

  describe('getInitPaginationOptions method', () => {
    beforeEach(() => {
      paginationOptions.pageSize = 20;
    });

    it('should return the pagination options with current pagination', () => {
      service.init({ tableName: 'users' }, paginationOptions);
      const output = service.getInitPaginationOptions();
      expect(output).toEqual({ pageSize: 20, offset: 0 });
    });

    it('should return the pagination options with default page size of 20 when paginationOptions is undefined', () => {
      service.init({ tableName: 'users' }, undefined);
      const output = service.getInitPaginationOptions();
      expect(output).toEqual({ pageSize: 20, offset: 0 });
    });

    it('should return the pagination options with correct offset for pageNumber > 1', () => {
      service.init({ tableName: 'users' }, { pageNumber: 3, pageSize: 10 } as Pagination);
      const output = service.getInitPaginationOptions();
      expect(output).toEqual({ pageSize: 10, offset: 20 });
    });
  });

  describe('getDatasetName method', () => {
    it('should return the dataset name when defined', () => {
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ datasetName: 'employees', tableName: 'users' });
      const output = service.getDatasetName();
      expect(output).toBe('employees');
    });

    it('should return empty string when dataset name is undefined', () => {
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ tableName: undefined as any });
      const output = service.getDatasetName();
      expect(output).toBe('');
    });
  });

  describe('getTableName method', () => {
    it('should return the table name when defined', () => {
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ tableName: 'users' });
      const output = service.getTableName();
      expect(output).toBe('users');
    });

    it('should return empty string when table name is undefined', () => {
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ tableName: undefined as any });
      const output = service.getTableName();
      expect(output).toBe('');
    });
  });

  describe('escapeIdentifier', () => {
    let service: SqlService;
    beforeEach(() => {
      service = new SqlService();
    });

    it('should escape identifiers with double quotes (default)', () => {
      service.init({ tableName: 'myTable' });
      expect(service['escapeIdentifier']('foo')).toBe('"foo"');
      expect(service['escapeIdentifier']('my"Table')).toBe('"my""Table"');
    });

    it('should escape identifiers with backticks', () => {
      service.init({ tableName: 'myTable', identifierEscapeStyle: 'backtick' });
      expect(service['escapeIdentifier']('foo')).toBe('`foo`');
      expect(service['escapeIdentifier']('my`Table')).toBe('`my``Table`');
    });

    it('should escape identifiers with brackets', () => {
      service.init({ tableName: 'myTable', identifierEscapeStyle: 'bracket' });
      expect(service['escapeIdentifier']('foo')).toBe('[foo]');
      expect(service['escapeIdentifier']('my]Table')).toBe('[my]]Table]');
    });

    it('should return empty string for undefined or empty identifier', () => {
      service.init({ tableName: 'myTable' });
      expect(service['escapeIdentifier']()).toBe('');
      expect(service['escapeIdentifier']('')).toBe('');
    });

    it('should escape both datasetName and tableName when both are provided', () => {
      service.init({ datasetName: 'mySchema', tableName: 'myTable' });
      // buildQuery will call escapeIdentifier for both datasetName and tableName
      // We check that the generated query contains both escaped identifiers
      // Need to provide columns to avoid error
      (service as any)._columns = [{ field: 'id' }];
      const query = service.buildQuery();
      expect(query).toContain('FROM "mySchema"."myTable"');
    });
  });

  describe('resetPaginationOptions method', () => {
    beforeEach(() => {
      paginationOptions.pageSize = 20;
    });

    it('should reset the pagination options with default pagination', () => {
      const spy = vi.spyOn(service, 'updateOptions');
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ tableName: 'users' }, paginationOptions);
      service.resetPaginationOptions();
      // SQL only resets pageNumber to 1, keeps pageSize
      expect(service.getCurrentPagination()).toEqual({ pageNumber: 1, pageSize: 20 });
      // Optionally, check updateOptions was not called with cursor args
      expect(spy).not.toHaveBeenCalledWith({ paginationOptions: { first: 20 } });
    });
  });

  describe('processOnFilterChanged method', () => {
    it('should throw an error when grid is undefined', () => {
      service.init(serviceOptions, paginationOptions, gridStub);
      expect(() => service.processOnFilterChanged(null as any, { grid: undefined } as any)).toThrow();
    });

    it('should return a query with the new filter', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" = 'female' LIMIT 10 OFFSET 0`;
      const querySpy = vi.spyOn(service, 'buildQuery');
      const resetSpy = vi.spyOn(service, 'resetPaginationOptions');
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilter = {
        columnDef: mockColumn,
        columnId: 'gender',
        operator: 'EQ',
        searchTerms: ['female'],
        targetSelector: 'div.some-classes',
      } as ColumnFilter;
      const mockFilterChangedArgs = {
        columnDef: mockColumn,
        columnId: 'gender',
        columnFilters: { gender: mockColumnFilter },
        grid: gridStub,
        operator: 'EQ',
        searchTerms: ['female'],
        shouldTriggerQuery: true,
        targetSelector: 'div.some-classes',
      } as FilterChangedArgs;

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.processOnFilterChanged(null as any, mockFilterChangedArgs);
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
      expect(resetSpy).toHaveBeenCalled();
      expect(currentFilters).toEqual([
        expect.objectContaining({
          columnId: 'gender',
          operator: 'EQ',
          searchTerms: ['female'],
          targetSelector: 'div.some-classes',
        }),
      ]);
    });
  });

  describe('processOnPaginationChanged method', () => {
    it('should return a query with the new pagination', () => {
      const expectation = 'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 20 OFFSET 40';
      const querySpy = vi.spyOn(service, 'buildQuery');

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.processOnPaginationChanged(null as any, { newPage: 3, pageSize: 20 });
      const currentPagination = service.getCurrentPagination();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
      expect(currentPagination).toEqual({ pageNumber: 3, pageSize: 20 });
    });

    it('should return a query with the new pagination and use pagination size options that was passed to service options when it is not provided as argument to "processOnPaginationChanged"', () => {
      const expectation = 'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 10 OFFSET 20';
      const querySpy = vi.spyOn(service, 'buildQuery');

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.processOnPaginationChanged(null as any, { newPage: 3 } as any);
      const currentPagination = service.getCurrentPagination();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
      expect(currentPagination).toEqual({ pageNumber: 3, pageSize: 10 });
    });

    it('should return a query with the new pagination and use default pagination size (25) when not provided as argument', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 20 OFFSET 40`;
      const querySpy = vi.spyOn(service, 'buildQuery');

      service.init(serviceOptions, undefined, gridStub);
      const query = service.processOnPaginationChanged(null as any, { newPage: 3 } as any);
      const currentPagination = service.getCurrentPagination();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
      expect(currentPagination).toEqual({ pageNumber: 3, pageSize: 20 });
    });
  });

  describe('processOnSortChanged method', () => {
    it('should return a query with the new sorting when using single sort', () => {
      const expectation = 'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" ORDER BY "gender" DESC LIMIT 10 OFFSET 0';
      const querySpy = vi.spyOn(service, 'buildQuery');
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockSortChangedArgs = { columnId: 'gender', sortCol: mockColumn, sortAsc: false, multiColumnSort: false } as ColumnSort;

      service.init({ ...serviceOptions, infiniteScroll: true }, { ...paginationOptions, pageSize: 10 }, gridStub);
      const query = service.processOnSortChanged(null as any, mockSortChangedArgs);

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
    });

    it('should return a query with the multiple new sorting when using multiColumnSort', () => {
      const expectation = 'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" ORDER BY "gender" DESC, "firstName" ASC LIMIT 10 OFFSET 0';
      const querySpy = vi.spyOn(service, 'buildQuery');
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnName = { id: 'firstName', field: 'firstName' } as Column;
      const mockColumnSort = { columnId: 'gender', sortCol: mockColumn, sortAsc: false } as ColumnSort;
      const mockColumnSortName = { columnId: 'firstName', sortCol: mockColumnName, sortAsc: true } as ColumnSort;
      const mockSortChangedArgs = { sortCols: [mockColumnSort, mockColumnSortName], multiColumnSort: true, grid: gridStub } as MultiColumnSort;

      service.init(serviceOptions, { ...paginationOptions, pageSize: 10 }, gridStub);
      const query = service.processOnSortChanged(null as any, mockSortChangedArgs);

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
    });
  });

  describe('updateFilters method', () => {
    beforeEach(() => {
      const columns = [
        { id: 'company', field: 'company' },
        { id: 'gender', field: 'gender' },
        { id: 'name', field: 'name' },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
    });

    it('should throw an error when filter columnId is not found to be part of the column definitions', () => {
      const mockCurrentFilter = { columnDef: { id: 'city', field: 'city' }, columnId: 'city', operator: 'EQ', searchTerms: ['Boston'] } as CurrentFilter;
      service.init(serviceOptions, paginationOptions, gridStub);
      expect(() => service.updateFilters([mockCurrentFilter], true)).toThrow('[SQL Service]: Something went wrong in trying to get the column definition');
    });

    it('should throw an error when neither "field" nor "name" are being part of the column definition', () => {
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: { id: 'gender' }, searchTerms: ['female'], operator: 'EQ' },
      } as unknown as ColumnFilters;
      service.init(serviceOptions, paginationOptions, gridStub);
      expect(() => service.updateFilters(mockColumnFilters, false)).toThrow('SQL filter could not find the field name to query the search');
    });

    it('should return a query with the new filter when filters are passed as a filter trigger by a filter event and is of type ColumnFilters', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" = 'female' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female'], operator: 'EQ', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without filtering when the filter "searchTerms" property is missing from the search', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, operator: 'EQ', type: 'string' },
      } as unknown as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with multiple filters when the filters object has multiple search with Equal & "<>" and they are passed as a filter trigger by a filter event and is of type ColumnFilters', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" = 'female' AND "company" NOT LIKE '%abc%' LIMIT 10 OFFSET 0`;
      const mockColumnGender = { id: 'gender', field: 'gender' } as Column;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumnGender, searchTerms: ['female'], operator: 'EQ', type: 'string' },
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: '<>', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with multiple filters when the filters object has multiple search with Equal & Not Contains and they are passed as a filter trigger by a filter event and is of type ColumnFilters', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" = 'female' AND "company" NOT LIKE '%abc%' LIMIT 10 OFFSET 0`;
      const mockColumnGender = { id: 'gender', field: 'gender' } as Column;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumnGender, searchTerms: ['female'], operator: 'EQ', type: 'string' },
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: 'Not_Contains', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with multiple filters and expect same query string result as previous test even with "isUpdatedByPreset" enabled', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" = 'female' AND "company" LIKE '%abc%' LIMIT 10 OFFSET 0`;
      const mockColumnGender = { id: 'gender', field: 'gender' } as Column;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumnGender, searchTerms: ['female'], operator: 'EQ', type: 'string' },
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: 'Contains', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, true);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with the new filter when filters are passed as a Grid Preset of type CurrentFilter', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" = 'female' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockCurrentFilter = { columnDef: mockColumn, columnId: 'gender', operator: 'EQ', searchTerms: ['female'] } as CurrentFilter;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters([mockCurrentFilter], true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual([{ columnId: 'gender', columnDef: mockColumn, operator: 'EQ', searchTerms: ['female'] }]);
    });

    it('should return a query with search having the operator StartsWith when search value has the "*" symbol as the last character', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" LIKE 'fem%' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['fem*'], type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator EndsWith when search value has the "*" symbol as the first character', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" LIKE '%le' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['*le'], type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator EndsWith when the operator was provided as "*z"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" LIKE '%le' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le*'], operator: '*z', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator StartsWith even when search value last char is "*" symbol but the operator provided is "*z"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" LIKE 'le%' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le*'], operator: 'a*', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator EndsWith when the Column Filter was provided as "*z"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" LIKE '%le' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender', filter: { operator: '*z' } } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le'], type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator EndsWith when the Column Filter was provided as EndsWith', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" LIKE '%le' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender', filter: { operator: 'EndsWith' } } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le'], type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator StartsWith when the operator was provided as "a*"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" LIKE 'le%' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le'], operator: 'a*', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator StartsWith when the operator was provided as StartsWith', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" LIKE 'le%' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le'], operator: 'StartsWith', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator StartsWith & EndsWith when search value has the "*" symbol with chars on both side of it', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "name" LIKE 'Ca%' AND "name" LIKE '%le' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'name', field: 'name' } as Column;
      const mockColumnFilters = {
        name: { columnId: 'name', columnDef: mockColumn, searchTerms: ['Ca*le'], type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator StartsWithEndsWith when the operator was provided as "a*z"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "name" LIKE 'Ca%' AND "name" LIKE '%le' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'name', field: 'name' } as Column;
      const mockColumnFilters = {
        name: { columnId: 'name', columnDef: mockColumn, searchTerms: ['Ca*le'], operator: 'a*z', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should bypass default behavior if filterQueryOverride is defined and does not return undefined', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "name" LIKE 'Ca%' AND "name" LIKE '%le' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'name', field: 'name' } as Column;
      const mockColumnFilters = {
        name: { columnId: 'name', columnDef: mockColumn, searchTerms: ['Ca*le'], operator: 'a*z', type: 'string' },
      } as ColumnFilters;

      const sOptions = { ...serviceOptions, filterQueryOverride: () => ({ field: 'foo', operator: 'EQ', value: 'bar' }) };
      service.init(sOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should continue with default behavior if filterQueryOverride returns undefined', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "name" LIKE 'Ca%' AND "name" LIKE '%le' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'name', field: 'name' } as Column;
      const mockColumnFilters = {
        name: { columnId: 'name', columnDef: mockColumn, searchTerms: ['Ca*le'], operator: 'a*z', type: 'string' },
      } as ColumnFilters;

      const sOptions = { ...serviceOptions, filterQueryOverride: () => undefined };
      service.init(sOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should continue with default behavior if filterQueryOverride is not provided', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "name" LIKE 'Ca%' AND "name" LIKE '%le' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'name', field: 'name' } as Column;
      const mockColumnFilters = {
        name: { columnId: 'name', columnDef: mockColumn, searchTerms: ['Ca*le'], operator: 'a*z', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator Greater of Equal when the search value was provided as ">=10"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "age" >= 10 LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'age', field: 'age', type: 'number' } as Column;
      const mockColumnFilters = {
        age: { columnId: 'age', columnDef: mockColumn, searchTerms: ['>=10'], type: 'number' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search NOT having the operator Greater of Equal when the search value was provided as ">=10" but "autoParseInputFilterOperator" is set to false', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "age" LIKE '%>=10%' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'age', field: 'age', autoParseInputFilterOperator: false } as Column;
      const mockColumnFilters = {
        age: { columnId: 'age', columnDef: mockColumn, searchTerms: ['>=10'], type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having a range of exclusive numbers when the search value contains 2 dots (..) to represent a range of numbers', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" >= 2 AND "duration" <= 33 LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'duration', field: 'duration', type: 'number' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumn, searchTerms: ['2..33'], type: 'number' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an inclusive range of numbers using the 2 dots (..) separator, the "RangeInclusive" operator and the range has an unbounded end', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" >= 5 LIMIT 10 OFFSET 0`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: 'number' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['5..'], operator: 'RangeInclusive', type: 'number' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an inclusive range of numbers using the 2 dots (..) separator, the "RangeInclusive" operator and the range has an unbounded begin', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" <= 5 LIMIT 10 OFFSET 0`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: 'number' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['..5'], operator: 'RangeInclusive', type: 'number' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an inclusive range of numbers using the 2 dots (..) separator, the "RangeExclusive" operator and the range has an unbounded end', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" > 5 LIMIT 10 OFFSET 0`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: 'number' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['5..'], operator: 'RangeExclusive', type: 'number' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an inclusive range of numbers using the 2 dots (..) separator, the "RangeExclusive" operator and the range has an unbounded begin', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" < 5 LIMIT 10 OFFSET 0`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: 'number' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['..5'], operator: 'RangeExclusive', type: 'number' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having a range of inclusive numbers when 2 searchTerms numbers are provided and the operator is "RangeInclusive"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" >= 2 AND "duration" <= 33 LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'duration', field: 'duration' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumn, searchTerms: [2, 33], operator: 'RangeInclusive', type: 'number' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an inclusive range of numbers using the 2 dots (..) separator, "defaultFilterRangeOperator" is not set and operator is not set to "RangeInclusive" or "RangeExclusive"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" <= 5 LIMIT 10 OFFSET 0`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: 'number' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['..5'], operator: 'Contains', type: 'number' },
      } as ColumnFilters;
      gridOptionMock.defaultFilterRangeOperator = undefined;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an exclusive range of numbers using the 2 dots (..) separator, "defaultFilterRangeOperator" is set to "rangeExclusive" and operator is not set to "RangeInclusive" or "RangeExclusive"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" < 5 LIMIT 10 OFFSET 0`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: 'number' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['..5'], operator: 'Contains', type: 'number' },
      } as ColumnFilters;
      gridOptionMock.defaultFilterRangeOperator = 'RangeExclusive';

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having a range of exclusive dates when the search value contains 2 dots (..) to represent a range of dates', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "startDate" >= '2001-01-01' AND "startDate" <= '2001-01-31' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'startDate', field: 'startDate' } as Column;
      const mockColumnFilters = {
        startDate: { columnId: 'startDate', columnDef: mockColumn, searchTerms: ['2001-01-01..2001-01-31'], type: 'dateIso' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having a range of inclusive dates when 2 searchTerms dates are provided and the operator is "RangeInclusive"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "startDate" >= '2001-01-01' AND "startDate" <= '2001-01-31' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'startDate', field: 'startDate' } as Column;
      const mockColumnFilters = {
        startDate: {
          columnId: 'startDate',
          columnDef: mockColumn,
          searchTerms: ['2001-01-01', '2001-01-31'],
          operator: 'RangeInclusive',
          type: 'dateIso',
        },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with a date equal when only 1 searchTerms is provided and even if the operator is set to a range', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "company" LIKE '%abc%' AND "updatedDate" = '2001-01-20' LIMIT 10 OFFSET 0`;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnUpdated = { id: 'updatedDate', field: 'updatedDate', type: 'date' } as Column;
      const mockColumnFilters = {
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: 'Contains', type: 'string' },
        updatedDate: {
          columnId: 'updatedDate',
          columnDef: mockColumnUpdated,
          searchTerms: ['2001-01-20'],
          operator: 'RangeExclusive',
          type: 'dateIso',
        },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with a date operator when only 1 searchTerms', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "company" LIKE '%abc%' AND "updatedDate" >= '2001-01-20' LIMIT 10 OFFSET 0`;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnUpdated = { id: 'updatedDate', field: 'updatedDate', type: 'date' } as Column;
      const mockColumnFilters = {
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: 'Contains', type: 'string' },
        updatedDate: { columnId: 'updatedDate', columnDef: mockColumnUpdated, searchTerms: ['2001-01-20'], operator: '>=', type: 'dateIso' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without any date filtering when searchTerms is an empty array', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "company" LIKE '%abc%' LIMIT 10 OFFSET 0`;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnUpdated = { id: 'updatedDate', field: 'updatedDate', type: 'date' } as Column;
      const mockColumnFilters = {
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: 'Contains', type: 'string' },
        updatedDate: { columnId: 'updatedDate', columnDef: mockColumnUpdated, searchTerms: [], operator: 'RangeExclusive', type: 'dateIso' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with a CSV string when the filter operator is IN ', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" IN ('female','male') LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female', 'male'], operator: 'IN', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with a CSV string when the filter operator is NOT_IN', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" NOT IN ('female','male') LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female', 'male'], operator: 'NOT_IN', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with a CSV string and use the operator from the Column Definition Operator when provided', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" NOT IN ('female','male') LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender', filter: { operator: 'NOT_IN' } } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female', 'male'], type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with mapped operator when no operator was provided but we have a column "type" property', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" LIKE '%le%' AND "age" = 28 LIMIT 10 OFFSET 0`;
      const mockColumnGender = { id: 'gender', field: 'gender', type: 'string' } as Column;
      const mockColumnAge = { id: 'age', field: 'age', type: 'number' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumnGender, searchTerms: ['le'], type: 'string' },
        age: { columnId: 'age', columnDef: mockColumnAge, searchTerms: [28], type: 'number' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with mapped operator when neither operator nor column "type" property exists', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" LIKE '%le%' AND "city" LIKE '%Bali%' LIMIT 10 OFFSET 0`;
      const mockColumnGender = { id: 'gender', field: 'gender' } as Column;
      const mockColumnCity = { id: 'city', field: 'city' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumnGender, searchTerms: ['le'], type: 'string' },
        city: { columnId: 'city', columnDef: mockColumnCity, searchTerms: ['Bali'], type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with the new filter search value of empty string when searchTerms has an undefined value', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" = '' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: [undefined as any], operator: 'EQ', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query using a different field to query when the column has a "queryField" defined in its definition', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "isMale" = 'true' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender', queryField: 'isMale' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: [true], operator: 'EQ', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query using a different field to query when the column has a "queryFieldFilter" defined in its definition', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "hasPriority" = 'female' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender', queryField: 'isAfter', queryFieldFilter: 'hasPriority' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female'], operator: 'EQ', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query using column name that is an HTML Element', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "Gender" = 'female' LIMIT 10 OFFSET 0`;
      const nameElm = document.createElement('div');
      nameElm.innerHTML = `<span class="text-red">Gender</span>`;
      const mockColumn = { id: 'gender', name: nameElm } as unknown as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female'], operator: 'EQ', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query using the column "name" property when "field" is not defined in its definition', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" = 'female' LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', name: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female'], operator: 'EQ', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without any sorting after clearFilters was called', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 10 OFFSET 0`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female'], operator: 'EQ', type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      service.clearFilters();
      const currentFilters = service.getCurrentFilters();
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual([]);
    });

    describe('Verbatim ColumnFilters', () => {
      describe.each`
        description                                            | verbatim | operator | searchTerms           | expectation
        ${'Verbatim false, Filter for null'}                   | ${false} | ${'EQ'}  | ${null}               | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" LIMIT 10 OFFSET 0'}
        ${'Verbatim true,  Filter for null'}                   | ${true}  | ${'EQ'}  | ${null}               | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" WHERE \"gender\" IS NULL LIMIT 10 OFFSET 0'}
        ${'Verbatim false, Empty string'}                      | ${false} | ${'EQ'}  | ${''}                 | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" LIMIT 10 OFFSET 0'}
        ${'Verbatim true,  Empty string'}                      | ${true}  | ${'EQ'}  | ${''}                 | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" WHERE \"gender\" = \'\' LIMIT 10 OFFSET 0'}
        ${'Verbatim false, Empty list'}                        | ${false} | ${'IN'}  | ${[]}                 | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" LIMIT 10 OFFSET 0'}
        ${'Verbatim true,  Empty list'}                        | ${true}  | ${'IN'}  | ${[]}                 | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" LIMIT 10 OFFSET 0'}
        ${'Verbatim false, Filter for null (in list)'}         | ${false} | ${'IN'}  | ${[null]}             | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" WHERE \"gender\" IN (\'\') LIMIT 10 OFFSET 0'}
        ${'Verbatim true,  Filter for null (in list)'}         | ${true}  | ${'IN'}  | ${[null]}             | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" WHERE \"gender\" IS NULL LIMIT 10 OFFSET 0'}
        ${'Verbatim false, Filter for empty string (in list)'} | ${false} | ${'IN'}  | ${['']}               | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" WHERE \"gender\" IN (\'\') LIMIT 10 OFFSET 0'}
        ${'Verbatim true,  Filter for empty string (in list)'} | ${true}  | ${'IN'}  | ${['']}               | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" WHERE \"gender\" = \'\' LIMIT 10 OFFSET 0'}
        ${'Verbatim false, Filter for female'}                 | ${false} | ${'IN'}  | ${['female']}         | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" WHERE \"gender\" IN (\'female\') LIMIT 10 OFFSET 0'}
        ${'Verbatim true,  Filter for female'}                 | ${true}  | ${'IN'}  | ${['female']}         | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM \"users\" WHERE \"gender\" = \'female\' LIMIT 10 OFFSET 0'}
        ${'Verbatim false, Filter for female/male'}            | ${false} | ${'IN'}  | ${['female', 'male']} | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" IN (\'female\',\'male\') LIMIT 10 OFFSET 0'}
        ${'Verbatim true,  Filter for female/male'}            | ${true}  | ${'IN'}  | ${['female', 'male']} | ${'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "gender" IN (\'female\',\'male\') LIMIT 10 OFFSET 0'}
      `(`$description`, ({ verbatim, operator, searchTerms, expectation }) => {
        const mockColumn = { id: 'gender', field: 'gender' } as Column;
        let mockColumnFilters: ColumnFilters;

        beforeEach(() => {
          mockColumnFilters = {
            gender: { columnId: 'gender', columnDef: mockColumn, searchTerms, operator, type: 'string', verbatimSearchTerms: verbatim },
          } as ColumnFilters;

          service.init(serviceOptions, paginationOptions, gridStub);
          service.updateFilters(mockColumnFilters, false);
        });

        it(`buildQuery output matches ${expectation}`, () => {
          const query = service.buildQuery();
          expect(removeSpaces(query)).toBe(removeSpaces(expectation));
        });
      });
    });
  });

  describe('presets', () => {
    let mockColumns: Column[] = [];
    beforeEach(() => {
      mockColumns = [
        { id: 'company', field: 'company' },
        { id: 'gender', field: 'gender' },
        { id: 'duration', field: 'duration', type: 'number' },
        { id: 'startDate', field: 'startDate' },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return a query with search having a range of exclusive numbers when the search value contains 2 dots (..) to represent a range of numbers', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" >= 2 AND "duration" <= 33 LIMIT 10 OFFSET 0`;
      const presetFilters = [{ columnId: 'duration', searchTerms: ['2..33'] }] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with a filter with range of numbers with decimals when the preset is a filter range with 2 dots (..) separator and range ends with a fraction', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" >= 0.5 AND "duration" <= 0.88 LIMIT 10 OFFSET 0`;
      const presetFilters = [{ columnId: 'duration', searchTerms: ['0.5...88'] }] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with search having a range of inclusive numbers when 2 searchTerms numbers are provided and the operator is "RangeInclusive"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" >= 2 AND "duration" <= 33 LIMIT 10 OFFSET 0`;
      const presetFilters = [{ columnId: 'duration', searchTerms: [2, 33], operator: 'RangeInclusive' }] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with search having a range of exclusive numbers when 2 searchTerms numbers are provided without any operator', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" >= 2 AND "duration" <= 33 LIMIT 10 OFFSET 0`;
      const presetFilters = [{ columnId: 'duration', searchTerms: [2, 33] }] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with search having a range of exclusive dates when the search value contains 2 dots (..) to represent a range of dates', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "startDate" >= '2001-01-01' AND "startDate" <= '2001-01-31' LIMIT 10 OFFSET 0`;
      const presetFilters = [{ columnId: 'startDate', searchTerms: ['2001-01-01..2001-01-31'] }] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with search having a range of inclusive dates when 2 searchTerms dates are provided and the operator is "RangeInclusive"', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "startDate" >= '2001-01-01' AND "startDate" <= '2001-01-31' LIMIT 10 OFFSET 0`;
      const presetFilters = [{ columnId: 'startDate', searchTerms: ['2001-01-01', '2001-01-31'], operator: 'RangeInclusive' }] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with search having a range of exclusive dates when 2 searchTerms dates are provided without any operator', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "startDate" >= '2001-01-01' AND "startDate" <= '2001-01-31' LIMIT 10 OFFSET 0`;
      const presetFilters = [{ columnId: 'startDate', searchTerms: ['2001-01-01', '2001-01-31'] }] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query to filter a search value with a fraction of a number that is missing a leading 0', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" = 0.22 LIMIT 10 OFFSET 0`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: 'number' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['.22'], type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without invalid characters to filter a search value that does contains invalid characters', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" = -22 LIMIT 10 OFFSET 0`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: 'float' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['-2a2'], type: 'float' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without invalid characters to filter a search value with an integer that contains invalid characters', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" = 22 LIMIT 10 OFFSET 0`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: 'integer' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['22;'], type: 'integer' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without invalid characters to filter a search value with a number that only has a minus characters', () => {
      const expectation = `SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" WHERE "duration" = 0 LIMIT 10 OFFSET 0`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: 'number' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['-'], type: 'string' },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });
  });

  describe('updateSorters method', () => {
    beforeEach(() => {
      const columns = [
        { id: 'company', field: 'company' },
        { id: 'gender', field: 'gender' },
        { id: 'name', field: 'name' },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
    });

    it('should return a query with the multiple new sorting when using multiColumnSort', () => {
      const expectation = 'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" ORDER BY "gender" DESC, "firstName" ASC LIMIT 10 OFFSET 0';
      const mockColumnSort = [
        { columnId: 'gender', sortCol: { id: 'gender', field: 'gender' }, sortAsc: false },
        { columnId: 'firstName', sortCol: { id: 'firstName', field: 'firstName' }, sortAsc: true },
      ];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(mockColumnSort);
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual([
        { columnId: 'gender', direction: 'DESC' },
        { columnId: 'firstName', direction: 'ASC' },
      ]);
    });

    it('should return a query when using presets array', () => {
      const expectation = 'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" ORDER BY "company" DESC, "firstName" ASC LIMIT 10 OFFSET 0';
      const presets = [
        { columnId: 'company', direction: 'DESC' },
        { columnId: 'firstName', direction: 'ASC' },
      ] as CurrentSorter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(undefined, presets);
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual(presets);
    });

    it('should return a query string using a different field to query when the column has a "queryField" defined in its definition', () => {
      const expectation = 'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" ORDER BY "gender" DESC, "firstName" ASC LIMIT 10 OFFSET 0';
      const mockColumnSort = [
        { columnId: 'gender', sortCol: { id: 'gender', field: 'gender' }, sortAsc: false },
        { columnId: 'name', sortCol: { id: 'name', field: 'name', queryField: 'firstName' }, sortAsc: true },
      ];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(mockColumnSort);
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual([
        { columnId: 'gender', direction: 'DESC' },
        { columnId: 'name', direction: 'ASC' },
      ]);
    });

    it('should return a query string using a different field to query when the column has a "queryFieldSorter" defined in its definition', () => {
      const expectation = 'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" ORDER BY "gender" DESC, "lastName" ASC LIMIT 10 OFFSET 0';
      const mockColumnSort = [
        { columnId: 'gender', sortCol: { id: 'gender', field: 'gender' }, sortAsc: false },
        { columnId: 'name', sortCol: { id: 'name', field: 'name', queryField: 'isAfter', queryFieldSorter: 'lastName' }, sortAsc: true },
      ];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(mockColumnSort);
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual([
        { columnId: 'gender', direction: 'DESC' },
        { columnId: 'name', direction: 'ASC' },
      ]);
    });

    it('should return a query without the field sorter when its field property is missing', () => {
      const expectation = 'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" ORDER BY "gender" DESC LIMIT 10 OFFSET 0';
      const mockColumnSort = [
        { columnId: 'gender', sortCol: { id: 'gender', field: 'gender' }, sortAsc: false },
        { columnId: 'firstName', sortCol: { id: 'firstName' }, sortAsc: true },
      ] as ColumnSort[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(mockColumnSort);
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual([
        { columnId: 'gender', direction: 'DESC' },
        { columnId: 'firstName', direction: 'ASC' },
      ]);
    });

    it('should return a query without any sorting after clearSorters was called', () => {
      const expectation = 'SELECT *, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 10 OFFSET 0';
      const mockColumnSort = [
        { columnId: 'gender', sortCol: { id: 'gender', field: 'gender' }, sortAsc: false },
        { columnId: 'firstName', sortCol: { id: 'firstName', field: 'firstName' }, sortAsc: true },
      ];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(mockColumnSort);
      service.clearSorters();
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual([]);
    });
  });

  describe('postProcess method', () => {
    it('should set pagination totalCount from the first row of SQL data result (COUNT(*) OVER())', () => {
      service.init({ tableName: 'users' }, paginationOptions, gridStub);
      // Simulate SQL result: array of rows, each row has totalCount
      const sqlResult = [
        { id: 1, name: 'John', totalCount: 123 },
        { id: 2, name: 'Jane', totalCount: 123 },
      ];
      service.postProcess(sqlResult);
      expect(service.pagination?.totalItems).toBe(123);
      expect(paginationOptions.totalItems).toBe(123);
    });

    it('should set pagination totalCount from the first row of a data array in an object result (explicit branch coverage)', () => {
      const freshPagination: Pagination = {
        pageNumber: 1,
        pageSizes: [5, 10, 25, 50, 100],
        pageSize: 10,
      };
      service.init({ tableName: 'users' }, freshPagination, gridStub);
      const sqlResult = {
        data: [
          { id: 1, totalCount: 555 },
          { id: 2, totalCount: 555 },
        ],
      };
      service.postProcess(sqlResult);
      expect(service.pagination?.totalItems).toBe(555);
      expect(freshPagination.totalItems).toBe(555);
    });

    it('should set pagination totalCount from the first row of SQL data result with custom totalCountField', () => {
      service.init({ tableName: 'users', totalCountField: 'myCount' }, paginationOptions, gridStub);
      // Simulate SQL result: array of rows, each row has custom count field
      const sqlResult = [
        { id: 1, name: 'John', myCount: 77 },
        { id: 2, name: 'Jane', myCount: 77 },
      ];
      service.postProcess(sqlResult);
      expect(service.pagination?.totalItems).toBe(77);
      expect(paginationOptions.totalItems).toBe(77);
    });

    it('should set pagination totalCount from a top-level totalCount property (fallback)', () => {
      const freshPagination: Pagination = {
        pageNumber: 1,
        pageSizes: [5, 10, 25, 50, 100],
        pageSize: 10,
      };
      service.init({ tableName: 'users' }, freshPagination, gridStub);
      const sqlResult = { totalCount: 456 };
      service.postProcess(sqlResult);
      expect(service.pagination?.totalItems).toBe(456);
      expect(freshPagination.totalItems).toBe(456);
    });

    it('should set pagination totalCount from a top-level custom count field (fallback)', () => {
      const freshPagination: Pagination = {
        pageNumber: 1,
        pageSizes: [5, 10, 25, 50, 100],
        pageSize: 10,
      };
      service.init({ tableName: 'users', totalCountField: 'myCount' }, freshPagination, gridStub);
      const sqlResult = { myCount: 88 };
      service.postProcess(sqlResult);
      expect(service.pagination?.totalItems).toBe(88);
      expect(freshPagination.totalItems).toBe(88);
    });

    it('should set pagination totalCount from the first row of a data array in an object result', () => {
      const freshPagination: Pagination = {
        pageNumber: 1,
        pageSizes: [5, 10, 25, 50, 100],
        pageSize: 10,
      };
      service.init({ tableName: 'users' }, freshPagination, gridStub);
      const sqlResult = {
        data: [
          { id: 1, totalCount: 999 },
          { id: 2, totalCount: 999 },
        ],
      };
      service.postProcess(sqlResult);
      expect(service.pagination?.totalItems).toBe(999);
      expect(freshPagination.totalItems).toBe(999);
    });
  });

  describe('coverage for edge/fallback branches', () => {
    it('should set totalItems from data[0][totalCountField] in postProcess', () => {
      (service as any)['pagination'] = { totalItems: 0 };
      (service as any)['options'] = { tableName: 'users' };
      const totalCountField = 'totalCount';
      const result = { data: [{ id: 1, [totalCountField]: 42 }] };
      (service as any)['postProcess'](result);
      expect((service as any)['pagination'].totalItems).toBe(42);
    });

    it('should use pageNumber=1 if pageNumber is missing', () => {
      service.init(serviceOptions, { pageSize: 10 }, gridStub);
      (service as any)['_currentPagination'] = { pageSize: 10 };
      const query = service.buildQuery();
      expect(query).toContain('OFFSET 0');
    });

    it('should use infiniteScroll.fetchSize if provided', () => {
      service.init({ ...serviceOptions, infiniteScroll: { fetchSize: 42 } }, { pageSize: 10, pageNumber: 1 }, gridStub);
      const query = service.buildQuery();
      expect(query).toContain('LIMIT 42');
    });

    it('should set totalItems from top-level totalCount in postProcess', () => {
      (service as any)['pagination'] = { totalItems: 0 };
      (service as any)['options'] = { tableName: 'users' };
      (service as any)['postProcess']({ totalCount: 123 });
      expect((service as any)['pagination'].totalItems).toBe(123);
    });

    it('should handle Contains and NOT_CONTAINS operators in _buildWhereClause', () => {
      service['options'] = { tableName: 'users' };
      service['_columns'] = [{ id: 'foo', field: 'foo' }];
      service['options'].filteringOptions = [
        { field: 'foo', operator: 'Contains', value: 'bar' },
        { field: 'foo', operator: 'NOT_CONTAINS', value: 'baz' },
      ];
      const where = service['buildWhereClause']();
      expect(where).toContain('LIKE');
      expect(where).toContain('NOT LIKE');
    });

    it('should throw in _buildOrderByClause if options, tableName, or columns are missing', () => {
      expect(() => service['buildOrderByClause']()).toThrow();
      service.options = { tableName: 'users' };
      expect(() => service['buildOrderByClause']()).toThrow();
      service.options = undefined as any;
      service['_columns'] = [{ id: 'foo', field: 'foo' }];
      expect(() => service['buildOrderByClause']()).toThrow();
    });

    it('should return empty string from _buildOrderByClause if no valid sorters', () => {
      service.options = { tableName: 'users' };
      service['_columns'] = [{ id: 'foo', field: 'foo' }];
      service.options.sortingOptions = [{ field: 'foo', direction: 'ASC' }];
      // simulate dot notation
      service['_columns'][0].field = 'foo.bar';
      const order = service['buildOrderByClause']();
      expect(order).toBe('');
    });

    it('should return NULL from _escapeSql for null/undefined', () => {
      expect(service['_escapeSql'](null)).toBe('NULL');
      expect(service['_escapeSql'](undefined)).toBe('NULL');
    });
  });
});
