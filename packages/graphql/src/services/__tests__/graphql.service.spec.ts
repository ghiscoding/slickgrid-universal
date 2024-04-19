import {
  BackendService,
  Column,
  ColumnFilter,
  ColumnFilters,
  ColumnSort,
  CurrentFilter,
  CurrentSorter,
  FieldType,
  FilterChangedArgs,
  GridOption,
  MultiColumnSort,
  OperatorType,
  Pagination,
  SharedService,
  SlickGrid,
  TranslaterService,
} from '@slickgrid-universal/common';

import { GraphqlServiceApi, GraphqlServiceOption, } from '../../interfaces/index';
import { GraphqlService } from './../graphql.service';

const DEFAULT_ITEMS_PER_PAGE = 25;
const DEFAULT_PAGE_SIZE = 20;

function removeSpaces(text: string) {
  return `${text}`.replace(/\s+/g, '');
}

let gridOptionMock: GridOption;

const gridStub = {
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getScrollbarDimensions: jest.fn(),
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  setColumns: jest.fn(),
  registerPlugin: jest.fn(),
  setSelectedRows: jest.fn(),
  setSortColumns: jest.fn(),
} as unknown as SlickGrid;

describe('GraphqlService', () => {
  let mockColumns: Column[];
  let service: GraphqlService;
  let paginationOptions: Pagination;
  let serviceOptions: GraphqlServiceOption;
  let sharedService: SharedService;

  beforeEach(() => {
    mockColumns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
    sharedService = new SharedService();
    service = new GraphqlService();
    serviceOptions = {
      datasetName: 'users'
    };
    paginationOptions = {
      pageNumber: 1,
      pageSizes: [5, 10, 25, 50, 100],
      pageSize: 10,
      totalItems: 100
    };
    gridOptionMock = {
      enablePagination: true,
      defaultFilterRangeOperator: OperatorType.rangeInclusive,
      backendServiceApi: {
        service: service as unknown as BackendService,
        options: { datasetName: '' },
        preProcess: jest.fn(),
        process: jest.fn(),
        postProcess: jest.fn(),
      } as unknown as GraphqlServiceApi
    } as unknown as GridOption;
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  describe('init method', () => {
    it('should initialize the service and expect the service options and pagination to be set', () => {
      service.init(serviceOptions, paginationOptions, gridStub);
      expect(service.options).toEqual(serviceOptions);
      expect(service.pagination).toEqual(paginationOptions);
    });

    it('should get the column definitions from "getColumns"', () => {
      const columns = [{ id: 'field4', field: 'field4', width: 50 }, { id: 'field2', field: 'field2', width: 50 }];
      const spy = jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);

      expect(spy).toHaveBeenCalled();
      expect(service.columnDefinitions).toEqual(columns);
    });
  });

  describe('buildQuery method', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    });

    it('should throw an error when no service options exists after service init', () => {
      service.init(undefined as any);
      expect(() => service.buildQuery()).toThrow();
    });

    it('should throw an error when no dataset is provided in the service options after service init', () => {
      service.init({ datasetName: undefined as any });
      expect(() => service.buildQuery()).toThrow('GraphQL Service requires the "datasetName" property to properly build the GraphQL query');
    });

    it('should throw an error when no column definitions is provided in the service options after service init', () => {
      service.init({ datasetName: 'users' });
      expect(() => service.buildQuery()).toThrow();
    });

    it('should return a simple query with pagination set and nodes that includes "id" and the other 2 fields properties', () => {
      const expectation = `query{ users(first:10, offset:0){ totalCount, nodes{ id, field1, field2 }}}`;

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a simple query without pagination (when disabled) set and nodes that includes "id" and the other 2 fields properties', () => {
      gridOptionMock.enablePagination = false;
      const expectation = `query{ users{ id, field1, field2 }}`;

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should use "columnDefinitions" from the "serviceOptions" when private member is undefined and then return a simple query as usual', () => {
      gridOptionMock.enablePagination = true;
      const expectation = `query{ users(first:10, offset:0){ totalCount, nodes{ id, field1 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a simple query with pagination set and nodes that includes at least "id" when the column definitions is an empty array', () => {
      const expectation = `query{ users(first:10, offset:0){ totalCount, nodes{ id }}}`;
      const columns = [];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should add extra column extra "fields" and expect them to be part of the query string', () => {
      const expectation = `query{ users(first:10, offset:0){ totalCount, nodes{ id, field1, field2, field3, field4 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100, fields: ['field3', 'field4'] }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should exclude a column and expect a query string without it', () => {
      const expectation = `query{ users(first:10, offset:0){ totalCount, nodes{ id, field1 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100, excludeFromQuery: true }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should exclude a column field, and expect a query string without it, but still include any fields specified', () => {
      const expectation = `query{ users(first:10, offset:0){ totalCount, nodes{ id, field1, field3, field4, field5 }}}`;
      const columns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', fields: ['field3', 'field4', 'field5'], width: 100, excludeFieldFromQuery: true }
      ];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should use default pagination "first" option when "paginationOptions" is not provided', () => {
      const expectation = `query{ users(first:${DEFAULT_ITEMS_PER_PAGE}, offset:0){ totalCount, nodes{ id, field1 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100, excludeFromQuery: true }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, undefined, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a simple query with pagination set and nodes that includes at least "id" when the column definitions is an empty array when using cursor', () => {
      const expectation = `query{users(first:20) { totalCount, nodes{id}, pageInfo{ hasNextPage,hasPreviousPage,endCursor,startCursor }, edges{ cursor }}}`;
      const columns = [];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users', useCursor: true }, paginationOptions, gridStub);
      service.updatePagination(3, 20);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with pageInfo and edges included when cursor is enabled', () => {
      const expectation = `query{users(first:20) { totalCount, nodes{id,field1}, pageInfo{ hasNextPage,hasPreviousPage,endCursor,startCursor }, edges{ cursor }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users', useCursor: true }, paginationOptions, gridStub);
      service.updatePagination(3, 20);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return complex objects with dot notation and expect the query to be split and wrapped with curly braces', () => {
      const expectation = `query{ users(first:10, offset:0){ totalCount, nodes{ id, field1, billing{address{street,zip}} }}}`;
      const columns = [
        { id: 'field1', field: 'field1' },
        { id: 'billing.address.street', field: 'billing.address.street' },
        { id: 'billing.address.zip', field: 'billing.address.zip' }
      ];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should exclude pagination from the query string when the option is disabled', () => {
      const expectation = `query{ users{ id, field1, field2 }}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      gridOptionMock.enablePagination = false;
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);
      service.updatePagination(3, 20);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      gridOptionMock.enablePagination = true; // reset it for the next test
    });

    it('should have a different pagination offset when it is updated before calling the buildQuery query (presets does that)', () => {
      const expectation = `query{ users(first:20, offset:40){ totalCount, nodes{ id, field1, field2 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);
      service.updatePagination(3, 20);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should make sure the offset pagination is never below zero, even when new page is 0', () => {
      const expectation = `query{ users(first:20, offset:0){ totalCount, nodes{ id, field1, field2 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);
      service.updatePagination(0, 20);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should make sure the offset pagination is never below zero, even when new is 1 the offset should remain 0', () => {
      const expectation = `query{ users(first:20, offset:0){ totalCount, nodes{ id, field1, field2 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users' }, paginationOptions, gridStub);
      service.updatePagination(1, 20);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should be able to provide "sortingOptions" and see the query string include the sorting', () => {
      const expectation = `query{ users(first:20, offset:40,orderBy:[{field:field1, direction:DESC}]){ totalCount, nodes{ id, field1, field2 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users', sortingOptions: [{ field: 'field1', direction: 'DESC' }] }, paginationOptions, gridStub);
      service.updatePagination(3, 20);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should be able to provide "filteringOptions" and see the query string include the filters', () => {
      const expectation = `query{ users(first:20, offset:40,filterBy:[{field:field1, operator: >, value:"2000-10-10"}]){ totalCount, nodes{ id, field1, field2 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users', filteringOptions: [{ field: 'field1', operator: '>', value: '2000-10-10' }] }, paginationOptions, gridStub);
      service.updatePagination(3, 20);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should be able to provide "sortingOptions" and see the query string include the sorting but without pagination when that is excluded', () => {
      const expectation = `query{ users(orderBy:[{field:field1, direction:DESC}]){ id, field1, field2 }}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      gridOptionMock.enablePagination = false;
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users', sortingOptions: [{ field: 'field1', direction: 'DESC' }] }, paginationOptions, gridStub);
      service.updatePagination(3, 20);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      gridOptionMock.enablePagination = true; // reset it for the next test
    });

    it('should be able to provide "filteringOptions" and see the query string include the filters but without pagination when that is excluded', () => {
      const expectation = `query{ users(filterBy:[{field:field1, operator: >, value:"2000-10-10"}]){ id, field1, field2 }}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      gridOptionMock.enablePagination = false;
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users', filteringOptions: [{ field: 'field1', operator: '>', value: '2000-10-10' }] }, paginationOptions, gridStub);
      service.updatePagination(3, 20);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      gridOptionMock.enablePagination = true; // reset it for the next test
    });

    it('should include default locale "en" in the query string when option "addLocaleIntoQuery" is enabled and translater is not defined', () => {
      const expectation = `query{ users(first:10, offset:0, locale: "en"){ totalCount, nodes{ id, field1, field2 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({ datasetName: 'users', addLocaleIntoQuery: true }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should include the locale in the query string when option "addLocaleIntoQuery" is enabled', () => {
      const expectation = `query{ users(first:10, offset:0, locale: "fr-CA"){ totalCount, nodes{ id, field1, field2 }}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      gridOptionMock.translater = { getCurrentLanguage: () => 'fr-CA' } as TranslaterService;
      service.init({ datasetName: 'users', addLocaleIntoQuery: true }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should include extra query arguments in the query string when option "extraQueryArguments" is used', () => {
      const expectation = `query{users(first:10, offset:0, userId:123, firstName:"John"){ totalCount, nodes{id,field1,field2}}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({
        datasetName: 'users',
        extraQueryArguments: [{ field: 'userId', value: 123 }, { field: 'firstName', value: 'John' }],
      }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should keep the double quotes in the field name when "keepArgumentFieldDoubleQuotes" is enabled', () => {
      const expectation = `query { users
                          ( first:10, offset:0,
                            orderBy:[{ field:"field1", direction:DESC},{ field:"field2", direction:ASC }],
                            filterBy:[{ field:"field1", operator:>, value:"2000-10-10" },{ field:"field2", operator:EQ, value:"John" }]
                          ) {
                            totalCount, nodes { id,field1,field2 }}
                          }`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({
        datasetName: 'users',
        filteringOptions: [{ field: 'field1', operator: '>', value: '2000-10-10' }, { field: 'field2', operator: 'EQ', value: 'John' }],
        sortingOptions: [{ field: 'field1', direction: 'DESC' }, { field: 'field2', direction: 'ASC' }],
        keepArgumentFieldDoubleQuotes: true
      }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should include the operationName if provided', () => {
      const expectation = `query foo {users(first:10, offset:0, userId:123, firstName:"John"){ totalCount, nodes{id,field1,field2}}}`;
      const columns = [{ id: 'field1', field: 'field1', width: 100 }, { id: 'field2', field: 'field2', width: 100 }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);

      service.init({
        datasetName: 'users',
        operationName: 'foo',
        extraQueryArguments: [{ field: 'userId', value: 123 }, { field: 'firstName', value: 'John' }],
      }, paginationOptions, gridStub);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });
  });

  describe('buildFilterQuery method', () => {
    it('should return a simple query from an column array', () => {
      const expectation = `firstName, lastName`;
      const columns = ['firstName', 'lastName'];

      const query = service.buildFilterQuery(columns);

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query string including complex object', () => {
      const expectation = `firstName, lastName, billing{address{street, zip}}`;
      const columns = ['firstName', 'lastName', 'billing.address.street', 'billing.address.zip'];

      const query = service.buildFilterQuery(columns);

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query string including a direct reference to a complex object', () => {
      const expectation = `firstName, lastName, billing{address{street, zip}}`;
      const columns = ['firstName', 'lastName', 'billing', 'billing.address.street', 'billing.address.zip'];

      const query = service.buildFilterQuery(columns);

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });
  });

  describe('clearFilters method', () => {
    it('should call "updateOptions" to clear all filters', () => {
      const spy = jest.spyOn(service, 'updateOptions');
      service.clearFilters();
      expect(spy).toHaveBeenCalledWith({ filteringOptions: [] });
    });
  });

  describe('clearSorters method', () => {
    it('should call "updateOptions" to clear all sorting', () => {
      const spy = jest.spyOn(service, 'updateOptions');
      service.clearSorters();
      expect(spy).toHaveBeenCalledWith({ sortingOptions: [] });
    });
  });

  describe('getInitPaginationOptions method', () => {
    beforeEach(() => {
      paginationOptions.pageSize = 20;
    });

    it('should return the pagination options without cursor by default', () => {
      jest.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ datasetName: 'users' }, paginationOptions);
      const output = service.getInitPaginationOptions();
      expect(output).toEqual({ first: 20, offset: 0 });
    });

    it('should return the pagination options with cursor info when "useCursor" is enabled', () => {
      jest.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ datasetName: 'users', useCursor: true }, paginationOptions);
      const output = service.getInitPaginationOptions();
      expect(output).toEqual({ first: 20 });
    });

    it('should return the pagination options with default page size of 25 when "paginationOptions" is undefined', () => {
      jest.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ datasetName: 'users' }, undefined);
      const output = service.getInitPaginationOptions();
      expect(output).toEqual({ first: DEFAULT_ITEMS_PER_PAGE, offset: 0 });
    });
  });

  describe('getDatasetName method', () => {
    it('should return the dataset name when defined', () => {
      jest.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ datasetName: 'users' });
      const output = service.getDatasetName();
      expect(output).toBe('users');
    });

    it('should return empty string when dataset name is undefined', () => {
      jest.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ datasetName: undefined as any });
      const output = service.getDatasetName();
      expect(output).toBe('');
    });
  });

  describe('resetPaginationOptions method', () => {
    beforeEach(() => {
      paginationOptions.pageSize = 20;
    });

    it('should reset the pagination options with default pagination', () => {
      const spy = jest.spyOn(service, 'updateOptions');

      jest.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ datasetName: 'users' }, paginationOptions);
      service.resetPaginationOptions();

      expect(spy).toHaveBeenCalledWith({ paginationOptions: { first: 20, offset: 0 } });
    });

    it('should reset the pagination options when using cursor', () => {
      const spy = jest.spyOn(service, 'updateOptions');

      jest.spyOn(gridStub, 'getColumns').mockReturnValue([]);
      service.init({ datasetName: 'users', useCursor: true }, paginationOptions);
      service.resetPaginationOptions();

      expect(spy).toHaveBeenCalledWith({ paginationOptions: { first: 20 } });
    });
  });

  describe('processOnFilterChanged method', () => {
    it('should throw an error when backendService is undefined', () => {
      service.init(serviceOptions, paginationOptions, undefined);
      expect(() => service.processOnFilterChanged(null as any, { grid: gridStub } as any)).toThrow();
    });

    it('should throw an error when grid is undefined', () => {
      service.init(serviceOptions, paginationOptions, gridStub);

      expect(() => service.processOnFilterChanged(null as any, { grid: undefined } as any))
        .toThrowError('Something went wrong when trying create the GraphQL Backend Service');
    });

    it('should return a query with the new filter', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EQ, value:"female"}]) { totalCount,nodes{ id,field1,field2 } }}`;
      const querySpy = jest.spyOn(service, 'buildQuery');
      const resetSpy = jest.spyOn(service, 'resetPaginationOptions');
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilter = { columnDef: mockColumn, columnId: 'gender', operator: 'EQ', searchTerms: ['female'], targetSelector: 'div.some-classes' } as ColumnFilter;
      const mockFilterChangedArgs = {
        columnDef: mockColumn,
        columnId: 'gender',
        columnFilters: { gender: mockColumnFilter },
        grid: gridStub,
        operator: 'EQ',
        searchTerms: ['female'],
        shouldTriggerQuery: true,
        targetSelector: 'div.some-classes'
      } as FilterChangedArgs;

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.processOnFilterChanged(null as any, mockFilterChangedArgs);
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
      expect(resetSpy).toHaveBeenCalled();
      expect(currentFilters).toEqual([{ columnId: 'gender', operator: 'EQ', searchTerms: ['female'], targetSelector: 'div.some-classes' }]);
    });

    it('should return a query with a new filter when previous filters exists', () => {
      const expectation = `query{users(first:10, offset:0,
                          filterBy:[{field:gender, operator:EQ, value:"female"}, {field:firstName, operator:StartsWith, value:"John"}])
                          { totalCount,nodes{ id,field1,field2 } }}`;
      const querySpy = jest.spyOn(service, 'buildQuery');
      const resetSpy = jest.spyOn(service, 'resetPaginationOptions');
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnName = { id: 'firstName', field: 'firstName' } as Column;
      const mockColumnFilter = { columnDef: mockColumn, columnId: 'gender', operator: 'EQ', searchTerms: ['female'], targetSelector: 'div.some-classes' } as ColumnFilter;
      const mockColumnFilterName = { columnDef: mockColumnName, columnId: 'firstName', operator: 'StartsWith', searchTerms: ['John'] } as ColumnFilter;
      const mockFilterChangedArgs = {
        columnDef: mockColumn,
        columnId: 'gender',
        columnFilters: { gender: mockColumnFilter, name: mockColumnFilterName },
        grid: gridStub,
        operator: 'EQ',
        searchTerms: ['female'],
        shouldTriggerQuery: true
      } as FilterChangedArgs;

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.processOnFilterChanged(null as any, mockFilterChangedArgs);
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
      expect(resetSpy).toHaveBeenCalled();
      expect(currentFilters).toEqual([
        { columnId: 'gender', operator: 'EQ', searchTerms: ['female'], targetSelector: 'div.some-classes' },
        { columnId: 'firstName', operator: 'StartsWith', searchTerms: ['John'] }
      ]);
    });
  });

  describe('processOnPaginationChanged method', () => {
    it('should return a query with the new pagination', () => {
      const expectation = `query{users(first:20, offset:40) { totalCount,nodes { id, field1, field2 }}}`;
      const querySpy = jest.spyOn(service, 'buildQuery');

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.processOnPaginationChanged(null as any, { newPage: 3, pageSize: 20 });
      const currentPagination = service.getCurrentPagination();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
      expect(currentPagination).toEqual({ pageNumber: 3, pageSize: 20 });
    });

    it('should return a query with the new pagination and use pagination size options that was passed to service options when it is not provided as argument to "processOnPaginationChanged"', () => {
      const expectation = `query{users(first:10, offset:20) { totalCount,nodes { id, field1, field2 }}}`;
      const querySpy = jest.spyOn(service, 'buildQuery');

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.processOnPaginationChanged(null as any, { newPage: 3 } as any);
      const currentPagination = service.getCurrentPagination();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
      expect(currentPagination).toEqual({ pageNumber: 3, pageSize: 10 });
    });

    it('should return a query with the new pagination and use default pagination size when not provided as argument', () => {
      const expectation = `query{users(first:${DEFAULT_PAGE_SIZE}, offset:${DEFAULT_PAGE_SIZE * 2}) { totalCount,nodes { id, field1, field2 }}}`;
      const querySpy = jest.spyOn(service, 'buildQuery');

      service.init(serviceOptions, undefined, gridStub);
      const query = service.processOnPaginationChanged(null as any, { newPage: 3 } as any);
      const currentPagination = service.getCurrentPagination();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
      expect(currentPagination).toEqual({ pageNumber: 3, pageSize: 20 });
    });

    describe("CursorBased related scenarios", () => {
      describe.each`
        description           | cursorArgs                    | expectation
        ${"First page"}       | ${{ first: 20 }}              | ${'query{users(first:20) { totalCount,nodes { id, field1, field2 }, pageInfo{hasNextPage,hasPreviousPage,endCursor,startCursor},edges{cursor}}}'}
        ${"Next Page"}        | ${{ first: 20, after: 'a' }}  | ${'query{users(first:20, after:"a") { totalCount,nodes { id, field1, field2 }, pageInfo{hasNextPage,hasPreviousPage,endCursor,startCursor},edges{cursor}}}'}
        ${"Previous Page"}  | ${{ last: 20, before: 'b' }} | ${'query{users(last:20, before:"b") { totalCount,nodes { id, field1, field2 }, pageInfo{hasNextPage,hasPreviousPage,endCursor,startCursor},edges{cursor}}}'}
        ${"Last Page"}        | ${{ last: 20 }}               | ${'query{users(last:20) { totalCount,nodes { id, field1, field2 }, pageInfo{hasNextPage,hasPreviousPage,endCursor,startCursor},edges{cursor}}}'}
      `(`$description`, ({ description, cursorArgs, expectation }) => {
        it('should return a query with the new pagination and use pagination size options that was passed to service options when it is not provided as argument to "processOnPaginationChanged"', () => {
          const querySpy = jest.spyOn(service, 'buildQuery');

          service.init({ ...serviceOptions, useCursor: true }, paginationOptions, gridStub);
          const query = service.processOnPaginationChanged(null as any, { newPage: 3, pageSize: 20, ...cursorArgs });
          const currentPagination = service.getCurrentPagination();

          expect(removeSpaces(query)).toBe(removeSpaces(expectation));
          expect(querySpy).toHaveBeenCalled();
          expect(currentPagination).toEqual({ pageNumber: 3, pageSize: 20 });
        });
      });
    });
  });

  describe('processOnSortChanged method', () => {
    it('should return a query with the new sorting when using single sort', () => {
      const expectation = `query{ users(first:10, offset:0, orderBy:[{field:gender, direction: DESC}]) { totalCount,nodes{ id,field1,field2 } }}`;
      const querySpy = jest.spyOn(service, 'buildQuery');
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockSortChangedArgs = { columnId: 'gender', sortCol: mockColumn, sortAsc: false, multiColumnSort: false } as ColumnSort;

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.processOnSortChanged(null as any, mockSortChangedArgs);

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
    });

    it('should return a query with the multiple new sorting when using multiColumnSort', () => {
      const expectation = `query{ users(first:10, offset:0,
                            orderBy:[{field:gender, direction: DESC}, {field:firstName, direction: ASC}]) {
                              totalCount,nodes{ id,field1,field2 } }}`;
      const querySpy = jest.spyOn(service, 'buildQuery');
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnName = { id: 'firstName', field: 'firstName' } as Column;
      const mockColumnSort = { columnId: 'gender', sortCol: mockColumn, sortAsc: false } as ColumnSort;
      const mockColumnSortName = { columnId: 'firstName', sortCol: mockColumnName, sortAsc: true } as ColumnSort;
      const mockSortChangedArgs = { sortCols: [mockColumnSort, mockColumnSortName], multiColumnSort: true, grid: gridStub } as MultiColumnSort;

      service.init(serviceOptions, paginationOptions, gridStub);
      const query = service.processOnSortChanged(null as any, mockSortChangedArgs);

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(querySpy).toHaveBeenCalled();
    });
  });

  describe('updateFilters method', () => {
    beforeEach(() => {
      const columns = [{ id: 'company', field: 'company' }, { id: 'gender', field: 'gender' }, { id: 'name', field: 'name' }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
    });

    it('should throw an error when filter columnId is not found to be part of the column definitions', () => {
      const mockCurrentFilter = { columnDef: { id: 'city', field: 'city' }, columnId: 'city', operator: 'EQ', searchTerms: ['Boston'] } as CurrentFilter;
      service.init(serviceOptions, paginationOptions, gridStub);
      expect(() => service.updateFilters([mockCurrentFilter], true)).toThrowError('[GraphQL Service]: Something went wrong in trying to get the column definition');
    });

    it('should throw an error when neither "field" nor "name" are being part of the column definition', () => {
      const mockColumnFilters = { gender: { columnId: 'gender', columnDef: { id: 'gender' }, searchTerms: ['female'], operator: 'EQ' }, } as unknown as ColumnFilters;
      service.init(serviceOptions, paginationOptions, gridStub);
      expect(() => service.updateFilters(mockColumnFilters, false)).toThrowError('GraphQL filter could not find the field name to query the search');
    });

    it('should return a query with the new filter when filters are passed as a filter trigger by a filter event and is of type ColumnFilters', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EQ, value:"female"}]) {
        totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female'], operator: 'EQ', type: FieldType.string, }
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without filtering when the filter "searchTerms" property is missing from the search', () => {
      const expectation = `query{users(first:10, offset:0) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, operator: 'EQ', type: FieldType.string, },
      } as unknown as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with multiple filters when the filters object has multiple search and they are passed as a filter trigger by a filter event and is of type ColumnFilters', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EQ, value:"female"}, {field:company, operator:Not_Contains, value:"abc"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumnGender = { id: 'gender', field: 'gender' } as Column;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumnGender, searchTerms: ['female'], operator: 'EQ', type: FieldType.string, },
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: OperatorType.notContains, type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with multiple filters and expect same query string result as previous test even with "isUpdatedByPreset" enabled', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EQ, value:"female"}, {field:company, operator:Contains, value:"abc"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumnGender = { id: 'gender', field: 'gender' } as Column;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumnGender, searchTerms: ['female'], operator: 'EQ', type: FieldType.string, },
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: 'Contains', type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, true);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with the new filter when filters are passed as a Grid Preset of type CurrentFilter', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EQ, value:"female"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockCurrentFilter = { columnDef: mockColumn, columnId: 'gender', operator: 'EQ', searchTerms: ['female'] } as CurrentFilter;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters([mockCurrentFilter], true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual([{ columnId: 'gender', operator: 'EQ', searchTerms: ['female'] }]);
    });

    it('should return a query with search having the operator StartsWith when search value has the "*" symbol as the last character', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:StartsWith, value:"fem"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['fem*'], type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator EndsWith when search value has the "*" symbol as the first character', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EndsWith, value:"le"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['*le'], type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator EndsWith when the operator was provided as "*z"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EndsWith, value:"le"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le*'], operator: '*z', type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator StartsWith even when search value last char is "*" symbol but the operator provided is "*z"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:StartsWith, value:"le"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le*'], operator: 'a*', type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator EndsWith when the Column Filter was provided as "*z"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EndsWith, value:"le"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender', filter: { operator: '*z' } } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le'], type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator EndsWith when the Column Filter was provided as EndsWith', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EndsWith, value:"le"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender', filter: { operator: 'EndsWith' } } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le'], type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator StartsWith when the operator was provided as "a*"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:StartsWith, value:"le"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le'], operator: 'a*', type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator StartsWith when the operator was provided as StartsWith', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:StartsWith, value:"le"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['le'], operator: 'StartsWith', type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having the operator Greater of Equal when the search value was provided as ">=10"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:age, operator:GE, value:"10"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'age', field: 'age' } as Column;
      const mockColumnFilters = {
        age: { columnId: 'age', columnDef: mockColumn, searchTerms: ['>=10'], type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search NOT having the operator Greater of Equal when the search value was provided as ">=10" but "autoParseInputFilterOperator" is set to false', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:age, operator:Contains, value:">=10"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'age', field: 'age', autoParseInputFilterOperator: false } as Column;
      const mockColumnFilters = {
        age: { columnId: 'age', columnDef: mockColumn, searchTerms: ['>=10'], type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having a range of exclusive numbers when the search value contains 2 dots (..) to represent a range of numbers', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:GE, value:"2"}, {field:duration, operator:LE, value:"33"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'duration', field: 'duration' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumn, searchTerms: ['2..33'], type: FieldType.number, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an inclusive range of numbers using the 2 dots (..) separator, the "RangeInclusive" operator and the range has an unbounded end', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:GE, value:"5"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: FieldType.number } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['5..'], operator: 'RangeInclusive', type: FieldType.number, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an inclusive range of numbers using the 2 dots (..) separator, the "RangeInclusive" operator and the range has an unbounded begin', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:LE, value:"5"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: FieldType.number } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['..5'], operator: 'RangeInclusive', type: FieldType.number, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an inclusive range of numbers using the 2 dots (..) separator, the "RangeExclusive" operator and the range has an unbounded end', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:GT, value:"5"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: FieldType.number } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['5..'], operator: 'RangeExclusive', type: FieldType.number, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an inclusive range of numbers using the 2 dots (..) separator, the "RangeExclusive" operator and the range has an unbounded begin', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:LT, value:"5"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: FieldType.number } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['..5'], operator: 'RangeExclusive', type: FieldType.number, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having a range of inclusive numbers when 2 searchTerms numbers are provided and the operator is "RangeInclusive"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:GE, value:2}, {field:duration, operator:LE, value:33}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'duration', field: 'duration' } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumn, searchTerms: [2, 33], operator: 'RangeInclusive', type: FieldType.number, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an inclusive range of numbers using the 2 dots (..) separator, "defaultFilterRangeOperator" is not set and operator is not set to "RangeInclusive" or "RangeExclusive"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:LE, value:"5"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: FieldType.number } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['..5'], operator: OperatorType.contains, type: FieldType.number },
      } as ColumnFilters;
      gridOptionMock.defaultFilterRangeOperator = undefined;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query to filter a search value between an exclusive range of numbers using the 2 dots (..) separator, "defaultFilterRangeOperator" is set to "rangeExclusive" and operator is not set to "RangeInclusive" or "RangeExclusive"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:LT, value:"5"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: FieldType.number } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['..5'], operator: OperatorType.contains, type: FieldType.number },
      } as ColumnFilters;
      gridOptionMock.defaultFilterRangeOperator = OperatorType.rangeExclusive;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having a range of exclusive dates when the search value contains 2 dots (..) to represent a range of dates', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:startDate, operator:GE, value:"2001-01-01"}, {field:startDate, operator:LE, value:"2001-01-31"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'startDate', field: 'startDate' } as Column;
      const mockColumnFilters = {
        startDate: { columnId: 'startDate', columnDef: mockColumn, searchTerms: ['2001-01-01..2001-01-31'], type: FieldType.dateIso, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with search having a range of inclusive dates when 2 searchTerms dates are provided and the operator is "RangeInclusive"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:startDate, operator:GE, value:"2001-01-01"}, {field:startDate, operator:LE, value:"2001-01-31"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'startDate', field: 'startDate' } as Column;
      const mockColumnFilters = {
        startDate: { columnId: 'startDate', columnDef: mockColumn, searchTerms: ['2001-01-01', '2001-01-31'], operator: 'RangeInclusive', type: FieldType.dateIso },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with a date equal when only 1 searchTerms is provided and even if the operator is set to a range', () => {
      const expectation = `query{users(first:10,offset:0,filterBy:[{field:company,operator:Contains,value:"abc"},{field:updatedDate,operator:EQ,value:"2001-01-20"}]){totalCount,nodes{id,company,gender,name}}}`;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnUpdated = { id: 'updatedDate', field: 'updatedDate', type: FieldType.date } as Column;
      const mockColumnFilters = {
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: 'Contains', type: FieldType.string },
        updatedDate: { columnId: 'updatedDate', columnDef: mockColumnUpdated, searchTerms: ['2001-01-20'], operator: 'RangeExclusive', type: FieldType.dateIso },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with a date operator when only 1 searchTerms', () => {
      const expectation = `query{users(first:10,offset:0,filterBy:[{field:company,operator:Contains,value:"abc"},{field:updatedDate,operator:GE,value:"2001-01-20"}]){totalCount,nodes{id,company,gender,name}}}`;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnUpdated = { id: 'updatedDate', field: 'updatedDate', type: FieldType.date } as Column;
      const mockColumnFilters = {
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: 'Contains', type: FieldType.string },
        updatedDate: { columnId: 'updatedDate', columnDef: mockColumnUpdated, searchTerms: ['2001-01-20'], operator: '>=', type: FieldType.dateIso },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without any date filtering when searchTerms is an empty array', () => {
      const expectation = `query{users(first:10,offset:0,filterBy:[{field:company,operator:Contains,value:"abc"}]){totalCount,nodes{id,company,gender,name}}}`;
      const mockColumnCompany = { id: 'company', field: 'company' } as Column;
      const mockColumnUpdated = { id: 'updatedDate', field: 'updatedDate', type: FieldType.date } as Column;
      const mockColumnFilters = {
        company: { columnId: 'company', columnDef: mockColumnCompany, searchTerms: ['abc'], operator: 'Contains', type: FieldType.string },
        updatedDate: { columnId: 'updatedDate', columnDef: mockColumnUpdated, searchTerms: [], operator: 'RangeExclusive', type: FieldType.dateIso },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with a CSV string when the filter operator is IN ', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:IN, value:"female,male"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female', 'male'], operator: 'IN', type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with a CSV string when the filter operator is NOT_IN', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:NOT_IN, value:"female,male"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female', 'male'], operator: OperatorType.notIn, type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with a CSV string and use the operator from the Column Definition Operator when provided', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:NOT_IN, value:"female,male"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender', filter: { operator: OperatorType.notIn } } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female', 'male'], type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with mapped operator when no operator was provided but we have a column "type" property', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:Contains, value:"le"}, {field:age, operator:EQ, value:"28"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumnGender = { id: 'gender', field: 'gender', type: FieldType.string } as Column;
      const mockColumnAge = { id: 'age', field: 'age', type: FieldType.number } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumnGender, searchTerms: ['le'], type: FieldType.string },
        age: { columnId: 'age', columnDef: mockColumnAge, searchTerms: [28], type: FieldType.number },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with mapped operator when neither operator nor column "type" property exists', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:Contains, value:"le"}, {field:city, operator:Contains, value:"Bali"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumnGender = { id: 'gender', field: 'gender' } as Column;
      const mockColumnCity = { id: 'city', field: 'city' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumnGender, searchTerms: ['le'], type: FieldType.string },
        city: { columnId: 'city', columnDef: mockColumnCity, searchTerms: ['Bali'], type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query with the new filter search value of empty string when searchTerms has an undefined value', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EQ, value:""}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: [undefined as any], operator: 'EQ', type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query using a different field to query when the column has a "queryField" defined in its definition', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:isMale, operator:EQ, value:"true"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender', queryField: 'isMale' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: [true], operator: 'EQ', type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query using a different field to query when the column has a "queryFieldFilter" defined in its definition', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:hasPriority, operator:EQ, value:"female"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', field: 'gender', queryField: 'isAfter', queryFieldFilter: 'hasPriority' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female'], operator: 'EQ', type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query using column name that is an HTML Element', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:Gender, operator:EQ, value:"female"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const nameElm = document.createElement('div');
      nameElm.innerHTML = `<span class="text-red">Gender</span>`;
      const mockColumn = { id: 'gender', name: nameElm } as unknown as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female'], operator: 'EQ', type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query using the column "name" property when "field" is not defined in its definition', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:gender, operator:EQ, value:"female"}]) { totalCount,nodes{ id,company,gender,name } }}`;
      const mockColumn = { id: 'gender', name: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female'], operator: 'EQ', type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without any sorting after clearFilters was called', () => {
      const expectation = `query{ users(first:10,offset:0) { totalCount, nodes {id, company, gender,name} }}`;
      const mockColumn = { id: 'gender', field: 'gender' } as Column;
      const mockColumnFilters = {
        gender: { columnId: 'gender', columnDef: mockColumn, searchTerms: ['female'], operator: 'EQ', type: FieldType.string },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      service.clearFilters();
      const currentFilters = service.getCurrentFilters();
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual([]);
    });

    describe("Verbatim ColumnFilters", () => {
      describe.each`
        description                                             | verbatim | operator  | searchTerms            | expectation
        ${"Verbatim false, Filter for null"}                    | ${false} | ${'EQ'}   | ${null}                | ${'query{users(first:10, offset:0) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim true,  Filter for null"}                    | ${true}  | ${'EQ'}   | ${null}                | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:EQ, value:"null"}]) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim false, Empty string"}                       | ${false} | ${'EQ'}   | ${''}                  | ${'query{users(first:10, offset:0) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim true,  Empty string"}                       | ${true}  | ${'EQ'}   | ${''}                  | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:EQ, value:"\\"\\""}]) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim false, Empty list"}                         | ${false} | ${'IN'}   | ${[]}                  | ${'query{users(first:10, offset:0) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim true,  Empty list"}                         | ${true}  | ${'IN'}   | ${[]}                  | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:IN, value:"[]"}]) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim false, Filter for null (in list)"}          | ${false} | ${'IN'}   | ${[null]}              | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:IN, value:""}]) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim true,  Filter for null (in list)"}          | ${true}  | ${'IN'}   | ${[null]}              | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:IN, value:"[null]"}]) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim false, Filter for empty string (in list)"}  | ${false} | ${'IN'}   | ${['']}                | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:IN, value:""}]) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim true,  Filter for empty string (in list)"}  | ${true}  | ${'IN'}   | ${['']}                | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:IN, value:"[\\"\\"]"}]) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim false, Filter for female"}                  | ${false} | ${'IN'}   | ${['female']}          | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:IN, value:"female"}]) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim true,  Filter for female"}                  | ${true}  | ${'IN'}   | ${['female']}          | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:IN, value:"[\\"female\\"]"}]) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim false, Filter for female/male"}             | ${false} | ${'IN'}   | ${['female', 'male']}  | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:IN, value:"female, male"}]) { totalCount,nodes{ id,company,gender,name } }}'}
        ${"Verbatim true,  Filter for female/male"}             | ${true}  | ${'IN'}   | ${['female', 'male']}  | ${'query{users(first:10, offset:0, filterBy:[{field:gender, operator:IN, value:"[\\"female\\", \\"male\\"]"}]) { totalCount,nodes{ id,company,gender,name } }}'}
      `(`$description`, ({ description, verbatim, operator, searchTerms, expectation }) => {

        const mockColumn = { id: 'gender', field: 'gender' } as Column;
        let mockColumnFilters: ColumnFilters;

        beforeEach(() => {
          mockColumnFilters = {
            gender: { columnId: 'gender', columnDef: mockColumn, searchTerms, operator, type: FieldType.string, verbatimSearchTerms: verbatim },
          } as ColumnFilters;

          service.init(serviceOptions, paginationOptions, gridStub);
          service.updateFilters(mockColumnFilters, false);
        });

        test(`buildQuery output matches ${expectation}`, () => {
          const query = service.buildQuery();
          expect(removeSpaces(query)).toBe(removeSpaces(expectation));
        });
      });
    });
  });

  describe('presets', () => {
    let mockColumns: Column[] = [];
    beforeEach(() => {
      mockColumns = [{ id: 'company', field: 'company' }, { id: 'gender', field: 'gender' }, { id: 'duration', field: 'duration', type: FieldType.number }, { id: 'startDate', field: 'startDate' }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return a query with search having a range of exclusive numbers when the search value contains 2 dots (..) to represent a range of numbers', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:GE, value:"2"}, {field:duration, operator:LE, value:"33"}]) {
        totalCount,nodes{ id,company,gender,duration,startDate } }}`;
      const presetFilters = [{ columnId: 'duration', searchTerms: ['2..33'] }] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with all columns and search even when having hidden columns (basically when it is not part of the `getColumns()` return) when all passed are passed with the shared service', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:GE, value:"2"}, {field:duration, operator:LE, value:"33"}]) {
        totalCount,nodes{ id,company,gender,duration,startDate } }}`;
      const presetFilters = [{ columnId: 'duration', searchTerms: ['2..33'] }] as CurrentFilter[];
      const mockColumnsCopy = [...mockColumns];

      // remove "Gender" column from `getColumns` (to simulate hidden field)
      mockColumnsCopy.splice(1, 1);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumnsCopy);

      // but still pass all columns to the service init
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(mockColumns);

      service.init(serviceOptions, paginationOptions, gridStub, sharedService);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with a filter with range of numbers with decimals when the preset is a filter range with 2 dots (..) separator and range ends with a fraction', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:GE, value:"0.5"}, {field:duration, operator:LE, value:"0.88"}]) { totalCount,nodes{ id,company,gender,duration,startDate } }}`;
      const presetFilters = [
        { columnId: 'duration', searchTerms: ['0.5...88'] },
      ] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with search having a range of inclusive numbers when 2 searchTerms numbers are provided and the operator is "RangeInclusive"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:GE, value:2}, {field:duration, operator:LE, value:33}]) { totalCount,nodes{ id,company,gender,duration,startDate } }}`;
      const presetFilters = [
        { columnId: 'duration', searchTerms: [2, 33], operator: 'RangeInclusive' },
      ] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with search having a range of exclusive numbers when 2 searchTerms numbers are provided without any operator', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:duration, operator:GE, value:2}, {field:duration, operator:LE, value:33}]) { totalCount,nodes{ id,company,gender,duration,startDate } }}`;
      const presetFilters = [
        { columnId: 'duration', searchTerms: [2, 33] },
      ] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with search having a range of exclusive dates when the search value contains 2 dots (..) to represent a range of dates', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:startDate, operator:GE, value:"2001-01-01"}, {field:startDate, operator:LE, value:"2001-01-31"}]) { totalCount,nodes{ id,company,gender,duration,startDate } }}`;
      const presetFilters = [
        { columnId: 'startDate', searchTerms: ['2001-01-01..2001-01-31'] },
      ] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with search having a range of inclusive dates when 2 searchTerms dates are provided and the operator is "RangeInclusive"', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:startDate, operator:GE, value:"2001-01-01"}, {field:startDate, operator:LE, value:"2001-01-31"}]) { totalCount,nodes{ id,company,gender,duration,startDate } }}`;
      const presetFilters = [
        { columnId: 'startDate', searchTerms: ['2001-01-01', '2001-01-31'], operator: 'RangeInclusive' },
      ] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query with search having a range of exclusive dates when 2 searchTerms dates are provided without any operator', () => {
      const expectation = `query{users(first:10, offset:0, filterBy:[{field:startDate, operator:GE, value:"2001-01-01"}, {field:startDate, operator:LE, value:"2001-01-31"}]) { totalCount,nodes{ id,company,gender,duration,startDate } }}`;
      const presetFilters = [
        { columnId: 'startDate', searchTerms: ['2001-01-01', '2001-01-31'] },
      ] as CurrentFilter[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(presetFilters, true);
      const query = service.buildQuery();
      const currentFilters = service.getCurrentFilters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentFilters).toEqual(presetFilters);
    });

    it('should return a query to filter a search value with a fraction of a number that is missing a leading 0', () => {
      const expectation = `query{users(first:10,offset:0,filterBy:[{field:duration,operator:EQ,value:"0.22"}]){totalCount,nodes{id,company,gender,duration,startDate}}}`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: FieldType.number } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['.22'], type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without invalid characters to filter a search value that does contains invalid characters', () => {
      const expectation = `query{users(first:10,offset:0,filterBy:[{field:duration,operator:EQ,value:"-22"}]){totalCount,nodes{id,company,gender,duration,startDate}}}`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: FieldType.float } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['-2a2'], type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without invalid characters to filter a search value with an integer that contains invalid characters', () => {
      const expectation = `query{users(first:10,offset:0,filterBy:[{field:duration,operator:EQ,value:"22"}]){totalCount,nodes{id,company,gender,duration,startDate}}}`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: FieldType.integer } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['22;'], type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });

    it('should return a query without invalid characters to filter a search value with a number that only has a minus characters', () => {
      const expectation = `query{users(first:10,offset:0,filterBy:[{field:duration,operator:EQ,value:"0"}]){totalCount,nodes{id,company,gender,duration,startDate}}}`;
      const mockColumnDuration = { id: 'duration', field: 'duration', type: FieldType.number } as Column;
      const mockColumnFilters = {
        duration: { columnId: 'duration', columnDef: mockColumnDuration, searchTerms: ['-'], type: FieldType.string, },
      } as ColumnFilters;

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateFilters(mockColumnFilters, false);
      const query = service.buildQuery();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
    });
  });

  describe('updateSorters method', () => {
    beforeEach(() => {
      const columns = [{ id: 'company', field: 'company' }, { id: 'gender', field: 'gender' }, { id: 'name', field: 'name' }];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columns);
    });

    it('should return a query with the multiple new sorting when using multiColumnSort', () => {
      const expectation = `query{ users(first:10, offset:0,
                            orderBy:[{field:gender, direction: DESC}, {field:firstName, direction: ASC}]) {
                            totalCount,nodes{ id, company, gender, name } }}`;
      const mockColumnSort = [
        { columnId: 'gender', sortCol: { id: 'gender', field: 'gender' }, sortAsc: false },
        { columnId: 'firstName', sortCol: { id: 'firstName', field: 'firstName' }, sortAsc: true }
      ] as ColumnSort[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(mockColumnSort);
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual([{ columnId: 'gender', direction: 'DESC' }, { columnId: 'firstName', direction: 'ASC' }]);
    });

    it('should return a query when using presets array', () => {
      const expectation = `query{ users(first:10, offset:0,
                            orderBy:[{field:company, direction: DESC}, {field:firstName, direction: ASC}]) {
                              totalCount, nodes{ id, company, gender, name } }}`;
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
      const expectation = `query{ users(first:10, offset:0,
                            orderBy:[{field:gender, direction: DESC}, {field:firstName, direction: ASC}]) {
                            totalCount,nodes{ id, company, gender, name } }}`;
      const mockColumnSort = [
        { columnId: 'gender', sortCol: { id: 'gender', field: 'gender' }, sortAsc: false },
        { columnId: 'name', sortCol: { id: 'name', field: 'name', queryField: 'firstName' }, sortAsc: true }
      ] as ColumnSort[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(mockColumnSort);
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual([{ columnId: 'gender', direction: 'DESC' }, { columnId: 'name', direction: 'ASC' }]);
    });

    it('should return a query string using a different field to query when the column has a "queryFieldSorter" defined in its definition', () => {
      const expectation = `query{ users(first:10, offset:0,
                            orderBy:[{field:gender, direction: DESC}, {field:lastName, direction: ASC}]) {
                            totalCount,nodes{ id, company, gender, name } }}`;
      const mockColumnSort = [
        { columnId: 'gender', sortCol: { id: 'gender', field: 'gender' }, sortAsc: false },
        { columnId: 'name', sortCol: { id: 'name', field: 'name', queryField: 'isAfter', queryFieldSorter: 'lastName' }, sortAsc: true }
      ] as ColumnSort[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(mockColumnSort);
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual([{ columnId: 'gender', direction: 'DESC' }, { columnId: 'name', direction: 'ASC' }]);
    });

    it('should return a query without the field sorter when its field property is missing', () => {
      const expectation = `query { users(first:10, offset:0, orderBy:[{field:gender, direction:DESC}]) {
                          totalCount, nodes { id,company,gender,name }}}`;
      const mockColumnSort = [
        { columnId: 'gender', sortCol: { id: 'gender', field: 'gender' }, sortAsc: false },
        { columnId: 'firstName', sortCol: { id: 'firstName' }, sortAsc: true }
      ] as ColumnSort[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(mockColumnSort);
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual([{ columnId: 'gender', direction: 'DESC' }, { columnId: 'firstName', direction: 'ASC' }]);
    });

    it('should return a query without any sorting after clearSorters was called', () => {
      const expectation = `query { users(first:10, offset:0) {
        totalCount, nodes { id,company,gender,name }}}`;
      const mockColumnSort = [
        { columnId: 'gender', sortCol: { id: 'gender', field: 'gender' }, sortAsc: false },
        { columnId: 'firstName', sortCol: { id: 'firstName', field: 'firstName' }, sortAsc: true }
      ] as ColumnSort[];

      service.init(serviceOptions, paginationOptions, gridStub);
      service.updateSorters(mockColumnSort);
      service.clearSorters();
      const query = service.buildQuery();
      const currentSorters = service.getCurrentSorters();

      expect(removeSpaces(query)).toBe(removeSpaces(expectation));
      expect(currentSorters).toEqual([]);
    });
  });
});
