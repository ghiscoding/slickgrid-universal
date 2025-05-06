import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OdataQueryBuilderService } from '../odataQueryBuilder.service.js';

describe('OdataService', () => {
  let service: OdataQueryBuilderService;

  beforeEach(() => {
    service = new OdataQueryBuilderService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  describe('buildQuery method', () => {
    beforeEach(() => {
      service.options = { filterQueue: [], orderBy: '' };
    });

    it('should throw an error when odata options are null', () => {
      service.options = undefined as any;
      expect(() => service.buildQuery()).toThrow();
    });

    it('should return a query with $top pagination', () => {
      const expectation = '$top=25';

      service.options = { top: 25 };
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should return a query with $top and $skip pagination', () => {
      const expectation = '$top=25&$skip=10';

      service.options = { top: 25, skip: 10 };
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should return a query with sorting when "orderBy" is provided as a string', () => {
      const expectation = '$top=10&$orderby=Gender asc';

      service.options = { top: 10, orderBy: 'Gender asc' };
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should return a query with sorting when "orderBy" is provided as an array', () => {
      const expectation = '$top=10&$orderby=Gender asc,Company desc';

      service.options = { top: 10, orderBy: ['Gender asc', 'Company desc'] };
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should return a query with filters when "filter" is provided as a string', () => {
      const expectation = `$top=10&$filter=(FirstName eq 'John')`;

      service.options = { top: 10, filter: `FirstName eq 'John'` };
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should return a query with filters when "filterBy" is provided as a string', () => {
      const expectation = `$top=10&$filter=(FirstName eq 'John')`;

      service.options = { top: 10, filterBy: `FirstName eq 'John'` };
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should return a query with filters when "filterBy" is provided as an array', () => {
      const expectation = `$top=10&$filter=(FirstName eq 'John' and FirstName eq 'Jane')`;

      service.options = { top: 10, filter: [`FirstName eq 'John'`, `FirstName eq 'Jane'`] };
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should return a query with filters when "filterBy" is provided as an array', () => {
      const expectation = `$top=10&$filter=(FirstName eq 'John' or FirstName eq 'Jane')`;

      service.options = { top: 10, filterBy: [`FirstName eq 'John'`, `FirstName eq 'Jane'`], filterBySeparator: 'or' };
      const query = service.buildQuery();
      const filterCount = service.getFilterCount();

      expect(query).toBe(expectation);
      expect(filterCount).toBe(2);
    });

    describe('enableSelect and enableExpand flags', () => {
      it('should return a query with $select when "enableSelect" is set', () => {
        service.columnDefinitions = [
          { id: 'id1', field: 'fld1' },
          { id: 'id2', field: 'fld2' },
          { id: 'id3', field: '', fields: ['fld2', 'fld3'] },
        ];
        const expectation = `$select=id,fld1,fld2,fld3`;

        service.options = { enableSelect: true };
        const query = service.buildQuery();

        expect(query).toBe(expectation);
      });

      it('should return a query with $select when "enableSelect" is set and a custom "datasetIdPropName" is set', () => {
        service.columnDefinitions = [{ id: 'id1', field: 'fld1' }];
        const expectation = `$select=custid,fld1`;

        service.options = { enableSelect: true };
        service.datasetIdPropName = 'custid';
        const query = service.buildQuery();

        expect(query).toBe(expectation);
      });

      it('should return a query with $expand when "enableExpand" is set', () => {
        service.columnDefinitions = [
          { id: 'id1', field: 'fld1' },
          { id: 'id2', field: 'nav1/fld1' },
          { id: 'id3', field: 'nav1/fld2' },
          { id: 'id4', field: 'nav2/nav3/fld1' },
        ];
        const expectation = `$expand=nav1,nav2`;

        service.options = { enableExpand: true };
        const query = service.buildQuery();

        expect(query).toBe(expectation);
      });

      it('should return a query with $select and $expand when "enableSelect" and "enableExpand" are set and no OData version provided, or oData version 2 or 3', () => {
        service.columnDefinitions = [
          { id: 'id1', field: 'fld1' },
          { id: 'id2', field: 'nav1/fld1' },
          { id: 'id3', field: 'nav1/fld2' },
          { id: 'id4', field: 'nav2/nav3/fld1' },
        ];
        const expectation = `$select=id,fld1,nav1,nav2&$expand=nav1,nav2`;

        service.options = { enableSelect: true, enableExpand: true };
        const query1 = service.buildQuery();

        service.options = { enableSelect: true, enableExpand: true, version: 2 };
        const query2 = service.buildQuery();

        service.options = { enableSelect: true, enableExpand: true, version: 3 };
        const query3 = service.buildQuery();

        expect(query1).toBe(expectation);
        expect(query2).toBe(expectation);
        expect(query3).toBe(expectation);
      });

      it('should return a query with $select and $expand when "enableSelect" and "enableExpand" are set with OData version 4 or higher', () => {
        service.columnDefinitions = [
          { id: 'id1', field: 'fld1' },
          { id: 'id2', field: 'nav1/fld1' },
          { id: 'id3', field: 'nav1/fld2' },
          { id: 'id4', field: 'nav2/nav3/fld1' },
        ];
        const expectation = `$select=id,fld1&$expand=nav1($select=fld1,fld2),nav2($expand=nav3($select=fld1))`;

        service.options = { enableSelect: true, enableExpand: true, version: 4 };
        const query1 = service.buildQuery();

        service.options = { enableSelect: true, enableExpand: true, version: 5 };
        const query2 = service.buildQuery();

        expect(query1).toBe(expectation);
        expect(query2).toBe(expectation);
      });

      it('should return a query with $select and $expand when "enableSelect" and "enableExpand" are set with OData version 4 or higher and selecting both a field and a navigation from a navigation', () => {
        service.columnDefinitions = [
          { id: 'id', field: 'id' },
          { id: 'id1', field: 'nav/fld1' },
          { id: 'id2', field: 'nav/fld2' },
          { id: 'id3', field: 'nav/nav2/fld2' },
        ];
        const expectation = `$select=id&$expand=nav($select=fld1,fld2;$expand=nav2($select=fld2))`;

        service.options = { enableSelect: true, enableExpand: true, version: 4 };
        const query1 = service.buildQuery();

        service.options = { enableSelect: true, enableExpand: true, version: 5 };
        const query2 = service.buildQuery();

        expect(query1).toBe(expectation);
        expect(query2).toBe(expectation);
      });
    });
  });

  describe('saveColumnFilter method', () => {
    it('should return "columnFilters" object with multiple properties as the filter names', () => {
      service.saveColumnFilter('FirstName', 'John', ['John']);

      const columnFilters = service.columnFilters;

      expect(columnFilters).toEqual({ FirstName: { search: ['John'], value: 'John' } });
    });

    it('should return "columnFilters" object with multiple properties as the filter names', () => {
      service.saveColumnFilter('FirstName', 'John', ['John']);
      service.saveColumnFilter('LastName', 'Doe', ['Doe']);

      const columnFilters = service.columnFilters;

      expect(columnFilters).toEqual({
        FirstName: { search: ['John'], value: 'John' },
        LastName: { search: ['Doe'], value: 'Doe' },
      });
    });
  });

  describe('removeColumnFilter method', () => {
    it('should return "columnFilters" object without the one deleted', () => {
      service.saveColumnFilter('FirstName', 'John', ['John']);
      service.saveColumnFilter('LastName', 'Doe', ['Doe']);

      service.removeColumnFilter('LastName');
      const columnFilters = service.columnFilters;

      expect(columnFilters).toEqual({
        FirstName: { search: ['John'], value: 'John' },
      });
    });
  });

  describe('updateOptions method', () => {
    beforeEach(() => {
      service.updateOptions({ caseType: 'pascalCase' });
    });

    it('should be able to provide "filterBy" array and expect see the query string include the filter', () => {
      const expectation = `$filter=(FirstName eq 'John')`;

      service.updateOptions({ filterBy: `FirstName eq 'John'` });
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should be able to provide "filterBy" array and expect see the query string include the filter', () => {
      const expectation = `$filter=(FirstName eq 'John' and substring(Gender 'male')`;

      service.updateOptions({ filterBy: [`FirstName eq 'John'`, `substring(Gender 'male'`] });
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should be able to provide "orderBy" array and expect see the query string include the filter', () => {
      const expectation = `$orderby=FirstName desc`;

      service.updateOptions({ orderBy: 'FirstName desc' });
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should be able to provide "orderBy" array and expect see the query string include the filter', () => {
      const expectation = `$orderby=FirstName desc,LastName asc`;

      service.updateOptions({ orderBy: ['FirstName desc', 'LastName asc'] });
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });
  });

  describe('enableCount flag', () => {
    it('should return a query with "$inlinecount" when "enableCount" is set and no OData version is provided', () => {
      const expectation = `$inlinecount=allpages&$top=10&$filter=(FirstName eq 'John')`;

      service.options = { top: 10, filterBy: `FirstName eq 'John'`, enableCount: true };
      const query = service.buildQuery();

      expect(query).toBe(expectation);
    });

    it('should return a query with "$inlinecount" when "enableCount" is set with OData version 2 or 3', () => {
      const expectation = `$inlinecount=allpages&$top=10&$filter=(FirstName eq 'John')`;

      service.options = { top: 10, filterBy: `FirstName eq 'John'`, enableCount: true, version: 2 };
      const query1 = service.buildQuery();

      service.options = { top: 10, filterBy: `FirstName eq 'John'`, enableCount: true, version: 3 };
      const query2 = service.buildQuery();

      expect(query1).toBe(expectation);
      expect(query2).toBe(expectation);
    });

    it('should return a query with "$count" when "enableCount" is set with OData version 4 or higher', () => {
      const expectation = `$count=true&$top=10&$filter=(FirstName eq 'John')`;

      service.options = { top: 10, filterBy: `FirstName eq 'John'`, enableCount: true, version: 4 };
      const query1 = service.buildQuery();

      service.options = { top: 10, filterBy: `FirstName eq 'John'`, enableCount: true, version: 5 };
      const query2 = service.buildQuery();

      expect(query1).toBe(expectation);
      expect(query2).toBe(expectation);
    });
  });
});
