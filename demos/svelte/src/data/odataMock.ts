import Data from './customers_100.json';

const CARET_HTML_ESCAPED = '%5E';
const PERCENT_HTML_ESCAPED = '%25';

export interface OdataMockConfig {
  countEnabled: boolean;
  version: number;
  pageError: boolean;
}

export function getCustomerDataApiMock(query: string, config: OdataMockConfig): Promise<any> {
  // the mock is returning a Promise, just like a WebAPI typically does
  return new Promise((resolve) => {
    const queryParams = query.toLowerCase().split('&');
    let top: number;
    let skip = 0;
    let orderBy = '';
    let countTotalItems = 100;
    const columnFilters = {};

    if (config.pageError) {
      config.pageError = false;
      throw new Error('Server timed out trying to retrieve data for the last page');
    }

    for (const param of queryParams) {
      if (param.includes('$top=')) {
        top = +param.substring('$top='.length);
        if (top === 50000) {
          throw new Error('Server timed out retrieving 50,000 rows');
        }
      }
      if (param.includes('$skip=')) {
        skip = +param.substring('$skip='.length);
      }
      if (param.includes('$orderby=')) {
        orderBy = param.substring('$orderby='.length);
      }
      if (param.includes('$filter=')) {
        const filterBy = param.substring('$filter='.length).replace('%20', ' ');
        if (filterBy.includes('matchespattern')) {
          const regex = new RegExp(`matchespattern\\(([a-zA-Z]+),\\s'${CARET_HTML_ESCAPED}(.*?)'\\)`, 'i');
          const filterMatch = filterBy.match(regex) || [];
          const fieldName = filterMatch[1].trim();
          (columnFilters as any)[fieldName] = { type: 'matchespattern', term: '^' + filterMatch[2].trim() };
        }
        if (filterBy.includes('contains')) {
          const filterMatch = filterBy.match(/contains\(([a-zA-Z/]+),\s?'(.*?)'/);
          const fieldName = filterMatch![1].trim();
          (columnFilters as any)[fieldName] = { type: 'substring', term: filterMatch![2].trim() };
        }
        if (filterBy.includes('substringof')) {
          const filterMatch = filterBy.match(/substringof\('(.*?)',\s([a-zA-Z/]+)/);
          const fieldName = filterMatch![2].trim();
          (columnFilters as any)[fieldName] = { type: 'substring', term: filterMatch![1].trim() };
        }
        for (const operator of ['eq', 'ne', 'le', 'lt', 'gt', 'ge']) {
          if (filterBy.includes(operator)) {
            const re = new RegExp(`([a-zA-Z ]*) ${operator} '(.*?)'`);
            const filterMatch = re.exec(filterBy);
            if (Array.isArray(filterMatch)) {
              const fieldName = filterMatch[1].trim();
              (columnFilters as any)[fieldName] = { type: operator, term: filterMatch[2].trim() };
            }
          }
        }
        if (filterBy.includes('startswith') && filterBy.includes('endswith')) {
          const filterStartMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/) || [];
          const filterEndMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/) || [];
          const fieldName = filterStartMatch[1].trim();
          (columnFilters as any)[fieldName] = {
            type: 'starts+ends',
            term: [filterStartMatch[2].trim(), filterEndMatch[2].trim()],
          };
        } else if (filterBy.includes('startswith')) {
          const filterMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/);
          const fieldName = filterMatch![1].trim();
          (columnFilters as any)[fieldName] = { type: 'starts', term: filterMatch![2].trim() };
        } else if (filterBy.includes('endswith')) {
          const filterMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/);
          const fieldName = filterMatch![1].trim();
          (columnFilters as any)[fieldName] = { type: 'ends', term: filterMatch![2].trim() };
        }

        // simulate a backend error when trying to sort on the "Company" field
        if (filterBy.includes('company')) {
          throw new Error('Server could not filter using the field "Company"');
        }
      }
    }

    // simulate a backend error when trying to sort on the "Company" field
    if (orderBy.includes('company')) {
      throw new Error('Server could not sort using the field "Company"');
    }

    // read the JSON and create a fresh copy of the data that we are free to modify
    let data = Data as unknown as {
      name: string;
      gender: string;
      company: string;
      id: string;
      category: { id: string; name: string };
    }[];
    data = JSON.parse(JSON.stringify(data));

    // Sort the data
    if (orderBy?.length > 0) {
      const orderByClauses = orderBy.split(',');
      for (const orderByClause of orderByClauses) {
        const orderByParts = orderByClause.split(' ');
        const orderByField = orderByParts[0];

        let selector = (obj: any): string => obj;
        for (const orderByFieldPart of orderByField.split('/')) {
          const prevSelector = selector;
          selector = (obj: any) => {
            return prevSelector(obj)[orderByFieldPart as any];
          };
        }

        const sort = orderByParts[1] ?? 'asc';
        switch (sort.toLocaleLowerCase()) {
          case 'asc':
            data = data.sort((a, b) => selector(a).localeCompare(selector(b)));
            break;
          case 'desc':
            data = data.sort((a, b) => selector(b).localeCompare(selector(a)));
            break;
        }
      }
    }

    // Read the result field from the JSON response.
    let firstRow = skip;
    let filteredData = data;
    if (columnFilters) {
      for (const columnId in columnFilters) {
        if (columnId in columnFilters) {
          filteredData = filteredData.filter((column) => {
            const filterType = (columnFilters as any)[columnId].type;
            const searchTerm = (columnFilters as any)[columnId].term;
            let colId = columnId;
            if (columnId?.indexOf(' ') !== -1) {
              const splitIds = columnId.split(' ');
              colId = splitIds[splitIds.length - 1];
            }
            let filterTerm;
            let col = column;
            for (const part of colId.split('/')) {
              filterTerm = (col as any)[part];
              col = filterTerm;
            }

            if (filterTerm) {
              const [term1, term2] = Array.isArray(searchTerm) ? searchTerm : [searchTerm];

              switch (filterType) {
                case 'eq':
                  return filterTerm.toLowerCase() === term1;
                case 'ne':
                  return filterTerm.toLowerCase() !== term1;
                case 'le':
                  return filterTerm.toLowerCase() <= term1;
                case 'lt':
                  return filterTerm.toLowerCase() < term1;
                case 'gt':
                  return filterTerm.toLowerCase() > term1;
                case 'ge':
                  return filterTerm.toLowerCase() >= term1;
                case 'ends':
                  return filterTerm.toLowerCase().endsWith(term1);
                case 'starts':
                  return filterTerm.toLowerCase().startsWith(term1);
                case 'starts+ends':
                  return filterTerm.toLowerCase().startsWith(term1) && filterTerm.toLowerCase().endsWith(term2);
                case 'substring':
                  return filterTerm.toLowerCase().includes(term1);
                case 'matchespattern':
                  return new RegExp((term1 as string).replace(new RegExp(PERCENT_HTML_ESCAPED, 'g'), '.*'), 'i').test(filterTerm);
              }
            }
          });
        }
      }
      countTotalItems = filteredData.length;
    }

    // make sure page skip is not out of boundaries, if so reset to first page & remove skip from query
    if (firstRow > filteredData.length) {
      query = query.replace(`$skip=${firstRow}`, '');
      firstRow = 0;
    }
    const updatedData = filteredData.slice(firstRow, firstRow + top!);

    setTimeout(() => {
      const backendResult: any = { query };
      if (!config.countEnabled) {
        backendResult['totalRecordCount'] = countTotalItems;
      }

      if (config.version === 4) {
        backendResult['value'] = updatedData;
        if (config.countEnabled) {
          backendResult['@odata.count'] = countTotalItems;
        }
      } else {
        backendResult['d'] = { results: updatedData };
        if (config.countEnabled) {
          backendResult['d']['__count'] = countTotalItems;
        }
      }

      // console.log('Backend Result', backendResult);
      resolve(backendResult);
    }, 150);
  });
}
