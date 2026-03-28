import type {
  BackendService,
  Column,
  ColumnFilters,
  CurrentFilter,
  CurrentPagination,
  CurrentSorter,
  FilterChangedArgs,
  MultiColumnSort,
  OperatorType,
  Pagination,
  PaginationChangedArgs,
  PaginationCursorChangedArgs,
  SingleColumnSort,
  SlickGrid,
  SortDirection,
} from '@slickgrid-universal/common';
import { getHtmlStringOutput, stripTags } from '@slickgrid-universal/utils';
import type { SqlResult } from '../interfaces/sqlResult.interface.js';
import type { SqlFilteringOption, SqlServiceOption, SqlSortingOption } from '../interfaces/sqlServiceOption.interface.js';

const DEFAULT_ITEMS_PER_PAGE = 25;
const DEFAULT_PAGE_SIZE = 20;

/**
 * SqlService implements BackendService for SQL query generation.
 * This is a basic implementation; extend as needed for your SQL dialect.
 */
export class SqlService implements BackendService {
  options?: SqlServiceOption;
  protected _currentFilters: ColumnFilters | CurrentFilter[] = [];
  protected _currentPagination: CurrentPagination | null = null;
  protected _currentSorters: CurrentSorter[] = [];
  protected _columns?: any[];
  protected _grid: SlickGrid | undefined;
  pagination?: Pagination;

  init(serviceOptions?: SqlServiceOption, pagination?: Pagination, grid?: SlickGrid): void {
    this.options = serviceOptions || { tableName: '' };
    this._grid = grid;
    if (typeof grid?.getColumns === 'function') {
      this._columns = grid.getColumns() ?? [];
    }
    if (pagination) {
      this._currentPagination = {
        pageNumber: pagination.pageNumber ?? 1,
        pageSize: pagination.pageSize ?? DEFAULT_PAGE_SIZE,
      };
      // Save the full pagination object for totalItems
      this.pagination = pagination;
    } else {
      this._currentPagination = {
        pageNumber: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      };
      this.pagination = undefined;
    }
  }

  buildQuery(): string {
    if (!this.options || !this.options.tableName || !Array.isArray(this._columns)) {
      throw new Error('SQL Service requires the "tableName" property and columns to properly build the SQL query');
    }
    // Use datasetName as schema/database prefix if provided
    const table = this.options.datasetName ? `${this.options.datasetName}.${this.options.tableName}` : this.options.tableName;
    // Build the list of fields for SELECT
    let selectFields: string[] = [];
    for (const col of this._columns) {
      // Only flat fields (no dot notation)
      if (typeof col.field === 'string' && !col.field.includes('.')) {
        if (!col.excludeFromQuery && !col.excludeFieldFromQuery) {
          selectFields.push(col.field);
        }
      }
      // Add extra fields from the 'fields' property if present (and flat)
      if (Array.isArray(col.fields)) {
        for (const extraField of col.fields) {
          if (typeof extraField === 'string' && !extraField.includes('.')) {
            selectFields.push(extraField);
          }
        }
      }
    }
    // Remove duplicates
    selectFields = Array.from(new Set(selectFields));
    // If all flat fields are included and no extra fields, use SELECT *
    const allFlatCols = this._columns.filter((col) => typeof col.field === 'string' && !col.field.includes('.'));
    const allIncluded = selectFields.length === allFlatCols.length && allFlatCols.every((col) => selectFields.includes(col.field));
    let selectCols = allIncluded && selectFields.length > 0 ? '*' : selectFields.join(', ');
    if (!selectCols || selectCols.trim() === '') {
      selectCols = '*';
    }
    const where = this._buildWhereClause();
    const order = this._buildOrderByClause();
    // Pagination logic
    let pageSize = this._currentPagination?.pageSize || DEFAULT_PAGE_SIZE;
    let pageNumber = this._currentPagination?.pageNumber;
    if (!pageNumber && pageNumber !== 0) {
      pageNumber = 1;
    }

    // Infinite scroll: use fetchSize if provided, else pageSize
    let limit = '',
      offset = '';
    const infiniteScroll = this.options?.infiniteScroll;
    let effectivePageSize = pageSize;
    if (infiniteScroll) {
      if (typeof infiniteScroll === 'object' && typeof infiniteScroll.fetchSize === 'number') {
        effectivePageSize = infiniteScroll.fetchSize;
      }
    }
    if (this._grid?.getOptions && this._grid.getOptions()?.enablePagination === false) {
      limit = '';
      offset = '';
    } else {
      limit = effectivePageSize ? `LIMIT ${effectivePageSize}` : '';
      // Offset should never be below zero
      const calcOffset = Math.max(0, ((pageNumber ?? 1) - 1) * (effectivePageSize ?? DEFAULT_ITEMS_PER_PAGE));
      offset = effectivePageSize ? `OFFSET ${calcOffset}` : '';
    }

    // Allow user to customize the total count field name
    const totalCountField = this.options.totalCountField || 'totalCount';
    // Add the total count window function
    const selectWithCount =
      selectCols === '*' ? `*, COUNT(*) OVER() AS "${totalCountField}"` : `${selectCols}, COUNT(*) OVER() AS "${totalCountField}"`;

    return `SELECT ${selectWithCount} FROM ${table}${where}${order} ${limit} ${offset}`.trim();
  }

  /**
   * Build a comma-separated list of valid, flat (non-dot notation) column names for SQL SELECT.
   * Ignores empty, null, undefined, or dot notation fields.
   */
  buildFilterQuery(columns: (string | null | undefined)[]): string {
    if (!Array.isArray(columns)) return '';
    return columns.filter((col): col is string => !!col && typeof col === 'string' && !col.includes('.')).join(', ');
  }

  /**
   * Post-process the SQL result to extract total count for pagination.
   * Uses the configured totalCountField option (default: 'totalCount').
   */
  postProcess<T = any>(processResult: SqlResult<T> | T[] | { data?: T[]; [key: string]: any }): void {
    if (this.pagination) {
      const totalCountField = this.options?.totalCountField || 'totalCount';
      // SQL: result is SqlResult<T>
      if (processResult && Array.isArray((processResult as SqlResult<T>).data) && (processResult as SqlResult<T>).data.length > 0) {
        const firstRow = (processResult as SqlResult<T>).data[0];
        if (firstRow && typeof (firstRow as any)[totalCountField] === 'number') {
          this.pagination.totalItems = (firstRow as any)[totalCountField];
          return;
        }
      }
      // SQL: result is an array of rows
      if (Array.isArray(processResult) && processResult.length > 0 && typeof (processResult[0] as any)[totalCountField] === 'number') {
        this.pagination.totalItems = (processResult[0] as any)[totalCountField];
        return;
      }
      // Fallback: flat totalCount
      if (typeof (processResult as any)[totalCountField] === 'number') {
        this.pagination.totalItems = (processResult as any)[totalCountField];
      }
    }
  }

  clearFilters(): void {
    this._currentFilters = [];
    this.updateOptions({ filteringOptions: [] });
  }

  clearSorters(): void {
    this._currentSorters = [];
    this.updateOptions({ sortingOptions: [] });
  }

  getDatasetName(): string {
    return this.options?.datasetName || '';
  }

  getTableName(): string {
    return this.options?.tableName || '';
  }

  getCurrentFilters(): ColumnFilters | CurrentFilter[] {
    return this._currentFilters;
  }

  getCurrentPagination(): CurrentPagination | null {
    return this._currentPagination;
  }

  getCurrentSorters(): CurrentSorter[] {
    return this._currentSorters;
  }

  /**
   * Returns the initial pagination options for SQL queries.
   * Returns { pageSize, offset } based on current or default pagination.
   */
  getInitPaginationOptions(): { pageSize: number; offset: number } {
    let pageSize = this._currentPagination?.pageSize;
    let pageNumber = this._currentPagination?.pageNumber;
    if (!pageSize) pageSize = DEFAULT_PAGE_SIZE;
    if (!pageNumber && pageNumber !== 0) pageNumber = 1;
    const offset = Math.max(0, (pageNumber - 1) * pageSize);
    return { pageSize, offset };
  }

  /*
   * Reset the pagination options
   */
  resetPaginationOptions(): void {
    if (this._currentPagination) {
      this._currentPagination.pageNumber = 1;
    }
  }

  updateFilters(columnFilters: ColumnFilters | CurrentFilter[], isUpdatedByPresetOrDynamically: boolean): void {
    // OData-style updateFilters for SQL: identical structure to OData service
    const filteringOptions: SqlFilteringOption[] = [];
    if (isUpdatedByPresetOrDynamically) {
      this._currentFilters = this.castFilterToColumnFilters(columnFilters);
    }

    for (const columnId in columnFilters) {
      if (!Object.prototype.hasOwnProperty.call(columnFilters, columnId)) continue;
      const columnFilter = (columnFilters as any)[columnId];

      let columnDef: Column | undefined;
      if (isUpdatedByPresetOrDynamically && Array.isArray(this._columns)) {
        columnDef = this._columns.find((col: Column) => col.id === columnFilter.columnId);
      } else {
        columnDef = columnFilter.columnDef;
      }
      if (!columnDef) {
        throw new Error('[SQL Service]: Something went wrong in trying to get the column definition');
      }

      let fieldName =
        columnDef.filter?.queryField || columnDef.queryFieldFilter || columnDef.queryField || columnDef.field || columnDef.name || '';
      if (fieldName instanceof HTMLElement) {
        fieldName = stripTags(fieldName.innerHTML);
      }
      const fieldType = columnDef.type || 'string';
      let searchTerms = (columnFilter?.searchTerms ? [...columnFilter.searchTerms] : null) || [];
      let fieldSearchValue = Array.isArray(searchTerms) && searchTerms.length === 1 ? searchTerms[0] : '';
      if (typeof fieldSearchValue === 'undefined') fieldSearchValue = '';

      if (!fieldName) {
        throw new Error(
          'SQL filter could not find the field name to query the search, your column definition must include a valid "field" or "name" (optionally you can also use the "queryfield").'
        );
      }

      if (this.options?.useVerbatimSearchTerms || columnFilter.verbatimSearchTerms) {
        if (Array.isArray(columnFilter.searchTerms)) {
          if (columnFilter.searchTerms.length === 1) {
            filteringOptions.push({
              field: getHtmlStringOutput(fieldName),
              operator: '=',
              value: columnFilter.searchTerms[0],
              type: fieldType,
            });
          } else {
            filteringOptions.push({
              field: getHtmlStringOutput(fieldName),
              operator: 'IN',
              value: columnFilter.searchTerms,
              type: fieldType,
            });
          }
        } else {
          filteringOptions.push({
            field: getHtmlStringOutput(fieldName),
            operator: columnFilter.operator || '',
            value: columnFilter.searchTerms,
            type: fieldType,
          });
        }
        continue;
      }

      fieldSearchValue = fieldSearchValue === undefined || fieldSearchValue === null ? '' : `${fieldSearchValue}`;

      // run regex to find possible filter operators unless the user disabled the feature
      const autoParseInputFilterOperator =
        columnDef.autoParseInputFilterOperator ?? this._grid?.getOptions?.().autoParseInputFilterOperator;

      // group (2): comboStartsWith, (3): comboEndsWith, (4): Operator, (1 or 5): searchValue, (6): last char is '*' (meaning starts with, ex.: abc*)
      const matches =
        autoParseInputFilterOperator !== false
          ? fieldSearchValue.match(/^((.*[^\\*\r\n])[*]{1}(.*[^*\r\n]))|^([<>!=*]{0,2})(.*[^<>!=*])([*]?)$/) || []
          : [fieldSearchValue, '', '', '', '', fieldSearchValue, ''];

      const comboStartsWith = matches?.[2] || '';
      const comboEndsWith = matches?.[3] || '';
      let operator = columnFilter.operator || matches?.[4];
      let searchVal = matches?.[1] || matches?.[5] || '';
      const lastValueChar = matches?.[6] || operator === '*z' || operator === 'EndsWith' ? '*' : '';

      // no need to query if search value is empty
      if (fieldName && searchVal === '' && searchTerms.length === 0) {
        continue;
      }

      // StartsWith + EndsWith combo
      if (comboStartsWith && comboEndsWith) {
        searchTerms = [comboStartsWith, comboEndsWith];
        operator = 'StartsWithEndsWith';
      } else if (
        Array.isArray(searchTerms) &&
        searchTerms.length === 1 &&
        typeof searchTerms[0] === 'string' &&
        searchTerms[0].indexOf('..') >= 0
      ) {
        if (operator !== 'RangeInclusive' && operator !== 'RangeExclusive') {
          operator = this._grid?.getOptions?.().defaultFilterRangeOperator ?? 'RangeInclusive';
        }
        searchTerms = searchTerms[0].split('..', 2);
        if (searchTerms[0] === '') {
          operator = operator === 'RangeInclusive' ? '<=' : operator === 'RangeExclusive' ? '<' : operator;
          searchTerms = searchTerms.slice(1);
          searchVal = searchTerms[0];
        } else if (searchTerms[1] === '') {
          operator = operator === 'RangeInclusive' ? '>=' : operator === 'RangeExclusive' ? '>' : operator;
          searchTerms = searchTerms.slice(0, 1);
          searchVal = searchTerms[0];
        }
      }

      if (typeof searchVal === 'string') {
        if (operator === '*' || operator === 'a*' || operator === '*z' || lastValueChar === '*') {
          operator = (operator === '*' || operator === '*z' ? 'EndsWith' : 'StartsWith') as OperatorType;
        }
      }

      // if we didn't find an Operator but we have a Column Operator inside the Filter (DOM Element), we should use its default Operator
      if (!operator && columnDef.filter) {
        operator = columnDef.filter.operator;
      }

      // No operator and 2 search terms should lead to default range operator.
      if (!operator && Array.isArray(searchTerms) && searchTerms.length === 2 && searchTerms[0] && searchTerms[1]) {
        operator = this._grid?.getOptions?.().defaultFilterRangeOperator;
      }

      // Range with 1 searchterm should lead to equals for a date field.
      if (
        (operator === 'RangeInclusive' || operator === 'RangeExclusive') &&
        Array.isArray(searchTerms) &&
        searchTerms.length === 1 &&
        fieldType === 'date'
      ) {
        operator = 'EQ';
      }

      // if we still don't have an operator find the proper Operator to use according to field type
      if (!operator) {
        operator = fieldType === 'number' || fieldType === 'integer' || fieldType === 'float' ? '=' : 'LIKE';
      }

      // Normalize all search values
      searchVal = this.normalizeSearchValue(fieldType, searchVal);
      if (Array.isArray(searchTerms)) {
        searchTerms.forEach((_part, index) => {
          searchTerms[index] = this.normalizeSearchValue(fieldType, searchTerms[index]);
        });
      }

      // StartsWith + EndsWith combo
      if (operator === 'StartsWithEndsWith' && Array.isArray(searchTerms) && searchTerms.length === 2) {
        filteringOptions.push({ field: getHtmlStringOutput(fieldName), operator: 'LIKE', value: `${searchTerms[0]}%`, type: fieldType });
        filteringOptions.push({ field: getHtmlStringOutput(fieldName), operator: 'LIKE', value: `%${searchTerms[1]}`, type: fieldType });
        continue;
      }
      // IN/NOT IN
      if (searchTerms?.length > 1 && (operator === 'IN' || operator === 'NIN' || operator === 'NOT_IN')) {
        filteringOptions.push({
          field: getHtmlStringOutput(fieldName),
          operator: operator === 'IN' ? 'IN' : 'NOT IN',
          value: searchTerms,
          type: fieldType,
        });
        continue;
      } else if (searchTerms?.length === 2 && (operator === 'RangeExclusive' || operator === 'RangeInclusive')) {
        filteringOptions.push({
          field: getHtmlStringOutput(fieldName),
          operator: operator === 'RangeInclusive' ? '>=' : '>',
          value: searchTerms[0],
          type: fieldType,
        });
        filteringOptions.push({
          field: getHtmlStringOutput(fieldName),
          operator: operator === 'RangeInclusive' ? '<=' : '<',
          value: searchTerms[1],
          type: fieldType,
        });
        continue;
      }

      // Always map these string operators before fallback for OData/GraphQL parity
      if (fieldType === 'string' || fieldType === 'text' || fieldType === 'readonly') {
        if (operator === '<>' || operator === 'Not_Contains' || operator === 'NOT_CONTAINS') {
          filteringOptions.push({ field: getHtmlStringOutput(fieldName), operator: 'NOT LIKE', value: `%${searchVal}%`, type: fieldType });
          continue;
        }
        if (operator === 'Contains' || operator === 'CONTAINS') {
          filteringOptions.push({ field: getHtmlStringOutput(fieldName), operator: 'LIKE', value: `%${searchVal}%`, type: fieldType });
          continue;
        }
        if (operator === '*' || operator === '*z' || operator === 'EndsWith') {
          filteringOptions.push({ field: getHtmlStringOutput(fieldName), operator: 'LIKE', value: `%${searchVal}`, type: fieldType });
          continue;
        }
        if (operator === 'StartsWith' || operator === 'a*' || lastValueChar === '*') {
          filteringOptions.push({ field: getHtmlStringOutput(fieldName), operator: 'LIKE', value: `${searchVal}%`, type: fieldType });
          continue;
        }
      }

      // Fallback: use field/operator/value
      filteringOptions.push({ field: getHtmlStringOutput(fieldName), operator: operator ?? '=', value: searchVal, type: fieldType });
    }

    this.updateOptions({ filteringOptions });
  }

  updatePagination(newPage: number, pageSize: number, _cursorArgs?: PaginationCursorChangedArgs): void {
    const finalPageSize = pageSize || DEFAULT_PAGE_SIZE;
    this._currentPagination = { pageNumber: newPage, pageSize: finalPageSize };
    this.updateOptions({ paginationOptions: { pageNumber: newPage, pageSize: finalPageSize } });
  }

  updateSorters(sortColumns?: Array<SingleColumnSort>, presetSorters?: CurrentSorter[]): void {
    let currentSorters: CurrentSorter[] = [];
    const sqlSorters: SqlSortingOption[] = [];

    if (!sortColumns && presetSorters) {
      // make the presets the current sorters, also make sure that all direction are in uppercase for GraphQL
      currentSorters = presetSorters;
      currentSorters.forEach((sorter) => (sorter.direction = sorter.direction.toUpperCase() as SortDirection));

      // display the correct sorting icons on the UI, for that it requires (columnId, sortAsc) properties
      const tmpSorterArray = currentSorters.map((sorter) => {
        const columnDef = this._columns?.find((column: Column) => column.id === sorter.columnId);

        sqlSorters.push({
          field: columnDef ? (columnDef.queryFieldSorter || columnDef.queryField || columnDef.field) + '' : sorter.columnId + '',
          direction: sorter.direction,
        });

        // return only the column(s) found in the Column Definitions ELSE null
        if (columnDef) {
          return {
            columnId: sorter.columnId,
            sortAsc: sorter.direction.toUpperCase() === 'ASC',
          };
        }
        return null;
      }) as { columnId: string | number; sortAsc: boolean }[] | null;

      // set the sort icons, but also make sure to filter out null values (that happens when columnDef is not found)
      if (Array.isArray(tmpSorterArray) && this._grid) {
        this._grid.setSortColumns(tmpSorterArray.filter((sorter) => sorter) || []);
      }
    } else if (sortColumns && !presetSorters) {
      // build the orderBy array, it could be multisort, example
      // orderBy:[{field: lastName, direction: ASC}, {field: firstName, direction: DESC}]
      if (Array.isArray(sortColumns) && sortColumns.length > 0) {
        for (const sortColumn of sortColumns) {
          if (sortColumn && sortColumn.sortCol) {
            currentSorters.push({
              columnId: sortColumn.sortCol.id + '',
              direction: sortColumn.sortAsc ? 'ASC' : 'DESC',
            });

            const fieldName = (sortColumn.sortCol.queryFieldSorter || sortColumn.sortCol.queryField || sortColumn.sortCol.field || '') + '';
            if (fieldName) {
              sqlSorters.push({
                field: fieldName,
                direction: sortColumn.sortAsc ? 'ASC' : 'DESC',
              });
            }
          }
        }
      }
    }

    // keep current Sorters and update the service options with the new sorting
    this._currentSorters = currentSorters;
    this.updateOptions({ sortingOptions: sqlSorters });
  }

  updateOptions(serviceOptions?: Partial<SqlServiceOption>): void {
    this.options = {
      ...this.options,
      ...serviceOptions,
      datasetName: this.options?.datasetName || '',
      tableName: this.options?.tableName || '',
    };
  }

  processOnFilterChanged(_event: Event | KeyboardEvent | undefined, args: FilterChangedArgs): string {
    if (!args || !args.grid) {
      throw new Error('SQLService: "args" is not populated correctly');
    }
    // keep current filters & always save it as an array (columnFilters can be an object when it is dealt by SlickGrid Filter)
    this._currentFilters = this.castFilterToColumnFilters(args.columnFilters);

    // loop through all columns to inspect filters & set the query
    this.updateFilters(args.columnFilters, false);
    this.resetPaginationOptions();
    return this.buildQuery();
  }

  processOnPaginationChanged(
    _event: Event | undefined,
    args: PaginationChangedArgs | (PaginationCursorChangedArgs & PaginationChangedArgs)
  ): string {
    // Use current pageSize if not provided in args
    const pageSize = args.pageSize ?? this._currentPagination?.pageSize ?? DEFAULT_PAGE_SIZE;
    this.updatePagination(args.newPage, pageSize);
    return this.buildQuery();
  }

  processOnSortChanged(_event: Event | undefined, args: SingleColumnSort | MultiColumnSort): string {
    if ('sortCols' in args) {
      // MultiColumnSort: pass the array of SingleColumnSort
      this.updateSorters(args.sortCols as SingleColumnSort[]);
    } else {
      // SingleColumnSort: wrap in array
      this.updateSorters([args as SingleColumnSort]);
    }
    return this.buildQuery();
  }

  protected _buildWhereClause(): string {
    // Build WHERE clause from filteringOptions
    const filteringOptions = this.options?.filteringOptions || [];
    if (!Array.isArray(filteringOptions) || filteringOptions.length === 0) {
      return '';
    }

    const clauses: string[] = [];
    for (const filter of filteringOptions) {
      const { field, operator, value, type } = filter;
      if (!field || !operator) continue;
      let sqlOperator = operator === 'EQ' ? '=' : operator;
      if (sqlOperator === 'Contains') {
        sqlOperator = 'LIKE';
      }
      if (sqlOperator === 'NOT_CONTAINS') {
        sqlOperator = 'NOT LIKE';
      }
      if (sqlOperator === '=' && value === null) {
        clauses.push(`${field} IS NULL`);
      } else if (sqlOperator === 'IN' || sqlOperator === 'NOT IN') {
        if (Array.isArray(value)) {
          if (value.length === 0) continue;
          const inList = value.map((v) => this._escapeSql(v, type)).join(',');
          clauses.push(`${field} ${sqlOperator} (${inList})`);
        } else {
          clauses.push(`${field} ${sqlOperator} (${this._escapeSql(value, type)})`);
        }
      } else if (sqlOperator === 'LIKE' || sqlOperator === 'NOT LIKE') {
        let likeValue = value;
        if (typeof likeValue === 'string' && !likeValue.includes('%')) {
          likeValue = `%${likeValue}%`;
        }
        clauses.push(`${field} ${sqlOperator} ${this._escapeSql(likeValue, type)}`);
      } else {
        clauses.push(`${field} ${sqlOperator} ${this._escapeSql(value, type)}`);
      }
    }
    return clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  }

  protected _buildOrderByClause(): string {
    if (!this.options || !this.options.tableName || !Array.isArray(this._columns)) {
      throw new Error('SQL Service requires the "tableName" property to properly build the SQL query');
    }

    const order = this.options.sortingOptions
      ?.map((s) => {
        // Find the column definition by id
        const colDef = this._columns?.find((col) => col.id === s.field);
        let sortField = colDef
          ? String(colDef.queryFieldSorter || colDef.queryField || colDef.field || colDef.id || s.field)
          : String(s.field);

        // Only include flat fields (no dot notation)
        if (!sortField.includes('.')) {
          return `${sortField} ${s.direction}`;
        }
        return '';
      })
      .join(', ');
    return order ? ` ORDER BY ${order}` : '';
  }

  protected castFilterToColumnFilters(columnFilters: ColumnFilters | CurrentFilter[]): CurrentFilter[] {
    if (Array.isArray(columnFilters)) {
      // Ensure all columnId are strings for CurrentFilter
      return columnFilters.map((f) => ({
        ...f,
        columnId: String(f.columnId),
      }));
    }
    // For object form, ensure columnId is string
    return Object.keys(columnFilters).map((key) => {
      const filter = columnFilters[key];
      return {
        ...filter,
        columnId: String(filter.columnId),
      };
    });
  }

  protected _escapeSql(val: any, type?: string): string {
    if (type === 'number' || type === 'integer' || type === 'float' || typeof val === 'number') {
      return val.toString();
    }
    if (val === null || val === undefined) {
      return 'NULL';
    }
    if (val === '') {
      return "''";
    }

    // Escape single quotes for SQL
    return `'${String(val).replace(/'/g, "''")}'`;
  }

  /**
   * Normalizes the search value according to field type (mirrors GraphqlService logic).
   */
  protected normalizeSearchValue(fieldType: string, searchValue: any): any {
    switch (fieldType) {
      case 'date':
      case 'string':
      case 'text':
      case 'readonly':
        if (typeof searchValue === 'string') {
          // escape single quotes by doubling them
          searchValue = searchValue.replace(/'/g, `''`);
        }
        break;
      case 'integer':
      case 'number':
      case 'float':
        if (typeof searchValue === 'string') {
          // Parse a valid decimal from the string.
          searchValue = searchValue.replace(/\.{2,}/g, '.'); // Replace double dots with single dot
          searchValue = searchValue.replace(/\.+$/g, ''); // Remove trailing dot(s)
          searchValue = searchValue.replace(/^\.+/g, '0.'); // Prefix leading dot with 0.
          searchValue = searchValue.replace(/^-+\.+/g, '-0.'); // Prefix leading dash dot with -0.
          searchValue = searchValue.replace(/(?!^-)[^\d.]/g, ''); // Remove non valid decimal chars
          if (searchValue === '' || searchValue === '-') {
            searchValue = '0';
          }
        }
        break;
    }
    return searchValue;
  }
}
