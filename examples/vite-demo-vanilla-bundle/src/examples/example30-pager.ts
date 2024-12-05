import { BindingEventService, BindingHelper } from '@slickgrid-universal/binding';
import type { BasePaginationComponent, PaginationService, PubSubService, PaginationMetadata, SlickGrid, Subscription } from '@slickgrid-universal/common';

import './example30-pager.scss';

/** Custom Pagination Componnet, please note that you MUST `implements BasePaginationComponent` with required functions */
export class CustomPager implements BasePaginationComponent {
  protected _bindingHelper: BindingHelper;
  protected _bindingEventService: BindingEventService;
  protected _paginationElement!: HTMLDivElement;
  protected _subscriptions: Subscription[] = [];
  protected _gridContainerElm?: HTMLElement;
  protected grid!: SlickGrid;
  protected paginationService!: PaginationService;
  protected pubSubService!: PubSubService;
  currentPagination: PaginationMetadata;
  firstButtonClasses = 'li page-item seek-first';
  prevButtonClasses = 'li page-item seek-prev';
  lastButtonClasses = 'li page-item seek-end';
  nextButtonClasses = 'li page-item seek-next';

  constructor() {
    this._bindingHelper = new BindingHelper();
    this._bindingEventService = new BindingEventService();
  }

  init(grid: SlickGrid, paginationService: PaginationService, pubSubService: PubSubService) {
    this.grid = grid;
    this.paginationService = paginationService;
    this.pubSubService = pubSubService;
    this._bindingHelper.querySelectorPrefix = `.${grid.getUID()} `;

    // Anytime the pagination is initialized or has changes,
    // we'll copy the data into a local object so that we can add binding to this local object
    this._subscriptions.push(
      this.pubSubService.subscribe<PaginationMetadata>('onPaginationRefreshed', paginationChanges => {
        this.currentPagination.dataFrom = paginationChanges.dataFrom;
        this.currentPagination.dataTo = paginationChanges.dataTo;
        this.currentPagination.pageCount = paginationChanges.pageCount;
        this.currentPagination.pageNumber = paginationChanges.pageNumber;
        this.currentPagination.pageSize = paginationChanges.pageSize;
        this.currentPagination.pageSizes = paginationChanges.pageSizes;
        this.currentPagination.totalItems = paginationChanges.totalItems;

        this.updatePageButtonsUsability();
      })
    );
  }

  dispose() {
    this.pubSubService.unsubscribeAll(this._subscriptions);
    this.disposeElement();
  }

  disposeElement() {
    this._bindingEventService.unbindAll();
    this._bindingHelper.dispose();
    this._paginationElement.remove();
  }

  renderPagination(containerElm: HTMLElement, position: 'top' | 'bottom' = 'top') {
    this._gridContainerElm = containerElm;
    this.currentPagination = this.paginationService.getFullPagination();
    this._paginationElement = document.createElement('div');
    this._paginationElement.id = 'pager';
    this._paginationElement.className = `pagination-container pager ${this.grid.getUID()}`;
    this._paginationElement.style.width = '100%';
    this._paginationElement.innerHTML =
      `<div class="custom-pagination">
            <span class="custom-pagination-settings">
              <span class="custom-pagination-count">
                <span class="page-info-from-to">
                  <span class="item-from" aria-label="Page Item From" data-test="item-from">
                  ${this.currentPagination.dataFrom}
                  </span>-
                  <span class="item-to" aria-label="Page Item To" data-test="item-to">
                  ${this.currentPagination.dataTo}
                  </span>
                of
                </span>
                <span class="page-info-total-items">
                  <span class="total-items" aria-label="Total Items" data-test="total-items">${this.currentPagination.totalItems}</span>
                  <span class="text-items"> items</span>
                </span>
              </span>
            </span>
          <div class="custom-pagination-nav">
          <nav aria-label="Page navigation">
            <ul class="custom-pagination-ul">
              <li class="${this.firstButtonClasses}">
                <a class="page-link mdi mdi-page-first icon-seek-first mdi-22px" aria-label="First Page" role="button"></a>
              </li>
              <li class="${this.prevButtonClasses}">
                <a class="page-link icon-seek-prev mdi mdi-chevron-down mdi-22px mdi-rotate-90" aria-label="Previous Page" role="button"></a>
              </li>
            </ul>
          </nav>
          <div class="page-number">
            <span class="text-page">Page</span>
            <span class="page-number" aria-label="Page Number" data-test="page-number-label">${this.currentPagination.pageNumber}</span>
            of
            <span class="page-count" data-test="page-count">${this.currentPagination.pageCount}</span>
          </div>
          <nav aria-label="Page navigation">
            <ul class="custom-pagination-ul">
              <li class="${this.nextButtonClasses}">
                <a class="page-link icon-seek-next mdi mdi-chevron-down mdi-22px mdi-rotate-270" aria-label="Next Page" role="button"></a>
              </li>
              <li class="${this.lastButtonClasses}">
                <a class="page-link icon-seek-end mdi mdi-page-last mdi-22px" aria-label="Last Page" role="button"></a>
              </li>
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

    // button usabilities (which buttons are disabled/enabled)
    this.updatePageButtonsUsability();

    // value/classes bindings
    this.addBindings();

    // event listeners
    this.addEventListeners(this._paginationElement);
  }

  /**
   * Add some DOM Element bindings, typically the framework you choose will do this (i.e. Angular/React/Vue/...)
   * but we're in plain JS here so let's use simply binding service available in Slickgrid-Universal
   */
  addBindings(): void {
    // CSS classes
    this._bindingHelper.addElementBinding(this, 'firstButtonClasses', 'li.page-item.seek-first', 'className');
    this._bindingHelper.addElementBinding(this, 'prevButtonClasses', 'li.page-item.seek-prev', 'className');
    this._bindingHelper.addElementBinding(this, 'lastButtonClasses', 'li.page-item.seek-end', 'className');
    this._bindingHelper.addElementBinding(this, 'nextButtonClasses', 'li.page-item.seek-next', 'className');

    // span texts
    this._bindingHelper.addElementBinding(this.currentPagination, 'dataFrom', 'span.item-from', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'dataTo', 'span.item-to', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'totalItems', 'span.total-items', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'pageCount', 'span.page-count', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'pageNumber', 'span.page-number', 'textContent');
  }

  /** Add some DOM Element event listeners */
  addEventListeners(containerElm: HTMLElement): void {
    this._bindingEventService.bind(containerElm.querySelector('.icon-seek-first')!, 'click', this.onFirstPageClicked.bind(this) as EventListener);
    this._bindingEventService.bind(containerElm.querySelector('.icon-seek-prev')!, 'click', this.onPreviousPageClicked.bind(this) as EventListener);
    this._bindingEventService.bind(containerElm.querySelector('.icon-seek-next')!, 'click', this.onNextPageClicked.bind(this) as EventListener);
    this._bindingEventService.bind(containerElm.querySelector('.icon-seek-end')!, 'click', this.onLastPageClicked.bind(this) as EventListener);
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
    return this.currentPagination.pageNumber === 1 || this.currentPagination.totalItems === 0;
  }

  isRightPaginationDisabled(): boolean {
    return this.currentPagination.pageNumber === this.currentPagination.pageCount || this.currentPagination.totalItems === 0;
  }

  /** button usabilities (which buttons are disabled/enabled) */
  protected updatePageButtonsUsability(): void {
    this.firstButtonClasses = this.isLeftPaginationDisabled() ? 'page-item seek-first disabled' : 'page-item seek-first';
    this.prevButtonClasses = this.isLeftPaginationDisabled() ? 'page-item seek-prev disabled' : 'page-item seek-prev';
    this.lastButtonClasses = this.isRightPaginationDisabled() ? 'page-item seek-end disabled' : 'page-item seek-end';
    this.nextButtonClasses = this.isRightPaginationDisabled() ? 'page-item seek-next disabled' : 'page-item seek-next';
  }
}