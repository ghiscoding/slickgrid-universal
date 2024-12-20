import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Filters } from '../filters.index.js';
import type { Column, FilterArguments, GridOption } from '../../interfaces/index.js';
import { CollectionService } from './../../services/collection.service.js';
import { MultipleSelectFilter } from '../multipleSelectFilter.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import type { SlickGrid } from '../../core/index.js';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  getHeaderRowColumn: vi.fn(),
  render: vi.fn(),
} as unknown as SlickGrid;

describe('SelectFilter', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let filter: MultipleSelectFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column;
  let collectionService: CollectionService;

  beforeEach(() => {
    translateService = new TranslateServiceStub();
    collectionService = new CollectionService(translateService);

    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = vi.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = {
      id: 'gender',
      field: 'gender',
      filterable: true,
      filter: {
        model: Filters.multipleSelect,
        collection: [
          { value: 'male', label: 'male' },
          { value: 'female', label: 'female' },
        ],
      },
    };

    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: vi.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id),
    };

    filter = new MultipleSelectFilter(translateService, collectionService);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should be a multiple-select filter', () => {
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    filter = new MultipleSelectFilter(translateService, collectionService);
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('select.ms-filter.search-filter.filter-gender').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.isMultipleSelect).toBe(true);
    expect(filter.columnDef.filter!.emptySearchTermReturnAllValues).toBe(false);
  });
});
