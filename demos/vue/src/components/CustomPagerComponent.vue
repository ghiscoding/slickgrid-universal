<script setup lang="ts">
import type { PaginationMetadata, PaginationService, PubSubService, SlickGrid, Subscription } from '@slickgrid-universal/common';
import { computed, ref } from 'vue';

let _grid!: SlickGrid;
let _paginationElement!: HTMLDivElement;
let _paginationService!: PaginationService;
let _pubSubService!: PubSubService;
let _subscriptions: Subscription[] = [];

const elm = ref<HTMLDivElement>();
const currentPagination = ref<PaginationMetadata>({} as PaginationMetadata);

const isLeftPaginationDisabled = computed(() => currentPagination.value.pageNumber === 1 || currentPagination.value.totalItems === 0);
const isRightPaginationDisabled = computed(
  () => currentPagination.value.pageNumber === currentPagination.value.pageCount || currentPagination.value.totalItems === 0
);

function init(grid: SlickGrid, paginationService: PaginationService, pubSubService: PubSubService) {
  _grid = grid;
  _paginationService = paginationService;
  _pubSubService = pubSubService;
  currentPagination.value = _paginationService.getFullPagination();

  // Anytime the pagination is initialized or has changes,
  // we'll copy the data into a local object so that we can add binding to this local object
  _subscriptions.push(
    _pubSubService.subscribe<PaginationMetadata>('onPaginationRefreshed', (paginationChanges) => {
      currentPagination.value.dataFrom = paginationChanges.dataFrom;
      currentPagination.value.dataTo = paginationChanges.dataTo;
      currentPagination.value.pageCount = paginationChanges.pageCount;
      currentPagination.value.pageNumber = paginationChanges.pageNumber;
      currentPagination.value.pageSize = paginationChanges.pageSize;
      currentPagination.value.pageSizes = paginationChanges.pageSizes;
      currentPagination.value.totalItems = paginationChanges.totalItems;
    })
  );
}

function dispose() {
  _pubSubService.unsubscribeAll(_subscriptions);
  disposeElement();
}

function disposeElement() {
  _paginationElement?.remove();
}

function renderPagination(containerElm: HTMLElement) {
  _paginationElement = elm.value as HTMLDivElement;
  _paginationElement.id = 'pager';
  _paginationElement.className = `pagination-container pager ${_grid.getUID()}`;
  _paginationElement.style.width = '100%';

  // or append it at the bottom
  containerElm.appendChild(_paginationElement);
}

function onFirstPageClicked(event: MouseEvent): void {
  if (!isLeftPaginationDisabled.value) {
    _paginationService.goToFirstPage(event);
  }
}

function onLastPageClicked(event: MouseEvent): void {
  if (!isRightPaginationDisabled.value) {
    _paginationService.goToLastPage(event);
  }
}

function onNextPageClicked(event: MouseEvent): void {
  if (!isRightPaginationDisabled.value) {
    _paginationService.goToNextPage(event);
  }
}

function onPreviousPageClicked(event: MouseEvent): void {
  if (!isLeftPaginationDisabled.value) {
    _paginationService.goToPreviousPage(event);
  }
}

defineExpose({
  init,
  dispose,
  renderPagination,
});
</script>
<template>
  <div ref="elm">
    <div class="custom-pagination">
      <span class="custom-pagination-settings">
        <span class="custom-pagination-count">
          <span class="page-info-from-to">
            <span class="item-from" aria-label="Page Item From" data-test="item-from"> {{ currentPagination?.dataFrom }} </span>-
            <span class="item-to" aria-label="Page Item To" data-test="item-to">
              {{ currentPagination?.dataTo }}
            </span>
            of
          </span>
          <span class="page-info-total-items">
            <span class="total-items" aria-label="Total Items" data-test="total-items">{{ currentPagination?.totalItems }}</span>
            <span class="text-items"> items</span>
          </span>
        </span>
      </span>
      <div class="custom-pagination-nav">
        <nav aria-label="Page navigation">
          <ul class="custom-pagination-ul">
            <li class="li page-item seek-first" :class="{ disabled: isLeftPaginationDisabled }">
              <a
                class="pagination-link mdi mdi-page-first icon-seek-first mdi-22px"
                aria-label="First Page"
                role="button"
                @click="onFirstPageClicked($event)"
              ></a>
            </li>
            <li class="li page-item seek-prev" :class="{ disabled: isLeftPaginationDisabled }">
              <a
                class="pagination-link icon-seek-prev mdi mdi-chevron-down mdi-22px mdi-rotate-90"
                aria-label="Previous Page"
                role="button"
                @click="onPreviousPageClicked($event)"
              ></a>
            </li>
          </ul>
        </nav>
        <div class="page-number">
          <span class="text-page">Page</span>
          <span class="page-number" aria-label="Page Number" data-test="page-number-label">{{ currentPagination?.pageNumber }}</span>
          of
          <span class="page-count" data-test="page-count">{{ currentPagination?.pageCount }}</span>
        </div>
        <nav aria-label="Page navigation">
          <ul class="custom-pagination-ul">
            <li class="li page-item seek-next" :class="{ disabled: isRightPaginationDisabled }" @click="onNextPageClicked($event)">
              <a
                class="pagination-link icon-seek-next mdi mdi-chevron-down mdi-22px mdi-rotate-270"
                aria-label="Next Page"
                role="button"
              ></a>
            </li>
            <li class="li page-item seek-end" :class="{ disabled: isRightPaginationDisabled }">
              <a
                class="pagination-link icon-seek-end mdi mdi-page-last mdi-22px"
                aria-label="Last Page"
                role="button"
                @click="onLastPageClicked($event)"
              ></a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
@use 'sass:color';

.custom-pagination {
  display: flex;
  justify-content: flex-end;
  margin: 10px;
  font-size: 13px;

  .custom-pagination-settings {
    display: inline-flex;
    align-items: center;
    margin-right: 30px;

    .item-from,
    .item-to,
    .total-items {
      margin: 0 4px;
    }
  }

  .custom-pagination-nav {
    display: flex;
    align-items: center;
    list-style-type: none;

    .page-item {
      display: flex;
      width: 26px;
      justify-content: center;
      margin: 0;
      &.disabled .pagination-link {
        color: rgb(180, 179, 179);
        background-color: rgb(180, 179, 179);
      }
    }

    .page-number {
      .page-number {
        margin: 0 4px;
        padding: 0 5px;
        display: inline-flex;
        justify-content: center;
        width: 20px;
      }
    }

    .page-count {
      margin: 0 4px;
    }

    nav {
      ul.custom-pagination-ul {
        display: flex;
        margin: 0;
        padding: 0 5px;
        color: #0d6efd;

        .pagination-link {
          color: #0d6efd;
          &:hover {
            color: color.adjust(#0d6efd, $lightness: 10%);
          }
        }
      }
    }
  }
}
</style>
