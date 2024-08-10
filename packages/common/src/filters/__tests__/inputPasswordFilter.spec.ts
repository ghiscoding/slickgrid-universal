import { InputPasswordFilter } from '../inputPasswordFilter';
import type { Column, FilterArguments, GridOption } from '../../interfaces/index';
import { Filters } from '../filters.index';
import type { SlickGrid } from '../../core/index';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getHeaderRowColumn: jest.fn(),
  render: jest.fn(),
} as unknown as SlickGrid;

describe('InputPasswordFilter', () => {
  let divContainer: HTMLDivElement;
  let filter: InputPasswordFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = jest.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = { id: 'passwordField', field: 'password', filterable: true, filter: { model: Filters.inputPassword } };
    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: jest.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id)
    };

    filter = new InputPasswordFilter({} as any);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should throw an error when trying to call init without any arguments', () => {
    expect(() => filter.init(null as any)).toThrowError('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
  });

  it('should have an aria-label when creating the filter', () => {
    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('input.filter-passwordField') as HTMLInputElement;

    expect(filterInputElm.ariaLabel).toBe('Password Field Search Filter');
  });

  it('should initialize the filter and expect an input of type password', () => {
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('input.filter-passwordField').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.inputType).toBe('password');
  });
});
