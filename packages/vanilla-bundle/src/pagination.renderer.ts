import { BindingService } from './services/binding.service';
import { PaginationService, SharedService, SlickGrid, ServicePagination } from '@slickgrid-universal/common';
import { EventPubSubService } from './services';

export class PaginationRenderer {
  private _observers: BindingService[] = [];
  private _paginationElement: JQuery<HTMLElement>; // TODO change this to vanilla JS
  private _pageCountElm: HTMLSpanElement | null;
  private _pageNumberInputElm: HTMLInputElement | null;
  private _firstPageBtnElm: HTMLLinkElement | null;
  private _lastPageBtnElm: HTMLLinkElement | null;
  private _nextPageBtnElm: HTMLLinkElement | null;
  private _prevPageBtnElm: HTMLLinkElement | null;
  private _liFirstPageElm: HTMLUListElement | null;
  private _liLastPageElm: HTMLUListElement | null;
  private _liPrevPageElm: HTMLUListElement | null;
  private _liNextPageElm: HTMLUListElement | null;
  private _itemsPerPageSelectElm: HTMLSelectElement | null;

  constructor(private paginationService: PaginationService, private pubSubService: EventPubSubService, private sharedService: SharedService) {

    this.pubSubService.subscribe('onPaginationChanged', (paginationChanges: ServicePagination) => {
      console.log('onPaginationChanged', paginationChanges);
      this.pageCount = paginationChanges.pageCount;
      this.pageNumber = paginationChanges.pageNumber;
      this.updatePageButtonsUsability();
    });

    // if there's any initial Pagination Presets, let's update the Pagination
    this.pubSubService.subscribe('onPaginationPresetsInitialized', (paginationPresets: ServicePagination) => {
      console.log('onPaginationPresetsInitialized', paginationPresets);
      this.pageCount = paginationPresets.pageCount;
      this.pageNumber = paginationPresets.pageNumber;
      // this.itemsPerPage = paginationPresets.pageSize;
      if (this._itemsPerPageSelectElm) {
        this._itemsPerPageSelectElm.value = `${paginationPresets.pageSize}`;
      }
      this.updatePageButtonsUsability();
    });
  }

  get availablePageSizes(): number[] {
    return this.paginationService.availablePageSizes;
  }

  get dataFrom(): number {
    return this.paginationService.dataFrom;
  }

  get dataTo(): number {
    return this.paginationService.dataTo;
  }

  get itemsPerPage(): number {
    return this.paginationService.itemsPerPage;
  }
  set itemsPerPage(count: number) {
    this.paginationService.changeItemPerPage(count);
  }

  get pageCount(): number {
    return this.paginationService.pageCount;
  }
  set pageCount(count: number) {
    if (this._pageCountElm) {
      this._pageCountElm.textContent = `${count}`;
    }
  }

  get pageNumber(): number {
    return this.paginationService.pageNumber;
  }
  set pageNumber(page: number) {
    if (this._pageNumberInputElm) {
      this._pageNumberInputElm.value = `${page}`;
    }
  }

  get grid(): SlickGrid {
    return this.sharedService.grid;
  }

  get gridUid(): string {
    return this.grid?.getUID() ?? '';
  }

  get totalItems() {
    return this.paginationService.totalItems;
  }

  dispose() {
    this._observers = [];
    this.paginationService.dispose();
    // const firstPageElm = document.querySelector<HTMLButtonElement>('.icon-seek-first');
    // firstPageElm.removeEventListener('click', (event: MouseEvent) => console.log('clicked first page', event));
  }

  renderPagination(gridParentContainerElm: HTMLElement) {
    const paginationTemplate = require('./slick-pagination.html');

    if (paginationTemplate) {
      this._paginationElement = $(paginationTemplate);
      this._paginationElement.addClass([this.gridUid, 'pager']);
      this._paginationElement.appendTo(gridParentContainerElm);
    }

    this.addBindings();
    this.updatePageButtonsUsability();
  }

  addBindings() {
    this._pageCountElm = document.querySelector<HTMLSpanElement>(`.${this.gridUid} .page-count`);
    this._firstPageBtnElm = document.querySelector<HTMLLinkElement>(`.${this.gridUid} .icon-seek-first`);
    this._lastPageBtnElm = document.querySelector<HTMLLinkElement>(`.${this.gridUid} .icon-seek-end`);
    this._nextPageBtnElm = document.querySelector<HTMLLinkElement>(`.${this.gridUid} .icon-seek-next`);
    this._prevPageBtnElm = document.querySelector<HTMLLinkElement>(`.${this.gridUid} .icon-seek-prev`);
    this._liFirstPageElm = document.querySelector<HTMLUListElement>(`.${this.gridUid} li.page-item.seek-first`);
    this._liLastPageElm = document.querySelector<HTMLUListElement>(`.${this.gridUid} li.page-item.seek-end`);
    this._liPrevPageElm = document.querySelector<HTMLUListElement>(`.${this.gridUid} li.page-item.seek-prev`);
    this._liNextPageElm = document.querySelector<HTMLUListElement>(`.${this.gridUid} li.page-item.seek-next`);
    this._pageNumberInputElm = document.querySelector<HTMLInputElement>(`.${this.gridUid} input.page-number`);
    this._itemsPerPageSelectElm = document.querySelector<HTMLSelectElement>(`.${this.gridUid} select.items-per-page`);
    if (this._firstPageBtnElm?.addEventListener) {
      this._firstPageBtnElm.addEventListener('click', this.changeToFirstPage.bind(this));
      this._firstPageBtnElm.disabled = true;
    }
    if (this._prevPageBtnElm?.addEventListener) {
      this._prevPageBtnElm.addEventListener('click', this.changeToPreviousPage.bind(this));
    }
    if (this._nextPageBtnElm?.addEventListener) {
      this._nextPageBtnElm.addEventListener('click', this.changeToNextPage.bind(this));
    }
    if (this._lastPageBtnElm?.addEventListener) {
      this._lastPageBtnElm.addEventListener('click', this.changeToLastPage.bind(this));
    }
    // let observer = this._observers.find((bind) => bind.property === variableName);
    // if (!observer) {
    //   observer = new BindingService({ variable: window[this._className], property: variableName });
    //   this._observers.push(observer);
    // }
    // const observer = new BindingService({ variable: this.paginationService, property: 'pageNumber' });
    // this._observers.push(observer);
  }

  changeToFirstPage(event: MouseEvent) {
    if (this._firstPageBtnElm && !this._firstPageBtnElm.disabled) {
      console.log('clicked first page');
      this.paginationService.goToFirstPage(event);
    }
  }

  changeToLastPage(event: any) {
    if (this._lastPageBtnElm && !this._lastPageBtnElm.disabled) {
      console.log('clicked last page');
      this.paginationService.goToLastPage(event);
    }
  }

  changeToNextPage(event: any) {
    if (this._nextPageBtnElm && !this._nextPageBtnElm.disabled) {
      console.log('clicked next page');
      this.paginationService.goToNextPage(event);
    }
  }

  changeToPreviousPage(event: any) {
    if (this._prevPageBtnElm && !this._prevPageBtnElm.disabled) {
      console.log('clicked previous page');
      this.paginationService.goToPreviousPage(event);
    }
  }

  changeToCurrentPage(event: any) {
    let pageNumber = 1;
    if (event && event.target && event.target.value) {
      pageNumber = +(event.target.value);
    }
    this.paginationService.goToPageNumber(pageNumber, event);
  }

  updatePageButtonsUsability() {
    if (this._liFirstPageElm) {
      this._liFirstPageElm.className = (this.pageNumber === 1 || this.totalItems === 0) ? 'page-item seek-first disabled' : 'page-item seek-first';
      this._firstPageBtnElm.disabled = (this.pageNumber === 1 || this.totalItems === 0);
    }
    if (this._liPrevPageElm) {
      this._liPrevPageElm.className = (this.pageNumber === 1 || this.totalItems === 0) ? 'page-item seek-prev disabled' : 'page-item seek-prev';
      this._prevPageBtnElm.disabled = (this.pageNumber === 1 || this.totalItems === 0);
    }
    if (this._liLastPageElm) {
      this._liLastPageElm.className = (this.pageNumber === this.pageCount || this.totalItems === 0) ? 'page-item seek-end disabled' : 'page-item seek-end';
      this._lastPageBtnElm.disabled = (this.pageNumber === this.pageCount || this.totalItems === 0);
    }
    if (this._liNextPageElm) {
      this._liNextPageElm.className = (this.pageNumber === this.pageCount || this.totalItems === 0) ? 'page-item seek-next disabled' : 'page-item seek-next';
      this._nextPageBtnElm.disabled = (this.pageNumber === this.pageCount || this.totalItems === 0);
    }
  }
}
