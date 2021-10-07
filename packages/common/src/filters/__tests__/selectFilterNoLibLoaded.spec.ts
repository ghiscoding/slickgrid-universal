// import 3rd party lib multiple-select for the tests
// import 'multiple-select-modified';

import { Column, FilterArguments, GridOption, SlickGrid } from '../../interfaces/index';
import { CollectionService } from '../../services/collection.service';
import { Filters } from '../filters.index';
import { SelectFilter } from '../selectFilter';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const collectionServiceStub = {

} as CollectionService;

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getHeaderRowColumn: jest.fn(),
  render: jest.fn(),
} as unknown as SlickGrid;

describe('SelectFilter', () => {
  let divContainer: HTMLDivElement;
  let filter: SelectFilter;
  let filterArguments: FilterArguments;
  let mockColumn: Column;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    translateService = new TranslateServiceStub();

    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    jest.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = {
      id: 'gender', field: 'gender', filterable: true,
      filter: {
        model: Filters.select,
        collection: [{ value: '', label: '' }, { value: 'male', label: 'male' }, { value: 'female', label: 'female' }]
      }
    };

    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: jest.fn()
    };

    filter = new SelectFilter(translateService, collectionServiceStub);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should throw an error when multiple-select.js is not provided or imported', () => {
    expect(() => filter.init(filterArguments)).toThrowError(`multiple-select.js was not found, make sure to read the HOWTO Wiki on how to install it.`);
  });
});
