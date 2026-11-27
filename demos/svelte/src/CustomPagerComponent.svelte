<script lang="ts">
  import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
  import type { PaginationMetadata, PaginationService, SlickGrid, SveltePaginationProps } from 'slickgrid-svelte';

  let { paginationService, eventPubSubService }: Pick<SveltePaginationProps, 'paginationService' | 'eventPubSubService'> = $props();

  let currentPagination: PaginationMetadata = $state({} as PaginationMetadata);
  let grid: SlickGrid;
  let rootElement: HTMLDivElement;
  let subscription: any;

  export function init(slickGrid: SlickGrid, service: PaginationService, pubSubService: BasePubSubService) {
    grid = slickGrid;
    paginationService = service;
    eventPubSubService = pubSubService;
    currentPagination = paginationService.getFullPagination();
    subscription = eventPubSubService.subscribe<PaginationMetadata>('onPaginationRefreshed', (pagination) => {
      currentPagination = { ...currentPagination, ...pagination };
    });
  }

  export function renderPagination(container: HTMLElement) {
    rootElement.id = 'pager';
    rootElement.className = `pagination-container pager ${grid.getUID()}`;
    rootElement.style.width = '100%';
    if (rootElement.parentElement !== container) {
      container.appendChild(rootElement);
    }
  }

  export function dispose() {
    subscription?.unsubscribe?.();
    rootElement?.remove();
  }

  function goFirst(event: MouseEvent) {
    paginationService.goToFirstPage(event);
  }
  function goLast(event: MouseEvent) {
    paginationService.goToLastPage(event);
  }
  function goNext(event: MouseEvent) {
    paginationService.goToNextPage(event);
  }
  function goPrevious(event: MouseEvent) {
    paginationService.goToPreviousPage(event);
  }

  const leftDisabled = $derived(currentPagination.pageNumber === 1 || currentPagination.totalItems === 0);
  const rightDisabled = $derived(currentPagination.pageNumber === currentPagination.pageCount || currentPagination.totalItems === 0);
</script>

<div bind:this={rootElement}>
  <div class="custom-pagination">
    <span class="custom-pagination-settings">
      <span class="custom-pagination-count">
        <span class="page-info-from-to">
          <span class="item-from" aria-label="Page Item From" data-test="item-from">{currentPagination.dataFrom}</span>-<span
            class="item-to"
            aria-label="Page Item To"
            data-test="item-to"
          >
            {currentPagination.dataTo}
          </span> of
        </span>
        <span class="page-info-total-items">
          <span class="total-items" aria-label="Total Items" data-test="total-items">{currentPagination.totalItems}</span><span
            class="text-items"
          >
            items
          </span>
        </span>
      </span>
    </span>
    <div class="custom-pagination-nav">
      <nav aria-label="Page navigation">
        <ul class="custom-pagination-ul">
          <li class={'li page-item seek-first' + (leftDisabled ? ' disabled' : '')}>
            <button
              class="pagination-link mdi mdi-page-first icon-seek-first font-22px"
              aria-label="First Page"
              type="button"
              disabled={leftDisabled}
              onclick={goFirst}
            ></button>
          </li>
          <li class={'li page-item seek-prev' + (leftDisabled ? ' disabled' : '')}>
            <button
              class="pagination-link icon-seek-prev mdi mdi-chevron-down font-22px mdi-rotate-90"
              aria-label="Previous Page"
              type="button"
              disabled={leftDisabled}
              onclick={goPrevious}
            ></button>
          </li>
        </ul>
      </nav>
      <div class="page-number">
        <span class="text-page">Page</span><span class="page-number" aria-label="Page Number" data-test="page-number-label">
          {currentPagination.pageNumber}
        </span>
        of <span class="page-count" data-test="page-count">{currentPagination.pageCount}</span>
      </div>
      <nav aria-label="Page navigation">
        <ul class="custom-pagination-ul">
          <li class={'li page-item seek-next' + (rightDisabled ? ' disabled' : '')}>
            <button
              class="pagination-link icon-seek-next mdi mdi-chevron-down font-22px mdi-rotate-270"
              aria-label="Next Page"
              type="button"
              disabled={rightDisabled}
              onclick={goNext}
            ></button>
          </li>
          <li class={'li page-item seek-end' + (rightDisabled ? ' disabled' : '')}>
            <button
              class="pagination-link icon-seek-end mdi mdi-page-last font-22px"
              aria-label="Last Page"
              type="button"
              disabled={rightDisabled}
              onclick={goLast}
            ></button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</div>

<style>
  .custom-pagination {
    display: flex;
    justify-content: flex-end;
    margin: 10px;
    font-size: 13px;
  }
  .custom-pagination-settings {
    display: inline-flex;
    align-items: center;
    margin-right: 30px;
  }
  .item-from,
  .item-to,
  .total-items {
    margin: 0 4px;
  }
  .custom-pagination-nav {
    display: flex;
    align-items: center;
    list-style-type: none;
  }
  .custom-pagination-nav .page-item {
    display: flex;
    width: 26px;
    justify-content: center;
    margin: 0;
  }
  .custom-pagination-nav .page-item.disabled .pagination-link {
    color: rgb(180, 179, 179);
    background-color: transparent;
  }
  .custom-pagination-nav .page-number .page-number {
    margin: 0 4px;
    padding: 0 5px;
    display: inline-flex;
    justify-content: center;
    width: 20px;
  }
  .page-count {
    margin: 0 4px;
  }
  .custom-pagination-nav nav .custom-pagination-ul {
    display: flex;
    margin: 0;
    padding: 0 5px;
    color: #0d6efd;
  }
  .custom-pagination-nav nav .pagination-link {
    color: #0d6efd;
    cursor: pointer;
    border: 0;
    padding: 0;
    background: transparent;
    font: inherit;
    appearance: none;
  }
</style>
