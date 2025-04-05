import { bindable, customElement, resolve } from 'aurelia';
import type { BasePaginationComponent, PaginationMetadata, PaginationService, PubSubService, SlickGrid, Subscription } from '@slickgrid-universal/common';
import './example42-pager.scss';

/** Custom Pagination Componnet, please note that you MUST `implements BasePaginationComponent` with required functions */
@customElement({
  name: 'custom-pager',
  template: `<div class="custom-pagination">
  <span class="custom-pagination-settings">
    <span class="custom-pagination-count">
      <span class="page-info-from-to">
        <span class="item-from" aria-label="Page Item From" data-test="item-from">
        $\{currentPagination?.dataFrom}
        </span>-
        <span class="item-to" aria-label="Page Item To" data-test="item-to">
        $\{currentPagination?.dataTo}
        </span>
      of
      </span>
      <span class="page-info-total-items">
        <span class="total-items" aria-label="Total Items" data-test="total-items">$\{currentPagination?.totalItems}</span>
        <span class="text-items"> items</span>
      </span>
    </span>
  </span>
<div class="custom-pagination-nav">
<nav aria-label="Page navigation">
  <ul class="custom-pagination-ul">
    <li class="li page-item seek-first" disabled.class="isLeftPaginationDisabled">
      <a class="pagination-link mdi mdi-page-first icon-seek-first mdi-22px" aria-label="First Page" role="button" click.trigger="onFirstPageClicked($event)"></a>
    </li>
    <li class="li page-item seek-prev" disabled.class="isLeftPaginationDisabled">
      <a class="pagination-link icon-seek-prev mdi mdi-chevron-down mdi-22px mdi-rotate-90" aria-label="Previous Page" role="button" click.trigger="onPreviousPageClicked($event)"></a>
    </li>
  </ul>
</nav>
<div class="page-number">
  <span class="text-page">Page</span>
  <span class="page-number" aria-label="Page Number" data-test="page-number-label">$\{currentPagination?.pageNumber}</span>
  of
  <span class="page-count" data-test="page-count">$\{currentPagination?.pageCount}</span>
</div>
<nav aria-label="Page navigation">
  <ul class="custom-pagination-ul">
    <li class="li page-item seek-next" disabled.class="isRightPaginationDisabled" click.trigger="onNextPageClicked($event)">
      <a class="pagination-link icon-seek-next mdi mdi-chevron-down mdi-22px mdi-rotate-270" aria-label="Next Page" role="button" ></a>
    </li>
    <li class="li page-item seek-end"  disabled.class="isRightPaginationDisabled">
      <a class="pagination-link icon-seek-end mdi mdi-page-last mdi-22px" aria-label="Last Page" role="button" click.trigger="onLastPageClicked($event)"></a>
    </li>
  </ul>
</nav>
</div>
</div>`
})
export class CustomPagerComponent implements BasePaginationComponent {
  protected _paginationElement!: HTMLDivElement;
  protected _subscriptions: Subscription[] = [];
  protected _grid!: SlickGrid;
  protected _paginationService!: PaginationService;
  protected _pubSubService!: PubSubService;
  @bindable() currentPagination = {} as PaginationMetadata;

  constructor(protected readonly elm: HTMLElement = resolve(HTMLElement)) { }

  get isLeftPaginationDisabled(): boolean {
    return this.currentPagination.pageNumber === 1 || this.currentPagination.totalItems === 0;
  }

  get isRightPaginationDisabled(): boolean {
    return this.currentPagination.pageNumber === this.currentPagination.pageCount || this.currentPagination.totalItems === 0;
  }

  init(grid: SlickGrid, paginationService: PaginationService, pubSubService: PubSubService) {
    this._grid = grid;
    this._paginationService = paginationService;
    this._pubSubService = pubSubService;
    this.currentPagination = this._paginationService.getFullPagination();

    // Anytime the pagination is initialized or has changes,
    // we'll copy the data into a local object so that we can add binding to this local object
    this._subscriptions.push(
      this._pubSubService.subscribe<PaginationMetadata>('onPaginationRefreshed', paginationChanges => {
        this.currentPagination.dataFrom = paginationChanges.dataFrom;
        this.currentPagination.dataTo = paginationChanges.dataTo;
        this.currentPagination.pageCount = paginationChanges.pageCount;
        this.currentPagination.pageNumber = paginationChanges.pageNumber;
        this.currentPagination.pageSize = paginationChanges.pageSize;
        this.currentPagination.pageSizes = paginationChanges.pageSizes;
        this.currentPagination.totalItems = paginationChanges.totalItems;
      })
    );
  }

  dispose() {
    this._pubSubService.unsubscribeAll(this._subscriptions);
    this.disposeElement();
  }

  disposeElement() {
    this._paginationElement?.remove();
  }

  renderPagination(containerElm: HTMLElement, position: 'top' | 'bottom' = 'top') {
    this._paginationElement = this.elm as HTMLDivElement;
    this._paginationElement.id = 'pager';
    this._paginationElement.className = `pagination-container pager ${this._grid.getUID()}`;
    this._paginationElement.style.width = '100%';

    if (position === 'top') {
      // we can prepend the grid if we wish
      this._paginationElement.classList.add('top');
      containerElm.prepend(this._paginationElement);
    } else {
      // or append it at the bottom
      this._paginationElement.classList.add('bottom');
      containerElm.appendChild(this._paginationElement);
    }
  }

  onFirstPageClicked(event: MouseEvent): void {
    if (!this.isLeftPaginationDisabled) {
      this._paginationService.goToFirstPage(event);
    }
  }

  onLastPageClicked(event: MouseEvent): void {
    if (!this.isRightPaginationDisabled) {
      this._paginationService.goToLastPage(event);
    }
  }

  onNextPageClicked(event: MouseEvent): void {
    if (!this.isRightPaginationDisabled) {
      this._paginationService.goToNextPage(event);
    }
  }

  onPreviousPageClicked(event: MouseEvent): void {
    if (!this.isLeftPaginationDisabled) {
      this._paginationService.goToPreviousPage(event);
    }
  }
}
