
import { PaginationService, SharedService, SlickGrid, GridOption } from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';

import { TranslateServiceStub } from '../../../../test/translateServiceStub';
import { SlickPaginationComponent } from '../slick-pagination.component';

function removeExtraSpaces(text: string) {
  return `${text}`.replace(/\r\n\s{2,}/g, '');
}

const gridStub = {
  getOptions: jest.fn(),
  getUID: () => 'slickgrid_123456',
  registerPlugin: jest.fn(),
} as unknown as SlickGrid;

const mockGridOptions = { enableTranslate: false } as GridOption;

const mockFullPagination = {
  pageCount: 19,
  pageNumber: 2,
  pageSize: 5,
  pageSizes: [5, 10, 15, 20],
  totalItems: 95,
  dataFrom: 10,
  dataTo: 15,
};

const paginationServiceStub = {
  dataFrom: 10,
  dataTo: 15,
  pageNumber: 2,
  pageCount: 19,
  itemsPerPage: 5,
  pageSize: 5,
  totalItems: 95,
  availablePageSizes: [5, 10, 15, 20],
  pageInfoTotalItems: jest.fn(),
  getFullPagination: jest.fn(),
  goToFirstPage: jest.fn(),
  goToLastPage: jest.fn(),
  goToNextPage: jest.fn(),
  goToPreviousPage: jest.fn(),
  goToPageNumber: jest.fn(),
  changeItemPerPage: jest.fn(),
  dispose: jest.fn(),
  init: jest.fn(),
} as unknown as PaginationService;
Object.defineProperty(paginationServiceStub, 'dataFrom', { get: jest.fn(() => mockFullPagination.dataFrom), set: jest.fn() });
Object.defineProperty(paginationServiceStub, 'dataTo', { get: jest.fn(() => mockFullPagination.dataTo), set: jest.fn() });
Object.defineProperty(paginationServiceStub, 'pageCount', { get: jest.fn(() => mockFullPagination.pageCount), set: jest.fn() });
Object.defineProperty(paginationServiceStub, 'pageNumber', { get: jest.fn(() => mockFullPagination.pageNumber), set: jest.fn() });
Object.defineProperty(paginationServiceStub, 'itemsPerPage', { get: jest.fn(() => mockFullPagination.pageSize), set: jest.fn() });
Object.defineProperty(paginationServiceStub, 'totalItems', { get: jest.fn(() => mockFullPagination.totalItems), set: jest.fn() });

describe('Slick-Pagination Component', () => {
  let component: SlickPaginationComponent;
  let div: HTMLDivElement;
  let eventPubSubService: EventPubSubService;
  let sharedService: SharedService;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
    jest.spyOn(paginationServiceStub, 'getFullPagination').mockReturnValue(mockFullPagination);
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(mockGridOptions);
    div = document.createElement('div');
    document.body.appendChild(div);
    sharedService = new SharedService();
    eventPubSubService = new EventPubSubService();
    translateService = new TranslateServiceStub();

    component = new SlickPaginationComponent(paginationServiceStub, eventPubSubService, sharedService, translateService);
    component.renderPagination(div);
  });

  describe('Integration Tests', () => {
    afterEach(() => {
      // clear all the spyOn mocks to not influence next test
      jest.clearAllMocks();
      component.dispose();
    });

    it('should make sure Slick-Pagination is defined', () => {
      const paginationElm = document.querySelector('div.pager.slickgrid_123456') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(paginationElm).toBeTruthy();
    });

    it('should create a the Slick-Pagination component in the DOM', () => {
      const pageInfoFromTo = document.querySelector('.page-info-from-to') as HTMLSpanElement;
      const pageInfoTotalItems = document.querySelector('.page-info-total-items') as HTMLSpanElement;
      const itemsPerPage = document.querySelector('.items-per-page') as HTMLSelectElement;

      expect(translateService.getCurrentLanguage()).toBe('en');
      expect(removeExtraSpaces(pageInfoFromTo.innerHTML)).toBe('<span class="item-from" data-test="item-from" aria-label="Page Item From">10</span>-<span class="item-to" data-test="item-to" aria-label="Page Item To">15</span> <span class="text-of">of</span> ');
      expect(removeExtraSpaces(pageInfoTotalItems.innerHTML)).toBe('<span class="total-items" data-test="total-items">95</span> <span class="text-items">items</span> ');
      expect(itemsPerPage.selectedOptions[0].value).toBe('5');
    });

    it('should call changeToFirstPage() from the View and expect the pagination service to be called with correct method', () => {
      const spy = jest.spyOn(paginationServiceStub, 'goToFirstPage');

      const button = document.querySelector('.icon-seek-first') as HTMLAnchorElement;
      button.click();
      mockFullPagination.pageNumber = 1;
      mockFullPagination.dataFrom = 1;
      mockFullPagination.dataTo = 10;
      jest.spyOn(paginationServiceStub, 'dataFrom', 'get').mockReturnValue(mockFullPagination.dataFrom);
      jest.spyOn(paginationServiceStub, 'dataTo', 'get').mockReturnValue(mockFullPagination.dataTo);

      const input = document.querySelector('input.form-control') as HTMLInputElement;
      const itemFrom = document.querySelector('.item-from') as HTMLInputElement;
      const itemTo = document.querySelector('.item-to') as HTMLInputElement;

      expect(spy).toHaveBeenCalled();
      expect(input.value).toBe('1');
      expect(component.dataFrom).toBe(1);
      expect(component.dataTo).toBe(10);
      expect(component.itemsPerPage).toBe(5);
      expect(itemFrom.textContent).toBe('1');
      expect(itemTo.textContent).toBe('10');
    });

    it('should call changeToNextPage() from the View and expect the pagination service to be called with correct method', () => {
      const spy = jest.spyOn(paginationServiceStub, 'goToNextPage');

      const button = document.querySelector('.icon-seek-next') as HTMLAnchorElement;
      button.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should call changeToPreviousPage() from the View and expect the pagination service to be called with correct method', () => {
      mockFullPagination.pageNumber = 2;
      const spy = jest.spyOn(paginationServiceStub, 'goToPreviousPage');

      const button = document.querySelector('.icon-seek-prev') as HTMLAnchorElement;
      button.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should call changeToLastPage() from the View and expect the pagination service to be called with correct method', () => {
      const spy = jest.spyOn(paginationServiceStub, 'goToLastPage');

      const button = document.querySelector('.icon-seek-end') as HTMLAnchorElement;
      button.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should change the page number and expect the pagination service to go to that page', () => {
      const spy = jest.spyOn(paginationServiceStub, 'goToPageNumber');

      const newPageNumber = 3;
      const input = document.querySelector('input.form-control') as HTMLInputElement;
      input.value = `${newPageNumber}`;
      const mockEvent = new CustomEvent('change', { bubbles: true, detail: { target: { value: newPageNumber } } });
      input.dispatchEvent(mockEvent);
      component.pageNumber = newPageNumber;

      expect(spy).toHaveBeenCalledWith(newPageNumber);
    });

    it('should change the changeItemPerPage select dropdown and expect the pagination service call a change', () => {
      const spy = jest.spyOn(paginationServiceStub, 'changeItemPerPage');

      const newItemsPerPage = 10;
      const select = document.querySelector('select') as HTMLSelectElement;
      select.value = `${newItemsPerPage}`;
      const mockEvent = new CustomEvent('change', { bubbles: true, detail: { target: { value: newItemsPerPage } } });
      select.dispatchEvent(mockEvent);

      expect(spy).toHaveBeenCalledWith(newItemsPerPage);
    });

    it(`should trigger "onPaginationRefreshed" and expect page from/to being displayed when total items is over 0 and also expect first/prev buttons to be disabled when on page 1`, () => {
      mockFullPagination.pageNumber = 1;
      mockFullPagination.totalItems = 100;
      component.pageNumber = 1;
      eventPubSubService.publish('onPaginationRefreshed', mockFullPagination);
      const pageFromToElm = document.querySelector('span.page-info-from-to') as HTMLSpanElement;

      expect(component.firstButtonClasses).toBe('page-item seek-first disabled');
      expect(component.prevButtonClasses).toBe('page-item seek-prev disabled');
      expect(component.lastButtonClasses).toBe('page-item seek-end');
      expect(component.nextButtonClasses).toBe('page-item seek-next');
      expect(pageFromToElm.style.display).toBe('');
    });

    it(`should trigger "onPaginationRefreshed" and expect page from/to being displayed when total items is over 0 and also expect last/next buttons to be disabled when on last page`, () => {
      mockFullPagination.pageNumber = 10;
      mockFullPagination.pageCount = 10;
      mockFullPagination.totalItems = 100;
      component.pageNumber = 10;
      eventPubSubService.publish('onPaginationRefreshed', mockFullPagination);
      const pageFromToElm = document.querySelector('span.page-info-from-to') as HTMLSpanElement;

      expect(component.firstButtonClasses).toBe('page-item seek-first');
      expect(component.prevButtonClasses).toBe('page-item seek-prev');
      expect(component.lastButtonClasses).toBe('page-item seek-end disabled');
      expect(component.nextButtonClasses).toBe('page-item seek-next disabled');
      expect(pageFromToElm.style.display).toBe('');
    });

    it(`should trigger "onPaginationRefreshed" and expect page from/to NOT being displayed when total items is 0 and also expect all page buttons to be disabled`, () => {
      mockFullPagination.pageNumber = 0;
      mockFullPagination.totalItems = 0;
      component.pageNumber = 0;
      eventPubSubService.publish('onPaginationRefreshed', mockFullPagination);
      const pageFromToElm = document.querySelector('span.page-info-from-to') as HTMLSpanElement;

      expect(component.firstButtonClasses).toBe('page-item seek-first disabled');
      expect(component.prevButtonClasses).toBe('page-item seek-prev disabled');
      expect(component.lastButtonClasses).toBe('page-item seek-end disabled');
      expect(component.nextButtonClasses).toBe('page-item seek-next disabled');
      expect(pageFromToElm.style.display).toBe('none');
    });
  });
});

describe('with different i18n locale', () => {
  let component: SlickPaginationComponent;
  let div: HTMLDivElement;
  let eventPubSubService: EventPubSubService;
  let sharedService: SharedService;
  let translateService: TranslateServiceStub;
  const mockFullPagination2 = {
    pageCount: 19,
    pageNumber: 2,
    pageSize: 5,
    pageSizes: [5, 10, 15, 20],
    totalItems: 95,
    dataFrom: 10,
    dataTo: 15,
  };

  beforeEach(() => {
    mockGridOptions.enableTranslate = true;
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(mockGridOptions);
    jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
    jest.spyOn(paginationServiceStub, 'getFullPagination').mockReturnValue(mockFullPagination2);
    div = document.createElement('div');
    document.body.appendChild(div);
    sharedService = new SharedService();
    eventPubSubService = new EventPubSubService();
    translateService = new TranslateServiceStub();

    component = new SlickPaginationComponent(paginationServiceStub, eventPubSubService, sharedService, translateService);
    component.renderPagination(div);
  });

  it('should throw an error when enabling translate without a Translate Service', () => {
    mockGridOptions.enableTranslate = true;
    expect(() => new SlickPaginationComponent(paginationServiceStub, eventPubSubService, sharedService, null))
      .toThrow('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
  });

  it('should create a the Slick-Pagination component in the DOM and expect different locale when changed', (done) => {
    translateService.use('fr');
    eventPubSubService.publish('onLanguageChange', 'fr');

    setTimeout(() => {
      const pageInfoFromTo = document.querySelector('.page-info-from-to') as HTMLSpanElement;
      const pageInfoTotalItems = document.querySelector('.page-info-total-items') as HTMLSpanElement;
      expect(translateService.getCurrentLanguage()).toBe('fr');
      expect(removeExtraSpaces(pageInfoFromTo.innerHTML)).toBe(`<span class="item-from" data-test="item-from" aria-label="Page Item From">10</span>-<span class="item-to" data-test="item-to" aria-label="Page Item To">15</span> <span class="text-of">de</span> `);
      expect(removeExtraSpaces(pageInfoTotalItems.innerHTML)).toBe(`<span class="total-items" data-test="total-items">95</span> <span class="text-items">éléments</span> `);
      done();
    }, 50);
  });
});
