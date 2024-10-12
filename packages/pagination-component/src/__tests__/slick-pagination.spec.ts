import { afterEach, beforeAll, beforeEach, describe, expect, it, test, vi } from 'vitest';
import { type GridOption, type PaginationService, type SlickGrid, } from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';

import { TranslateServiceStub } from '../../../../test/translateServiceStub.js';
import { SlickPaginationComponent } from '../slick-pagination.component.js';

vi.useFakeTimers();

function removeExtraSpaces(text: string) {
  return `${text}`.replace(/\r\n\s{2,}/g, '');
}

const gridStub = {
  getOptions: vi.fn(),
  getUID: () => 'slickgrid_123456',
  registerPlugin: vi.fn(),
} as unknown as SlickGrid;

const mockGridOptions = { enableTranslate: false } as GridOption;

let mockFullPagination = {
  pageCount: 19,
  pageNumber: 2,
  pageSize: 5,
  pageSizes: [5, 10, 15, 20],
  totalItems: 95,
  dataFrom: 10,
  dataTo: 15,
};

const basicPaginationServiceStub = {
  dataFrom: 10,
  dataTo: 15,
  pageNumber: 2,
  pageCount: 19,
  itemsPerPage: 5,
  pageSize: 5,
  totalItems: 95,
  availablePageSizes: [5, 10, 15, 20],
  isCursorBased: false,
  pageInfoTotalItems: vi.fn(),
  getFullPagination: vi.fn(),
  goToFirstPage: vi.fn(),
  goToLastPage: vi.fn(),
  goToNextPage: vi.fn(),
  goToPreviousPage: vi.fn(),
  goToPageNumber: vi.fn(),
  changeItemPerPage: vi.fn(),
  dispose: vi.fn(),
  init: vi.fn(),
} as unknown as PaginationService;

const paginationServiceStubWithCursor = {
  ...basicPaginationServiceStub,
  isCursorBased: true,
} as unknown as PaginationService;

[basicPaginationServiceStub, paginationServiceStubWithCursor].forEach(stub => {

  Object.defineProperty(stub, 'dataFrom', { get: vi.fn(() => mockFullPagination.dataFrom), set: vi.fn() });
  Object.defineProperty(stub, 'dataTo', { get: vi.fn(() => mockFullPagination.dataTo), set: vi.fn() });
  Object.defineProperty(stub, 'pageCount', { get: vi.fn(() => mockFullPagination.pageCount), set: vi.fn() });
  Object.defineProperty(stub, 'pageNumber', { get: vi.fn(() => mockFullPagination.pageNumber), set: vi.fn() });
  Object.defineProperty(stub, 'itemsPerPage', { get: vi.fn(() => mockFullPagination.pageSize), set: vi.fn() });
  Object.defineProperty(stub, 'totalItems', { get: vi.fn(() => mockFullPagination.totalItems), set: vi.fn() });
});

describe('Slick-Pagination Component', () => {
  let component: SlickPaginationComponent;
  let div: HTMLDivElement;
  let eventPubSubService: EventPubSubService;
  let translateService: TranslateServiceStub;

  describe("Integration Tests", () => {
    describe.each`
      description                   | paginationServiceStub
      ${"Without CursorPagination"} | ${basicPaginationServiceStub}
      ${"With CursorPagination"}    | ${paginationServiceStubWithCursor}
    `(`$description`, ({ paginationServiceStub }) => {
      // Reset mockFullPagination before each entry in the test table
      beforeAll(() => {
        mockFullPagination = {
          pageCount: 19,
          pageNumber: 2,
          pageSize: 5,
          pageSizes: [5, 10, 15, 20],
          totalItems: 95,
          dataFrom: 10,
          dataTo: 15,
        };
      });

      beforeEach(() => {
        vi.spyOn(paginationServiceStub as PaginationService, 'getFullPagination').mockReturnValue(mockFullPagination);
        vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce(mockGridOptions);
        div = document.createElement('div');
        document.body.appendChild(div);
        eventPubSubService = new EventPubSubService();
        translateService = new TranslateServiceStub();

        component = new SlickPaginationComponent(gridStub, paginationServiceStub as PaginationService, eventPubSubService, translateService);
        component.render(div);
      });

      afterEach(() => {
        // clear all the spyOn mocks to not influence next test
        vi.clearAllMocks();
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
        expect(pageInfoFromTo.querySelector('span.item-from')!.ariaLabel).toBe('Page Item From'); // JSDom doesn't support ariaLabel, but we can test attribute this way
        expect(pageInfoFromTo.querySelector('span.item-to')!.ariaLabel).toBe('Page Item To');
        expect(pageInfoTotalItems.querySelector('span.total-items')!.ariaLabel).toBe('Total Items');
        expect(removeExtraSpaces(pageInfoFromTo.innerHTML)).toBe('<span class="item-from" aria-label="Page Item From" data-test="item-from">10</span>-<span class="item-to" aria-label="Page Item To" data-test="item-to">15</span> <span class="text-of">of</span> ');
        expect(removeExtraSpaces(pageInfoTotalItems.innerHTML)).toBe('<span class="total-items" aria-label="Total Items" data-test="total-items">95</span> <span class="text-items">items</span> ');
        expect(itemsPerPage.selectedOptions[0].value).toBe('5');
      });

      it('should call changeToFirstPage() from the View and expect the pagination service to be called with correct method', () => {
        const spy = vi.spyOn(paginationServiceStub as PaginationService, 'goToFirstPage');

        const button = document.querySelector('.icon-seek-first') as HTMLAnchorElement;
        button.click();
        mockFullPagination.pageNumber = 1;
        mockFullPagination.dataFrom = 1;
        mockFullPagination.dataTo = 10;
        vi.spyOn(paginationServiceStub as PaginationService, 'dataFrom', 'get').mockReturnValue(mockFullPagination.dataFrom);
        vi.spyOn(paginationServiceStub as PaginationService, 'dataTo', 'get').mockReturnValue(mockFullPagination.dataTo);


        const itemFrom = document.querySelector('.item-from') as HTMLInputElement;
        const itemTo = document.querySelector('.item-to') as HTMLInputElement;

        expect(spy).toHaveBeenCalled();

        if ((paginationServiceStub as any).isCursorBased) {
          const span = document.querySelector('span.page-number') as HTMLSpanElement;
          expect(span.textContent).toBe('1');
        } else {
          const input = document.querySelector('input.form-control') as HTMLInputElement;
          expect(input.value).toBe('1');
        }

        expect(component.dataFrom).toBe(1);
        expect(component.dataTo).toBe(10);
        expect(component.itemsPerPage).toBe(5);
        expect(itemFrom.textContent).toBe('1');
        expect(itemTo.textContent).toBe('10');
      });

      it('should change the page number and expect the pagination service to go to that page (except for cursor based pagination)', () => {
        const spy = vi.spyOn(paginationServiceStub as PaginationService, 'goToPageNumber');

        const newPageNumber = 3;
        const input = document.querySelector('input.page-number') as HTMLInputElement;
        const span = document.querySelector('span.page-number') as HTMLInputElement;

        const mockEvent = new CustomEvent('change', { bubbles: true, detail: { target: { value: newPageNumber } } });
        if ((paginationServiceStub as any).isCursorBased) {
          expect(input).toBe(null);
          expect(span).not.toBe(null);

          span.dispatchEvent(mockEvent);
          expect(spy).not.toHaveBeenCalled();
        } else {
          expect(span).toBe(null);
          expect(input).not.toBe(null);

          input.value = `${newPageNumber}`;
          input.dispatchEvent(mockEvent);
          expect(spy).toHaveBeenCalledWith(newPageNumber);
        }
      });

      it('should call changeToNextPage() from the View and expect the pagination service to be called with correct method', () => {
        const spy = vi.spyOn(paginationServiceStub as PaginationService, 'goToNextPage');

        const button = document.querySelector('.icon-seek-next') as HTMLAnchorElement;
        button.click();

        expect(spy).toHaveBeenCalled();
      });

      it('should call changeToPreviousPage() from the View and expect the pagination service to be called with correct method', () => {
        mockFullPagination.pageNumber = 2;
        const spy = vi.spyOn(paginationServiceStub as PaginationService, 'goToPreviousPage');

        const button = document.querySelector('.icon-seek-prev') as HTMLAnchorElement;
        button.click();

        expect(spy).toHaveBeenCalled();
      });

      it('should call changeToLastPage() from the View and expect the pagination service to be called with correct method', () => {
        const spy = vi.spyOn(paginationServiceStub as PaginationService, 'goToLastPage');

        const button = document.querySelector('.icon-seek-end') as HTMLAnchorElement;
        button.click();

        expect(spy).toHaveBeenCalled();
      });

      it('should change the changeItemPerPage select dropdown and expect the pagination service call a change', () => {
        const spy = vi.spyOn(paginationServiceStub as PaginationService, 'changeItemPerPage');

        const newItemsPerPage = 10;
        const select = document.querySelector('select') as HTMLSelectElement;
        select.value = `${newItemsPerPage}`;
        const mockEvent = new CustomEvent('change', { bubbles: true, detail: { target: { value: newItemsPerPage } } });
        select.dispatchEvent(mockEvent);

        expect(spy).toHaveBeenCalledWith(newItemsPerPage);
      });

      test(`when "onPaginationRefreshed" event is triggered then expect page from/to being displayed when total items is over 0 and also expect first/prev buttons to be disabled when on page 1`, () => {
        mockFullPagination.pageNumber = 1;
        mockFullPagination.totalItems = 100;
        eventPubSubService.publish('onPaginationRefreshed', mockFullPagination);
        const pageFromToElm = document.querySelector('span.page-info-from-to') as HTMLSpanElement;

        expect(component.firstButtonClasses).toBe('page-item seek-first disabled');
        expect(component.prevButtonClasses).toBe('page-item seek-prev disabled');
        expect(component.lastButtonClasses).toBe('page-item seek-end');
        expect(component.nextButtonClasses).toBe('page-item seek-next');
        expect(pageFromToElm.style.display).toBe('');
      });

      test(`when "onPaginationRefreshed" event is triggered then expect page from/to being displayed when total items is over 0 and also expect last/next buttons to be disabled when on last page`, () => {
        mockFullPagination.pageNumber = 10;
        mockFullPagination.pageCount = 10;
        mockFullPagination.totalItems = 100;
        eventPubSubService.publish('onPaginationRefreshed', mockFullPagination);
        const pageFromToElm = document.querySelector('span.page-info-from-to') as HTMLSpanElement;

        expect(component.firstButtonClasses).toBe('page-item seek-first');
        expect(component.prevButtonClasses).toBe('page-item seek-prev');
        expect(component.lastButtonClasses).toBe('page-item seek-end disabled');
        expect(component.nextButtonClasses).toBe('page-item seek-next disabled');
        expect(pageFromToElm.style.display).toBe('');
      });

      test(`when "onPaginationRefreshed" event is triggered then expect page from/to NOT being displayed when total items is 0 and also expect all page buttons to be disabled`, () => {
        mockFullPagination.pageNumber = 0;
        mockFullPagination.totalItems = 0;
        eventPubSubService.publish('onPaginationRefreshed', mockFullPagination);
        const pageFromToElm = document.querySelector('span.page-info-from-to') as HTMLSpanElement;

        expect(component.firstButtonClasses).toBe('page-item seek-first disabled');
        expect(component.prevButtonClasses).toBe('page-item seek-prev disabled');
        expect(component.lastButtonClasses).toBe('page-item seek-end disabled');
        expect(component.nextButtonClasses).toBe('page-item seek-next disabled');
        expect(pageFromToElm.style.display).toBe('none');
      });

      test(`when "onPaginationSetCursorBased" event is triggered then expect pagination to be recreated`, () => {
        const disposeSpy = vi.spyOn(component, 'dispose');
        const renderPagSpy = vi.spyOn(component, 'render');

        mockFullPagination.pageNumber = 1;
        mockFullPagination.pageCount = 10;
        mockFullPagination.totalItems = 100;
        (paginationServiceStub as any).isCursorBased = true;
        eventPubSubService.publish('onPaginationSetCursorBased', { isCursorBased: true });
        const pageFromToElm = document.querySelector('span.page-info-from-to') as HTMLSpanElement;
        const pageNbSpan = document.querySelector('span[data-test=page-number-label]') as HTMLSpanElement;

        expect(disposeSpy).toHaveBeenCalledTimes(1);
        expect(renderPagSpy).toHaveBeenCalledTimes(1);
        expect(component.firstButtonClasses).toBe('page-item seek-first disabled');
        expect(component.prevButtonClasses).toBe('page-item seek-prev disabled');
        expect(component.lastButtonClasses).toBe('page-item seek-end');
        expect(component.nextButtonClasses).toBe('page-item seek-next');
        expect(pageFromToElm.style.display).toBe('');
        expect(pageNbSpan.textContent).toBe('1');
      });
    });
  });
});

describe('with different i18n locale', () => {
  let component: SlickPaginationComponent;
  let div: HTMLDivElement;
  let eventPubSubService: EventPubSubService;
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

  const paginationServiceStub = {
    ...basicPaginationServiceStub
  } as unknown as PaginationService;

  beforeEach(() => {
    mockGridOptions.enableTranslate = true;
    vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce(mockGridOptions);
    vi.spyOn(paginationServiceStub as PaginationService, 'getFullPagination').mockReturnValue(mockFullPagination2);
    div = document.createElement('div');
    document.body.appendChild(div);
    eventPubSubService = new EventPubSubService();
    translateService = new TranslateServiceStub();

    component = new SlickPaginationComponent(gridStub, paginationServiceStub, eventPubSubService, translateService);
    component.render(div);
  });

  it('should throw an error when enabling translate without a Translate Service', () => {
    vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce({ ...mockGridOptions, enableTranslate: true });
    expect(() => new SlickPaginationComponent(gridStub, paginationServiceStub, eventPubSubService, null as any))
      .toThrow('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
  });

  it('should create a the Slick-Pagination component in the DOM and expect different locale when changed', () => {
    translateService.use('fr');
    eventPubSubService.publish('onLanguageChange', 'fr');

    vi.advanceTimersByTime(50);

    const pageInfoFromTo = document.querySelector('.page-info-from-to') as HTMLSpanElement;
    const pageInfoTotalItems = document.querySelector('.page-info-total-items') as HTMLSpanElement;
    expect(translateService.getCurrentLanguage()).toBe('fr');
    expect(pageInfoFromTo.querySelector('span.item-from')!.ariaLabel).toBe('Page Item From'); // JSDOM doesn't support ariaLabel, but we can test attribute this way
    expect(pageInfoFromTo.querySelector('span.item-to')!.ariaLabel).toBe('Page Item To');
    expect(pageInfoTotalItems.querySelector('span.total-items')!.ariaLabel).toBe('Total Items');
    expect(removeExtraSpaces(pageInfoFromTo.innerHTML)).toBe(`<span class="item-from" aria-label="Page Item From" data-test="item-from">10</span>-<span class="item-to" aria-label="Page Item To" data-test="item-to">15</span> <span class="text-of">de</span> `);
    expect(removeExtraSpaces(pageInfoTotalItems.innerHTML)).toBe(`<span class="total-items" aria-label="Total Items" data-test="total-items">95</span> <span class="text-items">éléments</span> `);
  });
});
