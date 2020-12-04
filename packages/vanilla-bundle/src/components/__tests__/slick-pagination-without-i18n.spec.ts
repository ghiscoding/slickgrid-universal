
import { PaginationService, SharedService, SlickGrid, GridOption, Locale } from '@slickgrid-universal/common';
import { SlickPaginationComponent } from '../slick-pagination.component';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { EventPubSubService } from '../../services/eventPubSub.service';

function removeExtraSpaces(text: string) {
  return `${text}`.replace(/\s{2,}/g, '');
}

const gridStub = {
  getOptions: jest.fn(),
  getUID: () => 'slickgrid_123456',
  registerPlugin: jest.fn(),
} as unknown as SlickGrid;

const mockLocales = {
  TEXT_ITEMS_PER_PAGE: 'items per page',
  TEXT_ITEMS: 'items',
  TEXT_OF: 'of',
  TEXT_PAGE: 'page'
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
Object.defineProperty(paginationServiceStub, 'itemsPerPage', { get: jest.fn(() => mockFullPagination.pageSize), set: jest.fn() });

describe('Slick-Pagination Component', () => {
  let component: SlickPaginationComponent;
  let div: HTMLDivElement;
  let eventPubSubService: EventPubSubService;
  let sharedService: SharedService;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
    jest.spyOn(paginationServiceStub, 'getFullPagination').mockReturnValue(mockFullPagination);
    div = document.createElement('div');
    document.body.appendChild(div);
    sharedService = new SharedService();
    eventPubSubService = new EventPubSubService();
    translateService = new TranslateServiceStub();
  });

  describe('Integration Tests', () => {
    afterEach(() => {
      // clear all the spyOn mocks to not influence next test
      jest.clearAllMocks();
    });

    it('should throw an error when "enableTranslate" is set and I18N Service is not provided', (done) => {
      try {
        mockGridOptions.enableTranslate = true;
        translateService = undefined as any;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(mockGridOptions);

        component = new SlickPaginationComponent(paginationServiceStub, eventPubSubService, sharedService, translateService);
        component.renderPagination(div);
      } catch (e) {
        expect(e.toString()).toContain('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
        done();
      }
    });

    it('should have defined locale and expect new text in the UI', () => {
      mockGridOptions.locales = mockLocales;
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(mockGridOptions);

      component = new SlickPaginationComponent(paginationServiceStub, eventPubSubService, sharedService, translateService);
      component.renderPagination(div);

      const pageInfoFromTo = document.querySelector('.page-info-from-to') as HTMLSpanElement;
      const pageInfoTotalItems = document.querySelector('.page-info-total-items') as HTMLSpanElement;

      expect(translateService.getCurrentLanguage()).toBe('en');
      expect(removeExtraSpaces(pageInfoFromTo.innerHTML)).toBe('<span data-test="item-from" class="item-from">10</span>-<span data-test="item-to" class="item-to">15</span><span class="text-of">of</span>');
      expect(removeExtraSpaces(pageInfoTotalItems.innerHTML)).toBe('<span data-test="total-items" class="total-items">95</span><span class="text-items">items</span>');
      component.dispose();
    });
  });
});
