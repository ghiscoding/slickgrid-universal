import { type GridOption, type Locale, type PaginationService, type SlickGrid } from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslateServiceStub } from '../../../../test/translateServiceStub.js';
import { SlickPaginationComponent } from '../slick-pagination.component.js';

function removeExtraSpaces(text: string) {
  return `${text}`.replace(/\s{2,}/g, '');
}

const gridStub = {
  getOptions: vi.fn(),
  getUID: () => 'slickgrid_123456',
  registerPlugin: vi.fn(),
} as unknown as SlickGrid;

const mockLocales = {
  TEXT_ITEMS_PER_PAGE: 'items per page',
  TEXT_ITEMS: 'items',
  TEXT_OF: 'of',
  TEXT_PAGE: 'page',
} as Locale;

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
Object.defineProperty(paginationServiceStub, 'dataFrom', { get: vi.fn(() => mockFullPagination.dataFrom), set: vi.fn() });
Object.defineProperty(paginationServiceStub, 'dataTo', { get: vi.fn(() => mockFullPagination.dataTo), set: vi.fn() });
Object.defineProperty(paginationServiceStub, 'itemsPerPage', { get: vi.fn(() => mockFullPagination.pageSize), set: vi.fn() });

describe('Slick-Pagination Component', () => {
  let component: SlickPaginationComponent;
  let div: HTMLDivElement;
  let eventPubSubService: EventPubSubService;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    vi.spyOn(paginationServiceStub, 'getFullPagination').mockReturnValue(mockFullPagination);
    div = document.createElement('div');
    document.body.appendChild(div);
    eventPubSubService = new EventPubSubService();
    translateService = new TranslateServiceStub();
  });

  describe('Integration Tests', () => {
    afterEach(() => {
      // clear all the spyOn mocks to not influence next test
      vi.clearAllMocks();
    });

    it('should throw an error when "enableTranslate" is set and I18N Service is not provided', () =>
      new Promise((done: any) => {
        try {
          translateService = undefined as any;
          vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce({ ...mockGridOptions, enableTranslate: true });

          component = new SlickPaginationComponent();
          component.init(gridStub, paginationServiceStub, eventPubSubService, translateService);
          component.renderPagination(div);
        } catch (e: any) {
          expect(e.toString()).toContain(
            '[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.'
          );
          done();
        }
      }));

    it('should have defined locale and expect new text in the UI', () => {
      vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce({ ...mockGridOptions, locales: mockLocales });

      component = new SlickPaginationComponent();
      component.init(gridStub, paginationServiceStub, eventPubSubService, translateService);
      component.renderPagination(div);

      const pageInfoFromTo = document.querySelector('.page-info-from-to') as HTMLSpanElement;
      const pageInfoTotalItems = document.querySelector('.page-info-total-items') as HTMLSpanElement;

      expect(translateService.getCurrentLanguage()).toBe('en');
      expect(pageInfoFromTo.querySelector('span.item-from')!.ariaLabel).toBe('Page Item From'); // JSDOM doesn't support ariaLabel, but we can test attribute this way
      expect(pageInfoFromTo.querySelector('span.item-to')!.ariaLabel).toBe('Page Item To');
      expect(pageInfoTotalItems.querySelector('span.total-items')!.ariaLabel).toBe('Total Items');
      expect(removeExtraSpaces(pageInfoFromTo.innerHTML)).toBe(
        '<span class="item-from" aria-label="Page Item From" data-test="item-from">10</span>-<span class="item-to" aria-label="Page Item To" data-test="item-to">15</span> <span class="text-of">of</span> '
      );
      expect(removeExtraSpaces(pageInfoTotalItems.innerHTML)).toBe(
        '<span class="total-items" aria-label="Total Items" data-test="total-items">95</span> <span class="text-items">items</span> '
      );
      component.dispose();
    });
  });
});
