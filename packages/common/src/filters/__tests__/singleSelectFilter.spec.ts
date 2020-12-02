// import 3rd party lib multiple-select for the tests
import 'multiple-select-modified';

import { Filters } from '..';
import { Column, FilterArguments, GridOption, SlickGrid } from '../../interfaces/index';
import { CollectionService } from '../../services/collection.service';
import { SingleSelectFilter } from '../singleSelectFilter';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

jest.useFakeTimers();

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

describe('SelectFilter', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let filter: SingleSelectFilter;
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
    spyGetHeaderRow = jest.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = {
      id: 'gender', field: 'gender', filterable: true,
      filter: {
        model: Filters.multipleSelect,
        collection: [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }]
      }
    };

    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: jest.fn()
    };

    filter = new SingleSelectFilter(translateService, collectionService);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should be a single-select filter', () => {
    mockColumn.filter!.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    filter = new SingleSelectFilter(translateService, collectionService);
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('select.ms-filter.search-filter.filter-gender').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.isMultipleSelect).toBe(false);
  });

  it('should create the select filter with empty search term when passed an empty string as a filter argument and not expect "filled" css class either', () => {
    mockColumn.filter!.collection = [{ value: '', label: '' }, { value: 'male', label: 'male' }, { value: 'female', label: 'female' }];

    filterArguments.searchTerms = [''];
    filter.init(filterArguments);
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=radio]`);

    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    expect(filterListElm.length).toBe(3);
    expect(filterFilledElms.length).toBe(0);
  });

  it('should trigger single select change event and expect the callback to be called when we select a single search term from dropdown list', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    mockColumn.filter!.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[name=filter-gender].ms-drop ul>li input[type=radio]`);
    filterBtnElm.click();

    filterListElm[1].checked = true;
    filterListElm[1].dispatchEvent(new CustomEvent('click'));

    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'EQ', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should work with English locale when locale is changed', () => {
    translateService.use('en');
    gridOptionMock.enableTranslate = true;
    mockColumn.filter = {
      enableTranslateLabel: true,
      collection: [
        { value: 'other', labelKey: 'OTHER' },
        { value: 'male', labelKey: 'MALE' },
        { value: 'female', labelKey: 'FEMALE' }
      ],
      filterOptions: { minimumCountSelected: 1 }
    };

    filterArguments.searchTerms = ['male', 'female'];
    filter.init(filterArguments);
    jest.runAllTimers(); // fast-forward timer

    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[name=filter-gender].ms-drop ul>li span`);
    const filterOkElm = divContainer.querySelectorAll<HTMLButtonElement>(`[name=filter-gender].ms-drop .ms-ok-button`);
    const filterSelectAllElm = divContainer.querySelectorAll<HTMLSpanElement>('.filter-gender .ms-select-all label span');
    filterBtnElm.click();

    expect(filterOkElm.length).toBe(0);
    expect(filterSelectAllElm.length).toBe(0);
    expect(filterListElm.length).toBe(3);
    expect(filterListElm[0].textContent).toBe('Other');
    expect(filterListElm[1].textContent).toBe('Male');
    expect(filterListElm[2].textContent).toBe('Female');
  });

  it('should work with French locale when locale is changed', () => {
    translateService.use('fr');
    gridOptionMock.enableTranslate = true;
    mockColumn.filter = {
      enableTranslateLabel: true,
      collection: [
        { value: 'other', labelKey: 'OTHER' },
        { value: 'male', labelKey: 'MALE' },
        { value: 'female', labelKey: 'FEMALE' }
      ],
      filterOptions: { minimumCountSelected: 1 }
    };

    filterArguments.searchTerms = ['male', 'female'];
    filter.init(filterArguments);
    jest.runAllTimers(); // fast-forward timer

    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(3);
    expect(filterListElm[0].textContent).toBe('Autre');
    expect(filterListElm[1].textContent).toBe('Mâle');
    expect(filterListElm[2].textContent).toBe('Femme');
  });
});
