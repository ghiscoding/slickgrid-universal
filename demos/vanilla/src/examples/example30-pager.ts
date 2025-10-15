import { BindingEventService } from '@slickgrid-universal/binding';
import type {
  BasePaginationComponent,
  PaginationMetadata,
  PaginationService,
  PubSubService,
  SlickGrid,
  Subscription,
} from '@slickgrid-universal/common';
import { effect, signal } from 'alien-signals';
import './example30-pager.scss';

/**
 * bindClassList - VueJS-style class binding helper for signals
 *
 * Usage:
 *   bindClassList(element, () => ({
 *     'class-a': true,
 *     'class-b': someSignal() > 0,
 *     'class-c': isActive(),
 *   }));
 *
 * The element's class list will update reactively whenever the signal values change.
 */
function bindClassList(el: HTMLElement, classObjSignal: () => Record<string, boolean>) {
  effect(() => {
    const classObj = classObjSignal();
    el.className = Object.entries(classObj)
      .filter(([_, active]) => active)
      .map(([cls]) => cls)
      .join(' ');
  });
}

/** Custom Pagination Component, please note that you MUST `implements BasePaginationComponent` with required functions */
export class CustomPager implements BasePaginationComponent {
  // Signals for reactive state
  dataFrom = signal(0);
  dataTo = signal(0);
  totalItems = signal(0);
  pageCount = signal(0);
  pageNumber = signal(0);
  protected _bindingEventService: BindingEventService;
  protected _paginationElement!: HTMLDivElement;
  protected _subscriptions: Subscription[] = [];
  protected _gridContainerElm?: HTMLElement;
  protected grid!: SlickGrid;
  protected paginationService!: PaginationService;
  protected pubSubService!: PubSubService;

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  init(grid: SlickGrid, paginationService: PaginationService, pubSubService: PubSubService) {
    this.grid = grid;
    this.paginationService = paginationService;
    this.pubSubService = pubSubService;

    // Anytime the pagination is initialized or has changes,
    // we'll copy the data into a local object so that we can add binding to this local object
    this._subscriptions.push(
      this.pubSubService.subscribe<PaginationMetadata>(
        'onPaginationRefreshed',
        ({ dataFrom, dataTo, pageCount, pageNumber, totalItems }) => {
          this.dataFrom(dataFrom ?? 0);
          this.dataTo(dataTo ?? 0);
          this.pageCount(pageCount ?? 0);
          this.pageNumber(pageNumber ?? 0);
          this.totalItems(totalItems ?? 0);
        }
      )
    );
  }

  dispose() {
    this.pubSubService.unsubscribeAll(this._subscriptions);
    this.disposeElement();
  }

  disposeElement() {
    this._bindingEventService.unbindAll();
    this._paginationElement.remove();
  }

  renderPagination(containerElm: HTMLElement, position: 'top' | 'bottom' = 'top') {
    this._gridContainerElm = containerElm;
    const { dataFrom, dataTo, pageCount, pageNumber, totalItems } = this.paginationService.getFullPagination();

    // Initialize signals with current pagination
    this.dataFrom(dataFrom ?? 0);
    this.dataTo(dataTo ?? 0);
    this.pageCount(pageCount ?? 0);
    this.pageNumber(pageNumber ?? 0);
    this.totalItems(totalItems ?? 0);
    this._paginationElement = document.createElement('div');
    this._paginationElement.id = 'pager';
    this._paginationElement.className = `pagination-container pager ${this.grid.getUID()}`;
    this._paginationElement.style.width = '100%';
    this._paginationElement.innerHTML = `<div class="custom-pagination">
            <span class="custom-pagination-settings">
              <span class="custom-pagination-count">
                <span class="page-info-from-to">
                  <span class="item-from" aria-label="Page Item From" data-test="item-from"></span>-
                  <span class="item-to" aria-label="Page Item To" data-test="item-to"></span>
                of
                </span>
                <span class="page-info-total-items">
                  <span class="total-items" aria-label="Total Items" data-test="total-items"></span>
                  <span class="text-items"> items</span>
                </span>
              </span>
            </span>
          <div class="custom-pagination-nav">
          <nav aria-label="Page navigation">
            <ul class="custom-pagination-ul">
              <li class="page-item seek-first"><a class="page-link mdi mdi-page-first icon-seek-first font-22px" aria-label="First Page" role="button"></a></li>
              <li class="page-item seek-prev"><a class="page-link icon-seek-prev mdi mdi-chevron-down font-22px mdi-rotate-90" aria-label="Previous Page" role="button"></a></li>
            </ul>
          </nav>
          <div class="page-number">
            <span class="text-page">Page</span>
            <span class="page-number" aria-label="Page Number" data-test="page-number-label"></span>
            of
            <span class="page-count" data-test="page-count"></span>
          </div>
          <nav aria-label="Page navigation">
            <ul class="custom-pagination-ul">
              <li class="page-item seek-next"><a class="page-link icon-seek-next mdi mdi-chevron-down font-22px mdi-rotate-270" aria-label="Next Page" role="button"></a></li>
              <li class="page-item seek-end"><a class="page-link icon-seek-end mdi mdi-page-last font-22px" aria-label="Last Page" role="button"></a></li>
            </ul>
          </nav>
        </div>
      </div>`;

    if (position === 'top') {
      // we can prepend the grid if we wish
      this._paginationElement.classList.add('top');
      containerElm.prepend(this._paginationElement);
    } else {
      // or append it at the bottom
      this._paginationElement.classList.add('bottom');
      containerElm.appendChild(this._paginationElement);
    }

    // value/classes bindings via signals
    this.addSignalBindings();

    // event listeners
    this.addEventListeners(this._paginationElement);
  }

  /**
   * Bind signals to DOM elements using alien-signals effect()
   */
  addSignalBindings(): void {
    // CSS classes for buttons
    const firstBtn = this._paginationElement.querySelector('li.page-item.seek-first') as HTMLLIElement;
    const prevBtn = this._paginationElement.querySelector('li.page-item.seek-prev') as HTMLLIElement;
    const lastBtn = this._paginationElement.querySelector('li.page-item.seek-end') as HTMLLIElement;
    const nextBtn = this._paginationElement.querySelector('li.page-item.seek-next') as HTMLLIElement;

    // VueJS-style class binding for buttons
    if (firstBtn)
      bindClassList(firstBtn, () => ({
        'page-item': true,
        'seek-first': true,
        disabled: this.isLeftPaginationDisabled(),
      }));
    if (prevBtn)
      bindClassList(prevBtn, () => ({
        'page-item': true,
        'seek-prev': true,
        disabled: this.isLeftPaginationDisabled(),
      }));
    if (lastBtn)
      bindClassList(lastBtn, () => ({
        'page-item': true,
        'seek-end': true,
        disabled: this.isRightPaginationDisabled(),
      }));
    if (nextBtn)
      bindClassList(nextBtn, () => ({
        'page-item': true,
        'seek-next': true,
        disabled: this.isRightPaginationDisabled(),
      }));

    // Text content for spans
    const itemFrom = this._paginationElement.querySelector('span.item-from');
    const itemTo = this._paginationElement.querySelector('span.item-to');
    const totalItems = this._paginationElement.querySelector('span.total-items');
    const pageCount = this._paginationElement.querySelector('span.page-count');
    const pageNumber = this._paginationElement.querySelector('span.page-number');

    effect(() => {
      if (itemFrom) itemFrom.textContent = String(this.dataFrom());
    });
    effect(() => {
      if (itemTo) itemTo.textContent = String(this.dataTo());
    });
    effect(() => {
      if (totalItems) totalItems.textContent = String(this.totalItems());
    });
    effect(() => {
      if (pageCount) pageCount.textContent = String(this.pageCount());
    });
    effect(() => {
      if (pageNumber) pageNumber.textContent = String(this.pageNumber());
    });
  }

  /** Add some DOM Element event listeners */
  addEventListeners(containerElm: HTMLElement): void {
    this._bindingEventService.bind(
      containerElm.querySelector('.icon-seek-first')!,
      'click',
      this.onFirstPageClicked.bind(this) as EventListener
    );
    this._bindingEventService.bind(
      containerElm.querySelector('.icon-seek-prev')!,
      'click',
      this.onPreviousPageClicked.bind(this) as EventListener
    );
    this._bindingEventService.bind(
      containerElm.querySelector('.icon-seek-next')!,
      'click',
      this.onNextPageClicked.bind(this) as EventListener
    );
    this._bindingEventService.bind(
      containerElm.querySelector('.icon-seek-end')!,
      'click',
      this.onLastPageClicked.bind(this) as EventListener
    );
  }

  onFirstPageClicked(event: MouseEvent): void {
    if (!this.isLeftPaginationDisabled()) {
      this.paginationService.goToFirstPage(event);
    }
  }

  onLastPageClicked(event: MouseEvent): void {
    if (!this.isRightPaginationDisabled()) {
      this.paginationService.goToLastPage(event);
    }
  }

  onNextPageClicked(event: MouseEvent): void {
    if (!this.isRightPaginationDisabled()) {
      this.paginationService.goToNextPage(event);
    }
  }

  onPreviousPageClicked(event: MouseEvent): void {
    if (!this.isLeftPaginationDisabled()) {
      this.paginationService.goToPreviousPage(event);
    }
  }

  isLeftPaginationDisabled(): boolean {
    return this.pageNumber() === 1 || this.totalItems() === 0;
  }

  isRightPaginationDisabled(): boolean {
    return this.pageNumber() === this.pageCount() || this.totalItems() === 0;
  }
}
